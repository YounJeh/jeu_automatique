import type { InputState, Vector2 } from "../../core/game-state.js";

/**
 * PHASE 10: one step of an entity moving toward `target` (e.g. the
 * player) at `speed` px/s, used by the "seek" movementPattern. Distance
 * zero (already on target) returns the position unchanged rather than
 * dividing by zero.
 */
export function computeSeekStep(
  position: Vector2,
  target: Vector2,
  speed: number,
  deltaMs: number,
): Vector2 {
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const distance = Math.hypot(dx, dy);

  if (distance === 0) {
    return { x: position.x, y: position.y };
  }

  const step = (speed * deltaMs) / 1000;
  return {
    x: position.x + (dx / distance) * step,
    y: position.y + (dy / distance) * step,
  };
}

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
