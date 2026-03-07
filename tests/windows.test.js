import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WindowManager } from '../js/windows.js';
import { State } from '../js/state.js';

/**
 * WindowManager test suite
 *
 * Tests the full window lifecycle: create, focus, minimize, restore,
 * maximize, close, navigation stack, taskbar sync, and ESC key priority.
 * State is used directly (not mocked) so we test the real integration seam.
 */

// ── Helpers ─────────────────────────────────────────────────────────

function setupDesktopDOM() {
    document.body.innerHTML = `
        <div id="desktop" class="desktop">
            <div id="windowsContainer" class="windows-container" role="region" aria-live="polite"></div>
            <div class="taskbar dock-style" role="navigation">
                <div id="taskbarWindows" class="taskbar-windows" role="list"></div>
            </div>
            <div id="screenReaderAnnouncer" aria-live="assertive"></div>
        </div>
    `;
}

function createTestWindow(overrides = {}) {
    return WindowManager.create({
        id: 'test-win',
        title: 'Test Window',
        icon: '<span>T</span>',
        content: '<p>Test content</p>',
        width: 400,
        height: 300,
        ...overrides,
    });
}

// ── Setup / Teardown ────────────────────────────────────────────────

beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    State.windows.clear();
    State.currentZIndex = State.WINDOW_Z_FLOOR;
    State.maxZIndex = State.WINDOW_Z_FLOOR;
    State.windowStates = {};
    setupDesktopDOM();
    WindowManager.container = document.getElementById('windowsContainer');
    WindowManager.activeWindow = null;
    WindowManager.navigationStack.clear();
});

afterEach(() => {
    vi.useRealTimers();
});

// ── 1. Window Creation ──────────────────────────────────────────────

describe('WindowManager.create()', () => {
    it('creates a window element in the container', () => {
        createTestWindow();
        const el = document.getElementById('window-test-win');
        expect(el).not.toBeNull();
        expect(el.parentElement.id).toBe('windowsContainer');
    });

    it('sets ARIA role and label for accessibility', () => {
        createTestWindow();
        const el = document.getElementById('window-test-win');
        expect(el.getAttribute('role')).toBe('dialog');
        expect(el.getAttribute('aria-label')).toBe('Test Window');
    });

    it('registers window in State', () => {
        createTestWindow();
        expect(State.getWindow('test-win')).toBeDefined();
        expect(State.getWindow('test-win').title).toBe('Test Window');
    });

    it('adds taskbar button with correct label', () => {
        createTestWindow();
        const btn = document.getElementById('taskbar-test-win');
        expect(btn).not.toBeNull();
        expect(btn.textContent).toContain('Test Window');
        expect(btn.getAttribute('aria-label')).toBe('Switch to Test Window');
    });

    it('applies transition class from options', () => {
        createTestWindow({ transitionType: 'slide' });
        const el = document.getElementById('window-test-win');
        expect(el.classList.contains('transition-slide')).toBe(true);
    });

    it('announces window opening to screen readers', () => {
        createTestWindow();
        const announcer = document.getElementById('screenReaderAnnouncer');
        expect(announcer.textContent).toBe('Opened window: Test Window');
    });

    it('clamps window position within viewport bounds', () => {
        // Window positioned way off-screen should be clamped
        Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });
        createTestWindow({ x: 9999, y: 9999 });
        const win = State.getWindow('test-win');
        expect(win.x).toBeLessThanOrEqual(800);
        expect(win.y).toBeLessThanOrEqual(600);
    });

    it('applies saved maximized state on creation', () => {
        State.windowStates = { 'max-win': { x: 50, y: 50, width: 400, height: 300, maximized: true } };
        createTestWindow({ id: 'max-win' });
        const el = document.getElementById('window-max-win');
        expect(el.classList.contains('maximized')).toBe(true);
    });

    it('creates HUD bracket elements for visual design', () => {
        createTestWindow();
        const el = document.getElementById('window-test-win');
        expect(el.querySelector('.hud-bracket-tr')).not.toBeNull();
        expect(el.querySelector('.hud-bracket-bl')).not.toBeNull();
    });

    it('creates resize handle', () => {
        createTestWindow();
        const el = document.getElementById('window-test-win');
        const handle = el.querySelector('.window-resize');
        expect(handle).not.toBeNull();
        expect(handle.getAttribute('aria-label')).toBe('Resize window');
    });
});

// ── 2. Duplicate Window Prevention ──────────────────────────────────

