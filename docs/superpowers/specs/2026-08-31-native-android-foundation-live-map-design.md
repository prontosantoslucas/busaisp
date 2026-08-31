# Migração para Android Nativo — Sub-projeto #1: Fundação + Mapa ao Vivo

## Contexto e decisão

O app web (Next.js/React + Leaflet, empacotado no Android via Capacitor/WebView)
foi comparado diretamente pelo usuário contra Uber, Waze, 99 e InDrive e
considerado inferior em UX/usabilidade — muita informação na tela, animações e
interações ruins. A análise técnica confirmou que a causa raiz não é polimento
de CSS: é a própria camada (WebView + DOM + Leaflet) ter um teto de fluidez que
nunca alcança o de um app nativo com mapa renderizado em GPU.

Isso atualiza a recomendação do documento anterior
(`2026-08-24-app-nativo-funcoes.md`, que sugeria nativo puro só "se o gargalo
real for renderização do mapa"): com o app já comparado lado a lado contra a
concorrência pelo usuário, essa é exatamente a condição descrita. Decisão do
usuário: **migração para nativo puro**, começando pelo Android.

Esse documento cobre apenas o **sub-projeto #1** de uma migração decomposta em
5 frentes independentes (ver seção "Decomposição completa" abaixo). Cada frente
vira seu próprio ciclo spec → plano → implementação.

## Estratégia geral da migração

- App novo, do zero, em Kotlin/Jetpack Compose, numa pasta nova neste mesmo
  repositório (`native-android/`).
- O app web/Capacitor **continua no ar e recebendo manutenção normalmente**
  durante toda a transição — não para de evoluir enquanto o nativo não alcança
  paridade de funcionalidades.
- Reaproveita 100% do backend existente (`/api/rotas`, `/api/onibus`,
  `/api/noticias`, `/api/transito/incidentes`, `/api/trilhos/status`) via HTTPS
  — zero reescrita de lógica de roteamento/GTFS/SPTrans em Kotlin.
- Mesma regra do projeto inteiro: **nenhum dado fabricado**. Qualquer limitação
  real de dado (ex.: sem posição ao vivo de Metrô/CPTM) é exibida honestamente
  na UI, nunca disfarçada.

## Decomposição completa (para referência — só #1 está especificado aqui)

1. **Fundação + Mapa ao Vivo** ← este documento
2. Busca e Resultados de Rota (hub inicial, busca, cálculo, "agora/partir
   às/chegar até")
3. Navegação Ativa (percurso em andamento, embarque/desvio de rota, avisos de
   voz por baldeação) — **inclui o requisito de segundo plano abaixo**
4. Favoritos e Personalização (favoritos, endereços de casa/trabalho)
5. Telas secundárias (Estações, Notícias, configurações, mapas offline)

### Requisito registrado para o sub-projeto #3 (não implementar agora)

Durante o brainstorming deste sub-projeto, o usuário perguntou sobre rodar em
segundo plano, notificação persistente em tempo real e desligar otimização de
bateria. Ficou definido que:

- Isso pertence ao sub-projeto #3 (Navegação Ativa), não a este — só faz
  sentido ter serviço em segundo plano quando existe uma viagem sendo
  acompanhada, o que não existe no escopo passivo do Mapa ao Vivo.
- A forma correta e aprovada pela Google Play é um **Foreground Service com
  notificação persistente real** durante a viagem (mesmo padrão do
  Uber/99/Waze) — isso será implementado.
- **Não** solicitar isenção total de otimização de bateria
  (`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`) como comportamento padrão: é uma
  permissão especial fortemente auditada pela Google Play, com risco real de
  rejeição/remoção do app se usada sem justificativa muito forte. O Foreground
  Service já resolve o problema de tracking confiável sem esse risco.

## Escopo deste sub-projeto (#1)

**Critério de sucesso**: abrir o app, ver o mapa de SP com ônibus reais se
movendo, interagir (pan/zoom/rotate) com a mesma fluidez de um app nativo de
verdade, e o visual não parecer genérico/"gerado por IA" nem cópia de outro
app.

**Entra**:
- Projeto Android novo (Kotlin + Jetpack Compose), estrutura de navegação e
  shell principal do app.
- Tema visual novo, redesenhado com direção autoral própria (ver "Direção
  visual" abaixo) — não é o design system web portado, é um redesign.
- Tela de Mapa ao Vivo funcional: MapLibre GL Native, ônibus reais via
  `/api/onibus`, localização do usuário via GPS, gestos nativos fluidos.

**Não entra** (fica para sub-projetos futuros): busca/resultados de rota,
navegação ativa com voz, favoritos, Estações/Notícias, mapas offline,
login/conta de usuário.

## Arquitetura técnica

Módulo único em camadas (multi-modularização é prematura neste estágio):

- `data/` — Retrofit + OkHttp apontando para os endpoints existentes em
  `https://busaisp.vercel.app/api/*`; DTOs; repositórios.
- `domain/` — modelos de negócio e casos de uso (fino — lógica pesada
  permanece no backend).
- `ui/` — telas Compose, ViewModels (`StateFlow`, fluxo unidirecional),
  navegação via Jetpack Navigation Compose, Activity única.
- `di/` — Hilt.

**Mapa**: MapLibre GL Native (renderização vetorial em GPU), tiles gratuitos
via OpenFreeMap (sem API key, sem conta, sem risco de repetir o problema que
tivemos com o CartoDB) — a confirmar/ajustar o provedor exato de tiles durante
a implementação caso surja algum problema real de disponibilidade.

**Localização**: `FusedLocationProviderClient` (Google Play Services, gratuito
— distinto do Google Maps SDK, que não estamos usando).

**Ônibus em tempo real**: repositório faz polling em `/api/onibus` no mesmo
intervalo já usado pelo app web hoje (confirmar valor exato no código durante
a implementação, não inventar um número novo); posições desenhadas como uma
`GeoJsonSource` do MapLibre, atualizada a cada ciclo sem recriar marcadores.
Entre pings de GPS, a posição de cada ônibus é interpolada com base em
heading/velocidade (movimento contínuo, não "teleporte").

## Direção visual

- **Identidade**: em vez de uma paleta de marca genérica, o vocabulário de cor
  nasce do sistema de transporte real de SP — cores oficiais das linhas de
  Metrô/CPTM (Azul, Verde, Vermelha, Amarela, Lilás, Prata) e categorias de
  linha de ônibus da SPTrans.
- **Tipografia**: `IBM Plex Sans` (interface) + `IBM Plex Mono` (números —
  ETAs, códigos de linha, contadores, evocando painéis reais de
  parada/estação). Explicitamente não usar Inter/Roboto padrão sem intenção,
  nem fontes decorativas genéricas.
- **Cor base**: dark-first (preto quase-preto, nunca puro), tema claro em
  off-white quente. Mantém a convenção já validada de "âmbar = dado de GPS ao
  vivo". Sem gradiente roxo-sobre-branco.
- **Comportamento**: mapa de ponta a ponta, controles flutuantes mínimos em
  formato pílula (não botões quadrados de Material padrão). Painel de detalhes
  recolhido numa alça fina por padrão, expande só sob demanda — ataca
  diretamente a queixa de "informação demais na tela". Transições com física
  de mola (spring), não linear.

## Fluxo de dados e tratamento de erro

- Falha de rede → estado real de erro com opção de tentar de novo. Nunca
  spinner infinito escondendo falha, nunca posição de ônibus inventada.
- Se um ciclo de polling falhar mas houver posições recentes na tela, elas
  continuam visíveis por um tempo curto com indicação de "desatualizado há
  Xs" — depois somem, em vez de continuar "andando" com dado velho.
- Permissão de localização negada → mapa continua funcionando normalmente
  (mostra ônibus); só o botão "minha localização" fica desabilitado com
  mensagem honesta, sem fingir GPS que não existe.

## Estratégia de testes

- **Repositórios**: `MockWebServer`, cobrindo respostas reais e falhas de
  conexão (incluindo o estado de erro honesto acima).
- **ViewModels**: JUnit + coroutines de teste, isolados de UI — cobre a
  interpolação de posição e o "desatualizado há Xs".
- **Telas Compose**: testes de UI reais via API de teste do Compose, clicando
  nos controles flutuantes de verdade (mesmo espírito do
  `LiveMap.test.tsx` já escrito na versão web).
- **CI**: GitHub Actions rodando `./gradlew test` a cada push/PR. Testes
  instrumentados (`connectedAndroidTest`) via emulador no CI ficam como tarefa
  explícita separada no plano de implementação (exige mais infraestrutura),
  não descartados silenciosamente.

## Fora de escopo (explícito)

- Qualquer coisa das frentes #2 a #5 da decomposição.
- Segundo plano / notificação persistente / otimização de bateria (registrado
  para #3, ver acima).
- Login/conta de usuário.
- Download de região para uso offline do mapa.
- iOS (fica para depois do Android nativo alcançar paridade).
