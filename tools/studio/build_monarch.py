"""build_monarch.py: the Monarch on the throne, built to James's build (4.70.0).

Run headless (no screen taken):
    /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python-exit-code 1 \
        -P tools/studio/build_monarch.py -- [--dry] [--hair=cap|afro|braids] [--out=DIR]

Needs the MPFB extension (MakeHuman for Blender) in the user's Blender
extensions, nothing else. --dry builds and runs every guard but writes nothing.
--hair picks the head: cap (the 4.70.0 skull cap with his twists tied off), afro
(the scalp grown out to a round, clumped shell), or braids (box braids combed back
and falling to the shoulders, kept clear of the body at every head turn).
--out writes somewhere else, for a design board that never touches the site.

What it makes, in public/assets/studio/:
    monarch.json  manifest: parts, byte offsets, quantisation, zones, eye points, fit
    monarch.bin   geometry only: Int16 positions (normalised to each part's box),
                  Int8 normals, Uint16 indices sorted by zone

The likeness is in the build, the pose and the silhouette, because that is what
reads at the size the throne is seen (a head about 45 CSS px tall on a phone in
the close-up, 75 on a laptop): tall and lean, sitting forward on the edge of the
seat with his forearms on his knees, a black mock-neck and joggers, a fitted skull
cap with his twists tied off at the back, a goatee. No face is scanned and no
photo is stored in this repo.

Two parts, so the rig in cast.js keeps working: the body, and the head with the
neck, which turns to watch the camera from a pivot at the base of the neck. A
collar ring on the body covers that seam. Colour is not in the file: each zone
gets its material in code (see ZONES).

Authored in three.js units with Y up, the figure facing +Z, in the Monarch's own
frame: y = 0 is the seat top, the dais is y = -0.5, the seat's front edge is
z = +0.42, the armrests start at |x| = 0.54. MPFB builds Z-up facing -Y, so every
point goes through one proper rotation (x, y, z) -> (x, z, -y): no axis swap, no
mirror, winding kept.

Guards (it refuses to write rather than ship a broken figure):
    MPFB must load; the pose must seat him (buttocks on the seat, soles on the
    dais, calves clear of the seat's front edge, nothing inside an armrest);
    the face must point +Z and the head sit above the pelvis; the body's
    normals must face out; both eyes must be found; every zone must be present;
    the triangle count and the file must fit the budget.
"""
import addon_utils
import bmesh
import bpy
import importlib
import json
import math
import os
import struct
import sys
from collections import Counter, defaultdict
from mathutils import Matrix, Vector, noise
from mathutils.bvhtree import BVHTree

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public', 'assets', 'studio')
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
DRY = '--dry' in ARGS
HAIR = next((a.split('=', 1)[1] for a in ARGS if a.startswith('--hair=')), 'cap')
OUT = next((a.split('=', 1)[1] for a in ARGS if a.startswith('--out=')), OUT)

# His build, read off his photos: tall, lean, long-limbed, some muscle.
MACROS = dict(gender=1.0, age=0.5, muscle=0.64, weight=0.34, height=0.74, proportions=0.82, cupsize=0.5, firmness=0.5)
RACE = {'african': 1.0, 'asian': 0.0, 'caucasian': 0.0}

# The throne, in the Monarch's frame (from build_set.py's build_throne and cast.js).
SEAT_FRONT_Z = 0.42
DAIS_Y = -0.5
ARM_INNER_X = 0.54
ARM_TOP_Y = 0.23
ARM_Z = (-0.48, 0.48)
BACK_Z = -0.37

ZONES = ['skin', 'top', 'pants', 'shoe', 'sole', 'cap', 'hair', 'beard', 'eye']
HEAD_ZONES = {'cap', 'hair', 'beard', 'eye'}
BUDGET_TRIS = 20000  # 4.72: raised from 16k for the braids; still one draw call per zone
BUDGET_BYTES = 420_000
DECIMATE = {'body': 0.3, 'head': 0.62}


def refuse(msg):
    print(f'build_monarch: REFUSED: {msg}')
    raise SystemExit(1)


if HAIR not in ('cap', 'afro', 'braids'):
    refuse(f'--hair={HAIR}: expected cap, afro or braids')


def to3(v):
    """Blender Z-up facing -Y -> three.js Y-up facing +Z. A proper rotation."""
    return Vector((v.x, v.z, -v.y))


# ------------------------------------------------------------------ MPFB
mods = [m.__name__ for m in addon_utils.modules() if m.__name__.split('.')[-1] == 'mpfb']
if not mods:
    refuse('MPFB is not installed in this Blender')
addon_utils.enable(mods[0], default_set=True)  # MPFB reads its own preferences, which only exist once set
HS = importlib.import_module(mods[0] + '.services.humanservice').HumanService
TS = importlib.import_module(mods[0] + '.services.targetservice').TargetService

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

macro = TS.get_default_macro_info_dict()
macro.update(MACROS)
macro['race'] = dict(RACE)
human = HS.create_human(macro_detail_dict=macro, scale=0.1)
rig = HS.add_builtin_rig(human, 'game_engine')
if rig is None:
    refuse('MPFB gave no rig')
