/**
 * Acceptance test for Transaction Feeds
 * Covers public, contacts and personal feeds:
 * - List rendering
 * - Date and amount filtering (including empty results)
 * - Pagination via nextTransactionFeedPage
 * - Navigation to transaction detail
 * - Create button visibility
 */

import _ from 'lodash';

describe('Transaction Feeds', () => {
  /**
   * Log in a random user before each test suite
   */
  beforeEach(() => {
    // Seed the test database
    cy.task('db:seed');

    // Retrieve a user from the seeded data
    cy.task('filter:database', { entity: 'users', query: {} })
      .then((users: any[]) => {
        const user = users[0];
        // Log in via XState (uses the default password from env)
        cy.loginByXstate(user.username);
      });
  });

  // Feed definitions
  const feeds = [
    {
      name: 'Public',
      tabSelector: null,
      service: 'publicTransactionService',
      path: '/',
    },
    {
      name: 'Contacts',
      tabSelector: '[data-test="nav-contacts-tab"]',
      service: 'contactTransactionService',
      path: '/contacts',
    },
    {
      name: 'Personal',
      tabSelector: '[data-test="nav-personal-tab"]',
      service: 'personalTransactionService',
      path: '/personal',
    },
  ];

  /**
   * Helper to clear filters if they are present
   */
  const clearFilters = () => {
    cy.get(`[data-test="transaction-list-filter-date-clear-button"]`).then(($btn) => {
      if ($btn.length) {
        cy.wrap($btn).click({ force: true });
      }
    });
    cy.get(`[data-test="transaction-list-filter-amount-clear-button"]`).then(($btn) => {
      if ($btn.length) {
        cy.wrap($btn).click({ force: true });
      }
    });
  };

  // Iterate over each feed type
  _.each(feeds, (feed) => {
    describe(`${feed.name} Feed`, () => {
      beforeEach(() => {
        // Navigate to the appropriate feed
        if (feed.tabSelector) {
          cy.get(feed.tabSelector).click();
          cy.url().should('include', feed.path);
        } else {
          // Ensure we are on the root path
          cy.url().should('eq', `${Cypress.config().baseUrl}/`);
        }

        // Ensure the transaction list is loaded
        cy.get('[data-test^="transaction-item-"]', { timeout: 10000 }).should('exist');

        // Clear any existing filters
        clearFilters();
      });

      it('should display transaction items', () => {
        cy.get('[data-test^="transaction-item-"]', { timeout: 10000 })
          .should('have.length.greaterThan', 0);
      });

      it('should clear transactions when applying a date range filter that yields no results', () => {
        const startDate = new Date('2000-01-01');
        const endDate = new Date('2000-01-02');

        // Apply date range filter
        cy.pickDateRange(startDate, endDate);
        cy.wait(500);

        // Expect no transactions to be shown
        cy.get('[data-test^="transaction-item-"]').should('have.length', 0);
        cy.getBySel('empty-list-header').should('contain.text', 'No Transactions');

        // Create button visibility depends on the feed
        if (feed.name === 'Public' || feed.name === 'Personal') {
          cy.getBySel('transaction-list-empty-create-transaction-button').should('be.visible');
        } else {
          cy.getBySel('transaction-list-empty-create-transaction-button').should('not.exist');
        }

        // Clear the date filter
        cy.getBySel('transaction-list-filter-date-clear-button').click({ force: true });
        cy.wait(500);

        // List should be populated again
        cy.get('[data-test^="transaction-item-"]')
          .should('have.length.greaterThan', 0);
      });

      it('should clear transactions when applying an amount range filter that yields no results', () => {
        // Open amount filter popover
        cy.getBySel('transaction-list-filter-amount-range-button').click();

        // Set a very small range (0–10 cents)
        cy.setTransactionAmountRange(0, 10);
        cy.wait(500);

        // Expect no transactions
        cy.get('[data-test^="transaction-item-"]').should('have.length', 0);
        cy.getBySel('empty-list-header').should('contain.text', 'No Transactions');

        // Create button visibility depends on the feed
        if (feed.name === 'Public' || feed.name === 'Personal') {
          cy.getBySel('transaction-list-empty-create-transaction-button').should('be.visible');
        } else {
          cy.getBySel('transaction-list-empty-create-transaction-button').should('not.exist');
        }

        // Clear the amount filter
        cy.getBySel('transaction-list-filter-amount-clear-button').click({ force: true });
        cy.wait(500);

        // List should be populated again
        cy.get('[data-test^="transaction-item-"]')
          .should('have.length.greaterThan', 0);
      });

      it('should load next page via nextTransactionFeedPage', () => {
        cy.get('[data-test^="transaction-item-"]').its('length').then((initialCount) => {
          cy.nextTransactionFeedPage(feed.service, 2);
          cy.wait(500);

          cy.get('[data-test^="transaction-item-"]').its('length').should(
            'be.greaterThan',
            initialCount
          );
        });
      });

      it('should navigate to transaction detail page', () => {
        cy.get('[data-test^="transaction-item-"]').first().click();
        cy.getBySel('transaction-detail-header').should('be.visible');
      });
    });
  });
});
