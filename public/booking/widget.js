/* Talk-to-me block: book a free 15-minute intro call, or message on WhatsApp.
 *
 * Drop-in for any page:  <div data-book-intro data-site="tdots" data-theme="dark"></div>
 *                        <script src="https://jamesdare.com/booking/widget.js" defer></script>
 * data-site: "jamesdare" (default) | "tdots"  · data-theme: "light" (default) | "dark"
 *
 * Times come live from /api/slots (James's real calendar, busy-only). If the calendar cannot be read
 * the block says so and offers WhatsApp instead; it never shows a time it has not just confirmed.
 */
(() => {
    // Same origin on jamesdare.com (apex redirects to www, and a redirected POST loses CORS); absolute elsewhere.
    const API = /(^|\.)jamesdare\.com$/.test(location.hostname) ? '/api' : 'https://www.jamesdare.com/api';
    const WA = 'https://wa.me/14165286149?text=';
    const TZ = 'America/Toronto';
    const COPY = {
        jamesdare: { h: 'Talk to James', sub: 'A free 15-minute intro call: a role, a collaboration, or an AI build.', wa: 'Hi James, I found you on jamesdare.com.' },
        tdots: { h: 'Book a free 15-min call', sub: 'Tell me about your business. Website, video, or an AI tool. No pitch deck needed.', wa: 'Hi James, I want a site. My Instagram is @' },
    };
    const css = `
.bk{--bg:#fff;--fg:#0a0a0a;--mute:#5c5c5c;--line:#e4e4e4;--acc:#e8401c;--chip:#f3f3f3;font:15px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;color:var(--fg);background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:22px;width:100%;max-width:640px;min-width:0;margin:0 auto;box-sizing:border-box;overflow:hidden}
.bk[data-theme=dark]{--bg:#0b0b0b;--fg:#f5f5f5;--mute:#a3a3a3;--line:#262626;--chip:#171717}
.bk *{box-sizing:border-box;min-width:0}.bk h3{margin:0 0 4px;font-size:22px;letter-spacing:-.01em}.bk p{margin:0 0 16px;color:var(--mute)}
.bk .days{min-width:0;display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:12px}
.bk button{font:inherit;cursor:pointer;border-radius:10px;border:1px solid var(--line);background:var(--chip);color:var(--fg);padding:9px 12px;min-height:40px}
.bk button[aria-pressed=true]{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.bk .days button{flex:0 0 auto;white-space:nowrap}.bk .times{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;margin-bottom:14px}
.bk form{display:grid;gap:10px}.bk input,.bk textarea{font:inherit;width:100%;padding:11px 12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--fg)}
.bk .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}.bk .go{background:var(--acc);border-color:var(--acc);color:#fff;font-weight:600;flex:1}
.bk .wa{background:transparent;flex:1;text-decoration:none;color:var(--fg);border:1px solid var(--line);border-radius:10px;padding:9px 12px;text-align:center;min-height:40px;display:inline-flex;align-items:center;justify-content:center}
.bk button:disabled{opacity:.45;cursor:not-allowed}.bk .msg{margin-top:12px;font-weight:500}.bk .hp{position:absolute;left:-9999px;height:0;width:0;opacity:0}
.bk .tz{font-size:12px;color:var(--mute);margin:-6px 0 12px}`;
    const fmtDay = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso));
    const fmtTime = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
    const el = (tag, attrs = {}, ...kids) => {
        const n = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) k === 'on' ? Object.entries(v).forEach(([e, f]) => n.addEventListener(e, f)) : n.setAttribute(k, v);
        for (const c of kids) n.append(c);
        return n;
    };

    async function mount(host) {
        const site = COPY[host.dataset.site] ? host.dataset.site : 'jamesdare';
        const c = COPY[site];
        const box = el('section', { class: 'bk', 'data-theme': host.dataset.theme === 'dark' ? 'dark' : 'light', 'aria-label': c.h });
        const wa = el('a', { class: 'wa', href: WA + encodeURIComponent(c.wa), target: '_blank', rel: 'noopener' }, 'WhatsApp');
        box.append(el('h3', {}, c.h), el('p', {}, c.sub));
        const body = el('div', {}, el('p', {}, 'Loading open times…'));
        box.append(body, el('div', { class: 'row' }, wa));
        host.replaceChildren(box);

        let data;
        try { data = await fetch(`${API}/slots`, { cache: 'no-store' }).then((r) => r.json()); } catch { data = { slots: [] }; }
        body.replaceChildren();
        if (!data.slots?.length) {
            body.append(el('p', {}, data.complete === false ? 'Booking is paused for a moment. WhatsApp reaches James directly.' : 'No open times in the next two weeks. WhatsApp reaches James directly.'));
            return;
        }
        const byDay = new Map();
        for (const s of data.slots) { const d = fmtDay(s); byDay.set(d, [...(byDay.get(d) || []), s]); }
        let picked = null;
        const days = el('div', { class: 'days', role: 'tablist' });
        const times = el('div', { class: 'times' });
        const showDay = (d, btn) => {
            days.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
            times.replaceChildren(...byDay.get(d).map((s) => el('button', { type: 'button', 'aria-pressed': String(s === picked), on: { click: (e) => {
                picked = s; times.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
                go.textContent = `Book ${fmtDay(s)}, ${fmtTime(s)}`; go.disabled = false;
            } } }, fmtTime(s))));
        };
        [...byDay.keys()].forEach((d, i) => { const b = el('button', { type: 'button', 'aria-pressed': 'false', on: { click: () => showDay(d, b) } }, d); days.append(b); if (!i) setTimeout(() => showDay(d, b)); });
        const name = el('input', { name: 'name', placeholder: 'Your name', autocomplete: 'name', required: '' });
        const email = el('input', { name: 'email', type: 'email', placeholder: 'Email (the invite goes here)', autocomplete: 'email', required: '' });
        const note = el('textarea', { name: 'note', rows: '2', placeholder: 'What should James know? (optional)', maxlength: '500' });
        const hp = el('input', { name: 'website', class: 'hp', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true' });
        const go = el('button', { class: 'go', type: 'submit', disabled: '' }, 'Pick a time');
        const msg = el('div', { class: 'msg', role: 'status', 'aria-live': 'polite' });
        const form = el('form', { on: { submit: async (e) => {
            e.preventDefault(); if (!picked) return;
            go.disabled = true; msg.textContent = 'Booking…';
            try {
                const r = await fetch(`${API}/book`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: name.value, email: email.value, note: note.value, website: hp.value, site, start: picked }) });
                const j = await r.json();
                if (j.ok) { form.replaceChildren(el('p', { class: 'msg' }, `Booked: ${fmtDay(picked)}, ${fmtTime(picked)} (Toronto time). The invite with a Meet link is on its way to ${email.value}.`)); days.remove(); times.remove(); return; }
                msg.textContent = j.error || 'Something went wrong. Try WhatsApp.'; go.disabled = false;
            } catch { msg.textContent = 'Could not reach the booking service. Try WhatsApp.'; go.disabled = false; }
        } } }, name, email, note, hp, el('div', { class: 'row' }, go), msg);
        body.append(el('div', { class: 'tz' }, 'Times shown in Toronto time (ET).'), days, times, form);
    }

    const start = () => {
        if (!document.getElementById('bk-css')) document.head.append(el('style', { id: 'bk-css' }, css));
        document.querySelectorAll('[data-book-intro]').forEach(mount);
    };
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
