import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import type { Context } from "hono";
import { isGenericRuntimeEnabled } from "../../game/core/feature-flags.js";
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
  ".svg": "image/svg+xml; charset=utf-8",
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

// Injecté avant tout script pour que window.__GENERIC_RUNTIME_ENABLED__
// soit posé avant l'exécution du bundle applicatif (script type="module",
// donc déjà différé après ce script classique, cf. feature-flags.ts).
export function injectFeatureFlags(html: string): string {
  const script = `<script>window.__GENERIC_RUNTIME_ENABLED__ = ${isGenericRuntimeEnabled()};</script>\n  `;
  return html.replace(
    '<script type="module"',
    `${script}<script type="module"`,
  );
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

    if (extname(filePath) === ".html") {
      const html = injectFeatureFlags(content.toString("utf-8"));
      return c.body(html, 200, { "Content-Type": contentType });
    }

    return c.body(content, 200, { "Content-Type": contentType });
  } catch {
    return c.notFound();
  }
}
