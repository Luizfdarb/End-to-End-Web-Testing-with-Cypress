
/// <reference path="global.d.ts" />

import 'cypress-file-upload';
import 'cypress-realworld-app/cypress/plugins/index';
import 'cypress-realworld-app/cypress/support/commands';
import cypressConfig from 'cypress-realworld-app/cypress/config';
import { beforeEach, describe, it } from 'mocha';
import { expect } from 'chai';
import { signInForm } from '@shared/utils';
import { AuthForm } from '../forms/AuthForm';
import { User } from 'models/User';

describe('Real World App tests', () => {

  const signIn = async (username: string, password: string) => {
    cy.get(AuthForm.usernameFieldSelector).type(username);
    cy.get(AuthForm.passwordFieldSelector).type(password);
    cy.get(AuthForm.signInButtonSelector).click();
    cy.wait('@loginUser');
  };

  beforeEach(async () => {
    cy.get(AuthForm.signInButtonSelector).click();
  });

  describe('User sign-up', () => {
    const signup = async (formData: any) => {
      cy.wait(1000);
      cy.get(AuthForm.signUpButtonSelector).click();
      cy.get(AuthForm.firstNameFieldSelector).type(formData.firstName);
      cy.get(AuthForm.lastNameFieldSelector).type(formData.lastName);
      cy.get(AuthForm.usernameFieldSelector).type(formData.username);
      cy.get(AuthForm.passwordFieldSelector).type(formData.password);
      cy.get(AuthForm.confirmPasswordFieldSelector).type(formData.password);
      cy.get(AuthForm.signUpButtonSelector).click();
      cy.wait('@SignupUser');
    };

    it('should show the sign-up form', () => {
      cy.get(AuthForm.signUpFormSelector).should('be.visible');
    });

    it('should validate the sign-up form with an empty field', () => {
      signInForm(() => {
        signup({ firstName: '', lastName: '', username: '', password: 'password' });
      });
      cy.get(AuthForm.errorMessagesSelector + 'firstNameError').should('be.visible');
      cy.get(AuthForm.errorMessagesSelector + 'lastNameError').should('be.visible');
      cy.get(AuthForm.errorMessagesSelector + 'usernameError').should('be.visible');
    });

    it('should validate the sign-up form with an invalid password', () => {
      signInForm(() => {
        signup({ firstName: 'john', lastName: 'doe', username: 'johndoe', password: 'pass' });
      });
      cy.get(AuthForm.errorMessagesSelector + 'passwordError').should('be.visible');
    });

    it('should validate the sign-up form with a password mismatch', () => {
      signInForm(() => {
        signup({ firstName: 'john', lastName: 'doe', username: 'johndoe', password: 'password123', confirmPassword: 'password' });
      });
      cy.get(AuthForm.errorMessagesSelector + 'passwordError').should('be.visible');
    });

    it('should create a user account when all fields are valid', () => {
      cy.log('Creating user account...');
      cy.get(AuthForm.signUpFormSelector).should('be.visible');
      cy.get(AuthForm.signUpButtonSelector).click();
      cy.get(AuthForm.firstNameFieldSelector).type('John');
      cy.get(AuthForm.lastNameFieldSelector).type('Doe');
      cy.get(AuthForm.usernameFieldSelector).type('johndoe');
      cy.get(AuthForm.passwordFieldSelector).type('password');
      cy.get(AuthForm.confirmPasswordFieldSelector).type('password');
      cy.get(AuthForm.signUpButtonSelector).click();
      cy.wait('@SignupUser');
      cy.get(User.userTableSelector).then((userTable) => {
        cy.log('Verifying user account is created...');
        userTable.contains('tbody', 'johndoe');
      });
    });
  });

  describe('User sign-in', () => {
    it('should redirect to signin form when sign-in button is clicked', () => {
      cy.get(AuthForm.signInButtonSelector).click();
      cy.location().should((location) => {
        expect(location.pathname).to.eq('/signin');
      });
    });

    it('should authenticate a user if valid credentials are entered', () => {
      cy.log('Authenticating user...');
      signIn('john', 'password123');
      cy.wait('@loginUser');
      cy.get(User.userTableSelector).then((userTable) => {
        cy.log('Verifying user has logged in...');
        userTable.contains('tbody', 'john');
      });
    });

    it('should display an error message if invalid credentials are entered', () => {
      cy.log('Authenticating invalid user...');
      signIn('invalid_user', 'invalid_password');
      cy.wait('@loginUser');
      cy.get(User.errorMessagesSelector).should('be.visible');
    });
  });

  describe('User logout', () => {
    it('should display the logout button when the user is logged in', () => {
      cy.get(AuthForm.logoutButtonSelector).should('be.visible');
    });

    it('should log out the user when the logout button is clicked', () => {
      cy.log('Logging out user...');
      cy.get(AuthForm.logoutButtonSelector).click();
      cy.wait('@LogoutUser');
      cy.get(User.userTableSelector).then((userTable) => {
        cy.log('Verifying user has logged out...');
        userTable.should('not.contain', 'john');
      });
    });
  });

  describe('Error messages', () => {
    it('should display an error message if the user tries to log in with invalid credentials', () => {
      cy.get(User.errorMessagesSelector).should('be.visible');
    });

    it('should display an error message if the user tries to sign up with empty fields', () => {
      cy.get(AuthForm.errorMessagesSelector + 'firstNameError').should('be.visible');
      cy.get(AuthForm.errorMessagesSelector + 'lastNameError').should('be.visible');
      cy.get(AuthForm.errorMessagesSelector + 'usernameError').should('be.visible');
    });

    it('should display an error message if the user tries to sign up with an invalid password', () => {
      cy.get(AuthForm.errorMessagesSelector + 'passwordError').should('be.visible');
    });
  });
});
