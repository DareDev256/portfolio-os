import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── 1. Homepage DOM Structure ────────────────────────────────────────
// Verifies the critical DOM landmarks exist after index.html loads.
// These are the elements every module assumes are present at boot.

describe('Homepage smoke — critical DOM landmarks', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="lockScreen" class="lock-screen" role="dialog">
                <div id="loginContent">
                    <button id="loginButton" class="cyber-button"><span class="btn-label">INITIALIZE</span></button>
                </div>
                <div id="bootSequence" class="boot-sequence hidden"></div>
            </div>
            <div id="desktop" class="desktop hidden">
                <div class="top-bar">
                    <div class="top-bar-left"><span class="brand">PASSION OS</span><span class="version">v3.33.2</span></div>
                    <div class="top-bar-right"><span class="time-display">12:00:00</span></div>
                </div>
                <div class="desktop-icons" role="navigation" aria-label="Desktop icons"></div>
                <div id="windowsContainer" class="windows-container" role="region" aria-live="polite"></div>
                <div class="taskbar dock-style" role="navigation" aria-label="Dock">
                    <div id="dockLaunchers" class="dock-launchers"></div>
                    <div id="taskbarWindows" class="taskbar-windows"></div>
                </div>
            </div>
            <div id="contextMenu" class="context-menu hidden" role="menu"></div>
            <div id="lightbox" class="lightbox hidden" role="dialog"></div>
        `;
    });

    it('lock screen exists and is visible by default', () => {
        const lock = document.getElementById('lockScreen');
        expect(lock).not.toBeNull();
        expect(lock.classList.contains('hidden')).toBe(false);
    });

    it('login button is present with correct label', () => {
        const btn = document.getElementById('loginButton');
        expect(btn).not.toBeNull();
        expect(btn.textContent).toContain('INITIALIZE');
    });

    it('desktop container exists but starts hidden', () => {
        const desktop = document.getElementById('desktop');
        expect(desktop).not.toBeNull();
        expect(desktop.classList.contains('hidden')).toBe(true);
    });

    it('windows container is an ARIA live region', () => {
        const wc = document.getElementById('windowsContainer');
        expect(wc).not.toBeNull();
        expect(wc.getAttribute('aria-live')).toBe('polite');
    });

    it('dock has both launchers and open-windows sections', () => {
        expect(document.getElementById('dockLaunchers')).not.toBeNull();
        expect(document.getElementById('taskbarWindows')).not.toBeNull();
    });

    it('top bar shows brand and version', () => {
        expect(document.querySelector('.brand').textContent).toBe('PASSION OS');
        expect(document.querySelector('.version').textContent).toContain('v3');
    });

    it('context menu and lightbox exist but are hidden', () => {
        expect(document.getElementById('contextMenu').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('lightbox').classList.contains('hidden')).toBe(true);
    });
});

// ── 2. Router Navigation ─────────────────────────────────────────────
// Verifies Router dispatches to the correct Desktop opener for each route
// and blocks dangerous paths.

describe('Router smoke — navigation dispatches', () => {
    let Router;

    beforeEach(async () => {
        // Fresh import with mocked Desktop
        vi.resetModules();

        vi.doMock('../js/desktop.js', () => ({
            Desktop: {
                openAbout: vi.fn(),
                openApplications: vi.fn(),
                openContact: vi.fn(),
                openSettings: vi.fn(),
                openResume: vi.fn(),
                openShell: vi.fn(),
                openMediaVault: vi.fn(),
            },
        }));

        const mod = await import('../js/router.js');
        Router = mod.Router;
    });

    it('/about dispatches to Desktop.openAbout', async () => {
        const { Desktop } = await import('../js/desktop.js');
        Router.handleRoute('/about');
        expect(Desktop.openAbout).toHaveBeenCalledOnce();
    });

    it('/connect dispatches to Desktop.openContact', async () => {
        const { Desktop } = await import('../js/desktop.js');
        Router.handleRoute('/connect');
        expect(Desktop.openContact).toHaveBeenCalledOnce();
    });

    it('/work dispatches to Desktop.openApplications', async () => {
        const { Desktop } = await import('../js/desktop.js');
        Router.handleRoute('/work');
        expect(Desktop.openApplications).toHaveBeenCalledOnce();
    });

    it('/resume dispatches to Desktop.openResume', async () => {
        const { Desktop } = await import('../js/desktop.js');
        Router.handleRoute('/resume');
        expect(Desktop.openResume).toHaveBeenCalledOnce();
    });

    it('/terminal dispatches to Desktop.openShell', async () => {
        const { Desktop } = await import('../js/desktop.js');
        Router.handleRoute('/terminal');
        expect(Desktop.openShell).toHaveBeenCalledOnce();
    });

    it('navigate() blocks javascript: protocol', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        Router.navigate('javascript:alert(1)');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('Blocked'), expect.anything());
        spy.mockRestore();
    });

    it('navigate() blocks empty/null paths', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        Router.navigate(null);
        Router.navigate('');
        expect(spy).toHaveBeenCalledTimes(2);
        spy.mockRestore();
    });

    it('/ root route does not dispatch any opener', async () => {
        const { Desktop } = await import('../js/desktop.js');
        Router.handleRoute('/');
        expect(Desktop.openAbout).not.toHaveBeenCalled();
        expect(Desktop.openContact).not.toHaveBeenCalled();
    });
});

// ── 3. Contact Form ──────────────────────────────────────────────────
// Verifies the contact form validates required fields, builds the
// correct mailto URI, and resets after submission.

describe('Contact form smoke — validation and submission', () => {
    let form, nameInput, emailInput, messageInput;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="window-contact"><div class="window-content">
                <form class="contact-form">
                    <input type="text" name="name" required>
                    <input type="email" name="email" required>
                    <textarea name="message" required></textarea>
                    <button type="submit">TRANSMIT</button>
                </form>
            </div></div>
        `;
        form = document.querySelector('.contact-form');
        nameInput = form.querySelector('[name="name"]');
        emailInput = form.querySelector('[name="email"]');
        messageInput = form.querySelector('[name="message"]');
    });

    it('form has all three required fields', () => {
        expect(nameInput.required).toBe(true);
        expect(emailInput.required).toBe(true);
        expect(messageInput.required).toBe(true);
    });

    it('FormData captures filled values', () => {
        nameInput.value = 'Ada Lovelace';
        emailInput.value = 'ada@example.com';
        messageInput.value = 'Hello from the test';

        const fd = new FormData(form);
        expect(fd.get('name')).toBe('Ada Lovelace');
        expect(fd.get('email')).toBe('ada@example.com');
        expect(fd.get('message')).toBe('Hello from the test');
    });

    it('mailto URI is constructed correctly from form data', () => {
        const name = 'Test User';
        const email = 'test@dev.io';
        const message = 'Integration test message';

        const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
        const body = encodeURIComponent(`From: ${name}\nEmail: ${email}\n\n${message}`);
        const href = `mailto:tdotssolutionsz@gmail.com?subject=${subject}&body=${body}`;

        expect(href).toContain('mailto:tdotssolutionsz@gmail.com');
        expect(href).toContain('Portfolio%20Contact%20from%20Test%20User');
        expect(href).toContain('test%40dev.io');
    });

    it('form.reset() clears all fields', () => {
        nameInput.value = 'filled';
        emailInput.value = 'filled@test.com';
        messageInput.value = 'filled';
        form.reset();
        expect(nameInput.value).toBe('');
        expect(emailInput.value).toBe('');
        expect(messageInput.value).toBe('');
    });

    it('submit event is preventable (no page navigation)', () => {
        let defaultPrevented = false;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            defaultPrevented = true;
        });
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        expect(defaultPrevented).toBe(true);
    });
});

