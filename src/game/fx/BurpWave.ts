import {
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
  type Material,
} from 'three';
import { PALETTE_INDEX, type VoxelColorName } from '../../art/palette';
import { voxelCube } from './VoxelParticles';

/** Rainbow bands, outer to inner (sheet 03 "GIANT BURP"). */
export const RAINBOW: VoxelColorName[] = [
  'rainbowRed',
  'rainbowOrange',
  'rainbowYellow',
  'rainbowGreen',
  'rainbowBlue',
  'rainbowViolet',
];

/** Burp feel (art bible §8). Times in seconds, lengths in meters. */
export const BURP = {
  /** The hoop that flies out of his mouth. */
  hoopLife: 0.95,
  hoopSpeed: 1.4,
  hoopGrow: 0.6,
  /** The ring that runs out along the ground, bending the grass. */
  groundLife: 1.3,
  groundReach: 4.2,
  /** Cube size (one 1/32 m voxel) and spacing along a band. */
  cube: 0.034,
  step: 0.03,
} as const;

const PER_BAND = 220;

/**
 * The burp shockwave as voxels (art bible §8, sheet 03): a rainbow hoop that
 * pops out of Glazey's mouth and widens as it flies, and a rainbow ring that
 * runs out across the ground. Both are a pure function of the time since the
 * burp, so the screenshot harness can pose any instant.
 */
export class BurpWave extends Group {
  private readonly bands: InstancedMesh[] = [];
  private readonly ground: (x: number, z: number) => number;
  /** Mouth position, travel direction, origin on the ground and strength (0.3–1). */
  private mouth = new Vector3();
  private fwd = new Vector3(0, 0, 1);
  private origin = new Vector3();
  private k = 1;
  private t0 = -Infinity;

  constructor(material: Material, ground: (x: number, z: number) => number) {
    super();
    this.ground = ground;
    for (const name of RAINBOW) {
      const mesh = new InstancedMesh(voxelCube(PALETTE_INDEX[name]), material, PER_BAND * 2);
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      mesh.count = 0;
      mesh.frustumCulled = false;
      mesh.castShadow = false;
      this.bands.push(mesh);
      this.add(mesh);
    }
  }

  fire(time: number, mouth: Vector3, fwd: Vector3, origin: Vector3, strength: number): void {
    this.t0 = time;
    this.mouth.copy(mouth);
    this.fwd.set(fwd.x, 0, fwd.z).normalize();
    this.origin.copy(origin);
    this.k = strength;
  }

  /** Ground ring radius and strength at `time` (for the grass bend), or null when over. */
  shock(time: number): { x: number; z: number; radius: number; strength: number } | null {
    const t = time - this.t0;
    if (t < 0 || t > BURP.groundLife) return null;
    const u = t / BURP.groundLife;
    return {
      x: this.origin.x,
      z: this.origin.z,
      radius: 0.3 + BURP.groundReach * this.k * Math.pow(u, 0.6),
      strength: this.k * (1 - u) * (1 - u),
    };
  }

  /** Hoop center and radius at `time`, or null (the screen ripple follows it). */
  hoop(time: number): { at: Vector3; radius: number; fade: number } | null {
    const t = time - this.t0;
    if (t < 0 || t > BURP.hoopLife) return null;
    const u = t / BURP.hoopLife;
    // Fast out of the mouth, easing as it widens.
    const travel = BURP.hoopSpeed * this.k * (1 - Math.pow(1 - u, 2)) * BURP.hoopLife * 0.6;
    return {
      at: this.mouth.clone().addScaledVector(this.fwd, 0.02 + travel),
      radius: 0.1 + BURP.hoopGrow * (0.5 + 0.5 * this.k) * Math.pow(u, 0.55),
      fade: 1 - Math.pow(u, 3),
    };
  }

  update(time: number): void {
    for (const b of this.bands) b.count = 0;
    const m = new Matrix4();
    const q = new Quaternion();
    const s = new Vector3();
    const p = new Vector3();
    const side = new Vector3(this.fwd.z, 0, -this.fwd.x);
    const up = new Vector3(0, 1, 0);
    const hoop = this.hoop(time);
    if (hoop) {
      // Concentric bands across the hoop's thickness, red outside.
      const width = BURP.cube * 0.9;
      this.bands.forEach((mesh, band) => {
        const r = hoop.radius - band * width;
        if (r <= 0.02) return;
        const n = Math.min(PER_BAND, Math.max(10, Math.round((2 * Math.PI * r) / BURP.step)));
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          p.copy(hoop.at)
            .addScaledVector(side, Math.cos(a) * r)
            .addScaledVector(up, Math.sin(a) * r);
          q.setFromAxisAngle(this.fwd, a);
          s.setScalar(BURP.cube * hoop.fade);
          mesh.setMatrixAt(mesh.count++, m.compose(p, q, s));
        }
      });
    }
    const shock = this.shock(time);
    if (shock) {
      const fade = Math.min(1, shock.strength / Math.max(0.01, this.k) + 0.15);
      // Two rows per band: a bold rainbow ribbon lying on the grass tops.
      const width = BURP.cube * 1.3;
      this.bands.forEach((mesh, band) => {
        for (let row = 0; row < 2; row++) {
          const r = shock.radius - band * width - row * width * 0.5;
          if (r <= 0.05) continue;
          const n = Math.min(PER_BAND / 2, Math.round((2 * Math.PI * r) / (BURP.step * 1.6)));
          for (let i = 0; i < n; i++) {
            const a = ((i + row * 0.5) / n) * Math.PI * 2;
            const x = shock.x + Math.cos(a) * r;
            const z = shock.z + Math.sin(a) * r;
            // Only on the lawn: skip steep ground (the frosting rim's wall).
            const gy = this.ground(x, z);
            const slope = Math.abs(
              this.ground(x + Math.cos(a) * 0.08, z + Math.sin(a) * 0.08) - gy,
            );
            if (slope > 0.04) continue;
            p.set(x, this.ground(x, z) + 0.07 + 0.025 * Math.sin(a * 7 + time * 9), z);
            q.setFromAxisAngle(up, -a);
            s.setScalar(BURP.cube * 0.85 * fade);
            mesh.setMatrixAt(mesh.count++, m.compose(p, q, s));
          }
        }
      });
    }
    for (const b of this.bands) b.instanceMatrix.needsUpdate = true;
  }

  reset(): void {
    this.t0 = -Infinity;
    for (const b of this.bands) b.count = 0;
  }
}
