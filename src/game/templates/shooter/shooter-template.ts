import {
  shooterGameConfigSchema,
  type ShooterGameConfig,
} from "../../../mastra/schemas/shooter-game-config-schema.js";
import type { GameTemplateDefinition } from "../game-template-definition.js";
import { createSemanticValidator } from "../../validation/semantic/semantic-validator.js";
import { shooterSemanticRules } from "../../validation/semantic/shooter-semantic-rules.js";
import { createPlayabilityValidator } from "../../validation/playability/playability-validator.js";
import { shooterPlayabilityRules } from "../../validation/playability/shooter-playability-rules.js";
import { defaultShooterConfig } from "./shooter-config.js";
import { ShooterEngine } from "./shooter-engine.js";

const shooterSemanticValidator = createSemanticValidator(shooterSemanticRules);
const shooterPlayabilityValidator = createPlayabilityValidator(
  shooterPlayabilityRules,
);

export const shooterTemplateDefinition: GameTemplateDefinition<
  ShooterGameConfig,
  ShooterEngine
> = {
  id: "shooter",
  description:
    "Le joueur se déplace et tire pour détruire des ennemis avant qu'ils ne l'atteignent.",
  defaultConfig: defaultShooterConfig,
  configSchema: shooterGameConfigSchema,
  createEngine: (config, random) => new ShooterEngine(config, random),
  checkSemantics: shooterSemanticValidator.validate,
  checkPlayability: shooterPlayabilityValidator.validate,
};
