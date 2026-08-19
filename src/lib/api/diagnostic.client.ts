interface ContactPayload {
  nome: string;
  empresa: string;
  faturamento: string;
  desafio: string;
  email: string;
  whatsapp: string;
}

export const sendDiagnostic = async ({ data }: { data: ContactPayload }) => {
  const response = await fetch("/sendmail.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "contact", ...data }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(result?.error || "Não foi possível enviar o diagnóstico.");
  }
  return { success: true as const };
};
