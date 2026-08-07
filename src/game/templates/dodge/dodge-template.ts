import {
  dodgeGameConfigSchema,
  type DodgeGameConfig,
} from "../../../mastra/schemas/dodge-game-config-schema.js";
import type { GameTemplateDefinition } from "../game-template-definition.js";
import { createSemanticValidator } from "../../validation/semantic/semantic-validator.js";
import { dodgeSemanticRules } from "../../validation/semantic/dodge-semantic-rules.js";
import { createPlayabilityValidator } from "../../validation/playability/playability-validator.js";
import { dodgePlayabilityRules } from "../../validation/playability/dodge-playability-rules.js";
import { defaultDodgeConfig } from "./dodge-config.js";
import { DodgeEngine } from "./dodge-engine.js";

const dodgeSemanticValidator = createSemanticValidator(dodgeSemanticRules);
const dodgePlayabilityValidator = createPlayabilityValidator(
  dodgePlayabilityRules,
);

export const dodgeTemplateDefinition: GameTemplateDefinition<
  DodgeGameConfig,
  DodgeEngine
> = {
  id: "dodge",
  description:
    "Le joueur évite des obstacles qui descendent depuis le haut de l'écran.",
  defaultConfig: defaultDodgeConfig,
  configSchema: dodgeGameConfigSchema,
  createEngine: (config, random) => new DodgeEngine(config, random),
  checkSemantics: dodgeSemanticValidator.validate,
  checkPlayability: dodgePlayabilityValidator.validate,
};
