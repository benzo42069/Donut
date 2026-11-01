import { Vector3 } from 'three';
import { DONUT_VOXEL, buildDonut, donutSize } from '../art/models/donut';
import { buildGlazey } from '../art/models/glazey';
import { createVoxelMaterial } from '../engine/render/Materials';
import { MesherPool } from '../engine/voxel/MesherPool';
import { GlazeyRig, restPose } from '../game/player/GlazeyRig';
import type { TouchIcons } from './TouchControls';
import { renderIcon, renderVoxelIcon } from './voxelIcon';

/**
 * Renders the touch controls' voxel icons (art bible §9): the jump button shows
 * Glazey himself mid-hop (arms flung up, stretched, toes pointed), the stick's
 * knob is a little sprinkle donut.
 */
export async function loadTouchIcons(): Promise<TouchIcons> {
  const pool = new MesherPool();
  const rig = await GlazeyRig.build(buildGlazey(0, 'happy'), createVoxelMaterial(), pool);
  pool.dispose();
  const hop = restPose();
  hop.squash = 1.2;
  for (const a of hop.arms) {
    a.raise = 1.8;
    a.swing = -0.15;
  }
  for (const f of hop.feet) {
    f.lift = 0.05;
    f.pitch = -0.5;
  }
  hop.tuft[0] = 0.35;
  rig.pose(hop);
  const jump = renderIcon(rig, new Vector3(0.42, 0.18, 1), 160);
  rig.dispose();
  const knob = await renderVoxelIcon({
    grid: buildDonut('strawberry', 5, DONUT_VOXEL, { sprinkles: true }),
    voxel: DONUT_VOXEL,
    size: donutSize(DONUT_VOXEL, 'strawberry'),
    view: new Vector3(0, 1.7, 1),
    px: 160,
  });
  return { jump, knob };
}
