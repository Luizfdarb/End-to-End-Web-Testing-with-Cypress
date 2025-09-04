// cypress/tests/ui/auth-login.spec.ts
import { User } from "../../../src/models";
import { isMobile } from "../../support/utils";

describe("User Authentication (Login)", function () {
  const user = "Tavares_Barrows";
  const password = "s3cret";

  beforeEach(function () {
    cy.task("db:seed");
    cy.server();
    cy.route("POST", "/login").as("loginUser");
    cy.route("GET", "checkAuth").as("getUserProfile");
    cy.visit("/signin");
  });

  it("should redirect unauthenticated user to signin page", function () {
    cy.visit("/");
    cy.url().should("include", "/signin");
    cy.getBySel("signin-title").should("have.text", "Sign in");
    cy.percySnapshot("Redirect to SignIn");
  });

  it("should display login errors", function () {
    cy.getBySel("signin-submit").click();
    cy.get("#username-helper-text").should("be.visible").and("have.text", "Username is required");
    cy.get("#password-helper-text").should("be.visible").and("have.text", "Password must contain at least 4 characters");
    cy.percySnapshot("Display Username is Required Error");

    cy.getBySel("signin-username").type(user);
    cy.getBySel("signin-password").type("123");
    cy.get("#password-helper-text").should("be.visible").and("have.text", "Password must contain at least 4 characters");
    cy.percySnapshot("Display Password Error");

    cy.getBySel("signin-submit").should("be.disabled");
    cy.percySnapshot("Sign In Submit Disabled");
  });

  it("should error for an invalid user", function () {
    cy.getBySel("signin-username").type("invalidUserName");
    cy.getBySel("signin-password").type("invalidPa$$word");
    cy.getBySel("signin-submit").click();
    cy.wait("@loginUser").its("status").should("eq", 401);
    cy.getBySel("signin-error").should("be.visible").and("have.text", "Username or password is invalid");
    cy.percySnapshot("Sign In, Invalid Username and Password, Username or Password is Invalid");
  });

  it("should error for an invalid password for existing user", function () {
    cy.getBySel("signin-username").type("Katharina_Bernier");
    cy.getBySel("signin-password").type("INVALID");
    cy.getBySel("signin-submit").click();
    cy.wait("@loginUser").its("status").should("eq", 401);
    cy.getBySel("signin-error").should("be.visible").and("have.text", "Username or password is invalid");
  });

  it("should login a valid user", function () {
    cy.database("find", "users", { username: user }).then(function (result) {
      expect(result).to.exist;
    });

    cy.getBySel("signin-username").type(user);
    cy.getBySel("signin-password").type(password);
    cy.getBySel("signin-submit").click();

    cy.wait("@loginUser").its("status").should("eq", 200);
    cy.wait("@getUserProfile").its("status").should("eq", 200);

    cy.url().should("not.include", "/signin");
    cy.getCookie("connect.sid").should("exist");
  });

  it("should remember a user for 30 days after login", function () {
    cy.getBySel("signin-remember-me").find("input").check();
    cy.getBySel("signin-username").type("Allie2");
    cy.getBySel("signin-password").type(password);
    cy.getBySel("signin-submit").click();

    cy.wait("@loginUser").its("status").should("eq", 200);
    cy.url().should("not.include", "/signin");
  });

  it("should allow a user to logout", function () {
    cy.login("Giovanna74", password);
    cy.get("#nav-logout").click();
    cy.url().should("include", "/signin");
  });

  context("Mobile View", function () {
    beforeEach(function () {
      if (isMobile()) {
        cy.viewport("iphone-6");
      }
    });

    it("should be responsive in mobile view", function () {
      cy.percySnapshot("Sign In Mobile View");
    });
  });
});