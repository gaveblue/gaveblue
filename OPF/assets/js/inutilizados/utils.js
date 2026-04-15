import { state } from "./state.js";

const GLOBAL_MODULES = [
  { name: "WeRecibos", description: "Gerador de recibos", url: "https://gaveblue.com/recibos" },
  { name: "WeFrotas", description: "Gestão de frotas", url: "https://gaveblue.com/wefrotas" },
  { name: "WeTime", description: "Relógio online e painel de horário", url: "https://gaveblue.com/wetime" },
  { name: "WeConsultas", description: "Consultas empresariais", url: "https://gaveblue.com/weconsultas" },
  { name: "WeDevs", description: "Ferramentas e utilidades dev", url: "https://gaveblue.com/wedevs" },
  { name: "WeTasks", description: "Tarefas e organização", url: "https://gaveblue.com/wetasks" },
  { name: "WeDocs", description: "Gerador de documentos", url: "https://gaveblue.com/wedocs" },
  { name: "PDV", description: "Ponto de venda e financeiro", url: "https://gaveblue.com/PDV" },
  { name: "OPF", description: "Ordem de Pagamento Financeiro", url: "https://gaveblue.com/opf" }
];

export function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export function formatarDataBr(valor) {
  if (!valor) {
    return "-";
  }

  const [ano, mes, dia] = String(valor).split("-");
  if (!ano || !mes || !dia) {
    return valor;
  }

  return `${dia}/${mes}/${ano}`;
}

export function formatarDocumento(valor) {
  return String(valor || "").trim() || "-";
}

export function obterMesReferencia(valor) {
  const texto = String(valor || "").trim();
  if (!texto) {
    return "-";
  }

  if (/^\d{2}\/\d{4}$/.test(texto)) {
    return texto;
  }

  if (/^\d{4}-\d{2}$/.test(texto)) {
    const [ano, mes] = texto.split("-");
    return `${mes}/${ano}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes] = texto.split("-");
    return `${mes}/${ano}`;
  }

  return texto;
}

export function formatarDataHoraAtual() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  const horas = String(agora.getHours()).padStart(2, "0");
  const minutos = String(agora.getMinutes()).padStart(2, "0");

  return {
    ano,
    dataIso: `${ano}-${mes}-${dia}`,
    dataBr: `${dia}/${mes}/${ano}`,
    hora: `${horas}:${minutos}`
  };
}

export function obterSequencialDocumento(numeroDocumento) {
  const match = String(numeroDocumento || "").match(/^OPF-(\d{4})-?(\d{4})$/);
  if (!match) {
    return null;
  }

  return {
    ano: Number(match[1]),
    sequencia: Number(match[2])
  };
}

export function gerarNumeroDocumento() {
  const { ano } = formatarDataHoraAtual();
  const maiorSequencia = state.documentos.reduce((acc, item) => {
    const dados = obterSequencialDocumento(item.numeroDocumento);
    if (!dados || dados.ano !== ano) {
      return acc;
    }

    return Math.max(acc, dados.sequencia);
  }, 0);

  const ultimoControlado = Number(state.controle.ultimoNumeroPorAno[ano] || 0);
  const proximaSequencia = Math.max(maiorSequencia, ultimoControlado) + 1;
  return `OPF-${ano}${String(proximaSequencia).padStart(4, "0")}`;
}

export function reservarNumeroDocumento(numeroDocumento) {
  const dados = obterSequencialDocumento(numeroDocumento);
  if (!dados) {
    return;
  }

  const atual = Number(state.controle.ultimoNumeroPorAno[dados.ano] || 0);
  if (dados.sequencia > atual) {
    state.controle.ultimoNumeroPorAno[dados.ano] = dados.sequencia;
  }
}

export function preencherDatalist(datalistId, itens) {
  const datalist = document.getElementById(datalistId);
  if (!datalist) {
    return;
  }

  datalist.innerHTML = itens.map((item) => {
    const label = item.nome || item.descricao;
    return `<option value="${label}"></option>`;
  }).join("");
}

export function filtrarModulosGlobais(termo) {
  const query = String(termo || "").trim().toLowerCase();
  if (!query) {
    return GLOBAL_MODULES;
  }

  return GLOBAL_MODULES.filter((item) => (
    item.name.toLowerCase().includes(query) ||
    item.description.toLowerCase().includes(query)
  ));
}
