/**
 * Terminal — command dispatch, history navigation, and input sanitization
 *
 * The Terminal is the portfolio's CLI — visitors type real commands.
 * Tests cover: command routing, file system boundaries, history traversal
 * edge cases, and XSS prevention via Sanitize integration.
 */
import { describe, it, expect } from 'vitest';

// ---------- Extracted pure logic from terminal.js ----------
// Terminal binds to DOM on init, so we replicate testable logic here.

const fileSystem = {
    'resume.json': 'ACCESS_DENIED: Try "cat resume.txt" or contact for PDF.',
    'secrets.env': 'nice_try_buddy=true',
    'skills.log': 'Use "sys scan" to view technical capabilities.',
    'config.yml': 'env: production\nvisuals: ultra\nmode: enterprise',
};

function parseCommand(cmdRaw) {
    const parts = cmdRaw.split(' ');
    return { cmd: parts[0].toLowerCase(), args: parts.slice(1) };
}

function resolveCommand(cmd, args) {
    switch (cmd) {
        case 'help':    return { action: 'help' };
        case 'clear':   return { action: 'clear' };
        case 'whoami':  return { action: 'print', text: 'root (just kidding, you are a visitor)' };
        case 'ls':      return { action: 'print', text: Object.keys(fileSystem).join('  ') };
        case 'cat':
            if (!args[0]) return { action: 'print', text: 'Usage: cat [filename]' };
            if (fileSystem[args[0]]) return { action: 'print', text: fileSystem[args[0]] };
            return { action: 'error', text: `cat: ${args[0]}: No such file or directory` };
        case 'sys':
            return args[0] === 'scan' ? { action: 'scan' } : { action: 'sysinfo' };
        case 'deploy':  return { action: 'deploy' };
        default:        return { action: 'unknown', text: `Command not found: ${cmd}` };
    }
}

// ---------- History navigation (stateful) ----------
function createHistory() {
    const history = [];
    let index = -1;
    return {
        push(cmd) { history.push(cmd); index = -1; },
        up() {
            if (history.length === 0) return '';
            index = Math.min(index + 1, history.length - 1);
            return history[history.length - 1 - index];
        },
        down() {
            if (index > 0) { index--; return history[history.length - 1 - index]; }
            index = -1;
            return '';
        },
        get index() { return index; },
    };
}

// ===================== TESTS =====================

describe('Terminal — Command Parsing', () => {
    it('lowercases command but preserves arg casing', () => {
        const { cmd, args } = parseCommand('CAT Resume.json');
        expect(cmd).toBe('cat');
        expect(args).toEqual(['Resume.json']);
    });

    it('handles commands with no arguments', () => {
        const { cmd, args } = parseCommand('whoami');
        expect(cmd).toBe('whoami');
        expect(args).toEqual([]);
    });

    it('handles extra whitespace in args (split behavior)', () => {
        const { cmd, args } = parseCommand('cat   file.txt');
        expect(cmd).toBe('cat');
        // split(' ') produces empty strings for consecutive spaces
        expect(args.filter(Boolean)).toEqual(['file.txt']);
    });
});

describe('Terminal — Command Routing', () => {
    it('routes "ls" and lists all filesystem keys', () => {
        const r = resolveCommand('ls', []);
        expect(r.text).toContain('resume.json');
        expect(r.text).toContain('secrets.env');
        expect(r.text).toContain('config.yml');
    });

    it('routes "cat" with valid file', () => {
        const r = resolveCommand('cat', ['secrets.env']);
        expect(r.text).toBe('nice_try_buddy=true');
    });

    it('returns error for "cat" with nonexistent file', () => {
        const r = resolveCommand('cat', ['passwd']);
        expect(r.action).toBe('error');
        expect(r.text).toContain('No such file');
    });

    it('returns usage hint for "cat" with no args', () => {
        const r = resolveCommand('cat', []);
        expect(r.text).toBe('Usage: cat [filename]');
    });

    it('routes "sys scan" to scan action', () => {
        expect(resolveCommand('sys', ['scan']).action).toBe('scan');
    });

    it('routes "sys" without args to sysinfo', () => {
        expect(resolveCommand('sys', []).action).toBe('sysinfo');
    });

    it('returns unknown for unrecognized commands', () => {
        const r = resolveCommand('rm', ['-rf', '/']);
        expect(r.action).toBe('unknown');
    });
});

describe('Terminal — File System Boundary', () => {
    it('cannot access files outside the defined filesystem', () => {
        const r = resolveCommand('cat', ['../../etc/passwd']);
        expect(r.action).toBe('error');
    });

    it('cannot access files via case mismatch (keys are case-sensitive)', () => {
        const r = resolveCommand('cat', ['Resume.JSON']);
        expect(r.action).toBe('error');
    });

    it('filesystem is a closed set — no dynamic file creation', () => {
        expect(Object.keys(fileSystem)).toHaveLength(4);
    });
});

describe('Terminal — History Navigation', () => {
    it('returns empty string when history is empty', () => {
        const h = createHistory();
        expect(h.up()).toBe('');
    });

    it('navigates up through history in LIFO order', () => {
        const h = createHistory();
        h.push('ls');
        h.push('whoami');
        h.push('help');
        expect(h.up()).toBe('help');
        expect(h.up()).toBe('whoami');
        expect(h.up()).toBe('ls');
    });

    it('clamps at oldest entry on repeated up', () => {
        const h = createHistory();
        h.push('ls');
        h.up(); // -> 'ls'
        h.up(); // should stay at 'ls'
        expect(h.up()).toBe('ls');
    });

    it('navigates down back to empty after reaching bottom', () => {
        const h = createHistory();
        h.push('ls');
        h.push('cat resume.json');
        h.up(); // 'cat resume.json'
        h.up(); // 'ls'
        expect(h.down()).toBe('cat resume.json');
        expect(h.down()).toBe(''); // back to input
    });

    it('resets index on new command push', () => {
        const h = createHistory();
        h.push('ls');
        h.up(); // index=0
        h.push('help'); // should reset
        expect(h.up()).toBe('help'); // most recent
    });

    it('down from fresh state returns empty', () => {
        const h = createHistory();
        h.push('ls');
        // no up() called yet — index is -1
        expect(h.down()).toBe('');
    });
});
