/* monarch-anime.js: the anime Monarch on the throne (4.73.0).
 *
 * James's design (braids, a black knee-length coat with violet trim, Black Cat 4s) went from a
 * front/side/back design sheet through Tripo's P2 model (multiview, game topology) and Tripo's
 * auto-rig, then into Blender: the coat panels the rig glued to the fingers were moved to the thighs,
 * he was seated forward on the throne (seat y = 0, soles on the dais at y = -0.5), the coat tails
 * were laid on the seat, the soles recoloured to the Black Cat graphite, and each braid strand got
 * its own bone under the head. The files are monarch-anime.gltf / .bin / .webp (separate, so the
 * texture loads as a plain image under the site CSP, which allows no blob: images).
 *
 * The bar is James's likes: a living avatar (cel shading with a rim, glowing trim, a head that
 * follows the camera, hair that swings). Returns null on any problem, and cast.js keeps the
 * MPFB-built Monarch (monarch.js), then the hand-built figure.
 */
import { makeSprings } from './springs.js';

export const MONARCH_ANIME = '/assets/studio/monarch-anime.gltf';
export const MONARCH_ANIME_BONES = ['Head', 'L_Eye', 'R_Eye', 'Hip', 'Spine02'];

/** Why a loaded scene cannot stand in for the Monarch, or '' when it can. */
export function animeProblem(bones, skinned) {
    if (!skinned) return 'no skinned mesh';
    const missing = MONARCH_ANIME_BONES.filter((n) => !bones[n]);
    return missing.length ? `missing bones ${missing.join(', ')}` : '';
}

export async function loadAnimeMonarch(THREE, url = MONARCH_ANIME) {
    try {
        // loaded on demand: a separate chunk, fetched only when the anime look seats this Monarch
        const { GLTFLoader } = await import('./vendor/GLTFLoader.js');
        const gltf = await new GLTFLoader().loadAsync(url);
        const root = gltf.scene;
        const bones = {};
        let skinned = 0, tris = 0;
        root.traverse((o) => {
            if (o.isBone) bones[o.name] = o;
            if (o.isMesh) {
                o.frustumCulled = false; // a skinned mesh's bounds are its bind pose, not where it sits
                skinned += o.isSkinnedMesh ? 1 : 0;
                tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
                for (const m of [].concat(o.material)) m.side = THREE.DoubleSide; // braid strands are cards
            }
        });
        const why = animeProblem(bones, skinned);
        if (why) throw new Error(why);
        const springs = makeSprings(THREE, Object.values(bones).filter((b) => b.name.startsWith('Braid_')));
        return { root, bones, head: bones.Head, rest: bones.Head.quaternion.clone(), eyes: [bones.L_Eye, bones.R_Eye], springs, tris: Math.round(tris) };
    } catch (e) {
        console.warn(`studio: anime Monarch not used (${e.message}); keeping the built figure`);
        return null;
    }
}

/** Turn the head by yaw radians about the Monarch's own vertical, from its rest pose. */
export function turnHead(THREE, m, frame, yaw) {
    const { head, rest } = m;
    head.quaternion.copy(rest);
    const fq = frame.getWorldQuaternion(new THREE.Quaternion());
    const yawWorld = fq.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)).multiply(fq.clone().invert());
    const pq = head.parent.getWorldQuaternion(new THREE.Quaternion());
    head.quaternion.copy(pq.clone().invert().multiply(yawWorld).multiply(pq).multiply(rest));
}
