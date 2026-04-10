/**
 * Achievement Viewer — TROPHIES.exe window app
 * Displays all achievements with unlock status, progress bar, and rarity tiers.
 * Loaded lazily by desktop.js via createLazyWindow().
 */
import { Achievements } from './achievements.js';

/**
 * Format a timestamp into a relative or short date string.
 * @param {number} ts - Unix timestamp in ms
 * @returns {string}
 */
function formatTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    if (diff < 60_000) return 'just now';
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Render the trophy viewer into a container element.
 * @param {HTMLElement} container
 * @returns {Function} cleanup
 */
export function render(container) {
    function buildUI() {
        const achievements = Achievements.getAll();
        const { done, total, percent } = Achievements.getProgress();

        // Sort: unlocked first (by unlock time desc), then locked
        const sorted = [...achievements].sort((a, b) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            if (a.unlocked && b.unlocked) return (b.unlockedAt || 0) - (a.unlockedAt || 0);
            return 0;
        });

        // Build DOM (no innerHTML — safe, CSP-compliant)
        const viewer = document.createElement('div');
        viewer.className = 'trophy-viewer';

        // ── Header ──
        const header = document.createElement('div');
        header.className = 'trophy-header';

        const title = document.createElement('div');
        title.className = 'trophy-header-title';
        title.textContent = '◈ Achievements';

        const progress = document.createElement('div');
        progress.className = 'trophy-progress';

        const bar = document.createElement('div');
        bar.className = 'trophy-progress-bar';
        const fill = document.createElement('div');
        fill.className = 'trophy-progress-fill';
        fill.style.width = `${percent}%`;
        bar.appendChild(fill);

        const progressText = document.createElement('div');
        progressText.className = 'trophy-progress-text';
        progressText.textContent = `${done} / ${total}`;

        progress.append(bar, progressText);
        header.append(title, progress);
        viewer.appendChild(header);

        // ── Grid ──
        const grid = document.createElement('div');
        grid.className = 'trophy-grid';

        for (const ach of sorted) {
            const card = document.createElement('div');
            card.className = `trophy-card ${ach.unlocked ? 'unlocked' : 'locked'} rarity-${ach.rarity}`;

            const icon = document.createElement('span');
            icon.className = 'trophy-card-icon';
            if (ach.unlocked) {
                icon.innerHTML = ach.icon;
            } else {
                icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="11" rx="2"/><path d="M12 3a4 4 0 0 0-4 4v4h8V7a4 4 0 0 0-4-4z"/></svg>`;
            }

            const info = document.createElement('div');
            info.className = 'trophy-card-info';

            const cardTitle = document.createElement('div');
            cardTitle.className = 'trophy-card-title';
            cardTitle.textContent = ach.unlocked ? ach.title : '???';

            const cardDesc = document.createElement('div');
            cardDesc.className = 'trophy-card-desc';
            cardDesc.textContent = ach.description;

            info.append(cardTitle, cardDesc);

            if (ach.unlocked && ach.unlockedAt) {
                const time = document.createElement('div');
                time.className = 'trophy-card-time';
                time.textContent = `Unlocked ${formatTime(ach.unlockedAt)}`;
                info.appendChild(time);
            }

            const rarity = document.createElement('span');
            rarity.className = `trophy-card-rarity ${ach.rarity}`;
            rarity.textContent = ach.rarity;

            card.append(icon, info, rarity);
            grid.appendChild(card);
        }

        viewer.appendChild(grid);

        // ── Footer ──
        const footer = document.createElement('div');
        footer.className = 'trophy-footer';

        const hint = document.createElement('span');
        hint.className = 'trophy-footer-hint';
        hint.textContent = percent === 100
            ? 'All achievements unlocked. You are an absolute legend.'
            : 'Explore the desktop to unlock achievements.';

        const resetBtn = document.createElement('button');
        resetBtn.className = 'trophy-reset-btn';
        resetBtn.textContent = 'Reset';
        resetBtn.addEventListener('click', () => {
            Achievements.reset();
            renderViewer();
        });

        footer.append(hint, resetBtn);
        viewer.appendChild(footer);

        return viewer;
    }

    function renderViewer() {
        container.innerHTML = '';
        container.appendChild(buildUI());
    }

    renderViewer();

    // Re-render when achievements change
    const unsub = Achievements.onChange(() => renderViewer());

    return () => unsub();
}
