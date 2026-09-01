# Redesign premium — TransitHomeHub.tsx

## Pedido
"Redesenha a tela inicial (`src/components/Transit/TransitHomeHub.tsx`) pra parecer mais
premium, com glassmorphism e melhores animações, no nível de Uber/Waze."

## Contexto encontrado
O design system atual do app (`src/app/globals.css`) é deliberadamente **plano** — o
próprio comentário no topo do arquivo diz "superfícies planas (sem vidro/blur/glow)". A
`TransitHomeHub` é a tela inicial (aba "Rotas"), renderizada dentro de um painel flutuante
(`.floating-main-panel` em `src/app/page.tsx`) que fica **por cima do mapa ao vivo**
(Leaflet) no desktop, sem fundo próprio — ou seja, um `backdrop-filter: blur()` aplicado
aqui desfoca de verdade o mapa atrás, exatamente como cartões flutuantes de Uber/Waze.

Não há `framer-motion`, Tailwind ou qualquer lib de animação no projeto (confirmado em
`package.json`) — tudo é CSS puro + estilos inline, então o redesign segue essa mesma
convenção em vez de introduzir uma dependência nova.

## O que foi mudado

### 1. `src/app/globals.css`
- Novos tokens de tema (dark e light) para vidro: `--bus-glass-bg`,
  `--bus-glass-bg-hover`, `--bus-glass-border`, `--bus-glass-border-strong`,
  `--bus-glass-sheen`, `--bus-glass-highlight`, `--bus-shadow-glass`,
  `--bus-shadow-glass-hover`. Cada tema (escuro/claro) tem sua própria variante, seguindo
  o padrão já existente no arquivo.
- Novo bloco de classes utilitárias com prefixo `thh-` (escopado à Home, para não afetar
  o resto do app que segue com o visual plano original):
  - `.thh-glass` — cartão de vidro real (`backdrop-filter: blur(22px) saturate(160%)`),
    friso de brilho no topo, elevação e sombra que reagem a hover/focus.
  - `.thh-orb` (`--violet` / `--amber`) — manchas de luz ambiente atrás dos cartões,
    flutuando lentamente (`thhFloat`), dando profundidade ao blur sem precisar de imagem.
  - `.thh-rise` + `thhRise` — entrada escalonada dos 3 cartões (sobem e aparecem com
    atraso crescente, efeito de "reveal" de app premium).
  - `.thh-chip` — chips de destino rápido com vidro leve, entrada em "pop" escalonada,
    hover com leve elevação/scale e brilho.
  - `.thh-input` — campo de busca com borda/realce animados no foco.
  - `.thh-icon-btn` — botões circulares (limpar busca / enviar) com "spring" de toque.
  - `.thh-btn-primary` — botão de ação primário com gradiente e um brilho que varre da
    esquerda para a direita no hover (efeito "shine sweep").
  - `.thh-live-dot` — indicador "AO VIVO" com **anel duplo pulsante** (radar de verdade,
    dois pulsos defasados) em vez do pulso único anterior.
  - `.thh-skeleton` + `thhShimmer` — skeleton com brilho varrendo, substituindo o spinner
    genérico enquanto a telemetria carrega (como Uber/Waze fazem ao consultar rota).
  - `.thh-value-pop` — pequena animação de "pop" quando um valor ao vivo (ETA, duração)
    muda, para o número não trocar sem transição.
  - `.thh-breathe` — respiração sutil em ícones que merecem atenção (Sparkles do
    planejador; ícone de notícias quando há ocorrências ativas).
  - `.thh-arrow` — seta do atalho de notícias que desliza ao passar o mouse no cartão.
  - Bloco `@media (prefers-reduced-motion: reduce)` que desliga todas as animações
    contínuas (órbitas, pulsos, shimmer, shine sweep) mantendo o visual de vidro estático,
    por acessibilidade.

### 2. `src/components/Transit/TransitHomeHub.tsx`
- Os 3 cartões (busca, radar ao vivo, atalho de notícias) trocaram `bus-glass-panel`
  (plano) por `thh-glass thh-rise`, com `animationDelay` crescente para o efeito
  escalonado.
- Adicionadas duas `<div className="thh-orb ...">` decorativas atrás do conteúdo
  (`aria-hidden`, sem interação).
- Campo de busca: novo estado `isSearchFocused` para colorir o ícone de lupa ao focar;
  classe `thh-input` no lugar de `bus-input` (fundo transparente para deixar o vidro do
  cartão aparecer atrás do campo); botões de limpar/enviar ganharam `thh-icon-btn`.
