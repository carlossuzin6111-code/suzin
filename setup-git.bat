@echo off
echo Configurando repositorio Git...
echo.

REM Verificar se Git esta instalado
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Git nao esta instalado ou nao esta no PATH
    echo Por favor, instale o Git de: https://git-scm.com/download/win
    pause
    exit /b 1
)

REM Verificar se ja e um repositorio git
if exist .git (
    echo Repositorio Git ja existe. Fazendo pull...
    git pull origin main
    if %errorlevel% neq 0 (
        git pull origin master
    )
) else (
    echo Inicializando repositorio Git...
    git init
    git remote add origin https://github.com/DiogoCrespi/Ademir.git
    echo Fazendo pull do repositorio...
    git pull origin main
    if %errorlevel% neq 0 (
        echo Tentando branch master...
        git pull origin master
    )
)

echo.
echo Concluido!
echo Status do repositorio:
git status
pause

