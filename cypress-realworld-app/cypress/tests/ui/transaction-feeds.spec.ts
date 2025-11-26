
/// <reference types="cypress" />

/**
 * Cypress acceptance test – Transaction Feeds
 * -------------------------------------------------
 * This spec validates:
 *   1. Public feed loads by default
 *   2. Navigation to Contacts and Personal tabs
 *   3. Amount‑range filter works
 *   4. Infinite‑scroll pagination loads the next page
 *
 * Custom commands used (see cypress/support/commands.ts):
 *   - cy.task('db:seed')
 *   - cy.database('find', 'users')
 *   - cy.loginByApi(username, password)
 *   - cy.setTransactionAmountRange(min, max)
 *   - cy.nextTransactionFeedPage(service, page)
 *
 * All selectors are based on the `data-test` attributes present
 * in the source code.
 */

describe('Transaction Feeds', () => {
  /** --------------------------------------------------------------------
   *  BEFORE EACH
   * -------------------------------------------------------------------- */
  beforeEach(() => {
    // 1️⃣  Resetar o banco de dados
    cy.task('db:seed');

    // 2️⃣  Recuperar um usuário existente (primeiro registro)
    cy.database('find', 'users').then((user) => {
      // 3️⃣  Login rápido via API (usa a senha padrão configurada no .env)
      cy.loginByApi(user.username, Cypress.env('defaultPassword'));

      // 4️⃣  Abrir a aplicação – o feed público é a rota padrão
      cy.visit('/');
    });

    // Garantir que as abas de navegação foram renderizadas
    cy.get('[data-test=nav-transaction-tabs]').should('be.visible');
  });

  /** --------------------------------------------------------------------
   *  1️⃣  PUBLIC FEED – carregado por padrão
   * -------------------------------------------------------------------- */
  it('displays the public transaction feed by default', () => {
    // O feed público usa o componente TransactionList → lista de itens
    cy.get('[data-test^=transaction-item-]').should('have.length.greaterThan', 0);
  });

  /** --------------------------------------------------------------------
   *  2️⃣  CONTACTS TAB
   * -------------------------------------------------------------------- */
  it('shows contacts transactions when the Contacts tab is selected', () => {
    // Clicar na aba "Friends" (contacts)
    cy.get('[data-test=nav-contacts-tab]').click();

    // Aguarda a lista ser preenchida
    cy.get('[data-test^=transaction-item-]').should('have.length.greaterThan', 0);
  });

  /** --------------------------------------------------------------------
   *  3️⃣  PERSONAL TAB
   * -------------------------------------------------------------------- */
  it('shows personal transactions when the Personal tab is selected', () => {
    // Clicar na aba "Mine" (personal)
    cy.get('[data-test=nav-personal-tab]').click();

    // Verifica que há itens
    cy.get('[data-test^=transaction-item-]').should('have.length.greaterThan', 0);
  });

  /** --------------------------------------------------------------------
   *  4️⃣  AMOUNT‑RANGE FILTER
   * -------------------------------------------------------------------- */
  it('filters transactions by amount range', () => {
    // Contar itens antes de aplicar o filtro
    cy.get('[data-test^=transaction-item-]')
      .its('length')
      .as('itemsBefore');

    // Abrir o filtro de valor (chip) e definir intervalo 0‑30 (valor interno *1000)
    cy.get('[data-test=transaction-list-filter-amount-range-button]').click();
    // O comando customizado dispara o onChange do Slider interno
    cy.setTransactionAmountRange(0, 30);

    // O filtro dispara a busca; esperamos que a lista seja atualizada
    // e que o número de itens seja **menor ou igual** ao anterior
  /** --------------------------------------------------------------------
   *  5️⃣  INFINITE SCROLL – next page of public feed
   * -------------------------------------------------------------------- */
  it('loads the next page of the public feed via infinite scroll', () => {
    cy.get('[data-test^=transaction-item-]')
      .its('length')
      .as('firstPageCount');

    // Acionar a máquina do feed público para buscar a página 2
    // O comando utiliza a referência `window.publicTransactionService`
    cy.nextTransactionFeedPage('publicTransactionService', 2);

    // Esperar que a lista seja atualizada e que o total de itens aumente
    cy.get('@firstPageCount').then((firstCount) => {
      cy.get('[data-test^=transaction-item-]')
        .its('length')
        .should('be.gt', firstCount);
    });
  });
});
