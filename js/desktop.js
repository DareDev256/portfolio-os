import { WindowManager } from './windows.js';
import { State } from './state.js';
import { Lightbox } from './lightbox.js';
import { Modal } from './modal.js';
import { PixelLoader } from './loader.js';
import { SkillsUniverse } from './skills.js';
import { GitHub } from './github.js';
import { Terminal } from './terminal.js';

/**
 * Desktop Manager
 * Handles desktop icons, context menu, wallpaper, and theme
 * HOW TO EXTEND: Add new icons to the DESKTOP_ITEMS array
 */

export const Desktop = {
    contextMenu: null,

    // Wallpaper configurations
    WALLPAPERS: [
        '/assets/wallpapers/default.jpg',
        'gradient:grey-ombre',
        'https://images.unsplash.com/photo-1557683316-973673baf926',
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
        'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5',
        'https://images.unsplash.com/photo-1557682260-96773eb01377',
    ],

    // Desktop item configurations
    DESKTOP_ITEMS: [
        {
            id: 'media',
            label: 'MEDIA_VAULT',
            icon: '📁',
            color: '#00f0ff',
            action: () => Desktop.openMediaVault(),
        },
        {
            id: 'applications',
            label: 'APPLICATIONS',
            icon: '⚡',
            color: '#ff00aa',
            action: () => Desktop.openApplicationsShowcase(),
        },
        {
            id: 'skills',
            label: 'SKILLS_MATRIX',
            icon: '🕸️',
            color: '#00f0ff',
            action: () => Desktop.openSkills(),
        },
        {
            id: 'terminal',
            label: 'DEV_TERMINAL',
            icon: '▶',
            color: '#00ff88',
            action: () => Desktop.openTerminal(),
        },
        {
            id: 'resume',
            label: 'RESUME',
            icon: '📄',
            color: '#ffaa00',
            action: () => Desktop.openResume(),
        },
        {
            id: 'about',
            label: 'ABOUT_ME.exe',
            icon: '◈',
            color: '#aa00ff',
            action: () => Desktop.openAbout(),
        },
        {
            id: 'contact',
            label: 'CONNECT',
            icon: '◉',
            color: '#ff0066',
            action: () => Desktop.openContact(),
        },
        {
            id: 'showcase',
            label: 'SHOWCASE.mp4',
            icon: '🎬',
            color: '#FF0000',
            action: () => Desktop.openFeaturedVideo(),
        },
        {
            id: 'github',
            label: 'GITHUB_OPS',
            icon: '💻', // Using a generic computer icon as placeholder if FontAwesome isn't available, but standard unicode works
            color: '#ffffff',
            action: () => Desktop.openGitHubCenter(),
        },
        {
            id: 'linkedin',
            label: 'LINKEDIN',
            icon: '👔',
            color: '#0077b5',
            action: () => window.open('https://www.linkedin.com', '_blank'), // User can update this link later
        },
        {
            id: 'settings',
            label: 'SETTINGS',
            icon: '⚙',
            color: '#00BCD4',
            action: () => Desktop.openSettings(),
        },
    ],

    /**
     * Initialize desktop
     */
    init() {
        this.renderIcons();
        this.initDock(); // Initialize Dock
        this.initContextMenu();
        this.initDesktopEvents();

        // Visual Juice
        setTimeout(() => {
            this.animateWatermark();
            if (State.soundEnabled) this.playStartupSound();
        }, 1000);
    },

    /**
     * Initialize Dock (pinned apps)
     */
    initDock() {
        const dockContainer = document.getElementById('dockLaunchers');
        if (!dockContainer) return;

        dockContainer.innerHTML = '';

        // User requested Key Apps for the Dock:
        // Skills Matrix, GitHub Ops, Applications, About Me
        // plus Developer Console (Terminal) as a bonus for power users
        const dockIds = ['about', 'skills', 'github', 'applications', 'terminal'];

        dockIds.forEach(id => {
            const item = this.DESKTOP_ITEMS.find(i => i.id === id);
            if (item) {
                const btn = document.createElement('button');
                btn.className = 'dock-icon';
                btn.setAttribute('aria-label', item.label);
                btn.title = item.label; // Tooltip

                // Use emoji icon
                btn.innerHTML = `<span class="dock-icon-emoji">${item.icon}</span>`;

                // Add click handler
                btn.onclick = () => {
                    // Bounce animation
                    btn.classList.add('bouncing');
                    setTimeout(() => btn.classList.remove('bouncing'), 1000);
                    item.action();
                };

                dockContainer.appendChild(btn);
            }
        });

        // Add Start Button (Passion OS Logo)
        const startBtn = document.createElement('button');
        startBtn.className = 'taskbar-window-btn dock-icon start-btn';
        startBtn.id = 'startButton';
        startBtn.setAttribute('aria-label', 'Start Menu');
        startBtn.title = 'Start';
        startBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        startBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';

        startBtn.innerHTML = `
            <span class="dock-icon-emoji" style="font-size: 22px;">◈</span>
        `;

        // Prepend to dock
        dockContainer.insertBefore(startBtn, dockContainer.firstChild);
    },

    /**
     * Render desktop icons
     */
    /**
     * Render desktop icons with drag support
     */
    renderIcons() {
        const container = document.querySelector('.desktop-icons');
        container.innerHTML = '';

        // Load saved positions
        const savedLayout = JSON.parse(localStorage.getItem('desktop_layout') || '{}');

        // Default starting position
        let defaultTop = 60;
        const defaultLeft = 30;
        const gap = 110; // Icon height + spacing

        this.DESKTOP_ITEMS.forEach((item, index) => {
            const icon = document.createElement('button');
            icon.className = 'desktop-icon';
            icon.setAttribute('role', 'button');
            icon.setAttribute('aria-label', `Open ${item.label}`);
            icon.setAttribute('tabindex', '0');
            icon.style.color = item.color;
            icon.dataset.iconId = item.id;

            // Position Logic
            if (savedLayout[item.id]) {
                icon.style.top = `${savedLayout[item.id].y}px`;
                icon.style.left = `${savedLayout[item.id].x}px`;
            } else {
                // Fallback to column layout
                icon.style.top = `${defaultTop + (index * gap)}px`;
                icon.style.left = `${defaultLeft}px`;
            }

            icon.innerHTML = `
                <div class="desktop-icon-box" style="border-color: ${item.color}40; box-shadow: 0 0 20px ${item.color}20;">
                    <span class="desktop-icon-emoji">${item.icon}</span>
                </div>
                <span class="desktop-icon-label" style="color: ${item.color};">${item.label}</span>
            `;

            // Initialize Drag
            this.initDrag(icon, item.id);

            // Click to open (needs check to prevent opening after drag)
            icon.addEventListener('click', (e) => {
                if (icon.dataset.isDragging === 'true') return;
                item.action();
            });

            // Enter key to open
            icon.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    item.action();
                }
            });

            // Right-click context menu
            icon.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showIconContextMenu(e.clientX, e.clientY, item);
            });

            container.appendChild(icon);
        });
    },

    /**
     * Initialize drag functionality for an icon
     */
    initDrag(element, id) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        element.addEventListener('mousedown', (e) => {
            // Only left click triggers drag
            if (e.button !== 0) return;

            isDragging = false; // Not dragging yet, just clicked
            element.dataset.isDragging = 'false';

            startX = e.clientX;
            startY = e.clientY;

            // Get current computed position
            const style = window.getComputedStyle(element);
            initialLeft = parseInt(style.left || 0);
            initialTop = parseInt(style.top || 0);

            const onMouseMove = (e) => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                // Threshold to start dragging (prevents accidental micro-moves)
                if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                    isDragging = true;
                    element.dataset.isDragging = 'true';
                    element.style.zIndex = '1000'; // Bring to front while dragging
                }

                if (isDragging) {
                    element.style.left = `${initialLeft + dx}px`;
                    element.style.top = `${initialTop + dy}px`;
                }
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);

                if (isDragging) {
                    element.style.zIndex = ''; // Reset z-index

                    // Save new position
                    const currentLayout = JSON.parse(localStorage.getItem('desktop_layout') || '{}');
                    currentLayout[id] = {
                        x: parseInt(element.style.left),
                        y: parseInt(element.style.top)
                    };
                    localStorage.setItem('desktop_layout', JSON.stringify(currentLayout));

                    // Small timeout to reset dragging flag so click event doesn't fire immediately
                    setTimeout(() => {
                        element.dataset.isDragging = 'false';
                    }, 50);
                }
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    },

    /**
     * Initialize context menu
     */
    initContextMenu() {
        this.contextMenu = document.getElementById('contextMenu');

        // Close context menu when clicking outside
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
    },

    /**
     * Initialize desktop events
     */
    initDesktopEvents() {
        const desktop = document.getElementById('desktop');

        // Right-click for context menu
        desktop.addEventListener('contextmenu', (e) => {
            // Only show if clicking on desktop, not on windows or icons
            if (e.target === desktop || e.target.classList.contains('desktop-icons')) {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY);
            }
        });

        // Long press for mobile
        let longPressTimer;
        desktop.addEventListener('touchstart', (e) => {
            if (e.target === desktop || e.target.classList.contains('desktop-icons')) {
                longPressTimer = setTimeout(() => {
                    const touch = e.touches[0];
                    this.showContextMenu(touch.clientX, touch.clientY);
                }, 500);
            }
        });

        desktop.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });

        desktop.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer);
        });
    },

    /**
     * Show context menu
     */
    showContextMenu(x, y) {
        this.contextMenu.innerHTML = `
            <button class="context-menu-item" id="changeWallpaper">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <span>Next Wallpaper</span>
            </button>
            <button class="context-menu-item" id="randomWallpaper">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                </svg>
                <span>Random Wallpaper</span>
            </button>
            <button class="context-menu-item" id="resetWallpaper">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5 0 2.21-1.79 4-4 4H7v2h6c3.87 0 7-3.13 7-7s-3.13-7-7-7z"/>
                </svg>
                <span>Reset to Default</span>
            </button>
            <button class="context-menu-item" id="applyGreyGradient">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 12h20v2H2zM2 7h20v2H2zM2 17h20v2H2z"/>
                </svg>
                <span>Apply Grey Gradient</span>
            </button>
            <button class="context-menu-item" id="toggleThemeContext">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
                </svg>
                <span>Toggle Theme</span>
            </button>
        `;

        // Position context menu
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.classList.remove('hidden');

        // Add event listeners
        document.getElementById('changeWallpaper').onclick = (e) => {
            e.stopPropagation();
            this.changeWallpaper();
            this.hideContextMenu();
        };

        document.getElementById('randomWallpaper').onclick = (e) => {
            e.stopPropagation();
            this.randomWallpaper();
            this.hideContextMenu();
        };

        const resetBtn = document.getElementById('resetWallpaper');
        if (resetBtn) {
            resetBtn.onclick = (e) => {
                e.stopPropagation();
                State.resetWallpaper();
                this.hideContextMenu();
            };
        }

        const applyGreyGradient = document.getElementById('applyGreyGradient');
        if (applyGreyGradient) {
            applyGreyGradient.onclick = (e) => {
                e.stopPropagation();
                State.setWallpaper('gradient:grey-ombre');
                this.hideContextMenu();
            };
        }

        document.getElementById('toggleThemeContext').onclick = (e) => {
            e.stopPropagation();
            State.toggleTheme();
            this.hideContextMenu();
        };
    },

    /**
     * Show icon-specific context menu
     */
    showIconContextMenu(x, y, item) {
        this.contextMenu.innerHTML = `
            <button class="context-menu-item" id="iconOpen">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                </svg>
                <span>Open ${item.label}</span>
            </button>
            <button class="context-menu-item" id="iconInfo">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                <span>Properties</span>
            </button>
        `;

        // Position context menu
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.classList.remove('hidden');

        // Add event listeners
        document.getElementById('iconOpen').onclick = (e) => {
            e.stopPropagation();
            item.action();
            this.hideContextMenu();
        };

        document.getElementById('iconInfo').onclick = (e) => {
            e.stopPropagation();
            this.showIconProperties(item);
            this.hideContextMenu();
        };
    },

    /**
     * Show icon properties dialog
     */
    showIconProperties(item) {
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="window-section-header" style="color: ${item.color};">
                ${item.icon} ${item.label}
            </div>
            <div style="line-height: 2; font-size: 12px; margin-top: 20px;">
                <div><span style="color: ${item.color};">ID:</span> ${item.id}</div>
                <div><span style="color: ${item.color};">Type:</span> Application</div>
                <div><span style="color: ${item.color};">Color:</span> ${item.color}</div>
            </div>
        `;

        WindowManager.create({
            id: `properties-${item.id}`,
            title: `${item.label} Properties`,
            icon: item.icon,
            content,
            width: 400,
            height: 300,
        });
    },

    /**
     * Hide context menu
     */
    hideContextMenu() {
        this.contextMenu.classList.add('hidden');
    },

    /**
     * Change wallpaper (cycles through preset wallpapers)
     */
    changeWallpaper() {
        const currentIndex = this.WALLPAPERS.indexOf(State.wallpaper);
        const nextIndex = (currentIndex + 1) % this.WALLPAPERS.length;
        State.setWallpaper(this.WALLPAPERS[nextIndex]);
    },

    /**
     * Set random wallpaper
     */
    randomWallpaper() {
        const randomIndex = Math.floor(Math.random() * this.WALLPAPERS.length);
        State.setWallpaper(this.WALLPAPERS[randomIndex]);
    },

    /** Show Media Vault folder view */
    async openMediaVault() {
        // Load media data
        let media = { images: [], videos: [] };
        try {
            const override = localStorage.getItem('media.json');
            if (override) {
                media = JSON.parse(override);
            } else {
                const res = await fetch('data/media.json');
                media = await res.json();
            }
        } catch (e) {
            console.warn('Media JSON missing', e);
        }

        // Create content container
        const content = document.createElement('div');
        content.className = 'media-vault-content';
        content.style.padding = '20px';

        // Render folders
        this.renderMediaFolders(content, media);

        // Create window
        WindowManager.create({
            id: 'media',
            title: 'MEDIA_VAULT',
            icon: '📁',
            content,
            width: 820,
            height: 600,
        });
    },

    /**
     * Open Skills Universe
     */
    openSkills() {
        const win = WindowManager.create({
            id: 'skills',
            title: 'SKILLS_UNIVERSE // PHYSICS_ENGINE_V1',
            icon: '🕸️',
            width: 900,
            height: 600
        });

        const content = document.createElement('div');
        content.style.width = '100%';
        content.style.height = '100%';
        content.style.background = '#000';
        content.style.overflow = 'hidden';
        content.className = 'skills-container';

        // Clear previous content
        const winContent = win.element.querySelector('.window-content');
        winContent.innerHTML = '';
        winContent.appendChild(content);

        // Init Physics Engine
        setTimeout(() => {
            SkillsUniverse.init(content);
        }, 50);
    },

    /**
     * Open GitHub Operations Center
     */
    openGitHubCenter() {
        const win = WindowManager.create({
            id: 'github-ops',
            title: 'GITHUB_OPS // MISSION_CONTROL',
            icon: '📡',
            width: 1000,
            height: 700
        });

        const content = document.createElement('div');
        content.className = 'github-ops-container';
        content.style.height = '100%';
        content.style.overflow = 'auto'; // Let the dashboard handle its own scroll with overflow-y: auto

        win.element.querySelector('.window-content').appendChild(content);

        // Render Dashboard
        GitHub.render(content);
    },

    /**
     * Open Enterprise Console (Terminal)
     */
    openTerminal() {
        const win = WindowManager.create({
            id: 'terminal',
            title: 'ENTERPRISE_CONSOLE // ROOT_ACCESS',
            icon: '▶',
            width: 800,
            height: 500,
            transitionType: 'console'
        });

        win.element.style.background = 'rgba(5, 5, 10, 0.98)';

        const content = document.createElement('div');
        content.style.height = '100%';
        win.element.querySelector('.window-content').appendChild(content);

        // Dynamically load Terminal module if not already (or just use global if available)
        // Since we didn't import it at top yet, let me fix imports next.
        // For now I'll assume I import it.
        Terminal.init(content);
    },

    /** Open the featured video directly */
    async openFeaturedVideo() {
        // Load media data
        let videos = [];
        try {
            const override = localStorage.getItem('media.json');
            if (override) {
                const media = JSON.parse(override);
                videos = media.videos || [];
            } else {
                const res = await fetch('/data/media.json');
                const media = await res.json();
                videos = media.videos || [];
            }
        } catch (e) {
            console.warn('Media data missing', e);
        }

        // Find the featured video (first one with category 'Featured' or just the first one)
        const featuredIndex = videos.findIndex(v => v.category === 'Featured' || v.title.includes('Showcase'));

        if (featuredIndex !== -1) {
            Lightbox.open(videos, featuredIndex, 'video');
        } else if (videos.length > 0) {
            Lightbox.open(videos, 0, 'video');
        } else {
            Modal.alert('Error', 'No featured video found.');
        }
    },

    /** Render folders view */
    renderMediaFolders(container, media) {
        container.innerHTML = '';
        const folders = ['Real Estate', 'Cars', 'Music Videos'];
        const protectedFolders = { 'Real Estate': '1234', 'Cars': '1234' };

        const header = document.createElement('div');
        header.className = 'window-section-header';
        header.textContent = '▸ MEDIA VAULT';
        container.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'media-vault-grid';

        folders.forEach((folderName) => {
            const folderDiv = document.createElement('div');
            folderDiv.className = 'media-folder';

            // Find a thumbnail (first image/video in category)
            let thumb = null;
            if (media.images) thumb = media.images.find(i => i.category === folderName)?.url;
            if (!thumb && media.videos) thumb = media.videos.find(v => v.category === folderName)?.poster;

            // Add lock icon if protected
            const isLocked = !!protectedFolders[folderName];

            // Get custom icon
            let customIcon = '📁';
            try {
                const storedIcons = JSON.parse(localStorage.getItem('folderIcons') || '{}');
                if (storedIcons[folderName]) customIcon = storedIcons[folderName];
            } catch (e) { }

            const icon = isLocked ? '🔒' : customIcon;

            let html = `<div class="media-folder-icon">${icon}</div>`;

            // Add thumbnail background if available
            if (thumb && !isLocked) {
                folderDiv.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${thumb}')`;
                folderDiv.style.backgroundSize = 'cover';
                folderDiv.style.backgroundPosition = 'center';
            } else if (!isLocked) {
                // Fallback defaults if no custom icon set and no thumbnail
                if (!customIcon || customIcon === '📁') {
                    if (folderName === 'Music Videos') html = `<div class="media-folder-icon">🎵</div>`;
                    else if (folderName === 'Real Estate') html = `<div class="media-folder-icon">🏠</div>`;
                    else if (folderName === 'Cars') html = `<div class="media-folder-icon">🏎️</div>`;
                    else if (folderName === 'Archive') html = `<div class="media-folder-icon">📦</div>`;
                }
            }

            html += `<div class="media-folder-label">${folderName}</div>`;
            folderDiv.innerHTML = html;

            // Add cursor pointer to make it clear it's clickable
            folderDiv.style.cursor = 'pointer';

            // Add click handler
            folderDiv.addEventListener('click', async () => {
                if (isLocked) {
                    const pass = await Modal.prompt('Restricted Access', `Enter password for ${folderName}:`);
                    if (pass === protectedFolders[folderName]) {
                        this.navigateToMediaContent(container, media, folderName, 'images');
                    } else if (pass !== null) {
                        await Modal.alert('Access Denied', 'Incorrect password. Access denied.');
                    }
                } else {
                    const defaultTab = ['Real Estate', 'Cars', 'Music Videos'].includes(folderName) ? 'videos' : 'images';
                    this.navigateToMediaContent(container, media, folderName, defaultTab);
                }
            });

            grid.appendChild(folderDiv);
        });

        container.appendChild(grid);
    },

    /** Navigate to media content (updates same window) */
    navigateToMediaContent(container, media, category, defaultTab) {
        // Push navigation state
        WindowManager.pushNavigation('media', {
            label: 'Vault',
            callback: () => this.renderMediaFolders(container, media)
        });

        // Update title
        const win = State.getWindow('media');
        if (win) {
            const titleEl = win.element.querySelector('.window-title');
            if (titleEl) titleEl.textContent = `MEDIA: ${category.toUpperCase()}`;
        }

        // Filter content
        const images = (media.images || []).filter(img => img.category === category);
        const videos = (media.videos || []).filter(vid => vid.category === category);

        container.innerHTML = '';

        // Tabs
        const tabs = document.createElement('div');
        tabs.className = 'app-filters';
        tabs.innerHTML = `
            <button class="filter-tag ${defaultTab === 'images' ? 'active' : ''}" data-tab="images">Images (${images.length})</button>
            <button class="filter-tag ${defaultTab === 'videos' ? 'active' : ''}" data-tab="videos">Videos (${videos.length})</button>
        `;

        const body = document.createElement('div');
        body.style.flex = '1';
        body.style.overflow = 'auto';

        const renderImages = () => {
            const grid = document.createElement('div');
            grid.className = 'photos-grid';

            if (images.length === 0) {
                grid.innerHTML = '<div style="color: #888; padding: 20px; grid-column: span 3; text-align: center;">No images in this category.</div>';
            } else {
                // Show loading state first
                grid.innerHTML = '<div class="loading-spinner" style="grid-column: span 3; text-align: center; padding: 40px;"><div class="spinner"></div><p style="color: var(--neon-cyan); margin-top: 20px;">Loading images...</p></div>';

                body.innerHTML = '';
                body.appendChild(grid);

                // Load images progressively to avoid freezing
                setTimeout(() => {
                    grid.innerHTML = '';

                    // Create a single observer for all items
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const img = entry.target.querySelector('img');
                                if (img && img.dataset.src) {
                                    img.src = img.dataset.src;
                                    img.removeAttribute('data-src');
                                    observer.unobserve(entry.target);
                                }
                            }
                        });
                    }, { rootMargin: '50px' });

                    images.forEach((photo, index) => {
                        const item = document.createElement('div');
                        item.className = 'photo-item loading';

                        // Create image element with lazy loading
                        const img = document.createElement('img');
                        const src = photo.url.startsWith('http') ? `${photo.url}?w=300&h=300&fit=crop` : photo.url;

                        img.alt = photo.caption || 'Image';
                        img.loading = 'lazy';

                        // Add placeholder while loading
                        img.style.opacity = '0';
                        img.style.transition = 'opacity 0.3s ease';

                        img.onload = () => {
                            img.style.opacity = '1';
                            item.classList.remove('loading');
                        };

                        // Start loading immediately for first few, lazy for rest
                        if (index < 8) {
                            img.src = src;
                        } else {
                            img.dataset.src = src; // Set data-src for observer
                            observer.observe(item);
                        }

                        item.appendChild(img);
                        item.onclick = () => Lightbox.open(images, index, 'image');
                        grid.appendChild(item);
                    });
                }, 100);
            }

            if (images.length > 0) {
                return; // Grid already appended above
            }
            body.innerHTML = '';
            body.appendChild(grid);
        };

        const renderVideos = () => {
            this.renderVideos(videos, body);
        };

        tabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-tag');
            if (!btn) return;
            tabs.querySelectorAll('.filter-tag').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.tab === 'images') renderImages();
            else renderVideos();
        });

        container.appendChild(tabs);
        container.appendChild(body);

        // Initial render
        if (defaultTab === 'images') renderImages();
        else renderVideos();
    },

    /**
     * Get video duration
     */
    async getVideoDuration(videoUrl) {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                const duration = Math.floor(video.duration);
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;
                resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            };

            video.onerror = () => resolve('--:--');
            video.src = videoUrl;
        });
    },

    /**
     * Capture video frame for thumbnail
     */
    async captureVideoFrame(videoUrl) {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.src = videoUrl;
            video.currentTime = 1;
            video.muted = true;

            video.onloadeddata = () => {
                setTimeout(() => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = 320;
                        canvas.height = 180;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL('image/jpeg', 0.7));
                    } catch (e) {
                        console.warn('Canvas taint or error', e);
                        resolve(null);
                    }
                }, 500);
            };

            video.onerror = () => resolve(null);
            video.load();
        });
    },

    /**
     * Render Videos with View Modes
     */
    renderVideos(videos, content) {
        if (!content.parentElement.querySelector('.view-controls')) {
            const controls = document.createElement('div');
            controls.className = 'view-controls';
            controls.style.cssText = 'display:flex; gap:10px; margin-bottom:15px; justify-content:flex-end;';
            controls.innerHTML = `
                <button class="view-btn active" data-mode="grid" title="Grid View">⊞</button>
                <button class="view-btn" data-mode="list" title="List View">≡</button>
            `;
            content.parentElement.insertBefore(controls, content);

            controls.addEventListener('click', (e) => {
                if (e.target.classList.contains('view-btn')) {
                    controls.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    content.dataset.mode = e.target.dataset.mode;
                    this.renderVideosList(videos, content, e.target.dataset.mode);
                }
            });
        }

        this.renderVideosList(videos, content, 'grid');
    },

    async renderVideosList(videos, content, mode) {
        content.className = `videos-container mode-${mode}`;
        content.innerHTML = '';

        if (videos.length === 0) {
            content.innerHTML = '<div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.5);">No videos available</div>';
            return;
        }

        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            const item = document.createElement('div');
            item.className = 'video-item';

            let poster = video.poster;
            if (!poster && !video.generatedPoster) {
                poster = null;
                this.captureVideoFrame(video.url).then(dataUrl => {
                    if (dataUrl) {
                        video.generatedPoster = dataUrl;
                        const thumb = item.querySelector('.video-thumb');
                        if (thumb) thumb.style.backgroundImage = `url('${dataUrl}')`;
                    }
                });
            } else if (video.generatedPoster) {
                poster = video.generatedPoster;
            }

            const bgStyle = poster ? `background-image:url('${poster}')` : 'background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;';
            const contentHtml = poster ? '' : '<span style="font-size: 40px; opacity: 0.5;">🎬</span>';

            if (mode === 'list') {
                item.innerHTML = `
                    <div class="video-thumb-small" style="${bgStyle}; width: 80px; height: 45px; background-size: cover;">${contentHtml}</div>
                    <div class="video-info">
                        <div class="video-title">${video.title}</div>
                        <div class="video-meta">Video • ${video.url.includes('youtube') ? 'YouTube' : 'Local'}</div>
                    </div>
                    <div class="video-action">▶</div>
                `;
            } else {
                item.innerHTML = `
                    <div class="video-thumb" style="${bgStyle}">
                        ${contentHtml}
                        <div class="video-play-icon">▶</div>
                        <div class="video-duration">--:--</div>
                    </div>
                    <div class="video-title">${video.title}</div>
                `;

                // Load actual duration asynchronously
                if (!video.url.includes('youtube') && !video.url.includes('vimeo')) {
                    this.getVideoDuration(video.url).then(duration => {
                        const durationEl = item.querySelector('.video-duration');
                        if (durationEl) durationEl.textContent = duration;
                    });
                }
            }

            item.onclick = () => Lightbox.open(videos, i, 'video');
            content.appendChild(item);
        }
    },



    /**
     * Legacy openMedia (kept for compatibility but unused by new flow)
     */
    async openMedia(defaultTab = 'images', category = null) {
        this.openMediaVault();
    },

    /**
     * Open Videos window
     */
    async openVideos() {
        // Load videos from media.json
        let videos = [];
        try {
            const override = localStorage.getItem('media.json');
            if (override) {
                const media = JSON.parse(override);
                videos = media.videos || [];
            } else {
                const res = await fetch('data/media.json');
                const media = await res.json();
                videos = media.videos || [];
            }
        } catch (e) {
            console.warn('Videos data missing, using empty array', e);
            videos = [];
        }

        const content = document.createElement('div');

        if (videos.length === 0) {
            content.innerHTML =
                '<div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.5);">No videos available</div>';
        } else {
            content.className = 'videos-grid';
            videos.forEach((video, index) => {
                const item = document.createElement('div');
                item.className = 'video-item';
                item.innerHTML = `
                    <div class="video-thumbnail">
                        <img src="${video.poster}" alt="${video.title}">
                        <div class="video-play-icon">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="video-title">${video.title}</div>
                `;
                item.onclick = () => Lightbox.open(videos, index, 'video');
                content.appendChild(item);
            });
        }

        WindowManager.create({
            id: 'videos',
            title: 'Videos',
            icon: this.DESKTOP_ITEMS.find((i) => i.id === 'videos').icon,
            content,
            width: 800,
            height: 600,
        });
    },

    /**
     * Open Applications window (React-style showcase)
     */
    openApplicationsShowcase() {
        const apps = [
            { name: 'SERVICE_TRACKER_PRO', desc: 'Dealership vehicle tracking system', status: 'live', link: 'https://servicetracker-production-f05b.up.railway.app' },
            { name: 'RAG_WITH_CITATIONS', desc: 'Enterprise-grade RAG system', status: 'live', link: 'https://github.com/DareDev256/rag-system-with-citations' },
            { name: 'VECTOR_SEARCH_ENGINE', desc: 'AI-powered RAG vs Keyword comparison', status: 'live', link: 'https://github.com/DareDev256/vector-vs-keyword-search' },
            { name: 'LLM_EVAL_HARNESS', desc: 'LLM Evaluation Framework', status: 'live', link: 'https://github.com/DareDev256/llm-evaluation-harness' },
            { name: 'NIN_WIKI_TOOLS', desc: 'Fandom wiki automation bot', status: 'coming-soon', link: null },
            { name: 'PORTFOLIO_ENGINE', desc: 'This very system', status: 'live', link: '#' },
        ];

        const content = document.createElement('div');

        // Header
        const header = document.createElement('div');
        header.className = 'window-section-header magenta';
        header.textContent = '⚡ APPLICATIONS';
        content.appendChild(header);

        // App list container
        const appList = document.createElement('div');
        appList.className = 'app-list-container';

        apps.forEach((app) => {
            const appItem = document.createElement('div');
            appItem.className = 'app-item';
            if (app.status === 'coming-soon') {
                appItem.classList.add('coming-soon');
            }

            const appInfo = document.createElement('div');
            appInfo.className = 'app-item-info';
            appInfo.innerHTML = `
                <div class="app-item-name">${app.name}</div>
                <div class="app-item-desc">${app.desc}</div>
                ${app.status === 'coming-soon' ? '<span class="app-status-badge">COMING SOON</span>' : ''}
            `;

            const launchBtn = document.createElement('button');

            if (app.status === 'coming-soon') {
                launchBtn.textContent = 'SOON';
                launchBtn.disabled = true;
                launchBtn.style.opacity = '0.5';
                launchBtn.style.cursor = 'not-allowed';
            } else if (app.name === 'PORTFOLIO_ENGINE') {
                launchBtn.textContent = 'ACTIVE';
                launchBtn.style.background = 'rgba(0,255,136,0.2)';
                launchBtn.style.borderColor = '#00ff88';
                launchBtn.style.color = '#00ff88';
                launchBtn.addEventListener('click', () => {
                    Modal.alert('Portfolio Engine', 'You\'re already running it! This is the system you\'re looking at right now. 🚀');
                });
            } else {
                launchBtn.textContent = 'LAUNCH';
                launchBtn.addEventListener('click', () => {
                    if (app.link) {
                        window.open(app.link, '_blank');
                    }
                });
            }

            appItem.appendChild(appInfo);
            appItem.appendChild(launchBtn);
            appList.appendChild(appItem);
        });

        content.appendChild(appList);

        // Divider and portfolio button
        const footer = document.createElement('div');
        footer.style.marginTop = '20px';
        footer.style.paddingTop = '20px';
        footer.style.borderTop = '1px solid rgba(255,0,170,0.2)';

        const portfolioBtn = document.createElement('button');
        portfolioBtn.className = 'project-link';
        portfolioBtn.textContent = 'View Full Project Portfolio →';
        portfolioBtn.addEventListener('click', () => {
            WindowManager.close('applications');
            setTimeout(() => this.openApplications(), 300);
        });

        footer.appendChild(portfolioBtn);
        content.appendChild(footer);

        WindowManager.create({
            id: 'applications',
            title: 'APPLICATIONS',
            icon: '⚡',
            content,
            width: 600,
            height: 400,
        });
    },

    /**
     * Open Applications window (Full portfolio)
     */
    async openApplications() {
        // Fetch projects data
        let projects = [];
        try {
            const override = localStorage.getItem('projects.json');
            if (override) {
                projects = JSON.parse(override);
            } else {
                const response = await fetch('data/projects.json');
                projects = await response.json();
            }
        } catch (e) {
            console.error('Failed to load projects:', e);
            projects = this.getDefaultProjects();
        }

        const content = document.createElement('div');

        // Get unique tags
        const allTags = [...new Set(projects.flatMap((p) => p.tags))];

        // Create filters
        const filters = document.createElement('div');
        filters.className = 'app-filters';
        filters.innerHTML = `
            <button class="filter-tag active" data-tag="all">All</button>
            ${allTags.map((tag) => `<button class="filter-tag" data-tag="${tag}">${tag}</button>`).join('')}
        `;

        // Create projects grid
        const grid = document.createElement('div');
        grid.className = 'projects-grid';

        const renderProjects = (filterTag = 'all') => {
            const filtered =
                filterTag === 'all' ? projects : projects.filter((p) => p.tags.includes(filterTag));
            grid.innerHTML = filtered
                .map(
                    (project) => `
                <div class="project-card">
                    <div class="project-title">${project.title}</div>
                    <div class="project-description">${project.description}</div>
                    <div class="project-tech">
                        ${project.tech.map((t) => `<span class="tech-tag">${t}</span>`).join('')}
                    </div>
                    <div class="project-links">
                        ${project.demo ? `<a href="${project.demo}" target="_blank" class="project-link">View Demo</a>` : ''}
                        ${project.repo ? `<a href="${project.repo}" target="_blank" class="project-link secondary">GitHub</a>` : ''}
                    </div>
                </div>
            `
                )
                .join('');
        };

        renderProjects();

        // Filter click handlers
        filters.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-tag')) {
                filters
                    .querySelectorAll('.filter-tag')
                    .forEach((f) => f.classList.remove('active'));
                e.target.classList.add('active');
                renderProjects(e.target.dataset.tag);
            }
        });

        content.appendChild(filters);
        content.appendChild(grid);

        WindowManager.create({
            id: 'applications',
            title: 'Applications',
            icon: this.DESKTOP_ITEMS.find((i) => i.id === 'applications').icon,
            content,
            width: 800,
            height: 600,
        });
    },

    /**
     * Get default projects if JSON fails to load
     */
    getDefaultProjects() {
        return [
            {
                title: 'Portfolio OS',
                description: 'A Windows-like desktop portfolio built with vanilla JavaScript',
                tech: ['JavaScript', 'CSS', 'HTML'],
                tags: ['Web', 'Frontend'],
                demo: '#',
                repo: '#',
            },
            {
                title: 'Task Manager',
                description: 'A productivity app for managing tasks and projects',
                tech: ['React', 'Node.js', 'MongoDB'],
                tags: ['Web', 'Fullstack'],
                demo: '#',
                repo: '#',
            },
        ];
    },

    /**
     * Open Resume window (Small Card View)
     */
    openResume() {
        const content = document.createElement('div');
        content.className = 'resume-card-container';
        content.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center;';

        content.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">📄</div>
            <h3 style="color: var(--neon-orange); margin-bottom: 10px;">DAREDEV256 RESUME</h3>
            <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin-bottom: 20px;">
                Full Stack Developer • Creative Technologist
            </p>
            <div style="display: flex; gap: 10px;">
                <button class="cyber-button" id="viewResumeBtn">VIEW FULL RESUME</button>
                <a href="resume/resume.pdf" download class="cyber-button secondary">DOWNLOAD</a>
            </div>
        `;

        const win = WindowManager.create({
            id: 'resume',
            title: 'Resume',
            icon: '📄',
            content,
            width: 500,
            height: 400,
        });

        // Handle "View Full" click
        setTimeout(() => {
            const btn = content.querySelector('#viewResumeBtn');
            if (btn) {
                btn.onclick = () => {
                    // Expand window
                    win.width = 800;
                    win.height = 700;
                    win.element.style.width = '800px';
                    win.element.style.height = '700px';

                    // Center it
                    win.x = (window.innerWidth - 800) / 2;
                    win.y = (window.innerHeight - 700) / 2;
                    win.element.style.left = `${win.x}px`;
                    win.element.style.top = `${win.y}px`;

                    // Replace content with PDF viewer
                    const viewer = document.createElement('div');
                    viewer.className = 'resume-viewer';
                    viewer.style.height = '100%';
                    viewer.innerHTML = `
                        <iframe src="resume/resume.pdf" type="application/pdf" style="width:100%;height:100%;border:0"></iframe>
                    `;

                    // Clear and append
                    const contentEl = win.element.querySelector('.window-content');
                    contentEl.innerHTML = '';
                    contentEl.appendChild(viewer);
                };
            }
        }, 0);
    },

    /**
     * Open About window
     */
    openAbout() {
        const content = document.createElement('div');
        content.className = 'about-content';

        content.innerHTML = `
            <div class="window-section-header purple">◈ ABOUT_ME.exe</div>
            <div style="line-height: 2; font-size: 12px;">
                <div><span style="color: #aa00ff;">NAME:</span> DareDev256</div>
                <div><span style="color: #aa00ff;">ROLE:</span> Developer • Creator • Visionary <span class="verified-badge">✓ SYSTEM VERIFIED</span></div>
                <div><span style="color: #aa00ff;">LOCATION:</span> Building the future</div>
                <div><span style="color: #aa00ff;">STATUS:</span> Always shipping</div>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(170,0,255,0.2);">
                <p style="line-height: 1.8; color: rgba(255,255,255,0.7); font-size: 12px;">
                    Hello! I'm a developer passionate about creating interactive,
                    accessible, and performant web experiences. This portfolio showcases
                    my work in a unique desktop OS-inspired interface.
                </p>
                <p style="line-height: 1.8; color: rgba(255,255,255,0.7); font-size: 12px;">
                    I specialize in modern web technologies and love building interfaces
                    that are both beautiful and functional.
                </p>
            </div>
            <div style="margin-top: 20px;">
                <h3 style="color: #aa00ff; font-size: 13px; margin-bottom: 15px; letter-spacing: 1px;">SKILLS & TECHNOLOGIES</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    <div style="background: rgba(170,0,255,0.1); border: 1px solid rgba(170,0,255,0.3); padding: 8px; text-align: center; font-size: 11px; color: #aa00ff;">JavaScript</div>
                    <div style="background: rgba(170,0,255,0.1); border: 1px solid rgba(170,0,255,0.3); padding: 8px; text-align: center; font-size: 11px; color: #aa00ff;">TypeScript</div>
                    <div style="background: rgba(170,0,255,0.1); border: 1px solid rgba(170,0,255,0.3); padding: 8px; text-align: center; font-size: 11px; color: #aa00ff;">React</div>
                    <div style="background: rgba(170,0,255,0.1); border: 1px solid rgba(170,0,255,0.3); padding: 8px; text-align: center; font-size: 11px; color: #aa00ff;">Vue.js</div>
                    <div style="background: rgba(170,0,255,0.1); border: 1px solid rgba(170,0,255,0.3); padding: 8px; text-align: center; font-size: 11px; color: #aa00ff;">Node.js</div>
                    <div style="background: rgba(170,0,255,0.1); border: 1px solid rgba(170,0,255,0.3); padding: 8px; text-align: center; font-size: 11px; color: #aa00ff;">CSS/SCSS</div>
                    <div style="background: rgba(170,0,255,0.1); border: 1px solid rgba(170,0,255,0.3); padding: 8px; text-align: center; font-size: 11px; color: #aa00ff;">HTML5</div>
                    <div style="background: rgba(170,0,255,0.1); border: 1px solid rgba(170,0,255,0.3); padding: 8px; text-align: center; font-size: 11px; color: #aa00ff;">Git</div>
                    <div style="background: rgba(170,0,255,0.1); border: 1px solid rgba(170,0,255,0.3); padding: 8px; text-align: center; font-size: 11px; color: #aa00ff;">UI/UX</div>
                </div>
            </div>
        `;

        WindowManager.create({
            id: 'about',
            title: 'ABOUT_ME.exe',
            icon: '◈',
            content,
            width: 600,
            height: 600,
        });
    },

    /**
     * Open Contact window
     */
    /**
     * Open Contact window
     */
    openContact() {
        const content = document.createElement('div');
        content.style.padding = '25px';
        content.className = 'contact-window-content';

        content.innerHTML = `
            <div class="contact-header">
                <div class="contact-title">OFFICIAL COMMUNICATION CHANNEL</div>
                <div class="contact-subtitle">
                    ESTABLISHED CONNECTION 
                    <span class="verified-badge">✓ SYSTEM VERIFIED</span>
                </div>
            </div>

            <div class="social-grid">
                <a href="https://github.com/DareDev256" target="_blank" class="social-btn">
                    <span style="font-size: 1.2em">💻</span>
                    <span>GITHUB_REPO</span>
                </a>
                <a href="https://www.linkedin.com" target="_blank" class="social-btn">
                    <span style="font-size: 1.2em">wb</span>
                    <span>LINKEDIN_PROFILE</span>
                </a>
            </div>

            <div class="window-section-header purple" style="margin: 20px 0 15px;">◈ DIRECT_TRANSMISSION</div>

            <form class="contact-form">
                <div class="cyber-form-group">
                    <label class="cyber-label" for="contact-name">IDENTITY</label>
                    <input type="text" id="contact-name" name="name" class="cyber-input" placeholder="ENTER DESIGNATION" required>
                </div>
                <div class="cyber-form-group">
                    <label class="cyber-label" for="contact-email">FREQUENCY (EMAIL)</label>
                    <input type="email" id="contact-email" name="email" class="cyber-input" placeholder="USER@NET.COM" required>
                </div>
                <div class="cyber-form-group">
                    <label class="cyber-label" for="contact-message">PACKET DATA</label>
                    <textarea id="contact-message" name="message" class="cyber-textarea" placeholder="INITIATE MESSAGE SEQUENCE..." required></textarea>
                </div>
                <button type="submit" class="cyber-button" style="width: 100%; margin-top: 10px;">
                    <span>TRANSMIT ENCRYPTED DATA</span>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </form>

            <div class="contact-footer">
                🔒 END-TO-END ENCRYPTION ACTIVE // SECURE LINE
            </div>
        `;

        const form = content.querySelector('form');
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');

            // Initialize Pixel Loader
            new PixelLoader({
                container: document.getElementById('window-contact').querySelector('.window-content'),
                type: 'sending',
                message: 'ENCRYPTING & TRANSMITTING...',
                onComplete: () => {
                    // Actual mailto after animation
                    const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
                    const body = encodeURIComponent(`From: ${name}\nEmail: ${email}\n\n${message}`);
                    window.location.href = `mailto:your-email@example.com?subject=${subject}&body=${body}`;
                    form.reset();
                }
            });
        };

        WindowManager.create({
            id: 'contact',
            title: 'SECURE_CHANNEL // CONNECT',
            icon: this.DESKTOP_ITEMS.find((i) => i.id === 'contact').icon,
            content,
            width: 500,
            height: 650,
        });
    },

    /** Settings window */
    openSettings() {
        const content = document.createElement('div');
        content.className = 'settings-content';
        content.innerHTML = `
            <div class="settings-header">
                <h2 style="color: var(--neon-cyan); margin: 0 0 8px 0; font-size: 20px;">⚙️ SYSTEM SETTINGS</h2>
                <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 12px;">Customize your experience</p>
            </div>

            <div class="settings-grid">
                <!-- Appearance Card -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <span class="settings-icon">🎨</span>
                        <h3>Appearance</h3>
                    </div>
                    <div class="settings-card-body">
                        <div class="settings-row">
                            <label class="settings-toggle">
                                <input type="checkbox" id="fxEnabled">
                                <span class="toggle-slider"></span>
                                <span class="toggle-label">Particle Effects</span>
                            </label>
                        </div>
                        <div class="settings-row">
                            <label class="settings-toggle">
                                <input type="checkbox" id="glyphsEnabled">
                                <span class="toggle-slider"></span>
                                <span class="toggle-label">Hologram Ring</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- System Card -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <span class="settings-icon">🔧</span>
                        <h3>System</h3>
                    </div>
                    <div class="settings-card-body">
                        <div class="settings-row">
                            <label class="settings-toggle">
                                <input type="checkbox" id="soundEnabled">
                                <span class="toggle-slider"></span>
                                <span class="toggle-label">UI Sounds</span>
                            </label>
                        </div>
                        <div class="settings-row">
                            <label class="settings-input-row">
                                <span>Idle Lock (minutes)</span>
                                <input type="number" id="idleMinutes" min="1" max="60" step="1" class="settings-number-input">
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Content Card -->
                <div class="settings-card" style="grid-column: span 2;">
                    <div class="settings-card-header">
                        <span class="settings-icon">📝</span>
                        <h3>Content Management</h3>
                    </div>
                    <div class="settings-card-body">
                        <div style="display: flex; gap: 10px;">
                            <button class="settings-btn primary" id="openAdmin">
                                <span>✏️</span> Content Editor
                            </button>
                            <button class="settings-btn secondary" id="openApps">
                                <span>⚡</span> Edit Projects
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        WindowManager.create({
            id: 'settings',
            title: 'Settings',
            icon: this.DESKTOP_ITEMS.find((i) => i.id === 'settings').icon,
            content,
            width: 650,
            height: 480,
        });

        // Initialize values
        content.querySelector('#fxEnabled').checked = State.fxEnabled;
        content.querySelector('#glyphsEnabled').checked = State.glyphsEnabled;
        content.querySelector('#soundEnabled').checked = State.soundEnabled;
        content.querySelector('#idleMinutes').value = Math.round(State.idleTime / 60000) || 2;

        // Bind changes
        content.querySelector('#fxEnabled').addEventListener('change', (e) => State.setFxEnabled(e.target.checked));
        content.querySelector('#glyphsEnabled').addEventListener('change', (e) => State.setGlyphsEnabled(e.target.checked));
        content.querySelector('#soundEnabled').addEventListener('change', (e) => State.setSoundEnabled(e.target.checked));
        content.querySelector('#idleMinutes').addEventListener('change', (e) => {
            const m = Math.max(1, Math.min(60, parseInt(e.target.value || '2', 10)));
            State.idleTime = m * 60000;
        });

        content.querySelector('#openAdmin').addEventListener('click', async () => {
            const { Admin } = await import('./admin.js');
            Admin.open();
        });
        content.querySelector('#openApps').addEventListener('click', () => Desktop.openApplications());
    },

    /**
     * Open Terminal shell emulator (Easter egg – press Ctrl+`)
     */
    openShell() {
        const content = document.createElement('div');
        content.className = 'shell-content';
        const output = document.createElement('div');
        output.className = 'shell-output';
        const inputLine = document.createElement('div');
        inputLine.className = 'shell-input-line';
        const prompt = document.createElement('span');
        prompt.className = 'shell-prompt';
        prompt.textContent = '$ ';
        const input = document.createElement('input');
        input.className = 'shell-input';
        input.type = 'text';
        input.autocomplete = 'off';
        input.spellcheck = false;
        inputLine.appendChild(prompt);
        inputLine.appendChild(input);
        content.appendChild(output);
        content.appendChild(inputLine);
        const icon = `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 4h18v16H3z" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M7 9l3 3-3 3M13 16h4" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>`;
        WindowManager.create({
            id: 'shell',
            title: 'Terminal',
            icon,
            content,
            width: 600,
            height: 400,
        });
        function append(line) {
            const div = document.createElement('div');
            div.textContent = line;
            output.appendChild(div);
            output.scrollTop = output.scrollHeight;
        }
        function handle(cmd) {
            switch (cmd) {
                case '':
                    break;
                case 'help':
                case '?':
                    append(
                        'Available: help, ls, pwd, clear, photos, videos, resume, about, contact'
                    );
                    break;
                case 'ls':
                    append('photos videos applications resume about contact');
                    break;
                case 'pwd':
                    append('/home/portfolio');
                    break;
                case 'clear':
                    output.innerHTML = '';
                    break;
                case 'photos':
                case 'open photos':
                    Desktop.openPhotos();
                    append('Opening Photos...');
                    break;
                case 'videos':
                case 'open videos':
                    Desktop.openVideos();
                    append('Opening Videos...');
                    break;
                case 'resume':
                case 'open resume':
                case 'cat resume.pdf':
                    Desktop.openResume();
                    append('Opening Resume...');
                    break;
                case 'about':
                case 'open about':
                    Desktop.openAbout();
                    append('Opening About...');
                    break;
                case 'contact':
                case 'open contact':
                    Desktop.openContact();
                    append('Opening Contact...');
                    break;
                default:
                    append(`Command not found: ${cmd}`);
            }
        }
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = input.value.trim();
                append(`$ ${cmd}`);
                handle(cmd);
                input.value = '';
            }
        });
        input.focus();
        // Initial shell greeting (React-style)
        append('PASSION_OS://DEV_TERMINAL');
        append('');
        append('$ whoami');
        append('DareDev256');
        append('$ cat skills.txt');
        append('React, TypeScript, Node.js, Game Dev, UI/UX');
        append('$ status');
        append('Creating the future...');
        append('');
        append("Type 'help' to see available commands");
    },
    /**
     * Animate "SOLUTIONS" watermark typing effect
     */
    animateWatermark() {
        const desktop = document.querySelector('.desktop');
        if (!desktop) return;

        // Create watermark element
        const watermark = document.createElement('div');
        watermark.className = 'desktop-watermark';
        watermark.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 60px;
            font-weight: 900;
            color: rgba(0, 240, 255, 0.08);
            pointer-events: none;
            z-index: 0;
            letter-spacing: 12px;
            white-space: nowrap;
            font-family: var(--font-family);
            text-transform: uppercase;
        `;
        desktop.appendChild(watermark);

        const text = "SOLUTIONS";
        let i = 0;
        watermark.textContent = "";

        const type = () => {
            if (i < text.length) {
                watermark.textContent += text.charAt(i);
                i++;
                setTimeout(type, 150 + Math.random() * 100);
            } else {
                // Add blinking cursor at the end
                const cursor = document.createElement('span');
                cursor.textContent = "_";
                cursor.style.animation = "blink 1s infinite";
                watermark.appendChild(cursor);

                // Add blink keyframes if not exists
                if (!document.getElementById('blink-style')) {
                    const style = document.createElement('style');
                    style.id = 'blink-style';
                    style.textContent = `
                        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                    `;
                    document.head.appendChild(style);
                }
            }
        };

        type();
    },

    /**
     * Play Startup Sound (Web Audio API)
     */
    playStartupSound() {
        // Disabled by user request ("second noise after login")
    }
};
