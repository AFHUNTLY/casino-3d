import bpy, mathutils
from pathlib import Path

SRC = '/root/casino-3d/assets_raw/sketchfab/lucky-wheel-low-poly-spinning-wheel/extracted/scene.gltf'
OUT_DIR = Path('/root/casino-3d/client/public/assets/models')
STAND_OUT = str(OUT_DIR / 'lucky-wheel-stand-edited.glb')
WHEEL_OUT = str(OUT_DIR / 'lucky-wheel-wheel-edited.glb')

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
bpy.ops.import_scene.gltf(filepath=SRC)

# Helpers
def has_ancestor(obj, name):
    p = obj.parent
    while p:
        if p.name == name:
            return True
        p = p.parent
    return False

def world_bbox(objs):
    pts = []
    for obj in objs:
        if obj.type != 'MESH':
            continue
        pts.extend([obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box])
    mn = mathutils.Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = mathutils.Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx, (mn + mx) / 2

mesh_objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
wheel_objs = [o for o in mesh_objs if has_ancestor(o, 'Cylinder_1')]
stand_objs = [o for o in mesh_objs if not has_ancestor(o, 'Cylinder_1')]
mn, mx, center = world_bbox(wheel_objs)
print('wheel center blender xyz', [round(v, 6) for v in center], 'bbox', [round(v, 6) for v in mn], [round(v, 6) for v in mx])

# Export fixed stand/pointer only. This asset keeps the original model coordinate frame.
bpy.ops.object.select_all(action='DESELECT')
for obj in stand_objs:
    obj.select_set(True)
bpy.context.view_layer.objects.active = stand_objs[0]
bpy.ops.export_scene.gltf(filepath=STAND_OUT, export_format='GLB', use_selection=True, export_apply=True)
print('exported stand', STAND_OUT, 'objects', [o.name for o in stand_objs])

# Export rotating wheel only. Bake geometry around origin=center, so PlayCanvas can spin it around local Z.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
bpy.ops.import_scene.gltf(filepath=SRC)
mesh_objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
wheel_objs = [o for o in mesh_objs if has_ancestor(o, 'Cylinder_1')]
# Detach to world, bake transforms, then move geometry center to world origin.
for obj in wheel_objs:
    obj.select_set(True)
bpy.context.view_layer.objects.active = wheel_objs[0]
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
# Delete non-wheel objects.
for obj in list(bpy.context.scene.objects):
    if obj.type == 'MESH' and obj not in wheel_objs:
        bpy.data.objects.remove(obj, do_unlink=True)
    elif obj.type != 'MESH' and obj.name != 'Camera' and obj.name != 'Light':
        # remove empties/parents from original hierarchy
        bpy.data.objects.remove(obj, do_unlink=True)
# Apply transforms then translate mesh objects so center is origin.
for obj in wheel_objs:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.location -= center
    obj.select_set(False)
# Export selected wheel meshes.
bpy.ops.object.select_all(action='DESELECT')
for obj in wheel_objs:
    obj.select_set(True)
bpy.context.view_layer.objects.active = wheel_objs[0]
bpy.ops.export_scene.gltf(filepath=WHEEL_OUT, export_format='GLB', use_selection=True, export_apply=True)
print('exported wheel', WHEEL_OUT, 'objects', [o.name for o in wheel_objs])
