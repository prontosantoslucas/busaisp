# Spec — Redesign visual do app Android nativo (azul claro + branco)

Data: 2026-09-01. Escopo: só o app Android nativo (`native-android/`), todas
as 9 telas. O app web (`src/`) não é tocado por este trabalho.

## Contexto

Uma tentativa anterior de reskin dark-first isolado no mapa (commit `20d71ca`)
foi revertida (commit `2e101c0`) porque destoava do resto do app, que usa
Material default (o `Theme.kt` alterna claro/escuro com o sistema, mas nenhuma
tela além do mapa tinha identidade visual forte o bastante pra essa alternância
ser notada). Uma auditoria completa das 9 telas (`HANDOFF.md` PARTE C) também
encontrou lacunas funcionais reais (botão de localização virando no-op, tela
de resultados mostrando "sem resultado" durante busca em andamento) e
estruturais (âmbar vazando pra `colorScheme.primary`, token de tipografia
`EtaCounterStyle` nunca usado).

Depois de comparar referências visuais (apps de mobilidade estilo
card-arredondado, sombra suave, chip de linha colorido), o usuário aprovou uma
direção: **azul claro + branco**, sempre (não adaptável a tema do sistema).

## Decisões

1. **Tema único, sempre claro.** Remove a alternância `isSystemInDarkTheme()`
   em `Theme.kt` — simplifica manutenção e é o que foi pedido explicitamente.
2. **Cor primária = `AppColors.UserLocationBlue` (`#3B82F6`)**, já existente
   no app (usado hoje só pro ponto de localização do usuário no mapa) — reusado
   como acento de marca em vez de inventar um azul novo.
3. **Fundo/superfície = `AppColors.BackgroundLight`/`SurfaceLight`**, já
   existentes — branco/quase-branco quente, cards em branco puro com sombra
   suave (não Material elevation padrão).
4. **Âmbar (`LiveAmber`) continua reservado só pra dado de GPS ao vivo real**
   — convenção já corrigida em `Theme.kt` numa sessão anterior, mantida aqui.
5. **`LineColors` (cores oficiais de Metrô/CPTM) intocado** — usado só na tela
   de Trilhos, onde já é a fonte certa de cor.
6. **Mapa**: reskin leve, não um recolorir total como a tentativa anterior —
   água e áreas verdes com tom azul-claro sutil coerente com a paleta nova,
   ruas neutras, mantendo a legibilidade do estilo Liberty original.
7. **Componentes compartilhados** (novos, em `ui/components/` ou reuso do que
   já existe): card arredondado com sombra suave, chip de linha (número +
   cor), indicador de seleção na navegação inferior.
8. **Fixes funcionais incluídos neste trabalho** (não são só cor — o usuário
   pediu explicitamente "tudo precisa ser funcional"):
   - Busca de linha de metrô/CPTM no mapa reconhece o nome/código e navega
     pra aba Trilhos (que mostra status real) em vez de retornar resultados
     de ônibus confusos ou nada.
   - Botão "minha localização" sempre centraliza a câmera no toque (não vira
     no-op depois do primeiro uso).
   - Câmera enquadra os veículos ao selecionar uma linha.
   - Ônibus interpolam de forma mais fluida (tick de 1000ms → ~220ms).
   - `RouteResultsScreen` mostra skeleton em vez de "Nenhum resultado ainda"
     durante busca em andamento.
   - Todas as telas com `CircularProgressIndicator` genérico (Trilhos,
     Notícias) ou sem estado de loading (Favoritos) ganham skeleton no
     formato do conteúdo real.
   - `EtaCounterStyle` (já existia, nunca usado) aplicado em números
     importantes (duração, ETA, contagem).

## Fora de escopo

- App web (`src/`).
- Tema escuro alternativo (removido, não fica como opção nesta versão).
- Traçado/estações de Metrô no mapa (mostrar veículo em tempo real de trilho
  não é possível — não há fonte de dado; a busca redireciona pra Trilhos em
  vez disso).

## Verificação

`./gradlew.bat :app:compileDebugKotlin`/`assembleDebug` a partir de
`native-android/` antes de considerar qualquer parte pronta. Sem emulador
neste ambiente — instalação/checagem visual real no aparelho fica pendente
pro usuário, como sempre.
