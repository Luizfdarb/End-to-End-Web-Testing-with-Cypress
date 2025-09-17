import { User } from "../../../src/models";
import { isMobile } from "../../support/utils";

type BankAccountsTestCtx = {
  user?: User;
};

const ctx: BankAccountsTestCtx = {};

const bankAccountInfo = {
  bankName: "The Best Bank",
  routingNumber: "987654321",
  accountNumber: "123456789",
};

describe("Bank Accounts", function() {
  beforeEach(function() {
    cy.task("db:seed");
    cy.server();
    cy.route("POST", "/bankAccounts").as("createBankAccount");
    cy.route("DELETE", "/bankAccounts/*").as("deleteBankAccount");
    cy.route("GET", "/notifications").as("getNotifications");
    
    cy.database("find", "users").then((user: User) => {
      ctx.user = user;
      return cy.loginByXstate(ctx.user.username);
    });
  });

  it("creates a new bank account", function() {
    cy.wait("@getNotifications");
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }
    cy.getBySel("sidenav-bankaccounts").click();
    cy.getBySel("bankaccount-new").click();
    cy.location("pathname").should("eq", "/bankaccounts/new");
    cy.percySnapshot("Display New Bank Account Form");

    cy.getBySelLike("bankName-input").type(bankAccountInfo.bankName);
    cy.getBySelLike("routingNumber-input").type(bankAccountInfo.routingNumber);
    cy.getBySelLike("accountNumber-input").type(bankAccountInfo.accountNumber);
    cy.percySnapshot("Fill out New Bank Account Form");

    cy.getBySelLike("submit").click();
    cy.wait("@createBankAccount");

    cy.getBySelLike("bankaccount-list-item").should("have.length", 2);
    cy.getBySelLike("bankaccount-list-item").eq(1).contains(bankAccountInfo.bankName);
    cy.percySnapshot("Bank Account Created");
  });

  it("should display bank account form errors", function() {
    cy.visit("/bankaccounts");
    cy.getBySel("bankaccount-new").click();
    
    // Bank Name validations
    cy.getBySelLike("bankName-input").type("The").find("input").clear().blur();
    cy.get("#bankaccount-bankName-input-helper-text").should("be.visible").and("contain", "Enter a bank name");
    
    cy.getBySelLike("bankName-input").type("The").find("input").blur();
    cy.get("#bankaccount-bankName-input-helper-text").should("be.visible").and("contain", "Must contain at least 5 characters");
    
    // Routing Number validations
    cy.getBySelLike("routingNumber-input").find("input").focus().blur();
    cy.get("#bankaccount-routingNumber-input-helper-text").should("be.visible").and("contain", "Enter a valid bank routing number");

    cy.getBySelLike("routingNumber-input").type("12345678").find("input").blur();
    cy.get("#bankaccount-routingNumber-input-helper-text").should("be.visible").and("contain", "Must contain a valid routing number");
    cy.getBySelLike("routingNumber-input").find("input").clear();

    cy.getBySelLike("routingNumber-input").type("123456789").find("input").blur();
    cy.get("#bankaccount-routingNumber-input-helper-text").should("not.be.visible");
    
    // Account Number validations
    cy.getBySelLike("accountNumber-input").find("input").focus().blur();
    cy.get("#bankaccount-accountNumber-input-helper-text").should("be.visible").and("contain", "Enter a valid bank account number");

    cy.getBySelLike("accountNumber-input").type("12345678").find("input").blur();
    cy.get("#bankaccount-accountNumber-input-helper-text").should("be.visible").and("contain", "Must contain at least 9 digits");
    cy.getBySelLike("accountNumber-input").find("input").clear();

    cy.getBySelLike("accountNumber-input").type("123456789").find("input").blur();
    cy.get("#bankaccount-accountNumber-input-helper-text").should("not.be.visible");
    cy.getBySelLike("accountNumber-input").find("input").clear();
    
    cy.getBySelLike("accountNumber-input").type("123456789111").find("input").blur();
    cy.get("#bankaccount-accountNumber-input-helper-text").should("not.be.visible");
    cy.getBySelLike("accountNumber-input").find("input").clear();
    
    cy.getBySelLike("accountNumber-input").type("1234567891111").find("input").blur();
    cy.get("#bankaccount-accountNumber-input-helper-text").should("be.visible").and("contain", "Must contain no more than 12 digits");

    cy.percySnapshot("Bank Account Form with Errors and Submit button disabled");
    cy.getBySel("bankaccount-submit").should("be.disabled");
  });

  it("soft deletes a bank account", function() {
    cy.visit("/bankaccounts");
    cy.getBySelLike("delete").first().click();
    cy.wait("@deleteBankAccount");
    cy.getBySelLike("list-item").children().contains("Deleted");
    cy.percySnapshot("Soft Delete Bank Account");
  });
  
  it("renders an empty bank account list state with onboarding modal", function() {
    cy.route("GET", "/bankAccounts", []).as("getBankAccounts");
    cy.visit("/bankaccounts");
    cy.wait("@getBankAccounts");
    
    cy.getBySel("bankaccount-list").should("not.be.visible");
    cy.getBySel("empty-list-header").should("contain", "No Bank Accounts");
    cy.getBySel("user-onboarding-dialog").should("be.visible");
    cy.percySnapshot("User Onboarding Dialog is Visible");
  });
});