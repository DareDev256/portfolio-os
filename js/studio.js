/* studio.js: THE STUDIO at /studio (4.65.0).
 *
 * The Monitor's crew, standing on a white soundstage. A canvas world (three
 * 0.170, the same pinned build /os loads) with a thin HUD over it:
 *   - 16 agents at stations, read from the homepage's own switcher and slates
 *     (js/studio/slates.js), each holding its tool from crew.js;
 *   - three cleared gates and every station screen fed by figures.json, with
 *     its age, and a dash for anything the file does not carry;
 *   - the director's monitor drops into Passion OS (studio skin, a working
 *     terminal) with a door to the full /os;
 *   - the Digivice on the desk jacks into Passion.
 * Lights follow Toronto time: from 20:00 to 06:00 the set runs a night shift.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { RoomEnvironment } from './studio/vendor/RoomEnvironment.js';
import { RoundedBoxGeometry } from './studio/vendor/RoundedBoxGeometry.js';
import { parseCrew, fillFigures, textOf, fig, asOfLabel, torontoHour, isNightShift, GATES, DASH } from './studio/slates.js';
import { createTerminal } from './studio/terminal.js';
import { makeTool, MOTION } from './studio/tools3d.js';

const $ = (id) => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrowNow = () => innerWidth / innerHeight < 0.8;
const state = { crew: [], figures: {}, generatedAt: null, mode: 'wide' };
const asOf = () => asOfLabel(state.generatedAt);

/* ---------- data: the crew from the Monitor, the numbers from figures.json ---------- */
const crewP = fetch('/', { headers: { Accept: 'text/html' } })
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`home ${r.status}`))))
    .then((html) => parseCrew(new DOMParser().parseFromString(html, 'text/html')))
    .catch(() => []);
const figsP = fetch('/data/figures.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`figures ${r.status}`))))
    .catch(() => null);

/* ---------- renderer, or an honest way out ---------- */
const canvas = $('gl');
let renderer;
try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw new Error('no context');
} catch {
    $('load').hidden = true;
    $('nogl').hidden = false;
    throw new Error('studio: WebGL unavailable, showing the Monitor link');
}
const small = Math.min(innerWidth, innerHeight) < 700;
renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.75 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;

const night = isNightShift(torontoHour());
document.documentElement.dataset.shift = night ? 'night' : 'day';
renderer.toneMappingExposure = night ? 0.92 : 1.05;

const scene = new THREE.Scene();
const ground = night ? 0xeceef2 : 0xffffff;
scene.background = new THREE.Color(ground);
scene.fog = new THREE.Fog(ground, 24, 52);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = night ? 0.4 : 0.55;
const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 120);

scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe2e8, night ? 0.75 : 1.25));
const key = new THREE.DirectionalLight(night ? 0xdfe6ff : 0xffffff, night ? 1.2 : 2.1);
key.position.set(-7, 13, 9);
key.castShadow = true;
key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 40 });
key.shadow.radius = 6;
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.02;
scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 0.6);
rim.position.set(8, 6, -6);
scene.add(rim);

const M = {
    cyc: new THREE.MeshStandardMaterial({ color: 0xf1f2f5, roughness: 1, side: THREE.DoubleSide }),
    white: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
    matte: new THREE.MeshStandardMaterial({ color: 0xfafafb, roughness: 0.75 }),
    visor: new THREE.MeshPhysicalMaterial({ color: 0x0b0c0f, roughness: 0.12, clearcoat: 1 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x17181c, roughness: 0.5, metalness: 0.3 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xc9ccd3, roughness: 0.25, metalness: 0.9 }),
    pink: new THREE.MeshPhysicalMaterial({ color: 0xe8456b, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 }),
    hit: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
};
const tintMat = (hex) => new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: night ? 2 : 1.4, roughness: 0.4 });
const shadowAll = (o) => o.traverse((c) => { if (c.isMesh && c.material !== M.hit) { c.castShadow = true; c.receiveShadow = true; } });

function canvasTex(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return { c, ctx: c.getContext('2d'), t };
}
function wrap(ctx, text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
}

const hits = [];
const CENTER = new THREE.Vector3(0, 0, 2.5);

/* ---------- the cyc: floor that curves into the wall, no horizon ---------- */
{
    const prof = [];
    for (let z = 30; z > -8; z -= 4) prof.push([z, 0]);
    const R = 6;
    for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI / 2; prof.push([-8 - R * Math.sin(a), R - R * Math.cos(a)]); }
    for (let y = R + 4; y <= 34; y += 6) prof.push([-8 - R, y]);
    const W = 46;
    const pos = [];
    const idx = [];
    prof.forEach(([z, y]) => pos.push(-W, y, z, W, y, z));
    for (let i = 0; i < prof.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const cyc = new THREE.Mesh(g, M.cyc);
    cyc.receiveShadow = true;
    scene.add(cyc);
}

