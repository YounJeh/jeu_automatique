import type { InputState } from "../game-state.js";
import type { GameDefinition } from "../../definition/game-definition-schema.js";
import type { RuntimeState } from "./runtime-state.js";

// Extends CLAUDE.md §13.1's 5-method sketch with getState()/update():
// without them the runtime is neither testable nor drivable by a caller.
export interface GameRuntime {
  load(definition: GameDefinition): void;
  start(): void;
  stop(): void;
  restart(): void;
  destroy(): void;
  getState(): RuntimeState;
  update(deltaMs: number, input: InputState): RuntimeState;
}
