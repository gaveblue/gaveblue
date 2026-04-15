import { state } from "./state.js";

export function mostrarToast(mensagem, tipo = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast-item is-${tipo}`;
  toast.textContent = mensagem;
  container.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("is-visible");
  }, 10);

  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 220);
  }, 3200);
}

export function abrirConfirmacao({ titulo, texto, onConfirm, confirmLabel, cancelLabel }) {
  state.confirmAction = typeof onConfirm === "function" ? onConfirm : null;
  document.getElementById("confirmModalTitulo").textContent = titulo || "Confirmar ação";
  document.getElementById("confirmModalTexto").textContent = texto || "Deseja continuar com esta operação?";
  document.querySelector('[data-confirm-action="confirmar"]').textContent = confirmLabel || "Confirmar";
  document.querySelector('[data-confirm-action="cancelar"]').textContent = cancelLabel || "Cancelar";
  document.getElementById("confirmModal").hidden = false;
}

export function fecharConfirmacao() {
  state.confirmAction = null;
  document.getElementById("confirmModal").hidden = true;
}

export function confirmarAcaoAtual() {
  const action = state.confirmAction;
  fecharConfirmacao();
  if (action) {
    action();
  }
}
