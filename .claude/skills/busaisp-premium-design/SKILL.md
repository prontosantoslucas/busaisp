---
name: busaisp-premium-design
description: Use whenever building, redesigning, or polishing any visual/UI surface of the BusaÍ SP native Android app (Kotlin + Jetpack Compose, in native-android/). Trigger on requests like "deixa o app mais bonito", "melhora a UX do Android", "quero um app no nível de Uber/Waze/99/InDrive", "adiciona animação", "o layout tá básico", "cria uma tela nova", or any proposal that touches colors, typography, motion, spacing, or component visuals in native-android/ — even if the user doesn't use design vocabulary. Also use it to review a design/UX plan or PR before it's implemented, not just when writing Compose code directly. Scope is the Android app only — for the Next.js web app (src/), this skill does not apply.
---

O app Android do BusaÍ SP já tem um sistema de design deliberado, não uma base
em branco: paleta dark-first (`AppColors`/`LineColors`), fontes IBM Plex e um
reskin real do mapa (`MapDarkPalette.kt`). Mas "já existe sistema" não é o
mesmo que "já está tudo aplicado" — uma auditoria completa (2026-09-01)
encontrou zero animação não-linear em código real fora de um único lugar
(`VehicleDetailSheet.kt`), `AppColors.LiveAmber` vazando pra `colorScheme.primary`
do app inteiro (diluindo a própria convenção "âmbar = GPS ao vivo" documentada
no código), e um token de tipografia dedicado (`EtaCounterStyle`) definido e
nunca usado. Ou seja: o sistema existe, mas está subaplicado — não presuma que
uma tela específica já segue os próprios padrões do app só porque outra segue.
O maior risco ao "deixar mais bonito" não é falta de ideias — é redesenhar por cima do que já existe sem
perceber, produzindo um sistema inconsistente ou revertendo uma decisão que já
foi tomada de propósito. Isso já aconteceu de verdade neste projeto (no app
web, mas o padrão vale igual aqui): um agente propôs "adicionar glassmorphism"
sem checar que o visual flat era uma decisão recente e deliberada — visível no
`git log`, não seria óbvio olhando só o CSS/Compose atual. **Auditar não é só
ler o arquivo de tema — é checar também se um comportamento "básico" foi
escolhido de propósito antes de assumir que é falta de polish.**

Por isso esta skill tem duas partes, nessa ordem: **auditar antes de desenhar**,
e só depois **elevar ao nível de app de mobilidade premium de verdade** (Uber,
Waze, 99, InDrive) — não visual genérico de dashboard ou site institucional.

## Parte 1 — Audite antes de propor qualquer mudança

Antes de escrever uma linha de Compose, ou de propor uma cor/animação nova,
leia o sistema atual. Isto não é burocracia — é a diferença entre adicionar
sobre uma base coerente e criar uma segunda base concorrente que o próximo
agente (ou você mesmo, na próxima sessão) vai ter que reconciliar.

- Leia `native-android/app/src/main/java/com/busaisp/android/ui/theme/{Color,Theme,Type}.kt`
  — `AppColors` (paleta dark-first) e `LineColors` (cores oficiais de Metrô/CPTM
  de SP), e confira as fontes IBM Plex já empacotadas em `app/src/main/res/font/`.
- Se a tela que você vai mexer já foi "reskinada" ou já tem alguma animação de
  verdade (ex.: o reskin dark do MapLibre em `.../ui/map/MapDarkPalette.kt`, ou
  o `spring(dampingRatio = Spring.DampingRatioMediumBouncy)` já aplicado em
  `VehicleDetailSheet.kt`), trate esse trabalho como fonte de verdade do padrão
  a seguir, não como algo a redescobrir do zero. Mas não assuma que esse padrão
  já foi aplicado em outras telas só porque existe em uma — confirme tela por
  tela (ver `references/design-tokens.md` pra lista do que já foi checado).
- **Cheque o `git log`/`git show` do arquivo antes de reverter algo que parece
  "básico" ou "sem graça"**. Um visual simples pode ser dívida técnica — ou pode
  ser uma decisão de legibilidade/performance tomada de propósito. Ver
  `references/design-tokens.md` para onde procurar cada coisa, mas trate esse
  documento como mapa, não como verdade — releia o código real, ele muda mais
  rápido que a documentação.

Antes de introduzir qualquer cor, animação ou componente novo, pergunte: **isso
já existe com outro nome?** Se a resposta é "quase" (ex.: um azul a poucos tons
de distância do `AppColors.UserLocationBlue` já existente), **reuse o token
existente** em vez de criar um primo próximo — um sistema com 3 azuis
quase-iguais é pior que um sistema com um azul só, mesmo que cada um
individualmente "pareça" bom. Quando genuinamente for preciso estender a
paleta (um papel semântico que não existe ainda), derive do que já existe e
documente o porquê, do jeito que `MapDarkPalette.kt` derivou de
`AppColors.BackgroundDark` em vez de inventar um preto novo.

## Parte 2 — Eleve ao nível de app de mobilidade premium

"Bonito" sozinho não é o alvo — o alvo é a sensação tátil e a confiança visual
de um app de mobilidade em produção de verdade. Isso se traduz em padrões
concretos e verificáveis em Compose, não em adjetivos:

- **Toda animação contínua/interativa usa curva não-linear**: `spring()` com
  `dampingRatio`/`stiffness`, ou no mínimo um easing como `FastOutSlowInEasing`
  — nunca `LinearEasing` num `infiniteRepeatable`/`tween` que o usuário vê ou
  toca. Isso já foi testado neste projeto: um pulso de radar com
  `LinearEasing` lê como "notificação piscando genérica"; o mesmo pulso com
  `FastOutSlowInEasing` ou `spring()` lê como produto cuidado. A diferença é
  uma palavra no código e é enorme no resultado.
- **Bottom sheets e drags com física real**: `Animatable` + `spring()` com
  `dampingRatio` (ex.: `Spring.DampingRatioMediumBouncy`, já usado em
  `VehicleDetailSheet.kt` — reuse esse padrão em vez de inventar outro).
- **Dado ao vivo respira, não pisca**: posição de ônibus, GPS do usuário,
  contadores de ETA — interpolação contínua entre atualizações. A matemática
  já existe (`interpolatePosition`), mas a cadência de renderização hoje ainda
  é 1x/segundo (`BUS_INTERPOLATION_TICK_MS` em `LiveBusMap.kt`), o que ainda lê
  como pulo, não deslize — se for mexer nisso, o alvo é reduzir esse intervalo
  ou animar a posição na tela entre ticks. Qualquer pulso de "ao vivo" que vier
  a ser adicionado só deveria animar enquanto o dado que ele representa existe
  de verdade (ex.: só rodar quando `userLocation != null`) — não é decoração,
  é honestidade visual.
- **Câmera nunca corta**: centralizar/seguir o usuário ou um ônibus é sempre
  `easeCamera`/animação, nunca um corte instantâneo de posição.
- **Feedback de toque imediato**: todo elemento tocável reage em <100ms (scale
  down sutil + spring de volta, mudança de elevação/sombra), mesmo antes da
  ação de verdade completar — o usuário nunca fica sem saber se o toque
  registrou.
- **Loading é skeleton, não spinner genérico** quando a forma final do
  conteúdo é previsível (lista de rotas, card de linha, estação) — spinner só
  quando não há forma prévia pra antecipar (ex.: aguardando o primeiro fix de
  GPS).
- **Hierarquia tipográfica com contraste real**: números que importam (ETA,
  distância, contagem de estações) em peso/tamanho claramente maior que o
  texto de apoio ao redor — não tudo em `bodyMedium` disputando atenção. O app
  já tem `EtaCounterStyle` (IBM Plex Mono) definido em `Type.kt` exatamente pra
  isso, mas nenhuma tela usa ainda — prefira adotar esse token a inventar outro
  estilo do zero.
- **Um único acento por intenção, usado com disciplina**: âmbar deveria
  significar só "GPS ao vivo" neste app (`AppColors.LiveAmber`) — mas hoje
  `Theme.kt` liga `LiveAmber` direto em `colorScheme.primary`, então ele pinta
  botão/foco de campo/etc. em telas sem GPS nenhum (Notícias, Configurações,
  Navegação Ativa). Ao mexer numa tela nova, não herde `colorScheme.primary`
  cegamente achando que é uma cor neutra — confira se ali é de fato dado ao
  vivo antes de deixar âmbar aparecer. Corrigir esse vazamento na raiz
  (`Theme.kt`) é uma correção estrutural válida, não um "nice to have".
- **Performance é parte do design, não um afterthought**: evite recomposição
  em cascata em loops de atualização (posição de ônibus, polling) usando
  `remember`/`derivedStateOf`; anime propriedades de `graphicsLayer`
  (scale/alpha/translation) em vez de forçar recomposição/relayout a cada
  frame. Um app "bonito" que engasga ao rolar não está no nível de Uber/Waze —
  está pior que um app simples que roda liso.

Ao terminar uma peça de UI, faça o teste mental explícito: **"isso pareceria
fora de lugar dentro do Uber, Waze, 99 ou InDrive?"** Se a resposta for sim —
ou porque é genérico demais (Material padrão sem intenção, ícone estático onde
devia respirar) ou porque quebra a linguagem visual que o BusaÍ SP já
construiu — volte e ajuste antes de considerar terminado.

## Verificação

Não declare uma mudança visual pronta sem evidência real:
- Rode `./gradlew.bat :app:compileDebugKotlin` (ou `assembleDebug`/testes
  relevantes) a partir de `native-android/` antes de considerar terminado.
- **Não existe emulador/dispositivo Android neste ambiente sandbox.** Seja
  explícito sobre o que foi verificado por build/teste versus o que ainda
  depende de alguém instalar o APK e olhar — nunca alegue "ficou ótimo
  visualmente" sem ter visto de verdade.

Para o inventário de onde cada token/tema/animação mora hoje, ver
`references/design-tokens.md` — mas trate-o como um mapa de "onde procurar",
não como a fonte de verdade dos valores: releia o arquivo real antes de
confiar num hex ou nome específico, porque este documento pode ficar
desatualizado enquanto o código muda.
