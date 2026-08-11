import { z } from "zod";
import { cssColorSchema } from "../../mastra/schemas/shared-config-schema.js";
import { ASSET_IDS } from "../assets/asset-catalog.js";

const shapeAppearanceSchema = z
  .object({
    type: z.literal("shape"),
    shape: z.enum(["rectangle", "circle", "triangle"]),
    color: cssColorSchema,
  })
  .strict();

// assetId is closed over the catalog's own ids (z.enum), same pattern as
// ENTITY_KINDS: a fixed, app-controlled set, not an arbitrary string. This
// makes it structurally impossible for a definition to reference a
// filesystem path, a URL, or an unregistered asset (CLAUDE.md §16.2/§23).
const spriteAppearanceSchema = z
  .object({
    type: z.literal("sprite"),
    assetId: z.enum(ASSET_IDS),
  })
  .strict();

export const appearanceDefinitionSchema = z.discriminatedUnion("type", [
  shapeAppearanceSchema,
  spriteAppearanceSchema,
]);

export type AppearanceDefinition = z.infer<typeof appearanceDefinitionSchema>;
