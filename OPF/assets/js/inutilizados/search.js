import { filtrarModulosGlobais } from "./utils.js";

export function renderizarBuscaGlobal(termo = "") {
  const dropdown = document.getElementById("globalSearchDropdown");
  if (!dropdown) {
    return;
  }

  const resultados = filtrarModulosGlobais(termo);
  dropdown.innerHTML = resultados.map((item) => `
    <a class="opf-search-result" href="${item.url}" target="_self" rel="noopener noreferrer">
      <div>
        <strong>${item.name}</strong>
        <span>${item.description}</span>
      </div>
      <div class="opf-search-result-mark">↗</div>
    </a>
  `).join("");

  dropdown.hidden = false;
}

export function fecharBuscaGlobal() {
  const dropdown = document.getElementById("globalSearchDropdown");
  if (dropdown) {
    dropdown.hidden = true;
  }
}
