# HANDOFF — BusaÍ SP (estado atual e o que falta)

Documento de passagem de contexto. Última atualização em 2026-09-01 pela
Claude — escrito para que qualquer ferramenta de IA (Gemini, outra sessão
Claude, etc.) ou um humano consiga continuar exatamente de onde parou, mesmo
sem acesso ao histórico de conversa que gerou este estado.

## 🔔 Leia isto primeiro — resumo da sessão de 2026-09-01

- **A migração Android nativa (Parte A) foi 100% mesclada na `master` e
  enviada pro GitHub.** As 5 PRs (#1-#5) aparecem como `MERGED` no GitHub —
  o histórico delas já está contido na `master` (commit `b47e2d2`), então
  não precisam de ação nenhuma, só referência histórica agora.
- **Prioridade atual do usuário: o app Android nativo (o APK), não o app
  web.** Se não houver instrução explícita em contrário, trabalhe em
  `native-android/`.
- **Redesign visual concluído nesta sessão: azul claro + branco, tema único
  (não alterna mais com o sistema).** Spec completo em
  `docs/superpowers/specs/2026-09-01-native-android-visual-redesign-design.md`.
  Histórico pra quem chegar depois: uma primeira tentativa de reskin
  **dark-first** só no mapa (`2287d4d`) foi revertida (`2e101c0`) porque
  destoava do resto do app, que era Material default sem identidade forte —
  isso levou a uma decisão de design pra aplicação inteira, não mais reskins
  isolados por tela. **Não reintroduza o tema escuro/alternância com o
  sistema sem confirmar com o usuário primeiro** — foi removido de propósito.
  `Theme.kt` hoje é um único `lightColorScheme` com `primary =
  AppColors.UserLocationBlue`. O mapa usa só um toque leve de cor
  (`ui/map/MapLightPalette.kt`) — água/parques com wash translúcido do azul/
  verde já existentes, resto com a aparência nativa do provedor "Liberty".
- **Busca de linha de Metrô/CPTM no mapa agora funciona de forma honesta**:
  não há posição de trem em tempo real pra mostrar (só ônibus tem GPS via
  SPTrans), então a busca reconhece o nome/código da linha
  (`ui/map/RailLineMatcher.kt`) e oferece navegar pra Trilhos (status real)
  em vez de devolver resultados de ônibus confusos.
- **A Parte B abaixo (app web) tem seções marcadas como "PRÓXIMA TAREFA" ou
  "NÃO INICIADO" que na verdade JÁ FORAM IMPLEMENTADAS há semanas** (Fase 2 —
  baldeação, destinos populares reais, remoção do modo demo) — isso foi
  verificado contra o código e a API de produção nesta sessão, não é
  suposição. Cada seção afetada tem uma nota `[ATUALIZADO 2026-09-01]`
  destacando isso. **Não redescubra ou reimplemente essas features.**
- **Existe uma skill de projeto** em
  `.claude/skills/busaisp-premium-design/SKILL.md` com o princípio "audite
  antes de desenhar, depois eleve ao nível Uber/Waze/99/InDrive" — hoje com
  escopo só pro Android nativo. Ferramentas sem suporte a skills do Claude
  Code devem ler esse arquivo como documentação normal antes de mexer em
  qualquer UI do app Android; os princípios nele valem independente da
  ferramenta.
- **A auditoria de UX/UI das 9 telas (PARTE C abaixo) já foi majoritariamente
  endereçada** — parte pelo usuário diretamente (commits `26cb4b1`,
  `debbc7b`, `2faf548`: skeleton loading, tiers de status em Trilhos,
  transições no NavHost, fitBounds de linha no mapa, tipografia
  `EtaCounterStyle`) e parte nesta sessão (paleta, busca de metrô, feedback
  de toque no `FloatingPillButton`). A seção PARTE C foi mantida como
  registro histórico do que foi encontrado — **confira o código real antes
  de assumir que um item específico ainda está pendente**, várias coisas lá
  já foram corrigidas por um caminho diferente do que a seção sugere.
- Branches de worktree de uma tentativa anterior de recuperar/terminar esses
  fixes (`worktree-agent-*`, 3 branches) ficaram **obsoletas e não foram
  mescladas** — o usuário já tinha implementado equivalente ou melhor por
  conta própria enquanto essas rodavam em paralelo. Podem ser descartadas,
  não representam trabalho perdido.
- O trabalho do usuário no app web que antes estava não commitado (roteamento
  multimodal de trilhos com baldeação, traçado vetorial, geocoding
  resiliente) **já foi commitado por ele mesmo** (`26cb4b1`) — não é mais
  "em progresso pendente", já está na `master`. `git log -- src/lib/railRouting.ts`
  se precisar entender a evolução.
- **Branches obsoletas, aguardando decisão do usuário pra limpar**:
  `worktree-transfer-routing` (tem mudanças não commitadas — uma abordagem
  alternativa pra baldeação que acabou sendo implementada de outro jeito,
  já em produção) e `worktree-popular-destinations` (vazia/obsoleta, a
  feature real já foi implementada direto na master). Não apagar sem
  perguntar.

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

1. ✅ **Fundação + Mapa ao Vivo** — PR #1, **MERGED**.
2. ✅ **Busca e Resultados de Rota** — PR #2, **MERGED**.
3. ✅ **Navegação Ativa** — PR #3, **MERGED**.
4. ✅ **Favoritos e Personalização** — PR #4, **MERGED**.
5. ✅ **Telas secundárias (Estações/Trilhos, Notícias, Configurações)** — PR #5, **MERGED**.

> 🎉 **MIGRAÇÃO ANDROID NATIVA COMPLETA E MESCLADA:** Todos os 5 sub-projetos
> foram especificados, planejados, implementados com TDD, entregues via Pull
> Request no GitHub (#1 → #2 → #3 → #4 → #5) **e mesclados na `master`**
> (commit `b47e2d2`, 2026-09-01) — o GitHub detectou automaticamente que o
> histórico das 5 PRs já estava contido na `master` e marcou todas como
> `MERGED`. `master` já foi enviada pro GitHub, incluindo um fix adicional de
> reskin dark-first do mapa (commit `2287d4d`, ver seção C abaixo). **Não há
> PR pendente de revisão/merge nesta migração.**

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

### Sub-projeto #5 — Telas secundárias (Estações/Trilhos, Notícias, Configurações) + Radar de Calor de Trânsito
- **PR:** https://github.com/prontosantoslucas/busaisp/pull/5
- **Branch:** `worktree-native-android-secondary-screens` (parte do topo da branch do sub-projeto #4)
- **Spec:** `docs/superpowers/specs/2026-08-31-native-android-secondary-screens-design.md`
- **Plano:** `docs/superpowers/plans/2026-08-31-native-android-secondary-screens.md`
- **Entrega:** tela de status ao vivo das 13 linhas de metrô e trens da RMSP (`RailsScreen`) via `/api/trilhos/status`, feed unificado de avisos e notícias de mobilidade (`NewsScreen`) via `/api/noticias`, tela de configurações e transparência de dados (`SettingsScreen`), barra de navegação com 5 abas integradas (Mapa, Rotas, Trilhos, Favoritos, Avisos), e **Radar de Calor de Trânsito e Incidentes em Tempo Real** no mapa ao vivo (`MapScreen`/`LiveBusMap`) via `/api/transito/incidentes` com botão de fogo (🔥), cálculo de hotspots e halos de congestionamento sobre corredores da RMSP.
- **Status:** 100% completo com TDD (`TrafficRepositoryTest`, `RailsRepositoryTest`, `NewsRepositoryTest`, `MapViewModelTest`, `RailsViewModelTest`, `NewsViewModelTest`), `assembleDebug`, `testDebugUnitTest` e `assembleDebugAndroidTest` verificados com sucesso.

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

## A.4. Como continuar a partir daqui [ATUALIZADO 2026-09-01]

Os 5 sub-projetos estão completos e mesclados — não há mais "próximo
sub-projeto" a implementar seguindo o ciclo spec→plano→PR da seção A.2. A
prioridade atual do usuário é **polish de UX/UI do app Android já existente**,
não novas features grandes. Ver **PARTE C** (mais abaixo) para a auditoria
completa de todas as 9 telas com achados concretos — comece por ali.

Se novas features grandes forem pedidas no futuro, o ciclo da seção A.2 (spec
→ plano → branch/worktree isolada → implementação com TDD → revisão →
merge) continua sendo o processo validado a seguir.

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

## 3. Fase 2 — Baldeação — ✅ JÁ IMPLEMENTADA E EM PRODUÇÃO [ATUALIZADO 2026-09-01]

**Esta seção dizia "próxima tarefa imediata" mas isso está desatualizado —
verificado nesta sessão que a Fase 2 inteira já está funcionando em
produção**, implementada num commit direto (`34c916e`, 2026-08-21) que tomou
um caminho diferente do plano original de 6 tarefas abaixo (mantido só como
histórico). Confirmado testando `/api/rotas` ao vivo: alternativas reais
aparecem com `transferCount: 1` e `transferCount: 2`. A função SQL
`routes_from_stops` já está aplicada no Supabase e funcionando —
`findRoutesFromStops` em `src/lib/gtfs.ts` já é chamada de verdade por
`findMultiLegPlans`/`calculateRoute` em `src/lib/routing.ts` (busca em ondas
por rodadas, exatamente como a Tarefa 4 original descrevia).

**Não reimplemente isso.** A branch `worktree-transfer-routing` (com o plano
de 6 tarefas original abaixo, guardado só como contexto histórico) ficou
como uma abordagem alternativa que nunca foi finalizada nem mergeada — ela
tem mudanças não commitadas ainda. Como a feature real já existe em
produção por outro caminho, essa branch provavelmente pode ser descartada,
mas confirme com o usuário antes (ver nota no topo do documento).

<details>
<summary>Plano original de 6 tarefas (histórico, não seguir mais)</summary>

Branch de trabalho já criada: `worktree-transfer-routing`
(worktree em `.claude/worktrees/transfer-routing`).

**Spec:** `docs/superpowers/specs/2026-08-21-transfer-routing-design.md`
**Plano detalhado com todo o código pronto:** `docs/superpowers/plans/2026-08-21-transfer-routing.md`

O plano tinha 6 tarefas, cada uma com o código exato para copiar:

- **Tarefa 1:** função SQL `routes_from_stops` — hoje já está aplicada e viva no Supabase.
- **Tarefa 2:** wrapper `findRoutesFromStops` em `src/lib/gtfs.ts` — hoje já implementado e em uso real.
- **Tarefa 3:** substituir `buildPlanForLine` (uma perna) por `buildMultiLegPlan` (N pernas) —
  hoje já existe (campo `transferCount` em `RoutePlan`, confirmado).
- **Tarefa 4:** busca em ondas (BFS por rodadas) em `calculateRoute` — hoje já existe
  (`findMultiLegPlans`), com raio de busca de 2.500m confirmado no código.
- **Tarefa 5:** selo "N baldeações" na interface — confirmar se já está visível na UI (o dado
  `transferCount` chega até o front, mas não foi confirmado visualmente nesta sessão se o selo
  aparece formatado; verificação rápida de UI, não reimplementação).
- **Tarefa 6:** verificação manual no navegador — ainda vale fazer como sanity check, mesmo com
  tudo implementado.

</details>

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

### 4.1. Destinos mais procurados (rastreamento real) — ✅ JÁ IMPLEMENTADO [ATUALIZADO 2026-09-01]

**Verificado nesta sessão: já está pronto**, no mesmo commit `34c916e` que
entregou a Fase 2. `supabase/search_events.sql` existe e a tabela é
gravada de verdade em toda chamada de `/api/rotas` (`src/app/api/rotas/route.ts`,
confirmado o `supabase.from('search_events').insert(...)`). O front consome
isso — ver `activeDestinationsList`/`popularDestinationsList` em
`src/components/Transit/TransitHomeHub.tsx`, que busca os destinos reais e
mostra como chips.

A branch `worktree-popular-destinations` continua vazia/obsoleta (a feature
real foi implementada direto na master por outro caminho) — provavelmente
pode ser descartada, confirme com o usuário antes.

### 4.2. Tirar o "modo demonstrativo" — ✅ JÁ IMPLEMENTADO [ATUALIZADO 2026-09-01]

**Verificado nesta sessão: já está pronto.** `src/lib/sptrans.ts` não importa
mais `mockData.ts`/`getMockPrevisaoParada`/`getMockVeiculos` em lugar nenhum
(confirmado por grep — zero ocorrências). O modo demonstrativo foi removido
de fato, não só escondido. Se `mockData.ts` ainda existir no repo sem
nenhuma outra referência, é código morto que pode ser removido num
follow-up de limpeza, mas não é mais um problema funcional.

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

---

# PARTE C — Auditoria de UX/UI do app Android nativo (2026-09-01)

Prioridade atual do usuário. Auditoria completa das 9 telas de
`native-android/app/src/main/java/com/busaisp/android/ui/`, usando os
critérios da skill `busaisp-premium-design` (`.claude/skills/busaisp-premium-design/SKILL.md`
— leia esse arquivo primeiro se for implementar algo daqui, ele explica o
"porquê" por trás de cada critério). **Isto é auditoria, nada foi
implementado ainda** — os achados abaixo são a lista de tarefas reais pra
continuar.

Cada achado foi verificado no código de verdade (não é genérico) e checado
contra `git log` do arquivo pra confirmar que não é uma decisão deliberada
recente (só uma commit relevante encontrada, `46864b5`, e ela só mexeu em
padding/layout — nenhum dos achados abaixo é decisão de propósito, é lacuna
real).

## C.0. Dois problemas estruturais (valem para o app inteiro, corrigir primeiro)

1. **`AppColors.LiveAmber` vazou pra `colorScheme.primary` do app inteiro**
   (`ui/theme/Theme.kt`, tanto no esquema dark quanto light). O comentário no
   próprio `Color.kt`/`MapDarkPalette.kt` documenta a convenção "âmbar = GPS
   ao vivo", mas como `LiveAmber` virou a cor primária do Material, ela pinta
   botões, foco de campo de texto etc. em telas sem GPS nenhum — confirmado em
   `ActiveNavigationScreen.kt` (botões "Encerrar percurso"/status de viagem),
   `NewsScreen.kt` (badges de notícia), `SettingsScreen.kt` (subtítulos dos
   cards "Sobre"). **Fix estrutural**: dar ao `colorScheme.primary` um token
   próprio neutro, e reservar `LiveAmber` só pra elementos de GPS/dado ao vivo
   de verdade (marcador de ônibus, indicador "ao vivo" na tela do mapa).
2. **`EtaCounterStyle` (IBM Plex Mono, `ui/theme/Type.kt`) está definido e
   nunca é usado** em nenhuma tela — nem em `VehicleDetailSheet.kt`, nem nos
   cards de rota. É um token órfão esperando adoção. Aplicar esse estilo em
   todo número que importa (ETA, contagem de veículos, duração, distância) em
   vez de deixar tudo em peso/tamanho de texto padrão do Material resolveria
   boa parte dos achados de "hierarquia tipográfica fraca" abaixo de uma vez.

## C.1. Mapa (`ui/map/`) e Navegação Ativa (`ui/activenav/`)

**Já está bom, não mexer:**
- `VehicleDetailSheet.kt` — expansão/colapso do painel já usa
  `animateContentSize(spring(dampingRatio = Spring.DampingRatioMediumBouncy))`
  de verdade, não decorativo. É o único exemplo real de easing não-linear em
  todo o app hoje — use como referência ao implementar os itens abaixo.
- `interpolatePosition` (domain) — matemática de interpolação de posição do
  ônibus está correta e é usada de verdade por `LiveBusMap.kt`.
- `easeCamera` (não `moveCamera`) é usado corretamente nos lugares onde a
  câmera de fato se move — o problema é que ela se move pouco (ver C.1.4).
- Tratamento de dado obsoleto em `MapViewModel.kt` (`STALE_GRACE_MS`) é honesto
  — marca como desatualizado em vez de sumir/travar silenciosamente.

**Gaps reais, em ordem de impacto:**

1. **Botão "minha localização" vira no-op depois do primeiro toque**
   (`LiveBusMap.kt` + `MapViewModel.kt`). `hasCenteredOnUser` é uma flag
   `remember` de uso único nunca resetada, e `onLocationPermissionGranted()`
   retorna cedo se já houver um job ativo — então tocar o botão de novo
   (o gesto mais básico de "recentralizar em mim" que todo app de mobilidade
   tem) **não faz nada**. Isso é bug funcional, não só falta de polish.
   Fix: desacoplar "centralizar câmera" de "iniciar updates de localização" —
   o botão sempre deveria disparar `easeCamera` com a última posição
   conhecida, independente do job de location já estar rodando.
2. **Sem fit de câmera nos veículos ao selecionar uma linha** — hoje a câmera
   só centraliza no usuário (uma vez, ver #1) ou fica no zoom inicial de SP;
   ao buscar uma linha, os ônibus aparecem no mapa mas a câmera não se move
   pra mostrá-los, o usuário tem que caçar manualmente. Fix: calcular bounding
   box dos veículos retornados em `onLineSelected` e dar `easeCamera`/fit.
3. **Ônibus "pulam" 1x/segundo em vez de deslizar** (`LiveBusMap.kt`,
   `BUS_INTERPOLATION_TICK_MS = 1000L`). A matemática de interpolação está
   certa (ver "já está bom" acima), mas a fonte do MapLibre só atualiza
   1x/segundo, então o resultado visual ainda é um pulo perceptível, não um
   deslizar fluido como Uber/Waze. Fix: reduzir o intervalo do tick (ex.:
   200-250ms) ou animar a posição na tela entre ticks.
4. **`MapUiState.Loading` nunca é renderizado** (`MapScreen.kt`) —
   `CircularProgressIndicator` está importado mas nunca usado; ao selecionar
   uma linha, a tela fica literalmente vazia entre o toque e os dados
   chegarem. Mais grave que "spinner em vez de skeleton" — não tem UI de
   loading nenhuma. Fix: pelo menos um skeleton/indicador enquanto
   `MapUiState.Loading`.
5. **Nenhum elemento tocável tem feedback além do ripple padrão do Material**
   — `FloatingPillButton.kt`, resultados de `LineSearchBar.kt`, botões de
   `ActiveNavigationScreen.kt`. Nenhum scale/elevação no toque. Fix: adicionar
   `collectIsPressedAsState()` + `animateFloatAsState(spring(...))` pra um
   scale-down sutil no toque.
6. **Não existe pulso "ao vivo" em lugar nenhum do app real** — corrigindo uma
   suposição errada de uma versão anterior desta auditoria/skill: isso só foi
   implementado num worktree de teste descartável (usado pra avaliar a skill
   `busaisp-premium-design`), nunca no app de verdade. Se for implementar,
   usar `spring()`/`FastOutSlowInEasing` (nunca `LinearEasing`) e só animar
   enquanto o dado que representa existe de verdade (ex.: `userLocation != null`).

## C.2. Busca e Resultados de Rota (`ui/routesearch/`)

**Já está bom, não mexer:**
- Chaves de `LazyColumn` corretas em todo o fluxo (`RouteResultsScreen.kt`,
  `RouteDetailScreen.kt`, `AddressField.kt`) — inclusive com comentário no
  código explicando por que (fix de bug real de colisão de key, commit
  `89909ad` — não remover essa lógica achando redundante).
- Labels honestos de "não é GPS ao vivo" pra trechos de trilho/horário
  programado (`RoutePlanCard.kt`, `RouteStepRow.kt`) — mantém a convenção de
  nunca fingir dado ao vivo que não existe.

**Gaps reais:**

1. **Não existe nenhuma animação no fluxo inteiro** — grep por
   `animate|spring|Easing|AnimatedVisibility|Crossfade` no pacote inteiro
   retorna zero. Cards de resultado aparecem/desaparecem instantâneos, sem
   entrada escalonada, sem transição ao trocar `TimeModeSelector`.
2. **`RouteResultsScreen.kt` não tem estado de loading — mostra "Nenhum
   resultado ainda" enquanto a busca está rodando de verdade.** Isso não é só
   falta de polish, é um bug real de UX (mensagem enganosa). Fix prioritário:
   adicionar um branch pra `RouteSearchUiState.Loading` no `when` de
   renderização, com skeleton rows no formato de `RoutePlanCard`.
3. **`RoutePlanCard.kt` sem feedback de toque** além do ripple padrão, e sem
   animação no ícone de favorito ao tocar.
4. **Números importantes (duração, ETA) não animam ao atualizar** — trocam de
   valor instantaneamente em vez de `AnimatedContent`/count-up.
5. **`EtaCounterStyle` não é usado em `RoutePlanCard.kt`** apesar de ter sido
   feito pra isso (ver C.0.2) — duração/ETA/tarifa/baldeações usam texto
   padrão do Material sem contraste de peso.
6. Confirma o vazamento de `LiveAmber` (C.0.1): o ícone de favorito
   selecionado usa `colorScheme.primary` (= âmbar) sem relação com GPS.

## C.3. Favoritos, Trilhos, Notícias, Configurações e navegação inferior

**Já está bom, não mexer:**
- Cores oficiais de cada linha de Metrô/CPTM (`LineColors`) são usadas de
  verdade em `RailsScreen.kt` (`RailLineCard` calcula até luminância pra
  escolher texto preto/branco com contraste correto) — não é texto genérico.
- Chaves de `LazyColumn` corretas nas 3 telas (Favoritos, Trilhos, Notícias).
- Toque em linhas/cards tem ripple padrão (feedback básico existe, só não é
  "enhanced").

**Gaps reais:**

1. **`RailsScreen.kt` colapsa 6 status possíveis em binário normal/anormal** —
   `RailStatusType` tem `NORMAL, VELOCIDADE_REDUZIDA, OPERACAO_PARCIAL,
   PARALISADA, ENCERRADA, DESCONHECIDO`, mas a UI só checa `== NORMAL` e pinta
   tudo o mais igual (vermelho + ícone de alerta), sem diferenciar
   "levemente lento" de "linha parada". Fix: um tier de cor/ícone por status.
   Também não há nenhum indicador visual de "isto é ao vivo" (pulso sutil no
   "Atualizado às...").
2. **Spinner genérico em vez de skeleton** em Trilhos e Notícias
   (`CircularProgressIndicator` idêntico nos dois); **Favoritos não tem
   estado de loading nenhum** (o StateFlow começa com lista vazia, então uma
   lista vazia de verdade e "ainda carregando" ficam visualmente idênticos).
3. **Barra de navegação inferior sem nenhuma animação** — `NavigationBar`/
   `NavigationBarItem` do Material puro, sem cor de indicador customizada,
   sem animação de escala no ícone selecionado, e as trocas de tela no
   `NavHost` são cortes instantâneos (sem `enterTransition`/`exitTransition`
   no `composable()`).
4. **Remover um favorito não anima** — o item some da `LazyColumn` sem
   `Modifier.animateItemPlacement()`, e o ícone de remover não tem nenhum
   feedback de toque além do ripple.
5. **Hierarquia tipográfica fraca** em `AddressSlotRow` (Favoritos — o
   endereço salvo, que é a info importante, tem o mesmo peso do label "Casa"/
   "Trabalho") e no resumo de Trilhos (contagens de linha mais fracas
   visualmente que o cabeçalho estático "Resumo das Linhas").
6. Confirma o vazamento de `LiveAmber` (C.0.1) em Notícias e Configurações.

## C.4. Como priorizar

Sugestão de ordem, mas o usuário pode reordenar:

1. **C.0** (os dois problemas estruturais) — resolver primeiro porque
   qualquer tela nova daqui pra frente herda esses tokens.
2. **C.2.2** (bug de UX real — mensagem "sem resultado" durante busca em
   andamento) e **C.1.1** (botão de localização que vira no-op) — são bugs
   funcionais disfarçados de falta de polish, não só estética.
3. O resto de C.1/C.2/C.3 pode ser feito tela por tela, seguindo os padrões
   de `VehicleDetailSheet.kt` (spring) e a skill `busaisp-premium-design`
   como referência de qualidade.
