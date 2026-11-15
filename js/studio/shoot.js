/* shoot.js: the photoshoot corner (4.78.0).
 *
 * Open floor stage right: a paper sweep and two softboxes. The co-star poses on the paper and James
 * stands in front of her with a camera; the set's camera looks over his shoulder. The first tap (or
 * the pill) flies in; every tap after that is a take: his flash fires, she moves to her next pose, he
 * drops the camera to check the screen, and the photo, rendered from his camera, prints as a
 * polaroid. The figures are Blender stand-ins (tools/studio/build_shoot.py) until the anime
 * characters are made from the design sheets. The corner only exists when the address asks for it
 * (?shoot=1) until the co-star says yes to her likeness on the public site; no personal name appears
 * in any shipped file.
 */

export const SHOOT = { x: 13.5, z: 0.5, ry: 0 };
export const SHOOT_FILES = { james: '/assets/studio/shoot-james.gltf', costar: '/assets/studio/shoot-costar.gltf' };
/** Real heights in metres, so the stand-ins read right beside each other whatever the build measured. */
export const SHOOT_HEIGHT = { james: 1.85, costar: 1.6 };
/** Marks in the corner's own space: +Z runs from the paper toward the photographer. */
export const SHOOT_MARKS = { costar: { x: 0, z: 0.3, ry: 0.1 }, james: { x: 0.35, z: 3.0, ry: Math.PI + 0.13 } };
/** The set's camera: it looks at spot from along dir, over James's right shoulder. */
export const SHOOT_VIEW = { spot: { x: 0.1, y: 1.0, z: 1.2 }, dir: { x: 0.42, y: 0, z: 1 } };
/** Where the photo frames her: the middle of her, from his flash. */
export const SHOOT_SUBJECT = { x: 0, y: 0.86, z: 0.3 };
/** How long he looks at the back screen after a take, in seconds. */
export const CHECK_SECONDS = { from: 0.35, to: 1.6 };

/** ?shoot=1 shows the corner; anything else hides it. */
export function shootFrom(search = '') {
    return /[?&]shoot=1(&|$)/.test(search);
}

/** The pose after k of n, wrapping. */
export function nextPose(k, n) {
    return n > 0 ? (k + 1) % n : 0;
}

/** A point in the corner's own space, in world x/z. */
export function shootToWorld(p) {
    const c = Math.cos(SHOOT.ry), s = Math.sin(SHOOT.ry);
    return { x: SHOOT.x + p.x * c + p.z * s, z: SHOOT.z - p.x * s + p.z * c };
}

/** The polaroid caption for a take. No names: the corner is public before the co-star's yes. */
export function polaroidCaption(take, when = new Date()) {
    const d = when.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
    return `TAKE ${String(take).padStart(2, '0')} · THE SHOOT · ${d}`;
}

/** The centred crop of a w x h frame at a portrait aspect (width / height), zoomed by zoom, as drawImage source args. */
export function polaroidCrop(w, h, aspect = 4 / 5, zoom = 1) {
    let sw = w * zoom, sh = Math.round(sw / aspect);
    if (sh > h * zoom) { sh = Math.round(h * zoom); sw = Math.round(sh * aspect); }
    sw = Math.round(sw);
    return { sx: Math.round((w - sw) / 2), sy: Math.round((h - sh) / 2), sw, sh };
}

/** The vertical field of view (degrees) a render of height h needs so its crop of height sh spans deg either side. */
export function povFov(h, sh, deg = 19) {
    return (2 * Math.atan((Math.tan((deg * Math.PI) / 180) * h) / sh) * 180) / Math.PI;
}

/** James's pose a number of seconds after a take: 0 camera up, 1 checking the screen. */
export function photographerPose(sinceTake) {
    return sinceTake >= CHECK_SECONDS.from && sinceTake < CHECK_SECONDS.to ? 1 : 0;
}

