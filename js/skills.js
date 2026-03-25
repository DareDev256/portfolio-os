/**
 * SKILLS UNIVERSE ENGINE
 * A custom physics-based force-directed graph renderer on HTML5 Canvas.
 * No external libraries. Pure performance.
 */

import { isPageHidden } from './dom-helpers.js';

export const SkillsUniverse = {
    canvas: null,
    ctx: null,
    nodes: [],
    springs: [],
    animationFrame: null,
    width: 0,
    height: 0,
    draggedNode: null,
    hoveredNode: null,
    mouse: { x: 0, y: 0 },
    isRunning: false,

    // Configuration
    config: {
        friction: 0.90,
        springStiffness: 0.04,
        springLength: 150,
        repulsion: 1500,
        nodeRadius: 25,
        colors: {
            frontend: '#00f0ff', // Cyan
            backend: '#aa00ff',  // Purple
            db: '#ff00aa',       // Pink
            tool: '#00ff88',     // Green
            core: '#ffffff'      // White centre
        }
    },

    // Raw Data
    skillData: [
        // CORE
        { id: 'core', label: 'FULL STACK', type: 'core', x: 0, y: 0, r: 40 },

        // FRONTEND
        { id: 'react', label: 'React', type: 'frontend' },
        { id: 'ts', label: 'TypeScript', type: 'frontend' },
        { id: 'three', label: 'Three.js', type: 'frontend' },
        { id: 'html', label: 'HTML5', type: 'frontend' },
        { id: 'css', label: 'CSS3', type: 'frontend' },
        { id: 'vite', label: 'Vite', type: 'frontend' },

        // BACKEND
        { id: 'node', label: 'Node.js', type: 'backend' },
        { id: 'python', label: 'Python', type: 'backend' },
        { id: 'api', label: 'REST API', type: 'backend' },
        { id: 'auth', label: 'Auth', type: 'backend' },

        // DATABASE
        { id: 'postgres', label: 'PostgreSQL', type: 'db' },
        { id: 'mongo', label: 'MongoDB', type: 'db' },
        { id: 'redis', label: 'Redis', type: 'db' },

        // AI / AGENTS
        { id: 'claude', label: 'Claude Code', type: 'backend' },
        { id: 'mcp', label: 'MCP Protocol', type: 'backend' },

        // TOOLS
        { id: 'git', label: 'Git', type: 'tool' },
        { id: 'docker', label: 'Docker', type: 'tool' },
        { id: 'aws', label: 'AWS', type: 'tool' },
        { id: 'linux', label: 'Linux', type: 'tool' },
        { id: 'playwright', label: 'Playwright', type: 'tool' }
    ],

    connections: [
        // Connect Core to Main Categories
        ['core', 'react'], ['core', 'node'], ['core', 'postgres'], ['core', 'git'],

        // Frontend Cluster
        ['react', 'ts'], ['react', 'three'], ['react', 'vite'],
        ['html', 'css'], ['css', 'three'],

        // Backend Cluster
        ['node', 'api'], ['node', 'auth'], ['node', 'mongo'],
        ['python', 'api'],

        // Database Cluster
        ['postgres', 'node'], ['redis', 'node'],

        // AI / Agents Cluster
        ['claude', 'node'], ['claude', 'python'], ['claude', 'mcp'],
        ['mcp', 'api'],

        // Tools Integration
        ['git', 'linux'], ['docker', 'aws'], ['docker', 'node'],
        ['aws', 'node'], ['playwright', 'node'], ['playwright', 'docker']
    ],

    /**
     * initialize the universe inside a DOM container
     */
    init(container) {
        // Cleanup old instance if needed
        if (this.canvas) this.stop();

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'skills-canvas';
        this.ctx = this.canvas.getContext('2d');
        container.appendChild(this.canvas);

        // Set dimensions
        this.resize(container.clientWidth, container.clientHeight);

        // Initialize Physics World
        this.buildGraph();

        // Event Listeners — store bound refs so stop() can remove them all
        this._onMouseDown = (e) => this.inputStart(e);
        this._onMouseMove = (e) => this.inputMove(e);
        this._onMouseUp = () => this.inputEnd();
        this._onResize = () => {
            if (this.canvas && this.canvas.parentElement) {
                this.resize(this.canvas.parentElement.clientWidth, this.canvas.parentElement.clientHeight);
            }
        };
        this.canvas.addEventListener('mousedown', this._onMouseDown);
        this.canvas.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);
        window.addEventListener('resize', this._onResize);

        // Start Loop
        this.isRunning = true;
        this.loop();

        // Initial Layout Burst
        this.burst();
    },

    stop() {
        this.isRunning = false;
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        if (this.canvas) {
            this.canvas.removeEventListener('mousedown', this._onMouseDown);
            this.canvas.removeEventListener('mousemove', this._onMouseMove);
        }
        if (this._onMouseUp) window.removeEventListener('mouseup', this._onMouseUp);
        if (this._onResize) window.removeEventListener('resize', this._onResize);
        if (this.canvas) this.canvas.remove();
        this._onMouseDown = null;
        this._onMouseMove = null;
        this._onMouseUp = null;
        this._onResize = null;
    },

    resize(w, h) {
        this.width = w;
        this.height = h;
        // Handle high DPI
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.scale(dpr, dpr);
    },

    buildGraph() {
        // Create Nodes
        this.nodes = this.skillData.map(d => ({
            ...d,
            x: this.width / 2 + (Math.random() - 0.5) * 50,
            y: this.height / 2 + (Math.random() - 0.5) * 50,
            vx: 0,
            vy: 0,
            mass: d.type === 'core' ? 5 : 1,
            radius: d.r || this.config.nodeRadius,
            color: this.config.colors[d.type]
        }));

        // Create Springs
        this.springs = [];
        this.connections.forEach(([idA, idB]) => {
            const nodeA = this.nodes.find(n => n.id === idA);
            const nodeB = this.nodes.find(n => n.id === idB);
            if (nodeA && nodeB) {
                this.springs.push({ a: nodeA, b: nodeB });
            }
        });
    },

    burst() {
        // Initial explosion to spread nodes
        this.nodes.forEach(node => {
            if (node.id === 'core') return;
            const angle = Math.random() * Math.PI * 2;
            const force = 15;
            node.vx = Math.cos(angle) * force;
            node.vy = Math.sin(angle) * force;
        });
    },

    loop() {
        if (!this.isRunning) return;
        if (isPageHidden()) { this.animationFrame = requestAnimationFrame(() => this.loop()); return; }  // skip frame when hidden

        // Auto-stop if canvas is removed from DOM
        if (this.canvas && !this.canvas.isConnected) {
            this.stop();
            return;
        }

        this.update();
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        // Physics Steps
        const nodes = this.nodes;
        const cfg = this.config;

        // 1. Repulsion (Nodes push apart)
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist === 0) dist = 0.1; // Prevent div by zero

                const force = cfg.repulsion / (dist * dist);
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                if (a.id !== 'core' && a !== this.draggedNode) {
                    a.vx -= fx;
                    a.vy -= fy;
                }
                if (b.id !== 'core' && b !== this.draggedNode) {
                    b.vx += fx;
                    b.vy += fy;
                }
            }
        }

        // 2. Springs (Connections pull together)
        this.springs.forEach(spring => {
            const a = spring.a;
            const b = spring.b;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) dist = 0.1; // Prevent NaN from division by zero

            const stretch = dist - cfg.springLength;
            const force = stretch * cfg.springStiffness;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (a.id !== 'core' && a !== this.draggedNode) {
                a.vx += fx;
                a.vy += fy;
            }
            if (b.id !== 'core' && b !== this.draggedNode) {
                b.vx -= fx;
                b.vy -= fy;
            }
        });

        // 3. Center Gravity (Keep in view)
        const cx = this.width / 2;
        const cy = this.height / 2;
        nodes.forEach(node => {
            if (node.id === 'core') {
                // Core stays center with slight drift
                node.x += (cx - node.x) * 0.05;
                node.y += (cy - node.y) * 0.05;
                return;
            }
            if (node === this.draggedNode) return;

            // Pull to center
            node.vx += (cx - node.x) * 0.0005;
            node.vy += (cy - node.y) * 0.0005;

            // Apply Velocity & Friction
            node.x += node.vx;
            node.y += node.vy;
            node.vx *= cfg.friction;
            node.vy *= cfg.friction;

            // Wall Bounce (optional, currently soft bounds via gravity)
        });
    },

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Draw Connections
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        this.springs.forEach(spring => {
            ctx.moveTo(spring.a.x, spring.a.y);
            ctx.lineTo(spring.b.x, spring.b.y);
        });
        ctx.stroke();

        // Draw Nodes
        this.nodes.forEach(node => {
            // Draw Glow
            const isHover = (node === this.hoveredNode || node === this.draggedNode);
            if (isHover) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = node.color;
            } else {
                ctx.shadowBlur = 0;
            }

            // Node Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(10, 10, 15, 0.9)'; // Dark center
            ctx.fill();

            ctx.lineWidth = isHover ? 3 : 2;
            ctx.strokeStyle = node.color;
            ctx.stroke();

            // Text Label
            ctx.shadowBlur = 0;
            ctx.fillStyle = node.color;
            ctx.font = isHover ? 'bold 12px "Courier New"' : '11px "Courier New"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.label, node.x, node.y);
        });
    },

    // --- Inputs ---

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left),
            y: (e.clientY - rect.top)
        };
    },

    inputStart(e) {
        const pos = this.getMousePos(e);
        // Find clicked node
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const n = this.nodes[i];
            const dx = pos.x - n.x;
            const dy = pos.y - n.y;
            if (dx * dx + dy * dy < n.radius * n.radius) {
                this.draggedNode = n;
                // n.vx = 0; n.vy = 0;
                return;
            }
        }
    },

    inputMove(e) {
        const pos = this.getMousePos(e);
        this.mouse = pos;

        // Handle Drag
        if (this.draggedNode) {
            this.draggedNode.x = pos.x;
            this.draggedNode.y = pos.y;
            this.draggedNode.vx = 0;
            this.draggedNode.vy = 0;
        }

        // Handle Hover
        this.hoveredNode = null;
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const n = this.nodes[i];
            const dx = pos.x - n.x;
            const dy = pos.y - n.y;
            if (dx * dx + dy * dy < n.radius * n.radius) {
                this.hoveredNode = n;
                this.canvas.style.cursor = 'pointer';
                return;
            }
        }
        this.canvas.style.cursor = 'default';
    },

    inputEnd() {
        this.draggedNode = null;
    }
};
