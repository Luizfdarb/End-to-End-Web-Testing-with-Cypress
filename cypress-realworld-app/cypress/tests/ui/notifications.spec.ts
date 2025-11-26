
// cypress/tests/ui/notifications.spec.ts
/// <reference types="cypress" />

import { TransactionCreatePayload } from "../../src/models";
import { TransactionRequestStatus } from "../../src/models";
import { TransactionStatus } from "../../src/models";
import { DefaultPrivacyLevel } from "../../src/models";

describe("Notifications – Real World App", () => {
  // Seed the backend before each test
  beforeEach(() => {
    cy.task("db:seed");
  });

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  const api = Cypress.env("apiUrl");
  const defaultPassword = Cypress.env("defaultPassword");

  /** Log in by API and keep the session cookie */
  const login = (username: string) =>
    cy.loginByApi(username, defaultPassword);

  /** Fetch a list of users */
  const fetchUsers = () =>
    cy.request(`${api}/users`).then((res) => res.body.results);

  /** Fetch bank accounts of the currently logged‑in user */
  const fetchBankAccounts = () =>
    cy.request(`${api}/bankAccounts`).then((res) => res.body.results);

  /** Create a transaction via the API */
  const createTransaction = (
    sender: string,
    receiver: string,
    amount: number,
    type: "payment" | "request",
    description: string
  ) => {
    // Grab a source account (any of the sender's bank accounts)
    return fetchBankAccounts().then((accounts) => {
      const source = accounts[0].id;
      const payload: TransactionCreatePayload = {
        transactionType: type,
        amount: `${amount}`,
        description,
        privacyLevel: DefaultPrivacyLevel.public,
        receiverId: receiver,
        source,
      };
      return cy
        .request("POST", `${api}/transactions`, payload)
        .then((r) => r.body.transaction);
    });
  };

  /** Like a transaction */
  const likeTransaction = (transactionId: string) =>
    cy.request("POST", `${api}/likes/${transactionId}`);

  /** Comment on a transaction */
  const commentTransaction = (transactionId: string, comment: string) =>
    cy.request("POST", `${api}/comments/${transactionId}`, {
      content: comment,
    });

  /** Open the notifications page (UI) */
  const openNotificationsPage = () =>
    cy.visit("/notifications");

  /** Count notifications currently visible in the UI */
  const getNotificationCount = () =>
    cy.getBySel("notifications-list").find("[data-test^=notification-list-item-]").its("length");

  // ------------------------------------------------------------------
  // Test 1 – User A likes transaction of User B → User B gets notification
  // ------------------------------------------------------------------
  it("User A likes User B's transaction → User B gets a like notification", () => {
    const fixture = "public-transactions.json";

    // 1. Login as User A (db4uxOm7d) – the transaction owner
    cy.loginByApi("db4uxOm7d", defaultPassword);

    // 2. Get a transaction that belongs to User B
    cy.fixture(fixture).then((data) => {
      const tx = data.results[0]; // payment to IMbeyzHTj9
      const transactionId = tx.id;

      // 3. Like the transaction
      likeTransaction(transactionId);
    });

    // 4. Login as User B
    cy.loginByApi("IMbeyzHTj9", defaultPassword);

    // 5. Verify that User B sees the notification
    openNotificationsPage();
    cy.getNotificationCount().should("be.greaterThan", 0);
    cy.contains("liked a transaction").should("be.visible");
  });

  // ------------------------------------------------------------------
  // Test 2 – User C likes transaction between A & B → Both get notifications
  // ------------------------------------------------------------------
  it("User C likes transaction between A & B → A & B both get notifications", () => {
    const fixture = "public-transactions.json";

    cy.fixture(fixture).then((data) => {
      const tx = data.results[0]; // transaction between db4uxOm7d (A) and IMbeyzHTj9 (B)
      const transactionId = tx.id;
      const senderId = tx.senderId;
      const receiverId = tx.receiverId;

      // 1. Login as User C
      cy.loginByApi("mA1Vq7q3z", defaultPassword);

      // 2. Like the transaction
      likeTransaction(transactionId);

      // 3. Login as User A
      cy.loginByApi(senderId, defaultPassword);

      // 4. Verify User A notification
      openNotificationsPage();
      cy.contains("liked a transaction").should("be.visible");
      cy.getNotificationCount().should("be.greaterThan", 0);

      // 5. Login as User B
      cy.loginByApi(receiverId, defaultPassword);

      // 6. Verify User B notification
      openNotificationsPage();
      cy.contains("liked a transaction").should("be.visible");
    });
  });

  // ------------------------------------------------------------------
  // Test 3 – User A comments on transaction of User B → User B gets notification
  // ------------------------------------------------------------------
  it("User A comments on User B's transaction → User B gets a comment notification", () => {
    const fixture = "public-transactions.json";

    cy.fixture(fixture).then((data) => {
      const tx = data.results[0]; // transaction owned by IMbeyzHTj9 (B)
      const transactionId = tx.id;

      // 1. Login as User A
      cy.loginByApi("db4uxOm7d", defaultPassword);

      // 2. Comment
      commentTransaction(transactionId, "Nice transaction!");

      // 3. Login as User B
      cy.loginByApi("IMbeyzHTj9", defaultPassword);

      // 4. Verify notification
      openNotificationsPage();
      cy.contains("commented on a transaction").should("be.visible");
    });
  });

  // ------------------------------------------------------------------
  // Test 4 – User C comments on transaction between A & B → Both get notifications
  // ------------------------------------------------------------------
  it("User C comments on transaction between A & B → A & B both get comment notifications", () => {
    const fixture = "public-transactions.json";

    cy.fixture(fixture).then((data) => {
      const tx = data.results[0];
      const transactionId = tx.id;
      const senderId = tx.senderId;
      const receiverId = tx.receiverId;

      // 1. Login as User C
      cy.loginByApi("mA1Vq7q3z", defaultPassword);

      // 2. Comment
      commentTransaction(transactionId, "Interesting!");

      // 3. Login as User A
      cy.loginByApi(senderId, defaultPassword);

      // 4. Verify notification for A
      openNotificationsPage();
      cy.contains("commented on a transaction").should("be.visible");

      // 5. Login as User B
      cy.loginByApi(receiverId, defaultPassword);

      // 6. Verify notification for B
      openNotificationsPage();
      cy.contains("commented on a transaction").should("be.visible");
    });
  });

  // ------------------------------------------------------------------
  // Test 5 – User A sends payment to User B → User B gets a payment notification
  // ------------------------------------------------------------------
  it("User A sends payment to User B → User B gets payment notification", () => {
    // 1. Login as User A
    cy.loginByApi("db4uxOm7d", defaultPassword);

    // 2. Create payment transaction to User B
    createTransaction(
      "db4uxOm7d",
      "IMbeyzHTj9",
      12345,
      "payment",
      "Payment from A to B"
    ).then(() => {
      // 3. Login as User B
      cy.loginByApi("IMbeyzHTj9", defaultPassword);

      // 4. Verify notification
      openNotificationsPage();
      cy.contains("received payment").should("be.visible");
    });
  });

  // ------------------------------------------------------------------
  // Test 6 – User A sends payment request to User C → User C gets notification
  // ------------------------------------------------------------------
  it("User A sends payment request to User C → User C gets payment request notification", () => {
    // 1. Login as User A
    cy.loginByApi("db4uxOm7d", defaultPassword);

    // 2. Create request transaction to User C
    createTransaction(
      "db4uxOm7d",
      "mA1Vq7q3z",
      5000,
      "request",
      "Request from A to C"
    ).then(() => {
      // 3. Login as User C
      cy.loginByApi("mA1Vq7q3z", defaultPassword);

      // 4. Verify notification
      openNotificationsPage();
      cy.contains("requested payment").should("be.visible");
    });
  });

  // ------------------------------------------------------------------
  // Test 7 – Renders empty notifications state
  // ------------------------------------------------------------------
  it("renders an empty notifications state when the user has no notifications", () => {
    // 1. Create a brand‑new user via the API
    const newUser = {
      username: `newuser_${Date.now()}`,
      password: "password123",
      firstName: "New",
      lastName: "User",
    };

    cy.request("POST", `${api}/users`, newUser).then((res) => {
      const userId = res.body.user.id;

      // 2. Sign up the new user
      cy.request("POST", `${api}/users`, newUser);

      // 3. Log in as the new user
      cy.loginByApi(newUser.username, newUser.password);

      // 4. Open notifications page
      openNotificationsPage();

      // 5. Verify empty state UI
      cy.getBySel("empty-list-header").contains("No Notifications");
      cy.getBySel("notifications-list").should("not.exist");
    });
  });
});
