/* anime.js: the cel look for everything that moves on the set (4.71.0).
 *
 * The bar is the anime-in-3D work James likes (cel-shaded characters with ink
 * lines and flat colour, e.g. @suji_pop's anime character tests): light falls in
 * hard bands instead of a smooth gradient, every figure carries an ink outline,
 * and a thin rim light picks the silhouette off the background.
 *
 *   - toon: MeshStandard / MeshPhysical become MeshToonMaterial on a 3-band ramp,
 *     keeping colour, maps and emissive, plus a hard rim term;
 *   - ink: an inverted hull per mesh, pushed out in clip space so the line keeps a
 *     constant width on screen and thins with distance, fogged like the room;
 *   - shadow: the Monarch and his two shadows get the dark variant, a violet
 *     line and a violet rim, so he reads as a shadow of James, not a portrait.
 *
 * The baked room is left as Blender lit it (painted background, cel characters:
 * the way anime itself is drawn). Screens, glows and hit boxes are MeshBasic and
 * are never touched. toonify() is idempotent, so a figure that loads late (the
 * built Monarch) is converted when it arrives.
 */

export const LOOKS = ['clean', 'anime'];
export const DEFAULT_LOOK = 'clean';

/** ?look=anime or ?look=clean wins; anything else is the default. */
export function lookFrom(search = '') {
    const m = /[?&]look=([a-z]+)/.exec(search);
    return m && LOOKS.includes(m[1]) ? m[1] : DEFAULT_LOOK;
}

/** Ink and rim per variant. Width is in CSS px at close range. */
export const INK = {
    crew: { color: 0x101014, width: 2.3, rim: 0xffffff, rimStrength: 0.22, bands: [0.55, 0.84, 1] },
    shadow: { color: 0x9a7bff, width: 2.4, rim: 0xa58bff, rimStrength: 0.9, bands: [0.16, 0.36, 0.7] },
};

const ramps = new Map();
function ramp(THREE, bands) {
    const k = bands.join(',');
    if (!ramps.has(k)) {
        const data = new Uint8Array(bands.length * 4);
        bands.forEach((b, i) => data.set([b * 255, b * 255, b * 255, 255], i * 4));
        const t = new THREE.DataTexture(data, bands.length, 1, THREE.RGBAFormat);
        t.minFilter = t.magFilter = THREE.NearestFilter;
        t.generateMipmaps = false;
        t.needsUpdate = true;
        ramps.set(k, t);
    }
    return ramps.get(k);
}

/** A cel copy of a lit material: same colour, maps and emissive, banded light, a hard rim. */
export function toonCopy(THREE, src, ink) {
    const m = new THREE.MeshToonMaterial({
        color: src.color ? src.color.clone() : 0xffffff,
        map: src.map || null,
        emissive: src.emissive ? src.emissive.clone() : 0x000000,
        emissiveMap: src.emissiveMap || null,
        emissiveIntensity: src.emissiveIntensity ?? 1,
        transparent: src.transparent,
        opacity: src.opacity,
        side: src.side,
        gradientMap: ramp(THREE, ink.bands),
    });
    const rim = new THREE.Color(ink.rim).multiplyScalar(ink.rimStrength);
    m.onBeforeCompile = (sh) => {
        sh.uniforms.uRim = { value: rim };
        sh.fragmentShader = sh.fragmentShader
            .replace('void main() {', 'uniform vec3 uRim;\nvoid main() {')
            .replace('#include <opaque_fragment>', [
                'float facing = max( dot( normal, normalize( vViewPosition ) ), 0.0 );',
                'outgoingLight += uRim * step( 0.72, 1.0 - facing );',
                '#include <opaque_fragment>',
            ].join('\n'));
    };
    m.customProgramCacheKey = () => `toon-rim-${ink.rimStrength}`;
    m.userData.toon = true;
    return m;
}

const VERT = `
uniform vec2 uPx;
#include <fog_pars_vertex>
void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    vec4 clip = projectionMatrix * mvPosition;
    vec3 n = normalize( normalMatrix * normal );
    vec2 dir = ( projectionMatrix * vec4( n, 0.0 ) ).xy;
    float len = length( dir );
    dir = len > 1e-5 ? dir / len : vec2( 0.0 );
    float thin = clamp( 7.0 / max( clip.w, 0.001 ), 0.55, 1.0 );
    clip.xy += dir * uPx * thin * clip.w;
    gl_Position = clip;
    #include <fog_vertex>
}`;
const FRAG = `
uniform vec3 uColor;
#include <fog_pars_fragment>
void main() {
    gl_FragColor = vec4( uColor, 1.0 );
    #include <colorspace_fragment>
    #include <fog_fragment>
}`;

/** The outline material for one variant. Call setInkSize() on resize. */
export function inkMaterial(THREE, ink) {
    const m = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uColor: { value: new THREE.Color(ink.color) }, uPx: { value: new THREE.Vector2(0.004, 0.004) } }]),
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.BackSide,
        fog: true,
    });
    m.userData.inkWidth = ink.width;
    return m;
}

/** Line width in clip units for a drawing buffer of w x h device px at a pixel ratio. */
export function inkSize(width, w, h, ratio) {
    const px = width * ratio;
    return [(2 * px) / Math.max(1, w), (2 * px) / Math.max(1, h)];
}

/**
 * Convert every lit mesh under root to the cel look and give it an ink line.
 * Returns { meshes, inks } so the caller can size the lines; safe to call twice.
 */
export function toonify(THREE, root, { variant = 'crew', cache = new Map(), inks = new Map() } = {}) {
    const ink = INK[variant];
    if (!inks.has(variant)) inks.set(variant, inkMaterial(THREE, ink));
    const line = inks.get(variant);
    const lit = (m) => m && (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial);
    const swap = (m) => {
        if (!lit(m)) return m;
        const key = `${variant}:${m.uuid}`;
        if (!cache.has(key)) cache.set(key, toonCopy(THREE, m, ink));
        return cache.get(key);
    };
    const todo = [];
    root.traverse((o) => {
        if (!o.isMesh || o.isInstancedMesh || o.userData.ink || o.userData.toonDone || o.userData.noToon) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        if (!mats.some(lit)) return;
        todo.push(o);
    });
    for (const o of todo) {
        o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
        o.userData.toonDone = true;
        const hull = new THREE.Mesh(o.geometry, line);
        hull.userData.ink = true;
        hull.castShadow = false;
        hull.receiveShadow = false;
        hull.raycast = () => {};
        o.add(hull);
    }
    return { meshes: todo.length, inks };
}
