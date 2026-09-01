# TransitHomeHub — redesign "premium" (com skill busaisp-premium-design)

## Achado critico da auditoria (Parte 1 da skill), antes de tocar em codigo

O pedido original era "glassmorphism e melhores animacoes, nivel Uber/Waze".
Antes de implementar, li `src/app/globals.css` por inteiro, como a skill manda,
e o comentario de topo do arquivo diz, literalmente:

> DESIGN SYSTEM "PAINEL DE EMBARQUE" [...] superficies planas
> (**sem vidro/blur/glow**), hierarquia limpa.

Confirmei que isso nao e acidental: o historico do repo mostra uma decisao
deliberada e recente (`2aa6dea`, "refatoracao visual Painel de Embarque -
fase 1", que reescreveu `globals.css`, `TransitHeader`, `TransitDock`,
`TransitHomeHub` e mais) cuja propria mensagem de commit diz "sem
glassmorphism/blur/glow, superficies planas", precedida por um commit
anterior (`4b56ec3`, "eliminate card transparencies with solid 100% opaque
dark backgrounds for maximum readability") que tinha removido transparencia
de proposito por legibilidade. Tambem confirmei via `grep -rn "backdrop-blur"
src` que nao existe nenhum uso real de `backdrop-blur`/glass no codigo
atual - a classe `.bus-glass-panel` tem esse nome por heranca historica, mas
hoje e implementada como painel 100% opaco e plano (`background: var(--bus-surface)`,
sem blur). O `references/design-tokens.md` da propria skill, que cita "13+
arquivos com backdrop-blur", esta desatualizado nesse ponto especifico - a
skill ja avisa para tratar esse arquivo como mapa e nao como fonte de verdade,
e foi exatamente esse tipo de divergencia que apareceu aqui.

Decisao: nao reintroduzi glassmorphism/blur/transparencia. Isso reverteria
uma decisao de design validada ha poucos dias, pelos mesmos motivos de
legibilidade que a skill pede pra respeitar ("nao redesenhar por cima do que
ja existe sem perceber"). Em vez disso, persegui a sensacao "Uber/Waze" -
fisica de movimento, feedback tatil, hierarquia, dado ao vivo que respira -
inteiramente dentro do sistema plano e opaco ja em vigor. Se o vidro for
mesmo um requisito nao-negociavel, isso e uma decisao de produto que merece
ser tomada explicitamente (e revertida em `globals.css` conscientemente), nao
algo para um agente reintroduzir de lado.

## O que foi reaproveitado (nao recriado)

- Chips de destino populares/favoritos (`activeDestinationsList`, backed
  by `search_events` via `/api/rotas?tipo=destinos_populares`) - logica e
  dados intocados; so o container ganhou uma mascara de fade nas bordas (ver
  abaixo).
- Tokens `--bus-*` de cor/superficie/sombra/raio - nenhuma cor nova foi
  criada. Todo CSS novo referencia tokens existentes (`--bus-surface-sunken`,
  `--bus-surface-hover`, `--bus-violet`, `--bus-shadow-raised`, etc.).
- Convencao ambar = GPS ao vivo (`--bus-live`) - nao tocada, nao reusada
  para outro significado.
- `markerPulse` (pulso do indicador "RADAR AO VIVO") - ja existia e ja
  fazia exatamente o que a skill pede ("dado ao vivo respira, nao pisca");
  mantido sem alteracao.
- `cubic-bezier(0.16, 1, 0.3, 1)` - a curva "spring" desenhada a mao que o
  app ja usa em todo modal/drawer (`TransitDock`, `StopArrivalsModal`,
  `PWAInstallBanner`, etc. via `animate-slide-up`). Reusada para o stagger dos
  3 paineis da home em vez de inventar uma curva nova.
- `getEtaColorTokens` (`src/lib/etaStyle.ts`) - regra de cor do badge de
  ETA (verde/ambar/cinza), intocada.
- `.bus-btn-primary` / `.bus-btn-voice` - ja tinham feedback tatil
  (`:active { transform: scale(0.98) }`); usados como padrao para estender o
  mesmo comportamento a `.bus-card` e `.bus-pill`, que so declaravam
  `transition: transform` mas nunca tinham uma regra `:active` que de fato
  mudasse o `transform` - o padrao ja existia pela metade, so terminei.

## O que foi corrigido (bugs reais encontrados na auditoria, dentro do escopo tocado)

- `animation: 'spin 1s linear infinite'` no spinner de carregamento do
  card "Radar ao Vivo": esse `@keyframes spin` nunca existiu em
  `globals.css` (so existe, sem relacao, em `public/index.html`, que nao e
  carregado pela app Next). O spinner girava zero - ficava um circulo
  estatico com a metade de cima colorida. Corrigido substituindo o spinner
  por skeleton (ver abaixo), que elimina o bug ao eliminar a necessidade da
  animacao quebrada. Nao toquei nos outros ~6 arquivos que tambem usam
  `animate-spin` do mesmo jeito quebrado (`LiveMap.tsx`,
  `StationsExplorerPanel.tsx`, `StopArrivalsModal.tsx`, `TokenConfigModal.tsx`)
  - esta fora do escopo desta tarefa (so `TransitHomeHub.tsx`), mas vale um
  fix separado.
- Fill-mode das animacoes compartilhadas: `.animate-slide-up` e
  `.animate-fade-in` usavam `forwards`, que nao segura o estado inicial
  durante um `animation-delay` - um elemento seria pintado no estado final
  ate o delay acabar, e so entao "pularia" de volta pro inicio da animacao.
  Troquei para `both` em ambas (globals.css). Verifiquei que nenhum outro
  consumidor dessas classes usa `animation-delay` hoje, entao a mudanca e
  estritamente aditiva/sem efeito colateral visivel nos outros ~10 lugares
  que usam essas classes sem delay.
- Hover de sugestao do autocomplete so funcionava com mouse
  (`onMouseEnter`/`onMouseLeave` inline mudando `style.background`
  diretamente via DOM) - nao da feedback nenhum em toque, que e o uso
  predominante do app. Trocado por uma classe CSS real (`.bus-suggestion-row`)
  com `:hover` e `:active`.

## O que foi adicionado (genuinamente novo, e por que)

Tudo abaixo foi implementado so com CSS (`transform`/`opacity`/mascara),
sem novas bibliotecas, para ficar dentro do orcamento de performance que a
skill pede (compositor, nao layout/paint pesado):

1. Entrada escalonada (stagger) dos 3 paineis da home (busca -> radar ao
   vivo -> noticias), 70ms entre cada um, reusando `.animate-slide-up`/curva
   spring existente com `animationDelay` crescente - em vez de tudo aparecer
   de uma vez, cascade sutil de cima pra baixo.
2. Skeleton de carregamento (`.bus-skeleton`, `@keyframes
   busSkeletonShimmer`) no card "Radar ao Vivo", no formato exato do
   conteudo final (titulo, nome do destino, numero grande de ETA, badge de
   linha, botao) - substitui o spinner quebrado. Aplicacao direta da regra
   da skill: "loading e skeleton, nao spinner generico, quando a forma final
   e previsivel" - e aqui e: sabemos exatamente como o card vai ficar antes
   dos dados chegarem.
3. Cross-fade suave no numero de ETA quando a telemetria atualiza (a
   cada 30s, ou ao trocar de destino): o `<div>` do "X min" agora tem
   `key={destino+duracao}` + `animate-fade-in`, entao o React remonta e
   dispara o fade a cada mudanca de valor, em vez do numero trocar num
   corte seco. Tambem aumentei o peso/tamanho desse numero (700->800,
   20px->22px) pra reforcar a hierarquia "o numero que importa e claramente
   maior", outra regra explicita da skill.
4. Feedback tatil em <100ms completado em todos os elementos tocaveis
   que ainda nao tinham: chips de destino (`.bus-pill:active`), cards
   (`.bus-card:active`), bolinhas de paginacao (`.bus-dot:active`), botoes
   de icone da busca - limpar e enviar (`.bus-icon-btn`, novo, com variante
   `.bus-icon-btn-filled` pro botao violeta solido) e o painel de noticias
   inteiro, que era clicavel mas nao dava nenhum retorno visual ao toque
   (`.bus-panel-pressable`, com leve `scale(0.99)` + elevacao de sombra no
   hover, usando `--bus-shadow-raised` ja existente).
5. Mascara de fade nas bordas da fileira horizontal de chips (quando ha
   mais de 3, indicando que da pra rolar) via `mask-image`/`WebkitMaskImage`
   com gradiente alfa - deliberadamente nao um `div` com gradiente de cor
   solida sobreposto (isso quebraria no tema claro, que este app ja suporta
   via `[data-theme="light"]`), ja que a mascara desvanece o conteudo em si,
   nao depende de saber a cor de fundo atual.

## Arquivos alterados

- `src/app/globals.css` - extensao de `.bus-card`/`.bus-pill` com `:active`
  real; novas classes `.bus-icon-btn(-filled)`, `.bus-suggestion-row`,
  `.bus-dot`, `.bus-panel-pressable`, `.bus-skeleton` +
  `@keyframes busSkeletonShimmer`; fill-mode `both` em
  `.animate-slide-up`/`.animate-fade-in`. Nenhuma cor nova, nenhum
  `backdrop-filter`.
- `src/components/Transit/TransitHomeHub.tsx` - stagger nos 3 paineis,
  skeleton no lugar do spinner quebrado, cross-fade no numero de ETA,
  mascara de fade nos chips, botoes/linhas de sugestao migrados pras novas
  classes com feedback tatil. Nenhuma mudanca de dados, de API, ou da logica
  de favoritos/populares.

## Verificacao feita

- `npx tsc --noEmit -p .` - sem erros de tipo.
- `npm run dev` + `curl http://localhost:3000/` - compilou (`Compiled /
  in 29.7s`) e respondeu HTTP 200, sem erro de servidor/render.
- Nao verificado visualmente: este ambiente nao tem navegador/headless
  disponivel para capturar screenshot. A confirmacao de "isso parece
  Uber/Waze de verdade" e o teste em viewport mobile real ainda dependem de
  alguem abrir `npm run dev` num navegador (inclusive redimensionando pra
  mobile, como a skill pede) - nao estou alegando aparencia final sem ter
  visto.
