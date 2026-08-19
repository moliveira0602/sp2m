import PDFDocument from "pdfkit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { diagnosticAreas, scaleOptions } from "@/lib/diagnostic-questions";
import type { DiagnosticFullData } from "./send-diagnostic-full.server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.resolve(__dirname, "../../assets/fonts");

const NAVY = "#16243c";
const GOLD = "#da9e3f";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

function scoreLabel(value: number | "na" | undefined) {
  if (value === undefined) return "—";
  if (value === "na") return "N/A";
  const option = scaleOptions.find((o) => o.value === value);
  return option ? `${option.value} · ${option.label}` : String(value);
}

export interface PdfReportData {
  profile: DiagnosticFullData["profile"];
  answers: DiagnosticFullData["answers"];
  protocol: string;
  overallScore: number;
  areaScores: { area: (typeof diagnosticAreas)[number]; score: number }[];
  priorities: { area: (typeof diagnosticAreas)[number]; score: number }[];
}

export function generateDiagnosticPdf(data: PdfReportData): Promise<Buffer> {
  const { profile, answers, protocol, overallScore, areaScores, priorities } =
    data;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 56, bottom: 56, left: 56, right: 56 },
      info: {
        Title: `Diagnóstico Financeiro — ${profile.company}`,
        Author: "SP2M Inteligência Empresarial",
      },
    });

    doc.registerFont("Sans", path.join(FONTS_DIR, "Inter-Regular.woff"));
    doc.registerFont("Sans-Bold", path.join(FONTS_DIR, "Inter-Bold.woff"));
    doc.registerFont("Display", path.join(FONTS_DIR, "Fraunces-SemiBold.woff"));

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // ── Header ──────────────────────────────────────────────
    doc
      .font("Display")
      .fontSize(11)
      .fillColor(GOLD)
      .text("SP2M INTELIGÊNCIA EMPRESARIAL", { characterSpacing: 1 });
    doc
      .font("Display")
      .fontSize(22)
      .fillColor(NAVY)
      .text("Diagnóstico Financeiro Completo", { paragraphGap: 4 });
    doc
      .font("Sans")
      .fontSize(10)
      .fillColor(MUTED)
      .text(
        `Protocolo ${protocol} · Recebido em ${new Date().toLocaleString("pt-BR")}`,
      );

    doc.moveDown(1);
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor(BORDER)
      .stroke();
    doc.moveDown(1);

    // ── Overall score ───────────────────────────────────────
    doc
      .font("Sans-Bold")
      .fontSize(10)
      .fillColor(MUTED)
      .text("ÍNDICE DE MATURIDADE FINANCEIRA");
    doc.font("Display").fontSize(36).fillColor(GOLD).text(`${overallScore}`, {
      continued: true,
    });
    doc.font("Sans").fontSize(14).fillColor(MUTED).text(" / 100");
    doc.moveDown(1);

    // ── Company profile table ───────────────────────────────
    sectionTitle(doc, "Dados da empresa");
    const profileRows: [string, string][] = [
      ["Empresa", profile.company],
      ["CNPJ", profile.cnpj || "—"],
      ["Segmento", profile.segment],
      [
        "Responsável",
        profile.role ? `${profile.contact} (${profile.role})` : profile.contact,
      ],
      ["E-mail", profile.email],
      ["WhatsApp", profile.whatsapp],
      ["Faturamento mensal", profile.revenue || "—"],
      ["Colaboradores", profile.employees || "—"],
      ["Unidades / CNPJs", profile.units || "—"],
      ["Sistema de gestão", profile.system || "—"],
      [
        "Cidade / UF",
        [profile.city, profile.state].filter(Boolean).join(" / ") || "—",
      ],
    ];
    keyValueTable(doc, profileRows, pageWidth);
    doc.moveDown(1);

    // ── Area scores ──────────────────────────────────────────
    sectionTitle(doc, "Pontuação por área");
    for (const { area, score } of areaScores) {
      barRow(doc, `${area.number} · ${area.short}`, score, pageWidth);
    }
    doc.moveDown(0.5);

    // ── Priorities ───────────────────────────────────────────
    sectionTitle(doc, "Áreas prioritárias (menor maturidade)");
    doc.font("Sans").fontSize(10).fillColor(NAVY);
    priorities.forEach((p, i) => {
      doc.text(`${i + 1}. ${p.area.short} — ${p.score}/100`);
    });
    doc.moveDown(1);

    // ── Detailed answers ─────────────────────────────────────
    doc.addPage();
    sectionTitle(doc, "Respostas detalhadas (80 questões)");
    for (const area of diagnosticAreas) {
      if (doc.y > doc.page.height - doc.page.margins.bottom - 80) {
        doc.addPage();
      }
      doc
        .font("Sans-Bold")
        .fontSize(11)
        .fillColor(NAVY)
        .text(`${area.number} · ${area.title}`, { paragraphGap: 4 });

      area.questions.forEach((q, qi) => {
        if (doc.y > doc.page.height - doc.page.margins.bottom - 40) {
          doc.addPage();
        }
        const label = scoreLabel(answers[q.id]);
        const critical = q.critical ? " (controle crítico)" : "";
        doc
          .font("Sans")
          .fontSize(9.5)
          .fillColor(NAVY)
          .text(`${String(qi + 1).padStart(2, "0")}. ${q.text}${critical}`, {
            continued: false,
            width: pageWidth,
          });
        doc
          .font("Sans-Bold")
          .fontSize(9.5)
          .fillColor(GOLD)
          .text(`→ ${label}`, { indent: 14 });
        doc.moveDown(0.35);
      });
      doc.moveDown(0.5);
    }

    doc.end();
  });
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  const x = doc.page.margins.left;
  const y = doc.y;
  doc.font("Sans-Bold").fontSize(12).fillColor(NAVY).text(title, x, y);
  doc.x = x;
  doc.moveDown(0.5);
}

