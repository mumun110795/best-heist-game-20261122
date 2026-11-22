// The screenshot scenes behind ?shot=cover|gallery|escape|caught. Each one places
// the real pieces of a run — thief, guards, cameras, alarm, haul — exactly where a
// moment of play puts them, then lets the game's own renderer draw the frame.
// Nothing is painted here that the game itself does not draw every frame.
import { GUARD_CHASE, GUARD_CURIOUS } from './guards.js';
import { SCREEN_CAUGHT, SCREEN_PLAY } from './render.js';

function placeGuard(world, index, x, y, facing, state) {
  const guard = world.guards[index];
  guard.x = x;
  guard.y = y;
  guard.facing = facing;
  if (state) guard.state = state;
  if (state === GUARD_CHASE) guard.suspicion = 100;
}

function placeThief(world, x, y, facing, sneaking = false) {
  world.thief.x = x;
  world.thief.y = y;
  world.thief.facing = facing;
  world.thief.sneaking = sneaking;
}

/**
 * Set `world` to the named scene. The cover is the whole game in one frame: the
 * thief mid-crossing in the Grand Hall, two kinds of cone on him, the crown
 * gleaming in the Vault above, the alarm meter already warm in the HUD.
 */
export function stageShot(name, world) {
  world.screen = SCREEN_PLAY;
  world.time = 24;

  if (name === 'gallery') {
    // East Gallery: the thief flattened in shadow while a patrol's light sweeps past.
    placeThief(world, 1228, 408, Math.PI, true);
    placeGuard(world, 2, 1108, 442, 0.5);
    placeGuard(world, 0, 500, 300, 0);
    placeGuard(world, 3, 640, 272, Math.PI / 2);
    world.taken = new Set(['jade']);
    world.haul = 300;
    world.alarm.level = 18;
    world.message = '';
    return;
  }

  if (name === 'escape') {
    // The getaway: crown in the bag, the meter hot, a chase spilling into the foyer.
    world.crownTaken = true;
    world.alarm.tripped = true;
    world.taken = new Set(['crown', 'jade', 'ruby']);
    world.haul = 1600;
    world.alarm.level = 78;
    world.alarm.peak = 84;
    world.escalated = true;
    placeThief(world, 640, 648, Math.PI / 2);
    placeGuard(world, 0, 636, 520, Math.PI / 2, GUARD_CHASE);
    placeGuard(world, 3, 640, 268, Math.PI / 2, GUARD_CURIOUS);
    placeGuard(world, 1, 176, 420, Math.PI / 2);
    setMessage(world);
    return;
  }

  if (name === 'caught') {
    // The fair end: a guard on the thief's shoulder in the Grand Hall, meter near full.
    world.taken = new Set(['jade', 'painting', 'pearls']);
    world.haul = 750;
    world.alarm.level = 96;
    world.alarm.peak = 96;
    placeThief(world, 588, 402, 0.4);
    placeGuard(world, 0, 566, 388, 0.4, GUARD_CHASE);
    placeGuard(world, 3, 640, 272, Math.PI / 2);
    world.screen = SCREEN_CAUGHT;
    world.caughtBy = 'guard';
    return;
  }

  // cover (default): mid-crossing, the whole museum awake around one quiet figure.
  world.taken = new Set(['jade', 'painting']);
  world.haul = 550;
  world.alarm.level = 42;
  world.alarm.peak = 42;
  placeThief(world, 556, 404, 0.15);
  placeGuard(world, 0, 724, 316, 2.6); // Grand Hall patrol, light sweeping the crossing
  placeGuard(world, 1, 150, 420, -0.6); // West Gallery patrol
  placeGuard(world, 2, 1130, 330, 2.8); // East Gallery patrol
  placeGuard(world, 3, 640, 268, Math.PI / 2); // at the Vault door, under the camera
  world.message = '';
}

function setMessage(world) {
  world.message = 'THE CROWN IS YOURS — GET TO THE VAN.';
  world.messageLeft = 99;
}
