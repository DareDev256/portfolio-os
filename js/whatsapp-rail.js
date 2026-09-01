/* WhatsApp rail — username-based, no phone number published.
 *
 * Ported from hair-braider-site (site/assets/app.js), with the one change that
 * makes it usable on a hiring surface: it addresses a USERNAME, not a number.
 * The braider's rail exists to take a booking from a market that lives in
 * WhatsApp; this one exists because a recruiter reading on a phone will tap a
 * chat before they will compose an email, and James is not publishing his
 * mobile number to do it.
 *
 * WHY A USERNAME LINK IS SAFE TO SHIP (measured 2026-09-01, not assumed):
 *   curl https://wa.me/@JamesOD6   -> 302
 *     Location: https://api.whatsapp.com/send/?text&username=JamesOD6
 *               &type=username&app_absent=0
 *   curl https://wa.me/16478037784 -> 302  ...&phone=…&type=phone_number
 * So wa.me classifies an @handle as type=username server-side. The format is
 * live; this is not a guess at a scheme that "should" exist.
 *
 * WHAT THAT TEST CANNOT TELL YOU, and nothing here should pretend otherwise:
 * a handle that does not exist redirects IDENTICALLY. wa.me/@zzzznotarealhandle999
 * returns the same 302 and the same 225KB landing page, differing only in the
 * echoed handle and a per-request nonce. The redirector classifies, it does not
 * validate. Whether @JamesOD6 resolves to James's account can only be proven by
 * opening the link on a phone with WhatsApp installed. See the note in
 * CHANGELOG.md — that is his one-tap check, and it is the last gate on this.
 *
 * Also worth carrying: username *messaging* is a phased rollout through 2026.
 * Reserving a handle is not the same as the handle being routable in every
 * country yet. That is precisely why the fallback below is not optional
 * decoration — for some visitor, on some build, this link will not hand off,
 * and a dead tap on the contact section is worse than no button at all.
 */

/* THE ONLY PLACE THIS HANDLE IS WRITTEN IN JAVASCRIPT.
 * index.html carries it once more, in the href, so the rail still works with
 * scripting off. Those two are held together by tests/whatsapp-rail.test.js,
 * which fails if they ever disagree. That test is not ceremony: the last
 * hand-maintained figure on this page said "twelve client sites" over a list of
 * eleven, at four call sites, and the only wrong number on the page was the only
 * one a human was keeping in sync. */
export const WA_USERNAME = 'JamesOD6';
export const WA_BASE = `https://wa.me/@${WA_USERNAME}`;

/* One opener per surface. A recruiter tapping from the contact section and a
 * visitor tapping from the footer are not asking the same thing, and a prefill
 * that assumes wrong reads worse than an empty box.
 *
 * These stay short on purpose. WhatsApp drops the visitor INTO a composer with
 * this text already typed, and a paragraph they have to delete before writing is
 * friction, not helpfulness. The point is to remove the blank-page pause, not to
 * write their message for them. */
const OPENERS = {
    contact: 'Hi James — saw jamesdare.com. ',
    footer: 'Hi James — ',
};
const DEFAULT_OPENER = 'Hi James — ';

export function waHref(surface) {
    const text = OPENERS[surface] || DEFAULT_OPENER;
    return `${WA_BASE}?text=${encodeURIComponent(text)}`;
}

export function initWhatsAppRail(doc = document) {
    const links = Array.prototype.slice.call(doc.querySelectorAll('[data-wa]'));
    if (!links.length) return links;

    links.forEach((a) => {
        /* Upgrade the baked href with the prefill. The un-upgraded href in the
         * HTML is already correct and already opens a chat — this only adds the
         * opening line. Ordered this way so a failure here degrades to a working
         * link rather than to no link. */
        a.href = waHref(a.getAttribute('data-wa'));

        /* The handoff fails silently in a good number of in-app browsers —
         * LinkedIn's and Instagram's especially, which is exactly where a
         * recruiter arrives from. There is no error to catch: the tap simply
         * does nothing and the visitor concludes the site is broken.
         *
         * document.hidden is the tell. If we left the page the browser
         * backgrounded us and there is nothing to do; if we are still visible
         * 1.4s later the handoff did not happen, so surface the handle as text
         * the visitor can act on by hand. Never a dead end. */
        a.addEventListener('click', () => {
            setTimeout(() => {
                if (doc.hidden) return;
                const note = doc.querySelector('[data-wa-note]');
                if (note) {
                    note.textContent = `If WhatsApp did not open, message @${WA_USERNAME} — search it under New Chat.`;
                    note.hidden = false;
                }
            }, 1400);
        });
    });

    return links;
}

if (typeof document !== 'undefined') initWhatsAppRail();
