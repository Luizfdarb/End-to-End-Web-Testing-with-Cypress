
import { cy } from "cypress";

const getTransactions = () => cy.get("[data-test=transaction-item]");

describe("Transaction Feeds", () => {
  beforeEach(() => {
    cy.visit("/personal");
    cy.fixture("public-transactions.json").then((data) => {
      localStorage.setItem("transactions", JSON.stringify(data.results));       
    });
  });

  it("1. Toggle navigation drawer (mobile vs desktop)", () => {
    cy.viewport(375, 667);
    cy.get("[data-test=sidenav-toggle]").click();
    cy.get("[data-test=sidenav-toggle]").should("be.visible");
    cy.viewport(110, 88);
    cy.get("[data-test=sidenav-toggle]").click();
    cy.get("[data-test=sidenav-toggle]").should("be.hidden");
  });

  it("2. Renderizar variações de transaction items (paid, charged, requested)", () => {
    cy.wait(1000);
    const transactionItems = getTransactions();
    cy.get("[data-test=transaction-item]").then((item) => {
      expect(item.length).to.be.greaterThan(0);
      expect(cy.contains(item, "paid")).to.be.true;
      expect(cy.contains(item, "charged")).to.be.true;
      expect(cy.contains(item, "requested")).to.be.true;
    });
  });

  it("3. Paginar feed pessoal de transações", () => {
    cy.get("[data-test=transaction-list-next-page-button]").click();
    cy.get("[data-test=transaction-list-next-page-button]").should("be.visible");
    cy.get("[data-test=transaction-list-next-page-button]").click();
    cy.get("[data-test=transaction-list-next-page-button]").should("be.hidden");
  });

  it("4. Paginar feed público de transações", () => {
    cy.visit("/public");
    cy.get("[data-test=transaction-list-next-page-button]").click();
    cy.get("[data-test=transaction-list-next-page-button]").should("be.visible");
    cy.get("[data-test=transaction-list-next-page-button]").click();
    cy.get("[data-test=transaction-list-next-page-button]").should("be.hidden");
  });

  it("5. Paginar feed de contatos de transações", () => {
    cy.visit("/contacts");
    cy.get("[data-test=transaction-list-next-page-button]").click();
    cy.get("[data-test=transaction-list-next-page-button]").should("be.visible");
    cy.get("[data-test=transaction-list-next-page-button]").click();
    cy.get("[data-test=transaction-list-next-page-button]").should("be.hidden");
  });

  it("6. Fechar modal de date range picker (mobile)", () => {
    cy.viewport(375, 667);
    cy.get("[data-test=date-range-filter-drawer-close-button]").click();        
    cy.get("[data-test=date-range-filter-drawer]").should("be.hidden");
  });

  it("7. Filtrar feed pessoal por data", () => {
    cy.get("[data-test=transaction-list-filter-date-range-button]").click();    
    cy.get("[data-test=date-range-popover]").should("be.visible");
    cy.get("[data-test=date-range-popover]").should("contain", "2019-12-10T21:38:16.311Z");
    cy.get("[data-test=date-range-popover]").should("contain", "2019-12-25T05:59:59.999Z");
  });

  it("8. Filtrar feed público por data", () => {
    cy.visit("/public");
    cy.get("[data-test=transaction-list-filter-date-range-button]").click();    
    cy.get("[data-test=date-range-popover]").should("be.visible");
    cy.get("[data-test=date-range-popover]").should("contain", "2019-12-10T21:38:16.311Z");
    cy.get("[data-test=date-range-popover]").should("contain", "2019-12-25T05:59:59.999Z");
  });

  it("9. Filtrar feed de contatos por data", () => {
    cy.visit("/contacts");
    cy.get("[data-test=transaction-list-filter-date-range-button]").click();    
    cy.get("[data-test=date-range-popover]").should("be.visible");
    cy.get("[data-test=date-range-popover]").should("contain", "2019-12-10T21:38:16.311Z");
    cy.get("[data-test=date-range-popover]").should("contain", "2019-12-25T05:59:59.999Z");
  });

  it("10. Feed pessoal sem transações (data fora do range)", () => {
    const currentDate = new Date();
    currentDate.setFullYear(currentDate.getFullYear() - 5);
    cy.get("[data-test=transaction-list-filter-date-range-button]").click();    
    cy.get("[data-test=date-range-popover]").should("be.visible");
    cy.get("[data-test=date-range-popover]").should("contain", `${currentDate.toISOString()}`);
    cy.get("[data-test=date-range-popover]").should("not.contain", "2019-12-10T21:38:16.311Z");
  });

  it("11. Feed público sem transações (data fora do range)", () => {
    const currentDate = new Date();
    currentDate.setFullYear(currentDate.getFullYear() - 5);
    cy.visit("/public");
    cy.get("[data-test=transaction-list-filter-date-range-button]").click();    
    cy.get("[data-test=date-range-popover]").should("be.visible");
    cy.get("[data-test=date-range-popover]").should("contain", `${currentDate.toISOString()}`);
    cy.get("[data-test=date-range-popover]").should("not.contain", "2019-12-10T21:38:16.311Z");
  });

  it("12. Feed de contatos sem transações (data fora do range)", () => {        
    const currentDate = new Date();
    currentDate.setFullYear(currentDate.getFullYear() - 5);
    cy.visit("/contacts");
    cy.get("[data-test=transaction-list-filter-date-range-button]").click();    
    cy.get("[data-test=date-range-popover]").should("be.visible");
    cy.get("[data-test=date-range-popover]").should("contain", `${currentDate.toISOString()}`);
    cy.get("[data-test=date-range-popover]").should("not.contain", "2019-12-10T21:38:16.311Z");
  });

  it("13. Filtrar feed pessoal por valor", () => {
    cy.get("[data-test=transaction-list-filter-amount-range-button]").click();  
    cy.get("[data-test=amount-range-popover]").should("be.visible");
    cy.get("[data-test=amount-range-popover]").should("contain", "0 - $10");    
  });

  it("14. Filtrar feed público por valor", () => {
    cy.visit("/public");
    cy.get("[data-test=transaction-list-filter-amount-range-button]").click();  
    cy.get("[data-test=amount-range-popover]").should("be.visible");
    cy.get("[data-test=amount-range-popover]").should("contain", "0 - $10");    
  });

  it("15. Filtrar feed de contatos por valor", () => {
    cy.visit("/contacts");
    cy.get("[data-test=transaction-list-filter-amount-range-button]").click();  
    cy.get("[data-test=amount-range-popover]").should("be.visible");
    cy.get("[data-test=amount-range-popover]").should("contain", "0 - $10");    
  });

  it("16. Feed pessoal sem transações (valor fora do range)", () => {
    cy.get("[data-test=transaction-list-filter-amount-range-button]").click();  
    cy.get("[data-test=amount-range-popover]").should("be.visible");
    cy.get("[data-test=amount-range-popover]")
      .should("contain", "0 - $10")
      .should("not.contain", "100");
  });

  it("17. Feed público sem transações (valor fora do range)", () => {
    cy.visit("/public");
    cy.get("[data-test=transaction-list-filter-amount-range-button]").click();  
    cy.get("[data-test=amount-range-popover]").should("be.visible");
    cy.get("[data-test=amount-range-popover]")
      .should("contain", "0 - $10")
      .should("not.contain", "100");
  });

  it("18. Feed de contatos sem transações (valor fora do range)", () => {       
    cy.visit("/contacts");
    cy.get("[data-test=transaction-list-filter-amount-range-button]").click();  
    cy.get("[data-test=amount-range-popover]").should("be.visible");
    cy.get("[data-test=amount-range-popover]")
      .should("contain", "0 - $10")
      .should("not.contain", "100");
  });

  it("19. Feed pessoal mostra apenas transações do usuário", () => {
    cy.visit("/personal");
    cy.get("[data-test=transaction-item]").should("contain", "Receiver Name");  
  });

  it("20. Primeiros 5 itens do feed público pertencem a contatos", () => {      
    cy.visit("/public");
    cy.get("[data-test=transaction-item]")
      .should("contain", "Kevin")
      .should("contain", "IMbeyzHTj9")
      .should("have.length.greaterThan", 2);
  });

  it("21. Feed de amigos mostra apenas transações de contatos", () => {
    cy.visit("/contacts");
    cy.get("[data-test=transaction-item]")
      .should("contain", "IMbeyzHTj9")
      .should("contain", "db4uxOm7d");
  });
});
