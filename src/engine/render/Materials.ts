import {
  MeshStandardMaterial,
  ShaderChunk,
  Vector3,
  Vector4,
  type MeshStandardMaterialParameters,
} from 'three';
import { MAT, PALETTE_NAMES, VOXEL_PALETTE, hexToSrgb } from '../../art/palette';

/**
 * The voxel material (art bible §4–§6): a MeshStandardMaterial patched to read
 * the mesher's `voxel` attribute (palette index + baked AO level).
 *
 * - Base color comes from the palette uniform, never from a texture.
 * - Per-voxel jitter is recomputed per fragment from the voxel cell with an
 *   exact GLSL port of `hash3`/`jitteredLinear` (palette.ts), so the greedy
 *   mesher can merge faces and still every voxel gets its handmade wobble.
 * - Material flags (gloss / emissive / translucent / rough) set roughness,
 *   emissive pop and a fresnel rim per voxel.
 * - Baked per-vertex AO darkens the albedo; N8AO adds the screen-space layer.
 */

/** Uniform array length; the palette must fit (checked in tests). */
export const PALETTE_SIZE = 64;

export interface VoxelMaterialTuning {
  roughMatte: number;
  roughGloss: number;
  roughRough: number;
  emissive: number;
  /** Emissive strength of `MAT.glow` entries (lamps, lit windows). */
  glow: number;
  /** Self-light of `MAT.lit` entries (clouds, steam). */
  lit: number;
  rim: number;
  /** Wrap-lighting amount of `MAT.soft` entries (0 = Lambert). */
  wrap: number;
  /** Strength of the broad glaze sheen on `MAT.gloss` entries. */
  glaze: number;
  /** How far gloss voxels bend their shading normal toward the smooth normal. */
  smooth: number;
  /** 0 = no baked AO, 1 = AO level 0 is black. */
  aoStrength: number;
  /**
   * Crack closing: quads grow outward in their plane by this many view-depth
   * units (≈ 0.1 px at a 30° FOV and 1080p), hiding greedy-mesh T-junction slivers.
   */
  crackEps: number;
}

export const DEFAULT_TUNING: VoxelMaterialTuning = {
  roughMatte: 0.82,
  roughGloss: 0.22,
  roughRough: 0.96,
  emissive: 0.12,
  glow: 2.4,
  lit: 0.45,
  rim: 0.35,
  wrap: 0.45,
  glaze: 0.55,
  smooth: 0.75,
  aoStrength: 0.42,
  crackEps: 5e-5,
};

/** Per palette index: (sRGB r, g, b, jitter) and (roughness, emissive, rim, wrap). */
export function paletteUniforms(t: VoxelMaterialTuning = DEFAULT_TUNING): {
  colors: Vector4[];
  materials: Vector4[];
} {
  const colors = Array.from({ length: PALETTE_SIZE }, () => new Vector4());
  const materials = Array.from({ length: PALETTE_SIZE }, () => new Vector4(t.roughMatte, 0, 0, 0));
  PALETTE_NAMES.forEach((name, i) => {
    const e = VOXEL_PALETTE[name];
    const s = hexToSrgb(e.hex);
    colors[i + 1]?.set(s.r, s.g, s.b, e.jitter);
    const rough =
      e.mat & MAT.gloss ? t.roughGloss : e.mat & MAT.rough ? t.roughRough : t.roughMatte;
    materials[i + 1]?.set(
      rough,
      e.mat & MAT.glow ? t.glow : e.mat & MAT.lit ? t.lit : e.mat & MAT.emissive ? t.emissive : 0,
      e.mat & MAT.translucent ? t.rim : 0,
      e.mat & MAT.soft ? t.wrap : 0,
    );
  });
  return { colors, materials };
}

const VERTEX_PARS = /* glsl */ `
attribute vec2 voxel;
attribute vec3 snormal;
varying vec3 vSNormal;
uniform float uCrackEps;
uniform vec4 uPalette[${PALETTE_SIZE}];
uniform vec4 uVoxelMat[${PALETTE_SIZE}];
flat varying vec4 vPal;
flat varying vec4 vVoxelMat;
varying vec3 vCell;
varying float vAO;
`;

const VERTEX_MAIN = /* glsl */ `
#include <begin_vertex>
{
  int pi = int(voxel.x + 0.5);
  int packed = int(voxel.y + 0.5);
  vPal = uPalette[pi];
  vVoxelMat = uVoxelMat[pi];
  // Nudge inward from the face so floor() lands in the owning voxel.
  vCell = position - normal * 0.5;
  vAO = float(packed & 3) / 3.0;
  vec3 sn = snormal;
  #ifdef USE_INSTANCING
    sn = mat3(instanceMatrix) * sn;
  #endif
  vSNormal = normalMatrix * sn;

  // Grow the quad outward in its plane by a sub-pixel amount (T-junction cracks).
  vec3 an = abs(normal);
  vec3 axisU = an.x > 0.5 ? vec3(0.0, 1.0, 0.0) : an.y > 0.5 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 axisV = an.x > 0.5 ? vec3(0.0, 0.0, 1.0) : an.y > 0.5 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec2 corner = vec2((packed >> 2) & 1, (packed >> 3) & 1) * 2.0 - 1.0;
  mat4 crackMv = modelViewMatrix;
  #ifdef USE_INSTANCING
    crackMv = crackMv * instanceMatrix;
  #endif
  float depth = max(-(crackMv * vec4(position, 1.0)).z, 0.0);
  float eps = uCrackEps * depth / length(crackMv[0].xyz);
  transformed += (axisU * corner.x + axisV * corner.y) * eps;
}
`;

