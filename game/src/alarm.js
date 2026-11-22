// The alarm meter: the museum's memory of being watched. It rises while any guard
// or camera holds the thief in view, cools when nobody does, and past its marks it
// changes how the whole building behaves.
import { ALARM } from './config.js';

export function createAlarm() {
  return {
    level: 0, // 0..100
    secondsSinceSeen: 99, // how long since any watcher last had exposure on the thief
    seenNow: false, // any exposure at all this step
    lockdownSeconds: 0, // time spent in plain sight at a full meter
    peak: 0, // highest level reached, for the end-of-night grade
    tripped: false, // the crown wire has fired
  };
}

/**
 * Feed one step of watching into the meter. `guardExposure` and `cameraExposure`
 * are the best (largest) exposures from each kind of watcher this step.
 * Returns true on the step the thief is caught by lockdown.
 */
export function stepAlarm(alarm, guardExposure, cameraExposure, dt) {
  const rise = guardExposure * ALARM.guardSeeRate + cameraExposure * ALARM.cameraSeeRate;
  alarm.seenNow = rise > 0;
  if (alarm.seenNow) {
    alarm.level = Math.min(ALARM.max, alarm.level + rise * dt);
    alarm.secondsSinceSeen = 0;
  } else {
    alarm.secondsSinceSeen += dt;
    if (alarm.secondsSinceSeen > ALARM.decayDelaySeconds) {
      // Once the crown wire has tripped, the building never settles below its floor.
      const floor = alarm.tripped ? ALARM.crownGrabFloor : 0;
      alarm.level = Math.max(floor, alarm.level - ALARM.decayPerSecond * dt);
    }
  }
  if (alarm.level > alarm.peak) alarm.peak = alarm.level;

  if (alarm.level >= ALARM.max && alarm.seenNow) {
    alarm.lockdownSeconds += dt;
  } else {
    alarm.lockdownSeconds = 0;
  }
  return alarm.lockdownSeconds >= ALARM.lockdownGraceSeconds;
}

/** The crown's trip wire: the meter jumps, and never cools below the floor again tonight. */
export function tripCrownWire(alarm) {
  alarm.tripped = true;
  if (alarm.level < ALARM.crownGrabFloor) alarm.level = ALARM.crownGrabFloor;
}

/** True once the building is jumpy: guards hurry, cameras sweep faster. */
export function isEscalated(alarm) {
  return alarm.level >= ALARM.escalateAt || alarm.tripped;
}
