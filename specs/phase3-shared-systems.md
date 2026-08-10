# Spec : PHASE 3 — Extraction des systèmes réutilisables

Statut : **validée** — les questions 1 et 2 ont été tranchées par
l'utilisateur (voir §12) ; question 3 est une recommandation
d'ordonnancement non bloquante.

Référence : `CLAUDE.md` §10 (PHASE 3 — objectif, systèmes potentiels, types
fondamentaux, input, collision, interdits, critères de sortie), §19
(arborescence cible `src/game/systems/**`), §41 (ECS : ne pas y aller sans
nécessité concrète), §52 (ordre de priorité : PHASE 3 après PHASE 2), §29
(pyramide de tests). Complète `specs/phase2-shooter-template.md`, qui
introduisait volontairement de la duplication (§3 de ce spec : « pas
d'extraction de systèmes communs ... c'est le but même de PHASE 3 ») pour
révéler les abstractions réellement communes entre trois moteurs.

## 1. Problème

`DodgeEngine`, `CollectEngine` et `ShooterEngine`
(`src/game/templates/{dodge,collect,shooter}/*-engine.ts`) dupliquent
aujourd'hui trois motifs identiques ou quasi identiques, constatés par
lecture directe des trois fichiers :

1. **Déplacement joueur + clampage aux bords du canvas.** Les trois
   `computePlayerPosition` (dodge-engine.ts:84-97, collect-engine.ts:95-108,
   shooter-engine.ts:109-122) appliquent exactement la même logique :
   distance = vitesse × delta / 1000, addition selon les 4 flags directionnels
   de `InputState`, puis `Math.max(0, Math.min(bound - size, valeur))` sur x
   et y. Seules les constantes (taille du canvas, taille du joueur) diffèrent
   par template.
2. **Spawn périodique avec accumulateur de temps.** dodge (obstacles,
   dodge-engine.ts:99-115) et shooter (ennemis, shooter-engine.ts:146-160)
   partagent le motif exact « accumuler `deltaMs`, si ≥ intervalle configuré
   alors réinitialiser l'accumulateur et faire apparaître une entité en haut
   du canvas à x aléatoire », puis avancer toutes les entités verticalement
   et filtrer celles sorties de l'écran. `collect` (collect-engine.ts:110-128)
   utilise le même accumulateur mais un point de spawn différent (x **et** y
   aléatoires, pas de bord fixe) et une condition d'arrêt supplémentaire
   (`spawnedCount < targetCollectibleCount`). Les projectiles du shooter
   (shooter-engine.ts:124-144) sont un troisième variant : spawn déclenché par
   `input.fire` (pas un minuteur pur) depuis la position du joueur, et
   déplacement vers le haut (vitesse négative) au lieu du bas.
3. **Résolution de collision joueur/entité et entité/entité**, construite sur
   `rectsOverlap` déjà présent dans `src/game/core/game-state.ts`. dodge
   (`hasCollision`, dodge-engine.ts:117-126, booléen simple) et collect
   (`collectOverlapping`, collect-engine.ts:130-153, partition
   ramassé/restant) résolvent joueur↔entité. shooter en a **deux** occurrences
   symétriques : projectile↔ennemi (shooter-engine.ts:162-199) et
   joueur↔ennemi (shooter-engine.ts:201-228). Les quatre fonctions
   reconstruisent chacune un `Rect` à partir d'un `Vector2` + une taille fixe
   avant d'appeler `rectsOverlap`.
4. **Accumulation de `elapsedMs`** à chaque `update()`, identique dans les
   trois moteurs (`this.state.elapsedMs + deltaMs`), même si la condition de
   victoire/défaite qui en dépend diffère par template et **reste dans
   l'engine** (voir §3).

