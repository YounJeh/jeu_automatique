import { describe, expect, it } from "vitest";
import { gameMetadataSchema } from "../../game/definition/game-metadata-schema.js";

const validMetadata = {
  id: "dodge-game",
  title: "Meteor Dodge",
  description: "Évite les météorites le plus longtemps possible.",
  theme: "space",
};

describe("gameMetadataSchema", () => {
  it("accepts a valid metadata object", () => {
    expect(gameMetadataSchema.safeParse(validMetadata).success).toBe(true);
  });

  it("rejects a missing required field", () => {
    const { theme: _theme, ...withoutTheme } = validMetadata;
    expect(gameMetadataSchema.safeParse(withoutTheme).success).toBe(false);
  });

  it("rejects an unknown field", () => {
    expect(
      gameMetadataSchema.safeParse({ ...validMetadata, extra: "nope" }).success,
    ).toBe(false);
  });

  it("rejects a title shorter than 3 characters", () => {
    expect(
      gameMetadataSchema.safeParse({ ...validMetadata, title: "ab" }).success,
    ).toBe(false);
  });
});
