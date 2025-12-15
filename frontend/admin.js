// Script da página de administração de cartões
// Nota: Este código é para demonstração. Em produção, você precisaria de um backend
// para conectar com o banco de dados SQLite

let cartoes = [];
let cartaoEditando = null;
let saldosAnteriores = {}; // Armazenar saldos anteriores para detectar mudanças
let cartaoRecarregando = null;

// Variáveis para elementos do DOM (serão inicializadas quando o DOM estiver pronto)
let cartoesGrid;
let searchInput;
let btnNovoCartao;
let modalCartao;
let modalCartaoTitle;
let modalCartaoClose;
let modalCartaoCancel;
let modalCartaoSave;
let cartaoNumero;
let cartaoNome;
let cartaoDocumento;
let cartaoSaldoInicial;
let modalRecarga;
let modalRecargaClose;
let modalRecargaCancel;
let modalRecargaConfirm;
let recargaCartaoInfo;
let recargaSaldoAtual;
let recargaValor;
let recargaDescricao;
let toast;
let btnRelatorio;
let modalRelatorio;
let modalRelatorioClose;
let modalRelatorioFechar;
let relatorioContent;
let modalExtrato;
let modalExtratoTitle;
let modalExtratoClose;
let modalExtratoFechar;
let extratoContent;
let extratoDataInicio;
let extratoHoraInicio;
let extratoDataFim;
let extratoHoraFim;
let cartaoExtrato = null;
let transacoesExtrato = [];

// Funções auxiliares
function formatPrice(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function showToast(message, duracao = 3000) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, duracao);
}

// Gerar próximo número de cartão
function gerarProximoNumero() {
  if (cartoes.length === 0) {
    return '25001000';
  }
  
  // Buscar o maior número que começa com 2500
  const numeros = cartoes
    .map(c => c.numero)
    .filter(n => n.startsWith('2500'))
    .map(n => {
      const num = parseInt(n.substring(4));
      return isNaN(num) ? 0 : num;
    });
  
  const ultimoNumero = numeros.length > 0 ? Math.max(...numeros) : 999;
  const proximoNumero = ultimoNumero + 1;
  
  return `2500${proximoNumero.toString().padStart(4, '0')}`;
}

// Migrar dados do localStorage para o backend (se necessário)
async function migrarDadosLocalStorage() {
  try {
    console.log('[Migração] Verificando dados no backend...');
    // Verificar se há cartões no backend
    const cartoesBackend = await CartoesAPI.getAll();
    console.log('[Migração] Cartões no backend:', cartoesBackend.length);
    
    // Se não há cartões no backend, verificar localStorage
    if (cartoesBackend.length === 0) {
      console.log('[Migração] Nenhum cartão no backend, verificando localStorage...');
      const cartoesLocalStorage = JSON.parse(localStorage.getItem('cartoes') || '[]');
      console.log('[Migração] Cartões no localStorage:', cartoesLocalStorage.length);
      
      if (cartoesLocalStorage.length > 0) {
        console.log(`[Migração] Encontrados ${cartoesLocalStorage.length} cartões no localStorage. Migrando...`);
        await CartoesAPI.save(cartoesLocalStorage);
        console.log('[Migração] ✅ Cartões migrados com sucesso!');
        // Limpar localStorage após migração
        localStorage.removeItem('cartoes');
        return cartoesLocalStorage;
      } else {
        console.log('[Migração] Nenhum cartão no localStorage também');
      }
    }
    
    console.log('[Migração] Retornando cartões do backend:', cartoesBackend.length);
    return cartoesBackend;
  } catch (error) {
    console.error('[Migração] Erro ao migrar dados:', error);
    return [];
  }
}

