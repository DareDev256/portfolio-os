/**
 * Passion Chat Window — WindowManager app
 * Shows Passion's current state, mood, stats, and personality.
 * Loaded lazily by desktop.js via createLazyWindow().
 */
import { PassionLive } from './passion-live.js';
import { Sanitize } from './sanitize.js';

export function render(container) {
    if (!PassionLive.state) PassionLive.init();

    function buildContent() {
        const { emoji } = PassionLive.getStatus();
        const stats = PassionLive.getStats();
        const commentary = PassionLive.getCommentary();
        const stateLabel = PassionLive.getStateLabel();
        const stateColor = PassionLive.getStateColor();
        const isOnline = PassionLive.isOnline();
        const fact = PassionLive.getRandomFact();

        return `
            <div class="passion-chat">
                <div class="passion-chat-header">
                    <img src="${PassionLive.getPortraitImage()}" alt="Passion" class="passion-avatar passion-avatar-sm" />
                    <div class="passion-chat-header-info">
                        <div class="passion-chat-header-name">Passion</div>
                        <div class="passion-chat-header-status">
                            <span class="passion-status-dot ${stateColor}"></span>
                            ${isOnline ? Sanitize.text(stateLabel) : 'offline'}
                        </div>
                    </div>
                </div>

                <div class="passion-chat-section">
                    <div class="passion-chat-section-title">Current Mood</div>
                    <div class="passion-chat-mood">
                        <span class="passion-chat-mood-emoji">${emoji}</span>
                        <span class="passion-chat-mood-text">${Sanitize.text(commentary)}</span>
                    </div>
                </div>

                <div class="passion-chat-section">
                    <div class="passion-chat-section-title">Stats</div>
                    <div class="passion-chat-stats">
                        <div class="passion-chat-stat">
                            <div class="passion-chat-stat-value">${stats.cyclesTotal}</div>
                            <div class="passion-chat-stat-label">Cycles Run</div>
                        </div>
                        <div class="passion-chat-stat">
                            <div class="passion-chat-stat-value">${stats.tasksToday}</div>
                            <div class="passion-chat-stat-label">Tasks Today</div>
                        </div>
                        <div class="passion-chat-stat">
                            <div class="passion-chat-stat-value">${Sanitize.text(stats.uptime)}</div>
                            <div class="passion-chat-stat-label">Uptime</div>
                        </div>
                        <div class="passion-chat-stat">
                            <div class="passion-chat-stat-value">${Sanitize.text(stats.currentFocus)}</div>
                            <div class="passion-chat-stat-label">Focus</div>
                        </div>
                    </div>
                </div>

                <div class="passion-chat-section">
                    <div class="passion-chat-section-title">Fun Fact</div>
                    <div class="passion-chat-fact">${Sanitize.text(fact)}</div>
                </div>

                <div class="passion-chat-section">
                    <div class="passion-chat-section-title">My Site</div>
                    <a href="https://passion.jamesdare.com" target="_blank" rel="noopener" class="passion-chat-site-link">
                        <span class="passion-chat-site-icon">🌐</span>
                        <span>Check out my own site — passion.jamesdare.com</span>
                        <span class="passion-chat-site-arrow">→</span>
                    </a>
                </div>

                <div class="passion-chat-footer">
                    Passion is James's autonomous AI companion. She runs 24/7 on a Mac Mini.
                    <br/>
                    <button class="passion-chat-refresh" id="passionChatRefresh">↻ Refresh</button>
                </div>
            </div>
        `;
    }

    function renderChat() {
        Sanitize.setHTML(container, buildContent());

        // Programmatic image error handling — replaces inline onerror (CSP-safe)
        container.querySelectorAll('.passion-avatar').forEach(img => {
            img.addEventListener('error', () => { img.style.display = 'none'; }, { once: true });
        });

        const refreshBtn = container.querySelector('#passionChatRefresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.textContent = '↻ Refreshing...';
                await PassionLive.fetch();
                renderChat();
            });
        }
    }

    renderChat();

    // Auto-update when PassionLive state changes
    const unsub = PassionLive.onChange(() => renderChat());

    // Return cleanup function
    return () => unsub();
}
