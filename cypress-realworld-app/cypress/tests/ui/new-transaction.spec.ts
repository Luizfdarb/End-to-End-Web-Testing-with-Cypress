
const API = Cypress.env("apiUrl") as string;
const DEFAULT_PASSWORD = Cypress.env("defaultPassword") as string;

/**
 * Helper to get a random user that is **not** the current user
 *  (used to create a contact or to start a transaction)
 */
const getRandomOtherUser = (currentUserId: string) =>
  cy.request(`${API}/users`).then((res) => {
    const users = res.body.results as { id: string; username: string }[];
    // pick first user that is not the current user
    const other = users.find((u) => u.id !== currentUserId)!;
    return other;
  });

describe("New Transaction UI", () => {
  // Store the ID of the logged in user so that we can add contacts
  let currentUserId: string;
  let currentUsername: string;

  beforeEach(() => {
    // ─────────────────────────────────────────────────────
    //  1. Seed the database
    // ─────────────────────────────────────────────────────
    cy.task("db:seed");

    // ─────────────────────────────────────────────────────
    //  2. Pick a random user from the seed data
    // ─────────────────────────────────────────────────────
    cy.request(`${API}/users`).then((res) => {
      const users = res.body.results as { id: string; username: string }[];
      const user = users[0]; // pick the first user
      currentUserId = user.id;
      currentUsername = user.username;
    });

    // ─────────────────────────────────────────────────────
    //  3. Log in via API
    // ─────────────────────────────────────────────────────
    cy.loginByApi(currentUsername, DEFAULT_PASSWORD).then((resp) => {
      // the response contains the user object – verify it
      expect(resp.body.user).to.have.property("id", currentUserId);
    });
  });

  // ─────────────────────────────────────────────────────
  //  Test helpers
  // ─────────────────────────────────────────────────────
  /**
   * Create a new contact for the logged in user
   * @param contactUserId  The user to become a contact
   */
  const createContact = (contactUserId: string) => {
    cy.request({
      method: "POST",
      url: `${API}/contacts`,
      body: { contactUserId },
    });
  };

  /**
   * Returns the number of transactions of the logged in user
   */
  const getTransactionCount = () =>
    cy.request(`${API}/transactions`).then((res) => res.body.results.length);

  // ─────────────────────────────────────────────────────
  //  1️⃣ Create a payment transaction with an existing contact
  // ─────────────────────────────────────────────────────
  it("should create a payment transaction with an existing contact", () => {
    // create a contact first
    cy.getRandomOtherUser(currentUserId).then((other) => {
      createContact(other.id);

      // start the wizard
      cy.visit("/transaction/new");

      // step 1 – pick a contact
      cy.get(`[data-test="user-list-item-${other.id}"]`).click();

      // step 2 – fill amount & description
      cy.getBySel("transaction-create-amount-input").clear().type("250");
      cy.getBySel("transaction-create-description-input").clear().type("Dinner");
      cy.getBySel("transaction-create-submit-payment").click();

      // step 3 – confirmation page
      cy.getBySel("new-transaction-return-to-transactions").should("be.visible");
    });
  });

  // ─────────────────────────────────────────────────────
  //  2️⃣ Create a request transaction with an existing contact
  // ─────────────────────────────────────────────────────
  it("should create a request transaction with an existing contact", () => {
    cy.getRandomOtherUser(currentUserId).then((other) => {
      createContact(other.id);

      cy.visit("/transaction/new");
      cy.get(`[data-test="user-list-item-${other.id}"]`).click();

      cy.getBySel("transaction-create-amount-input").clear().type("100");
      cy.getBySel("transaction-create-description-input")
        .clear()
        .type("Rent share");
      cy.getBySel("transaction-create-submit-request").click();

      cy.getBySel("new-transaction-return-to-transactions").should("be.visible");
    });
  });

  // ─────────────────────────────────────────────────────
  //  3️⃣ Create a transaction with a new contact (search + add)
  // ─────────────────────────────────────────────────────
  it("should create a transaction with a new contact (search + add)", () => {
    cy.getRandomOtherUser(currentUserId).then((other) => {
      // we don't create a contact – just search for the user
      cy.visit("/transaction/new");

      // search bar
      cy.getBySel("user-list-search-input")
        .clear()
        .type(other.username, { delay: 50 })
        .wait(500); // give the list time to filter

      // select the user from the filtered list
      cy.get(`[data-test="user-list-item-${other.id}"]`).click();

      // step 2
      cy.getBySel("transaction-create-amount-input").clear().type("75");
      cy.getBySel("transaction-create-description-input")
        .clear()
        .type("Coffee");
      cy.getBySel("transaction-create-submit-payment").click();

      cy.getBySel("new-transaction-return-to-transactions").should("be.visible");
    });
  });

  // ─────────────────────────────────────────────────────
  //  4️⃣ Validation: contact selection is mandatory
  // ─────────────────────────────────────────────────────
  it("should not allow proceeding without selecting a contact", () => {
    cy.visit("/transaction/new");

    // The next step (step 2) should NOT be rendered until a contact is chosen
    cy.getBySel("transaction-create-amount-input").should("not.exist");
    cy.getBySel("transaction-create-submit-payment").should("not.exist");
  });

  // ─────────────────────────────────────────────────────
  //  5️⃣ Validation: amount & description required – buttons disabled
  // ─────────────────────────────────────────────────────
  it("should disable submit buttons until amount and description are provided", () => {
    cy.getRandomOtherUser(currentUserId).then((other) => {
      cy.visit("/transaction/new");
      cy.get(`[data-test="user-list-item-${other.id}"]`).click();

      // only amount
      cy.getBySel("transaction-create-amount-input").clear().type("30");
      cy.getBySel("transaction-create-description-input").clear();
      cy.getBySel("transaction-create-submit-payment").should("be.disabled");
      cy.getBySel("transaction-create-submit-request").should("be.disabled");

      // only description
      cy.getBySel("transaction-create-amount-input").clear();
      cy.getBySel("transaction-create-description-input").clear().type("Test");
      cy.getBySel("transaction-create-submit-payment").should("be.disabled");
      cy.getBySel("transaction-create-submit-request").should("be.disabled");

      // both fields
      cy.getBySel("transaction-create-amount-input").clear().type("50");
      cy.getBySel("transaction-create-description-input").clear().type("Valid");
      cy.getBySel("transaction-create-submit-payment").should("not.be.disabled");
      cy.getBySel("transaction-create-submit-request").should("not.be.disabled");
    });
  });

  // ─────────────────────────────────────────────────────
  //  6️⃣ Cancel transaction in any step – no transaction persisted
  // ─────────────────────────────────────────────────────
  it("should not create a transaction after cancelling on step 1", () => {
    cy.getTransactionCount().as("initialCount");
    cy.visit("/transaction/new");
    cy.go("back"); // cancel by navigating back
    cy.visit("/"); // back to home

    cy.get("@initialCount").then((initialCount) => {
      cy.getTransactionCount().should("eq", initialCount);
    });
  });

  it("should not create a transaction after cancelling on step 2", () => {
    cy.getRandomOtherUser(currentUserId).then((other) => {
      cy.getTransactionCount().as("initialCount");
      cy.visit("/transaction/new");
      cy.get(`[data-test="user-list-item-${other.id}"]`).click();

      // fill only amount and navigate away before submitting
      cy.getBySel("transaction-create-amount-input").clear().type("60");
      cy.getBySel("transaction-create-description-input").clear();

      // cancel by going back
      cy.go("back");

      cy.visit("/"); // ensure we are on home

      cy.get("@initialCount").then((initialCount) => {
        cy.getTransactionCount().should("eq", initialCount);
      });
    });
  });

  // ─────────────────────────────────────────────────────
  //  7️⃣ Transactions with max and min amounts
  // ─────────────────────────────────────────────────────
  it("should create transactions with minimum and maximum amounts", () => {
    cy.getRandomOtherUser(currentUserId).then((other) => {
      // Minimum amount
      cy.visit("/transaction/new");
      cy.get(`[data-test="user-list-item-${other.id}"]`).click();
      cy.getBySel("transaction-create-amount-input").clear().type("1");
      cy.getBySel("transaction-create-description-input")
        .clear()
        .type("Min amount test");
      cy.getBySel("transaction-create-submit-payment").click();
      cy.getBySel("new-transaction-return-to-transactions").should("be.visible");

      // Maximum amount – use a large number (e.g. 1 000 000)
      cy.visit("/transaction/new");
      cy.get(`[data-test="user-list-item-${other.id}"]`).click();
      cy.getBySel("transaction-create-amount-input").clear().type("1000000");
      cy.getBySel("transaction-create-description-input")
        .clear()
        .type("Max amount test");
      cy.getBySel("transaction-create-submit-payment").click();
      cy.getBySel("new-transaction-return-to-transactions").should("be.visible");
    });
  });
});