/* ---------- director's desk, chair, clapper ---------- */
const desk = new THREE.Group();
desk.position.set(0, 0, 3.2);
scene.add(desk);
{
    const top = new THREE.Mesh(new RoundedBoxGeometry(2.6, 0.07, 1.1, 3, 0.03), M.white);
    top.position.y = 0.76;
    desk.add(top);
    for (const x of [-1.2, 1.2]) for (const z of [-0.45, 0.45]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.74, 10), M.steel); l.position.set(x, 0.37, z); desk.add(l); }
    const clap = new THREE.Group();
    clap.position.set(-0.85, 0.8, 0.15);
    clap.rotation.y = 0.5;
    desk.add(clap);
    const board = canvasTex(256, 200);
    { const c = board.ctx; c.fillStyle = '#0a0a0b'; c.fillRect(0, 0, 256, 200); c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(10, 10, 236, 180); c.fillStyle = '#fff'; c.font = '700 26px Archivo, "Arial Narrow", sans-serif'; c.fillText('SCENE  STUDIO', 22, 60); c.fillText('TAKE  01', 22, 105); c.font = '600 18px "JetBrains Mono", monospace'; c.fillText('DIR. JAMES', 22, 160); }
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.25, 0.015), [M.dark, M.dark, M.dark, M.dark, new THREE.MeshStandardMaterial({ map: board.t, roughness: 0.6 }), M.dark]);
    b.position.y = 0.125;
    b.rotation.x = -0.25;
    clap.add(b);
    const stick = canvasTex(256, 32);
    for (let i = 0; i < 8; i++) { const c = stick.ctx; c.fillStyle = i % 2 ? '#fff' : '#0a0a0b'; c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32 + 32, 0); c.lineTo(i * 32 + 16, 32); c.lineTo(i * 32 - 16, 32); c.fill(); }
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.04, 0.02), new THREE.MeshStandardMaterial({ map: stick.t }));
    s.position.set(0, 0.27, -0.03);
    s.rotation.set(-0.25, 0, 0.18);
    clap.add(s);
}
{
    const chair = new THREE.Group();
    chair.position.set(0, 0, 4.45);
    scene.add(chair);
    const wood = new THREE.MeshStandardMaterial({ color: 0x1c1d21, roughness: 0.6 });
    for (const x of [-0.3, 0.3]) for (const z of [-0.25, 0.25]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.05, 8), wood); l.position.set(x, 0.52, z); l.rotation.x = z > 0 ? -0.08 : 0.08; chair.add(l); }
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.46), new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.9 }));
    seat.position.y = 0.66;
    chair.add(seat);
    const back = canvasTex(512, 160);
    { const c = back.ctx; c.fillStyle = '#0a0a0b'; c.fillRect(0, 0, 512, 160); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '600 26px "JetBrains Mono", monospace'; c.fillText('DIRECTOR', 256, 52); c.font = '800 64px Archivo, "Arial Narrow", sans-serif'; c.fillText('JAMES', 256, 122); c.fillStyle = '#ff2d55'; c.fillRect(216, 140, 80, 6); }
    const bk = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.2), new THREE.MeshStandardMaterial({ map: back.t, roughness: 0.9, side: THREE.DoubleSide }));
    bk.position.set(0, 1.0, 0.27);
    chair.add(bk);
    shadowAll(chair);
}

/* ---------- the program monitor: door to Passion OS ---------- */
const mon = new THREE.Group();
mon.position.set(0, 0.8, 3.05);
scene.add(mon);
const monScreen = canvasTex(1024, 576);
{
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 10), M.steel);
    stand.position.y = 0.17;
    mon.add(stand);
    mon.add(new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.02, 0.24, 2, 0.01), M.steel));
    const frame = new THREE.Mesh(new RoundedBoxGeometry(1.42, 0.84, 0.05, 3, 0.02), M.dark);
    frame.position.y = 0.72;
    mon.add(frame);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 0.76), new THREE.MeshBasicMaterial({ map: monScreen.t, toneMapped: false }));
    scr.position.set(0, 0.72, 0.027);
    mon.add(scr);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.3), M.hit);
    hit.position.y = 0.72;
    hit.userData.hot = { type: 'monitor', label: 'Go into the computer', tint: '#ff2d55' };
    mon.add(hit);
    hits.push(hit);
}
function drawMonitor(t) {
    const c = monScreen.ctx;
    const w = 1024;
    const h = 576;
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f7f8fa');
    g.addColorStop(1, '#e3e6ec');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.8)';
    c.fillRect(0, 0, w, 40);
    c.fillStyle = '#0a0a0b';
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText('PASSION OS · STUDIO', 20, 27);
    const hh = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    c.textAlign = 'right';
    c.fillText(hh, w - 20, 27);
    c.font = '800 150px Archivo, "Arial Narrow", sans-serif';
    c.fillText(hh, w - 50, 230);
    c.textAlign = 'left';
    c.fillStyle = '#0d0e11';
    c.fillRect(60, 270, 520, 240);
    c.fillStyle = '#16171b';
    c.fillRect(60, 270, 520, 30);
    c.font = '18px "JetBrains Mono", monospace';
    const f = state.figures;
    const lines = ['$ neofetch', `repos ${fig(f, 'repos')} · jobs ${fig(f, 'jobs')}`, `fcp-mcp ${fig(f, 'stars')}★`, `sites ${fig(f, 'clientSitesUp')}/${fig(f, 'clientSites')} up`, '$ _'];
    lines.forEach((l, i) => { c.fillStyle = i === 0 || i === 4 ? '#5be3a0' : '#e6e7eb'; c.fillText(l, 80, 330 + i * 34); });
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    c.fillStyle = `rgba(255,45,85,${0.85 + 0.15 * pulse})`;
    c.beginPath();
    c.roundRect(640, 420, 330, 80, 40);
    c.fill();
    c.fillStyle = '#fff';
    c.font = '700 30px "IBM Plex Sans", Arial, sans-serif';
    c.fillText('Go inside  →', 700, 471);
    monScreen.t.needsUpdate = true;
}

