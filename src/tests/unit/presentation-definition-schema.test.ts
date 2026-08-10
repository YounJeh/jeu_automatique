import { describe, expect, it } from "vitest";
import { presentationDefinitionSchema } from "../../game/definition/presentation-definition-schema.js";

const validPresentation = {
  backgroundColor: "#0b1021",
  victoryMessage: "Vaisseau sauvé !",
  defeatMessage: "Vaisseau détruit...",
};

describe("presentationDefinitionSchema", () => {
  it("accepts a valid presentation object", () => {
    expect(
      presentationDefinitionSchema.safeParse(validPresentation).success,
    ).toBe(true);
  });

  it("rejects an invalid CSS backgroundColor", () => {
    expect(
      presentationDefinitionSchema.safeParse({
        ...validPresentation,
        backgroundColor: "not-a-color",
      }).success,
    ).toBe(false);
  });

  it("rejects a missing victoryMessage", () => {
    const { victoryMessage: _victoryMessage, ...withoutVictory } =
      validPresentation;
    expect(presentationDefinitionSchema.safeParse(withoutVictory).success).toBe(
      false,
    );
  });

  it("rejects an unknown field", () => {
    expect(
      presentationDefinitionSchema.safeParse({
        ...validPresentation,
        extra: "nope",
      }).success,
    ).toBe(false);
  });
});
