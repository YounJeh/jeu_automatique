import type { GameStatus, Vector2 } from "../game-state.js";
import type { EntityKind } from "../../definition/entity-definition-schema.js";

export type RuntimeEntity = {
  id: string;
  // Links back to the EntityDefinition.id this instance was spawned from —
  // needed because several EntityDefinitions can share the same `kind`
  // (e.g. two differently-tuned "obstacle" entities), so `kind` alone
  // isn't enough to look up the right speed/size when advancing entities.
  definitionId: string;
  kind: EntityKind;
  position: Vector2;
  velocity?: Vector2;
};

export type RuntimeState = {
  status: GameStatus;
  score: number;
  elapsedMs: number;
  player: Vector2;
  playerHealth?: number;
  entities: RuntimeEntity[];
};
