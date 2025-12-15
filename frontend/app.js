// Carregar dados da API
let data = [];
async function loadMenuData() {
  try {
    data = await MenuAPI.get();
    // Filtrar apenas categorias e itens ativos para compatibilidade
    data = data.filter(cat => cat.ativo !== false).map(cat => ({
      ...cat,
      itens: (cat.itens || []).filter(item => item.ativo !== false)
    }));
  } catch (e) {
    console.error('Erro ao carregar dados da API:', e);
    data = getDefaultData();
  }
}

function getDefaultData() {
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

// Carregar dados ao iniciar e quando a página for focada (para atualizar após mudanças no admin)
loadMenuData().then(() => {
  renderCategories();
});
window.addEventListener('focus', () => {
  loadMenuData().then(() => {
    renderCategories();
  });
});

const categoriesGrid = document.getElementById("categoriesGrid");
const itemsList = document.getElementById("itemsList");
const categoriesScreen = document.getElementById("categoriesScreen");
const itemsScreen = document.getElementById("itemsScreen");
const paymentScreen = document.getElementById("paymentScreen");
const title = document.getElementById("title");
const breadcrumb = document.getElementById("breadcrumb");
const backBtn = document.getElementById("backBtn");
const cartList = document.getElementById("cartList");
const cartFloating = document.getElementById("cartFloating");
const cartStatus = document.getElementById("cartStatus");
const cartTotal = document.getElementById("cartTotal");
const clearCartBtn = document.getElementById("clearCartBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const cartToggle = document.getElementById("cartToggle");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartFinalize = document.getElementById("cartFinalize");
const cartFabs = document.getElementById("cartFabs");
const toast = document.getElementById("toast");
const checkoutModal = document.getElementById("checkoutModal");
const modalItems = document.getElementById("modalItems");
const modalClose = document.getElementById("modalClose");
const modalConfirm = document.getElementById("modalConfirm");
const modalTotal = document.getElementById("modalTotal");
const tableInput = document.getElementById("tableInput");
const paymentPanel = document.getElementById("paymentPanel");
const paymentInfo = document.getElementById("paymentInfo");
const cardManualField = document.getElementById("cardManualField");
const cardNumber = document.getElementById("cardNumber");
const cardHolder = document.getElementById("cardHolder");
const cardBalance = document.getElementById("cardBalance");
const cardTime = document.getElementById("cardTime");
const cardStatus = document.getElementById("cardStatus");
const cardStatusText = document.getElementById("cardStatusText");
const paymentBack = document.getElementById("paymentBack");
const paymentConfirm = document.getElementById("paymentConfirm");
let toastTimer = null;

const CART_KEY = "cartDataV1";
const CARTOES_KEY = "cartoes";
const cart = [];
let cartaoAtual = null;

// Cache de verificação de cartões disponíveis
let cartoesDisponiveisCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 segundos

function renderCategories() {
  categoriesGrid.innerHTML = "";
  // Filtrar apenas categorias ativas (se tiver propriedade ativo)
  const categoriasAtivas = data.filter(cat => cat.ativo !== false);
  categoriasAtivas.forEach(cat => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${cat.img}" alt="${cat.titulo}" class="card-img" loading="lazy" />
      <div class="card-meta">
        <div class="card-title">${cat.titulo}</div>
      </div>
    `;
    card.onclick = () => openCategory(cat);
    categoriesGrid.appendChild(card);
  });
}

async function openCategory(cat) {
  breadcrumb.textContent = "Categorias › " + cat.titulo;
  title.textContent = cat.titulo;
  backBtn.style.display = "inline-flex";
  itemsList.innerHTML = "";
  // Filtrar apenas itens ativos
  const itensAtivos = (cat.itens || []).filter(item => item.ativo !== false);
  
  for (const item of itensAtivos) {
    const row = document.createElement("article");
    row.className = "item";
    
    // Verificar estoque para desabilitar se necessário
    const temEstoque = await verificarEstoqueDisponivel(item.nome, 1);
    if (!temEstoque) {
      row.classList.add("sem-estoque");
      row.style.opacity = "0.5";
      row.style.cursor = "not-allowed";
    }
    
    row.innerHTML = `
      <div class="item-title">${item.nome}</div>
      <div class="item-price">${item.preco}</div>
      <p class="item-desc">${item.desc}</p>
      ${!temEstoque ? '<div style="color: var(--danger); font-size: 12px; margin-top: 4px;">Sem estoque</div>' : ''}
    `;
    
    if (temEstoque) {
      row.onclick = async () => await addToCart(item, cat);
    } else {
      row.onclick = () => showToast(`Produto "${item.nome}" sem estoque disponível`);
    }
    
    itemsList.appendChild(row);
  }
  switchScreen("items");
}

function backToCategories() {
  breadcrumb.textContent = "Categorias";
  title.textContent = "Selecione uma categoria";
  backBtn.style.display = "none";
  switchScreen("categories");
}

function switchScreen(target) {
  const screens = {
    categories: categoriesScreen,
    items: itemsScreen,
    payment: paymentScreen,
  };
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[target].classList.add("active");
}

function parsePrice(str) {
  const cleaned = str.replace(/[^\d,.-]/g, "").replace(",", ".");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}

function formatPrice(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1000);
}

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.warn("Não foi possível salvar o carrinho:", e);
  }
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cart.push(
        ...parsed.map(entry => ({
          nome: entry.nome,
          preco: Number(entry.preco) || 0,
          desc: entry.desc || "",
          categoria: entry.categoria || "",
          qty: Number(entry.qty) || 1,
          obs: entry.obs || "",
        }))
      );
    }
  } catch (e) {
    console.warn("Não foi possível carregar o carrinho:", e);
  }
}

// Função para verificar estoque disponível
async function verificarEstoqueDisponivel(produtoNome, quantidade = 1) {
  try {
    // Se a função do estoque.js estiver disponível, usar ela (compatibilidade)
    if (typeof window.verificarEstoqueGeladeira === 'function') {
      const resultado = await window.verificarEstoqueGeladeira(produtoNome, quantidade);
      return resultado;
    }
    
    // Verificar via API
    const estoque = await EstoqueAPI.get();
    if (!estoque || !estoque.geladeiras || !Array.isArray(estoque.geladeiras)) {
      // Se não há estoque cadastrado, permitir venda (compatibilidade)
      return true;
    }
    
    const produto = estoque.geladeiras.find(p => 
      p && p.nome && p.nome.toLowerCase() === produtoNome.toLowerCase()
    );
    
    if (!produto) {
      // Produto não encontrado no estoque - permitir venda se não há estoque cadastrado
      return true;
    }
    
    // Verificar se tem estoque suficiente
    return (produto.quantidade || 0) >= quantidade;
  } catch (e) {
    console.error('Erro ao verificar estoque:', e);
    // Em caso de erro, permitir (para não quebrar o sistema)
    return true;
  }
}

async function addToCart(item, cat) {
  // Verificar estoque antes de adicionar
  const temEstoque = await verificarEstoqueDisponivel(item.nome, 1);
  if (!temEstoque) {
    showToast(`Produto "${item.nome}" sem estoque disponível`);
    return;
  }
  
  const existing = cart.find(c => c.nome === item.nome);
  if (existing) {
    // Verificar se tem estoque suficiente para a nova quantidade
    const novaQuantidade = existing.qty + 1;
    const temEstoqueSuficiente = await verificarEstoqueDisponivel(item.nome, novaQuantidade);
    if (!temEstoqueSuficiente) {
      showToast(`Estoque insuficiente para "${item.nome}". Quantidade disponível já no carrinho.`);
      return;
    }
    existing.qty += 1;
  } else {
    cart.push({
      nome: item.nome,
      preco: parsePrice(item.preco),
      desc: item.desc,
      categoria: cat.titulo,
      qty: 1,
      obs: "",
    });
  }
  renderCart(true); // Mostrar mensagem ao adicionar item
}

async function updateQty(nome, delta) {
  const entry = cart.find(c => c.nome === nome);
  if (!entry) return;
  
  const novaQuantidade = entry.qty + delta;
  
  // Se está aumentando, verificar estoque
  if (delta > 0) {
    const temEstoque = await verificarEstoqueDisponivel(nome, novaQuantidade);
    if (!temEstoque) {
      showToast(`Estoque insuficiente para "${nome}"`);
      return;
    }
  }
  
  entry.qty = novaQuantidade;
  if (entry.qty <= 0) {
    const idx = cart.findIndex(c => c.nome === nome);
    cart.splice(idx, 1);
  }
  renderCart();
}

function removeItem(nome) {
  const idx = cart.findIndex(c => c.nome === nome);
  if (idx >= 0) {
    cart.splice(idx, 1);
    renderCart();
  }
}

// Função removida - agora usamos EstoqueAPI.reduzir() diretamente

function clearCart() {
  cart.length = 0;
  renderCart();
  showToast("Carrinho limpo");
}

function renderCart(mostrarMensagem = false) {
  cartList.innerHTML = "";
  if (!cart.length) {
    cartList.innerHTML = `<div class="cart-sub">Carrinho vazio</div>`;
    cartFloating.classList.remove("visible", "open");
    cartToggle.classList.remove("visible");
  } else {
    cartFloating.classList.add("visible");
    cartToggle.classList.add("visible");
    cart.forEach(entry => {
      const line = document.createElement("div");
      line.className = "cart-item";
      line.innerHTML = `
        <div class="cart-row">
          <div>
            <div class="item-title">${entry.nome}</div>
            <div class="cart-sub">${entry.categoria}</div>
          </div>
          <div class="item-price">${formatPrice(entry.preco * entry.qty)}</div>
        </div>
        <div class="cart-actions">
          <button class="chip" data-action="dec">-</button>
          <span>${entry.qty}x</span>
          <button class="chip" data-action="inc">+</button>
          <button class="link-btn" data-action="remove">Remover</button>
        </div>
      `;
      line.querySelector('[data-action="dec"]').onclick = async () => await updateQty(entry.nome, -1);
      line.querySelector('[data-action="inc"]').onclick = async () => await updateQty(entry.nome, 1);
      line.querySelector('[data-action="remove"]').onclick = () => removeItem(entry.nome);
      cartList.appendChild(line);
    });
  }

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalValue = cart.reduce((sum, item) => sum + item.preco * item.qty, 0);
  cartStatus.textContent = `${totalItems} ${totalItems === 1 ? "item" : "itens"}`;
  cartTotal.textContent = formatPrice(totalValue);
  cartToggle.textContent = `Ver Carrinho (${totalItems})`;
  if (cartFloating.classList.contains("open")) {
    cartToggle.classList.remove("visible");
    cartFinalize.classList.remove("visible"); // Esconder botão Finalizar quando carrinho está aberto
  } else if (cart.length) {
    cartFinalize.classList.add("visible");
  } else {
    cartFinalize.classList.remove("visible");
  }
  saveCart();
  
  // Só mostrar mensagem se explicitamente solicitado (ao adicionar item)
  if (mostrarMensagem && cart.length > 0) {
    showToast(`${cart[cart.length - 1]?.nome || "Item"} adicionado ao carrinho`);
  }
}

clearCartBtn.addEventListener("click", clearCart);
checkoutBtn.addEventListener("click", () => openCheckoutModal());
cartToggle.addEventListener("click", () => {
  cartFloating.classList.toggle("open");
  if (cartFloating.classList.contains("open")) {
    cartToggle.classList.remove("visible");
    cartFinalize.classList.remove("visible");
  } else if (cart.length) {
    cartToggle.classList.add("visible");
    cartFinalize.classList.add("visible");
  }
});
closeCartBtn.addEventListener("click", () => {
  cartFloating.classList.remove("open");
  if (cart.length) cartToggle.classList.add("visible");
  if (cart.length) cartFinalize.classList.add("visible");
});
cartFinalize.addEventListener("click", () => {
  if (!cart.length) return;
  openCheckoutModal();
});
modalClose.addEventListener("click", closeCheckoutModal);
modalConfirm.addEventListener("click", () => {
  const mesa = tableInput.value.trim();
  const tableInputError = document.getElementById("tableInputError");
  
  if (!mesa) {
    // Mostrar mensagem de erro mais visível
    if (tableInputError) {
      tableInputError.textContent = "⚠️ Por favor, informe o número da mesa ou identificação";
      tableInputError.classList.add("show");
    }
    tableInput.focus();
    tableInput.classList.add("error");
    
    // Remover o destaque após um tempo
    setTimeout(() => {
      tableInput.classList.remove("error");
      if (tableInputError) {
        tableInputError.classList.remove("show");
      }
    }, 5000);
    return;
  }
  
  // Esconder mensagem de erro se o campo estiver preenchido
  if (tableInputError) {
    tableInputError.classList.remove("show");
  }
  tableInput.classList.remove("error");
  
  showToast("Pedido confirmado");
  closeCheckoutModal();
  goToPayment();
});
document.addEventListener("keydown", (ev) => {
  // Atalho: seta para a esquerda retorna à lista de categorias quando estiver em itens
  if (ev.key === "ArrowLeft" && itemsScreen.classList.contains("active")) {
    ev.preventDefault();
    backToCategories();
  }
});
backBtn.addEventListener("click", backToCategories);
loadMenuData().then(() => {
  renderCategories();
});
loadCart();
renderCart();

function openCheckoutModal() {
  if (!cart.length) return;
  modalItems.innerHTML = "";
  cart.forEach(entry => {
    const block = document.createElement("div");
    block.className = "modal-item";
    block.innerHTML = `
      <div class="modal-row">
        <div>
          <div class="item-title">${entry.nome}</div>
          <div class="cart-sub">${entry.categoria} · ${entry.qty}x</div>
        </div>
        <div class="item-price">${formatPrice(entry.preco * entry.qty)}</div>
      </div>
      <textarea class="modal-note" placeholder="Observação (opcional)">${entry.obs || ""}</textarea>
    `;
    const textarea = block.querySelector(".modal-note");
    textarea.addEventListener("input", () => {
      entry.obs = textarea.value;
      saveCart();
    });
    modalItems.appendChild(block);
  });
  const totalValue = cart.reduce((sum, item) => sum + item.preco * item.qty, 0);
  modalTotal.textContent = formatPrice(totalValue);
  
  // Limpar campo de mesa e resetar estilo
  tableInput.value = "";
  tableInput.classList.remove("error");
  const tableInputError = document.getElementById("tableInputError");
  if (tableInputError) {
    tableInputError.classList.remove("show");
  }
  
  checkoutModal.classList.add("open");
  
  // Focar no campo de mesa após abrir o modal
  setTimeout(() => tableInput.focus(), 100);
}

function closeCheckoutModal() {
  checkoutModal.classList.remove("open");
}

function goToPayment() {
  const totalValue = cart.reduce((sum, item) => sum + item.preco * item.qty, 0);
  paymentInfo.textContent = `Total: ${formatPrice(totalValue)} (${cart.reduce((s,i)=>s+i.qty,0)} itens)`;
  cardNumber.value = "";
  cardHolder.value = "";
  cardBalance.value = "";
  cardBalance.style.color = "";
  cardTime.value = "";
  cartaoAtual = null;
  ocultarStatusCartao();
  breadcrumb.textContent = "Pagamento";
  title.textContent = "Pagamento";
  backBtn.style.display = "none";
  cartFabs.style.display = "none";
  switchScreen("payment");
  
  // Focar no campo de número do cartão
  setTimeout(() => cardNumber.focus(), 100);
}

// Migrar dados do localStorage para o backend (se necessário)
async function migrarCartoesLocalStorage() {
  try {
    const cartoesBackend = await CartoesAPI.getAll();
    
    // Se não há cartões no backend, verificar localStorage
    if (cartoesBackend.length === 0) {
      const cartoesLocalStorage = JSON.parse(localStorage.getItem('cartoes') || '[]');
      
      if (cartoesLocalStorage.length > 0) {
        console.log(`[Migração] Encontrados ${cartoesLocalStorage.length} cartões no localStorage. Migrando...`);
        await CartoesAPI.save(cartoesLocalStorage);
        console.log('[Migração] ✅ Cartões migrados com sucesso!');
        // Limpar localStorage após migração
        localStorage.removeItem('cartoes');
        return cartoesLocalStorage;
      }
    }
    
    return cartoesBackend;
  } catch (error) {
    console.error('Erro ao migrar dados:', error);
    return [];
  }
}

// Verificar se há cartões no sistema
async function verificarCartoesDisponiveis() {
  try {
    // Tentar migrar dados primeiro
    let cartoes = await migrarCartoesLocalStorage();
    
    // Se ainda não há cartões, carregar do backend
    if (cartoes.length === 0) {
      cartoes = await CartoesAPI.getAll();
    }
    
    const total = Array.isArray(cartoes) ? cartoes.length : 0;
    const existe = total > 0;
    
    // Atualizar cache
    cartoesDisponiveisCache = existe;
    cacheTimestamp = Date.now();
    
    console.log(`[Verificação] Cartões disponíveis: ${total} (existe: ${existe})`);
    
    return { 
      existe, 
      total, 
      mensagem: existe ? `${total} cartão(ões) cadastrado(s)` : 'Nenhum cartão cadastrado. Crie cartões na página de administração.' 
    };
  } catch (e) {
    cartoesDisponiveisCache = false;
    console.error('[Verificação] Erro:', e);
    return { existe: false, total: 0, mensagem: 'Erro ao ler cartões do sistema' };
  }
}

// Buscar cartão por número
async function buscarCartao(numero) {
  try {
    const numeroLimpo = String(numero).replace(/\s/g, '').trim();
    
    // Não buscar se o número for muito curto
    if (numeroLimpo.length < 4) {
      return null;
    }
    
    console.log('[Frontend] Buscando cartão:', numeroLimpo);
    const cartao = await CartoesAPI.buscarPorNumero(numeroLimpo);
    
    if (cartao) {
      console.log('[Frontend] ✅ Cartão encontrado:', cartao.numero, '-', cartao.nome);
    } else {
      console.log('[Frontend] ❌ Cartão não encontrado:', numeroLimpo);
    }
    
    return cartao;
  } catch (error) {
    console.error('[Frontend] Erro ao buscar cartão:', error);
    return null;
  }
}

// Validar e carregar dados do cartão
async function validarECarregarCartao() {
  const numero = cardNumber.value.trim().replace(/\s/g, '');
  
  if (!numero || numero.length < 4) {
    limparDadosCartao();
    ocultarStatusCartao();
    return false;
  }
  
  // Verificar cache primeiro para evitar requisições desnecessárias
  const agora = Date.now();
  let info = null;
  if (!cartoesDisponiveisCache || (agora - cacheTimestamp) > CACHE_DURATION) {
    info = await verificarCartoesDisponiveis();
  } else {
    // Usar cache - buscar apenas o total se necessário
    try {
      const cartoes = await CartoesAPI.getAll();
      const total = Array.isArray(cartoes) ? cartoes.length : 0;
      info = { existe: cartoesDisponiveisCache, total };
    } catch (e) {
      info = await verificarCartoesDisponiveis();
    }
  }
  
  if (!info.existe) {
    cardHolder.value = "Nenhum cartão cadastrado";
    cardBalance.value = "";
    cardTime.value = new Date().toLocaleTimeString('pt-BR');
    cartaoAtual = null;
    mostrarStatusCartao("⚠️ Nenhum cartão cadastrado. Acesse a página de administração para criar cartões.", "danger");
    return false;
  }
  
  const cartao = await buscarCartao(numero);
  
  if (!cartao) {
    cardHolder.value = "Cartão não encontrado";
    cardBalance.value = "";
    cardTime.value = new Date().toLocaleTimeString('pt-BR');
    cartaoAtual = null;
    mostrarStatusCartao(`Cartão não encontrado. ${info.total} cartão(ões) cadastrado(s) no sistema.`, "danger");
    return false;
  }
  
  if (!cartao.ativo) {
    cardHolder.value = cartao.nome;
    cardBalance.value = "Cartão DESATIVADO";
    cardBalance.style.color = "var(--danger)";
    cardTime.value = new Date().toLocaleTimeString('pt-BR');
    cartaoAtual = null;
    mostrarStatusCartao("Este cartão está desativado", "danger");
    return false;
  }
  
  // Cartão válido
  cartaoAtual = cartao;
  cardHolder.value = cartao.nome;
  cardBalance.value = formatPrice(cartao.saldo);
  cardBalance.style.color = cartao.saldo > 0 ? "var(--accent)" : "var(--danger)";
  cardTime.value = new Date().toLocaleTimeString('pt-BR');
  
  // Verificar saldo suficiente
  const totalValue = cart.reduce((sum, item) => sum + item.preco * item.qty, 0);
  if (cartao.saldo < totalValue) {
    const falta = totalValue - cartao.saldo;
    mostrarStatusCartao(`Saldo insuficiente. Faltam ${formatPrice(falta)}`, "danger");
    return false;
  }
  
  // Saldo suficiente
  const saldoRestante = cartao.saldo - totalValue;
  mostrarStatusCartao(`Saldo suficiente. Após o pagamento: ${formatPrice(saldoRestante)}`, "success");
  return true;
}

function mostrarStatusCartao(mensagem, tipo) {
  cardStatus.style.display = "block";
  cardStatusText.textContent = mensagem;
  cardStatus.style.borderColor = tipo === "success" ? "var(--accent)" : "var(--danger)";
  cardStatusText.style.color = tipo === "success" ? "var(--accent)" : "var(--danger)";
}

function ocultarStatusCartao() {
  cardStatus.style.display = "none";
}

function limparDadosCartao() {
  cardHolder.value = "";
  cardBalance.value = "";
  cardBalance.style.color = "";
  cardTime.value = "";
  cartaoAtual = null;
  ocultarStatusCartao();
}

// Processar pagamento com cartão
async function processarPagamentoComCartao() {
  if (!cartaoAtual) {
    showToast("Cartão não encontrado ou inválido");
    return false;
  }
  
  const totalValue = cart.reduce((sum, item) => sum + item.preco * item.qty, 0);
  
  if (cartaoAtual.saldo < totalValue) {
    showToast(`Saldo insuficiente. Saldo atual: ${formatPrice(cartaoAtual.saldo)}`);
    return false;
  }
  
  try {
    // Preparar itens para envio
    const itens = cart.map(item => ({
      nome: item.nome,
      quantidade: item.qty,
      preco: item.preco,
      total: item.preco * item.qty
    }));
    
    // Debitar do saldo via API
    const resultado = await CartoesAPI.debitar(cartaoAtual.id, totalValue, itens);
    if (resultado.success && resultado.cartao) {
      cartaoAtual.saldo = resultado.cartao.saldo;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    showToast("Erro ao processar pagamento. Tente novamente.");
    return false;
  }
}

paymentBack.addEventListener("click", () => {
  switchScreen("items");
  breadcrumb.textContent = "Itens";
  title.textContent = "Itens";
  cartFabs.style.display = "flex";
});

// Event listener para buscar cartão ao digitar
cardNumber.addEventListener("input", (e) => {
  const numero = e.target.value.trim().replace(/\s/g, '');
  
  // Limpar dados se campo estiver vazio
  if (!numero || numero.length < 4) {
    limparDadosCartao();
    return;
  }
  
  // Buscar cartão quando tiver pelo menos 4 caracteres (pode ser apenas os últimos dígitos)
  if (numero.length >= 4) {
    // Aguardar um pouco para não buscar a cada tecla (debounce)
    clearTimeout(window.buscaCartaoTimer);
    window.buscaCartaoTimer = setTimeout(async () => {
      // Verificar cache antes de buscar
      const agora = Date.now();
      if (!cartoesDisponiveisCache || (agora - cacheTimestamp) > CACHE_DURATION) {
        const info = await verificarCartoesDisponiveis();
        if (!info.existe) {
          limparDadosCartao();
          mostrarStatusCartao("⚠️ Nenhum cartão cadastrado. Acesse a página de administração para criar cartões.", "danger");
          return;
        }
      }
      
      // Só buscar se houver cartões cadastrados
      if (cartoesDisponiveisCache) {
        await validarECarregarCartao();
      }
    }, 800); // Aumentado para 800ms para reduzir ainda mais as requisições
  }
});

// Event listener para buscar ao perder foco
cardNumber.addEventListener("blur", async () => {
  const numero = cardNumber.value.trim().replace(/\s/g, '');
  if (numero.length >= 4) {
    // Verificar se há cartões antes de buscar
    const agora = Date.now();
    if (!cartoesDisponiveisCache || (agora - cacheTimestamp) > CACHE_DURATION) {
      const info = await verificarCartoesDisponiveis();
      if (!info.existe) {
        limparDadosCartao();
        mostrarStatusCartao("⚠️ Nenhum cartão cadastrado. Acesse a página de administração para criar cartões.", "danger");
        return;
      }
    }
    
    if (cartoesDisponiveisCache) {
      await validarECarregarCartao();
    }
  }
});

paymentConfirm.addEventListener("click", async () => {
  const totalValue = cart.reduce((sum, item) => sum + item.preco * item.qty, 0);
  
  // Validar cartão antes de processar
  const cartaoValido = await validarECarregarCartao();
  if (!cartaoValido) {
    if (!cartaoAtual) {
      showToast("Digite um número de cartão válido");
    }
    return;
  }
  
  // Verificar estoque antes de processar pagamento
  const produtosSemEstoque = [];
  for (const item of cart) {
    const disponivel = await verificarEstoqueDisponivel(item.nome, item.qty);
    if (!disponivel) {
      produtosSemEstoque.push(item.nome);
    }
  }
  
  if (produtosSemEstoque.length > 0) {
    showToast(`Não é possível finalizar: produtos sem estoque suficiente: ${produtosSemEstoque.join(', ')}`);
    return;
  }
  
  // Processar pagamento
  const pagamentoOk = await processarPagamentoComCartao();
  if (pagamentoOk) {
    // Reduzir estoque das geladeiras para cada item vendido
    for (const item of cart) {
      try {
        await EstoqueAPI.reduzir(item.nome, item.qty);
      } catch (error) {
        console.error(`Erro ao reduzir estoque de ${item.nome}:`, error);
      }
    }
    
    showToast("Pagamento confirmado");
    
    // Limpar carrinho
    cart.length = 0;
    saveCart();
    renderCart(false); // Não mostrar mensagem ao limpar após pagamento
    
    // Voltar para categorias
    setTimeout(() => {
      backToCategories();
      cartFabs.style.display = "flex";
    }, 1000);
  }
});

