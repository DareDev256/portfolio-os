"""build_shoot.py: stand-ins for the photoshoot corner (4.77.0), built in Blender with MPFB.

    /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python-exit-code 1 \\
        -P tools/studio/build_shoot.py -- --who=james|costar [--out=DIR]

The photoshoot corner puts James and the co-star on a paper sweep; each tap of the camera fires the
flash and moves them to the next pose. These are BLOCKOUT figures (James, 2026-11-15: "for now just
use whatever you can create with blender") until the anime characters are designed from the sheets
in ~/Pictures/jamesdare-photoshoot/sheets. No photo is used or stored: the outfits are coloured by
body region from his brief.

    james   royal-blue durag with tails, royal-blue tee, light-wash jean shorts, white socks,
            white low-top sneakers, a goatee
    costar  long wavy caramel-brown hair, a white long-sleeve cropped shirt, high-waisted black
            wide-leg trousers, black heels

Each figure is posed three ways and every pose is baked to its own mesh (shoot-<who>.gltf, nodes
pose_0..pose_2), standing on y = 0 and facing +Z in three.js units. Colour lives in the material
per zone. Every file the glTF names carries a hash of its bytes (the 4.75.1 cache lesson).
Refuses on a missing zone, a pose that leaves the floor, or more triangles than the budget.
"""
import addon_utils
import bmesh
import bpy
import hashlib
import importlib
import json
import math
import os
import sys
from collections import defaultdict
from mathutils import Matrix, Vector

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
WHO = next((a.split('=', 1)[1] for a in ARGS if a.startswith('--who=')), '')
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = next((a.split('=', 1)[1] for a in ARGS if a.startswith('--out=')), os.path.join(ROOT, 'public', 'assets', 'studio'))
BUDGET_TRIS = 9000  # per pose


def refuse(msg):
    print(f'build_shoot: REFUSED: {msg}')
    raise SystemExit(1)


PEOPLE = {
    'james': dict(macros=dict(gender=1.0, age=0.5, muscle=0.64, weight=0.34, height=0.74, proportions=0.82),
                  zones={'skin': (0.32, 0.18, 0.11), 'top': (0.10, 0.22, 0.75), 'bottom': (0.55, 0.68, 0.82), 'sock': (0.94, 0.94, 0.94),
                         'shoe': (0.96, 0.96, 0.96), 'sole': (0.9, 0.9, 0.9), 'hair': (0.10, 0.22, 0.75), 'beard': (0.04, 0.03, 0.03), 'eye': (0.08, 0.06, 0.05)}),
    'costar': dict(macros=dict(gender=0.0, age=0.45, muscle=0.5, weight=0.52, height=0.42, proportions=0.75, cupsize=0.62, firmness=0.6),
                   zones={'skin': (0.30, 0.17, 0.10), 'top': (0.97, 0.97, 0.97), 'bottom': (0.03, 0.03, 0.04), 'sock': (0.30, 0.17, 0.10),
                          'shoe': (0.03, 0.03, 0.04), 'sole': (0.03, 0.03, 0.04), 'hair': (0.40, 0.22, 0.10), 'beard': (0.30, 0.17, 0.10), 'eye': (0.08, 0.06, 0.05)}),
}
if WHO not in PEOPLE:
    refuse('--who must be james or costar')
P = PEOPLE[WHO]
ZONES = list(P['zones'])


def to3(v):
    """Blender Z-up facing -Y -> three.js Y-up facing +Z (a proper rotation)."""
    return Vector((v.x, v.z, -v.y))


# ---------------------------------------------------------------- MPFB
mods = [m.__name__ for m in addon_utils.modules() if m.__name__.split('.')[-1] == 'mpfb']
if not mods:
    refuse('MPFB is not installed in this Blender')
addon_utils.enable(mods[0], default_set=True)
HS = importlib.import_module(mods[0] + '.services.humanservice').HumanService
TS = importlib.import_module(mods[0] + '.services.targetservice').TargetService
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
macro = TS.get_default_macro_info_dict()
macro.update(P['macros'])
macro['race'] = {'african': 1.0, 'asian': 0.0, 'caucasian': 0.0}
human = HS.create_human(macro_detail_dict=macro, scale=0.1)
rig = HS.add_builtin_rig(human, 'game_engine')
if rig is None:
    refuse('MPFB gave no rig')
mask = human.modifiers.get('Hide helpers')
if mask:
    mask.show_viewport = mask.show_render = False
BONES = {b.name for b in rig.data.bones}
gname = {g.index: g.name for g in human.vertex_groups}
members, dom = defaultdict(list), []
for v in human.data.vertices:
    best, bw = None, 0.0
    for g in v.groups:
        n = gname[g.group]
        if g.weight > 0.5:
            members[n].append(v.index)
        if n in BONES and g.weight > bw:
            best, bw = n, g.weight
    dom.append(best)


