# Fase 1 — Fundação de Dados Reais (GTFS) para Roteirização em Toda São Paulo

## Contexto e roteiro geral

O objetivo de fundo (declarado pelo usuário) é evoluir o BusaÍ SP de um protótipo de demonstração para um planejador de viagens multimodal real, no estilo Moovit/CittaMobi, gratuito, cobrindo toda a cidade de São Paulo. Esse objetivo é grande demais para um único ciclo de design/implementação e foi decomposto no seguinte roteiro:

1. **Fase 1 (este documento) — Fundação de dados reais (GTFS)**: base de paradas/linhas/horários reais de toda SP, com busca geográfica real. Sem baldeação ainda.
2. **Fase 2 — Motor de busca multimodal com baldeação**: busca de viagens com 1-2 trocas de ônibus, ranqueadas por tempo total.
3. **Fase 3 — Planejamento por horário**: "sair a que horas" / "chegar até que horas", usando horário programado do GTFS (funciona até para o dia seguinte), com sobreposição de tempo real quando a viagem é próxima do momento atual.
4. **Fase 4 — Preferências de trajeto**: velocidade de caminhada (lento/normal/rápido), prioridade de ranqueamento (mais rápido vs. menos baldeações vs. menos caminhada), filtro de acessibilidade (cadeirante).
5. **Fase 5 (futuro, não comprometida)**: trilhos (Metrô/CPTM) como perna integrada da rota multimodal; alertas de "hora de desembarcar".

**Explicitamente fora de escopo em todo o roteiro**, por decisão do usuário: compra de passagem, recarga de bilhete único ou qualquer integração de pagamento. Isso exigiria acordos comerciais com operadoras e não é compatível com "melhorado de forma gratuita".

Este documento cobre **apenas a Fase 1**.

## Problema

Hoje (`src/lib/routing.ts`, `src/lib/mockData.ts`) a busca de rota:
- Usa uma lista fixa de 8 paradas (`MOCK_PARADAS`) e 4 linhas "candidatas" hardcoded (`MOCK_LINHAS[0]`, `[3]`, `[4]`, `[2]`) — cobre apenas o corredor Jd. Fontális/Tremembé ↔ Center Norte/Santana/Tucuruvi.
- Não faz nenhuma busca real por proximidade geográfica para outras regiões de SP.
- A API Olho Vivo da SPTrans (`src/lib/sptrans.ts`) só fornece posição/previsão em tempo real por código de parada/linha já conhecido — **não tem busca de paradas por coordenada** e **não tem grade horária programada**.

Sem uma base própria de paradas/linhas/horários reais, nenhuma das fases seguintes (baldeação, horário de saída/chegada, preferências) pode funcionar de verdade fora do corredor de demonstração atual.

## Fonte dos dados

- **Fonte primária de importação**: espelho gratuito e versionado do GTFS oficial da SPTrans no Transitland (Onestop ID `f-6gy-sptrans`), atualizado diariamente, com checksum de verificação por versão. Não exige o fluxo de login manual em navegador do portal da SPTrans.
- **Fonte oficial/autoridade**: portal SPTrans Desenvolvedores (`sptrans.com.br/desenvolvedores`), endpoint `BaixarGTFS`, disponível para quem já tem conta cadastrada (mesma conta usada para o token da Olho Vivo). Usado como fallback caso o espelho do Transitland fique indisponível ou desatualizado.
- Formato: GTFS estático padrão — arquivos `agency.txt`, `routes.txt`, `stops.txt`, `trips.txt`, `stop_times.txt`, `calendar.txt`, `calendar_dates.txt` (e possivelmente `shapes.txt`, `fare_*.txt` que serão ignorados nesta fase).

## Arquitetura

### 1. Schema no Supabase (Postgres)

Habilitar a extensão `postgis` (gratuita em todos os planos Supabase, incluindo o free tier) e criar tabelas espelhando o padrão GTFS, prefixadas `gtfs_`:

- `gtfs_agency` (id, name, url, timezone)
- `gtfs_routes` (route_id, agency_id, short_name, long_name, route_type)
- `gtfs_stops` (stop_id, name, lat, lng, geog `geography(Point, 4326)` gerado a partir de lat/lng, com índice **GIST**)
- `gtfs_trips` (trip_id, route_id, service_id, headsign, direction_id)
- `gtfs_stop_times` (trip_id, stop_id, stop_sequence, arrival_time, departure_time) — chave composta (trip_id, stop_sequence)
- `gtfs_calendar` (service_id, dias da semana booleanos, start_date, end_date)
- `gtfs_calendar_dates` (service_id, date, exception_type) — exceções de feriado/operação especial

Todas as tabelas são somente-leitura pela aplicação (RLS: `select` público, sem `insert`/`update`/`delete` pelo cliente — a escrita só ocorre pelo script de importação usando a service role key, fora do navegador).

