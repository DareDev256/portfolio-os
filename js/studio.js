/* studio.js: THE STUDIO, the home page at / since 4.69.0 (at /studio from 4.65.0).
 *
 * The Monitor's crew, at work on a white soundstage. A canvas world (three
 * 0.170, the same pinned build /os loads) with a thin HUD over it:
 *   - the room is modelled and light-baked in Blender (tools/studio/build_set.py)
 *     and drawn unlit; if it is missing or baked for another crew size, the
 *     hand-built room below stands in;
 *   - 16 agents at stations, read from the homepage's own switcher and slates
 *     (js/studio/slates.js), each holding its tool from crew.js, each screen
 *     showing that source's real footage (js/studio/screens.js);
 *   - an A camera on a dolly covers one source at a time, a runner does coffee
 *     rounds, the riser's LED ribbon scrolls the jobs' own log;
 *   - back right the Monarch's throne, stage left the robot lab, and the inspo
 *     board on the back flat (js/studio/cast.js);
 *   - the director's monitor drops into Passion OS, the Digivice into Passion.
 * Lights follow Toronto time: from 20:00 to 06:00 the set runs a night shift.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { RoomEnvironment } from './studio/vendor/RoomEnvironment.js';
import { RoundedBoxGeometry } from './studio/vendor/RoundedBoxGeometry.js';
import { parseCrew, fillFigures, fig, asOfLabel, torontoHour, isNightShift, GATES, DASH } from './studio/slates.js';
import { createTerminal } from './studio/terminal.js';
import { makeTool, MOTION } from './studio/tools3d.js';
import { CENTER, RISER, STATION, stationPose, DESK, CHAIR, MONITOR, DIGIVICE, FLAT, SOFTBOXES, KEY } from './studio/layout.js';
import { loadSet } from './studio/set.js';
import { createScreens, createRibbon } from './studio/screens.js';
import { createCast, EXTRA_SLATES } from './studio/cast.js';
import { lookFrom, otherLook, toonify, inkSize, LOOK_KEY } from './studio/anime.js';
import { buildBody } from './studio/rig.js';
import { walkinPose, shouldWalkIn, WALKIN_KEY } from './studio/walkin.js';
import { activitySummary, agentFeedLabel } from './monitor.js';
import { STATIONS_URL, takesFor, takesLine, takeDate, stripHeights, stripLabel, rolling, ageLabel, num } from './studio/takes.js';

const $ = (id) => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrowNow = () => innerWidth / innerHeight < 0.8;
const state = { crew: [], figures: {}, generatedAt: null, mode: 'wide', focus: null, baked: false };
const asOf = () => asOfLabel(state.generatedAt);
const json = (url) => fetch(url, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

/* ---------- data: the crew from the Monitor, the numbers from figures.json ---------- */
// The Monitor lives at /monitor since the studio took / (4.69.0). Reading / here
// would read this page, find no switcher, and leave every station empty.
const MONITOR_URL = '/monitor';
const crewP = fetch(MONITOR_URL, { headers: { Accept: 'text/html' } })
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`home ${r.status}`))))
    .then((html) => parseCrew(new DOMParser().parseFromString(html, 'text/html')))
    .catch(() => []);
const figsP = json('/data/figures.json');
const data = { activity: null, registry: null, agentFeed: null, stations: null };
const dataP = Promise.all([json('/data/activity.json'), json('/data/registry-graph.json'), json('/data/agent-feed.json'), json(STATIONS_URL)]).then(([a, r, f, st]) => {
    data.activity = a;
    data.registry = r;
    data.agentFeed = f;
    data.stations = st?.stations ? st : null;
});
const feedsP = json('/assets/studio/feeds/manifest.json');

/* ---------- renderer, or an honest way out ---------- */
const canvas = $('gl');
let renderer;
try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw new Error('no context');
} catch {
    // The home page cannot be a blank canvas: a device with no WebGL gets the
    // Monitor, which carries every source and figure as plain HTML. The card
    // stays up (with its link) for the moment the navigation takes.
    $('load').hidden = true;
    $('nogl').hidden = false;
    location.replace(`${MONITOR_URL}?from=studio-nogl`);
    throw new Error('studio: WebGL unavailable, sending the visitor to the Monitor');
}
const small = Math.min(innerWidth, innerHeight) < 700;
renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.75 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;

const night = isNightShift(torontoHour());
document.documentElement.dataset.shift = night ? 'night' : 'day';
renderer.toneMappingExposure = night ? 0.92 : 1.05;

