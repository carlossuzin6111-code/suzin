# Sistema Ademir - Vendas e Controle de Estoque

Sistema completo de vendas com controle de estoque, cartões e gestão de menu.

## Estrutura do Projeto

O projeto está separado em **frontend** e **backend**:

```
.
├── frontend/          # Interface do usuário (HTML, CSS, JS)
│   ├── index.html
│   ├── app.js
│   ├── admin.html
│   ├── admin.js
│   ├── admin-itens.html
│   ├── admin-itens.js
│   ├── estoque.html
│   ├── estoque.js
│   └── api.js         # Helper para comunicação com API
│
├── backend/           # Servidor Node.js com Express
│   ├── server.js      # Servidor principal
│   └── data/          # Dados armazenados em JSON (criado automaticamente)
│       ├── menu.json
│       ├── cartoes.json
│       ├── estoque.json
│       └── estoque-historico.json
│
└── package.json
```

## Instalação

1. Instale as dependências:
```bash
npm install
```

## Execução

### Modo Desenvolvimento (com auto-reload):
```bash
npm run dev
```

### Modo Produção:
```bash
npm start
```

O servidor estará disponível em: `http://localhost:3000`

## API Endpoints

### Menu
- `GET /api/menu` - Obter menu completo
- `POST /api/menu` - Salvar menu

### Cartões
- `GET /api/cartoes` - Listar todos os cartões
- `POST /api/cartoes` - Salvar lista de cartões
- `GET /api/cartoes/:numero` - Buscar cartão por número
- `POST /api/cartoes/:id/debitar` - Debitar valor do cartão

### Estoque
- `GET /api/estoque` - Obter estoque completo
- `POST /api/estoque` - Salvar estoque
- `GET /api/estoque/historico` - Obter histórico de movimentações
- `POST /api/estoque/historico` - Salvar histórico
- `GET /api/estoque/verificar/:produtoNome` - Verificar disponibilidade
- `POST /api/estoque/reduzir` - Reduzir estoque (venda)

## Migração de Dados

Se você tinha dados no `localStorage`, eles precisam ser migrados para o backend. Os dados são salvos automaticamente em arquivos JSON na pasta `backend/data/`.

## Notas

- O carrinho de compras continua usando `localStorage` no cliente (não precisa ser persistido no servidor)
- Todos os outros dados (menu, cartões, estoque) são gerenciados pelo backend
- O servidor serve automaticamente os arquivos estáticos do frontend

