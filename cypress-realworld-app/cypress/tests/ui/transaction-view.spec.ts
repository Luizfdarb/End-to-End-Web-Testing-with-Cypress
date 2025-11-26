
/// <reference types="cypress" />

describe('Transaction View', () => {
  beforeEach(() => {
    cy.login('username', 'password');
  });

  it('Navigation tabs ficam ocultas na página de transaction view', () => {
    cy.visit('/transaction/123');
    cy.get('[data-test="nav-transaction-tabs"]').should('not.be.visible');
  });

  it('Like em uma transação + verificar contagem + botão disabled', () => {
    cy.visit('/transaction/123');
    cy.get('[data-test="transaction-like-button-123"]').click();
    cy.get('[data-test="transaction-like-count-123"]').should('contain', '1');
    cy.get('[data-test="transaction-like-button-123"]').should('be.disabled');
  });

  it('Comentários em transação (múltiplos comments)', () => {
    cy.visit('/transaction/123');
    cy.get('[data-test="transaction-comment-input-123"]').type(' commentaire 1 ');
    cy.get('[data-test="transaction-comment-submit-123"]').click();
    cy.get('[data-test="transaction-comment-input-123"]').type(' commentaire 2 ');
    cy.get('[data-test="transaction-comment-submit-123"]').click();
    cy.get('[data-test="comments-list-123"]').should('contain', 'commentaire 1');
    cy.get('[data-test="comments-list-123"]').should('contain', 'commentaire 2');
  });

  it('Aceitar transaction request + verificar botão desaparece', () => {
    cy.visit('/transaction/123');
    cy.get('[data-test="transaction-accept-request-123"]').click();
    cy.get('[data-test="transaction-accept-request-123"]').should('not.exist');
  });

  it('Rejeitar transaction request + verificar botão desaparece', () => {
    cy.visit('/transaction/123');
    cy.get('[data-test="transaction-reject-request-123"]').click();
    cy.get('[data-test="transaction-reject-request-123"]').should('not.exist');
  });

  it('Botões accept/reject não aparecem em transação completa', () => {
    cy.visit('/transaction/123');
    cy.get('[data-test="transaction-accept-request-123"]').should('not.exist');
    cy.get('[data-test="transaction-reject-request-123"]').should('not.exist');
  });
});
