import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../js/dom-helpers.js', () => ({
    el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text) e.textContent = text;
        return e;
    },
    loadJSON: vi.fn((key, def) => def),
    saveJSON: vi.fn(),
}));

vi.mock('../js/notifications.js', () => ({
    Notify: {
        success: vi.fn(),
    },
}));

const { renderPomodoroTimer } = await import('../js/pomodoro-timer.js');
const { loadJSON, saveJSON } = await import('../js/dom-helpers.js');
const { Notify } = await import('../js/notifications.js');

function clickButtonWithText(container, text) {
    const buttons = container.querySelectorAll('button');
    for (const btn of buttons) {
        if (btn.textContent.includes(text)) {
            btn.click();
            return;
        }
    }
    throw new Error(`Button with text "${text}" not found`);
}

function getTimeDisplay(container) {
    return container.querySelector('.pomo-time').textContent;
}

function getPhaseLabel(container) {
    return container.querySelector('.pomo-phase').textContent;
}

function getStats(container) {
    const stats = container.querySelectorAll('.pomo-stat');
    return Array.from(stats).map(s => s.textContent);
}

describe('Pomodoro Timer', () => {
    let container;
    let cleanup;

    beforeEach(() => {
        document.body.innerHTML = '';
        container = document.createElement('div');
        document.body.appendChild(container);

        // Mock getContext for jsdom
        HTMLCanvasElement.prototype.getContext = () => ({
            clearRect: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            stroke: vi.fn(),
            setTransform: vi.fn()
        });

        vi.useFakeTimers();
        loadJSON.mockClear();
        saveJSON.mockClear();
        Notify.success.mockClear();

        // Setup initial default state for loadJSON
        loadJSON.mockImplementation((key, def) => ({
            preset: 0,
            sessions: 0,
            totalFocusMin: 0,
        }));

        cleanup = renderPomodoroTimer(container);
    });

    afterEach(() => {
        if (cleanup) cleanup();
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('renders initial state correctly', () => {
        expect(getTimeDisplay(container)).toBe('25:00');
        expect(getPhaseLabel(container)).toBe('FOCUS');

        const stats = getStats(container);
        expect(stats[0]).toBe('0 sessions');
        expect(stats[1]).toBe('0 min focused');
    });

    it('starts, ticks, and pauses correctly', () => {
        clickButtonWithText(container, '▶ START');

        // Wait 1 second
        vi.advanceTimersByTime(1000);
        expect(getTimeDisplay(container)).toBe('24:59');

        // Verify start button text changed to pause
        const pauseBtn = container.querySelector('.pomo-btn-pause');
        expect(pauseBtn.textContent).toBe('⏸ PAUSE');

        // Pause
        pauseBtn.click();

        // Wait 1 second, verify time didn't change
        vi.advanceTimersByTime(1000);
        expect(getTimeDisplay(container)).toBe('24:59');

        // Verify button text back to start
        const startBtn = container.querySelector('.pomo-btn-start');
        expect(startBtn.textContent).toBe('▶ START');
        expect(startBtn.classList.contains('pomo-btn-pause')).toBe(false);
    });

    it('resets correctly', () => {
        clickButtonWithText(container, '▶ START');
        vi.advanceTimersByTime(5000);
        expect(getTimeDisplay(container)).toBe('24:55');

        clickButtonWithText(container, '↺ RESET');
        expect(getTimeDisplay(container)).toBe('25:00');
        expect(getPhaseLabel(container)).toBe('FOCUS');

        // Wait to verify it's not running
        vi.advanceTimersByTime(1000);
        expect(getTimeDisplay(container)).toBe('25:00');
    });

    it('completes work phase and switches to break', async () => {
        clickButtonWithText(container, '▶ START');

        // Advance exactly 25 minutes
        vi.advanceTimersByTime(25 * 60 * 1000);

        // Wait for dynamic import of notifications to resolve
        // In vitest with fake timers, microtasks queue up. Let's use vi.runAllTicks() or wait a tick
        await vi.waitFor(() => {
            expect(Notify.success).toHaveBeenCalledWith('Focus session complete! Time for a break.', 5000);
        });

        expect(getPhaseLabel(container)).toBe('BREAK');
        expect(getTimeDisplay(container)).toBe('05:00');

        const stats = getStats(container);
        expect(stats[0]).toBe('1 session');
        expect(stats[1]).toBe('25 min focused');

        expect(saveJSON).toHaveBeenCalled();
    });

    it('completes break phase and switches to focus', async () => {
        // Complete work phase
        clickButtonWithText(container, '▶ START');
        vi.advanceTimersByTime(25 * 60 * 1000);

        await vi.waitFor(() => {
            expect(Notify.success).toHaveBeenCalledWith('Focus session complete! Time for a break.', 5000);
        });
        Notify.success.mockClear();

        // We are now in break phase
        expect(getPhaseLabel(container)).toBe('BREAK');

        // Timer does not stop when switching from work to break
        // We just need to wait another 5 minutes

        // Advance 5 minutes
        vi.advanceTimersByTime(5 * 60 * 1000);

        await vi.waitFor(() => {
            expect(Notify.success).toHaveBeenCalledWith('Break over — ready to focus?', 5000);
        });

        expect(getPhaseLabel(container)).toBe('FOCUS');
        expect(getTimeDisplay(container)).toBe('25:00');

        // Timer should stop automatically after break
        vi.advanceTimersByTime(1000);
        expect(getTimeDisplay(container)).toBe('25:00');
    });

    it('changes presets and updates time', () => {
        clickButtonWithText(container, '50 / 10');
        expect(getTimeDisplay(container)).toBe('50:00');
        expect(saveJSON).toHaveBeenCalled();

        clickButtonWithText(container, '90 / 20');
        expect(getTimeDisplay(container)).toBe('90:00');
    });

    it('does not change preset while running', () => {
        clickButtonWithText(container, '▶ START');
        clickButtonWithText(container, '50 / 10');

        // Time should still be ticking down from 25 mins
        expect(getTimeDisplay(container)).toBe('25:00');
        vi.advanceTimersByTime(1000);
        expect(getTimeDisplay(container)).toBe('24:59');
    });

    it('cleans up correctly on close', () => {
        clickButtonWithText(container, '▶ START');
        vi.advanceTimersByTime(1000);

        cleanup();
        cleanup = null; // Prevent afterEach from calling it again

        // Fast forward, time shouldn't change
        const timeAtCleanup = getTimeDisplay(container);
        vi.advanceTimersByTime(1000);
        expect(getTimeDisplay(container)).toBe(timeAtCleanup);

        expect(saveJSON).toHaveBeenCalled();
    });
});
