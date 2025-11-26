
import { formatAmount } from '../../src/utils/transactionUtils';

describe('Bank Accounts', () => {
  // -------------------------------------------------------------------------
  // Helper – creates a brand‑new user via the API and logs in.
  // -------------------------------------------------------------------------
  const createAndLoginUser = () => {
    const timestamp = Date.now();
    const username = `cypress_user_${timestamp}`;
    const password = Cypress.env('defaultPassword') || 'Password123';

    // Minimal but complete user payload – matches backend expectations
    const newUser = {
      firstName: 'Cypress',
      lastName: 'Tester',
      username,
      password,
      email: `${username}@example.com`,
      phoneNumber: '555-123-4567',
      avatar: `https://avatars.dicebear.com/api/human/${username}.svg`,
      defaultPrivacyLevel: 'public',
      balance: 1000,
    };

    // 1️⃣  Seed the DB (clean state) and create the user
    cy.task('db:seed');
    cy.request('POST', `${Cypress.env('apiUrl')}/users`, newUser).then(() => {
      // 2️⃣  Log‑in via API – this sets the session cookie for the UI
      cy.loginByApi(username, password);
    });
  };

  // -------------------------------------------------------------------------
  // 1️⃣  CREATE – happy path
  // -------------------------------------------------------------------------
  it('should create a new bank account successfully', () => {
    createAndLoginUser();

    // Go to the Bank Accounts page
    cy.visit('/bankaccounts');

    // Open the “Create” form
    cy.getBySel('bankaccount-new').click();

    // Fill the form – use unique values to avoid false positives
    const bankName = `Cypress Bank ${Date.now()}`;
    const routingNumber = '123456789'; // exactly 9 digits (valid)
    const accountNumber = '1234567890'; // 10 digits (valid)

    cy.getBySel('bankaccount-bankName-input')
      .type(bankName)
      .should('have.value', bankName);

    cy.getBySel('bankaccount-routingNumber-input')
      .type(routingNumber)
      .should('have.value', routingNumber);

    cy.getBySel('bankaccount-accountNumber-input')
      .type(accountNumber)
      .should('have.value', accountNumber);

    // Submit – the button becomes enabled only when the form is valid
    cy.getBySel('bankaccount-submit')
      .should('not.be.disabled')
      .click();

    // After creation we are redirected back to the list; verify the new item
    cy.get(`[data-test^=bankaccount-list-item-]`).contains(bankName).should('exist');
  });

  // -------------------------------------------------------------------------
  // 2️⃣  VALIDATION – detailed checks for each field
  // -------------------------------------------------------------------------
  it('should display detailed form validation errors', () => {
    createAndLoginUser();

    cy.visit('/bankaccounts');
    cy.getBySel('bankaccount-new').click();

    // ---- 2a. All fields empty – submit button must stay disabled
    cy.getBySel('bankaccount-submit').should('be.disabled');

    // ---- 2b. Invalid routing number (too short) – error should appear
    cy.getBySel('bankaccount-routingNumber-input')
      .type('123') // less than 9 chars
      .blur();

    // Formik shows the validation error as helper text
    cy.get('[data-test="bankaccount-routingNumber-input"]')
      .parent()
      .parent()
      .find('p.MuiFormHelperText-root')
      .should('contain', 'Must contain a valid routing number');

    // Submit button still disabled because the form is invalid
    cy.getBySel('bankaccount-submit').should('be.disabled');

    // ---- 2c. Invalid account number (too short) – error should appear
    cy.getBySel('bankaccount-accountNumber-input')
      .type('12') // less than 9 digits
      .blur();

    cy.get('[data-test="bankaccount-accountNumber-input"]')
      .parent()
      .parent()
      .find('p.MuiFormHelperText-root')
      .should('contain', 'Must contain at least 9 digits');

    // ---- 2d. Provide valid values for the two fields and a short bank name
    // (bankName must be ≥5 chars)
    const shortBankName = 'Abc';
    cy.getBySel('bankaccount-bankName-input')
      .type(shortBankName)
      .blur();

    cy.get('[data-test="bankaccount-bankName-input"]')
      .parent()
      .parent()
      .find('p.MuiFormHelperText-root')
      .should('contain', 'Must contain at least 5 characters');

    // ---- 2e. Correct the fields – button becomes enabled
    const validBankName = 'Cypress Savings';
    cy.getBySel('bankaccount-bankName-input')
      .clear()
      .type(validBankName);

    cy.getBySel('bankaccount-routingNumber-input')
      .clear()
      .type('987654321'); // valid 9‑digit routing

    cy.getBySel('bankaccount-accountNumber-input')
      .clear()
      .type('1234567890'); // valid 10‑digit account

    cy.getBySel('bankaccount-submit')
      .should('not.be.disabled')
      .click();

    // Verify the newly created account appears in the list
    cy.get(`[data-test^=bankaccount-list-item-]`).contains(validBankName).should('exist');
  });

  // -------------------------------------------------------------------------
  // 3️⃣  SOFT‑DELETE – mark a bank account as deleted
  // -------------------------------------------------------------------------
  it('should soft‑delete an existing bank account', () => {
    createAndLoginUser();

    // Create a bank account first (reuse the happy‑path flow)
    cy.visit('/bankaccounts');
    cy.getBySel('bankaccount-new').click();

    const bankName = `DeleteMe Bank ${Date.now()}`;
    const routingNumber = '111222333';
    const accountNumber = '9998887776';

    cy.getBySel('bankaccount-bankName-input').type(bankName);
    cy.getBySel('bankaccount-routingNumber-input').type(routingNumber);
    cy.getBySel('bankaccount-accountNumber-input').type(accountNumber);
    cy.getBySel('bankaccount-submit').click();

    // Ensure the account appears
    cy.get(`[data-test^=bankaccount-list-item-]`).contains(bankName).should('exist');

    // Click the Delete button for that account
    // The Delete button lives inside the list‑item; we locate it by data-test
    cy.get(`[data-test^=bankaccount-list-item-]`).contains(bankName).parents('[data-test^=bankaccount-list-item-]')
      .within(() => {
        cy.getBySel('bankaccount-delete').click();
      });

    // After soft delete the UI shows "(Deleted)" next to the bank name
    cy.get(`[data-test^=bankaccount-list-item-]`).contains(`${bankName} (Deleted)`).should('exist');
  });

  // -------------------------------------------------------------------------
  // 4️⃣  EMPTY LIST + ONBOARDING MODAL
  // -------------------------------------------------------------------------
  it('should show empty list state and onboarding modal for a brand‑new user', () => {
    // Create a fresh user – by definition this user has **no** bank accounts
    createAndLoginUser();

    // The onboarding dialog is displayed automatically for users without accounts
    cy.get('[data-test="user-onboarding-dialog"]').should('be.visible');
    cy.get('[data-test="user-onboarding-dialog-title"]')
      .should('contain.text', 'Get Started with Real World App');

    // Navigate to the Bank Accounts page – the list should be empty
    cy.visit('/bankaccounts');

    // The EmptyList component renders a header with data-test="empty-list-header"
    cy.get('[data-test="empty-list-header"]').should('contain.text', 'No Bank Accounts');

    // The onboarding dialog should still be present (stepOne) because no accounts yet
    cy.get('[data-test="user-onboarding-dialog"]').should('be.visible');
  });
});
