import { z } from "zod";
import { gameDefinitionSchema } from "../../game/definition/game-definition-schema.js";
import { dodgeGameConfigSchema } from "./dodge-game-config-schema.js";
import { collectGameConfigSchema } from "./collect-game-config-schema.js";
import { shooterGameConfigSchema } from "./shooter-game-config-schema.js";

export const gameConfigSchema = z.discriminatedUnion("template", [
  dodgeGameConfigSchema,
  collectGameConfigSchema,
  shooterGameConfigSchema,
]);

export type GameConfig = z.infer<typeof gameConfigSchema>;

// PHASE 7: a generated result carries either a legacy per-template config
// (existing classify -> config pipeline) or a GameDefinition (new
// mechanics -> GameDefinition pipeline, Task 10), never both or neither.
export const generatedGameResultSchema = z
  .object({
    game: gameConfigSchema.optional(),
    definition: gameDefinitionSchema.optional(),
    summary: z.string().min(1),
    generationId: z.string().min(1),
    createdAt: z.string(),
  })
  .refine(
    (result) =>
      (result.game !== undefined) !== (result.definition !== undefined),
    { message: 'Exactement un de "game" ou "definition" doit être défini.' },
  );

export type GeneratedGameResult = z.infer<typeof generatedGameResultSchema>;
