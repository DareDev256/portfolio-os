/* screens.js: what each station's monitor shows (4.66.0).
 *
 * Every station screen shows that source's real work, the same footage the
 * Monitor cuts to: site walkthroughs, the Final Cut timeline, the filmed agent
 * run, the films. Stills show their still, the Registry draws the live repo
 * graph from registry-graph.json, and sixjutsu, which has nothing to show yet,
 * shows static. Over each one sits the Monitor's own label (role, date, REC)
 * and a lower third read from its slate, with figures from figures.json.
 *
 * A phone cannot decode sixteen videos, so only a few screens play at once:
 * the one on air, the one you picked, then the ones nearest the middle of the
 * frame. The rest hold their poster with a slow push-in. Video comes from the
 * 480px station copies (tools/studio/make-feeds.mjs) when one exists.
 */
import { textOf, fig, DASH } from './slates.js';
import { activitySummary, agentFeedLabel } from '../monitor.js';

export const W = 480;
export const H = 288;
const ASPECT = W / H;

/** The station copy of a Monitor clip, or the clip itself when there is none. */
export const feedFor = (clip, manifest) => manifest?.clips?.[clip] || clip;

/** Crop a texture of srcW x srcH to fill the screen's aspect (UV repeat and offset). */
export function coverFit(srcW, srcH, aspect = ASPECT) {
    if (!srcW || !srcH) return { rx: 1, ry: 1, ox: 0, oy: 0 };
    const a = srcW / srcH;
    const rx = a > aspect ? aspect / a : 1;
    const ry = a > aspect ? 1 : a / aspect;
    return { rx, ry, ox: (1 - rx) / 2, oy: (1 - ry) / 2 };
}

/** What kind of picture a source has. */
export function screenKind(c) {
    if (c.kind === 'none') return 'none';
    if (c.kind === 'graph') return 'graph';
    if (c.clips?.length) return 'clips';
    if (c.still) return 'still';
    return 'none';
}

/** The lower-third lines for a source. Every number comes through figures.json or a dash. */
export function lowerThirds(c, figures, data = {}) {
    const lines = [];
    if (c.kind === 'log') {
        const run = data.agentFeed && agentFeedLabel(data.agentFeed);
        if (run && data.agentFeed.task) lines.push(`RUN ${run} · ${data.agentFeed.task}`);
        for (const e of data.activity?.events || []) lines.push(`${e.time} ${e.label}`);
        if (data.activity?.generatedAt) lines.push(activitySummary(data.activity).text);
    }
    if (c.kind === 'graph' && data.registry?.totals) {
        const t = data.registry.totals;
        lines.push(`${t.repos} repos · ${t.public} public · ${t.archived} archived`);
    }
    for (const s of c.stats || []) lines.push(`${textOf(s.value, figures) || DASH} ${s.label}`);
    if (!lines.length) lines.push(textOf(c.what, figures).split('. ')[0] || c.scene);
    return lines;
}

function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
}

/**
 * @param {object} THREE three module
 * @param {object} o { feeds: Promise<manifest>, data: { activity, registry, agentFeed }, figures: () => object, maxLive }
 */
