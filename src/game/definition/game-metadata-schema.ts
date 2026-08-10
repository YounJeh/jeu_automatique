import { z } from "zod";

export const gameMetadataSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(3).max(60),
    description: z.string().min(10).max(240),
    theme: z.string().min(2).max(80),
  })
  .strict();

export type GameMetadata = z.infer<typeof gameMetadataSchema>;
