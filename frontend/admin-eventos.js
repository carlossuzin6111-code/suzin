let eventos = [];
let eventoEditando = null;
let eventoItens = [];
let eventoReposicoes = [];

// Expor funções globalmente para fallback onclick
window.confirmarFinalizacao = confirmarFinalizacao;

// Flag para evitar múltiplas inicializações
let eventosInicializado = false;

// Fechar menus ao clicar fora
document.addEventListener('click', (e) => {
  if (!e.target.closest('.evento-menu-container')) {
    document.querySelectorAll('.evento-menu-dropdown').forEach(menu => {
      menu.style.display = 'none';
    });
  }
});

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  if (eventosInicializado) {
    console.log('[Admin-Eventos] Já inicializado, ignorando...');
    return;
  }
  
  console.log('[Admin-Eventos] Inicializando...');
  eventosInicializado = true;
  
  try {
    await loadEventos();
    await carregarProdutos();
    setupEventos();
    renderEventos();
    console.log('[Admin-Eventos] Inicialização concluída');
  } catch (error) {
    console.error('[Admin-Eventos] Erro na inicialização:', error);
    showToast('Erro ao inicializar. Verifique o console.');
    eventosInicializado = false; // Permitir nova tentativa em caso de erro
  }
});

// Carregar eventos
async function loadEventos() {
  try {
    console.log('[Admin-Eventos] Carregando eventos da API...');
    eventos = await EventosAPI.getAll();
    if (!Array.isArray(eventos)) {
      console.warn('[Admin-Eventos] Resposta da API não é um array, inicializando como array vazio');
      eventos = [];
    }
    console.log('[Admin-Eventos] ✅ Eventos carregados:', eventos.length);
  } catch (error) {
    console.error('[Admin-Eventos] ❌ Erro ao carregar eventos:', error);
    showToast('Erro ao carregar eventos. Verifique o console.');
    eventos = [];
  }
}

// Salvar eventos
async function saveEventos() {
  try {
    await EventosAPI.save(eventos);
  } catch (error) {
    console.error('Erro ao salvar eventos:', error);
    showToast('Erro ao salvar eventos. Tente novamente.');
  }
}

// Carregar produtos do estoque
async function carregarProdutos() {
  try {
    console.log('[Admin-Eventos] Carregando produtos do estoque...');
    const estoque = await EstoqueAPI.get();
    console.log('[Admin-Eventos] Estoque recebido:', estoque);
    
    if (!estoque || typeof estoque !== 'object') {
      console.warn('[Admin-Eventos] Estoque inválido ou vazio');
      return;
    }
    
    const produtosGeladeiras = Array.isArray(estoque.geladeiras) ? estoque.geladeiras : [];
    const produtosCameraFria = Array.isArray(estoque.cameraFria) ? estoque.cameraFria : [];
    const produtos = [...produtosGeladeiras, ...produtosCameraFria];
    
    console.log('[Admin-Eventos] Produtos encontrados:', produtos.length);
    console.log('[Admin-Eventos] Geladeiras:', produtosGeladeiras.length);
    console.log('[Admin-Eventos] Câmera Fria:', produtosCameraFria.length);
    
    if (produtos.length > 0) {
      console.log('[Admin-Eventos] Primeiros produtos:', produtos.slice(0, 3).map(p => `${p.nome} (ID: ${p.id})`));
    }
    
    const selectEvento = document.getElementById('eventoProduto');
    const selectReposicao = document.getElementById('reposicaoProduto');
    
    if (selectEvento) {
      if (produtos.length === 0) {
        selectEvento.innerHTML = '<option value="">Nenhum produto no estoque</option>';
        console.warn('[Admin-Eventos] Nenhum produto encontrado no estoque');
      } else {
        selectEvento.innerHTML = '<option value="">Selecione um produto</option>' +
          produtos
            .filter(p => p && p.id && p.nome) // Filtrar produtos válidos
            .map(p => `<option value="${p.id}">${p.nome}</option>`)
            .join('');
        console.log('[Admin-Eventos] ✅ Select evento populado com', produtos.filter(p => p && p.id && p.nome).length, 'produtos');
      }
    } else {
      console.error('[Admin-Eventos] Select eventoProduto não encontrado!');
    }
    
    if (selectReposicao) {
      if (produtos.length === 0) {
        selectReposicao.innerHTML = '<option value="">Nenhum produto no estoque</option>';
      } else {
        selectReposicao.innerHTML = '<option value="">Selecione um produto</option>' +
          produtos
            .filter(p => p && p.id && p.nome) // Filtrar produtos válidos
            .map(p => `<option value="${p.id}">${p.nome}</option>`)
            .join('');
        console.log('[Admin-Eventos] ✅ Select reposição populado com', produtos.filter(p => p && p.id && p.nome).length, 'produtos');
      }
    } else {
      console.error('[Admin-Eventos] Select reposicaoProduto não encontrado!');
    }
  } catch (error) {
    console.error('[Admin-Eventos] ❌ Erro ao carregar produtos:', error);
    showToast('Erro ao carregar produtos do estoque. Verifique o console.');
  }
}

// Flag para evitar múltiplas configurações
let eventListenersConfigurados = false;

// Setup Eventos
function setupEventos() {
  console.log('[Admin-Eventos] setupEventos() iniciado');
  
  if (eventListenersConfigurados) {
    console.log('[Admin-Eventos] ⚠️ Event listeners já configurados, ignorando...');
    return;
  }
  
  const btnNovoEvento = document.getElementById('btnNovoEvento');
  if (!btnNovoEvento) {
    console.error('[Admin-Eventos] ❌ Botão btnNovoEvento não encontrado!');
    // Tentar novamente após um delay
    setTimeout(() => {
      console.log('[Admin-Eventos] Tentando novamente...');
      const btn = document.getElementById('btnNovoEvento');
      if (btn) {
        console.log('[Admin-Eventos] ✅ Botão encontrado na segunda tentativa!');
        configurarBotaoNovoEvento(btn);
        eventListenersConfigurados = true;
      } else {
        console.error('[Admin-Eventos] ❌ Botão ainda não encontrado após segunda tentativa');
      }
    }, 500);
    return;
  }
  
  configurarBotaoNovoEvento(btnNovoEvento);
  eventListenersConfigurados = true;
  console.log('[Admin-Eventos] ✅ Todos os event listeners configurados!');
}

