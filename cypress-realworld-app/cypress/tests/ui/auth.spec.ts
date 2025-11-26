
import faker from 'faker';

describe('Real‑World App – Authentication', () => {
  /* ------------------------------------------------------------------
   *  Setup – reset the database before each test
   * ------------------------------------------------------------------ */
  beforeEach(() => {
    // Seed the DB with the original data set
    cy.task('db:seed');
  });

  /* ------------------------------------------------------------------
   *  1. Redirect unauthenticated user to Sign‑In
   * ------------------------------------------------------------------ */
  it('redirects unauthenticated user from /personal to /signin', () => {
    cy.visit('/personal');
    cy.location('pathname').should('eq', '/signin');
  });

  /* ------------------------------------------------------------------
   *  2. Login with Remember‑Me, verify cookie, and logout
   * ------------------------------------------------------------------ */
  it('logs in with Remember‑Me, keeps session cookie, and logs out', () => {
    // Grab a real user from the seeded DB
    cy.task('filter:database', { entity: 'users', query: {} }).then((users: any[]) => {
      const user = users[0];
      const pwd = Cypress.env('defaultPassword');

      // Intercept the login and logout requests for later assertions
      cy.server();
      cy.route('POST', '/login').as('loginUser');
      cy.route('POST', '/logout').as('logoutUser');

      // Perform the login
      cy.visit('/signin');
      cy.getBySel('signin-username').type(user.username);
      cy.getBySel('signin-password').type(pwd);
      cy.getBySel('signin-remember-me').find('input').check();
      cy.getBySel('signin-submit').click();

      cy.wait('@loginUser').then(() => {
        // Session cookie must be present
        cy.getCookie('connect.sid').should('exist');

        // Verify we are on a protected route
        cy.visit('/personal');
        cy.location('pathname').should('eq', '/personal');

        // Log out
        cy.logoutByXstate();
        cy.wait('@logoutUser');

        // Cookie should be gone after logout
        cy.getCookie('connect.sid').should('not.exist');
      });
    });
  });

  /* ------------------------------------------------------------------
   *  3. Full Sign‑Up → Onboarding → Dashboard
   * ------------------------------------------------------------------ */
  it('signs up, goes through onboarding, and lands on dashboard', () => {
    // Generate a fresh user
    const newUser = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      username: faker.internet.userName(),
      password: 'Password123',
    };

    // Intercept the signup and login requests
    cy.server();
    cy.route('POST', '/users').as('signupUser');

    // Sign‑Up flow
    cy.visit('/signup');
    cy.getBySel('signup-first-name').type(newUser.firstName);
    cy.getBySel('signup-last-name').type(newUser.lastName);
    cy.getBySel('signup-username').type(newUser.username);
    cy.getBySel('signup-password').type(newUser.password);
    cy.getBySel('signup-confirmPassword').type(newUser.password);

    // Submit – should redirect to sign‑in
    cy.getBySel('signup-submit').click();
    cy.wait('@signupUser').then(() => {
      cy.location('pathname').should('eq', '/signin');

      // Log in the newly created user
      cy.route('POST', '/login').as('loginUser');
      cy.getBySel('signin-username').type(newUser.username);
      cy.getBySel('signin-password').type(newUser.password);
      cy.getBySel('signin-submit').click();
      cy.wait('@loginUser');

      // ------------------------------------------------------------
      // Onboarding dialog – create a bank account
      // ------------------------------------------------------------
      cy.getBySel('user-onboarding-dialog').should('be.visible');

      // Switch to the "Create Bank Account" step
      cy.get('#bankaccount-bankName-input').type('Mock Bank');
      cy.get('#bankaccount-accountNumber-input').type('1234567890');
      cy.get('#bankaccount-routingNumber-input').type('987654321');

      cy.getBySel('bankaccount-submit').click();

      // After the dialog closes we should be on the main dashboard
      cy.getBySel('user-onboarding-dialog').should('not.exist');
      cy.getBySel('transaction-list').should('be.visible');
    });
  });

  /* ------------------------------------------------------------------
   *  4. Sign‑In validations – required fields + button disabled
   * ------------------------------------------------------------------ */
  it('validates required fields on sign‑in form and disables the submit button', () => {
    cy.visit('/signin');

    // Initial state – button disabled
    cy.getBySel('signin-submit').should('be.disabled');

    // Fill only username
    cy.getBySel('signin-username').type('demoUser');
    cy.getBySel('signin-submit').should('be.disabled');

    // Fill short password – still disabled
    cy.getBySel('signin-password').type('abc'); // 3 chars
    cy.getBySel('signin-submit').should('be.disabled');

    // Fill proper password – button enabled
    cy.getBySel('signin-password').type('abcd'); // 4 chars
    cy.getBySel('signin-submit').should('not.be.disabled');
  });

  /* ------------------------------------------------------------------
   *  5. Sign‑Up validations – all fields + password mismatch
   * ------------------------------------------------------------------ */
  it('validates required fields on sign‑up form and shows mismatch error', () => {
    cy.visit('/signup');

    // The submit button should start disabled
    cy.getBySel('signup-submit').should('be.disabled');

    // Fill all required fields but leave passwords mismatching
    cy.getBySel('signup-first-name').type('John');
    cy.getBySel('signup-last-name').type('Doe');
    cy.getBySel('signup-username').type('johndoe123');
    cy.getBySel('signup-password').type('Password1');
    cy.getBySel('signup-confirmPassword').type('Password2');

    // Button remains disabled due to mismatch
    cy.getBySel('signup-submit').should('be.disabled');

    // The error message for mismatch should be rendered
    cy.contains('Password does not match').should('be.visible');
  });

  /* ------------------------------------------------------------------
   *  6. Sign‑In with invalid credentials – user not found
   * ------------------------------------------------------------------ */
  it('shows error when trying to sign‑in with a non‑existent user', () => {
    cy.route('POST', '/login').as('loginUser');

    cy.visit('/signin');
    cy.getBySel('signin-username').type('nonexistentUser');
    cy.getBySel('signin-password').type(Cypress.env('defaultPassword'));
    cy.getBySel('signin-submit').click();

    cy.wait('@loginUser').then(() => {
      cy.getBySel('signin-error')
        .should('be.visible')
        .and('contain.text', 'Username or password is invalid');
    });
  });

  /* ------------------------------------------------------------------
   *  7. Sign‑In with wrong password for an existing account
   * ------------------------------------------------------------------ */
  it('shows error when password is incorrect for an existing user', () => {
    // Grab an existing user from the DB
    cy.task('filter:database', { entity: 'users', query: {} }).then((users: any[]) => {
      const user = users[0];

      cy.route('POST', '/login').as('loginUser');

      cy.visit('/signin');
      cy.getBySel('signin-username').type(user.username);
      cy.getBySel('signin-password').type('wrongPassword123');
      cy.getBySel('signin-submit').click();

      cy.wait('@loginUser').then(() => {
        cy.getBySel('signin-error')
          .should('be.visible')
          .and('contain.text', 'Username or password is invalid');
      });
    });
  });
});
