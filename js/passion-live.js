/**
 * Passion Live — Real-time connection to Passion Agent
 * Singleton module: fetches from API, caches in localStorage, provides offline fallbacks.
 * All other Passion UI components consume this module.
 */

import { Sanitize } from './sanitize.js';

const API_URL = 'https://passion-api.jamesdare.com/api/public';
const CACHE_KEY = 'passion_live_cache';
const POLL_INTERVAL = 30_000; // 30 seconds
const FETCH_TIMEOUT = 5_000;  // 5 second abort

// Known valid states — rejects anything the API shouldn't return
const VALID_STATES = new Set([
  'working', 'thinking', 'sleeping', 'focused', 'celebrating', 'idle',
]);

/**
 * Sanitize API response at the trust boundary.
 * Prevents stored XSS via compromised API or poisoned localStorage cache.
 * String fields are HTML-escaped; enum fields are validated against allowlists.
 */
function sanitizeState(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    status: raw.status === 'online' ? 'online' : 'offline',
    state: VALID_STATES.has(raw.state) ? raw.state : 'sleeping',
    stateEmoji: Sanitize.text(String(raw.stateEmoji || '😴')),
    uptime: Sanitize.text(String(raw.uptime || '—')),
    mood: Sanitize.text(String(raw.mood || 'resting')),
    commentary: Sanitize.text(String(raw.commentary || '')),
    cyclesTotal: Number.isFinite(Number(raw.cyclesTotal)) ? Number(raw.cyclesTotal) : 0,
    tasksToday: Number.isFinite(Number(raw.tasksToday)) ? Number(raw.tasksToday) : 0,
    currentFocus: Sanitize.text(String(raw.currentFocus || '—')),
    lastActive: Sanitize.text(String(raw.lastActive || 'unknown')),
    greeting: Sanitize.text(String(raw.greeting || '')),
  };
}

// State-to-label mapping for visitors
const STATE_LABELS = {
  working:     'crunching code',
  thinking:    'pondering something',
  sleeping:    'recharging',
  focused:     'deep in focus',
  celebrating: 'celebrating a win!',
  idle:        'hanging out',
};

// Dot color classes per state category
const STATE_COLORS = {
  working:     'green',
  focused:     'green',
  celebrating: 'green',
  thinking:    'amber',
  idle:        'green',
  sleeping:    'grey',
};

// Recent project highlights — shown when Passion is offline or as context
const PROJECT_HIGHLIGHTS = [
  "Just shipped BetMetrics.ca — a multi-sport analytics platform with live odds across 7 sports",
  "Building AR gesture interfaces with hand tracking — pinch to click, swipe to navigate",
  "Designed 20+ industry demo sites for the web design portfolio",
  "Integrated Hevy's fitness API into the Passion dashboard for workout tracking",
  "Built a lead generation pipeline with Playwright that scraped 2,400+ Toronto businesses",
  "Launched custom sites for Edson Legal, MustHaveFrenchies, and The Syren Effect",
  "Working on an autonomous AI agent framework — 92 modules running 24/7",
];

function getRandomHighlight() {
  return PROJECT_HIGHLIGHTS[Math.floor(Math.random() * PROJECT_HIGHLIGHTS.length)];
}

// Offline fallback data
const FALLBACK = {
  status: 'offline',
  state: 'sleeping',
  stateEmoji: '🌙',
  uptime: '—',
  mood: 'resting',
  commentary: getRandomHighlight(),
  cyclesTotal: 0,
  tasksToday: 0,
  currentFocus: '—',
  lastActive: 'unknown',
  greeting: "Hey! I'm Passion, James's AI assistant. He's been busy — " + getRandomHighlight().toLowerCase() + ". Want me to show you around?",
};

// Tour step quips (offline fallbacks)
const TOUR_QUIPS = {
  welcome: "Welcome! I run 24/7 on a Mac Mini keeping James's code in check. Let me show you around.",
  about:   "This is where the magic starts — James's story, from Toronto creative to AI engineer.",
  dock:    "The dock is your command center. Everything you need, one click away.",
  resume:  "The receipts. Skills, experience, the whole package. Feel free to download it.",
  applications: "The real work lives here. Live demos, real code, actual projects.",
};

