// Helper para comunicação com a API do backend
const API_BASE_URL = window.location.origin;

// Função auxiliar para fazer requisições
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      // Para 404, não logar como erro - é comportamento esperado
      if (response.status === 404) {
        const error = await response.json().catch(() => ({ message: 'Não encontrado' }));
        throw new Error(error.message || 'Não encontrado');
      }
      
      const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
      console.error(`Erro na API ${endpoint}:`, error);
      throw new Error(error.message || `Erro ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Não logar erros 404 - são esperados
    if (!error.message || !error.message.includes('Não encontrado') && !error.message.includes('404')) {
      console.error(`Erro na API ${endpoint}:`, error);
    }
    throw error;
  }
}

// ========== API MENU ==========
const MenuAPI = {
  async get() {
    try {
      console.log('[API] MenuAPI.get() - Buscando menu do banco de dados...');
      const resultado = await apiRequest('/menu');
      console.log('[API] ✅ MenuAPI.get() retornou:', Array.isArray(resultado) ? `${resultado.length} categorias` : 'não é array');
      if (Array.isArray(resultado) && resultado.length > 0) {
        console.log('[API] Primeiras categorias:', resultado.slice(0, 3).map(c => `${c.titulo} (${(c.itens || []).length} itens)`));
      }
      return Array.isArray(resultado) ? resultado : [];
    } catch (error) {
      console.error('[API] ❌ Erro ao buscar menu:', error);
      return [];
    }
  },
  
  async save(menu) {
    try {
      console.log('[API] MenuAPI.save() - Salvando menu no banco...');
      const resultado = await apiRequest('/menu', {
        method: 'POST',
        body: JSON.stringify(menu)
      });
      console.log('[API] ✅ Menu salvo com sucesso');
      return resultado;
    } catch (error) {
      console.error('[API] ❌ Erro ao salvar menu:', error);
      throw error;
    }
  }
};

// ========== API CARTÕES ==========
const CartoesAPI = {
  async getAll() {
    try {
      console.log('[API] CartoesAPI.getAll() - Buscando cartões diretamente do banco de dados...');
      const resultado = await apiRequest('/cartoes');
      console.log('[API] ✅ Resposta recebida:', Array.isArray(resultado) ? `${resultado.length} cartões` : 'não é array');
      if (Array.isArray(resultado) && resultado.length > 0) {
        console.log('[API] Primeiros cartões do banco:', resultado.slice(0, 3).map(c => `${c.numero} - ${c.nome}`));
      }
      // Garantir que sempre retorna um array
      return Array.isArray(resultado) ? resultado : [];
    } catch (error) {
      console.error('[API] ❌ Erro ao buscar cartões do banco:', error);
      return [];
    }
  },
  
  async save(cartoes) {
    return await apiRequest('/cartoes', {
      method: 'POST',
      body: JSON.stringify(cartoes)
    });
  },
  
  async buscarPorNumero(numero) {
    try {
      const url = `${API_BASE_URL}/api/cartoes/${encodeURIComponent(numero)}`;
      console.log('[API] Fazendo requisição para:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Cartão não encontrado - não é um erro, apenas retorna null
          console.log('[API] 404 - Cartão não encontrado:', numero);
          return null;
        }
        const errorText = await response.text();
        console.error('[API] Erro na resposta:', response.status, errorText);
        throw new Error(`Erro ${response.status}`);
      }
      
      const cartao = await response.json();
      console.log('[API] ✅ Cartão retornado:', cartao);
      return cartao;
    } catch (error) {
      // Logar apenas erros que não são 404
      if (error.message && !error.message.includes('404') && !error.message.includes('Não encontrado')) {
        console.error('[API] Erro ao buscar cartão:', error);
      }
      return null;
    }
  },
  
  async debitar(id, valor, itens = []) {
    return await apiRequest(`/cartoes/${id}/debitar`, {
      method: 'POST',
      body: JSON.stringify({ valor, itens })
    });
  },
  
  async recarregar(id, valor, descricao = '') {
    return await apiRequest(`/cartoes/${id}/recarregar`, {
      method: 'POST',
      body: JSON.stringify({ valor, descricao })
    });
  },
  
  async getTransacoes(id) {
    try {
      const resultado = await apiRequest(`/cartoes/${id}/transacoes`);
      return Array.isArray(resultado) ? resultado : [];
    } catch (error) {
      console.error('[API] Erro ao buscar transações:', error);
      return [];
    }
  }
};

// ========== API ESTOQUE ==========
const EstoqueAPI = {
  async get() {
    return await apiRequest('/estoque');
  },
  
  async save(estoque) {
    return await apiRequest('/estoque', {
      method: 'POST',
      body: JSON.stringify(estoque)
    });
  },
  
  async getHistorico() {
    return await apiRequest('/estoque/historico');
  },
  
  async saveHistorico(historico) {
    return await apiRequest('/estoque/historico', {
      method: 'POST',
      body: JSON.stringify(historico)
    });
  },
  
  async verificarDisponivel(produtoNome) {
    try {
      const result = await apiRequest(`/estoque/verificar/${encodeURIComponent(produtoNome)}`);
      return result.disponivel && result.quantidade > 0;
    } catch (error) {
      return false;
    }
  },
  
  async reduzir(produtoNome, quantidade) {
    return await apiRequest('/estoque/reduzir', {
      method: 'POST',
      body: JSON.stringify({ produtoNome, quantidade })
    });
  }
};

// ========== API EVENTOS ==========
const EventosAPI = {
  async getAll() {
    try {
      console.log('[API] EventosAPI.getAll() - Buscando eventos do banco de dados...');
      const resultado = await apiRequest('/eventos');
      console.log('[API] ✅ EventosAPI.getAll() retornou:', Array.isArray(resultado) ? `${resultado.length} eventos` : 'não é array');
      return Array.isArray(resultado) ? resultado : [];
    } catch (error) {
      console.error('[API] ❌ Erro ao buscar eventos:', error);
      return [];
    }
  },
  
  async save(eventos) {
    try {
      console.log('[API] EventosAPI.save() - Salvando eventos no banco...');
      const resultado = await apiRequest('/eventos', {
        method: 'POST',
        body: JSON.stringify(eventos)
      });
      console.log('[API] ✅ Eventos salvos com sucesso');
      return resultado;
    } catch (error) {
      console.error('[API] ❌ Erro ao salvar eventos:', error);
      throw error;
    }
  }
};

// Exportar para uso global
window.MenuAPI = MenuAPI;
window.CartoesAPI = CartoesAPI;
window.EstoqueAPI = EstoqueAPI;
window.EventosAPI = EventosAPI;

