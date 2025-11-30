describe('Transaction Feeds', () => {
  beforeEach(() => {
    cy.loginByXstate(Cypress.env('testUserUsername'), Cypress.env('testUserPassword'));
    cy.visit('/');
  });

  it('navega entre as abas de transações', () => {
    cy.getBySel('nav-transaction-tabs').within(() => {
      cy.get('tab').eq(0).click();
      cy.getBySel('transaction-list').should('be.visible');
      cy.get('tab').eq(1).click();
      cy.getBySel('transaction-list').should('be.visible');
      cy.get('tab').eq(2).click();
      cy.getBySel('transaction-list').should('be.visible');
    });
  });

  it('filtra transações por data', () => {
    const startDate = new Date('2022-01-01');
    const endDate = new Date('2022-01-31');
    cy.pickDateRange(startDate, endDate);
    // Implementar lógica para verificar as datas das transações
  });

  it('filtra transações por valor', () => {
    const minValue = 100;
    const maxValue = 1000;
    cy.setTransactionAmountRange(minValue, maxValue);
    // Implementar lógica para verificar as transações exibidas
  });
});
