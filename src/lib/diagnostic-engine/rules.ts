import {
  diagnosticAreas,
  type DiagnosticAnswers,
  type DiagnosticProfile,
} from "../diagnostic-questions";
import type { AreaScore, FindingPriority, PlanPhase } from "./types";

// Declarative condition tree. Kept serializable (plain data, no closures) so
// the exact same rule set can be exported to JSON and re-evaluated by the
// PHP interpreter (public/diagnostic-engine.php) for the static-hosting
// build — the condition *shape* is the shared contract between both
// runtimes, not the TS code itself.
export type Condition =
  | { op: "areaScoreBetween"; area: string; min: number; max: number }
  | { op: "areaScoreBelow"; area: string; value: number }
  | { op: "areaScoreAtLeast"; area: string; value: number }
  | { op: "questionAtMost"; id: string; value: number }
  | { op: "questionAtLeast"; id: string; value: number }
  | { op: "profileFieldAbove"; field: keyof DiagnosticProfile; value: number }
  | { op: "and"; clauses: Condition[] }
  | { op: "or"; clauses: Condition[] };

export interface EngineContext {
  areaScoreById: Record<string, AreaScore>;
  answers: DiagnosticAnswers;
  profile: DiagnosticProfile;
}

export function evaluateCondition(cond: Condition, ctx: EngineContext): boolean {
  switch (cond.op) {
    case "areaScoreBetween": {
      const s = ctx.areaScoreById[cond.area]?.score ?? 0;
      return s >= cond.min && s <= cond.max;
    }
    case "areaScoreBelow":
      return (ctx.areaScoreById[cond.area]?.score ?? 0) < cond.value;
    case "areaScoreAtLeast":
      return (ctx.areaScoreById[cond.area]?.score ?? 0) >= cond.value;
    case "questionAtMost": {
      const v = ctx.answers[cond.id];
      return typeof v === "number" && v <= cond.value;
    }
    case "questionAtLeast": {
      const v = ctx.answers[cond.id];
      return typeof v === "number" && v >= cond.value;
    }
    case "profileFieldAbove": {
      const raw = ctx.profile[cond.field];
      const n = typeof raw === "string" ? parseFloat(raw.replace(",", ".")) : NaN;
      return !Number.isNaN(n) && n > cond.value;
    }
    case "and":
      return cond.clauses.every((c) => evaluateCondition(c, ctx));
    case "or":
      return cond.clauses.some((c) => evaluateCondition(c, ctx));
    default:
      return false;
  }
}

export interface DiagnosticRule {
  id: string;
  scope: "area" | "critical-question" | "cross";
  condition: Condition;
  priority: FindingPriority;
  phase: PlanPhase | null; // null only for FORTE (strengths need no action)
  areaIds: string[];
  questionIds: string[];
  finding: string;
  recommendation: string | null;
}

// ── Per-area maturity-band copy ──────────────────────────────────────────
// [finding, recommendation] tuples per band, grounded in the actual
// questions of each area (see src/lib/diagnostic-questions.ts). Written
// once here; both the area-band rules below and the generated
// public/diagnostic-rules.json reuse this exact text — nothing is
// re-derived or duplicated elsewhere.
interface AreaCopy {
  critical: [string, string];
  attention: [string, string];
  developing: [string, string];
  good: [string, string];
  excellent: string;
}

