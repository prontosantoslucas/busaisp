# HANDOFF — BusaÍ SP (estado atual e o que falta)

Documento de passagem de contexto. Escrito em 2026-08-21.

---

## 1. O que já está PRONTO e em produção

**Fase 1 — Fundação de dados reais (GTFS)** está completa, testada e já foi enviada para o
GitHub (`master` = commit `3c1918d`), então a Vercel deve ter feito deploy.

O que ela entregou:

- **22.241 paradas e 1.361 linhas reais de toda São Paulo** importadas do GTFS oficial da
  SPTrans (via espelho gratuito do Transitland) para dentro do Supabase.
- Tabelas `gtfs_*` no Supabase com índice geográfico PostGIS (`supabase/gtfs_schema.sql`).
- Duas funções SQL de consulta já **aplicadas e vivas** no banco (`supabase/gtfs_functions.sql`):
  - `nearby_stops(in_lat, in_lng, radius_meters, max_results)` — paradas perto de uma coordenada.
  - `direct_routes_between(origin_stop_ids, dest_stop_ids, max_results, route_types)` — linhas
    diretas conectando dois grupos de paradas. Filtra só ônibus por padrão (`route_types = array[3]`).
- Script de importação: `npm run import:gtfs` (`scripts/import-gtfs.ts`). Já foi rodado com sucesso.
- `src/lib/gtfs.ts` — wrapper TypeScript tipado das funções SQL.
- `src/lib/routing.ts` — o planejador de rotas agora usa dados reais (não mais os dados fixos
  de demonstração), com previsão em tempo real da API Olho Vivo por cima.
- 32 testes automatizados passando (`npm test`, usa vitest).

Documentação: `docs/superpowers/specs/2026-08-21-gtfs-data-foundation-design.md` e
`docs/superpowers/plans/2026-08-21-gtfs-data-foundation.md`.

### Limitação conhecida e aceita da Fase 1

Só encontra viagens **diretas** (um único ônibus, sem baldeação). Quando não existe linha
direta entre origem e destino, o app mostra honestamente o erro "Nenhuma linha direta
encontrada conectando a origem ao destino. Rotas com baldeação ainda não são suportadas."
Isso **não é bug** — é o escopo definido da Fase 1. Resolver isso é a Fase 2 (abaixo).

---

## 2. RESTRIÇÃO CRÍTICA DE AMBIENTE (leia antes de mexer no banco)

O ambiente sandbox do agente de IA **não consegue conectar em Postgres direto (porta 5432)** —
só HTTPS funciona. DNS de `db.<projeto>.supabase.co` não resolve.

Consequências práticas:

- **Todo SQL novo (DDL) tem que ser aplicado manualmente** pelo humano, colando no SQL Editor
  do Supabase: `https://supabase.com/dashboard/project/andnuavykwjcivlesnky/sql`
- O agente pode escrever o arquivo `.sql` e o teste, mas não pode aplicar nem verificar sozinho.
- A importação do GTFS (`npm run import:gtfs`) precisa rodar no **terminal do humano**, não no
  sandbox. Isso já foi feito e funcionou.
- A connection string que funciona é a do **Connection Pooler** (porta 6543), não a conexão
  direta (5432, que é IPv6-only e falha na maioria das redes domésticas). Está no `.env.local`.

Ao aplicar SQL que **muda a assinatura** de uma função existente: `create or replace function`
NÃO substitui a versão antiga se a lista de parâmetros mudou — ele cria uma segunda versão
sobreposta, e o PostgREST dá erro de ambiguidade. Sempre faça `drop function if exists
public.nome(tipos_antigos);` antes. Já pisamos nesse rastelo uma vez.

---

## 3. PRÓXIMA TAREFA IMEDIATA: Fase 2 — Baldeação

Branch de trabalho já criada: `worktree-transfer-routing`
(worktree em `.claude/worktrees/transfer-routing`).

**Spec:** `docs/superpowers/specs/2026-08-21-transfer-routing-design.md`
**Plano detalhado com todo o código pronto:** `docs/superpowers/plans/2026-08-21-transfer-routing.md`

O plano tem 6 tarefas, cada uma com o código exato para copiar. Estado atual:

### Tarefa 1 — função SQL `routes_from_stops` — ⏸️ BLOQUEADA, esperando ação humana

- ✅ O SQL já está escrito no fim de `supabase/gtfs_functions.sql` (linhas ~88-141), na
  branch `worktree-transfer-routing`.
- ✅ O teste `scripts/gtfs/routes-from-stops.smoke.test.ts` já está escrito e falhando
  (estado TDD "vermelho" correto — a função não existe no banco ainda).
- ❌ **AÇÃO NECESSÁRIA:** um humano precisa colar esse bloco SQL no SQL Editor do Supabase
  e executar. É aditivo (não altera as funções que já estão lá), seguro de rodar.
- Depois de aplicar: `npm test -- routes-from-stops.smoke` deve dar 2 passed, e então commitar.

### Tarefa 2 — wrapper `findRoutesFromStops` em `src/lib/gtfs.ts` — ✅ JÁ IMPLEMENTADO

