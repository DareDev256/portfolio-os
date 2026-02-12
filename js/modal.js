/**
 * Custom Modal Dialog System
 * Provides beautiful in-app modals for prompts, confirmations, etc.
 */
import { Sanitize } from './sanitize.js';
import { trapFocus } from './focus-trap.js';

export const Modal = {
    container: null,

    /**
     * Initialize modal system
     */
    init() {
        // Create modal container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'modalContainer';
            this.container.className = 'modal-container hidden';
            document.body.appendChild(this.container);
        }
    },

    /**
     * Create a dismiss handler that releases focus, hides the modal, and resolves the promise.
     * Shared between prompt() and alert() to eliminate duplicated cleanup logic.
     */
    _createDismiss(releaseFocus, resolve) {
        return (value = true) => {
            releaseFocus();
            this.container.classList.add('hidden');
            setTimeout(() => {
                this.container.innerHTML = '';
            }, 300);
            resolve(value);
        };
    },

    /**
     * Show a password prompt modal
     */
    async prompt(title, message) {
        return new Promise((resolve) => {
            this.container.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-dialog password-modal" role="dialog" aria-modal="true">
                    <div class="modal-header">
                        <div class="modal-title">${Sanitize.text(title)}</div>
                    </div>
                    <div class="modal-body">
                        <p class="modal-message">${Sanitize.html(message)}</p>
                        <input type="password" class="modal-input" id="modalPasswordInput" placeholder="Enter password..." autocomplete="off">
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn cancel">Cancel</button>
                        <button class="modal-btn confirm">Unlock</button>
                    </div>
                </div>
            `;

            this.container.classList.remove('hidden');

            const modalDialog = this.container.querySelector('.modal-dialog');
            const releaseFocus = trapFocus(modalDialog);
            const dismiss = this._createDismiss(releaseFocus, resolve);

            const input = this.container.querySelector('#modalPasswordInput');
            const confirmBtn = this.container.querySelector('.confirm');
            const cancelBtn = this.container.querySelector('.cancel');
            const overlay = this.container.querySelector('.modal-overlay');

            // Focus input
            setTimeout(() => input.focus(), 100);

            // Handle confirm
            confirmBtn.onclick = () => dismiss(input.value);

            // Handle cancel
            cancelBtn.onclick = () => dismiss(null);
            overlay.onclick = () => dismiss(null);

            // Handle Enter key
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    dismiss(input.value);
                }
                if (e.key === 'Escape') {
                    dismiss(null);
                }
            });
        });
    },

    /**
     * Show an alert modal
     */
    async alert(title, message) {
        return new Promise((resolve) => {
            this.container.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-dialog alert-modal" role="dialog" aria-modal="true">
                    <div class="modal-header">
                        <div class="modal-title">${Sanitize.text(title)}</div>
                    </div>
                    <div class="modal-body">
                        <p class="modal-message">${Sanitize.html(message)}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn confirm">OK</button>
                    </div>
                </div>
            `;

            this.container.classList.remove('hidden');

            const modalDialog = this.container.querySelector('.modal-dialog');
            const releaseFocus = trapFocus(modalDialog);
            const dismiss = this._createDismiss(releaseFocus, resolve);

            const confirmBtn = this.container.querySelector('.confirm');
            const overlay = this.container.querySelector('.modal-overlay');

            confirmBtn.onclick = dismiss;
            overlay.onclick = dismiss;
        });
    }
};
