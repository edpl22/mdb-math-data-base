# MDB — Sistema de Design

## 1. Conceito visual

O MDB é uma ferramenta de pesquisa e catalogação matemática — não um curso, não um fórum, não um
produto de consumo. A referência mental é **"uma plataforma profissional de pesquisa matemática
construída como um SaaS premium"**: minimalismo + alta densidade de informação, organizada em
grid rígido, comunicando precisão através de tipografia, espaçamento e hierarquia — nunca através
de cor, ilustração ou decoração.

Inspirações de maturidade visual (não copiadas literalmente): Linear, Stripe, Vercel, GitHub,
dashboards B2B, ferramentas científicas. A matemática entra na identidade de forma funcional —
labels como `ALG` / `GEO` / `NT`, numeração de problema (`#1842`), notação técnica em fonte mono —
nunca como decoração (sem π gigante, sem fórmulas soltas, sem fundo de quadro-negro).

## 2. Regras absolutas

- **Nunca** `border-radius` além de `2px` (usado só onde citado explicitamente abaixo). Botões,
  badges e tags são sempre retangulares — nenhum pill, nenhuma cápsula.
- **Nunca** gradientes decorativos, glassmorphism, neumorphism, glow.
- **Nunca** sombras grandes — no máximo uma sombra quase imperceptível (`--shadow-1`) para separar
  camadas de sobreposição (menus, modais, toasts).
- **Nunca** emoji como ícone de interface.
- Dificuldade nunca é representada por estrelas coloridas — sempre por número (`3.8 / 5`), barra
  técnica de segmentos, ou seletor numerado retangular `[1][2][3][4][5]`.
- Cor é usada com parcimônia: uma única cor de destaque (`--accent`), reservada para ações
  primárias, estados ativos e links. Hierarquia normalmente vem de peso tipográfico, tamanho,
  espaçamento e bordas — não de cor.

## 3. Paleta

```css
--bg-page:        #F7F7F5;   /* fundo da página */
--bg-surface:      #FFFFFF;   /* painéis, navbar, inputs */
--bg-subtle:        #F0F0EE;   /* hover discreto, faixas alternadas de tabela */
--bg-inverse:         #111111;   /* navbar/rodapé escuro quando necessário, botão primário */

--text-primary:    #111111;
--text-secondary:   #5C5C58;
--text-tertiary:     #8A8A85;
--text-on-inverse:     #F7F7F5;

--border-default: #D9D9D6;
--border-strong:   #B8B8B3;

--accent:         #1E3A5F;   /* azul profundo — precisão, não "azul de SaaS genérico" */
--accent-hover:    #14283F;
--accent-soft:       #E7ECF1;  /* fundo tênue para estados ativos/selecionados */

--success:        #1F6E43;
--success-soft:     #E6F1EA;
--danger:          #A32626;
--danger-soft:       #FBEAEA;
```

Sem paleta categórica por área/dificuldade — áreas e dificuldade se distinguem por **texto**
(`ALG`, `GEO`, `3.8/5`), não por cor.

## 4. Tipografia

- **Sans (interface)**: [Inter](https://fonts.google.com/specimen/Inter) — pesos 400/500/600/700.
- **Mono (dados técnicos)**: [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) —
  usada em IDs (`#1842`), dificuldade (`3.8 / 5`), tags/labels (`ALGEBRA · POLYNOMIALS`), atalhos
  de teclado (`Ctrl K`), timestamps e qualquer metadado técnico.
- **Matemática**: MathJax (já integrado), sem alterações.

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;

--text-xs:   11px;  /* labels técnicas, tags, uppercase */
--text-sm:   12.5px;
--text-base: 14px;  /* corpo padrão */
--text-md:   15.5px;
--text-lg:   18px;
--text-xl:   22px;
--text-2xl:  28px;
--text-3xl:  36px;  /* usado no máximo 1x por página */
```

Labels técnicas (`ALGEBRA`, `HINT`, `PROBLEM`) usam mono, uppercase, `letter-spacing: 0.06em`,
`font-size: var(--text-xs)`, cor `--text-secondary`.

## 5. Espaçamento

```css
--space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
--space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;
```

## 6. Bordas e superfícies

```css
--radius: 0px;        /* padrão universal */
--radius-soft: 2px;    /* exceção pontual: modal/toast, nunca em botões/tags */
--shadow-1: 0 1px 2px rgba(17,17,17,0.06);   /* único nível de sombra do sistema */
```

Divisórias (`border-bottom: 1px solid var(--border-default)`) substituem cards com sombra na
maioria das listagens — ver Componentes.

## 7. Grid e layout

- `--max-width-wide: 1440px` — home, catálogo, admin (páginas de exploração/densas).
- `--max-width-read: 760px` — largura de leitura do enunciado/solução na página do problema.
- Catálogo e admin usam layout de duas colunas: `filtros/sidebar (260px) | conteúdo (1fr)`.
- Breakpoint principal: `960px` (sidebar empilha acima do conteúdo; tabelas viram listas).

## 8. Componentes

### Navbar
Altura 60px, fundo `--bg-surface`, `border-bottom: 1px solid var(--border-default)`. Wordmark
`MDB` em mono/bold. Links de navegação compactos. Campo de busca central com indicador `Ctrl K`.
Sem botões arredondados.

### Botões
`PrimaryButton` (`--bg-inverse`/`--text-on-inverse`), `SecondaryButton` (borda, fundo
transparente), `DangerButton` (`--danger`). Todos: `border-radius: 0`, `padding: 10px 16px`,
`font-weight: 600`, transição de 120ms em `background-color`/`border-color`.

### SearchInput
Retangular, ícone de lupa discreto à esquerda, badge mono `Ctrl K` à direita quando aplicável.

### ProblemRow / ProblemMetadata
Substitui os antigos "cards" grandes: linha horizontal compacta com `border-bottom`, contendo
`#id` (mono), título, badges de área/tópicos (retangulares, outline), dificuldade (`x.x / 5` +
barra técnica) e contagem de avaliações. Hover: `background: var(--bg-subtle)`.

