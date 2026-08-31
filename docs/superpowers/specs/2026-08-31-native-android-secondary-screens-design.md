# Android Nativo — Telas Secundárias (Estações/Trilhos, Notícias, Configurações e Offline) Design Spec

**Data:** 2026-08-31  
**Sub-projeto:** #5 (Último da Migração Nativa Android)  
**Branch Base:** `worktree-native-android-favorites`  
**Branch do Projeto:** `worktree-native-android-secondary-screens`  
**Alvo de Merge:** `master` (após os sub-projetos #1, #2, #3 e #4)

---

## 1. Contexto e Objetivos

Este sub-projeto finaliza a migração do app web **BusaÍ SP** para Android nativo (Kotlin + Jetpack Compose), entregando as telas secundárias de suporte à mobilidade urbana:

1. **Estações / Trilhos (Metrô & CPTM)**:
   - Monitoramento em tempo real do status de todas as linhas de trilhos da RMSP (Linhas 1-Azul, 2-Verde, 3-Vermelha, 4-Amarela, 5-Lilás, 7-Rubi, 8-Diamante, 9-Esmeralda, 10-Turquesa, 11-Coral, 12-Safira, 13-Jade, 15-Prata).
   - Cards com as cores oficiais de cada linha, operador (Metrô, CPTM, ViaQuatro, ViaMobilidade), status atual (`Operação Normal`, `Velocidade Reduzida`, `Operação Parcial`, `Paralisada`) e boletim de ocorrência se houver.
   - Dados consumidos da rota real `/api/trilhos/status`.

2. **Notícias e Avisos de Transporte**:
   - Feed unificado de notícias e comunicados da SPTrans, CET, Metrô e guias permanentes de mobilidade (ex: Domingão Tarifa Zero, Bilhete Único).
   - Filtros por categoria (`TODAS`, `TRANSITO`, `TRILHOS`, `SPTRANS`, `INFORMATIVOS`).
   - Modal/tela de leitura detalhada do conteúdo da notícia.
   - Dados consumidos da rota real `/api/noticias`.

3. **Configurações e Sobre o App**:
   - Informações da versão (`BusaÍ SP v0.1.0`), fontes de dados oficiais (SPTrans Olho Vivo, Direto dos Trens, OpenStreetMap/MapLibre).
   - Preferências locais (atalhos e links de suporte).

4. **Tratamento Offline e Conectividade**:
   - Resiliência a falhas de rede com avisos claros e estado de fallback honesto (nunca fabricar dados).

---

## 2. Contratos de API Reais

### 2.1. Status dos Trilhos (`GET /api/trilhos/status`)
```json
{
  "success": true,
  "data": {
    "lines": [
      {
        "id": "1",
        "name": "Linha 1 - Azul",
        "number": "1",
        "colorName": "Azul",
        "hexColor": "#003399",
        "operator": "METRO",
        "status": "NORMAL",
        "statusText": "Operação Normal",
        "description": "Circulação de trens nos intervalos regulares.",
        "updatedAt": "Agora"
      }
    ],
    "summary": {
      "total": 13,
      "normal": 13,
      "withIssues": 0
    },
    "lastChecked": "16:50",
    "source": "Direto dos Trens / CPTM & Metrô"
  },
  "timestamp": "2026-08-31T19:50:00.000Z"
}
```

### 2.2. Notícias e Avisos (`GET /api/noticias`)
```json
{
  "success": true,
  "data": [
    {
      "id": "guide-tarifa-zero",
      "sourceType": "INFORMATIVOS",
      "title": "Domingão Tarifa Zero: Ônibus da SPTrans são 100% gratuitos",
      "subtitle": "Regra permanente aos domingos e feriados em toda a capital",
      "description": "A gratuidade no transporte coletivo municipal...",
      "fullContent": "O programa Domingão Tarifa Zero garante acesso...",
      "timestamp": "Regra Permanente",
      "badge": {
        "label": "TARIFA ZERO",
        "bg": "rgba(16, 185, 129, 0.22)",
        "text": "#34D399",
        "border": "rgba(16, 185, 129, 0.5)"
      },
      "source": "Prefeitura de São Paulo / SPTrans",
      "categoryTag": "Benefícios & Tarifas"
    }
  ],
  "total": 5,
  "timestamp": "2026-08-31T19:50:00.000Z"
}
```

---

## 3. Arquitetura e Componentes

### 3.1. Camada de Dados (Data Layer)
* `RailsApi`: Interface Retrofit com `@GET("api/trilhos/status") suspend fun getRailsStatus(): RailsStatusResponseDto`.
* `NewsApi`: Interface Retrofit com `@GET("api/noticias") suspend fun getNews(): NewsResponseDto`.
* `RailsRepository`: Interface e implementação `NetworkRailsRepository`.
* `NewsRepository`: Interface e implementação `NetworkNewsRepository`.
* DTOs serializados com Moshi.

### 3.2. Camada de Domínio e UI
* Modelos: `RailLine`, `RailsSummary`, `NewsItem`, `NewsCategory`.
* ViewModels:
  * `RailsViewModel`: expõe `uiState` (`Loading`, `Success(lines, summary)`, `Error`). Método `refresh()`.
  * `NewsViewModel`: expõe `uiState`, filtro ativo (`selectedFilter`), notícias filtradas e notícia ativa para leitura.
* Telas Compose:
  * `RailsScreen`: cabeçalho de resumo (linhas normais / com lentidão), lista ordenada por número da linha com badges coloridas e status.
  * `NewsScreen`: barra de chips de categorias, cards de notícias e diálogo/painel de leitura expandida.
  * `SettingsScreen`: painel com informações da versão e fontes de dados.

### 3.3. Navegação (`BusaiNavHost`)
A barra de navegação inferior passará a ter 5 abas com ícones expressivos:
1. `Mapa` (Ícone Map)
2. `Rotas` (Ícone Route)
3. `Trilhos` (Ícone Train / DirectionsTransit)
4. `Favoritos` (Ícone Star)
5. `Avisos` (Ícone Newspaper / Notifications)

Com botão de Configurações acessível no topo das telas secundárias ou via menu.

---

## 4. Estratégia de Testes (TDD)
- **Unitários**:
  - `RailsRepositoryTest`: valida parsing de sucesso, erro de rede, linhas com ocorrência.
  - `NewsRepositoryTest`: valida parsing de notícias e badges.
  - `RailsViewModelTest`: valida estados de loading, sucesso e refresh.
  - `NewsViewModelTest`: valida filtragem por categoria e seleção de notícia.
- **Instrumentados de UI**:
  - `RailsScreenTest` e `NewsScreenTest` verificando renderização sem crash e exibição de dados.
