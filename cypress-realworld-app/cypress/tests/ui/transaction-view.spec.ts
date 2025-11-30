/// <reference types="cypress" />

import { TransactionResponseItem, TransactionRequestStatus } from "../../src/models";

describe("Transaction View", () => {
  beforeEach(() => {
    cy.loginByXstate("bobberley");
    cy.visit("/");
    cy.getBySel("transaction-list").should("be.visible");
  });

  it("Deve mostrar detalhes da transação", () => {
    cy.getBySelLike("transaction-item-").first().click();
    cy.getBySel("transaction-detail-header").should("be.visible");
    cy.getBySel("transaction-sender").should("not.be.empty");
    cy.getBySel("transaction-receiver").should("not.be.empty");
    cy.getBySel("transaction-amount").should("not.be.empty");
  });

  it("Deve lidar com likes em transações", () => {
    cy.getBySelLike("transaction-item-").first().click();
    cy.getBySelLike("transaction-like-button-").first().click();
    cy.getBySelLike("transaction-like-count").should("contain", "1");
  });

  it("Deve permitir adicionar comentários", () => {
    cy.getBySelLike("transaction-item-").first().click();
    cy.getBySelLike("transaction-comment-input-").first().type("Comentário de teste{enter}");
    cy.getBySel("comments-list").should("contain", "Comentário de teste");
  });

  it("Deve aceitar ou rejeitar transações pendentes", () => {
    cy.getBySelLike("transaction-item-").first().click();
    const transactionId = cy.getBySel("transaction-detail-header").invoke("text");
    cy.getBySel(`transaction-accept-request-${transactionId}`).should("be.visible");
    cy.getBySel(`transaction-reject-request-${transactionId}`).should("be.visible");

    cy.getBySel(`transaction-accept-request-${transactionId}`).click();
  });
});