function configurarBotaoNovoEvento(btn) {
  console.log('[Admin-Eventos] ✅ Botão btnNovoEvento encontrado!');
  console.log('[Admin-Eventos] Configurando event listener...');
  
  // Remover event listeners anteriores
  const novoBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(novoBtn, btn);
  
  novoBtn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[Admin-Eventos] ✅ Botão Novo Evento clicado!');
    novoEvento();
    return false;
  };
  
  // Também adicionar addEventListener como backup
  novoBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[Admin-Eventos] ✅ Botão Novo Evento clicado (addEventListener)!');
    novoEvento();
    return false;
  });
  
  console.log('[Admin-Eventos] ✅ Event listeners configurados!');
  
  const searchEvento = document.getElementById('searchEvento');
  if (searchEvento) {
    searchEvento.addEventListener('input', (e) => {
      renderEventos(e.target.value);
    });
  } else {
    console.warn('[Admin-Eventos] Campo searchEvento não encontrado!');
  }

  // Modal Evento
  const modalEvento = document.getElementById('modalEvento');
  if (!modalEvento) {
    console.error('[Admin-Eventos] Modal evento não encontrado no setup!');
  }
  
  const modalEventoClose = document.getElementById('modalEventoClose');
  const modalEventoCancel = document.getElementById('modalEventoCancel');
  const modalEventoSave = document.getElementById('modalEventoSave');
  const btnAdicionarItemEvento = document.getElementById('btnAdicionarItemEvento');
  
  if (modalEventoClose) {
    modalEventoClose.addEventListener('click', closeModalEvento);
  } else {
    console.warn('[Admin-Eventos] Botão modalEventoClose não encontrado!');
  }
  
  if (modalEventoCancel) {
    modalEventoCancel.addEventListener('click', closeModalEvento);
  } else {
    console.warn('[Admin-Eventos] Botão modalEventoCancel não encontrado!');
  }
  
  if (modalEventoSave) {
    // Remover event listeners anteriores para evitar duplicação
    const novoBotao = modalEventoSave.cloneNode(true);
    modalEventoSave.parentNode.replaceChild(novoBotao, modalEventoSave);
    
    novoBotao.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[Admin-Eventos] Botão salvar evento clicado');
      await salvarEvento();
    });
    console.log('[Admin-Eventos] ✅ Botão salvar evento configurado');
  } else {
    console.warn('[Admin-Eventos] Botão modalEventoSave não encontrado!');
  }

  if (btnAdicionarItemEvento) {
    btnAdicionarItemEvento.addEventListener('click', () => {
      adicionarItemEvento();
    });
  } else {
    console.warn('[Admin-Eventos] Botão btnAdicionarItemEvento não encontrado!');
  }

  if (modalEvento) {
    modalEvento.addEventListener('click', (e) => {
      if (e.target === modalEvento) {
        closeModalEvento();
      }
    });
  }

  // Modal Reposição
  const modalReposicao = document.getElementById('modalReposicao');
  if (modalReposicao) {
    const modalReposicaoClose = document.getElementById('modalReposicaoClose');
    const modalReposicaoCancel = document.getElementById('modalReposicaoCancel');
    const modalReposicaoSave = document.getElementById('modalReposicaoSave');
    
    if (modalReposicaoClose) {
      modalReposicaoClose.addEventListener('click', closeModalReposicao);
    }
    if (modalReposicaoCancel) {
      modalReposicaoCancel.addEventListener('click', closeModalReposicao);
    }
    if (modalReposicaoSave) {
      modalReposicaoSave.addEventListener('click', async () => {
        await adicionarReposicao();
      });
    }
    
    modalReposicao.addEventListener('click', (e) => {
      if (e.target === modalReposicao) {
        closeModalReposicao();
      }
    });
  }

  // Modal Finalização
  const modalFinalizacao = document.getElementById('modalFinalizacao');
  if (modalFinalizacao) {
    console.log('[Admin-Eventos] Configurando modal de finalização...');
    const modalFinalizacaoClose = document.getElementById('modalFinalizacaoClose');
    const modalFinalizacaoCancel = document.getElementById('modalFinalizacaoCancel');
    const modalFinalizacaoSave = document.getElementById('modalFinalizacaoSave');
    
    if (modalFinalizacaoClose) {
      modalFinalizacaoClose.addEventListener('click', closeModalFinalizacao);
      console.log('[Admin-Eventos] ✅ Botão fechar finalização configurado');
    } else {
      console.warn('[Admin-Eventos] Botão modalFinalizacaoClose não encontrado!');
    }
    
    if (modalFinalizacaoCancel) {
      modalFinalizacaoCancel.addEventListener('click', closeModalFinalizacao);
      console.log('[Admin-Eventos] ✅ Botão cancelar finalização configurado');
    } else {
      console.warn('[Admin-Eventos] Botão modalFinalizacaoCancel não encontrado!');
    }
    
    if (modalFinalizacaoSave) {
      modalFinalizacaoSave.addEventListener('click', async () => {
        console.log('[Admin-Eventos] Botão Finalizar Evento clicado!');
        await confirmarFinalizacao();
      });
      console.log('[Admin-Eventos] ✅ Botão salvar finalização configurado');
    } else {
      console.error('[Admin-Eventos] ❌ Botão modalFinalizacaoSave não encontrado!');
    }
    
    modalFinalizacao.addEventListener('click', (e) => {
      if (e.target === modalFinalizacao) {
        closeModalFinalizacao();
      }
    });
  } else {
    console.error('[Admin-Eventos] ❌ Modal finalização não encontrado no setup!');
  }

  // Modal Relatório
  const modalRelatorio = document.getElementById('modalRelatorio');
  if (modalRelatorio) {
    const modalRelatorioClose = document.getElementById('modalRelatorioClose');
    const modalRelatorioCloseBtn = document.getElementById('modalRelatorioCloseBtn');
    
    if (modalRelatorioClose) {
      modalRelatorioClose.addEventListener('click', closeModalRelatorio);
    }
    if (modalRelatorioCloseBtn) {
      modalRelatorioCloseBtn.addEventListener('click', closeModalRelatorio);
    }
    
    modalRelatorio.addEventListener('click', (e) => {
      if (e.target === modalRelatorio) {
        closeModalRelatorio();
      }
    });
  }

  // Botão Relatório Geral
  const btnRelatorio = document.getElementById('btnRelatorio');
  if (btnRelatorio) {
    btnRelatorio.addEventListener('click', () => {
      gerarRelatorioGeral();
    });
  }
  
  console.log('[Admin-Eventos] ✅ Configuração de event listeners concluída');
}

