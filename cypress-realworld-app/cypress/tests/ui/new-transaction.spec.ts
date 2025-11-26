
describe('Nova Transação', () => {
  beforeEach(() => {
    cy.visit('/transaction/new');
  });

  // Cenário 1: Criar transação completa (payment) com contato existente        
  it('Criar transação completa (payment) com contato existente', () => {        
    cy.get('#user-list-search-input').type('Usuario Exemplo');
    cy.get('button').click();
    cy.get('button[name="new"]').click();
    cy.get('#transaction-create-description-input').type('Pagamento exemplo');  
    cy.get('#transaction-create-amount-input').type('1000');
    cy.get('#transaction-create-submit-payment').click();
    cy.url().should('include', '/transaction/new/complete');
  });

  // Cenário 2: Criar transação completa (request) com contato existente        
  it('Criar transação completa (request) com contato existente', () => {        
    cy.get('#user-list-search-input').type('Usuario Exemplo');
    cy.get('button').click();
    cy.get('button[name="new"]').click();
    cy.get('#transaction-create-description-input').type('Solicitacao exemplo');
    cy.get('#transaction-create-amount-input').type('1000');
    cy.get('#transaction-create-submit-request').click();
    cy.url().should('include', '/transaction/new/complete');
  });

  // Cenário 3: Criar transação com novo contato (search + add)
  it('Criar transação com novo contato (search + add)', () => {
    cy.get('#user-list-search-input').type('Novo Usuario');
    cy.get('button').click();
    cy.get('button[name="new"]').click();
    cy.get('#transaction-create-description-input').type('Novo pagamento');     
    cy.get('#transaction-create-amount-input').type('1000');
    cy.get('#transaction-create-submit-payment').click();
    cy.url().should('include', '/transaction/new/complete');
  });

  // Cenário 4: Validações step 1 (contato obrigatório + botão disabled)        
  it('Validações step 1 (contato obrigatório + botão disabled)', () => {        
    cy.get('#user-list-search-input').clear();
    cy.get('button[name="create"]').should('be.disabled');
  });

  // Cenário 5: Validações step 2 (valor + descrição obrigatórios)
  it('Validações step 2 (valor + descrição obrigatórios)', () => {
    cy.get('#transaction-create-description-input').clear();
    cy.get('#transaction-create-submit-payment').should('be.disabled');
    cy.get('#transaction-create-description-input').type('Descrição exemplo');  
    cy.get('#transaction-create-submit-payment').should('be.enabled');
  });

  // Cenário 6: Cancelar transação em qualquer step
  it('Cancelar transação em qualquer step', () => {
    cy.get('#transaction-create-amount-input').clear();
    cy.get('#transaction-create-cancel').click();
    cy.url().should('include', '/transaction/new');
  });

  // Cenário 7: Transação com valor máximo e mínimo
  it('Transação com valor máximo e mínimo', () => {
    cy.get('#transaction-create-amount-input').clear();
    cy.get('#transaction-create-amount-input').type('0');
    cy.get('#transaction-create-submit-payment').click();
    cy.get('#transaction-create-amount-input').clear();
    cy.get('#transaction-create-amount-input').type('1000000');
    cy.get('#transaction-create-submit-payment').click();
  });
});
