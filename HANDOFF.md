# HANDOFF — BusaÍ SP (estado atual e o que falta)

Documento de passagem de contexto. Última atualização em 2026-08-31 pela
Claude — escrito para que qualquer ferramenta de IA (Gemini, outra sessão
Claude, etc.) ou um humano consiga continuar exatamente de onde parou, mesmo
sem acesso ao histórico de conversa que gerou este estado.

---

# PARTE A — Migração para Android Nativo (trabalho em andamento, prioridade atual)

## A.0. O que é isto e por que existe

O app web (Next.js/React, `src/`) é o produto em produção — continua no ar
normalmente e não foi tocado por este trabalho. Depois de comparar esse app
diretamente contra Uber/Waze/99/InDrive, o usuário decidiu migrar para um
**app Android nativo** (Kotlin + Jetpack Compose) construído do zero,
reaproveitando 100% do backend existente (`https://busaisp.vercel.app/api/*`)
sem reescrever nenhuma lógica de roteamento/GTFS. iOS fica para depois.

A migração foi decomposta em **5 sub-projetos independentes**, cada um com
seu próprio ciclo spec → plano → implementação → PR:

1. ✅ **Fundação + Mapa ao Vivo** — PR #1, ainda não mergeada.
2. ✅ **Busca e Resultados de Rota** — PR #2, ainda não mergeada (branch
   parte do topo da branch do sub-projeto #1, então PR #2 só deve ser
   mergeada DEPOIS da PR #1, ou rebaseada se a #1 mudar antes de mergear).
3. ✅ **Navegação Ativa** — PR #3, ainda não mergeada (branch parte do topo
   da branch do sub-projeto #2 — mesma regra de ordem de merge: #1 → #2 → #3).
4. ✅ **Favoritos e Personalização** — PR #4, aberta (branch parte do topo da branch do sub-projeto #3).
5. ✅ **Telas secundárias (Estações/Trilhos, Notícias, Configurações)** — PR #5, aberta (branch parte do topo da branch do sub-projeto #4).

> 🎉 **MIGRAÇÃO ANDROID NATIVA COMPLETA:** Todos os 5 sub-projetos foram especificados, planejados, implementados com TDD e entregues via Pull Request no GitHub (#1 → #2 → #3 → #4 → #5).

**Mudança de processo a partir do sub-projeto #3** (pedido explícito do
usuário, "ir mais rápido sem perder qualidade"): revisão combinada
(conformidade + qualidade numa passada só, em vez de dois revisores
separados) e tasks acopladas em lote — ver seção A.2 atualizada.

**Repositório GitHub:** `prontosantoslucas/busaisp`. Branch principal real de
desenvolvimento é `master` (não `main` — o `main` do GitHub está quase vazio,
é um branch órfão antigo; toda PR desta migração deve ter `master` como
base).

## A.1. Estado exato de cada sub-projeto

### Sub-projeto #1 — Fundação + Mapa ao Vivo
- **PR:** https://github.com/prontosantoslucas/busaisp/pull/1
- **Branch:** `worktree-native-android-foundation` (já enviada pro GitHub)
- **Spec:** `docs/superpowers/specs/2026-08-31-native-android-foundation-live-map-design.md`
- **Plano:** `docs/superpowers/plans/2026-08-31-native-android-foundation-live-map.md`
- **Entrega:** projeto Android novo (Kotlin/Compose), tema visual próprio
  (cores oficiais das linhas de Metrô/CPTM, tipografia IBM Plex), tela de
  Mapa ao Vivo com ônibus reais da SPTrans se movendo (interpolação real
  entre pings de GPS) e localização real do usuário com câmera centralizando.
- **Status:** 12 tasks completas, cada uma com TDD + revisão dupla + correção
  real quando encontrado problema. Revisão holística final encontrou e
  corrigiu 2 problemas reais (ônibus não interpolavam de verdade na tela;
  câmera não centralizava na localização). Build/testes verificados reais.

