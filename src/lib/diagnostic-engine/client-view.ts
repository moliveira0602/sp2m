import type { ClientSummary, DiagnosticResult } from "./types";

// The only projection of DiagnosticResult allowed to reach the browser
// bundle or the client's email: score, classification, per-area scores,
// and a handful of area names — never recommendation/risk/plan text.
// Keeps the "full report is presented by a consultant" business model
// (existing client-facing copy) intact instead of dumping the internal
// analysis into the frontend.
export function toClientSummary(result: DiagnosticResult): ClientSummary {
  const strengths = result.strengths
    .slice(0, 3)
    .map((f) => {
      const area = result.areaScores.find((a) => a.areaId === f.areaIds[0]);
      return area?.short ?? f.text;
    });

  const attentionAreas = [...result.areaScores]
    .filter((a) => a.score < 61)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((a) => a.short);

  return {
    protocol: result.protocol,
    overallScore: result.overallScore,
    classification: result.classification,
    areaScores: result.areaScores.map((a) => ({
      areaId: a.areaId,
      short: a.short,
      number: a.number,
      score: a.score,
    })),
    strengths,
    attentionAreas,
    message:
      "Sua análise completa, com recomendações detalhadas e plano de ação, será apresentada por um consultor da SP2M.",
  };
}
