/* layout.js: where everything on the soundstage stands (4.66.0).
 *
 * One formula for the station arcs, used by the running studio (js/studio.js)
 * and by the Blender set build (tools/studio/build_set.py reads the JSON that
 * tools/studio/dump-layout.mjs writes from this file). The baked room and the
 * live crew can only line up if both read the same numbers, so nothing here is
 * retyped anywhere else.
 *
 * Coordinates are three.js world units (Y up, the camera looks down -Z).
 */

export const CENTER = { x: 0, y: 0, z: 2.5 };

/** Riser for the back row: a ring sector around CENTER. */
export const RISER = { r1: 6.7, r2: 9.6, a0: -0.98, a1: 0.98, top: 0.39 };

/** A station's frame in its own space: pedestal, monitor neck, monitor, and where the agent stands. */
export const STATION = {
    pedestal: { x: -0.32, y: 0.475, z: 0, w: 0.75, h: 0.95, d: 0.45, r: 0.05 },
    neck: { x: -0.32, y: 1.03, z: 0.02, r: 0.02, h: 0.16 },
    frame: { x: -0.32, y: 1.42, z: 0.02, w: 1.06, h: 0.66, d: 0.04, tilt: -0.12 },
    screen: { w: 1.0, h: 0.6, z: 0.022 },
    agent: { x: 0.42, z: 0.32, ry: -0.38 },
};

/** Station i of total: world position and yaw (it faces CENTER). */
export function stationPose(i, total) {
    const half = Math.ceil(total / 2);
    const back = i >= half;
    const k = back ? i - half : i;
    const count = back ? total - half : half;
    const r = back ? 8.15 : 5.0;
    const span = back ? 0.84 : 1.1;
    const th = count > 1 ? -span + (2 * span * k) / (count - 1) : 0;
    return { x: Math.sin(th) * r, y: back ? RISER.top : 0, z: CENTER.z - Math.cos(th) * r, ry: -th, back, th };
}

/** A point given in a station's own space, in world space. */
export function stationPoint(pose, lx, ly, lz) {
    const c = Math.cos(pose.ry);
    const s = Math.sin(pose.ry);
    return { x: pose.x + lx * c + lz * s, y: pose.y + ly, z: pose.z - lx * s + lz * c };
}

/** Fixed pieces of the set. */
export const DESK = { x: 0, y: 0, z: 3.2, top: 0.76, w: 2.6, d: 1.1 };
export const CHAIR = { x: 0, z: 4.45 };
export const MONITOR = { x: 0, y: 0.8, z: 3.05 };
export const DIGIVICE = { x: 0.95, y: 0.8, z: 3.45 };
export const FLAT = { z: -7.2, w: 10.5, h: 3.9 };
export const SOFTBOXES = [
    { x: -6.6, z: 4.6, ry: 2.13 },
    { x: 6.6, z: 4.2, ry: -2.06 },
];
/** The dolly runs on a track down the left side; the operator walks it. */
export const DOLLY = { x: -6.7, z0: 5.6, z1: -0.6 };
/** Craft services, where the runner collects coffee. */
export const CRAFT = { x: 6.9, z: -0.9, ry: -1.25 };
/** Back right, after hours: the throne on its dais, facing the stage. */
export const THRONE = { x: 9.2, z: -8.8, ry: -0.62, steps: 3, step: 0.25 };
/** Stage left, the lab: a workbench, the robot on its assembly stand, the builder between them. */
export const LAB = { x: -9.8, z: -5.2, ry: 1.05, robot: { x: -8.45, z: -4.35 }, builder: { x: -9.0, z: -3.95 } };
/** The inspo board, hung on the back flat beside the cleared gates. */
export const POSTER = { x: -4.4, y: 2.85, w: 1.22, h: 1.66 };
/** The key light the bake and the live shadows share. */
export const KEY = { x: -7, y: 13, z: 9 };

/** Everything the Blender build needs, as plain data. */
export function setLayout(total) {
    return {
        total,
        center: CENTER,
        riser: RISER,
        station: STATION,
        stations: Array.from({ length: total }, (_, i) => stationPose(i, total)),
        desk: DESK,
        chair: CHAIR,
        monitor: MONITOR,
        digivice: DIGIVICE,
        flat: FLAT,
        softboxes: SOFTBOXES,
        dolly: DOLLY,
        craft: CRAFT,
        throne: THRONE,
        lab: LAB,
        poster: POSTER,
        key: KEY,
    };
}
