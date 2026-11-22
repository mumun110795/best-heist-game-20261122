// The thief: one quiet figure, moved by the keyboard, who lifts treasure by
// standing close and working at it — the crown's alarmed glass takes a held moment.
import { THIEF } from './config.js';
import { LOOT, slideMove } from './level.js';

export function createThief() {
  return {
    x: 0,
    y: 0,
    facing: -Math.PI / 2,
    sneaking: false,
    moving: false,
    channel: null, // {lootId, secondsLeft} while working the crown case open
  };
}

export function placeThiefAtStart(thief, start) {
  thief.x = start.x;
  thief.y = start.y;
  thief.facing = -Math.PI / 2;
  thief.channel = null;
}

/**
 * Move the thief for one step. `intent` is {x, y} in -1..1 from the keys and
 * `sneak` whether the sneak key is held. Returns nothing; sets thief.moving.
 */
export function stepThief(thief, intent, sneak, dt) {
  thief.sneaking = sneak;
  const length = Math.hypot(intent.x, intent.y);
  thief.moving = length > 0.01;
  if (!thief.moving) return;
  const speed = sneak ? THIEF.sneakSpeed : THIEF.walkSpeed;
  const dx = (intent.x / Math.max(1, length)) * speed * dt;
  const dy = (intent.y / Math.max(1, length)) * speed * dt;
  const moved = slideMove(thief.x, thief.y, THIEF.radius, dx, dy);
  thief.x = moved.x;
  thief.y = moved.y;
  thief.facing = Math.atan2(intent.y, intent.x);
  thief.channel = null; // working a case means standing still
}

/** The nearest un-lifted treasure within reach, or null. */
export function lootInReach(thief, taken) {
  let best = null;
  let bestDistance = THIEF.grabRange;
  for (const loot of LOOT) {
    if (taken.has(loot.id)) continue;
    const distance = Math.hypot(loot.x - thief.x, loot.y - thief.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = loot;
    }
  }
  return best;
}

/**
 * Work at the treasure in reach for one step (the interact key held). Ordinary
 * pieces lift at once; the crown needs its channel completed. Returns the loot
 * lifted this step, or null.
 */
export function workLoot(thief, taken, dt) {
  const loot = lootInReach(thief, taken);
  if (!loot) {
    thief.channel = null;
    return null;
  }
  if (!loot.crown) {
    thief.channel = null;
    return loot;
  }
  if (!thief.channel || thief.channel.lootId !== loot.id) {
    thief.channel = { lootId: loot.id, secondsLeft: THIEF.crownChannelSeconds };
  }
  thief.channel.secondsLeft -= dt;
  if (thief.channel.secondsLeft <= 0) {
    thief.channel = null;
    return loot;
  }
  return null;
}
