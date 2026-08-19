export interface DiagnosticQuestion {
  id: string;
  text: string;
  critical: boolean;
}

export interface DiagnosticArea {
  id: string;
  number: string;
  title: string;
  short: string;
  description: string;
  questions: DiagnosticQuestion[];
}

function buildQuestions(prefix: string, texts: string[]): DiagnosticQuestion[] {
  return texts.map((text, i) => ({
    id: `${prefix}-${i + 1}`,
    text: text.startsWith("!") ? text.slice(1) : text,
    critical: text.startsWith("!"),
  }));
}

export const diagnosticAreas: DiagnosticArea[] = [
  {
    id: "governance",
    number: "01",
    title: "Governança e organização financeira",
    short: "Governança",
    description:
      "Responsabilidades, regras, documentos e disciplina da gestão.",
    questions: buildQuestions("gov", [
      "!Existe separação total entre as finanças da empresa e as finanças pessoais dos sócios?",
      "As responsabilidades de lançar, aprovar, pagar e conferir são formalmente definidas?",
      "Há política documentada para pagamentos, reembolsos, adiantamentos e uso de cartões?",
      "!Pró-labore e distribuição de lucros seguem regras e periodicidade previamente aprovadas?",
      "Os documentos financeiros são organizados, rastreáveis e acessíveis para conferência?",
      "A gestão realiza reunião financeira periódica com decisões e responsáveis registrados?",
      "Existem alçadas de aprovação proporcionais ao valor e ao tipo de despesa?",
      "Os sócios recebem informações financeiras padronizadas e confiáveis no prazo definido?",
    ]),
  },
  {
    id: "cash",
    number: "02",
    title: "Caixa, bancos e tesouraria",
    short: "Caixa",
    description:
      "Visibilidade diária, conciliação e previsibilidade de liquidez.",
    questions: buildQuestions("cash", [
      "!Todos os saldos de caixa, bancos, aplicações e meios de pagamento são conhecidos diariamente?",
      "!A conciliação bancária é realizada diariamente ou, no máximo, até o próximo dia útil?",
      "Transferências entre contas são identificadas sem serem tratadas como receita ou despesa?",
      "!A empresa mantém fluxo de caixa projetado por pelo menos 13 semanas?",
      "Entradas de cartões, Pix, boletos e marketplaces são conciliadas com as vendas?",
      "Há saldo mínimo de segurança ou reserva financeira formalmente definido?",
      "Necessidades e sobras de caixa são antecipadas e tratadas com plano específico?",
      "O caixa projetado é comparado ao realizado e os desvios são explicados?",
    ]),
  },
  {
    id: "receivables",
    number: "03",
    title: "Contas a receber e inadimplência",
    short: "Recebíveis",
    description: "Qualidade da receita, cobrança e prazo de recebimento.",
    questions: buildQuestions("rec", [
      "!Todas as vendas a prazo geram títulos com cliente, vencimento e condição corretos?",
      "A carteira a receber é conciliada com notas, contratos, boletos e adquirentes?",
      "A empresa acompanha diariamente títulos vencidos e a vencer?",
      "Existe uma régua de cobrança com prazos, canais e responsáveis definidos?",
      "!A inadimplência é medida por faixa de atraso e comparada a uma meta?",
      "Limites de crédito e condições de venda são definidos com critérios objetivos?",
      "Taxas, antecipações e prazos de cartões são conferidos antes da baixa?",
      "O prazo médio de recebimento é acompanhado e considerado nas decisões comerciais?",
    ]),
  },
  {
    id: "payables",
    number: "04",
    title: "Contas a pagar e compras",
    short: "Pagamentos",
    description:
      "Compromissos, aprovações, fornecedores e disciplina de compras.",
    questions: buildQuestions("pay", [
      "!Todas as obrigações são registradas com antecedência, inclusive impostos, folha e contratos?",
      "!Documentos, valores, dados bancários e aprovações são conferidos antes do pagamento?",
      "Existe programação semanal de pagamentos alinhada ao fluxo de caixa?",
      "Pagamentos em atraso, multas, juros e duplicidades são monitorados?",
      "Compras relevantes exigem cotação, negociação e aprovação por alçada?",
      "Os prazos negociados com fornecedores são compatíveis com o ciclo financeiro?",
      "Adiantamentos a fornecedores são baixados contra a entrega e a nota fiscal?",
      "A concentração de compras por fornecedor e o risco de dependência são avaliados?",
    ]),
  },
  {
    id: "profitability",
    number: "05",
    title: "DRE, resultado e rentabilidade",
    short: "Resultado",
    description: "Lucro real, qualidade do resultado e leitura gerencial.",
    questions: buildQuestions("dre", [
      "!A empresa fecha uma DRE gerencial mensal por regime adequado e sem misturar movimentações patrimoniais?",
      "!Receitas, custos, despesas, investimentos, empréstimos e retiradas são classificados corretamente?",
      "O fechamento mensal ocorre até D+5 ou em prazo formalmente definido?",
      "Margem bruta, margem de contribuição, resultado operacional e lucro líquido são analisados?",
      "A rentabilidade é conhecida por produto, serviço, unidade, canal ou cliente relevante?",
      "O resultado realizado é comparado ao orçamento e aos períodos anteriores?",
      "Eventos não recorrentes são separados para não distorcer o desempenho operacional?",
      "Os gestores conseguem explicar por que lucro e geração de caixa são diferentes?",
    ]),
  },
  {
    id: "costs",
    number: "06",
    title: "Custos, preços e margens",
    short: "Custos",
    description:
      "Formação de preço, margem de contribuição e ponto de equilíbrio.",
    questions: buildQuestions("cost", [
      "!Custos e despesas fixas e variáveis estão separados por critérios gerenciais consistentes?",
      "A ficha de custo dos principais produtos ou serviços está atualizada?",
      "!Preços consideram impostos, comissões, fretes, taxas, perdas e custo financeiro?",
      "A margem de contribuição é conhecida por produto, serviço ou canal?",
      "!O ponto de equilíbrio mensal é calculado e comparado ao faturamento real?",
      "Descontos comerciais respeitam limites mínimos de margem e aprovação?",
      "Reajustes de custos são incorporados aos preços com periodicidade definida?",
      "Itens com margem negativa ou baixa contribuição têm plano de correção?",
    ]),
  },
  {
    id: "working-capital",
    number: "07",
    title: "Capital de giro e estoques",
    short: "Capital de giro",
    description: "Recursos presos na operação, estoque e ciclo financeiro.",
    questions: buildQuestions("wc", [
      "!A necessidade de capital de giro é calculada e revisada periodicamente?",
      "Prazos médios de estoque, recebimento e pagamento são conhecidos?",
      "!O ciclo financeiro é acompanhado e há meta para sua redução?",
      "O estoque físico é conciliado com o sistema por inventários regulares?",
      "Giro, cobertura, ruptura, perdas e obsolescência de estoque são medidos?",
      "Compras e reposição consideram demanda, estoque disponível e caixa projetado?",
      "Produtos parados ou de baixo giro possuem plano de liquidação?",
      "O crescimento de vendas é avaliado quanto ao impacto no capital de giro?",
    ]),
  },
  {
    id: "debt",
    number: "08",
    title: "Endividamento e riscos financeiros",
    short: "Endividamento",
    description: "Dívidas, garantias, exposição e capacidade de pagamento.",
    questions: buildQuestions("debt", [
      "!Existe mapa completo de empréstimos, financiamentos, parcelamentos e garantias?",
      "Taxa efetiva, saldo, parcela, carência e vencimento de cada dívida são conhecidos?",
      "!O serviço da dívida é comparado à geração operacional de caixa?",
      "Antecipações, cheque especial e crédito emergencial são usados apenas de forma planejada?",
      "Tributos, encargos e fornecedores vencidos são incluídos no mapa de endividamento?",
      "A empresa simula cenários de queda de receita, juros e necessidade de caixa?",
      "Decisões de investir com capital próprio ou de terceiros usam análise comparativa?",
      "Riscos de fraude, concentração bancária e acessos financeiros possuem controles preventivos?",
    ]),
  },
  {
    id: "planning",
    number: "09",
    title: "Planejamento e gestão por indicadores",
    short: "Planejamento",
    description: "Metas, orçamento, cenários e rotina de decisão.",
    questions: buildQuestions("plan", [
      "!Existe orçamento anual detalhado por receitas, custos, despesas, investimentos e caixa?",
      "O orçamento é revisado por projeção contínua (forecast) ao longo do ano?",
      "Metas financeiras têm responsáveis, prazos e indicadores definidos?",
      "Há painel com poucos indicadores críticos, atualizados e usados nas decisões?",
      "!Desvios entre realizado e planejado geram análise de causa e ação corretiva?",
      "Cenários otimista, base e conservador orientam decisões relevantes?",
      "Projetos e investimentos passam por análise de retorno, risco e impacto no caixa?",
      "O planejamento financeiro está conectado às metas comerciais e operacionais?",
    ]),
  },
  {
    id: "technology",
    number: "10",
    title: "Tecnologia, processos e controles",
    short: "Processos",
    description:
      "Sistema, integração, qualidade de dados e continuidade operacional.",
    questions: buildQuestions("tech", [
      "!O sistema de gestão concentra contas a pagar, receber, caixa e classificação financeira?",
      "Cadastros, plano de contas e centros de resultado seguem padrão único?",
      "Integrações bancárias, fiscais e de vendas reduzem digitação e retrabalho?",
      "!A qualidade dos dados é conferida antes da emissão de relatórios gerenciais?",
      "!Acessos ao sistema e bancos seguem perfil, dupla autorização e revisão periódica?",
      "Os processos financeiros críticos possuem procedimentos escritos e atualizados?",
      "Há substituto treinado, rotina de backup e plano de continuidade para funções críticas?",
      "Indicadores de prazo, erro, retrabalho e produtividade orientam a melhoria do financeiro?",
    ]),
  },
];

export interface ScaleOption {
  value: number;
  label: string;
  hint: string;
}

export const scaleOptions: ScaleOption[] = [
  { value: 0, label: "Inexistente", hint: "Não existe" },
  { value: 1, label: "Informal", hint: "Raramente" },
  { value: 2, label: "Parcial", hint: "Irregular" },
  { value: 3, label: "Implantado", hint: "Frequente" },
  { value: 4, label: "Controlado", hint: "Documentado" },
  { value: 5, label: "Otimizado", hint: "Medido e melhorado" },
];

export const totalQuestions = diagnosticAreas.reduce(
  (sum, area) => sum + area.questions.length,
  0,
);

export interface DiagnosticProfile {
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
}

export const emptyDiagnosticProfile: DiagnosticProfile = {
  company: "",
  cnpj: "",
  contact: "",
  role: "",
  email: "",
  whatsapp: "",
  segment: "",
  revenue: "",
  employees: "",
  units: "1",
  city: "",
  state: "",
  system: "",
  consent: false,
};

export type DiagnosticAnswers = Record<string, number | "na">;
