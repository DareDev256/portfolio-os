/**
 * Pixel Loader / Digital Creature
 * A Digimon-inspired 8x8 pixel creature for loading states
 */

export class PixelLoader {
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.type = options.type || 'loading'; // loading, sending, success, error
        this.message = options.message || 'LOADING...';
        this.onComplete = options.onComplete || null;
        this.element = null;
        this.interval = null;
        this.frame = 0;

        // 8x8 Pixel Art Frames (0 = transparent, 1 = primary color, 2 = secondary color)
        this.frames = {
            idle: [
                [
                    [0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 1, 1, 1, 1, 0, 0],
                    [0, 1, 1, 1, 1, 1, 1, 0],
                    [1, 1, 2, 1, 1, 2, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1],
                    [0, 1, 1, 0, 0, 1, 1, 0],
                    [0, 1, 0, 0, 0, 0, 1, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0]
                ],
                [
                    [0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 1, 1, 1, 1, 0, 0],
                    [0, 1, 1, 1, 1, 1, 1, 0],
                    [1, 1, 2, 1, 1, 2, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1],
                    [0, 1, 1, 0, 0, 1, 1, 0],
                    [0, 0, 1, 0, 0, 1, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0]
                ]
            ],
            sending: [
                [
                    [0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 1, 1, 0, 0, 0],
                    [0, 0, 1, 1, 1, 1, 0, 0],
                    [0, 1, 1, 2, 1, 2, 1, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1],
                    [0, 1, 0, 1, 1, 0, 1, 0],
                    [0, 0, 0, 1, 1, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0]
                ],
                [
                    [0, 0, 0, 1, 1, 0, 0, 0],
                    [0, 0, 1, 1, 1, 1, 0, 0],
                    [0, 1, 1, 2, 1, 2, 1, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1],
                    [0, 1, 0, 1, 1, 0, 1, 0],
                    [0, 0, 0, 1, 1, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0]
                ]
            ],
            success: [
                [
                    [0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 1, 1, 1, 1, 0, 0],
                    [0, 1, 1, 1, 1, 1, 1, 0],
                    [1, 1, 2, 1, 1, 2, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1],
                    [0, 0, 1, 0, 0, 1, 0, 0],
                    [0, 1, 0, 1, 1, 0, 1, 0],
                    [1, 0, 0, 0, 0, 0, 0, 1]
                ],
                [
                    [0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 1, 1, 1, 1, 0, 0],
                    [0, 1, 1, 1, 1, 1, 1, 0],
                    [1, 2, 2, 1, 1, 2, 2, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1],
                    [0, 0, 1, 0, 0, 1, 0, 0],
                    [0, 1, 0, 1, 1, 0, 1, 0],
                    [0, 1, 0, 0, 0, 0, 1, 0]
                ]
            ]
        };

        this.init();
    }

    init() {
        // Create container
        this.element = document.createElement('div');
        this.element.className = 'pixel-loader-overlay';
        this.element.innerHTML = `
            <div class="pixel-creature">
                <div class="pixel-grid"></div>
            </div>
            <div class="pixel-message"></div>
            <div class="pixel-bar">
                <div class="pixel-bar-fill"></div>
            </div>
        `;

        // Set message text safely (no innerHTML interpolation)
        this.element.querySelector('.pixel-message').textContent = this.message;

        // Add styles if not exists
        if (!document.getElementById('pixel-loader-style')) {
            const style = document.createElement('style');
            style.id = 'pixel-loader-style';
            style.textContent = `
                .pixel-loader-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(10, 10, 20, 0.95);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                    backdrop-filter: blur(10px);
                    animation: fadeIn 0.3s ease;
                }
                .pixel-creature {
                    width: 64px;
                    height: 64px;
                    margin-bottom: 20px;
                }
                .pixel-grid {
                    display: grid;
                    grid-template-columns: repeat(8, 1fr);
                    grid-template-rows: repeat(8, 1fr);
                    width: 100%;
                    height: 100%;
                }
                .pixel {
                    width: 100%;
                    height: 100%;
                }
                .pixel.c-1 { background: var(--neon-cyan); box-shadow: 0 0 5px var(--neon-cyan); }
                .pixel.c-2 { background: #fff; }
                .pixel-message {
                    color: var(--neon-cyan);
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    letter-spacing: 2px;
                    margin-bottom: 15px;
                    font-size: 14px;
                    text-shadow: 0 0 10px var(--neon-cyan);
                }
                .pixel-bar {
                    width: 200px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                }
                .pixel-bar-fill {
                    height: 100%;
                    background: var(--neon-cyan);
                    width: 0%;
                    transition: width 0.2s linear;
                    box-shadow: 0 0 10px var(--neon-cyan);
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `;
            document.head.appendChild(style);
        }

        this.container.appendChild(this.element);
        this.startAnimation();

        // If sending, simulate progress
        if (this.type === 'sending') {
            this.simulateProgress();
        }
    }

    startAnimation() {
        this.interval = setInterval(() => {
            this.frame = 1 - this.frame; // Toggle 0/1
            this.renderFrame();
        }, 500);
        this.renderFrame();
    }

    renderFrame() {
        const grid = this.element.querySelector('.pixel-grid');
        grid.innerHTML = '';

        const currentFrames = this.frames[this.type] || this.frames.idle;
        const frameData = currentFrames[this.frame];

        frameData.forEach(row => {
            row.forEach(pixel => {
                const div = document.createElement('div');
                div.className = `pixel ${pixel ? `c-${pixel}` : ''}`;
                grid.appendChild(div);
            });
        });
    }

    simulateProgress() {
        const bar = this.element.querySelector('.pixel-bar-fill');
        let width = 0;

        this.progressInterval = setInterval(() => {
            width += Math.random() * 15;
            if (width > 100) width = 100;
            bar.style.width = `${width}%`;

            if (width === 100) {
                clearInterval(this.progressInterval);
                this.progressInterval = null;
                setTimeout(() => {
                    this.updateState('success', 'MESSAGE SENT!');
                    setTimeout(() => {
                        this.destroy();
                        if (this.onComplete) this.onComplete();
                    }, 1500);
                }, 500);
            }
        }, 200);
    }

    updateState(type, message) {
        this.type = type;
        this.message = message;
        this.element.querySelector('.pixel-message').textContent = message;
        this.renderFrame();
    }

    destroy() {
        if (this.interval) clearInterval(this.interval);
        if (this.progressInterval) clearInterval(this.progressInterval);
        if (this.element && this.element.parentNode) {
            this.element.style.opacity = '0';
            setTimeout(() => {
                this.element.remove();
            }, 300);
        }
    }
}
