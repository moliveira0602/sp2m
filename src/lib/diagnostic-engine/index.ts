export * from "./types";
export { classify, computeAreaScores, computeOverallScore } from "./scoring";
export { diagnosticRules, evaluateCondition } from "./rules";
export type { Condition, DiagnosticRule, EngineContext } from "./rules";
export { runDiagnosticEngine } from "./evaluate";
export { toClientSummary } from "./client-view";
export { buildExecutiveConclusion, buildExecutiveSummary } from "./narrative";
