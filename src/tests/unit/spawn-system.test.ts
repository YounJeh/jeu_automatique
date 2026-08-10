import { describe, expect, it } from "vitest";
import {
  advanceAndCull,
  shouldSpawn,
  type SpawnAccumulator,
} from "../../game/systems/spawn/spawn-system.js";

describe("shouldSpawn", () => {
  it("does not spawn before the interval is reached", () => {
    const accumulator: SpawnAccumulator = { msSinceLastSpawn: 0 };
    const result = shouldSpawn(accumulator, 300, 1000);

    expect(result.spawn).toBe(false);
    expect(result.next.msSinceLastSpawn).toBe(300);
  });

  it("spawns exactly when the accumulated time reaches the interval", () => {
    const accumulator: SpawnAccumulator = { msSinceLastSpawn: 0 };
    const result = shouldSpawn(accumulator, 1000, 1000);

    expect(result.spawn).toBe(true);
    expect(result.next.msSinceLastSpawn).toBe(0);
  });

  it("spawns when the accumulated time exceeds the interval and resets to 0", () => {
    const accumulator: SpawnAccumulator = { msSinceLastSpawn: 900 };
    const result = shouldSpawn(accumulator, 500, 1000);

    expect(result.spawn).toBe(true);
    expect(result.next.msSinceLastSpawn).toBe(0);
  });

  it("accumulates across multiple ticks below the interval", () => {
    let accumulator: SpawnAccumulator = { msSinceLastSpawn: 0 };

    accumulator = shouldSpawn(accumulator, 300, 1000).next;
    accumulator = shouldSpawn(accumulator, 300, 1000).next;
    const result = shouldSpawn(accumulator, 300, 1000);

    expect(result.spawn).toBe(false);
    expect(result.next.msSinceLastSpawn).toBe(900);
  });
});

describe("advanceAndCull", () => {
  it("returns an empty list unchanged", () => {
    expect(advanceAndCull([], { x: 0, y: 50 }, 1000, () => false)).toEqual([]);
  });

  it("advances every entity by velocity * deltaMs / 1000", () => {
    const result = advanceAndCull(
      [
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ],
      { x: 0, y: 50 },
      1000,
      () => false,
    );

    expect(result).toEqual([
      { x: 10, y: 60 },
      { x: 20, y: 70 },
    ]);
  });

  it("filters out entities that go off-screen after moving", () => {
    const result = advanceAndCull(
      [
        { x: 10, y: -40 },
        { x: 20, y: 560 },
      ],
      { x: 0, y: 50 },
      1000,
      (position) => position.y > 600,
    );

    expect(result).toEqual([{ x: 10, y: 10 }]);
  });

  it("keeps all entities when none go off-screen", () => {
    const entities = [
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ];
    const result = advanceAndCull(entities, { x: 0, y: 0 }, 1000, () => false);

    expect(result).toEqual(entities);
  });
});
