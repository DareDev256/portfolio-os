/* One limiter, shared by every route that spends money.
 *
 * This started life inline in chat.js. The moment a second paid endpoint
 * existed (/api/draft), keeping it there would have handed an attacker twice
 * the budget for free — alternate the two endpoints and each gets its own
 * allowance. Shared module state means the per-IP count, the concurrency slot
 * and the daily ceiling are one pool across both doors.
 *
 * Still in-memory, so still per-instance: the real ceiling is roughly
 * LIMIT x live instances, and a cold start resets counters. That reliably stops
 * one IP hammering, runaway concurrency, and a single instance grinding all day.
 * It is NOT a hard cross-instance wall — that needs Upstash or KV.
 *
 * The account's $25/month cap in the Anthropic console, auto-reload OFF, is the
 * real backstop under all of it.
 */

export const PER_IP_MAX = Number(process.env.RL_PER_IP_MAX || 10);
const PER_IP_WINDOW_MS = Number(process.env.RL_WINDOW_MS || 6 * 60 * 60 * 1000);
const MAX_CONCURRENT = Number(process.env.RL_MAX_CONCURRENT || 3);
const DAILY_MAX = Number(process.env.RL_DAILY_MAX || 400);

const buckets = new Map();
let concurrent = 0;
let day = new Date().getUTCDate();
let dayCount = 0;

/* Fails safe: no forwarded-for header means everyone shares one bucket, which
 * throttles rather than bypasses. The reverse — a per-request unique id — would
 * hand an attacker a fresh allowance on every call. */
export function clientIp(req) {
    const fwd = req.headers['x-forwarded-for'];
    if (!fwd) return 'unknown';
    return String(fwd).split(',')[0].trim() || 'unknown';
}

export function used(ip) {
    return buckets.get(ip)?.count ?? 0;
}

export function checkAndReserve(ip) {
    const now = Date.now();

    const today = new Date().getUTCDate();
    if (today !== day) {
        day = today;
        dayCount = 0;
    }
    if (dayCount >= DAILY_MAX) {
        return { ok: false, status: 429, reason: 'Daily limit reached. Try tomorrow, or just email me — dev@jamesdare.com.' };
    }
    if (concurrent >= MAX_CONCURRENT) {
        return { ok: false, status: 429, retryAfter: 5, reason: 'Busy right now. Give it a few seconds.' };
    }

    const bucket = buckets.get(ip);
    if (!bucket || now - bucket.start > PER_IP_WINDOW_MS) {
        buckets.set(ip, { start: now, count: 1 });
    } else {
        if (bucket.count >= PER_IP_MAX) {
            return {
                ok: false,
                status: 429,
                retryAfter: Math.ceil((bucket.start + PER_IP_WINDOW_MS - now) / 1000),
                reason: `That is ${PER_IP_MAX} questions — the demo's limit. Email dev@jamesdare.com and you get the real thing, which is me.`,
            };
        }
        bucket.count += 1;
    }

    if (buckets.size > 5000) {
        for (const [key, value] of buckets) {
            if (now - value.start > PER_IP_WINDOW_MS) buckets.delete(key);
        }
    }

    concurrent += 1;
    dayCount += 1;
    return { ok: true };
}

export function release() {
    concurrent = Math.max(0, concurrent - 1);
}
