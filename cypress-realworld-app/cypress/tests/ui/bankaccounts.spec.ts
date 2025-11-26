
import faker from 'faker';

const DEFAULT_PASSWORD = Cypress.env('defaultPassword') ?? 'password123';

function signUpAndLogin(username: string, password = DEFAULT_PASSWORD) {
  // 1️⃣ Create a new user via the API
  cy.request('POST', '/signup', {
    username,
    password,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
  });

  // 2️⃣ Log in using the UI helper (or API)
  cy.loginByApi(username, password);
}

function createBankAccount(
  bankName: string,
  accountNumber: string,
  routingNumber: string
) {
  cy.getBySel('bankaccount-bankName-input').clear().type(bankName);
  cy.getBySel('bankaccount-accountNumber-input')
    .clear()
    .type(accountNumber);
  cy.getBySel('bankaccount-routingNumber-input')
    .clear()
    .type(routingNumber);
  cy.getBySel('bankaccount-submit').click();
  cy.location('pathname').should('eq', '/bankaccounts');
}

/**
 *  Helper to find a bank‑account list item by its bankName
 *  Returns the list item DOM node
 */
function findAccountItem(name: string) {
  return cy
    .get('[data-test="bankaccount-list"]')
    .contains(`li`, name)
    .closest('[data-test^="bankaccount-list-item-"]');
}

describe('Bank Accounts', () => {
  let testUser: { username: string; password: string };

  beforeEach(() => {
    /* ------------------------------------------------------------------
     *  1. Seed an empty database (so the list starts empty)
     * ------------------------------------------------------------------ */
    cy.exec('yarn db:seed:empty', { failOnNonZeroExit: false });

    /* ------------------------------------------------------------------
     *  2. Create a fresh user and log in
     * ------------------------------------------------------------------ */
    testUser = {
      username: `user-${Date.now()}`,
      password: DEFAULT_PASSWORD,
    };
    signUpAndLogin(testUser.username, testUser.password);
    cy.visit('/bankaccounts');
    cy.location('pathname').should('eq', '/bankaccounts');
  });

  it('creates a new bank account – full flow', () => {
    /* --------------------------------------------------------------
     *  Click the “Create” button
     * -------------------------------------------------------------- */
    cy.getBySel('bankaccount-new').click();

    /* --------------------------------------------------------------
     *  Fill the form with valid data
     * -------------------------------------------------------------- */
    const bankName = 'Acme Bank';
    const accountNumber = faker.finance.account(10);
    const routingNumber = faker.finance.account(9);

    createBankAccount(bankName, accountNumber, routingNumber);

    /* --------------------------------------------------------------
     *  Verify the account shows up in the list
     * -------------------------------------------------------------- */
    findAccountItem(bankName).within(() => {
      cy.contains(bankName).should('be.visible');
      cy.contains('(Deleted)').should('not.exist');
    });
  });

  it('validates bank account form fields', () => {
    cy.getBySel('bankaccount-new').click();

    /* --------------------------------------------------------------
     *  Leave all fields empty and submit
     * -------------------------------------------------------------- */
    cy.getBySel('bankaccount-submit').click();

    cy.get('[data-test="bankaccount-bankName-input"]')
      .parent()
      .find('p.MuiFormHelperText-root')
      .should('contain.text', 'Enter a bank name');

    cy.get('[data-test="bankaccount-accountNumber-input"]')
      .parent()
      .find('p.MuiFormHelperText-root')
      .should('contain.text', 'Must contain at least 9 digits');

    cy.get('[data-test="bankaccount-routingNumber-input"]')
      .parent()
      .find('p.MuiFormHelperText-root')
      .should('contain.text', 'Must contain a valid routing number');

    /* --------------------------------------------------------------
     *  Fill only bankName, keep routing invalid, submit
     * -------------------------------------------------------------- */
    cy.getBySel('bankaccount-bankName-input').type('Test Bank');
    cy.getBySel('bankaccount-accountNumber-input').type('123456'); // too short
    cy.getBySel('bankaccount-routingNumber-input').type('abcde'); // not numeric

    cy.getBySel('bankaccount-submit').click();

    cy.get('[data-test="bankaccount-accountNumber-input"]')
      .parent()
      .find('p.MuiFormHelperText-root')
      .should('contain.text', 'Must contain at least 9 digits');

    cy.get('[data-test="bankaccount-routingNumber-input"]')
      .parent()
      .find('p.MuiFormHelperText-root')
      .should('contain.text', 'Must contain a valid routing number');
  });

  it('soft‑deletes a bank account', () => {
    /* --------------------------------------------------------------
     *  Create a bank account first
     * -------------------------------------------------------------- */
    const bankName = 'Delete Test Bank';
    const accountNumber = faker.finance.account(10);
    const routingNumber = faker.finance.account(9);

    cy.getBySel('bankaccount-new').click();
    createBankAccount(bankName, accountNumber, routingNumber);

    /* --------------------------------------------------------------
     *  Soft‑delete it
     * -------------------------------------------------------------- */
    findAccountItem(bankName)
      .find('[data-test="bankaccount-delete"]')
      .click({ force: true });

    /* --------------------------------------------------------------
     *  Verify the account is marked as deleted
     * -------------------------------------------------------------- */
    findAccountItem(bankName).within(() => {
      cy.contains('(Deleted)').should('be.visible');
      // delete button should no longer exist
      cy.contains('Delete').should('not.exist');
    });
  });

  it('shows empty list and onboarding modal when no accounts exist', () => {
    /* --------------------------------------------------------------
     *  Ensure the list is empty
     * -------------------------------------------------------------- */
    cy.get('[data-test="bankaccount-list"]').should('not.exist');
    cy.get('[data-test="empty-list-header"]').contains('No Bank Accounts').should('be.visible');

    /* --------------------------------------------------------------
     *  Onboarding modal should appear
     * -------------------------------------------------------------- */
    cy.get('[data-test="user-onboarding-dialog"]').should('be.visible');

    /* --------------------------------------------------------------
     *  Step 1: “Get Started” – click Next to go to Step 2
     * -------------------------------------------------------------- */
    cy.get('[data-test="user-onboarding-next"]').click();

    /* --------------------------------------------------------------
     *  Step 2: Create a bank account within the modal
     * -------------------------------------------------------------- */
    const bankName = 'Onboard Bank';
    const accountNumber = faker.finance.account(10);
    const routingNumber = faker.finance.account(9);

    cy.getBySel('bankaccount-bankName-input').clear().type(bankName);
    cy.getBySel('bankaccount-accountNumber-input')
      .clear()
      .type(accountNumber);
    cy.getBySel('bankaccount-routingNumber-input')
      .clear()
      .type(routingNumber);
    cy.getBySel('bankaccount-submit').click();

    /* --------------------------------------------------------------
     *  Step 3: “Finished” – verify modal shows “Finished” state
     * -------------------------------------------------------------- */
    cy.contains('Finished').should('be.visible');

    /* --------------------------------------------------------------
     *  Close the modal
     * -------------------------------------------------------------- */
    cy.get('[data-test="user-onboarding-next"]').click(); // “Done”
    cy.get('[data-test="user-onboarding-dialog"]').should('not.exist');

    /* --------------------------------------------------------------
     *  The new account should now appear in the list
     * -------------------------------------------------------------- */
    findAccountItem(bankName).within(() => {
      cy.contains(bankName).should('be.visible');
    });
  });
});
