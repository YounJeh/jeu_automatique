export type PlayabilityIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
};

export type PlayabilityReport = {
  playable: boolean;
  issues: PlayabilityIssue[];
};

/**
 * Un jeu reste jouable tant qu'aucun problème de sévérité "error" n'est
 * relevé : les warnings signalent une incohérence sans bloquer la création.
 */
export function buildPlayabilityReport(
  issues: PlayabilityIssue[],
): PlayabilityReport {
  return {
    playable: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}
