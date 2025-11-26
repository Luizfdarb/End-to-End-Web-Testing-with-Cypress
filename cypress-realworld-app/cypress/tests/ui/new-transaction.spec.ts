
/// <reference types="cypress" />

/**
 * Cypress acceptance tests for the "New Transaction" wizard.
 *
 * The wizard is composed of three steps:
 *   1 – Select a contact (users list)
 *   2 – Fill amount/description and choose Pay or Request
 *   3 – Confirmation screen with navigation back to the feed
 *
 * All UI elements are identified by the `data-test` attribute, which makes the
 * selectors stable across UI changes.
 */

describe('New Transaction flow', () => {
  /**
   * Helper – seleciona o primeiro contato da lista de usuários.
   */
  const selectFirstContact = () => {
    // Cada item tem data‑test="user‑list‑item‑<id>"
    cy.get('[data-test^=user-list-item-]').first().click();
  };

  /**
   * Helper – preenche os campos do formulário de criação.
   */
  const fillTransactionForm = ({
    amount = '',
    description = '',
  }: { amount?: string; description?: string }) => {
    if (amount !== undefined) {
      cy.getBySel('transaction-create-amount-input')
        .clear()
        .type(amount);
    }
    if (description !== undefined) {
      cy.getBySel('transaction-create-description-input')
        .clear()
        .type(description);
    }
  };

  /**
   * Helper – clica no botão “Pay”.
   */
  const submitPayment = () => {
    cy.getBySel('transaction-create-submit-payment')
      .should('be.enabled')
      .click();
  };

  /**
   * Helper – clica no botão “Request”.
   */
  const submitRequest = () => {
    cy.getBySel('transaction-create-submit-request')
      .should('be.enabled')
      .click();
  };

  /**
   * Helper – verifica se o snackbar de sucesso foi exibido.
   */
  const assertSuccessSnackbar = () => {
    // O AlertBar usa data‑test="alert-bar-<severity>"
    cy.get('[data-test^=alert-bar-]')
      .should('be.visible')
      .and('contain', 'Transaction Submitted!');
  };

  /**
   * Preparação comum a todos os testes:
   *   - Restaura o seed original.
   *   - Loga o usuário padrão (db4uxOm7d) usando o XState service.
   *   - Navega para a página de criação.
   */
  beforeEach(() => {
    // Restaura o banco de dados de teste.
    cy.task('db:seed');

    // Usuário padrão presente em todos os seeds (password vem do .env → DEFAULT_PASSWORD).
    cy.loginByXstate('db4uxOm7d');

    // Abre o wizard de nova transação.
    cy.visit('/transaction/new');
  });

  /** -------------------------------------------------------------------------
   *  1️⃣ Verifica a estrutura inicial (passo 1 – seleção de contato)
   * -------------------------------------------------------------------------- */
  it('displays the first step with a searchable users list', () => {
    // O componente UsersList possui data‑test="users‑list".
    cy.getBySel('users-list').should('be.visible');

    // O campo de busca também deve estar presente.
    cy.getBySel('user-list-search-input').should('exist');

    // Ao menos um contato deve estar listado.
    cy.get('[data-test^=user-list-item-]').its('length').should('be.gte', 1);
  });

  /** -------------------------------------------------------------------------
   *  2️⃣ Cria uma **payment** e verifica sucesso
   * -------------------------------------------------------------------------- */
  it('creates a payment transaction successfully', () => {
    // — Passo 1: escolher contato
    selectFirstContact();

    // — Passo 2: preencher formulário
    fillTransactionForm({ amount: '25', description: 'Cypress payment' });
    submitPayment();

    // — Passo 3: tela de confirmação
    cy.getBySel('new-transaction-return-to-transactions')
      .should('be.visible')
      .and('contain', 'Return To Transactions');

    // Snackbar de sucesso
    assertSuccessSnackbar();
  });

  /** -------------------------------------------------------------------------
   *  3️⃣ Cria uma **request** e verifica sucesso
   * -------------------------------------------------------------------------- */
  it('creates a request transaction successfully', () => {
    // Passo 1
    selectFirstContact();

    // Passo 2
    fillTransactionForm({ amount: '12', description: 'Cypress request' });
    submitRequest();

    // Passo 3
    cy.getBySel('new-transaction-return-to-transactions')
      .should('be.visible')
      .and('contain', 'Return To Transactions');

    assertSuccessSnackbar();
  });

  /** -------------------------------------------------------------------------
   *  4️⃣ Botão “Pay” deve permanecer desabilitado quando o valor está vazio
   * -------------------------------------------------------------------------- */
  it('disables the Pay button when the amount field is empty', () => {
    selectFirstContact();

    // deixa o campo amount vazio e preenche a descrição (para garantir que só o amount impede)
    fillTransactionForm({ amount: '', description: 'Only description' });

    // O botão Pay deve estar disabled
    cy.getBySel('transaction-create-submit-payment')
      .should('be.disabled');
  });

  /** -------------------------------------------------------------------------
   *  5️⃣ Botão “Request” deve permanecer desabilitado quando a descrição está vazia
   * -------------------------------------------------------------------------- */
  it('disables the Request button when the description field is empty', () => {
    selectFirstContact();

    // Preenche o amount mas deixa a descrição vazia
    fillTransactionForm({ amount: '30', description: '' });

    cy.getBySel('transaction-create-submit-request')
      .should('be.disabled');
  });

  /** -------------------------------------------------------------------------
   *  6️⃣ Após a confirmação, volta à lista e verifica se a transação aparece
   * -------------------------------------------------------------------------- */
  it('returns to the transaction feed and shows the newly created transaction', () => {
    const description = 'Cypress end‑to‑end';

    // Passo 1 → 2 → 3 (payment)
    selectFirstContact();
    fillTransactionForm({ amount: '42', description });
    submitPayment();

    // Confirmação → volta para a lista
    cy.getBySel('new-transaction-return-to-transactions')
      .click();

    // Aguarda o carregamento da lista (skeleton desaparece)
    cy.getBySel('list-skeleton').should('not.exist');

    // Busca na lista algum item que contenha a descrição informada
    cy.get('[data-test^=transaction-item-]')
      .should('contain', description);
  });
});
