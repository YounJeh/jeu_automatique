/**
 * `mastra dev` change process.cwd() en interne (vers src/mastra/public),
 * donc process.cwd() seul n'est pas fiable pour localiser la racine du
 * projet côté serveur. `PWD` (positionné par le shell qui a lancé la
 * commande) reste correct dans ce cas ; on ne retombe sur process.cwd()
 * que si PWD est absent (ex. exécution hors shell).
 */
export function getProjectRoot(): string {
  return process.env.PWD ?? process.cwd();
}
