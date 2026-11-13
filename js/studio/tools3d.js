/* tools3d.js: the tool each crew member holds on the studio set (4.65.0).
 *
 * The same 16 tools crew.js draws as pixels on the Monitor, built from
 * primitives so they stay crisp and cost no downloads. THREE is passed in,
 * so this file never imports the CDN build and the suite can load it.
 *
 * Each builder returns a Group sized to sit in an agent's right hand
 * (hand at the origin, about 0.15 to 0.45 m long), plus a motion: how the
 * holding arm works, as a base angle, a swing and a speed.
 */

export const TOOL_IDS = ['bag', 'scissors', 'cross', 'megaphone', 'hammer', 'camera', 'brush', 'pad', 'sword', 'book', 'clipboard', 'car', 'pencil', 'dumbbell', 'monitor', 'folder'];

/** Arm motion per tool: rx = base forward angle, amp = swing, hz = speed, both = two-handed. */
export const MOTION = {
    bag: { rx: -0.15, amp: 0.05, hz: 1.2 },
    scissors: { rx: -0.9, amp: 0.12, hz: 7 },
    cross: { rx: -0.8, amp: 0.06, hz: 2 },
    megaphone: { rx: -1.5, amp: 0.1, hz: 1.4 },
    hammer: { rx: -1.0, amp: 0.45, hz: 3.2 },
    camera: { rx: -1.65, amp: 0.03, hz: 0.8 },
    brush: { rx: -1.1, amp: 0.3, hz: 2.2 },
    pad: { rx: -0.9, amp: 0.06, hz: 9, both: true },
    sword: { rx: -0.6, amp: 0.6, hz: 1.1 },
    book: { rx: -1.0, amp: 0.04, hz: 0.9, both: true },
    clipboard: { rx: -0.95, amp: 0.05, hz: 1.6 },
    car: { rx: -0.7, amp: 0.25, hz: 1.3 },
    pencil: { rx: -1.0, amp: 0.1, hz: 6 },
    dumbbell: { rx: -0.4, amp: 1.0, hz: 1.2 },
    monitor: { rx: -1.0, amp: 0.04, hz: 1.0, both: true },
    folder: { rx: -0.8, amp: 0.05, hz: 1.2 },
};

