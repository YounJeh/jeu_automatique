export const GAME_MECHANICS = [
  "move",
  "avoid",
  "collect",
  "shoot",
  "health",
  "score",
  "timer",
] as const;

export type GameMechanic = (typeof GAME_MECHANICS)[number];

export type MechanicDefinition = {
  id: GameMechanic;
  dependencies: GameMechanic[];
  conflicts?: GameMechanic[];
};

export const mechanicRegistry: Record<GameMechanic, MechanicDefinition> = {
  move: { id: "move", dependencies: [] },
  avoid: { id: "avoid", dependencies: ["move"] },
  collect: { id: "collect", dependencies: ["move"] },
  shoot: { id: "shoot", dependencies: ["move"] },
  health: { id: "health", dependencies: [] },
  score: { id: "score", dependencies: [] },
  timer: { id: "timer", dependencies: [] },
};

export function listMechanics(): MechanicDefinition[] {
  return Object.values(mechanicRegistry);
}

export function getMechanicDefinition(id: GameMechanic): MechanicDefinition {
  const definition = mechanicRegistry[id];
  if (!definition) {
    throw new Error(`Unknown game mechanic: ${String(id)}`);
  }
  return definition;
}
