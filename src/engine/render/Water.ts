import {
  CircleGeometry,
  Color,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  ShaderChunk,
  Vector2,
  Vector3,
  type IUniform,
  type Texture,
} from 'three';
import { LIGHT_PALETTE, VOXEL_PALETTE } from '../../art/palette';

/**
 * The milk lagoon surface (art bible §5, RF-02, RF-07): cream-white milk with
 * slow procedural ripples (no textures), soft sky and sun specular through the
 * standard PBR path, a warm depth tint away from the shore, a soft foam line
 * where the milk meets the cliffs, and a faint inner glow (milk scatters light).
 *
 * The shoreline is analytic: `shoreRadius(θ) = base + amp · Σ a·sin(kθ + p)`,
 * the same sum of sines the island generator uses for its inner cliff.
 */
export interface MilkOptions {
  /** Lagoon radius to cover (meters). */
  radius: number;
  /** Shoreline: base radius, amplitude and the [harmonic, amplitude, phase] waves. */
  shoreBase: number;
  shoreAmp: number;
  waves: readonly (readonly [number, number, number])[];
  /** Extra round shores (e.g. pier posts): x, z, radius. */
  posts?: readonly (readonly [number, number, number])[];
  /** An amber syrup swirl spreading into the milk: x, z, radius. */
  syrup?: readonly [number, number, number];
  /** Planar reflection (see Reflection.ts); omitted on low tiers. */
  reflection?: { texture: Texture; textureMatrix: Matrix4; strength: number };
}

const MAX_POSTS = 16;

/** Adds a broad, shadow-aware sun sheen on the ripples (soft specular, art bible §5). */
const SPEC_LINE =
  'reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;';
const MILK_LIGHTS = ShaderChunk.lights_physical_pars_fragment.replace(
  SPEC_LINE,
  `${SPEC_LINE}
  reflectedLight.directSpecular += directLight.color * 0.3 *
    pow( saturate( dot( reflect( - geometryViewDir, geometryNormal ), directLight.direction ) ), 5.0 );`,
);
if (MILK_LIGHTS === ShaderChunk.lights_physical_pars_fragment) {
  throw new Error('Water.ts: three.js lighting chunk changed; update SPEC_LINE');
}

/**
 * Milk scatters light under its surface: shadows on it are softened to 55 % and
 * blurred over a wide 9-tap footprint (penumbrae ~3× the meadow's).
 */
const SHADOW_LINE = 'directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;';
const MILK_LIGHTS_BEGIN = ShaderChunk.lights_fragment_begin.replace(
  `directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, ${SHADOW_LINE}`,
  `directLight.color *= ( directLight.visible && receiveShadow ) ? mix( 1.0, milkShadow( directionalShadowMap[ i ], directionalLightShadow, vDirectionalShadowCoord[ i ] ), 0.55 ) : 1.0;`,
);
if (MILK_LIGHTS_BEGIN === ShaderChunk.lights_fragment_begin) {
  throw new Error('Water.ts: three.js shadow line changed; update SHADOW_LINE');
}

const MILK_SHADOW = /* glsl */ `#include <shadowmap_pars_fragment>
#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
#ifdef SHADOWMAP_TYPE_PCF
#define MILK_SHADOW_MAP sampler2DShadow
#else
#define MILK_SHADOW_MAP sampler2D
#endif
float milkShadow(MILK_SHADOW_MAP map, DirectionalLightShadow s, vec4 coord) {
  float sum = 0.0;
  vec2 texel = 6.0 / s.shadowMapSize;
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      vec4 c = coord;
      c.xy += vec2(float(i), float(j)) * texel * c.w;
      sum += getShadow(map, s.shadowMapSize, s.shadowIntensity, s.shadowBias, s.shadowRadius, c);
    }
  }
  return sum / 9.0;
}
#endif
`;

export interface Milk {
  mesh: Mesh;
  setReflectionSize(w: number, h: number): void;
  setTime(t: number): void;
}

