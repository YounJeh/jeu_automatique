# Mécanique : `avoid`

## Purpose

Permet au joueur d'éviter des menaces (obstacles ou ennemis) plutôt que de
les combattre. Fait partie du registre fermé de mécaniques
(`src/game/mechanics/registry.ts`, PHASE 4). Utilisée par `dodge` (PHASE 0)
et `shooter` (PHASE 2, combinée à `shoot`/`health`), et par `survival`
(PHASE 10).

## Dependencies

```text
avoid
requires:
- move
```

Déclaré dans `mechanicRegistry.avoid.dependencies = ["move"]`. Aucun
conflit déclaré avec une autre mécanique.

## Runtime behavior

Contrairement à `shoot` (`docs/mechanics/shoot.md`), `avoid` est
entièrement exécutable par `GenericRuntime`
(`src/game/core/runtime/generic-runtime.ts`) — aucune restriction dans
`isGenericRuntimeCapable`. Une entité menaçante (`kind: "obstacle"` ou
`"enemy"`, `speed` défini) se déplace selon son `movementPattern`
(`src/game/definition/entity-definition-schema.ts`, PHASE 10) :

- **`"fall"` (absent = défaut, PHASE 2)** : vitesse fixe `{x:0, y:speed}`
  vers le bas, spawn à un x aléatoire en haut du monde
  (`y = -entityDef.size`), retirée dès qu'elle sort par le bas
  (`GenericRuntime.spawnPosition`/`tickEntityDefinition`). C'est le
  comportement de `dodge` (obstacles) et `shooter` (ennemis, via
  `ShooterEngine` côté legacy).
- **`"seek"` (PHASE 10)** : recalculée à chaque frame vers la position
  courante du joueur (`computeSeekStep`,
  `src/game/systems/movement/movement-system.ts`), spawn sur un bord
  aléatoire du monde — haut/bas/gauche/droite
  (`GenericRuntime.randomEdgePosition`) — et jamais retirée par position :
  seul un retrait déclenché par règle (typiquement `player-collides-enemy`
  → `remove-entity`) la fait disparaître. Utilisée par `survival` pour un
  ennemi qui traque le joueur au lieu de tomber en ligne droite.

Une collision joueur/entité menaçante émet l'événement de règle
correspondant (`COLLISION_EVENT_BY_KIND`,
`src/game/core/runtime/generic-runtime.ts`) quel que soit le
`movementPattern` — la détection de collision elle-même
(`detectCollisionTriggers`) est indépendante du mode de déplacement.

## Events emitted

`RuleEvent` (`src/game/definition/rule-definition-schema.ts`) :

- `"player-collides-obstacle"` — entités `kind: "obstacle"`.
- `"player-collides-enemy"` — entités `kind: "enemy"`.

Émis par `GenericRuntime.detectCollisionTriggers`, quel que soit le
`movementPattern` de l'entité.

## Actions supported

Aucune action dédiée à `avoid` dans `RuleAction` — une collision se
traduit par les actions génériques existantes selon le jeu :
`damage-player` (`survival`, `shooter`), `lose-game` direct (`dodge`),
`remove-entity` pour un ennemi encaissé une fois (`survival`).

## Validation rules

`gameDefinitionPlayabilityRules`
(`src/game/definition/game-definition-playability-rules.ts`) applique deux
familles de règles distinctes selon `movementPattern`, car leurs formules
ne partagent pas les mêmes hypothèses géométriques :

- **`"fall"`/absent** : `checkEntityCoverage` (une entité qui peut occuper
  toute la largeur du monde en continu rend l'évitement impossible) et
  `checkEntityPressure` (fréquence/vitesse laissant trop peu de temps au
  joueur pour se replacer) — toutes deux basées sur
  `fallTimeMs = world.height / entity.speed`, qui suppose une chute en
  ligne droite.
- **`"seek"`** : exclue des deux règles ci-dessus (`threatEntities` filtre
  `movementPattern !== "seek"`) ; couverte à la place par
  `checkSeekEntityEscapable`, un `warning` déterministe quand la vitesse
  du poursuivant est au moins égale à celle du joueur (une fois repéré, le
  joueur ne peut alors structurellement jamais le semer).

## Tests

- `src/tests/unit/entity-definition-schema.test.ts` — `movementPattern`
  accepté (`"fall"`, `"seek"`, absent), rejeté hors de l'union fermée.
- `src/tests/unit/movement-system.test.ts` — `computeSeekStep` en
  isolation (direction, norme du pas, cas dégénéré distance nulle).
- `src/tests/unit/generic-runtime.test.ts` — spawn sur bord aléatoire,
  convergence vers le joueur frame par frame, absence de culling par
  position, non-régression du chemin `"fall"` existant.
- `src/tests/unit/game-definition-playability-rules.test.ts` — exclusion
  des entités `"seek"` de `checkEntityCoverage`/`checkEntityPressure`,
  `checkSeekEntityEscapable` (warning si poursuivant ≥ joueur, silence
  sinon).
- `src/tests/unit/survival-preset.test.ts`,
  `src/tests/integration/survival-runtime.test.ts` — `avoid` (via
  `"seek"`) bout en bout dans le preset `survival`.
