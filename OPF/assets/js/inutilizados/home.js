import { state } from "./state.js";
import { formatarMoeda } from "./utils.js";

export function renderHome() {
  const termo = String(document.getElementById("homeSearchInput")?.value || "").trim().toLowerCase();
  const documentos = state.documentos.filter((doc) => {
    if (!termo) {
      return true;
    }

    return [doc.numeroDocumento, doc.emitente?.nome, doc.fornecedor?.nome]
      .some((valor) => String(valor || "").toLowerCase().includes(termo));
  });

  const container = document.getElementById("documentosList");
  if (!documentos.length) {
    container.innerHTML = `<div class="saved-empty">Nenhum documento encontrado.</div>`;
    return;
  }

  container.innerHTML = documentos.map((doc) => `
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
