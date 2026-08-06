# CLAUDE.md

## 1. Présentation du projet

Ce projet est une application Web légère permettant :

- de sélectionner et jouer à plusieurs mini-jeux ;
- de tester plusieurs templates de jeux existants ;
- d’ouvrir un chat intégré à l’application ;
- de demander à un système agentique de créer une nouvelle variante de jeu ;
- de tester immédiatement le jeu généré dans le navigateur.

Le système utilise :

- TypeScript ;
- Mastra ;
- un modèle de langage appelé par API ;
- HTML5 Canvas pour afficher les jeux ;
- Zod pour valider les données structurées ;
- Vitest pour les tests unitaires ;
- Playwright pour les tests end-to-end ;
- un frontend Web léger.

Le projet doit rester léger et fonctionner dans GitHub Codespaces et sur une machine peu puissante.

Ne jamais ajouter sans demande explicite :

- de modèle d’IA local ;
- de moteur de jeu lourd ;
- de base vectorielle ;
- de base de données complexe ;
- de framework multi-agent supplémentaire ;
- d’infrastructure cloud distribuée ;
- de génération libre de code non contrôlée.

Mastra doit rester l’unique framework agentique du projet.

---

## 2. Objectif de la version actuelle

L’application doit proposer deux usages principaux.

### Mode Jouer

L’utilisateur peut :

1. ouvrir une liste déroulante ;
2. sélectionner un jeu disponible ;
3. consulter son titre et sa description ;
4. lancer le jeu ;
5. recommencer une partie ;
6. sélectionner un autre jeu sans recharger l’application.

### Mode Créer

L’utilisateur peut :

1. ouvrir une page ou un panneau de chat ;
2. décrire le jeu qu’il souhaite créer ;
3. envoyer sa demande au système agentique Mastra ;
4. suivre les différentes étapes de génération ;
5. recevoir une confirmation lorsque le jeu est prêt ;
6. lancer immédiatement le jeu généré ;
7. revenir à la liste des jeux existants.

Le système ne doit pas générer librement une application complète.

Le modèle d’IA doit principalement :

- choisir un template existant ;
- produire une configuration structurée ;
- adapter les paramètres autorisés ;
- valider la cohérence du jeu ;
- enregistrer la nouvelle configuration dans le catalogue de jeux.

---

## 3. Périmètre fonctionnel

La version actuelle doit contenir au minimum :

- une page principale ;
- une liste déroulante de sélection de jeu ;
- deux jeux de test préconfigurés ;
- un bouton permettant de lancer le jeu sélectionné ;
- un bouton permettant de recommencer ;
- une option permettant d’ouvrir le chat ;
- une interface de chat simple ;
- un système Mastra capable de transformer une demande en configuration de jeu ;
- un écran ou un état de génération ;
- un bouton permettant de tester le jeu généré ;
- un catalogue de jeux chargé dynamiquement.

La version actuelle ne doit pas contenir :

- de génération d’images ;
- de génération audio ;
- de génération libre de TypeScript ;
- de génération de nouveaux moteurs de jeu ;
- de multijoueur ;
- de système de compte ;
- de paiement ;
- de base vectorielle ;
- de mémoire long terme ;
- de marketplace publique ;
- de déploiement distribué.

---

## 4. Jeux disponibles

L’application doit commencer avec deux jeux de test distincts.

## 4.1 Jeu 1 — Jeu d’évitement

### Identifiant

```text
dodge-game
```

### Description

Le joueur contrôle un carré ou un vaisseau en vue du dessus et doit éviter des obstacles qui descendent depuis le haut de l’écran.

### Règles

- Le joueur se déplace avec les flèches du clavier ou WASD.
- Les obstacles apparaissent en haut de l’écran.
- Les obstacles se déplacent vers le bas.
- Le joueur perd lorsqu’il touche un obstacle.
- Le score augmente avec le temps.
- Le joueur gagne lorsqu’il atteint la durée définie.
- Un bouton permet de recommencer.

### Paramètres personnalisables

- titre ;
- description ;
- thème ;
- couleur du joueur ;
- couleur du fond ;
- couleur des obstacles ;
- vitesse du joueur ;
- vitesse des obstacles ;
- fréquence d’apparition des obstacles ;
- durée de la partie ;
- texte de victoire ;
- texte de défaite.

