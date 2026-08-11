# CLAUDE.md

## 1. Mission du projet

Ce projet construit progressivement une application Web de création de mini-jeux assistée par IA.

La vision produit à long terme est :

> permettre à un utilisateur de décrire un jeu en langage naturel, de le générer en quelques secondes, de le tester immédiatement, puis de l'ajuster par conversation.

Cette vision doit être atteinte par étapes.

Le projet ne doit jamais sacrifier :
1. la fiabilité ;
2. la jouabilité ;
3. la sécurité ;
4. la testabilité ;
5. la simplicité ;
6. l'expérience utilisateur ;
7. l'extensibilité.

L'objectif n'est pas de générer immédiatement du code arbitraire.

L'objectif technique est d'évoluer progressivement :

```text
templates configurables
→ templates plus variés
→ systèmes de gameplay réutilisables
→ mécaniques composables
→ GameDefinition déclarative
→ moteur de jeu générique
→ validation et simulation automatiques
→ bibliothèque d'assets
→ nouvelles familles de jeux
```

La génération libre de code n'est pas nécessaire pour atteindre les prochaines versions du produit.

---

# 2. État de départ

Le projet possède déjà un MVP fonctionnel.

Il contient au minimum :

- TypeScript ;
- Mastra ;
- Zod ;
- Vitest ;
- Playwright ;
- HTML5 Canvas ;
- un frontend Web léger ;
- un catalogue de jeux ;
- une interface Jouer ;
- une interface Créer ;
- un chat connecté au backend ;
- un workflow Mastra ;
- deux templates de jeux :
  - `dodge`
  - `collect`
- la génération de variantes de ces deux templates par configuration structurée ;
- la validation des configurations ;
- la possibilité de lancer immédiatement un jeu généré.

Le système actuel suit approximativement :

```text
Prompt utilisateur
→ Mastra
→ sélection dodge | collect
→ génération d'une configuration
→ validation Zod
→ sauvegarde
→ ajout au catalogue
→ jeu jouable
```

Cette architecture constitue le point de départ.

Ne pas reconstruire ce qui fonctionne déjà sans justification.

---

# 3. Vision technique cible

À long terme, le système doit évoluer vers :

```text
Prompt utilisateur
        ↓
Game Designer
        ↓
GameDefinition
        ↓
Schema Validation
        ↓
Semantic Validation
        ↓
Playability Validation
        ↓
Game Runtime
        ↓
Simulation / Verification
        ↓
Preview
        ↓
Playable Game
```

Le LLM doit principalement produire une représentation structurée du jeu.

Le moteur reste responsable de :

- la boucle de jeu ;
- la physique simple ;
- les collisions ;
- les entrées ;
- les règles ;
- les transitions d'état ;
- le score ;
- les objectifs ;
- les timers ;
- le rendu ;
- le cycle de vie.

Le LLM ne doit pas être utilisé pour des opérations pouvant être déterministes.

---

# 4. Principe fondamental : architecture déclarative

La direction technique privilégiée est une architecture data-driven.

Un jeu doit progressivement pouvoir être décrit avec des données structurées telles que :

```text
metadata
player
entities
mechanics
rules
goals
world
difficulty
presentation
```

Puis exécuté par un moteur déterministe.

À terme :

```text
jeu = GameDefinition + runtime générique
```

et non :

```text
jeu = nouveau code généré par le LLM
```

Cette séparation doit rester centrale.

---

# 5. Principe fondamental : progression incrémentale

Ne jamais implémenter une phase future tant que les critères de sortie de la phase actuelle ne sont pas satisfaits.

Chaque phase contient :

- un objectif ;
- un périmètre ;
- des tâches ;
- des tests ;
- des critères de sortie ;
- des éléments explicitement interdits.

Claude Code doit toujours :

1. identifier la phase active ;
2. travailler uniquement dans cette phase ;
3. effectuer le plus petit changement cohérent ;
4. vérifier les critères de sortie ;
5. s'arrêter avant la phase suivante.

Ne jamais effectuer plusieurs phases majeures dans un même changement.

---

# 6. Phases du projet

Ordre obligatoire :

```text
PHASE 0 — MVP actuel
PHASE 1 — Fiabilisation du MVP
PHASE 2 — Troisième template
PHASE 3 — Systèmes de gameplay réutilisables
PHASE 4 — Mécaniques composables
PHASE 5 — GameDefinition v1
PHASE 6 — Runtime générique
PHASE 7 — Templates transformés en presets
PHASE 8 — Vérification, simulation et évaluation
PHASE 9 — Assets contrôlés
PHASE 10 — Nouvelles familles de jeux
PHASE 11 — Génération avancée expérimentale
```

La phase active doit être documentée explicitement dans le repository.

Créer si nécessaire :

```text
docs/current-phase.md
```

Ce fichier doit contenir uniquement :

```text
Current phase: PHASE X
Goal: ...
Exit criteria: ...
```

Ne pas utiliser ce fichier comme journal de développement.

---

# 7. PHASE 0 — MVP actuel

## Objectif

Disposer d'une première application permettant :

- de jouer à `dodge` ;
- de jouer à `collect` ;
- de générer des variantes ;
- de les ajouter au catalogue ;
- de les tester immédiatement.

Cette phase est considérée comme déjà implémentée.

## Architecture

```text
Prompt
→ template selection
→ template-specific config
→ Zod
→ template engine
```

## Critère de sortie

Les deux templates fonctionnent et peuvent être générés depuis le chat.

---

# 8. PHASE 1 — Fiabilisation du MVP

## Objectif

Rendre `dodge` et `collect` robustes avant toute extension du moteur.

La priorité est de vérifier que :

> toute configuration acceptée par le système produit un jeu exécutable et raisonnablement jouable.

## 8.1 Séparer trois niveaux de validation

Créer une séparation explicite entre :

### Schema validation

Responsabilité :

```text
forme des données
types
valeurs requises
bornes simples
formats
propriétés inconnues
```

