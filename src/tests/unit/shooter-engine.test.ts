import { describe, expect, it } from "vitest";
import { shooterGameConfigSchema } from "../../mastra/schemas/shooter-game-config-schema.js";
import type { ShooterGameConfig } from "../../mastra/schemas/shooter-game-config-schema.js";
import { defaultShooterConfig } from "../../game/templates/shooter/shooter-config.js";
import {
  ShooterEngine,
  type ShooterEngineState,
} from "../../game/templates/shooter/shooter-engine.js";
import {
  SHOOTER_CANVAS_HEIGHT,
  SHOOTER_CANVAS_WIDTH,
  SHOOTER_PLAYER_SIZE,
} from "../../game/templates/shooter/shooter-config.js";
import type { InputState } from "../../game/core/game-state.js";

const noInput: InputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  fire: false,
};

function makeConfig(
  overrides: Partial<ShooterGameConfig> = {},
): ShooterGameConfig {
  return shooterGameConfigSchema.parse({
    ...defaultShooterConfig,
    ...overrides,
  });
}

describe("ShooterEngine", () => {
  it("starts in a valid playing state near the bottom, at full health", () => {
    const engine = new ShooterEngine(makeConfig());
    const state: ShooterEngineState = engine.getState();

    expect(state.status).toBe("playing");
    expect(state.health).toBe(defaultShooterConfig.playerHealth);
    expect(state.enemies).toEqual([]);
    expect(state.projectiles).toEqual([]);
    expect(state.score).toBe(0);
    expect(state.killCount).toBe(0);
    expect(state.player.x).toBeCloseTo(
      SHOOTER_CANVAS_WIDTH / 2 - SHOOTER_PLAYER_SIZE / 2,
    );
    expect(state.player.y).toBeLessThan(SHOOTER_CANVAS_HEIGHT);
  });

  it("moves the player according to input and playerSpeed", () => {
    const engine = new ShooterEngine(makeConfig({ playerSpeed: 220 }));
    const startX = engine.getState().player.x;

    const state = engine.update(1000, { ...noInput, left: true });

    expect(state.player.x).toBeCloseTo(startX - 220);
  });

  it("clamps the player position to the canvas bounds", () => {
    const engine = new ShooterEngine(makeConfig({ playerSpeed: 220 }));

    engine.update(1000, { ...noInput, left: true });
    const state = engine.update(1000, { ...noInput, left: true });

    expect(state.player.x).toBe(0);
  });

  it("does not fire before fireCooldownMs has elapsed", () => {
    const engine = new ShooterEngine(makeConfig({ fireCooldownMs: 500 }));

    const state = engine.update(200, { ...noInput, fire: true });

    expect(state.projectiles).toHaveLength(0);
  });

  it("fires a projectile once fireCooldownMs has elapsed while holding fire", () => {
    const engine = new ShooterEngine(makeConfig({ fireCooldownMs: 300 }));

    const state = engine.update(300, { ...noInput, fire: true });

    expect(state.projectiles).toHaveLength(1);
  });

  it("moves projectiles upward over time and removes them off screen", () => {
    const engine = new ShooterEngine(
      makeConfig({ fireCooldownMs: 100, projectileSpeed: 800 }),
    );

    const afterFire = engine.update(100, { ...noInput, fire: true });
    expect(afterFire.projectiles).toHaveLength(1);
    const firstY = afterFire.projectiles[0]!.y;

    const afterAdvance = engine.update(100, noInput);
    expect(afterAdvance.projectiles[0]!.y).toBeLessThan(firstY);

    const afterOffscreen = engine.update(1000, noInput);
    expect(afterOffscreen.projectiles).toHaveLength(0);
  });

  it("spawns and advances enemies over time, removing them off screen", () => {
    const engine = new ShooterEngine(
      makeConfig({ enemySpawnIntervalMs: 250, enemySpeed: 500 }),
      () => 0.5,
    );

    const afterSpawn = engine.update(250, noInput);
    expect(afterSpawn.enemies).toHaveLength(1);
    const firstY = afterSpawn.enemies[0]!.y;

    const afterAdvance = engine.update(200, noInput);
    expect(afterAdvance.enemies[0]!.y).toBeGreaterThan(firstY);

    const afterOffscreen = engine.update(2000, noInput);
    expect(afterOffscreen.enemies).toHaveLength(0);
  });

  it("destroys an enemy hit by a projectile and increases score/killCount", () => {
    // random() = 0.5 keeps every enemy's x aligned with the player's
    // centered spawn x (and therefore with every projectile's x), so a
    // sustained barrage is guaranteed to meet a falling enemy eventually.
    const engine = new ShooterEngine(
      makeConfig({
        fireCooldownMs: 100,
        projectileSpeed: 400,
        enemySpawnIntervalMs: 300,
        enemySpeed: 150,
        gameDurationSeconds: 60,
        playerHealth: 10,
        targetKillCount: 50,
      }),
      () => 0.5,
    );

    let state: ShooterEngineState = engine.getState();
    for (let i = 0; i < 40 && state.killCount === 0; i += 1) {
      state = engine.update(100, { ...noInput, fire: true });
    }

    expect(state.killCount).toBeGreaterThan(0);
    expect(state.score).toBe(state.killCount * 10);
    expect(state.status).toBe("playing");
  });

  it("damages the player and removes the enemy on enemy/player collision", () => {
    // Single tick: an enemy spawned at the top, moving at the max allowed
    // speed for 1224ms, lands exactly on the player's row (x already
    // aligned via random() = 0.5).
    const engine = new ShooterEngine(
      makeConfig({
        enemySpawnIntervalMs: 250,
        enemySpeed: 500,
        playerHealth: 3,
        gameDurationSeconds: 60,
      }),
      () => 0.5,
    );

    const state = engine.update(1224, noInput);

    expect(state.health).toBe(2);
    expect(state.enemies).toHaveLength(0);
  });

  it("ends the game as lost when health reaches 0", () => {
    const engine = new ShooterEngine(
      makeConfig({
        enemySpawnIntervalMs: 250,
        enemySpeed: 500,
        playerHealth: 1,
        gameDurationSeconds: 60,
      }),
      () => 0.5,
    );

    const state = engine.update(1224, noInput);

    expect(state.health).toBe(0);
    expect(state.status).toBe("lost");
  });

  it("ends the game as won once targetKillCount is reached", () => {
    const engine = new ShooterEngine(
      makeConfig({
        fireCooldownMs: 100,
        projectileSpeed: 400,
        enemySpawnIntervalMs: 250,
        enemySpeed: 150,
        gameDurationSeconds: 60,
        playerHealth: 10,
        targetKillCount: 3,
      }),
      () => 0.5,
    );

    let state: ShooterEngineState = engine.getState();
    for (let i = 0; i < 200 && state.status === "playing"; i += 1) {
      state = engine.update(100, { ...noInput, fire: true });
    }

    expect(state.status).toBe("won");
    expect(state.killCount).toBeGreaterThanOrEqual(3);
  });

  it("ends the game as lost once time elapses without reaching the objective", () => {
    const engine = new ShooterEngine(
      makeConfig({ gameDurationSeconds: 10, enemySpawnIntervalMs: 3000 }),
    );

    const state = engine.update(10_000, noInput);

    expect(state.status).toBe("lost");
  });

  it("resets to the initial state, including after won/lost", () => {
    const engine = new ShooterEngine(makeConfig({ gameDurationSeconds: 10 }));

    engine.update(10_000, noInput);
    expect(engine.getState().status).toBe("lost");

    engine.reset();
    const state = engine.getState();

    expect(state.status).toBe("playing");
    expect(state.elapsedMs).toBe(0);
    expect(state.health).toBe(defaultShooterConfig.playerHealth);
    expect(state.enemies).toEqual([]);
    expect(state.projectiles).toEqual([]);
  });

  it("is a no-op once the game has ended", () => {
    const engine = new ShooterEngine(makeConfig({ gameDurationSeconds: 10 }));

    engine.update(10_000, noInput);
    const lostState = engine.getState();
    const nextState = engine.update(1000, { ...noInput, fire: true });

    expect(nextState).toEqual(lostState);
  });
});