// the cel look (4.71.0): ?look=anime, behind a switch until James picks it
const storedLook = (() => {
    try {
        return localStorage.getItem(LOOK_KEY) || '';
    } catch {
        return '';
    }
})();
const LOOK = lookFrom(location.search, storedLook);
document.documentElement.dataset.look = LOOK;
const lookBtn = document.getElementById('lookBtn');
if (lookBtn) {
    const next = otherLook(LOOK);
    lookBtn.textContent = next === 'clean' ? 'Clean look' : 'Anime look';
    lookBtn.setAttribute('aria-label', `Switch the set to the ${next} look`);
    lookBtn.addEventListener('click', () => {
        try {
            localStorage.setItem(LOOK_KEY, next);
        } catch {
            /* private mode: the address carries the pick instead */
        }
        const u = new URL(location.href);
        u.searchParams.set('look', next);
        location.replace(u.toString());
    });
}
const anime = { cache: new Map(), inks: new Map(), meshes: 0 };

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
key.position.set(KEY.x, KEY.y, KEY.z);
key.castShadow = true;
key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
Object.assign(key.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 42 });
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

const hits = [];
const C = new THREE.Vector3(CENTER.x, 0, CENTER.z);

/* ---------- the room by hand: only when the baked set cannot be used ---------- */
function buildHandSet() {
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
    cyc.userData.noToon = true;
    scene.add(cyc);

    const desk = new THREE.Group();
    desk.position.set(DESK.x, 0, DESK.z);
    scene.add(desk);
    const top = new THREE.Mesh(new RoundedBoxGeometry(DESK.w, 0.07, DESK.d, 3, 0.03), M.white);
    top.position.y = DESK.top;
    desk.add(top);
    for (const x of [-1.2, 1.2]) for (const z of [-0.45, 0.45]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.74, 10), M.steel); l.position.set(x, 0.37, z); desk.add(l); }
    shadowAll(desk);

    const chair = new THREE.Group();
    chair.position.set(CHAIR.x, 0, CHAIR.z);
    scene.add(chair);
    const wood = new THREE.MeshStandardMaterial({ color: 0x1c1d21, roughness: 0.6 });
    for (const x of [-0.3, 0.3]) for (const z of [-0.25, 0.25]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.05, 8), wood); l.position.set(x, 0.52, z); l.rotation.x = z > 0 ? -0.08 : 0.08; chair.add(l); }
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.46), new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.9 }));
    seat.position.y = 0.66;
    chair.add(seat);
    shadowAll(chair);

    const stand = new THREE.Group();
    stand.position.set(MONITOR.x, MONITOR.y, MONITOR.z);
    scene.add(stand);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 10), M.steel);
    neck.position.y = 0.17;
    stand.add(neck);
    stand.add(new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.02, 0.24, 2, 0.01), M.steel));
    const frame = new THREE.Mesh(new RoundedBoxGeometry(1.42, 0.84, 0.05, 3, 0.02), M.dark);
    frame.position.y = 0.72;
    stand.add(frame);

    for (const s of SOFTBOXES) {
        const sb = new THREE.Group();
        sb.position.set(s.x, 0, s.z);
        sb.rotation.y = s.ry;
        scene.add(sb);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.6, 8), M.dark);
        pole.position.y = 1.3;
        sb.add(pole);
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.5), M.dark);
        box.position.set(0, 2.7, -0.05);
        sb.add(box);
        const face = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ color: night ? 0xfff3e0 : 0xffffff }));
        face.position.set(0, 2.7, 0.21);
        sb.add(face);
        shadowAll(sb);
    }

    const panel = new THREE.Mesh(new RoundedBoxGeometry(FLAT.w, FLAT.h, 0.2, 2, 0.04), M.matte);
    panel.position.set(0, FLAT.h / 2, FLAT.z);
    scene.add(panel);
    shadowAll(panel);

    const s = new THREE.Shape();
    s.moveTo(Math.sin(RISER.a0) * RISER.r2, Math.cos(RISER.a0) * RISER.r2);
    for (let i = 1; i <= 40; i++) { const a = RISER.a0 + ((RISER.a1 - RISER.a0) * i) / 40; s.lineTo(Math.sin(a) * RISER.r2, Math.cos(a) * RISER.r2); }
    for (let i = 40; i >= 0; i--) { const a = RISER.a0 + ((RISER.a1 - RISER.a0) * i) / 40; s.lineTo(Math.sin(a) * RISER.r1, Math.cos(a) * RISER.r1); }
    const rg = new THREE.ExtrudeGeometry(s, { depth: RISER.top - 0.03, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 1 });
    rg.rotateX(-Math.PI / 2);
    rg.translate(0, 0, C.z);
    const riser = new THREE.Mesh(rg, M.matte);
    riser.castShadow = true;
    riser.receiveShadow = true;
    scene.add(riser);
}

