import type { Vector2 } from "../../core/game-state.js";

export type SpawnAccumulator = {
  msSinceLastSpawn: number;
};

export function shouldSpawn(
  accumulator: SpawnAccumulator,
  deltaMs: number,
  intervalMs: number,
): { spawn: boolean; next: SpawnAccumulator } {
  const msSinceLastSpawn = accumulator.msSinceLastSpawn + deltaMs;

  if (msSinceLastSpawn >= intervalMs) {
    return { spawn: true, next: { msSinceLastSpawn: 0 } };
  }

  return { spawn: false, next: { msSinceLastSpawn } };
}

export function advanceAndCull<T extends Vector2>(
  entities: readonly T[],
  velocity: Vector2,
  deltaMs: number,
  isOffScreen: (position: Vector2) => boolean,
): T[] {
  return entities
    .map((entity) => ({
      ...entity,
      x: entity.x + (velocity.x * deltaMs) / 1000,
      y: entity.y + (velocity.y * deltaMs) / 1000,
    }))
    .filter((entity) => !isOffScreen(entity));
}
