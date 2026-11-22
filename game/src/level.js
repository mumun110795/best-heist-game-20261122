// The Meridian Museum at night: rooms, walls with door gaps, cover, shadow, loot,
// patrol routes and camera mounts. Pure data plus the geometry every other file
// shares (collision and line-of-sight against the same rectangles).

/** A rectangle: {x, y, w, h} in canvas pixels. Walls and cover both block movement and sight. */
function rect(x, y, w, h) {
  return { x, y, w, h };
}

// Outer shell. The bottom wall has a gap at the foyer doors: the getaway van waits there.
export const WALLS = [
  rect(0, 46, 1280, 14), // north, under the HUD bar
  rect(0, 786, 596, 14), rect(684, 786, 596, 14), // south, split by the van doors
  rect(0, 46, 14, 754), // west
  rect(1266, 46, 14, 754), // east
  // The Vault (top centre): west and east walls carry side doors from the wings,
  // the south wall carries the main door. Three ways in, if you can time them.
  rect(490, 60, 14, 68), rect(490, 176, 14, 64), // vault west wall, side-door gap y 128..176
  rect(776, 60, 14, 68), rect(776, 176, 14, 64), // vault east wall, side-door gap y 128..176
  rect(490, 226, 116, 14), rect(674, 226, 116, 14), // vault south wall, main door gap x 606..674
  // Jade Wing (top left) south wall, door down to the West Gallery at x 150..214.
  rect(14, 226, 136, 14), rect(214, 226, 276, 14),
  // Coin Wing (top right) south wall, door down to the East Gallery at x 1066..1130.
  rect(790, 226, 276, 14), rect(1130, 226, 136, 14),
  // West Gallery east wall, door to the Grand Hall at y 372..428; its south wall is solid.
  rect(326, 240, 14, 132), rect(326, 428, 14, 132),
  rect(14, 546, 326, 14),
  // East Gallery west wall, door to the Grand Hall at y 372..428; its south wall is solid.
  rect(940, 240, 14, 132), rect(940, 428, 14, 132),
  rect(940, 546, 326, 14),
  // Grand Hall south wall, wide door down to the Foyer at x 596..684.
  rect(340, 546, 256, 14), rect(684, 546, 256, 14),
  // Foyer side walls: the foyer is its own room; the corners beside it are sealed stores.
  rect(440, 560, 14, 226),
  rect(826, 560, 14, 226),
];
// Display cases, pillars and planters: the cover a thief crosses a room behind.
export const COVER = [
  rect(604, 108, 72, 40), // the crown case itself, centre of the Vault
  rect(520, 92, 44, 24), rect(716, 92, 44, 24), // vault side cases
  rect(430, 320, 64, 28), rect(756, 320, 64, 28), // Grand Hall cases
  rect(430, 452, 64, 28), rect(756, 452, 64, 28),
  rect(520, 380, 26, 26), rect(734, 380, 26, 26), // Grand Hall pillars
  rect(70, 330, 56, 26), rect(200, 452, 56, 26), rect(250, 300, 24, 24), // West Gallery
  rect(1054, 330, 56, 26), rect(1024, 452, 56, 26), rect(1010, 300, 24, 24), // East Gallery
  rect(120, 120, 56, 26), rect(330, 150, 56, 26), // Jade Wing
  rect(900, 120, 56, 26), rect(1100, 150, 56, 26), // Coin Wing
  rect(480, 640, 40, 24), rect(760, 640, 40, 24), // foyer planters
];

// Benches along the gallery walls: low wooden seating a thief can crouch behind.
// They hug the north walls, clear of every patrol line, door path and sight test.
export const BENCHES = [
  rect(452, 262, 110, 16), rect(718, 262, 110, 16), // Grand Hall, under the paintings
  rect(96, 262, 110, 16), // West Gallery
  rect(1074, 262, 110, 16), // East Gallery
];

export const BLOCKERS = WALLS.concat(COVER, BENCHES);

// Dark alcoves and unlit strips: standing in shadow halves how fast you are seen.
export const SHADOWS = [
  rect(20, 250, 44, 290), rect(1216, 250, 44, 290),
  rect(500, 66, 58, 58), rect(722, 66, 58, 58),
  rect(348, 484, 54, 54), rect(878, 484, 54, 54),
  rect(20, 66, 54, 54), rect(1206, 66, 54, 54),
];