---

## 4.2 Jeu 2 — Jeu de collecte

### Identifiant

```text
collect-game
```

### Description

Le joueur contrôle un personnage dans une zone fermée et doit collecter un certain nombre d’objets avant la fin du temps imparti.

### Règles

- Le joueur se déplace avec les flèches du clavier ou WASD.
- Des objets sont répartis ou apparaissent dans la zone de jeu.
- Un objet disparaît lorsqu’il est collecté.
- Le score augmente à chaque collecte.
- Le joueur gagne lorsqu’il atteint l’objectif de collecte.
- Le joueur perd si le temps est écoulé avant l’objectif.
- Un bouton permet de recommencer.

### Paramètres personnalisables

- titre ;
- description ;
- thème ;
- couleur du joueur ;
- couleur du fond ;
- couleur des objets à collecter ;
- vitesse du joueur ;
- nombre d’objets à collecter ;
- fréquence d’apparition des objets ;
- durée de la partie ;
- texte de victoire ;
- texte de défaite.

---

## 5. Sélecteur de jeux

L’interface doit contenir une liste déroulante affichant tous les jeux disponibles.

Chaque option doit afficher au minimum :

- le titre du jeu ;
- éventuellement son type ou une courte description.

Le catalogue ne doit pas être codé directement dans le composant d’interface.

Le sélecteur doit être alimenté par une collection de jeux structurée.

Exemple conceptuel :

```ts
type GameCatalogItem = {
  id: string;
  title: string;
  description: string;
  template: GameTemplate;
  config: GameConfig;
  source: "built-in" | "generated";
  createdAt?: string;
};
```

Le changement de jeu sélectionné doit :

1. arrêter proprement le jeu actuel ;
2. réinitialiser son état ;
3. charger la nouvelle configuration ;
4. charger le moteur associé ;
5. afficher le nouveau titre et la nouvelle description ;
6. ne pas nécessiter de rechargement complet de la page.

---

## 6. Templates de jeux

Utiliser une architecture fondée sur des templates contrôlés.

Les templates autorisés sont initialement :

```ts
type GameTemplate = "dodge" | "collect";
```

Le modèle d’IA ne doit pas inventer un nouveau type de jeu pendant cette version.

Il doit obligatoirement sélectionner un template existant.

Chaque template doit disposer :

- de son propre moteur ou contrôleur ;
- de son propre schéma de configuration ;
- de valeurs par défaut ;
- de règles de validation ;
- de tests unitaires ;
- d’une fonction d’initialisation ;
- d’une fonction de mise à jour ;
- d’une fonction de rendu ;
- d’une fonction de destruction ou de nettoyage.

---

## 7. Architecture fonctionnelle

Le flux du mode Jouer doit être :

```text
Chargement de l’application
→ Chargement du catalogue
→ Sélection d’un jeu
→ Chargement du template
→ Validation de la configuration
→ Initialisation du moteur
→ Partie jouable
```

Le flux du mode Créer doit être :

```text
Message utilisateur
→ Chat intégré
→ Agent Mastra
→ Analyse de la demande
→ Sélection d’un template
→ Génération d’une configuration structurée
→ Validation Zod
→ Enregistrement dans le catalogue
→ Prévisualisation
→ Jeu testable
```

Le système doit commencer avec un seul agent Mastra principal.

Ne pas créer plusieurs agents autonomes tant que le workflow actuel n’est pas fiable.

Des étapes spécialisées peuvent exister dans un workflow, mais elles ne doivent pas être présentées comme des agents indépendants sans nécessité.

---

## 8. Interface utilisateur

L’application doit proposer une navigation simple.

Deux modes principaux doivent être accessibles :

```text
Jouer
Créer un jeu
```

L’interface peut utiliser :

- deux boutons ;
- deux onglets ;
- une navigation latérale ;
- deux pages ;
- un panneau de chat ouvrable.

Choisir l’option la plus simple compatible avec l’architecture existante.

### Mode Jouer

Le mode Jouer doit afficher :

