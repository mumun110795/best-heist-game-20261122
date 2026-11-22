// Tuning for The Ivory Crown Job: canvas size, speeds, sight ranges, alarm rates.
// Everything the rest of the game needs to agree on lives here, in one place.

export const VIEW = { width: 1280, height: 800, hudHeight: 46 };

export const STEP = 1 / 120; // fixed simulation step, seconds

export const THIEF = {
  radius: 13,
  walkSpeed: 152, // px per second, upright
  sneakSpeed: 84, // px per second, crouched: slower but harder to see
  grabRange: 46, // how close to a case the thief must stand to lift its treasure
  crownChannelSeconds: 1.4, // the crown case is alarmed glass: lifting it takes a held moment
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 60,
  chaseSpeed: 141, // a shade slower than the thief's walk: a fair chase, never a hopeless one
  pauseSeconds: 1.6, // how long a guard stops and looks around at each waypoint
  sightRange: 196,
  sightHalfAngle: 0.56, // radians, about 32 degrees each side of the facing
  catchRange: 24, // centre distance at which an alerted guard makes the grab
  memorySeconds: 3.2, // how long a guard keeps hunting the last place he saw the thief
};

export const CAMERA = {
  sightRange: 168,
  sightHalfAngle: 0.46,
  sweepHalfAngle: 0.85, // radians each side of the mount's resting direction
  sweepPeriodSeconds: 7, // one full sweep out and back
};

export const ALARM = {
  max: 100,
  guardSeeRate: 46, // alarm points per second while a guard has a clear view, before distance scaling
  cameraSeeRate: 58, // cameras feed the meter faster, but cannot chase
  decayPerSecond: 5.5, // how fast the meter cools while nobody sees the thief
  decayDelaySeconds: 1.4, // grace after the last sighting before cooling starts
  crownGrabFloor: 55, // lifting the crown trips the vault wire: the meter jumps to at least this
  lockdownGraceSeconds: 0.9, // at a full meter, this long in plain sight before the doors slam
  escalateAt: 65, // past this, guards hurry and cameras sweep faster
};

export const TOOLS = {
  smokePellets: 3, // Q: burst of smoke that breaks every line of sight for a few seconds
  decoyCoins: 2, // click / E: a coin clinks where it lands and pulls one guard to look
  jammerUses: 1, // F: kills every camera for a few seconds
  smokeSeconds: 3.2,
  jammerSeconds: 6,
  decoyRadius: 240, // a guard within this of the coin hears it
};

export const SCORE = {
  timeBonusCap: 600, // one point a second under ten minutes, down to zero
  ghostBonus: 400, // the alarm never passed 60
  unseenBonus: 200, // never chased
};
