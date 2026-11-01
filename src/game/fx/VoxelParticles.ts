import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
  type Material,
} from 'three';
import { PALETTE_INDEX, hash3, type VoxelColorName } from '../../art/palette';

/**
 * A unit voxel cube (centered) carrying the voxel material's attributes: one
 * palette index, no baked occlusion, flat normals.
 */
export function voxelCube(color: number): BufferGeometry {
  const faces: [number[], number[], number[], number[]][] = [];
  const quad = (n: number[], u: number[], v: number[]): void => {
    const c = n.map((x) => x * 0.5);
    const p = (su: number, sv: number): number[] =>
      c.map((x, i) => x + ((u[i] ?? 0) * su + (v[i] ?? 0) * sv) * 0.5);
    faces.push([n, p(-1, -1), p(1, -1), p(1, 1)], [n, p(1, 1), p(-1, 1), p(-1, -1)]);
  };
  quad([1, 0, 0], [0, 0, -1], [0, 1, 0]);
  quad([-1, 0, 0], [0, 0, 1], [0, 1, 0]);
  quad([0, 1, 0], [1, 0, 0], [0, 0, -1]);
  quad([0, -1, 0], [1, 0, 0], [0, 0, 1]);
  quad([0, 0, 1], [1, 0, 0], [0, 1, 0]);
  quad([0, 0, -1], [-1, 0, 0], [0, 1, 0]);
  const pos: number[] = [];
  const nrm: number[] = [];
  const vox: number[] = [];
  for (const [n, ...verts] of faces) {
    for (const v of verts) {
      pos.push(...v);
      nrm.push(...n.map((x) => x * 127));
      vox.push(color, 3);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Int8Array(nrm), 3, true));
  g.setAttribute('snormal', new BufferAttribute(new Int8Array(nrm), 3, true));
  g.setAttribute('voxel', new BufferAttribute(new Uint8Array(vox), 2));
  return g;
}

interface Particle {
  pos: Vector3;
  vel: Vector3;
  age: number;
  life: number;
  size: number;
  bounces: number;
  spin: number;
  /** Accumulated tumble (radians) about the particle's own axis. */
  angle: number;
  axis: Vector3;
  layer: number;
  gravity: number;
  drag: number;
  resting: boolean;
}

export interface Burst {
  at: Vector3;
  count: number;
  /** Outward speed range and upward kick (m/s). */
  speed: [number, number];
  up: [number, number];
  /** Bias direction (unit, horizontal) and how strongly to favor it (0–1). */
  dir?: { x: number; z: number; bias: number };
  colors: VoxelColorName[];
  size: [number, number];
  life: [number, number];
  /**
   * Per-particle start points and palette colors (crumbs thrown from the
   * voxels a bite removed). `count` particles are drawn from it in order.
   */
  points?: readonly { at: Vector3; index: number }[];
  /** Gravity scale (1 = 9.8 m/s²) and air drag per second. */
  gravity?: number;
  drag?: number;
}

const MAX = 160;
const UP = new Vector3(0, 1, 0);

/**
 * Voxel particles (art bible §8: no flat sprites in the 3D world): tiny cubes
 * that arc, bounce once or twice on the ground, settle and shrink away.
 * Deterministic: random numbers come from a hash of an emission counter.
 */
export class VoxelParticles extends Group {
  private readonly kinds: { mesh: InstancedMesh; color: number }[] = [];
  private readonly live: Particle[] = [];
  private readonly ground: (x: number, z: number) => number;
  private readonly max: number;
  private seq = 0;

  constructor(
    material: Material,
    colors: VoxelColorName[],
    ground: (x: number, z: number) => number,
    max = MAX,
  ) {
    super();
    this.ground = ground;
    this.max = max;
    for (const name of colors) {
      const color = PALETTE_INDEX[name];
      const mesh = new InstancedMesh(voxelCube(color), material, max);
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      mesh.count = 0;
      mesh.frustumCulled = false;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      this.kinds.push({ mesh, color });
      this.add(mesh);
    }
  }

  private rand(k: number): number {
    return hash3(this.seq, k, 7, 913);
  }

