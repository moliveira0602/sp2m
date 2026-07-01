# SP2M Inteligência Empresarial — Portal Corporativo & Diagnóstico Estratégico

O canal digital de alta conversão e prestígio da **SP2M**, boutique de assessoria financeira estratégica e BPO financeiro voltada para PMEs de alta performance.

---

## 💎 Posicionamento & Conceito Visual

Inspirado pelo ritmo editorial e sobriedade de grandes firmas de consultoria global (como McKinsey e BCG) e pela precisão técnica de marcas premium (Apple, Stripe), o portal segue a diretriz visual **"O Cofre do Conselho"**. 

Evitamos o visual genérico de SaaS e contabilidades tradicionais, priorizando:
*   **Azul Abissal & Ouro Nobre:** Paleta clássica que expressa solidez, prestígio e segurança institucional.
*   **Regra dos 10%:** O dourado (`#da9e3f`) é tratado como recurso nobre e escasso, aplicado estritamente em botões de conversão e elementos críticos de foco.
*   **Clareza Baseada em Dados:** Resultados demonstrados com contexto de inteligência analítica (BI executivo), sem clichês gráficos.
*   **Retratos Humanizados:** Depoimentos reais de clientes representados com retratos fotográficos naturais e de alta fidelidade.

---

## 🛠️ Stack Tecnológica

O portal é desenvolvido com ferramentas modernas para garantir taxa de carregamento ultra-rápida (SEO avançado), tipagem estrita e movimentos fluidos:

*   **Core:** [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
*   **Framework:** [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) (Roteamento nativo e capacidades Server-Side com Vite)
*   **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla CSS customizado para micro-interações táteis.
*   **Sistema de Movimento:**
    *   [Framer Motion](https://www.framer.com/motion/) para transições de interface locais (entrada coordenada da Hero e física de mola elástica do painel de chat).
    *   [GSAP](https://gsap.com/) & **ScrollTrigger** para revelações sutis ao longo da rolagem da página (fade & slide-up com controle de desfoque/blur).
*   **Icons:** [Lucide React](https://lucide.dev/)

---

## 📁 Estrutura de Pastas Relevantes

```bash
SP2M/
├── src/
│   ├── assets/              # Logos, avatar do especialista e fotos naturais de testimonials
│   ├── components/
│   │   └── ui/
│   │       ├── diagnostic-wizard.tsx # Diagnóstico: Questionário interativo de qualificação e handoff para WhatsApp
│   │       └── yield-card.tsx # Cartão conceitual interativo (Glassmorphism / iOS style)
│   ├── routes/
│   │   └── index.tsx        # Página principal com a integração do GSAP ScrollTrigger e Framer Motion Hero
│   └── styles.css           # Variáveis do Design System, regras flat-by-default e efeitos de blur
├── DESIGN.md                # Diretrizes completas do Design System ("O Cofre do Conselho")
├── PRODUCT.md               # Definição de personas, propósito do produto e princípios WCAG
├── package.json             # Scripts de build e dependências declaradas
└── tsconfig.json            # Configuração restrita do compilador TypeScript
```

---

## ⚙️ Funcionalidades de Destaque

1.  **Diagnóstico Interativo (Qualificador):**
    *   Assistente de bordo que guia o visitante por uma qualificação comercial B2B baseada na faixa de faturamento (plano enquadrado), setor e principal dor do negócio.
    *   **Handoff de WhatsApp:** Envia um texto estruturado para a equipe de vendas contendo o pré-diagnóstico do lead já qualificado.
2.  **Sistema de Revelação Progressiva (GSAP ScrollTrigger):**
    *   Efeito de materialização sutil de cards e seções com remoção progressiva de desfoque (`blur`) sob demanda do scroll do usuário, otimizado para não prejudicar repaints no browser.
3.  **Acessibilidade WCAG 2.1 AA:**
    *   Contraste de texto mínimo de 4.5:1 contra os fundos Azul Abissal e Cristal Off-white.
    *   Suporte completo à diretiva `prefers-reduced-motion` para suavizar ou desativar animações automaticamente para quem necessitar.

---

## 🚀 Como Executar o Projeto

Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

### 1. Instalar as dependências
```bash
npm install
```

### 2. Rodar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse o portal localmente em: [http://localhost:3000](http://localhost:3000)

### 3. Gerar a build de produção (Compilada e Minificada)
```bash
npm run build
```

### 4. Visualizar o resultado de produção localmente
```bash
npm run preview
```

### 5. Validar a tipagem do projeto
```bash
npx tsc --noEmit
```
