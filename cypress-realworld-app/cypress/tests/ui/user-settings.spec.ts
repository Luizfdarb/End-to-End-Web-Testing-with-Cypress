describe('User Settings', () => {
  beforeEach(() => {
    cy.createUser('Test User');
    cy.login('Test User', 'abc123');
  });

  it('should update user settings', () => {
    cy.visit('/user/settings');
    cy.fillUserSettingsForm({
      firstName: 'Renan',
      lastName: 'Silva',
      email: 'rsilva@example.com',
      phoneNumber: '81999888888',
      defaultPrivacyLevel: 'private',
    });
  });

  describe('Validations', () => {
    beforeEach(() => {
      cy.createUser('Test User');
      cy.login('Test User', 'abc123');
      cy.visit('/user/settings');
    });

    it('should fill all required fields', () => {
      cy.get('form').as('form');
      cy.get('@form').find('input').each((index, field) => {
        const label = field.get(0).nextElementSibling.textContent;
        const value = field.val();
        expect(value).to.not.be.empty;
        expect(value).to.contain(label);
      });
    });
  });
});