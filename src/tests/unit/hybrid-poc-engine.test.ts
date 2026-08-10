import { describe, expect, it } from "vitest";
import type { InputState } from "../../game/core/game-state.js";
import {
  HYBRID_POC_CANVAS_HEIGHT,
  HYBRID_POC_CANVAS_WIDTH,
  HYBRID_POC_PLAYER_SIZE,
  defaultHybridPocConfig,
  type HybridPocConfig,
} from "../../game/mechanics/hybrid-poc/hybrid-poc-config.js";
import {
  HybridPocEngine,
  type HybridPocEngineState,
} from "../../game/mechanics/hybrid-poc/hybrid-poc-engine.js";

const noInput: InputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  fire: false,
};

function makeConfig(overrides: Partial<HybridPocConfig> = {}): HybridPocConfig {
  return { ...defaultHybridPocConfig, ...overrides };
}

describe("HybridPocEngine", () => {
  it("starts in a valid playing state centered on the canvas", () => {
    const engine = new HybridPocEngine(makeConfig());
    const state: HybridPocEngineState = engine.getState();

    expect(state.status).toBe("playing");
    expect(state.obstacles).toEqual([]);
    expect(state.collectibles).toEqual([]);
    expect(state.collectedCount).toBe(0);
    expect(state.score).toBe(0);
    expect(state.player.x).toBeCloseTo(
      HYBRID_POC_CANVAS_WIDTH / 2 - HYBRID_POC_PLAYER_SIZE / 2,
    );
    expect(state.player.y).toBeCloseTo(
      HYBRID_POC_CANVAS_HEIGHT / 2 - HYBRID_POC_PLAYER_SIZE / 2,
    );
  });

  it("moves the player according to input and playerSpeed", () => {
    const engine = new HybridPocEngine(makeConfig({ playerSpeed: 220 }));
    const startX = engine.getState().player.x;

    const state = engine.update(1000, { ...noInput, left: true });

    expect(state.player.x).toBeCloseTo(startX - 220);
  });

  it("ends the game as lost when the player collides with an obstacle", () => {
    const engine = new HybridPocEngine(
      makeConfig({ obstacleSpawnIntervalMs: 250, obstacleSpeed: 500 }),
      () => 0.5,
    );

    engine.update(250, noInput); // spawn aligned with the player's x position
    const state = engine.update(400, noInput); // fall to the vertically centered player

    expect(state.status).toBe("lost");
  });

  it("increases collectedCount and score when the player collects a collectible", () => {
    const engine = new HybridPocEngine(
      makeConfig({
        collectibleSpawnIntervalMs: 100,
        targetCollectibleCount: 5,
        obstacleSpawnIntervalMs: 100_000,
      }),
      () => 0.5, // spawns aligned with the player's centered position
    );

    const state = engine.update(100, noInput);

    expect(state.collectedCount).toBe(1);
    expect(state.score).toBe(10);
    expect(state.status).toBe("playing");
  });

  it("ends the game as won once targetCollectibleCount is reached", () => {
    const engine = new HybridPocEngine(
      makeConfig({
        collectibleSpawnIntervalMs: 100,
        targetCollectibleCount: 1,
        obstacleSpawnIntervalMs: 100_000,
      }),
      () => 0.5,
    );

    const state = engine.update(100, noInput);

    expect(state.status).toBe("won");
    expect(state.collectedCount).toBe(1);
  });

  it("resets to the initial state", () => {
    const engine = new HybridPocEngine(
      makeConfig({
        collectibleSpawnIntervalMs: 100,
        targetCollectibleCount: 1,
        obstacleSpawnIntervalMs: 100_000,
      }),
      () => 0.5,
    );

    engine.update(100, noInput);
    expect(engine.getState().status).toBe("won");

    engine.reset();
    const state = engine.getState();

    expect(state.status).toBe("playing");
    expect(state.elapsedMs).toBe(0);
    expect(state.collectedCount).toBe(0);
    expect(state.obstacles).toEqual([]);
    expect(state.collectibles).toEqual([]);
  });

  it("does not advance state once the game has ended", () => {
    const engine = new HybridPocEngine(
      makeConfig({ obstacleSpawnIntervalMs: 250, obstacleSpeed: 500 }),
      () => 0.5,
    );

    engine.update(250, noInput);
    const lostState = engine.update(400, noInput);
    expect(lostState.status).toBe("lost");

    const afterState = engine.update(1000, noInput);
    expect(afterState).toBe(lostState);
  });
});
