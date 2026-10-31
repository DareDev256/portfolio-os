/* crew.js: the agents on the switcher (4.64.0).
 *
 * Every source on the monitor is a crew member with a real job on a film set:
 * the Editor drives Final Cut, the 1st AD runs the schedule, the Script
 * Supervisor keeps the wiki. Each button carries data-tool and data-tint; this
 * file draws a small pixel agent holding that tool. The art is hand-placed
 * pixels on purpose: no generated imagery, and it scales crisp at any size.
 *
 * The agent body is 12x13; the tool is 7x7, held at its right hand. Pixels are
 * 1x1 rects in an SVG with crispEdges, so the sprite stays sharp when scaled.
 */

const BODY = [
    '.....a......',
    '...hhhhhh...',
    '..hhhhhhhh..',
    '..hvvvvvvh..',
    '..hvevvevh..',
    '..hhhhhhhh..',
    '....hhhh....',
    '..bbbbbbbb..',
    '.bbbbbbbbbb.',
    '.b.bbbbbb.b.',
    '.b.bbbbbb.b.',
    '...bb..bb...',
    '...bb..bb...',
];

export const TOOLS = {
    bag: ['..q.q..', '...q...', '..ppp..', '.ppqpp.', 'pppqppp', 'ppqqqpp', '.ppppp.'],
    scissors: ['p.....p', '.p...p.', '..p.p..', '...p...', '..q.q..', '.q...q.', '.qq.qq.'],
    cross: ['..ppp..', '..ppp..', 'ppppppp', 'ppppppp', 'ppppppp', '..ppp..', '..ppp..'],
    megaphone: ['......p', '....ppp', 'qqppppp', 'qqppppp', '....ppp', '......p', '.......'],
    hammer: ['qqqq...', 'qqqq...', '.p.....', '.p.....', '.p.....', '.p.....', '.p.....'],
    camera: ['.......', '.qq....', 'ppppppq', 'pp.pppq', 'p.q.ppq', 'ppppppq', '.......'],
    brush: ['....qq.', '...qq..', '..pp...', '..p....', '.p.....', 'p......', '.......'],
    pad: ['.......', '.ppppp.', 'pqpppqp', 'qqqpqpp', 'pqpppqp', 'pp...pp', '.......'],
    sword: ['......p', '.....p.', '....p..', '...p...', 'q.p....', '.q.....', 'q.q....'],
    book: ['.......', 'ppp.ppp', 'pqp.pqp', 'ppp.ppp', 'pqpppqp', 'ppppppp', '.......'],
    clipboard: ['..qqq..', '.ppppp.', '.p...p.', '.p.q.p.', '.p...p.', '.p.q.p.', '.ppppp.'],
    car: ['.......', '..ppp..', '.pqqqp.', 'ppppppp', 'ppppppp', '.q...q.', '.......'],
    pencil: ['......q', '.....pq', '....pp.', '...pp..', '..pp...', '.qp....', 'q......'],
    dumbbell: ['.......', 'q.....q', 'qq...qq', 'qpppppq', 'qq...qq', 'q.....q', '.......'],
    monitor: ['ppppppp', 'pqqqqqp', 'pqqqqqp', 'pqqqqqp', 'ppppppp', '...p...', '..ppp..'],
    folder: ['.......', 'qqq....', 'ppppppp', 'p.....p', 'p.....p', 'ppppppp', '.......'],
};

const NS = 'http://www.w3.org/2000/svg';

function paint(doc, g, map, ox, oy, palette) {
    map.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            const fill = palette[row[x]];
            if (!fill) continue;
            const r = doc.createElementNS(NS, 'rect');
            r.setAttribute('x', String(x + ox));
            r.setAttribute('y', String(y + oy));
            r.setAttribute('width', '1');
            r.setAttribute('height', '1');
            r.setAttribute('fill', fill);
            g.appendChild(r);
        }
    });
}

/* One agent holding `tool`, its suit in `tint`. `phase` offsets the idle bob
 * so a row of agents never breathes in unison. Returns null for an unknown tool
 * so a typo shows up as a missing sprite rather than a wrong one. */
export function sprite(doc, tool, tint, phase = 0) {
    const map = TOOLS[tool];
    if (!map || !/^#[0-9a-f]{6}$/i.test(tint || '')) return null;
    const svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'sprite');
    svg.setAttribute('viewBox', '0 0 19 13');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.style.setProperty('--d', `${(-(phase * 0.17) % 1.2).toFixed(2)}s`);
    const body = doc.createElementNS(NS, 'g');
    body.setAttribute('class', 'bod');
    paint(doc, body, BODY, 0, 0, { a: '#6fd3ff', h: '#d9f2ff', v: '#0b1726', e: '#6fd3ff', b: tint });
    const prop = doc.createElementNS(NS, 'g');
    prop.setAttribute('class', 'prop');
    paint(doc, prop, map, 11, 5, { p: tint, q: '#d9f2ff' });
    svg.append(body, prop);
    return svg;
}

/* Draw every crew member on the switcher. Idempotent: a button that already
 * has its agent is left alone. */
export function drawCrew(doc = document) {
    let n = 0;
    doc.querySelectorAll('.src[data-tool]').forEach((b, i) => {
        if (b.querySelector('.sprite')) return;
        const s = sprite(doc, b.dataset.tool, b.dataset.tint, i);
        if (!s) return;
        const role = b.querySelector('.role');
        b.insertBefore(s, role || null);
        n += 1;
    });
    return n;
}
