import { WindowManager } from './windows.js';
import { State } from './state.js';
import { Lightbox } from './lightbox.js';
import { Modal } from './modal.js';
import { PixelLoader } from './loader.js';
// SkillsUniverse, GitHub, Terminal loaded dynamically at point-of-use (P5)
import { Sanitize } from './sanitize.js';
import { loadMedia, loadProjects } from './data-loader.js';
import { openExternal, animateCounter, loadJSON, saveJSON } from './dom-helpers.js';

/**
 * Open a lazy-loaded window app.
 * Creates a container, opens the window, then dynamically imports the module.
 * The module's render function receives the container and may return a cleanup fn.
 * @param {Object} opts - Window + module config
 * @param {string} opts.id - Window ID
 * @param {string} opts.title - Title bar text
 * @param {string} opts.icon - Emoji or SVG icon
 * @param {number} opts.width - Window width
 * @param {number} opts.height - Window height
 * @param {() => Promise<{default?: Function} & Record<string, Function>>} opts.load - Dynamic import thunk
 * @param {string} opts.exportName - Named export to call from the imported module
 */
function createLazyWindow({ id, title, icon, width, height, load, exportName }) {
    let cleanup = null;
    const content = document.createElement('div');
    content.style.height = '100%';

    WindowManager.create({
        id,
        title,
        icon,
        content,
        width,
        height,
        onClose: () => { if (cleanup) cleanup(); },
    });

    load().then((mod) => { cleanup = mod[exportName](content); });
}

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

    // Desktop item configurations — ordered for recruiter flow
    // Column 1: "Hire Me" | Column 2: "What I Build" | Column 3: "Projects" | Column 4: "Extras"
    DESKTOP_ITEMS: [
        // Column 1 — Hire Me (leftmost)
        {
            id: 'resume',
            label: 'RESUME',
            icon: 'svg:/assets/resume.svg',
            color: '#ffaa00',
            action: () => Desktop.openResume(),
        },
        {
            id: 'about',
            label: 'ABOUT_ME.exe',
            icon: 'svg:/assets/about-me.svg',
            color: '#aa00ff',
            action: () => Desktop.openAbout(),
        },
        {
            id: 'contact',
            label: 'CONNECT',
            icon: 'svg:/assets/connect.svg',
            color: '#ff0066',
            action: () => Desktop.openContact(),
        },
        {
            id: 'linkedin',
            label: 'LINKEDIN',
            icon: 'svg:/assets/linkedin.svg',
            color: '#0077b5',
            action: () => openExternal('https://linkedin.com/in/james-olusoga'),
        },
        // Column 2 — What I Build
        {
            id: 'skills',
            label: 'SKILLS_MATRIX',
            icon: 'svg:/assets/skills-matrix.svg',
            color: '#00f0ff',
            action: () => Desktop.openSkills(),
        },
        {
            id: 'github',
            label: 'GITHUB_OPS',
            icon: 'svg:/assets/github-ops.svg',
            color: '#00f0ff',
            action: () => Desktop.openGitHubCenter(),
        },
        {
            id: 'portfolio',
            label: 'PORTFOLIO',
            icon: 'svg:/assets/portfolio.svg',
            color: '#00f0ff',
            action: () => Desktop.openPortfolio(),
        },
        {
            id: 'applications',
            label: 'APPLICATIONS',
            icon: 'svg:/assets/applications.svg',
            color: '#ff00aa',
            action: () => Desktop.openApplicationsShowcase(),
        },
        {
            id: 'terminal',
            label: 'DEV_TERMINAL',
            icon: 'svg:/assets/dev-terminal.svg',
            color: '#00ff88',
            action: () => Desktop.openTerminal(),
        },
        // Column 3 — Projects
        {
            id: 'vibe-coder',
            label: 'Vibe_Coder.exe',
            icon: 'svg:/assets/vibe-coder.svg',
            color: '#ff00aa',
            action: () => openExternal('https://daredev256.github.io/vibe-coder/'),
        },
        {
            id: 'image-generator',
            label: 'IMG_GEN.ai',
            icon: 'svg:/assets/image-generator.svg',
            color: '#be185d',
            action: () => openExternal('https://web-ten-vert-46.vercel.app/'),
        },
        {
            id: 'typemaster',
            label: 'TYPEMASTER',
            icon: 'svg:/assets/typemaster.svg',
            color: '#00ff88',
            action: () => openExternal('https://typing-game-kappa-seven.vercel.app/'),
        },
        {
            id: 'showcase',
            label: 'SHOWCASE.mp4',
            icon: 'svg:/assets/showcase.svg',
            color: '#FF0000',
            action: () => Desktop.openFeaturedVideo(),
        },
        // Column 4 — Extras
        {
            id: 'sticky-notes',
            label: 'NOTES',
            icon: 'svg:/assets/sticky-notes.svg',
            color: '#ffaa00',
            action: () => Desktop.openStickyNotes(),
        },
        {
            id: 'pomodoro',
            label: 'FOCUS_TIMER',
            icon: 'svg:/assets/pomodoro-timer.svg',
            color: '#ff0066',
            action: () => Desktop.openPomodoroTimer(),
        },
        {
            id: 'calculator',
            label: 'CALC.exe',
            icon: 'svg:/assets/calculator.svg',
            color: '#aa00ff',
            action: () => Desktop.openCalculator(),
        },
        {
            id: 'portfolio-videos',
            label: 'MUSIC_VIDEOS',
            icon: 'svg:/assets/portfolio-videos.svg',
            color: '#ff4444',
            action: () => openExternal('https://tdotssolutionsz.com/'),
        },
        {
            id: 'settings',
            label: 'SETTINGS',
            icon: 'svg:/assets/settings.svg',
            color: '#00BCD4',
            action: () => Desktop.openSettings(),
        },
        {
            id: 'sysmon',
            label: 'SYS_MONITOR',
            icon: 'svg:/assets/system-monitor.svg',
            color: '#00ff88',
            action: () => Desktop.openSystemMonitor(),
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
     * Setup easter egg hooks (called after InteractionEngine is ready)
     */
    setupEasterEggHooks() {
        if (!window.__InteractionEngine?.easterEggs) {
            console.warn('[Desktop] InteractionEngine not ready for easter egg hooks');
            return;
        }

        // Hook window creation for easter egg tracking
        const originalCreate = WindowManager.create.bind(WindowManager);
        WindowManager.create = function(...args) {
            const result = originalCreate(...args);
            window.__InteractionEngine.easterEggs.windowsOpened++;

            const count = window.__InteractionEngine.easterEggs.windowsOpened;
            if (count === 5) {
                window.__InteractionEngine.easterEggs.showNotification(
                    '🪟 MULTITASKING PRO',
                    'Bold of you to assume I have infinite RAM...',
                    'info',
                    4000
                );
            }
            if (count === 10) {
                window.__InteractionEngine.easterEggs.showNotification(
                    '🤯 WINDOW OVERLOAD',
                    'You\'re really testing my limits here. Impressive.',
                    'warning',
                    4000
                );
            }
            return result;
        };

        console.log('[Desktop] Easter egg hooks installed');
    },

    /**
     * Create hexagonal burst effect at position
     */
    createHexBurst(x, y, color = '#00f0ff') {
        // Create multiple hex elements for layered effect
        for (let i = 0; i < 3; i++) {
            const hex = document.createElement('div');
            hex.className = 'hex-burst';
            hex.style.left = `${x}px`;
            hex.style.top = `${y}px`;
            hex.style.background = `linear-gradient(135deg, ${color}, var(--neon-magenta, #ff00aa))`;
            hex.style.animationDelay = `${i * 0.05}s`;
            hex.style.transform = `translate(-50%, -50%) scale(${1 + i * 0.3})`;

            document.body.appendChild(hex);

            // Clean up after animation
            setTimeout(() => hex.remove(), 600);
        }

        // Also spawn some data particles
        this.createDataParticles(x, y, color);
    },

    /**
     * Create falling data stream particles
     */
    createDataParticles(x, y, color = '#00f0ff') {
        const chars = ['0', '1', '⟨', '⟩', '◈', '▲', '●', '⬡'];
        const count = 5 + Math.floor(Math.random() * 5);

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'data-stream-particle';
            particle.textContent = chars[Math.floor(Math.random() * chars.length)];
            particle.style.left = `${x + (Math.random() - 0.5) * 40}px`;
            particle.style.top = `${y}px`;
            particle.style.color = color;
            particle.style.textShadow = `0 0 5px ${color}`;
            particle.style.animationDelay = `${Math.random() * 0.2}s`;

            document.body.appendChild(particle);

            setTimeout(() => particle.remove(), 1200);
        }
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
        const dockIds = ['about', 'portfolio', 'skills', 'github', 'applications', 'terminal'];

        dockIds.forEach((id, index) => {
            const item = this.DESKTOP_ITEMS.find(i => i.id === id);
            if (item) {
                const btn = document.createElement('button');
                btn.className = 'dock-icon';
                btn.setAttribute('aria-label', item.label);
                btn.title = item.label; // Tooltip

                // Set dock index for staggered animations
                btn.style.setProperty('--dock-index', index);

                // Use emoji or SVG icon
                const isSvgIcon = item.icon.startsWith('svg:');
                btn.innerHTML = isSvgIcon
                    ? `<img src="${item.icon.replace('svg:', '')}" alt="${item.label}" class="dock-icon-svg" />`
                    : `<span class="dock-icon-emoji">${item.icon}</span>`;

                // Add click handler
                btn.onclick = (e) => {
                    // Bounce animation
                    btn.classList.add('bouncing');
                    setTimeout(() => btn.classList.remove('bouncing'), 1000);

                    // Create hex burst effect
                    this.createHexBurst(e.clientX, e.clientY, item.color);

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

        // Load saved positions (v2 key forces layout reset for existing users)
        const savedLayout = loadJSON('desktop_layout_v4', {});

        // Default positions for first-time visitors
        // Row-priority layout — recruiters read top-left first
        const getDefaultPosition = (item, index) => {
            const iconSpacingX = 110;
            const iconSpacingY = 100;
            const topAreaY = 100; // Below top bar

            // Row 1: First impression — About Me, Portfolio, Applications, Resume
            const row1 = ['about', 'portfolio', 'applications', 'resume'];
            // Row 2: Technical depth
            const row2 = ['github', 'skills', 'showcase', 'linkedin'];
            // Row 3: Live projects
            const row3 = ['vibe-coder', 'image-generator', 'terminal', 'contact'];
            // Row 4: Extras/Utilities
            const row4 = ['typemaster', 'portfolio-videos', 'settings', 'sysmon'];

            const allRows = [row1, row2, row3, row4];
            for (let row = 0; row < allRows.length; row++) {
                for (let col = 0; col < allRows[row].length; col++) {
                    if (allRows[row][col] === item.id) {
                        return { x: 40 + col * iconSpacingX, y: topAreaY + row * iconSpacingY };
                    }
                }
            }

            // Fallback: grid from top-left
            const col = index % 4;
            const row = Math.floor(index / 4);
            return { x: 40 + (col * iconSpacingX), y: topAreaY + (row * iconSpacingY) };
        };

        this.DESKTOP_ITEMS.forEach((item, index) => {
            const icon = document.createElement('button');
            icon.className = 'desktop-icon';
            icon.setAttribute('role', 'button');
            icon.setAttribute('aria-label', `Open ${item.label}`);
            icon.setAttribute('tabindex', '0');
            icon.style.color = item.color;
            icon.dataset.iconId = item.id;

            // Set icon index for staggered animations
            icon.style.setProperty('--icon-index', index);

            // Position Logic
            if (savedLayout[item.id]) {
                icon.style.top = `${savedLayout[item.id].y}px`;
                icon.style.left = `${savedLayout[item.id].x}px`;
            } else {
                // Smart default layout for first-time visitors
                const defaultPos = getDefaultPosition(item, index);
                icon.style.top = `${defaultPos.y}px`;
                icon.style.left = `${defaultPos.x}px`;
            }

            // Check if icon is SVG path or emoji
            const isSvgIcon = item.icon.startsWith('svg:');
            const iconContent = isSvgIcon
                ? `<img src="${item.icon.replace('svg:', '')}" alt="${item.label}" class="desktop-icon-svg" />`
                : `<span class="desktop-icon-emoji">${item.icon}</span>`;

            icon.innerHTML = `
                <div class="desktop-icon-box hud-scannable" style="border-color: ${item.color}40; box-shadow: 0 0 20px ${item.color}20;">
                    ${iconContent}
                    <div class="hud-scan-ring"></div>
                    <div class="hud-scan-ring"></div>
                </div>
                <span class="desktop-icon-label" style="color: ${item.color};">${item.label}</span>
            `;

            // Initialize Drag
            this.initDrag(icon, item.id);

            // Click to open (needs check to prevent opening after drag)
            icon.addEventListener('click', (e) => {
                if (icon.dataset.isDragging === 'true') return;

                // Create hex burst effect on click
                this.createHexBurst(e.clientX, e.clientY, item.color);

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
                    const currentLayout = loadJSON('desktop_layout_v4', {});
                    currentLayout[id] = {
                        x: parseInt(element.style.left),
                        y: parseInt(element.style.top)
                    };
                    saveJSON('desktop_layout_v4', currentLayout);

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
        const media = await loadMedia();

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
        let skillsRef = null;
        const win = WindowManager.create({
            id: 'skills',
            title: 'SKILLS_UNIVERSE // PHYSICS_ENGINE_V1',
            icon: '🕸️',
            width: 900,
            height: 600,
            onClose: () => { if (skillsRef) skillsRef.stop(); }
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

        // Init Physics Engine (lazy-loaded)
        setTimeout(async () => {
            const { SkillsUniverse } = await import('./skills.js');
            SkillsUniverse.init(content);
            skillsRef = SkillsUniverse;
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

        // Render Dashboard (lazy-loaded)
        import('./github.js').then(({ GitHub }) => GitHub.render(content));
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

        // Lazy-load terminal module
        import('./terminal.js').then(({ Terminal }) => Terminal.init(content));
    },

    /** Open the featured video directly */
    async openFeaturedVideo() {
        const media = await loadMedia();
        const videos = media.videos || [];

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
            const storedIcons = loadJSON('folderIcons', {});
            const customIcon = storedIcons[folderName] || '📁';

            const icon = isLocked ? '🔒' : customIcon;

            let html = `<div class="media-folder-icon">${icon}</div>`;

            // Add thumbnail background if available
            if (thumb && !isLocked) {
                folderDiv.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${Sanitize.attr(thumb)}')`;
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

            html += `<div class="media-folder-label">${Sanitize.text(folderName)}</div>`;
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

            const bgStyle = poster ? `background-image:url('${Sanitize.attr(poster)}')` : 'background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;';
            const contentHtml = poster ? '' : '<span style="font-size: 40px; opacity: 0.5;">🎬</span>';

            if (mode === 'list') {
                item.innerHTML = `
                    <div class="video-thumb-small" style="${bgStyle}; width: 80px; height: 45px; background-size: cover;">${contentHtml}</div>
                    <div class="video-info">
                        <div class="video-title">${Sanitize.text(video.title)}</div>
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
                    <div class="video-title">${Sanitize.text(video.title)}</div>
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
    async openMedia() {
        this.openMediaVault();
    },

    /**
     * Open Videos window
     */
    async openVideos() {
        const media = await loadMedia();
        const videos = media.videos || [];

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
                        <img src="${Sanitize.attr(video.poster)}" alt="${Sanitize.text(video.title)}">
                        <div class="video-play-icon">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="video-title">${Sanitize.text(video.title)}</div>
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
     * Open Portfolio — curated featured project showcase
     */
    openPortfolio() {
        const featured = [
            {
                name: 'PASSION_AGENT',
                desc: '24/7 autonomous AI code improvement system. Analyzes repos, spawns Claude Code sessions, submits PRs, and learns from merge/reject patterns.',
                tech: ['Node.js', 'Claude Code', 'MCP', 'SQLite'],
                color: '#00f0ff',
                demo: null,
                repo: null,
                featured: true,
            },
            {
                name: 'VIBE_CODER',
                desc: 'Vampire survivors-style idle game — 18 enemy types, 4 bosses, 26 weapons, Claude Code integration.',
                tech: ['Phaser 3', 'JavaScript', 'Vite', 'Web Audio'],
                color: '#ff00aa',
                demo: 'https://daredev256.github.io/vibe-coder/',
                repo: 'https://github.com/DareDev256/vibe-coder',
            },
            {
                name: 'PORTFOLIO_OS',
                desc: 'This cyberpunk desktop OS — 38 vanilla JS modules, Three.js galaxy, draggable windows, zero frameworks.',
                tech: ['JavaScript', 'Three.js', 'CSS3', 'Vite'],
                color: '#aa00ff',
                demo: 'https://jamesdare.com',
                repo: null,
            },
            {
                name: 'CULTURE_DROP_HQ',
                desc: 'Operations dashboard for Toronto hip-hop media — manage content, artists, and releases.',
                tech: ['React', 'Node.js', 'MongoDB', 'Tailwind'],
                color: '#ffaa00',
                demo: null,
                repo: null,
            },
            {
                name: 'FCPXML_MCP_SERVER',
                desc: 'AI-powered MCP server for Final Cut Pro XML — automate timeline editing with natural language.',
                tech: ['Python', 'Claude AI', 'MCP', 'XML'],
                color: '#00ff88',
                demo: null,
                repo: 'https://github.com/DareDev256/fcpxml-mcp-server',
            },
        ];

        const content = document.createElement('div');
        content.style.padding = '20px';

        const header = document.createElement('div');
        header.className = 'window-section-header';
        header.style.color = '#00f0ff';
        header.innerHTML = `◈ FEATURED PROJECTS <span style="font-size:11px; opacity:0.6; margin-left:8px;">${featured.length} Highlights</span>`;
        content.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'portfolio-grid';

        featured.forEach(project => {
            const card = document.createElement('div');
            card.className = `portfolio-card${project.featured ? ' portfolio-card--featured' : ''}`;
            card.style.setProperty('--card-accent', project.color);
            card.style.setProperty('--card-glow', `${project.color}12`);

            const title = document.createElement('div');
            title.className = 'portfolio-card__title';
            title.textContent = project.name;

            const desc = document.createElement('div');
            desc.className = 'portfolio-card__desc';
            desc.textContent = project.desc;

            const techRow = document.createElement('div');
            techRow.className = 'portfolio-card__tech';
            project.tech.forEach(t => {
                const badge = document.createElement('span');
                badge.className = 'portfolio-badge';
                badge.textContent = t;
                techRow.appendChild(badge);
            });

            const links = document.createElement('div');
            links.className = 'portfolio-card__links';

            if (project.demo) {
                const demoBtn = document.createElement('button');
                demoBtn.className = 'portfolio-link portfolio-link--live';
                demoBtn.textContent = 'LIVE DEMO';
                demoBtn.addEventListener('click', () => openExternal(project.demo));
                links.appendChild(demoBtn);
            }
            if (project.repo) {
                const repoBtn = document.createElement('button');
                repoBtn.className = 'portfolio-link';
                repoBtn.textContent = 'SOURCE';
                repoBtn.addEventListener('click', () => openExternal(project.repo));
                links.appendChild(repoBtn);
            }

            card.append(title, desc, techRow, links);
            grid.appendChild(card);
        });

        content.appendChild(grid);

        // Footer link to full applications list
        const footer = document.createElement('div');
        footer.style.cssText = 'margin-top:16px; padding-top:14px; border-top:1px solid rgba(0,240,255,0.12); text-align:center;';
        const allBtn = document.createElement('button');
        allBtn.className = 'portfolio-link';
        allBtn.textContent = 'VIEW ALL 18 PROJECTS →';
        allBtn.addEventListener('click', () => {
            WindowManager.close('portfolio');
            setTimeout(() => this.openApplicationsShowcase(), 250);
        });
        footer.appendChild(allBtn);
        content.appendChild(footer);

        WindowManager.create({
            id: 'portfolio',
            title: 'PORTFOLIO // FEATURED_PROJECTS',
            icon: '◈',
            content,
            width: 680,
            height: 620,
        });
    },

    /**
     * Open Applications window (React-style showcase)
     */
    openApplicationsShowcase() {
        const categories = [
            {
                name: 'AI & Machine Learning',
                color: '#00f0ff',
                apps: [
                    { name: 'FCPXML_MCP_SERVER', desc: 'AI-powered MCP server for Final Cut Pro XML editing', status: 'deployed', link: 'https://github.com/DareDev256/fcpxml-mcp-server' },
                    { name: 'RAG_WITH_CITATIONS', desc: 'Enterprise RAG pipeline with source attribution', status: 'deployed', link: 'https://github.com/DareDev256/rag-system-with-citations' },
                    { name: 'VECTOR_SEARCH_ENGINE', desc: 'Semantic vector vs BM25 keyword search comparison', status: 'deployed', link: 'https://github.com/DareDev256/vector-vs-keyword-search' },
                    { name: 'LLM_EVAL_HARNESS', desc: 'LLM evaluation framework with CI/CD integration', status: 'deployed', link: 'https://github.com/DareDev256/llm-evaluation-harness' },
                    { name: 'MEMORY_MASTER', desc: 'AI spaced repetition learning platform (GPT-4 + FSRS)', status: 'deployed', link: 'https://github.com/DareDev256/memory-master-mvp' },
                    { name: 'CONTRACT_TRANSLATOR', desc: 'AI contract analysis \u2014 plain-English legal breakdown', status: 'live', link: 'https://contract-translator.vercel.app' },
                ],
            },
            {
                name: 'Full-Stack Applications',
                color: '#ff00aa',
                apps: [
                    { name: 'SERVICE_TRACKER_PRO', desc: 'Dealership vehicle tracking system', status: 'live', link: 'https://servicetracker-production-f05b.up.railway.app' },
                    { name: 'PULSEMAP', desc: 'Real-time global disease surveillance dashboard', status: 'live', link: 'https://pulsemap-three.vercel.app' },
                    { name: 'CULTURE_DROP_HQ', desc: 'Operations dashboard for Toronto hip-hop media', status: 'deployed', link: 'https://github.com/DareDev256/culture-drop-hq' },
                    { name: 'MUSIC_TIME_MACHINE', desc: 'Music intelligence dashboard (Spotify, YouTube, Billboard)', status: 'deployed', link: 'https://github.com/DareDev256/music-time-machine' },
                ],
            },
            {
                name: 'Creative & Client Work',
                color: '#ffaa00',
                apps: [
                    { name: 'TDOTS_PORTFOLIO', desc: 'Synthwave 3D music video portfolio', status: 'live', link: 'https://tdotssolutionsz-portfolio.vercel.app' },
                    { name: 'CASPER_TNG_SITE', desc: 'Official website for Toronto rapper Casper TNG', status: 'deployed', link: 'https://github.com/DareDev256/casper-tng-website' },
                    { name: 'IMG_GEN_PROMPTS', desc: 'AI prompt engineering tool for image/video generation', status: 'live', link: 'https://web-ten-vert-46.vercel.app' },
                    { name: 'BUILDRIGHT', desc: 'Duolingo-style mobile learning app (React Native)', status: 'deployed', link: 'https://github.com/DareDev256/buildright' },
                ],
            },
            {
                name: 'Games & Tools',
                color: '#00ff88',
                apps: [
                    { name: 'VIBE_CODER', desc: 'Vampire survivors-style idle game powered by coding', status: 'live', link: 'https://daredev256.github.io/vibe-coder' },
                    { name: 'RAW_EXE', desc: 'Personal NetNavi Desktop Companion (Claude AI)', status: 'deployed', link: 'https://github.com/DareDev256/raw-exe' },
                    { name: 'NIN_WIKI_TOOLS', desc: 'AI-assisted Fandom wiki bot with approval workflows', status: 'deployed', link: 'https://github.com/DareDev256/fandom-wiki-bot-template' },
                    { name: 'PIXEL_ART_LORA', desc: 'LoRA training toolkit for Flux sprite sheets', status: 'deployed', link: 'https://github.com/DareDev256/pixel-art-lora-training' },
                ],
            },
        ];

        const totalApps = categories.reduce((sum, cat) => sum + cat.apps.length, 0);
        const content = document.createElement('div');
        content.style.padding = '20px';

        // Header with count
        const header = document.createElement('div');
        header.className = 'window-section-header magenta';
        header.innerHTML = `\u26A1 APPLICATIONS <span style="font-size:11px; opacity:0.7; margin-left:10px;">${totalApps} Projects</span>`;
        content.appendChild(header);

        // Scrollable app list
        const appList = document.createElement('div');
        appList.className = 'app-list-container';
        appList.style.maxHeight = '500px';
        appList.style.overflowY = 'auto';
        appList.style.paddingRight = '5px';

        categories.forEach((category) => {
            // Category header
            const catHeader = document.createElement('div');
            catHeader.style.cssText = `color:${category.color}; font-size:12px; letter-spacing:2px; font-weight:700; margin:20px 0 10px; padding-bottom:6px; border-bottom:1px solid ${category.color}33; text-transform:uppercase;`;
            catHeader.textContent = `\u25B8 ${category.name}`;
            appList.appendChild(catHeader);

            category.apps.forEach((app) => {
                const appItem = document.createElement('div');
                appItem.className = 'app-item';

                const isLive = app.status === 'live';
                const badgeColor = isLive ? '#00ff88' : '#00f0ff';
                const badgeText = isLive ? 'DEPLOYED' : 'SOURCE';

                const appInfo = document.createElement('div');
                appInfo.className = 'app-item-info';
                appInfo.innerHTML = `
                    <div class="app-item-name">${Sanitize.text(app.name)}</div>
                    <div class="app-item-desc">${Sanitize.text(app.desc)}</div>
                    <span style="display:inline-block; font-size:9px; letter-spacing:1px; padding:2px 6px; border:1px solid ${badgeColor}; color:${badgeColor}; background:${badgeColor}15; border-radius:3px; margin-top:4px;">${badgeText}</span>
                `;

                const launchBtn = document.createElement('button');
                launchBtn.textContent = isLive ? 'LAUNCH' : 'VIEW';
                if (isLive) {
                    launchBtn.style.background = 'rgba(0,255,136,0.1)';
                    launchBtn.style.borderColor = '#00ff8844';
                    launchBtn.style.color = '#00ff88';
                }
                launchBtn.addEventListener('click', () => {
                    if (app.link) openExternal(app.link);
                });

                appItem.appendChild(appInfo);
                appItem.appendChild(launchBtn);
                appList.appendChild(appItem);
            });
        });

        content.appendChild(appList);

        // Footer — link to full portfolio
        const footer = document.createElement('div');
        footer.style.marginTop = '20px';
        footer.style.paddingTop = '20px';
        footer.style.borderTop = '1px solid rgba(255,0,170,0.2)';

        const portfolioBtn = document.createElement('button');
        portfolioBtn.className = 'project-link';
        portfolioBtn.textContent = 'View Full Project Portfolio \u2192';
        portfolioBtn.addEventListener('click', () => {
            WindowManager.close('applications');
            setTimeout(() => this.openApplications(), 300);
        });

        footer.appendChild(portfolioBtn);
        content.appendChild(footer);

        WindowManager.create({
            id: 'applications',
            title: 'APPLICATIONS',
            icon: '\u26A1',
            content,
            width: 700,
            height: 650,
        });
    },

    /**
     * Open Applications window (Full portfolio)
     */
    async openApplications() {
        let projects = await loadProjects();
        if (!projects || projects.length === 0) {
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
            ${allTags.map((tag) => `<button class="filter-tag" data-tag="${tag}">${Sanitize.text(tag)}</button>`).join('')}
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
                    <div class="project-title">${Sanitize.text(project.title)}</div>
                    <div class="project-description">${Sanitize.text(project.description)}</div>
                    <div class="project-tech">
                        ${project.tech.map((t) => `<span class="tech-tag">${Sanitize.text(t)}</span>`).join('')}
                    </div>
                    <div class="project-links">
                        ${project.demo ? `<a href="${Sanitize.attr(project.demo)}" target="_blank" class="project-link">View Demo</a>` : ''}
                        ${project.repo ? `<a href="${Sanitize.attr(project.repo)}" target="_blank" class="project-link secondary">GitHub</a>` : ''}
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
        content.className = 'resume-dashboard';

        content.innerHTML = `
            <!-- Header -->
            <div class="resume-header">
                <div class="resume-avatar">DD</div>
                <div class="resume-title">
                    <h2>DAREDEV256</h2>
                    <p>Full Stack Developer • Creative Technologist</p>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="resume-stats-grid">
                <div class="resume-stat-card">
                    <div class="stat-icon">📅</div>
                    <div class="stat-value" data-target="5">0</div>
                    <div class="stat-label">Years Experience</div>
                </div>
                <div class="resume-stat-card">
                    <div class="stat-icon">💼</div>
                    <div class="stat-value" data-target="50">0</div>
                    <div class="stat-label">Projects Completed</div>
                </div>
                <div class="resume-stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-value" data-target="15">0</div>
                    <div class="stat-label">Key Skills</div>
                </div>
                <div class="resume-stat-card">
                    <div class="stat-icon">🏆</div>
                    <div class="stat-value" data-target="100">0</div>
                    <div class="stat-label">Commits This Month</div>
                </div>
            </div>

            <!-- Skills Breakdown -->
            <div class="resume-skills">
                <h3>CORE COMPETENCIES</h3>
                <div class="skill-bars">
                    <div class="skill-bar">
                        <div class="skill-info">
                            <span>JavaScript / TypeScript</span>
                            <span>95%</span>
                        </div>
                        <div class="skill-progress">
                            <div class="skill-fill" style="width: 95%"></div>
                        </div>
                    </div>
                    <div class="skill-bar">
                        <div class="skill-info">
                            <span>React / Vue / Svelte</span>
                            <span>90%</span>
                        </div>
                        <div class="skill-progress">
                            <div class="skill-fill" style="width: 90%"></div>
                        </div>
                    </div>
                    <div class="skill-bar">
                        <div class="skill-info">
                            <span>Node.js / Python</span>
                            <span>85%</span>
                        </div>
                        <div class="skill-progress">
                            <div class="skill-fill" style="width: 85%"></div>
                        </div>
                    </div>
                    <div class="skill-bar">
                        <div class="skill-info">
                            <span>UI/UX Design</span>
                            <span>80%</span>
                        </div>
                        <div class="skill-progress">
                            <div class="skill-fill" style="width: 80%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="resume-actions">
                <button class="cyber-button" id="viewResumeBtn">📄 VIEW FULL RESUME</button>
                <a href="resume/resume.pdf" download class="cyber-button secondary">⬇ DOWNLOAD PDF</a>
            </div>
        `;

        const win = WindowManager.create({
            id: 'resume',
            title: 'Resume',
            icon: '📄',
            content,
            width: 700,
            height: 650,
        });

        // Animate counters on load
        setTimeout(() => {
            content.querySelectorAll('.stat-value').forEach(el => {
                const target = parseInt(el.dataset.target);
                this.animateCounter(el, target, 1500);
            });
        }, 100);

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
     * Animate counter from 0 to target (delegates to shared dom-helpers)
     */
    animateCounter: animateCounter,

    /**
     * Open About window
     */
    openAbout() {
        const content = document.createElement('div');
        content.className = 'about-content';

        content.innerHTML = `
            <div class="window-section-header purple">◈ ABOUT_ME.exe</div>
            <div style="line-height: 2; font-size: 12px;">
                <div><span style="color: #aa00ff;">NAME:</span> James Olusoga <span style="color: rgba(255,255,255,0.4);">(DareDev256)</span></div>
                <div><span style="color: #aa00ff;">ROLE:</span> AI Solutions Engineer &bull; Creative Technologist <span class="verified-badge">✓ SYSTEM VERIFIED</span></div>
                <div><span style="color: #aa00ff;">LOCATION:</span> Toronto, Canada</div>
                <div><span style="color: #aa00ff;">STATUS:</span> Always shipping</div>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(170,0,255,0.2);">
                <p style="line-height: 1.8; color: rgba(255,255,255,0.7); font-size: 12px;">
                    I build autonomous AI systems that work while I sleep. My flagship project,
                    <span style="color: #00f0ff;">Passion Agent</span>, is a 24/7 autonomous code improvement system
                    that analyzes repositories, generates improvements via Claude Code, and submits PRs &mdash;
                    learning from what I merge vs reject to get smarter over time.
                </p>
                <p style="line-height: 1.8; color: rgba(255,255,255,0.7); font-size: 12px;">
                    I specialize in <span style="color: #00f0ff;">agentic AI workflows</span>, RAG systems with citations,
                    MCP server development, and full-stack engineering. This portfolio itself is a cyberpunk OS
                    built with zero frameworks &mdash; pure vanilla JS, Three.js for 3D, and hand-crafted CSS.
                </p>
            </div>
            <div style="margin-top: 20px;">
                <h3 style="color: #aa00ff; font-size: 13px; margin-bottom: 15px; letter-spacing: 1px;">SKILLS & TECHNOLOGIES</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                    <div style="background: rgba(0,240,255,0.08); border: 1px solid rgba(0,240,255,0.25); padding: 8px; text-align: center; font-size: 11px; color: #00f0ff;">Python</div>
                    <div style="background: rgba(0,240,255,0.08); border: 1px solid rgba(0,240,255,0.25); padding: 8px; text-align: center; font-size: 11px; color: #00f0ff;">TypeScript</div>
                    <div style="background: rgba(0,240,255,0.08); border: 1px solid rgba(0,240,255,0.25); padding: 8px; text-align: center; font-size: 11px; color: #00f0ff;">JavaScript</div>
                    <div style="background: rgba(170,0,255,0.1); border: 1px solid rgba(170,0,255,0.3); padding: 8px; text-align: center; font-size: 11px; color: #aa00ff;">LLM / RAG</div>
                    <div style="background: rgba(170,0,255,0.1); border: 1px solid rgba(170,0,255,0.3); padding: 8px; text-align: center; font-size: 11px; color: #aa00ff;">AI Agents</div>
                    <div style="background: rgba(170,0,255,0.1); border: 1px solid rgba(170,0,255,0.3); padding: 8px; text-align: center; font-size: 11px; color: #aa00ff;">MCP Protocol</div>
                    <div style="background: rgba(0,255,136,0.08); border: 1px solid rgba(0,255,136,0.25); padding: 8px; text-align: center; font-size: 11px; color: #00ff88;">React / Next.js</div>
                    <div style="background: rgba(0,255,136,0.08); border: 1px solid rgba(0,255,136,0.25); padding: 8px; text-align: center; font-size: 11px; color: #00ff88;">Node.js</div>
                    <div style="background: rgba(0,255,136,0.08); border: 1px solid rgba(0,255,136,0.25); padding: 8px; text-align: center; font-size: 11px; color: #00ff88;">Three.js / WebGL</div>
                    <div style="background: rgba(255,170,0,0.08); border: 1px solid rgba(255,170,0,0.25); padding: 8px; text-align: center; font-size: 11px; color: #ffaa00;">Supabase / SQL</div>
                    <div style="background: rgba(255,170,0,0.08); border: 1px solid rgba(255,170,0,0.25); padding: 8px; text-align: center; font-size: 11px; color: #ffaa00;">Git / CI-CD</div>
                    <div style="background: rgba(255,170,0,0.08); border: 1px solid rgba(255,170,0,0.25); padding: 8px; text-align: center; font-size: 11px; color: #ffaa00;">Vercel / Cloud</div>
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
                <a href="https://linkedin.com/in/james-olusoga" target="_blank" class="social-btn">
                    <span style="font-size: 1.2em">🔗</span>
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
                    window.location.href = `mailto:tdotssolutionsz@gmail.com?subject=${subject}&body=${body}`;
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

                <!-- Content Management: Admin panel accessible via console Admin.open() -->
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

        // Admin panel accessible via console: import('./admin.js').then(m => m.Admin.open())
    },

    /** Open System Monitor — real-time performance dashboard */
    openSystemMonitor() {
        createLazyWindow({
            id: 'sysmon', title: 'SYS_MONITOR // DIAGNOSTICS', icon: '📊',
            width: 480, height: 520,
            load: () => import('./system-monitor.js'), exportName: 'renderSystemMonitor',
        });
    },

    /** Open Sticky Notes — persistent note-taking utility */
    openStickyNotes() {
        createLazyWindow({
            id: 'sticky-notes', title: 'NOTES // STICKY', icon: '📝',
            width: 520, height: 440,
            load: () => import('./sticky-notes.js'), exportName: 'renderStickyNotes',
        });
    },

    /** Open Pomodoro Timer — focus session utility with work/break cycles */
    openPomodoroTimer() {
        createLazyWindow({
            id: 'pomodoro', title: 'FOCUS_TIMER // POMODORO', icon: '⏱',
            width: 320, height: 440,
            load: () => import('./pomodoro-timer.js'), exportName: 'renderPomodoroTimer',
        });
    },

    openCalculator() {
        createLazyWindow({
            id: 'calculator', title: 'CALC.exe // CALCULATOR', icon: '🧮',
            width: 280, height: 400,
            load: () => import('./calculator.js'), exportName: 'renderCalculator',
        });
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
     * Disabled when galaxy theme is active
     */
    animateWatermark() {
        // Skip watermark when galaxy theme is active
        if (document.body.classList.contains('galaxy-active')) return;

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