// Carregar cartões diretamente do banco de dados
async function loadCartoes() {
  try {
    console.log('[Admin] Carregando cartões diretamente do banco de dados...');
    
    // Carregar diretamente do backend/banco de dados
    cartoes = await CartoesAPI.getAll();
    console.log('[Admin] Cartões carregados do banco:', cartoes.length);
    console.log('[Admin] Tipo:', typeof cartoes, 'É array?', Array.isArray(cartoes));
    
    // Garantir que é um array
    if (!Array.isArray(cartoes)) {
      console.error('[Admin] ❌ Resposta não é um array! Convertendo...');
      cartoes = [];
    }
    
    if (cartoes.length > 0) {
      console.log('[Admin] ✅ Cartões encontrados no banco:');
      cartoes.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.numero} - ${c.nome} (Saldo: ${c.saldo})`);
      });
    } else {
      console.warn('[Admin] ⚠️ Nenhum cartão encontrado no banco de dados!');
    }
    
    // Inicializar saldos anteriores
    cartoes.forEach(cartao => {
      saldosAnteriores[cartao.id] = cartao.saldo;
    });
    
    console.log('[Admin] Chamando renderCartoes() com', cartoes.length, 'cartões');
    console.log('[Admin] cartoesGrid disponível?', !!cartoesGrid);
    
    // Garantir que cartoesGrid está disponível antes de renderizar
    if (!cartoesGrid) {
      console.warn('[Admin] cartoesGrid não disponível, tentando buscar novamente...');
      cartoesGrid = document.getElementById('cartoesGrid');
    }
    
    if (cartoesGrid) {
      renderCartoes();
    } else {
      console.error('[Admin] Não foi possível encontrar cartoesGrid. Tentando novamente em 100ms...');
      setTimeout(() => {
        cartoesGrid = document.getElementById('cartoesGrid');
        if (cartoesGrid) {
          renderCartoes();
        } else {
          console.error('[Admin] cartoesGrid ainda não encontrado após timeout');
        }
      }, 100);
    }
  } catch (error) {
    console.error('Erro ao carregar cartões:', error);
    cartoes = [];
    renderCartoes();
  }
}

// Verificar mudanças nos saldos
async function verificarMudancasSaldos() {
  try {
    const cartoesAtuais = await CartoesAPI.getAll();
    if (!Array.isArray(cartoesAtuais)) return;
    
    // Comparar cada cartão
    cartoesAtuais.forEach(cartao => {
      const saldoAnterior = saldosAnteriores[cartao.id];
      const saldoAtual = parseFloat(cartao.saldo) || 0;
      
      // Se o saldo mudou e não foi uma mudança que nós mesmos fizemos
      if (saldoAnterior !== undefined && Math.abs(saldoAnterior - saldoAtual) > 0.01) {
        const diferenca = saldoAtual - saldoAnterior;
        const tipo = diferenca > 0 ? 'recarga' : 'compra';
        const valor = Math.abs(diferenca);
        
        // Só mostrar notificação se a diferença for significativa (maior que 0.01)
        if (valor > 0.01) {
          if (tipo === 'compra') {
            showToast(`💳 Cartão ${cartao.numero}: Compra de ${formatPrice(valor)}. Saldo: ${formatPrice(saldoAnterior)} → ${formatPrice(saldoAtual)}`, 5000);
          } else {
            showToast(`💰 Cartão ${cartao.numero}: Recarga de ${formatPrice(valor)}. Saldo: ${formatPrice(saldoAnterior)} → ${formatPrice(saldoAtual)}`, 5000);
          }
        }
        
        // Atualizar saldo anterior
        saldosAnteriores[cartao.id] = saldoAtual;
      } else if (saldoAnterior === undefined) {
        // Novo cartão - apenas registrar o saldo
        saldosAnteriores[cartao.id] = saldoAtual;
      }
    });
    
    // Atualizar lista se houver mudanças estruturais
    const cartoesAtuaisStr = JSON.stringify(cartoesAtuais);
    const cartoesAtuaisStrOrdenado = JSON.stringify(cartoesAtuais.sort((a, b) => a.id - b.id));
    const cartoesStr = JSON.stringify(cartoes.sort((a, b) => a.id - b.id));
    
    if (cartoesAtuaisStrOrdenado !== cartoesStr) {
      cartoes = cartoesAtuais;
      renderCartoes(searchInput.value);
    }
    
    // Verificar se algum cartão foi removido
    Object.keys(saldosAnteriores).forEach(id => {
      if (!cartoesAtuais.find(c => String(c.id) === String(id))) {
        delete saldosAnteriores[id];
      }
    });
  } catch (error) {
    console.error('Erro ao verificar mudanças nos saldos:', error);
  }
}

async function saveCartoes() {
  try {
    await CartoesAPI.save(cartoes);
  } catch (error) {
    console.error('Erro ao salvar cartões:', error);
    showToast('Erro ao salvar cartões. Tente novamente.');
  }
}

function renderCartoes(filtro = '') {
  console.log('[Admin] renderCartoes chamado com filtro:', filtro);
  console.log('[Admin] cartoesGrid:', cartoesGrid);
  console.log('[Admin] cartoes:', cartoes);
  
  if (!cartoesGrid) {
    console.error('[Admin] cartoesGrid não está disponível - tentando buscar novamente...');
    cartoesGrid = document.getElementById('cartoesGrid');
    if (!cartoesGrid) {
      console.error('[Admin] cartoesGrid ainda não encontrado após busca');
      return;
    }
    console.log('[Admin] cartoesGrid encontrado após busca');
  }
  
  cartoesGrid.innerHTML = '';
  
  let cartoesFiltrados = Array.isArray(cartoes) ? cartoes : [];
  console.log('[Admin] Total de cartões para filtrar:', cartoesFiltrados.length);
  
  if (filtro) {
    const busca = filtro.toLowerCase();
    cartoesFiltrados = cartoesFiltrados.filter(c => 
      (c && c.numero && c.numero.toLowerCase().includes(busca)) ||
      (c && c.nome && c.nome.toLowerCase().includes(busca)) ||
      (c && c.documento && c.documento.toLowerCase().includes(busca))
    );
    console.log('[Admin] Cartões após filtro:', cartoesFiltrados.length);
  }
  
  if (cartoesFiltrados.length === 0) {
    console.log('[Admin] Nenhum cartão encontrado - exibindo mensagem vazia');
    cartoesGrid.innerHTML = '<div class="empty-state">Nenhum cartão encontrado</div>';
    return;
  }
  
  console.log('[Admin] Renderizando', cartoesFiltrados.length, 'cartões');
  console.log('[Admin] Primeiro cartão para renderizar:', cartoesFiltrados[0]);
  
  // Limpar o grid primeiro
  cartoesGrid.innerHTML = '';
  console.log('[Admin] Grid limpo');
  
  cartoesFiltrados.forEach((cartao, index) => {
    console.log(`[Admin] Criando card ${index + 1} para cartão:`, cartao.numero, cartao.nome);
    
    const card = document.createElement('div');
    card.className = 'card-item';
    
    // Verificar se cartao.ativo é 1 ou true
    const isAtivo = cartao.ativo === 1 || cartao.ativo === true;
    
    try {
      card.innerHTML = `
        <div class="card-header">
          <div class="card-number">${cartao.numero || 'N/A'}</div>
          <span class="card-status ${isAtivo ? 'status-ativo' : 'status-inativo'}">
            ${isAtivo ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        <div class="card-info">
          <div class="card-info-item"><strong>Nome:</strong> ${cartao.nome || 'N/A'}</div>
          ${cartao.documento ? `<div class="card-info-item"><strong>Documento:</strong> ${cartao.documento}</div>` : ''}
          <div class="card-info-item"><strong>Saldo:</strong> ${formatPrice(cartao.saldo || 0)}</div>
        </div>
        <div class="card-actions">
          <button class="btn-small accent" onclick="recarregarCartao(${cartao.id})">Recarregar</button>
          <button class="btn-small" onclick="window.verExtrato && window.verExtrato(${cartao.id})">Ver Extrato</button>
          <button class="btn-small" onclick="editarCartao(${cartao.id})">Editar</button>
          <button class="btn-small" onclick="toggleCartao(${cartao.id})" style="color: ${isAtivo ? 'var(--danger)' : 'var(--accent)'}">
            ${isAtivo ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      `;
      
      console.log(`[Admin] Card criado para ${cartao.numero}, adicionando ao grid...`);
      cartoesGrid.appendChild(card);
      console.log(`[Admin] Card ${cartao.numero} adicionado. Total de filhos:`, cartoesGrid.children.length);
    } catch (error) {
      console.error(`[Admin] Erro ao criar card para ${cartao.numero}:`, error);
    }
  });
  
  // Verificar quantos elementos foram realmente adicionados
  const elementosAdicionados = cartoesGrid.querySelectorAll('.card-item');
  console.log('[Admin] ✅ Renderização concluída!');
  console.log('[Admin] Total de elementos .card-item no DOM:', elementosAdicionados.length);
  console.log('[Admin] Total de children no grid:', cartoesGrid.children.length);
  
  // Verificar se o grid está visível
  const styles = window.getComputedStyle(cartoesGrid);
  console.log('[Admin] Grid CSS - display:', styles.display);
  console.log('[Admin] Grid CSS - visibility:', styles.visibility);
  console.log('[Admin] Grid CSS - opacity:', styles.opacity);
  console.log('[Admin] Grid CSS - height:', styles.height);
  console.log('[Admin] Grid está visível?', cartoesGrid.offsetParent !== null);
}

// Abrir modal de novo cartão
function novoCartao() {
  if (!modalCartao || !modalCartaoTitle || !cartaoNumero || !cartaoNome || !cartaoDocumento || !cartaoSaldoInicial) {
    console.error('[Admin] Elementos do DOM não estão disponíveis');
    return;
  }
  
  cartaoEditando = null;
  modalCartaoTitle.textContent = 'Novo Cartão';
  cartaoNumero.value = gerarProximoNumero();
  cartaoNome.value = '';
  cartaoDocumento.value = '';
  cartaoSaldoInicial.value = '';
  cartaoNumero.disabled = true;
  cartaoNumero.style.background = '#0a0f1a';
  cartaoNumero.style.cursor = 'not-allowed';
  modalCartao.classList.add('open');
}

// Editar cartão
function editarCartao(id) {
  if (!modalCartao || !modalCartaoTitle || !cartaoNumero || !cartaoNome || !cartaoDocumento || !cartaoSaldoInicial) {
    console.error('[Admin] Elementos do DOM não estão disponíveis');
    return;
  }
  
  const cartao = cartoes.find(c => c.id === id);
  if (!cartao) return;
  
  cartaoEditando = cartao;
  modalCartaoTitle.textContent = 'Editar Cartão';
  cartaoNumero.value = cartao.numero;
  cartaoNome.value = cartao.nome;
  cartaoDocumento.value = cartao.documento || '';
  cartaoSaldoInicial.value = '';
  cartaoNumero.disabled = true;
  cartaoNumero.style.background = '#0a0f1a';
  cartaoNumero.style.cursor = 'not-allowed';
  modalCartao.classList.add('open');
}

// Salvar cartão
async function salvarCartao() {
  const numero = cartaoNumero.value.trim();
  const nome = cartaoNome.value.trim();
  const documento = cartaoDocumento.value.trim();
  const saldoInicial = parseFloat(cartaoSaldoInicial.value) || 0;
  
  if (!nome) {
    showToast('Preencha o nome do cartão');
    return;
  }
  
  if (cartaoEditando) {
    // Editar
    cartaoEditando.nome = nome;
    cartaoEditando.documento = documento || null;
    showToast('Cartão atualizado com sucesso');
  } else {
    // Novo - número já foi gerado automaticamente
    if (cartoes.find(c => c.numero === numero)) {
      showToast('Cartão com este número já existe');
      return;
    }
    
    const novoCartao = {
      id: Date.now(),
      numero,
      nome,
      documento: documento || null,
      saldo: saldoInicial,
      ativo: 1,
      created_at: new Date().toISOString()
    };
    
    cartoes.push(novoCartao);
    showToast(`Cartão ${numero} criado com sucesso`);
  }
  
  await saveCartoes();
  if (searchInput) {
    renderCartoes(searchInput.value);
  } else {
    renderCartoes();
  }
  fecharModalCartao();
}

// Recarregar cartão
function recarregarCartao(id) {
  if (!modalRecarga || !recargaCartaoInfo || !recargaSaldoAtual || !recargaValor || !recargaDescricao) {
    console.error('[Admin] Elementos do DOM não estão disponíveis');
    return;
  }
  
  const cartao = cartoes.find(c => c.id === id);
  if (!cartao) return;
  
  cartaoRecarregando = cartao;
  recargaCartaoInfo.textContent = `${cartao.numero} - ${cartao.nome}`;
  recargaSaldoAtual.textContent = formatPrice(cartao.saldo);
  recargaValor.value = '';
  recargaDescricao.value = '';
  modalRecarga.classList.add('open');
}

async function confirmarRecarga() {
  const valor = parseFloat(recargaValor.value);
  const descricao = recargaDescricao.value.trim();
  
  if (!valor || valor <= 0) {
    showToast('Informe um valor válido');
    return;
  }
  
  if (!cartaoRecarregando) return;
  
  recargaEmAndamento = true;
  
  try {
    const saldoAnterior = cartaoRecarregando.saldo;
    const resultado = await CartoesAPI.recarregar(cartaoRecarregando.id, valor, descricao);
    
    if (resultado.success && resultado.cartao) {
      cartaoRecarregando.saldo = resultado.cartao.saldo;
      saldosAnteriores[cartaoRecarregando.id] = cartaoRecarregando.saldo;
      
      // Atualizar lista de cartões
      await loadCartoes();
      
      const saldoAtual = cartaoRecarregando.saldo;
      showToast(`💰 Recarga de ${formatPrice(valor)} realizada! Saldo: ${formatPrice(saldoAnterior)} → ${formatPrice(saldoAtual)}`, 4000);
      fecharModalRecarga();
    } else {
      showToast('Erro ao realizar recarga');
    }
  } catch (error) {
    console.error('Erro ao recarregar cartão:', error);
    showToast('Erro ao realizar recarga. Tente novamente.');
  } finally {
    // Liberar flag após um tempo
    setTimeout(() => {
      recargaEmAndamento = false;
    }, 2000);
  }
}

// Toggle ativo/inativo
async function toggleCartao(id) {
  const cartao = cartoes.find(c => c.id === id);
  if (!cartao) return;
  
  cartao.ativo = cartao.ativo ? 0 : 1;
  await saveCartoes();
  if (searchInput) {
    renderCartoes(searchInput.value);
  } else {
    renderCartoes();
  }
  showToast(`Cartão ${cartao.ativo ? 'ativado' : 'desativado'}`);
}

// Fechar modais
function fecharModalCartao() {
  if (modalCartao) {
    modalCartao.classList.remove('open');
  }
  cartaoEditando = null;
}

function fecharModalRecarga() {
  if (modalRecarga) {
    modalRecarga.classList.remove('open');
  }
  cartaoRecarregando = null;
}

// Gerar relatório
async function gerarRelatorio() {
  const cartoesAtuais = await CartoesAPI.getAll();
  
  // Calcular estatísticas
  const totalCartoes = cartoesAtuais.length;
  const cartoesAtivos = cartoesAtuais.filter(c => c.ativo).length;
  const cartoesInativos = totalCartoes - cartoesAtivos;
  
  // Calcular saldos
  const saldoTotal = cartoesAtuais.reduce((sum, c) => sum + (parseFloat(c.saldo) || 0), 0);
  const saldoMedio = totalCartoes > 0 ? saldoTotal / totalCartoes : 0;
  
  // Cartões com maior e menor saldo
  const cartoesOrdenados = [...cartoesAtuais].sort((a, b) => (parseFloat(b.saldo) || 0) - (parseFloat(a.saldo) || 0));
  
  // Gerar HTML do relatório
  let html = `
    <div class="relatorio-section">
      <h3>📊 Resumo Geral</h3>
      <div class="relatorio-grid">
        <div class="relatorio-item">
          <div class="relatorio-item-label">Total de Cartões</div>
          <div class="relatorio-item-value">${totalCartoes}</div>
        </div>
        <div class="relatorio-item">
          <div class="relatorio-item-label">Cartões Ativos</div>
          <div class="relatorio-item-value positive">${cartoesAtivos}</div>
        </div>
        <div class="relatorio-item">
          <div class="relatorio-item-label">Cartões Inativos</div>
          <div class="relatorio-item-value negative">${cartoesInativos}</div>
        </div>
        <div class="relatorio-item">
          <div class="relatorio-item-label">Saldo Total</div>
          <div class="relatorio-item-value positive">${formatPrice(saldoTotal)}</div>
        </div>
        <div class="relatorio-item">
          <div class="relatorio-item-label">Saldo Médio</div>
          <div class="relatorio-item-value">${formatPrice(saldoMedio)}</div>
        </div>
      </div>
    </div>

    <div class="relatorio-section">
      <h3>💳 Top 10 Cartões com Maior Saldo</h3>
      <table class="relatorio-table">
        <thead>
          <tr>
            <th>Número</th>
            <th>Nome</th>
            <th>Saldo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${cartoesOrdenados.slice(0, 10).map(c => `
            <tr>
              <td>${c.numero}</td>
              <td>${c.nome}</td>
              <td class="relatorio-item-value ${parseFloat(c.saldo) > 0 ? 'positive' : ''}">${formatPrice(parseFloat(c.saldo) || 0)}</td>
              <td>${c.ativo ? '<span style="color: var(--accent);">Ativo</span>' : '<span style="color: var(--danger);">Inativo</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="relatorio-section">
      <h3>📋 Lista Completa de Cartões</h3>
      <table class="relatorio-table">
        <thead>
          <tr>
            <th>Número</th>
            <th>Nome</th>
            <th>Documento</th>
            <th>Saldo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${cartoesAtuais.length > 0 ? cartoesAtuais.map(c => `
            <tr>
              <td>${c.numero}</td>
              <td>${c.nome}</td>
              <td>${c.documento || '-'}</td>
              <td class="relatorio-item-value ${parseFloat(c.saldo) > 0 ? 'positive' : ''}">${formatPrice(parseFloat(c.saldo) || 0)}</td>
              <td>${c.ativo ? '<span style="color: var(--accent);">Ativo</span>' : '<span style="color: var(--danger);">Inativo</span>'}</td>
            </tr>
          `).join('') : '<tr><td colspan="5" style="text-align: center; color: var(--muted);">Nenhum cartão cadastrado</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="relatorio-section">
      <p style="margin: 0; font-size: 12px; color: var(--muted);">
        Relatório gerado em ${new Date().toLocaleString('pt-BR')}
      </p>
    </div>
  `;
  
  if (!relatorioContent || !modalRelatorio) {
    console.error('[Admin] Elementos do DOM não estão disponíveis');
    return;
  }
  
  relatorioContent.innerHTML = html;
  modalRelatorio.classList.add('open');
}

function fecharModalRelatorio() {
  if (modalRelatorio) {
    modalRelatorio.classList.remove('open');
  }
}

// Ver extrato do cartão
async function verExtrato(id) {
  console.log('[Admin] verExtrato chamado com id:', id, 'tipo:', typeof id);
  console.log('[Admin] cartoes disponíveis:', cartoes.length);
  
  // Converter id para número se necessário
  const idNum = typeof id === 'string' ? parseInt(id, 10) : id;
  console.log('[Admin] ID convertido:', idNum);
  
  const cartao = cartoes.find(c => {
    const cartaoId = typeof c.id === 'string' ? parseInt(c.id, 10) : c.id;
    return cartaoId === idNum;
  });
  
  if (!cartao) {
    console.error('[Admin] Cartão não encontrado com id:', idNum);
    console.log('[Admin] IDs disponíveis:', cartoes.map(c => c.id));
    showToast('Cartão não encontrado');
    return;
  }
  
  console.log('[Admin] Cartão encontrado:', cartao.numero, cartao.nome);
  cartaoExtrato = cartao;
  
  // Inicializar elementos se necessário
  if (!modalExtrato) {
    console.log('[Admin] Inicializando elementos do modal de extrato...');
    modalExtrato = document.getElementById('modalExtrato');
    modalExtratoTitle = document.getElementById('modalExtratoTitle');
    modalExtratoClose = document.getElementById('modalExtratoClose');
    modalExtratoFechar = document.getElementById('modalExtratoFechar');
    extratoContent = document.getElementById('extratoContent');
    extratoDataInicio = document.getElementById('extratoDataInicio');
    extratoHoraInicio = document.getElementById('extratoHoraInicio');
    extratoDataFim = document.getElementById('extratoDataFim');
    extratoHoraFim = document.getElementById('extratoHoraFim');
    
    console.log('[Admin] Elementos encontrados:', {
      modalExtrato: !!modalExtrato,
      modalExtratoTitle: !!modalExtratoTitle,
      extratoContent: !!extratoContent
    });
  }
  
  if (!modalExtrato || !modalExtratoTitle || !extratoContent) {
    console.error('[Admin] Elementos do modal de extrato não encontrados');
    showToast('Erro ao abrir extrato. Recarregue a página.');
    return;
  }
  
  modalExtratoTitle.textContent = `Extrato - Cartão ${cartao.numero} - ${cartao.nome}`;
  
  // Limpar filtros
  if (extratoDataInicio) extratoDataInicio.value = '';
  if (extratoHoraInicio) extratoHoraInicio.value = '';
  if (extratoDataFim) extratoDataFim.value = '';
  if (extratoHoraFim) extratoHoraFim.value = '';
  
  // Mostrar loading
  extratoContent.innerHTML = '<div class="empty-state">Carregando transações...</div>';
  
  // Abrir modal primeiro
  modalExtrato.classList.add('open');
  
  // Carregar transações
  try {
    console.log('[Admin] Buscando transações para cartão id:', cartao.id);
    transacoesExtrato = await CartoesAPI.getTransacoes(cartao.id);
    console.log('[Admin] Transações encontradas:', transacoesExtrato.length);
    renderExtrato();
  } catch (error) {
    console.error('[Admin] Erro ao carregar transações:', error);
    extratoContent.innerHTML = '<div class="empty-state">Erro ao carregar extrato. Tente novamente.</div>';
  }
}

// Expor verExtrato imediatamente após definição
window.verExtrato = verExtrato;

// Filtrar extrato
function filtrarExtrato() {
  renderExtrato();
}

// Limpar filtros
function limparFiltrosExtrato() {
  if (extratoDataInicio) extratoDataInicio.value = '';
  if (extratoHoraInicio) extratoHoraInicio.value = '';
  if (extratoDataFim) extratoDataFim.value = '';
  if (extratoHoraFim) extratoHoraFim.value = '';
  renderExtrato();
}

// Renderizar extrato
function renderExtrato() {
  if (!extratoContent || !cartaoExtrato) return;
  
  let transacoesFiltradas = [...transacoesExtrato];
  
  // Aplicar filtros de data/hora
  const dataInicio = extratoDataInicio?.value;
  const horaInicio = extratoHoraInicio?.value;
  const dataFim = extratoDataFim?.value;
  const horaFim = extratoHoraFim?.value;
  
  if (dataInicio || horaInicio || dataFim || horaFim) {
    transacoesFiltradas = transacoesFiltradas.filter(trans => {
      const transDate = new Date(trans.data);
      const transDateStr = transDate.toISOString().split('T')[0];
      const transHoraStr = transDate.toTimeString().split(' ')[0].substring(0, 5);
      
      let passaFiltro = true;
      
      if (dataInicio) {
        if (transDateStr < dataInicio) passaFiltro = false;
        if (transDateStr === dataInicio && horaInicio && transHoraStr < horaInicio) passaFiltro = false;
      }
      
      if (dataFim) {
        if (transDateStr > dataFim) passaFiltro = false;
        if (transDateStr === dataFim && horaFim && transHoraStr > horaFim) passaFiltro = false;
      }
      
      return passaFiltro;
    });
  }
  
  // Ordenar por data (mais recente primeiro)
  transacoesFiltradas.sort((a, b) => new Date(b.data) - new Date(a.data));
  
  if (transacoesFiltradas.length === 0) {
    extratoContent.innerHTML = '<div class="empty-state">Nenhuma transação encontrada no período selecionado</div>';
    return;
  }
  
  // Calcular totais
  const totalCompras = transacoesFiltradas
    .filter(t => t.tipo === 'compra')
    .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);
  const totalRecargas = transacoesFiltradas
    .filter(t => t.tipo === 'recarga')
    .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);
  
  let html = `
    <div style="margin-bottom: 20px; padding: 16px; background: #0a0f1a; border-radius: 12px; border: 1px solid #1f2937;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
        <div>
          <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">Total de Transações</div>
          <div style="font-size: 18px; font-weight: 700;">${transacoesFiltradas.length}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">Total Compras</div>
          <div style="font-size: 18px; font-weight: 700; color: var(--danger);">${formatPrice(totalCompras)}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">Total Recargas</div>
          <div style="font-size: 18px; font-weight: 700; color: var(--accent);">${formatPrice(totalRecargas)}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">Saldo Atual</div>
          <div style="font-size: 18px; font-weight: 700; color: var(--accent);">${formatPrice(cartaoExtrato.saldo)}</div>
        </div>
      </div>
    </div>
    
    <table class="relatorio-table" style="width: 100%;">
      <thead>
        <tr>
          <th>Data/Hora</th>
          <th>Tipo</th>
          <th>Valor</th>
          <th>Saldo Anterior</th>
          <th>Saldo Atual</th>
          <th>Descrição</th>
        </tr>
      </thead>
      <tbody>
        ${transacoesFiltradas.map(trans => {
          const data = new Date(trans.data);
          const dataFormatada = data.toLocaleDateString('pt-BR');
          const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const tipo = trans.tipo === 'compra' ? 'Compra' : 'Recarga';
          const corTipo = trans.tipo === 'compra' ? 'var(--danger)' : 'var(--accent)';
          
          return `
            <tr>
              <td>${dataFormatada} ${horaFormatada}</td>
              <td style="color: ${corTipo}; font-weight: 600;">${tipo}</td>
              <td style="color: ${corTipo}; font-weight: 600;">${formatPrice(trans.valor)}</td>
              <td>${formatPrice(trans.saldoAnterior)}</td>
              <td style="font-weight: 600;">${formatPrice(trans.saldoAtual)}</td>
              <td>${trans.descricao || '-'}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
  
  extratoContent.innerHTML = html;
}

function fecharModalExtrato() {
  if (modalExtrato) {
    modalExtrato.classList.remove('open');
  }
  cartaoExtrato = null;
  transacoesExtrato = [];
}

// Inicializar elementos do DOM e eventos
function inicializarElementos() {
  cartoesGrid = document.getElementById('cartoesGrid');
  searchInput = document.getElementById('searchInput');
  btnNovoCartao = document.getElementById('btnNovoCartao');
  modalCartao = document.getElementById('modalCartao');
  modalCartaoTitle = document.getElementById('modalCartaoTitle');
  modalCartaoClose = document.getElementById('modalCartaoClose');
  modalCartaoCancel = document.getElementById('modalCartaoCancel');
  modalCartaoSave = document.getElementById('modalCartaoSave');
  cartaoNumero = document.getElementById('cartaoNumero');
  cartaoNome = document.getElementById('cartaoNome');
  cartaoDocumento = document.getElementById('cartaoDocumento');
  cartaoSaldoInicial = document.getElementById('cartaoSaldoInicial');
  modalRecarga = document.getElementById('modalRecarga');
  modalRecargaClose = document.getElementById('modalRecargaClose');
  modalRecargaCancel = document.getElementById('modalRecargaCancel');
  modalRecargaConfirm = document.getElementById('modalRecargaConfirm');
  recargaCartaoInfo = document.getElementById('recargaCartaoInfo');
  recargaSaldoAtual = document.getElementById('recargaSaldoAtual');
  recargaValor = document.getElementById('recargaValor');
  recargaDescricao = document.getElementById('recargaDescricao');
  toast = document.getElementById('toast');
  btnRelatorio = document.getElementById('btnRelatorio');
  modalRelatorio = document.getElementById('modalRelatorio');
  modalRelatorioClose = document.getElementById('modalRelatorioClose');
  modalRelatorioFechar = document.getElementById('modalRelatorioFechar');
  relatorioContent = document.getElementById('relatorioContent');
  modalExtrato = document.getElementById('modalExtrato');
  modalExtratoTitle = document.getElementById('modalExtratoTitle');
  modalExtratoClose = document.getElementById('modalExtratoClose');
  modalExtratoFechar = document.getElementById('modalExtratoFechar');
  extratoContent = document.getElementById('extratoContent');
  extratoDataInicio = document.getElementById('extratoDataInicio');
  extratoHoraInicio = document.getElementById('extratoHoraInicio');
  extratoDataFim = document.getElementById('extratoDataFim');
  extratoHoraFim = document.getElementById('extratoHoraFim');
  
  // Verificar se todos os elementos foram encontrados
  const elementos = {
    cartoesGrid,
    searchInput,
    btnNovoCartao,
    modalCartao,
    modalCartaoTitle,
    modalCartaoClose,
    modalCartaoCancel,
    modalCartaoSave,
    cartaoNumero,
    cartaoNome,
    cartaoDocumento,
    cartaoSaldoInicial,
    modalRecarga,
    modalRecargaClose,
    modalRecargaCancel,
    modalRecargaConfirm,
    recargaCartaoInfo,
    recargaSaldoAtual,
    recargaValor,
    recargaDescricao,
    toast,
    btnRelatorio,
    modalRelatorio,
    modalRelatorioClose,
    modalRelatorioFechar,
    relatorioContent
  };
  
  const elementosFaltando = Object.entries(elementos)
    .filter(([nome, elemento]) => !elemento)
    .map(([nome]) => nome);
  
  if (elementosFaltando.length > 0) {
    console.error('[Admin] Elementos do DOM não encontrados:', elementosFaltando);
  } else {
    console.log('[Admin] ✅ Todos os elementos do DOM foram encontrados');
  }
}

function configurarEventListeners() {
  // Event listeners dos botões
  if (btnNovoCartao) {
    btnNovoCartao.addEventListener('click', novoCartao);
  }
  if (btnRelatorio) {
    btnRelatorio.addEventListener('click', gerarRelatorio);
  }
  if (modalCartaoClose) {
    modalCartaoClose.addEventListener('click', fecharModalCartao);
  }
  if (modalCartaoCancel) {
    modalCartaoCancel.addEventListener('click', fecharModalCartao);
  }
  if (modalCartaoSave) {
    modalCartaoSave.addEventListener('click', salvarCartao);
  }
  if (modalRecargaClose) {
    modalRecargaClose.addEventListener('click', fecharModalRecarga);
  }
  if (modalRecargaCancel) {
    modalRecargaCancel.addEventListener('click', fecharModalRecarga);
  }
  if (modalRecargaConfirm) {
    modalRecargaConfirm.addEventListener('click', confirmarRecarga);
  }
  if (modalRelatorioClose) {
    modalRelatorioClose.addEventListener('click', fecharModalRelatorio);
  }
  if (modalRelatorioFechar) {
    modalRelatorioFechar.addEventListener('click', fecharModalRelatorio);
  }
  if (modalExtratoClose) {
    modalExtratoClose.addEventListener('click', fecharModalExtrato);
  }
  if (modalExtratoFechar) {
    modalExtratoFechar.addEventListener('click', fecharModalExtrato);
  }
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderCartoes(e.target.value);
    });
  }
  
  // Fechar modal ao clicar fora
  if (modalCartao) {
    modalCartao.addEventListener('click', (e) => {
      if (e.target === modalCartao) fecharModalCartao();
    });
  }
  if (modalRecarga) {
    modalRecarga.addEventListener('click', (e) => {
      if (e.target === modalRecarga) fecharModalRecarga();
    });
  }
  if (modalRelatorio) {
    modalRelatorio.addEventListener('click', (e) => {
      if (e.target === modalRelatorio) fecharModalRelatorio();
    });
  }
  if (modalExtrato) {
    modalExtrato.addEventListener('click', (e) => {
      if (e.target === modalExtrato) fecharModalExtrato();
    });
  }
  
  console.log('[Admin] ✅ Event listeners configurados');
}

