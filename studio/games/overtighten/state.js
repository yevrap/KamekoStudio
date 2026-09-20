// Overtighten — session state and progress, as pure functions.
//
// Nothing here reads storage; main.js does that and passes the string in. A
// stored value can be absent, stale, hand-edited or nonsense, and every one of
// those is this file's problem rather than the renderer's — the realm's home
// page learned that when a stored "3.7" produced "Visit number 4.7".

/** A stored count, coerced to something a page can render. Anything else becomes 0. */
export function readProgress(raw, plateCount) {
  const n = Math.floor(Number(raw));
  if (!Number.isSafeInteger(n) || n < 0) return 0;
  // A count beyond the plates that exist is not trusted forward: plates can be
  // removed, and "you have cleared 9 of 3" is a worse answer than starting over
  // at the last plate that exists.
  return Math.min(n, plateCount);
}

export function writeProgress(cleared) {
  return String(Math.max(0, Math.floor(Number(cleared) || 0)));
}

/** Plates are offered in order: clearing one opens the next, and no more. */
export function isUnlocked(index, cleared) {
  return index <= cleared;
}

/** Where a returning player is put: the first plate they have not cleared. */
export function resumeIndex(cleared, plateCount) {
  return Math.min(Math.max(0, cleared), Math.max(0, plateCount - 1));
}

/**
 * Clearing a plate advances progress only when it was the furthest one. Replaying
 * plate 1 after clearing plate 3 does not walk progress backwards.
 */
export function afterClear(index, cleared) {
  return Math.max(cleared, index + 1);
}

/** Every plate cleared. The only "you are finished" state the game has. */
export function allCleared(cleared, plateCount) {
  return plateCount > 0 && cleared >= plateCount;
}
