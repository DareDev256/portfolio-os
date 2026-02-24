import { WindowManager } from './windows.js';
import { Desktop } from './desktop.js';
import { State } from './state.js';
import { Sanitize } from './sanitize.js';
import { loadMedia, loadProjects, invalidateData } from './data-loader.js';
import { loadJSON, downloadJSON } from './dom-helpers.js';

/**
 * Admin Dashboard
 * Comprehensive content management system for Passion OS
 * - Desktop Items Editor
 * - Projects Manager
 * - Media Manager
 * - Theme Customizer
 * - Import/Export Data
 */

export const Admin = {
    currentTab: 'desktop',
    desktopItems: [],
    projects: [],
    media: { images: [], videos: [] },

    /**
     * Open Admin Dashboard
     */
    open() {
        const container = document.createElement('div');
        container.className = 'admin-dashboard';
        Sanitize.setHTML(container, this.getHTML());

        WindowManager.create({
            id: 'admin',
            title: 'Admin Dashboard',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>',
            content: container,
            width: 900,
            height: 700,
        });

        this.initTabs(container);
        this.loadAllData();
        this.renderCurrentTab(container);
    },

    /**
     * Get main HTML structure
     */
    getHTML() {
        return `
            <div class="admin-window">
                <div class="admin-container">
                    <div class="admin-sidebar">
                        <div class="admin-nav-item active" data-tab="desktop">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
                            Desktop
                        </div>
                        <div class="admin-nav-item" data-tab="projects">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>
                            Projects
                        </div>
                        <div class="admin-nav-item" data-tab="media">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                            Media
                        </div>
                        <div class="admin-nav-item" data-tab="theme">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                            Theme
                        </div>
                        <div class="admin-nav-item" data-tab="data">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
                            Data
                        </div>
                    </div>
                    <div class="admin-content" id="adminContent">
                        <!-- Content loaded dynamically -->
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Initialize tab navigation
     */
    initTabs(container) {
        const tabs = container.querySelectorAll('.admin-nav-item');
        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                tabs.forEach((t) => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.tab;
                this.renderCurrentTab(container);
            });
        });
    },

    /**
     * Load all data from localStorage and fallback files
     */
    async loadAllData() {
        // Load desktop items
        this.desktopItems = loadJSON('desktopItems', null) || [...Desktop.DESKTOP_ITEMS];

        // Load projects and media via centralized data-loader
        this.projects = await loadProjects() || [];
        this.media = await loadMedia();
    },

    /**
     * Render current tab content
     */
    renderCurrentTab(container) {
        const content = container.querySelector('#adminContent');

        // Use Sanitize.setHTML to ensure all rendered HTML passes DOMPurify
        // even though templates use Sanitize.text() for interpolation.
        // Defense-in-depth: if a template is later modified to include
        // user-controlled data, the sanitizer catches it.
        const renderTab = (html, handler) => {
            Sanitize.setHTML(content, html, {
                ADD_TAGS: ['input', 'textarea', 'select', 'option', 'form', 'style'],
                ADD_ATTR: ['for', 'name', 'maxlength', 'rows', 'accept', 'multiple', 'checked', 'selected', 'data-tab', 'data-index', 'data-action', 'data-type', 'data-folder', 'style']
            });
            handler(content);
        };

        switch (this.currentTab) {
            case 'desktop':
                renderTab(this.getDesktopItemsHTML(), (c) => this.initDesktopItemsHandlers(c));
                break;
            case 'projects':
                renderTab(this.getProjectsHTML(), (c) => this.initProjectsHandlers(c));
                break;
            case 'media':
                renderTab(this.getMediaHTML(), (c) => this.initMediaHandlers(c));
                break;
            case 'theme':
                renderTab(this.getThemeHTML(), (c) => this.initThemeHandlers(c));
                break;
            case 'data':
                renderTab(this.getDataHTML(), (c) => this.initDataHandlers(c));
                break;
        }
    },

    /**
     * Desktop Items Tab HTML
     */
    getDesktopItemsHTML() {
        return `
            <div class="admin-section">
                <div class="admin-section-header">
                    <h3>Desktop Icons</h3>
                    <button class="admin-btn primary" id="addDesktopItem">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                        Add Icon
                    </button>
                </div>
                <div class="admin-help">
                    Configure desktop icons: label, emoji, color, and action. Changes apply after saving and refreshing.
                </div>
                <div id="desktopItemsList" class="admin-list">
                    ${this.desktopItems.map((item, index) => this.getDesktopItemRow(item, index)).join('')}
                </div>
                <div class="admin-actions">
                    <button class="admin-btn success" id="saveDesktopItems">Save Desktop Items</button>
                    <button class="admin-btn secondary" id="resetDesktopItems">Reset to Default</button>
                </div>
            </div>
        `;
    },

    /**
     * Get desktop item row HTML
     */
    getDesktopItemRow(item, index) {
        return `
            <div class="admin-card" data-index="${index}">
                <div class="admin-card-header">
                    <div class="drag-handle">⋮⋮</div>
                    <div class="admin-card-preview" style="background: ${/^#[0-9a-fA-F]{3,8}$/.test(item.color) ? item.color : '#00f0ff'}15; border-color: ${/^#[0-9a-fA-F]{3,8}$/.test(item.color) ? item.color : '#00f0ff'}40;">
                        <span style="font-size: 20px;">${Sanitize.text(item.icon)}</span>
                    </div>
                    <div class="admin-card-title">${Sanitize.text(item.label)}</div>
                    <button class="admin-btn-icon delete" data-action="delete" data-index="${index}">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
                <div class="admin-card-body">
                    <div class="admin-form-grid">
                        <label>
                            ID
                            <input type="text" class="item-id" value="${Sanitize.text(item.id)}" placeholder="unique-id">
                        </label>
                        <label>
                            Label
                            <input type="text" class="item-label" value="${Sanitize.text(item.label)}" placeholder="MY_APP">
                        </label>
                        <label>
                            Icon (Emoji)
                            <input type="text" class="item-icon" value="${Sanitize.text(item.icon)}" placeholder="🚀" maxlength="2">
                        </label>
                        <label>
                            Color
                            <input type="color" class="item-color" value="${item.color}">
                        </label>
                        <label style="grid-column: span 2;">
                            Action (Function Name)
                            <select class="item-action">
                                <option value="openMediaVault" ${item.action.name === 'openMediaVault' ? 'selected' : ''}>Open Media Vault</option>
                                <option value="openApplications" ${item.action.name === 'openApplications' ? 'selected' : ''}>Open Applications</option>
                                <option value="openShell" ${item.action.name === 'openShell' ? 'selected' : ''}>Open Terminal</option>
                                <option value="openAbout" ${item.action.name === 'openAbout' ? 'selected' : ''}>Open About</option>
                                <option value="openContact" ${item.action.name === 'openContact' ? 'selected' : ''}>Open Contact</option>
                                <option value="openResume" ${item.action.name === 'openResume' ? 'selected' : ''}>Open Resume</option>
                                <option value="openSettings" ${item.action.name === 'openSettings' ? 'selected' : ''}>Open Settings</option>
                            </select>
                        </label>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Initialize desktop items handlers
     */
    initDesktopItemsHandlers(content) {
        // Add new item
        content.querySelector('#addDesktopItem')?.addEventListener('click', () => {
            const newItem = {
                id: `custom-${Date.now()}`,
                label: 'NEW_APP',
                icon: '⭐',
                color: '#00f0ff',
                action: () => Desktop.openAbout(),
            };
            this.desktopItems.push(newItem);
            this.renderCurrentTab(content.closest('.admin-dashboard'));
        });

        // Delete items
        content.querySelectorAll('[data-action="delete"]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.desktopItems.splice(index, 1);
                this.renderCurrentTab(content.closest('.admin-dashboard'));
            });
        });

        // Save desktop items
        content.querySelector('#saveDesktopItems')?.addEventListener('click', () => {
            this.saveDesktopItems(content);
        });

        // Reset to default
        content.querySelector('#resetDesktopItems')?.addEventListener('click', () => {
            if (confirm('Reset all desktop items to default? This cannot be undone.')) {
                localStorage.removeItem('desktopItems');
                this.desktopItems = [...Desktop.DESKTOP_ITEMS];
                this.renderCurrentTab(content.closest('.admin-dashboard'));
                alert('Desktop items reset to default. Refresh the page to see changes.');
            }
        });
    },

    /**
     * Save desktop items
     */
    saveDesktopItems(content) {
        const items = [];
        content.querySelectorAll('.admin-card').forEach((card) => {
            const item = {
                id: card.querySelector('.item-id').value.trim(),
                label: card.querySelector('.item-label').value.trim(),
                icon: card.querySelector('.item-icon').value.trim(),
                color: card.querySelector('.item-color').value,
                action: card.querySelector('.item-action').value,
            };
            items.push(item);
        });

        localStorage.setItem('desktopItems', JSON.stringify(items));
        this.desktopItems = items;
        alert('Desktop items saved! Refresh the page to see changes on the desktop.');
    },

    /**
     * Projects Tab HTML
     */
    getProjectsHTML() {
        return `
            <div class="admin-section">
                <div class="admin-section-header">
                    <h3>Projects Portfolio</h3>
                    <button class="admin-btn primary" id="addProject">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                        Add Project
                    </button>
                </div>
                <div class="admin-help">
                    Manage your portfolio projects. These appear in the Applications window with filtering by tags.
                </div>
                <div id="projectsList" class="admin-list">
                    ${this.projects.map((project, index) => this.getProjectRow(project, index)).join('')}
                </div>
                <div class="admin-actions">
                    <button class="admin-btn success" id="saveProjects">Save Projects</button>
                    <button class="admin-btn secondary" id="exportProjects">Export projects.json</button>
                </div>
            </div>
        `;
    },

    /**
     * Get project row HTML
     */
    getProjectRow(project, index) {
        return `
            <div class="admin-card" data-index="${index}">
                <div class="admin-card-header">
                    <div class="admin-card-title">${Sanitize.text(project.title || 'Untitled Project')}</div>
                    <div class="admin-card-tags">
                        ${(project.tags || []).map((tag) => `<span class="tag">${Sanitize.text(tag)}</span>`).join('')}
                    </div>
                    <button class="admin-btn-icon delete" data-action="deleteProject" data-index="${index}">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
                <div class="admin-card-body">
                    <div class="admin-form-grid">
                        <label style="grid-column: span 2;">
                            Title
                            <input type="text" class="proj-title" value="${Sanitize.text(project.title || '')}" placeholder="Project Name">
                        </label>
                        <label style="grid-column: span 2;">
                            Description
                            <textarea class="proj-desc" rows="3" placeholder="Brief description...">${Sanitize.text(project.description || '')}</textarea>
                        </label>
                        <label>
                            Technologies (comma-separated)
                            <input type="text" class="proj-tech" value="${Sanitize.text((project.tech || []).join(', '))}" placeholder="React, Node.js, MongoDB">
                        </label>
                        <label>
                            Tags (comma-separated)
                            <input type="text" class="proj-tags" value="${Sanitize.text((project.tags || []).join(', '))}" placeholder="Web, Fullstack">
                        </label>
                        <label>
                            Demo URL
                            <input type="url" class="proj-demo" value="${Sanitize.text(project.demo || '')}" placeholder="https://demo.com">
                        </label>
                        <label>
                            Repository URL
                            <input type="url" class="proj-repo" value="${Sanitize.text(project.repo || '')}" placeholder="https://github.com/...">
                        </label>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Initialize projects handlers
     */
    initProjectsHandlers(content) {
        // Add project
        content.querySelector('#addProject')?.addEventListener('click', () => {
            this.projects.push({
                title: '',
                description: '',
                tech: [],
                tags: [],
                demo: '',
                repo: '',
            });
            this.renderCurrentTab(content.closest('.admin-dashboard'));
        });

        // Delete project
        content.querySelectorAll('[data-action="deleteProject"]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.projects.splice(index, 1);
                this.renderCurrentTab(content.closest('.admin-dashboard'));
            });
        });

        // Save projects
        content.querySelector('#saveProjects')?.addEventListener('click', () => {
            this.saveProjects(content);
        });

        // Export projects
        content.querySelector('#exportProjects')?.addEventListener('click', () => {
            this.exportProjects(content);
        });
    },

    /**
     * Save projects
     */
    saveProjects(content) {
        const projects = [];
        content.querySelectorAll('#projectsList .admin-card').forEach((card) => {
            const project = {
                title: card.querySelector('.proj-title').value.trim(),
                description: card.querySelector('.proj-desc').value.trim(),
                tech: card
                    .querySelector('.proj-tech')
                    .value.split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                tags: card
                    .querySelector('.proj-tags')
                    .value.split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                demo: Sanitize.url(card.querySelector('.proj-demo').value.trim()) || null,
                repo: Sanitize.url(card.querySelector('.proj-repo').value.trim()) || null,
            };
            if (project.title) projects.push(project);
        });

        localStorage.setItem('projects.json', JSON.stringify(projects, null, 2));
        invalidateData('projects.json');
        this.projects = projects;
        alert('Projects saved! Open Applications window to preview.');
    },

    /**
     * Export projects to JSON file
     */
    exportProjects(content) {
        this.saveProjects(content);
        downloadJSON(this.projects, 'projects.json');
        alert('projects.json downloaded! Replace data/projects.json with this file.');
    },

    /**
     * Media Tab HTML
     */
    getMediaHTML() {
        return `
            <div class="admin-header">
                <h2 class="admin-title">Media Library</h2>
                <p class="admin-subtitle">Manage images, videos, and folder icons</p>
            </div>

            <div class="drop-zone" id="mediaDropZone">
                <div class="drop-zone-icon">☁️</div>
                <div class="drop-zone-text">Drag & Drop files here</div>
                <div class="drop-zone-subtext">or click to browse</div>
                <input type="file" class="file-input" id="mediaFileInput" multiple accept="image/*,video/*">
            </div>

            <div class="admin-section" style="margin-top: 20px;">
                <div class="admin-section-header">
                    <h3>Folder Icons</h3>
                </div>
                <div id="folderIconsList" class="folder-icons-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                    <!-- Populated by JS -->
                </div>
            </div>

            <div class="admin-section" style="margin-top: 20px;">
                <div class="admin-section-header">
                    <h3>Content Items</h3>
                    <div style="display: flex; gap: 8px;">
                        <button class="admin-btn primary" id="addImage">Add Image</button>
                        <button class="admin-btn primary" id="addVideo">Add Video</button>
                    </div>
                </div>
                <div id="mediaList" class="admin-list">
                    ${this.getMediaItemsHTML()}
                </div>
                <div class="admin-actions">
                    <button class="admin-btn success" id="saveMedia">Save Changes</button>
                    <button class="admin-btn secondary" id="exportMedia">Export JSON</button>
                </div>
            </div>
        `;
    },

    /**
     * Get media items HTML
     */
    getMediaItemsHTML() {
        let html = '';

        // Images
        (this.media.images || []).forEach((img, index) => {
            html += `
                <div class="admin-card" data-type="image" data-index="${index}">
                    <div class="admin-card-header">
                        <div class="admin-card-preview media-preview">
                            ${img.url ? `<img src="${Sanitize.attr(img.url)}" alt="${Sanitize.text(img.caption)}" style="max-width: 100%; max-height: 60px; object-fit: cover;">` : '📷'}
                        </div>
                        <div class="admin-card-title">Image</div>
                        <button class="admin-btn-icon delete" data-action="deleteMedia" data-type="image" data-index="${index}">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                    </div>
                    <div class="admin-card-body">
                        <div class="admin-form-grid">
                            <label style="grid-column: span 2;">
                                URL/Path
                                <input type="text" class="media-url" value="${Sanitize.text(img.url || '')}" placeholder="assets/media/photo.jpg">
                            </label>
                            <label>
                                Category
                                <input type="text" class="media-category" value="${Sanitize.text(img.category || '')}" placeholder="Nature, Portraits, etc.">
                            </label>
                            <label>
                                Caption
                                <input type="text" class="media-caption" value="${Sanitize.text(img.caption || '')}" placeholder="Photo description">
                            </label>
                        </div>
                    </div>
                </div>
            `;
        });

        // Videos
        (this.media.videos || []).forEach((video, index) => {
            html += `
                <div class="admin-card" data-type="video" data-index="${index}">
                    <div class="admin-card-header">
                        <div class="admin-card-preview media-preview">
                            ${video.poster ? `<img src="${Sanitize.attr(video.poster)}" alt="${Sanitize.text(video.title)}" style="max-width: 100%; max-height: 60px; object-fit: cover;">` : '🎬'}
                        </div>
                        <div class="admin-card-title">Video: ${Sanitize.text(video.title || 'Untitled')}</div>
                        <button class="admin-btn-icon delete" data-action="deleteMedia" data-type="video" data-index="${index}">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                    </div>
                    <div class="admin-card-body">
                        <div class="admin-form-grid">
                            <label style="grid-column: span 2;">
                                Video URL
                                <input type="text" class="media-url" value="${Sanitize.text(video.url || '')}" placeholder="https://youtube.com/watch?v=...">
                            </label>
                            <label>
                                Title
                                <input type="text" class="media-title" value="${Sanitize.text(video.title || '')}" placeholder="Video Title">
                            </label>
                            <label>
                                Poster URL
                                <input type="text" class="media-poster" value="${Sanitize.text(video.poster || '')}" placeholder="Thumbnail image URL">
                            </label>
                        </div>
                    </div>
                </div>
            `;
        });

        return (
            html ||
            '<div class="admin-empty">No media items yet. Click "Add Image" or "Add Video" to get started.</div>'
        );
    },

    /**
     * Initialize media handlers
     */
    initMediaHandlers(content) {
        // Drag & Drop
        this.setupDragAndDrop(content);

        // Render Folder Icons
        const folderList = content.querySelector('#folderIconsList');
        if (folderList) {
            const folders = ['Real Estate', 'Glamour', 'Cars', 'Music Videos', 'Archive'];
            const storedIcons = loadJSON('folderIcons', {});

            const defaultIcons = {
                'Real Estate': '🏠',
                'Glamour': '✨',
                'Cars': '🏎️',
                'Music Videos': '🎵',
                'Archive': '📦'
            };

            Sanitize.setHTML(folderList, folders.map(folder => {
                const icon = storedIcons[folder] || defaultIcons[folder] || '📁';
                return `
                    <div class="folder-icon-item" style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
                        <label style="display: block; color: var(--neon-cyan); font-size: 11px; margin-bottom: 5px;">${Sanitize.text(folder)}</label>
                        <input type="text" class="folder-icon-input" data-folder="${Sanitize.text(folder)}" value="${Sanitize.text(icon)}" style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(0,240,255,0.3); color: white; padding: 5px; border-radius: 4px; text-align: center;">
                    </div>
                `;
            }).join(''), {
                ADD_TAGS: ['input'],
                ADD_ATTR: ['data-folder', 'style']
            });
        }

        // Add image
        content.querySelector('#addImage')?.addEventListener('click', () => {
            this.media.images.push({ url: '', caption: '', category: '' });
            this.renderCurrentTab(content.closest('.admin-dashboard'));
        });

        // Add video
        content.querySelector('#addVideo')?.addEventListener('click', () => {
            this.media.videos.push({ url: '', title: '', poster: '' });
            this.renderCurrentTab(content.closest('.admin-dashboard'));
        });

        // Delete media
        content.querySelectorAll('[data-action="deleteMedia"]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const index = parseInt(btn.dataset.index);
                if (type === 'image') {
                    this.media.images.splice(index, 1);
                } else {
                    this.media.videos.splice(index, 1);
                }
                this.renderCurrentTab(content.closest('.admin-dashboard'));
            });
        });

        // Save media
        content.querySelector('#saveMedia')?.addEventListener('click', () => {
            this.saveMedia(content);
        });

        // Export media
        content.querySelector('#exportMedia')?.addEventListener('click', () => {
            this.exportMedia(content);
        });

        // Auto-generate YouTube thumbnail
        content.querySelector('#mediaList')?.addEventListener('input', (e) => {
            if (e.target.classList.contains('media-url')) {
                const card = e.target.closest('.admin-card');
                if (card && card.dataset.type === 'video') {
                    const url = e.target.value;
                    const posterInput = card.querySelector('.media-poster');

                    // YouTube ID extraction with strict 11-char alphanumeric validation
                    const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?/]|$)/);

                    if (match && match[1] && posterInput && !posterInput.value) {
                        posterInput.value = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
                    }
                }
            }
        });
    },

    /**
     * Setup Drag and Drop
     */
    setupDragAndDrop(content) {
        const dropZone = content.querySelector('#mediaDropZone');
        const fileInput = content.querySelector('#mediaFileInput');

        if (!dropZone || !fileInput) return;

        // Handle file input change
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files, content);
        });

        // Drag events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            this.handleFiles(files, content);
        }, false);
    },

    /**
     * Handle uploaded files
     */
    handleFiles(files, content) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                // For a real app, we'd upload this. Here we'll use a local object URL or placeholder
                // Since we can't really upload, we'll assume the user puts it in assets/media
                // But for preview, we can use FileReader
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.media.images.unshift({
                        url: e.target.result, // This is a data URL, good for preview
                        caption: file.name,
                        category: 'Uploads'
                    });
                    this.renderCurrentTab(content.closest('.admin-dashboard'));
                };
                reader.readAsDataURL(file);
            }
        });
    },

    /**
     * Save media
     */
    saveMedia(content) {
        // Save Folder Icons
        const folderIcons = {};
        content.querySelectorAll('.folder-icon-input').forEach(input => {
            folderIcons[input.dataset.folder] = input.value.trim();
        });
        localStorage.setItem('folderIcons', JSON.stringify(folderIcons));

        const images = [];
        const videos = [];

        content.querySelectorAll('[data-type="image"]').forEach((card) => {
            const img = {
                url: Sanitize.url(card.querySelector('.media-url').value.trim()),
                caption: card.querySelector('.media-caption').value.trim(),
                category: card.querySelector('.media-category').value.trim(),
            };
            if (img.url) images.push(img);
        });

        content.querySelectorAll('[data-type="video"]').forEach((card) => {
            const video = {
                url: Sanitize.url(card.querySelector('.media-url').value.trim()),
                title: card.querySelector('.media-title').value.trim(),
                poster: Sanitize.url(card.querySelector('.media-poster').value.trim()),
            };
            if (video.url) videos.push(video);
        });

        this.media = { images, videos };
        localStorage.setItem('media.json', JSON.stringify(this.media, null, 2));
        invalidateData('media.json');
        alert('Media & Folder Icons saved! Open Media Vault to preview.');
    },

    /**
     * Export media to JSON file
     */
    exportMedia(content) {
        this.saveMedia(content);
        downloadJSON(this.media, 'media.json');
        alert('media.json downloaded! Replace data/media.json with this file.');
    },

    /**
     * Theme Tab HTML
     */
    getThemeHTML() {
        return `
            <div class="admin-section">
                <div class="admin-section-header">
                    <h3>Theme Customizer</h3>
                </div>
                <div class="admin-help">
                    Customize colors, wallpapers, and visual effects. Changes apply immediately for preview.
                </div>

                <div class="theme-grid">
                    <div class="theme-section">
                        <h4>Color Palette</h4>
                        <div class="color-picker-group">
                            <label>
                                <span>Neon Cyan</span>
                                <input type="color" id="colorCyan" value="#00f0ff">
                                <span class="color-value">#00f0ff</span>
                            </label>
                            <label>
                                <span>Neon Magenta</span>
                                <input type="color" id="colorMagenta" value="#ff00aa">
                                <span class="color-value">#ff00aa</span>
                            </label>
                            <label>
                                <span>Neon Green</span>
                                <input type="color" id="colorGreen" value="#00ff88">
                                <span class="color-value">#00ff88</span>
                            </label>
                            <label>
                                <span>Neon Purple</span>
                                <input type="color" id="colorPurple" value="#aa00ff">
                                <span class="color-value">#aa00ff</span>
                            </label>
                            <label>
                                <span>Neon Orange</span>
                                <input type="color" id="colorOrange" value="#ffaa00">
                                <span class="color-value">#ffaa00</span>
                            </label>
                        </div>
                        <button class="admin-btn primary" id="applyColors">Apply Colors</button>
                        <button class="admin-btn secondary" id="resetColors">Reset to Default</button>
                    </div>

                    <div class="theme-section">
                        <h4>Current Wallpaper</h4>
                        <div class="wallpaper-preview" style="background-image: var(--wallpaper-url); background-size: cover; background-position: center; height: 150px; border-radius: 8px; border: 1px solid rgba(0,240,255,0.3);"></div>
                        <div style="margin-top: 12px;">
                            <button class="admin-btn primary" id="nextWallpaper">Next Wallpaper</button>
                            <button class="admin-btn secondary" id="randomWallpaper">Random</button>
                        </div>
                    </div>
                </div>

                <div class="theme-section" style="margin-top: 20px;">
                    <h4>Visual Effects</h4>
                    <div class="effects-grid">
                        <label class="checkbox-label">
                            <input type="checkbox" id="fxEnabled" ${State.fxEnabled ? 'checked' : ''}>
                            <span>Particle Effects</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="auroraEnabled" ${State.auroraEnabled ? 'checked' : ''}>
                            <span>Aurora Fog</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="glyphsEnabled" ${State.glyphsEnabled ? 'checked' : ''}>
                            <span>Hologram Ring</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="soundEnabled" ${State.soundEnabled ? 'checked' : ''}>
                            <span>UI Sounds</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Initialize theme handlers
     */
    initThemeHandlers(content) {
        // Color pickers - show hex value
        content.querySelectorAll('input[type="color"]').forEach((input) => {
            input.addEventListener('input', (e) => {
                const valueSpan = e.target.nextElementSibling;
                if (valueSpan) valueSpan.textContent = e.target.value;
            });
        });

        // Apply colors
        content.querySelector('#applyColors')?.addEventListener('click', () => {
            const colors = {
                cyan: content.querySelector('#colorCyan').value,
                magenta: content.querySelector('#colorMagenta').value,
                green: content.querySelector('#colorGreen').value,
                purple: content.querySelector('#colorPurple').value,
                orange: content.querySelector('#colorOrange').value,
            };

            document.documentElement.style.setProperty('--neon-cyan', colors.cyan);
            document.documentElement.style.setProperty('--neon-magenta', colors.magenta);
            document.documentElement.style.setProperty('--neon-green', colors.green);
            document.documentElement.style.setProperty('--neon-purple', colors.purple);
            document.documentElement.style.setProperty('--neon-orange', colors.orange);

            localStorage.setItem('themeColors', JSON.stringify(colors));
            alert('Colors applied! They will persist across sessions.');
        });

        // Reset colors
        content.querySelector('#resetColors')?.addEventListener('click', () => {
            localStorage.removeItem('themeColors');
            location.reload();
        });

        // Wallpaper controls
        content.querySelector('#nextWallpaper')?.addEventListener('click', () => {
            Desktop.changeWallpaper();
        });

        content.querySelector('#randomWallpaper')?.addEventListener('click', () => {
            Desktop.randomWallpaper();
        });

        // Effects toggles
        content.querySelector('#fxEnabled')?.addEventListener('change', (e) => {
            State.setFxEnabled(e.target.checked);
        });

        content.querySelector('#auroraEnabled')?.addEventListener('change', (e) => {
            State.setAuroraEnabled(e.target.checked);
        });

        content.querySelector('#glyphsEnabled')?.addEventListener('change', (e) => {
            State.setGlyphsEnabled(e.target.checked);
        });

        content.querySelector('#soundEnabled')?.addEventListener('change', (e) => {
            State.setSoundEnabled(e.target.checked);
        });
    },

    /**
     * Data Import/Export Tab HTML
     */
    getDataHTML() {
        return `
            <div class="admin-section">
                <div class="admin-section-header">
                    <h3>Import / Export Data</h3>
                </div>
                <div class="admin-help">
                    Backup or restore all your content at once. Export creates a complete snapshot of desktop items, projects, and media.
                </div>

                <div class="data-section">
                    <h4>Export All Data</h4>
                    <p>Download a complete backup of all your content.</p>
                    <button class="admin-btn success" id="exportAll">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/></svg>
                        Export Complete Backup
                    </button>
                </div>

                <div class="data-section">
                    <h4>Import Data</h4>
                    <p>Restore from a previous backup. This will overwrite current data.</p>
                    <input type="file" id="importFile" accept=".json" style="display: none;">
                    <button class="admin-btn primary" id="importAll">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
                        Import Backup File
                    </button>
                </div>

                <div class="data-section">
                    <h4>Export Individual Files</h4>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="admin-btn secondary" id="exportDesktopOnly">Export Desktop Items</button>
                        <button class="admin-btn secondary" id="exportProjectsOnly">Export Projects</button>
                        <button class="admin-btn secondary" id="exportMediaOnly">Export Media</button>
                    </div>
                </div>

                <div class="data-section danger">
                    <h4>⚠️ Danger Zone</h4>
                    <p>Clear all data and reset to defaults.</p>
                    <button class="admin-btn danger" id="clearAll">Clear All Data</button>
                </div>
            </div>
        `;
    },

    /**
     * Initialize data import/export handlers
     */
    initDataHandlers(content) {
        // Export all data
        content.querySelector('#exportAll')?.addEventListener('click', () => {
            const backup = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                desktopItems: this.desktopItems,
                projects: this.projects,
                media: this.media,
                theme: {
                    colors: localStorage.getItem('themeColors'),
                    wallpaper: State.wallpaper,
                    effects: {
                        fx: State.fxEnabled,
                        aurora: State.auroraEnabled,
                        glyphs: State.glyphsEnabled,
                        sound: State.soundEnabled,
                    },
                },
            };

            downloadJSON(backup, `passion-os-backup-${new Date().toISOString().split('T')[0]}.json`);
            alert('Complete backup exported!');
        });

        // Import data
        const fileInput = content.querySelector('#importFile');
        content.querySelector('#importAll')?.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const backup = JSON.parse(event.target.result);

                    // Validate schema before writing to localStorage
                    const MAX_STRING = 2000;
                    const MAX_ITEMS = 200;
                    const isStr = (v) => typeof v === 'string' && v.length <= MAX_STRING;
                    const isArr = (v, max) => Array.isArray(v) && v.length <= (max || MAX_ITEMS);

                    if (backup.desktopItems) {
                        if (!isArr(backup.desktopItems, 50)) throw new Error('Invalid desktopItems: must be array (max 50)');
                        for (const item of backup.desktopItems) {
                            if (typeof item !== 'object' || !item) throw new Error('Invalid desktop item');
                            if (item.label && !isStr(item.label)) throw new Error('Desktop item label too long');
                            if (item.id && !isStr(item.id)) throw new Error('Desktop item id too long');
                        }
                        localStorage.setItem('desktopItems', JSON.stringify(backup.desktopItems));
                        this.desktopItems = backup.desktopItems;
                    }
                    if (backup.projects) {
                        if (!isArr(backup.projects, 100)) throw new Error('Invalid projects: must be array (max 100)');
                        for (const p of backup.projects) {
                            if (typeof p !== 'object' || !p) throw new Error('Invalid project');
                            if (p.title && !isStr(p.title)) throw new Error('Project title too long');
                            if (p.description && !isStr(p.description)) throw new Error('Project description too long');
                            if (p.tags && !isArr(p.tags, 20)) throw new Error('Too many project tags');
                            if (p.tech && !isArr(p.tech, 20)) throw new Error('Too many project techs');
                            // Sanitize URLs to block javascript:/data: injection via imported JSON
                            if (p.demo) p.demo = Sanitize.url(p.demo);
                            if (p.repo) p.repo = Sanitize.url(p.repo);
                        }
                        localStorage.setItem('projects.json', JSON.stringify(backup.projects));
                        invalidateData('projects.json');
                        this.projects = backup.projects;
                    }
                    if (backup.media) {
                        if (typeof backup.media !== 'object') throw new Error('Invalid media object');
                        if (backup.media.images && !isArr(backup.media.images, MAX_ITEMS)) throw new Error('Too many media images');
                        if (backup.media.videos && !isArr(backup.media.videos, MAX_ITEMS)) throw new Error('Too many media videos');
                        // Sanitize all media URLs to block stored XSS via crafted backup files
                        for (const img of (backup.media.images || [])) {
                            if (img.url) img.url = Sanitize.url(img.url);
                        }
                        for (const vid of (backup.media.videos || [])) {
                            if (vid.url) vid.url = Sanitize.url(vid.url);
                            if (vid.poster) vid.poster = Sanitize.url(vid.poster);
                        }
                        localStorage.setItem('media.json', JSON.stringify(backup.media));
                        invalidateData('media.json');
                        this.media = backup.media;
                    }
                    if (backup.theme?.colors && isStr(backup.theme.colors)) {
                        // Validate themeColors is a JSON object with hex color values only
                        // Prevents CSS injection via crafted backup payloads
                        try {
                            const parsed = JSON.parse(backup.theme.colors);
                            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                                const safe = {};
                                for (const [k, v] of Object.entries(parsed)) {
                                    safe[k] = Sanitize.hexColor(v);
                                }
                                localStorage.setItem('themeColors', JSON.stringify(safe));
                            }
                        } catch (_e) {
                            console.warn('[Admin] Skipped invalid themeColors in backup');
                        }
                    }

                    alert('Backup imported successfully! Refresh the page to see changes.');
                    this.renderCurrentTab(content.closest('.admin-dashboard'));
                } catch (error) {
                    alert('Error importing backup: ' + error.message);
                }
            };
            reader.readAsText(file);
        });

        // Export individual files
        content.querySelector('#exportDesktopOnly')?.addEventListener('click', () => {
            downloadJSON(this.desktopItems, 'desktop-items.json');
        });

        content.querySelector('#exportProjectsOnly')?.addEventListener('click', () => {
            downloadJSON(this.projects, 'projects.json');
        });

        content.querySelector('#exportMediaOnly')?.addEventListener('click', () => {
            downloadJSON(this.media, 'media.json');
        });

        // Clear all data
        content.querySelector('#clearAll')?.addEventListener('click', () => {
            if (
                confirm(
                    '⚠️ This will delete ALL data and reset to defaults. Are you absolutely sure?'
                )
            ) {
                if (confirm('This action cannot be undone. Proceed?')) {
                    localStorage.clear();
                    alert('All data cleared! Refreshing page...');
                    location.reload();
                }
            }
        });
    },

    /**
     * Fallback for about text
     */
    getAboutFallback() {
        return 'Hello! Edit this text in Admin Dashboard to personalize your About section.';
    },
};
