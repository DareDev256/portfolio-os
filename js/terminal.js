/**
 * ENTERPRISE CONSOLE (TERMINAL)
 * A fully interactive CLI for the portfolio.
 * "The Sauce" - proves backend/devops competence.
 */
import { Sanitize } from './sanitize.js';

export const Terminal = {
    history: [],
    historyIndex: -1,
    fileSystem: {
        'resume.json': 'ACCESS_DENIED: Try "cat resume.txt" or contact for PDF.',
        'secrets.env': 'nice_try_buddy=true',
        'skills.log': 'Use "sys scan" to view technical capabilities.',
        'config.yml': 'env: production\nvisuals: ultra\nmode: enterprise'
    },

    init(container) {
        this.container = container;
        this.render();
        this.attachListeners();
        this.printWelcome();
    },

    render() {
        this.container.innerHTML = `
            <div class="terminal-screen">
                <div class="terminal-output" id="termOutput"></div>
                <div class="terminal-input-line">
                    <span class="term-prompt">daredev256@passion-os:~$</span>
                    <input type="text" class="term-input" id="termInput" autocomplete="off" spellcheck="false">
                </div>
            </div>
        `;
        this.output = this.container.querySelector('#termOutput');
        this.input = this.container.querySelector('#termInput');
    },

    attachListeners() {
        this.container.addEventListener('click', () => this.input.focus());

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = this.input.value.trim();
                if (cmd) this.handleCommand(cmd);
                this.input.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.history.length > 0) {
                    this.historyIndex = Math.min(this.historyIndex + 1, this.history.length - 1);
                    this.input.value = this.history[this.history.length - 1 - this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.input.value = this.history[this.history.length - 1 - this.historyIndex];
                } else {
                    this.historyIndex = -1;
                    this.input.value = '';
                }
            }
        });
    },

    printWelcome() {
        this.println('PASSION OS [Version 2.56.0-enterprise]');
        this.println('(c) DareDev256. All rights reserved.');
        this.println('');
        this.println('Type "help" for available commands.');
        this.println('');
    },

    println(text, className = '') {
        const line = document.createElement('div');
        line.className = `term-line ${className}`;
        line.textContent = text;
        this.output.appendChild(line);
        this.scrollToBottom();
    },

    printHTML(html) {
        const line = document.createElement('div');
        line.className = 'term-line';
        line.innerHTML = Sanitize.html(html);
        this.output.appendChild(line);
        this.scrollToBottom();
    },

    scrollToBottom() {
        this.output.scrollTop = this.output.scrollHeight;
    },

    async handleCommand(cmdRaw) {
        this.history.push(cmdRaw);
        this.historyIndex = -1;

        // Echo
        this.printHTML(`<span class="term-prompt">daredev256@passion-os:~$</span> ${Sanitize.text(cmdRaw)}`);

        const parts = cmdRaw.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (cmd) {
            case 'help':
                this.printHTML(`
                    <span class="term-cyan">Available Commands:</span>
                    - <span class="term-cmd">sys</span> [info|scan]   View system metrics
                    - <span class="term-cmd">cat</span> [file]        Read file
                    - <span class="term-cmd">ls</span>                List files
                    - <span class="term-cmd">deploy</span>            Trigger deployment sim
                    - <span class="term-cmd">clear</span>             Clear screen
                    - <span class="term-cmd">whoami</span>            User info
                    - <span class="term-cmd">sudo</span>              Admin access
                `);
                break;

            case 'clear':
                this.output.innerHTML = '';
                break;

            case 'whoami':
                this.println('root (just kidding, you are a visitor)');
                break;

            case 'ls':
                this.println(Object.keys(this.fileSystem).join('  '));
                break;

            case 'cat':
                if (!args[0]) {
                    this.println('Usage: cat [filename]');
                } else if (this.fileSystem[args[0]]) {
                    this.println(this.fileSystem[args[0]]);
                } else {
                    this.println(`cat: ${Sanitize.text(args[0])}: No such file or directory`, 'term-error');
                }
                break;

            case 'sys':
                if (args[0] === 'scan') {
                    this.runSystemScan();
                } else {
                    this.println('CPU: 98% (Thinking about code)');
                    this.println('RAM: 128TB (Downloading internet)');
                    this.println('UPTIME: Infinity');
                }
                break;

            case 'deploy':
                this.runDeployment();
                break;

            default:
                // Check for easter egg sass responses (use full command for multi-word commands)
                const sassResponse = window.__InteractionEngine?.easterEggs?.getTerminalSass(cmdRaw);
                if (sassResponse) {
                    this.println(sassResponse);
                } else {
                    this.println(`Command not found: ${Sanitize.text(cmd)}`, 'term-error');
                }
        }
    },

    async runDeployment() {
        const steps = [
            'Initializing Pipeline...',
            'Building Container...',
            'Running Tests (Unit, Integration, E2E)...',
            'Tests Passed (142/142) ✔',
            'Pushing to Production...',
            'Verifying Health Checks...',
            'DEPLOYMENT SUCCESSFUL 🚀'
        ];

        for (const step of steps) {
            this.println(step, 'term-dim');
            await new Promise(r => setTimeout(r, 600));
        }
    },

    async runSystemScan() {
        this.println('SCANNING TECHNICAL ABILITIES...', 'term-cyan');
        const skills = [
            'Analyzing JavaScript Heap........... OK',
            'Checking React Component Tree....... OK',
            'Verifying Server-Side Physics....... OK',
            'Testing Database Connectivity....... OK',
            'Evaluating UI/UX Heuristics......... 100%'
        ];

        for (const skill of skills) {
            await new Promise(r => setTimeout(r, 400));
            this.println(skill);
        }
        this.println('SYSTEM INTEGRITY: MAXIMUM', 'term-green');
    }
};
