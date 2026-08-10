import type { GameTemplate } from "../types/game-template.js";
import type { GameMechanic } from "./registry.js";

export const templateMechanics: Record<GameTemplate, GameMechanic[]> = {
  dodge: ["move", "avoid", "timer"],
  collect: ["move", "collect", "score", "timer"],
  shooter: ["move", "shoot", "avoid", "health", "score"],
};