// Room names, drawn faint on the floor so a screenshot reads as a museum, not a grid.
export const ROOM_LABELS = [
  { text: 'THE VAULT', x: 640, y: 210 },
  { text: 'JADE WING', x: 250, y: 210 },
  { text: 'COIN WING', x: 1030, y: 210 },
  { text: 'WEST GALLERY', x: 176, y: 528 },
  { text: 'EAST GALLERY', x: 1104, y: 528 },
  { text: 'GRAND HALL', x: 640, y: 528 },
  { text: 'FOYER', x: 640, y: 700 },
];

export const THIEF_START = { x: 640, y: 736 };
export const EXIT_ZONE = rect(592, 752, 96, 48); // the van doors: cross with the crown to win

// Treasures. The crown is the job; the rest are profit for the bold, each on its case.
export const LOOT = [
  { id: 'crown', name: 'The Ivory Crown', x: 640, y: 128, value: 1000, crown: true },
  { id: 'jade', name: 'Jade Cat of Ankor', x: 148, y: 133, value: 300 },
  { id: 'ruby', name: 'The Sun Ruby', x: 928, y: 133, value: 300 },
  { id: 'painting', name: 'Old Master canvas', x: 228, y: 465, value: 250 },
  { id: 'chalice', name: 'Silver Chalice', x: 1052, y: 465, value: 250 },
  { id: 'pearls', name: 'Pearl Necklace', x: 788, y: 333, value: 200 },
  { id: 'coins', name: 'Pirate Coin Hoard', x: 1128, y: 163, value: 200 },
];

// Guard patrols: loops of waypoints, walked in order, with a look-around pause at each.
export const PATROLS = [
  [{ x: 420, y: 300 }, { x: 860, y: 300 }, { x: 860, y: 500 }, { x: 420, y: 500 }], // Grand Hall
  [{ x: 84, y: 300 }, { x: 270, y: 300 }, { x: 270, y: 500 }, { x: 84, y: 500 }], // West Gallery
  [{ x: 1010, y: 300 }, { x: 1196, y: 300 }, { x: 1196, y: 500 }, { x: 1010, y: 500 }], // East Gallery
  [{ x: 536, y: 192 }, { x: 744, y: 192 }, { x: 640, y: 272 }, { x: 640, y: 192 }], // Vault and its door
];

// Cameras: a mount point, the direction it rests facing (radians, 0 = east, PI/2 = south),
// and a sweep around that direction.
export const CAMERAS = [
  { x: 818, y: 668, facing: Math.PI }, // on the foyer east wall, watching across the foyer floor
  { x: 640, y: 246, facing: Math.PI / 2 }, // over the Vault's main door, watching the Grand Hall
  { x: 1103, y: 246, facing: Math.PI / 2 }, // over the East Gallery's north door
];

/** True when the point (x, y) with radius r overlaps any blocker rectangle. */
export function circleHitsBlockers(x, y, r) {
  for (const b of BLOCKERS) {
    const nearX = Math.max(b.x, Math.min(x, b.x + b.w));
    const nearY = Math.max(b.y, Math.min(y, b.y + b.h));
    const dx = x - nearX;
    const dy = y - nearY;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

/** Move a circle by (dx, dy), sliding along whatever it hits; returns the new position. */
export function slideMove(x, y, r, dx, dy) {
  let nx = x + dx;
  if (circleHitsBlockers(nx, y, r)) nx = x;
  let ny = y + dy;
  if (circleHitsBlockers(nx, ny, r)) ny = y;
  return { x: nx, y: ny };
}

/** True when the segment (x1,y1)-(x2,y2) crosses any of the given rectangles. */
export function segmentBlocked(x1, y1, x2, y2, rects) {
  for (const b of rects) {
    if (segmentHitsRect(x1, y1, x2, y2, b)) return true;
  }
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, b) {
  // Liang-Barsky clip: the segment survives inside the rect only if it truly crosses it.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - b.x, b.x + b.w - x1, y1 - b.y, b.y + b.h - y1];
  for (let i = 0; i < 4; i += 1) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return t0 <= t1;
}

/** True when the point stands in any shadow rectangle. */
export function inShadow(x, y) {
  for (const s of SHADOWS) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
  }
  return false;
}

/** True when the point is inside the rectangle (used for the exit zone). */
export function insideRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