const AREA_COPY: Record<string, AreaCopy> = {
  governance: {
    critical: [
      "A gestão financeira não possui separação clara entre pessoa física e jurídica, papéis e alçadas, o que expõe a empresa a decisões informais e risco de descontrole societário.",
      "Formalizar, em até 30 dias, a separação entre finanças da empresa e dos sócios, definir por escrito quem lança, aprova, paga e concilia cada tipo de despesa, e implantar alçadas de aprovação por valor.",
    ],
    attention: [
      "Existem esboços de governança financeira, mas responsabilidades e regras de pró-labore/distribuição ainda não estão documentadas de forma consistente, gerando dependência de decisões pontuais dos sócios.",
      "Documentar uma política simples de pagamentos, reembolsos e pró-labore, com periodicidade definida, e instituir uma reunião financeira mensal com pauta e responsáveis registrados.",
    ],
    developing: [
      "A estrutura de governança existe, mas ainda depende de rotina informal para produzir informação confiável e no prazo para os sócios.",
      "Padronizar o relatório financeiro entregue aos sócios (mesmo formato, mesma data todo mês) e formalizar as alçadas de aprovação já praticadas informalmente.",
    ],
    good: [
      "A governança financeira está relativamente estruturada, com responsabilidades e política de pagamentos definidas.",
      "Revisar anualmente as alçadas de aprovação e a política de pró-labore para acompanhar o crescimento da operação.",
    ],
    excellent:
      "Governança financeira madura: papéis, alçadas e política de distribuição de lucros formalizados e seguidos com disciplina.",
  },
  cash: {
    critical: [
      "A empresa não tem visibilidade diária consolidada de caixa, bancos e aplicações, nem projeção de fluxo de caixa — decisões financeiras estão sendo tomadas sem previsibilidade de liquidez.",
      "Implantar em até 30 dias um controle diário único de saldos (caixa, bancos, aplicações, meios de pagamento) e iniciar um fluxo de caixa projetado para pelo menos 13 semanas.",
    ],
    attention: [
      "Há controle parcial de caixa, mas a conciliação bancária e a projeção de liquidez ainda não acontecem com a frequência necessária para antecipar apertos de caixa.",
      "Estabelecer rotina de conciliação bancária diária (ou D+1) e comparar semanalmente o caixa projetado com o realizado, explicando os desvios.",
    ],
    developing: [
      "O caixa é acompanhado, mas a comparação entre projetado e realizado ainda não é sistemática, reduzindo a capacidade de antecipar necessidades ou sobras de recursos.",
      "Formalizar reserva financeira mínima e criar rotina de revisão semanal do caixa projetado versus realizado.",
    ],
    good: [
      "A tesouraria tem boa visibilidade de saldos e conciliação, com projeção de caixa relativamente confiável.",
      "Evoluir a projeção de caixa para cenários (otimista/base/conservador) e formalizar a reserva de segurança, se ainda não houver.",
    ],
    excellent:
      "Tesouraria madura: saldos diários, conciliação e projeção de caixa de 13 semanas funcionando como rotina de decisão.",
  },
  receivables: {
    critical: [
      "A carteira de recebíveis não é acompanhada de forma estruturada: sem régua de cobrança e sem medição de inadimplência por faixa de atraso, o risco de perda de receita não é visível.",
      "Implantar imediatamente uma régua de cobrança com prazos, canais e responsáveis definidos, e passar a medir a inadimplência por faixa de atraso comparada a uma meta.",
    ],
    attention: [
      "Os títulos a receber são registrados, mas o acompanhamento diário de vencidos/a vencer e os limites de crédito ainda não seguem critérios objetivos.",
      "Padronizar o acompanhamento diário de títulos vencidos e a vencer e definir critérios objetivos de limite de crédito por cliente.",
    ],
    developing: [
      "A cobrança funciona, mas o prazo médio de recebimento ainda não é considerado nas decisões comerciais, o que pode mascarar perda de previsibilidade de caixa.",
      "Incorporar o prazo médio de recebimento como indicador acompanhado junto à área comercial.",
    ],
    good: [
      "A gestão de recebíveis está relativamente estruturada, com conciliação e acompanhamento de inadimplência.",
      "Revisar periodicamente os limites de crédito concedidos frente ao histórico real de inadimplência por cliente.",
    ],
    excellent:
      "Gestão de recebíveis madura: cobrança, limites de crédito e inadimplência monitorados com metas.",
  },
  payables: {
    critical: [
      "Obrigações e pagamentos não são registrados com antecedência nem conferidos antes de pagar, expondo a empresa a atrasos, duplicidades e erros de pagamento.",
      "Implantar checagem obrigatória de documentos/dados bancários antes de qualquer pagamento e registrar todas as obrigações (impostos, folha, contratos) com antecedência mínima definida.",
    ],
    attention: [
      "Existe uma rotina de pagamentos, mas a programação semanal ainda não está alinhada ao fluxo de caixa, e compras relevantes nem sempre passam por cotação/alçada.",
      "Criar programação semanal de pagamentos vinculada ao caixa projetado e exigir cotação e aprovação por alçada para compras acima de um valor definido.",
    ],
    developing: [
      "Os pagamentos são controlados, mas a concentração de compras por fornecedor e o risco de dependência ainda não são avaliados.",
      "Mapear a concentração de compras por fornecedor e negociar prazos mais compatíveis com o ciclo financeiro da empresa.",
    ],
    good: [
      "Contas a pagar e compras têm processo relativamente estruturado, com aprovações e programação de pagamentos.",
      "Formalizar por escrito os critérios de cotação e aprovação já praticados para reduzir dependência de pessoas específicas.",
    ],
    excellent:
      "Processo de pagamentos e compras maduro: aprovações, programação e avaliação de fornecedores funcionando com disciplina.",
  },
  profitability: {
    critical: [
      "Não há uma DRE gerencial mensal confiável — receitas, custos e movimentações patrimoniais aparecem misturadas, o que impede saber se a empresa realmente dá lucro.",
      "Implantar imediatamente o fechamento de uma DRE gerencial mensal por regime de competência, separando com clareza operações, investimentos, empréstimos e retiradas dos sócios.",
    ],
    attention: [
      "A DRE existe, mas o fechamento não tem prazo formal e a rentabilidade por produto/serviço/cliente ainda não é conhecida, dificultando decisões de foco comercial.",
      "Definir um prazo formal de fechamento (ex.: D+5) e apurar a rentabilidade pelos produtos, serviços ou clientes mais relevantes.",
    ],
    developing: [
      "O resultado é apurado, mas eventos não recorrentes ainda não são segregados, o que pode distorcer a leitura do desempenho operacional real.",
      "Separar eventos não recorrentes da DRE gerencial e comparar sistematicamente o realizado com o orçamento e períodos anteriores.",
    ],
    good: [
      "A leitura de resultado está relativamente madura, com margens e rentabilidade acompanhadas.",
      "Aprofundar a análise de rentabilidade por canal/unidade para orientar decisões de expansão ou corte.",
    ],
    excellent:
      "Gestão de resultado madura: DRE gerencial confiável, rentabilidade segmentada e leitura clara da diferença entre lucro e caixa.",
  },
  costs: {
    critical: [
      "Custos fixos e variáveis não são separados de forma consistente e os preços não incorporam todos os componentes (impostos, comissões, fretes, perdas), gerando risco real de vender no prejuízo sem perceber.",
      "Reconstruir a formação de preço incluindo impostos, comissões, fretes, perdas e custo financeiro, e calcular o ponto de equilíbrio mensal imediatamente.",
    ],
    attention: [
      "A ficha de custo existe, mas a margem de contribuição por produto/serviço e o ponto de equilíbrio ainda não são acompanhados com regularidade.",
      "Atualizar a ficha de custo dos principais produtos/serviços e calcular a margem de contribuição por item ao menos trimestralmente.",
    ],
    developing: [
      "Custos e preços são acompanhados, mas itens com margem negativa ou baixa contribuição ainda não têm plano formal de correção.",
      "Criar um plano de correção (reprecificação, corte ou renegociação) para os itens com menor margem de contribuição.",
    ],
    good: [
      "A formação de preço e o controle de margens estão relativamente estruturados.",
      "Formalizar a periodicidade de reajuste de preços frente a variações de custo, para não perder margem ao longo do tempo.",
    ],
    excellent:
      "Gestão de custos e preços madura: margem de contribuição e ponto de equilíbrio monitorados e usados na decisão comercial.",
  },
  "working-capital": {
    critical: [
      "A necessidade de capital de giro não é calculada e o ciclo financeiro não é acompanhado — o crescimento das vendas pode estar consumindo caixa sem que a empresa perceba.",
      "Calcular a necessidade de capital de giro e o ciclo financeiro (PMR, PME, PMP) nos próximos 30 dias, e avaliar o impacto do crescimento recente de vendas sobre o caixa.",
    ],
    attention: [
      "Os prazos médios são conhecidos, mas o estoque físico ainda não é conciliado regularmente com o sistema, gerando risco de decisões de compra baseadas em dados desatualizados.",
      "Implantar inventários regulares de conciliação física x sistema e definir meta de redução do ciclo financeiro.",
    ],
    developing: [
      "O capital de giro é acompanhado, mas produtos parados ou de baixo giro ainda não têm plano de liquidação definido.",
      "Mapear itens de baixo giro/obsoletos e criar um plano de liquidação para liberar caixa preso em estoque.",
    ],
    good: [
      "A gestão de capital de giro e estoques está relativamente estruturada.",
      "Conectar a compra/reposição de estoque à projeção de caixa para evitar picos de necessidade de capital de giro.",
    ],
    excellent:
      "Capital de giro maduro: ciclo financeiro, estoque e necessidade de caixa monitorados com metas de redução.",
  },
  debt: {
    critical: [
      "Não existe um mapa completo das dívidas da empresa nem comparação entre o serviço da dívida e a geração de caixa operacional — o risco de descontrole de endividamento não está sendo medido.",
      "Construir imediatamente um mapa completo de empréstimos, financiamentos e garantias, e comparar o serviço mensal da dívida com a geração operacional de caixa.",
    ],
    attention: [
      "As dívidas são conhecidas, mas cheque especial e crédito emergencial ainda são usados sem planejamento, e não há simulação de cenários de estresse.",
      "Restringir o uso de crédito emergencial a situações planejadas e simular cenários de queda de receita e alta de juros sobre a necessidade de caixa.",
    ],
    developing: [
      "O endividamento é monitorado, mas os controles preventivos contra fraude e concentração bancária ainda não estão formalizados.",
      "Implantar controles de dupla aprovação e revisão periódica de acessos bancários para reduzir risco de fraude.",
    ],
    good: [
      "O endividamento está relativamente sob controle, com dívidas mapeadas e comparadas à geração de caixa.",
      "Formalizar a análise comparativa entre capital próprio e de terceiros antes de novas decisões de investimento.",
    ],
    excellent:
      "Gestão de endividamento madura: dívidas mapeadas, capacidade de pagamento e cenários de risco simulados regularmente.",
  },
  planning: {
    critical: [
      "Não existe orçamento anual estruturado nem análise de desvios entre realizado e planejado — as decisões financeiras estão sendo tomadas sem plano de referência.",
      "Construir um orçamento anual (receitas, custos, despesas, investimentos e caixa) nos próximos 30-60 dias e instituir análise mensal de desvios com ação corretiva.",
    ],
    attention: [
      "Existem metas financeiras, mas sem painel de indicadores críticos atualizado que oriente as decisões no dia a dia.",
      "Criar um painel enxuto com os indicadores financeiros mais críticos, atualizado semanalmente ou mensalmente conforme a rotina da empresa.",
    ],
    developing: [
      "O planejamento existe, mas cenários otimista/base/conservador ainda não orientam decisões relevantes de investimento.",
      "Passar a construir cenários (otimista, base, conservador) para as principais decisões de investimento e expansão.",
    ],
    good: [
      "O planejamento financeiro está relativamente estruturado, com metas e orçamento acompanhados.",
      "Conectar de forma mais explícita o planejamento financeiro às metas comerciais e operacionais da empresa.",
    ],
    excellent:
      "Planejamento financeiro maduro: orçamento, forecast e cenários orientando as decisões de forma integrada com as demais áreas.",
  },
  technology: {
    critical: [
      "O sistema de gestão não concentra contas a pagar, receber, caixa e classificação financeira, e a qualidade dos dados não é conferida antes dos relatórios — a confiabilidade da informação financeira está comprometida na origem.",
      "Unificar contas a pagar, receber, caixa e classificação financeira em um único sistema e implantar checagem de qualidade dos dados antes de qualquer relatório gerencial.",
    ],
    attention: [
      "Existe sistema de gestão, mas integrações bancárias/fiscais/de vendas ainda geram retrabalho manual e os acessos financeiros não seguem perfil e dupla autorização.",
      "Priorizar as integrações bancárias e fiscais que mais geram retrabalho e implantar controle de acesso por perfil com dupla autorização.",
    ],
    developing: [
      "Os processos financeiros críticos ainda não têm procedimento escrito nem plano de continuidade (substituto treinado, backup) em caso de ausência.",
      "Documentar os processos financeiros críticos e definir substituto treinado e rotina de backup para funções-chave.",
    ],
    good: [
      "A estrutura tecnológica e de processos financeiros está relativamente madura.",
      "Passar a usar indicadores de prazo, erro e retrabalho para orientar melhorias contínuas no financeiro.",
    ],
    excellent:
      "Tecnologia e processos maduros: sistema integrado, dados confiáveis e controles de acesso e continuidade bem estabelecidos.",
  },
};

