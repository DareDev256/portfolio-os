import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCodeViewer } from '../js/code-viewer.js';

describe('CodeViewer', () => {
    let originalClipboard;

    beforeEach(() => {
        originalClipboard = navigator.clipboard;
        // Mock clipboard API
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });
        vi.useFakeTimers();
    });

    afterEach(() => {
        Object.assign(navigator, {
            clipboard: originalClipboard,
        });
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('creates a basic code viewer panel', () => {
        const code = 'const x = 42;';
        const panel = createCodeViewer({ code });

        expect(panel.tagName).toBe('DIV');
        expect(panel.className).toBe('cv-panel');

        const header = panel.querySelector('.cv-header');
        expect(header).toBeTruthy();

        const langLabel = panel.querySelector('.cv-lang');
        expect(langLabel).toBeTruthy();
        expect(langLabel.textContent).toBe('JS'); // default language

        const copyBtn = panel.querySelector('.cv-copy');
        expect(copyBtn).toBeTruthy();
        expect(copyBtn.textContent).toBe('COPY');

        const pre = panel.querySelector('.cv-pre');
        expect(pre).toBeTruthy();

        const codeEl = panel.querySelector('.cv-code');
        expect(codeEl).toBeTruthy();
    });

    it('applies custom language and accent color', () => {
        const panel = createCodeViewer({ code: 'print("hello")', lang: 'python', accent: '#ff0000' });

        const langLabel = panel.querySelector('.cv-lang');
        expect(langLabel.textContent).toBe('PYTHON');

        expect(panel.style.getPropertyValue('--cv-accent')).toBe('#ff0000');
    });

    it('tokenizes code correctly', () => {
        const code = 'const sum = (a, b) => a + b;';
        const panel = createCodeViewer({ code });
        const codeEl = panel.querySelector('.cv-code');

        const html = codeEl.innerHTML;

        // Check for specific tokens
        expect(html).toContain('<span class="cv-tok--keyword">const</span>');
        expect(html).toContain('<span class="cv-tok--operator">=</span>');
        expect(html).toContain('<span class="cv-tok--operator">+</span>');
    });

    it('escapes HTML correctly', () => {
        const code = '<div id="test"> & </div>';
        const panel = createCodeViewer({ code });
        const codeEl = panel.querySelector('.cv-code');

        // The original angle brackets and ampersand should be escaped in the tokens
        const html = codeEl.innerHTML;
        expect(html).toContain('&lt;');
        expect(html).toContain('&gt;');
        expect(html).toContain('&amp;');
    });

    it('handles clipboard copy functionality', async () => {
        const code = 'const a = 1;';
        const panel = createCodeViewer({ code });
        const copyBtn = panel.querySelector('.cv-copy');

        // Simulate click
        copyBtn.click();

        // Check if clipboard API was called with the correct code
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(code);

        // Wait for promises to resolve (microtasks)
        await Promise.resolve();
        await Promise.resolve();

        // After click, button state should change
        expect(copyBtn.classList.contains('cv-copy--done')).toBe(true);
        expect(copyBtn.textContent).toBe('COPIED');

        // Fast forward 1800ms to test timeout reset
        await vi.advanceTimersByTimeAsync(1800);

        // State should revert
        expect(copyBtn.classList.contains('cv-copy--done')).toBe(false);
        expect(copyBtn.textContent).toBe('COPY');
    });
});
