import { z } from "zod";
import { baseGameConfigShape, cssColorSchema } from "./shared-config-schema.js";

export const dodgeGameConfigSchema = z
  .object({
    ...baseGameConfigShape,
    template: z.literal("dodge"),
    obstacleColor: cssColorSchema,
    obstacleSpeed: z.number().min(50).max(500),
    obstacleSpawnIntervalMs: z.number().min(250).max(3000),
  })
  .strict();

export type DodgeGameConfig = z.infer<typeof dodgeGameConfigSchema>;
