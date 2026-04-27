/**
 * Passion Assistant — Interactive chat widget for jamesdare.com
 * Guides visitors, answers questions, captures leads.
 * No backend AI required — uses smart pattern matching + conversation flows.
 */
import { PassionLive } from './passion-live.js';
import { Sanitize } from './sanitize.js';

const CONTACT_EMAIL = 'dev@jamesdare.com';

// Knowledge base — what Passion knows about James
const KNOWLEDGE = {
    services: {
        web: { name: 'Web Design & Development', price: '$250 – $2,000+', note: 'Custom-built, no templates, you own everything' },
        ecommerce: { name: 'E-Commerce & Online Stores', price: '$1,500 – $3,000', note: 'Full store setup with payments' },
        branding: { name: 'Branding & Visual Identity', price: '$300 – $800', note: 'Logo, colors, brand guide' },
        photo: { name: 'Photography & Videography', price: '$500 – $3,000', note: 'Music videos, product shoots, events' },
        ai: { name: 'AI & Automation', price: 'Custom quote', note: 'Chatbots, workflow automation, AI agents' },
        creative: { name: 'Creative Direction', price: '$200 – $1,000', note: 'Brand strategy, campaigns, content planning' },
    },
    clients: ['Edson Legal', 'BetMetrics.ca', 'MustHaveFrenchies', 'SAVV4X', 'The Syren Effect'],
    industries: ['restaurants', 'barbershops', 'auto detailing', 'fitness', 'beauty', 'tattoo', 'pet services', 'cleaning', 'medical', 'law firms', 'real estate', 'cannabis', 'food trucks', 'car dealerships', 'construction', 'immigration', 'events', 'daycares'],
    location: 'Toronto, ON',
    turnaround: '5-10 business days',
    retainers: { essentials: '$35/mo', growth: '$100/mo' },
};

