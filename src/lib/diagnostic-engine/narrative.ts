import type { DiagnosticProfile } from "../diagnostic-questions";
import type { AreaScore, Classification, Finding } from "./types";

// Composes the executive-summary paragraph from real computed data (best/
// worst area, counts) — never invents a fact the client didn't provide.
export function buildExecutiveSummary(
  profile: DiagnosticProfile,
  overallScore: number,
  classification: Classification,
  areaScores: AreaScore[],
  strengths: Finding[],
  risks: Finding[],
): string {
  const sorted = [...areaScores].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const riskCount = risks.length;

  const strengthPart = strengths.length
    ? `com destaque positivo em ${best.short.toLowerCase()}`
    : `sem áreas ainda no patamar de excelência`;

  const riskPart = riskCount
    ? `${riskCount} ponto${riskCount > 1 ? "s" : ""} de atenção prioritária ${riskCount > 1 ? "foram identificados" : "foi identificado"}, com destaque para ${worst.short.toLowerCase()}`
    : `nenhum ponto crítico foi identificado nas 10 áreas avaliadas`;

  return `A ${profile.company} apresenta um índice de maturidade financeira de ${overallScore}/100 (classificação "${classification}"), ${strengthPart}. ${riskPart}.`;
}

export function buildExecutiveConclusion(
  profile: DiagnosticProfile,
  overallScore: number,
  riskCount: number,
  opportunityCount: number,
): string {
  if (overallScore <= 40) {
    return `O diagnóstico indica que a ${profile.company} precisa priorizar a estruturação de controles financeiros básicos antes de investir em crescimento — ${riskCount} ponto${riskCount === 1 ? "" : "s"} crítico${riskCount === 1 ? "" : "s"} de atenção imediata ${riskCount === 1 ? "foi identificado" : "foram identificados"}. A boa notícia é que os problemas mapeados têm solução conhecida e podem começar a ser endereçados nos próximos 30 dias.`;
  }
  if (overallScore <= 60) {
    return `A ${profile.company} já tem uma base de gestão financeira em formação, mas ainda depende de rotinas manuais e pontuais em áreas relevantes. Estruturar os ${riskCount} pontos de atenção identificados nos próximos 90 dias deve destravar mais previsibilidade e segurança para as decisões do negócio.`;
  }
  return `A ${profile.company} apresenta gestão financeira relativamente madura, com ${opportunityCount} oportunidade${opportunityCount === 1 ? "" : "s"} de evolução mapeada${opportunityCount === 1 ? "" : "s"} para os próximos meses. O foco recomendado é consolidar os processos já implantados e avançar para um patamar de gestão mais estratégico.`;
}
