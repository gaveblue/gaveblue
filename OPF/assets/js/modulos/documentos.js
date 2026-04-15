(function carregarDocumentosOpf(global) {
  const { state } = global.OPFState;
  const {
    obterSequencialDocumento
  } = global.OPFCore;

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

  function converterDataBrParaIso(valor) {
    const texto = String(valor || "").trim();
    const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      return "";
    }

    return `${match[3]}-${match[2]}-${match[1]}`;
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

  function obterDocumentoSelecionado() {
    return state.documentos.find((item) => item.id === state.lancamentoSelecionadoId) || null;
  }

  function obterDocumentoUnicoSelecionado() {
    const selecionados = obterDocumentosSelecionados();
    return selecionados.length === 1 ? selecionados[0] : null;
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

  global.OPFDocumentos = {
    normalizarMesReferencia,
    obterDocumentosFiltrados,
    obterDocumentosSelecionados,
    normalizarSelecaoDocumentos,
    sincronizarFiltrosDocumento,
    selecionarDocumentos,
    selecionarDocumentoLinha,
    obterDocumentoSelecionado,
    obterDocumentoUnicoSelecionado,
    obterValorOrdenacaoDocumento,
    converterDataBrParaIso,
    ordenarDocumentos,
    atualizarCabecalhoOrdenacaoDocumentos
  };
})(window);