- le sélecteur de jeu ;
- le titre ;
- la description ;
- le Canvas ;
- les instructions ;
- le score ;
- le temps restant si nécessaire ;
- le bouton lancer ;
- le bouton recommencer ;
- le bouton ou lien permettant d’ouvrir le chat.

### Mode Créer

Le mode Créer doit afficher :

- l’historique du chat ;
- une zone de saisie ;
- un bouton envoyer ;
- un indicateur de chargement ;
- les étapes de génération ;
- les erreurs éventuelles ;
- un résumé du jeu généré ;
- un bouton « Tester le jeu » ;
- un bouton « Retour aux jeux ».

L’interface doit rester lisible, responsive et légère.

---

## 9. Chat intégré

Le chat doit être directement intégré à l’application.

Il ne doit pas exposer la clé API dans le navigateur.

Les messages doivent être envoyés à une route serveur ou à un endpoint Mastra.

### Structure conceptuelle d’un message

```ts
type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  status?: "sending" | "sent" | "error";
};
```

### Comportement attendu

Lorsque l’utilisateur envoie un message :

1. le message utilisateur est affiché ;
2. la zone de saisie est désactivée pendant l’envoi si nécessaire ;
3. le serveur reçoit la demande ;
4. le workflow Mastra est lancé ;
5. un état de progression est affiché ;
6. le résultat est validé ;
7. un message assistant résume le jeu créé ;
8. le jeu généré est ajouté au catalogue ;
9. le bouton « Tester le jeu » devient disponible.

### Gestion des erreurs

En cas d’erreur :

- afficher un message compréhensible ;
- ne pas ajouter de jeu invalide au catalogue ;
- permettre à l’utilisateur de réessayer ;
- journaliser l’erreur côté serveur ;
- ne jamais afficher la clé API ;
- ne jamais afficher une stack trace complète à l’utilisateur.

---

## 10. Système agentique Mastra

Utiliser Mastra comme couche d’orchestration.

Le système doit contenir un agent principal nommé :

```text
gameDesignerAgent
```

Son rôle est de transformer une demande utilisateur en une configuration de jeu valide.

L’agent doit :

- comprendre le thème demandé ;
- identifier le template le plus adapté ;
- produire une configuration structurée ;
- respecter les limites numériques ;
- ne produire aucun code ;
- ne créer aucun fichier arbitraire ;
- ne modifier aucun moteur ;
- ne choisir qu’un template autorisé ;
- retourner une réponse validable par Zod.

### Instructions de l’agent

L’agent doit privilégier :

- la simplicité ;
- la jouabilité ;
- des règles compréhensibles ;
- des durées courtes ;
- des vitesses raisonnables ;
- des couleurs CSS valides ;
- des textes courts ;
- un niveau de difficulté adapté.

L’agent ne doit jamais :

- générer du TypeScript ;
- générer du JavaScript ;
- générer du HTML ;
- exécuter une commande ;
- choisir un chemin de fichier ;
- modifier le catalogue directement ;
- ajouter une dépendance ;
- créer un nouveau template.

---

## 11. Workflow Mastra

Créer ou faire évoluer un workflow nommé :

```text
generateGameWorkflow
```

Le workflow doit contenir les étapes suivantes :

1. `receive-user-request`
2. `classify-game-template`
3. `generate-game-config`
4. `validate-game-config`
5. `create-catalog-entry`
6. `save-generated-game`
7. `return-game-preview`

Chaque étape doit avoir :

- un identifiant explicite ;
- une entrée typée ;
- une sortie typée ;
- une responsabilité unique ;
- une gestion explicite des erreurs.

Le workflow ne doit pas contenir :

- de boucle infinie ;
- de génération libre de code ;
- de parallélisme inutile ;
- de multi-agent non justifié ;
- d’accès direct à un shell ;
- d’écriture dans un chemin arbitraire.

Prévoir au maximum une tentative de correction structurée si la première sortie du modèle échoue à la validation.

---

## 12. Architecture technique

Utiliser une structure proche de celle-ci :

