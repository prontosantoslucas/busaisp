# Spec — Pagamento único via Pix (Mercado Pago) pro app Android nativo

Data: 2026-09-01. Status: **desenhado e aprovado pelo usuário, implementação
adiada a pedido dele** — "save isso para implementarmos posteriormente".
Não implementar nada disto até o usuário pedir explicitamente pra continuar.

## Contexto e decisões já tomadas (não re-perguntar)

O app hoje não tem login/conta de usuário — isso inclusive é anunciado como
diferencial na tela Sobre ("Sem Login / Sem Rastreamento em Nuvem"). O
pagamento precisa funcionar sem quebrar isso.

Decisões confirmadas com o usuário nesta sessão:

1. **Preço: R$ 7,89**, pagamento único (não assinatura).
2. **Gatilho**: 7 dias corridos de teste grátis a partir da primeira abertura
   do app, depois bloqueia o uso até pagar.
3. **Vínculo do pagamento ao aparelho, sem criar conta**: ID anônimo (UUID)
   gerado no primeiro uso, salvo localmente (DataStore, mesmo padrão já usado
   em Favoritos/Tema). Recuperação em caso de reinstalação/troca de aparelho:
   o usuário informa o CPF ou e-mail usado no pagamento, e o novo `deviceId`
   é liberado.
4. **Provedor: Mercado Pago**, via Pix (QR code + copia-e-cola).
5. Usuário **já tem conta Mercado Pago**, mas ainda não pegou as credenciais
   de API (Access Token de produção) — isso é um passo pendente dele antes de
   implementar (Painel Mercado Pago → Suas integrações → Credenciais de
   produção). **O Access Token nunca deve aparecer em código, chat ou
   commit** — só como variável de ambiente na Vercel (`MERCADOPAGO_ACCESS_TOKEN`).

## Arquitetura

### Backend (Next.js na Vercel, reaproveita o Supabase já usado pro GTFS)

Tabela nova `app_licenses`:
- `device_id` (texto, UUID gerado pelo app)
- `cpf_ou_email` (texto, informado no checkout)
- `payment_id` (texto, ID do pagamento no Mercado Pago)
- `status` (`pendente` | `pago`)
- `created_at`, `paid_at`

Endpoints novos em `src/app/api/pagamento/`:

- **`POST /api/pagamento/criar`** — recebe `deviceId` (+ CPF/e-mail
  opcionalmente nesse momento ou só na recuperação). Chama a API do Mercado
  Pago (`POST https://api.mercadopago.com/v1/payments`, `payment_method_id:
  "pix"`, `transaction_amount: 7.89`) usando o Access Token (env var,
  servidor). Devolve pro app o QR code (`qr_code_base64`) e o copia-e-cola
  (`qr_code`) que vêm na resposta do Mercado Pago, mais o `payment_id`.
  Grava uma linha `pendente` em `app_licenses`.
- **`POST /api/pagamento/webhook`** — recebido do Mercado Pago quando o
  status de um pagamento muda. **Nunca confiar no payload da notificação
  diretamente** (pode ser forjado) — sempre buscar de novo o status real via
  `GET /v1/payments/{id}` com o Access Token antes de marcar `status =
  'pago'` em `app_licenses`. Configurar a URL do webhook no painel do
  Mercado Pago apontando pra este endpoint.
- **`GET /api/pagamento/status?deviceId=X`** — o app consulta pra saber se
  aquele `deviceId` está liberado. Resposta simples `{ pago: boolean }`.
- **`POST /api/pagamento/recuperar`** — recebe `{ cpfOuEmail, deviceId }`;
  se existir uma licença `paga` com esse CPF/e-mail, associa (ou duplica a
  linha para) o novo `deviceId`. Responder de forma genérica (não confirmar/
  negar existência do CPF/e-mail de forma que vaze dado — mensagem neutra
  tipo "se encontrado, foi liberado").

### App Android

- **Novo módulo `data/license/`**: `LicenseRepository` (DataStore, mesmo
  padrão de `FavoriteRepository`/`ThemePreferenceRepository`) guardando
  `deviceId` (gerado uma vez, nunca muda), `firstLaunchAt` (epoch, gravado na
  primeira abertura) e `isPaidCached` (último resultado confirmado do
  backend — permite funcionar offline depois de verificado uma vez, sem
  exigir rede toda vez que o app abre).
- **`LicenseViewModel`**: calcula `trialExpired = now > firstLaunchAt + 7
  dias`; consulta `/api/pagamento/status` periodicamente (ex.: a cada
  abertura do app, sem bloquear se der falha de rede — usa `isPaidCached`
  como fallback honesto, nunca assume pago por causa de erro de rede).
  Estado exposto: liberado se `!trialExpired || isPaid`.
- **`PaywallScreen`**: mostrada no lugar do `BusaiNavHost` quando bloqueado.
  Preço, botão "Pagar com Pix" (chama `/api/pagamento/criar`, mostra QR +
  copia-e-cola com botão de copiar), e um link "Já comprei em outro
  aparelho" que abre um campo pra CPF/e-mail (chama `/api/pagamento/recuperar`).
  Depois de gerar o QR, o app pode: (a) a pessoa toca "já paguei, verificar"
  pra chamar `/api/pagamento/status` de novo, e/ou (b) o app faz polling
  discreto em intervalo curto enquanto a tela do Pix está aberta.
- **Gate no nível mais alto** (`MainActivity`/em volta de `BusaiNavHost`):
  se `LicenseViewModel` diz bloqueado, renderiza `PaywallScreen` em vez da
  navegação normal — nenhuma tela do app (mapa, rotas, etc.) é alcançável
  sem passar por ali.

## Segurança — não negociável

- Access Token do Mercado Pago **só existe como env var no backend
  (Vercel)**, nunca no APK (que pode ser decompilado) nem em código/commit.
- Webhook sempre reconfirma o pagamento com a API do Mercado Pago antes de
  liberar — nunca confia só na notificação recebida.
- Endpoint de recuperação não deve virar oráculo pra descobrir se um
  CPF/e-mail específico já comprou (resposta genérica).

## Fora de escopo desta primeira versão

- Reembolso/estorno automático.
- Assinatura recorrente (é pagamento único, por decisão explícita).
- Conta de usuário completa (login/senha) — deliberadamente evitado.
- Publicação na Google Play — se isso vier a acontecer no futuro, a política
  da Play Store pode exigir Google Play Billing em vez de pagamento externo
  pra desbloqueio de app; como a distribuição hoje é só APK direto, isso não
  se aplica ainda, mas vale reavaliar se um dia for publicar lá.

## Pré-requisito antes de implementar

Usuário precisa pegar o Access Token de produção no painel do Mercado Pago
(Suas integrações → Credenciais de produção) e configurá-lo como variável de
ambiente `MERCADOPAGO_ACCESS_TOKEN` na Vercel. Isso não foi feito ainda.
