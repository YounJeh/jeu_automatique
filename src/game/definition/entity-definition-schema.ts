import { z } from "zod";
import { appearanceDefinitionSchema } from "./appearance-definition-schema.js";

export const ENTITY_KINDS = [
  "obstacle",
  "collectible",
  "enemy",
  "projectile",
] as const;

export type EntityKind = (typeof ENTITY_KINDS)[number];

export const MOVEMENT_PATTERNS = ["fall", "seek"] as const;

export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

export const entityDefinitionSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(ENTITY_KINDS),
    size: z.number().positive(),
    speed: z.number().nonnegative().optional(),
    spawnIntervalMs: z.number().positive().optional(),
    // Absent means "fall" (PHASE 2 behavior, unchanged) — optional so the
    // existing dodge/collect/shooter definitions don't need touching.
    // "seek" (PHASE 10) makes the entity move toward the player every
    // frame instead of falling straight down.
    movementPattern: z.enum(MOVEMENT_PATTERNS).optional(),
    appearance: appearanceDefinitionSchema,
  })
  .strict();

export type EntityDefinition = z.infer<typeof entityDefinitionSchema>;
