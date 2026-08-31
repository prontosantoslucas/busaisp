# Migração para Android Nativo — Sub-projeto #3: Navegação Ativa

## Contexto

Terceira frente da migração nativa (sub-projetos #1 e #2 completos, PR #1 e
PR #2 abertos). Este spec é mais enxuto que os anteriores por pedido
explícito do usuário (ir mais rápido mantendo qualidade) — a arquitetura,
convenções de erro, TDD e processo de revisão já estão validados nos
sub-projetos anteriores e não são redecididos aqui, só aplicados.

## Dados e lógica reais a portar (não inventados — lidos de `src/`)

**`RoutePlan.polyline`** (`src/lib/routing.ts`), ainda não modelado no app
nativo (sub-projeto #2 deliberadamente deixou de fora por YAGNI — agora é
necessário):
```ts
polyline: {
  walkToStop: [number, number][];  // [lat, lng][]
  transit: [number, number][];
  walkToDest: [number, number][];
}
```

**Detecção de embarque** (`src/app/page.tsx`): usuário considerado embarcado
quando a posição GPS dele fica a menos de **45 metros** de qualquer veículo
da linha ativa (`getDistanceMeters`, já existe em `GeoInterpolation.kt` como
parte da fórmula de interpolação — reaproveitar, não reimplementar).

**Detecção de desvio de rota** (`src/app/page.tsx` + `src/lib/geoUtils.ts`):
depois de embarcado, compara a posição GPS real contra `polyline.transit`
via `distanceToPolylineMeters` (distância ponto-a-segmento com projeção
equirretangular local — fórmula real em `geoUtils.ts:20-77`, portar
fielmente para Kotlin). Limiar: **250 metros**.

**Mensagens de voz reais** (`src/lib/voiceService.ts`):
- Embarque: `"Embarque no {ônibus|metrô|trem} linha {X} com destino a {Y}."`
- Baldeação: `"Desembarque e faça baldeação. {instruções}"`
- Desvio: `"Atenção: você parece ter saído do trajeto planejado."`
- Debounce: não repetir a mesma frase antes de 30 segundos.

## Decisão já tomada (registrada no spec do sub-projeto #1, repetida aqui por clareza)

Segundo plano via **Foreground Service com notificação persistente real**
(mesmo padrão Uber/99/Waze) — SIM, faz parte deste sub-projeto.
Isenção de otimização de bateria (`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`) —
NÃO, risco real de rejeição na Google Play, não pedir sem o usuário
confirmar explicitamente de novo.

## Limitação honesta herdada do app web (não é regressão, é paridade)

Só a primeira perna da viagem tem embarque/desvio rastreado automaticamente
— `RouteStep` não carrega o código de linha (`cl`) necessário pra trocar
automaticamente qual veículo é comparado depois de uma baldeação real. Mesma
limitação documentada no app web; não resolver aqui, só não fingir que
resolve.

## Escopo

**Critério de sucesso**: na tela de detalhe de rota, tocar "Iniciar
percurso" abre uma tela de navegação ativa que mostra o status real
(aguardando embarque / a bordo / fora da rota), com notificação persistente
enquanto ativo, e avisos de voz reais nos momentos certos.

**Entra**:
- `distanceToPolylineMeters` portado para `GeoInterpolation.kt` (mesmo
  arquivo de `interpolatePosition`, mesma categoria de função geométrica
  pura e testável).
- `RoutePlan.polyline` modelado (DTO + domínio), reaproveitando o
  `RouteRepositoryImpl` já existente.
- `VoiceService` — wrapper de `android.speech.tts.TextToSpeech`, mensagens e
  debounce de 30s idênticos ao app web.
- `ActiveNavigationViewModel` — orquestra polling de veículos (reaproveita
  `BusRepository` do sub-projeto #1) + GPS do usuário (reaproveita
  `LocationClient`), aplica as regras de embarque/desvio acima, expõe estado
  de UI.
- Foreground Service com notificação persistente real.
- `ActiveNavigationScreen` — reaproveita `LiveBusMap` (sub-projeto #1) como
  mapa de fundo, com um card de status sobreposto.
- Botão "Iniciar percurso" em `RouteDetailScreen` (sub-projeto #2).

**Não entra**: retargeting automático de veículo após baldeação real (ver
limitação herdada acima), isenção de bateria, qualquer UI de favoritos.

## Arquitetura

Mesmo padrão dos sub-projetos #1/#2: TDD onde há lógica pura/testável
(matemática de polilinha, orquestração do ViewModel), tratamento de erro
honesto (nunca fabricar posição/estado), Hilt para DI, `StateFlow` para
estado de UI. Processo de revisão passa a usar **um revisor combinado**
(conformidade com spec + qualidade de código numa passada só) em vez de
dois revisores separados, e tarefas relacionadas são implementadas em lote
quando só compilam juntas — mudança de processo pedida explicitamente pelo
usuário para ganhar velocidade sem abrir mão da revisão independente em si.
