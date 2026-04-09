import { state } from "./state.js";
import {
  abrirModalCadastro,
  fecharModalCadastro,
  obterCadastroSelecionado,
  removerCadastro,
  renderCadastros,
  salvarCadastroModal
} from "./cadastros.js";
import {
  abrirPreviewComLoading,
  alternarAba,
  atualizarEstadoPreview,
  popularPreview,
  salvarDocumentoAtual
} from "./documento.js";
import {
  atualizarResumo,
  configurarExclusividadeCheckbox,
  configurarTodosMoneyInputs,
  criarItemLinha,
  mostrarFormularioLancamento,
  mostrarListaLancamentos,
  removerLancamento,
  renderLancamentos
} from "./lancamentos.js";

export function registrarEventos() {
  document.querySelectorAll(".tab-link").forEach((botao) => {
    botao.addEventListener("click", () => alternarAba(botao.dataset.tabTarget));
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
        removerCadastro(item.grupo || state.cadastroView, item.id);
      }
      return;
    }

    if (alvo.matches("[data-close-modal]") || alvo.id === "cadastroModal") {
      fecharModalCadastro();
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

    if (alvo.matches('[data-lancamento-action="excluir"]')) {
      if (state.lancamentoSelecionadoId) {
        removerLancamento(state.lancamentoSelecionadoId);
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
      salvarDocumentoAtual();
      atualizarEstadoPreview({ loading: false, success: true, documento: true });
      window.print();
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

  configurarExclusividadeCheckbox();
}
