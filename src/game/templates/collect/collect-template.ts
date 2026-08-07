import {
  collectGameConfigSchema,
  type CollectGameConfig,
} from "../../../mastra/schemas/collect-game-config-schema.js";
import type { GameTemplateDefinition } from "../game-template-definition.js";
import { createSemanticValidator } from "../../validation/semantic/semantic-validator.js";
import { collectSemanticRules } from "../../validation/semantic/collect-semantic-rules.js";
import { createPlayabilityValidator } from "../../validation/playability/playability-validator.js";
import { collectPlayabilityRules } from "../../validation/playability/collect-playability-rules.js";
import { defaultCollectConfig } from "./collect-config.js";
import { CollectEngine } from "./collect-engine.js";

const collectSemanticValidator = createSemanticValidator(collectSemanticRules);
const collectPlayabilityValidator = createPlayabilityValidator(
  collectPlayabilityRules,
);

export const collectTemplateDefinition: GameTemplateDefinition<
  CollectGameConfig,
  CollectEngine
> = {
  id: "collect",
  description:
    "Le joueur collecte un nombre d'objets donné avant la fin du temps imparti.",
  defaultConfig: defaultCollectConfig,
  configSchema: collectGameConfigSchema,
  createEngine: (config, random) => new CollectEngine(config, random),
  checkSemantics: collectSemanticValidator.validate,
  checkPlayability: collectPlayabilityValidator.validate,
};
