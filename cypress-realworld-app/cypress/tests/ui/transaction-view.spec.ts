import { User, Transaction } from "../../../src/models";

// O tipo NewTransactionCtx define a estrutura do objeto de contexto 'ctx'
// usado para compartilhar dados entre os testes neste arquivo.
type NewTransactionCtx = {
  transactionRequest?: Transaction;
  authenticatedUser?: User;
};

describe("Transaction View", function () {
  const ctx: NewTransactionCtx = {};

  beforeEach(function () {
    // Reseta o banco de dados para um estado conhecido antes de cada teste
    cy.task("db:seed");

    // Configura o servidor de rotas do Cypress para interceptar chamadas de API
    cy.server();
    cy.route("GET", "/transactions").as("personalTransactions");
    cy.route("GET", "/transactions/public").as("publicTransactions");
    cy.route("GET", "/transactions/*").as("getTransaction");
    cy.route("PATCH", "/transactions/*").as("updateTransaction");

    cy.route("GET", "/checkAuth").as("userProfile");
    cy.route("GET", "/notifications").as("getNotifications");
    cy.route("GET", "/bankAccounts").as("getBankAccounts");

    // Busca um usuário no banco de dados para autenticação
    cy.database("find", "users").then(function (user: User) {
      ctx.authenticatedUser = user;

      // Realiza o login via XState para uma autenticação mais rápida
      cy.loginByXstate(ctx.authenticatedUser.username);

      // Busca uma transação de requisição pendente específica para os testes de aceitar/rejeitar
      cy.database("find", "transactions", {
        receiverId: ctx.authenticatedUser.id,
        status: "pending",
        requestStatus: "pending",
        requestResolvedAt: "",
      }).then(function (transaction: Transaction) {
        ctx.transactionRequest = transaction;
      });
    });

    // Navega para a aba de transações pessoais e aguarda o carregamento
    cy.getBySel("nav-personal-tab").click();
    cy.wait("@personalTransactions");
  });

  it("transactions navigation tabs are hidden on a transaction view page", function () {
    // Clica no primeiro item da lista de transações
    cy.getBySelLike("transaction-item").first().click();

    // Verifica se a URL mudou para a página de detalhes da transação
    cy.location("pathname").should("include", "/transaction");
    // As abas de navegação (Everyone, Friends, Mine) não devem estar visíveis
    cy.getBySel("nav-transaction-tabs").should("not.be.visible");
    cy.percySnapshot("Transaction Navigation Tabs Hidden");
  });

  it("likes a transaction", function () {
    cy.getBySelLike("transaction-item").first().click();
    cy.wait("@getTransaction");

    // Clica no botão de "like"
    cy.getBySelLike("like-button").click();
    // Verifica se a contagem de likes foi atualizada para 1
    cy.getBySelLike("like-count").should("contain", 1);
    // O botão de "like" deve estar desabilitado após o clique
    cy.getBySelLike("like-button").should("be.disabled");
    cy.percySnapshot("Transaction after Liked");
  });

  it("comments on a transaction", function () {
    cy.getBySelLike("transaction-item").first().click();
    cy.wait("@getTransaction");

    const comments = ["Thank you!", "Appreciate it."];

    // Adiciona múltiplos comentários e verifica se cada um aparece na lista
    comments.forEach(function (comment, index) {
      cy.getBySelLike("comment-input").type(`${comment}{enter}`);
      cy.getBySelLike("comments-list").children().eq(index).contains(comment);
    });

    // A lista de comentários deve conter o número exato de comentários adicionados
    cy.getBySelLike("comments-list").children().should("have.length", comments.length);
    cy.percySnapshot("Comment on Transaction");
  });

  it("accepts a transaction request", function () {
    // Navega diretamente para a transação de requisição pendente
    cy.visit(`/transaction/${ctx.transactionRequest!.id}`);
    cy.wait("@getTransaction");

    // Clica para aceitar a requisição
    cy.getBySelLike("accept-request").click();
    // Aguarda a chamada de API de atualização e verifica o status
    cy.wait("@updateTransaction").should("have.property", "status", 204);
    // O botão de aceitar não deve mais estar visível
    cy.getBySelLike("accept-request").should("not.be.visible");
    cy.percySnapshot("Transaction Accepted");
  });

  it("rejects a transaction request", function () {
    cy.visit(`/transaction/${ctx.transactionRequest!.id}`);
    cy.wait("@getTransaction");

    // Clica para rejeitar a requisição
    cy.getBySelLike("reject-request").click();
    cy.wait("@updateTransaction").should("have.property", "status", 204);
    // O botão de rejeitar não deve mais estar visível
    cy.getBySelLike("reject-request").should("not.be.visible");
    cy.percySnapshot("Transaction Rejected");
  });

  it("does not display accept/reject buttons on completed request", function () {
    // Busca no banco uma transação que já foi completada e aceita
    cy.database("find", "transactions", {
      receiverId: ctx.authenticatedUser!.id,
      status: "complete",
      requestStatus: "accepted",
    }).then(function (transactionRequest) {
      cy.visit(`/transaction/${transactionRequest!.id}`);

      cy.wait("@getNotifications");
      // Verifica se a página de detalhes carregou
      cy.getBySel("transaction-detail-header").should("be.visible");
      // Os botões de aceitar e rejeitar não devem existir no DOM
      cy.getBySel("transaction-accept-request").should("not.exist");
      cy.getBySel("transaction-reject-request").should("not.exist");
      cy.percySnapshot("Transaction Completed (not able to accept or reject)");
    });
  });
});