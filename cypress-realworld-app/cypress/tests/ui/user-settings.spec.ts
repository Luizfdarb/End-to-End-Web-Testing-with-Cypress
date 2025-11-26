
describe('User Settings – Real World App', () => {
  /**
   * Grab a random user from the seeded DB and log‑in via XState.
   * The password used is the default seed password (exposed via `Cypress.env`).
   */
  beforeEach(() => {
    // Find *any* user – the first one returned by the seed data.
    cy.task('find:database', { entity: 'users', query: {} }).then((user: any) => {
      // `loginByXstate` resolves the login flow without UI interaction.
      cy.loginByXstate(user.username);
    });

    // After login the app redirects to “/”.  Navigate to the settings page.
    cy.visit('/user/settings');
  });

  /**
   * 1️⃣  Render the form and verify that all expected fields are present.
   */
  it('renders the user‑settings form', () => {
    // The form container has a dedicated data‑test attribute.
    cy.getBySel('user-settings-form').should('be.visible');

    // Verify each input exists.
    cy.getBySel('user-settings-firstName-input').should('exist');
    cy.getBySel('user-settings-lastName-input').should('exist');
    cy.getBySel('user-settings-email-input').should('exist');
    cy.getBySel('user-settings-phoneNumber-input').should('exist');

    // The submit button must be present and initially enabled (because the
    // seeded user data is valid).
    cy.getBySel('user-settings-submit')
      .should('exist')
      .and('be.enabled');
  });

  /**
   * 2️⃣  Form validation – clear required fields and ensure the submit button
   *     becomes disabled (Formik disables the button when `isValid` is false).
   */
  it('validates required fields and shows errors', () => {
    // Helper to clear a field and force validation (blur triggers `touched`).
    const clearAndBlur = (selector: string) => {
      cy.getBySel(selector).clear().blur();
    };

    // Clear each required input.
    clearAndBlur('user-settings-firstName-input');
    clearAndBlur('user-settings-lastName-input');
    clearAndBlur('user-settings-email-input');
    clearAndBlur('user-settings-phoneNumber-input');

    // After touching all fields with empty values the submit button must be disabled.
    cy.getBySel('user-settings-submit').should('be.disabled');

    // Optionally, check that the Material‑UI helper texts appear.
    // The helper text is rendered inside a `<p>` that follows the input.
    cy.getBySel('user-settings-firstName-input')
      .parent()
      .should('contain.text', 'Enter a first name');
    cy.getBySel('user-settings-lastName-input')
      .parent()
      .should('contain.text', 'Enter a last name');
    cy.getBySel('user-settings-email-input')
      .parent()
      .should('contain.text', 'Enter an email address');
    cy.getBySel('user-settings-phoneNumber-input')
      .parent()
      .should('contain.text', 'Enter a phone number');
  });

  /**
   * 3️⃣  Update the whole profile and confirm the side‑drawer shows the new name.
   */
  it('updates the complete profile and reflects changes in the sidebar', () => {
    // New values – deterministic so the test can assert on them.
    const newFirstName = 'Cypress';
    const newLastName = 'Tester';
    const newEmail = 'cypress.tester@example.com';
    const newPhone = '+1-555-123-4567';

    // Fill the form with the new data.
    cy.getBySel('user-settings-firstName-input')
      .clear()
      .type(newFirstName);
    cy.getBySel('user-settings-lastName-input')
      .clear()
      .type(newLastName);
    cy.getBySel('user-settings-email-input')
      .clear()
      .type(newEmail);
    cy.getBySel('user-settings-phoneNumber-input')
      .clear()
      .type(newPhone);

    // Submit – the button becomes disabled while the request is in flight.
    cy.getBySel('user-settings-submit')
      .should('be.enabled')
      .click();

    // Wait for the PATCH request to finish (Cypress automatically waits
    // for XHRs to settle when using the UI).  Afterwards the side‑drawer
    // should contain the updated full name.
    cy.getBySel('sidenav-user-full-name')
      .should('contain.text', `${newFirstName} ${newLastName}`);

    // The username displayed in the drawer must stay the same.
    cy.getBySel('sidenav-username')
      .invoke('text')
      .then((usernameText) => {
        // Trim the leading “@” that the UI adds.
        const displayedUsername = usernameText.trim().replace(/^@/, '');
        // The username should still match the one we logged in with.
        // (We stored it in the auth service context – pull it from there.)
        // eslint‑disable-next-line @typescript-eslint/no-explicit-any
        cy.window().then((win: any) => {
          const currentUser = win.authService.state.context.user;
          expect(displayedUsername).to.equal(currentUser.username);
        });
      });
  });
});
