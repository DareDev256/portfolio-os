/**
 * 3D Mahoraga Wheel
 * Procedural Three.js 3D wheel for the lock screen hero
 * White/silver metallic with rim lighting and adaptation rotation
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

let _hidden = false;
document.addEventListener('visibilitychange', () => { _hidden = document.hidden; });

export class MahoragaWheel3D {
    constructor(container, options = {}) {
        this.container = container;
        this.size = options.size || 400;
        this.isRunning = false;
        this.adaptationAngle = 0;
        this.targetAngle = 0;
        this.adaptationTimer = 0;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this._lastRenderTime = 0;
        this._isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth <= 768;

        this.init();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();

        // Camera — raised higher and pulled back to avoid bottom clipping
        this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        this.camera.position.set(0, 1.8, 5.5);
        this.camera.lookAt(0, -0.2, 0);

        // Renderer — desktop gets antialias + high-perf GPU; mobile stays lean
        this.renderer = new THREE.WebGLRenderer({
            antialias: !this._isMobile,
            alpha: true,
            powerPreference: this._isMobile ? 'low-power' : 'high-performance'
        });
        this.renderer.setSize(this.size, this.size);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this._isMobile ? 1.5 : 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.4;
        this.renderer.setClearColor(0x000000, 0);

        // Style canvas — override watermark's low opacity
        const canvas = this.renderer.domElement;
        canvas.style.position = 'absolute';
        canvas.style.top = '50%';
        canvas.style.left = '50%';
        canvas.style.transform = 'translate(-50%, -50%)';
        canvas.style.pointerEvents = 'none';
        canvas.style.opacity = '1'; // Canvas handles its own alpha
        canvas.classList.add('mahoraga-3d-canvas');
        this.container.appendChild(canvas);

        // Signal CSS to boost container opacity for hero prominence
        this.container.classList.add('has-3d-wheel');

        // Build wheel
        this.wheelGroup = new THREE.Group();
        this.buildWheel();
        this.scene.add(this.wheelGroup);

        // Tilt the wheel forward (gentler tilt to prevent bottom clipping)
        this.wheelGroup.rotation.x = -0.8; // ~46 degrees

        // Lighting
        this.setupLighting();

        // Start
        this.start();
    }

    buildWheel() {
        // --- Materials (white/silver metallic) ---
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xd4d4d8,
            metalness: 0.92,
            roughness: 0.2,
            emissive: 0x3f3f46,
            emissiveIntensity: 0.15,
            side: THREE.DoubleSide
        });

        const spokeMat = new THREE.MeshStandardMaterial({
            color: 0xc0c0c8,
            metalness: 0.88,
            roughness: 0.25,
            emissive: 0x2c2c35,
            emissiveIntensity: 0.12
        });

        const orbMat = new THREE.MeshStandardMaterial({
            color: 0xe8e8f0,
            metalness: 0.95,
            roughness: 0.12,
            emissive: 0x52525b,
            emissiveIntensity: 0.2,
            envMapIntensity: 1.5
        });

        const hubMat = new THREE.MeshStandardMaterial({
            color: 0xdcdce5,
            metalness: 0.92,
            roughness: 0.18,
            emissive: 0x44444d,
            emissiveIntensity: 0.18
        });

        // --- Outer Ring (Torus) — reduced segments ---
        const outerRing = new THREE.Mesh(
            new THREE.TorusGeometry(2.0, 0.08, 12, 48),
            ringMat
        );
        this.wheelGroup.add(outerRing);

        // Inner ring
        const innerRing = new THREE.Mesh(
            new THREE.TorusGeometry(1.9, 0.04, 8, 48),
            ringMat.clone()
        );
        innerRing.material.emissiveIntensity = 0.08;
        innerRing.material.opacity = 0.5;
        innerRing.material.transparent = true;
        this.wheelGroup.add(innerRing);

        // --- 8 Spokes (curved tubes) ---
        const spokePositions = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const outerX = Math.cos(angle) * 2.0;
            const outerY = Math.sin(angle) * 2.0;
            spokePositions.push({ angle, x: outerX, y: outerY });

            // Create curved spoke using QuadraticBezierCurve3
            const hubRadius = 0.55;
            const innerX = Math.cos(angle) * hubRadius;
            const innerY = Math.sin(angle) * hubRadius;

            // Slight curve offset perpendicular to spoke direction
            const perpAngle = angle + Math.PI / 2;
            const curveStrength = 0.35;
            const midX = Math.cos(angle) * 1.2 + Math.cos(perpAngle) * curveStrength;
            const midY = Math.sin(angle) * 1.2 + Math.sin(perpAngle) * curveStrength;

            const curve = new THREE.QuadraticBezierCurve3(
                new THREE.Vector3(innerX, innerY, 0),
                new THREE.Vector3(midX, midY, 0),
                new THREE.Vector3(outerX, outerY, 0)
            );

            const spokeGeo = new THREE.TubeGeometry(curve, 8, 0.055, 6, false);
            const spoke = new THREE.Mesh(spokeGeo, spokeMat);
            this.wheelGroup.add(spoke);
        }

        // --- 8 Orbs --- (reduced segments)
        const orbGeo = new THREE.SphereGeometry(0.18, 16, 16);
        spokePositions.forEach(({ x, y }) => {
            const orb = new THREE.Mesh(orbGeo, orbMat);
            orb.position.set(x, y, 0);
            this.wheelGroup.add(orb);
        });

        // --- Central Hub --- (reduced segments)
        // Outer hub disc
        const hubOuter = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24),
            hubMat
        );
        hubOuter.rotation.x = Math.PI / 2;
        this.wheelGroup.add(hubOuter);

        // Inner hub ring
        const hubRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.4, 0.03, 8, 24),
            ringMat
        );
        this.wheelGroup.add(hubRing);

        // Core sphere
        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 16, 16),
            orbMat.clone()
        );
        core.material.emissiveIntensity = 0.35;
        this.wheelGroup.add(core);

        // Cross lines on hub
        const crossMat = new THREE.MeshBasicMaterial({
            color: 0xfafafa,
            transparent: true,
            opacity: 0.6
        });
        const crossH = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.025, 0.025),
            crossMat
        );
        const crossV = new THREE.Mesh(
            new THREE.BoxGeometry(0.025, 0.6, 0.025),
            crossMat
        );
        this.wheelGroup.add(crossH);
        this.wheelGroup.add(crossV);
    }

    setupLighting() {
        // Ambient — cool grey base
        const ambient = new THREE.AmbientLight(0x404050, 0.8);
        this.scene.add(ambient);

        // Key light — bright white from upper-left
        const keyLight = new THREE.DirectionalLight(0xeeeeff, 1.6);
        keyLight.position.set(-3, 4, 5);
        this.scene.add(keyLight);

        // Rim light — cool cyan from behind for edge definition
        const rimLight = new THREE.PointLight(0x00ccdd, 1.5, 15);
        rimLight.position.set(0, 0, -3);
        this.scene.add(rimLight);

        // Fill light — soft cyan accent from right
        const fillLight = new THREE.PointLight(0x88ddff, 0.5, 10);
        fillLight.position.set(4, -1, 2);
        this.scene.add(fillLight);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
    }

    animate() {
        if (!this.isRunning) return;
        this.rafId = requestAnimationFrame(() => this.animate());
        if (_hidden) return;  // skip frame when hidden

        // 60fps on desktop (16ms), 30fps on mobile (32ms)
        const now = performance.now();
        const frameMs = this._isMobile ? 32 : 16;
        if (now - this._lastRenderTime < frameMs) return;
        this._lastRenderTime = now;

        const dt = this._isMobile ? 0.033 : 0.016;
        this.adaptationTimer += dt;

        // Mahoraga adaptation: click 45 degrees every 2 seconds
        if (!this.prefersReducedMotion && this.adaptationTimer > 2.0) {
            this.adaptationTimer = 0;
            this.targetAngle += Math.PI / 4; // 45 degrees
        }

        // Smooth interpolation toward target angle (spring-like snap)
        const diff = this.targetAngle - this.adaptationAngle;
        if (Math.abs(diff) > 0.001) {
            this.adaptationAngle += diff * (this._isMobile ? 0.15 : 0.08);
        } else {
            this.adaptationAngle = this.targetAngle;
        }

        // Apply rotation around the wheel's Z axis (spin axis)
        this.wheelGroup.rotation.z = this.adaptationAngle;

        // Subtle hover/float
        if (!this.prefersReducedMotion) {
            const t = now * 0.001;
            this.wheelGroup.position.y = Math.sin(t * 0.5) * 0.08;
        }

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        this.stop();
        this.renderer.dispose();
        this.scene.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
    }
}
