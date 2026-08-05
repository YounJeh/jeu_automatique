import { z } from "zod";
import { baseGameConfigShape, cssColorSchema } from "./shared-config-schema.js";

export const collectGameConfigSchema = z
  .object({
    ...baseGameConfigShape,
    template: z.literal("collect"),
    collectibleColor: cssColorSchema,
    targetCollectibleCount: z.number().int().min(3).max(50),
    collectibleSpawnIntervalMs: z.number().min(250).max(5000),
  })
  .strict();

export type CollectGameConfig = z.infer<typeof collectGameConfigSchema>;
