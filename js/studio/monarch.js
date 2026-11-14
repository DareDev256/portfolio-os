/* monarch.js: the Monarch on the throne, built to James's build (4.70.0).
 *
 * tools/studio/build_monarch.py builds him in Blender (MPFB), seated forward on
 * the throne, and writes monarch.json (what is where) and monarch.bin: two parts,
 * the body and the head with its neck, which turns on a pivot at the base of the
 * neck so cast.js can keep him watching the camera. Positions are Int16
 * normalised to each part's box, normals Int8, indices grouped by zone.
 *
 * Colour is not in the file. Each zone (skin, top, pants, shoe, sole, cap, hair,
 * beard, eye) takes the material cast.js hands in, so the palette stays in code.
 *
 * Returns null on any problem, and the hand-built figure stays on the throne.
 */

export const MONARCH_BASE = '/assets/studio/';
export const MONARCH_ZONES = ['skin', 'top', 'pants', 'shoe', 'sole', 'cap', 'hair', 'beard', 'eye'];

/** Check a monarch.json. Returns a reason string, or '' when it is usable. */
export function monarchProblem(m) {
    if (!m || m.version !== 1 || m.kind !== 'monarch' || !m.bin) return 'no manifest';
    if (!Array.isArray(m.parts) || m.parts.map((p) => p.name).sort().join(',') !== 'body,head') return 'expected a body and a head';
    if (!Array.isArray(m.eyes) || m.eyes.length !== 2) return 'no eyes';
    for (const p of m.parts) {
        const ib = p.indexType === 'u32' ? 4 : 2;
        if (p.position + p.vertices * 6 > m.bin.bytes || p.normal + p.vertices * 3 > m.bin.bytes || p.index + p.indices * ib > m.bin.bytes) return `${p.name} runs past monarch.bin`;
        if (p.position % 2 || p.index % ib) return `${p.name} is misaligned`;
        let n = 0;
        for (const g of p.groups || []) {
            if (!MONARCH_ZONES.includes(g.zone)) return `${p.name} has an unknown zone ${g.zone}`;
            if (g.start !== n) return `${p.name} zones are not contiguous`;
            n += g.count;
        }
        if (!n || n !== p.indices) return `${p.name} zones cover ${n} of ${p.indices} indices`;
    }
    return '';
}

/** Build the two parts from a manifest and the bin's bytes. Pure: no network. */
export function buildMonarch(THREE, m, buffer, materials) {
    const mats = MONARCH_ZONES.map((z) => materials[z]);
    const out = { body: null, head: null, eyes: m.eyes.map((e) => new THREE.Vector3(...e)), tris: 0 };
    for (const p of m.parts) {
        const q = new Int16Array(buffer, p.position, p.vertices * 3);
        const pos = new Float32Array(p.vertices * 3);
        for (let i = 0; i < pos.length; i++) pos[i] = p.center[i % 3] + (q[i] / 32767) * p.half[i % 3];
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(buffer, p.normal, p.vertices * 3), 3, true));
        g.setIndex(new THREE.BufferAttribute(p.indexType === 'u32' ? new Uint32Array(buffer, p.index, p.indices) : new Uint16Array(buffer, p.index, p.indices), 1));
        for (const z of p.groups) g.addGroup(z.start, z.count, MONARCH_ZONES.indexOf(z.zone));
        g.computeBoundingSphere();
        const mesh = new THREE.Mesh(g, mats);
        mesh.name = `monarch-${p.name}`;
        out.tris += p.indices / 3;
        if (p.name === 'head') {
            const head = new THREE.Group();
            head.name = 'monarch-head-pivot';
            head.position.fromArray(p.pivot);
            head.add(mesh);
            out.head = head;
        } else {
            out.body = mesh;
        }
    }
    return out;
}

/** Fetch and build. Resolves to { body, head, eyes, tris } or null (with the reason logged). */
export async function loadMonarch(THREE, materials, base = MONARCH_BASE) {
    try {
        const m = await fetch(`${base}monarch.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null));
        const why = monarchProblem(m);
        if (why) throw new Error(why);
        const buffer = await fetch(`${base}${m.bin.file}`).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`monarch.bin ${r.status}`))));
        if (buffer.byteLength !== m.bin.bytes) throw new Error(`monarch.bin is ${buffer.byteLength} bytes, monarch.json says ${m.bin.bytes}`);
        return buildMonarch(THREE, m, buffer, materials);
    } catch (e) {
        console.warn(`studio: built Monarch not used (${e.message}); keeping the hand-built figure`);
        return null;
    }
}
