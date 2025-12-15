const ESTOQUE_KEY = 'estoqueData';
const HISTORICO_KEY = 'estoqueHistorico';

let estoque = {
  geladeiras: [],
  cameraFria: []
};

let historico = [];
let produtoEditando = null;
let movimentacaoAtual = { tipo: null, local: null };
let transferenciaAtual = { origem: null, destino: null };
let quantidadesAnteriores = {}; // Armazenar quantidades anteriores para detectar mudanças
let movimentacaoEmAndamento = false; // Flag para evitar notificações duplicadas durante movimentações manuais

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  await sincronizarProdutosDoMenu(); // Sincronizar produtos do menu
  setupTabs();
  setupModals(); // Configurar modais
  setupGeladeiras();
  setupCameraFria();
  setupHistorico();
  renderGeladeiras();
  renderCameraFria();
  renderHistorico();
  updateStats();
  
  // Inicializar quantidades anteriores após carregar dados
  if (estoque.geladeiras && Array.isArray(estoque.geladeiras)) {
    estoque.geladeiras.forEach(produto => {
      if (produto && produto.id) {
        quantidadesAnteriores[produto.id] = produto.quantidade || 0;
      }
    });
  }
  
  // Monitorar mudanças no estoque (para detectar vendas de outras abas/páginas)
  let intervaloVerificacao = setInterval(async () => {
    if (!movimentacaoEmAndamento) {
      await verificarMudancasEstoque();
    }
  }, 1500); // Verificar a cada 1.5 segundos
  
  // Também verificar quando a janela recebe foco
  window.addEventListener('focus', async () => {
    await verificarMudancasEstoque();
  });
});

// Carregar e salvar dados
async function loadData() {
  try {
    estoque = await EstoqueAPI.get();
    historico = await EstoqueAPI.getHistorico();
    
    // Garantir que a estrutura está correta
    if (!estoque || typeof estoque !== 'object') {
      estoque = { geladeiras: [], cameraFria: [] };
    }
    if (!estoque.geladeiras) estoque.geladeiras = [];
    if (!estoque.cameraFria) estoque.cameraFria = [];
    if (!Array.isArray(historico)) historico = [];
    
    console.log('Estoque carregado:', estoque.geladeiras.length, 'produtos em geladeiras');
    console.log('Histórico carregado:', historico.length, 'registros');
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    estoque = { geladeiras: [], cameraFria: [] };
    historico = [];
  }
}

async function saveData() {
  try {
    await EstoqueAPI.save(estoque);
    await EstoqueAPI.saveHistorico(historico);
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    showToast('Erro ao salvar dados. Tente novamente.');
  }
}

// Tabs
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`${tabName}Tab`).classList.add('active');
      
      if (tabName === 'historico') {
        renderHistorico();
      }
    });
  });
}

// Setup Geladeiras
function setupGeladeiras() {
  document.getElementById('btnNovoProdutoGeladeira').addEventListener('click', () => {
    novoProduto('geladeiras');
  });
  
  document.getElementById('btnEntradaGeladeira').addEventListener('click', async () => {
    await abrirMovimentacao('entrada', 'geladeiras');
  });
  
  document.getElementById('btnSaidaGeladeira').addEventListener('click', async () => {
    await abrirMovimentacao('saida', 'geladeiras');
  });
  
  document.getElementById('btnTransferirParaGeladeira').addEventListener('click', async () => {
    await abrirTransferencia('camera-fria', 'geladeiras');
  });
  
  document.getElementById('searchGeladeira').addEventListener('input', (e) => {
    renderGeladeiras(e.target.value);
  });
}

// Setup Câmera Fria
function setupCameraFria() {
  document.getElementById('btnNovoProdutoCameraFria').addEventListener('click', () => {
    novoProduto('camera-fria');
  });
  
  document.getElementById('btnEntradaCameraFria').addEventListener('click', async () => {
    await abrirMovimentacao('entrada', 'camera-fria');
  });
  
  document.getElementById('btnSaidaCameraFria').addEventListener('click', async () => {
    await abrirMovimentacao('saida', 'camera-fria');
  });
  
  document.getElementById('btnTransferirParaCameraFria').addEventListener('click', async () => {
    await abrirTransferencia('geladeiras', 'camera-fria');
  });
  
  document.getElementById('searchCameraFria').addEventListener('input', (e) => {
    renderCameraFria(e.target.value);
  });
}

// Setup Histórico
function setupHistorico() {
  document.getElementById('filterTipoMovimento').addEventListener('change', () => {
    renderHistorico();
  });
  
  document.getElementById('filterLocal').addEventListener('change', () => {
    renderHistorico();
  });
  
  document.getElementById('searchHistorico').addEventListener('input', (e) => {
    renderHistorico(e.target.value);
  });
}

