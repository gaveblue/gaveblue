const STORAGE_KEY = "full-finance-data-v2";

const defaultData = {
  accounts: [],
  transactions: [],
  categories: {
    credit: [],
    debit: [],
  },
  lastImport: null,
};

const viewTitles = {
  dashboard: "Dashboard financeiro",
  transactions: "Transacoes",
  accounts: "Contas",
  reports: "Relatorios",
  settings: "Configuracoes",
};

const state = {
  theme: localStorage.getItem("full-finance-theme") || "dark",
  balanceVisible: true,
  quickMenuOpen: false,
  currentView: "dashboard",
  entryType: "credit",
  editingTransactionId: null,
  editingAccountId: null,
  filters: {
    search: "",
    type: "all",
    account: "all",
    month: "all",
  },
  reportFilters: {
    type: "all",
    status: "all",
    partner: "all",
    company: "all",
    month: "all",
    origin: "all",
    titleType: "all",
    resultCenter: "all",
    timing: "all",
  },
  data: loadData(),
};

const root = document.documentElement;
const screenTitle = document.getElementById("screenTitle");
const screens = document.querySelectorAll(".screen");
const navButtons = document.querySelectorAll("[data-view-button]");
const goViewButtons = document.querySelectorAll("[data-go-view]");
const themeToggle = document.getElementById("themeToggle");
const toggleBalanceButton = document.getElementById("toggleBalance");
const balanceToggleIcon = document.getElementById("balanceToggleIcon");
const totalBalanceElement = document.getElementById("totalBalance");
const balanceTrendElement = document.getElementById("balanceTrend");
const balanceMessageElement = document.getElementById("balanceMessage");
const lastUpdateLabel = document.getElementById("lastUpdateLabel");
const creditTotalElement = document.getElementById("creditTotal");
const debitTotalElement = document.getElementById("debitTotal");
const monthBalanceElement = document.getElementById("monthBalance");
const currentMonthLabel = document.getElementById("currentMonthLabel");
const healthRateElement = document.getElementById("healthRate");
const connectedAccountsElement = document.getElementById("connectedAccounts");
const todayTransactionsElement = document.getElementById("todayTransactions");
const accountsRow = document.getElementById("accountsRow");
const recentTransactionsList = document.getElementById("recentTransactionsList");
const allTransactionsList = document.getElementById("allTransactionsList");
const accountsManagerList = document.getElementById("accountsManagerList");
const chartBars = document.getElementById("chartBars");
const reportTotalValue = document.getElementById("reportTotalValue");
const reportTotalCount = document.getElementById("reportTotalCount");
const reportPendingValue = document.getElementById("reportPendingValue");
const reportPendingCount = document.getElementById("reportPendingCount");
const reportPaidValue = document.getElementById("reportPaidValue");
const reportPaidCount = document.getElementById("reportPaidCount");
const topPartnerName = document.getElementById("topPartnerName");
const topPartnerValue = document.getElementById("topPartnerValue");
const topCompanyName = document.getElementById("topCompanyName");
const topCompanyValue = document.getElementById("topCompanyValue");
const reportOverdueValue = document.getElementById("reportOverdueValue");
const reportOverdueCount = document.getElementById("reportOverdueCount");
const reportDueSoonValue = document.getElementById("reportDueSoonValue");
const reportDueSoonCount = document.getElementById("reportDueSoonCount");
const reportAverageValue = document.getElementById("reportAverageValue");
const reportAverageLabel = document.getElementById("reportAverageLabel");
const categoryBreakdown = document.getElementById("categoryBreakdown");
const partnerBreakdown = document.getElementById("partnerBreakdown");
const reportTitlesList = document.getElementById("reportTitlesList");
const importSummary = document.getElementById("importSummary");
const fabButton = document.getElementById("fabButton");
const quickMenu = document.getElementById("quickMenu");
const quickMenuButtons = quickMenu.querySelectorAll("[data-entry-type]");
const importSpreadsheetButton = document.getElementById("importSpreadsheetButton");
const spreadsheetInput = document.getElementById("spreadsheetInput");
const resetDataButton = document.getElementById("resetDataButton");

const transactionModal = document.getElementById("transactionModal");
const closeTransactionModalButton = document.getElementById("closeTransactionModalButton");
const cancelTransactionButton = document.getElementById("cancelTransactionButton");
const transactionForm = document.getElementById("transactionForm");
const transactionIdInput = document.getElementById("transactionId");
const entryTypeInput = document.getElementById("entryType");
const entryDescription = document.getElementById("entryDescription");
const entryAmount = document.getElementById("entryAmount");
const entryDate = document.getElementById("entryDate");
const entryAccount = document.getElementById("entryAccount");
const entryCategory = document.getElementById("entryCategory");
const categorySuggestions = document.getElementById("categorySuggestions");
const typeButtons = document.querySelectorAll("[data-type-select]");
const addTransactionInlineButton = document.getElementById("addTransactionInlineButton");

const accountModal = document.getElementById("accountModal");
const closeAccountModalButton = document.getElementById("closeAccountModalButton");
const cancelAccountButton = document.getElementById("cancelAccountButton");
const accountForm = document.getElementById("accountForm");
const accountIdInput = document.getElementById("accountId");
const accountBank = document.getElementById("accountBank");
const accountType = document.getElementById("accountType");
const accountOpeningBalance = document.getElementById("accountOpeningBalance");
const openAccountModalButton = document.getElementById("openAccountModalButton");
const newAccountButton = document.getElementById("newAccountButton");

