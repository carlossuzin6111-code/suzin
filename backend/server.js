const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Diretório de dados
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Função auxiliar para ler dados
function readDataFile(filename, defaultValue = []) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filepath)) {
      const data = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Erro ao ler ${filename}:`, error);
  }
  return defaultValue;
}

// Função auxiliar para escrever dados
function writeDataFile(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Erro ao escrever ${filename}:`, error);
    return false;
  }
}

// ========== ROTAS API - MENU ==========
app.get('/api/menu', (req, res) => {
  try {
    const menu = readDataFile('menu.json', getDefaultMenu());
    res.json(menu);
  } catch (error) {
    console.error('Erro ao ler menu:', error);
    res.status(500).json({ error: 'Erro ao carregar menu' });
  }
});

app.post('/api/menu', (req, res) => {
  const menu = req.body;
  if (writeDataFile('menu.json', menu)) {
    res.json({ success: true, message: 'Menu atualizado com sucesso' });
  } else {
    res.status(500).json({ success: false, message: 'Erro ao salvar menu' });
  }
});

function getDefaultMenu() {
  return [
    {
      id: "refrigerantes",
      titulo: "Refrigerantes",
      img: "https://i.ibb.co/8DWyqRjT/refrigerante.png",
      itens: [
        { nome: "Coca-Cola Lata", preco: "R$ 6,00", desc: "350ml" },
        { nome: "Guaraná Lata", preco: "R$ 5,50", desc: "350ml" },
        { nome: "Sprite Lata", preco: "R$ 5,50", desc: "350ml" }
      ]
    },
    {
      id: "porcoes",
      titulo: "Porções",
      img: "https://i.ibb.co/qFxWFY7Y/porcao.png",
      itens: [
        { nome: "Batata Frita", preco: "R$ 24,00", desc: "500g crocante" },
        { nome: "Iscas de Frango", preco: "R$ 32,00", desc: "500g com molho" },
        { nome: "Anéis de Cebola", preco: "R$ 22,00", desc: "Porção média" }
      ]
    },
    {
      id: "hamburguer",
      titulo: "Hambúrguer",
      img: "https://i.ibb.co/sphwvfNN/hamburguer.png",
      itens: [
        { nome: "Clássico", preco: "R$ 28,00", desc: "Blend 160g, queijo, salada" },
        { nome: "Cheddar Bacon", preco: "R$ 32,00", desc: "Cheddar cremoso e bacon" },
        { nome: "Veggie", preco: "R$ 29,00", desc: "Grão-de-bico, maionese verde" }
      ]
    },
    {
      id: "cerveja",
      titulo: "Cerveja",
      img: "https://i.ibb.co/4RnJX9Kn/cerveja.png",
      itens: [
        { nome: "Heineken 330ml", preco: "R$ 14,00", desc: "Long neck" },
        { nome: "Stella 330ml", preco: "R$ 12,00", desc: "Long neck" },
        { nome: "Original 600ml", preco: "R$ 18,00", desc: "Garrafa" }
      ]
    },
    {
      id: "chop",
      titulo: "Chop",
      img: "https://i.ibb.co/7dvx8jzP/chopp.png",
      itens: [
        { nome: "Pilsen 300ml", preco: "R$ 8,00", desc: "Taça" },
        { nome: "Pilsen 500ml", preco: "R$ 12,00", desc: "Caneca" },
        { nome: "IPA 500ml", preco: "R$ 16,00", desc: "Caneca" }
      ]
    }
  ];
}

// ========== ROTAS API - CARTÕES ==========
app.get('/api/cartoes', (req, res) => {
  try {
    const cartoes = readDataFile('cartoes.json', []);
    console.log(`[API] GET /api/cartoes - Retornando ${cartoes.length} cartões`);
    if (cartoes.length > 0) {
      console.log(`[API] Primeiros cartões:`, cartoes.slice(0, 3).map(c => `${c.numero} - ${c.nome}`));
    }
    res.json(cartoes);
  } catch (error) {
    console.error('Erro ao ler cartões:', error);
    res.status(500).json({ error: 'Erro ao carregar cartões' });
  }
});