// Expor funções globalmente para uso nos botões
window.recarregarCartao = recarregarCartao;
window.editarCartao = editarCartao;
window.toggleCartao = toggleCartao;
// window.verExtrato já foi exposto acima
window.filtrarExtrato = filtrarExtrato;
window.limparFiltrosExtrato = limparFiltrosExtrato;

// Flag para evitar notificações duplicadas durante recarga
let recargaEmAndamento = false;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Admin] Inicializando página de administração...');
  
  // Inicializar elementos do DOM
  inicializarElementos();
  
  // Configurar event listeners
  configurarEventListeners();
  
  // Carregar dados
  try {
    console.log('[Admin] Iniciando loadCartoes()...');
    await loadCartoes();
    console.log('[Admin] ✅ Página inicializada com sucesso');
    console.log('[Admin] Estado final - cartoes.length:', cartoes.length);
    console.log('[Admin] Estado final - cartoesGrid:', cartoesGrid);
    
    // Verificar se os cartões foram renderizados
    if (cartoesGrid) {
      const cartoesRenderizados = cartoesGrid.querySelectorAll('.card-item');
      console.log('[Admin] Cartões renderizados no DOM:', cartoesRenderizados.length);
      if (cartoesRenderizados.length === 0 && cartoes.length > 0) {
        console.warn('[Admin] ⚠️ Cartões carregados mas não renderizados! Tentando renderizar novamente...');
        renderCartoes();
      }
    }
    
    // Monitorar mudanças nos cartões (para detectar compras de outras abas/páginas)
    let intervaloVerificacao = setInterval(async () => {
      if (!recargaEmAndamento) {
        await verificarMudancasSaldos();
      }
    }, 1500); // Verificar a cada 1.5 segundos
    
    // Também verificar quando a janela recebe foco
    window.addEventListener('focus', async () => {
      await verificarMudancasSaldos();
    });
  } catch (err) {
    console.error('[Admin] ❌ Erro ao carregar cartões:', err);
    console.error('[Admin] Stack trace:', err.stack);
  }
});

