
/// <reference types="cypress" />

describe('Testes de contas bancárias', () => {
  beforeEach(() => {
    cy.loginByXstate('username', 'password')
  })

  it('Criar nova conta bancária completa', () => {
    cy.visit('/bankaccounts/new')
    cy.get('[data-test="bankaccount-bankName-input"]').type('Banco Teste')
    cy.get('[data-test="bankaccount-routingNumber-input"]').type('123456789')
    cy.get('[data-test="bankaccount-accountNumber-input"]').type('1234567890')
    cy.get('[data-test="bankaccount-submit"]').click()
    cy.wait('@bankaccount')
    cy.get('[data-test="bankaccount-list"]').should('contain', 'Banco Teste')
  })

  it('Validações detalhadas de formulário', () => {
    cy.visit('/bankaccounts/new')
    cy.get('[data-test="bankaccount-bankName-input"]').type(' ')
    cy.get('[data-test="bankaccount-routingNumber-input"]').type('12345678')
    cy.get('[data-test="bankaccount-accountNumber-input"]').type('123456789')
    cy.get('[data-test="bankaccount-submit"]').click()
    cy.get('[data-test="bankaccount-bankName-input"]').should('have.attr', 'aria-invalid', 'true')
    cy.get('[data-test="bankaccount-routingNumber-input"]').should('have.attr', 'aria-invalid', 'true')
    cy.get('[data-test="bankaccount-accountNumber-input"]').should('have.attr', 'aria-invalid', 'true')
  })

  it('Soft delete de conta bancária existente', () => {
    cy.visit('/bankaccounts')
    cy.get('[data-test="bankaccount-delete"]').click()
    cy.get('[data-test="bankaccount-list"]').should('not.contain', 'Banco Teste')
  })

  it('Estado vazio da lista + modal onboarding', () => {
    cy.visit('/bankaccounts')
    cy.get('[data-test="empty-list-header"]').should('contain', 'No Bank Accounts')
    cy.get('[data-test="bankaccount-new"]').click()
    cy.get('[data-test="user-onboarding-dialog-title"]').should('contain', 'Get Started with Real World App')
    cy.get('[data-test="user-onboarding-dialog-content"]').should('contain', 'Real World App requires a Bank Account to perform transactions.')
  })
})
