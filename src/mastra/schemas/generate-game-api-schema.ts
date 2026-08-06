import { z } from "zod";
import { generatedGameResultSchema } from "./generated-game-schema.js";

export const generateGameRequestSchema = z
  .object({
    prompt: z.string(),
  })
  .strict();

export type GenerateGameRequest = z.infer<typeof generateGameRequestSchema>;

const generateGameErrorSchema = z
  .object({
    code: z.string(),
    message: z.string(),
  })
  .strict();

/**
 * Union discriminée sur "success" : reflète le contrat CLAUDE.md §20
 * ({ success, result?, error? }) avec la garantie supplémentaire que
 * result/error sont bien présents selon le cas, plutôt que deux champs
 * optionnels indépendants.
 */
export const generateGameResponseSchema = z.discriminatedUnion("success", [
  z
    .object({ success: z.literal(true), result: generatedGameResultSchema })
    .strict(),
  z
    .object({ success: z.literal(false), error: generateGameErrorSchema })
    .strict(),
]);

export type GenerateGameResponse = z.infer<typeof generateGameResponseSchema>;