const FRAGMENT_PARS = /* glsl */ `
uniform float uAoStrength;
uniform float uSmooth;
varying vec3 vSNormal;
uniform vec3 uSssTint;
uniform float uGlaze;
flat varying vec4 vPal;
flat varying vec4 vVoxelMat;
varying vec3 vCell;
varying float vAO;

// Exact port of hash3() in src/art/palette.ts (uint math wraps like Math.imul).
float voxelHash(ivec3 p, uint seed) {
  uint h = uint(p.x) * 374761393u + uint(p.y) * 668265263u + uint(p.z) * 2147483647u
    + seed * 144269504u;
  h = (h ^ (h >> 13u)) * 1274126177u;
  h ^= h >> 16u;
  return float(h) / 4294967296.0;
}

vec3 voxelSrgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}
`;

const FRAGMENT_COLOR = /* glsl */ `
{
  // jitteredLinear(): ±value by the entry's amplitude, ±~2° hue as an r/b shift.
  ivec3 cell = ivec3(floor(vCell));
  float jv = 1.0 + (voxelHash(cell, 1u) * 2.0 - 1.0) * vPal.w;
  float hue = (voxelHash(cell, 2u) * 2.0 - 1.0) * 0.012;
  vec3 s = clamp(vec3(vPal.r * jv + hue, vPal.g * jv, vPal.b * jv - hue), 0.0, 1.0);
  float ao = mix(1.0 - uAoStrength, 1.0, vAO);
  diffuseColor.rgb *= voxelSrgbToLinear(s) * ao;
}
`;

const FRAGMENT_EMISSIVE = /* glsl */ `
#include <emissivemap_fragment>
{
  float fres = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.0);
  totalEmissiveRadiance += diffuseColor.rgb * (vVoxelMat.y + vVoxelMat.z * fres);
}
`;

/**
 * Wrap lighting for `MAT.soft` voxels (art bible §5 "subsurface feel"): diffuse
 * light wraps past the terminator with a warm tint. Specular stays standard.
 */
const LAMBERT_LINE =
  'reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );';
const WRAP_LIGHTS = ShaderChunk.lights_physical_pars_fragment.replace(
  LAMBERT_LINE,
  /* glsl */ `{
    float nlRaw = dot( geometryNormal, directLight.direction );
    float nl = saturate( nlRaw );
    float wrapNL = saturate( ( nlRaw + vVoxelMat.w ) / ( 1.0 + vVoxelMat.w ) );
    vec3 wrapIrr = directLight.color * ( nl + max( wrapNL - nl, 0.0 ) * uSssTint );
    reflectedLight.directDiffuse += wrapIrr * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
    // Glaze sheen for gloss voxels: a broad candy highlight plus a Fresnel lift.
    // Flat voxel faces rarely hit the narrow GGX lobe, so frosting needs this to
    // read as glossy (art bible §5).
    if ( vVoxelMat.x < 0.4 ) {
      vec3 R = reflect( - geometryViewDir, geometryNormal );
      float lobe = pow( saturate( dot( R, directLight.direction ) ), 14.0 );
      float fres = 0.3 + 0.7 * pow( 1.0 - saturate( dot( geometryNormal, geometryViewDir ) ), 3.0 );
      reflectedLight.directSpecular += directLight.color * lobe * fres * uGlaze * saturate( nlRaw + 0.35 );
    }
  }`,
);
if (WRAP_LIGHTS === ShaderChunk.lights_physical_pars_fragment) {
  throw new Error('Materials.ts: three.js lighting chunk changed; update LAMBERT_LINE');
}

export function createVoxelMaterial(
  params: MeshStandardMaterialParameters = {},
  tuning: VoxelMaterialTuning = DEFAULT_TUNING,
): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({ roughness: 1, metalness: 0, ...params });
  const { colors, materials } = paletteUniforms(tuning);
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uPalette = { value: colors };
    shader.uniforms.uVoxelMat = { value: materials };
    shader.uniforms.uAoStrength = { value: tuning.aoStrength };
    shader.uniforms.uCrackEps = { value: tuning.crackEps };
    shader.uniforms.uSssTint = { value: new Vector3(1.0, 0.72, 0.52) };
    shader.uniforms.uGlaze = { value: tuning.glaze };
    shader.uniforms.uSmooth = { value: tuning.smooth };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_PARS}`)
      .replace('#include <begin_vertex>', VERTEX_MAIN);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAGMENT_PARS}`)
      .replace('#include <color_fragment>', FRAGMENT_COLOR)
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = vVoxelMat.x;',
      )
      .replace('#include <emissivemap_fragment>', FRAGMENT_EMISSIVE)
      .replace(
        '#include <normal_fragment_maps>',
        /* glsl */ `#include <normal_fragment_maps>
// Gloss voxels shade with the smooth occupancy normal (rounded icing).
if (vVoxelMat.x < 0.4) {
  vec3 sn = normalize(vSNormal) * (gl_FrontFacing ? 1.0 : -1.0);
  normal = normalize(mix(normal, sn, uSmooth));
}`,
      )
      .replace('#include <lights_physical_pars_fragment>', WRAP_LIGHTS);
  };
  mat.customProgramCacheKey = () => 'voxel-v4';
  return mat;
}
