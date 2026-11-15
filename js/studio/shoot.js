/* shoot.js: the photoshoot corner (4.77.0).
 *
 * Open floor past craft services, stage right: a paper sweep, two softboxes on stands and a
 * camera on a tripod. James and his co-star stand on the sweep. The first tap flies in; every tap
 * after that fires the flash, moves them to the next pose and prints a polaroid of the frame. The
 * figures are Blender stand-ins (tools/studio/build_shoot.py, three baked poses each) until the
 * anime characters are made from the design sheets. The corner only exists when the address asks
 * for it (?shoot=1) until the co-star says yes to her likeness on the public site; no personal name
 * appears in any shipped file.
 */

export const SHOOT = { x: 13.5, z: 0.5, ry: -1.35 };
export const SHOOT_FILES = { james: '/assets/studio/shoot-james.gltf', costar: '/assets/studio/shoot-costar.gltf' };
/** Real heights in metres, so the stand-ins read right beside each other whatever the build measured. */
export const SHOOT_HEIGHT = { james: 1.85, costar: 1.6 };
/** Where each stands on the sweep (its own space: +Z faces the tripod) and how far each turns in. */
export const SHOOT_MARKS = { james: { x: -0.42, z: 0.35, ry: 0.12 }, costar: { x: 0.42, z: 0.35, ry: -0.12 } };

/** ?shoot=1 shows the corner; anything else hides it. */
export function shootFrom(search = '') {
    return /[?&]shoot=1(&|$)/.test(search);
}

/** The pose after k of n, wrapping. */
export function nextPose(k, n) {
    return n > 0 ? (k + 1) % n : 0;
}

/** The polaroid caption for a take. No names: the corner is public before the co-star's yes. */
export function polaroidCaption(take, when = new Date()) {
    const d = when.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
    return `TAKE ${String(take).padStart(2, '0')} · THE SHOOT · ${d}`;
}

/** The centred crop of a w x h frame at a portrait aspect (width / height), zoomed in a little, as drawImage source args. */
export function polaroidCrop(w, h, aspect = 4 / 5, zoom = 0.84) {
    let sw = w * zoom, sh = Math.round(sw / aspect);
    if (sh > h * zoom) { sh = Math.round(h * zoom); sw = Math.round(sh * aspect); }
    sw = Math.round(sw);
    return { sx: Math.round((w - sw) / 2), sy: Math.round((h - sh) / 2), sw, sh };
}

