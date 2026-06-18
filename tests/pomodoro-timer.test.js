import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderPomodoroTimer } from '../js/pomodoro-timer.js';

// Mock canvas context
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
}));

describe('Pomodoro Timer', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        vi.useFakeTimers();
        // Clear local storage manually to avoid state bleeding between tests
        localStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        container.innerHTML = '';
        localStorage.clear();
    });

    it('renders initial state correctly', () => {
        renderPomodoroTimer(container);

        expect(container.querySelector('.pomo-app')).not.toBeNull();
        expect(container.querySelector('.pomo-canvas')).not.toBeNull();
        expect(container.querySelector('.pomo-time').textContent).toBe('25:00');
        expect(container.querySelector('.pomo-phase').textContent).toBe('FOCUS');

        // Controls
        const startBtn = container.querySelector('.pomo-btn-start');
        expect(startBtn.textContent).toContain('START');

        // Presets
        const presets = container.querySelectorAll('.pomo-preset');
        expect(presets.length).toBe(3);
        expect(presets[0].classList.contains('active')).toBe(true);
        expect(presets[0].textContent).toContain('25 / 5');

        // Stats
        const stats = container.querySelectorAll('.pomo-stat');
        expect(stats[0].textContent).toContain('0 sessions');
        expect(stats[1].textContent).toContain('0 min focused');
    });

    it('starts and pauses the timer', () => {
        renderPomodoroTimer(container);

        const startBtn = container.querySelector('.pomo-btn-start');
        const timeDisplay = container.querySelector('.pomo-time');

        // Start
        startBtn.click();
        expect(startBtn.textContent).toContain('PAUSE');
        expect(startBtn.classList.contains('pomo-btn-pause')).toBe(true);

        vi.advanceTimersByTime(1000);
        expect(timeDisplay.textContent).toBe('24:59');

        // Pause
        startBtn.click();
        expect(startBtn.textContent).toContain('START');
        expect(startBtn.classList.contains('pomo-btn-pause')).toBe(false);

        vi.advanceTimersByTime(1000);
        expect(timeDisplay.textContent).toBe('24:59'); // Should not change
    });

    it('transitions to break when focus time ends', () => {
        renderPomodoroTimer(container);

        const startBtn = container.querySelector('.pomo-btn-start');
        const phaseLabel = container.querySelector('.pomo-phase');
        const timeDisplay = container.querySelector('.pomo-time');

        startBtn.click();

        // Fast forward 25 minutes
        vi.advanceTimersByTime(25 * 60 * 1000);

        expect(phaseLabel.textContent).toBe('BREAK');
        expect(phaseLabel.classList.contains('pomo-phase-break')).toBe(true);
        expect(timeDisplay.textContent).toBe('05:00'); // Assuming first preset break is 5m

        // Check stats updated
        const stats = container.querySelectorAll('.pomo-stat');
        expect(stats[0].textContent).toContain('1 session'); // Changed "sessions" to "session" singular
        expect(stats[1].textContent).toContain('25 min focused');
    });

    it('transitions to focus when break time ends and stops automatically', () => {
        renderPomodoroTimer(container);

        const startBtn = container.querySelector('.pomo-btn-start');
        const phaseLabel = container.querySelector('.pomo-phase');
        const timeDisplay = container.querySelector('.pomo-time');

        startBtn.click();

        // Fast forward 25 minutes to end of focus
        vi.advanceTimersByTime(25 * 60 * 1000);
        expect(phaseLabel.textContent).toBe('BREAK');

        // Now advance 5 minutes for break
        vi.advanceTimersByTime(5 * 60 * 1000);

        expect(phaseLabel.textContent).toBe('FOCUS');
        expect(timeDisplay.textContent).toBe('25:00');
        expect(startBtn.textContent).toContain('START'); // Should stop
    });

    it('switches presets correctly', () => {
        renderPomodoroTimer(container);

        const presets = container.querySelectorAll('.pomo-preset');
        const timeDisplay = container.querySelector('.pomo-time');

        // Click 50 / 10 preset (2nd preset)
        presets[1].click();

        expect(presets[0].classList.contains('active')).toBe(false);
        expect(presets[1].classList.contains('active')).toBe(true);
        expect(timeDisplay.textContent).toBe('50:00');

        // Verify state is saved
        const state = JSON.parse(localStorage.getItem('passion_pomodoro'));
        expect(state.preset).toBe(1);
    });

    it('prevents switching presets while running', () => {
        renderPomodoroTimer(container);

        const startBtn = container.querySelector('.pomo-btn-start');
        const presets = container.querySelectorAll('.pomo-preset');
        const timeDisplay = container.querySelector('.pomo-time');

        startBtn.click(); // Start
        vi.advanceTimersByTime(1000); // 24:59

        // Try clicking 50 / 10 preset
        presets[1].click();

        expect(presets[0].classList.contains('active')).toBe(true);
        expect(presets[1].classList.contains('active')).toBe(false);
        expect(timeDisplay.textContent).toBe('24:59'); // Should not change
    });

    it('resets timer when reset button clicked', () => {
        renderPomodoroTimer(container);

        const startBtn = container.querySelector('.pomo-btn-start');
        const resetBtn = container.querySelector('.pomo-btn-reset');
        const timeDisplay = container.querySelector('.pomo-time');
        const phaseLabel = container.querySelector('.pomo-phase');

        startBtn.click();
        vi.advanceTimersByTime(10000); // advance 10s
        expect(timeDisplay.textContent).toBe('24:50');

        resetBtn.click();

        expect(timeDisplay.textContent).toBe('25:00');
        expect(startBtn.textContent).toContain('START');
        expect(phaseLabel.textContent).toBe('FOCUS');

        // Check reset from break
        startBtn.click();
        vi.advanceTimersByTime(25 * 60 * 1000); // End focus, enter break
        expect(phaseLabel.textContent).toBe('BREAK');

        resetBtn.click();
        expect(phaseLabel.textContent).toBe('FOCUS');
        expect(timeDisplay.textContent).toBe('25:00');
    });

    it('loads saved state from localStorage', () => {
        // Pre-populate localStorage
        localStorage.setItem(
            'passion_pomodoro',
            JSON.stringify({
                preset: 2, // 90 / 20
                sessions: 3,
                totalFocusMin: 150,
            })
        );

        renderPomodoroTimer(container);

        const presets = container.querySelectorAll('.pomo-preset');
        const timeDisplay = container.querySelector('.pomo-time');
        const stats = container.querySelectorAll('.pomo-stat');

        expect(presets[2].classList.contains('active')).toBe(true);
        expect(timeDisplay.textContent).toBe('90:00');
        expect(stats[0].textContent).toContain('3 sessions');
        expect(stats[1].textContent).toContain('150 min focused');
    });

    it('cleans up resources on returned function call', () => {
        const cleanup = renderPomodoroTimer(container);
        const startBtn = container.querySelector('.pomo-btn-start');
        const timeDisplay = container.querySelector('.pomo-time');

        startBtn.click(); // Start
        vi.advanceTimersByTime(1000); // 24:59

        // Change state to verify save on cleanup
        container.querySelectorAll('.pomo-preset')[1].click(); // this is ignored because it's running

        cleanup(); // Call cleanup

        vi.advanceTimersByTime(1000); // Time shouldn't advance anymore
        expect(timeDisplay.textContent).toBe('24:59');

        // Verify state saved
        const state = JSON.parse(localStorage.getItem('passion_pomodoro'));
        expect(state).toBeTruthy();
    });
});
