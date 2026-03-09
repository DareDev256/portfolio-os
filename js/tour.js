/**
 * Spotlight Tour System
 * Guides users through key areas of the portfolio with spotlight highlights.
 * Passion narrates each step with live commentary or offline fallback quips.
 */
import { trapFocus } from './focus-trap.js';
import { PassionLive } from './passion-live.js';

export const Tour = {
    currentStep: 0,
    steps: [],
    overlay: null,
    spotlight: null,
    tooltip: null,
    isActive: false,
    _focusTrapCleanup: null,

    /**
     * Define tour stops
     */
    TOUR_STEPS: [
        {
            id: 'welcome',
            title: 'Welcome to My Portfolio',
            description: 'This is an interactive desktop experience. Let me show you around!',
            target: null,
            position: 'center'
        },
        {
            id: 'about',
            title: 'About Me',
            description: 'Start here to learn about who I am, my background, and what drives me.',
            target: '[data-icon-id="about"]',
            position: 'right'
        },
        {
            id: 'dock',
            title: 'The Dock',
            description: 'Quick access to key apps - just like macOS. Click any icon to launch.',
            target: '.taskbar.dock-style',
            position: 'top'
        },
        {
            id: 'resume',
            title: 'Resume',
            description: 'View my professional experience, skills, and download my resume.',
            target: '[data-icon-id="resume"]',
            position: 'right'
        },
        {
            id: 'applications',
            title: 'Applications',
            description: 'Check out my projects and live demos. This is where the real work lives!',
            target: '[data-icon-id="applications"]',
            position: 'left'
        }
    ],

    /**
     * Start the tour
     */
    start() {
        if (this.isActive) return;

        // Ensure PassionLive is initialized
        if (!PassionLive.state) PassionLive.init();

        this.isActive = true;
        this.currentStep = 0;
        this.steps = [...this.TOUR_STEPS];

        this.createOverlay();
        this._focusTrapCleanup = trapFocus(this.overlay);
        this.showStep(0);
    },

    /**
     * Create the tour overlay elements
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'tour-overlay';
        this.overlay.innerHTML = `
            <div class="tour-backdrop"></div>
            <div class="tour-spotlight"></div>
            <div class="tour-tooltip">
                <div class="tour-tooltip-header">
                    <span class="tour-step-indicator"></span>
                    <button class="tour-close" aria-label="Close tour">&times;</button>
                </div>
                <h3 class="tour-title"></h3>
                <p class="tour-description"></p>
                <div class="tour-passion-row">
                    <img src="${PassionLive.getPortraitImage()}" alt="Passion" class="passion-avatar" />
                    <span class="tour-passion-quip"></span>
                </div>
                <div class="tour-actions">
                    <button class="tour-btn tour-skip">Skip Tour</button>
                    <button class="tour-btn tour-next primary">Next</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        // Programmatic image error handling — replaces inline onerror (CSP-safe)
        const avatarImg = this.overlay.querySelector('.tour-passion-row .passion-avatar');
        if (avatarImg) {
            avatarImg.addEventListener('error', () => { avatarImg.style.display = 'none'; }, { once: true });
        }

        // Get references
        this.spotlight = this.overlay.querySelector('.tour-spotlight');
        this.tooltip = this.overlay.querySelector('.tour-tooltip');

        // Event listeners
        this.overlay.querySelector('.tour-close').addEventListener('click', () => this.end());
        this.overlay.querySelector('.tour-skip').addEventListener('click', () => this.end());
        this.overlay.querySelector('.tour-next').addEventListener('click', () => this.next());

        // Animate in
        requestAnimationFrame(() => {
            this.overlay.classList.add('visible');
        });
    },

    /**
     * Show a specific step
     */
    showStep(index) {
        if (index >= this.steps.length) {
            this.end();
            return;
        }

        const step = this.steps[index];
        this.currentStep = index;

        // Update tooltip content
        this.tooltip.querySelector('.tour-step-indicator').textContent = `${index + 1} of ${this.steps.length}`;
        this.tooltip.querySelector('.tour-title').textContent = step.title;
        this.tooltip.querySelector('.tour-description').textContent = step.description;

        // Update Passion quip for this step
        const quipEl = this.tooltip.querySelector('.tour-passion-quip');
        quipEl.textContent = PassionLive.getTourQuip(step.id);

        // Update button text for last step
        const nextBtn = this.tooltip.querySelector('.tour-next');
        nextBtn.textContent = index === this.steps.length - 1 ? 'Get Started!' : 'Next';

        // Position spotlight and tooltip
        if (step.target) {
            const targetEl = document.querySelector(step.target);
            if (targetEl) {
                this.highlightElement(targetEl, step.position);
            } else {
                this.centerTooltip();
            }
        } else {
            this.centerTooltip();
        }
    },

    /**
     * Highlight a specific element
     */
    highlightElement(element, tooltipPosition) {
        const rect = element.getBoundingClientRect();
        const padding = 15;

        // Position spotlight
        this.spotlight.style.opacity = '1';
        this.spotlight.style.left = `${rect.left - padding}px`;
        this.spotlight.style.top = `${rect.top - padding}px`;
        this.spotlight.style.width = `${rect.width + padding * 2}px`;
        this.spotlight.style.height = `${rect.height + padding * 2}px`;

        // Add pulse animation to target
        element.classList.add('tour-highlight');

        // Position tooltip
        const tooltipRect = this.tooltip.getBoundingClientRect();
        let tooltipX, tooltipY;

        switch (tooltipPosition) {
            case 'right':
                tooltipX = rect.right + 20;
                tooltipY = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                break;
            case 'left':
                tooltipX = rect.left - tooltipRect.width - 20;
                tooltipY = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                break;
            case 'top':
                tooltipX = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                tooltipY = rect.top - tooltipRect.height - 20;
                break;
            case 'bottom':
                tooltipX = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                tooltipY = rect.bottom + 20;
                break;
            default:
                tooltipX = window.innerWidth / 2 - tooltipRect.width / 2;
                tooltipY = window.innerHeight / 2 - tooltipRect.height / 2;
        }

        // Keep tooltip in viewport
        tooltipX = Math.max(20, Math.min(tooltipX, window.innerWidth - tooltipRect.width - 20));
        tooltipY = Math.max(60, Math.min(tooltipY, window.innerHeight - tooltipRect.height - 20));

        this.tooltip.style.left = `${tooltipX}px`;
        this.tooltip.style.top = `${tooltipY}px`;
        this.tooltip.style.transform = 'none';
    },

    /**
     * Center the tooltip (for intro step)
     */
    centerTooltip() {
        this.spotlight.style.opacity = '0';
        this.tooltip.style.left = '50%';
        this.tooltip.style.top = '50%';
        this.tooltip.style.transform = 'translate(-50%, -50%)';
    },

    /**
     * Go to next step
     */
    next() {
        // Remove highlight from current element
        const currentStep = this.steps[this.currentStep];
        if (currentStep.target) {
            const el = document.querySelector(currentStep.target);
            if (el) el.classList.remove('tour-highlight');
        }

        this.showStep(this.currentStep + 1);
    },

    /**
     * End the tour
     */
    end() {
        if (!this.overlay) return;

        // Release focus trap
        if (this._focusTrapCleanup) {
            this._focusTrapCleanup();
            this._focusTrapCleanup = null;
        }

        // Remove any highlights
        document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
        });

        // Animate out
        this.overlay.classList.remove('visible');

        setTimeout(() => {
            this.overlay.remove();
            this.overlay = null;
            this.spotlight = null;
            this.tooltip = null;
            this.isActive = false;
        }, 300);
    }
};
