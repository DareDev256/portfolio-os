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
import { WA_USERNAME, WA_BASE, waHref, initWhatsAppRail } from '../js/whatsapp-rail.js';

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

    it('prefills an opener per surface, url-encoded', () => {
        expect(waHref('contact')).toBe(`${WA_BASE}?text=${encodeURIComponent('Hi James — saw jamesdare.com. ')}`);
        // An unknown surface must still produce a usable link, never undefined.
        expect(waHref('nope')).toBe(`${WA_BASE}?text=${encodeURIComponent('Hi James — ')}`);
        expect(waHref('nope')).not.toContain('undefined');
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
        expect(document.querySelector('[data-wa="contact"]').href).toBe(waHref('contact'));
        expect(document.querySelector('[data-wa="footer"]').href).toBe(waHref('footer'));
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
