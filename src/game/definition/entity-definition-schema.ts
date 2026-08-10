import { z } from "zod";
import { appearanceDefinitionSchema } from "./appearance-definition-schema.js";

export const ENTITY_KINDS = [
  "obstacle",
  "collectible",
  "enemy",
  "projectile",
] as const;

export type EntityKind = (typeof ENTITY_KINDS)[number];

export const entityDefinitionSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(ENTITY_KINDS),
    size: z.number().positive(),
    speed: z.number().nonnegative().optional(),
    spawnIntervalMs: z.number().positive().optional(),
    appearance: appearanceDefinitionSchema,
  })
  .strict();

export type EntityDefinition = z.infer<typeof entityDefinitionSchema>;
