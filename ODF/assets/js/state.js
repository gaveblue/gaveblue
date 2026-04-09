export const STORAGE_KEY = "opf-financeiro-data-v2";

export const state = {
  cadastros: {
    emitentes: [],
    fornecedores: [],
    naturezas: [],
    tiposOperacao: [],
    centrosResultado: []
  },
  documentos: [],
  documentoAtual: null,
  cadastroView: "emitentes",
  cadastroSelecionadoId: null,
  lancamentoSelecionadoId: null,
  lancamentoEmEdicaoId: null,
  numeroDocumentoAtual: ""
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
  } catch (error) {
    console.error("Falha ao carregar storage", error);
  }
}

export function salvarStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...state.cadastros,
    documentos: state.documentos
  }));
}