const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");
const filterAccount = document.getElementById("filterAccount");
const filterMonth = document.getElementById("filterMonth");
const reportFilterType = document.getElementById("reportFilterType");
const reportFilterStatus = document.getElementById("reportFilterStatus");
const reportFilterPartner = document.getElementById("reportFilterPartner");
const reportFilterCompany = document.getElementById("reportFilterCompany");
const reportFilterMonth = document.getElementById("reportFilterMonth");
const reportFilterOrigin = document.getElementById("reportFilterOrigin");
const reportFilterTitleType = document.getElementById("reportFilterTitleType");
const reportFilterResultCenter = document.getElementById("reportFilterResultCenter");
const reportFilterTiming = document.getElementById("reportFilterTiming");

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return JSON.parse(JSON.stringify(defaultData));
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
      transactions: Array.isArray(parsed.transactions)
        ? parsed.transactions.map((transaction) => ({
            ...transaction,
            status: transaction.status || "paid",
            partner: transaction.partner || "",
            company: transaction.company || "",
            titleType: transaction.titleType || "",
            resultCenter: transaction.resultCenter || "",
            origin: transaction.origin || "",
            negotiationDate: transaction.negotiationDate || "",
            dueDate: transaction.dueDate || "",
            settlementDate: transaction.settlementDate || "",
          }))
        : [],
      categories: {
        credit: Array.isArray(parsed.categories?.credit) ? parsed.categories.credit : [],
        debit: Array.isArray(parsed.categories?.debit) ? parsed.categories.debit : [],
      },
      lastImport: parsed.lastImport || null,
    };
  } catch (error) {
    return JSON.parse(JSON.stringify(defaultData));
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonthKey() {
  return getTodayKey().slice(0, 7);
}

function formatDateLabel(dateString) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateString}T12:00:00`));
}

function getMonthKey(dateString) {
  return dateString.slice(0, 7);
}

function diffInDays(fromDate, toDate) {
  const from = new Date(`${fromDate}T12:00:00`);
  const to = new Date(`${toDate}T12:00:00`);
  return Math.round((to - from) / 86400000);
}

function getTimingStatus(transaction) {
  if (!transaction.dueDate) {
    return "no-due-date";
  }

  if (transaction.status !== "pending") {
    return "settled";
  }

  const daysToDue = diffInDays(getTodayKey(), transaction.dueDate);

  if (daysToDue < 0) {
    return "overdue";
  }

  if (daysToDue <= 7) {
    return "due-soon";
  }

  return "future";
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function buildInitials(bank) {
  return bank
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CC";
}

function getAccountById(accountId) {
  return state.data.accounts.find((account) => account.id === accountId);
}

function getTransactionsSorted() {
  return [...state.data.transactions].sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

function getAccountBalance(accountId) {
  const account = getAccountById(accountId);
  if (!account) {
    return 0;
  }

  const delta = state.data.transactions.reduce((total, transaction) => {
    if (transaction.accountId !== accountId) {
      return total;
    }
    return total + (transaction.type === "credit" ? transaction.amount : -transaction.amount);
  }, 0);

  return account.openingBalance + delta;
}

function upsertCategory(type, value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return;
  }

  const exists = state.data.categories[type].some((category) => category.toLowerCase() === normalized.toLowerCase());
  if (!exists) {
    state.data.categories[type].push(normalized);
    state.data.categories[type].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }
}

function getDashboardMetrics() {
  const currentMonth = getCurrentMonthKey();
  const monthlyTransactions = state.data.transactions.filter((transaction) => getMonthKey(transaction.date) === currentMonth);
  const creditTotal = monthlyTransactions.filter((transaction) => transaction.type === "credit").reduce((sum, transaction) => sum + transaction.amount, 0);
  const debitTotal = monthlyTransactions.filter((transaction) => transaction.type === "debit").reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalBalance = state.data.accounts.reduce((sum, account) => sum + getAccountBalance(account.id), 0);
  const todayTransactions = state.data.transactions.filter((transaction) => transaction.date === getTodayKey()).length;
  const healthRate = creditTotal === 0 ? 0 : Math.max(0, Math.round(((creditTotal - debitTotal) / creditTotal) * 100));

  return {
    currentMonth,
    totalBalance,
    creditTotal,
    debitTotal,
    monthBalance: creditTotal - debitTotal,
    connectedAccounts: state.data.accounts.length,
    todayTransactions,
    healthRate,
  };
}

function getMonthlyChartData() {
  const months = [];
  const current = new Date(`${getTodayKey()}T12:00:00`);

  for (let index = 3; index >= 0; index -= 1) {
    const date = new Date(current.getFullYear(), current.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      key,
      label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      credit: 0,
      debit: 0,
    });
  }

  state.data.transactions.forEach((transaction) => {
    const found = months.find((month) => month.key === getMonthKey(transaction.date));
    if (found) {
      found[transaction.type] += transaction.amount;
    }
  });

  const values = [];
  months.forEach((month) => values.push(month.credit, month.debit));
  const maxValue = Math.max(1, ...values);

  return months.map((month) => ({
    label: month.label,
    creditHeight: month.credit > 0 ? Math.max((month.credit / maxValue) * 100, 10) : 8,
    debitHeight: month.debit > 0 ? Math.max((month.debit / maxValue) * 100, 10) : 8,
    positive: month.credit >= month.debit,
  }));
}

function getFilteredTransactions() {
  return getTransactionsSorted().filter((transaction) => {
    const matchesSearch =
      !state.filters.search ||
      transaction.description.toLowerCase().includes(state.filters.search) ||
      transaction.category.toLowerCase().includes(state.filters.search);

    const matchesType = state.filters.type === "all" || transaction.type === state.filters.type;
    const matchesAccount = state.filters.account === "all" || transaction.accountId === state.filters.account;
    const matchesMonth = state.filters.month === "all" || getMonthKey(transaction.date) === state.filters.month;

    return matchesSearch && matchesType && matchesAccount && matchesMonth;
  });
}

function getReportMetrics() {
  const filteredTransactions = state.data.transactions.filter((transaction) => {
    const matchesType = state.reportFilters.type === "all" || transaction.type === state.reportFilters.type;
    const matchesStatus = state.reportFilters.status === "all" || transaction.status === state.reportFilters.status;
    const transactionPartner = transaction.partner || "";
    const transactionCompany = transaction.company || "";
    const transactionOrigin = transaction.origin || "";
    const transactionTitleType = transaction.titleType || "";
    const transactionResultCenter = transaction.resultCenter || "";
    const matchesPartner = state.reportFilters.partner === "all" || transactionPartner === state.reportFilters.partner;
    const matchesCompany = state.reportFilters.company === "all" || transactionCompany === state.reportFilters.company;
    const matchesMonth = state.reportFilters.month === "all" || getMonthKey(transaction.date) === state.reportFilters.month;
    const matchesOrigin = state.reportFilters.origin === "all" || transactionOrigin === state.reportFilters.origin;
    const matchesTitleType = state.reportFilters.titleType === "all" || transactionTitleType === state.reportFilters.titleType;
    const matchesResultCenter = state.reportFilters.resultCenter === "all" || transactionResultCenter === state.reportFilters.resultCenter;
    const timingStatus = getTimingStatus(transaction);
    const matchesTiming = state.reportFilters.timing === "all" || timingStatus === state.reportFilters.timing;

    return matchesType && matchesStatus && matchesPartner && matchesCompany && matchesMonth && matchesOrigin && matchesTitleType && matchesResultCenter && matchesTiming;
  });

  const totalsByCategory = new Map();
  const totalsByPartner = new Map();
  const totalsByCompany = new Map();
  let totalValue = 0;
  let paidValue = 0;
  let pendingValue = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let overdueValue = 0;
  let overdueCount = 0;
  let dueSoonValue = 0;
  let dueSoonCount = 0;

  filteredTransactions.forEach((transaction) => {
    totalValue += transaction.amount;

    if (transaction.status === "pending") {
      pendingCount += 1;
      pendingValue += transaction.amount;
    } else {
      paidCount += 1;
      paidValue += transaction.amount;
    }

    totalsByCategory.set(transaction.category, (totalsByCategory.get(transaction.category) || 0) + transaction.amount);

    if (transaction.partner) {
      totalsByPartner.set(transaction.partner, (totalsByPartner.get(transaction.partner) || 0) + transaction.amount);
    }

    if (transaction.company) {
      totalsByCompany.set(transaction.company, (totalsByCompany.get(transaction.company) || 0) + transaction.amount);
    }

    const timingStatus = getTimingStatus(transaction);
    if (timingStatus === "overdue") {
      overdueCount += 1;
      overdueValue += transaction.amount;
    }
    if (timingStatus === "due-soon") {
      dueSoonCount += 1;
      dueSoonValue += transaction.amount;
    }
  });

  const orderedCategories = [...totalsByCategory.entries()].sort((a, b) => b[1] - a[1]);
  const orderedPartners = [...totalsByPartner.entries()].sort((a, b) => b[1] - a[1]);
  const orderedCompanies = [...totalsByCompany.entries()].sort((a, b) => b[1] - a[1]);
  const topPartner = orderedPartners[0] || ["Sem dados", 0];
  const topCompany = orderedCompanies[0] || ["Sem dados", 0];
  const averageValue = filteredTransactions.length ? totalValue / filteredTransactions.length : 0;

  return {
    filteredTransactions,
    totalValue,
    paidValue,
    pendingValue,
    paidCount,
    pendingCount,
    overdueValue,
    overdueCount,
    dueSoonValue,
    dueSoonCount,
    averageValue,
    orderedCategories,
    orderedPartners,
    orderedCompanies,
    topPartner,
    topCompany,
  };
}

function normalizeHeader(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function parseSpreadsheetNumber(value) {
  if (typeof value === "number") {
    return value;
  }

  const normalized = String(value || "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseSpreadsheetDate(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const parsed = new Date(excelEpoch.getTime() + value * 86400000);
    return parsed.toISOString().slice(0, 10);
  }

  if (!value) {
    return "";
  }

  const text = String(value).trim();
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return "";
}

function findHeaderRow(rows) {
  return rows.findIndex((row) =>
    row.some((cell) => normalizeHeader(cell) === "receita despesa")
  );
}

function getCell(record, headerMap, headerName) {
  const key = headerMap[headerName];
  return key ? record[key] : "";
}

function upsertImportedAccount(rawAccountValue) {
  const normalizedValue = String(rawAccountValue || "").trim() || "Conta importada";
  const existing = state.data.accounts.find((account) => account.bank === normalizedValue);

  if (existing) {
    return existing.id;
  }

  const account = {
    id: `acc-import-${slugify(normalizedValue)}-${Date.now()}`,
    bank: normalizedValue,
    type: "Importada",
    openingBalance: 0,
    initials: buildInitials(normalizedValue),
  };

  state.data.accounts.push(account);
  return account.id;
}

function importSpreadsheetRows(rows, fileName) {
  state.data.transactions = state.data.transactions.filter((transaction) => transaction.source !== fileName);

  const headerRowIndex = findHeaderRow(rows);

  if (headerRowIndex === -1) {
    throw new Error("Nao encontrei a linha de cabecalho com Receita/Despesa na planilha.");
  }

  const headers = rows[headerRowIndex].map((value) => String(value || "").trim());
  const headerMap = {};
  headers.forEach((header) => {
    headerMap[normalizeHeader(header)] = header;
  });

  const importedTransactions = [];
  let pendingCount = 0;
  let pendingValue = 0;
  let paidCount = 0;
  let paidValue = 0;
  let skipped = 0;

  rows.slice(headerRowIndex + 1).forEach((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index];
    });

    const receitaDespesa = String(getCell(record, headerMap, "receita despesa") || "").trim();
    const dataBaixa = parseSpreadsheetDate(getCell(record, headerMap, "data baixa"));
    const dtVencimento = parseSpreadsheetDate(getCell(record, headerMap, "dt vencimento"));
    const dtNegociacao = parseSpreadsheetDate(getCell(record, headerMap, "dt negociacao"));
    const amount =
      parseSpreadsheetNumber(getCell(record, headerMap, "valor liquido")) ||
      parseSpreadsheetNumber(getCell(record, headerMap, "vlr baixa")) ||
      parseSpreadsheetNumber(getCell(record, headerMap, "vlr do desdobramento"));
    const date =
      dataBaixa ||
      dtVencimento ||
      dtNegociacao;

    if (!receitaDespesa || !amount || !date) {
      skipped += 1;
      return;
    }

    const type = normalizeHeader(receitaDespesa).includes("despesa") ? "debit" : "credit";
    const empresa = String(getCell(record, headerMap, "empresa") || "").trim();
    const origem = String(getCell(record, headerMap, "origem") || "").trim();
    const accountId = upsertImportedAccount(empresa ? `Empresa ${empresa}` : origem || "Importacao financeira");
    const parceiro = String(getCell(record, headerMap, "parceiro") || "").trim();
    const tipoTitulo = String(getCell(record, headerMap, "tipo de titulo") || "").trim();
    const centroResultado = String(getCell(record, headerMap, "centro resultado") || "").trim();
    const nroNota = String(getCell(record, headerMap, "nro nota") || "").trim();
    const nroUnico = String(getCell(record, headerMap, "nro unico") || "").trim();
    const categoryBase =
      centroResultado ? `Centro ${centroResultado}` : tipoTitulo ? `Titulo ${tipoTitulo}` : "Importacao";
    const descriptionBase =
      parceiro ? `Parceiro ${parceiro}` : nroNota ? `Nota ${nroNota}` : nroUnico ? `Titulo ${nroUnico}` : "Importacao financeira";
    const status = dataBaixa ? "paid" : "pending";

    const uniqueRef = [
      nroUnico,
      nroNota,
      amount,
      date,
      type,
    ].join("|");

    const exists = state.data.transactions.some((transaction) => transaction.importRef === uniqueRef);
    if (exists) {
      skipped += 1;
      return;
    }

    upsertCategory(type, categoryBase);

    importedTransactions.push({
      id: `txn-import-${Date.now()}-${importedTransactions.length}`,
      createdAt: Date.now() + importedTransactions.length,
      description: descriptionBase || "Importacao financeira",
      category: categoryBase,
      accountId,
      type,
      amount,
      date,
      status,
      partner: parceiro,
      company: empresa,
      titleType: tipoTitulo,
      resultCenter: centroResultado,
      origin: origem,
      negotiationDate: dtNegociacao,
      dueDate: dtVencimento,
      settlementDate: dataBaixa,
      importRef: uniqueRef,
      source: fileName,
    });

    if (status === "pending") {
      pendingCount += 1;
      pendingValue += amount;
    } else {
      paidCount += 1;
      paidValue += amount;
    }
  });

  state.data.transactions.unshift(...importedTransactions);
  state.data.lastImport = {
    fileName,
    importedAt: new Date().toISOString(),
    importedCount: importedTransactions.length,
    skippedCount: skipped,
    pendingCount,
    pendingValue,
    paidCount,
    paidValue,
  };
  saveData();
}

function renderEmptyState(title, message, actionLabel, actionId) {
  return `
    <div class="empty-state">
      <h3>${title}</h3>
      <p>${message}</p>
      ${actionLabel ? `<button class="primary-button" type="button" data-empty-action="${actionId}">${actionLabel}</button>` : ""}
    </div>
  `;
}

function balanceIcon(visible) {
  if (visible) {
    return `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M2.5 12S6.2 5.5 12 5.5S21.5 12 21.5 12S17.8 18.5 12 18.5S2.5 12 2.5 12Z"></path>
        <circle cx="12" cy="12" r="2.8"></circle>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M3 3L21 21"></path>
      <path d="M10.6 6.2C11.05 6.06 11.52 6 12 6C17.8 6 21.5 12 21.5 12C20.92 12.98 20.22 13.88 19.42 14.68"></path>
      <path d="M14.82 14.92C14.08 15.61 13.08 16 12 16C9.24 16 7 13.76 7 11C7 9.92 7.39 8.92 8.08 8.18"></path>
      <path d="M6.12 6.1C4.61 7.17 3.42 8.76 2.5 12C2.5 12 6.2 18 12 18C13.72 18 15.25 17.43 16.58 16.61"></path>
    </svg>
  `;
}

function applyTheme(theme) {
  state.theme = theme;
  root.setAttribute("data-theme", theme);
  localStorage.setItem("full-finance-theme", theme);
}

function toggleTheme() {
  applyTheme(state.theme === "dark" ? "light" : "dark");
}

function setBalanceVisibility(visible) {
  state.balanceVisible = visible;
  const total = getDashboardMetrics().totalBalance;
  totalBalanceElement.textContent = visible ? formatCurrency(total) : "R$ •••••••";
  toggleBalanceButton.setAttribute("aria-pressed", String(!visible));
  toggleBalanceButton.setAttribute("aria-label", visible ? "Ocultar saldo" : "Mostrar saldo");
  balanceToggleIcon.innerHTML = balanceIcon(visible);
}

function setCurrentView(view) {
  state.currentView = view;
  screenTitle.textContent = viewTitles[view];

  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.view === view);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("bottom-nav__item--active", button.dataset.viewButton === view);
  });
}

function renderSummary() {
  const metrics = getDashboardMetrics();

  creditTotalElement.textContent = formatCurrency(metrics.creditTotal);
  debitTotalElement.textContent = formatCurrency(metrics.debitTotal);
  monthBalanceElement.textContent = formatCurrency(metrics.monthBalance);
  currentMonthLabel.textContent = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${metrics.currentMonth}-01T12:00:00`));
  healthRateElement.textContent = `${metrics.healthRate}%`;
  connectedAccountsElement.textContent = String(metrics.connectedAccounts);
  todayTransactionsElement.textContent = String(metrics.todayTransactions);

  if (metrics.monthBalance >= 0) {
    balanceTrendElement.textContent = "Positivo";
    balanceTrendElement.className = "badge badge-positive";
  } else {
    balanceTrendElement.textContent = "Atencao";
    balanceTrendElement.className = "badge badge-negative";
  }

  if (!state.data.accounts.length) {
    balanceMessageElement.textContent = "Cadastre sua primeira conta para iniciar o controle real.";
    lastUpdateLabel.textContent = "Sem contas";
  } else if (!state.data.transactions.length) {
    balanceMessageElement.textContent = "Sua estrutura esta pronta. Agora registre o primeiro lancamento.";
    lastUpdateLabel.textContent = "Sem movimentacoes";
  } else {
    balanceMessageElement.textContent = "Resumo atualizado com base nas transacoes salvas.";
    lastUpdateLabel.textContent = "Atualizado agora";
  }

  if (state.balanceVisible) {
    totalBalanceElement.textContent = formatCurrency(metrics.totalBalance);
  }
}

