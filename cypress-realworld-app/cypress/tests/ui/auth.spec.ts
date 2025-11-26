
/// <reference types="cypress" />

describe('Autenticação', () => {
    // Cenário 1: Redirecionamento não autenticado (/personal → /signin)
    it('Redireciona para a página de login quando não autenticado', () => {
        // Visita a página /personal sem estar autenticado
        cy.visit('/personal', { failOnStatusCode: false })

        // Verifica se a página de login foi carregada
        cy.location('pathname').should('eq', '/signin')
    })

    // Cenário 2: Login com remember me + verificar cookie + logout
    it('Faz login com remember me e verifica cookie', () => {
        // Visita a página de login
        cy.visit('/signin')

        // Preenche os campos de login com credenciais válidas
        cy.get('[data-test="signin-username"]').type('seu_username')
        cy.get('[data-test="signin-password"]').type('sua_senha')

        // Marca a opção "Lembre-me"
        cy.get('[data-test="signin-remember-me"]').check()

        // Clica no botão de login
        cy.get('[data-test="signin-submit"]').click()

        // Verifica se a página foi redirecionada para /
        cy.location('pathname').should('eq', '/')

        // Verifica se o cookie de autenticação foi criado
        cy.getCookie('connect.sid').should('exist')

        // Clica no botão de logout
        cy.get('[data-test="sidenav-signout"]').click()

        // Verifica se o cookie de autenticação foi removido
        cy.getCookie('connect.sid').should('not.exist')
    })

    // Cenário 3: Signup completo + onboarding + dashboard
    it('Faz signup completo e verifica onboarding e dashboard', () => {
        // Visita a página de cadastro
        cy.visit('/signup')

        // Preenche os campos de cadastro
        cy.get('[data-test="signup-username"]').type('novo_username')
        cy.get('[data-test="signup-password"]').type('nova_senha')
        cy.get('[data-test="signup-confirmPassword"]').type('nova_senha')       

        // Clica no botão de cadastro
        cy.get('[data-test="signup-submit"]').click()

        // Verifica se a página de onboarding foi carregada
        cy.location('pathname').should('eq', '/onboarding')

        // Clica no botão de avançar no onboarding
        cy.get('[data-test="onboarding-next"]').click()

        // Verifica se a página de dashboard foi carregada
        cy.location('pathname').should('eq', '/')
    })

    // Cenário 4: Validações login (campos obrigatórios + botão disabled)       
    it('Valida campos obrigatórios no login e verifica botão disabled', () => { 
        // Visita a página de login
        cy.visit('/signin')

        // Verifica se os campos de login estão vazios
        cy.get('[data-test="signin-username"]').should('have.value', '')        
        cy.get('[data-test="signin-password"]').should('have.value', '')        

        // Verifica se o botão de login está desabilitado
        cy.get('[data-test="signin-submit"]').should('be.disabled')

        // Preenche apenas um dos campos
        cy.get('[data-test="signin-username"]').type('seu_username')

        // Verifica se o botão de login ainda está desabilitado
        cy.get('[data-test="signin-submit"]').should('be.disabled')
    })

    // Cenário 5: Validações signup (todos campos + password mismatch)
    it('Valida campos de cadastro e verifica senha não corresponde', () => {    
        // Visita a página de cadastro
        cy.visit('/signup')

        // Deixa os campos de cadastro vazios
        cy.get('[data-test="signup-username"]').should('have.value', '')        
        cy.get('[data-test="signup-password"]').should('have.value', '')        
        cy.get('[data-test="signup-confirmPassword"]').should('have.value', '') 

        // Verifica se os campos de cadastro estão vazios
        cy.get('[data-test="signup-submit"]').should('be.disabled')

        // Preenche os campos de cadastro com senha não correspondente
        cy.get('[data-test="signup-username"]').type('novo_username')
        cy.get('[data-test="signup-password"]').type('nova_senha')
        cy.get('[data-test="signup-confirmPassword"]').type('senha_diferente')  

        // Verifica se o botão de cadastro ainda está desabilitado
        cy.get('[data-test="signup-submit"]').should('be.disabled')
    })

    // Cenário 6: Erro credenciais inválidas
    it('Exibe erro ao tentar fazer login com credenciais inválidas', () => {    
        // Visita a página de login
        cy.visit('/signin')

        // Preenche os campos de login com credenciais inválidas
        cy.get('[data-test="signin-username"]').type('username_invalido')       
        cy.get('[data-test="signin-password"]').type('senha_invalida')

        // Clica no botão de login
        cy.get('[data-test="signin-submit"]').click()

        // Verifica se uma mensagem de erro foi exibida
        cy.get('[data-test="signin-error"]').should('be.visible')
    })

    // Cenário 7: Erro senha incorreta
    it('Exibe erro ao tentar fazer login com senha incorreta', () => {
        // Visita a página de login
        cy.visit('/signin')

        // Preenche os campos de login com senha incorreta
        cy.get('[data-test="signin-username"]').type('seu_username')
        cy.get('[data-test="signin-password"]').type('senha_incorreta')

        // Clica no botão de login
        cy.get('[data-test="signin-submit"]').click()

        // Verifica se uma mensagem de erro foi exibida
        cy.get('[data-test="signin-error"]').should('be.visible')
    })
})
