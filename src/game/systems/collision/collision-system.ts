import { rectsOverlap, type Vector2 } from "../../core/game-state.js";

export function partitionByCollision<T extends Vector2>(
  reference: Vector2,
  referenceSize: number,
  candidates: readonly T[],
  candidateSize: number,
): { hit: T[]; remaining: T[] } {
  const referenceRect = { x: reference.x, y: reference.y, size: referenceSize };
  const hit: T[] = [];
  const remaining: T[] = [];

  for (const candidate of candidates) {
    const candidateRect = {
      x: candidate.x,
      y: candidate.y,
      size: candidateSize,
    };

    if (rectsOverlap(referenceRect, candidateRect)) {
      hit.push(candidate);
    } else {
      remaining.push(candidate);
    }
  }

  return { hit, remaining };
}
