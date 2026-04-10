/**
 * Achievement System — Gamified Portfolio Exploration
 * Tracks visitor actions and awards achievements for discovery.
 * Persisted via localStorage, non-intrusive, cyberpunk-themed.
 *
 * Architecture: Singleton module with event-driven unlock detection.
 * Desktop.js fires custom events; this module listens and awards.
 */
const STORAGE_KEY = 'passion_os_achievements';

// ── Achievement Definitions ──────────────────────────────────────────
// Each achievement has: id, title, description, icon (emoji), rarity, and a check function.
// Rarity: common (grey) | rare (cyan) | epic (purple) | legendary (gold)
// SVG icon builder — returns inline SVG markup for each achievement
const SVG_ICONS = {
    first_boot: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    explorer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>`,
    cartographer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
    terminal_jockey: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><polyline points="7 9 10 12 7 15"/><line x1="13" y1="15" x2="17" y2="15"/></svg>`,
    due_diligence: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="2" width="18" height="20" rx="2"/><path d="M9 2v4h6V2"/><path d="M8 12l2.5 2.5L16 9"/></svg>`,
    night_owl: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/><circle cx="8" cy="11" r="1" fill="currentColor"/><circle cx="14" cy="9" r="0.5" fill="currentColor"/></svg>`,
    power_user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10l3 3-3 3"/><line x1="12" y1="16" x2="18" y2="16"/></svg>`,
    passion_fan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="11" r="1.5" fill="currentColor"/><circle cx="15" cy="11" r="1.5" fill="currentColor"/><path d="M9 15.5c0 0 1.5 1.5 3 1.5s3-1.5 3-1.5"/></svg>`,
    speed_demon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/><path d="M5 19l-2 2M7 21l-1 1" opacity="0.5"/></svg>`,
    completionist: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.09 6.26L21 9.27l-5 4.87L17.18 21 12 17.77 6.82 21 8 14.14 3 9.27l6.91-1.01L12 2z" fill="currentColor" opacity="0.15"/><path d="M12 2l2.09 6.26L21 9.27l-5 4.87L17.18 21 12 17.77 6.82 21 8 14.14 3 9.27l6.91-1.01L12 2z"/></svg>`,
};

const ACHIEVEMENTS = [
    {
        id: 'first_boot',
        title: 'System Online',
        description: 'Completed the Passion OS boot sequence.',
        icon: SVG_ICONS.first_boot,
        rarity: 'common',
    },
    {
        id: 'explorer',
        title: 'Explorer',
        description: 'Opened 3 different desktop applications.',
        icon: SVG_ICONS.explorer,
        rarity: 'common',
        threshold: 3,
    },
    {
        id: 'cartographer',
        title: 'Cartographer',
        description: 'Opened 7 different desktop applications.',
        icon: SVG_ICONS.cartographer,
        rarity: 'rare',
        threshold: 7,
    },
    {
        id: 'terminal_jockey',
        title: 'Terminal Jockey',
        description: 'Opened the developer terminal.',
        icon: SVG_ICONS.terminal_jockey,
        rarity: 'rare',
    },
    {
        id: 'due_diligence',
        title: 'Due Diligence',
        description: 'Reviewed Resume, About Me, and Skills Matrix.',
        icon: SVG_ICONS.due_diligence,
        rarity: 'epic',
        requires: ['resume', 'about', 'skills'],
    },
    {
        id: 'night_owl',
        title: 'Night Owl',
        description: 'Visited Passion OS between midnight and 5 AM.',
        icon: SVG_ICONS.night_owl,
        rarity: 'rare',
    },
    {
        id: 'power_user',
        title: 'Power User',
        description: 'Used the command palette (Cmd/Alt + K).',
        icon: SVG_ICONS.power_user,
        rarity: 'rare',
    },
    {
        id: 'passion_fan',
        title: "Passion's Friend",
        description: 'Opened the Passion AI chat window.',
        icon: SVG_ICONS.passion_fan,
        rarity: 'common',
    },
    {
        id: 'speed_demon',
        title: 'Speed Demon',
        description: 'Opened 5 windows within 30 seconds.',
        icon: SVG_ICONS.speed_demon,
        rarity: 'epic',
    },
    {
        id: 'completionist',
        title: 'Completionist',
        description: 'Unlocked every other achievement. Absolute legend.',
        icon: SVG_ICONS.completionist,
        rarity: 'legendary',
    },
];

// ── State ────────────────────────────────────────────────────────────
let unlocked = {};         // { achievementId: timestamp }
let windowsOpened = {};    // { windowId: true } — unique windows this session
let recentWindows = [];    // timestamps of recent window opens for speed tracking
let listeners = new Set();
let initialized = false;

// ── Persistence ──────────────────────────────────────────────────────
function load() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        unlocked = data.unlocked || {};
    } catch { unlocked = {}; }
}

