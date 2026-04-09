import { state, salvarStorage } from "./state.js";
import { preencherDatalist, uid } from "./utils.js";

export function obterItensCadastroView() {
  if (state.cadastroView === "classificacoes") {
    return [
      ...state.cadastros.naturezas.map((item) => ({ ...item, grupo: "naturezas", categoria: "Natureza" })),
      ...state.cadastros.tiposOperacao.map((item) => ({ ...item, grupo: "tiposOperacao", categoria: "Tipo de operacao" })),
      ...state.cadastros.centrosResultado.map((item) => ({ ...item, grupo: "centrosResultado", categoria: "Centro de resultado" }))
    ];
  }

  return state.cadastros[state.cadastroView];
}

export function obterCadastroSelecionado() {
  return obterItensCadastroView().find((item) => item.id === state.cadastroSelecionadoId) || null;
}

export function encontrarCadastroPorTexto(tipo, texto) {
  const valor = String(texto || "").trim().toLowerCase();
  if (!valor) {
    return null;
  }

  return state.cadastros[tipo].find((item) => {
    const base = item.nome || item.descricao || "";
    return base.trim().toLowerCase() === valor;
  }) || null;
}

export function obterEnderecoFormatado(item) {
  if (!item) {
    return "-";
  }

  const partes = [item.logradouro, item.bairro, item.cidade, item.uf].filter(Boolean);
  return partes.length ? partes.join(", ") : "-";
}

function obterHeadCadastro() {
  if (state.cadastroView === "emitentes") {
    return ["Nome / Razao Social", "Documento", "Tipo", "Cidade", "UF"];
  }

  if (state.cadastroView === "fornecedores") {
    return ["Nome / Razao Social", "Documento", "Categoria", "Cidade", "UF"];
  }

  return ["Descricao", "Grupo"];
}