// Manual row-by-row layout: every text() call gets an explicit x/y so
// pdfkit's internal cursor never "sticks" to a previous column — mixing
// auto-flow and explicit-position calls is what caused overlapping rows.
function keyValueTable(
  doc: PDFKit.PDFDocument,
  rows: [string, string][],
  width: number,
) {
  const left = doc.page.margins.left;
  const labelWidth = width * 0.32;
  const valueWidth = width - labelWidth - 12;
  const valueX = left + labelWidth + 12;

  for (const [label, value] of rows) {
    if (doc.y > doc.page.height - doc.page.margins.bottom - 40) {
      doc.addPage();
    }
    const y = doc.y;
    doc.font("Sans-Bold").fontSize(9.5);
    const labelHeight = doc.heightOfString(label, { width: labelWidth });
    doc.font("Sans").fontSize(9.5);
    const valueHeight = doc.heightOfString(value, { width: valueWidth });
    const rowHeight = Math.max(labelHeight, valueHeight);

    doc
      .font("Sans-Bold")
      .fontSize(9.5)
      .fillColor(MUTED)
      .text(label, left, y, { width: labelWidth });
    doc
      .font("Sans")
      .fontSize(9.5)
      .fillColor(NAVY)
      .text(value, valueX, y, { width: valueWidth });

    doc.x = left;
    doc.y = y + rowHeight + 6;
  }
}

function barRow(
  doc: PDFKit.PDFDocument,
  label: string,
  score: number,
  width: number,
) {
  if (doc.y > doc.page.height - doc.page.margins.bottom - 30) {
    doc.addPage();
  }
  const left = doc.page.margins.left;
  const y = doc.y;
  const labelWidth = width * 0.35;
  const barWidth = width - labelWidth - 44;
  const barX = left + labelWidth;

  doc
    .font("Sans")
    .fontSize(9.5)
    .fillColor(NAVY)
    .text(label, left, y + 1, { width: labelWidth });

  doc
    .rect(barX, y + 2, barWidth, 8)
    .fillColor(BORDER)
    .fill();
  doc
    .rect(barX, y + 2, barWidth * (score / 100), 8)
    .fillColor(GOLD)
    .fill();
  doc
    .font("Sans-Bold")
    .fontSize(9)
    .fillColor(NAVY)
    .text(`${score}`, barX + barWidth + 8, y + 1);

  doc.x = left;
  doc.y = y + 18;
}
