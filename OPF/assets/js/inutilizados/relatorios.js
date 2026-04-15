import { state } from "./state.js";
import { formatarMoeda } from "./utils.js";

export function renderRelatorios() {
  const totalDocumentos = document.getElementById("relatoriosTotalDocumentos");
  const valorTotal = document.getElementById("relatoriosValorTotal");
  const body = document.getElementById("relatoriosTableBody");
  if (!body || !totalDocumentos || !valorTotal) {
    return;
  }

  totalDocumentos.textContent = String(state.documentos.length);
  valorTotal.textContent = formatarMoeda(state.documentos.reduce((acc, item) => acc + Number(item.total || 0), 0));

  if (!state.documentos.length) {
    body.innerHTML = `<tr><td colspan="6"><div class="saved-empty">Nenhuma OPF emitida ainda.</div></td></tr>`;
    return;
  }

  body.innerHTML = state.documentos.map((item) => `
    <tr>
      <td>${item.numeroDocumento}</td>
      <td>${item.emitente?.nome || "-"}</td>
      <td>${item.fornecedor?.nome || "-"}</td>
      <td>${item.mesReferencia || "-"}</td>
      <td>${item.vencimento || "-"}</td>
      <td class="num">${formatarMoeda(item.total)}</td>
    </tr>
  `).join("");
}
