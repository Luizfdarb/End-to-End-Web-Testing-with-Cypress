describe('Autenticação', () => {
  beforeEach(() => {
    // Limpar os dados de autenticação
    cy.clearCookies();
  });

  describe('Cadastro', () => {
    it('deve cadastrar usuário com sucesso', () => {
      // Acessar a página de cadastro
      cy.visit('http://localhost:3000/signup');

      // Preencher o formulário de cadastro
      cy.get('input[name="firstName"]').type('Fulano');
      cy.get('input[name="lastName"]').type('Beltrano');
      cy.get('input[name="username"]').type('fulano');
      cy.get('input[name="email"]').type('fulano@example.com');
      cy.get('input[name="password"]').type('123456');
      cy.get('input[name="confirmPassword"]').type('123456');

      // Enviar o formulário de cadastro
      cy.get('button[type="submit"]').click();

      // Verificar se o usuário é redirecionado para a página de login
      cy.url().should('eq', 'http://localhost:3000/signin');
    });
  });

  describe('Login', () => {
    it('deve logar usuário com sucesso', () => {
      // Acessar a página de login
      cy.visit('http://localhost:3000/signin');

      // Preencher o formulário de login
      cy.get('input[name="username"]').type('fulano');
      cy.get('input[name="password"]').type('123456');

      // Enviar o formulário de login
      cy.get('button[type="submit"]').click();

      // Verificar se o usuário é redirecionado para a página principal
      cy.url().should('eq', 'http://localhost:3000/');
    });
  });

  describe('Logout', () => {
    it('deve deslogar usuário com sucesso', () => {
      // Acessar a página principal
      cy.visit('http://localhost:3000/');

      // Simular o clique no botão de logout
      cy.get('button#logout').click();

      // Verificar se o usuário é redirecionado para a página de login
      cy.url().should('eq', 'http://localhost:3000/signin');
    });
  });

  describe('Erros', () => {
    it('deve exibir mensagem de erro ao tentar logar com dados inválidos', () => {
      // Acessar a página de login
      cy.visit('http://localhost:3000/signin');

      // Preencher o formulário de login com dados inválidos
      cy.get('input[name="username"]').type('invalido');
      cy.get('input[name="password"]').type('invalido');

      // Enviar o formulário de login
      cy.get('button[type="submit"]').click();

      // Verificar se a mensagem de erro é exibida
      cy.get('div#error-message').should('be.visible');
    });
  });
});