Foi feito adiantado. O código já está no fim de `src/lib/gtfs.ts` (interface `ReachableRoute` +
função `findRoutesFromStops`). **Falta:** os dois testes descritos na Tarefa 2 do plano
(adicionar em `src/lib/gtfs.test.ts`) e o commit.

### Tarefas 3, 4, 5, 6 — ⬜ NÃO INICIADAS

Todas com código completo especificado no plano. Resumo do que fazem:

- **Tarefa 3:** substituir `buildPlanForLine` (que só monta viagem de 1 perna) por
  `buildMultiLegPlan` (monta viagem de N pernas; viagem direta é só o caso de 1 perna).
  Adiciona campo `transferCount` em `RoutePlan`.
- **Tarefa 4:** o coração da fase — busca em ondas (BFS por rodadas) em `calculateRoute`.
  Rodada 1 = rotas diretas; rodada 2 = expande a fronteira de paradas alcançáveis e testa
  conexão direta com o destino (= 1 baldeação); e assim por diante até o limite de segurança.
  Também muda o raio de busca de paradas de 600m para **2.500m** e a ordenação.
- **Tarefa 5:** mostrar o selo "N baldeações" na lista de alternativas da interface.
- **Tarefa 6:** verificação manual no navegador (regressão + caso novo de baldeação).

### Decisões de produto já tomadas pelo usuário (NÃO mudar sem perguntar)

1. **Raio de busca de paradas: 2,5 km** (era 600 m). Permite considerar descer mais longe e
   caminhar mais, se isso resultar em viagem mais rápida.
