/**
 * Galaxy Background Effect
 * MMBN-style cyberspace grid + particle starfield using Three.js
 * Digital network aesthetic - cobalt blue data streams, platinum grid, blue-purple void
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

export class GalaxyBackground {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            starCount: options.starCount || 150,
            nebulaSpeed: options.nebulaSpeed || 0.0003,
            starDriftSpeed: options.starDriftSpeed || 0.0003,
            mouseInfluence: options.mouseInfluence || 0.02,
            ...options
        };

        this.mouse = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };
        this.time = 0;
        this.isRunning = false;
        this._lastRenderTime = 0;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.init();
    }

    init() {
        const rect = this.container.getBoundingClientRect();

        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        this.camera.position.z = 1;

        // Renderer — lower resolution for background effect (saves massive GPU)
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            powerPreference: 'low-power'
        });
        this.renderer.setSize(rect.width, rect.height);
        this.renderer.setPixelRatio(1); // Background doesn't need retina
        this.renderer.setClearColor(0x000000, 0);

        // Insert canvas as first child so it's behind content
        this.container.insertBefore(this.renderer.domElement, this.container.firstChild);
        this.renderer.domElement.style.cssText = `
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
            z-index: 0 !important;
            border-radius: inherit;
        `;

        // Create layers
        this.createNebula();
        this.createStarfield();

        // Events
        this.bindEvents();

        // Start animation
        this.start();
    }

    createNebula() {
        // Procedural nebula using fragment shader with simplex noise
        const nebulaGeometry = new THREE.PlaneGeometry(2, 2);

        const nebulaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uResolution: { value: new THREE.Vector2(
                    this.container.offsetWidth,
                    this.container.offsetHeight
                )}
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec2 uMouse;
                uniform vec2 uResolution;
                varying vec2 vUv;

                // Grid perspective mapping — maps 2D UV to a fake 3D floor
                vec2 cyberGrid(vec2 uv, float t) {
                    // Shift origin to bottom-center for ground-plane perspective
                    vec2 p = uv - vec2(0.5, 0.0);

                    // Perspective divide — y maps to depth
                    float depth = max(p.y, 0.01);
                    float perspX = p.x / (depth * 2.0);
                    float perspY = 1.0 / depth;

                    // Scroll the grid forward (data flowing toward viewer)
                    perspY -= t * 0.8;

                    return vec2(perspX, perspY);
                }

                void main() {
                    vec2 uv = vUv;

                    // Mouse parallax offset
                    vec2 mouseOffset = (uMouse - 0.5) * 0.02;
                    uv += mouseOffset;

                    float t = uTime * 0.3;

                    // === VOID BACKGROUND ===
                    // Deep blue-purple gradient (the "sky" of cyberspace)
                    vec3 voidTop = vec3(0.02, 0.01, 0.06);     // near black purple
                    vec3 voidMid = vec3(0.03, 0.02, 0.10);     // dark blue-purple
                    vec3 voidBot = vec3(0.01, 0.03, 0.08);     // deep blue

                    vec3 color = mix(voidTop, voidMid, smoothstep(0.8, 0.4, uv.y));
                    color = mix(color, voidBot, smoothstep(0.4, 0.0, uv.y));

                    // === PERSPECTIVE GRID (bottom 65% of screen) ===
                    if (uv.y < 0.65) {
                        vec2 grid = cyberGrid(uv, t);

                        // Grid line calculation
                        float gridSize = 3.0;
                        vec2 gridLines = abs(fract(grid * gridSize) - 0.5);
                        float lineX = smoothstep(0.0, 0.04, gridLines.x);
                        float lineY = smoothstep(0.0, 0.04, gridLines.y);
                        float gridLine = 1.0 - min(lineX, lineY);

                        // Distance fade (deeper = more faded)
                        float depth = max(uv.y, 0.01);
                        float depthFade = smoothstep(0.0, 0.5, depth);

                        // Platinum grey grid with subtle blue tint
                        vec3 gridColor = vec3(0.45, 0.48, 0.55);  // platinum grey
                        color += gridColor * gridLine * depthFade * 0.35;

                        // === MAJOR GRID LINES (every 4th line = brighter) ===
                        vec2 majorGrid = abs(fract(grid * gridSize * 0.25) - 0.5);
                        float majorX = smoothstep(0.0, 0.06, majorGrid.x);
                        float majorY = smoothstep(0.0, 0.06, majorGrid.y);
                        float majorLine = 1.0 - min(majorX, majorY);

                        vec3 majorColor = vec3(0.15, 0.25, 0.65);  // cobalt blue
                        color += majorColor * majorLine * depthFade * 0.5;

                        // === DATA STREAMS (flowing cobalt lines along Y-axis paths) ===
                        float streamX1 = smoothstep(0.0, 0.015, abs(fract(grid.x * gridSize) - 0.5));
                        float stream1 = (1.0 - streamX1) * depthFade;

                        // Animated pulse traveling along the stream
                        float pulse1 = sin(grid.y * 6.0 + t * 4.0) * 0.5 + 0.5;
                        pulse1 = pow(pulse1, 4.0);  // sharpen into distinct pulses

                        vec3 streamColor = vec3(0.12, 0.35, 0.85);  // cobalt blue
                        color += streamColor * stream1 * pulse1 * 0.6;

                        // Second stream layer (offset, dimmer)
                        float streamX2 = smoothstep(0.0, 0.01, abs(fract(grid.x * gridSize + 0.5) - 0.5));
                        float stream2 = (1.0 - streamX2) * depthFade;
                        float pulse2 = sin(grid.y * 8.0 + t * 3.0 + 1.5) * 0.5 + 0.5;
                        pulse2 = pow(pulse2, 5.0);

                        color += streamColor * stream2 * pulse2 * 0.3;

                        // === NODE GLOWS (bright spots at grid intersections) ===
                        vec2 nodePos = fract(grid * gridSize);
                        float nodeDist = length(nodePos - 0.5);
                        float nodeGlow = smoothstep(0.25, 0.0, nodeDist);

                        // Only show nodes at major intersections
                        vec2 majorNodePos = fract(grid * gridSize * 0.25);
                        float majorNodeDist = length(majorNodePos - 0.5);
                        float majorNodeGlow = smoothstep(0.3, 0.0, majorNodeDist);

                        // Pulse nodes
                        float nodePulse = sin(t * 2.0 + grid.x * 3.0 + grid.y * 2.0) * 0.3 + 0.7;

                        vec3 nodeColor = vec3(0.3, 0.55, 1.0);  // bright cobalt
                        color += nodeColor * nodeGlow * depthFade * 0.15 * nodePulse;
                        color += nodeColor * majorNodeGlow * depthFade * 0.4 * nodePulse;
                    }

                    // === HORIZON GLOW ===
                    // Bright line where grid meets void
                    float horizonDist = abs(uv.y - 0.65);
                    float horizonGlow = smoothstep(0.08, 0.0, horizonDist);
                    vec3 horizonColor = vec3(0.15, 0.3, 0.7);  // cobalt
                    color += horizonColor * horizonGlow * 0.4;

                    // === VIGNETTE ===
                    float vignette = 1.0 - length(uv - 0.5) * 0.7;
                    color *= max(vignette, 0.3);

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            transparent: false,
            depthWrite: false
        });

        this.nebulaMesh = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        this.nebulaMesh.position.z = -1;
        this.scene.add(this.nebulaMesh);
    }

    createStarfield() {
        const starCount = this.options.starCount;
        const positions = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        const twinklePhases = new Float32Array(starCount);
        const colors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            // Position across the plane
            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = Math.random() * 0.5; // Depth layers

            // Varying sizes
            sizes[i] = Math.random() * 2.0 + 0.5;

            // Random twinkle phase
            twinklePhases[i] = Math.random() * Math.PI * 2;

            // Star colors - mostly white/blue, occasional warm
            const colorChoice = Math.random();
            if (colorChoice < 0.5) {
                // White/pale blue (data points)
                colors[i * 3] = 0.8 + Math.random() * 0.2;
                colors[i * 3 + 1] = 0.85 + Math.random() * 0.15;
                colors[i * 3 + 2] = 1.0;
            } else if (colorChoice < 0.8) {
                // Cobalt blue
                colors[i * 3] = 0.15 + Math.random() * 0.15;
                colors[i * 3 + 1] = 0.35 + Math.random() * 0.2;
                colors[i * 3 + 2] = 0.85 + Math.random() * 0.15;
            } else {
                // Platinum/silver
                colors[i * 3] = 0.65 + Math.random() * 0.15;
                colors[i * 3 + 1] = 0.68 + Math.random() * 0.12;
                colors[i * 3 + 2] = 0.75 + Math.random() * 0.1;
            }
        }

        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        starGeometry.setAttribute('twinklePhase', new THREE.BufferAttribute(twinklePhases, 1));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPixelRatio: { value: this.renderer.getPixelRatio() }
            },
            vertexShader: `
                attribute float size;
                attribute float twinklePhase;
                attribute vec3 color;

                uniform float uTime;
                uniform float uPixelRatio;

                varying float vTwinkle;
                varying vec3 vColor;

                void main() {
                    vColor = color;

                    // Twinkle effect
                    vTwinkle = sin(uTime * 2.0 + twinklePhase) * 0.3 + 0.7;

                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * uPixelRatio * vTwinkle * (1.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying float vTwinkle;
                varying vec3 vColor;

                void main() {
                    // Circular star with soft glow
                    vec2 center = gl_PointCoord - 0.5;
                    float dist = length(center);

                    // Sharp core with soft glow
                    float core = 1.0 - smoothstep(0.0, 0.15, dist);
                    float glow = 1.0 - smoothstep(0.0, 0.5, dist);

                    float alpha = (core + glow * 0.3) * vTwinkle;

                    if (alpha < 0.01) discard;

                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);

        // Store initial positions for drift animation
        this.starPositions = positions.slice();
    }

    bindEvents() {
        // Cache container rect — refreshed on resize, not every mousemove
        this._cachedRect = this.container.getBoundingClientRect();

        // Mouse tracking (uses cached rect)
        this.onMouseMove = (e) => {
            const rect = this._cachedRect;
            this.targetMouse.x = (e.clientX - rect.left) / rect.width;
            this.targetMouse.y = 1 - (e.clientY - rect.top) / rect.height;
        };

        // Resize handling
        this.onResize = () => {
            this._cachedRect = this.container.getBoundingClientRect();
            const rect = this._cachedRect;
            this.renderer.setSize(rect.width, rect.height);

            if (this.nebulaMesh) {
                this.nebulaMesh.material.uniforms.uResolution.value.set(rect.width, rect.height);
            }
        };

        // Visibility change - pause when tab not visible
        this.onVisibilityChange = () => {
            if (document.hidden) {
                this.stop();
            } else {
                this.start();
            }
        };

        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('resize', this.onResize);
        document.addEventListener('visibilitychange', this.onVisibilityChange);
    }

    animate() {
        if (!this.isRunning) return;

        this.animationId = requestAnimationFrame(() => this.animate());

        // Reduced motion - static render
        if (this.prefersReducedMotion) {
            this.renderer.render(this.scene, this.camera);
            return;
        }

        // Throttle to ~24fps — background effect doesn't need 60fps
        const now = performance.now();
        if (now - this._lastRenderTime < 42) return;
        this._lastRenderTime = now;

        this.time += 0.042; // ~24fps timestep

        // Smooth mouse follow
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

        // Update nebula
        if (this.nebulaMesh) {
            this.nebulaMesh.material.uniforms.uTime.value = this.time * this.options.nebulaSpeed * 1000;
            this.nebulaMesh.material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
        }

        // Update stars
        if (this.stars) {
            this.stars.material.uniforms.uTime.value = this.time;

            // Drift stars diagonally
            const positions = this.stars.geometry.attributes.position.array;
            const drift = this.time * this.options.starDriftSpeed;

            for (let i = 0; i < positions.length; i += 3) {
                // Drift with wrap-around
                positions[i] = ((this.starPositions[i] + drift) % 2 + 2) % 2 - 1;
                positions[i + 1] = ((this.starPositions[i + 1] + drift * 0.7) % 2 + 2) % 2 - 1;

                // Subtle parallax based on depth
                const depth = this.starPositions[i + 2];
                positions[i] += (this.mouse.x - 0.5) * this.options.mouseInfluence * depth;
                positions[i + 1] += (this.mouse.y - 0.5) * this.options.mouseInfluence * depth;
            }
            this.stars.geometry.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    destroy() {
        this.stop();

        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('resize', this.onResize);
        document.removeEventListener('visibilitychange', this.onVisibilityChange);

        // Dispose Three.js resources
        if (this.nebulaMesh) {
            this.nebulaMesh.geometry.dispose();
            this.nebulaMesh.material.dispose();
        }
        if (this.stars) {
            this.stars.geometry.dispose();
            this.stars.material.dispose();
        }
        this.renderer.dispose();

        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
    }

    // Utility: Get canvas as texture for CSS masking
    getCanvasElement() {
        return this.renderer.domElement;
    }
}

// Export singleton for easy use
let galaxyInstance = null;

export function initGalaxyBackground(container, options) {
    if (galaxyInstance) {
        galaxyInstance.destroy();
    }
    galaxyInstance = new GalaxyBackground(container, options);
    return galaxyInstance;
}

export function destroyGalaxyBackground() {
    if (galaxyInstance) {
        galaxyInstance.destroy();
        galaxyInstance = null;
    }
}