// Modais
function setupModals() {
  // Modal Produto
  document.getElementById('modalProdutoClose').addEventListener('click', closeModalProduto);
  document.getElementById('modalProdutoCancel').addEventListener('click', closeModalProduto);
  document.getElementById('modalProdutoSave').addEventListener('click', async () => {
    await salvarProduto();
  });
  
  // Modal Movimentação
  document.getElementById('modalMovimentacaoClose').addEventListener('click', closeModalMovimentacao);
  document.getElementById('modalMovimentacaoCancel').addEventListener('click', closeModalMovimentacao);
  document.getElementById('modalMovimentacaoSave').addEventListener('click', async () => {
    await salvarMovimentacao();
  });
  
  // Modal Transferência
  document.getElementById('modalTransferenciaClose').addEventListener('click', closeModalTransferencia);
  document.getElementById('modalTransferenciaCancel').addEventListener('click', closeModalTransferencia);
  document.getElementById('modalTransferenciaSave').addEventListener('click', async () => {
    await salvarTransferencia();
  });
  
  // Fechar ao clicar fora
  document.getElementById('modalProduto').addEventListener('click', (e) => {
    if (e.target.id === 'modalProduto') closeModalProduto();
  });
  
  document.getElementById('modalMovimentacao').addEventListener('click', (e) => {
    if (e.target.id === 'modalMovimentacao') closeModalMovimentacao();
  });
  
  document.getElementById('modalTransferencia').addEventListener('click', (e) => {
    if (e.target.id === 'modalTransferencia') closeModalTransferencia();
  });
}

// Função para popular select de categorias
function popularSelectCategorias() {
  const select = document.getElementById('produtoCategoria');
  if (!select) return;
  
  // Limpar opções existentes (exceto a primeira)
  select.innerHTML = '<option value="">Selecione uma categoria</option>';
  
  // Carregar categorias do menu
  const menuData = localStorage.getItem('appMenuData');
  if (menuData) {
    try {
      const categorias = JSON.parse(menuData);
      const categoriasUnicas = new Set();
      
      categorias.forEach(categoria => {
        if (categoria && categoria.titulo) {
          categoriasUnicas.add(categoria.titulo);
        }
      });
      
      // Adicionar categorias ao select
      Array.from(categoriasUnicas).sort().forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        select.appendChild(option);
      });
      
      // Adicionar opção para criar nova categoria
      const optionNova = document.createElement('option');
      optionNova.value = '__nova__';
      optionNova.textContent = '+ Criar nova categoria';
      select.appendChild(optionNova);
    } catch (e) {
      console.error('Erro ao carregar categorias:', e);
    }
  }
}

// Funções de Produto
function novoProduto(local) {
  produtoEditando = { local, produto: null };
  popularSelectCategorias();
  document.getElementById('modalProdutoTitle').textContent = 'Novo Produto';
  document.getElementById('produtoNome').value = '';
  document.getElementById('produtoCategoria').value = '';
  document.getElementById('produtoQuantidade').value = '';
  document.getElementById('produtoValorUnitario').value = '';
  document.getElementById('produtoEstoqueMinimo').value = '';
  document.getElementById('produtoObservacao').value = '';
  document.getElementById('modalProduto').classList.add('active');
}

function editarProduto(produto, local) {
  produtoEditando = { local, produto };
  popularSelectCategorias();
  
  // Aguardar um pouco para garantir que o select foi populado
  setTimeout(() => {
    document.getElementById('modalProdutoTitle').textContent = 'Editar Produto';
    document.getElementById('produtoNome').value = produto.nome;
    const selectCategoria = document.getElementById('produtoCategoria');
    if (selectCategoria) {
      // Verificar se a categoria existe no select, se não, adicionar
      const categoriaExiste = Array.from(selectCategoria.options).some(opt => opt.value === produto.categoria);
      if (produto.categoria && !categoriaExiste && produto.categoria !== '__nova__') {
        const option = document.createElement('option');
        option.value = produto.categoria;
        option.textContent = produto.categoria;
        selectCategoria.insertBefore(option, selectCategoria.lastChild);
      }
      selectCategoria.value = produto.categoria || '';
    }
    document.getElementById('produtoQuantidade').value = produto.quantidade;
    document.getElementById('produtoValorUnitario').value = produto.valorUnitario;
    document.getElementById('produtoEstoqueMinimo').value = produto.estoqueMinimo || 0;
    document.getElementById('produtoObservacao').value = produto.observacao || '';
    document.getElementById('modalProduto').classList.add('active');
  }, 50);
}

