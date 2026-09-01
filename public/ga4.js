// Google Analytics 4 — jamesdare.com (G-TG10CNCMJY)
// External file rather than an inline <script> so the site's
// Content-Security-Policy does not need 'unsafe-inline' for scripts.
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-TG10CNCMJY');

/* ── Intent events ────────────────────────────────────────────────────────
 * Added 2026-08-30. Before this the property recorded PAGEVIEWS ONLY, so the
 * question "has anyone ever used the chat widget" had no answer anywhere —
 * api/chat.js logs nothing and its rate limiter is in-memory and resets on
 * every cold start. Pageviews say people arrived; nothing said whether the page
 * did its job.
 *
 * Delegated from `document`, so nothing here needs the app's modules to have
 * loaded and no other file has to be touched. Every listener is passive and
 * wrapped — analytics must never be able to break a click.
 *
 * NOT tracked, deliberately: the text a visitor types. The widget promises
 * "nothing you type is stored on this site" and that promise is kept here. Only
 * that a message was sent, and its length bucket.
 */
(function () {
    var sent = function (name, params) {
        try { gtag('event', name, params || {}); } catch (_e) { /* never break the page */ }
    };
    var seen = {};
    var once = function (key) { if (seen[key]) return false; seen[key] = 1; return true; };

    document.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a,button') : null;
        if (!a) return;
        var href = (a.getAttribute && a.getAttribute('href')) || '';
        var label = (a.textContent || '').trim().slice(0, 60);

        if (/^mailto:/i.test(href)) return sent('contact_email', { label: label });
        if (/calendly\.com/i.test(href)) return sent('contact_booking', { label: label });
        // Before the generic outbound branch, or the rail's taps land in
        // outbound_click and become indistinguishable from a link to betmetrics.
        if (/wa\.me|api\.whatsapp\.com/i.test(href)) {
            return sent('contact_whatsapp', { surface: a.getAttribute('data-wa') || 'other' });
        }
        if (/\.pdf($|\?)/i.test(href) || /resume/i.test(label)) return sent('resume_download', { label: label });
        if (/linkedin\.com/i.test(href)) return sent('outbound_linkedin', { label: label });
        if (/github\.com/i.test(href)) return sent('outbound_github', { label: label, url: href });
        if (/^https?:/i.test(href) && href.indexOf('jamesdare.com') === -1) {
            return sent('outbound_click', { label: label, url: href });
        }
        // Case-study tabs: which work actually gets opened.
        if (a.closest('[class*="gate"]') && label) sent('gate_open', { label: label });
        // Chat suggestion chips and SEND.
        if (a.closest('[class*="ask"], [id*="chat"], [class*="chat"]')) {
            if (/^send$/i.test(label)) sent('chat_message_sent', {});
            else if (label) sent('chat_suggestion', { label: label });
        }
    }, { passive: true, capture: true });

    // A typed message submitted with Return never passes through a click.
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var t = e.target;
        if (!t || t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return;
        if (!t.closest || !t.closest('[class*="ask"], [id*="chat"], [class*="chat"]')) return;
        var n = (t.value || '').length;
        sent('chat_message_sent', { length_bucket: n < 40 ? 'short' : n < 140 ? 'medium' : 'long' });
    }, { passive: true, capture: true });

    /* Scroll depth. The page has long reveal-driven sections; without this there
     * is no way to tell "they read the case studies" from "they bounced at the
     * hero", which is exactly the question a portfolio needs answered. */
    var marks = [25, 50, 75, 90];
    window.addEventListener('scroll', function () {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        if (max < 400) return;
        var pct = Math.round((h.scrollTop / max) * 100);
        for (var i = 0; i < marks.length; i++) {
            if (pct >= marks[i] && once('d' + marks[i])) sent('scroll_depth', { percent: marks[i] });
        }
    }, { passive: true });

    /* Did the visitor reach the contact section at all? */
    if ('IntersectionObserver' in window) {
        document.addEventListener('DOMContentLoaded', function () {
            var el = document.getElementById('contact');
            if (!el) return;
            new IntersectionObserver(function (rows, obs) {
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].isIntersecting && once('contact')) { sent('contact_section_viewed', {}); obs.disconnect(); }
                }
            }, { threshold: 0.3 }).observe(el);
        });
    }
})();