/* With the baked room, live shadows land on catchers that only darken. */
function addShadowCatchers() {
    const mat = new THREE.ShadowMaterial({ opacity: night ? 0.12 : 0.16 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 24), mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0.004, 3);
    floor.receiveShadow = true;
    scene.add(floor);
    const s = new THREE.Shape();
    s.moveTo(Math.sin(RISER.a0) * RISER.r2, Math.cos(RISER.a0) * RISER.r2);
    for (let i = 1; i <= 40; i++) { const a = RISER.a0 + ((RISER.a1 - RISER.a0) * i) / 40; s.lineTo(Math.sin(a) * RISER.r2, Math.cos(a) * RISER.r2); }
    for (let i = 40; i >= 0; i--) { const a = RISER.a0 + ((RISER.a1 - RISER.a0) * i) / 40; s.lineTo(Math.sin(a) * RISER.r1, Math.cos(a) * RISER.r1); }
    const g = new THREE.ShapeGeometry(s);
    g.rotateX(-Math.PI / 2);
    const top = new THREE.Mesh(g, mat);
    top.position.set(0, RISER.top + 0.004, C.z);
    top.receiveShadow = true;
    scene.add(top);
}

/* ---------- what stands in both rooms ---------- */
const desk = { clap: null, stick: null, board: null, snap: 0 };
{
    const clap = new THREE.Group();
    clap.position.set(DESK.x - 0.85, DESK.top + 0.04, DESK.z + 0.15);
    clap.rotation.y = 0.5;
    scene.add(clap);
    desk.board = canvasTex(256, 200);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.25, 0.015), [M.dark, M.dark, M.dark, M.dark, new THREE.MeshStandardMaterial({ map: desk.board.t, roughness: 0.6 }), M.dark]);
    b.position.y = 0.125;
    b.rotation.x = -0.25;
    clap.add(b);
    const stick = canvasTex(256, 32);
    for (let i = 0; i < 8; i++) { const c = stick.ctx; c.fillStyle = i % 2 ? '#fff' : '#0a0a0b'; c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32 + 32, 0); c.lineTo(i * 32 + 16, 32); c.lineTo(i * 32 - 16, 32); c.fill(); }
    const hinge = new THREE.Group();
    hinge.position.set(-0.165, 0.255, -0.03);
    hinge.rotation.x = -0.25;
    clap.add(hinge);
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.04, 0.02), new THREE.MeshStandardMaterial({ map: stick.t }));
    s.position.set(0.165, 0.02, 0);
    hinge.add(s);
    hinge.rotation.z = 0.3;
    desk.stick = hinge;
    shadowAll(clap);
}
function drawClapper(sceneName, take) {
    const c = desk.board.ctx;
    c.fillStyle = '#0a0a0b';
    c.fillRect(0, 0, 256, 200);
    c.strokeStyle = '#fff';
    c.lineWidth = 3;
    c.strokeRect(10, 10, 236, 180);
    c.fillStyle = '#fff';
    c.font = '700 22px Archivo, "Arial Narrow", sans-serif';
    let sc = (sceneName || 'STUDIO').toUpperCase();
    while (sc.length > 3 && c.measureText(`SCENE  ${sc}`).width > 216) sc = sc.slice(0, -1);
    c.fillText(`SCENE  ${sc}`, 22, 60);
    c.font = '700 26px Archivo, "Arial Narrow", sans-serif';
    c.fillText(`TAKE  ${take || '01'}`, 22, 105);
    c.font = '600 18px "JetBrains Mono", monospace';
    c.fillText('DIR. JAMES', 22, 160);
    desk.board.t.needsUpdate = true;
}
drawClapper('STUDIO', '01');
{
    const back = canvasTex(512, 160);
    const c = back.ctx;
    c.fillStyle = '#0a0a0b';
    c.fillRect(0, 0, 512, 160);
    c.fillStyle = '#fff';
    c.textAlign = 'center';
    c.font = '600 26px "JetBrains Mono", monospace';
    c.fillText('DIRECTOR', 256, 52);
    c.font = '800 64px Archivo, "Arial Narrow", sans-serif';
    c.fillText('JAMES', 256, 122);
    c.fillStyle = '#ff2d55';
    c.fillRect(216, 140, 80, 6);
    const bk = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.2), new THREE.MeshStandardMaterial({ map: back.t, roughness: 0.9 }));
    bk.position.set(CHAIR.x, 1.0, CHAIR.z + 0.276);
    scene.add(bk);
}