async function salvarProduto() {
  const nome = document.getElementById('produtoNome').value.trim();
  const categoriaValue = document.getElementById('produtoCategoria').value;
  const quantidade = parseInt(document.getElementById('produtoQuantidade').value) || 0;
  const valorUnitario = parseFloat(document.getElementById('produtoValorUnitario').value) || 0;
  const estoqueMinimo = parseInt(document.getElementById('produtoEstoqueMinimo').value) || 0;
  const observacao = document.getElementById('produtoObservacao').value.trim();
  
  if (!nome) {
    showToast('Por favor, preencha o nome do produto');
    return;
  }
  
  // Se selecionou "Criar nova categoria", pedir o nome
  let categoria = categoriaValue;
  if (categoriaValue === '__nova__') {
    const novaCategoria = prompt('Digite o nome da nova categoria:');
    if (!novaCategoria || !novaCategoria.trim()) {
      showToast('Categoria é obrigatória');
      return;
    }
    categoria = novaCategoria.trim();
  } else if (!categoriaValue) {
    showToast('Por favor, selecione uma categoria');
    return;
  }
  
  const local = produtoEditando.local;
  const lista = estoque[local === 'geladeiras' ? 'geladeiras' : 'cameraFria'];
  
  if (produtoEditando.produto) {
    // Editar
    const index = lista.findIndex(p => p.id === produtoEditando.produto.id);
    if (index !== -1) {
      lista[index].nome = nome;
      lista[index].categoria = categoria;
      lista[index].quantidade = quantidade;
      lista[index].valorUnitario = valorUnitario;
      lista[index].estoqueMinimo = estoqueMinimo;
      lista[index].observacao = observacao;
      lista[index].updatedAt = new Date().toISOString();
    }
  } else {
    // Novo
    const novoProduto = {
      id: Date.now(),
      nome,
      categoria,
      quantidade,
      valorUnitario,
      estoqueMinimo,
      observacao,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    lista.push(novoProduto);
    
    // Registrar entrada inicial
    registrarMovimentacao('entrada', local, novoProduto.id, nome, quantidade, valorUnitario, 'Entrada inicial');
  }
  
  await saveData();
  if (local === 'geladeiras') {
    renderGeladeiras();
  } else {
    renderCameraFria();
  }
  updateStats();
  closeModalProduto();
  showToast(produtoEditando.produto ? 'Produto atualizado!' : 'Produto criado!');
}

async function excluirProduto(produto, local) {
  if (confirm(`Tem certeza que deseja excluir "${produto.nome}"?`)) {
    const lista = estoque[local === 'geladeiras' ? 'geladeiras' : 'cameraFria'];
    const index = lista.findIndex(p => p.id === produto.id);
    if (index !== -1) {
      lista.splice(index, 1);
      await saveData();
      if (local === 'geladeiras') {
        renderGeladeiras();
      } else {
        renderCameraFria();
      }
      updateStats();
      showToast('Produto excluído!');
    }
  }
}

// Funções de Movimentação
async function abrirMovimentacao(tipo, local) {
  // Sincronizar produtos antes de abrir o modal
  await sincronizarProdutosDoMenu();
  
  // Aguardar um pouco para garantir que a sincronização foi concluída
  setTimeout(() => {
    movimentacaoAtual = { tipo, local };
    const titulo = tipo === 'entrada' ? 'Entrada' : 'Saída';
    document.getElementById('modalMovimentacaoTitle').textContent = titulo;
    
    const select = document.getElementById('movProduto');
    const lista = estoque[local === 'geladeiras' ? 'geladeiras' : 'cameraFria'];
    
    select.innerHTML = '<option value="">Selecione um produto</option>';
    
    console.log('Lista de produtos para', local, ':', lista.length, lista);
    
    if (!lista || lista.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Nenhum produto cadastrado';
      option.disabled = true;
      select.appendChild(option);
      showToast('Nenhum produto cadastrado. Os produtos do menu serão criados automaticamente. Recarregue a página se necessário.');
    } else {
      lista.forEach(produto => {
        if (produto && produto.id && produto.nome) {
          const option = document.createElement('option');
          option.value = produto.id;
          option.textContent = `${produto.nome} (Estoque: ${produto.quantidade || 0})`;
          select.appendChild(option);
        }
      });
    }
    
    document.getElementById('movQuantidade').value = '';
    document.getElementById('movObservacao').value = '';
    
    document.getElementById('modalMovimentacao').classList.add('active');
  }, 100);
}

async function salvarMovimentacao() {
  const produtoIdValue = document.getElementById('movProduto').value;
  if (!produtoIdValue) {
    showToast('Por favor, selecione um produto');
    return;
  }
  
  const quantidade = parseInt(document.getElementById('movQuantidade').value);
  const observacao = document.getElementById('movObservacao').value.trim();
  
  if (!quantidade || quantidade <= 0) {
    showToast('Por favor, informe uma quantidade válida');
    return;
  }
  
  const local = movimentacaoAtual.local;
  const lista = estoque[local === 'geladeiras' ? 'geladeiras' : 'cameraFria'];
  
  // Buscar produto por ID (pode ser number ou string)
  let produto = lista.find(p => p.id == produtoIdValue || String(p.id) === String(produtoIdValue));
  
  if (!produto) {
    console.error('Produto não encontrado. ID buscado:', produtoIdValue);
    console.error('Produtos disponíveis:', lista.map(p => ({ id: p.id, nome: p.nome })));
    showToast('Produto não encontrado. Tente novamente.');
    return;
  }
  
  // Marcar que uma movimentação manual está em andamento para evitar notificações duplicadas
  movimentacaoEmAndamento = true;
  
  if (movimentacaoAtual.tipo === 'entrada') {
    produto.quantidade += quantidade;
    // Não alterar o valor unitário na entrada, usar o valor já existente
  } else {
    if (produto.quantidade < quantidade) {
      movimentacaoEmAndamento = false;
      showToast(`Quantidade insuficiente. Estoque disponível: ${produto.quantidade}`);
      return;
    }
    produto.quantidade -= quantidade;
  }
  
  produto.updatedAt = new Date().toISOString();
  
  // Atualizar quantidade anterior para evitar notificação duplicada
  if (produto.id) {
    quantidadesAnteriores[produto.id] = produto.quantidade;
  }
  
  // Usar o valor unitário do produto (não alterar)
  registrarMovimentacao(movimentacaoAtual.tipo, local, produto.id, produto.nome, quantidade, produto.valorUnitario, observacao);
  
  await saveData();
  if (local === 'geladeiras') {
    renderGeladeiras();
  } else {
    renderCameraFria();
  }
  updateStats();
  closeModalMovimentacao();
  showToast(`${movimentacaoAtual.tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada!`);
  
  // Resetar flag após um tempo
  setTimeout(() => {
    movimentacaoEmAndamento = false;
  }, 2000);
}

// Funções de Transferência
async function abrirTransferencia(origem, destino) {
  // Sincronizar produtos antes de abrir o modal
  await sincronizarProdutosDoMenu();
  
  transferenciaAtual = { origem, destino };
  document.getElementById('modalTransferenciaTitle').textContent = `Transferir de ${origem === 'geladeiras' ? 'Geladeiras' : 'Câmera Fria'} para ${destino === 'geladeiras' ? 'Geladeiras' : 'Câmera Fria'}`;
  
  const select = document.getElementById('transProduto');
  const lista = estoque[origem === 'geladeiras' ? 'geladeiras' : 'cameraFria'];
  
  select.innerHTML = '<option value="">Selecione um produto</option>';
  
  if (lista.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Nenhum produto cadastrado';
    option.disabled = true;
    select.appendChild(option);
    showToast('Nenhum produto cadastrado. Crie um produto primeiro.');
  } else {
    lista.forEach(produto => {
      const option = document.createElement('option');
      option.value = produto.id;
      option.textContent = `${produto.nome} (Estoque: ${produto.quantidade})`;
      select.appendChild(option);
    });
  }
  
  document.getElementById('transQuantidade').value = '';
  document.getElementById('transObservacao').value = '';
  
  document.getElementById('modalTransferencia').classList.add('active');
}

async function salvarTransferencia() {
  const produtoIdValue = document.getElementById('transProduto').value;
  if (!produtoIdValue) {
    showToast('Por favor, selecione um produto');
    return;
  }
  
  const quantidade = parseInt(document.getElementById('transQuantidade').value);
  const observacao = document.getElementById('transObservacao').value.trim();
  
  if (!quantidade || quantidade <= 0) {
    showToast('Por favor, informe uma quantidade válida');
    return;
  }
  
  const origem = transferenciaAtual.origem;
  const destino = transferenciaAtual.destino;
  const listaOrigem = estoque[origem === 'geladeiras' ? 'geladeiras' : 'cameraFria'];
  const listaDestino = estoque[destino === 'geladeiras' ? 'geladeiras' : 'cameraFria'];
  
  // Buscar produto por ID (pode ser number ou string)
  let produtoOrigem = listaOrigem.find(p => p.id == produtoIdValue || String(p.id) === String(produtoIdValue));
  
  if (!produtoOrigem) {
    console.error('Produto não encontrado. ID buscado:', produtoIdValue);
    showToast('Produto não encontrado. Tente novamente.');
    return;
  }
  
  if (produtoOrigem.quantidade < quantidade) {
    showToast(`Quantidade insuficiente. Estoque disponível: ${produtoOrigem.quantidade}`);
    return;
  }
  
  // Remover da origem
  produtoOrigem.quantidade -= quantidade;
  produtoOrigem.updatedAt = new Date().toISOString();
  
  // Adicionar ao destino
  // Buscar produto no destino pelo nome (pode ter ID diferente)
  let produtoDestino = listaDestino.find(p => 
    p && p.nome && p.nome.toLowerCase() === produtoOrigem.nome.toLowerCase()
  );
  
  if (produtoDestino) {
    produtoDestino.quantidade += quantidade;
    produtoDestino.updatedAt = new Date().toISOString();
  } else {
    // Criar novo produto no destino
    produtoDestino = {
      ...produtoOrigem,
      id: Math.floor(Date.now() + Math.random() * 1000), // Novo ID para o produto no destino
      quantidade: quantidade,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    listaDestino.push(produtoDestino);
  }
  
  registrarMovimentacao('transferencia', origem, produtoOrigem.id, produtoOrigem.nome, quantidade, produtoOrigem.valorUnitario, observacao || `Transferido para ${destino === 'geladeiras' ? 'Geladeiras' : 'Câmera Fria'}`);
  
  await saveData();
  renderGeladeiras();
  renderCameraFria();
  updateStats();
  closeModalTransferencia();
  showToast('Transferência realizada!');
}

// Registrar movimentação no histórico
function registrarMovimentacao(tipo, local, produtoId, produtoNome, quantidade, valorUnitario, observacao) {
  const movimentacao = {
    id: Date.now(),
    data: new Date().toISOString(),
    tipo,
    local,
    produtoId,
    produtoNome,
    quantidade,
    valorUnitario,
    total: quantidade * valorUnitario,
    observacao
  };
  
  historico.unshift(movimentacao);
  // Manter apenas últimos 1000 registros
  if (historico.length > 1000) {
    historico = historico.slice(0, 1000);
  }
  // Não salvar aqui para evitar muitas chamadas - será salvo quando necessário
}

// Renderizar Geladeiras
function renderGeladeiras(search = '') {
  const grid = document.getElementById('geladeirasGrid');
  const termo = search.toLowerCase();
  
  let produtos = estoque.geladeiras.filter(p => 
    p.nome.toLowerCase().includes(termo) ||
    (p.categoria && p.categoria.toLowerCase().includes(termo))
  );
  
  if (produtos.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 32px; grid-column: 1 / -1;">Nenhum produto encontrado</p>';
    return;
  }
  
  grid.innerHTML = produtos.map(produto => {
    const classeEstoque = produto.quantidade === 0 ? 'sem-estoque' : 
                         (produto.estoqueMinimo && produto.quantidade <= produto.estoqueMinimo ? 'baixo-estoque' : '');
    
    return `
      <div class="card-item ${classeEstoque}" data-produto-id="${produto.id}">
        <div class="card-header">
          <div class="card-title">${produto.nome}</div>
          <div class="card-quantidade">${produto.quantidade}</div>
        </div>
        <div class="card-info">
          <div class="card-info-item"><strong>Categoria:</strong> ${produto.categoria || 'Sem categoria'}</div>
          <div class="card-info-item"><strong>Valor Unit.:</strong> ${formatPrice(produto.valorUnitario)}</div>
          <div class="card-info-item"><strong>Valor Total:</strong> ${formatPrice(produto.quantidade * produto.valorUnitario)}</div>
          ${produto.estoqueMinimo ? `<div class="card-info-item"><strong>Estoque Mínimo:</strong> ${produto.estoqueMinimo}</div>` : ''}
          ${produto.observacao ? `<div class="card-info-item"><strong>Obs:</strong> ${produto.observacao}</div>` : ''}
        </div>
        <div class="card-actions">
          <button data-action="editar" data-id="${produto.id}">Editar</button>
          <button data-action="excluir" data-id="${produto.id}" class="danger">Excluir</button>
        </div>
      </div>
    `;
  }).join('');
  
  // Event listeners
  grid.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      // Tentar encontrar por ID (pode ser number ou string)
      let produto = estoque.geladeiras.find(p => p.id == id || String(p.id) === String(id));
      
      if (!produto) {
        console.error('Produto não encontrado com ID:', id);
        showToast('Erro: Produto não encontrado');
        return;
      }
      
      if (action === 'editar') {
        editarProduto(produto, 'geladeiras');
      } else if (action === 'excluir') {
        excluirProduto(produto, 'geladeiras').catch(err => console.error('Erro ao excluir produto:', err));
      }
    });
  });
}

