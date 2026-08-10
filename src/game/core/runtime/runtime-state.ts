import type { GameStatus, Vector2 } from "../game-state.js";
import type { EntityKind } from "../../definition/entity-definition-schema.js";

export type RuntimeEntity = {
  id: string;
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
