
// cypress/tests/ui/transaction-view.spec.ts
//
// Cypress e2e test suite for the *Transaction View* page.
// It contains 6 scenarios that exercise the UI behaviour described
// in the “CENÁRIOS OBRIGATÓRIOS” section.
//
// ──────────────────────────────────────────────────────────────
//   1. Navigation tabs hidden on transaction page
//   2. Like a transaction – check count and button disabled
//   3. Add multiple comments – all comments are rendered
//   4. Accept a transaction request – button disappears
//   5. Reject a transaction request – button disappears
//   6. For a completed transaction – accept/reject buttons are not present
//
// The tests are written in TypeScript and rely on the custom Cypress
// commands defined in `src/support/commands.ts`.
//
// The test flow is completely self‑contained – it creates its own
// users, bank accounts and transactions via the API, then
// navigates to the UI. All data is isolated per test so that
// the tests do not interfere with each other.
//
// ──────────────────────────────────────────────────────────────
import { faker } from '@faker-js/faker';

const DEFAULT_PASSWORD = Cypress.env('defaultPassword');
const API_URL = Cypress.env('apiUrl');

// --------------------------------------------------------------
// Helpers
// --------------------------------------------------------------

/**
 * Create a new user via the public `/users` endpoint.
 * Returns the full user object that was returned by the API.
 */
const createUser = (username: string) => {
  const user: any = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastLastName(),
    username,
    password: DEFAULT_PASSWORD,
    email: faker.internet.email(),
    phoneNumber: faker.phone.phoneNumber(),
    balance: faker.datatype.number({ min: 1000, max: 2000 }),
    avatar: `https://avatars.dicebear.com/api/human/${username}.svg`,
    defaultPrivacyLevel: 'public',
  };
  return cy.request({
    method: 'POST',
    url: `${API_URL}/users`,
    body: user,
  }).then((resp) => resp.body);
};

/**
 * Login via the API – stores the session cookie.
 */
const loginByApi = (username: string) => {
  return cy.loginByApi(username, DEFAULT_PASSWORD);
};

/**
 * Create a bank account for a user that is already logged in.
 * Returns the account object.
 */
const createBankAccount = (userId: string) => {
  const account = {
    bankName: `${faker.company.name()} Bank`,
    accountNumber: faker.finance.account(10),
    routingNumber: faker.finance.account(9),
  };
  return cy.request({
    method: 'POST',
    url: `${API_URL}/bankAccounts`,
    body: { ...account, userId },
  }).then((resp) => resp.body.account);
};

/**
 * Create a transaction (payment or request) from the logged‑in user
 * to the supplied receiver. Returns the transaction object.
 */
const createTransaction = (
  type: 'payment' | 'request',
  receiverId: string,
  sourceId: string,
  amount = faker.datatype.number({ min: 1000, max: 5000 })
) => {
  const payload = {
    transactionType: type,
    receiverId,
    description: `${type === 'payment' ? 'Payment' : 'Request'}: ${receiverId}`,
    amount: amount.toString(),
    privacyLevel: 'public',
    source: sourceId,
  };
  return cy.request({
    method: 'POST',
    url: `${API_URL}/transactions`,
    body: payload,
  }).then((resp) => resp.body.transaction);
};

/**
 * Create multiple comments for a transaction.
 */
const createComments = (transactionId: string, count = 3) => {
  const comments = [];
  for (let i = 0; i < count; i++) {
    comments.push(
      cy.request({
        method: 'POST',
        url: `${API_URL}/comments/${transactionId}`,
        body: { content: faker.lorem.sentence() },
      })
    );
  }
  return Promise.all(comments).then(() => {});
};

const transactionViewUrl = (id: string) => `/transaction/${id}`;

