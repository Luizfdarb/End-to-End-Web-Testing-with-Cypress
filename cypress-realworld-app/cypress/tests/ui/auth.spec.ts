/// <reference types="cypress" />

context('Autenticação', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.visit('http://localhost:3000');
  });

  // cenário 1: redirecionamento não autenticado
  it('deveria redirecionar para a tela de login quando acessar a área pessoal sem estar autenticado', () => {
    cy.get('[data-test="nav-personal-tab"]').click();
    cy.url().should('contain', '/signin');
  });

  // cenário 2: login com remember me e verificar cookie de segurança
  it('deveria salvar as credenciais e criar um cookie de segurança ao realizar login com remember me', () => {
    cy.get('[data-test="signin-username"]').type('usertest');
    cy.get('[data-test="signin-password"]').type('testpass');
    cy.get('[data-test="signin-submit"]').click();

    cy.get('[data-test="sidenav-toggle"]').should('be.enabled');
    cy.wait('@loginUser').then((loginUser: any) => {
      const userId = loginUser.response.body.user?.id;
      cy.loginByXstate(`usertest-${userId}`, 'testpass');

      cy.get('[data-test="sidenav-toggle"]').click();
      cy.get('[data-test="sidenav-username"]').contains('usertest');

      cy.clearCookies();
      cy.get('[data-test="nav-top-notifications-count"]').should('be.empty');
    });
  });

  // cenário 3: signup completo e onboarding
  it('deveria permitir que um novo usuário se cadistre e complete o onboarding', () => {
    cy.visit('/signin');
    cy.get('[data-test="signup"]').click();
    cy.frameLoaded('[data-test="signup-frame"]').then(() => {
      cy.get('[data-test="signup-first-name"]').type('Fulano');
      cy.get('[data-test="signup-last-name"]').type('Silva');
      cy.get('[data-test="signup-username"]').type('username123');
      cy.get('[data-test="signup-password"]').type('password123');
      cy.get('[data-test="signup-confirmPassword"]').type('password123');
      cy.get('[data-test="signup-submit"]').click();

      // o usuário é redirecionado para a área pessoal após o signup
      cy.url().should('not.contain', '/signin');
      cy.get('[data-test="nav-transaction-tabs"]').should('be.visible');
    });
  });

  // cenário 4: validações login
  it('deveria exibir erros de validação para os campos obrigatórios de login', () => {
    cy.get('[data-test="signin-username"]').type('');
    cy.get('[data-test="signin-last-name"]').focus();
    cy.get('[data-test="signin-last-name"]').blur();
    cy.get('[data-test="signin-username-error"]').should('be.visible');
    cy.get('[data-test="signin-password"]').type('');
    cy.get('[data-test="signin-password-error"]').should('be.visible');
  });

  // cenário 5: validações signup
  it('deveria exibir erros de validação para os campos obrigatórios e password mismatch', () => {
    cy.visit('/signup');
    cy.get('[data-test="signup-username"]').type('username123');
    cy.get('[data-test="signup-username"]').blur();
    cy.get('[data-test="signup-last-name"]').type('Silva');
    cy.get('[data-test="signup-last-name"]').blur();
    cy.get('[data-test="signup-first-name"]').type('Fulano');
    cy.get('[data-test="signup-first-name"]').blur();
    cy.get('[data-test="signup-password"]').type('password123');
    cy.get('[data-test="signup-password"]').blur();
    cy.get('[data-test="signup-confirmPassword"]').type('contrasena');
    cy.get('[data-test="signup-confirmPassword-error"]').should('be.visible');
    cy.get('[data-test="signup-last-name"]').type('Silva');
    cy.get('[data-test="signup-last-name"]').blur();
    cy.get('[data-test="signup-last-name-error"]').should('be.visible');
    cy.get('[data-test="signup-first-name"]').type('Fulano');
    cy.get('[data-test="signup-first-name"]').blur();
    cy.get('[data-test="signup-first-name-error"]').should('be.visible');
  });

  // cenário 6: erro de credenciais inválidas
  it('deveria exibir mensagem de erro de credenciais inválidas', () => {
    cy.visit('/signin');
    cy.get('[data-test="signin-username"]').type('usertest123');
    cy.get('[data-test="signin-password"]').type('contrasena');
    cy.get('[data-test="signin-submit"]').click();
    cy.get('[data-test="signin-error"]').should('be.visible');
  });

  // cenário 7: erro de senhas diferentes
  it('deveria exibir mensagem de erro de senhas diferentes', () => {
    cy.visit('/signin');
    cy.get('[data-test="signin-username"]').type('usertest');
    cy.get('[data-test="signin-password"]').type('contrasena123');
    cy.get('[data-test="signin-confirmPassword"]').focus();
    cy.get('[data-test="signin-confirmPassword"]').type('contrasena');
    cy.get('[data-test="signin-confirmPassword"]').blur();
    cy.get('[data-test="signin-password"]').type('contrasena123');
    cy.get('[data-test="signin-submit"]').click();
    cy.get('[data-test="signin-password"]').should('contain', 'Password does not match');
  });
});