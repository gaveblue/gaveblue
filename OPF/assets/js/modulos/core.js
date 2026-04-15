(function carregarCoreOpf(global) {
  const { STORAGE_KEY, THEME_KEY, state, GLOBAL_MODULES } = global.OPFState;

  function normalizarBusca(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function carregarStorage() {
    const bruto = localStorage.getItem(STORAGE_KEY);
    if (!bruto) {
      return;
    }

    try {
      const dados = JSON.parse(bruto);
      state.cadastros.emitentes = dados.emitentes || [];
      state.cadastros.fornecedores = dados.fornecedores || [];
      state.cadastros.naturezas = dados.naturezas || [];
      state.cadastros.tiposOperacao = dados.tiposOperacao || [];
      state.cadastros.centrosResultado = dados.centrosResultado || [];
      state.documentos = dados.documentos || [];
      state.controle.ultimoNumeroPorAno = dados.ultimoNumeroPorAno || {};
      state.configuracoes.logoDataUrl = dados.logoDataUrl || "";
      state.configuracoes.titleText = dados.titleText || "ORDEM DE PAGAMENTO FINANCEIRO";
      state.configuracoes.logoScale = Number(dados.logoScale || 100);
      state.configuracoes.logoWidth = Number(dados.logoWidth || 140);
      state.configuracoes.printScale = Number(dados.printScale || 100);
      state.configuracoes.logoOffsetX = Number(dados.logoOffsetX || 0);
      state.configuracoes.logoOffsetY = Number(dados.logoOffsetY || 0);
      state.configuracoes.titleScale = Number(dados.titleScale || 100);
      state.configuracoes.titleWidth = Number(dados.titleWidth || 360);
      state.configuracoes.titleOffsetX = Number(dados.titleOffsetX || 0);
      state.configuracoes.titleOffsetY = Number(dados.titleOffsetY || 0);
      state.configuracoes.codeScale = Number(dados.codeScale || 100);
      state.configuracoes.codeWidth = Number(dados.codeWidth || 185);
      state.configuracoes.codeOffsetX = Number(dados.codeOffsetX || 0);
      state.configuracoes.codeOffsetY = Number(dados.codeOffsetY || 0);
    } catch (error) {
      console.error("Falha ao carregar storage", error);
    }
  }

  function salvarStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...state.cadastros,
        ultimoNumeroPorAno: state.controle.ultimoNumeroPorAno,
        logoDataUrl: state.configuracoes.logoDataUrl,
        titleText: state.configuracoes.titleText,
        logoScale: state.configuracoes.logoScale,
        logoWidth: state.configuracoes.logoWidth,
        printScale: state.configuracoes.printScale,
        logoOffsetX: state.configuracoes.logoOffsetX,
        logoOffsetY: state.configuracoes.logoOffsetY,
        titleScale: state.configuracoes.titleScale,
        titleWidth: state.configuracoes.titleWidth,
        titleOffsetX: state.configuracoes.titleOffsetX,
        titleOffsetY: state.configuracoes.titleOffsetY,
        codeScale: state.configuracoes.codeScale,
        codeWidth: state.configuracoes.codeWidth,
        codeOffsetX: state.configuracoes.codeOffsetX,
        codeOffsetY: state.configuracoes.codeOffsetY,
        documentos: state.documentos
      }));
      return true;
    } catch (error) {
      console.error("Falha ao salvar storage", error);
      return false;
    }
  }

  function uid() {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }

  function filtrarModulosGlobais(termo) {
    const query = normalizarBusca(termo);
    if (!query) {
      return [];
    }

    const termos = query.split(/\s+/).filter(Boolean);

    return GLOBAL_MODULES
      .map((item) => {
        const campos = [
          item.name,
          item.description,
          ...(item.keywords || [])
        ].map((valor) => normalizarBusca(valor));

        const score = termos.reduce((total, termoAtual) => {
          let pontos = 0;
          if (campos.some((campo) => campo.includes(termoAtual))) {
            pontos += 2;
          }
          if (normalizarBusca(item.name).includes(termoAtual)) {
            pontos += 3;
          }
          return total + pontos;
        }, 0);

        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
      .map(({ item }) => item);
  }

  function renderizarBuscaGlobal(termo = "") {
    const dropdown = document.getElementById("globalSearchDropdown");
    if (!dropdown) {
      return;
    }

    const resultados = filtrarModulosGlobais(termo);
    if (!resultados.length) {
      dropdown.innerHTML = "";
      dropdown.hidden = true;
      return;
    }

    dropdown.innerHTML = resultados.map((item) => `
      <a class="opf-search-result" href="${item.url}" target="_self" rel="noopener noreferrer">
        <div>
          <strong>${item.name}</strong>
          <span>${item.description}</span>
        </div>
        <div class="opf-search-result-mark">↗</div>
      </a>
    `).join("");

    dropdown.hidden = false;
  }

  function fecharBuscaGlobal() {
    const dropdown = document.getElementById("globalSearchDropdown");
    if (dropdown) {
      dropdown.hidden = true;
    }
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function formatarDataBr(valor) {
    if (!valor) {
      return "-";
    }

    const [ano, mes, dia] = String(valor).split("-");
    if (!ano || !mes || !dia) {
      return valor;
    }

    return `${dia}/${mes}/${ano}`;
  }

  function formatarDocumento(valor) {
    return String(valor || "").trim() || "-";
  }

  function obterMesReferencia(valor) {
    const texto = String(valor || "").trim();
    if (!texto) {
      return "-";
    }

    if (/^\d{2}\/\d{4}$/.test(texto)) {
      return texto;
    }

    if (/^\d{4}-\d{2}$/.test(texto)) {
      const [ano, mes] = texto.split("-");
      return `${mes}/${ano}`;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      const [ano, mes] = texto.split("-");
      return `${mes}/${ano}`;
    }

    return texto;
  }

  function formatarDataHoraAtual() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    const horas = String(agora.getHours()).padStart(2, "0");
    const minutos = String(agora.getMinutes()).padStart(2, "0");

    return {
      ano,
      dataIso: `${ano}-${mes}-${dia}`,
      dataBr: `${dia}/${mes}/${ano}`,
      hora: `${horas}:${minutos}`
    };
  }

  function obterSequencialDocumento(numeroDocumento) {
    const match = String(numeroDocumento || "").match(/^OPF-(\d{4})-?(\d{4})$/);
    if (!match) {
      return null;
    }

    return {
      ano: Number(match[1]),
      sequencia: Number(match[2])
    };
  }

  function gerarNumeroDocumento() {
    const { ano } = formatarDataHoraAtual();
    const maiorSequencia = state.documentos.reduce((acc, item) => {
      const dados = obterSequencialDocumento(item.numeroDocumento);
      if (!dados || dados.ano !== ano) {
        return acc;
      }

      return Math.max(acc, dados.sequencia);
    }, 0);

    const ultimoControlado = Number(state.controle.ultimoNumeroPorAno[ano] || 0);
    const proximaSequencia = Math.max(maiorSequencia, ultimoControlado) + 1;

    return `OPF-${ano}${String(proximaSequencia).padStart(4, "0")}`;
  }

  function reservarNumeroDocumento(numeroDocumento) {
    const dados = obterSequencialDocumento(numeroDocumento);
    if (!dados) {
      return;
    }

    const atual = Number(state.controle.ultimoNumeroPorAno[dados.ano] || 0);
    if (dados.sequencia > atual) {
      state.controle.ultimoNumeroPorAno[dados.ano] = dados.sequencia;
    }
  }

  function preencherDatalist(datalistId, itens) {
    const datalist = document.getElementById(datalistId);
    if (!datalist) {
      return;
    }

    datalist.innerHTML = itens.map((item) => {
      const label = item.nome || item.descricao;
      return `<option value="${label}"></option>`;
    }).join("");
  }

  global.OPFCore = {
    STORAGE_KEY,
    THEME_KEY,
    state,
    GLOBAL_MODULES,
    normalizarBusca,
    carregarStorage,
    salvarStorage,
    uid,
    filtrarModulosGlobais,
    renderizarBuscaGlobal,
    fecharBuscaGlobal,
    formatarMoeda,
    formatarDataBr,
    formatarDocumento,
    obterMesReferencia,
    formatarDataHoraAtual,
    obterSequencialDocumento,
    gerarNumeroDocumento,
    reservarNumeroDocumento,
    preencherDatalist
  };
})(window);
