/**
 * Passion Ambient Presence — contextual toast popups
 * Makes the site feel alive by reacting to user behavior.
 * Non-intrusive: max 1 popup per 30s, dismissable, sessionStorage tracking.
 */
import { PassionLive } from './passion-live.js';

const TOAST_COOLDOWN = 30_000; // 30 seconds between toasts
const IDLE_TIMEOUT = 60_000;   // 60 seconds before idle trigger
const DISMISSED_KEY = 'passion_ambient_dismissed';

let lastToastTime = 0;
let idleTimer = null;
let activeToast = null;
let initialized = false;

// Triggers mapped to window opens (matched by window ID)
const WINDOW_TRIGGERS = {
    portfolio:    "Oh, checking out the portfolio? James put his best work front and center.",
    applications: "The applications showcase — real projects, real code. No fluff.",
    contact:      "Want to reach James? He's pretty responsive on email.",
    about:        "Getting to know the person behind the code. Good call.",
    skills:       "The skills matrix — James keeps this one updated. It's legit.",
    github:       "GitHub Ops — where the commit history tells the real story.",
    resume:       "Smart move. The resume has all the details you need.",
};

const IDLE_MESSAGES = [
    "Still here? Want me to show you something cool?",
    "Taking it all in? I respect that.",
    "Need a tour? Just click the ◈ button in the dock.",
];

const SCROLL_BOTTOM_MESSAGE = "You made it to the bottom! That's dedication. Want to connect with James?";

function getDismissed() {
    try {
        return JSON.parse(sessionStorage.getItem(DISMISSED_KEY) || '{}');
    } catch { return {}; }
}

function setDismissed(key) {
    try {
        const dismissed = getDismissed();
        dismissed[key] = true;
        sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    } catch { /* non-critical */ }
}

function isDismissed(key) {
    return getDismissed()[key] === true;
}

function canShowToast() {
    return Date.now() - lastToastTime >= TOAST_COOLDOWN && !activeToast;
}

function showToast(message, key) {
    if (!canShowToast() || isDismissed(key)) return;

    lastToastTime = Date.now();

    const toast = document.createElement('div');
    toast.className = 'passion-toast';
    toast.innerHTML = `
        <img src="${PassionLive.getPortraitImage()}" alt="Passion" class="passion-toast-avatar"
             onerror="this.style.display='none';" />
        <span class="passion-toast-text">${message}</span>
        <button class="passion-toast-close" aria-label="Dismiss">&times;</button>
    `;

    document.body.appendChild(toast);
    activeToast = toast;

    const dismiss = () => {
        if (!activeToast) return;
        setDismissed(key);
        toast.classList.add('dismissing');
        setTimeout(() => {
            toast.remove();
            activeToast = null;
        }, 300);
    };

    toast.querySelector('.passion-toast-close').addEventListener('click', (e) => {
        e.stopPropagation();
        dismiss();
    });

    // Click anywhere on toast to dismiss
    toast.addEventListener('click', dismiss);

    // Auto-dismiss after 8 seconds
    setTimeout(dismiss, 8000);
}

function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        const msg = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
        showToast(msg, 'idle');
    }, IDLE_TIMEOUT);
}

export function initAmbientPresence() {
    if (initialized) return;
    initialized = true;

    // Ensure PassionLive is ready
    if (!PassionLive.state) PassionLive.init();

    // Listen for window opens via DOM mutations on the windows container
    const windowsContainer = document.getElementById('windowsContainer');
    if (windowsContainer) {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.classList?.contains('window')) {
                        const windowId = node.id?.replace('window-', '');
                        if (windowId && WINDOW_TRIGGERS[windowId]) {
                            // Small delay so the window is visible first
                            setTimeout(() => {
                                showToast(WINDOW_TRIGGERS[windowId], `window_${windowId}`);
                            }, 800);
                        }
                    }
                }
            }
        });
        observer.observe(windowsContainer, { childList: true });
    }

    // Idle detection
    const idleEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    for (const event of idleEvents) {
        document.addEventListener(event, resetIdleTimer, { passive: true });
    }
    resetIdleTimer();

    // Scroll-to-bottom detection (approximate)
    let scrollTriggered = false;
    window.addEventListener('scroll', () => {
        if (scrollTriggered) return;
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight;
        const viewHeight = window.innerHeight;
        if (scrollY + viewHeight >= docHeight - 50) {
            scrollTriggered = true;
            showToast(SCROLL_BOTTOM_MESSAGE, 'scroll_bottom');
        }
    }, { passive: true });
}