export function createScreens(THREE, o) {
    const list = [];
    let feeds = null;
    o.feeds.then((m) => { feeds = m; });
    const geo = new THREE.PlaneGeometry(1, 1);
    const tmp = new THREE.Vector3();

    function tex(c, nearest) {
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        if (nearest) t.magFilter = t.minFilter = THREE.NearestFilter;
        return t;
    }

    /** Mount a screen for crew member c on anchor (an Object3D at the monitor face). */
    function add(c, anchor, size) {
        const kind = screenKind(c);
        const s = { c, kind, anchor, live: false, onAir: false, focus: false, visible: true, line: 0, clip: 0, chromeAt: -1, phase: Math.random() * 10 };
        s.baseMat = new THREE.MeshBasicMaterial({ color: 0x0b0c10, toneMapped: false });
        s.base = new THREE.Mesh(geo, s.baseMat);
        s.base.scale.set(size.w, size.h, 1);
        anchor.add(s.base);
        s.chromeCanvas = canvas(W, H);
        s.chromeTex = tex(s.chromeCanvas);
        s.over = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: s.chromeTex, transparent: true, toneMapped: false, depthWrite: false }));
        s.over.scale.set(size.w, size.h, 1);
        s.over.position.z = 0.002;
        s.over.renderOrder = 2;
        anchor.add(s.over);
        if (kind === 'clips' || kind === 'still') {
            const src = kind === 'still' ? c.still : c.poster;
            s.posterCanvas = canvas(W, H);
            s.posterTex = tex(s.posterCanvas);
            if (src) {
                const img = new Image();
                img.decoding = 'async';
                img.onload = () => {
                    const f = coverFit(img.naturalWidth, img.naturalHeight);
                    s.posterCanvas.getContext('2d').drawImage(img, f.ox * img.naturalWidth, f.oy * img.naturalHeight, f.rx * img.naturalWidth, f.ry * img.naturalHeight, 0, 0, W, H);
                    s.posterTex.needsUpdate = true;
                    if (!s.live) show(s, s.posterTex);
                };
                img.src = src;
            }
        } else if (kind === 'graph') {
            s.graphCanvas = canvas(W, H);
            s.graphTex = tex(s.graphCanvas);
            show(s, s.graphTex);
        } else {
            s.noiseCanvas = canvas(120, 72);
            s.noiseTex = tex(s.noiseCanvas, true);
            show(s, s.noiseTex);
        }
        list.push(s);
        return s;
    }

    function show(s, t) {
        if (s.baseMat.map === t) return;
        s.baseMat.map = t;
        s.baseMat.color.set(0xffffff);
        s.baseMat.needsUpdate = true;
    }

    function clipList(s) {
        return s.c.clips.map((x) => feedFor(x, feeds));
    }

    function startVideo(s) {
        if (!s.video) {
            const v = document.createElement('video');
            v.muted = true;
            v.defaultMuted = true;
            v.playsInline = true;
            v.setAttribute('playsinline', '');
            v.setAttribute('muted', '');
            v.preload = 'auto';
            v.loop = s.c.clips.length === 1;
            v.src = clipList(s)[0];
            v.addEventListener('loadedmetadata', () => fitVideo(s));
            v.addEventListener('ended', () => {
                s.clip = (s.clip + 1) % s.c.clips.length;
                v.src = clipList(s)[s.clip];
                s.chromeAt = -1;
                v.play().catch(() => {});
            });
            s.video = v;
            s.videoTex = new THREE.VideoTexture(v);
            s.videoTex.colorSpace = THREE.SRGBColorSpace;
        }
        const p = s.video.play();
        if (p) p.then(() => { if (s.live) show(s, s.videoTex); }).catch(() => { s.live = false; });
        else show(s, s.videoTex);
    }

    function fitVideo(s) {
        const f = coverFit(s.video.videoWidth, s.video.videoHeight);
        s.videoTex.repeat.set(f.rx, f.ry);
        s.videoTex.offset.set(f.ox, f.oy);
    }

    function setLive(s, on) {
        if (s.kind !== 'clips' || s.live === on) return;
        s.live = on;
        s.chromeAt = -1;
        if (on) startVideo(s);
        else {
            s.video?.pause();
            if (s.posterTex) show(s, s.posterTex);
        }
    }

    /** Which screens play: on air first, then the one picked, then nearest the middle of the frame. */
    function choose(camera) {
        const ranked = [];
        for (const s of list) {
            s.anchor.getWorldPosition(tmp);
            const d = camera.position.distanceTo(tmp);
            tmp.project(camera);
            s.visible = tmp.z < 1 && Math.abs(tmp.x) < 1.15 && Math.abs(tmp.y) < 1.15;
            if (s.kind !== 'clips') continue;
            let score = s.visible ? 100 - d * 2 - Math.abs(tmp.x) * 25 : -1;
            if (s.focus) score = 2000;
            else if (s.onAir) score = 1000;
            ranked.push([score, s]);
        }
        ranked.sort((a, b) => b[0] - a[0]);
        ranked.forEach(([score, s], i) => setLive(s, score > 0 && i < o.maxLive));
    }

    function drawChrome(s, t) {
        const x = s.chromeCanvas.getContext('2d');
        const c = s.c;
        x.clearRect(0, 0, W, H);
        x.fillStyle = 'rgba(8,9,12,.74)';
        x.fillRect(0, 0, W, 34);
        x.fillStyle = c.tint;
        x.fillRect(12, 11, 12, 12);
        x.fillStyle = '#fff';
        x.font = '700 16px "JetBrains Mono", monospace';
        x.textBaseline = 'middle';
        x.fillText(c.role, 32, 18);
        x.textAlign = 'right';
        if (s.onAir) {
            x.fillStyle = '#ff2d55';
            x.fillRect(W - 98, 6, 90, 22);
            x.fillStyle = '#fff';
            x.font = '800 14px "JetBrains Mono", monospace';
            x.fillText('ON AIR', W - 18, 18);
        } else {
            const dot = s.kind !== 'none' && s.kind !== 'still';
            x.fillStyle = '#c9ccd3';
            x.font = '600 13px "JetBrains Mono", monospace';
            const label = s.kind === 'none' ? 'NO SIGNAL' : c.date || '';
            x.fillText(label, dot ? W - 30 : W - 12, 18);
            if (dot) {
                x.fillStyle = Math.floor(t * 1.4) % 2 ? 'rgba(255,45,85,.35)' : '#ff2d55';
                x.beginPath();
                x.arc(W - 17, 17, 5, 0, 7);
                x.fill();
            }
        }
        x.textAlign = 'left';
        const g = x.createLinearGradient(0, H - 92, 0, H);
        g.addColorStop(0, 'rgba(8,9,12,0)');
        g.addColorStop(0.45, 'rgba(8,9,12,.72)');
        g.addColorStop(1, 'rgba(8,9,12,.9)');
        x.fillStyle = g;
        x.fillRect(0, H - 92, W, 92);
        x.fillStyle = '#fff';
        x.font = '800 28px Archivo, "Arial Narrow", sans-serif';
        x.textBaseline = 'alphabetic';
        x.fillText(c.scene, 14, H - 36);
        const lines = s.lines || [];
        let l = lines.length ? lines[s.line % lines.length] : '';
        if (s.kind === 'clips' && c.tags?.length) l = `NOW · ${c.tags[s.clip % c.tags.length]}`;
        x.fillStyle = c.tint;
        x.font = '600 15px "JetBrains Mono", monospace';
        while (l.length > 4 && x.measureText(l).width > W - 28) l = `${l.slice(0, -2).trimEnd()}…`;
        x.fillText(l, 14, H - 13);
        if (s.kind === 'none') {
            x.fillStyle = 'rgba(8,9,12,.78)';
            x.fillRect(W / 2 - 120, H / 2 - 30, 240, 46);
            x.fillStyle = '#fff';
            x.textAlign = 'center';
            x.font = '800 24px Archivo, "Arial Narrow", sans-serif';
            x.fillText('IN TRAINING', W / 2, H / 2 + 1);
            x.textAlign = 'left';
        }
        if (s.onAir) {
            x.strokeStyle = '#ff2d55';
            x.lineWidth = 8;
            x.strokeRect(4, 4, W - 8, H - 8);
        }
        s.chromeTex.needsUpdate = true;
    }

    function drawGraph(s, t) {
        const x = s.graphCanvas.getContext('2d');
        const r = o.data.registry;
        x.fillStyle = '#0b0d12';
        x.fillRect(0, 0, W, H);
        if (!r?.nodes) {
            x.fillStyle = '#5c5e66';
            x.font = '600 14px "JetBrains Mono", monospace';
            x.fillText('registry graph did not load', 20, H / 2);
            s.graphTex.needsUpdate = true;
            return;
        }
        const cx = W / 2;
        const cy = H / 2 - 8;
        const n = r.nodes.length;
        const rot = t * 0.06;
        for (let i = 0; i < r.unnamed; i++) {
            const a = (i / r.unnamed) * Math.PI * 2 - rot * 0.6;
            x.fillStyle = 'rgba(201,204,211,.28)';
            x.fillRect(cx + Math.cos(a) * 214 - 1, cy + Math.sin(a) * 96 - 1, 2.5, 2.5);
        }
        r.nodes.forEach((nd, i) => {
            const a = (i / n) * Math.PI * 2 + rot;
            const px = cx + Math.cos(a) * 150;
            const py = cy + Math.sin(a) * 66;
            x.strokeStyle = `rgba(255,179,106,${0.12 + nd.heat * 0.3})`;
            x.lineWidth = 1;
            x.beginPath();
            x.moveTo(cx, cy);
            x.lineTo(px, py);
            x.stroke();
            const pulse = nd.heat > 0.9 ? 1 + 0.12 * Math.sin(t * 3 + i) : 1;
            x.fillStyle = `rgba(255,179,106,${0.25 + nd.heat * 0.75})`;
            x.beginPath();
            x.arc(px, py, nd.r * 0.42 * pulse, 0, 7);
            x.fill();
        });
        x.fillStyle = '#fff';
        x.beginPath();
        x.arc(cx, cy, 15, 0, 7);
        x.fill();
        x.fillStyle = '#0b0d12';
        x.font = '800 9px "JetBrains Mono", monospace';
        x.textAlign = 'center';
        x.fillText('CORE', cx, cy + 3);
        x.textAlign = 'left';
        s.graphTex.needsUpdate = true;
    }

    function drawNoise(s) {
        const c = s.noiseCanvas.getContext('2d');
        const img = c.createImageData(120, 72);
        for (let i = 0; i < img.data.length; i += 4) {
            const v = (Math.random() * 120 + 20) | 0;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
            img.data[i + 3] = 255;
        }
        c.putImageData(img, 0, 0);
        s.noiseTex.needsUpdate = true;
    }

    let chooseAt = 0;
    let lineAt = 0;
    let frame = 0;
    /** Per frame. onAir and focus are crew ids (or null). */
    function update(t, camera, onAir, focus) {
        frame += 1;
        if (t - lineAt > 3.6) {
            lineAt = t;
            for (const s of list) { s.line += 1; s.chromeAt = -1; }
        }
        for (const s of list) {
            const air = s.c.id === onAir;
            const foc = s.c.id === focus;
            if (air !== s.onAir || foc !== s.focus) { s.onAir = air; s.focus = foc; s.chromeAt = -1; chooseAt = 0; }
        }
        if (t - chooseAt > 0.5) { chooseAt = t; choose(camera); }
        list.forEach((s, i) => {
            if (s.chromeAt < 0 || t - s.chromeAt > 1 + (i % 4) * 0.07) { s.chromeAt = t; drawChrome(s, t); }
            if (!s.visible) return;
            if (s.kind === 'graph' && frame % 6 === i % 6) drawGraph(s, t);
            if (s.kind === 'none' && frame % 4 === 0) drawNoise(s);
            const still = !s.live && s.posterTex;
            if (still) {
                const k = (Math.sin((t + s.phase) * 0.12) + 1) / 2;
                const z = 0.92 + 0.08 * (1 - k);
                s.posterTex.repeat.set(z, z);
                s.posterTex.offset.set((1 - z) * (0.3 + 0.4 * k), (1 - z) * 0.5);
            }
        });
    }

    /** New figures or data: rebuild every lower third. */
    function refresh() {
        const f = o.figures();
        for (const s of list) {
            s.lines = lowerThirds(s.c, f, o.data);
            s.chromeAt = -1;
        }
    }

    return { add, update, refresh, list, fig };
}

