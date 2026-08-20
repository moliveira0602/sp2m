export type Priority = "CRITICA" | "ALTA" | "MEDIA" | "OPORTUNIDADE";
export type FindingPriority = Priority | "FORTE";
export type PlanPhase = "AGORA" | "CURTO" | "MEDIO";

export type Classification =
  | "Crítico"
  | "Atenção elevada"
  | "Em desenvolvimento"
  | "Bom"
  | "Excelente";

export interface AreaScore {
  areaId: string;
  number: string;
  title: string;
  short: string;
  avg: number;
  score: number;
  classification: Classification;
}

export interface Finding {
  ruleId: string;
  scope: "area" | "critical-question" | "cross";
  priority: FindingPriority;
  areaIds: string[];
  questionIds: string[];
  text: string;
}

export interface Recommendation {
  ruleId: string;
  priority: Priority;
  phase: PlanPhase;
  areaIds: string[];
  text: string;
}

export interface PlanItem {
  phase: PlanPhase;
  action: string;
  priority: Priority;
  areaIds: string[];
  ruleId: string;
}

export interface AuditEntry {
  ruleId: string;
  scope: "area" | "critical-question" | "cross";
  areaIds: string[];
  questionIds: string[];
  priority: FindingPriority;
}

export interface DiagnosticResult {
  protocol: string;
  overallScore: number;
  classification: Classification;
  areaScores: AreaScore[];
  findings: Finding[];
  strengths: Finding[];
  attentionPoints: Finding[];
  risks: Finding[];
  opportunities: Finding[];
  recommendations: Recommendation[];
  actionPlan: Record<PlanPhase, PlanItem[]>;
  executiveSummary: string;
  executiveConclusion: string;
  auditTrail: AuditEntry[];
}

export interface ClientAreaScore {
  areaId: string;
  short: string;
  number: string;
  score: number;
}

export interface ClientSummary {
  protocol: string;
  overallScore: number;
  classification: Classification;
  areaScores: ClientAreaScore[];
  strengths: string[];
  attentionAreas: string[];
  message: string;
}
