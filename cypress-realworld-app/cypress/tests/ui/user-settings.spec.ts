
/// <reference types="cypress" />

describe('User Settings', () => {
  let user: any;

  // ------------------------------------------------------------
  // 1️⃣  Before every test we fetch a user from the DB and log in
  // ------------------------------------------------------------
  beforeEach(() => {
    // Get all users from the backend DB
    cy.database('filter', 'users', {})
      .then(users => {
        // Pick the first user (seed data guarantees at least one user)
        user = users[0];
      })
      // Log in via the API – this bypasses the UI and keeps the test fast
      .then(() => cy.loginByApi(user.username, Cypress.env('defaultPassword')))
      // Once authenticated, navigate to the User Settings page
      .then(() => cy.visit('/user/settings'));
  });

  // ------------------------------------------------------------
  // 2️⃣  Verify that the form is pre‑filled with the current user data
  // ------------------------------------------------------------
  it('should display the user settings form with prefilled values', () => {
    cy.getBySel('user-settings-form').should('exist');

    cy.getBySel('user-settings-firstName-input')
      .should('have.value', user.firstName);
    cy.getBySel('user-settings-lastName-input')
      .should('have.value', user.lastName);
    cy.getBySel('user-settings-email-input')
      .should('have.value', user.email);
    cy.getBySel('user-settings-phoneNumber-input')
      .should('have.value', user.phoneNumber);
    cy.getBySel('user-settings-defaultPrivacyLevel-input')
      .should('have.value', user.defaultPrivacyLevel);
  });

  // ------------------------------------------------------------
  // 3️⃣  Update the user profile – a successful flow
  // ------------------------------------------------------------
  it('should update user profile successfully', () => {
    // Intercept the PATCH request so we can assert its response
    cy.intercept(
      'PATCH',
      `${Cypress.env('apiUrl')}/users/*`
    ).as('updateUser');

    // New values – all unique to avoid conflicts with existing data
    const updated = {
      firstName: `Updated${user.id}`,
      lastName: `Last${user.id}`,
      email: `updated-${user.id}@example.com`,
      phoneNumber: `555${user.id.slice(0, 4)}`,
      defaultPrivacyLevel: 'private',
    };

    cy.getBySel('user-settings-firstName-input')
      .clear()
      .type(updated.firstName);
    cy.getBySel('user-settings-lastName-input')
      .clear()
      .type(updated.lastName);
    cy.getBySel('user-settings-email-input')
      .clear()
      .type(updated.email);
    cy.getBySel('user-settings-phoneNumber-input')
      .clear()
      .type(updated.phoneNumber);
    cy.getBySel('user-settings-defaultPrivacyLevel-input')
      .clear()
      .type(updated.defaultPrivacyLevel);

    // Submit the form
    cy.getBySel('user-settings-submit').click();

    // Wait for the PATCH request and verify a 204 response
    cy.wait('@updateUser').its('response.statusCode').should('eq', 204);

    // The form should re‑render with the new values – assert them
    cy.getBySel('user-settings-firstName-input')
      .should('have.value', updated.firstName);
    cy.getBySel('user-settings-lastName-input')
      .should('have.value', updated.lastName);
    cy.getBySel('user-settings-email-input')
      .should('have.value', updated.email);
    cy.getBySel('user-settings-phoneNumber-input')
      .should('have.value', updated.phoneNumber);
    cy.getBySel('user-settings-defaultPrivacyLevel-input')
      .should('have.value', updated.defaultPrivacyLevel);
  });

  // ------------------------------------------------------------
  // 4️⃣  Validation – empty first name
  // ------------------------------------------------------------
  it('should show a validation error when the first name is empty', () => {
    cy.getBySel('user-settings-firstName-input')
      .clear()
      .type(''); // leave it empty

    cy.getBySel('user-settings-submit').click();

    cy.getBySel('user-settings-firstName-input')
      .parent()
      .find('.MuiFormHelperText-root')
      .should('contain.text', 'Enter a first name');
  });

  // ------------------------------------------------------------
  // 5️⃣  Validation – invalid email
  // ------------------------------------------------------------
  it('should show a validation error for an invalid email address', () => {
    cy.getBySel('user-settings-email-input')
      .clear()
      .type('invalid-email');

    cy.getBySel('user-settings-submit').click();

    cy.getBySel('user-settings-email-input')
      .parent()
      .find('.MuiFormHelperText-root')
      .should('contain.text', 'Must contain a valid email address');
  });

  // ------------------------------------------------------------
  // 6️⃣  Validation – invalid phone number
  // ------------------------------------------------------------
  it('should show a validation error for an invalid phone number', () => {
    cy.getBySel('user-settings-phoneNumber-input')
      .clear()
      .type('abc');

    cy.getBySel('user-settings-submit').click();

    cy.getBySel('user-settings-phoneNumber-input')
      .parent()
      .find('.MuiFormHelperText-root')
      .should('contain.text', 'Phone number is not valid');
  });

  // ------------------------------------------------------------
  // 7️⃣  Validation – invalid default privacy level
  // ------------------------------------------------------------
  it('should show a validation error for an invalid default privacy level', () => {
    cy.getBySel('user-settings-defaultPrivacyLevel-input')
      .clear()
      .type('invalid');

    cy.getBySel('user-settings-submit').click();

    cy.getBySel('user-settings-defaultPrivacyLevel-input')
      .parent()
      .find('.MuiFormHelperText-root')
      .should('contain.text', 'must be one of');
  });
});