export function createMilk(opts: MilkOptions): Milk {
  const uniforms: Record<string, IUniform> = {
    uTime: { value: 0 },
    uDeep: { value: new Color(LIGHT_PALETTE.milkDeep) },
    uFoam: { value: new Color(LIGHT_PALETTE.milkFoam) },
    uShore: { value: new Vector3(opts.shoreBase, opts.shoreAmp, opts.waves.length) },
    uWaves: {
      value: Array.from({ length: 8 }, (_, i) => {
        const w = opts.waves[i];
        return new Vector3(w?.[0] ?? 0, w?.[1] ?? 0, w?.[2] ?? 0);
      }),
    },
    tReflect: { value: opts.reflection?.texture ?? null },
    uTexMatrix: { value: opts.reflection?.textureMatrix ?? new Matrix4() },
    uReflect: { value: opts.reflection?.strength ?? 0 },
    uReflectTexel: { value: new Vector2(1 / 960, 1 / 540) },
    uSkyTop: { value: new Color(LIGHT_PALETTE.skyZenith) },
    uSkyLow: { value: new Color(LIGHT_PALETTE.skyHorizon) },
    uSyrup: { value: new Vector3(...(opts.syrup ?? [1e4, 1e4, 0])) },
    uSyrupColor: { value: new Color(VOXEL_PALETTE.syrupLight.hex) },
    uPosts: {
      value: Array.from({ length: MAX_POSTS }, (_, i) => {
        const p = opts.posts?.[i];
        return new Vector3(p?.[0] ?? 1e4, p?.[1] ?? 1e4, p?.[2] ?? 0);
      }),
    },
  };

  const material = new MeshStandardMaterial({
    // Below white: milk in full golden sun must not clip (art bible §10.7).
    color: new Color(VOXEL_PALETTE.milk.hex).multiplyScalar(0.4),
    roughness: 0.16,
    metalness: 0,
    envMapIntensity: 0.4,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vWorldPos;\nvarying vec4 vReflUv;\nuniform mat4 uTexMatrix;',
      )
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvReflUv = uTexMatrix * vec4(transformed, 1.0);',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
varying vec3 vWorldPos;
varying vec4 vReflUv;
uniform sampler2D tReflect;
uniform float uReflect;
uniform vec2 uReflectTexel;
vec3 milkNW = vec3(0.0, 1.0, 0.0);
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uFoam;
uniform vec3 uShore;
uniform vec3 uWaves[8];
uniform vec3 uPosts[${MAX_POSTS}];
uniform vec3 uSyrup;
uniform vec3 uSkyTop;
uniform vec3 uSkyLow;
uniform vec3 uSyrupColor;

float milkHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float milkNoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(milkHash(i), milkHash(i + vec2(1, 0)), u.x),
             mix(milkHash(i + vec2(0, 1)), milkHash(i + vec2(1, 1)), u.x), u.y);
}
// Gentle swell: a few directional waves plus soft noise (height in meters).
float milkHeight(vec2 p) {
  float h = 0.0;
  h += sin(dot(p, vec2(0.83, 0.55)) * 2.1 + uTime * 0.9) * 0.016;
  h += sin(dot(p, vec2(-0.42, 0.91)) * 3.3 + uTime * 1.3) * 0.008;
  h += sin(dot(p, vec2(0.97, -0.25)) * 5.7 - uTime * 1.7) * 0.004;
  h += (milkNoise(p * 2.4 + uTime * 0.15) - 0.5) * 0.014;
  h += (milkNoise(p * 7.0 - uTime * 0.3) - 0.5) * 0.004;
  // Rings spreading from everything that stands or floats in the milk.
  for (int i = 0; i < ${MAX_POSTS}; i++) {
    float dd = max(length(p - uPosts[i].xy) - uPosts[i].z, 0.0);
    h += sin(dd * 26.0 - uTime * 3.0) * 0.005 * exp(-dd * 2.2);
  }
  return h;
}
float shoreDist(vec2 p) {
  float th = atan(p.y, p.x);
  float s = 0.0;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= uShore.z) break;
    s += uWaves[i].y * sin(uWaves[i].x * th + uWaves[i].z);
  }
  float d = (uShore.x + uShore.y * s) - length(p);
  for (int i = 0; i < ${MAX_POSTS}; i++) d = min(d, length(p - uPosts[i].xy) - uPosts[i].z);
  return d;
}
`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
{
  vec2 p = vWorldPos.xz;
  float d = shoreDist(p);
  // Depth tint: a touch warmer and creamier away from the shore.
  diffuseColor.rgb = mix(diffuseColor.rgb, uDeep, smoothstep(0.15, 2.5, d) * 0.7);
  // Foam line hugging the shore, breathing slowly.
  float n = milkNoise(p * 6.0 + vec2(uTime * 0.3, -uTime * 0.2));
  float foamW = 0.2 + 0.1 * n;
  float foam = 1.0 - smoothstep(foamW * 0.45, foamW, d);
  float lace = smoothstep(0.5, 0.72, milkNoise(p * 14.0 - uTime * 0.4)) * (1.0 - smoothstep(0.12, 0.45, d));
  diffuseColor.rgb = mix(diffuseColor.rgb, uFoam, clamp(foam + lace * 0.6, 0.0, 1.0));
  // Meniscus: a soft contact shade right where the milk touches things.
  diffuseColor.rgb *= mix(0.82, 1.0, smoothstep(0.0, 0.035, abs(d)));
  // Syrup swirling into the milk below the fall: amber ribbons that fade out.
  vec2 sp = p - uSyrup.xy;
  float sr = length(sp) / max(uSyrup.z, 1e-3);
  float swirl = sin(atan(sp.y, sp.x) * 3.0 + sr * 9.0 - uTime * 0.6) * 0.5 + 0.5;
  float syrup = (1.0 - smoothstep(0.15, 1.0, sr)) * mix(0.35, 1.0, swirl);
  diffuseColor.rgb = mix(diffuseColor.rgb, uSyrupColor, syrup * 0.8);
}`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        /* glsl */ `#include <normal_fragment_maps>
{
  vec2 p = vWorldPos.xz;
  float e = 0.02;
  float h0 = milkHeight(p);
  vec3 nW = normalize(vec3(-(milkHeight(p + vec2(e, 0.0)) - h0) / e, 1.0, -(milkHeight(p + vec2(0.0, e)) - h0) / e));
  milkNW = nW;
  normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
}`,
      )
      .replace(
        '#include <opaque_fragment>',
        /* glsl */ `
{
  // Sky-tinted Fresnel sheen: the milk mirrors a soft pastel sky at every angle.
  vec3 Rv = reflect(-normalize(vViewPosition), normal);
  vec3 Rw = normalize((vec4(Rv, 0.0) * viewMatrix).xyz);
  vec3 sky = mix(uSkyLow, uSkyTop, smoothstep(0.0, 0.8, Rw.y));
  float fr = 0.32 + 0.68 * pow(1.0 - saturate(dot(normalize(vViewPosition), normal)), 5.0);
  outgoingLight = mix(outgoingLight, sky * 0.8, clamp(fr * 0.6, 0.0, 0.5));
}
if (uReflect > 0.0) {
  // Soft, ripple-distorted mirror image, Fresnel-weighted (milk is no mirror).
  vec2 ruv = vReflUv.xy / vReflUv.w + milkNW.xz * 0.06;
  vec4 r = vec4(0.0);
  for (int i = -2; i <= 2; i++) {
    for (int j = -1; j <= 1; j++) {
      r += texture2D(tReflect, ruv + vec2(float(i), float(j) * 1.5) * uReflectTexel * 1.5);
    }
  }
  r /= 15.0;
  float fres = 0.04 + 0.96 * pow(1.0 - saturate(dot(normalize(vViewPosition), normal)), 5.0);
  float k = clamp((0.45 + fres) * uReflect, 0.0, 0.75) * r.a;
  outgoingLight = mix(outgoingLight, r.rgb / max(r.a, 1e-3), k);
}
#include <opaque_fragment>`,
      )
      .replace('#include <lights_physical_pars_fragment>', MILK_LIGHTS)
      .replace('#include <lights_fragment_begin>', MILK_LIGHTS_BEGIN)
      .replace('#include <shadowmap_pars_fragment>', MILK_SHADOW)
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `#include <emissivemap_fragment>
// Milk scatters light: shaded milk stays warm cream, never neutral gray.
totalEmissiveRadiance += diffuseColor.rgb * 0.03 + uDeep * 0.07;`,
      );
  };
  material.customProgramCacheKey = () => 'milk-v5';

  const geo = new CircleGeometry(opts.radius, 128);
  geo.rotateX(-Math.PI / 2);
  const mesh = new Mesh(geo, material);
  mesh.receiveShadow = true;
  return {
    mesh,
    setReflectionSize(w: number, h: number) {
      (uniforms.uReflectTexel as IUniform<Vector2>).value.set(1 / w, 1 / h);
    },
    setTime(t: number) {
      (uniforms.uTime as IUniform<number>).value = t;
    },
  };
}
