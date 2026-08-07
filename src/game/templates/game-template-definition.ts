import type { z } from "zod";
import type { GameTemplate } from "../types/game-template.js";
import type { SemanticReport } from "../validation/semantic/semantic-validator.js";
import type { PlayabilityReport } from "./playability.js";

/**
 * Définition centrale d'un template de jeu : tout ce dont le catalogue,
 * le moteur et la génération ont besoin pour un template donné.
 *
 * `checkSemantics` et `checkPlayability` sont deux couches distinctes de la
 * validation Zod : le schéma vérifie la structure et les bornes d'un
 * paramètre isolé. `checkSemantics` vérifie la cohérence arithmétique entre
 * champs déclarés (ex. nombre d'objets à collecter vs durée de la partie),
 * tandis que `checkPlayability` simule la capacité physique du joueur dans
 * le monde (ex. vitesse des obstacles vs vitesse du joueur).
 */
export interface GameTemplateDefinition<TConfig, TEngine> {
  readonly id: GameTemplate;
  readonly description: string;
  readonly defaultConfig: TConfig;
  readonly configSchema: z.ZodType<TConfig>;
  createEngine(config: TConfig, random?: () => number): TEngine;
  checkSemantics(config: TConfig): SemanticReport;
  checkPlayability(config: TConfig): PlayabilityReport;
}
