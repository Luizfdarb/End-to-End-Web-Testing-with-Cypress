import { User } from "../../../src/models";

describe("Bank Accounts", () => {
  const testUser = "Katharina_Bernier";

  beforeEach(() => {
    cy.task("db:seed");
    
    // Intercept API requests
    cy.intercept("GET", "/bankAccounts").as("getBankAccounts");
    cy.intercept("POST", "/bankAccounts").as("createBankAccount");
    cy.intercept("DELETE", "/bankAccounts/*").as("deleteBankAccount");

    // Login via API and visit page
    cy.loginByApi(testUser).then(() => {
      cy.visit("/bankaccounts");
    });
  });

  it("renders the bank accounts list", () => {
    cy.wait("@getBankAccounts");
    cy.getBySel("bankaccount-list").should("be.visible");
    cy.getBySel("bankaccount-new").should("be.visible");
  });

  it("creates a new bank account", () => {
    cy.wait("@getBankAccounts");
    
    cy.getBySel("bankaccount-new").click();
    
    // Assert URL redirect
    cy.location("pathname").should("eq", "/bankaccounts/new");

    // Fill form
    cy.getBySel("bankaccount-bankName-input").type("Cypress Test Bank");
    cy.getBySel("bankaccount-routingNumber-input").type("123456789");
    cy.getBySel("bankaccount-accountNumber-input").type("987654321");

    cy.getBySel("bankaccount-submit").click();

    // Wait for API and redirect
    cy.wait("@createBankAccount");
    cy.location("pathname").should("eq", "/bankaccounts");

    // Verify new account is in the list
    cy.getBySel("bankaccount-list").should("contain", "Cypress Test Bank");
  });

  it("displays form validation errors", () => {
    cy.wait("@getBankAccounts");
    cy.getBySel("bankaccount-new").click();

    // Submit empty form to trigger required validations
    cy.getBySel("bankaccount-submit").click();

    // Check specific validation messages defined in BankAccountForm.tsx validationSchema
    cy.getBySel("bankaccount-bankName-input").should("have.attr", "aria-invalid", "true");
    cy.contains("Enter a bank name").should("be.visible");

    cy.getBySel("bankaccount-routingNumber-input").should("have.attr", "aria-invalid", "true");
    cy.contains("Enter a valid bank routing number").should("be.visible");

    cy.getBySel("bankaccount-accountNumber-input").should("have.attr", "aria-invalid", "true");
    cy.contains("Enter a valid bank account number").should("be.visible");

    // Test specific length validation (Routing Number must be 9 chars)
    cy.getBySel("bankaccount-routingNumber-input").type("123");
    cy.getBySel("bankaccount-submit").click();
    cy.contains("Must contain a valid routing number").should("be.visible");
  });

  it("soft deletes a bank account", () => {
    cy.wait("@getBankAccounts");

    // Ensure there is at least one item to delete and verify its initial state
    cy.getBySel("bankaccount-list").children().its("length").should("be.gt", 0);

    // Click the delete button of the first item
    cy.getBySel("bankaccount-delete").first().click();

    cy.wait("@deleteBankAccount");

    // Verify the item is marked as deleted visually
    // Based on BankAccountItem.tsx logic: {bankAccount.isDeleted ? "(Deleted)" : undefined}
    cy.getBySel("bankaccount-list").should("contain", "(Deleted)");
    
    // Ensure the delete button is no longer visible for that item
    // Based on logic: {!bankAccount.isDeleted && (<Button ... />)}
    cy.getBySel("bankaccount-list-item-").first().within(() => {
        cy.getBySel("bankaccount-delete").should("not.exist");
    });
  });
});