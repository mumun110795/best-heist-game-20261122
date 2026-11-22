// The Ivory Crown Job, wired together: the world state, one fixed-step simulation
// (thief, guards, cameras, alarm, tools), the win and caught moments, the score —
// and the browser boot that runs it all. The step logic is plain data in, data out,
// so the screenshot scenes in shots.js drive the very same code.
import { STEP } from './config.js';
import { CAMERAS, EXIT_ZONE, THIEF_START, insideRect } from './level.js';
import { createAlarm, isEscalated, stepAlarm, tripCrownWire } from './alarm.js';
import { createGuards, distractWithCoin, guardExposure, stepGuard } from './guards.js';
import { createThief, lootInReach, placeThiefAtStart, stepThief, workLoot } from './player.js';
import { burstSmoke, camerasBlind, createToolBag, fireJammer, stepTools, throwCoin } from './tools.js';
import { cameraWatcher, exposureTo } from './vision.js';
import { createInput } from './input.js';
import { SCREEN_AWAY, SCREEN_CAUGHT, SCREEN_PLAY, SCREEN_TITLE, drawGame } from './render.js';
import { sound } from './audio.js';
import { SCORE, TOOLS } from './config.js';

export function createWorld() {
  const world = {
    screen: SCREEN_TITLE,
    time: 0,
    elapsed: 0,
    thief: createThief(),
    guards: createGuards(),
    cameras: CAMERAS,
    alarm: createAlarm(),
    bag: createToolBag(),
    taken: new Set(),
    haul: 0,
    crownTaken: false,
    escalated: false,
    camerasBlind: false,
    everChased: false,
    caughtBy: null,
    score: null,
    message: '',
    messageLeft: 0,
    tickLeft: 0,
    exitWarnLeft: 0,
  };
  placeThiefAtStart(world.thief, THIEF_START);
  return world;
}

function setMessage(world, text, seconds = 2.6) {
  world.message = text;
  world.messageLeft = seconds;
}

function startRun(world) {
  const fresh = createWorld();
  Object.assign(world, fresh);
  world.screen = SCREEN_PLAY;
  setMessage(world, 'The crown sits in the Vault, top centre. Good hunting.', 3.4);
}

function finishCaught(world, by) {
  world.screen = SCREEN_CAUGHT;
  world.caughtBy = by;
  sound.thud();
}

function finishAway(world) {
  const timeBonus = Math.max(0, SCORE.timeBonusCap - Math.floor(world.elapsed));
  const ghostBonus = world.alarm.peak <= 60 ? SCORE.ghostBonus : 0;
  const unseenBonus = world.everChased ? 0 : SCORE.unseenBonus;
  const total = world.haul + timeBonus + ghostBonus + unseenBonus;
  const grade = ghostBonus && unseenBonus ? 'GHOST — the museum never knew' : ghostBonus ? 'PROFESSIONAL' : 'SMASH AND GRAB';
  world.score = { haul: world.haul, timeBonus, ghostBonus, unseenBonus, total, grade };
  world.screen = SCREEN_AWAY;
  sound.chime();
}

