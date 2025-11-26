describe('Transaction View', () => {
  const TRANSACTION_ID = 'transação-id';
  const TRANSACTION_VIEW_PAGE = 'transaction-view-page';
  const TRANSACTION_DETAIL = 'transaction-detail';

  beforeEach(() => {
    loginByApi();
    cy.visit(`/${TRANSACTION_VIEW_PAGE}`);
    cy.get(`[@data-test=${TRANSACTION_DETAIL}]`).should('contain', `Descrição da transação`);
  });

  it('detalhes da transação', () => {
    cy.get(`[@data-test=${TRANSACTION_DETAIL}]`).should('contain', `Descrição da transação`);
  });

  it('likes da transação', () => {
    cy.get(`[@data-test=like-${TRANSACTION_ID}]`).should('contain', `Like da transação`);
  });

  it('comentários da transação', () => {
    cy.get(`[@data-test=comment-${TRANSACTION_ID}]`).should('contain', `Comentário da transação`);
  });

  it('aceitação/rejeição da transação', () => {
    cy.get(`[@data-test=accept-${TRANSACTION_ID}]`).click().then(() => {
      cy.get(`[@data-test=reject-${TRANSACTION_ID}]`).click();
    });
  });
});