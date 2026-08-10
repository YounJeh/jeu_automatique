// PHASE 7 (CLAUDE.md §35): simple env-based flag, no feature-flag
// framework. Defaults to false so behavior is unchanged until the
// generic-runtime path is validated end-to-end.
export function isGenericRuntimeEnabled(): boolean {
  return process.env.GENERIC_RUNTIME_ENABLED === "true";
}
