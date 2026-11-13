"""build_set.py: the studio set, modelled and light-baked in Blender (4.66.0).

Run headless (no screen taken):
    node tools/studio/dump-layout.mjs
    /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/studio/build_set.py -- [--preview out.png] [--samples 256] [--size 2048]

What it makes, in public/assets/studio/:
    set.json   manifest: meshes, byte offsets, quantisation, station count, bake stats
    set.bin    geometry only: Int16 positions (normalised to each mesh's box), Uint16 UVs, indices
    cyc.webp   the infinity cyc with its light baked in
    props.webp everything else on the floor, light baked in

The set is authored in three.js world units with Y up. Cycles does not care which
axis is up, so nothing is converted and nothing can be rotated twice. The colour
is the bake: the browser draws these meshes unlit, exactly as Blender lit them.
The crew, the screens and everything that moves stay live in js/studio.js.

Guards (it refuses to write rather than ship a broken set):
    the layout must come from dump-layout.mjs and its station count must match
    the pedestals built; the cyc floor must face up; every closed solid must have
    outward normals (positive signed volume); a bake that came out black or flat
    white fails; the files must fit the size budget.
"""
import bpy
import bmesh
import json
import math
import os
import struct
import sys
import time
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public', 'assets', 'studio')
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def arg(name, default):
    return ARGS[ARGS.index(name) + 1] if name in ARGS else default


PREVIEW = arg('--preview', None)
SAMPLES = int(arg('--samples', '256'))
SIZE = int(arg('--size', '2048'))
EXPOSURE = float(arg('--exposure', '0.0'))
LAYOUT = json.load(open(os.path.join(ROOT, 'tools', 'studio', 'layout.json')))


def log(*a):
    print('[set]', *a, flush=True)


def fail(msg):
    print(f'[set] REFUSED: {msg}', flush=True)
    sys.exit(1)


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------------------------------------------------------------- materials
GROUPS = {'cyc': [], 'props': []}


def material(group, name, color, emit=0.0):
    m = bpy.data.materials.new(f'{group}_{name}')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    if emit:
        e = nt.nodes.new('ShaderNodeEmission')
        e.inputs[0].default_value = (*color, 1)
        e.inputs[1].default_value = emit
        nt.links.new(e.outputs[0], out.inputs[0])
    else:
        d = nt.nodes.new('ShaderNodeBsdfDiffuse')
        d.inputs[0].default_value = (*color, 1)
        nt.links.new(d.outputs[0], out.inputs[0])
    GROUPS[group].append(m)
    return m


def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


CYC = material('cyc', 'white', (0.86, 0.865, 0.875))
MAT = {
    'white': material('props', 'white', (0.86, 0.865, 0.875)),
    'matte': material('props', 'matte', (0.8, 0.805, 0.815)),
    'black': material('props', 'black', (0.025, 0.026, 0.03)),
    'dark': material('props', 'dark', (0.06, 0.062, 0.07)),
    'steel': material('props', 'steel', (0.42, 0.43, 0.45)),
    'tape': material('props', 'tape', srgb('#ff2d55')),
    'tapew': material('props', 'tapew', (0.9, 0.9, 0.9)),
    'canvas': material('props', 'canvas', (0.035, 0.036, 0.04)),
    'pinkbox': material('props', 'pinkbox', srgb('#ff7ab6')),
    'glow': material('props', 'glow', (1, 1, 1), emit=6.0),
    'violet': material('props', 'violet', srgb('#8f6bff'), emit=22.0),
}
MAT_ORDER = list(MAT.values())
MAT_INDEX = {k: i for i, k in enumerate(MAT)}

# ---------------------------------------------------------------- primitives (three.js frame, Y up)
PARTS = []  # (bmesh, matrix, material key, closed)


def T(x, y, z):
    return Matrix.Translation(Vector((x, y, z)))


def RY(a):
    return Matrix.Rotation(a, 4, 'Y')


def RX(a):
    return Matrix.Rotation(a, 4, 'X')


def RZ(a):
    return Matrix.Rotation(a, 4, 'Z')


def box(w, h, d, M, mat, r=0.0, segs=2, drop_bottom=False):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector((w, h, d)), verts=bm.verts)
    if r > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges) + list(bm.verts), offset=min(r, w / 2.05, h / 2.05, d / 2.05), segments=segs, affect='EDGES', profile=0.5, clamp_overlap=True)
    if drop_bottom:
        dead = [f for f in bm.faces if f.normal.y < -0.99 and f.calc_center_median().y < -h / 2 + 1e-4]
        bmesh.ops.delete(bm, geom=dead, context='FACES')
    PARTS.append((bm, M, mat, not drop_bottom))


def smooth_sides(bm):
    """Smooth the round sides of a cylinder or cone, keep its caps flat."""
    bm.normal_update()
    for f in bm.faces:
        f.smooth = len(f.verts) == 4


