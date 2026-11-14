/* springs.js: spring bones for swinging hair and cloth (4.73.0).
 *
 * James's likes put "bones in the clothes" at the heart of a living character (@rewind02's
 * Opus + Blender method, @Dstudio_ai's VRM viewers with physics). This is the small, VRM-style
 * version: each bone's tail is a point with inertia that is pulled back toward where the parent
 * would carry it (stiffness), slowed by drag and pulled down by gravity, then held at the bone's
 * length. The bone is turned to point at it. No collision: the braids are short and hang clear.
 *
 * Pure apart from the THREE objects passed in; step() takes dt in seconds and clamps it so a
 * background tab does not fling the hair on return.
 */

export const SPRING = { stiffness: 7, drag: 0.32, gravity: 0.5, length: 0.12, maxDt: 1 / 30 };

export function makeSprings(THREE, bones, opts = {}) {
    const o = { ...SPRING, ...opts };
    const up = new THREE.Vector3(0, 1, 0);
    const tmpQ = new THREE.Quaternion(), parentQ = new THREE.Quaternion(), restWorldQ = new THREE.Quaternion();
    const head = new THREE.Vector3(), restTail = new THREE.Vector3(), dir = new THREE.Vector3(), from = new THREE.Vector3();
    const list = bones.filter(Boolean).map((bone) => {
        bone.updateWorldMatrix(true, false);
        const restLocal = bone.quaternion.clone();
        const len = bone.userData.springLength || o.length;
        bone.getWorldPosition(head);
        bone.getWorldQuaternion(restWorldQ);
        const tail = head.clone().add(up.clone().applyQuaternion(restWorldQ).multiplyScalar(len));
        return { bone, restLocal, len, cur: tail.clone(), prev: tail.clone() };
    });
    function step(dt) {
        const t = Math.min(Math.max(dt, 0), o.maxDt);
        for (const s of list) {
            const { bone } = s;
            bone.quaternion.copy(s.restLocal);
            bone.updateWorldMatrix(true, false);
            bone.getWorldPosition(head);
            bone.getWorldQuaternion(restWorldQ);
            restTail.copy(up).applyQuaternion(restWorldQ).multiplyScalar(s.len).add(head);
            const next = s.cur.clone()
                .addScaledVector(dir.subVectors(s.cur, s.prev), 1 - o.drag)
                .addScaledVector(dir.subVectors(restTail, s.cur), o.stiffness * t)
                .add(dir.set(0, -o.gravity * t * t * 60, 0));
            next.sub(head).setLength(s.len).add(head);
            s.prev.copy(s.cur);
            s.cur.copy(next);
            from.copy(up).applyQuaternion(restWorldQ);
            dir.subVectors(next, head).normalize();
            tmpQ.setFromUnitVectors(from, dir);
            bone.parent.getWorldQuaternion(parentQ);
            // new local = parent^-1 * delta * parent * restLocal
            bone.quaternion.copy(parentQ).invert().multiply(tmpQ).multiply(parentQ).multiply(s.restLocal);
        }
    }
    return { step, springs: list };
}
