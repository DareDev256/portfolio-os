/**
 * System Whispers — ambient floating HUD data fragments
 * Holographic text snippets drift across the desktop at low opacity,
 * creating a "data-in-the-air" Tony Stark's lab atmosphere.
 * Spawns behind windows (z-index 2), respects reduced motion.
 */
import { isPageHidden, prefersReducedMotion } from './dom-helpers.js';

const MAX_WHISPERS = 6;
const SPAWN_INTERVAL = 4000;
const DRIFT_DURATION_MIN = 12000;
const DRIFT_DURATION_MAX = 22000;

const FRAGMENTS = [
    'NEURAL_LINK :: active',
    'AES-256 ✓ encrypted',
    'λ passion.resolve()',
    '▸ 47 repos monitored',
    'UPLINK :: 12ms latency',
    'HEAP :: 1.4 GB allocated',
    '◈ DAREDEV256 :: online',
    'SHA-512 :: verified',
    'QUANTUM_SEED :: 0xA7F3',
    'TCP/443 :: TLS 1.3',
    'PID 1337 :: heartbeat ✓',
    'ENTROPY :: 94.2%',
    'SIGNAL :: ████████░░ 82%',
    'GC_SWEEP :: 0 orphans',
    '∞ event_loop :: idle',
    'CIPHER :: ChaCha20-Poly1305',
    'WATCHDOG :: all clear',
    'TENSOR :: shape [128,64]',
    'DNS :: jamesdare.com → ✓',
    'PASSION.ai :: dreaming...',
];

let container = null;
let spawnTimer = null;
let activeCount = 0;

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function pickFragment() {
    return FRAGMENTS[Math.floor(Math.random() * FRAGMENTS.length)];
}

function spawnWhisper() {
    if (isPageHidden() || activeCount >= MAX_WHISPERS) return;
    if (prefersReducedMotion()) return;

    const el = document.createElement('div');
    el.className = 'whisper-fragment';
    el.textContent = pickFragment();

    // Random position — avoid dock (bottom 70px) and top bar (top 40px)
    const startX = randomBetween(5, 85);
    const startY = randomBetween(8, 80);
    const driftX = randomBetween(-8, 8);
    const driftY = randomBetween(-12, -4);
    const duration = randomBetween(DRIFT_DURATION_MIN, DRIFT_DURATION_MAX);

    el.style.left = `${startX}%`;
    el.style.top = `${startY}%`;
    el.style.setProperty('--drift-x', `${driftX}vw`);
    el.style.setProperty('--drift-y', `${driftY}vh`);
    el.style.animationDuration = `${duration}ms`;

    // Slight random rotation for organic feel
    const tilt = randomBetween(-3, 3);
    el.style.setProperty('--tilt', `${tilt}deg`);

    // Alternate gold and cyan tints
    if (Math.random() > 0.6) {
        el.classList.add('whisper--gold');
    }

    container.appendChild(el);
    activeCount++;

    // Self-cleanup after animation completes
    el.addEventListener('animationend', () => {
        el.remove();
        activeCount--;
    }, { once: true });
}

export const Whispers = {
    init() {
        if (container) return;
        container = document.createElement('div');
        container.className = 'whisper-layer';
        container.setAttribute('aria-hidden', 'true');

        // Insert into desktop so it sits behind windows
        const desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.insertBefore(container, desktop.firstChild);
        } else {
            document.body.appendChild(container);
        }

        // Staggered initial spawn
        setTimeout(() => spawnWhisper(), 2000);
        setTimeout(() => spawnWhisper(), 3500);

        spawnTimer = setInterval(spawnWhisper, SPAWN_INTERVAL);

        // Pause when tab hidden
        document.addEventListener('visibilitychange', () => {
            if (isPageHidden()) {
                clearInterval(spawnTimer);
                spawnTimer = null;
            } else if (!spawnTimer) {
                spawnTimer = setInterval(spawnWhisper, SPAWN_INTERVAL);
            }
        });
    },

    destroy() {
        if (spawnTimer) clearInterval(spawnTimer);
        spawnTimer = null;
        container?.remove();
        container = null;
        activeCount = 0;
    },
};
