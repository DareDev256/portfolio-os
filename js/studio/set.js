/* set.js: load the Blender-baked set (4.66.0).
 *
 * tools/studio/build_set.py models the room in three.js units and bakes its
 * light in Cycles. This reads its output: set.json (what is where in set.bin),
 * set.bin (Int16 positions normalised to each mesh's box, Uint16 UVs, indices)
 * and one baked texture per mesh. The meshes draw unlit, so they look exactly
 * as Cycles lit them; the crew and everything that moves stay live.
 *
 * Returns null instead of a half-built room: a missing file, a bad byte count,
 * or a set baked for a different crew size all fall back to the hand-built set.
 */

export const SET_BASE = '/assets/studio/';

/** Check a set.json against the crew it will stand under. Returns a reason string, or '' when it fits. */
export function setProblem(manifest, crewCount) {
    if (!manifest || manifest.version !== 1) return 'no manifest';
    if (manifest.stations !== crewCount) return `baked for ${manifest.stations} stations, the Monitor has ${crewCount}`;
    if (!Array.isArray(manifest.meshes) || !manifest.meshes.length) return 'no meshes';
    for (const m of manifest.meshes) {
        if (!manifest.textures?.[m.texture]) return `${m.name} has no texture`;
        const ib = m.indexType === 'u32' ? 4 : 2;
        const end = m.index + m.indices * ib;
        if (end > manifest.bin.bytes || m.position + m.vertices * 6 > manifest.bin.bytes || m.uv + m.vertices * 4 > manifest.bin.bytes) return `${m.name} runs past set.bin`;
    }
    return '';
}

/** Build the meshes from a manifest and the bin's bytes. Pure: no network. */
export function buildSetMeshes(THREE, manifest, buffer, textures) {
    const group = new THREE.Group();
    group.name = 'baked-set';
    for (const m of manifest.meshes) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Int16Array(buffer, m.position, m.vertices * 3), 3, true));
        g.setAttribute('uv', new THREE.BufferAttribute(new Uint16Array(buffer, m.uv, m.vertices * 2), 2, true));
        g.setIndex(new THREE.BufferAttribute(m.indexType === 'u32' ? new Uint32Array(buffer, m.index, m.indices) : new Uint16Array(buffer, m.index, m.indices), 1));
        const mat = new THREE.MeshBasicMaterial({ map: textures[m.texture] || null, toneMapped: false });
        const mesh = new THREE.Mesh(g, mat);
        mesh.name = m.name;
        mesh.position.fromArray(m.center);
        mesh.scale.fromArray(m.half);
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        group.add(mesh);
    }
    return group;
}

/** Fetch and build. Resolves to { group, manifest } or null (with the reason logged). */
export async function loadSet(THREE, renderer, crewCount, base = SET_BASE) {
    try {
        const manifest = await fetch(`${base}set.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null));
        const why = setProblem(manifest, crewCount);
        if (why) throw new Error(why);
        const loader = new THREE.TextureLoader();
        const [buffer, ...texs] = await Promise.all([
            fetch(`${base}${manifest.bin.file}`).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`set.bin ${r.status}`)))),
            ...Object.entries(manifest.textures).map(([k, t]) => loader.loadAsync(`${base}${t.file}`).then((tex) => [k, tex])),
        ]);
        if (buffer.byteLength !== manifest.bin.bytes) throw new Error(`set.bin is ${buffer.byteLength} bytes, set.json says ${manifest.bin.bytes}`);
        const textures = {};
        for (const [k, tex] of texs) {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
            textures[k] = tex;
        }
        return { group: buildSetMeshes(THREE, manifest, buffer, textures), manifest };
    } catch (e) {
        console.warn(`studio: baked set not used (${e.message}); building the set by hand`);
        return null;
    }
}
