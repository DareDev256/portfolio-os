/**
 * Galaxy Background Effect
 * Procedural nebula + particle starfield using Three.js
 * JJK/Dark Shonen aesthetic - deep purples, magentas, cursed energy vibes
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

export class GalaxyBackground {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            starCount: options.starCount || 300,
            nebulaSpeed: options.nebulaSpeed || 0.0003,
            starDriftSpeed: options.starDriftSpeed || 0.00015,
            mouseInfluence: options.mouseInfluence || 0.02,
            ...options
        };

        this.mouse = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };
        this.time = 0;
        this.isRunning = false;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.init();
    }

    init() {
        const rect = this.container.getBoundingClientRect();

        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        this.camera.position.z = 1;

        // Renderer with transparency
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(rect.width, rect.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

                // Simplex noise functions
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

                    vec3 i  = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);

                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g.xyz, l.zxy);
                    vec3 i2 = max(g.xyz, l.zxy);

                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;

                    i = mod289(i);
                    vec4 p = permute(permute(permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

                    float n_ = 0.142857142857;
                    vec3 ns = n_ * D.wyz - D.xzx;

                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);

                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);

                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);

                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));

                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

                    vec3 p0 = vec3(a0.xy, h.x);
                    vec3 p1 = vec3(a0.zw, h.y);
                    vec3 p2 = vec3(a1.xy, h.z);
                    vec3 p3 = vec3(a1.zw, h.w);

                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;

                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                }

                // Fractal Brownian Motion for layered noise
                float fbm(vec3 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    float frequency = 1.0;

                    for (int i = 0; i < 5; i++) {
                        value += amplitude * snoise(p * frequency);
                        amplitude *= 0.5;
                        frequency *= 2.0;
                    }
                    return value;
                }

                void main() {
                    vec2 uv = vUv;

                    // Add subtle mouse influence
                    vec2 mouseOffset = (uMouse - 0.5) * 0.05;
                    uv += mouseOffset;

                    // Create flowing nebula clouds
                    float t = uTime * 0.3;

                    // Multiple noise layers for depth
                    vec3 pos1 = vec3(uv * 2.0, t * 0.5);
                    vec3 pos2 = vec3(uv * 3.0 + 1.0, t * 0.3);
                    vec3 pos3 = vec3(uv * 1.5 - 2.0, t * 0.7);

                    float noise1 = fbm(pos1);
                    float noise2 = fbm(pos2);
                    float noise3 = fbm(pos3);

                    // JJK Color palette - deep purples, magentas, cursed energy reds
                    vec3 deepSpace = vec3(0.039, 0.016, 0.071);      // #0a0412 - near black purple
                    vec3 darkPurple = vec3(0.102, 0.039, 0.180);     // #1a0a2e
                    vec3 midPurple = vec3(0.298, 0.129, 0.408);      // #4c2168 - violet
                    vec3 magenta = vec3(0.745, 0.094, 0.365);        // #be185d
                    vec3 cursedRed = vec3(0.600, 0.106, 0.106);      // #991b1b - red energy

                    // Mix colors based on noise
                    vec3 color = deepSpace;

                    // Layer 1: Purple nebula clouds
                    float cloud1 = smoothstep(-0.2, 0.6, noise1);
                    color = mix(color, darkPurple, cloud1 * 0.8);

                    // Layer 2: Mid-purple swirls
                    float cloud2 = smoothstep(0.0, 0.5, noise2);
                    color = mix(color, midPurple, cloud2 * 0.4);

                    // Layer 3: Magenta highlights
                    float highlight = smoothstep(0.3, 0.7, noise1 * noise2);
                    color = mix(color, magenta, highlight * 0.25);

                    // Layer 4: Cursed energy red wisps
                    float redWisp = smoothstep(0.4, 0.8, noise3);
                    color = mix(color, cursedRed, redWisp * 0.15);

                    // Add subtle glow around center
                    float centerGlow = 1.0 - length(vUv - 0.5) * 1.5;
                    centerGlow = max(0.0, centerGlow);
                    color += magenta * centerGlow * 0.1;

                    // Vignette for depth
                    float vignette = 1.0 - length(vUv - 0.5) * 0.8;
                    color *= vignette;

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
            if (colorChoice < 0.7) {
                // White/pale blue
                colors[i * 3] = 0.9 + Math.random() * 0.1;
                colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
                colors[i * 3 + 2] = 1.0;
            } else if (colorChoice < 0.9) {
                // Pale purple
                colors[i * 3] = 0.8;
                colors[i * 3 + 1] = 0.7;
                colors[i * 3 + 2] = 1.0;
            } else {
                // Warm accent
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.8;
                colors[i * 3 + 2] = 0.7;
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
        // Mouse tracking
        this.onMouseMove = (e) => {
            const rect = this.container.getBoundingClientRect();
            this.targetMouse.x = (e.clientX - rect.left) / rect.width;
            this.targetMouse.y = 1 - (e.clientY - rect.top) / rect.height;
        };

        // Resize handling
        this.onResize = () => {
            const rect = this.container.getBoundingClientRect();
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

        this.time += 0.016; // ~60fps timestep

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
