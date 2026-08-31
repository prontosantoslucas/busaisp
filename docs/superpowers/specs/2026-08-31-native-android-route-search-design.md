# Migração para Android Nativo — Sub-projeto #2: Busca e Resultados de Rota

## Contexto

Continuação direta da migração nativa iniciada no sub-projeto #1 (Fundação +
Mapa ao Vivo, PR #1, ainda não mergeada). Este documento cobre o sub-projeto
#2 da decomposição original: busca de rota completa (origem/destino),
cálculo real via `/api/rotas`, lista de resultados e detalhe do itinerário —
incluindo os modos "agora / partir às / chegar até" que o backend já suporta
de verdade.

Como o usuário pediu para eu avançar pelos 5 sub-projetos com o mínimo de
interrupção possível, este spec foi escrito com as mesmas decisões
arquiteturais já validadas no sub-projeto #1 (Kotlin/Compose, Retrofit+Moshi,
Hilt, MapLibre onde houver mapa, TDD real em toda camada testável,
tratamento de erro honesto) — sem reabrir perguntas já respondidas. Só
registro aqui os pontos novos que este sub-projeto exige.

## Dados reais do backend (não inventados — lidos direto de `src/lib/routing.ts` e `src/app/api/rotas/route.ts`)

```
GET /api/rotas
  ?origem=<string> | &origLat=&origLng=
  &destino=<string> | &destLat=&destLng=
  &partidaMinutos=<int>      // minutos a partir de agora ("sair agora" = 0)
  &chegadaHorario=<HH:MM>    // alternativa: horário desejado de chegada
→ { success, data: RouteSearchResult, timestamp }

GET /api/rotas?tipo=sugestoes&q=<string>
→ { success, data: RouteLocation[] }   // autocomplete de endereço
```

```ts
interface RouteLocation { name; addressDetails?; lat; lng }

interface RouteSearchResult {
  primaryRoute: RoutePlan;
  alternatives: RoutePlan[];
}

interface RoutePlan {
  id; origin: RouteLocation; destination: RouteLocation;
  totalDurationMinutes; totalDistanceMeters;
  totalWalkDistanceMeters; totalWalkDurationMinutes; totalEstimatedSteps;
  departureHour; arrivalHour;
  departureStop: SPTransParada; arrivalStop: SPTransParada;
  recommendedLine: SPTransLinha;
  transferCount; transferPoints: TransferPoint[];
  nextBusEtaMinutes; departureEtas: number[];
  nextBusVehiclePrefix?;
  departureSuggestion; farePrice;
  fareType: 'BILHETE_UNICO'|'TOP_METRO'|'INTEGRACAO';
  carbonGrams;
  accuracyLevel: 'HIGH'|'MEDIUM'|'ESTIMATED';
  lastTelemetryText;
  trafficStatus: 'FLUINDO'|'MODERADO'|'INTENSO'; trafficDelayMinutes;
  mode?: 'BUS'|'RAIL';
  arrivalTimeUnreachable?: boolean;
  steps: RouteStep[];
}

interface RouteStep {
  type: 'WALK'|'BUS'|'RAIL'|'DESTINATION';
  instruction; durationMinutes; distanceMeters;
  busLine?; busDestination?; boardStopName?; alightStopName?; stopCount?;
  intermediateStops?: {name; lat; lng}[];
  nextBusEtaMinutes?; departureEtas?: number[];
  accuracyLevel?: 'HIGH'|'MEDIUM'|'ESTIMATED';
}
```

Isso já cobre metrô/CPTM (`type: 'RAIL'`, `mode: 'RAIL'`) — diferente do
sub-projeto #1, que só falava com `/api/onibus` (só ônibus). O app nativo
passa a ter rota combinada real (mesma limitação honesta do resto do
projeto: trilho é horário programado, nunca GPS ao vivo — `accuracyLevel`
já carrega essa informação, a UI deve exibir, nunca disfarçar).

## Decisão de navegação (nova neste sub-projeto)

O app hoje (sub-projeto #1) abre direto no Mapa ao Vivo, sem shell de
navegação com múltiplos destinos visíveis — o `BusaiDestinations` (Task 10
do sub-projeto #1) já foi projetado antevendo isso ("lugar natural pra
adicionar FAVORITES, ROUTE_SEARCH"). Decisão: adicionar uma barra de
navegação inferior mínima com 2 destinos — **Mapa** (existente) e **Rotas**
(novo) — usando `NavigationBar`/`NavigationBarItem` do Material3, consistente
com o resto do design system já aprovado.

## Escopo deste sub-projeto

**Critério de sucesso**: abrir a aba Rotas, digitar/selecionar origem e
destino (com autocomplete real), escolher "agora" / "partir às" / "chegar
até", ver resultados reais (múltiplas opções, incluindo combinações com
metrô/CPTM quando existirem), tocar num resultado e ver o itinerário
completo passo a passo.

**Entra**:
- Barra de navegação inferior (Mapa / Rotas).
- Tela de busca: campos de origem/destino com autocomplete real
  (`/api/rotas?tipo=sugestoes`), opção "usar minha localização atual" pra
  origem (reaproveita `LocationClient` do sub-projeto #1), seletor de horário
  com os 3 modos reais (agora / partir às / chegar até).
- Tela de resultados: lista de `RoutePlan` (duração, baldeações, tarifa,
  status de trânsito, indicação clara de METRÔ/CPTM vs ônibus).
- Tela de detalhe: passo a passo real (`RouteStep[]`), com o mesmo tipo de
  honestidade sobre origem do dado (GPS ao vivo vs horário programado) já
  usada no resto do projeto.

**Não entra** (fica pra sub-projetos futuros): favoritar rota, navegação
ativa com avisos de voz/detecção de embarque, notificação em segundo plano.

## Arquitetura técnica

Mesmo padrão do sub-projeto #1 — repositório + DTOs Moshi + Hilt + TDD real
com MockWebServer, ViewModel com `StateFlow`, mesmo tratamento de erro
reforçado (`CancellationException` relançada, `IOException`/`HttpException`/
`JsonDataException`/`Exception` viram estado de erro honesto, nunca dado
fabricado nem crash). Novos destinos no `BusaiNavHost` existente
(`ROUTE_SEARCH`, `ROUTE_RESULTS`, `ROUTE_DETAIL`), reaproveitando
`BusaiSPTheme`/`AppColors`/`IBMPlex*` sem mudança.

## Fora de escopo (explícito)

- Favoritos, navegação ativa, segundo plano — sub-projetos #3/#4.
- Login/conta de usuário.
- iOS.
