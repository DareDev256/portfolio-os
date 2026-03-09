import { Tour } from './tour.js';
import { trapFocus } from './focus-trap.js';
import { PassionLive } from './passion-live.js';

/**
 * Welcome Tutorial Module
 * Shows Passion as a living character who greets visitors with personality.
 */

function typeText(element, text, speed = 30) {
    return new Promise((resolve) => {
        let i = 0;
        element.textContent = '';
        const cursor = document.createElement('span');
        cursor.className = 'passion-typing-cursor';
        element.appendChild(cursor);

        const interval = setInterval(() => {
            if (i < text.length) {
                cursor.before(text[i]);
                i++;
            } else {
                clearInterval(interval);
                // Remove cursor after a brief pause
                setTimeout(() => {
                    cursor.remove();
                    resolve();
                }, 600);
            }
        }, speed);
    });
}

export const Welcome = {
    /**
     * Show the welcome tutorial modal with live Passion dialogue
     */
    show() {
        // Initialize PassionLive if not already running
        if (!PassionLive.state) PassionLive.init();

        const greeting = PassionLive.getGreeting();
        const commentary = PassionLive.getCommentary();
        const isOnline = PassionLive.isOnline();
        const { emoji } = PassionLive.getStatus();

        const overlay = document.createElement('div');
        overlay.className = 'welcome-overlay';
        overlay.innerHTML = `
            <div class="welcome-modal">
                <div class="welcome-header">
                    <div class="passion-avatar-container">
                        <img src="${PassionLive.getPortraitImage()}" alt="Passion" class="passion-avatar" />
                        <div class="passion-avatar passion-avatar-fallback" style="display:none; align-items:center; justify-content:center; background: linear-gradient(135deg, #00f0ff, #aa00ff); font-size: 36px; color: #000; font-weight: 900;">P</div>
                    </div>
                    <h2>Hey! I'm Passion</h2>
                    ${isOnline ? `<span style="font-size: 11px; color: rgba(255,255,255,0.5);">${emoji} Currently ${PassionLive.getStateLabel()}</span>` : ''}
                </div>
                <div class="welcome-body">
                    <div class="passion-speech">
                        <div class="passion-speech-text" id="passionGreeting"></div>
                    </div>

                    <div class="welcome-features">
                        <div class="welcome-feature">
                            <span class="feature-icon">📁</span>
                            <span>Explore the <strong>Media Vault</strong> for creative work</span>
                        </div>
                        <div class="welcome-feature">
                            <span class="feature-icon">⚡</span>
                            <span>Check out <strong>Applications</strong> for projects</span>
                        </div>
                        <div class="welcome-feature">
                            <span class="feature-icon">📝</span>
                            <span>View the <strong>About</strong> section to learn more</span>
                        </div>
                    </div>
                </div>
                <div class="welcome-footer">
                    <button class="welcome-btn secondary" id="welcomeClose">I'll explore on my own</button>
                    <button class="welcome-btn primary" id="welcomeTour">Show me around</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Programmatic image error handling — replaces inline onerror (CSP-safe)
        const avatarImg = overlay.querySelector('.passion-avatar-container img');
        if (avatarImg) {
            avatarImg.addEventListener('error', () => {
                avatarImg.style.display = 'none';
                const fallback = avatarImg.nextElementSibling;
                if (fallback) fallback.style.display = 'flex';
            }, { once: true });
        }

        // Animate in
        setTimeout(() => overlay.classList.add('visible'), 10);

        // Type out the greeting
        const greetingEl = overlay.querySelector('#passionGreeting');
        typeText(greetingEl, greeting, 25);

        // Trap focus within the welcome overlay
        const releaseFocus = trapFocus(overlay);

        // Event handlers
        const close = () => {
            releaseFocus();
            overlay.classList.remove('visible');
            setTimeout(() => overlay.remove(), 300);
        };

        overlay.querySelector('#welcomeClose').addEventListener('click', close);
        overlay.querySelector('#welcomeTour').addEventListener('click', () => {
            close();
            this.startTour();
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    },

    /**
     * Start guided tour
     */
    startTour() {
        Tour.start();
    },

    /**
     * Reset the welcome flag (for testing)
     */
    reset() {
        localStorage.removeItem('hasSeenWelcome');
    }
};
