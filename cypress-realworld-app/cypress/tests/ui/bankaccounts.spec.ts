import { User } from "../../../src/models";
import { isMobile } from "../../support/utils";

describe("Bank Accounts", function () {
  let user: User;

  beforeEach(function () {
    cy.task("db:seed");

    cy.server();
    cy.route("GET", "/bankAccounts").as("getBankAccounts");
    cy.route("POST", "/bankAccounts").as("createBankAccount");
    cy.route("DELETE", "/bankAccounts/*").as("deleteBankAccount");

    cy.database("find", "users").then((userData: User) => {
      user = userData;
      cy.login(user.username, "s3cret");
    });
  });

  it("creates a new bank account", function () {
    // Navega para a página de contas bancárias
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }
    cy.getBySel("sidenav-bankaccounts").click();
    cy.location("pathname").should("eq", "/bankaccounts");

    // Inicia o fluxo de criação
    cy.getBySel("bankaccount-new").click();
    cy.location("pathname").should("eq", "/bankaccounts/new");
    cy.percySnapshot("Display New Bank Account Form");

    // Preenche o formulário com dados válidos
    cy.getBySelLike("bankName-input").type("The Best Bank");
    cy.getBySelLike("routingNumber-input").type("987654321");
    cy.getBySelLike("accountNumber-input").type("123456789");
    cy.percySnapshot("Fill out New Bank Account Form");

    // Submete o formulário e verifica o resultado
    cy.getBySel("bankaccount-submit").click();
    cy.wait("@createBankAccount").its("status").should("equal", 200);

    cy.getBySelLike("bankaccount-list-item")
      .should("have.length", 2)
      .and("contain", "The Best Bank");
    cy.percySnapshot("Bank Account Created");
  });

  it("should display bank account form errors for all fields", function () {
    cy.visit("/bankaccounts/new");
    cy.location("pathname").should("eq", "/bankaccounts/new");

    // Validação para Bank Name (obrigatório e tamanho mínimo)
    cy.getBySelLike("bankName-input").find("input").focus().blur();
    cy.get("#bankaccount-bankName-input-helper-text")
      .should("be.visible")
      .and("contain", "Enter a bank name");

    cy.getBySelLike("bankName-input").type("four").find("input").blur();
    cy.get("#bankaccount-bankName-input-helper-text")
      .should("be.visible")
      .and("contain", "Must contain at least 5 characters");
    cy.getBySelLike("bankName-input").find("input").clear();

    // Validação para Routing Number (obrigatório e 9 dígitos)
    cy.getBySelLike("routingNumber-input").find("input").focus().blur();
    cy.get("#bankaccount-routingNumber-input-helper-text")
      .should("be.visible")
      .and("contain", "Enter a valid bank routing number");

    cy.getBySelLike("routingNumber-input").type("12345678").find("input").blur();
    cy.get("#bankaccount-routingNumber-input-helper-text")
      .should("be.visible")
      .and("contain", "Must contain a valid routing number");
    cy.getBySelLike("routingNumber-input").find("input").clear();

    // Validação para Account Number (obrigatório, mínimo e máximo de dígitos)
    cy.getBySelLike("accountNumber-input").find("input").focus().blur();
    cy.get("#bankaccount-accountNumber-input-helper-text")
      .should("be.visible")
      .and("contain", "Enter a valid bank account number");

    cy.getBySelLike("accountNumber-input").type("12345678").find("input").blur();
    cy.get("#bankaccount-accountNumber-input-helper-text")
      .should("be.visible")
      .and("contain", "Must contain at least 9 digits");
    cy.getBySelLike("accountNumber-input").find("input").clear();

    cy.getBySelLike("accountNumber-input").type("1234567890123").find("input").blur();
    cy.get("#bankaccount-accountNumber-input-helper-text")
      .should("be.visible")
      .and("contain", "Must contain no more than 12 digits");

    // Verifica se o botão de salvar está desabilitado
    cy.getBySel("bankaccount-submit").should("be.disabled");
    cy.percySnapshot("Bank Account Form with Errors and Submit button disabled");
  });

  it("soft deletes a bank account", function () {
    cy.visit("/bankaccounts");
    cy.wait("@getBankAccounts");

    // Garante que a lista tenha itens antes de tentar apagar
    cy.getBySelLike("bankaccount-list-item").should("have.length", 1);

    // Clica no botão de deletar e verifica a resposta
    cy.getBySel("bankaccount-delete").first().click();
    cy.wait("@deleteBankAccount").its("status").should("equal", 200);

    // Verifica se o item foi marcado como deletado na UI
    cy.getBySelLike("bankaccount-list-item").first().should("contain", "(Deleted)");
    cy.percySnapshot("Soft Delete Bank Account");
  });

  it("renders an empty bank account list state with onboarding modal", function () {
    // Sobrescreve a rota para retornar uma lista vazia
    cy.route("GET", "/bankAccounts", []).as("getEmptyBankAccounts");

    cy.visit("/bankaccounts");
    cy.wait("@getEmptyBankAccounts");

    // Verifica o estado de lista vazia
    cy.getBySel("bankaccount-list").should("not.exist");
    cy.getBySel("empty-list-header").should("contain", "No Bank Accounts");

    // Verifica se o modal de onboarding está visível
    cy.getBySel("user-onboarding-dialog").should("be.visible");
    cy.percySnapshot("User Onboarding Dialog is Visible for empty bank accounts");
  });
});