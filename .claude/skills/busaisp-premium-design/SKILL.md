---
name: busaisp-premium-design
description: Use whenever building, redesigning, or polishing any visual/UI surface of the BusaÍ SP app — the Next.js/Tailwind web app in src/ or the native Android/Compose app in native-android/. Trigger on requests like "deixa mais bonito", "melhora a UX", "quero um app no nível de Uber/Waze/99/InDrive", "adiciona animação", "o layout tá básico", "cria uma tela nova", or any proposal that touches colors, typography, motion, spacing, or component visuals in this repo — even if the user doesn't use design vocabulary. Also use it to review a design/UX plan or PR before it's implemented, not just when writing code directly.
---

O BusaÍ SP já tem um sistema de design deliberado, não uma base em branco: paleta
dark-first (`--bus-*` no app web, `AppColors`/`LineColors` no Android), fontes
IBM Plex, animações de pulso já testadas contra dado real (GPS ao vivo). O maior
risco ao "deixar mais bonito" não é falta de ideias — é redesenhar por cima do
que já existe sem perceber, produzindo um sistema inconsistente ou revertendo
decisões que já foram validadas. Isso já aconteceu neste projeto: um plano de UX
propôs uma paleta "nova" quase idêntica à existente e descreveu como "ausente"
um botão de radar de pulso que já estava implementado, porque ninguém leu o
`globals.css` antes de escrever o plano.

Por isso esta skill tem duas partes, nessa ordem: **auditar antes de desenhar**,
e só depois **elevar ao nível de app de mobilidade premium de verdade** (Uber,
Waze, 99, InDrive) — não visual genérico de dashboard ou site institucional.

## Parte 1 — Audite antes de propor qualquer mudança

Antes de escrever uma linha de CSS, Compose, ou de propor uma paleta/animação
nova, leia o sistema atual. Isto não é burocracia — é a diferença entre
adicionar sobre uma base coerente e criar uma segunda base concorrente que o
próximo agente (ou você mesmo, na próxima sessão) vai ter que reconciliar.

- **Web** (`src/`): leia `src/app/globals.css` inteiro — as variáveis `--bus-*`
  (cor, borda, sombra, raio), os `@keyframes` já existentes (`radarPulse`,
  `markerPulse`, `slideUp`, `fadeIn` — ver `references/design-tokens.md` para a
  lista completa e onde cada coisa mora) e como `backdrop-blur`/glass já é usado
  nos componentes (`grep -rn "backdrop-blur" src`).
- **Android nativo** (`native-android/`): leia
  `.../ui/theme/{Color,Theme,Type}.kt` — `AppColors` (paleta dark-first) e
  `LineColors` (cores oficiais de Metrô/CPTM), e confira as fontes IBM Plex já
  empacotadas em `app/src/main/res/font/`.
- Se uma tela do mapa já foi "reskinada" (ex.: o reskin dark do MapLibre em
  `native-android/.../ui/map/MapDarkPalette.kt`), trate esse trabalho como
  fonte de verdade da paleta de mapa, não como algo a redescobrir.

Antes de introduzir qualquer cor, animação ou componente novo, pergunte: **isso
já existe com outro nome?** Se a resposta é "quase" (ex.: um roxo a poucos tons
de distância do `--bus-violet` já existente), **reuse o token existente** em vez
de criar um primo próximo — um sistema com 3 roxos quase-iguais é pior que um
sistema com um roxo só, mesmo que cada um individualmente "pareça" bom. Quando
genuinamente for preciso estender a paleta (um papel semântico que não existe
ainda), derive do que já existe e documente o porquê, do jeito que
`MapDarkPalette.kt` derivou de `AppColors.BackgroundDark` em vez de inventar um
preto novo.

Web e Android são o mesmo produto: quando um papel semântico (fundo, superfície,
"dado ao vivo", erro) já tem uma cor definida numa plataforma, a outra deveria
usar a cor equivalente (não precisa ser o hex idêntico pixel a pixel, mas a
mesma intenção) — hoje `--bus-live`/`--bus-amber` no web e `AppColors.LiveAmber`
no Android já convergem nisso (âmbar = GPS ao vivo); mantenha essa convenção
para qualquer papel novo em vez de deixar cada plataforma inventar a própria.