export function createShoot(THREE, { scene, onFigure, hits, hitMat }) {
    const V = (p) => new THREE.Vector3(p.x, p.y ?? 0, p.z);
    const g = new THREE.Group();
    g.name = 'shoot';
    g.position.set(SHOOT.x, 0.012, SHOOT.z); // a hair above the stage floor, or the paper z-fights it
    g.rotation.y = SHOOT.ry;
    scene.add(g);

    // the paper sweep: floor, a cove, a back wall, one surface; deep enough that he stands on it too
    const W = 13, D = 4.6, R = 0.6, H = 3.8; // wide enough that the over-the-shoulder frame is all paper
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
    // two softboxes on stands, each turned to face her
    for (const sx of [-1, 1]) {
        const s = new THREE.Group();
        s.position.set(sx * 2.5, 0, 0.9);
        s.rotation.y = sx * 1.25;
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.9, 8), steel);
        pole.position.y = 0.95;
        s.add(pole);
        for (let i = 0; i < 3; i++) {
            const a = (i * Math.PI * 2) / 3;
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 6), steel);
            leg.position.set(Math.sin(a) * 0.17, 0.22, Math.cos(a) * 0.17);
            leg.rotation.set(-Math.cos(a) * 0.65, 0, Math.sin(a) * 0.65); // top in, foot out
            s.add(leg);
        }
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.82, 0.22), steel);
        box.position.set(0, 2.05, 0);
        s.add(box);
        const face = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.76), glow);
        face.position.set(0, 2.05, -0.12);
        face.rotation.y = Math.PI;
        s.add(face);
        g.add(s);
    }
    // his flash: a strobe light and a lamp, moved onto his camera once he is loaded
    const strobe = new THREE.PointLight(0xffffff, 0, 7, 1.5);
    const flashLamp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.03), glow);
    strobe.position.set(0.35, 1.75, 2.85);
    flashLamp.position.copy(strobe.position);
    g.add(strobe, flashLamp);

    const hot = { type: 'shoot', id: 'shoot', label: 'The shoot · tap to take a photo', tint: '#ff2d55' };
    const hit = new THREE.Mesh(new THREE.BoxGeometry(5, 2.4, 4.4), hitMat);
    hit.position.set(0, 1.2, 1.4);
    hit.userData.hot = hot;
    g.add(hit);
    hits.push(hit);

    // the two of them: stand-ins loaded on first use, each pose baked to its own mesh
    const people = {}, roots = {};
    let flashNode = null;
    let pose = 0, take = 0, flash = 0, since = 99, loading = null;
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
                        p.visible = i === 0;
                        p.traverse((o) => { if (o.isMesh) o.castShadow = true; });
                    });
                    g.add(root);
                    people[who] = poses;
                    roots[who] = root;
                    if (who === 'james') {
                        flashNode = root.getObjectByName('flash_0');
                        if (flashNode) {
                            g.updateMatrixWorld(true);
                            const p = g.worldToLocal(flashNode.getWorldPosition(new THREE.Vector3()));
                            strobe.position.copy(p).add(new THREE.Vector3(0, 0.05, -0.15));
                            flashLamp.position.copy(p);
                        }
                    }
                } catch (e) {
                    console.warn(`studio: shoot stand-in ${who} not loaded (${e.message})`);
                }
            }));
            onFigure?.(g, 'crew');
            return people;
        });
        return loading;
    }
    const showOne = (poses, k) => poses?.forEach((p, i) => { p.visible = i === k % poses.length; });
    const eye = new THREE.Vector3();
    return {
        group: g,
        load,
        /** One take: his flash fires and she moves to her next pose. Returns the take number. */
        snap() {
            if (take > 0) pose = nextPose(pose, people.costar?.length || 0);
            showOne(people.costar, pose);
            showOne(people.james, 0);
            take += 1;
            flash = 1;
            since = 0;
            return take;
        },
        update(dt) {
            since += dt;
            showOne(people.james, photographerPose(since));
            if (flash <= 0) return;
            flash = Math.max(0, flash - dt * 3.5);
            strobe.intensity = flash * 26; // bright enough to read as a flash, not enough to blow out her skin
            flashLamp.scale.setScalar(1 + flash * 3);
        },
        /** Point cam where his camera is, at her. False until he is loaded. */
        aim(cam) {
            if (!flashNode) return false;
            flashNode.getWorldPosition(eye);
            cam.position.copy(eye);
            cam.lookAt(g.localToWorld(V(SHOOT_SUBJECT)));
            return true;
        },
        /** Hide him for the photo taken from his own camera. */
        photographer(on) { if (roots.james) roots.james.visible = on; },
        spot: () => g.localToWorld(V(SHOOT_VIEW.spot)),
        facing: () => V(SHOOT_VIEW.dir).normalize().applyQuaternion(g.quaternion),
        state: () => ({ loaded: Object.keys(people), pose, take, flash, james: photographerPose(since) }),
    };
}