app.post('/api/cartoes', (req, res) => {
  try {
    const cartoes = req.body;
    console.log(`[API] POST /api/cartoes - Salvando ${Array.isArray(cartoes) ? cartoes.length : 0} cartões`);
    
    if (!Array.isArray(cartoes)) {
      return res.status(400).json({ success: false, message: 'Dados inválidos: esperado array de cartões' });
    }
    
    if (writeDataFile('cartoes.json', cartoes)) {
      console.log(`[API] ✅ Cartões salvos com sucesso`);
      res.json({ success: true, message: 'Cartões atualizados com sucesso' });
    } else {
      res.status(500).json({ success: false, message: 'Erro ao salvar cartões' });
    }
  } catch (error) {
    console.error('[API] Erro ao salvar cartões:', error);
    res.status(500).json({ success: false, message: 'Erro ao salvar cartões' });
  }
});

app.get('/api/cartoes/:numero', (req, res) => {
  try {
    const cartoes = readDataFile('cartoes.json', []);
    const numero = req.params.numero.replace(/\s/g, '').trim();
    
    console.log(`[API] Buscando cartão: "${numero}"`);
    console.log(`[API] Total de cartões: ${cartoes.length}`);
    if (cartoes.length > 0) {
      console.log(`[API] Primeiros números: ${cartoes.slice(0, 3).map(c => c.numero).join(', ')}`);
    }
    
    if (!numero || numero.length < 4) {
      return res.status(400).json({ success: false, message: 'Número de cartão inválido' });
    }
    
    // Buscar exato primeiro
    let cartao = cartoes.find(c => {
      if (!c || !c.numero) return false;
      const numCartao = String(c.numero).replace(/\s/g, '').trim();
      const match = numCartao === numero;
      if (match) {
        console.log(`[API] ✅ Encontrado por busca exata: ${numCartao}`);
      }
      return match;
    });
    
    // Se não encontrar, tentar busca parcial (últimos 4 dígitos)
    if (!cartao && numero.length >= 4) {
      const ultimosDigitos = numero.slice(-4);
      console.log(`[API] Tentando busca parcial com últimos 4 dígitos: ${ultimosDigitos}`);
      cartao = cartoes.find(c => {
        if (!c || !c.numero) return false;
        const numCartao = String(c.numero).replace(/\s/g, '').trim();
        const match = numCartao.endsWith(ultimosDigitos);
        if (match) {
          console.log(`[API] ✅ Encontrado por busca parcial: ${numCartao}`);
        }
        return match;
      });
    }
    
    if (cartao) {
      console.log(`[API] ✅ Cartão encontrado: ${cartao.numero} - ${cartao.nome}`);
      res.json(cartao);
    } else {
      console.log(`[API] ❌ Cartão não encontrado: ${numero}`);
      res.status(404).json({ success: false, message: 'Cartão não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar cartão:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar cartão' });
  }
});

app.post('/api/cartoes/:id/debitar', (req, res) => {
  const { valor, itens } = req.body;
  const cartoes = readDataFile('cartoes.json', []);
  const cartaoIndex = cartoes.findIndex(c => c.id == req.params.id);
  
  if (cartaoIndex === -1) {
    return res.status(404).json({ success: false, message: 'Cartão não encontrado' });
  }
  
  const cartao = cartoes[cartaoIndex];
  if (cartao.saldo < valor) {
    return res.status(400).json({ success: false, message: 'Saldo insuficiente' });
  }
  
  const saldoAnterior = cartao.saldo;
  cartao.saldo -= valor;
  cartao.saldo = Math.round(cartao.saldo * 100) / 100;
  
  // Registrar transação no histórico
  try {
    const transacoes = readDataFile('cartoes-transacoes.json', []);
    transacoes.unshift({
      id: Date.now(),
      cartaoId: cartao.id,
      cartaoNumero: cartao.numero,
      tipo: 'compra',
      valor: valor,
      saldoAnterior: saldoAnterior,
      saldoAtual: cartao.saldo,
      data: new Date().toISOString(),
      itens: itens || [],
      descricao: `Compra de ${itens ? itens.length : 0} item(ns)`
    });
    
    // Manter apenas últimos 10000 registros
    if (transacoes.length > 10000) {
      transacoes.splice(10000);
    }
    
    const salvoCartoes = writeDataFile('cartoes.json', cartoes);
    const salvoTransacoes = writeDataFile('cartoes-transacoes.json', transacoes);
    
    if (salvoCartoes && salvoTransacoes) {
      res.json({ success: true, cartao });
    } else {
      console.error('[API] Erro ao salvar cartão ou transações');
      res.status(500).json({ success: false, message: 'Erro ao atualizar cartão' });
    }
  } catch (error) {
    console.error('[API] Erro ao registrar transação:', error);
    // Ainda assim, tentar salvar o cartão mesmo se falhar ao salvar transação
    if (writeDataFile('cartoes.json', cartoes)) {
      res.json({ success: true, cartao });
    } else {
      res.status(500).json({ success: false, message: 'Erro ao atualizar cartão' });
    }
  }
});

// Rota para registrar recarga
app.post('/api/cartoes/:id/recarregar', (req, res) => {
  const { valor, descricao } = req.body;
  const cartoes = readDataFile('cartoes.json', []);
  const cartaoIndex = cartoes.findIndex(c => c.id == req.params.id);
  
  if (cartaoIndex === -1) {
    return res.status(404).json({ success: false, message: 'Cartão não encontrado' });
  }
  
  const cartao = cartoes[cartaoIndex];
  const saldoAnterior = cartao.saldo;
  cartao.saldo += parseFloat(valor) || 0;
  cartao.saldo = Math.round(cartao.saldo * 100) / 100;
  
  // Registrar transação no histórico
  try {
    const transacoes = readDataFile('cartoes-transacoes.json', []);
    transacoes.unshift({
      id: Date.now(),
      cartaoId: cartao.id,
      cartaoNumero: cartao.numero,
      tipo: 'recarga',
      valor: parseFloat(valor) || 0,
      saldoAnterior: saldoAnterior,
      saldoAtual: cartao.saldo,
      data: new Date().toISOString(),
      descricao: descricao || 'Recarga de saldo'
    });
    
    // Manter apenas últimos 10000 registros
    if (transacoes.length > 10000) {
      transacoes.splice(10000);
    }
    
    const salvoCartoes = writeDataFile('cartoes.json', cartoes);
    const salvoTransacoes = writeDataFile('cartoes-transacoes.json', transacoes);
    
    if (salvoCartoes && salvoTransacoes) {
      res.json({ success: true, cartao });
    } else {
      console.error('[API] Erro ao salvar cartão ou transações');
      res.status(500).json({ success: false, message: 'Erro ao atualizar cartão' });
    }
  } catch (error) {
    console.error('[API] Erro ao registrar transação:', error);
    // Ainda assim, tentar salvar o cartão mesmo se falhar ao salvar transação
    if (writeDataFile('cartoes.json', cartoes)) {
      res.json({ success: true, cartao });
    } else {
      res.status(500).json({ success: false, message: 'Erro ao atualizar cartão' });
    }
  }
});

// Rota para buscar transações de um cartão
app.get('/api/cartoes/:id/transacoes', (req, res) => {
  try {
    const cartaoIdParam = req.params.id;
    // Tentar converter para número, mas também aceitar string
    const cartaoId = isNaN(cartaoIdParam) ? cartaoIdParam : parseInt(cartaoIdParam, 10);
    
    const transacoes = readDataFile('cartoes-transacoes.json', []);
    
    // Filtrar transações comparando IDs (tanto string quanto número)
    const transacoesCartao = transacoes.filter(t => {
      if (!t || !t.cartaoId) return false;
      const tId = typeof t.cartaoId === 'string' ? parseInt(t.cartaoId, 10) : t.cartaoId;
      const cId = typeof cartaoId === 'string' ? parseInt(cartaoId, 10) : cartaoId;
      return tId === cId || String(t.cartaoId) === String(cartaoId);
    });
    
    console.log(`[API] GET /api/cartoes/${cartaoIdParam}/transacoes - Encontradas ${transacoesCartao.length} transações`);
    res.json(transacoesCartao);
  } catch (error) {
    console.error('[API] Erro ao buscar transações:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar transações: ' + error.message });
  }
});

