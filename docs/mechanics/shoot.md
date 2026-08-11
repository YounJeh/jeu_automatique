# Mécanique : `shoot`

## Purpose

Permet au joueur de tirer des projectiles pour détruire des ennemis
(template `shooter`). Fait partie du registre fermé de mécaniques
(`src/game/mechanics/registry.ts`, PHASE 4).

## Dependencies

```text
shoot
requires:
- move
```

Déclaré dans `mechanicRegistry.shoot.dependencies = ["move"]`. Aucun
conflit déclaré avec une autre mécanique.

## Runtime behavior

**Statut actuel : représentable, non exécutable par `GenericRuntime`.**

- `ShooterEngine` (`src/game/templates/shooter/shooter-engine.ts`)
  implémente `shoot` intégralement : spawn d'un projectile sur
  `input.fire` (avec cooldown, `fireCooldownMs`), déplacement vertical du
  projectile, collision N:M projectile↔ennemi
  (`resolveProjectileCollisions`). C'est la seule voie d'exécution
  aujourd'hui.
- `GenericRuntime` (`src/game/core/runtime/generic-runtime.ts`) ne spawn
  les entités que par intervalle (`spawnIntervalMs`) ou en réponse à une
  `RuleAction: "spawn-entity"` — jamais en réponse directe à
  `input.fire`. Il n'a pas non plus de détection de collision N:M
  (`COLLISION_EVENT_BY_KIND` ne mappe pas le kind `"projectile"`, cf.
  commentaire dans ce fichier).
- `isGenericRuntimeCapable(definition)`
  (`src/game/core/runtime/generic-runtime-capability.ts`, PHASE 7) route
  donc **toujours** une `GameDefinition` déclarant `shoot` vers
  `ShooterEngine`, jamais vers `GenericRuntime` — que ce soit pour
  `shooter-game` (built-in) ou pour un jeu généré qui tenterait `shoot`
  (le repli de `inferGameDefinitionStep`, PHASE 7 Task 10, est lui-même
  restreint aux presets capables de `GenericRuntime`, donc ne propose
  jamais `shoot` comme repli).

## Events emitted

`RuleEvent` (`src/game/definition/rule-definition-schema.ts`) déclare
`"projectile-collides-enemy"` depuis PHASE 5 — l'événement existe dans le
schéma et peut apparaître dans les `rules` d'une `GameDefinition`
(`shooterPreset` en fait usage), mais **aucun runtime ne le déclenche
aujourd'hui de façon générique** : `ShooterEngine` gère cette collision
manuellement en dehors du système de règles (`RuleEngine`/`applyRules`
n'existaient pas encore quand `ShooterEngine` a été écrit, PHASE 0/1) ;
`GenericRuntime` ne le détecte pas (pas de collision N:M).

## Actions supported

Aucune action dédiée à `shoot` dans `RuleAction`
(`increase-score`/`remove-entity`/`damage-player`/`win-game`/
`lose-game`/`spawn-entity`, PHASE 5) — `shoot` n'a pas besoin d'action
propre : une collision projectile↔ennemi se traduit par les actions
génériques existantes (`increase-score`, `remove-entity`), comme le
montre `shooterPreset` (`src/game/presets/shooter.ts`).

## Validation rules

`shooterPreset.definition` passe intégralement :

- `gameDefinitionSchema` (schéma) ;
- `gameDefinitionSemanticRules` (sémantique) ;
- `gameDefinitionPlayabilityRules` (jouabilité).

`shoot` est donc **représentable** au sens strict de CLAUDE.md §14.3 —
une `GameDefinition` valide peut la déclarer — sans être exécutable par
le moteur générique. Voir `src/tests/unit/shooter-preset.test.ts`.

## Tests

- `src/tests/unit/shooter-preset.test.ts` — validité schéma/sémantique/
  jouabilité de `shooterPreset`, contient bien `"shoot"`.
- `src/tests/unit/generic-runtime-capability.test.ts` — confirme
  `isGenericRuntimeCapable(shooterPreset.definition) === false`.
- `src/tests/unit/infer-game-definition-step.test.ts` — confirme que le
  repli de génération (Task 10) ne sélectionne jamais un preset déclarant
  `shoot`, même quand il obtiendrait le meilleur score de recouvrement de
  mécaniques.
- `src/tests/unit/shooter-engine.test.ts` — comportement complet de
  `shoot` via `ShooterEngine` (seule voie d'exécution réelle).

## Incrément de suivi (hors périmètre de PHASE 7)

Pour que `GenericRuntime` exécute `shoot`, deux primitives génériques
manquent (CLAUDE.md §17, « identifier quelles primitives manquent avant
d'ajouter une famille/mécanique ») :

1. **Spawn déclenché par l'input**, pas seulement par intervalle —
   extension probable de `EntityDefinition`
   (`src/game/definition/entity-definition-schema.ts`) et de
   `PlayerDefinition` (`src/game/definition/player-definition-schema.ts`,
   ex. `fireCooldownMs`), puis de `GenericRuntime.tickEntityDefinition`.
2. **Collision N:M générique** (projectile↔ennemi), distincte de la
   collision 1:N joueur↔entités déjà supportée par
   `partitionByCollision` — extension du système de collision partagé
   (PHASE 3, `src/game/systems/collision/collision-system.ts`) ou nouveau
   module dédié.

Ces deux points étaient déjà identifiés comme différés en PHASE 6
(`tasks/plan.md` de l'époque) et le restent en PHASE 7 : ajouter ces
primitives est un incrément séparé, pas un correctif de dernière minute
à ce plan (CLAUDE.md §38 : pas de mécanique/primitive sans cas d'usage,
schéma, runtime, validation, tests et documentation propres).
