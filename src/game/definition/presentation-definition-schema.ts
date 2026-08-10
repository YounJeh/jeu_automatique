import { z } from "zod";
import { cssColorSchema } from "../../mastra/schemas/shared-config-schema.js";

export const presentationDefinitionSchema = z
  .object({
    backgroundColor: cssColorSchema,
    victoryMessage: z.string().min(2).max(160),
    defeatMessage: z.string().min(2).max(160),
  })
  .strict();

export type PresentationDefinition = z.infer<
  typeof presentationDefinitionSchema
>;
