import { describe, expect, it } from "vitest";
import { gameConfigSchema } from "../../mastra/schemas/generated-game-schema.js";
import { dodgeGameConfigSchema } from "../../mastra/schemas/dodge-game-config-schema.js";
import { collectGameConfigSchema } from "../../mastra/schemas/collect-game-config-schema.js";
import { defaultDodgeConfig } from "../../game/templates/dodge/dodge-config.js";
import { defaultCollectConfig } from "../../game/templates/collect/collect-config.js";
import { defaultShooterConfig } from "../../game/templates/shooter/shooter-config.js";

describe("generated game schema", () => {
  it("accepts a valid dodge configuration", () => {
    expect(gameConfigSchema.parse(defaultDodgeConfig)).toEqual(
      defaultDodgeConfig,
    );
  });

  it("accepts a valid collect configuration", () => {
    expect(gameConfigSchema.parse(defaultCollectConfig)).toEqual(
      defaultCollectConfig,
    );
  });

  it("accepts a valid shooter configuration", () => {
    expect(gameConfigSchema.parse(defaultShooterConfig)).toEqual(
      defaultShooterConfig,
    );
  });

  it("rejects an invalid shooter configuration", () => {
    expect(() =>
      gameConfigSchema.parse({
        ...defaultShooterConfig,
        enemySpeed: 999,
      }),
    ).toThrow();
  });

  it("rejects an unknown template", () => {
    expect(() =>
      gameConfigSchema.parse({ ...defaultDodgeConfig, template: "maze" }),
    ).toThrow();
  });

  it("rejects a duration that is too short", () => {
    expect(() =>
      dodgeGameConfigSchema.parse({
        ...defaultDodgeConfig,
        gameDurationSeconds: 5,
      }),
    ).toThrow();
  });

  it("rejects a speed that is too high", () => {
    expect(() =>
      dodgeGameConfigSchema.parse({
        ...defaultDodgeConfig,
        obstacleSpeed: 999,
      }),
    ).toThrow();
  });

  it("rejects an invalid color", () => {
    expect(() =>
      dodgeGameConfigSchema.parse({
        ...defaultDodgeConfig,
        playerColor: "not-a-color",
      }),
    ).toThrow();
  });

  it("rejects an unknown property", () => {
    expect(() =>
      collectGameConfigSchema.parse({ ...defaultCollectConfig, extra: "nope" }),
    ).toThrow();
  });

  it("rejects a collect target count out of bounds", () => {
    expect(() =>
      collectGameConfigSchema.parse({
        ...defaultCollectConfig,
        targetCollectibleCount: 1,
      }),
    ).toThrow();
  });
});
