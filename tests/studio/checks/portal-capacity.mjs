// portal-capacity.mjs — the 3D landing page must have room for every game.
//
// createEnvironment() walks ARCADE_GAMES against a table of portal positions
// and skips any index the table does not reach, with a bare `return`. Nothing
// reported the shortfall, so two promoted games sat without a door for as long
// as it took someone to go and count (TD-002).
//
// Counting is what this check does. It reads production source it may not edit,
// which is the point: the studio cannot fix the landing page whenever it likes,
// but it can refuse to be quiet about it.

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { exists } from '../lib/shell.mjs';
import { portalCapacity } from '../lib/rules.mjs';

const GAMEPLAY = 'shared/3d/gameplay.js';
const CONSTANTS = 'shared/3d/constants.js';

export const portalCapacityCheck = {
  id: 'portal-capacity',
  stages: ['ticket', 'gate', 'push'],
  description: 'The 3D landing page has a portal position for every game in ARCADE_GAMES',
  async run(ctx) {
    const files = [GAMEPLAY, CONSTANTS].map(f => path.join(ctx.root, f));
    for (const f of files) {
      if (!(await exists(f))) {
        // Not a failure: the landing page is production's, and this check must
        // not invent a red when the thing it measures is not there to measure.
        return { status: 'skip', detail: `${path.relative(ctx.root, f)} is not present` };
      }
    }
    const [gameplay, constants] = await Promise.all(files.map(f => fs.readFile(f, 'utf8')));
    const { games, slots, problems } = portalCapacity(gameplay, constants);

    return problems.length
      ? { status: 'fail', detail: problems.join('\n  ') }
      : { status: 'pass', detail: `${games} game(s), ${slots} portal slot(s) — every game has a door` };
  }
};
