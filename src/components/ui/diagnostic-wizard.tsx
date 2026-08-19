import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Gauge,
  Loader2,
  Search,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { sendDiagnosticFull } from "@/lib/api/diagnostic-full";
import {
  diagnosticAreas,
  scaleOptions,
  totalQuestions,
  emptyDiagnosticProfile,
  type DiagnosticProfile,
  type DiagnosticAnswers,
} from "@/lib/diagnostic-questions";

type Step = "profile" | "assessment" | "success";
type CnpjLookupStatus = "idle" | "loading" | "done" | "error";

const inputClass =
  "w-full h-[42px] rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-navy-deep placeholder:text-muted-foreground/70 transition-colors focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";
const selectClass = `${inputClass} appearance-none pr-9 cursor-pointer`;

function formatCnpj(rawValue: string) {
  const digits = rawValue.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

interface BrasilApiCnpj {
  razao_social?: string;
  nome_fantasia?: string;
  cnae_fiscal_descricao?: string;
  municipio?: string;
  uf?: string;
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className || ""}`}>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label} {required && <b className="text-gold">*</b>}
      </span>
      {children}
    </label>
  );
}

export function DiagnosticWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("profile");
  const [profile, setProfile] = useState<DiagnosticProfile>(
    emptyDiagnosticProfile,
  );
  const [answers, setAnswers] = useState<DiagnosticAnswers>({});
  const [areaIndex, setAreaIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cnpjStatus, setCnpjStatus] = useState<CnpjLookupStatus>("idle");
  const [result, setResult] = useState<{
    overallScore: number;
    protocol: string;
  } | null>(null);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-diagnostic", handleOpen);
    return () => window.removeEventListener("open-diagnostic", handleOpen);
  }, []);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const overallProgress = Math.round((answeredCount / totalQuestions) * 100);
  const area = diagnosticAreas[areaIndex];
  const areaAnsweredCount = area.questions.filter(
    (q) => answers[q.id] !== undefined,
  ).length;

  function updateProfile<K extends keyof DiagnosticProfile>(
    field: K,
    value: DiagnosticProfile[K],
  ) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function updateAnswer(id: string, value: number | "na") {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleCnpjChange(rawValue: string) {
    const formatted = formatCnpj(rawValue);
    updateProfile("cnpj", formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length !== 14) {
      setCnpjStatus("idle");
      return;
    }

    setCnpjStatus("loading");
    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
      );
      if (!response.ok) throw new Error("CNPJ não encontrado");
      const data: BrasilApiCnpj = await response.json();

      setProfile((prev) => ({
        ...prev,
        company:
          data.nome_fantasia?.trim() || data.razao_social || prev.company,
        segment: data.cnae_fiscal_descricao || prev.segment,
        city: data.municipio || prev.city,
        state: data.uf || prev.state,
      }));
      setCnpjStatus("done");
    } catch (err) {
      console.error("Erro ao consultar CNPJ:", err);
      setCnpjStatus("error");
    }
  }

  function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setStep("assessment");
  }

  function goToArea(index: number) {
    setAreaIndex(index);
    setMessage("");
  }

  function goNext() {
    if (areaAnsweredCount < area.questions.length) {
      setMessage(
        `Responda às ${area.questions.length - areaAnsweredCount} questão(ões) pendente(s) ou marque "Não se aplica".`,
      );
      return;
    }
    setMessage("");
    setAreaIndex((i) => Math.min(i + 1, diagnosticAreas.length - 1));
  }

  function goPrev() {
    setMessage("");
    if (areaIndex === 0) {
      setStep("profile");
      return;
    }
    setAreaIndex((i) => i - 1);
  }

  async function handleFinalSubmit() {
    const pendingAreaIndex = diagnosticAreas.findIndex((a) =>
      a.questions.some((q) => answers[q.id] === undefined),
    );
    if (pendingAreaIndex >= 0) {
      setAreaIndex(pendingAreaIndex);
      setMessage(
        `Ainda existem ${totalQuestions - answeredCount} questão(ões) pendente(s). Complete a avaliação para gerar um diagnóstico confiável.`,
      );
      return;
    }
    if (!profile.consent) {
      setMessage(
        "Volte aos dados da empresa e marque a autorização de envio das informações à SP2M.",
      );
      return;
    }

    setSubmitting(true);
    setMessage("");
    const protocol = `SP2M-${Date.now().toString(36).toUpperCase()}`;

    try {
      const response = await sendDiagnosticFull({
        data: { profile: { ...profile, consent: true }, answers, protocol },
      });
      setResult({
        overallScore:
          "overallScore" in response ? (response.overallScore ?? 0) : 0,
        protocol,
      });
      setStep("success");
    } catch (err) {
      console.error("Erro ao enviar diagnóstico completo:", err);
      setMessage(
        "Não foi possível enviar o diagnóstico. Tente novamente ou fale conosco no WhatsApp.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetAndClose() {
    setOpen(false);
    setTimeout(() => {
      setStep("profile");
      setProfile(emptyDiagnosticProfile);
      setAnswers({});
      setAreaIndex(0);
      setMessage("");
      setResult(null);
      setCnpjStatus("idle");
    }, 300);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir diagnóstico financeiro"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 h-14 w-14 rounded-full bg-navy-deep border border-gold/30 text-gold flex items-center justify-center shadow-[0_8px_32px_rgba(218,158,63,0.25)] hover:shadow-[0_8px_32px_rgba(218,158,63,0.4)] hover:scale-105 active:scale-95 transition-all duration-300"
      >
        <Gauge className="h-6 w-6" />
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : resetAndClose())}
      >
        <DialogContent className="max-w-none w-[95vw] sm:w-[720px] max-h-[88vh] p-0 gap-0 overflow-hidden rounded-2xl border border-border bg-background font-sans [&>button]:text-white [&>button]:opacity-80 [&>button:hover]:opacity-100">
          <div className="flex max-h-[88vh] flex-col">
            {/* Header */}
            <div className="shrink-0 bg-navy-deep px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">
                    Diagnóstico Financeiro · SP2M
                  </p>
                  <h3 className="font-display text-lg text-white">
                    {step === "profile" && "Vamos conhecer a sua empresa"}
                    {step === "assessment" &&
                      `Área ${area.number} de 10 · ${area.title}`}
                    {step === "success" && "Diagnóstico recebido"}
                  </h3>
                </div>
                {step === "assessment" && (
                  <span className="hidden sm:inline text-sm text-gold font-semibold">
                    {overallProgress}%
                  </span>
                )}
              </div>
              {step === "assessment" && (
                <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gold transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {step === "profile" && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Esses dados personalizam a leitura executiva e não alteram a
                    pontuação. Em seguida você responderá 80 questões objetivas
                    em 10 áreas (12–18 minutos).
                  </p>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-gold">
                      01 · Identificação
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="CNPJ" className="sm:col-span-2">
                        <div className="relative">
                          <input
                            value={profile.cnpj}
                            onChange={(e) => handleCnpjChange(e.target.value)}
                            placeholder="00.000.000/0000-00"
                            inputMode="numeric"
                            className={`${inputClass} pr-9`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2">
                            {cnpjStatus === "loading" && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {cnpjStatus === "done" && (
                              <Check className="h-4 w-4 text-emerald-600" />
                            )}
                            {cnpjStatus === "idle" && (
                              <Search className="h-4 w-4 text-muted-foreground/50" />
                            )}
                          </span>
                        </div>
                        {cnpjStatus === "done" && (
                          <span className="text-xs text-emerald-600">
                            Dados da empresa preenchidos automaticamente.
                          </span>
                        )}
                        {cnpjStatus === "error" && (
                          <span className="text-xs text-destructive">
                            CNPJ não encontrado. Preencha os dados manualmente.
                          </span>
                        )}
                      </Field>
                      <Field label="Empresa" required className="sm:col-span-2">
                        <input
                          required
                          value={profile.company}
                          onChange={(e) =>
                            updateProfile("company", e.target.value)
                          }
                          placeholder="Razão social ou nome fantasia"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Segmento" required>
                        <input
                          required
                          value={profile.segment}
                          onChange={(e) =>
                            updateProfile("segment", e.target.value)
                          }
                          placeholder="Ex.: Indústria têxtil"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Responsável" required>
                        <input
                          required
                          value={profile.contact}
                          onChange={(e) =>
                            updateProfile("contact", e.target.value)
                          }
                          placeholder="Nome completo"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Cargo">
                        <input
                          value={profile.role}
                          onChange={(e) =>
                            updateProfile("role", e.target.value)
                          }
                          placeholder="Ex.: Sócio(a), gerente"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="E-mail" required>
                        <input
                          required
                          type="email"
                          value={profile.email}
                          onChange={(e) =>
                            updateProfile("email", e.target.value)
                          }
                          placeholder="nome@empresa.com.br"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="WhatsApp" required>
                        <input
                          required
                          type="tel"
                          value={profile.whatsapp}
                          onChange={(e) =>
                            updateProfile("whatsapp", e.target.value)
                          }
                          placeholder="(00) 00000-0000"
                          inputMode="tel"
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-gold">
                      02 · Perfil operacional
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Faturamento mensal">
                        <div className="relative">
                          <select
                            value={profile.revenue}
                            onChange={(e) =>
                              updateProfile("revenue", e.target.value)
                            }
                            className={selectClass}
                          >
                            <option value="">Selecione uma faixa</option>
                            <option>Até R$ 100 mil</option>
                            <option>R$ 100 mil a R$ 500 mil</option>
                            <option>R$ 500 mil a R$ 1 milhão</option>
                            <option>R$ 1 milhão a R$ 5 milhões</option>
                            <option>Acima de R$ 5 milhões</option>
                            <option>Prefiro não informar</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </Field>
                      <Field label="Número de colaboradores">
                        <input
                          value={profile.employees}
                          onChange={(e) =>
                            updateProfile("employees", e.target.value)
                          }
                          placeholder="Ex.: 24"
                          inputMode="numeric"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Unidades / CNPJs">
                        <input
                          value={profile.units}
                          onChange={(e) =>
                            updateProfile("units", e.target.value)
                          }
                          placeholder="Ex.: 2"
                          inputMode="numeric"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Sistema de gestão">
                        <input
                          value={profile.system}
                          onChange={(e) =>
                            updateProfile("system", e.target.value)
                          }
                          placeholder="ERP, planilha ou outro"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Cidade">
                        <input
                          value={profile.city}
                          onChange={(e) =>
                            updateProfile("city", e.target.value)
                          }
                          placeholder="Cidade"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="UF">
                        <input
                          maxLength={2}
                          value={profile.state}
                          onChange={(e) =>
                            updateProfile("state", e.target.value.toUpperCase())
                          }
                          placeholder="PE"
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-lg border border-border bg-secondary/60 p-4">
                    <input
                      required
                      type="checkbox"
                      checked={profile.consent}
                      onChange={(e) =>
                        updateProfile("consent", e.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 accent-gold shrink-0"
                    />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-navy-deep">
                        Autorizo o envio das informações à SP2M.
                      </strong>{" "}
                      Concordo com o tratamento dos dados informados para
                      elaboração do diagnóstico financeiro, contato e
                      apresentação das recomendações, observados os princípios
                      da LGPD.
                    </span>
                  </label>

                  {message && (
                    <p
                      className="text-xs font-medium text-destructive"
                      role="alert"
                    >
                      {message}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-semibold text-navy-deep transition-all hover:bg-gold-soft hover:-translate-y-px"
                    >
                      Avançar para avaliação <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              )}

              {step === "assessment" && (
                <div className="space-y-5">
                  {/* Area nav */}
                  <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1">
                    {diagnosticAreas.map((a, i) => {
                      const done = a.questions.every(
                        (q) => answers[q.id] !== undefined,
                      );
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => goToArea(i)}
                          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                            i === areaIndex
                              ? "bg-gold text-navy-deep border-gold"
                              : done
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                                : "bg-secondary text-muted-foreground border-border hover:border-gold/40"
                          }`}
                        >
                          {done ? "✓" : a.number} {a.short}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {area.description}
                  </p>

                  {message && (
                    <p
                      className="text-xs font-medium text-destructive"
                      role="alert"
                    >
                      {message}
                    </p>
                  )}

                  <div className="space-y-4">
                    {area.questions.map((q, qi) => (
                      <fieldset
                        key={q.id}
                        className="rounded-xl border border-border p-4"
                      >
                        <legend className="mb-3 flex items-start gap-2 text-sm text-navy-deep font-medium px-1">
                          <span className="text-muted-foreground">
                            {String(qi + 1).padStart(2, "0")}
                          </span>
                          <span>
                            {q.text}{" "}
                            {q.critical && (
                              <span className="ml-1 inline-block rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold-soft align-middle">
                                Controle crítico
                              </span>
                            )}
                          </span>
                        </legend>
                        <div className="flex flex-wrap gap-1.5">
                          {scaleOptions.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              aria-pressed={answers[q.id] === opt.value}
                              onClick={() => updateAnswer(q.id, opt.value)}
                              title={opt.hint}
                              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs transition-colors ${
                                answers[q.id] === opt.value
                                  ? "bg-navy-deep text-white border-navy-deep"
                                  : "bg-white text-navy-deep border-border hover:border-gold/50"
                              }`}
                            >
                              <b>{opt.value}</b>
                              <span className="hidden sm:inline">
                                {opt.label}
                              </span>
                            </button>
                          ))}
                          <button
                            type="button"
                            aria-pressed={answers[q.id] === "na"}
                            onClick={() => updateAnswer(q.id, "na")}
                            className={`rounded-lg border px-2.5 py-2 text-xs transition-colors ${
                              answers[q.id] === "na"
                                ? "bg-muted-foreground text-white border-muted-foreground"
                                : "bg-white text-muted-foreground border-border hover:border-gold/50"
                            }`}
                          >
                            Não se aplica
                          </button>
                        </div>
                      </fieldset>
                    ))}
                  </div>
                </div>
              )}

              {step === "success" && result && (
                <div className="space-y-6 text-center py-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <Check className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Protocolo
                    </p>
                    <p className="font-display text-lg text-navy-deep">
                      {result.protocol}
                    </p>
                  </div>
                  <div className="mx-auto flex flex-col items-center">
                    <span className="font-display text-5xl text-gold">
                      {result.overallScore}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /100 — índice preliminar de maturidade
                    </span>
                  </div>
                  <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                    Suas respostas e dados foram enviados à SP2M e uma
                    confirmação já foi encaminhada para o seu e-mail. Nossa
                    equipe entrará em contato em até 24 horas úteis com a
                    análise executiva completa.
                  </p>
                  <a
                    href="https://wa.me/5581992781366"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-semibold text-navy-deep transition-all hover:bg-gold-soft hover:-translate-y-px"
                  >
                    Falar com a SP2M agora <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Footer actions */}
            {step === "assessment" && (
              <div className="shrink-0 flex items-center justify-between gap-3 border-t border-border px-6 py-4">
                <button
                  type="button"
                  onClick={goPrev}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-navy-deep transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Anterior
                </button>
                <span className="text-xs text-muted-foreground">
                  {areaAnsweredCount} de {area.questions.length} respondidas
                </span>
                {areaIndex < diagnosticAreas.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy-deep transition-all hover:bg-gold-soft"
                  >
                    Próxima área <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFinalSubmit}
                    className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy-deep transition-all hover:bg-gold-soft disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                      </>
                    ) : (
                      <>
                        Enviar diagnóstico à SP2M{" "}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
