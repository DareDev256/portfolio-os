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
    contact: 'Hi James — ',
    footer: 'Hi James — ',
};
const DEFAULT_OPENER = 'Hi James — ';

/* WhatsApp truncates a long body silently on some Android builds. Ported from
 * the same rail on shairbraiding.com, where it was found the hard way. */
const MAX_BODY = 900;

/* The SITE names itself, rather than carrying a hardcoded string.
 * `jamesdare.com` is reached on two hosts (apex and www) and the page is also
 * served from a preview URL and from localhost during a build. A hardcoded name
 * is wrong on three of those four and cannot tell him which one produced the
 * message. Derived from location, so it stays true wherever this is served. */
function siteName(loc) {
    const h = (loc && loc.hostname) || '';
    return h.replace(/^www\./, '') || 'your site';
}

/* Which case study they were reading when they tapped.
 *
 * This is the one thing shairbraiding's rail does that ours did not: her message
 * arrives already carrying the style, length and area the visitor picked, so she
 * can quote without a round trip. The equivalent on a hiring surface is not a
 * price — it is CONTEXT. A recruiter who read the BetMetrics gate and a client
 * who read Client sites want opposite conversations, and the difference is worth
 * more to James than anything the visitor would bother typing.
 *
 * Read from the DOM at click time, never cached at load: the gate rail advances
 * on its own and a value captured at load is stale by the time anyone taps. */
function activeGate(doc) {
    const tab = doc && doc.querySelector('.gate-tab.on .nm');
    const name = tab && tab.textContent.trim();
    return name || null;
}

export function buildMessage(surface, doc = typeof document !== 'undefined' ? document : null,
    loc = typeof location !== 'undefined' ? location : null) {
    const parts = [OPENERS[surface] || DEFAULT_OPENER];
    parts.push(`I found you on ${siteName(loc)}`);

    const gate = activeGate(doc);
    // The closing has to read correctly in BOTH branches. "Wanted to ask about
    // it" refers to nothing when the visitor tapped the footer without opening a
    // case study, which is the most common way this gets sent.
    parts.push(gate ? `, reading ${gate}. ` : '. ');

    const body = parts.join('');
    return body.length > MAX_BODY ? `${body.slice(0, MAX_BODY - 3)}...` : body;
}

export function waHref(surface, doc, loc) {
    return `${WA_BASE}?text=${encodeURIComponent(buildMessage(surface, doc, loc))}`;
}

export function initWhatsAppRail(doc = document) {
    const links = Array.prototype.slice.call(doc.querySelectorAll('[data-wa]'));
    if (!links.length) return links;

    links.forEach((a) => {
        const surface = a.getAttribute('data-wa');

        /* Upgrade the baked href with the prefill. The un-upgraded href in the
         * HTML is already correct and already opens a chat — this only adds the
         * opening line. Ordered this way so a failure here degrades to a working
         * link rather than to no link. */
        a.href = waHref(surface, doc);

        /* And rebuild it on the way out. The gate rail advances while the
         * visitor reads, so an href written once at load names whichever case
         * study happened to be on screen when the page booted — which is
         * reliably the WRONG one by the time anyone taps. pointerdown and
         * keydown both fire before navigation. */
        const refresh = () => { a.href = waHref(surface, doc); };
        a.addEventListener('pointerdown', refresh);
        a.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') refresh(); });
        a.addEventListener('focus', refresh);

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