function save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ unlocked }));
    } catch { /* quota exceeded, non-critical */ }
}

// ── Notification ─────────────────────────────────────────────────────
function showUnlockPopup(achievement) {
    // Remove any existing popup first
    document.querySelector('.achievement-popup')?.remove();

    const popup = document.createElement('div');
    popup.className = `achievement-popup achievement-rarity-${achievement.rarity}`;
    popup.setAttribute('role', 'alert');
    popup.setAttribute('aria-label', `Achievement unlocked: ${achievement.title}`);

    const icon = document.createElement('span');
    icon.className = 'achievement-popup-icon';
    icon.innerHTML = achievement.icon;

    const info = document.createElement('div');
    info.className = 'achievement-popup-info';

    const label = document.createElement('div');
    label.className = 'achievement-popup-label';
    label.textContent = 'ACHIEVEMENT UNLOCKED';

    const title = document.createElement('div');
    title.className = 'achievement-popup-title';
    title.textContent = achievement.title;

    const desc = document.createElement('div');
    desc.className = 'achievement-popup-desc';
    desc.textContent = achievement.description;

    info.append(label, title, desc);
    popup.append(icon, info);
    document.body.appendChild(popup);

    // Trigger entrance animation
    requestAnimationFrame(() => popup.classList.add('active'));

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        popup.classList.add('dismissing');
        popup.addEventListener('animationend', () => popup.remove(), { once: true });
        // Fallback removal
        setTimeout(() => popup.remove(), 600);
    }, 5000);
}

// ── Core Unlock Logic ────────────────────────────────────────────────
function unlock(id) {
    if (unlocked[id]) return false; // Already unlocked

    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) return false;

    unlocked[id] = Date.now();
    save();
    showUnlockPopup(achievement);
    notifyListeners();

    // After any unlock, check completionist
    checkCompletionist();
    return true;
}

function checkCompletionist() {
    if (unlocked.completionist) return;
    const otherIds = ACHIEVEMENTS.filter(a => a.id !== 'completionist').map(a => a.id);
    if (otherIds.every(id => unlocked[id])) {
        // Small delay so the previous popup clears
        setTimeout(() => unlock('completionist'), 2000);
    }
}

// ── Event Handlers ───────────────────────────────────────────────────

function onWindowOpen(windowId) {
    windowsOpened[windowId] = true;
    const uniqueCount = Object.keys(windowsOpened).length;

    // Track timing for speed demon
    const now = Date.now();
    recentWindows.push(now);
    recentWindows = recentWindows.filter(t => now - t < 30_000);

    // Explorer: 3 unique windows
    if (uniqueCount >= 3) unlock('explorer');

    // Cartographer: 7 unique windows
    if (uniqueCount >= 7) unlock('cartographer');

    // Terminal jockey
    if (windowId === 'terminal') unlock('terminal_jockey');

    // Passion fan
    if (windowId === 'passion') unlock('passion_fan');

    // Due diligence: resume + about + skills
    const due = ['resume', 'about', 'skills'];
    if (due.every(id => windowsOpened[id])) unlock('due_diligence');

    // Speed demon: 5 windows in 30 seconds
    if (recentWindows.length >= 5) unlock('speed_demon');
}

function onCommandPalette() {
    unlock('power_user');
}

function onBootComplete() {
    unlock('first_boot');

    // Night owl check
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
        setTimeout(() => unlock('night_owl'), 1500);
    }
}

// ── Change Listeners ─────────────────────────────────────────────────
function notifyListeners() {
    for (const fn of listeners) {
        try { fn(); } catch { /* non-critical */ }
    }
}

// ── Public API ───────────────────────────────────────────────────────
export const Achievements = {
    init() {
        if (initialized) return;
        initialized = true;
        load();

        // Listen for window opens via custom event from desktop
        document.addEventListener('passion:window-open', (e) => {
            onWindowOpen(e.detail?.id);
        });

        // Listen for command palette open
        document.addEventListener('passion:command-palette', () => {
            onCommandPalette();
        });

        // Listen for boot complete
        document.addEventListener('passion:boot-complete', () => {
            onBootComplete();
        });
    },

    /** Get all achievement definitions with unlock status */
    getAll() {
        return ACHIEVEMENTS.map(a => ({
            ...a,
            unlocked: !!unlocked[a.id],
            unlockedAt: unlocked[a.id] || null,
        }));
    },

    /** Get count of unlocked achievements */
    getProgress() {
        const total = ACHIEVEMENTS.length;
        const done = ACHIEVEMENTS.filter(a => unlocked[a.id]).length;
        return { done, total, percent: Math.round((done / total) * 100) };
    },

    /** Subscribe to achievement changes */
    onChange(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },

    /** Reset all achievements (for testing) */
    reset() {
        unlocked = {};
        windowsOpened = {};
        recentWindows = [];
        save();
        notifyListeners();
    },
};
