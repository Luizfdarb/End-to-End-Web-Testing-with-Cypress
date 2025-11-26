
/// <reference types="cypress" />

describe('Transaction View', () => {
  beforeEach(() => {
    cy.server();
    cy.route('GET', 'http://localhost:3000/transaction/*', 'fixture:public-transactions.json');
  });

  it('Navigation tabs são ocultadas na página de transaction view', () => {     
    cy.visit('/transaction/123456');
    cy.get('[data-test="nav-transaction-tabs"]').should('be.hidden');
  });

  it('Like em uma transação + verificar contagem + botão disabled', () => {     
    cy.visit('/transaction/123456');
    cy.get('[data-test="transaction-like-button-123456"]').should('be.disabled');
    cy.get('[data-test="transaction-like-count-123456"]').should('contain', '0');
    cy.get('[data-test="transaction-like-button-123456"]').click();
    cy.get('[data-test="transaction-like-count-123456"]').should('contain', '1');
    cy.get('[data-test="transaction-like-button-123456"]').should('be.enabled');
  });

  it('Comentários em transação (múltiplos comments)', () => {
    cy.visit('/transaction/123456');
    cy.get('[data-test="comment-list-item-1"]').should('exist');
    cy.get('[data-test="comment-list-item-2"]').should('exist');
    cy.get('[data-test="comment-list-item-3"]').should('exist');
  });

  it('Aceitar transaction request + verificar botão desaparece', () => {        
    cy.visit('/transaction/123456');
    cy.get('[data-test="transaction-accept-request-123456"]').should('exist');  
    cy.get('[data-test="transaction-accept-request-123456"]').click();
    cy.get('[data-test="transaction-accept-request-123456"]').should('not.exist');
  });

  it('Rejeitar transaction request + verificar botão desaparece', () => {       
    cy.visit('/transaction/123456');
    cy.get('[data-test="transaction-reject-request-123456"]').should('exist');  
    cy.get('[data-test="transaction-reject-request-123456"]').click();
    cy.get('[data-test="transaction-reject-request-123456"]').should('not.exist');
  });

  it('Botões accept/reject não aparecem em transação completa', () => {
    cy.visit('/transaction/123456');
    cy.get('[data-test="transaction-item-123456"]').should('contain', 'Status: Pendente');
    cy.get('[data-test="transaction-accept-request-123456"]').should('not.exist');
    cy.get('[data-test="transaction-reject-request-123456"]').should('not.exist');
  });
});
