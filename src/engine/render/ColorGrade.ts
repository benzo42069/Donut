import { BlendFunction, Effect } from 'postprocessing';
import { Color, Uniform } from 'three';
import { LIGHT_PALETTE } from '../../art/palette';

/**
 * Gentle split-tone grade after tone mapping (art bible §6): slightly warm
 * highlights, slightly cool shadows, and a soft vignette.
 */
const fragment = /* glsl */ `
uniform vec3 warm;
uniform vec3 cool;
uniform float strength;
uniform float vignette;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = inputColor.rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  vec3 tint = mix(cool, warm, smoothstep(0.15, 0.85, l));
  c = mix(c, c * tint, strength);
  vec2 d = uv - 0.5;
  c *= 1.0 - vignette * dot(d, d) * 1.6;
  outputColor = vec4(c, inputColor.a);
}
`;

export class ColorGradeEffect extends Effect {
  constructor(strength = 0.18, vignette = 0.22) {
    super('ColorGradeEffect', fragment, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ['warm', new Uniform(new Color(LIGHT_PALETTE.sunGolden).multiplyScalar(1.12))],
        ['cool', new Uniform(new Color(LIGHT_PALETTE.skyFill).multiplyScalar(1.05))],
        ['strength', new Uniform(strength)],
        ['vignette', new Uniform(vignette)],
      ]),
    });
  }
}
