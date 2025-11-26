
// cypress/integration/user-settings.spec.ts

describe("User Settings", () => {
  beforeEach(() => {
    // Login com um usuário existente
    cy.login("username", "password");
  });

  it("renders user settings form", () => {
    cy.visit("/user/settings");
    cy.get('[data-test="user-settings-form"]').should("be.visible");
  });

  it("validates form fields", () => {
    cy.visit("/user/settings");
    cy.get('[data-test="user-settings-firstName-input"]').type("  ");
    cy.get('[data-test="user-settings-lastName-input"]').type("  ");
    cy.get('[data-test="user-settings-email-input"]').type("invalid email");
    cy.get('[data-test="user-settings-phoneNumber-input"]').type("123");

    cy.get('[data-test="user-settings-submit"]').click();
    cy.get('[data-test="user-settings-error-message"]').should("be.visible");
  });

  it("updates user profile", () => {
    cy.visit("/user/settings");
    cy.get('[data-test="user-settings-firstName-input"]').clear().type("New First Name");
    cy.get('[data-test="user-settings-lastName-input"]').clear().type("New Last Name");
    cy.get('[data-test="user-settings-email-input"]').clear().type("newemail@example.com");
    cy.get('[data-test="user-settings-phoneNumber-input"]').clear().type("1234567890");

    cy.get('[data-test="user-settings-submit"]').click();
    cy.get('[data-test="sidenav-username"]').should("contain", "New First Name");
  });
});
