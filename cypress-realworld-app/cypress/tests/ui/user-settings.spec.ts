
/// <reference types="cypress" />

import faker from "faker";

const USERNAME = "admin"; // <-- change this to the username that exists in your seeded DB
const PASSWORD = Cypress.env("defaultPassword");

describe("User Settings", () => {
  /**
   * Log in using the API and navigate to the settings page
   * before each test.
   */
  beforeEach(() => {
    cy.loginByApi(USERNAME, PASSWORD).then(() => {
      cy.visit("/user/settings");
    });
  });

  it("renders the user settings form", () => {
    cy.getBySel("user-settings-form").should("be.visible");
    cy.getBySel("user-settings-firstName-input").should("exist");
    cy.getBySel("user-settings-lastName-input").should("exist");
    cy.getBySel("user-settings-email-input").should("exist");
    cy.getBySel("user-settings-phoneNumber-input").should("exist");
  });

  it("validates the form fields", () => {
    // firstName – required
    cy.getBySel("user-settings-firstName-input")
      .clear()
      .blur()
      .parent()
      .find(".MuiFormHelperText-root")
      .should("contain.text", "Enter a first name");

    // lastName – required
    cy.getBySel("user-settings-lastName-input")
      .clear()
      .blur()
      .parent()
      .find(".MuiFormHelperText-root")
      .should("contain.text", "Enter a last name");

    // email – must be a valid email
    cy.getBySel("user-settings-email-input")
      .clear()
      .type("invalid-email")
      .blur()
      .parent()
      .find(".MuiFormHelperText-root")
      .should("contain.text", "Must contain a valid email address");

    // phoneNumber – must match the regex
    cy.getBySel("user-settings-phoneNumber-input")
      .clear()
      .type("12345")
      .blur()
      .parent()
      .find(".MuiFormHelperText-root")
      .should("contain.text", "Phone number is not valid");
  });

  it("updates the profile and reflects the changes in the sidebar", () => {
    const newFirstName = faker.name.firstName();
    const newLastName = faker.name.lastName();
    const newEmail = faker.internet.email();
    const newPhone = faker.phone.phoneNumber();

    // Fill the form
    cy.getBySel("user-settings-firstName-input")
      .clear()
      .type(newFirstName);
    cy.getBySel("user-settings-lastName-input")
      .clear()
      .type(newLastName);
    cy.getBySel("user-settings-email-input")
      .clear()
      .type(newEmail);
    cy.getBySel("user-settings-phoneNumber-input")
      .clear()
      .type(newPhone);

    // Submit
    cy.getBySel("user-settings-submit").should("not.be.disabled").click();

    // Optional: assert snackbar appears
    cy.get("[data-test^='alert-bar-success']").should("be.visible");

    // The sidebar should show the updated full name
    cy.getBySel("sidenav-user-full-name")
      .should("contain.text", newFirstName)
      .and("contain.text", newLastName);

    // (Optional) Verify the username remains unchanged
    cy.getBySel("sidenav-username").should("contain.text", USERNAME);
  });
});