CLAUDE.md §10 demande d'extraire « uniquement les concepts manifestement
communs », justifiés par de la duplication réelle — pas de dessiner une
architecture ECS théorique. Les quatre points ci-dessus sont les seules
duplications constatées ; `health` (shooter uniquement),
`score`/`killCount`/`collectedCount` (calcul de score différent par
template : `elapsedMs/100` pour dodge, `collectedCount*10` pour collect,
`killCount*10` pour shooter) et le rendu (`*-renderer.ts`, non lu en détail
mais hors périmètre engine) n'ont pas de seconde occurrence identique
ailleurs et ne sont donc **pas** extraits dans cette phase (CLAUDE.md §10.1 :
« Il n'est pas obligatoire que tous existent. Créer uniquement ceux
justifiés par plusieurs templates »).

## 2. Objectif

Créer trois modules purs et testés indépendamment sous `src/game/systems/`
(CLAUDE.md §19), puis faire consommer ces modules par les trois engines
existants **sans changer leur comportement observable** :

1. **`movement` system** — calcule la nouvelle position d'un mobile à partir
   d'une position, d'une vitesse, d'un `InputState` et de bornes de clampage.
2. **`spawn` system** — gère un accumulateur de temps et décide, à chaque
   tick, si une nouvelle entité doit apparaître ; suffisamment général pour
   couvrir le variant « bord fixe, direction fixe » (dodge/enemies) et le
   variant « position aléatoire complète, compte plafonné » (collect), sans
   forcer les projectiles du shooter (déclenchés par input, pas par
   minuteur) dans le même moule si cela le complexifie inutilement (voir
   Question 1, §12).
3. **`collision` system** — résout un ensemble d'entités contre une entité de
   référence (ou entre deux ensembles) via `rectsOverlap`, en retournant les
   entités touchées et les entités restantes, remplaçant `hasCollision`,
   `collectOverlapping`, `resolveProjectileCollisions` et
   `resolvePlayerCollisions`.

Chaque moteur (`DodgeEngine`, `CollectEngine`, `ShooterEngine`) est ensuite
modifié pour appeler ces systèmes au lieu de sa propre logique dupliquée,
tout en gardant son état, sa boucle `update()` et ses règles de victoire/
défaite propres (CLAUDE.md §10.3, §10.4 : composition et fonctions pures,
pas de fusion des moteurs).

`elapsedMs` (point 4 du problème) reste une simple addition inline dans
chaque engine : trois occurrences d'une ligne ne justifient pas un module
séparé (CLAUDE.md §41, §56 : « measured complexity over fashionable
architecture »).

## 3. Non-objectifs (explicitement hors périmètre)

Interdits explicites CLAUDE.md §10.4 :

- remplacer les trois templates par une `GameDefinition` — PHASE 5 ;
- construire un ECS complet (composants, entités génériques, requêtes) sans
  nécessité démontrée — CLAUDE.md §41 ;
- créer un éditeur visuel ;
- ajouter des dizaines de systèmes « pour plus tard » (`HealthSystem`,
  `ScoreSystem`, `ProjectileSystem`, `BoundarySystem`, `TimerSystem` listés en
  CLAUDE.md §10.1 comme _potentiels_ ne sont **pas** créés ici — voir §1 :
  aucun n'a de seconde occurrence dupliquée justifiant l'extraction
  aujourd'hui).

Précisions supplémentaires propres à cette feature :

- **Aucun changement de comportement jouable.** Les trois jeux doivent
  produire exactement les mêmes trajectoires/état pour les mêmes séquences
  d'`update()` qu'avant la migration — vérifié par les tests d'engine
  existants, qui ne doivent pas changer d'assertions (seuls des tests de
  systèmes nouveaux s'ajoutent).
- **Pas de centralisation de l'input** au-delà de l'`InputState` déjà
  existant (CLAUDE.md §10.3 mentionne `InputState` comme centralisation déjà
  faite en PHASE 2 — rien à ajouter ici).
- **Pas de dépendance à Mastra** dans `src/game/systems/**` (CLAUDE.md §10,
  critère de sortie : « aucun système spécifique ne dépend de Mastra »).
- **Pas de dépendance à `score`/`health`/`killCount`** dans les systèmes
  extraits : ces champs restent calculés dans chaque engine, pas dans un
  système partagé.
- Pas de changement des schémas Zod, pas de changement de rendu
  (`*-renderer.ts`), pas de changement du workflow Mastra, pas de changement
  frontend (`src/app/**`).

## 4. Hypothèses posées

1. **Emplacement** : `src/game/systems/movement/`, `src/game/systems/spawn/`,
   `src/game/systems/collision/`, chacun avec un fichier principal exportant
   des fonctions pures (pas de classes, CLAUDE.md §10.2 : « composition,
   données simples, fonctions pures »), suivant l'arborescence cible
   CLAUDE.md §19.
2. **`movement` system — signature.**
   ```ts
   // src/game/systems/movement/movement-system.ts
   export type MovementBounds = { width: number; height: number; size: number };

   export function computeMovement(
     position: Vector2,
     speed: number,
     deltaMs: number,
     input: InputState,
     bounds: MovementBounds,
   ): Vector2;
   ```
   Remplace les trois `computePlayerPosition` à l'identique (mêmes valeurs de
   sortie pour les mêmes entrées).
