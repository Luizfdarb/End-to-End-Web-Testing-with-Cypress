describe('Notifications', () => {
  beforeEach(() => {
    // ...
  });

it('should create notificações', () => {
  const user = getAllUsers()[0];
  const transaction = createTransaction(user.id, "payment", {
    source: user.id,
    amount: 100,
    description: "Teste de pagamento",
    receiverId: user.id,
  });
  const notificationPayload = [
    {
      type: "payment",
      transactionId: transaction.id,
      status: "received",
    },
  ];
  createNotifications(user.id, notificationPayload);
  cy.getNotificationByUserId(user.id).then((notifications) => {
    expect(notifications).to.have.length(1);
  });
});

it('should marcar notificações como lidas', () => {
  const user = getAllUsers()[0];
  const notification = createNotification(user.id, {
    type: "payment",
    transactionId: getRandomTransaction().id,
    status: "received",
  });
  cy.get(`notification-list-item-${notification.id}`).then(($notification) => {
    cy.get($notification).find("button[data-test='notification-mark-read']").click();
    cy.getNotificationById(notification.id).then((updatedNotification) => {
      expect(updatedNotification.isRead).to.be.true;
    });
  });
});

it('should navegar para detalhes de transação após receber notificação', () => {
  const user = getAllUsers()[0];
  const transaction = createTransaction(user.id, "payment", {
    source: user.id,
    amount: 100,
    description: "Teste de pagamento",
    receiverId: user.id,
  });
  const notificationPayload = [
    {
      type: "payment",
      transactionId: transaction.id,
      status: "received",
    },
  ];
  createNotifications(user.id, notificationPayload);
  cy.wait("@notifications").then(() => {
    cy.get(`notification-list-item-${notificationPayload[0].transactionId}`).then(($notification) => {
      cy.get($notification).find("a[data-test='notification-link']").click();
      cy.url().should("include", `/transaction/${transaction.id}`);
    });
  });
});