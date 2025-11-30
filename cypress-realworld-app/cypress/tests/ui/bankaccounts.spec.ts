/// <reference types="cypress" />

describe("Bank Accounts", () => {
  beforeEach(() => {
    cy.login("username", "password");
    cy.visit("/bankaccounts");
  });

  it("Deve criar uma conta bancária com sucesso", () => {
    cy.getBySel("bankaccount-new").click();
    cy.getBySel("bankaccount-bankName-input").type("Banco do Brasil");
    cy.getBySel("bankaccount-routingNumber-input").type("123456789");
    cy.getBySel("bankaccount-accountNumber-input").type("1234567890");
    cy.getBySel("bankaccount-submit").click();
    cy.getBySel("bankaccount-list").should("contain", "Banco do Brasil");
  });

  it("Deve listar as contas bancárias", () => {
    cy.getBySel("bankaccount-list").should("be.visible");
  });

  it("Deve excluir uma conta bancária com sucesso", () => {
    cy.getBySel("bankaccount-list-item-Banco do Brasil")
      .find("[data-test='bankaccount-delete']")
      .click();
    cy.getBySel("bankaccount-list").should("not.contain", "Banco do Brasil");
  });
});