Outil principal :

```text
Zod
```

### Semantic validation

Responsabilité :

```text
cohérence entre paramètres
```

Exemples :

```text
duration > 0
spawn interval compatible avec la durée
objectif atteignable
dimensions compatibles avec le canvas
```

### Playability validation

Responsabilité :

```text
détecter une configuration techniquement valide mais injouable
```

Créer un module similaire à :

```ts
type PlayabilityIssue = {
  severity: "warning" | "error";
  code: string;
  message: string;
};

type PlayabilityResult = {
  playable: boolean;
  issues: PlayabilityIssue[];
};
```

Préférer des règles déterministes.

Ne pas demander au LLM de décider seul si un jeu est jouable.

## 8.2 Tester les cas extrêmes

Ajouter des tests sur :

- vitesse minimale ;
- vitesse maximale ;
- fréquence de spawn minimale ;
- fréquence de spawn maximale ;
- durée minimale ;
- durée maximale ;
- objectif minimal ;
- objectif maximal ;
- restart répété ;
- changement de jeu pendant une partie ;
- changement de jeu pendant un état `won` ;
- changement de jeu pendant un état `lost` ;
- plusieurs générations successives ;
- erreur API ;
- erreur Mastra ;
- configuration invalide ;
- sauvegarde invalide.

## 8.3 Property-based / generated tests

Ajouter une capacité légère permettant de générer de nombreuses configurations valides.

Il n'est pas obligatoire d'ajouter une dépendance de property-based testing.

Une boucle déterministe de génération de fixtures peut suffire.

Objectif :

```text
100+ configurations valides
→ validation
→ initialisation
→ aucune exception
```

Si possible, tester également :

```text
start
stop
restart
destroy
```

## 8.4 Lifecycle contract

Chaque moteur doit respecter :

```ts
interface GameEngine {
  start(): void;
  stop(): void;
  restart(): void;
  destroy(): void;
}
```

`destroy()` doit garantir :

- aucune animation frame active ;
- aucun timer actif ;
- aucun listener actif ;
- aucune référence DOM devenue inutile ;
- aucun état global conservé.

## Interdit pendant PHASE 1

Ne pas ajouter :

- `shooter` ;
- ECS ;
- GameDefinition générique ;
- assets IA ;
- multi-agent ;
- génération de code ;
- base de données ;
- nouveau framework.

## Critères de sortie PHASE 1

Tous doivent être vrais :

- `dodge` stable ;
- `collect` stable ;
- validation Zod séparée de la validation de jouabilité ;
- lifecycle fiable ;
- tests sur configurations extrêmes ;
- test de nombreuses configurations valides ;
- `pnpm check` passe ;
- Playwright essentiel passe.

---

# 9. PHASE 2 — Ajouter un troisième template

## Objectif

Ajouter un template suffisamment différent pour révéler les abstractions réellement communes.

Template recommandé :

```text
shooter
```

Le but n'est pas d'augmenter le catalogue.

Le but est d'introduire de nouvelles primitives de gameplay.

## 9.1 Gameplay minimum de shooter

Le joueur peut :

- se déplacer ;
- tirer ;
- éviter ou combattre des ennemis.

Le moteur peut gérer :

- projectiles ;
- ennemis ;
- points de vie ;
- dégâts ;
- score ;
- objectif de destruction ;
- timer.

## 9.2 Exemple de paramètres

```ts
type ShooterGameConfig = BaseGameConfig & {
  template: "shooter";
  enemyColor: string;
  projectileColor: string;
  enemySpeed: number;
  enemySpawnIntervalMs: number;
  projectileSpeed: number;
  fireCooldownMs: number;
  playerHealth: number;
  targetKillCount: number;
};
```

Les bornes doivent être strictes.

## 9.3 Workflow IA

Étendre la sélection :

```text
dodge | collect | shooter
```

Le LLM reste limité à :

- sélectionner un template ;
- générer une configuration.

Il ne produit toujours aucun code.

## 9.4 Tests obligatoires

Tester :

- projectile créé ;
- projectile déplacé ;
- projectile supprimé hors écran ;
- projectile / ennemi collision ;
- destruction ennemi ;
- dégâts joueur ;
- perte de vie ;
- victoire ;
- défaite ;
- restart ;
- destroy ;
- changement de jeu.

## Interdit pendant PHASE 2

Ne pas :

- créer un moteur générique ;
- convertir immédiatement les trois jeux en ECS ;
- créer un DSL ;
- fusionner tous les moteurs ;
- supprimer les templates ;
- générer des sprites par IA.

## Critères de sortie PHASE 2

- trois templates fonctionnent ;
- les trois peuvent être générés par le chat ;
- tous ont validation Zod ;
- tous ont playability checks ;
- tous ont lifecycle complet ;
- tests unitaires complets ;
- tests E2E principaux ;
- aucune abstraction majeure prématurée.

---

# 10. PHASE 3 — Extraire les systèmes réutilisables

## Objectif

Observer les duplications réelles entre :

```text
dodge
collect
shooter
```

Puis extraire uniquement les concepts manifestement communs.

Ne pas commencer par dessiner une architecture ECS théorique.

L'abstraction doit être justifiée par du code réellement dupliqué.

## 10.1 Systèmes potentiels

Extraire progressivement selon besoin :

```text
MovementSystem
CollisionSystem
SpawnSystem
TimerSystem
ScoreSystem
HealthSystem
ProjectileSystem
BoundarySystem
```

Il n'est pas obligatoire que tous existent.

Créer uniquement ceux justifiés par plusieurs templates.

## 10.2 Types fondamentaux possibles

```ts
type Position = {
  x: number;
  y: number;
};

type Velocity = {
  x: number;
  y: number;
};

type Size = {
  width: number;
  height: number;
};
```

Puis éventuellement :

```ts
type Entity = {
  id: string;
  position: Position;
};
```

Ne pas créer une hiérarchie de classes complexe.

Préférer :

