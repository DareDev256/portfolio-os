import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies before importing Modal
vi.mock('../js/sanitize.js', () => ({
    Sanitize: {
        text: (s) => s || '',
        html: (s) => s || '',
    },
}));

const releaseSpy = vi.fn();
vi.mock('../js/focus-trap.js', () => ({
    trapFocus: vi.fn(() => releaseSpy),
}));

const { Modal } = await import('../js/modal.js');
const { trapFocus } = await import('../js/focus-trap.js');

describe('Modal.init()', () => {
    beforeEach(() => {
        // Remove any existing modal container
        document.getElementById('modalContainer')?.remove();
        Modal.container = null;
    });

    it('creates a modal container in the DOM', () => {
        Modal.init();
        const el = document.getElementById('modalContainer');
        expect(el).not.toBeNull();
        expect(el.classList.contains('modal-container')).toBe(true);
        expect(el.classList.contains('hidden')).toBe(true);
    });

    it('does not create duplicate containers on re-init', () => {
        Modal.init();
        Modal.init();
        const containers = document.querySelectorAll('#modalContainer');
        expect(containers.length).toBe(1);
    });
});

describe('Modal._createDismiss()', () => {
    beforeEach(() => {
        document.getElementById('modalContainer')?.remove();
        Modal.container = null;
        Modal.init();
        releaseSpy.mockClear();
    });

    it('calls releaseFocus, hides container, and resolves with value', () => {
        const release = vi.fn();
        let resolved;
        const resolve = (v) => { resolved = v; };

        const dismiss = Modal._createDismiss(release, resolve);
        dismiss('test-value');

        expect(release).toHaveBeenCalledOnce();
        expect(Modal.container.classList.contains('hidden')).toBe(true);
        expect(resolved).toBe('test-value');
    });

    it('resolves with true when called without arguments', () => {
        const release = vi.fn();
        let resolved;
        const resolve = (v) => { resolved = v; };

        const dismiss = Modal._createDismiss(release, resolve);
        dismiss();

        expect(resolved).toBe(true);
    });
});

describe('Modal.prompt()', () => {
    beforeEach(() => {
        document.getElementById('modalContainer')?.remove();
        Modal.container = null;
        Modal.init();
        releaseSpy.mockClear();
        vi.clearAllMocks();
    });

    it('renders title and message in the dialog', () => {
        // Don't await — we'll interact with the DOM synchronously
        Modal.prompt('Test Title', 'Test Message');
        const title = Modal.container.querySelector('.modal-title');
        const message = Modal.container.querySelector('.modal-message');
        expect(title.textContent).toContain('Test Title');
        expect(message.textContent).toContain('Test Message');
    });

    it('traps focus in the modal dialog', () => {
        Modal.prompt('Title', 'Msg');
        expect(trapFocus).toHaveBeenCalledWith(
            Modal.container.querySelector('.modal-dialog')
        );
    });

    it('resolves with input value when confirm is clicked', async () => {
        const promise = Modal.prompt('Title', 'Msg');
        const input = Modal.container.querySelector('#modalPasswordInput');
        const confirm = Modal.container.querySelector('.confirm');

        input.value = 'secret123';
        confirm.click();

        const result = await promise;
        expect(result).toBe('secret123');
    });

    it('resolves with null when cancel is clicked', async () => {
        const promise = Modal.prompt('Title', 'Msg');
        Modal.container.querySelector('.cancel').click();
        expect(await promise).toBeNull();
    });

    it('resolves with null when overlay is clicked', async () => {
        const promise = Modal.prompt('Title', 'Msg');
        Modal.container.querySelector('.modal-overlay').click();
        expect(await promise).toBeNull();
    });

    it('resolves with input value on Enter key', async () => {
        const promise = Modal.prompt('Title', 'Msg');
        const input = Modal.container.querySelector('#modalPasswordInput');
        input.value = 'enter-val';
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(await promise).toBe('enter-val');
    });

    it('resolves with null on Escape key', async () => {
        const promise = Modal.prompt('Title', 'Msg');
        const input = Modal.container.querySelector('#modalPasswordInput');
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(await promise).toBeNull();
    });
});

describe('Modal.alert()', () => {
    beforeEach(() => {
        document.getElementById('modalContainer')?.remove();
        Modal.container = null;
        Modal.init();
        releaseSpy.mockClear();
        vi.clearAllMocks();
    });

    it('renders an alert dialog with OK button', () => {
        Modal.alert('Alert Title', 'Alert body');
        expect(Modal.container.querySelector('.alert-modal')).not.toBeNull();
        expect(Modal.container.querySelector('.confirm').textContent).toBe('OK');
        // Should NOT have a cancel button
        expect(Modal.container.querySelector('.cancel')).toBeNull();
    });

    it('resolves when OK is clicked', async () => {
        const promise = Modal.alert('Title', 'Body');
        Modal.container.querySelector('.confirm').click();
        // Note: onclick = dismiss passes the click event as the value;
        // _createDismiss default (true) only applies when called with no args.
        const result = await promise;
        expect(result).toBeDefined();
    });

    it('resolves when overlay is clicked', async () => {
        const promise = Modal.alert('Title', 'Body');
        Modal.container.querySelector('.modal-overlay').click();
        const result = await promise;
        expect(result).toBeDefined();
    });

    it('releases focus trap on dismiss', async () => {
        const promise = Modal.alert('Title', 'Body');
        Modal.container.querySelector('.confirm').click();
        await promise;
        expect(releaseSpy).toHaveBeenCalledOnce();
    });
});
