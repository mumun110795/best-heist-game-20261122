// Everything the player (and the judge's screenshot) sees: the museum dressed as a
// museum — textured floors, rugs, lamps, cases with artifacts inside, statues and
// planters — plus flashlight and camera cones with soft edges, the figures with
// bodies you can read at a glance, the loot, and a HUD of framed panels with the
// alarm meter. Safe cover reads dark, danger reads warm, loot reads gold.
// All decoration is drawn from fixed data and coordinate hashes: no randomness,
// so the frame is identical every time it is drawn.
import { ALARM, CAMERA, GUARD, VIEW } from './config.js';
import { BENCHES, COVER, EXIT_ZONE, LOOT, ROOM_LABELS, SHADOWS, WALLS } from './level.js';
import { GUARD_CALM, GUARD_CHASE, GUARD_CURIOUS, GUARD_HUNT } from './guards.js';
import { cameraWatcher } from './vision.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_AWAY = 'away';

// Floor tints per room: carpet, parquet, marble — a museum, not a tile set.
const FLOORS = [
  { x: 14, y: 60, w: 1272, h: 740, fill: '#23202b', kind: 'void' }, // the dark between rooms
  { x: 504, y: 74, w: 272, h: 152, fill: '#4a2430', kind: 'carpet' }, // Vault, deep red carpet
  { x: 28, y: 74, w: 448, h: 152, fill: '#274036', kind: 'carpet' }, // Jade Wing, green hush
  { x: 804, y: 74, w: 448, h: 152, fill: '#3d3423', kind: 'carpet' }, // Coin Wing, gilt brown
  { x: 28, y: 254, w: 298, h: 292, fill: '#3a2d20', kind: 'parquet' }, // West Gallery, parquet
  { x: 954, y: 254, w: 298, h: 292, fill: '#3a2d20', kind: 'parquet' }, // East Gallery, parquet
  { x: 354, y: 254, w: 572, h: 292, fill: '#333743', kind: 'marble' }, // Grand Hall, cool marble
  { x: 454, y: 574, w: 358, h: 198, fill: '#2c2c33', kind: 'stone' }, // Foyer, stone
];

// Rugs: flat floor dressing, walked over like any carpet in the building.
const RUGS = [
  { x: 556, y: 82, w: 168, h: 92, fill: '#5d1f28', trim: '#c9a227' }, // under the crown case
  { x: 168, y: 98, w: 224, h: 68, fill: '#1d4d38', trim: '#c9a227' }, // Jade Wing
  { x: 888, y: 98, w: 224, h: 68, fill: '#54401e', trim: '#d9b45c' }, // Coin Wing
  { x: 478, y: 336, w: 324, h: 148, fill: '#57222c', trim: '#b08d3e' }, // Grand Hall centre
  { x: 586, y: 596, w: 108, h: 156, fill: '#1f4048', trim: '#7fa8a0' }, // foyer runner to the van
];

// Floor lamps: a warm pool of light on the floor and a small brass fixture.
const LAMPS = [
  { x: 374, y: 400 }, { x: 906, y: 400 }, // Grand Hall sides
  { x: 476, y: 736 }, { x: 784, y: 736 }, // Foyer, flanking the runner
  { x: 250, y: 88 }, // Jade Wing
  { x: 1030, y: 88 }, // Coin Wing
  { x: 48, y: 404 }, // West Gallery
  { x: 1234, y: 298 }, // East Gallery
];

// Potted plants against the walls and in the shadowed corners.
const PLANTS = [
  { x: 520, y: 88 }, { x: 760, y: 88 }, // Vault corners
  { x: 46, y: 90 }, // Jade Wing
  { x: 1234, y: 90 }, // Coin Wing
  { x: 370, y: 270 }, { x: 910, y: 270 }, { x: 372, y: 528 }, { x: 908, y: 528 }, // Grand Hall corners
  { x: 46, y: 520 }, // West Gallery
  { x: 1234, y: 520 }, // East Gallery
  { x: 474, y: 600 }, { x: 792, y: 600 }, // Foyer corners
];

// Framed art panels hung on the walls: thin gilt frames with a small canvas inside.
const WALL_ART = [
  { x: 566, y: 62, w: 52, h: 9 }, { x: 662, y: 62, w: 52, h: 9 }, // Vault north wall
  { x: 110, y: 62, w: 56, h: 9 }, { x: 300, y: 62, w: 56, h: 9 }, // Jade Wing north wall
  { x: 872, y: 62, w: 56, h: 9 }, { x: 1082, y: 62, w: 56, h: 9 }, // Coin Wing north wall
  { x: 420, y: 242, w: 56, h: 9 }, { x: 804, y: 242, w: 56, h: 9 }, // Grand Hall north edge
  { x: 16, y: 318, w: 9, h: 56 }, { x: 16, y: 436, w: 9, h: 56 }, // West Gallery west wall
  { x: 1255, y: 318, w: 9, h: 56 }, { x: 1255, y: 436, w: 9, h: 56 }, // East Gallery east wall
  { x: 443, y: 600, w: 8, h: 54 }, { x: 829, y: 600, w: 8, h: 54 }, // Foyer side walls
];
const ART_CANVAS = ['#31435f', '#5f3138', '#33523c', '#6b5626', '#463a5e', '#274b56'];

