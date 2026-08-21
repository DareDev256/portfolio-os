/* ASK THE SYSTEM — the contact block, as a guided conversation.
 *
 * The brief was explicit: this has to welcome an HR manager who has never opened
 * a terminal. So the register is the status window, but the BEHAVIOUR is a form.
 * No blinking cursor waiting for a command, no syntax to learn, nothing that
 * fails if you type a sentence. Every path is reachable by tapping.
 *
 * It also does not pretend to be an AI. The replies are written answers to four
 * real questions; free text composes an email to James. A fake chatbot on a
 * hiring page is a worse lie than a plain form, and the whole page's argument
 * rests on nothing here being decorative.
 */

(function () {
    'use strict';

    const root = document.getElementById('system-chat');
    if (!root) return;

    const thread = root.querySelector('[data-chat-thread]');
    const chips = root.querySelector('[data-chat-chips]');
    const form = root.querySelector('[data-chat-form]');
    const input = root.querySelector('[data-chat-input]');
    if (!thread || !chips || !form || !input) return;

    const MAIL = 'dev@jamesdare.com';

    const ANSWERS = [
        {
            q: 'Are you open to work?',
            a: [
                'Yes. AI Solutions Engineer, Solutions Architect, Forward Deployed Engineer. Toronto or remote.',
                'Fourteen years shipping to real audiences, the last three building agent infrastructure. I read every message myself — there is no assistant in front of this.',
            ],
            cta: { label: 'BOOK 30 MINUTES', href: 'https://calendly.com/tdotssolutionsz/30min' },
        },
        {
            q: 'What have you actually shipped?',
            a: [
                'An open-source MCP server for Final Cut Pro — 90 stars, on PyPI, about 1,900 installs a month. A sports-betting analytics product with real money moving through it. Nine client sites live right now.',
                'And 101 music videos across 54 artists, 25,332,774 views. Everything on this page links to the running thing, not a case study about it.',
            ],
            cta: { label: 'SEE THE WORK', href: '#gates' },
        },
        {
            q: 'Can you build something for us?',
            a: [
                'Probably. Web builds and film go through TdotsSolutionsz, which is the studio side of this.',
                'Tell me roughly what you need — a sentence is enough — and it comes straight to me.',
            ],
            ask: true,
        },
        {
            q: 'How fast do you reply?',
            a: ['Same day, usually within a few hours. Weekends included, which is either a virtue or a warning.'],
        },
    ];

    const reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Free text goes to a real model at /api/chat, capped at ten per visitor.
     * If that endpoint is missing, rate-limited or broken, the panel falls back
     * to composing an email — the visitor must never hit a dead end because a
     * paid API had a bad night. */
    const history = [];
    let liveDown = false;

    async function askLive(text) {
        if (liveDown) return null;
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: history.slice(-6) }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                // A limit is a real answer worth showing; anything else is ours to hide.
                if (data.limited && data.error) return { reply: data.error, done: true };
                liveDown = true;
                return null;
            }
            return { reply: data.reply, remaining: data.remaining };
        } catch {
            liveDown = true;
            return null;
        }
    }

    function bubble(kind, text) {
        const el = document.createElement('div');
        el.className = `msg ${kind}`;
        if (kind === 'sys') {
            const tag = document.createElement('span');
            tag.className = 'who';
            tag.textContent = 'SYSTEM';
            el.appendChild(tag);
        }
        const body = document.createElement('p');
        body.textContent = text;
        el.appendChild(body);
        thread.appendChild(el);
        return el;
    }

    function actionRow(cta) {
        const row = document.createElement('div');
        row.className = 'msg-actions';
        const a = document.createElement('a');
        a.className = 'btn';
        a.href = cta.href;
        if (/^https?:/.test(cta.href)) a.rel = 'noopener';
        a.textContent = cta.label;
        row.appendChild(a);
        thread.appendChild(row);
    }

    function mailtoFor(text) {
        const subject = encodeURIComponent('From jamesdare.com');
        const body = encodeURIComponent(`${text}\n\n—\nSent from jamesdare.com`);
        return `mailto:${MAIL}?subject=${subject}&body=${body}`;
    }

    function sendRow(text) {
        const row = document.createElement('div');
        row.className = 'msg-actions';

        const mail = document.createElement('a');
        mail.className = 'btn gold';
        mail.href = mailtoFor(text);
        mail.textContent = 'SEND IT TO JAMES';
        row.appendChild(mail);

        const copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'btn ghost';
        copy.textContent = 'COPY THE ADDRESS';
        copy.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(MAIL);
                copy.textContent = 'COPIED — ' + MAIL;
            } catch {
                // Clipboard is blocked in plenty of managed browsers; show the
                // address instead of failing silently.
                copy.textContent = MAIL;
            }
        });
        row.appendChild(copy);

        thread.appendChild(row);
    }

    function scrollThread() {
        thread.scrollTop = thread.scrollHeight;
    }

    function say(lines, cta, afterText) {
        let i = 0;
        const next = () => {
            if (i < lines.length) {
                bubble('sys', lines[i]);
                i += 1;
                scrollThread();
                window.setTimeout(next, reduced ? 0 : 420);
                return;
            }
            if (cta) actionRow(cta);
            if (afterText !== undefined) sendRow(afterText);
            scrollThread();
        };
        window.setTimeout(next, reduced ? 0 : 260);
    }

    function ask(entry) {
        bubble('you', entry.q);
        scrollThread();
        say(entry.a, entry.cta, entry.ask ? '' : undefined);
        if (entry.ask) input.focus({ preventScroll: true });
    }

    ANSWERS.forEach((entry) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = entry.q;
        chip.addEventListener('click', () => ask(entry));
        chips.appendChild(chip);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) {
            input.focus();
            return;
        }
        bubble('you', text);
        input.value = '';
        scrollThread();

        const thinking = bubble('sys', 'Thinking…');
        thinking.classList.add('pending');

        const live = await askLive(text);
        thinking.remove();

        if (live && live.reply) {
            history.push({ role: 'user', content: text });
            history.push({ role: 'assistant', content: live.reply });
            bubble('sys', live.reply);
            if (!live.done) sendRow(text);
            scrollThread();
            return;
        }

        say(
            [
                'Got it. That goes to me directly — no form queue, no CRM.',
                'Hit send below and your mail app opens with the message already written. If it does not, the address is right there to copy.',
            ],
            null,
            text,
        );
    });

    // Opening line, written once on load so the panel is never an empty box.
    bubble('sys', 'Ask me anything about the work, or tell me what you need built. Tap one to start, or just type — a real model answers, ten questions per visitor.');
})();