def evaluated():
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    return human.evaluated_get(dg), dg


ev, _ = evaluated()
rest = [v.co.copy() for v in ev.data.vertices]
eyes = set(members['helper-l-eye']) | set(members['helper-r-eye'])
keep = set(members['body']) | eyes
if not keep:
    refuse('no body vertex group')
E = sum((rest[i] for i in eyes), Vector()) / max(1, len(eyes))
head_idx = [i for i, b in enumerate(dom) if b == 'head']
back_y = max(rest[i].y for i in head_idx)
_mid = [i for i in head_idx if abs(rest[i].x - E.x) < 0.006]
NOSE = rest[min(_mid, key=lambda i: rest[i].y)]
CHIN = rest[min((i for i in _mid if rest[i].y < NOSE.y + 0.09), key=lambda i: rest[i].z)]
MOUTH_Z = NOSE.z - 0.40 * (NOSE.z - CHIN.z)


def along(i, bone):
    """0 at a bone's head, 1 at its tail, for a rest-pose vertex."""
    b = rig.data.bones[bone]
    h, t = rig.matrix_world @ b.head_local, rig.matrix_world @ b.tail_local
    d = t - h
    return max(0.0, min(1.2, (rest[i] - h).dot(d) / max(1e-6, d.length_squared)))


def zone_of(i):
    if i in eyes:
        return 'eye'
    b = dom[i] or ''
    p = rest[i]
    if b == 'head':
        f = min(1.0, max(0.0, (p.y - E.y) / max(1e-6, back_y - E.y)))
        if p.z > E.z + (0.022 if WHO == 'james' else 0.030) - 0.075 * f:
            return 'hair'  # James: the durag; the co-star: the scalp under her hair
        if WHO == 'james':
            dx, dz = abs(p.x - E.x), p.z - MOUTH_Z
            if p.y < NOSE.y + 0.06 and CHIN.z - 0.02 < p.z < MOUTH_Z - 0.012 and dx < 0.03:
                return 'beard'
            if p.y < NOSE.y + 0.04 and 0.008 < dz < 0.02 and dx < 0.025:
                return 'beard'
        return 'skin'
    if b.startswith(('hand_', 'thumb_', 'index_', 'middle_', 'ring_', 'pinky_')):
        return 'skin'
    if b.startswith(('foot_', 'ball_')):
        return 'sole' if p.z < 0.024 else 'shoe'
    if b.startswith('calf_'):
        if WHO == 'james':
            return 'sock' if along(i, b) > 0.6 else 'skin'
        return 'bottom'
    if b.startswith('thigh_'):
        if WHO == 'james':
            return 'bottom' if along(i, b) < 0.86 else 'skin'
        return 'bottom'
    if b == 'pelvis':
        return 'bottom'
    if b.startswith('lowerarm_'):
        return 'top' if WHO == 'costar' and along(i, b) < 0.92 else 'skin'
    if b.startswith('upperarm_'):
        return 'top' if WHO == 'costar' or along(i, b) < 0.5 else 'skin'
    if b == 'spine_01' and WHO == 'costar':
        return 'skin'  # the cropped shirt shows a strip of waist above high-waisted trousers
    if b.startswith(('spine_', 'clavicle_')):
        return 'top'
    if b == 'neck_01':
        return 'top' if WHO == 'james' and p.z < E.z - 0.17 else 'skin'
    return 'skin'


zones = [zone_of(i) for i in range(len(rest))]
present = {zones[i] for i in keep}
for z in ('skin', 'top', 'bottom', 'shoe', 'hair', 'eye'):
    if z not in present:
        refuse(f'zone {z} is empty')

# ---------------------------------------------------------------- poses
pb = rig.pose.bones


def upd():
    bpy.context.view_layer.update()


def aim(name, d):
    upd()
    m = pb[name].matrix.copy()
    q = m.to_3x3().col[1].normalized().rotation_difference(Vector(d).normalized())
    loc = m.to_translation()
    pb[name].matrix = Matrix.Translation(loc) @ q.to_matrix().to_4x4() @ Matrix.Translation(-loc) @ m
    upd()


def reset():
    for b in pb:
        b.rotation_mode = 'QUATERNION'
        b.rotation_quaternion = (1, 0, 0, 0)
        b.location = (0, 0, 0)
    upd()


def relaxed(s, sx):
    aim(f'upperarm_{s}', (sx * 0.16, 0.02, -1))
    aim(f'lowerarm_{s}', (sx * 0.08, -0.18, -1))
    aim(f'hand_{s}', (sx * 0.05, -0.1, -1))


