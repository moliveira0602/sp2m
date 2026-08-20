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

interface ClientAreaScore {
  areaId: string;
  short: string;
  number: string;
  score: number;
}

export const sendDiagnosticFull = async ({
  data,
}: {
  data: DiagnosticFullPayload;
}) => {
  const response = await fetch("/sendmail.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "full", ...data }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(result?.error || "Não foi possível enviar o diagnóstico.");
  }
  return {
    success: true as const,
    overallScore: result.overallScore ?? 0,
    protocol: result.protocol ?? data.protocol,
    classification: (result.classification ?? "") as string,
    areaScores: (result.areaScores ?? []) as ClientAreaScore[],
    strengths: (result.strengths ?? []) as string[],
    attentionAreas: (result.attentionAreas ?? []) as string[],
    message: (result.message ?? "") as string,
  };
};