### DifficultyIndicator (leitura)
`3.8 / 5` em mono + barra de segmentos (`■■■■□` — 5 blocos retangulares, preenchidos até o valor
arredondado). Sem cor semântica (verde/amarelo/vermelho); todos os blocos usam `--text-primary`/
`--border-default`.

### DifficultySelector (input, 1–5)
Cinco botões retangulares lado a lado (`[1][2][3][4][5]`), o selecionado com fundo
`--bg-inverse`/texto `--text-on-inverse`.

### Tag / AreaLabel
Texto mono uppercase, `border: 1px solid var(--border-default)`, `padding: 2px 8px`,
`border-radius: 0`. Nunca pill.

### FilterGroup (sidebar)
Título mono uppercase + lista de opções (checkbox retangular customizado ou linha clicável) +
divisor inferior.

### EmptyState / LoadingState / Toast / Modal
Retangulares, sem sombra pesada. Toast usa `--shadow-1` e desliza discretamente. Loading usa um
indicador mínimo (barra/rotação simples), nunca skeleton colorido chamativo.

### Tabela (admin)
`border-collapse: collapse`, cabeçalho mono uppercase `--text-xs`, linhas com `border-bottom`,
hover `--bg-subtle`, sem zebra colorida forte (`--bg-subtle` sutil opcional).

## 9. Responsividade

- `> 960px`: layout completo (sidebar + navbar horizontal completa).
- `≤ 960px`: sidebar de filtros vira painel expansível (`<details>`/toggle) acima da listagem;
  navbar reduz links secundários; tabelas do admin viram listas de linhas empilhadas (mesmos
  dados, sem colunas).
- `≤ 640px`: tipografia mantém tamanho mínimo `--text-base`; paddings reduzem para `--space-3`.

## 10. Páginas e status

| Página | Estrutura nova |
|---|---|
| Home (`index.html`) | Cabeçalho compacto + busca + índice de áreas (contagem) + recém-adicionados (linhas) + explorar por dificuldade (5 níveis) + ações (sortear / gerar simulado) |
| Catálogo (`pages/catalog.html`) | Sidebar de filtros (área, dificuldade, tópico) + listagem em linhas densas + paginação |
| Problema (`pages/problem.html`) | Breadcrumb + cabeçalho + enunciado (largura de leitura) + HINT/SOLUTION em blocos retos revеláveis + seletor de dificuldade + ações de status |
| Login/Cadastro | Formulário centrado, labels sempre visíveis, inputs retangulares |
| Perfil (`pages/profile.html`) | Navegação por abas em sublinhado (não pill) + listagem em linhas |
| Simulados (`pages/mock-exam.html`) | Formulário técnico + prévia "problemas disponíveis por dificuldade" antes de gerar |
| Admin (`pages/admin.html`) | Sidebar corporativa (Overview/Problems/Areas/CSV) + tabela de problemas + formulário reto |

## 11. Nota sobre filtro de "status" no catálogo

O brief de design sugere um filtro por status (não tentado/concluído/favorito) na sidebar do
catálogo. A API atual (`GET /api/problems`) não aceita esse filtro no servidor — filtrar no
cliente quebraria a paginação (a página retornaria menos itens do que o esperado sem re-buscar).
Para não entregar um controle "de mentira", esse filtro **não foi incluído** na sidebar do
catálogo nesta fase; os status continuam plenamente funcionais na página do problema e no perfil
(`/api/users/me/problems`, que já os retorna prontos). Se o filtro server-side for desejado, é uma
mudança pequena e isolada em `ProblemController`/`ProblemRepository` — fora do escopo desta tarefa
(front-end/design).
