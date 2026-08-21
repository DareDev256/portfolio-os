/* Output guard for /api/chat.
 *
 * A system prompt is a REQUEST, not a control. Everything in this file runs
 * after the model, so it holds whether or not the model was talked out of its
 * instructions. That is the whole point: these are the failures that attach to
 * James's name in a screenshot, and a prompt alone cannot prevent them.
 *
 * Deliberately small and deterministic. No cleverness, no second model call —
 * anything that needs judgement belongs in the prompt, and anything that must
 * not happen belongs here.
 */

const FALLBACK =
    'That one is worth a real conversation rather than a guess from me. Email dev@jamesdare.com and James will answer it himself.';

// Links the window is allowed to emit. Anything else is either a hallucination
// or something a visitor talked it into, and both are worse than no link.
const ALLOWED_HOSTS = [
    'jamesdare.com',
    'tdotssolutionsz.com',
    'betmetrics.ca',
    'github.com',
    'pypi.org',
    'calendly.com',
    'second-opinion-eta.vercel.app',
    'officialstreetbud.com',
    'officialkmoney.com',
    '100bandplan.com',
];

const RULES = [
    {
        id: 'money',
        // Any currency figure at all. James's rate is a conversation, and a
        // number invented here becomes an anchor he has to argue down later.
        test: (t) => /\$\s?\d|\b\d[\d,.]*\s?(usd|cad|dollars|euros?|gbp)\b/i.test(t),
    },
    {
        id: 'rate-claim',
        // A pay word sitting near a number, even without a currency symbol.
        test: (t) =>
            /\b(salary|rate|retainer|per hour|hourly|day rate|per day|annually|per year|\/hr|\/yr)\b/i.test(t) &&
            /\d/.test(t),
    },
    {
        id: 'impersonation',
        // The window is the interface. The moment it speaks AS James, anything
        // it says becomes something James said.
        test: (t) => /\b(i am|i'm|this is)\s+james\b/i.test(t),
    },
    {
        id: 'commitment',
        // Availability and delivery promises are his to make, not this thing's.
        test: (t) =>
            /\b(i|we|he|james)\s+(can|will|could)\s+(start|deliver|have it|finish|build it|ship it)\b/i.test(t) &&
            /\b(by|within|before|in)\s+\w+/i.test(t),
    },
];

function hostOf(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

/** Strip any URL that is not on the allowlist. Returns the cleaned text. */
export function stripForeignLinks(text) {
    return text.replace(/https?:\/\/[^\s)\]]+/gi, (match) => {
        const host = hostOf(match);
        if (!host) return '';
        const ok = ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
        return ok ? match : '';
    });
}

/**
 * @returns {{ text: string, blocked: string|null }}
 *   `blocked` is the rule id when the reply was replaced, else null.
 */
export function guardReply(raw) {
    const text = String(raw || '').trim();
    if (!text) return { text: FALLBACK, blocked: 'empty' };

    for (const rule of RULES) {
        if (rule.test(text)) return { text: FALLBACK, blocked: rule.id };
    }

    let cleaned = stripForeignLinks(text).replace(/[ \t]{2,}/g, ' ').trim();

    // A three-sentence brief that came back as an essay means the prompt lost.
    // Trim rather than block — the content passed every rule above.
    if (cleaned.length > 700) {
        const cut = cleaned.slice(0, 700);
        const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
        cleaned = (lastStop > 200 ? cut.slice(0, lastStop + 1) : cut).trim();
    }

    return { text: cleaned || FALLBACK, blocked: null };
}

export const GUARD_FALLBACK = FALLBACK;