```text
src/
├── mastra/
│   ├── agents/
│   │   └── game-designer-agent.ts
│   ├── workflows/
│   │   └── generate-game-workflow.ts
│   ├── tools/
│   │   └── save-generated-game-tool.ts
│   ├── schemas/
│   │   ├── generated-game-schema.ts
│   │   ├── dodge-game-config-schema.ts
│   │   └── collect-game-config-schema.ts
│   └── index.ts
├── app/
│   ├── components/
│   │   ├── game-selector.ts
│   │   ├── game-view.ts
│   │   ├── chat-panel.ts
│   │   ├── chat-message.ts
│   │   └── generation-status.ts
│   ├── pages/
│   │   ├── play-page.ts
│   │   └── create-game-page.ts
│   ├── services/
│   │   ├── game-catalog-service.ts
│   │   └── chat-service.ts
│   └── index.ts
├── game/
│   ├── core/
│   │   ├── game-engine.ts
│   │   ├── game-state.ts
│   │   ├── input.ts
│   │   └── renderer.ts
│   ├── templates/
│   │   ├── dodge/
│   │   │   ├── dodge-engine.ts
│   │   │   ├── dodge-config.ts
│   │   │   └── dodge-renderer.ts
│   │   └── collect/
│   │       ├── collect-engine.ts
│   │       ├── collect-config.ts
│   │       └── collect-renderer.ts
│   ├── catalog/
│   │   ├── built-in-games.ts
│   │   ├── generated-games.ts
│   │   └── game-catalog.ts
│   └── types/
│       ├── game-config.ts
│       ├── game-template.ts
│       └── game-catalog-item.ts
└── tests/
    ├── unit/
    │   ├── dodge-game.test.ts
    │   ├── collect-game.test.ts
    │   ├── game-catalog.test.ts
    │   └── generated-game-schema.test.ts
    └── e2e/
        ├── game-selection.spec.ts
        └── game-generation-chat.spec.ts

public/
├── index.html
└── generated-games/
    └── generated-games.json
```

Adapter cette structure à l’état réel du projet.

Ne pas déplacer ou réécrire massivement le projet sans nécessité.

Ne créer de nouveaux dossiers que lorsqu’ils ont une responsabilité claire.

---

## 13. Schémas de données

Utiliser une union discriminée pour représenter les configurations.

### Configuration commune

```ts
type BaseGameConfig = {
  id: string;
  title: string;
  description: string;
  theme: string;
  template: GameTemplate;
  playerColor: string;
  backgroundColor: string;
  playerSpeed: number;
  gameDurationSeconds: number;
  victoryMessage: string;
  defeatMessage: string;
};
```

### Jeu d’évitement

```ts
type DodgeGameConfig = BaseGameConfig & {
  template: "dodge";
  obstacleColor: string;
  obstacleSpeed: number;
  obstacleSpawnIntervalMs: number;
};
```

### Jeu de collecte

```ts
type CollectGameConfig = BaseGameConfig & {
  template: "collect";
  collectibleColor: string;
  targetCollectibleCount: number;
  collectibleSpawnIntervalMs: number;
};
```

### Type global

```ts
type GameConfig = DodgeGameConfig | CollectGameConfig;
```

### Jeu généré

```ts
type GeneratedGameResult = {
  game: GameConfig;
  summary: string;
  generationId: string;
  createdAt: string;
};
```

Utiliser une union discriminée sur la propriété `template`.

Refuser les propriétés inconnues lorsque cela est possible.

---

## 14. Limites de validation

Les valeurs numériques doivent être strictement bornées.

### Limites communes

```text
playerSpeed : 100 à 600
gameDurationSeconds : 10 à 120
title : 3 à 60 caractères
description : 10 à 240 caractères
theme : 2 à 80 caractères
victoryMessage : 2 à 160 caractères
defeatMessage : 2 à 160 caractères
```

### Jeu d’évitement

```text
obstacleSpeed : 50 à 500
obstacleSpawnIntervalMs : 250 à 3000
```

### Jeu de collecte

```text
targetCollectibleCount : 3 à 50
collectibleSpawnIntervalMs : 250 à 5000
```

Les couleurs doivent être des valeurs CSS autorisées.

Préférer :

- les couleurs hexadécimales ;
- les couleurs RGB ;
- une liste contrôlée de couleurs nommées.

Une configuration invalide ne doit jamais être chargée dans le moteur de jeu.

---

## 15. Catalogue de jeux

Le catalogue doit contenir :

