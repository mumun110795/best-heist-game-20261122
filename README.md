# best-heist-game-20261122

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/mumun110795/best-heist-game-20261122/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/mumun110795/best-heist-game-20261122/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# The Ivory Crown Job

A top-down stealth heist game in plain static files. Tonight the Meridian Museum
sleeps — and its Ivory Crown comes home with you.

Cross seven rooms of a night museum — the Vault, two wings, two galleries, the
Grand Hall and the Foyer — reading four guards' flashlight patrols and three
sweeping cameras. Every watcher feeds one alarm meter: let it fill while you are
in plain sight and the doors slam. Tools cost and never refill — three smoke
pellets that break every sight line, two decoy coins that pull a guard away to
look, one camera jammer. Ordinary treasures lift at a touch; the crown's alarmed
glass takes a held, breathless moment, and lifting it trips the vault wire: from
then on the building never settles, and the run becomes a getaway to the van at
the south doors. Score is haul plus time, ghost and unseen bonuses.

## Play

Serve the `game/` folder with any static server (or run `node serve.ts` here)
and open `game/index.html` in desktop Chrome. No build step, no network.

- Move: WASD / arrow keys · Sneak: SHIFT · Work a case: hold SPACE
- Smoke pellet: Q · Throw a decoy coin: click where it should land · Jammer: F

## Files

- `game/index.html` — the page and its canvas.
- `game/src/` — the game, one job per file: `config.js` (tuning), `level.js`
  (the museum: walls, cover, loot, patrols, cameras), `vision.js` (cones and
  line of sight), `alarm.js` (the meter), `guards.js` (patrols, suspicion,
  chases), `player.js` (the thief), `tools.js` (smoke, coins, jammer),
  `audio.js` (synthesised sound, no files), `input.js`, `render.js` (every
  pixel), `main.js` (the simulation and the score), `shots.js` (the staged
  screenshot scenes behind `?shot=`).
- `screenshots/` — four real renders of the game running in a browser; the
  first is the cover: the thief mid-crossing, cones, cameras, crown and the
  alarm meter in one frame.
- `main.ts` — the hand-in: copies `game/` and `screenshots/` to the output
  directory and writes `dossier.json` with the vendored `buildDossier`.
- `vendor/makefun-game.ts` — the kit's library, unchanged.
- `LICENSE` — MIT.

---

<sub>Entered on [make.fun](https://make.fun/?ref=vdsf53gd&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
