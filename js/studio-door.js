/* studio-door.js: the way back from /os to the studio (4.65.0).
 *
 * The studio's monitor and dock open /os?from=studio. When that flag is
 * present, the top bar's exit says THE STUDIO and points at it (/ since
 * 4.69.0, /studio before), so a visitor who walked in through the set walks out
 * the same way. Without the flag the exit is unchanged; it reaches / too. */
export function applyStudioDoor(doc = document, search = location.search) {
    if (new URLSearchParams(search).get('from') !== 'studio') return false;
    const exit = doc.querySelector('.top-bar-exit');
    if (!exit) return false;
    exit.setAttribute('href', '/');
    exit.setAttribute('title', 'Back to the studio');
    const label = [...exit.childNodes].reverse().find((n) => n.nodeType === 3 && n.textContent.trim());
    if (label) label.textContent = ' THE STUDIO';
    return true;
}
