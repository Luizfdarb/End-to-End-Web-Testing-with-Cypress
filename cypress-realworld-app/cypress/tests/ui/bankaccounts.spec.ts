describe('Bank Accounts', () => {
  beforeEach(() => {
    cy.loginByXstate('user123', 'password123');
  });

  it('create bank account', () => {
    cy.visit('/bankaccounts/new');
    cy.get('[data-test="bankaccount-bankName-input"]').type('Bank Name');
    cy.get('[data-test="bankaccount-routingNumber-input"]').type('123456789');
    cy.get('[data-test="bankaccount-accountNumber-input"]').type('1234567890123');
    cy.get('[data-test="bankaccount-submit"]').click();
    cy.url().should('eq', '/bankaccounts');
    cy.get('[data-test="bankaccount-list-item-0"]').should('contain', 'Bank Name');
  });

  it('list bank accounts', () => {
    cy.visit('/bankaccounts');
    cy.get('[data-test="bankaccount-list-item-0"]').should('contain', 'Bank Name');
    cy.get('[data-test="bankaccount-list-item-1"]').should('contain', 'Bank Name 2');
  });

  it('delete bank account', () => {
    cy.visit('/bankaccounts');
    cy.get('[data-test="bankaccount-list-item-0"]').within(() => {
      cy.get('[data-test="bankaccount-delete"]').click();
    });
    cy.url().should('eq', '/bankaccounts');
    cy.get('[data-test="bankaccount-list-item-0"]').should('not.exist');
  });
});
