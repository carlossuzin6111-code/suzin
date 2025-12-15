# Script para fazer push da aplicação para o GitHub
# Execute este script após instalar o Git e criar o repositório no GitHub

Write-Host "=== Configurando e fazendo push para GitHub ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se Git está instalado
try {
    $gitVersion = git --version
    Write-Host "Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Git não está instalado ou não está no PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, instale o Git de: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Após instalar, reinicie o PowerShell e execute este script novamente." -ForegroundColor Yellow
    exit 1
}

# Verificar se já é um repositório git
if (Test-Path .git) {
    Write-Host "Repositório Git já existe." -ForegroundColor Yellow
    $existingRemote = git remote get-url origin 2>$null
    if ($existingRemote) {
        Write-Host "Remote atual: $existingRemote" -ForegroundColor Cyan
        $changeRemote = Read-Host "Deseja alterar o remote? (s/n)"
        if ($changeRemote -eq "s" -or $changeRemote -eq "S") {
            $newRemote = Read-Host "Digite a URL do seu repositório GitHub (ex: https://github.com/seu-usuario/Ademir.git)"
            git remote set-url origin $newRemote
            Write-Host "Remote atualizado!" -ForegroundColor Green
        }
    }
} else {
    Write-Host "Inicializando repositório Git..." -ForegroundColor Cyan
    
    # Inicializar repositório
    git init
    
    # Solicitar URL do repositório
    Write-Host ""
    Write-Host "IMPORTANTE: Primeiro crie um repositório no GitHub:" -ForegroundColor Yellow
    Write-Host "1. Acesse https://github.com" -ForegroundColor Yellow
    Write-Host "2. Clique em 'New repository'" -ForegroundColor Yellow
    Write-Host "3. Dê um nome (ex: Ademir)" -ForegroundColor Yellow
    Write-Host "4. NÃO marque 'Initialize with README'" -ForegroundColor Yellow
    Write-Host "5. Copie a URL do repositório" -ForegroundColor Yellow
    Write-Host ""
    
    $repoUrl = Read-Host "Digite a URL do seu repositório GitHub (ex: https://github.com/seu-usuario/Ademir.git)"
    
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "Remote adicionado: $repoUrl" -ForegroundColor Green
    } else {
        Write-Host "URL não fornecida. Pulando configuração do remote." -ForegroundColor Yellow
        Write-Host "Você pode adicionar depois com: git remote add origin <URL>" -ForegroundColor Yellow
    }
}

# Configurar usuário Git (se necessário)
$userName = git config user.name
$userEmail = git config user.email

if (-not $userName) {
    Write-Host ""
    Write-Host "Configurando usuário Git..." -ForegroundColor Cyan
    $gitUserName = Read-Host "Digite seu nome (para commits do Git)"
    $gitUserEmail = Read-Host "Digite seu email (para commits do Git)"
    git config user.name $gitUserName
    git config user.email $gitUserEmail
    Write-Host "Usuário Git configurado!" -ForegroundColor Green
}

# Adicionar todos os arquivos
Write-Host ""
Write-Host "Adicionando arquivos ao staging..." -ForegroundColor Cyan
git add .

# Verificar se há mudanças para commitar
$status = git status --porcelain
if ($status) {
    Write-Host ""
    Write-Host "Arquivos prontos para commit:" -ForegroundColor Cyan
    git status --short
    
    Write-Host ""
    $commitMessage = Read-Host "Digite a mensagem do commit (ou pressione Enter para usar padrão)"
    if (-not $commitMessage) {
        $commitMessage = "Initial commit - Sistema Ademir"
    }
    
    # Fazer commit
    Write-Host ""
    Write-Host "Fazendo commit..." -ForegroundColor Cyan
    git commit -m $commitMessage
    
    # Fazer push
    Write-Host ""
    Write-Host "Fazendo push para GitHub..." -ForegroundColor Cyan
    Write-Host "NOTA: Se for a primeira vez, você pode precisar autenticar." -ForegroundColor Yellow
    
    # Tentar push para main primeiro
    git push -u origin main 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Tentando branch master..." -ForegroundColor Yellow
        git push -u origin master 2>&1 | Out-String
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Push realizado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "ERRO ao fazer push. Verifique:" -ForegroundColor Red
        Write-Host "1. Se o repositório existe no GitHub" -ForegroundColor Yellow
        Write-Host "2. Se você tem permissão para fazer push" -ForegroundColor Yellow
        Write-Host "3. Se sua autenticação está configurada (token ou SSH)" -ForegroundColor Yellow
    }
} else {
    Write-Host "Nenhuma mudança para commitar." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Concluído ===" -ForegroundColor Green
Write-Host ""
Write-Host "Status do repositório:" -ForegroundColor Cyan
git status

