/* studio-door.js: the way back from /os to the studio (4.65.0).
 *
 * The studio's monitor and dock open /os?from=studio. When that flag is
 * present, the top bar's exit points back at /studio instead of the Monitor,
 * so a visitor who walked in through the set walks out the same way. Without
 * the flag nothing changes. */
export function applyStudioDoor(doc = document, search = location.search) {
    if (new URLSearchParams(search).get('from') !== 'studio') return false;
    const exit = doc.querySelector('.top-bar-exit');
    if (!exit) return false;
    exit.setAttribute('href', '/studio');
    exit.setAttribute('title', 'Back to the studio');
    const label = [...exit.childNodes].reverse().find((n) => n.nodeType === 3 && n.textContent.trim());
    if (label) label.textContent = ' THE STUDIO';
    return true;
}