mask = human.modifiers.get('Hide helpers')
if mask:
    mask.show_viewport = mask.show_render = False

BONES = {b.name for b in rig.data.bones}
gname = {g.index: g.name for g in human.vertex_groups}
members = defaultdict(list)
dom = []
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
    ev = human.evaluated_get(dg)
    if len(ev.data.vertices) != len(human.data.vertices):
        refuse('evaluated mesh changed vertex count')
    return ev, dg


def centroid(name, pts):
    idx = members.get(name) or []
    if not idx:
        refuse(f'no vertices in {name}')
    return sum((pts[i] for i in idx), Vector()) / len(idx)


# ------------------------------------------------------------------ zones, decided at rest (upright, facing -Y)
ev, _ = evaluated()
rest = [v.co.copy() for v in ev.data.vertices]
E = (centroid('joint-l-eye', rest) + centroid('joint-r-eye', rest)) / 2
head_idx = [i for i, b in enumerate(dom) if b == 'head']
back_y = max(rest[i].y for i in head_idx)
# MPFB's joint-mouth is the jaw pivot, level with the nose, not the lips: find
# the lips from the profile instead (nose tip, chin, the mouth a third of the way down).
_mid = [i for i in head_idx if abs(rest[i].x - E.x) < 0.006]
NOSE = rest[min(_mid, key=lambda i: rest[i].y)].copy()
CHIN_I = min((i for i in _mid if rest[i].y < NOSE.y + 0.09), key=lambda i: rest[i].z)
CHIN = rest[CHIN_I].copy()
MOUTH_Z = NOSE.z - 0.40 * (NOSE.z - CHIN.z)
MOUTH_Y = min(rest[i].y for i in _mid if abs(rest[i].z - MOUTH_Z) < 0.006)
if not (CHIN.z < MOUTH_Z < NOSE.z < E.z):
    refuse(f'face landmarks out of order: chin {CHIN.z:.3f} mouth {MOUTH_Z:.3f} nose {NOSE.z:.3f} eyes {E.z:.3f}')
keep = set(members['body']) | set(members['helper-l-eye']) | set(members['helper-r-eye'])
eyes = set(members['helper-l-eye']) | set(members['helper-r-eye'])
HANDS = ('hand_', 'thumb_', 'index_', 'middle_', 'ring_', 'pinky_')


def zone_of(i):
    if i in eyes:
        return 'eye'
    b = dom[i] or ''
    p = rest[i]
    if b == 'head':
        f = min(1.0, max(0.0, (p.y - E.y) / max(1e-6, back_y - E.y)))
        if p.z > E.z + 0.030 - 0.078 * f:
            return 'cap'
        dx, dz = abs(p.x - E.x), p.z - MOUTH_Z
        if p.y < MOUTH_Y + 0.02 and 0.009 < dz < 0.021 and dx < 0.026:
            return 'beard'  # moustache, under the nose
        if p.y < MOUTH_Y + 0.03 and -0.03 < dz < 0.012 and 0.018 < dx < 0.03:
            return 'beard'  # the corners down to the chin
        if p.y < MOUTH_Y + 0.07 and CHIN.z - 0.03 < p.z < MOUTH_Z - 0.015 and dx < 0.034 - max(0.0, MOUTH_Z - 0.06 - p.z) * 0.3:
            return 'beard'  # chin, and under it
        return 'skin'
    if b.startswith(HANDS):
        return 'skin'
    if b.startswith(('foot_', 'ball_')):
        return 'sole' if p.z < 0.024 else 'shoe'
    if b.startswith(('pelvis', 'thigh_', 'calf_')):
        return 'pants'
    return 'top'  # spine, clavicles, arms to the wrist, the neck: a black mock-neck


zones = [zone_of(i) for i in range(len(rest))]
if HAIR != 'cap':
    zones = ['hair' if z == 'cap' else z for z in zones]  # no cap: the scalp under the hair is hair
in_head = [((dom[i] in ('head', 'neck_01')) or zones[i] in HEAD_ZONES) for i in range(len(rest))]

# ------------------------------------------------------------------ the pose: forward on the edge of the seat, forearms on his knees
pb = rig.pose.bones


def aim(name, d):
    bpy.context.view_layer.update()
    m = pb[name].matrix.copy()
    q = m.to_3x3().col[1].normalized().rotation_difference(Vector(d).normalized())
    loc = m.to_translation()
    pb[name].matrix = Matrix.Translation(loc) @ q.to_matrix().to_4x4() @ Matrix.Translation(-loc) @ m
    bpy.context.view_layer.update()


def head_of(name):
    bpy.context.view_layer.update()
    return (rig.matrix_world @ pb[name].head).copy()


