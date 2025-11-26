describe('Criar Transação', () => {
  beforeEach(() => {
    // configurar o estado inicial do teste
  })

  it('Testar se a página de criação de transação está disponível', () => {
    cy.visit('/transaction/new')
    cy.title().should('eq', 'Criar Transação')
  })

  it('Testar se os campos de entrada estão disponíveis', () => {
    cy.get('[data-test="transaction-create-amount-input"]').should('be.visible')
    cy.get('[data-test="transaction-create-description-input"]').should('be.visible')
  })

  it('Testar se é possível criar uma transação com sucesso', () => {
    cy.get('[data-test="transaction-create-amount-input"]').type('10.00')
    cy.get('[data-test="transaction-create-description-input"]').type('Descrição da transação')
    cy.get('[data-test="transaction-create-submit"]').click()
    cy.wait('@transactionCreated').then((xhr) => {
      expect(xhr.response.body.transactionId).to.be.not.null
    })
  })

  it('Testar se é possível criar uma transação com erro', () => {
    cy.get('[data-test="transaction-create-amount-input"]').type('')
    cy.get('[data-test="transaction-create-description-input"]').type('Descrição da transação')
    cy.get('[data-test="transaction-create-submit"]').click()
    cy.get('[data-test="transaction-create-error-message"]').should('contain', 'Erro ao criar transação')
  })

  it('Testar se é possível cancelar a criação de uma transação', () => {
    cy.get('[data-test="transaction-create-cancel"]').click()
    cy.wait('@transactionCancelled').then((xhr) => {
      expect(xhr.response.body.transactionId).to.be.null
    })
  })

  it('Testar se a transação criada está sendo exibida na lista de transações', () => {
    cy.get('[data-test="transaction-list"]').should('contain', 'Descrição da transação')
  })
})
