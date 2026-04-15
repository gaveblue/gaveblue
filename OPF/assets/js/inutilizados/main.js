import { carregarStorage, THEME_KEY } from "./state.js";
import { renderCadastros } from "./cadastros.js";
import { aplicarConfiguracoesDocumento, aplicarTema, sincronizarDraftConfiguracoes } from "./configuracoes.js";
import { atualizarEstadoPreview } from "./documento.js";
import { registrarEventos } from "./events.js";
import { renderHome } from "./home.js";
import {
  conectarLancamentos,
  garantirLinhaInicial,
  mostrarListaLancamentos,
  preencherFormularioLancamento,
  renderLancamentos
} from "./lancamentos.js";
import { renderRelatorios } from "./relatorios.js";

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
  renderRelatorios();
  iniciarFormulario();
  registrarEventos();
  atualizarEstadoPreview({ loading: false, success: false, documento: false });
});