- les jeux intégrés ;
- les jeux générés pendant l’utilisation.

Les deux jeux intégrés doivent être définis séparément des jeux générés.

Exemple :

```ts
const builtInGames: GameCatalogItem[] = [
  {
    id: "dodge-game",
    title: "Meteor Dodge",
    description: "Évite les météorites le plus longtemps possible.",
    template: "dodge",
    source: "built-in",
    config: defaultDodgeConfig,
  },
  {
    id: "collect-game",
    title: "Crystal Collector",
    description: "Collecte tous les cristaux avant la fin du temps.",
    template: "collect",
    source: "built-in",
    config: defaultCollectConfig,
  },
];
```

Les jeux générés doivent être ajoutés par une fonction dédiée.

Exemple conceptuel :

```ts
function addGeneratedGame(game: GameCatalogItem): void;
```

Ne pas modifier directement le tableau depuis les composants d’interface.

---

## 16. Persistance des jeux générés

Pour cette version, utiliser une persistance simple.

Solutions autorisées :

- fichier JSON côté serveur ;
- stockage mémoire pendant la session ;
- stockage local du navigateur pour la prévisualisation ;
- combinaison simple de ces solutions.

Ne pas ajouter de base de données sans demande explicite.

Le fichier de stockage doit utiliser un chemin prédéfini.

Le modèle ne doit jamais fournir le chemin d’écriture.

Exemple :

```text
public/generated-games/generated-games.json
```

Toute lecture du fichier doit être validée avec Zod.

Toute écriture doit :

- préserver les jeux existants ;
- éviter les identifiants dupliqués ;
- être atomique autant que possible ;
- gérer les erreurs de fichier.

---

## 17. Tool de sauvegarde

Créer un tool Mastra nommé :

```text
saveGeneratedGameTool
```

Il doit :

- recevoir une configuration validée ;
- créer une entrée de catalogue ;
- générer un identifiant sûr ;
- enregistrer le jeu dans le stockage autorisé ;
- retourner le jeu enregistré.

Il ne doit pas :

- accepter un chemin fourni par le modèle ;
- exécuter une commande shell ;
- supprimer des fichiers ;
- écrire hors du dossier autorisé ;
- écrire du code ;
- modifier les jeux intégrés ;
- écraser silencieusement un jeu existant.

---

## 18. Moteurs de jeu

Chaque moteur doit être déterministe et indépendant du LLM.

Le LLM fournit uniquement une configuration.

Chaque moteur doit gérer :

- l’initialisation ;
- la boucle de jeu ;
- les entrées clavier ;
- le déplacement du joueur ;
- les collisions ;
- le score ;
- le temps ;
- la victoire ;
- la défaite ;
- le redémarrage ;
- le nettoyage des événements ;
- l’arrêt propre de `requestAnimationFrame`.

Lorsqu’un utilisateur change de jeu :

- arrêter la boucle active ;
- retirer les listeners clavier ;
- réinitialiser l’état ;
- vider les références ;
- initialiser le nouveau jeu.

Ne jamais laisser plusieurs boucles de jeu fonctionner simultanément.

---

## 19. États de l’application

Utiliser des états explicites.

### État du jeu

```ts
type GameStatus = "idle" | "loading" | "playing" | "won" | "lost" | "error";
```

### État de génération

```ts
type GenerationStatus =
  | "idle"
  | "sending"
  | "analyzing"
  | "generating"
  | "validating"
  | "saving"
  | "ready"
  | "error";
```

L’interface doit refléter ces états.

Éviter de représenter les états métier uniquement avec plusieurs booléens indépendants.

---

## 20. API et séparation frontend/backend

Les appels au modèle doivent rester côté serveur.

Le frontend ne doit jamais appeler directement le fournisseur de modèle avec une clé privée.

Prévoir une route ou un endpoint conceptuel :

```text
POST /api/games/generate
```

Entrée :

```ts
type GenerateGameRequest = {
  prompt: string;
};
```

Sortie :

```ts
type GenerateGameResponse = {
  success: boolean;
  result?: GeneratedGameResult;
  error?: {
    code: string;
    message: string;
  };
};
```

Valider l’entrée et la sortie.

Limiter la longueur du prompt utilisateur.

