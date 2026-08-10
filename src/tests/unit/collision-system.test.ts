import { describe, expect, it } from "vitest";
import { partitionByCollision } from "../../game/systems/collision/collision-system.js";

describe("partitionByCollision", () => {
  it("returns an empty hit list and the full input as remaining when nothing overlaps", () => {
    const candidates = [
      { x: 100, y: 100 },
      { x: 200, y: 200 },
    ];
    const result = partitionByCollision({ x: 0, y: 0 }, 10, candidates, 10);

    expect(result.hit).toEqual([]);
    expect(result.remaining).toEqual(candidates);
  });

  it("separates a single overlapping candidate into hit", () => {
    const overlapping = { x: 5, y: 5 };
    const distant = { x: 200, y: 200 };
    const result = partitionByCollision(
      { x: 0, y: 0 },
      10,
      [overlapping, distant],
      10,
    );

    expect(result.hit).toEqual([overlapping]);
    expect(result.remaining).toEqual([distant]);
  });

  it("separates several simultaneously overlapping candidates", () => {
    const a = { x: 2, y: 2 };
    const b = { x: 4, y: 4 };
    const distant = { x: 500, y: 500 };
    const result = partitionByCollision(
      { x: 0, y: 0 },
      10,
      [a, distant, b],
      10,
    );

    expect(result.hit).toEqual([a, b]);
    expect(result.remaining).toEqual([distant]);
  });

  it("does not count edge-to-edge tangent rects as a collision", () => {
    const tangent = { x: 10, y: 0 };
    const result = partitionByCollision({ x: 0, y: 0 }, 10, [tangent], 10);

    expect(result.hit).toEqual([]);
    expect(result.remaining).toEqual([tangent]);
  });
});
