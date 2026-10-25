import { BackSide, Color, Mesh, ShaderMaterial, SphereGeometry, Vector3 } from 'three';
import { LIGHT_PALETTE } from '../../art/palette';

/**
 * Pastel gradient sky dome with a soft sun glow (art bible §6). Dithered to
 * avoid banding (instant-fail §10.7).
 */
export function createSky(sunDirection: Vector3, radius = 400): Mesh {
  const material = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      zenith: { value: new Color(LIGHT_PALETTE.skyZenith) },
      horizon: { value: new Color(LIGHT_PALETTE.skyHorizon) },
      glow: { value: new Color(LIGHT_PALETTE.skySunGlow) },
      sunDir: { value: sunDirection.clone().normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 zenith;
      uniform vec3 horizon;
      uniform vec3 glow;
      uniform vec3 sunDir;
      varying vec3 vDir;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -0.2, 1.0);
        vec3 col = mix(horizon, zenith, pow(smoothstep(-0.05, 0.75, h), 0.8));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        col = mix(col, glow, pow(s, 6.0) * 0.55 + pow(s, 64.0) * 0.35);
        col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new Mesh(new SphereGeometry(radius, 32, 16), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
}
