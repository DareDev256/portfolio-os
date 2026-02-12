import { State } from './state.js';

/**
 * System Monitor — real-time performance dashboard for Passion OS.
 * Shows live FPS, memory, uptime, window count, and network info
 * using actual browser APIs (Performance, Navigator, etc.)
 */

const SESSION_START = Date.now();

function formatUptime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

function createGauge(label, value, max, color, unit = '') {
    const pct = Math.min(100, (value / max) * 100);
    return `
        <div class="sysmon-gauge">
            <div class="sysmon-gauge-label">${label}</div>
            <div class="sysmon-gauge-bar">
                <div class="sysmon-gauge-fill" style="width:${pct}%;background:${color};box-shadow:0 0 8px ${color}55;"></div>
            </div>
            <div class="sysmon-gauge-value" style="color:${color};">${typeof value === 'number' ? Math.round(value) : value}${unit}</div>
        </div>`;
}

export function renderSystemMonitor(container) {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'sysmon';

    // Header
    const header = document.createElement('div');
    header.className = 'sysmon-header';
    header.innerHTML = `<span class="sysmon-pulse"></span> SYSTEM DIAGNOSTICS <span style="opacity:0.4;font-size:10px;margin-left:8px;">LIVE</span>`;
    wrapper.appendChild(header);

    // Metrics grid
    const grid = document.createElement('div');
    grid.className = 'sysmon-grid';
    wrapper.appendChild(grid);

    // Graph area
    const graphSection = document.createElement('div');
    graphSection.className = 'sysmon-graph-section';
    graphSection.innerHTML = `<div class="sysmon-graph-label">FPS HISTORY</div>`;
    const canvas = document.createElement('canvas');
    canvas.className = 'sysmon-canvas';
    canvas.width = 280;
    canvas.height = 80;
    graphSection.appendChild(canvas);
    wrapper.appendChild(graphSection);

    // System info table
    const infoTable = document.createElement('div');
    infoTable.className = 'sysmon-info';
    wrapper.appendChild(infoTable);

    container.appendChild(wrapper);

    // FPS tracking
    const fpsHistory = new Array(70).fill(0);
    let frameCount = 0;
    let lastFpsTime = performance.now();
    let currentFps = 0;
    let rafId = null;
    let intervalId = null;

    const measureFps = (now) => {
        frameCount++;
        const delta = now - lastFpsTime;
        if (delta >= 500) {
            currentFps = Math.round((frameCount / delta) * 1000);
            frameCount = 0;
            lastFpsTime = now;
            fpsHistory.push(currentFps);
            if (fpsHistory.length > 70) fpsHistory.shift();
        }
        rafId = requestAnimationFrame(measureFps);
    };
    rafId = requestAnimationFrame(measureFps);

    // Draw FPS graph
    function drawGraph() {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = 'rgba(0,240,255,0.08)';
        ctx.lineWidth = 0.5;
        for (let y = 0; y < h; y += 20) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // FPS line
        const maxFps = 120;
        ctx.beginPath();
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 4;

        fpsHistory.forEach((fps, i) => {
            const x = (i / (fpsHistory.length - 1)) * w;
            const y = h - (Math.min(fps, maxFps) / maxFps) * h;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Fill under curve
        const lastIdx = fpsHistory.length - 1;
        ctx.lineTo((lastIdx / (fpsHistory.length - 1)) * w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,255,136,0.05)';
        ctx.fill();
    }

    // Update loop
    function update() {
        const windows = State.getAllWindows();
        const mem = performance.memory; // Chrome only
        const nav = performance.getEntriesByType('navigation')[0];
        const conn = navigator.connection;

        const heapUsed = mem ? mem.usedJSHeapSize : 0;
        const heapLimit = mem ? mem.jsHeapSizeLimit : 1;
        const loadTime = nav ? Math.round(nav.loadEventEnd - nav.startTime) : 0;

        // Gauge metrics
        let gauges = '';
        gauges += createGauge('FPS', currentFps, 120, currentFps > 50 ? '#00ff88' : currentFps > 25 ? '#ffaa00' : '#ff0066');
        if (mem) {
            gauges += createGauge('HEAP', heapUsed / 1048576, heapLimit / 1048576, '#00f0ff', ' MB');
        }
        gauges += createGauge('WINDOWS', windows.length, 12, '#ff00aa');
        gauges += createGauge('DOM', document.querySelectorAll('*').length, 3000, '#aa00ff');
        grid.innerHTML = gauges;

        // System info
        const uptime = formatUptime(Date.now() - SESSION_START);
        let rows = `
            <div class="sysmon-row"><span>SESSION UPTIME</span><span style="color:#00f0ff;">${uptime}</span></div>
            <div class="sysmon-row"><span>PAGE LOAD</span><span style="color:#00ff88;">${loadTime}ms</span></div>
            <div class="sysmon-row"><span>PLATFORM</span><span>${navigator.platform || 'Unknown'}</span></div>
            <div class="sysmon-row"><span>LANGUAGE</span><span>${navigator.language}</span></div>
            <div class="sysmon-row"><span>CORES</span><span style="color:#ffaa00;">${navigator.hardwareConcurrency || '?'}</span></div>`;
        if (conn) {
            rows += `<div class="sysmon-row"><span>NETWORK</span><span style="color:#00ff88;">${conn.effectiveType?.toUpperCase() || '?'} · ${conn.downlink || '?'} Mbps</span></div>`;
        }
        if (mem) {
            rows += `<div class="sysmon-row"><span>HEAP TOTAL</span><span>${formatBytes(mem.totalJSHeapSize)}</span></div>`;
        }
        infoTable.innerHTML = rows;

        drawGraph();
    }

    // Initial + periodic updates
    update();
    intervalId = setInterval(update, 1000);

    // Return cleanup function
    return () => {
        clearInterval(intervalId);
        if (rafId) cancelAnimationFrame(rafId);
    };
}
