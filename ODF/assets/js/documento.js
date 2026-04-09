import { state, salvarStorage } from "./state.js";
import { formatarDocumento, formatarMoeda } from "./utils.js";
import { obterEnderecoFormatado } from "./cadastros.js";
import { renderHome } from "./home.js";
import { coletarDocumentoAtual, renderLancamentos } from "./lancamentos.js";

export function atualizarEstadoPreview({ loading, success, documento }) {
  document.getElementById("previewLoading").hidden = !loading;
  document.getElementById("previewSuccess").hidden = !success;
  document.getElementById("documentoPreviewArea").hidden = !documento;
  document.getElementById("documentoEmptyState").hidden = loading || success || documento;
}

export function alternarAba(tab) {
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

export function popularPreview(documento) {
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

export function abrirPreviewComLoading() {
  const documento = coletarDocumentoAtual();

  alternarAba("documento");
  atualizarEstadoPreview({ loading: true, success: false, documento: false });

  window.setTimeout(() => {
    popularPreview(documento);
    atualizarEstadoPreview({ loading: false, success: true, documento: true });
  }, 180);
}

export function salvarDocumentoAtual() {
  if (!state.documentoAtual) {
    return;
  }

  const indice = state.documentos.findIndex((item) => item.id === state.documentoAtual.id);
  if (indice >= 0) {
    state.documentos[indice] = state.documentoAtual;
  } else {
    state.documentos.unshift(state.documentoAtual);
  }

  state.lancamentoSelecionadoId = state.documentoAtual.id;
  salvarStorage();
  renderHome();
  renderLancamentos();
}