export function createShoot(THREE, { scene, onFigure, hits, hitMat }) {
    const g = new THREE.Group();
    g.name = 'shoot';
    g.position.set(SHOOT.x, 0.012, SHOOT.z); // a hair above the stage floor, or the paper z-fights it
    g.rotation.y = SHOOT.ry;
    scene.add(g);

    // the paper sweep: floor, a cove, a back wall, one surface
    const W = 6.2, D = 3.8, R = 0.6, H = 3.6; // wide enough that a desktop frame is all paper
    const prof = [[D, 0]];
    for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI / 2; prof.push([R - Math.sin(a) * R, R - Math.cos(a) * R]); }
    prof.push([0, H]);
    const pos = [], idx = [];
    prof.forEach(([z, y]) => { pos.push(-W / 2, y, z - 0.6, W / 2, y, z - 0.6); });
    for (let i = 0; i < prof.length - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    sg.setIndex(idx);
    sg.computeVertexNormals();
    const paper = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: 0xf4f4f8, emissive: 0x2c2c32, roughness: 0.95, side: THREE.DoubleSide }));
    paper.receiveShadow = true;
    paper.userData.noToon = true; // seamless paper has no edges to ink
    g.add(paper);

    const steel = new THREE.MeshStandardMaterial({ color: 0x1a1a1f, roughness: 0.45, metalness: 0.6 });
    const glow = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    const stand = (x, z, ry, h) => {
        const s = new THREE.Group();
        s.position.set(x, 0, z);
        s.rotation.y = ry;
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, h, 8), steel);
        pole.position.y = h / 2;
        s.add(pole);
        for (let i = 0; i < 3; i++) {
            const a = (i * Math.PI * 2) / 3;
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 6), steel);
            leg.position.set(Math.sin(a) * 0.17, 0.22, Math.cos(a) * 0.17);
            leg.rotation.set(-Math.cos(a) * 0.65, 0, Math.sin(a) * 0.65); // top in, foot out
            s.add(leg);
        }
        g.add(s);
        return s;
    };
    // two softboxes, each turned to face the couple
    for (const sx of [-1, 1]) {
        const s = stand(sx * 2.1, 1.2, sx * 1.2, 1.9);
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.95, 0.35), steel);
        box.position.set(0, 2.05, 0);
        s.add(box);
        const face = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.88), glow);
        face.position.set(0, 2.05, -0.18);
        face.rotation.y = Math.PI;
        s.add(face);
    }
    // the camera on its tripod, off to one side so the view over its shoulder stays clear
    const cam = stand(-0.95, 2.5, Math.PI - 0.41, 1.35);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.12), steel);
    body.position.set(0, 1.45, 0);
    cam.add(body);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.12, 16), steel);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 1.45, 0.11);
    cam.add(lens);
    const flashLamp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.03), glow);
    flashLamp.position.set(0, 1.56, 0.04);
    cam.add(flashLamp);
    const strobe = new THREE.PointLight(0xffffff, 0, 7, 1.5);
    strobe.position.set(-0.8, 1.7, 2.3);
    g.add(strobe);

    const hot = { type: 'shoot', id: 'shoot', label: 'The shoot · tap to take a photo', tint: '#ff2d55' };
    const hit = new THREE.Mesh(new THREE.BoxGeometry(5, 2.4, 3.8), hitMat);
    hit.position.set(0, 1.2, 0.8);
    hit.userData.hot = hot;
    g.add(hit);
    hits.push(hit);

    // the couple: stand-ins loaded on first use, three baked poses each
    const people = {};
    let pose = 0, take = 0, flash = 0, loading = null;
    function load() {
        if (loading) return loading;
        loading = import('./vendor/GLTFLoader.js').then(async ({ GLTFLoader }) => {
            const loader = new GLTFLoader();
            await Promise.all(Object.entries(SHOOT_FILES).map(async ([who, url]) => {
                try {
                    const root = (await loader.loadAsync(url)).scene;
                    const poses = root.children.filter((o) => /^pose_/.test(o.name)).sort((a, b) => a.name.localeCompare(b.name));
                    if (!poses.length) throw new Error('no poses');
                    const box = new THREE.Box3().setFromObject(poses[0]);
                    root.scale.setScalar(SHOOT_HEIGHT[who] / Math.max(0.01, box.max.y - box.min.y));
                    const mk = SHOOT_MARKS[who];
                    root.position.set(mk.x, 0, mk.z);
                    root.rotation.y = mk.ry;
                    poses.forEach((p, i) => {
                        p.visible = i === pose % poses.length;
                        p.traverse((o) => { if (o.isMesh) o.castShadow = true; });
                    });
                    g.add(root);
                    people[who] = poses;
                } catch (e) {
                    console.warn(`studio: shoot stand-in ${who} not loaded (${e.message})`);
                }
            }));
            onFigure?.(g, 'crew');
            return people;
        });
        return loading;
    }
    function show(k) {
        for (const poses of Object.values(people)) poses.forEach((p, i) => { p.visible = i === k % poses.length; });
    }
    return {
        group: g,
        load,
        /** One take: the flash fires and the couple moves to the next pose. Returns the take number. */
        snap() {
            const n = Math.max(0, ...Object.values(people).map((p) => p.length));
            if (take > 0) pose = nextPose(pose, n);
            show(pose);
            take += 1;
            flash = 1;
            return take;
        },
        update(dt) {
            if (flash <= 0) return;
            flash = Math.max(0, flash - dt * 3.5);
            strobe.intensity = flash * 60;
            flashLamp.scale.setScalar(1 + flash * 2);
        },
        spot: () => g.localToWorld(new THREE.Vector3(0, 1.1, 0.35)),
        facing: () => new THREE.Vector3(0, 0, 1).applyQuaternion(g.quaternion),
        state: () => ({ loaded: Object.keys(people), pose, take, flash }),
    };
}