/* ---------- the program monitor: door to Passion OS ---------- */
const mon = new THREE.Group();
mon.position.set(MONITOR.x, MONITOR.y, MONITOR.z);
scene.add(mon);
const monScreen = canvasTex(1024, 576);
{
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
dv.position.set(DIGIVICE.x, DIGIVICE.y, DIGIVICE.z);
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

/* ---------- the back flat's live pieces: three cleared gates and the REC lamp ---------- */
const gateTex = [];
{
    const flat = new THREE.Group();
    flat.position.set(0, 0, FLAT.z);
    scene.add(flat);
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

/* ---------- the crew ---------- */
const agents = [];
const LAMP_GEO = new THREE.BoxGeometry(0.15, 0.05, 0.06);
const LAMP_OFF = 0x2c2f36;
const LAMP_ON = new THREE.Color('#ff2d55');
const haloTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
})();
const screens = createScreens(THREE, { feeds: feedsP.then((m) => m || {}), data, figures: () => state.figures, maxLive: small ? 3 : 6 });
const blobTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(10,12,18,0.5)');
    g.addColorStop(1, 'rgba(10,12,18,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
})();
const blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false });
function blob(parent, size = 0.85) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(size, size), blobMat);
    b.rotation.x = -Math.PI / 2;
    b.position.y = 0.006;
    parent.add(b);
    return b;
}
function makeAgent(c, i, total) {
    const pose = stationPose(i, total);
    const st = new THREE.Group();
    st.position.set(pose.x, pose.y, pose.z);
    st.rotation.y = pose.ry;
    scene.add(st);
    const P = STATION.pedestal;
    const F = STATION.frame;
    if (!state.baked) {
        const ped = new THREE.Mesh(new RoundedBoxGeometry(P.w, P.h, P.d, 3, P.r), M.white);
        ped.position.set(P.x, P.y, P.z);
        st.add(ped);
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(STATION.neck.r, STATION.neck.r, STATION.neck.h, 8), M.steel);
        neck.position.set(STATION.neck.x, STATION.neck.y, STATION.neck.z);
        st.add(neck);
        const frame = new THREE.Mesh(new RoundedBoxGeometry(F.w, F.h, F.d, 2, 0.015), M.dark);
        frame.position.set(F.x, F.y, F.z);
        frame.rotation.x = F.tilt;
        st.add(frame);
    }
    const anchor = new THREE.Group();
    anchor.position.set(F.x, F.y, F.z);
    anchor.rotation.x = F.tilt;
    st.add(anchor);
    const face = new THREE.Group();
    face.position.z = STATION.screen.z;
    anchor.add(face);
    screens.add(c, face, STATION.screen);
    // The tally lamp: red while this station has a take from the last 24 hours (takes.js).
    const lamp = new THREE.Mesh(LAMP_GEO, new THREE.MeshBasicMaterial({ color: LAMP_OFF, toneMapped: false }));
    lamp.position.set(F.w / 2 - 0.12, F.h / 2 + 0.03, 0);
    anchor.add(lamp);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color: LAMP_ON, transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false }));
    halo.scale.setScalar(0.42);
    halo.visible = false;
    lamp.add(halo);

    const rig = buildBody(THREE, RoundedBoxGeometry, { body: M.white, visor: M.visor, steel: M.steel }, tintMat(c.tint));
    rig.a.position.set(STATION.agent.x, 0, STATION.agent.z);
    rig.a.rotation.y = STATION.agent.ry;
    st.add(rig.a);
    blob(st).position.set(STATION.agent.x, 0.006, STATION.agent.z);
    const tool = makeTool(THREE, c.tool, c.tint, M);
    tool.position.set(0, -0.4, 0.02);
    rig.arms[1].add(tool);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.9, 0.9), M.hit);
    hit.position.set(-0.05, 0.95, 0.1);
    st.add(hit);
    hit.userData.hot = { type: 'agent', id: c.id, label: `${c.role} · ${c.scene}`, tint: c.tint };
    hits.push(hit);
    shadowAll(rig.a);
    const s = { c, st, lamp, halo, rolling: false, ...rig, back: pose.back, phase: i * 0.77, wave: 0, motion: MOTION[c.tool] || MOTION.bag, offcall: c.kind === 'none', work: i % 3 === 0, workT: 2 + (i % 5) * 1.3, attn: null };
    agents.push(s);
}

/* ---------- the LED ribbon on the riser: the jobs' own log ---------- */
const ribbon = createRibbon(THREE, { center: C, radius: RISER.r1 - 0.045, a0: RISER.a0 + 0.03, a1: RISER.a1 - 0.03, y: 0.2, h: 0.24 });
scene.add(ribbon.mesh);
function ribbonText() {
    const f = state.figures;
    const parts = [{ text: '● LIVE ON SET', color: '#ff2d55' }];
    const run = data.agentFeed && agentFeedLabel(data.agentFeed);
    if (run && data.agentFeed.task) parts.push({ text: `FILMED RUN ${run} · ${data.agentFeed.task}`, color: '#6fd3ff' });
    for (const e of data.activity?.events || []) parts.push({ text: `${e.time}  ${e.label}` });
    if (data.activity?.generatedAt) {
        const sum = activitySummary(data.activity);
        parts.push({ text: sum.text, color: sum.stale ? '#ffb36a' : '#9a9ca5' });
    }
    const all = takesFor(data.stations, { kind: 'graph' });
    if (all) parts.push({ text: `${takesLine(all, data.stations.windowDays).toUpperCase()} · READ ${ageLabel(data.stations.generatedAt) || ''}`.trim(), color: '#ffb36a' });
    parts.push({ text: `${fig(f, 'repos')} repos · ${fig(f, 'jobs')} scheduled jobs · ${asOf()}`, color: '#5be3a0' });
    ribbon.setText(parts);
}

