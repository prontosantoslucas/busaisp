# Fase 2 — Roteirização Multimodal com Baldeação

## Contexto

A Fase 1 (já em produção) trouxe paradas e linhas reais de toda São Paulo para o planejador de rotas, mas só encontra viagens **diretas** (uma única linha de ônibus, sem troca). Na prática, boa parte dos trajetos reais em SP exige pelo menos uma troca de ônibus — a busca atual falha honestamente nesses casos ("Nenhuma linha direta encontrada..."), o que é correto, mas incompleto.

Esta fase adiciona busca de viagens com **qualquer número de trocas necessário para alcançar o destino**, dentro de um limite de segurança para manter a busca rápida e previsível (a mesma lógica usada por qualquer app de rotas real — nenhum deles busca literalmente "sem limite algum").

## Raio de busca e ordenação

**Raio de busca de paradas: 2,5 km** (era 600 m na Fase 1). Isso permite considerar rotas em que vale a pena descer mais longe e caminhar um trecho maior até o destino, em vez de forçar uma baldeação só para chegar mais perto.

**Ordenação das alternativas** (decidido explicitamente com o usuário):

1. **Tempo total estimado** (que já inclui o tempo de caminhada e a espera pelo ônibus) — critério principal.
2. **Distância total a pé** — desempate.
3. **Número de baldeações** — desempate final.

Ou seja: a alternativa que leva menos tempo no total aparece primeiro, mesmo que envolva uma troca a mais ou uma caminhada um pouco maior. Entre duas alternativas de tempo equivalente, a que exige menos caminhada ganha. Isso é o mesmo comportamento de Moovit/Google Maps, e substitui a ordenação "menos baldeações primeiro" considerada inicialmente.

## Fora de escopo (mantém a simplificação já aceita na Fase 1)

Assim como a Fase 1 não valida se o horário programado de uma linha realmente bate com o momento da busca (só verifica que a sequência de paradas está na ordem certa dentro da mesma viagem GTFS), esta fase **também não** valida compatibilidade de horário entre os trechos de uma rota com baldeação — ou seja, não verificamos matematicamente se "dá tempo" de pegar o segundo ônibus depois do primeiro. Isso é tratado na Fase 3 (planejamento por horário, ainda não implementada), que vai usar os horários programados reais do GTFS para esse cálculo preciso. Por ora, a previsão em tempo real da Olho Vivo continua sendo buscada por trecho, exatamente como já funciona hoje — se não houver dado real disponível para algum trecho, o app avisa honestamente, sem inventar.

Também fora de escopo: rotas envolvendo Metrô/CPTM como perna da viagem (trilhos ficam de fora da busca de linhas diretas desde a Fase 1, por filtro de `route_type`).

## Arquitetura

### 1. Nova função SQL: `routes_from_stops`

Complementa `direct_routes_between` (que exige um destino fixo). Esta nova função responde "quais paradas são alcançáveis a partir destas paradas, andando em qualquer linha de ônibus, sem destino fixo" — o bloco de construção necessário para expandir a busca "onda por onda":

```sql
create or replace function public.routes_from_stops(
  origin_stop_ids text[],
  max_results integer default 300,
  route_types integer[] default array[3]
)
returns table (
  route_id text,
  route_short_name text,
  route_long_name text,
  trip_id text,
  trip_headsign text,
  origin_stop_id text,
  origin_departure_seconds integer,
  dest_stop_id text,
  dest_arrival_seconds integer
)
```

Mesma lógica de junção de `direct_routes_between` (mesma viagem GTFS, parada de destino depois da de origem na sequência), mas sem o filtro de parada de destino — e com um limite (`least(max_results, 500)`) para não devolver a cidade inteira de uma vez.

### 2. Busca em ondas (BFS por rounds) em `src/lib/routing.ts`

Para cada rodada `k` (começando em 1), mantemos uma "fronteira" de paradas alcançáveis com `k-1` trocas:

- **Rodada 1**: a fronteira são as paradas próximas da origem (já calculadas por `findNearbyStops`). Verificamos conexão direta com o destino usando `findDirectRoutes` (a função já existente da Fase 1) — isso dá as rotas de 0 trocas, exatamente como hoje.
- **Rodada k > 1**: expandimos a fronteira da rodada anterior chamando `routes_from_stops` (a paradas nunca visitadas em rodadas anteriores, para não repetir/entrar em ciclo), formando a nova fronteira. Em seguida verificamos se essa nova fronteira conecta diretamente ao destino (via `findDirectRoutes`) — isso dá as rotas de `k-1` trocas.
- Continua até: (a) atingir o limite de segurança de rodadas, (b) já ter alternativas suficientes acumuladas, ou (c) a fronteira ficar vazia (sem novas paradas para explorar).

**Limites de segurança** (parâmetros configuráveis, com valores padrão pensados para SP):

- Máximo de 4 rodadas (ou seja, até 3 trocas de ônibus).
- Máximo de ~40 paradas novas por rodada na fronteira (evita explosão combinatória em rodadas avançadas).
- Máximo de 10 alternativas totais retornadas, ordenadas conforme a seção "Raio de busca e ordenação" acima (tempo total → caminhada → baldeações).
- Uma perna não pode continuar na mesma `route_id` da perna anterior (isso não seria uma troca real, seria só continuar no mesmo ônibus).

Importante: como a ordenação final é por tempo total (não por número de trocas), a busca **não** pode parar na primeira rodada que encontrar resultados — uma rota com 1 baldeação pode perfeitamente ser mais rápida que uma direta que exige caminhar 2 km. A busca continua expandindo rodadas até o limite de segurança ou até acumular alternativas suficientes, e só então ordena o conjunto todo.

### 3. Reconstrução do trajeto completo

Cada alternativa passa a poder ter **múltiplas pernas de ônibus**, cada uma com sua própria caminhada até a parada de embarque e previsão em tempo real (reaproveitando `resolveRealTimeEta`, chamada uma vez por perna). Entre duas pernas, se a parada de desembarque da perna anterior for diferente da parada de embarque da próxima, incluímos uma etapa de caminhada curta entre elas (reaproveitando a mesma matemática de distância/tempo a pé já usada em `buildPlanForLine`); se for a mesma parada, apenas uma indicação de espera pela próxima linha.

`RoutePlan` ganha um campo `transferCount: number` (0 para viagem direta, 1+ para com baldeação) — usado para ordenar e para exibir um indicador de "N trocas" na lista de alternativas.

### 4. Interface

A tela de detalhes da rota (`RoutePlanner.tsx`) já renderiza `steps` como uma lista genérica de WALK/BUS/DESTINATION — isso continua funcionando sem mudanças para trajetos com mais passos. A lista de alternativas (hoje mostra só o código de uma linha) precisa de um ajuste pequeno para mostrar todas as linhas do trajeto em sequência (ex: "1703 → 875") e um selo de "N trocas" quando `transferCount > 0`.

## Testes

- Regressão: o corredor já testado na Fase 1 (Jd. Fontális ↔ Shopping Center Norte) deve continuar retornando a viagem direta 1703-10 como antes (rodada 1, sem quebrar nada).
- Um par origem/destino que a Fase 1 sabidamente não resolve (por exigir troca) deve agora retornar pelo menos uma alternativa com 1 troca.
- Teste de unidade da lógica de rodadas com paradas/linhas mockadas (sem rede real), cobrindo: parar corretamente no limite de rodadas, não repetir uma parada já visitada, não contar a mesma `route_id` como troca, ordenação final por número de trocas e depois por tempo.

## Riscos

- **Desempenho**: cada rodada faz pelo menos uma consulta SQL adicional; com o limite de 4 rodadas e paradas por rodada limitadas, o pior caso é um número pequeno e previsível de consultas (não cresce sem controle). Ainda assim, validar o tempo de resposta real com a rodada de importação já feita (99 mil `stop_times`) durante a implementação, e ajustar os limites se necessário.
- **Baldeações “estranhas”**: sem verificação de horário entre pernas, é possível sugerir uma troca que, na prática, exigiria esperar muito tempo pelo próximo ônibus. Isso é uma limitação conhecida e aceita nesta fase (ver "Fora de escopo"), a ser resolvida na Fase 3.
