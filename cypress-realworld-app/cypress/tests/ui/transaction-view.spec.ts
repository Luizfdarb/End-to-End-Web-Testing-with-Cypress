
/// <reference types="cypress" />

// Transaction View acceptance tests
describe('Transaction View', () => {
  const password = 'Password123!';

  // Users created once for all tests
  let userA: any;
  let userB: any;

  before(() => {
    const unique = Date.now();

    const userAPayload = {
      username: `userA-${unique}`,
      password,
      firstName: 'Test',
      lastName: 'UserA',
      email: `userA-${unique}@example.com`,
      phoneNumber: '555-0001',
      avatar: 'https://via.placeholder.com/150',
      defaultPrivacyLevel: 'public',
      balance: 1000,
    };

    const userBPayload = {
      username: `userB-${unique}`,
      password,
      firstName: 'Test',
      lastName: 'UserB',
      email: `userB-${unique}@example.com`,
      phoneNumber: '555-0002',
      avatar: 'https://via.placeholder.com/150',
      defaultPrivacyLevel: 'public',
      balance: 1000,
    };

    // Create userA
    cy.request('POST', `${Cypress.env('apiUrl')}/users`, userAPayload)
      .then((resA) => {
        userA = resA.body.user;
        // Create userB
        return cy.request('POST', `${Cypress.env('apiUrl')}/users`, userBPayload);
      })
      .then((resB) => {
        userB = resB.body.user;
      });
  });

  context('Payment transaction', () => {
    it('should display a payment transaction correctly and allow liking/commenting', () => {
      // Login as userA
      cy.loginByApi(userA.username, password).then(() => {
        // Create a payment transaction from A to B
        const paymentPayload = {
          transactionType: 'payment',
          amount: 10, // will be stored as 10 * 100 = 1000
          description: 'Test payment transaction',
          privacyLevel: 'public',
          receiverId: userB.id,
          senderId: userA.id,
        };

        return cy.request('POST', `${Cypress.env('apiUrl')}/transactions`, paymentPayload);
      }).then((resp) => {
        const transactionId = resp.body.transaction.id;

        // Intercept like and comment POST requests
        cy.intercept('POST', `${Cypress.env('apiUrl')}/likes/${transactionId}`).as(`likePost-${transactionId}`);
        cy.intercept('POST', `${Cypress.env('apiUrl')}/comments/${transactionId}`).as(`commentPost-${transactionId}`);

        // Visit the transaction detail page
        cy.visit(`/transaction/${transactionId}`);

        // Wait for the detail header to appear (page has loaded)
        cy.get(`[data-test="transaction-detail-header"]`, { timeout: 15000 }).should('be.visible');

        // Verify transaction amount
        cy.get(`[data-test="transaction-amount-${transactionId}"]`, { timeout: 15000 })
          .should('contain.text', '$10.00');

        // Verify action text contains "paid"
        cy.get(`[data-test="transaction-action-${transactionId}"]`)
          .should('contain.text', 'paid');

        // Ensure accept/reject buttons are NOT present
        cy.get(`[data-test="transaction-accept-request-${transactionId}"]`).should('not.exist');
        cy.get(`[data-test="transaction-reject-request-${transactionId}"]`).should('not.exist');

        // Like button should be enabled
        cy.get(`[data-test="transaction-like-button-${transactionId}"]`)
          .should('be.enabled');

        // Like the transaction
        cy.get(`[data-test="transaction-like-button-${transactionId}"]`).click();
        cy.wait(`@likePost-${transactionId}`);

        // Comment input should be visible
        cy.get(`[data-test="transaction-comment-input-${transactionId}"]`).should('be.visible');

        // Submit a comment
        cy.get(`[data-test="transaction-comment-input-${transactionId}"]`)
          .type('Nice payment{enter}');
        cy.wait(`@commentPost-${transactionId}`);
      }).finally(() => {
        // Clean up session
        cy.logoutByXstate();
      });
    });
  });

  context('Request transaction', () => {
    it('should allow accepting a pending request transaction', () => {
      // Login as userB to create a request to userA
      cy.loginByApi(userB.username, password).then(() => {
        const requestPayload = {
          transactionType: 'request',
          amount: 15,
          description: 'Test request transaction',
          privacyLevel: 'public',
          receiverId: userA.id,
          senderId: userB.id,
        };

        return cy.request('POST', `${Cypress.env('apiUrl')}/transactions`, requestPayload);
      }).then((resp) => {
        const transactionId = resp.body.transaction.id;

        // Logout userB
        cy.logoutByXstate();

        // Login as userA (the receiver)
        cy.loginByApi(userA.username, password).then(() => {
          // Intercept accept POST request
          cy.intercept('PATCH', `${Cypress.env('apiUrl')}/transactions/${transactionId}`).as(`acceptPost-${transactionId}`);

          // Visit the transaction detail page
          cy.visit(`/transaction/${transactionId}`);

          // Wait for the detail header to appear
          cy.get(`[data-test="transaction-detail-header"]`, { timeout: 15000 }).should('be.visible');

          // Verify accept & reject buttons exist
          cy.get(`[data-test="transaction-accept-request-${transactionId}"]`, { timeout: 15000 })
            .should('be.visible');
          cy.get(`[data-test="transaction-reject-request-${transactionId}"]`)
            .should('be.visible');

          // Click accept button
          cy.get(`[data-test="transaction-accept-request-${transactionId}"]`).click();

          // Verify that the accept/reject buttons disappear
          cy.get(`[data-test="transaction-accept-request-${transactionId}"]`).should('not.exist');
          cy.get(`[data-test="transaction-reject-request-${transactionId}"]`).should('not.exist');

          // Verify action text changes to "charged"
          cy.get(`[data-test="transaction-action-${transactionId}"]`)
            .should('contain.text', 'charged');

          // Intercept like and comment POST requests (optional)
          cy.intercept('POST', `${Cypress.env('apiUrl')}/likes/${transactionId}`).as(`likePost-${transactionId}`);
          cy.intercept('POST', `${Cypress.env('apiUrl')}/comments/${transactionId}`).as(`commentPost-${transactionId}`);

          // Like the transaction
          cy.get(`[data-test="transaction-like-button-${transactionId}"]`).click();
          cy.wait(`@likePost-${transactionId}`);

          // Comment input should be visible and allow comment submission
          cy.get(`[data-test="transaction-comment-input-${transactionId}"]`).should('be.visible')
            .type('Nice request!{enter}');
          cy.wait(`@commentPost-${transactionId}`);
        }).finally(() => {
          // Clean up session
          cy.logoutByXstate();
        });
      });
    });
  });
});
