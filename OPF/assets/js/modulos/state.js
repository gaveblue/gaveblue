(function carregarEstadoOpf(global) {
  const STORAGE_KEY = "opf-financeiro-data-v2";
  const THEME_KEY = "opf-financeiro-theme";

  const state = {
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
      titleText: "ORDEM DE PAGAMENTO FINANCEIRO",
      logoScale: 100,
      logoWidth: 140,
      printScale: 100,
      logoOffsetX: 0,
      logoOffsetY: 0,
      titleScale: 100,
      titleWidth: 360,
      titleOffsetX: 0,
      titleOffsetY: 0,
      codeScale: 100,
      codeWidth: 185,
      codeOffsetX: 0,
      codeOffsetY: 0
    },
    configuracoesDraft: {
      logoDataUrl: "",
      titleText: "ORDEM DE PAGAMENTO FINANCEIRO",
      logoScale: 100,
      logoWidth: 140,
      printScale: 100,
      logoOffsetX: 0,
      logoOffsetY: 0,
      titleScale: 100,
      titleWidth: 360,
      titleOffsetX: 0,
      titleOffsetY: 0,
      codeScale: 100,
      codeWidth: 185,
      codeOffsetX: 0,
      codeOffsetY: 0
    },
    documentoAtual: null,
    configTarget: "logo",
    configModalOpen: false,
    configView: "personalizacao",
    documentoSort: {
      key: "numeroDocumento",
      direction: "desc"
    },
    workspace: {
      open: false,
      mode: "form",
      step: 0
    },
    cadastroView: "emitentes",
    cadastroSelecionadoId: null,
    lancamentoSelecionadoId: null,
    documentoSelecionados: [],
    documentoSelectionAnchorId: null,
    documentoSearchOpen: false,
    documentoFilterOpen: false,
    documentoFilterType: "vencimento",
    lancamentoEmEdicaoId: null,
    numeroDocumentoAtual: "",
    confirmAction: null
  };

  const GLOBAL_MODULES = [
    {
      name: "WeRecibos",
      description: "Gerador de recibos",
      url: "https://gaveblue.com/recibos",
      keywords: [
        "recibo", "recibos", "gerador", "gerar", "comprovante", "comprovantes", "pagamento", "pagamentos",
        "recebimento", "recebimentos", "recibo simples", "recibo de pagamento", "comprovante de pagamento",
        "comprovante de recebimento", "declaracao de recebimento", "autonomo", "cliente", "clientes",
        "prestacao", "servico", "assinatura", "valor recebido"
      ]
    },
    {
      name: "WeFrotas",
      description: "Gestao de frotas",
      url: "https://gaveblue.com/wefrotas",
      keywords: [
        "frota", "frotas", "veiculo", "veiculos", "carro", "carros", "moto", "motos",
        "motorista", "motoristas", "condutor", "condutores", "rota", "rotas", "combustivel",
        "abastecimento", "quilometragem", "km", "manutencao", "oficina", "rastreamento",
        "entrega", "logistica", "viagem", "viagens"
      ]
    },
    {
      name: "WeTime",
      description: "Relogio online e painel de horario",
      url: "https://gaveblue.com/wetime",
      keywords: [
        "horario", "horarios", "relogio", "ponto", "bater ponto", "escala",
        "turno", "turnos", "jornada", "presenca", "entrada", "saida", "expediente",
        "folha", "funcionario", "funcionarios", "controle de ponto", "timesheet"
      ]
    },
    {
      name: "WeConsultas",
      description: "Consultas empresariais",
      url: "https://gaveblue.com/weconsultas",
      keywords: [
        "consulta", "consultas", "empresa", "empresas", "cnpj", "cpf", "dados", "cadastro", "pesquisa",
        "consultar", "receita federal", "situacao cadastral", "inscricao estadual",
        "informacoes", "fornecedor", "cliente", "documento", "documentos",
        "validacao", "dados empresariais", "dados cadastrais"
      ]
    },
    {
      name: "WeDevs",
      description: "Ferramentas e utilidades dev",
      url: "https://gaveblue.com/wedevs",
      keywords: [
        "dev", "desenvolvedor", "desenvolvimento", "codigo", "ferramenta", "ferramentas", "utilidades",
        "api", "apis", "json", "debug", "html", "css", "js", "javascript", "typescript", "python", "phyton",
        "php", "java", "csharp", "c#", "sql", "regex", "frontend", "backend", "fullstack", "programacao",
        "script", "scripts", "conversor", "formatador", "minificar", "beautify", "encode",
        "decode", "token", "jwt", "base64", "yaml", "xml", "csv", "codigo fonte", "gerador de codigo"
      ]
    },
    {
      name: "WeTasks",
      description: "Tarefas e organizacao",
      url: "https://gaveblue.com/wetasks",
      keywords: [
        "tarefas", "tarefa", "organizacao", "organizar", "agenda", "planejamento", "lista", "kanban",
        "projeto", "projetos", "afazer", "a fazer", "produtividade", "checklist", "cronograma", "prioridade",
        "prioridades", "time", "equipe", "fluxo", "gestao", "board"
      ]
    },
    {
      name: "WeDocs",
      description: "Gerador de documentos",
      url: "https://gaveblue.com/wedocs",
      keywords: [
        "documento", "documentos", "gerador", "gerar", "arquivo", "arquivos", "pdf", "modelo", "modelos",
        "contrato", "contratos", "declaracao", "proposta", "propostas", "relatorio",
        "laudo", "oficio", "termo", "assinatura", "texto", "formulario", "gerar pdf"
      ]
    },
    {
      name: "PDV",
      description: "Ponto de venda e financeiro",
      url: "https://gaveblue.com/PDV",
      keywords: [
        "pdv", "venda", "vendas", "caixa", "financeiro", "loja", "comanda", "produto", "produtos", "estoque",
        "cupom", "cupom fiscal", "pedido", "pedidos", "frente de caixa", "atendimento", "cliente", "clientes",
        "recebimento", "maquininha", "cartao", "dinheiro", "pix", "fechamento de caixa"
      ]
    },
    {
      name: "OPF",
      description: "Ordem de Pagamento Financeiro",
      url: "https://gaveblue.com/opf",
      keywords: [
        "opf", "pagamento", "ordem", "financeiro", "documento", "lancamento", "lancamentos",
        "fornecedor", "fornecedores", "emitente", "emitentes", "contabil", "fiscal",
        "nota fiscal", "itens", "resumo financeiro", "ordem de pagamento", "contas a pagar", "despesa", "despesas"
      ]
    }
  ];

  global.OPFState = {
    STORAGE_KEY,
    THEME_KEY,
    state,
    GLOBAL_MODULES
  };
})(window);
