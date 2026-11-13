/* terminal.js: the terminal inside the studio computer (4.65.0).
 *
 * Pure: run(line) returns { html, action } and touches no DOM, so the suite can
 * drive every command. Output is HTML, so everything a visitor typed is escaped
 * before it is echoed back.
 */
import { fig, GATES } from './slates.js';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const link = (href, text = href.replace(/^https?:\/\//, '')) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>`;

export const LINKS = [
    ['Passion OS', '/os'],
    ['The Monitor', '/monitor'],
    ['Passion', 'https://passion.jamesdare.com'],
    ['GitHub', 'https://github.com/DareDev256'],
    ['fcp-mcp-server', 'https://github.com/DareDev256/fcp-mcp-server'],
    ['S-Tier Solutions', 'https://stiersolutions.ca'],
    ['tdotssolutionsz', 'https://tdotssolutionsz.com'],
];
export const OPEN = { os: '/os?from=studio', passion: 'https://passion.jamesdare.com', github: 'https://github.com/DareDev256', monitor: '/monitor' };
export const COMMANDS = ['help', 'ls', 'cat', 'crew', 'gates', 'neofetch', 'whoami', 'date', 'open', 'clear', 'history', 'exit', 'sudo'];
export const FILES = ['about.txt', 'links.txt', 'call-sheet.txt'];

/**
 * @param {{ crew: () => Array<{role:string, scene:string, tint:string}>, figures: () => object, asOf: () => string, now?: () => Date }} ctx
 */
export function createTerminal(ctx) {
    const history = [];
    const now = ctx.now || (() => new Date());
    const files = {
        'about.txt': () => 'James. AI Solutions Engineer and Creative Technologist, Toronto.\nA decade directing music video: Masicka, Casper TNG, King Louie, Street Bud.\nEvery web client came from the films. Now the crew is agents.',
        'links.txt': () => LINKS.map(([n, u]) => `${n.padEnd(17)} ${link(u, u === '/' ? 'jamesdare.com' : u.startsWith('/') ? `jamesdare.com${u}` : undefined)}`).join('\n'),
        'call-sheet.txt': () => `CALL SHEET\nBooking, the form, chat and email live on the Monitor, under Call:\n${link('/#call', 'jamesdare.com › Call')}`,
    };

    function run(raw) {
        const line = String(raw ?? '');
        const echo = `<span class="g">visitor@the-studio ~ $</span> ${esc(line)}`;
        if (line.trim()) history.push(line.trim());
        const [cmd = '', ...args] = line.trim().split(/\s+/);
        const arg = args.join(' ');
        const f = ctx.figures() || {};
        const out = (html, action) => ({ html: `${echo}\n${html}`, action });
        switch (cmd) {
            case '':
                return { html: echo };
            case 'help':
                return out('help ls cat crew gates neofetch whoami date open clear history exit\n<span class="m">try: cat about.txt · crew · open os · sudo hire james</span>');
            case 'ls':
                return out(FILES.concat(['crew/', 'gates/']).join('   '));
            case 'cat': {
                if (!arg) return out('cat: name a file. Try <span class="g">cat about.txt</span>');
                const file = files[arg];
                if (!file) return out(`cat: ${esc(arg)}: no such file. <span class="m">ls lists them.</span>`);
                return out(file());
            }
            case 'crew': {
                const crew = ctx.crew();
                if (!crew.length) return out('crew: the call sheet did not load. <span class="m">The Monitor has every source:</span> ' + link('/monitor', 'jamesdare.com/monitor'));
                return out(crew.map((c, i) => `${String(i + 1).padStart(2, '0')}  <span style="color:${esc(c.tint)}">${esc(c.role.padEnd(13))}</span> ${esc(c.scene)}`).join('\n'));
            }
            case 'gates':
                return out(GATES.map((g) => `<span class="k">${esc(fig(f, g.big).padStart(7))}</span>  ${esc(g.title)}, ${esc(g.sub)}`).join('\n') + `\n<span class="m">${esc(ctx.asOf())}</span>`);
            case 'neofetch':
                return out(
                    [
                        ['OS', `Passion OS ${fig(f, 'siteVersion')}`],
                        ['Agent', `Passion ${fig(f, 'passionVersion')}`],
                        ['Repos', fig(f, 'repos')],
                        ['Jobs', `${fig(f, 'jobs')} scheduled`],
                        ['Sites', `${fig(f, 'clientSitesUp')}/${fig(f, 'clientSites')} answering`],
                        ['fcp-mcp', `${fig(f, 'stars')} stars, ${fig(f, 'installs')} installs/30d`],
                    ]
                        .map(([k, v], i) => `<span class="g">${['   .-""-.  ', '  / ∞  ∞ \\ ', '  |  __  | ', '   \\____/  ', '    |  |   ', '           '][i]}</span>  <span class="k">${k.padEnd(8)}</span>${esc(v)}`)
                        .join('\n') + `\n<span class="m">${esc(ctx.asOf())}</span>`
                );
            case 'whoami':
                return out('visitor. The director is James.');
            case 'date':
                return out(esc(now().toString()));
            case 'open': {
                const to = OPEN[arg];
                if (!to) return out('open: os · passion · github · monitor');
                return out(`opening ${link(to, to.startsWith('/') ? `jamesdare.com${to.split('?')[0]}` : undefined)} <span class="m">(tap it)</span>`, { type: 'open', href: to });
            }
            case 'sudo':
                if (/^hire\s+james$/i.test(arg)) return out(files['call-sheet.txt']());
                return out('sudo: this incident will be reported to the 1st AD.');
            case 'history':
                return out(history.map((h, i) => `${String(i + 1).padStart(3)}  ${esc(h)}`).join('\n'));
            case 'clear':
                return { html: '', action: { type: 'clear' } };
            case 'exit':
                return out('leaving the computer', { type: 'exit' });
            default:
                return out(`${esc(cmd)}: command not found. <span class="m">help lists what works.</span>`);
        }
    }

    /** Tab completion: returns { value, options }. */
    function complete(value) {
        const parts = String(value).split(' ');
        const last = parts[parts.length - 1];
        const pool = parts.length > 1 ? (parts[0] === 'open' ? Object.keys(OPEN) : FILES) : COMMANDS;
        const m = pool.filter((x) => x.startsWith(last));
        if (m.length === 1) {
            parts[parts.length - 1] = m[0];
            return { value: parts.join(' ') + (parts.length === 1 ? ' ' : ''), options: [] };
        }
        return { value, options: m };
    }

    return { run, complete, history };
}
