# Radar pulse no botão de Localização Atual (mapa nativo Android)

## Pedido
Adicionar uma animação de pulso tipo radar no botão de localização atual do
mapa ao vivo (`native-android/app/src/main/java/com/busaisp/android/ui/map/MapScreen.kt`,
o `FloatingPillButton` do `Icons.Filled.MyLocation`).

## O que foi mudado

### 1. `native-android/app/src/main/java/com/busaisp/android/ui/map/components/FloatingPillButton.kt`
- Adicionados dois novos parâmetros opcionais (com valor padrão, então nenhum
  outro call-site precisa mudar): `showRadarPulse: Boolean = false` e
  `radarPulseColor: Color = contentColor`.
- Nova extensão privada `Modifier.radarPulse(...)` que usa
  `rememberInfiniteTransition` + `animateFloat` (0f -> 1f, `tween` linear de
  1800ms, `RepeatMode.Restart`) para animar um valor de progresso contínuo.
- Dentro de `drawBehind`, desenha 3 anéis (`ringCount = 3`) defasados em fase
  (cada um a 1/3 de ciclo do anterior), cada um expandindo o raio de
  `baseRadius` até `baseRadius * 1.9` e desvanecendo a opacidade de `0.45`
  até `0`, criando o efeito clássico de "ping" de radar/sonar em loop.
- O desenho é feito com `drawBehind`, que **não** altera o tamanho medido do
  componente — os anéis são pintados fora dos limites do layout do botão sem
  aumentar o espaço que ele ocupa na `Column` de controles flutuantes. Isso
  evita que o botão "Radar de Calor" logo acima se desalinhe.
- `showRadarPulse` é opt-in por design: o botão continua 100% reutilizável e
  sem esse efeito por padrão; só é ativado explicitamente onde faz sentido
  (ação contínua/"ao vivo").

### 2. `native-android/app/src/main/java/com/busaisp/android/ui/map/MapScreen.kt`
- No `FloatingPillButton` de `Icons.Filled.MyLocation`, passados
  `showRadarPulse = true` e `radarPulseColor = AppColors.UserLocationBlue`.
- A cor escolhida (`AppColors.UserLocationBlue`, `#3B82F6`) é a mesma já
  usada para o ponto do usuário desenhado no mapa (`LiveBusMap.kt`), então o
  pulso do botão reforça visualmente a mesma linguagem de "sua localização"
  já estabelecida no app, em vez de introduzir uma cor nova.
- O botão "Radar de Calor de Congestionamento" (heatmap) não foi alterado —
  o pedido era especificamente sobre o botão de localização atual.

## Por quê
O botão de localização é uma ação "ao vivo"/contínua (centraliza o mapa na
posição atual do usuário), então um pulso sutil e recorrente ajuda a
comunicar isso e chama atenção do usuário para esse controle sem exigir
texto adicional — um padrão comum em apps de mapa (Uber, Waze, Google Maps)
para o botão de "minha localização". A implementação foi feita como um
parâmetro opcional no componente reutilizável `FloatingPillButton` (em vez
de duplicar código só para o botão de localização) para manter o componente
único e reaproveitável por outros botões "ao vivo" no futuro, se necessário.

## Verificação de build
Rodado a partir de `native-android/`:

```
./gradlew.bat :app:compileDebugKotlin
```

Resultado: **BUILD SUCCESSFUL** (2m 18s, 17 tarefas executadas). Os únicos
avisos (`w:`) impressos são warnings de depreciação pré-existentes em outros
arquivos (`VoiceService.kt`, `BusaiNavHost.kt`, `RouteDetailScreen.kt`,
`RouteResultsScreen.kt` — todos sobre `Locale(String, String)` e
`Icons.Filled.ArrowBack` deprecados), não relacionados a esta mudança.
Nenhum erro de compilação Kotlin.

## Arquivos alterados
- `native-android/app/src/main/java/com/busaisp/android/ui/map/components/FloatingPillButton.kt`
- `native-android/app/src/main/java/com/busaisp/android/ui/map/MapScreen.kt`

O diff completo está em `changes.diff` nesta mesma pasta, e o conteúdo final
de cada arquivo alterado está copiado em `files/<mesmo caminho relativo>`.