async function novoEvento() {
  console.log('[Admin-Eventos] novoEvento() chamado');
  
  try {
    // Recarregar produtos antes de abrir o modal
    console.log('[Admin-Eventos] Recarregando produtos do estoque...');
    await carregarProdutos();
    
    eventoEditando = null;
    eventoItens = [];
    eventoReposicoes = [];
    
    const modalEvento = document.getElementById('modalEvento');
    if (!modalEvento) {
      console.error('[Admin-Eventos] Modal evento não encontrado!');
      showToast('Erro: Modal não encontrado. Recarregue a página.');
      return;
    }
    
    const modalEventoTitle = document.getElementById('modalEventoTitle');
    const eventoNome = document.getElementById('eventoNome');
    const eventoData = document.getElementById('eventoData');
    const eventoDescricao = document.getElementById('eventoDescricao');
    const eventoQuantidade = document.getElementById('eventoQuantidade');
    const eventoProduto = document.getElementById('eventoProduto');
    
    if (modalEventoTitle) modalEventoTitle.textContent = 'Novo Evento';
    if (eventoNome) eventoNome.value = '';
    if (eventoData) eventoData.value = new Date().toISOString().split('T')[0];
    if (eventoDescricao) eventoDescricao.value = '';
    if (eventoQuantidade) eventoQuantidade.value = '';
    if (eventoProduto) eventoProduto.value = '';
    
    renderEventoItens();
    modalEvento.classList.add('active');
    console.log('[Admin-Eventos] Modal aberto com sucesso');
  } catch (error) {
    console.error('[Admin-Eventos] Erro ao abrir modal:', error);
    showToast('Erro ao abrir modal. Verifique o console.');
  }
}

function adicionarItemEvento() {
  const produtoId = document.getElementById('eventoProduto').value;
  const quantidade = parseInt(document.getElementById('eventoQuantidade').value);
  
  if (!produtoId || !quantidade || quantidade <= 0) {
    showToast('Por favor, selecione um produto e informe a quantidade');
    return;
  }

  // Buscar produto no estoque
  EstoqueAPI.get().then(estoque => {
    const produtos = [...(estoque.geladeiras || []), ...(estoque.cameraFria || [])];
    const produto = produtos.find(p => p.id == produtoId);
    
    if (!produto) {
      showToast('Produto não encontrado');
      return;
    }

    // Verificar se já existe
    const itemExistente = eventoItens.find(item => item.produtoId == produtoId);
    if (itemExistente) {
      itemExistente.quantidade += quantidade;
    } else {
      eventoItens.push({
        produtoId: produto.id,
        produtoNome: produto.nome,
        quantidade: quantidade,
        quantidadeInicial: quantidade
      });
    }

    document.getElementById('eventoQuantidade').value = '';
    document.getElementById('eventoProduto').value = '';
    renderEventoItens();
  });
}

function renderEventoItens() {
  const container = document.getElementById('eventoItensList');
  
  if (eventoItens.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--muted); margin: 0;">Nenhum item adicionado</p>';
    return;
  }

  container.innerHTML = eventoItens.map((item, index) => `
    <div class="item-row">
      <div class="item-info">
        <div class="item-name">${item.produtoNome}</div>
        <div class="item-quantity">Quantidade: ${item.quantidade}</div>
      </div>
      <div class="item-actions">
        <button class="danger" onclick="removerItemEvento(${index})">Remover</button>
      </div>
    </div>
  `).join('');
}

function removerItemEvento(index) {
  eventoItens.splice(index, 1);
  renderEventoItens();
}

// Flag para evitar múltiplas execuções simultâneas
let salvandoEvento = false;

async function salvarEvento() {
  if (salvandoEvento) {
    console.log('[Admin-Eventos] ⚠️ Já está salvando um evento, ignorando...');
    return;
  }
  
  salvandoEvento = true;
  console.log('[Admin-Eventos] 🎯 salvarEvento() chamado');
  
  try {
    const nome = document.getElementById('eventoNome').value.trim();
    const data = document.getElementById('eventoData').value;
    const descricao = document.getElementById('eventoDescricao').value.trim();

    if (!nome) {
      showToast('Por favor, preencha o nome do evento');
      salvandoEvento = false;
      return;
    }

    if (!data) {
      showToast('Por favor, selecione a data do evento');
      salvandoEvento = false;
      return;
    }

    if (eventoItens.length === 0) {
      showToast('Por favor, adicione pelo menos uma bebida');
      salvandoEvento = false;
      return;
    }

    const novoEvento = {
      id: Date.now(),
      nome,
      data,
      descricao,
      itens: eventoItens.map(item => ({
        produtoId: item.produtoId,
        produtoNome: item.produtoNome,
        quantidadeInicial: item.quantidadeInicial,
        quantidadeAtual: item.quantidade,
        reposicoes: []
      })),
      finalizado: false,
      dataCriacao: new Date().toISOString(),
      dataFinalizacao: null
    };

    console.log('[Admin-Eventos] Criando evento:', novoEvento.nome);
    eventos.push(novoEvento);
    await saveEventos();
    renderEventos();
    closeModalEvento();
    showToast('Evento criado com sucesso!');
    console.log('[Admin-Eventos] ✅ Evento criado com sucesso!');
  } catch (error) {
    console.error('[Admin-Eventos] ❌ Erro ao salvar evento:', error);
    showToast('Erro ao salvar evento. Verifique o console.');
  } finally {
    salvandoEvento = false;
  }
}

