import { PALETTE_INDEX as P, hash3 } from '../palette';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/**
 * The candy-striped lighthouse crowned by a glowing glazed donut (K-03) at
 * 1/32 m: a tapering spiral-striped tower on a dough-stone plinth, a mint
 * gallery with railings, a lantern band that glows, a red cap, and a donut lamp
 * standing on top (in the local XY plane, so it faces ±z).
 *
 * Base center is (LIGHTHOUSE_SIZE.x/2, 0, LIGHTHOUSE_SIZE.z/2); the lamp center
 * is `LIGHTHOUSE_LAMP`.
 */
export const LIGHTHOUSE_SIZE = [56, 200, 56] as const;
const C = 28;
const GALLERY = 132;
export const LIGHTHOUSE_LAMP = [C, 178, C] as const;

export function buildLighthouse(): VoxelGrid {
  const grid = new VoxelGrid();
  grid.generate(0, 0, 0, LIGHTHOUSE_SIZE[0], LIGHTHOUSE_SIZE[1], LIGHTHOUSE_SIZE[2], (x, y, z) => {
    const dx = x + 0.5 - C;
    const dz = z + 0.5 - C;
    const r = Math.hypot(dx, dz);
    const a = Math.atan2(dz, dx);

    // Plinth: two rounded steps of dough stone.
    if (y < 6)
      return r < 22 - (y > 2 ? 2 : 0)
        ? hash3(x >> 1, y, z >> 1, 3) > 0.5
          ? P.pebble
          : P.doughToasted
        : 0;

    // Tower: tapering, hollow, candy-cane spiral stripes.
    if (y < GALLERY) {
      const R = 17 - (y - 6) * 0.045;
      if (r < R && r >= R - 3) {
        // Door facing +x (toward the lagoon), arched.
        if (dx > 0 && Math.abs(dz) < 5 && (y < 26 || Math.hypot(dz, y - 26) < 5)) {
          return r < R - 1.5 ? P.woodDark : 0;
        }
        // Two porthole windows.
        for (const wy of [62, 100]) {
          if (dx > 0 && Math.hypot(dz, y - wy) < 3.6) return r < R - 1.5 ? P.windowGlow : 0;
          if (dx > 0 && Math.hypot(dz, y - wy) < 5) return P.candyCream;
        }
        const turn = a / (Math.PI * 2) + y / 34;
        return turn - Math.floor(turn) < 0.5 ? P.candyRed : P.candyCream;
      }
      return 0;
    }

    // Gallery deck, railing posts and top rail.
    if (y < GALLERY + 4) return r < 21 ? (y === GALLERY + 3 ? P.mint : P.woodLight) : 0;
    if (y < GALLERY + 13) {
      if (r >= 19 && r < 21) {
        if (y >= GALLERY + 11) return P.mint;
        const post = ((a / (Math.PI * 2)) * 24 + 24) % 1;
        if (post < 0.22) return P.mint;
      }
    }

    // Lantern room: cream drum with a glowing band.
    if (y >= GALLERY + 4 && y < GALLERY + 24 && r < 11) {
      if (r < 8) return 0;
      if (y >= GALLERY + 9 && y < GALLERY + 19) {
        const mullion = ((a / (Math.PI * 2)) * 8 + 8) % 1 < 0.14;
        return mullion ? P.candyCream : P.lampGlow;
      }
      return P.candyCream;
    }
    // Cap: a squat red dome.
    if (y >= GALLERY + 24 && y < GALLERY + 32) {
      const capR = 13 - (y - GALLERY - 24) * 1.5;
      if (r < capR) return P.candyRed;
    }

    // Donut lamp standing on top (torus in the XY plane).
    const [lx, ly, lz] = LIGHTHOUSE_LAMP;
    const q = Math.hypot(x + 0.5 - lx, y + 0.5 - ly) - 10;
    const t = Math.hypot(q, z + 0.5 - lz);
    if (t < 5) {
      const top = y + 0.5 > ly - 3;
      return top || Math.abs(z + 0.5 - lz) > 2.5 ? P.lampGlow : P.doughGolden;
    }
    // A short dough stand under the lamp.
    if (y >= GALLERY + 31 && y < ly - 14 && r < 4) return P.doughToasted;
    return 0;
  });
  grid.takeDirty();
  return grid;
}