- composition ;
- données simples ;
- fonctions pures ;
- modules spécialisés.

## 10.3 Input

Centraliser progressivement les entrées si cela réduit réellement les duplications.

Exemple conceptuel :

```ts
type InputState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  fire: boolean;
};
```

## 10.4 Collision

Le système de collision doit être indépendant du thème du jeu.

Exemple :

```ts
function intersects(a: Rect, b: Rect): boolean;
```

## Interdit pendant PHASE 3

Ne pas encore :

- remplacer tous les templates par une GameDefinition ;
- construire un ECS complet sans nécessité ;
- créer un éditeur visuel ;
- ajouter des dizaines de systèmes “pour plus tard”.

## Critères de sortie PHASE 3

- duplications importantes réduites ;
- comportement des trois jeux inchangé ;
- tests existants toujours verts ;
- systèmes partagés testés indépendamment ;
- aucun système spécifique ne dépend de Mastra ;
- aucune logique IA dans le moteur.

---

# 11. PHASE 4 — Mécaniques composables

## Objectif

Passer progressivement de :

```text
template = règles implicites
```

à :

```text
jeu = combinaison de mécaniques
```

Les templates existent encore.

## 11.1 Créer un registre de mécaniques

Créer une liste fermée.

Exemple initial :

```ts
type GameMechanic =
  | "move"
  | "avoid"
  | "collect"
  | "shoot"
  | "health"
  | "score"
  | "timer";
```

Ne pas laisser le modèle inventer une mécanique inconnue.

## 11.2 Mechanic registry

Créer un registre déterministe.

Exemple conceptuel :

```ts
type MechanicDefinition = {
  id: GameMechanic;
  dependencies: GameMechanic[];
  conflicts?: GameMechanic[];
};
```

Exemple :

```text
shoot
requires:
- move
```

ou selon architecture réelle :

```text
health
compatible:
- collision
```

Ne pas sur-concevoir ce modèle.

## 11.3 Décrire les templates existants

Exemple conceptuel :

```text
dodge
= move + avoid + timer

collect
= move + collect + score + timer

shooter
= move + shoot + avoid + health + score
```

Le moteur peut encore utiliser les contrôleurs existants.

## 11.4 Premier jeu hybride

Créer au maximum un jeu hybride interne/test.

Exemple :

```text
move
+ collect
+ avoid
```

Il peut être utilisé comme preuve de concept.

Il n'est pas nécessaire de l'exposer immédiatement à tous les utilisateurs.

## Interdit pendant PHASE 4

Ne pas :

- permettre des mécaniques arbitraires ;
- générer du code ;
- supprimer les moteurs existants ;
- exposer une combinaison non testée au LLM.

## Critères de sortie PHASE 4

- registre fermé de mécaniques ;
- dépendances validées ;
- incompatibilités détectables ;
- templates mappés vers leurs mécaniques ;
- au moins une combinaison hybride prouvée ;
- tests d'intégration de combinaisons.

---

# 12. PHASE 5 — GameDefinition v1

## Objectif

Introduire une représentation déclarative générique du jeu.

Cette représentation est le contrat entre :

```text
IA
et
moteur
```

La première version doit être volontairement limitée.

## 12.1 Principe

Créer :

```ts
type GameDefinition = {
  version: "1";
  metadata: GameMetadata;
  world: WorldDefinition;
  player: PlayerDefinition;
  entities: EntityDefinition[];
  mechanics: MechanicDefinitionRef[];
  rules: RuleDefinition[];
  goals: GoalDefinition[];
  presentation: PresentationDefinition;
};
```

Adapter à l'architecture réelle.

Ne pas ajouter de champ sans cas d'usage concret.

## 12.2 Metadata

Exemple :

```ts
type GameMetadata = {
  id: string;
  title: string;
  description: string;
  theme: string;
};
```

## 12.3 World

Exemple :

```ts
type WorldDefinition = {
  width: number;
  height: number;
  boundaries: "solid" | "clamp";
  durationSeconds?: number;
};
```

## 12.4 Player

Exemple :

```ts
type PlayerDefinition = {
  speed: number;
  health?: number;
  appearance: AppearanceDefinition;
};
```

## 12.5 Entities

Commencer avec une liste fermée.

Exemple :

```ts
type EntityKind =
  | "obstacle"
  | "collectible"
  | "enemy"
  | "projectile";
```

## 12.6 Rules

Créer une DSL de règles minimale.

Éviter toute expression exécutable arbitraire.

Exemple conceptuel :

```ts
type GameRule = {
  when: RuleEvent;
  then: RuleAction[];
};
```

Événements fermés possibles :

```text
player-collides-obstacle
player-collides-collectible
player-collides-enemy
projectile-collides-enemy
timer-expired
score-reached
health-zero
```

Actions fermées possibles :

```text
increase-score
remove-entity
damage-player
win-game
lose-game
spawn-entity
```

La liste doit rester courte.

## 12.7 Goals

Exemple :

```ts
type GoalDefinition =
  | {
      type: "survive";
      durationSeconds: number;
    }
  | {
      type: "score";
      target: number;
    }
  | {
      type: "destroy";
      target: number;
    };
```

## 12.8 Versioning

Toute GameDefinition doit contenir :

```text
version
```

Ne jamais modifier silencieusement la signification d'une version existante.

Si une évolution incompatible devient nécessaire :

```text
version: "2"
```

avec migration explicite si nécessaire.

## 12.9 Validation

Créer :

```text
GameDefinitionSchema
GameDefinitionSemanticValidator
GameDefinitionPlayabilityValidator
```

Trois responsabilités distinctes.

## Interdit pendant PHASE 5

Ne pas :

- convertir immédiatement toute l'application ;
- supprimer les configs historiques ;
- accepter JavaScript dans les règles ;
- accepter fonctions ou expressions arbitraires ;
- accepter `eval` ;
- accepter `new Function`.

## Critères de sortie PHASE 5

