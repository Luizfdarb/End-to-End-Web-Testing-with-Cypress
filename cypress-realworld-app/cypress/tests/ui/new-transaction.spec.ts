import { User } from "../../src/models";

describe("New Transaction", () => {
  let sender: User;
  let receiver: User;

  beforeEach(() => {
    // 1. Seed database to ensure clean state
    cy.task("db:seed");

    // 2. Setup server routing handling for wait commands
    cy.server();
    cy.route("POST", "/transactions").as("createTransaction");
    cy.route("GET", "/users").as("allUsers");
    cy.route("GET", "/users/search*").as("usersSearch");
    cy.route("GET", "/notifications").as("notifications");
    cy.route("GET", "/bankAccounts").as("bankAccounts");

    // 3. Fetch users dynamically from the seeded database
    cy.database("find", "users").then((user: User) => {
      sender = user;
      
      // Get a different user for the receiver
      cy.database("filter", "users").then((users: User[]) => {
        receiver = users.find((u) => u.id !== sender.id)!;
        
        // 4. Login with the sender account
        cy.login(sender.username, "s3cret");
      });
    });
  });

  it("navigates to the new transaction form", () => {
    cy.getBySel("nav-top-new-transaction").click();
    cy.location("pathname").should("eq", "/transaction/new");
  });

  it("creates a new transaction (payment)", () => {
    cy.getBySel("nav-top-new-transaction").click();

    // Step 1: Select Receiver
    cy.getBySel("user-list-search-input").type(receiver.firstName);
    cy.wait("@usersSearch");
    cy.getBySelLike("user-list-item").contains(receiver.firstName).click();

    // Step 2: Fill Amount and Note
    cy.getBySel("transaction-create-amount-input").type("50");
    cy.getBySel("transaction-create-description-input").type("Pizza money");

    // Step 3: Submit Payment
    cy.getBySel("transaction-create-submit-payment").click();

    // Verification
    cy.wait("@createTransaction");
    cy.getBySel("alert-bar-success").should("be.visible").and("contain", "Transaction Submitted!");
  });

  it("creates a new transaction (request)", () => {
    cy.getBySel("nav-top-new-transaction").click();

    // Step 1: Select Receiver
    cy.getBySel("user-list-search-input").type(receiver.firstName);
    cy.wait("@usersSearch");
    cy.getBySelLike("user-list-item").contains(receiver.firstName).click();

    // Step 2: Fill Amount and Note
    cy.getBySel("transaction-create-amount-input").type("100");
    cy.getBySel("transaction-create-description-input").type("Consulting fee");

    // Step 3: Submit Request
    cy.getBySel("transaction-create-submit-request").click();

    // Verification
    cy.wait("@createTransaction");
    cy.getBySel("alert-bar-success").should("be.visible").and("contain", "Transaction Submitted!");
  });

  it("validates form inputs (disables submit button)", () => {
    cy.getBySel("nav-top-new-transaction").click();

    // Select User
    cy.getBySel("user-list-search-input").type(receiver.firstName);
    cy.wait("@usersSearch");
    cy.getBySelLike("user-list-item").contains(receiver.firstName).click();

    // Case 1: Empty inputs
    cy.getBySel("transaction-create-submit-payment").should("be.disabled");
    cy.getBySel("transaction-create-submit-request").should("be.disabled");

    // Case 2: Only amount filled
    cy.getBySel("transaction-create-amount-input").type("50");
    cy.getBySel("transaction-create-submit-payment").should("be.disabled");

    // Case 3: Both filled (Valid)
    cy.getBySel("transaction-create-description-input").type("Dinner");
    cy.getBySel("transaction-create-submit-payment").should("not.be.disabled");
  });

  it("deducts the amount from user balance after payment", () => {
    // 1. Get initial balance
    cy.getBySel("sidenav-user-balance").then(($balance) => {
      const oldBalance = parseFloat($balance.text().replace(/\$|,/g, ""));
      const transactionAmount = 50;

      // 2. Perform Transaction
      cy.getBySel("nav-top-new-transaction").click();
      cy.getBySel("user-list-search-input").type(receiver.firstName);
      cy.wait("@usersSearch");
      cy.getBySelLike("user-list-item").contains(receiver.firstName).click();
      
      cy.getBySel("transaction-create-amount-input").type(String(transactionAmount));
      cy.getBySel("transaction-create-description-input").type("Balance Check");
      cy.getBySel("transaction-create-submit-payment").click();
      
      cy.wait("@createTransaction");

      // 3. Verify new balance
      cy.getBySel("sidenav-user-balance").should(($newBalance) => {
        const newBalance = parseFloat($newBalance.text().replace(/\$|,/g, ""));
        expect(newBalance).to.equal(oldBalance - transactionAmount);
      });
    });
  });

  it("resets the form when 'Create Another Transaction' is clicked", () => {
    cy.getBySel("nav-top-new-transaction").click();

    // Complete first transaction
    cy.getBySel("user-list-search-input").type(receiver.firstName);
    cy.wait("@usersSearch");
    cy.getBySelLike("user-list-item").contains(receiver.firstName).click();
    
    cy.getBySel("transaction-create-amount-input").type("25");
    cy.getBySel("transaction-create-description-input").type("First txn");
    cy.getBySel("transaction-create-submit-payment").click();
    cy.wait("@createTransaction");

    // Click "Create Another"
    cy.getBySel("new-transaction-create-another-transaction").click();

    // Verify we are back at Step 1 (User Search)
    cy.getBySel("user-list-search-input").should("be.visible");
    cy.getBySel("user-list-search-input").should("have.value", "");
  });
});