THIGH_UP = float(next((a.split('=')[1] for a in ARGS if a.startswith('--thigh=')), '0.07'))
for s, sx in (('l', 1), ('r', -1)):
    aim(f'thigh_{s}', (sx * 0.2, -1.0, THIGH_UP))
    aim(f'calf_{s}', (sx * 0.05, -0.1, -1.0))
    aim(f'foot_{s}', (sx * 0.1, -0.85, -0.5))
    aim(f'ball_{s}', (sx * 0.1, -1.0, -0.04))
aim('spine_01', (0, -0.25, 1))
aim('spine_02', (0, -0.42, 1))
aim('spine_03', (0, -0.46, 1))
aim('neck_01', (0, -0.3, 1))
aim('head', (0, 0.06, 1))
HEAD_DOWN = math.radians(float(next((a.split('=')[1] for a in ARGS if a.startswith('--chin=')), '9')))


def face_pitch():
    evx, _ = evaluated()
    pts = [v.co for v in evx.data.vertices]
    e = (centroid('helper-l-eye', pts) + centroid('helper-r-eye', pts)) / 2
    v = e - pts[CHIN_I]
    return math.atan2(-v.y, v.z)


rest_pitch = math.atan2(-(E - CHIN).y, (E - CHIN).z)
delta = rest_pitch + HEAD_DOWN - face_pitch()
hm = pb['head'].matrix.copy()
hl = hm.to_translation()
pb['head'].matrix = Matrix.Translation(hl) @ Matrix.Rotation(delta, 4, 'X') @ Matrix.Translation(-hl) @ hm
bpy.context.view_layer.update()
CURL = float(next((a.split('=')[1] for a in ARGS if a.startswith('--curl=')), '0.72'))
CURL_AXIS = int(next((a.split('=')[1] for a in ARGS if a.startswith('--curl-axis=')), '0'))
knee = {s: head_of(f'calf_{s}') for s in 'lr'}
between_knees = (knee['l'] + knee['r']) / 2 + Vector((0, -0.07, -0.03))
for s, sx in (('l', 1), ('r', -1)):
    elbow_t = knee[s] + Vector((-sx * 0.035, 0.13, 0.085))
    aim(f'upperarm_{s}', elbow_t - head_of(f'upperarm_{s}'))
    hand_t = between_knees + Vector((sx * 0.055, 0, 0))
    fore = hand_t - head_of(f'lowerarm_{s}')
    aim(f'lowerarm_{s}', fore)
    aim(f'hand_{s}', fore.normalized() + Vector((0, 0, -0.55)))
    for f in ('index', 'middle', 'ring', 'pinky'):
        for seg in ('01', '02', '03'):
            b = pb[f'{f}_{seg}_{s}']
            b.rotation_mode = 'XYZ'
            r = [0.0, 0.0, 0.0]
            r[abs(CURL_AXIS) % 3] = CURL * (0.8 if seg == '01' else 1.0) * (-1 if CURL_AXIS < 0 or str(CURL_AXIS).startswith('-') else 1)
            b.rotation_euler = r
    for seg in ('02', '03'):
        b = pb[f'thumb_{seg}_{s}']
        b.rotation_mode = 'XYZ'
        b.rotation_euler = (CURL * 0.6, 0, 0)
bpy.context.view_layer.update()

ev, dg = evaluated()
posed = [v.co.copy() for v in ev.data.vertices]
pnorm = [v.normal.copy() for v in ev.data.vertices]
neck_pivot = head_of('neck_01')
eye_pts = [centroid('helper-l-eye', posed), centroid('helper-r-eye', posed)]
E_p = (eye_pts[0] + eye_pts[1]) / 2
# the head bone's rest -> posed move: hair is designed upright (rest), then carried onto the posed head
HEAD_T = (rig.matrix_world @ pb['head'].matrix) @ (rig.matrix_world @ rig.data.bones['head'].matrix_local).inverted()
HEAD_TI = HEAD_T.inverted()

# ------------------------------------------------------------------ placement in the Monarch's frame
P3 = [to3(p) for p in posed]
pants = [i for i in keep if zones[i] == 'pants']
hip_z = to3(head_of('pelvis')).z
butt_y = min(P3[i].y for i in pants if P3[i].z < hip_z + 0.12)
sole_y = min(P3[i].y for i in keep if zones[i] in ('sole', 'shoe'))
drop = butt_y - sole_y
print(f'build_monarch: seat-to-sole drop {drop:.3f} (the dais is {-DAIS_Y:.3f} below the seat)')
calf_idx = [i for i in pants if P3[i].y < butt_y - 0.12]
dz = (SEAT_FRONT_Z + 0.025) - min(P3[i].z for i in calf_idx)
OFF = Vector((-to3(head_of('pelvis')).x, -butt_y, dz))


def place(p):
    return to3(p) + OFF


# ------------------------------------------------------------------ the two parts
src = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)


