Current phase: PHASE 3
Goal: Extraire les systèmes réellement dupliqués entre dodge, collect et shooter (par exemple movement, collision, spawn, timer, score, health, projectile, boundary) en modules partagés, sans réécrire les moteurs existants ni construire un ECS complet.
Exit criteria: duplications importantes réduites entre les trois moteurs ; comportement des trois jeux inchangé ; tests existants toujours verts ; systèmes partagés testés indépendamment ; aucun système spécifique ne dépend de Mastra ; aucune logique IA dans le moteur ; pnpm check et pnpm test:e2e passent.