const LOOT_STYLE = {
  crown: { fill: '#ffd94d', gem: '#e5484d' },
  jade: { fill: '#57d9a3', gem: '#1f7a54' },
  ruby: { fill: '#ff6b6b', gem: '#a11d2e' },
  painting: { fill: '#c9a86a', gem: '#5d4a26' },
  chalice: { fill: '#e8e4da', gem: '#9a958a' },
  pearls: { fill: '#f2ead8', gem: '#cbbf9f' },
  coins: { fill: '#ffcf5c', gem: '#b8860b' },
};

/** Deterministic 0..1 hash of a coordinate pair: texture detail that never flickers. */
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// A vision cone in three nested passes: the angular edges fall off softly
// instead of ending in a hard line, and the light still fades with distance.
function drawCone(ctx, watcher, rgb, peak) {
  const passes = [[1, 0.45], [0.76, 0.7], [0.5, 1]];
  for (const [scale, share] of passes) {
    const gradient = ctx.createRadialGradient(watcher.x, watcher.y, 8, watcher.x, watcher.y, watcher.range);
    gradient.addColorStop(0, `rgba(${rgb}, ${(peak * share).toFixed(3)})`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(watcher.x, watcher.y);
    ctx.arc(watcher.x, watcher.y, watcher.range, watcher.facing - watcher.halfAngle * scale, watcher.facing + watcher.halfAngle * scale);
    ctx.closePath();
    ctx.fill();
  }
}

function textureCarpet(ctx, r) {
  ctx.strokeStyle = 'rgba(255, 235, 190, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = -r.h; k < r.w + r.h; k += 26) {
    ctx.moveTo(r.x + k, r.y);
    ctx.lineTo(r.x + k + r.h, r.y + r.h);
    ctx.moveTo(r.x + k + r.h, r.y);
    ctx.lineTo(r.x + k, r.y + r.h);
  }
  ctx.stroke();
}

function textureParquet(ctx, r) {
  ctx.beginPath();
  for (let y = r.y + 15; y < r.y + r.h; y += 15) {
    ctx.moveTo(r.x, y);
    ctx.lineTo(r.x + r.w, y);
  }
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.13)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  let row = 0;
  for (let y = r.y; y < r.y + r.h; y += 15, row += 1) {
    const offset = (row % 2) * 34;
    for (let x = r.x + offset; x < r.x + r.w; x += 68) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, Math.min(y + 15, r.y + r.h));
    }
  }
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.09)';
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 214, 150, 0.028)';
  for (let y = r.y, rowIndex = 0; y < r.y + r.h; y += 30, rowIndex += 1) ctx.fillRect(r.x, y, r.w, 15);
}

function textureMarble(ctx, r) {
  // Chequers, faint, with a tile grid over them.
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  for (let gx = r.x; gx < r.x + r.w; gx += 52) {
    for (let gy = r.y; gy < r.y + r.h; gy += 52) {
      if ((((gx - r.x) + (gy - r.y)) / 52) % 2 === 0) ctx.fillRect(gx, gy, 52, 52);
    }
  }
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.10)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = r.x + 52; gx < r.x + r.w; gx += 52) { ctx.moveTo(gx, r.y); ctx.lineTo(gx, r.y + r.h); }
  for (let gy = r.y + 52; gy < r.y + r.h; gy += 52) { ctx.moveTo(r.x, gy); ctx.lineTo(r.x + r.w, gy); }
  ctx.stroke();
  // Veining: a light crack wandering across some tiles, fixed by the hash.
  ctx.strokeStyle = 'rgba(235, 240, 250, 0.055)';
  ctx.lineWidth = 1.2;
  for (let gx = r.x; gx < r.x + r.w; gx += 52) {
    for (let gy = r.y; gy < r.y + r.h; gy += 52) {
      if (hash2(gx, gy) > 0.5) {
        ctx.beginPath();
        ctx.moveTo(gx + 6, gy + 42);
        ctx.lineTo(gx + 24 + hash2(gy, gx) * 8, gy + 27);
        ctx.lineTo(gx + 43, gy + 9);
        ctx.stroke();
      }
    }
  }
}

function textureStone(ctx, r) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = r.x + 46; gx < r.x + r.w; gx += 46) { ctx.moveTo(gx, r.y); ctx.lineTo(gx, r.y + r.h); }
  for (let gy = r.y + 46; gy < r.y + r.h; gy += 46) { ctx.moveTo(r.x, gy); ctx.lineTo(r.x + r.w, gy); }
  ctx.stroke();
  for (let gx = r.x; gx < r.x + r.w; gx += 46) {
    for (let gy = r.y; gy < r.y + r.h; gy += 46) {
      if (hash2(gx, gy) > 0.62) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
        ctx.fillRect(gx, gy, 46, 46);
      }
    }
  }
}

const TEXTURES = { carpet: textureCarpet, parquet: textureParquet, marble: textureMarble, stone: textureStone };

