export function trapFocus(container) {
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function handler(e) {
        if (e.key !== 'Tab') return;
        const focusable = [...container.querySelectorAll(FOCUSABLE)];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    container.addEventListener('keydown', handler);
    // Focus first focusable element
    const first = container.querySelector(FOCUSABLE);
    if (first) first.focus();

    return () => container.removeEventListener('keydown', handler);
}
