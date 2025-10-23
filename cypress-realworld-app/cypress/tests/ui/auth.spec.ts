// check this file using TypeScript if available
// @ts-check

import { User } from "../../../src/models";
import { isMobile } from "../../support/utils";

/**
 * Suite de testes de autenticação.
 * Utiliza sintaxe de função conforme solicitado.
 */
describe("User Sign-up and Login", function () {
  /**
   * Configuração inicial: recria o banco de dados e configura rotas.
   */
  beforeEach(function () {
    cy.task("db:seed");

    cy.server();
    cy.route("POST", "/users").as("signup");
    cy.route("POST", "/bankAccounts").as("createBankAccount");
  });

  /**
   * Cenário 1: Redirecionamento de usuário não autenticado.
   * Navega para uma rota privada e verifica o redirecionamento para /signin.
   */
  it("1. should redirect unauthenticated user to signin page", function () {
    cy.visit("/personal");
    cy.location("pathname").should("equal", "/signin");
    cy.percySnapshot("1. Redirect to SignIn");
  });

  /**
   * Cenário 2: Login com "Lembrar-me", verificação de cookie e logout.
   * Utiliza o primeiro usuário da seed e a senha padrão 's3cret'.
   */
  it("2. should remember a user for 30 days after login and logout correctly", function () {
    cy.database("find", "users").then(function (user: User) {
      cy.login(user.username, "s3cret", true);
    });

    // Verificar se o cookie de sessão com expiração longa existe
    cy.getCookie("connect.sid").should("exist").and("have.property", "expiry");
    cy.percySnapshot("2a. Login with Remember Me (Cookie Set)");

    // Fazer logout
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }
    cy.getBySel("sidenav-signout").click();
    cy.location("pathname").should("eq", "/signin");
    cy.percySnapshot("2b. Redirect to SignIn after Logout");
  });

  /**
   * Cenário 3: Cadastro, login e onboarding completo.
   * Simula o fluxo de um novo usuário, incluindo a criação de conta bancária.
   */
  it("3. should allow a visitor to sign-up, login, and complete onboarding", function () {
    const userInfo = {
      firstName: "Bob",
      lastName: "Ross",
      username: "PainterJoy90",
      password: "s3cret",
    };

    // Fluxo de Cadastro (Sign-up)
    cy.visit("/");
    cy.getBySel("signup").click();
    cy.getBySel("signup-title").should("be.visible").and("contain", "Sign Up");

    cy.getBySel("signup-first-name").type(userInfo.firstName);
    cy.getBySel("signup-last-name").type(userInfo.lastName);
    cy.getBySel("signup-username").type(userInfo.username);
    cy.getBySel("signup-password").type(userInfo.password);
    cy.getBySel("signup-confirmPassword").type(userInfo.password);
    cy.percySnapshot("3a. Filled Sign Up Form");
    cy.getBySel("signup-submit").click();
    cy.wait("@signup");

    // Login com o novo usuário
    cy.login(userInfo.username, userInfo.password);
    cy.percySnapshot("3b. Logged In, Redirected to Onboarding");

    // Onboarding - Step 1
    cy.getBySel("user-onboarding-dialog").should("be.visible");
    cy.getBySel("user-onboarding-next").click();

    // Onboarding - Step 2 (Criar Conta Bancária)
    cy.getBySel("user-onboarding-dialog-title").should("contain", "Create Bank Account");
    cy.getBySelLike("bankName-input").type("The Best Bank");
    cy.getBySelLike("accountNumber-input").type("123456789");
    cy.getBySelLike("routingNumber-input").type("987654321");
    cy.percySnapshot("3c. Filled Bank Account Form");
    cy.getBySelLike("submit").click();
    cy.wait("@createBankAccount");

    // Onboarding - Step 3 (Finalizado)
    cy.getBySel("user-onboarding-dialog-title").should("contain", "Finished");
    cy.getBySel("user-onboarding-dialog-content").should("contain", "You're all set!");
    cy.percySnapshot("3d. Finished User Onboarding");
    cy.getBySel("user-onboarding-next").click();

    // Verificar redirecionamento para o Dashboard
    cy.getBySel("transaction-list").should("be.visible");
    cy.percySnapshot("3e. Navigated to Dashboard");
  });

  /**
   * Cenário 4: Validações do formulário de login.
   * Verifica mensagens de erro e o estado do botão.
   */
  it("4. should display signin validation errors and disable submit button", function () {
    cy.visit("/signin");

    // Username é obrigatório
    cy.getBySel("signin-username").type("User").find("input").clear().blur();
    cy.get("#username-helper-text").should("be.visible").and("contain", "Username is required");

    // Senha deve ter no mínimo 4 caracteres
    cy.getBySel("signin-password").type("abc").find("input").blur();
    cy.get("#password-helper-text")
      .should("be.visible")
      .and("contain", "Password must contain at least 4 characters");
      
    cy.percySnapshot("4. Sign In Form with Validation Errors");
    cy.getBySel("signin-submit").should("be.disabled");
  });

  /**
   * Cenário 5: Validações do formulário de cadastro (Sign-up).
   * Verifica campos obrigatórios e a incompatibilidade de senhas.
   */
  it("5. should display signup validation errors including password mismatch", function () {
    cy.visit("/signup");

    // First Name obrigatório
    cy.getBySel("signup-first-name").type("F").find("input").clear().blur();
    cy.get("#firstName-helper-text").should("be.visible").and("contain", "First Name is required");

    // Last Name obrigatório
    cy.getBySel("signup-last-name").type("L").find("input").clear().blur();
    cy.get("#lastName-helper-text").should("be.visible").and("contain", "Last Name is required");

    // Username obrigatório
    cy.getBySel("signup-username").type("U").find("input").clear().blur();
    cy.get("#username-helper-text").should("be.visible").and("contain", "Username is required");

    // Password obrigatória
    cy.getBySel("signup-password").type("password").find("input").clear().blur();
    cy.get("#password-helper-text").should("be.visible").and("contain", "Enter your password");

    // Password Mismatch
    cy.getBySel("signup-password").type("s3cret");
    cy.getBySel("signup-confirmPassword").type("DIFFERENT_PASSWORD").find("input").blur();
    cy.get("#confirmPassword-helper-text")
      .should("be.visible")
      .and("contain", "Password does not match");
    
    cy.percySnapshot("5. Sign Up Form with Validation Errors and Password Mismatch");
    cy.getBySel("signup-submit").should("be.disabled");
  });

  /**
   * Cenário 6: Credenciais inválidas (usuário não existente).
   * Verifica a exibição da mensagem de erro correta no componente Alert.
   */
  it("6. should error for invalid credentials (non-existent user)", function () {
    cy.login("nonExistentUser", "s3cret");

    cy.getBySel("signin-error")
      .should("be.visible")
      .and("have.text", "Username or password is invalid");
    cy.percySnapshot("6. Sign In - Invalid User Credentials Error");
  });

  /**
   * Cenário 7: Senha incorreta (usuário existente).
   * Verifica a exibição da mensagem de erro correta no componente Alert.
   */
  it("7. should error for incorrect password (existing user)", function () {
    cy.database("find", "users").then(function (user: User) {
      cy.login(user.username, "INVALID_PASSWORD");
    });

    cy.getBySel("signin-error")
      .should("be.visible")
      .and("have.text", "Username or password is invalid");
    cy.percySnapshot("7. Sign In - Incorrect Password Error");
  });
});