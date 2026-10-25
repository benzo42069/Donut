import { PALETTE_INDEX as P, hash3 } from '../palette';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/**
 * The Dunk Day pier (K-03) at 1/32 m: wooden stairs that step down from the
 * lagoon rim to a plank dock on posts standing in the milk.
 *
 * Local frame: +x runs from the rim out over the lagoon, z ∈ [0, PIER_WIDTH).
 * y = 0 is the milk surface; the stairs start at `topY` (rim height in voxels).
 */
export const PIER_WIDTH = 34;
export const PIER_LENGTH = 124;
const DECK = 7;

export function buildPier(topY: number): VoxelGrid {
  const grid = new VoxelGrid();
  const stairRun = topY - DECK; // 45° flight
  const stairStart = 4;
  const deckStart = stairStart + stairRun;

  const plank = (x: number, z: number, along: 'x' | 'z'): number => {
    const k = along === 'x' ? z : x;
    if (k % 6 === 5) return 0;
    return hash3(Math.floor(k / 6), 0, along === 'x' ? Math.floor(x / 24) : z, 5) > 0.5
      ? P.woodLight
      : P.wood;
  };

  // Stairs: 6-voxel treads with a stringer on each side.
  for (let x = 0; x < deckStart; x++) {
    const stepTop = x < stairStart ? topY : topY - Math.floor((x - stairStart) / 6) * 6 - 6;
    for (let z = 0; z < PIER_WIDTH; z++) {
      const side = z < 3 || z >= PIER_WIDTH - 3;
      if (side) {
        // Stringer: a sloped beam under the treads.
        const line = topY - (x - stairStart) - 4;
        for (let y = Math.max(DECK - 2, line - 5); y < Math.min(topY + 1, line + 6); y++)
          grid.set(x, y, z, P.woodDark);
        continue;
      }
      for (let y = stepTop - 2; y < stepTop; y++)
        grid.set(x, y, z, x % 6 === 0 && x >= stairStart ? P.woodDark : P.woodLight);
    }
  }

  // Deck.
  for (let x = deckStart; x < PIER_LENGTH; x++) {
    for (let z = 0; z < PIER_WIDTH; z++) {
      const v = plank(x, z, 'z');
      if (v) for (let y = DECK - 2; y < DECK; y++) grid.set(x, y, z, v);
    }
    // Edge beams under the deck.
    for (const z of [1, PIER_WIDTH - 2])
      for (let y = DECK - 5; y < DECK - 2; y++) grid.set(x, y, z, P.woodDark);
  }

  // Posts: in the milk under the deck and stairs, taller with rope caps at the dock.
  const posts: [number, number][] = pierPostXs(topY).flatMap((x): [number, number][] => [
    [x, 0],
    [x, PIER_WIDTH - 4],
  ]);
  for (const [px, pz] of posts) {
    const tall = px >= deckStart;
    const top = tall ? DECK + 12 : topY - Math.floor(stairRun / 2) - 6;
    for (let y = -40; y < top; y++) {
      for (let dx = 0; dx < 4; dx++) {
        for (let dz = 0; dz < 4; dz++) {
          const rope = tall && y >= DECK + 4 && y < DECK + 7;
          grid.set(px + dx, y, pz + dz, rope ? P.doughCrumb : y === top - 1 ? P.woodLight : P.wood);
        }
      }
    }
  }

  // Handrails along the stairs: posts with a sloped rail.
  for (const z of [1, PIER_WIDTH - 2]) {
    for (let x = stairStart; x < deckStart; x++) {
      const line = topY - (x - stairStart) + 22;
      grid.set(x, line, z, P.woodLight);
      grid.set(x, line - 1, z, P.woodLight);
      if ((x - stairStart) % 18 === 0)
        for (let y = line - 24; y < line; y++) grid.set(x, y, z, P.wood);
    }
  }

  grid.takeDirty();
  return grid;
}

/** Local x (voxels) of each pair of posts; the last is the dock's end. */
export function pierPostXs(topY: number): number[] {
  const deckStart = 4 + topY - DECK;
  const xs = [4 + Math.floor((topY - DECK) / 2)];
  for (let x = deckStart; x < PIER_LENGTH - 20; x += 26) xs.push(x);
  xs.push(PIER_LENGTH - 4);
  return xs;
}

/** A candy-striped rubber ring (game design §11: you bob up in one). */
export function buildRubberRing(): VoxelGrid {
  const grid = new VoxelGrid();
  const R = 7;
  const r = 3;
  for (let x = 0; x < 22; x++)
    for (let y = 0; y < 8; y++)
      for (let z = 0; z < 22; z++) {
        const px = x + 0.5 - 11;
        const py = y + 0.5 - 4;
        const pz = z + 0.5 - 11;
        const q = Math.hypot(px, pz) - R;
        if (Math.hypot(q, py) > r) continue;
        const a = Math.atan2(pz, px);
        grid.set(
          x,
          y,
          z,
          Math.floor(((a + Math.PI) / (Math.PI * 2)) * 8) % 2 ? P.candyRed : P.candyCream,
        );
      }
  grid.takeDirty();
  return grid;
}
