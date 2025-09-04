# Guia Técnico - Cypress Real World App Testing

## 📋 Índice
1. [Estrutura do Projeto](#estrutura-do-projeto)
2. [Configuração Base](#configuração-base)
3. [Seletores e Data Attributes](#seletores-e-data-attributes)
4. [Comandos Customizados](#comandos-customizados)
5. [Padrões de Teste](#padrões-de-teste)
6. [Interceptação de Requests](#interceptação-de-requests)
7. [Modelos de Dados](#modelos-de-dados)
8. [Utilitários](#utilitários)
9. [Templates para Prompts](#templates-para-prompts)

---

## 🏗️ Estrutura do Projeto

### Arquivos de Configuração
```
cypress-realworld-app/
├── cypress.json              # Configuração principal
├── cypress/
│   ├── global.d.ts          # Definições TypeScript
│   ├── support/
│   │   ├── index.ts         # Imports principais
│   │   ├── commands.ts      # Comandos customizados
│   │   └── utils.ts         # Utilitários
│   ├── plugins/
│   │   └── index.ts         # Plugins e tasks
│   ├── fixtures/            # Dados de teste
│   └── tests/
│       ├── ui/              # Testes de interface
│       └── api/             # Testes de API
```

### Estrutura dos Testes UI
```
cypress/tests/ui/
├── auth-login.spec.ts       # Autenticação e login
├── auth.spec.ts             # Registro e autenticação completa
├── bankaccounts.spec.ts     # Gerenciamento de contas bancárias
├── new-transaction.spec.ts  # Criação de transações
├── notifications.spec.ts    # Sistema de notificações
├── transaction-feeds.spec.ts # Feeds de transações
├── transaction-view.spec.ts # Visualização de transações
├── user-onboarding.spec.ts  # Onboarding de usuários
└── user-settings.spec.ts    # Configurações de usuário
```

---

## ⚙️ Configuração Base

### cypress.json
```json
{
  "baseUrl": "http://localhost:3000",
  "projectId": "7s5okt",
  "integrationFolder": "cypress/tests",
  "viewportHeight": 1000,
  "viewportWidth": 1280,
  "firefoxGcInterval": null,
  "retries": {
    "runMode": 2,
    "openMode": 1
  },
  "env": {
    "apiUrl": "http://localhost:3001",
    "mobileViewportWidthBreakpoint": 414,
    "coverage": false,
    "codeCoverage": {
      "url": "http://localhost:3001/__coverage__"
    }
  }
}
```

### Setup Padrão dos Testes
```typescript
beforeEach(function () {
  cy.task("db:seed");
  cy.server();
  
  // Interceptações padrão
  cy.route("POST", "/login").as("loginUser");
  cy.route("GET", "checkAuth").as("getUserProfile");
  cy.route("GET", "/notifications").as("getNotifications");
  
  // Setup de dados e login
  cy.database("find", "users").then((user: User) => {
    ctx.user = user;
    return cy.loginByXstate(ctx.user.username);
  });
});
```

---

## 🎯 Seletores e Data Attributes

### Comandos de Seleção
```typescript
// Seletor exato
cy.getBySel("signin-username")
// Equivale a: cy.get('[data-test="signin-username"]')

// Seletor parcial (contains)
cy.getBySelLike("user-list-item")
// Equivale a: cy.get('[data-test*="user-list-item"]')
```

### Principais Seletores por Módulo

#### 🔐 Autenticação
```typescript
// Login
"signin-title"           // Título da página
"signin-username"        // Campo username
"signin-password"        // Campo password
"signin-remember-me"     // Checkbox lembrar
"signin-submit"          // Botão enviar
"signin-error"           // Mensagem de erro

// Registro
"signup-title"           // Título registro
"signup-first-name"      // Primeiro nome
"signup-last-name"       // Sobrenome
"signup-username"        // Nome de usuário
"signup-password"        // Senha
"signup-confirmPassword" // Confirmar senha
"signup-submit"          // Botão registrar
"signup"                 // Link para registro
```

#### 🏦 Contas Bancárias
```typescript
"bankaccount-new"              // Botão nova conta
"bankaccount-form"             // Formulário
"bankaccount-bankName-input"   // Nome do banco
"bankaccount-routingNumber-input" // Número roteamento
"bankaccount-accountNumber-input" // Número conta
"bankaccount-submit"           // Enviar formulário
"bankaccount-list"             // Lista de contas
"bankaccount-list-item-{id}"   // Item da lista
"bankaccount-delete"           // Botão deletar
```

#### 💰 Transações
```typescript
// Navegação
"nav-top-new-transaction"      // Botão nova transação
"nav-transaction-tabs"         // Abas de navegação
"nav-public-tab"               // Aba pública
"nav-contacts-tab"             // Aba contatos
"nav-personal-tab"             // Aba pessoal

// Criação
"transaction-create-form"      // Formulário
"transaction-create-amount-input"      // Campo valor
"transaction-create-description-input" // Campo descrição
"transaction-create-submit-request"    // Enviar pedido
"transaction-create-submit-payment"    // Enviar pagamento

// Lista e detalhes
"transaction-list"             // Lista transações
"transaction-item-{id}"        // Item transação
"transaction-like-button-{id}" // Botão curtir
"transaction-accept-request-{id}" // Aceitar pedido
"transaction-reject-request-{id}" // Rejeitar pedido
```

#### 👤 Usuários
```typescript
// Lista de usuários
"users-list"                   // Lista
"user-list-item-{id}"         // Item usuário
"user-list-search-input"      // Campo busca

// Configurações
"user-settings-form"          // Formulário
"user-settings-firstName-input"    // Primeiro nome
"user-settings-lastName-input"     // Sobrenome
"user-settings-email-input"        // Email
"user-settings-phoneNumber-input"  // Telefone
"user-settings-submit"             // Enviar
```

#### 🏠 Navegação e Layout
```typescript
// Sidebar
"sidenav"                     // Sidebar
"sidenav-toggle"              // Toggle sidebar
"sidenav-home"                // Home
"sidenav-user-settings"       // Configurações
"sidenav-bankaccounts"        // Contas bancárias
"sidenav-notifications"       // Notificações
"sidenav-signout"             // Logout
"sidenav-username"            // Nome usuário
"sidenav-user-balance"        // Saldo usuário

// Header
"app-name-logo"               // Logo app
"nav-top-notifications-link"  // Link notificações
"nav-top-notifications-count" // Contador notificações

// Geral
"main"                        // Conteúdo principal
"alert-bar-success"           // Alerta sucesso
"alert-bar-error"             // Alerta erro
"empty-list-header"           // Lista vazia
```

#### 🔔 Notificações
```typescript
"notifications-list"          // Lista notificações
"notification-list-item-{id}" // Item notificação
"notification-mark-read-{id}" // Marcar como lida
```

#### 📝 Onboarding
```typescript
"user-onboarding-dialog"      // Modal onboarding
"user-onboarding-dialog-title"    // Título modal
"user-onboarding-dialog-content"  // Conteúdo modal
"user-onboarding-next"             // Próximo passo
"user-onboarding-logout"           // Logout onboarding
```

---

## 🛠️ Comandos Customizados

### Autenticação
```typescript
// Login via UI
cy.login(username: string, password: string, rememberUser?: boolean)

// Login via API
cy.loginByApi(username: string, password?: string)

// Login via XState (mais rápido)
cy.loginByXstate(username: string, password?: string)

// Logout via XState
cy.logoutByXstate()

// Trocar usuário
cy.switchUser(username: string)
```

### Database
```typescript
// Buscar um registro
cy.database("find", "users", { username: "Tavares_Barrows" })

// Filtrar registros
cy.database("filter", "users", { firstName: "John" })

// Seed database
cy.task("db:seed")
```

### Utilitários
```typescript
// Criar transação via XState
cy.createTransaction({
  transactionType: "payment" | "request",
  amount: number,
  description: string,
  sender: User,
  receiver: User
})

// Navegar páginas da feed
cy.nextTransactionFeedPage(service: string, page: number)

// Selecionar range de datas
cy.pickDateRange(startDate: Date, endDate: Date)

// Definir range de valores
cy.setTransactionAmountRange(min: number, max: number)

// Verificar se é mobile
isMobile() // função utilitária
```

---

## 📊 Modelos de Dados

### User
```typescript
interface User {
  id: string;
  uuid: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  phoneNumber: string;
  balance: number;
  avatar: string;
  defaultPrivacyLevel: DefaultPrivacyLevel;
  createdAt: Date;
  modifiedAt: Date;
}

enum DefaultPrivacyLevel {
  public = "public",
  private = "private",
  contacts = "contacts",
}
```

### Transaction
```typescript
interface Transaction {
  id: string;
  amount: number;
  description: string;
  transactionType: "payment" | "request";
  status: "pending" | "complete" | "cancelled";
  senderId: string;
  receiverId: string;
  createdAt: Date;
  modifiedAt: Date;
}
```

### BankAccount
```typescript
interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  isDeleted: boolean;
  userId: string;
  createdAt: Date;
  modifiedAt: Date;
}
```

---

## 🌐 Interceptação de Requests

### Padrões de Interceptação
```typescript
// Autenticação
cy.route("POST", "/login").as("loginUser");
cy.route("GET", "checkAuth").as("getUserProfile");
cy.route("POST", "/logout").as("logoutUser");

// Usuários
cy.route("GET", "/users").as("allUsers");
cy.route("GET", "/users/search*").as("usersSearch");

// Transações
cy.route("POST", "/transactions").as("createTransaction");
cy.route("GET", "/transactions/public").as("publicTransactions");
cy.route("GET", "/transactions").as("personalTransactions");
cy.route("PATCH", "/transactions/*").as("updateTransaction");

// Contas bancárias
cy.route("POST", "/bankAccounts").as("createBankAccount");
cy.route("DELETE", "/bankAccounts/*").as("deleteBankAccount");

// Notificações
cy.route("GET", "/notifications").as("getNotifications");
```

### Uso das Interceptações
```typescript
// Aguardar request
cy.wait("@loginUser").its("status").should("eq", 200);

// Verificar múltiplas requests
cy.wait(["@createTransaction", "@getUserProfile"]);

// Validar response
cy.wait("@updateTransaction").its("status").should("equal", 204);
```

---

## 🎨 Padrões de Teste

### Estrutura Padrão
```typescript
import { User } from "../../../src/models";
import { isMobile } from "../../support/utils";

type TestCtx = {
  user?: User;
  // outros contextos necessários
};

describe("Feature Name", function () {
  const ctx: TestCtx = {};

  beforeEach(function () {
    cy.task("db:seed");
    cy.server();
    
    // interceptações...
    
    cy.database("find", "users").then((user: User) => {
      ctx.user = user;
      return cy.loginByXstate(ctx.user.username);
    });
  });

  it("should do something", function () {
    // teste...
  });
});
```

### Validações Comuns
```typescript
// URLs
cy.url().should("include", "/signin");
cy.location("pathname").should("eq", "/bankaccounts");

// Elementos visíveis
cy.getBySel("signin-title").should("be.visible");
cy.getBySel("alert-bar-success").should("be.visible").and("have.text", "Success!");

// Formulários
cy.getBySel("submit-button").should("be.disabled");
cy.get("#field-helper-text").should("be.visible").and("contain", "Error message");

// Listas
cy.getBySelLike("transaction-item").should("have.length.greaterThan", 1);
cy.getBySel("empty-list-header").should("contain", "No items");

// Cookies e session
cy.getCookie("connect.sid").should("exist");
```

### Mobile Testing
```typescript
context("Mobile View", function () {
  beforeEach(function () {
    if (isMobile()) {
      cy.viewport("iphone-6");
    }
  });

  it("should be responsive", function () {
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }
    // teste mobile...
  });
});
```

---

## 📸 Percy Snapshots
```typescript
// Snapshot visual
cy.percySnapshot("Sign In Page");
cy.percySnapshot("Transaction List with Data");
```

---

## 🎯 Templates para Prompts

### Template Base para Chain of Thoughts
```
Você é um especialista em testes automatizados com Cypress. Preciso que você analise este cenário e siga estas etapas:

1. **ANÁLISE**: Entenda o que precisa ser testado
2. **PLANEJAMENTO**: Defina os passos do teste
3. **IMPLEMENTAÇÃO**: Escreva o código Cypress
4. **VALIDAÇÃO**: Inclua as verificações necessárias

**CONTEXTO DO PROJETO:**
- App de pagamentos (Real World App)
- Base URL: http://localhost:3000
- API URL: http://localhost:3001
- TypeScript + Material-UI
- Seletores: data-test attributes

**COMANDOS DISPONÍVEIS:**
- cy.getBySel(selector) - seletor exato
- cy.getBySelLike(selector) - seletor parcial
- cy.loginByXstate(username, password) - login rápido
- cy.database("find|filter", entity, query) - query database
- cy.createTransaction(payload) - criar transação via XState

**CENÁRIO A TESTAR:**
[DESCREVER O CENÁRIO]

**DADOS NECESSÁRIOS:**
[DEFINIR DADOS DE TESTE]

Siga o padrão:
```typescript
import { User } from "../../../src/models";
import { isMobile } from "../../support/utils";

type TestCtx = {
  user?: User;
};

describe("Feature", function () {
  const ctx: TestCtx = {};
  
  beforeEach(function () {
    cy.task("db:seed");
    cy.server();
    // interceptações...
  });
  
  it("should test scenario", function () {
    // implementação...
  });
});
```
```

### Template para Prompt Chaining
```
**PROMPT 1 - ANÁLISE:**
Analise este cenário de teste e identifique:
1. Funcionalidade principal
2. Pré-requisitos
3. Passos principais
4. Resultados esperados

[CENÁRIO]

**PROMPT 2 - SELETORES:**
Com base na análise, liste todos os seletores data-test necessários:
1. Elementos de navegação
2. Campos de formulário
3. Botões de ação
4. Elementos de validação

**PROMPT 3 - INTERCEPTAÇÕES:**
Defina as interceptações de API necessárias:
1. Requests de autenticação
2. Requests de dados
3. Requests de ação
4. Requests de validação

**PROMPT 4 - IMPLEMENTAÇÃO:**
Escreva o teste completo seguindo o padrão do projeto.

**PROMPT 5 - VALIDAÇÕES:**
Adicione todas as validações necessárias:
1. Estados da UI
2. Respostas da API
3. Dados atualizados
4. Navegação
```

### Template para Tree of Thoughts
```
**CENÁRIO:** [DESCREVER]

**ABORDAGEM 1 - Via UI:**
Pensamento: Testar através da interface
Passos:
1. Login via UI
2. Navegar para funcionalidade
3. Interagir com elementos
4. Validar resultado

Prós: Teste real da UX
Contras: Mais lento

**ABORDAGEM 2 - Via XState:**
Pensamento: Usar comandos diretos XState
Passos:
1. Login via XState
2. Ação via XState
3. Validar via UI
4. Verificar dados

Prós: Mais rápido
Contras: Não testa UX completa

**ABORDAGEM 3 - Híbrida:**
Pensamento: Combinar ambos
Passos:
1. Setup via XState
2. Ação via UI
3. Validação múltipla
4. Cleanup via XState

Prós: Balanceado
Contras: Complexidade

**MELHOR ABORDAGEM:** [ESCOLHER E JUSTIFICAR]

**IMPLEMENTAÇÃO:**
[CÓDIGO CYPRESS]
```

---

## 🔧 Comandos Úteis

### Execução
```bash
# Abrir Cypress
yarn cypress:open

# Executar todos os testes
yarn cypress:run

# Executar teste específico
yarn cypress:run --spec "cypress/tests/ui/auth-login.spec.ts"

# Mobile
yarn cypress:run:mobile

# Com cobertura
yarn cypress:run --env coverage=true
```

### Database
```bash
# Seed database
yarn db:seed

# Seed vazio
yarn db:seed:empty

# Listar usuários
yarn list:dev:users
```

---

## 📚 Referências Rápidas

### Usuários de Teste Padrão
- `Tavares_Barrows` / `s3cret`
- `Katharina_Bernier` / `s3cret`
- `Allie2` / `s3cret`
- `Giovanna74` / `s3cret`

### URLs Importantes
- `/signin` - Login
- `/signup` - Registro
- `/` - Dashboard
- `/personal` - Transações pessoais
- `/contacts` - Contatos
- `/bankaccounts` - Contas bancárias
- `/notifications` - Notificações
- `/user/settings` - Configurações

### Helper Text IDs Comuns
- `#username-helper-text`
- `#password-helper-text`
- `#transaction-create-amount-input-helper-text`
- `#transaction-create-description-input-helper-text`
- `#bankaccount-bankName-input-helper-text`
- `#bankaccount-routingNumber-input-helper-text`
- `#bankaccount-accountNumber-input-helper-text`

---

Este guia fornece toda a base técnica necessária para criar prompts eficazes e gerar testes Cypress robustos para o Real World App. Use as técnicas de Chain of Thoughts, Prompt Chaining e Tree of Thoughts com essas informações para criar testes completos e funcionais.
