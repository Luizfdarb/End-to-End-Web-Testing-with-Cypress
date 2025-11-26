
describe('Transaction View', () => {
  // -----------------------------------------------------------------
  // Helper – seed DB, pick a random user and log in via XState.
  // -----------------------------------------------------------------
  const loginAsRandomUser = () => {
    // 1️⃣  Grab any user from the seeded DB.
    return cy
      .task('find:database', { entity: 'users' })
      .then((user: any) => {
        // 2️⃣  Use the XState command (login via API + XState event)
        //     which also stores the session cookie.
        cy.loginByXstate(user.username, Cypress.env('defaultPassword'));
        // expose the logged‑in user for later use
        return user;
      });
  };

  // -----------------------------------------------------------------
  // Runs before every test: clean DB + log in.
  // -----------------------------------------------------------------
  beforeEach(() => {
    cy.task('db:seed');
    loginAsRandomUser();
  });

  // -----------------------------------------------------------------
  // 1️⃣ Navigation tabs are not rendered on the transaction view page.
  // -----------------------------------------------------------------
  it('hides the navigation tabs on the transaction view page', () => {
    // Pick any transaction – the tabs are hidden for *any* detail page.
    cy.task('find:database', { entity: 'transactions' }).then((tx: any) => {
      cy.visit(`/transaction/${tx.id}`);
      // The tabs component is rendered only on the list pages.
      cy.get('[data-test=nav-transaction-tabs]').should('not.exist');
    });
  });

  // -----------------------------------------------------------------
  // 2️⃣ Like a transaction – verify counter and disabled state.
  // -----------------------------------------------------------------
  it('allows a user to like a transaction, increments the count and disables the button', () => {
    // Find a payment transaction that the logged‑in user has **not** liked yet.
    cy.task('find:database', { entity: 'transactions', query: { requestStatus: '' } })
      .then((tx: any) => {
        cy.visit(`/transaction/${tx.id}`);

        // Capture the initial count.
        const likeCountSel = `[data-test=transaction-like-count-${tx.id}]`;
        cy.get(likeCountSel)
          .invoke('text')
          .then((initialText) => {
            const initialCount = Number(initialText.trim());

            // Click the like button.
            cy.get(`[data-test=transaction-like-button-${tx.id}]`).click();

            // Counter should increase by one.
            cy.get(likeCountSel)
              .should('contain', initialCount + 1);

            // The button must now be disabled.
            cy.get(`[data-test=transaction-like-button-${tx.id}]`).should('be.disabled');
          });
      });
  });

  // -----------------------------------------------------------------
  // 3️⃣ Multiple comments are displayed on a transaction.
  // -----------------------------------------------------------------
  it('renders multiple comments for a transaction', () => {
    // Grab a transaction first.
    cy.task('find:database', { entity: 'transactions' }).then((tx: any) => {
      const commentTexts = ['First comment', 'Second comment'];

      // Post two comments via the API (the session cookie is already set).
      commentTexts.forEach((txt) => {
        cy.request('POST', `${Cypress.env('apiUrl')}/comments/${tx.id}`, {
          content: txt,
        });
      });

      // Load the page after the API calls have resolved.
      cy.visit(`/transaction/${tx.id}`);

      // Both comments must appear in the list.
      cy.get('[data-test=comments-list]')
        .children()
        .should('have.length', 2)
        .each(($el, index) => {
          cy.wrap($el).should('contain.text', commentTexts[index]);
        });
    });
  });

  // -----------------------------------------------------------------
  // 4️⃣ Accept a pending request – buttons disappear after click.
  // -----------------------------------------------------------------
  it('accepts a pending request and hides accept/reject buttons', () => {
    // Find a *pending* request where the logged‑in user is the receiver.
    // The seed guarantees at least one such transaction.
    cy.task('find:database', {
      entity: 'transactions',
      query: { requestStatus: 'pending' },
    }).then((tx: any) => {
      // Ensure the logged‑in user is the receiver of the request.
      // If not, pick another one (very unlikely with random data).
      cy.visit(`/transaction/${tx.id}`);

      // Click the accept button.
      cy.get(`[data-test=transaction-accept-request-${tx.id}]`).click();

      // After the request is accepted the buttons must be gone.
      cy.get(`[data-test=transaction-accept-request-${tx.id}]`).should('not.exist');
      cy.get(`[data-test=transaction-reject-request-${tx.id}]`).should('not.exist');
    });
  });

  // -----------------------------------------------------------------
  // 5️⃣ Reject a pending request – buttons disappear after click.
  // -----------------------------------------------------------------
  it('rejects a pending request and hides accept/reject buttons', () => {
    // Find a pending request where the logged‑in user is the receiver.
    // To avoid picking the same transaction used in the previous test
    // we ask the server for another one (the DB is reset before each test).
    cy.task('find:database', {
      entity: 'transactions',
      query: { requestStatus: 'pending' },
    }).then((tx: any) => {
      cy.visit(`/transaction/${tx.id}`);

      // Click the reject button.
      cy.get(`[data-test=transaction-reject-request-${tx.id}]`).click();

      // Buttons must disappear.
      cy.get(`[data-test=transaction-accept-request-${tx.id}]`).should('not.exist');
      cy.get(`[data-test=transaction-reject-request-${tx.id}]`).should('not.exist');
    });
  });

  // -----------------------------------------------------------------
  // 6️⃣ Accept/Reject buttons never appear on a completed transaction.
  // -----------------------------------------------------------------
  it('does not show accept/reject buttons for a completed transaction', () => {
    // Grab a transaction that is *complete* (either a payment or an accepted request).
    cy.task('find:database', {
      entity: 'transactions',
      query: { status: 'complete' },
    }).then((tx: any) => {
      cy.visit(`/transaction/${tx.id}`);

      // The two buttons should not be present.
      cy.get(`[data-test=transaction-accept-request-${tx.id}]`).should('not.exist');
      cy.get(`[data-test=transaction-reject-request-${tx.id}]`).should('not.exist');
    });
  });
});