// --------------------------------------------------------------
// Test suite
// --------------------------------------------------------------
describe('Transaction View – UI Behaviour', () => {
  // ----------------------------------------------------------
  // 1. Navigation tabs hidden on transaction view
  // ----------------------------------------------------------
  it('Navigation tabs should be hidden on the transaction detail page', () => {
    // Create two users and a transaction
    const userA = `user-${faker.datatype.uuid().slice(0, 8)}`;
    const userB = `user-${faker.datatype.uuid().slice(0, 8)}`;

    // User A
    createUser(userA).then((uA) =>
      loginByApi(userA).then(() =>
        createBankAccount(uA.id).then((bankAcc) =>
          createUser(userB).then((uB) =>
            createTransaction('payment', uB.id, bankAcc.id).then((txn) => {
              // Visit the transaction view
              cy.visit(transactionViewUrl(txn.id));

              // Tabs are not rendered
              cy.get('[data-test="nav-transaction-tabs"]')
                .should('not.exist')
                .and('not.be.visible');
            })
          )
        )
      )
    );
  });

  // ----------------------------------------------------------
  // 2. Like a transaction + verify count + button disabled
  // ----------------------------------------------------------
  it('User can like a transaction and the like count updates and button disables', () => {
    const userA = `user-${faker.datatype.uuid().slice(0, 8)}`;
    const userB = `user-${faker.datatype.uuid().slice(0, 8)}`;

    createUser(userA).then((uA) =>
      loginByApi(userA).then(() =>
        createBankAccount(uA.id).then((bankAcc) =>
          createUser(userB).then((uB) =>
            createTransaction('payment', uB.id, bankAcc.id).then((txn) => {
              // Like the transaction
              cy.request({
                method: 'POST',
                url: `${API_URL}/likes/${txn.id}`,
              });

              // Visit transaction detail
              cy.visit(transactionViewUrl(txn.id));

              // Like count should be 1
              cy.get(`[data-test="transaction-like-count-${txn.id}"]`).should(
                'contain',
                '1'
              );

              // Like button should be disabled for the current user
              cy.get(`[data-test="transaction-like-button-${txn.id}"]`)
                .should('be.disabled')
                .and('have.attr', 'aria-label', 'like');
            })
          )
        )
      )
    );
  });

  // ----------------------------------------------------------
  // 3. Comments in transaction (multiple comments)
  // ----------------------------------------------------------
  it('All comments for a transaction are displayed', () => {
    const userA = `user-${faker.datatype.uuid().slice(0, 8)}`;
    const userB = `user-${faker.datatype.uuid().slice(0, 8)}`;

    createUser(userA).then((uA) =>
      loginByApi(userA).then(() =>
        createBankAccount(uA.id).then((bankAcc) =>
          createUser(userB).then((uB) =>
            createTransaction('payment', uB.id, bankAcc.id).then((txn) => {
              // Create 3 comments
              createComments(txn.id, 3).then(() => {
                // Visit transaction detail
                cy.visit(transactionViewUrl(txn.id));

                // All comment list items should be present
                cy.get('[data-test^="comment-list-item-"]')
                  .should('have.length', 3)
                  .each(($el) => {
                    expect($el.text()).to.have.length.greaterThan(0);
                  });
              });
            })
          )
        )
      )
    );
  });

  // ----------------------------------------------------------
  // 4. Accept transaction request + button disappears
  // ----------------------------------------------------------
  it('Receiver can accept a transaction request and the button disappears', () => {
    const userA = `user-${faker.datatype.uuid().slice(0, 8)}`; // sender
    const userB = `user-${faker.datatype.uuid().slice(0, 8)}`; // receiver

    createUser(userA).then((uA) =>
      loginByApi(userA).then(() =>
        createBankAccount(uA.id).then((bankAcc) =>
          createUser(userB).then((uB) =>
            createTransaction('request', uB.id, bankAcc.id).then((txn) => {
              // Log in as receiver
              loginByApi(userB).then(() => {
                cy.visit(transactionViewUrl(txn.id));

                // Accept button should exist
                const acceptBtn = `[data-test="transaction-accept-request-${txn.id}"]`;
                cy.get(acceptBtn).should('be.visible').click();

                // Button should no longer exist
                cy.get(acceptBtn).should('not.exist');
              });
            })
          )
        )
      )
    );
  });

  // ----------------------------------------------------------
  // 5. Reject transaction request + button disappears
  // ----------------------------------------------------------
  it('Receiver can reject a transaction request and the button disappears', () => {
    const userA = `user-${faker.datatype.uuid().slice(0, 8)}`; // sender
    const userB = `user-${faker.datatype.uuid().slice(0, 8)}`; // receiver

    createUser(userA).then((uA) =>
      loginByApi(userA).then(() =>
        createBankAccount(uA.id).then((bankAcc) =>
          createUser(userB).then((uB) =>
            createTransaction('request', uB.id, bankAcc.id).then((txn) => {
              // Log in as receiver
              loginByApi(userB).then(() => {
                cy.visit(transactionViewUrl(txn.id));

                // Reject button should exist
                const rejectBtn = `[data-test="transaction-reject-request-${txn.id}"]`;
                cy.get(rejectBtn).should('be.visible').click();

                // Button should no longer exist
                cy.get(rejectBtn).should('not.exist');
              });
            })
          )
        )
      )
    );
  });

  // ----------------------------------------------------------
  // 6. Accept/reject buttons not shown on completed transaction
  // ----------------------------------------------------------
  it('No accept/reject buttons for a completed transaction', () => {
    const userA = `user-${faker.datatype.uuid().slice(0, 8)}`;

    createUser(userA).then((uA) =>
      loginByApi(userA).then(() =>
        createBankAccount(uA.id).then((bankAcc) =>
          createTransaction('payment', uA.id, bankAcc.id).then((txn) => {
            cy.visit(transactionViewUrl(txn.id));

            cy.get(`[data-test="transaction-accept-request-${txn.id}"]`).should(
              'not.exist'
            );
            cy.get(`[data-test="transaction-reject-request-${txn.id}"]`).should(
              'not.exist'
            );
          })
        )
      )
    );
  });
});
