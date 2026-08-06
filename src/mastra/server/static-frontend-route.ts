import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import type { Context } from "hono";
import { getProjectRoot } from "../project-root.js";

// public/ à la racine du projet reste la source de vérité du frontend statique
// (voir specs/etape-5-connexion-frontend-backend.md) ; cette route sert ces
// fichiers directement, sans dépendre de la convention src/mastra/public qui
// ne s'applique qu'à "mastra build", pas à "mastra dev".
const PUBLIC_ROOT = resolve(getProjectRoot(), "public");

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

export function resolveRequestedFile(requestPath: string): string | null {
  const relativePath =
    requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const resolved = resolve(PUBLIC_ROOT, relativePath);

  if (resolved !== PUBLIC_ROOT && !resolved.startsWith(PUBLIC_ROOT + sep)) {
    return null;
  }

  return resolved;
}

/** Sert public/index.html ou un fichier sous public/dist/**. */
export async function serveFrontendFile(c: Context): Promise<Response> {
  const filePath = resolveRequestedFile(c.req.path);

  if (!filePath) {
    return c.notFound();
  }

  try {
    const content = await readFile(filePath);
    const contentType =
      CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream";
    return c.body(content, 200, { "Content-Type": contentType });
  } catch {
    return c.notFound();
  }
}
