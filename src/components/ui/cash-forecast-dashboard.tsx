import { useEffect, useRef, useState } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { forecastData, type ForecastPoint, type Horizon } from "@/lib/cash-forecast-data";

const HORIZONS: Horizon[] = [30, 90, 180];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function useCountUp(target: number, active: boolean, duration = 650) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (target - from) * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);

  return value;
}

function CashTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ForecastPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1526] px-3.5 py-2.5 shadow-xl">
      <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">{point.date} 2026</p>
      <p className="text-[10px] text-white/50">Saldo projetado</p>
      <p className="text-sm font-semibold text-white tabular-nums">{formatCurrency(point.balance)}</p>
      <p
        className={`text-[10px] font-medium mt-1 tabular-nums ${
          point.variation >= 0 ? "text-emerald-400" : "text-red-400"
        }`}
      >
        Variação {point.variation >= 0 ? "+" : ""}
        {formatPercent(point.variation)}
      </p>
    </div>
  );
}

export function CashForecastDashboard() {
  const [horizon, setHorizon] = useState<Horizon>(180);
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scenario = forecastData[horizon];
  const animatedBalance = useCountUp(scenario.projectedBalance, inView);
  const animatedMargin = useCountUp(scenario.operatingMargin, inView);

  return (
    <div ref={containerRef} className="w-full max-w-[400px] mx-auto lg:mx-0 relative">
      <div className="relative rounded-[20px] overflow-hidden border border-white/[0.07] shadow-[0_32px_64px_-16px_rgba(3,13,30,0.45)] bg-[#030d1e]">
        {/* Subtle glow */}
        <div className="absolute top-0 right-1/4 -translate-y-1/2 w-48 h-12 bg-gold/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative p-5 sm:p-7 z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 sm:mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] text-white/50 font-semibold uppercase tracking-[0.2em]">
                BI & CFO ESTRATÉGICO
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Análise ativa
            </div>
          </div>

          {/* Title */}
          <p className="font-display font-light text-white leading-tight text-2xl mb-1">
            Previsibilidade de Caixa
          </p>
          <p className="text-xs text-white/50 mb-5">Inteligência financeira para antecipar decisões.</p>

          {/* Horizon selector */}
          <div className="inline-flex items-center rounded-full bg-white/[0.04] border border-white/[0.06] p-1 mb-6">
            {HORIZONS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(h)}
                className={`px-3 sm:px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ${
                  horizon === h ? "bg-gold text-navy-deep" : "text-white/50 hover:text-white/80"
                }`}
              >
                {h}D
              </button>
            ))}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Saldo projetado</p>
              <p className="text-lg sm:text-xl font-semibold text-white tabular-nums">
                {formatCurrency(Math.round(animatedBalance))}
              </p>
              <p className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1 tabular-nums">
                <ArrowUpRight className="h-3 w-3 shrink-0" />
                {formatPercent(scenario.balanceChangePct)} no período
              </p>
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Margem operacional</p>
              <p className="text-lg sm:text-xl font-semibold text-gold tabular-nums">
                {formatPercent(animatedMargin)}
              </p>
              <p className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 shrink-0" /> Eficiência operacional
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="relative rounded-xl bg-white/[0.02] border border-white/5 p-3 mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-white/40 uppercase tracking-wider">Saldo de caixa projetado</span>
              <span className="text-[9px] text-white/25">Dados demonstrativos</span>
            </div>
            <div className="h-28 sm:h-32 -mx-1">
              {inView && (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={scenario.series} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                    <defs>
                      <linearGradient id="cashGoldFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis hide domain={["dataMin - 20000", "dataMax + 20000"]} />
                    <Tooltip
                      content={<CashTooltip />}
                      cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="safety"
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth={1}
                      strokeDasharray="3 4"
                      dot={false}
                      isAnimationActive
                      animationDuration={900}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="var(--gold)"
                      strokeWidth={2}
                      fill="url(#cashGoldFill)"
                      dot={false}
                      activeDot={{ r: 3.5, fill: "var(--gold)", stroke: "#030d1e", strokeWidth: 2 }}
                      isAnimationActive
                      animationDuration={900}
                      animationEasing="ease-out"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Safety indicator */}
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Dentro da faixa de segurança
          </div>

          {/* Insight */}
          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="text-[9px] text-gold font-semibold uppercase tracking-[0.2em]">Insight SP2M</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">{scenario.insight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
