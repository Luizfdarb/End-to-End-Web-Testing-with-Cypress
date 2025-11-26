import 'cypress';
import 'react';

// Tipos e constantes
const senderAccountId = '1';
const receiverAccountId = '2';
const transferAmount = '500';
const requestAmount = '500';

describe('Testa a transação de pagamentos', () => {
  beforeEach(() => {
    // beforeEach para criar uma nova conta antes de cada teste
    cy.request('POST', 'http://localhost:3003/api/accounts', {
      balance: 1000,
      ownerId: '1',
    });
  });

  it('Testa se a transação é efetuada corretamente', () => {
    // Fazer a transação de pagamento
    cy.request('POST', `http://localhost:3003/api/transactions`, {
      id: 'tx-1',
      source: 'acc-1',
      amount: transferAmount,
      description: 'Pagamento de conta',
      receiverId: receiverAccountId,
      senderId: senderAccountId,
      privacyLevel: 'public',
    }).then((response) => {
      const transactionId = response.body.id;

      // Verificar se o valor da transação foi atualizado corretamente
      cy.request('GET', `http://localhost:3003/api/accounts/${senderAccountId}`).then((accountResponse) => {
        expect(accountResponse.body.balance).to.equal('500');
      });

      // Verificar se a conta do destinatário foi atualizada corretamente
      cy.request('GET', `http://localhost:3003/api/accounts/${receiverAccountId}`).then((accountResponse) => {
        expect(accountResponse.body.balance).to.equal('500');
      });
    });
  });
});

describe('Testa a transação de solicitação de dinheiro', () => {
  beforeEach(() => {
    // beforeEach para criar uma nova conta antes de cada teste
    cy.request('POST', 'http://localhost:3003/api/accounts', {
      balance: 1000,
      ownerId: '1',
    });
  });

  it('Testa se a solicitação de dinheiro é efetuada corretamente', () => {
    // Fazer a solicitação de dinheiro
    cy.request('POST', `http://localhost:3003/api/requests`, {
      id: 'req-1',
      source: 'acc-1',
      amount: requestAmount,
      description: 'Solicitação de dinheiro',
      receiverId: receiverAccountId,
      senderId: senderAccountId,
      privacyLevel: 'public',
    }).then((response) => {
      const requestId = response.body.id;

      // Verificar se o valor da solicitação foi atualizado corretamente
      cy.request('GET', `http://localhost:3003/api/accounts/${senderAccountId}`).then((accountResponse) => {
        expect(accountResponse.body.balance).to.equal('500');
      });

      // Verificar se a conta do solicitante foi atualizada corretamente
      cy.request('GET', `http://localhost:3003/api/accounts/${receiverAccountId}`).then((accountResponse) => {
        expect(accountResponse.body.balance).to.equal('500');
      });
    });
  });
});