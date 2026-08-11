import type { InputState, Vector2 } from "../game-state.js";
import {
  computeMovement,
  computeSeekStep,
} from "../../systems/movement/movement-system.js";
import {
  advanceAndCull,
  shouldSpawn,
  type SpawnAccumulator,
} from "../../systems/spawn/spawn-system.js";
import { partitionByCollision } from "../../systems/collision/collision-system.js";
import type {
  EntityDefinition,
  EntityKind,
} from "../../definition/entity-definition-schema.js";
import type { GameDefinition } from "../../definition/game-definition-schema.js";
import type { RuleEvent } from "../../definition/rule-definition-schema.js";
import type { RandomSource } from "../random/random-source.js";
import type { GameRuntime } from "./game-runtime.js";
import { applyRules, type RuleTrigger } from "./rule-engine.js";
import type { RuntimeEntity, RuntimeState } from "./runtime-state.js";

// Only entity kinds that collide directly with the player map to a rule
// event here. "projectile" needs N:M projectile<->enemy collision, already
// excluded from the shared collision system in PHASE 3 (ShooterEngine
// keeps resolveProjectileCollisions manual) — see tasks/plan.md.
const COLLISION_EVENT_BY_KIND: Partial<Record<EntityKind, RuleEvent>> = {
  obstacle: "player-collides-obstacle",
  collectible: "player-collides-collectible",
  enemy: "player-collides-enemy",
};

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

    const entities = this.advanceEntities(
      definition,
      state.entities,
      player,
      deltaMs,
    );
    const elapsedMs = state.elapsedMs + deltaMs;

    const collisionTriggers = this.detectCollisionTriggers(
      definition,
      player,
      entities,
    );
    const tentative = applyRules(definition.rules, collisionTriggers);
    const projectedScore = state.score + tentative.scoreDelta;
    const projectedHealth =
      state.playerHealth === undefined
        ? undefined
        : state.playerHealth - tentative.healthDelta;

    const syntheticTriggers = this.detectSyntheticTriggers(
      definition,
      elapsedMs,
      projectedScore,
      projectedHealth,
    );

    const outcome = applyRules(definition.rules, [
      ...collisionTriggers,
      ...syntheticTriggers,
    ]);

    const removed = outcome.removedEntityIds;
    const survivors = entities.filter((e) => !removed.has(e.id));
    const spawned = outcome.spawnEntityIds
      .map((id) => definition.entities.find((e) => e.id === id))
      .filter((def): def is EntityDefinition => def !== undefined)
      .map((def) => this.spawnEntity(definition, def));

    this.state = {
      status: outcome.status ?? state.status,
      score: state.score + outcome.scoreDelta,
      elapsedMs,
      player,
      playerHealth:
        state.playerHealth === undefined
          ? undefined
          : state.playerHealth - outcome.healthDelta,
      entities: [...survivors, ...spawned],
    };

    return this.state;
  }

  private detectCollisionTriggers(
    definition: GameDefinition,
    player: RuntimeState["player"],
    entities: RuntimeEntity[],
  ): RuleTrigger[] {
    const triggers: RuleTrigger[] = [];

    for (const entityDef of definition.entities) {
      const event = COLLISION_EVENT_BY_KIND[entityDef.kind];
      if (!event) continue;

      const candidates = entities
        .filter((e) => e.definitionId === entityDef.id)
        .map((e) => ({ x: e.position.x, y: e.position.y, ref: e }));
      if (candidates.length === 0) continue;

      const { hit } = partitionByCollision(
        player,
        definition.player.size,
        candidates,
        entityDef.size,
      );
      if (hit.length === 0) continue;

      triggers.push({ event, hitEntities: hit.map((h) => h.ref) });
    }

    return triggers;
  }

  private detectSyntheticTriggers(
    definition: GameDefinition,
    elapsedMs: number,
    projectedScore: number,
    projectedHealth: number | undefined,
  ): RuleTrigger[] {
    const triggers: RuleTrigger[] = [];

    if (
      definition.world.durationSeconds !== undefined &&
      elapsedMs / 1000 >= definition.world.durationSeconds
    ) {
      triggers.push({ event: "timer-expired", hitEntities: [] });
    }

    const scoreGoal = definition.goals.find((g) => g.type === "score");
    if (scoreGoal && projectedScore >= scoreGoal.target) {
      triggers.push({ event: "score-reached", hitEntities: [] });
    }

    if (projectedHealth !== undefined && projectedHealth <= 0) {
      triggers.push({ event: "health-zero", hitEntities: [] });
    }

    return triggers;
  }

  private advanceEntities(
    definition: GameDefinition,
    current: RuntimeEntity[],
    player: Vector2,
    deltaMs: number,
  ): RuntimeEntity[] {
    let entities = current;

    for (const entityDef of definition.entities) {
      entities = this.tickEntityDefinition(
        definition,
        entityDef,
        entities,
        player,
        deltaMs,
      );
    }

    return entities;
  }

  private tickEntityDefinition(
    definition: GameDefinition,
    entityDef: EntityDefinition,
    current: RuntimeEntity[],
    player: Vector2,
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

    if (entityDef.movementPattern === "seek" && entityDef.speed !== undefined) {
      // Recomputed every frame from the player's current position, never
      // culled by position — the entity stays relevant until removed by a
      // rule (e.g. a player collision), unlike "fall" entities below.
      const speed = entityDef.speed;
      entities = entities.map((e) =>
        e.definitionId === entityDef.id
          ? {
              ...e,
              position: computeSeekStep(e.position, player, speed, deltaMs),
            }
          : e,
      );
    } else if (entityDef.speed !== undefined) {
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

    const position = this.spawnPosition(definition, entityDef);

    return {
      id: `${entityDef.id}-${count}`,
      definitionId: entityDef.id,
      kind: entityDef.kind,
      position,
      velocity:
        entityDef.movementPattern !== "seek" && entityDef.speed !== undefined
          ? { x: 0, y: entityDef.speed }
          : undefined,
    };
  }

  private spawnPosition(
    definition: GameDefinition,
    entityDef: EntityDefinition,
  ): Vector2 {
    if (entityDef.movementPattern === "seek") {
      return this.randomEdgePosition(definition.world, entityDef.size);
    }

    if (entityDef.speed !== undefined) {
      return {
        x: this.random() * (definition.world.width - entityDef.size),
        y: -entityDef.size,
      };
    }

    return {
      x: this.random() * (definition.world.width - entityDef.size),
      y: this.random() * (definition.world.height - entityDef.size),
    };
  }

  // Spawns "seek" entities just outside a random edge of the world so they
  // enter from all directions, not only from the top like "fall" entities.
  private randomEdgePosition(
    world: { width: number; height: number },
    size: number,
  ): Vector2 {
    const edge = Math.floor(this.random() * 4);
    const along = this.random();

    switch (edge) {
      case 0: // top
        return { x: along * (world.width - size), y: -size };
      case 1: // right
        return { x: world.width, y: along * (world.height - size) };
      case 2: // bottom
        return { x: along * (world.width - size), y: world.height };
      default: // left
        return { x: -size, y: along * (world.height - size) };
    }
  }
}
