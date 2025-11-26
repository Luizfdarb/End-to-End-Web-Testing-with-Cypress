
describe('Real‑World App – New Transaction flow', () => {
  // -----------------------------------------------------------------
  // Helper – create a fresh seeded DB before the whole spec runs
  // -----------------------------------------------------------------
  before(() => {
    // Seed the in‑memory DB (see plugins `db:seed` task)
    cy.task('db:seed');
  });

  // -----------------------------------------------------------------
  // Helper – login once before each test (XState login is the fastest)
  // -----------------------------------------------------------------
  beforeEach(() => {
    // The default password is stored in Cypress.env (see `cypress.json`)
    // We log‑in as the first user in the seed data.
    cy.task('find:database', { entity: 'users', query: {} }).then((users: any[]) => {
      const user = users[0];
      // Login via XState – this avoids UI flakiness and guarantees a clean state
      cy.loginByXstate(user.username, Cypress.env('defaultPassword'));
    });
  });

  // -----------------------------------------------------------------
  // 1️⃣  Payment transaction with an existing contact
  // -----------------------------------------------------------------
  it('creates a complete payment transaction with an existing contact', () => {
    // -------------------------------------------------------------
    // 1️⃣ → go to the “new transaction” page (step‑1)
    // -------------------------------------------------------------
    cy.visit('/transaction/new');

    // pick the first contact that appears in the list
    cy.get('[data-test^=user-list-item-]').first().as('contactItem').click();

    // -------------------------------------------------------------
    // 2️⃣ → step‑2 – fill amount & description, submit as payment
    // -------------------------------------------------------------
    cy.getBySel('transaction-create-amount-input')
      .clear()
      .type('25'); // $25 → 2500 cents (the UI formats automatically)

    cy.getBySel('transaction-create-description-input')
      .clear()
      .type('Cypress payment test');

    // submit as a payment
    cy.getBySel('transaction-create-submit-payment').click();

    // -------------------------------------------------------------
    // 3️⃣ → step‑3 – verify the success screen appears
    // -------------------------------------------------------------
    cy.get('[data-test=transaction-list-empty-create-transaction-button]').should('not.exist');
    cy.get('[data-test=new-transaction-return-to-transactions]').should('be.visible');
    cy.contains('Paid $25.00 for Cypress payment test').should('exist');
  });

  // -----------------------------------------------------------------
  // 2️⃣  Request transaction with an existing contact
  // -----------------------------------------------------------------
  it('creates a complete request transaction with an existing contact', () => {
    cy.visit('/transaction/new');

    // select a contact (different from the previous test to avoid caching)
    cy.get('[data-test^=user-list-item-]').eq(1).as('contactItem').click();

    // fill the form
    cy.getBySel('transaction-create-amount-input')
      .clear()
      .type('15');

    cy.getBySel('transaction-create-description-input')
      .clear()
      .type('Cypress request test');

    // submit as a request
    cy.getBySel('transaction-create-submit-request').click();

    // verify step‑3 (confirmation) is shown
    cy.get('[data-test=new-transaction-return-to-transactions]').should('be.visible');
    cy.contains('Requested $15.00 for Cypress request test').should('exist');
  });

  // -----------------------------------------------------------------
  // 3️⃣  Transaction with a **new** contact (search + select)
  // -----------------------------------------------------------------
  it('creates a transaction with a newly added contact by searching for a user', () => {
    cy.visit('/transaction/new');

    // The search box lives inside the “Select Contact” step.
    // Search for a user that is *not* already in the contacts list.
    // We use a known first‑name from the seeded data (e.g. “Kevin”).
    cy.get('#user-list-search-input').type('Kevin');

    // Wait for the filtered list to appear and pick the first result
    cy.get('[data-test^=user-list-item-]').first().as('newContact').click();

    // Fill amount & description (payment)
    cy.getBySel('transaction-create-amount-input')
      .clear()
      .type('30');

    cy.getBySel('transaction-create-description-input')
      .clear()
      .type('Cypress new‑contact payment');

    cy.getBySel('transaction-create-submit-payment').click();

    // Confirm success page
    cy.get('[data-test=new-transaction-return-to-transactions]').should('be.visible');
    cy.contains('Paid $30.00 for Cypress new-contact payment').should('exist');
  });

  // -----------------------------------------------------------------
  // 4️⃣  Step‑1 validation – contact is required (button stays disabled)
  // -----------------------------------------------------------------
  it('prevents proceeding to step‑2 when no contact is selected', () => {
    cy.visit('/transaction/new');

    // At step‑1 there is *no* “Next” button – the UI only enables step‑2
    // after a contact is clicked.  Verify that step‑2 UI does **not** exist.
    cy.get('[data-test=transaction-create-form]').should('not.exist');

    // Click somewhere else (outside a contact) – still no step‑2.
    cy.get('body').click(0, 0);
    cy.get('[data-test=transaction-create-form]').should('not.exist');
  });

  // -----------------------------------------------------------------
  // 5️⃣  Step‑2 validation – amount & description are required
  // -----------------------------------------------------------------
  it('disables the submit buttons on step‑2 until amount and description are provided', () => {
    cy.visit('/transaction/new');

    // select a contact to move to step‑2
    cy.get('[data-test^=user-list-item-]').first().click();

    // At this point the submit buttons are disabled
    cy.getBySel('transaction-create-submit-payment')
      .should('be.disabled')
      .and('have.attr', 'disabled');

    cy.getBySel('transaction-create-submit-request')
      .should('be.disabled')
      .and('have.attr', 'disabled');

    // Fill only the amount – buttons stay disabled
    cy.getBySel('transaction-create-amount-input').type('12');
    cy.getBySel('transaction-create-submit-payment').should('be.disabled');

    // Clear amount, fill only the description – still disabled
    cy.getBySel('transaction-create-amount-input').clear();
    cy.getBySel('transaction-create-description-input').type('Just a note');
    cy.getBySel('transaction-create-submit-payment').should('be.disabled');

    // Fill both fields – buttons become enabled
    cy.getBySel('transaction-create-amount-input').type('12');
    cy.getBySel('transaction-create-submit-payment')
      .should('not.be.disabled')
      .click();

    // After clicking, we are on step‑3 (confirmation)
    cy.get('[data-test=new-transaction-return-to-transactions]').should('be.visible');
  });

  // -----------------------------------------------------------------
  // 6️⃣  Cancel a transaction at any step (reload the page)
  // -----------------------------------------------------------------
  it('cancels a transaction by reloading the page and returns to step‑1', () => {
    cy.visit('/transaction/new');

    // select a contact → step‑2 appears
    cy.get('[data-test^=user-list-item-]').first().click();

    // verify we are on step‑2
    cy.getBySel('transaction-create-form').should('be.visible');

    // reload the page – the flow should reset to step‑1
    cy.reload();

    // step‑1 UI (the users list) must be visible again
    cy.get('[data-test^=user-list-item-]').should('have.length.greaterThan', 0);
    // step‑2 form must no longer be present
    cy.get('[data-test=transaction-create-form]').should('not.exist');
  });

  // -----------------------------------------------------------------
  // 7️⃣  Transaction with the **minimum** and **maximum** allowed amount
  // -----------------------------------------------------------------
  it('creates transactions using the minimum and maximum amount values', () => {
    // ---------- MINIMUM ----------
    cy.visit('/transaction/new');
    cy.get('[data-test^=user-list-item-]').first().click();

    // Amount = 0.01 (the UI expects cents, we type "0.01")
    cy.getBySel('transaction-create-amount-input')
      .clear()
      .type('0.01');

    cy.getBySel('transaction-create-description-input')
      .clear()
      .type('Min amount test');

    cy.getBySel('transaction-create-submit-payment').click();

    // verify success
    cy.contains('Paid $0.01 for Min amount test').should('exist');

    // ---------- MAXIMUM ----------
    // Go back to the New Transaction page
    cy.get('[data-test=new-transaction-return-to-transactions]').click();
    cy.get('[data-test=nav-top-new-transaction]').click();

    // select a contact again
    cy.get('[data-test^=user-list-item-]').first().click();

    // Use a large amount (e.g. $9999.99 → 999999 cents)
    cy.getBySel('transaction-create-amount-input')
      .clear()
      .type('9999.99');

    cy.getBySel('transaction-create-description-input')
      .clear()
      .type('Max amount test');

    cy.getBySel('transaction-create-submit-payment').click();

    // verify success
    cy.contains('Paid $9,999.99 for Max amount test').should('exist');
  });
});
