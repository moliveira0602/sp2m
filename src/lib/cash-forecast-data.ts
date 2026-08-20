export type Horizon = 30 | 90 | 180;

export interface ForecastPoint {
  date: string;
  balance: number;
  safety: number;
  variation: number;
}

export interface ForecastScenario {
  projectedBalance: number;
  operatingMargin: number;
  balanceChangePct: number;
  insight: string;
  series: ForecastPoint[];
}

const MONTHS_PT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

// Fixed anchor date so the demo timeline is stable across renders/SSR.
const BASE_DATE = new Date(2026, 0, 5);

function formatDate(daysFromBase: number) {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + daysFromBase);
  return `${d.getDate()} ${MONTHS_PT[d.getMonth()]}`;
}

function buildSeries(
  rawBalances: number[],
  totalDays: number,
  safetyRatio = 0.74,
): ForecastPoint[] {
  const step = totalDays / (rawBalances.length - 1);

  return rawBalances.map((balance, i) => {
    const prev = i > 0 ? rawBalances[i - 1] : balance;
    const variation = prev ? ((balance - prev) / prev) * 100 : 0;
    const safety = Math.round(rawBalances[0] * safetyRatio + i * (balance * 0.012));

    return {
      date: formatDate(Math.round(i * step)),
      balance,
      safety,
      variation: Math.round(variation * 10) / 10,
    };
  });
}

// Demonstration data only — structured so it can later be swapped for a live
// feed (API, ERP, Power BI, Supabase, etc.) without touching the component.
export const forecastData: Record<Horizon, ForecastScenario> = {
  30: {
    projectedBalance: 284750,
    operatingMargin: 18.4,
    balanceChangePct: 6.4,
    insight: "O caixa mantém estabilidade no curto prazo, com tendência positiva.",
    series: buildSeries(
      [230000, 242000, 238500, 251000, 246800, 260500, 255000, 268000, 275500, 284750],
      30,
    ),
  },
  90: {
    projectedBalance: 347920,
    operatingMargin: 24.7,
    balanceChangePct: 9.1,
    insight: "A projeção indica ganho gradual de eficiência operacional.",
    series: buildSeries(
      [245000, 268000, 259000, 285000, 277500, 301000, 293000, 318000, 331500, 347920],
      90,
    ),
  },
  180: {
    projectedBalance: 428600,
    operatingMargin: 32.0,
    balanceChangePct: 12.8,
    insight: "O cenário projetado mantém a operação acima da margem de segurança.",
    series: buildSeries(
      [245000, 270000, 261000, 295000, 288000, 312000, 305000, 340000, 330000, 362000, 395000, 428600],
      180,
    ),
  },
};
