import { z } from "zod";
import { gameDefinitionSchema } from "../../game/definition/game-definition-schema.js";
import { GAME_TEMPLATES } from "../../game/types/game-template.js";
import { gameConfigSchema } from "./generated-game-schema.js";

// PHASE 7: an item carries either a legacy per-template config or a
// GameDefinition, never both or neither — see generatedGameResultSchema
// for the matching decision on the workflow's output.
export const generatedGameCatalogItemSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(3).max(60),
    description: z.string().min(10).max(240),
    template: z.enum(GAME_TEMPLATES),
    source: z.literal("generated"),
    config: gameConfigSchema.optional(),
    definition: gameDefinitionSchema.optional(),
    createdAt: z.string(),
  })
  .strict()
  .refine(
    (item) => (item.config !== undefined) !== (item.definition !== undefined),
    { message: 'Exactement un de "config" ou "definition" doit être défini.' },
  );

export type GeneratedGameCatalogItem = z.infer<
  typeof generatedGameCatalogItemSchema
>;
