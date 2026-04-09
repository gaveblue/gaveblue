let allVehicles = [];
    let allDrivers = [];
    let allSuppliers = [];
    let allOrders = [];
    let allFinanceEntries = [];
    let deletedOrders = [];
    const globalSearchInputEl = document.getElementById('global-search-input');
    const globalSearchResultsEl = document.getElementById('global-search-results');
    const mobileGlobalSearchInputEl = document.getElementById('mobile-global-search-input');
    const mobileGlobalSearchResultsEl = document.getElementById('mobile-global-search-results');
    const searchFocusOverlayEl = document.getElementById('search-focus-overlay');
    const mobileSearchBtnEl = document.getElementById('mobile-search-btn');
    const mobileSearchBackdropEl = document.getElementById('mobile-search-backdrop');
    const mobileSearchModalEl = document.getElementById('mobile-search-modal');
    const ecosystemModules = [
      { name: 'WeTime', description: 'Relógio online e painel de horário', url: 'https://gaveblue.com/wetime' },
      { name: 'WeRecibos', description: 'Gerador de recibos', url: 'https://gaveblue.com/recibos' },
      { name: 'WeConsultas', description: 'Consultas empresariais', url: 'https://gaveblue.com/weconsultas' },
      { name: 'WeFrotas', description: 'Gestão de frotas', url: 'https://gaveblue.com/wefrotas' },
      { name: 'WeDevs', description: 'Ferramentas e utilidades dev', url: 'https://gaveblue.com/wedevs' },
      { name: 'WeTasks', description: 'Tarefas e organização', url: 'https://gaveblue.com/wetasks' }
    ];
    let selectedVehicles = new Set();
    let selectedDrivers = new Set();
    let selectedSuppliers = new Set();
    let selectedOrders = new Set();
    let selectedFinance = new Set();
    let currentModalType = null;
    let currentEditingId = null;
    let currentFinanceEntryType = null;
    let systemNotifications = [];
    let pendingBatchImportEntity = null;
    let pendingPromptConfirm = null;
    let filteredModules = [];
    let highlightedModuleIndex = -1;
    let activeSearchInputEl = null;
    let activeSearchResultsEl = null;
    let orderCounter = 1;
    const wefrotasLogoSrc = new URL('wefrotas.png', window.location.href).href;
    let customLogoEnabled = false;
    let customLogoUrl = '';
    let customLogoScale = 60;
    let promptModalConfig = {
      allowEmpty: false,
      exactValue: '',
      confirmLabel: 'Confirmar'
    };

    function generateId() {
      return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function getLocalIsoDate() {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      return new Date(now.getTime() - offset).toISOString().slice(0, 10);
    }

    function getActiveLogoSrc() {
      return customLogoEnabled && customLogoUrl ? customLogoUrl : wefrotasLogoSrc;
    }

    function getReportLogoStyle() {
      const scale = Number(customLogoScale || 60) / 100;
      return {
        width: Math.round(320 * scale),
        height: Math.round(110 * scale)
      };
    }

    function getOsLogoStyle() {
      const scale = Number(customLogoScale || 60) / 100;
      return {
        width: Math.round(220 * scale),
        height: Math.round(78 * scale)
      };
    }

    function updateCustomLogoUi() {
      const toggleButton = document.getElementById('settings-custom-logo-toggle');
      const fileInput = document.getElementById('settings-custom-logo-file');
      const preview = document.getElementById('settings-custom-logo-preview');
      const hint = document.getElementById('settings-custom-logo-hint');
      const sizeInput = document.getElementById('settings-custom-logo-size');
      const sizeLabel = document.getElementById('settings-custom-logo-size-label');
      if (!toggleButton || !fileInput || !preview || !hint || !sizeInput || !sizeLabel) return;

      sizeInput.value = String(customLogoScale || 60);
      sizeLabel.textContent = `${customLogoScale || 60}%`;
      toggleButton.textContent = customLogoEnabled ? 'Desativar logo personalizada' : 'Ativar logo personalizada';
      toggleButton.classList.toggle('active', customLogoEnabled);
      preview.hidden = !customLogoUrl;
      preview.src = customLogoUrl || '';
      hint.textContent = customLogoEnabled && customLogoUrl
        ? 'A logo personalizada está ativa e será usada nas OS e relatórios.'
        : customLogoUrl
          ? 'A imagem foi carregada. Ative ou salve a personalização para usar essa logo nas OS e relatórios.'
          : 'Envie uma imagem do seu computador. Se a chave estiver desligada, o sistema continua usando a logo padrão.';
    }

    function toggleCustomLogoEnabled() {
      if (!customLogoEnabled && !customLogoUrl) {
        showToast('Envie uma logo antes de ativar a personalização.');
        return;
      }
      customLogoEnabled = !customLogoEnabled;
      updateCustomLogoUi();
    }

    function handleCustomLogoUpload(event) {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast('Selecione um arquivo de imagem válido.');
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        customLogoUrl = String(loadEvent.target?.result || '');
        customLogoEnabled = true;
        updateCustomLogoUi();
        showToast('Logo carregada. Agora clique em salvar para aplicar.');
      };
      reader.readAsDataURL(file);
    }

    function saveCustomLogoSettings() {
      if (customLogoEnabled && !customLogoUrl) {
        showToast('Envie uma logo para ativar a personalização.');
        return;
      }

      openSettingsFeedback('loading', 'Salvando personalização', 'Aguarde enquanto aplicamos a sua logo personalizada.');
      const sizeInput = document.getElementById('settings-custom-logo-size');
      customLogoScale = Number(sizeInput?.value || 60);
      saveToLocalStorage();
      updateCustomLogoUi();
      setTimeout(() => {
        openSettingsFeedback(
          'success',
          customLogoEnabled ? 'Logo personalizada salva' : 'Logo padrão restaurada',
          customLogoEnabled
            ? 'A sua personalização foi salva com sucesso e já está pronta para uso nas OS e relatórios.'
            : 'O sistema voltou a usar a logo padrão com sucesso.'
        );
      }, 700);
    }

    function formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(`${dateString}T00:00:00`);
      if (Number.isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('pt-BR');
    }

    function formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
    }

    function daysUntil(dateString) {
      if (!dateString) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(`${dateString}T00:00:00`);
      if (Number.isNaN(target.getTime())) return null;
      return Math.ceil((target.getTime() - today.getTime()) / 86400000);
    }

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function requiredLabel(text) {
      return `${text} <span class="required-mark">*</span>`;
    }

    function onlyDigits(value) {
      return String(value || '').replace(/\D/g, '');
    }

    function formatCpf(value) {
      const digits = onlyDigits(value).slice(0, 11);
      return digits
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1-$2');
    }

    function formatCnpj(value) {
      const digits = onlyDigits(value).slice(0, 14);
      return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }

    function formatCpfOrCnpj(value) {
      const digits = onlyDigits(value);
      return digits.length <= 11 ? formatCpf(digits) : formatCnpj(digits);
    }

    function isRepeatedDigits(value) {
      return /^(\d)\1+$/.test(value);
    }

    function isValidCpf(value) {
      const cpf = onlyDigits(value);
      if (cpf.length !== 11 || isRepeatedDigits(cpf)) return false;
      let sum = 0;
      for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i);
      let firstDigit = (sum * 10) % 11;
      if (firstDigit === 10) firstDigit = 0;
      if (firstDigit !== Number(cpf[9])) return false;
      sum = 0;
      for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i);
      let secondDigit = (sum * 10) % 11;
      if (secondDigit === 10) secondDigit = 0;
      return secondDigit === Number(cpf[10]);
    }

    function isValidCnpj(value) {
      const cnpj = onlyDigits(value);
      if (cnpj.length !== 14 || isRepeatedDigits(cnpj)) return false;
      const calcDigit = (base, factors) => {
        const total = base.split('').reduce((sum, digit, index) => sum + (Number(digit) * factors[index]), 0);
        const remainder = total % 11;
        return remainder < 2 ? 0 : 11 - remainder;
      };
      const base = cnpj.slice(0, 12);
      const digit1 = calcDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
      const digit2 = calcDigit(base + digit1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
      return cnpj === `${base}${digit1}${digit2}`;
    }

    function attachModalInputMasks() {
      const driverCpf = document.getElementById('driver-cpf');
      const supplierDocument = document.getElementById('supplier-document');
      if (driverCpf) {
        driverCpf.addEventListener('input', () => {
          driverCpf.value = formatCpf(driverCpf.value);
        });
      }
      if (supplierDocument) {
        supplierDocument.addEventListener('input', () => {
          supplierDocument.value = formatCpfOrCnpj(supplierDocument.value);
        });
      }
    }

    function navigateToModule(url) {
      window.location.href = url;
    }

    function setActiveSearchContext(inputEl, resultsEl) {
      activeSearchInputEl = inputEl;
      activeSearchResultsEl = resultsEl;
    }

    function openMobileSearch() {
      if (!mobileSearchModalEl || !mobileSearchBackdropEl || !mobileGlobalSearchInputEl) return;
      mobileSearchModalEl.classList.add('open');
      mobileSearchBackdropEl.classList.add('open');
      setActiveSearchContext(mobileGlobalSearchInputEl, mobileGlobalSearchResultsEl);
      updateGlobalSearch(mobileGlobalSearchInputEl.value || '');
      setTimeout(() => mobileGlobalSearchInputEl.focus(), 40);
    }

    function closeMobileSearch() {
      if (!mobileSearchModalEl || !mobileSearchBackdropEl) return;
      mobileSearchModalEl.classList.remove('open');
      mobileSearchBackdropEl.classList.remove('open');
      if (mobileGlobalSearchResultsEl) {
        mobileGlobalSearchResultsEl.classList.add('hidden');
      }
    }

    function hideGlobalSearchResults() {
      globalSearchResultsEl.classList.add('hidden');
      if (mobileGlobalSearchResultsEl) mobileGlobalSearchResultsEl.classList.add('hidden');
      searchFocusOverlayEl.classList.add('hidden');
      closeMobileSearch();
      highlightedModuleIndex = -1;
    }

    function syncHighlightedGlobalSearchItem() {
      const items = (activeSearchResultsEl || globalSearchResultsEl).querySelectorAll('.global-search-item');
      items.forEach((item, index) => {
        item.classList.toggle('active', index === highlightedModuleIndex);
      });
    }

    function renderGlobalSearchResults(modules, resultsEl = globalSearchResultsEl) {
      filteredModules = modules;
      highlightedModuleIndex = modules.length ? 0 : -1;
      activeSearchResultsEl = resultsEl;

      if (!modules.length) {
        resultsEl.innerHTML = '<div class="global-search-empty">Nenhum módulo encontrado.</div>';
        resultsEl.classList.remove('hidden');
        if (resultsEl === globalSearchResultsEl) {
          searchFocusOverlayEl.classList.remove('hidden');
        }
        return;
      }

      resultsEl.innerHTML = modules.map((module, index) => `
        <button type="button" class="global-search-item${index === highlightedModuleIndex ? ' active' : ''}" data-url="${module.url}">
          <span>
            <span class="global-search-kicker">Ecossistema GaveBlue</span>
            <span class="block font-semibold text-sm">${escapeHtml(module.name)}</span>
            <span class="global-search-route">${escapeHtml(module.description)}</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color:rgba(191,219,254,0.95)">
            <path d="M7 17L17 7" stroke-width="2" stroke-linecap="round"></path>
            <path d="M9 7H17V15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>
      `).join('');

      resultsEl.classList.remove('hidden');
      if (resultsEl === globalSearchResultsEl) {
        searchFocusOverlayEl.classList.remove('hidden');
      }
    }

    function updateGlobalSearch(query, resultsEl = activeSearchResultsEl || globalSearchResultsEl) {
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) {
        renderGlobalSearchResults(ecosystemModules, resultsEl);
        return;
      }

      const modules = ecosystemModules.filter((module) =>
        module.name.toLowerCase().includes(normalizedQuery) ||
        module.description.toLowerCase().includes(normalizedQuery)
      );

      renderGlobalSearchResults(modules, resultsEl);
    }

    function getVehicleLabel(vehicleId) {
      const vehicle = allVehicles.find(item => item.id === vehicleId);
      return vehicle ? `${vehicle.numeroFrota} • ${vehicle.placa} • ${vehicle.modelo}` : 'Veículo não encontrado';
    }

    function getDriverLabel(driverId) {
      const driver = allDrivers.find(item => item.id === driverId);
      return driver ? driver.nome : 'Responsável não encontrado';
    }

    function getOrderNumberLabel(order) {
      return String(order.numero || '').padStart(4, '0');
    }

    function getFinanceTotal(entry) {
      return Number(entry.total || 0);
    }

    function saveToLocalStorage() {
      localStorage.setItem('wefrotas_vehicles', JSON.stringify(allVehicles));
      localStorage.setItem('wefrotas_drivers', JSON.stringify(allDrivers));
      localStorage.setItem('wefrotas_suppliers', JSON.stringify(allSuppliers));
      localStorage.setItem('wefrotas_orders', JSON.stringify(allOrders));
      localStorage.setItem('wefrotas_finance', JSON.stringify(allFinanceEntries));
      localStorage.setItem('wefrotas_deleted_orders', JSON.stringify(deletedOrders));
      localStorage.setItem('wefrotas_order_counter', String(orderCounter));
      localStorage.setItem('wefrotas_notifications', JSON.stringify(systemNotifications));
      localStorage.setItem('wefrotas_custom_logo_enabled', customLogoEnabled ? 'true' : 'false');
      localStorage.setItem('wefrotas_custom_logo_url', customLogoUrl);
      localStorage.setItem('wefrotas_custom_logo_scale', String(customLogoScale || 60));
    }

    function loadFromLocalStorage() {
      const savedVehicles = localStorage.getItem('wefrotas_vehicles');
      const savedDrivers = localStorage.getItem('wefrotas_drivers');
      const savedSuppliers = localStorage.getItem('wefrotas_suppliers');
      const savedOrders = localStorage.getItem('wefrotas_orders');
      const savedFinance = localStorage.getItem('wefrotas_finance');
      const savedDeletedOrders = localStorage.getItem('wefrotas_deleted_orders');
      const savedCounter = localStorage.getItem('wefrotas_order_counter');
      const savedNotifications = localStorage.getItem('wefrotas_notifications');
      const savedCustomLogoEnabled = localStorage.getItem('wefrotas_custom_logo_enabled');
      const savedCustomLogoUrl = localStorage.getItem('wefrotas_custom_logo_url');
      const savedCustomLogoScale = localStorage.getItem('wefrotas_custom_logo_scale');
      if (savedVehicles) allVehicles = JSON.parse(savedVehicles);
      if (savedDrivers) allDrivers = JSON.parse(savedDrivers);
      if (savedSuppliers) allSuppliers = JSON.parse(savedSuppliers);
      if (savedOrders) allOrders = JSON.parse(savedOrders);
      if (savedFinance) allFinanceEntries = JSON.parse(savedFinance);
      if (savedDeletedOrders) deletedOrders = JSON.parse(savedDeletedOrders);
      if (savedCounter) orderCounter = Number(savedCounter) || 1;
      if (savedNotifications) systemNotifications = JSON.parse(savedNotifications);
      customLogoEnabled = savedCustomLogoEnabled === 'true';
      customLogoUrl = savedCustomLogoUrl || '';
      customLogoScale = Number(savedCustomLogoScale) || 60;
    }

    function showToast(message, options = {}) {
      const stack = document.getElementById('toast-stack');
      if (!stack) return;
      const toast = document.createElement('div');
      toast.className = 'toast-item';
      toast.textContent = message;
      stack.appendChild(toast);
      if (options.notify) {
        addSystemNotification(options.notifyTitle || 'Atualização do sistema', options.notifyMessage || message);
      }
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-6px)';
        setTimeout(() => toast.remove(), 180);
      }, 2600);
    }

    function formatNotificationTime(value) {
      return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    function updateNotificationBadge() {
      const badge = document.getElementById('notifications-badge');
      if (!badge) return;
      const total = systemNotifications.filter((item) => !item.read).length;
      badge.textContent = total > 9 ? '9+' : String(total);
      badge.classList.toggle('hidden', total === 0);
    }

    function renderNotifications() {
      const list = document.getElementById('notifications-list');
      if (!list) return;
      if (!systemNotifications.length) {
        list.innerHTML = '<div class="notification-empty">Nenhuma notificação registrada ainda.</div>';
        updateNotificationBadge();
        return;
      }
      list.innerHTML = systemNotifications.map((item) => `
        <article class="notification-item">
          <div class="notification-item-head">
            <h3 class="notification-item-title">${escapeHtml(item.title)}</h3>
            <span class="notification-item-time">${escapeHtml(formatNotificationTime(item.createdAt))}</span>
          </div>
          <p class="notification-item-text">${escapeHtml(item.text)}</p>
        </article>
      `).join('');
      updateNotificationBadge();
    }

    function addSystemNotification(title, text) {
      systemNotifications.unshift({
        id: generateId(),
        title,
        text,
        createdAt: new Date().toISOString(),
        read: false
      });
      systemNotifications = systemNotifications.slice(0, 30);
      saveToLocalStorage();
      renderNotifications();
    }

    function clearAllNotifications() {
      systemNotifications = [];
      saveToLocalStorage();
      renderNotifications();
      showToast('Notificações limpas.');
    }

    function togglePanel(panelId, overlayId, force) {
      const panel = document.getElementById(panelId);
      const overlay = document.getElementById(overlayId);
      if (!panel || !overlay) return;
      const shouldOpen = typeof force === 'boolean' ? force : !panel.classList.contains('open');
      panel.classList.toggle('open', shouldOpen);
      overlay.classList.toggle('open', shouldOpen);
      panel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
    }

    function toggleSettings(force) {
      const shouldOpen = typeof force === 'boolean'
        ? force
        : !document.getElementById('settings-panel')?.classList.contains('open');
      if (shouldOpen) toggleNotifications(false);
      if (shouldOpen) {
        updateCustomLogoUi();
        openSettingsScreen('home');
      }
      togglePanel('settings-panel', 'settings-overlay', shouldOpen);
    }

    function openSettingsScreen(screen) {
      document.querySelectorAll('.settings-screen').forEach((node) => node.classList.remove('active'));
      const target = document.getElementById(`settings-screen-${screen}`);
      target?.classList.add('active');
      document.querySelector('#settings-panel .panel-body')?.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function openPromptModal({ title, text, placeholder = '', value = '', onConfirm, allowEmpty = false, exactValue = '', confirmLabel = 'Confirmar' }) {
      const backdrop = document.getElementById('prompt-modal-backdrop');
      const titleNode = document.getElementById('prompt-modal-title');
      const textNode = document.getElementById('prompt-modal-text');
      const input = document.getElementById('prompt-modal-input');
      const confirmButton = document.querySelector('#prompt-modal-backdrop .primary-btn');
      if (!backdrop || !titleNode || !textNode || !input) return;
      pendingPromptConfirm = typeof onConfirm === 'function' ? onConfirm : null;
      promptModalConfig = { allowEmpty, exactValue: String(exactValue || ''), confirmLabel };
      titleNode.textContent = title || 'Justificativa';
      textNode.textContent = text || '';
      input.placeholder = placeholder || 'Descreva aqui o motivo';
      input.value = value || '';
      input.style.display = allowEmpty && !exactValue ? 'none' : 'block';
      if (confirmButton) confirmButton.textContent = confirmLabel;
      backdrop.classList.remove('hidden');
      if (!(allowEmpty && !exactValue)) setTimeout(() => input.focus(), 30);
    }

    function closePromptModal() {
      document.getElementById('prompt-modal-backdrop')?.classList.add('hidden');
      const input = document.getElementById('prompt-modal-input');
      if (input) input.value = '';
      promptModalConfig = { allowEmpty: false, exactValue: '', confirmLabel: 'Confirmar' };
      pendingPromptConfirm = null;
    }

    function handlePromptBackdrop(event) {
      if (event.target === event.currentTarget) closePromptModal();
    }

    function confirmPromptModal() {
      const input = document.getElementById('prompt-modal-input');
      const value = input?.value?.trim() || '';
      if (!promptModalConfig.allowEmpty && !value) {
        showToast('Informe uma justificativa para continuar.');
        input?.focus();
        return;
      }
      if (promptModalConfig.exactValue && value.toUpperCase() !== promptModalConfig.exactValue.toUpperCase()) {
        showToast(`Digite ${promptModalConfig.exactValue} para continuar.`);
        input?.focus();
        return;
      }
      const handler = pendingPromptConfirm;
      closePromptModal();
      if (handler) handler(value);
    }

    function openSettingsFeedback(state = 'loading', title = '', text = '') {
      const backdrop = document.getElementById('settings-feedback-backdrop');
      const icon = document.getElementById('settings-feedback-icon');
      const titleNode = document.getElementById('settings-feedback-title');
      const textNode = document.getElementById('settings-feedback-text');
      const closeButton = document.getElementById('settings-feedback-close');
      if (!backdrop || !icon || !titleNode || !textNode || !closeButton) return;

      backdrop.classList.remove('hidden');
      closeButton.classList.toggle('hidden', state === 'loading');
      icon.className = `batch-feedback-icon ${state}`;
      icon.innerHTML = state === 'loading'
        ? '<span class="batch-feedback-spinner"></span>'
        : '<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M20 6 9 17l-5-5"/></svg>';
      titleNode.textContent = title;
      textNode.textContent = text;
    }

    function closeSettingsFeedback() {
      document.getElementById('settings-feedback-backdrop')?.classList.add('hidden');
    }

    function toggleNotifications(force) {
      const shouldOpen = typeof force === 'boolean'
        ? force
        : !document.getElementById('notifications-panel')?.classList.contains('open');
      if (shouldOpen) toggleSettings(false);
      if (shouldOpen && systemNotifications.some((item) => !item.read)) {
        systemNotifications = systemNotifications.map((item) => ({ ...item, read: true }));
        saveToLocalStorage();
        renderNotifications();
      }
      togglePanel('notifications-panel', 'notifications-overlay', shouldOpen);
    }

    function openBatchFeedback(state, title, text, meta = '') {
      const backdrop = document.getElementById('batch-feedback-backdrop');
      const icon = document.getElementById('batch-feedback-icon');
      const kicker = document.getElementById('batch-feedback-kicker');
      const titleNode = document.getElementById('batch-feedback-title');
      const textNode = document.getElementById('batch-feedback-text');
      const metaNode = document.getElementById('batch-feedback-meta');
      const closeButton = document.getElementById('batch-feedback-close');
      if (!backdrop || !icon || !kicker || !titleNode || !textNode || !metaNode || !closeButton) return;

      backdrop.classList.remove('hidden');
      icon.className = `batch-feedback-icon ${state}`;
      if (state === 'loading') {
        icon.innerHTML = '<span class="batch-feedback-spinner"></span>';
        kicker.textContent = 'Importação em andamento';
        closeButton.classList.add('hidden');
      } else if (state === 'success') {
        icon.innerHTML = `
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 12l4 4 10-10"/>
          </svg>
        `;
        kicker.textContent = 'Importação concluída';
        closeButton.classList.remove('hidden');
      } else {
        icon.innerHTML = `
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M10.29 3.86l-7.4 12.82A1 1 0 003.76 18h16.48a1 1 0 00.87-1.5l-7.4-12.82a1 1 0 00-1.74 0z"/>
          </svg>
        `;
        kicker.textContent = 'Importação não concluída';
        closeButton.classList.remove('hidden');
      }

      titleNode.textContent = title;
      textNode.textContent = text;
      metaNode.textContent = meta;
      metaNode.classList.toggle('hidden', !meta);
    }

    function closeBatchFeedback() {
      document.getElementById('batch-feedback-backdrop')?.classList.add('hidden');
    }

    function normalizeComparableText(value) {
      return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
    }

    function findVehicleDuplicate(payload, ignoreId = null) {
      const placa = normalizeComparableText(payload.placa);
      const frota = normalizeComparableText(payload.numeroFrota);
      return allVehicles.find((item) =>
        item.id !== ignoreId && (
          normalizeComparableText(item.placa) === placa ||
          normalizeComparableText(item.numeroFrota) === frota
        )
      );
    }

    function findDriverDuplicate(payload, ignoreId = null) {
      const cpf = onlyDigits(payload.cpf);
      const cnh = normalizeComparableText(payload.cnh);
      return allDrivers.find((item) =>
        item.id !== ignoreId && (
          onlyDigits(item.cpf) === cpf ||
          normalizeComparableText(item.cnh) === cnh
        )
      );
    }

    function findSupplierDuplicate(payload, ignoreId = null) {
      const documentDigits = onlyDigits(payload.documento || '');
      const name = normalizeComparableText(payload.nome);
      const type = normalizeComparableText(payload.tipo);
      return allSuppliers.find((item) =>
        item.id !== ignoreId && (
          (documentDigits && onlyDigits(item.documento || '') === documentDigits) ||
          (normalizeComparableText(item.nome) === name && normalizeComparableText(item.tipo) === type)
        )
      );
    }

    function showModule(module, button) {
      document.querySelectorAll('.module-panel').forEach(panel => panel.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.id !== 'theme-toggle-btn') btn.classList.remove('active');
      });
      const panel = document.getElementById(`panel-${module}`);
      if (panel) panel.classList.add('active');
      if (button) button.classList.add('active');
    }

    function setupGlobalSearchInput(inputEl, resultsEl) {
      if (!inputEl || !resultsEl) return;

      inputEl.addEventListener('input', (event) => {
        setActiveSearchContext(inputEl, resultsEl);
        updateGlobalSearch(event.target.value, resultsEl);
      });

      inputEl.addEventListener('focus', (event) => {
        setActiveSearchContext(inputEl, resultsEl);
        updateGlobalSearch(event.target.value, resultsEl);
      });

      inputEl.addEventListener('keydown', (event) => {
        setActiveSearchContext(inputEl, resultsEl);
        if (resultsEl.classList.contains('hidden')) {
          if (event.key === 'Enter' && inputEl.value.trim()) {
            updateGlobalSearch(inputEl.value, resultsEl);
            if (filteredModules[0]) {
              navigateToModule(filteredModules[0].url);
            }
          }
          return;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          highlightedModuleIndex = Math.min(highlightedModuleIndex + 1, filteredModules.length - 1);
          syncHighlightedGlobalSearchItem();
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          highlightedModuleIndex = Math.max(highlightedModuleIndex - 1, 0);
          syncHighlightedGlobalSearchItem();
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          const selectedModule = filteredModules[highlightedModuleIndex] || filteredModules[0];
          if (selectedModule) {
            navigateToModule(selectedModule.url);
          }
        }

        if (event.key === 'Escape') {
          if (resultsEl === mobileGlobalSearchResultsEl) {
            closeMobileSearch();
          } else {
            hideGlobalSearchResults();
          }
        }
      });
    }

    setupGlobalSearchInput(globalSearchInputEl, globalSearchResultsEl);
    setupGlobalSearchInput(mobileGlobalSearchInputEl, mobileGlobalSearchResultsEl);

    if (globalSearchResultsEl) {
      globalSearchResultsEl.addEventListener('click', (event) => {
        const item = event.target.closest('.global-search-item');
        if (!item) return;
        navigateToModule(item.dataset.url);
      });
    }

    if (mobileGlobalSearchResultsEl) {
      mobileGlobalSearchResultsEl.addEventListener('click', (event) => {
        const item = event.target.closest('.global-search-item');
        if (!item) return;
        navigateToModule(item.dataset.url);
      });
    }

    if (globalSearchInputEl && globalSearchResultsEl) {
      document.addEventListener('click', (event) => {
        const clickedDesktopSearch = globalSearchResultsEl.contains(event.target) || globalSearchInputEl.contains(event.target);
        const clickedMobileSearch = mobileSearchModalEl?.contains(event.target) || mobileSearchBtnEl?.contains(event.target);
        if (!clickedDesktopSearch && !clickedMobileSearch) {
          searchFocusOverlayEl.classList.add('hidden');
          globalSearchResultsEl.classList.add('hidden');
          closeMobileSearch();
          highlightedModuleIndex = -1;
        }
      });
    }

    if (mobileSearchBtnEl) {
      mobileSearchBtnEl.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (mobileSearchModalEl.classList.contains('open')) {
          closeMobileSearch();
        } else {
          openMobileSearch();
        }
      });
    }

    if (mobileSearchBackdropEl) {
      mobileSearchBackdropEl.addEventListener('click', () => {
        closeMobileSearch();
      });
    }

    function applyThemeState(isDark) {
      document.body.classList.toggle('dark-mode', isDark);
      const themeButton = document.getElementById('theme-toggle-btn');
      if (themeButton) themeButton.classList.toggle('active', isDark);
      document.getElementById('settings-theme-light')?.classList.toggle('active', !isDark);
      document.getElementById('settings-theme-dark')?.classList.toggle('active', isDark);
      localStorage.setItem('wefrotas_theme', isDark ? 'dark' : 'light');
    }

    function toggleTheme() {
      applyThemeState(!document.body.classList.contains('dark-mode'));
    }

    function openPremiumModal() {
      currentModalType = 'premium';
      currentEditingId = null;
      currentFinanceEntryType = null;
      const backdrop = document.getElementById('modal-backdrop');
      const fields = document.getElementById('modal-fields');
      const kicker = document.getElementById('modal-kicker');
      const title = document.getElementById('modal-title');
      const isDark = document.body.classList.contains('dark-mode');
      const premiumWhatsAppUrl = 'https://wa.me/5527988790381?text=' + encodeURIComponent('Olá! Quero assinar o WeFrotas Premium por R$ 29,90. Pode me passar os próximos passos?');

      kicker.textContent = 'WeFrotas Premium';
      title.textContent = 'Versão Premium • R$ 29,90';
      setModalSubmitState(false);
      setModalActionsVisible(false);

      fields.innerHTML = `
        <div class="space-y-6 w-full" style="grid-column: 1 / -1;">
          <div class="rounded-[24px] border ${isDark ? 'border-amber-500/30 bg-gradient-to-br from-[#2f2411] to-[#1b2438]' : 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50'} p-6">
            <p class="text-sm font-bold uppercase tracking-[0.18em] ${isDark ? 'text-amber-300' : 'text-amber-700'}">Plano Premium</p>
            <h4 class="mt-3 text-2xl font-extrabold ${isDark ? 'text-slate-50' : 'text-slate-900'}">Faça upgrade para o plano premium e desbloqueie a versão completa do sistema</h4>
            <p class="mt-3 text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-700'}">Tenha seu logo aplicado no sistema, relatórios extras, recursos avançados de gestão e uma apresentação mais profissional para a sua operação.</p>
            <a href="${premiumWhatsAppUrl}" target="_blank" rel="noopener noreferrer" class="mt-5 inline-flex items-center gap-3 rounded-[18px] px-5 py-3 font-extrabold ${isDark ? 'bg-[#25D366] text-[#0f172a]' : 'bg-[#25D366] text-white'} shadow-[0_16px_28px_rgba(37,211,102,0.28)] hover:translate-y-[-1px] transition-all">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.52 3.48A11.86 11.86 0 0012.07 0C5.5 0 .14 5.35.14 11.92c0 2.1.55 4.16 1.6 5.98L0 24l6.28-1.65a11.9 11.9 0 005.79 1.48h.01c6.56 0 11.92-5.35 11.92-11.92 0-3.18-1.24-6.17-3.48-8.43zM12.08 21.8h-.01a9.9 9.9 0 01-5.04-1.38l-.36-.21-3.73.98 1-3.64-.24-.38a9.87 9.87 0 01-1.53-5.25c0-5.46 4.44-9.9 9.91-9.9 2.64 0 5.12 1.03 6.98 2.9a9.82 9.82 0 012.9 6.99c0 5.46-4.44 9.9-9.89 9.9zm5.43-7.42c-.3-.15-1.77-.87-2.04-.97-.27-.1-.46-.15-.66.15-.19.3-.76.97-.93 1.16-.17.2-.34.22-.64.08-.3-.15-1.25-.46-2.38-1.47a8.9 8.9 0 01-1.65-2.05c-.17-.3-.02-.46.13-.61.13-.13.3-.34.44-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.66-.5h-.56c-.2 0-.52.08-.8.37-.27.3-1.03 1-1.03 2.44 0 1.44 1.05 2.84 1.2 3.04.14.2 2.07 3.16 5.01 4.43.7.3 1.25.49 1.68.63.71.22 1.36.19 1.87.11.57-.08 1.77-.72 2.02-1.42.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35z"/>
              </svg>
              <span>Assinar Premium Agora</span>
            </a>
          </div>
          <div class="overflow-hidden rounded-[24px] border ${isDark ? 'border-slate-700 bg-[#111b2d]' : 'border-slate-200 bg-white'}">
            <div class="grid grid-cols-[1.8fr_1fr_1fr] border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}">
              <div class="p-5 flex items-center justify-center text-center">
                <p class="text-xs font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}">Comparativo de planos</p>
              </div>
              <div class="p-5 text-center border-l ${isDark ? 'border-slate-700' : 'border-slate-200'}">
                <p class="text-xs font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}">Grátis</p>
                <h5 class="mt-2 text-xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}">Essencial</h5>
              </div>
              <div class="p-5 text-center border-l ${isDark ? 'border-amber-500/30 bg-gradient-to-b from-[#3a2d11] to-[#251e12]' : 'border-amber-200 bg-gradient-to-b from-[#fff9df] to-[#fff1bf]'}">
                <p class="text-xs font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-amber-300' : 'text-amber-700'}">Premium</p>
                <h5 class="mt-2 text-xl font-extrabold ${isDark ? 'text-slate-50' : 'text-slate-900'}">Profissional</h5>
                <p class="mt-1 text-sm font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}">R$ 29,90</p>
              </div>
            </div>
            <div class="grid grid-cols-[1.8fr_1fr_1fr]">
              ${[
                ['Cadastro de veículos, motoristas, parceiros e OS', true, true],
                ['Lançamentos financeiros vinculados à OS', true, true],
                ['Impressão padrão da OS', true, true],
                ['Dashboard básico do sistema', true, true],
                ['Seu logo aplicado no sistema', false, true],
                ['Seu logo nos relatórios e impressões', false, true],
                ['Relatórios avançados de operação', false, true],
                ['Indicadores extras e análises gerenciais', false, true],
                ['Filtros premium e consultas avançadas', false, true]
              ].map(([label, free, premium], index) => `
                <div class="contents">
                  <div class="p-4 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'} ${index < 8 ? (isDark ? 'border-b border-slate-700' : 'border-b border-slate-200') : ''}">${label}</div>
                  <div class="p-4 flex items-center justify-center border-l ${isDark ? 'border-slate-700' : 'border-slate-200'} ${index < 8 ? (isDark ? 'border-b border-slate-700' : 'border-b border-slate-200') : ''}">
                    <span class="inline-flex h-8 w-8 items-center justify-center rounded-full ${free ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'} text-lg font-extrabold">${free ? '✓' : '×'}</span>
                  </div>
                  <div class="p-4 flex items-center justify-center border-l ${isDark ? 'border-amber-500/30 bg-[#1b2230]' : 'border-amber-200 bg-[#fffdf4]'} ${index < 8 ? (isDark ? 'border-b border-slate-700' : 'border-b border-amber-100') : ''}">
                    <span class="inline-flex h-8 w-8 items-center justify-center rounded-full ${premium ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'} text-lg font-extrabold">${premium ? '✓' : '×'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="rounded-[22px] ${isDark ? 'bg-[#182233] border border-slate-700' : 'bg-slate-50 border border-slate-200'} p-5">
            <p class="text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}">A versão premium é ideal para quem quer apresentar a ferramenta com a própria identidade visual e ampliar a camada de gestão com mais relatórios e análises.</p>
          </div>
        </div>
      `;

      backdrop.classList.add('show');
    }

    function openCadastroModal(type) {
      currentModalType = type;
      currentEditingId = null;
      currentFinanceEntryType = null;
      const backdrop = document.getElementById('modal-backdrop');
      const fields = document.getElementById('modal-fields');
      const kicker = document.getElementById('modal-kicker');
      const title = document.getElementById('modal-title');
      setModalSubmitState(true, 'Salvar cadastro');
      setModalActionsVisible(true);

      if (type === 'vehicle') {
        kicker.textContent = 'Veículos';
        title.textContent = 'Cadastrar veículo';
        fields.innerHTML = `
          <div class="field-wrap">
            <label>${requiredLabel('Número de Frota')}</label>
            <input class="soft-input w-full" id="vehicle-frota" placeholder="Ex: 015" required>
          </div>
          <div class="field-wrap">
            <label>${requiredLabel('Placa')}</label>
            <input class="soft-input w-full" id="vehicle-placa" placeholder="ABC-1234" required>
          </div>
          <div class="field-wrap">
            <label>${requiredLabel('Modelo')}</label>
            <input class="soft-input w-full" id="vehicle-modelo" placeholder="Ex: Ford Cargo 816" required>
          </div>
          <div class="field-wrap">
            <label>${requiredLabel('Ano')}</label>
            <input class="soft-input w-full" id="vehicle-ano" placeholder="2024" required>
          </div>
          <div class="field-wrap">
            <label>Cor</label>
            <input class="soft-input w-full" id="vehicle-cor" placeholder="Branco">
          </div>
          <div class="field-wrap">
            <label>Vencimento do seguro</label>
            <input class="soft-input w-full" id="vehicle-seguro" type="date">
          </div>
          <div class="field-wrap full">
            <label>Chassi</label>
            <input class="soft-input w-full" id="vehicle-chassi" placeholder="9BWZZZ377VT004251">
          </div>
        `;
      } else if (type === 'driver') {
        kicker.textContent = 'Motoristas';
        title.textContent = 'Cadastrar motorista';
        fields.innerHTML = `
          <div class="field-wrap full">
            <label>${requiredLabel('Nome completo')}</label>
            <input class="soft-input w-full" id="driver-nome" placeholder="Nome do motorista" required>
          </div>
          <div class="field-wrap">
            <label>${requiredLabel('CPF')}</label>
            <input class="soft-input w-full" id="driver-cpf" placeholder="000.000.000-00" required>
          </div>
          <div class="field-wrap">
            <label>${requiredLabel('CNH')}</label>
            <input class="soft-input w-full" id="driver-cnh" placeholder="00000000000" required>
          </div>
          <div class="field-wrap">
            <label>${requiredLabel('Categoria')}</label>
            <select class="soft-input w-full" id="driver-categoria" required>
              <option value="">Selecione</option>
              <option value="ACC">ACC</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="C">C</option>
              <option value="AC">AC</option>
              <option value="D">D</option>
              <option value="AD">AD</option>
              <option value="E">E</option>
              <option value="AE">AE</option>
            </select>
          </div>
          <div class="field-wrap">
            <label>Telefone</label>
            <input class="soft-input w-full" id="driver-telefone" placeholder="(00) 00000-0000">
          </div>
          <div class="field-wrap">
            <label>Validade da CNH</label>
            <input class="soft-input w-full" id="driver-validade" type="date">
          </div>
        `;
      } else if (type === 'supplier') {
        kicker.textContent = 'Fornecedores';
        title.textContent = 'Cadastrar fornecedor';
        fields.innerHTML = `
          <div class="field-wrap full">
            <label>${requiredLabel('Nome do parceiro')}</label>
            <input class="soft-input w-full" id="supplier-name" placeholder="Nome do fornecedor ou parceiro" required>
          </div>
          <div class="field-wrap">
            <label>${requiredLabel('Tipo de parceiro')}</label>
            <select class="soft-input w-full" id="supplier-type" required>
              <option value="">Selecione</option>
              <option value="posto">Posto de combustível</option>
              <option value="oficina">Oficina</option>
              <option value="concessionaria">Concessionária</option>
              <option value="pecas">Loja de peças</option>
              <option value="pneus">Pneus</option>
              <option value="lubrificantes">Lubrificantes</option>
              <option value="eletrica">Elétrica automotiva</option>
              <option value="funilaria">Funilaria e pintura</option>
              <option value="borracharia">Borracharia</option>
              <option value="guincho">Guincho</option>
              <option value="seguradora">Seguradora</option>
              <option value="rastreamento">Rastreamento e telemetria</option>
              <option value="lavajato">Lava-jato</option>
              <option value="locadora">Locadora</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div class="field-wrap">
            <label>Documento</label>
            <input class="soft-input w-full" id="supplier-document" placeholder="CPF/CNPJ">
          </div>
          <div class="field-wrap">
            <label>Telefone</label>
            <input class="soft-input w-full" id="supplier-phone" placeholder="(00) 00000-0000">
          </div>
          <div class="field-wrap">
            <label>E-mail</label>
            <input class="soft-input w-full" id="supplier-email" placeholder="contato@fornecedor.com">
          </div>
          <div class="field-wrap full">
            <label>Observações</label>
            <textarea class="soft-input textarea w-full" id="supplier-notes" placeholder="Observações do parceiro"></textarea>
          </div>
        `;
      } else if (type === 'order') {
        kicker.textContent = 'Ordens de serviço';
        title.textContent = 'Cadastrar OS';
        fields.innerHTML = `
          <div class="field-wrap">
            <label>Número da OS</label>
            <input class="soft-input w-full" id="order-numero" value="${String(orderCounter).padStart(4, '0')}" readonly>
          </div>
          <div class="field-wrap">
            <label>Administração</label>
            <input class="soft-input w-full" id="order-administracao" placeholder="Ex: Administração">
          </div>
          <div class="field-wrap">
            <label>${requiredLabel('Veículo')}</label>
            <select class="soft-input w-full" id="order-veiculo" required>
              <option value="">Selecione um veículo</option>
              ${allVehicles.map(vehicle => `<option value="${vehicle.id}">${escapeHtml(vehicle.numeroFrota)} • ${escapeHtml(vehicle.placa)} • ${escapeHtml(vehicle.modelo)}</option>`).join('')}
            </select>
          </div>
          <div class="field-wrap">
            <label>Responsável</label>
            <select class="soft-input w-full" id="order-driver">
              <option value="">Selecione um motorista</option>
              ${allDrivers.map(driver => `<option value="${driver.id}">${escapeHtml(driver.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="field-wrap">
            <label>Data de início</label>
            <input class="soft-input w-full" id="order-data-inicio" type="date">
          </div>
          <div class="field-wrap">
            <label>Data de término</label>
            <input class="soft-input w-full" id="order-data-termino" type="date">
          </div>
          <div class="field-wrap">
            <label>Status</label>
            <select class="soft-input w-full" id="order-status">
              <option value="aberta">Aberta</option>
              <option value="andamento">Em andamento</option>
              <option value="fechada">Fechada</option>
            </select>
          </div>
          <div class="field-wrap full">
            <label>${requiredLabel('Descrição do serviço / problema')}</label>
            <textarea class="soft-input textarea w-full" id="order-descricao" placeholder="Descreva tudo que deve sair na impressão da OS."></textarea>
          </div>
        `;
      } else if (type === 'finance') {
        kicker.textContent = 'Financeiro';
        title.textContent = 'Novo lançamento';
        fields.innerHTML = `
          <div class="field-wrap full">
            <label>O que você quer lançar?</label>
            <div class="grid md:grid-cols-2 gap-4">
              <button type="button" class="soft-btn primary !h-auto py-5 px-5 text-left" onclick="loadFinanceForm('combustivel')">
                <span class="block text-base font-extrabold">Lançamento de combustível</span>
                <span class="block text-sm font-medium opacity-90 mt-2">Mostra apenas postos e habilita combustível + KM inicial/final.</span>
              </button>
              <button type="button" class="soft-btn !h-auto py-5 px-5 text-left" onclick="loadFinanceForm('despesa')">
                <span class="block text-base font-extrabold">Lançamento de despesa</span>
                <span class="block text-sm font-medium text-slate-500 mt-2">Usa a lista completa de parceiros cadastrados no sistema.</span>
              </button>
            </div>
          </div>
        `;
        setModalSubmitState(false);
      }

      backdrop.classList.add('show');
      attachModalInputMasks();
    }

    function closeCadastroModal() {
      document.getElementById('modal-backdrop').classList.remove('show');
      document.getElementById('cadastro-form').reset();
      currentModalType = null;
      currentEditingId = null;
      currentFinanceEntryType = null;
      setModalSubmitState(true, 'Salvar cadastro');
      setModalActionsVisible(true);
    }

    function handleModalBackdrop(event) {
      if (event.target.id === 'modal-backdrop') {
        closeCadastroModal();
      }
    }

    function downloadBlob(filename, blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 300);
    }

    function exportSystemBackup() {
      const payload = {
        version: 'wefrotas-backup-v1',
        exportedAt: new Date().toISOString(),
        theme: localStorage.getItem('wefrotas_theme') || 'light',
        customLogoEnabled,
        customLogoUrl,
        customLogoScale,
        orderCounter,
        notifications: systemNotifications,
        vehicles: allVehicles,
        drivers: allDrivers,
        suppliers: allSuppliers,
        orders: allOrders,
        finance: allFinanceEntries,
        deletedOrders
      };
      downloadBlob(`wefrotas_backup_${getLocalIsoDate()}.json`, new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }));
      showToast('Backup exportado com sucesso.', {
        notify: true,
        notifyTitle: 'Backup exportado',
        notifyMessage: 'Seu backup local do WeFrotas foi baixado em JSON.'
      });
    }

    function importSystemBackup() {
      const input = document.getElementById('wefrotas-import-backup-input');
      if (!input) return;
      input.value = '';
      input.click();
    }

    function handleBackupImportFile(event) {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        try {
          const parsed = JSON.parse(loadEvent.target.result);
          if (!Array.isArray(parsed.vehicles) || !Array.isArray(parsed.drivers) || !Array.isArray(parsed.suppliers) || !Array.isArray(parsed.orders) || !Array.isArray(parsed.finance)) {
            throw new Error('Estrutura inválida');
          }
          allVehicles = parsed.vehicles;
          allDrivers = parsed.drivers;
          allSuppliers = parsed.suppliers.map((supplier) => ({
            ...supplier,
            tipoLabel: getSupplierTypeLabel(supplier.tipo)
          }));
          allOrders = parsed.orders;
          allFinanceEntries = parsed.finance;
          deletedOrders = Array.isArray(parsed.deletedOrders) ? parsed.deletedOrders : [];
          systemNotifications = Array.isArray(parsed.notifications) ? parsed.notifications.slice(0, 30) : [];
          orderCounter = Number(parsed.orderCounter) || 1;
          customLogoEnabled = !!parsed.customLogoEnabled;
          customLogoUrl = parsed.customLogoUrl || '';
          customLogoScale = Number(parsed.customLogoScale) || 60;
          if (parsed.theme === 'dark' || parsed.theme === 'light') {
            applyThemeState(parsed.theme === 'dark');
          }
          saveToLocalStorage();
          renderAll();
          renderNotifications();
          updateCustomLogoUi();
          showToast('Backup importado com sucesso.', {
            notify: true,
            notifyTitle: 'Backup importado',
            notifyMessage: `Os dados de ${file.name} foram restaurados no WeFrotas.`
          });
          toggleSettings(false);
        } catch (error) {
          console.error(error);
          showToast('Não foi possível importar esse backup.');
        }
      };
      reader.readAsText(file, 'utf-8');
    }

    function resetSystemState() {
      allVehicles = [];
      allDrivers = [];
      allSuppliers = [];
      allOrders = [];
      allFinanceEntries = [];
      deletedOrders = [];
      systemNotifications = [];
      selectedVehicles.clear();
      selectedDrivers.clear();
      selectedSuppliers.clear();
      selectedOrders.clear();
      selectedFinance.clear();
      orderCounter = 1;
      customLogoEnabled = false;
      customLogoUrl = '';
      customLogoScale = 60;
      [
        'wefrotas_vehicles',
        'wefrotas_drivers',
        'wefrotas_suppliers',
        'wefrotas_orders',
        'wefrotas_finance',
        'wefrotas_deleted_orders',
        'wefrotas_order_counter',
        'wefrotas_notifications',
        'wefrotas_custom_logo_enabled',
        'wefrotas_custom_logo_url',
        'wefrotas_custom_logo_scale',
        'wefrotas_theme'
      ].forEach((key) => localStorage.removeItem(key));
      applyThemeState(false);
      saveToLocalStorage();
      renderAll();
      renderNotifications();
      updateCustomLogoUi();
    }

    function openSystemResetModal() {
      openPromptModal({
        title: 'Resetar sistema',
        text: 'Isso vai limpar OS, financeiro, veículos, motoristas, fornecedores, notificações, personalizações e histórico de exclusões. Digite RESETAR para continuar.',
        placeholder: 'Digite RESETAR',
        exactValue: 'RESETAR',
        confirmLabel: 'Resetar',
        onConfirm: () => {
          openSettingsFeedback('loading', 'Resetando sistema', 'Estamos removendo todos os dados locais do WeFrotas.');
          setTimeout(() => {
            resetSystemState();
            toggleSettings(false);
            openSettingsFeedback('success', 'Sistema resetado', 'Todos os dados locais e personalizações foram limpos com sucesso.');
          }, 700);
        }
      });
    }

    function normalizeImportHeader(value) {
      return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    }

    function normalizeImportedDate(value) {
      if (!value) return '';
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const parsed = new Date(excelEpoch.getTime() + (value * 86400000));
        return parsed.toISOString().slice(0, 10);
      }
      const text = String(value).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
      if (/^\d{8}$/.test(text)) {
        return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
      }
      const separators = ['/', '-', '.', '\\'];
      for (const separator of separators) {
        const escapedSeparator = separator === '\\' ? '\\\\' : separator === '.' ? '\\.' : separator;
        const brDate = text.match(new RegExp(`^(\\d{1,2})${escapedSeparator}(\\d{1,2})${escapedSeparator}(\\d{4})$`));
        if (brDate) {
          const day = brDate[1].padStart(2, '0');
          const month = brDate[2].padStart(2, '0');
          return `${brDate[3]}-${month}-${day}`;
        }
        const isoDate = text.match(new RegExp(`^(\\d{4})${escapedSeparator}(\\d{1,2})${escapedSeparator}(\\d{1,2})$`));
        if (isoDate) {
          return `${isoDate[1]}-${isoDate[2].padStart(2, '0')}-${isoDate[3].padStart(2, '0')}`;
        }
      }
      const parsed = new Date(text);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
      return '';
    }

    function getMappedRow(row) {
      const mapped = {};
      Object.entries(row || {}).forEach(([key, value]) => {
        mapped[normalizeImportHeader(key)] = typeof value === 'string' ? value.trim() : value;
      });
      return mapped;
    }

    function getMappedValue(row, possibleKeys) {
      const normalizedKeys = possibleKeys.map(normalizeImportHeader);
      return normalizedKeys.reduce((found, key) => {
        if (found !== '') return found;
        const value = row[key];
        return value === undefined || value === null ? '' : value;
      }, '');
    }

    function normalizeSupplierType(value) {
      const normalized = normalizeImportHeader(value);
      const aliases = {
        posto: 'posto',
        postodecombustivel: 'posto',
        oficina: 'oficina',
        concessionaria: 'concessionaria',
        lojasdepecas: 'pecas',
        pecas: 'pecas',
        pneus: 'pneus',
        lubrificantes: 'lubrificantes',
        eletrica: 'eletrica',
        eletricaautomotiva: 'eletrica',
        funilaria: 'funilaria',
        funilariaepintura: 'funilaria',
        borracharia: 'borracharia',
        guincho: 'guincho',
        seguradora: 'seguradora',
        rastreamento: 'rastreamento',
        rastreamentoetelemetria: 'rastreamento',
        lavajato: 'lavajato',
        locadora: 'locadora',
        outro: 'outro'
      };
      return aliases[normalized] || '';
    }

    function getBatchTemplateRows(entity) {
      if (entity === 'vehicle') {
        return [
          ['NumeroFrota', 'Placa', 'Modelo', 'Ano', 'Cor', 'VencimentoSeguro', 'Chassi'],
          ['015', 'ABC1D23', 'Strada Freedom', '2024', 'Branco', '2026-12-20', '9BWZZZ377VT004251']
        ];
      }
      return [];
    }

    function downloadBatchTemplate(entity) {
      if (entity !== 'vehicle') {
        showToast('A importação em lote está disponível apenas para veículos.');
        return;
      }
      const label = 'veiculos';
      const rows = getBatchTemplateRows(entity);
      if (window.XLSX) {
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, sheet, 'Modelo');
        XLSX.writeFile(workbook, `wefrotas_modelo_${label}.xlsx`);
      } else {
        const csv = rows.map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
        downloadBlob(`wefrotas_modelo_${label}.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      }
      showToast(`Modelo de ${label} baixado com sucesso.`, {
        notify: true,
        notifyTitle: 'Modelo de planilha',
        notifyMessage: `O modelo de ${label} foi gerado para preenchimento em lote.`
      });
    }

    function triggerBatchImport(entity) {
      if (entity !== 'vehicle') {
        showToast('A importação em lote está disponível apenas para veículos.');
        return;
      }
      pendingBatchImportEntity = entity;
      const input = document.getElementById('wefrotas-batch-import-input');
      if (!input) return;
      input.value = '';
      input.click();
    }

    function importVehiclesFromRows(rows) {
      let created = 0;
      let updated = 0;
      let skipped = 0;
      let duplicates = 0;
      rows.forEach((rawRow) => {
        const row = getMappedRow(rawRow);
        const numeroFrota = getMappedValue(row, ['NumeroFrota', 'Frota', 'CodigoFrota']);
        const placa = getMappedValue(row, ['Placa']);
        const modelo = getMappedValue(row, ['Modelo', 'Veiculo']);
        const ano = getMappedValue(row, ['Ano']);
        const cor = getMappedValue(row, ['Cor']);
        const seguroVencimento = normalizeImportedDate(getMappedValue(row, ['VencimentoSeguro', 'SeguroVencimento', 'Seguro']));
        const chassi = getMappedValue(row, ['Chassi']);
        if (!numeroFrota || !placa || !modelo || !ano) {
          skipped += 1;
          return;
        }
        const payload = { numeroFrota, placa, modelo, ano, cor, seguroVencimento, chassi };
        const existingIndex = allVehicles.findIndex((item) => item.numeroFrota === numeroFrota || item.placa.toLowerCase() === placa.toLowerCase());
        if (existingIndex >= 0) {
          const duplicate = findVehicleDuplicate(payload, allVehicles[existingIndex].id);
          if (duplicate) {
            duplicates += 1;
            return;
          }
          const isSame = JSON.stringify({ ...allVehicles[existingIndex], id: undefined }) === JSON.stringify({ ...allVehicles[existingIndex], ...payload, id: undefined });
          if (isSame) {
            duplicates += 1;
          } else {
            allVehicles[existingIndex] = { ...allVehicles[existingIndex], ...payload };
            updated += 1;
          }
        } else {
          if (findVehicleDuplicate(payload)) {
            duplicates += 1;
            return;
          }
          allVehicles.unshift({ id: generateId(), ...payload });
          created += 1;
        }
      });
      return { created, updated, skipped, duplicates, label: 'veículos' };
    }

    function importDriversFromRows(rows) {
      let created = 0;
      let updated = 0;
      let skipped = 0;
      let duplicates = 0;
      rows.forEach((rawRow) => {
        const row = getMappedRow(rawRow);
        const nome = String(getMappedValue(row, ['Nome', 'Motorista'])).trim();
        const cpf = formatCpf(String(getMappedValue(row, ['CPF', 'Documento', 'CpfMotorista'])).trim());
        const cnh = String(getMappedValue(row, ['CNH', 'NumeroCNH'])).trim();
        const categoria = getMappedValue(row, ['Categoria', 'CategoriaCNH']).toUpperCase();
        const telefone = String(getMappedValue(row, ['Telefone', 'Celular', 'Contato'])).trim();
        const validade = normalizeImportedDate(getMappedValue(row, ['ValidadeCNH', 'Validade', 'DataValidadeCNH']));
        if (!nome || !cpf || !cnh || !categoria || !isValidCpf(cpf)) {
          skipped += 1;
          return;
        }
        const payload = { nome, cpf, cnh, categoria, telefone, validade };
        const existingIndex = allDrivers.findIndex((item) => onlyDigits(item.cpf) === onlyDigits(cpf) || item.cnh === cnh);
        if (existingIndex >= 0) {
          const duplicate = findDriverDuplicate(payload, allDrivers[existingIndex].id);
          if (duplicate) {
            duplicates += 1;
            return;
          }
          const isSame = JSON.stringify({ ...allDrivers[existingIndex], id: undefined }) === JSON.stringify({ ...allDrivers[existingIndex], ...payload, id: undefined });
          if (isSame) {
            duplicates += 1;
          } else {
            allDrivers[existingIndex] = { ...allDrivers[existingIndex], ...payload };
            updated += 1;
          }
        } else {
          if (findDriverDuplicate(payload)) {
            duplicates += 1;
            return;
          }
          allDrivers.unshift({ id: generateId(), ...payload });
          created += 1;
        }
      });
      return { created, updated, skipped, duplicates, label: 'motoristas' };
    }

    function importSuppliersFromRows(rows) {
      let created = 0;
      let updated = 0;
      let skipped = 0;
      let duplicates = 0;
      rows.forEach((rawRow) => {
        const row = getMappedRow(rawRow);
        const nome = String(getMappedValue(row, ['Nome', 'Fornecedor', 'Parceiro'])).trim();
        const tipo = normalizeSupplierType(getMappedValue(row, ['Tipo', 'Categoria']));
        const documento = formatCpfOrCnpj(String(getMappedValue(row, ['Documento', 'CNPJ', 'CPF', 'CPF/CNPJ'])).trim());
        const telefone = String(getMappedValue(row, ['Telefone', 'Celular', 'Contato'])).trim();
        const email = String(getMappedValue(row, ['Email', 'E-mail', 'Mail'])).trim();
        const observacoes = String(getMappedValue(row, ['Observacoes', 'Observações', 'Obs'])).trim();
        const digits = onlyDigits(documento);
        const validDocument = !documento || (digits.length === 11 ? isValidCpf(documento) : digits.length === 14 ? isValidCnpj(documento) : false);
        if (!nome || !tipo || !validDocument) {
          skipped += 1;
          return;
        }
        const tipoLabel = getSupplierTypeLabel(tipo);
        const payload = { nome, tipo, tipoLabel, documento, telefone, email, observacoes };
        const existingIndex = allSuppliers.findIndex((item) =>
          (documento && onlyDigits(item.documento || '') === digits) ||
          (item.nome.toLowerCase() === nome.toLowerCase() && item.tipo === tipo)
        );
        if (existingIndex >= 0) {
          const duplicate = findSupplierDuplicate(payload, allSuppliers[existingIndex].id);
          if (duplicate) {
            duplicates += 1;
            return;
          }
          const isSame = JSON.stringify({ ...allSuppliers[existingIndex], id: undefined }) === JSON.stringify({ ...allSuppliers[existingIndex], ...payload, id: undefined });
          if (isSame) {
            duplicates += 1;
          } else {
            allSuppliers[existingIndex] = { ...allSuppliers[existingIndex], ...payload };
            updated += 1;
          }
        } else {
          if (findSupplierDuplicate(payload)) {
            duplicates += 1;
            return;
          }
          allSuppliers.unshift({ id: generateId(), ...payload });
          created += 1;
        }
      });
      return { created, updated, skipped, duplicates, label: 'fornecedores' };
    }

    function handleBatchImportFile(event) {
      const file = event.target.files?.[0];
      const entity = pendingBatchImportEntity;
      event.target.value = '';
      pendingBatchImportEntity = null;
      if (!file || !entity) return;
      if (entity !== 'vehicle') {
        showToast('A importação em lote está disponível apenas para veículos.');
        return;
      }
      if (!window.XLSX) {
        showToast('Importação por planilha não está disponível agora.');
        return;
      }
      openBatchFeedback('loading', 'Importando planilha...', 'Estamos lendo os dados da planilha e validando os registros para evitar duplicidades.');
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        try {
          const workbook = XLSX.read(loadEvent.target.result, { type: 'array', cellDates: true });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });
          if (!rows.length) {
            openBatchFeedback('error', 'Planilha vazia', 'A importação não encontrou nenhuma linha preenchida para processar.');
            showToast('A planilha está vazia.');
            return;
          }
          const summary = importVehiclesFromRows(rows);
          if (summary.created === 0 && summary.updated === 0) {
            const meta = `Ignorados: ${summary.skipped} • Duplicados: ${summary.duplicates}`;
            openBatchFeedback('error', 'Nenhum registro foi importado', `A planilha de ${summary.label} foi lida, mas não houve novos cadastros nem atualizações válidas.`, meta);
            showToast(`Nenhum ${summary.label} foi importado. Revise o modelo e os dados preenchidos.`);
            return;
          }
          saveToLocalStorage();
          renderAll();
          toggleSettings(false);
          renderNotifications();
          const meta = `Novos: ${summary.created} • Atualizados: ${summary.updated} • Ignorados: ${summary.skipped} • Duplicados: ${summary.duplicates}`;
          openBatchFeedback('success', 'Importação concluída com sucesso', `A planilha de ${summary.label} foi processada e os dados válidos já estão disponíveis no sistema.`, meta);
          showToast(`Importação concluída: ${summary.created} novos, ${summary.updated} atualizados, ${summary.skipped} ignorados e ${summary.duplicates} duplicados.`, {
            notify: true,
            notifyTitle: 'Importação em lote concluída',
            notifyMessage: `Planilha de ${summary.label} processada com ${summary.created} novos e ${summary.updated} registros atualizados.`
          });
          setTimeout(() => {
            closeBatchFeedback();
          }, 2600);
        } catch (error) {
          console.error(error);
          openBatchFeedback('error', 'Não foi possível importar a planilha', 'O arquivo não pôde ser processado. Revise o modelo e tente novamente.');
          showToast('Não foi possível importar essa planilha.');
        }
      };
      reader.readAsArrayBuffer(file);
    }

    function getSupplierTypeLabel(type) {
      return {
        posto: 'Posto de combustível',
        oficina: 'Oficina',
        concessionaria: 'Concessionária',
        pecas: 'Loja de peças',
        pneus: 'Pneus',
        lubrificantes: 'Lubrificantes',
        eletrica: 'Elétrica automotiva',
        funilaria: 'Funilaria e pintura',
        borracharia: 'Borracharia',
        guincho: 'Guincho',
        seguradora: 'Seguradora',
        rastreamento: 'Rastreamento e telemetria',
        lavajato: 'Lava-jato',
        locadora: 'Locadora',
        outro: 'Outro'
      }[type] || 'Outro';
    }

    function toggleFinanceSpecificFields() {
      const supplierId = document.getElementById('finance-supplier-id')?.value;
      const supplier = allSuppliers.find(item => item.id === supplierId);
      const wrap = document.getElementById('finance-fuel-wrap');
      if (!wrap) return;
      wrap.style.display = supplier && supplier.tipo === 'posto' ? 'block' : 'none';
      if (!supplier || supplier.tipo !== 'posto') {
        const fuelField = document.getElementById('finance-fuel-type');
        if (fuelField) fuelField.value = '';
      }
    }

    function getOrderKmData(orderId) {
      const fuelEntries = allFinanceEntries
        .filter(entry => entry.orderId === orderId && entry.entryType === 'combustivel')
        .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
      if (!fuelEntries.length) {
        return { kmInicial: '', kmFinal: '' };
      }
      return {
        kmInicial: fuelEntries[0].kmInicial || '',
        kmFinal: fuelEntries[fuelEntries.length - 1].kmFinal || ''
      };
    }

    function getVehicleCostStats(options = {}) {
      const vehicleId = options.vehicleId || '';
      const start = options.start || '';
      const end = options.end || '';
      const statsMap = new Map();

      allVehicles.forEach(vehicle => {
        statsMap.set(vehicle.id, {
          vehicleId: vehicle.id,
          frota: vehicle.numeroFrota || '-',
          placa: vehicle.placa || '-',
          modelo: vehicle.modelo || '-',
          totalCost: 0,
          totalKm: 0,
          entries: 0
        });
      });

      allFinanceEntries
        .filter(entry => entry.entryType === 'combustivel')
        .forEach(entry => {
          const order = allOrders.find(item => item.id === entry.orderId);
          if (!order || !order.vehicleId) return;
          if (vehicleId && order.vehicleId !== vehicleId) return;
          if (start && (!entry.dataVencimento || entry.dataVencimento < start)) return;
          if (end && (!entry.dataVencimento || entry.dataVencimento > end)) return;

          const stats = statsMap.get(order.vehicleId);
          if (!stats) return;

          const kmInicial = Number(entry.kmInicial || 0);
          const kmFinal = Number(entry.kmFinal || 0);
          stats.totalCost += Number(entry.total || 0);
          stats.totalKm += Math.max(0, kmFinal - kmInicial);
          stats.entries += 1;
        });

      return Array.from(statsMap.values())
        .filter(item => !vehicleId || item.vehicleId === vehicleId)
        .map(item => ({
          ...item,
          costPerKm: item.totalKm > 0 ? item.totalCost / item.totalKm : 0
        }))
        .sort((a, b) => {
          if (a.entries === 0 && b.entries !== 0) return 1;
          if (b.entries === 0 && a.entries !== 0) return -1;
          return a.costPerKm - b.costPerKm;
        });
    }

    function getDashboardExpirations() {
      const cnhItems = allDrivers
        .map(driver => ({ ...driver, days: daysUntil(driver.validade) }))
        .filter(item => item.days !== null && item.days >= 0 && item.days <= 45)
        .sort((a, b) => a.days - b.days);

      const insuranceItems = allVehicles
        .map(vehicle => ({ ...vehicle, days: daysUntil(vehicle.seguroVencimento) }))
        .filter(item => item.days !== null && item.days >= 0 && item.days <= 45)
        .sort((a, b) => a.days - b.days);

      return { cnhItems, insuranceItems };
    }

    function renderDashboardTableRows(items, formatter) {
      if (!items.length) {
        return '<div class="text-slate-400 text-sm">Nenhum item para exibir no momento.</div>';
      }
      return items.map(formatter).join('');
    }

    function getReportFilters() {
      return {
        type: document.getElementById('report-filter-type')?.value || 'cost',
        vehicleId: document.getElementById('report-filter-vehicle')?.value || '',
        start: document.getElementById('report-filter-start')?.value || '',
        end: document.getElementById('report-filter-end')?.value || ''
      };
    }

    function getReportTitleByType(type) {
      switch (type) {
        case 'cost': return 'Custo por KM';
        case 'orders': return 'OS por veículo';
        case 'orders_open': return 'OS abertas';
        case 'orders_progress': return 'OS em andamento';
        case 'orders_closed': return 'OS fechadas';
        case 'orders_deleted': return 'OS excluídas';
        default: return 'Relatório';
      }
    }

    function getFilteredReportOrders() {
      const { vehicleId, start, end, type } = getReportFilters();
      const source = type === 'orders_deleted' ? deletedOrders : allOrders;
      return source.filter(order => {
        if (vehicleId && order.vehicleId !== vehicleId) return false;
        const reportDate = type === 'orders_deleted'
          ? String(order.deletedAt || '').slice(0, 10)
          : String(order.dataInicio || '');
        if (start && (!reportDate || reportDate < start)) return false;
        if (end && (!reportDate || reportDate > end)) return false;
        if (type === 'orders_open' && order.status !== 'aberta') return false;
        if (type === 'orders_progress' && order.status !== 'andamento') return false;
        if (type === 'orders_closed' && order.status !== 'fechada') return false;
        return true;
      }).sort((a, b) => String(a.numero || '').localeCompare(String(b.numero || '')));
    }

    function getVisibleFinanceEntries() {
      const supplierFilter = document.getElementById('finance-filter-supplier')?.value.trim().toLowerCase() || '';
      const nfFilter = document.getElementById('finance-filter-nf')?.value.trim().toLowerCase() || '';
      const osFilter = document.getElementById('finance-filter-os')?.value.trim().toLowerCase() || '';
      const dateFilter = document.getElementById('finance-filter-date')?.value || '';

      let visibleEntries = allFinanceEntries.filter(entry => {
        const order = allOrders.find(item => item.id === entry.orderId);
        return order && order.status !== 'fechada';
      });

      if (supplierFilter) visibleEntries = visibleEntries.filter(entry => String(entry.fornecedor || '').toLowerCase().includes(supplierFilter));
      if (nfFilter) visibleEntries = visibleEntries.filter(entry => String(entry.nf || '').toLowerCase().includes(nfFilter));
      if (osFilter) visibleEntries = visibleEntries.filter(entry => {
        const order = allOrders.find(item => item.id === entry.orderId);
        return order && String(order.numero || '').toLowerCase().includes(osFilter);
      });
      if (dateFilter) visibleEntries = visibleEntries.filter(entry => entry.dataVencimento === dateFilter);

      return visibleEntries;
    }

    function setModalSubmitState(visible, label = 'Salvar cadastro') {
      const button = document.getElementById('modal-submit-btn');
      if (!button) return;
      button.textContent = label;
      button.style.display = visible ? 'inline-flex' : 'none';
    }

    function setModalActionsVisible(visible) {
      const actions = document.getElementById('modal-actions');
      if (!actions) return;
      actions.style.display = visible ? 'flex' : 'none';
    }

    function loadFinanceForm(entryType) {
      currentModalType = 'finance';
      currentFinanceEntryType = entryType;
      const fields = document.getElementById('modal-fields');
      const kicker = document.getElementById('modal-kicker');
      const title = document.getElementById('modal-title');
      const supplierOptions = allSuppliers
        .filter(supplier => entryType === 'combustivel' ? supplier.tipo === 'posto' : supplier.tipo !== 'posto')
        .map(supplier => `<option value="${supplier.id}">${escapeHtml(supplier.nome)} • ${escapeHtml(supplier.tipoLabel)}</option>`)
        .join('');
      const orderOptions = allOrders
        .filter(order => order.status !== 'fechada')
        .map(order => `<option value="${order.id}">OS ${escapeHtml(getOrderNumberLabel(order))} • ${escapeHtml(getVehicleLabel(order.vehicleId))}</option>`)
        .join('');

      kicker.textContent = 'Financeiro';
      title.textContent = entryType === 'combustivel' ? 'Lançamento de combustível' : 'Lançar despesa';
      fields.innerHTML = `
        <div class="field-wrap full">
          <label>${requiredLabel('Alocar na OS')}</label>
          <select class="soft-input w-full" id="finance-order-id" required>
            <option value="">Selecione a OS</option>
            ${orderOptions}
          </select>
        </div>
        ${entryType === 'despesa' ? `
        <div class="field-wrap">
          <label>${requiredLabel('Natureza financeira')}</label>
          <select class="soft-input w-full" id="finance-kind" required>
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>
        </div>
        ` : `<input id="finance-kind" type="hidden" value="despesa">`}
        <div class="field-wrap">
          <label>${requiredLabel('Data de vencimento')}</label>
          <input class="soft-input w-full" id="finance-data-vencimento" type="date" required>
        </div>
        <div class="field-wrap">
          <label>${requiredLabel(entryType === 'combustivel' ? 'Posto de combustível' : 'Fornecedor')}</label>
          <select class="soft-input w-full" id="finance-supplier-id" onchange="toggleFinanceSpecificFields()" required>
            <option value="">Selecione um parceiro</option>
            ${supplierOptions}
          </select>
        </div>
        <div class="field-wrap">
          <label>NF / referência</label>
          <input class="soft-input w-full" id="finance-nf" placeholder="Ex: NF 1542">
        </div>
        <div class="field-wrap">
          <label>Valor</label>
          <input class="soft-input w-full" id="finance-total" type="number" min="0" step="0.01" value="0">
        </div>
        ${entryType === 'combustivel' ? `
        <div class="field-wrap" id="finance-fuel-wrap">
          <label>${requiredLabel('Tipo de combustível')}</label>
          <select class="soft-input w-full" id="finance-fuel-type">
            <option value="">Selecione</option>
            <option value="Diesel">Diesel</option>
            <option value="Diesel S10">Diesel S10</option>
            <option value="Gasolina">Gasolina</option>
            <option value="Etanol">Etanol</option>
            <option value="GNV">GNV</option>
            <option value="Arla 32">Arla 32</option>
            <option value="Óleo hidráulico">Óleo hidráulico</option>
            <option value="Óleo de motor">Óleo de motor</option>
          </select>
        </div>
        <div class="field-wrap">
          <label>${requiredLabel('KM inicial')}</label>
          <input class="soft-input w-full" id="finance-km-inicial" type="number" min="0" step="1" placeholder="Ex: 20000">
        </div>
        <div class="field-wrap">
          <label>${requiredLabel('KM final')}</label>
          <input class="soft-input w-full" id="finance-km-final" type="number" min="0" step="1" placeholder="Ex: 20115">
        </div>
        ` : ''}
        <div class="field-wrap full">
          <label>Observações</label>
          <textarea class="soft-input textarea w-full" id="finance-observacoes" placeholder="Observações do lançamento"></textarea>
        </div>
      `;

      setModalSubmitState(true, entryType === 'combustivel' ? 'Salvar lançamento de combustível' : 'Salvar lançamento');
      toggleFinanceSpecificFields();
      attachModalInputMasks();
    }

    function renderHomeCards() {
      const vehiclesNode = document.getElementById('home-total-vehicles');
      const driversNode = document.getElementById('home-total-drivers');
      const financeNode = document.getElementById('home-total-finance');
      const costNode = document.getElementById('home-cost-per-km');
      const costLabelNode = document.getElementById('home-cost-per-km-label');
      const cnhNode = document.getElementById('home-cnh-expiring');
      const insuranceNode = document.getElementById('home-insurance-expiring');
      const costTableNode = document.getElementById('home-cost-table');
      const cnhTableNode = document.getElementById('home-cnh-table');
      const insuranceTableNode = document.getElementById('home-insurance-table');
      const vehicleStats = getVehicleCostStats().filter(item => item.entries > 0);
      const bestVehicle = vehicleStats[0];
      const { cnhItems, insuranceItems } = getDashboardExpirations();

      if (vehiclesNode) vehiclesNode.textContent = allVehicles.length;
      if (driversNode) driversNode.textContent = allDrivers.length;
      if (financeNode) financeNode.textContent = allFinanceEntries.length;
      if (costNode) costNode.textContent = bestVehicle ? formatCurrency(bestVehicle.costPerKm) : formatCurrency(0);
      if (costLabelNode) costLabelNode.textContent = bestVehicle
        ? `${bestVehicle.placa} • ${bestVehicle.modelo}`
        : 'Nenhum abastecimento registrado';
      if (cnhNode) cnhNode.textContent = cnhItems.length;
      if (insuranceNode) insuranceNode.textContent = insuranceItems.length;
      if (costTableNode) {
        costTableNode.innerHTML = renderDashboardTableRows(
          vehicleStats.slice(0, 6),
          item => `
            <div class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <div>
                <p class="font-bold text-slate-800">${escapeHtml(item.placa)} • ${escapeHtml(item.modelo)}</p>
                <p class="text-xs text-slate-500">Frota ${escapeHtml(item.frota)} • ${item.totalKm} km • ${item.entries} lançamento(s)</p>
              </div>
              <div class="text-right">
                <p class="font-extrabold text-[#6267d9]">${escapeHtml(formatCurrency(item.costPerKm))}</p>
                <p class="text-xs text-slate-500">${escapeHtml(formatCurrency(item.totalCost))}</p>
              </div>
            </div>
          `
        );
      }
      if (cnhTableNode) {
        cnhTableNode.innerHTML = renderDashboardTableRows(
          cnhItems.slice(0, 6),
          item => `
            <div class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <div>
                <p class="font-bold text-slate-800">${escapeHtml(item.nome)}</p>
                <p class="text-xs text-slate-500">CPF ${escapeHtml(item.cpf || '-')} • CNH ${escapeHtml(item.cnh || '-')}</p>
              </div>
              <div class="text-right">
                <p class="font-extrabold text-[#6267d9]">${escapeHtml(formatDate(item.validade))}</p>
                <p class="text-xs text-slate-500">${item.days} dia(s)</p>
              </div>
            </div>
          `
        );
      }
      if (insuranceTableNode) {
        insuranceTableNode.innerHTML = renderDashboardTableRows(
          insuranceItems.slice(0, 6),
          item => `
            <div class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <div>
                <p class="font-bold text-slate-800">${escapeHtml(item.placa)} • ${escapeHtml(item.modelo)}</p>
                <p class="text-xs text-slate-500">Frota ${escapeHtml(item.numeroFrota || '-')}</p>
              </div>
              <div class="text-right">
                <p class="font-extrabold text-[#6267d9]">${escapeHtml(formatDate(item.seguroVencimento))}</p>
                <p class="text-xs text-slate-500">${item.days} dia(s)</p>
              </div>
            </div>
          `
        );
      }
    }

    function renderReports() {
      const select = document.getElementById('report-filter-vehicle');
      const typeSelect = document.getElementById('report-filter-type');
      const costNode = document.getElementById('report-cost-table');
      const ordersNode = document.getElementById('report-orders-table');
      const costCard = document.getElementById('report-cost-card');
      const ordersCard = document.getElementById('report-orders-card');
      const ordersTitle = document.getElementById('report-orders-title');
      if (!select || !typeSelect || !costNode || !ordersNode || !costCard || !ordersCard || !ordersTitle) return;

      const currentValue = select.value;
      select.innerHTML = '<option value="">Todos os veículos</option>' + allVehicles.map(vehicle => `
        <option value="${vehicle.id}">${escapeHtml(vehicle.placa)} • ${escapeHtml(vehicle.modelo)} • Frota ${escapeHtml(vehicle.numeroFrota || '-')}</option>
      `).join('');
      if (Array.from(select.options).some(option => option.value === currentValue)) {
        select.value = currentValue;
      }

      const filters = getReportFilters();
      const vehicleStats = getVehicleCostStats(filters).filter(item => filters.vehicleId ? item.vehicleId === filters.vehicleId : item.entries > 0);
      const reportOrders = getFilteredReportOrders();
      const isCostReport = filters.type === 'cost';
      const reportTitle = getReportTitleByType(filters.type);

      costCard.style.display = isCostReport ? 'block' : 'none';
      ordersCard.style.display = isCostReport ? 'none' : 'block';
      ordersTitle.textContent = reportTitle;

      costNode.innerHTML = renderDashboardTableRows(
        vehicleStats,
        item => `
          <div class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <div>
              <p class="font-bold text-slate-800">${escapeHtml(item.placa)} • ${escapeHtml(item.modelo)}</p>
              <p class="text-xs text-slate-500">Frota ${escapeHtml(item.frota)} • ${item.totalKm} km rodados</p>
            </div>
            <div class="text-right">
              <p class="font-extrabold text-[#6267d9]">${escapeHtml(formatCurrency(item.costPerKm))}</p>
                <p class="text-xs text-slate-500">${escapeHtml(formatCurrency(item.totalCost))} em combustível</p>
            </div>
          </div>
        `
      );

      ordersNode.innerHTML = renderDashboardTableRows(
        reportOrders,
        order => {
          const vehicle = order.vehicleSnapshot || allVehicles.find(item => item.id === order.vehicleId);
          const total = typeof order.totalLinked === 'number'
            ? order.totalLinked
            : allFinanceEntries.filter(entry => entry.orderId === order.id).reduce((sum, entry) => sum + getFinanceTotal(entry), 0);
          const dateLabel = filters.type === 'orders_deleted'
            ? formatDate(String(order.deletedAt || '').slice(0, 10))
            : formatDate(order.dataInicio);
          const statusLabel = filters.type === 'orders_deleted'
            ? `excluída • ${formatDate(String(order.deletedAt || '').slice(0, 10))}`
            : (order.status || '-');
          return `
            <div class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <div>
                <p class="font-bold text-slate-800">OS ${escapeHtml(getOrderNumberLabel(order))} • ${escapeHtml(vehicle ? vehicle.placa : '-')}</p>
                <p class="text-xs text-slate-500">${escapeHtml(order.descricao || '-')}</p>
              </div>
              <div class="text-right">
                <p class="font-extrabold text-[#6267d9]">${escapeHtml(formatCurrency(total))}</p>
                <p class="text-xs text-slate-500">${escapeHtml(dateLabel)} • ${escapeHtml(statusLabel)}</p>
              </div>
            </div>
          `;
        }
      );
    }

    function printReport() {
      const filters = getReportFilters();
      const isCostReport = filters.type === 'cost';
      const reportTitle = getReportTitleByType(filters.type);
      const vehicleStats = getVehicleCostStats(filters).filter(item => filters.vehicleId ? item.vehicleId === filters.vehicleId : item.entries > 0);
      const reportOrders = getFilteredReportOrders();
      const printWindow = window.open('', '_blank', 'width=1080,height=1200');
      if (!printWindow) {
        showToast('Não foi possível abrir a impressão do relatório.');
        return;
      }

      const rowsCost = vehicleStats.map(item => `
        <tr>
          <td>${escapeHtml(item.frota)}</td>
          <td>${escapeHtml(item.placa)}</td>
          <td>${escapeHtml(item.modelo)}</td>
          <td style="text-align:right;">${item.totalKm}</td>
          <td style="text-align:right;">${escapeHtml(formatCurrency(item.totalCost))}</td>
          <td style="text-align:right;">${escapeHtml(formatCurrency(item.costPerKm))}</td>
        </tr>
      `).join('') || '<tr><td colspan="6">Nenhum dado encontrado.</td></tr>';

      const rowsOrders = reportOrders.map(order => {
        const vehicle = order.vehicleSnapshot || allVehicles.find(item => item.id === order.vehicleId);
        const total = typeof order.totalLinked === 'number'
          ? order.totalLinked
          : allFinanceEntries
            .filter(entry => entry.orderId === order.id)
            .reduce((sum, entry) => sum + getFinanceTotal(entry), 0);
        const dateLabel = filters.type === 'orders_deleted'
          ? formatDate(String(order.deletedAt || '').slice(0, 10))
          : formatDate(order.dataInicio);
        const statusLabel = filters.type === 'orders_deleted' ? 'Excluída' : (order.status || '-');
        return `
          <tr>
            <td>${escapeHtml(getOrderNumberLabel(order))}</td>
            <td>${escapeHtml(vehicle ? vehicle.placa : '-')}</td>
            <td>${escapeHtml(vehicle ? vehicle.modelo : '-')}</td>
            <td>${escapeHtml(dateLabel)}</td>
            <td>${escapeHtml(statusLabel)}</td>
            <td style="text-align:right;">${escapeHtml(formatCurrency(total))}</td>
          </tr>
        `;
      }).join('') || '<tr><td colspan="6">Nenhum dado encontrado.</td></tr>';

      printWindow.document.open();
      printWindow.document.write(`
        <!doctype html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>${reportTitle}</title>
          <style>
            * {
              box-sizing: border-box;
              font-family: Arial, Helvetica, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color-adjust: exact;
              -moz-print-color-adjust: exact;
            }
            body { margin: 24px; color: #111; }
            h1, h2 { margin: 0 0 12px; }
            p { margin: 0 0 20px; color: #444; }
            .report-head { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
            .report-logo { max-width: ${getReportLogoStyle().width}px; max-height: ${getReportLogoStyle().height}px; object-fit: contain; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 28px; border: 1px solid #000; empty-cells: show; }
            th, td { border: 1px solid #000; padding: 8px 10px; font-size: 12px; }
            th { text-transform: uppercase; background: #f4f4f4 !important; }
            @media print {
              table, th, td {
                border-color: #000 !important;
                border-style: solid !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                -moz-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              th, td { border-width: 1pt !important; }
              table { border-width: 1pt !important; }
            }
          </style>
        </head>
        <body>
          <div class="report-head">
            <img class="report-logo" src="${getActiveLogoSrc()}" alt="WeFrotas">
            <h1>${reportTitle}</h1>
          </div>
          <p>Período: ${escapeHtml(formatDate(filters.start))} até ${escapeHtml(formatDate(filters.end))}</p>
          ${isCostReport ? `
          <table>
            <thead>
              <tr>
                <th>Frota</th>
                <th>Placa</th>
                <th>Veículo</th>
                <th>KM</th>
                <th>Custo</th>
                <th>Custo/KM</th>
              </tr>
            </thead>
            <tbody>${rowsCost}</tbody>
          </table>
          ` : `
          <table>
            <thead>
              <tr>
                <th>OS</th>
                <th>Placa</th>
                <th>Veículo</th>
                <th>Data</th>
                <th>Status</th>
                <th>Total vinculado</th>
              </tr>
            </thead>
            <tbody>${rowsOrders}</tbody>
          </table>
          `}
          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
                window.close();
              }, 180);
            };
          <\/script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }

    function pruneSelections() {
      const vehicleIds = new Set(allVehicles.map(vehicle => vehicle.id));
      const driverIds = new Set(allDrivers.map(driver => driver.id));
      const supplierIds = new Set(allSuppliers.map(supplier => supplier.id));
      const orderIds = new Set(allOrders.map(order => order.id));
      const financeIds = new Set(allFinanceEntries.map(entry => entry.id));
      selectedVehicles = new Set(Array.from(selectedVehicles).filter(id => vehicleIds.has(id)));
      selectedDrivers = new Set(Array.from(selectedDrivers).filter(id => driverIds.has(id)));
      selectedSuppliers = new Set(Array.from(selectedSuppliers).filter(id => supplierIds.has(id)));
      selectedOrders = new Set(Array.from(selectedOrders).filter(id => orderIds.has(id)));
      selectedFinance = new Set(Array.from(selectedFinance).filter(id => financeIds.has(id)));
    }

    function updateButtonState(editId, deleteId, count, requiresSingle = true) {
      const editButton = document.getElementById(editId);
      const deleteButton = document.getElementById(deleteId);
      if (editButton) {
        editButton.style.opacity = !requiresSingle || count === 1 ? '1' : '0.45';
        editButton.style.pointerEvents = !requiresSingle || count === 1 ? 'auto' : 'none';
      }
      if (deleteButton) {
        deleteButton.style.opacity = count > 0 ? '1' : '0.45';
        deleteButton.style.pointerEvents = count > 0 ? 'auto' : 'none';
      }
    }

    function updateVehicleSelectionUI() {
      pruneSelections();
      const count = selectedVehicles.size;
      document.getElementById('vehicles-selected-text').textContent = `${count} selecionado${count === 1 ? '' : 's'}`;
      document.getElementById('select-all-vehicles').classList.toggle('checked', allVehicles.length > 0 && count === allVehicles.length);
      updateButtonState('edit-vehicle-btn', 'delete-vehicle-btn', count);
    }

    function updateDriverSelectionUI() {
      pruneSelections();
      const count = selectedDrivers.size;
      document.getElementById('drivers-selected-text').textContent = `${count} selecionado${count === 1 ? '' : 's'}`;
      document.getElementById('select-all-drivers').classList.toggle('checked', allDrivers.length > 0 && count === allDrivers.length);
      updateButtonState('edit-driver-btn', 'delete-driver-btn', count);
    }

    function updateSupplierSelectionUI() {
      pruneSelections();
      const count = selectedSuppliers.size;
      document.getElementById('suppliers-selected-text').textContent = `${count} selecionado${count === 1 ? '' : 's'}`;
      document.getElementById('select-all-suppliers').classList.toggle('checked', allSuppliers.length > 0 && count === allSuppliers.length);
      updateButtonState('edit-supplier-btn', 'delete-supplier-btn', count);
    }

    function updateOrderSelectionUI() {
      pruneSelections();
      const count = selectedOrders.size;
      const visibleOrders = getFilteredOrders();
      document.getElementById('orders-selected-text').textContent = `${count} selecionada${count === 1 ? '' : 's'}`;
      document.getElementById('select-all-orders').classList.toggle('checked', visibleOrders.length > 0 && visibleOrders.every(order => selectedOrders.has(order.id)));
      updateButtonState('edit-order-btn', 'delete-order-btn', count);
      const printButton = document.getElementById('print-order-btn');
      const closeButton = document.getElementById('close-order-btn');
      const reopenButton = document.getElementById('reopen-order-btn');
      [printButton, closeButton, reopenButton].forEach(button => {
        if (!button) return;
        button.style.opacity = count === 1 ? '1' : '0.45';
        button.style.pointerEvents = count === 1 ? 'auto' : 'none';
      });
    }

    function updateFinanceSelectionUI() {
      pruneSelections();
      const count = selectedFinance.size;
      const visibleEntries = getVisibleFinanceEntries();
      document.getElementById('finance-selected-text').textContent = `${count} selecionado${count === 1 ? '' : 's'}`;
      document.getElementById('select-all-finance').classList.toggle('checked', visibleEntries.length > 0 && visibleEntries.every(entry => selectedFinance.has(entry.id)));
      updateButtonState('edit-finance-btn', 'delete-finance-btn', count);
    }

    function toggleVehicleSelection(event, id) {
      if (event) event.stopPropagation();
      if (selectedVehicles.has(id)) selectedVehicles.delete(id);
      else selectedVehicles.add(id);
      renderVehicles();
    }

    function toggleDriverSelection(event, id) {
      if (event) event.stopPropagation();
      if (selectedDrivers.has(id)) selectedDrivers.delete(id);
      else selectedDrivers.add(id);
      renderDrivers();
    }

    function toggleSupplierSelection(event, id) {
      if (event) event.stopPropagation();
      if (selectedSuppliers.has(id)) selectedSuppliers.delete(id);
      else selectedSuppliers.add(id);
      renderSuppliers();
    }

    function toggleOrderSelection(event, id) {
      if (event) event.stopPropagation();
      if (selectedOrders.has(id)) selectedOrders.delete(id);
      else selectedOrders.add(id);
      renderOrders();
    }

    function toggleFinanceSelection(event, id) {
      if (event) event.stopPropagation();
      if (selectedFinance.has(id)) selectedFinance.delete(id);
      else selectedFinance.add(id);
      renderFinance();
    }

    function toggleSelectAllVehicles(event) {
      if (event) event.stopPropagation();
      if (selectedVehicles.size === allVehicles.length) selectedVehicles.clear();
      else selectedVehicles = new Set(allVehicles.map(vehicle => vehicle.id));
      renderVehicles();
    }

    function toggleSelectAllDrivers(event) {
      if (event) event.stopPropagation();
      if (selectedDrivers.size === allDrivers.length) selectedDrivers.clear();
      else selectedDrivers = new Set(allDrivers.map(driver => driver.id));
      renderDrivers();
    }

    function toggleSelectAllSuppliers(event) {
      if (event) event.stopPropagation();
      if (selectedSuppliers.size === allSuppliers.length) selectedSuppliers.clear();
      else selectedSuppliers = new Set(allSuppliers.map(supplier => supplier.id));
      renderSuppliers();
    }

    function toggleSelectAllOrders(event) {
      if (event) event.stopPropagation();
      const visibleOrders = getFilteredOrders();
      const allVisibleSelected = visibleOrders.length > 0 && visibleOrders.every(order => selectedOrders.has(order.id));
      if (allVisibleSelected) visibleOrders.forEach(order => selectedOrders.delete(order.id));
      else visibleOrders.forEach(order => selectedOrders.add(order.id));
      renderOrders();
    }

    function toggleSelectAllFinance(event) {
      if (event) event.stopPropagation();
      const visibleEntries = getVisibleFinanceEntries();
      const allVisibleSelected = visibleEntries.length > 0 && visibleEntries.every(entry => selectedFinance.has(entry.id));
      if (allVisibleSelected) visibleEntries.forEach(entry => selectedFinance.delete(entry.id));
      else visibleEntries.forEach(entry => selectedFinance.add(entry.id));
      renderFinance();
    }

    function renderVehicles() {
      const list = document.getElementById('vehicles-list');
      if (!list) return;
      if (!allVehicles.length) {
        list.innerHTML = '<div class="empty-state">Nenhum veículo cadastrado. Clique no botão + para começar.</div>';
        selectedVehicles.clear();
        updateVehicleSelectionUI();
        return;
      }
      list.innerHTML = allVehicles.map(vehicle => `
        <div class="list-card ${selectedVehicles.has(vehicle.id) ? 'selected' : ''}">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="flex items-start gap-4">
              <button class="selection-check ${selectedVehicles.has(vehicle.id) ? 'checked' : ''}" onclick="toggleVehicleSelection(event, '${vehicle.id}')">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 12l4 4 10-10"/>
                </svg>
              </button>
              <div>
              <div class="flex items-center gap-3 flex-wrap">
                <h3 class="text-2xl font-extrabold text-slate-900">${vehicle.placa}</h3>
                <span class="mini-badge">Frota ${vehicle.numeroFrota}</span>
                <span class="mini-badge">${vehicle.ano}</span>
              </div>
              <p class="text-slate-700 font-semibold mt-2">${vehicle.modelo}</p>
                <div class="flex gap-3 flex-wrap mt-4 text-sm text-slate-500">
                  ${vehicle.cor ? `<span>Cor: ${vehicle.cor}</span>` : ''}
                  ${vehicle.chassi ? `<span>Chassi: ${vehicle.chassi}</span>` : ''}
                  ${vehicle.seguroVencimento ? `<span>Seguro: ${formatDate(vehicle.seguroVencimento)}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="mini-badge">Veículo ativo</div>
          </div>
        </div>
      `).join('');
      updateVehicleSelectionUI();
    }

    function renderDrivers() {
      const list = document.getElementById('drivers-list');
      if (!list) return;
      if (!allDrivers.length) {
        list.innerHTML = '<div class="empty-state">Nenhum motorista cadastrado. Clique no botão + para começar.</div>';
        selectedDrivers.clear();
        updateDriverSelectionUI();
        return;
      }
      list.innerHTML = allDrivers.map(driver => `
        <div class="list-card ${selectedDrivers.has(driver.id) ? 'selected' : ''}">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="flex items-start gap-4">
              <button class="selection-check ${selectedDrivers.has(driver.id) ? 'checked' : ''}" onclick="toggleDriverSelection(event, '${driver.id}')">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 12l4 4 10-10"/>
                </svg>
              </button>
              <div>
              <div class="flex items-center gap-3 flex-wrap">
                <h3 class="text-2xl font-extrabold text-slate-900">${driver.nome}</h3>
                <span class="mini-badge">Categoria ${driver.categoria}</span>
              </div>
              <div class="flex gap-3 flex-wrap mt-4 text-sm text-slate-500">
                <span>CPF: ${driver.cpf}</span>
                <span>CNH: ${driver.cnh}</span>
                ${driver.telefone ? `<span>Telefone: ${driver.telefone}</span>` : ''}
                ${driver.validade ? `<span>Validade: ${driver.validade}</span>` : ''}
              </div>
              </div>
            </div>
            <div class="mini-badge">Motorista ativo</div>
          </div>
        </div>
      `).join('');
      updateDriverSelectionUI();
    }

    function renderSuppliers() {
      const list = document.getElementById('suppliers-list');
      if (!list) return;
      if (!allSuppliers.length) {
        list.innerHTML = '<div class="empty-state">Nenhum fornecedor cadastrado ainda.</div>';
        selectedSuppliers.clear();
        updateSupplierSelectionUI();
        return;
      }
      list.innerHTML = allSuppliers.map(supplier => `
        <div class="list-card ${selectedSuppliers.has(supplier.id) ? 'selected' : ''}">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="flex items-start gap-4">
              <button class="selection-check ${selectedSuppliers.has(supplier.id) ? 'checked' : ''}" onclick="toggleSupplierSelection(event, '${supplier.id}')">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 12l4 4 10-10"/>
                </svg>
              </button>
              <div>
                <div class="flex items-center gap-3 flex-wrap">
                  <h3 class="text-2xl font-extrabold text-slate-900">${escapeHtml(supplier.nome)}</h3>
                  <span class="mini-badge">${escapeHtml(supplier.tipoLabel)}</span>
                </div>
                <div class="flex gap-3 flex-wrap mt-4 text-sm text-slate-500">
                  ${supplier.documento ? `<span>Documento: ${escapeHtml(supplier.documento)}</span>` : ''}
                  ${supplier.telefone ? `<span>Telefone: ${escapeHtml(supplier.telefone)}</span>` : ''}
                  ${supplier.email ? `<span>E-mail: ${escapeHtml(supplier.email)}</span>` : ''}
                </div>
                ${supplier.observacoes ? `<p class="text-slate-700 mt-4 leading-7">${escapeHtml(supplier.observacoes)}</p>` : ''}
              </div>
            </div>
            <div class="mini-badge">Parceiro ativo</div>
          </div>
        </div>
      `).join('');
      updateSupplierSelectionUI();
    }

    function getFilteredOrders() {
      const number = document.getElementById('order-filter-number')?.value.trim().toLowerCase() || '';
      const start = document.getElementById('order-filter-start')?.value || '';
      const end = document.getElementById('order-filter-end')?.value || '';
      const status = document.getElementById('order-filter-status')?.value || '';
      const sort = document.getElementById('order-filter-sort')?.value || 'recentes';

      let items = [...allOrders];
      if (number) items = items.filter(order => String(order.numero).toLowerCase().includes(number));
      if (start) items = items.filter(order => !order.dataInicio || order.dataInicio >= start);
      if (end) items = items.filter(order => !order.dataInicio || order.dataInicio <= end);
      if (status) items = items.filter(order => order.status === status);
      items.sort((a, b) => sort === 'antigas'
        ? String(a.numero).localeCompare(String(b.numero))
        : String(b.numero).localeCompare(String(a.numero))
      );
      return items;
    }

    function renderOrders() {
      const list = document.getElementById('orders-list');
      if (!list) return;
      const filteredOrders = getFilteredOrders();
      if (!filteredOrders.length) {
        list.innerHTML = '<div class="empty-state">Nenhuma ordem de serviço cadastrada.</div>';
        selectedOrders = new Set(Array.from(selectedOrders).filter(id => allOrders.some(order => order.id === id)));
        updateOrderSelectionUI();
        return;
      }
      list.innerHTML = filteredOrders.map(order => {
        const vehicle = allVehicles.find(item => item.id === order.vehicleId);
        const driver = allDrivers.find(item => item.id === order.driverId);
        const financialItems = allFinanceEntries.filter(item => item.orderId === order.id);
        const totalFinance = financialItems.reduce((sum, item) => sum + getFinanceTotal(item), 0);
        return `
          <div class="list-card ${selectedOrders.has(order.id) ? 'selected' : ''}">
            <div class="flex items-start justify-between gap-5 flex-wrap">
              <div class="flex items-start gap-4">
                <button class="selection-check ${selectedOrders.has(order.id) ? 'checked' : ''}" onclick="toggleOrderSelection(event, '${order.id}')">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 12l4 4 10-10"/>
                  </svg>
                </button>
                <div>
                  <div class="flex items-center gap-3 flex-wrap">
                    <h3 class="text-2xl font-extrabold text-slate-900">OS ${escapeHtml(getOrderNumberLabel(order))}</h3>
                    <span class="mini-badge">${escapeHtml(order.status || 'aberta')}</span>
                    <span class="mini-badge">${financialItems.length} lançamento(s)</span>
                  </div>
                  <div class="flex gap-3 flex-wrap mt-4 text-sm text-slate-500">
                    <span>Veículo: ${escapeHtml(vehicle ? vehicle.placa : '-')}</span>
                    <span>Responsável: ${escapeHtml(driver ? driver.nome : order.responsavelNome || '-')}</span>
                    <span>Início: ${formatDate(order.dataInicio)}</span>
                    <span>Término: ${formatDate(order.dataTermino)}</span>
                    <span>KM inicial: ${escapeHtml(getOrderKmData(order.id).kmInicial || '-')}</span>
                    <span>KM final: ${escapeHtml(getOrderKmData(order.id).kmFinal || '-')}</span>
                  </div>
                  <p class="text-slate-700 mt-4 leading-7">${escapeHtml(order.descricao || '-')}</p>
                </div>
              </div>
              <div class="mini-badge">${formatCurrency(totalFinance)}</div>
            </div>
          </div>
        `;
      }).join('');
      updateOrderSelectionUI();
    }

    function renderFinance() {
      const list = document.getElementById('finance-list');
      if (!list) return;
      let visibleEntries = getVisibleFinanceEntries();
      if (!visibleEntries.length) {
        list.innerHTML = '<div class="empty-state">Nenhum lançamento financeiro cadastrado.</div>';
        selectedFinance = new Set(Array.from(selectedFinance).filter(id => allFinanceEntries.some(entry => entry.id === id)));
        updateFinanceSelectionUI();
        return;
      }
      list.innerHTML = visibleEntries.map(entry => {
        const order = allOrders.find(item => item.id === entry.orderId);
        return `
          <div class="list-card ${selectedFinance.has(entry.id) ? 'selected' : ''}">
            <div class="flex items-start justify-between gap-5 flex-wrap">
              <div class="flex items-start gap-4">
                <button class="selection-check ${selectedFinance.has(entry.id) ? 'checked' : ''}" onclick="toggleFinanceSelection(event, '${entry.id}')">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 12l4 4 10-10"/>
                  </svg>
                </button>
                <div>
                  <div class="flex items-center gap-3 flex-wrap">
                    <h3 class="text-2xl font-extrabold text-slate-900">${escapeHtml(entry.fornecedor || 'Lançamento')}</h3>
                    <span class="mini-badge">OS ${escapeHtml(order ? getOrderNumberLabel(order) : '-')}</span>
                    <span class="mini-badge">${escapeHtml(entry.kindLabel || 'Despesa')}</span>
                    ${entry.nf ? `<span class="mini-badge">${escapeHtml(entry.nf)}</span>` : ''}
                  </div>
                  <div class="flex gap-3 flex-wrap mt-4 text-sm text-slate-500">
                    <span>Vencimento: ${formatDate(entry.dataVencimento)}</span>
                    <span>Tipo: ${escapeHtml(entry.entryType === 'combustivel' ? 'Combustível' : 'Despesa')}</span>
                    ${entry.fuelType ? `<span>Combustível: ${escapeHtml(entry.fuelType)}</span>` : ''}
                    ${entry.kmInicial ? `<span>KM inicial: ${escapeHtml(entry.kmInicial)}</span>` : ''}
                    ${entry.kmFinal ? `<span>KM final: ${escapeHtml(entry.kmFinal)}</span>` : ''}
                  </div>
                  ${entry.observacoes ? `<p class="text-slate-700 mt-4 leading-7">${escapeHtml(entry.observacoes)}</p>` : ''}
                </div>
              </div>
              <div class="mini-badge">${formatCurrency(getFinanceTotal(entry))}</div>
            </div>
          </div>
        `;
      }).join('');
      updateFinanceSelectionUI();
    }

    function clearOrderFilters() {
      document.getElementById('order-filter-number').value = '';
      document.getElementById('order-filter-start').value = '';
      document.getElementById('order-filter-end').value = '';
      document.getElementById('order-filter-status').value = '';
      document.getElementById('order-filter-sort').value = 'recentes';
      renderOrders();
    }

    function clearFinanceFilters() {
      document.getElementById('finance-filter-supplier').value = '';
      document.getElementById('finance-filter-nf').value = '';
      document.getElementById('finance-filter-os').value = '';
      document.getElementById('finance-filter-date').value = '';
      renderFinance();
    }

    function editSelectedVehicle() {
      if (selectedVehicles.size !== 1) {
        showToast('Selecione apenas um veículo para editar.');
        return;
      }
      const id = Array.from(selectedVehicles)[0];
      const vehicle = allVehicles.find(item => item.id === id);
      if (!vehicle) return;
      openCadastroModal('vehicle');
      currentEditingId = id;
      document.getElementById('vehicle-frota').value = vehicle.numeroFrota;
      document.getElementById('vehicle-placa').value = vehicle.placa;
      document.getElementById('vehicle-modelo').value = vehicle.modelo;
      document.getElementById('vehicle-ano').value = vehicle.ano;
      document.getElementById('vehicle-cor').value = vehicle.cor || '';
      document.getElementById('vehicle-seguro').value = vehicle.seguroVencimento || '';
      document.getElementById('vehicle-chassi').value = vehicle.chassi || '';
      document.getElementById('modal-title').textContent = 'Editar veículo';
    }

    function editSelectedDriver() {
      if (selectedDrivers.size !== 1) {
        showToast('Selecione apenas um motorista para editar.');
        return;
      }
      const id = Array.from(selectedDrivers)[0];
      const driver = allDrivers.find(item => item.id === id);
      if (!driver) return;
      openCadastroModal('driver');
      currentEditingId = id;
      document.getElementById('driver-nome').value = driver.nome;
      document.getElementById('driver-cpf').value = driver.cpf;
      document.getElementById('driver-cnh').value = driver.cnh;
      document.getElementById('driver-categoria').value = driver.categoria;
      document.getElementById('driver-telefone').value = driver.telefone || '';
      document.getElementById('driver-validade').value = driver.validade || '';
      document.getElementById('modal-title').textContent = 'Editar motorista';
    }

    function editSelectedSupplier() {
      if (selectedSuppliers.size !== 1) {
        showToast('Selecione apenas um fornecedor para editar.');
        return;
      }
      const id = Array.from(selectedSuppliers)[0];
      const supplier = allSuppliers.find(item => item.id === id);
      if (!supplier) return;
      openCadastroModal('supplier');
      currentEditingId = id;
      document.getElementById('supplier-name').value = supplier.nome || '';
      document.getElementById('supplier-type').value = supplier.tipo || '';
      document.getElementById('supplier-document').value = supplier.documento || '';
      document.getElementById('supplier-phone').value = supplier.telefone || '';
      document.getElementById('supplier-email').value = supplier.email || '';
      document.getElementById('supplier-notes').value = supplier.observacoes || '';
      document.getElementById('modal-title').textContent = 'Editar fornecedor';
    }

    function editSelectedOrder() {
      if (selectedOrders.size !== 1) {
        showToast('Selecione apenas uma OS para editar.');
        return;
      }
      const id = Array.from(selectedOrders)[0];
      const order = allOrders.find(item => item.id === id);
      if (!order) return;
      openCadastroModal('order');
      currentEditingId = id;
      document.getElementById('order-numero').value = getOrderNumberLabel(order);
      document.getElementById('order-administracao').value = order.administracao || '';
      document.getElementById('order-veiculo').value = order.vehicleId || '';
      document.getElementById('order-driver').value = order.driverId || '';
      document.getElementById('order-data-inicio').value = order.dataInicio || '';
      document.getElementById('order-data-termino').value = order.dataTermino || '';
      document.getElementById('order-status').value = order.status || 'aberta';
      document.getElementById('order-descricao').value = order.descricao || '';
      document.getElementById('modal-title').textContent = 'Editar OS';
    }

    function editSelectedFinance() {
      if (selectedFinance.size !== 1) {
        showToast('Selecione apenas um lançamento para editar.');
        return;
      }
      const id = Array.from(selectedFinance)[0];
      const entry = allFinanceEntries.find(item => item.id === id);
      if (!entry) return;
      openCadastroModal('finance');
      loadFinanceForm(entry.entryType || 'despesa');
      currentEditingId = id;
      document.getElementById('finance-order-id').value = entry.orderId || '';
      document.getElementById('finance-kind').value = entry.kind || 'despesa';
      document.getElementById('finance-data-vencimento').value = entry.dataVencimento || '';
      document.getElementById('finance-supplier-id').value = entry.supplierId || '';
      document.getElementById('finance-nf').value = entry.nf || '';
      document.getElementById('finance-total').value = entry.total ?? 0;
      toggleFinanceSpecificFields();
      if (document.getElementById('finance-fuel-type')) {
        document.getElementById('finance-fuel-type').value = entry.fuelType || '';
      }
      if (document.getElementById('finance-km-inicial')) {
        document.getElementById('finance-km-inicial').value = entry.kmInicial || '';
      }
      if (document.getElementById('finance-km-final')) {
        document.getElementById('finance-km-final').value = entry.kmFinal || '';
      }
      document.getElementById('finance-observacoes').value = entry.observacoes || '';
      document.getElementById('modal-title').textContent = 'Editar lançamento';
    }

    function deleteSelectedVehicles() {
      if (!selectedVehicles.size) {
        showToast('Selecione pelo menos um veículo para excluir.');
        return;
      }
      const linkedOrders = allOrders.filter(order => selectedVehicles.has(order.vehicleId));
      if (linkedOrders.length) {
        showToast('Não é possível excluir veículo com OS vinculada.');
        return;
      }
      allVehicles = allVehicles.filter(vehicle => !selectedVehicles.has(vehicle.id));
      selectedVehicles.clear();
      saveToLocalStorage();
      renderAll();
      showToast('Veículo(s) excluído(s) com sucesso.');
    }

    function deleteSelectedDrivers() {
      if (!selectedDrivers.size) {
        showToast('Selecione pelo menos um motorista para excluir.');
        return;
      }
      const linkedOrders = allOrders.filter(order => selectedDrivers.has(order.driverId));
      if (linkedOrders.length) {
        showToast('Não é possível excluir motorista com OS vinculada.');
        return;
      }
      allDrivers = allDrivers.filter(driver => !selectedDrivers.has(driver.id));
      selectedDrivers.clear();
      saveToLocalStorage();
      renderAll();
      showToast('Motorista(s) excluído(s) com sucesso.');
    }

    function deleteSelectedSuppliers() {
      if (!selectedSuppliers.size) {
        showToast('Selecione pelo menos um fornecedor para excluir.');
        return;
      }
      allSuppliers = allSuppliers.filter(supplier => !selectedSuppliers.has(supplier.id));
      selectedSuppliers.clear();
      saveToLocalStorage();
      renderAll();
      showToast('Fornecedor(es) excluído(s) com sucesso.');
    }

    function deleteSelectedOrders() {
      if (!selectedOrders.size) {
        showToast('Selecione pelo menos uma OS para excluir.');
        return;
      }
      const deletedIds = new Set(selectedOrders);
      const deletedAt = new Date().toISOString();
      const deletedBatch = allOrders
        .filter(order => deletedIds.has(order.id))
        .map(order => {
          const vehicle = allVehicles.find(item => item.id === order.vehicleId);
          const linkedEntries = allFinanceEntries.filter(entry => entry.orderId === order.id);
          return {
            ...order,
            deletedAt,
            vehicleSnapshot: vehicle ? {
              id: vehicle.id,
              placa: vehicle.placa,
              modelo: vehicle.modelo,
              numeroFrota: vehicle.numeroFrota
            } : null,
            totalLinked: linkedEntries.reduce((sum, entry) => sum + getFinanceTotal(entry), 0)
          };
        });
      deletedOrders = [...deletedBatch, ...deletedOrders].slice(0, 500);
      allOrders = allOrders.filter(order => !deletedIds.has(order.id));
      allFinanceEntries = allFinanceEntries.filter(entry => !deletedIds.has(entry.orderId));
      selectedOrders.clear();
      saveToLocalStorage();
      renderAll();
      showToast('OS e lançamentos vinculados excluídos com sucesso.');
    }

    function deleteSelectedFinance() {
      if (!selectedFinance.size) {
        showToast('Selecione pelo menos um lançamento para excluir.');
        return;
      }
      allFinanceEntries = allFinanceEntries.filter(entry => !selectedFinance.has(entry.id));
      selectedFinance.clear();
      saveToLocalStorage();
      renderAll();
      showToast('Lançamento(s) excluído(s) com sucesso.');
    }

    function closeSelectedOrder() {
      if (selectedOrders.size !== 1) {
        showToast('Selecione uma OS para fechar.');
        return;
      }
      const id = Array.from(selectedOrders)[0];
      allOrders = allOrders.map(order => order.id === id
        ? { ...order, status: 'fechada', dataTermino: order.dataTermino || new Date().toISOString().split('T')[0] }
        : order);
      saveToLocalStorage();
      renderAll();
      showToast('OS fechada com sucesso.');
    }

    function reopenSelectedOrder() {
      if (selectedOrders.size !== 1) {
        showToast('Selecione uma OS para reabrir.');
        return;
      }
      const id = Array.from(selectedOrders)[0];
      openPromptModal({
        title: 'Reabrir OS',
        text: 'Informe o motivo da reabertura. Essa justificativa será adicionada à descrição da ordem de serviço.',
        placeholder: 'Ex.: retorno da oficina, ajuste interno, complemento financeiro...',
        onConfirm: (justification) => {
          const today = formatDate(getLocalIsoDate());
          allOrders = allOrders.map(order => order.id === id
            ? {
                ...order,
                status: 'aberta',
                descricao: `${order.descricao || ''}${order.descricao ? '\n\n' : ''}OS REABERTA EM ${today} motivo: ${justification}`
              }
            : order);
          saveToLocalStorage();
          renderAll();
          showToast('OS reaberta com sucesso.');
        }
      });
    }

    function printSelectedOrder() {
      if (selectedOrders.size !== 1) {
        showToast('Selecione uma OS para imprimir.');
        return;
      }
      const id = Array.from(selectedOrders)[0];
      const order = allOrders.find(item => item.id === id);
      if (!order) return;
      const vehicle = allVehicles.find(item => item.id === order.vehicleId);
      const driver = allDrivers.find(item => item.id === order.driverId);
      const kmData = getOrderKmData(order.id);
      const entries = allFinanceEntries.filter(item => item.orderId === order.id);
      const totalEntries = entries.reduce((sum, item) => sum + getFinanceTotal(item), 0);
      const statusLabel = (order.status || 'aberta').charAt(0).toUpperCase() + (order.status || 'aberta').slice(1);

      const rows = Array.from({ length: Math.max(entries.length, 34) }, (_, index) => {
        const entry = entries[index];
        return `
          <tr>
            <td>${entry ? escapeHtml(formatDate(entry.dataVencimento)) : ''}</td>
            <td>${entry ? escapeHtml([entry.fornecedor, entry.nf, entry.fuelType].filter(Boolean).join(' • ')) : ''}</td>
            <td class="money">${entry && entry.kind === 'despesa' ? escapeHtml(formatCurrency(entry.total)) : ''}</td>
            <td class="money">${entry && entry.kind === 'receita' ? escapeHtml(formatCurrency(entry.total)) : ''}</td>
            <td class="money">${entry ? escapeHtml(formatCurrency(getFinanceTotal(entry))) : ''}</td>
          </tr>
        `;
      }).join('');

      const printWindow = window.open('', '_blank', 'width=980,height=1200');
      if (!printWindow) {
        showToast('Não foi possível abrir a janela de impressão.');
        return;
      }

      printWindow.document.open();
      printWindow.document.write(`
        <!doctype html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>OS ${escapeHtml(getOrderNumberLabel(order))}</title>
          <style>
            @page { size: A4; margin: 8mm; }
            * {
              box-sizing: border-box;
              font-family: Arial, Helvetica, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color-adjust: exact;
              -moz-print-color-adjust: exact;
            }
            html, body { margin: 0; padding: 0; background: #fff; color: #000; }
            body { padding: 8px; }
            .sheet { width: 196mm; max-width: 100%; margin: 0 auto; }
            table {
              width: 100%;
              table-layout: fixed;
              border-collapse: collapse;
              border: 1px solid #000;
              empty-cells: show;
            }
            td, th {
              border: 1px solid #000;
              padding: 2px 4px;
              font-size: 10px;
              vertical-align: middle;
            }
            .top-strip td { height: 20px; background: #d9d9d9 !important; }
            .header-logo-cell { width: 22%; padding: 10px 12px 6px 20px; text-align: left; }
            .header-main-cell { width: 56%; text-align: center; padding: 10px 8px 8px; }
            .header-number-cell { width: 22%; text-align: right; padding: 20px 18px 8px 8px; }
            .brand-logo { max-width: ${getOsLogoStyle().width}px; max-height: ${getOsLogoStyle().height}px; object-fit: contain; display: block; }
            .admin-line { font-size: 10px; font-weight: 800; letter-spacing: 0.02em; margin-bottom: 10px; }
            .title-line { font-size: 15px; font-weight: 800; line-height: 1.2; }
            .status-line { margin-top: 16px; font-size: 10px; font-weight: 700; }
            .number-wrap { display: inline-flex; align-items: baseline; gap: 6px; }
            .number-label { font-size: 18px; font-style: italic; font-weight: 800; }
            .number-value { font-size: 22px; font-style: italic; font-weight: 800; line-height: 1; }
            .info-table td { height: 18px; }
            .label { font-weight: 700; }
            .gray-cell { background: #d9d9d9 !important; }
            .block-gap { margin-top: 24px; }
            .desc-title td { height: 40px; text-align: center; font-size: 11px; font-weight: 800; text-transform: uppercase; background: #d9d9d9 !important; }
            .desc-box td { height: 90px; vertical-align: top; padding: 8px; white-space: pre-wrap; line-height: 1.35; }
            .signature-block td { height: 74px; }
            .sign-wrap { width: 250px; margin: 40px auto 0; text-align: center; }
            .sign-line { width: 100%; border-top: 1px solid #000; min-height: 1px; display: block; }
            .sign-label { margin-top: 2px; font-size: 11px; font-weight: 800; }
            .finance-table { margin-top: 0; }
            .finance-table th {
              height: 46px;
              background: #d9d9d9 !important;
              text-align: center;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              line-height: 1.1;
            }
            .finance-table td { height: 15px; font-size: 10px; }
            .money { text-align: right; white-space: nowrap; }
            .finance-table td.finance-total-spacer {
              border-left: none !important;
              border-bottom: none !important;
              border-right: none !important;
              border-top: 1px solid #000 !important;
            }
            .finance-total-label { text-align: center; font-size: 11px; font-weight: 800; }
            @media print {
              table, td, th {
                border-color: #000 !important;
                border-style: solid !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                -moz-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              td, th { border-width: 1pt !important; }
              table { border-width: 1pt !important; }
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <table class="top-strip">
              <tr><td></td></tr>
            </table>

            <table class="header-table">
              <tr>
                <td class="header-logo-cell"><img class="brand-logo" src="${getActiveLogoSrc()}" alt="WeFrotas"></td>
                <td class="header-main-cell">
                  <div class="admin-line">${escapeHtml(order.administracao || 'NOME PREENCHIDO NA ADMINISTRAÇÃO')}</div>
                  <div class="title-line">Ordem de Serviço para veículos/Máquinas</div>
                  <div class="status-line">Status: ${escapeHtml(statusLabel)}</div>
                </td>
                <td class="header-number-cell">
                  <div class="number-wrap">
                    <span class="number-label">Nº:</span>
                    <span class="number-value">${escapeHtml(getOrderNumberLabel(order))}</span>
                  </div>
                </td>
              </tr>
            </table>

            <table class="info-table">
              <tr>
                <td class="label" style="width:14%;">Administração:</td>
                <td style="width:54%;">${escapeHtml(order.administracao || '')}</td>
                <td class="label" style="width:16%;">DT. INÍCIO:</td>
                <td style="width:16%;">${escapeHtml(formatDate(order.dataInicio))}</td>
              </tr>
              <tr>
                <td class="label">Veículo:</td>
                <td>${escapeHtml(vehicle ? vehicle.modelo : '')}</td>
                <td class="label">DT. TÉRMINO:</td>
                <td>${escapeHtml(formatDate(order.dataTermino))}</td>
              </tr>
              <tr>
                <td class="label">Placa:</td>
                <td>${escapeHtml(vehicle ? vehicle.placa : '')}</td>
                <td class="label" style="width:16%;">KM INICIAL:</td>
                <td style="width:16%;">${escapeHtml(kmData.kmInicial || '')}</td>
              </tr>
              <tr>
                <td class="label">Chassi:</td>
                <td>${escapeHtml(vehicle ? vehicle.chassi || '' : '')}</td>
                <td class="label">KM FINAL:</td>
                <td>${escapeHtml(kmData.kmFinal || '')}</td>
              </tr>
              <tr>
                <td class="label">Responsável:</td>
                <td colspan="5">${escapeHtml(driver ? driver.nome : order.responsavelNome || '')}</td>
              </tr>
            </table>

            <table class="desc-title block-gap">
              <tr>
                <td>DESCRIÇÃO DO SERVIÇO/PROBLEMA:</td>
              </tr>
            </table>

            <table class="desc-box">
              <tr>
                <td>${escapeHtml(order.descricao || '')}</td>
              </tr>
            </table>

            <table class="signature-block block-gap">
              <tr>
                <td>
                  <div class="sign-wrap">
                    <div class="sign-line"></div>
                    <div class="sign-label">AUTORIZADOR</div>
                  </div>
                </td>
              </tr>
            </table>

            <table class="finance-table">
              <thead>
                <tr>
                  <th style="width: 14%;">DATA<br>VENCIMENTO</th>
                  <th>FORNECEDOR E NF´S</th>
                  <th style="width: 17%;">DÉBITO</th>
                  <th style="width: 16%;">CRÉDITO</th>
                  <th style="width: 16%;">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
                <tr class="total-row">
                  <td colspan="3" class="finance-total-spacer"></td>
                  <td class="finance-total-label">TOTAL</td>
                  <td class="money">${entries.length ? escapeHtml(formatCurrency(totalEntries)) : 'R$'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
                window.close();
              }, 180);
            };
          <\/script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }

    function renderAll() {
      renderHomeCards();
      renderVehicles();
      renderDrivers();
      renderSuppliers();
      renderOrders();
      renderFinance();
      renderReports();
    }

    document.getElementById('cadastro-form').addEventListener('submit', function (event) {
      event.preventDefault();
      if (currentModalType === 'vehicle') {
        const numeroFrota = document.getElementById('vehicle-frota').value.trim();
        const placa = document.getElementById('vehicle-placa').value.trim();
        const modelo = document.getElementById('vehicle-modelo').value.trim();
        const ano = document.getElementById('vehicle-ano').value.trim();
        const cor = document.getElementById('vehicle-cor').value.trim();
        const seguroVencimento = document.getElementById('vehicle-seguro').value.trim();
        const chassi = document.getElementById('vehicle-chassi').value.trim();
        if (!numeroFrota || !placa || !modelo || !ano) {
          showToast('Preencha número de frota, placa, modelo e ano.');
          return;
        }
        if (findVehicleDuplicate({ numeroFrota, placa }, currentEditingId)) {
          showToast('Já existe um veículo com essa frota ou placa cadastrada.');
          return;
        }
        if (currentEditingId) {
          allVehicles = allVehicles.map(vehicle => vehicle.id === currentEditingId
            ? { ...vehicle, numeroFrota, placa, modelo, ano, cor, seguroVencimento, chassi }
            : vehicle);
          showToast('Veículo atualizado com sucesso.');
        } else {
          allVehicles.unshift({ id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, numeroFrota, placa, modelo, ano, cor, seguroVencimento, chassi });
          showToast('Veículo cadastrado com sucesso.');
        }
        saveToLocalStorage();
        renderAll();
        closeCadastroModal();
      }

      if (currentModalType === 'driver') {
        const nome = document.getElementById('driver-nome').value.trim();
        const cpf = formatCpf(document.getElementById('driver-cpf').value.trim());
        const cnh = document.getElementById('driver-cnh').value.trim();
        const categoria = document.getElementById('driver-categoria').value.trim();
        const telefone = document.getElementById('driver-telefone').value.trim();
        const validade = document.getElementById('driver-validade').value.trim();
        if (!nome || !cpf || !cnh || !categoria) {
          showToast('Preencha nome, CPF, CNH e categoria do motorista.');
          return;
        }
        if (!isValidCpf(cpf)) {
          showToast('Informe um CPF válido para o motorista.');
          return;
        }
        if (findDriverDuplicate({ cpf, cnh }, currentEditingId)) {
          showToast('Já existe um motorista com esse CPF ou CNH cadastrado.');
          return;
        }
        if (currentEditingId) {
          allDrivers = allDrivers.map(driver => driver.id === currentEditingId
            ? { ...driver, nome, cpf, cnh, categoria, telefone, validade }
            : driver);
          showToast('Motorista atualizado com sucesso.');
        } else {
          allDrivers.unshift({ id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, nome, cpf, cnh, categoria, telefone, validade });
          showToast('Motorista cadastrado com sucesso.');
        }
        saveToLocalStorage();
        renderAll();
        closeCadastroModal();
      }

      if (currentModalType === 'supplier') {
        const nome = document.getElementById('supplier-name').value.trim();
        const tipo = document.getElementById('supplier-type').value;
        const documento = formatCpfOrCnpj(document.getElementById('supplier-document').value.trim());
        const telefone = document.getElementById('supplier-phone').value.trim();
        const email = document.getElementById('supplier-email').value.trim();
        const observacoes = document.getElementById('supplier-notes').value.trim();
        if (!nome || !tipo) {
          showToast('Preencha o nome do parceiro e o tipo de fornecedor.');
          return;
        }
        if (documento) {
          const digits = onlyDigits(documento);
          const validDocument = digits.length === 11 ? isValidCpf(documento) : digits.length === 14 ? isValidCnpj(documento) : false;
          if (!validDocument) {
            showToast('Informe um CPF ou CNPJ válido para o parceiro.');
            return;
          }
        }
        if (findSupplierDuplicate({ nome, tipo, documento }, currentEditingId)) {
          showToast('Já existe um fornecedor igual cadastrado.');
          return;
        }
        const tipoLabel = getSupplierTypeLabel(tipo);
        if (currentEditingId) {
          allSuppliers = allSuppliers.map(supplier => supplier.id === currentEditingId
            ? { ...supplier, nome, tipo, tipoLabel, documento, telefone, email, observacoes }
            : supplier);
          showToast('Fornecedor atualizado com sucesso.');
        } else {
          allSuppliers.unshift({ id: generateId(), nome, tipo, tipoLabel, documento, telefone, email, observacoes });
          showToast('Fornecedor cadastrado com sucesso.');
        }
        saveToLocalStorage();
        renderAll();
        closeCadastroModal();
      }

      if (currentModalType === 'order') {
        const numero = document.getElementById('order-numero').value.trim();
        const administracao = document.getElementById('order-administracao').value.trim();
        const vehicleId = document.getElementById('order-veiculo').value;
        const driverId = document.getElementById('order-driver').value;
        const dataInicio = document.getElementById('order-data-inicio').value;
        const dataTermino = document.getElementById('order-data-termino').value;
        const status = document.getElementById('order-status').value;
        const descricao = document.getElementById('order-descricao').value.trim();
        const responsavelNome = getDriverLabel(driverId);
        if (!vehicleId || !descricao) {
          showToast('Selecione um veículo e preencha a descrição da OS.');
          return;
        }
        if (currentEditingId) {
          allOrders = allOrders.map(order => order.id === currentEditingId
            ? { ...order, numero, administracao, vehicleId, driverId, responsavelNome, dataInicio, dataTermino, status, descricao }
            : order);
          showToast('OS atualizada com sucesso.');
        } else {
          allOrders.unshift({ id: generateId(), numero, administracao, vehicleId, driverId, responsavelNome, dataInicio, dataTermino, status, descricao });
          orderCounter += 1;
          showToast('OS cadastrada com sucesso.');
        }
        saveToLocalStorage();
        renderAll();
        closeCadastroModal();
      }

      if (currentModalType === 'finance') {
        const entryType = currentFinanceEntryType || 'despesa';
        const orderId = document.getElementById('finance-order-id').value;
        const kind = document.getElementById('finance-kind').value;
        const dataVencimento = document.getElementById('finance-data-vencimento').value;
        const supplierId = document.getElementById('finance-supplier-id').value;
        const nf = document.getElementById('finance-nf').value.trim();
        const totalField = document.getElementById('finance-total').value;
        const total = Number(totalField || 0);
        const supplier = allSuppliers.find(item => item.id === supplierId);
        const linkedOrder = allOrders.find(item => item.id === orderId);
        const fornecedor = supplier ? supplier.nome : '';
        const supplierType = supplier ? supplier.tipo : '';
        const fuelType = document.getElementById('finance-fuel-type')?.value || '';
        const kmInicial = document.getElementById('finance-km-inicial')?.value || '';
        const kmFinal = document.getElementById('finance-km-final')?.value || '';
        const observacoes = document.getElementById('finance-observacoes').value.trim();
        if (!orderId || !dataVencimento || !supplierId) {
          showToast('Selecione a OS, o parceiro e a data de vencimento do lançamento.');
          return;
        }
        if (!linkedOrder || linkedOrder.status === 'fechada') {
          showToast('Não é permitido lançar financeiro em OS fechada.');
          return;
        }
        if (entryType === 'despesa' && supplierType === 'posto') {
          showToast('Postos de combustível não podem ser usados no lançamento de despesas.');
          return;
        }
        if (supplierType === 'posto' && !fuelType) {
          showToast('Selecione o tipo de combustível para lançamentos de posto.');
          return;
        }
        if (entryType === 'combustivel' && (!kmInicial || !kmFinal)) {
          showToast('Preencha KM inicial e KM final no lançamento de combustível.');
          return;
        }
        if (currentEditingId) {
          allFinanceEntries = allFinanceEntries.map(entry => entry.id === currentEditingId
            ? { ...entry, entryType, orderId, kind, kindLabel: kind === 'receita' ? 'Receita' : 'Despesa', supplierId, supplierType, fornecedor, nf, fuelType, kmInicial, kmFinal, dataVencimento, total, observacoes }
            : entry);
          showToast('Lançamento atualizado com sucesso.');
        } else {
          allFinanceEntries.unshift({ id: generateId(), createdAt: new Date().toISOString(), entryType, orderId, kind, kindLabel: kind === 'receita' ? 'Receita' : 'Despesa', supplierId, supplierType, fornecedor, nf, fuelType, kmInicial, kmFinal, dataVencimento, total, observacoes });
          showToast('Lançamento vinculado à OS com sucesso.');
        }
        saveToLocalStorage();
        renderAll();
        closeCadastroModal();
      }
    });

    loadFromLocalStorage();
    renderAll();
    applyThemeState(localStorage.getItem('wefrotas_theme') === 'dark');
    renderNotifications();
    updateCustomLogoUi();
    document.getElementById('settings-custom-logo-file')?.addEventListener('change', handleCustomLogoUpload);
    document.getElementById('settings-custom-logo-size')?.addEventListener('input', (event) => {
      const sizeLabel = document.getElementById('settings-custom-logo-size-label');
      if (sizeLabel) sizeLabel.textContent = `${event.target.value}%`;
    });
    ['order-filter-number', 'order-filter-start', 'order-filter-end', 'order-filter-status', 'order-filter-sort'].forEach(id => {
      const node = document.getElementById(id);
      if (node) node.addEventListener(id === 'order-filter-number' ? 'input' : 'change', renderOrders);
    });
    ['finance-filter-supplier', 'finance-filter-nf', 'finance-filter-os'].forEach(id => {
      const node = document.getElementById(id);
      if (node) node.addEventListener('input', renderFinance);
    });
    const financeDateFilter = document.getElementById('finance-filter-date');
    if (financeDateFilter) financeDateFilter.addEventListener('change', renderFinance);
    ['report-filter-start', 'report-filter-end'].forEach(id => {
      const node = document.getElementById(id);
      if (node) node.addEventListener('change', renderReports);
    });
    const reportTypeFilter = document.getElementById('report-filter-type');
    if (reportTypeFilter) reportTypeFilter.addEventListener('change', renderReports);
    const reportVehicleFilter = document.getElementById('report-filter-vehicle');
    if (reportVehicleFilter) reportVehicleFilter.addEventListener('change', renderReports);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        toggleSettings(false);
        toggleNotifications(false);
      }
    });