2. **Ordenação das alternativas:** tempo total estimado primeiro → depois distância a pé →
   depois número de baldeações. (Isso substitui uma decisão anterior de "menos baldeações
   primeiro" — o usuário mudou de ideia depois, confirmado explicitamente.)
3. Como a ordenação é por tempo (não por número de trocas), a busca **não pode parar** na
   primeira rodada que achar resultado — uma rota com 1 baldeação pode ser mais rápida que
   uma direta com 2 km de caminhada. Buscar até o limite, depois ordenar tudo junto.
4. **Sem limite rígido de baldeações** conceitualmente, mas com limite de segurança técnico
   (4 rodadas = até 3 trocas) para a busca não explodir. Isso foi explicado ao usuário e aceito.
5. **Metrô/CPTM fora das rotas** por enquanto (filtro `route_type = 3` = só ônibus). O feed
   do Transitland inclui a Linha 2 do Metrô, e ela foi deliberadamente filtrada — trilhos como
   modal integrado é fase futura. O parâmetro `route_types` já existe nas funções SQL para
   quando isso for habilitado, sem precisar de migração nova.

---

## 4. Fila de pedidos do usuário ainda NÃO iniciados

Em ordem de quando foram pedidos:

### 4.1. Destinos mais procurados (rastreamento real)

Substituir os atalhos fixos do planejador ("Rua Flor de Maio", "Jd. Fontális", etc.) por
destinos genuinamente mais buscados, **rastreados de verdade** (o usuário rejeitou a
alternativa de lista fixa).

Desenho já aprovado pelo usuário:

- Nova tabela `search_events` no Supabase: nome do destino, lat/lng, timestamp.
- Gravar em toda chamada de `/api/rotas` — **inclusive quando a busca falha** (falha ainda
  reflete demanda real da pessoa).
- Consulta agregando por nome de destino, contando ocorrências, top 5.
- O `RoutePlanner` busca esses 5 e mostra como atalhos.
- **Problema do início vazio:** no primeiro dia não há histórico. Manter destinos populares
  reais de SP (Shopping Ibirapuera, Av. Paulista, Terminal Tietê, Sh. Morumbi) como reserva
  até haver dados de uso suficientes.

Branch já criada mas vazia: `worktree-popular-destinations`.

### 4.2. Tirar o "modo demonstrativo"

O usuário pediu para remover. Contexto técnico: `src/lib/sptrans.ts` ainda cai em dados
fabricados (`getMockPrevisaoParada`, `getMockVeiculos` de `src/lib/mockData.ts`) quando a
autenticação na SPTrans falha inteiramente. Há um indicador "Modo Demonstração" no header
(`isMockMode` em `src/app/page.tsx`, alimentado por `/api/onibus?tipo=status_auth`).

Atenção: na Fase 1 já corrigimos `buscarPrevisaoParada` para **não** mascarar "esta parada
específica não tem previsão agora" como dado falso — isso agora retorna `null` honestamente.
Mas as outras quatro funções de `sptrans.ts` (`buscarLinhas`, `buscarParadas`,
`buscarPosicaoLinha`, `buscarPrevisaoLinha`) ainda retornam mock em caso de falha e todas
reportam `isMock: false` (mentira). Isso foi levantado numa revisão de código e ficou como
dívida técnica anotada. Remover o modo demo = limpar isso tudo de forma coerente.

### 4.3. Novo layout (precisa de discussão de design antes)

Pedido do usuário, textual: "estou pensando em um layout diferente, quando aberto mostrar o
mapa em cima mostra o destino e uma aba ao lado para procurar somente uma linha específica."

Não implementar direto — é mudança estrutural de interface, merece conversa de design própria
(o usuário só descreveu a ideia em uma frase).

### 4.4. Tempo até chegar ao ponto

O usuário pediu "calcule o tempo também até chegar no ponto que o usuário está, assim como os
concorrentes." **Isso já existe e funciona** — é o texto "Saia a pé em ~X min para chegar ao
ponto..." gerado em `buildPlanForLine`/`buildMultiLegPlan` (campo `departureSuggestion`), mais
o passo WALK com `durationMinutes`/`distanceMeters`/`estimatedSteps`. Se o usuário insistir,
provavelmente ele quer isso **mais visível na interface** (ex: destaque no card de cada
alternativa, não só no detalhe da rota) — vale confirmar com ele antes de mexer.

### 4.5. Plataforma multi-cidade (nível nacional) — pesquisa já feita

O usuário fez uma pesquisa própria bem completa e pediu para transformar em plano. Resumo do
que ele levantou:

- **Dificuldade de código/arquitetura:** MÉDIA (padrão Adapter/Provider + detecção por GPS).
- **Dificuldade de dados no Brasil:** ALTA / FRAGMENTADA — a barreira não é programação, é a
  disponibilidade de API de GPS em tempo real de cada prefeitura.
- GTFS estático: quase toda capital brasileira publica de graça.
- GPS em tempo real gratuito e aberto: **São Paulo** (SPTrans Olho Vivo, com token),
  **Rio de Janeiro** (`dados.mobilidade.rio/gps/sppo` e BRT, aberto sem chave),
  **Curitiba** (URBS, WebService aberto).
- GPS fechado (só GTFS programado): Fortaleza (ETUFOR), Salvador. Parcial: BH, Porto Alegre,
  Brasília.
- Arquitetura proposta por ele: `CityRegistry` com bounding box por cidade + detecção
  automática por GPS + seletor manual no topo + interface `TransitProvider` comum
  (`searchLines`, `getLineVehicles`, `getStopPredictions`, `calculateRoute`) com um adapter
  por cidade.
- Próximo passo que ele sugeriu: seletor de cidades + camada GTFS multi-tenant.

Isso é um projeto grande, provavelmente vários ciclos. Ainda não foi desenhado formalmente.

---

## 5. Bugs já corrigidos (não re-investigar)

Encontrados testando ao vivo com dados reais, todos já corrigidos e commitados na `master`:

1. **Badge de linha duplicando sufixo** ("2012-10-10" em vez de "2012-10"): dados reais do GTFS
   já vêm com o formato completo `"NNNN-NN"` em `route_short_name`, e o código somava outro
   `-10`. Corrigido em `directRouteToLinha` (`src/lib/routing.ts`), separando no último `-`.
2. **"-1 min" cru na tela:** `-1` é o sentinela interno de "sem previsão em tempo real". Estava
   sendo renderizado direto. Corrigido com guardas `>= 0` em 4 lugares (`RoutePlanner.tsx`,
   `page.tsx`, `LiveMap.tsx` x2).
3. **Busca falhando em silêncio:** quando `/api/rotas` retornava `success: false`, a interface
   não fazia nada e deixava o resultado antigo na tela (parecia que o botão não funcionava).
   Corrigido com estado `calculationError` + banner vermelho em `RoutePlanner.tsx`.
4. **Banner de erro aparecendo no primeiro carregamento:** o cálculo automático de rota no
   mount agora passa `{ silent: true }` para não assustar quem acabou de abrir o app.
5. **Localização do usuário saindo da tela:** o `fitBounds` só considerava os veículos da linha
   selecionada. Corrigido incluindo `userCoords` nos bounds (`LiveMap.tsx`). Ícone também
   trocado para uma bússola 🧭 maior, a pedido do usuário.
6. **`calendar_dates.txt` obrigatório no import:** é opcional no padrão GTFS e o feed da SPTrans
   não inclui. Corrigido em `scripts/import-gtfs.ts` com parâmetro `required`.

---

## 6. Como rodar o projeto

```bash
# Na raiz do repo (master, Fase 1 pronta):
npm install
npm run dev          # sobe em localhost:3000
npm test             # 32 testes
npm run build        # verificar antes de deploy (passa hoje)

# Para trabalhar na Fase 2:
cd .claude/worktrees/transfer-routing
npm install
# copiar o .env.local da raiz para cá (não é versionado no git)
npm test
```

O `.env.local` (não versionado) precisa de: `SPTRANS_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TRANSITLAND_API_KEY`,
`SUPABASE_DB_URL` (a do pooler, porta 6543). Ver `.env.example`.

**Deploy:** a Vercel builda automaticamente ao dar push na `master`. Confirme que as variáveis
de ambiente estão configuradas no painel da Vercel também, senão o app cai no modo degradado.

---

## 7. Dica de processo

O usuário pediu explicitamente para **ir mais rápido** nas implementações — menos cerimônia de
processo (spec → plano → subagente → revisão dupla por tarefa), mais implementação direta,
especialmente quando o plano já tem o código especificado. Vale respeitar isso.