### Sub-projeto #2 — Busca e Resultados de Rota
- **PR:** https://github.com/prontosantoslucas/busaisp/pull/2
- **Branch:** `worktree-native-android-route-search` (já enviada pro GitHub;
  parte do topo da branch do sub-projeto #1)
- **Spec:** `docs/superpowers/specs/2026-08-31-native-android-route-search-design.md`
- **Plano:** `docs/superpowers/plans/2026-08-31-native-android-route-search.md`
- **Entrega:** busca de rota real via `/api/rotas` (origem/destino com
  autocomplete, 3 modos de horário: agora/partir às/chegar até), resultados
  com múltiplas opções incluindo Metrô/CPTM (marcado honestamente como
  horário programado, nunca GPS ao vivo), detalhe de itinerário passo a
  passo, e barra de navegação inferior (Mapa/Rotas) ligando as duas telas.
- **Status:** 9 tasks completas, mesmo processo do #1 (TDD + revisão dupla +
  correção real). Revisão holística final não encontrou bloqueadores.

### Sub-projeto #3 — Navegação Ativa
- **PR:** https://github.com/prontosantoslucas/busaisp/pull/3
- **Branch:** `worktree-native-android-active-navigation` (já enviada pro
  GitHub; parte do topo da branch do sub-projeto #2)
- **Spec:** `docs/superpowers/specs/2026-08-31-native-android-active-navigation-design.md`
- **Plano:** `docs/superpowers/plans/2026-08-31-native-android-active-navigation.md`
- **Entrega:** detecção real de embarque (GPS a <45m de um veículo real da
  linha) e desvio de rota (GPS a >250m do traçado real planejado), avisos de
  voz reais via TextToSpeech (mesmas mensagens/debounce de 30s do app web),
  Foreground Service com notificação persistente real (`POST_NOTIFICATIONS`
  solicitada em runtime pra Android 13+), tela de percurso ativo acessível
  pelo botão "Iniciar percurso" na tela de detalhe de rota.
- **Status:** 5 tasks completas (processo mais rápido: revisor combinado,
  tasks em lote). Revisão holística final encontrou e corrigiu 1 problema
  **crítico** (a tela de navegação ativa podia crashar com `SecurityException`
  real — não checava permissão de localização antes de começar a rastrear,
  e dava pra chegar nela sem nunca ter concedido a permissão via a busca por
  endereço digitado). Corrigido e reverificado antes de abrir o PR.

### Sub-projeto #4 — Favoritos e Personalização
- **PR:** https://github.com/prontosantoslucas/busaisp/pull/4
- **Branch:** `worktree-native-android-favorites` (parte do topo da branch do sub-projeto #3)
- **Spec:** `docs/superpowers/specs/2026-08-31-native-android-favorites-design.md`
- **Plano:** `docs/superpowers/plans/2026-08-31-native-android-favorites.md`
- **Entrega:** favoritos locais sem nuvem via DataStore Preferences (serialização Moshi com resiliência a payloads inválidos), favoritar linhas/rotas diretamente nos cards da tela de resultados com alternância em tempo real, endereços editáveis de Casa e Trabalho com autocomplete real reutilizando `RouteSearchViewModel`, 3ª aba de navegação inferior ("Favoritos") no `BusaiNavHost`, e chips de atalho de Casa/Trabalho na tela de busca para preenchimento de origem com 1 toque.
- **Status:** 5 tasks completas com TDD (`FavoriteRepositoryTest`, `FavoritesViewModelTest`), `assembleDebug`, `testDebugUnitTest` (53 testes passando) e `assembleDebugAndroidTest` verificados com sucesso.

### Sub-projeto #5 — Telas secundárias (Estações/Trilhos, Notícias, Configurações)
- **PR:** https://github.com/prontosantoslucas/busaisp/pull/5
- **Branch:** `worktree-native-android-secondary-screens` (parte do topo da branch do sub-projeto #4)
- **Spec:** `docs/superpowers/specs/2026-08-31-native-android-secondary-screens-design.md`
- **Plano:** `docs/superpowers/plans/2026-08-31-native-android-secondary-screens.md`
- **Entrega:** tela de status ao vivo das 13 linhas de metrô e trens da RMSP (`RailsScreen`) com cores oficiais e resumo operacional via `/api/trilhos/status`, feed unificado de avisos e notícias de mobilidade (`NewsScreen`) com filtros e modal de leitura via `/api/noticias`, tela de configurações e transparência de dados (`SettingsScreen`), e barra de navegação inferior com 5 abas integradas (Mapa, Rotas, Trilhos, Favoritos, Avisos).
- **Status:** 5 tasks completas com TDD (`RailsRepositoryTest`, `NewsRepositoryTest`, `RailsViewModelTest`, `NewsViewModelTest`), `assembleDebug`, `testDebugUnitTest` e `assembleDebugAndroidTest` (85 tarefas executadas com 100% de sucesso).

## A.2. Como replicar o processo (funciona com qualquer ferramenta de IA, não é específico de skill)

Cada sub-projeto seguiu este ciclo — os arquivos de spec/plano dos
sub-projetos #1 e #2 (linkados acima) são exemplos completos e reais de como
fazer isso pros sub-projetos #3/#4/#5:

1. **Escrever um spec de design** em `docs/superpowers/specs/AAAA-MM-DD-<nome>-design.md`
   — escopo, decisões de arquitetura, direção visual, o que entra e o que
   fica de fora explicitamente. Fundamentar em dados REAIS do backend (ler
   `src/lib/routing.ts`, `src/app/api/*/route.ts`, `src/types/sptrans.ts` —
   nunca inventar nome de campo ou formato de resposta).
2. **Escrever um plano de implementação** em `docs/superpowers/plans/AAAA-MM-DD-<nome>.md`
   — tarefas pequenas, cada uma com código completo (não pseudo-código),
   seguindo TDD onde fizer sentido (teste primeiro, ver falhar pelo motivo
   certo, implementar, ver passar). Nunca deixar "TBD" ou placeholder.
3. **Trabalhar numa branch/worktree isolada** por sub-projeto, criada a
   partir da branch do sub-projeto anterior (não da `main` vazia do GitHub —
   ver pegadinha na seção A.3).
4. **Implementar cada tarefa** (ou lote de tarefas relacionadas — tarefas de
   UI que só compilam juntas devem ser implementadas juntas, não uma de cada
   vez) com testes reais passando.
5. **Revisar cada tarefa de forma independente e cética** — não confiar no
   relato de quem implementou; reler o código de verdade, rodar o build/teste
   de novo do zero. Checar (a) se bate com a spec (nada a mais, nada a menos)
   e (b) qualidade do código (bugs reais, não só estilo). Quando achar
   problema real, corrigir e revisar de novo antes de seguir. **Isso pegou
   bug real em quase toda tarefa dos sub-projetos #1 e #2** (condição de
   corrida, exceção não tratada que derrubava o app, botão decorativo que não
   fazia nada, GPS travando pra sempre, sobreposição de layout) — não pular
   essa etapa achando que é burocracia, ela paga a própria conta.
6. **Depois de todas as tarefas prontas, fazer uma revisão holística** —
   reler o diff inteiro do sub-projeto de uma vez, traçar o fluxo real do
   usuário do início ao fim, e conferir se as peças que foram construídas e
   testadas isoladamente foram REALMENTE conectadas entre si (esse tipo de
   lacuna só aparece olhando o sistema inteiro — foi assim que se achou que a
   interpolação de ônibus nunca era chamada pela UI no sub-projeto #1).
7. **Enviar a branch pro GitHub e abrir um Pull Request** contra `master`,
   descrevendo o que foi entregue e o que ficou como limitação conhecida —
   nunca esconder limitação, documentar.

**Princípio inegociável em todo esse processo, não importa quão rápido se
vá**: nunca fabricar dado. Toda informação exibida ao usuário tem que vir de
uma fonte real (a API do backend, o GPS de verdade, etc.) ou ser marcada
honestamente como indisponível/estimada. Isso vale mais que velocidade.

## A.3. Pegadinhas técnicas reais (já resolvidas uma vez, não precisa redescobrir)

- **Lock de arquivo transitório do Windows durante build** — a partir do
  sub-projeto #3, passou a acontecer com frequência real `java.io.IOException:
  Unable to delete directory` em subpastas de `app/build/` durante
  `assembleDebug`/`testDebugUnitTest` (provavelmente um indexador/antivírus
  de fundo segurando handle de arquivo). Sintoma, não bug de código. Resolve
  de forma confiável: parar o daemon do Gradle (`gradlew.bat --stop`),
  apagar manualmente a subpasta travada (ou, se persistir, a pasta
  `app/build` inteira) e rodar de novo. Não tratar isso como falha real de
  build sem antes tentar essa limpeza.
- **Não existe `gradle` (CLI) instalado no ambiente sandbox** — o wrapper do
  Gradle (`gradlew`/`gradlew.bat`/`gradle-wrapper.jar`/`.properties`) do
  projeto `native-android/` foi copiado do wrapper já funcional do projeto
  Capacitor antigo (`android/`, que já existia no repo antes da migração
  nativa). Ele mesmo baixa a distribuição real do Gradle na primeira
  execução — só precisa de acesso à internet, não de `gradle` pré-instalado.
- **Versões de dependência tiveram que ser ajustadas na prática**: o plano
  original do sub-projeto #1 previa AGP 9.1.1/Hilt 2.57.2/KSP com versão
  acoplada ao Kotlin — nenhuma dessas resolveu de verdade. As versões que
  FUNCIONAM neste ambiente, confirmadas por build real, estão em
  `native-android/gradle/libs.versions.toml`: AGP 8.13.2, Kotlin 2.3.20,
  Hilt 2.58, KSP 2.3.11, Gradle wrapper 8.14.3, Compose BOM 2026.04.01,
  Retrofit 3.0.0, Moshi 1.15.1, MapLibre Android SDK 11.8.0. Se subir alguma
  dessas versões no futuro, reconfirmar que builda de verdade antes de
  seguir — não assumir que uma versão mais nova "deveria" funcionar.
- **Não existe emulador/dispositivo Android neste ambiente sandbox** (sem
  `adb`, sem AVD). Os testes de UI instrumentados (`androidTest/`) foram
  escritos e confirmadamente COMPILAM contra as APIs reais, mas nunca foram
  executados de verdade — isso é documentado explicitamente em cada commit
  que os adiciona, nunca alegado como "passou". Se a ferramenta que continuar
  esse trabalho tiver acesso a um emulador/dispositivo real, rodá-los é uma
  verificação real ainda pendente.
- **APK gerado com sucesso e confirmado on disco** durante o sub-projeto #1
  (antes de virar PR): `android/app/build/outputs/apk/debug/app-debug.apk`
  (esse é o caminho do wrapper Capacitor ANTIGO, dentro do worktree da época
  — cada worktree novo vai gerar o seu próprio em
  `native-android/app/build/outputs/apk/debug/app-debug.apk` depois de rodar
  `assembleDebug`). Ninguém ainda instalou esse APK num aparelho físico e
  confirmou visualmente — é o passo de verificação humana que falta.
- **Ferramentas de worktree do Claude Code**: se estiver usando o Claude
  Code e seu `EnterWorktree`, o padrão é ramificar a partir de
  `origin/<branch-padrão-do-repo>` — que neste repo é `main`, quase vazio.
  **Sempre conferir** com `git log --oneline -3` logo após criar um worktree
  novo; se aparecer só "Initial commit", o worktree ramificou do lugar
  errado — corrigir com `git reset --hard <branch-real-com-o-trabalho>`
  (ex.: `git reset --hard worktree-native-android-route-search`) antes de
  começar a trabalhar. Isso não deve ser um problema pra ferramentas que
  usam `git worktree add`/`git checkout` diretamente com o branch certo.
- **Nomes de campo da API são propositalmente "crípticos"** (`cl`, `lt`,
  `py`, `px`, etc.) — espelham a API real da SPTrans Olho Vivo
  (`src/types/sptrans.ts`), não são erro de digitação nem código ruim.

## A.4. Como continuar a partir daqui

1. Ler o spec e o plano do sub-projeto #1 e #2 (linkados acima) como
   referência de formato e nível de detalhe esperado.
2. Criar uma branch nova a partir de `worktree-native-android-route-search`
   (ou, se essa PR já tiver sido mergeada em `master` quando você ler isto,
   a partir de `master`) para o sub-projeto #3.
3. Escrever o spec do sub-projeto #3 (Navegação Ativa) — respeitando a
   decisão já tomada sobre Foreground Service SIM / isenção de bateria NÃO
   (seção A.1 acima).
4. Seguir o mesmo ciclo da seção A.2.
5. Ao final de cada sub-projeto: enviar a branch pro GitHub e abrir PR contra
   `master`, atualizando este documento com o novo estado (para quem vier
   depois, seja IA ou humano).

---

# PARTE B — App Web (produto em produção, contexto histórico)

Tudo abaixo é sobre o app **web** (Next.js/React, `src/`), que é uma base de
código separada e ainda ativa — continua em produção na Vercel
independentemente do trabalho de migração nativa acima. Este conteúdo foi
escrito em 2026-08-21, antes da decisão de migração nativa, e pode estar
desatualizado em relação ao estado mais recente do app web (verificar
`git log` antes de agir sobre qualquer item "não iniciado" aqui).

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