/** The LED ribbon on the riser's face: the jobs' own log, scrolling. */
export function createRibbon(THREE, { center, radius, a0, a1, y, h }) {
    const c = canvas(2048, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.anisotropy = 4;
    const len = radius * (a1 - a0);
    const geo = new THREE.CylinderGeometry(radius, radius, h, 96, 1, true, Math.PI - a1, a1 - a0);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, toneMapped: false }));
    mesh.position.set(center.x, y, center.z);
    /** parts: [{ text, color }]. Drawn once at its own width, so the wrap is seamless. */
    function setText(parts) {
        const x = c.getContext('2d');
        const font = '600 34px "JetBrains Mono", monospace';
        x.font = font;
        const gap = 70;
        let width = 0;
        const keep = [];
        for (const p of parts) {
            const w = x.measureText(p.text).width + gap;
            if (width + w > 8192) break;
            keep.push([p, w]);
            width += w;
        }
        c.width = Math.max(512, Math.ceil(width));
        x.fillStyle = '#0a0b0e';
        x.fillRect(0, 0, c.width, 64);
        x.font = font;
        x.textBaseline = 'middle';
        let px = gap / 2;
        for (const [p, w] of keep) {
            x.fillStyle = p.color || '#e6e7eb';
            x.fillText(p.text, px, 34);
            px += w;
        }
        // Seen from inside the arc the texture runs right to left, so repeat is negative.
        t.repeat.set(-len / (h * (c.width / 64)), 1);
        t.dispose();
        t.needsUpdate = true;
    }
    return { mesh, setText, update: (dt) => { t.offset.x += (dt * 0.17) / (h * (c.width / 64)); } };
}
