/**
 * Lightbox
 * Handles photo and video viewing with keyboard navigation
 */

import { WindowManager } from './windows.js';
import { trapFocus } from './focus-trap.js';
import { Sanitize } from './sanitize.js';

export const Lightbox = {
    container: null,
    mediaContainer: null,
    captionEl: null,
    closeBtn: null,
    prevBtn: null,
    nextBtn: null,

    items: [],
    currentIndex: 0,
    type: 'image', // 'image' or 'video'
    isOpen: false,
    focusedElementBeforeOpen: null,
    releaseFocusTrap: null,

    /**
     * Initialize lightbox
     */
    init() {
        this.container = document.getElementById('lightbox');
        this.mediaContainer = this.container.querySelector('.lightbox-media');
        this.captionEl = this.container.querySelector('.lightbox-caption');
        this.closeBtn = this.container.querySelector('.lightbox-close');
        this.prevBtn = this.container.querySelector('.lightbox-prev');
        this.nextBtn = this.container.querySelector('.lightbox-next');

        this.initEvents();
    },

    // Zoom & pan state
    scale: 1,
    panning: false,
    pointX: 0,
    pointY: 0,
    startX: 0,
    startY: 0,

    // Bound handlers — created once, reused for add/removeEventListener
    _boundKeydown: null,
    _boundMousemove: null,
    _boundMouseup: null,

    /**
     * Initialize events
     * Static listeners live on the lightbox DOM itself.
     * Document-level listeners (keyboard, pan tracking) are attached
     * only while the lightbox is open — see _attachDocListeners / _detachDocListeners.
     */
    initEvents() {
        // Close button
        this.closeBtn.addEventListener('click', () => this.close());

        // Navigation buttons
        this.prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.prev(); });
        this.nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.next(); });

        // Overlay click to close
        this.container
            .querySelector('.lightbox-overlay')
            .addEventListener('click', () => this.close());

        // Zoom via wheel (scoped to media container — no document leak)
        this.mediaContainer.addEventListener('wheel', (e) => {
            if (this.type !== 'image') return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.zoom(delta);
        });

        // Pan start (scoped to media container)
        this.mediaContainer.addEventListener('mousedown', (e) => {
            if (this.type !== 'image' || this.scale <= 1) return;
            e.preventDefault();
            this.panning = true;
            this.startX = e.clientX - this.pointX;
            this.startY = e.clientY - this.pointY;
            this.mediaContainer.style.cursor = 'grabbing';
        });

        // Create stable bound references for document-level handlers
        this._boundKeydown = this._handleKeydown.bind(this);
        this._boundMousemove = this._handleMousemove.bind(this);
        this._boundMouseup = this._handleMouseup.bind(this);
    },

    /** Keyboard handler — only active while lightbox is open */
    _handleKeydown(e) {
        switch (e.key) {
            case 'Escape':    this.close();    break;
            case 'ArrowLeft': this.prev();     break;
            case 'ArrowRight': this.next();    break;
            case '+': case '=': this.zoom(0.1);  break;
            case '-':           this.zoom(-0.1); break;
        }
    },

    /** Pan tracking — only active while lightbox is open */
    _handleMousemove(e) {
        if (!this.panning) return;
        e.preventDefault();
        this.pointX = e.clientX - this.startX;
        this.pointY = e.clientY - this.startY;
        this.updateTransform();
    },

    /** Pan end — only active while lightbox is open */
    _handleMouseup() {
        this.panning = false;
        this.mediaContainer.style.cursor = '';
    },

    /** Attach document-level listeners when lightbox opens */
    _attachDocListeners() {
        document.addEventListener('keydown', this._boundKeydown);
        document.addEventListener('mousemove', this._boundMousemove);
        document.addEventListener('mouseup', this._boundMouseup);
    },

    /** Detach document-level listeners when lightbox closes */
    _detachDocListeners() {
        document.removeEventListener('keydown', this._boundKeydown);
        document.removeEventListener('mousemove', this._boundMousemove);
        document.removeEventListener('mouseup', this._boundMouseup);
    },

    /**
     * Zoom function
     */
    zoom(delta) {
        this.scale += delta;
        this.scale = Math.min(Math.max(1, this.scale), 4); // Clamp between 1x and 4x
        if (this.scale === 1) {
            this.pointX = 0;
            this.pointY = 0;
        }
        this.updateTransform();
    },

    /**
     * Update CSS transform
     */
    updateTransform() {
        const img = this.mediaContainer.querySelector('img');
        if (img) {
            img.style.transform = `translate(${this.pointX}px, ${this.pointY}px) scale(${this.scale})`;
        }
    },

    /**
     * Open lightbox
     * @param {Array} items - Array of media items
     * @param {number} index - Starting index
     * @param {string} type - 'image' or 'video'
     */
    open(items, index = 0, type = 'image') {
        this.items = items;
        this.currentIndex = index;
        this.type = type;
        this.scale = 1;
        this.pointX = 0;
        this.pointY = 0;

        // If video, open in a draggable window instead of overlay
        if (type === 'video') {
            this.openVideoWindow(items[index]);
            return;
        }

        this.isOpen = true;

        // Store currently focused element
        this.focusedElementBeforeOpen = document.activeElement;

        this.container.classList.remove('hidden');
        this.render();

        // Attach document-level keyboard & pan listeners
        this._attachDocListeners();

        // Trap focus within the lightbox overlay
        this.releaseFocusTrap = trapFocus(this.container);
    },

    /**
     * Open video in a draggable window
     */
    openVideoWindow(item) {
        // Early gate: reject items with no URL or non-string URLs before any processing
        if (!item?.url || typeof item.url !== 'string') return;
        const videoInfo = this.detectVideoType(item.url);
        let content = document.createElement('div');
        content.style.background = '#000';
        content.style.height = '100%';
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.style.justifyContent = 'center';

        if (videoInfo.type === 'youtube') {
            const iframe = this.createYouTubeEmbed(videoInfo.id);
            iframe.style.height = '100%';
            content.appendChild(iframe);
        } else if (videoInfo.type === 'vimeo') {
            const iframe = this.createVimeoEmbed(videoInfo.id);
            iframe.style.height = '100%';
            content.appendChild(iframe);
        } else {
            // Validate URL before setting as video source — media items originate
            // from admin-editable localStorage JSON (imported backups, manual edits).
            // Without validation, a poisoned URL (javascript:, data:text/html, blob:)
            // could execute arbitrary code when the browser processes the src attribute.
            const safeUrl = Sanitize.url(item.url);
            if (!safeUrl) {
                const blocked = document.createElement('div');
                blocked.textContent = 'Blocked: invalid video URL';
                blocked.style.cssText = 'color:#ff4444;display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-family:var(--font-mono,monospace);font-size:0.85rem;';
                content.appendChild(blocked);
            } else {
                const video = document.createElement('video');
                video.src = safeUrl;
                video.controls = true;
                video.autoplay = true;
                video.style.width = '100%';
                video.style.maxHeight = '100%';
                content.appendChild(video);
            }
        }

        // Pause heavy GPU effects while video plays to prevent freezing
        const galaxy = window.__galaxyInstance;
        const engine = window.__InteractionEngine;
        if (galaxy) galaxy.stop();
        if (engine) engine.setEnabled(false);

        WindowManager.create({
            id: `video-${Date.now()}`,
            title: item.title || 'Media Player',
            icon: '▶',
            content,
            width: 800,
            height: 500,
            x: 100,
            y: 100,
            onClose() {
                if (galaxy) galaxy.start();
                if (engine) engine.setEnabled(true);
            },
        });
    },

    /**
     * Render current media item
     */
    render() {
        if (this.items.length === 0) return;

        const item = this.items[this.currentIndex];
        this.mediaContainer.innerHTML = '';

        // Reset transform
        this.scale = 1;
        this.pointX = 0;
        this.pointY = 0;

        // Create image element — validate source URL to block javascript:/data: schemes
        // Media items originate from localStorage-backed JSON (admin-editable)
        const img = document.createElement('img');
        const rawSrc = item.url || item.src || (typeof item === 'string' ? item : '');
        img.src = Sanitize.url(rawSrc) || '/assets/wallpapers/default.jpg';
        img.alt = item.title || item.alt || 'Lightbox image';
        img.style.maxWidth = '90vw';
        img.style.maxHeight = '90vh';
        img.style.objectFit = 'contain';
        img.style.transformOrigin = 'center center';

        this.mediaContainer.appendChild(img);

        // Update caption
        if (item.title || item.caption) {
            this.captionEl.textContent = item.title || item.caption;
            this.captionEl.style.display = 'block';
        } else {
            this.captionEl.style.display = 'none';
        }

        // Update navigation button visibility
        this.updateNavigationButtons();
    },

    /**
     * Navigate to previous item
     */
    prev() {
        if (this.items.length <= 1) return;

        this.currentIndex--;
        if (this.currentIndex < 0) {
            this.currentIndex = this.items.length - 1; // Wrap to end
        }
        this.render();
    },

    /**
     * Navigate to next item
     */
    next() {
        if (this.items.length <= 1) return;

        this.currentIndex++;
        if (this.currentIndex >= this.items.length) {
            this.currentIndex = 0; // Wrap to beginning
        }
        this.render();
    },

    /**
     * Update navigation button visibility
     */
    updateNavigationButtons() {
        if (this.items.length <= 1) {
            this.prevBtn.style.display = 'none';
            this.nextBtn.style.display = 'none';
        } else {
            this.prevBtn.style.display = 'block';
            this.nextBtn.style.display = 'block';
        }
    },

    /**
     * Close lightbox
     */
    close() {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.container.classList.add('hidden');
        this.mediaContainer.innerHTML = '';

        // Reset zoom/pan state to prevent stale transform on next open
        this.scale = 1;
        this.pointX = 0;
        this.pointY = 0;
        this.panning = false;
        this.mediaContainer.style.cursor = '';

        // Detach document-level listeners to prevent leaks
        this._detachDocListeners();

        // Release focus trap and restore focus
        if (this.releaseFocusTrap) {
            this.releaseFocusTrap();
            this.releaseFocusTrap = null;
        }
        if (this.focusedElementBeforeOpen) {
            this.focusedElementBeforeOpen.focus();
        }
    },

    // YouTube IDs: exactly 11 alphanumeric, hyphen, or underscore characters
    YOUTUBE_ID_RE: /^[a-zA-Z0-9_-]{11}$/,
    // Vimeo IDs: 6–11 digit numeric strings
    VIMEO_ID_RE: /^[0-9]{6,11}$/,

    /**
     * Detect video type from URL and validate the extracted ID
     * Returns { type, id } — id is null if validation fails
     */
    detectVideoType(url) {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let id = '';
            if (url.includes('youtube.com/watch?v=')) {
                id = url.split('v=')[1].split('&')[0];
            } else if (url.includes('youtu.be/')) {
                id = url.split('youtu.be/')[1].split('?')[0];
            }
            if (!this.YOUTUBE_ID_RE.test(id)) {
                console.warn('[Lightbox] Blocked invalid YouTube ID:', id);
                return { type: 'youtube', id: null };
            }
            return { type: 'youtube', id };
        } else if (url.includes('vimeo.com')) {
            const id = url.split('vimeo.com/')[1]?.split('?')[0]?.split('/')[0] || '';
            if (!this.VIMEO_ID_RE.test(id)) {
                console.warn('[Lightbox] Blocked invalid Vimeo ID:', id);
                return { type: 'vimeo', id: null };
            }
            return { type: 'vimeo', id };
        }
        return { type: 'video', id: null };
    },

    /**
     * Create YouTube Embed (sandboxed, validated ID required)
     */
    createYouTubeEmbed(id) {
        if (!id) return this._blockedEmbedPlaceholder('YouTube');
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        return iframe;
    },

    /**
     * Create Vimeo Embed (sandboxed, validated ID required)
     */
    createVimeoEmbed(id) {
        if (!id) return this._blockedEmbedPlaceholder('Vimeo');
        const iframe = document.createElement('iframe');
        iframe.src = `https://player.vimeo.com/video/${id}?autoplay=1`;
        iframe.frameBorder = '0';
        iframe.allow = 'autoplay; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        return iframe;
    },

    /**
     * Placeholder shown when a video ID fails validation
     */
    _blockedEmbedPlaceholder(provider) {
        const el = document.createElement('div');
        el.textContent = `Invalid ${provider} video URL`;
        el.style.cssText = 'color:#ff4444;display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-family:monospace;';
        return el;
    }
};
