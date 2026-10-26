import { Vector3 } from 'three';
import { DONUT_VOXEL, buildDonut, donutSize } from '../art/models/donut';
import { ICON_VOXEL, JUMP_ICON_SIZE, buildJumpIcon } from '../art/models/icons';
import type { TouchIcons } from './TouchControls';
import { renderVoxelIcon } from './voxelIcon';

/** Renders the touch controls' voxel icons (art bible §9). */
export async function loadTouchIcons(): Promise<TouchIcons> {
  const jump = await renderVoxelIcon({
    grid: buildJumpIcon(),
    voxel: ICON_VOXEL,
    size: JUMP_ICON_SIZE,
    view: new Vector3(0.25, 0.35, 1),
    px: 160,
  });
  const knob = await renderVoxelIcon({
    grid: buildDonut('strawberry', 5, DONUT_VOXEL, { sprinkles: true }),
    voxel: DONUT_VOXEL,
    size: donutSize(DONUT_VOXEL, 'strawberry'),
    view: new Vector3(0, 1.7, 1),
    px: 160,
  });
  return { jump, knob };
}
