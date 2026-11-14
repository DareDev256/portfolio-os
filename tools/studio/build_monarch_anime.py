"""build_monarch_anime.py: the anime Monarch for the throne (4.73.0), from Tripo's rigged P2 model.

Run headless (no screen taken):
    /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python-exit-code 1 \
        -P tools/studio/build_monarch_anime.py -- <rigged.glb> <texture.png> [--out=DIR]

Inputs (kept outside the repo; they are Tripo outputs, not sources):
    rigged.glb   Tripo P2 multiview model (front/left/back design sheet) after Tripo's auto-rig
                 (rig-check biped, rig v3.0-20260909, spec tripo): 78 bones, faces +X, about 1 m.
    texture.png  its base colour with the Black Cat soles (tools/studio/blackcat_texture.py).

What it does, in order (each step was first done live in Blender over MCP, 2026-11-14):
    1. scale to 1.85 m and face -Y (glTF imports use QUATERNION rotation mode: set XYZ first);
    2. weight fixes: coat texels the auto-rig glued to the finger bones (away from the cuff) go to
       the thigh and waist; the lower front coat follows the thighs, so it lies on the lap;
    3. the seated pose (the aim() approach of build_monarch.py), fingers curled;
    4. the pose becomes the rest pose; coat points below the seat are laid on it;
    5. a bone per braid strand (each strand is its own mesh island), parented to the head;
    6. placed in the Monarch's frame (seat y = 0, calves just clear of the seat edge) and exported
       as glTF with a separate .bin and .webp, so the site CSP (no blob: images) can load it.
Refuses if a bone it needs is missing or the soles do not land on the dais.
"""
import bpy, json, math, os, sys
from mathutils import Vector, Matrix

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if len(ARGS) < 2:
    raise SystemExit('usage: -- <rigged.glb> <texture.png> [--out=DIR]')
GLB, TEX = ARGS[0], ARGS[1]
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = next((a.split('=', 1)[1] for a in ARGS if a.startswith('--out=')), os.path.join(ROOT, 'public', 'assets', 'studio'))
def refuse(msg):
    print(f'build_monarch_anime: REFUSED: {msg}'); raise SystemExit(1)
bpy.ops.wm.read_factory_settings(use_empty=True)

import bpy, math
from mathutils import Vector, Matrix

for n in ('monarch_rig', 'monarch_p2', 'tripo_rigged', 'Icosphere'):
    o = bpy.data.objects.get(n)
    if o:
        for c in list(o.children_recursive): bpy.data.objects.remove(c, do_unlink=True)
        bpy.data.objects.remove(o, do_unlink=True)
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=GLB)
new = [o for o in bpy.data.objects if o not in before]
arm = next(o for o in new if o.type == 'ARMATURE')
mesh = max((o for o in new if o.type == 'MESH'), key=lambda o: len(o.data.polygons))
for o in new:
    if o not in (arm, mesh): bpy.data.objects.remove(o, do_unlink=True)
arm.name, mesh.name = 'monarch_rig', 'monarch_p2'
mw = arm.matrix_world.copy(); arm.parent = None; arm.matrix_world = mw
bpy.context.view_layer.update()
zs = [(mesh.matrix_world @ v.co).z for v in mesh.data.vertices]
S = 1.85 / (max(zs) - min(zs))
arm.rotation_mode = 'XYZ'; arm.rotation_euler = (0, 0, -math.pi / 2); arm.scale = (S, S, S); arm.location = (0, 0, 0)
bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True); mesh.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.context.view_layer.update()

