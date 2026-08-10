import { z } from "zod";
import { cssColorSchema } from "../../mastra/schemas/shared-config-schema.js";

// PHASE 5: only the "shape" variant. A "sprite" variant needs an asset
// catalog to validate assetId against (PHASE 9), which doesn't exist yet.
export const appearanceDefinitionSchema = z
  .object({
    type: z.literal("shape"),
    shape: z.enum(["rectangle", "circle", "triangle"]),
    color: cssColorSchema,
  })
  .strict();

export type AppearanceDefinition = z.infer<typeof appearanceDefinitionSchema>;
