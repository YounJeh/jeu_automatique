import type { CollectGameConfig } from "../../mastra/schemas/collect-game-config-schema.js";
import type { DodgeGameConfig } from "../../mastra/schemas/dodge-game-config-schema.js";
import type { ShooterGameConfig } from "../../mastra/schemas/shooter-game-config-schema.js";
import type { LegacyGameTemplate } from "../types/game-template.js";
import { collectTemplateDefinition } from "./collect/collect-template.js";
import type { CollectEngine } from "./collect/collect-engine.js";
import { dodgeTemplateDefinition } from "./dodge/dodge-template.js";
import type { DodgeEngine } from "./dodge/dodge-engine.js";
import { shooterTemplateDefinition } from "./shooter/shooter-template.js";
import type { ShooterEngine } from "./shooter/shooter-engine.js";
import type { GameTemplateDefinition } from "./game-template-definition.js";

type ConfigForTemplate<T extends LegacyGameTemplate> = T extends "dodge"
  ? DodgeGameConfig
  : T extends "collect"
    ? CollectGameConfig
    : ShooterGameConfig;

type EngineForTemplate<T extends LegacyGameTemplate> = T extends "dodge"
  ? DodgeEngine
  : T extends "collect"
    ? CollectEngine
    : ShooterEngine;

/**
 * Catalogue central des templates : source de vérité unique pour connaître
 * les templates disponibles, leur schéma, la création de leur moteur et
 * la vérification de leur jouabilité.
 */
export type GameTemplateDefinitionMap = {
  [T in LegacyGameTemplate]: GameTemplateDefinition<
    ConfigForTemplate<T>,
    EngineForTemplate<T>
  >;
};

export const gameTemplateDefinitions: GameTemplateDefinitionMap = {
  dodge: dodgeTemplateDefinition,
  collect: collectTemplateDefinition,
  shooter: shooterTemplateDefinition,
};

export function getGameTemplateDefinition<T extends LegacyGameTemplate>(
  template: T,
): GameTemplateDefinitionMap[T] {
  return gameTemplateDefinitions[template];
}

export function listGameTemplateDefinitions(): ReadonlyArray<
  GameTemplateDefinitionMap[LegacyGameTemplate]
> {
  return Object.values(gameTemplateDefinitions);
}
