import { Tour } from './tour.js';
import { trapFocus } from './focus-trap.js';

/**
 * Welcome Tutorial Module
 * Shows a friendly introduction when user clicks Start button
 */

export const Welcome = {
    /**
     * Show the welcome tutorial modal
     */
    show() {
        const overlay = document.createElement('div');
        overlay.className = 'welcome-overlay';
        overlay.innerHTML = `
            <div class="welcome-modal">
                <div class="welcome-header">
                    <div class="welcome-icon">👋</div>
                    <h2>Hey! I'm Passion</h2>
                </div>
                <div class="welcome-body">
                    <p class="welcome-intro">Welcome to James's interactive portfolio!</p>
                    <p>I'm here to guide you through this cyberpunk OS experience.</p>
                    
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

                    <p class="welcome-cta">Ready to dive in? Let's go!</p>
                </div>
                <div class="welcome-footer">
                    <button class="welcome-btn secondary" id="welcomeClose">Got it!</button>
                    <button class="welcome-btn primary" id="welcomeTour">Show me around</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Animate in
        setTimeout(() => overlay.classList.add('visible'), 10);

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
        // Start the spotlight tour
        Tour.start();
    },

    /**
     * Reset the welcome flag (for testing)
     */
    reset() {
        localStorage.removeItem('hasSeenWelcome');
    }
};
