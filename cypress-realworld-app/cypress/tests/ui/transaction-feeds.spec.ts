import { getPaginatedItems } from '../../utils/transactionUtils';
import { TransactionResponseItem, TransactionPagination } from '../../models';

describe('Transações', () => {
  beforeEach(() => {
    // Acessa a página de transações
    cy.visit('/');
  });

  it('Carrega a lista de transações', () => {
    // Verifica se a lista de transações está visível
    cy.get('[data-test="transaction-list"]').should('be.visible');
    // Verifica se a lista contém as transações esperadas
    cy.get('[data-test="transaction-item"]').should('have.length', 10);
  });

  it('Filtra transações por data', () => {
    // Acessa o filtro de data
    cy.get('[data-test="transaction-list-filter-date-range-button"]').click();
    // Seleciona uma data específica
    cy.get('[data-test="filter-date-range"]').within(() => {
      cy.get('input').type('2022-01-01');
    });
    // Verifica se as transações são filtradas corretamente
    cy.get('[data-test="transaction-item"]').should('have.length', 5);
  });

  it('Filtra transações por valor', () => {
    // Acessa o filtro de valor
    cy.get('[data-test="transaction-list-filter-amount-range-button"]').click();
    // Seleciona um valor específico
    cy.get('[data-test="filter-amount-range"]').within(() => {
      cy.get('input').type('100');
    });
    // Verifica se as transações são filtradas corretamente
    cy.get('[data-test="transaction-item"]').should('have.length', 3);
  });

  it('Paginação das transações', () => {
    // Acessa a página de transações
    cy.get('[data-test="transaction-list"]').within(() => {
      // Verifica se a páginação está visível
      cy.get('[data-test="transaction-list-pagination"]').should('be.visible');
      // Verifica se a páginação funciona corretamente
      cy.get('[data-test="transaction-list-pagination-next"]').click();
      cy.get('[data-test="transaction-item"]').should('have.length', 10);
    });
  });
});
