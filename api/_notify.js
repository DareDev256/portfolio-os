/* One Discord ping helper for the booking + voice-agent routes. Posts to James's #inbox channel
 * (env BOOKING_DISCORD_WEBHOOK). Never throws and never takes longer than 4 s: a notification
 * failing must not fail the booking it reports. */
export async function notify(content) {
    const url = process.env.BOOKING_DISCORD_WEBHOOK;
    if (!url) { console.error('notify: BOOKING_DISCORD_WEBHOOK not set'); return false; }
    try {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000);
        const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: content.slice(0, 1900), allowed_mentions: { parse: [] } }), signal: ctl.signal });
        clearTimeout(t);
        return r.ok;
    } catch (e) { console.error('notify', e.message); return false; }
}

export function whenToronto(iso) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}
