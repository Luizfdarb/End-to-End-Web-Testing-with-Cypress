import { User } from "../../../src/models";
import { isMobile } from "../../support/utils";

describe("User Sign-up and Login", function() {
  const userInfo = {
    firstName: "Bob",
    lastName: "Ross",
    username: "PainterJoy90",
    password: "s3cret",
  };

  const bankInfo = {
    bankName: "The Best Bank",
    accountNumber: "123456789",
    routingNumber: "987654321",
  };

  beforeEach(function() {
    cy.task("db:seed");
    cy.server();
    cy.route("POST", "/users").as("signup");
    cy.route("GET", "/users").as("allUsers");
    cy.route("POST", "/bankAccounts").as("createBankAccount");
  });

  it("should redirect unauthenticated user to signin page", function() {
    cy.visit("/personal");
    cy.location("pathname").should("eq", "/signin");
    cy.percySnapshot("Redirect to SignIn");
  });

  it("should remember a user for 30 days after login", function() {
    cy.database("find", "users").then((user: User) => {
      cy.login(user.username, "s3cret", true);
      cy.getCookie("connect.sid").should("have.property", "expiry");
    });
  });

  it("should allow a visitor to sign-up, login, and logout", function() {
    cy.visit("/");
    cy.getBySel("signup").click();
    cy.getBySel("signup-title").should("be.visible").and("contain", "Sign Up");
    cy.getBySel("signup-first-name").type(userInfo.firstName);
    cy.getBySel("signup-last-name").type(userInfo.lastName);
    cy.getBySel("signup-username").type(userInfo.username);
    cy.getBySel("signup-password").type(userInfo.password);
    cy.getBySel("signup-confirmPassword").type(userInfo.password);
    cy.getBySel("signup-submit").click();
    cy.wait("@signup");

    cy.login(userInfo.username, userInfo.password);
    cy.getBySel("user-onboarding-dialog").should("be.visible");
    cy.getBySel("user-onboarding-next").click();
    cy.getBySel("user-onboarding-dialog-title").should("contain", "Create Bank Account");
    cy.getBySelLike("bankName-input").type(bankInfo.bankName);
    cy.getBySelLike("accountNumber-input").type(bankInfo.accountNumber);
    cy.getBySelLike("routingNumber-input").type(bankInfo.routingNumber);
    cy.getBySelLike("submit").click();
    cy.wait("@createBankAccount");
    cy.getBySel("user-onboarding-dialog-title").should("contain", "Finished");
    cy.getBySel("user-onboarding-next").click();
    cy.getBySel("transaction-list").should("be.visible");

    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }
    cy.getBySel("sidenav-signout").should("be.visible").click();
    cy.location("pathname").should("eq", "/signin");
  });

  it("should display login errors", function() {
    cy.visit("/");
    cy.getBySel("signin-username").type("User").find("input").clear().blur();
    cy.get("#username-helper-text").should("contain", "Username is required");
    cy.getBySel("signin-password").type("abc").find("input").blur();
    cy.getBySel("signin-submit").should("be.disabled");
  });

  it("should display signup errors", function() {
    cy.visit("/");
    cy.getBySel("signup").click();

    cy.getBySel("signup-first-name").type("Bob").find("input").clear().blur();
    cy.get("#firstName-helper-text").should("contain", "First Name is required");

    cy.getBySel("signup-last-name").type("Ross").find("input").clear().blur();
    cy.get("#lastName-helper-text").should("contain", "Last Name is required");

    cy.getBySel("signup-username").type("User").find("input").clear().blur();
    cy.get("#username-helper-text").should("contain", "Username is required");

    cy.getBySel("signup-password").type("password").find("input").clear().blur();
    cy.getBySel("signup-confirmPassword").type("not-s3cret").find("input").blur();
    cy.get("#confirmPassword-helper-text").should("contain", "Password does not match");
    cy.getBySel("signup-submit").should("be.disabled");
  });

  it("should error for an invalid user", function() {
    cy.login("nonexistent-user", "s3cret");
    cy.getBySel("signin-error").should("contain", "Username or password is invalid");
  });

  it("should error for an invalid password for existing user", function() {
    cy.database("find", "users").then((user: User) => {
      cy.login(user.username, "wrong-password");
      cy.getBySel("signin-error").should("contain", "Username or password is invalid");
    });
  });
});