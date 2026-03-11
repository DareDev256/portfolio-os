/**
 * Ambient System Telemetry
 * Simulates live OS metrics in the top bar — CPU, RAM, uptime, visit count.
 * Uses weighted random walks for organic-feeling fluctuations.
 */
import { Notify } from './notifications.js';

const SESSION_START = Date.now();
const VISITS_KEY = 'passion_os_visits';
const TICK_MS = 2000;

let cpu = 12 + Math.random() * 8; // start 12–20%
let ram = 1.2 + Math.random() * 0.4; // start 1.2–1.6 GB
let cpuEl = null;
let ramEl = null;
let uptimeEl = null;
let tickTimer = null;

/* ── CPU simulation ────────────────────────────────────────────────
 * Weighted random walk: small drift most of the time, occasional
 * spikes (simulating "process" load), gravitates toward baseline. */
function nextCpu() {
    const baseline = 14;
    const drift = (Math.random() - 0.5) * 6;
    const gravity = (baseline - cpu) * 0.08;
    const spike = Math.random() < 0.06 ? (15 + Math.random() * 25) : 0;
    cpu = Math.max(3, Math.min(97, cpu + drift + gravity + spike));
    if (spike > 0) {
        // Spike decays over next few ticks via gravity
        setTimeout(() => { cpu = Math.max(cpu - spike * 0.6, baseline); }, TICK_MS * 2);
    }
    return Math.round(cpu);
}

/* ── RAM simulation ────────────────────────────────────────────────
 * Grows slightly over session time (simulating memory allocation),
 * with small random fluctuations from GC-like events.              */
function nextRam() {
    const sessionMinutes = (Date.now() - SESSION_START) / 60000;
    const growth = Math.min(sessionMinutes * 0.015, 0.8); // slow growth, caps at +0.8 GB
    const jitter = (Math.random() - 0.45) * 0.08; // slight upward bias
    ram = Math.max(0.8, Math.min(3.2, ram + jitter));
    return (ram + growth).toFixed(1);
}

/* ── Uptime formatting ────────────────────────────────────────── */
function formatUptime() {
    const elapsed = Math.floor((Date.now() - SESSION_START) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
    if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
    return `${s}s`;
}

/* ── DOM injection ─────────────────────────────────────────────── */
function injectElements() {
    const topBarRight = document.querySelector('.top-bar-right');
    if (!topBarRight) return false;

    // Find and replace the static CPU display
    const statusItems = topBarRight.querySelectorAll('.status-item');
    for (const item of statusItems) {
        if (item.textContent.includes('CPU')) {
            cpuEl = item;
            break;
        }
    }

    // Insert RAM after CPU
    if (cpuEl) {
        ramEl = document.createElement('span');
        ramEl.className = 'status-item';
        cpuEl.after(ramEl);
    }

    // Insert uptime before the ONLINE indicator
    const onlineEl = topBarRight.querySelector('.text-green');
    if (onlineEl) {
        uptimeEl = document.createElement('span');
        uptimeEl.className = 'status-item status-uptime';
        onlineEl.after(uptimeEl);
    }

    return !!(cpuEl || ramEl || uptimeEl);
}

/* ── Tick: update all displays ──────────────────────────────────── */
function tick() {
    if (cpuEl) {
        const val = nextCpu();
        const icon = val > 60 ? '▲' : val > 30 ? '◆' : '▽';
        cpuEl.textContent = `${icon} ${val}% CPU`;
        // Color shift: calm cyan → warning amber → critical red
        if (val > 70) cpuEl.style.color = 'rgba(255, 100, 60, 0.8)';
        else if (val > 40) cpuEl.style.color = 'rgba(255, 170, 0, 0.7)';
        else cpuEl.style.color = '';
    }
    if (ramEl) {
        ramEl.textContent = `◈ ${nextRam()} GB`;
    }
    if (uptimeEl) {
        uptimeEl.textContent = `⏱ ${formatUptime()}`;
    }
}

/* ── Visit tracking ────────────────────────────────────────────── */
function trackVisit() {
    let visits = 1;
    try {
        visits = parseInt(localStorage.getItem(VISITS_KEY) || '0', 10) + 1;
        localStorage.setItem(VISITS_KEY, String(visits));
    } catch { /* private browsing */ }
    return visits;
}

/* ── Public API ─────────────────────────────────────────────────── */
export const AmbientSystem = {
    init() {
        if (!injectElements()) return;
        tick(); // immediate first render
        tickTimer = setInterval(tick, TICK_MS);

        // Welcome toast with visit count (delayed so it doesn't compete with boot)
        const visits = trackVisit();
        setTimeout(() => {
            if (visits === 1) {
                Notify.info('Welcome to Passion OS. Press Cmd+K to explore.');
            } else {
                Notify.info(`Session #${visits}. Welcome back, operator.`);
            }
        }, 3000);

        // Periodic ambient tips
        this._tipTimer = setTimeout(() => this._showTip(), 45000);
    },

    _tips: [
        'Press ? to view all keyboard shortcuts.',
        'Try the DEV_TERMINAL for an interactive shell.',
        'Drag windows by their title bar. Double-click to maximize.',
        'Right-click the desktop for context actions.',
        'Cmd+K opens the Command Palette.',
    ],
    _tipIndex: 0,

    _showTip() {
        if (document.hidden) {
            // Retry when tab becomes visible
            this._tipTimer = setTimeout(() => this._showTip(), 30000);
            return;
        }
        Notify.info(`TIP: ${this._tips[this._tipIndex % this._tips.length]}`);
        this._tipIndex++;
        // Next tip in 2-4 minutes
        const delay = 120000 + Math.random() * 120000;
        this._tipTimer = setTimeout(() => this._showTip(), delay);
    },

    destroy() {
        if (tickTimer) clearInterval(tickTimer);
        if (this._tipTimer) clearTimeout(this._tipTimer);
    },
};