def part_mesh(want_head):
    """A bmesh of the kept faces on one side of the neck seam, zones on its faces."""
    bm = bmesh.new()
    bm.from_mesh(src)
    bm.verts.ensure_lookup_table()
    head_flag = bm.verts.layers.int.new('head')
    zone = bm.verts.layers.int.new('zone')
    orig = bm.verts.layers.int.new('orig')
    for v in bm.verts:
        v[head_flag] = 1 if in_head[v.index] else 0
        v[orig] = v.index
        v[zone] = ZONES.index(zones[v.index])
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.index not in keep], context='VERTS')
    drop_faces = []
    for f in bm.faces:
        is_head = sum(v[head_flag] for v in f.verts) * 2 > len(f.verts)
        if is_head != want_head:
            drop_faces.append(f)
            continue
        c = Counter(v[zone] for v in f.verts)
        f.material_index = max(c, key=lambda z: (c[z], -z))
    bmesh.ops.delete(bm, geom=drop_faces, context='FACES_ONLY')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    return bm


# a fitted skull cap: the cap faces stand 6 mm off the scalp
def thicken_cap(bm):
    bm.normal_update()
    lift = {}
    for f in bm.faces:
        if ZONES[f.material_index] == 'cap':
            for v in f.verts:
                lift[v] = v.normal.copy()
    for v, n in lift.items():
        v.co += n * 0.006


def add_twists(bm):
    """His twists, tied off under the back of the cap: a bundle of short tapered strands."""
    cap = [f.calc_center_median() for f in bm.faces if ZONES[f.material_index] == 'cap']
    if not cap:
        refuse('no cap faces to hang the twists from')
    low_back = sorted(cap, key=lambda c: (c.y - E_p.y) * 2.0 - (c.z - E_p.z) * 1.2 - c.x * 0.8, reverse=True)[:6]
    root = sum(low_back, Vector()) / len(low_back)
    mi = ZONES.index('hair')
    base = (Vector((-0.3, 0.55, -0.78))).normalized()
    side = base.cross(Vector((0, 0, 1))).normalized()
    up = side.cross(base).normalized()
    knot = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=0.012)
    for v in knot['verts']:
        v.co = root + v.co
    kf = list({f for v in knot['verts'] for f in v.link_faces})
    bmesh.ops.recalc_face_normals(bm, faces=kf)
    for f in kf:
        f.material_index = mi
    for k in range(7):
        a = k / 7 * math.tau
        d = (base + side * 0.32 * math.cos(a) + up * 0.22 * math.sin(a)).normalized()
        start = root + side * 0.006 * math.cos(a) + up * 0.006 * math.sin(a)
        length = 0.04 + 0.012 * ((k * 37) % 5) / 4
        res = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=True, segments=5, radius1=0.0048, radius2=0.0028, depth=length)
        rot = Vector((0, 0, 1)).rotation_difference(d).to_matrix().to_4x4()
        bmesh.ops.transform(bm, matrix=Matrix.Translation(start + d * (length / 2)) @ rot, verts=res['verts'])
        tf = list({f for v in res['verts'] for f in v.link_faces})
        bmesh.ops.recalc_face_normals(bm, faces=tf)
        for f in tf:
            f.material_index = mi


