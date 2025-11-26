
/// <reference types="cypress" />

import faker from 'faker';

describe('Bank Accounts', () => {
  const apiUrl = Cypress.env('apiUrl');
  const defaultPassword = Cypress.env('defaultPassword');

  /**
   * Helper that creates a brand‑new user via the REST API and logs in via the UI.
   * The username is generated with faker so that we never hit a duplicate.
   */
  function createAndLoginUser(): void {
    const username = faker.internet.userName();

    const userPayload = {
      username,
      password: defaultPassword,
      firstName: 'Test',
      lastName: 'User',
      email: faker.internet.email(),
      phoneNumber: faker.phone.phoneNumber(),
      balance: 1000,
      avatar: faker.internet.avatar(),
      defaultPrivacyLevel: 'public',
    };

    // Create the user (no auth required for /users POST)
    cy.request('POST', `${apiUrl}/users`, userPayload);

    // Log in using the UI command – this also fires the XState event.
    cy.login(username, defaultPassword);
  }

  beforeEach(() => {
    // Reset the database to a clean state before each spec
    cy.task('db:seed');

    // Create a new user and log in
    createAndLoginUser();

    // Go straight to the bank‑accounts list
    cy.visit('/bankaccounts');
  });

  it('should create a new bank account', () => {
    const bankName = faker.company.companyName();
    const accountNumber = faker.finance.account(10);
    const routingNumber = faker.finance.account(9);

    // Open the “Create Bank Account” page
    cy.getBySel('bankaccount-new').click();
    cy.url().should('include', '/bankaccounts/new');

    // Fill in the form
    cy.getBySel('bankaccount-bankName-input').type(bankName);
    cy.getBySel('bankaccount-routingNumber-input').type(routingNumber);
    cy.getBySel('bankaccount-accountNumber-input').type(accountNumber);

    // Submit the form
    cy.getBySel('bankaccount-submit').click();

    // We should be back on the list page
    cy.url().should('include', '/bankaccounts');

    // The newly created account should appear in the list
    cy.contains('[data-test^="bankaccount-list-item-"]', bankName)
      .should('exist')
      .and('contain', bankName);

    // And the delete button must be present
    cy.contains('[data-test^="bankaccount-list-item-"]', bankName)
      .find('[data-test="bankaccount-delete"]')
      .should('exist');
  });

  it('should delete a bank account', () => {
    const bankName = faker.company.companyName();
    const accountNumber = faker.finance.account(10);
    const routingNumber = faker.finance.account(9);

    /* ---------- Create a bank account to delete ---------- */
    cy.getBySel('bankaccount-new').click();
    cy.getBySel('bankaccount-bankName-input').type(bankName);
    cy.getBySel('bankaccount-routingNumber-input').type(routingNumber);
    cy.getBySel('bankaccount-accountNumber-input').type(accountNumber);
    cy.getBySel('bankaccount-submit').click();
    cy.url().should('include', '/bankaccounts');

    // Capture the account ID from the rendered list item
    cy.contains('[data-test^="bankaccount-list-item-"]', bankName)
      .then($el => {
        const accountId = $el.attr('data-test')!.replace(/^bankaccount-list-item-/, '');
        cy.wrap(accountId).as('accountId');
      });

    /* ---------- Delete the newly created account ---------- */
    cy.contains('[data-test^="bankaccount-list-item-"]', bankName)
      .find('[data-test="bankaccount-delete"]')
      .click();

    // The delete button should disappear
    cy.contains('[data-test^="bankaccount-list-item-"]', bankName)
      .find('[data-test="bankaccount-delete"]')
      .should('not.exist');

    // The list item should now show the “(Deleted)” flag
    cy.contains('[data-test^="bankaccount-list-item-"]', bankName)
      .should('contain', '(Deleted)');

    // Verify that the account is marked as deleted in the database
    cy.get('@accountId').then(id => {
      cy.database('find', 'bankaccounts', { id })
        .should('have.property', 'isDeleted', true);
    });
  });
});
