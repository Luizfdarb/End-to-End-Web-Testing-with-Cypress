describe('Todo Application tests', () => {
    it('Visits the Todo application', () => {
        cy.visit('https://todomvc.com/examples/react/dist/')
    });
    it('Contains todo input element', () => {
        cy.visit('https://todomvc.com/examples/react/dist/')
        cy.get('.new-todo')
    });
    it('Adds a new todo', () => {
        cy.visit('https://todomvc.com/examples/react/dist/')
        cy.get('.new-todo').type('New Todo {enter}')
    });
    it('asserts change in application state', () => {
        cy.visit('https://todomvc.com/examples/react/dist/')
       
        cy.get('.new-todo').type('New Todo {enter}')
        cy.get('.new-todo').type('Another Todo {enter}')
        cy.get(".todo-list").find('li').should('have.length', 2)
    });
    it('asserts inserted todo items are present', () => {
        cy.visit('https://todomvc.com/examples/react/dist/')
       
        cy.get('.new-todo').type('New Todo {enter}')
        cy.get('.new-todo').type('Another Todo {enter}')
        cy.get(".todo-list").find('li').should('have.length', 2)
        cy.get('li:nth-child(1)>div>label').should('have.text', 'New Todo')
        cy.get('li:nth-child(2)>div>label').should('have.text', 'Another Todo')
    });
});