/* ---------- the Digivice on its dock: door to Passion ---------- */
const dv = new THREE.Group();
dv.position.set(0.95, 0.8, 3.45);
scene.add(dv);
const dvBody = new THREE.Group();
dv.add(dvBody);
const dvScreen = canvasTex(256, 256);
{
    const dock = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.04, 32), M.white);
    dock.position.y = 0.02;
    dv.add(dock);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.008, 8, 48), tintMat('#5be3a0'));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.042;
    dv.add(ring);
    dvBody.position.y = 0.2;
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.12, 40, 28), M.pink);
    shell.scale.set(1, 1.25, 0.62);
    dvBody.add(shell);
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 12, 48), M.steel);
    bezel.position.set(0, 0.015, 0.079);
    dvBody.add(bezel);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.066, 48), new THREE.MeshBasicMaterial({ map: dvScreen.t, toneMapped: false }));
    face.position.set(0, 0.015, 0.084);
    dvBody.add(face);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.06, 20), M.steel);
    cap.position.y = 0.16;
    dvBody.add(cap);
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 8, 24), M.steel);
    loop.position.y = 0.205;
    dvBody.add(loop);
    for (const [x, y] of [[-0.055, -0.1], [0, -0.115], [0.055, -0.1]]) { const btn = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 12), M.steel); btn.position.set(x, y, 0.052); dvBody.add(btn); }
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.4), M.hit);
    hit.position.y = 0.22;
    hit.userData.hot = { type: 'digivice', label: 'Digivice · jack in to Passion', tint: '#5be3a0' };
    dv.add(hit);
    hits.push(hit);
    shadowAll(dv);
}
function drawDigivice(t) {
    const c = dvScreen.ctx;
    c.fillStyle = '#0b1410';
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = 'rgba(91,227,160,.15)';
    c.lineWidth = 1;
    for (let y = 0; y < 256; y += 8) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); }
    const p = 0.65 + 0.35 * Math.sin(t * 2.4);
    c.save();
    c.translate(128, 128);
    c.scale(1.9, 1.9);
    c.strokeStyle = `rgba(91,227,160,${p})`;
    c.lineWidth = 9;
    c.lineCap = 'round';
    c.shadowColor = '#5be3a0';
    c.shadowBlur = 18;
    c.beginPath();
    for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2; const d = 1 + Math.sin(a) ** 2; c.lineTo((42 * Math.cos(a)) / d, (42 * Math.sin(a) * Math.cos(a)) / d); }
    c.stroke();
    c.restore();
    dvScreen.t.needsUpdate = true;
}

/* ---------- studio props ---------- */
function softbox(x, z, ry) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    scene.add(g);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.6, 8), M.dark);
    pole.position.y = 1.3;
    g.add(pole);
    for (let i = 0; i < 3; i++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.9, 6), M.dark); const a = i * 2.094; leg.position.set(Math.cos(a) * 0.3, 0.32, Math.sin(a) * 0.3); leg.rotation.set(Math.sin(a) * 0.75, 0, -Math.cos(a) * 0.75); g.add(leg); }
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.5), M.dark);
    box.position.set(0, 2.7, 0);
    g.add(box);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ color: night ? 0xfff3e0 : 0xffffff }));
    face.position.set(0, 2.7, 0.26);
    g.add(face);
    shadowAll(g);
    face.castShadow = false;
}
softbox(-6.6, 4.6, 0.9);
softbox(6.6, 4.2, -0.9);
{
    const cam = new THREE.Group();
    cam.position.set(-6.4, 0, 2.6);
    cam.rotation.y = -1.25;
    scene.add(cam);
    for (let i = 0; i < 3; i++) { const a = i * 2.094; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6), M.dark); leg.position.set(Math.cos(a) * 0.28, 0.7, Math.sin(a) * 0.28); leg.rotation.set(Math.sin(a) * 0.38, 0, -Math.cos(a) * 0.38); cam.add(leg); }
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.3, 0.52, 3, 0.03), M.dark);
    body.position.y = 1.55;
    cam.add(body);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.3, 24), M.dark);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 1.55, -0.4);
    cam.add(lens);
    const tally = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), tintMat('#ff2d55'));
    tally.position.set(0.12, 1.72, -0.2);
    cam.add(tally);
    shadowAll(cam);
}

