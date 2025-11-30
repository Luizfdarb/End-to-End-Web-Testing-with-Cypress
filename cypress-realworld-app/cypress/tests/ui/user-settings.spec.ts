/// <reference types="cypress" />

describe('User Settings', () => {
  beforeEach(() => {
    cy.loginByXstate('username', 'password');
    cy.visit('/user/settings');
  });

  it('should update user profile successfully', () => {
    cy.getBySel('user-settings-firstName-input').clear().type('Novo Nome');
    cy.getBySel('user-settings-lastName-input').clear().type('Novo Sobrenome');
    cy.getBySel('user-settings-email-input').clear().type('novoemail@example.com');
    cy.getBySel('user-settings-phoneNumber-input').clear().type('1234567890');
    cy.getBySel('user-settings-submit').click();
    cy.getBySel('alert-bar-success').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.getBySel('user-settings-firstName-input').clear();
    cy.getBySel('user-settings-lastName-input').clear();
    cy.getBySel('user-settings-email-input').clear();
    cy.getBySel('user-settings-phoneNumber-input').clear();
    cy.getBySel('user-settings-submit').click();
    cy.get('input:invalid').should('have.length', 4);
  });

  it('should show validation error for invalid email', () => {
    cy.getBySel('user-settings-email-input').clear().type('invalid-email');
    cy.getBySel('user-settings-submit').click();
    cy.get('input:invalid').should('have.length', 1);
  });

  it('should show validation error for invalid phone number', () => {
    cy.getBySel('user-settings-phoneNumber-input').clear().type('invalid-phone');
    cy.getBySel('user-settings-submit').click();
    cy.get('input:invalid').should('have.length', 1);
  });
});
