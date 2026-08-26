# App Nativo Android — Funções e Possibilidades (rascunho para decisão futura)

## Objetivo deste documento

Antes de decidir reescrever o BusaÍ SP como app nativo Android, listar exatamente
o que ele precisa fazer, o que já existe hoje (e pode ser reaproveitado sem
reescrever), e o que genuinamente falta — sem fabricar dado e sem assumir que
"nativo" resolve problemas que na verdade são de lógica/dado, não de plataforma.

**Este documento não implica início do rewrite.** É a etapa "crie as funções e
possibilidades" pedida antes de qualquer decisão de trocar de stack.

## Premissa que precisa ficar clara antes de decidir

Um app nativo (Kotlin/Swift ou React Native/Flutter) bate na **mesma API da
SPTrans Olho Vivo**, no **mesmo banco Supabase/GTFS**, com as **mesmas
limitações de dado em tempo real** que o app web já tem. Nativo não entrega:

- Previsão de chegada mais exata (isso depende só da SPTrans).
- Dado de Metrô/CPTM em tempo real (a SPTrans não expõe isso; Metrô/CPTM não
  têm uma API pública equivalente à Olho Vivo — hoje o app mostra status de
  linha via `/api/trilhos/status`, não posição de trem ao vivo).

O que nativo entrega de fato: app instalável de verdade (ícone, sem barra de
navegador), acesso mais direto a GPS/notificações em segundo plano, e
potencialmente melhor desempenho de renderização do mapa. O PWA que já está em
andamento no projeto entrega boa parte disso com uma fração do esforço.

## Funções essenciais — o que já existe e funciona com dado real

Reaproveitável sem reescrever nada do backend:

1. **Busca de rota multi-perna com baldeação** (`src/lib/routing.ts` +
   `supabase/*.sql`) — busca em ondas priorizada por proximidade real ao
   destino, filtro de linha noturna por horário, horário de saída programado
   ("sair agora" vs horário futuro).
2. **Posição de ônibus em tempo real** (SPTrans Olho Vivo, `/api/onibus`).
3. **Previsão real de chegada por parada e por linha** (`/api/onibus?tipo=previsao_parada`).
4. **"Linhas que passam neste ponto"** — toque no mapa acha a parada real mais
   próxima e lista as linhas com ETA real, ordenadas por chegada.
5. **Alertas de trânsito reais** (TomTom Traffic Incidents API).
6. **Notícias/ocorrências agregadas** (painel de Notícias ao Vivo).
7. **Favoritos** (Supabase).

Todo esse conjunto já é dado real, sem fabricação. Um app nativo reaproveitaria
100% disso via as mesmas rotas `/api/*` — não precisa recriar nada aqui.

## Funções que faltam ou estão incompletas hoje (gaps reais, não fabricação)

Estas são lacunas genuínas — não algo pra "inventar", mas pra implementar com
dado real ou deixar explicitamente marcado como indisponível:

- **Rota combinada ônibus + Metrô/CPTM em uma busca só.** Hoje `direct_routes_between`
  e `routes_from_stops` filtram `route_type = ônibus`. Incluir trilho exige:
  (a) horário programado do Metrô/CPTM (GTFS estático, se disponível
  publicamente) já que não há tempo real; (b) deixar claro na UI que a perna de
  trilho é "horário programado", não GPS ao vivo — nunca disfarçar uma como a
  outra.
- **Notificação em segundo plano** ("seu ônibus está chegando" mesmo com o app
  fechado) — depende de push notification, que webapp/PWA consegue fazer via
  Web Push, nativo via FCM. Não é exclusividade do nativo.
- **Detecção de linha de ônibus fora do trajeto esperado** ("Desviou da rota",
  como no Moovit) — exigiria comparar a posição GPS real do veículo contra o
  shape GTFS da linha; hoje o app não faz esse comparativo. Dado real
  (`gtfs_shapes` + posição ao vivo) já existe pra construir isso.
- **Confiabilidade de horário classificada** (ex.: "baseado em chegadas
  anteriores" vs "GPS ao vivo") — o Moovit distingue visualmente previsão por
  GPS de previsão por histórico. Hoje o app mistura os dois sem indicar a
  origem do dado ao usuário; isso é uma melhoria de honestidade de dado, não
  uma feature nova de plataforma.

## Recomendação de arquitetura, se/quando decidir ir nativo

Não reescrever o backend. Opções, da menor pra maior mudança de stack:

1. **PWA (em andamento)** — menor esforço, resolve instalação/ícone/tela
   cheia. Continua em Next.js/React, mesmo código.
2. **React Native / Expo** — reaproveita a maior parte da lógica de UI em
   TypeScript/React, consome as mesmas rotas `/api/*` via fetch, ganha GPS/push
   nativos de verdade. Menor risco de "recomeçar do zero" — a lógica de
   negócio (routing.ts, tipos) pode migrar quase sem alteração.
3. **Kotlin nativo puro** — maior controle e performance, mas reescreve toda a
   camada de UI do zero numa linguagem nova, sem reaproveitar o React
   existente. Só se justifica se o gargalo real for renderização do mapa (não
   é o caso hoje — os bugs relatados são de lógica de dados, não de
   performance).

## Fora de escopo deste documento

- Qualquer implementação — isto é só o levantamento de funções/possibilidades.
- Preço/prazo de cada opção de arquitetura.
- Decisão de loja (Play Store) e processo de publicação.
