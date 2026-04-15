import { THEME_KEY, state, salvarStorage } from "./state.js";
import { renderCadastros } from "./cadastros.js";
import { renderHome } from "./home.js";
import { abrirConfirmacao, mostrarToast } from "./feedback.js";
import { renderRelatorios } from "./relatorios.js";
import { atualizarEstadoPreview } from "./documento.js";
import { preencherFormularioLancamento, mostrarListaLancamentos, renderLancamentos } from "./lancamentos.js";
import { uid } from "./utils.js";

function lerArquivoComoDataURL(file, callback) {
  const reader = new FileReader();
  reader.onload = () => callback(String(reader.result || ""));
  reader.readAsDataURL(file);
}

function processarLogoUpload(file, callback) {
  if (!file) {
    callback("");
    return;
  }

  if (file.type === "image/svg+xml") {
    lerArquivoComoDataURL(file, callback);
    return;
  }

  lerArquivoComoDataURL(file, (dataUrl) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 900;
      const maxHeight = 320;
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      const width = Math.max(1, Math.round(img.width * ratio));
      const height = Math.max(1, Math.round(img.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL("image/png", 0.92));
    };
    img.onerror = () => callback(dataUrl);
    img.src = dataUrl;
  });
}

export function aplicarTema(tema) {
  const temaFinal = tema === "dark" ? "dark" : "light";
  document.body.dataset.theme = temaFinal;
  localStorage.setItem(THEME_KEY, temaFinal);

  const toggle = document.getElementById("darkModeToggle");
  if (toggle) {
    toggle.checked = temaFinal === "dark";
  }
}

export function obterMapaConfigTarget() {
  return {
    logo: {
      scale: "logoScale",
      offsetX: "logoOffsetX",
      offsetY: "logoOffsetY",
      label: "Tamanho do logo",
      min: 40,
      max: 320,
      step: 5
    },
    titulo: {
      scale: "titleScale",
      offsetX: "titleOffsetX",
      offsetY: "titleOffsetY",
      label: "Tamanho do título",
      min: 80,
      max: 180,
      step: 2
    },
    numero: {
      scale: "codeScale",
      offsetX: "codeOffsetX",
      offsetY: "codeOffsetY",
      label: "Tamanho do número",
      min: 80,
      max: 180,
      step: 2
    }
  };
}

export function sincronizarDraftConfiguracoes() {
  state.configuracoesDraft.logoDataUrl = state.configuracoes.logoDataUrl || "";
  state.configuracoesDraft.logoScale = Number(state.configuracoes.logoScale || 100);
  state.configuracoesDraft.printScale = Number(state.configuracoes.printScale || 100);
  state.configuracoesDraft.logoOffsetX = Number(state.configuracoes.logoOffsetX || 0);
  state.configuracoesDraft.logoOffsetY = Number(state.configuracoes.logoOffsetY || 0);
  state.configuracoesDraft.titleScale = Number(state.configuracoes.titleScale || 100);
  state.configuracoesDraft.titleOffsetX = Number(state.configuracoes.titleOffsetX || 0);
  state.configuracoesDraft.titleOffsetY = Number(state.configuracoes.titleOffsetY || 0);
  state.configuracoesDraft.codeScale = Number(state.configuracoes.codeScale || 100);
  state.configuracoesDraft.codeOffsetX = Number(state.configuracoes.codeOffsetX || 0);
  state.configuracoesDraft.codeOffsetY = Number(state.configuracoes.codeOffsetY || 0);
}