def hip(s, sx):  # a hand on the hip, elbow out
    aim(f'upperarm_{s}', (sx * 0.75, 0.15, -0.65))
    aim(f'lowerarm_{s}', (-sx * 0.75, -0.05, -0.55))
    aim(f'hand_{s}', (-sx * 0.4, 0.1, -0.9))


def pocket(s, sx):  # a hand in the shorts pocket
    aim(f'upperarm_{s}', (sx * 0.2, 0.12, -1))
    aim(f'lowerarm_{s}', (sx * 0.05, -0.45, -0.9))
    aim(f'hand_{s}', (sx * 0.05, -0.2, -1))


def point(s, sx):  # pointing at the camera
    aim(f'upperarm_{s}', (sx * 0.25, -0.9, -0.15))
    aim(f'lowerarm_{s}', (sx * 0.1, -1, 0.05))
    aim(f'hand_{s}', (sx * 0.05, -1, 0.05))


POSES = {
    'james': [lambda: (relaxed('l', 1), relaxed('r', -1)),
              lambda: (pocket('l', 1), relaxed('r', -1), aim('head', (0.12, -0.05, 1))),
              lambda: (relaxed('l', 1), point('r', -1))],
    'costar': [lambda: (relaxed('l', 1), relaxed('r', -1)),
               lambda: (hip('l', 1), relaxed('r', -1), aim('spine_03', (0.06, 0, 1)), aim('head', (-0.1, -0.05, 1))),
               lambda: (hip('l', 1), hip('r', -1))],
}

# ---------------------------------------------------------------- per pose: a mesh, zoned, dressed, decimated
mats = {}
for z, c in P['zones'].items():
    m = bpy.data.materials.new(z)
    m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (*c, 1)
    bsdf.inputs['Roughness'].default_value = 0.8
    mats[z] = m


def dress(bm):
    """Fabric stands off the skin, wide legs flare, the co-star's hair falls, James's durag has tails."""
    bm.normal_update()
    zl = bm.verts.layers.int['zone']
    off = {'top': 0.006, 'bottom': 0.008 if WHO == 'james' else 0.006, 'hair': 0.004 if WHO == 'james' else 0.012}
    for v in bm.verts:
        z = ZONES[v[zl]]
        if z in off:
            v.co += v.normal * off[z]
        if WHO == 'costar' and z == 'bottom' and v.co.z < 0.45:  # wide legs: flare toward the ankle
            v.co += Vector((v.normal.x, v.normal.y, 0)) * (0.45 - v.co.z) * 0.07
    head = bm.verts[:]
    top = max(v.co.z for v in head)
    hz = ZONES.index('hair')
    if WHO == 'costar':
        # long waves: a half shell behind the head from the crown to mid-back, wider at the ends
        hb = Vector((E.x, back_y - 0.01, E.z - 0.02))
        hb = pose_point(hb)
        verts = []
        rows, cols = 14, 12
        for r in range(rows + 1):
            t = r / rows
            zc = hb.z + 0.05 - t * 0.48
            rad = 0.085 + 0.06 * t
            row = []
            for c in range(cols + 1):
                a = math.pi * (0.05 + 0.9 * c / cols)
                wave = 0.012 * math.sin(t * 9 + c * 0.7)
                x = hb.x + math.cos(a) * (rad + wave)
                y = hb.y - 0.03 + math.sin(a) * (rad * 0.8 + wave) * 0.9 + t * 0.06
                row.append(bm.verts.new((x, y, zc)))
            verts.append(row)
        for r in range(rows):
            for c in range(cols):
                f = bm.faces.new((verts[r][c], verts[r][c + 1], verts[r + 1][c + 1], verts[r + 1][c]))
                f.material_index = hz
        for row in verts:
            for v in row:
                v[zl] = hz
    else:
        # durag tails: two strips from the knot at the back of the head down to the shoulder blades
        kb = pose_point(Vector((E.x, back_y + 0.005, E.z + 0.01)))
        for sx in (-1, 1):
            strip = []
            for r in range(7):
                t = r / 6
                p = kb + Vector((sx * (0.012 + 0.01 * t), 0.025 * t, -0.22 * t))
                strip.append((bm.verts.new(p + Vector((-0.016, 0, 0))), bm.verts.new(p + Vector((0.016, 0, 0)))))
            for r in range(6):
                f = bm.faces.new((strip[r][0], strip[r][1], strip[r + 1][1], strip[r + 1][0]))
                f.material_index = hz
            for a_, b_ in strip:
                a_[zl] = hz
                b_[zl] = hz


