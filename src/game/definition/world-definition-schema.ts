import { z } from "zod";

export const worldDefinitionSchema = z
  .object({
    width: z.number().positive(),
    height: z.number().positive(),
    boundaries: z.enum(["solid", "clamp"]),
    durationSeconds: z.number().positive().optional(),
  })
  .strict();

export type WorldDefinition = z.infer<typeof worldDefinitionSchema>;
