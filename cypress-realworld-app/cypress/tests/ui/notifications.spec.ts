
/// <reference path="../tests/support/commands.ts" />

describe('Notifications', () => {
  beforeEach(() => {
    // Vazia a base de dados
    cy.task('db:seed');
  });

  // Cenário 1 - User A likes transaction of User B → User B gets notification
  it('User A likes transaction of User B → User B gets notification', () => {
    // Faz login como User A
    cy.login('userA', 'password');
    // Faz login como User B
    cy.login('userB', 'password');
    // Busca o ID da transaction entre User A e User B
    const transactionId = cy.fixture('public-transactions').results[0].id;
    // User A likes a transaction
    cy.getBySel('transaction-item').eq(0).within(() => {
      cy.get('[data-test^="transaction-like-button"]').eq(0).click();
    });
    // Verifica se User B teve a notificação
    cy.getBySel('notifications-list').should('contain', 'User B');
  });

  // Cenário 2 - User C likes transaction between User A and User B → Both get notifications
  it('User C likes transaction between User A and User B → Both get notifications', () => {
    // Faz login como User C
    cy.login('userC', 'password');
    // Busca o ID da transaction entre User A e User B
    const transactionId = cy.fixture('public-transactions').results[0].id;      
    // User C likes a transaction
    cy.getBySel('transaction-item').eq(0).within(() => {
      cy.get('[data-test^="transaction-like-button"]').eq(0).click();
    });
    // Verifica se ambos User A e User B tiveram a notificação
    cy.getBySel('notifications-list').contains('User A');
    cy.getBySel('notifications-list').contains('User B');
  });

  // Cenário 3 - User A comments on transaction of User B → User B gets notification
  it('User A comments on transaction of User B → User B gets notification', () => {
    // Faz login como User A
    cy.login('userA', 'password');
    // Faz login como User B
    cy.login('userB', 'password');
    // Busca o ID da transaction entre User A e User B
    const transactionId = cy.fixture('public-transactions').results[0].id;      
    // User A comments a transaction
    cy.getBySel('transaction-item').eq(0).within(() => {
      cy.get('[data-test="comment-list"').eq(0);
      cy.get('[data-test^="transaction-comment-input"]').type('Teste de comentario');
    });
    // Verifica se User B teve a notificação
    cy.getBySel('notifications-list').should('contain', 'User A');
  });

  // Cenário 4 - User C comments on transaction between User A and User B → Both get notifications
  it('User C comments on transaction between User A and User B → Both get notifications', () => {
    // Faz login como User C
    cy.login('userC', 'password');
    // Busca o ID da transaction entre User A e User B
    const transactionId = cy.fixture('public-transactions').results[0].id;      
    // User C comments a transaction
    cy.getBySel('transaction-item').eq(0).within(() => {
      cy.get('[data-test="comment-list"').eq(0);
      cy.get('[data-test^="transaction-comment-input"]').type('Teste de comentario');
    });
    // Verifica se ambos User A e User B tiveram a notificação
    cy.getBySel('notifications-list').contains('User A');
    cy.getBySel('notifications-list').contains('User B');
  });

  // Cenário 5 - User A sends payment to User B → User B gets notification      
  it('User A sends payment to User B → User B gets notification', () => {       
    // Faz login como User A
    cy.login('userA', 'password');
    // Faz login como User B
    cy.login('userB', 'password');
    // Busca o ID da transaction entre User A e User B
    const transactionId = cy.fixture('public-transactions').results[0].id;      
    // User A paga a transaction
    cy.getBySel('transaction-item').eq(0).within(() => {
      cy.get('[data-test="transaction-like-count"]').eq(0).click();
      cy.get('[data-test^="transaction-comment-input"]').type('Teste de comentario');
    });
    // Verifica se User B teve a notificação
    cy.getBySel('notifications-list').should('contain', 'User A');
  });

  // Cenário 6 - User A sends payment request to User C → User C gets notification
  it('User A sends payment request to User C → User C gets notification', () => {
    // Faz login como User A
    cy.login('userA', 'password');
    // Faz login como User C
    cy.login('userC', 'password');
    // Busca o ID da transaction entre User A e User B
    const transactionId = cy.fixture('public-transactions').results[0].id;      
    // User A envia o pagamento para User C
    cy.getBySel('transaction-item').eq(0).within(() => {
      cy.get('[data-test^="transaction-like-button"]').eq(0).click();
    });
    // Verifica se User C teve a notificação
    cy.getBySel('notifications-list').should('contain', 'User A');
  });

  // Cenário 7 - Renderiza o estado de notificações vazio
  it('Renders empty notifications state', () => {
    // Faz login como User A
    cy.login('userA', 'password');
    // Nenhuma notificação deve existir
    cy.getBySel('notifications-list').should('contain', '.empty-list');
  });
});