describe('WindowManager duplicate prevention', () => {
    it('focuses existing window instead of creating duplicate', () => {
        createTestWindow();
        const firstEl = document.getElementById('window-test-win');
        // Try to create again with same id
        createTestWindow();
        // Should still be the same element, not a second one
        const allWindows = document.querySelectorAll('#window-test-win');
        expect(allWindows.length).toBe(1);
        expect(document.getElementById('window-test-win')).toBe(firstEl);
    });

    it('restores minimized window when duplicate creation attempted', () => {
        createTestWindow();
        WindowManager.minimize('test-win');
        expect(State.getWindow('test-win').minimized).toBe(true);

        // Attempt to create again — should restore, not duplicate
        createTestWindow();
        expect(State.getWindow('test-win').minimized).toBe(false);
    });
});

// ── 3. Focus Management ─────────────────────────────────────────────

describe('WindowManager.focus()', () => {
    it('sets the active class on focused window', () => {
        createTestWindow({ id: 'win-a', title: 'A' });
        createTestWindow({ id: 'win-b', title: 'B' });
        WindowManager.focus('win-a');
        const elA = document.getElementById('window-win-a');
        const elB = document.getElementById('window-win-b');
        expect(elA.classList.contains('active')).toBe(true);
        expect(elB.classList.contains('active')).toBe(false);
    });

    it('assigns incrementing z-index to focused window', () => {
        createTestWindow({ id: 'win-a', title: 'A' });
        createTestWindow({ id: 'win-b', title: 'B' });
        const zBefore = parseInt(document.getElementById('window-win-a').style.zIndex, 10);
        WindowManager.focus('win-a');
        const zAfter = parseInt(document.getElementById('window-win-a').style.zIndex, 10);
        expect(zAfter).toBeGreaterThan(zBefore);
    });

    it('updates activeWindow reference', () => {
        createTestWindow({ id: 'win-a', title: 'A' });
        createTestWindow({ id: 'win-b', title: 'B' });
        WindowManager.focus('win-a');
        expect(WindowManager.activeWindow.id).toBe('win-a');
    });

    it('does nothing for non-existent window', () => {
        createTestWindow();
        WindowManager.focus('does-not-exist');
        // activeWindow should remain from createTestWindow
        expect(WindowManager.activeWindow.id).toBe('test-win');
    });

    it('does nothing for minimized window', () => {
        createTestWindow({ id: 'win-a', title: 'A' });
        createTestWindow({ id: 'win-b', title: 'B' });
        WindowManager.minimize('win-a');
        WindowManager.focus('win-b');
        WindowManager.focus('win-a'); // Should be ignored — minimized
        expect(WindowManager.activeWindow.id).toBe('win-b');
    });
});

// ── 4. Minimize / Restore ───────────────────────────────────────────

describe('WindowManager minimize/restore', () => {
    it('minimize adds minimized class and state flag', () => {
        createTestWindow();
        WindowManager.minimize('test-win');
        const win = State.getWindow('test-win');
        expect(win.minimized).toBe(true);
        expect(win.element.classList.contains('minimized')).toBe(true);
    });

    it('minimize focuses next available window', () => {
        createTestWindow({ id: 'win-a', title: 'A' });
        createTestWindow({ id: 'win-b', title: 'B' });
        WindowManager.focus('win-b');
        WindowManager.minimize('win-b');
        expect(WindowManager.activeWindow.id).toBe('win-a');
    });

    it('restore removes minimized class and re-focuses', () => {
        createTestWindow();
        WindowManager.minimize('test-win');
        WindowManager.restore('test-win');
        const win = State.getWindow('test-win');
        expect(win.minimized).toBe(false);
        expect(win.element.classList.contains('minimized')).toBe(false);
        expect(WindowManager.activeWindow.id).toBe('test-win');
    });

    it('minimize/restore are no-ops for non-existent window', () => {
        expect(() => WindowManager.minimize('ghost')).not.toThrow();
        expect(() => WindowManager.restore('ghost')).not.toThrow();
    });

    it('persists minimized state to localStorage', () => {
        createTestWindow();
        WindowManager.minimize('test-win');
        const saved = JSON.parse(localStorage.getItem('windowStates'));
        expect(saved['test-win'].minimized).toBe(true);
    });
});

// ── 5. Maximize Toggle ──────────────────────────────────────────────

describe('WindowManager.toggleMaximize()', () => {
    it('toggles maximized class on window element', () => {
        createTestWindow();
        const el = document.getElementById('window-test-win');
        WindowManager.toggleMaximize('test-win');
        expect(el.classList.contains('maximized')).toBe(true);
        WindowManager.toggleMaximize('test-win');
        expect(el.classList.contains('maximized')).toBe(false);
    });

    it('toggles maximized flag in state', () => {
        createTestWindow();
        WindowManager.toggleMaximize('test-win');
        expect(State.getWindow('test-win').maximized).toBe(true);
        WindowManager.toggleMaximize('test-win');
        expect(State.getWindow('test-win').maximized).toBe(false);
    });

    it('is a no-op for non-existent window', () => {
        expect(() => WindowManager.toggleMaximize('ghost')).not.toThrow();
    });
});

