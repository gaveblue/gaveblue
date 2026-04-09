import { state, salvarStorage } from "./state.js";
import {
  formatarDataBr,
  formatarDataHoraAtual,
  formatarMoeda,
  gerarNumeroDocumento,
  obterMesReferencia,
  uid
} from "./utils.js";
import { encontrarCadastroPorTexto } from "./cadastros.js";
import { renderHome } from "./home.js";

let renderLancamentosRef = () => {};
let atualizarEstadoPreviewRef = () => {};

export function conectarLancamentos({ renderLancamentos, atualizarEstadoPreview }) {
  renderLancamentosRef = renderLancamentos;
  atualizarEstadoPreviewRef = atualizarEstadoPreview;
}

export function renderLancamentos() {
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

export function criarItemLinha(item = {}) {
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

export function garantirLinhaInicial() {
  if (!document.getElementById("lancamentoItensBody").children.length) {
    criarItemLinha();
  }
}

export function moneyInputParaCentavos(input) {
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

export function configurarTodosMoneyInputs() {
  document.querySelectorAll(".money-input").forEach((input) => {
    if (!input.dataset.bound) {
      input.dataset.bound = "1";
      configurarMoneyInput(input, Number(input.dataset.cents || 0));
    }
  });
}

export function atualizarResumo() {
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

export function preencherFormularioLancamento(documento) {
  const agora = formatarDataHoraAtual();
  const doc = documento || null;

  state.lancamentoEmEdicaoId = doc?.id || null;
  state.numeroDocumentoAtual = doc?.numeroDocumento || gerarNumeroDocumento();

  document.getElementById("launchNumeroDocumento").textContent = state.numeroDocumentoAtual;
  document.getElementById("emitenteSelect").value = doc?.emitente?.nome || "";
  document.getElementById("fornecedorSelect").value = doc?.fornecedor?.nome || "";
  document.getElementById("formaPagamentoSelect").value = doc?.formaPagamento || "PIX";
  document.getElementById("vencimentoInput").value = doc?.vencimento && doc.vencimento !== "-" ? doc.vencimento.split("/").reverse().join("-") : agora.dataIso;
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

export function mostrarListaLancamentos() {
  document.getElementById("lancamentoListView").hidden = false;
  document.getElementById("lancamentoForm").hidden = true;
}

export function mostrarFormularioLancamento(documento = null) {
  preencherFormularioLancamento(documento);
  document.getElementById("lancamentoListView").hidden = true;
  document.getElementById("lancamentoForm").hidden = false;
}

export function coletarDocumentoAtual() {
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
    mesReferencia: obterMesReferencia(document.getElementById("vencimentoInput").value || agora.dataIso),
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

export function removerLancamento(id) {
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

export function configurarExclusividadeCheckbox() {
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