function obterVarianteCategoria(valor) {
  return String(valor || "").toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function renderTabelaCadastros() {
  const head = document.getElementById("cadastroTableHead");
  const body = document.getElementById("cadastroTableBody");
  const searchInput = document.getElementById("cadastroSearch");
  const termo = String(searchInput?.value || "").trim().toLowerCase();
  const colunas = obterHeadCadastro();
  const itens = obterItensCadastroView().filter((item) => JSON.stringify(item).toLowerCase().includes(termo));

  head.innerHTML = colunas.map((titulo) => `<th>${titulo}</th>`).join("");

  if (!itens.length) {
    body.innerHTML = `<tr><td colspan="${colunas.length}"><div class="saved-empty">Nenhum cadastro encontrado.</div></td></tr>`;
    return;
  }

  body.innerHTML = itens.map((item) => {
    const selected = item.id === state.cadastroSelecionadoId ? "is-selected" : "";

    if (state.cadastroView === "classificacoes") {
      return `
        <tr class="${selected}" data-select-cadastro="${item.id}">
          <td>${item.descricao || "-"}</td>
          <td>${item.categoria || "-"}</td>
        </tr>
      `;
    }

    const categoria = item.categoria || "Emitente";
    const documento = item.cnpj || item.documento || "-";

    return `
      <tr class="${selected}" data-select-cadastro="${item.id}">
        <td>${item.nome || "-"}</td>
        <td>${documento}</td>
        <td><span class="tag-pill" data-variant="${obterVarianteCategoria(categoria)}">${categoria}</span></td>
        <td>${item.cidade || "-"}</td>
        <td>${item.uf || "-"}</td>
      </tr>
    `;
  }).join("");
}

function renderDetalheCadastro() {
  const titulo = document.getElementById("cadastroDetailTitulo");
  const nome = document.getElementById("cadastroDetailNome");
  const grid = document.getElementById("cadastroDetailGrid");
  const item = obterCadastroSelecionado();

  titulo.textContent = "Visualizacao do cadastro";
  nome.textContent = item?.nome || item?.descricao || "-";

  if (!item) {
    grid.innerHTML = `<div class="saved-empty">Selecione um cadastro para visualizar os detalhes.</div>`;
    return;
  }

  if (state.cadastroView === "classificacoes") {
    grid.innerHTML = `
      <div class="cadastro-detail-item"><span>Grupo</span><strong>${item.categoria || "-"}</strong></div>
      <div class="cadastro-detail-item"><span>Descricao</span><strong>${item.descricao || "-"}</strong></div>
    `;
    return;
  }

  const documento = item.cnpj || item.documento || "-";
  const categoria = item.categoria || "-";
  grid.innerHTML = `
    <div class="cadastro-detail-item"><span>Nome / Razao Social</span><strong>${item.nome || "-"}</strong></div>
    <div class="cadastro-detail-item"><span>CPF / CNPJ</span><strong>${documento}</strong></div>
    <div class="cadastro-detail-item"><span>Inscricao Estadual</span><strong>${item.ie || "-"}</strong></div>
    <div class="cadastro-detail-item"><span>${state.cadastroView === "emitentes" ? "Tipo" : "Categoria"}</span><strong>${categoria}</strong></div>
    <div class="cadastro-detail-item"><span>Logradouro</span><strong>${item.logradouro || "-"}</strong></div>
    <div class="cadastro-detail-item"><span>Bairro</span><strong>${item.bairro || "-"}</strong></div>
    <div class="cadastro-detail-item"><span>Cidade</span><strong>${item.cidade || "-"}</strong></div>
    <div class="cadastro-detail-item"><span>Estado</span><strong>${item.uf || "-"}</strong></div>
  `;
}

export function renderCadastros() {
  preencherDatalist("emitentesOptions", state.cadastros.emitentes);
  preencherDatalist("fornecedoresOptions", state.cadastros.fornecedores);
  preencherDatalist("naturezasOptions", state.cadastros.naturezas);
  preencherDatalist("tiposOperacaoOptions", state.cadastros.tiposOperacao);
  preencherDatalist("centrosResultadoOptions", state.cadastros.centrosResultado);

  document.querySelectorAll(".cadastro-tab").forEach((botao) => {
    botao.classList.toggle("is-active", botao.dataset.cadastroView === state.cadastroView);
  });

  const search = document.getElementById("cadastroSearch");
  if (search) {
    const placeholders = {
      emitentes: "Pesquisar emitentes e pagadores...",
      fornecedores: "Pesquisar fornecedores e parceiros...",
      classificacoes: "Pesquisar classificacoes..."
    };
    search.placeholder = placeholders[state.cadastroView] || "Pesquisar cadastros...";
  }

  renderTabelaCadastros();
  renderDetalheCadastro();
}

export function removerCadastro(tipo, id) {
  state.cadastros[tipo] = state.cadastros[tipo].filter((item) => item.id !== id);
  state.cadastroSelecionadoId = null;
  salvarStorage();
  renderCadastros();
}

export function abrirModalCadastro(modo) {
  const modal = document.getElementById("cadastroModal");
  const form = document.getElementById("cadastroModalForm");
  const titulo = document.getElementById("cadastroModalTitulo");
  const subtitulo = document.getElementById("cadastroModalSubtitulo");
  const entityFields = document.getElementById("cadastroModalEntityFields");
  const classFields = document.getElementById("cadastroModalClassificacaoFields");
  const categoriaLabel = document.getElementById("cadastroCategoriaLabel");
  const item = modo === "editar" ? obterCadastroSelecionado() : null;

  form.reset();
  form.elements.id.value = item?.id || "";

  if (state.cadastroView === "classificacoes") {
    titulo.textContent = "Formulario de cadastro";
    subtitulo.textContent = "Simulacao visual";
    entityFields.hidden = true;
    classFields.hidden = false;
    form.elements.grupo.value = "classificacoes";
    form.elements.classificacaoTipo.value = item?.grupo || "naturezas";
    form.elements.descricao.value = item?.descricao || "";
  } else {
    entityFields.hidden = false;
    classFields.hidden = true;
    form.elements.grupo.value = state.cadastroView;
    categoriaLabel.textContent = state.cadastroView === "emitentes" ? "Tipo" : "Categoria";
    form.elements.categoria.innerHTML = state.cadastroView === "emitentes"
      ? `<option value="Emitente">Emitente</option><option value="Pagador">Pagador</option>`
      : `<option value="Fornecedor">Fornecedor</option><option value="Parceiro">Parceiro</option>`;
    titulo.textContent = "Formulario de cadastro";
    subtitulo.textContent = "Simulacao visual";
    form.elements.nome.value = item?.nome || "";
    form.elements.documento.value = item?.cnpj || item?.documento || "";
    form.elements.ie.value = item?.ie || "";
    form.elements.logradouro.value = item?.logradouro || "";
    form.elements.bairro.value = item?.bairro || "";
    form.elements.cidade.value = item?.cidade || "";
    form.elements.uf.value = item?.uf || "";
    form.elements.categoria.value = item?.categoria || (state.cadastroView === "emitentes" ? "Emitente" : "Fornecedor");
  }

  modal.hidden = false;
}

export function fecharModalCadastro() {
  document.getElementById("cadastroModal").hidden = true;
}

export function salvarCadastroModal(form) {
  const formData = new FormData(form);
  const id = String(formData.get("id") || "") || uid();
  const grupo = String(formData.get("grupo") || "");

  if (grupo === "classificacoes") {
    const tipo = String(formData.get("classificacaoTipo") || "naturezas");
    const descricao = String(formData.get("descricao") || "").trim();
    if (!descricao) {
      return;
    }

    ["naturezas", "tiposOperacao", "centrosResultado"].forEach((chave) => {
      state.cadastros[chave] = state.cadastros[chave].filter((item) => item.id !== id);
    });

    state.cadastros[tipo].push({ id, descricao });
    state.cadastroSelecionadoId = id;
  } else {
    const payload = {
      id,
      nome: String(formData.get("nome") || "").trim(),
      ie: String(formData.get("ie") || "").trim(),
      logradouro: String(formData.get("logradouro") || "").trim(),
      bairro: String(formData.get("bairro") || "").trim(),
      cidade: String(formData.get("cidade") || "").trim(),
      uf: String(formData.get("uf") || "").trim().toUpperCase(),
      categoria: String(formData.get("categoria") || "").trim()
    };

    if (!payload.nome) {
      return;
    }

    if (grupo === "emitentes") {
      payload.cnpj = String(formData.get("documento") || "").trim();
    } else {
      payload.documento = String(formData.get("documento") || "").trim();
    }

    state.cadastros[grupo] = state.cadastros[grupo].filter((item) => item.id !== id);
    state.cadastros[grupo].push(payload);
    state.cadastroSelecionadoId = id;
  }

  salvarStorage();
  renderCadastros();
  fecharModalCadastro();
}