Prévoir un timeout raisonnable.

---

## 21. Règles TypeScript

Utiliser TypeScript strict.

Éviter :

- `any` ;
- `as unknown as` ;
- les assertions non justifiées ;
- les fonctions trop longues ;
- les dépendances inutiles ;
- les classes sans nécessité ;
- les états globaux mutables ;
- les abstractions prématurées ;
- les composants responsables à la fois de l’IA, du catalogue et du moteur.

Préférer :

- les unions discriminées ;
- les fonctions pures ;
- les modules spécialisés ;
- les schémas Zod ;
- les noms explicites ;
- les retours typés ;
- l’injection de dépendances simple ;
- les erreurs métier structurées ;
- les tests proches du comportement réel.

Ne pas désactiver TypeScript pour faire compiler le projet.

---

## 22. Sécurité

Considérer comme non fiables :

- les prompts utilisateur ;
- les sorties du modèle ;
- les fichiers JSON ;
- les paramètres d’URL ;
- les données du stockage local.

Toujours :

- valider avec Zod ;
- limiter les longueurs ;
- borner les nombres ;
- échapper les textes affichés ;
- garder les clés côté serveur ;
- utiliser les variables d’environnement ;
- utiliser une liste fermée de templates ;
- utiliser un chemin de stockage fixe.

Ne jamais :

- exécuter du code généré ;
- injecter une sortie du modèle avec `innerHTML` ;
- utiliser `eval` ;
- utiliser `new Function` ;
- exécuter une commande shell issue du modèle ;
- accepter un chemin de fichier issu du modèle ;
- exposer une clé API ;
- créer dynamiquement une dépendance ;
- générer un script arbitraire.

---

## 23. Expérience utilisateur

Pendant la génération, afficher des messages courts tels que :

```text
Analyse de ta demande
Choix du type de jeu
Création des règles
Validation de la configuration
Préparation du jeu
Jeu prêt
```

Ne pas afficher de faux raisonnement détaillé du modèle.

Ne pas afficher les instructions internes de l’agent.

Le bouton « Tester le jeu » ne doit être actif que lorsque :

- la configuration est valide ;
- le jeu est enregistré ;
- le template correspondant existe ;
- le moteur peut être initialisé.

---

## 24. Tests unitaires obligatoires

Créer des tests pour :

### Catalogue

- chargement des deux jeux intégrés ;
- sélection d’un jeu ;
- ajout d’un jeu généré ;
- refus d’un identifiant dupliqué ;
- absence de mutation directe du catalogue.

### Schémas

- configuration `dodge` valide ;
- configuration `collect` valide ;
- template inconnu ;
- durée trop courte ;
- vitesse trop élevée ;
- couleur invalide ;
- propriété inconnue ;
- prompt trop long.

### Jeu d’évitement

- déplacement du joueur ;
- apparition d’un obstacle ;
- collision ;
- victoire ;
- défaite ;
- redémarrage.

### Jeu de collecte

- déplacement du joueur ;
- apparition d’un objet ;
- collecte ;
- incrémentation du score ;
- victoire ;
- expiration du temps ;
- redémarrage.

### Génération

- sélection du template `dodge` ;
- sélection du template `collect` ;
- rejet d’une réponse invalide ;
- création d’une entrée de catalogue ;
- sauvegarde d’un jeu valide ;
- gestion d’une erreur du modèle.

---

## 25. Tests end-to-end obligatoires

Utiliser Playwright pour vérifier :

### Sélection de jeux

1. la page charge ;
2. la liste déroulante contient deux jeux ;
3. le premier jeu peut être lancé ;
4. le second jeu peut être sélectionné ;
5. le titre change ;
6. le moteur précédent est arrêté ;
7. le nouveau jeu démarre ;
8. le bouton recommencer fonctionne.

### Chat de génération

1. le chat peut être ouvert ;
2. un message peut être saisi ;
3. le message utilisateur apparaît ;
4. l’état de génération est visible ;
5. une réponse assistant apparaît ;
6. le jeu généré est ajouté au catalogue ;
7. le bouton « Tester le jeu » est actif ;
8. le jeu généré peut être lancé ;
9. aucune erreur critique n’apparaît dans la console.

