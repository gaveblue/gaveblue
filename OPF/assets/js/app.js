const STORAGE_KEY = "opf-financeiro-data-v2";
const THEME_KEY = "opf-financeiro-theme";

// =========================
// Estado da aplicacao
// =========================

const state = {
  cadastros: {
    emitentes: [],
    fornecedores: [],
    naturezas: [],
    tiposOperacao: [],
    centrosResultado: []
  },
  documentos: [],
  controle: {
    ultimoNumeroPorAno: {}
  },
  configuracoes: {
    logoDataUrl: "",
    titleText: "ORDEM DE PAGAMENTO FINANCEIRO",
    logoScale: 100,
    logoWidth: 140,
    printScale: 100,
    logoOffsetX: 0,
    logoOffsetY: 0,
    titleScale: 100,
    titleWidth: 360,
    titleOffsetX: 0,
    titleOffsetY: 0,
    codeScale: 100,
    codeWidth: 185,
    codeOffsetX: 0,
    codeOffsetY: 0
  },
  configuracoesDraft: {
    logoDataUrl: "",
    titleText: "ORDEM DE PAGAMENTO FINANCEIRO",
    logoScale: 100,
    logoWidth: 140,
    printScale: 100,
    logoOffsetX: 0,
    logoOffsetY: 0,
    titleScale: 100,
    titleWidth: 360,
    titleOffsetX: 0,
    titleOffsetY: 0,
    codeScale: 100,
    codeWidth: 185,
    codeOffsetX: 0,
    codeOffsetY: 0
  },
  documentoAtual: null,
  configTarget: "logo",
  configModalOpen: false,
  configView: "personalizacao",
  documentoSort: {
    key: "numeroDocumento",
    direction: "desc"
  },
  workspace: {
    open: false,
    mode: "form",
    step: 0
  },
  cadastroView: "emitentes",
  cadastroSelecionadoId: null,
  lancamentoSelecionadoId: null,
  documentoSelecionados: [],
  documentoSelectionAnchorId: null,
  documentoSearchOpen: false,
  documentoFilterOpen: false,
  documentoFilterType: "vencimento",
  lancamentoEmEdicaoId: null,
  numeroDocumentoAtual: "",
  confirmAction: null
};

// =========================
// Catalogo de modulos
// =========================

const GLOBAL_MODULES = [
    {
      name: "WeRecibos",
      description: "Gerador de recibos",
      url: "https://gaveblue.com/recibos",
      keywords: [
        "recibo", "recibos", "gerador", "gerar", "comprovante", "comprovantes", "pagamento", "pagamentos",
        "recebimento", "recebimentos", "recibo simples", "recibo de pagamento", "comprovante de pagamento",
        "comprovante de recebimento", "declaração de recebimento", "autonomo", "autônomo", "cliente", "clientes",
        "prestacao", "prestação", "servico", "serviço", "assinatura", "valor recebido"
      ]
    },
    {
      name: "WeFrotas",
      description: "Gestão de frotas",
      url: "https://gaveblue.com/wefrotas",
      keywords: [
        "frota", "frotas", "veiculo", "veiculos", "veículo", "veículos", "carro", "carros", "moto", "motos",
        "motorista", "motoristas", "condutor", "condutores", "rota", "rotas", "combustivel", "combustível",
        "abastecimento", "quilometragem", "km", "manutencao", "manutenção", "oficina", "rastreamento",
        "entrega", "logistica", "logística", "viagem", "viagens"
      ]
    },
    {
      name: "WeTime",
      description: "Relógio online e painel de horário",
      url: "https://gaveblue.com/wetime",
      keywords: [
        "horario", "horarios", "horário", "horários", "relogio", "relógio", "ponto", "bater ponto", "escala",
        "turno", "turnos", "jornada", "presenca", "presença", "entrada", "saida", "saída", "expediente",
        "folha", "funcionario", "funcionário", "funcionarios", "funcionários", "controle de ponto", "timesheet"
      ]
    },
    {
      name: "WeConsultas",
      description: "Consultas empresariais",
      url: "https://gaveblue.com/weconsultas",
      keywords: [
        "consulta", "consultas", "empresa", "empresas", "cnpj", "cpf", "dados", "cadastro", "pesquisa",
        "consultar", "receita federal", "situacao cadastral", "situação cadastral", "inscricao estadual",
        "inscrição estadual", "informacoes", "informações", "fornecedor", "cliente", "documento", "documentos",
        "validacao", "validação", "dados empresariais", "dados cadastrais"
      ]
    },
    {
      name: "WeDevs",
      description: "Ferramentas e utilidades dev",
      url: "https://gaveblue.com/wedevs",
      keywords: [
        "dev", "desenvolvedor", "desenvolvimento", "codigo", "código", "ferramenta", "ferramentas", "utilidades",
        "api", "apis", "json", "debug", "html", "css", "js", "javascript", "typescript", "python", "phyton",
        "php", "java", "csharp", "c#", "sql", "regex", "frontend", "backend", "fullstack", "programacao",
        "programação", "script", "scripts", "conversor", "formatador", "minificar", "beautify", "encode",
        "decode", "token", "jwt", "base64", "yaml", "xml", "csv", "codigo fonte", "gerador de codigo"
      ]
    },
    {
      name: "WeTasks",
      description: "Tarefas e organização",
      url: "https://gaveblue.com/wetasks",
      keywords: [
        "tarefas", "tarefa", "organizacao", "organizar", "organização", "agenda", "planejamento", "lista", "kanban",
        "projeto", "projetos", "afazer", "a fazer", "produtividade", "checklist", "cronograma", "prioridade",
        "prioridades", "time", "equipe", "fluxo", "gestao", "gestão", "board"
      ]
    },
    {
      name: "WeDocs",
      description: "Gerador de documentos",
      url: "https://gaveblue.com/wedocs",
      keywords: [
        "documento", "documentos", "gerador", "gerar", "arquivo", "arquivos", "pdf", "modelo", "modelos",
        "contrato", "contratos", "declaracao", "declaração", "proposta", "propostas", "relatorio", "relatório",
        "laudo", "oficio", "ofício", "termo", "assinatura", "texto", "formulario", "formulário", "gerar pdf"
      ]
    },
    {
      name: "PDV",
      description: "Ponto de venda e financeiro",
      url: "https://gaveblue.com/PDV",
      keywords: [
        "pdv", "venda", "vendas", "caixa", "financeiro", "loja", "comanda", "produto", "produtos", "estoque",
        "cupom", "cupom fiscal", "pedido", "pedidos", "frente de caixa", "atendimento", "cliente", "clientes",
        "recebimento", "maquininha", "cartao", "cartão", "dinheiro", "pix", "fechamento de caixa"
      ]
    },
    {
      name: "OPF",
      description: "Ordem de Pagamento Financeiro",
      url: "https://gaveblue.com/opf",
      keywords: [
        "opf", "pagamento", "ordem", "financeiro", "documento", "lancamento", "lancamentos", "lançamento",
        "lançamentos", "fornecedor", "fornecedores", "emitente", "emitentes", "contabil", "contábil", "fiscal",
        "nota fiscal", "itens", "resumo financeiro", "ordem de pagamento", "contas a pagar", "despesa", "despesas"
      ]
    }
  ];

// =========================
// Storage, busca global e utilitarios base
// =========================

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
    normalizarSelecaoDocumentos();
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



// =========================
// Documentos, filtros e selecao
// =========================

function obterDocumentosFiltrados() {
  const termo = String(document.getElementById("documentoSearchInput")?.value || "").trim().toLowerCase();
  const dataInicial = String(document.getElementById("documentoDateStart")?.value || "").trim();
  const dataFinal = String(document.getElementById("documentoDateEnd")?.value || "").trim();
  const mesReferencia = normalizarMesReferencia(document.getElementById("documentoMonthReference")?.value || "");
  const tipoFiltro = String(document.getElementById("documentoFilterType")?.value || state.documentoFilterType || "vencimento");
  return state.documentos.filter((doc) => {
    const correspondeBusca = !termo || [doc.numeroDocumento, doc.emitente?.nome, doc.fornecedor?.nome]
      .some((valor) => String(valor || "").toLowerCase().includes(termo));

    if (!correspondeBusca) {
      return false;
    }

    if (tipoFiltro === "mesReferencia") {
      if (mesReferencia && normalizarMesReferencia(doc.mesReferencia || "") !== mesReferencia) {
        return false;
      }
    } else {
      const campoData = tipoFiltro === "emissao" ? doc.dataDocumento : doc.vencimento;
      const dataDocumento = converterDataBrParaIso(campoData);
      if (dataInicial && (!dataDocumento || dataDocumento < dataInicial)) {
        return false;
      }

      if (dataFinal && (!dataDocumento || dataDocumento > dataFinal)) {
        return false;
      }
    }

        return true;
      }).sort(ordenarDocumentos);
}

function normalizarMesReferencia(valor) {
  const texto = String(valor || "").trim();
  if (!texto) {
    return "";
  }

  const iso = texto.match(/^(\d{4})-(\d{2})$/);
  if (iso) {
    return `${iso[1]}-${iso[2]}`;
  }

  const br = texto.match(/^(\d{2})\/(\d{4})$/);
  if (br) {
    return `${br[2]}-${br[1]}`;
  }

  return texto.toLowerCase();
}

function obterDocumentosSelecionados() {
  return state.documentos.filter((item) => state.documentoSelecionados.includes(item.id));
}

function normalizarSelecaoDocumentos() {
  const idsValidos = new Set(state.documentos.map((item) => item.id));
  state.documentoSelecionados = state.documentoSelecionados.filter((id) => idsValidos.has(id));

  if (!state.documentoSelecionados.length) {
    state.lancamentoSelecionadoId = null;
    state.documentoSelectionAnchorId = null;
    return;
  }

  state.lancamentoSelecionadoId = state.documentoSelecionados[state.documentoSelecionados.length - 1];
  if (!state.documentoSelectionAnchorId || !idsValidos.has(state.documentoSelectionAnchorId)) {
    state.documentoSelectionAnchorId = state.lancamentoSelecionadoId;
  }
}

function sincronizarFiltrosDocumento() {
  const searchPopover = document.getElementById("documentoSearchPopover");
  const filterPopover = document.getElementById("documentoFilterPopover");
  const dateFields = document.getElementById("documentoDateFilterFields");
  const monthField = document.getElementById("documentoMonthFilterField");
  const filterType = document.getElementById("documentoFilterType");

  if (searchPopover) {
    searchPopover.hidden = !state.documentoSearchOpen;
  }
  if (filterPopover) {
    filterPopover.hidden = !state.documentoFilterOpen;
  }
  if (filterType) {
    filterType.value = state.documentoFilterType || "vencimento";
  }
  if (dateFields) {
    dateFields.hidden = state.documentoFilterType === "mesReferencia";
  }
  if (monthField) {
    monthField.hidden = state.documentoFilterType !== "mesReferencia";
  }
}

function selecionarDocumentos(ids, anchorId = null) {
  state.documentoSelecionados = Array.from(new Set((ids || []).filter(Boolean)));
  normalizarSelecaoDocumentos();
  if (anchorId) {
    state.documentoSelectionAnchorId = anchorId;
  }
}

function selecionarDocumentoLinha(id, { ctrlKey = false, metaKey = false, shiftKey = false } = {}) {
  const documentos = obterDocumentosFiltrados();
  const idsVisiveis = documentos.map((item) => item.id);
  const multiKey = ctrlKey || metaKey;

  if (shiftKey && state.documentoSelectionAnchorId && idsVisiveis.includes(state.documentoSelectionAnchorId)) {
    const inicio = idsVisiveis.indexOf(state.documentoSelectionAnchorId);
    const fim = idsVisiveis.indexOf(id);
    if (inicio >= 0 && fim >= 0) {
      const faixa = idsVisiveis.slice(Math.min(inicio, fim), Math.max(inicio, fim) + 1);
      const base = multiKey ? state.documentoSelecionados.filter((itemId) => !idsVisiveis.includes(itemId)) : [];
      selecionarDocumentos([...base, ...faixa], state.documentoSelectionAnchorId);
      return;
    }
  }

  if (multiKey) {
    const existe = state.documentoSelecionados.includes(id);
    const atualizados = existe
      ? state.documentoSelecionados.filter((itemId) => itemId !== id)
      : [...state.documentoSelecionados, id];
    selecionarDocumentos(atualizados, id);
    return;
  }

  selecionarDocumentos([id], id);
}