**Decisão de tamanho**: `stop_times` de uma cidade inteira pode ter de centenas de milhares a alguns milhões de linhas. Antes de finalizar o import definitivo, o script de importação deve reportar o tamanho real (linhas e MB) e comparar com o limite de 500MB do plano free do Supabase. Se não couber:
- Primeira tentativa de mitigação: remover colunas/índices não essenciais e usar tipos de dados compactos (ex: `smallint` para `stop_sequence`, `time` em vez de `text` para horários).
- Segunda tentativa: agregar `stop_times` em padrões de frequência (ex: "a cada N minutos entre HH:MM e HH:MM" por serviço/dia-tipo) em vez de um registro por horário individual — perde-se precisão de "primeiro ônibus exato" em troca de caber no free tier. Essa decisão fica documentada no momento em que for tomada, com os números reais em mãos.

### 2. Script de importação

Novo script (`scripts/import-gtfs.ts` ou `.mjs`, executado via `node`/`tsx`, não faz parte do build da aplicação):
1. Baixa o `.zip` GTFS do Transitland (com fallback documentado para o portal SPTrans).
2. Extrai e faz parse dos arquivos `.txt` (CSV).
3. Trunca e recarrega (`TRUNCATE` + `INSERT`) as tabelas `gtfs_*` no Supabase via service role key (nunca exposta ao cliente — mesma politica de segurança já usada para o token SPTrans).
4. Roda sob demanda (manual), não em produção automaticamente. Documentar no README como e quando reexecutar (o feed é atualizado diariamente pela SPTrans, mas não precisamos re-importar com essa frequência).

### 3. Funções de consulta (SQL / RPC no Supabase)

- `nearby_stops(lat, lng, radius_meters)`: `ST_DWithin` sobre `gtfs_stops.geog`, ordenado por distância — substitui a ordenação em memória sobre `MOCK_PARADAS`.
- `direct_routes_between(origin_stop_ids[], dest_stop_ids[])`: busca `trips`/`stop_times` cujo `stop_sequence` visita algum `origin_stop_id` antes de algum `dest_stop_id` na mesma viagem — encontra linhas diretas reais conectando as duas regiões, com o horário programado do próximo evento relevante.

### 4. Integração no backend da aplicação

- Novo módulo `src/lib/gtfs.ts`: client Supabase (server-side) chamando as funções RPC acima.
- `src/lib/routing.ts`: substituir a busca em `MOCK_PARADAS` (linhas 375-385) por `nearby_stops` real, e substituir a lista fixa `candidateLines` (linhas 388-417) por `direct_routes_between` real.
- `buildPlanForLine` continua com a mesma lógica de cálculo de caminhada/tempo — não muda nesta fase, só a origem dos dados (paradas e linhas reais em vez de fixas).
- `buscarPrevisaoParada`/`buscarPosicaoLinha` (`src/lib/sptrans.ts`) continuam usados por cima, agora com códigos de parada/linha descobertos dinamicamente, e o *fallback* para dados mock (`getMockPrevisaoParada`/`getMockVeiculos`) só deve acionar se a chamada real à Olho Vivo falhar — não deve mais ser o caminho normal fora do corredor de demonstração.

## Tratamento de erros

- Import falho ou parcial: o script deve abortar sem sobrescrever os dados existentes (transação), e logar quais arquivos/linhas falharam.
- Busca sem paradas próximas (região sem cobertura de dados no feed, ou coordenada fora de SP): a API retorna lista vazia com uma mensagem clara, em vez de cair no comportamento atual de "fallback silencioso para os 8 pontos fixos".
- Indisponibilidade do Supabase/GTFS: erro explícito na resposta da API `/api/rotas`, sem inventar dados — hoje o código tende a mascarar falhas retornando mock; isso deixa de ser aceitável para busca de paradas/linhas reais (a Olho Vivo em tempo real continua com fallback a mock, como já é hoje, pois isso é uma decisão de produto já existente e não está sendo revisada aqui).

## Testes

- Testar `nearby_stops` com coordenadas conhecidas de pelo menos 3 regiões distintas de SP (não só o corredor atual) e confirmar que retornam paradas reais plausíveis (nome, endereço, distância coerente).
- Testar `direct_routes_between` com um par origem/destino do corredor atual (Jd. Fontális ↔ Center Norte) e confirmar que a linha 1703-10 aparece — validação de regressão contra o comportamento atual.
- Testar um par origem/destino fora do corredor atual (ex: Av. Paulista ↔ Vila Madalena) e confirmar que retorna linha(s) reais plausíveis.
- Validar visualmente no app (`npm run dev`) que o Planejador de Rotas (`RoutePlanner.tsx`) mostra opções corretas para um destino fora da região de demonstração atual, algo impossível de testar corretamente hoje.

## Fora de escopo (fica para as próximas fases do roteiro)

- Baldeação/troca de ônibus (Fase 2).
- Cálculo de "hora de saída"/"hora de chegada"/"primeiro ônibus" (Fase 3) — os dados de horário programado ficam disponíveis nesta fase, mas a lógica de solver ainda não é implementada.
- Preferência de velocidade de caminhada e de ranqueamento por menos baldeações (Fase 4).
- Trilhos (Metrô/CPTM) como parte da rota multimodal, alertas de desembarque, filtro de acessibilidade (Fase 5).
- Qualquer funcionalidade de pagamento/bilhetagem (excluído do roteiro inteiro).
