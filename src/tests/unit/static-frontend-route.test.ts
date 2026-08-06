import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveRequestedFile } from "../../mastra/server/static-frontend-route.js";

const PUBLIC_ROOT = resolve(process.cwd(), "public");

describe("resolveRequestedFile", () => {
  it("resolves the root path to index.html", () => {
    expect(resolveRequestedFile("/")).toBe(resolve(PUBLIC_ROOT, "index.html"));
  });

  it("resolves a nested dist asset", () => {
    expect(resolveRequestedFile("/dist/app/index.js")).toBe(
      resolve(PUBLIC_ROOT, "dist/app/index.js"),
    );
  });

  it("rejects a path that escapes public/ via ..", () => {
    expect(resolveRequestedFile("/../../../etc/passwd")).toBeNull();
  });

  it("rejects a path that escapes public/ via a nested ..", () => {
    expect(resolveRequestedFile("/dist/../../../etc/passwd")).toBeNull();
  });

  it("rejects a sibling directory that merely shares a prefix with public/", () => {
    expect(resolveRequestedFile("/../public-evil/secret.txt")).toBeNull();
  });
});
