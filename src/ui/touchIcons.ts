import { Vector3 } from 'three';
import { DONUT_VOXEL, biteDonut, buildDonut, donutSize } from '../art/models/donut';
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
  // Burp: his giant-burp face, puffed and round.
  const burpRig = await GlazeyRig.build(buildGlazey(3, 'burp'), createVoxelMaterial(), pool);
  const puff = restPose();
  for (const a of puff.arms) {
    a.raise = 1.1;
    a.swing = 0.6;
  }
  burpRig.pose(puff);
  const burp = renderIcon(burpRig, new Vector3(0.25, 0.12, 1), 160);
  burpRig.dispose();
  // Munch: a sprinkle donut with a big scalloped bite out of it (K-07).
  const bitten = buildDonut('strawberry', 5, DONUT_VOXEL, { sprinkles: true });
  biteDonut(bitten, 'strawberry', { angle: -0.6, radius: 0.24 }, DONUT_VOXEL, 3);
  const munch = await renderVoxelIcon({
    grid: bitten,
    voxel: DONUT_VOXEL,
    size: donutSize(DONUT_VOXEL, 'strawberry'),
    view: new Vector3(0.2, 1.2, 1),
    px: 160,
  });
  const knob = await renderVoxelIcon({
    grid: buildDonut('strawberry', 5, DONUT_VOXEL, { sprinkles: true }),
    voxel: DONUT_VOXEL,
    size: donutSize(DONUT_VOXEL, 'strawberry'),
    view: new Vector3(0, 1.7, 1),
    px: 160,
  });
  pool.dispose();
  return { jump, knob, munch, burp };
}