3. **`collision` system — signature.**
   ```ts
   // src/game/systems/collision/collision-system.ts
   export type CollisionCandidate = { position: Vector2; size: number };

   export function partitionByCollision<T extends CollisionCandidate>(
     reference: CollisionCandidate,
     candidates: readonly T[],
   ): { hit: T[]; remaining: T[] };
   ```
   `hasCollision` (dodge) devient `partitionByCollision(...).hit.length > 0`.
   `collectOverlapping` (collect) devient directement
   `partitionByCollision(playerRect, collectibles)` (renommage
   hit→collectedNow.length, remaining→remaining). `resolvePlayerCollisions`
   (shooter) devient `partitionByCollision(playerRect, enemies)` (hit→
   dégâts, remaining→finalEnemies). `resolveProjectileCollisions` (shooter)
   est un cas N:M (chaque ennemi peut être touché par au plus un projectile,
   chaque projectile touche au plus un ennemi) — voir Question 2 (§12) : soit
   `partitionByCollision` est appelé une fois par ennemi contre la liste de
   projectiles restants (aujourd'hui : boucle manuelle avec `Set` d'indices
   déjà touchés), soit cette fonction N:M reste dans `ShooterEngine` si la
   généraliser complexifie plus qu'elle ne simplifie.
4. **`spawn` system — signature (couvre dodge/shooter-enemies ; collect
   séparé, voir Question 1).**
   ```ts
   // src/game/systems/spawn/spawn-system.ts
   export type SpawnAccumulator = { msSinceLastSpawn: number };

   export function shouldSpawn(
     accumulator: SpawnAccumulator,
     deltaMs: number,
     intervalMs: number,
   ): { spawn: boolean; next: SpawnAccumulator };
   ```
   Le point de spawn (x aléatoire en haut / x+y aléatoires / position du
   joueur) et le vecteur de déplacement restent calculés dans l'engine
   appelant, qui utilise aussi une fonction de déplacement+filtrage
   générique :
   ```ts
   export function advanceAndCull<T extends { position: Vector2 }>(
     entities: readonly T[],
     velocity: Vector2,
     deltaMs: number,
     isOffScreen: (position: Vector2) => boolean,
   ): T[];
   ```
5. **Les trois engines gardent leur état privé, leur `constructor`, leur
   `reset()`, `getState()` et la forme de leur `update()`** — seule
   l'implémentation interne de `computePlayerPosition`,
   `computeObstacles`/`computeEnemies`/`computeCollectibles`/
   `computeProjectiles` et `hasCollision`/`collectOverlapping`/
   `resolve*Collisions` change, en déléguant aux systèmes.
6. **Migration sans fallback ancien code** : contrairement à PHASE 6
   (§13.5 CLAUDE.md, qui recommande de garder l'ancien moteur en fallback le
   temps de valider un nouveau runtime), PHASE 3 ne change pas de moteur —
   elle factorise du code équivalent à l'intérieur des moteurs existants.
   Aucun fallback n'est nécessaire : les tests d'engine existants (déjà
   verts) servent de filet de sécurité de non-régression.