/* ---------- the back flat: three cleared gates and the REC lamp ---------- */
const gateTex = [];
{
    const flat = new THREE.Group();
    flat.position.set(0, 0, -7.2);
    scene.add(flat);
    const panel = new THREE.Mesh(new RoundedBoxGeometry(10.5, 3.9, 0.2, 2, 0.04), M.matte);
    panel.position.y = 1.95;
    flat.add(panel);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), tintMat('#ff2d55'));
    lamp.position.set(4.7, 3.55, 0.16);
    flat.add(lamp);
    GATES.forEach((g, i) => {
        const p = canvasTex(512, 512);
        gateTex.push({ g, p });
        const m = new THREE.Mesh(new RoundedBoxGeometry(1.7, 1.7, 0.06, 2, 0.02), [M.dark, M.dark, M.dark, M.dark, new THREE.MeshStandardMaterial({ map: p.t, roughness: 0.6 }), M.dark]);
        m.position.set(-2.6 + i * 2.6, 2.85, 0.14);
        flat.add(m);
        m.userData.hot = { type: 'gate', id: g.id, label: `Cleared gate · ${g.title}`, tint: '#ff2d55' };
        hits.push(m);
    });
    shadowAll(flat);
}
function drawGates() {
    const f = state.figures;
    for (const { g, p } of gateTex) {
        const c = p.ctx;
        c.fillStyle = '#fff';
        c.fillRect(0, 0, 512, 512);
        c.strokeStyle = '#0a0a0b';
        c.lineWidth = 10;
        c.strokeRect(5, 5, 502, 502);
        c.fillStyle = '#5c5e66';
        c.font = '600 28px "JetBrains Mono", monospace';
        c.fillText('CLEARED GATE', 36, 70);
        c.fillStyle = '#0a0a0b';
        c.font = '800 42px Archivo, "Arial Narrow", sans-serif';
        c.fillText(g.title, 36, 130);
        c.fillStyle = '#ff2d55';
        c.font = '700 110px "JetBrains Mono", monospace';
        c.fillText(fig(f, g.big), 30, 290);
        c.fillStyle = '#0a0a0b';
        c.font = '500 30px "IBM Plex Sans", Arial, sans-serif';
        c.fillText(g.sub, 36, 345);
        c.fillStyle = '#5c5e66';
        c.font = '500 24px "JetBrains Mono", monospace';
        c.fillText(g.foot(f), 36, 440);
        c.fillText(asOf(), 36, 475);
        p.t.needsUpdate = true;
    }
}

/* ---------- the riser for the back row ---------- */
{
    const s = new THREE.Shape();
    const r1 = 6.7;
    const r2 = 9.6;
    const a0 = -0.98;
    const a1 = 0.98;
    s.moveTo(Math.sin(a0) * r2, Math.cos(a0) * r2);
    for (let i = 1; i <= 40; i++) { const a = a0 + ((a1 - a0) * i) / 40; s.lineTo(Math.sin(a) * r2, Math.cos(a) * r2); }
    for (let i = 40; i >= 0; i--) { const a = a0 + ((a1 - a0) * i) / 40; s.lineTo(Math.sin(a) * r1, Math.cos(a) * r1); }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.36, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 1 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, CENTER.z);
    const riser = new THREE.Mesh(g, M.matte);
    riser.castShadow = true;
    riser.receiveShadow = true;
    scene.add(riser);
}

