// cypress/tests/ui/new-transaction.spec.ts

import Dinero from "dinero.js";
import { User, Contact } from "../../../src/models";
import { isMobile } from "../../support/utils";

describe("New Transaction", function() {
  let user: User;
  let contact: User;
  let allUsers: User[];

  beforeEach(function() {
    cy.task("db:seed");
    cy.server();
    cy.route("POST", "/transactions").as("createTransaction");
    cy.route("GET", "/users").as("allUsers");
    cy.route("GET", "/users/search*").as("usersSearch");
    cy.route("GET", "/notifications").as("notifications");
    cy.route("POST", "/contacts").as("createContact");

    cy.database("filter", "users").then((users: User[]) => {
      user = users[0];
      contact = users[1];
      allUsers = users;
      cy.login(user.username, "s3cret");
    });
  });

  // CENÁRIO 1: Criar transação completa (payment) com contato existente
  it("creates a payment transaction with an existing contact", function() {
    const payment = {
      amount: "15.50",
      description: "Lunch at the cafe",
    };

    cy.getBySel("nav-top-new-transaction").click();
    cy.wait("@allUsers");

    cy.getBySelLike("user-list-item").contains(`${contact.firstName} ${contact.lastName}`).click();

    cy.getBySelLike("amount-input").type(payment.amount);
    cy.getBySelLike("description-input").type(payment.description);
    cy.getBySel("transaction-create-submit-payment").click();
    cy.wait("@createTransaction").its("status").should("eq", 200);

    cy.getBySel("new-transaction-return-to-transactions").should("be.visible");
    cy.percySnapshot("New Transaction - Payment Confirmation");
  });

  // CENÁRIO 2: Criar transação completa (request) com contato existente
  it("creates a request transaction with an existing contact", function() {
    const request = {
      amount: "25.00",
      description: "Concert tickets",
    };

    cy.getBySel("nav-top-new-transaction").click();
    cy.wait("@allUsers");

    cy.getBySelLike("user-list-item").contains(`${contact.firstName} ${contact.lastName}`).click();

    cy.getBySelLike("amount-input").type(request.amount);
    cy.getBySelLike("description-input").type(request.description);
    cy.getBySel("transaction-create-submit-request").click();
    cy.wait("@createTransaction").its("status").should("eq", 200);

    cy.getBySel("new-transaction-return-to-transactions").should("be.visible");
    cy.percySnapshot("New Transaction - Request Confirmation");
  });

  // CENÁRIO 3: Criar transação com novo contato (search + add)
  it("creates a transaction with a new contact found via search", function() {
    const newContact = allUsers[2];
    const payment = {
      amount: "10.00",
      description: "Movie tickets",
    };

    cy.getBySel("nav-top-new-transaction").click();
    cy.wait("@allUsers");

    cy.getBySel("user-list-search-input").type(newContact.username);
    cy.wait("@usersSearch");

    cy.getBySelLike("user-list-item").contains(newContact.username).click();

    cy.getBySelLike("amount-input").type(payment.amount);
    cy.getBySelLike("description-input").type(payment.description);
    cy.getBySel("transaction-create-submit-payment").click();
    cy.wait("@createTransaction").its("status").should("eq", 200);

    cy.percySnapshot("New Transaction - With a new contact");
  });

  // CENÁRIO 4: Validações step 1 (contato obrigatório + botão disabled)
  it("shows validations for selecting a contact in step 1", function() {
    cy.getBySel("nav-top-new-transaction").click();
    cy.wait("@allUsers");

    // O botão de avançar para a próxima etapa não existe no fluxo,
    // a validação se dá pela seleção de um contato.
    // O formulário de Step 2 só aparece após selecionar um contato.
    cy.getBySelLike("transaction-create-form").should('not.exist');
    cy.percySnapshot("New Transaction - Step 1 without contact selected");

    cy.getBySelLike("user-list-item").first().click();
    cy.getBySel("transaction-create-form").should('be.visible');
    cy.percySnapshot("New Transaction - Step 2 after selecting contact");
  });

  // CENÁRIO 5: Validações step 2 (valor + descrição obrigatórios)
  it("shows validations for required fields in step 2", function() {
    cy.getBySel("nav-top-new-transaction").click();
    cy.wait("@allUsers");
    cy.getBySelLike("user-list-item").first().click();

    cy.getBySelLike("amount-input").type("43").find("input").clear().blur();
    cy.get("#transaction-create-amount-input-helper-text")
      .should("be.visible")
      .and("contain", "Please enter a valid amount");

    cy.getBySelLike("description-input").type("Fun").find("input").clear().blur();
    cy.get("#transaction-create-description-input-helper-text")
      .should("be.visible")
      .and("contain", "Please enter a note");

    cy.getBySel("transaction-create-submit-request").should("be.disabled");
    cy.getBySel("transaction-create-submit-payment").should("be.disabled");
    cy.percySnapshot("New Transaction - Step 2 with errors");
  });

  // CENÁRIO 6: Cancelar transação em qualquer step
  it("cancels the transaction from any step", function() {
    cy.getBySel("nav-top-new-transaction").click();
    cy.wait("@allUsers");

    cy.url().should("include", "/transaction/new");
    cy.percySnapshot("New Transaction - Initial screen");

    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }
    cy.getBySel("sidenav-home").click();
    cy.url().should("not.include", "/transaction/new");
    cy.percySnapshot("New Transaction - Canceled and navigated home");
  });

  // CENÁRIO 7: Transação com valor máximo e mínimo
  it("creates transactions with max and min amounts", function() {
    // Valor mínimo
    cy.getBySel("nav-top-new-transaction").click();
    cy.wait("@allUsers");
    cy.getBySelLike("user-list-item").first().click();
    cy.getBySelLike("amount-input").type("0.01");
    cy.getBySelLike("description-input").type("Min amount");
    cy.getBySel("transaction-create-submit-payment").click();
    cy.wait("@createTransaction").its("status").should("eq", 200);
    cy.getBySel("new-transaction-return-to-transactions").should("be.visible");
    cy.percySnapshot("New Transaction - Minimum amount payment");

    // Navega para a home para nova transação
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }
    cy.getBySel("sidenav-home").click();

    // Valor máximo
    cy.getBySel("nav-top-new-transaction").click();
    cy.wait("@allUsers");
    cy.getBySelLike("user-list-item").first().click();
    // O valor máximo de Dinero.js é `9007199254740991` (2^53 - 1)
    const maxAmount = Dinero({ amount: 9007199254740991 });
    cy.getBySelLike("amount-input").type(maxAmount.toFormat());
    cy.getBySelLike("description-input").type("Max amount");
    cy.getBySel("transaction-create-submit-payment").click();
    cy.wait("@createTransaction").its("status").should("eq", 200);
    cy.getBySel("new-transaction-return-to-transactions").should("be.visible");
    cy.percySnapshot("New Transaction - Maximum amount payment");
  });
});