/**
 * Cipher Decode — Holographic Code Materialization
 *
 * When code-viewer panels (.cv-panel) scroll into view, each character
 * scrambles through random hex/glyph noise before resolving to its
 * true value — like encrypted data decrypting in Stark's lab.
 *
 * A gold scan line sweeps left-to-right during decode, leaving
 * resolved characters with a brief luminous afterglow.
 *
 * Uses IntersectionObserver for trigger. Respects reduced-motion.
 * Desktop-only (skipped on coarse-pointer devices).
 */

import { shouldSkipDesktopEffects, createDecorativeEl } from './dom-helpers.js';

const GLYPHS = '0123456789ABCDEF.:;{}[]<>/\\|=+-*&^%$#@!~';
const CHARS_PER_FRAME = 3;       // characters resolved per animation tick
const SCRAMBLE_TICKS = 4;        // random cycles before a char resolves
const TICK_MS = 28;              // milliseconds per animation tick

/** Pick a random glyph from the noise alphabet */
function randomGlyph() {
    return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

/**
 * Run the cipher-decode animation on a single <code> element.
 * Preserves existing syntax-highlighted spans.
 */
function decodePanelCode(codeEl, scanLine) {
    const spans = codeEl.querySelectorAll('span[class^="cv-tok"]');
    if (!spans.length) return;

    // Build a flat list of { span, originalText, charStates[] }
    const entries = [];
    for (const span of spans) {
        const text = span.textContent;
        if (!text.trim()) continue;  // skip whitespace-only tokens
        const chars = [];
        for (let i = 0; i < text.length; i++) {
            chars.push({
                original: text[i],
                ticksLeft: SCRAMBLE_TICKS + Math.floor(Math.random() * 3),
                resolved: text[i] === ' ' || text[i] === '\n', // whitespace resolves instantly
            });
        }
        entries.push({ span, originalText: text, chars });
        // Start with scrambled content
        span.textContent = chars.map(c => c.resolved ? c.original : randomGlyph()).join('');
        span.classList.add('cipher-scrambled');
    }

    // Activate scan line
    if (scanLine) {
        scanLine.classList.add('cipher-scan--active');
    }

    let cursor = 0; // global character index across all spans
    let totalChars = entries.reduce((sum, e) => sum + e.chars.length, 0);

    const interval = setInterval(() => {
        let resolved = 0;
        let globalIdx = 0;

        for (const entry of entries) {
            let dirty = false;
            for (const ch of entry.chars) {
                if (ch.resolved) {
                    resolved++;
                    globalIdx++;
                    continue;
                }

                // Characters near or behind the cursor resolve
                if (globalIdx <= cursor) {
                    ch.ticksLeft--;
                    if (ch.ticksLeft <= 0) {
                        ch.resolved = true;
                        resolved++;
                        dirty = true;
                    } else {
                        dirty = true;
                    }
                }
                globalIdx++;
            }

            if (dirty) {
                entry.span.textContent = entry.chars
                    .map(c => c.resolved ? c.original : randomGlyph())
                    .join('');
            }

            // Remove scramble class when fully resolved
            if (entry.chars.every(c => c.resolved)) {
                entry.span.classList.remove('cipher-scrambled');
                entry.span.classList.add('cipher-resolved');
            }
        }

        cursor += CHARS_PER_FRAME;

        if (resolved >= totalChars) {
            clearInterval(interval);
            // Clean up: remove all cipher classes after glow fades
            setTimeout(() => {
                for (const entry of entries) {
                    entry.span.classList.remove('cipher-resolved', 'cipher-scrambled');
                }
                if (scanLine) scanLine.classList.remove('cipher-scan--active');
            }, 800);
        }
    }, TICK_MS);
}

/**
 * Inject scan line element into a .cv-panel and return it.
 */
function injectScanLine(panel) {
    const line = createDecorativeEl('div', 'cipher-scan');
    const pre = panel.querySelector('.cv-pre');
    if (pre) {
        pre.style.position = 'relative';
        pre.appendChild(line);
    }
    return line;
}

export const CipherDecode = {
    init() {
        if (shouldSkipDesktopEffects()) return;

        const decoded = new WeakSet();

        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const panel = entry.target;
                if (decoded.has(panel)) continue;
                decoded.add(panel);

                const codeEl = panel.querySelector('.cv-code');
                if (!codeEl) continue;

                const scanLine = injectScanLine(panel);
                // Small delay so the panel's own fade-in animation leads
                setTimeout(() => decodePanelCode(codeEl, scanLine), 700);
            }
        }, { threshold: 0.3 });

        // Observe existing panels
        for (const panel of document.querySelectorAll('.cv-panel')) {
            observer.observe(panel);
        }

        // Watch for dynamically added panels (lazy-loaded window content)
        const body = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (node.classList?.contains('cv-panel')) {
                        observer.observe(node);
                    }
                    // Also check children (panels nested inside added containers)
                    if (node.querySelectorAll) {
                        for (const p of node.querySelectorAll('.cv-panel')) {
                            observer.observe(p);
                        }
                    }
                }
            }
        });
        body.observe(document.body, { childList: true, subtree: true });
    },
};