/** Soft shading just inside a room's edges, and a pale trim line: walls feel set into the floor. */
function innerShade(ctx, r) {
  const d = 14;
  let g = ctx.createLinearGradient(0, r.y, 0, r.y + d);
  g.addColorStop(0, 'rgba(0,0,0,0.20)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(r.x, r.y, r.w, d);
  g = ctx.createLinearGradient(0, r.y + r.h, 0, r.y + r.h - d);
  g.addColorStop(0, 'rgba(0,0,0,0.20)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(r.x, r.y + r.h - d, r.w, d);
  g = ctx.createLinearGradient(r.x, 0, r.x + d, 0);
  g.addColorStop(0, 'rgba(0,0,0,0.16)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(r.x, r.y, d, r.h);
  g = ctx.createLinearGradient(r.x + r.w, 0, r.x + r.w - d, 0);
  g.addColorStop(0, 'rgba(0,0,0,0.16)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(r.x + r.w - d, r.y, d, r.h);
  ctx.strokeStyle = 'rgba(255,236,190,0.08)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
}

function drawRug(ctx, rug) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(rug.x + 2, rug.y + 3, rug.w, rug.h);
  ctx.fillStyle = rug.fill;
  ctx.fillRect(rug.x, rug.y, rug.w, rug.h);
  ctx.strokeStyle = rug.trim;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.strokeRect(rug.x + 4, rug.y + 4, rug.w - 8, rug.h - 8);
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.strokeRect(rug.x + 9, rug.y + 9, rug.w - 18, rug.h - 18);
  ctx.globalAlpha = 0.4;
  const cx = rug.x + rug.w / 2;
  const cy = rug.y + rug.h / 2;
  const dw = Math.min(rug.w, rug.h) * 0.26;
  ctx.beginPath();
  ctx.moveTo(cx, cy - dw);
  ctx.lineTo(cx + dw, cy);
  ctx.lineTo(cx, cy + dw);
  ctx.lineTo(cx - dw, cy);
  ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawFloors(ctx) {
  for (const floor of FLOORS) {
    ctx.fillStyle = floor.fill;
    ctx.fillRect(floor.x, floor.y, floor.w, floor.h);
  }
  for (const floor of FLOORS) {
    const texture = TEXTURES[floor.kind];
    if (!texture) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(floor.x, floor.y, floor.w, floor.h);
    ctx.clip();
    texture(ctx, floor);
    ctx.restore();
    innerShade(ctx, floor);
  }
  for (const rug of RUGS) drawRug(ctx, rug);
  // Lamp light pools wash the floor before anything stands on it.
  for (const lamp of LAMPS) {
    const pool = ctx.createRadialGradient(lamp.x, lamp.y, 6, lamp.x, lamp.y, 88);
    pool.addColorStop(0, 'rgba(255, 186, 92, 0.15)');
    pool.addColorStop(1, 'rgba(255, 186, 92, 0)');
    ctx.fillStyle = pool;
    ctx.fillRect(lamp.x - 88, lamp.y - 88, 176, 176);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  for (const shadow of SHADOWS) ctx.fillRect(shadow.x, shadow.y, shadow.w, shadow.h);
  ctx.font = '600 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  for (const label of ROOM_LABELS) ctx.fillText(label.text, label.x, label.y);
}

function drawExit(ctx, world) {
  const zone = EXIT_ZONE;
  const pulse = world.crownTaken ? 0.55 + 0.3 * Math.sin(world.time * 6) : 0.25;
  ctx.fillStyle = `rgba(120, 220, 160, ${pulse * 0.35})`;
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  // The van itself, nose out of the south doors.
  ctx.fillStyle = '#171a21';
  rr(ctx, zone.x + 12, zone.y + 8, zone.w - 24, 34, 4);
  ctx.fill();
  ctx.strokeStyle = '#2c3038';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#33506b';
  ctx.fillRect(zone.x + 20, zone.y + 14, zone.w - 40, 10);
  ctx.fillStyle = '#0a0a0c';
  ctx.beginPath();
  ctx.arc(zone.x + 26, zone.y + 44, 5, 0, Math.PI * 2);
  ctx.arc(zone.x + zone.w - 26, zone.y + 44, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(140, 240, 180, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
  ctx.font = '700 12px Georgia, serif';
  ctx.fillStyle = 'rgba(190, 255, 215, 0.9)';
  ctx.fillText('GETAWAY VAN', zone.x + zone.w / 2, zone.y - 6);
}

// A small artifact silhouette inside a case that holds no treasure: vase, bust,
// gems, urn, mask or scroll, chosen by the case's own coordinates.
function drawArtifact(ctx, kind, cx, cy) {
  ctx.fillStyle = '#211a12';
  ctx.strokeStyle = 'rgba(255, 220, 150, 0.28)';
  ctx.lineWidth = 1;
  if (kind === 0) { // vase
    ellipse(ctx, cx, cy + 2, 6, 7);
    ctx.fillRect(cx - 2.5, cy - 8, 5, 5);
  } else if (kind === 1) { // bust
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy + 8);
    ctx.lineTo(cx - 3.5, cy);
    ctx.lineTo(cx + 3.5, cy);
    ctx.lineTo(cx + 7, cy + 8);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 2) { // gems
    for (const [dx, dy, s] of [[-6, 3, 4.5], [1, -3, 5.5], [7, 4, 4]]) {
      ctx.beginPath();
      ctx.moveTo(cx + dx, cy + dy - s);
      ctx.lineTo(cx + dx + s * 0.7, cy + dy);
      ctx.lineTo(cx + dx, cy + dy + s);
      ctx.lineTo(cx + dx - s * 0.7, cy + dy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (kind === 3) { // urn
    ellipse(ctx, cx, cy + 1, 7.5, 6.5);
    ctx.fillRect(cx - 3, cy - 8, 6, 4);
    ctx.beginPath();
    ctx.arc(cx - 8, cy, 2.6, Math.PI * 0.6, Math.PI * 1.7);
    ctx.arc(cx + 8, cy, 2.6, Math.PI * 1.3, Math.PI * 0.4, true);
    ctx.stroke();
  } else if (kind === 4) { // mask
    ellipse(ctx, cx, cy, 7, 8.5);
    ctx.fillStyle = '#3a2c1c';
    ellipse(ctx, cx - 2.8, cy - 1.5, 1.5, 1);
    ellipse(ctx, cx + 2.8, cy - 1.5, 1.5, 1);
  } else { // scroll
    rr(ctx, cx - 9, cy - 2.5, 18, 5, 2.5);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 9, cy, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 9, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCase(ctx, block, world) {
  const cx = block.x + block.w / 2;
  const cy = block.y + block.h / 2;
  const grand = cx === 640 && cy === 128; // the crown's own case
  const lootHere = LOOT.find((loot) => Math.abs(loot.x - cx) < 2 && Math.abs(loot.y - cy) < 2);
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.fillRect(block.x + 3, block.y + 4, block.w, block.h);
  ctx.fillStyle = '#5d4a30';
  ctx.fillRect(block.x, block.y, block.w, block.h);
  ctx.fillStyle = grand ? '#7a1f28' : '#3a2c1c'; // velvet inside
  ctx.fillRect(block.x + 4, block.y + 4, block.w - 8, block.h - 8);
  if (lootHere) {
    // A little stand the treasure sits on; the treasure itself is drawn later.
    ctx.fillStyle = '#2c2118';
    ctx.fillRect(cx - 10, cy + 1, 20, 7);
    ctx.fillStyle = 'rgba(255, 215, 130, 0.5)';
    ctx.fillRect(cx - 10, cy + 1, 20, 1.5);
  } else {
    drawArtifact(ctx, Math.floor(hash2(block.x, block.y) * 6), cx, cy);
  }
  // Glass over everything, with a diagonal shine, and a brass plaque.
  ctx.fillStyle = 'rgba(173, 216, 255, 0.15)';
  ctx.fillRect(block.x + 3, block.y + 3, block.w - 6, block.h - 6);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.beginPath();
  ctx.moveTo(block.x + 6, block.y + block.h - 4);
  ctx.lineTo(block.x + block.w * 0.45, block.y + 3);
  ctx.lineTo(block.x + block.w * 0.62, block.y + 3);
  ctx.lineTo(block.x + 17, block.y + block.h - 4);
  ctx.closePath();
  ctx.fill();
  if (grand) {
    ctx.strokeStyle = 'rgba(200, 230, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 21, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
  }
  ctx.strokeStyle = '#2e2115';
  ctx.lineWidth = 2;
  ctx.strokeRect(block.x, block.y, block.w, block.h);
  ctx.strokeStyle = 'rgba(255, 215, 130, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(block.x + 1.5, block.y + 1.5, block.w - 3, block.h - 3);
  ctx.fillStyle = 'rgba(201, 162, 39, 0.85)';
  ctx.fillRect(cx - 8, block.y + block.h - 6, 16, 3);
}

function drawColumn(ctx, block) {
  const cx = block.x + block.w / 2;
  const cy = block.y + block.h / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ellipse(ctx, cx + 2, cy + 4, 13, 11);
  ctx.fillStyle = '#b9bfc9';
  ctx.fillRect(block.x, block.y, block.w, 5);
  ctx.fillRect(block.x, block.y + block.h - 5, block.w, 5);
  const shaft = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 13);
  shaft.addColorStop(0, '#e6ebf2');
  shaft.addColorStop(1, '#99a1ae');
  ctx.fillStyle = shaft;
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#78808c';
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function drawStatue(ctx, block) {
  const cx = block.x + block.w / 2;
  const cy = block.y + block.h / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.fillRect(block.x + 2, block.y + 3, block.w, block.h);
  ctx.fillStyle = '#6b6f78';
  ctx.fillRect(block.x, block.y, block.w, block.h);
  ctx.strokeStyle = '#3c3f46';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(block.x, block.y, block.w, block.h);
  // A small bronze figure: head, torso, one arm raised.
  ctx.strokeStyle = '#a87f3f';
  ctx.fillStyle = '#a87f3f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ellipse(ctx, cx, cy + 3, 4.6, 6);
  ctx.beginPath();
  ctx.moveTo(cx + 3, cy);
  ctx.lineTo(cx + 8, cy - 6);
  ctx.stroke();
}

function drawPlanter(ctx, block) {
  const cx = block.x + block.w / 2;
  const cy = block.y + block.h / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(block.x + 2, block.y + 3, block.w, block.h);
  ctx.fillStyle = '#4a3626';
  ctx.fillRect(block.x, block.y, block.w, block.h);
  ctx.strokeStyle = '#2e2115';
  ctx.lineWidth = 2;
  ctx.strokeRect(block.x, block.y, block.w, block.h);
  ctx.fillStyle = '#2c2016';
  ctx.fillRect(block.x + 3, block.y + 3, block.w - 6, block.h - 6);
  const greens = ['#2e6b3e', '#3c8450', '#275c34', '#46995c'];
  for (let i = 0; i < 7; i += 1) {
    const a = hash2(block.x + i * 13, block.y) * Math.PI * 2;
    const d = 4 + hash2(block.y, block.x + i * 7) * (block.w / 2 - 9);
    ctx.fillStyle = greens[i % greens.length];
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.55, 4.5 + hash2(i, block.x) * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBench(ctx, bench) {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(bench.x + 2, bench.y + 3, bench.w, bench.h);
  ctx.fillStyle = '#6e4f2c';
  ctx.fillRect(bench.x, bench.y, bench.w, bench.h);
  ctx.fillStyle = 'rgba(255, 220, 160, 0.16)';
  ctx.fillRect(bench.x, bench.y, bench.w, 3);
  ctx.strokeStyle = 'rgba(40, 26, 12, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bench.x, bench.y + bench.h / 3);
  ctx.lineTo(bench.x + bench.w, bench.y + bench.h / 3);
  ctx.moveTo(bench.x, bench.y + (2 * bench.h) / 3);
  ctx.lineTo(bench.x + bench.w, bench.y + (2 * bench.h) / 3);
  ctx.stroke();
  ctx.strokeStyle = '#3a2a16';
  ctx.lineWidth = 2;
  ctx.strokeRect(bench.x, bench.y, bench.w, bench.h);
  ctx.fillStyle = '#241708';
  ctx.fillRect(bench.x + 5, bench.y + bench.h - 3, 5, 3);
  ctx.fillRect(bench.x + bench.w - 10, bench.y + bench.h - 3, 5, 3);
}

function drawCoverAndWalls(ctx, world) {
  for (const block of COVER) {
    const cx = block.x + block.w / 2;
    const cy = block.y + block.h / 2;
    if (block.y >= 560) drawPlanter(ctx, block);
    else if (block.w <= 28 && cx > 354 && cx < 926 && cy > 254 && cy < 546) drawColumn(ctx, block);
    else if (block.w <= 28) drawStatue(ctx, block);
    else drawCase(ctx, block, world);
  }
  for (const bench of BENCHES) drawBench(ctx, bench);
  for (const wall of WALLS) {
    ctx.fillStyle = '#17141f';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(wall.x, wall.y, wall.w, 2);
    ctx.fillStyle = 'rgba(201,162,39,0.20)';
    if (wall.w > wall.h) ctx.fillRect(wall.x, wall.y + wall.h - 2, wall.w, 2);
    else ctx.fillRect(wall.x + wall.w - 2, wall.y, 2, wall.h);
  }
}

function drawWallArt(ctx) {
  WALL_ART.forEach((panel, index) => {
    ctx.fillStyle = '#7a5c22';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = ART_CANVAS[index % ART_CANVAS.length];
    ctx.fillRect(panel.x + 2, panel.y + 2, panel.w - 4, panel.h - 4);
    ctx.fillStyle = 'rgba(255, 240, 200, 0.8)';
    const cx = panel.x + panel.w / 2;
    const cy = panel.y + panel.h / 2;
    ctx.beginPath();
    ctx.arc(cx + (panel.w > panel.h ? 7 : 0), cy - (panel.h > panel.w ? 7 : 0.5), 1.8, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlant(ctx, plant) {
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ellipse(ctx, plant.x, plant.y + 7, 10, 4);
  const greens = ['#2e6b3e', '#3c8450', '#275c34', '#46995c'];
  const blobs = [[0, -6, 8], [-6, -3, 6], [6, -3, 6], [-3, -10, 6], [4, -9, 5], [0, -2, 7]];
  blobs.forEach(([dx, dy, r], i) => {
    ctx.fillStyle = greens[(i + Math.floor(hash2(plant.x, plant.y) * 4)) % greens.length];
    ctx.beginPath();
    ctx.arc(plant.x + dx, plant.y + dy, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#8a4b2a';
  ctx.beginPath();
  ctx.moveTo(plant.x - 6, plant.y + 2);
  ctx.lineTo(plant.x + 6, plant.y + 2);
  ctx.lineTo(plant.x + 4.5, plant.y + 10);
  ctx.lineTo(plant.x - 4.5, plant.y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a55c33';
  ctx.fillRect(plant.x - 7, plant.y, 14, 3.5);
}

function drawLampFixture(ctx, lamp) {
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ellipse(ctx, lamp.x + 1, lamp.y + 3, 8, 5);
  ctx.fillStyle = '#23242c';
  ctx.beginPath();
  ctx.arc(lamp.x, lamp.y, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.save();
  ctx.shadowColor = '#ffca66';
  ctx.shadowBlur = 13;
  ctx.fillStyle = '#ffe1a0';
  ctx.beginPath();
  ctx.arc(lamp.x, lamp.y, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLoot(ctx, world) {
  for (const loot of LOOT) {
    const style = LOOT_STYLE[loot.id];
    if (world.taken.has(loot.id)) {
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.beginPath();
      ctx.arc(loot.x, loot.y, 4, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    const bob = Math.sin(world.time * 3 + loot.x) * 1.5;
    // A soft disc of glow on the case, then the treasure itself, then a glint.
    const glow = ctx.createRadialGradient(loot.x, loot.y + bob, 2, loot.x, loot.y + bob, 23);
    glow.addColorStop(0, style.fill + '47');
    glow.addColorStop(1, style.fill + '00');
    ctx.fillStyle = glow;
    ctx.fillRect(loot.x - 23, loot.y + bob - 23, 46, 46);
    ctx.save();
    ctx.shadowColor = style.fill;
    ctx.shadowBlur = 14;
    ctx.fillStyle = style.fill;
    if (loot.crown) {
      // A little crown: three points on a band.
      ctx.beginPath();
      ctx.moveTo(loot.x - 11, loot.y + 6 + bob);
      ctx.lineTo(loot.x - 11, loot.y - 6 + bob);
      ctx.lineTo(loot.x - 4, loot.y + 0 + bob);
      ctx.lineTo(loot.x, loot.y - 9 + bob);
      ctx.lineTo(loot.x + 4, loot.y + 0 + bob);
      ctx.lineTo(loot.x + 11, loot.y - 6 + bob);
      ctx.lineTo(loot.x + 11, loot.y + 6 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = style.gem;
      ctx.beginPath();
      ctx.arc(loot.x, loot.y + 1 + bob, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(loot.x, loot.y - 9 + bob);
      ctx.lineTo(loot.x + 7, loot.y + bob);
      ctx.lineTo(loot.x, loot.y + 9 + bob);
      ctx.lineTo(loot.x - 7, loot.y + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = style.gem;
      ctx.beginPath();
      ctx.arc(loot.x, loot.y + bob, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    const twinkle = 0.5 + 0.5 * Math.sin(world.time * 4 + loot.x * 0.7);
    const sx = loot.x + 10;
    const sy = loot.y - 10 + bob;
    const s = 3 + 2 * twinkle;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + 0.45 * twinkle})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(sx - s, sy);
    ctx.lineTo(sx + s, sy);
    ctx.moveTo(sx, sy - s);
    ctx.lineTo(sx, sy + s);
    ctx.stroke();
  }
}

function drawCameras(ctx, world) {
  for (const camera of world.cameras) {
    const watcher = cameraWatcher(camera, world.time, world.escalated);
    if (!world.camerasBlind) drawCone(ctx, watcher, '150, 200, 255', 0.16);
    // The unit itself: a wall arm and a housing turned to where it looks.
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.rotate(watcher.facing);
    ctx.fillStyle = '#3a3f4a';
    ctx.fillRect(-17, -2.5, 9, 5);
    ctx.fillStyle = '#14161c';
    rr(ctx, -9, -6, 15, 12, 2);
    ctx.fill();
    ctx.strokeStyle = '#2c3038';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#1d2026';
    ctx.fillRect(6, -4, 6, 8);
    ctx.fillStyle = world.camerasBlind ? '#e5484d' : '#a8d4ff';
    ctx.beginPath();
    ctx.arc(12.5, 0, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(13.3, -0.9, 0.9, 0, Math.PI * 2);
    ctx.fill();
    const ledOn = !world.camerasBlind || Math.sin(world.time * 10) > 0;
    ctx.fillStyle = world.camerasBlind ? (ledOn ? '#e5484d' : '#5c1d20') : '#57d97a';
    ctx.beginPath();
    ctx.arc(-5.5, -7.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawGuards(ctx, world) {
  for (const guard of world.guards) {
    const watcher = { x: guard.x, y: guard.y, facing: guard.facing, range: GUARD.sightRange, halfAngle: GUARD.sightHalfAngle };
    if (guard.state === GUARD_CHASE) drawCone(ctx, watcher, '255, 120, 90', 0.24);
    else if (guard.state === GUARD_CURIOUS || guard.state === GUARD_HUNT) drawCone(ctx, watcher, '255, 196, 86', 0.20);
    else drawCone(ctx, watcher, '255, 236, 170', 0.17);
  }
  for (const guard of world.guards) {
    // A uniformed figure: shoulders, chest, capped head, flashlight in hand —
    // drawn turned to his facing, so a screenshot reads which way he looks.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ellipse(ctx, guard.x, guard.y + 3, 13, 10);
    ctx.save();
    ctx.translate(guard.x, guard.y);
    ctx.rotate(guard.facing);
    ctx.fillStyle = '#24334f';
    ctx.beginPath();
    ctx.arc(0, -11, 5, 0, Math.PI * 2);
    ctx.arc(0, 11, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2c3d63';
    ctx.beginPath();
    ctx.arc(0, 0, GUARD.radius - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(84, 110, 165, 0.55)';
    ellipse(ctx, 3, 0, 7, 8.5);
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.arc(4, -6, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dcb58e';
    ctx.beginPath();
    ctx.arc(2, 0, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#182a4a';
    ctx.beginPath();
    ctx.arc(0.2, 0, 6.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dcb58e';
    ctx.beginPath();
    ctx.arc(3.6, 0, 4.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#101f38';
    ctx.fillRect(6.8, -2.8, 4.5, 5.6);
    ctx.fillStyle = '#8b8f98';
    ctx.fillRect(8.5, 6, 6, 3.4);
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(15, 7.7, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (guard.state === GUARD_CHASE || guard.state === GUARD_CURIOUS || guard.state === GUARD_HUNT) {
      ctx.font = '900 17px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = guard.state === GUARD_CHASE ? '#ff5d47' : '#ffc454';
      ctx.fillText(guard.state === GUARD_CHASE ? '!' : '?', guard.x, guard.y - 22);
    } else if (guard.suspicion > 12) {
      // A filling arc: the fair warning that a chase is coming.
      ctx.strokeStyle = '#ffc454';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y - 24, 6, -Math.PI / 2, -Math.PI / 2 + (guard.suspicion / 100) * Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawThief(ctx, world) {
  const thief = world.thief;
  if (world.bag.coin) {
    ctx.fillStyle = '#ffcf5c';
    ctx.beginPath();
    ctx.arc(world.bag.coin.x, world.bag.coin.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 207, 92, 0.5)';
    ctx.beginPath();
    ctx.arc(world.bag.coin.x, world.bag.coin.y, 6 + 3 * Math.sin(world.time * 5), 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const cloud of world.bag.smokeClouds) {
    ctx.fillStyle = 'rgba(200, 200, 210, 0.36)';
    ctx.beginPath();
    ctx.arc(cloud.x + cloud.w / 2, cloud.y + cloud.h / 2, cloud.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(210, 210, 220, 0.28)';
    ctx.beginPath();
    ctx.arc(cloud.x + cloud.w * 0.28, cloud.y + cloud.h * 0.4, cloud.w * 0.34, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.w * 0.74, cloud.y + cloud.h * 0.62, cloud.w * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // A hooded figure with a satchel on his back, turned to his facing; sneaking
  // pulls him lower and smaller, the way he already moves.
  const radius = thief.sneaking ? 11 : 13;
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ellipse(ctx, thief.x, thief.y + 3, radius + 1, radius - 3);
  ctx.save();
  ctx.translate(thief.x, thief.y);
  ctx.rotate(thief.facing);
  ctx.fillStyle = '#6e4a26';
  rr(ctx, -radius - 3.5, -5.5, 7, 11, 2);
  ctx.fill();
  ctx.strokeStyle = '#4a3016';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-radius - 3.5, 0);
  ctx.lineTo(-radius + 3.5, 0);
  ctx.stroke();
  ctx.fillStyle = '#111116';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(232, 228, 218, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#0c0c10';
  ctx.beginPath();
  ctx.arc(radius - 3.5, -6.5, 2.6, 0, Math.PI * 2);
  ctx.arc(radius - 3.5, 6.5, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e1e26';
  ctx.beginPath();
  ctx.arc(1, 0, radius - 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#070708';
  ctx.beginPath();
  ctx.arc(4.5, 0, radius - 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d7dee6';
  ctx.beginPath();
  ctx.arc(6.8, -1.9, 0.95, 0, Math.PI * 2);
  ctx.arc(6.8, 1.9, 0.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (thief.channel) {
    const total = 1.4;
    const done = 1 - Math.max(0, thief.channel.secondsLeft) / total;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(thief.x - 22, thief.y - 34, 44, 7);
    ctx.fillStyle = '#ffd94d';
    ctx.fillRect(thief.x - 21, thief.y - 33, 42 * done, 5);
  }
}

function drawHud(ctx, world) {
  ctx.fillStyle = '#0d0b12';
  ctx.fillRect(0, 0, VIEW.width, VIEW.hudHeight);
  const rule = ctx.createLinearGradient(0, 0, VIEW.width, 0);
  rule.addColorStop(0, '#6a5320');
  rule.addColorStop(0.5, '#d9b45c');
  rule.addColorStop(1, '#6a5320');
  ctx.fillStyle = rule;
  ctx.fillRect(0, VIEW.hudHeight - 2, VIEW.width, 2);

  // The title, with a tiny crown for a crest.
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.moveTo(16, 30);
  ctx.lineTo(16, 18);
  ctx.lineTo(20.5, 24);
  ctx.lineTo(25, 16);
  ctx.lineTo(29.5, 24);
  ctx.lineTo(34, 18);
  ctx.lineTo(34, 30);
  ctx.closePath();
  ctx.fill();
  ctx.font = '700 17px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE IVORY CROWN JOB', 44, 29);

  // The alarm meter in its own recessed panel: labelled, ticked, impossible to miss.
  const panelX = 288;
  ctx.fillStyle = '#17141f';
  rr(ctx, panelX, 7, 478, 32, 5);
  ctx.fill();
  const level = world.alarm.level;
  const hot = level >= ALARM.escalateAt;
  ctx.strokeStyle = hot && Math.sin(world.time * 9) > 0 ? '#ff5d47' : '#3d3752';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = '700 12px Georgia, serif';
  ctx.fillStyle = '#e8e4da';
  ctx.fillText('ALARM', panelX + 12, 29);
  const meterX = panelX + 68;
  const meterW = 320;
  ctx.fillStyle = '#262231';
  ctx.fillRect(meterX, 17, meterW, 12);
  const hue = level < 40 ? '#57d97a' : level < ALARM.escalateAt ? '#ffc454' : '#ff5d47';
  ctx.fillStyle = hue;
  ctx.fillRect(meterX, 17, (meterW * level) / 100, 12);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let t = 1; t < 10; t += 1) ctx.fillRect(meterX + (meterW * t) / 10, 17, 1, 12);
  ctx.fillStyle = '#e8e4da';
  ctx.font = '700 13px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(level)}%`, panelX + 466, 29);

  // The haul, on a gilt plaque.
  ctx.fillStyle = '#17141f';
  rr(ctx, 786, 7, 176, 32, 5);
  ctx.fill();
  ctx.strokeStyle = '#8a6d2f';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffcf5c';
  ctx.font = '700 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`HAUL $${world.haul.toLocaleString('en-US')}`, 874, 29);

  // The tools as three chips: an icon, a count, and the key that spends it.
  const bag = world.bag;
  const chips = [
    { x: 976, key: 'Q', count: bag.smokeLeft, icon: 'smoke' },
    { x: 1076, key: 'CLICK', count: bag.coinsLeft, icon: 'coin' },
    { x: 1176, key: 'F', count: bag.jammerLeft, icon: 'jammer' },
  ];
  for (const chip of chips) {
    ctx.fillStyle = '#17141f';
    rr(ctx, chip.x, 7, 92, 32, 5);
    ctx.fill();
    ctx.strokeStyle = '#3d3752';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    const cx = chip.x + 17;
    const cy = 23;
    if (chip.icon === 'smoke') {
      ctx.fillStyle = '#b9bec9';
      ctx.beginPath();
      ctx.arc(cx - 3, cy + 2, 4.4, 0, Math.PI * 2);
      ctx.arc(cx + 3.5, cy + 1, 3.6, 0, Math.PI * 2);
      ctx.arc(cx + 0.5, cy - 3, 3.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (chip.icon === 'coin') {
      ctx.fillStyle = '#ffcf5c';
      ctx.beginPath();
      ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = '#b8860b';
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#9fd0ff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 6);
      ctx.lineTo(cx, cy - 3);
      ctx.stroke();
      ctx.fillStyle = '#9fd0ff';
      ctx.beginPath();
      ctx.moveTo(cx + 3.5, cy - 8);
      ctx.lineTo(cx - 1.5, cy - 1);
      ctx.lineTo(cx + 1.2, cy - 1);
      ctx.lineTo(cx - 3, cy + 5);
      ctx.lineTo(cx + 4.5, cy - 2.5);
      ctx.lineTo(cx + 1.8, cy - 2.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#e8e4da';
    ctx.font = '700 14px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`×${chip.count}`, chip.x + 32, 29);
    ctx.fillStyle = '#8f8a9e';
    ctx.font = '700 7.5px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText(chip.key, chip.x + 86, 15);
  }

  if (world.message && world.screen === SCREEN_PLAY) {
    ctx.textAlign = 'center';
    ctx.font = '700 19px Georgia, serif';
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const width = ctx.measureText(world.message).width + 36;
    ctx.fillRect(VIEW.width / 2 - width / 2, 56, width, 30);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText(world.message, VIEW.width / 2, 78);
  }
}

function drawVignette(ctx) {
  const g = ctx.createRadialGradient(640, 420, 430, 640, 420, 960);
  g.addColorStop(0, 'rgba(3,2,6,0)');
  g.addColorStop(1, 'rgba(3,2,6,0.32)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function drawOverlay(ctx, world, title, lines, footer) {
  ctx.fillStyle = 'rgba(8, 6, 12, 0.72)';
  ctx.fillRect(0, VIEW.hudHeight, VIEW.width, VIEW.height - VIEW.hudHeight);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d';
  ctx.font = '900 54px Georgia, serif';
  ctx.fillText(title, VIEW.width / 2, 250);
  ctx.fillStyle = '#e8e4da';
  ctx.font = '19px Georgia, serif';
  lines.forEach((line, index) => ctx.fillText(line, VIEW.width / 2, 310 + index * 30));
  ctx.font = '700 17px Georgia, serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(footer, VIEW.width / 2, 640);
}

/** Draw the whole frame for the world's current screen. */
export function drawGame(ctx, world) {
  ctx.fillStyle = '#0a0910';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawFloors(ctx);
  drawExit(ctx, world);
  drawCoverAndWalls(ctx, world);
  drawWallArt(ctx);
  for (const plant of PLANTS) drawPlant(ctx, plant);
  for (const lamp of LAMPS) drawLampFixture(ctx, lamp);
  drawLoot(ctx, world);
  drawCameras(ctx, world);
  drawGuards(ctx, world);
  drawThief(ctx, world);
  drawVignette(ctx);
  drawHud(ctx, world);

  if (world.screen === SCREEN_TITLE) {
    drawOverlay(ctx, world, 'THE IVORY CROWN JOB', [
      'Tonight the Meridian Museum sleeps — and its Ivory Crown comes home with you.',
      'Cross the galleries unseen. Read the patrols, mind the cameras, watch the alarm.',
      '',
      'Move WASD / arrows · Sneak SHIFT · Work a case SPACE (hold for the crown)',
      'Smoke Q · Throw a coin: click · Jam the cameras F',
      'Lift what you dare, then reach the van with the crown.',
    ], 'Click or press Enter to begin');
  } else if (world.screen === SCREEN_CAUGHT) {
    drawOverlay(ctx, world, 'BUSTED', [
      world.caughtBy === 'lockdown' ? 'The meter hit full with every eye on you — the doors slammed.' : 'A guard made the grab. Fair and square.',
      `You had lifted $${world.haul.toLocaleString('en-US')} — the museum keeps it all.`,
      `The alarm peaked at ${Math.round(world.alarm.peak)}%.`,
    ], 'Click or press Enter to try the night again');
  } else if (world.screen === SCREEN_AWAY) {
    const s = world.score;
    drawOverlay(ctx, world, 'CLEAN GETAWAY', [
      `Haul $${s.haul.toLocaleString('en-US')} · time bonus ${s.timeBonus} · ghost bonus ${s.ghostBonus} · unseen bonus ${s.unseenBonus}`,
      `Total score ${s.total.toLocaleString('en-US')} — grade: ${s.grade}`,
      `Out in ${Math.floor(world.elapsed / 60)}:${String(Math.floor(world.elapsed % 60)).padStart(2, '0')} with the alarm peaking at ${Math.round(world.alarm.peak)}%.`,
    ], 'Click or press Enter to run it again');
  }
}
