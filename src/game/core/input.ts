import type { InputState } from "./game-state.js";

const LEFT_KEYS = new Set(["ArrowLeft", "a", "A", "q", "Q"]);
const RIGHT_KEYS = new Set(["ArrowRight", "d", "D"]);
const UP_KEYS = new Set(["ArrowUp", "w", "W", "z", "Z"]);
const DOWN_KEYS = new Set(["ArrowDown", "s", "S"]);

export class InputController {
  private readonly state: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.setFromKey(event.key, true);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.setFromKey(event.key, false);
  };

  private setFromKey(key: string, pressed: boolean): void {
    if (LEFT_KEYS.has(key)) this.state.left = pressed;
    if (RIGHT_KEYS.has(key)) this.state.right = pressed;
    if (UP_KEYS.has(key)) this.state.up = pressed;
    if (DOWN_KEYS.has(key)) this.state.down = pressed;
  }

  attach(target: Window): void {
    target.addEventListener("keydown", this.handleKeyDown);
    target.addEventListener("keyup", this.handleKeyUp);
  }

  detach(target: Window): void {
    target.removeEventListener("keydown", this.handleKeyDown);
    target.removeEventListener("keyup", this.handleKeyUp);
  }

  getState(): InputState {
    return this.state;
  }
}
