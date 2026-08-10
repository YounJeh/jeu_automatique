import { describe, expect, it } from "vitest";
import {
  ENTITY_KINDS,
  entityDefinitionSchema,
} from "../../game/definition/entity-definition-schema.js";

const validEntity = {
  id: "obstacle-1",
  kind: "obstacle" as const,
  size: 28,
  appearance: {
    type: "shape" as const,
    shape: "rectangle" as const,
    color: "#f56565",
  },
};

describe("entityDefinitionSchema", () => {
  it.each(ENTITY_KINDS)("accepts each closed entity kind: %s", (kind) => {
    expect(
      entityDefinitionSchema.safeParse({ ...validEntity, kind }).success,
    ).toBe(true);
  });

  it("rejects a kind outside the closed union", () => {
    expect(
      entityDefinitionSchema.safeParse({ ...validEntity, kind: "boss" })
        .success,
    ).toBe(false);
  });

  it("accepts speed and spawnIntervalMs independently absent", () => {
    expect(entityDefinitionSchema.safeParse(validEntity).success).toBe(true);
  });

  it("accepts speed and spawnIntervalMs when both present", () => {
    expect(
      entityDefinitionSchema.safeParse({
        ...validEntity,
        speed: 160,
        spawnIntervalMs: 700,
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid appearance (composed sub-schema failure)", () => {
    expect(
      entityDefinitionSchema.safeParse({
        ...validEntity,
        appearance: { type: "sprite", assetId: "x" },
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown field", () => {
    expect(
      entityDefinitionSchema.safeParse({ ...validEntity, extra: "nope" })
        .success,
    ).toBe(false);
  });
});