export function makeTool(THREE, id, tint, mats) {
    const g = new THREE.Group();
    const t = new THREE.MeshStandardMaterial({ color: tint, roughness: 0.45 });
    const glow = new THREE.MeshStandardMaterial({ color: tint, emissive: tint, emissiveIntensity: 1.2, roughness: 0.4 });
    const { dark, steel, white } = mats;
    const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
    const cyl = (rt, rb, h, m, x = 0, y = 0, z = 0, seg = 16) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); g.add(o); return o; };
    const tor = (r, tube, m, x = 0, y = 0, z = 0, arc = Math.PI * 2) => { const o = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 24, arc), m); o.position.set(x, y, z); g.add(o); return o; };

    switch (id) {
        case 'bag': // briefcase, hanging from the hand
            box(0.26, 0.18, 0.08, t, 0, -0.12, 0);
            box(0.27, 0.012, 0.085, dark, 0, -0.08, 0);
            tor(0.04, 0.008, dark, 0, -0.03, 0, Math.PI).rotation.z = 0;
            break;
        case 'scissors': {
            const a = box(0.02, 0.2, 0.006, steel, 0, -0.1, 0); a.rotation.z = 0.18;
            const b = box(0.02, 0.2, 0.006, steel, 0, -0.1, 0.008); b.rotation.z = -0.18;
            tor(0.03, 0.009, t, -0.03, 0.02, 0).rotation.y = 0;
            tor(0.03, 0.009, t, 0.03, 0.02, 0.008);
            g.rotation.x = Math.PI / 2;
            break;
        }
        case 'cross': // first-aid kit
            box(0.22, 0.16, 0.09, white, 0, -0.1, 0);
            box(0.12, 0.035, 0.005, t, 0, -0.1, 0.048);
            box(0.035, 0.12, 0.005, t, 0, -0.1, 0.048);
            tor(0.035, 0.008, dark, 0, -0.01, 0, Math.PI);
            break;
        case 'megaphone': {
            const horn = cyl(0.03, 0.1, 0.26, glow, 0, 0, -0.16, 24); horn.rotation.x = Math.PI / 2;
            box(0.03, 0.09, 0.04, dark, 0, -0.04, 0);
            break;
        }
        case 'hammer':
            cyl(0.016, 0.016, 0.34, dark, 0, -0.1, 0);
            box(0.16, 0.05, 0.05, steel, 0, -0.27, 0);
            box(0.03, 0.05, 0.05, t, 0.09, -0.27, 0);
            g.rotation.x = Math.PI / 2;
            break;
        case 'camera': {
            box(0.2, 0.13, 0.1, dark, 0, 0, -0.05);
            const lens = cyl(0.04, 0.045, 0.08, steel, 0, 0, -0.14, 20); lens.rotation.x = Math.PI / 2;
            box(0.06, 0.02, 0.04, glow, -0.05, 0.075, -0.05);
            break;
        }
        case 'brush':
            cyl(0.012, 0.016, 0.24, t, 0, -0.05, 0);
            cyl(0.018, 0.016, 0.04, steel, 0, -0.19, 0);
            cyl(0.025, 0.004, 0.08, dark, 0, -0.25, 0, 12).rotation.z = Math.PI;
            g.rotation.x = Math.PI / 2;
            break;
        case 'pad': // game pad, held in front with both hands
            box(0.22, 0.04, 0.1, dark, 0.1, 0, -0.04);
            box(0.022, 0.012, 0.022, glow, 0.16, 0.026, -0.04);
            box(0.022, 0.012, 0.022, glow, 0.19, 0.026, -0.015);
            box(0.05, 0.01, 0.015, steel, 0.04, 0.025, -0.04);
            break;
        case 'sword':
            box(0.035, 0.5, 0.008, steel, 0, -0.34, 0);
            box(0.1, 0.02, 0.03, t, 0, -0.08, 0);
            cyl(0.014, 0.014, 0.1, dark, 0, -0.02, 0);
            g.rotation.x = Math.PI / 2;
            break;
        case 'book':
            box(0.18, 0.24, 0.04, t, 0.09, 0, -0.05);
            box(0.17, 0.225, 0.034, white, 0.095, 0, -0.05);
            g.rotation.x = -0.4;
            break;
        case 'clipboard':
            box(0.18, 0.25, 0.012, t, 0, 0, -0.05);
            box(0.15, 0.2, 0.004, white, 0, -0.01, -0.042);
            box(0.06, 0.025, 0.016, steel, 0, 0.12, -0.046);
            g.rotation.x = -0.5;
            break;
        case 'car':
            box(0.24, 0.06, 0.11, t, 0, -0.07, 0);
            box(0.12, 0.05, 0.1, white, -0.02, -0.02, 0);
            for (const [x, z] of [[-0.08, 0.06], [0.08, 0.06], [-0.08, -0.06], [0.08, -0.06]]) cyl(0.025, 0.025, 0.02, dark, x, -0.1, z, 12).rotation.x = Math.PI / 2;
            break;
        case 'pencil':
            cyl(0.012, 0.012, 0.22, t, 0, -0.08, 0, 6);
            cyl(0.012, 0.001, 0.04, white, 0, -0.21, 0, 6).rotation.z = Math.PI;
            cyl(0.012, 0.012, 0.025, steel, 0, 0.04, 0, 6);
            g.rotation.x = Math.PI / 2;
            break;
        case 'dumbbell':
            cyl(0.012, 0.012, 0.26, steel, 0, 0, 0, 10).rotation.z = Math.PI / 2;
            cyl(0.05, 0.05, 0.035, dark, -0.11, 0, 0, 18).rotation.z = Math.PI / 2;
            cyl(0.05, 0.05, 0.035, dark, 0.11, 0, 0, 18).rotation.z = Math.PI / 2;
            break;
        case 'monitor': // a field monitor, held up to check focus
            box(0.22, 0.15, 0.03, dark, 0.08, 0.02, -0.06);
            box(0.2, 0.125, 0.004, glow, 0.08, 0.02, -0.043);
            break;
        case 'folder':
            box(0.24, 0.17, 0.012, t, 0, -0.08, 0);
            box(0.08, 0.025, 0.012, t, -0.07, 0.015, 0);
            box(0.22, 0.15, 0.004, white, 0, -0.085, 0.008);
            g.rotation.x = -0.3;
            break;
        default:
            box(0.12, 0.12, 0.12, glow, 0, -0.06, 0);
    }
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
    return g;
}
