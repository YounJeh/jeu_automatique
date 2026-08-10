import type { GameDefinition } from "../../definition/game-definition-schema.js";

// PHASE 7: gates routing to GenericRuntime by declared mechanic, not by
// template name — "shoot" needs a fire-triggered spawn and N:M
// projectile<->enemy collision the runtime doesn't implement yet (see
// tasks/plan.md, docs/mechanics/shoot.md). Once that lands, any
// GameDefinition declaring "shoot" starts passing here without touching
// this function's callers.
export function isGenericRuntimeCapable(definition: GameDefinition): boolean {
  return !definition.mechanics.includes("shoot");
}