// Renderizar Câmera Fria
function renderCameraFria(search = '') {
  const grid = document.getElementById('cameraFriaGrid');
  const termo = search.toLowerCase();
  
  let produtos = estoque.cameraFria.filter(p => 
    p.nome.toLowerCase().includes(termo) ||
    (p.categoria && p.categoria.toLowerCase().includes(termo))
  );
  
  if (produtos.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 32px; grid-column: 1 / -1;">Nenhum produto encontrado</p>';
    return;
  }
  
  grid.innerHTML = produtos.map(produto => {
    const classeEstoque = produto.quantidade === 0 ? 'sem-estoque' : 
                         (produto.estoqueMinimo && produto.quantidade <= produto.estoqueMinimo ? 'baixo-estoque' : '');
    
    return `
      <div class="card-item ${classeEstoque}" data-produto-id="${produto.id}">
        <div class="card-header">
          <div class="card-title">${produto.nome}</div>
          <div class="card-quantidade">${produto.quantidade}</div>
        </div>
        <div class="card-info">
          <div class="card-info-item"><strong>Categoria:</strong> ${produto.categoria || 'Sem categoria'}</div>
          <div class="card-info-item"><strong>Valor Unit.:</strong> ${formatPrice(produto.valorUnitario)}</div>
          <div class="card-info-item"><strong>Valor Total:</strong> ${formatPrice(produto.quantidade * produto.valorUnitario)}</div>
          ${produto.estoqueMinimo ? `<div class="card-info-item"><strong>Estoque Mínimo:</strong> ${produto.estoqueMinimo}</div>` : ''}
          ${produto.observacao ? `<div class="card-info-item"><strong>Obs:</strong> ${produto.observacao}</div>` : ''}
        </div>
        <div class="card-actions">
          <button data-action="editar" data-id="${produto.id}">Editar</button>
          <button data-action="excluir" data-id="${produto.id}" class="danger">Excluir</button>
        </div>
      </div>
    `;
  }).join('');
  
  // Event listeners
  grid.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      // Tentar encontrar por ID (pode ser number ou string)
      let produto = estoque.cameraFria.find(p => p.id == id || String(p.id) === String(id));
      
      if (!produto) {
        console.error('Produto não encontrado com ID:', id);
        showToast('Erro: Produto não encontrado');
        return;
      }
      
      if (action === 'editar') {
        editarProduto(produto, 'camera-fria');
      } else if (action === 'excluir') {
        excluirProduto(produto, 'camera-fria').catch(err => console.error('Erro ao excluir produto:', err));
      }
    });
  });
}

