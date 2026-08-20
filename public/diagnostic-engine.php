<?php
/**
 * Motor de diagnóstico (interpretador PHP). Espelha exatamente
 * src/lib/diagnostic-engine/{scoring,rules,evaluate,narrative,client-view}.ts
 * — o CONTEÚDO das regras (limiares, condições, textos de achado e
 * recomendação) vem de diagnostic-rules.json, gerado a partir de
 * src/lib/diagnostic-engine/rules.ts (fonte única de verdade). Este
 * arquivo só sabe INTERPRETAR a árvore de condições declarativa; não
 * contém nenhum texto de negócio próprio, para nunca divergir do motor TS.
 */

declare(strict_types=1);

// 0-20 Crítico, 21-40 Atenção elevada, 41-60 Em desenvolvimento, 61-80 Bom, 81-100 Excelente.
function diagClassify(int $score): string
{
    if ($score <= 20) return 'Crítico';
    if ($score <= 40) return 'Atenção elevada';
    if ($score <= 60) return 'Em desenvolvimento';
    if ($score <= 80) return 'Bom';
    return 'Excelente';
}

function diagComputeAreaScores(array $areas, array $answers): array
{
    $result = [];
    foreach ($areas as $area) {
        $sum = 0.0;
        $count = 0;
        foreach ($area['questions'] as $q) {
            $v = $answers[$q['id']] ?? null;
            if (is_numeric($v)) {
                $sum += (float) $v;
                $count++;
            }
        }
        $avg = $count > 0 ? $sum / $count : 0.0;
        $score = (int) round(($avg / 5) * 100);
        $result[$area['id']] = [
            'areaId' => $area['id'],
            'number' => $area['number'],
            'title' => $area['title'],
            'short' => $area['short'],
            'avg' => $avg,
            'score' => $score,
            'classification' => diagClassify($score),
        ];
    }
    return $result;
}

function diagComputeOverallScore(array $answers): int
{
    $sum = 0.0;
    $count = 0;
    foreach ($answers as $v) {
        if (is_numeric($v)) {
            $sum += (float) $v;
            $count++;
        }
    }
    if ($count === 0) return 0;
    return (int) round(($sum / $count) / 5 * 100);
}

function diagEvaluateCondition(array $cond, array $areaScoreById, array $answers, array $profile): bool
{
    switch ($cond['op']) {
        case 'areaScoreBetween': {
            $s = $areaScoreById[$cond['area']]['score'] ?? 0;
            return $s >= $cond['min'] && $s <= $cond['max'];
        }
        case 'areaScoreBelow':
            return ($areaScoreById[$cond['area']]['score'] ?? 0) < $cond['value'];
        case 'areaScoreAtLeast':
            return ($areaScoreById[$cond['area']]['score'] ?? 0) >= $cond['value'];
        case 'questionAtMost': {
            $v = $answers[$cond['id']] ?? null;
            return is_numeric($v) && (float) $v <= $cond['value'];
        }
        case 'questionAtLeast': {
            $v = $answers[$cond['id']] ?? null;
            return is_numeric($v) && (float) $v >= $cond['value'];
        }
        case 'profileFieldAbove': {
            $raw = $profile[$cond['field']] ?? null;
            if (!is_string($raw) && !is_numeric($raw)) return false;
            $n = (float) str_replace(',', '.', (string) $raw);
            return $n > $cond['value'];
        }
        case 'and': {
            foreach ($cond['clauses'] as $c) {
                if (!diagEvaluateCondition($c, $areaScoreById, $answers, $profile)) return false;
            }
            return true;
        }
        case 'or': {
            foreach ($cond['clauses'] as $c) {
                if (diagEvaluateCondition($c, $areaScoreById, $answers, $profile)) return true;
            }
            return false;
        }
        default:
            return false;
    }
}

const DIAG_PRIORITY_ORDER = ['CRITICA' => 0, 'ALTA' => 1, 'MEDIA' => 2, 'OPORTUNIDADE' => 3];

/**
 * Runs the full pipeline and returns the internal (complete) result array,
 * shaped to mirror DiagnosticResult from evaluate.ts.
 */
