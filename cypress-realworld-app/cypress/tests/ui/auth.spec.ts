// cypress-realworld-app/cypress/tests/ui/auth.spec.ts

describe('Auth', () => {
  beforeEach(() => {
    // Reset database or seed with test data if needed
    // cy.task('db:seed');
  });

  it('cadastra novo usuário com sucesso', () => {
    const user = {
      firstName: 'Novo',
      lastName: 'Usuario',
      username: 'novousuario',
      password: 'novasenha',
    };

    cy.visit('/signup');
    cy.getBySel('signup-first-name').type(user.firstName);
    cy.getBySel('signup-last-name').type(user.lastName);
    cy.getBySel('signup-username').type(user.username);
    cy.getBySel('signup-password').type(user.password);
    cy.getBySel('signup-confirmPassword').type(user.password);
    cy.getBySel('signup-submit').click();

    cy.url().should('contain', '/signin');
  });

  it('loga com credenciais válidas', () => {
    const user = {
      username: Cypress.env('defaultUserUsername'),
      password: Cypress.env('defaultUserPassword'),
    };

    cy.visit('/signin');
    cy.getBySel('signin-username').type(user.username);
    cy.getBySel('signin-password').type(user.password);
    cy.getBySel('signin-submit').click();

    cy.url().should('contain', '/');
  });

  it('exibe mensagem de erro com credenciais inválidas', () => {
    const user = {
      username: 'usernameinvalido',
      password: 'passwordinvalida',
    };

    cy.visit('/signin');
    cy.getBySel('signin-username').type(user.username);
    cy.getBySel('signin-password').type(user.password);
    cy.getBySel('signin-submit').click();

    cy.getBySel('signin-error').should('be.visible');
  });

  it('realiza logout com sucesso', () => {
    cy.loginByXstate(Cypress.env('defaultUserUsername'), Cypress.env('defaultUserPassword'));
    cy.getBySel('sidenav-toggle').click();
    cy.getBySel('sidenav-signout').click();

    cy.url().should('contain', '/signin');
  });
});