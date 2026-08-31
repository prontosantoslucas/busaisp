# Migração para Android Nativo — Sub-projeto #4: Favoritos e Personalização

## Contexto

Quarta frente da migração nativa (sub-projetos #1/#2/#3 completos, PRs #1/#2/#3
abertos). Spec enxuto, mesmo formato do sub-projeto #3 — arquitetura/processo
já validados, só o que é novo é detalhado aqui.

## Dado real a replicar (lido de `src/`, não inventado)

`FavoriteItem` real (`src/lib/supabase.ts`):
```ts
interface FavoriteItem {
  type: 'linha' | 'parada' | 'trilho' | 'endereco';
  ref_code: string;
  title: string;
  label?: string;
  details?: Record<string, any>;
}
```

**Persistência real hoje**: localStorage no navegador, com sincronização
opcional pro Supabase SE houver sessão autenticada — mas não existe fluxo de
login implementado no app web hoje, então na prática 100% dos favoritos são
locais. O app nativo replica esse comportamento real (só local), não o
comportamento teórico (sync na nuvem) — decisão YAGNI: não adicionar SDK do
Supabase nem inventar autenticação que não existe em lugar nenhum do produto
ainda.

**Favoritar uma rota** (`src/app/page.tsx:405-414`, real): não salva o
`RoutePlan` inteiro — favorita a **linha recomendada** dele
(`type: 'linha'`, `ref_code: recommendedLine.cl`, título combinando
letreiro+destino, `label: 'Rota'`). O app nativo já tem `RoutePlan.recommendedLine`
(sub-projeto #3) pronto pra isso.

**Casa/Trabalho** (`src/components/Favorites/FavoritesDrawer.tsx`): dois
slots fixos e reais, `ref_code` sentinela `'home'`/`'work'` dentro do tipo
`'endereco'`, endereço definido pelo usuário via busca real (mesmo
autocomplete já usado na busca de rota).

## Escopo (recorte deliberado pro que o app nativo já tem)

O app nativo hoje só navega por **linha** (busca de linha no Mapa,
sub-projeto #1) e **rota** (busca origem/destino, sub-projeto #2) — não tem
telas de parada/trilho avulsas ainda (isso é sub-projeto #5). Então este
sub-projeto implementa só os 2 tipos de favorito genuinamente alcançáveis
hoje: `LINHA` (favoritar um resultado de rota) e `ENDERECO` (Casa/Trabalho +
outros endereços salvos). `PARADA`/`TRILHO` ficam pro sub-projeto #5, quando
as telas que os tornam alcançáveis existirem.

**Entra**:
- `FavoriteRepository` local (Android DataStore Preferences, chave única com
  lista serializada via Moshi — já é dependência do projeto) — sem
  dependência nova de rede/nuvem.
- Estrela de favoritar em cada card de resultado de rota
  (`RoutePlanCard`, sub-projeto #2).
- Tela de Favoritos: 2 slots fixos (Casa/Trabalho, editáveis via o mesmo
  componente de busca de endereço já existente) + lista dos demais
  favoritos (rotas), com remoção.
- 3ª aba na barra de navegação inferior ("Favoritos"), ao lado de
  Mapa/Rotas.
- Atalho "usar Casa/Trabalho como origem/destino" na tela de busca de rota.

**Não entra**: favoritar parada/trilho avulsos (sem tela ainda),
sincronização na nuvem/login.

## Arquitetura

Mesmo padrão: TDD no repositório/ViewModel, Hilt, `StateFlow`,
tratamento de erro honesto. Processo de revisão combinada (conformidade +
qualidade numa passada) e tasks em lote, como no sub-projeto #3.
