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
import { initGalaxyBackground, destroyGalaxyBackground } from './galaxy-background.js';
import { MahoragaWheel3D } from './mahoraga-wheel-3d.js';
import { trapFocus } from './focus-trap.js';

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
    galaxyInstance: null,

    // Cinematic state
    _cinematicTimeouts: [],
    _cinematicDone: false,
    _skipBound: null,
    _typewriterInterval: null,
    _focusTrapCleanup: null,

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

        this.initLoginScreen();
        this.initTaskbarClock();
        this.initGalaxyEffect();
        this.init3DWheel();

        // Start cinematic intro instead of old lock screen click handler
        this.startCinematic();

        // Trap focus within the lock screen
        this._focusTrapCleanup = trapFocus(this.lockScreen);

        // Listen for system lock event (from Start Menu)
        window.addEventListener('system-lock', () => this.lock());
    },

    /**
     * Initialize galaxy background effect on document body (persists across login/desktop)
     */
    initGalaxyEffect() {
        // Already initialized by main.js during boot
        if (this.galaxyInstance || document.body.classList.contains('galaxy-active')) {
            this.galaxyInstance = window.__galaxyInstance || null;
            // Still apply galaxy text styling
            const osTitle = this.lockScreen?.querySelector('.os-title');
            if (osTitle) osTitle.classList.add('galaxy-text');
            this.init3DWheel();
            return;
        }

        // Apply galaxy text styling to title
        const osTitle = this.lockScreen?.querySelector('.os-title');
        if (osTitle) {
            osTitle.classList.add('galaxy-text');
        }

        // Initialize Three.js galaxy background on BODY (persists through login)
        try {
            this.galaxyInstance = initGalaxyBackground(document.body, {
                starCount: 150,
                nebulaSpeed: 0.00025,
                starDriftSpeed: 0.0003,
                mouseInfluence: 0.015
            });
            document.body.classList.add('galaxy-active', 'galaxy-container');
            console.log('[Login] Full-page galaxy background initialized on body');
        } catch (err) {
            console.warn('[Login] Galaxy background failed to initialize, using CSS fallback:', err);
        }

        // Initialize 3D Mahoraga wheel on the lock screen
        this.init3DWheel();
    },

    /**
     * Initialize 3D Mahoraga wheel (replaces flat SVG on lock screen)
     */
    init3DWheel() {
        if (this.wheel3D) return;
        const watermark = this.lockScreen?.querySelector('.intro-watermark');
        if (!watermark) return;

        try {
            // Hide the flat SVG
            const flatImg = watermark.querySelector('.intro-watermark-img');
            if (flatImg) flatImg.style.display = 'none';

            this.wheel3D = new MahoragaWheel3D(watermark, { size: 400 });
            console.log('[Login] 3D Mahoraga wheel initialized');
        } catch (err) {
            console.warn('[Login] 3D wheel failed, keeping flat SVG:', err);
            // Restore flat SVG on failure
            const flatImg = watermark.querySelector('.intro-watermark-img');
            if (flatImg) flatImg.style.display = '';
        }
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
     * Start the 3-act cinematic intro sequence
     */
    startCinematic() {
        const stage = document.getElementById('introStage');
        if (!stage) return;

        this._cinematicDone = false;
        this._cinematicTimeouts = [];

        // Skip handler — click or any key jumps to final state
        this._skipBound = (e) => {
            // Don't skip if clicking the INITIALIZE button (let it do its thing)
            if (e.target && e.target.closest('#loginButton')) return;
            this.skipCinematic();
        };

        document.addEventListener('click', this._skipBound, { once: false });
        document.addEventListener('keydown', this._skipBound, { once: false });

        // --- Act 1: Power On (0–0.5s) ---
        // Galaxy fades in, scanline sweeps
        this._queueTimeout(() => {
            stage.classList.add('act-1');
        }, 50);

        // --- Act 2: Identity (0.5–2s) ---
        // Title glitch-resolves, subtitle typewriter, watermark fades in
        this._queueTimeout(() => {
            stage.classList.add('act-2');
            this._startTypewriter();
        }, 550);

        // --- Act 3: Ready (2–3s) ---
        // Username, roles, INITIALIZE button appear with border-draw
        this._queueTimeout(() => {
            stage.classList.add('act-3');
        }, 2000);

        // Cinematic complete — clean up skip listeners
        this._queueTimeout(() => {
            this._finishCinematic();
        }, 3000);
    },

    /**
     * Skip to final state immediately
     */
    skipCinematic() {
        if (this._cinematicDone) return;

        const stage = document.getElementById('introStage');
        if (!stage) return;

        // Cancel all pending timeouts
        this._cinematicTimeouts.forEach(id => clearTimeout(id));
        this._cinematicTimeouts = [];

        // Cancel typewriter
        if (this._typewriterInterval) {
            clearInterval(this._typewriterInterval);
            this._typewriterInterval = null;
        }

        // Set subtitle to full text
        const subtitleText = stage.querySelector('.subtitle-text');
        if (subtitleText) {
            subtitleText.textContent = 'CREATIVE OPERATING SYSTEM v2.56';
        }

        // Jump to revealed state
        stage.classList.remove('act-1', 'act-2', 'act-3');
        stage.classList.add('revealed');

        this._finishCinematic();
    },

    /**
     * Clean up after cinematic completes (naturally or via skip)
     */
    _finishCinematic() {
        if (this._cinematicDone) return;
        this._cinematicDone = true;

        // Remove skip listeners
        if (this._skipBound) {
            document.removeEventListener('click', this._skipBound);
            document.removeEventListener('keydown', this._skipBound);
            this._skipBound = null;
        }

        // Focus the INITIALIZE button
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            setTimeout(() => loginButton.focus(), 100);
        }
    },

    /**
     * Typewriter effect for subtitle
     */
    _startTypewriter() {
        const stage = document.getElementById('introStage');
        const subtitleText = stage?.querySelector('.subtitle-text');
        if (!subtitleText) return;

        const fullText = 'CREATIVE OPERATING SYSTEM v2.56';
        let i = 0;
        subtitleText.textContent = '';

        this._typewriterInterval = setInterval(() => {
            if (i >= fullText.length) {
                clearInterval(this._typewriterInterval);
                this._typewriterInterval = null;
                return;
            }
            subtitleText.textContent += fullText[i];
            i++;
        }, 65);
    },

    /**
     * Queue a timeout that can be cancelled on skip
     */
    _queueTimeout(fn, delay) {
        const id = setTimeout(fn, delay);
        this._cinematicTimeouts.push(id);
        return id;
    },

    /**
     * Initialize login screen events (INITIALIZE button)
     */
    initLoginScreen() {
        const loginButton = document.getElementById('loginButton');

        if (loginButton) {
            // Click handler
            loginButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Don't trigger skip
                this.startBootSequence();
            });

            // Enter key handler (only after cinematic is done)
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && this._cinematicDone && !this.lockScreen.classList.contains('hidden')) {
                    this.startBootSequence();
                }
            });
        }
    },

    /**
     * Start Cyberpunk Boot Sequence
     */
    startBootSequence() {
        const stage = document.getElementById('introStage');
        const loginContent = document.getElementById('loginContent');
        const bootSequence = document.getElementById('bootSequence');

        if (!loginContent || !bootSequence) {
            this.login(); // Fallback
            return;
        }

        // Fade out cinematic elements, show boot text
        if (stage) stage.classList.add('booting');
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
     * Re-triggers the cinematic intro.
     */
    showLogin() {
        this.lockScreen.classList.remove('hidden');
        this.lockScreen.classList.remove('fade-out');

        // Reset cinematic state and replay
        const stage = document.getElementById('introStage');
        if (stage) {
            stage.classList.remove('act-1', 'act-2', 'act-3', 'revealed', 'booting');
        }
        this.startCinematic();
    },

    /**
     * Login (accept any password or empty)
     */
    login() {
        // Release focus trap on lock screen
        if (this._focusTrapCleanup) {
            this._focusTrapCleanup();
            this._focusTrapCleanup = null;
        }

        // Play PS1/PS2 boot sound for the login → desktop transition
        if (window.__InteractionEngine && window.__InteractionEngine.soundManager) {
            window.__InteractionEngine.soundManager.play('ps1-boot');
        }

        // Galaxy stays running - it's now on the body element

        // Stop 3D wheel to save GPU (lock screen hidden)
        if (this.wheel3D) this.wheel3D.stop();

        // Warp tunnel: login -> desktop
        Warp.transition(() => {
            this.lockScreen.classList.add('hidden'); // Hide lock/login container
            this.desktop.classList.remove('hidden');
            this.desktop.classList.add('fade-in');

            // Galaxy persists through login - don't destroy it!

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

        // RESET UI STATE
        const loginContent = document.getElementById('loginContent');
        const bootSequence = document.getElementById('bootSequence');
        const stage = document.getElementById('introStage');

        if (loginContent) loginContent.style.display = '';
        if (bootSequence) {
            bootSequence.classList.add('hidden');
            bootSequence.innerHTML = '';
        }
        if (stage) {
            stage.classList.remove('act-1', 'act-2', 'act-3', 'revealed', 'booting');
        }

        // Reinitialize galaxy effect
        this.initGalaxyEffect();

        // Restart cinematic
        this.startCinematic();

        // Re-trap focus within the lock screen
        this._focusTrapCleanup = trapFocus(this.lockScreen);

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