/* ---------- the crew ---------- */
const agents = [];
function stationLines(s) {
    const c = s.scr.ctx;
    c.font = '12px "JetBrains Mono", monospace';
    const f = state.figures;
    const lines = [];
    wrap(c, textOf(s.c.what, f) || s.c.scene, 236).forEach((l) => lines.push(l));
    s.c.stats.forEach((st) => lines.push(`${textOf(st.value, f) || DASH} ${st.label}`));
    if (s.c.call) wrap(c, textOf(s.c.call, f), 236).forEach((l) => lines.push(l));
    s.lines = lines.length ? lines : [s.c.scene];
}
function makeAgent(c, i, total) {
    const st = new THREE.Group();
    const half = Math.ceil(total / 2);
    const back = i >= half;
    const k = back ? i - half : i;
    const count = back ? total - half : half;
    const r = back ? 8.15 : 5.0;
    const span = back ? 0.84 : 1.1;
    const th = count > 1 ? -span + (2 * span * k) / (count - 1) : 0;
    st.position.set(Math.sin(th) * r, back ? 0.39 : 0, CENTER.z - Math.cos(th) * r);
    st.lookAt(CENTER.x, st.position.y, CENTER.z);
    scene.add(st);
    const ped = new THREE.Mesh(new RoundedBoxGeometry(0.75, 0.95, 0.45, 3, 0.05), M.white);
    ped.position.set(-0.32, 0.475, 0);
    st.add(ped);
    const scr = canvasTex(256, 160);
    const frame = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.58, 0.04, 2, 0.015), M.dark);
    frame.position.set(-0.32, 1.32, 0.02);
    frame.rotation.x = -0.12;
    st.add(frame);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.525), new THREE.MeshBasicMaterial({ map: scr.t, toneMapped: false }));
    face.position.set(0, 0, 0.022);
    frame.add(face);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), M.steel);
    neck.position.set(-0.32, 1.0, 0.02);
    st.add(neck);

    const a = new THREE.Group();
    a.position.set(0.42, 0, 0.32);
    a.rotation.y = -0.38;
    st.add(a);
    const tint = tintMat(c.tint);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.36, 6, 18), M.white);
    body.position.y = 0.72;
    a.add(body);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 8, 32), tint);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 0.66;
    a.add(belt);
    const head = new THREE.Group();
    head.position.y = 1.2;
    a.add(head);
    head.add(new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.4, 0.42, 4, 0.12), M.white));
    const visor = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.2, 0.06, 3, 0.05), M.visor);
    visor.position.set(0, -0.01, 0.2);
    head.add(visor);
    const eyes = [];
    for (const x of [-0.08, 0.08]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.01), tint); e.position.set(x, -0.005, 0.235); head.add(e); eyes.push(e); }
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 6), M.steel);
    ant.position.y = 0.27;
    head.add(ant);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), tint);
    bulb.position.y = 0.35;
    head.add(bulb);
    const arms = [];
    for (const sgn of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(0.25 * sgn, 0.92, 0);
        a.add(pivot);
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.3, 4, 10), M.white);
        arm.position.y = -0.18;
        pivot.add(arm);
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), M.white);
        hand.position.y = -0.37;
        pivot.add(hand);
        pivot.rotation.z = 0.12 * sgn;
        arms.push(pivot);
    }
    const tool = makeTool(THREE, c.tool, c.tint, M);
    tool.position.set(0, -0.4, 0.02);
    arms[1].add(tool);
    for (const sgn of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.22, 4, 10), M.white); leg.position.set(0.1 * sgn, 0.2, 0); a.add(leg); }
    const hit = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.9, 0.9), M.hit);
    hit.position.set(-0.05, 0.95, 0.1);
    st.add(hit);
    hit.userData.hot = { type: 'agent', id: c.id, label: `${c.role} · ${c.scene}`, tint: c.tint };
    hits.push(hit);
    shadowAll(st);
    const s = { c, st, a, head, arms, eyes, scr, lines: [], tick: i * 3, phase: i * 0.77, wave: 0, motion: MOTION[c.tool] || MOTION.bag, offcall: c.kind === 'none' };
    stationLines(s);
    agents.push(s);
}
function drawStation(s, t) {
    const c = s.scr.ctx;
    c.fillStyle = '#0d0e11';
    c.fillRect(0, 0, 256, 160);
    c.fillStyle = s.c.tint;
    c.fillRect(0, 0, 256, 24);
    c.fillStyle = '#0a0a0b';
    c.font = '700 13px "JetBrains Mono", monospace';
    c.fillText(s.c.role, 8, 17);
    c.textAlign = 'right';
    c.font = '700 10px "JetBrains Mono", monospace';
    if (s.offcall) c.fillText('NO SIGNAL', 248, 16);
    else {
        c.fillText(s.c.date, 232, 16);
        c.fillStyle = Math.floor(t * 1.6) % 2 ? '#0a0a0b' : '#ff2d55';
        c.beginPath();
        c.arc(243, 12, 4, 0, 7);
        c.fill();
    }
    c.textAlign = 'left';
    c.fillStyle = '#f5f5f7';
    c.font = '800 22px Archivo, "Arial Narrow", sans-serif';
    c.fillText(s.c.scene, 8, 50);
    c.font = '12px "JetBrains Mono", monospace';
    for (let i = 0; i < 6; i++) {
        const l = s.lines[(s.tick + i) % s.lines.length];
        c.fillStyle = i === 5 ? s.c.tint : '#9a9ca5';
        c.fillText(l, 8, 72 + i * 15);
    }
    s.scr.t.needsUpdate = true;
}

/* ---------- camera rig ---------- */
const TARGET = new THREE.Vector3(0, 1.6, 0.2);
const rig = { yaw: 0, pitch: 0.25, dist: 12.5, yawT: 0, pitchT: 0.25, distT: 12.5 };
const view = { look: TARGET.clone() };
let tween = null;
const homeDist = () => { const a = innerWidth / innerHeight; return a < 0.8 ? 12.5 : a < 1.2 ? 13.5 : 12.5; };
function rigPos(out) {
    return out.set(TARGET.x + Math.sin(rig.yaw) * Math.cos(rig.pitch) * rig.dist, TARGET.y + Math.sin(rig.pitch) * rig.dist, TARGET.z + Math.cos(rig.yaw) * Math.cos(rig.pitch) * rig.dist);
}
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
function flyTo(pos, look, dur = 1.25, done) {
    tween = { p0: camera.position.clone(), l0: view.look.clone(), p1: pos.clone(), l1: look.clone(), t: 0, dur: reduce ? 0.01 : dur, done };
}
function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.fov = narrowNow() ? 58 : 42;
    camera.updateProjectionMatrix();
    if (state.mode === 'wide') rig.distT = homeDist();
}
addEventListener('resize', resize);
rig.dist = rig.distT = homeDist();

