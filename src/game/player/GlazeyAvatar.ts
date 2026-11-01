import { Group, type Material } from 'three';
import { buildGlazey, type GlazeyExpression } from '../../art/models/glazey';
import type { MesherPool } from '../../engine/voxel/MesherPool';
import { GlazeyRig, type GlazeyPose } from './GlazeyRig';

export type Look = readonly [belly: number, expression: GlazeyExpression];

const key = (belly: number, e: GlazeyExpression): string => `${belly}:${e}`;

/**
 * Glazey in all his shapes (PLAN M5): one baked rig per belly stage and face,
 * built on demand on the worker pool and cached. The simulation only says which
 * look it wants; the avatar shows it as soon as it is meshed, and meanwhile the
 * closest ready look (same belly first), so a slow build never stalls play.
 */
export class GlazeyAvatar extends Group {
  private readonly rigs = new Map<string, GlazeyRig>();
  private readonly pending = new Map<string, Promise<GlazeyRig>>();
  private readonly material: Material;
  private readonly pool: MesherPool;
  private active: GlazeyRig | null = null;

  private constructor(material: Material, pool: MesherPool) {
    super();
    this.material = material;
    this.pool = pool;
  }

  static async create(
    material: Material,
    pool: MesherPool,
    preload: readonly Look[] = [[0, 'happy']],
  ): Promise<GlazeyAvatar> {
    const a = new GlazeyAvatar(material, pool);
    await Promise.all(preload.map(([b, e]) => a.load(b, e)));
    const first = preload[0];
    if (first) a.show(first[0], first[1]);
    return a;
  }

  /** Builds (or returns) the rig for a look. */
  load(belly: number, expression: GlazeyExpression): Promise<GlazeyRig> {
    const k = key(belly, expression);
    const ready = this.rigs.get(k);
    if (ready) return Promise.resolve(ready);
    let p = this.pending.get(k);
    if (!p) {
      p = GlazeyRig.build(buildGlazey(belly, expression), this.material, this.pool).then((rig) => {
        rig.visible = false;
        this.add(rig);
        this.rigs.set(k, rig);
        this.pending.delete(k);
        return rig;
      });
      this.pending.set(k, p);
    }
    return p;
  }

  /** Every build in flight has landed (the shot harness waits on this). */
  async settle(): Promise<void> {
    while (this.pending.size) await Promise.all(this.pending.values());
  }

  /** Shows the wanted look, or the nearest ready one while it builds. */
  show(belly: number, expression: GlazeyExpression): GlazeyRig | null {
    let rig = this.rigs.get(key(belly, expression));
    if (!rig) {
      void this.load(belly, expression);
      rig =
        this.rigs.get(key(belly, 'happy')) ??
        [...this.rigs.entries()]
          .map(([k, r]) => ({ r, d: Math.abs(Number(k.split(':')[0]) - belly) }))
          .sort((a, b) => a.d - b.d)[0]?.r;
    }
    if (rig && rig !== this.active) {
      if (this.active) this.active.visible = false;
      rig.visible = true;
      this.active = rig;
    }
    return this.active;
  }

  get rig(): GlazeyRig | null {
    return this.active;
  }

  pose(p: GlazeyPose): void {
    this.active?.pose(p);
  }

  dispose(): void {
    for (const r of this.rigs.values()) r.dispose();
  }
}
