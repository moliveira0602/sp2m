---
name: SP2M Inteligência Empresarial
description: O cofre de segurança e prestígio para a gestão financeira de PMEs de alta performance.
colors:
  primary: "#da9e3f"
  primary-light: "#e4bd81"
  neutral-bg: "#f9fafb"
  neutral-fg: "#030d1e"
  neutral-border: "#e5e7eb"
  navy-950: "#01040e"
  navy: "#091c38"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)"
    fontWeight: 300
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-fg}"
    rounded: "{rounded.full}"
    padding: "16px 32px"
  button-primary-hover:
    backgroundColor: "{colors.primary-light}"
  card-base:
    backgroundColor: "{colors.neutral-bg}"
    rounded: "{rounded.lg}"
    padding: "32px"
---

# Design System: SP2M Inteligência Empresarial

## 1. Overview

**Creative North Star: "O Cofre do Conselho"**

O sistema visual da SP2M é fundado sobre a sobriedade, a segurança e a respeitabilidade. Inspirado nas grandes firmas de consultoria executiva (McKinsey, Boston Consulting Group) e no refinamento técnico da Apple e do Stripe, o sistema evita deliberadamente a estética efêmera e colorida de startups digitais e SaaS self-service. Cada elemento transmite que a gestão financeira do cliente está guardada em um cofre sob a vigilância de especialistas dedicados.

### Características Chave:
- **Sobriedade Cromática**: Uso pesado de azul-marinho profundo como fundo estrutural, pontuado por dourados ricos em elementos cirúrgicos de foco.
- **Ritmo Editorial**: Tipografia serifada expressiva em títulos combinada com uma sem-serifa limpa e racional para relatórios e tabelas.
- **Hierarquia Estrita**: Espaçamento amplo e distribuição assimétrica de layouts que dão respiro e eliminam o ruído de páginas de marketing baratas.

## 2. Colors

A paleta de cores reflete a solidez das grandes instituições financeiras corporativas. O contraste é mantido acima do limite WCAG AA em todas as situações de leitura.

### Primary
- **Ouro Nobre** (`#da9e3f` / `oklch(0.74 0.13 75)`): Usado estritamente para CTAs principais, marcações de destaque e realces de altíssimo valor. Nunca deve cobrir mais de 10% da área útil.
- **Ouro Suave** (`#e4bd81` / `oklch(0.82 0.09 78)`): Utilizado para estados de hover nos botões primários e marcações secundárias.

### Neutral
- **Fundo Cristal** (`#f9fafb` / `oklch(0.985 0.002 255)`): O fundo padrão para secções claras, um off-white sutil que acalma a visão.
- **Azul Noturno** (`#030d1e` / `oklch(0.16 0.04 256)`): Usado como cor de texto em fundos claros e como preenchimento de cards/painéis profundos.
- **Azul Abissal** (`#01040e` / `oklch(0.11 0.03 256)`): Fundo estrutural escuro absoluto das principais áreas do site (Navbar, Hero, Rodapé).

### Named Rules
**A Regra dos Dez Por Cento.** O Ouro Nobre é um recurso escasso. Ele atrai o olhar imediatamente. Seu uso é limitado a no máximo 10% do espaço de tela, mantendo sua aura de prestígio e utilidade como guia de conversão.

## 3. Typography

A tipografia estabelece um contraste entre a tradição serifada (Fraunces) e a precisão racionalista moderna (Inter).

**Display Font:** `Fraunces` (Georgia, serif)
**Body Font:** `Inter` (system-ui, sans-serif)

### Hierarchy
- **Display** (Light, `clamp(2.5rem, 6vw, 4.5rem)`, `1.02`): Usado nos títulos de seções principais (H1 e H2) para criar um tom editorial e sofisticado.
- **Headline** (Regular, `2.369rem`, `1.1`): Usado em cabeçalhos de bloco de médio impacto.
- **Title** (Semibold, `1.333rem`, `1.2`): Usado nos títulos dos blocos de desafios e soluções.
- **Body** (Light/Regular, `1rem`, `1.5`): Texto corrido de leitura confortável, limitado a no máximo 75 caracteres de largura por linha.
- **Label** (Medium, `0.75rem`, `0.25em` de espaçamento, todo em maiúsculas): Usado para "eyebrows" e rótulos de status.

### Named Rules
**A Regra da Não-Italização Decorativa.** A tipografia Fraunces Italic é reservada unicamente para destacar palavras-chave intelectuais (como *inteligência*, *extraordinárias*, *domina*), criando um ritmo de leitura expressivo. Jamais italicize blocos inteiros de texto ou frases sem importância.

## 4. Elevation

O sistema visual é predominantemente plano, transmitindo solidez e seriedade institucional. Não há uso generalizado de sombras falsas ou flutuações decorativas.

### Shadow Vocabulary
- **Elevação Suave** (`0 8px 24px -4px rgba(1, 4, 14, 0.10)`): Usada em cards e inputs claros durante estados de hover, indicando foco sem quebrar o layout.
- **Brilho Dourado** (`0 0 20px rgba(218, 158, 63, 0.20)`): Usado em botões e elementos primários ativos sobre fundo escuro.

### Named Rules
**A Regra Flat-by-Default.** Todo e qualquer container ou card repousa plano sobre a superfície por padrão. A profundidade (shadow) é um comportamento responsivo que atua apenas como feedback ativo a interações do usuário.

## 5. Components

### Buttons
- **Shape:** Cantos completamente arredondados (rounded-full / 9999px).
- **Primary:** Fundo Ouro Nobre (`#da9e3f`), texto Azul Noturno (`#030d1e`), peso semibold, padding generoso (`16px 32px`).
- **Hover/Focus:** Transiciona para Ouro Suave (`#e4bd81`) com brilho dourado e escala ativa de compressão (`scale(0.97)`).
- **Secondary:** Borda fina dourada ou branca de 1px com fundo transparente.

### Cards / Containers
- **Corner Style:** Cantos suaves de 12px (`rounded-lg`).
- **Background:** `bg-card` em secções claras; opacidade sutil (`bg-white/[0.04]`) com borda fina (`border-white/10`) em secções escuras.
- **Border:** Linha sutil de 1px (`border-border` ou `border-white/10`).

### Inputs / Fields
- **Style:** Fundo escurecido semi-transparente, cantos de 8px (`rounded-md`), borda fina.
- **Focus:** Contorno dourado sutil com leve sombra de espalhamento.

## 6. Do's and Don'ts

### Do:
- **Do** manter o fundo do site predominantemente em Azul Abissal ou Fundo Cristal off-white para preservar a identidade premium.
- **Do** manter o contraste de todos os textos acima de 4.5:1, priorizando a legibilidade.
- **Do** limitar a animação de scroll reveal a transições de materialização suaves (500ms com blur).

### Don't:
- **Don't** utilizar bordas decorativas grossas nas laterais de cards (side-stripe borders).
- **Don't** utilizar gradientes coloridos sob textos (gradient text).
- **Don't** utilizar cantos excessivamente arredondados acima de 16px em cards ou painéis de dados.
- **Don't** usar o layout clichê de SaaS ("número gigante + legenda insignificante") para métricas. Mostre dados com contexto analítico de BI.
- **Don't** entupir a página com grids de ícones genéricos do Lucide repetidos sem propósito.
