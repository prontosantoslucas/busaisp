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
  pings de GPS, não em saltos.
- **Pulso de "ao vivo" já implementado**: `MapScreen.kt`, botão de
  localização atual — anima só enquanto `userLocation != null`, usando
  easing não-linear (não `LinearEasing`). Precedente pra qualquer outro
  indicador "ao vivo" que for adicionado.
- **Spring com bounce já usado**: `VehicleDetailSheet.kt` —
  `spring(dampingRatio = Spring.DampingRatioMediumBouncy)`. Reuse esse padrão
  em vez de inventar outra curva pra gestos/expansão de painel.

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
