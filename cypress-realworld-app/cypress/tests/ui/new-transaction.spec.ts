import cypress from 'cypress';

describe('Nova Transação', () => {
  beforeEach(() => {
    cy.visit('/transaction/new');
  });

  it('Deve criar uma nova transação com sucesso', () => {
    // Criando uma nova transação com montante válido e destino válido
    const transaction = {
      amount: 100.00,
      source: '1234567890',
      description: 'Pagamento de teste',
      receiverId: '9999999999',
      status: 'pending'
    }

    // Realizando a requisição para criar a transação
    cy.request({
      method: 'POST',
      url: '/transactions',
      body: transaction
    }).then((response) => {
      // Verificando se a transação foi criada com sucesso
      expect(response.status).to.equal(201)
      expect(response.body).to.have.property('id')
    })
  })

  it('Deve criar uma nova transação com erro se o montante for inválido', () => {
    // Criando uma nova transação com montante inválido e destino válido
    const transaction = {
      amount: 'abc123',
      source: '1234567890',
      description: 'Pagamento de teste',
      receiverId: '9999999999',
      status: 'pending'
    }

    // Realizando a requisição para criar a transação
    cy.request({
      method: 'POST',
      url: '/transactions',
      body: transaction
    }).then((response) => {
      // Verificando se a transação foi criada com erro
      expect(response.status).to.equal(400)
      expect(response.body).to.have.property('error')
    })
  })

  it('Deve criar uma nova transação com erro se o destino for inválido', () => {
    // Criando uma nova transação com montante válido e destino inválido
    const transaction = {
      amount: 100.00,
      source: '1234567890',
      description: 'Pagamento de teste',
      receiverId: 'abc123',
      status: 'pending'
    }

    // Realizando a requisição para criar a transação
    cy.request({
      method: 'POST',
      url: '/transactions',
      body: transaction
    }).then((response) => {
      // Verificando se a transação foi criada com erro
      expect(response.status).to.equal(400)
      expect(response.body).to.have.property('error')
    })
  })

  it('Deve criar uma transação com sucesso após a criação de uma nova transação', () => {
    // Criando uma nova transação com montante válido e destino válido
    const transaction1 = {
      amount: 100.00,
      source: '1234567890',
      description: 'Pagamento de teste',
      receiverId: '9999999999',
      status: 'pending'
    }

    // Realizando a requisição para criar a primeira transação
    cy.request({
      method: 'POST',
      url: '/transactions',
      body: transaction1
    }).then((response) => {
      // Verificando se a primeira transação foi criada com sucesso
      expect(response.status).to.equal(201)
      expect(response.body).to.have.property('id')

      // Criando uma segunda transação com montante válido e destino válido
      const transaction2 = {
        amount: 200.00,
        source: '9876543210',
        description: 'Pagamento de teste',
        receiverId: '1234567890',
        status: 'pending'
      }

      // Realizando a requisição para criar a segunda transação
      cy.request({
        method: 'POST',
        url: '/transactions',
        body: transaction2
      }).then((response) => {
        // Verificando se a segunda transação foi criada com sucesso
        expect(response.status).to.equal(201)
        expect(response.body).to.have.property('id')
      })
    })
  })

  it('Deve criar uma transação com sucesso após a criação de uma transação existente', () => {
    // Criando uma transação existente com montante válido e destino válido
    const transaction = {
      amount: 100.00,
      source: '1234567890',
      description: 'Pagamento de teste',
      receiverId: '9999999999',
      status: 'pending'
    }

    // Realizando a requisição para criar a transação existente
    cy.request({
      method: 'POST',
      url: '/transactions',
      body: transaction
    }).then((response) => {
      // Verificando se a transação existente foi criada com sucesso
      expect(response.status).to.equal(201)
      expect(response.body).to.have.property('id')

      // Criando uma nova transação com montante válido e destino válido
      const transaction2 = {
        amount: 200.00,
        source: '9876543210',
        description: 'Pagamento de teste',
        receiverId: '1234567890',
        status: 'pending'
      }

      // Realizando a requisição para criar a nova transação
      cy.request({
        method: 'POST',
        url: '/transactions',
        body: transaction2
      }).then((response) => {
        // Verificando se a nova transação foi criada com sucesso
        expect(response.status).to.equal(201)
        expect(response.body).to.have.property('id')
      })
    })
  })

  it('Deve criar uma transação com sucesso quando o usuário está conectado', () => {
    // Conectando o usuário
    cy.loginByApi('username', 'password')

    // Criando uma transação com montante válido e destino válido
    const transaction = {
      amount: 100.00,
      source: '1234567890',
      description: 'Pagamento de teste',
      receiverId: '9999999999',
      status: 'pending'
    }

    // Realizando a requisição para criar a transação
    cy.request({
      method: 'POST',
      url: '/transactions',
      body: transaction
    }).then((response) => {
      // Verificando se a transação foi criada com sucesso
      expect(response.status).to.equal(201)
      expect(response.body).to.have.property('id')
    })
  })
})