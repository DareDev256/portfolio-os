/* cast.js: everyone on the set who is not a source (4.66.0).
 *
 *   - the A camera on its dolly, with a grip, covering whoever is on air;
 *   - a runner doing coffee rounds from craft services to the front row;
 *   - back right, after hours: the throne, the Monarch on it, two shadows;
 *   - stage left, the lab: a builder welding a black beetle-type robot;
 *   - on the back flat, the inspo board: Dr. Vegapunk, one mind, many bodies.
 *
 * None of them is a source, so none of them carries a number. The words they
 * show on click live in EXTRA_SLATES so the name rule can be tested.
 */
import { buildBody, stride } from './rig.js';
import { stationPoint, CENTER, DOLLY, CRAFT, THRONE, LAB, POSTER, FLAT } from './layout.js';

/** Slate copy for the set pieces. Public copy: "James", never a surname. */
export const EXTRA_SLATES = {
    throne: { scene: 'The Throne', take: '00', date: 'AFTER HOURS', role: 'THE MONARCH', tint: '#8f6bff', what: 'After hours the director takes the other chair. Every agent on this set answers to one person.', call: 'Arise.' },
    claude: { scene: 'Claude', take: 'S1', date: 'ALWAYS ON', role: 'SHADOW', tint: '#8f6bff', what: 'The first shadow. The model that builds and checks the work on this set, on the director’s call.' },
    passion: { scene: 'Passion', take: 'S2', date: 'ALWAYS ON', role: 'SHADOW', tint: '#8f6bff', what: 'The second shadow. His own agent: she runs the scheduled jobs, keeps the memory and reports back without being asked. Jack in through the Digivice on the desk.' },
    robot: { scene: 'Robot 01', take: 'R1', date: 'IN DESIGN', role: 'R&D', tint: '#ffd76a', what: 'A black beetle-type robot, after Metabee from Medabots. The first physical build planned for this bench.' },
    poster: { scene: 'Dr. Vegapunk', take: 'IN', date: 'ONE PIECE', role: 'INSPO', tint: '#ff7ab6', what: 'One mind, many bodies. Vegapunk splits his genius across six satellites, each carrying part of the work. This set runs on the same idea: one director, a crew of agents.' },
};

const up = { x: 0, y: 1, z: 0 };