async function finalizarEvento(evento) {
  console.log('[Admin-Eventos] finalizarEvento() chamado para:', evento.nome);
  
  eventoEditando = evento;
  
  const modalFinalizacao = document.getElementById('modalFinalizacao');
  if (!modalFinalizacao) {
    console.error('[Admin-Eventos] ❌ Modal finalização não encontrado!');
    showToast('Erro: Modal de finalização não encontrado. Recarregue a página.');
    return;
  }
  
  console.log('[Admin-Eventos] Modal encontrado, renderizando itens...');
  // Renderizar itens no modal de finalização
  renderFinalizacaoItens(evento);
  console.log('[Admin-Eventos] Abrindo modal de finalização...');
  modalFinalizacao.classList.add('active');
  console.log('[Admin-Eventos] ✅ Modal de finalização aberto');
}

function renderFinalizacaoItens(evento) {
  const container = document.getElementById('finalizacaoItensList');
  if (!container) return;
  
  if (!evento.itens || evento.itens.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--muted);">Nenhum item no evento</p>';
    return;
  }
  
  container.innerHTML = evento.itens.map((item, index) => {
    const totalReposicoes = (item.reposicoes || []).reduce((sum, rep) => sum + rep.quantidade, 0);
    const totalDisponivel = item.quantidadeInicial + totalReposicoes;
    
    return `
      <div class="field" style="background: #0a0f1a; padding: 16px; border-radius: 12px; border: 1px solid #1f2937; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div>
            <strong style="font-size: 16px;">${item.produtoNome}</strong>
            <div style="font-size: 12px; color: var(--muted); margin-top: 4px;">
              Inicial: ${item.quantidadeInicial} | Reposições: ${totalReposicoes} | Total: ${totalDisponivel}
            </div>
          </div>
        </div>
        <div class="field" style="margin-bottom: 0;">
          <label for="fisico_${index}">Quantidade Física Restante</label>
          <input type="number" id="fisico_${index}" 
                 placeholder="0" 
                 min="0" 
                 step="1" 
                 max="${totalDisponivel}"
                 value="${item.quantidadeFisicaRestante || ''}"
                 onchange="calcularConsumo(${index}, ${item.quantidadeInicial}, ${totalReposicoes})" />
        </div>
        <div id="consumo_${index}" style="margin-top: 8px; padding: 8px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; display: none;">
          <strong style="color: var(--accent);">Consumido: <span id="consumo_valor_${index}">0</span></strong>
        </div>
      </div>
    `;
  }).join('');
}

function calcularConsumo(index, quantidadeInicial, totalReposicoes) {
  const input = document.getElementById(`fisico_${index}`);
  const consumoDiv = document.getElementById(`consumo_${index}`);
  const consumoValor = document.getElementById(`consumo_valor_${index}`);
  
  if (!input || !consumoDiv || !consumoValor) return;
  
  const quantidadeFisica = parseInt(input.value) || 0;
  const totalDisponivel = quantidadeInicial + totalReposicoes;
  const consumido = totalDisponivel - quantidadeFisica;
  
  if (quantidadeFisica >= 0 && quantidadeFisica <= totalDisponivel) {
    consumoValor.textContent = consumido;
    consumoDiv.style.display = 'block';
  } else {
    consumoDiv.style.display = 'none';
    if (quantidadeFisica > totalDisponivel) {
      showToast('A quantidade física não pode ser maior que o total disponível!');
      input.value = totalDisponivel;
    }
  }
}

async function confirmarFinalizacao() {
  console.log('[Admin-Eventos] 🎯 confirmarFinalizacao() chamado');
  
  if (!eventoEditando) {
    console.error('[Admin-Eventos] ❌ Nenhum evento sendo editado!');
    showToast('Erro: Nenhum evento selecionado');
    return;
  }
  
  console.log('[Admin-Eventos] Evento sendo finalizado:', eventoEditando.nome);
  
  const eventoIndex = eventos.findIndex(e => e.id === eventoEditando.id);
  if (eventoIndex === -1) {
    console.error('[Admin-Eventos] ❌ Evento não encontrado no array!');
    showToast('Evento não encontrado');
    return;
  }
  
  const evento = eventos[eventoIndex];
  let todosPreenchidos = true;
  const itensComErro = [];
  
  console.log('[Admin-Eventos] Coletando quantidades físicas de', evento.itens.length, 'itens...');
  
  // Coletar quantidades físicas e calcular consumo
  evento.itens.forEach((item, index) => {
    const input = document.getElementById(`fisico_${index}`);
    if (!input) {
      console.warn(`[Admin-Eventos] Input fisico_${index} não encontrado para ${item.produtoNome}!`);
      todosPreenchidos = false;
      itensComErro.push(item.produtoNome);
      return;
    }
    
    const quantidadeFisica = parseInt(input.value);
    if (isNaN(quantidadeFisica) || quantidadeFisica < 0) {
      console.warn(`[Admin-Eventos] Quantidade física inválida para ${item.produtoNome}:`, input.value);
      todosPreenchidos = false;
      itensComErro.push(item.produtoNome);
      return;
    }
    
    const totalReposicoes = (item.reposicoes || []).reduce((sum, rep) => sum + rep.quantidade, 0);
    const totalDisponivel = item.quantidadeInicial + totalReposicoes;
    const consumido = totalDisponivel - quantidadeFisica;
    
    if (consumido < 0) {
      console.warn(`[Admin-Eventos] ⚠️ Consumo negativo para ${item.produtoNome}. Total: ${totalDisponivel}, Físico: ${quantidadeFisica}`);
    }
    
    item.quantidadeFisicaRestante = quantidadeFisica;
    item.quantidadeConsumida = Math.max(0, consumido); // Não permitir consumo negativo
    item.totalDisponivel = totalDisponivel;
    
    console.log(`[Admin-Eventos] ✅ ${item.produtoNome}: Inicial=${item.quantidadeInicial}, Reposições=${totalReposicoes}, Total=${totalDisponivel}, Físico=${quantidadeFisica}, Consumido=${item.quantidadeConsumida}`);
  });
  
  if (!todosPreenchidos) {
    console.error('[Admin-Eventos] ❌ Itens com erro:', itensComErro);
    showToast(`Por favor, preencha a quantidade física restante de todos os itens. Itens com erro: ${itensComErro.join(', ')}`);
    return;
  }
  
  console.log('[Admin-Eventos] ✅ Todos os itens preenchidos, finalizando evento...');
  evento.finalizado = true;
  evento.dataFinalizacao = new Date().toISOString();
  
  try {
    await saveEventos();
    console.log('[Admin-Eventos] ✅ Evento finalizado e salvo com sucesso!');
    renderEventos();
    closeModalFinalizacao();
    showToast('Evento finalizado com sucesso!');
  } catch (error) {
    console.error('[Admin-Eventos] ❌ Erro ao salvar evento finalizado:', error);
    showToast('Erro ao salvar evento. Verifique o console.');
  }
}

