
// cypress/tests/ui/user-settings.spec.ts

/* eslint-disable cypress/no-unnecessary-waiting */
/// <reference types="cypress" />

describe('User Settings', () => {
  // -------------------------------------------------------------------------
  // Preparação antes de cada teste
  // -------------------------------------------------------------------------
  beforeEach(() => {
    // 1️⃣  Busca um usuário aleatório na seed
    cy.task('find:database', { entity: 'users', query: {} }).as('seedUser');

    // 2️⃣  Faz login via API usando o usuário encontrado
    cy.get('@seedUser').then((user: any) => {
      cy.loginByApi(user.username).then(() => {
        // 3️⃣  Navega para a tela de configuração do usuário
        cy.visit('/user/settings');
      });
    });
  });

  // -------------------------------------------------------------------------
  // Verifica se o formulário exibe os valores atuais do usuário
  // -------------------------------------------------------------------------
  it('displays current user data in the form fields', () => {
    cy.get('@seedUser').then((user: any) => {
      // Cada campo tem um data-test específico, verifique o valor
      cy.getBySel('user-settings-firstName-input')
        .should('have.value', user.firstName);
      cy.getBySel('user-settings-lastName-input')
        .should('have.value', user.lastName);
      cy.getBySel('user-settings-email-input')
        .should('have.value', user.email);
      cy.getBySel('user-settings-phoneNumber-input')
        .should('have.value', user.phoneNumber);
    });
  });

  // -------------------------------------------------------------------------
  // Atualiza informações do perfil e verifica a persistência
  // -------------------------------------------------------------------------
  it('updates user profile and reflects the changes in the UI', () => {
    cy.get('@seedUser').then((user: any) => {
      const newFirstName = `${user.firstName} Updated`;
      const newLastName  = `${user.lastName} Updated`;
      const newEmail     = `updated-${user.email}`;

      // Intercepta a chamada PATCH que o formulário envia ao backend
      cy.server();
      cy.route('PATCH', '/users/*').as('updateUser');

      // Preenche o formulário com novos valores
      cy.getBySel('user-settings-firstName-input')
        .clear()
        .type(newFirstName);
      cy.getBySel('user-settings-lastName-input')
        .clear()
        .type(newLastName);
      cy.getBySel('user-settings-email-input')
        .clear()
        .type(newEmail);
      // O telefone não será alterado aqui, apenas deixamos como está

      // Submete o formulário
      cy.getBySel('user-settings-submit').click();

      // Aguarda a requisição PATCH e verifica sucesso
      cy.wait('@updateUser').its('status').should('eq', 200);

      // Depois da atualização, o drawer exibe o nome completo do usuário
      // Abra o drawer (o toggle está presente tanto em mobile quanto desktop)
      cy.getBySel('sidenav-toggle').click();

      // O nome exibido deve conter o novo primeiro nome e sobrenome
      cy.getBySel('sidenav-user-full-name')
        .should('contain', newFirstName)
        .and('contain', newLastName);

      // Fecha o drawer para deixar o estado limpo
      cy.getBySel('sidenav-toggle').click();
    });
  });
});