def cyl(rt, rb, h, M, mat, segs=12, axis='Y'):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs, radius1=rb, radius2=rt, depth=h)
    if axis == 'Y':
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(-math.pi / 2, 3, 'X'))
    elif axis == 'X':
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'Y'))
    smooth_sides(bm)
    PARTS.append((bm, M, mat, True))


def sphere(r, M, mat, u=16, v=10, scale=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    bmesh.ops.scale(bm, vec=Vector(scale), verts=bm.verts)
    for f in bm.faces:
        f.smooth = True
    PARTS.append((bm, M, mat, True))


def rod(a, b, r, mat, segs=8):
    """A cylinder from point a to point b."""
    a, b = Vector(a), Vector(b)
    d = b - a
    L = d.length
    q = d.normalized().to_track_quat('Y', 'Z')
    cyl(r, r, L, T(*((a + b) / 2)) @ q.to_matrix().to_4x4(), mat, segs)


def plane(w, d, M, mat):
    """Horizontal quad (normal +Y)."""
    bm = bmesh.new()
    v = [bm.verts.new((x * w / 2, 0, z * d / 2)) for x, z in ((-1, 1), (1, 1), (1, -1), (-1, -1))]
    bm.faces.new(v)
    bm.normal_update()
    if bm.faces[0].normal.y < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
    PARTS.append((bm, M, mat, False))


# ---------------------------------------------------------------- the cyc (own UVs, more texels where the camera looks)
def piecewise(points):
    """[(world, uv)] breakpoints -> a function world -> uv, linear between them."""
    def f(x):
        for (x0, u0), (x1, u1) in zip(points, points[1:]):
            lo, hi = min(x0, x1), max(x0, x1)
            if lo - 1e-6 <= x <= hi + 1e-6:
                return u0 + (u1 - u0) * (x - x0) / (x1 - x0)
        raise ValueError(x)
    return f


def build_cyc():
    R = 6.0
    xs = list(range(-46, 47, 2))
    prof = []  # (y, z, s) s = arc length from the front edge
    s = 0.0
    last = None
    for z in range(30, -9, -2):
        p = (0.0, float(z))
        if last:
            s += math.dist(p, last)
        prof.append((*p, s))
        last = p
    for i in range(1, 17):
        a = i / 16 * math.pi / 2
        p = (R - R * math.cos(a), -8 - R * math.sin(a))
        s += math.dist(p, last)
        prof.append((*p, s))
        last = p
    for y in range(int(R) + 2, 25, 2):
        p = (float(y), -8 - R)
        s += math.dist(p, last)
        prof.append((*p, s))
        last = p
    s_at = {round(p[1], 3) if p[0] == 0 else None: p[2] for p in prof}
    s_floor_front, s_floor_mid, s_cove0 = 0.0, s_at[12.0], s_at[-8.0]
    s_cove1 = next(p[2] for p in prof if abs(p[0] - R) < 1e-6 and abs(p[1] + 8 + R) < 1e-6)
    s_wall12 = next(p[2] for p in prof if abs(p[0] - 12) < 1e-6)
    s_top = prof[-1][2]
    U = piecewise([(-46, 0), (-22, 0.06), (-12, 0.20), (12, 0.80), (22, 0.94), (46, 1.0)])
    V = piecewise([(s_floor_front, 0.0), (s_floor_mid, 0.10), (s_cove0, 0.60), (s_cove1, 0.77), (s_wall12, 0.90), (s_top, 1.0)])
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    grid = [[bm.verts.new((x, y, z)) for (y, z, _s) in prof] for x in xs]
    for i in range(len(xs) - 1):
        for j in range(len(prof) - 1):
            f = bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
            for loop in f.loops:
                ii = i if loop.vert in (grid[i][j], grid[i][j + 1]) else i + 1
                jj = j if loop.vert in (grid[i][j], grid[i + 1][j]) else j + 1
                loop[uvl].uv = (U(xs[ii]), V(prof[jj][2]))
    for f in bm.faces:
        f.smooth = True
    bm.normal_update()
    up = [f for f in bm.faces if f.calc_center_median().y < 0.01]
    if sum(f.normal.y for f in up) < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
        bm.normal_update()
    if not all(f.normal.y > 0.99 for f in bm.faces if f.calc_center_median().y < 0.01):
        fail('cyc floor does not face up')
    me = bpy.data.meshes.new('cyc')
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new('cyc', me)
    scene.collection.objects.link(ob)
    me.materials.append(CYC)
    return ob


# ---------------------------------------------------------------- the set
L = LAYOUT
C = Vector((L['center']['x'], 0, L['center']['z']))
ST = L['station']


def build_riser():
    r = L['riser']
    bm = bmesh.new()
    n = 48
    outer = [bm.verts.new((math.sin(r['a0'] + (r['a1'] - r['a0']) * i / n) * r['r2'], 0, C.z - math.cos(r['a0'] + (r['a1'] - r['a0']) * i / n) * r['r2'])) for i in range(n + 1)]
    inner = [bm.verts.new((math.sin(r['a0'] + (r['a1'] - r['a0']) * i / n) * r['r1'], 0, C.z - math.cos(r['a0'] + (r['a1'] - r['a0']) * i / n) * r['r1'])) for i in range(n, -1, -1)]
    bm.faces.new(outer + inner)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    if bm.faces[0].normal.y > 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
    res = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
    top = [g for g in res['geom'] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=Vector((0, r['top'], 0)), verts=top)
    bmesh.ops.dissolve_limit(bm, angle_limit=0.01, verts=bm.verts[:], edges=bm.edges[:])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    top_edges = [e for e in bm.edges if all(abs(v.co.y - r['top']) < 1e-5 for v in e.verts) and any(f.normal.y < 0.5 for f in e.link_faces)]
    bmesh.ops.bevel(bm, geom=top_edges, offset=0.03, segments=2, affect='EDGES', profile=0.5, clamp_overlap=True)
    dead = [f for f in bm.faces if f.normal.y < -0.99]
    bmesh.ops.delete(bm, geom=dead, context='FACES')
    PARTS.append((bm, Matrix.Identity(4), 'matte', False))


def station(i, p):
    M = T(p['x'], p['y'], p['z']) @ RY(p['ry'])
    pe, ne, fr = ST['pedestal'], ST['neck'], ST['frame']
    box(pe['w'], pe['h'], pe['d'], M @ T(pe['x'], pe['y'], pe['z']), 'white', r=pe['r'], drop_bottom=True)
    cyl(ne['r'], ne['r'], ne['h'], M @ T(ne['x'], ne['y'], ne['z']), 'steel', 10)
    box(fr['w'], fr['h'], fr['d'], M @ T(fr['x'], fr['y'], fr['z']) @ RX(fr['tilt']), 'dark', r=0.015, segs=1)
    # the agent's mark: a T of spike tape in front of where it stands
    ag = ST['agent']
    mark = M @ T(ag['x'], 0.0015, ag['z'] + 0.2) @ RY(ag['ry'])
    box(0.3, 0.003, 0.04, mark, 'tape')
    box(0.04, 0.003, 0.16, mark @ T(0, 0, -0.1), 'tape')
    # the station's feed cable leaves the back of the pedestal
    return (M @ Vector((pe['x'], 0.02, pe['z'] - pe['d'] / 2 - 0.02, 1))).to_3d()


def build_desk():
    d = L['desk']
    box(d['w'], 0.07, d['d'], T(d['x'], d['top'], d['z']), 'white', r=0.03)
    for x in (-1.2, 1.2):
        for z in (-0.45, 0.45):
            cyl(0.025, 0.025, 0.74, T(d['x'] + x, 0.37, d['z'] + z), 'steel', 10)
    m = L['monitor']
    box(0.4, 0.02, 0.24, T(m['x'], m['y'] + 0.01, m['z']), 'steel', r=0.008, segs=1)
    cyl(0.03, 0.03, 0.34, T(m['x'], m['y'] + 0.17, m['z']), 'steel', 12)
    box(1.42, 0.84, 0.05, T(m['x'], m['y'] + 0.72, m['z']), 'dark', r=0.02, segs=2)
    # the director's chair, back to camera; JS prints DIRECTOR / JAMES on its back
    c = L['chair']
    for x in (-0.3, 0.3):
        for z in (-0.25, 0.25):
            cyl(0.022, 0.022, 1.05, T(c['x'] + x, 0.52, c['z'] + z) @ RX(-0.08 if z > 0 else 0.08), 'black', 8)
    box(0.62, 0.03, 0.46, T(c['x'], 0.66, c['z']), 'canvas')
    box(0.66, 0.22, 0.02, T(c['x'], 1.0, c['z'] + 0.262), 'canvas')
    for x in (-0.33, 0.33):
        box(0.04, 0.03, 0.5, T(c['x'] + x, 0.86, c['z']), 'black')
    # the director's mark
    for a in (0.785, -0.785):
        box(0.34, 0.003, 0.04, T(c['x'], 0.0015, c['z'] + 0.55) @ RY(a), 'tape')


def build_softbox(s):
    M = T(s['x'], 0, s['z']) @ RY(s['ry'])
    cyl(0.025, 0.025, 2.6, M @ T(0, 1.3, 0), 'black', 8)
    for k in range(3):
        a = k * 2.094 + 0.5
        top = M @ Vector((0, 0.62, 0, 1))
        foot = M @ Vector((math.cos(a) * 0.55, 0.0, math.sin(a) * 0.55, 1))
        rod(top.to_3d(), foot.to_3d(), 0.017, 'black', 6)
        box(0.2, 0.08, 0.12, T(*foot.to_3d()) @ T(0, 0.04, 0) @ RY(-a), 'dark', r=0.03, segs=1)
    box(1.1, 1.1, 0.5, M @ T(0, 2.7, -0.05), 'black', r=0.02, segs=1)
    box(1.0, 1.0, 0.01, M @ T(0, 2.7, 0.205), 'glow')


def build_dolly_track():
    dl = L['dolly']
    z0, z1 = dl['z0'], dl['z1']
    for x in (-0.3, 0.3):
        cyl(0.022, 0.022, abs(z1 - z0), T(dl['x'] + x, 0.07, (z0 + z1) / 2), 'steel', 8, axis='Z')
    z = min(z0, z1) + 0.2
    while z < max(z0, z1):
        box(0.86, 0.05, 0.09, T(dl['x'], 0.025, z), 'dark', r=0.01, segs=1, drop_bottom=True)
        z += 0.6


def build_flat():
    f = L['flat']
    box(f['w'], f['h'], 0.2, T(0, f['h'] / 2, f['z']), 'matte', r=0.04, drop_bottom=True)
    for x in (-4.2, 4.2):  # stage braces and weights behind the flat
        rod((x, 2.6, f['z'] - 0.1), (x, 0.05, f['z'] - 1.4), 0.03, 'black', 6)
        box(0.3, 0.12, 0.2, T(x, 0.06, f['z'] - 1.45), 'dark', r=0.03, segs=1)


def build_space_light(x, y, z):
    cyl(0.36, 0.36, 0.42, T(x, y + 0.42, z), 'steel', 20)
    skirt = bmesh.new()
    bmesh.ops.create_cone(skirt, cap_ends=False, segments=24, radius1=0.62, radius2=0.42, depth=0.55)
    bmesh.ops.rotate(skirt, verts=skirt.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(-math.pi / 2, 3, 'X'))
    bmesh.ops.recalc_face_normals(skirt, faces=skirt.faces[:])
    PARTS.append((skirt, T(x, y - 0.06, z), 'white', False))
    box(1.16, 0.01, 1.16, T(x, y - 0.33, z) @ RY(0.0), 'glow')
    cyl(0.006, 0.006, 9.0, T(x, y + 0.63 + 4.5, z), 'black', 4)


def build_cstand(x, z, ry, flag_h=2.1):
    M = T(x, 0, z) @ RY(ry)
    for k, (h, a) in enumerate(((0.0, 0.0), (0.12, 2.1), (0.24, 4.2))):
        foot = M @ Vector((math.cos(a) * 0.62, 0.0, math.sin(a) * 0.62, 1))
        top = M @ Vector((0, 0.42 + h, 0, 1))
        rod(top.to_3d(), foot.to_3d(), 0.012, 'steel', 6)
    cyl(0.016, 0.016, flag_h, M @ T(0, flag_h / 2, 0), 'steel', 8)
    arm_a = (M @ Vector((-0.2, flag_h - 0.05, 0, 1))).to_3d()
    arm_b = (M @ Vector((0.95, flag_h + 0.1, 0, 1))).to_3d()
    rod(arm_a, arm_b, 0.011, 'steel', 6)
    sphere(0.035, M @ T(0, flag_h - 0.05, 0), 'black', 10, 6)
    box(0.62, 0.46, 0.012, M @ T(0.95 + 0.33, flag_h + 0.1, 0) @ RY(0.25), 'black', r=0.005, segs=1)


def build_apple_boxes(x, z, ry):
    M = T(x, 0, z) @ RY(ry)
    y = 0.0
    for h, rot in ((0.2, 0.0), (0.1, 0.15), (0.05, -0.1)):
        box(0.5, h, 0.3, M @ T(0, y + h / 2, 0) @ RY(rot), 'white', r=0.006, segs=1, drop_bottom=(y == 0))
        y += h


def build_road_case(x, z, ry, w=0.9, h=0.62, d=0.6):
    M = T(x, 0, z) @ RY(ry)
    box(w, h, d, M @ T(0, h / 2 + 0.06, 0), 'black', r=0.015, segs=1)
    for sx in (-1, 1):
        for sz in (-1, 1):
            cyl(0.04, 0.04, 0.06, M @ T(sx * (w / 2 - 0.08), 0.03, sz * (d / 2 - 0.08)), 'dark', 10)
            for sy in (0.06 + 0.02, 0.06 + h - 0.02):
                box(0.06, 0.06, 0.06, M @ T(sx * (w / 2 - 0.01), sy, sz * (d / 2 - 0.01)), 'steel', r=0.01, segs=1)
    box(w * 0.98, 0.02, d * 0.98, M @ T(0, 0.06 + h * 0.62, 0), 'steel')


def build_craft():
    c = L['craft']
    M = T(c['x'], 0, c['z']) @ RY(c['ry'])
    box(1.5, 0.05, 0.62, M @ T(0, 0.74, 0), 'white', r=0.02, segs=1)
    for x in (-0.68, 0.68):
        for z in (-0.25, 0.25):
            cyl(0.02, 0.02, 0.72, M @ T(x, 0.36, z), 'steel', 8)
    cyl(0.13, 0.15, 0.46, M @ T(-0.45, 0.765 + 0.23, 0), 'steel', 20)
    cyl(0.06, 0.13, 0.08, M @ T(-0.45, 0.765 + 0.5, 0), 'steel', 20)
    box(0.04, 0.03, 0.08, M @ T(-0.45, 0.88, 0.17), 'black')
    for k in range(6):
        cyl(0.038, 0.032, 0.1, M @ T(-0.1 + (k % 3) * 0.1, 0.815, -0.12 + (k // 3) * 0.1), 'white', 10)
    box(0.42, 0.08, 0.42, M @ T(0.42, 0.805, 0.02) @ RY(0.2), 'pinkbox', r=0.01, segs=1)


def cable(points, r=0.016, mat='black'):
    cu = bpy.data.curves.new('cable', 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = 1
    cu.resolution_u = 5
    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(len(points) - 1)
    for bp, p in zip(sp.bezier_points, points):
        bp.co = Vector(p)
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    ob = bpy.data.objects.new('cable', cu)
    scene.collection.objects.link(ob)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    bpy.data.objects.remove(ob)
    bm = bmesh.new()
    bm.from_mesh(me)
    bpy.data.meshes.remove(me)
    PARTS.append((bm, Matrix.Identity(4), mat, False))


def build_cables(ends):
    r = L['riser']
    half = math.ceil(L['total'] / 2)
    distro = Vector((-6.15, 0, -0.35))
    box(0.46, 0.32, 0.34, T(distro.x, 0.16, distro.z) @ RY(0.6), 'black', r=0.02, segs=1, drop_bottom=True)
    for i, e in enumerate(ends):
        p = L['stations'][i]
        th = p['th']
        jitter = ((i * 37) % 7 - 3) * 0.035
        if not p['back']:
            rr = r['r1'] - 0.22 - (i % 5) * 0.045
            pts = [(e.x, 0.016, e.z)]
            pts.append((math.sin(th) * (rr - 0.25), 0.016, C.z - math.cos(th) * (rr - 0.25) + jitter))
            a = th
            while a > r['a0'] + 0.08:
                a -= 0.22
                pts.append((math.sin(a) * rr, 0.016, C.z - math.cos(a) * rr))
            pts.append((distro.x + 0.25, 0.016, distro.z + 0.2))
            cable(pts)
        else:
            y = r['top'] + 0.016
            pts = [(e.x, y, e.z), (math.sin(th) * (r['r2'] - 0.2), y, C.z - math.cos(th) * (r['r2'] - 0.2) + jitter)]
            pts.append((math.sin(th) * (r['r2'] + 0.12), 0.2, C.z - math.cos(th) * (r['r2'] + 0.12)))
            pts.append((math.sin(th) * (r['r2'] + 0.6), 0.016, C.z - math.cos(th) * (r['r2'] + 0.6)))
            pts.append((math.sin(th * 0.6) * (r['r2'] + 2.4), 0.016, C.z - math.cos(th * 0.6) * (r['r2'] + 2.4)))
            cable(pts)
    # the director's monitor feed: down the desk leg and across to the DIT corner, taped down
    d = L['desk']
    run = [(-1.15, 0.7, d['z'] - 0.42), (-1.2, 0.05, d['z'] - 0.5), (-1.6, 0.016, d['z'] - 0.9), (-3.0, 0.016, d['z'] - 1.4), (-4.6, 0.016, d['z'] - 2.2), (distro.x + 0.3, 0.016, distro.z + 0.3)]
    cable(run, 0.018)
    for (x, z, a) in ((-2.3, d['z'] - 1.18, 0.25), (-3.8, d['z'] - 1.8, 0.45)):
        box(0.07, 0.004, 0.2, T(x, 0.034, z) @ RY(a), 'tapew')
    # the dolly's cable: from the distro to the track's far end
    dl = L['dolly']
    cable([(distro.x - 0.2, 0.016, distro.z + 0.15), (dl['x'] + 0.6, 0.016, dl['z1'] + 0.6), (dl['x'] + 0.55, 0.016, (dl['z0'] + dl['z1']) / 2), (dl['x'] + 0.5, 0.016, dl['z0'] - 0.3)], 0.014)


def build_throne():
    th = L['throne']
    M = T(th['x'], 0, th['z']) @ RY(th['ry'])
    h = th['step']
    for k in range(th['steps']):
        w, d, zc = 3.6 - 0.4 * k, 2.6 - 0.4 * k, -0.2 * k
        box(w, h, d, M @ T(0, h * k + h / 2, zc), 'black', r=0.012, segs=1, drop_bottom=(k == 0))
        box(w - 0.14, 0.022, 0.022, M @ T(0, h * k + h - 0.03, zc + d / 2 + 0.006), 'violet')
    y0 = h * th['steps']
    box(1.1, 0.5, 0.9, M @ T(0, y0 + 0.25, -0.65), 'black', r=0.03, segs=1)
    box(1.2, 2.7, 0.18, M @ T(0, y0 + 1.35, -1.08), 'black', r=0.03, segs=1)
    for x, sh in ((-0.42, 0.5), (0.0, 0.85), (0.42, 0.5)):
        cyl(0.0, 0.11, sh, M @ T(x, y0 + 2.7 + sh / 2, -1.08), 'black', 8)
    for sx in (-1, 1):
        box(0.16, 0.12, 0.95, M @ T(sx * 0.62, y0 + 0.67, -0.62), 'black', r=0.02, segs=1)
        box(0.14, 0.42, 0.14, M @ T(sx * 0.62, y0 + 0.4, -0.25), 'dark', r=0.02, segs=1)
        cyl(0.0, 0.06, 0.2, M @ T(sx * 0.62, y0 + 0.67, -0.05) @ RX(math.pi / 2), 'dark', 6)
        box(0.12, 1.9, 0.3, M @ T(sx * 0.72, y0 + 2.0, -1.06) @ RZ(-sx * 0.22), 'black', r=0.02, segs=1)
    box(0.045, 2.2, 0.02, M @ T(0, y0 + 1.6, -0.985), 'violet')


def build_lab():
    lb = L['lab']
    M = T(lb['x'], 0, lb['z']) @ RY(lb['ry'])
    box(1.9, 0.06, 0.8, M @ T(0, 0.9, 0), 'white', r=0.015, segs=1)
    box(1.8, 0.03, 0.7, M @ T(0, 0.26, 0), 'white')
    for sx in (-1, 1):
        for sz in (-1, 1):
            box(0.05, 0.87, 0.05, M @ T(sx * 0.88, 0.435, sz * 0.34), 'steel', drop_bottom=True)
    box(0.18, 0.1, 0.14, M @ T(0.72, 0.98, 0.26), 'dark', r=0.01, segs=1)
    box(0.04, 0.08, 0.16, M @ T(0.84, 0.99, 0.26), 'steel')
    box(0.52, 0.24, 0.26, M @ T(-0.55, 1.05, -0.16), 'black', r=0.015, segs=1)
    h0 = (M @ Vector((-0.75, 1.17, -0.16, 1))).to_3d()
    h1 = (M @ Vector((-0.35, 1.17, -0.16, 1))).to_3d()
    rod(h0, h1, 0.012, 'steel', 6)
    box(0.42, 0.035, 0.3, M @ T(0.1, 0.95, 0.12), 'steel', r=0.008, segs=1)
    # an arm lamp over the bench
    b = (M @ Vector((-0.86, 0.93, -0.3, 1))).to_3d()
    e = (M @ Vector((-0.7, 1.65, -0.2, 1))).to_3d()
    f = (M @ Vector((-0.2, 1.55, 0.05, 1))).to_3d()
    cyl(0.08, 0.08, 0.04, T(*b), 'dark', 14)
    rod(b, e, 0.014, 'dark', 6)
    rod(e, f, 0.014, 'dark', 6)
    cyl(0.04, 0.12, 0.14, T(*f) @ T(0, -0.06, 0), 'dark', 14)
    # the robot's assembly stand (world position from the layout, the live robot clamps onto it)
    rb = lb['robot']
    S = T(rb['x'], 0, rb['z']) @ RY(lb['ry'])
    cyl(0.36, 0.36, 0.04, S @ T(0, 0.02, 0), 'dark', 20)
    cyl(0.035, 0.035, 1.12, S @ T(0, 0.6, 0), 'steel', 10)
    cyl(0.1, 0.1, 0.07, S @ T(0, 1.18, 0), 'dark', 14)
    rod((S @ Vector((0, 1.05, 0, 1))).to_3d(), (S @ Vector((0, 1.05, -0.35, 1))).to_3d(), 0.02, 'steel', 6)
    box(0.7, 0.003, 0.7, S @ T(0, 0.0015, 0), 'tapew')


def build_set():
    build_riser()
    ends = [station(i, p) for i, p in enumerate(L['stations'])]
    build_desk()
    for s in L['softboxes']:
        build_softbox(s)
    build_dolly_track()
    build_flat()
    build_cstand(-4.9, 6.9, 2.4)
    build_cstand(-9.5, 1.3, 1.9, 2.3)
    build_apple_boxes(-2.15, 4.25, 0.35)
    build_throne()
    build_lab()
    build_road_case(-10.9, -6.6, 0.9)
    build_road_case(-10.4, -7.6, 0.7, 0.7, 0.5, 0.5)
    build_road_case(8.7, 2.8, -0.5)
    build_craft()
    build_cables(ends)
    return ends


def join_parts():
    """Every part into one mesh, outward normals asserted per closed solid."""
    bm_all = bmesh.new()
    bad = 0
    for bm, M, mat, closed in PARTS:
        bm.transform(M)
        if closed:
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
            vol = bm.calc_volume(signed=True)
            if vol < 0:
                bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
                vol = bm.calc_volume(signed=True)
            if vol <= 0:
                bad += 1
        for f in bm.faces:
            f.material_index = MAT_INDEX[mat]
        me = bpy.data.meshes.new('tmp')
        bm.to_mesh(me)
        bm.free()
        bm_all.from_mesh(me)
        bpy.data.meshes.remove(me)
    if bad:
        fail(f'{bad} closed parts have inward normals')
    me = bpy.data.meshes.new('props')
    bm_all.to_mesh(me)
    bm_all.free()
    ob = bpy.data.objects.new('props', me)
    scene.collection.objects.link(ob)
    for m in MAT_ORDER:
        me.materials.append(m)
    return ob


# ---------------------------------------------------------------- light: the same key the live crew is lit by
def area(name, loc, target, size, power, shape='SQUARE', color=(1, 1, 1)):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.shape = shape
    ld.size = size
    ld.energy = power
    ld.color = color
    ob = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(ob)
    ob.location = Vector(loc)
    look_at(ob, target)
    return ob


def light_set():
    k = L['key']
    area('key', (k['x'], k['y'], k['z']), (0, 0, 1.5), 7.0, 9000)
    area('fill', (8, 9, 10), (0, 0, 0), 9.0, 2600)
    area('top', (0, 11, -1), (0, 0, -1), 12.0, 4200)
    for s in L['softboxes']:
        M = T(s['x'], 0, s['z']) @ RY(s['ry'])
        p = (M @ Vector((0, 2.7, 0.23, 1))).to_3d()
        tgt = (M @ Vector((0, 1.2, 3.0, 1))).to_3d()
        area('soft', p, tgt, 1.0, 380)
    th = L['throne']
    M = T(th['x'], 0, th['z']) @ RY(th['ry'])
    area('monarch', (M @ Vector((0, 0.9, -1.75, 1))).to_3d(), (M @ Vector((0, 4.2, -5.5, 1))).to_3d(), 2.4, 1400, color=(0.56, 0.4, 1.0))
    area('monarch_floor', (M @ Vector((0, 4.2, 1.6, 1))).to_3d(), (M @ Vector((0, 0.8, -0.6, 1))).to_3d(), 1.2, 160, color=(0.6, 0.45, 1.0))
    w = bpy.data.worlds.new('studio')
    scene.world = w
    w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs[0].default_value = (1, 1, 1, 1)
    bg.inputs[1].default_value = 0.72


def cycles(samples):
    scene.render.engine = 'CYCLES'
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'METAL'
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        scene.cycles.device = 'GPU'
    except Exception as e:  # CPU is fine, just slower
        log('GPU unavailable, CPU bake', e)
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 6
    scene.cycles.diffuse_bounces = 4
    scene.cycles.glossy_bounces = 0
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = EXPOSURE
    scene.view_settings.gamma = 1.0


def look_at(ob, target):
    """Point an object's -Z at target with +Y up (the world here is Y up)."""
    f = (Vector(target) - ob.location).normalized()
    r = f.cross(Vector((0, 1, 0))).normalized()
    u = r.cross(f)
    m = Matrix((r, u, -f)).transposed()
    ob.rotation_euler = m.to_euler()


def preview(path):
    cam = bpy.data.cameras.new('cam')
    cam.sensor_fit = 'VERTICAL'
    cam.angle = math.radians(42)
    ob = bpy.data.objects.new('cam', cam)
    scene.collection.objects.link(ob)
    ob.location = Vector((0, 4.69, 12.31))
    look_at(ob, (0, 1.6, 0.2))
    scene.camera = ob
    scene.render.resolution_x, scene.render.resolution_y = 1280, 800
    scene.render.resolution_percentage = 75
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    log('preview ->', path)


def bake(ob, mats, name, size):
    img = bpy.data.images.new(name, size, size, float_buffer=True, alpha=False)
    for m in mats:
        n = m.node_tree.nodes.new('ShaderNodeTexImage')
        n.image = img
        m.node_tree.nodes.active = n
    for o in scene.objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    t0 = time.time()
    bpy.ops.object.bake(type='COMBINED', pass_filter={'DIRECT', 'INDIRECT', 'DIFFUSE', 'EMIT'}, margin=8, margin_type='EXTEND', use_clear=True)
    secs = time.time() - t0
    px = list(img.pixels)
    lum = [0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2] for i in range(0, len(px), 4 * 97)]
    mean = sum(lum) / len(lum)
    lo = sorted(lum)[len(lum) // 20]
    log(f'baked {name}: {size}px in {secs:.0f}s, mean {mean:.3f}, p5 {lo:.3f}')
    if mean < 0.08:
        fail(f'{name} bake is black (mean {mean:.3f})')
    if lo > 0.995:
        fail(f'{name} bake has no shading at all (p5 {lo:.3f})')
    scene.render.image_settings.file_format = 'WEBP'
    scene.render.image_settings.quality = 90
    scene.render.image_settings.color_mode = 'RGB'
    path = os.path.join(OUT, f'{name}.webp')
    img.save_render(path, scene=scene)
    return {'file': f'{name}.webp', 'size': size, 'seconds': round(secs), 'mean': round(mean, 3)}


def uv_unwrap(ob):
    for o in scene.objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.004, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')


# ---------------------------------------------------------------- export: geometry and UVs only, three.js frame as built
def export(objs, textures, extra):
    blob = bytearray()
    meshes = []

    def align():
        while len(blob) % 4:
            blob.append(0)

    for ob, tex in objs:
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        bm.transform(ob.matrix_world)
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
        uvl = bm.loops.layers.uv.active
        seen, pos, uvs, idx = {}, [], [], []
        for f in bm.faces:
            for lp in f.loops:
                u = lp[uvl].uv
                key = (lp.vert.index, round(u.x * 65535), round(u.y * 65535))
                k = seen.get(key)
                if k is None:
                    k = seen[key] = len(pos)
                    pos.append(lp.vert.co.copy())
                    uvs.append((min(max(u.x, 0), 1), min(max(u.y, 0), 1)))
                idx.append(k)
        bm.free()
        lo = Vector((min(p.x for p in pos), min(p.y for p in pos), min(p.z for p in pos)))
        hi = Vector((max(p.x for p in pos), max(p.y for p in pos), max(p.z for p in pos)))
        center = (lo + hi) / 2
        half = Vector((max((hi.x - lo.x) / 2, 1e-4), max((hi.y - lo.y) / 2, 1e-4), max((hi.z - lo.z) / 2, 1e-4)))
        align()
        po = len(blob)
        for p in pos:
            blob += struct.pack('<3h', *(max(-32767, min(32767, round((p[a] - center[a]) / half[a] * 32767))) for a in range(3)))
        align()
        uo = len(blob)
        for u, v in uvs:
            blob += struct.pack('<2H', round(u * 65535), round(v * 65535))
        align()
        io = len(blob)
        wide = len(pos) > 65535
        blob += struct.pack(f'<{len(idx)}{"I" if wide else "H"}', *idx)
        meshes.append({'name': ob.name, 'texture': tex, 'vertices': len(pos), 'indices': len(idx), 'indexType': 'u32' if wide else 'u16', 'position': po, 'uv': uo, 'index': io, 'center': list(center), 'half': list(half)})
        log(f'export {ob.name}: {len(pos)} verts, {len(idx) // 3} tris')
    with open(os.path.join(OUT, 'set.bin'), 'wb') as fh:
        fh.write(blob)
    manifest = {
        'version': 1,
        'builtAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'builtWith': f'Blender {bpy.app.version_string}, Cycles {SAMPLES} samples',
        'stations': L['total'],
        'ids': L['ids'],
        'bin': {'file': 'set.bin', 'bytes': len(blob)},
        'textures': textures,
        'meshes': meshes,
        **extra,
    }
    with open(os.path.join(OUT, 'set.json'), 'w') as fh:
        json.dump(manifest, fh, indent=2)
        fh.write('\n')
    return manifest


# ---------------------------------------------------------------- run
if L['total'] != len(L['stations']) or L['total'] != len(L.get('ids', [])):
    fail('layout.json was not written by dump-layout.mjs for this crew')
os.makedirs(OUT, exist_ok=True)
cyc = build_cyc()
ends = build_set()
if len(ends) != L['total']:
    fail(f'built {len(ends)} pedestals for {L["total"]} stations')
props = join_parts()
light_set()
cycles(SAMPLES if not PREVIEW else min(SAMPLES, 96))
if PREVIEW:
    preview(PREVIEW)
    sys.exit(0)
uv_unwrap(props)
tex = {'cyc': bake(cyc, [CYC], 'cyc', SIZE), 'props': bake(props, MAT_ORDER, 'props', SIZE)}
man = export([(cyc, 'cyc'), (props, 'props')], tex, {'exposure': EXPOSURE})
budget = {'set.bin': 1_400_000, 'cyc.webp': 900_000, 'props.webp': 1_200_000}
for f, cap in budget.items():
    n = os.path.getsize(os.path.join(OUT, f))
    log(f'{f}: {n} bytes (cap {cap})')
    if n > cap:
        fail(f'{f} is {n} bytes, over the {cap} budget')
log('SET_OK', json.dumps({k: man[k] for k in ('stations', 'bin', 'textures')}))