/* ---------- camera rig ---------- */
const TARGET = new THREE.Vector3(0, 1.6, 0.2);
const view = { look: TARGET.clone() };
let tween = null;
// The home shot per screen shape (4.69.0). A phone held upright looks down on the
// set from higher and a little closer, so the crew fills the glass under the
// masthead instead of floating in a band of empty cyc; wide screens keep the
// eye-level shot. Picked from rendered frames at 390x844.
const homeDist = () => { const a = innerWidth / innerHeight; return a < 0.8 ? 12 : a < 1.2 ? 13.5 : 12.5; };
const homePitch = () => (narrowNow() ? 0.48 : 0.25);
const rig = { yaw: 0, pitch: homePitch(), dist: homeDist(), yawT: 0, pitchT: homePitch(), distT: homeDist() };
function rigPos(out) {
    return out.set(TARGET.x + Math.sin(rig.yaw) * Math.cos(rig.pitch) * rig.dist, TARGET.y + Math.sin(rig.pitch) * rig.dist, TARGET.z + Math.cos(rig.yaw) * Math.cos(rig.pitch) * rig.dist);
}
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
function flyTo(pos, look, dur = 1.25, done) {
    tween = { p0: camera.position.clone(), l0: view.look.clone(), p1: pos.clone(), l1: look.clone(), t: 0, dur: reduce ? 0.01 : dur, done };
}
function sizeInk() {
    const c = renderer.domElement;
    for (const m of anime.inks.values()) m.uniforms.uPx.value.set(...inkSize(m.userData.inkWidth, c.width, c.height, renderer.getPixelRatio()));
}
function animeApply(root, variant = 'crew') {
    if (LOOK !== 'anime') return;
    anime.meshes += toonify(THREE, root, { variant, cache: anime.cache, inks: anime.inks }).meshes;
    sizeInk();
}
function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    sizeInk();
    camera.aspect = innerWidth / innerHeight;
    camera.fov = narrowNow() ? 58 : 42;
    camera.updateProjectionMatrix();
    if (state.mode === 'wide') { rig.distT = homeDist(); rig.pitchT = homePitch(); }
}
addEventListener('resize', resize);
rig.dist = rig.distT = homeDist();

