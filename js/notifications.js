/**
 * Toast Notification System
 * Non-blocking notifications with queue, auto-dismiss, and cyberpunk styling.
 */
import { Sanitize } from './sanitize.js';

/** @type {{ type: string, message: string, duration: number, el: HTMLElement }[]} */
const queue = [];
let container = null;
const MAX_VISIBLE = 4;

const TYPES = {
    success: { icon: '▶', label: 'Success' },
    error: { icon: '✖', label: 'Error' },
    warning: { icon: '⚠', label: 'Warning' },
    info: { icon: 'ℹ', label: 'Info' },
};

function ensureContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('role', 'status');
    document.body.appendChild(container);
    return container;
}

function dismissToast(entry) {
    if (!entry.el || !entry.el.parentNode) return;
    entry.el.classList.add('toast-exit');
    entry.el.addEventListener('animationend', () => {
        entry.el.remove();
        const idx = queue.indexOf(entry);
        if (idx !== -1) queue.splice(idx, 1);
    }, { once: true });
}

function showToast(type, message, duration = 4000) {
    ensureContainer();
    const meta = TYPES[type] || TYPES.info;

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.setAttribute('role', 'alert');

    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.textContent = meta.icon;

    const body = document.createElement('div');
    body.className = 'toast-body';

    const label = document.createElement('strong');
    label.className = 'toast-label';
    label.textContent = meta.label;

    const msg = document.createElement('span');
    msg.className = 'toast-message';
    msg.textContent = Sanitize.text(message);

    body.appendChild(label);
    body.appendChild(msg);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');

    const progress = document.createElement('div');
    progress.className = 'toast-progress';
    progress.style.animationDuration = `${duration}ms`;

    el.appendChild(iconSpan);
    el.appendChild(body);
    el.appendChild(closeBtn);
    el.appendChild(progress);

    const entry = { type, message, duration, el };

    // Evict oldest if at capacity
    while (queue.length >= MAX_VISIBLE) {
        dismissToast(queue[0]);
    }

    queue.push(entry);
    container.appendChild(el);

    // Force reflow then trigger entrance animation
    void el.offsetHeight;
    el.classList.add('toast-enter');

    closeBtn.addEventListener('click', () => dismissToast(entry));

    const timer = setTimeout(() => dismissToast(entry), duration);
    // Pause timer on hover
    el.addEventListener('mouseenter', () => {
        clearTimeout(timer);
        progress.style.animationPlayState = 'paused';
    });
    el.addEventListener('mouseleave', () => {
        progress.style.animationPlayState = 'running';
        // Restart with remaining time approximation (just use half)
        setTimeout(() => dismissToast(entry), duration / 2);
    });

    return entry;
}

export const Notify = {
    success: (msg, ms) => showToast('success', msg, ms),
    error: (msg, ms) => showToast('error', msg, ms),
    warning: (msg, ms) => showToast('warning', msg, ms),
    info: (msg, ms) => showToast('info', msg, ms),
};
