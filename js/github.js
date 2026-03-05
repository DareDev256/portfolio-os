/**
 * GITHUB OPERATIONS CENTER
 * Handles live data fetching from GitHub API and rendering the dashboard.
 */
import { Sanitize } from './sanitize.js';
import { openExternal, animateCounter, loadJSON, saveJSON, fetchWithTimeout } from './dom-helpers.js';

export const GitHub = {
    username: 'DareDev256',
    cacheKey: 'github_data_v1',
    cacheTTL: 1000 * 60 * 60, // 1 hour

    init() {
        // Prepare any listeners if needed
    },

    /**
     * Validate GitHub API response shape before rendering.
     * Prevents crashes from malformed cache or unexpected API changes.
     */
    validateResponse({ user, repos, events }) {
        if (!user || typeof user !== 'object' || typeof user.login !== 'string') {
            throw new Error('Invalid user data');
        }
        if (!Array.isArray(repos)) {
            throw new Error('Invalid repos data');
        }
        if (!Array.isArray(events)) {
            throw new Error('Invalid events data');
        }
        // Validate individual repo objects have required fields
        for (const r of repos) {
            if (!r || typeof r !== 'object' || typeof r.name !== 'string') {
                throw new Error('Invalid repo entry');
            }
        }
    },

    /**
     * Calculate language breakdown from repos
     */
    calculateLanguageStats(repos) {
        const langCount = {};
        let total = 0;

        repos.forEach(repo => {
            if (repo.language) {
                langCount[repo.language] = (langCount[repo.language] || 0) + 1;
                total++;
            }
        });

        const stats = Object.entries(langCount)
            .map(([name, count]) => ({
                name,
                count,
                percent: Math.round((count / total) * 100)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3); // Top 3 languages

        return stats;
    },

    /**
     * Build commit timeline for last N days
     */
    buildCommitTimeline(events, days = 30) {
        const timeline = [];
        const now = new Date();

        // Initialize all days with 0 commits
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            timeline.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: 0
            });
        }

        // Count commits per day
        events
            .filter(e => e.type === 'PushEvent')
            .forEach(e => {
                const eventDate = new Date(e.created_at);
                const daysDiff = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));

                if (daysDiff >= 0 && daysDiff < days) {
                    const index = days - 1 - daysDiff;
                    if (timeline[index]) {
                        timeline[index].count += e.payload.commits?.length || 1;
                    }
                }
            });

        return timeline;
    },

    /**
     * Animate counter from 0 to target (delegates to shared dom-helpers)
     */
    animateCounter: animateCounter,

    /**
     * Fetch all necessary data: Profile, Repos, Activity
     */
    async getData() {
        // Check cache — validate shape before trusting localStorage data
        const parsed = loadJSON(this.cacheKey);
        if (parsed && Date.now() - parsed.timestamp < this.cacheTTL) {
            try {
                this.validateResponse(parsed.data);
                return parsed.data;
            } catch {
                // Corrupted cache — purge and re-fetch
                localStorage.removeItem(this.cacheKey);
            }
        }

        try {
            const safeFetch = async (url) => {
                const r = await fetchWithTimeout(url, { timeout: 8000 });
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            };
            // Parallel fetch
            const [user, repos, events] = await Promise.all([
                safeFetch(`https://api.github.com/users/${this.username}`),
                safeFetch(`https://api.github.com/users/${this.username}/repos?sort=updated&per_page=6`),
                safeFetch(`https://api.github.com/users/${this.username}/events/public?per_page=10`),
            ]);

            const data = { user, repos, events };

            // Validate shape before caching — reject malformed API responses
            this.validateResponse(data);

            // Save Cache
            saveJSON(this.cacheKey, { timestamp: Date.now(), data });

            return data;
        } catch (e) {
            console.error('GitHub API Error:', e);
            throw new Error('CONNECTION_REFUSED');
        }
    },

    /**
     * Render the dashboard into a container
     */
    async render(container) {
        container.innerHTML = `<div class="loading-data">ESTABLISHING SECURE LINK...</div>`;

        try {
            const data = await this.getData();
            const { user, repos, events } = data;

            // Calculate simple stats
            const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);
            const languageBreakdown = this.calculateLanguageStats(repos);
            const commitTimeline = this.buildCommitTimeline(events, 30);

            const html = `
                <div class="gh-dashboard">
                    <!-- Header Stats -->
                    <div class="gh-header">
                        <div class="gh-profile">
                            <img src="${Sanitize.attr(user.avatar_url)}" class="gh-avatar" alt="Avatar">
                            <div class="gh-info">
                                <h2>${Sanitize.text(user.login)}</h2>
                                <div class="gh-badges">
                                    <span class="gh-badge">PRO</span>
                                    <span class="gh-badge">HIREABLE</span>
                                </div>
                            </div>
                        </div>
                        <div class="gh-stat-grid">
                            <div class="gh-stat">
                                <span class="label">REPOSITORIES</span>
                                <span class="value">${Number(user.public_repos) || 0}</span>
                            </div>
                            <div class="gh-stat">
                                <span class="label">TOTAL STARS</span>
                                <span class="value">${totalStars}</span>
                            </div>
                            <div class="gh-stat">
                                <span class="label">STATUS</span>
                                <span class="value text-green">ONLINE</span>
                            </div>
                        </div>
                    </div>

                    <!-- Language Breakdown -->
                    <div class="gh-language-viz">
                        <h3>CODE DISTRIBUTION</h3>
                        <div class="gh-lang-rings">
                            ${languageBreakdown.map(lang => `
                                <div class="gh-lang-ring">
                                    <svg viewBox="0 0 100 100">
                                        <circle class="gh-ring-bg" cx="50" cy="50" r="40"/>
                                        <circle class="gh-ring-progress" cx="50" cy="50" r="40"
                                            style="stroke-dasharray: ${Number(lang.percent) * 2.51}, 251.2"/>
                                    </svg>
                                    <div class="gh-ring-label">
                                        <div class="gh-ring-percent">${Number(lang.percent)}%</div>
                                        <div class="gh-ring-lang">${Sanitize.text(lang.name)}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Commit Timeline -->
                    <div class="gh-commit-timeline">
                        <h3>COMMIT FREQUENCY (30 DAYS)</h3>
                        <div class="gh-timeline-bars">
                            ${commitTimeline.map((day, i) => `
                                <div class="gh-timeline-bar" style="--i: ${i}; height: ${Math.min(day.count * 20, 100)}px"
                                    title="${Sanitize.text(day.date)}: ${day.count} commits">
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="gh-cols">
                        <!-- Left: Activity Stream -->
                        <div class="gh-section">
                            <h3>LATEST TRANSMISSIONS (COMMITS)</h3>
                            <div class="gh-list">
                                ${events.filter(e => e.type === 'PushEvent').slice(0, 5).map(e => `
                                    <div class="gh-item">
                                        <div class="gh-item-header">
                                            <span class="gh-repo">${Sanitize.text(e.repo.name)}</span>
                                            <span class="gh-time">${new Date(e.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div class="gh-commit-msg">
                                            ${Sanitize.text(e.payload.commits?.[0]?.message || 'Code update')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Right: Active Projects -->
                        <div class="gh-section">
                            <h3>ACTIVE SECTORS</h3>
                            <div class="gh-grid">
                                ${repos.slice(0, 4).map(r => `
                                    <div class="gh-card" data-url="${Sanitize.attr(r.html_url)}">
                                        <div class="gh-card-top">
                                            <h4>${Sanitize.text(r.name)}</h4>
                                            ${r.language ? `<span class="gh-lang">${Sanitize.text(r.language)}</span>` : ''}
                                        </div>
                                        <p>${Sanitize.text(r.description || 'Access restricted.')}</p>
                                        <div class="gh-card-meta">
                                            <span>★ ${Number(r.stargazers_count) || 0}</span>
                                            <span>⑂ ${Number(r.forks_count) || 0}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Route through DOMPurify as defense-in-depth — individual fields are
            // already escaped, but a single missed interpolation could open XSS.
            Sanitize.setHTML(container, html);

            // Delegated click handler for repo cards (replaces inline onclick)
            container.querySelectorAll('.gh-card[data-url]').forEach(card => {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    const url = card.dataset.url;
                    if (url) openExternal(url);
                });
            });

            // Animate stat counters
            setTimeout(() => {
                const reposValue = container.querySelector('.gh-stat:nth-child(1) .value');
                const starsValue = container.querySelector('.gh-stat:nth-child(2) .value');

                if (reposValue) this.animateCounter(reposValue, user.public_repos);
                if (starsValue) this.animateCounter(starsValue, totalStars);
            }, 100);

        } catch (_err) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-state';
            Sanitize.setHTML(errorDiv, '<h3>CONNECTION FAILED</h3><p>UPLINK OFFLINE. RETRYING PROXY...</p>');
            const retryBtn = document.createElement('button');
            retryBtn.className = 'cyber-button';
            retryBtn.textContent = 'RETRY';
            retryBtn.addEventListener('click', async () => {
                const { Desktop } = await import('./desktop.js');
                Desktop.openGitHubCenter();
            });
            errorDiv.appendChild(retryBtn);
            container.textContent = '';
            container.appendChild(errorDiv);
        }
    }
};