export function createCast(THREE, k) {
    const { scene, M, RoundedBox, makeTool, hits, crew } = k;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const shadowBody = new THREE.MeshPhysicalMaterial({ color: 0x0c0c11, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.18 });
    const cloth = new THREE.MeshStandardMaterial({ color: 0x0b0b10, roughness: 0.92, emissive: 0x0c0718 });
    const violet = new THREE.MeshBasicMaterial({ color: 0xc8b2ff, toneMapped: false });
    const shell = new THREE.MeshPhysicalMaterial({ color: 0x0e0f13, roughness: 0.26, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 });
    const joint = new THREE.MeshStandardMaterial({ color: 0x2a2c33, roughness: 0.5, metalness: 0.6 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xffd76a, roughness: 0.32, metalness: 0.65 });
    const eyeGreen = new THREE.MeshBasicMaterial({ color: 0x5be3a0, toneMapped: false });
    const shadowAll = (o) => o.traverse((c) => { if (c.isMesh && c.material !== M.hit) { c.castShadow = true; c.receiveShadow = true; } });
    const at = (mesh, x, y, z) => { mesh.position.set(x, y, z); return mesh; };
    const between = (a, b, r, mat) => {
        const d = b.clone().sub(a);
        const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, d.length() - 2 * r), 4, 10), mat);
        m.position.copy(a).add(b).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(V(up.x, up.y, up.z), d.normalize());
        return m;
    };
    const hitBox = (parent, w, h, d, y, hot) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.hit);
        b.position.y = y;
        b.userData.hot = hot;
        parent.add(b);
        hits.push(b);
        return b;
    };
    function glowSprite(color, size) {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, 64, 64);
        const t = new THREE.CanvasTexture(c);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
        s.scale.setScalar(size);
        return s;
    }

    /* ------------------------------------------------ the A camera and its grip */
    const dolly = new THREE.Group();
    dolly.position.set(DOLLY.x, 0, (DOLLY.z0 + DOLLY.z1) / 2);
    scene.add(dolly);
    {
        const deck = new THREE.Mesh(new RoundedBox(0.84, 0.08, 1.1, 2, 0.02), M.dark);
        deck.position.y = 0.2;
        dolly.add(deck);
        for (const x of [-0.3, 0.3]) for (const z of [-0.42, 0.42]) {
            const w = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 14), M.steel);
            w.rotation.z = Math.PI / 2;
            w.position.set(x, 0.14, z);
            dolly.add(w);
        }
    }
    const pan = new THREE.Group();
    pan.position.y = 0.24;
    dolly.add(pan);
    const tilt = new THREE.Group();
    {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.05, 12), M.steel);
        col.position.y = 0.52;
        pan.add(col);
        tilt.position.y = 1.18;
        pan.add(tilt);
        const body = new THREE.Mesh(new RoundedBox(0.3, 0.28, 0.5, 3, 0.03), M.dark);
        tilt.add(body);
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.3, 24), M.dark);
        lens.rotation.x = Math.PI / 2;
        lens.position.z = 0.38;
        tilt.add(lens);
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.04), M.dark);
        box.position.z = 0.55;
        tilt.add(box);
        const mon = new THREE.Mesh(new RoundedBox(0.22, 0.14, 0.03, 2, 0.01), M.dark);
        mon.position.set(-0.22, 0.12, -0.05);
        mon.rotation.y = 0.5;
        tilt.add(mon);
    }
    const tally = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff2d55, toneMapped: false }));
    tally.position.set(0.12, 0.17, 0.2);
    tilt.add(tally);
    const grip = buildBody(THREE, RoundedBox, { body: M.white, visor: M.visor, steel: M.steel }, new THREE.MeshStandardMaterial({ color: '#a98bff', emissive: '#a98bff', emissiveIntensity: 1.2 }));
    grip.a.position.z = -0.62;
    pan.add(grip.a);
    grip.arms.forEach((p) => { p.rotation.x = -1.1; });
    hitBox(dolly, 1.2, 2.0, 1.4, 1.0, { type: 'dolly', label: 'A camera · covering whoever is on air', tint: '#ff2d55' });
    shadowAll(dolly);

    /* on-air order: every source that has a picture, in the Monitor's order */
    const order = crew.filter((s) => !s.offcall);
    let airIdx = 0;
    let airAt = -99;
    const airTarget = V(0, 0, 0);

    /* ------------------------------------------------ the runner */
    const runner = buildBody(THREE, RoundedBox, { body: M.white, visor: M.visor, steel: M.steel }, new THREE.MeshStandardMaterial({ color: '#ff2d55', emissive: '#ff2d55', emissiveIntensity: 1.2 }));
    scene.add(runner.a);
    {
        const tray = new THREE.Group();
        tray.position.set(0, 0.86, 0.36);
        runner.a.add(tray);
        tray.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.22), M.white));
        for (const x of [-0.1, 0, 0.1]) {
            const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.028, 0.09, 12), M.white);
            cup.position.set(x, 0.055, 0);
            tray.add(cup);
            const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.012, 12), M.dark);
            lid.position.set(x, 0.105, 0);
            tray.add(lid);
        }
        runner.tray = tray;
    }
    runner.arms.forEach((p) => { p.rotation.x = -1.25; p.rotation.z *= 0.4; });
    shadowAll(runner.a);
    const craftPose = { x: CRAFT.x, y: 0, z: CRAFT.z, ry: CRAFT.ry };
    const pickup = stationPoint(craftPose, 0, 0, 0.8);
    runner.a.position.set(pickup.x, 0, pickup.z);
    const R = 3.95;
    const arcPt = (a) => V(CENTER.x + Math.sin(a) * R, 0, CENTER.z - Math.cos(a) * R);
    const angOf = (p) => Math.atan2(p.x - CENTER.x, CENTER.z - p.z);
    const run = { path: [], wait: 1.5, legs: 0, target: null, delivered: 0 };
    const front = crew.filter((s) => !s.back && !s.offcall);
    function routeTo(dest, finalPt) {
        const here = runner.a.position.clone();
        const pts = [];
        let a0 = angOf(here);
        if (here.distanceTo(V(CENTER.x, 0, CENTER.z)) > R + 0.6) pts.push(arcPt(THREE.MathUtils.clamp(a0, -1.25, 1.25)));
        a0 = THREE.MathUtils.clamp(a0, -1.25, 1.25);
        const a1 = THREE.MathUtils.clamp(angOf(dest), -1.25, 1.25);
        const n = Math.ceil(Math.abs(a1 - a0) / 0.12);
        for (let i = 1; i <= n; i++) pts.push(arcPt(a0 + ((a1 - a0) * i) / n));
        pts.push(finalPt);
        run.path = pts;
    }
    function nextErrand() {
        if (run.delivered >= 2 || !front.length) {
            run.delivered = 0;
            run.target = null;
            routeTo(V(pickup.x, 0, pickup.z), V(pickup.x, 0, pickup.z));
            run.path.splice(run.path.length - 1, 0, arcPt(1.15));
            return;
        }
        const s = front[(Math.random() * front.length) | 0];
        const p = new THREE.Vector3();
        s.a.getWorldPosition(p);
        const toC = V(CENTER.x - p.x, 0, CENTER.z - p.z).normalize();
        run.target = s;
        routeTo(p, p.clone().addScaledVector(toC, 0.72));
    }

    /* ------------------------------------------------ the throne: the Monarch and two shadows */
    const throne = new THREE.Group();
    throne.position.set(THRONE.x, 0, THRONE.z);
    throne.rotation.y = THRONE.ry;
    scene.add(throne);
    const y0 = THRONE.steps * THRONE.step;
    const monarch = new THREE.Group();
    monarch.position.set(0, y0 + 0.5, -0.62);
    throne.add(monarch);
    const mHead = new THREE.Group();
    const halos = [];
    {
        monarch.add(between(V(-0.15, 0.1, 0), V(0.15, 0.1, 0), 0.16, cloth));
        const torso = between(V(0, 0.22, -0.02), V(0, 0.68, -0.1), 0.22, cloth);
        monarch.add(torso);
        monarch.userData.torso = torso;
        monarch.add(between(V(-0.31, 0.76, -0.1), V(0.31, 0.76, -0.1), 0.12, cloth));
        // a long coat: a high collar, and tails falling over the front of the seat
        const coatMat = new THREE.MeshStandardMaterial({ color: 0x07070a, roughness: 0.9, side: THREE.DoubleSide });
        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.2, 18, 1, true, Math.PI * 0.15, Math.PI * 1.7), coatMat);
        collar.position.set(0, 0.88, -0.1);
        collar.rotation.y = Math.PI;
        monarch.add(collar);
        for (const sx of [-1, 1]) {
            const tail = new THREE.Mesh(new RoundedBox(0.2, 0.62, 0.025, 2, 0.01), coatMat);
            tail.position.set(sx * 0.33, -0.2, 0.43);
            tail.rotation.set(-0.06, 0, sx * 0.05);
            monarch.add(tail);
        }
        mHead.position.set(0, 1.0, -0.08);
        mHead.rotation.x = 0.16;
        monarch.add(mHead);
        mHead.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), cloth));
        const hood = new THREE.Mesh(new THREE.SphereGeometry(0.175, 24, 16, Math.PI / 2 + 0.85, Math.PI * 2 - 1.7, 0, Math.PI * 0.78), new THREE.MeshStandardMaterial({ color: 0x08080c, roughness: 0.95, side: THREE.DoubleSide }));
        hood.scale.set(1, 1.12, 1.08);
        hood.position.set(0, 0.02, -0.02);
        mHead.add(hood);
        for (const x of [-0.048, 0.048]) {
            const e = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.014, 0.01), violet);
            e.position.set(x, 0.0, 0.126);
            e.rotation.z = x < 0 ? -0.18 : 0.18;
            mHead.add(e);
            const h = glowSprite('rgba(176,140,255,0.95)', 0.16);
            h.position.set(x, 0.0, 0.14);
            mHead.add(h);
            halos.push(h);
        }
        for (const sx of [-1, 1]) {
            const hip = V(sx * 0.12, 0.08, 0.02);
            const knee = V(sx * 0.22, 0.12, 0.42);
            const foot = V(sx * 0.26, -0.44, 0.5);
            monarch.add(between(hip, knee, 0.085, cloth));
            monarch.add(between(knee, foot, 0.075, cloth));
            const boot = new THREE.Mesh(new RoundedBox(0.13, 0.08, 0.24, 2, 0.03), cloth);
            boot.position.set(sx * 0.26, -0.47, 0.57);
            monarch.add(boot);
            const sh = V(sx * 0.3, 0.72, -0.1);
            const el = V(sx * 0.6, 0.24, -0.18);
            const wr = V(sx * 0.62, 0.24, 0.2);
            monarch.add(between(sh, el, 0.07, cloth));
            monarch.add(between(el, wr, 0.06, cloth));
            const fist = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), cloth);
            fist.position.copy(wr).add(V(0, 0, 0.05));
            monarch.add(fist);
        }
        const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.34, 0.5, 18, 1, true), new THREE.MeshStandardMaterial({ color: 0x09090d, roughness: 0.95, side: THREE.DoubleSide }));
        coat.position.set(0, -0.05, 0.02);
        monarch.add(coat);
    }
    const shadows = [];
    for (const [sx, id] of [[-1, 'claude'], [1, 'passion']]) {
        const r = buildBody(THREE, RoundedBox, { body: shadowBody, visor: M.visor, steel: joint }, violet);
        r.a.position.set(sx * 1.08, y0, -0.25);
        r.a.rotation.y = -sx * 0.12;
        throne.add(r.a);
        const blade = makeTool(THREE, 'sword', '#8f6bff', M);
        blade.position.set(0, -0.4, 0.02);
        r.arms[sx < 0 ? 0 : 1].add(blade);
        hitBox(r.a, 0.7, 1.7, 0.7, 0.85, { type: 'shadow', id, label: `Shadow · ${EXTRA_SLATES[id].scene}`, tint: '#8f6bff' });
        shadows.push(r);
    }
    hitBox(throne, 1.5, 3.6, 1.6, y0 + 1.6, { type: 'throne', id: 'throne', label: 'The Monarch · James, after hours', tint: '#8f6bff' }).position.z = -0.7;
    shadowAll(throne);
    const smoke = [];
    for (let i = 0; i < 26; i++) {
        const s = glowSprite('rgba(34,22,66,0.55)', 0.5);
        s.material.blending = THREE.NormalBlending;
        s.userData.life = Math.random() * 4;
        throne.add(s);
        smoke.push(s);
    }
    let arise = 0;

    /* ------------------------------------------------ the lab: a builder, a black beetle-type robot */
    const labPose = { x: LAB.x, y: 0, z: LAB.z, ry: LAB.ry };
    const robot = new THREE.Group();
    robot.position.set(LAB.robot.x, 1.2, LAB.robot.z);
    robot.rotation.y = Math.atan2(-LAB.robot.x, 12.3 - LAB.robot.z) - 0.35;
    scene.add(robot);
    const rHead = new THREE.Group();
    let rEye;
    const socket = V(-0.31, 0.4, 0); // the open shoulder faces the builder
    {
        const torso = new THREE.Mesh(new RoundedBox(0.46, 0.4, 0.32, 3, 0.06), shell);
        torso.position.y = 0.26;
        robot.add(torso);
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.01), gold);
        stripe.position.set(0, 0.36, 0.162);
        robot.add(stripe);
        const emblem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 6), gold);
        emblem.rotation.x = Math.PI / 2;
        emblem.position.set(0, 0.22, 0.162);
        robot.add(emblem);
        robot.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 10), joint), 0, 0.5, 0));
        rHead.position.y = 0.64;
        robot.add(rHead);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), shell);
        dome.scale.set(1, 0.86, 1);
        rHead.add(dome);
        const visor = new THREE.Mesh(new RoundedBox(0.27, 0.085, 0.07, 2, 0.03), M.visor);
        visor.position.set(0, -0.01, 0.135);
        rHead.add(visor);
        rEye = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.022, 0.01), eyeGreen);
        rEye.position.set(0, -0.01, 0.172);
        rHead.add(rEye);
        for (const sx of [-1, 1]) {
            const horn = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.36, 10), shell);
            horn.position.set(sx * 0.1, 0.24, -0.05);
            horn.rotation.set(-0.3, 0, -sx * 0.38);
            rHead.add(horn);
            const tip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), gold);
            tip.position.set(sx * 0.17, 0.41, -0.1);
            rHead.add(tip);
            const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16), gold);
            ear.rotation.z = Math.PI / 2;
            ear.position.set(sx * 0.17, 0, 0);
            rHead.add(ear);
        }
        for (const sx of [-1, 1]) {
            const sh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), shell);
            sh.position.set(sx * 0.3, 0.4, 0);
            robot.add(sh);
        }
        const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 14), joint);
        sock.rotation.z = Math.PI / 2;
        sock.position.set(-0.39, 0.4, 0);
        robot.add(sock);
        robot.add(between(V(0.32, 0.38, 0), V(0.35, 0.12, 0.02), 0.065, joint));
        const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.3, 16), shell);
        gun.rotation.x = Math.PI / 2;
        gun.position.set(0.35, 0.08, 0.13);
        robot.add(gun);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.14, 10), joint);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0.35, 0.08, 0.34);
        robot.add(barrel);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 8, 20), gold);
        ring.position.set(0.35, 0.08, 0.27);
        robot.add(ring);
        const hipB = new THREE.Mesh(new RoundedBox(0.34, 0.1, 0.22, 2, 0.03), joint);
        hipB.position.y = -0.02;
        robot.add(hipB);
        robot.add(between(V(-0.11, -0.06, 0), V(-0.11, -0.32, 0), 0.07, joint));
        const shin = new THREE.Mesh(new RoundedBox(0.15, 0.3, 0.17, 2, 0.04), shell);
        shin.position.set(-0.11, -0.5, 0.01);
        robot.add(shin);
        const foot = new THREE.Mesh(new RoundedBox(0.16, 0.06, 0.27, 2, 0.02), shell);
        foot.position.set(-0.11, -0.68, 0.05);
        robot.add(foot);
        const wires = ['#ff2d55', '#6fd3ff', '#ffd76a'];
        wires.forEach((col, i) => {
            const curve = new THREE.CatmullRomCurve3([V(-0.4, 0.4, -0.02 + i * 0.02), V(-0.47, 0.25, 0.03 * i), V(-0.44 - i * 0.03, 0.05, 0.05 - i * 0.04), V(-0.5 - i * 0.02, -0.15 - i * 0.05, 0.02)]);
            robot.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.008, 5), new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 })));
        });
        hitBox(robot, 0.9, 1.6, 0.8, 0.0, { type: 'robot', id: 'robot', label: 'R&D · Robot 01, in design', tint: '#ffd76a' });
    }
    shadowAll(robot);
    /* the parts that are not on yet: a leg on the floor, an arm on the bench */
    {
        const leg = new THREE.Group();
        const lp = stationPoint({ x: LAB.robot.x, y: 0, z: LAB.robot.z, ry: robot.rotation.y }, 0.55, 0, 0.15);
        leg.position.set(lp.x, 0, lp.z);
        leg.rotation.y = robot.rotation.y + 0.6;
        scene.add(leg);
        leg.add(at(new THREE.Mesh(new RoundedBox(0.16, 0.06, 0.27, 2, 0.02), shell), 0, 0.03, 0.05));
        leg.add(at(new THREE.Mesh(new RoundedBox(0.15, 0.3, 0.17, 2, 0.04), shell), 0, 0.22, 0.01));
        leg.add(between(V(0, 0.38, 0), V(0, 0.62, 0), 0.07, joint));
        shadowAll(leg);
        const arm = new THREE.Group();
        const ap = stationPoint(labPose, 0.25, 0.93, 0.12);
        arm.position.set(ap.x, ap.y, ap.z);
        arm.rotation.y = LAB.ry + 1.2;
        scene.add(arm);
        const g2 = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.3, 16), shell);
        g2.rotation.z = Math.PI / 2;
        g2.position.set(0, 0.08, 0);
        arm.add(g2);
        arm.add(between(V(-0.15, 0.08, 0), V(-0.38, 0.07, 0.02), 0.06, joint));
        const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.12, 10), joint);
        b2.rotation.z = Math.PI / 2;
        b2.position.set(0.21, 0.08, 0);
        arm.add(b2);
        shadowAll(arm);
    }
    const builder = buildBody(THREE, RoundedBox, { body: M.white, visor: M.visor, steel: M.steel }, new THREE.MeshStandardMaterial({ color: '#ffd76a', emissive: '#ffd76a', emissiveIntensity: 1.2 }));
    builder.a.position.set(LAB.builder.x, 0, LAB.builder.z);
    robot.updateMatrixWorld();
    const sockW = robot.localToWorld(socket.clone().add(V(-0.08, 0, 0)));
    builder.a.rotation.y = Math.atan2(sockW.x - LAB.builder.x, sockW.z - LAB.builder.z);
    scene.add(builder.a);
    {
        const torch = new THREE.Group();
        torch.position.set(0, -0.42, 0.04);
        torch.rotation.x = -1.2;
        builder.arms[1].add(torch);
        torch.add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.2, 10), M.steel));
        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.08, 8), M.dark);
        nozzle.position.y = 0.13;
        torch.add(nozzle);
        builder.flame = glowSprite('rgba(170,210,255,1)', 0.14);
        builder.flame.position.y = 0.19;
        torch.add(builder.flame);
    }
    shadowAll(builder.a);
    const SPARKS = 70;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(SPARKS * 3).fill(-50);
    const sparkVel = new Float32Array(SPARKS * 3);
    const sparkLife = new Float32Array(SPARKS);
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xffa21a, size: 0.035, transparent: true, opacity: 0.95, depthWrite: false }));
    sparks.frustumCulled = false;
    scene.add(sparks);
    let sparkNext = 0;

    /* ------------------------------------------------ the inspo board on the back flat */
    const board = new THREE.Group();
    board.position.set(POSTER.x, POSTER.y, FLAT.z + 0.13);
    scene.add(board);
    const sats = [];
    {
        const frame = new THREE.Mesh(new RoundedBox(POSTER.w + 0.08, POSTER.h + 0.08, 0.05, 2, 0.015), M.dark);
        board.add(frame);
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = Math.round((512 * POSTER.h) / POSTER.w);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        const face = new THREE.Mesh(new THREE.PlaneGeometry(POSTER.w, POSTER.h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }));
        face.position.z = 0.027;
        board.add(face);
        board.userData.draw = () => {
            const x = c.getContext('2d');
            const h = c.height;
            x.fillStyle = '#fff';
            x.fillRect(0, 0, 512, h);
            x.fillStyle = '#5c5e66';
            x.font = '600 22px "JetBrains Mono", monospace';
            x.fillText('INSPO · ONE PIECE', 34, 58);
            x.fillStyle = '#0a0a0b';
            let size = 60;
            do x.font = `800 ${size--}px Archivo, "Arial Narrow", sans-serif`; while (x.measureText('DR. VEGAPUNK').width > 512 - 66 && size > 30);
            x.fillText('DR. VEGAPUNK', 32, 122);
            x.strokeStyle = 'rgba(10,10,11,.18)';
            x.lineWidth = 2;
            x.beginPath();
            x.ellipse(256, 372, 190, 150, 0, 0, 7);
            x.stroke();
            x.fillStyle = '#0a0a0b';
            x.beginPath();
            x.arc(256, 372, 62, 0, 7);
            x.fill();
            x.fillStyle = '#fff';
            x.font = '800 22px "JetBrains Mono", monospace';
            x.textAlign = 'center';
            x.fillText('ONE', 256, 366);
            x.fillText('MIND', 256, 392);
            x.textAlign = 'left';
            x.fillStyle = '#0a0a0b';
            x.font = '800 40px Archivo, "Arial Narrow", sans-serif';
            x.fillText('One mind,', 34, h - 112);
            x.fillText('many bodies.', 34, h - 66);
            x.fillStyle = '#ff2d55';
            x.fillRect(34, h - 40, 70, 7);
            t.needsUpdate = true;
        };
        board.userData.draw();
        const disc = new THREE.CircleGeometry(0.035, 20);
        crew.forEach((s) => {
            const m = new THREE.Mesh(disc, new THREE.MeshBasicMaterial({ color: s.c.tint, toneMapped: false }));
            m.position.z = 0.03;
            board.add(m);
            sats.push(m);
        });
        const hb = hitBox(board, POSTER.w, POSTER.h, 0.2, 0, { type: 'poster', id: 'poster', label: 'Inspo · Dr. Vegapunk', tint: '#ff7ab6' });
        hb.position.z = 0.05;
    }
    const satC = { x: 0, y: POSTER.h / 2 - (372 / Math.round((512 * POSTER.h) / POSTER.w)) * POSTER.h };
    const satR = { x: (190 / 512) * POSTER.w, y: (150 / Math.round((512 * POSTER.h) / POSTER.w)) * POSTER.h };

    /* ------------------------------------------------ per frame */
    const tmp = V(0, 0, 0);
    const tmp2 = V(0, 0, 0);
    function update(t, dt, camera, mode, reduce) {
        // on air: a new source every eight seconds
        if (order.length && t - airAt > 8) {
            airAt = t;
            airIdx = (airIdx + 1) % order.length;
        }
        const air = order[airIdx];
        if (air) {
            air.a.getWorldPosition(airTarget);
            const zT = THREE.MathUtils.clamp(airTarget.z + 2.2, Math.min(DOLLY.z0, DOLLY.z1), Math.max(DOLLY.z0, DOLLY.z1));
            const dz = zT - dolly.position.z;
            const step = THREE.MathUtils.clamp(dz, -0.7 * dt, 0.7 * dt);
            dolly.position.z += reduce ? dz : step;
            stride(grip, dolly.position.z * 7, Math.min(1, Math.abs(step / dt) / 0.7));
            dolly.updateMatrixWorld();
            tmp.copy(airTarget).add(V(0, 1.2, 0));
            pan.worldToLocal(tmp2.copy(tmp));
            pan.rotation.y += Math.atan2(tmp2.x, tmp2.z) * Math.min(1, dt * 2.5);
            const flat = Math.hypot(tmp2.x, tmp2.z);
            tilt.rotation.x = THREE.MathUtils.lerp(tilt.rotation.x, -Math.atan2(tmp2.y - 1.18, flat), Math.min(1, dt * 2.5));
            tally.visible = Math.floor(t * 2) % 2 === 0;
        }
        if (reduce) return;

        // runner
        if (run.wait > 0) {
            run.wait -= dt;
            runner.a.position.y = 0;
            if (run.target && run.wait > 0) {
                run.target.a.getWorldPosition(tmp);
                runner.a.rotation.y = Math.atan2(tmp.x - runner.a.position.x, tmp.z - runner.a.position.z);
                runner.arms.forEach((p) => { p.rotation.x = THREE.MathUtils.lerp(p.rotation.x, -1.45, dt * 4); });
            }
            if (run.wait <= 0) {
                if (run.target) run.delivered += 1;
                nextErrand();
            }
        } else if (run.path.length) {
            const p = run.path[0];
            tmp.copy(p).sub(runner.a.position);
            tmp.y = 0;
            const d = tmp.length();
            const v = 1.15 * dt;
            if (d <= v) {
                runner.a.position.x = p.x;
                runner.a.position.z = p.z;
                run.path.shift();
                if (!run.path.length) run.wait = run.target ? 1.8 : 2.6;
            } else {
                tmp.multiplyScalar(v / d);
                runner.a.position.add(tmp);
                const want = Math.atan2(tmp.x, tmp.z);
                let dr = want - runner.a.rotation.y;
                dr = Math.atan2(Math.sin(dr), Math.cos(dr));
                runner.a.rotation.y += dr * Math.min(1, dt * 8);
            }
            run.legs += v * 7;
            stride(runner, run.legs, 1);
            runner.arms.forEach((p) => { p.rotation.x = THREE.MathUtils.lerp(p.rotation.x, -1.2, dt * 4); });
        }

        // the Monarch
        throne.updateMatrixWorld();
        mHead.getWorldPosition(tmp);
        monarch.worldToLocal(tmp2.copy(camera.position));
        const look = THREE.MathUtils.clamp(Math.atan2(tmp2.x, tmp2.z), -0.45, 0.45);
        mHead.rotation.y = THREE.MathUtils.lerp(mHead.rotation.y, look, dt * 0.8);
        monarch.userData.torso.scale.y = 1 + Math.sin(t * 1.1) * 0.012;
        arise = Math.max(0, arise - dt);
        const flare = 1 + arise * 1.6 + (Math.sin(t * 2.3) * 0.5 + 0.5) * 0.25;
        halos.forEach((h) => h.scale.setScalar(0.16 * flare));
        shadows.forEach((r, i) => {
            const kneel = Math.min(1, arise * 1.2);
            r.a.position.y = y0 - kneel * 0.22 + Math.sin(t * 1.4 + i) * 0.006;
            r.legs[0].rotation.x = -kneel * 1.3;
            r.legs[1].rotation.x = kneel * 0.5;
            r.head.rotation.x = kneel * 0.5;
            r.eyes.forEach((e) => { e.scale.y = Math.sin(t * 0.7 + i * 2) > 0.985 ? 0.1 : 1; });
        });
        for (const s of smoke) {
            s.userData.life += dt * (1 + arise);
            const life = s.userData.life % 4;
            if (life < dt * 2 || !s.userData.seeded) {
                s.userData.seeded = true;
                s.userData.x = (Math.random() - 0.5) * 3.0;
                s.userData.z = (Math.random() - 0.3) * 2.0;
            }
            const k = life / 4;
            s.position.set(s.userData.x + Math.sin(t * 0.6 + s.userData.z * 3) * 0.08, 0.1 + k * 2.4, s.userData.z - 0.4);
            s.scale.setScalar(0.35 + k * 0.9);
            s.material.opacity = Math.sin(k * Math.PI) * (0.55 + arise * 0.3);
        }

        // the lab: weld for a while, step back, look, weld again
        const cyc = (t + 3) % 7;
        const welding = cyc < 4.8;
        builder.flame.visible = welding && Math.random() > 0.15;
        builder.flame.scale.setScalar(0.1 + Math.random() * 0.08);
        builder.arms[1].rotation.x = THREE.MathUtils.lerp(builder.arms[1].rotation.x, welding ? -1.35 + Math.sin(t * 9) * 0.03 : -0.4, dt * 5);
        builder.arms[0].rotation.x = THREE.MathUtils.lerp(builder.arms[0].rotation.x, welding ? -0.9 : -0.2, dt * 5);
        builder.head.rotation.x = THREE.MathUtils.lerp(builder.head.rotation.x, welding ? 0.25 : -0.05, dt * 3);
        builder.head.rotation.y = welding ? 0 : Math.sin(t * 1.3) * 0.35;
        rEye.visible = welding ? Math.random() > 0.6 : true;
        rHead.rotation.y = welding ? 0 : Math.sin(t * 2) * 0.12;
        if (welding && t > sparkNext) {
            sparkNext = t + 0.016;
            const at = robot.localToWorld(socket.clone().add(V(-0.09, 0, 0)));
            for (let n = 0; n < 3; n++) {
                const i = (Math.random() * SPARKS) | 0;
                if (sparkLife[i] > 0) continue;
                sparkPos.set([at.x, at.y, at.z], i * 3);
                const a = Math.random() * Math.PI * 2;
                const sp = 1.2 + Math.random() * 2.2;
                sparkVel.set([Math.cos(a) * sp * 0.7, 0.8 + Math.random() * 1.8, Math.sin(a) * sp * 0.7], i * 3);
                sparkLife[i] = 0.35 + Math.random() * 0.45;
            }
        }
        for (let i = 0; i < SPARKS; i++) {
            if (sparkLife[i] <= 0) continue;
            sparkLife[i] -= dt;
            sparkVel[i * 3 + 1] -= 7.5 * dt;
            sparkPos[i * 3] += sparkVel[i * 3] * dt;
            sparkPos[i * 3 + 1] = Math.max(0.01, sparkPos[i * 3 + 1] + sparkVel[i * 3 + 1] * dt);
            sparkPos[i * 3 + 2] += sparkVel[i * 3 + 2] * dt;
            if (sparkLife[i] <= 0) sparkPos[i * 3 + 1] = -50;
        }
        sparkGeo.attributes.position.needsUpdate = true;

        // the inspo board's satellites
        sats.forEach((m, i) => {
            const a = (i / sats.length) * Math.PI * 2 + t * 0.18;
            m.position.x = satC.x + Math.cos(a) * satR.x;
            m.position.y = satC.y + Math.sin(a) * satR.y;
        });
    }

    nextErrand();
    const camW = V(0, 0, 0);
    const runW = V(0, 0, 0);
    return {
        update,
        onAir: () => order[airIdx]?.c.id ?? null,
        camPos: () => tilt.getWorldPosition(camW),
        runnerAt: () => (run.wait > 0 && run.target ? { id: run.target.c.id, pos: runner.head.getWorldPosition(runW) } : null),
        arise: () => { arise = 1.6; },
        redraw: () => board.userData.draw(),
        spots: {
            throne: () => throne.localToWorld(V(0, y0 + 1.6, 0.2)),
            robot: () => robot.localToWorld(V(0, 0.2, 0)),
            poster: () => board.localToWorld(V(0, 0, 0)),
        },
    };
}
