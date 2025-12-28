/**
 * GITHUB OPERATIONS CENTER
 * Handles live data fetching from GitHub API and rendering the dashboard.
 */
export const GitHub = {
    username: 'DareDev256',
    cacheKey: 'github_data_v1',
    cacheTTL: 1000 * 60 * 60, // 1 hour

    init() {
        // Prepare any listeners if needed
    },

    /**
     * Fetch all necessary data: Profile, Repos, Activity
     */
    async getData() {
        // Check cache
        const cached = localStorage.getItem(this.cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < this.cacheTTL) {
                return parsed.data;
            }
        }

        try {
            // Parallel fetch
            const [user, repos, events] = await Promise.all([
                fetch(`https://api.github.com/users/${this.username}`).then(r => r.json()),
                fetch(`https://api.github.com/users/${this.username}/repos?sort=updated&per_page=6`).then(r => r.json()),
                fetch(`https://api.github.com/users/${this.username}/events/public?per_page=10`).then(r => r.json())
            ]);

            const data = { user, repos, events };

            // Save Cache
            localStorage.setItem(this.cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data
            }));

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
            const mainLang = 'TypeScript'; // Hardcoded preference or calculated

            const html = `
                <div class="gh-dashboard">
                    <!-- Header Stats -->
                    <div class="gh-header">
                        <div class="gh-profile">
                            <img src="${user.avatar_url}" class="gh-avatar" alt="Avatar">
                            <div class="gh-info">
                                <h2>${user.login}</h2>
                                <div class="gh-badges">
                                    <span class="gh-badge">PRO</span>
                                    <span class="gh-badge">HIREABLE</span>
                                </div>
                            </div>
                        </div>
                        <div class="gh-stat-grid">
                            <div class="gh-stat">
                                <span class="label">REPOSITORIES</span>
                                <span class="value">${user.public_repos}</span>
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

                    <div class="gh-cols">
                        <!-- Left: Activity Stream -->
                        <div class="gh-section">
                            <h3>LATEST TRANSMISSIONS (COMMITS)</h3>
                            <div class="gh-list">
                                ${events.filter(e => e.type === 'PushEvent').slice(0, 5).map(e => `
                                    <div class="gh-item">
                                        <div class="gh-item-header">
                                            <span class="gh-repo">${e.repo.name}</span>
                                            <span class="gh-time">${new Date(e.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div class="gh-commit-msg">
                                            ${e.payload.commits?.[0]?.message || 'Code update'}
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
                                    <div class="gh-card" onclick="window.open('${r.html_url}', '_blank')">
                                        <div class="gh-card-top">
                                            <h4>${r.name}</h4>
                                            ${r.language ? `<span class="gh-lang">${r.language}</span>` : ''}
                                        </div>
                                        <p>${r.description || 'Access restricted.'}</p>
                                        <div class="gh-card-meta">
                                            <span>★ ${r.stargazers_count}</span>
                                            <span>⑂ ${r.forks_count}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = html;

        } catch (err) {
            container.innerHTML = `
                <div class="error-state">
                    <h3>CONNECTION FAILED</h3>
                    <p>UPLINK OFFLINE. RETRYING PROXY...</p>
                    <button class="cyber-button" onclick="Desktop.openGitHubCenter()">RETRY</button>
                </div>
            `;
        }
    }
};