function renderHome() {
  const documentos = obterDocumentosFiltrados();

    atualizarCabecalhoOrdenacaoDocumentos();
    normalizarSelecaoDocumentos();

    const container = document.getElementById("documentosList");
    if (!container) {
    return;
  }
    if (!documentos.length) {
      container.innerHTML = `<tr><td colspan="4"><div class="saved-empty">Nenhum documento encontrado.</div></td></tr>`;
      return;
    }
  
    container.innerHTML = documentos.map((doc) => `
      <tr class="${state.documentoSelecionados.includes(doc.id) ? "is-selected documento-row-selected" : ""}" data-select-document="${doc.id}">
        <td><strong>${doc.numeroDocumento}</strong></td>
        <td class="documento-cell-fornecedor" title="${doc.fornecedor?.nome || "-"}">${doc.fornecedor?.nome || "-"}</td>
        <td class="documento-cell-vencimento">${doc.vencimento || "-"}</td>
        <td class="num">${formatarMoeda(doc.total)}</td>
      </tr>
    `).join("");
  }

function obterDocumentoSelecionado() {
  return state.documentos.find((item) => item.id === state.lancamentoSelecionadoId) || null;
}

function obterDocumentoUnicoSelecionado() {
  const selecionados = obterDocumentosSelecionados();
  return selecionados.length === 1 ? selecionados[0] : null;
}

function abrirDocumentoSelecionado() {
  const selecionados = obterDocumentosSelecionados();
  if (selecionados.length > 1) {
    mostrarToast("Selecione apenas uma OPF para visualizar.", "info");
    return;
  }

  const documento = selecionados[0] || obterDocumentoSelecionado();
  if (!documento) {
    mostrarToast("Selecione uma OPF na tabela para continuar.", "info");
    return;
  }

  state.documentoAtual = documento;
  popularPreview(documento);
  atualizarEstadoPreview({ loading: false, success: true, documento: true });
  alternarAba("documento");
  abrirWorkspaceDocumento({
    mode: "preview",
    title: "Visualizacao da OPF",
    kicker: "Documento"
  });
  focarPreviewDocumento();
}

function editarDocumentoSelecionado() {
  const selecionados = obterDocumentosSelecionados();
  if (selecionados.length > 1) {
    mostrarToast("Selecione apenas uma OPF para editar.", "info");
    return;
  }

  const documento = selecionados[0] || obterDocumentoSelecionado();
  if (!documento) {
    mostrarToast("Selecione uma OPF na tabela para editar.", "info");
    return;
  }

  atualizarEstadoPreview({ loading: false, success: false, documento: false });
  alternarAba("documento");
  preencherFormularioLancamento(documento);
  abrirWorkspaceDocumento({
    mode: "form",
    step: 0,
    title: "Editar documento",
    kicker: "Edicao"
  });
}

function obterValorOrdenacaoDocumento(doc, key) {
  if (key === "numeroDocumento") {
    const dados = obterSequencialDocumento(doc.numeroDocumento);
    return dados ? Number(`${dados.ano}${String(dados.sequencia).padStart(4, "0")}`) : 0;
  }

  if (key === "emitente") {
    return String(doc.emitente?.nome || "").toLowerCase();
  }

  if (key === "fornecedor") {
    return String(doc.fornecedor?.nome || "").toLowerCase();
  }

  if (key === "vencimento") {
    const valor = String(doc.vencimento || "").trim();
    const match = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return match ? Number(`${match[3]}${match[2]}${match[1]}`) : 0;
  }

  if (key === "total") {
    return Number(doc.total || 0);
  }

  return String(doc[key] || "").toLowerCase();
}

