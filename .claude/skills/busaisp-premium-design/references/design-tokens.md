# Mapa dos tokens de design do app Android (BusaÍ SP)

Isto é um mapa de "onde procurar", não uma cópia congelada dos valores —
releia o arquivo real antes de confiar num hex específico. Escopo: só o app
nativo (`native-android/`). O app web (`src/`) tem seu próprio sistema
(`--bus-*` em `globals.css`) e não é coberto por esta skill.

## `native-android/app/src/main/java/com/busaisp/android/`

- **`ui/theme/Color.kt`** — `object AppColors` (paleta dark-first:
  `BackgroundDark`, `SurfaceDark`, `LiveAmber`, `OnRouteEmerald`,
  `OffRouteRed`, `UserLocationBlue`) e `object LineColors` (cores oficiais de
  cada linha de Metrô/CPTM de SP — `MetroLinha1Azul` etc.).
- **`ui/theme/Theme.kt`** / **`ui/theme/Type.kt`** — aplicação do tema
  Compose e tipografia (IBM Plex Sans/Mono).
- **Fontes**: `app/src/main/res/font/` (`ibm_plex_sans_*`, `ibm_plex_mono_*`).
- **Reskin dark do mapa**: `ui/map/MapDarkPalette.kt` — classifica camadas do
  MapLibre por papel semântico (`MapLayerRole`) e deriva cor de `AppColors`.
  Se for mexer em qualquer coisa visual do mapa, este arquivo é o precedente a
  seguir, não a começar do zero.
- **Animação de interpolação de posição real**: `interpolatePosition` (domain
  layer) — usado por `LiveBusMap.kt` para mover ônibus continuamente entre
  pings de GPS (a matemática é contínua). **Ressalva real (auditoria de
  2026-09-01)**: a fonte do MapLibre só é atualizada 1x/segundo
  (`BUS_INTERPOLATION_TICK_MS`), então o resultado na tela ainda é um "pulo"
  perceptível, não um deslizar fluido — a matemática está certa, a cadência de
  renderização é que precisa melhorar.
- **Spring com bounce já usado, de verdade**: `VehicleDetailSheet.kt` —
  `animateContentSize(spring(dampingRatio = Spring.DampingRatioMediumBouncy))`,
  aplicado de verdade na expansão/colapso do painel (confirmado, não
  decorativo). É o único exemplo real de easing não-linear em todo o app hoje
  — reuse esse padrão em vez de inventar outra curva.
- ⚠️ **Não existe pulso de "ao vivo" implementado em lugar nenhum do app real
  ainda** (correção de uma versão anterior desta doc, que citava
  erroneamente um pulso no botão de localização de `MapScreen.kt` como já
  pronto — isso só existe num worktree de teste descartável usado pra avaliar
  esta skill, `.claude/skills/busaisp-premium-design-workspace/`, nunca foi
  mesclado no app real). `FloatingPillButton.kt` hoje é estático, só ripple
  padrão do Material. Isso é uma lacuna real a implementar, não um precedente
  a seguir.
- ⚠️ **`AppColors.LiveAmber` está diluído**: `Theme.kt` usa `LiveAmber` como
  `colorScheme.primary` do app inteiro, então ele pinta botões, foco de
  campo de texto, etc. em várias telas sem relação nenhuma com GPS ao vivo
  (confirmado em `ActiveNavigationScreen.kt`, `NewsScreen.kt`,
  `SettingsScreen.kt`). A convenção "âmbar = GPS ao vivo" documentada no
  comentário de `MapDarkPalette.kt` só se sustenta de fato na camada do mapa
  — em qualquer nova tela, não assuma que `colorScheme.primary` é seguro pra
  usar como se fosse neutro.
- `EtaCounterStyle` (IBM Plex Mono, em `Type.kt`) existe, documentado
  explicitamente pra números de ETA/contadores/código de linha — mas não é
  usado em nenhuma tela ainda (nem `VehicleDetailSheet`, nem os cards de rota).
  É um token órfão à espera de ser adotado, não algo já resolvido.

## Antes de assumir que algo "básico" é falta de polish

Confira `git log --oneline -- <arquivo>` / `git show <commit>` no arquivo em
questão. Uma escolha visual simples pode ser uma decisão deliberada (ex.:
performance, legibilidade, consistência com outra tela) documentada só na
mensagem do commit, não no código. Reverter isso sem checar é o erro mais caro
que esta skill existe pra evitar.

## Ao adicionar uma cor/animação nova

1. Ela já existe com outro nome nesta lista? Reuse.
2. Ela é próxima o bastante de uma existente pra confundir (poucos tons de
   distância)? Reuse ou ajuste a existente, não crie uma terceira opção.
3. É genuinamente um papel semântico novo? Derive de um token base existente
   (ex.: uma variação de `AppColors.BackgroundDark`) e dê um nome que descreva
   o papel, não a tela onde foi inventada.
