import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
import { runDiagnosticEngine, toClientSummary } from "@/lib/diagnostic-engine";
import type { DiagnosticResult } from "@/lib/diagnostic-engine";
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

const PRIORITY_BADGE_COLOR: Record<string, string> = {
  CRITICA: "#dc2626",
  ALTA: "#da9e3f",
  MEDIA: "#2563eb",
  OPORTUNIDADE: "#059669",
};

const PHASE_LABEL: Record<string, string> = {
  AGORA: "Agora (0-30 dias)",
  CURTO: "Curto prazo (31-90 dias)",
  MEDIO: "Médio prazo (3-6 meses)",
};

function htmlList(items: string[]): string {
  if (!items.length) {
    return `<p style="color:#888; font-size:13px;">Nenhum item identificado nesta categoria.</p>`;
  }
  return `<ul style="padding-left:18px; margin:8px 0;">${items
    .map((item) => `<li style="margin-bottom:6px;">${item}</li>`)
    .join("")}</ul>`;
}

export function buildDiagnosticEmailBodies(data: DiagnosticFullData) {
  const { profile, answers, protocol } = data;
  const result = runDiagnosticEngine(profile, answers, protocol);
  const { overallScore, classification } = result;

  const areaScoresRows = result.areaScores
    .map(
      (a) => `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #eee;">${a.number} · ${a.short}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #eee; font-weight: bold;">${a.score}/100 · ${a.classification}</td>
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

  const recommendationsHtml = result.recommendations.length
    ? `<ul style="padding-left:18px; margin:8px 0;">${result.recommendations
        .map(
          (r) =>
            `<li style="margin-bottom:10px;"><span style="display:inline-block; font-size:10px; font-weight:bold; color:#fff; background:${PRIORITY_BADGE_COLOR[r.priority] ?? "#6b7280"}; padding:2px 8px; border-radius:10px; margin-right:6px;">${r.priority}</span>${r.text}</li>`,
        )
        .join("")}</ul>`
    : `<p style="color:#888; font-size:13px;">Nenhuma recomendação adicional.</p>`;

  const actionPlanHtml = (Object.keys(PHASE_LABEL) as (keyof typeof PHASE_LABEL)[])
    .map((phase) => {
      const items = result.actionPlan[phase as keyof typeof result.actionPlan];
      if (!items.length) return "";
      return `
        <h4 style="margin:16px 0 6px; color:#16243c;">${PHASE_LABEL[phase]}</h4>
        <ul style="padding-left:18px; margin:0;">${items
          .map((i) => `<li style="margin-bottom:6px;">${i.action}</li>`)
          .join("")}</ul>`;
    })
    .join("");

  // 1. Internal email to SP2M — full analysis in the body, plus the
  // complete 80-question breakdown in the attached PDF.
  const sp2mEmailBody = `
    ${FONT_IMPORT}
    <div style="font-family: ${FONT_SANS}; color: #16243c; line-height: 1.6; max-width: 720px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="font-family: ${FONT_DISPLAY}; font-weight: 600; color: #16243c; border-bottom: 2px solid #da9e3f; padding-bottom: 8px;">Diagnóstico Financeiro Completo — ${profile.company}</h2>
      <p>Protocolo: <strong>${protocol}</strong> · Índice de maturidade: <strong>${overallScore}/100 · ${classification}</strong></p>
      <p style="background:#fdf6ea; border-left:4px solid #da9e3f; padding:10px 14px; border-radius:0 6px 6px 0; font-size:13px;">${result.executiveSummary}</p>
      <p style="background:#fdf6ea; border-left:4px solid #da9e3f; padding:10px 14px; border-radius:0 6px 6px 0; font-size:13px;">
        📎 O relatório completo, com a análise por área e todas as 80 respostas, está anexado a este e-mail em PDF.
      </p>

      <h3 style="font-family: ${FONT_DISPLAY}; font-weight: 600; color:#16243c;">Dados da empresa</h3>
      <table style="border-collapse: collapse; width: 100%;">${profileRows}</table>

      <h3 style="font-family: ${FONT_DISPLAY}; font-weight: 600; color:#16243c; margin-top:24px;">Pontuação por área</h3>
      <table style="border-collapse: collapse; width: 100%;">${areaScoresRows}</table>

      <h3 style="font-family: ${FONT_DISPLAY}; font-weight: 600; color:#16243c; margin-top:24px;">Pontos fortes</h3>
      ${htmlList(result.strengths.map((f) => f.text))}

      <h3 style="font-family: ${FONT_DISPLAY}; font-weight: 600; color:#16243c; margin-top:24px;">Riscos identificados</h3>
      ${htmlList(result.risks.map((f) => f.text))}

      <h3 style="font-family: ${FONT_DISPLAY}; font-weight: 600; color:#16243c; margin-top:24px;">Oportunidades</h3>
      ${htmlList(result.opportunities.map((f) => f.text))}

      <h3 style="font-family: ${FONT_DISPLAY}; font-weight: 600; color:#16243c; margin-top:24px;">Recomendações prioritárias</h3>
      ${recommendationsHtml}

      <h3 style="font-family: ${FONT_DISPLAY}; font-weight: 600; color:#16243c; margin-top:24px;">Plano de ação</h3>
      ${actionPlanHtml}

      <h3 style="font-family: ${FONT_DISPLAY}; font-weight: 600; color:#16243c; margin-top:24px;">Conclusão executiva</h3>
      <p>${result.executiveConclusion}</p>

      <div style="margin-top: 30px; font-size: 11px; color: #888; text-align: center;">
        Enviado de forma automatizada pelo portal sp2mgestao.com.br
      </div>
    </div>
  `;

  const clientSummary = toClientSummary(result);
  const clientAreaRows = clientSummary.areaScores
    .map(
      (a) =>
        `<tr><td style="padding: 6px 10px; border-bottom: 1px solid #eee;">${a.number} · ${a.short}</td><td style="padding: 6px 10px; border-bottom: 1px solid #eee; font-weight: bold;">${a.score}/100</td></tr>`,
    )
    .join("");
  const clientStrengthsHtml = clientSummary.strengths.length
    ? `<p style="margin:10px 0 0; font-size:13px;"><strong>Destaques positivos:</strong> ${clientSummary.strengths.join(", ")}</p>`
    : "";

  // 2. Confirmation email to the client who filled the form — strategic
  // preview only (score, classification, per-area scores, headline
  // strengths). Full recommendations/risks/plan stay internal, per the
  // "consultant presents the full report" business model.
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
        <p style="font-family: ${FONT_DISPLAY}; font-weight: 600; font-size: 28px; margin: 0; color:#da9e3f;">${overallScore}<span style="font-family: ${FONT_SANS}; font-weight: 400; font-size:14px; color:#16243c;">/100 · ${classification}</span></p>
        <table style="border-collapse: collapse; width: 100%; margin-top:12px;">${clientAreaRows}</table>
        ${clientStrengthsHtml}
        <p style="margin: 12px 0 0; font-size: 13px;">${clientSummary.message}</p>
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
    result,
    clientSummary,
    sp2mSubject: `[Diagnóstico Completo] ${profile.company} — Índice ${overallScore}/100`,
    sp2mHtml: sp2mEmailBody,
    clientSubject: `Recebemos seu Diagnóstico Financeiro — SP2M Gestão`,
    clientHtml: clientEmailBody,
  };
}

const STORAGE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../data/diagnostics",
);

async function storageFilePath(protocol: string): Promise<string> {
  const safe = protocol.replace(/[^A-Za-z0-9_-]/g, "");
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  return path.join(STORAGE_DIR, `${safe}.json`);
}

async function readStoredResult(protocol: string): Promise<DiagnosticResult | null> {
  try {
    const file = await storageFilePath(protocol);
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed.result ?? null;
  } catch {
    return null;
  }
}

async function storeResult(data: DiagnosticFullData, result: DiagnosticResult) {
  const file = await storageFilePath(data.protocol);
  await fs.writeFile(
    file,
    JSON.stringify(
      {
        protocol: data.protocol,
        submittedAt: new Date().toISOString(),
        profile: data.profile,
        answers: data.answers,
        result,
      },
      null,
      2,
    ),
  );
}

export async function sendDiagnosticFullEmails(data: DiagnosticFullData) {
  // Idempotency: never reprocess/re-send for a protocol already handled.
  const existing = await readStoredResult(data.protocol);
  if (existing) {
    return { success: true as const, ...toClientSummary(existing) };
  }

  const smtpHost = process.env.SMTP_HOST || "";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";
  const smtpFrom =
    process.env.SMTP_FROM || `"SP2M Gestão" <contato@sp2mgestao.com.br>`;
  const diagnosticToEmail =
    process.env.DIAGNOSTIC_TO_EMAIL || "contato@sp2mgestao.com.br";

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
    const { result, clientSummary } = buildDiagnosticEmailBodies(data);
    await storeResult(data, result);
    return { success: true as const, simulated: true, ...clientSummary };
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

  const { result, clientSummary, sp2mSubject, sp2mHtml, clientSubject, clientHtml } =
    buildDiagnosticEmailBodies(data);

  const pdfBuffer = await generateDiagnosticPdf({ profile, answers, protocol, result });

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: diagnosticToEmail,
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
  } catch (err) {
    console.error("Falha ao enviar e-mail do diagnóstico completo:", err);
    throw err;
  }

  await storeResult(data, result);

  return { success: true as const, ...clientSummary };
}
