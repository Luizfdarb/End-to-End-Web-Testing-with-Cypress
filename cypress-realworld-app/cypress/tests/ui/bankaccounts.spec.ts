
/// <reference types="cypress" />

/*
  Cypress acceptance test for the *Bank Accounts* feature.

  This spec covers:
    1️⃣  List of bank accounts (seeded data)
    2️⃣  Creation of a new bank account
    3️⃣  Soft‑deletion of a bank account (the UI shows “(Deleted)’’)

  The test follows the exact UI data‑test attributes that the app
  exposes, uses the custom commands defined in `cypress/support/commands.ts`,
  and seeds the database before every test run.
*/

describe('Bank Accounts – UI flow', () => {
  /**
   * Helper: seed the DB, pick a user from the seed and log‑in via the API.
   * The seed creates **all users with the same password** (env var
   * `SEED_DEFAULT_USER_PASSWORD`).  We fetch any user, use its username
   * together with the default password and let Cypress store the auth cookie.
   */
  const loginWithSeededUser = () => {
    // 1️⃣ Seed the DB
    cy.task('db:seed');

    // 2️⃣ Grab the first user that exists in the DB
    cy.task('find:database', { entity: 'users', query: {} }).then((user: any) => {
      // 3️⃣ Log‑in via the API command (sets the session cookie)
      // The default password is exposed through Cypress env (`defaultPassword`).
      const pwd = Cypress.env('defaultPassword') ?? 'test';
      cy.loginByApi(user.username, pwd);
    });
  };

  beforeEach(() => {
    loginWithSeededUser();
    // After a successful login the app redirects to “/”.  From there we can
    // navigate to the bank‑accounts page.
    cy.visit('/bankaccounts');
  });

  /** -------------------------------------------------------------
   *  1️⃣  Verify that the seeded accounts are listed.
   * ------------------------------------------------------------- */
  it('displays a list of bank accounts for the logged‑in user', () => {
    // The list component has `data-test="bankaccount-list"`.
    cy.get('[data-test=bankaccount-list]').should('exist');

    // At least one account must be rendered (the seed creates several per user).
    cy.get('[data-test^=bankaccount-list-item-]')
      .its('length')
      .should('be.gte', 1);
  });

  /** -------------------------------------------------------------
   *  2️⃣  Create a new bank account through the UI and verify it appears.
   * ------------------------------------------------------------- */
  it('creates a new bank account and shows it in the list', () => {
    // Open the “Create Bank Account’’ form.
    cy.get('[data-test=bankaccount-new]').click();

    // Fill the form fields (all have dedicated data‑test attributes).
    const bankName = 'Cypress Bank';
    const routingNumber = '123456789';
    const accountNumber = '9876543210';

    cy.get('[data-test=bankaccount-bankName-input]').type(bankName);
    cy.get('[data-test=bankaccount-routingNumber-input]').type(routingNumber);
    cy.get('[data-test=bankaccount-accountNumber-input]').type(accountNumber);

    // Submit the form.
    cy.get('[data-test=bankaccount-submit]').click();

    // After a successful POST the app redirects back to the list page.
    // Verify that the newly created bank name is now present in the list.
    cy.get('[data-test=bankaccount-list]')
      .should('contain', bankName)
      .and('contain', routingNumber)
      .and('contain', accountNumber);
  });

  /** -------------------------------------------------------------
   *  3️⃣  Delete (soft‑delete) a bank account and ensure the UI marks it.
   * ------------------------------------------------------------- */
  it('soft‑deletes a bank account and shows the “(Deleted)’’ label', () => {
    // Ensure we have at least one account to delete.
    cy.get('[data-test^=bankaccount-list-item-]')
      .first()
      .as('firstAccount');

    // Click the delete button that lives inside the list‑item.
    cy.get('@firstAccount')
      .within(() => {
        cy.get('[data-test=bankaccount-delete]').click();
      });

    // The UI marks a deleted account with the text “(Deleted)”.
    // Wait for the request to finish and then assert the label.
    cy.get('@firstAccount')
      .should('contain', '(Deleted)');
  });
});