function runDiagnosticEngine(array $areas, array $rules, array $profile, array $answers, string $protocol): array
{
    $areaScoreById = diagComputeAreaScores($areas, $answers);
    $overallScore = diagComputeOverallScore($answers);
    $classification = diagClassify($overallScore);

    $findings = [];
    $auditTrail = [];
    $recommendations = [];

    foreach ($rules as $rule) {
        if (!diagEvaluateCondition($rule['condition'], $areaScoreById, $answers, $profile)) continue;

        $findings[] = [
            'ruleId' => $rule['id'],
            'scope' => $rule['scope'],
            'priority' => $rule['priority'],
            'areaIds' => $rule['areaIds'],
            'questionIds' => $rule['questionIds'],
            'text' => $rule['finding'],
        ];
        $auditTrail[] = [
            'ruleId' => $rule['id'],
            'scope' => $rule['scope'],
            'areaIds' => $rule['areaIds'],
            'questionIds' => $rule['questionIds'],
            'priority' => $rule['priority'],
        ];

        if (!empty($rule['recommendation']) && !empty($rule['phase'])) {
            $recommendations[] = [
                'ruleId' => $rule['id'],
                'priority' => $rule['priority'],
                'phase' => $rule['phase'],
                'areaIds' => $rule['areaIds'],
                'text' => $rule['recommendation'],
            ];
        }
    }

    usort($recommendations, fn($a, $b) => DIAG_PRIORITY_ORDER[$a['priority']] <=> DIAG_PRIORITY_ORDER[$b['priority']]);

    $strengths = array_values(array_filter($findings, fn($f) => $f['priority'] === 'FORTE'));
    $nonStrength = array_values(array_filter($findings, fn($f) => $f['priority'] !== 'FORTE'));
    $risks = array_values(array_filter($nonStrength, fn($f) => $f['priority'] === 'CRITICA' || $f['priority'] === 'ALTA'));
    $opportunities = array_values(array_filter($nonStrength, fn($f) => $f['priority'] === 'OPORTUNIDADE'));
    $attentionPoints = array_values(array_filter($nonStrength, fn($f) => $f['priority'] !== 'OPORTUNIDADE'));

    $actionPlan = ['AGORA' => [], 'CURTO' => [], 'MEDIO' => []];
    foreach ($recommendations as $rec) {
        $actionPlan[$rec['phase']][] = [
            'phase' => $rec['phase'],
            'action' => $rec['text'],
            'priority' => $rec['priority'],
            'areaIds' => $rec['areaIds'],
            'ruleId' => $rec['ruleId'],
        ];
    }

    $areaScores = array_values($areaScoreById);
    $executiveSummary = diagBuildExecutiveSummary($profile, $overallScore, $classification, $areaScores, $strengths, $risks);
    $executiveConclusion = diagBuildExecutiveConclusion($profile, $overallScore, count($risks), count($opportunities));

    return [
        'protocol' => $protocol,
        'overallScore' => $overallScore,
        'classification' => $classification,
        'areaScores' => $areaScores,
        'findings' => $findings,
        'strengths' => $strengths,
        'attentionPoints' => $attentionPoints,
        'risks' => $risks,
        'opportunities' => $opportunities,
        'recommendations' => $recommendations,
        'actionPlan' => $actionPlan,
        'executiveSummary' => $executiveSummary,
        'executiveConclusion' => $executiveConclusion,
        'auditTrail' => $auditTrail,
    ];
}

function diagBuildExecutiveSummary(array $profile, int $overallScore, string $classification, array $areaScores, array $strengths, array $risks): string
{
    $sorted = $areaScores;
    usort($sorted, fn($a, $b) => $b['score'] <=> $a['score']);
    $best = $sorted[0];
    $worst = $sorted[count($sorted) - 1];
    $riskCount = count($risks);

    $strengthPart = count($strengths) > 0
        ? 'com destaque positivo em ' . mb_strtolower($best['short'])
        : 'sem áreas ainda no patamar de excelência';

    $riskPart = $riskCount > 0
        ? $riskCount . ' ponto' . ($riskCount > 1 ? 's' : '') . ' de atenção prioritária ' . ($riskCount > 1 ? 'foram identificados' : 'foi identificado') . ', com destaque para ' . mb_strtolower($worst['short'])
        : 'nenhum ponto crítico foi identificado nas 10 áreas avaliadas';

    return 'A ' . $profile['company'] . ' apresenta um índice de maturidade financeira de ' . $overallScore . '/100 (classificação "' . $classification . '"), ' . $strengthPart . '. ' . $riskPart . '.';
}

function diagBuildExecutiveConclusion(array $profile, int $overallScore, int $riskCount, int $opportunityCount): string
{
    $company = $profile['company'];
    if ($overallScore <= 40) {
        return "O diagnóstico indica que a $company precisa priorizar a estruturação de controles financeiros básicos antes de investir em crescimento — $riskCount ponto" . ($riskCount === 1 ? '' : 's') . ' crítico' . ($riskCount === 1 ? '' : 's') . ' de atenção imediata ' . ($riskCount === 1 ? 'foi identificado' : 'foram identificados') . '. A boa notícia é que os problemas mapeados têm solução conhecida e podem começar a ser endereçados nos próximos 30 dias.';
    }
    if ($overallScore <= 60) {
        return "A $company já tem uma base de gestão financeira em formação, mas ainda depende de rotinas manuais e pontuais em áreas relevantes. Estruturar os $riskCount pontos de atenção identificados nos próximos 90 dias deve destravar mais previsibilidade e segurança para as decisões do negócio.";
    }
    return "A $company apresenta gestão financeira relativamente madura, com $opportunityCount oportunidade" . ($opportunityCount === 1 ? '' : 's') . ' de evolução mapeada' . ($opportunityCount === 1 ? '' : 's') . " para os próximos meses. O foco recomendado é consolidar os processos já implantados e avançar para um patamar de gestão mais estratégico.";
}

/**
 * Client-safe projection — mirrors client-view.ts. This is the only
 * subset that may reach the client's browser response or client email.
 */
function toClientSummary(array $result): array
{
    $strengths = [];
    foreach (array_slice($result['strengths'], 0, 3) as $f) {
        $areaId = $f['areaIds'][0] ?? null;
        $short = $f['text'];
        foreach ($result['areaScores'] as $a) {
            if ($a['areaId'] === $areaId) { $short = $a['short']; break; }
        }
        $strengths[] = $short;
    }

    $sorted = $result['areaScores'];
    usort($sorted, fn($a, $b) => $a['score'] <=> $b['score']);
    $attentionAreas = [];
    foreach ($sorted as $a) {
        if ($a['score'] < 61 && count($attentionAreas) < 2) $attentionAreas[] = $a['short'];
    }

    $areaScores = array_map(fn($a) => [
        'areaId' => $a['areaId'],
        'short' => $a['short'],
        'number' => $a['number'],
        'score' => $a['score'],
    ], $result['areaScores']);

    return [
        'protocol' => $result['protocol'],
        'overallScore' => $result['overallScore'],
        'classification' => $result['classification'],
        'areaScores' => $areaScores,
        'strengths' => $strengths,
        'attentionAreas' => $attentionAreas,
        'message' => 'Sua análise completa, com recomendações detalhadas e plano de ação, será apresentada por um consultor da SP2M.',
    ];
}
