import { PALETTE_INDEX } from '../palette';
import { voxelize } from '../sdf';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/** UI icon voxels: icons are rendered from voxel models (art bible §9). */
export const ICON_VOXEL = 1 / 64;
export const JUMP_ICON_SIZE = [44, 44, 14] as const;

/**
 * The jump button's icon: a chunky, rounded up-arrow in candy cream, like a
 * piped icing arrow. Model space: centered in x, standing on y = 0, facing +z.
 */
export function buildJumpIcon(): VoxelGrid {
  const [W, H, D] = JUMP_ICON_SIZE;
  const cx = W / 2;
  const cz = D / 2;
  const r = 3;
  // Signed distance to the flat arrow outline (head plus shaft), inset by r.
  const outline = (x: number, y: number): number => {
    const ax = Math.abs(x - cx);
    // Head: a triangle with its apex at the top and a flat base.
    const tip = H - 3;
    const base = 21;
    const half = 18;
    const slope = Math.hypot(tip - base, half);
    const side = (ax * (tip - base) + (y - tip) * half) / slope;
    const head = Math.max(side, base - y);
    // Shaft: a rounded bar under the head.
    const shaft = Math.max(ax - 7, Math.max(3 - y, y - base - 2));
    return Math.min(head, shaft) + r;
  };
  const grid = new VoxelGrid();
  voxelize(
    grid,
    (x, y, z) => {
      const d2 = outline(x, y);
      const dz = Math.abs(z - cz) - (D / 2 - 1 - r);
      return Math.hypot(Math.max(d2, 0), Math.max(dz, 0)) + Math.min(Math.max(d2, dz), 0) - r;
    },
    [0, 0, 0],
    [W, H, D],
    () => PALETTE_INDEX.candyCream,
  );
  grid.takeDirty();
  return grid;
}
