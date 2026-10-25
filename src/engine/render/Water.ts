import { CircleGeometry, Color, Mesh, MeshStandardMaterial, Vector3, type IUniform } from 'three';
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
}

const MAX_POSTS = 16;

export interface Milk {
  mesh: Mesh;
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
    uPosts: {
      value: Array.from({ length: MAX_POSTS }, (_, i) => {
        const p = opts.posts?.[i];
        return new Vector3(p?.[0] ?? 1e4, p?.[1] ?? 1e4, p?.[2] ?? 0);
      }),
    },
  };

  const material = new MeshStandardMaterial({
    color: new Color(VOXEL_PALETTE.milk.hex),
    roughness: 0.16,
    metalness: 0,
    envMapIntensity: 0.55,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;')
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
varying vec3 vWorldPos;
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uFoam;
uniform vec3 uShore;
uniform vec3 uWaves[8];
uniform vec3 uPosts[${MAX_POSTS}];

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
  h += sin(dot(p, vec2(0.83, 0.55)) * 2.1 + uTime * 0.9) * 0.012;
  h += sin(dot(p, vec2(-0.42, 0.91)) * 3.3 + uTime * 1.3) * 0.008;
  h += sin(dot(p, vec2(0.97, -0.25)) * 5.7 - uTime * 1.7) * 0.004;
  h += (milkNoise(p * 2.4 + uTime * 0.15) - 0.5) * 0.012;
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
  diffuseColor.rgb = mix(diffuseColor.rgb, uDeep, smoothstep(0.3, 4.0, d) * 0.55);
  // Foam line hugging the shore, breathing slowly.
  float n = milkNoise(p * 6.0 + vec2(uTime * 0.3, -uTime * 0.2));
  float foamW = 0.09 + 0.06 * n;
  float foam = 1.0 - smoothstep(foamW * 0.4, foamW, d);
  float lace = smoothstep(0.55, 0.75, milkNoise(p * 14.0 - uTime * 0.4)) * (1.0 - smoothstep(0.1, 0.32, d));
  diffuseColor.rgb = mix(diffuseColor.rgb, uFoam, clamp(foam + lace * 0.5, 0.0, 1.0));
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
  normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
}`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `#include <emissivemap_fragment>
totalEmissiveRadiance += diffuseColor.rgb * 0.06;`,
      );
  };
  material.customProgramCacheKey = () => 'milk-v1';

  const geo = new CircleGeometry(opts.radius, 128);
  geo.rotateX(-Math.PI / 2);
  const mesh = new Mesh(geo, material);
  mesh.receiveShadow = true;
  return {
    mesh,
    setTime(t: number) {
      (uniforms.uTime as IUniform<number>).value = t;
    },
  };
}
