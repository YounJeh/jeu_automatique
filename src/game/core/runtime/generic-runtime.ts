import type { InputState } from "../game-state.js";
import { computeMovement } from "../../systems/movement/movement-system.js";
import {
  advanceAndCull,
  shouldSpawn,
  type SpawnAccumulator,
} from "../../systems/spawn/spawn-system.js";
import type { EntityDefinition } from "../../definition/entity-definition-schema.js";
import type { GameDefinition } from "../../definition/game-definition-schema.js";
import type { RandomSource } from "../random/random-source.js";
import type { GameRuntime } from "./game-runtime.js";
import type { RuntimeEntity, RuntimeState } from "./runtime-state.js";

export class GenericRuntime implements GameRuntime {
  private readonly random: RandomSource;
  private definition: GameDefinition | null = null;
  private state: RuntimeState | null = null;
  private running = false;
  private spawnAccumulators = new Map<string, SpawnAccumulator>();
  private spawnCounters = new Map<string, number>();

  constructor(random: RandomSource = Math.random) {
    this.random = random;
  }

  load(definition: GameDefinition): void {
    this.definition = definition;
    this.running = false;
    this.spawnAccumulators = new Map(
      definition.entities.map((entity) => [
        entity.id,
        { msSinceLastSpawn: 0 } as SpawnAccumulator,
      ]),
    );
    this.spawnCounters = new Map(definition.entities.map((e) => [e.id, 0]));
    this.state = this.createInitialState(definition);
  }

  private createInitialState(definition: GameDefinition): RuntimeState {
    return {
      status: "playing",
      score: 0,
      elapsedMs: 0,
      player: {
        x: definition.world.width / 2 - definition.player.size / 2,
        y: definition.world.height / 2 - definition.player.size / 2,
      },
      playerHealth: definition.player.health,
      entities: [],
    };
  }

  getState(): RuntimeState {
    if (!this.state) {
      throw new Error("GenericRuntime.getState() called before load()");
    }
    return this.state;
  }

  start(): void {
    if (!this.definition) return;
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  restart(): void {
    if (!this.definition) return;
    this.load(this.definition);
  }

  destroy(): void {
    this.running = false;
    this.definition = null;
  }

  update(deltaMs: number, input: InputState): RuntimeState {
    const definition = this.definition;
    const state = this.state;

    if (!definition || !state || !this.running || state.status !== "playing") {
      return this.getState();
    }

    const player = computeMovement(
      state.player,
      definition.player.speed,
      deltaMs,
      input,
      {
        width: definition.world.width,
        height: definition.world.height,
        size: definition.player.size,
      },
    );

    const entities = this.advanceEntities(definition, state.entities, deltaMs);

    this.state = {
      ...state,
      player,
      entities,
      elapsedMs: state.elapsedMs + deltaMs,
    };

    return this.state;
  }

  private advanceEntities(
    definition: GameDefinition,
    current: RuntimeEntity[],
    deltaMs: number,
  ): RuntimeEntity[] {
    let entities = current;

    for (const entityDef of definition.entities) {
      entities = this.tickEntityDefinition(
        definition,
        entityDef,
        entities,
        deltaMs,
      );
    }

    return entities;
  }

  private tickEntityDefinition(
    definition: GameDefinition,
    entityDef: EntityDefinition,
    current: RuntimeEntity[],
    deltaMs: number,
  ): RuntimeEntity[] {
    let entities = current;

    if (entityDef.spawnIntervalMs !== undefined) {
      const accumulator = this.spawnAccumulators.get(entityDef.id)!;
      const { spawn, next } = shouldSpawn(
        accumulator,
        deltaMs,
        entityDef.spawnIntervalMs,
      );
      this.spawnAccumulators.set(entityDef.id, next);

      if (spawn) {
        entities = [...entities, this.spawnEntity(definition, entityDef)];
      }
    }

    if (entityDef.speed !== undefined) {
      const others = entities.filter((e) => e.definitionId !== entityDef.id);
      const flat = entities
        .filter((e) => e.definitionId === entityDef.id)
        .map((e) => ({ x: e.position.x, y: e.position.y, ref: e }));

      const advanced = advanceAndCull(
        flat,
        { x: 0, y: entityDef.speed },
        deltaMs,
        (position) => position.y >= definition.world.height + entityDef.size,
      );

      const advancedEntities: RuntimeEntity[] = advanced.map((a) => ({
        ...a.ref,
        position: { x: a.x, y: a.y },
      }));

      entities = [...others, ...advancedEntities];
    }

    return entities;
  }

  private spawnEntity(
    definition: GameDefinition,
    entityDef: EntityDefinition,
  ): RuntimeEntity {
    const count = this.spawnCounters.get(entityDef.id) ?? 0;
    this.spawnCounters.set(entityDef.id, count + 1);

    const position =
      entityDef.speed !== undefined
        ? {
            x: this.random() * (definition.world.width - entityDef.size),
            y: -entityDef.size,
          }
        : {
            x: this.random() * (definition.world.width - entityDef.size),
            y: this.random() * (definition.world.height - entityDef.size),
          };

    return {
      id: `${entityDef.id}-${count}`,
      definitionId: entityDef.id,
      kind: entityDef.kind,
      position,
      velocity:
        entityDef.speed !== undefined
          ? { x: 0, y: entityDef.speed }
          : undefined,
    };
  }
}
