/* slates.js: the studio's crew, read from the Monitor itself (4.65.0).
 *
 * The studio does not keep its own copy of the crew. It fetches the homepage,
 * reads the 16 switcher buttons (role, tool, tint, scene, date) and each
 * source's take panel (what, THE CALL, stats, first link), and fills every
 * [data-fig] from figures.json the same way the Monitor does. One source, so
 * the two surfaces cannot drift apart.
 *
 * House rule carried over from the Monitor: no typed fallback figures. A
 * figure figures.json does not have renders as an em dash, never a stale literal.
 */

export const DASH = '—';

/** Read the crew from a parsed homepage Document. Returns [] when the switcher is missing. */
export function parseCrew(doc) {
    const buttons = [...doc.querySelectorAll('.src[data-src]')];
    return buttons.map((b, i) => {
        const id = b.dataset.src;
        const take = doc.getElementById(`take-${id}`);
        const what = take?.querySelector('.what');
        const callLine = take?.querySelector('.call-line');
        let call = null;
        if (callLine) {
            call = callLine.cloneNode(true);
            call.querySelector('b')?.remove();
        }
        const stats = take
            ? [...take.querySelectorAll('dl.stats > div')].map((d) => ({
                  value: d.querySelector('dd')?.cloneNode(true) ?? null,
                  label: d.querySelector('dt')?.textContent.trim() ?? '',
              }))
            : [];
        const a = take?.querySelector('.links a[href]');
        return {
            n: i + 1,
            id,
            role: (b.dataset.role || '').trim(),
            tool: b.dataset.tool || '',
            tint: b.dataset.tint || '#8a99aa',
            scene: b.dataset.scene || id,
            date: b.dataset.date || (b.dataset.kind || '').toUpperCase(),
            kind: b.dataset.kind || '',
            what: what ? what.cloneNode(true) : null,
            call,
            stats,
            link: a ? { href: a.getAttribute('href'), text: a.textContent.trim() } : null,
        };
    });
}

/** Fill every [data-fig] under root from a figures map. Missing keys get a dash. Returns the keys that were missing. */
export function fillFigures(root, figures) {
    const missing = [];
    // The root counts too: a stat's <dd data-fig> is often the node being filled.
    const self = root.nodeType === 1 && root.matches('[data-fig]') ? [root] : [];
    for (const el of [...self, ...root.querySelectorAll('[data-fig]')]) {
        const key = el.dataset.fig;
        const v = figures && figures[key];
        if (v === undefined || v === null || v === '') {
            el.textContent = DASH;
            missing.push(key);
        } else {
            el.textContent = String(v);
        }
    }
    return missing;
}

/** Plain text of a slate node after figures are filled (for 3D screen textures). */
export function textOf(node, figures) {
    if (!node) return '';
    const c = node.cloneNode(true);
    fillFigures(c, figures);
    return c.textContent.replace(/\s+/g, ' ').trim();
}

/** A figure with a dash for anything figures.json does not carry. */
export function fig(figures, key) {
    const v = figures && figures[key];
    return v === undefined || v === null || v === '' ? DASH : String(v);
}

/**
 * The "as of" line every number on the set carries. Toronto time, plus the age
 * once it is older than a day and a half (the daily job runs at 09:40 ET).
 */
export function asOfLabel(generatedAt, now = new Date()) {
    const t = new Date(generatedAt);
    if (!generatedAt || Number.isNaN(t.getTime())) return 'figures unavailable';
    const when = t.toLocaleString('en-US', {
        timeZone: 'America/Toronto',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
    const hours = (now - t) / 36e5;
    if (hours > 36) return `as of ${when} ET · ${Math.floor(hours / 24)} days old`;
    return `as of ${when} ET`;
}

/** Hour in Toronto, 0-23. The set runs a night shift from 20:00 to 06:00. */
export function torontoHour(now = new Date()) {
    const h = Number(now.toLocaleString('en-US', { timeZone: 'America/Toronto', hour: 'numeric', hourCycle: 'h23' }));
    return Number.isFinite(h) ? h % 24 : now.getHours();
}
export const isNightShift = (h) => h >= 20 || h < 6;

/** The three cleared gates on the back flat. Every number is a figures.json key. */
export const GATES = [
    { id: 'g-fcp', title: 'fcp-mcp-server', big: 'installs', sub: 'PyPI installs, last 30 days', foot: (f) => `${fig(f, 'stars')} stars · v${fig(f, 'pypiVersion')}`, link: 'https://github.com/DareDev256/fcp-mcp-server' },
    { id: 'g-wiki', title: 'RawBOT · Nin Online', big: 'wikiEdits', sub: 'wiki edits, unattended', foot: (f) => `${fig(f, 'wikiReverted')} reverted of the last ${fig(f, 'wikiRevertSample')}`, link: '/fandom-flow' },
    { id: 'g-bib', title: 'Bodies In Boxes', big: 'bibPlayers', sub: 'players', foot: (f) => `${fig(f, 'bibRuns')} runs · v${fig(f, 'bibVersion')}`, link: 'https://savv4x.com/play?ref=portfolio' },
];
