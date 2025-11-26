
//.bankaccounts.spec.ts

import { cy, chai, expect } from 'cypress';
import { createBankAccount } from '../../backend/services';
import { BankAccount } from '../../backend/models';

describe('Criando contas bancárias', () => {
  beforeEach(() => {
    cy.visit('/bankaccounts');
  });

  it('cria uma conta bancária com sucesso', () => {
    cy.get('[data-test="bankaccount-form"]').within(() => {
      cy.get('[data-test="bankaccount-bankName-input"]').type('nome da conta bancária');
      cy.get('[data-test="bankaccount-routingNumber-input"]').type('número da conta bancária');
      cy.get('[data-test="bankaccount-accountNumber-input"]').type('número da conta bancária');
      cy.get('[data-test="bankaccount-submit-0"]').click();

      cy.get('[data-test="bankaccount-list"]').within(() => {
        cy.get('[data-test="bankaccount-list-item"]').should('have.length', 1);
      });
    });

    cy.request({
      method: 'GET',
      url: 'http://localhost:3001/bankaccounts',
    }).then((response) => {
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.equal(1);
    });
  });
});

describe('Listando contas bancárias', () => {
  beforeEach(() => {
    cy.visit('/bankaccounts');
  });

  it('lista todas as contas bancárias existentes', () => {
    cy.get('[data-test="bankaccount-list"]').within(() => {
      cy.get('[data-test="bankaccount-list-item"]').should('have.length', 2);
    });

    cy.request({
      method: 'GET',
      url: 'http://localhost:3001/bankaccounts',
    }).then((response) => {
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.equal(2);
    });
  });
});

describe('Excluindo contas bancárias', () => {
  beforeEach(() => {
    cy.visit('/bankaccounts');
  });

  it('exclui uma conta bancária com sucesso', () => {
    cy.get('[data-test="bankaccount-list"]').within(() => {
      cy.get('[data-test="bankaccount-delete-0"]').click();

      cy.get('[data-test="bankaccount-list"]').within(() => {
        cy.get('[data-test="bankaccount-list-item"]').should('have.length', 1);
      });
    });

    cy.request({
      method: 'GET',
      url: 'http://localhost:3001/bankaccounts',
    }).then((response) => {
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.equal(1);
    });
  });
});
