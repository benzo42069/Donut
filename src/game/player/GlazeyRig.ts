import { Group, type Material } from 'three';
import { GLAZEY_VOXEL, type GlazeyModel, type GlazeyPart } from '../../art/models/glazey';
import type { MesherPool } from '../../engine/voxel/MesherPool';
import { VoxelObject } from '../../engine/voxel/VoxelObject';

/** One arm: `swing` about the shoulder's x axis (+ forward), `raise` up and out. */
export interface ArmPose {
  swing: number;
  raise: number;
  /** Shoulder slid forward and in (0–1): the hug that grips a held donut (M5). */
  reach?: number;
}

/** One foot, relative to its rest spot: lifted, moved forward, toe pitched up (+). */
export interface FootPose {
  lift: number;
  fwd: number;
  pitch: number;
}

/**
 * A full-body pose for the bone-less rig (PLAN M4). Lengths are meters, angles
 * radians. `squash` scales the body around the soles and keeps its volume:
 * < 1 squashes wide and low, > 1 stretches tall and thin.
 */
export interface GlazeyPose {
  squash: number;
  /** Body lift above the feet (walk bob). */
  bob: number;
  /** Whole-body tilt: forward (+) and to Glazey's right (+). */
  lean: number;
  roll: number;
  /** Body yaw against the feet (the walk's hip twist). */
  twist: number;
  arms: [ArmPose, ArmPose];
  feet: [FootPose, FootPose];
  /** Tuft bend forward (+) and sideways (+ right). */
  tuft: [number, number];
  /** Uniform size about the soles (the belly-inflation wobble, M5). */
  scale: number;
  /** Rolling as a ball (M5): turn of the body about its center, forward (+). */
  spin: number;
  /** Arms and feet drawn into the body (0–1) while rolling. */
  tuck: number;
}

export const restPose = (): GlazeyPose => ({
  squash: 1,
  bob: 0,
  lean: 0,
  roll: 0,
  twist: 0,
  arms: [
    { swing: 0, raise: 0 },
    { swing: 0, raise: 0 },
  ],
  feet: [
    { lift: 0, fwd: 0, pitch: 0 },
    { lift: 0, fwd: 0, pitch: 0 },
  ],
  tuft: [0, 0],
  scale: 1,
  spin: 0,
  tuck: 0,
});

/**
 * Glazey as a posable hierarchy of voxel parts: no bones, no skinning, each part
 * a rigid voxel mesh hung on a joint, so the cubes never stretch apart.
 *
 *   root (world position at the soles, yaw)
 *   └ size (inflate) → lean (tilt about the soles)
 *     ├ bob (lift, twist) → spin (about the body center) → squash
 *     │   → body, face, tuft joint, arm joints, hold (in front of the mouth)
 *     └ foot joints
 */
export class GlazeyRig extends Group {
  readonly model: GlazeyModel;
  private readonly size = new Group();
  private readonly lean = new Group();
  private readonly bob = new Group();
  private readonly spin = new Group();
  private readonly spinInner = new Group();
  private readonly squash = new Group();
  /** The mouth on the face: a held donut is posed from here (M5). */
  readonly hold = new Group();
  private readonly armRest: [number, number, number][];
  private readonly tuft: Group;
  private readonly arms: [Group, Group];
  private readonly feet: [Group, Group];
  private readonly footRest: [number, number, number][];
  private readonly objects: VoxelObject[] = [];

  private constructor(model: GlazeyModel, material: Material, pool: MesherPool) {
    super();
    this.model = model;
    const p = model.parts;
    const joint = (part: GlazeyPart, parent: Group): Group => {
      const g = new Group();
      g.position.set(...scaled(part.joint));
      const obj = new VoxelObject(part.grid, part.voxel, material, pool);
      obj.normalField = part.normal;
      obj.position.set(
        -part.pivot[0] * part.voxel,
        -part.pivot[1] * part.voxel,
        -part.pivot[2] * part.voxel,
      );
      for (const c of part.grid.chunkCoords()) part.grid.markDirty(c.cx, c.cy, c.cz);
      this.objects.push(obj);
      g.add(obj);
      parent.add(g);
      return g;
    };
    this.add(this.size);
    this.size.add(this.lean);
    this.lean.add(this.bob);
    // The spin pivots at the body's center, so a ball rolls about its middle.
    const center = model.body.y0 * GLAZEY_VOXEL;
    this.spin.position.y = center;
    this.spinInner.position.y = -center;
    this.bob.add(this.spin);
    this.spin.add(this.spinInner);
    this.spinInner.add(this.squash);
    this.hold.position.set(...scaled(model.mouth));
    this.squash.add(this.hold);
    joint(p.body, this.squash);
    joint(p.face, this.squash);
    this.tuft = joint(p.tuft, this.squash);
    this.arms = [joint(p.armL, this.squash), joint(p.armR, this.squash)];
    this.feet = [joint(p.footL, this.lean), joint(p.footR, this.lean)];
    this.footRest = [scaled(p.footL.joint), scaled(p.footR.joint)];
    this.armRest = [scaled(p.armL.joint), scaled(p.armR.joint)];
    this.bodyCenter = center;
  }

  private readonly bodyCenter: number;

  /** Builds the rig and meshes every part on the worker pool. */
  static async build(model: GlazeyModel, material: Material, pool: MesherPool): Promise<GlazeyRig> {
    const rig = new GlazeyRig(model, material, pool);
    await Promise.all(rig.objects.map((o) => o.update()));
    return rig;
  }

  /** Height of the rig at rest (meters, tuft included). */
  get height(): number {
    return this.model.height * GLAZEY_VOXEL;
  }

  pose(p: GlazeyPose): void {
    this.size.scale.setScalar(p.scale);
    this.spin.rotation.x = p.spin;
    this.lean.rotation.set(p.lean, 0, -p.roll);
    this.bob.position.y = p.bob;
    this.bob.rotation.y = p.twist;
    const w = 1 / Math.sqrt(Math.max(0.2, p.squash));
    this.squash.scale.set(w, p.squash, w);
    this.tuft.rotation.set(p.tuft[0], 0, -p.tuft[1]);
    this.arms.forEach((g, i) => {
      const a = p.arms[i];
      const s = i === 0 ? -1 : 1;
      if (a) g.rotation.set(a.swing, 0, s * a.raise, 'XZY');
      // Tucked: drawn into the body and shrunk away (rolling ball).
      const rest = this.armRest[i];
      const reach = a?.reach ?? 0;
      if (rest)
        g.position.set(
          rest[0] * (1 - 0.5 * p.tuck - 0.42 * reach),
          rest[1] + 0.04 * reach,
          rest[2] + 0.42 * reach,
        );
      g.scale.setScalar(Math.max(1e-3, 1 - p.tuck));
    });
    this.feet.forEach((g, i) => {
      const f = p.feet[i];
      const rest = this.footRest[i];
      if (!f || !rest) return;
      const k = 1 - p.tuck;
      g.position.set(
        rest[0] * (1 - 0.3 * p.tuck),
        (rest[1] + f.lift) * k + this.bodyCenter * 0.6 * p.tuck,
        (rest[2] + f.fwd) * k,
      );
      g.rotation.x = -f.pitch;
      g.scale.setScalar(Math.max(1e-3, k));
    });
  }

  dispose(): void {
    for (const o of this.objects) o.dispose();
  }
}

const scaled = (v: readonly number[]): [number, number, number] => [
  (v[0] ?? 0) * GLAZEY_VOXEL,
  (v[1] ?? 0) * GLAZEY_VOXEL,
  (v[2] ?? 0) * GLAZEY_VOXEL,
];
