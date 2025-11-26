
/// <reference types="cypress" />

import { User } from '../../src/models';

describe('Notifications', () => {
  let user: User;
  let notificationCount = 0;

  beforeEach(() => {
    // Grab a random user from the seeded database
    cy.task('find:database', { entity: 'users', query: {} })
      .then((foundUser: any) => {
        user = foundUser;
        // Log in via the UI
        cy.login(user.username, Cypress.env('defaultPassword') as string);
      });
  });

  it('should display notifications and allow dismissing them', () => {
    cy.visit('/notifications');

    // Wait until at least one notification is rendered
    cy.get('[data-test^=notification-list-item-]').should('have.length.greaterThan', 0);

    // Capture the initial unread notifications count from the badge
    cy.getBySel('nav-top-notifications-count')
      .invoke('text')
      .then((text) => {
        notificationCount = Number(text.trim());
        expect(notificationCount).to.be.greaterThan(0);

        // Verify the list length matches the badge count
        cy.get('[data-test^=notification-list-item-]').should('have.length', notificationCount);

        // Dismiss the first notification
        cy.get('[data-test^=notification-mark-read-]').first().click();

        // After dismissing, the list length should be one less
        cy.get('[data-test^=notification-list-item-]')
          .should('have.length', notificationCount - 1);

        // Badge count should update accordingly
        cy.getBySel('nav-top-notifications-count')
          .invoke('text')
          .should('eq', `${notificationCount - 1}`);
      });
  });

  it('should show empty state when all notifications are dismissed', () => {
    cy.visit('/notifications');

    cy.getBySel('nav-top-notifications-count')
      .invoke('text')
      .then((text) => {
        notificationCount = Number(text.trim());
        expect(notificationCount).to.be.greaterThan(0);
      });

    // Recursively dismiss all notifications
    const dismissAll = () => {
      cy.get('[data-test^=notification-mark-read-]').then(($buttons) => {
        const count = $buttons.length;
        if (count === 0) {
          return;
        }
        cy.wrap($buttons[0]).click().then(() => dismissAll());
      });
    };
    dismissAll();

    // After all notifications are dismissed, the empty state should appear
    cy.getBySel('empty-list-header').should('contain.text', 'No Notifications');
    cy.get('[data-test^=notification-list-item-]').should('not.exist');
  });

  it('should navigate to notifications page from NavBar', () => {
    cy.visit('/');

    // Click the notifications icon in the NavBar
    cy.getBySel('nav-top-notifications-link').click();

    // The route should change to /notifications
    cy.location('pathname').should('eq', '/notifications');

    // A list of notifications should be visible
    cy.get('[data-test^=notification-list-item-]').should('have.length.greaterThan', 0);
  });
});
