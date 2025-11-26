/// <reference types="cypress" />

describe('Notifications', () => {
  beforeEach(() => {
    cy.loginByXstate('testuser', 'testpassword')
  })

  it('Lista de notificações', () => {
    cy.getBySel('notifications-list')
      .should('be.visible')
      .get('li')
      .should('have.length', 5)
  })

  it('Marcar notificação como lida', () => {
    cy.getBySel('notification-item-0')
      .get('button')
      .click()
      .getBySel('notification-item-0')
      .should('have.class', 'read')
  })

  it('Navegação para tela de notificação', () => {
    cy.getBySel('notification-item-0')
      .get('a')
      .click()
      .url()
      .should('contain', 'notification')
  })
})
