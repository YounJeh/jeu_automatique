import { describe, expect, it } from "vitest";
import { dodgeGameConfigSchema } from "../../mastra/schemas/dodge-game-config-schema.js";
import type { DodgeGameConfig } from "../../mastra/schemas/dodge-game-config-schema.js";
import { defaultDodgeConfig } from "../../game/templates/dodge/dodge-config.js";
import {
  DodgeEngine,
  type DodgeEngineState,
} from "../../game/templates/dodge/dodge-engine.js";
import {
  DODGE_CANVAS_HEIGHT,
  DODGE_CANVAS_WIDTH,
  DODGE_PLAYER_SIZE,
} from "../../game/templates/dodge/dodge-config.js";
import type { InputState } from "../../game/core/game-state.js";

const noInput: InputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  fire: false,
};

function makeConfig(overrides: Partial<DodgeGameConfig> = {}): DodgeGameConfig {
  return dodgeGameConfigSchema.parse({ ...defaultDodgeConfig, ...overrides });
}

describe("DodgeEngine", () => {
  it("starts in a valid playing state centered near the bottom", () => {
    const engine = new DodgeEngine(makeConfig());
    const state: DodgeEngineState = engine.getState();

    expect(state.status).toBe("playing");
    expect(state.obstacles).toEqual([]);
    expect(state.elapsedMs).toBe(0);
    expect(state.score).toBe(0);
    expect(state.player.x).toBeCloseTo(
      DODGE_CANVAS_WIDTH / 2 - DODGE_PLAYER_SIZE / 2,
    );
    expect(state.player.y).toBeLessThan(DODGE_CANVAS_HEIGHT);
  });

  it("moves the player according to input and playerSpeed", () => {
    const engine = new DodgeEngine(makeConfig({ playerSpeed: 220 }));
    const startX = engine.getState().player.x;

    const state = engine.update(1000, { ...noInput, left: true });

    expect(state.player.x).toBeCloseTo(startX - 220);
  });

  it("clamps the player position to the canvas bounds", () => {
    const engine = new DodgeEngine(makeConfig({ playerSpeed: 220 }));

    engine.update(1000, { ...noInput, left: true });
    const state = engine.update(1000, { ...noInput, left: true });

    expect(state.player.x).toBe(0);
  });

  it("spawns and advances obstacles over time", () => {
    const engine = new DodgeEngine(
      makeConfig({ obstacleSpawnIntervalMs: 250, obstacleSpeed: 500 }),
      () => 0.5,
    );

    const afterSpawn = engine.update(250, noInput);
    expect(afterSpawn.obstacles).toHaveLength(1);

    const afterAdvance = engine.update(200, noInput);
    expect(afterAdvance.obstacles[0]!.y).toBeGreaterThan(
      afterSpawn.obstacles[0]!.y,
    );
  });

  it("ends the game as lost when the player collides with an obstacle", () => {
    const engine = new DodgeEngine(
      makeConfig({
        obstacleSpawnIntervalMs: 250,
        obstacleSpeed: 500,
        gameDurationSeconds: 60,
      }),
      () => 0.5,
    );

    engine.update(250, noInput); // spawn aligned with the player's x position
    const state = engine.update(1200, noInput); // fall far enough to reach the player

    expect(state.status).toBe("lost");
  });

  it("ends the game as won once the configured duration is reached", () => {
    const engine = new DodgeEngine(
      makeConfig({ gameDurationSeconds: 10, obstacleSpawnIntervalMs: 3000 }),
    );

    const state = engine.update(10_000, noInput);

    expect(state.status).toBe("won");
  });

  it("increases the score as time elapses", () => {
    const engine = new DodgeEngine(makeConfig());

    const state = engine.update(500, noInput);

    expect(state.score).toBe(5);
  });

  it("resets to the initial state", () => {
    const engine = new DodgeEngine(makeConfig({ gameDurationSeconds: 10 }));

    engine.update(10_000, noInput);
    expect(engine.getState().status).toBe("won");

    engine.reset();
    const state = engine.getState();

    expect(state.status).toBe("playing");
    expect(state.elapsedMs).toBe(0);
    expect(state.obstacles).toEqual([]);
  });
});
