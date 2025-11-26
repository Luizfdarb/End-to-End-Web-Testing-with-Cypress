
// cypress/integration/bank-accounts.spec.ts

describe('Bank Accounts', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('should create a new bank account', () => {
    cy.getBySel('sidenav-toggle').click();
    cy.getBySel('sidenav-bankaccounts').click();
    cy.getBySel('bankaccount-new').click();
    cy.getBySel('bankaccount-form').within(() => {
      cy.getBySel('bankaccount-bankName-input').type('My Bank');
    });
    cy.getBySel('bankaccount-routingNumber-input').type('123456789');
    cy.getBySel('bankaccount-accountNumber-input').type('1234567890');
    cy.getBySel('transaction-create-submit').click();
    cy.getBySel('transaction-list-empty-create-transaction-button').click();
  });

  it('should have valid form field validation', () => {
    cy.visit('http://localhost:3000');
    cy.getBySel('sidenav-toggle').click();
    cy.getBySel('sidenav-bankaccounts').click();
    cy.getBySel('bankaccount-new').click();
    cy.getBySel('bankaccount-form').within(() => {
      cy.getBySel('bankaccount-bankName-input').type('A');
      cy.getBySel('bankaccount-bankName-input').should('have.attr', 'data-test', 'bankaccount-bankName-input-error');
    });
    cy.getBySel('bankaccount-routingNumber-input').type('12345678');
    cy.getBySel('bankaccount-routingNumber-input').should('have.attr', 'data-test', 'bankaccount-routingNumber-input-error');
    cy.getBySel('bankaccount-accountNumber-input').type('123456789');
    cy.getBySel('bankaccount-accountNumber-input').should('have.attr', 'data-test', 'bankaccount-accountNumber-input-error');
  });

  it('should soft delete an existing bank account', () => {
    cy.visit('http://localhost:3000');
    cy.getBySel('sidenav-toggle').click();
    cy.getBySel('sidenav-bankaccounts').click();
    cy.getBySel('bankaccount-new').click();
    cy.getBySel('bankaccount-form').within(() => {
      cy.getBySel('bankaccount-bankName-input').type('My Bank');
    });
    cy.getBySel('bankaccount-routingNumber-input').type('123456789');
    cy.getBySel('bankaccount-accountNumber-input').type('1234567890');
    cy.getBySel('transaction-create-submit').click();
    cy.getBySel('transaction-list-empty-create-transaction-button').click();
    cy.getBySel('sidenav-toggle').click();
    cy.getBySel('sidenav-bankaccounts').click();
    cy.getBySel('bankaccount-list-item-0').within(() => {
      cy.getBySel('bankaccount-delete').click();
      cy.getBySel('alert-bar-severity-success').should('be.visible');
    });
  });

  it('should have an empty list state and show onboarding modal', () => {
    cy.visit('http://localhost:3000');
    cy.getBySel('sidenav-toggle').click();
    cy.getBySel('sidenav-bankaccounts').click();
    cy.getBySel('bankaccount-list').should('contain', 'No Bank Accounts');
    cy.getBySel('bankaccount-new').should('be.visible');
  });
});
