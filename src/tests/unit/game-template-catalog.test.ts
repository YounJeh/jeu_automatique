import { describe, expect, it } from "vitest";
import {
  gameTemplateDefinitions,
  getGameTemplateDefinition,
  listGameTemplateDefinitions,
} from "../../game/templates/game-template-catalog.js";
import { defaultDodgeConfig } from "../../game/templates/dodge/dodge-config.js";
import { DodgeEngine } from "../../game/templates/dodge/dodge-engine.js";
import { defaultCollectConfig } from "../../game/templates/collect/collect-config.js";
import { CollectEngine } from "../../game/templates/collect/collect-engine.js";
import { defaultShooterConfig } from "../../game/templates/shooter/shooter-config.js";
import { ShooterEngine } from "../../game/templates/shooter/shooter-engine.js";

describe("game template catalog", () => {
  it("knows the three available templates", () => {
    const ids = listGameTemplateDefinitions().map(
      (definition) => definition.id,
    );
    expect(ids.sort()).toEqual(["collect", "dodge", "shooter"]);
  });

  it("exposes a definition per template id", () => {
    expect(gameTemplateDefinitions.dodge.id).toBe("dodge");
    expect(gameTemplateDefinitions.collect.id).toBe("collect");
    expect(gameTemplateDefinitions.shooter.id).toBe("shooter");
  });

  describe("dodge definition", () => {
    const definition = getGameTemplateDefinition("dodge");

    it("has a default config that satisfies its own schema", () => {
      expect(
        definition.configSchema.safeParse(definition.defaultConfig).success,
      ).toBe(true);
      expect(definition.defaultConfig).toEqual(defaultDodgeConfig);
    });

    it("creates a real DodgeEngine in a playing state", () => {
      const engine = definition.createEngine(definition.defaultConfig);

      expect(engine).toBeInstanceOf(DodgeEngine);
      expect(engine.getState().status).toBe("playing");
    });

    it("considers the default config playable with no issues", () => {
      expect(definition.checkPlayability(definition.defaultConfig)).toEqual({
        playable: true,
        issues: [],
      });
    });
  });

  describe("collect definition", () => {
    const definition = getGameTemplateDefinition("collect");

    it("has a default config that satisfies its own schema", () => {
      expect(
        definition.configSchema.safeParse(definition.defaultConfig).success,
      ).toBe(true);
      expect(definition.defaultConfig).toEqual(defaultCollectConfig);
    });

    it("creates a real CollectEngine in a playing state", () => {
      const engine = definition.createEngine(definition.defaultConfig);

      expect(engine).toBeInstanceOf(CollectEngine);
      expect(engine.getState().status).toBe("playing");
    });

    it("considers the default config playable with no issues", () => {
      expect(definition.checkPlayability(definition.defaultConfig)).toEqual({
        playable: true,
        issues: [],
      });
    });
  });

  describe("shooter definition", () => {
    const definition = getGameTemplateDefinition("shooter");

    it("has a default config that satisfies its own schema", () => {
      expect(
        definition.configSchema.safeParse(definition.defaultConfig).success,
      ).toBe(true);
      expect(definition.defaultConfig).toEqual(defaultShooterConfig);
    });

    it("creates a real ShooterEngine in a playing state", () => {
      const engine = definition.createEngine(definition.defaultConfig);

      expect(engine).toBeInstanceOf(ShooterEngine);
      expect(engine.getState().status).toBe("playing");
    });

    it("considers the default config playable with no issues", () => {
      expect(definition.checkPlayability(definition.defaultConfig)).toEqual({
        playable: true,
        issues: [],
      });
    });
  });
});