- GameDefinition v1 documentée ;
- schéma Zod strict ;
- règles fermées ;
- événements fermés ;
- actions fermées ;
- validation sémantique ;
- validation jouabilité ;
- conversion possible d'au moins un jeu existant vers GameDefinition ;
- tests de sérialisation/désérialisation.

---

# 13. PHASE 6 — Runtime générique

## Objectif

Créer un moteur capable d'exécuter progressivement une `GameDefinition`.

Ne pas remplacer tous les moteurs en une fois.

## 13.1 Runtime

Créer une interface claire.

Exemple :

```ts
interface GameRuntime {
  load(definition: GameDefinition): void;
  start(): void;
  stop(): void;
  restart(): void;
  destroy(): void;
}
```

## 13.2 Runtime state

Séparer :

```text
GameDefinition
```

qui est statique de :

```text
RuntimeState
```

qui évolue pendant la partie.

Exemple :

```ts
type RuntimeState = {
  status: GameStatus;
  score: number;
  elapsedMs: number;
  entities: RuntimeEntity[];
};
```

Ne jamais modifier directement la `GameDefinition` pendant une partie.

## 13.3 Entity state

Les entités runtime doivent avoir des identifiants stables.

Exemple :

```ts
type RuntimeEntity = {
  id: string;
  kind: EntityKind;
  position: Position;
  velocity?: Velocity;
};
```

## 13.4 Déterminisme

Lorsque possible, permettre un RNG injectable :

```ts
type RandomSource = () => number;
```

Cela permet :

- tests reproductibles ;
- simulation ;
- debugging ;
- vérification automatique.

Éviter l'utilisation dispersée de `Math.random()`.

## 13.5 Migration incrémentale

Migrer dans cet ordre recommandé :

```text
collect
→ dodge
→ shooter
```

ou l'ordre le plus simple d'après l'architecture réelle.

Après chaque migration :

- comparer comportement ;
- lancer tests ;
- conserver fallback ancien moteur jusqu'à validation.

## Interdit pendant PHASE 6

Ne pas migrer tous les moteurs dans un seul commit.

Ne pas supprimer l'ancien moteur avant validation du nouveau.

Ne pas introduire un framework ECS externe sans preuve qu'il est nécessaire.

## Critères de sortie PHASE 6

- runtime générique fonctionnel ;
- cycle de vie fiable ;
- RNG injectable ;
- états séparés ;
- tous les templates migrés ou compatibilité claire ;
- anciens tests adaptés ;
- E2E verts ;
- aucune dépendance au LLM dans le runtime.

---

# 14. PHASE 7 — Templates deviennent des presets

## Objectif

Faire évoluer la notion de template.

Avant :

```text
template = moteur spécifique
```

Après :

```text
template = GameDefinition préconfigurée
```

Les templates deviennent des presets de haut niveau.

## 14.1 Presets

Exemple :

```text
dodge preset
collect preset
shooter preset
```

Chaque preset doit produire une GameDefinition valide.

## 14.2 Génération IA

Le workflow évolue progressivement :

Avant :

```text
Prompt
→ classify template
→ template config
```

Après :

```text
Prompt
→ infer mechanics
→ choose compatible preset if useful
→ create GameDefinition
```

Ne pas supprimer la classification immédiatement.

Conserver un fallback vers les presets éprouvés.

## 14.3 Compatibilité

Si le LLM produit une GameDefinition invalide :

```text
validation
→ repair once
→ fallback preset
ou
→ user-facing error
```

Maximum recommandé :

```text
1 tentative de réparation structurée
```

Éviter les boucles agentiques non bornées.

## Critères de sortie PHASE 7

- `dodge`, `collect`, `shooter` sont représentables par GameDefinition ;
- templates ne nécessitent plus de moteurs différents ;
- moteur générique est la voie principale ;
- fallback fiable ;
- workflow Mastra retourne des structured outputs ;
- validation stricte avant runtime.

---

# 15. PHASE 8 — Vérification, simulation et évaluation

## Objectif

Ne plus considérer :

```text
configuration valide
```

comme synonyme de :

```text
bon jeu
```

La qualité doit devenir mesurable.

## 15.1 Static verification

Vérifier sans exécuter le jeu :

- objectif atteignable en théorie ;
- références vers entités existantes ;
- événements connus ;
- actions connues ;
- pas de dépendance circulaire interdite ;
- mécaniques compatibles ;
- aucun état terminal impossible.

## 15.2 Headless simulation

Créer lorsque possible un mode de simulation sans rendu.

Exemple :

```text
GameDefinition
→ runtime headless
→ N simulations
→ metrics
```

Métriques possibles :

```ts
type SimulationMetrics = {
  completedRuns: number;
  winRate: number;
  averageDurationMs: number;
  averageScore: number;
  runtimeErrors: number;
};
```

Ne pas introduire de métrique sans utilité produit.

## 15.3 Deterministic scenarios

Créer des scénarios vérifiant directement les règles importantes.

Exemples :

```text
placer joueur + collectible en collision
→ score augmente

placer projectile + enemy en collision
→ enemy supprimé

health = 1 + collision enemy
→ lost
```

Ces tests ciblés doivent être privilégiés par rapport à un agent qui joue aléatoirement pendant plusieurs minutes.

## 15.4 Evaluation dataset

Créer un dataset versionné de prompts.

Exemple :

```text
tests/evals/game-generation-cases.json
```

Cas minimum :

- dodge simple ;
- collect simple ;
- shooter simple ;
- hybride collect + avoid ;
- demandes ambiguës ;
- demandes impossibles ;
- paramètres extrêmes ;
- prompts adversariaux ;
- mécaniques non supportées.

Pour chaque cas, stocker les propriétés attendues.

Ne pas exiger une sortie textuelle exacte.

Évaluer des propriétés structurelles.

Exemples :

```text
has mechanic collect
has goal score
valid schema
playable
runtime initializes
```

## 15.5 Mastra evaluations

