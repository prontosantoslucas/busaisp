# Radar pulse no botão de localização atual (Android nativo)

## O que foi pedido

Adicionar uma animação de pulso tipo radar no `FloatingPillButton` de
"Localização atual" (`Icons.Filled.MyLocation`) em
`native-android/app/src/main/java/com/busaisp/android/ui/map/MapScreen.kt`.

## Arquivo alterado

- `native-android/app/src/main/java/com/busaisp/android/ui/map/MapScreen.kt`
  (único arquivo tocado — 54 inserções / 14 remoções, ver `changes.diff`)

`FloatingPillButton.kt` (o componente compartilhado usado também pelo botão
"Radar de Calor") **não foi modificado** — o anel de pulso foi implementado
como um `Box` extra ao redor da chamada existente do botão, dentro do próprio
`MapScreen.kt`, para não alterar o comportamento/visual do outro botão que
reusa o mesmo componente.

## Auditoria feita antes de implementar (Parte 1 da skill)

Antes de escrever qualquer código novo, li:

1. **`native-android/.../ui/theme/Color.kt`** — confirmei que já existe
   `AppColors.UserLocationBlue = Color(0xFF3B82F6)`, e que esse token já é
   usado em `LiveBusMap.kt` (linha ~108) para colorir o círculo de posição do
   usuário no próprio mapa (`CircleLayer` do MapLibre). Ou seja, "azul = minha
   posição" já é uma convenção semântica estabelecida no app — não inventei
   uma cor nova para o pulso, reusei exatamente esse token.
2. **`src/app/globals.css`** (web) — os `@keyframes radarPulse` (scale
   0.95→1.4→0.95, opacity 0.8→0→0) e `@keyframes markerPulse` (scale
   1→2.2→1, opacity 0.7→0→0, `animation: markerPulse 1.8s infinite`, cor
   `--bus-live-soft`) já existem e são usados no marcador de ônibus ao vivo no
   mapa web. Usei `markerPulse` como precedente direto de curva/duração
   (1800ms, amplitude de opacidade 0.7→0) em vez de inventar um timing novo.
3. **`native-android/.../ui/map/MapDarkPalette.kt`** — confirmei o padrão do
   projeto de derivar cores de `AppColors` em vez de criar hex novos soltos.
4. **`VehicleDetailSheet.kt`** — já usa `spring(dampingRatio =
   Spring.DampingRatioMediumBouncy)` para animar o bottom sheet, confirmando
   que o projeto já rejeita `LinearEasing`/fade linear para motion tocável.
   Para um pulso *infinito* (não um gesto de arrastar), o padrão idiomático em
   Compose e o equivalente ao "ease" default do CSS é um `tween` com
   `FastOutSlowInEasing` — foi essa a curva usada aqui, evitando
   `LinearEasing`.
5. **`LiveBusMap.kt`** — confirmei que `userLocation` (tipo
   `LocationClient.Position?`) já é coletado em `MapScreen` e passado ao mapa;
   reusei esse mesmo `State` para decidir quando o pulso do botão deve estar
   ativo, em vez de criar um novo estado paralelo.

## O que foi implementado

- Um anel (`Box` de 52dp, mesmo diâmetro visual do próprio
  `FloatingPillButton` — ícone 24dp + padding 14dp de cada lado) desenhado
  atrás do botão de localização, dentro de um `Box(contentAlignment =
  Alignment.Center)`.
- O anel só é renderizado quando `userLocation != null` — ou seja, o pulso
  reflete um dado real (há uma posição de GPS ao vivo sendo rastreada), não é
  decoração incondicional. Isso segue o princípio da skill "dado ao vivo
  respira, não fica estático": aqui, "ao vivo" significa que existe mesmo um
  fix de GPS, não apenas que o botão existe na tela.
- Animação via `rememberInfiniteTransition` + `animateFloat(0f → 1f,
  infiniteRepeatable(tween(1800ms, FastOutSlowInEasing), RepeatMode.Restart))`,
  aplicada com `Modifier.graphicsLayer { scaleX/scaleY = 1f + progress*1.2f;
  alpha = (1f - progress) * 0.7f }` sobre um `Box` com
  `.background(AppColors.UserLocationBlue, CircleShape)`.
  - Duração (1800ms) e amplitude de opacidade (0.7 → 0) espelham
    `markerPulse` do web.
  - `graphicsLayer` (não `Modifier.scale` + recomposição do `background`) foi
    escolhido deliberadamente: `scaleX`/`scaleY`/`alpha` no `graphicsLayer`
    são propriedades de compositor — cada frame da animação redesenha só essa
    camada, sem recompor/relayoutar a árvore do botão, seguindo a orientação
    da skill de "anime transform/opacity (compositor)" e evitar
    recomposição em cascata.
