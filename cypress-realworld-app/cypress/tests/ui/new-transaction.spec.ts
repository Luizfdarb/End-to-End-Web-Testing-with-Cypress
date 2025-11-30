/// <reference types="cypress" />

import { Dinero } from "dinero.js";

describe("New Transaction", () => {
  beforeEach(() => {
    cy.loginByXstate("username", "password");
  });

  it("should render transaction create step one form", () => {
    cy.visit("/transaction/new");
    cy.getBySel("transaction-create-step-one-form").should("be.visible");
  });

  it("should render transaction create step two form", () => {
    cy.visit("/transaction/new");
    cy.getBySel("user-list-item-0").click();
    cy.getBySel("transaction-create-step-two-form").should("be.visible");
  });

  it("should render transaction create step three form", () => {
    cy.visit("/transaction/new");
    cy.getBySel("user-list-item-0").click();
    cy.getBySel("transaction-create-amount-input").type("100");
    cy.getBySel("transaction-create-description-input").type("Test transaction");
    cy.getBySel("transaction-create-submit-request").click();
    cy.getBySel("transaction-create-step-three-form").should("be.visible");
  });

  it("should create a new transaction", () => {
    cy.visit("/transaction/new");
    cy.getBySel("user-list-item-0").click();
    cy.getBySel("transaction-create-amount-input").type("100");
    cy.getBySel("transaction-create-description-input").type("Test transaction");
    cy.getBySel("transaction-create-submit-request").click();
    cy.getBySel("transaction-create-step-three-form").should("be.visible");
    cy.getBySel("new-transaction-return-to-transactions").click();
    cy.getBySel("transaction-list").should("be.visible");
  });

  it("should validate transaction amount", () => {
    cy.visit("/transaction/new");
    cy.getBySel("user-list-item-0").click();
    cy.getBySel("transaction-create-amount-input").type("abc");
    cy.getBySel("transaction-create-description-input").type("Test transaction");
    cy.getBySel("transaction-create-submit-request").click();
    cy.getBySel("transaction-create-amount-input").should("have.class", "Mui-error");
  });

  it("should validate transaction description", () => {
    cy.visit("/transaction/new");
    cy.getBySel("user-list-item-0").click();
    cy.getBySel("transaction-create-amount-input").type("100");
    cy.getBySel("transaction-create-description-input").type("");
    cy.getBySel("transaction-create-submit-request").click();
    cy.getBySel("transaction-create-description-input").should("have.class", "Mui-error");
  });
});