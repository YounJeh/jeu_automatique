import { z } from "zod";
import { baseGameConfigShape, cssColorSchema } from "./shared-config-schema.js";

export const shooterGameConfigSchema = z
  .object({
    ...baseGameConfigShape,
    template: z.literal("shooter"),
    enemyColor: cssColorSchema,
    projectileColor: cssColorSchema,
    enemySpeed: z.number().min(50).max(500),
    enemySpawnIntervalMs: z.number().min(250).max(3000),
    projectileSpeed: z.number().min(100).max(800),
    fireCooldownMs: z.number().min(100).max(2000),
    playerHealth: z.number().int().min(1).max(10),
    targetKillCount: z.number().int().min(3).max(50),
  })
  .strict();

export type ShooterGameConfig = z.infer<typeof shooterGameConfigSchema>;
