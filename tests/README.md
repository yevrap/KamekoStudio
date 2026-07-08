# Tests

Run all tests:
```
node --test tests/
```

Requires Node.js 18+. No npm install needed.

## Coverage

| Test file | Functions covered |
|-----------|------------------|
| `keypad-quest.test.js` | `shared/utils.js`: `parsePlainText`, `deckToPlainText`, `typeForStreak`, `shuffle`, `lerpHex` |
| `durak.test.mjs` | `games/durak/`: constants, state, gameplay rules, AI logic (`_test_aiTurn`) |
| `durak-alchemist.test.mjs` | `gridLogic.js` (`spawnCard`, `getEmptyCells`, `spawnRandomBaseCard`, `slideGrid`, `isGameOver`), `combatLogic.js` (`canBeat`, `canTransfer`, `getExposedRanks`), `constants.js` (`getRankLabel`) |

Browser-side logic (game loop, DOM, T9 input state machine) is verified manually by playing the game.

## Running games locally

Games that use ES modules (`type="module"`) require an HTTP server — they won't work via `file://` protocol. Use:

```
npx serve .
```

Then open `http://localhost:3000` in your browser. VS Code Live Server also works.

