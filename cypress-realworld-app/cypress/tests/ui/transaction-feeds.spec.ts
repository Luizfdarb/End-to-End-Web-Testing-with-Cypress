
describe('Real World App – Transaction Feeds', () => {
  // -----------------------------------------------------------------
  // Helper – login once and seed the DB before each test
  // -----------------------------------------------------------------
  beforeEach(() => {
    // Seed the in‑memory DB with the deterministic seed data
    cy.task('db:seed');

    // Log‑in via UI (any user from the seed will work)
    // The default password is stored in the env variable `defaultPassword`
    cy.login('db4uxOm7d', Cypress.env('defaultPassword'));

    // Ensure the main page has loaded
    cy.location('pathname').should('eq', '/');
  });

  // -----------------------------------------------------------------
  // 1️⃣ Toggle navigation drawer (mobile vs desktop)
  // -----------------------------------------------------------------
  it('1️⃣ toggles the navigation drawer on mobile and desktop', () => {
    // Desktop – drawer is always open (persistent)
    cy.get('[data-test="sidenav"]').should('be.visible');

    // Switch to mobile viewport
    cy.viewport(375, 667);

    // Drawer should be hidden initially
    cy.get('[data-test="sidenav"]').should('not.be.visible');

    // Open drawer
    cy.get('[data-test="sidenav-toggle"]').click();
    cy.get('[data-test="sidenav"]').should('be.visible');

    // Close drawer
    cy.get('[data-test="sidenav-toggle"]').click();
    cy.get('[data-test="sidenav"]').should('not.be.visible');
  });

  // -----------------------------------------------------------------
  // 2️⃣ Render variations of transaction items (paid, charged, requested)
  // -----------------------------------------------------------------
  it('2️⃣ renders transaction items of all three types', () => {
    // The seed contains at least one payment, one request and one charged request.
    // We assert that the UI shows items with the correct sign (+ / -) and text.

    // Paid transaction – amount is negative (‑)
    cy.get('[data-test^="transaction-amount-"]')
      .contains('-')
      .first()
      .should('exist');

    // Requested transaction – amount is positive (+) and description contains “Request”
    cy.get('[data-test^="transaction-item-"]')
      .filter(':contains("Request")')
      .first()
      .within(() => {
        cy.get('[data-test^="transaction-amount-"]').contains('+').should('exist');
      });

    // Charged transaction – a request that has been accepted (status complete)
    cy.get('[data-test^="transaction-item-"]')
      .filter(':contains("charged")')
      .first()
      .should('exist');
  });

  // -----------------------------------------------------------------
  // 3️⃣ Paginate personal transaction feed
  // -----------------------------------------------------------------
  it('3️⃣ paginates the personal transaction feed', () => {
    cy.visit('/personal');

    // Wait for first page to load
    cy.get('[data-test^="transaction-item-"]').should('have.length.at.least', 1);

    // Capture the amount of items on page 1
    cy.get('[data-test^="transaction-item-"]').its('length').as('pageOneCount');

    // Load page 2 via the helper command
    // The service is exposed on `window.personalTransactionService`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cy.window().its('personalTransactionService').then((svc: any) => {
      cy.nextTransactionFeedPage('personalTransactionService', 2);
    });

    // After loading page 2 we should have more items than page 1
    cy.get('@pageOneCount').then((cnt: number) => {
      cy.get('[data-test^="transaction-item-"]').its('length').should('be.gt', cnt);
    });
  });

  // -----------------------------------------------------------------
  // 4️⃣ Paginate public transaction feed
  // -----------------------------------------------------------------
  it('4️⃣ paginates the public transaction feed', () => {
    cy.visit('/');

    cy.get('[data-test^="transaction-item-"]').should('have.length.at.least', 1);
    cy.get('[data-test^="transaction-item-"]').its('length').as('pageOneCount');

    cy.window().its('publicTransactionService').then((svc: any) => {
      cy.nextTransactionFeedPage('publicTransactionService', 2);
    });

    cy.get('@pageOneCount').then((cnt: number) => {
      cy.get('[data-test^="transaction-item-"]').its('length').should('be.gt', cnt);
    });
  });

  // -----------------------------------------------------------------
  // 5️⃣ Paginate contacts transaction feed
  // -----------------------------------------------------------------
  it('5️⃣ paginates the contacts transaction feed', () => {
    cy.visit('/contacts');

    cy.get('[data-test^="transaction-item-"]').should('have.length.at.least', 1);
    cy.get('[data-test^="transaction-item-"]').its('length').as('pageOneCount');

    cy.window().its('contactTransactionService').then((svc: any) => {
      cy.nextTransactionFeedPage('contactTransactionService', 2);
    });

    cy.get('@pageOneCount').then((cnt: number) => {
      cy.get('[data-test^="transaction-item-"]').its('length').should('be.gt', cnt);
    });
  });

  // -----------------------------------------------------------------
  // 6️⃣ Close date‑range picker modal on mobile
  // -----------------------------------------------------------------
  it('6️⃣ closes the date‑range picker drawer on mobile', () => {
    cy.viewport(375, 667);
    cy.visit('/personal');

    // Open the date‑range filter
    cy.get('[data-test="transaction-list-filter-date-range-button"]').click();

    // Drawer should be visible
    cy.get('[data-test="date-range-filter-drawer"]').should('be.visible');

    // Close it
    cy.get('[data-test="date-range-filter-drawer-close"]').click();

    // Drawer disappears
    cy.get('[data-test="date-range-filter-drawer"]').should('not.be.visible');
  });

  // -----------------------------------------------------------------
  // 7️⃣ Filter personal feed by date
  // -----------------------------------------------------------------
  it('7️⃣ filters the personal feed by a date range', () => {
    cy.visit('/personal');

    // Pick a date range that we know contains data (e.g. Dec 01‑05 2019)
    const start = new Date('2019-12-01');
    const end = new Date('2019-12-05');
    cy.pickDateRange(start, end);

    // After filtering, at least one transaction should be visible
    cy.get('[data-test^="transaction-item-"]').should('have.length.at.least', 1);
  });

  // -----------------------------------------------------------------
  // 8️⃣ Filter public feed by date
  // -----------------------------------------------------------------
  it('8️⃣ filters the public feed by a date range', () => {
    cy.visit('/');

    const start = new Date('2019-12-01');
    const end = new Date('2019-12-05');
    cy.pickDateRange(start, end);

    cy.get('[data-test^="transaction-item-"]').should('have.length.at.least', 1);
  });

  // -----------------------------------------------------------------
  // 9️⃣ Filter contacts feed by date
  // -----------------------------------------------------------------
  it('9️⃣ filters the contacts feed by a date range', () => {
    cy.visit('/contacts');

    const start = new Date('2019-12-01');
    const end = new Date('2019-12-05');
    cy.pickDateRange(start, end);

    cy.get('[data-test^="transaction-item-"]').should('have.length.at.least', 1);
  });

  // -----------------------------------------------------------------
  // 10️⃣ Personal feed empty when date range yields no results
  // -----------------------------------------------------------------
  it('10️⃣ shows an empty personal feed when the date range matches no transactions', () => {
    cy.visit('/personal');

    // Choose a far‑future range that has no data
    const start = new Date('2100-01-01');
    const end = new Date('2100-01-02');
    cy.pickDateRange(start, end);

    // Empty list header is displayed
    cy.get('[data-test="empty-list-header"]').should('contain', 'No Transactions');
  });

  // -----------------------------------------------------------------
  // 11️⃣ Public feed empty when date range yields no results
  // -----------------------------------------------------------------
  it('11️⃣ shows an empty public feed when the date range matches no transactions', () => {
    cy.visit('/');

    const start = new Date('2100-01-01');
    const end = new Date('2100-01-02');
    cy.pickDateRange(start, end);

    cy.get('[data-test="empty-list-header"]').should('contain', 'No Transactions');
  });

  // -----------------------------------------------------------------
  // 12️⃣ Contacts feed empty when date range yields no results
  // -----------------------------------------------------------------
  it('12️⃣ shows an empty contacts feed when the date range matches no transactions', () => {
    cy.visit('/contacts');

    const start = new Date('2100-01-01');
    const end = new Date('2100-01-02');
    cy.pickDateRange(start, end);

    cy.get('[data-test="empty-list-header"]').should('contain', 'No Transactions');
  });

  // -----------------------------------------------------------------
  // 13️⃣ Filter personal feed by amount
  // -----------------------------------------------------------------
  it('13️⃣ filters the personal feed by amount range', () => {
    cy.visit('/personal');

    // Set a wide range that definitely contains data (0‑50000)
    cy.setTransactionAmountRange(0, 50000);

    cy.get('[data-test^="transaction-item-"]').should('have.length.at.least', 1);
  });

  // -----------------------------------------------------------------
  // 14️⃣ Filter public feed by amount
  // -----------------------------------------------------------------
  it('14️⃣ filters the public feed by amount range', () => {
    cy.visit('/');

    cy.setTransactionAmountRange(0, 50000);

    cy.get('[data-test^="transaction-item-"]').should('have.length.at.least', 1);
  });

  // -----------------------------------------------------------------
  // 15️⃣ Filter contacts feed by amount
  // -----------------------------------------------------------------
  it('15️⃣ filters the contacts feed by amount range', () => {
    cy.visit('/contacts');

    cy.setTransactionAmountRange(0, 50000);

    cy.get('[data-test^="transaction-item-"]').should('have.length.at.least', 1);
  });

  // -----------------------------------------------------------------
  // 16️⃣ Personal feed empty when amount range yields no results
  // -----------------------------------------------------------------
  it('16️⃣ shows an empty personal feed when the amount range matches no transactions', () => {
    cy.visit('/personal');

    // Very high range – the seed never generates amounts > 50000
    cy.setTransactionAmountRange(100000, 200000);

    cy.get('[data-test="empty-list-header"]').should('contain', 'No Transactions');
  });

  // -----------------------------------------------------------------
  // 17️⃣ Public feed empty when amount range yields no results
  // -----------------------------------------------------------------
  it('17️⃣ shows an empty public feed when the amount range matches no transactions', () => {
    cy.visit('/');

    cy.setTransactionAmountRange(100000, 200000);

    cy.get('[data-test="empty-list-header"]').should('contain', 'No Transactions');
  });

  // -----------------------------------------------------------------
  // 18️⃣ Contacts feed empty when amount range yields no results
  // -----------------------------------------------------------------
  it('18️⃣ shows an empty contacts feed when the amount range matches no transactions', () => {
    cy.visit('/contacts');

    cy.setTransactionAmountRange(100000, 200000);

    cy.get('[data-test="empty-list-header"]').should('contain', 'No Transactions');
  });

  // -----------------------------------------------------------------
  // 19️⃣ Personal feed shows only transactions belonging to the user
  // -----------------------------------------------------------------
  it('19️⃣ verifies that the personal feed only contains transactions of the logged‑in user', () => {
    // Get the logged‑in user id from the drawer (visible after login)
    cy.get('[data-test="sidenav-username"]').invoke('text').then((usernameText) => {
      const username = usernameText.trim().replace('@', '');

      // Look up the user in the DB
      cy.database('find', 'users', { username }).then((user: any) => {
        const userId = user.id;

        // Visit personal feed and collect all rendered transaction IDs
        cy.visit('/personal');
        cy.get('[data-test^="transaction-item-"]').then(($items) => {
          const ids = [...$items].map((el) => {
            const match = el.getAttribute('data-test')?.match(/^transaction-item-(.*)$/);
            return match ? match[1] : null;
          });

          // For each transaction id, fetch it from the DB and ensure the user is either sender or receiver
          cy.wrap(ids).each((txId) => {
            cy.database('find', 'transactions', { id: txId }).then((tx: any) => {
              expect([tx.senderId, tx.receiverId]).to.include(userId);
            });
          });
        });
      });
    });
  });

  // -----------------------------------------------------------------
  // 20️⃣ First five public items belong to contacts
  // -----------------------------------------------------------------
  it('20️⃣ verifies that the first five items of the public feed belong to the user’s contacts', () => {
    // Get current user id from the drawer
    cy.get('[data-test="sidenav-username"]').invoke('text').then((usernameText) => {
      const username = usernameText.trim().replace('@', '');

      // Find the user
      cy.database('find', 'users', { username }).then((user: any) => {
        const userId = user.id;

        // Get contacts for this user
        cy.database('filter', 'contacts', { userId }).then((contacts: any[]) => {
          const contactIds = contacts.map((c) => c.contactUserId);

          // Visit the public feed
          cy.visit('/');

          // Grab the first five rendered transaction ids
          cy.get('[data-test^="transaction-item-"]')
            .its('length')
            .then((len) => Math.min(len, 5))
            .then((count) => {
              cy.get('[data-test^="transaction-item-"]')
                .filter(':lt(' + count + ')')
                .each(($el) => {
                  const txId = $el.attr('data-test')?.replace('transaction-item-', '');
                  // Fetch transaction and assert that either sender or receiver is a contact
                  cy.database('find', 'transactions', { id: txId }).then((tx: any) => {
                    const isContact = contactIds.includes(tx.senderId) || contactIds.includes(tx.receiverId);
                    expect(isContact).to.be.true;
                  });
                });
            });
        });
      });
    });
  });

  // -----------------------------------------------------------------
  // 21️⃣ Contacts feed shows only transactions of contacts
  // -----------------------------------------------------------------
  it('21️⃣ verifies that the contacts feed only contains transactions that involve a contact', () => {
    // Get current user id
    cy.get('[data-test="sidenav-username"]').invoke('text').then((usernameText) => {
      const username = usernameText.trim().replace('@', '');

      cy.database('find', 'users', { username }).then((user: any) => {
        const userId = user.id;

        // Retrieve contacts for the user
        cy.database('filter', 'contacts', { userId }).then((contacts: any[]) => {
          const contactIds = contacts.map((c) => c.contactUserId);

          // Visit contacts feed
          cy.visit('/contacts');

          // For each rendered transaction, confirm that at least one party is a contact
          cy.get('[data-test^="transaction-item-"]').each(($el) => {
            const txId = $el.attr('data-test')?.replace('transaction-item-', '');
            cy.database('find', 'transactions', { id: txId }).then((tx: any) => {
              const involvesContact =
                contactIds.includes(tx.senderId) || contactIds.includes(tx.receiverId);
              expect(involvesContact).to.be.true;
            });
          });
        });
      });
    });
  });
});
