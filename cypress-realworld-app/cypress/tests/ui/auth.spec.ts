// cypress/tests/ui/auth.spec.ts
import { User } from "../../../src/models";

describe("Authentication", () => {
  // Executa antes de cada teste para garantir um estado limpo
  beforeEach(() => {
    cy.task("db:seed");
  });

  context("Sign Up", () => {
    it("should allow a visitor to sign up", () => {
      cy.visit("/signup");

      const newUser = {
        firstName: "Test",
        lastName: "User",
        username: "testuser_unique",
        password: "password123",
        confirmPassword: "password123",
      };

      // Verificar estado inicial e snapshot visual
      cy.getBySel("signup-title").should("be.visible");
      cy.percySnapshot("Sign Up Page");

      // Preencher formulário
      cy.getBySel("signup-first-name").type(newUser.firstName);
      cy.getBySel("signup-last-name").type(newUser.lastName);
      cy.getBySel("signup-username").type(newUser.username);
      cy.getBySel("signup-password").type(newUser.password);
      cy.getBySel("signup-confirmPassword").type(newUser.confirmPassword);

      // Submeter
      cy.getBySel("signup-submit").click();

      // Verificar redirecionamento para login
      cy.location("pathname").should("eq", "/signin");
    });

    it("should display validation errors for invalid input", () => {
      cy.visit("/signup");

      // Tocar nos campos e sair para disparar validação (blurred)
      cy.getBySel("signup-first-name").focus().blur();
      cy.getBySel("signup-last-name").focus().blur();
      cy.getBySel("signup-username").focus().blur();
      
      // Senha curta
      cy.getBySel("signup-password").type("123").blur();
      
      // Senhas não conferem
      cy.getBySel("signup-password").clear().type("password123");
      cy.getBySel("signup-confirmPassword").type("password456").blur();

      // Verificar que o botão está desabilitado
      cy.getBySel("signup-submit").should("be.disabled");
      
      cy.percySnapshot("Sign Up Errors");
    });
  });

  context("Sign In", () => {
    it("should allow a seeded user to sign in", () => {
      // Buscar um usuário existente no banco de dados criado pelo seed
      cy.database("find", "users").then((user: User) => {
        cy.visit("/signin");

        cy.getBySel("signin-username").type(user.username);
        // A senha padrão é definida no seedDataUtils ou .env, geralmente é uma string fixa para testes
        // Assumindo a senha padrão definida no environment do cypress.json ou seed
        const defaultPassword = Cypress.env("defaultPassword"); 
        cy.getBySel("signin-password").type(defaultPassword);
        
        // Checkbox Remember Me
        cy.getBySel("signin-remember-me").find("input").check();

        cy.getBySel("signin-submit").click();

        // Verificar redirecionamento para Home
        cy.location("pathname").should("eq", "/");
        
        // Verificar se elementos da Home ou Onboarding aparecem
        // O app pode mostrar o Onboarding se o usuário não tiver conta bancária
        // Mas como pegamos do seed, ele deve ter.
        cy.getBySel("sidenav-user-full-name").should("contain", user.firstName);
      });
    });

    it("should display an error for invalid credentials", () => {
      cy.visit("/signin");

      cy.getBySel("signin-username").type("invalid_user");
      cy.getBySel("signin-password").type("invalid_password");
      cy.getBySel("signin-submit").click();

      // Verificar alerta de erro
      cy.getBySel("signin-error").should("be.visible").and("contain", "Incorrect username or password");
      
      cy.percySnapshot("Sign In Error");
    });

    it("should navigate to signup page", () => {
      cy.visit("/signin");
      cy.getBySel("signup").click();
      cy.location("pathname").should("eq", "/signup");
    });
  });

  context("Logout", () => {
    it("should allow a user to logout", () => {
      // Usar comando de API para logar rapidamente antes do teste de logout
      cy.database("find", "users").then((user: User) => {
        cy.loginByApi(user.username);
      });

      // Visitar a home já autenticado
      cy.visit("/");

      // Em viewports mobile o drawer inicia fechado, em desktop (1280px) inicia aberto ou persistente
      // Verificamos se o botão de logout está visível, se não, abrimos o menu
      cy.get("body").then(($body) => {
        if ($body.find("[data-test='sidenav-signout']").is(":hidden")) {
          cy.getBySel("sidenav-toggle").click();
        }
      });

      // Clicar em Logout
      cy.getBySel("sidenav-signout").click();

      // Verificar redirecionamento para Sign In
      cy.location("pathname").should("eq", "/signin");
    });
  });
});