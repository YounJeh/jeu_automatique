import type { z } from "zod";
import type { GameTemplate } from "../types/game-template.js";
import type { PlayabilityReport } from "./playability.js";

/**
 * Définition centrale d'un template de jeu : tout ce dont le catalogue,
 * le moteur et la génération ont besoin pour un template donné.
 *
 * `checkPlayability` est une couche distincte de la validation Zod : le
 * schéma vérifie la structure et les bornes d'un paramètre isolé, tandis que
 * `checkPlayability` vérifie les incohérences entre plusieurs paramètres
 * (ex. vitesse des obstacles vs vitesse du joueur).
 */
export interface GameTemplateDefinition<TConfig, TEngine> {
  readonly id: GameTemplate;
  readonly description: string;
  readonly defaultConfig: TConfig;
  readonly configSchema: z.ZodType<TConfig>;
  createEngine(config: TConfig, random?: () => number): TEngine;
  checkPlayability(config: TConfig): PlayabilityReport;
}
