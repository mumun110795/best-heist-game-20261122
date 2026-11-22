// The thief's bag: three tools, each with a price. Smoke breaks every sight line
// for a few seconds, a thrown coin pulls one guard away to look, and the jammer
// blinds every camera — none of them refill, so each use is a decision.
import { TOOLS } from './config.js';

export function createToolBag() {
  return {
    smokeLeft: TOOLS.smokePellets,
    coinsLeft: TOOLS.decoyCoins,
    jammerLeft: TOOLS.jammerUses,
    smokeClouds: [], // {x, y, w, h, secondsLeft} — sight-blocking rectangles around the burst
    coin: null, // {x, y} where the last thrown coin lies, drawn as a glint
    jammerSecondsLeft: 0,
  };
}

/** Burst a smoke pellet at the thief's feet. Returns false when the bag is empty. */
export function burstSmoke(bag, x, y) {
  if (bag.smokeLeft <= 0) return false;
  bag.smokeLeft -= 1;
  bag.smokeClouds.push({ x: x - 46, y: y - 46, w: 92, h: 92, secondsLeft: TOOLS.smokeSeconds });
  return true;
}

/** Spend a coin: the caller (main) aims it and distracts the guard. False when none left. */
export function throwCoin(bag, x, y) {
  if (bag.coinsLeft <= 0) return false;
  bag.coinsLeft -= 1;
  bag.coin = { x, y };
  return true;
}

/** Fire the camera jammer. Returns false when its single use is spent. */
export function fireJammer(bag) {
  if (bag.jammerLeft <= 0) return false;
  bag.jammerLeft -= 1;
  bag.jammerSecondsLeft = TOOLS.jammerSeconds;
  return true;
}

/** Age the smoke and the jammer by one step. */
export function stepTools(bag, dt) {
  for (const cloud of bag.smokeClouds) cloud.secondsLeft -= dt;
  bag.smokeClouds = bag.smokeClouds.filter((cloud) => cloud.secondsLeft > 0);
  if (bag.jammerSecondsLeft > 0) bag.jammerSecondsLeft = Math.max(0, bag.jammerSecondsLeft - dt);
}

/** True while the jammer is live: cameras see nothing. */
export function camerasBlind(bag) {
  return bag.jammerSecondsLeft > 0;
}
