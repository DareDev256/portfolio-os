/**
 * Lightbox
 * Handles photo and video viewing with keyboard navigation
 */

import { WindowManager } from './windows.js';

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

    /**
     * Initialize events
     */
    scale: 1,
    panning: false,
    pointX: 0,
    pointY: 0,
    startX: 0,
    startY: 0,

    /**
     * Initialize events
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

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;

            switch (e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'ArrowLeft':
                    this.prev();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
                case '+':
                case '=':
                    this.zoom(0.1);
                    break;
                case '-':
                    this.zoom(-0.1);
                    break;
                case 'Tab':
                    this.handleTabFocus(e);
                    break;
            }
        });

        // Zoom & Pan Events
        this.mediaContainer.addEventListener('wheel', (e) => {
            if (this.type !== 'image') return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.zoom(delta);
        });

        this.mediaContainer.addEventListener('mousedown', (e) => {
            if (this.type !== 'image' || this.scale <= 1) return;
            e.preventDefault();
            this.panning = true;
            this.startX = e.clientX - this.pointX;
            this.startY = e.clientY - this.pointY;
            this.mediaContainer.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.panning) return;
            e.preventDefault();
            this.pointX = e.clientX - this.startX;
            this.pointY = e.clientY - this.startY;
            this.updateTransform();
        });

        document.addEventListener('mouseup', () => {
            this.panning = false;
            this.mediaContainer.style.cursor = '';
        });
    },

    /**
     * Handle Tab key for focus trapping
     */
    handleTabFocus(e) {
        const focusableElements = this.container.querySelectorAll(
            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
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

        // Focus close button
        setTimeout(() => {
            if (this.closeBtn) this.closeBtn.focus();
        }, 100);
    },

    /**
     * Open video in a draggable window
     */
    openVideoWindow(item) {
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
            const video = document.createElement('video');
            video.src = item.url;
            video.controls = true;
            video.autoplay = true;
            video.style.width = '100%';
            video.style.maxHeight = '100%';
            content.appendChild(video);
        }

        WindowManager.create({
            id: `video-${Date.now()}`,
            title: item.title || 'Media Player',
            icon: '▶',
            content,
            width: 800,
            height: 500,
            x: 100,
            y: 100
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

        // Create image element
        const img = document.createElement('img');
        img.src = item.url || item.src || item;
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

        // Restore focus
        if (this.focusedElementBeforeOpen) {
            this.focusedElementBeforeOpen.focus();
        }
    },

    /**
     * Detect video type from URL
     */
    detectVideoType(url) {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let id = '';
            if (url.includes('youtube.com/watch?v=')) {
                id = url.split('v=')[1].split('&')[0];
            } else if (url.includes('youtu.be/')) {
                id = url.split('youtu.be/')[1].split('?')[0];
            }
            return { type: 'youtube', id };
        } else if (url.includes('vimeo.com')) {
            const id = url.split('vimeo.com/')[1];
            return { type: 'vimeo', id };
        }
        return { type: 'video', id: null };
    },

    /**
     * Create YouTube Embed
     */
    createYouTubeEmbed(id) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        return iframe;
    },

    /**
     * Create Vimeo Embed
     */
    createVimeoEmbed(id) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://player.vimeo.com/video/${id}?autoplay=1`;
        iframe.frameBorder = '0';
        iframe.allow = 'autoplay; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        return iframe;
    }
};
