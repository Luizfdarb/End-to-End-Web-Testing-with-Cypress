import { User } from "../../src/models";

describe("User Settings", () => {
  beforeEach(() => {
    cy.task("db:seed");
    
    // Recupera um usuário do banco de dados para login
    cy.database("find", "users").then((user: User) => {
      // A senha padrão definida nos scripts de seed é 's3cret'
      cy.login(user.username, "s3cret");
    });

    cy.visit("/user/settings");
  });

  it("should render the user settings form with seeded data", () => {
    cy.getBySel("user-settings-form").should("be.visible");
    cy.getBySel("user-settings-firstName-input").should("not.have.value", "");
    cy.getBySel("user-settings-lastName-input").should("not.have.value", "");
    cy.getBySel("user-settings-email-input").should("not.have.value", "");
    cy.getBySel("user-settings-phoneNumber-input").should("not.have.value", "");
  });

  it("should allow a user to update their profile information", () => {
    const newFirstName = "Cypress";
    const newLastName = "Hill";
    const newEmail = "test@cypress.io";
    const newPhone = "(555) 123-4567";

    // Atualiza o Primeiro Nome
    cy.getBySel("user-settings-firstName-input").clear().type(newFirstName);
    
    // Atualiza o Sobrenome
    cy.getBySel("user-settings-lastName-input").clear().type(newLastName);
    
    // Atualiza o Email
    cy.getBySel("user-settings-email-input").clear().type(newEmail);
    
    // Atualiza o Telefone
    cy.getBySel("user-settings-phoneNumber-input").clear().type(newPhone);

    // O botão deve estar habilitado se o formulário for válido
    cy.getBySel("user-settings-submit").should("not.be.disabled").click();

    // Verificação visual ou de comportamento após salvar (O form não redireciona, ele atualiza o estado)
    // Uma boa prática aqui é recarregar a página para garantir que os dados persistiram no backend
    cy.reload();

    // Asserções dos novos valores
    cy.getBySel("user-settings-firstName-input").should("have.value", newFirstName);
    cy.getBySel("user-settings-lastName-input").should("have.value", newLastName);
    cy.getBySel("user-settings-email-input").should("have.value", newEmail);
    cy.getBySel("user-settings-phoneNumber-input").should("have.value", newPhone);
  });

  it("should validate required fields", () => {
    // Limpa os campos para disparar a validação 'required' do Yup
    cy.getBySel("user-settings-firstName-input").clear().blur();
    cy.get("#user-settings-firstName-input-helper-text").should("contain", "Enter a first name");

    cy.getBySel("user-settings-lastName-input").clear().blur();
    cy.get("#user-settings-lastName-input-helper-text").should("contain", "Enter a last name");

    cy.getBySel("user-settings-email-input").clear().blur();
    cy.get("#user-settings-email-input-helper-text").should("contain", "Enter an email address");

    cy.getBySel("user-settings-phoneNumber-input").clear().blur();
    cy.get("#user-settings-phoneNumber-input-helper-text").should("contain", "Enter a phone number");

    // O botão deve estar desabilitado
    cy.getBySel("user-settings-submit").should("be.disabled");
  });

  it("should validate email format", () => {
    cy.getBySel("user-settings-email-input").clear().type("invalid-email").blur();
    
    // O Formik/MUI gera IDs de helper text baseados no ID do input + "-helper-text"
    cy.get("#user-settings-email-input-helper-text").should("contain", "Must contain a valid email address");
    
    cy.getBySel("user-settings-submit").should("be.disabled");
  });

  it("should validate phone number format", () => {
    cy.getBySel("user-settings-phoneNumber-input").clear().type("123").blur();
    
    cy.get("#user-settings-phoneNumber-input-helper-text").should("contain", "Phone number is not valid");
    
    cy.getBySel("user-settings-submit").should("be.disabled");
  });
});