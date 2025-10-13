// check this file using TypeScript if available
// @ts-check
// <reference types="../../support/index" />

import { User } from "../../../src/models";
import { isMobile } from "../../support/utils";
import Dinero from "dinero.js";
import faker from "faker";

// Contexto para armazenar dados de usuários para os testes
type AuthTestCtx = {
  userA?: User;
};

describe("Cenários de Autenticação do Real World App (PT-BR)", function () {
  const ctx: AuthTestCtx = {};

  beforeEach(function () {
    // 1. Garante que o banco de dados seja semeado antes de cada teste
    cy.task("db:seed");

    // 2. Busca um usuário existente para usar em cenários de login/logout
    cy.database("find", "users").then((user: User) => {
      ctx.userA = user;
    });

    // Configura rotas para interceptação e espera (melhorando a estabilidade)
    cy.server();
    cy.route("POST", "/users").as("signup");
    cy.route("POST", "/login").as("loginUser");
    cy.route("POST", "/bankAccounts").as("createBankAccount");
    cy.route("GET", "/checkAuth").as("getUserProfile");
    cy.route("GET", "/notifications").as("getNotifications");
  });

  // --- CENÁRIO 1 ---
  it("1. Deve redirecionar um usuário não autenticado para a página de login", function () {
    cy.visit("/personal");
    cy.location("pathname").should("equal", "/signin");
    cy.title().should("equal", "React App"); // O título da página de login/signup
    // Captura visual do estado de redirecionamento
    cy.percySnapshot("1. Redirecionamento para Login");
  });

  // --- CENÁRIO 2 ---
  it("2. Deve permitir login com 'Lembrar de mim', verificar o cookie e realizar logout", function () {
    cy.log("Acessando a página de login e autenticando com 'Lembrar de mim'");
    cy.login(ctx.userA!.username, "s3cret", true); // s3cret é a senha padrão

    cy.log("Verificando se o cookie de sessão tem uma data de expiração (indicando 'Lembrar de mim')");
    // O cookie deve ter uma propriedade 'expiry' para ser lembrado (sessão persistente)
    cy.getCookie("connect.sid").should("exist").and("have.property", "expiry");

    // Navega para garantir que o estado de autenticação persista (opcional, mas bom)
    cy.visit("/personal");
    cy.url().should("include", "/personal");

    cy.log("Realizando o logout");
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click(); // Abre o menu lateral no mobile
    }
    cy.getBySel("sidenav-signout").click();
    cy.location("pathname").should("eq", "/signin");
    cy.getCookie("connect.sid").should("not.exist");
    cy.percySnapshot("2. Login com Remember Me e Logout");
  });

  // --- CENÁRIO 3 ---
  it("3. Deve permitir o cadastro completo, onboarding (criação de conta bancária) e acesso ao dashboard", function () {
    const newUserInfo = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      username: faker.internet.userName().replace(/[^a-zA-Z0-9]/g, ""),
      password: "securepassword",
    };

    cy.log("Iniciando o processo de cadastro (Sign Up)");
    cy.visit("/signup");
    cy.getBySel("signup-title").should("contain", "Sign Up");

    // Preenchendo o formulário de cadastro
    cy.getBySel("signup-first-name").type(newUserInfo.firstName);
    cy.getBySel("signup-last-name").type(newUserInfo.lastName);
    cy.getBySel("signup-username").type(newUserInfo.username);
    cy.getBySel("signup-password").type(newUserInfo.password);
    cy.getBySel("signup-confirmPassword").type(newUserInfo.password);
    cy.getBySel("signup-submit").click();
    cy.wait("@signup");

    cy.log("Login automático e início do Onboarding");
    cy.url().should("include", "/");

    // Passo 1 do Onboarding: Boas-vindas
    cy.getBySel("user-onboarding-dialog-title").should("contain", "Get Started");
    cy.getBySel("user-onboarding-next").click();

    // Passo 2 do Onboarding: Criação da Conta Bancária
    cy.getBySel("user-onboarding-dialog-title").should("contain", "Create Bank Account");
    cy.getBySelLike("bankName-input").type("Banco Cypress");
    cy.getBySelLike("routingNumber-input").type(faker.finance.routingNumber());
    cy.getBySelLike("accountNumber-input").type(faker.finance.account(12));
    cy.getBySelLike("submit").click();
    cy.wait("@createBankAccount");

    // Passo 3 do Onboarding: Concluído
    cy.getBySel("user-onboarding-dialog-title").should("contain", "Finished");
    cy.getBySel("user-onboarding-dialog-content").should("contain", "You're all set!");
    cy.getBySel("user-onboarding-next").click();

    cy.log("Verificando acesso ao Dashboard (Transaction List)");
    cy.getBySel("transaction-list").should("be.visible");
    cy.percySnapshot("3. Cadastro e Onboarding Concluídos");
  });

  // --- CENÁRIO 4 ---
  it("4. Deve exibir validações para campos obrigatórios de Login e desabilitar o botão de submissão", function () {
    cy.visit("/signin");

    cy.log("Tentando submeter campos vazios/inválidos");
    // Limpa e desfoca para acionar as mensagens de erro
    cy.getBySel("signin-username").find("input").clear().blur();
    cy.get("#username-helper-text").should("be.visible").and("contain", "Username is required");

    cy.getBySel("signin-password").find("input").type("abc").clear().blur(); // Tentar senha muito curta e limpar
    cy.get("#password-helper-text").should("be.visible").and("contain", "Enter your password");

    cy.log("Verificando se o botão de login está desabilitado");
    cy.getBySel("signin-submit").should("be.disabled");

    cy.percySnapshot("4. Validações de Login (Campos Vazios/Inválidos)");

    cy.log("Verificando validação de comprimento de senha");
    cy.getBySel("signin-password").find("input").type("123").blur(); // Senha muito curta
    cy.get("#password-helper-text").should("contain", "Password must contain at least 4 characters");
    cy.getBySel("signin-submit").should("be.disabled");
  });

  // --- CENÁRIO 5 ---
  it("5. Deve exibir validações para campos obrigatórios do Cadastro (Sign Up) e erro de senhas não coincidentes", function () {
    cy.visit("/signup");

    cy.log("Validando campos obrigatórios");
    cy.getBySel("signup-first-name").find("input").clear().blur();
    cy.get("#firstName-helper-text").should("be.visible").and("contain", "First Name is required");

    cy.getBySel("signup-last-name").find("input").clear().blur();
    cy.get("#lastName-helper-text").should("be.visible").and("contain", "Last Name is required");

    cy.getBySel("signup-username").find("input").clear().blur();
    cy.get("#username-helper-text").should("be.visible").and("contain", "Username is required");

    cy.getBySel("signup-password").find("input").clear().blur();
    cy.get("#password-helper-text").should("be.visible").and("contain", "Enter your password");

    cy.log("Validando senhas não coincidentes");
    cy.getBySel("signup-password").type("Senha1234");
    cy.getBySel("signup-confirmPassword").type("SenhaDiferente").blur();
    cy.get("#confirmPassword-helper-text").should("contain", "Password does not match");

    cy.log("Verificando se o botão de cadastro está desabilitado");
    cy.getBySel("signup-submit").should("be.disabled");
    cy.percySnapshot("5. Validações de Cadastro (Senhas Não Coincidentes)");
  });

  // --- CENÁRIO 6 ---
  it("6. Deve exibir mensagem de erro para credenciais inválidas (usuário inexistente)", function () {
    cy.visit("/signin");

    cy.log("Tentando login com usuário inexistente e senha aleatória");
    cy.login("usuarioInvalido", "senhaInvalida123");

    cy.wait("@loginUser").its("response.statusCode").should("eq", 401);

    cy.getBySel("signin-error")
      .should("be.visible")
      .and("have.text", "Username or password is invalid");

    cy.percySnapshot("6. Erro de Credenciais Inválidas (Usuário Inexistente)");
  });

  // --- CENÁRIO 7 ---
  it("7. Deve exibir mensagem de erro para senha incorreta (usuário existente)", function () {
    cy.visit("/signin");

    cy.log("Tentando login com usuário existente e senha incorreta");
    cy.login(ctx.userA!.username, "senhacorretainvalida");

    cy.wait("@loginUser").its("response.statusCode").should("eq", 401);

    cy.getBySel("signin-error")
      .should("be.visible")
      .and("have.text", "Username or password is invalid");

    cy.percySnapshot("7. Erro de Senha Incorreta (Usuário Existente)");
  });
});