def smooth01(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def hair_margin(r):
    """How far a rest-space scalp point sits inside the hairline (the 4.70.0 cap line), in metres."""
    f = min(1.0, max(0.0, (r.y - E.y) / max(1e-6, back_y - E.y)))
    return r.z - (E.z + 0.030 - 0.078 * f)


AFRO_DEPTH = 0.062


def add_afro(bm):
    """An afro: the scalp duplicated and grown out to a rounded, clumped shell, thin at the hairline."""
    orig = bm.verts.layers.int['orig']
    hi = ZONES.index('hair')
    cran = [rest[i] for i in head_idx if rest[i].z > E.z - 0.01]
    lo = Vector((min(p.x for p in cran), min(p.y for p in cran), min(p.z for p in cran)))
    hi_ = Vector((max(p.x for p in cran), max(p.y for p in cran), max(p.z for p in cran)))
    C = Vector((E.x, (lo.y + hi_.y) / 2 + 0.034, hi_.z - 0.03))
    R = Vector(((hi_.x - lo.x) / 2 + AFRO_DEPTH * 0.85, (hi_.y - lo.y) / 2 + AFRO_DEPTH * 0.95, 0.03 + AFRO_DEPTH * 1.25))
    rot_i = HEAD_TI.to_3x3()
    bm.normal_update()
    scalp = [f for f in bm.faces if f.material_index == hi]
    if len(scalp) < 50:
        refuse(f'only {len(scalp)} scalp faces to grow an afro from')
    dup = bmesh.ops.duplicate(bm, geom=scalp)
    dfaces = [g for g in dup['geom'] if isinstance(g, bmesh.types.BMFace)]
    dedges = list({e for f in dfaces for e in f.edges})
    sub = bmesh.ops.subdivide_edges(bm, edges=dedges, cuts=1, use_grid_fill=True)
    bm.normal_update()
    verts = list({v for f in dfaces for v in f.verts} | {g for g in sub['geom_inner'] if isinstance(g, bmesh.types.BMVert)})
    dfaces = list({f for v in verts for f in v.link_faces if f.material_index == hi})
    for v in verts:
        n = v.normal.copy()
        r = HEAD_TI @ v.co  # rest space (the subdivided points have no source vertex)
        nr = (rot_i @ n).normalized()
        o = Vector(((r.x - C.x) / R.x, (r.y - C.y) / R.y, (r.z - C.z) / R.z))
        d = Vector((nr.x / R.x, nr.y / R.y, nr.z / R.z))
        a, b, c = d.dot(d), 2 * o.dot(d), o.dot(o) - 1
        disc = b * b - 4 * a * c
        t = max(0.0, (-b + math.sqrt(disc)) / (2 * a)) if disc > 0 else 0.0
        clump = 1 + 0.12 * noise.noise(r * 17.0) + 0.035 * noise.noise(r * 43.0 + Vector((3.1, 0, 0)))
        w = smooth01(0.0, 0.026, hair_margin(r))
        v.co += n * (0.003 + t * clump * w)
    inner = [v for v in verts if not v.is_boundary]
    for _ in range(4):  # soft clumps, no spikes at the hairline
        bmesh.ops.smooth_vert(bm, verts=inner, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    for f in dfaces:
        f.material_index = hi
    bm.normal_update()
    return len(verts)


BRAIDS = 28
SIDES = 6


def add_braids(head, body):
    """Box braids: combed back over the scalp from evenly spread roots, then falling to the
    shoulders. Each strand is kept clear of the head and of the body at the head's full turn
    (cast.js turns it up to 0.45 rad either way), so it never passes through a shoulder."""
    hi = ZONES.index('hair')
    head.normal_update()
    tree_h = BVHTree.FromBMesh(head)
    tree_b = BVHTree.FromBMesh(body)
    rot, rot_i = HEAD_T.to_3x3(), HEAD_TI.to_3x3()
    cand = [f.calc_center_median() for f in head.faces if f.material_index == hi]
    cand = [c for c in cand if hair_margin(HEAD_TI @ c) > 0.004]
    if len(cand) < BRAIDS * 3:
        refuse(f'only {len(cand)} scalp points for {BRAIDS} braids')
    roots = [max(cand, key=lambda c: (HEAD_TI @ c).z)]
    dist = [(c - roots[0]).length for c in cand]
    while len(roots) < BRAIDS:  # farthest-point sampling: even partings
        k = max(range(len(cand)), key=lambda i: dist[i])
        roots.append(cand[k])
        dist = [min(dist[i], (cand[i] - cand[k]).length) for i in range(len(cand))]
    down = Vector((0, 0, -1))
    yaw = [Matrix.Rotation(a, 3, 'Z') for a in (0.0, 0.45, -0.45)]

    def clear(p, gap):
        loc, nrm, _, _ = tree_h.find_nearest(p)
        if loc is not None and (p - loc).dot(nrm) < gap:
            p = loc + nrm * gap
        for m in yaw:  # the body as the turned head sees it
            q = neck_pivot + m @ (p - neck_pivot)
            loc, nrm, _, _ = tree_b.find_nearest(q)
            if loc is not None and (q - loc).dot(nrm) < gap:
                q = loc + nrm * gap
                p = neck_pivot + m.transposed() @ (q - neck_pivot)
        return p

    strands = []
    for j, r0 in enumerate(roots):
        rad = 0.0085 + 0.0012 * ((j * 7) % 3) / 2
        gap = rad + 0.003
        length = 0.30 + 0.06 * ((j * 13) % 7) / 6
        seg = 0.016
        loc, nrm, _, _ = tree_h.find_nearest(r0)
        pts = [loc - nrm * 0.003, loc + nrm * gap]
        rr = HEAD_TI @ r0
        side = 1.0 if (rr.x - E.x) > 0 or ((rr.x - E.x) == 0 and j % 2) else -1.0
        comb = rot @ Vector((side * 0.5, 0.85, -0.2))  # from a centre part, back past the ears: the face stays clear
        travelled = 0.0
        while travelled < 0.24:  # combed along the scalp until it runs off the side or the back
            p = pts[-1]
            loc, nrm, _, _ = tree_h.find_nearest(p)
            nr = rot_i @ nrm
            lr = HEAD_TI @ loc
            past_ear = (lr.y - E.y) > 0.5 * (back_y - E.y)  # only fall once behind the ear line
            if travelled > 0.02 and past_ear and (nr.z < 0.15 or hair_margin(lr) < 0.01):
                break
            tang = (comb - nrm * comb.dot(nrm)).normalized()
            loc, nrm, _, _ = tree_h.find_nearest(p + tang * seg)
            pts.append(loc + nrm * gap)
            travelled += seg
        anchor = max(2, len(pts) - 2)  # the last combed points bend with the fall, no kink
        n_free = max(4, int((length - travelled) / seg))
        for _ in range(n_free):
            pts.append(pts[-1] + down * seg)
        for _ in range(90):  # gravity, length, collision, a little stiffness
            for k in range(anchor, len(pts)):
                pts[k] = pts[k] + down * 0.002
            for k in range(anchor, len(pts)):
                d = pts[k] - pts[k - 1]
                pts[k] = pts[k - 1] + d.normalized() * seg
            for k in range(anchor, len(pts) - 1):
                pts[k] = pts[k].lerp((pts[k - 1] + pts[k + 1]) / 2, 0.25)
            for k in range(anchor, len(pts)):
                pts[k] = clear(pts[k], gap)
        strands.append((pts, rad))

    made = []
    for pts, rad in strands:
        n = len(pts)
        rings = []
        ref = Vector((1, 0, 0))
        for k, p in enumerate(pts):
            t = (pts[min(n - 1, k + 1)] - pts[max(0, k - 1)]).normalized()
            if abs(t.dot(ref)) > 0.9:
                ref = Vector((0, 1, 0))
            u = (ref - t * ref.dot(t)).normalized()
            w = t.cross(u)
            ref = u
            r = rad * (1 - 0.3 * k / n) * (1.0 if k % 2 else 0.8)  # the knots of a braid
            rings.append([head.verts.new(p + (u * math.cos(a) + w * math.sin(a)) * r) for a in (i / SIDES * math.tau for i in range(SIDES))])
        tip = head.verts.new(pts[-1] + (pts[-1] - pts[-2]).normalized() * rad * 1.5)
        base = head.verts.new(pts[0] - (pts[1] - pts[0]).normalized() * rad)
        fs = []
        for a, b in zip(rings, rings[1:]):
            for i in range(SIDES):
                fs.append(head.faces.new((a[i], a[(i + 1) % SIDES], b[(i + 1) % SIDES], b[i])))
        for i in range(SIDES):
            fs.append(head.faces.new((rings[-1][i], rings[-1][(i + 1) % SIDES], tip)))
            fs.append(head.faces.new((rings[0][(i + 1) % SIDES], rings[0][i], base)))
        tri = bmesh.ops.triangulate(head, faces=fs)['faces']
        bmesh.ops.recalc_face_normals(head, faces=tri)
        for f in tri:
            f.material_index = hi
        made.append(tri)
    head.normal_update()
    return made


def add_collar(bm):
    """A mock-neck collar ring over the seam where the head part meets the body."""
    edge = [v for v in bm.verts if v.is_boundary and v.co.z > E_p.z - 0.4]
    if len(edge) < 8:
        refuse(f'neck seam not found ({len(edge)} boundary verts)')
    c = sum((v.co for v in edge), Vector()) / len(edge)
    r = sum((v.co - c).length for v in edge) / len(edge)
    axis = (head_of('head') - neck_pivot).normalized()
    res = bmesh.ops.create_cone(bm, cap_ends=False, segments=18, radius1=r + 0.009, radius2=r + 0.006, depth=0.034)
    rot = Vector((0, 0, 1)).rotation_difference(axis).to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation(c + axis * 0.006) @ rot, verts=res['verts'])
    mi = ZONES.index('top')
    cf = list({f for v in res['verts'] for f in v.link_faces})
    bm.normal_update()
    out = sum((f.calc_center_median() - c).dot(f.normal) for f in cf)
    if out < 0:
        bmesh.ops.reverse_faces(bm, faces=cf)
    for f in cf:
        f.material_index = mi
    return r


def loosen_pants(bm):
    """Joggers, not tights: the pants stand a centimetre off the leg."""
    bm.normal_update()
    zi = ZONES.index('pants')
    lift = {v: v.normal.copy() for f in bm.faces if f.material_index == zi for v in f.verts}
    for v, n in lift.items():
        v.co += n * 0.011


def add_shoes(bm):
    """Swap the bare feet for sneakers: a rounded upper on a white sole, fitted to each posed foot."""
    zs = {ZONES.index('shoe'), ZONES.index('sole')}
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index in zs], context='FACES_ONLY')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    up = Vector((0, 0, 1))
    for s in 'lr':
        idx = [i for i in keep if dom[i] in (f'foot_{s}', f'ball_{s}')]
        ankle = head_of(f'foot_{s}')
        d = (rig.matrix_world @ pb[f'ball_{s}'].tail) - ankle
        d.z = 0
        d.normalize()
        w = d.cross(up).normalized()  # (w, d, up) right-handed: up x d mirrors the frame and turns the shoe inside out
        t = [(posed[i] - ankle).dot(d) for i in idx]
        u = [(posed[i] - ankle).dot(w) for i in idx]
        ground = min(posed[i].z for i in idx)
        L, W, H, SOLE = max(t) - min(t) + 0.025, max(u) - min(u) + 0.024, 0.1, 0.024
        mid = ankle + d * ((max(t) + min(t)) / 2) + w * ((max(u) + min(u)) / 2)
        mid.z = ground
        frame = Matrix((w, d, up)).transposed().to_4x4()
        frame.translation = mid
        upper = bmesh.ops.create_uvsphere(bm, u_segments=18, v_segments=10, radius=1.0)
        for v in upper['verts']:
            x, y, z = v.co
            z = (max(z, -0.3) + 0.3) / 1.3 * H
            if y > 0:
                z *= 1 - 0.38 * y * y  # the toe box runs lower than the heel
            v.co = frame @ Vector((x * W / 2, y * L / 2, SOLE + z))
        sole = bmesh.ops.create_cone(bm, cap_ends=True, segments=18, radius1=1.0, radius2=1.0, depth=SOLE)
        for v in sole['verts']:
            x, y, z = v.co
            v.co = frame @ Vector((x * (W / 2 + 0.004), y * (L / 2 + 0.006), z + SOLE / 2))
        for res, z in ((upper, 'shoe'), (sole, 'sole')):
            mi = ZONES.index(z)
            faces = list({f for v in res['verts'] for f in v.link_faces})
            bmesh.ops.recalc_face_normals(bm, faces=faces)  # bmesh primitives can come out inward
            for f in faces:
                f.material_index = mi
            centre = sum((v.co for v in res['verts']), Vector()) / len(res['verts'])
            vol = sum((f.calc_center_median() - centre).dot(f.normal) * f.calc_area() for f in faces)
            if vol <= 0:
                refuse(f'the {s} {z} is inside out (signed volume {vol:.5f})')


