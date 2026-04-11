import { carregarStorage } from "./state.js";
import { renderCadastros } from "./cadastros.js";
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

function iniciarFormulario() {
  mostrarListaLancamentos();
  preencherFormularioLancamento();
  garantirLinhaInicial();
  mostrarListaLancamentos();
}

window.addEventListener("load", () => {
  carregarStorage();
  conectarLancamentos({ renderLancamentos, atualizarEstadoPreview });
  renderCadastros();
  renderHome();
  renderLancamentos();
  iniciarFormulario();
  registrarEventos();
  atualizarEstadoPreview({ loading: false, success: false, documento: false });
});
