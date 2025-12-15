# Script para configurar e fazer pull do repositório Git
# Execute este script após instalar o Git

Write-Host "Configurando repositório Git..." -ForegroundColor Cyan

# Verificar se Git está instalado
try {
    $gitVersion = git --version
    Write-Host "Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Git não está instalado ou não está no PATH" -ForegroundColor Red
    Write-Host "Por favor, instale o Git de: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Verificar se já é um repositório git
if (Test-Path .git) {
    Write-Host "Repositório Git já existe. Fazendo pull..." -ForegroundColor Yellow
    git pull origin main
    if ($LASTEXITCODE -ne 0) {
        git pull origin master
    }
} else {
    Write-Host "Inicializando repositório Git..." -ForegroundColor Cyan
    
    # Inicializar repositório
    git init
    
    # Adicionar remote
    git remote add origin https://github.com/DiogoCrespi/Ademir.git
    
    # Tentar fazer pull da branch main
    Write-Host "Fazendo pull do repositório..." -ForegroundColor Cyan
    git pull origin main
    
    # Se main não existir, tentar master
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Tentando branch master..." -ForegroundColor Yellow
        git pull origin master
    }
    
    # Configurar branch upstream
    git branch --set-upstream-to=origin/main main 2>$null
    git branch --set-upstream-to=origin/master master 2>$null
}

Write-Host "`nConcluído!" -ForegroundColor Green
Write-Host "Status do repositório:" -ForegroundColor Cyan
git status

