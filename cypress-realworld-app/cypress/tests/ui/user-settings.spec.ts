import { User } from "../../../src/models";
import { isMobile } from "../../support/utils";

describe("Configurações de Usuário", function () {
  beforeEach(function () {
    cy.task("db:seed");

    cy.server();
    cy.route("PATCH", "/users/*").as("updateUser");
    cy.route("GET", "/notifications").as("getNotifications");

    cy.database("find", "users").then(function (user: User) {
      cy.login(user.username, "s3cret");
    });

    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }
    cy.getBySel("sidenav-user-settings").click();
  });

  it("deve renderizar o formulário de configurações do usuário", function () {
    cy.wait("@getNotifications");
    cy.getBySel("user-settings-form").should("be.visible");
    cy.location("pathname").should("include", "/user/settings");

    cy.percySnapshot("Formulário de Configurações de Usuário");
  });

  it("deve exibir os erros de validação do formulário", function () {
    cy.getBySelLike("firstName-input").type("Abc").clear().blur();
    cy.get("#user-settings-firstName-input-helper-text")
      .should("be.visible")
      .and("contain", "Enter a first name");

    cy.getBySelLike("lastName-input").type("Def").clear().blur();
    cy.get("#user-settings-lastName-input-helper-text")
      .should("be.visible")
      .and("contain", "Enter a last name");

    cy.getBySelLike("email-input").type("abc").clear().blur();
    cy.get("#user-settings-email-input-helper-text")
      .should("be.visible")
      .and("contain", "Enter an email address");

    cy.getBySelLike("email-input").type("abc@bob.").blur();
    cy.get("#user-settings-email-input-helper-text")
      .should("be.visible")
      .and("contain", "Must contain a valid email address");

    cy.getBySelLike("phoneNumber-input").type("123").clear().blur();
    cy.get("#user-settings-phoneNumber-input-helper-text")
      .should("be.visible")
      .and("contain", "Enter a phone number");

    cy.getBySelLike("phoneNumber-input").type("615-555-").blur();
    cy.get("#user-settings-phoneNumber-input-helper-text")
      .should("be.visible")
      .and("contain", "Phone number is not valid");

    cy.getBySelLike("submit").should("be.disabled");
    cy.percySnapshot("Erros de Validação do Formulário de Configurações de Usuário");
  });

  it("deve atualizar o nome, sobrenome, email e telefone", function () {
    cy.getBySelLike("firstName-input").clear().type("Novo Nome");
    cy.getBySelLike("lastName-input").clear().type("Novo Sobrenome");
    cy.getBySelLike("email-input").clear().type("email.novo@example.com");
    cy.getBySelLike("phoneNumber-input").clear().type("1234567890").blur();

    cy.getBySelLike("submit").should("not.be.disabled");
    cy.getBySelLike("submit").click();

    cy.wait("@updateUser").its("status").should("equal", 204);

    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }

    cy.getBySel("sidenav-user-full-name").should("contain", "Novo Nome");
    cy.percySnapshot("Perfil do Usuário Atualizado nas Configurações");
  });
});