/* ---------- picking ---------- */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function pick(x, y) {
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(hits, false)[0];
    return h ? h.object : null;
}
const tip = $('tip');
let down = null;
canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, yaw: rig.yawT, pitch: rig.pitchT, t: performance.now(), moved: false };
    canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
    if (down) {
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        if (Math.hypot(dx, dy) > 6) down.moved = true;
        if (down.moved && state.mode === 'wide') {
            canvas.classList.add('drag');
            rig.yawT = THREE.MathUtils.clamp(down.yaw - dx * 0.004, -0.95, 0.95);
            rig.pitchT = THREE.MathUtils.clamp(down.pitch + dy * 0.003, 0.08, 0.62);
        }
        tip.hidden = true;
        return;
    }
    if (state.mode !== 'wide' && state.mode !== 'focus') return;
    const o = pick(e.clientX, e.clientY);
    canvas.classList.toggle('hot', !!o);
    if (o && e.pointerType === 'mouse') {
        const h = o.userData.hot;
        tip.replaceChildren(Object.assign(document.createElement('i'), { style: `background:${h.tint}` }), document.createTextNode(h.label));
        tip.style.left = `${e.clientX}px`;
        tip.style.top = `${e.clientY}px`;
        tip.hidden = false;
    } else tip.hidden = true;
});
canvas.addEventListener('pointerup', (e) => {
    canvas.classList.remove('drag');
    if (!down) return;
    const wasClick = !down.moved && performance.now() - down.t < 600;
    down = null;
    if (!wasClick) return;
    const o = pick(e.clientX, e.clientY);
    if (o) activate(o.userData.hot);
    else if (state.mode === 'focus') goWide();
});
canvas.addEventListener('wheel', (e) => {
    if (state.mode !== 'wide') return;
    e.preventDefault();
    rig.distT = THREE.MathUtils.clamp(rig.distT + e.deltaY * 0.01, 7, homeDist() + 3);
}, { passive: false });
addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (state.mode === 'inside') leaveOS();
        else if (state.mode === 'passion') leavePassion();
        else goWide();
    }
    if (state.mode === 'wide' && document.activeElement === document.body) {
        if (e.key === 'ArrowLeft') rig.yawT = Math.max(-0.95, rig.yawT - 0.15);
        if (e.key === 'ArrowRight') rig.yawT = Math.min(0.95, rig.yawT + 0.15);
    }
});

/* ---------- shots ---------- */
const slate = $('slate');
const mast = $('mast');
const hint = $('hint');
const backBtn = $('back');
function chrome(focus) {
    mast.classList.toggle('hide', focus);
    hint.classList.toggle('hide', focus);
    backBtn.classList.toggle('hide', !focus);
}
let dvLift = 0;
function activate(h) {
    tip.hidden = true;
    if (h.type === 'agent') {
        const s = agents.find((x) => x.c.id === h.id);
        if (!s) return;
        s.wave = 2.6;
        const p = new THREE.Vector3();
        s.a.getWorldPosition(p);
        const dir = new THREE.Vector3(CENTER.x - p.x, 0, CENTER.z - p.z).normalize();
        const side = new THREE.Vector3(-dir.z, 0, dir.x);
        const narrow = narrowNow();
        const pos = p.clone().addScaledVector(dir, narrow ? 3.4 : 2.6).addScaledVector(side, narrow ? 0 : -0.55);
        pos.y = p.y + 1.55;
        const look = p.clone().addScaledVector(side, narrow ? 0 : -0.55);
        look.y = p.y + (narrow ? 0.55 : 0.95);
        state.mode = 'focus';
        flyTo(pos, look);
        showCrewSlate(s.c);
        chrome(true);
    } else if (h.type === 'gate') {
        const i = GATES.findIndex((x) => x.id === h.id);
        const g = GATES[i];
        const look = new THREE.Vector3(-2.6 + i * 2.6, 2.85, -7.06);
        state.mode = 'focus';
        flyTo(look.clone().add(new THREE.Vector3(0, 0.3, narrowNow() ? 4.6 : 3.0)), look);
        showGateSlate(g, i);
        chrome(true);
    } else if (h.type === 'monitor') {
        state.mode = 'focus';
        hideSlate();
        chrome(true);
        flyTo(new THREE.Vector3(0, 1.62, 4.25), new THREE.Vector3(0, 1.52, 3.05), 1.0, () => {
            flyTo(new THREE.Vector3(0, 1.52, 3.3), new THREE.Vector3(0, 1.52, 3.0), 0.7, enterOS);
        });
    } else if (h.type === 'digivice') {
        state.mode = 'focus';
        hideSlate();
        chrome(true);
        dvLift = 1;
        flyTo(new THREE.Vector3(0.95, 1.3, 4.25), new THREE.Vector3(0.95, 1.18, 3.45), 1.1, () => setTimeout(enterPassion, reduce ? 0 : 500));
    }
}
function setSlate({ scene: sc, take, date, role, tint, whatNode, callNode, stats, link, live }) {
    $('sScene').textContent = sc;
    $('sTake').textContent = take;
    $('sDate').textContent = date || DASH;
    $('sRoleChip').style.background = tint;
    $('sRoleName').textContent = role;
    $('sName').textContent = sc;
    $('sWhat').replaceChildren(...(whatNode ? [whatNode] : []));
    $('sCall').hidden = !callNode;
    $('sCallText').replaceChildren(...(callNode ? [callNode] : []));
    const st = $('sStats');
    st.replaceChildren(...stats.map(({ v, k }) => {
        const d = document.createElement('div');
        const b = document.createElement('b');
        if (v instanceof Node) b.append(v); else b.textContent = v;
        const sp = document.createElement('span');
        sp.textContent = k;
        d.append(b, sp);
        return d;
    }));
    st.hidden = !stats.length;
    fillFigures(slate, state.figures);
    const l = $('sLink');
    l.hidden = !link;
    if (link) { l.href = link.href; l.textContent = `${link.text.replace(/\s*[↗→]\s*$/, '')} ↗`; }
    $('sAsof').textContent = live ? asOf() : '';
    slate.classList.add('on');
}
function showCrewSlate(c) {
    const nodeOf = (n) => { if (!n) return null; const x = n.cloneNode(true); const span = document.createElement('span'); if (x.dataset?.fig) span.dataset.fig = x.dataset.fig; span.append(...x.childNodes); return span; };
    const hasFig = (n) => !!n && n.querySelector('[data-fig]') !== null;
    setSlate({
        scene: c.scene,
        take: String(c.n).padStart(2, '0'),
        date: c.date,
        role: c.role,
        tint: c.tint,
        whatNode: nodeOf(c.what),
        callNode: nodeOf(c.call),
        stats: c.stats.map((s) => ({ v: s.value ? nodeOf(s.value) : DASH, k: s.label })),
        link: c.link,
        live: hasFig(c.what) || c.stats.some((s) => hasFig(s.value) || s.value?.dataset?.fig),
    });
}
function showGateSlate(g, i) {
    const f = state.figures;
    const what = document.createElement('span');
    what.textContent = `${fig(f, g.big)} ${g.sub}. ${g.foot(f)}.`;
    const call = document.createElement('span');
    call.textContent = 'Every number on the set is read from its source with an age stamp, never typed.';
    setSlate({ scene: g.title, take: `G${i + 1}`, date: 'LIVE', role: 'CLEARED GATE', tint: '#ff2d55', whatNode: what, callNode: call, stats: [], link: { href: g.link, text: 'See it live' }, live: true });
}
function hideSlate() { slate.classList.remove('on'); }
function goWide() {
    if (state.mode === 'wide') return;
    state.mode = 'wide';
    hideSlate();
    chrome(false);
    dvLift = 0;
    flyTo(rigPos(new THREE.Vector3()), TARGET, 1.1);
}
backBtn.addEventListener('click', goWide);

