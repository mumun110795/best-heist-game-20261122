// The night guards: waypoint patrols with look-around pauses, a suspicion meter of
// their own, a fair chase, and ears that a thrown coin can fool exactly once a throw.
import { GUARD } from './config.js';
import { PATROLS, slideMove } from './level.js';
import { angleDifference, exposureTo, guardWatcher } from './vision.js';

export const GUARD_CALM = 'patrol';
export const GUARD_CURIOUS = 'curious'; // heard a coin, or half-saw something: going to look
export const GUARD_CHASE = 'chase';
export const GUARD_HUNT = 'hunt'; // lost the thief, searching the last place he was seen

export function createGuards() {
  return PATROLS.map((route, index) => ({
    id: index,
    x: route[0].x,
    y: route[0].y,
    facing: Math.atan2(route[1].y - route[0].y, route[1].x - route[0].x),
    route,
    waypoint: 1,
    state: GUARD_CALM,
    pauseLeft: 0,
    suspicion: 0, // 0..100 of this guard's own certainty
    lastSeen: null, // {x, y} of the freshest sighting
    memoryLeft: 0,
    lookTarget: null, // {x, y} a coin asked him to inspect
  }));
}

function walkToward(guard, target, speed, dt) {
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 2) return true;
  const step = Math.min(distance, speed * dt);
  const moved = slideMove(guard.x, guard.y, GUARD.radius, (dx / distance) * step, (dy / distance) * step);
  guard.x = moved.x;
  guard.y = moved.y;
  guard.facing = Math.atan2(dy, dx);
  return distance - step < 2;
}

function turnToward(guard, angle, dt) {
  const diff = angleDifference(angle, guard.facing);
  const maxTurn = 2.6 * dt;
  guard.facing += Math.max(-maxTurn, Math.min(maxTurn, diff));
}

/**
 * Advance one guard. `exposure` is how clearly he sees the thief this step (from
 * vision.js); `escalated` hurries him. Returns 'caught' when he makes a fair grab.
 */
export function stepGuard(guard, thief, exposure, escalated, dt) {
  const speedScale = escalated ? 1.16 : 1;

  // Certainty grows with a clear view and fades without one; a full meter is a chase.
  if (exposure > 0.05) {
    guard.suspicion = Math.min(100, guard.suspicion + exposure * 160 * dt);
    guard.lastSeen = { x: thief.x, y: thief.y };
    guard.memoryLeft = GUARD.memorySeconds;
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - 22 * dt);
    if (guard.memoryLeft > 0) guard.memoryLeft -= dt;
  }
  if (guard.suspicion >= 100 && guard.state !== GUARD_CHASE) {
    guard.state = GUARD_CHASE;
  }

  if (guard.state === GUARD_CHASE) {
    const target = exposure > 0.05 ? thief : guard.lastSeen;
    if (target) walkToward(guard, target, GUARD.chaseSpeed * speedScale, dt);
    if (exposure <= 0.05 && guard.memoryLeft <= 0) {
      guard.state = GUARD_HUNT;
    }
    const grabDistance = Math.hypot(thief.x - guard.x, thief.y - guard.y);
    if (grabDistance < GUARD.catchRange && guard.suspicion > 55) return 'caught';
    return null;
  }

  if (guard.state === GUARD_HUNT) {
    if (guard.lastSeen && walkToward(guard, guard.lastSeen, GUARD.patrolSpeed * 1.5, dt)) {
      guard.state = GUARD_CALM;
      guard.suspicion = Math.min(guard.suspicion, 30);
    }
    if (guard.suspicion >= 100) guard.state = GUARD_CHASE;
    return null;
  }

  if (guard.state === GUARD_CURIOUS && guard.lookTarget) {
    if (walkToward(guard, guard.lookTarget, GUARD.patrolSpeed * 1.35, dt)) {
      guard.pauseLeft = GUARD.pauseSeconds;
      guard.lookTarget = null;
      guard.state = GUARD_CALM;
    }
    return null;
  }

  // Patrol: walk the loop, pause at each corner and sweep a slow look around.
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    guard.facing += Math.sin(guard.pauseLeft * 2.4 + guard.id) * 0.9 * dt;
    return null;
  }
  const target = guard.route[guard.waypoint];
  if (walkToward(guard, target, GUARD.patrolSpeed * speedScale, dt)) {
    guard.waypoint = (guard.waypoint + 1) % guard.route.length;
    guard.pauseLeft = GUARD.pauseSeconds;
  }
  return null;
}

/** A coin clinks at (x, y): the nearest calm guard within earshot goes to look. */
export function distractWithCoin(guards, x, y, radius) {
  let best = null;
  let bestDistance = radius;
  for (const guard of guards) {
    if (guard.state === GUARD_CHASE) continue;
    const distance = Math.hypot(guard.x - x, guard.y - y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = guard;
    }
  }
  if (best) {
    best.state = GUARD_CURIOUS;
    best.lookTarget = { x, y };
    best.pauseLeft = 0;
  }
  return best !== null;
}

/** How clearly this guard sees the thief right now (shared with the alarm). */
export function guardExposure(guard, thief, smokeClouds) {
  return exposureTo(guardWatcher(guard), thief, smokeClouds);
}