/** Advance the world one fixed step under the player's controls. */
export function stepWorld(world, controls, dt) {
  world.time += dt;
  if (world.messageLeft > 0) {
    world.messageLeft -= dt;
    if (world.messageLeft <= 0) world.message = '';
  }

  if (world.screen !== SCREEN_PLAY) {
    if (controls.confirm) {
      sound.unlock();
      startRun(world);
    }
    return;
  }

  world.elapsed += dt;
  if (world.exitWarnLeft > 0) world.exitWarnLeft -= dt;

  // Tools first: a smoke burst this step already hides the thief in it.
  if (controls.smoke && burstSmoke(world.bag, world.thief.x, world.thief.y)) sound.thud();
  if (controls.jammer && fireJammer(world.bag)) {
    setMessage(world, 'Cameras blind — move, now.');
    sound.clink();
  }
  if (controls.coinAt && throwCoin(world.bag, controls.coinAt.x, controls.coinAt.y)) {
    if (distractWithCoin(world.guards, controls.coinAt.x, controls.coinAt.y, TOOLS.decoyRadius)) {
      setMessage(world, 'A coin clinks — a guard goes to look.');
      sound.clink();
    } else {
      setMessage(world, 'The coin clinks. Nobody close enough to care.');
    }
  }
  stepTools(world.bag, dt);
  world.camerasBlind = camerasBlind(world.bag);

  stepThief(world.thief, { x: controls.moveX, y: controls.moveY }, controls.sneak, dt);

  // Working a case: standing still with the work key held.
  if (controls.interact && !world.thief.moving) {
    const lifted = workLoot(world.thief, world.taken, dt);
    if (lifted) {
      world.taken.add(lifted.id);
      world.haul += lifted.value;
      sound.glint();
      if (lifted.crown) {
        world.crownTaken = true;
        tripCrownWire(world.alarm);
        setMessage(world, 'THE CROWN IS YOURS — the wire tripped. GET TO THE VAN.', 4);
      } else {
        setMessage(world, `${lifted.name} lifted — $${lifted.value}.`);
      }
    }
  } else {
    world.thief.channel = null;
  }

  // Watching: the best exposure from each kind of watcher feeds guards and alarm.
  let bestGuardExposure = 0;
  const exposures = world.guards.map((guard) => {
    const exposure = guardExposure(guard, world.thief, world.bag.smokeClouds);
    if (exposure > bestGuardExposure) bestGuardExposure = exposure;
    return exposure;
  });
  let bestCameraExposure = 0;
  if (!world.camerasBlind) {
    for (const camera of world.cameras) {
      const exposure = exposureTo(cameraWatcher(camera, world.time, world.escalated), world.thief, world.bag.smokeClouds);
      if (exposure > bestCameraExposure) bestCameraExposure = exposure;
    }
  }

  world.escalated = isEscalated(world.alarm);
  for (let index = 0; index < world.guards.length; index += 1) {
    const outcome = stepGuard(world.guards[index], world.thief, exposures[index], world.escalated, dt);
    if (world.guards[index].state === 'chase') world.everChased = true;
    if (outcome === 'caught') {
      finishCaught(world, 'guard');
      return;
    }
  }

  if (stepAlarm(world.alarm, bestGuardExposure, bestCameraExposure, dt)) {
    finishCaught(world, 'lockdown');
    return;
  }
  if (world.alarm.seenNow) {
    world.tickLeft -= dt;
    if (world.tickLeft <= 0) {
      sound.tick();
      world.tickLeft = 0.28;
    }
  }

  // The van: home, but only with the crown.
  if (insideRect(world.thief.x, world.thief.y, EXIT_ZONE)) {
    if (world.crownTaken) {
      finishAway(world);
    } else if (world.exitWarnLeft <= 0) {
      setMessage(world, 'The van waits — the crown first.');
      world.exitWarnLeft = 3;
    }
  }
}

/** Hint text for the page's status line: what the work key would do right now. */
export function statusText(world) {
  if (world.screen !== SCREEN_PLAY) return world.screen;
  const loot = lootInReach(world.thief, world.taken);
  if (loot) return `In reach: ${loot.name} — hold SPACE to lift it.`;
  if (world.crownTaken) return 'The crown is yours. Reach the van at the south doors.';
  return 'Cross the museum. The crown sits in the Vault, top centre.';
}

function boot() {
  const canvas = document.getElementById('game');
  const status = document.getElementById('status');
  const ctx = canvas.getContext('2d');
  const input = createInput(canvas);
  const world = createWorld();

  const params = new URLSearchParams(window.location.search);
  if (params.has('shot')) {
    import('./shots.js').then(({ stageShot }) => {
      stageShot(params.get('shot'), world);
      drawGame(ctx, world);
    });
    return;
  }

  let last = performance.now();
  let accumulator = 0;
  let lastStatus = '';
  function frame(now) {
    accumulator += Math.min(0.1, (now - last) / 1000);
    last = now;
    while (accumulator >= STEP) {
      stepWorld(world, input.read(), STEP);
      accumulator -= STEP;
    }
    drawGame(ctx, world);
    const text = statusText(world);
    if (text !== lastStatus) {
      status.textContent = text;
      lastStatus = text;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (typeof document !== 'undefined' && document.getElementById('game')) boot();
