
// cypress/integration/user-settings.spec.ts
import { cy } from "cypress";

describe('User Settings', () => {
  before(() => {
    // Login como usuário
    cy.login('username', 'password');
  });

  it('Should render user settings form', () => {
    // Navegue até a página de configuração do usuário
    cy.visit('/user/settings');
    // Verifique se o formulário foi renderizado corretamente
    cy.get('[data-test="user-settings-form"]').should('exist');
  });

  it('User settings form validations should be triggered',() => {
    // Insira dados inválidos no campo firstName
    cy.get('[data-test="user-settings-firstName-input"]').clear().type('a');    
    // Verifique se a validação é chamada
    cy.get('[data-test="user-settings-firstName-input"]').closest('form').should('have.attr', 'data-cy').and('equal', 'invalid');
    // Insira uma string válida no campo firstName
    cy.get('[data-test="user-settings-firstName-input"]').clear().type('John'); 
    // Verifique se a validação não é chamada
    cy.get('[data-test="user-settings-firstName-input"]').closest('form').should('not.have.attr', 'data-cy').and('equal', 'invalid');

    // Repita o processo para lastName, email e phoneNumber
  });

  it('Should update user profile and verify change in sidebar', () => {
    // Insira dados válidos no formulário
    cy.get('[data-test="user-settings-firstName-input"]').type('João');
    cy.get('[data-test="user-settings-lastName-input"]').type('Silva');
    cy.get('[data-test="user-settings-email-input"]').type('joao.silva@example.com');
    cy.get('[data-test="user-settings-phoneNumber-input"]').type('5511999999999');
    // Insira a senha atual
    cy.get('[data-test="user-settings-password-input"]').type('password');      
    // Submeta o formulário
    cy.get('[data-test="user-settings-submit"]').click();
    // Verifique se o perfil foi atualizado com sucesso
    cy.get('[data-test="sidenav-username"]').should('contain.text', 'João Silva');
    cy.get('[data-test="sidenav-phoneNumber"]').should('contains', '5511 99999-9999');
  });
});