export function aplicarConfiguracoesDocumento() {
  const root = document.documentElement;
  const logoImg = document.getElementById("sheetLogoImage");
  const logoFallback = document.getElementById("sheetLogoFallback");
  const configLogoPreviewImage = document.getElementById("configLogoPreviewImage");
  const configLogoPreviewFallback = document.getElementById("configLogoPreviewFallback");
  const logoScaleInput = document.getElementById("logoScaleInput");
  const printScaleInput = document.getElementById("printScaleInput");
  const configDocumentPreview = document.getElementById("configDocumentPreview");
  const configScaleLabel = document.getElementById("configScaleLabel");
  const draft = state.configuracoesDraft;
  const saved = state.configuracoes;
  const targetMap = obterMapaConfigTarget();
  const targetConfig = targetMap[state.configTarget] || targetMap.logo;

  root.style.setProperty("--logo-scale", String((saved.logoScale || 100) / 100));
  root.style.setProperty("--print-scale", String((saved.printScale || 100) / 100));
  root.style.setProperty("--logo-offset-x", `${saved.logoOffsetX || 0}px`);
  root.style.setProperty("--logo-offset-y", `${saved.logoOffsetY || 0}px`);
  root.style.setProperty("--title-scale", String((saved.titleScale || 100) / 100));
  root.style.setProperty("--title-offset-x", `${saved.titleOffsetX || 0}px`);
  root.style.setProperty("--title-offset-y", `${saved.titleOffsetY || 0}px`);
  root.style.setProperty("--code-scale", String((saved.codeScale || 100) / 100));
  root.style.setProperty("--code-offset-x", `${saved.codeOffsetX || 0}px`);
  root.style.setProperty("--code-offset-y", `${saved.codeOffsetY || 0}px`);

  if (logoScaleInput) {
    logoScaleInput.min = String(targetConfig.min);
    logoScaleInput.max = String(targetConfig.max);
    logoScaleInput.step = String(targetConfig.step);
    logoScaleInput.value = String(draft[targetConfig.scale] || 100);
  }

  if (printScaleInput) {
    printScaleInput.value = String(draft.printScale || 100);
  }

  if (configScaleLabel) {
    configScaleLabel.textContent = targetConfig.label;
  }

  document.querySelectorAll("[data-config-target]").forEach((botao) => {
    botao.classList.toggle("is-active", botao.dataset.configTarget === state.configTarget);
  });

  document.querySelectorAll("[data-config-preview-target]").forEach((item) => {
    item.classList.toggle("is-target", item.dataset.configPreviewTarget === state.configTarget);
  });

  const possuiLogoSalvo = Boolean(saved.logoDataUrl);
  if (logoImg) {
    logoImg.hidden = !possuiLogoSalvo;
    logoImg.src = possuiLogoSalvo ? saved.logoDataUrl : "";
  }

  if (logoFallback) {
    logoFallback.hidden = possuiLogoSalvo;
  }

  const possuiLogoDraft = Boolean(draft.logoDataUrl);
  if (configLogoPreviewImage) {
    configLogoPreviewImage.hidden = !possuiLogoDraft;
    configLogoPreviewImage.src = possuiLogoDraft ? draft.logoDataUrl : "";
  }

  if (configLogoPreviewFallback) {
    configLogoPreviewFallback.hidden = possuiLogoDraft;
  }

  if (configDocumentPreview) {
    configDocumentPreview.style.transform = `scale(${(draft.printScale || 100) / 100})`;
  }

  if (configLogoPreviewImage) {
    configLogoPreviewImage.style.transform = `translate(${draft.logoOffsetX || 0}px, ${draft.logoOffsetY || 0}px) scale(${(draft.logoScale || 100) / 100})`;
  }

  const configDocumentTitleText = document.getElementById("configDocumentTitleText");
  if (configDocumentTitleText) {
    configDocumentTitleText.style.transform = `translate(${draft.titleOffsetX || 0}px, ${draft.titleOffsetY || 0}px) scale(${(draft.titleScale || 100) / 100})`;
  }

  const configDocumentCodeContent = document.getElementById("configDocumentCodeContent");
  if (configDocumentCodeContent) {
    configDocumentCodeContent.style.transform = `translate(${draft.codeOffsetX || 0}px, ${draft.codeOffsetY || 0}px) scale(${(draft.codeScale || 100) / 100})`;
  }
}

export function prepararLogoDraft(file) {
  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    mostrarToast("Arquivo invalido. Envie uma imagem.", "error");
    return;
  }

  processarLogoUpload(file, (logoDataUrl) => {
    state.configuracoesDraft.logoDataUrl = logoDataUrl;
    aplicarConfiguracoesDocumento();
    mostrarToast("Logo carregado na prévia. Clique em salvar para confirmar.", "success");
  });
}

