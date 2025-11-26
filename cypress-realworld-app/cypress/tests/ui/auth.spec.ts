
/// <reference types="cypress" />

import faker from 'faker';

describe('Auth', () => {
  /* --------------------------------------------------------------------------
   *  Antes de cada teste, re‑seedeamos o banco de dados para garantir
   *  um estado consistente e conhecido.
   * --------------------------------------------------------------------------*/
  beforeEach(() => {
    cy.task('db:seed');
  });

  /* --------------------------------------------------------------------------
   *  Utilitário para pegar o primeiro usuário criado na seed.  Todos os
   *  usuários possuem a mesma senha padrão definida em SEED_DEFAULT_USER_PASSWORD.
   * --------------------------------------------------------------------------*/
  const getFirstUser = () =>
    cy.task('filter:database', { entity: 'users', query: {} }).then(users => users[0]);

  /* --------------------------------------------------------------------------
   *  1️⃣ Flow de Sign‑Up
   * --------------------------------------------------------------------------*/
  context('Signup', () => {
    it('deve cadastrar um usuário novo e fazer login', () => {
      /* ----- Geração de dados dinâmicos --------------------------- */
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const username = faker.internet.userName();
      const password = Cypress.env('defaultPassword');

      /* ----- Navega para a página de cadastro -------------------- */
      cy.visit('/signup');

      /* ----- Preenche o formulário --------------------------------- */
      cy.getBySel('signup-first-name').type(firstName);
      cy.getBySel('signup-last-name').type(lastName);
      cy.getBySel('signup-username').type(username);
      cy.getBySel('signup-password').type(password);
      cy.getBySel('signup-confirmPassword').type(password);

      /* ----- Submete ------------------------------------------------ */
      cy.getBySel('signup-submit').click();

      /* ----- Aguardando redirecionamento para a página de login ------------- */
      cy.url().should('include', '/signin');

      /* ----- Faz login com o usuário recém‑criado --------------------- */
      cy.login(username, password);

      /* ----- Verifica que o botão “New Transaction” está visível --------- */
      cy.getBySel('nav-top-new-transaction').should('be.visible');
    });
  });

  /* --------------------------------------------------------------------------
   *  2️⃣ Flow de Login / Logout e tratamento de erros
   * --------------------------------------------------------------------------*/
  context('Login', () => {
    it('deve fazer login de um usuário existente', () => {
      getFirstUser().then(user => {
        const username = user.username;
        cy.visit('/signin');
        cy.login(username, Cypress.env('defaultPassword'));

        /* ----- Verifica que a barra de navegação aparece -------------- */
        cy.getBySel('nav-top-new-transaction').should('be.visible');

        /* ----- Clica no botão “New” e verifica a rota ---------------- */
        cy.getBySel('nav-top-new-transaction').click();
        cy.url().should('include', '/transaction/new');
      });
    });

    it('deve exibir erro quando as credenciais são inválidas', () => {
      getFirstUser().then(user => {
        const username = user.username;
        cy.visit('/signin');

        /* ----------------------------------------------------------------
         *  Configura intercepts para o login.  Assim podemos aguardar a
         *  chamada API e verificar que a mensagem de erro é exibida.
         * ---------------------------------------------------------------- */
        cy.server();
        cy.route('POST', '/login').as('loginUser');
        cy.route('GET', '/checkAuth').as('getUserProfile');

        cy.getBySel('signin-username').type(username);
        cy.getBySel('signin-password').type('wrongpassword');
        cy.getBySel('signin-submit').click();

        /* ----------------------------------------------------------------
         *  Espera o request terminar e então verifica o alerta de erro.
         * ---------------------------------------------------------------- */
        cy.wait('@loginUser').then(() => {
          cy.getBySel('signin-error')
            .should('be.visible')
            .and('contain', 'Username or password');
        });
      });
    });

    it('deve fazer logout e voltar à página de login', () => {
      getFirstUser().then(user => {
        const username = user.username;
        cy.visit('/signin');
        cy.login(username, Cypress.env('defaultPassword'));

        /* ----- Clica na opção “Logout” no drawer ---------------------- */
        cy.getBySel('sidenav-signout').click();

        /* ----- Verifica que o formulário de login aparece novamente ------- */
        cy.getBySel('signin-submit').should('be.visible');

        /* ----- Garantir que a barra de navegação não está mais visível ----- */
        cy.getBySel('nav-top-new-transaction').should('not.exist');
      });
    });
  });
});
