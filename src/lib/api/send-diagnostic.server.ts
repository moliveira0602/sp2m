import nodemailer from "nodemailer";

export interface DiagnosticData {
  nome: string;
  empresa: string;
  faturamento: string;
  desafio: string;
  email: string;
  whatsapp: string;
}

export async function sendDiagnosticEmails(data: DiagnosticData) {
  const smtpHost = process.env.SMTP_HOST || "";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";
  const smtpFrom = process.env.SMTP_FROM || `"SP2M Gestão" <contato@sp2mgestao.com.br>`;

  console.log("Processando envio de e-mails para o lead:", data.nome, data.email);

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn(
      "AVISO: Configurações de SMTP ausentes (SMTP_HOST, SMTP_USER, SMTP_PASS). O e-mail simulou sucesso no envio."
    );
    return { success: true, simulated: true };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  // 1. Email to SP2M (Internal Notification)
  const sp2mEmailBody = `
    <div style="font-family: sans-serif; color: #16243c; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #16243c; border-bottom: 2px solid #da9e3f; padding-bottom: 8px;">Novo Lead de Diagnóstico Estratégico</h2>
      <p>Um novo potencial cliente preencheu o formulário de diagnóstico gratuito no site.</p>
      
      <table style="border-collapse: collapse; width: 100%; margin-top: 15px;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 35%;">Nome do Lead:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.nome}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Empresa:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.empresa}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Faturamento Estimado:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.faturamento}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Maior Desafio Financeiro:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.desafio}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">E-mail do Cliente:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${data.email}">${data.email}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">WhatsApp:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="https://wa.me/55${data.whatsapp.replace(/\D/g, "")}">${data.whatsapp}</a></td>
        </tr>
      </table>
      
      <div style="margin-top: 30px; font-size: 11px; color: #888; text-align: center;">
        Enviado de forma automatizada pelo portal sp2mgestao.com.br
      </div>
    </div>
  `;

  // 2. Confirmation Email to Client
  const clientEmailBody = `
    <div style="font-family: sans-serif; color: #16243c; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #da9e3f; margin: 0;">SP2M Inteligência Empresarial</h2>
      </div>
      <h3 style="color: #16243c;">Olá, ${data.nome}!</h3>
      <p>Confirmamos o recebimento dos seus dados para a realização do seu <strong>Diagnóstico Financeiro Estratégico Gratuito</strong>.</p>
      <p>Nossa equipe de consultores seniores já está avaliando as informações compartilhadas sobre a sua empresa, <strong>${data.empresa}</strong>. Entraremos em contato com você em breve (em até 24 horas úteis) com uma análise inicial e propostas de caminhos estratégicos.</p>
      
      <div style="background-color: #f9fbfd; border-left: 4px solid #da9e3f; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <h4 style="margin: 0 0 10px 0; color: #16243c;">Resumo do diagnóstico solicitado:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li><strong>Empresa:</strong> ${data.empresa}</li>
          <li><strong>Faturamento Mensal:</strong> ${data.faturamento}</li>
          <li><strong>Desafio apontado:</strong> ${data.desafio}</li>
        </ul>
      </div>

      <p>Caso tenha pressa ou queira adiantar a sua sessão estratégica de diagnóstico, você pode falar diretamente com o nosso assessor sênior pelo WhatsApp:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://wa.me/5581992781366" style="background-color: #25d366; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 4px 12px rgba(37,211,102,0.2);">Iniciar Atendimento no WhatsApp</a>
      </div>

      <p style="margin-top: 30px;">Atenciosamente,</p>
      <p><strong>Equipe SP2M Inteligência Empresarial</strong><br />
      <span style="font-size: 13px; color: #666;">Diretoria Financeira & BPO de Alta Performance</span><br />
      <a href="https://sp2mgestao.com.br" style="color: #da9e3f; text-decoration: none; font-weight: bold;">sp2mgestao.com.br</a></p>
    </div>
  `;

  // Send to SP2M
  await transporter.sendMail({
    from: smtpFrom,
    to: "contato@sp2mgestao.com.br",
    subject: `[Lead Site] Solicitação de Diagnóstico - ${data.empresa}`,
    html: sp2mEmailBody,
  });

  // Send confirmation to client
  await transporter.sendMail({
    from: smtpFrom,
    to: data.email,
    subject: `Recebemos sua solicitação de diagnóstico estratégico - SP2M Gestão`,
    html: clientEmailBody,
  });

  return { success: true };
}
