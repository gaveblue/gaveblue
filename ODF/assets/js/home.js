import { state } from "./state.js";
import { formatarMoeda } from "./utils.js";

export function renderHome() {
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
