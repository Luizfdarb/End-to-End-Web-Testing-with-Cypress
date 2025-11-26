
/// <reference types="cypress" />

import { User } from '../../src/models';

describe('New Transaction Flow', () => {
  let currentUser: User;
  let contact: User;

  beforeEach(() => {
    // Seed the database and login as the first user
    cy.task('db:seed').then(() => {
      cy.task('filter:database', { entity: 'users', query: {} }).then((users: User[]) => {
        currentUser = users[0];
        // Pick a contact that is not the current user
        contact = users.find((u) => u.id !== currentUser.id)!;
        // Login via the UI
        cy.login(currentUser.username, Cypress.env('defaultPassword'));
      });
    });
  });

  /**
   * Helper that performs the full creation flow for a transaction
   * @param type 'payment' | 'request'
   * @param amount amount in whole dollars
   * @param description description string
   */
  const createTransaction = (type: 'payment' | 'request', amount: number, description: string) => {
    cy.visit('/transaction/new');

    // --- Step 1: Select contact ------------------------------------------------
    cy.get(`[data-test="user-list-item-${contact.id}"]`).should('be.visible').click();

    // --- Step 2: Enter amount & description ------------------------------------
    cy.getBySel('transaction-create-amount-input').should('be.visible').type(String(amount));
    cy.getBySel('transaction-create-description-input').should('be.visible').type(description);

    // Submit the form (payment or request)
    const submitButton =
      type === 'payment'
        ? cy.getBySel('transaction-create-submit-payment')
        : cy.getBySel('transaction-create-submit-request');
    submitButton.should('be.visible').click();

    // --- Step 3: Confirmation ---------------------------------------------------
    cy.getBySel('new-transaction-return-to-transactions').should('be.visible');

    // Verify summary text
    const amountText = `$${amount.toFixed(2)}`;
    const action = type === 'payment' ? 'Paid' : 'Requested';
    cy.contains(`${action} ${amountText} for ${description}`).should('be.visible');

    return description;
  };

  it('should create a payment transaction', () => {
    const description = `Test payment ${Date.now()}`;

    createTransaction('payment', 100, description);

    // Return to transactions page
    cy.getBySel('new-transaction-return-to-transactions').click();

    // Verify we are on the root page
    cy.url().should('eq', 'http://localhost:3000/');

    // Verify transaction appears in the list
    cy.contains(description).should('be.visible');
  });

  it('should create a request transaction', () => {
    const description = `Test request ${Date.now()}`;

    createTransaction('request', 100, description);

    // Return to transactions page
    cy.getBySel('new-transaction-return-to-transactions').click();

    // Verify we are on the root page
    cy.url().should('eq', 'http://localhost:3000/');

    // Verify transaction appears in the list
    cy.contains(description).should('be.visible');
  });

  it('should validate form errors when amount or description is missing', () => {
    cy.visit('/transaction/new');

    // Step 1: Select contact
    cy.get(`[data-test="user-list-item-${contact.id}"]`).click();

    // Step 2: Attempt to submit with empty fields
    cy.getBySel('transaction-create-submit-payment')
      .should('be.disabled')
      .click();

    // Fill only the amount
    cy.getBySel('transaction-create-amount-input').type('100');
    cy.getBySel('transaction-create-submit-payment').click();

    // Expect description error
    cy.contains('Please enter a note').should('be.visible');

    // Clear amount and fill only description
    cy.getBySel('transaction-create-amount-input').clear();
    cy.getBySel('transaction-create-description-input').type('Only description');
    cy.getBySel('transaction-create-submit-payment').click();

    // Expect amount error
    cy.contains('Please enter a valid amount').should('be.visible');
  });

  it('should allow creating another transaction after completing one', () => {
    const description = `Test another ${Date.now()}`;

    createTransaction('payment', 100, description);

    // Click "Create Another Transaction"
    cy.getBySel('new-transaction-create-another-transaction').click();

    // Verify wizard reset
    cy.getBySel('users-list').should('be.visible');
    cy.getBySel('transaction-create-amount-input')
      .should('be.visible')
      .and('have.value', '');
    cy.getBySel('transaction-create-description-input')
      .should('be.visible')
      .and('have.value', '');
  });

  it('should return to the transactions page after completion', () => {
    const description = `Test return ${Date.now()}`;

    createTransaction('payment', 100, description);

    // Click "Return to Transactions"
    cy.getBySel('new-transaction-return-to-transactions').click();

    // Verify URL and presence of the transaction in the list
    cy.url().should('eq', 'http://localhost:3000/');
    cy.contains(description).should('be.visible');
  });

  it('should navigate to transaction detail page and display correct information', () => {
    const description = `Test detail ${Date.now()}`;

    createTransaction('request', 150, description);

    // Return to transactions page
    cy.getBySel('new-transaction-return-to-transactions').click();

    // Click the transaction item
    cy.contains(description).click();

    // Verify the detail page
    cy.getBySel('transaction-detail-header').should('be.visible');
    cy.contains(description).should('be.visible');

    // Grab the transaction ID from the URL
    cy.url().then((url) => {
      const id = url.split('/').pop();
      // Amount element should be present
      cy.get(`[data-test="transaction-amount-${id}"]`).should('be.visible');
    });
  });
});
