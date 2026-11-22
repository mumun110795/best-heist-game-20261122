// Who can see the thief, and how clearly: vision cones for guards and cameras,
// line of sight against walls and cover, and the exposure number the alarm feeds on.
import { BLOCKERS, inShadow, segmentBlocked } from './level.js';
import { CAMERA, GUARD } from './config.js';

/** Smallest signed difference between two angles, in (-PI, PI]. */
export function angleDifference(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** True when there is an unobstructed straight line between two points. */
export function lineOfSight(x1, y1, x2, y2) {
  return !segmentBlocked(x1, y1, x2, y2, BLOCKERS);
}

/**
 * How exposed the thief is to one watcher: 0 when unseen, up to 1 at point-blank
 * in the middle of the cone. `watcher` is {x, y, facing, range, halfAngle}.
 * Sneaking and shadow each soften exposure; smoke anywhere on the sight line kills it.
 */
export function exposureTo(watcher, thief, smokeClouds) {
  const dx = thief.x - watcher.x;
  const dy = thief.y - watcher.y;
  const distance = Math.hypot(dx, dy);
  if (distance > watcher.range || distance < 1) return 0;
  const bearing = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(bearing, watcher.facing)) > watcher.halfAngle) return 0;
  if (!lineOfSight(watcher.x, watcher.y, thief.x, thief.y)) return 0;
  for (const cloud of smokeClouds) {
    if (segmentBlocked(watcher.x, watcher.y, thief.x, thief.y, [cloud])) return 0;
  }
  let exposure = 1 - (distance / watcher.range) * 0.55; // nearer is always clearer
  if (thief.sneaking) exposure *= 0.6;
  if (inShadow(thief.x, thief.y)) exposure *= 0.45;
  return exposure;
}

/** A watcher view of a guard, for exposureTo. */
export function guardWatcher(guard) {
  return { x: guard.x, y: guard.y, facing: guard.facing, range: GUARD.sightRange, halfAngle: GUARD.sightHalfAngle };
}

/** A watcher view of a camera at a moment in its sweep. */
export function cameraWatcher(camera, timeSeconds, escalated) {
  const speed = escalated ? 1.45 : 1;
  const phase = (timeSeconds * speed * Math.PI * 2) / CAMERA.sweepPeriodSeconds;
  const facing = camera.facing + Math.sin(phase + camera.x) * CAMERA.sweepHalfAngle;
  return { x: camera.x, y: camera.y, facing, range: CAMERA.sightRange, halfAngle: CAMERA.sightHalfAngle };
}
