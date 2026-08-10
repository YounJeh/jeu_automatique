import { describe, expect, it } from "vitest";
import { GenericRuntime } from "../../game/core/runtime/generic-runtime.js";
import type { GameDefinition } from "../../game/definition/game-definition-schema.js";
import type { InputState } from "../../game/core/game-state.js";

const noInput: InputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  fire: false,
};

function makeDefinition(
  overrides: Partial<GameDefinition> = {},
): GameDefinition {
  return {
    version: "1",
    metadata: {
      id: "test-game",
      title: "Test Game",
      description: "Un jeu de test pour le runtime générique.",
      theme: "test",
    },
    world: {
      width: 480,
      height: 640,
      boundaries: "clamp",
      durationSeconds: 30,
    },
    player: {
      speed: 220,
      size: 28,
      appearance: { type: "shape", shape: "rectangle", color: "#4fd1c5" },
    },
    entities: [
      {
        id: "obstacle",
        kind: "obstacle",
        size: 28,
        speed: 160,
        spawnIntervalMs: 250,
        appearance: { type: "shape", shape: "rectangle", color: "#f56565" },
      },
      {
        id: "collectible",
        kind: "collectible",
        size: 20,
        spawnIntervalMs: 300,
        appearance: { type: "shape", shape: "circle", color: "#facc15" },
      },
    ],
    mechanics: ["move", "avoid", "collect", "timer"],
    rules: [
      { when: "player-collides-obstacle", then: [{ type: "lose-game" }] },
      { when: "timer-expired", then: [{ type: "win-game" }] },
    ],
    goals: [{ type: "survive", durationSeconds: 30 }],
    presentation: {
      backgroundColor: "#0b1021",
      victoryMessage: "Gagné !",
      defeatMessage: "Perdu...",
    },
    ...overrides,
  };
}

describe("GenericRuntime — load()", () => {
  it("produces an initial state centered player and no entities", () => {
    const runtime = new GenericRuntime();
    runtime.load(makeDefinition());
    const state = runtime.getState();

    expect(state.status).toBe("playing");
    expect(state.score).toBe(0);
    expect(state.elapsedMs).toBe(0);
    expect(state.entities).toEqual([]);
    expect(state.player).toEqual({ x: 480 / 2 - 14, y: 640 / 2 - 14 });
  });

  it("throws if getState() is called before load()", () => {
    const runtime = new GenericRuntime();
    expect(() => runtime.getState()).toThrow();
  });
});

describe("GenericRuntime — update() without start()", () => {
  it("does not change state until start() is called", () => {
    const runtime = new GenericRuntime();
    runtime.load(makeDefinition());
    const before = runtime.getState();

    const after = runtime.update(1000, noInput);

    expect(after).toBe(before);
  });
});

describe("GenericRuntime — movement", () => {
  it("moves the player according to input and player.speed once started", () => {
    const runtime = new GenericRuntime();
    runtime.load(makeDefinition());
    runtime.start();
    const startX = runtime.getState().player.x;

    const state = runtime.update(1000, { ...noInput, left: true });

    expect(state.player.x).toBeCloseTo(startX - 220);
  });

  it("clamps the player position to world bounds", () => {
    const runtime = new GenericRuntime();
    runtime.load(makeDefinition());
    runtime.start();

    runtime.update(1000, { ...noInput, left: true });
    const state = runtime.update(1000, { ...noInput, left: true });

    expect(state.player.x).toBe(0);
  });
});

describe("GenericRuntime — entity spawn/advance", () => {
  it("spawns a moving entity at the top and advances it downward", () => {
    const runtime = new GenericRuntime(() => 0.5);
    runtime.load(makeDefinition());
    runtime.start();

    const afterSpawn = runtime.update(250, noInput);
    const obstacle = afterSpawn.entities.find(
      (e) => e.definitionId === "obstacle",
    );
    expect(obstacle).toBeDefined();
    // Spawns at y = -size then advances the same tick (same convention as
    // DodgeEngine): 250ms at speed 160 moves it 40px from -28 to 12.
    expect(obstacle!.position.y).toBeCloseTo(12);

    const afterAdvance = runtime.update(200, noInput);
    const advancedObstacle = afterAdvance.entities.find(
      (e) => e.id === obstacle!.id,
    );
    expect(advancedObstacle!.position.y).toBeGreaterThan(obstacle!.position.y);
  });

  it("spawns a static entity at a random position and never advances it", () => {
    const runtime = new GenericRuntime(() => 0.5);
    runtime.load(makeDefinition());
    runtime.start();

    const afterSpawn = runtime.update(300, noInput);
    const collectible = afterSpawn.entities.find(
      (e) => e.definitionId === "collectible",
    );
    expect(collectible).toBeDefined();

    const afterTick = runtime.update(1000, noInput);
    const stillThere = afterTick.entities.find((e) => e.id === collectible!.id);
    expect(stillThere!.position).toEqual(collectible!.position);
  });

  it("culls a moving entity once it falls off the bottom of the world", () => {
    const runtime = new GenericRuntime(() => 0.5);
    runtime.load(makeDefinition());
    runtime.start();

    runtime.update(250, noInput); // spawn
    const state = runtime.update(10_000, noInput); // fall far past the bottom

    expect(
      state.entities.find((e) => e.definitionId === "obstacle"),
    ).toBeUndefined();
  });

  it("uses the injected RandomSource for spawn position, never Math.random directly", () => {
    const calls: number[] = [];
    const runtime = new GenericRuntime(() => {
      calls.push(1);
      return 0.25;
    });
    runtime.load(makeDefinition());
    runtime.start();

    runtime.update(250, noInput);

    expect(calls.length).toBeGreaterThan(0);
  });
});