function buildAreaBandRules(): DiagnosticRule[] {
  const rules: DiagnosticRule[] = [];
  for (const area of diagnosticAreas) {
    const copy = AREA_COPY[area.id];
    if (!copy) continue;
    const bands: {
      key: keyof Omit<AreaCopy, "excellent">;
      min: number;
      max: number;
      priority: FindingPriority;
      phase: PlanPhase;
    }[] = [
      { key: "critical", min: 0, max: 20, priority: "CRITICA", phase: "AGORA" },
      { key: "attention", min: 21, max: 40, priority: "ALTA", phase: "AGORA" },
      { key: "developing", min: 41, max: 60, priority: "MEDIA", phase: "CURTO" },
      { key: "good", min: 61, max: 80, priority: "OPORTUNIDADE", phase: "MEDIO" },
    ];
    for (const band of bands) {
      const [finding, recommendation] = copy[band.key];
      rules.push({
        id: `area-${area.id}-${band.key}`,
        scope: "area",
        condition: {
          op: "areaScoreBetween",
          area: area.id,
          min: band.min,
          max: band.max,
        },
        priority: band.priority,
        phase: band.phase,
        areaIds: [area.id],
        questionIds: [],
        finding,
        recommendation,
      });
    }
    rules.push({
      id: `area-${area.id}-excelente`,
      scope: "area",
      condition: { op: "areaScoreBetween", area: area.id, min: 81, max: 100 },
      priority: "FORTE",
      phase: null,
      areaIds: [area.id],
      questionIds: [],
      finding: copy.excellent,
      recommendation: null,
    });
  }
  return rules;
}