Les appels réels au modèle peuvent être mockés dans les tests end-to-end.

Ne pas dépendre d’une vraie API payante dans les tests automatisés.

---

## 26. Commandes attendues

Le projet doit exposer autant que possible :

```bash
pnpm dev
pnpm build
pnpm test
pnpm test:watch
pnpm test:e2e
pnpm typecheck
pnpm lint
pnpm format
pnpm check
```

La commande `pnpm check` doit idéalement exécuter :

```bash
pnpm typecheck && pnpm test && pnpm build
```

Ne pas mélanger npm, yarn et pnpm.

Utiliser pnpm comme gestionnaire principal.

---

## 27. Variables d’environnement

Utiliser `.env.example`.

Exemple :

```env
MASTRA_MODEL=
MODEL_PROVIDER_API_KEY=
MAX_GAME_PROMPT_LENGTH=1000
GENERATED_GAMES_FILE=public/generated-games/generated-games.json
```

Ne jamais committer de clé réelle.

Dans GitHub Codespaces, utiliser les Codespaces Secrets.

Ne jamais afficher la valeur d’une clé dans les logs.

---

## 28. Gestion des erreurs

Créer des erreurs métier explicites.

Exemples :

```ts
type GameGenerationErrorCode =
  | "INVALID_PROMPT"
  | "MODEL_UNAVAILABLE"
  | "INVALID_MODEL_OUTPUT"
  | "UNSUPPORTED_TEMPLATE"
  | "VALIDATION_FAILED"
  | "SAVE_FAILED"
  | "GAME_INITIALIZATION_FAILED";
```

Les messages destinés à l’utilisateur doivent être compréhensibles.

Les détails techniques doivent être journalisés côté serveur.

Ne pas masquer silencieusement les erreurs.

---

## 29. Observabilité minimale

Journaliser au minimum :

- début de génération ;
- fin de génération ;
- modèle utilisé ;
- template sélectionné ;
- durée du workflow ;
- erreur de validation ;
- erreur de sauvegarde ;
- identifiant du jeu généré.

Ne pas journaliser :

- les clés API ;
- les secrets ;
- des données sensibles ;
- les instructions internes complètes ;
- des prompts sans limite de longueur.

Aucune plateforme externe d’observabilité ne doit être ajoutée sans demande explicite.

---

## 30. Méthode de travail attendue de Claude Code

Avant toute modification :

1. lire ce fichier ;
2. lire `package.json` ;
3. examiner l’architecture existante ;
4. lire les fichiers concernés ;
5. identifier le plus petit changement cohérent ;
6. signaler brièvement les fichiers qui seront modifiés.

Pendant l’implémentation :

1. conserver le fonctionnement existant ;
2. ajouter le second jeu sans casser le premier ;
3. séparer le catalogue, le moteur et l’interface ;
4. ajouter les schémas avant les appels IA ;
5. ajouter le chat progressivement ;
6. ne pas élargir le périmètre ;
7. ne pas ajouter de dépendance sans justification.

Après les modifications :

1. exécuter `pnpm typecheck` ;
2. exécuter `pnpm test` ;
3. exécuter `pnpm build` ;
4. exécuter les tests Playwright pertinents ;
5. corriger les erreurs ;
6. résumer les fichiers modifiés ;
7. indiquer les commandes exécutées ;
8. signaler honnêtement les tests non exécutés.

Ne pas réécrire tout le projet si une évolution incrémentale est possible.

---

## 31. Ordre d’implémentation recommandé

Claude Code doit procéder dans cet ordre.

### Étape 1 — Catalogue et sélection

- créer les types communs ;
- créer le catalogue ;
- conserver le premier jeu ;
- ajouter le second jeu ;
- ajouter la liste déroulante ;
- permettre de changer de jeu ;
- gérer le nettoyage du moteur actif ;
- tester les deux jeux.

### Étape 2 — Interface de chat sans IA réelle

- créer la page ou le panneau de chat ;
- créer les composants de messages ;
- créer les états de génération ;
- mocker une réponse de génération ;
- ajouter un faux jeu généré au catalogue ;
- permettre de le tester.

### Étape 3 — Schémas de génération

