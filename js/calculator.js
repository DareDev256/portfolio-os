import { el } from './dom-helpers.js';

/**
 * Calculator — Cyberpunk glass calculator for Passion OS.
 * Supports basic arithmetic, keyboard input, and expression chaining.
 */

const KEYS = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '−'],
    ['1', '2', '3', '+'],
    ['0', '.', '⌫', '='],
];

const OPS = { '÷': '/', '×': '*', '−': '-', '+': '+' };

export function renderCalculator(container) {
    container.innerHTML = '';

    let display = '0';
    let prev = null;
    let op = null;
    let fresh = true; // next digit replaces display

    const wrap = el('div', 'calc-app');

    // Display
    const screen = el('div', 'calc-screen');
    const expr = el('div', 'calc-expr');
    const readout = el('div', 'calc-readout', display);
    screen.append(expr, readout);

    // Keypad
    const pad = el('div', 'calc-pad');

    function updateDisplay() {
        readout.textContent = display.length > 12
            ? parseFloat(display).toExponential(6) : display;
    }

    function compute() {
        if (prev === null || op === null) return;
        const a = parseFloat(prev);
        const b = parseFloat(display);
        let result;
        switch (op) {
            case '+': result = a + b; break;
            case '-': result = a - b; break;
            case '*': result = a * b; break;
            case '/': result = b === 0 ? 'ERR' : a / b; break;
            default: return;
        }
        display = result === 'ERR' ? 'ERR' : String(
            Math.round(result * 1e10) / 1e10
        );
        prev = null;
        op = null;
        fresh = true;
    }

    function handleKey(key) {
        if (display === 'ERR' && key !== 'C') return;

        if (key >= '0' && key <= '9') {
            if (fresh) { display = key; fresh = false; }
            else { display = display === '0' ? key : display + key; }
            updateDisplay();
            return;
        }

        if (key === '.') {
            if (fresh) { display = '0.'; fresh = false; }
            else if (!display.includes('.')) { display += '.'; }
            updateDisplay();
            return;
        }

        if (key === 'C') {
            display = '0'; prev = null; op = null; fresh = true;
            expr.textContent = '';
            updateDisplay();
            return;
        }

        if (key === '⌫' || key === 'Backspace') {
            if (fresh) return;
            display = display.length > 1 ? display.slice(0, -1) : '0';
            updateDisplay();
            return;
        }

        if (key === '±') {
            if (display !== '0' && display !== 'ERR') {
                display = display.startsWith('-') ? display.slice(1) : '-' + display;
            }
            updateDisplay();
            return;
        }

        if (key === '%') {
            display = String(parseFloat(display) / 100);
            fresh = true;
            updateDisplay();
            return;
        }

        // Operators
        const opChar = OPS[key] || (Object.values(OPS).includes(key) ? key : null);
        if (opChar) {
            if (prev !== null && !fresh) compute();
            prev = display;
            op = opChar;
            fresh = true;
            expr.textContent = `${prev} ${key.length === 1 ? Object.keys(OPS).find(k => OPS[k] === opChar) || key : key}`;
            return;
        }

        if (key === '=' || key === 'Enter') {
            if (prev !== null) {
                expr.textContent = '';
                compute();
                updateDisplay();
            }
        }
    }

    // Build buttons
    KEYS.forEach(row => {
        row.forEach(key => {
            const isOp = key in OPS || key === '=';
            const isAction = ['C', '±', '%', '⌫'].includes(key);
            const cls = 'calc-key' +
                (isOp ? ' calc-key-op' : '') +
                (isAction ? ' calc-key-action' : '') +
                (key === '=' ? ' calc-key-eq' : '');
            const btn = el('button', cls, key);
            btn.addEventListener('click', () => handleKey(key));
            pad.appendChild(btn);
        });
    });

    wrap.append(screen, pad);
    container.appendChild(wrap);

    // Keyboard support
    function onKeyDown(e) {
        const k = e.key;
        if ((k >= '0' && k <= '9') || k === '.') handleKey(k);
        else if (k === '+' || k === '-' || k === '*' || k === '/') handleKey(k);
        else if (k === 'Enter' || k === '=') handleKey('=');
        else if (k === 'Backspace') handleKey('⌫');
        else if (k === 'Escape') handleKey('C');
    }

    document.addEventListener('keydown', onKeyDown);

    return () => { document.removeEventListener('keydown', onKeyDown); };
}
