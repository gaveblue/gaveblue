import { state } from "./state.js";

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
  if (!valor) {
    const agora = new Date();
    return `${String(agora.getMonth() + 1).padStart(2, "0")}/${agora.getFullYear()}`;
  }

  const [ano, mes] = String(valor).split("-");
  return `${mes}/${ano}`;
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
  const match = String(numeroDocumento || "").match(/^OPF-(\d{4})-(\d{4})$/);
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

  return `OPF-${ano}-${String(maiorSequencia + 1).padStart(4, "0")}`;
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
