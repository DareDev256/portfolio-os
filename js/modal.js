/**
 * Custom Modal Dialog System
 * Provides beautiful in-app modals for prompts, confirmations, etc.
 */

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
     * Show a password prompt modal
     */
    async prompt(title, message) {
        return new Promise((resolve) => {
            this.container.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-dialog password-modal">
                    <div class="modal-header">
                        <div class="modal-title">${title}</div>
                    </div>
                    <div class="modal-body">
                        <p class="modal-message">${message}</p>
                        <input type="password" class="modal-input" id="modalPasswordInput" placeholder="Enter password..." autocomplete="off">
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn cancel">Cancel</button>
                        <button class="modal-btn confirm">Unlock</button>
                    </div>
                </div>
            `;

            this.container.classList.remove('hidden');

            const input = this.container.querySelector('#modalPasswordInput');
            const confirmBtn = this.container.querySelector('.confirm');
            const cancelBtn = this.container.querySelector('.cancel');
            const overlay = this.container.querySelector('.modal-overlay');

            // Focus input
            setTimeout(() => input.focus(), 100);

            const cleanup = (value) => {
                this.container.classList.add('hidden');
                setTimeout(() => {
                    this.container.innerHTML = '';
                }, 300);
                resolve(value);
            };

            // Handle confirm
            confirmBtn.onclick = () => cleanup(input.value);

            // Handle cancel
            cancelBtn.onclick = () => cleanup(null);
            overlay.onclick = () => cleanup(null);

            // Handle Enter key
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    cleanup(input.value);
                }
                if (e.key === 'Escape') {
                    cleanup(null);
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
                <div class="modal-dialog alert-modal">
                    <div class="modal-header">
                        <div class="modal-title">${title}</div>
                    </div>
                    <div class="modal-body">
                        <p class="modal-message">${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn confirm">OK</button>
                    </div>
                </div>
            `;

            this.container.classList.remove('hidden');

            const confirmBtn = this.container.querySelector('.confirm');
            const overlay = this.container.querySelector('.modal-overlay');

            const cleanup = () => {
                this.container.classList.add('hidden');
                setTimeout(() => {
                    this.container.innerHTML = '';
                }, 300);
                resolve(true);
            };

            confirmBtn.onclick = cleanup;
            overlay.onclick = cleanup;
        });
    }
};