// ========== ROTAS API - ESTOQUE ==========
app.get('/api/estoque', (req, res) => {
  try {
    const estoque = readDataFile('estoque.json', { geladeiras: [], cameraFria: [] });
    res.json(estoque);
  } catch (error) {
    console.error('Erro ao ler estoque:', error);
    res.status(500).json({ error: 'Erro ao carregar estoque' });
  }
});

app.post('/api/estoque', (req, res) => {
  const estoque = req.body;
  if (writeDataFile('estoque.json', estoque)) {
    res.json({ success: true, message: 'Estoque atualizado com sucesso' });
  } else {
    res.status(500).json({ success: false, message: 'Erro ao salvar estoque' });
  }
});

app.get('/api/estoque/historico', (req, res) => {
  try {
    const historico = readDataFile('estoque-historico.json', []);
    res.json(historico);
  } catch (error) {
    console.error('Erro ao ler histórico:', error);
    res.status(500).json({ error: 'Erro ao carregar histórico' });
  }
});

app.post('/api/estoque/historico', (req, res) => {
  const historico = req.body;
  if (writeDataFile('estoque-historico.json', historico)) {
    res.json({ success: true, message: 'Histórico atualizado com sucesso' });
  } else {
    res.status(500).json({ success: false, message: 'Erro ao salvar histórico' });
  }
});

