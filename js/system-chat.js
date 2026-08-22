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
                'An open-source MCP server for Final Cut Pro — 90 stars, on PyPI, about 1,900 installs a month. A sports-betting analytics product with real money moving through it. Twelve client sites live right now.',
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

    function mailtoFor(subject, body) {
        return (
            'mailto:' + MAIL +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(body)
        );
    }

    /* Web compose, per provider. A mailto: is a dead click for anyone whose
     * browser has no registered mail handler — nothing opens, nothing errors,
     * the button just does nothing — so the email is never ONLY behind one.
     *
     * There is NO reliable way to detect a visitor's mail provider from a page,
     * and guessing is how the mailto problem repeats at smaller scale: send an
     * Outlook user to Gmail and they hit a Google sign-in wall instead of a
     * compose window. So the buttons are LABELLED with where they go and the
     * visitor picks. Gmail and Outlook together cover most people; copy and the
     * mail app cover the rest, and the email is printed above regardless. */
    function gmailFor(subject, body) {
        return (
            'https://mail.google.com/mail/?view=cm&fs=1' +
            '&to=' + encodeURIComponent(MAIL) +
            '&su=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(body)
        );
    }

    function outlookFor(subject, body) {
        return (
            'https://outlook.live.com/mail/0/deeplink/compose' +
            '?to=' + encodeURIComponent(MAIL) +
            '&subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(body)
        );
    }

    function defaultDraft(text) {
        return {
            subject: 'Enquiry from jamesdare.com',
            body: `${text}\n\n— sent from jamesdare.com`,
        };
    }

    function sendRow(text) {
        const wrap = document.createElement('div');
        wrap.className = 'msg-send';

        // The composed email, on screen. Even if every button fails, the visitor
        // can read it, select it and send it themselves.
        const preview = document.createElement('div');
        preview.className = 'send-preview';
        const subjLine = document.createElement('p');
        subjLine.className = 'send-subject';
        const bodyLine = document.createElement('p');
        bodyLine.className = 'send-body';
        preview.appendChild(subjLine);
        preview.appendChild(bodyLine);
        wrap.appendChild(preview);

        const row = document.createElement('div');
        row.className = 'msg-actions';

        const gmail = document.createElement('a');
        gmail.className = 'btn gold';
        gmail.target = '_blank';
        gmail.rel = 'noopener';
        gmail.textContent = 'SEND VIA GMAIL';
        row.appendChild(gmail);

        const outlook = document.createElement('a');
        outlook.className = 'btn ghost';
        outlook.target = '_blank';
        outlook.rel = 'noopener';
        outlook.textContent = 'VIA OUTLOOK';
        row.appendChild(outlook);

        const copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'btn ghost';
        copy.textContent = 'COPY THE EMAIL';
        row.appendChild(copy);

        const mail = document.createElement('a');
        mail.className = 'btn ghost';
        mail.textContent = 'MAIL APP';
        row.appendChild(mail);

        wrap.appendChild(row);
        thread.appendChild(wrap);

        let draft = defaultDraft(text);

        function paint() {
            subjLine.textContent = 'Subject: ' + draft.subject;
            bodyLine.textContent = draft.body;
            gmail.href = gmailFor(draft.subject, draft.body);
            outlook.href = outlookFor(draft.subject, draft.body);
            mail.href = mailtoFor(draft.subject, draft.body);
        }
        paint();

        copy.addEventListener('click', async () => {
            const full = `To: ${MAIL}\nSubject: ${draft.subject}\n\n${draft.body}`;
            try {
                await navigator.clipboard.writeText(full);
                copy.textContent = 'COPIED';
            } catch {
                // Clipboard is blocked in plenty of managed browsers. The email
                // is already on screen, so say so rather than failing silently.
                copy.textContent = 'SELECT IT ABOVE';
            }
        });

        /* Upgrade to the written version when it lands. Never block on it: every
         * button above is already wired to a working draft. */
        (async () => {
            try {
                const res = await fetch('/api/draft', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, history: history.slice(-6) }),
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!data || !data.body) return;
                draft = { subject: data.subject || draft.subject, body: data.body };
                paint();
                scrollThread();
            } catch {
                // Keep the plain version.
            }
        })();
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