def decimate(bm, ratio, name):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for z in ZONES:
        me.materials.append(bpy.data.materials.get(z) or bpy.data.materials.new(z))
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    mod = ob.modifiers.new('decimate', 'DECIMATE')
    mod.ratio = ratio
    mod.use_collapse_triangulate = True
    dgx = bpy.context.evaluated_depsgraph_get()
    out = bmesh.new()
    out.from_mesh(ob.evaluated_get(dgx).to_mesh())
    bmesh.ops.triangulate(out, faces=out.faces[:])
    out.normal_update()
    return out


head_bm = part_mesh(True)
if HAIR == 'cap':
    thicken_cap(head_bm)
    add_twists(head_bm)
elif HAIR == 'afro':
    print(f'build_monarch: afro grown from {add_afro(head_bm)} scalp points')
body_bm = part_mesh(False)
loosen_pants(body_bm)
add_shoes(body_bm)
neck_r = add_collar(body_bm)
head_bm = decimate(head_bm, DECIMATE['head'], 'monarch_head')
body_bm = decimate(body_bm, DECIMATE['body'], 'monarch_body')
braids = add_braids(head_bm, body_bm) if HAIR == 'braids' else []

# ------------------------------------------------------------------ guards
pivot3 = place(neck_pivot)
eyes3 = [place(p) for p in eye_pts]
problems = []
if not (DAIS_Y - 0.035 <= sole_y - butt_y <= DAIS_Y + 0.035):
    problems.append(f'soles at {sole_y - butt_y:.3f}, the dais is at {DAIS_Y} (adjust --thigh, now {THIGH_UP:+.2f})')