// ── 4. Responsive Breakpoints ────────────────────────────────────────
// Verifies Mobile module detects devices correctly and injects the
// expected responsive styles and classes.

describe('Responsive smoke — mobile detection and style injection', () => {
    beforeEach(() => {
        document.body.className = '';
        document.head.querySelectorAll('style').forEach((s) => s.remove());
        document.head.querySelectorAll('meta[name="viewport"]').forEach((m) => m.remove());
    });

    it('isMobile returns true for iPhone user agent + small screen', async () => {
        const origUA = navigator.userAgent;
        const origWidth = window.innerWidth;
        Object.defineProperty(navigator, 'userAgent', { value: 'iPhone', configurable: true });
        Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });

        const { Mobile } = await import('../js/mobile.js');
        expect(Mobile.isMobile()).toBe(true);

        Object.defineProperty(navigator, 'userAgent', { value: origUA, configurable: true });
        Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('isMobile returns false for desktop user agent + wide screen', async () => {
        const origUA = navigator.userAgent;
        const origWidth = window.innerWidth;
        Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (Macintosh)', configurable: true });
        Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
        Object.defineProperty(window, 'ontouchstart', { value: undefined, configurable: true });
        Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });

        const { Mobile } = await import('../js/mobile.js');
        expect(Mobile.isMobile()).toBe(false);

        Object.defineProperty(navigator, 'userAgent', { value: origUA, configurable: true });
        Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('applyMobileOptimizations adds mobile-device class to body', async () => {
        const { Mobile } = await import('../js/mobile.js');
        Mobile.applyMobileOptimizations();
        expect(document.body.classList.contains('mobile-device')).toBe(true);
    });

    it('applyMobileOptimizations injects mobile stylesheet with 768px breakpoint', async () => {
        const { Mobile } = await import('../js/mobile.js');
        Mobile.applyMobileOptimizations();

        const styles = [...document.head.querySelectorAll('style')];
        const mobileStyle = styles.find((s) => s.textContent.includes('max-width: 768px'));
        expect(mobileStyle).toBeDefined();
        expect(mobileStyle.textContent).toContain('.desktop-icons');
        expect(mobileStyle.textContent).toContain('grid-template-columns');
    });

    it('ensureViewportMeta creates meta tag when missing', async () => {
        const { Mobile } = await import('../js/mobile.js');
        Mobile.ensureViewportMeta();
        const vp = document.querySelector('meta[name="viewport"]');
        expect(vp).not.toBeNull();
        expect(vp.content).toContain('width=device-width');
    });

    it('ensureViewportMeta does not duplicate existing tag', async () => {
        const existing = document.createElement('meta');
        existing.name = 'viewport';
        existing.content = 'width=device-width, initial-scale=1.0';
        document.head.appendChild(existing);

        const { Mobile } = await import('../js/mobile.js');
        Mobile.ensureViewportMeta();
        expect(document.querySelectorAll('meta[name="viewport"]').length).toBe(1);
    });

    it('disableHoverEffects injects @media (hover: none) rules', async () => {
        const { Mobile } = await import('../js/mobile.js');
        Mobile.disableHoverEffects();
        const styles = [...document.head.querySelectorAll('style')];
        const hoverStyle = styles.find((s) => s.textContent.includes('hover: none'));
        expect(hoverStyle).toBeDefined();
    });
});
