import { CircleGeometry, Color, Mesh, ShaderMaterial } from 'three';
import { LIGHT_PALETTE } from '../../art/palette';

/**
 * A soft blob of shade under Glazey (PLAN M4): it tells the eye where he is
 * over the ground, most of all mid-jump, shrinking and fading with height. A
 * procedural radial falloff, no bitmap.
 */
export class ContactShadow extends Mesh<CircleGeometry, ShaderMaterial> {
  constructor() {
    super(
      new CircleGeometry(1, 40).rotateX(-Math.PI / 2),
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        uniforms: {
          uColor: { value: new Color(LIGHT_PALETTE.studioOcclusion) },
          uOpacity: { value: 0.5 },
        },
        vertexShader: /* glsl */ `
varying vec2 vUv2;
void main() {
  vUv2 = position.xz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
        fragmentShader: /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv2;
void main() {
  float r2 = dot(vUv2, vUv2);
  float a = uOpacity * pow(max(0.0, 1.0 - r2), 0.8);
  gl_FragColor = vec4(uColor, a);
}`,
      }),
    );
    this.renderOrder = 2;
    this.frustumCulled = false;
  }

  /** Places the blob on the ground at (x, groundY, z) for a body `height` meters up. */
  place(x: number, groundY: number, z: number, height: number): void {
    const h = Math.min(Math.max(height, 0), 1.6) / 1.6;
    // Just over the grass tufts, so the meadow doesn't swallow it.
    this.position.set(x, groundY + 0.1, z);
    this.scale.setScalar(0.42 * (1 - 0.4 * h));
    const opacity = this.material.uniforms.uOpacity;
    if (opacity) opacity.value = 0.9 * (1 - 0.35 * h);
  }
}