function converterDataBrParaIso(valor) {
  const texto = String(valor || "").trim();
  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return "";
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function ordenarDocumentos(a, b) {
  const { key, direction } = state.documentoSort;
  const valorA = obterValorOrdenacaoDocumento(a, key);
  const valorB = obterValorOrdenacaoDocumento(b, key);

  let comparacao = 0;
  if (typeof valorA === "number" && typeof valorB === "number") {
    comparacao = valorA - valorB;
  } else {
    comparacao = String(valorA).localeCompare(String(valorB), "pt-BR");
  }

  return direction === "asc" ? comparacao : comparacao * -1;
}

function atualizarCabecalhoOrdenacaoDocumentos() {
  document.querySelectorAll("[data-document-sort]").forEach((botao) => {
    const ativo = botao.dataset.documentSort === state.documentoSort.key;
    const direcao = ativo ? state.documentoSort.direction : "";
    botao.classList.toggle("is-active", ativo);
    botao.dataset.sortDirection = direcao;

    const indicador = botao.querySelector(".documento-sort-indicator");
    if (indicador) {
      indicador.textContent = ativo ? (direcao === "asc" ? "↑" : "↓") : "↕";
    }
  });
}

// =========================
// Relatorios e cadastros
// =========================

function renderRelatorios() {
  const totalDocumentos = document.getElementById("relatoriosTotalDocumentos");
  const valorTotal = document.getElementById("relatoriosValorTotal");
  const body = document.getElementById("relatoriosTableBody");
  if (!body || !totalDocumentos || !valorTotal) {
    return;
  }

  totalDocumentos.textContent = String(state.documentos.length);
  valorTotal.textContent = formatarMoeda(state.documentos.reduce((acc, item) => acc + Number(item.total || 0), 0));

  if (!state.documentos.length) {
    body.innerHTML = `<tr><td colspan="6"><div class="saved-empty">Nenhuma OPF emitida ainda.</div></td></tr>`;
    return;
  }

  body.innerHTML = state.documentos.map((item) => `
    <tr>
      <td>${item.numeroDocumento}</td>
      <td>${item.emitente?.nome || "-"}</td>
      <td>${item.fornecedor?.nome || "-"}</td>
      <td>${item.mesReferencia || "-"}</td>
      <td>${item.vencimento || "-"}</td>
      <td class="num">${formatarMoeda(item.total)}</td>
    </tr>
  `).join("");
}



function obterItensCadastroView() {
  if (state.cadastroView === "classificacoes") {
    return [
      ...state.cadastros.naturezas.map((item) => ({ ...item, grupo: "naturezas", categoria: "Natureza" })),
      ...state.cadastros.tiposOperacao.map((item) => ({ ...item, grupo: "tiposOperacao", categoria: "Tipo de operacao" })),
      ...state.cadastros.centrosResultado.map((item) => ({ ...item, grupo: "centrosResultado", categoria: "Centro de resultado" }))
    ];
  }

  return state.cadastros[state.cadastroView];
}

function obterCadastroSelecionado() {
  return obterItensCadastroView().find((item) => item.id === state.cadastroSelecionadoId) || null;
}

function encontrarCadastroPorTexto(tipo, texto) {
  const valor = String(texto || "").trim().toLowerCase();
  if (!valor) {
    return null;
  }

  return state.cadastros[tipo].find((item) => {
    const base = item.nome || item.descricao || "";
    return base.trim().toLowerCase() === valor;
  }) || null;
}

function obterEnderecoFormatado(item) {
  if (!item) {
    return "-";
  }

  const partes = [item.logradouro, item.bairro, item.cidade, item.uf].filter(Boolean);
  return partes.length ? partes.join(", ") : "-";
}

function obterHeadCadastro() {
  if (state.cadastroView === "emitentes") {
    return ["Nome / Razao Social", "Documento", "Tipo", "Cidade", "UF"];
  }

  if (state.cadastroView === "fornecedores") {
    return ["Nome / Razao Social", "Documento", "Categoria", "Cidade", "UF"];
  }

  return ["Descricao", "Grupo"];
}

function obterVarianteCategoria(valor) {
  return String(valor || "").toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function renderTabelaCadastros() {
  const head = document.getElementById("cadastroTableHead");
  const body = document.getElementById("cadastroTableBody");
  const searchInput = document.getElementById("cadastroSearch");
  const termo = String(searchInput?.value || "").trim().toLowerCase();
  const colunas = obterHeadCadastro();
  const itens = obterItensCadastroView().filter((item) => JSON.stringify(item).toLowerCase().includes(termo));

  head.innerHTML = colunas.map((titulo) => `<th>${titulo}</th>`).join("");

  if (!itens.length) {
    body.innerHTML = `<tr><td colspan="${colunas.length}"><div class="saved-empty">Nenhum cadastro encontrado.</div></td></tr>`;
    return;
  }

  body.innerHTML = itens.map((item) => {
    const selected = item.id === state.cadastroSelecionadoId ? "is-selected" : "";

    if (state.cadastroView === "classificacoes") {
      return `
        <tr class="${selected}" data-select-cadastro="${item.id}">
          <td>${item.descricao || "-"}</td>
          <td>${item.categoria || "-"}</td>
        </tr>
      `;
    }

    const categoria = item.categoria || "Emitente";
    const documento = item.cnpj || item.documento || "-";

    return `
      <tr class="${selected}" data-select-cadastro="${item.id}">
        <td>${item.nome || "-"}</td>
        <td>${documento}</td>
        <td><span class="tag-pill" data-variant="${obterVarianteCategoria(categoria)}">${categoria}</span></td>
        <td>${item.cidade || "-"}</td>
        <td>${item.uf || "-"}</td>
      </tr>
    `;
  }).join("");
}

function renderDetalheCadastro() {
  const titulo = document.getElementById("cadastroDetailTitulo");
  const nome = document.getElementById("cadastroDetailNome");
  const grid = document.getElementById("cadastroDetailGrid");
  const item = obterCadastroSelecionado();

  titulo.textContent = "Visualizacao do cadastro";
  nome.textContent = item?.nome || item?.descricao || "-";

  if (!item) {
    grid.innerHTML = `<div class="saved-empty">Selecione um cadastro para visualizar os detalhes.</div>`;
    return;
  }

  if (state.cadastroView === "classificacoes") {
    grid.innerHTML = `
      <div class="cadastro-detail-item"><span>Grupo</span><strong>${item.categoria || "-"}</strong></div>
      <div class="cadastro-detail-item"><span>Descricao</span><strong>${item.descricao || "-"}</strong></div>
    `;
    return;
  }

  const documento = item.cnpj || item.documento || "-";
  const categoria = item.categoria || "-";
  grid.innerHTML = `
    <div class="cadastro-detail-item"><span>Nome / Razao Social</span><strong>${item.nome || "-"}</strong></div>
    <div class="cadastro-detail-item"><span>CPF / CNPJ</span><strong>${documento}</strong></div>
    <div class="cadastro-detail-item"><span>Inscricao Estadual</span><strong>${item.ie || "-"}</strong></div>
    <div class="cadastro-detail-item"><span>${state.cadastroView === "emitentes" ? "Tipo" : "Categoria"}</span><strong>${categoria}</strong></div>
    <div class="cadastro-detail-item"><span>Logradouro</span><strong>${item.logradouro || "-"}</strong></div>
    <div class="cadastro-detail-item"><span>Bairro</span><strong>${item.bairro || "-"}</strong></div>
    <div class="cadastro-detail-item"><span>Cidade</span><strong>${item.cidade || "-"}</strong></div>
    <div class="cadastro-detail-item"><span>Estado</span><strong>${item.uf || "-"}</strong></div>
  `;
}

function renderCadastros() {
  preencherDatalist("emitentesOptions", state.cadastros.emitentes);
  preencherDatalist("fornecedoresOptions", state.cadastros.fornecedores);
  preencherDatalist("naturezasOptions", state.cadastros.naturezas);
  preencherDatalist("tiposOperacaoOptions", state.cadastros.tiposOperacao);
  preencherDatalist("centrosResultadoOptions", state.cadastros.centrosResultado);

  document.querySelectorAll(".cadastro-tab").forEach((botao) => {
    botao.classList.toggle("is-active", botao.dataset.cadastroView === state.cadastroView);
  });

  const search = document.getElementById("cadastroSearch");
  if (search) {
    const placeholders = {
      emitentes: "Pesquisar emitentes e pagadores...",
      fornecedores: "Pesquisar fornecedores e parceiros...",
      classificacoes: "Pesquisar classificacoes..."
    };
    search.placeholder = placeholders[state.cadastroView] || "Pesquisar cadastros...";
  }

  renderTabelaCadastros();
  renderDetalheCadastro();
}

function removerCadastro(tipo, id) {
  state.cadastros[tipo] = state.cadastros[tipo].filter((item) => item.id !== id);
  state.cadastroSelecionadoId = null;
  salvarStorage();
  renderCadastros();
}

function abrirModalCadastro(modo) {
  const modal = document.getElementById("cadastroModal");
  const form = document.getElementById("cadastroModalForm");
  const titulo = document.getElementById("cadastroModalTitulo");
  const subtitulo = document.getElementById("cadastroModalSubtitulo");
  const entityFields = document.getElementById("cadastroModalEntityFields");
  const classFields = document.getElementById("cadastroModalClassificacaoFields");
  const categoriaLabel = document.getElementById("cadastroCategoriaLabel");
  const item = modo === "editar" ? obterCadastroSelecionado() : null;

  form.reset();
  form.elements.id.value = item?.id || "";

  if (state.cadastroView === "classificacoes") {
    titulo.textContent = "Formulario de cadastro";
    subtitulo.textContent = "Simulacao visual";
    entityFields.hidden = true;
    classFields.hidden = false;
    form.elements.grupo.value = "classificacoes";
    form.elements.classificacaoTipo.value = item?.grupo || "naturezas";
    form.elements.descricao.value = item?.descricao || "";
  } else {
    entityFields.hidden = false;
    classFields.hidden = true;
    form.elements.grupo.value = state.cadastroView;
    categoriaLabel.textContent = state.cadastroView === "emitentes" ? "Tipo" : "Categoria";
    form.elements.categoria.innerHTML = state.cadastroView === "emitentes"
      ? `<option value="Emitente">Emitente</option><option value="Pagador">Pagador</option>`
      : `<option value="Fornecedor">Fornecedor</option><option value="Parceiro">Parceiro</option>`;
    titulo.textContent = "Formulario de cadastro";
    subtitulo.textContent = "Simulacao visual";
    form.elements.nome.value = item?.nome || "";
    form.elements.documento.value = item?.cnpj || item?.documento || "";
    form.elements.ie.value = item?.ie || "";
    form.elements.logradouro.value = item?.logradouro || "";
    form.elements.bairro.value = item?.bairro || "";
    form.elements.cidade.value = item?.cidade || "";
    form.elements.uf.value = item?.uf || "";
    form.elements.categoria.value = item?.categoria || (state.cadastroView === "emitentes" ? "Emitente" : "Fornecedor");
  }

  modal.hidden = false;
}

function fecharModalCadastro() {
  document.getElementById("cadastroModal").hidden = true;
}

function salvarCadastroModal(form) {
  const formData = new FormData(form);
  const id = String(formData.get("id") || "") || uid();
  const grupo = String(formData.get("grupo") || "");

  if (grupo === "classificacoes") {
    const tipo = String(formData.get("classificacaoTipo") || "naturezas");
    const descricao = String(formData.get("descricao") || "").trim();
    if (!descricao) {
      return;
    }

    ["naturezas", "tiposOperacao", "centrosResultado"].forEach((chave) => {
      state.cadastros[chave] = state.cadastros[chave].filter((item) => item.id !== id);
    });

    state.cadastros[tipo].push({ id, descricao });
    state.cadastroSelecionadoId = id;
  } else {
    const payload = {
      id,
      nome: String(formData.get("nome") || "").trim(),
      ie: String(formData.get("ie") || "").trim(),
      logradouro: String(formData.get("logradouro") || "").trim(),
      bairro: String(formData.get("bairro") || "").trim(),
      cidade: String(formData.get("cidade") || "").trim(),
      uf: String(formData.get("uf") || "").trim().toUpperCase(),
      categoria: String(formData.get("categoria") || "").trim()
    };

    if (!payload.nome) {
      return;
    }

    if (grupo === "emitentes") {
      payload.cnpj = String(formData.get("documento") || "").trim();
    } else {
      payload.documento = String(formData.get("documento") || "").trim();
    }

    state.cadastros[grupo] = state.cadastros[grupo].filter((item) => item.id !== id);
    state.cadastros[grupo].push(payload);
    state.cadastroSelecionadoId = id;
  }

  salvarStorage();
  renderCadastros();
  fecharModalCadastro();
}



// =========================
// Fluxo de lancamentos e formulario OPF
// =========================

let renderLancamentosRef = () => {};
let atualizarEstadoPreviewRef = () => {};

function conectarLancamentos({ renderLancamentos, atualizarEstadoPreview }) {
  renderLancamentosRef = renderLancamentos;
  atualizarEstadoPreviewRef = atualizarEstadoPreview;
}

function renderLancamentos() {
  const body = document.getElementById("lancamentosTableBody");

  if (!state.documentos.length) {
    body.innerHTML = `<tr><td colspan="5"><div class="saved-empty">Nenhum lancamento salvo ainda.</div></td></tr>`;
    return;
  }

  body.innerHTML = state.documentos.map((item) => {
    const selected = item.id === state.lancamentoSelecionadoId ? "is-selected" : "";
    return `
      <tr class="${selected}" data-select-lancamento="${item.id}">
        <td>${item.numeroDocumento}</td>
        <td>${item.emitente?.nome || "-"}</td>
        <td>${item.fornecedor?.nome || "-"}</td>
        <td>${item.vencimento || "-"}</td>
        <td class="num">${formatarMoeda(item.total)}</td>
      </tr>
    `;
  }).join("");
}

function limparItensLancamento() {
  document.getElementById("lancamentoItensBody").innerHTML = "";
}

function criarItemLinha(item = {}) {
  const tbody = document.getElementById("lancamentoItensBody");
  const tr = document.createElement("tr");
  const indice = tbody.children.length + 1;
  const quantidade = Number(item.quantidade || 1);
  const unitarioCentavos = Math.round(Number(item.unitario || 0) * 100);

  tr.innerHTML = `
    <td><input type="text" class="item-codigo" value="${item.codigo || String(indice).padStart(3, "0")}" /></td>
    <td><input type="text" class="item-descricao" value="${item.descricao || ""}" /></td>
    <td><input type="number" class="item-qtd" min="0" step="1" value="${quantidade}" /></td>
    <td><input type="text" class="money-input item-unitario" data-cents="${unitarioCentavos}" value="R$ 0,00" /></td>
    <td class="num item-total">R$ 0,00</td>
    <td><button type="button" class="remove-item-btn">Excluir</button></td>
  `;

  tbody.appendChild(tr);
}

function garantirLinhaInicial() {
  if (!document.getElementById("lancamentoItensBody").children.length) {
    criarItemLinha();
  }
}

function moneyInputParaCentavos(input) {
  return Number(input.dataset.cents || 0);
}

function aplicarFormatoProgressivo(input, inicial) {
  const centavos = inicial !== undefined ? inicial : Number((input.value || "").replace(/\D/g, "") || 0);
  input.dataset.cents = String(centavos);
  input.value = formatarMoeda(centavos / 100);
}

function configurarMoneyInput(input, valorInicial = 0) {
  aplicarFormatoProgressivo(input, valorInicial);

  input.addEventListener("input", () => {
    aplicarFormatoProgressivo(input);
    atualizarResumo();
  });

  input.addEventListener("focus", () => input.select());
}

function configurarTodosMoneyInputs() {
  document.querySelectorAll(".money-input").forEach((input) => {
    if (!input.dataset.bound) {
      input.dataset.bound = "1";
      configurarMoneyInput(input, Number(input.dataset.cents || 0));
    }
  });
}

function atualizarResumo() {
  const linhas = Array.from(document.querySelectorAll("#lancamentoItensBody tr"));
  let quantidadeTotal = 0;
  let subtotal = 0;

  linhas.forEach((linha) => {
    const qtd = Number(linha.querySelector(".item-qtd").value || 0);
    const unitario = moneyInputParaCentavos(linha.querySelector(".item-unitario")) / 100;
    const total = qtd * unitario;

    quantidadeTotal += qtd;
    subtotal += total;
    linha.querySelector(".item-total").textContent = formatarMoeda(total);
  });

  const desconto = moneyInputParaCentavos(document.getElementById("descontoInput")) / 100;
  const acrescimo = moneyInputParaCentavos(document.getElementById("acrescimoInput")) / 100;
  const total = Math.max(subtotal - desconto + acrescimo, 0);

  document.getElementById("resumoQuantidade").textContent = String(quantidadeTotal);
  document.getElementById("resumoSubtotal").textContent = formatarMoeda(subtotal);
  document.getElementById("resumoTotal").textContent = formatarMoeda(total);
}

function obterClassificacaoDocumento() {
  return {
    fiscal: document.getElementById("fiscalCheckbox").checked,
    contabil: document.getElementById("contabilCheckbox").checked
  };
}

function preencherFormularioLancamento(documento) {
  const agora = formatarDataHoraAtual();
  const doc = documento || null;

  state.lancamentoEmEdicaoId = doc?.id || null;
  state.numeroDocumentoAtual = doc?.numeroDocumento || gerarNumeroDocumento();

  document.getElementById("launchNumeroDocumento").textContent = state.numeroDocumentoAtual;
  document.getElementById("emitenteSelect").value = doc?.emitente?.nome || "";
  document.getElementById("fornecedorSelect").value = doc?.fornecedor?.nome || "";
  document.getElementById("formaPagamentoSelect").value = doc?.formaPagamento || "PIX";
  document.getElementById("pixKeyTypeSelect").value = doc?.pixKeyType || "";
  document.getElementById("pixKeyInput").value = doc?.pixKey || "";
  document.getElementById("vencimentoInput").value = doc?.vencimento && doc.vencimento !== "-" ? doc.vencimento.split("/").reverse().join("-") : agora.dataIso;
  document.getElementById("mesReferenciaInput").value = doc?.mesReferencia && doc.mesReferencia !== "-" ? doc.mesReferencia : "";
  document.getElementById("paymentNotesInput").value = doc?.paymentNotes || "";
  document.getElementById("naturezaSelect").value = doc?.natureza && doc.natureza !== "-" ? doc.natureza : "";
  document.getElementById("tipoOperacaoSelect").value = doc?.tipoOperacao && doc.tipoOperacao !== "-" ? doc.tipoOperacao : "";
  document.getElementById("centroResultadoSelect").value = doc?.centroResultado && doc.centroResultado !== "-" ? doc.centroResultado : "";
  document.getElementById("fiscalCheckbox").checked = Boolean(doc?.fiscal);
  document.getElementById("contabilCheckbox").checked = Boolean(doc?.contabil);
  document.getElementById("notaFiscalInput").value = doc?.notaFiscal && doc.notaFiscal !== "-" ? doc.notaFiscal : "";
  document.getElementById("dataEmissaoFiscalInput").value = doc?.dataFiscal && doc.dataFiscal !== "-" ? doc.dataFiscal.split("/").reverse().join("-") : agora.dataIso;
  document.getElementById("observacoesInput").value = doc?.observacoes || "";

  limparItensLancamento();
  if (doc?.itens?.length) {
    doc.itens.forEach((item) => criarItemLinha(item));
  } else {
    criarItemLinha();
  }

  document.getElementById("descontoInput").dataset.cents = String(Math.round(Number(doc?.desconto || 0) * 100));
  document.getElementById("acrescimoInput").dataset.cents = String(Math.round(Number(doc?.acrescimo || 0) * 100));

  configurarTodosMoneyInputs();
  atualizarResumo();
  sincronizarCamposPix();
}

function mostrarListaLancamentos() {
  document.getElementById("lancamentoListView").hidden = true;
  document.getElementById("lancamentoForm").hidden = true;
  state.lancamentoEmEdicaoId = null;
  state.numeroDocumentoAtual = "";
  fecharWorkspaceDocumento();

  const possuiDocumento = Boolean(state.documentoAtual);
  atualizarEstadoPreview({ loading: false, success: false, documento: possuiDocumento });
  document.getElementById("documentoEmptyState").hidden = possuiDocumento;
}

function mostrarFormularioLancamento(documento = null) {
  preencherFormularioLancamento(documento);
  document.getElementById("lancamentoListView").hidden = true;
  document.getElementById("lancamentoForm").hidden = false;
  document.getElementById("previewLoading").hidden = true;
  document.getElementById("documentoPreviewArea").hidden = true;
  document.getElementById("documentoEmptyState").hidden = true;
  abrirWorkspaceDocumento({
    mode: "form",
    step: 0,
    title: documento ? "Editar documento" : "Novo documento",
    kicker: documento ? "Edicao" : "Novo documento"
  });
}

function abrirModalFechamentoFormulario() {
  document.getElementById("closeFormModal").hidden = false;
}

function fecharModalFechamentoFormulario() {
  document.getElementById("closeFormModal").hidden = true;
}

function fecharFormularioSemSalvar() {
  fecharModalFechamentoFormulario();
  alternarAba("documento");
  mostrarListaLancamentos();
  preencherFormularioLancamento();
}

function salvarRascunhoEFecharFormulario() {
  const documento = coletarDocumentoAtual({ validarPix: false });
  if (!documento) {
    return;
  }
  upsertDocumento(documento);
  state.documentoAtual = documento;
  fecharModalFechamentoFormulario();
  alternarAba("documento");
  mostrarListaLancamentos();
  atualizarEstadoPreview({ loading: false, success: false, documento: false });
  mostrarToast("OPF salva para preenchimento futuro.", "success");
}

// =========================
// PIX, validacoes e coleta de pagamento
// =========================

function somenteDigitos(valor) {
  return String(valor || "").replace(/\D+/g, "");
}

function formatarPixCpf(valor) {
  const digits = somenteDigitos(valor).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatarPixCnpj(valor) {
  const digits = somenteDigitos(valor).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatarPixTelefone(valor) {
  const digits = somenteDigitos(valor).slice(0, 13);
  if (!digits) {
    return "";
  }
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return digits.replace(/^(\d{2})(\d+)/, "($1) $2");
  }
  if (digits.length <= 11) {
    return digits.replace(/^(\d{2})(\d{4,5})(\d{0,4}).*/, "($1) $2-$3").replace(/-$/, "");
  }
  return digits.replace(/^(\d{2})(\d{2})(\d{4,5})(\d{0,4}).*/, "+$1 ($2) $3-$4").replace(/-$/, "");
}

function validarCpf(valor) {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }
  let soma = 0;
  for (let i = 0; i < 9; i += 1) {
    soma += Number(cpf[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  resto = resto === 10 ? 0 : resto;
  if (resto !== Number(cpf[9])) {
    return false;
  }
  soma = 0;
  for (let i = 0; i < 10; i += 1) {
    soma += Number(cpf[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  resto = resto === 10 ? 0 : resto;
  return resto === Number(cpf[10]);
}

function validarCnpj(valor) {
  const cnpj = somenteDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, ...pesos1];
  const calcular = (base, pesos) => {
    const soma = base.split("").reduce((acc, digit, index) => acc + Number(digit) * pesos[index], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const digito1 = calcular(cnpj.slice(0, 12), pesos1);
  const digito2 = calcular(cnpj.slice(0, 12) + digito1, pesos2);
  return cnpj.endsWith(`${digito1}${digito2}`);
}

function aplicarMascaraPix() {
  const tipo = document.getElementById("pixKeyTypeSelect")?.value || "";
  const input = document.getElementById("pixKeyInput");
  if (!input) {
    return;
  }

  if (tipo === "CPF") {
    input.value = formatarPixCpf(input.value);
    return;
  }
  if (tipo === "CNPJ") {
    input.value = formatarPixCnpj(input.value);
    return;
  }
  if (tipo === "Telefone") {
    input.value = formatarPixTelefone(input.value);
  }
}

function validarCamposPix({ silent = false } = {}) {
  const formaPagamento = document.getElementById("formaPagamentoSelect")?.value || "";
  const tipo = document.getElementById("pixKeyTypeSelect")?.value || "";
  const input = document.getElementById("pixKeyInput");
  if (!input || formaPagamento !== "PIX") {
    return true;
  }

  const valor = String(input.value || "").trim();
  let mensagem = "";

  if (!tipo) {
    mensagem = "Selecione o tipo de chave PIX.";
  } else if (!valor) {
    mensagem = "Informe a chave PIX.";
  } else if (tipo === "CPF" && !validarCpf(valor)) {
    mensagem = "CPF inválido.";
  } else if (tipo === "CNPJ" && !validarCnpj(valor)) {
    mensagem = "CNPJ inválido.";
  } else if (tipo === "Email" && !valor.includes("@")) {
    mensagem = "O e-mail da chave PIX deve conter @.";
  }

  input.setCustomValidity(mensagem);
  if (mensagem && !silent) {
    input.reportValidity();
    input.focus();
  }
  return !mensagem;
}

function coletarDocumentoAtual({ validarPix = true } = {}) {
  const agora = formatarDataHoraAtual();
  const emitenteTexto = document.getElementById("emitenteSelect").value.trim();
  const fornecedorTexto = document.getElementById("fornecedorSelect").value.trim();
  const emitente = encontrarCadastroPorTexto("emitentes", emitenteTexto) || (emitenteTexto ? { nome: emitenteTexto } : null);
  const fornecedor = encontrarCadastroPorTexto("fornecedores", fornecedorTexto) || (fornecedorTexto ? { nome: fornecedorTexto } : null);
  const classificacao = obterClassificacaoDocumento();
  const itens = Array.from(document.querySelectorAll("#lancamentoItensBody tr")).map((linha) => {
    const quantidade = Number(linha.querySelector(".item-qtd").value || 0);
    const unitario = moneyInputParaCentavos(linha.querySelector(".item-unitario")) / 100;

    return {
      codigo: linha.querySelector(".item-codigo").value.trim() || "-",
      descricao: linha.querySelector(".item-descricao").value.trim() || "-",
      quantidade,
      unitario,
      total: quantidade * unitario
    };
  });

  const subtotal = itens.reduce((acc, item) => acc + item.total, 0);
  const desconto = moneyInputParaCentavos(document.getElementById("descontoInput")) / 100;
  const acrescimo = moneyInputParaCentavos(document.getElementById("acrescimoInput")) / 100;
  const total = Math.max(subtotal - desconto + acrescimo, 0);

  aplicarMascaraPix();
  if (validarPix && !validarCamposPix()) {
    return null;
  }

  return {
    id: state.lancamentoEmEdicaoId || uid(),
    numeroDocumento: state.numeroDocumentoAtual || gerarNumeroDocumento(),
    dataDocumento: agora.dataBr,
    horaDocumento: agora.hora,
    mesReferencia: obterMesReferencia(document.getElementById("mesReferenciaInput").value.trim()),
    emitente,
    fornecedor,
    formaPagamento: document.getElementById("formaPagamentoSelect").value || "-",
    pixKeyType: document.getElementById("pixKeyTypeSelect").value.trim() || "",
    pixKey: document.getElementById("pixKeyInput").value.trim() || "",
    vencimento: formatarDataBr(document.getElementById("vencimentoInput").value),
    paymentNotes: document.getElementById("paymentNotesInput").value.trim() || "",
    natureza: document.getElementById("naturezaSelect").value.trim() || "-",
    tipoOperacao: document.getElementById("tipoOperacaoSelect").value.trim() || "-",
    centroResultado: document.getElementById("centroResultadoSelect").value.trim() || "-",
    fiscal: classificacao.fiscal,
    contabil: classificacao.contabil,
    notaFiscal: document.getElementById("notaFiscalInput").value.trim() || "-",
    dataFiscal: formatarDataBr(document.getElementById("dataEmissaoFiscalInput").value),
    itens,
    subtotal,
    desconto,
    acrescimo,
    total,
    solicitante: "SOLICITANTE",
    solicitanteSetor: "",
    autorizador: "AUTORIZADOR",
    autorizadorCargo: "",
    observacoes: document.getElementById("observacoesInput").value.trim() || "Documento interno gerado para detalhamento do pagamento."
  };
}

function sincronizarCamposPix() {
  const formaPagamento = document.getElementById("formaPagamentoSelect")?.value || "";
  const pixFields = document.getElementById("pixFields");
  const pixKeyType = document.getElementById("pixKeyTypeSelect");
  const pixKey = document.getElementById("pixKeyInput");
  const ativo = formaPagamento === "PIX";

  if (pixFields) {
    pixFields.hidden = !ativo;
  }

  if (!ativo) {
    if (pixKeyType) {
      pixKeyType.value = "";
    }
    if (pixKey) {
      pixKey.value = "";
      pixKey.setCustomValidity("");
    }
  }
}

function removerLancamento(id) {
  removerDocumentos([id]);
}

function removerDocumentos(ids) {
  const idsSet = new Set((ids || []).filter(Boolean));
  if (!idsSet.size) {
    return;
  }

  state.documentos = state.documentos.filter((item) => !idsSet.has(item.id));

  if (state.documentoAtual?.id && idsSet.has(state.documentoAtual.id)) {
    state.documentoAtual = null;
    atualizarEstadoPreviewRef({ loading: false, success: false, documento: false });
  }

  state.documentoSelecionados = state.documentoSelecionados.filter((id) => !idsSet.has(id));
  normalizarSelecaoDocumentos();
  salvarStorage();
  renderHome();
  renderLancamentosRef();
  renderRelatorios?.();
}

function configurarExclusividadeCheckbox() {
  const fiscal = document.getElementById("fiscalCheckbox");
  const contabil = document.getElementById("contabilCheckbox");

  fiscal.addEventListener("change", () => {
    if (fiscal.checked) {
      contabil.checked = false;
    }
  });

  contabil.addEventListener("change", () => {
    if (contabil.checked) {
      fiscal.checked = false;
    }
  });
}

// =========================
// Feedback, confirmacoes e upload de logo
// =========================

function mostrarToast(mensagem, tipo = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast-item is-${tipo}`;
  toast.textContent = mensagem;
  container.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("is-visible");
  }, 10);

  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 220);
  }, 3200);
}

function abrirConfirmacao({ titulo, texto, onConfirm, confirmLabel, cancelLabel }) {
  state.confirmAction = typeof onConfirm === "function" ? onConfirm : null;
  document.getElementById("confirmModalTitulo").textContent = titulo || "Confirmar ação";
  document.getElementById("confirmModalTexto").textContent = texto || "Deseja continuar com esta operação?";
  document.querySelector('[data-confirm-action="confirmar"]').textContent = confirmLabel || "Confirmar";
  document.querySelector('[data-confirm-action="cancelar"]').textContent = cancelLabel || "Cancelar";
  document.getElementById("confirmModal").hidden = false;
}

function fecharConfirmacao() {
  state.confirmAction = null;
  document.getElementById("confirmModal").hidden = true;
}

function lerArquivoComoDataURL(file, callback) {
  const reader = new FileReader();
  reader.onload = () => callback(String(reader.result || ""));
  reader.readAsDataURL(file);
}

function processarLogoUpload(file, callback) {
  if (!file) {
    callback("");
    return;
  }

  if (file.type === "image/svg+xml") {
    lerArquivoComoDataURL(file, callback);
    return;
  }

  lerArquivoComoDataURL(file, (dataUrl) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 900;
      const maxHeight = 320;
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      const width = Math.max(1, Math.round(img.width * ratio));
      const height = Math.max(1, Math.round(img.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL("image/png", 0.92));
    };
    img.onerror = () => callback(dataUrl);
    img.src = dataUrl;
  });
}

function prepararLogoDraft(file) {
  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    mostrarToast("Arquivo invalido. Envie uma imagem.", "error");
    return;
  }

  processarLogoUpload(file, (logoDataUrl) => {
    state.configuracoesDraft.logoDataUrl = logoDataUrl;
    aplicarConfiguracoesDocumento();
    mostrarToast("Logo carregado na prévia. Clique em salvar para confirmar.", "success");
  });
}

// =========================
// Configuracoes, identidade e tema
// =========================

function aplicarTema(tema) {
  const temaFinal = tema === "dark" ? "dark" : "light";
  document.body.dataset.theme = temaFinal;
  localStorage.setItem(THEME_KEY, temaFinal);

  const toggle = document.getElementById("darkModeToggle");
  if (toggle) {
    toggle.checked = temaFinal === "dark";
  }

  const themeModeText = document.getElementById("themeModeText");
  const themeModeHint = document.getElementById("themeModeHint");
  if (themeModeText) {
    themeModeText.textContent = temaFinal === "dark" ? "Modo escuro ativado" : "Modo claro ativado";
  }
  if (themeModeHint) {
    themeModeHint.textContent = temaFinal === "dark"
      ? "O sistema está usando o visual escuro. Desative se quiser voltar para uma leitura mais clara."
      : "O sistema está usando o visual claro. Ative o modo escuro para reduzir o brilho da interface.";
  }
}

function sincronizarModalConfiguracoes() {
  const modal = document.getElementById("configModal");
  const trigger = document.querySelector("[data-open-config]");
  if (!modal) {
    return;
  }

  modal.hidden = !state.configModalOpen;
  if (trigger) {
    trigger.classList.toggle("is-active", state.configModalOpen);
  }

  document.querySelectorAll("[data-config-view]").forEach((botao) => {
    botao.classList.toggle("is-active", botao.dataset.configView === state.configView);
  });

  document.querySelectorAll("[data-config-panel]").forEach((painel) => {
    const ativo = painel.dataset.configPanel === state.configView;
    painel.hidden = !ativo;
    painel.classList.toggle("is-active", ativo);
  });
}

function abrirModalConfiguracoes(view = state.configView || "personalizacao") {
  state.configModalOpen = true;
  state.configView = view;
  sincronizarDraftConfiguracoes();
  aplicarConfiguracoesDocumento();
  sincronizarModalConfiguracoes();
}

function fecharModalConfiguracoes() {
  state.configModalOpen = false;
  sincronizarModalConfiguracoes();
}

function alternarViewConfiguracoes(view) {
  state.configView = view || "personalizacao";
  sincronizarModalConfiguracoes();
}

function obterMapaConfigTarget() {
  return {
      logo: {
        scale: "logoScale",
        width: "logoWidth",
        offsetX: "logoOffsetX",
        offsetY: "logoOffsetY",
        label: "Tamanho do logo",
        widthLabel: "Largura da área do logo",
        min: 40,
        max: 320,
        step: 5,
        widthMin: 100,
        widthMax: 260,
        widthStep: 5
      },
      titulo: {
        scale: "titleScale",
        width: "titleWidth",
        offsetX: "titleOffsetX",
        offsetY: "titleOffsetY",
        label: "Tamanho do título",
        widthLabel: "Largura da área do título",
        min: 80,
        max: 180,
        step: 2,
        widthMin: 260,
        widthMax: 620,
        widthStep: 10
      },
      numero: {
        scale: "codeScale",
        width: "codeWidth",
        offsetX: "codeOffsetX",
        offsetY: "codeOffsetY",
        label: "Tamanho do número",
        widthLabel: "Largura da área do número",
        min: 80,
        max: 180,
        step: 2,
        widthMin: 140,
        widthMax: 280,
        widthStep: 5
      }
    };
  }

function aplicarConfiguracoesDocumento() {
  const root = document.documentElement;
  const logoImg = document.getElementById("sheetLogoImage");
  const logoFallback = document.getElementById("sheetLogoFallback");
  const configLogoPreviewImage = document.getElementById("configLogoPreviewImage");
  const configLogoPreviewFallback = document.getElementById("configLogoPreviewFallback");
    const logoScaleInput = document.getElementById("logoScaleInput");
    const configDocumentPreview = document.getElementById("configDocumentPreview");
    const configScaleLabel = document.getElementById("configScaleLabel");
  const configTitleTextField = document.getElementById("configTitleTextField");
  const configTitleTextInput = document.getElementById("configTitleTextInput");
  const configEditorTitle = document.getElementById("configEditorTitle");
  const configEditorHint = document.getElementById("configEditorHint");
  const configLogoRemove = document.querySelector(".config-logo-remove");
  const logoDropzone = document.getElementById("logoDropzone");
  const draft = state.configuracoesDraft;
  const saved = state.configuracoes;
  const targetMap = obterMapaConfigTarget();
  const targetConfig = targetMap[state.configTarget] || targetMap.logo;

  root.style.setProperty("--logo-scale", String((draft.logoScale || 100) / 100));
  root.style.setProperty("--config-logo-width", `${draft.logoWidth || 140}px`);
  root.style.setProperty("--logo-offset-x", `${draft.logoOffsetX || 0}px`);
  root.style.setProperty("--logo-offset-y", `${draft.logoOffsetY || 0}px`);
  root.style.setProperty("--title-scale", String((draft.titleScale || 100) / 100));
  root.style.setProperty("--config-title-width", `${draft.titleWidth || 360}px`);
  root.style.setProperty("--title-offset-x", `${draft.titleOffsetX || 0}px`);
  root.style.setProperty("--title-offset-y", `${draft.titleOffsetY || 0}px`);
  root.style.setProperty("--code-scale", String((draft.codeScale || 100) / 100));
  root.style.setProperty("--config-code-width", `${draft.codeWidth || 185}px`);
  root.style.setProperty("--code-offset-x", `${draft.codeOffsetX || 0}px`);
  root.style.setProperty("--code-offset-y", `${draft.codeOffsetY || 0}px`);

  if (logoScaleInput) {
    logoScaleInput.min = String(targetConfig.min);
    logoScaleInput.max = String(targetConfig.max);
    logoScaleInput.step = String(targetConfig.step);
    logoScaleInput.value = String(draft[targetConfig.scale] || 100);
  }

  if (configTitleTextInput) {
    configTitleTextInput.value = draft.titleText || "ORDEM DE PAGAMENTO FINANCEIRO";
  }

    if (configScaleLabel) {
      configScaleLabel.textContent = targetConfig.label;
    }

    document.querySelectorAll("[data-config-target]").forEach((botao) => {
      botao.classList.toggle("is-active", botao.dataset.configTarget === state.configTarget);
    });

  document.querySelectorAll("[data-config-preview-target]").forEach((item) => {
    item.classList.toggle("is-target", item.dataset.configPreviewTarget === state.configTarget);
  });

  if (configTitleTextField) {
    configTitleTextField.hidden = state.configTarget !== "titulo";
  }

  if (configEditorTitle) {
    configEditorTitle.textContent = state.configTarget === "logo"
      ? "Logo da OPF"
      : state.configTarget === "titulo"
        ? "Titulo da OPF"
        : "Numero da OPF";
  }

  if (configEditorHint) {
    configEditorHint.textContent = state.configTarget === "logo"
      ? "Arraste ou envie o logo no próprio quadro da prévia e ajuste posição e tamanho abaixo."
      : state.configTarget === "titulo"
        ? "Edite o texto do título e ajuste posição e escala diretamente para a OPF."
        : "Ajuste a posição e o tamanho do número exibido no cabeçalho da OPF.";
  }

  const possuiLogoSalvo = Boolean(saved.logoDataUrl);
  if (logoImg) {
    logoImg.hidden = !possuiLogoSalvo;
    logoImg.src = possuiLogoSalvo ? saved.logoDataUrl : "";
  }

  if (logoFallback) {
    logoFallback.hidden = possuiLogoSalvo;
  }

  const possuiLogoDraft = Boolean(draft.logoDataUrl);
  if (configLogoPreviewImage) {
    configLogoPreviewImage.hidden = !possuiLogoDraft;
    configLogoPreviewImage.src = possuiLogoDraft ? draft.logoDataUrl : "";
  }

  if (configLogoPreviewFallback) {
    configLogoPreviewFallback.hidden = true;
  }

  if (configLogoRemove) {
    configLogoRemove.hidden = !possuiLogoDraft;
  }

  if (logoDropzone) {
    logoDropzone.hidden = possuiLogoDraft;
  }

  if (configLogoPreviewImage) {
    configLogoPreviewImage.style.transform = `translate(${draft.logoOffsetX || 0}px, ${draft.logoOffsetY || 0}px) scale(${(draft.logoScale || 100) / 100})`;
  }

  const configDocumentTitleText = document.getElementById("configDocumentTitleText");
  if (configDocumentTitleText) {
    configDocumentTitleText.textContent = draft.titleText || "ORDEM DE PAGAMENTO FINANCEIRO";
    configDocumentTitleText.style.transform = `translate(${draft.titleOffsetX || 0}px, ${draft.titleOffsetY || 0}px) scale(${(draft.titleScale || 100) / 100})`;
  }

  const sheetTitleText = document.getElementById("sheetTitleText");
  if (sheetTitleText) {
    sheetTitleText.textContent = draft.titleText || saved.titleText || "ORDEM DE PAGAMENTO FINANCEIRO";
  }

  const configDocumentCodeContent = document.getElementById("configDocumentCodeContent");
  if (configDocumentCodeContent) {
    configDocumentCodeContent.style.transform = `translate(${draft.codeOffsetX || 0}px, ${draft.codeOffsetY || 0}px) scale(${(draft.codeScale || 100) / 100})`;
  }
}

function sincronizarDraftConfiguracoes() {
  state.configuracoesDraft.logoDataUrl = state.configuracoes.logoDataUrl || "";
  state.configuracoesDraft.titleText = state.configuracoes.titleText || "ORDEM DE PAGAMENTO FINANCEIRO";
  state.configuracoesDraft.logoScale = Number(state.configuracoes.logoScale || 100);
  state.configuracoesDraft.logoWidth = Number(state.configuracoes.logoWidth || 140);
  state.configuracoesDraft.printScale = Number(state.configuracoes.printScale || 100);
  state.configuracoesDraft.logoOffsetX = Number(state.configuracoes.logoOffsetX || 0);
  state.configuracoesDraft.logoOffsetY = Number(state.configuracoes.logoOffsetY || 0);
  state.configuracoesDraft.titleScale = Number(state.configuracoes.titleScale || 100);
  state.configuracoesDraft.titleWidth = Number(state.configuracoes.titleWidth || 360);
  state.configuracoesDraft.titleOffsetX = Number(state.configuracoes.titleOffsetX || 0);
  state.configuracoesDraft.titleOffsetY = Number(state.configuracoes.titleOffsetY || 0);
  state.configuracoesDraft.codeScale = Number(state.configuracoes.codeScale || 100);
  state.configuracoesDraft.codeWidth = Number(state.configuracoes.codeWidth || 185);
  state.configuracoesDraft.codeOffsetX = Number(state.configuracoes.codeOffsetX || 0);
  state.configuracoesDraft.codeOffsetY = Number(state.configuracoes.codeOffsetY || 0);
}

function salvarConfiguracoesDocumento() {
  const botaoSalvar = document.querySelector('[data-config-action="salvar-aparencia"]');
  state.configuracoes.logoDataUrl = state.configuracoesDraft.logoDataUrl || "";
  state.configuracoes.titleText = state.configuracoesDraft.titleText || "ORDEM DE PAGAMENTO FINANCEIRO";
  state.configuracoes.logoScale = Number(state.configuracoesDraft.logoScale || 100);
  state.configuracoes.logoWidth = Number(state.configuracoesDraft.logoWidth || 140);
  state.configuracoes.printScale = Number(state.configuracoesDraft.printScale || 100);
  state.configuracoes.logoOffsetX = Number(state.configuracoesDraft.logoOffsetX || 0);
  state.configuracoes.logoOffsetY = Number(state.configuracoesDraft.logoOffsetY || 0);
  state.configuracoes.titleScale = Number(state.configuracoesDraft.titleScale || 100);
  state.configuracoes.titleWidth = Number(state.configuracoesDraft.titleWidth || 360);
  state.configuracoes.titleOffsetX = Number(state.configuracoesDraft.titleOffsetX || 0);
  state.configuracoes.titleOffsetY = Number(state.configuracoesDraft.titleOffsetY || 0);
  state.configuracoes.codeScale = Number(state.configuracoesDraft.codeScale || 100);
  state.configuracoes.codeWidth = Number(state.configuracoesDraft.codeWidth || 185);
  state.configuracoes.codeOffsetX = Number(state.configuracoesDraft.codeOffsetX || 0);
  state.configuracoes.codeOffsetY = Number(state.configuracoesDraft.codeOffsetY || 0);
  const salvo = salvarStorage();
  if (!salvo) {
    mostrarToast("Não foi possível salvar. O arquivo do logo pode estar grande demais.", "error");
    return;
  }
  sincronizarDraftConfiguracoes();
  aplicarConfiguracoesDocumento();

  if (botaoSalvar) {
    const textoOriginal = botaoSalvar.textContent;
    botaoSalvar.textContent = "Salvo com sucesso";
    botaoSalvar.disabled = true;
    window.setTimeout(() => {
      botaoSalvar.textContent = textoOriginal;
      botaoSalvar.disabled = false;
    }, 1400);
  }

  mostrarToast("Ajustes de identidade salvos com sucesso.", "success");
}

// =========================
// Impressao, importacao, exportacao e reset
// =========================

function imprimirDocumentoAtual() {
  const selecionados = obterDocumentosSelecionados();
  if (selecionados.length > 1) {
    imprimirDocumentosEmMassa(selecionados);
    return;
  }

  if (!state.documentoAtual) {
    const selecionado = obterDocumentoUnicoSelecionado() || obterDocumentoSelecionado();
    if (selecionado) {
      state.documentoAtual = selecionado;
      popularPreview(selecionado);
    }
  }

  if (!state.documentoAtual) {
    mostrarToast("Nenhum documento foi carregado para impressão.", "error");
    return;
  }

  document.getElementById("lancamentoForm").hidden = true;
  salvarDocumentoAtual();
  atualizarEstadoPreview({ loading: false, success: true, documento: true });
  alternarAba("documento");
  abrirWorkspaceDocumento({
    mode: "preview",
    title: "Visualizacao da OPF",
    kicker: "Documento"
  });
  document.getElementById("printSheet")?.offsetHeight;

  const logo = document.getElementById("sheetLogoImage");
  if (logo && !logo.hidden && !logo.complete) {
    logo.onload = () => {
      logo.onload = null;
      window.print();
    };
    logo.onerror = () => {
      logo.onerror = null;
      window.print();
    };
    return;
  }

  window.print();
}

function imprimirDocumentosEmMassa(documentos) {
  const itens = Array.isArray(documentos) ? documentos.filter(Boolean) : [];
  if (!itens.length) {
    mostrarToast("Selecione ao menos uma OPF para imprimir.", "info");
    return;
  }

  const folha = document.getElementById("printSheet");
  if (!folha) {
    mostrarToast("Não foi possível preparar a impressão em lote.", "error");
    return;
  }

  const anterior = state.documentoAtual;
  const capturas = [];
  itens.forEach((documento) => {
    popularPreview(documento);
    capturas.push(folha.outerHTML);
  });

  if (anterior) {
    popularPreview(anterior);
  }

  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (!popup) {
    mostrarToast("Permita a abertura de janela para imprimir várias OPFs.", "info");
    return;
  }

  popup.document.write(`<!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Impressão em lote</title>
      <link rel="stylesheet" href="assets/css/styles.css" />
      <style>
        body{padding:16px;background:#fff;}
        .print-batch{display:grid;gap:18px;}
        .print-batch .print-sheet{margin:0 auto;break-after:page;}
        .print-batch .print-sheet:last-child{break-after:auto;}
      </style>
    </head>
    <body data-theme="${document.body.dataset.theme || "light"}">
      <div class="print-batch">${capturas.join("")}</div>
    </body>
  </html>`);
  popup.document.close();
  popup.focus();
  popup.onload = () => popup.print();
}

function baixarArquivo(nome, conteudo, tipo) {
  const payload = tipo.includes("csv") ? `\uFEFF${conteudo}` : conteudo;
  const blob = new Blob([payload], { type: tipo });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportarBackupDados() {
  const backup = {
    emitentes: state.cadastros.emitentes,
    fornecedores: state.cadastros.fornecedores,
    naturezas: state.cadastros.naturezas,
    tiposOperacao: state.cadastros.tiposOperacao,
    centrosResultado: state.cadastros.centrosResultado,
    ultimoNumeroPorAno: state.controle.ultimoNumeroPorAno,
    documentos: state.documentos
  };

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  baixarArquivo(`backup-opf-${stamp}.json`, JSON.stringify(backup, null, 2), "application/json");
  mostrarToast("Backup exportado com sucesso.", "success");
}

function baixarModeloImportacao() {
  const csv = [
    "tipo;nome;documento;ie;logradouro;bairro;cidade;uf;categoria;descricao;grupo",
    "emitente;Empresa Exemplo;12.345.678/0001-90;123456;Rua Central 100;Centro;Sao Paulo;SP;Emitente;;",
    "fornecedor;Fornecedor Exemplo;54.321.987/0001-33;;Av Brasil 200;Jardins;Campinas;SP;Fornecedor;;",
    "classificacao;;;;;;;;;Natureza de exemplo;naturezas",
    "classificacao;;;;;;;;;Tipo de operacao de exemplo;tiposOperacao",
    "classificacao;;;;;;;;;Centro de resultado de exemplo;centrosResultado"
  ].join("\r\n");

  baixarArquivo("modelo-importacao-opf.csv", csv, "text/csv;charset=utf-8");
  mostrarToast("Modelo de importacao baixado com sucesso.", "success");
}

function parseCsvLinha(linha) {
  const separador = linha.includes(";") ? ";" : ",";
  return linha.split(separador).map((item) => item.trim());
}

function importarCsvConteudo(texto) {
  const linhas = String(texto || "").split(/\r?\n/).filter((linha) => linha.trim());
  if (linhas.length < 2) {
    throw new Error("Arquivo CSV vazio ou invalido.");
  }

  const registros = linhas.slice(1).map(parseCsvLinha);

  registros.forEach((colunas) => {
    const [tipo, nome, documento, ie, logradouro, bairro, cidade, uf, categoria, descricao, grupo] = colunas;

    if (tipo === "emitente") {
      state.cadastros.emitentes.push({
        id: uid(),
        nome: nome || "",
        cnpj: documento || "",
        ie: ie || "",
        logradouro: logradouro || "",
        bairro: bairro || "",
        cidade: cidade || "",
        uf: (uf || "").toUpperCase(),
        categoria: categoria || "Emitente"
      });
    }

    if (tipo === "fornecedor") {
      state.cadastros.fornecedores.push({
        id: uid(),
        nome: nome || "",
        documento: documento || "",
        ie: ie || "",
        logradouro: logradouro || "",
        bairro: bairro || "",
        cidade: cidade || "",
        uf: (uf || "").toUpperCase(),
        categoria: categoria || "Fornecedor"
      });
    }

    if (tipo === "classificacao" && descricao && ["naturezas", "tiposOperacao", "centrosResultado"].includes(grupo)) {
      state.cadastros[grupo].push({
        id: uid(),
        descricao
      });
    }
  });
}

function importarJsonConteudo(texto) {
  const dados = JSON.parse(texto);
  state.cadastros.emitentes = dados.emitentes || [];
  state.cadastros.fornecedores = dados.fornecedores || [];
  state.cadastros.naturezas = dados.naturezas || [];
  state.cadastros.tiposOperacao = dados.tiposOperacao || [];
  state.cadastros.centrosResultado = dados.centrosResultado || [];
  state.documentos = dados.documentos || [];
  state.controle.ultimoNumeroPorAno = dados.ultimoNumeroPorAno || {};
}

function importarArquivoDados(file) {
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const texto = String(reader.result || "");

      if (file.name.toLowerCase().endsWith(".json")) {
        importarJsonConteudo(texto);
      } else {
        importarCsvConteudo(texto);
      }

      salvarStorage();
      renderCadastros();
      renderHome();
      renderLancamentos();
      mostrarToast("Dados importados com sucesso.", "success");
    } catch (error) {
      mostrarToast("Falha ao importar os dados. Verifique o arquivo.", "error");
    }
  };

  reader.readAsText(file, "utf-8");
}

function resetarSistema() {
  state.cadastros.emitentes = [];
  state.cadastros.fornecedores = [];
  state.cadastros.naturezas = [];
  state.cadastros.tiposOperacao = [];
  state.cadastros.centrosResultado = [];
  state.documentos = [];
  state.controle.ultimoNumeroPorAno = {};
  state.configuracoes.logoDataUrl = "";
  state.configuracoes.titleText = "ORDEM DE PAGAMENTO FINANCEIRO";
  state.configuracoes.logoScale = 100;
  state.configuracoes.logoWidth = 140;
  state.configuracoes.printScale = 100;
  state.configuracoes.logoOffsetX = 0;
  state.configuracoes.logoOffsetY = 0;
  state.configuracoes.titleScale = 100;
  state.configuracoes.titleWidth = 360;
  state.configuracoes.titleOffsetX = 0;
  state.configuracoes.titleOffsetY = 0;
  state.configuracoes.codeScale = 100;
  state.configuracoes.codeWidth = 185;
  state.configuracoes.codeOffsetX = 0;
  state.configuracoes.codeOffsetY = 0;
  sincronizarDraftConfiguracoes();
  state.documentoAtual = null;
  state.cadastroSelecionadoId = null;
  selecionarDocumentos([]);
  state.lancamentoEmEdicaoId = null;
  state.numeroDocumentoAtual = "";

  salvarStorage();
  renderCadastros();
  renderHome();
  renderLancamentos();
  mostrarListaLancamentos();
  preencherFormularioLancamento();
  aplicarConfiguracoesDocumento();
  atualizarEstadoPreview({ loading: false, success: false, documento: false });
  mostrarToast("Sistema resetado com sucesso. A numeracao voltou ao inicio.", "success");
}



// =========================
// Workspace, preview e persistencia de documentos
// =========================

function atualizarEstadoPreview({ loading, success, documento }) {
  document.getElementById("previewLoading").hidden = !loading;
  document.getElementById("previewSuccess").hidden = true;
  document.getElementById("documentoPreviewArea").hidden = !documento;
  document.getElementById("documentoEmptyState").hidden = loading || success || documento;
}

function integrarLancamentosNaAbaDocumento() {
  const host = document.getElementById("documentoFormHost");
  const form = document.getElementById("lancamentoForm");
  const preview = document.getElementById("documentoPreviewArea");
  const loading = document.getElementById("previewLoading");
  const workspaceFormHost = document.getElementById("workspaceFormHost");
  const workspacePreviewHost = document.getElementById("workspacePreviewHost");
  const painelLancamento = document.querySelector('[data-tab-panel="lancamento"]');
  const listaLancamentos = document.getElementById("lancamentoListView");

  if (host) {
    host.hidden = true;
  }

  if (workspaceFormHost && form && form.parentElement !== workspaceFormHost) {
    workspaceFormHost.appendChild(form);
  }

  if (workspacePreviewHost && loading && loading.parentElement !== workspacePreviewHost) {
    workspacePreviewHost.appendChild(loading);
  }

  if (workspacePreviewHost && preview && preview.parentElement !== workspacePreviewHost) {
    workspacePreviewHost.appendChild(preview);
  }

  if (listaLancamentos) {
    listaLancamentos.hidden = true;
  }

  if (painelLancamento) {
    painelLancamento.hidden = true;
  }
}

function focarPreviewDocumento() {
  const corpo = document.querySelector(".documento-workspace-body");
  if (!corpo) {
    return;
  }

  corpo.scrollTo({ top: 0, behavior: "smooth" });
}

function sincronizarWorkspaceDocumento() {
  const modal = document.getElementById("documentoWorkspaceModal");
  const card = document.querySelector(".documento-workspace-card");
  const form = document.getElementById("lancamentoForm");
  const preview = document.getElementById("documentoPreviewArea");
  const loading = document.getElementById("previewLoading");
  const nav = document.getElementById("workspaceFormNav");
  const editMap = document.getElementById("workspacePreviewEditMap");
  const title = document.getElementById("workspaceModalTitle");
  const kicker = document.getElementById("workspaceModalKicker");
  const prevButton = document.querySelector('[data-workspace-action="prev-step"]');
  const nextButton = document.querySelector('[data-workspace-action="next-step"]');

  if (!modal || !card || !form || !preview || !loading || !nav || !editMap || !title || !kicker || !prevButton || !nextButton) {
    return;
  }

  modal.hidden = !state.workspace.open;
  if (!state.workspace.open) {
    return;
  }

  const emFormulario = state.workspace.mode === "form";
  card.classList.toggle("is-preview", !emFormulario);
  form.hidden = !emFormulario;
  preview.hidden = emFormulario;
  loading.hidden = true;
  nav.hidden = !emFormulario;
  editMap.hidden = emFormulario;

  document.querySelectorAll("[data-workspace-step-panel]").forEach((painel) => {
    painel.classList.toggle("is-active", emFormulario && painel.dataset.workspaceStepPanel === String(state.workspace.step));
  });

  document.querySelectorAll("[data-workspace-step]").forEach((botao) => {
    botao.classList.toggle("is-active", emFormulario && botao.dataset.workspaceStep === String(state.workspace.step));
    botao.disabled = !emFormulario;
  });

  prevButton.disabled = !emFormulario || state.workspace.step === 0;
  nextButton.textContent = emFormulario && state.workspace.step === 5 ? "Gerar documento" : "Proximo";

  if (emFormulario) {
    kicker.textContent = state.lancamentoEmEdicaoId ? "Edicao" : "Novo documento";
    title.textContent = state.lancamentoEmEdicaoId ? "Editar documento" : "Novo documento";
  } else {
    kicker.textContent = "Documento";
    title.textContent = "Visualizacao da OPF";
  }
}

function abrirWorkspaceDocumento({ mode = "form", step = 0, title, kicker } = {}) {
  state.workspace.open = true;
  state.workspace.mode = mode;
  state.workspace.step = Math.max(0, Math.min(5, step));
  sincronizarWorkspaceDocumento();

  const titleNode = document.getElementById("workspaceModalTitle");
  const kickerNode = document.getElementById("workspaceModalKicker");
  if (titleNode && title) {
    titleNode.textContent = title;
  }
  if (kickerNode && kicker) {
    kickerNode.textContent = kicker;
  }

  document.querySelector(".documento-workspace-body")?.scrollTo({ top: 0, behavior: "smooth" });
}

function fecharWorkspaceDocumento() {
  state.workspace.open = false;
  sincronizarWorkspaceDocumento();
}

function irParaStepWorkspace(step) {
  state.workspace.open = true;
  state.workspace.mode = "form";
  state.workspace.step = Math.max(0, Math.min(5, step));
  sincronizarWorkspaceDocumento();
  document.querySelector(".documento-workspace-body")?.scrollTo({ top: 0, behavior: "smooth" });
}

function alternarAba(tab) {
  if (tab === "configuracoes") {
    abrirModalConfiguracoes();
    return;
  }

  document.querySelectorAll(".tab-link").forEach((botao) => {
    botao.classList.toggle("is-active", botao.dataset.tabTarget === tab);
  });

  document.querySelectorAll(".tab-panel").forEach((painel) => {
    painel.classList.toggle("is-active", painel.dataset.tabPanel === tab);
  });

  if (tab === "documento") {
    const possuiDocumento = Boolean(state.documentoAtual);
    document.getElementById("documentoEmptyState").hidden = possuiDocumento;
    if (!possuiDocumento) {
      atualizarEstadoPreview({ loading: false, success: false, documento: false });
    }
  }
}

function popularPreview(documento) {
  state.documentoAtual = documento;

  document.getElementById("previewNumeroDocumento").textContent = documento.numeroDocumento;
  document.getElementById("previewEmitenteNome").textContent = documento.emitente?.nome || document.getElementById("emitenteSelect").value || "-";
  document.getElementById("previewEmitenteCnpj").textContent = formatarDocumento(documento.emitente?.cnpj);
  document.getElementById("previewEmitenteIe").textContent = documento.emitente?.ie || "-";
  document.getElementById("previewEmitenteEndereco").textContent = obterEnderecoFormatado(documento.emitente);
  document.getElementById("previewDataDocumento").textContent = documento.dataDocumento;
  document.getElementById("previewHoraDocumento").textContent = documento.horaDocumento;
  document.getElementById("previewEmitenteResumo").textContent = documento.emitente?.nome || document.getElementById("emitenteSelect").value || "-";
  document.getElementById("previewEmitenteResumoDoc").textContent = documento.emitente?.cnpj ? `CNPJ ${documento.emitente.cnpj} | -` : "-";
  document.getElementById("previewMesReferencia").textContent = documento.mesReferencia;
  document.getElementById("previewFornecedorNome").textContent = documento.fornecedor?.nome || document.getElementById("fornecedorSelect").value || "-";
  document.getElementById("previewFornecedorDocumento").textContent = formatarDocumento(documento.fornecedor?.documento);
  document.getElementById("previewFornecedorEndereco").textContent = obterEnderecoFormatado(documento.fornecedor);
  document.getElementById("previewFornecedorContato").textContent = "-";
  document.getElementById("previewFormaPagamento").textContent = documento.formaPagamento;
  const previewPaymentDetails = document.getElementById("previewPaymentDetails");
  const possuiPix = documento.formaPagamento === "PIX" && documento.pixKey;
  const possuiInstrucoesPagamento = Boolean(documento.paymentNotes);
  if (previewPaymentDetails) {
    const linhas = [];
    if (possuiPix) {
      linhas.push(`<p class="sheet-payment-line sheet-pix-key">CHAVE PIX${documento.pixKeyType ? ` (${documento.pixKeyType})` : ""}: ${documento.pixKey}</p>`);
    }
    if (possuiInstrucoesPagamento) {
      linhas.push(`<p class="sheet-payment-line sheet-payment-notes">INSTRUÇÕES: ${documento.paymentNotes}</p>`);
    }
    previewPaymentDetails.innerHTML = linhas.join("");
  }
  document.getElementById("previewVencimento").textContent = documento.vencimento;
  document.getElementById("previewNatureza").textContent = documento.natureza;
  document.getElementById("previewTipoOperacao").textContent = documento.tipoOperacao;
  document.getElementById("previewCentroResultado").textContent = documento.centroResultado;
  document.getElementById("previewFiscalMarcacao").classList.toggle("is-checked", documento.fiscal);
  document.getElementById("previewContabilMarcacao").classList.toggle("is-checked", documento.contabil);
  document.getElementById("previewNotaFiscal").textContent = documento.notaFiscal;
  document.getElementById("previewDataFiscal").textContent = documento.dataFiscal;
  document.getElementById("previewSubtotal").textContent = formatarMoeda(documento.subtotal);
  document.getElementById("previewDesconto").textContent = formatarMoeda(documento.desconto);
  document.getElementById("previewAcrescimo").textContent = formatarMoeda(documento.acrescimo);
  document.getElementById("previewTotalDocumento").textContent = formatarMoeda(documento.total);
  document.getElementById("previewSolicitante").textContent = documento.solicitante;
  document.getElementById("previewSolicitanteMeta").textContent = documento.solicitanteSetor;
  document.getElementById("previewAutorizador").textContent = documento.autorizador;
  document.getElementById("previewAutorizadorMeta").textContent = documento.autorizadorCargo;
  document.getElementById("previewObservacoes").textContent = `${documento.observacoes} Documento vinculado ao ${documento.numeroDocumento}.`;

  document.getElementById("previewItensBody").innerHTML = documento.itens.map((item) => `
    <tr>
      <td>${item.codigo}</td>
      <td>${item.descricao}</td>
      <td class="center">${item.quantidade}</td>
      <td class="num">${formatarMoeda(item.unitario)}</td>
      <td class="num">${formatarMoeda(item.total)}</td>
    </tr>
  `).join("");
}

function abrirPreviewComLoading() {
  const documento = coletarDocumentoAtual();
  if (!documento) {
    return;
  }

  alternarAba("documento");
  atualizarEstadoPreview({ loading: true, success: false, documento: false });

  window.setTimeout(() => {
    popularPreview(documento);
    salvarDocumentoAtual();
    atualizarEstadoPreview({ loading: false, success: false, documento: true });
    abrirWorkspaceDocumento({
      mode: "preview",
      title: "Visualizacao da OPF",
      kicker: "Documento"
    });
    focarPreviewDocumento();
    abrirConfirmacao({
      titulo: "Documento gerado com sucesso",
      texto: "Deseja imprimir agora?",
      confirmLabel: "Sim, imprimir",
      cancelLabel: "Agora não",
      onConfirm: () => imprimirDocumentoAtual()
    });
  }, 180);
}

function upsertDocumento(documento) {
  if (!documento) {
    return;
  }

  const indice = state.documentos.findIndex((item) => item.id === documento.id);
    if (indice >= 0) {
      state.documentos[indice] = documento;
    } else {
      reservarNumeroDocumento(documento.numeroDocumento);
      state.documentos.unshift(documento);
    }
  
    selecionarDocumentos([documento.id], documento.id);
    const salvo = salvarStorage();
  if (!salvo) {
    mostrarToast("Documento atualizado na sessão, mas o backup local não foi salvo.", "info");
  }
  renderHome();
  renderLancamentos();
  renderRelatorios();
}

function salvarDocumentoAtual() {
  if (!state.documentoAtual) {
    return;
  }

  upsertDocumento(state.documentoAtual);
}



// =========================
// Eventos e bootstrap
// =========================

function registrarEventos() {
  const globalSearchInput = document.getElementById("globalModuleSearch");
  globalSearchInput?.addEventListener("focus", () => {
    if (globalSearchInput.value.trim()) {
      renderizarBuscaGlobal(globalSearchInput.value);
    }
  });
  globalSearchInput?.addEventListener("input", (event) => renderizarBuscaGlobal(event.currentTarget.value));
  globalSearchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      fecharBuscaGlobal();
      return;
    }

    if (event.key === "Enter") {
      const primeiro = filtrarModulosGlobais(event.currentTarget.value)[0];
      if (primeiro) {
        window.location.href = primeiro.url;
      }
    }
  });

  document.querySelectorAll(".tab-link").forEach((botao) => {
    botao.addEventListener("click", () => {
      alternarAba(botao.dataset.tabTarget);
    });
  });

  document.getElementById("cadastroModalForm").addEventListener("submit", (event) => {
    event.preventDefault();
    salvarCadastroModal(event.currentTarget);
  });

  document.getElementById("cadastroSearch").addEventListener("input", renderCadastros);
  document.getElementById("documentoSearchInput")?.addEventListener("input", renderHome);
  document.getElementById("documentoDateStart")?.addEventListener("change", renderHome);
  document.getElementById("documentoDateEnd")?.addEventListener("change", renderHome);
  document.getElementById("documentoMonthReference")?.addEventListener("input", renderHome);
  document.getElementById("documentoFilterType")?.addEventListener("change", (event) => {
    state.documentoFilterType = event.currentTarget.value || "vencimento";
    sincronizarFiltrosDocumento();
    renderHome();
  });
  document.getElementById("documentoClearFilters")?.addEventListener("click", () => {
    const search = document.getElementById("documentoSearchInput");
    const start = document.getElementById("documentoDateStart");
    const end = document.getElementById("documentoDateEnd");
    const month = document.getElementById("documentoMonthReference");
    if (search) {
      search.value = "";
    }
    if (start) {
      start.value = "";
    }
    if (end) {
      end.value = "";
    }
    if (month) {
      month.value = "";
    }
    state.documentoFilterType = "vencimento";
    sincronizarFiltrosDocumento();
    renderHome();
  });

  document.addEventListener("click", (event) => {
    const alvo = event.target;
    const botaoAbrirConfiguracoes = alvo.closest("[data-open-config]");
    const botaoFecharConfiguracoes = alvo.closest("[data-config-modal-close]");
    const botaoTrocarConfigView = alvo.closest("[data-config-view]");
    const botaoNovoLancamento = alvo.closest('[data-lancamento-action="novo"]');
    const botaoEditarLancamento = alvo.closest('[data-lancamento-action="editar"]');
    const botaoAbrirDocumento = alvo.closest('[data-lancamento-action="abrir-documento"]');
    const botaoExcluirLancamento = alvo.closest('[data-lancamento-action="excluir"]');
    const botaoVoltarLista = alvo.closest('[data-lancamento-action="voltar-lista"]');
    const botaoAdicionarItem = alvo.closest('[data-action="adicionar-item"]');
    const botaoGerarDocumento = alvo.closest('[data-action="gerar-documento"]');
    const botaoEditarDocumento = alvo.closest('[data-action="editar-documento"]');
    const botaoImprimirDocumento = alvo.closest('[data-action="imprimir-documento"]');
    const botaoExcluirDocumento = alvo.closest('[data-action="excluir-documento"]');
    const botaoVerDocumentoToolbar = alvo.closest('[data-document-toolbar-action="ver"]');
    const botaoEditarDocumentoToolbar = alvo.closest('[data-document-toolbar-action="editar"]');
    const botaoImprimirDocumentoToolbar = alvo.closest('[data-document-toolbar-action="imprimir"]');
    const botaoExcluirDocumentoToolbar = alvo.closest('[data-document-toolbar-action="excluir"]');
      const botaoFecharWorkspace = alvo.closest('[data-workspace-action="close"]');
      const botaoPrevWorkspace = alvo.closest('[data-workspace-action="prev-step"]');
      const botaoNextWorkspace = alvo.closest('[data-workspace-action="next-step"]');
      const botaoStepWorkspace = alvo.closest('[data-workspace-step]');
      const botaoEditarEtapaWorkspace = alvo.closest('[data-workspace-edit-step]');
      const botaoToggleBuscaDocumento = alvo.closest("#documentoSearchToggle");
      const botaoToggleFiltroDocumento = alvo.closest("#documentoFilterToggle");
      const botaoRemoverLogo = alvo.closest('[data-config-action="remover-logo"]');
      const botaoMoverLogoCima = alvo.closest('[data-config-action="logo-up"]');
      const botaoMoverLogoBaixo = alvo.closest('[data-config-action="logo-down"]');
      const botaoMoverLogoEsquerda = alvo.closest('[data-config-action="logo-left"]');
      const botaoMoverLogoDireita = alvo.closest('[data-config-action="logo-right"]');

      if (!alvo.closest("#globalSearchWrap")) {
        fecharBuscaGlobal();
      }

      if (!alvo.closest(".documento-toolbar-popover-wrap")) {
        state.documentoSearchOpen = false;
        state.documentoFilterOpen = false;
        sincronizarFiltrosDocumento();
      }

      if (botaoToggleBuscaDocumento) {
        state.documentoSearchOpen = !state.documentoSearchOpen;
        state.documentoFilterOpen = false;
        sincronizarFiltrosDocumento();
        if (state.documentoSearchOpen) {
          window.setTimeout(() => document.getElementById("documentoSearchInput")?.focus(), 0);
        }
        return;
      }

      if (botaoToggleFiltroDocumento) {
        state.documentoFilterOpen = !state.documentoFilterOpen;
        state.documentoSearchOpen = false;
        sincronizarFiltrosDocumento();
        if (state.documentoFilterOpen) {
          window.setTimeout(() => document.getElementById("documentoFilterType")?.focus(), 0);
        }
        return;
      }

    if (botaoAbrirConfiguracoes) {
      abrirModalConfiguracoes();
      return;
    }

    if (botaoFecharConfiguracoes || alvo.id === "configModal") {
      fecharModalConfiguracoes();
      return;
    }

    if (botaoTrocarConfigView) {
      alternarViewConfiguracoes(botaoTrocarConfigView.dataset.configView);
      return;
    }

    if (botaoFecharWorkspace) {
      if (state.workspace.mode === "form") {
        abrirModalFechamentoFormulario();
      } else {
        fecharWorkspaceDocumento();
      }
      return;
    }

    if (botaoPrevWorkspace) {
      irParaStepWorkspace(state.workspace.step - 1);
      return;
    }

    if (botaoNextWorkspace) {
      if (state.workspace.step >= 5) {
        abrirPreviewComLoading();
      } else {
        irParaStepWorkspace(state.workspace.step + 1);
      }
      return;
    }

    if (botaoStepWorkspace) {
      irParaStepWorkspace(Number(botaoStepWorkspace.dataset.workspaceStep || 0));
      return;
    }

    if (botaoEditarEtapaWorkspace) {
      irParaStepWorkspace(Number(botaoEditarEtapaWorkspace.dataset.workspaceEditStep || 0));
      return;
    }

    if (alvo.matches(".cadastro-tab")) {
      state.cadastroView = alvo.dataset.cadastroView;
      state.cadastroSelecionadoId = null;
      document.getElementById("cadastroSearch").value = "";
      renderCadastros();
      return;
    }

    if (alvo.closest("[data-select-cadastro]")) {
      state.cadastroSelecionadoId = alvo.closest("[data-select-cadastro]").dataset.selectCadastro;
      renderCadastros();
      return;
    }

    if (alvo.matches('[data-cadastro-action="novo"]')) {
      abrirModalCadastro("novo");
      return;
    }

    if (alvo.matches('[data-cadastro-action="editar"]')) {
      if (obterCadastroSelecionado()) {
        abrirModalCadastro("editar");
      }
      return;
    }

    if (alvo.matches('[data-cadastro-action="excluir"]')) {
      const item = obterCadastroSelecionado();
      if (item) {
        abrirConfirmacao({
          titulo: "Excluir cadastro",
          texto: "Tem certeza que deseja excluir este cadastro?",
          onConfirm: () => removerCadastro(item.grupo || state.cadastroView, item.id)
        });
      }
      return;
    }

    if (alvo.matches("[data-close-modal]") || alvo.id === "cadastroModal") {
      fecharModalCadastro();
      return;
    }

    if (alvo.matches('[data-confirm-action="cancelar"]') || alvo.id === "confirmModal") {
      fecharConfirmacao();
      return;
    }

    if (alvo.matches('[data-confirm-action="confirmar"]')) {
      const action = state.confirmAction;
      fecharConfirmacao();
      if (action) {
        action();
      }
      return;
    }

    if (alvo.matches('[data-close-form-action="cancelar"]') || alvo.id === "closeFormModal") {
      fecharModalFechamentoFormulario();
      return;
    }

    if (alvo.matches('[data-close-form-action="salvar"]')) {
      salvarRascunhoEFecharFormulario();
      return;
    }

    if (alvo.matches('[data-close-form-action="descartar"]')) {
      fecharFormularioSemSalvar();
      return;
    }

    if (alvo.closest("[data-select-lancamento]")) {
      state.lancamentoSelecionadoId = alvo.closest("[data-select-lancamento]").dataset.selectLancamento;
      renderLancamentos();
      return;
    }

    if (alvo.closest("[data-select-document]")) {
      if (alvo.closest("button")) {
        return;
      }
      selecionarDocumentoLinha(alvo.closest("[data-select-document]").dataset.selectDocument, {
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey
      });
      renderHome();
      return;
    }

    if (botaoNovoLancamento) {
      selecionarDocumentos([]);
      alternarAba("documento");
      mostrarFormularioLancamento();
      return;
    }

    if (botaoEditarLancamento) {
      const item = state.documentos.find((doc) => doc.id === state.lancamentoSelecionadoId);
      if (item) {
        alternarAba("documento");
        mostrarFormularioLancamento(item);
      }
      return;
    }

    if (botaoAbrirDocumento) {
      const item = state.documentos.find((doc) => doc.id === state.lancamentoSelecionadoId);
      if (item) {
        state.documentoAtual = item;
        popularPreview(item);
        atualizarEstadoPreview({ loading: false, success: true, documento: true });
        alternarAba("documento");
      }
      return;
    }

    if (botaoExcluirLancamento) {
      if (state.lancamentoSelecionadoId) {
        abrirConfirmacao({
          titulo: "Excluir lancamento",
          texto: "Tem certeza que deseja excluir este lancamento?",
          onConfirm: () => removerLancamento(state.lancamentoSelecionadoId)
        });
      }
      return;
    }

    if (botaoVoltarLista) {
      abrirModalFechamentoFormulario();
      return;
    }

    if (botaoAdicionarItem) {
      criarItemLinha();
      configurarTodosMoneyInputs();
      atualizarResumo();
      return;
    }

    if (alvo.matches(".remove-item-btn")) {
      const tbody = document.getElementById("lancamentoItensBody");
      if (tbody.children.length > 1) {
        alvo.closest("tr").remove();
        atualizarResumo();
      }
      return;
    }

    if (botaoGerarDocumento) {
      abrirPreviewComLoading();
      return;
    }

    if (botaoEditarDocumento) {
      atualizarEstadoPreview({ loading: false, success: false, documento: true });
      alternarAba("documento");
      mostrarFormularioLancamento(state.documentoAtual);
      return;
    }

    if (botaoImprimirDocumento) {
      imprimirDocumentoAtual();
      return;
    }

    if (botaoExcluirDocumento) {
      if (state.documentoAtual?.id) {
        abrirConfirmacao({
          titulo: "Excluir documento",
          texto: "Tem certeza que deseja excluir esta OPF?",
          onConfirm: () => removerLancamento(state.documentoAtual.id)
        });
      }
      return;
    }

    if (botaoVerDocumentoToolbar) {
      abrirDocumentoSelecionado();
      return;
    }

    if (botaoEditarDocumentoToolbar) {
      editarDocumentoSelecionado();
      return;
    }

    if (botaoImprimirDocumentoToolbar) {
      imprimirDocumentoAtual();
      return;
    }

    if (botaoExcluirDocumentoToolbar) {
      const documentos = obterDocumentosSelecionados();
      if (!documentos.length) {
        mostrarToast("Selecione uma OPF na tabela para excluir.", "info");
        return;
      }

      abrirConfirmacao({
        titulo: documentos.length > 1 ? "Excluir documentos" : "Excluir documento",
        texto: documentos.length > 1
          ? `Tem certeza que deseja excluir ${documentos.length} OPFs selecionadas?`
          : "Tem certeza que deseja excluir esta OPF?",
        onConfirm: () => removerDocumentos(documentos.map((item) => item.id))
      });
      return;
    }

    if (alvo.closest("[data-document-sort]")) {
      const botao = alvo.closest("[data-document-sort]");
      const key = botao.dataset.documentSort;
      if (state.documentoSort.key === key) {
        state.documentoSort.direction = state.documentoSort.direction === "asc" ? "desc" : "asc";
      } else {
        state.documentoSort.key = key;
        state.documentoSort.direction = key === "numeroDocumento" || key === "vencimento" || key === "total" ? "desc" : "asc";
      }
      renderHome();
      return;
    }

    if (alvo.matches('[data-config-action="exportar-backup"]')) {
      exportarBackupDados();
      return;
    }

    if (alvo.matches('[data-config-action="baixar-modelo"]')) {
      baixarModeloImportacao();
      return;
    }

    if (alvo.matches('[data-config-action="importar-dados"]')) {
      document.getElementById("importFileInput").click();
      return;
    }

    if (alvo.matches('[data-config-action="upload-logo"]')) {
      document.getElementById("logoFileInput").click();
      return;
    }

    if (alvo.matches('[data-config-action="salvar-aparencia"]')) {
      salvarConfiguracoesDocumento();
      return;
    }

    if (alvo.matches("[data-config-target]")) {
      state.configTarget = alvo.dataset.configTarget;
      aplicarConfiguracoesDocumento();
      return;
    }

    if (botaoRemoverLogo) {
      state.configuracoesDraft.logoDataUrl = "";
      aplicarConfiguracoesDocumento();
      mostrarToast("Logo removido da prévia. Clique em salvar para confirmar.", "info");
      return;
    }

    if (alvo.closest("[data-config-preview-target]")) {
      state.configTarget = alvo.closest("[data-config-preview-target]").dataset.configPreviewTarget;
      aplicarConfiguracoesDocumento();
      return;
    }

    if (botaoMoverLogoCima) {
      const mapa = obterMapaConfigTarget()[state.configTarget] || obterMapaConfigTarget().logo;
      state.configuracoesDraft[mapa.offsetY] = Number(state.configuracoesDraft[mapa.offsetY] || 0) - 2;
      aplicarConfiguracoesDocumento();
      return;
    }

    if (botaoMoverLogoBaixo) {
      const mapa = obterMapaConfigTarget()[state.configTarget] || obterMapaConfigTarget().logo;
      state.configuracoesDraft[mapa.offsetY] = Number(state.configuracoesDraft[mapa.offsetY] || 0) + 2;
      aplicarConfiguracoesDocumento();
      return;
    }

    if (botaoMoverLogoEsquerda) {
      const mapa = obterMapaConfigTarget()[state.configTarget] || obterMapaConfigTarget().logo;
      state.configuracoesDraft[mapa.offsetX] = Number(state.configuracoesDraft[mapa.offsetX] || 0) - 2;
      aplicarConfiguracoesDocumento();
      return;
    }

    if (botaoMoverLogoDireita) {
      const mapa = obterMapaConfigTarget()[state.configTarget] || obterMapaConfigTarget().logo;
      state.configuracoesDraft[mapa.offsetX] = Number(state.configuracoesDraft[mapa.offsetX] || 0) + 2;
      aplicarConfiguracoesDocumento();
      return;
    }

      if (alvo.matches('[data-config-action="resetar-sistema"]')) {
      abrirConfirmacao({
        titulo: "Resetar sistema",
        texto: "Isso vai apagar todos os dados salvos e reiniciar a numeracao da OPF. Deseja continuar?",
        onConfirm: () => resetarSistema()
      });
    }
  });

  document.getElementById("lancamentoItensBody").addEventListener("input", (event) => {
    if (event.target.matches(".item-qtd")) {
      atualizarResumo();
    }
  });

  document.querySelectorAll("#lancamentoForm input, #lancamentoForm textarea, #lancamentoForm select").forEach((campo) => {
    if (!campo.classList.contains("money-input")) {
      campo.addEventListener("change", atualizarResumo);
    }
  });

  document.getElementById("formaPagamentoSelect")?.addEventListener("change", () => {
    sincronizarCamposPix();
    atualizarResumo();
  });

  document.getElementById("pixKeyTypeSelect")?.addEventListener("change", () => {
    aplicarMascaraPix();
    validarCamposPix({ silent: true });
  });

  document.getElementById("pixKeyInput")?.addEventListener("input", () => {
    aplicarMascaraPix();
    validarCamposPix({ silent: true });
  });

  document.getElementById("darkModeToggle")?.addEventListener("change", (event) => {
    aplicarTema(event.currentTarget.checked ? "dark" : "light");
    mostrarToast(`Tema ${event.currentTarget.checked ? "escuro" : "claro"} ativado.`, "success");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.configModalOpen) {
      fecharModalConfiguracoes();
    }
  });

  document.getElementById("importFileInput")?.addEventListener("change", (event) => {
    const file = event.currentTarget.files?.[0];
    importarArquivoDados(file);
    event.currentTarget.value = "";
  });

  document.getElementById("logoFileInput")?.addEventListener("change", (event) => {
    const file = event.currentTarget.files?.[0];
    prepararLogoDraft(file);
    event.currentTarget.value = "";
  });

  const logoDropzone = document.getElementById("logoDropzone");
  if (logoDropzone) {
    ["dragenter", "dragover"].forEach((tipo) => {
      logoDropzone.addEventListener(tipo, (event) => {
        event.preventDefault();
        logoDropzone.classList.add("is-dragover");
      });
    });

    ["dragleave", "drop"].forEach((tipo) => {
      logoDropzone.addEventListener(tipo, (event) => {
        event.preventDefault();
        logoDropzone.classList.remove("is-dragover");
      });
    });

    logoDropzone.addEventListener("drop", (event) => {
      const file = event.dataTransfer?.files?.[0];
      prepararLogoDraft(file);
    });
  }

  document.getElementById("logoScaleInput")?.addEventListener("input", (event) => {
    const mapa = obterMapaConfigTarget()[state.configTarget] || obterMapaConfigTarget().logo;
    state.configuracoesDraft[mapa.scale] = Number(event.currentTarget.value || 100);
    aplicarConfiguracoesDocumento();
  });

  document.getElementById("configTitleTextInput")?.addEventListener("input", (event) => {
    state.configuracoesDraft.titleText = String(event.currentTarget.value || "").trim() || "ORDEM DE PAGAMENTO FINANCEIRO";
    state.configTarget = "titulo";
    aplicarConfiguracoesDocumento();
  });

  const resizer = document.getElementById("configLogoResizer");
  if (resizer) {
    let dragging = false;
    const onMove = (event) => {
      if (!dragging) {
        return;
      }
      const header = document.querySelector(".config-document-top");
      if (!header) {
        return;
      }
      const rect = header.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const proximo = Math.max(96, Math.min(280, Math.round(x)));
      state.configTarget = "logo";
      state.configuracoesDraft.logoWidth = proximo;
      aplicarConfiguracoesDocumento();
    };
    const onUp = () => {
      dragging = false;
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    resizer.addEventListener("pointerdown", (event) => {
      dragging = true;
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      event.preventDefault();
    });
  }

  configurarExclusividadeCheckbox();
  sincronizarCamposPix();
}



function iniciarFormulario() {
  mostrarListaLancamentos();
  preencherFormularioLancamento();
  garantirLinhaInicial();
  mostrarListaLancamentos();
}

window.addEventListener("load", () => {
  carregarStorage();
  aplicarTema(localStorage.getItem(THEME_KEY) || "light");
  sincronizarDraftConfiguracoes();
  aplicarConfiguracoesDocumento();
  sincronizarFiltrosDocumento();
  sincronizarModalConfiguracoes();
  integrarLancamentosNaAbaDocumento();
  sincronizarWorkspaceDocumento();
  conectarLancamentos({ renderLancamentos, atualizarEstadoPreview });
  renderCadastros();
  renderHome();
  renderLancamentos();
  renderRelatorios();
  iniciarFormulario();
  registrarEventos();
  atualizarEstadoPreview({ loading: false, success: false, documento: false });
});
