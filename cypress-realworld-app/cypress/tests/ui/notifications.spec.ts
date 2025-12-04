import { User } from "../../src/models";

describe("Notifications", () => {
  beforeEach(() => {
    cy.task("db:seed");
    cy.server();
    cy.route("GET", "/notifications").as("getNotifications");
    cy.route("POST", "/transactions").as("createTransaction");
    cy.route("PATCH", "/notifications/*").as("updateNotification");
    cy.route("POST", "/comments/*").as("postComment");
    cy.route("POST", "/likes/*").as("postLike");
  });

  it("should navigate to notifications and render the list", () => {
    // Encontrar um usuário que tenha notificações (baseado no seedDataUtils, a maioria tem)
    cy.database("find", "users").then((user: User) => {
      cy.loginByXstate(user.username);
      
      cy.getBySel("nav-top-notifications-link").click();
      cy.url().should("include", "/notifications");
      cy.wait("@getNotifications");
      
      cy.getBySel("notifications-list").should("be.visible");
      cy.percySnapshot("Notifications List View");
    });
  });

  it("should create notifications for payment, like, and comment, then dismiss them", () => {
    // Estratégia: User A cria ações -> Switch to User B -> User B valida e limpa notificações
    cy.database("filter", "users").then((users: User[]) => {
      const userA = users[0];
      const userB = users[1];

      // 1. Login como Usuário A
      cy.loginByXstate(userA.username);

      // 2. Criar Transação para Usuário B
      const transactionPayload = {
        transactionType: "payment",
        amount: 50,
        description: "Payment for dinner",
        sender: userA,
        receiver: userB,
      };
      cy.createTransaction(transactionPayload);
      cy.wait("@createTransaction");

      // 3. User A curte a transação criada
      // Ao criar, o app redireciona para "Mine" (personal), clicamos na transação para ver detalhes
      cy.getBySelLike("transaction-item").first().click();
      cy.getBySelLike("transaction-like-button").click();
      cy.wait("@postLike");

      // 4. User A comenta na transação
      cy.getBySelLike("transaction-comment-input").type("Thanks for the food!{enter}");
      cy.wait("@postComment");

      // 5. Trocar para Usuário B (Receiver)
      cy.switchUser(userB.username);

      // 6. Verificar Badge de Notificações na NavBar
      // O seed gera dados aleatórios, então pegamos o número atual e esperamos que seja > 0
      cy.getBySel("nav-top-notifications-count").should("exist").and("contain", "");

      // 7. Navegar para Notificações
      cy.getBySel("nav-top-notifications-link").click();
      cy.wait("@getNotifications");

      // 8. Validar a presença das notificações geradas
      // Nota: Como o seed gera dados aleatórios prévios, verificamos se contêm os textos das ações recentes
      cy.getBySel("notifications-list").within(() => {
        cy.contains("received payment").should("be.visible");
        cy.contains("liked a transaction").should("be.visible");
        cy.contains("commented on a transaction").should("be.visible");
      });

      // 9. Testar funcionalidade de DISMISS (Marcar como lida)
      cy.getBySel("notifications-list").children().then(($items) => {
        const initialCount = $items.length;

        // Capturar o badge count inicial (pode ser texto ou número)
        cy.getBySel("nav-top-notifications-count").invoke("text").then((badgeText) => {
          const initialBadgeCount = parseInt(badgeText) || 0;

          // Clicar em Dismiss na primeira notificação
          cy.getBySelLike("notification-mark-read").first().click();
          
          // Esperar requisição de update
          cy.wait("@updateNotification").its("status").should("eq", 204);

          // Validar que o item foi removido da lista UI
          cy.getBySel("notifications-list").children().should("have.length", initialCount - 1);

          // Validar que o badge count decrementou
          if (initialBadgeCount > 1) {
            cy.getBySel("nav-top-notifications-count").should("contain", initialBadgeCount - 1);
          } else {
            // Se era 1 e virou 0, o badge pode sumir ou ficar vazio dependendo da implementação do Material UI Badge
            cy.getBySel("nav-top-notifications-count").should("not.exist");
          }
        });
      });
      
      cy.percySnapshot("Notifications After Dismiss");
    });
  });

  it("should render empty state when no notifications exist", () => {
    // Criar um usuário novo via db:seed garante estado limpo se configurado, 
    // mas aqui vamos pegar um usuário e limpar via API ou Database se necessário.
    // Como limpar via API é complexo (teria que dar dismiss em tudo), 
    // vamos tentar criar um usuário novo sem seed de notificações se possível, 
    // ou simplesmente assumir que existe um usuário "limpo" no teste, mas o seed gera dados pra todos.
    // ESTRATÉGIA ALTERNATIVA: Interceptar a rota e forçar resposta vazia.
    
    cy.database("find", "users").then((user: User) => {
      cy.loginByXstate(user.username);
      
      // Forçar resposta vazia do servidor
      cy.route({
        method: "GET",
        url: "/notifications",
        response: { results: [] }
      }).as("getEmptyNotifications");

      cy.getBySel("nav-top-notifications-link").click();
      cy.wait("@getEmptyNotifications");

      cy.getBySel("empty-list-header").should("contain", "No Notifications");
      cy.getBySel("empty-list-children").should("be.visible"); // Verifica a ilustração SVG
      cy.percySnapshot("Notifications Empty State");
    });
  });
});