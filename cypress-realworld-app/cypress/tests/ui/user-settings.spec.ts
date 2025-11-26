describe('User Settings', () => {
  beforeEach(() => {
    // Limpar o banco de dados e criar um usuário
    cy.request('POST', '/users', {
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@example.com',
      password: 'password123',
    });
  });

  it('carrega a página de configurações do usuário', () => {
    // Carregar a página de configurações do usuário
    cy.visit('/user/settings');

    // Verificar se o título da página está correto
    cy.title().should('eq', 'Configurações do usuário');
  });

  it('atualiza as informações do usuário', () => {
    // Carregar a página de configurações do usuário
    cy.visit('/user/settings');

    // Preencher os campos de formulário
    cy.get('#firstName').type('Jane');
    cy.get('#lastName').type('Doe');
    cy.get('#email').type('janedoe@example.com');

    // Submeter o formulário
    cy.get('#submit').click();

    // Verificar se as informações do usuário foram atualizadas corretamente
    cy.request('GET', '/users/1').then((response) => {
      expect(response.body.firstName).to.eq('Jane');
      expect(response.body.lastName).to.eq('Doe');
      expect(response.body.email).to.eq('janedoe@example.com');
    });
  });

  it('exibe mensagens de erro para campos de formulário inválidos', () => {
    // Carregar a página de configurações do usuário
    cy.visit('/user/settings');

    // Preencher os campos de formulário de forma inválida
    cy.get('#firstName').type('');
    cy.get('#lastName').type('');
    cy.get('#email').type('invalid-email');

    // Submeter o formulário
    cy.get('#submit').click();

    // Verificar se as mensagens de erro são exibidas corretamente
    cy.get('#firstName-error').should('contain', 'O nome é obrigatório');
    cy.get('#lastName-error').should('contain', 'O sobrenome é obrigatório');
    cy.get('#email-error').should('contain', 'O email é inválido');
  });
});
