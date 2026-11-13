/* rig.js: the body every agent on the set is built from (4.66.0).
 *
 * One rig for the crew, the runner, the dolly grip, the builder and the two
 * shadows, so they move alike. Named groups the animator addresses directly:
 * a (the whole body), head, arms[0|1] (shoulder pivots), legs[0|1] (hip pivots),
 * eyes, bulb. Nothing here moves; studio.js and cast.js do the moving.
 */

/**
 * @param {object} THREE three module
 * @param {Function} RoundedBox RoundedBoxGeometry
 * @param {{body, visor, steel}} mats shell, visor and metal materials
 * @param {object} glow material for the eyes, belt and antenna bulb
 */
export function buildBody(THREE, RoundedBox, mats, glow) {
    const a = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.36, 6, 18), mats.body);
    body.position.y = 0.72;
    a.add(body);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 8, 32), glow);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 0.66;
    a.add(belt);
    const head = new THREE.Group();
    head.position.y = 1.2;
    a.add(head);
    head.add(new THREE.Mesh(new RoundedBox(0.5, 0.4, 0.42, 4, 0.12), mats.body));
    const visor = new THREE.Mesh(new RoundedBox(0.42, 0.2, 0.06, 3, 0.05), mats.visor);
    visor.position.set(0, -0.01, 0.2);
    head.add(visor);
    const eyes = [];
    for (const x of [-0.08, 0.08]) {
        const e = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.01), glow);
        e.position.set(x, -0.005, 0.235);
        head.add(e);
        eyes.push(e);
    }
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 6), mats.steel);
    ant.position.y = 0.27;
    head.add(ant);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), glow);
    bulb.position.y = 0.35;
    head.add(bulb);
    const arms = [];
    for (const sgn of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(0.25 * sgn, 0.92, 0);
        a.add(pivot);
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.3, 4, 10), mats.body);
        arm.position.y = -0.18;
        pivot.add(arm);
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), mats.body);
        hand.position.y = -0.37;
        pivot.add(hand);
        pivot.rotation.z = 0.12 * sgn;
        arms.push(pivot);
    }
    const legs = [];
    for (const sgn of [-1, 1]) {
        const hip = new THREE.Group();
        hip.position.set(0.1 * sgn, 0.42, 0);
        a.add(hip);
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.22, 4, 10), mats.body);
        leg.position.y = -0.22;
        hip.add(leg);
        legs.push(hip);
    }
    return { a, head, arms, legs, eyes, bulb, belt };
}

/** Walk cycle: legs and arms swing with the distance covered. */
export function stride(rig, phase, amount) {
    const s = Math.sin(phase) * 0.55 * amount;
    rig.legs[0].rotation.x = s;
    rig.legs[1].rotation.x = -s;
    rig.a.position.y = Math.abs(Math.cos(phase)) * 0.03 * amount;
    return s;
}
