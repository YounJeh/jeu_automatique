import { describe, expect, it } from "vitest";
import { collectGameConfigSchema } from "../../mastra/schemas/collect-game-config-schema.js";
import type { CollectGameConfig } from "../../mastra/schemas/collect-game-config-schema.js";
import { defaultCollectConfig } from "../../game/templates/collect/collect-config.js";
import { CollectEngine } from "../../game/templates/collect/collect-engine.js";
import type { InputState } from "../../game/core/game-state.js";

const noInput: InputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  fire: false,
};

const moveTowardOrigin: InputState = {
  left: true,
  right: false,
  up: true,
  down: false,
  fire: false,
};

function makeConfig(
  overrides: Partial<CollectGameConfig> = {},
): CollectGameConfig {
  return collectGameConfigSchema.parse({
    ...defaultCollectConfig,
    ...overrides,
  });
}

describe("CollectEngine", () => {
  it("starts in a valid playing state", () => {
    const engine = new CollectEngine(makeConfig());
    const state = engine.getState();

    expect(state.status).toBe("playing");
    expect(state.collectibles).toEqual([]);
    expect(state.elapsedMs).toBe(0);
    expect(state.score).toBe(0);
    expect(state.collectedCount).toBe(0);
  });

  it("moves the player according to input and playerSpeed", () => {
    const engine = new CollectEngine(makeConfig({ playerSpeed: 100 }));
    const start = engine.getState().player;

    const state = engine.update(1000, { ...noInput, right: true });

    expect(state.player.x).toBeCloseTo(start.x + 100);
  });

  it("spawns a collectible over time", () => {
    const engine = new CollectEngine(
      makeConfig({
        collectibleSpawnIntervalMs: 250,
        targetCollectibleCount: 10,
      }),
      () => 0,
    );

    const state = engine.update(250, noInput);

    expect(state.collectibles).toHaveLength(1);
  });

  it("collects an object on overlap and increases the score", () => {
    const engine = new CollectEngine(
      makeConfig({
        collectibleSpawnIntervalMs: 1000,
        targetCollectibleCount: 5,
        playerSpeed: 600,
        gameDurationSeconds: 60,
      }),
      () => 0,
    );

    // In a single tick: the player reaches the origin and a collectible spawns there.
    const state = engine.update(1000, moveTowardOrigin);

    expect(state.collectibles).toHaveLength(0);
    expect(state.collectedCount).toBe(1);
    expect(state.score).toBe(10);
  });

  it("wins once the target collectible count is reached", () => {
    const engine = new CollectEngine(
      makeConfig({
        collectibleSpawnIntervalMs: 250,
        targetCollectibleCount: 3,
        playerSpeed: 600,
        gameDurationSeconds: 60,
      }),
      () => 0,
    );

    engine.update(1000, moveTowardOrigin);
    engine.update(250, moveTowardOrigin);
    const state = engine.update(250, moveTowardOrigin);

    expect(state.status).toBe("won");
    expect(state.collectedCount).toBe(3);
  });

  it("loses when time runs out before reaching the target", () => {
    const engine = new CollectEngine(
      makeConfig({
        gameDurationSeconds: 10,
        collectibleSpawnIntervalMs: 5000,
        targetCollectibleCount: 5,
      }),
      () => 0,
    );

    const state = engine.update(10_000, noInput);

    expect(state.status).toBe("lost");
    expect(state.collectedCount).toBe(0);
  });

  it("resets to the initial state", () => {
    const engine = new CollectEngine(
      makeConfig({ gameDurationSeconds: 10, collectibleSpawnIntervalMs: 5000 }),
    );

    engine.update(10_000, noInput);
    expect(engine.getState().status).toBe("lost");

    engine.reset();
    const state = engine.getState();

    expect(state.status).toBe("playing");
    expect(state.elapsedMs).toBe(0);
    expect(state.collectibles).toEqual([]);
    expect(state.collectedCount).toBe(0);
  });
});