async function abrirReposicao(evento) {
  eventoEditando = evento;
  document.getElementById('reposicaoProduto').value = '';
  document.getElementById('reposicaoQuantidade').value = '';
  document.getElementById('modalReposicao').classList.add('active');
}

async function adicionarReposicao() {
  if (!eventoEditando) return;

  const produtoId = document.getElementById('reposicaoProduto').value;
  const quantidade = parseInt(document.getElementById('reposicaoQuantidade').value);

  if (!produtoId || !quantidade || quantidade <= 0) {
    showToast('Por favor, selecione um produto e informe a quantidade');
    return;
  }

  // Buscar produto
  const estoque = await EstoqueAPI.get();
  const produtos = [...(estoque.geladeiras || []), ...(estoque.cameraFria || [])];
  const produto = produtos.find(p => p.id == produtoId);

  if (!produto) {
    showToast('Produto não encontrado');
    return;
  }

  // Encontrar evento no array
  const eventoIndex = eventos.findIndex(e => e.id === eventoEditando.id);
  if (eventoIndex === -1) {
    showToast('Evento não encontrado');
    return;
  }

  const evento = eventos[eventoIndex];

  // Encontrar item do evento
  const itemEvento = evento.itens.find(item => item.produtoId == produtoId);
  
  if (!itemEvento) {
    showToast('Este produto não está no evento');
    return;
  }

  // Adicionar reposição
  if (!itemEvento.reposicoes) {
    itemEvento.reposicoes = [];
  }

  itemEvento.reposicoes.push({
    quantidade,
    data: new Date().toISOString()
  });

  itemEvento.quantidadeAtual += quantidade;

  await saveEventos();
  renderEventos();
  closeModalReposicao();
  showToast('Reposição adicionada!');
}

function renderEventos(search = '') {
  const grid = document.getElementById('eventosGrid');
  const termo = search.toLowerCase();

  const eventosFiltrados = eventos.filter(evento =>
    evento.nome.toLowerCase().includes(termo) ||
    (evento.descricao && evento.descricao.toLowerCase().includes(termo))
  );

  if (eventosFiltrados.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 32px; grid-column: 1 / -1;">Nenhum evento encontrado</p>';
    return;
  }

  grid.innerHTML = eventosFiltrados.map(evento => {
    const dataFormatada = new Date(evento.data).toLocaleDateString('pt-BR');
    const totalItens = evento.itens.reduce((sum, item) => sum + item.quantidadeInicial, 0);
    const totalReposicoes = evento.itens.reduce((sum, item) => 
      sum + (item.reposicoes ? item.reposicoes.reduce((r, rep) => r + rep.quantidade, 0) : 0), 0
    );
    const totalConsumido = evento.finalizado 
      ? evento.itens.reduce((sum, item) => sum + (item.quantidadeConsumida || 0), 0)
      : totalItens + totalReposicoes;

    return `
      <div class="card-item">
        <div class="card-header">
          <div class="card-title">${evento.nome}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="card-status ${evento.finalizado ? 'status-finalizado' : 'status-ativo'}">
              ${evento.finalizado ? 'Finalizado' : 'Ativo'}
            </span>
            <div class="evento-menu-container" style="position: relative;">
              <button class="evento-menu-btn" onclick="toggleEventoMenu(${evento.id})" style="background: none; border: none; color: var(--muted); cursor: pointer; padding: 4px 8px; font-size: 18px; line-height: 1;">⋯</button>
              <div class="evento-menu-dropdown" id="eventoMenu_${evento.id}" style="display: none;">
                <button class="evento-menu-item danger" onclick="deletarEvento(${evento.id})">🗑️ Deletar</button>
              </div>
            </div>
          </div>
        </div>
        <div class="card-info">
          <div class="card-info-item"><strong>Data:</strong> ${dataFormatada}</div>
          ${evento.descricao ? `<div class="card-info-item"><strong>Descrição:</strong> ${evento.descricao}</div>` : ''}
          <div class="card-info-item"><strong>Bebidas Iniciais:</strong> ${totalItens}</div>
          <div class="card-info-item"><strong>Reposições:</strong> ${totalReposicoes}</div>
          <div class="card-info-item"><strong>Total ${evento.finalizado ? 'Consumido' : 'Disponível'}:</strong> ${totalConsumido}</div>
          ${evento.finalizado ? `<div class="card-info-item"><strong>Restante:</strong> ${evento.itens.reduce((sum, item) => sum + (item.quantidadeFisicaRestante || 0), 0)}</div>` : ''}
        </div>
        <div class="card-actions">
          ${!evento.finalizado ? `
            <button class="info" onclick="abrirReposicaoPorId(${evento.id})">Reposição</button>
            <button class="warning" onclick="finalizarEventoPorId(${evento.id})">Finalizar</button>
          ` : `
            <button class="accent" onclick="verRelatorioEvento(${evento.id})">📊 Relatório</button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function abrirReposicaoPorId(eventoId) {
  const evento = eventos.find(e => e.id === eventoId);
  if (evento) {
    abrirReposicao(evento);
  }
}

function finalizarEventoPorId(eventoId) {
  const evento = eventos.find(e => e.id === eventoId);
  if (evento) {
    finalizarEvento(evento);
  }
}

function toggleEventoMenu(eventoId) {
  // Fechar todos os outros menus
  document.querySelectorAll('.evento-menu-dropdown').forEach(menu => {
    if (menu.id !== `eventoMenu_${eventoId}`) {
      menu.style.display = 'none';
    }
  });
  
  // Toggle do menu atual
  const menu = document.getElementById(`eventoMenu_${eventoId}`);
  if (menu) {
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  }
}

async function deletarEvento(eventoId) {
  const evento = eventos.find(e => e.id === eventoId);
  if (!evento) {
    showToast('Evento não encontrado');
    return;
  }
  
  // Fechar o menu antes de mostrar o confirm
  const menu = document.getElementById(`eventoMenu_${eventoId}`);
  if (menu) {
    menu.style.display = 'none';
  }
  
  const confirmacao = confirm(`Tem certeza que deseja deletar o evento "${evento.nome}"?\n\nEsta ação não pode ser desfeita.`);
  if (!confirmacao) {
    return;
  }
  
  try {
    const index = eventos.findIndex(e => e.id === eventoId);
    if (index !== -1) {
      eventos.splice(index, 1);
      await saveEventos();
      renderEventos();
      showToast('Evento deletado com sucesso!');
    }
  } catch (error) {
    console.error('[Admin-Eventos] Erro ao deletar evento:', error);
    showToast('Erro ao deletar evento. Verifique o console.');
  }
}

// Fechar menus ao clicar fora
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.evento-menu-container')) {
      document.querySelectorAll('.evento-menu-dropdown').forEach(menu => {
        menu.style.display = 'none';
      });
    }
  });
}

