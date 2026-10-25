import { BlendFunction, Effect } from 'postprocessing';
import { Color, Uniform } from 'three';
import { LIGHT_PALETTE } from '../../art/palette';

/**
 * Gentle grade after tone mapping (art bible §6): warm highlights, cool
 * shadows, a soft filmic contrast and a touch of saturation, then a vignette.
 *
 * Gamut-safe: contrast is a smooth curve on luma only, and saturation scales
 * chroma (color minus luma) by at most the amount that keeps every channel in
 * [0, 1], so no channel ever clips to 0 (§10.7 crushed blacks).
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
  // Saturation, limited so no channel leaves [0, 1].
  float k = saturation;
  for (int i = 0; i < 3; i++) {
    float ch = chroma[i];
    if (ch > 1e-5) k = min(k, (1.0 - l2) / ch);
    else if (ch < -1e-5) k = min(k, -l2 / ch);
  }
  c = l2 + chroma * max(k, 0.0);

  vec2 d = uv - 0.5;
  c *= 1.0 - vignette * dot(d, d) * 1.6;
  outputColor = vec4(clamp(c, 0.0, 1.0), inputColor.a);
}
`;

export class ColorGradeEffect extends Effect {
  constructor(strength = 0.22, vignette = 0.2, saturation = 1.08, contrast = 0.18) {
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
