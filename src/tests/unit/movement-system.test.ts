import { describe, expect, it } from "vitest";
import {
  computeMovement,
  computeSeekStep,
} from "../../game/systems/movement/movement-system.js";
import type { InputState } from "../../game/core/game-state.js";

const noInput: InputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  fire: false,
};

const bounds = { width: 480, height: 640, size: 32 };

describe("computeMovement", () => {
  it("moves left according to speed and deltaMs", () => {
    const result = computeMovement(
      { x: 300, y: 200 },
      220,
      1000,
      { ...noInput, left: true },
      bounds,
    );

    expect(result.x).toBeCloseTo(300 - 220);
    expect(result.y).toBeCloseTo(200);
  });

  it("moves right, up, and down according to speed and deltaMs", () => {
    expect(
      computeMovement(
        { x: 200, y: 200 },
        100,
        1000,
        { ...noInput, right: true },
        bounds,
      ).x,
    ).toBeCloseTo(300);
    expect(
      computeMovement(
        { x: 200, y: 200 },
        100,
        1000,
        { ...noInput, up: true },
        bounds,
      ).y,
    ).toBeCloseTo(100);
    expect(
      computeMovement(
        { x: 200, y: 200 },
        100,
        1000,
        { ...noInput, down: true },
        bounds,
      ).y,
    ).toBeCloseTo(300);
  });

  it("combines simultaneous directional inputs", () => {
    const result = computeMovement(
      { x: 200, y: 200 },
      100,
      1000,
      { ...noInput, right: true, down: true },
      bounds,
    );

    expect(result.x).toBeCloseTo(300);
    expect(result.y).toBeCloseTo(300);
  });

  it("clamps to the left and top bounds", () => {
    const result = computeMovement(
      { x: 5, y: 5 },
      1000,
      1000,
      { ...noInput, left: true, up: true },
      bounds,
    );

    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it("clamps to the right and bottom bounds", () => {
    const result = computeMovement(
      { x: bounds.width - bounds.size - 5, y: bounds.height - bounds.size - 5 },
      1000,
      1000,
      { ...noInput, right: true, down: true },
      bounds,
    );

    expect(result.x).toBe(bounds.width - bounds.size);
    expect(result.y).toBe(bounds.height - bounds.size);
  });

  it("does not move when speed or deltaMs is 0", () => {
    const start = { x: 200, y: 200 };

    expect(
      computeMovement(start, 0, 1000, { ...noInput, right: true }, bounds),
    ).toEqual(start);
    expect(
      computeMovement(start, 220, 0, { ...noInput, right: true }, bounds),
    ).toEqual(start);
  });

  it("does not move when no direction is pressed", () => {
    const start = { x: 200, y: 200 };

    expect(computeMovement(start, 220, 1000, noInput, bounds)).toEqual(start);
  });
});

describe("computeSeekStep", () => {
  it("moves toward a target directly to the right", () => {
    const result = computeSeekStep({ x: 0, y: 0 }, { x: 100, y: 0 }, 50, 1000);

    expect(result.x).toBeCloseTo(50);
    expect(result.y).toBeCloseTo(0);
  });

  it("moves toward a target directly above", () => {
    const result = computeSeekStep({ x: 0, y: 100 }, { x: 0, y: 0 }, 50, 1000);

    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(50);
  });

  it("moves toward a diagonal target with the correct step length", () => {
    const result = computeSeekStep(
      { x: 0, y: 0 },
      { x: 300, y: 400 },
      50,
      1000,
    );

    const stepLength = Math.hypot(result.x, result.y);
    expect(stepLength).toBeCloseTo(50);
    // Direction preserved: 300/400 == 3/4 aspect ratio of the 3-4-5 triangle.
    expect(result.x).toBeCloseTo(30);
    expect(result.y).toBeCloseTo(40);
  });

  it("does not move and avoids NaN when already on the target", () => {
    const result = computeSeekStep(
      { x: 50, y: 50 },
      { x: 50, y: 50 },
      50,
      1000,
    );

    expect(result).toEqual({ x: 50, y: 50 });
  });

  it("does not move when speed or deltaMs is 0", () => {
    const start = { x: 0, y: 0 };
    const target = { x: 100, y: 0 };

    expect(computeSeekStep(start, target, 0, 1000)).toEqual(start);
    expect(computeSeekStep(start, target, 50, 0)).toEqual(start);
  });
});