/* ---------- inside the computer ---------- */
const os = $('os');
const tOut = $('tOut');
const tIn = $('tIn');
const term = createTerminal({ crew: () => state.crew, figures: () => state.figures, asOf });
function print(html, cls) {
    const d = document.createElement('div');
    if (cls) d.className = cls;
    d.innerHTML = html;
    tOut.appendChild(d);
    tOut.scrollTop = tOut.scrollHeight;
}
function enterOS() {
    state.mode = 'inside';
    os.classList.add('on');
    os.setAttribute('aria-hidden', 'false');
    hint.classList.add('hide');
    backBtn.classList.add('hide');
    mast.classList.add('hide');
    if (!tOut.childElementCount) print('<span class="m">Passion OS terminal, studio build. Type <span class="g">help</span>, or try <span class="g">neofetch</span>. Tab completes.</span>');
    setTimeout(() => { if (matchMedia('(pointer:fine)').matches) tIn.focus(); }, 400);
}
function leaveOS() {
    os.classList.remove('on');
    os.setAttribute('aria-hidden', 'true');
    state.mode = 'focus';
    goWide();
}
$('osBack').addEventListener('click', leaveOS);
const jack = $('jack');
function enterPassion() {
    if (state.mode !== 'focus') return;
    state.mode = 'passion';
    jack.classList.add('on');
    jack.setAttribute('aria-hidden', 'false');
}
function leavePassion() {
    jack.classList.remove('on');
    jack.setAttribute('aria-hidden', 'true');
    state.mode = 'focus';
    goWide();
}
$('jBack').addEventListener('click', leavePassion);
const hist = term.history;
let hi = 0;
tIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const r = term.run(tIn.value);
        tIn.value = '';
        hi = hist.length;
        if (r.action?.type === 'clear') { tOut.replaceChildren(); return; }
        print(r.html);
        if (r.action?.type === 'exit') leaveOS();
    } else if (e.key === 'ArrowUp') {
        if (hi > 0) { hi -= 1; tIn.value = hist[hi]; }
        e.preventDefault();
    } else if (e.key === 'ArrowDown') {
        if (hi < hist.length) { hi += 1; tIn.value = hist[hi] || ''; }
        e.preventDefault();
    } else if (e.key === 'Tab') {
        e.preventDefault();
        const { value, options } = term.complete(tIn.value);
        tIn.value = value;
        if (options.length > 1) print(options.join('   '), 'm');
    } else if (e.key === 'Escape') leaveOS();
});
document.querySelectorAll('.dock [data-cmd]').forEach((b) => b.addEventListener('click', () => {
    const r = term.run(b.dataset.cmd);
    print(r.html);
}));
let z = 2;
document.querySelectorAll('.dock [data-app]').forEach((b) => b.addEventListener('click', () => {
    const w = $(b.dataset.app === 'term' ? 'wTerm' : 'wNotes');
    z += 1;
    w.style.zIndex = z;
    $('osApp').textContent = b.dataset.app === 'term' ? 'Terminal' : 'Notes';
    if (b.dataset.app === 'term') tIn.focus();
}));
document.querySelectorAll('.win').forEach((w) => {
    const bar = w.querySelector('.bar');
    let d = null;
    w.addEventListener('pointerdown', () => { z += 1; w.style.zIndex = z; $('osApp').textContent = w.id === 'wTerm' ? 'Terminal' : 'Notes'; });
    bar.addEventListener('pointerdown', (e) => { d = { x: e.clientX - w.offsetLeft, y: e.clientY - w.offsetTop }; bar.setPointerCapture(e.pointerId); });
    bar.addEventListener('pointermove', (e) => {
        if (!d) return;
        const deskEl = $('desk');
        w.style.left = `${THREE.MathUtils.clamp(e.clientX - d.x, -w.offsetWidth + 80, deskEl.clientWidth - 80)}px`;
        w.style.top = `${THREE.MathUtils.clamp(e.clientY - d.y, 0, deskEl.clientHeight - 40)}px`;
    });
    bar.addEventListener('pointerup', () => { d = null; });
});
function clocks() {
    const n = new Date();
    const t = n.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const h = n.getHours();
    const part = h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    $('osTime').textContent = t;
    $('bigTime').textContent = t;
    $('bigDate').textContent = `${part}. ${n.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}.`;
}
clocks();
setInterval(clocks, 15000);
$('shift').textContent = night ? 'Night shift · the crew is still running' : 'Day shift';

