// scripts/make_ar.mjs
// Usage: node scripts/make_ar.mjs <SKU> <imagePath> [planeMeters=2] [uvRepeat=4]
// Example: node scripts/make_ar.mjs LHF-A-047 ./textures/LHF-A-047.jpg 2 4

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { put } from "@vercel/blob";

const [ , , SKU, IMAGE, PLANE = "2", UV = "4" ] = process.argv;
if (!SKU || !IMAGE) {
  console.error("Usage: node scripts/make_ar.mjs <SKU> <imagePath> [planeMeters=2] [uvRepeat=4]");
  process.exit(1);
}

const dist = path.resolve("dist");
fs.mkdirSync(dist, { recursive: true });
const glbOut  = path.join(dist, `${SKU}.glb`);
const usdcOut = path.join(dist, `${SKU}.usdc`);
const usdzOut = path.join(dist, `${SKU}.usdz`);

const blenderPath = process.env.BLENDER_PATH
  || "/Applications/Blender.app/Contents/MacOS/Blender"; // macOS default; set BLENDER_PATH on Windows/Linux

// -------------- Write the Blender helper to a temp file --------------
const tmpPy = path.join(os.tmpdir(), `make_plane_${Date.now()}.py`);
fs.writeFileSync(tmpPy, `
import bpy, sys, os
args = sys.argv[sys.argv.index("--")+1:]
img_path = args[0]; out_glb = args[1]; size_m=float(args[2]); uv_rep=float(args[3])
os.makedirs(os.path.dirname(out_glb), exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.ops.mesh.primitive_plane_add(size=size_m); plane=bpy.context.active_object
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.uv.unwrap(method='ANGLE_BASED'); bpy.ops.object.mode_set(mode='OBJECT')
uv = plane.data.uv_layers.active
for l in uv.data: l.uv[0]*=uv_rep; l.uv[1]*=uv_rep
mat=bpy.data.materials.new("Wood"); mat.use_nodes=True
nodes=mat.node_tree.nodes; links=mat.node_tree.links
tex=nodes.new('ShaderNodeTexImage'); tex.image=bpy.data.images.load(img_path)
bsdf=nodes["Principled BSDF"]; links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
plane.data.materials.append(mat)
bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB', export_yup=True,
                          export_texcoords=True, export_normals=True,
                          export_materials='EXPORT', export_image_format='AUTO')
print("WROTE_GLB", out_glb)
`);

// -------------- Step 1: make GLB with Blender -----------------------
function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }

if (!exists(IMAGE)) {
  console.error(`Image not found: ${IMAGE}`);
  process.exit(1);
}

const blenderArgs = ["-b", "-P", tmpPy, "--", path.resolve(IMAGE), glbOut, String(PLANE), String(UV)];
const blender = spawnSync(blenderPath, blenderArgs, { stdio: "inherit" });
if (blender.status !== 0 || !exists(glbOut)) {
  console.error("Blender failed. Tip: set BLENDER_PATH to your Blender binary.");
  process.exit(1);
}

// -------------- Step 2: make USDZ (prefer USD tools; fallback to xcrun) --------------
function which(bin) {
  const r = spawnSync(process.platform === "win32" ? "where" : "which", [bin], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim().split(/\r?\n/)[0] : null;
}

let usdzMade = false;

// Try usd_from_gltf + usdzip
const usdFromGltf = which("usd_from_gltf");
const usdzip = which("usdzip");
if (usdFromGltf && usdzip) {
  console.log("Converting with usd_from_gltf / usdzip…");
  const a = spawnSync(usdFromGltf, [glbOut, usdcOut], { stdio: "inherit" });
  if (a.status === 0 && exists(usdcOut)) {
    const b = spawnSync(usdzip, ["-o", usdzOut, usdcOut], { stdio: "inherit" });
    if (b.status === 0 && exists(usdzOut)) usdzMade = true;
  }
}

// Fallback: xcrun usdz_converter (Xcode)
if (!usdzMade) {
  const xcrun = which("xcrun");
  if (xcrun) {
    console.log("Trying xcrun usdz_converter…");
    const c = spawnSync(xcrun, ["usdz_converter", glbOut, usdzOut], { stdio: "inherit" });
    if (c.status === 0 && exists(usdzOut)) usdzMade = true;
  }
}

if (!usdzMade) {
  console.warn("USDZ conversion not available on this machine. iOS AR will wait; Android AR works with GLB.");
}

// -------------- Step 3: upload to Vercel Blob -----------------------
const token = process.env.VERCEL_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
let glbUrl = null, usdzUrl = null, posterUrl = null;

if (token) {
  // poster from the input image
  const posterBuf = fs.readFileSync(IMAGE);
  const posterName = `images/${SKU}.jpg`;
  const glbBuf = fs.readFileSync(glbOut);

  const poster = await put(posterName, posterBuf, { access: "public", contentType: "image/jpeg", token });
  posterUrl = poster.url;

  const glbUp = await put(`models/${SKU}.glb`, glbBuf, { access: "public", contentType: "model/gltf-binary", token });
  glbUrl = glbUp.url;

  if (usdzMade) {
    const usdzBuf = fs.readFileSync(usdzOut);
    const usdzUp = await put(`models/${SKU}.usdz`, usdzBuf, { access: "public", contentType: "model/vnd.usdz+zip", token });
    usdzUrl = usdzUp.url;
  }
} else {
  console.warn("No VERCEL_BLOB_READ_WRITE_TOKEN found. Skipping upload; using local file paths.");
  glbUrl = glbOut;
  if (usdzMade) usdzUrl = usdzOut;
  posterUrl = IMAGE;
}

// -------------- Step 4: print results + SQL -------------------------
const result = { sku: SKU, glbUrl, usdzUrl, posterUrl, planeMeters: Number(PLANE), uvRepeat: Number(UV) };
console.log("\n=== AR ASSET RESULT ===");
console.log(JSON.stringify(result, null, 2));

console.log("\n-- Supabase SQL (paste this):");
console.log(`
alter table public.wood_profiles
  add column if not exists glb_url text,
  add column if not exists usdz_url text,
  add column if not exists poster_url text;

update public.wood_profiles
set glb_url   = '${glbUrl}',
    usdz_url  = ${usdzUrl ? `'${usdzUrl}'` : 'NULL'},
    poster_url= '${posterUrl}'
where id = '${SKU}' or sku = '${SKU}';
`.trim());

console.log("\nDone.");
