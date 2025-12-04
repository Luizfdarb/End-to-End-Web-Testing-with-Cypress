import { User, Transaction } from "../../../src/models";

describe("Transaction View", () => {
  beforeEach(() => {
    cy.task("db:seed");
    // Login com um usuário consistente do seed data
    cy.loginByApi("Katharina_Bernier");
  });

  it("should display transaction details correctly", () => {
    cy.database("find", "users", { username: "Katharina_Bernier" }).then(
      (user: User) => {
        // Busca uma transação onde o usuário é o remetente ou destinatário
        cy.database("find", "transactions", { senderId: user.id }).then(
          (transaction: Transaction) => {
            cy.visit(`/transaction/${transaction.id}`);

            cy.getBySel("transaction-detail-header").should("be.visible");

            // Valida se o avatar, nomes e valor estão presentes
            cy.getBySel(`transaction-item-${transaction.id}`).should(
              "be.visible"
            );
            cy.getBySel(`transaction-sender-${transaction.id}`).should(
              "be.visible"
            );
            cy.getBySel(`transaction-receiver-${transaction.id}`).should(
              "be.visible"
            );
            // Verifica a descrição vinda do banco
            cy.contains(transaction.description).should("be.visible");
            // Verifica o valor
            cy.getBySel(`transaction-amount-${transaction.id}`).should(
              "be.visible"
            );
          }
        );
      }
    );
  });

  it("should allow liking a transaction", () => {
    cy.database("find", "users", { username: "Katharina_Bernier" }).then(
      (user: User) => {
        cy.database("find", "transactions", { senderId: user.id }).then(
          (transaction: Transaction) => {
            cy.visit(`/transaction/${transaction.id}`);

            // Prepara a interceptação da rota de like
            cy.route("POST", `/likes/${transaction.id}`).as("createLike");

            // Verifica o estado inicial do botão (habilitado) e clica
            cy.getBySel(`transaction-like-button-${transaction.id}`)
              .should("not.be.disabled")
              .click();

            // Aguarda a resposta da API
            cy.wait("@createLike");

            // Verifica se o botão foi desabilitado (usuário já curtiu)
            cy.getBySel(`transaction-like-button-${transaction.id}`).should(
              "be.disabled"
            );

            // Verifica se o contador de likes incrementou (assumindo que começa em 0 ou valida que existe um número)
            cy.getBySel(`transaction-like-count-${transaction.id}`).then(
              ($count) => {
                const count = parseInt($count.text());
                expect(count).to. be.at.least(1);
              }
            );
          }
        );
      }
    );
  });

  it("should allow commenting on a transaction", () => {
    cy.database("find", "users", { username: "Katharina_Bernier" }).then(
      (user: User) => {
        cy.database("find", "transactions", { senderId: user.id }).then(
          (transaction: Transaction) => {
            cy.visit(`/transaction/${transaction.id}`);

            const commentContent = "Nice transaction!";

            // Prepara a interceptação da rota de comentário
            cy.route("POST", `/comments/${transaction.id}`).as("createComment");

            // Digita o comentário e pressiona Enter
            cy.getBySel(`transaction-comment-input-${transaction.id}`)
              .type(`${commentContent}{enter}`);

            // Aguarda a resposta da API
            cy.wait("@createComment");

            // Verifica se o comentário apareceu na lista
            cy.getBySel("comments-list").should("contain", commentContent);
          }
        );
      }
    );
  });

  it("should accept a transaction request", () => {
    cy.database("find", "users", { username: "Katharina_Bernier" }).then(
      (user: User) => {
        // Encontra uma transação onde o usuário logado é o RECEBEDOR da cobrança (receiverId)
        // e o status é 'pending' (requestStatus)
        cy.database("find", "transactions", {
          receiverId: user.id,
          status: "pending",
          requestStatus: "pending",
        }).then((transaction: Transaction) => {
          // Se não houver transação pendente no seed, este teste falharia legitimamente no cenário real,
          // mas o seed garante dados suficientes.
          expect(transaction).to.exist;

          cy.visit(`/transaction/${transaction.id}`);

          // Intercepta o update da transação
          cy.route("PATCH", `/transactions/${transaction.id}`).as(
            "updateTransaction"
          );

          // Verifica se o botão de aceitar está visível e clica
          cy.getBySel(`transaction-accept-request-${transaction.id}`)
            .should("be.visible")
            .click();

          cy.wait("@updateTransaction");

          // Verifica se os botões de ação sumiram após aceitar
          cy.getBySel(`transaction-accept-request-${transaction.id}`).should(
            "not.be.visible"
          );
          cy.getBySel(`transaction-reject-request-${transaction.id}`).should(
            "not.be.visible"
          );

          // Verifica se o status mudou visualmente (opcional, dependendo de como a UI reflete isso,
          // geralmente via Paid/Charged no título)
          cy.getBySel(`transaction-action-${transaction.id}`).should(
            "contain",
            "charged"
          );
        });
      }
    );
  });

  it("should reject a transaction request", () => {
    cy.database("find", "users", { username: "Katharina_Bernier" }).then(
      (user: User) => {
        // Encontra transação pendente (request)
        cy.database("find", "transactions", {
          receiverId: user.id,
          status: "pending",
          requestStatus: "pending",
        }).then((transaction: Transaction) => {
          expect(transaction).to.exist;

          cy.visit(`/transaction/${transaction.id}`);

          cy.route("PATCH", `/transactions/${transaction.id}`).as(
            "updateTransaction"
          );

          // Clica em rejeitar
          cy.getBySel(`transaction-reject-request-${transaction.id}`)
            .should("be.visible")
            .click();

          cy.wait("@updateTransaction");

          // Verifica se os botões sumiram
          cy.getBySel(`transaction-reject-request-${transaction.id}`).should(
            "not.be.visible"
          );
          cy.getBySel(`transaction-accept-request-${transaction.id}`).should(
            "not.be.visible"
          );
        });
      }
    );
  });
});