# Guia para Subir a Aplicação para o GitHub

## Pré-requisitos

### 1. Instalar o Git

Se o Git não estiver instalado:

1. Acesse: https://git-scm.com/download/win
2. Baixe e instale o Git para Windows
3. Durante a instalação, aceite as opções padrão
4. **Reinicie o PowerShell** após a instalação

### 2. Criar Conta no GitHub (se ainda não tiver)

1. Acesse: https://github.com
2. Crie uma conta ou faça login

## Passo a Passo

### Opção 1: Usar o Script Automatizado (Recomendado)

1. **Instale o Git** (se ainda não tiver)
2. **Crie o repositório no GitHub:**
   - Acesse https://github.com
   - Clique no botão "+" no canto superior direito
   - Selecione "New repository"
   - Dê um nome (ex: `Ademir` ou `ademir-sistema`)
   - **NÃO marque** "Initialize with README"
   - Clique em "Create repository"
   - Copie a URL do repositório (ex: `https://github.com/seu-usuario/Ademir.git`)

3. **Execute o script:**
   ```powershell
   .\push-to-github.ps1
   ```

4. **Siga as instruções** que aparecerem no terminal

### Opção 2: Fazer Manualmente

#### 1. Inicializar o repositório Git

```powershell
git init
```

#### 2. Adicionar o remote do GitHub

```powershell
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
```

Substitua `SEU-USUARIO` e `SEU-REPOSITORIO` pelos seus dados.

#### 3. Configurar usuário Git (primeira vez)

```powershell
git config user.name "Seu Nome"
git config user.email "seu-email@exemplo.com"
```

#### 4. Adicionar arquivos

```powershell
git add .
```

#### 5. Fazer commit

```powershell
git commit -m "Initial commit - Sistema Ademir"
```

#### 6. Fazer push

```powershell
git push -u origin main
```

Se der erro, tente:
```powershell
git push -u origin master
```

## Autenticação no GitHub

### Método 1: Personal Access Token (Recomendado)

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token" → "Generate new token (classic)"
3. Dê um nome (ex: "Ademir Local")
4. Marque a opção `repo` (acesso completo aos repositórios)
5. Clique em "Generate token"
6. **COPIE O TOKEN** (você não verá ele novamente!)
7. Quando o Git pedir senha, use o token no lugar da senha

### Método 2: GitHub CLI

```powershell
# Instalar GitHub CLI
winget install GitHub.cli

# Autenticar
gh auth login
```

## Verificação

Após o push, acesse seu repositório no GitHub e verifique se todos os arquivos foram enviados.

## Próximos Passos

Para fazer atualizações futuras:

```powershell
git add .
git commit -m "Descrição das mudanças"
git push
```

## Solução de Problemas

### Erro: "Git não está instalado"
- Instale o Git: https://git-scm.com/download/win
- Reinicie o PowerShell após instalar

### Erro: "Permission denied"
- Verifique se você tem permissão no repositório
- Use um Personal Access Token para autenticação

### Erro: "Repository not found"
- Verifique se o repositório existe no GitHub
- Verifique se a URL está correta
- Verifique se você tem acesso ao repositório

### Erro: "Branch main/master não existe"
- Crie o repositório no GitHub primeiro
- Ou use: `git push -u origin main --force` (cuidado!)