// Renderizar Histórico
function renderHistorico(search = '') {
  const tbody = document.getElementById('historicoTableBody');
  const tipoFiltro = document.getElementById('filterTipoMovimento').value;
  const localFiltro = document.getElementById('filterLocal').value;
  const termo = search.toLowerCase();
  
  let movimentacoes = historico.filter(mov => {
    const matchTipo = !tipoFiltro || mov.tipo === tipoFiltro;
    const matchLocal = !localFiltro || mov.local === localFiltro;
    const matchSearch = !termo || 
      mov.produtoNome.toLowerCase().includes(termo) ||
      mov.observacao.toLowerCase().includes(termo);
    
    return matchTipo && matchLocal && matchSearch;
  });
  
  if (movimentacoes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--muted); padding: 32px;">Nenhuma movimentação encontrada</td></tr>';
    return;
  }
  
  tbody.innerHTML = movimentacoes.map(mov => {
    const data = new Date(mov.data);
    const dataFormatada = data.toLocaleString('pt-BR');
    const badgeClass = mov.tipo === 'entrada' ? 'badge-entrada' : 
                      mov.tipo === 'saida' ? 'badge-saida' : 'badge-transferencia';
    const tipoTexto = mov.tipo === 'entrada' ? 'Entrada' : 
                     mov.tipo === 'saida' ? 'Saída' : 'Transferência';
    const localTexto = mov.local === 'geladeiras' ? 'Geladeiras' : 'Câmera Fria';
    
    return `
      <tr>
        <td>${dataFormatada}</td>
        <td><span class="badge ${badgeClass}">${tipoTexto}</span></td>
        <td>${localTexto}</td>
        <td>${mov.produtoNome}</td>
        <td>${mov.quantidade}</td>
        <td>${formatPrice(mov.valorUnitario)}</td>
        <td>${formatPrice(mov.total)}</td>
        <td>${mov.observacao || '-'}</td>
      </tr>
    `;
  }).join('');
}

