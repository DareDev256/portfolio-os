import { State } from './state.js';
import { Warp } from './warp.js';
import { Desktop } from './desktop.js';
import { StartMenu } from './startmenu.js';
import { WindowManager } from './windows.js';
import { Glyphs } from './glyphs.js';
import { AudioFX } from './audiofx.js';
import { Lightbox } from './lightbox.js';
import { Router } from './router.js';
import { Mobile } from './mobile.js';

/**
 * Login and Lock Screen
 * Handles lock screen, login flow, and transitions to desktop
 */

export const Login = {
    lockScreen: null,
    loginScreen: null,
    desktop: null,
    timeEl: null,
    dateEl: null,
    clockInterval: null,
    idleTimer: null,

    /**
     * Initialize login system
     */
    init() {
        this.lockScreen = document.getElementById('lockScreen');
        this.loginScreen = document.getElementById('loginScreen');
        this.desktop = document.getElementById('desktop');

        this.timeEl = this.lockScreen.querySelector('.lock-time');
        this.dateEl = this.lockScreen.querySelector('.lock-date');

        this.updateClock();
        this.clockInterval = setInterval(() => this.updateClock(), 1000);

        this.initLockScreen();
        this.initLoginScreen();
        this.initTaskbarClock();

        // Listen for system lock event (from Start Menu)
        window.addEventListener('system-lock', () => this.lock());
    },

    /**
     * Update lock screen clock
     */
    updateClock() {
        const now = new Date();

        // Time
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        if (this.timeEl) this.timeEl.textContent = `${hours}:${minutes}`;

        // Date
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        if (this.dateEl) this.dateEl.textContent = now.toLocaleDateString('en-US', options);
    },

    /**
     * Initialize lock screen events
     */
    initLockScreen() {
        // Click anywhere to proceed
        this.lockScreen.addEventListener('click', () => {
            this.showLogin();
        });

        // Press Enter to proceed
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.lockScreen.classList.contains('hidden')) {
                this.showLogin();
            }
        });
    },

    /**
     * Initialize login screen events
     */
    initLoginScreen() {
        const loginButton = document.getElementById('loginButton');

        if (loginButton) {
            // Click handler
            loginButton.addEventListener('click', () => {
                this.startBootSequence();
            });

            // Enter key handler
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !this.lockScreen.classList.contains('hidden')) {
                    this.startBootSequence();
                }
            });

            // Auto-focus button
            setTimeout(() => {
                loginButton.focus();
            }, 400);
        }
    },

    /**
     * Start Cyberpunk Boot Sequence
     */
    startBootSequence() {
        const loginContent = document.getElementById('loginContent');
        const bootSequence = document.getElementById('bootSequence');

        if (!loginContent || !bootSequence) {
            this.login(); // Fallback
            return;
        }

        // Hide login content
        loginContent.style.display = 'none';
        bootSequence.classList.remove('hidden');

        const messages = [
            '> INITIALIZING PASSION OS v2.56...',
            '> LOADING NEURAL INTERFACE...',
            '> AUTHENTICATING USER: DAREDEV256...',
            '> MOUNTING CREATIVE DRIVES...',
            '> SYSTEM READY. WELCOME BACK.',
        ];

        let step = 0;
        const typeLine = () => {
            if (step >= messages.length) {
                setTimeout(() => this.login(), 800);
                return;
            }

            const line = document.createElement('div');
            line.className = 'boot-line';
            line.textContent = messages[step];

            if (step === messages.length - 1) {
                line.classList.add('active');
                const cursor = document.createElement('span');
                cursor.className = 'cursor-blink';
                cursor.textContent = '_';
                line.appendChild(cursor);
            }

            bootSequence.appendChild(line);
            step++;
            setTimeout(typeLine, 400);
        };

        typeLine();
    },

    /**
     * Show login screen (after lock)
     * In this design, Lock Screen IS the Login Screen.
     */
    showLogin() {
        // Just ensures lock screen is visible and ready
        this.lockScreen.classList.remove('hidden');
        this.lockScreen.classList.remove('fade-out');
    },

    /**
     * Login (accept any password or empty)
     */
    login() {
        // Play PS1/PS2 boot sound for the login → desktop transition
        if (window.__InteractionEngine && window.__InteractionEngine.soundManager) {
            window.__InteractionEngine.soundManager.play('ps1-boot');
        }

        // Warp tunnel: login -> desktop
        Warp.transition(() => {
            this.lockScreen.classList.add('hidden'); // Hide lock/login container
            this.desktop.classList.remove('hidden');
            this.desktop.classList.add('fade-in');

            // Initialize desktop components
            this.initDesktop();

            // Disable effects during initial load for performance
            if (typeof Glyphs !== 'undefined') Glyphs.setEnabled(false);

            this.updateFxIcon();
            if (typeof StartMenu !== 'undefined') StartMenu.close();

            Warp.pulse();
        });
    },

    /**
     * Initialize taskbar clock (and Top Bar clock)
     */
    initTaskbarClock() {
        const timeEl = document.querySelector('.taskbar-clock .clock-time'); // Old taskbar clock (if exists)
        const dateEl = document.querySelector('.taskbar-clock .clock-date');
        const topBarTime = document.querySelector('.time-display'); // New Top Bar Clock

        const updateTaskbarClock = () => {
            const now = new Date();

            // Time (12-hour format for taskbar, 24h for top bar as per design)
            let hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';

            // Top Bar Time (24h)
            if (topBarTime) {
                topBarTime.textContent = `${now.getHours().toString().padStart(2, '0')}:${minutes}:${seconds}`;
            }

            // Taskbar Time (12h) - optional, if we kept it
            if (timeEl) {
                const hours12 = hours % 12 || 12;
                timeEl.textContent = `${hours12}:${minutes} ${ampm}`;
            }

            // Date
            if (dateEl) {
                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                const day = now.getDate().toString().padStart(2, '0');
                const year = now.getFullYear();
                dateEl.textContent = `${month}/${day}/${year}`;
            }
        };

        updateTaskbarClock();
        setInterval(updateTaskbarClock, 1000);
    },

    /**
     * Initialize desktop after login
     */
    initDesktop() {
        // Initialize mobile detection and optimizations
        if (typeof Mobile !== 'undefined') {
            Mobile.init();
            if (Mobile.isMobile()) {
                Mobile.renderMobileOS();
            }
        }

        // Initialize desktop components
        if (typeof Desktop !== 'undefined') Desktop.init();
        if (typeof WindowManager !== 'undefined') WindowManager.init();
        if (typeof StartMenu !== 'undefined') StartMenu.init();
        if (typeof Lightbox !== 'undefined') Lightbox.init();
        if (typeof Router !== 'undefined') Router.init();

        // Start idle timer
        this.startIdleTimer();
    },

    /**
     * Update FX icon based on state
     */
    updateFxIcon() {
        // This method updates visual effects icon if needed
        // Can be empty if not using FX icons in taskbar
    },

    /**
     * Lock the system
     */
    lock() {
        // Hide desktop
        this.desktop.classList.add('hidden');

        // Show lock screen
        this.lockScreen.classList.remove('hidden');
        this.lockScreen.classList.remove('fade-out');

        // RESET UI STATE (Fix for "frozen" look)
        const loginContent = document.getElementById('loginContent');
        const bootSequence = document.getElementById('bootSequence');

        if (loginContent) loginContent.style.display = 'block';
        if (bootSequence) {
            bootSequence.classList.add('hidden');
            bootSequence.innerHTML = ''; // Clear typed lines
        }

        // Update clock
        this.updateClock();

        // Clear idle timer
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    },

    /**
     * Start idle timer to auto-lock
     */
    startIdleTimer() {
        const resetTimer = () => {
            clearTimeout(this.idleTimer);

            if (State && State.idleTime > 0) {
                this.idleTimer = setTimeout(() => {
                    this.lock();
                }, State.idleTime);
            }
        };

        // Reset on user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach((event) => {
            document.addEventListener(event, resetTimer, true);
        });

        resetTimer();
    },
};
