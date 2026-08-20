import { diagnosticAreas, type DiagnosticAnswers } from "../diagnostic-questions";
import type { AreaScore, Classification } from "./types";

// Bands from the diagnostic briefing: 0-20 Crítico, 21-40 Atenção elevada,
// 41-60 Em desenvolvimento, 61-80 Bom, 81-100 Excelente.
export function classify(score: number): Classification {
  if (score <= 20) return "Crítico";
  if (score <= 40) return "Atenção elevada";
  if (score <= 60) return "Em desenvolvimento";
  if (score <= 80) return "Bom";
  return "Excelente";
}

// "na" answers are excluded from both area and overall averages — same
// convention as the original scoring logic this replaces.
export function computeAreaScores(answers: DiagnosticAnswers): AreaScore[] {
  return diagnosticAreas.map((area) => {
    const numeric = area.questions
      .map((q) => answers[q.id])
      .filter((v): v is number => typeof v === "number");
    const avg = numeric.length
      ? numeric.reduce((a, b) => a + b, 0) / numeric.length
      : 0;
    const score = Math.round((avg / 5) * 100);
    return {
      areaId: area.id,
      number: area.number,
      title: area.title,
      short: area.short,
      avg,
      score,
      classification: classify(score),
    };
  });
}

export function computeOverallScore(answers: DiagnosticAnswers): number {
  const numeric = Object.values(answers).filter(
    (v): v is number => typeof v === "number",
  );
  if (!numeric.length) return 0;
  const avg = numeric.reduce((a, b) => a + b, 0) / numeric.length;
  return Math.round((avg / 5) * 100);
}