// Atualizar Estatísticas
function updateStats() {
  // Geladeiras
  const totalGeladeiras = estoque.geladeiras.length;
  const valorTotalGeladeiras = estoque.geladeiras.reduce((sum, p) => sum + (p.quantidade * p.valorUnitario), 0);
  const baixoEstoqueGeladeiras = estoque.geladeiras.filter(p => 
    p.estoqueMinimo && p.quantidade <= p.estoqueMinimo
  ).length;
  
  document.getElementById('totalGeladeiras').textContent = totalGeladeiras;
  document.getElementById('valorTotalGeladeiras').textContent = formatPrice(valorTotalGeladeiras);
  document.getElementById('baixoEstoqueGeladeiras').textContent = baixoEstoqueGeladeiras;
  
  // Câmera Fria
  const totalCameraFria = estoque.cameraFria.length;
  const valorTotalCameraFria = estoque.cameraFria.reduce((sum, p) => sum + (p.quantidade * p.valorUnitario), 0);
  const baixoEstoqueCameraFria = estoque.cameraFria.filter(p => 
    p.estoqueMinimo && p.quantidade <= p.estoqueMinimo
  ).length;
  
  document.getElementById('totalCameraFria').textContent = totalCameraFria;
  document.getElementById('valorTotalCameraFria').textContent = formatPrice(valorTotalCameraFria);
  document.getElementById('baixoEstoqueCameraFria').textContent = baixoEstoqueCameraFria;
}

// Fechar Modais
function closeModalProduto() {
  document.getElementById('modalProduto').classList.remove('active');
  produtoEditando = null;
}

function closeModalMovimentacao() {
  document.getElementById('modalMovimentacao').classList.remove('active');
  movimentacaoAtual = { tipo: null, local: null };
}

function closeModalTransferencia() {
  document.getElementById('modalTransferencia').classList.remove('active');
  transferenciaAtual = { origem: null, destino: null };
}

// Toast
function showToast(message, duracao = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, duracao);
}

