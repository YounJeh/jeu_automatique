# CLAUDE.md

## 1. Présentation du projet

Ce projet est un prototype de génération automatique de mini-jeux vidéo à partir d’un prompt utilisateur.

Le système utilise :

- TypeScript ;
- Mastra ;
- un modèle de langage appelé par API ;
- HTML5 Canvas pour afficher le jeu ;
- Zod pour valider les données structurées ;
- Vitest pour les tests.

Le projet doit rester léger et fonctionner sur une machine peu puissante.

Ne jamais ajouter de modèle d’IA local, de moteur de jeu lourd, de base vectorielle ou d’infrastructure cloud complexe sans demande explicite.

---

## 2. Objectif du MVP

Le MVP doit permettre à un utilisateur de saisir un prompt comme :

> Crée un jeu où un vaisseau évite des météorites pendant 30 secondes.

Le système doit ensuite :

1. analyser le prompt ;
2. produire une configuration de jeu structurée ;
3. valider cette configuration ;
4. injecter la configuration dans un template de jeu existant ;
5. permettre de lancer le jeu dans un navigateur.

Le MVP ne doit pas générer librement une application complète.

Le modèle d’IA doit principalement produire une configuration JSON validée par Zod.

---

## 3. Jeu du premier MVP

Le premier jeu est un jeu d’évitement en vue du dessus.

### Règles

- Le joueur contrôle un carré ou un vaisseau.
- Le joueur se déplace avec les flèches du clavier ou WASD.
- Des obstacles descendent depuis le haut de l’écran.
- Le joueur perd lorsqu’il touche un obstacle.
- Le score augmente avec le temps.
- Le joueur gagne lorsqu’il atteint la durée définie.
- Le jeu possède un bouton permettant de recommencer.

### Éléments personnalisables

Le modèle peut uniquement modifier :

- le titre ;
- le thème ;
- la couleur du joueur ;
- la couleur du fond ;
- la couleur des obstacles ;
- la vitesse du joueur ;
- la vitesse des obstacles ;
- la fréquence d’apparition des obstacles ;
- la durée de la partie ;
- le texte de victoire ;
- le texte de défaite.

Le modèle ne doit pas générer de JavaScript ou de TypeScript arbitraire pendant le premier MVP.

---

## 4. Architecture fonctionnelle

Le flux principal doit être :

Prompt utilisateur
→ Agent Mastra
→ GameConfig structurée
→ Validation Zod
→ Template de jeu
→ Prévisualisation dans le navigateur

Le système doit commencer avec un seul agent Mastra.

Ne pas créer plusieurs agents tant que le premier workflow n’est pas fiable.

---

## 5. Architecture technique

Utiliser cette structure :

src/
├── mastra/
│   ├── agents/
│   │   └── game-designer-agent.ts
│   ├── workflows/
│   │   └── generate-game-workflow.ts
│   ├── tools/
│   │   └── save-game-config-tool.ts
│   ├── schemas/
│   │   └── game-config-schema.ts
│   └── index.ts
├── game/
│   ├── engine.ts
│   ├── game.ts
│   ├── renderer.ts
│   ├── input.ts
│   └── default-config.ts
├── app/
│   └── index.ts
└── tests/
    ├── game-config-schema.test.ts
    └── game-engine.test.ts

public/
├── index.html
└── generated-game-config.json

Ne pas créer de nouveaux dossiers sans justification claire.

---

## 6. Schéma de données principal

La configuration du jeu doit respecter cette structure conceptuelle :

```ts
type GameConfig = {
  title: string;
  theme: string;
  playerColor: string;
  backgroundColor: string;
  obstacleColor: string;
  playerSpeed: number;
  obstacleSpeed: number;
  obstacleSpawnIntervalMs: number;
  gameDurationSeconds: number;
  victoryMessage: string;
  defeatMessage: string;
};