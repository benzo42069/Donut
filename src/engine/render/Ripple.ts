import { Effect, EffectAttribute } from 'postprocessing';
import { Uniform, Vector4 } from 'three';

/**
 * The burp's screen-space ripple (art bible §8): a thin ring of refraction
 * that runs out from a point on screen. `RIPPLE.value` is (center u, center v,
 * radius in screen heights, strength); strength 0 turns it off. Reduced-motion
 * mode keeps it at 0.
 */
export const RIPPLE = { value: new Vector4(0.5, 0.5, 0, 0) };

const fragment = /* glsl */ `
uniform vec4 ripple;
uniform float aspect;

void mainUv(inout vec2 uv) {
  if (ripple.w <= 0.0) return;
  vec2 d = uv - ripple.xy;
  d.x *= aspect;
  float r = length(d);
  float x = (r - ripple.z) / 0.035;
  float band = exp(-x * x);
  vec2 dir = d / max(r, 1e-4);
  dir.x /= aspect;
  uv -= dir * band * ripple.w * 0.012;
}
`;

export class RippleEffect extends Effect {
  constructor() {
    super('RippleEffect', fragment, {
      attributes: EffectAttribute.NONE,
      uniforms: new Map<string, Uniform>([
        ['ripple', RIPPLE as unknown as Uniform],
        ['aspect', new Uniform(1)],
      ]),
    });
  }

  override setSize(width: number, height: number): void {
    const u = this.uniforms.get('aspect');
    if (u) u.value = width / Math.max(1, height);
  }
}
