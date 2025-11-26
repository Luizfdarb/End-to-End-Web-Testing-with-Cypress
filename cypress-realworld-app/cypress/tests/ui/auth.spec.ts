

describe('Authentication – Real World App', () => {
  // -------------------------------------------------------------------------
  // Helper – obtain a deterministic user from the seeded DB.
  // -------------------------------------------------------------------------
  let seededUser: {
    username: string;
    password: string; // the default password set in .env (exposed via Cypress env)
    firstName: string;
    lastName: string;
  };

  before(() => {
    // The API server is already running (started by `yarn start:ci` in the CI).
    // Grab the first user from the seed so the tests are deterministic.
    cy.request('GET', `${Cypress.env('apiUrl')}/users`).then((resp) => {
      const first = resp.body.results[0];
      seededUser = {
        username: first.username,
        password: Cypress.env('defaultPassword'), // same for every seeded user
        firstName: first.firstName,
        lastName: first.lastName,
      };
    });
  });

  // -------------------------------------------------------------------------
  // Reset DB before each test – guarantees isolation.
  // -------------------------------------------------------------------------
  beforeEach(() => {
    cy.task('db:seed');
  });

  // -------------------------------------------------------------------------
  // 1️⃣  Redirection – non‑authenticated user tries to access a protected page.
  // -------------------------------------------------------------------------
  it('Redirects unauthenticated user from a protected route to the sign‑in page', () => {
    cy.visit('/personal'); // protected route
    cy.location('pathname').should('eq', '/signin');
  });

  // -------------------------------------------------------------------------
  // 2️⃣  Login with “remember me”, verify cookie, then logout.
  // -------------------------------------------------------------------------
  it('Logs in with “Remember me”, checks session cookie, then logs out', () => {
    // UI login (the custom command also asserts the request was made)
    cy.login(seededUser.username, seededUser.password, true);

    // The app uses an express‑session cookie called `connect.sid`
    cy.getCookie('connect.sid')
      .should('exist')
      .and((cookie) => {
        // a session cookie should have a value (non‑empty string)
        expect(cookie?.value).to.be.a('string').and.not.be.empty;
      });

    // Logout via XState (bypasses the UI but still hits the /logout endpoint)
    cy.logoutByXstate();

    // After logout we should be back on the sign‑in page
    cy.location('pathname').should('eq', '/signin');
  });

  // -------------------------------------------------------------------------
  // 3️⃣  Full signup → onboarding (bank account) → dashboard.
  // -------------------------------------------------------------------------
  it('Signs up a new user, completes onboarding and lands on the dashboard', () => {
    const newUser = {
      firstName: 'Cypress',
      lastName: 'Tester',
      username: `cyp_user_${Date.now()}`,
      password: 'Password123',
    };

    // ----- SIGN‑UP ---------------------------------------------------------
    cy.visit('/signup');

    cy.getBySel('signup-first-name').type(newUser.firstName);
    cy.getBySel('signup-last-name').type(newUser.lastName);
    cy.getBySel('signup-username').type(newUser.username);
    cy.getBySel('signup-password').type(newUser.password);
    cy.getBySel('signup-confirmPassword').type(newUser.password);
    cy.getBySel('signup-submit').click();

    // after a successful sign‑up the app redirects to /signin
    cy.location('pathname').should('eq', '/signin');

    // ----- LOGIN -----------------------------------------------------------
    cy.login(newUser.username, newUser.password);

    // ----- ONBOARDING ------------------------------------------------------
    // the onboarding dialog appears because the user has no bank accounts yet
    cy.get('[data-test="user-onboarding-dialog"]').should('be.visible');

    // Step 1 → Next (explain why we need a bank account)
    cy.get('[data-test="user-onboarding-next"]').click();

    // Step 2 – create a bank account (the form is rendered inside the dialog)
    cy.get('[data-test="bankaccount-bankName-input"]').type('Cypress Bank');
    cy.get('[data-test="bankaccount-routingNumber-input"]').type('123456789');
    cy.get('[data-test="bankaccount-accountNumber-input"]').type('1234567890');
    cy.get('[data-test="bankaccount-submit"]').click();

    // After creating the bank account the onboarding dialog moves to step 3
    cy.get('[data-test="user-onboarding-dialog-title"]')
      .should('contain', 'Finished');

    // Finish onboarding
    cy.get('[data-test="user-onboarding-next"]').click();

    // The dialog should now be closed and the user should see the dashboard
    cy.get('[data-test="user-onboarding-dialog"]').should('not.exist');

    // Verify that the main content (transaction list) is rendered
    cy.get('[data-test="nav-transaction-tabs"]').should('be.visible');
  });

  // -------------------------------------------------------------------------
  // 4️⃣  Login form validations – required fields and disabled submit button.
  // -------------------------------------------------------------------------
  it('Shows validation errors on the login form and disables the submit button until the form is valid', () => {
    cy.visit('/signin');

    // Initially the button is disabled
    cy.getBySel('signin-submit').should('be.disabled');

    // Fill only the username – still disabled
    cy.getBySel('signin-username').type('anyuser');
    cy.getBySel('signin-submit').should('be.disabled');

    // Fill password – button becomes enabled
    cy.getBySel('signin-password').type('anypassword');
    cy.getBySel('signin-submit').should('not.be.disabled');

    // Clear username → button disabled again
    cy.getBySel('signin-username').clear();
    cy.getBySel('signin-submit').should('be.disabled');
  });

  // -------------------------------------------------------------------------
  // 5️⃣  Signup form validations – required fields and password mismatch.
  // -------------------------------------------------------------------------
  it('Validates the signup form fields and shows a password‑mismatch error', () => {
    cy.visit('/signup');

    // All fields are required – the submit button starts disabled
    cy.getBySel('signup-submit').should('be.disabled');

    // Fill everything correctly except the password confirmation
    cy.getBySel('signup-first-name').type('Foo');
    cy.getBySel('signup-last-name').type('Bar');
    cy.getBySel('signup-username').type('foobar');
    cy.getBySel('signup-password').type('Secret123');
    cy.getBySel('signup-confirmPassword').type('Secret321'); // mismatch

    // The button stays disabled because the form is invalid
    cy.getBySel('signup-submit').should('be.disabled');

    // The password‑mismatch helper text appears
    cy.get('#confirmPassword-helper-text')
      .should('contain', 'Password does not match');
  });

  // -------------------------------------------------------------------------
  // 6️⃣  Invalid credentials – wrong username / password.
  // -------------------------------------------------------------------------
  it('Displays an error message when logging in with invalid credentials', () => {
    cy.visit('/signin');

    // Use a non‑existent user
    cy.getBySel('signin-username').type('unknown_user');
    cy.getBySel('signin-password').type('doesnotmatter');
    cy.getBySel('signin-submit').click();

    // The app shows a Material‑UI Alert with the error
    cy.get('[data-test="signin-error"]')
      .should('be.visible')
      .and('contain', 'Username or password is invalid');
  });

  // -------------------------------------------------------------------------
  // 7️⃣  Wrong password – correct username but bad password.
  // -------------------------------------------------------------------------
  it('Shows the same error when the password is incorrect for a known user', () => {
    cy.visit('/signin');

    cy.getBySel('signin-username').type(seededUser.username);
    cy.getBySel('signin-password').type('WrongPassword');
    cy.getBySel('signin-submit').click();

    cy.get('[data-test="signin-error"]')
      .should('be.visible')
      .and('contain', 'Username or password is invalid');
  });
});
