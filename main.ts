// Hand-in for The Ivory Crown Job (Node 22, standard library only).
//
// The game is this directory's game/ folder: plain static files a desktop browser
// plays offline (game/index.html and its ES modules — no library, no build step,
// no network request). This program copies game/ and screenshots/ into the output
// directory and writes dossier.json there with buildDossier from the kit's
// vendored library, byte for byte the way the scorer rebuilds it.
//
// The output directory itself is never deleted: on the grader it is a mounted
// volume and removing its root fails the run. The directory is created if
// missing, and only the entries this program owns inside it are cleared first,
// so two runs write exactly the same bytes.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
for (const owned of ['game', 'screenshots', 'dossier.json']) {
  const target = join(out, owned);
  if (existsSync(target)) rmSync(target, { recursive: true });
}
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The same caps the sealed scorer enforces, so the dossier written here is the
// dossier the gate rebuilds: text capped at 160 KiB, at most 4 screenshots of
// 256 KiB, at most 993 game files and 48 MiB of game in all.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
