# Tests

Run all tests:
```
node --test tests/
```

Requires Node.js 18+. No npm install needed.

## Coverage

| Test file | Functions covered |
|-----------|------------------|
| `keypad-quest.test.js` | `parsePlainText`, `deckToPlainText`, `typeForStreak`, `shuffle`, `lerpHex` |

All tested functions live in `shared/utils.js`. Browser-side logic (game loop, DOM, T9 input state machine) is verified manually by playing the game.
