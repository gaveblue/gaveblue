export const STORAGE_KEY = "opf-financeiro-data-v2";
export const THEME_KEY = "opf-financeiro-theme";

export const state = {
  cadastros: {
    emitentes: [],
    fornecedores: [],
    naturezas: [],
    tiposOperacao: [],
    centrosResultado: []
  },
  documentos: [],
  controle: {
    ultimoNumeroPorAno: {}
  },
  configuracoes: {
    logoDataUrl: "",
    logoScale: 100,
    printScale: 100,
    logoOffsetX: 0,
    logoOffsetY: 0,
    titleScale: 100,
    titleOffsetX: 0,
    titleOffsetY: 0,
    codeScale: 100,
    codeOffsetX: 0,
    codeOffsetY: 0
  },
  configuracoesDraft: {
    logoDataUrl: "",
    logoScale: 100,
    printScale: 100,
    logoOffsetX: 0,
    logoOffsetY: 0,
    titleScale: 100,
    titleOffsetX: 0,
    titleOffsetY: 0,
    codeScale: 100,
    codeOffsetX: 0,
    codeOffsetY: 0
  },
  documentoAtual: null,
  configTarget: "logo",
  cadastroView: "emitentes",
  cadastroSelecionadoId: null,
  lancamentoSelecionadoId: null,
  lancamentoEmEdicaoId: null,
  numeroDocumentoAtual: "",
  confirmAction: null
};

export function carregarStorage() {
  const bruto = localStorage.getItem(STORAGE_KEY);
  if (!bruto) {
    return;
  }

  try {
    const dados = JSON.parse(bruto);
    state.cadastros.emitentes = dados.emitentes || [];
    state.cadastros.fornecedores = dados.fornecedores || [];
    state.cadastros.naturezas = dados.naturezas || [];
    state.cadastros.tiposOperacao = dados.tiposOperacao || [];
    state.cadastros.centrosResultado = dados.centrosResultado || [];
    state.documentos = dados.documentos || [];
    state.controle.ultimoNumeroPorAno = dados.ultimoNumeroPorAno || {};
    state.configuracoes.logoDataUrl = dados.logoDataUrl || "";
    state.configuracoes.logoScale = Number(dados.logoScale || 100);
    state.configuracoes.printScale = Number(dados.printScale || 100);
    state.configuracoes.logoOffsetX = Number(dados.logoOffsetX || 0);
    state.configuracoes.logoOffsetY = Number(dados.logoOffsetY || 0);
    state.configuracoes.titleScale = Number(dados.titleScale || 100);
    state.configuracoes.titleOffsetX = Number(dados.titleOffsetX || 0);
    state.configuracoes.titleOffsetY = Number(dados.titleOffsetY || 0);
    state.configuracoes.codeScale = Number(dados.codeScale || 100);
    state.configuracoes.codeOffsetX = Number(dados.codeOffsetX || 0);
    state.configuracoes.codeOffsetY = Number(dados.codeOffsetY || 0);
  } catch (error) {
    console.error("Falha ao carregar storage", error);
  }
}

export function salvarStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state.cadastros,
      ultimoNumeroPorAno: state.controle.ultimoNumeroPorAno,
      logoDataUrl: state.configuracoes.logoDataUrl,
      logoScale: state.configuracoes.logoScale,
      printScale: state.configuracoes.printScale,
      logoOffsetX: state.configuracoes.logoOffsetX,
      logoOffsetY: state.configuracoes.logoOffsetY,
      titleScale: state.configuracoes.titleScale,
      titleOffsetX: state.configuracoes.titleOffsetX,
      titleOffsetY: state.configuracoes.titleOffsetY,
      codeScale: state.configuracoes.codeScale,
      codeOffsetX: state.configuracoes.codeOffsetX,
      codeOffsetY: state.configuracoes.codeOffsetY,
      documentos: state.documentos
    }));
    return true;
  } catch (error) {
    console.error("Falha ao salvar storage", error);
    return false;
  }
}