## Parte 2 — Eleve ao nível de app de mobilidade premium

"Bonito" sozinho não é o alvo — o alvo é a sensação tátil e a confiança visual
de um app de mobilidade em produção de verdade. Isso se traduz em padrões
concretos e verificáveis, não em adjetivos:

- **Bottom sheets com física real**: arrasta com inércia e mola (spring), não
  aparece/some com fade linear. Web: Motion/Framer Motion ou `cubic-bezier`
  desenhado à mão imitando spring; Android Compose: `Animatable` +
  `spring()`/`tween` com `dampingRatio`, nunca `LinearEasing` para algo que o
  usuário toca e arrasta.
- **Dado ao vivo respira, não pisca**: posição de ônibus, GPS do usuário,
  contadores de ETA — interpolação contínua entre atualizações (já existe no
  Android, `interpolatePosition`), nunca um salto de posição a cada ping.
  Indicadores de "ao vivo" usam pulso/breathing sutil (`radarPulse`,
  `markerPulse` já existem no web), nunca um ícone estático.
- **Câmera nunca corta**: centralizar/seguir o usuário ou um ônibus é sempre
  `flyTo`/`easeCamera`/animação de câmera, nunca um `setCenter` instantâneo.
- **Feedback de toque imediato**: todo elemento tocável reage em <100ms (scale
  down sutil + spring de volta, mudança de elevação/sombra), mesmo antes da
  ação de verdade completar — o usuário nunca fica sem saber se o toque
  registrou.
- **Loading é skeleton, não spinner genérico** quando a forma final do
  conteúdo é previsível (lista de rotas, card de linha) — spinner só quando não
  há forma prévia para anteceder (ex.: geolocalização inicial).
- **Hierarquia tipográfica com contraste real**: números que importam (ETA,
  distância, preço) em peso/tamanho claramente maior que o texto de apoio ao
  redor — não tudo no mesmo peso "regular" disputando atenção.
- **Um único acento por intenção, usado com disciplina**: se âmbar já significa
  "GPS ao vivo" neste app, não reusar âmbar para "atenção genérica" nem
  introduzir um segundo tom de âmbar para outra coisa — a força de um acento
  vem de ele significar sempre a mesma coisa.
- **Performance é parte do design, não um afterthought**: anime `transform`/
  `opacity` (compositor), não `width`/`top`/`left`; no web, memoize camadas de
  mapa caras para não re-renderizar a cada frame; no Compose, evite recomposição
  em cascata em loops de atualização (posição de ônibus, por exemplo) usando
  `remember`/`derivedStateOf`. Um app "bonito" que engasga ao rolar não está no
  nível de Uber/Waze — está pior que um app simples que roda liso.

Ao terminar uma peça de UI, faça o teste mental explícito: **"isso pareceria
fora de lugar dentro do Uber, Waze, 99 ou InDrive?"** Se a resposta for sim —
ou porque é genérico demais (gradiente roxo sobre fundo branco, spinner
padrão, Inter/Roboto sem intenção) ou porque quebra a linguagem visual que o
BusaÍ SP já construiu — volte e ajuste antes de considerar terminado.

## Verificação

Não declare uma mudança visual pronta sem ver o resultado de verdade:
- Web: suba o dev server (`npm run dev`) e confira no navegador — inclusive
  redimensionando pra mobile, já que é o uso real predominante deste app.
- Android: rode `assembleDebug`/testes relevantes; sem emulador disponível
  neste ambiente, seja explícito sobre o que foi verificado por build/teste
  versus o que ainda depende de alguém instalar o APK e olhar (não alegue
  "ficou ótimo visualmente" sem ter visto).

Para o inventário completo e atualizado de tokens/animações/arquivos por
plataforma, ver `references/design-tokens.md` — mas trate-o como um mapa de
"onde procurar", não como a fonte de verdade dos valores: releia o arquivo
real antes de confiar num hex ou nome específico, porque este documento pode
ficar desatualizado enquanto o código muda.