butt_back = min(place(posed[i]).z for i in pants if place(posed[i]).y < 0.12)
if butt_back < BACK_Z:
    problems.append(f'buttocks at z {butt_back:.3f}, inside the backrest ({BACK_Z})')
seat = [i for i in pants if dom[i] == 'pelvis' and place(posed[i]).y < 0.06]
butt_mid = sum(place(posed[i]).z for i in seat) / max(1, len(seat))
print(f'build_monarch: buttocks centred at z {butt_mid:.3f}, back at z {butt_back:.3f} (seat runs {BACK_Z} to {SEAT_FRONT_Z})')
if not seat or butt_mid > SEAT_FRONT_Z - 0.12:
    problems.append(f'sitting on the edge at z {butt_mid:.3f}: off the seat')
for bm, label in ((body_bm, 'body'), (head_bm, 'head')):
    for v in bm.verts:
        p = place(v.co)
        if abs(p.x) > ARM_INNER_X and ARM_Z[0] < p.z < ARM_Z[1] and p.y < ARM_TOP_Y:
            problems.append(f'{label} inside an armrest at {tuple(round(c, 3) for c in p)}')
            break
if not (pivot3.y > 0.3):
    problems.append(f'head pivot at y {pivot3.y:.3f}: not upright')
if not all(e.y > pivot3.y for e in eyes3):
    problems.append('eyes below the neck pivot')
if not all(e.z > pivot3.z for e in eyes3):
    problems.append('face does not point +Z')
if eyes3[0].x < eyes3[1].x:
    problems.append('left and right eye swapped: the figure is mirrored')
cen = sum((v.co for v in body_bm.verts), Vector()) / len(body_bm.verts)
outward = sum(f.normal.dot(f.calc_center_median() - cen) * f.calc_area() for f in body_bm.faces)
if outward <= 0:
    problems.append('body normals face inward')
present = {ZONES[f.material_index] for bm in (body_bm, head_bm) for f in bm.faces}
missing = [z for z in ZONES if z not in present and not (z == 'cap' and HAIR != 'cap')]
if missing:
    problems.append(f'zones missing: {missing}')
tris = len(body_bm.faces) + len(head_bm.faces)
if tris > BUDGET_TRIS:
    problems.append(f'{tris} triangles, budget {BUDGET_TRIS}')
if problems:
    refuse('; '.join(problems))

# ------------------------------------------------------------------ write
blob = bytearray()


def pad4():
    while len(blob) % 4:
        blob.append(0)


