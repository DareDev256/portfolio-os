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
const ACHIEVEMENTS = [
    {
        id: 'first_boot',
        title: 'System Online',
        description: 'Completed the Passion OS boot sequence.',
        icon: '⚡',
        rarity: 'common',
    },
    {
        id: 'explorer',
        title: 'Explorer',
        description: 'Opened 3 different desktop applications.',
        icon: '🔍',
        rarity: 'common',
        threshold: 3,
    },
    {
        id: 'cartographer',
        title: 'Cartographer',
        description: 'Opened 7 different desktop applications.',
        icon: '🗺️',
        rarity: 'rare',
        threshold: 7,
    },
    {
        id: 'terminal_jockey',
        title: 'Terminal Jockey',
        description: 'Opened the developer terminal.',
        icon: '💻',
        rarity: 'rare',
    },
    {
        id: 'due_diligence',
        title: 'Due Diligence',
        description: 'Reviewed Resume, About Me, and Skills Matrix.',
        icon: '📋',
        rarity: 'epic',
        requires: ['resume', 'about', 'skills'],
    },
    {
        id: 'night_owl',
        title: 'Night Owl',
        description: 'Visited Passion OS between midnight and 5 AM.',
        icon: '🌙',
        rarity: 'rare',
    },
    {
        id: 'power_user',
        title: 'Power User',
        description: 'Used the command palette (Cmd/Alt + K).',
        icon: '⌨️',
        rarity: 'rare',
    },
    {
        id: 'passion_fan',
        title: "Passion's Friend",
        description: 'Opened the Passion AI chat window.',
        icon: '🤖',
        rarity: 'common',
    },
    {
        id: 'speed_demon',
        title: 'Speed Demon',
        description: 'Opened 5 windows within 30 seconds.',
        icon: '🏃',
        rarity: 'epic',
    },
    {
        id: 'completionist',
        title: 'Completionist',
        description: 'Unlocked every other achievement. Absolute legend.',
        icon: '👑',
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
    icon.textContent = achievement.icon;

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