// Função para verificar mudanças no estoque (similar ao admin.js)
async function verificarMudancasEstoque() {
  try {
    const estoqueAtual = await EstoqueAPI.get();
    if (!estoqueAtual || !estoqueAtual.geladeiras || !Array.isArray(estoqueAtual.geladeiras)) return;
    
    // Comparar cada produto nas geladeiras
    estoqueAtual.geladeiras.forEach(produto => {
      if (!produto || !produto.id) return;
      
      const quantidadeAnterior = quantidadesAnteriores[produto.id];
      const quantidadeAtual = parseInt(produto.quantidade) || 0;
      
      // Se a quantidade mudou e não foi uma mudança que nós mesmos fizemos
      if (quantidadeAnterior !== undefined && quantidadeAnterior !== quantidadeAtual) {
        const diferenca = quantidadeAtual - quantidadeAnterior;
        const tipo = diferenca > 0 ? 'entrada' : 'saida';
        const valor = Math.abs(diferenca);
        
        // Só mostrar notificação se a diferença for significativa (maior que 0)
        if (valor > 0) {
          if (tipo === 'saida') {
            // Saída = venda realizada
            const textoUnidade = valor === 1 ? 'unidade' : 'unidades';
            showToast(`🛒 Venda realizada: ${produto.nome} - ${valor} ${textoUnidade}. Estoque: ${quantidadeAnterior} → ${quantidadeAtual}`, 5000);
          } else {
            // Entrada = reposição de estoque (só notificar se não foi uma movimentação manual)
            if (!movimentacaoEmAndamento) {
              const textoUnidade = valor === 1 ? 'unidade' : 'unidades';
              showToast(`📥 ${produto.nome}: Entrada de ${valor} ${textoUnidade}. Estoque: ${quantidadeAnterior} → ${quantidadeAtual}`, 5000);
            }
          }
        }
        
        // Atualizar quantidade anterior
        quantidadesAnteriores[produto.id] = quantidadeAtual;
      } else if (quantidadeAnterior === undefined) {
        // Novo produto - apenas registrar a quantidade
        quantidadesAnteriores[produto.id] = quantidadeAtual;
      }
    });
    
    // Atualizar lista se houver mudanças estruturais
    const estoqueAtualStr = JSON.stringify(estoqueAtual.geladeiras.sort((a, b) => (a.id || 0) - (b.id || 0)));
    const estoqueStr = JSON.stringify(estoque.geladeiras.sort((a, b) => (a.id || 0) - (b.id || 0)));
    
    if (estoqueAtualStr !== estoqueStr) {
      estoque = estoqueAtual;
      renderGeladeiras();
      updateStats();
    }
    
    // Verificar se algum produto foi removido
    Object.keys(quantidadesAnteriores).forEach(id => {
      if (!estoqueAtual.geladeiras.find(p => String(p.id) === String(id))) {
        delete quantidadesAnteriores[id];
      }
    });
  } catch (error) {
    console.error('Erro ao verificar mudanças no estoque:', error);
  }
}

