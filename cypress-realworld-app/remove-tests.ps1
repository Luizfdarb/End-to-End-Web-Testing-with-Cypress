# Script para remover todos os testes de aceitação - Pesquisa TCC
# Mantém apenas estrutura básica para reconstrução

$testFiles = @(
    "cypress\tests\api\api-bankaccounts.spec.ts",
    "cypress\tests\api\api-banktransfers.spec.ts", 
    "cypress\tests\api\api-comments.spec.ts",
    "cypress\tests\api\api-contacts.spec.ts",
    "cypress\tests\api\api-likes.spec.ts",
    "cypress\tests\api\api-notifications.spec.ts",
    "cypress\tests\api\api-testdata.spec.ts",
    "cypress\tests\api\api-transactions.spec.ts",
    "cypress\tests\ui\auth.spec.ts",
    "cypress\tests\ui\bankaccounts.spec.ts",
    "cypress\tests\ui\new-transaction.spec.ts",
    "cypress\tests\ui\notifications.spec.ts",
    "cypress\tests\ui\transaction-feeds.spec.ts",
    "cypress\tests\ui\transaction-view.spec.ts",
    "cypress\tests\ui\user-settings.spec.ts"
)

foreach ($file in $testFiles) {
    $fileName = Split-Path $file -Leaf
    $testName = $fileName -replace ".spec.ts", ""
    
    if ($file -like "*\api\*") {
        $content = @"
// API $testName Tests - REMOVIDO PARA PESQUISA TCC
// Todos os testes foram removidos para permitir reconstrução e análise de cobertura

describe("$testName API", function () {
  // Testes removidos - serão recriados para análise de cobertura
});
"@
    } else {
        $content = @"
// UI $testName Tests - REMOVIDO PARA PESQUISA TCC  
// Todos os testes foram removidos para permitir reconstrução e análise de cobertura

describe("$testName UI", function () {
  // Testes removidos - serão recriados para análise de cobertura
});
"@
    }
    
    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "Removido: $file" -ForegroundColor Green
}

Write-Host "`nTodos os testes foram removidos com sucesso!" -ForegroundColor Yellow
Write-Host "Backup disponível em: cypress-tests-backup\" -ForegroundColor Cyan
