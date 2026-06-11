import React from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';

export const YieldCard = () => {
  return (
    <div className="max-w-[400px] w-full mx-auto relative">
      
      {/* Premium Solid Dark Card Container (Acessibilidade e Contraste Máximo) */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_32px_64px_-16px_rgba(3,13,30,0.45)] bg-[#030d1e]">
        
        {/* Subtle Glow behind the card */}
        <div className="absolute top-0 right-1/4 -translate-y-1/2 w-48 h-12 bg-[#da9e3f]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Content Layer */}
        <div className="relative p-8 z-10">

          {/* Card Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-white/50 font-semibold uppercase tracking-[0.2em]">
                BI & CFO ESTRATÉGICO
              </span>
            </div>
            <div className="text-[11px] text-[#da9e3f] font-medium bg-[#da9e3f]/10 px-2.5 py-0.5 rounded-full">
              Painel Executivo
            </div>
          </div>

          {/* Card Title */}
          <p className="font-display font-light text-white leading-tight text-3xl mb-3">
            Previsibilidade de Caixa
          </p>
          
          {/* Card Description */}
          <p className="text-sm leading-relaxed text-white/70 mb-6">
            Inteligência de dados integrada a uma assessoria financeira contínua, operada por diretores de finanças dedicados.
          </p>

          {/* Metrics Section */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 transition-all duration-300 hover:bg-white/[0.06]">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Horizonte</p>
              <p className="text-2xl font-semibold text-white">180 dias</p>
              <p className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Seguro e planejado
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 transition-all duration-300 hover:bg-white/[0.06]">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Margem Operacional</p>
              <p className="text-2xl font-semibold text-[#da9e3f]">+32%</p>
              <p className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Eficiência de BI
              </p>
            </div>
          </div>

          {/* Mini Sparkline Chart */}
          <div className="h-16 relative rounded-xl bg-white/[0.02] border border-white/5 p-3 overflow-hidden">
            <div className="absolute top-2 left-3 flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-[#da9e3f]" />
              <span className="text-[9px] text-white/40 uppercase tracking-wider">Crescimento Patrimonial</span>
            </div>
            <svg
              viewBox="0 0 300 40"
              className="w-full h-full pt-4"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="goldGradientGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#da9e3f" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#da9e3f" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,36 L40,30 L85,32 L130,20 L175,24 L220,12 L265,15 L300,5 L300,40 L0,40 Z"
                fill="url(#goldGradientGlow)"
              />
              <polyline
                points="0,36 40,30 85,32 130,20 175,24 220,12 265,15 300,5"
                fill="none"
                stroke="#da9e3f"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

        </div>
      </div>
    </div>
  );
};