7. **Aucune nouvelle dépendance.**

## 5. Stack technique

Inchangée — TypeScript strict, Vitest. Aucune nouvelle dépendance.

## 6. Commandes

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm check          # les quatre ci-dessus
pnpm test:e2e        # aucune régression attendue, comportement inchangé
```

## 7. Structure du projet (fichiers concernés)

```
src/game/systems/movement/movement-system.ts        # nouveau
src/game/systems/spawn/spawn-system.ts               # nouveau
src/game/systems/collision/collision-system.ts       # nouveau

src/game/templates/dodge/dodge-engine.ts              # modifié — délègue movement/spawn/collision
src/game/templates/collect/collect-engine.ts          # modifié — délègue movement/spawn/collision
src/game/templates/shooter/shooter-engine.ts          # modifié — délègue movement/spawn/collision

src/tests/unit/movement-system.test.ts                 # nouveau
src/tests/unit/spawn-system.test.ts                     # nouveau
src/tests/unit/collision-system.test.ts                 # nouveau

src/tests/unit/dodge-engine.test.ts                     # inchangé dans ses assertions (filet de non-régression)
src/tests/unit/collect-engine.test.ts                   # inchangé dans ses assertions
src/tests/unit/shooter-engine.test.ts                   # inchangé dans ses assertions
```

Aucun fichier sous `src/app/**`, `src/mastra/**`, `*-renderer.ts`,
`*-config.ts` ou `*-schema.ts` n'est modifié.

## 8. Style de code

Fonctions pures, pas de classes, pas de `this`, entrées/sorties typées,
même style que `rectsOverlap` déjà présent dans `game-state.ts` :

```ts
// src/game/systems/movement/movement-system.ts
import type { InputState, Vector2 } from "../../core/game-state.js";

export type MovementBounds = {
  width: number;
  height: number;
  size: number;
};

export function computeMovement(
  position: Vector2,
  speed: number,
  deltaMs: number,
  input: InputState,
  bounds: MovementBounds,
): Vector2 {
  const distance = (speed * deltaMs) / 1000;
  let { x, y } = position;

  if (input.left) x -= distance;
  if (input.right) x += distance;
  if (input.up) y -= distance;
  if (input.down) y += distance;

  x = Math.max(0, Math.min(bounds.width - bounds.size, x));
  y = Math.max(0, Math.min(bounds.height - bounds.size, y));

  return { x, y };
}
```

Usage attendu dans `DodgeEngine` (illustratif) :

```ts
private computePlayerPosition(deltaMs: number, input: InputState): Vector2 {
  return computeMovement(this.state.player, this.config.playerSpeed, deltaMs, input, {
    width: DODGE_CANVAS_WIDTH,
    height: DODGE_CANVAS_HEIGHT,
    size: DODGE_PLAYER_SIZE,
  });
}
```

## 9. Stratégie de tests

Reprend le motif CLAUDE.md §10 + §29.1 (unit tests pour systèmes) :

**`movement-system.test.ts`** : déplacement selon chaque direction seule et
combinée, clampage aux 4 bords, vitesse 0, `deltaMs` 0.

**`spawn-system.test.ts`** : pas de spawn avant l'intervalle, spawn exact à
l'intervalle, accumulateur réinitialisé après spawn, accumulation sur
plusieurs ticks sous l'intervalle ; `advanceAndCull` — déplacement selon
vélocité, filtrage des entités hors écran, liste vide reste vide.

**`collision-system.test.ts`** : aucune collision → `hit` vide, `remaining`
= entrée complète ; une collision → séparation correcte ; plusieurs
collisions simultanées ; rects tangents (bord à bord, non chevauchant) ne
comptent pas comme collision (comportement actuel de `rectsOverlap`, à
préserver).

**Non-régression** : `dodge-engine.test.ts`, `collect-engine.test.ts`,
`shooter-engine.test.ts` passent sans modification de leurs assertions —
seule preuve acceptable que la migration n'a pas changé le comportement
observable.

## 10. Limites

- **Toujours** : garder les systèmes sans dépendance à Zod/Mastra/LLM ;
  garder `random: () => number` injectable dans les engines (les systèmes
  eux-mêmes n'ont pas besoin de RNG) ; ne pas modifier les assertions des
  tests d'engine existants pendant la migration (si un test doit changer,
  c'est un signal de régression, pas une mise à jour anodine) ; documenter
  chaque système avec un commentaire de tête minimal si le rôle n'est pas
  évident du nom.
- **Demander avant** : élargir un système au-delà des 3 signatures décrites
  en §4 ; introduire un type `Entity`/ECS générique ; toucher aux fichiers
  `*-renderer.ts`, `*-config.ts` ou aux schémas Zod.
- **Jamais** : fusionner les trois engines en un seul moteur générique
  (réservé à PHASE 5/6) ; introduire une dépendance à un framework ECS
  externe ; dupliquer encore plus de logique au lieu de la réduire.

## 11. Critères de succès

Repris de CLAUDE.md §10 « Critères de sortie PHASE 3 » :

1. Duplications listées en §1 réduites (movement ×3, spawn-accumulator ×3,
   collision-resolution ×4 remplacées par des appels aux systèmes partagés).
2. Comportement des trois jeux inchangé (tests d'engine existants verts sans
   modification d'assertions ; `pnpm test:e2e` vert).
3. Tests existants toujours verts.
4. Systèmes partagés testés indépendamment (`movement-system.test.ts`,
   `spawn-system.test.ts`, `collision-system.test.ts`).
5. Aucun système sous `src/game/systems/**` ne dépend de Mastra.
6. Aucune logique IA dans le moteur.
7. `pnpm check` et `pnpm test:e2e` passent.
8. `docs/current-phase.md` mis à jour vers PHASE 4 une fois ces critères
   validés (CLAUDE.md §51 — pas fait par cette feature elle-même, mais à la
   validation humaine finale).

## 12. Questions ouvertes — toutes tranchées

1. **Le `spawn` system doit-il essayer de couvrir le variant "collect"
   (position aléatoire complète + compte plafonné) et le variant
   "projectile" (déclenché par input, pas par minuteur) via la même
   fonction `shouldSpawn`, ou seulement le sous-ensemble commun (compteur de
   temps) en laissant le point de spawn et les conditions additionnelles
   (`spawnedCount < target`, `input.fire`) dans chaque engine ?** →
   **Tranché : périmètre minimal.** Seul l'accumulateur de temps est
   extrait (signature §4.4) ; le point de spawn et les conditions
   additionnelles restent dans chaque engine. Évite de plier une fonction
   partagée à des cas suffisamment différents pour perdre en clarté
   (CLAUDE.md §56 : « measured complexity »).
2. **`resolveProjectileCollisions` (shooter, cas N:M projectile↔ennemi)
   reste-t-il un cas spécial non couvert par `partitionByCollision`, ou
   doit-il être exprimé comme N appels à `partitionByCollision` (un par
   ennemi contre les projectiles restants) ?** → **Tranché : reste dans
   `ShooterEngine`.** Il n'a qu'une seule occurrence, donc pas de
   duplication à réduire — seuls `hasCollision`, `collectOverlapping` et
   `resolvePlayerCollisions` (joueur↔entité, 1:N, trois occurrences)
   migrent vers `partitionByCollision`.
3. **Ordre de migration des trois engines** : un par tâche atomique
   (CLAUDE.md §46), dans quel ordre ? Recommandation (non bloquante) :
   `dodge` d'abord (le plus simple, un seul flux d'entités), puis
   `collect`, puis `shooter` (le plus complexe, deux flux + deux
   résolutions de collision) — même ordre que la complexité croissante
   déjà observée en §1.

Aucune question ouverte restante. Passage à la phase Plan.