function renderAccountsDashboard() {
  if (!state.data.accounts.length) {
    accountsRow.innerHTML = renderEmptyState(
      "Nenhuma conta cadastrada",
      "Crie sua primeira conta bancaria para liberar lancamentos, saldos e relatorios.",
      "Adicionar conta",
      "new-account"
    );
    return;
  }

  accountsRow.innerHTML = state.data.accounts
    .map(
      (account) => `
        <article class="account-card">
          <div class="account-card__top">
            <div>
              <p class="section-label">${account.bank}</p>
              <strong>${formatCurrency(getAccountBalance(account.id))}</strong>
            </div>
            <span class="account-card__mask">${account.initials}</span>
          </div>
          <div class="account-card__bottom">
            <span class="account-card__type">${account.type}</span>
            <span class="section-label">Atual</span>
          </div>
        </article>
      `
    )
    .join("");
}

function iconByType(type) {
  if (type === "credit") {
    return `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 5V19M5 12H19"></path>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M5 12H19"></path>
    </svg>
  `;
}

function buildTransactionItem(transaction) {
  const account = getAccountById(transaction.accountId);
  const status = transaction.status === "pending" ? "Pendente" : "Baixado";
  return `
    <article class="transaction-item">
      <div class="transaction-item__lead">
        <div class="transaction-item__icon transaction-item__icon--${transaction.type}">
          ${iconByType(transaction.type)}
        </div>
        <div>
          <strong>${transaction.description}</strong>
          <p class="transaction-item__meta">${transaction.category} • ${account ? account.bank : "Conta removida"} • ${formatDateLabel(transaction.date)}</p>
        </div>
      </div>
      <div class="transaction-item__side">
        <span class="transaction-item__status transaction-item__status--${transaction.status === "pending" ? "pending" : "paid"}">${status}</span>
        <span class="transaction-item__value transaction-item__value--${transaction.type}">
          ${transaction.type === "credit" ? "+" : "-"} ${formatCurrency(transaction.amount)}
        </span>
        <div class="transaction-item__buttons">
          <button class="mini-button" type="button" data-edit-transaction="${transaction.id}">Editar</button>
          <button class="mini-button mini-button--danger" type="button" data-delete-transaction="${transaction.id}">Excluir</button>
        </div>
      </div>
    </article>
  `;
}

function renderRecentTransactions() {
  const recentTransactions = getTransactionsSorted().slice(0, 5);

  if (!recentTransactions.length) {
    recentTransactionsList.innerHTML = renderEmptyState(
      "Nenhum lancamento ainda",
      "Use o botao central para registrar seu primeiro credito ou debito.",
      state.data.accounts.length ? "Novo lancamento" : "Adicionar conta",
      state.data.accounts.length ? "new-transaction" : "new-account"
    );
    return;
  }

  recentTransactionsList.innerHTML = recentTransactions.map(buildTransactionItem).join("");
}

function renderChart() {
  chartBars.innerHTML = getMonthlyChartData()
    .map(
      (item) => `
        <div class="chart-bar">
          <div class="chart-bar__stack">
            <div class="chart-bar__fill chart-bar__fill--credit" style="height: ${item.creditHeight}%"></div>
            <div class="chart-bar__fill chart-bar__fill--debit" style="height: ${item.debitHeight}%"></div>
          </div>
          <span>${item.label}</span>
          <small>${item.positive ? "Positivo" : "Negativo"}</small>
        </div>
      `
    )
    .join("");
}

function renderAccountOptions() {
  entryAccount.innerHTML = state.data.accounts
    .map((account) => `<option value="${account.id}">${account.bank} • ${account.type}</option>`)
    .join("");
}

function renderCategorySuggestions() {
  categorySuggestions.innerHTML = state.data.categories[state.entryType]
    .map((category) => `<option value="${category}"></option>`)
    .join("");
}

function setEntryType(type) {
  state.entryType = type;
  entryTypeInput.value = type;
  typeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.typeSelect === type);
  });
  renderCategorySuggestions();
}