Si les primitives d'évaluation Mastra déjà installées dans la version du projet permettent de le faire simplement, elles peuvent être utilisées.

Ne pas ajouter un système externe d'évaluation sans nécessité.

## 15.6 Observabilité

Mesurer au minimum :

- succès génération ;
- échec génération ;
- échec schema ;
- échec semantic validation ;
- échec playability ;
- fallback utilisé ;
- durée génération ;
- coût/tokens si disponible ;
- runtime initialization success.

## Critères de sortie PHASE 8

- suite d'évaluation versionnée ;
- simulations reproductibles ;
- scénarios ciblés ;
- métriques de génération ;
- régressions détectables ;
- taux de réussite mesurable.

---

# 16. PHASE 9 — Assets contrôlés

## Objectif

Améliorer fortement l'apparence des jeux sans rendre le pipeline fragile.

Procéder progressivement.

Ordre obligatoire :

```text
formes Canvas
→ assets prédéfinis
→ asset catalog
→ sélection IA
→ génération d'assets éventuelle
```

## 16.1 AppearanceDefinition

Créer une représentation stable.

Exemple :

```ts
type AppearanceDefinition =
  | {
      type: "shape";
      shape: "rectangle" | "circle" | "triangle";
      color: string;
    }
  | {
      type: "sprite";
      assetId: string;
    };
```

## 16.2 Asset catalog

Les assets doivent être référencés par identifiant.

Exemple :

```text
spaceship-blue
meteor-small
crystal-purple
enemy-alien-green
```

Le LLM ne fournit pas un chemin filesystem arbitraire.

## 16.3 Asset registry

Créer un registre similaire :

```ts
type AssetCatalogItem = {
  id: string;
  type: "sprite";
  src: string;
  width: number;
  height: number;
};
```

Le chemin réel reste contrôlé par l'application.

## 16.4 Génération d'images

Ne considérer la génération d'images que si :

- le runtime générique est stable ;
- l'asset catalog est stable ;
- fallback shape existe ;
- chargement asset est testé ;
- une erreur asset ne casse jamais le jeu.

Le jeu doit fonctionner même si l'asset généré échoue.

## Interdit pendant PHASE 9

Ne jamais autoriser un LLM à :

- écrire une URL arbitraire dans le runtime ;
- écrire un chemin arbitraire ;
- injecter SVG/HTML non nettoyé ;
- exécuter du code contenu dans un asset.

---

# 17. PHASE 10 — Nouvelles familles de jeux

## Objectif

Étendre les capacités du moteur uniquement après stabilisation de la GameDefinition.

Ajouter les familles une par une.

Ordre indicatif :

```text
top-down survival
→ simple arena shooter
→ simple puzzle
→ breakout-like
→ simple platformer
→ tower defense simplifié
```

Cet ordre n'est pas obligatoire.

La prochaine famille doit être choisie en fonction :

- des demandes utilisateurs ;
- de la valeur produit ;
- du nombre de nouvelles primitives nécessaires ;
- de la compatibilité avec le moteur existant.

## Règle

Une nouvelle famille ne doit pas être ajoutée comme une énorme exception.

Elle doit d'abord identifier :

```text
quelles nouvelles primitives manquent ?
```

Puis ajouter seulement ces primitives.

## Exemple platformer

Avant de supporter un platformer, identifier éventuellement :

```text
gravity
jump
grounded
platform collider
one-way platform
```

Ajouter chaque primitive avec tests.

Ne pas coder directement :

```text
PlatformerEngine
```

si le runtime générique peut être étendu proprement.

## Critères de sortie par nouvelle famille

- primitives documentées ;
- schémas ;
- runtime ;
- validation ;
- playability ;
- tests ;
- eval prompt ;
- exemple jouable.

---

# 18. PHASE 11 — Génération avancée expérimentale

## Objectif

Explorer les mécaniques qui ne peuvent pas être exprimées par la GameDefinition existante.

Cette phase est expérimentale.

Elle ne doit pas être commencée tant que les phases précédentes ne sont pas stables.

## Principe

Avant toute génération de code, demander :

```text
peut-on exprimer cette mécanique en ajoutant une primitive générique ?
```

Si oui :

```text
ajouter la primitive au moteur
```

plutôt que :

```text
générer du code spécifique au jeu
```

## Génération de code

La génération de code exécutable reste hors du chemin principal.

Si elle est expérimentée un jour, elle doit obligatoirement être :

- isolée ;
- sandboxée ;
- non privilégiée ;
- avec timeout ;
- avec limites CPU/mémoire ;
- sans secrets ;
- sans accès filesystem arbitraire ;
- sans accès réseau arbitraire ;
- testée avant exécution utilisateur ;
- derrière feature flag ;
- jamais injectée avec `eval` ou `new Function`.

Cette phase ne doit jamais affaiblir la sécurité de la version stable.

---

# 19. Architecture cible progressive

L'architecture peut évoluer vers quelque chose de proche de :

```text
src/
├── app/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── state/
│
├── game/
│   ├── core/
│   │   ├── runtime/
│   │   ├── lifecycle/
│   │   ├── input/
│   │   └── random/
│   │
│   ├── entities/
│   ├── systems/
│   │   ├── movement/
│   │   ├── collision/
│   │   ├── spawn/
│   │   ├── score/
│   │   ├── health/
│   │   └── projectile/
│   │
│   ├── mechanics/
│   │   ├── registry.ts
│   │   └── compatibility.ts
│   │
│   ├── definition/
│   │   ├── game-definition.ts
│   │   ├── game-definition-schema.ts
│   │   ├── semantic-validator.ts
│   │   └── playability-validator.ts
│   │
│   ├── presets/
│   │   ├── dodge.ts
│   │   ├── collect.ts
│   │   └── shooter.ts
│   │
│   ├── simulation/
│   └── assets/
│
├── mastra/
│   ├── agents/
│   ├── workflows/
│   ├── tools/
│   ├── schemas/
│   └── evals/
│
└── tests/
    ├── unit/
    ├── integration/
    ├── evals/
    └── e2e/
```

