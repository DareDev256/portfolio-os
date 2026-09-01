/* The WhatsApp rail publishes a username instead of a phone number.
 *
 * The regression this file exists to stop is NOT "does the code run". It is the
 * handle drifting between the JS constant and the href baked into index.html.
 * That href is not a duplicate for convenience — it is what makes the rail work
 * with scripting off — so there are legitimately two copies, and two copies of a
 * hand-maintained string is exactly the shape that shipped "twelve client sites"
 * over a list of eleven.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WA_USERNAME, WA_BASE, waHref, buildMessage, initWhatsAppRail } from '../js/whatsapp-rail.js';

const HTML = readFileSync(resolve(import.meta.dirname, '../index.html'), 'utf8');

describe('whatsapp rail — the published handle', () => {
    it('addresses a username, and no phone number is published anywhere', () => {
        expect(WA_BASE).toBe(`https://wa.me/@${WA_USERNAME}`);
        // A wa.me path of bare digits is a phone number. Publishing one is the
        // thing this rail was parked on for a month; it must never come back.
        const digitLinks = HTML.match(/wa\.me\/\+?\d/g) || [];
        expect(digitLinks).toEqual([]);
    });

    it('every wa.me href in index.html uses the same handle as the module', () => {
        const hrefs = HTML.match(/https:\/\/wa\.me\/[^"'\s>]+/g) || [];
        expect(hrefs.length).toBeGreaterThan(0);
        // Named, not counted — a bare count tells you it broke without telling
        // you which one.
        const wrong = hrefs.filter((h) => h !== WA_BASE);
        expect(wrong).toEqual([]);
    });

    it('each rail anchor still works with no JavaScript at all', () => {
        // The href must be correct as authored, before initWhatsAppRail touches
        // it. A rail that only resolves after a module executes is dead for
        // every visitor whose script never loads.
        const anchors = HTML.match(/<a[^>]*data-wa=[^>]*>/g) || [];
        expect(anchors.length).toBeGreaterThanOrEqual(2);
        anchors.forEach((tag) => expect(tag).toContain(`href="${WA_BASE}"`));
    });

    it('names the site from location rather than a hardcoded string', () => {
        const msg = buildMessage('contact', null, { hostname: 'www.jamesdare.com' });
        expect(msg).toContain('jamesdare.com');
        // www is stripped — he is sent the name of the site, not of the host.
        expect(msg).not.toContain('www.');
        // A preview deploy must name ITSELF, or he cannot tell which surface
        // produced the message, which is the whole reason this is derived.
        expect(buildMessage('contact', null, { hostname: 'portfolio-os-git-x.vercel.app' }))
            .toContain('portfolio-os-git-x.vercel.app');
        // No location at all (SSR, a stripped environment) must not print "undefined".
        expect(buildMessage('contact', null, null)).not.toContain('undefined');
    });

    it('carries the case study the visitor was reading', () => {
        document.body.innerHTML = `
            <button class="gate-tab"><span class="nm">BetMetrics</span></button>
            <button class="gate-tab on"><span class="nm">fcp-mcp-server</span></button>`;
        expect(buildMessage('contact', document, { hostname: 'jamesdare.com' }))
            .toBe('Hi James — I found you on jamesdare.com, reading fcp-mcp-server. ');
    });

    it('reads correctly when no case study is open', () => {
        document.body.innerHTML = '<p>nothing here</p>';
        // The gated branch would trail off into a dangling clause. This is the
        // most common way the footer link gets tapped, so it cannot be the
        // broken one.
        expect(buildMessage('footer', document, { hostname: 'jamesdare.com' }))
            .toBe('Hi James — I found you on jamesdare.com. ');
    });

    it('caps the body — some Android builds truncate silently', () => {
        document.body.innerHTML =
            `<button class="gate-tab on"><span class="nm">${'x'.repeat(2000)}</span></button>`;
        const msg = buildMessage('contact', document, { hostname: 'jamesdare.com' });
        expect(msg.length).toBeLessThanOrEqual(900);
        expect(msg.endsWith('...')).toBe(true);
    });

    it('prefills an opener per surface, url-encoded', () => {
        document.body.innerHTML = '';
        expect(waHref('nope', document, { hostname: 'jamesdare.com' })).not.toContain('undefined');
        expect(waHref('nope', document, { hostname: 'jamesdare.com' })).toContain('Hi%20James');
    });
});

describe('whatsapp rail — behaviour in the page', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <a data-wa="contact" href="${WA_BASE}">WHATSAPP</a>
            <a data-wa="footer" href="${WA_BASE}">WHATSAPP</a>
            <p data-wa-note hidden></p>`;
    });

    it('upgrades each anchor with its own surface prefill', () => {
        initWhatsAppRail(document);
        const c = document.querySelector('[data-wa="contact"]').href;
        expect(c).toContain(encodeURIComponent('Hi James —'));
        expect(c).toContain(WA_USERNAME);
        expect(c).not.toContain('undefined');
    });

    it('rebuilds the href at click time, not once at load', () => {
        // The gate rail advances while the visitor reads. An href written once
        // at load names whichever case study was on screen when the page booted,
        // which is reliably the wrong one by the time anyone taps.
        document.body.innerHTML += '<button class="gate-tab on"><span class="nm">BetMetrics</span></button>';
        initWhatsAppRail(document);
        const a = document.querySelector('[data-wa="contact"]');
        expect(decodeURIComponent(a.href)).toContain('BetMetrics');

        document.querySelector('.gate-tab.on .nm').textContent = 'Second Opinion';
        a.dispatchEvent(new Event('pointerdown'));
        expect(decodeURIComponent(a.href)).toContain('Second Opinion');
        expect(decodeURIComponent(a.href)).not.toContain('BetMetrics');
    });

    it('surfaces the handle as text when the handoff silently fails', () => {
        vi.useFakeTimers();
        initWhatsAppRail(document);
        const note = document.querySelector('[data-wa-note]');
        expect(note.hidden).toBe(true);

        document.querySelector('[data-wa="contact"]').click();
        vi.advanceTimersByTime(1500);

        // Read the rendered state, not just the text — a note that says the
        // right thing at hidden=true is the same as no note. This is the
        // opacity-0 panel that passed two textContent checks.
        expect(note.hidden).toBe(false);
        expect(note.textContent).toContain(`@${WA_USERNAME}`);
        vi.useRealTimers();
    });

    it('stays quiet when the handoff worked and the page was backgrounded', () => {
        vi.useFakeTimers();
        initWhatsAppRail(document);
        const spy = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);

        document.querySelector('[data-wa="contact"]').click();
        vi.advanceTimersByTime(1500);

        expect(document.querySelector('[data-wa-note]').hidden).toBe(true);
        spy.mockRestore();
        vi.useRealTimers();
    });

    it('does nothing and throws nothing on a page with no rail', () => {
        document.body.innerHTML = '<p>no rail here</p>';
        expect(() => initWhatsAppRail(document)).not.toThrow();
        expect(initWhatsAppRail(document)).toEqual([]);
    });
});
