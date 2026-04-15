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
  popularPreview
} from "./documento.js";
import {
  aplicarConfiguracoesDocumento,
  aplicarTema,
  baixarModeloImportacao,
  exportarBackupDados,
  importarArquivoDados,
  moverElementoConfiguracao,
  obterMapaConfigTarget,
  pedirResetSistema,
  prepararLogoDraft,
  removerLogoDraft,
  salvarConfiguracoesDocumento
} from "./configuracoes.js";
import { confirmarAcaoAtual, fecharConfirmacao, abrirConfirmacao, mostrarToast } from "./feedback.js";
import { renderHome } from "./home.js";
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
import { imprimirDocumentoAtual } from "./print.js";
import { fecharBuscaGlobal, renderizarBuscaGlobal } from "./search.js";
import { filtrarModulosGlobais } from "./utils.js";

export function registrarEventos() {
  const globalSearchInput = document.getElementById("globalModuleSearch");
  globalSearchInput?.addEventListener("focus", () => renderizarBuscaGlobal(globalSearchInput.value));
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
  document.getElementById("homeSearchInput")?.addEventListener("input", renderHome);

  document.addEventListener("click", (event) => {
    const alvo = event.target;

    if (!alvo.closest("#globalSearchWrap")) {
      fecharBuscaGlobal();
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
      confirmarAcaoAtual();
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
      moverElementoConfiguracao("y", -2);
      return;
    }

    if (alvo.matches('[data-config-action="logo-down"]')) {
      moverElementoConfiguracao("y", 2);
      return;
    }

    if (alvo.matches('[data-config-action="logo-left"]')) {
      moverElementoConfiguracao("x", -2);
      return;
    }

    if (alvo.matches('[data-config-action="logo-right"]')) {
      moverElementoConfiguracao("x", 2);
      return;
    }

    if (alvo.matches('[data-config-action="remover-logo"]')) {
      removerLogoDraft();
      return;
    }

    if (alvo.matches('[data-config-action="resetar-sistema"]')) {
      pedirResetSistema();
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
      logoDropzone.addEventListener(tipo, (innerEvent) => {
        innerEvent.preventDefault();
        logoDropzone.classList.add("is-dragover");
      });
    });

    ["dragleave", "drop"].forEach((tipo) => {
      logoDropzone.addEventListener(tipo, (innerEvent) => {
        innerEvent.preventDefault();
        logoDropzone.classList.remove("is-dragover");
      });
    });

    logoDropzone.addEventListener("drop", (innerEvent) => {
      const file = innerEvent.dataTransfer?.files?.[0];
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
