
describe('Notifications – Real World App', () => {
  // -------------------------------------------------------------------------
  // Global fixtures (seeded users, bank accounts, …) are refreshed before each test
  // -------------------------------------------------------------------------
  let users: any[] = [];

  before(() => {
    // Seed the DB once for the whole spec
    cy.task('db:seed');
    // Pull all users from the seeded DB (we need at least three distinct users)
    cy.task('filter:database', { entity: 'users', query: {} }).then((result: any[]) => {
      // Keep three users for the scenarios
      users = result.slice(0, 3);
    });
  });

  // -------------------------------------------------------------------------
  // Helper utilities
  // -------------------------------------------------------------------------
  const getUserFullName = (user: any) => `${user.firstName} ${user.lastName}`;
  const getUser = (index: number) => users[index];

  /**
   * Returns a transaction where `receiverId` matches the supplied user id.
   * If no such transaction exists, the test will fail.
   */
  const getTransactionForReceiver = (receiverId: string) => {
    return cy
      .task('filter:database', { entity: 'transactions', query: { receiverId } })
      .then((txs: any[]) => {
        expect(txs.length, 'transactions for receiver').to.be.greaterThan(0);
        return txs[0];
      });
  };

  /**
   * Returns a transaction that involves both users (sender/receiver).
   */
  const getTransactionBetween = (userAId: string, userBId: string) => {
    return cy
      .task('filter:database', { entity: 'transactions', query: {} })
      .then((txs: any[]) => {
        const tx = txs.find(
          (t: any) =>
            (t.senderId === userAId && t.receiverId === userBId) ||
            (t.senderId === userBId && t.receiverId === userAId)
        );
        expect(tx, 'transaction between users').to.exist;
        return tx;
      });
  };

  /**
   * Returns the first bank account of a given user (must be logged in beforehand).
   */
  const getFirstBankAccount = (username: string) => {
    // Use API (requires authentication cookie) – we log in via API first
    return cy.loginByApi(username).then(() => {
      return cy
        .request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/bankAccounts`,
          failOnStatusCode: false,
        })
        .then((resp) => {
          expect(resp.status).to.eq(200);
          const accounts = resp.body.results;
          expect(accounts.length, 'bank accounts for user').to.be.greaterThan(0);
          return accounts[0];
        });
    });
  };

  // -------------------------------------------------------------------------
  // 1️⃣  User A likes transaction of User B → User B gets notification
  // -------------------------------------------------------------------------
  it('User A likes a transaction of User B – B receives a notification', () => {
    const userA = getUser(0);
    const userB = getUser(1);

    // Find a transaction that belongs to B (B is receiver)
    getTransactionForReceiver(userB.id).then((tx: any) => {
      // Log in as A and like the transaction via UI
      cy.loginByXstate(userA.username);
      cy.visit(`/transaction/${tx.id}`);
      cy.get(`[data-test=transaction-like-button-${tx.id}]`).click();

      // Switch to B and verify the notification
      cy.logoutByXstate();
      cy.loginByXstate(userB.username);
      cy.visit('/notifications');

      const likerName = getUserFullName(userA);
      cy.contains(likerName).should('exist');
    });
  });

  // -------------------------------------------------------------------------
  // 2️⃣  User C likes transaction between User A and User B → Both get notifications
  // -------------------------------------------------------------------------
  it('User C likes a transaction between User A and User B – both receive notifications', () => {
    const userA = getUser(0);
    const userB = getUser(1);
    const userC = getUser(2);

    // Get a transaction that involves A and B
    getTransactionBetween(userA.id, userB.id).then((tx: any) => {
      // Log in as C and like it
      cy.loginByXstate(userC.username);
      cy.visit(`/transaction/${tx.id}`);
      cy.get(`[data-test=transaction-like-button-${tx.id}]`).click();

      // Verify notification for A
      cy.logoutByXstate();
      cy.loginByXstate(userA.username);
      cy.visit('/notifications');
      const likerName = getUserFullName(userC);
      cy.contains(likerName).should('exist');

      // Verify notification for B
      cy.logoutByXstate();
      cy.loginByXstate(userB.username);
      cy.visit('/notifications');
      cy.contains(likerName).should('exist');
    });
  });

  // -------------------------------------------------------------------------
  // 3️⃣  User A comments on transaction of User B → User B gets notification
  // -------------------------------------------------------------------------
  it('User A comments on a transaction of User B – B receives a notification', () => {
    const userA = getUser(0);
    const userB = getUser(1);
    const commentText = 'Cypress comment test';

    // Get a transaction owned by B
    getTransactionForReceiver(userB.id).then((tx: any) => {
      // Log in as A via API and post a comment (backend creates notification)
      cy.loginByApi(userA.username).then(() => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/comments/${tx.id}`,
          body: { content: commentText },
          failOnStatusCode: false,
        }).then((resp) => {
          expect(resp.status).to.eq(200);
        });
      });

      // Verify B sees the comment notification
      cy.logoutByXstate();
      cy.loginByXstate(userB.username);
      cy.visit('/notifications');

      const commenterName = getUserFullName(userA);
      cy.contains(commenterName).should('exist');
    });
  });

  // -------------------------------------------------------------------------
  // 4️⃣  User C comments on transaction between User A and User B → Both get notifications
  // -------------------------------------------------------------------------
  it('User C comments on a transaction between User A and User B – both receive notifications', () => {
    const userA = getUser(0);
    const userB = getUser(1);
    const userC = getUser(2);
    const commentText = 'Cypress shared comment';

    // Transaction involving A & B
    getTransactionBetween(userA.id, userB.id).then((tx: any) => {
      // Log in as C (API) and post comment
      cy.loginByApi(userC.username).then(() => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/comments/${tx.id}`,
          body: { content: commentText },
          failOnStatusCode: false,
        }).then((resp) => {
          expect(resp.status).to.eq(200);
        });
      });

      // Verify A receives notification
      cy.logoutByXstate();
      cy.loginByXstate(userA.username);
      cy.visit('/notifications');
      const commenterName = getUserFullName(userC);
      cy.contains(commenterName).should('exist');

      // Verify B receives notification
      cy.logoutByXstate();
      cy.loginByXstate(userB.username);
      cy.visit('/notifications');
      cy.contains(commenterName).should('exist');
    });
  });

  // -------------------------------------------------------------------------
  // 5️⃣  User A sends payment to User B → User B gets notification
  // -------------------------------------------------------------------------
  it('User A sends a payment to User B – B receives a payment received notification', () => {
    const userA = getUser(0);
    const userB = getUser(1);
    const amount = 1000; // in cents (the API expects the raw amount)
    const description = 'Cypress payment';

    // Get a bank account for A (required as source)
    getFirstBankAccount(userA.username).then((bankAccount) => {
      // Log in as A (API) and create the payment transaction
      cy.loginByApi(userA.username).then(() => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/transactions`,
          body: {
            transactionType: 'payment',
            source: bankAccount.id,
            senderId: userA.id,
            receiverId: userB.id,
            description,
            amount,
            privacyLevel: 'public',
          },
          failOnStatusCode: false,
        }).then((resp) => {
          expect(resp.status).to.eq(200);
        });
      });

      // Verify B sees a “received payment” notification
      cy.logoutByXstate();
      cy.loginByXstate(userB.username);
      cy.visit('/notifications');

      const senderName = getUserFullName(userA);
      // The notification text contains the sender's full name and “received payment”
      cy.contains(senderName).should('exist');
      cy.contains('received payment').should('exist');
    });
  });

  // -------------------------------------------------------------------------
  // 6️⃣  User A sends a payment request to User C → User C gets notification
  // -------------------------------------------------------------------------
  it('User A sends a payment request to User C – C receives a payment request notification', () => {
    const userA = getUser(0);
    const userC = getUser(2);
    const amount = 2000;
    const description = 'Cypress request';

    // Get a bank account for A (source)
    getFirstBankAccount(userA.username).then((bankAccount) => {
      // Log in as A (API) and create the request transaction
      cy.loginByApi(userA.username).then(() => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/transactions`,
          body: {
            transactionType: 'request',
            source: bankAccount.id,
            senderId: userA.id,
            receiverId: userC.id,
            description,
            amount,
            privacyLevel: 'public',
          },
          failOnStatusCode: false,
        }).then((resp) => {
          expect(resp.status).to.eq(200);
        });
      });

      // Verify C sees a “requested payment” notification
      cy.logoutByXstate();
      cy.loginByXstate(userC.username);
      cy.visit('/notifications');

      const senderName = getUserFullName(userA);
      cy.contains(senderName).should('exist');
      cy.contains('requested payment').should('exist');
    });
  });

  // -------------------------------------------------------------------------
  // 7️⃣  Empty notifications state – a brand‑new user sees the empty UI
  // -------------------------------------------------------------------------
  it('Renders empty notifications state for a user with no notifications', () => {
    const newUser = {
      firstName: 'Empty',
      lastName: 'User',
      username: `empty_user_${Date.now()}`,
      password: 'abc123',
      email: `empty_${Date.now()}@example.com`,
      phoneNumber: '555-1234',
      avatar: '',
      defaultPrivacyLevel: 'public',
      balance: 0,
    };

    // Create the user via the public signup endpoint (no auth required)
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/users`,
      body: newUser,
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(201);
    });

    // Log in as the brand‑new user and verify empty notifications UI
    cy.loginByXstate(newUser.username);
    cy.visit('/notifications');

    // The EmptyList component renders a header with text “No Notifications”
    cy.get('[data-test=empty-list-header]').should('contain.text', 'No Notifications');
  });
});
