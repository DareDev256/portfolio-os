import { State } from './state.js';

/**
 * Window Manager
 * Handles window creation, dragging, resizing, minimizing, maximizing, and closing
 * HOW TO EXTEND: Add new window types by creating content generators and calling WindowManager.create()
 */

export const WindowManager = {
    container: null,
    activeWindow: null,
    navigationStack: new Map(), // Track navigation per window

    /**
     * Initialize the window manager
     */
    init() {
        this.container = document.getElementById('windowsContainer');

        // Add keyboard event listener for ESC to close active window
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeWindow) {
                this.close(this.activeWindow.id);
            }
        });
    },

    /**
     * Create a new window
     * @param {Object} options - Window configuration
     */
    create(options) {
        const { id, title, icon, content, width = 600, height = 400, x = null, y = null, transitionType = 'pop' } = options;

        // Check if window already exists
        if (State.getWindow(id)) {
            this.focus(id);
            const win = State.getWindow(id);
            if (win.minimized) {
                this.restore(id);
            }
            return;
        }

        // Create window element
        const windowEl = document.createElement('div');
        windowEl.className = `window transition-${transitionType}`;
        windowEl.id = `window-${id}`;
        windowEl.setAttribute('role', 'dialog');
        windowEl.setAttribute('aria-label', title);

        // Calculate position
        const savedState = State.getWindowState(id);
        let finalX = x;
        let finalY = y;
        let finalWidth = width;
        let finalHeight = height;

        if (savedState && !savedState.maximized) {
            finalX = savedState.x;
            finalY = savedState.y;
            finalWidth = savedState.width;
            finalHeight = savedState.height;
        } else if (finalX === null || finalY === null) {
            // Center window with slight offset for each new window
            const offset = (State.windows.size * 30) % 100;
            finalX = Math.max(50, (window.innerWidth - finalWidth) / 2 + offset);
            finalY = Math.max(80, (window.innerHeight - finalHeight) / 2 + offset - 24); // Account for taskbar, ensure minimum top position
        }

        // Set initial position and size
        windowEl.style.left = `${finalX}px`;
        windowEl.style.top = `${finalY}px`;
        windowEl.style.width = `${finalWidth}px`;
        windowEl.style.height = `${finalHeight}px`;
        windowEl.style.zIndex = State.getNextZIndex();

        // Create titlebar
        const titlebar = this.createTitlebar(id, title, icon);
        windowEl.appendChild(titlebar);

        // Create content area
        const contentEl = document.createElement('div');
        contentEl.className = 'window-content';
        if (typeof content === 'string') {
            contentEl.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            contentEl.appendChild(content);
        }
        windowEl.appendChild(contentEl);

        // Create resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'window-resize';
        resizeHandle.setAttribute('aria-label', 'Resize window');
        windowEl.appendChild(resizeHandle);

        // Add to container
        this.container.appendChild(windowEl);

        // Make window visible with slight delay for animation
        setTimeout(() => {
            windowEl.classList.add('visible');

            // Add holographic scan effect on open
            windowEl.classList.add('window-scan-open');
            setTimeout(() => windowEl.classList.remove('window-scan-open'), 700);
        }, 10);

        // Create window object
        const windowObj = {
            id,
            title,
            icon,
            element: windowEl,
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight,
            minimized: false,
            maximized: savedState?.maximized || false,
        };

        // Register window
        State.registerWindow(id, windowObj);

        // Initialize interactions
        this.initDragging(windowObj, titlebar);
        this.initResizing(windowObj, resizeHandle);

        // Focus the window
        this.focus(id);

        // Add to taskbar
        this.addToTaskbar(windowObj);

        // Apply maximized state if saved
        if (windowObj.maximized) {
            windowEl.classList.add('maximized');
        }

        return windowObj;
    },

    /**
     * Create window titlebar
     */
    createTitlebar(id, title, icon) {
        const titlebar = document.createElement('div');
        titlebar.className = 'window-titlebar';

        // Icon
        if (icon) {
            const iconEl = document.createElement('div');
            iconEl.className = 'window-icon';
            iconEl.innerHTML = icon;
            titlebar.appendChild(iconEl);
        }

        // Navigation container (back button + breadcrumbs)
        const navigation = document.createElement('div');
        navigation.className = 'window-navigation';
        navigation.innerHTML = `
            <button class="nav-back-btn" style="display: none;" title="Back">
                ←
            </button>
            <div class="breadcrumbs"></div>
        `;

        // Back button handler
        const backBtn = navigation.querySelector('.nav-back-btn');
        backBtn.addEventListener('click', () => {
            const previous = this.popNavigation(id);
            if (previous && previous.callback) {
                previous.callback();
            }
        });

        titlebar.appendChild(navigation);

        // Title
        const titleEl = document.createElement('div');
        titleEl.className = 'window-title';
        titleEl.textContent = title;
        titlebar.appendChild(titleEl);

        // Controls
        const controls = document.createElement('div');
        controls.className = 'window-controls';

        // Minimize button
        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'window-control-btn minimize';
        minimizeBtn.setAttribute('aria-label', 'Minimize');
        minimizeBtn.innerHTML = `
            <svg viewBox="0 0 12 12" fill="currentColor">
                <rect x="0" y="5" width="12" height="2"/>
            </svg>
        `;
        minimizeBtn.onclick = () => this.minimize(id);
        controls.appendChild(minimizeBtn);

        // Maximize button
        const maximizeBtn = document.createElement('button');
        maximizeBtn.className = 'window-control-btn maximize';
        maximizeBtn.setAttribute('aria-label', 'Maximize');
        maximizeBtn.innerHTML = `
            <svg viewBox="0 0 12 12" fill="currentColor">
                <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"/>
            </svg>
        `;
        maximizeBtn.onclick = () => this.toggleMaximize(id);
        controls.appendChild(maximizeBtn);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'window-control-btn close';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.innerHTML = `
            <svg viewBox="0 0 12 12" fill="currentColor">
                <path d="M1 1 L11 11 M11 1 L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
        closeBtn.onclick = () => this.close(id);
        controls.appendChild(closeBtn);

        titlebar.appendChild(controls);

        return titlebar;
    },

    /**
     * Initialize window dragging
     */
    initDragging(windowObj, titlebar) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        const onPointerDown = (e) => {
            if (e.target.closest('.window-controls')) return;
            if (windowObj.maximized) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = windowObj.x;
            initialY = windowObj.y;

            this.focus(windowObj.id);

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
            e.preventDefault();
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            windowObj.x = initialX + dx;
            windowObj.y = initialY + dy;

            // Constrain to viewport
            windowObj.x = Math.max(0, Math.min(windowObj.x, window.innerWidth - 100));
            windowObj.y = Math.max(0, Math.min(windowObj.y, window.innerHeight - 100));

            windowObj.element.style.left = `${windowObj.x}px`;
            windowObj.element.style.top = `${windowObj.y}px`;
        };

        const onPointerUp = () => {
            isDragging = false;
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
            State.saveWindowStates();
        };

        titlebar.addEventListener('pointerdown', onPointerDown);

        // Double-click to maximize
        titlebar.addEventListener('dblclick', (e) => {
            if (e.target.closest('.window-controls')) return;
            this.toggleMaximize(windowObj.id);
        });
    },

    /**
     * Initialize window resizing
     */
    initResizing(windowObj, handle) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        const onPointerDown = (e) => {
            if (windowObj.maximized) return;

            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = windowObj.width;
            startHeight = windowObj.height;

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
            e.preventDefault();
            e.stopPropagation();
        };

        const onPointerMove = (e) => {
            if (!isResizing) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            windowObj.width = Math.max(320, startWidth + dx);
            windowObj.height = Math.max(240, startHeight + dy);

            windowObj.element.style.width = `${windowObj.width}px`;
            windowObj.element.style.height = `${windowObj.height}px`;
        };

        const onPointerUp = () => {
            isResizing = false;
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
            State.saveWindowStates();
        };

        handle.addEventListener('pointerdown', onPointerDown);
    },

    /**
     * Focus a window
     */
    focus(id) {
        const windowObj = State.getWindow(id);
        if (!windowObj || windowObj.minimized) return;

        // Remove active class from all windows
        State.getAllWindows().forEach((win) => {
            if (win.element) {
                win.element.classList.remove('active');
            }
        });

        // Add active class to this window
        windowObj.element.classList.add('active');
        windowObj.element.style.zIndex = State.getNextZIndex();

        // Update taskbar
        this.updateTaskbar();

        this.activeWindow = windowObj;
    },

    /**
     * Minimize a window
     */
    minimize(id) {
        const windowObj = State.getWindow(id);
        if (!windowObj) return;

        windowObj.minimized = true;
        windowObj.element.classList.add('minimized');
        this.updateTaskbar();
        State.saveWindowStates();

        // Focus another window if available
        const otherWindows = State.getAllWindows().filter((w) => !w.minimized && w.id !== id);
        if (otherWindows.length > 0) {
            this.focus(otherWindows[otherWindows.length - 1].id);
        }
    },

    /**
     * Restore a minimized window
     */
    restore(id) {
        const windowObj = State.getWindow(id);
        if (!windowObj) return;

        windowObj.minimized = false;
        windowObj.element.classList.remove('minimized');
        this.focus(id);
        State.saveWindowStates();
    },

    /**
     * Toggle maximize state
     */
    toggleMaximize(id) {
        const windowObj = State.getWindow(id);
        if (!windowObj) return;

        windowObj.maximized = !windowObj.maximized;

        if (windowObj.maximized) {
            windowObj.element.classList.add('maximized');
        } else {
            windowObj.element.classList.remove('maximized');
        }

        State.saveWindowStates();
    },

    /**
     * Push navigation state
     */
    pushNavigation(windowId, state) {
        if (!this.navigationStack.has(windowId)) {
            this.navigationStack.set(windowId, []);
        }
        this.navigationStack.get(windowId).push(state);
        this.updateNavigationUI(windowId);
    },

    /**
     * Pop navigation state (go back)
     */
    popNavigation(windowId) {
        const stack = this.navigationStack.get(windowId);
        if (stack && stack.length > 0) {
            const previous = stack.pop();
            this.updateNavigationUI(windowId);
            return previous;
        }
        return null;
    },

    /**
     * Update navigation UI (back button + breadcrumbs)
     */
    updateNavigationUI(windowId) {
        const win = State.getWindow(windowId);
        if (!win || !win.element) return;

        const stack = this.navigationStack.get(windowId) || [];
        const navContainer = win.element.querySelector('.window-navigation');
        if (!navContainer) return;

        // Update back button visibility
        const backBtn = navContainer.querySelector('.nav-back-btn');
        if (backBtn) {
            backBtn.style.display = stack.length > 0 ? 'flex' : 'none';
        }

        // Update breadcrumbs
        const breadcrumbs = navContainer.querySelector('.breadcrumbs');
        if (breadcrumbs && stack.length > 0) {
            breadcrumbs.innerHTML = stack
                .map(
                    (item, idx) =>
                        `<span class="breadcrumb-item ${idx === stack.length - 1 ? 'active' : ''}">${item.label}</span>`
                )
                .join('<span class="breadcrumb-separator">›</span>');
        }
    },

    /**
     * Close a window
     */
    close(id) {
        const windowObj = State.getWindow(id);
        if (!windowObj) return;

        // Add glitch closing animation
        windowObj.element.classList.add('closing');
        windowObj.element.classList.add('window-glitch-close');

        // Remove after animation completes
        setTimeout(() => {
            windowObj.element.remove();
            State.unregisterWindow(id);
            this.removeFromTaskbar(id);

            if (this.activeWindow?.id === id) {
                this.activeWindow = null;
                // Focus another window if available
                const otherWindows = State.getAllWindows().filter((w) => !w.minimized);
                if (otherWindows.length > 0) {
                    this.focus(otherWindows[otherWindows.length - 1].id);
                }
            }
        }, 350); // Extended for glitch animation
    },

    /**
     * Add window to taskbar
     */
    addToTaskbar(windowObj) {
        const taskbarWindows = document.getElementById('taskbarWindows');

        const btn = document.createElement('button');
        btn.className = 'taskbar-window-btn';
        btn.id = `taskbar-${windowObj.id}`;
        btn.setAttribute('role', 'listitem');
        btn.setAttribute('aria-label', `Switch to ${windowObj.title}`);

        if (windowObj.icon) {
            const iconEl = document.createElement('div');
            iconEl.innerHTML = windowObj.icon;
            btn.appendChild(iconEl);
        }

        const label = document.createElement('span');
        label.textContent = windowObj.title;
        btn.appendChild(label);

        btn.onclick = () => {
            if (windowObj.minimized) {
                this.restore(windowObj.id);
            } else if (this.activeWindow?.id === windowObj.id) {
                this.minimize(windowObj.id);
            } else {
                this.focus(windowObj.id);
            }
        };

        taskbarWindows.appendChild(btn);
        this.updateTaskbar();
    },

    /**
     * Remove window from taskbar
     */
    removeFromTaskbar(id) {
        const btn = document.getElementById(`taskbar-${id}`);
        if (btn) {
            btn.remove();
        }
    },

    /**
     * Update taskbar button states
     */
    updateTaskbar() {
        State.getAllWindows().forEach((win) => {
            const btn = document.getElementById(`taskbar-${win.id}`);
            if (btn) {
                btn.classList.toggle('active', this.activeWindow?.id === win.id && !win.minimized);
                btn.classList.toggle('minimized', win.minimized);
            }
        });
    },
};
