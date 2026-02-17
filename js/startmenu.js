import { Desktop } from './desktop.js';
import { AudioFX } from './audiofx.js';
import { Welcome } from './welcome.js';
import { Sanitize } from './sanitize.js';

/**
 * Start Menu
 * Handles start menu open/close and navigation
 */

export const StartMenu = {
    menu: null,
    button: null,
    isOpen: false,
    _eventsInitialized: false, // ensure event handlers bound only once

    /**
     * Initialize start menu
     */
    init() {
        this.menu = document.getElementById('startMenu');
        this.button = document.getElementById('startButton');

        if (!this.menu) return; // No menu to manage

        // Render menu items each time (if items changed)
        this.renderMenuItems();
        // Initialize event listeners only once
        if (!this._eventsInitialized) {
            this.initEvents();
            this._eventsInitialized = true;
        }
    },

    /**
     * Render menu items from desktop items
     */
    renderMenuItems() {
        if (!this.menu) return;
        const container = this.menu.querySelector('.start-menu-items');
        if (!container) return;
        container.innerHTML = '';

        Desktop.DESKTOP_ITEMS.forEach((item) => {
            const menuItem = document.createElement('button');
            menuItem.className = 'start-menu-item';
            menuItem.setAttribute('role', 'menuitem');
            menuItem.setAttribute('tabindex', this.isOpen ? '0' : '-1');

            const iconSpan = document.createElement('span');
            Sanitize.setHTML(iconSpan, item.icon);
            menuItem.appendChild(iconSpan);
            const labelSpan = document.createElement('span');
            labelSpan.textContent = item.label;
            menuItem.appendChild(labelSpan);

            menuItem.onclick = () => {
                if (AudioFX) AudioFX.click();
                item.action();
                this.close();
            };

            // Keyboard navigation
            menuItem.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (AudioFX) AudioFX.click();
                    item.action();
                    this.close();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const next = menuItem.nextElementSibling;
                    if (next) next.focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prev = menuItem.previousElementSibling;
                    if (prev) prev.focus();
                }
            });

            container.appendChild(menuItem);
        });

        // Add System Options Separator
        const separator = document.createElement('div');
        separator.style.height = '1px';
        separator.style.background = 'rgba(255, 255, 255, 0.1)';
        separator.style.margin = '8px 0';
        container.appendChild(separator);

        // System Options
        const systemOptions = [
            { label: 'Restart System', icon: '↻', action: () => window.location.reload() },
            {
                label: 'Shut Down', icon: '⏻', action: () => {
                    // Clear DOM safely without innerHTML to prevent XSS patterns
                    while (document.body.firstChild) document.body.firstChild.remove();
                    document.body.style.background = 'black';
                    document.body.style.display = 'flex';
                    document.body.style.alignItems = 'center';
                    document.body.style.justifyContent = 'center';
                    document.body.style.color = '#00f0ff';
                    document.body.style.fontFamily = 'monospace';
                    document.body.style.flexDirection = 'column';
                    const h1 = document.createElement('h1');
                    h1.textContent = 'SYSTEM HALTED';
                    const p = document.createElement('p');
                    p.textContent = 'It is now safe to turn off your computer.';
                    document.body.append(h1, p);
                }
            }
        ];

        systemOptions.forEach(opt => {
            const item = document.createElement('button');
            item.className = 'start-menu-item';
            item.textContent = opt.icon + ' ';
            const optLabel = document.createElement('span');
            optLabel.textContent = opt.label;
            item.appendChild(optLabel);
            item.onclick = () => opt.action();
            container.appendChild(item);
        });
    },

    /**
     * Initialize events
     */
    initEvents() {
        // Start button click
        if (this.button) {
            this.button.addEventListener('click', (e) => {
                e.stopPropagation();
                // Show welcome tutorial instead of opening menu
                Welcome.show();
            });
        }

        // Lock button
        const lockBtn = document.getElementById('lockButton');
        if (lockBtn) {
            lockBtn.addEventListener('click', () => {
                if (AudioFX) AudioFX.click();
                this.close();
                window.dispatchEvent(new CustomEvent('system-lock'));
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.menu && !this.menu.contains(e.target) && e.target !== this.button) {
                this.close();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Close on Escape
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    /**
     * Toggle start menu
     */
    toggle() {
        if (AudioFX) AudioFX.click();
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    /**
     * Open start menu
     */
    open() {
        if (!this.menu) return;
        this.isOpen = true;
        this.menu.classList.remove('hidden');
        if (this.button) this.button.setAttribute('aria-expanded', 'true');

        // Enable tab navigation
        const menuItems = this.menu.querySelectorAll('.start-menu-item');
        menuItems.forEach((item) => item.setAttribute('tabindex', '0'));

        // Focus first menu item
        if (menuItems.length > 0) {
            menuItems[0].focus();
        }
    },

    /**
     * Close start menu
     */
    close() {
        if (!this.menu) return;
        this.isOpen = false;
        this.menu.classList.add('hidden');
        if (this.button) this.button.setAttribute('aria-expanded', 'false');

        // Disable tab navigation
        const menuItems = this.menu.querySelectorAll('.start-menu-item');
        menuItems.forEach((item) => item.setAttribute('tabindex', '-1'));
    },
};
