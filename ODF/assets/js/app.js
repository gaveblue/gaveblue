const STORAGE_KEY = "opf-financeiro-data-v2";
const THEME_KEY = "opf-financeiro-theme";

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
    logoScale: 100,
    printScale: 100,
    logoOffsetX: 0,
    logoOffsetY: 0,
    titleScale: 100,
    titleOffsetX: 0,
    titleOffsetY: 0,
    codeScale: 100,
    codeOffsetX: 0,
    codeOffsetY: 0
  },
  configuracoesDraft: {
    logoDataUrl: "",
    logoScale: 100,
    printScale: 100,
    logoOffsetX: 0,
    logoOffsetY: 0,
    titleScale: 100,
    titleOffsetX: 0,
    titleOffsetY: 0,
    codeScale: 100,
    codeOffsetX: 0,
    codeOffsetY: 0
  },
  documentoAtual: null,
  configTarget: "logo",
  cadastroView: "emitentes",
  cadastroSelecionadoId: null,
  lancamentoSelecionadoId: null,
  lancamentoEmEdicaoId: null,
  numeroDocumentoAtual: "",
  confirmAction: null
};

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
    state.configuracoes.logoScale = Number(dados.logoScale || 100);
    state.configuracoes.printScale = Number(dados.printScale || 100);
    state.configuracoes.logoOffsetX = Number(dados.logoOffsetX || 0);
    state.configuracoes.logoOffsetY = Number(dados.logoOffsetY || 0);
    state.configuracoes.titleScale = Number(dados.titleScale || 100);
    state.configuracoes.titleOffsetX = Number(dados.titleOffsetX || 0);
    state.configuracoes.titleOffsetY = Number(dados.titleOffsetY || 0);
    state.configuracoes.codeScale = Number(dados.codeScale || 100);
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
      logoScale: state.configuracoes.logoScale,
      printScale: state.configuracoes.printScale,
      logoOffsetX: state.configuracoes.logoOffsetX,
      logoOffsetY: state.configuracoes.logoOffsetY,
      titleScale: state.configuracoes.titleScale,
      titleOffsetX: state.configuracoes.titleOffsetX,
      titleOffsetY: state.configuracoes.titleOffsetY,
      codeScale: state.configuracoes.codeScale,
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

  state.controle.ultimoNumeroPorAno[ano] = proximaSequencia;
  salvarStorage();

  return `OPF-${ano}${String(proximaSequencia).padStart(4, "0")}`;
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



