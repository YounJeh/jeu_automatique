export type GameStatus = "playing" | "won" | "lost";

export type Vector2 = { x: number; y: number };

export type InputState = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export type Rect = { x: number; y: number; size: number };

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.size &&
    a.x + a.size > b.x &&
    a.y < b.y + b.size &&
    a.y + a.size > b.y
  );
}
