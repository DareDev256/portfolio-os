/**
 * Cursor Tracker
 * Tracks cursor position, velocity, direction, proximity, and idle state
 * Provides data to cursor-reactive and cursor-trail modules
 */

export const CursorTracker = {
    // Cursor state
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,

    // Velocity (pixels per frame)
    velocity: 0,
    velocityX: 0,
    velocityY: 0,

    // Direction (radians, 0 = right, π/2 = down)
    direction: 0,

    // Idle detection
    isIdle: false,
    idleTimer: 0,
    idleThreshold: 2000, // 2 seconds

    // Timestamps
    timestamp: 0,
    lastMoveTime: 0,

    // Throttling
    updateThrottle: 2, // Update velocity every 2 frames
    frameCounter: 0,

    // Event listeners
    boundHandlers: {},

    /**
     * Initialize cursor tracking
     */
    init() {
        // Bind event handlers
        this.boundHandlers.handleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandlers.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.boundHandlers.handleMouseLeave = this.handleMouseLeave.bind(this);

        // Add event listeners
        document.addEventListener('mousemove', this.boundHandlers.handleMouseMove, { passive: true });
        document.addEventListener('mouseenter', this.boundHandlers.handleMouseEnter, { passive: true });
        document.addEventListener('mouseleave', this.boundHandlers.handleMouseLeave, { passive: true });

        console.log('[CursorTracker] Initialized');
    },

    /**
     * Handle mouse move
     */
    handleMouseMove(e) {
        // Store previous position
        this.prevX = this.x;
        this.prevY = this.y;

        // Update current position
        this.x = e.clientX;
        this.y = e.clientY;

        // Reset idle state
        this.isIdle = false;
        this.idleTimer = 0;
        this.lastMoveTime = performance.now();
    },

    /**
     * Handle mouse enter
     */
    handleMouseEnter(e) {
        this.x = e.clientX;
        this.y = e.clientY;
        this.prevX = this.x;
        this.prevY = this.y;
    },

    /**
     * Handle mouse leave
     */
    handleMouseLeave() {
        // Don't reset position, just mark as idle
        this.isIdle = true;
    },

    /**
     * Update cursor data (called from engine loop)
     */
    update(timestamp, deltaTime) {
        this.timestamp = timestamp;
        this.frameCounter++;

        // Throttle velocity calculations (every 2 frames)
        if (this.frameCounter % this.updateThrottle === 0) {
            this.calculateVelocity(deltaTime);
            this.calculateDirection();
        }

        // Check for idle state
        if (!this.isIdle && timestamp - this.lastMoveTime > this.idleThreshold) {
            this.isIdle = true;
            this.velocity = 0;
            this.velocityX = 0;
            this.velocityY = 0;
        }
    },

    /**
     * Calculate velocity based on position change
     */
    calculateVelocity(_deltaTime) {
        // Calculate displacement
        const dx = this.x - this.prevX;
        const dy = this.y - this.prevY;

        // Calculate velocity (px/ms, normalized to per-frame)
        this.velocityX = dx;
        this.velocityY = dy;

        // Calculate magnitude (speed)
        this.velocity = Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Calculate direction of movement
     */
    calculateDirection() {
        if (this.velocity < 0.1) {
            // Don't update direction if barely moving
            return;
        }

        // Calculate angle in radians
        // atan2(y, x) returns angle from -π to π
        this.direction = Math.atan2(this.velocityY, this.velocityX);
    },

    /**
     * Calculate distance from cursor to a point
     * @param {number} targetX - X coordinate
     * @param {number} targetY - Y coordinate
     * @returns {number} Distance in pixels
     */
    getDistanceTo(targetX, targetY) {
        const dx = this.x - targetX;
        const dy = this.y - targetY;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Calculate distance from cursor to an element's center
     * @param {HTMLElement} element - The element
     * @returns {number} Distance in pixels
     */
    getDistanceToElement(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return this.getDistanceTo(centerX, centerY);
    },

    /**
     * Check if cursor is over an element
     * @param {HTMLElement} element - The element to check
     * @returns {boolean} True if cursor is over element
     */
    isOverElement(element) {
        const rect = element.getBoundingClientRect();
        return (
            this.x >= rect.left &&
            this.x <= rect.right &&
            this.y >= rect.top &&
            this.y <= rect.bottom
        );
    },

    /**
     * Get proximity factor (0-1) to an element
     * 1 = at center, 0 = at max distance
     * @param {HTMLElement} element - The element
     * @param {number} maxDistance - Maximum distance to consider (default: 100px)
     * @returns {number} Proximity factor (0-1)
     */
    getProximityToElement(element, maxDistance = 100) {
        const distance = this.getDistanceToElement(element);
        if (distance >= maxDistance) return 0;
        return 1 - (distance / maxDistance);
    },

    /**
     * Get cursor position relative to element center
     * @param {HTMLElement} element - The element
     * @returns {Object} {x, y} relative position (-1 to 1)
     */
    getRelativePosition(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Normalize to -1 to 1 based on element size
        const relX = (this.x - centerX) / (rect.width / 2);
        const relY = (this.y - centerY) / (rect.height / 2);

        return {
            x: Math.max(-1, Math.min(1, relX)),
            y: Math.max(-1, Math.min(1, relY))
        };
    },

    /**
     * Get all cursor data
     * @returns {Object} Complete cursor state
     */
    getData() {
        return {
            x: this.x,
            y: this.y,
            prevX: this.prevX,
            prevY: this.prevY,
            velocity: this.velocity,
            velocityX: this.velocityX,
            velocityY: this.velocityY,
            direction: this.direction,
            isIdle: this.isIdle,
            timestamp: this.timestamp,
        };
    },

    /**
     * Cleanup
     */
    destroy() {
        // Remove event listeners
        document.removeEventListener('mousemove', this.boundHandlers.handleMouseMove);
        document.removeEventListener('mouseenter', this.boundHandlers.handleMouseEnter);
        document.removeEventListener('mouseleave', this.boundHandlers.handleMouseLeave);

        console.log('[CursorTracker] Destroyed');
    },
};
