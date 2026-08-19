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
if (!file_exists($dataPath)) {
    respond(['success' => false, 'error' => 'Base de perguntas ausente no servidor (diagnostic-data.json).'], 500);
}
$diagnosticData = json_decode((string) file_get_contents($dataPath), true);
$areas = $diagnosticData['areas'] ?? [];
$scale = $diagnosticData['scale'] ?? [];

function scoreLabel(array $scale, $value): string
{
    if ($value === null) return '—';
    if ($value === 'na') return 'Não se aplica';
    foreach ($scale as $opt) {
        if ($opt['value'] === $value) return $opt['value'] . ' · ' . $opt['label'];
    }
    return (string) $value;
}

$areaScores = [];
$numericSum = 0;
$numericCount = 0;
foreach ($areas as $area) {
    $sum = 0;
    $count = 0;
    foreach ($area['questions'] as $q) {
        $v = $answers[$q['id']] ?? null;
        if (is_numeric($v)) {
            $sum += (float) $v;
            $count++;
            $numericSum += (float) $v;
            $numericCount++;
        }
    }
    $avg = $count > 0 ? $sum / $count : 0;
    $areaScores[] = ['area' => $area, 'avg' => $avg, 'score' => (int) round(($avg / 5) * 100)];
}
$overallScore = $numericCount > 0 ? (int) round(($numericSum / $numericCount) / 5 * 100) : 0;

$priorities = $areaScores;
usort($priorities, fn($a, $b) => $a['avg'] <=> $b['avg']);
$priorities = array_slice($priorities, 0, 3);

// ── Build the PDF report (FPDF; UTF-8 converted to Latin-1 for text output) ──
function toLatin1(string $s): string
{
    $converted = @iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $s);
    return $converted === false ? $s : $converted;
}

class DiagnosticPdf extends FPDF
{
}

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
foreach ($areaScores as $entry) {
    $label = $entry['area']['number'] . ' - ' . $entry['area']['short'];
    $score = $entry['score'];
    $y = $pdf->GetY();
    $pdf->SetFont('Helvetica', '', 9.5);
    $pdf->SetTextColor(22, 36, 60);
    $pdf->Cell(60, 6, toLatin1($label), 0, 0);
    $barX = $pdf->GetX();
    $pdf->SetFillColor(229, 231, 235);
    $pdf->Rect($barX, $y + 1, $barMaxWidth, 3.5, 'F');
    $pdf->SetFillColor(218, 158, 63);
    $pdf->Rect($barX, $y + 1, $barMaxWidth * ($score / 100), 3.5, 'F');
    $pdf->SetXY($barX + $barMaxWidth + 4, $y);
    $pdf->SetFont('Helvetica', 'B', 9);
    $pdf->Cell(15, 6, (string) $score, 0, 1);
}
$pdf->Ln(2);

// Priorities
$pdf->SetFont('Helvetica', 'B', 12);
$pdf->SetTextColor(22, 36, 60);
$pdf->Cell(0, 8, toLatin1('Areas prioritarias (menor maturidade)'), 0, 1);
$pdf->SetFont('Helvetica', '', 10);
$i = 1;
foreach ($priorities as $p) {
    $pdf->Cell(0, 6, toLatin1($i . '. ' . $p['area']['short'] . ' - ' . $p['score'] . '/100'), 0, 1);
    $i++;
}

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
foreach ($areaScores as $entry) {
    $areaScoresRows .= '<tr><td style="padding: 8px 10px; border-bottom: 1px solid #eee;">' . e($entry['area']['number'] . ' · ' . $entry['area']['short']) . '</td><td style="padding: 8px 10px; border-bottom: 1px solid #eee; font-weight: bold;">' . $entry['score'] . '/100</td></tr>';
}
$prioritiesHtml = '';
foreach ($priorities as $p) {
    $prioritiesHtml .= '<li>' . e($p['area']['short']) . ' — ' . $p['score'] . '/100</li>';
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
      <p>Protocolo: <strong>' . e($protocol) . '</strong> · Índice preliminar de maturidade: <strong>' . $overallScore . '/100</strong></p>
      <p style="background:#fdf6ea; border-left:4px solid #da9e3f; padding:10px 14px; border-radius:0 6px 6px 0; font-size:13px;">📎 O relatório completo, com todas as 80 respostas detalhadas por área, está anexado a este e-mail em PDF.</p>
      <h3 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color:#16243c;">Dados da empresa</h3>
      <table style="border-collapse: collapse; width: 100%;">' . $profileRows . '</table>
      <h3 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color:#16243c; margin-top:24px;">Pontuação por área</h3>
      <table style="border-collapse: collapse; width: 100%;">' . $areaScoresRows . '</table>
      <h3 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color:#16243c; margin-top:24px;">Áreas prioritárias (menor maturidade)</h3>
      <ul>' . $prioritiesHtml . '</ul>
      <div style="margin-top: 30px; font-size: 11px; color: #888; text-align: center;">Enviado de forma automatizada pelo portal sp2mgestao.com.br</div>
    </div>';

$clientHtml = '
    ' . FONT_IMPORT . '
    <div style="font-family: ' . FONT_SANS . '; color: #16243c; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;"><h2 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color: #da9e3f; margin: 0;">SP2M Inteligência Empresarial</h2></div>
      <h3 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; color: #16243c;">Olá, ' . e($profile['contact']) . '!</h3>
      <p>Recebemos o seu <strong>Diagnóstico Financeiro completo</strong> (10 áreas, 80 questões) para a empresa <strong>' . e($profile['company']) . '</strong>.</p>
      <p>Protocolo de acompanhamento: <strong>' . e($protocol) . '</strong></p>
      <div style="background-color: #f9fbfd; border-left: 4px solid #da9e3f; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <h4 style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; margin: 0 0 10px 0; color: #16243c;">Índice preliminar de maturidade financeira</h4>
        <p style="font-family: ' . FONT_DISPLAY . '; font-weight: 600; font-size: 28px; margin: 0; color:#da9e3f;">' . $overallScore . '<span style="font-family: ' . FONT_SANS . '; font-weight: 400; font-size:14px; color:#16243c;">/100</span></p>
        <p style="margin: 8px 0 0; font-size: 13px;">A pontuação exibida é preliminar. Nossa equipe irá analisar suas respostas e liberar o relatório executivo completo, com riscos priorizados e plano de ação para 30/60/90 dias.</p>
      </div>
      <p>Nossa equipe de consultores seniores já está avaliando as informações compartilhadas. Entraremos em contato em breve (em até 24 horas úteis). Por favor, aguarde a análise da SP2M.</p>
      <div style="text-align: center; margin: 30px 0;"><a href="https://wa.me/5581992781366" style="background-color: #25d366; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; font-size: 15px;">Falar agora no WhatsApp</a></div>
      <p style="margin-top: 30px;">Atenciosamente,</p>
      <p><strong>Equipe SP2M Inteligência Empresarial</strong><br /><a href="https://sp2mgestao.com.br" style="color: #da9e3f; text-decoration: none; font-weight: bold;">sp2mgestao.com.br</a></p>
    </div>';

try {
    $mail = makeTransporter();
    $mail->addAddress(SP2M_TO_EMAIL);
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

    respond(['success' => true, 'overallScore' => $overallScore, 'protocol' => $protocol]);
} catch (PHPMailerException $ex) {
    respond(['success' => false, 'error' => 'Falha ao enviar e-mail: ' . $ex->getMessage()], 500);
}