export function salvarConfiguracoesDocumento() {
  const botaoSalvar = document.querySelector('[data-config-action="salvar-aparencia"]');
  state.configuracoes.logoDataUrl = state.configuracoesDraft.logoDataUrl || "";
  state.configuracoes.logoScale = Number(state.configuracoesDraft.logoScale || 100);
  state.configuracoes.printScale = Number(state.configuracoesDraft.printScale || 100);
  state.configuracoes.logoOffsetX = Number(state.configuracoesDraft.logoOffsetX || 0);
  state.configuracoes.logoOffsetY = Number(state.configuracoesDraft.logoOffsetY || 0);
  state.configuracoes.titleScale = Number(state.configuracoesDraft.titleScale || 100);
  state.configuracoes.titleOffsetX = Number(state.configuracoesDraft.titleOffsetX || 0);
  state.configuracoes.titleOffsetY = Number(state.configuracoesDraft.titleOffsetY || 0);
  state.configuracoes.codeScale = Number(state.configuracoesDraft.codeScale || 100);
  state.configuracoes.codeOffsetX = Number(state.configuracoesDraft.codeOffsetX || 0);
  state.configuracoes.codeOffsetY = Number(state.configuracoesDraft.codeOffsetY || 0);

  const salvo = salvarStorage();
  if (!salvo) {
    mostrarToast("Não foi possível salvar. O arquivo do logo pode estar grande demais.", "error");
    return;
  }

  sincronizarDraftConfiguracoes();
  aplicarConfiguracoesDocumento();

  if (botaoSalvar) {
    const textoOriginal = botaoSalvar.textContent;
    botaoSalvar.textContent = "Salvo com sucesso";
    botaoSalvar.disabled = true;
    window.setTimeout(() => {
      botaoSalvar.textContent = textoOriginal;
      botaoSalvar.disabled = false;
    }, 1400);
  }

  mostrarToast("Ajustes de identidade salvos com sucesso.", "success");
}

function baixarArquivo(nome, conteudo, tipo) {
  const payload = tipo.includes("csv") ? `\uFEFF${conteudo}` : conteudo;
  const blob = new Blob([payload], { type: tipo });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportarBackupDados() {
  const backup = {
    emitentes: state.cadastros.emitentes,
    fornecedores: state.cadastros.fornecedores,
    naturezas: state.cadastros.naturezas,
    tiposOperacao: state.cadastros.tiposOperacao,
    centrosResultado: state.cadastros.centrosResultado,
    ultimoNumeroPorAno: state.controle.ultimoNumeroPorAno,
    documentos: state.documentos
  };

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  baixarArquivo(`backup-opf-${stamp}.json`, JSON.stringify(backup, null, 2), "application/json");
  mostrarToast("Backup exportado com sucesso.", "success");
}

export function baixarModeloImportacao() {
  const csv = [
    "tipo;nome;documento;ie;logradouro;bairro;cidade;uf;categoria;descricao;grupo",
    "emitente;Empresa Exemplo;12.345.678/0001-90;123456;Rua Central 100;Centro;Sao Paulo;SP;Emitente;;",
    "fornecedor;Fornecedor Exemplo;54.321.987/0001-33;;Av Brasil 200;Jardins;Campinas;SP;Fornecedor;;",
    "classificacao;;;;;;;;;Natureza de exemplo;naturezas",
    "classificacao;;;;;;;;;Tipo de operacao de exemplo;tiposOperacao",
    "classificacao;;;;;;;;;Centro de resultado de exemplo;centrosResultado"
  ].join("\r\n");

  baixarArquivo("modelo-importacao-opf.csv", csv, "text/csv;charset=utf-8");
  mostrarToast("Modelo de importacao baixado com sucesso.", "success");
}

function parseCsvLinha(linha) {
  const separador = linha.includes(";") ? ";" : ",";
  return linha.split(separador).map((item) => item.trim());
}

function importarCsvConteudo(texto) {
  const linhas = String(texto || "").split(/\r?\n/).filter((linha) => linha.trim());
  if (linhas.length < 2) {
    throw new Error("Arquivo CSV vazio ou invalido.");
  }

  const registros = linhas.slice(1).map(parseCsvLinha);

  registros.forEach((colunas) => {
    const [tipo, nome, documento, ie, logradouro, bairro, cidade, uf, categoria, descricao, grupo] = colunas;

    if (tipo === "emitente") {
      state.cadastros.emitentes.push({
        id: uid(),
        nome: nome || "",
        cnpj: documento || "",
        ie: ie || "",
        logradouro: logradouro || "",
        bairro: bairro || "",
        cidade: cidade || "",
        uf: (uf || "").toUpperCase(),
        categoria: categoria || "Emitente"
      });
    }

    if (tipo === "fornecedor") {
      state.cadastros.fornecedores.push({
        id: uid(),
        nome: nome || "",
        documento: documento || "",
        ie: ie || "",
        logradouro: logradouro || "",
        bairro: bairro || "",
        cidade: cidade || "",
        uf: (uf || "").toUpperCase(),
        categoria: categoria || "Fornecedor"
      });
    }

    if (tipo === "classificacao" && descricao && ["naturezas", "tiposOperacao", "centrosResultado"].includes(grupo)) {
      state.cadastros[grupo].push({
        id: uid(),
        descricao
      });
    }
  });
}

function importarJsonConteudo(texto) {
  const dados = JSON.parse(texto);
  state.cadastros.emitentes = dados.emitentes || [];
  state.cadastros.fornecedores = dados.fornecedores || [];
  state.cadastros.naturezas = dados.naturezas || [];
  state.cadastros.tiposOperacao = dados.tiposOperacao || [];
  state.cadastros.centrosResultado = dados.centrosResultado || [];
  state.documentos = dados.documentos || [];
  state.controle.ultimoNumeroPorAno = dados.ultimoNumeroPorAno || {};
}

export function importarArquivoDados(file) {
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const texto = String(reader.result || "");

      if (file.name.toLowerCase().endsWith(".json")) {
        importarJsonConteudo(texto);
      } else {
        importarCsvConteudo(texto);
      }

      salvarStorage();
      renderCadastros();
      renderHome();
      renderLancamentos();
      renderRelatorios();
      mostrarToast("Dados importados com sucesso.", "success");
    } catch (error) {
      mostrarToast("Falha ao importar os dados. Verifique o arquivo.", "error");
    }
  };

  reader.readAsText(file, "utf-8");
}