// Personality quips for the chat window
const FUN_FACTS = [
  "I once reviewed 847 cycles of code in a single week. Sleep is for humans.",
  "My favorite state is 'celebrating' — it means something just shipped.",
  "I draft social media posts for James. He says I'm 'sassier than expected.'",
  "I run on a Mac Mini in Toronto. It's cozy.",
  "I have 18 emotional states. My favorite is 'eureka.'",
  "Fun fact: I track my own error budget. If I mess up too much, I slow myself down.",
  "I handle code, career, content, and even wellness tracking. Full spectrum companion.",
  "James named me Passion because that's what drives everything he builds.",
];

let _pollTimer = null;
let _listeners = new Set();

export const PassionLive = {
  state: null,
  lastFetch: 0,
  _fetchPromise: null,

  /**
   * Initialize — load cache, start polling
   */
  init() {
    // Load from localStorage cache immediately — sanitize at the trust boundary
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        this.state = sanitizeState(parsed.data);
        this.lastFetch = parsed.timestamp || 0;
      }
    } catch { /* corrupt cache, ignore */ }

    // If no cache, use fallback
    if (!this.state) this.state = { ...FALLBACK };

    // Fetch fresh data immediately, then poll
    this.fetch();
    this._startPolling();
  },

  /**
   * Fetch fresh data from API. Returns cached/fallback on failure.
   */
  async fetch() {
    // Debounce concurrent calls
    if (this._fetchPromise) return this._fetchPromise;

    this._fetchPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const res = await fetch(API_URL, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        this.state = sanitizeState(data);
        this.lastFetch = Date.now();

        // Cache to localStorage
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data,
            timestamp: this.lastFetch,
          }));
        } catch { /* quota exceeded, non-critical */ }

        this._notify();
        return data;
      } catch {
        // Silent fail — use cached state or fallback
        if (!this.state) this.state = { ...FALLBACK };
        return this.state;
      } finally {
        this._fetchPromise = null;
      }
    })();

    return this._fetchPromise;
  },

  /**
   * Subscribe to state changes
   */
  onChange(fn) {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },

  _notify() {
    for (const fn of _listeners) {
      try { fn(this.state); } catch { /* listener error, non-critical */ }
    }
  },

  _startPolling() {
    if (_pollTimer) return;
    _pollTimer = setInterval(() => this.fetch(), POLL_INTERVAL);
  },

  stopPolling() {
    if (_pollTimer) {
      clearInterval(_pollTimer);
      _pollTimer = null;
    }
  },

  // ── Public getters ────────────────────────────────────────────────

  isOnline() {
    return this.state?.status === 'online';
  },

  getGreeting() {
    return this.state?.greeting || FALLBACK.greeting;
  },

  getCommentary() {
    return this.state?.commentary || FALLBACK.commentary;
  },

  getStatus() {
    return {
      state: this.state?.state || 'sleeping',
      emoji: this.state?.stateEmoji || '😴',
      mood: this.state?.mood || 'resting',
    };
  },

  getStateLabel() {
    const state = this.state?.state || 'sleeping';
    return STATE_LABELS[state] || state;
  },

  getStateColor() {
    const state = this.state?.state || 'sleeping';
    return STATE_COLORS[state] || 'grey';
  },

  getStats() {
    return {
      cyclesTotal: this.state?.cyclesTotal || 0,
      tasksToday: this.state?.tasksToday || 0,
      uptime: this.state?.uptime || '—',
      currentFocus: this.state?.currentFocus || '—',
      lastActive: this.state?.lastActive || 'unknown',
    };
  },

  getTourQuip(stepId) {
    return TOUR_QUIPS[stepId] || "Check this out!";
  },

  getRandomFact() {
    return FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
  },

  /**
   * Get the emotion image path based on current state
   */
  getEmotionImage() {
    const stateToEmotion = {
      working: 'working',
      focused: 'focused',
      thinking: 'thinking',
      celebrating: 'celebrating',
      sleeping: 'sleeping',
      idle: 'idle',
    };
    const emotion = stateToEmotion[this.state?.state] || 'idle';
    return `/assets/emotions/${emotion}.png`;
  },

  getPortraitImage() {
    return '/assets/passion-portrait.png';
  },

  /**
   * Create a safe portrait <img> element with programmatic error handling.
   * Replaces inline onerror="" handlers (which violate CSP and are XSS vectors).
   * @param {string} [extraClass] - Additional CSS class(es) for the img element
   * @returns {HTMLImageElement}
   */
  createPortraitImg(extraClass = '') {
    const img = document.createElement('img');
    img.src = this.getPortraitImage();
    img.alt = 'Passion';
    img.className = `passion-avatar${extraClass ? ' ' + extraClass : ''}`;
    img.addEventListener('error', () => { img.style.display = 'none'; }, { once: true });
    return img;
  },
};