- Curva não-linear (`FastOutSlowInEasing`), nunca `LinearEasing`, conforme a
  skill pede para motion que não seja um fade genérico.

## Tokens/precedentes reusados (nada novo foi inventado em paleta)

- Cor: `AppColors.UserLocationBlue` (já existente, já usado no marcador de
  posição do usuário no mapa) — **reuso direto**, zero cor nova.
- Timing/amplitude: espelha `@keyframes markerPulse` do web (1.8s, opacidade
  0.7→0) — **reuso direto do precedente**, não um número inventado.
- Padrão de motion não-linear: segue o precedente já estabelecido em
  `VehicleDetailSheet.kt` (uso de easing não-linear em vez de linear).
- Tamanho do anel (52dp): calculado a partir do próprio
  `FloatingPillButton` (ícone 24dp + padding 14dp×2), não um valor arbitrário
  — garante que o anel nasça exatamente do contorno do botão existente.

## O que é genuinamente novo

- A condição de estado (`userLocation != null` liga o pulso) é uma decisão de
  design nova, não copiada de nenhum lugar — é a extensão do princípio "dado
  ao vivo respira" para este botão específico. Alternativa considerada e
  descartada: pulso sempre ativo (decorativo, incondicional). Optei por
  condicionar ao estado real porque (a) evita sinalizar "ao vivo" quando não
  há GPS nenhum ainda (antes da permissão ser concedida), e (b) é consistente
  com o resto do app, onde pulso = indicador de dado ao vivo, não enfeite. Se
  o produto preferir um affordance sempre visível ("toque aqui para
  localização"), a mudança é trivial: remover o `if (userLocation != null)`.
- A implementação via `graphicsLayer` direto (em vez de `Modifier.scale` +
  `alpha` em modifiers separados) é uma escolha de performance minha, não
  copiada de um arquivo existente do projeto (não havia precedente de
  animação infinita em Compose no código Android antes desta mudança).

## O que deliberadamente NÃO foi tocado

- `FloatingPillButton.kt` não ganhou feedback de toque (scale-down + spring)
  — a skill recomenda isso para "todo elemento tocável", mas está fora do
  escopo pedido (pulso de radar) e alteraria também o botão de Radar de
  Calor, que reusa o mesmo componente. Deixo registrado aqui como uma
  melhoria futura natural, não implementada nesta mudança para não expandir
  o escopo sem pedido explícito.

## Verificação

- **Compilação**: `./gradlew.bat :app:compileDebugKotlin` a partir de
  `native-android/` — **compilou com sucesso** (`BUILD SUCCESSFUL in 2m 13s`,
  17 tasks executadas). Os únicos warnings emitidos são pré-existentes
  (deprecations em `VoiceService.kt`, `BusaiNavHost.kt`,
  `RouteDetailScreen.kt`, `RouteResultsScreen.kt`), nenhum relacionado à
  mudança feita.
- **Visual/emulador**: não verificado — não há emulador/dispositivo
  disponível neste ambiente. O comportamento visual (curva do pulso, timing,
  contraste do azul sobre o mapa escuro) depende de alguém instalar o APK e
  observar; não estou alegando "ficou ótimo visualmente" sem ter visto.

## Nota sobre o ambiente deste run

O worktree isolado deste agente (`.claude/worktrees/agent-a978f200f0c2ff7c9`)
foi criado a partir de um commit inicial que continha apenas `README.md` —
não tinha `native-android/` nem nenhum outro código-fonte do projeto. Para
poder trabalhar nos arquivos reais pedidos na tarefa, resetei a branch deste
worktree (`worktree-agent-a978f200f0c2ff7c9`) para a ponta de
`origin/master` (commit `2287d4d`, o mesmo que contém o reskin dark do mapa
mencionado na tarefa) — uma operação de git feita inteiramente dentro deste
worktree isolado, sem tocar o checkout compartilhado
`C:\Users\user\Documents\GitHub\busaisp`. O `git diff` em `changes.diff` é
relativo a esse commit `2287d4d`, e mostra exclusivamente a mudança do pulso
de radar.
