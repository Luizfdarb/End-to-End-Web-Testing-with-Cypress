
/// <reference types="cypress" />

/**
 * Acceptance tests for the Transaction Detail view.
 *
 * The tests cover:
 *  1️⃣  Rendering of a transaction detail page.
 *  2️⃣  Liking a transaction (count increment & button disabled).
 *  3️⃣  Adding a comment (comment appears in the list).
 *  4️⃣  Accepting a pending request (buttons disappear after action).
 *  5️⃣  Rejecting a pending request (buttons disappear after action).
 *
 * Custom Cypress commands that are already registered in the project are used:
 *  - cy.login(username, password)            – UI login.
 *  - cy.task('db:seed')                      – reseed the DB before each test.
 *  - cy.database('find', entity, query)      – fetch a single record.
 *  - cy.database('filter', entity, query)    – fetch an array of records.
 *
 * All selectors are based on the `data‑test` attributes present in the
 * production components, which makes the test robust against UI changes.
 */

describe('Transaction View', () => {
  /**
   * Seed the database and log in before every test.
   * The seed creates deterministic users; we use the first one
   * (username: "db4uxOm7d") which is always present.
   */
  beforeEach(() => {
    // reset DB to known state
    cy.task('db:seed');
    // log in via UI (the password is provided by the plugin as env.defaultPassword)
    cy.login('db4uxOm7d', Cypress.env('defaultPassword'));
    // ensure we are on the home page
    cy.visit('/');
  });

  /**
   * -------------------------------------------------------------------------
   * 1️⃣  Transaction Detail – like & comment
   * -------------------------------------------------------------------------
   */
  it('shows a transaction detail page and allows like and comment actions', () => {
    // 1️⃣  Capture the first transaction item displayed in the list
    cy.get('[data-test^=transaction-item-]')
      .first()
      .then($item => {
        const transactionId = $item.attr('data-test')!.replace('transaction-item-', '');

        // keep the id for later steps
        cy.wrap(transactionId).as('txId');

        // capture the initial like count
        cy.get(`[data-test=transaction-like-count-${transactionId}]`)
          .invoke('text')
          .then(text => parseInt(text, 10))
          .as('initialLikeCount');

        // 2️⃣  Open the detail page
        cy.wrap($item).click();

        // 3️⃣  Verify the header is rendered
        cy.get('[data-test=transaction-detail-header]').should('be.visible');

        // ---- LIKE -----------------------------------------------------------
        cy.get(`[data-test=transaction-like-button-${transactionId}]`).click();

        // after the click the button must be disabled
        cy.get(`[data-test=transaction-like-button-${transactionId}]`).should('be.disabled');

        // the count must have increased by 1
        cy.get(`[data-test=transaction-like-count-${transactionId}]`).should($cnt => {
          const newCount = parseInt($cnt.text(), 10);
          cy.get('@initialLikeCount').then(initial => {
            expect(newCount).to.eq(initial + 1);
          });
        });

        // ---- COMMENT --------------------------------------------------------
        const commentText = `Cypress comment ${Date.now()}`;

        cy.get(`[data-test=transaction-comment-input-${transactionId}]`)
          .type(`${commentText}{enter}`);

        // the new comment should appear in the comment list
        cy.contains(commentText).should('be.visible');
      });
  });

  /**
   * -------------------------------------------------------------------------
   * 2️⃣  Accept / Reject a pending request transaction
   * -------------------------------------------------------------------------
   *
   * The seed creates request transactions for every user.
   * We locate a pending request where the logged‑in user is the *receiver*,
   * visit its detail page and exercise the Accept and Reject buttons.
   */
  it('allows a user to accept or reject a pending request transaction', () => {
    // 1️⃣  Get the current logged‑in user id from the auth service
    cy.window()
      .its('authService')
      .invoke('state')
      .then(state => {
        const currentUserId = state.context.user.id;

        // 2️⃣  Find a pending request where the current user is the receiver
        cy.database('filter', 'transactions', {
          requestStatus: 'pending',
          receiverId: currentUserId,
        }).then((pendingTxs: any[]) => {
          expect(pendingTxs.length).to.be.greaterThan(0, 'there is at least one pending request');

          // pick the first one for the *accept* flow
          const txToAccept = pendingTxs[0];
          const acceptId = txToAccept.id;

          // ----- ACCEPT ----------------------------------------------------
          cy.visit(`/transaction/${acceptId}`);

          // verify the accept button exists
          cy.get(`[data-test=transaction-accept-request-${acceptId}]`).should('be.visible');

          // click accept
          cy.get(`[data-test=transaction-accept-request-${acceptId}]`).click();

          // after accepting the request the accept/reject controls disappear
          cy.get(`[data-test=transaction-accept-request-${acceptId}]`).should('not.exist');
          cy.get(`[data-test=transaction-reject-request-${acceptId}]`).should('not.exist');

          // ----- REJECT ----------------------------------------------------
          // pick another pending request (different from the accepted one)
          const otherTx = pendingTxs.find(t => t.id !== acceptId);
          if (!otherTx) {
            // if only one pending request existed, the reject part is skipped
            return;
          }
          const rejectId = otherTx.id;

          cy.visit(`/transaction/${rejectId}`);

          // verify the reject button exists
          cy.get(`[data-test=transaction-reject-request-${rejectId}]`).should('be.visible');

          // click reject
          cy.get(`[data-test=transaction-reject-request-${rejectId}]`).click();

          // after rejecting the request the accept/reject controls disappear
          cy.get(`[data-test=transaction-accept-request-${rejectId}]`).should('not.exist');
          cy.get(`[data-test=transaction-reject-request-${rejectId}]`).should('not.exist');
        });
      });
  });
});
