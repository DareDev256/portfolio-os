/**
 * Mobile Detection & Mobile OS Scaffold
 * Detects mobile devices and provides a mobile-optimized interface
 */

export const Mobile = {
    /**
     * Detect if user is on mobile device
     */
    isMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;

        return mobileRegex.test(userAgent) || (isTouchDevice && isSmallScreen);
    },

    /**
     * Initialize mobile-specific features
     */
    init() {
        if (this.isMobile()) {
            this.applyMobileOptimizations();
        }
    },

    /**
     * Apply mobile-specific optimizations
     */
    applyMobileOptimizations() {
        // Add mobile class to body
        document.body.classList.add('mobile-device');

        // Disable certain desktop-only features
        this.disableHoverEffects();

        // Add viewport meta tag if not present
        this.ensureViewportMeta();

        // Add touch-specific CSS
        this.addMobileStyles();
    },

    /**
     * Disable hover effects on mobile
     */
    disableHoverEffects() {
        const style = document.createElement('style');
        style.textContent = `
            @media (hover: none) {
                .desktop-icon:hover,
                .taskbar-window-btn:hover,
                .context-menu-item:hover {
                    transform: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Ensure viewport meta tag exists
     */
    ensureViewportMeta() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content =
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(viewport);
        }
    },

    /**
     * Add mobile-specific styles
     */
    addMobileStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                /* Make windows full-screen on mobile */
                .window:not(.minimized) {
                    width: 100% !important;
                    height: calc(100vh - 100px) !important;
                    left: 0 !important;
                    top: 0 !important;
                    border-radius: 0 !important;
                    max-width: 100%;
                    max-height: calc(100vh - 100px);
                }

                /* Adjust desktop icons for mobile */
                .desktop-icons {
                    grid-template-columns: repeat(3, 1fr) !important;
                    gap: 20px;
                    padding: 20px;
                }

                .desktop-icon {
                    font-size: 12px;
                }

                .desktop-icon-box {
                    width: 50px !important;
                    height: 50px !important;
                }

                .desktop-icon-emoji {
                    font-size: 24px !important;
                }

                /* Adjust dock for mobile */
                .taskbar.dock-style {
                    bottom: 10px;
                    padding: 8px 15px;
                    max-width: 95%;
                }

                .taskbar-window-btn {
                    width: 40px;
                    height: 40px;
                }

                /* Hide certain UI elements on mobile */
                .top-bar-left .version {
                    display: none;
                }

                /* Make context menus touch-friendly */
                .context-menu-item {
                    padding: 15px 20px;
                    font-size: 14px;
                }
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Render mobile OS interface (placeholder)
     */
    renderMobileOS() {
        const container = document.getElementById('desktop');
        if (!container) return;

        // For now, just add a mobile-optimized class
        // Future: Could render a completely different mobile UI here
        container.classList.add('mobile-os');

        // Add a mobile notice if needed
        const notice = document.createElement('div');
        notice.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 240, 255, 0.1);
            border: 1px solid rgba(0, 240, 255, 0.3);
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 11px;
            color: var(--neon-cyan);
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        notice.textContent = 'Mobile-optimized interface active';

        document.body.appendChild(notice);

        // Show notice briefly
        setTimeout(() => {
            notice.style.opacity = '1';
            setTimeout(() => {
                notice.style.opacity = '0';
                setTimeout(() => notice.remove(), 300);
            }, 2000);
        }, 500);
    },
};