// A "critical" question (see buildQuestions()'s "!" convention in
// diagnostic-questions.ts) scoring 0-1 is treated as a standalone CRÍTICA
// finding regardless of the area average — this is what gives the
// `critical` flag real weight in the score's interpretation instead of
// being purely cosmetic, as documented in the plan.
function buildCriticalQuestionRules(): DiagnosticRule[] {
  const rules: DiagnosticRule[] = [];
  for (const area of diagnosticAreas) {
    for (const q of area.questions) {
      if (!q.critical) continue;
      rules.push({
        id: `critical-${q.id}`,
        scope: "critical-question",
        condition: { op: "questionAtMost", id: q.id, value: 1 },
        priority: "CRITICA",
        phase: "AGORA",
        areaIds: [area.id],
        questionIds: [q.id],
        finding: `Controle crítico ausente em ${area.short}: "${q.text}" recebeu nota mínima.`,
        recommendation: `Tratar como prioridade imediata: implantar o controle "${q.text}" nos próximos 30 dias.`,
      });
    }
  }
  return rules;
}

// Cross-area correlation rules — the "análise cruzada" layer. Each
// condition combines real signals from two+ areas or profile fields; none
// of these reference anything the client didn't actually answer.
const CROSS_RULES: DiagnosticRule[] = [
  {
    id: "cross-caixa-recebiveis",
    scope: "cross",
    condition: {
      op: "and",
      clauses: [
        { op: "areaScoreBelow", area: "cash", value: 41 },
        { op: "areaScoreBelow", area: "receivables", value: 41 },
      ],
    },
    priority: "CRITICA",
    phase: "AGORA",
    areaIds: ["cash", "receivables"],
    questionIds: [],
    finding:
      "A empresa não tem visibilidade de caixa nem controle estruturado de recebíveis — sinal de que pode não haver clareza de quanto e quando o dinheiro das vendas efetivamente entra no caixa, ampliando o risco de descasamento entre vendas e liquidez real.",
    recommendation:
      "Priorizar simultaneamente a implantação do fluxo de caixa projetado e da régua de cobrança — os dois problemas se alimentam e devem ser resolvidos juntos.",
  },
  {
    id: "cross-resultado-custos",
    scope: "cross",
    condition: {
      op: "and",
      clauses: [
        { op: "areaScoreBelow", area: "profitability", value: 41 },
        { op: "areaScoreBelow", area: "costs", value: 41 },
      ],
    },
    priority: "CRITICA",
    phase: "AGORA",
    areaIds: ["profitability", "costs"],
    questionIds: [],
    finding:
      "A empresa não sabe, com confiabilidade, se cada venda dá lucro: a apuração de resultado é frágil e a formação de preço não considera todos os custos — combinação que pode indicar operação estruturalmente deficitária sem que isso seja percebido.",
    recommendation:
      "Antes de qualquer decisão de expansão, reconstruir a DRE gerencial e a formação de preço juntas — o resultado só é confiável se o custo por trás do preço também for.",
  },
  {
    id: "cross-endividamento-caixa",
    scope: "cross",
    condition: {
      op: "and",
      clauses: [
        { op: "areaScoreBelow", area: "debt", value: 41 },
        { op: "areaScoreBelow", area: "cash", value: 41 },
      ],
    },
    priority: "CRITICA",
    phase: "AGORA",
    areaIds: ["debt", "cash"],
    questionIds: [],
    finding:
      "A empresa tem dívidas sem visibilidade clara de caixa para sustentá-las, o que eleva o risco de inadimplência com bancos e fornecedores em momentos de aperto.",
    recommendation:
      "Comparar imediatamente o serviço da dívida ao caixa projetado (mesmo que preliminar) para dimensionar o risco real de descasamento entre parcelas e liquidez disponível.",
  },
  {
    id: "cross-giro-recebiveis",
    scope: "cross",
    condition: {
      op: "and",
      clauses: [
        { op: "areaScoreBelow", area: "working-capital", value: 41 },
        { op: "areaScoreBelow", area: "receivables", value: 41 },
      ],
    },
    priority: "ALTA",
    phase: "AGORA",
    areaIds: ["working-capital", "receivables"],
    questionIds: [],
    finding:
      "O ciclo financeiro não é acompanhado e a cobrança também não é estruturada — o dinheiro das vendas demora a voltar para o caixa sem que a empresa tenha visibilidade de quanto capital de giro isso está consumindo.",
    recommendation:
      "Medir o prazo médio de recebimento e o ciclo financeiro juntos: reduzir a inadimplência é também uma alavanca direta de capital de giro.",
  },
  {
    id: "cross-planejamento-resultado",
    scope: "cross",
    condition: {
      op: "and",
      clauses: [
        { op: "areaScoreBelow", area: "planning", value: 41 },
        { op: "areaScoreBelow", area: "profitability", value: 41 },
      ],
    },
    priority: "CRITICA",
    phase: "AGORA",
    areaIds: ["planning", "profitability"],
    questionIds: [],
    finding:
      "Sem orçamento estruturado e sem DRE gerencial confiável, a empresa está tomando decisões financeiras sem referência de plano nem confirmação de resultado real — dois pilares de controle ausentes ao mesmo tempo.",
    recommendation:
      "Priorizar a reconstrução da DRE gerencial antes do orçamento: não adianta planejar metas sobre um resultado que ainda não é confiável.",
  },
  {
    id: "cross-tecnologia-base",
    scope: "cross",
    condition: {
      op: "and",
      clauses: [
        { op: "areaScoreBelow", area: "technology", value: 41 },
        {
          op: "or",
          clauses: [
            { op: "areaScoreBelow", area: "cash", value: 41 },
            { op: "areaScoreBelow", area: "profitability", value: 41 },
          ],
        },
      ],
    },
    priority: "ALTA",
    phase: "AGORA",
    areaIds: ["technology", "cash", "profitability"],
    questionIds: [],
    finding:
      "A base de dados financeiros (sistema, integrações, qualidade da informação) é frágil, o que compromete a confiabilidade de qualquer número reportado sobre caixa ou resultado.",
    recommendation:
      "Tratar a estruturação do sistema de gestão como pré-requisito: os demais controles financeiros só serão confiáveis se a base de dados for confiável primeiro.",
  },
  {
    id: "cross-governanca-pagamentos",
    scope: "cross",
    condition: {
      op: "and",
      clauses: [
        { op: "areaScoreBelow", area: "governance", value: 41 },
        { op: "areaScoreBelow", area: "payables", value: 41 },
      ],
    },
    priority: "ALTA",
    phase: "AGORA",
    areaIds: ["governance", "payables"],
    questionIds: [],
    finding:
      "Sem papéis e alçadas definidos, e sem conferência formal de pagamentos, a empresa está exposta a erros, fraudes ou pagamentos indevidos sem camada de controle.",
    recommendation:
      "Implantar juntos a definição de alçadas de aprovação e a checagem obrigatória de dados antes de pagar — são a mesma frente de controle.",
  },
  {
    id: "cross-custos-giro",
    scope: "cross",
    condition: {
      op: "and",
      clauses: [
        { op: "areaScoreBelow", area: "costs", value: 41 },
        { op: "areaScoreBelow", area: "working-capital", value: 41 },
      ],
    },
    priority: "ALTA",
    phase: "CURTO",
    areaIds: ["costs", "working-capital"],
    questionIds: [],
    finding:
      "Margens mal calculadas combinadas com estoque/ciclo financeiro fora de controle sugerem que o crescimento de vendas pode estar consumindo caixa e ainda vendendo com margem inadequada.",
    recommendation:
      "Revisar simultaneamente a formação de preço e a necessidade de capital de giro antes de qualquer novo esforço comercial de crescimento.",
  },
  {
    id: "cross-endividamento-planejamento-oportunidade",
    scope: "cross",
    condition: {
      op: "and",
      clauses: [
        { op: "areaScoreAtLeast", area: "debt", value: 61 },
        { op: "areaScoreBelow", area: "planning", value: 41 },
      ],
    },
    priority: "OPORTUNIDADE",
    phase: "MEDIO",
    areaIds: ["debt", "planning"],
    questionIds: [],
    finding:
      "A empresa tem a dívida relativamente sob controle, mas decisões de investimento futuras ainda não passam por um planejamento orçamentário estruturado — há espaço para usar a capacidade de crédito de forma mais estratégica.",
    recommendation:
      "Aproveitar o bom controle de endividamento para estruturar um orçamento anual que oriente o uso futuro de capital de terceiros.",
  },
  {
    id: "cross-recebiveis-resultado-oportunidade",
    scope: "cross",
    condition: {
      op: "and",
      clauses: [
        { op: "areaScoreAtLeast", area: "receivables", value: 61 },
        { op: "areaScoreAtLeast", area: "profitability", value: 61 },
      ],
    },
    priority: "OPORTUNIDADE",
    phase: "MEDIO",
    areaIds: ["receivables", "profitability"],
    questionIds: [],
    finding:
      "A empresa já tem boa gestão de recebíveis e de resultado — combinação que favorece decisões de crescimento com mais segurança de margem e de caixa.",
    recommendation:
      "Usar a boa maturidade em recebíveis e resultado como base para avaliar expansão de vendas a prazo ou novos canais com mais segurança de margem.",
  },
  {
    id: "cross-tecnologia-planejamento-oportunidade",
    scope: "cross",
    condition: {
      op: "and",
      clauses: [
        { op: "areaScoreAtLeast", area: "technology", value: 61 },
        { op: "areaScoreBelow", area: "planning", value: 41 },
      ],
    },
    priority: "OPORTUNIDADE",
    phase: "CURTO",
    areaIds: ["technology", "planning"],
    questionIds: [],
    finding:
      "O sistema de gestão já está relativamente maduro, mas ainda não é usado para gerar um painel de indicadores ou orçamento estruturado — a base de dados existe, falta transformá-la em plano.",
    recommendation:
      "Aproveitar os dados já disponíveis no sistema para montar rapidamente um painel de indicadores e um esboço de orçamento anual.",
  },
  {
    id: "cross-unidades-giro",
    scope: "cross",
    condition: {
      op: "and",
      clauses: [
        { op: "profileFieldAbove", field: "units", value: 1 },
        { op: "areaScoreBelow", area: "working-capital", value: 41 },
      ],
    },
    priority: "ALTA",
    phase: "AGORA",
    areaIds: ["working-capital"],
    questionIds: [],
    finding:
      "A empresa opera múltiplas unidades/CNPJs sem cálculo estruturado de capital de giro — a complexidade operacional pode estar ampliando um problema de caixa já existente.",
    recommendation:
      "Calcular a necessidade de capital de giro por unidade/CNPJ separadamente antes de consolidar, para identificar onde o caixa está realmente sendo consumido.",
  },
];

export const diagnosticRules: DiagnosticRule[] = [
  ...buildAreaBandRules(),
  ...buildCriticalQuestionRules(),
  ...CROSS_RULES,
];
