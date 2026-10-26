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
function voxelCube(color: number): BufferGeometry {
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
  layer: number;
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
}

const MAX = 160;

/**
 * Voxel particles (art bible §8: no flat sprites in the 3D world): tiny cubes
 * that arc, bounce once or twice on the ground, settle and shrink away.
 * Deterministic: random numbers come from a hash of an emission counter.
 */
export class VoxelParticles extends Group {
  private readonly kinds: { mesh: InstancedMesh; color: number }[] = [];
  private readonly live: Particle[] = [];
  private readonly ground: (x: number, z: number) => number;
  private seq = 0;

  constructor(
    material: Material,
    colors: VoxelColorName[],
    ground: (x: number, z: number) => number,
  ) {
    super();
    this.ground = ground;
    for (const name of colors) {
      const color = PALETTE_INDEX[name];
      const mesh = new InstancedMesh(voxelCube(color), material, MAX);
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
      const name = b.colors[Math.floor(this.rand(4) * b.colors.length)] ?? b.colors[0];
      const layer = this.kinds.findIndex((l) => l.color === PALETTE_INDEX[name ?? 'candyCream']);
      if (layer < 0) continue;
      if (this.live.length >= MAX) this.live.shift();
      this.live.push({
        pos: b.at.clone().add(new Vector3(dx * 0.06, 0.03, dz * 0.06)),
        vel: new Vector3(dx * sp, up, dz * sp),
        age: 0,
        life: b.life[0] + (b.life[1] - b.life[0]) * this.rand(5),
        size: b.size[0] + (b.size[1] - b.size[0]) * this.rand(6),
        bounces: 0,
        spin: (this.rand(7) - 0.5) * 14,
        layer,
      });
    }
  }

  update(dt: number): void {
    const m = new Matrix4();
    const q = new Quaternion();
    const axis = new Vector3(0.4, 1, 0.3).normalize();
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
      p.vel.y -= 9.8 * dt;
      p.vel.multiplyScalar(Math.exp(-1.6 * dt));
      p.pos.addScaledVector(p.vel, dt);
      const floor = this.ground(p.pos.x, p.pos.z) + p.size / 2;
      if (p.pos.y < floor) {
        p.pos.y = floor;
        if (p.bounces < 2 && p.vel.y < -0.4) {
          p.vel.y *= -0.38;
          p.vel.x *= 0.6;
          p.vel.z *= 0.6;
          p.bounces++;
        } else {
          p.vel.set(p.vel.x * 0.5, 0, p.vel.z * 0.5);
          p.spin *= 0.5;
        }
      }
    }
    for (const p of this.live) {
      const layer = this.kinds[p.layer];
      if (!layer) continue;
      // Shrink away over the last third of the life.
      const fade = Math.min(1, (p.life - p.age) / (p.life * 0.35));
      q.setFromAxisAngle(axis, p.spin * p.age);
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
