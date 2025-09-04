# Guia Técnico - Testes de Login/Autenticação - Cypress Real World App

## 📋 Índice
1. [Visão Geral do Módulo](#visão-geral-do-módulo)
2. [Arquivos de Teste Existentes](#arquivos-de-teste-existentes)
3. [Seletores Específicos](#seletores-específicos)
4. [Fluxos de Autenticação](#fluxos-de-autenticação)
5. [Comandos de Login](#comandos-de-login)
6. [Cenários de Teste](#cenários-de-teste)
7. [Interceptações e APIs](#interceptações-e-apis)
8. [Validações e Mensagens](#validações-e-mensagens)
9. [Templates para Prompts](#templates-para-prompts)

---

## 🔐 Visão Geral do Módulo

### Funcionalidades do Sistema de Autenticação
- **Login de usuário** (username/password)
- **Logout de usuário**
- **Lembrar usuário** (checkbox remember me)
- **Registro de novo usuário**
- **Validação de formulários**
- **Tratamento de erros**
- **Redirecionamentos**
- **Sessão persistente**

### URLs Relevantes
- `/signin` - Página de login
- `/signup` - Página de registro
- `/` - Dashboard (após login)
- Qualquer rota protegida redireciona para `/signin` se não autenticado

---

## 📁 Arquivos de Teste Existentes

### 1. auth-login.spec.ts
**Foco:** Testes específicos de login
- Redirecionamento para signin
- Validação de formulário
- Login com credenciais inválidas
- Login com credenciais válidas
- Funcionalidade "lembrar usuário"
- Logout
- Responsividade mobile

### 2. auth.spec.ts
**Foco:** Fluxo completo de autenticação
- Registro de novo usuário
- Login após registro
- Onboarding pós-registro
- Persistência de sessão (30 dias)
- Fluxo completo signup → login → logout

---

## 🎯 Seletores Específicos

### Página de Login (/signin)
```typescript
// Elementos principais
"signin-title"              // Título "Sign in"
"signin-username"           // Campo nome de usuário
"signin-password"           // Campo senha
"signin-remember-me"        // Checkbox "Remember Me"
"signin-submit"             // Botão "Sign In"
"signin-error"              // Mensagem de erro
"signup"                    // Link "Sign Up"

// IDs para mensagens de erro
"#username-helper-text"     // Erro do campo username
"#password-helper-text"     // Erro do campo password
```

### Página de Registro (/signup)
```typescript
// Formulário de registro
"signup-title"              // Título "Sign Up"
"signup-first-name"         // Primeiro nome
"signup-last-name"          // Sobrenome
"signup-username"           // Nome de usuário
"signup-password"           // Senha
"signup-confirmPassword"    // Confirmar senha
"signup-submit"             // Botão "Sign Up"

// IDs para mensagens de erro
"#firstName-helper-text"    // Erro primeiro nome
"#lastName-helper-text"     // Erro sobrenome
"#username-helper-text"     // Erro username
"#password-helper-text"     // Erro senha
"#confirmPassword-helper-text" // Erro confirmação
```

### Elementos pós-login
```typescript
// Navegação após login
"sidenav-username"          // Nome do usuário logado
"sidenav-user-balance"      // Saldo do usuário
"sidenav-signout"           // Botão de logout
"nav-logout"                // Link de logout (mobile)
"#nav-logout"               // ID logout alternativo

// Onboarding (após primeiro login)
"user-onboarding-dialog"    // Modal de onboarding
"user-onboarding-next"      // Botão próximo
"user-onboarding-logout"    // Logout no onboarding
```

---

## 🔄 Fluxos de Autenticação

### 1. Login Básico
```
1. Visitar /signin
2. Preencher username
3. Preencher password
4. Clicar "Sign In"
5. Aguardar redirecionamento
6. Verificar autenticação
```

### 2. Login com "Lembrar"
```
1. Visitar /signin
2. Marcar checkbox "Remember Me"
3. Fazer login
4. Verificar cookie de sessão estendida
```

### 3. Registro + Login
```
1. Visitar /signup
2. Preencher dados pessoais
3. Submeter formulário
4. Fazer login com credenciais criadas
5. Passar pelo onboarding
```

### 4. Logout
```
1. Estar logado
2. Clicar no botão de logout
3. Verificar redirecionamento para /signin
4. Verificar limpeza de sessão
```

---

## 🛠️ Comandos de Login

### Comando UI (Lento, mas testa UX)
```typescript
cy.login(username: string, password: string, rememberUser?: boolean)
```

### Comando API (Rápido)
```typescript
cy.loginByApi(username: string, password?: string)
```

### Comando XState (Mais rápido, bypassa UI)
```typescript
cy.loginByXstate(username: string, password?: string)
```

### Comando Logout XState
```typescript
cy.logoutByXstate()
```

### Exemplo de uso:
```typescript
// Setup rápido para testes
cy.loginByXstate("Tavares_Barrows", "s3cret");

// Teste da interface
cy.login("Tavares_Barrows", "s3cret", true);

// Logout
cy.logoutByXstate();
```

---

## 📊 Cenários de Teste

### 1. Validações de Formulário
```typescript
// Campos obrigatórios
"Username is required"
"Password must contain at least 4 characters"

// Senhas não coincidem (registro)
"Password does not match"

// Campos mínimos
"Must contain at least 5 characters" (para nome do banco)
```

### 2. Credenciais Inválidas
```typescript
// Usuário inexistente
"Username or password is invalid"

// Senha incorreta para usuário existente
"Username or password is invalid"
```

### 3. Estados dos Botões
```typescript
// Botão desabilitado quando formulário inválido
cy.getBySel("signin-submit").should("be.disabled");

// Botão habilitado quando formulário válido
cy.getBySel("signin-submit").should("not.be.disabled");
```

### 4. Redirecionamentos
```typescript
// Usuário não autenticado
cy.visit("/");
cy.url().should("include", "/signin");

// Após login bem-sucedido
cy.url().should("not.include", "/signin");

// Após logout
cy.url().should("include", "/signin");
```

---

## 🌐 Interceptações e APIs

### Interceptações Essenciais
```typescript
// Login
cy.route("POST", "/login").as("loginUser");
cy.route("GET", "checkAuth").as("getUserProfile");

// Logout
cy.route("POST", "/logout").as("logoutUser");

// Registro
cy.route("POST", "/users").as("signup");

// Uso das interceptações
cy.wait("@loginUser").its("status").should("eq", 200);
cy.wait("@loginUser").its("status").should("eq", 401); // erro
```

### Endpoints de API
```
POST /login        - Autenticar usuário
GET  /checkAuth    - Verificar autenticação
POST /logout       - Logout
POST /users        - Registrar usuário
```

---

## ✅ Validações e Mensagens

### Cookies e Sessão
```typescript
// Verificar cookie de sessão
cy.getCookie("connect.sid").should("exist");

// Verificar propriedade de expiração
cy.getCookie("connect.sid").should("have.property", "expiry");
```

### Elementos de UI
```typescript
// Título da página
cy.getBySel("signin-title").should("have.text", "Sign in");

// Visibilidade de elementos
cy.getBySel("signin-error").should("be.visible");
cy.getBySel("signin-error").should("not.be.visible");

// Conteúdo de mensagens
cy.getBySel("signin-error").should("have.text", "Username or password is invalid");
```

### Estados da Aplicação
```typescript
// Verificar usuário logado
cy.getBySel("sidenav-username").should("contain", "Tavares_Barrows");

// Verificar saldo exibido
cy.getBySel("sidenav-user-balance").should("be.visible");
```

---

## 👥 Usuários de Teste

### Credenciais Padrão
```typescript
// Usuários válidos (todos com senha "s3cret")
"Tavares_Barrows"
"Katharina_Bernier" 
"Allie2"
"Giovanna74"

// Para testes de erro
"invalidUserName"     // usuário inexistente
"INVALID"            // senha incorreta
```

### Obtendo Usuários do Database
```typescript
// Buscar um usuário qualquer
cy.database("find", "users").then((user: User) => {
  // usar user.username
});

// Buscar usuário específico
cy.database("find", "users", { username: "Tavares_Barrows" });

// Buscar múltiplos usuários
cy.database("filter", "users").then((users: User[]) => {
  // usar users[0], users[1], etc.
});
```

---

## 📱 Responsividade Mobile

### Configuração Mobile
```typescript
context("Mobile View", function () {
  beforeEach(function () {
    if (isMobile()) {
      cy.viewport("iphone-6");
    }
  });
});
```

### Diferenças Mobile
- Sidebar é retrátil (toggle necessário)
- Alguns elementos podem estar ocultos
- Layout diferente para formulários

---

## 🎯 Templates para Prompts

### Template Chain of Thoughts - Login
```
Você é um especialista em testes de autenticação com Cypress. Analise este cenário de login e siga estas etapas:

**1. ANÁLISE DO CENÁRIO:**
- Identifique o tipo de teste de login
- Determine os dados necessários
- Identifique as validações esperadas

**2. PLANEJAMENTO DOS PASSOS:**
- Setup inicial (seed, interceptações)
- Passos de interação
- Pontos de validação
- Cleanup necessário

**3. IMPLEMENTAÇÃO CYPRESS:**
- Escolha o comando de login apropriado
- Use os seletores corretos
- Implemente as interceptações
- Adicione validações robustas

**4. VALIDAÇÃO COMPLETA:**
- Estados da UI
- Respostas da API
- Cookies/sessão
- Redirecionamentos

**CONTEXTO TÉCNICO:**
- App: Cypress Real World App
- Base URL: http://localhost:3000
- API: http://localhost:3001
- Usuários teste: Tavares_Barrows, Katharina_Bernier (senha: s3cret)

**SELETORES DISPONÍVEIS:**
Login: signin-username, signin-password, signin-submit, signin-error
Navegação: sidenav-username, sidenav-signout
Elementos: signin-title, signin-remember-me

**COMANDOS DE LOGIN:**
- cy.login(user, pass, remember) - via UI
- cy.loginByXstate(user, pass) - via XState (rápido)
- cy.loginByApi(user, pass) - via API

**CENÁRIO A TESTAR:**
[DESCREVER O CENÁRIO DE LOGIN ESPECÍFICO]

Implemente seguindo este padrão:
```typescript
import { User } from "../../../src/models";
import { isMobile } from "../../support/utils";

describe("User Authentication - [CENÁRIO]", function () {
  beforeEach(function () {
    cy.task("db:seed");
    cy.server();
    cy.route("POST", "/login").as("loginUser");
    cy.route("GET", "checkAuth").as("getUserProfile");
    cy.visit("/signin");
  });

  it("should [COMPORTAMENTO ESPERADO]", function () {
    // implementação
  });
});
```
```

### Template Prompt Chaining - Login
```
**PROMPT 1 - ANÁLISE DE CENÁRIO DE LOGIN:**
Analise este cenário de autenticação:
[CENÁRIO]

Identifique:
1. Tipo de teste (login válido/inválido, registro, logout, etc.)
2. Dados de entrada necessários
3. Comportamento esperado
4. Pontos de falha possíveis

**PROMPT 2 - SELETORES E ELEMENTOS:**
Com base na análise, liste os seletores data-test necessários:

Disponíveis para login:
- signin-username, signin-password, signin-submit
- signin-error, signin-title, signin-remember-me
- signup-*, user-onboarding-*, sidenav-signout

Quais são necessários para este cenário?

**PROMPT 3 - INTERCEPTAÇÕES DE API:**
Defina as interceptações necessárias:

Disponíveis:
- POST /login (loginUser)
- GET /checkAuth (getUserProfile)  
- POST /logout (logoutUser)
- POST /users (signup)

Quais interceptar e como validar?

**PROMPT 4 - ESTRUTURA DO TESTE:**
Escreva o beforeEach e a estrutura básica:
```typescript
describe("Authentication - [NOME]", function () {
  beforeEach(function () {
    // setup
  });
  
  it("should [COMPORTAMENTO]", function () {
    // implementação
  });
});
```

**PROMPT 5 - IMPLEMENTAÇÃO COMPLETA:**
Complete o teste com:
1. Interações de UI
2. Comandos de login apropriados
3. Validações de estado
4. Verificações de API
5. Cleanup se necessário
```

### Template Tree of Thoughts - Login
```
**CENÁRIO DE LOGIN:** [DESCREVER]

**ABORDAGEM 1 - TESTE VIA UI COMPLETA:**
Pensamento: Testar toda a jornada do usuário
```typescript
it("should login via UI", function () {
  cy.getBySel("signin-username").type("Tavares_Barrows");
  cy.getBySel("signin-password").type("s3cret");
  cy.getBySel("signin-submit").click();
  cy.wait("@loginUser").its("status").should("eq", 200);
  cy.url().should("not.include", "/signin");
});
```
**Prós:** Testa UX real, validação completa
**Contras:** Mais lento, pode quebrar por mudanças de UI

**ABORDAGEM 2 - TESTE VIA XSTATE:**
Pensamento: Foco no resultado, não no processo
```typescript
it("should login via XState", function () {
  cy.loginByXstate("Tavares_Barrows");
  cy.getBySel("sidenav-username").should("contain", "Tavares_Barrows");
});
```
**Prós:** Rápido, estável, foco no resultado
**Contras:** Não testa UI, pode mascarar bugs de UX

**ABORDAGEM 3 - HÍBRIDA (SETUP + VALIDAÇÃO):**
Pensamento: XState para setup, UI para validação
```typescript
it("should validate login state", function () {
  cy.loginByXstate("Tavares_Barrows");
  cy.visit("/signin"); // deve redirecionar se já logado
  cy.url().should("eq", "http://localhost:3000/");
  cy.getBySel("sidenav-signout").click();
  cy.url().should("include", "/signin");
});
```
**Prós:** Rápido setup, validação de fluxos críticos
**Contras:** Complexidade média

**MELHOR ABORDAGEM PARA ESTE CENÁRIO:**
[Escolher baseado em: velocidade necessária, criticidade da UI, tipo de validação]

**IMPLEMENTAÇÃO ESCOLHIDA:**
[Código Cypress completo]

**VALIDAÇÕES ADICIONAIS:**
- Cookies: cy.getCookie("connect.sid").should("exist")
- API: cy.wait("@loginUser").its("status").should("eq", 200)
- UI: cy.getBySel("signin-error").should("not.be.visible")
- Navegação: cy.url().should("not.include", "/signin")
```

---

## 🚀 Exemplos Práticos

### Teste de Login Válido
```typescript
it("should login with valid credentials", function () {
  cy.getBySel("signin-username").type("Tavares_Barrows");
  cy.getBySel("signin-password").type("s3cret");
  cy.getBySel("signin-submit").click();
  
  cy.wait("@loginUser").its("status").should("eq", 200);
  cy.wait("@getUserProfile").its("status").should("eq", 200);
  
  cy.url().should("not.include", "/signin");
  cy.getCookie("connect.sid").should("exist");
  cy.getBySel("sidenav-username").should("contain", "Tavares_Barrows");
});
```

### Teste de Login Inválido
```typescript
it("should display error for invalid credentials", function () {
  cy.getBySel("signin-username").type("invalidUser");
  cy.getBySel("signin-password").type("wrongPassword");
  cy.getBySel("signin-submit").click();
  
  cy.wait("@loginUser").its("status").should("eq", 401);
  cy.getBySel("signin-error")
    .should("be.visible")
    .and("have.text", "Username or password is invalid");
  cy.url().should("include", "/signin");
});
```

### Teste de Validação de Formulário
```typescript
it("should validate required fields", function () {
  cy.getBySel("signin-submit").click();
  
  cy.get("#username-helper-text")
    .should("be.visible")
    .and("have.text", "Username is required");
  
  cy.getBySel("signin-username").type("user");
  cy.getBySel("signin-password").type("123");
  
  cy.get("#password-helper-text")
    .should("be.visible")
    .and("have.text", "Password must contain at least 4 characters");
    
  cy.getBySel("signin-submit").should("be.disabled");
});
```

---

Este guia focado em login fornece todos os detalhes técnicos necessários para criar prompts eficazes e gerar testes de autenticação robustos e funcionais! 🔐
