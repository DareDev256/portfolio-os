/**
 * Easter Eggs & Fourth-Wall Breaking
 * Konami code, terminal sass, self-aware messages
 * Playful surprises that reward curiosity
 */

export const EasterEggs = {
    enabled: true,

    // Konami code tracking
    konamiSequence: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
    konamiProgress: 0,
    konamiUnlocked: false,

    // Behavior tracking
    windowsOpened: 0,
    rapidClicks: 0,
    lastClickTime: 0,
    sessionStartTime: 0,
    idleWarningShown: false,

    // Numeric buffer for 418/404 easter eggs
    numBuffer: '',
    numBufferTimeout: null,

    // Triple-click tracking for desktop glitch
    desktopClicks: [],

    // Easter egg states
    unlockedSecrets: new Set(),

    init() {
        console.log('[EasterEggs] Initialized');

        this.sessionStartTime = Date.now();

        // Konami code + numeric buffer listener
        document.addEventListener('keydown', this.handleKeyPress.bind(this));

        // Click tracking for rapid click detection
        document.addEventListener('click', this.handleClick.bind(this));

        // Triple-click desktop background detection
        this.initTripleClickGlitch();

        // Ctrl+Shift+V system info
        this.initSystemInfoShortcut();

        // Idle detection
        this.startIdleDetection();

        // Note: Window open tracking is now hooked in desktop.js
    },

    /**
     * Handle key press for Konami code + numeric buffer
     */
    handleKeyPress(e) {
        if (!this.enabled) return;

        // --- Numeric buffer for 418/404 easter eggs ---
        if (e.key >= '0' && e.key <= '9') {
            this.numBuffer += e.key;
            clearTimeout(this.numBufferTimeout);
            this.numBufferTimeout = setTimeout(() => { this.numBuffer = ''; }, 2000);

            if (this.numBuffer.endsWith('418')) {
                this.numBuffer = '';
                this.showNotification(
                    '🫖 HTTP 418',
                    'I\'M A TEAPOT. Short and stout. Here is my handle, here is my spout.',
                    'warning',
                    4000
                );
            } else if (this.numBuffer.endsWith('404')) {
                this.numBuffer = '';
                this.showNotification(
                    '🔍 HTTP 404',
                    'NOT FOUND... or is it? Maybe the real page was the friends we made along the way.',
                    'info',
                    4000
                );
            }
        }

        // --- Konami code ---
        const expectedKey = this.konamiSequence[this.konamiProgress];

        if (e.key === expectedKey) {
            this.konamiProgress++;

            // Show subtle progress indicator
            if (this.konamiProgress > 0 && this.konamiProgress < this.konamiSequence.length) {
                this.showKonamiProgress();
            }

            // Complete!
            if (this.konamiProgress === this.konamiSequence.length) {
                this.konamiProgress = 0;
                this.unlockKonamiCode();
            }
        } else {
            // Reset if wrong key (but not for numeric keys which have their own handler)
            if (!(e.key >= '0' && e.key <= '9')) {
                this.konamiProgress = 0;
            }
        }
    },

    /**
     * Init triple-click desktop glitch pulse
     */
    initTripleClickGlitch() {
        // Inject glitch-pulse CSS once
        const style = document.createElement('style');
        style.textContent = `
            @keyframes glitch-pulse-anim {
                0% { filter: none; }
                10% { filter: hue-rotate(90deg) saturate(3) brightness(1.5); }
                20% { filter: hue-rotate(-60deg) contrast(2) invert(0.1); }
                30% { filter: hue-rotate(180deg) saturate(5); }
                50% { filter: hue-rotate(45deg) brightness(0.8) contrast(1.5); }
                70% { filter: hue-rotate(-120deg) saturate(2); }
                100% { filter: none; }
            }
            body.glitch-pulse {
                animation: glitch-pulse-anim 500ms ease-out forwards;
            }
        `;
        document.head.appendChild(style);

        document.addEventListener('click', (e) => {
            if (!this.enabled) return;

            // Only trigger on desktop background, not icons or windows
            const target = e.target;
            const isDesktopBg = target.id === 'desktop' ||
                target.classList.contains('desktop-icons') ||
                target.classList.contains('galaxy-container');

            if (!isDesktopBg) {
                this.desktopClicks = [];
                return;
            }

            const now = Date.now();
            this.desktopClicks.push(now);

            // Keep only clicks within 600ms window
            this.desktopClicks = this.desktopClicks.filter(t => now - t < 600);

            if (this.desktopClicks.length >= 3) {
                this.desktopClicks = [];
                document.body.classList.add('glitch-pulse');
                setTimeout(() => document.body.classList.remove('glitch-pulse'), 500);
            }
        });
    },

    /**
     * Ctrl+Shift+V → system info popup
     */
    initSystemInfoShortcut() {
        document.addEventListener('keydown', (e) => {
            if (!this.enabled) return;
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                const uptime = Math.floor((Date.now() - this.sessionStartTime) / 1000);
                const mins = Math.floor(uptime / 60);
                const secs = uptime % 60;
                const windowCount = document.querySelectorAll('.window').length;

                this.showNotification(
                    '💻 SYSTEM_INFO.dat',
                    `OS: Passion-OS v4.2.0<br>` +
                    `Uptime: ${mins}m ${secs}s<br>` +
                    `Windows: ${windowCount} active<br>` +
                    `CPU: Vibes only<br>` +
                    `Vibe Level: MAXIMUM`,
                    'success',
                    5000
                );
            }
        });
    },

    /**
     * Show Konami code progress (subtle hint)
     */
    showKonamiProgress() {
        const progress = this.konamiProgress;
        const total = this.konamiSequence.length;
        const percent = (progress / total) * 100;

        // Show progress bar briefly
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 200px;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
            z-index: 10000;
        `;

        const bar = document.createElement('div');
        bar.style.cssText = `
            width: ${percent}%;
            height: 100%;
            background: linear-gradient(90deg, #00f0ff, #ff00aa);
            transition: width 0.2s ease-out;
        `;

        indicator.appendChild(bar);
        document.body.appendChild(indicator);

        setTimeout(() => indicator.remove(), 1000);
    },

    /**
     * Unlock Konami code - PLAYSTATION TRAIL ACTIVATED!
     */
    unlockKonamiCode() {
        if (this.konamiUnlocked) {
            this.showNotification(
                '🎮 ALREADY UNLOCKED',
                'PlayStation mode is still active!',
                'info'
            );
            return;
        }

        this.konamiUnlocked = true;
        this.unlockedSecrets.add('konami');

        // Particle explosion from center
        this.createKonamiExplosion();

        // Switch to PlayStation trail
        if (window.__InteractionEngine && window.__InteractionEngine.cursorTrail) {
            window.__InteractionEngine.cursorTrail.setType('playstation');
            window.__InteractionEngine.cursorTrail.setEnabled(true);

            // Update state
            if (window.State) {
                window.State.cursorTrailType = 'playstation';
                window.State.cursorTrailEnabled = true;
                window.State.setCursorTrailType('playstation');
                window.State.setCursorTrailEnabled(true);
            }
        }

        // Play sound if available
        if (window.__InteractionEngine && window.__InteractionEngine.soundManager) {
            window.__InteractionEngine.soundManager.play('konami');
        }

        // Show epic notification
        this.showNotification(
            '🎮 CHEAT CODE ACTIVATED',
            'PlayStation cursor trail unlocked! ✕◯△□<br>The nostalgia is real.',
            'success',
            5000
        );

        console.log('🎮 KONAMI CODE ACTIVATED! PlayStation mode unlocked!');
    },

    /**
     * Create particle explosion for Konami code
     */
    createKonamiExplosion() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = 100 + Math.random() * 200;
            const endX = centerX + Math.cos(angle) * distance;
            const endY = centerY + Math.sin(angle) * distance;

            const particle = document.createElement('div');
            particle.textContent = ['✕', '◯', '△', '□'][Math.floor(Math.random() * 4)];
            particle.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                font-size: 24px;
                color: ${['#00f0ff', '#ff00aa', '#00ff88', '#ffaa00'][i % 4]};
                pointer-events: none;
                z-index: 10000;
                text-shadow: 0 0 10px currentColor;
            `;

            document.body.appendChild(particle);

            particle.animate([
                {
                    transform: 'translate(-50%, -50%) scale(0.5) rotate(0deg)',
                    opacity: 1
                },
                {
                    transform: `translate(calc(-50% + ${endX - centerX}px), calc(-50% + ${endY - centerY}px)) scale(1.5) rotate(720deg)`,
                    opacity: 0
                }
            ], {
                duration: 1500,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => particle.remove();
        }
    },

    /**
     * Handle clicks for rapid click detection
     */
    handleClick(e) {
        if (!this.enabled) return;

        const now = Date.now();
        const timeSinceLastClick = now - this.lastClickTime;

        if (timeSinceLastClick < 200) {
            this.rapidClicks++;

            if (this.rapidClicks >= 10) {
                this.showNotification(
                    '☕ CAFFEINATED MUCH?',
                    'Wow, someone\'s got energy! Maybe try decaf?',
                    'warning',
                    3000
                );
                this.rapidClicks = 0;
            }
        } else {
            this.rapidClicks = 0;
        }

        this.lastClickTime = now;
    },

    /**
     * Track window opening
     * NOTE: Window tracking is now handled in desktop.js where WindowManager is imported.
     * This method is kept for reference but is no longer used.
     */
    trackWindowOpening() {
        // Moved to desktop.js - see window creation hook after imports
    },

    /**
     * Start idle detection
     */
    startIdleDetection() {
        let lastActivity = Date.now();

        const resetActivity = () => {
            lastActivity = Date.now();
            this.idleWarningShown = false;
        };

        document.addEventListener('mousemove', resetActivity);
        document.addEventListener('keydown', resetActivity);
        document.addEventListener('click', resetActivity);

        // Check every 30 seconds
        setInterval(() => {
            if (!this.enabled) return;

            const idleTime = Date.now() - lastActivity;

            // 5 minutes idle
            if (idleTime > 300000 && !this.idleWarningShown) {
                this.showNotification(
                    '😴 STILL THERE?',
                    'You\'ve been idle for 5 minutes. Taking a break, or just admiring the UI?',
                    'info',
                    4000
                );
                this.idleWarningShown = true;
            }
        }, 30000);
    },

    /**
     * Show notification
     */
    showNotification(title, message, type = 'info', duration = 4000) {
        // Play notification sound
        if (window.__InteractionEngine?.soundManager) {
            window.__InteractionEngine.soundManager.play('notification');
        }

        const notification = document.createElement('div');
        notification.className = `easter-egg-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            min-width: 300px;
            max-width: 400px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid ${type === 'success' ? '#00ff88' : type === 'warning' ? '#ffaa00' : '#00f0ff'};
            border-radius: 12px;
            color: white;
            font-family: 'Courier New', monospace;
            box-shadow: 0 0 30px ${type === 'success' ? '#00ff8840' : type === 'warning' ? '#ffaa0040' : '#00f0ff40'};
            z-index: 10001;
            animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(500px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            .notification-title {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 8px;
                color: ${type === 'success' ? '#00ff88' : type === 'warning' ? '#ffaa00' : '#00f0ff'};
            }
            .notification-message {
                font-size: 14px;
                color: #ccc;
                line-height: 1.6;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(notification);

        // Auto-dismiss
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 300);
        }, duration);

        // Add style for slide out
        const slideOutStyle = document.createElement('style');
        slideOutStyle.textContent = `
            @keyframes slideOutRight {
                to {
                    transform: translateX(500px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(slideOutStyle);
    },

    /**
     * Get terminal sass response
     */
    getTerminalSass(command) {
        if (!this.enabled) return null;

        const cmd = command.trim().toLowerCase();

        const responses = {
            // Classic sass
            'sudo': 'Nice try, but I\'m not actually Linux 😏',
            'sudo su': 'Access denied. This isn\'t a real OS, genius.',
            'rm -rf /': 'LOL. You wish. This is just HTML, buddy.',
            'rm -rf /*': 'Cute. But no.',
            'hack': 'Error 403: Try being less obvious.',
            'hack the planet': 'Easy there, Zero Cool. This isn\'t 1995.',
            'exit': 'You can\'t escape. This is a website. You\'re trapped here forever. Muahaha.',
            'quit': 'There is no escape. Only... more terminal.',
            'help me': 'I\'m a terminal, not a therapist.',
            'date': `It's ${new Date().toLocaleDateString()}, and you're still here typing commands into a portfolio website.`,
            'pwd': '/fake/path/to/nowhere',
            'cd ..': 'You can\'t escape your current directory. It\'s existential.',
            'cat secrets.txt': 'Permission denied. (Also, there are no secrets. Or are there? 🤔)',
            'nano': 'This isn\'t vim. Wait, it isn\'t nano either. What even is this?',
            'vim': 'How do you exit vim? Oh wait, this isn\'t vim. Crisis averted.',
            'emacs': 'Even in a fake terminal, we\'re not starting that war.',
            'python': '>>> You thought this would work?',
            'node': 'Node.js is not installed. This is fake. Everything is fake.',
            'npm install happiness': 'Error: Package not found. Have you tried touching grass?',
            'git gud': 'Commit message: "I have no idea what I\'m doing"',
            'make me a sandwich': 'What? Make it yourself.',
            'sudo make me a sandwich': 'Okay, fine. 🥪 Here you go.',

            // New sass commands
            'matrix': '⬛🟩⬛🟩⬛🟩 Wake up, Neo... The Matrix has you. (Just kidding, this is CSS.)',
            'neofetch': `\n  ╔══════════════════╗\n  ║  PASSION-OS 4.2  ║\n  ╠══════════════════╣\n  ║ Host: Browser    ║\n  ║ Shell: FakeSH    ║\n  ║ CPU: Pure Vibes  ║\n  ║ GPU: CSS Filters ║\n  ║ RAM: Infinite*   ║\n  ║ (*terms apply)   ║\n  ╚══════════════════╝`,
            'ping': 'PING passion-os (127.0.0.1): 64 bytes — Reply: "Stop pinging me, I\'m right here."',
            'top': 'PID 1: vibe-daemon (99.9% CPU)\nPID 2: css-blur-engine (RIP)\nPID 3: recruiter-tracker (watching you)\nAll other processes: vibing.',
            'history': '1. Googled "how to look like a hacker"\n2. Found this portfolio\n3. Opened terminal\n4. Typed "history"\n5. Got roasted\n...you are here.',
            'fortune': [
                'Your code will compile on the first try today. (Just kidding.)',
                'A recruiter is watching. Look busy.',
                'The bug is not in your code. It\'s in your heart.',
                'You will find a missing semicolon in 3... 2... never.',
                'Today\'s lucky framework: the one you\'re not using.',
            ][Math.floor(Math.random() * 5)],
            'cowsay': '  _______________\n < Moo? In HTML? >\n  ---------------\n         \\   ^__^\n          \\  (oo)\\_______\n             (__)\\       )\\/\\\n                 ||----w |\n                 ||     ||',
            'git blame': 'Blame? In this economy? We practice blameless post-mortems here.',
            'ssh root@passion-os': 'Connection established... just kidding. You\'re already inside. There is no outside.',
            'rm -rf node_modules': 'Deleted 847,293 files. Just kidding — but wouldn\'t THAT be satisfying?',
            'alias': 'alias please="sudo"\nalias yolo="git push --force"\nalias bye="echo \'You can never leave\'"\n',
            'man': 'MANUAL: You\'re typing commands into a portfolio website. There is no manual for this.',
            'curl localhost': 'HTTP/1.1 200 OK\nContent-Type: text/sarcasm\n\n{"message": "You\'re already here. What are you curling?"}',
            'clear && echo hacked': 'Nice try, script kiddie. 🎭',
            'npm start': 'Error: This project runs on vibes, not npm.',
            'docker': 'Error: Cannot containerize vibes.',
            'apt-get install girlfriend': 'E: Unable to locate package. Have you tried Stack Overflow?',
        };

        return responses[cmd] || null;
    },

    /**
     * Update (called from engine loop)
     */
    update(timestamp, deltaTime) {
        // Easter eggs are mostly event-driven, but we could add periodic checks here
    },

    /**
     * Get stats
     */
    getStats() {
        return {
            enabled: this.enabled,
            konamiUnlocked: this.konamiUnlocked,
            windowsOpened: this.windowsOpened,
            unlockedSecrets: this.unlockedSecrets.size,
            sessionDuration: Math.floor((Date.now() - this.sessionStartTime) / 1000)
        };
    }
};
