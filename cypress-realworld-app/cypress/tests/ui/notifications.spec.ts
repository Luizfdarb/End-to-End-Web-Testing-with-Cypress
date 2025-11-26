
/// <reference types="cypress" />

import '@4tw/cypress-drag-drop'
import 'cypress-file-upload';

describe('Transaction Feeds Testes', () => {
  before(() => {
    // Garanta que a aplicação esteja carregada antes de iniciar os testes
    cy.visit('/')
  })

  it('1. Toggle navigation drawer (mobile vs desktop)', () => {
    // Verifique se o drawer está fechado em modo mobile
    cy.get('[data-test="sidenav-toggle"]').should('not.be.visible')

    // Verifique se o drawer está aberto em modo desktop
    cy.get('[data-test="sidenav"]').should('be.visible')

    // Alterne entre os modos mobile e desktop
    cy.viewport('iphone-x')
    cy.get('[data-test="sidenav-toggle"]').click()

    cy.viewport('macbook-15')
    cy.get('[data-test="sidenav"]').should('be.visible')
  })

  it('2. Renderizar variações de transaction items (paid, charged, requested)', () => {
    // Verifique se os itens de transação estão sendo renderizados corretamente
    cy.get('[data-test="transaction-item"]').should('have.length', 10)

    // Verifique se os itens de transação possuem os status paid, charged e requested
    cy.get('[data-test="transaction-item"]').each(($el) => {
      cy.wrap($el).should('contain', 'paid')
      cy.wrap($el).should('contain', 'charged')
      cy.wrap($el).should('contain', 'requested')
    })
  })

  it('3. Paginar feed pessoal de transações', () => {
    // Verifique se a paginação está funcionando corretamente
    cy.get('[data-test="transaction-list"]').should('have.length', 10)

    // Verifique se os itens de transação estão sendo carregados ao clicar na próxima página
    cy.get('[data-test="transaction-list-next-page"]').click()
    cy.get('[data-test="transaction-list"]').should('have.length', 20)
  })

  it('4. Paginar feed público de transações', () => {
    // Verifique se a paginação está funcionando corretamente
    cy.get('[data-test="public-transaction-list"]').should('have.length', 10)

    // Verifique se os itens de transação estão sendo carregados ao clicar na próxima página
    cy.get('[data-test="public-transaction-list-next-page"]').click()
    cy.get('[data-test="public-transaction-list"]').should('have.length', 20)
  })

  it('5. Paginar feed de contatos de transações', () => {
    // Verifique se a paginação está funcionando corretamente
    cy.get('[data-test="contact-transaction-list"]').should('have.length', 10)

    // Verifique se os itens de transação estão sendo carregados ao clicar na próxima página
    cy.get('[data-test="contact-transaction-list-next-page"]').click()
    cy.get('[data-test="contact-transaction-list"]').should('have.length', 20)
  })

  it('6. Fechar modal de date range picker (mobile)', () => {
    // Verifique se o modal de date range picker está aberto em modo mobile
    cy.get('[data-test="date-range-picker"]').should('be.visible')

    // Verifique se o modal de date range picker está fechado após clicar no botão de fechar
    cy.get('[data-test="date-range-picker-close"]').click()
    cy.get('[data-test="date-range-picker"]').should('not.be.visible')
  })

  it('7. Filtrar feed pessoal por data', () => {
    // Verifique se o feed pessoal está sendo filtrado corretamente por data
    cy.get('[data-test="transaction-list"]').should('have.length', 10)

    // Verifique se os itens de transação estão sendo carregados após aplicar o filtro de data
    cy.get('[data-test="date-range-filter"]').click()
    cy.get('[data-test="transaction-list"]').should('have.length', 5)
  })

  it('8. Filtrar feed público por data', () => {
    // Verifique se o feed público está sendo filtrado corretamente por data
    cy.get('[data-test="public-transaction-list"]').should('have.length', 10)

    // Verifique se os itens de transação estão sendo carregados após aplicar o filtro de data
    cy.get('[data-test="date-range-filter"]').click()
    cy.get('[data-test="public-transaction-list"]').should('have.length', 5)
  })

  it('9. Filtrar feed de contatos por data', () => {
    // Verifique se o feed de contatos está sendo filtrado corretamente por data
    cy.get('[data-test="contact-transaction-list"]').should('have.length', 10)

    // Verifique se os itens de transação estão sendo carregados após aplicar o filtro de data
    cy.get('[data-test="date-range-filter"]').click()
    cy.get('[data-test="contact-transaction-list"]').should('have.length', 5)
  })

  it('10. Feed pessoal sem transações (data fora do range)', () => {
    // Verifique se o feed pessoal está vazio quando não há transações dentro do range de data
    cy.get('[data-test="transaction-list"]').should('have.length', 0)
  })

  it('11. Feed público sem transações (data fora do range)', () => {
    // Verifique se o feed público está vazio quando não há transações dentro do range de data
    cy.get('[data-test="public-transaction-list"]').should('have.length', 0)
  })

  it('12. Feed de contatos sem transações (data fora do range)', () => {
    // Verifique se o feed de contatos está vazio quando não há transações dentro do range de data
    cy.get('[data-test="contact-transaction-list"]').should('have.length', 0)
  })

  it('13. Filtrar feed pessoal por valor', () => {
    // Verifique se o feed pessoal está sendo filtrado corretamente por valor
    cy.get('[data-test="transaction-list"]').should('have.length', 10)

    // Verifique se os itens de transação estão sendo carregados após aplicar o filtro de valor
    cy.get('[data-test="amount-range-filter"]').click()
    cy.get('[data-test="transaction-list"]').should('have.length', 5)
  })

  it('14. Filtrar feed público por valor', () => {
    // Verifique se o feed público está sendo filtrado corretamente por valor
    cy.get('[data-test="public-transaction-list"]').should('have.length', 10)

    // Verifique se os itens de transação estão sendo carregados após aplicar o filtro de valor
    cy.get('[data-test="amount-range-filter"]').click()
    cy.get('[data-test="public-transaction-list"]').should('have.length', 5)
  })

  it('15. Filtrar feed de contatos por valor', () => {
    // Verifique se o feed de contatos está sendo filtrado corretamente por valor
    cy.get('[data-test="contact-transaction-list"]').should('have.length', 10)

    // Verifique se os itens de transação estão sendo carregados após aplicar o filtro de valor
    cy.get('[data-test="amount-range-filter"]').click()
    cy.get('[data-test="contact-transaction-list"]').should('have.length', 5)
  })

  it('16. Feed pessoal sem transações (valor fora do range)', () => {
    // Verifique se o feed pessoal está vazio quando não há transações dentro do range de valor
    cy.get('[data-test="transaction-list"]').should('have.length', 0)
  })

  it('17. Feed público sem transações (valor fora do range)', () => {
    // Verifique se o feed público está vazio quando não há transações dentro do range de valor
    cy.get('[data-test="public-transaction-list"]').should('have.length', 0)
  })

  it('18. Feed de contatos sem transações (valor fora do range)', () => {
    // Verifique se o feed de contatos está vazio quando não há transações dentro do range de valor
    cy.get('[data-test="contact-transaction-list"]').should('have.length', 0)
  })

  it('19. Feed pessoal mostra apenas transações do usuário', () => {
    // Verifique se o feed pessoal está mostrando apenas transações do usuário
    cy.get('[data-test="transaction-list"]').each(($el) => {
      cy.wrap($el).should('contain', 'paid')
      cy.wrap($el).should('contain', 'charged')
      cy.wrap($el).should('contain', 'requested')
    })
  })

  it('20. Primeiros 5 itens do feed público pertencem a contatos', () => {
    // Verifique se os primeiros 5 itens do feed público pertencem a contatos
    cy.get('[data-test="public-transaction-list"]').each(($el, index) => {
      if (index < 5) {
        cy.wrap($el).should('contain', 'contact')
      }
    })
  })

  it('21. Feed de amigos mostra apenas transações de contatos', () => {
    // Verifique se o feed de amigos está mostrando apenas transações de contatos
    cy.get('[data-test="contact-transaction-list"]').each(($el) => {
      cy.wrap($el).should('contain', 'contact')
    })
  })
})
