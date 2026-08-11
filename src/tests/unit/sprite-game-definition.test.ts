import { describe, expect, it } from "vitest";
import { gameDefinitionSchema } from "../../game/definition/game-definition-schema.js";
import { gameDefinitionSemanticRules } from "../../game/definition/game-definition-semantic-rules.js";
import { gameDefinitionPlayabilityRules } from "../../game/definition/game-definition-playability-rules.js";
import { spriteGameDefinitionExample } from "../../game/definition/examples/sprite-game-definition.js";
import { createSemanticValidator } from "../../game/validation/semantic/semantic-validator.js";
import { createPlayabilityValidator } from "../../game/validation/playability/playability-validator.js";
import { GenericRuntime } from "../../game/core/runtime/generic-runtime.js";
import type { InputState } from "../../game/core/game-state.js";

const noInput: InputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  fire: false,
};

describe("spriteGameDefinitionExample", () => {
  it("uses appearance.type: sprite for the player and an entity", () => {
    expect(spriteGameDefinitionExample.player.appearance.type).toBe("sprite");
    expect(spriteGameDefinitionExample.entities[0]?.appearance.type).toBe(
      "sprite",
    );
  });

  it("validates against gameDefinitionSchema", () => {
    expect(
      gameDefinitionSchema.safeParse(spriteGameDefinitionExample).success,
    ).toBe(true);
  });

  it("has no semantic error issues", () => {
    const report = createSemanticValidator(
      gameDefinitionSemanticRules,
    ).validate(spriteGameDefinitionExample);
    expect(report.valid).toBe(true);
  });

  it("is playable", () => {
    const report = createPlayabilityValidator(
      gameDefinitionPlayabilityRules,
    ).validate(spriteGameDefinitionExample);
    expect(report.playable).toBe(true);
  });

  it("loads into GenericRuntime and ticks without throwing", () => {
    const runtime = new GenericRuntime(() => 0.5);

    expect(() => {
      runtime.load(spriteGameDefinitionExample);
      runtime.start();
      runtime.update(500, noInput);
    }).not.toThrow();

    expect(runtime.getState().status).toBe("playing");
  });
});
