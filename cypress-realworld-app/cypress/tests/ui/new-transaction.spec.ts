
/// <reference types="cypress" />

describe('Novas transações', () => {
  // Cenário 1: Criar transação completa (payment) com contato existente
  it(' Criar transação completa (payment) com contato existente', () => {
    // Preparação
    cy.loginByXstate('username', 'password')
    cy.visit('/transaction/new')

    // Ação
    cy.get('[data-test="transaction-create-submit-payment"]').click()
    cy.get('[data-test="transaction-create-amount-input"]').type('10.00')
    cy.get('[data-test="transaction-create-description-input"]').type('Transaction description')
    cy.get('[data-test="transaction-create-submit-button"]').click()

    // Verificação
    cy.get('[data-test="transaction-create-result"]').should('contain', 'Transaction created successfully')
  })

  // Cenário 2: Criar transação completa (request) com contato existente
  it('Criar transação completa (request) com contato existente', () => {
    // Preparação
    cy.loginByXstate('username', 'password')
    cy.visit('/transaction/new')

    // Ação
    cy.get('[data-test="transaction-create-submit-request"]').click()
    cy.get('[data-test="transaction-create-amount-input"]').type('10.00')
    cy.get('[data-test="transaction-create-description-input"]').type('Transaction description')
    cy.get('[data-test="transaction-create-submit-button"]').click()

    // Verificação
    cy.get('[data-test="transaction-create-result"]').should('contain', 'Transaction created successfully')
  })

  // Cenário 3: Criar transação com novo contato (search + add)
  it('Criar transação com novo contato (search + add)', () => {
    // Preparação
    cy.loginByXstate('username', 'password')
    cy.visit('/transaction/new')

    // Ação
    cy.get('[data-test="user-list-search-input"]').type('Novo contato')
    cy.get('[data-test="user-list-add-button"]').click()
    cy.get('[data-test="transaction-create-submit-payment"]').click()
    cy.get('[data-test="transaction-create-amount-input"]').type('10.00')
    cy.get('[data-test="transaction-create-description-input"]').type('Transaction description')
    cy.get('[data-test="transaction-create-submit-button"]').click()

    // Verificação
    cy.get('[data-test="transaction-create-result"]').should('contain', 'Transaction created successfully')
  })

  // Cenário 4: Validações step 1 (contato obrigatório + botão disabled)
  it('Validações step 1 (contato obrigatório + botão disabled)', () => {
    // Preparação
    cy.loginByXstate('username', 'password')
    cy.visit('/transaction/new')

    // Ação
    cy.get('[data-test="transaction-create-submit-payment"]').click()

    // Verificação
    cy.get('[data-test="transaction-create-submit-button"]').should('be.disabled')
  })

  // Cenário 5: Validações step 2 (valor + descrição obrigatórios)
  it('Validações step 2 (valor + descrição obrigatórios)', () => {
    // Preparação
    cy.loginByXstate('username', 'password')
    cy.visit('/transaction/new')

    // Ação
    cy.get('[data-test="transaction-create-submit-payment"]').click()
    cy.get('[data-test="transaction-create-submit-button"]').click()

    // Verificação
    cy.get('[data-test="transaction-create-error-message"]').should('contain', 'Valor e descrição são obrigatórios')       
  })

  // Cenário 6: Cancelar transação em qualquer step
  it('Cancelar transação em qualquer step', () => {
    // Preparação
    cy.loginByXstate('username', 'password')
    cy.visit('/transaction/new')

    // Ação
    cy.get('[data-test="transaction-create-cancel-button"]').click()

    // Verificação
    cy.url().should('eq', Cypress.config().baseUrl)
  })

  // Cenário 7: Transação com valor máximo e mínimo
  it('Transação com valor máximo e mínimo', () => {
    // Preparação
    cy.loginByXstate('username', 'password')
    cy.visit('/transaction/new')

    // Ação
    cy.get('[data-test="transaction-create-submit-payment"]').click()
    cy.get('[data-test="transaction-create-amount-input"]').type('10000.00')
    cy.get('[data-test="transaction-create-description-input"]').type('Transaction description')
    cy.get('[data-test="transaction-create-submit-button"]').click()

    // Verificação
    cy.get('[data-test="transaction-create-result"]').should('contain', 'Transaction created successfully')
  })
})
