import { BlendFunction, Effect } from 'postprocessing';
import { Color, Uniform } from 'three';
import { LIGHT_PALETTE } from '../../art/palette';

/**
 * Gentle grade after tone mapping (art bible §6): warm highlights, cool
 * shadows, a soft filmic contrast and a touch of saturation, then a vignette.
 *
 * Contrast is a smooth curve on luma only; saturation has a soft knee so
 * already-saturated colors are left alone. `GamutEffect` runs before tone
 * mapping so channels never reach 0 in the first place (§10.7).
 */
const fragment = /* glsl */ `
uniform vec3 warm;
uniform vec3 cool;
uniform float strength;
uniform float vignette;
uniform float saturation;
uniform float contrast;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = clamp(inputColor.rgb, 0.0, 1.0);
  float l = dot(c, LUMA);
  // Split tone: multiply toward cool in the shadows, warm in the highlights.
  vec3 tint = mix(cool, warm, smoothstep(0.1, 0.85, l));
  c = mix(c, c * tint, strength);
  c = clamp(c, 0.0, 1.0);

  // Contrast on luma: a soft S-curve that leaves 0 and 1 fixed.
  l = dot(c, LUMA);
  float s = l * l * (3.0 - 2.0 * l);
  float l2 = mix(l, s, contrast);
  vec3 chroma = c - l;
  // Saturation with a soft knee: colors near the gamut edge are boosted less.
  float sat = (max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b))) / max(max(c.r, max(c.g, c.b)), 1e-4);
  float k = mix(saturation, 1.0, smoothstep(0.4, 0.9, sat));
  // Chroma scales with luma, so a darker luma never pushes a channel below 0.
  c = clamp(l2 + chroma * k * (l2 / max(l, 1e-4)), 0.0, 1.0);

  vec2 d = uv - 0.5;
  c *= 1.0 - vignette * dot(d, d) * 1.6;
  outputColor = vec4(clamp(c, 0.0, 1.0), inputColor.a);
}
`;

export class ColorGradeEffect extends Effect {
  constructor(strength = 0.1, vignette = 0.2, saturation = 1.06, contrast = 0.18) {
    super('ColorGradeEffect', fragment, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ['warm', new Uniform(new Color(LIGHT_PALETTE.sunGolden).multiplyScalar(1.12))],
        ['cool', new Uniform(new Color(LIGHT_PALETTE.skyFill).multiplyScalar(1.05))],
        ['strength', new Uniform(strength)],
        ['vignette', new Uniform(vignette)],
        ['saturation', new Uniform(saturation)],
        ['contrast', new Uniform(contrast)],
      ]),
    });
  }
}

/**
 * Linear-HDR gamut guard before tone mapping (art bible §4, §10.7): pulls chroma
 * toward luma just enough that no channel drops below `floor` × luma, so
 * saturated warm light on dough never clips a channel to 0 downstream. Also
 * clamps isolated HDR spikes (fireflies) before bloom.
 */
const gamutFragment = /* glsl */ `
uniform float floorK;
uniform float maxHdr;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = max(inputColor.rgb, 0.0);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float lo = min(c.r, min(c.g, c.b));
  float target = floorK * l;
  if (lo < target && l > 1e-5) {
    // c' = l + (c - l) * k, solved so the smallest channel lands on target.
    float k = (l - target) / max(l - lo, 1e-5);
    c = l + (c - l) * k;
  }
  c = min(c, vec3(maxHdr));
  outputColor = vec4(c, inputColor.a);
}
`;

export class GamutEffect extends Effect {
  constructor(floorK = 0.14, maxHdr = 12) {
    super('GamutEffect', gamutFragment, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ['floorK', new Uniform(floorK)],
        ['maxHdr', new Uniform(maxHdr)],
      ]),
    });
  }
}