function closeModalEvento() {
  document.getElementById('modalEvento').classList.remove('active');
  eventoEditando = null;
  eventoItens = [];
}

function closeModalReposicao() {
  document.getElementById('modalReposicao').classList.remove('active');
  eventoEditando = null;
}

function closeModalFinalizacao() {
  document.getElementById('modalFinalizacao').classList.remove('active');
  eventoEditando = null;
}

function closeModalRelatorio() {
  document.getElementById('modalRelatorio').classList.remove('active');
}

function verRelatorioEvento(eventoId) {
  const evento = eventos.find(e => e.id === eventoId);
  if (!evento) {
    showToast('Evento não encontrado');
    return;
  }
  
  gerarRelatorioEvento(evento);
}

function gerarRelatorioEvento(evento) {
  const modalRelatorio = document.getElementById('modalRelatorio');
  const modalRelatorioTitle = document.getElementById('modalRelatorioTitle');
  const relatorioConteudo = document.getElementById('relatorioConteudo');
  
  if (!modalRelatorio || !modalRelatorioTitle || !relatorioConteudo) {
    showToast('Erro ao abrir relatório');
    return;
  }
  
  modalRelatorioTitle.textContent = `Relatório - ${evento.nome}`;
  
  const dataFormatada = new Date(evento.data).toLocaleDateString('pt-BR');
  const dataFinalizacao = evento.dataFinalizacao ? new Date(evento.dataFinalizacao).toLocaleDateString('pt-BR') : 'Não finalizado';
  
  let html = `
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px 0;">${evento.nome}</h3>
      <p style="color: var(--muted); margin: 0;">Data: ${dataFormatada}</p>
      <p style="color: var(--muted); margin: 4px 0 0 0;">Finalizado em: ${dataFinalizacao}</p>
      ${evento.descricao ? `<p style="color: var(--muted); margin: 8px 0 0 0;">${evento.descricao}</p>` : ''}
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <thead>
        <tr style="background: #0a0f1a; border-bottom: 2px solid #1f2937;">
          <th style="padding: 12px; text-align: left; font-weight: 600;">Produto</th>
          <th style="padding: 12px; text-align: center; font-weight: 600;">Inicial</th>
          <th style="padding: 12px; text-align: center; font-weight: 600;">Reposições</th>
          <th style="padding: 12px; text-align: center; font-weight: 600;">Total</th>
          <th style="padding: 12px; text-align: center; font-weight: 600;">Restante</th>
          <th style="padding: 12px; text-align: center; font-weight: 600;">Consumido</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  let totalInicial = 0;
  let totalReposicoes = 0;
  let totalConsumido = 0;
  
  evento.itens.forEach(item => {
    const reposicoes = (item.reposicoes || []).reduce((sum, rep) => sum + rep.quantidade, 0);
    const totalDisponivel = item.quantidadeInicial + reposicoes;
    const restante = item.quantidadeFisicaRestante || 0;
    const consumido = item.quantidadeConsumida || (totalDisponivel - restante);
    
    totalInicial += item.quantidadeInicial;
    totalReposicoes += reposicoes;
    totalConsumido += consumido;
    
    html += `
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 12px;">${item.produtoNome}</td>
        <td style="padding: 12px; text-align: center;">${item.quantidadeInicial}</td>
        <td style="padding: 12px; text-align: center;">${reposicoes}</td>
        <td style="padding: 12px; text-align: center; font-weight: 600;">${totalDisponivel}</td>
        <td style="padding: 12px; text-align: center;">${restante}</td>
        <td style="padding: 12px; text-align: center; color: var(--accent); font-weight: 600;">${consumido}</td>
      </tr>
    `;
  });
  
  html += `
        <tr style="background: #0a0f1a; border-top: 2px solid #1f2937; font-weight: 700;">
          <td style="padding: 12px;">TOTAL</td>
          <td style="padding: 12px; text-align: center;">${totalInicial}</td>
          <td style="padding: 12px; text-align: center;">${totalReposicoes}</td>
          <td style="padding: 12px; text-align: center;">${totalInicial + totalReposicoes}</td>
          <td style="padding: 12px; text-align: center;">${evento.itens.reduce((sum, item) => sum + (item.quantidadeFisicaRestante || 0), 0)}</td>
          <td style="padding: 12px; text-align: center; color: var(--accent);">${totalConsumido}</td>
        </tr>
      </tbody>
    </table>
  `;
  
  relatorioConteudo.innerHTML = html;
  modalRelatorio.classList.add('active');
}

function gerarRelatorioGeral() {
  const modalRelatorio = document.getElementById('modalRelatorio');
  const modalRelatorioTitle = document.getElementById('modalRelatorioTitle');
  const relatorioConteudo = document.getElementById('relatorioConteudo');
  
  if (!modalRelatorio || !modalRelatorioTitle || !relatorioConteudo) {
    showToast('Erro ao abrir relatório');
    return;
  }
  
  modalRelatorioTitle.textContent = 'Relatório Geral de Eventos';
  
  const eventosFinalizados = eventos.filter(e => e.finalizado);
  
  if (eventosFinalizados.length === 0) {
    relatorioConteudo.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 32px;">Nenhum evento finalizado ainda.</p>';
    modalRelatorio.classList.add('active');
    return;
  }
  
  // Calcular estatísticas gerais
  let totalGeralInicial = 0;
  let totalGeralReposicoes = 0;
  let totalGeralConsumido = 0;
  let totalGeralRestante = 0;
  const produtosConsolidados = {}; // Para consolidar produtos de todos os eventos
  
  eventosFinalizados.forEach(evento => {
    evento.itens.forEach(item => {
      const reposicoes = (item.reposicoes || []).reduce((sum, rep) => sum + rep.quantidade, 0);
      const totalDisponivel = item.quantidadeInicial + reposicoes;
      const restante = item.quantidadeFisicaRestante || 0;
      const consumido = item.quantidadeConsumida || (totalDisponivel - restante);
      
      totalGeralInicial += item.quantidadeInicial;
      totalGeralReposicoes += reposicoes;
      totalGeralConsumido += consumido;
      totalGeralRestante += restante;
      
      // Consolidar produtos
      if (!produtosConsolidados[item.produtoNome]) {
        produtosConsolidados[item.produtoNome] = {
          inicial: 0,
          reposicoes: 0,
          consumido: 0,
          restante: 0
        };
      }
      produtosConsolidados[item.produtoNome].inicial += item.quantidadeInicial;
      produtosConsolidados[item.produtoNome].reposicoes += reposicoes;
      produtosConsolidados[item.produtoNome].consumido += consumido;
      produtosConsolidados[item.produtoNome].restante += restante;
    });
  });
  
  // HTML do relatório
  let html = `
    <div style="margin-bottom: 32px;">
      <h2 style="margin: 0 0 16px 0; color: var(--text);">📊 Resumo Geral</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px;">
        <div style="background: #0a0f1a; padding: 16px; border-radius: 12px; border: 1px solid #1f2937;">
          <div style="color: var(--muted); font-size: 12px; margin-bottom: 4px;">Total de Eventos</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--text);">${eventosFinalizados.length}</div>
        </div>
        <div style="background: #0a0f1a; padding: 16px; border-radius: 12px; border: 1px solid #1f2937;">
          <div style="color: var(--muted); font-size: 12px; margin-bottom: 4px;">Total Inicial</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--text);">${totalGeralInicial}</div>
        </div>
        <div style="background: #0a0f1a; padding: 16px; border-radius: 12px; border: 1px solid #1f2937;">
          <div style="color: var(--muted); font-size: 12px; margin-bottom: 4px;">Total Reposições</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--text);">${totalGeralReposicoes}</div>
        </div>
        <div style="background: #0a0f1a; padding: 16px; border-radius: 12px; border: 1px solid #1f2937;">
          <div style="color: var(--muted); font-size: 12px; margin-bottom: 4px;">Total Consumido</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--accent);">${totalGeralConsumido}</div>
        </div>
        <div style="background: #0a0f1a; padding: 16px; border-radius: 12px; border: 1px solid #1f2937;">
          <div style="color: var(--muted); font-size: 12px; margin-bottom: 4px;">Total Restante</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--text);">${totalGeralRestante}</div>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 32px;">
      <h3 style="margin: 0 0 16px 0; color: var(--text);">📦 Consolidação por Produto</h3>
      <table style="width: 100%; border-collapse: collapse; background: #0a0f1a; border-radius: 12px; overflow: hidden;">
        <thead>
          <tr style="background: #0d1423; border-bottom: 2px solid #1f2937;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text);">Produto</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: var(--text);">Inicial</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: var(--text);">Reposições</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: var(--text);">Total</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: var(--text);">Consumido</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: var(--text);">Restante</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  // Ordenar produtos por consumo (maior para menor)
  const produtosOrdenados = Object.entries(produtosConsolidados).sort((a, b) => b[1].consumido - a[1].consumido);
  
  produtosOrdenados.forEach(([produtoNome, dados]) => {
    const total = dados.inicial + dados.reposicoes;
    html += `
      <tr style="border-bottom: 1px solid #1f2937;">
        <td style="padding: 12px; color: var(--text);">${produtoNome}</td>
        <td style="padding: 12px; text-align: center; color: var(--muted);">${dados.inicial}</td>
        <td style="padding: 12px; text-align: center; color: var(--muted);">${dados.reposicoes}</td>
        <td style="padding: 12px; text-align: center; color: var(--text); font-weight: 600;">${total}</td>
        <td style="padding: 12px; text-align: center; color: var(--accent); font-weight: 600;">${dados.consumido}</td>
        <td style="padding: 12px; text-align: center; color: var(--muted);">${dados.restante}</td>
      </tr>
    `;
  });
  
  html += `
        <tr style="background: #0d1423; border-top: 2px solid #1f2937; font-weight: 700;">
          <td style="padding: 12px; color: var(--text);">TOTAL GERAL</td>
          <td style="padding: 12px; text-align: center; color: var(--text);">${totalGeralInicial}</td>
          <td style="padding: 12px; text-align: center; color: var(--text);">${totalGeralReposicoes}</td>
          <td style="padding: 12px; text-align: center; color: var(--text);">${totalGeralInicial + totalGeralReposicoes}</td>
          <td style="padding: 12px; text-align: center; color: var(--accent);">${totalGeralConsumido}</td>
          <td style="padding: 12px; text-align: center; color: var(--text);">${totalGeralRestante}</td>
        </tr>
      </tbody>
    </table>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px 0; color: var(--text);">📅 Detalhes por Evento</h3>
  `;
  
  // Detalhes de cada evento
  eventosFinalizados.forEach((evento, index) => {
    const dataFormatada = new Date(evento.data).toLocaleDateString('pt-BR');
    const dataFinalizacao = evento.dataFinalizacao ? new Date(evento.dataFinalizacao).toLocaleDateString('pt-BR') : 'N/A';
    const totalInicial = evento.itens.reduce((sum, item) => sum + item.quantidadeInicial, 0);
    const totalReposicoes = evento.itens.reduce((sum, item) => 
      sum + (item.reposicoes ? item.reposicoes.reduce((r, rep) => r + rep.quantidade, 0) : 0), 0
    );
    const totalConsumido = evento.itens.reduce((sum, item) => sum + (item.quantidadeConsumida || 0), 0);
    const totalRestante = evento.itens.reduce((sum, item) => sum + (item.quantidadeFisicaRestante || 0), 0);
    
    html += `
      <div style="background: #0a0f1a; padding: 20px; border-radius: 12px; border: 1px solid #1f2937; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
          <div>
            <h4 style="margin: 0 0 8px 0; color: var(--text); font-size: 18px;">${evento.nome}</h4>
            <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; color: var(--muted);">
              <span>📅 Data: ${dataFormatada}</span>
              <span>✅ Finalizado: ${dataFinalizacao}</span>
            </div>
            ${evento.descricao ? `<p style="margin: 8px 0 0 0; color: var(--muted); font-size: 13px;">${evento.descricao}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 24px; font-weight: 700; color: var(--accent);">${totalConsumido}</div>
            <div style="font-size: 12px; color: var(--muted);">itens consumidos</div>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <thead>
            <tr style="background: #0d1423; border-bottom: 1px solid #1f2937;">
              <th style="padding: 10px; text-align: left; font-weight: 600; font-size: 12px; color: var(--text);">Produto</th>
              <th style="padding: 10px; text-align: center; font-weight: 600; font-size: 12px; color: var(--text);">Inicial</th>
              <th style="padding: 10px; text-align: center; font-weight: 600; font-size: 12px; color: var(--text);">Reposições</th>
              <th style="padding: 10px; text-align: center; font-weight: 600; font-size: 12px; color: var(--text);">Total</th>
              <th style="padding: 10px; text-align: center; font-weight: 600; font-size: 12px; color: var(--text);">Consumido</th>
              <th style="padding: 10px; text-align: center; font-weight: 600; font-size: 12px; color: var(--text);">Restante</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    evento.itens.forEach(item => {
      const reposicoes = (item.reposicoes || []).reduce((sum, rep) => sum + rep.quantidade, 0);
      const totalDisponivel = item.quantidadeInicial + reposicoes;
      const restante = item.quantidadeFisicaRestante || 0;
      const consumido = item.quantidadeConsumida || (totalDisponivel - restante);
      
      html += `
        <tr style="border-bottom: 1px solid #1f2937;">
          <td style="padding: 10px; color: var(--text); font-size: 13px;">${item.produtoNome}</td>
          <td style="padding: 10px; text-align: center; color: var(--muted); font-size: 13px;">${item.quantidadeInicial}</td>
          <td style="padding: 10px; text-align: center; color: var(--muted); font-size: 13px;">${reposicoes}</td>
          <td style="padding: 10px; text-align: center; color: var(--text); font-size: 13px; font-weight: 600;">${totalDisponivel}</td>
          <td style="padding: 10px; text-align: center; color: var(--accent); font-size: 13px; font-weight: 600;">${consumido}</td>
          <td style="padding: 10px; text-align: center; color: var(--muted); font-size: 13px;">${restante}</td>
        </tr>
      `;
    });
    
    html += `
          <tr style="background: #0d1423; border-top: 1px solid #1f2937; font-weight: 700;">
            <td style="padding: 10px; color: var(--text);">TOTAL</td>
            <td style="padding: 10px; text-align: center; color: var(--text);">${totalInicial}</td>
            <td style="padding: 10px; text-align: center; color: var(--text);">${totalReposicoes}</td>
            <td style="padding: 10px; text-align: center; color: var(--text);">${totalInicial + totalReposicoes}</td>
            <td style="padding: 10px; text-align: center; color: var(--accent);">${totalConsumido}</td>
            <td style="padding: 10px; text-align: center; color: var(--text);">${totalRestante}</td>
          </tr>
        </tbody>
      </table>
      </div>
    `;
  });
  
  html += `</div>`;
  
  relatorioConteudo.innerHTML = html;
  modalRelatorio.classList.add('active');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Expor funções globalmente
window.novoEvento = novoEvento;
window.abrirReposicao = abrirReposicao;
window.abrirReposicaoPorId = abrirReposicaoPorId;
window.finalizarEvento = finalizarEvento;
window.finalizarEventoPorId = finalizarEventoPorId;
window.removerItemEvento = removerItemEvento;
window.verRelatorioEvento = verRelatorioEvento;
window.calcularConsumo = calcularConsumo;
window.confirmarFinalizacao = confirmarFinalizacao;
window.toggleEventoMenu = toggleEventoMenu;
window.deletarEvento = deletarEvento;

