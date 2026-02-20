/**
 * CodeViewer — syntax-highlighted code panel with copy-to-clipboard.
 * Zero dependencies. Regex-based JS tokenizer with a curated dark-luxury palette.
 */

const TOKEN_RULES = [
    ['comment',  /\/\/[^\n]*/],
    ['string',   /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/],
    ['keyword',  /\b(?:const|let|var|function|return|if|else|for|while|class|export|import|from|async|await|new|this|throw|try|catch)\b/],
    ['builtin',  /\b(?:console|document|window|Array|Object|Promise|Math|JSON|null|undefined|true|false)\b/],
    ['number',   /\b\d+(?:\.\d+)?\b/],
    ['operator', /[=!<>]=?|[+\-*/%]|\.\.\.|=>|&&|\|\|/],
    ['punct',    /[{}()[\];,.:]/],
    ['fn',       /\b[a-zA-Z_$]\w*(?=\s*\()/],
];

function buildMasterRegex() {
    const src = TOKEN_RULES.map(([name, rx]) => `(?<${name}>${rx.source})`).join('|');
    return new RegExp(src, 'gm');
}

const MASTER_RX = buildMasterRegex();

function tokenize(code) {
    let result = '';
    let cursor = 0;

    for (const m of code.matchAll(MASTER_RX)) {
        if (m.index > cursor) {
            result += escapeHTML(code.slice(cursor, m.index));
        }
        const type = TOKEN_RULES.find(([name]) => m.groups[name])?.[0] || 'plain';
        result += `<span class="cv-tok--${type}">${escapeHTML(m[0])}</span>`;
        cursor = m.index + m[0].length;
    }
    if (cursor < code.length) result += escapeHTML(code.slice(cursor));
    return result;
}

function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Render a code viewer panel.
 * @param {Object} opts
 * @param {string} opts.code  - Raw code string
 * @param {string} opts.lang  - Language label (display only)
 * @param {string} [opts.accent] - CSS color for accents
 * @returns {HTMLElement}
 */
export function createCodeViewer({ code, lang = 'js', accent }) {
    const panel = document.createElement('div');
    panel.className = 'cv-panel';
    if (accent) panel.style.setProperty('--cv-accent', accent);

    // Header bar
    const header = document.createElement('div');
    header.className = 'cv-header';

    const langLabel = document.createElement('span');
    langLabel.className = 'cv-lang';
    langLabel.textContent = lang.toUpperCase();

    const copyBtn = document.createElement('button');
    copyBtn.className = 'cv-copy';
    copyBtn.textContent = 'COPY';
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(code).then(() => {
            copyBtn.classList.add('cv-copy--done');
            copyBtn.textContent = 'COPIED';
            setTimeout(() => {
                copyBtn.classList.remove('cv-copy--done');
                copyBtn.textContent = 'COPY';
            }, 1800);
        });
    });

    header.append(langLabel, copyBtn);

    // Code block with line numbers
    const pre = document.createElement('pre');
    pre.className = 'cv-pre';

    const codeEl = document.createElement('code');
    codeEl.className = 'cv-code';
    codeEl.innerHTML = tokenize(code.trim());
    pre.appendChild(codeEl);

    panel.append(header, pre);
    return panel;
}
