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

    // Easter egg states
    unlockedSecrets: new Set(),

    init() {
        console.log('[EasterEggs] Initialized');

        this.sessionStartTime = Date.now();

        // Konami code listener
        document.addEventListener('keydown', this.handleKeyPress.bind(this));

        // Click tracking for rapid click detection
        document.addEventListener('click', this.handleClick.bind(this));

        // Idle detection
        this.startIdleDetection();

        // Note: Window open tracking is now hooked in desktop.js
    },

    /**
     * Handle key press for Konami code
     */
    handleKeyPress(e) {
        if (!this.enabled) return;

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
            // Reset if wrong key
            this.konamiProgress = 0;
        }
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
        if (window.InteractionEngine && window.InteractionEngine.cursorTrail) {
            window.InteractionEngine.cursorTrail.setType('playstation');
            window.InteractionEngine.cursorTrail.setEnabled(true);

            // Update state
            if (window.State) {
                window.State.cursorTrailType = 'playstation';
                window.State.cursorTrailEnabled = true;
                window.State.setCursorTrailType('playstation');
                window.State.setCursorTrailEnabled(true);
            }
        }

        // Play sound if available
        if (window.InteractionEngine && window.InteractionEngine.soundManager) {
            window.InteractionEngine.soundManager.play('konami');
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
        if (window.InteractionEngine?.soundManager) {
            window.InteractionEngine.soundManager.play('notification');
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
            'sudo': 'Nice try, but I\'m not actually Linux 😏',
            'sudo su': 'Access denied. This isn\'t a real OS, genius.',
            'rm -rf /': 'LOL. You wish. This is just HTML, buddy.',
            'rm -rf /*': 'Cute. But no.',
            'hack': 'Error 403: Try being less obvious.',
            'hack the planet': 'Easy there, Zero Cool. This isn\'t 1995.',
            'exit': 'You can\'t escape. This is a website. You\'re trapped here forever. Muahaha.',
            'quit': 'There is no escape. Only... more terminal.',
            'help': 'Help yourself. I\'m not your OS 🤷',
            'help me': 'I\'m a terminal, not a therapist.',
            'whoami': 'You\'re someone clicking buttons on a fake terminal. That\'s who.',
            'date': `It's ${new Date().toLocaleDateString()}, and you're still here typing commands into a portfolio website.`,
            'pwd': '/fake/path/to/nowhere',
            'cd ..': 'You can\'t escape your current directory. It\'s existential.',
            'ls': 'Your hopes, your dreams, that\_project\_you\_never\_finished.txt',
            'cat secrets.txt': 'Permission denied. (Also, there are no secrets. Or are there? 🤔)',
            'nano': 'This isn\'t vim. Wait, it isn\'t nano either. What even is this?',
            'vim': 'How do you exit vim? Oh wait, this isn\'t vim. Crisis averted.',
            'emacs': 'Even in a fake terminal, we\'re not starting that war.',
            'python': '>>> You thought this would work?',
            'node': 'Node.js is not installed. This is fake. Everything is fake.',
            'npm install happiness': 'Error: Package not found. Have you tried touching grass?',
            'git gud': 'Commit message: "I have no idea what I\'m doing"',
            'make me a sandwich': 'What? Make it yourself.',
            'sudo make me a sandwich': 'Okay, fine. 🥪 Here you go.'
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
