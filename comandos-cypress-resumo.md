# 🚀 Comandos Cypress - Resumo Executivo

## 📋 Pré-requisitos
```bash
node --version    # v16.14.0+
npm --version     # 8.3.1+
cypress --version # 6.2.1
```

## 🎯 Capítulos Recomendados para Modo Interativo (cypress:open)

### ✅ **Capítulo 3 - Configuração Básica**
```bash
cd chapter-03
npm install
npm run cypress:open
```
**Por que usar open:** Múltiplos comandos avançados disponíveis (Chrome, Firefox, tablet-view)

### ✅ **Capítulo 4 - Assertions**
```bash
cd chapter-04
npm install
npm run cypress:open
```
**Por que usar open:** Ver assertions em ação em tempo real

### ✅ **Capítulo 5 - Debugging**
```bash
cd chapter-05
npm install
npm run cypress:open
```
**Por que usar open:** Foco em debugging - melhor experiência visual

### ✅ **Capítulo 6 - TDD (React App)**
```bash
# Terminal 1: Iniciar app React
cd chapter-06/tdd-todo-app
npm install
npm start

# Terminal 2: Executar testes
cd chapter-06/tdd-todo-app
npm run cypress:open
```
**Por que usar open:** Aplicação React completa - melhor para desenvolvimento

### ✅ **Real World App**
```bash
# Terminal 1: Iniciar aplicação
cd cypress-realworld-app
npm install
npm run start

# Terminal 2: Executar testes
cd cypress-realworld-app
npm run cypress:open
```
**Por que usar open:** Aplicação completa - melhor para prática real

## 📖 Outros Capítulos (cypress:run recomendado)

### Capítulo 7 - Actionability
```bash
cd chapter-07
npm install
npm run cypress:run
```

### Capítulo 8 - Aliases e Variáveis
```bash
cd chapter-08
npm install
npm run cypress:run
```

### Capítulo 9 - Intercepts e Stubs
```bash
cd chapter-09
npm install
npm run cypress:run
```

### Capítulos 10-12 - Real World App
```bash
# Opção 1: Usar Real World App (Recomendado)
cd chapter-10  # ou 11, 12
npm install
npm run cypress-app-windows

# Opção 2: Executar diretamente
cd chapter-10  # ou 11, 12
npm install
npm run cypress:run
```

## 🔄 Script para Executar Todos os Capítulos
```bash
# Windows PowerShell
for /d %i in (chapter-*) do (
    cd %i
    npm install
    npm run cypress:run
    cd ..
)
```

## 🎯 Comandos Avançados do Capítulo 3
```bash
cd chapter-03
npm run cypress:chrome        # Chrome
npm run cypress:firefox       # Firefox
npm run cypress:tablet-view   # Tablet
npm run cypress:electron:headed # Headed mode
```

## 🌍 Real World App - Comandos Específicos
```bash
cd cypress-realworld-app
npm run test:api              # Testes de API
npm run test:unit             # Testes unitários
npm run cypress:open:mobile   # Modo mobile
```

## 💡 Dicas Importantes

### ✅ **Sempre execute:**
```bash
npm install  # Em cada capítulo antes de executar
```

### ✅ **Para debug:**
```bash
npm run cypress:open  # Modo interativo
```

### ✅ **Para CI/CD:**
```bash
npm run cypress:run   # Modo headless
```

### ⚠️ **Problemas comuns:**
- **URLs inválidas:** Atualizar para `https://demo.playwright.dev/todomvc/`
- **Dependências:** Sempre `npm install` em cada capítulo
- **Versão Cypress:** Manter na versão 6.2.1

## 📊 Resumo de Recomendações

| Capítulo | Modo Recomendado | Por quê |
|----------|------------------|---------|
| 3 | **cypress:open** | Múltiplos comandos avançados |
| 4 | **cypress:open** | Ver assertions em ação |
| 5 | **cypress:open** | Foco em debugging |
| 6 | **cypress:open** | App React completa |
| 7-9 | cypress:run | Testes simples |
| 10-12 | **cypress:open** | Real World App |
| Real World | **cypress:open** | Prática completa |

## 🎉 Próximos Passos
1. Comece pelo **Capítulo 3** com `cypress:open`
2. Pratique com **Real World App**
3. Explore comandos avançados do Capítulo 3
4. Use `cypress:run` para automação
5. Experimente diferentes browsers e viewports
