import bpy, sys

args = sys.argv[sys.argv.index("--")+1:]
img_path = args[0]
out_glb = args[1] if len(args)>1 else "out.glb"
size_m  = float(args[2]) if len(args)>2 else 2.0   # plane size in meters
uv_rep  = float(args[3]) if len(args)>3 else 4.0   # how many repeats across plane

# Clean
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Plane
bpy.ops.mesh.primitive_plane_add(size=size_m)
plane = bpy.context.active_object

# UV unwrap and tile
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.uv.unwrap(method='ANGLE_BASED'); bpy.ops.object.mode_set(mode='OBJECT')
uv = plane.data.uv_layers.active
for loop in uv.data:
    loop.uv[0] *= uv_rep
    loop.uv[1] *= uv_rep

# Material with texture
mat = bpy.data.materials.new("Wood")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
tex = nodes.new('ShaderNodeTexImage')
tex.image = bpy.data.images.load(img_path)
bsdf = nodes["Principled BSDF"]
links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
plane.data.materials.append(mat)

# Export GLB
bpy.ops.export_scene.gltf(
    filepath=out_glb,
    export_format='GLB',
    export_yup=True,
    export_texcoords=True,
    export_normals=True,
    export_materials='EXPORT',
    export_image_format='AUTO'
)
