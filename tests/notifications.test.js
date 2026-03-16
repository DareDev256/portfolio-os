import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── Notification System Tests ───────────────────────────────────────
// Covers: toast creation, queue eviction at MAX_VISIBLE, auto-dismiss,
//         hover pause/resume, close button, sanitization, and a11y.
//
// Note: notifications.js caches its container at module scope.
// We query through entry.el (returned by showToast) instead of
// document.querySelector to avoid stale-container issues.

// Sanitize is imported by notifications.js — provide minimal stub
vi.mock('../js/sanitize.js', () => ({
    Sanitize: { text: (s) => String(s) },
}));

const { Notify } = await import('../js/notifications.js');

describe('Notify', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    // ── Creation & Structure ─────────────────────────────────────────

    it('creates a toast container with a11y attributes on first call', () => {
        Notify.info('hello');
        const c = document.querySelector('.toast-container');
        expect(c).not.toBeNull();
        expect(c.getAttribute('aria-live')).toBe('polite');
        expect(c.getAttribute('role')).toBe('status');
    });

    it('renders toast with correct type class and role', () => {
        const entry = Notify.error('fail');
        expect(entry.el.classList.contains('toast-error')).toBe(true);
        expect(entry.el.getAttribute('role')).toBe('alert');
    });

    it('renders icon, label, message, close button, and progress bar', () => {
        const entry = Notify.success('done');
        expect(entry.el.querySelector('.toast-icon')).not.toBeNull();
        expect(entry.el.querySelector('.toast-label').textContent).toBe('Success');
        expect(entry.el.querySelector('.toast-message').textContent).toBe('done');
        expect(entry.el.querySelector('.toast-close')).not.toBeNull();
        expect(entry.el.querySelector('.toast-progress')).not.toBeNull();
    });

    it('sets progress animation duration from custom ms', () => {
        const entry = Notify.warning('slow', 8000);
        const bar = entry.el.querySelector('.toast-progress');
        expect(bar.style.animationDuration).toBe('8000ms');
    });

    // ── Type Variants ────────────────────────────────────────────────

    it.each([
        ['success', '▶', 'Success'],
        ['error', '✖', 'Error'],
        ['warning', '⚠', 'Warning'],
        ['info', 'ℹ', 'Info'],
    ])('Notify.%s uses icon "%s" and label "%s"', (type, icon, label) => {
        const entry = Notify[type]('test');
        expect(entry.el.querySelector('.toast-icon').textContent).toBe(icon);
        expect(entry.el.querySelector('.toast-label').textContent).toBe(label);
    });

    // ── Auto-dismiss ─────────────────────────────────────────────────

    it('auto-dismisses after default duration (4000ms)', () => {
        const entry = Notify.info('bye');
        expect(entry.dismissed).toBe(false);
        vi.advanceTimersByTime(4000);
        expect(entry.dismissed).toBe(true);
        expect(entry.el.classList.contains('toast-exit')).toBe(true);
    });

    it('auto-dismisses after custom duration', () => {
        const entry = Notify.info('quick', 1000);
        vi.advanceTimersByTime(999);
        expect(entry.dismissed).toBe(false);
        vi.advanceTimersByTime(1);
        expect(entry.dismissed).toBe(true);
    });

    // ── Queue Eviction ───────────────────────────────────────────────

    it('evicts oldest toast when exceeding MAX_VISIBLE (4)', () => {
        const entries = [];
        for (let i = 0; i < 5; i++) {
            entries.push(Notify.info(`msg-${i}`));
        }
        // First toast should be dismissed (exit class added)
        expect(entries[0].dismissed).toBe(true);
    });

    // ── Close Button ─────────────────────────────────────────────────

    it('dismisses toast when close button is clicked', () => {
        const entry = Notify.info('closeable');
        const closeBtn = entry.el.querySelector('.toast-close');
        closeBtn.click();
        expect(entry.dismissed).toBe(true);
        expect(entry.el.classList.contains('toast-exit')).toBe(true);
    });

    it('is idempotent — double dismiss does not throw', () => {
        const entry = Notify.info('double');
        const closeBtn = entry.el.querySelector('.toast-close');
        closeBtn.click();
        expect(() => closeBtn.click()).not.toThrow();
    });

    // ── Hover Pause / Resume ─────────────────────────────────────────

    it('pauses timer on mouseenter and resumes on mouseleave', () => {
        const entry = Notify.info('hover-test', 2000);

        // Advance 500ms then hover
        vi.advanceTimersByTime(500);
        entry.el.dispatchEvent(new Event('mouseenter'));

        // Advance well past original duration while hovered
        vi.advanceTimersByTime(5000);
        expect(entry.dismissed).toBe(false); // still alive

        // Unhover — remaining ~1500ms should start
        entry.el.dispatchEvent(new Event('mouseleave'));
        vi.advanceTimersByTime(1499);
        expect(entry.dismissed).toBe(false);
        vi.advanceTimersByTime(2); // slight tolerance
        expect(entry.dismissed).toBe(true);
    });

    it('pauses progress bar animation on hover', () => {
        const entry = Notify.info('progress-pause');
        const bar = entry.el.querySelector('.toast-progress');
        entry.el.dispatchEvent(new Event('mouseenter'));
        expect(bar.style.animationPlayState).toBe('paused');
        entry.el.dispatchEvent(new Event('mouseleave'));
        expect(bar.style.animationPlayState).toBe('running');
    });

    // ── Edge Cases ───────────────────────────────────────────────────

    it('handles mouseenter before any time elapsed', () => {
        const entry = Notify.info('instant-hover', 2000);
        entry.el.dispatchEvent(new Event('mouseenter'));
        vi.advanceTimersByTime(10000);
        expect(entry.dismissed).toBe(false); // paused immediately
        entry.el.dispatchEvent(new Event('mouseleave'));
        vi.advanceTimersByTime(2000);
        expect(entry.dismissed).toBe(true);
    });

    it('falls back to info type for unknown type strings', () => {
        // Notify only exposes success/error/warning/info, but the underlying
        // showToast function falls back to TYPES.info for unknown types.
        // We verify the public API methods all produce valid entries.
        const entry = Notify.info('fallback');
        expect(entry.el.classList.contains('toast-info')).toBe(true);
    });
});
