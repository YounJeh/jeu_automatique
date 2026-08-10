import { z } from "zod";

export const goalDefinitionSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("survive"),
      durationSeconds: z.number().positive(),
    })
    .strict(),
  z
    .object({ type: z.literal("score"), target: z.number().positive() })
    .strict(),
  z
    .object({ type: z.literal("destroy"), target: z.number().positive() })
    .strict(),
]);

export type GoalDefinition = z.infer<typeof goalDefinitionSchema>;
