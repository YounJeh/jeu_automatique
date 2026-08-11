// PHASE 7 (CLAUDE.md §35): simple env-based flag, no feature-flag
// framework. Defaults to false so behavior is unchanged until the
// generic-runtime path is validated end-to-end.
//
// This module is compiled once and imported from both sides of the app:
// src/mastra/** (Node process, process.env is real) and src/game/**
// imported transitively by src/app/index.ts (browser, no bundler —
// process.env doesn't exist there). The frontend is served without a
// bundler (see scripts/vendor-zod.mjs), so the browser can't read the
// server's env directly; static-frontend-route.ts injects the resolved
// value into window.__GENERIC_RUNTIME_ENABLED__ when it serves
// index.html. In the browser we trust only that injected value.
declare global {
  interface Window {
    __GENERIC_RUNTIME_ENABLED__?: boolean;
  }
}

export function isGenericRuntimeEnabled(): boolean {
  if (typeof window !== "undefined") {
    return window.__GENERIC_RUNTIME_ENABLED__ === true;
  }
  return process.env.GENERIC_RUNTIME_ENABLED === "true";
}
