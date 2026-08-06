import { z } from "zod";
import { GAME_TEMPLATES } from "../../game/types/game-template.js";
import { gameConfigSchema } from "./generated-game-schema.js";

export const generatedGameCatalogItemSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(3).max(60),
    description: z.string().min(10).max(240),
    template: z.enum(GAME_TEMPLATES),
    source: z.literal("generated"),
    config: gameConfigSchema,
    createdAt: z.string(),
  })
  .strict();

export type GeneratedGameCatalogItem = z.infer<
  typeof generatedGameCatalogItemSchema
>;
