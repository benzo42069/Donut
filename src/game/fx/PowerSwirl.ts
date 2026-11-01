import {
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
  type Material,
} from 'three';
import { PALETTE_INDEX, hash3, type VoxelColorName } from '../../art/palette';
import { voxelCube } from './VoxelParticles';

const COUNT = 48;
/** Seconds for one sparkle to spiral from the ground up into Glazey. */
const RISE = 0.85;
/** Spread of start times across the swirl. */
const STAGGER = 0.4;

/**
 * The power pickup (PLAN M5): sparkles in the donut's colors spiral up around
 * Glazey and gather into him. A pure function of the time since the gulp.
 */
export class PowerSwirl extends Group {
  private readonly kinds = new Map<number, InstancedMesh>();
  private readonly material: Material;
  private colors: number[] = [];
  private t0 = -Infinity;

  constructor(material: Material, palette: readonly VoxelColorName[]) {
    super();
    this.material = material;
    for (const name of palette) this.kind(PALETTE_INDEX[name]);
  }

  private kind(index: number): InstancedMesh {
    let mesh = this.kinds.get(index);
    if (!mesh) {
      mesh = new InstancedMesh(voxelCube(index), this.material, COUNT);
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      mesh.count = 0;
      mesh.frustumCulled = false;
      mesh.castShadow = false;
      this.kinds.set(index, mesh);
      this.add(mesh);
    }
    return mesh;
  }

  fire(time: number, colors: readonly VoxelColorName[]): void {
    this.t0 = time;
    this.colors = colors.map((c) => PALETTE_INDEX[c]);
  }

  get duration(): number {
    return RISE + STAGGER;
  }

  /** Poses the swirl around `center` (Glazey's soles) of a body `height` tall. */
  update(time: number, center: Vector3, height: number): void {
    for (const m of this.kinds.values()) m.count = 0;
    const t = time - this.t0;
    if (t >= 0 && t <= this.duration) {
      const m = new Matrix4();
      const q = new Quaternion();
      const s = new Vector3();
      const p = new Vector3();
      const axis = new Vector3(0.3, 1, 0.5).normalize();
      for (let i = 0; i < COUNT; i++) {
        const u = (t - (i / COUNT) * STAGGER) / RISE;
        if (u < 0 || u > 1) continue;
        const color = this.colors[i % Math.max(1, this.colors.length)];
        if (color === undefined) continue;
        const phase = (i / COUNT) * Math.PI * 6 + hash3(i, 1, 2, 77);
        const r = 0.12 + 0.72 * Math.pow(1 - u, 1.3);
        const a = phase + 11 * u;
        // Rise past his middle, then curl in toward the tuft.
        const y = height * (0.05 + 1.0 * u - 0.15 * u * u);
        p.set(center.x + Math.cos(a) * r, center.y + y, center.z + Math.sin(a) * r);
        q.setFromAxisAngle(axis, a * 2);
        // Twinkle: grow in, pulse, and shrink into him.
        const size =
          0.034 * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (0.8 + 0.3 * Math.sin(i + t * 30));
        s.setScalar(Math.max(0, size));
        const mesh = this.kind(color);
        mesh.setMatrixAt(mesh.count++, m.compose(p, q, s));
      }
    }
    for (const m of this.kinds.values()) m.instanceMatrix.needsUpdate = true;
  }

  reset(): void {
    this.t0 = -Infinity;
    for (const m of this.kinds.values()) m.count = 0;
  }
}
