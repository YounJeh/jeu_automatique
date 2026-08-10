import { z } from "zod";
import { appearanceDefinitionSchema } from "./appearance-definition-schema.js";

export const playerDefinitionSchema = z
  .object({
    speed: z.number().min(100).max(600),
    size: z.number().positive(),
    health: z.number().positive().optional(),
    appearance: appearanceDefinitionSchema,
  })
  .strict();

export type PlayerDefinition = z.infer<typeof playerDefinitionSchema>;