Cette arborescence est une direction.

Ne pas créer les dossiers tant que leur responsabilité n'existe pas réellement.

---

# 20. Frontend

Le frontend doit rester simple.

Fonctions principales :

```text
Jouer
Créer
Tester
Modifier
```

À terme, le workflow utilisateur recommandé est :

```text
"Crée-moi un jeu où..."
→ génération
→ preview
→ jouer
→ "rends-le plus difficile"
→ nouvelle version
→ jouer
```

Ne pas créer immédiatement :

- éditeur de niveaux complexe ;
- timeline ;
- IDE ;
- marketplace ;
- système social.

---

# 21. Conversation et itération

À terme, une conversation doit pouvoir modifier un jeu existant.

Exemple :

```text
User:
Crée un jeu où je collecte des cristaux en évitant des météorites.

Assistant:
GameDefinition v1

User:
Ajoute des ennemis.

Assistant:
GameDefinition v2 de la partie utilisateur
```

Attention :

`GameDefinition.version` désigne la version du schéma.

La version du jeu créé par l'utilisateur doit utiliser un autre champ si nécessaire :

```text
revision
```

Ne pas mélanger les deux concepts.

## Modification

Préférer :

```text
existing GameDefinition
+
user requested changes
→ new complete validated GameDefinition
```

plutôt qu'une mutation partielle non validée.

---

# 22. Mastra

Mastra reste l'unique framework d'orchestration agentique.

Ne pas ajouter :

- LangGraph ;
- CrewAI ;
- AutoGen ;
- autre orchestrateur ;

sans décision explicite.

## 22.1 Principe workflow-first

Utiliser des workflows déterministes pour les étapes prévisibles.

Exemple cible :

```text
receive-request
→ interpret-request
→ generate-definition
→ schema-validation
→ semantic-validation
→ playability-validation
→ optional-repair
→ save
→ preview
```

Chaque étape doit avoir :

- responsabilité unique ;
- entrée typée ;
- sortie typée ;
- erreur explicite.

## 22.2 Agent

Conserver un agent principal tant qu'un second agent n'apporte pas un gain démontré.

Exemple :

```text
gameDesignerAgent
```

Le fait qu'un workflow contienne plusieurs étapes ne signifie pas qu'il doit contenir plusieurs agents.

## 22.3 Multi-agent

N'ajouter un nouvel agent que si :

- responsabilité réellement indépendante ;
- prompt spécialisé nécessaire ;
- évaluation montre une amélioration mesurable ;
- coût/latence acceptables ;
- workflow plus simple ou plus fiable.

Ne jamais ajouter des agents simplement pour donner une apparence “agentique”.

## 22.4 Structured outputs

Toutes les sorties critiques de modèle doivent être structurées et validées.

Ne jamais parser une réponse Markdown fragile pour obtenir une GameDefinition.

## 22.5 Repair

Maximum recommandé :

```text
1 réparation structurée
```

Puis :

```text
fallback ou erreur contrôlée
```

Pas de boucle automatique illimitée.

---

# 23. Sécurité

Considérer comme non fiable :

- prompt utilisateur ;
- sortie LLM ;
- JSON ;
- localStorage ;
- fichiers ;
- paramètres URL ;
- asset metadata ;
- données de sauvegarde.

Toujours :

- valider ;
- borner ;
- sanitiser ;
- limiter ;
- typer.

Ne jamais :

- `eval` ;
- `new Function` ;
- `innerHTML` avec sortie LLM ;
- shell issu du LLM ;
- path issu du LLM ;
- import dynamique arbitraire ;
- dépendance choisie par le LLM ;
- code généré exécuté dans le runtime principal ;
- clé API côté client.

---

# 24. Gestion des données

Pour les prochaines phases, conserver une persistance simple tant qu'elle suffit.

Acceptable :

- mémoire ;
- JSON serveur ;
- localStorage contrôlé.

N'ajouter une base de données que lorsqu'un besoin produit réel existe, par exemple :

- comptes utilisateurs ;
- historique durable multi-device ;
- partage ;
- collaboration ;
- analytics utilisateur structurées.

Ne jamais ajouter une base simplement “pour scaler plus tard”.

---

# 25. Performance

Le projet doit rester utilisable :

- dans GitHub Codespaces ;
- sur machine peu puissante ;
- dans un navigateur standard.

Ne pas ajouter :

- moteur 3D lourd ;
- dépendances volumineuses sans justification ;
- calcul GPU requis ;
- modèle local obligatoire.

Objectifs généraux :

- une seule boucle de rendu active ;
- aucun listener orphelin ;
- pas de mémoire croissante à chaque restart ;
- génération IA hors boucle de jeu ;
- runtime indépendant du réseau.

---

# 26. Déterminisme et reproductibilité

Lorsque possible :

```text
GameDefinition
+ seed
→ même comportement initial
```

Prévoir progressivement :

```ts
type GameSessionOptions = {
  seed?: number;
};
```

La reproductibilité est particulièrement importante pour :

- tests ;
- simulations ;
- reproduction de bugs ;
- évaluation de difficulté.

Ne pas forcer le déterminisme si cela complexifie fortement une phase trop tôt.

---

# 27. Règles TypeScript

Toujours utiliser TypeScript strict.

Interdit sans justification :

- `any` ;
- `as unknown as` ;
- `@ts-ignore` ;
- `@ts-nocheck` ;
- assertions forcées pour contourner une erreur.

Préférer :

- unions discriminées ;
- exhaustive checks ;
- fonctions pures ;
- `readonly` lorsque pertinent ;
- dépendances explicites ;
- types métiers ;
- erreurs structurées.

Exemple :

```ts
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
```

---

# 28. Erreurs métier

Créer des codes explicites.

Exemple évolutif :