function renderHome() {
  document.getElementById("homeTotalDocumentos").textContent = String(state.documentos.length);
  document.getElementById("homeUltimoDocumento").textContent = state.documentos[0]?.numeroDocumento || "-";

  const container = document.getElementById("documentosList");
  if (!state.documentos.length) {
    container.innerHTML = `<div class="saved-empty">Nenhum documento gerado ainda.</div>`;
    return;
  }

  container.innerHTML = state.documentos.map((doc) => `
    <div class="saved-item">
      <div>
        <strong>${doc.numeroDocumento}</strong>
        <span>${doc.emitente?.nome || "-"}</span>
        <span>${doc.fornecedor?.nome || "-"}</span>
        <span>Total: ${formatarMoeda(doc.total)}</span>
      </div>
      <button type="button" class="btn-secondary" data-open-document="${doc.id}">Ver</button>
    </div>
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
  document.getElementById("vencimentoInput").value = doc?.vencimento && doc.vencimento !== "-" ? doc.vencimento.split("/").reverse().join("-") : agora.dataIso;
  document.getElementById("mesReferenciaInput").value = doc?.mesReferencia && doc.mesReferencia !== "-" ? doc.mesReferencia : "";
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
}

function mostrarListaLancamentos() {
  document.getElementById("lancamentoListView").hidden = false;
  document.getElementById("lancamentoForm").hidden = true;
  state.lancamentoEmEdicaoId = null;
  state.numeroDocumentoAtual = "";
}

function mostrarFormularioLancamento(documento = null) {
  preencherFormularioLancamento(documento);
  document.getElementById("lancamentoListView").hidden = true;
  document.getElementById("lancamentoForm").hidden = false;
}

function coletarDocumentoAtual() {
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

  return {
    id: state.lancamentoEmEdicaoId || uid(),
    numeroDocumento: state.numeroDocumentoAtual || gerarNumeroDocumento(),
    dataDocumento: agora.dataBr,
    horaDocumento: agora.hora,
    mesReferencia: obterMesReferencia(document.getElementById("mesReferenciaInput").value.trim()),
    emitente,
    fornecedor,
    formaPagamento: document.getElementById("formaPagamentoSelect").value || "-",
    vencimento: formatarDataBr(document.getElementById("vencimentoInput").value),
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

function removerLancamento(id) {
  state.documentos = state.documentos.filter((item) => item.id !== id);

  if (state.documentoAtual?.id === id) {
    state.documentoAtual = null;
    atualizarEstadoPreviewRef({ loading: false, success: false, documento: false });
  }

  state.lancamentoSelecionadoId = null;
  salvarStorage();
  renderHome();
  renderLancamentosRef();
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

function aplicarTema(tema) {
  const temaFinal = tema === "dark" ? "dark" : "light";
  document.body.dataset.theme = temaFinal;
  localStorage.setItem(THEME_KEY, temaFinal);

  const toggle = document.getElementById("darkModeToggle");
  if (toggle) {
    toggle.checked = temaFinal === "dark";
  }
}

function obterMapaConfigTarget() {
  return {
    logo: {
      scale: "logoScale",
      offsetX: "logoOffsetX",
      offsetY: "logoOffsetY",
      label: "Tamanho do logo",
      min: 40,
      max: 320,
      step: 5
    },
    titulo: {
      scale: "titleScale",
      offsetX: "titleOffsetX",
      offsetY: "titleOffsetY",
      label: "Tamanho do título",
      min: 80,
      max: 180,
      step: 2
    },
    numero: {
      scale: "codeScale",
      offsetX: "codeOffsetX",
      offsetY: "codeOffsetY",
      label: "Tamanho do número",
      min: 80,
      max: 180,
      step: 2
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
  const printScaleInput = document.getElementById("printScaleInput");
  const configDocumentPreview = document.getElementById("configDocumentPreview");
  const configScaleLabel = document.getElementById("configScaleLabel");
  const draft = state.configuracoesDraft;
  const saved = state.configuracoes;
  const targetMap = obterMapaConfigTarget();
  const targetConfig = targetMap[state.configTarget] || targetMap.logo;

  root.style.setProperty("--logo-scale", String((saved.logoScale || 100) / 100));
  root.style.setProperty("--print-scale", String((saved.printScale || 100) / 100));
  root.style.setProperty("--logo-offset-x", `${saved.logoOffsetX || 0}px`);
  root.style.setProperty("--logo-offset-y", `${saved.logoOffsetY || 0}px`);
  root.style.setProperty("--title-scale", String((saved.titleScale || 100) / 100));
  root.style.setProperty("--title-offset-x", `${saved.titleOffsetX || 0}px`);
  root.style.setProperty("--title-offset-y", `${saved.titleOffsetY || 0}px`);
  root.style.setProperty("--code-scale", String((saved.codeScale || 100) / 100));
  root.style.setProperty("--code-offset-x", `${saved.codeOffsetX || 0}px`);
  root.style.setProperty("--code-offset-y", `${saved.codeOffsetY || 0}px`);

  if (logoScaleInput) {
    logoScaleInput.min = String(targetConfig.min);
    logoScaleInput.max = String(targetConfig.max);
    logoScaleInput.step = String(targetConfig.step);
    logoScaleInput.value = String(draft[targetConfig.scale] || 100);
  }

  if (printScaleInput) {
    printScaleInput.value = String(draft.printScale || 100);
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
    configLogoPreviewFallback.hidden = possuiLogoDraft;
  }

  if (configDocumentPreview) {
    configDocumentPreview.style.transform = `scale(${(draft.printScale || 100) / 100})`;
  }

  if (configLogoPreviewImage) {
    configLogoPreviewImage.style.transform = `translate(${draft.logoOffsetX || 0}px, ${draft.logoOffsetY || 0}px) scale(${(draft.logoScale || 100) / 100})`;
  }

  const configDocumentTitleText = document.getElementById("configDocumentTitleText");
  if (configDocumentTitleText) {
    configDocumentTitleText.style.transform = `translate(${draft.titleOffsetX || 0}px, ${draft.titleOffsetY || 0}px) scale(${(draft.titleScale || 100) / 100})`;
  }

  const configDocumentCodeContent = document.getElementById("configDocumentCodeContent");
  if (configDocumentCodeContent) {
    configDocumentCodeContent.style.transform = `translate(${draft.codeOffsetX || 0}px, ${draft.codeOffsetY || 0}px) scale(${(draft.codeScale || 100) / 100})`;
  }
}

function sincronizarDraftConfiguracoes() {
  state.configuracoesDraft.logoDataUrl = state.configuracoes.logoDataUrl || "";
  state.configuracoesDraft.logoScale = Number(state.configuracoes.logoScale || 100);
  state.configuracoesDraft.printScale = Number(state.configuracoes.printScale || 100);
  state.configuracoesDraft.logoOffsetX = Number(state.configuracoes.logoOffsetX || 0);
  state.configuracoesDraft.logoOffsetY = Number(state.configuracoes.logoOffsetY || 0);
  state.configuracoesDraft.titleScale = Number(state.configuracoes.titleScale || 100);
  state.configuracoesDraft.titleOffsetX = Number(state.configuracoes.titleOffsetX || 0);
  state.configuracoesDraft.titleOffsetY = Number(state.configuracoes.titleOffsetY || 0);
  state.configuracoesDraft.codeScale = Number(state.configuracoes.codeScale || 100);
  state.configuracoesDraft.codeOffsetX = Number(state.configuracoes.codeOffsetX || 0);
  state.configuracoesDraft.codeOffsetY = Number(state.configuracoes.codeOffsetY || 0);
}

function salvarConfiguracoesDocumento() {
  const botaoSalvar = document.querySelector('[data-config-action="salvar-aparencia"]');
  state.configuracoes.logoDataUrl = state.configuracoesDraft.logoDataUrl || "";
  state.configuracoes.logoScale = Number(state.configuracoesDraft.logoScale || 100);
  state.configuracoes.printScale = Number(state.configuracoesDraft.printScale || 100);
  state.configuracoes.logoOffsetX = Number(state.configuracoesDraft.logoOffsetX || 0);
  state.configuracoes.logoOffsetY = Number(state.configuracoesDraft.logoOffsetY || 0);
  state.configuracoes.titleScale = Number(state.configuracoesDraft.titleScale || 100);
  state.configuracoes.titleOffsetX = Number(state.configuracoesDraft.titleOffsetX || 0);
  state.configuracoes.titleOffsetY = Number(state.configuracoesDraft.titleOffsetY || 0);
  state.configuracoes.codeScale = Number(state.configuracoesDraft.codeScale || 100);
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

function imprimirDocumentoAtual() {
  if (!state.documentoAtual) {
    mostrarToast("Nenhum documento foi carregado para impressão.", "error");
    return;
  }

  salvarDocumentoAtual();
  atualizarEstadoPreview({ loading: false, success: true, documento: true });
  alternarAba("documento");
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
  state.configuracoes.logoScale = 100;
  state.configuracoes.printScale = 100;
  state.configuracoes.logoOffsetX = 0;
  state.configuracoes.logoOffsetY = 0;
  state.configuracoes.titleScale = 100;
  state.configuracoes.titleOffsetX = 0;
  state.configuracoes.titleOffsetY = 0;
  state.configuracoes.codeScale = 100;
  state.configuracoes.codeOffsetX = 0;
  state.configuracoes.codeOffsetY = 0;
  sincronizarDraftConfiguracoes();
  state.documentoAtual = null;
  state.cadastroSelecionadoId = null;
  state.lancamentoSelecionadoId = null;
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



function atualizarEstadoPreview({ loading, success, documento }) {
  document.getElementById("previewLoading").hidden = !loading;
  document.getElementById("previewSuccess").hidden = true;
  document.getElementById("documentoPreviewArea").hidden = !documento;
  document.getElementById("documentoEmptyState").hidden = loading || success || documento;
}

function alternarAba(tab) {
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

  alternarAba("documento");
  atualizarEstadoPreview({ loading: true, success: false, documento: false });

  window.setTimeout(() => {
    popularPreview(documento);
    salvarDocumentoAtual();
    atualizarEstadoPreview({ loading: false, success: false, documento: true });
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
    state.documentos.unshift(documento);
  }

  state.lancamentoSelecionadoId = documento.id;
  const salvo = salvarStorage();
  if (!salvo) {
    mostrarToast("Documento atualizado na sessão, mas o backup local não foi salvo.", "info");
  }
  renderHome();
  renderLancamentos();
}

function salvarDocumentoAtual() {
  if (!state.documentoAtual) {
    return;
  }

  upsertDocumento(state.documentoAtual);
}



function registrarEventos() {
  document.querySelectorAll(".tab-link").forEach((botao) => {
    botao.addEventListener("click", () => {
      alternarAba(botao.dataset.tabTarget);

      if (botao.dataset.tabTarget === "lancamento") {
        mostrarListaLancamentos();
      }
    });
  });

  document.getElementById("cadastroModalForm").addEventListener("submit", (event) => {
    event.preventDefault();
    salvarCadastroModal(event.currentTarget);
  });

  document.getElementById("cadastroSearch").addEventListener("input", renderCadastros);

  document.addEventListener("click", (event) => {
    const alvo = event.target;

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

    if (alvo.closest("[data-select-lancamento]")) {
      state.lancamentoSelecionadoId = alvo.closest("[data-select-lancamento]").dataset.selectLancamento;
      renderLancamentos();
      return;
    }

    if (alvo.matches('[data-lancamento-action="novo"]')) {
      state.lancamentoSelecionadoId = null;
      mostrarFormularioLancamento();
      return;
    }

    if (alvo.matches('[data-lancamento-action="editar"]')) {
      const item = state.documentos.find((doc) => doc.id === state.lancamentoSelecionadoId);
      if (item) {
        mostrarFormularioLancamento(item);
      }
      return;
    }

    if (alvo.matches('[data-lancamento-action="abrir-documento"]')) {
      const item = state.documentos.find((doc) => doc.id === state.lancamentoSelecionadoId);
      if (item) {
        state.documentoAtual = item;
        popularPreview(item);
        atualizarEstadoPreview({ loading: false, success: true, documento: true });
        alternarAba("documento");
      }
      return;
    }

    if (alvo.matches('[data-lancamento-action="excluir"]')) {
      if (state.lancamentoSelecionadoId) {
        abrirConfirmacao({
          titulo: "Excluir lancamento",
          texto: "Tem certeza que deseja excluir este lancamento?",
          onConfirm: () => removerLancamento(state.lancamentoSelecionadoId)
        });
      }
      return;
    }

    if (alvo.matches('[data-lancamento-action="voltar-lista"]')) {
      mostrarListaLancamentos();
      return;
    }

    if (alvo.matches('[data-action="adicionar-item"]')) {
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

    if (alvo.matches('[data-action="gerar-documento"]')) {
      abrirPreviewComLoading();
      return;
    }

    if (alvo.matches('[data-action="editar-documento"]')) {
      atualizarEstadoPreview({ loading: false, success: false, documento: true });
      alternarAba("lancamento");
      mostrarFormularioLancamento(state.documentoAtual);
      return;
    }

    if (alvo.matches('[data-action="imprimir-documento"]')) {
      imprimirDocumentoAtual();
      return;
    }

    if (alvo.matches("[data-open-document]")) {
      const documento = state.documentos.find((item) => item.id === alvo.dataset.openDocument);
      if (documento) {
        state.lancamentoSelecionadoId = documento.id;
        popularPreview(documento);
        atualizarEstadoPreview({ loading: false, success: true, documento: true });
        alternarAba("documento");
      }
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

    if (alvo.closest("[data-config-preview-target]")) {
      state.configTarget = alvo.closest("[data-config-preview-target]").dataset.configPreviewTarget;
      aplicarConfiguracoesDocumento();
      return;
    }

    if (alvo.matches('[data-config-action="logo-up"]')) {
      const mapa = obterMapaConfigTarget()[state.configTarget] || obterMapaConfigTarget().logo;
      state.configuracoesDraft[mapa.offsetY] = Number(state.configuracoesDraft[mapa.offsetY] || 0) - 2;
      aplicarConfiguracoesDocumento();
      return;
    }

    if (alvo.matches('[data-config-action="logo-down"]')) {
      const mapa = obterMapaConfigTarget()[state.configTarget] || obterMapaConfigTarget().logo;
      state.configuracoesDraft[mapa.offsetY] = Number(state.configuracoesDraft[mapa.offsetY] || 0) + 2;
      aplicarConfiguracoesDocumento();
      return;
    }

    if (alvo.matches('[data-config-action="logo-left"]')) {
      const mapa = obterMapaConfigTarget()[state.configTarget] || obterMapaConfigTarget().logo;
      state.configuracoesDraft[mapa.offsetX] = Number(state.configuracoesDraft[mapa.offsetX] || 0) - 2;
      aplicarConfiguracoesDocumento();
      return;
    }

    if (alvo.matches('[data-config-action="logo-right"]')) {
      const mapa = obterMapaConfigTarget()[state.configTarget] || obterMapaConfigTarget().logo;
      state.configuracoesDraft[mapa.offsetX] = Number(state.configuracoesDraft[mapa.offsetX] || 0) + 2;
      aplicarConfiguracoesDocumento();
      return;
    }

    if (alvo.matches('[data-config-action="remover-logo"]')) {
      state.configuracoesDraft.logoDataUrl = "";
      aplicarConfiguracoesDocumento();
      mostrarToast("Logo removido da prévia. Clique em salvar para confirmar.", "info");
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

  document.getElementById("darkModeToggle")?.addEventListener("change", (event) => {
    aplicarTema(event.currentTarget.checked ? "dark" : "light");
    mostrarToast(`Tema ${event.currentTarget.checked ? "escuro" : "claro"} ativado.`, "success");
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

  document.getElementById("printScaleInput")?.addEventListener("input", (event) => {
    state.configuracoesDraft.printScale = Number(event.currentTarget.value || 100);
    aplicarConfiguracoesDocumento();
  });

  configurarExclusividadeCheckbox();
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
  conectarLancamentos({ renderLancamentos, atualizarEstadoPreview });
  renderCadastros();
  renderHome();
  renderLancamentos();
  iniciarFormulario();
  registrarEventos();
  atualizarEstadoPreview({ loading: false, success: false, documento: false });
});