// ── 6. Close ────────────────────────────────────────────────────────

describe('WindowManager.close()', () => {
    it('adds closing animation classes immediately', () => {
        createTestWindow();
        WindowManager.close('test-win');
        const el = document.getElementById('window-test-win');
        expect(el.classList.contains('closing')).toBe(true);
        expect(el.classList.contains('window-glitch-close')).toBe(true);
    });

    it('removes element from DOM after animation timeout', () => {
        createTestWindow();
        WindowManager.close('test-win');
        // Element still exists during animation
        expect(document.getElementById('window-test-win')).not.toBeNull();
        // After 350ms animation completes
        vi.advanceTimersByTime(350);
        expect(document.getElementById('window-test-win')).toBeNull();
    });

    it('unregisters window from State after animation', () => {
        createTestWindow();
        WindowManager.close('test-win');
        vi.advanceTimersByTime(350);
        expect(State.getWindow('test-win')).toBeUndefined();
    });

    it('removes taskbar button after animation', () => {
        createTestWindow();
        expect(document.getElementById('taskbar-test-win')).not.toBeNull();
        WindowManager.close('test-win');
        vi.advanceTimersByTime(350);
        expect(document.getElementById('taskbar-test-win')).toBeNull();
    });

    it('calls onClose callback before animation', () => {
        const onClose = vi.fn();
        createTestWindow({ onClose });
        WindowManager.close('test-win');
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('handles onClose callback that throws', () => {
        const onClose = vi.fn(() => { throw new Error('boom'); });
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        createTestWindow({ onClose });
        // Should not throw — error is caught internally
        expect(() => WindowManager.close('test-win')).not.toThrow();
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('announces closure to screen readers', () => {
        createTestWindow();
        WindowManager.close('test-win');
        const announcer = document.getElementById('screenReaderAnnouncer');
        expect(announcer.textContent).toBe('Closed window: Test Window');
    });

    it('clears navigation stack for closed window', () => {
        createTestWindow();
        WindowManager.pushNavigation('test-win', { label: 'Page 1', callback: vi.fn() });
        WindowManager.close('test-win');
        vi.advanceTimersByTime(350);
        expect(WindowManager.navigationStack.has('test-win')).toBe(false);
    });

    it('focuses next available window after closing active', () => {
        createTestWindow({ id: 'win-a', title: 'A' });
        createTestWindow({ id: 'win-b', title: 'B' });
        WindowManager.focus('win-b');
        WindowManager.close('win-b');
        vi.advanceTimersByTime(350);
        expect(WindowManager.activeWindow.id).toBe('win-a');
    });

    it('sets activeWindow to null when last window closes', () => {
        createTestWindow();
        WindowManager.close('test-win');
        vi.advanceTimersByTime(350);
        expect(WindowManager.activeWindow).toBeNull();
    });

    it('is a no-op for non-existent window', () => {
        expect(() => WindowManager.close('ghost')).not.toThrow();
    });

    it('cancels inertia animation frame on close to prevent RAF leak', () => {
        createTestWindow();
        const win = State.getWindow('test-win');
        // Simulate an in-progress inertia animation
        win.inertiaFrame = 42;
        const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
        WindowManager.close('test-win');
        expect(cancelSpy).toHaveBeenCalledWith(42);
        expect(win.inertiaFrame).toBeNull();
        cancelSpy.mockRestore();
    });
});

// ── 7. Navigation Stack ─────────────────────────────────────────────

describe('WindowManager navigation stack', () => {
    it('pushNavigation creates stack for new window', () => {
        createTestWindow();
        WindowManager.pushNavigation('test-win', { label: 'Home', callback: vi.fn() });
        expect(WindowManager.navigationStack.get('test-win')).toHaveLength(1);
    });

    it('popNavigation returns last pushed state', () => {
        createTestWindow();
        const cb = vi.fn();
        WindowManager.pushNavigation('test-win', { label: 'Home', callback: cb });
        WindowManager.pushNavigation('test-win', { label: 'Detail', callback: vi.fn() });
        const popped = WindowManager.popNavigation('test-win');
        expect(popped.label).toBe('Detail');
    });

    it('popNavigation returns null on empty stack', () => {
        expect(WindowManager.popNavigation('test-win')).toBeNull();
    });

    it('popNavigation returns null for non-existent window', () => {
        expect(WindowManager.popNavigation('ghost')).toBeNull();
    });

    it('updates back button visibility on push', () => {
        createTestWindow();
        const backBtn = document.querySelector('#window-test-win .nav-back-btn');
        expect(backBtn.style.display).toBe('none');
        WindowManager.pushNavigation('test-win', { label: 'Page', callback: vi.fn() });
        expect(backBtn.style.display).toBe('flex');
    });

    it('renders breadcrumbs with separators', () => {
        createTestWindow();
        WindowManager.pushNavigation('test-win', { label: 'Home', callback: vi.fn() });
        WindowManager.pushNavigation('test-win', { label: 'Projects', callback: vi.fn() });
        const crumbs = document.querySelectorAll('#window-test-win .breadcrumb-item');
        const seps = document.querySelectorAll('#window-test-win .breadcrumb-separator');
        expect(crumbs).toHaveLength(2);
        expect(seps).toHaveLength(1);
        expect(crumbs[0].textContent).toBe('Home');
        expect(crumbs[1].textContent).toBe('Projects');
        expect(crumbs[1].classList.contains('active')).toBe(true);
    });

    it('hides back button when stack is emptied', () => {
        createTestWindow();
        WindowManager.pushNavigation('test-win', { label: 'Page', callback: vi.fn() });
        WindowManager.popNavigation('test-win');
        const backBtn = document.querySelector('#window-test-win .nav-back-btn');
        expect(backBtn.style.display).toBe('none');
    });
});

// ── 8. ESC Key Priority ─────────────────────────────────────────────

describe('WindowManager ESC key handling', () => {
    beforeEach(() => {
        WindowManager.init();
    });

    function pressEscape() {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }

    it('closes active window on ESC when no overlays exist', () => {
        createTestWindow();
        pressEscape();
        // Close animation started
        const el = document.getElementById('window-test-win');
        expect(el.classList.contains('closing')).toBe(true);
    });

    it('does NOT close window when modal overlay is active', () => {
        createTestWindow();
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        document.body.appendChild(modal);
        pressEscape();
        const el = document.getElementById('window-test-win');
        expect(el.classList.contains('closing')).toBe(false);
    });

    it('does NOT close window when lightbox overlay is active', () => {
        createTestWindow();
        const lb = document.createElement('div');
        lb.className = 'lightbox-overlay active';
        document.body.appendChild(lb);
        pressEscape();
        const el = document.getElementById('window-test-win');
        expect(el.classList.contains('closing')).toBe(false);
    });

    it('does NOT close window when tour overlay is active', () => {
        createTestWindow();
        const tour = document.createElement('div');
        tour.className = 'tour-overlay active';
        document.body.appendChild(tour);
        pressEscape();
        const el = document.getElementById('window-test-win');
        expect(el.classList.contains('closing')).toBe(false);
    });

    it('ignores non-Escape keys', () => {
        createTestWindow();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        const el = document.getElementById('window-test-win');
        expect(el.classList.contains('closing')).toBe(false);
    });
});

// ── 9. Taskbar Integration ──────────────────────────────────────────

describe('WindowManager taskbar', () => {
    it('marks last-created window taskbar button as active', () => {
        // Note: focus() calls updateTaskbar() BEFORE setting activeWindow (line 523 vs 525
        // in windows.js), so the taskbar reflects activeWindow from the previous focus call.
        // The create() flow compensates because addToTaskbar calls updateTaskbar again after
        // focus has already set activeWindow. This test verifies the post-create state.
        createTestWindow({ id: 'win-a', title: 'A' });
        createTestWindow({ id: 'win-b', title: 'B' });
        const btnA = document.getElementById('taskbar-win-a');
        const btnB = document.getElementById('taskbar-win-b');
        expect(btnB.classList.contains('active')).toBe(true);
        expect(btnA.classList.contains('active')).toBe(false);
    });

    it('standalone focus() has stale taskbar state (known ordering bug)', () => {
        // Documents the bug: focus() sets activeWindow AFTER updateTaskbar(),
        // so the taskbar button won't reflect the focus until next updateTaskbar call.
        createTestWindow({ id: 'win-a', title: 'A' });
        createTestWindow({ id: 'win-b', title: 'B' });
        WindowManager.focus('win-a');
        const btnA = document.getElementById('taskbar-win-a');
        // BUG: btnA should be active but isn't — activeWindow still points to win-b
        // when updateTaskbar runs inside focus()
        expect(btnA.classList.contains('active')).toBe(false);
        // Manual updateTaskbar after focus corrects it
        WindowManager.updateTaskbar();
        expect(btnA.classList.contains('active')).toBe(true);
    });

    it('marks minimized window taskbar button as minimized', () => {
        createTestWindow();
        WindowManager.minimize('test-win');
        const btn = document.getElementById('taskbar-test-win');
        expect(btn.classList.contains('minimized')).toBe(true);
    });

    it('clicking taskbar button restores minimized window', () => {
        createTestWindow();
        WindowManager.minimize('test-win');
        const btn = document.getElementById('taskbar-test-win');
        btn.click();
        expect(State.getWindow('test-win').minimized).toBe(false);
    });

    it('clicking taskbar button of active window minimizes it', () => {
        createTestWindow();
        WindowManager.focus('test-win');
        const btn = document.getElementById('taskbar-test-win');
        btn.click();
        expect(State.getWindow('test-win').minimized).toBe(true);
    });

    it('clicking taskbar button of inactive window focuses it', () => {
        createTestWindow({ id: 'win-a', title: 'A' });
        createTestWindow({ id: 'win-b', title: 'B' });
        WindowManager.focus('win-b');
        const btnA = document.getElementById('taskbar-win-a');
        btnA.click();
        expect(WindowManager.activeWindow.id).toBe('win-a');
    });
});

// ── 10. Titlebar Structure ──────────────────────────────────────────

describe('WindowManager titlebar', () => {
    it('creates minimize, maximize, and close control buttons', () => {
        createTestWindow();
        const el = document.getElementById('window-test-win');
        expect(el.querySelector('.window-control-btn.minimize')).not.toBeNull();
        expect(el.querySelector('.window-control-btn.maximize')).not.toBeNull();
        expect(el.querySelector('.window-control-btn.close')).not.toBeNull();
    });

    it('control buttons have ARIA labels', () => {
        createTestWindow();
        const el = document.getElementById('window-test-win');
        expect(el.querySelector('.minimize').getAttribute('aria-label')).toBe('Minimize');
        expect(el.querySelector('.maximize').getAttribute('aria-label')).toBe('Maximize');
        expect(el.querySelector('.close').getAttribute('aria-label')).toBe('Close');
    });

    it('close button triggers window close', () => {
        createTestWindow();
        const closeBtn = document.querySelector('#window-test-win .window-control-btn.close');
        closeBtn.click();
        const el = document.getElementById('window-test-win');
        expect(el.classList.contains('closing')).toBe(true);
    });

    it('minimize button triggers minimize', () => {
        createTestWindow();
        const minBtn = document.querySelector('#window-test-win .window-control-btn.minimize');
        minBtn.click();
        expect(State.getWindow('test-win').minimized).toBe(true);
    });

    it('maximize button triggers maximize toggle', () => {
        createTestWindow();
        const maxBtn = document.querySelector('#window-test-win .window-control-btn.maximize');
        maxBtn.click();
        expect(State.getWindow('test-win').maximized).toBe(true);
    });

    it('renders window icon when provided', () => {
        createTestWindow({ icon: '<span class="test-icon">X</span>' });
        const el = document.getElementById('window-test-win');
        expect(el.querySelector('.window-icon')).not.toBeNull();
    });

    it('omits window icon when not provided', () => {
        createTestWindow({ icon: null });
        const el = document.getElementById('window-test-win');
        expect(el.querySelector('.window-icon')).toBeNull();
    });
});

// ── 11. Content Rendering ───────────────────────────────────────────

describe('WindowManager content handling', () => {
    it('accepts string content (sanitized HTML)', () => {
        createTestWindow({ content: '<p>Hello</p>' });
        const content = document.querySelector('#window-test-win .window-content');
        expect(content.innerHTML).toContain('Hello');
    });

    it('accepts HTMLElement content', () => {
        const el = document.createElement('div');
        el.className = 'custom-widget';
        el.textContent = 'Widget';
        createTestWindow({ content: el });
        const content = document.querySelector('#window-test-win .window-content');
        expect(content.querySelector('.custom-widget')).not.toBeNull();
        expect(content.textContent).toContain('Widget');
    });
});

// ── 12. Window Cascade Positioning ──────────────────────────────────

describe('WindowManager cascade positioning', () => {
    it('offsets cascaded windows so title bars remain reachable', () => {
        Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
        const w1 = createTestWindow({ id: 'c1', title: 'C1' });
        const w2 = createTestWindow({ id: 'c2', title: 'C2' });
        // Second window should be offset from the first
        expect(w2.x).not.toBe(w1.x);
        expect(w2.y).not.toBe(w1.y);
    });
});