```ts
type GameErrorCode =
  | "INVALID_PROMPT"
  | "MODEL_UNAVAILABLE"
  | "INVALID_MODEL_OUTPUT"
  | "SCHEMA_VALIDATION_FAILED"
  | "SEMANTIC_VALIDATION_FAILED"
  | "PLAYABILITY_VALIDATION_FAILED"
  | "UNSUPPORTED_MECHANIC"
  | "INCOMPATIBLE_MECHANICS"
  | "SAVE_FAILED"
  | "ASSET_LOAD_FAILED"
  | "RUNTIME_INITIALIZATION_FAILED"
  | "SIMULATION_FAILED";
```

Ne pas exposer la stack complète à l'utilisateur.

---

# 29. Tests

La pyramide de tests doit évoluer avec le projet.

## 29.1 Unit tests

Pour :

- schemas ;
- validation ;
- mécanique ;
- système ;
- collision ;
- movement ;
- rules ;
- goals ;
- registry ;
- migration.

## 29.2 Integration tests

Pour :

```text
GameDefinition
→ runtime
→ expected state transition
```

## 29.3 Evaluation tests

Pour :

```text
Prompt
→ generated definition
→ expected structural properties
```

Les appels modèles peuvent être :

- mockés pour CI ;
- exécutés dans une suite séparée manuelle ou contrôlée.

## 29.4 E2E

Playwright doit vérifier les parcours critiques.

Éviter de tester toute la physique avec Playwright.

Playwright sert principalement à :

- UI ;
- intégration ;
- navigation ;
- workflow complet ;
- absence d'erreur critique.

---

# 30. Quality gate

La commande :

```bash
pnpm check
```

doit idéalement inclure :

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Selon coût, les E2E peuvent rester séparés :

```bash
pnpm test:e2e
```

Avant validation d'une phase :

```bash
pnpm check
pnpm test:e2e
```

doivent passer.

---

# 31. Evaluation IA

Ne jamais évaluer la génération uniquement par inspection manuelle.

Construire progressivement des critères automatiques.

Exemples :

```text
schema_valid
semantic_valid
playability_valid
runtime_loads
required_mechanics_present
forbidden_mechanics_absent
goal_exists
terminal_state_reachable
```

Les réponses textuelles du LLM peuvent varier.

Les tests doivent donc vérifier des propriétés et non une chaîne exacte.

---

# 32. Observabilité minimale

Tracer progressivement :

```text
generationId
gameId
schemaVersion
model
latency
selectedMechanics
validationResult
repairAttempted
fallbackUsed
runtimeLoadResult
simulationResult
```

Ne pas tracer :

- secrets ;
- clé API ;
- chaîne de raisonnement ;
- données sensibles.

Limiter la taille des prompts stockés.

---

# 33. UX de génération

Afficher des états utiles mais simples.

Exemple :

```text
Compréhension du jeu
Création des mécaniques
Validation
Vérification de la jouabilité
Préparation
Jeu prêt
```

Ne jamais afficher de faux raisonnement détaillé.

---

# 34. Modification d'un jeu existant

Lorsque la fonctionnalité sera ajoutée :

```text
current GameDefinition
+
new user instruction
→ candidate GameDefinition
→ validations
→ new revision
```

Ne jamais modifier la définition active avant validation complète.

Conserver la dernière version valide si la nouvelle échoue.

---

# 35. Feature flags

Utiliser des feature flags simples pour les fonctions expérimentales lorsque pertinent.

Exemples :

```text
GENERIC_RUNTIME_ENABLED
HEADLESS_SIMULATION_ENABLED
GENERATED_ASSETS_ENABLED
```

Ne pas créer une plateforme complexe de feature management.

Une configuration environnementale simple suffit.

---

# 36. Compatibilité et migrations

Une GameDefinition sauvegardée ne doit pas casser silencieusement après une évolution du schéma.

Si le schéma change :

```text
read
→ detect version
→ migrate
→ validate
```

Créer des migrations explicites seulement lorsqu'elles deviennent nécessaires.

Ne pas construire un framework de migration avant la première incompatibilité réelle.

---

# 37. Documentation des mécaniques

À partir de PHASE 4, chaque mécanique doit avoir une documentation courte.

Exemple :

```text
docs/mechanics/shoot.md
```

Contenu :

```text
Purpose
Dependencies
Runtime behavior
Events emitted
Actions supported
Validation rules
Tests
```

Cette documentation sert :

- aux développeurs ;
- à Claude Code ;
- aux prompts système ;
- aux évaluations.

---

# 38. Règle d'ajout d'une mécanique

Aucune nouvelle mécanique sans :

1. cas d'usage ;
2. types ;
3. schéma ;
4. runtime ;
5. validation ;
6. tests ;
7. documentation ;
8. au moins un jeu ou test qui l'utilise.

Ne jamais ajouter une mécanique seulement parce qu'elle “pourrait être utile plus tard”.

---

# 39. Règle d'ajout d'un nouveau type d'entité

Même principe :

```text
use case
→ schema
→ runtime
→ interaction
→ tests
```

Pas de type d'entité vide ou futuriste.

---

# 40. Règle d'ajout d'une dépendance

Avant toute dépendance :

1. expliquer le problème ;
2. vérifier s'il existe déjà une solution dans le repo ;
3. évaluer le coût ;
4. vérifier la maintenance ;
5. justifier son ajout.

Ne pas ajouter une dépendance pour quelques lignes de code simples.

---

# 41. ECS

Un Entity Component System complet n'est pas un objectif en soi.

Ne l'introduire que si le moteur générique montre des problèmes concrets tels que :

- multiplication des types d'entités ;
- composition difficile ;
- duplication forte ;
- performance de gestion d'entités ;
- systèmes devenus réellement génériques.

Sinon conserver une architecture de composition simple.

Ne jamais migrer vers un ECS pour suivre une tendance.

---

# 42. Ce qui reste hors périmètre jusqu'à besoin réel

Ne pas développer prématurément :

