import { faker } from '@faker-js/faker';
import { Transaction } from '../../models';

describe('Transaction View', () => {
  beforeEach(() => {
    // Preparar ambiente
  });

  it('Exibe detalhes da transação', () => {
    // Visitar página de detalhes da transação
    cy.visit('/transaction/123');

    // Verificar se detalhes estão presentes
    cy.get('[data-test="transaction-amount"]').should('be.visible');
    cy.get('[data-test="transaction-description"]').should('be.visible');
  });

  it('Exibe lista de likes e permite curtir transação', () => {
    // Visitar página de detalhes da transação
    cy.visit('/transaction/123');

    // Verificar se lista de likes está visível
    cy.get('[data-test="likes-list"]').should('be.visible');

    // Curtir transação
    cy.get('[data-test="like-button"]').click();

    // Verificar se like foi adicionado à lista
    cy.get('[data-test="likes-list"]').should('contain', '1 like');
  });

  it('Exibe lista de comentários e permite adicionar comentário', () => {
    // Visitar página de detalhes da transação
    cy.visit('/transaction/123');

    // Verificar se lista de comentários está visível
    cy.get('[data-test="comments-list"]').should('be.visible');

    // Adicionar comentário
    cy.get('[data-test="comment-input"]').type('Novo comentário');
    cy.get('[data-test="comment-button"]').click();

    // Verificar se comentário foi adicionado à lista
    cy.get('[data-test="comments-list"]').should('contain', 'Novo comentário');
  });

  it('Permite aceitar ou rejeitar transação', () => {
    // Visitar página de detalhes da transação
    cy.visit('/transaction/123');

    // Aceitar transação
    cy.get('[data-test="accept-button"]').click();

    // Verificar se transação foi aceita
    cy.get('[data-test="transaction-status"]').should('contain', 'Aceita');

    // Rejeitar transação
    cy.get('[data-test="reject-button"]').click();

    // Verificar se transação foi rejeitada
    cy.get('[data-test="transaction-status"]').should('contain', 'Rejeitada');
  });
});