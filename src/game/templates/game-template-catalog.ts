import type { CollectGameConfig } from "../../mastra/schemas/collect-game-config-schema.js";
import type { DodgeGameConfig } from "../../mastra/schemas/dodge-game-config-schema.js";
import type { GameTemplate } from "../types/game-template.js";
import { collectTemplateDefinition } from "./collect/collect-template.js";
import type { CollectEngine } from "./collect/collect-engine.js";
import { dodgeTemplateDefinition } from "./dodge/dodge-template.js";
import type { DodgeEngine } from "./dodge/dodge-engine.js";
import type { GameTemplateDefinition } from "./game-template-definition.js";

type ConfigForTemplate<T extends GameTemplate> = T extends "dodge"
  ? DodgeGameConfig
  : CollectGameConfig;

type EngineForTemplate<T extends GameTemplate> = T extends "dodge"
  ? DodgeEngine
  : CollectEngine;

/**
 * Catalogue central des templates : source de vérité unique pour connaître
 * les templates disponibles, leur schéma, la création de leur moteur et
 * la vérification de leur jouabilité.
 */
export type GameTemplateDefinitionMap = {
  [T in GameTemplate]: GameTemplateDefinition<
    ConfigForTemplate<T>,
    EngineForTemplate<T>
  >;
};

export const gameTemplateDefinitions: GameTemplateDefinitionMap = {
  dodge: dodgeTemplateDefinition,
  collect: collectTemplateDefinition,
};

export function getGameTemplateDefinition<T extends GameTemplate>(
  template: T,
): GameTemplateDefinitionMap[T] {
  return gameTemplateDefinitions[template];
}

export function listGameTemplateDefinitions(): ReadonlyArray<
  GameTemplateDefinitionMap[GameTemplate]
> {
  return Object.values(gameTemplateDefinitions);
}