- Dropdown de sugestões: virou `thh-glass` também (mesmo tratamento de vidro); item de
  sugestão usa `thh-suggestion` (entra deslizando, com atraso por índice); estado de
  carregamento trocou o texto "Buscando..." por dois `thh-skeleton` (mais consistente
  com o resto do redesign).
- Chips de destino rápido: `thh-chip` com `animationDelay` por índice.
- Indicador "RADAR AO VIVO": `.thh-live-dot` com anel duplo em vez do pulso único
  anterior; pontos de paginação ganharam glow sutil quando ativos.
- Estado de carregamento da telemetria: spinner circular trocado por um layout de
  skeleton (`thh-skeleton`) que já sugere a forma do conteúdo final (linha de destino,
  bloco de duração, bloco da linha recomendada) — reduz a sensação de "travou".
  Duração total e ETA do próximo ônibus agora usam `key={valor}` + `thh-value-pop` para
  dar um pequeno "pop" quando o número muda (a cada refresh de 30s), em vez de trocar
  sem nenhuma transição.
- Botão "Ver Opções de Rota" trocou `bus-btn-primary` por `thh-btn-primary` (gradiente +
  brilho no hover, "spring" no toque).
- Cartão de notícias: ícone ganha `thh-breathe` (respiração) quando há ocorrências
  ativas (`incidents.length > 0`) para chamar atenção sem ser alarmante; a seta "Abrir"
  ganhou `thh-arrow`, que desliza para a direita quando o cartão inteiro recebe hover
  (via `.thh-glass:hover .thh-arrow` no CSS).
- Nenhuma prop, nenhuma chamada de API e nenhuma lógica de negócio foi alterada — é uma
  troca puramente visual/de interação, mantendo a mesma interface (`TransitHomeHubProps`)
  e o mesmo comportamento funcional (busca, sugestões, favoritos, telemetria ao vivo,
  atalho de notícias).

## Por que essa abordagem
- **Glassmorphism real, não decorativo**: como a Home renderiza sobre o mapa ao vivo
  (sem fundo opaco no desktop), usar `backdrop-filter` aqui de fato desfoca o mapa atrás
  dos cartões — é o efeito "cartão flutuante sobre o mapa" que Uber/Waze usam, e não
  apenas um fundo semitransparente estático.
- **Escopo isolado (`thh-` prefix)**: o design system documentado do app é
  intencionalmente plano em todo o resto do produto ("sem vidro/blur/glow"). Em vez de
  reescrever `.bus-glass-panel` globalmente (o que quebraria a linguagem visual de todas
  as outras telas), criei uma variante nova só para a Home, que é onde o pedido de
  "premium" foi feito.
- **Sem novas dependências**: o projeto não usa Tailwind nem framer-motion; segui a
  convenção existente (CSS + estilos inline) para não inflar o bundle nem introduzir
  risco de build.
- **Animações com propósito, não só estética**: cada animação comunica algo — o duplo
  pulso do "AO VIVO" reforça "isto é tempo real"; o skeleton no lugar do spinner comunica
  "sabemos a forma do que vai aparecer"; o "pop" no número quando o ETA atualiza avisa
  que o dado mudou; a entrada escalonada dá uma sensação de app carregado com cuidado, não
  de tela estática.
- **Acessibilidade**: `prefers-reduced-motion: reduce` desliga tudo que é contínuo/loop
  (órbitas, pulsos, shimmer, shine sweep), preservando só o visual de vidro (estático).

## Validação
- `npx tsc --noEmit` — sem erros.
- `npm run build` (Next.js) — build de produção completo com sucesso
  (`Compiled successfully`, páginas estáticas geradas normalmente).
- `git diff --stat` confirma que só os dois arquivos pretendidos foram tocados
  (`src/app/globals.css`, `src/components/Transit/TransitHomeHub.tsx`).
- Sem testes automatizados cobrindo este componente no repo (grep por `TransitHomeHub`
  em arquivos `*.test.*`/`*.spec.*` não retornou nada), então a validação foi por
  compilação/build + revisão manual do JSX/CSS.

## Observação sobre o ambiente deste run
O worktree isolado desta tarefa (`agent-a097f23462889dcff`) foi criado com um histórico
órfão contendo só um `README.md` — sem o código-fonte real do projeto. Antes de editar,
foi necessário `git reset --hard master` dentro do próprio worktree (sem tocar em nenhum
outro worktree/branch) para trazer o conteúdo real do repositório (a mesma árvore
descrita no `gitStatus` do início da conversa) e então aplicar o redesign sobre ela. O
`changes.diff` neste output foi gerado contra o commit `283133a` (topo de `master` no
momento do reset), que é o baseline real de onde as mudanças partiram.
