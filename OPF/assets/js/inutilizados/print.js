import { state } from "./state.js";
import { mostrarToast } from "./feedback.js";
import { alternarAba, atualizarEstadoPreview, salvarDocumentoAtual } from "./documento.js";

export function imprimirDocumentoAtual() {
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
