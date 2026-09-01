# Mapa dos tokens de design do BusaÍ SP

Isto é um mapa de "onde procurar", não uma cópia congelada dos valores —
releia o arquivo real antes de confiar num hex específico.

## Web (`src/`)

- **`src/app/globals.css`** — fonte de verdade de todo o tema web.
  - Variáveis de cor/superfície/borda/sombra: prefixo `--bus-*` (ex.:
    `--bus-bg`, `--bus-surface`, `--bus-violet`, `--bus-live`, `--bus-amber`,
    `--bus-emerald`, `--bus-text-primary`). Definidas duas vezes — bloco dark
    (padrão) e bloco `[data-theme="light"]` ou equivalente logo abaixo.
  - Raios/sombras: `--bus-radius-*`, `--bus-shadow-*`.
  - Animações: bloco `@keyframes` (`radarPulse`, `markerPulse`, `slideUp`,
    `fadeIn`) + classes `.animate-*` que as aplicam.
  - Customização do Leaflet (mapa) fica no fim do arquivo, sob o comentário
    "LEAFLET CUSTOMIZATION".
- **Componentes com glass/blur já implementado**: `grep -rn "backdrop-blur"
  src` para ver os 13+ arquivos que já usam — inclui `LiveMap.tsx`,
  `TransitHomeHub.tsx`, `TransitRouteResults.tsx`, `TransitRouteDetail.tsx`,
  `StationsExplorerPanel.tsx`, painéis de Favoritos/Notícias/PWA.
- **Convenção de cor semântica já validada**: âmbar = dado de GPS ao vivo.
  Não reatribuir esse significado.

## Android nativo (`native-android/app/src/main/java/com/busaisp/android/`)

- **`ui/theme/Color.kt`** — `object AppColors` (paleta dark-first: `BackgroundDark`,
  `SurfaceDark`, `LiveAmber`, `OnRouteEmerald`, `OffRouteRed`,
  `UserLocationBlue`) e `object LineColors` (cores oficiais de cada linha de
  Metrô/CPTM de SP — `MetroLinha1Azul` etc.).
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

## Ao adicionar uma cor/animação nova

1. Ela já existe com outro nome nesta lista? Reuse.
2. Ela é próxima o bastante de uma existente pra confundir (poucos tons de
   distância)? Reuse ou ajuste a existente, não crie uma terceira opção.
3. É genuinamente um papel semântico novo? Derive de um token base existente
   (ex.: uma variação de `--bus-bg`/`AppColors.BackgroundDark`) e dê um nome
   que descreva o papel, não a plataforma onde foi inventada.