/* the walk-in: the lab, the Vegapunk board, the throne, home (first visit; any input skips it) */
let walk = null;
let hintText = '';
function shotFor(name, dist) {
    if (name === 'home') {
        const d = homeDist();
        const pt = homePitch();
        return { pos: [TARGET.x, TARGET.y + Math.sin(pt) * d, TARGET.z + Math.cos(pt) * d], look: TARGET.toArray() };
    }
    const spot = cast.spots[name]();
    const look = spot.clone();
    let dir;
    let lift;
    if (name === 'robot') { dir = towardCamera(spot); lift = 1.5; look.y += 0.55; }
    else if (name === 'poster') { dir = new THREE.Vector3(0, 0, 1); lift = -0.3; }
    else { dir = new THREE.Vector3(Math.sin(-0.62), 0, Math.cos(-0.62)); lift = 0.7; }
    const pos = spot.clone().addScaledVector(dir, dist * (narrowNow() ? 1.35 : 1));
    pos.y += lift;
    return { pos: pos.toArray(), look: look.toArray() };
}
function startWalkIn() {
    let seenAt = null;
    try { seenAt = localStorage.getItem(WALKIN_KEY); } catch { /* storage blocked: treat as a first visit */ }
    if (!cast || !shouldWalkIn({ reduce, search: location.search, seenAt })) return;
    try { localStorage.setItem(WALKIN_KEY, String(Date.now())); } catch { /* fine */ }
    walk = { t: -0.6, cap: undefined };
    hintText = hint.textContent;
    const p = walkinPose(0, shotFor);
    camera.position.fromArray(p.pos);
    view.look.fromArray(p.look);
}
// Hand the camera back from wherever the pass is: the orbit takes over from
// the camera's real position and glides into its limits, so nothing jumps.
function endWalkIn() {
    if (!walk) return;
    walk = null;
    hint.textContent = hintText;
    hint.classList.remove('cap');
    const o = camera.position.clone().sub(TARGET);
    rig.dist = o.length();
    rig.yaw = Math.atan2(o.x, o.z);
    rig.pitch = Math.asin(THREE.MathUtils.clamp(o.y / rig.dist, -1, 1));
    rig.yawT = THREE.MathUtils.clamp(rig.yaw, -0.95, 0.95);
    rig.pitchT = THREE.MathUtils.clamp(rig.pitch, 0.08, 0.62);
    rig.distT = THREE.MathUtils.clamp(rig.dist, 7, homeDist() + 3);
}

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
let hover = null;
canvas.addEventListener('pointerdown', (e) => {
    endWalkIn();
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
    hover = o && o.userData.hot.type === 'agent' ? o.userData.hot.id : null;
    if (o && e.pointerType === 'mouse') {
        const h = o.userData.hot;
        tip.replaceChildren(Object.assign(document.createElement('i'), { style: `background:${h.tint}` }), document.createTextNode(h.label));
        tip.style.left = `${e.clientX}px`;
        tip.style.top = `${e.clientY}px`;
        tip.hidden = false;
    } else tip.hidden = true;
});
canvas.addEventListener('pointerleave', () => { hover = null; });
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
    endWalkIn();
    if (state.mode !== 'wide') return;
    e.preventDefault();
    rig.distT = THREE.MathUtils.clamp(rig.distT + e.deltaY * 0.01, 7, homeDist() + 3);
}, { passive: false });
addEventListener('keydown', (e) => {
    endWalkIn();
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
let cast = null;
/** Fly to look at a point from a direction (unit vector on the floor), at a distance. */
function frameSpot(spot, dir, dist, lift = 0.35, phoneDrop = 0) {
    // phoneDrop pans the camera down on a phone so the subject sits above the slate
    const look = spot.clone();
    if (narrowNow()) look.y -= phoneDrop;
    const pos = look.clone().addScaledVector(dir, narrowNow() ? dist * 1.35 : dist);
    pos.y += lift;
    state.mode = 'focus';
    flyTo(pos, look);
    chrome(true);
}
function towardCamera(p) {
    return new THREE.Vector3(0 - p.x, 0, 12.3 - p.z).normalize();
}
function activate(h) {
    endWalkIn();
    tip.hidden = true;
    if (h.type === 'agent') {
        const s = agents.find((x) => x.c.id === h.id);
        if (!s) return;
        s.wave = 2.6;
        s.work = false;
        state.focus = s.c.id;
        desk.snap = 0.6;
        const tk = takesFor(data.stations, s.c);
        drawClapper(s.c.scene, tk && !tk.all ? num(tk.takes) : String(s.c.n).padStart(2, '0'));
        const p = new THREE.Vector3();
        s.a.getWorldPosition(p);
        const dir = new THREE.Vector3(C.x - p.x, 0, C.z - p.z).normalize();
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
        const look = new THREE.Vector3(-2.6 + i * 2.6, 2.85, FLAT.z + 0.14);
        state.mode = 'focus';
        flyTo(look.clone().add(new THREE.Vector3(0, 0.3, narrowNow() ? 4.6 : 3.0)), look);
        showGateSlate(g, i);
        chrome(true);
    } else if (h.type === 'monitor') {
        state.mode = 'focus';
        hideSlate();
        chrome(true);
        flyTo(new THREE.Vector3(0, 1.62, MONITOR.z + 1.2), new THREE.Vector3(0, 1.52, MONITOR.z), 1.0, () => {
            flyTo(new THREE.Vector3(0, 1.52, MONITOR.z + 0.25), new THREE.Vector3(0, 1.52, MONITOR.z - 0.05), 0.7, enterOS);
        });
    } else if (h.type === 'digivice') {
        state.mode = 'focus';
        hideSlate();
        chrome(true);
        dvLift = 1;
        flyTo(new THREE.Vector3(DIGIVICE.x, 1.3, DIGIVICE.z + 0.8), new THREE.Vector3(DIGIVICE.x, 1.18, DIGIVICE.z), 1.1, () => setTimeout(enterPassion, reduce ? 0 : 500));
    } else if (h.type === 'dolly') {
        const id = cast?.onAir();
        if (id) activate({ type: 'agent', id });
    } else if (cast && (h.type === 'throne' || h.type === 'shadow')) {
        const spot = cast.spots.throne();
        const fwd = new THREE.Vector3(Math.sin(-0.62), 0, Math.cos(-0.62));
        const built = cast.monarch().built;
        frameSpot(spot, fwd, built ? 3.3 : 4.6, 0.2, built ? 0.6 : 0);
        if (h.type === 'throne') {
            cast.arise();
            const a = $('arise');
            a.classList.remove('on');
            void a.offsetWidth;
            a.classList.add('on');
        }
        showExtraSlate(h.type === 'throne' ? 'throne' : h.id);
    } else if (cast && h.type === 'robot') {
        const spot = cast.spots.robot();
        frameSpot(spot, towardCamera(spot), 2.8, 0.3);
        showExtraSlate('robot');
    } else if (cast && h.type === 'poster') {
        const spot = cast.spots.poster();
        frameSpot(spot, new THREE.Vector3(0, 0, 1), 2.9, 0.1);
        showExtraSlate('poster');
    }
}
function setSlate({ scene: sc, take, date, role, tint, whatNode, callNode, stats, link, live, takes = null }) {
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
    const tk = $('sTakes');
    tk.hidden = !takes;
    if (takes) {
        const n = data.stations.windowDays;
        const bars = $('sBars');
        bars.style.setProperty('--tint', tint);
        bars.setAttribute('aria-label', stripLabel(takes, n));
        bars.replaceChildren(...stripHeights(takes.days).map((k) => {
            const i = document.createElement('i');
            if (k > 0) i.style.height = `${Math.max(12, Math.round(k * 100))}%`;
            else i.className = 'z';
            return i;
        }));
        $('sTakesLine').textContent = `${takesLine(takes, n)} · read ${ageLabel(data.stations.generatedAt)?.toLowerCase() || 'at an unknown time'}`;
    }
    slate.classList.add('on');
}
function showCrewSlate(c) {
    const nodeOf = (n) => { if (!n) return null; const x = n.cloneNode(true); const span = document.createElement('span'); if (x.dataset?.fig) span.dataset.fig = x.dataset.fig; span.append(...x.childNodes); return span; };
    const hasFig = (n) => !!n && n.querySelector('[data-fig]') !== null;
    const tk = takesFor(data.stations, c);
    setSlate({
        scene: c.scene,
        take: tk && !tk.all ? num(tk.takes) : String(c.n).padStart(2, '0'),
        date: (tk && takeDate(tk.lastAt)) || c.date,
        takes: tk,
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
function showExtraSlate(id) {
    const x = EXTRA_SLATES[id];
    if (!x) return;
    const what = document.createElement('span');
    what.textContent = x.what;
    let call = null;
    if (x.call) { call = document.createElement('span'); call.textContent = x.call; }
    const stats = [];
    if (id === 'throne') {
        const jobs = document.createElement('span');
        jobs.dataset.fig = 'jobs';
        stats.push({ v: String(state.crew.length || DASH), k: 'agents on set' }, { v: jobs, k: 'scheduled jobs' });
    }
    setSlate({ scene: x.scene, take: x.take, date: x.date, role: x.role, tint: x.tint, whatNode: what, callNode: call, stats, link: null, live: id === 'throne' });
}
function hideSlate() { slate.classList.remove('on'); }
function goWide() {
    if (state.mode === 'wide') return;
    state.mode = 'wide';
    state.focus = null;
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
function applyFigures(j) {
    state.figures = (j && j.figures) || {};
    state.generatedAt = (j && j.generatedAt) || null;
    fillFigures(document, state.figures);
    document.querySelectorAll('[data-asof]').forEach((el) => { el.textContent = asOf(); });
    drawGates();
    screens.refresh();
    ribbonText();
    for (const s of agents) {
        s.rolling = rolling(takesFor(data.stations, s.c));
        s.halo.visible = s.rolling;
        if (!s.rolling) s.lamp.material.color.setHex(LAMP_OFF);
    }
}
const setP = crewP.then((crew) => (crew.length ? loadSet(THREE, renderer, crew.length) : null));
const ready = Promise.all([crewP, figsP, setP, dataP]).then(([crew, j, baked]) => {
    state.crew = crew;
    if (baked) {
        state.baked = true;
        if (night) baked.group.traverse((o) => { if (o.isMesh) o.material.color.set(0xdfe2ea); });
        scene.add(baked.group);
        addShadowCatchers();
    } else buildHandSet();
    crew.forEach((c, i) => makeAgent(c, i, crew.length));
    cast = createCast(THREE, { scene, M, RoundedBox: RoundedBoxGeometry, makeTool, hits, crew: agents, onFigure: animeApply });
    animeApply(scene, 'crew');
    if (crew.length) startWalkIn();
    applyFigures(j);
    if (!crew.length) $('hint').textContent = 'The crew did not load. Every source is on the Monitor at jamesdare.com';
});
drawGates();

/* ---------- loop ---------- */
const clock = new THREE.Clock();
let acc = 0;
let shown = false;
const tmpV = new THREE.Vector3();
resize();
rigPos(camera.position);
camera.lookAt(TARGET);
function agentLife(s, t, dt, onAir, runAt) {
    const ph = t + s.phase;
    const m = s.motion;
    s.a.position.y = Math.sin(ph * 1.6) * 0.012;
    if (s.c.tool === 'pad') s.a.position.y = Math.max(0, Math.sin(ph * 2.2)) ** 6 * 0.25;
    // who it is looking at: you on hover, the A camera when on air, the runner at its mark
    s.attn = null;
    if (hover === s.c.id || state.focus === s.c.id) s.attn = camera.position;
    else if (runAt && runAt.id === s.c.id) s.attn = runAt.pos;
    else if (onAir === s.c.id && cast) s.attn = cast.camPos();
    if (s.offcall) {
        const q = (Math.sin(ph * 2.4) + 1) / 2;
        s.a.position.y = -q * 0.12;
        s.arms[0].rotation.x = -q * 1.3;
        s.arms[1].rotation.x = -0.3 - Math.max(0, Math.sin(ph * 2.4)) * 1.6;
        return;
    }
    if (s.wave > 0) {
        s.wave -= dt;
        s.a.rotation.y += (STATION.agent.ry - s.a.rotation.y) * 0.15;
        s.arms[0].rotation.z = -2.6 + Math.sin(t * 12) * 0.35;
        s.arms[0].rotation.x = 0;
    } else {
        s.workT -= dt;
        if (s.workT <= 0) {
            s.work = !s.work && onAir !== s.c.id && !s.attn;
            s.workT = s.work ? 3 + Math.random() * 4 : 4 + Math.random() * 6;
        }
        if (s.attn || onAir === s.c.id) s.work = false;
        const wantY = s.work ? -1.45 : STATION.agent.ry;
        s.a.rotation.y += (wantY - s.a.rotation.y) * Math.min(1, dt * 3);
        s.arms[0].rotation.z += (-0.12 - s.arms[0].rotation.z) * 0.1;
        if (s.work) {
            s.arms[0].rotation.x += (-1.05 + Math.sin(t * 17 + s.phase) * 0.07 - s.arms[0].rotation.x) * 0.3;
            s.arms[1].rotation.x += (-1.0 + Math.sin(t * 15 + s.phase * 2) * 0.07 - s.arms[1].rotation.x) * 0.3;
        } else {
            s.arms[1].rotation.x = m.rx + Math.sin(ph * m.hz) * m.amp;
            s.arms[0].rotation.x = m.both ? m.rx + Math.sin(ph * m.hz + 0.6) * m.amp : -0.75 + Math.sin(ph * 9) * 0.1;
        }
    }
    let yaw = s.work ? 0 : Math.sin(ph * 0.35) > 0.7 ? 0.38 : -0.55;
    let pitch = s.work ? 0.12 : 0;
    if (s.attn) {
        s.a.worldToLocal(tmpV.copy(s.attn));
        tmpV.y -= 1.2;
        yaw = THREE.MathUtils.clamp(Math.atan2(tmpV.x, tmpV.z), -1.1, 1.1);
        pitch = THREE.MathUtils.clamp(-Math.atan2(tmpV.y, Math.hypot(tmpV.x, tmpV.z)), -0.4, 0.4);
    }
    s.head.rotation.y += (yaw - s.head.rotation.y) * Math.min(1, dt * 4);
    s.head.rotation.x += (pitch - s.head.rotation.x) * Math.min(1, dt * 4);
    const blink = Math.sin(ph * 0.9) > 0.985 ? 0.1 : 1;
    s.eyes.forEach((e) => { e.scale.y = blink; });
}
function frame() {
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;
    if (walk && state.mode === 'wide') {
        walk.t += dt;
        const p = walkinPose(Math.max(0, walk.t), shotFor);
        camera.position.fromArray(p.pos);
        view.look.fromArray(p.look);
        if (p.cap !== walk.cap) {
            walk.cap = p.cap;
            hint.textContent = p.cap || hintText;
            hint.classList.toggle('cap', !!p.cap);
        }
        if (p.done) endWalkIn();
    } else if (tween) {
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
    const onAir = cast ? cast.onAir() : null;
    if (cast) cast.update(t, dt, camera, state.mode, reduce);
    if (!reduce) {
        const runAt = cast ? cast.runnerAt() : null;
        for (const s of agents) {
            agentLife(s, t, dt, onAir, runAt);
            if (s.rolling) {
                const k = reduce ? 1 : 0.7 + 0.3 * Math.sin(t * 2.4 + s.phase);
                s.lamp.material.color.copy(LAMP_ON).multiplyScalar(k);
                s.halo.material.opacity = 0.35 + 0.35 * k;
            }
        }
        ribbon.update(dt);
    }
    screens.update(t, camera, onAir, state.focus);
    if (desk.snap > 0) {
        desk.snap -= dt;
        const k = desk.snap > 0.45 ? (0.6 - desk.snap) / 0.15 : desk.snap > 0.3 ? 1 : desk.snap / 0.3;
        desk.stick.rotation.z = 0.3 * (1 - Math.min(1, k));
    }
    dvBody.position.y += (0.2 + (dvLift ? 0.32 : 0) - dvBody.position.y) * 0.08;
    dvBody.rotation.y = dvLift ? dvBody.rotation.y * 0.9 : Math.sin(t * 0.8) * 0.5;
    acc += dt;
    if (acc > 0.2 || !shown) {
        acc = 0;
        drawMonitor(t);
        drawDigivice(t);
    }
    renderer.render(scene, camera);
    if (!shown && agents.length) {
        shown = true;
        requestAnimationFrame(() => $('load').classList.add('off'));
    }
    requestAnimationFrame(frame);
}
ready.finally(() => { setTimeout(() => { if (!shown) { shown = true; $('load').classList.add('off'); } }, 400); });
document.fonts?.ready.then(() => { drawGates(); screens.refresh(); ribbonText(); cast?.redraw(); });
requestAnimationFrame(frame);
window.__studio = { activate, goWide, agents, state, screens, rig, get cast() { return cast; }, get walk() { return walk; }, get look() { return { look: LOOK, meshes: anime.meshes, calls: renderer.info.render.calls }; } };