- créer les schémas Zod ;
- créer l’union discriminée ;
- ajouter les limites ;
- tester toutes les erreurs de validation.

### Étape 4 — Mastra

- créer ou faire évoluer `gameDesignerAgent` ;
- créer le workflow ;
- créer ou faire évoluer la sélection de template ;
- créer ou faire évoluer la génération structurée ;
- créer ou faire évoluer la sauvegarde ;
- retourner un résultat validé.

### Étape 5 — Connexion frontend/backend

- connecter le chat à l’endpoint ;
- afficher la progression ;
- ajouter le jeu généré ;
- permettre de le tester ;
- gérer les erreurs.

### Étape 6 — Tests end-to-end

- tester le sélecteur ;
- tester les deux jeux ;
- tester le chat avec modèle mocké ;
- tester l’ajout au catalogue ;
- tester le lancement du jeu généré.

Ne pas commencer par l’agent avant d’avoir validé le catalogue, le second jeu et le chat mocké.

---

## 32. Hors périmètre actuel

Ne pas développer pour le moment :

- plus de deux templates de jeu ;
- génération de nouveaux moteurs ;
- génération libre de code ;
- génération d’assets ;
- génération de musique ;
- génération de voix ;
- 3D ;
- Godot ;
- Unity ;
- Unreal Engine ;
- sauvegarde cloud ;
- base de données ;
- authentification ;
- paiements ;
- partage public ;
- notation des jeux ;
- marketplace ;
- multijoueur ;
- système de plugins ;
- MCP ;
- RAG ;
- mémoire long terme ;
- plusieurs agents autonomes ;
- Kubernetes ;
- Temporal ;
- Docker distribué.

---

## 33. Critères de réussite

La version est considérée comme fonctionnelle lorsque :

1. l’application démarre ;
2. la liste déroulante affiche au moins deux jeux ;
3. le jeu d’évitement fonctionne ;
4. le jeu de collecte fonctionne ;
5. il est possible de changer de jeu sans recharger la page ;
6. l’ancien moteur est correctement arrêté ;
7. le chat peut être ouvert ;
8. un utilisateur peut envoyer une demande ;
9. Mastra produit une configuration structurée ;
10. la configuration est validée par Zod ;
11. un jeu généré est ajouté au catalogue ;
12. le jeu généré peut être sélectionné ;
13. le jeu généré peut être testé ;
14. les erreurs sont affichées proprement ;
15. aucune clé API n’est exposée ;
16. le typecheck réussit ;
17. les tests unitaires réussissent ;
18. le build réussit ;
19. les tests end-to-end essentiels réussissent.

---

## 34. Priorités

Toujours privilégier dans cet ordre :

1. fonctionnement correct ;
2. simplicité ;
3. sécurité ;
4. testabilité ;
5. expérience utilisateur ;
6. lisibilité ;
7. performance ;
8. extensibilité.

Ne pas complexifier l’architecture pour anticiper des besoins futurs non confirmés.

---

## 35. Règles de fiabilité du MVP

1. Le MVP supporte uniquement les templates `dodge` et `collect`.
2. Le LLM génère uniquement une configuration structurée, jamais du code exécutable.
3. Toute sortie du LLM doit être validée par Zod côté serveur.
4. Toute configuration doit passer un contrôle déterministe de jouabilité.
5. Chaque moteur doit implémenter correctement `start`, `stop` et `destroy`.
6. `destroy` doit supprimer les listeners, les timers et les animation frames.
7. Une nouvelle mécanique ne doit pas être ajoutée sans test unitaire.
8. Une nouvelle catégorie de jeu ne doit pas être ajoutée sans définition de template, schéma Zod, contrôle de jouabilité et tests.
9. Aucun `any`, aucun secret côté client, aucun accès direct au modèle depuis le frontend.
10. Claude doit privilégier les modifications minimales et ne pas refactorer du code sans rapport avec la tâche.

## 36. Git workflow

- Implement the plan one validated task at a time.
- After each atomic task:
  1. run the relevant tests;
  2. verify the acceptance criteria;
  3. stop for human validation when required;
  4. create a conventional commit only after approval.
- Never commit failing or incomplete code.
- Keep commits atomic and independently understandable.
- Do not push unless explicitly requested.
