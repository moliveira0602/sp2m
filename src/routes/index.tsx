import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { YieldCard } from "@/components/ui/yield-card";
import { DiagnosticWizard } from "@/components/ui/diagnostic-wizard";
import { sendDiagnostic } from "@/lib/api/diagnostic";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}
import logoForDark from "@/assets/logo-dark.png";
import logoForLight from "@/assets/logo-light.png";
import t1Img from "@/assets/testimonial-1.webp";
import t2Img from "@/assets/testimonial-2.webp";
import t3Img from "@/assets/testimonial-3.webp";
import techBiImg from "@/assets/tech-bi.webp";
import {
  ArrowRight,
  ArrowUp,
  BarChart3,
  Building2,
  CheckCircle2,
  Compass,
  Gauge,
  LineChart,
  Mail,
  MessageCircle,
  Instagram,
  Phone,
  TrendingUp,
  Wallet,
  Eye,
  Handshake,
  Lock,
  Target,
  Award,
  Activity,
  Menu,
  X,
  ChevronDown,
  ArrowUpRight,
  AlertTriangle,
  FileText,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    title: "SP2M Inteligência Empresarial — BPO Financeiro & CFO sob Demanda",
    meta: [
      {
        name: "description",
        content:
          "BPO Financeiro, Assessoria Estratégica, Diretoria Financeira (CFO) sob Demanda e Inteligência de Negócios (BI) para PMEs. Transformamos suas finanças em uma vantagem competitiva real.",
      },
      {
        name: "keywords",
        content:
          "BPO Financeiro Recife, BPO Financeiro Caruaru, BPO Financeiro Pernambuco, CFO sob Demanda Recife, CFO sob Demanda Caruaru, Consultoria Financeira Recife, Consultoria Financeira Caruaru, Terceirização Financeira Recife, Terceirização Financeira Caruaru, Gestão Financeira PMEs PE, BI Financeiro Recife, Inteligência Empresarial Pernambuco, SP2M, finanças Caruaru, finanças Recife",
      },
      { property: "og:title", content: "SP2M Inteligência Empresarial — BPO Financeiro & CFO sob Demanda" },
      {
        property: "og:description",
        content:
          "Terceirização Financeira (BPO), Assessoria Estratégica e CFO sob Demanda. Transformando dados financeiros em decisões para impulsionar o crescimento de PMEs.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sp2mgestao.com.br/" },
      { name: "twitter:title", content: "SP2M Inteligência Empresarial — BPO Financeiro & CFO sob Demanda" },
      {
        name: "twitter:description",
        content:
          "BPO Financeiro, Assessoria Estratégica e CFO sob Demanda para empresas que recusam crescer no improviso.",
      },
    ],
    links: [
      { rel: "canonical", href: "/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,300;9..144,0,400;9..144,1,300;9..144,1,400&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  component: Home,
});

// ─── DATA ────────────────────────────────────────────────────────────────────

const challenges = [
  { icon: TrendingUp, title: "Falta de previsibilidade financeira", text: "Decisões tomadas no improviso, sem visão de caixa futuro." },
  { icon: Gauge, title: "Ausência de indicadores claros", text: "Sem KPIs definidos, é impossível medir e evoluir com método." },
  { icon: Compass, title: "Crescimento sem planejamento", text: "Expansão que compromete a saúde financeira da operação." },
  { icon: Wallet, title: "Problemas de fluxo de caixa", text: "Operação sufocada por descompassos financeiros recorrentes." },
  { icon: AlertTriangle, title: "Risco fiscal e tributário", text: "Obrigações mal geridas expõem a empresa a penalidades sérias." },
  { icon: LineChart, title: "Dados dispersos, sem inteligência", text: "Informações que existem mas não se transformam em estratégia." },
];

const solutions = [
  {
    tier: "INICIAL",
    num: "01",
    name: "SP2M Inicial",
    desc: "Organização financeira sólida para empresas em fase de estruturação e formalização.",
    range: "Faturamento até R$ 100 mil/mês",
    cta: "Começar com o Inicial",
    features: [
      "Estruturação do plano de contas",
      "Organização do fluxo de caixa inicial",
      "Formalização de rotinas financeiras",
      "Diagnóstico de gargalos operacionais",
    ],
  },
  {
    tier: "ESSENCIAL",
    num: "02",
    name: "SP2M Essencial",
    desc: "BPO Financeiro completo, com rotinas profissionalizadas e relatórios gerenciais.",
    range: "R$ 100 mil a R$ 500 mil/mês",
    cta: "Explorar o Essencial",
    features: [
      "Gestão de Contas a Pagar e Receber",
      "Conciliação bancária e emissão de notas",
      "Fluxo de caixa e DRE gerencial",
      "Equipe de analistas dedicados",
    ],
  },
  {
    tier: "CRESCIMENTO",
    num: "03",
    name: "SP2M Crescimento",
    desc: "BPO Financeiro + Assessoria estratégica para escalar com método e previsibilidade.",
    range: "R$ 500 mil a R$ 2 milhões/mês",
    cta: "Crescer com o Crescimento",
    features: [
      "Tudo do Essencial + Assessoria",
      "Reuniões mensais com consultor sênior",
      "Definição de KPIs e metas financeiras",
      "Planejamento e controle orçamentário",
    ],
  },
  {
    tier: "EXECUTIVO",
    num: "04",
    name: "SP2M Executivo",
    desc: "Diretoria Financeira (CFO) sob Demanda completa: estratégia financeira de alta performance executiva.",
    range: "Acima de R$ 2 milhões/mês",
    cta: "Falar sobre o Executivo",
    highlight: true,
    features: [
      "Tudo do Crescimento + CFO Dedicado",
      "Análise de viabilidade e investimentos",
      "Planejamento estratégico de longo prazo",
      "Governança e preparação para M&A",
    ],
  },
];

const resultados = [
  { value: "−40%", label: "Tempo de fechamento", sub: "financeiro e contábil" },
  { value: "+25%", label: "Previsibilidade de caixa", sub: "nos primeiros 6 meses" },
  { value: "3×", label: "Retorno sobre investimento (ROI)", sub: "médio no primeiro ano de parceria" },
  { value: "97", label: "Índice de satisfação (NPS)", sub: "dos clientes ativos" },
];

const commitments = [
  { icon: Eye, label: "Transparência", text: "Clareza absoluta em processos, números e entregas em cada etapa." },
  { icon: Handshake, label: "Proximidade", text: "Relacionamento consultivo e presente, não apenas à distância." },
  { icon: Lock, label: "Confidencialidade", text: "Sigilo rigoroso sobre dados financeiros e estratégias do cliente." },
  { icon: Target, label: "Comprometimento", text: "Totalmente engajados com os resultados do seu negócio." },
  { icon: Award, label: "Excelência", text: "Padrão elevado em método, técnica e qualidade de entrega." },
  { icon: TrendingUp, label: "Evolução contínua", text: "Aprimoramento constante de práticas, ferramentas e processos." },
];

const techItems = [
  { icon: BarChart3, t: "Implantação de automação financeira" },
  { icon: LineChart, t: "Construção de painéis executivos" },
  { icon: Activity, t: "Estruturação de Inteligência de Negócios (BI)" },
  { icon: Building2, t: "Integração bancária completa" },
  { icon: Gauge, t: "Definição de KPIs e indicadores" },
  { icon: FileText, t: "Entrega de relatórios gerenciais" },
];

const sectors = [
  "Tecnologia", "Varejo", "Saúde", "Construção Civil",
  "Serviços", "Agronegócio", "Indústria", "E-commerce",
];

// NOTA: Substitua pelas fotos e depoimentos reais dos seus clientes
const testimonials = [
  {
    img: t1Img,
    quote:
      "A SP2M transformou completamente a nossa gestão financeira. Em 6 meses, tínhamos visibilidade total do fluxo de caixa e passamos a tomar decisões com segurança e dados concretos.",
    name: "Carlos Menezes",
    role: "Diretor Executivo",
    company: "Grupo Tecnologia",
    sector: "Tecnologia",
  },
  {
    img: t2Img,
    quote:
      "Trabalhar com a equipe da SP2M é como ter um CFO de alto nível dedicado ao negócio. O nível de análise estratégica e o comprometimento com os resultados são verdadeiramente excepcionais.",
    name: "Ana Rodrigues",
    role: "Diretora Financeira",
    company: "Rede Saúde Premium",
    sector: "Saúde",
  },
  {
    img: t3Img,
    quote:
      "Antes da SP2M, crescíamos no improviso. Hoje crescemos com previsibilidade e inteligência. Essa mudança de mentalidade foi o maior ganho de toda a parceria.",
    name: "Rafael Costa",
    role: "Fundador e Diretor Executivo",
    company: "Costa Varejo",
    sector: "Varejo",
  },
];

// ─── HOOKS ───────────────────────────────────────────────────────────────────

function useReveal() {
  useEffect(() => {
    const els = gsap.utils.toArray(".reveal");
    if (!els.length) return;

    const ctx = gsap.context(() => {
      els.forEach((el: any) => {
        let delay = 0;
        const delayClass = Array.from(el.classList).find((c: any) => c.startsWith('reveal-delay-')) as string | undefined;
        if (delayClass) {
          const match = delayClass.match(/\d+/);
          if (match) {
            delay = parseInt(match[0], 10) * 0.1;
          }
        }

        gsap.fromTo(el, 
          { opacity: 0, y: 30, filter: "blur(4px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.8,
            delay: delay,
            ease: "power2.out",
            onComplete: () => {
              el.classList.add("revealed");
            },
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none"
            }
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

// ─── LOGO COMPONENT ──────────────────────────────────────────────────────────

function Logo({
  variant = "light",
  className = "h-16",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  // variant="light" → usa versão branca/gold (para fundos escuros: Navbar, Footer)
  // variant="dark"  → usa versão navy/gold  (para fundos claros)
  return (
    <img
      src={variant === "light" ? logoForDark : logoForLight}
      alt="SP2M Inteligência Empresarial"
      width={160}
      height={64}
      className={`w-auto object-contain ${className} ${
        variant === "light"
          ? "mix-blend-mode-screen brightness-110"
          : ""
      }`}
      style={
        variant === "light"
          ? { mixBlendMode: "screen" as const, filter: "brightness(1.15)" }
          : {}
      }
      loading="eager"
    />
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    ["#quem-somos", "Quem somos"],
    ["#solucoes", "Soluções"],
    ["#tecnologia", "Tecnologia"],
    ["#resultados", "Resultados"],
    ["#contato", "Contato"],
  ] as const;

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-500 flex flex-col"
      style={scrolled ? { transform: "translateY(-36px)" } : {}}
    >
      {/* Topbar */}
      <div className="bg-navy-950 text-white/70 border-b border-white/5 text-[10px] sm:text-xs py-2 px-4 h-9 flex items-center">
        <div className="container-px max-w-7xl mx-auto w-full flex justify-between items-center gap-2">
          <a
            href="mailto:contato@sp2mgestao.com.br"
            className="flex items-center gap-1.5 hover:text-gold transition-colors font-medium truncate"
          >
            <Mail className="h-3.5 w-3.5 text-gold/85 shrink-0" />
            <span className="truncate">contato@sp2mgestao.com.br</span>
          </a>
          <a
            href="https://wa.me/5581992781366"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-gold transition-colors font-medium shrink-0"
          >
            <Phone className="h-3.5 w-3.5 text-gold/85 shrink-0" />
            <span>(81) 99278-1366</span>
          </a>
        </div>
      </div>

      {/* Main Nav Container */}
      <div
        className={`w-full transition-all duration-500 ${
          scrolled ? "nav-scrolled" : "bg-transparent"
        }`}
      >
        <nav className="container-px max-w-7xl mx-auto flex items-center justify-between h-20">
          {/* Logotipo */}
          <a href="#top" className="hover:opacity-80 transition-opacity duration-300">
            <Logo variant="dark" />
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8 text-sm">
            {navLinks.map(([href, label]) => (
              <a key={href} href={href} className="nav-link">
                {label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <a
            href="#contato"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("open-diagnostic"));
            }}
            className="hidden md:inline-flex items-center gap-2 text-sm text-navy-deep bg-gold hover:bg-gold-soft transition-all duration-300 px-5 py-2.5 rounded-full font-semibold shadow-[var(--glow-gold-sm)] hover:shadow-[var(--glow-gold-md)] hover:-translate-y-px"
          >
            Diagnóstico gratuito <ArrowRight className="h-3.5 w-3.5" />
          </a>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-navy-deep p-2 hover:text-gold transition-colors"
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* Mobile menu (Transição rápida e fluida com Framer Motion) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden border-t border-border overflow-hidden"
              style={{ background: "oklch(0.985 0.002 255 / 0.97)", backdropFilter: "blur(20px)" }}
            >
              <div className="container-px py-6 flex flex-col gap-5">
                {navLinks.map(([href, label]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className="text-navy-deep/80 hover:text-gold transition-colors text-sm font-medium"
                  >
                    {label}
                  </a>
                ))}
                <a
                  href="#contato"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    window.dispatchEvent(new CustomEvent("open-diagnostic"));
                  }}
                  className="inline-flex items-center gap-2 bg-gold text-navy-deep px-5 py-3 rounded-full font-semibold w-fit text-sm mt-2"
                >
                  Diagnóstico gratuito <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      className={`fixed bottom-[88px] sm:bottom-24 right-4 sm:right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-[#030d1e]/90 text-gold shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-gold hover:text-navy-deep hover:border-gold group ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
    </button>
  );
}

function SectionTitle({
  eyebrow,
  title,
  sub,
  light,
  centered,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  light?: boolean;
  centered?: boolean;
}) {
  return (
    <div className={`max-w-3xl reveal ${centered ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <div
          className={`flex items-center gap-3 text-xs uppercase tracking-[0.25em] mb-5 ${
            light ? "text-gold" : "text-navy/60"
          } ${centered ? "justify-center" : ""}`}
        >
          {!centered && <span className="h-px w-8 bg-gold animate-line" />}
          {eyebrow}
          {centered && <span className="h-px w-8 bg-gold animate-line" />}
        </div>
      )}
      <h2
        className={`text-4xl md:text-5xl leading-[1.08] ${
          light ? "text-white" : "text-navy-deep"
        }`}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-5 text-lg leading-relaxed ${
            light ? "text-white/65" : "text-muted-foreground"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: (formData.get("nome") as string) || "",
      empresa: (formData.get("empresa") as string) || "",
      email: (formData.get("email") as string) || "",
      whatsapp: (formData.get("whatsapp") as string) || "",
      faturamento: (formData.get("faturamento") as string) || "",
      desafio: (formData.get("desafio") as string) || "",
    };

    try {
      await sendDiagnostic({ data });
      setStatus("success");
      // Return to idle state after 8 seconds
      setTimeout(() => setStatus("idle"), 8000);
    } catch (err) {
      console.error("Erro ao enviar diagnóstico:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-8 space-y-4 animate-fade-in">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
          <CheckCircle2 className="h-8 w-8 animate-bounce" />
        </div>
        <h4 className="font-display text-xl text-white">Sua mensagem foi enviada!</h4>
        <p className="text-sm text-white/70 max-w-sm mx-auto">
          Em breve você receberá uma confirmação por e-mail e nossa equipe entrará em contato com novidades.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/70 mb-2">
            Seu nome
          </label>
          <input
            type="text"
            name="nome"
            required
            autoComplete="name"
            spellCheck={false}
            placeholder="Nome completo"
            className="form-input"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/70 mb-2">
            Empresa
          </label>
          <input
            type="text"
            name="empresa"
            required
            autoComplete="organization"
            spellCheck={false}
            placeholder="Nome da empresa"
            className="form-input"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/70 mb-2">
            Seu melhor E-mail
          </label>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            spellCheck={false}
            placeholder="email@empresa.com"
            className="form-input"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/70 mb-2">
            WhatsApp com DDD
          </label>
          <input
            type="tel"
            name="whatsapp"
            required
            autoComplete="tel"
            spellCheck={false}
            placeholder="Ex: (81) 99999-9999"
            className="form-input"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-white/70 mb-2">
          Faturamento mensal aproximado
        </label>
        <select
          name="faturamento"
          required
          defaultValue=""
          className="form-select"
        >
          <option value="" disabled>
            Selecione uma faixa
          </option>
          <option value="Até R$ 100k/mês">Até R$ 100 mil/mês</option>
          <option value="R$ 100k–500k/mês">R$ 100 mil a R$ 500 mil/mês</option>
          <option value="R$ 500k–2M/mês">R$ 500 mil a R$ 2 milhões/mês</option>
          <option value="Acima de R$ 2M/mês">Acima de R$ 2 milhões/mês</option>
        </select>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-white/70 mb-2">
          Maior desafio financeiro hoje
        </label>
        <input
          type="text"
          name="desafio"
          autoComplete="off"
          spellCheck={false}
          placeholder="Ex: fluxo de caixa, falta de dados, crescimento desorganizado..."
          className="form-input"
        />
      </div>

      {status === "error" && (
        <p className="text-xs text-red-400 font-medium">
          Ocorreu um erro ao processar seu envio. Por favor, tente novamente ou fale conosco no WhatsApp.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-sm transition-all duration-300 ${
          status === "sending"
            ? "bg-gold/50 text-navy-deep cursor-not-allowed"
            : "bg-gold text-navy-deep hover:bg-gold-soft hover:shadow-[var(--glow-gold-md)] hover:-translate-y-px"
        }`}
      >
        {status === "sending" ? (
          <>
            <span className="h-4 w-4 border-2 border-navy-deep border-t-transparent rounded-full animate-spin" />
            Enviando…
          </>
        ) : (
          <>
            Solicitar diagnóstico gratuito <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      <p className="text-xs text-white/60">
        Seus dados são tratados com sigilo absoluto. Resposta em até 24h úteis.
      </p>
    </form>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 24,
      stiffness: 150,
    },
  },
};

function Home() {
  useReveal();

  const [isPreloading, setIsPreloading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const handleLoad = () => {
      setFadeOut(true);
      setTimeout(() => setIsPreloading(false), 600);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      const timeoutId = setTimeout(handleLoad, 1800);
      return () => {
        window.removeEventListener("load", handleLoad);
        clearTimeout(timeoutId);
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Preloader */}
      {isPreloading && (
        <div
          className={`fixed inset-0 z-[9999] bg-[#fcfcfc] flex flex-col items-center justify-center gap-6 transition-all duration-500 ease-in-out ${
            fadeOut ? "opacity-0 pointer-events-none scale-[1.02]" : "opacity-100"
          }`}
        >
          <div className="flex flex-col items-center gap-6">
            <Logo variant="dark" className="h-20" />
            
            <div className="w-40 h-[3px] bg-navy-deep/10 rounded-full overflow-hidden relative">
              <div className="absolute top-0 bottom-0 w-1/2 bg-gold rounded-full animate-preloader-bar" />
            </div>
          </div>
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FinancialService",
            "name": "SP2M Inteligência Empresarial",
            "url": "https://sp2mgestao.com.br",
            "logo": "https://sp2mgestao.com.br/assets/logo-dark.png",
            "description": "BPO Financeiro, Assessoria Estratégica, Diretoria Financeira (CFO) sob Demanda e Inteligência de Negócios (BI) em Recife, Caruaru e região.",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Recife",
              "addressRegion": "PE",
              "addressCountry": "BR"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+55-81-99278-1366",
              "contactType": "sales",
              "areaServed": ["BR", "PE", "Recife", "Caruaru"],
              "availableLanguage": "Portuguese"
            }
          })
        }}
      />
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section id="top" className="relative overflow-hidden text-navy-deep min-h-svh flex items-center">
        {/* Backgrounds */}
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 hero-grid" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,oklch(0.74_0.13_75/0.07),transparent_70%)]" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative container-px max-w-7xl mx-auto w-full pt-32 pb-24 md:pt-40 md:pb-32">
          <div className="grid lg:grid-cols-[1fr_auto] gap-16 xl:gap-24 items-center">

            {/* Text column (Framer Motion Staggered Entry) */}
            <motion.div 
              className="max-w-2xl"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-gold">
                <span className="h-px w-10 bg-gold animate-line" />
                Inteligência Empresarial
              </motion.div>

              <motion.h1 variants={itemVariants} className="mt-8 text-5xl sm:text-6xl md:text-7xl leading-[1.02]">
                O CFO estratégico
                <br />
                que sua empresa{" "}
                <span className="text-gold italic font-normal">nunca teve.</span>
              </motion.h1>

              <motion.p variants={itemVariants} className="mt-8 text-lg md:text-xl text-navy-deep/75 max-w-xl leading-relaxed">
                Terceirização Financeira (BPO), Assessoria Estratégica e CFO sob Demanda. Transformando informações financeiras em decisões que impulsionam o crescimento dos negócios.
              </motion.p>

              <motion.div variants={itemVariants} className="mt-10 flex flex-wrap gap-3">
                <a
                  href="#contato"
                  onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent("open-diagnostic"));
                  }}
                  className="inline-flex items-center gap-2 bg-gold text-navy-deep hover:bg-gold-soft transition-all duration-300 px-7 py-4 rounded-full font-semibold text-sm shadow-[var(--glow-gold-sm)] hover:shadow-[var(--glow-gold-md)] hover:-translate-y-0.5"
                >
                  Diagnóstico gratuito <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#solucoes"
                  className="inline-flex items-center gap-2 border border-navy-deep/20 hover:border-gold hover:text-gold transition-all duration-300 text-navy-deep/80 px-7 py-4 rounded-full text-sm"
                >
                  Ver soluções <ChevronDown className="h-4 w-4" />
                </a>
              </motion.div>

              {/* Stats */}
              <motion.div variants={itemVariants} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl border-t border-navy-deep/10 pt-10">
                {[
                  ["Foco", "em PMEs"],
                  ["100%", "foco em finanças"],
                  ["4", "níveis de jornada"],
                  ["BI", "para decisão"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="font-display text-3xl text-gold">{k}</div>
                    <div className="text-xs uppercase tracking-wider text-navy-deep/70 mt-1 leading-tight">
                      {v}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Dashboard visual (YieldCard) */}
            <div className="hidden lg:block w-[360px] xl:w-[400px] animate-fade-in animate-delay-600">
              <div className="relative">
                {/* Glow */}
                <div className="absolute -inset-6 bg-gradient-to-tr from-gold/10 via-gold/5 to-transparent rounded-3xl blur-3xl" />
                <YieldCard />
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 animate-bounce-y">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">Role a página</span>
            <ChevronDown className="h-4 w-4 text-gold/60" />
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF / SETORES ────────────────────────────────────── */}
      <div className="border-y border-border bg-secondary/30 py-5 overflow-hidden">
        <div className="container-px max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
              Setores atendidos
            </span>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {sectors.map((s) => (
                <span key={s} className="text-sm text-navy/60 font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── QUEM SOMOS ────────────────────────────────────────────────── */}
      <section id="quem-somos" className="py-28 md:py-40">
        <div className="container-px max-w-7xl mx-auto grid md:grid-cols-12 gap-16 items-center">
          <div className="md:col-span-5">
            <SectionTitle
              eyebrow="Quem somos"
              title="Estratégia financeira construída em décadas."
              sub="Somos especialistas em transformar a complexidade financeira em clareza estratégica."
            />
            <div className="mt-10 flex flex-wrap gap-3 reveal reveal-delay-2">
              <a
                href="#contato"
                className="inline-flex items-center gap-2 bg-navy-deep text-white hover:bg-navy transition-all duration-300 px-6 py-3.5 rounded-full text-sm font-semibold"
              >
                Fale conosco <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="md:col-span-7 space-y-6 reveal reveal-delay-2">
            <p className="text-lg leading-relaxed text-foreground/80 max-w-[70ch]">
              A gestão financeira deixou de ser apenas uma obrigação operacional. Hoje ela é uma das
              principais ferramentas para geração de valor, crescimento e perpetuidade dos negócios.
              A SP2M nasceu para apoiar empresas que desejam crescer com organização, previsibilidade e inteligência.
            </p>
            <p className="text-base leading-relaxed text-foreground/65 max-w-[70ch]">
              Somos especializados em{" "}
              <strong className="text-navy-deep font-semibold">
                Inteligência Financeira, BPO Financeiro, Assessoria Estratégica, Diretoria Financeira (CFO) sob Demanda, Inteligência de Negócios (BI) e Planejamento Financeiro
              </strong>
              . Através de ampla atuação em finanças, controladoria, planejamento financeiro e gestão empresarial, apoiamos empresas que desejam profissionalizar a gestão financeira, melhorar resultados e crescer com segurança.
            </p>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 pt-4">
              {[
                "Clareza e controle absoluto",
                "Previsibilidade financeira",
                "Crescimento planejado",
                "Gestão do fluxo de caixa",
                "Decisões baseadas em dados",
                "Inteligência estratégica",
              ].map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-3 py-1 group transition-colors duration-300"
                >
                  <CheckCircle2 className="h-4 w-4 text-gold shrink-0 transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-sm text-foreground/80 font-medium group-hover:text-navy-deep">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FILOSOFIA ─────────────────────────────────────────────────── */}
      <section className="relative bg-navy-deep text-white py-32 md:py-44 overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,oklch(0.74_0.13_75/0.10),transparent_70%)]" />
        <div className="relative container-px max-w-4xl mx-auto text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-gold mb-10 reveal">
            Filosofia
          </div>
          <blockquote className="font-display text-3xl md:text-[2.75rem] leading-[1.22] reveal reveal-delay-2">
            "Empresas bem administradas tomam decisões baseadas em{" "}
            <span className="text-gold italic font-normal">informações</span>.
            Empresas extraordinárias tomam decisões baseadas em{" "}
            <span className="text-gold italic font-normal">inteligência</span>."
          </blockquote>
          <div className="hairline w-20 mx-auto mt-14 reveal reveal-delay-3" />
          <div className="mt-6 text-xs uppercase tracking-[0.25em] text-white/70 reveal reveal-delay-4">
            SP2M Inteligência Empresarial
          </div>
        </div>
      </section>

      {/* ── DESAFIOS ──────────────────────────────────────────────────── */}
      <section className="py-28 md:py-40 bg-secondary/30">
        <div className="container-px max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1.2fr_2fr] gap-12 lg:gap-20 items-start">
            {/* Left Column: Context / Statement */}
            <div className="sticky top-28">
              <SectionTitle
                eyebrow="Desafios"
                title="Os obstáculos silenciosos que limitam o crescimento."
                sub="Reconhecer a ineficiência é o primeiro ato de inteligência financeira. Mapeamos os principais gargalos que travam a performance de empresas em crescimento e estruturamos a resposta exata."
              />
            </div>
            
            {/* Right Column: Challenges List with Asymmetric / Refined Layout */}
            <div className="space-y-6">
              {challenges.map((c, i) => (
                <div
                  key={c.title}
                  className={`group bg-card border border-border rounded-xl p-8 hover:border-gold hover:shadow-[var(--shadow-md)] transition-all duration-400 reveal reveal-delay-${Math.min(i + 1, 6)} flex gap-6 items-start`}
                >
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl border border-border bg-secondary/50 group-hover:border-gold/50 group-hover:bg-gold/5 transition-all duration-300 shrink-0">
                    <c.icon
                      className="h-5 w-5 text-gold group-hover:scale-110 transition-transform duration-300"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg text-navy-deep font-display font-medium leading-snug">
                      {c.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-[60ch]">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUÇÕES ──────────────────────────────────────────────────── */}
      <section id="solucoes" className="py-28 md:py-40">
        <div className="container-px max-w-7xl mx-auto">
          <SectionTitle
            eyebrow="Soluções SP2M"
            title="A jornada da inteligência financeira."
            sub="Quatro níveis pensados para acompanhar cada estágio de maturidade da sua empresa."
          />

          {/* Journey line */}
          <div className="mt-16 hidden md:flex items-center gap-0 text-xs uppercase tracking-[0.2em] text-navy/50 reveal">
            {solutions.map((s, i) => (
              <div key={s.tier} className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="h-2 w-2 rotate-45 bg-gold" />
                  <span className="font-medium">{s.tier}</span>
                </div>
                {i < solutions.length - 1 && (
                  <span className="flex-1 h-px bg-border" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {solutions.map((s, i) => (
              <div
                key={s.tier}
                className={`relative flex flex-col rounded-xl p-8 transition-all duration-400 reveal reveal-delay-${Math.min(i + 1, 6)} ${
                  s.highlight
                    ? "bg-navy-deep text-white border-2 border-gold shadow-[var(--shadow-premium)]"
                    : "bg-card border border-border hover:border-gold/60 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1"
                }`}
              >
                {s.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-navy-deep text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    Mais completo
                  </div>
                )}
                <div className={`text-xs tracking-[0.25em] ${s.highlight ? "text-gold/60" : "text-gold"}`}>
                  {s.num}
                </div>
                <div
                  className={`mt-5 text-xs uppercase tracking-[0.2em] font-medium ${
                    s.highlight ? "text-gold" : "text-navy-deep"
                  }`}
                >
                  {s.tier}
                </div>
                <h3
                  className={`mt-2 text-2xl ${
                    s.highlight ? "text-white" : "text-navy-deep"
                  }`}
                >
                  {s.name}
                </h3>
                <p
                  className={`mt-4 text-sm leading-relaxed ${
                    s.highlight ? "text-white/65" : "text-muted-foreground"
                  }`}
                >
                  {s.desc}
                </p>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {s.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${s.highlight ? "text-gold" : "text-gold-soft"}`} />
                      <span className={s.highlight ? "text-white/80" : "text-foreground/80"}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <div
                  className={`mt-6 pt-5 border-t text-xs ${
                    s.highlight
                      ? "border-white/15 text-gold/80"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {s.range}
                </div>
                <a
                  href={`https://wa.me/5581992781366?text=${encodeURIComponent(`Olá! Tenho interesse no ${s.name}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 group ${
                    s.highlight
                      ? "text-gold hover:text-white"
                      : "text-navy-deep hover:text-gold"
                  }`}
                >
                  {s.cta}{" "}
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECNOLOGIA ────────────────────────────────────────────────── */}
      <section
        id="tecnologia"
        className="relative bg-navy-deep text-white py-28 md:py-40 overflow-hidden"
      >
        <div className="absolute inset-0 hero-grid opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_0%_50%,oklch(0.74_0.13_75/0.12),transparent_60%)]" />
        <div className="relative container-px max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <SectionTitle
              light
              eyebrow="Tecnologia & Inteligência"
              title="A tecnologia a serviço da sua gestão."
              sub="Não somos uma plataforma de software, somos especialistas. Implementamos e operamos as melhores ferramentas do mercado para desenhar e entregar a estrutura de Inteligência de Negócios (BI) que sua empresa precisa."
            />
            <div className="mt-12 grid sm:grid-cols-2 gap-4 reveal reveal-delay-2">
              {techItems.map((item) => (
                <div
                  key={item.t}
                  className="flex items-center gap-3 border border-white/10 hover:border-gold/60 hover:bg-white/5 transition-all duration-300 rounded-xl px-5 py-4 group"
                >
                  <item.icon
                    className="h-5 w-5 text-gold shrink-0 group-hover:scale-110 transition-transform duration-300"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                    {item.t}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual: real BI dashboard photo */}
          <div className="relative reveal reveal-delay-3">
            <div className="absolute -inset-8 bg-gradient-to-tr from-gold/12 to-transparent rounded-3xl blur-3xl" />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[var(--shadow-premium)]">
              <img
                src={techBiImg}
                alt="Painel de Inteligência de Negócios (BI) da SP2M"
                loading="lazy"
                width={600}
                height={380}
                className="w-full h-auto object-cover"
              />
              {/* Subtle overlay to match dark theme */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/60 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── RESULTADOS (substituiu Benefícios) ────────────────────────── */}
      <section id="resultados" className="py-28 md:py-40">
        <div className="container-px max-w-7xl mx-auto">
          <SectionTitle
            title="O impacto mensurável de gerir com inteligência."
            sub="Métricas médias de performance consolidadas com base no histórico real dos nossos clientes parceiros ao longo dos anos."
          />
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 border-t border-border pt-12">
            {resultados.map((r, i) => (
              <div
                key={r.label}
                className={`reveal reveal-delay-${Math.min(i + 1, 4)} flex flex-col justify-between h-full group`}
              >
                <div>
                  <div className="font-display text-5xl md:text-6xl text-gold font-light tracking-tight leading-none mb-4 transition-transform duration-300 group-hover:translate-x-1">
                    {r.value}
                  </div>
                  <div className="text-base font-semibold text-navy-deep leading-snug">{r.label}</div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[20ch]">{r.sub}</p>
                </div>
                {/* Subtle BI styling: a clean miniature structural indicator sparkline */}
                <div className="mt-6 h-1 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gold/60 rounded-full transition-all duration-500 group-hover:bg-gold" 
                    style={{ width: i === 0 ? "40%" : i === 1 ? "25%" : i === 2 ? "75%" : "97%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ───────────────────────────────────────────────── */}
      {/* IMPORTANTE: Substitua os textos e fotos pelos depoimentos reais dos seus clientes */}
      <section className="relative bg-navy-950 text-white py-28 md:py-40 overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-15" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,oklch(0.74_0.13_75/0.10),transparent_70%)]" />
        <div className="relative container-px max-w-7xl mx-auto">
          <SectionTitle
            light
            centered
            eyebrow="Depoimentos"
            title="O que dizem quem já decidiu com inteligência."
          />
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className={`relative bg-white/[0.05] border border-white/10 rounded-2xl p-8 hover:border-gold/40 hover:bg-white/[0.08] transition-all duration-400 reveal reveal-delay-${Math.min(i + 1, 3)}`}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className="h-3.5 w-3.5 fill-gold text-gold" />
                  ))}
                </div>

                {/* Quote mark decorative */}
                <div className="absolute top-6 right-7 text-gold/10 font-display text-8xl leading-none select-none">
                  "
                </div>

                {/* Quote text */}
                <p className="text-base text-white/70 leading-relaxed relative z-10">
                  "{t.quote}"
                </p>

                {/* Author */}
                <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-4">
                  <img
                    src={t.img}
                    alt={t.name}
                    loading="lazy"
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover border-2 border-gold/30"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {t.role} — {t.company}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <span className="text-[10px] bg-gold/15 text-gold border border-gold/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {t.sector}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPROMISSOS ──────────────────────────────────────────────── */}
      <section className="py-28 md:py-40 bg-secondary/10 border-t border-border">
        <div className="container-px max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1.5fr_2fr] gap-12 lg:gap-24 items-start">
            <div>
              <SectionTitle
                title="Os pilares de rigor e governança que sustentam nossa entrega."
                sub="A gestão de alta performance exige conformidade absoluta e compromisso técnico inegociável. Nossos valores são aplicados de forma prática em cada relatório, análise e decisão tomada."
              />
            </div>
            
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
              {commitments.map((c, i) => (
                <div
                  key={c.label}
                  className={`reveal reveal-delay-${Math.min(i + 1, 6)}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <c.icon className="h-5 w-5 text-gold shrink-0" strokeWidth={1.5} />
                    <h3 className="text-lg text-navy-deep font-display font-medium">{c.label}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[40ch]">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL + FORMULÁRIO ────────────────────────────────────── */}
      <section
        id="contato"
        className="relative bg-navy-950 text-white py-32 md:py-44 overflow-hidden"
      >
        <div className="absolute inset-0 hero-grid opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,oklch(0.74_0.13_75/0.14),transparent_70%)]" />
        <div className="relative container-px max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-start">

            {/* Left: Copy */}
            <div>
              <h2 className="font-display text-4xl md:text-5xl xl:text-6xl leading-[1.08] reveal reveal-delay-1">
                Pronto para decidir com mais{" "}
                <span className="text-gold italic font-normal">inteligência</span>?
              </h2>
              <blockquote className="mt-8 text-white/80 italic border-l-2 border-gold pl-4 text-base reveal reveal-delay-2">
                "Empresas extraordinárias não crescem por acaso. Crescem porque tomam decisões baseadas em inteligência."
              </blockquote>
              <p className="mt-6 text-sm text-white/60 max-w-lg leading-relaxed reveal reveal-delay-3">
                Preencha o formulário ao lado e nossa equipe entra em contato para uma
                conversa estratégica — sem compromisso e completamente gratuita.
              </p>

              {/* Contact info */}
              <div className="mt-12 space-y-5 reveal reveal-delay-3">
                <a
                  href="https://wa.me/5581992781366"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3.5 text-white/85 hover:text-gold transition-colors group"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl border border-white/10 group-hover:border-gold/40 transition-colors">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white/60 mb-0.5">WhatsApp</div>
                    <span className="text-sm">(81) 99278-1366</span>
                  </div>
                </a>
                <a
                  href="mailto:contato@sp2mgestao.com.br"
                  className="flex items-center gap-3.5 text-white/85 hover:text-gold transition-colors group"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl border border-white/10 group-hover:border-gold/40 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white/60 mb-0.5">Email</div>
                    <span className="text-sm">contato@sp2mgestao.com.br</span>
                  </div>
                </a>
                <a
                  href="https://instagram.com/sp2minteligenciaempresarial"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3.5 text-white/85 hover:text-gold transition-colors group"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl border border-white/10 group-hover:border-gold/40 transition-colors">
                    <Instagram className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white/60 mb-0.5">Instagram</div>
                    <span className="text-sm">@sp2minteligenciaempresarial</span>
                  </div>
                </a>
                <div className="flex items-center gap-3.5 text-white/85">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl border border-white/10">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white/60 mb-0.5">Localização</div>
                    <span className="text-sm">Caruaru - PE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="reveal reveal-delay-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-8 md:p-10">
                <div className="mb-8">
                  <div className="text-xs uppercase tracking-[0.2em] text-gold mb-2">
                    Diagnóstico gratuito
                  </div>
                  <h3 className="font-display text-2xl text-white">
                    Solicite uma conversa estratégica
                  </h3>
                  <p className="text-sm text-white/70 mt-2">
                    Resposta garantida em até 24 horas úteis.
                  </p>
                </div>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="bg-background text-navy-deep/80 border-t border-navy-deep/10">
        <div className="container-px max-w-7xl mx-auto py-16 grid md:grid-cols-3 gap-12">
          <div>
            <a href="#top" className="hover:opacity-80 transition-opacity duration-300 inline-block">
              <Logo variant="dark" />
            </a>
            <p className="mt-5 text-sm leading-relaxed text-navy-deep/60 max-w-xs">
              Inteligência financeira para decisões extraordinárias. Gestão financeira de alta performance.
            </p>
            <p className="mt-2 text-xs text-navy-deep/40">
              SP2M Inteligência Empresarial, 2026
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-gold mb-5">Contato</div>
            <ul className="space-y-3.5 text-sm">
              <li>
                <a
                  href="https://wa.me/5581992781366"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 hover:text-gold transition-colors text-navy-deep/80"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-navy-deep/40" /> (81) 99278-1366
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@sp2mgestao.com.br"
                  className="flex items-center gap-2.5 hover:text-gold transition-colors text-navy-deep/80"
                >
                  <Mail className="h-4 w-4 shrink-0 text-navy-deep/40" /> contato@sp2mgestao.com.br
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/sp2minteligenciaempresarial"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 hover:text-gold transition-colors text-navy-deep/80"
                >
                  <Instagram className="h-4 w-4 shrink-0 text-navy-deep/40" /> @sp2minteligenciaempresarial
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-gold mb-5">Navegação</div>
            <ul className="space-y-3 text-sm">
              {[
                ["#quem-somos", "Quem somos"],
                ["#solucoes", "Soluções"],
                ["#tecnologia", "Tecnologia"],
                ["#resultados", "Resultados"],
                ["#contato", "Contato"],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="hover:text-gold transition-colors text-navy-deep/80">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-navy-deep/10">
          <div className="container-px max-w-7xl mx-auto py-6 text-xs text-navy-deep/40 flex flex-col md:flex-row gap-2 justify-between">
            <span>© {new Date().getFullYear()} SP2M Inteligência Empresarial. Todos os direitos reservados.</span>
            <span>Inteligência financeira para empresas extraordinárias.</span>
          </div>
        </div>
      </footer>
      <DiagnosticWizard />
      <ScrollToTop />
    </div>
  );
}
