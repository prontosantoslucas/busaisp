# Melhoria de UX — Card de Resultado de Rota (Web)

## Pedido
"Melhora a UX do card de resultado de rota no app web (`src/components/Transit/TransitRouteResults.tsx`), quero algo no nível do Uber."

## Arquivos alterados
- `src/components/Transit/TransitRouteResults.tsx`
- `src/app/globals.css` (novas classes de suporte, sob namespace `.bus-route-*` para não afetar `.bus-card` genérico usado em Estações/Notícias/Favoritos/Itinerário de Linha)

## O que mudou e por quê

Apps como Uber/99/InDrive tratam cada "opção de viagem" como um cartão com forte
hierarquia visual, uma opção recomendada em destaque, metadados de relance
(distância, tempo, transferências) e feedback de interação claro (seleção,
toque, carregamento). O card anterior já tinha os dados certos, mas todos no
mesmo peso visual — sem destaque, sem estado de seleção evidente, sem
composição do trajeto, e o carregamento era um spinner genérico centralizado.

1. **Rota recomendada em destaque** — quando há mais de uma opção, a rota com
   menor duração ganha uma fita "Mais rápida" (ícone de raio) no topo do card,
   como o destaque de "recomendado" que apps de mobilidade dão à opção principal.

2. **Hierarquia tipográfica mais forte** — a duração total passou de 20px/700 para
   24px/800 com o "min" reduzido ao lado, deixando o número — a informação mais
   importante do card — mais escaneável, como o preço/tempo em destaque nos
   cards de corrida do Uber.

3. **Estado de seleção explícito** — o card selecionado agora tem uma barra de
   acento violeta na borda esquerda (`::before`) e um selo circular com check
   (check) ao lado do favorito, além do contorno que já existia. Fica óbvio qual
   rota está ativa sem precisar comparar bordas sutis.

4. **Barra de composição do trajeto** — nova barra horizontal segmentada
   (`.bus-route-modebar`) logo abaixo do cabeçalho, com um segmento por trecho
   (caminhada/ônibus/trem) proporcional à duração e colorido por modal. Dá uma
   leitura visual instantânea de "quanto da viagem é a pé vs. em cima de uma
   linha", sem precisar ler os badges de texto.

5. **Estatísticas rápidas (metadados de relance)** — nova linha com distância
   total a pé ("320 m a pé" / "1.2 km a pé") e baldeações ("Direto, sem
   baldeações" / "1 baldeação"), no mesmo espírito das linhas de metadado que o
   Uber mostra abaixo do preço (distância, tempo, capacidade).

6. **Micro-interações**:
   - Cards entram com animação escalonada (slide-up + fade, delay crescente
     por índice) em vez de aparecerem todos de uma vez — inclusive ao trocar
     de filtro (Mais Rápida / Menos Caminhada / Menos Trocas), já que a key do
     card agora inclui o `filterMode`, forçando remount e replay da animação
     quando a lista é reordenada.
   - Hover eleva o card (translateY(-2px) + sombra) e toque comprime
     levemente (scale(0.985)), dando feedback tátil de "isso é clicável".
   - O botão de favorito (estrela) faz um "pop" de escala ao ser tocado
     (`favPop` keyframe, 350ms) em vez de mudar de cor instantaneamente sem
     feedback.
   - O badge de ETA ganhou um ponto pulsante (`.bus-live-dot`) quando o
     próximo ônibus está a <=5 min, reforçando "isso é um dado ao vivo" —
     mesma linguagem visual do pulso já usado no marcador de ônibus no mapa.
   - O rodapé "Detalhes" ganhou uma seta que se afasta sutilmente no hover
     (gap animado), convite mais claro de que o card leva a mais detalhes.

7. **Skeleton de carregamento** — o spinner genérico centralizado foi trocado
   por 3 cards-esqueleto (`.bus-route-skeleton` + `.bus-skel-bar` com
   shimmer) que imitam a silhueta real dos cards de rota. Isso evita o "salto"
   de layout quando os resultados chegam e é o padrão que apps de mobilidade
   usam para listas de opções (em vez de um spinner solto no meio da tela).
   Um indicador de progresso compacto com texto ("Buscando trajetos ideais...")
   ficou acima da lista de esqueletos.

8. **Estado vazio mais gentil** — em vez de só texto centralizado, o estado
   "nenhuma rota encontrada" ganhou um ícone circular e fade-in, consistente
   com o resto do polimento.

9. **Rótulos de texto mais diretos** — "(Chega às X)" virou "chega às X" (mais
   leve, sem parênteses "administrativos"); "em Xm" virou "próximo em Xm" /
   "Saindo agora" (mais natural que "Agora" solto).

## Decisões de design
- Mantive o design system existente (`--bus-violet`, `--bus-live`,
  `--bus-emerald`, raios/sombras já definidos) — o objetivo era elevar a
  execução, não trocar a identidade visual "Painel de Embarque" do app.
- Criei classes novas com o prefixo `.bus-route-*` em vez de estender `.bus-card`
  genérico, porque `.bus-card` é reusado por `StationsExplorerPanel`,
  `TransitNewsPanel`, `LineItineraryPanel` e `FavoritesDrawer` — não queria que
  o polimento específico deste card (ribbon, check de seleção, hover elevado)
  vazasse para esses outros contextos sem revisão deles.
- A barra de composição do trajeto usa `flexGrow` proporcional à duração de
  cada trecho (mínimo de 1 para não sumir com trechos de 0min), sem depender
  de nenhuma lib de gráfico nova.
- Toda a animação de entrada/skeleton usa os keyframes (`slideUp`, `fadeIn`)
  que já existiam em `globals.css`, só reaproveitados com `animation-delay`
  escalonado via variável CSS `--route-card-delay`.

## Verificação
- Sem ambiente de build completo disponível neste worktree (worktree isolado
  não tem `node_modules`/`package.json` do projeto), então a verificação foi:
  - Checagem sintática do TSX via `ts.transpileModule` (TypeScript do
    repositório principal) — sem diagnósticos.
  - Contagem de chaves `{`/`}` do CSS para garantir balanceamento (98/98).
  - Revisão manual completa do arquivo final linha a linha.
- Recomendado rodar `npm run build` / `npm run lint` no checkout principal
  antes de mesclar, e testar visualmente com poucas rotas, muitas rotas
  (scroll), 0 rotas (erro) e alternando os filtros.

## Observação sobre o ambiente deste run
Este worktree (`agent-a21e13a0ae213cba6`) foi inicializado só com `README.md`
(commit "Initial commit"), sem o código-fonte real do projeto. Os arquivos
originais foram lidos do checkout principal
(`C:\Users\user\Documents\GitHub\busaisp`, somente leitura) para servir de
base, copiados para dentro deste worktree, e então editados aqui — nenhuma
alteração foi feita fora deste worktree. Como não havia histórico git do
arquivo original dentro deste worktree, `changes.diff` foi gerado com `diff -u`
comparando o conteúdo original (lido do checkout principal) com a versão final
editada aqui, e não com `git diff`.
