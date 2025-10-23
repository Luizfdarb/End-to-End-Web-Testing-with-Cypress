import Dinero from "dinero.js";
import {
  User,
  Transaction,
  Contact,
  TransactionStatus,
} from "../../../src/models";
import { addDays, isWithinInterval, startOfDay } from "date-fns";
import { isMobile } from "../../support/utils";

const { _ } = Cypress;

type TransactionFeedsCtx = {
  allUsers?: User[];
  user?: User;
  contactIds?: string[];
};

describe("Transaction Feed", function () {
  const ctx: TransactionFeedsCtx = {};

  const feedViews = {
    public: {
      tab: "public-tab",
      tabLabel: "everyone",
      routeAlias: "publicTransactions",
      service: "publicTransactionService",
    },
    contacts: {
      tab: "contacts-tab",
      tabLabel: "friends",
      routeAlias: "contactsTransactions",
      service: "contactTransactionService",
    },
    personal: {
      tab: "personal-tab",
      tabLabel: "mine",
      routeAlias: "personalTransactions",
      service: "personalTransactionService",
    },
  };

  beforeEach(function () {
    cy.task("db:seed");

    cy.server();
    cy.route("GET", "/notifications").as("notifications");
    cy.route("/transactions*").as(feedViews.personal.routeAlias);
    cy.route("/transactions/public*").as(feedViews.public.routeAlias);
    cy.route("/transactions/contacts*").as(feedViews.contacts.routeAlias);

    cy.database("filter", "users").then((users: User[]) => {
      ctx.user = users[0];
      ctx.allUsers = users;

      cy.loginByXstate(ctx.user.username);
    });
  });

  describe("app layout and responsiveness", function () {
    it("toggles the navigation drawer", function () {
      cy.wait("@notifications");
      if (isMobile()) {
        cy.getBySel("sidenav-home").should("not.be.visible");
        cy.percySnapshot("Mobile Initial Side Navigation Not Visible");
        cy.getBySel("sidenav-toggle").click();
        cy.getBySel("sidenav-home").should("be.visible");
        cy.percySnapshot("Mobile Toggle Side Navigation Visible");
        cy.get(".MuiBackdrop-root").click({ force: true });
        cy.getBySel("sidenav-home").should("not.be.visible");
        cy.percySnapshot("Mobile Home Link Side Navigation Not Visible");

        cy.getBySel("sidenav-toggle").click();
        cy.getBySel("sidenav-home").click();
        cy.getBySel("sidenav-home").should("not.be.visible");
        cy.percySnapshot("Mobile Toggle Side Navigation Not Visible After Click");
      } else {
        cy.getBySel("sidenav-home").should("be.visible");
        cy.percySnapshot("Desktop Side Navigation Visible");
        cy.getBySel("sidenav-toggle").click();
        cy.getBySel("sidenav-home").should("not.be.visible");
        cy.percySnapshot("Desktop Side Navigation Not Visible");
      }
    });
  });

  describe("renders and paginates all transaction feeds", function () {
    it("renders transactions item variations in feed", function () {
      cy.route("/transactions/public*", "fixture:public-transactions").as(
        "mockedPublicTransactions"
      );
      cy.visit("/");
      cy.wait("@notifications");
      cy.wait("@mockedPublicTransactions")
        .its("response.body.results")
        .then((transactions) => {
          cy.contains("[data-test*='transaction-item']", "paid").within(function () {
            cy.getBySelLike("amount")
              .should("contain", "-")
              .and("have.css", "color", "rgb(255, 0, 0)");
          });

          cy.contains("[data-test*='transaction-item']", "charged").within(function () {
            cy.getBySelLike("amount")
              .should("contain", "+")
              .and("have.css", "color", "rgb(76, 175, 80)");
          });

          cy.contains("[data-test*='transaction-item']", "requested").within(function () {
            cy.getBySelLike("amount")
              .should("contain", "+")
              .and("have.css", "color", "rgb(76, 175, 80)");
          });
          cy.percySnapshot("Transaction Item Variations");
        });
    });

    it("paginates personal transaction feed", function () {
      const feed = feedViews.personal;
      cy.getBySelLike(feed.tab).click().should("have.class", "Mui-selected");
      cy.wait(`@${feed.routeAlias}`);
      cy.getBySel("transaction-list").children().scrollTo("bottom");
      cy.wait(`@${feed.routeAlias}`).its("response.body.pageData.page").should("equal", 2);
      cy.percySnapshot("Paginate Personal Feed");
    });

    it("paginates public transaction feed", function () {
      const feed = feedViews.public;
      cy.getBySelLike(feed.tab).click().should("have.class", "Mui-selected");
      cy.wait(`@${feed.routeAlias}`);
      cy.getBySel("transaction-list").children().scrollTo("bottom");
      cy.wait(`@${feed.routeAlias}`).its("response.body.pageData.page").should("equal", 2);
      cy.percySnapshot("Paginate Public Feed");
    });

    it("paginates contacts transaction feed", function () {
      const feed = feedViews.contacts;
      cy.getBySelLike(feed.tab).click().should("have.class", "Mui-selected");
      cy.wait(`@${feed.routeAlias}`);
      cy.getBySel("transaction-list").children().scrollTo("bottom");
      cy.wait(`@${feed.routeAlias}`).its("response.body.pageData.page").should("equal", 2);
      cy.percySnapshot("Paginate Contacts Feed");
    });
  });

  describe("filters transaction feeds by date range", function () {
    it("closes date range picker modal on mobile", function () {
      if (isMobile()) {
        cy.getBySelLike("filter-date-range-button").click({ force: true });
        cy.get(".Cal__Header__root").should("be.visible");
        cy.percySnapshot("Mobile Open Date Range Picker");
        cy.getBySel("date-range-filter-drawer-close").click();
        cy.get(".Cal__Header__root").should("not.be.visible");
        cy.percySnapshot("Mobile Close Date Range Picker");
      }
    });

    it("filters personal transaction feed by date range", function () {
      cy.getBySelLike(feedViews.personal.tab).click();
      cy.database("find", "transactions").then((transaction: Transaction) => {
        const dateRangeStart = startOfDay(new Date(transaction.createdAt));
        const dateRangeEnd = addDays(dateRangeStart, 1);
        cy.pickDateRange(dateRangeStart, dateRangeEnd);
        cy.wait(`@${feedViews.personal.routeAlias}`);
        cy.getBySelLike("transaction-item").should("have.length.gt", 0);
        cy.percySnapshot("Filter Personal Feed by Date");
      });
    });

    it("filters public transaction feed by date range", function () {
      cy.getBySelLike(feedViews.public.tab).click();
      cy.database("find", "transactions").then((transaction: Transaction) => {
        const dateRangeStart = startOfDay(new Date(transaction.createdAt));
        const dateRangeEnd = addDays(dateRangeStart, 1);
        cy.pickDateRange(dateRangeStart, dateRangeEnd);
        cy.wait(`@${feedViews.public.routeAlias}`);
        cy.getBySelLike("transaction-item").should("have.length.gt", 0);
        cy.percySnapshot("Filter Public Feed by Date");
      });
    });

    it("filters contacts transaction feed by date range", function () {
      cy.getBySelLike(feedViews.contacts.tab).click();
      cy.database("find", "transactions").then((transaction: Transaction) => {
        const dateRangeStart = startOfDay(new Date(transaction.createdAt));
        const dateRangeEnd = addDays(dateRangeStart, 1);
        cy.pickDateRange(dateRangeStart, dateRangeEnd);
        cy.wait(`@${feedViews.contacts.routeAlias}`);
        cy.getBySelLike("transaction-item").should("have.length.gt", 0);
        cy.percySnapshot("Filter Contacts Feed by Date");
      });
    });

    it("shows no personal transactions for out of range date limits", function () {
      cy.getBySelLike(feedViews.personal.tab).click();
      const dateRangeStart = new Date(2014, 1, 1);
      const dateRangeEnd = addDays(dateRangeStart, 1);
      cy.pickDateRange(dateRangeStart, dateRangeEnd);
      cy.wait(`@${feedViews.personal.routeAlias}`);
      cy.getBySel("empty-list-header").should("contain", "No Transactions");
      cy.percySnapshot("No Personal Transactions for Date Range");
    });

    it("shows no public transactions for out of range date limits", function () {
      const dateRangeStart = new Date(2014, 1, 1);
      const dateRangeEnd = addDays(dateRangeStart, 1);
      cy.pickDateRange(dateRangeStart, dateRangeEnd);
      cy.wait(`@${feedViews.public.routeAlias}`);
      cy.getBySel("empty-list-header").should("contain", "No Transactions");
      cy.percySnapshot("No Public Transactions for Date Range");
    });

    it("shows no contacts transactions for out of range date limits", function () {
      cy.getBySelLike(feedViews.contacts.tab).click();
      const dateRangeStart = new Date(2014, 1, 1);
      const dateRangeEnd = addDays(dateRangeStart, 1);
      cy.pickDateRange(dateRangeStart, dateRangeEnd);
      cy.wait(`@${feedViews.contacts.routeAlias}`);
      cy.getBySel("empty-list-header").should("contain", "No Transactions");
      cy.percySnapshot("No Contacts Transactions for Date Range");
    });
  });

  describe("filters transaction feeds by amount range", function () {
    const amountRange = { min: 200, max: 800 };

    it("filters personal transaction feed by amount range", function () {
      cy.getBySelLike(feedViews.personal.tab).click();
      cy.setTransactionAmountRange(amountRange.min, amountRange.max);
      cy.wait(`@${feedViews.personal.routeAlias}`);
      cy.getBySelLike("transaction-item").should("have.length.gt", 0);
      cy.percySnapshot("Filter Personal Feed by Amount");
    });

    it("filters public transaction feed by amount range", function () {
      cy.setTransactionAmountRange(amountRange.min, amountRange.max);
      cy.wait(`@${feedViews.public.routeAlias}`);
      cy.getBySelLike("transaction-item").should("have.length.gt", 0);
      cy.percySnapshot("Filter Public Feed by Amount");
    });

    it("filters contacts transaction feed by amount range", function () {
      cy.getBySelLike(feedViews.contacts.tab).click();
      cy.setTransactionAmountRange(amountRange.min, amountRange.max);
      cy.wait(`@${feedViews.contacts.routeAlias}`);
      cy.getBySelLike("transaction-item").should("have.length.gt", 0);
      cy.percySnapshot("Filter Contacts Feed by Amount");
    });

    it("shows no personal transactions for out of range amount limits", function () {
      cy.getBySelLike(feedViews.personal.tab).click();
      cy.setTransactionAmountRange(950, 1000);
      cy.wait(`@${feedViews.personal.routeAlias}`);
      cy.getBySel("empty-list-header").should("contain", "No Transactions");
      cy.percySnapshot("No Personal Transactions for Amount Range");
    });

    it("shows no public transactions for out of range amount limits", function () {
      cy.setTransactionAmountRange(950, 1000);
      cy.wait(`@${feedViews.public.routeAlias}`);
      cy.getBySel("empty-list-header").should("contain", "No Transactions");
      cy.percySnapshot("No Public Transactions for Amount Range");
    });

    it("shows no contacts transactions for out of range amount limits", function () {
      cy.getBySelLike(feedViews.contacts.tab).click();
      cy.setTransactionAmountRange(950, 1000);
      cy.wait(`@${feedViews.contacts.routeAlias}`);
      cy.getBySel("empty-list-header").should("contain", "No Transactions");
      cy.percySnapshot("No Contacts Transactions for Amount Range");
    });
  });

  describe("Feed Item Visibility", function () {
    it("mine feed only shows personal transactions", function () {
      cy.getBySelLike(feedViews.personal.tab).click();
      cy.wait("@personalTransactions")
        .its("response.body.results")
        .each((transaction: Transaction) => {
          const participants = [transaction.senderId, transaction.receiverId];
          expect(participants).to.include(ctx.user!.id);
        });
      cy.percySnapshot("Personal Feed Visibility");
    });

    it("first five items in public feed belong to contacts", function () {
      cy.database("filter", "contacts", { userId: ctx.user!.id }).then(
        (contacts: Contact[]) => {
          ctx.contactIds = contacts.map((contact) => contact.contactUserId);
        }
      );
      cy.wait("@publicTransactions")
        .its("response.body.results")
        .invoke("slice", 0, 5)
        .each((transaction: Transaction) => {
          const participants = [transaction.senderId, transaction.receiverId];
          const contactsInTransaction = _.intersection(participants, ctx.contactIds!);
          expect(contactsInTransaction).to.not.be.empty;
        });
      cy.percySnapshot("Public Feed First 5 Items Visibility");
    });

    it("friends feed only shows contact transactions", function () {
      cy.database("filter", "contacts", { userId: ctx.user!.id }).then(
        (contacts: Contact[]) => {
          ctx.contactIds = contacts.map((contact) => contact.contactUserId);
        }
      );
      cy.getBySelLike(feedViews.contacts.tab).click();
      cy.wait("@contactsTransactions")
        .its("response.body.results")
        .each((transaction: Transaction) => {
          const participants = [transaction.senderId, transaction.receiverId];
          const contactsInTransaction = _.intersection(ctx.contactIds!, participants);
          expect(contactsInTransaction).to.not.be.empty;
        });
      cy.percySnapshot("Contacts Feed Visibility");
    });
  });
});