// cypress/tests/ui/auth.spec.ts

/**
 * Testes de aceitação do fluxo de autenticação (sign‑up, login, logout e erro).
 *
 * O arquivo utiliza os comandos customizados definidos em
 * cypress/support/commands.ts:
 *   - cy.getBySel()
 *   - cy.login()
 *   - cy.loginByXstate()
 *   - cy.logoutByXstate()
 *
 * Cada cenário começa com um seed limpo da base de dados (task "db:seed").
 */

describe('Authentication', () => {
  /**
   * Antes de **todos** os cenários, repovoamos a base de dados
   * com os registros padrão definidos em `data/database-seed.json`.
   */
  beforeEach(() => {
    cy.task('db:seed');
  });

  /**
   * -------------------------------------------------------------------------
   * 1️⃣  SIGN‑UP
   * -------------------------------------------------------------------------
   * Verifica se o usuário consegue se cadastrar e, ao final,
   * é redirecionado para a página de login.
   */
  it('allows a new user to sign up', () => {
    // Navega para a tela de cadastro
    cy.visit('/signup');

    // Preenche os campos do formulário
    cy.getBySel('signup-first-name').type('Cypress');
    cy.getBySel('signup-last-name').type('Tester');
    cy.getBySel('signup-username').type('cypress_user');
    cy.getBySel('signup-password').type('Password123');

    // Submete o formulário
    cy.getBySel('signup-submit').click();

    // A aplicação deve redirecionar para /signin
    cy.url().should('include', '/signin');

    // O formulário de login deve estar visível
    cy.getBySel('signin-username').should('be.visible');
    cy.getBySel('signin-password').should('be.visible');
  });

  /**
   * -------------------------------------------------------------------------
   * 2️⃣  LOGIN BEM‑SUCEDIDO
   * -------------------------------------------------------------------------
   * Usa as credenciais padrão da seed (`db4uxOm7d` / defaultPassword).
   * Verifica se o drawer exibe o nome de usuário, indicando que o login
   * ocorreu com sucesso.
   */
  it('allows an existing user to log in with valid credentials', () => {
    // O usuário padrão da seed tem username "db4uxOm7d"
    const username = 'db4uxOm7d';

    // Comando customizado que preenche o formulário e aguarda a resposta
    cy.login(username);

    // Após login a barra lateral (sidenav) deve conter o username
    cy.getBySel('sidenav-username').should('contain', `@${username}`);

    // Opcional: garantir que a URL seja a home ("/")
    cy.location('pathname').should('eq', '/');
  });

  /**
   * -------------------------------------------------------------------------
   * 3️⃣  LOGIN COM ERRO
   * -------------------------------------------------------------------------
   * Tenta fazer login com credenciais inexistentes e verifica a mensagem
   * de erro exibida no alerta.
   */
  it('shows an error message when login fails', () => {
    // Credenciais inválidas
    const wrongUser = 'invalid_user';
    const wrongPass = 'wrong_pass';

    // O comando login já inclui a verificação de requisição,
    // mas não captura o erro. Basta submeter o formulário.
    cy.login(wrongUser, wrongPass);

    // O alerta de erro tem data-test="signin-error"
    cy.getBySel('signin-error')
      .should('be.visible')
      .and('contain', 'Username or password is invalid');
  });

  /**
   * -------------------------------------------------------------------------
   * 4️⃣  LOGOUT
   * -------------------------------------------------------------------------
   * Faz login via XState (bypass UI) e, em seguida,
   * executa o logout usando o comando `cy.logoutByXstate`.
   * Confirma que a aplicação volta para a página de login.
   */
  it('allows a logged‑in user to log out', () => {
    const username = 'db4uxOm7d';

    // Login usando XState (bypass UI)
    cy.loginByXstate(username);

    // Confirma que o drawer mostra o usuário logado
    cy.getBySel('sidenav-username').should('contain', `@${username}`);

    // Executa o logout via XState
    cy.logoutByXstate();

    // Deve ser redirecionado novamente para a tela de login
    cy.url().should('include', '/signin');
    cy.getBySel('signin-submit').should('be.visible');
  });
});