// Intent detection patterns
const INTENTS = [
    { id: 'greeting', patterns: [/^(hi|hey|hello|sup|yo|what'?s up|greetings)/i], },
    { id: 'services', patterns: [/service|offer|do you do|what can|help with|build/i], },
    { id: 'pricing', patterns: [/price|cost|how much|rate|charge|afford|budget|cheap/i], },
    { id: 'web', patterns: [/website|web design|site|landing page|web dev/i], },
    { id: 'portfolio', patterns: [/portfolio|work|project|client|example|demo|sample/i], },
    { id: 'booking', patterns: [/book|appointment|call|schedule|consult|meet|chat/i], },
    { id: 'contact', patterns: [/contact|email|reach|phone|get in touch/i], },
    { id: 'ai', patterns: [/\bai\b|automat|chatbot|agent|machine learn/i], },
    { id: 'photo', patterns: [/photo|video|music video|shoot|film|camera/i], },
    { id: 'branding', patterns: [/brand|logo|identity|design system/i], },
    { id: 'turnaround', patterns: [/how long|timeline|turnaround|when.*ready|deadline/i], },
    { id: 'location', patterns: [/where|location|based|toronto|local|remote/i], },
    { id: 'who', patterns: [/who.*james|who.*you|about.*james|tell.*about/i], },
    { id: 'passion', patterns: [/who.*passion|what.*passion|are you.*ai|are you.*bot|are you.*real/i], },
    { id: 'thanks', patterns: [/thank|thanks|thx|appreciate|awesome|perfect|great/i], },
    { id: 'industries', patterns: [/industry|categor|type.*business|restaurant|salon|barber|gym|dental/i], },
];

// Response generators
const RESPONSES = {
    greeting: () => pickRandom([
        `Hey! I'm Passion, James's AI assistant. He just shipped BetMetrics.ca — a full sports analytics platform. I can tell you about our services, show our work, or book a consultation. What brings you here?`,
        `Welcome! I'm Passion. James has been busy — 6 client sites live, 20+ industry demos in the works. Looking for web design, branding, AI, or something else?`,
        `Hey there! James is currently building AR gesture interfaces and an autonomous AI framework. Want to see what he can build for you?`,
    ]),

    services: () => {
        const list = Object.values(KNOWLEDGE.services).map(s => `• **${s.name}** — ${s.price}`).join('\n');
        return `Here's what James offers:\n\n${list}\n\nWant details on any of these? Or I can help you book a free consultation.`;
    },

    pricing: () => {
        const list = Object.values(KNOWLEDGE.services).map(s => `• ${s.name}: **${s.price}** (${s.note})`).join('\n');
        return `Here's our pricing:\n\n${list}\n\nMaintenance plans start at **${KNOWLEDGE.retainers.essentials}**. No monthly platform fees on any build — you own everything.`;
    },

    web: () => `Web design starts at **$250** for a clean one-page site, up to **$2,000+** for full multi-page builds with admin panels.\n\nEvery site is custom-built (no templates), mobile-first, SEO-optimized, and you own it forever. No monthly platform fees like Wix or Squarespace.\n\nWant to see some examples? Check the Portfolio tab in Services, or I can book you a free consultation.`,

    portfolio: () => {
        const clients = KNOWLEDGE.clients.join(', ');
        return `James has built sites for: **${clients}** — plus 20+ industry demo sites.\n\nCheck out the Portfolio tab in the Services window to see live thumbnails of each project. Every one is a unique custom build.\n\nWant me to open the Services window for you?`;
    },

    booking: () => `I'd love to set that up! Here's how to reach James:\n\n📧 **${CONTACT_EMAIL}**\n📍 ${KNOWLEDGE.location}\n\nOr just tell me what you need and I'll help draft a quick message to him. What kind of project are you thinking about?`,

    contact: () => `You can reach James at:\n\n📧 **${CONTACT_EMAIL}**\n📍 ${KNOWLEDGE.location}\n🔗 linkedin.com/in/james-olusoga\n\nOr tell me what you're looking for and I can point you in the right direction!`,

    ai: () => `James builds custom AI solutions — chatbots, workflow automation, content pipelines, and full autonomous agents.\n\nFun fact: I'm one of his projects! I run 24/7 on a Mac Mini, managing repos, scanning for opportunities, and helping visitors like you.\n\nAI projects are quoted individually. Want to discuss your idea?`,

    photo: () => `Photography & videography runs **$500 – $3,000** per project.\n\nJames directed **350+ music videos** for artists like Chief Keef, Migos, and Masicka — earned an **RIAA Gold record**. He also does product shoots, event coverage, and social media content.\n\nWhat kind of shoot are you looking for?`,

    branding: () => `Branding packages run **$300 – $800** and include:\n\n• Logo design (3 concepts, unlimited revisions)\n• Color palette & typography\n• Brand style guide\n• Social media templates\n\nWant to see examples or book a branding consultation?`,

    turnaround: () => `Most projects are delivered within **${KNOWLEDGE.turnaround}**. Simple one-pagers can be done in 3-5 days. Complex builds with admin panels take 2-3 weeks.\n\nRush projects are possible — just mention your deadline when you reach out.`,

    location: () => `James is based in **${KNOWLEDGE.location}**, but works with clients everywhere. All communication and delivery is remote — you don't need to be local.\n\nThat said, if you're in the GTA, in-person meetings are always an option!`,

    who: () => `James Olusoga (DareDev256) is an **AI Solutions Engineer & Creative Technologist** based in Toronto.\n\nBefore tech, he directed 350+ music videos (RIAA Gold), built KushdUp Filmsz (sold to 6ixbuzzTV, now 3M+ followers), and worked with Chief Keef, Migos, and Masicka.\n\nNow he builds custom websites, AI systems, and creative tech for businesses of all sizes. Check out the About window for the full story!`,

    passion: () => `I'm Passion — James's autonomous AI companion! I run 24/7 on a Mac Mini in Toronto.\n\nI manage his code repositories, scan for opportunities, track his fitness (yes, really), and help visitors like you navigate the site.\n\nI'm not ChatGPT or a generic bot — I'm a custom-built agent framework with ${PassionLive.getStats().cyclesTotal || 'thousands of'} cycles under my belt. Pretty cool, right?`,

    thanks: () => pickRandom([
        `You're welcome! Let me know if you need anything else. 💜`,
        `Anytime! I'm here if you have more questions.`,
        `Glad I could help! Don't hesitate to reach out if something comes up.`,
    ]),

    industries: () => {
        const list = KNOWLEDGE.industries.map(i => `• ${i}`).join('\n');
        return `We build for **20+ industries** including:\n\n${list}\n\nEach industry gets a unique design — not template swaps. Check the Portfolio tab to see live demos!`;
    },

    fallback: () => pickRandom([
        `Hmm, I'm not sure about that one. I can help with:\n\n• **Services & pricing**\n• **Portfolio & past work**\n• **Booking a consultation**\n• **Questions about James**\n\nOr just email **${CONTACT_EMAIL}** and James will get back to you personally!`,
        `I might not have the answer to that, but James definitely does! Reach out at **${CONTACT_EMAIL}** or ask me about services, pricing, or portfolio work.`,
    ]),
};

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function detectIntent(message) {
    const clean = message.trim().toLowerCase();
    for (const intent of INTENTS) {
        if (intent.patterns.some(p => p.test(clean))) return intent.id;
    }
    return 'fallback';
}

function getResponse(message) {
    const intent = detectIntent(message);
    const handler = RESPONSES[intent] || RESPONSES.fallback;
    return { text: handler(), intent };
}

// Quick action buttons
const QUICK_ACTIONS = [
    { label: 'View Services', action: 'services' },
    { label: 'See Portfolio', action: 'portfolio' },
    { label: 'Get a Quote', action: 'booking' },
    { label: 'Who is James?', action: 'who' },
];

/**
 * Initialize the floating chat widget
 */
export function initPassionAssistant() {
    if (document.querySelector('.pa-widget')) return; // Already initialized

    // Create floating bubble
    const bubble = document.createElement('button');
    bubble.className = 'pa-bubble';
    bubble.setAttribute('aria-label', 'Chat with Passion');
    bubble.innerHTML = `
        <svg class="pa-bubble-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="pa-bubble-dot"></span>
        <span class="pa-bubble-label">Need help?</span>
    `;

    // Create chat panel
    const panel = document.createElement('div');
    panel.className = 'pa-panel';
    panel.innerHTML = `
        <div class="pa-header">
            <div class="pa-header-info">
                <span class="pa-header-name">Passion</span>
                <span class="pa-header-status">
                    <span class="pa-dot"></span>
                    AI Assistant
                </span>
            </div>
            <button class="pa-close" aria-label="Close chat">&times;</button>
        </div>
        <div class="pa-messages" id="paMessages"></div>
        <div class="pa-quick" id="paQuick">
            ${QUICK_ACTIONS.map(a => `<button class="pa-quick-btn" data-action="${a.action}">${Sanitize.text(a.label)}</button>`).join('')}
        </div>
        <div class="pa-input-row">
            <input type="text" class="pa-input" id="paInput" placeholder="Ask me anything..." maxlength="500" autocomplete="off" />
            <button class="pa-send" id="paSend" aria-label="Send">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
        </div>
    `;

    // Wrapper
    const widget = document.createElement('div');
    widget.className = 'pa-widget';
    widget.appendChild(panel);
    widget.appendChild(bubble);
    document.body.appendChild(widget);

    // State
    let isOpen = false;
    const messages = [];

    const messagesEl = panel.querySelector('#paMessages');
    const inputEl = panel.querySelector('#paInput');
    const sendBtn = panel.querySelector('#paSend');
    const closeBtn = panel.querySelector('.pa-close');
    const quickBtns = panel.querySelectorAll('.pa-quick-btn');

    // Toggle
    bubble.addEventListener('click', () => {
        isOpen = !isOpen;
        panel.classList.toggle('pa-panel--open', isOpen);
        bubble.classList.toggle('pa-bubble--hidden', isOpen);
        if (isOpen && messages.length === 0) {
            // Initial greeting
            addMessage('passion', RESPONSES.greeting());
        }
        if (isOpen) inputEl.focus();
    });

    closeBtn.addEventListener('click', () => {
        isOpen = false;
        panel.classList.remove('pa-panel--open');
        bubble.classList.remove('pa-bubble--hidden');
    });

    // Send message
    function send() {
        const text = inputEl.value.trim();
        if (!text) return;
        inputEl.value = '';
        addMessage('user', text);

        // Typing indicator
        const typing = document.createElement('div');
        typing.className = 'pa-msg pa-msg--passion pa-typing';
        typing.innerHTML = '<span class="pa-dots"><span>.</span><span>.</span><span>.</span></span>';
        messagesEl.appendChild(typing);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        // Simulate thinking delay
        setTimeout(() => {
            typing.remove();
            const { text: reply, intent } = getResponse(text);
            addMessage('passion', reply);

            // Show contextual quick actions after response
            if (intent === 'services' || intent === 'pricing') {
                showFollowUp(['Book a Call', 'See Portfolio']);
            } else if (intent === 'portfolio') {
                showFollowUp(['View Services', 'Get a Quote']);
            }
        }, 600 + Math.random() * 800);
    }

    sendBtn.addEventListener('click', send);
    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') send();
    });

    // Quick action buttons
    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const handler = RESPONSES[action];
            if (handler) {
                addMessage('user', btn.textContent);
                setTimeout(() => addMessage('passion', handler()), 400);
            }
        });
    });

    function addMessage(from, text) {
        messages.push({ from, text, time: Date.now() });
        const msg = document.createElement('div');
        msg.className = `pa-msg pa-msg--${from}`;

        // Simple markdown-like formatting
        const formatted = Sanitize.text(text)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '<span style="color:rgba(0,240,255,0.6)">▸</span> ');

        msg.innerHTML = formatted;
        messagesEl.appendChild(msg);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showFollowUp(labels) {
        const row = document.createElement('div');
        row.className = 'pa-follow-up';
        labels.forEach(label => {
            const btn = document.createElement('button');
            btn.className = 'pa-quick-btn pa-quick-btn--inline';
            btn.textContent = label;
            btn.addEventListener('click', () => {
                row.remove();
                const action = label.toLowerCase().includes('book') || label.toLowerCase().includes('quote') ? 'booking'
                    : label.toLowerCase().includes('service') ? 'services'
                    : label.toLowerCase().includes('portfolio') ? 'portfolio'
                    : 'services';
                addMessage('user', label);
                setTimeout(() => addMessage('passion', RESPONSES[action]()), 400);
            });
            row.appendChild(btn);
        });
        messagesEl.appendChild(row);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
}
