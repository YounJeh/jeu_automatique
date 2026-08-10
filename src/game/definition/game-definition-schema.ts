import { z } from "zod";
import { GAME_MECHANICS } from "../mechanics/registry.js";
import { entityDefinitionSchema } from "./entity-definition-schema.js";
import { gameMetadataSchema } from "./game-metadata-schema.js";
import { goalDefinitionSchema } from "./goal-definition-schema.js";
import { playerDefinitionSchema } from "./player-definition-schema.js";
import { presentationDefinitionSchema } from "./presentation-definition-schema.js";
import { gameRuleSchema } from "./rule-definition-schema.js";
import { worldDefinitionSchema } from "./world-definition-schema.js";

export const gameDefinitionSchema = z
  .object({
    version: z.literal("1"),
    metadata: gameMetadataSchema,
    world: worldDefinitionSchema,
    player: playerDefinitionSchema,
    entities: z.array(entityDefinitionSchema),
    mechanics: z.array(z.enum(GAME_MECHANICS)).min(1),
    rules: z.array(gameRuleSchema),
    goals: z.array(goalDefinitionSchema).min(1),
    presentation: presentationDefinitionSchema,
  })
  .strict();

export type GameDefinition = z.infer<typeof gameDefinitionSchema>;
