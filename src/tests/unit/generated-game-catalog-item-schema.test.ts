import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { generatedGameCatalogItemSchema } from "../../mastra/schemas/generated-game-catalog-item-schema.js";
import { generatedGameResultSchema } from "../../mastra/schemas/generated-game-schema.js";
import { defaultDodgeConfig } from "../../game/templates/dodge/dodge-config.js";
import { dodgeGameDefinitionExample } from "../../game/definition/examples/dodge-game-definition.js";

const baseItem = {
  id: "generated-1",
  title: "Un jeu généré",
  description: "Une description suffisamment longue pour passer.",
  template: "dodge" as const,
  source: "generated" as const,
  createdAt: new Date().toISOString(),
};

describe("generatedGameCatalogItemSchema", () => {
  it("accepts an item with config only (legacy pipeline)", () => {
    expect(
      generatedGameCatalogItemSchema.safeParse({
        ...baseItem,
        config: defaultDodgeConfig,
      }).success,
    ).toBe(true);
  });

  it("accepts an item with definition only (PHASE 7 pipeline)", () => {
    expect(
      generatedGameCatalogItemSchema.safeParse({
        ...baseItem,
        definition: dodgeGameDefinitionExample,
      }).success,
    ).toBe(true);
  });

  it("rejects an item with both config and definition", () => {
    expect(
      generatedGameCatalogItemSchema.safeParse({
        ...baseItem,
        config: defaultDodgeConfig,
        definition: dodgeGameDefinitionExample,
      }).success,
    ).toBe(false);
  });

  it("rejects an item with neither config nor definition", () => {
    expect(generatedGameCatalogItemSchema.safeParse(baseItem).success).toBe(
      false,
    );
  });

  it("still reads the existing generated-games.json without error", () => {
    const filePath = resolve(
      process.cwd(),
      "public/generated-games/generated-games.json",
    );
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));
    const result = z.array(generatedGameCatalogItemSchema).safeParse(raw);
    expect(result.success).toBe(true);
  });
});

describe("generatedGameResultSchema", () => {
  const baseResult = {
    id: "generated-1",
    template: "dodge" as const,
    summary: "Un jeu généré.",
    generationId: "generation-1",
    createdAt: new Date().toISOString(),
  };

  it("accepts a result with game only", () => {
    expect(
      generatedGameResultSchema.safeParse({
        ...baseResult,
        game: defaultDodgeConfig,
      }).success,
    ).toBe(true);
  });

  it("accepts a result with definition only", () => {
    expect(
      generatedGameResultSchema.safeParse({
        ...baseResult,
        definition: dodgeGameDefinitionExample,
      }).success,
    ).toBe(true);
  });

  it("rejects a result with both game and definition", () => {
    expect(
      generatedGameResultSchema.safeParse({
        ...baseResult,
        game: defaultDodgeConfig,
        definition: dodgeGameDefinitionExample,
      }).success,
    ).toBe(false);
  });

  it("rejects a result with neither game nor definition", () => {
    expect(generatedGameResultSchema.safeParse(baseResult).success).toBe(false);
  });
});
