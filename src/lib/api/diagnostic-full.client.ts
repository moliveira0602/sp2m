import { diagnosticAreas } from "@/lib/diagnostic-questions";

interface DiagnosticFullPayload {
  profile: {
    company: string;
    cnpj: string;
    contact: string;
    role: string;
    email: string;
    whatsapp: string;
    segment: string;
    revenue: string;
    employees: string;
    units: string;
    city: string;
    state: string;
    system: string;
    consent: boolean;
  };
  answers: Record<string, number | "na">;
  protocol: string;
}

function computeOverallScore(answers: Record<string, number | "na">) {
  const numeric = Object.values(answers).filter(
    (v): v is number => typeof v === "number",
  );
  if (!numeric.length) return 0;
  const avg = numeric.reduce((a, b) => a + b, 0) / numeric.length;
  return Math.round((avg / 5) * 100);
}

export const sendDiagnosticFull = async ({
  data,
}: {
  data: DiagnosticFullPayload;
}) => {
  console.log(
    "SPA Static Mode: Envio do diagnóstico completo via fallback do cliente.",
  );

  const { profile, answers, protocol } = data;
  const overallScore = computeOverallScore(answers);

  const areaLines = diagnosticAreas
    .map((area) => {
      const numeric = area.questions
        .map((q) => answers[q.id])
        .filter((v): v is number => typeof v === "number");
      const avg = numeric.length
        ? numeric.reduce((a, b) => a + b, 0) / numeric.length
        : 0;
      const score = Math.round((avg / 5) * 100);
      return `${area.number} ${area.short}: ${score}/100`;
    })
    .join("\n");

  const subject = encodeURIComponent(
    `[Diagnóstico Completo] ${profile.company} — Índice ${overallScore}/100`,
  );
  const body = encodeURIComponent(
    `Diagnóstico Financeiro SP2M — Protocolo ${protocol}\n\n` +
      `Empresa: ${profile.company}\n` +
      `CNPJ: ${profile.cnpj || "—"}\n` +
      `Segmento: ${profile.segment}\n` +
      `Responsável: ${profile.contact}${profile.role ? ` (${profile.role})` : ""}\n` +
      `E-mail: ${profile.email}\n` +
      `WhatsApp: ${profile.whatsapp}\n` +
      `Faturamento: ${profile.revenue || "—"}\n` +
      `Colaboradores: ${profile.employees || "—"}\n` +
      `Cidade/UF: ${[profile.city, profile.state].filter(Boolean).join(" / ") || "—"}\n\n` +
      `Índice preliminar de maturidade: ${overallScore}/100\n\n` +
      `Pontuação por área:\n${areaLines}\n\n` +
      `As respostas detalhadas das 80 questões estão salvas neste dispositivo e podem ser reenviadas mediante solicitação.`,
  );

  window.location.href = `mailto:contato@sp2mgestao.com.br?subject=${subject}&body=${body}`;
  return { success: true, clientFallback: true, overallScore, protocol };
};
