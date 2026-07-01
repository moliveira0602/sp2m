export const sendDiagnostic = async ({ data }: { data: {
  nome: string;
  empresa: string;
  faturamento: string;
  desafio: string;
  email: string;
  whatsapp: string;
}}) => {
  console.log("SPA Static Mode: Envio de e-mail via fallback do cliente.");
  
  const subject = encodeURIComponent("Solicitação de Diagnóstico Gratuito - SP2M");
  const body = encodeURIComponent(
    `Olá SP2M!\n\nGostaria de agendar um diagnóstico gratuito.\n\n` +
      `👤 Nome: ${data.nome}\n` +
      `🏢 Empresa: ${data.empresa}\n` +
      `💰 Faturamento: ${data.faturamento}\n` +
      `🎯 Desafio principal: ${data.desafio}\n` +
      `✉️ E-mail: ${data.email}\n` +
      `📱 WhatsApp: ${data.whatsapp}`
  );
  
  window.location.href = `mailto:contato@sp2mgestao.com.br?subject=${subject}&body=${body}`;
  return { success: true, clientFallback: true };
};
