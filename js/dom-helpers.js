/**
 * Shared DOM Utilities
 * Centralizes duplicated patterns across desktop.js, github.js, and others.
 */

/**
 * Safely open an external link with noopener/noreferrer to prevent tabnapping.
 * Replaces bare window.open(url, '_blank') calls throughout the codebase.
 */
export function openExternal(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Animate a number counter from 0 to target over a duration.
 * Previously duplicated identically in desktop.js and github.js.
 * Returns the interval ID so callers can cancel if needed.
 */
export function animateCounter(element, target, duration = 1500) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
    return timer;
}
