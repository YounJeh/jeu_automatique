import type { InputState, Vector2 } from "../../core/game-state.js";

export type MovementBounds = {
  width: number;
  height: number;
  size: number;
};

export function computeMovement(
  position: Vector2,
  speed: number,
  deltaMs: number,
  input: InputState,
  bounds: MovementBounds,
): Vector2 {
  const distance = (speed * deltaMs) / 1000;
  let { x, y } = position;

  if (input.left) x -= distance;
  if (input.right) x += distance;
  if (input.up) y -= distance;
  if (input.down) y += distance;

  x = Math.max(0, Math.min(bounds.width - bounds.size, x));
  y = Math.max(0, Math.min(bounds.height - bounds.size, y));

  return { x, y };
}
