import { z } from "zod";
import { gameDefinitionSchema } from "../../game/definition/game-definition-schema.js";
import { GAME_TEMPLATES } from "../../game/types/game-template.js";
import { dodgeGameConfigSchema } from "./dodge-game-config-schema.js";
import { collectGameConfigSchema } from "./collect-game-config-schema.js";
import { shooterGameConfigSchema } from "./shooter-game-config-schema.js";

export const gameConfigSchema = z.discriminatedUnion("template", [
  dodgeGameConfigSchema,
  collectGameConfigSchema,
  shooterGameConfigSchema,
]);

export type GameConfig = z.infer<typeof gameConfigSchema>;

// PHASE 7: a generated result carries either a legacy per-template config
// (existing classify -> config pipeline) or a GameDefinition (new
// mechanics -> GameDefinition pipeline, Task 10), never both or neither.
// "id" and "template" are always present regardless of which:
// - "id" is the catalog item's identity, distinct from game.id/
//   definition.metadata.id. For the fallback-to-preset case (Task 10),
//   definition.metadata.id is literally a preset's id (e.g. "dodge-game")
//   — reusing it as the catalog item id would collide with the built-in
//   entry of the same id. The server always generates a fresh one
//   (createCatalogEntryStep/createDefinitionCatalogEntryStep); this
//   field carries it back so the frontend doesn't have to (and can't
//   safely) derive one itself.
// - "template" is needed because GameDefinition has no template field of
//   its own (it's declarative, not template-shaped) — the frontend
//   (game-catalog-service.ts) needs it from here to build a
//   GameCatalogItem in either case.
export const generatedGameResultSchema = z
  .object({
    id: z.string().min(1),
    game: gameConfigSchema.optional(),
    definition: gameDefinitionSchema.optional(),
    template: z.enum(GAME_TEMPLATES),
    summary: z.string().min(1),
    generationId: z.string().min(1),
    createdAt: z.string(),
  })
  .refine(
    (result) =>
      (result.game !== undefined) !== (result.definition !== undefined),
    { message: 'Exactement un de "game" ou "definition" doit être défini.' },
  );

export type GeneratedGameResult = z.infer<typeof generatedGameResultSchema>;