- multijoueur ;
- réseau temps réel ;
- comptes utilisateurs ;
- paiements ;
- marketplace ;
- modération publique ;
- 3D ;
- Unreal ;
- Unity ;
- Godot ;
- Kubernetes ;
- architecture microservices ;
- base vectorielle ;
- RAG ;
- mémoire agent long terme ;
- blockchain ;
- système de plugins arbitraires ;
- génération libre de code ;
- orchestration multi-agent complexe.

---

# 43. Méthode de travail de Claude Code

Avant toute modification :

1. lire `CLAUDE.md` ;
2. lire `docs/current-phase.md` si présent ;
3. lire `package.json` ;
4. inspecter `git status` ;
5. examiner l'architecture ;
6. identifier les fichiers concernés ;
7. vérifier la phase actuelle ;
8. vérifier que la demande appartient à cette phase ;
9. proposer le plus petit changement cohérent.

Si la demande appartient à une phase future :

- le signaler ;
- ne pas l'implémenter automatiquement ;
- identifier le prérequis manquant.

---

# 44. Workflow obligatoire pour chaque feature

Pour chaque feature :

```text
SPEC
→ PLAN
→ BUILD
→ TEST
→ REVIEW
→ HUMAN VALIDATION
→ COMMIT
```

Lorsque les skills correspondants sont disponibles, utiliser le workflow du repository.

Ne jamais regrouper plusieurs features majeures dans un même plan.

---

# 45. Spécification

Avant une feature non triviale :

définir :

```text
Problem
Goal
Non-goals
Acceptance criteria
Affected modules
Tests
```

La spécification doit rester courte.

Ne pas transformer chaque changement en document de 20 pages.

---

# 46. Plan

Le plan doit être atomique.

Exemple correct :

```text
Task 1
Add playability result types

Task 2
Implement dodge playability validator

Task 3
Add tests

Task 4
Connect validator to generation workflow
```

Exemple incorrect :

```text
Refactor entire engine
Add ECS
Add shooter
Add generic DSL
Add assets
```

---

# 47. Build

Pendant l'implémentation :

- conserver les comportements existants ;
- modifier peu de fichiers à la fois ;
- ajouter les tests proches du changement ;
- ne pas refactorer des modules sans rapport ;
- ne pas “nettoyer tout le projet” au passage.

---

# 48. Test

Après chaque tâche atomique :

exécuter les tests pertinents.

Avant de considérer une feature terminée :

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Puis E2E si parcours utilisateur concerné.

---

# 49. Review

Avant validation :

vérifier :

- complexité inutile ;
- duplication ;
- sécurité ;
- lifecycle ;
- types ;
- erreurs ;
- tests ;
- dépendances ;
- respect de la phase ;
- changement de comportement inattendu.

---

# 50. Git workflow

Après chaque tâche atomique validée :

1. tests ;
2. acceptance criteria ;
3. validation humaine si demandée ;
4. commit conventionnel.

Ne jamais :

- commit du code cassé ;
- push sans demande explicite ;
- mélanger plusieurs features dans un commit ;
- réécrire l'historique sans demande.

Exemples :

```text
feat(game): add playability validation
test(game): cover extreme dodge configs
refactor(game): extract collision system
feat(game): add shooter template
```

---

# 51. Critère pour passer à la phase suivante

Une phase est terminée uniquement si :

1. tous ses critères de sortie sont satisfaits ;
2. `pnpm check` passe ;
3. les E2E pertinents passent ;
4. aucun bug bloquant connu ;
5. architecture documentée si nécessaire ;
6. validation humaine obtenue.
7. modifier docs/current-phase.md

---

# 52. Priorité actuelle recommandée

À partir de l'état actuel du repository, l'ordre immédiat recommandé est :

```text
1. PHASE 1 — Fiabilisation
2. PHASE 2 — Shooter
3. PHASE 3 — Extraction des systèmes communs
4. PHASE 4 — Mécaniques composables
5. PHASE 5 — GameDefinition v1
```

Ne pas commencer `GameDefinition` avant d'avoir appris des besoins réels provenant d'au moins trois templates.

---

# 53. Definition of Done globale

Une modification n'est terminée que si :

- comportement attendu implémenté ;
- types corrects ;
- validation présente ;
- tests présents ;
- tests passent ;
- pas de secret ;
- pas de lifecycle leak ;
- pas de nouvelle dépendance injustifiée ;
- documentation mise à jour si contrat modifié ;
- périmètre de phase respecté.

---

# 54. Objectif produit intermédiaire

Avant de viser littéralement “n'importe quel jeu”, le premier grand objectif produit est :

> permettre de créer rapidement une grande variété de mini-jeux 2D à partir d'un catalogue de mécaniques composables et validées.

Exemples attendus à terme :

```text
éviter des météorites
collecter des cristaux
tirer sur des aliens
collecter tout en évitant des ennemis
survivre pendant 60 secondes
détruire 20 ennemis
atteindre un score
mélanger plusieurs de ces mécaniques
```

Cette étape constitue déjà un produit génératif puissant.

---

# 55. North Star technique

Le principal actif technique du projet doit progressivement devenir :

```text
GameDefinition
+
Mechanic Registry
+
Generic Runtime
+
Playability Verification
+
Evaluation Dataset
```

Le modèle de langage est interchangeable.

La logique métier du moteur ne doit pas dépendre profondément d'un fournisseur de modèle.

---

# 56. Principes finaux

Toujours privilégier :

```text
constraints over free-form
structured outputs over text parsing
deterministic validation over LLM judgment
composition over code generation
simulation over intuition
evaluation over demos
small migrations over rewrites
measured complexity over fashionable architecture
```

L'objectif n'est pas de construire l'architecture la plus impressionnante.

L'objectif est de construire progressivement un système capable de générer de plus en plus de jeux tout en restant :

- fiable ;
- testable ;
- contrôlable ;
- compréhensible ;
- évolutif.

Si une décision augmente fortement la complexité sans augmenter la capacité réelle de génération de jeux, ne pas la prendre.