export function resetarSistema() {
  state.cadastros.emitentes = [];
  state.cadastros.fornecedores = [];
  state.cadastros.naturezas = [];
  state.cadastros.tiposOperacao = [];
  state.cadastros.centrosResultado = [];
  state.documentos = [];
  state.controle.ultimoNumeroPorAno = {};
  state.configuracoes.logoDataUrl = "";
  state.configuracoes.logoScale = 100;
  state.configuracoes.printScale = 100;
  state.configuracoes.logoOffsetX = 0;
  state.configuracoes.logoOffsetY = 0;
  state.configuracoes.titleScale = 100;
  state.configuracoes.titleOffsetX = 0;
  state.configuracoes.titleOffsetY = 0;
  state.configuracoes.codeScale = 100;
  state.configuracoes.codeOffsetX = 0;
  state.configuracoes.codeOffsetY = 0;
  sincronizarDraftConfiguracoes();
  state.documentoAtual = null;
  state.cadastroSelecionadoId = null;
  state.lancamentoSelecionadoId = null;
  state.lancamentoEmEdicaoId = null;
  state.numeroDocumentoAtual = "";

  salvarStorage();
  renderCadastros();
  renderHome();
  renderLancamentos();
  renderRelatorios();
  mostrarListaLancamentos();
  preencherFormularioLancamento();
  aplicarConfiguracoesDocumento();
  atualizarEstadoPreview({ loading: false, success: false, documento: false });
  mostrarToast("Sistema resetado com sucesso. A numeracao voltou ao inicio.", "success");
}

export function moverElementoConfiguracao(eixo, direcao) {
  const mapa = obterMapaConfigTarget()[state.configTarget] || obterMapaConfigTarget().logo;
  const chave = eixo === "x" ? mapa.offsetX : mapa.offsetY;
  state.configuracoesDraft[chave] = Number(state.configuracoesDraft[chave] || 0) + direcao;
  aplicarConfiguracoesDocumento();
}

export function removerLogoDraft() {
  state.configuracoesDraft.logoDataUrl = "";
  aplicarConfiguracoesDocumento();
  mostrarToast("Logo removido da prévia. Clique em salvar para confirmar.", "info");
}

export function pedirResetSistema() {
  abrirConfirmacao({
    titulo: "Resetar sistema",
    texto: "Isso vai apagar todos os dados salvos e reiniciar a numeracao da OPF. Deseja continuar?",
    onConfirm: () => resetarSistema()
  });
}
