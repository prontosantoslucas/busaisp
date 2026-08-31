# Android Nativo — Telas Secundárias (Estações/Trilhos, Notícias e Configurações) Implementation Plan

> **For agentic workers:** Processo acelerado com TDD e tarefas acopladas em lote. Princípio inegociável: nunca fabricar dados — todo dado vem de APIs reais ou é informado honestamente.

**Goal:** Implementar as telas secundárias da mobilidade urbana no Android:
1. Status em tempo real das linhas de Metrô e CPTM (`RailsScreen`).
2. Feed unificado de notícias e avisos de transporte (`NewsScreen`).
3. Tela de configurações e informações sobre o app (`SettingsScreen`).
4. Barra de navegação inferior com 5 abas completas no `BusaiNavHost`.

---

## Task 1: DTOs, APIs Retrofit e Repositórios para Trilhos e Notícias (TDD)

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/data/network/RailsApi.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/data/network/NewsApi.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/domain/model/Rail.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/domain/model/News.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/data/repository/RailsRepository.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/data/repository/NewsRepository.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/di/SecondaryDataModule.kt`
- Test: `native-android/app/src/test/java/com/busaisp/android/data/repository/RailsRepositoryTest.kt`
- Test: `native-android/app/src/test/java/com/busaisp/android/data/repository/NewsRepositoryTest.kt`

- [x] **Step 1: Criar modelos de domínio e DTOs de Trilhos e Notícias**
- [x] **Step 2: Criar interfaces de API Retrofit `RailsApi` e `NewsApi`**
- [x] **Step 3: Criar testes unitários com MockWebServer (`RailsRepositoryTest` e `NewsRepositoryTest`)**
- [x] **Step 4: Implementar repositórios e módulo Hilt**
- [x] **Step 5: Executar testes de unidade e verificar sucesso**

---

## Task 2: ViewModels para Trilhos e Notícias (TDD)

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/rails/RailsViewModel.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/news/NewsViewModel.kt`
- Test: `native-android/app/src/test/java/com/busaisp/android/ui/rails/RailsViewModelTest.kt`
- Test: `native-android/app/src/test/java/com/busaisp/android/ui/news/NewsViewModelTest.kt`

- [x] **Step 1: Escrever testes unitários de `RailsViewModelTest` e `NewsViewModelTest`**
- [x] **Step 2: Implementar `RailsViewModel` com estados `Loading`, `Success` e `Error` e função `refresh()`**
- [x] **Step 3: Implementar `NewsViewModel` com filtro de categorias e leitor de notícias**
- [x] **Step 4: Executar testes e validar**

---

## Task 3: Telas de UI Compose (`RailsScreen`, `NewsScreen`, `SettingsScreen`)

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/rails/RailsScreen.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/news/NewsScreen.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/settings/SettingsScreen.kt`

- [x] **Step 1: Criar `RailsScreen` com cabeçalho de resumo, cores das linhas de metrô/CPTM e alertas**
- [x] **Step 2: Criar `NewsScreen` com chips de categorias, cards com badges e modal de leitura**
- [x] **Step 3: Criar `SettingsScreen` com dados sobre o app, versão e links de fontes oficiais**

---

## Task 4: Integração de Navegação com 5 Abas no `BusaiNavHost`

**Files:**
- Modify: `native-android/app/src/main/java/com/busaisp/android/ui/navigation/BusaiNavHost.kt`

- [x] **Step 1: Adicionar rotas `RAILS`, `NEWS` e `SETTINGS`**
- [x] **Step 2: Atualizar `BOTTOM_TABS` para 5 abas (Mapa, Rotas, Trilhos, Favoritos, Avisos)**
- [x] **Step 3: Conectar os novos destinos no `NavHost`**

---

## Task 5: Testes de UI Instrumentados e Validação Final

**Files:**
- Create: `native-android/app/src/androidTest/java/com/busaisp/android/ui/rails/RailsScreenTest.kt`
- Create: `native-android/app/src/androidTest/java/com/busaisp/android/ui/news/NewsScreenTest.kt`
- Modify: `HANDOFF.md`

- [x] **Step 1: Escrever testes instrumentados de UI para Trilhos e Notícias**
- [x] **Step 2: Rodar compilação e todos os testes unitários (`.\gradlew.bat clean assembleDebug testDebugUnitTest assembleDebugAndroidTest`)**
- [x] **Step 3: Atualizar `HANDOFF.md`, commitar, subir branch e abrir PR #5**
