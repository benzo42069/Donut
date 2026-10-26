import { PALETTE_INDEX, hash3 } from '../palette';
import { box, union, valueNoise3, voxelize, type Sdf } from '../sdf';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/**
 * A little round wooden display stand (reference 04, the studio turntable look
 * of the M3 gallery, K-06): a turned plate with a beveled rim and growth rings,
 * on four stubby legs. Sizes in meters; the base sits at y = 0.
 */
export function standSize(radius: number, voxel: number): [number, number, number] {
  const w = Math.ceil((2 * radius) / voxel) + 4;
  return [w + (w & 1), Math.ceil(STAND_HEIGHT / voxel) + 1, w + (w & 1)];
}

/** Height of the plate top above the floor (meters). */
export const STAND_HEIGHT = 0.17;

export function buildStand(radius: number, voxel: number, seed = 0): VoxelGrid {
  const grid = new VoxelGrid();
  const size = standSize(radius, voxel);
  const v = voxel;
  const c = size[0] / 2;
  const R = radius / v;
  const top = STAND_HEIGHT / v;
  const thick = 0.045 / v;
  const plate: Sdf = (x, y, z) => {
    const r = Math.hypot(x - c, z - c);
    // Rounded rim: a disc whose edge is a half-round bead.
    const dy = y - (top - thick / 2);
    const k = thick / 2;
    const er = r - (R - k);
    return er > 0 ? Math.hypot(er, dy) - k : Math.abs(dy) - k;
  };
  const legR = 0.04 / v;
  const legs: Sdf[] = [0, 1, 2, 3].map((i) => {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const lx = c + Math.cos(a) * R * 0.74;
    const lz = c + Math.sin(a) * R * 0.74;
    const h = (top - thick) / 2;
    return (x, y, z) => box(legR, h + 1, legR, legR * 0.6)(x - lx, y - h, z - lz);
  });
  voxelize(grid, union(plate, ...legs), [0, 0, 0], size, (x, y, z) => {
    const r = Math.hypot(x + 0.5 - c, z + 0.5 - c);
    const h = hash3(x, y, z, seed + 3);
    if (y < top - thick - 0.5) return PALETTE_INDEX.wood;
    // A soft hint of growth rings on the turned plate: broken, low contrast,
    // so the stand stays quieter than the donut it carries (reference 04).
    const ring = Math.sin(((r + valueNoise3(x * 0.08, 0, z * 0.08, seed) * 4) * voxel) / 0.024);
    if (ring > 0.94 && h > 0.6) return PALETTE_INDEX.standWoodDeep;
    return PALETTE_INDEX.standWood;
  });
  grid.takeDirty();
  return grid;
}