// Formatar preço
function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Sincronizar produtos do menu com estoque
async function sincronizarProdutosDoMenu() {
  // Carregar produtos do menu
  try {
    const categorias = await MenuAPI.get();
    if (!Array.isArray(categorias)) {
      console.error('Dados do menu não são um array:', categorias);
      return;
    }
    
    const produtosMenu = [];
    
    // Extrair todos os itens das categorias
    categorias.forEach(categoria => {
      if (categoria && categoria.itens && Array.isArray(categoria.itens)) {
        categoria.itens.forEach(item => {
          if (item && item.nome) {
            produtosMenu.push({
              nome: item.nome,
              categoria: categoria.titulo || categoria.nome || 'Sem categoria',
              preco: item.preco
            });
          }
        });
      }
    });
    
    console.log('Produtos encontrados no menu:', produtosMenu.length);
    
    if (produtosMenu.length === 0) {
      console.log('Nenhum produto encontrado no menu');
      return;
    }
    
    // Garantir que estoque.geladeiras existe
    if (!estoque.geladeiras) {
      estoque.geladeiras = [];
    }
    
    let produtosCriados = 0;
    let produtosAtualizados = 0;
    
    // Criar produtos no estoque de geladeiras se não existirem
    produtosMenu.forEach((produtoMenu, index) => {
      const existe = estoque.geladeiras.some(p => 
        p && p.nome && p.nome.toLowerCase() === produtoMenu.nome.toLowerCase()
      );
      
      if (!existe) {
        const valorUnitario = parsePrice(produtoMenu.preco);
        const novoProduto = {
          id: Math.floor(Date.now() + index * 1000 + Math.random() * 100), // ID numérico consistente e único
          nome: produtoMenu.nome,
          categoria: produtoMenu.categoria,
          quantidade: 0, // Iniciar com 0, usuário deve adicionar estoque
          valorUnitario: valorUnitario,
          estoqueMinimo: 0,
          observacao: 'Produto criado automaticamente do menu',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        estoque.geladeiras.push(novoProduto);
        produtosCriados++;
      } else {
        // Atualizar categoria e valor se necessário
        const produto = estoque.geladeiras.find(p => 
          p && p.nome && p.nome.toLowerCase() === produtoMenu.nome.toLowerCase()
        );
        if (produto) {
          const valorUnitario = parsePrice(produtoMenu.preco);
          if (produto.categoria !== produtoMenu.categoria) {
            produto.categoria = produtoMenu.categoria;
          }
          if (Math.abs((produto.valorUnitario || 0) - valorUnitario) > 0.01) {
            produto.valorUnitario = valorUnitario;
          }
          produto.updatedAt = new Date().toISOString();
          produtosAtualizados++;
        }
      }
    });
    
    console.log(`Sincronização concluída: ${produtosCriados} criados, ${produtosAtualizados} atualizados`);
    
    if (produtosCriados > 0 || produtosAtualizados > 0) {
      await saveData();
      // Atualizar interface se estiver na aba de geladeiras
      if (document.getElementById('geladeirasGrid')) {
        renderGeladeiras();
        updateStats();
      }
    }
  } catch (e) {
    console.error('Erro ao sincronizar produtos do menu:', e);
    console.error('Stack:', e.stack);
  }
}

// Função auxiliar para parse de preço
function parsePrice(precoStr) {
  if (typeof precoStr === 'number') return precoStr;
  if (typeof precoStr !== 'string') return 0;
  
  // Remove "R$" e espaços, substitui vírgula por ponto
  const cleaned = precoStr.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
  return parseFloat(cleaned) || 0;
}

// Função para verificar estoque disponível (será chamada do app.js)
async function verificarEstoqueGeladeira(produtoNome, quantidade) {
  try {
    // Sincronizar produtos do menu
    await sincronizarProdutosDoMenu();
    
    // Garantir que estoque está carregado
    if (!estoque || !estoque.geladeiras || !Array.isArray(estoque.geladeiras)) {
      // Se não há estoque cadastrado, permitir venda (compatibilidade)
      return true;
    }
    
    // Tentar encontrar o produto
    const produto = estoque.geladeiras.find(p => 
      p && p.nome && p.nome.toLowerCase() === produtoNome.toLowerCase()
    );
    
    if (!produto) {
      // Se não existe no estoque, permitir venda se não há estoque cadastrado
      // (para não bloquear tudo quando o estoque ainda não foi configurado)
      return true;
    }
    
    // Verificar se tem estoque suficiente
    return (produto.quantidade || 0) >= quantidade;
  } catch (error) {
    console.error('Erro ao verificar estoque:', error);
    // Em caso de erro, permitir (para não quebrar o sistema)
    return true;
  }
}

// Função para reduzir estoque ao vender (será chamada do app.js)
async function reduzirEstoqueGeladeira(produtoNome, quantidade) {
  // Primeiro, sincronizar produtos do menu
  await sincronizarProdutosDoMenu();
  
  // Tentar encontrar o produto
  let produto = estoque.geladeiras.find(p => 
    p && p.nome && p.nome.toLowerCase() === produtoNome.toLowerCase()
  );
  
  // Se não encontrar, criar automaticamente do menu
  if (!produto) {
    try {
      const categorias = await MenuAPI.get();
        let produtoMenu = null;
        let categoriaNome = '';
        
        // Buscar o produto no menu
        for (const categoria of categorias) {
          if (categoria.itens && Array.isArray(categoria.itens)) {
            const item = categoria.itens.find(i => 
              i.nome.toLowerCase() === produtoNome.toLowerCase()
            );
            if (item) {
              produtoMenu = item;
              categoriaNome = categoria.titulo;
              break;
            }
          }
        }
        
        if (produtoMenu) {
          // Criar produto no estoque
          const valorUnitario = parsePrice(produtoMenu.preco);
          produto = {
            id: Math.floor(Date.now() + Math.random() * 1000), // ID numérico consistente
            nome: produtoMenu.nome,
            categoria: categoriaNome,
            quantidade: 0, // Começar com 0
            valorUnitario: valorUnitario,
            estoqueMinimo: 0,
            observacao: 'Produto criado automaticamente ao vender',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          estoque.geladeiras.push(produto);
          await saveData();
          
          console.warn(`Produto "${produtoNome}" criado automaticamente no estoque, mas está com quantidade 0. A venda não pode ser concluída.`);
          return false; // Não pode vender se não tem estoque
        }
      } catch (e) {
        console.error('Erro ao buscar produto no menu:', e);
      }
    
    if (!produto) {
      console.warn(`Produto "${produtoNome}" não encontrado no estoque nem no menu`);
      return false;
    }
  }
  
  // Verificar se tem estoque suficiente
  if (produto && produto.quantidade >= quantidade) {
    produto.quantidade -= quantidade;
    produto.updatedAt = new Date().toISOString();
    
    registrarMovimentacao('saida', 'geladeiras', produto.id, produto.nome, quantidade, produto.valorUnitario, 'Venda realizada');
    
    await saveData();
    
    // Atualizar interface se estiver aberta
    if (document.getElementById('geladeirasGrid')) {
      renderGeladeiras();
      updateStats();
    }
    
    return true;
  } else {
    console.warn(`Estoque insuficiente para ${produtoNome}. Disponível: ${produto.quantidade}, Solicitado: ${quantidade}`);
    return false;
  }
}

// Expor funções globalmente para uso no app.js
window.reduzirEstoqueGeladeira = reduzirEstoqueGeladeira;
window.verificarEstoqueGeladeira = verificarEstoqueGeladeira;

