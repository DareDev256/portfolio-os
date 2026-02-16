import { loadJSON, saveJSON, el } from './dom-helpers.js';

/**
 * Pomodoro Timer — Focus session timer with work/break cycles.
 * Renders inside a Passion OS window. Persists session state in localStorage.
 */

const KEY = 'passion_pomodoro';
const PRESETS = [
    { label: '25 / 5', work: 25, brk: 5 },
    { label: '50 / 10', work: 50, brk: 10 },
    { label: '90 / 20', work: 90, brk: 20 },
];
const TWO_PI = Math.PI * 2;

function fmt(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function renderPomodoroTimer(container) {
    container.innerHTML = '';

    const state = loadJSON(KEY, {
        preset: 0,
        sessions: 0,
        totalFocusMin: 0,
    });

    let running = false;
    let phase = 'work'; // 'work' | 'break'
    let remaining = PRESETS[state.preset].work * 60;
    let total = remaining;
    let intervalId = null;

    const wrapper = el('div', 'pomo-app');

    // — Ring display —
    const ringWrap = el('div', 'pomo-ring-wrap');
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    canvas.className = 'pomo-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const timeDisplay = el('div', 'pomo-time', fmt(remaining));
    const phaseLabel = el('div', 'pomo-phase', 'FOCUS');
    ringWrap.append(canvas, timeDisplay, phaseLabel);

    // — Controls —
    const controls = el('div', 'pomo-controls');
    const startBtn = el('button', 'pomo-btn pomo-btn-start', '▶ START');
    const resetBtn = el('button', 'pomo-btn pomo-btn-reset', '↺ RESET');
    controls.append(startBtn, resetBtn);

    // — Preset selector —
    const presetRow = el('div', 'pomo-presets');
    const presetBtns = PRESETS.map((p, i) => {
        const btn = el('button', 'pomo-preset' + (i === state.preset ? ' active' : ''), p.label);
        btn.addEventListener('click', () => {
            if (running) return;
            state.preset = i;
            presetBtns.forEach((b, j) => b.classList.toggle('active', j === i));
            setPhase('work');
            save();
        });
        presetRow.appendChild(btn);
        return btn;
    });

    // — Stats —
    const stats = el('div', 'pomo-stats');
    const sessionsEl = el('span', 'pomo-stat');
    const focusEl = el('span', 'pomo-stat');

    function updateStats() {
        sessionsEl.textContent = `${state.sessions} session${state.sessions !== 1 ? 's' : ''}`;
        focusEl.textContent = `${state.totalFocusMin} min focused`;
    }
    stats.append(sessionsEl, focusEl);
    updateStats();

    wrapper.append(ringWrap, controls, presetRow, stats);
    container.appendChild(wrapper);

    const ctx = canvas.getContext('2d');

    function drawRing(progress) {
        const cx = 100, cy = 100, r = 88, lw = 5;
        ctx.clearRect(0, 0, 200, 200);

        // Track
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TWO_PI);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = lw;
        ctx.stroke();

        // Progress arc
        const color = phase === 'work' ? '#00f0ff' : '#00ff88';
        const start = -Math.PI / 2;
        const end = start + TWO_PI * progress;
        ctx.beginPath();
        ctx.arc(cx, cy, r, start, end);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function setPhase(p) {
        phase = p;
        const preset = PRESETS[state.preset];
        remaining = (p === 'work' ? preset.work : preset.brk) * 60;
        total = remaining;
        phaseLabel.textContent = p === 'work' ? 'FOCUS' : 'BREAK';
        phaseLabel.className = 'pomo-phase' + (p === 'break' ? ' pomo-phase-break' : '');
        timeDisplay.textContent = fmt(remaining);
        drawRing(1);
    }

    function tick() {
        remaining--;
        if (remaining <= 0) {
            if (phase === 'work') {
                state.sessions++;
                state.totalFocusMin += PRESETS[state.preset].work;
                updateStats();
                save();
                notify('Focus session complete! Time for a break.');
                setPhase('break');
            } else {
                notify('Break over — ready to focus?');
                setPhase('work');
                stop();
            }
            return;
        }
        timeDisplay.textContent = fmt(remaining);
        drawRing(remaining / total);
    }

    function start() {
        if (running) return;
        running = true;
        startBtn.textContent = '⏸ PAUSE';
        startBtn.classList.add('pomo-btn-pause');
        intervalId = setInterval(tick, 1000);
    }

    function stop() {
        running = false;
        startBtn.textContent = '▶ START';
        startBtn.classList.remove('pomo-btn-pause');
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
    }

    function notify(msg) {
        // Use the toast system if available
        import('./notifications.js').then(({ Notify }) => {
            Notify.success(msg, 5000);
        }).catch(() => {});
    }

    function save() { saveJSON(KEY, state); }

    startBtn.addEventListener('click', () => running ? stop() : start());
    resetBtn.addEventListener('click', () => { stop(); setPhase('work'); });

    // Initial render
    drawRing(1);

    // Cleanup on window close
    return () => {
        stop();
        save();
    };
}