def shoes(bm):
    """A closed shoe over each foot: a dome on the floor, lower at the toe, its bottom band the sole.
    The MPFB foot has modelled toes, which read as bare feet whatever colour they are painted."""
    zl = bm.verts.layers.int['zone']
    sz, so = ZONES.index('shoe'), ZONES.index('sole')
    for side in (1, -1):
        foot = [v.co for v in bm.verts if v[zl] in (sz, so) and (v.co.x - E.x) * side > 0]
        if len(foot) < 8:
            refuse(f'no foot on side {side}')
        lo = Vector((min(c.x for c in foot), min(c.y for c in foot), min(c.z for c in foot)))
        hi = Vector((max(c.x for c in foot), max(c.y for c in foot), max(c.z for c in foot)))
        c = (lo + hi) / 2
        rx, ry, rz = (hi.x - lo.x) / 2 * 1.22, (hi.y - lo.y) / 2 * 1.14, (hi.z - lo.z) * (0.78 if WHO == 'james' else 0.7)
        made = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=1.0)['verts']
        for v in made:
            x, y, z = v.co
            z = max(0.0, z) * (0.72 + 0.28 * (y + 1) / 2)  # flat sole; the toe (-Y) sits lower than the heel
            v.co = Vector((c.x + x * rx, c.y + y * ry, lo.z - 0.004 + z * rz))
            v[zl] = so if z < 0.16 else sz
        for f in {f for v in made for f in v.link_faces}:
            f.material_index = max(f.verts[i][zl] for i in range(len(f.verts)))


def pose_point(p):
    """A rest-pose head point carried onto the posed head bone."""
    hb = rig.data.bones['head']
    T = (rig.matrix_world @ pb['head'].matrix) @ (rig.matrix_world @ hb.matrix_local).inverted()
    return T @ p


meshes = []
for k, make in enumerate(POSES[WHO]):
    reset()
    make()
    ev, dg = evaluated()
    src = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    bm = bmesh.new()
    bm.from_mesh(src)
    bm.verts.ensure_lookup_table()
    zl = bm.verts.layers.int.new('zone')
    for v in bm.verts:
        v[zl] = ZONES.index(zones[v.index])
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.index not in keep], context='VERTS')
    for f in bm.faces:
        cnt = defaultdict(int)
        for v in f.verts:
            cnt[v[zl]] += 1
        f.material_index = max(cnt, key=lambda z: (cnt[z], -z))
    dress(bm)
    shoes(bm)
    # zone borders are kept out of the decimation, so sleeves and hems stay straight instead of zigzag
    bm.verts.index_update()  # indices are stale after the deletes and the added hair and shoes
    border = {v.index for v in bm.verts if len({f.material_index for f in v.link_faces}) > 1}
    me = bpy.data.meshes.new(f'pose_{k}')
    bm.to_mesh(me)
    bm.free()
    for z in ZONES:
        me.materials.append(mats[z])
    ob = bpy.data.objects.new(f'pose_{k}', me)
    bpy.context.scene.collection.objects.link(ob)
    vg = ob.vertex_groups.new(name='decimable')
    vg.add([i for i in range(len(me.vertices)) if i not in border], 1.0, 'REPLACE')
    vg.add(list(border), 0.0, 'REPLACE')
    dm = ob.modifiers.new('decimate', 'DECIMATE')
    dm.ratio = 0.3
    dm.vertex_group = 'decimable'
    dm.vertex_group_factor = 10.0
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier=dm.name)
    # stand on the floor, centred, facing +Z in three.js (Blender -Y)
    pts = [v.co for v in me.vertices]
    lo = min(p.z for p in pts)
    cx = sum(p.x for p in pts) / len(pts)
    cy = sum(p.y for p in pts) / len(pts)
    for v in me.vertices:
        v.co = Vector((v.co.x - cx, v.co.y - cy, v.co.z - lo))
    me.update()
    tris = sum(len(p.vertices) - 2 for p in me.polygons)
    if tris > BUDGET_TRIS:
        refuse(f'pose {k} has {tris} triangles, budget {BUDGET_TRIS}')
    h = max(v.co.z for v in me.vertices)
    if not (1.4 < h < 2.2):
        refuse(f'pose {k} stands {h:.2f} m tall')
    meshes.append(ob)
    print(f'build_shoot: {WHO} pose {k}: {tris} triangles, {h:.2f} m')

for o in list(bpy.data.objects):
    if o not in meshes:
        bpy.data.objects.remove(o, do_unlink=True)
os.makedirs(OUT, exist_ok=True)
path = os.path.join(OUT, f'shoot-{WHO}.gltf')
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=path, use_selection=True, export_format='GLTF_SEPARATE', export_yup=True, export_materials='EXPORT')
g = json.load(open(path))
for b in g.get('buffers', []):
    base = b['uri'].split('?')[0]
    b['uri'] = f"{base}?v={hashlib.sha256(open(os.path.join(OUT, base), 'rb').read()).hexdigest()[:10]}"
json.dump(g, open(path, 'w'), separators=(',', ':'))
print(f'build_shoot: wrote {path} ({len(meshes)} poses)')