def write_part(name, bm, origin):
    verts = list(bm.verts)
    for i, v in enumerate(verts):
        v.index = i
    pts = [place(v.co) - origin for v in verts]
    nrm = [to3(v.normal).normalized() for v in verts]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    c = (lo + hi) / 2
    h = Vector([max(1e-6, (hi[k] - lo[k]) / 2) for k in range(3)])
    pad4()
    pos_off = len(blob)
    for p in pts:
        blob.extend(struct.pack('<3h', *[max(-32767, min(32767, round((p[k] - c[k]) / h[k] * 32767))) for k in range(3)]))
    pad4()
    nrm_off = len(blob)
    for n in nrm:
        blob.extend(struct.pack('<3b', *[max(-127, min(127, round(n[k] * 127))) for k in range(3)]))
    pad4()
    idx_off = len(blob)
    groups, count = [], 0
    u32 = len(verts) > 65535
    for zi, z in enumerate(ZONES):
        faces = [f for f in bm.faces if f.material_index == zi]
        if not faces:
            continue
        start = count
        for f in faces:
            blob.extend(struct.pack('<3I' if u32 else '<3H', *[v.index for v in f.verts]))
            count += 3
        groups.append({'zone': z, 'start': start, 'count': count - start})
    return {
        'name': name, 'pivot': [round(x, 5) for x in origin], 'center': [round(x, 5) for x in c], 'half': [round(x, 5) for x in h],
        'vertices': len(verts), 'indices': count, 'indexType': 'u32' if u32 else 'u16',
        'position': pos_off, 'normal': nrm_off, 'index': idx_off, 'groups': groups,
    }


parts = [write_part('body', body_bm, Vector((0, 0, 0))), write_part('head', head_bm, pivot3)]
pad4()
manifest = {
    'version': 1,
    'kind': 'monarch',
    'bin': {'file': 'monarch.bin', 'bytes': len(blob)},
    'zones': ZONES,
    'parts': parts,
    'eyes': [[round(x, 5) for x in (e - pivot3)] for e in eyes3],
    'fit': {'seatY': 0, 'soleY': round(sole_y - butt_y, 4), 'calfZ': round(SEAT_FRONT_Z + 0.025, 4), 'neckRadius': round(neck_r, 4), 'tris': tris},
    'hair': HAIR,
    'source': {'tool': 'MPFB (MakeHuman for Blender)', 'macros': MACROS, 'race': RACE, 'rig': 'game_engine'},
}
if len(blob) > BUDGET_BYTES:
    refuse(f'monarch.bin is {len(blob)} bytes, budget {BUDGET_BYTES}')
print(f'build_monarch: {tris} triangles, {len(blob)} bytes, head pivot {tuple(round(x, 3) for x in pivot3)}, eyes {manifest["eyes"]}')
PREVIEW = next((ARGS[i + 1] for i, a in enumerate(ARGS) if a == '--preview'), None)
if PREVIEW:
    # a quick Workbench look from the throne close-up's side of the room; never shipped
    hands_at = (head_of('hand_l') + head_of('hand_r')) / 2
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    tint = {'skin': (0.32, 0.18, 0.12), 'top': (0.05, 0.05, 0.06), 'pants': (0.08, 0.08, 0.1), 'shoe': (0.04, 0.04, 0.04),
            'sole': (0.85, 0.85, 0.85), 'cap': (0.02, 0.02, 0.03), 'hair': (0.01, 0.01, 0.01), 'beard': (0.01, 0.01, 0.01), 'eye': (0.75, 0.6, 1.0)}
    for label, bm in (('body', body_bm), ('head', head_bm)):
        me = bpy.data.meshes.new(label)
        bm.to_mesh(me)
        for z in ZONES:
            m = bpy.data.materials.get('pv_' + z) or bpy.data.materials.new('pv_' + z)
            m.diffuse_color = (*tint[z], 1)
            me.materials.append(m)
        bpy.context.scene.collection.objects.link(bpy.data.objects.new(label, me))
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.display.shading.color_type = 'MATERIAL'
    sc.display.shading.light = 'STUDIO'
    sc.render.resolution_x, sc.render.resolution_y = 900, 1100
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.lens = 50
    target = (neck_pivot + Vector((0, 0, -0.45)))
    cam.location = target + Vector((float(next((a.split('=')[1] for a in ARGS if a.startswith('--side=')), '0.9')), -3.2, 0.35))
    if '--hands' in ARGS:
        target = hands_at
        cam.location = target + Vector((0.25, -0.9, 0.45))
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = PREVIEW
    bpy.ops.render.render(write_still=True)
    print(f'build_monarch: preview {PREVIEW}')
if DRY:
    print('build_monarch: --dry, nothing written')
else:
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, 'monarch.bin'), 'wb') as fh:
        fh.write(blob)
    with open(os.path.join(OUT, 'monarch.json'), 'w') as fh:
        json.dump(manifest, fh, indent=1)
    print(f'build_monarch: wrote {OUT}/monarch.json + monarch.bin')