DUMP = next((a.split('=', 1)[1] for a in ARGS if a.startswith('--dump-shoe-uv=')), None)
if DUMP:  # the UV polygons of the shoes, for blackcat_texture.py, then stop
    _n = {g.index: g.name for g in mesh.vertex_groups}; _me = mesh.data; _uv = _me.uv_layers.active.data
    _img = next(n.image for n in _me.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE' and any(l.to_socket.name == 'Base Color' for l in n.outputs[0].links))
    _foot = lambda i: bool(_me.vertices[i].groups) and any(k in _n[max(_me.vertices[i].groups, key=lambda g: g.weight).group] for k in ('Foot', 'ToeBase'))
    polys = [[list(_uv[li].uv) for li in p.loop_indices] for p in _me.polygons if sum(_foot(i) for i in p.vertices) * 2 >= len(p.vertices)]
    json.dump({'size': list(_img.size), 'polys': polys}, open(DUMP, 'w'))
    print(f'build_monarch_anime: {len(polys)} shoe polygons -> {DUMP}'); raise SystemExit(0)

# ---- weight fixes, in the rest pose
me = mesh.data; bones = arm.data.bones
names = {g.index: g.name for g in mesh.vertex_groups}
img = next(n.image for n in me.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE' and any(l.to_socket.name == 'Base Color' for l in n.outputs[0].links))
W, H = img.size; px = img.pixels[:]
uv = me.uv_layers.active.data; vuv = {}
for l in me.loops: vuv.setdefault(l.vertex_index, uv[l.index].uv.copy())
def skin(i):
    u, v = vuv[i]; x = min(W - 1, max(0, int((u % 1) * W))); y = min(H - 1, max(0, int((v % 1) * H)))
    r, g, b = px[(y * W + x) * 4:(y * W + x) * 4 + 3]
    return r > g * 1.15 and r > b * 1.2 and (0.2126 * r + 0.7152 * g + 0.0722 * b) > 0.06
FING = ('Hand', 'Thumb', 'Index', 'Mid', 'Ring', 'Pinky')
wrist = {s: bones[f'{s}_Hand'].head_local.copy() for s in 'LR'}
freed = 0
for v in me.vertices:
    fw = [(g.group, g.weight) for g in v.groups if names[g.group].startswith(('L_', 'R_')) and any(f in names[g.group] for f in FING)]
    if not fw or skin(v.index): continue
    side = 'L' if v.co.x > 0 else 'R'
    if (v.co - wrist[side]).length < 0.05: continue  # the cuff
    tot = sum(w for _, w in fw)
    for gi, _ in fw: mesh.vertex_groups[names[gi]].remove([v.index])
    mesh.vertex_groups[f'{side}_Thigh'].add([v.index], tot * 0.65, 'ADD')
    mesh.vertex_groups['Waist'].add([v.index], tot * 0.35, 'ADD')
    freed += 1
hipz = bones['L_Thigh'].head_local.z
TRUNK = ('Waist', 'Pelvis', 'Hip', 'Spine01')
def ss(a, b, x):
    t = min(1, max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
lap = 0
for v in me.vertices:
    if v.co.z > hipz - 0.06: continue
    ws = {names[g.group]: g.weight for g in v.groups}
    trunk = sum(w for n, w in ws.items() if n in TRUNK)
    if trunk < 0.15: continue
    side = 'L' if v.co.x > 0 else 'R'; f = ss(hipz - 0.06, hipz - 0.22, v.co.z)
    for n in TRUNK:
        if n in ws: mesh.vertex_groups[n].add([v.index], ws[n] * (1 - f), 'REPLACE')
    mesh.vertex_groups[f'{side}_Thigh'].add([v.index], ws.get(f'{side}_Thigh', 0) + trunk * f, 'REPLACE')
    lap += 1

# ---- the seated pose
pb = arm.pose.bones
def upd(): bpy.context.view_layer.update()
def aim(name, d):
    upd(); m = pb[name].matrix.copy()
    q = m.to_3x3().col[1].normalized().rotation_difference(Vector(d).normalized())
    loc = m.to_translation()
    pb[name].matrix = Matrix.Translation(loc) @ q.to_matrix().to_4x4() @ Matrix.Translation(-loc) @ m
    upd()
def head(n): upd(); return pb[n].head.copy()
import os
THIGH_UP = -0.14  # seat-to-sole 0.50, the throne's dais
for s, sx in (('L', 1), ('R', -1)):
    aim(f'{s}_Thigh', (sx * 0.2, -1.0, THIGH_UP))
    aim(f'{s}_Calf', (sx * 0.05, -0.1, -1.0))
    aim(f'{s}_Foot', (sx * 0.1, -0.85, -0.5))
aim('Waist', (0, -0.15, 1)); aim('Spine01', (0, -0.3, 1)); aim('Spine02', (0, -0.45, 1))
aim('NeckTwist01', (0, -0.3, 1))
knee = {s: head(f'{s}_Calf') for s in 'LR'}
mid = (knee['L'] + knee['R']) / 2 + Vector((0, -0.07, -0.03))
for s, sx in (('L', 1), ('R', -1)):
    aim(f'{s}_Upperarm', knee[s] + Vector((-sx * 0.035, 0.13, 0.085)) - head(f'{s}_Upperarm'))
    fore = mid + Vector((sx * 0.055, 0, 0)) - head(f'{s}_Forearm')
    aim(f'{s}_Forearm', fore)
    aim(f'{s}_Hand', fore.normalized() + Vector((0, 0, -0.55)))
for s in 'LR':
    for f in ('Index', 'Mid', 'Ring', 'Pinky'):
        for i, a in ((1, 0.55), (2, 0.75), (3, 0.6)):
            b = pb[f'{s}_{f}{i}']; b.rotation_mode = 'XYZ'; b.rotation_euler = (a, 0, 0)
    for i, a in ((2, 0.35), (3, 0.4)):
        b = pb[f'{s}_Thumb{i}']; b.rotation_mode = 'XYZ'; b.rotation_euler = (a, 0, 0)
upd()

for need in ('Head', 'L_Eye', 'R_Eye', 'Hip', 'Spine02', 'L_Thigh', 'R_Thigh', 'L_Calf', 'R_Calf'):
    if need not in arm.data.bones: refuse(f'bone {need} missing')
names = {g.index: g.name for g in mesh.vertex_groups}

# ---- 4. the pose becomes the rest pose; the coat below the seat lies on it
dg = bpy.context.evaluated_depsgraph_get(); pm = mesh.evaluated_get(dg).to_mesh()
SEAT = min(pm.vertices[v.index].co.z for v in me.vertices if v.groups and names[max(v.groups, key=lambda g: g.weight).group] in ('Pelvis', 'Hip'))
mesh.evaluated_get(dg).to_mesh_clear()
bpy.ops.object.select_all(action='DESELECT'); mesh.select_set(True); bpy.context.view_layer.objects.active = mesh
bpy.ops.object.modifier_apply(modifier=next(m for m in mesh.modifiers if m.type == 'ARMATURE').name)
bpy.ops.object.select_all(action='DESELECT'); arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.select_all(action='SELECT'); bpy.ops.pose.armature_apply(selected=False); bpy.ops.object.mode_set(mode='OBJECT')
mesh.modifiers.new('Armature', 'ARMATURE').object = arm
lt = arm.data.bones['L_Thigh'].head_local.copy()
for v in me.vertices:
    if v.co.z >= SEAT + 0.006 or v.co.y < lt.y - 0.30: continue
    if v.groups and any(k in names[max(v.groups, key=lambda g: g.weight).group] for k in ('Calf', 'Foot', 'ToeBase', 'Knee')): continue
    below = SEAT + 0.006 - v.co.z
    out = Vector((v.co.x, v.co.y - lt.y, 0)); out = out.normalized() if out.length > 1e-4 else Vector((0, 1, 0))
    v.co.z = SEAT + 0.006; v.co += out * below * 0.9
me.update()

# ---- 5. a bone per braid strand: islands that hang from head height past the jaw, narrow in x
import bmesh
bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
seen, comps = set(), []
for v in bm.verts:
    if v.index in seen: continue
    stack, comp = [v], []; seen.add(v.index)
    while stack:
        x = stack.pop(); comp.append(x.index)
        for e in x.link_edges:
            o = e.other_vert(x)
            if o.index not in seen: seen.add(o.index); stack.append(o)
    comps.append(comp)
bm.free()
hz = arm.data.bones['Head'].head_local.z
braids = []
for c in comps:
    zs = [me.vertices[i].co.z for i in c]; xs = [me.vertices[i].co.x for i in c]
    if len(c) >= 10 and max(zs) > hz - 0.155 and min(zs) < hz - 0.095 and (max(zs) - min(zs)) > 0.08 and (max(xs) - min(xs)) < 0.09:
        braids.append(c)
if len(braids) < 10: refuse(f'found {len(braids)} braid strands, expected about 15')
bpy.ops.object.select_all(action='DESELECT'); arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT'); eb = arm.data.edit_bones; specs = []
for k, c in enumerate(braids):
    pts = [me.vertices[i].co.copy() for i in c]; zs = sorted(p.z for p in pts)
    top = [p for p in pts if p.z > zs[-1] - 0.025]; bot = [p for p in pts if p.z < zs[0] + 0.025]
    h = sum(top, Vector()) / len(top); t = sum(bot, Vector()) / len(bot)
    if (t - h).length < 0.03: t = h + Vector((0, 0, -0.05))
    b = eb.new(f'Braid_{k:02d}'); b.head = h; b.tail = t; b.parent = eb['Head']; specs.append((b.name, c))
bpy.ops.object.mode_set(mode='OBJECT')
for name, c in specs:
    g = mesh.vertex_groups.new(name=name)
    for i in c:
        for vg in list(me.vertices[i].groups): mesh.vertex_groups[vg.group].remove([i])
        g.add([i], 1.0, 'REPLACE')

# ---- the Black Cat texture
node = next(n for n in me.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE' and any(l.to_socket.name == 'Base Color' for l in n.outputs[0].links))
img = bpy.data.images.load(TEX); img.name = 'monarch-anime'; node.image = img

# ---- 6. place in the Monarch's frame and export
names = {g.index: g.name for g in mesh.vertex_groups}
hip = arm.data.bones['Hip'].head_local.copy()
calf = [v.co for v in me.vertices if v.groups and 'Calf' in names[max(v.groups, key=lambda g: g.weight).group] and v.co.z < SEAT - 0.12]
SEAT_FRONT_Z = 0.42
dz = (SEAT_FRONT_Z + 0.025) + max(c.y for c in calf)
arm.location = Vector((-hip.x, -dz, -SEAT))
bpy.ops.object.select_all(action='DESELECT'); arm.select_set(True); mesh.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
sole = min((mesh.matrix_world @ v.co).z for v in me.vertices)
if not (-0.535 <= sole <= -0.465): refuse(f'soles at {sole:.3f}, the dais is at -0.5')
os.makedirs(OUT, exist_ok=True)
path = os.path.join(OUT, 'monarch-anime.gltf')
bpy.ops.export_scene.gltf(filepath=path, use_selection=True, export_format='GLTF_SEPARATE', export_skins=True, export_animations=False, export_yup=True, export_image_format='WEBP', export_image_quality=85)
g = json.load(open(path))
for im in g.get('images', []):
    src = os.path.join(OUT, im['uri']); im['uri'] = 'monarch-anime.webp'
    if os.path.abspath(src) != os.path.join(os.path.abspath(OUT), 'monarch-anime.webp'): os.replace(src, os.path.join(OUT, 'monarch-anime.webp'))
json.dump(g, open(path, 'w'), separators=(',', ':'))
print(f'build_monarch_anime: {len(braids)} braid bones, seat {SEAT:.3f}, soles {sole:.3f}, wrote {path}')
