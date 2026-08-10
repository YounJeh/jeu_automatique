import { z } from "zod";
import { dodgeGameConfigSchema } from "./dodge-game-config-schema.js";
import { collectGameConfigSchema } from "./collect-game-config-schema.js";
import { shooterGameConfigSchema } from "./shooter-game-config-schema.js";

export const gameConfigSchema = z.discriminatedUnion("template", [
  dodgeGameConfigSchema,
  collectGameConfigSchema,
  shooterGameConfigSchema,
]);

export type GameConfig = z.infer<typeof gameConfigSchema>;

export const generatedGameResultSchema = z.object({
  game: gameConfigSchema,
  summary: z.string().min(1),
  generationId: z.string().min(1),
  createdAt: z.string(),
});

export type GeneratedGameResult = z.infer<typeof generatedGameResultSchema>;