  emit(b: Burst): void {
    for (let i = 0; i < b.count; i++) {
      this.seq++;
      const a = this.rand(1) * Math.PI * 2;
      let dx = Math.cos(a);
      let dz = Math.sin(a);
      if (b.dir) {
        dx = dx * (1 - b.dir.bias) + b.dir.x * b.dir.bias;
        dz = dz * (1 - b.dir.bias) + b.dir.z * b.dir.bias;
        const l = Math.hypot(dx, dz) || 1;
        dx /= l;
        dz /= l;
      }
      const sp = b.speed[0] + (b.speed[1] - b.speed[0]) * this.rand(2);
      const up = b.up[0] + (b.up[1] - b.up[0]) * this.rand(3);
      const point = b.points?.[i % Math.max(1, b.points.length)];
      const name = b.colors[Math.floor(this.rand(4) * b.colors.length)] ?? b.colors[0];
      const want = point ? point.index : PALETTE_INDEX[name ?? 'candyCream'];
      let layer = this.kinds.findIndex((l) => l.color === want);
      // A crumb of a color this system doesn't carry falls back to the burst's colors.
      if (layer < 0 && point)
        layer = this.kinds.findIndex((l) => l.color === PALETTE_INDEX[name ?? 'candyCream']);
      if (layer < 0) continue;
      if (this.live.length >= this.max) this.live.shift();
      const axis = new Vector3(this.rand(8) - 0.5, this.rand(9) - 0.5, this.rand(10) - 0.5);
      this.live.push({
        pos: point ? point.at.clone() : b.at.clone().add(new Vector3(dx * 0.06, 0.03, dz * 0.06)),
        vel: new Vector3(dx * sp, up, dz * sp),
        age: 0,
        life: b.life[0] + (b.life[1] - b.life[0]) * this.rand(5),
        size: b.size[0] + (b.size[1] - b.size[0]) * this.rand(6),
        bounces: 0,
        spin: (this.rand(7) - 0.5) * 14,
        angle: this.rand(11) * Math.PI * 2,
        axis: axis.lengthSq() > 1e-4 ? axis.normalize() : new Vector3(0, 1, 0),
        layer,
        gravity: b.gravity ?? 1,
        drag: b.drag ?? 1.6,
        resting: false,
      });
    }
  }

  update(dt: number): void {
    const m = new Matrix4();
    const q = new Quaternion();
    const scale = new Vector3();
    for (const l of this.kinds) l.mesh.count = 0;
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      if (!p) continue;
      p.age += dt;
      if (p.age >= p.life) {
        this.live.splice(i, 1);
        continue;
      }
      if (p.resting) continue;
      p.vel.y -= 9.8 * p.gravity * dt;
      p.vel.multiplyScalar(Math.exp(-p.drag * dt));
      p.pos.addScaledVector(p.vel, dt);
      p.angle += p.spin * dt;
      const floor = this.ground(p.pos.x, p.pos.z) + p.size / 2;
      if (p.pos.y < floor && p.gravity > 0) {
        p.pos.y = floor;
        if (p.bounces < 2 && p.vel.y < -0.4) {
          // Bounce once or twice (art bible §8), losing most of the energy.
          p.vel.y *= -0.38;
          p.vel.x *= 0.6;
          p.vel.z *= 0.6;
          p.spin *= 0.6;
          p.bounces++;
        } else {
          // Settle: snap the tumble to the nearest flat face and stay put.
          p.vel.set(0, 0, 0);
          p.angle = Math.round(p.angle / (Math.PI / 2)) * (Math.PI / 2);
          p.resting = true;
        }
      }
    }
    for (const p of this.live) {
      const layer = this.kinds[p.layer];
      if (!layer) continue;
      // Shrink away at the end: the last third of a short life, the last 0.6 s of a long one.
      const fade = Math.min(1, (p.life - p.age) / Math.min(p.life * 0.35, 0.6));
      q.setFromAxisAngle(p.resting ? UP : p.axis, p.angle);
      scale.setScalar(p.size * fade);
      m.compose(p.pos, q, scale);
      layer.mesh.setMatrixAt(layer.mesh.count++, m);
    }
    for (const l of this.kinds) l.mesh.instanceMatrix.needsUpdate = true;
  }

  reset(): void {
    this.live.length = 0;
    this.seq = 0;
    for (const l of this.kinds) l.mesh.count = 0;
  }
}
