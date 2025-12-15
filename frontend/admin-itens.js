const DATA_KEY = 'menuData';
let categorias = [];
let categoriaEditando = null;
let itemEditando = null;

// Função para gerar placeholder SVG inline
function getPlaceholderImage(text = 'Sem Imagem') {
  const svg = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="#0a0f1a"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </svg>
  `.trim();
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// Função para validar URL de imagem
function getValidImageUrl(url, fallbackText = 'Sem Imagem') {
  if (!url || url.trim() === '') {
    console.log('[Admin-Itens] URL vazia, usando placeholder para:', fallbackText);
    return getPlaceholderImage(fallbackText);
  }
  
  const urlTrimmed = url.trim();
  
  // Aceitar URLs válidas: http://, https://, //, data:, ou caminhos relativos que começam com /
  if (urlTrimmed.startsWith('http://') || 
      urlTrimmed.startsWith('https://') || 
      urlTrimmed.startsWith('//') || 
      urlTrimmed.startsWith('data:') ||
      urlTrimmed.startsWith('/')) {
    console.log('[Admin-Itens] URL válida encontrada:', urlTrimmed);
    return urlTrimmed;
  }
  
  // Se não for uma URL válida, usar placeholder
  console.log('[Admin-Itens] URL inválida, usando placeholder. URL recebida:', urlTrimmed);
  return getPlaceholderImage(fallbackText);
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupTabs();
  setupCategorias();
  setupItens();
  atualizarSelectCategorias(); // Garantir que os selects sejam populados após carregar dados
  renderCategorias();
  renderItens();
});

// Tabs
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Atualizar tabs
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Atualizar conteúdo
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`${tabName}Tab`).classList.add('active');
    });
  });
}

// Carregar e salvar dados
async function loadData() {
  try {
    console.log('[Admin-Itens] Carregando dados do banco...');
    categorias = await MenuAPI.get();
    console.log('[Admin-Itens] Dados recebidos:', Array.isArray(categorias) ? `${categorias.length} categorias` : 'não é array');
    
    if (!Array.isArray(categorias) || categorias.length === 0) {
      console.log('[Admin-Itens] Nenhuma categoria encontrada, usando dados padrão...');
      // Se não há dados, usar dados padrão
      categorias = getDefaultData();
      console.log('[Admin-Itens] Dados padrão criados:', categorias.length, 'categorias');
      await saveData();
    } else {
      console.log('[Admin-Itens] Categorias encontradas:', categorias.length);
      // Converter formato se necessário (adicionar campos ativo se não existirem)
      categorias = categorias.map(cat => ({
        ...cat,
        ativo: cat.ativo !== undefined ? cat.ativo : true,
        itens: (cat.itens || []).map(item => ({
          ...item,
          ativo: item.ativo !== undefined ? item.ativo : true,
          id: item.id || Date.now() + Math.random()
        }))
      }));
      console.log('[Admin-Itens] Categorias processadas:', categorias.map(c => `${c.titulo} (${(c.itens || []).length} itens)`));
    }
  } catch (error) {
    console.error('[Admin-Itens] Erro ao carregar dados:', error);
    // Usar dados padrão em caso de erro
    categorias = getDefaultData();
    await saveData();
  }
}

function getDefaultData() {
  return [
    {
      id: "refrigerantes",
      titulo: "Refrigerantes",
      img: "https://i.ibb.co/8DWyqRjT/refrigerante.png",
      ativo: true,
      itens: [
        { id: Date.now() + 1, nome: "Coca-Cola Lata", preco: "R$ 6,00", desc: "350ml", ativo: true },
        { id: Date.now() + 2, nome: "Guaraná Lata", preco: "R$ 5,50", desc: "350ml", ativo: true },
        { id: Date.now() + 3, nome: "Sprite Lata", preco: "R$ 5,50", desc: "350ml", ativo: true }
      ]
    },
    {
      id: "porcoes",
      titulo: "Porções",
      img: "https://i.ibb.co/qFxWFY7Y/porcao.png",
      ativo: true,
      itens: [
        { id: Date.now() + 4, nome: "Batata Frita", preco: "R$ 24,00", desc: "500g crocante", ativo: true },
        { id: Date.now() + 5, nome: "Iscas de Frango", preco: "R$ 32,00", desc: "500g com molho", ativo: true },
        { id: Date.now() + 6, nome: "Anéis de Cebola", preco: "R$ 22,00", desc: "Porção média", ativo: true }
      ]
    },
    {
      id: "hamburguer",
      titulo: "Hambúrguer",
      img: "https://i.ibb.co/sphwvfNN/hamburguer.png",
      ativo: true,
      itens: [
        { id: Date.now() + 7, nome: "Clássico", preco: "R$ 28,00", desc: "Blend 160g, queijo, salada", ativo: true },
        { id: Date.now() + 8, nome: "Cheddar Bacon", preco: "R$ 32,00", desc: "Cheddar cremoso e bacon", ativo: true },
        { id: Date.now() + 9, nome: "Veggie", preco: "R$ 29,00", desc: "Grão-de-bico, maionese verde", ativo: true }
      ]
    },
    {
      id: "cerveja",
      titulo: "Cerveja",
      img: "https://i.ibb.co/4RnJX9Kn/cerveja.png",
      ativo: true,
      itens: [
        { id: Date.now() + 10, nome: "Heineken 330ml", preco: "R$ 14,00", desc: "Long neck", ativo: true },
        { id: Date.now() + 11, nome: "Stella 330ml", preco: "R$ 12,00", desc: "Long neck", ativo: true },
        { id: Date.now() + 12, nome: "Original 600ml", preco: "R$ 18,00", desc: "Garrafa", ativo: true }
      ]
    },
    {
      id: "chop",
      titulo: "Chop",
      img: "https://i.ibb.co/7dvx8jzP/chopp.png",
      ativo: true,
      itens: [
        { id: Date.now() + 13, nome: "Pilsen 300ml", preco: "R$ 8,00", desc: "Taça", ativo: true },
        { id: Date.now() + 14, nome: "Pilsen 500ml", preco: "R$ 12,00", desc: "Caneca", ativo: true },
        { id: Date.now() + 15, nome: "IPA 500ml", preco: "R$ 16,00", desc: "Caneca", ativo: true }
      ]
    }
  ];
}

async function saveData() {
  try {
    await MenuAPI.save(categorias);
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    showToast('Erro ao salvar dados. Tente novamente.');
  }
}

// Setup Categorias
function setupCategorias() {
  document.getElementById('btnNovaCategoria').addEventListener('click', () => {
    novaCategoria();
  });

  document.getElementById('searchCategoria').addEventListener('input', (e) => {
    renderCategorias(e.target.value);
  });

  // Modal categoria
  const modal = document.getElementById('modalCategoria');
  document.getElementById('modalCategoriaClose').addEventListener('click', () => {
    closeModalCategoria();
  });
  document.getElementById('modalCategoriaCancel').addEventListener('click', () => {
    closeModalCategoria();
  });
  document.getElementById('modalCategoriaSave').addEventListener('click', () => {
    salvarCategoria();
  });

  // Fechar modal ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModalCategoria();
    }
  });
}

function novaCategoria() {
  categoriaEditando = null;
  document.getElementById('modalCategoriaTitle').textContent = 'Nova Categoria';
  document.getElementById('categoriaTitulo').value = '';
  document.getElementById('categoriaImg').value = '';
  document.getElementById('categoriaAtivo').checked = true;
  document.getElementById('modalCategoria').classList.add('active');
}

function editarCategoria(categoria) {
  categoriaEditando = categoria;
  document.getElementById('modalCategoriaTitle').textContent = 'Editar Categoria';
  document.getElementById('categoriaTitulo').value = categoria.titulo;
  document.getElementById('categoriaImg').value = categoria.img;
  document.getElementById('categoriaAtivo').checked = categoria.ativo !== false;
  document.getElementById('modalCategoria').classList.add('active');
}

async function salvarCategoria() {
  const titulo = document.getElementById('categoriaTitulo').value.trim();
  const img = document.getElementById('categoriaImg').value.trim();
  const ativo = document.getElementById('categoriaAtivo').checked;

  if (!titulo) {
    showToast('Por favor, preencha o título');
    return;
  }

  if (categoriaEditando) {
    // Editar
    categoriaEditando.titulo = titulo;
    categoriaEditando.img = img;
    categoriaEditando.ativo = ativo;
  } else {
    // Nova
    const novaCategoria = {
      id: titulo.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      titulo,
      img: img || getPlaceholderImage(titulo),
      ativo,
      itens: []
    };
    categorias.push(novaCategoria);
  }

  await saveData();
  renderCategorias();
  closeModalCategoria();
  showToast(categoriaEditando ? 'Categoria atualizada!' : 'Categoria criada!');
}

async function excluirCategoria(categoria) {
  if (confirm(`Tem certeza que deseja excluir a categoria "${categoria.titulo}"? Todos os itens desta categoria também serão excluídos.`)) {
    categorias = categorias.filter(c => c.id !== categoria.id);
    await saveData();
    renderCategorias();
    showToast('Categoria excluída!');
  }
}

async function toggleCategoria(categoria) {
  categoria.ativo = !categoria.ativo;
  await saveData();
  renderCategorias();
  showToast(`Categoria ${categoria.ativo ? 'ativada' : 'desativada'}!`);
}

function renderCategorias(search = '') {
  const grid = document.getElementById('categoriasGrid');
  if (!grid) {
    console.error('[Admin-Itens] categoriasGrid não encontrado!');
    return;
  }
  
  const termo = search.toLowerCase();
  console.log('[Admin-Itens] Renderizando categorias. Total:', categorias.length, 'Filtro:', termo || 'nenhum');
  
  const categoriasFiltradas = categorias.filter(cat => 
    cat.titulo.toLowerCase().includes(termo)
  );
  
  console.log('[Admin-Itens] Categorias filtradas:', categoriasFiltradas.length);

  grid.innerHTML = categoriasFiltradas.map((cat, index) => {
    const catIndex = categorias.findIndex(c => c.id === cat.id);
    const imgUrl = getValidImageUrl(cat.img, cat.titulo);
    console.log('[Admin-Itens] Renderizando categoria:', cat.titulo, 'URL original:', cat.img, 'URL final:', imgUrl);
    return `
    <div class="card-item ${!cat.ativo ? 'inactive' : ''}" data-categoria-id="${cat.id}">
      <div class="card-header">
        <div class="card-title">${cat.titulo}</div>
        <span class="card-status ${cat.ativo ? 'status-ativo' : 'status-inativo'}">
          ${cat.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </div>
      <img src="${imgUrl}" alt="${cat.titulo}" class="card-img" onerror="console.error('Erro ao carregar imagem:', '${cat.img}'); this.src='${getPlaceholderImage(cat.titulo)}'" />
      <div class="card-info">
        <div class="card-info-item"><strong>ID:</strong> ${cat.id}</div>
        <div class="card-info-item"><strong>Itens:</strong> ${(cat.itens || []).length}</div>
      </div>
      <div class="card-actions">
        <button data-action="editar" data-index="${catIndex}">Editar</button>
        <button data-action="toggle" data-index="${catIndex}" class="${cat.ativo ? 'danger' : 'accent'}">
          ${cat.ativo ? 'Desativar' : 'Ativar'}
        </button>
        <button data-action="excluir" data-index="${catIndex}" class="danger">Excluir</button>
      </div>
    </div>
  `;
  }).join('');
  
  // Adicionar event listeners
  grid.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = btn.dataset.action;
      const index = parseInt(btn.dataset.index);
      const categoria = categorias[index];
      
      if (action === 'editar') {
        editarCategoria(categoria);
      } else if (action === 'toggle') {
        toggleCategoria(categoria);
      } else if (action === 'excluir') {
        excluirCategoria(categoria);
      }
    });
  });
}

function closeModalCategoria() {
  document.getElementById('modalCategoria').classList.remove('active');
  categoriaEditando = null;
}

// Setup Itens
function setupItens() {
  document.getElementById('btnNovoItem').addEventListener('click', () => {
    novoItem();
  });

  document.getElementById('searchItem').addEventListener('input', (e) => {
    renderItens(e.target.value);
  });

  document.getElementById('filterCategoria').addEventListener('change', () => {
    renderItens();
  });

  // Modal item
  const modal = document.getElementById('modalItem');
  document.getElementById('modalItemClose').addEventListener('click', () => {
    closeModalItem();
  });
  document.getElementById('modalItemCancel').addEventListener('click', () => {
    closeModalItem();
  });
  document.getElementById('modalItemSave').addEventListener('click', () => {
    salvarItem();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModalItem();
    }
  });
}

function atualizarSelectCategorias() {
  const selectCategoria = document.getElementById('itemCategoria');
  const filterCategoria = document.getElementById('filterCategoria');
  
  if (!selectCategoria || !filterCategoria) {
    console.warn('Elementos select não encontrados');
    return;
  }
  
  if (!categorias || categorias.length === 0) {
    console.warn('Nenhuma categoria disponível');
    selectCategoria.innerHTML = '<option value="">Nenhuma categoria disponível</option>';
    filterCategoria.innerHTML = '<option value="">Nenhuma categoria disponível</option>';
    return;
  }
  
  const options = categorias.map(cat => 
    `<option value="${cat.id}">${cat.titulo}</option>`
  ).join('');
  
  // Salvar valor atual do filtro antes de atualizar
  const valorFiltroAtual = filterCategoria.value;
  
  selectCategoria.innerHTML = '<option value="">Selecione uma categoria</option>' + options;
  filterCategoria.innerHTML = '<option value="">Todas as categorias</option>' + options;
  
  // Restaurar valor do filtro se ainda existir
  if (valorFiltroAtual && categorias.find(c => c.id === valorFiltroAtual)) {
    filterCategoria.value = valorFiltroAtual;
  }
}

function atualizarSelectCategoriaModal() {
  // Atualiza apenas o select do modal, não o filtro
  const selectCategoria = document.getElementById('itemCategoria');
  
  if (!selectCategoria) {
    return;
  }
  
  if (!categorias || categorias.length === 0) {
    selectCategoria.innerHTML = '<option value="">Nenhuma categoria disponível</option>';
    return;
  }
  
  const options = categorias.map(cat => 
    `<option value="${cat.id}">${cat.titulo}</option>`
  ).join('');
  
  const valorAtual = selectCategoria.value;
  
  selectCategoria.innerHTML = '<option value="">Selecione uma categoria</option>' + options;
  
  // Restaurar valor se ainda existir
  if (valorAtual && categorias.find(c => c.id === valorAtual)) {
    selectCategoria.value = valorAtual;
  }
}

function novoItem() {
  itemEditando = null;
  atualizarSelectCategoriaModal();
  // Aguardar um tick para garantir que o DOM foi atualizado
  setTimeout(() => {
    document.getElementById('modalItemTitle').textContent = 'Novo Item';
    document.getElementById('itemCategoria').value = '';
    document.getElementById('itemNome').value = '';
    document.getElementById('itemPreco').value = '';
    document.getElementById('itemDesc').value = '';
    document.getElementById('itemAtivo').checked = true;
    document.getElementById('modalItem').classList.add('active');
  }, 0);
}

function editarItem(item, categoriaId) {
  itemEditando = { item, categoriaId };
  atualizarSelectCategoriaModal();
  // Aguardar um tick para garantir que o DOM foi atualizado antes de definir o valor
  setTimeout(() => {
    document.getElementById('modalItemTitle').textContent = 'Editar Item';
    const selectCategoria = document.getElementById('itemCategoria');
    if (selectCategoria) {
      selectCategoria.value = categoriaId;
    }
    document.getElementById('itemNome').value = item.nome;
    document.getElementById('itemPreco').value = item.preco.replace('R$ ', '').trim();
    document.getElementById('itemDesc').value = item.desc || '';
    document.getElementById('itemAtivo').checked = item.ativo !== false;
    document.getElementById('modalItem').classList.add('active');
  }, 0);
}

async function salvarItem() {
  const categoriaId = document.getElementById('itemCategoria').value;
  const nome = document.getElementById('itemNome').value.trim();
  const preco = document.getElementById('itemPreco').value.trim();
  const desc = document.getElementById('itemDesc').value.trim();
  const ativo = document.getElementById('itemAtivo').checked;

  if (!categoriaId) {
    showToast('Por favor, selecione uma categoria');
    return;
  }

  if (!nome) {
    showToast('Por favor, preencha o nome do item');
    return;
  }

  const precoFormatado = preco.includes('R$') ? preco : `R$ ${preco}`;

  const categoria = categorias.find(c => c.id === categoriaId);
  if (!categoria) {
    showToast('Categoria não encontrada');
    return;
  }

  if (!categoria.itens) {
    categoria.itens = [];
  }

  if (itemEditando) {
    // Editar
    const itemIndex = categoria.itens.findIndex(i => i.id === itemEditando.item.id);
    if (itemIndex !== -1) {
      categoria.itens[itemIndex].nome = nome;
      categoria.itens[itemIndex].preco = precoFormatado;
      categoria.itens[itemIndex].desc = desc;
      categoria.itens[itemIndex].ativo = ativo;
    }
  } else {
    // Novo
    const novoItem = {
      id: Date.now(),
      nome,
      preco: precoFormatado,
      desc,
      ativo
    };
    categoria.itens.push(novoItem);
  }

  await saveData();
  renderItens();
  closeModalItem();
  showToast(itemEditando ? 'Item atualizado!' : 'Item criado!');
}

async function excluirItem(item, categoriaId) {
  if (confirm(`Tem certeza que deseja excluir o item "${item.nome}"?`)) {
    const categoria = categorias.find(c => c.id === categoriaId);
    if (categoria && categoria.itens) {
      categoria.itens = categoria.itens.filter(i => i.id !== item.id);
      await saveData();
      renderItens();
      showToast('Item excluído!');
    }
  }
}

async function toggleItem(item, categoriaId) {
  const categoria = categorias.find(c => c.id === categoriaId);
  if (categoria && categoria.itens) {
    const itemEncontrado = categoria.itens.find(i => i.id === item.id);
    if (itemEncontrado) {
      itemEncontrado.ativo = !itemEncontrado.ativo;
      await saveData();
      renderItens();
      showToast(`Item ${itemEncontrado.ativo ? 'ativado' : 'desativado'}!`);
    }
  }
}

function renderItens(search = '') {
  // Salvar o valor atual do filtro antes de atualizar
  const filterCategoria = document.getElementById('filterCategoria');
  const valorFiltroAtual = filterCategoria ? filterCategoria.value : '';
  
  // Atualizar apenas o select do modal, não o filtro (para não perder a seleção)
  atualizarSelectCategoriaModal();
  
  const termo = search.toLowerCase();
  const categoriaFiltro = valorFiltroAtual;
  const itensList = document.getElementById('itensList');
  
  if (!itensList) {
    console.error('[Admin-Itens] itensList não encontrado!');
    return;
  }
  
  let todosItens = [];
  categorias.forEach(cat => {
    if (cat.itens) {
      cat.itens.forEach(item => {
        todosItens.push({ ...item, categoriaId: cat.id, categoriaNome: cat.titulo });
      });
    }
  });
  
  console.log('[Admin-Itens] Renderizando itens. Total:', todosItens.length, 'Filtro categoria:', categoriaFiltro || 'todas', 'Busca:', termo || 'nenhuma');

  // Filtrar por categoria
  if (categoriaFiltro) {
    todosItens = todosItens.filter(item => item.categoriaId === categoriaFiltro);
  }

  // Filtrar por busca
  if (termo) {
    todosItens = todosItens.filter(item => 
      item.nome.toLowerCase().includes(termo) ||
      (item.desc && item.desc.toLowerCase().includes(termo))
    );
  }

  if (todosItens.length === 0) {
    itensList.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 32px;">Nenhum item encontrado</p>';
    return;
  }

  itensList.innerHTML = todosItens.map((item, index) => {
    const categoria = categorias.find(c => c.id === item.categoriaId);
    const itemIndex = categoria ? categoria.itens.findIndex(i => i.id === item.id) : -1;
    return `
    <div class="item-row ${!item.ativo ? 'inactive' : ''}" data-item-id="${item.id}" data-categoria-id="${item.categoriaId}">
      <div class="item-info">
        <div class="item-name">${item.nome}</div>
        <div class="item-price">${item.preco}</div>
        <div style="font-size: 12px; color: var(--muted); margin-top: 4px;">
          ${item.desc || ''} • ${item.categoriaNome}
        </div>
      </div>
      <div class="item-actions">
        <button data-action="editar-item" data-item-id="${item.id}" data-categoria-id="${item.categoriaId}">Editar</button>
        <button data-action="toggle-item" data-item-id="${item.id}" data-categoria-id="${item.categoriaId}" class="${item.ativo ? 'danger' : 'accent'}">
          ${item.ativo ? 'Desativar' : 'Ativar'}
        </button>
        <button data-action="excluir-item" data-item-id="${item.id}" data-categoria-id="${item.categoriaId}" class="danger">Excluir</button>
      </div>
    </div>
  `;
  }).join('');
  
  // Adicionar event listeners para itens
  itensList.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = btn.dataset.action;
      const itemId = btn.dataset.itemId;
      const categoriaId = btn.dataset.categoriaId;
      const categoria = categorias.find(c => c.id === categoriaId);
      const item = categoria ? categoria.itens.find(i => i.id == itemId) : null;
      
      if (!item) return;
      
      if (action === 'editar-item') {
        editarItem(item, categoriaId);
      } else if (action === 'toggle-item') {
        toggleItem(item, categoriaId).catch(err => console.error('Erro ao toggle item:', err));
      } else if (action === 'excluir-item') {
        excluirItem(item, categoriaId).catch(err => console.error('Erro ao excluir item:', err));
      }
    });
  });
}

function closeModalItem() {
  document.getElementById('modalItem').classList.remove('active');
  itemEditando = null;
}

// Toast
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Funções expostas globalmente (mantidas para compatibilidade, mas não são mais usadas nos event handlers)

