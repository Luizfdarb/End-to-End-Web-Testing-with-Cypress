
/// <reference types="cypress" />

/**
 * Acceptance tests for the **Notifications** UI.
 *
 * The tests cover:
 *  1️⃣  Rendering of unread notifications and the badge count in the NavBar.
 *  2️⃣  Dismissing (mark‑as‑read) a notification and verifying UI & DB updates.
 *  3️⃣  Mobile behaviour – the dismiss icon is used instead of the button.
 *
 * Cypress custom commands (see `cypress/support/commands.ts`) are used for:
 *   - seeding the test database (`cy.task('db:seed')`);
 *   - logging‑in via the API (`cy.loginByApi`);
 *   - direct DB queries (`cy.task('filter:database')` & `cy.task('find:database')`);
 *
 * All selectors are based on the `data-test` attributes present in the
 * application code, guaranteeing resilience against UI changes.
 */

describe('Notifications', () => {
  /**
   * -----------------------------------------------------------------------
   *  SETUP – runs before every test
   * -----------------------------------------------------------------------
   *
   * 1️⃣  Reset the DB to a known state (`db:seed`).
   * 2️⃣  Pull the first user from the seeded data.
   * 3️⃣  Log‑in that user via the API (uses the default password from env).
   * 4️⃣  Navigate to the notifications page.
   */
  beforeEach(() => {
    // 1️⃣ Reset DB
    cy.task('db:seed');

    // 2️⃣ Get a user from the seeded data
    cy.task('filter:database', { entity: 'users', query: {} }).then((users: any[]) => {
      const user = users[0];
      cy.wrap(user).as('currentUser');

      // 3️⃣ Log‑in (API) – the password comes from Cypress env (set in cypress.json)
      cy.loginByApi(user.username);
    });

    // 4️⃣ Open the notifications view
    cy.visit('/notifications');
  });

  /**
   * -----------------------------------------------------------------------
   *  TEST 1 – Unread notifications list and badge count
   * -----------------------------------------------------------------------
   *
   * Goal: The NavBar badge must display the exact number of unread notifications
   *       and the list on the page must contain the same amount of items.
   *
   * Strategy:
   *   • Query the DB for unread notifications of the logged‑in user.
   *   • Assert the badge text and the rendered list length.
   */
  it('displays unread notifications and badge count matches', function () {
    const userId = this.currentUser.id;

    // Pull unread notifications directly from the DB
    cy.task('filter:database', {
      entity: 'notifications',
      query: { userId, isRead: false },
    }).then((notifications: any[]) => {
      const unreadCount = notifications.length;

      // NavBar badge (desktop view)
      cy.get('[data-test="nav-top-notifications-count"]')
        .should('be.visible')
        .and('contain', unreadCount);

      // Rendered list items
      cy.get('[data-test^="notification-list-item-"]')
        .should('have.length', unreadCount);
    });
  });

  /**
   * -----------------------------------------------------------------------
   *  TEST 2 – Dismiss a notification (desktop)
   * -----------------------------------------------------------------------
   *
   * Goal: Clicking the “Dismiss” button must:
   *   • Mark the notification as read in the DB;
   *   • Remove it from the UI list;
   *   • Decrease the NavBar badge count by one.
   *
   * Strategy:
   *   1. Capture the ID of the first notification rendered.
   *   2. Intercept the PATCH request that updates the notification.
   *   3. Click the corresponding dismiss button.
   *   4. Wait for the PATCH to finish.
   *   5. Re‑query the DB to ensure `isRead === true`.
   *   6. Verify UI changes (badge & list length).
   */
  it('allows dismissing a notification and updates UI and DB (desktop)', function () {
    const userId = this.currentUser.id;

    // 1️⃣ Capture the first notification ID from the rendered list
    cy.get('[data-test^="notification-list-item-"]')
      .first()
      .invoke('attr', 'data-test')
      .then((attr) => {
        const notificationId = attr?.replace('notification-list-item-', '');

        // Guard against unexpected DOM
        expect(notificationId, 'notification id').to.be.a('string');

        // 2️⃣ Intercept the PATCH request that the UI fires
        cy.intercept('PATCH', `/notifications/${notificationId}`).as('patchNotif');

        // 3️⃣ Click the dismiss button for this notification
        cy.get(`[data-test="notification-mark-read-${notificationId}"]`).click();

        // 4️⃣ Wait for the API call to finish
        cy.wait('@patchNotif');

        // 5️⃣ Verify the DB entry is now marked as read
        cy.task('find:database', {
          entity: 'notifications',
          query: { id: notificationId },
        }).then((notification: any) => {
          expect(notification.isRead, 'notification isRead flag').to.be.true;
        });

        // 6️⃣ UI assertions
        //    a) Badge count decreased by 1
        cy.task('filter:database', {
          entity: 'notifications',
          query: { userId, isRead: false },
        }).then((unread: any[]) => {
          const expectedCount = unread.length;
          cy.get('[data-test="nav-top-notifications-count"]')
            .should('contain', expectedCount);
          cy.get('[data-test^="notification-list-item-"]')
            .should('have.length', expectedCount);
        });
      });
  });

  /**
   * -----------------------------------------------------------------------
   *  TEST 3 – Dismiss a notification (mobile viewport)
   * -----------------------------------------------------------------------
   *
   * Goal: In mobile view the dismiss control is an **IconButton** (a
   *       `<button>` with a check icon). The same behaviour as the desktop
   *       test must be validated.
   *
   * Strategy:
   *   • Set a mobile viewport (375×667).
   *   • Repeat the steps of TEST 2, using the mobile‑specific selector.
   */
  it('allows dismissing a notification and updates UI and DB (mobile)', function () {
    const userId = this.currentUser.id;

    // Switch to a mobile viewport
    cy.viewport(375, 667);

    // Capture first notification ID
    cy.get('[data-test^="notification-list-item-"]')
      .first()
      .invoke('attr', 'data-test')
      .then((attr) => {
        const notificationId = attr?.replace('notification-list-item-', '');
        expect(notificationId, 'notification id').to.be.a('string');

        // Intercept PATCH request
        cy.intercept('PATCH', `/notifications/${notificationId}`).as('patchNotif');

        // Mobile dismiss button uses the same data‑test pattern
        cy.get(`[data-test="notification-mark-read-${notificationId}"]`).click();

        cy.wait('@patchNotif');

        // DB verification
        cy.task('find:database', {
          entity: 'notifications',
          query: { id: notificationId },
        }).then((notification: any) => {
          expect(notification.isRead).to.be.true;
        });

        // UI verification – badge & list length
        cy.task('filter:database', {
          entity: 'notifications',
          query: { userId, isRead: false },
        }).then((unread: any[]) => {
          const expected = unread.length;
          cy.get('[data-test="nav-top-notifications-count"]')
            .should('contain', expected);
          cy.get('[data-test^="notification-list-item-"]')
            .should('have.length', expected);
        });
      });
  });
});
