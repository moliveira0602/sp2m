<?php
/**
 * Endpoint de envio de e-mail para o build estático (hospedagem sem Node.js,
 * ex.: cPanel/HostGator). Recebe POST JSON do site, envia via SMTP real
 * (PHPMailer) e, para o diagnóstico completo, anexa um relatório em PDF
 * (FPDF) gerado a partir dos mesmos dados de src/lib/diagnostic-questions.ts
 * (replicados em build time em diagnostic-data.json — ver
 * scripts/generate-diagnostic-data.ts).
 *
 * Tipos suportados (campo "type" no corpo JSON):
 *  - "full":    formulário de diagnóstico completo (perfil + 80 respostas)
 *  - "contact": formulário de contato simples (nome, empresa, e-mail, etc.)
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Método não permitido.'], 405);
}

$configPath = __DIR__ . '/sendmail-config.php';
if (!file_exists($configPath)) {
    respond(['success' => false, 'error' => 'Configuração de e-mail ausente no servidor. Copie sendmail-config.example.php para sendmail-config.php e preencha.'], 500);
}
require $configPath;

require __DIR__ . '/vendor/fpdf/fpdf.php';
require __DIR__ . '/vendor/phpmailer/Exception.php';
require __DIR__ . '/vendor/phpmailer/SMTP.php';
require __DIR__ . '/vendor/phpmailer/PHPMailer.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

$raw = file_get_contents('php://input');
$body = json_decode((string) $raw, true);
if (!is_array($body)) {
    respond(['success' => false, 'error' => 'JSON inválido.'], 400);
}

$type = $body['type'] ?? 'full';

function makeTransporter(): PHPMailer
{
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->Port = SMTP_PORT;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USER;
    $mail->Password = SMTP_PASS;
    $mail->SMTPSecure = SMTP_SECURE === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->CharSet = 'UTF-8';
    $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
    return $mail;
}

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

const FONT_IMPORT = "<style>@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter:wght@400;600;700&display=swap');</style>";
const FONT_DISPLAY = "'Fraunces', Georgia, 'Times New Roman', serif";
const FONT_SANS = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";

// ─────────────────────────────────────────────────────────────────────────
// TYPE: contact — simple 6-field form (mirrors src/lib/api/diagnostic.ts)
// ─────────────────────────────────────────────────────────────────────────
if ($type === 'contact') {
    $nome = trim((string) ($body['nome'] ?? ''));
    $empresa = trim((string) ($body['empresa'] ?? ''));
    $email = trim((string) ($body['email'] ?? ''));
    $whatsapp = trim((string) ($body['whatsapp'] ?? ''));
    $faturamento = trim((string) ($body['faturamento'] ?? ''));
    $desafio = trim((string) ($body['desafio'] ?? ''));

    if ($nome === '' || $empresa === '' || $whatsapp === '' || $faturamento === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(['success' => false, 'error' => 'Preencha todos os campos obrigatórios com um e-mail válido.'], 422);
    }

    $sp2mBody = '
    ' . FONT_IMPORT . '
    <div style="font-family: ' . FONT_SANS . '; color: #16243c; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color: #16243c; border-bottom: 2px solid #da9e3f; padding-bottom: 8px;">Novo Lead de Diagnóstico Estratégico</h2>
      <p>Um novo potencial cliente preencheu o formulário de diagnóstico gratuito no site.</p>
      <table style="border-collapse: collapse; width: 100%; margin-top: 15px;">
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 35%;">Nome do Lead:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">' . e($nome) . '</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Empresa:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">' . e($empresa) . '</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Faturamento Estimado:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">' . e($faturamento) . '</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Maior Desafio Financeiro:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">' . e($desafio) . '</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">E-mail do Cliente:</td><td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:' . e($email) . '">' . e($email) . '</a></td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">WhatsApp:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">' . e($whatsapp) . '</td></tr>
      </table>
      <div style="margin-top: 30px; font-size: 11px; color: #888; text-align: center;">Enviado de forma automatizada pelo portal sp2mgestao.com.br</div>
    </div>';

    $clientBody = '
    ' . FONT_IMPORT . '
    <div style="font-family: ' . FONT_SANS . '; color: #16243c; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;"><h2 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color: #da9e3f; margin: 0;">SP2M Inteligência Empresarial</h2></div>
      <h3 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color: #16243c;">Olá, ' . e($nome) . '!</h3>
      <p>Confirmamos o recebimento dos seus dados para a realização do seu <strong>Diagnóstico Financeiro Estratégico Gratuito</strong>.</p>
      <p>Nossa equipe de consultores seniores já está avaliando as informações compartilhadas sobre a sua empresa, <strong>' . e($empresa) . '</strong>. Entraremos em contato em breve (em até 24 horas úteis).</p>
      <div style="text-align: center; margin: 30px 0;"><a href="https://wa.me/5581992781366" style="background-color: #25d366; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; font-size: 15px;">Iniciar Atendimento no WhatsApp</a></div>
      <p style="margin-top: 30px;">Atenciosamente,</p>
      <p><strong>Equipe SP2M Inteligência Empresarial</strong><br /><a href="https://sp2mgestao.com.br" style="color: #da9e3f; text-decoration: none; font-weight: bold;">sp2mgestao.com.br</a></p>
    </div>';

    try {
        $mail = makeTransporter();
        $mail->addAddress(SP2M_TO_EMAIL);
        $mail->isHTML(true);
        $mail->Subject = '[Lead Site] Solicitação de Diagnóstico - ' . $empresa;
        $mail->Body = $sp2mBody;
        $mail->send();

        $mail2 = makeTransporter();
        $mail2->addAddress($email);
        $mail2->isHTML(true);
        $mail2->Subject = 'Recebemos sua solicitação de diagnóstico estratégico - SP2M Gestão';
        $mail2->Body = $clientBody;
        $mail2->send();

        respond(['success' => true]);
    } catch (PHPMailerException $ex) {
        respond(['success' => false, 'error' => 'Falha ao enviar e-mail: ' . $ex->getMessage()], 500);
    }
}

// ─────────────────────────────────────────────────────────────────────────
// TYPE: full — 10-area / 80-question diagnostic (mirrors send-diagnostic-full.server.ts)
// ─────────────────────────────────────────────────────────────────────────
if ($type !== 'full') {
    respond(['success' => false, 'error' => 'Tipo de envio desconhecido.'], 400);
}

$profile = $body['profile'] ?? null;
$answers = $body['answers'] ?? null;
$protocol = trim((string) ($body['protocol'] ?? ''));

if (!is_array($profile) || !is_array($answers) || $protocol === '') {
    respond(['success' => false, 'error' => 'Dados incompletos.'], 422);
}

$required = ['company', 'contact', 'email', 'whatsapp', 'segment'];
foreach ($required as $field) {
    if (trim((string) ($profile[$field] ?? '')) === '') {
        respond(['success' => false, 'error' => "Campo obrigatório ausente: $field"], 422);
    }
}
if (!filter_var($profile['email'], FILTER_VALIDATE_EMAIL)) {
    respond(['success' => false, 'error' => 'E-mail inválido.'], 422);
}
if (($profile['consent'] ?? false) !== true) {
    respond(['success' => false, 'error' => 'É necessário autorizar o envio das informações à SP2M.'], 422);
}

$dataPath = __DIR__ . '/diagnostic-data.json';
$rulesPath = __DIR__ . '/diagnostic-rules.json';
if (!file_exists($dataPath) || !file_exists($rulesPath)) {
    respond(['success' => false, 'error' => 'Base de perguntas/regras ausente no servidor (diagnostic-data.json / diagnostic-rules.json).'], 500);
}
$diagnosticData = json_decode((string) file_get_contents($dataPath), true);
$diagnosticRulesData = json_decode((string) file_get_contents($rulesPath), true);
$areas = $diagnosticData['areas'] ?? [];
$scale = $diagnosticData['scale'] ?? [];
$rules = $diagnosticRulesData['rules'] ?? [];

require __DIR__ . '/diagnostic-engine.php';

function scoreLabel(array $scale, $value): string
{
    if ($value === null) return '—';
    if ($value === 'na') return 'Não se aplica';
    foreach ($scale as $opt) {
        if ($opt['value'] === $value) return $opt['value'] . ' · ' . $opt['label'];
    }
    return (string) $value;
}

// ── Idempotency: a diagnostic already processed for this protocol is
// never reprocessed/re-emailed — the stored client-safe result is
// returned instead. Prevents duplicate sends from double submits/retries.
$safeProtocol = preg_replace('/[^A-Za-z0-9_-]/', '', $protocol);
if ($safeProtocol === '') {
    respond(['success' => false, 'error' => 'Protocolo inválido.'], 422);
}
$storageDir = __DIR__ . '/diagnostics-data';
if (!is_dir($storageDir)) {
    @mkdir($storageDir, 0755, true);
}
$storageFile = $storageDir . '/' . $safeProtocol . '.json';
if (file_exists($storageFile)) {
    $stored = json_decode((string) file_get_contents($storageFile), true);
    if (is_array($stored) && !empty($stored['result'])) {
        respond(array_merge(['success' => true], toClientSummary($stored['result'])));
    }
}

$result = runDiagnosticEngine($areas, $rules, $profile, $answers, $protocol);
$overallScore = $result['overallScore'];

// ── Build the PDF report (FPDF; UTF-8 converted to Latin-1 for text output) ──
function toLatin1(string $s): string
{
    if (!function_exists('iconv')) {
        return $s;
    }
    $converted = @iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $s);
    return $converted === false ? $s : $converted;
}

class DiagnosticPdf extends FPDF
{
}

// Everything below (PDF generation + SMTP sends) can throw for reasons
// unrelated to PHPMailer (e.g. FPDF errors, missing extensions on the
// host). Without a catch-all here, any such error is an uncaught fatal
// that produces a blank 500 response and leaves the client stuck on
// "Não foi possível enviar o diagnóstico."
try {
$pdf = new DiagnosticPdf();
$pdf->SetTitle(toLatin1('Diagnóstico Financeiro — ' . $profile['company']));
$pdf->SetAutoPageBreak(true, 20);
$pdf->AddPage();
$pdf->SetMargins(15, 15, 15);
$pageWidth = $pdf->GetPageWidth() - 30;

// Header
$pdf->SetTextColor(218, 158, 63);
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(0, 6, toLatin1('SP2M INTELIGENCIA EMPRESARIAL'), 0, 1);
$pdf->SetTextColor(22, 36, 60);
$pdf->SetFont('Times', 'B', 20);
$pdf->Cell(0, 10, toLatin1('Diagnostico Financeiro Completo'), 0, 1);
$pdf->SetFont('Helvetica', '', 9);
$pdf->SetTextColor(107, 114, 128);
$pdf->Cell(0, 6, toLatin1('Protocolo ' . $protocol . ' - Recebido em ' . date('d/m/Y H:i')), 0, 1);
$pdf->Ln(2);
$pdf->SetDrawColor(229, 231, 235);
$pdf->Line(15, $pdf->GetY(), 15 + $pageWidth, $pdf->GetY());
$pdf->Ln(4);

// Overall score
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->SetTextColor(107, 114, 128);
$pdf->Cell(0, 5, toLatin1('INDICE DE MATURIDADE FINANCEIRA'), 0, 1);
$pdf->SetFont('Times', 'B', 28);
$pdf->SetTextColor(218, 158, 63);
$pdf->Cell(0, 12, (string) $overallScore . ' / 100', 0, 1);
$pdf->Ln(2);

// Company data
$pdf->SetFont('Helvetica', 'B', 12);
$pdf->SetTextColor(22, 36, 60);
$pdf->Cell(0, 8, toLatin1('Dados da empresa'), 0, 1);

$rows = [
    ['Empresa', $profile['company']],
    ['CNPJ', $profile['cnpj'] ?? '—'],
    ['Segmento', $profile['segment']],
    ['Responsavel', $profile['contact'] . (!empty($profile['role']) ? ' (' . $profile['role'] . ')' : '')],
    ['E-mail', $profile['email']],
    ['WhatsApp', $profile['whatsapp']],
    ['Faturamento mensal', $profile['revenue'] ?? '—'],
    ['Colaboradores', $profile['employees'] ?? '—'],
    ['Unidades / CNPJs', $profile['units'] ?? '—'],
    ['Sistema de gestao', $profile['system'] ?? '—'],
    ['Cidade / UF', trim(($profile['city'] ?? '') . ' / ' . ($profile['state'] ?? ''), ' /') ?: '—'],
];
foreach ($rows as [$label, $value]) {
    $pdf->SetFont('Helvetica', 'B', 9.5);
    $pdf->SetTextColor(107, 114, 128);
    $pdf->Cell(55, 6, toLatin1((string) $label), 0, 0);
    $pdf->SetFont('Helvetica', '', 9.5);
    $pdf->SetTextColor(22, 36, 60);
    $pdf->MultiCell(0, 6, toLatin1((string) $value));
}
$pdf->Ln(3);

// Area scores (bars)
$pdf->SetFont('Helvetica', 'B', 12);
$pdf->SetTextColor(22, 36, 60);
$pdf->Cell(0, 8, toLatin1('Pontuacao por area'), 0, 1);
$barMaxWidth = 90;
foreach ($result['areaScores'] as $entry) {
    $label = $entry['number'] . ' - ' . $entry['short'] . ' (' . $entry['classification'] . ')';
    $score = $entry['score'];
    $y = $pdf->GetY();
    $pdf->SetFont('Helvetica', '', 9.5);
    $pdf->SetTextColor(22, 36, 60);
    $pdf->Cell(75, 6, toLatin1($label), 0, 0);
    $barX = $pdf->GetX();
    $pdf->SetFillColor(229, 231, 235);
    $pdf->Rect($barX, $y + 1, $barMaxWidth, 3.5, 'F');
    $pdf->SetFillColor(218, 158, 63);
    $pdf->Rect($barX, $y + 1, $barMaxWidth * ($score / 100), 3.5, 'F');
    $pdf->SetXY($barX + $barMaxWidth + 4, $y);
    $pdf->SetFont('Helvetica', 'B', 9);
    $pdf->Cell(15, 6, (string) $score, 0, 1);
}
$pdf->Ln(3);

function pdfBulletSection(FPDF $pdf, string $title, array $items, float $pageWidth): void
{
    if (empty($items)) return;
    if ($pdf->GetY() > $pdf->GetPageHeight() - 40) $pdf->AddPage();
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetTextColor(22, 36, 60);
    $pdf->Cell(0, 8, toLatin1($title), 0, 1);
    $pdf->SetFont('Helvetica', '', 9.5);
    $pdf->SetTextColor(22, 36, 60);
    foreach ($items as $item) {
        if ($pdf->GetY() > $pdf->GetPageHeight() - 25) $pdf->AddPage();
        $pdf->MultiCell($pageWidth, 5, toLatin1('- ' . $item));
        $pdf->Ln(0.5);
    }
    $pdf->Ln(2);
}

// Visão geral e conclusão executiva
pdfBulletSection($pdf, 'Visao geral', [$result['executiveSummary']], $pageWidth);

// Pontos fortes / atenção / riscos / oportunidades
$strengthsText = array_map(fn($f) => $f['text'], $result['strengths']);
$mediaAttention = array_map(fn($f) => $f['text'], array_values(array_filter($result['attentionPoints'], fn($f) => $f['priority'] === 'MEDIA')));
$risksText = array_map(fn($f) => $f['text'], $result['risks']);
$opportunitiesText = array_map(fn($f) => $f['text'], $result['opportunities']);

pdfBulletSection($pdf, 'Principais pontos fortes', $strengthsText, $pageWidth);
pdfBulletSection($pdf, 'Principais pontos de atencao', $mediaAttention, $pageWidth);
pdfBulletSection($pdf, 'Riscos identificados', $risksText, $pageWidth);
pdfBulletSection($pdf, 'Oportunidades', $opportunitiesText, $pageWidth);

// Recomendações prioritárias
if (!empty($result['recommendations'])) {
    $pdf->AddPage();
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetTextColor(22, 36, 60);
    $pdf->Cell(0, 8, toLatin1('Recomendacoes prioritarias'), 0, 1);
    foreach ($result['recommendations'] as $rec) {
        if ($pdf->GetY() > $pdf->GetPageHeight() - 25) $pdf->AddPage();
        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->SetTextColor(218, 158, 63);
        $pdf->Cell(0, 5, toLatin1('[' . $rec['priority'] . ']'), 0, 1);
        $pdf->SetFont('Helvetica', '', 9.5);
        $pdf->SetTextColor(22, 36, 60);
        $pdf->MultiCell($pageWidth, 5, toLatin1($rec['text']));
        $pdf->Ln(1.5);
    }
}

// Plano de ação
$pdf->AddPage();
$pdf->SetFont('Helvetica', 'B', 12);
$pdf->SetTextColor(22, 36, 60);
$pdf->Cell(0, 8, toLatin1('Plano de acao'), 0, 1);
$phaseLabels = ['AGORA' => 'Agora (0-30 dias)', 'CURTO' => 'Curto prazo (31-90 dias)', 'MEDIO' => 'Medio prazo (3-6 meses)'];
foreach ($phaseLabels as $phaseKey => $phaseLabel) {
    $items = $result['actionPlan'][$phaseKey] ?? [];
    if (empty($items)) continue;
    if ($pdf->GetY() > $pdf->GetPageHeight() - 40) $pdf->AddPage();
    $pdf->SetFont('Helvetica', 'B', 10.5);
    $pdf->SetTextColor(218, 158, 63);
    $pdf->Cell(0, 7, toLatin1($phaseLabel), 0, 1);
    $pdf->SetFont('Helvetica', '', 9.5);
    $pdf->SetTextColor(22, 36, 60);
    foreach ($items as $item) {
        if ($pdf->GetY() > $pdf->GetPageHeight() - 25) $pdf->AddPage();
        $pdf->MultiCell($pageWidth, 5, toLatin1('- ' . $item['action']));
        $pdf->Ln(0.5);
    }
    $pdf->Ln(2);
}

// Conclusão executiva
pdfBulletSection($pdf, 'Conclusao executiva', [$result['executiveConclusion']], $pageWidth);

// Detailed answers
$pdf->AddPage();
$pdf->SetFont('Helvetica', 'B', 12);
$pdf->SetTextColor(22, 36, 60);
$pdf->Cell(0, 8, toLatin1('Respostas detalhadas (80 questoes)'), 0, 1);
foreach ($areas as $area) {
    $pdf->SetFont('Helvetica', 'B', 11);
    $pdf->SetTextColor(22, 36, 60);
    $pdf->Cell(0, 7, toLatin1($area['number'] . ' - ' . $area['title']), 0, 1);

    $qi = 1;
    foreach ($area['questions'] as $q) {
        $label = scoreLabel($scale, $answers[$q['id']] ?? null);
        $critical = $q['critical'] ? ' (controle critico)' : '';
        $pdf->SetFont('Helvetica', '', 9.5);
        $pdf->SetTextColor(22, 36, 60);
        $pdf->MultiCell(0, 5, toLatin1(str_pad((string) $qi, 2, '0', STR_PAD_LEFT) . '. ' . $q['text'] . $critical));
        $pdf->SetFont('Helvetica', 'B', 9.5);
        $pdf->SetTextColor(218, 158, 63);
        $pdf->Cell(0, 5, toLatin1('-> ' . $label), 0, 1);
        $pdf->Ln(1);
        $qi++;
    }
    $pdf->Ln(2);
}

$pdfContent = $pdf->Output('S'); // return as string

// ── HTML email bodies ──
$areaScoresRows = '';
foreach ($result['areaScores'] as $entry) {
    $areaScoresRows .= '<tr><td style="padding: 8px 10px; border-bottom: 1px solid #eee;">' . e($entry['number'] . ' · ' . $entry['short']) . '</td><td style="padding: 8px 10px; border-bottom: 1px solid #eee; font-weight: bold;">' . $entry['score'] . '/100 · ' . e($entry['classification']) . '</td></tr>';
}

function htmlList(array $items): string
{
    if (empty($items)) return '<p style="color:#888; font-size:13px;">Nenhum item identificado nesta categoria.</p>';
    $out = '<ul style="padding-left:18px; margin:8px 0;">';
    foreach ($items as $item) {
        $out .= '<li style="margin-bottom:6px;">' . e($item) . '</li>';
    }
    return $out . '</ul>';
}

$strengthsHtml = htmlList(array_map(fn($f) => $f['text'], $result['strengths']));
$risksHtml = htmlList(array_map(fn($f) => $f['text'], $result['risks']));
$opportunitiesHtml = htmlList(array_map(fn($f) => $f['text'], $result['opportunities']));

$recommendationsHtml = '';
foreach ($result['recommendations'] as $rec) {
    $badgeColor = ['CRITICA' => '#dc2626', 'ALTA' => '#da9e3f', 'MEDIA' => '#2563eb', 'OPORTUNIDADE' => '#059669'][$rec['priority']] ?? '#6b7280';
    $recommendationsHtml .= '<li style="margin-bottom:10px;"><span style="display:inline-block; font-size:10px; font-weight:bold; color:#fff; background:' . $badgeColor . '; padding:2px 8px; border-radius:10px; margin-right:6px;">' . e($rec['priority']) . '</span>' . e($rec['text']) . '</li>';
}
$recommendationsHtml = $recommendationsHtml === '' ? '<p style="color:#888; font-size:13px;">Nenhuma recomendação adicional.</p>' : '<ul style="padding-left:18px; margin:8px 0;">' . $recommendationsHtml . '</ul>';

$phaseLabels = ['AGORA' => 'Agora (0-30 dias)', 'CURTO' => 'Curto prazo (31-90 dias)', 'MEDIO' => 'Médio prazo (3-6 meses)'];
$actionPlanHtml = '';
foreach ($phaseLabels as $phaseKey => $phaseLabel) {
    $items = $result['actionPlan'][$phaseKey] ?? [];
    if (empty($items)) continue;
    $actionPlanHtml .= '<h4 style="margin:16px 0 6px; color:#16243c;">' . e($phaseLabel) . '</h4><ul style="padding-left:18px; margin:0;">';
    foreach ($items as $item) {
        $actionPlanHtml .= '<li style="margin-bottom:6px;">' . e($item['action']) . '</li>';
    }
    $actionPlanHtml .= '</ul>';
}

$profileRows = '
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width:35%;">Empresa</td><td style="padding: 8px; border-bottom: 1px solid #eee;">' . e($profile['company']) . '</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">CNPJ</td><td style="padding: 8px; border-bottom: 1px solid #eee;">' . e($profile['cnpj'] ?? '—') . '</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Segmento</td><td style="padding: 8px; border-bottom: 1px solid #eee;">' . e($profile['segment']) . '</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Responsável</td><td style="padding: 8px; border-bottom: 1px solid #eee;">' . e($profile['contact'] . (!empty($profile['role']) ? ' (' . $profile['role'] . ')' : '')) . '</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">E-mail</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:' . e($profile['email']) . '">' . e($profile['email']) . '</a></td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">WhatsApp</td><td style="padding: 8px; border-bottom: 1px solid #eee;">' . e($profile['whatsapp']) . '</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Faturamento mensal</td><td style="padding: 8px; border-bottom: 1px solid #eee;">' . e($profile['revenue'] ?? '—') . '</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Cidade / UF</td><td style="padding: 8px; border-bottom: 1px solid #eee;">' . e(trim(($profile['city'] ?? '') . ' / ' . ($profile['state'] ?? ''), ' /') ?: '—') . '</td></tr>
';

$sp2mHtml = '
    ' . FONT_IMPORT . '
    <div style="font-family: ' . FONT_SANS . '; color: #16243c; line-height: 1.6; max-width: 720px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color: #16243c; border-bottom: 2px solid #da9e3f; padding-bottom: 8px;">Diagnóstico Financeiro Completo — ' . e($profile['company']) . '</h2>
      <p>Protocolo: <strong>' . e($protocol) . '</strong> · Índice de maturidade: <strong>' . $overallScore . '/100 · ' . e($result['classification']) . '</strong></p>
      <p style="background:#fdf6ea; border-left:4px solid #da9e3f; padding:10px 14px; border-radius:0 6px 6px 0; font-size:13px;">' . e($result['executiveSummary']) . '</p>
      <p style="background:#fdf6ea; border-left:4px solid #da9e3f; padding:10px 14px; border-radius:0 6px 6px 0; font-size:13px;">📎 O relatório completo, com a análise por área e todas as 80 respostas, está anexado a este e-mail em PDF.</p>

      <h3 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color:#16243c;">Dados da empresa</h3>
      <table style="border-collapse: collapse; width: 100%;">' . $profileRows . '</table>

      <h3 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color:#16243c; margin-top:24px;">Pontuação por área</h3>
      <table style="border-collapse: collapse; width: 100%;">' . $areaScoresRows . '</table>

      <h3 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color:#16243c; margin-top:24px;">Pontos fortes</h3>
      ' . $strengthsHtml . '

      <h3 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color:#16243c; margin-top:24px;">Riscos identificados</h3>
      ' . $risksHtml . '

      <h3 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color:#16243c; margin-top:24px;">Oportunidades</h3>
      ' . $opportunitiesHtml . '

      <h3 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color:#16243c; margin-top:24px;">Recomendações prioritárias</h3>
      ' . $recommendationsHtml . '

      <h3 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color:#16243c; margin-top:24px;">Plano de ação</h3>
      ' . $actionPlanHtml . '

      <h3 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color:#16243c; margin-top:24px;">Conclusão executiva</h3>
      <p>' . e($result['executiveConclusion']) . '</p>

      <div style="margin-top: 30px; font-size: 11px; color: #888; text-align: center;">Enviado de forma automatizada pelo portal sp2mgestao.com.br</div>
    </div>';

$clientAreaRows = '';
foreach ($result['areaScores'] as $entry) {
    $clientAreaRows .= '<tr><td style="padding: 6px 10px; border-bottom: 1px solid #eee;">' . e($entry['number'] . ' · ' . $entry['short']) . '</td><td style="padding: 6px 10px; border-bottom: 1px solid #eee; font-weight: bold;">' . $entry['score'] . '/100</td></tr>';
}
$clientSummary = toClientSummary($result);
$clientStrengthsHtml = empty($clientSummary['strengths']) ? '' : '<p style="margin:10px 0 0; font-size:13px;"><strong>Destaques positivos:</strong> ' . e(implode(', ', $clientSummary['strengths'])) . '</p>';

$clientHtml = '
    ' . FONT_IMPORT . '
    <div style="font-family: ' . FONT_SANS . '; color: #16243c; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;"><h2 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color: #da9e3f; margin: 0;">SP2M Inteligência Empresarial</h2></div>
      <h3 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color: #16243c;">Olá, ' . e($profile['contact']) . '!</h3>
      <p>Recebemos o seu <strong>Diagnóstico Financeiro completo</strong> (10 áreas, 80 questões) para a empresa <strong>' . e($profile['company']) . '</strong>.</p>
      <p>Protocolo de acompanhamento: <strong>' . e($protocol) . '</strong></p>
      <div style="background-color: #f9fbfd; border-left: 4px solid #da9e3f; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <h4 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; margin: 0 0 10px 0; color: #16243c;">Índice preliminar de maturidade financeira</h4>
        <p style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; font-size: 28px; margin: 0; color:#da9e3f;">' . $overallScore . '<span style="font-family: ' . FONT_SANS . '; font-weight: 400; font-size:14px; color:#16243c;">/100 · ' . e($result['classification']) . '</span></p>
        <table style="border-collapse: collapse; width: 100%; margin-top:12px;">' . $clientAreaRows . '</table>
        ' . $clientStrengthsHtml . '
        <p style="margin: 12px 0 0; font-size: 13px;">' . e($clientSummary['message']) . '</p>
      </div>
      <p>Nossa equipe de consultores seniores já está avaliando as informações compartilhadas. Entraremos em contato em breve (em até 24 horas úteis). Por favor, aguarde a análise da SP2M.</p>
      <div style="text-align: center; margin: 30px 0;"><a href="https://wa.me/5581992781366" style="background-color: #25d366; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; font-size: 15px;">Falar agora no WhatsApp</a></div>
      <p style="margin-top: 30px;">Atenciosamente,</p>
      <p><strong>Equipe SP2M Inteligência Empresarial</strong><br /><a href="https://sp2mgestao.com.br" style="color: #da9e3f; text-decoration: none; font-weight: bold;">sp2mgestao.com.br</a></p>
    </div>';

$diagnosticToEmail = defined('DIAGNOSTIC_TO_EMAIL') ? DIAGNOSTIC_TO_EMAIL : SP2M_TO_EMAIL;

$mail = makeTransporter();
$mail->addAddress($diagnosticToEmail);
$mail->isHTML(true);
$mail->Subject = '[Diagnóstico Completo] ' . $profile['company'] . ' — Índice ' . $overallScore . '/100';
$mail->Body = $sp2mHtml;
$safeCompany = preg_replace('/[^a-zA-Z0-9]+/', '-', (string) $profile['company']);
$mail->addStringAttachment($pdfContent, 'diagnostico-' . strtolower((string) $safeCompany) . '.pdf', 'base64', 'application/pdf');
$mail->send();

$mail2 = makeTransporter();
$mail2->addAddress($profile['email']);
$mail2->isHTML(true);
$mail2->Subject = 'Recebemos seu Diagnóstico Financeiro — SP2M Gestão';
$mail2->Body = $clientHtml;
$mail2->send();

// Persistência: cada diagnóstico completo (perfil + respostas + análise +
// trilha de auditoria) fica gravado como um arquivo JSON individual,
// nomeado pelo protocolo, numa pasta bloqueada a acesso web (.htaccess) —
// única forma de "consulta posterior" viável sem banco de dados na
// hospedagem estática atual. Também é o que sustenta a guarda de
// idempotência no topo deste bloco.
@file_put_contents($storageFile, json_encode([
    'protocol' => $protocol,
    'submittedAt' => date('c'),
    'profile' => $profile,
    'answers' => $answers,
    'result' => $result,
], JSON_UNESCAPED_UNICODE));

respond(array_merge(['success' => true], toClientSummary($result)));
} catch (\Throwable $ex) {
    error_log('sendmail.php [type=full] failed: ' . $ex->getMessage());
    respond(['success' => false, 'error' => 'Falha ao gerar/enviar o diagnóstico: ' . $ex->getMessage()], 500);
}