app.get('/api/estoque/verificar/:produtoNome', (req, res) => {
  const estoque = readDataFile('estoque.json', { geladeiras: [], cameraFria: [] });
  const produtoNome = decodeURIComponent(req.params.produtoNome);
  
  const produto = estoque.geladeiras.find(p => 
    p && p.nome && p.nome.toLowerCase() === produtoNome.toLowerCase()
  );
  
  if (!produto) {
    return res.json({ disponivel: false, quantidade: 0 });
  }
  
  res.json({ disponivel: produto.quantidade > 0, quantidade: produto.quantidade || 0 });
});

// ========== ROTAS API - EVENTOS ==========
app.get('/api/eventos', (req, res) => {
  try {
    const eventos = readDataFile('eventos.json', []);
    res.json(eventos);
  } catch (error) {
    console.error('Erro ao ler eventos:', error);
    res.status(500).json({ error: 'Erro ao carregar eventos' });
  }
});

app.post('/api/eventos', (req, res) => {
  try {
    const eventos = req.body;
    console.log('[API] POST /api/eventos - Salvando eventos:', Array.isArray(eventos) ? eventos.length : 'não é array');
    if (writeDataFile('eventos.json', eventos)) {
      console.log('[API] ✅ Eventos salvos com sucesso');
      res.json({ success: true, message: 'Eventos atualizados com sucesso' });
    } else {
      console.error('[API] ❌ Erro ao escrever arquivo eventos.json');
      res.status(500).json({ success: false, message: 'Erro ao salvar eventos' });
    }
  } catch (error) {
    console.error('[API] ❌ Erro ao salvar eventos:', error);
    res.status(500).json({ success: false, message: 'Erro ao salvar eventos: ' + error.message });
  }
});

app.post('/api/estoque/reduzir', (req, res) => {
  const { produtoNome, quantidade } = req.body;
  const estoque = readDataFile('estoque.json', { geladeiras: [], cameraFria: [] });
  
  const produto = estoque.geladeiras.find(p => 
    p && p.nome && p.nome.toLowerCase() === produtoNome.toLowerCase()
  );
  
  if (!produto) {
    return res.status(404).json({ success: false, message: 'Produto não encontrado' });
  }
  
  if (produto.quantidade < quantidade) {
    return res.status(400).json({ success: false, message: 'Estoque insuficiente' });
  }
  
  produto.quantidade -= quantidade;
  produto.updatedAt = new Date().toISOString();
  
  // Registrar no histórico
  const historico = readDataFile('estoque-historico.json', []);
  historico.unshift({
    id: Date.now(),
    data: new Date().toISOString(),
    tipo: 'saida',
    local: 'geladeiras',
    produtoId: produto.id,
    produtoNome: produto.nome,
    quantidade: quantidade,
    valorUnitario: produto.valorUnitario || 0,
    total: quantidade * (produto.valorUnitario || 0),
    observacao: 'Venda realizada'
  });
  
  // Manter apenas últimos 1000 registros
  if (historico.length > 1000) {
    historico.splice(1000);
  }
  
  if (writeDataFile('estoque.json', estoque) && writeDataFile('estoque-historico.json', historico)) {
    res.json({ success: true, produto });
  } else {
    res.status(500).json({ success: false, message: 'Erro ao atualizar estoque' });
  }
});

// Rota para servir index.html em qualquer rota não-API
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`API disponível em http://localhost:${PORT}/api`);
  console.log('Rotas disponíveis:');
  console.log('  GET  /api/menu');
  console.log('  POST /api/menu');
  console.log('  GET  /api/cartoes');
  console.log('  POST /api/cartoes');
  console.log('  GET  /api/estoque');
  console.log('  POST /api/estoque');
  console.log('  GET  /api/eventos');
  console.log('  POST /api/eventos');
});

