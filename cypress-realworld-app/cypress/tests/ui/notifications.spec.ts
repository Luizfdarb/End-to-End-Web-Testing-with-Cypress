// cypress-realworld-app/cypress/tests/ui/notifications.spec.ts

describe('Notifications', () => {
  beforeEach(() => {
    cy.loginByXstate('username', 'password');
    cy.visit('/notifications');
  });

  it('deve exibir notificações', () => {
    cy.getBySel('notifications-list').should('be.visible');
    cy.getBySelLike('notification-list-item').should('have.length.greaterThan', 0);
  });

  it('deve marcar notificação como lida', () => {
    cy.getBySelLike('notification-mark-read').first().click();
    cy.getBySelLike('notification-list-item').should('have.length.less lessThan');
  });

  // Implementar mais testes de acordo com a necessidade
});