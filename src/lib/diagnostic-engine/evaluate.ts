import type { DiagnosticAnswers, DiagnosticProfile } from "../diagnostic-questions";
import { computeAreaScores, computeOverallScore, classify } from "./scoring";
import { diagnosticRules, evaluateCondition, type EngineContext } from "./rules";
import { buildExecutiveConclusion, buildExecutiveSummary } from "./narrative";
import type {
  DiagnosticResult,
  Finding,
  PlanItem,
  PlanPhase,
  Priority,
  Recommendation,
} from "./types";

const PRIORITY_ORDER: Record<Priority, number> = {
  CRITICA: 0,
  ALTA: 1,
  MEDIA: 2,
  OPORTUNIDADE: 3,
};

// The single orchestrator: respostas → normalização (via scoring) →
// motor de regras → achados → recomendações priorizadas → plano de ação →
// conclusão executiva. Everything downstream (email/PDF/frontend) consumes
// only this function's output — no scoring or rule logic should live
// anywhere else in the Node build.
export function runDiagnosticEngine(
  profile: DiagnosticProfile,
  answers: DiagnosticAnswers,
  protocol: string,
): DiagnosticResult {
  const areaScores = computeAreaScores(answers);
  const overallScore = computeOverallScore(answers);
  const classification = classify(overallScore);

  const areaScoreById = Object.fromEntries(areaScores.map((a) => [a.areaId, a]));
  const ctx: EngineContext = { areaScoreById, answers, profile };

  const findings: Finding[] = [];
  const auditTrail: DiagnosticResult["auditTrail"] = [];
  const recommendations: Recommendation[] = [];

  for (const rule of diagnosticRules) {
    if (!evaluateCondition(rule.condition, ctx)) continue;

    findings.push({
      ruleId: rule.id,
      scope: rule.scope,
      priority: rule.priority,
      areaIds: rule.areaIds,
      questionIds: rule.questionIds,
      text: rule.finding,
    });
    auditTrail.push({
      ruleId: rule.id,
      scope: rule.scope,
      areaIds: rule.areaIds,
      questionIds: rule.questionIds,
      priority: rule.priority,
    });

    if (rule.recommendation && rule.phase) {
      recommendations.push({
        ruleId: rule.id,
        priority: rule.priority as Priority,
        phase: rule.phase,
        areaIds: rule.areaIds,
        text: rule.recommendation,
      });
    }
  }

  recommendations.sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );

  const strengths = findings.filter((f) => f.priority === "FORTE");
  const nonStrength = findings.filter((f) => f.priority !== "FORTE");
  const risks = nonStrength.filter(
    (f) => f.priority === "CRITICA" || f.priority === "ALTA",
  );
  const opportunities = nonStrength.filter((f) => f.priority === "OPORTUNIDADE");
  const attentionPoints = nonStrength.filter((f) => f.priority !== "OPORTUNIDADE");

  const actionPlan: Record<PlanPhase, PlanItem[]> = {
    AGORA: [],
    CURTO: [],
    MEDIO: [],
  };
  for (const rec of recommendations) {
    actionPlan[rec.phase].push({
      phase: rec.phase,
      action: rec.text,
      priority: rec.priority,
      areaIds: rec.areaIds,
      ruleId: rec.ruleId,
    });
  }

  const executiveSummary = buildExecutiveSummary(
    profile,
    overallScore,
    classification,
    areaScores,
    strengths,
    risks,
  );
  const executiveConclusion = buildExecutiveConclusion(
    profile,
    overallScore,
    risks.length,
    opportunities.length,
  );

  return {
    protocol,
    overallScore,
    classification,
    areaScores,
    findings,
    strengths,
    attentionPoints,
    risks,
    opportunities,
    recommendations,
    actionPlan,
    executiveSummary,
    executiveConclusion,
    auditTrail,
  };
}
