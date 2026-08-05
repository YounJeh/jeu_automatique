import { z } from "zod";
import { dodgeGameConfigSchema } from "./dodge-game-config-schema.js";
import { collectGameConfigSchema } from "./collect-game-config-schema.js";

export const gameConfigSchema = z.discriminatedUnion("template", [
  dodgeGameConfigSchema,
  collectGameConfigSchema,
]);

export type GameConfig = z.infer<typeof gameConfigSchema>;