/* ---------- data arrives ---------- */
function applyFigures(json) {
    state.figures = (json && json.figures) || {};
    state.generatedAt = (json && json.generatedAt) || null;
    fillFigures(document, state.figures);
    document.querySelectorAll('[data-asof]').forEach((el) => { el.textContent = asOf(); });
    drawGates();
    agents.forEach((s) => stationLines(s));
}
const ready = Promise.all([crewP, figsP]).then(([crew, json]) => {
    state.crew = crew;
    crew.forEach((c, i) => makeAgent(c, i, crew.length));
    applyFigures(json);
    if (!crew.length) $('hint').textContent = 'The crew did not load. Every source is on the Monitor at jamesdare.com';
});
drawGates();

/* ---------- loop ---------- */
const clock = new THREE.Clock();
let acc = 0;
let shown = false;
resize();
rigPos(camera.position);
camera.lookAt(TARGET);
function frame() {
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;
    if (tween) {
        tween.t += dt / tween.dur;
        const k = ease(Math.min(tween.t, 1));
        camera.position.lerpVectors(tween.p0, tween.p1, k);
        view.look.lerpVectors(tween.l0, tween.l1, k);
        if (tween.t >= 1) {
            const d = tween.done;
            tween = null;
            if (state.mode === 'wide') { rig.yaw = rig.yawT; rig.pitch = rig.pitchT; rig.dist = rig.distT; }
            if (d) d();
        }
    } else if (state.mode === 'wide') {
        const f = reduce ? 1 : 1 - Math.pow(0.002, dt);
        rig.yaw += (rig.yawT - rig.yaw) * f;
        rig.pitch += (rig.pitchT - rig.pitch) * f;
        rig.dist += (rig.distT - rig.dist) * f;
        if (!reduce && !down) rig.yawT += Math.sin(t * 0.12) * 0.00025;
        rigPos(camera.position);
        view.look.lerp(TARGET, f);
    }
    camera.lookAt(view.look);
    if (!reduce) {
        for (const s of agents) {
            const ph = t + s.phase;
            const m = s.motion;
            s.a.position.y = Math.sin(ph * 1.6) * 0.012;
            if (s.c.tool === 'pad') s.a.position.y = Math.max(0, Math.sin(ph * 2.2)) ** 6 * 0.25;
            if (s.offcall) {
                const q = (Math.sin(ph * 2.4) + 1) / 2;
                s.a.position.y = -q * 0.12;
                s.arms[0].rotation.x = -q * 1.3;
                s.arms[1].rotation.x = -0.3 - Math.max(0, Math.sin(ph * 2.4)) * 1.6;
            } else if (s.wave > 0) {
                s.wave -= dt;
                s.arms[0].rotation.z = -2.6 + Math.sin(t * 12) * 0.35;
                s.arms[0].rotation.x = 0;
                s.head.rotation.y += (0.38 - s.head.rotation.y) * 0.1;
            } else {
                s.arms[0].rotation.z += (-0.12 - s.arms[0].rotation.z) * 0.1;
                s.arms[1].rotation.x = m.rx + Math.sin(ph * m.hz) * m.amp;
                s.arms[0].rotation.x = m.both ? m.rx + Math.sin(ph * m.hz + 0.6) * m.amp : -0.75 + Math.sin(ph * 9) * 0.1;
                const look = Math.sin(ph * 0.35) > 0.7 ? 0.38 : -0.55;
                s.head.rotation.y += (look - s.head.rotation.y) * 0.04;
            }
            const blink = Math.sin(ph * 0.9) > 0.985 ? 0.1 : 1;
            s.eyes.forEach((e) => { e.scale.y = blink; });
        }
    }
    dvBody.position.y += (0.2 + (dvLift ? 0.32 : 0) - dvBody.position.y) * 0.08;
    dvBody.rotation.y = dvLift ? dvBody.rotation.y * 0.9 : Math.sin(t * 0.8) * 0.5;
    acc += dt;
    if (acc > 0.2 || !shown) {
        acc = 0;
        drawMonitor(t);
        drawDigivice(t);
        agents.forEach((s) => { if (Math.random() < 0.08) s.tick += 1; drawStation(s, t); });
    }
    renderer.render(scene, camera);
    if (!shown && agents.length) {
        shown = true;
        requestAnimationFrame(() => $('load').classList.add('off'));
    }
    requestAnimationFrame(frame);
}
ready.finally(() => { setTimeout(() => { if (!shown) { shown = true; $('load').classList.add('off'); } }, 400); });
document.fonts?.ready.then(() => { drawGates(); agents.forEach((s) => { stationLines(s); drawStation(s, 0); }); });
requestAnimationFrame(frame);
window.__studio = { activate, goWide, agents, state };
