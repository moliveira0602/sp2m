import nodemailer from "nodemailer";
import { diagnosticAreas } from "@/lib/diagnostic-questions";
import { generateDiagnosticPdf } from "./generate-diagnostic-pdf.server";

export interface DiagnosticFullData {
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

const FONT_IMPORT = `<style>@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter:wght@400;600;700&display=swap');</style>`;
const FONT_DISPLAY = "'Fraunces', Georgia, 'Times New Roman', serif";
const FONT_SANS =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";

function computeAreaScores(answers: Record<string, number | "na">) {
  return diagnosticAreas.map((area) => {
    const numeric = area.questions
      .map((q) => answers[q.id])
      .filter((v): v is number => typeof v === "number");
    const avg = numeric.length
      ? numeric.reduce((a, b) => a + b, 0) / numeric.length
      : 0;
    return {
      area,
      avg,
      score: Math.round((avg / 5) * 100),
    };
  });
}

function computeOverallScore(answers: Record<string, number | "na">) {
  const numeric = Object.values(answers).filter(
    (v): v is number => typeof v === "number",
  );
  if (!numeric.length) return 0;
  const avg = numeric.reduce((a, b) => a + b, 0) / numeric.length;
  return Math.round((avg / 5) * 100);
}

export function buildDiagnosticEmailBodies(data: DiagnosticFullData) {
  const { profile, answers, protocol } = data;
  const overallScore = computeOverallScore(answers);
  const areaScores = computeAreaScores(answers);
  const priorities = [...areaScores].sort((a, b) => a.avg - b.avg).slice(0, 3);

  const areaScoresRows = areaScores
    .map(
      ({ area, score }) => `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #eee;">${area.number} · ${area.short}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #eee; font-weight: bold;">${score}/100</td>
        </tr>`,
    )
    .join("");

  const profileRows = `
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width:35%;">Empresa</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${profile.company}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">CNPJ</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${profile.cnpj || "—"}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Segmento</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${profile.segment}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Responsável</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${profile.contact}${profile.role ? ` (${profile.role})` : ""}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">E-mail</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${profile.email}">${profile.email}</a></td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">WhatsApp</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="https://wa.me/55${profile.whatsapp.replace(/\D/g, "")}">${profile.whatsapp}</a></td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Faturamento mensal</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${profile.revenue || "—"}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Colaboradores</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${profile.employees || "—"}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Unidades / CNPJs</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${profile.units || "—"}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Sistema de gestão</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${profile.system || "—"}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Cidade / UF</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${[profile.city, profile.state].filter(Boolean).join(" / ") || "—"}</td></tr>
  `;

  // 1. Internal email to SP2M — summary in the body, full 80-question
  // breakdown goes in the attached PDF report.
  const sp2mEmailBody = `
    ${FONT_IMPORT}
    <div style="font-family: ${FONT_SANS}; color: #16243c; line-height: 1.6; max-width: 720px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="font-family: ${FONT_DISPLAY}; font-weight: 600; color: #16243c; border-bottom: 2px solid #da9e3f; padding-bottom: 8px;">Diagnóstico Financeiro Completo — ${profile.company}</h2>
      <p>Protocolo: <strong>${protocol}</strong> · Índice preliminar de maturidade: <strong>${overallScore}/100</strong></p>
      <p style="background:#fdf6ea; border-left:4px solid #da9e3f; padding:10px 14px; border-radius:0 6px 6px 0; font-size:13px;">
        📎 O relatório completo, com todas as 80 respostas detalhadas por área, está anexado a este e-mail em PDF.
      </p>

      <h3 style="font-family: ${FONT_DISPLAY}; font-weight: 600; color:#16243c;">Dados da empresa</h3>
      <table style="border-collapse: collapse; width: 100%;">${profileRows}</table>

      <h3 style="font-family: ${FONT_DISPLAY}; font-weight: 600; color:#16243c; margin-top:24px;">Pontuação por área</h3>
      <table style="border-collapse: collapse; width: 100%;">${areaScoresRows}</table>

      <h3 style="font-family: ${FONT_DISPLAY}; font-weight: 600; color:#16243c; margin-top:24px;">Áreas prioritárias (menor maturidade)</h3>
      <ul>${priorities.map((p) => `<li>${p.area.short} — ${p.score}/100</li>`).join("")}</ul>

      <div style="margin-top: 30px; font-size: 11px; color: #888; text-align: center;">
        Enviado de forma automatizada pelo portal sp2mgestao.com.br
      </div>
    </div>
  `;

  // 2. Confirmation email to the client who filled the form
  const clientEmailBody = `
    ${FONT_IMPORT}
    <div style="font-family: ${FONT_SANS}; color: #16243c; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-family: ${FONT_DISPLAY}; font-weight: 600; color: #da9e3f; margin: 0;">SP2M Inteligência Empresarial</h2>
      </div>
      <h3 style="font-family: ${FONT_DISPLAY}; font-weight: 600; color: #16243c;">Olá, ${profile.contact}!</h3>
      <p>Recebemos o seu <strong>Diagnóstico Financeiro completo</strong> (10 áreas, 80 questões) para a empresa <strong>${profile.company}</strong>.</p>
      <p>Protocolo de acompanhamento: <strong>${protocol}</strong></p>

      <div style="background-color: #f9fbfd; border-left: 4px solid #da9e3f; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <h4 style="font-family: ${FONT_DISPLAY}; font-weight: 600; margin: 0 0 10px 0; color: #16243c;">Índice preliminar de maturidade financeira</h4>
        <p style="font-family: ${FONT_DISPLAY}; font-weight: 600; font-size: 28px; margin: 0; color:#da9e3f;">${overallScore}<span style="font-family: ${FONT_SANS}; font-weight: 400; font-size:14px; color:#16243c;">/100</span></p>
        <p style="margin: 8px 0 0; font-size: 13px;">A pontuação exibida é preliminar. Nossa equipe irá analisar suas respostas e liberar o relatório executivo completo, com riscos priorizados e plano de ação para 30/60/90 dias.</p>
      </div>

      <p>Nossa equipe de consultores seniores já está avaliando as informações compartilhadas. Entraremos em contato em breve (em até 24 horas úteis). Por favor, aguarde a análise da SP2M.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://wa.me/5581992781366" style="background-color: #25d366; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 4px 12px rgba(37,211,102,0.2);">Falar agora no WhatsApp</a>
      </div>

      <p style="margin-top: 30px;">Atenciosamente,</p>
      <p><strong>Equipe SP2M Inteligência Empresarial</strong><br />
      <span style="font-size: 13px; color: #666;">Diretoria Financeira & BPO de Alta Performance</span><br />
      <a href="https://sp2mgestao.com.br" style="color: #da9e3f; text-decoration: none; font-weight: bold;">sp2mgestao.com.br</a></p>
    </div>
  `;

  return {
    overallScore,
    areaScores,
    priorities,
    sp2mSubject: `[Diagnóstico Completo] ${profile.company} — Índice ${overallScore}/100`,
    sp2mHtml: sp2mEmailBody,
    clientSubject: `Recebemos seu Diagnóstico Financeiro — SP2M Gestão`,
    clientHtml: clientEmailBody,
  };
}

export async function sendDiagnosticFullEmails(data: DiagnosticFullData) {
  const smtpHost = process.env.SMTP_HOST || "";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";
  const smtpFrom =
    process.env.SMTP_FROM || `"SP2M Gestão" <contato@sp2mgestao.com.br>`;

  const { profile, answers, protocol } = data;

  console.log(
    "Processando envio do diagnóstico completo para:",
    profile.company,
    profile.email,
  );

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn(
      "AVISO: Configurações de SMTP ausentes (SMTP_HOST, SMTP_USER, SMTP_PASS). O e-mail simulou sucesso no envio.",
    );
    const { overallScore } = buildDiagnosticEmailBodies(data);
    return { success: true, simulated: true, overallScore, protocol };
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

  const {
    overallScore,
    areaScores,
    priorities,
    sp2mSubject,
    sp2mHtml,
    clientSubject,
    clientHtml,
  } = buildDiagnosticEmailBodies(data);

  const pdfBuffer = await generateDiagnosticPdf({
    profile,
    answers,
    protocol,
    overallScore,
    areaScores,
    priorities,
  });

  await transporter.sendMail({
    from: smtpFrom,
    to: "contato@sp2mgestao.com.br",
    subject: sp2mSubject,
    html: sp2mHtml,
    attachments: [
      {
        filename: `diagnostico-${profile.company.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  await transporter.sendMail({
    from: smtpFrom,
    to: profile.email,
    subject: clientSubject,
    html: clientHtml,
  });

  return { success: true, overallScore, protocol };
}
