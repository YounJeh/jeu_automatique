import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  injectFeatureFlags,
  resolveRequestedFile,
} from "../../mastra/server/static-frontend-route.js";

const PUBLIC_ROOT = resolve(process.cwd(), "public");

const ORIGINAL_VALUE = process.env.GENERIC_RUNTIME_ENABLED;

afterEach(() => {
  if (ORIGINAL_VALUE === undefined) {
    delete process.env.GENERIC_RUNTIME_ENABLED;
  } else {
    process.env.GENERIC_RUNTIME_ENABLED = ORIGINAL_VALUE;
  }
});

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

describe("injectFeatureFlags", () => {
  const html =
    '<body><script type="module" src="./dist/app/index.js"></script></body>';

  it("injects window.__GENERIC_RUNTIME_ENABLED__ = false by default", () => {
    delete process.env.GENERIC_RUNTIME_ENABLED;
    expect(injectFeatureFlags(html)).toContain(
      "window.__GENERIC_RUNTIME_ENABLED__ = false;",
    );
  });

  it("injects true when the env var is set to 'true'", () => {
    process.env.GENERIC_RUNTIME_ENABLED = "true";
    expect(injectFeatureFlags(html)).toContain(
      "window.__GENERIC_RUNTIME_ENABLED__ = true;",
    );
  });

  it("places the injected script before the module script tag", () => {
    process.env.GENERIC_RUNTIME_ENABLED = "true";
    const result = injectFeatureFlags(html);
    expect(result.indexOf("__GENERIC_RUNTIME_ENABLED__")).toBeLessThan(
      result.indexOf('<script type="module"'),
    );
  });
});