function renderTransactionFilters() {
  filterAccount.innerHTML = `<option value="all">Todas</option>${state.data.accounts
    .map((account) => `<option value="${account.id}">${account.bank}</option>`)
    .join("")}`;

  const months = [...new Set(state.data.transactions.map((transaction) => getMonthKey(transaction.date)))].sort().reverse();
  filterMonth.innerHTML = `<option value="all">Todos</option>${months
    .map((month) => {
      const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`));
      return `<option value="${month}">${label}</option>`;
    })
    .join("")}`;

  filterType.value = state.filters.type;
  filterAccount.value = state.filters.account;
  filterMonth.value = state.filters.month;
}

function renderReportFilters() {
  const partners = [...new Set(state.data.transactions.map((transaction) => transaction.partner).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  const companies = [...new Set(state.data.transactions.map((transaction) => transaction.company).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  const origins = [...new Set(state.data.transactions.map((transaction) => transaction.origin).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  const titleTypes = [...new Set(state.data.transactions.map((transaction) => transaction.titleType).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  const resultCenters = [...new Set(state.data.transactions.map((transaction) => transaction.resultCenter).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  const months = [...new Set(state.data.transactions.map((transaction) => getMonthKey(transaction.date)))].sort().reverse();

  reportFilterPartner.innerHTML = `<option value="all">Todos</option>${partners
    .map((partner) => `<option value="${partner}">${partner}</option>`)
    .join("")}`;

  reportFilterCompany.innerHTML = `<option value="all">Todas</option>${companies
    .map((company) => `<option value="${company}">${company}</option>`)
    .join("")}`;

  reportFilterMonth.innerHTML = `<option value="all">Todos</option>${months
    .map((month) => {
      const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`));
      return `<option value="${month}">${label}</option>`;
    })
    .join("")}`;

  reportFilterOrigin.innerHTML = `<option value="all">Todas</option>${origins
    .map((origin) => `<option value="${origin}">${origin}</option>`)
    .join("")}`;

  reportFilterTitleType.innerHTML = `<option value="all">Todos</option>${titleTypes
    .map((titleType) => `<option value="${titleType}">${titleType}</option>`)
    .join("")}`;

  reportFilterResultCenter.innerHTML = `<option value="all">Todos</option>${resultCenters
    .map((resultCenter) => `<option value="${resultCenter}">${resultCenter}</option>`)
    .join("")}`;

  if (![...reportFilterPartner.options].some((option) => option.value === state.reportFilters.partner)) {
    state.reportFilters.partner = "all";
  }

  if (![...reportFilterCompany.options].some((option) => option.value === state.reportFilters.company)) {
    state.reportFilters.company = "all";
  }

  if (![...reportFilterMonth.options].some((option) => option.value === state.reportFilters.month)) {
    state.reportFilters.month = "all";
  }

  if (![...reportFilterOrigin.options].some((option) => option.value === state.reportFilters.origin)) {
    state.reportFilters.origin = "all";
  }

  if (![...reportFilterTitleType.options].some((option) => option.value === state.reportFilters.titleType)) {
    state.reportFilters.titleType = "all";
  }

  if (![...reportFilterResultCenter.options].some((option) => option.value === state.reportFilters.resultCenter)) {
    state.reportFilters.resultCenter = "all";
  }

  reportFilterType.value = state.reportFilters.type;
  reportFilterStatus.value = state.reportFilters.status;
  reportFilterPartner.value = state.reportFilters.partner;
  reportFilterCompany.value = state.reportFilters.company;
  reportFilterMonth.value = state.reportFilters.month;
  reportFilterOrigin.value = state.reportFilters.origin;
  reportFilterTitleType.value = state.reportFilters.titleType;
  reportFilterResultCenter.value = state.reportFilters.resultCenter;
  reportFilterTiming.value = state.reportFilters.timing;
}

function renderAllTransactions() {
  const filteredTransactions = getFilteredTransactions();

  if (!filteredTransactions.length) {
    allTransactionsList.innerHTML = renderEmptyState(
      "Nenhum resultado encontrado",
      "Ajuste os filtros ou cadastre um novo lancamento para preencher esta tela.",
      state.data.accounts.length ? "Novo lancamento" : "Adicionar conta",
      state.data.accounts.length ? "new-transaction" : "new-account"
    );
    return;
  }

  allTransactionsList.innerHTML = filteredTransactions.map(buildTransactionItem).join("");
}

function buildReportTitleCard(transaction) {
  const account = getAccountById(transaction.accountId);
  const timingStatus = getTimingStatus(transaction);
  const timingLabel =
    timingStatus === "overdue"
      ? "Vencido"
      : timingStatus === "due-soon"
        ? "A vencer"
        : timingStatus === "future"
          ? "Futuro"
          : timingStatus === "no-due-date"
            ? "Sem vencimento"
            : "Baixado";
  const dueLabel = transaction.dueDate ? formatDateLabel(transaction.dueDate) : "Sem data";

  return `
    <article class="report-title-card">
      <div class="report-title-card__header">
        <div class="report-title-card__title">
          <strong>${transaction.description}</strong>
          <p class="transaction-item__meta">${transaction.partner || "Sem parceiro"} • Empresa ${transaction.company || "-"}</p>
        </div>
        <span class="transaction-item__status transaction-item__status--${transaction.status === "pending" ? "pending" : "paid"}">
          ${transaction.status === "pending" ? "Pendente" : "Baixado"}
        </span>
      </div>
      <div class="stack-row__meta">
        <span class="stack-pill">${transaction.titleType || "Sem tipo"}</span>
        <span class="stack-pill">${transaction.resultCenter || "Sem centro"}</span>
        <span class="stack-pill">${transaction.origin || (account ? account.bank : "Sem origem")}</span>
        <span class="stack-pill">${timingLabel}</span>
      </div>
      <div class="report-title-card__footer">
        <div>
          <p class="section-label">Vencimento</p>
          <strong>${dueLabel}</strong>
        </div>
        <div>
          <p class="section-label">Negociacao</p>
          <strong>${transaction.negotiationDate ? formatDateLabel(transaction.negotiationDate) : "Sem data"}</strong>
        </div>
        <div>
          <p class="section-label">Baixa</p>
          <strong>${transaction.settlementDate ? formatDateLabel(transaction.settlementDate) : "Em aberto"}</strong>
        </div>
        <span class="report-title-card__amount">${formatCurrency(transaction.amount)}</span>
      </div>
    </article>
  `;
}

function renderAccountsManager() {
  if (!state.data.accounts.length) {
    accountsManagerList.innerHTML = renderEmptyState(
      "Nenhuma conta cadastrada",
      "Crie uma conta real para comecar a lancar entradas e saidas com saldo correto.",
      "Adicionar conta",
      "new-account"
    );
    return;
  }

  accountsManagerList.innerHTML = state.data.accounts
    .map(
      (account) => `
        <article class="manager-card">
          <div class="manager-card__meta">
            <div>
              <h3>${account.bank}</h3>
              <small>${account.type}</small>
            </div>
            <strong>${formatCurrency(getAccountBalance(account.id))}</strong>
          </div>
          <div class="manager-card__actions">
            <button class="action-button" type="button" data-edit-account="${account.id}">Editar</button>
            <button class="danger-button" type="button" data-delete-account="${account.id}">Excluir</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderReports() {
  const metrics = getReportMetrics();

  reportTotalValue.textContent = formatCurrency(metrics.totalValue);
  reportTotalCount.textContent = `${metrics.filteredTransactions.length} titulos no filtro`;
  reportPendingValue.textContent = formatCurrency(metrics.pendingValue);
  reportPendingCount.textContent = `${metrics.pendingCount} titulos em aberto`;
  reportPaidValue.textContent = formatCurrency(metrics.paidValue);
  reportPaidCount.textContent = `${metrics.paidCount} titulos quitados`;
  topPartnerName.textContent = metrics.topPartner[0];
  topPartnerValue.textContent = formatCurrency(metrics.topPartner[1]);
  topCompanyName.textContent = metrics.topCompany[0];
  topCompanyValue.textContent = formatCurrency(metrics.topCompany[1]);
  reportOverdueValue.textContent = formatCurrency(metrics.overdueValue);
  reportOverdueCount.textContent = `${metrics.overdueCount} titulos vencidos`;
  reportDueSoonValue.textContent = formatCurrency(metrics.dueSoonValue);
  reportDueSoonCount.textContent = `${metrics.dueSoonCount} titulos no radar`;
  reportAverageValue.textContent = formatCurrency(metrics.averageValue);
  reportAverageLabel.textContent = `Media de ${metrics.filteredTransactions.length} titulos`;

  if (!metrics.filteredTransactions.length) {
    categoryBreakdown.innerHTML = renderEmptyState(
      "Sem dados para esse filtro",
      "Ajuste os filtros para visualizar quitadas, em aberto, parceiros e categorias do periodo.",
      "",
      ""
    );
    partnerBreakdown.innerHTML = renderEmptyState(
      "Sem parceiros para esse filtro",
      "Refine a selecao ou importe mais titulos para enxergar a concentracao por parceiro.",
      "",
      ""
    );
    reportTitlesList.innerHTML = renderEmptyState(
      "Nenhum titulo encontrado",
      "Os titulos filtrados aparecem aqui com parceiro, empresa, vencimento e baixa.",
      "",
      ""
    );
  } else {
    categoryBreakdown.innerHTML = metrics.orderedCategories
      .map(
        ([category, value]) => `
          <div class="stack-row">
            <div>
              <strong>${category}</strong>
              <p class="section-label">Categoria</p>
            </div>
            <span class="stack-row__value">${formatCurrency(value)}</span>
          </div>
        `
      )
      .join("");

    partnerBreakdown.innerHTML = metrics.orderedPartners.length
      ? metrics.orderedPartners
          .slice(0, 8)
          .map(
            ([partner, value]) => `
              <div class="stack-row">
                <div>
                  <strong>${partner}</strong>
                  <div class="stack-row__meta">
                    <span class="stack-pill">${state.reportFilters.status === "pending" ? "Em aberto" : state.reportFilters.status === "paid" ? "Quitadas" : "Geral"}</span>
                    <span class="stack-pill">${metrics.filteredTransactions.filter((transaction) => transaction.partner === partner).length} titulos</span>
                  </div>
                </div>
                <span class="stack-row__value">${formatCurrency(value)}</span>
              </div>
            `
          )
          .join("")
      : renderEmptyState(
          "Sem parceiros nessa selecao",
          "Quando houver importacoes com parceiro preenchido, a concentracao aparece aqui.",
          "",
          ""
        );

    reportTitlesList.innerHTML = metrics.filteredTransactions
      .slice()
      .sort((a, b) => {
        const dateA = a.dueDate || a.date;
        const dateB = b.dueDate || b.date;
        return new Date(dateA) - new Date(dateB);
      })
      .slice(0, 20)
      .map(buildReportTitleCard)
      .join("");
  }

  if (!state.data.lastImport) {
    importSummary.innerHTML = renderEmptyState(
      "Nenhuma importacao executada",
      "Use o botao de importar planilha para trazer os dados do Excel para o sistema.",
      "Importar planilha",
      "import-sheet"
    );
    return;
  }

  importSummary.innerHTML = `
    <div class="stack-row">
      <div>
        <strong>${state.data.lastImport.fileName}</strong>
        <p class="section-label">Arquivo importado</p>
      </div>
      <span class="stack-row__value">${state.data.lastImport.importedCount} linhas</span>
    </div>
    <div class="stack-row">
      <div>
        <strong>Linhas ignoradas</strong>
        <p class="section-label">Duplicadas ou incompletas</p>
      </div>
      <span class="stack-row__value">${state.data.lastImport.skippedCount}</span>
    </div>
    <div class="stack-row">
      <div>
        <strong>Titulos baixados</strong>
        <p class="section-label">Com data baixa preenchida</p>
      </div>
      <span class="stack-row__value">${state.data.lastImport.paidCount} • ${formatCurrency(state.data.lastImport.paidValue)}</span>
    </div>
    <div class="stack-row">
      <div>
        <strong>Titulos pendentes</strong>
        <p class="section-label">Sem data baixa</p>
      </div>
      <span class="stack-row__value">${state.data.lastImport.pendingCount} • ${formatCurrency(state.data.lastImport.pendingValue)}</span>
    </div>
    <div class="stack-row">
      <div>
        <strong>Importado em</strong>
        <p class="section-label">Ultima carga registrada</p>
      </div>
      <span class="stack-row__value">${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(state.data.lastImport.importedAt))}</span>
    </div>
  `;
}

function renderDashboard() {
  renderSummary();
  renderAccountsDashboard();
  renderRecentTransactions();
  renderChart();
}

function renderApp() {
  renderDashboard();
  renderTransactionFilters();
  renderAllTransactions();
  renderAccountsManager();
  renderReportFilters();
  renderReports();
}

function setQuickMenu(open) {
  state.quickMenuOpen = open;
  quickMenu.hidden = !open;
  quickMenu.classList.toggle("is-open", open);
  fabButton.setAttribute("aria-expanded", String(open));
}

function openTransactionModal(type = "credit", transaction = null) {
  if (!state.data.accounts.length) {
    setCurrentView("accounts");
    openAccountModal();
    return;
  }

  transactionForm.reset();
  renderAccountOptions();

  if (transaction) {
    state.editingTransactionId = transaction.id;
    transactionIdInput.value = transaction.id;
    entryDescription.value = transaction.description;
    entryAmount.value = transaction.amount;
    entryDate.value = transaction.date;
    entryAccount.value = transaction.accountId;
    setEntryType(transaction.type);
    entryCategory.value = transaction.category;
    document.getElementById("transactionModalTitle").textContent = "Editar lancamento";
  } else {
    state.editingTransactionId = null;
    transactionIdInput.value = "";
    setEntryType(type);
    entryDate.value = getTodayKey();
    document.getElementById("transactionModalTitle").textContent = "Novo lancamento";
  }

  transactionModal.hidden = false;
  document.body.style.overflow = "hidden";
  entryDescription.focus();
}

function closeTransactionModal() {
  transactionModal.hidden = true;
  document.body.style.overflow = "";
}

function openAccountModal(account = null) {
  accountForm.reset();

  if (account) {
    state.editingAccountId = account.id;
    accountIdInput.value = account.id;
    accountBank.value = account.bank;
    accountType.value = account.type;
    accountOpeningBalance.value = account.openingBalance;
    document.getElementById("accountModalTitle").textContent = "Editar conta";
  } else {
    state.editingAccountId = null;
    accountIdInput.value = "";
    accountOpeningBalance.value = "0";
    document.getElementById("accountModalTitle").textContent = "Nova conta";
  }

  accountModal.hidden = false;
  document.body.style.overflow = "hidden";
  accountBank.focus();
}

function closeAccountModal() {
  accountModal.hidden = true;
  document.body.style.overflow = "";
}

function upsertAccount(formData) {
  const payload = {
    bank: String(formData.get("bank")).trim(),
    type: String(formData.get("type")).trim(),
    openingBalance: Number(formData.get("openingBalance") || 0),
  };

  if (state.editingAccountId) {
    state.data.accounts = state.data.accounts.map((account) =>
      account.id === state.editingAccountId
        ? { ...account, ...payload, initials: buildInitials(payload.bank) }
        : account
    );
  } else {
    state.data.accounts.unshift({
      id: `acc-${slugify(payload.bank)}-${Date.now()}`,
      initials: buildInitials(payload.bank),
      ...payload,
    });
  }

  saveData();
}

function upsertTransaction(formData) {
  const transaction = {
    description: String(formData.get("description")).trim(),
    category: String(formData.get("category")).trim(),
    accountId: String(formData.get("accountId")),
    type: String(formData.get("type")) === "debit" ? "debit" : "credit",
    amount: Number(formData.get("amount")),
    date: String(formData.get("date")),
    status: "paid",
  };

  upsertCategory(transaction.type, transaction.category);

  if (state.editingTransactionId) {
    state.data.transactions = state.data.transactions.map((item) =>
      item.id === state.editingTransactionId ? { ...item, ...transaction } : item
    );
  } else {
    state.data.transactions.unshift({
      id: `txn-${Date.now()}`,
      createdAt: Date.now(),
      ...transaction,
    });
  }

  saveData();
}

function deleteTransaction(transactionId) {
  state.data.transactions = state.data.transactions.filter((transaction) => transaction.id !== transactionId);
  saveData();
}

function deleteAccount(accountId) {
  state.data.accounts = state.data.accounts.filter((account) => account.id !== accountId);
  state.data.transactions = state.data.transactions.filter((transaction) => transaction.accountId !== accountId);
  saveData();
}

function resetAppData() {
  state.data = JSON.parse(JSON.stringify(defaultData));
  state.filters = {
    search: "",
    type: "all",
    account: "all",
    month: "all",
  };
  state.reportFilters = {
    type: "all",
    status: "all",
    partner: "all",
    company: "all",
    month: "all",
    origin: "all",
    titleType: "all",
    resultCenter: "all",
    timing: "all",
  };
  searchInput.value = "";
  filterType.value = "all";
  filterAccount.value = "all";
  filterMonth.value = "all";
  reportFilterType.value = "all";
  reportFilterStatus.value = "all";
  reportFilterPartner.value = "all";
  reportFilterCompany.value = "all";
  reportFilterMonth.value = "all";
  reportFilterOrigin.value = "all";
  reportFilterTitleType.value = "all";
  reportFilterResultCenter.value = "all";
  reportFilterTiming.value = "all";
  localStorage.removeItem(STORAGE_KEY);
}

function bindDynamicActions() {
  document.querySelectorAll("[data-empty-action='new-account']").forEach((button) => {
    button.onclick = () => openAccountModal();
  });

  document.querySelectorAll("[data-empty-action='new-transaction']").forEach((button) => {
    button.onclick = () => openTransactionModal("credit");
  });

  document.querySelectorAll("[data-empty-action='import-sheet']").forEach((button) => {
    button.onclick = () => spreadsheetInput.click();
  });

  document.querySelectorAll("[data-edit-transaction]").forEach((button) => {
    button.onclick = () => {
      const transaction = state.data.transactions.find((item) => item.id === button.dataset.editTransaction);
      if (transaction) {
        openTransactionModal(transaction.type, transaction);
      }
    };
  });

  document.querySelectorAll("[data-delete-transaction]").forEach((button) => {
    button.onclick = () => {
      deleteTransaction(button.dataset.deleteTransaction);
      renderAndBind();
      setBalanceVisibility(state.balanceVisible);
    };
  });

  document.querySelectorAll("[data-edit-account]").forEach((button) => {
    const account = getAccountById(button.dataset.editAccount);
    button.onclick = () => openAccountModal(account);
  });

  document.querySelectorAll("[data-delete-account]").forEach((button) => {
    button.onclick = () => {
      deleteAccount(button.dataset.deleteAccount);
      renderAndBind();
      setBalanceVisibility(state.balanceVisible);
    };
  });
}

function renderAndBind() {
  renderApp();
  bindDynamicActions();
}

function initialize() {
  applyTheme(state.theme);
  setEntryType("credit");
  setCurrentView("dashboard");
  renderAndBind();
  setBalanceVisibility(true);
  closeTransactionModal();
  closeAccountModal();

  themeToggle.addEventListener("click", toggleTheme);
  toggleBalanceButton.addEventListener("click", () => setBalanceVisibility(!state.balanceVisible));

  navButtons.forEach((button) => {
    button.addEventListener("click", () => setCurrentView(button.dataset.viewButton));
  });

  goViewButtons.forEach((button) => {
    button.addEventListener("click", () => setCurrentView(button.dataset.goView));
  });

  fabButton.addEventListener("click", () => setQuickMenu(!state.quickMenuOpen));

  quickMenuButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setQuickMenu(false);
      openTransactionModal(button.dataset.entryType);
    });
  });

  typeButtons.forEach((button) => {
    button.addEventListener("click", () => setEntryType(button.dataset.typeSelect));
  });

  closeTransactionModalButton.addEventListener("click", closeTransactionModal);
  cancelTransactionButton.addEventListener("click", closeTransactionModal);
  closeAccountModalButton.addEventListener("click", closeAccountModal);
  cancelAccountButton.addEventListener("click", closeAccountModal);

  openAccountModalButton.addEventListener("click", () => openAccountModal());
  newAccountButton.addEventListener("click", () => openAccountModal());
  addTransactionInlineButton.addEventListener("click", () => openTransactionModal("credit"));
  importSpreadsheetButton.addEventListener("click", () => spreadsheetInput.click());
  resetDataButton.addEventListener("click", () => {
    resetAppData();
    renderAndBind();
    setBalanceVisibility(true);
    setCurrentView("dashboard");
  });

  transactionModal.addEventListener("click", (event) => {
    if (event.target === transactionModal) {
      closeTransactionModal();
    }
  });

  accountModal.addEventListener("click", (event) => {
    if (event.target === accountModal) {
      closeAccountModal();
    }
  });

  transactionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    upsertTransaction(new FormData(transactionForm));
    renderAndBind();
    setBalanceVisibility(state.balanceVisible);
    closeTransactionModal();
    setCurrentView("transactions");
  });

  accountForm.addEventListener("submit", (event) => {
    event.preventDefault();
    upsertAccount(new FormData(accountForm));
    renderAndBind();
    setBalanceVisibility(state.balanceVisible);
    closeAccountModal();
  });

  spreadsheetInput.addEventListener("change", async () => {
    const file = spreadsheetInput.files?.[0];
    if (!file) {
      return;
    }

    if (typeof XLSX === "undefined") {
      spreadsheetInput.value = "";
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "", raw: true });

      importSpreadsheetRows(rows, file.name);
      renderAndBind();
      setBalanceVisibility(state.balanceVisible);
      setCurrentView("reports");
    } catch (error) {
      console.error(error);
    }

    spreadsheetInput.value = "";
  });

  searchInput.addEventListener("input", () => {
    state.filters.search = searchInput.value.trim().toLowerCase();
    renderAndBind();
  });

  filterType.addEventListener("change", () => {
    state.filters.type = filterType.value;
    renderAndBind();
  });

  filterAccount.addEventListener("change", () => {
    state.filters.account = filterAccount.value;
    renderAndBind();
  });

  filterMonth.addEventListener("change", () => {
    state.filters.month = filterMonth.value;
    renderAndBind();
  });

  reportFilterType.addEventListener("change", () => {
    state.reportFilters.type = reportFilterType.value;
    renderAndBind();
  });

  reportFilterStatus.addEventListener("change", () => {
    state.reportFilters.status = reportFilterStatus.value;
    renderAndBind();
  });

  reportFilterPartner.addEventListener("change", () => {
    state.reportFilters.partner = reportFilterPartner.value;
    renderAndBind();
  });

  reportFilterCompany.addEventListener("change", () => {
    state.reportFilters.company = reportFilterCompany.value;
    renderAndBind();
  });

  reportFilterMonth.addEventListener("change", () => {
    state.reportFilters.month = reportFilterMonth.value;
    renderAndBind();
  });

  reportFilterOrigin.addEventListener("change", () => {
    state.reportFilters.origin = reportFilterOrigin.value;
    renderAndBind();
  });

  reportFilterTitleType.addEventListener("change", () => {
    state.reportFilters.titleType = reportFilterTitleType.value;
    renderAndBind();
  });

  reportFilterResultCenter.addEventListener("change", () => {
    state.reportFilters.resultCenter = reportFilterResultCenter.value;
    renderAndBind();
  });

  reportFilterTiming.addEventListener("change", () => {
    state.reportFilters.timing = reportFilterTiming.value;
    renderAndBind();
  });

  document.addEventListener("click", (event) => {
    if (state.quickMenuOpen && !quickMenu.contains(event.target) && !fabButton.contains(event.target)) {
      setQuickMenu(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (!transactionModal.hidden) {
      closeTransactionModal();
      return;
    }

    if (!accountModal.hidden) {
      closeAccountModal();
      return;
    }

    if (state.quickMenuOpen) {
      setQuickMenu(false);
    }
  });
}

initialize();
