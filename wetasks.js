// ===== STATE =====
let tasks = JSON.parse(localStorage.getItem('agenda_tasks') || '[]');
let notifications = JSON.parse(localStorage.getItem('agenda_notifications') || '[]');
let userName = localStorage.getItem('user_name') || '';
let currentTheme = localStorage.getItem('user_theme') || 'light';
let currentFilter = 'all';
let currentTab = 'tasks';
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
let selectedCalDate = null;
let selectedTaskDate = null;
let deleteTargetId = null;
let completeTargetId = null;
let completeAction = 'complete';
let editingId = null;
let headerInterval = null;
let overdueCheckInterval = null;
let tasksAlreadyNotified = new Set();
let isSubmittingTask = false;

const PRIORITY_COLORS = { urgent:'#EF4444', high:'#FF8C42', medium:'#FBBF24', low:'#10B981' };
const PRIORITY_LABELS = { urgent:'Urgente', high:'Alta', medium:'Média', low:'Baixa' };
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const GLOBAL_MODULES = [
  { name:'WeTime', desc:'Relógio online e painel de horário', url:'https://gaveblue.com/wetime' },
  { name:'WeRecibos', desc:'Gerador de recibos', url:'https://gaveblue.com/recibos' },
  { name:'WeConsultas', desc:'Consultas empresariais', url:'https://gaveblue.com/weconsultas' },
  { name:'WeFrotas', desc:'Gestão de frotas', url:'https://gaveblue.com/wefrotas' },
  { name:'WeDevs', desc:'Ferramentas e utilidades dev', url:'https://gaveblue.com/wedevs' },
  { name:'WeTasks', desc:'Tarefas e organização', url:'https://gaveblue.com/wetasks' }
];

function canUseBrowserNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

async function ensureBrowserNotificationPermission() {
  if (!canUseBrowserNotifications()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

function sendOverdueBrowserNotification(task) {
  if (!canUseBrowserNotifications()) return;
  if (Notification.permission !== 'granted') return;

  const body = task.time
    ? `A tarefa "${task.title}" entrou em atraso às ${task.time}.`
    : `A tarefa "${task.title}" entrou em atraso.`;

  const notification = new Notification('WeTasks • Tarefa em atraso', {
    body,
    tag: `wetasks-overdue-${task.id}`,
    renotify: false
  });

  notification.onclick = () => {
    window.focus();
    currentTab = 'tasks';
    selectedTaskDate = task.date;
    renderAll();
    notification.close();
  };
}

function updateBrowserNotificationStatus() {
  const statusEl = document.getElementById('browser-notification-status');
  if (!statusEl) return;

  if (!canUseBrowserNotifications()) {
    statusEl.textContent = 'Este navegador não suporta notificações do dispositivo.';
    return;
  }

  if (Notification.permission === 'granted') {
    statusEl.textContent = 'Ativas: o dispositivo já pode receber alertas de tarefas em atraso.';
    return;
  }

  if (Notification.permission === 'denied') {
    statusEl.textContent = 'Bloqueadas: libere as notificações nas permissões do navegador para usar esse recurso.';
    return;
  }

  statusEl.textContent = 'Desativadas: toque em "Ativar Notificações" para permitir alertas do dispositivo.';
}

async function enableBrowserNotifications() {
  const permission = await ensureBrowserNotificationPermission();
  updateBrowserNotificationStatus();

  if (permission === 'granted') {
    showToast('Notificações do dispositivo ativadas!');
    return;
  }

  if (permission === 'denied') {
    showToast('As notificações foram bloqueadas no navegador.', 'error');
    return;
  }

  showToast('Este navegador não suporta notificações do dispositivo.', 'info');
}

function testBrowserNotification() {
  if (!canUseBrowserNotifications()) {
    showToast('Este navegador não suporta notificações do dispositivo.', 'info');
    return;
  }

  if (Notification.permission !== 'granted') {
    showToast('Ative as notificações primeiro para testar.', 'info');
    return;
  }

  const notification = new Notification('WeTasks • Teste de notificação', {
    body: 'Tudo certo por aqui. Seus alertas do dispositivo estão funcionando.'
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  showToast('Notificação de teste enviada!');
}

function save() {
  tasks = sanitizeTasks(tasks);
  localStorage.setItem('agenda_tasks', JSON.stringify(tasks));
  localStorage.setItem('agenda_notifications', JSON.stringify(notifications));
}

function sanitizeTasks(taskList) {
  if (!Array.isArray(taskList)) return [];

  const seen = new Set();
  const seenSignature = new Set();
  const normalized = [];

  taskList.forEach((task) => {
    if (!task || typeof task !== 'object') return;

    const id = String(task.id || '').trim() || `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (seen.has(id)) return;
    seen.add(id);

    const normalizedTask = {
      id,
      title: String(task.title || '').trim(),
      description: String(task.description || '').trim(),
      date: String(task.date || ''),
      time: String(task.time || ''),
      priority: PRIORITY_LABELS[task.priority] ? task.priority : 'low',
      notes: String(task.notes || '').trim(),
      status: task.status === 'done' ? 'done' : 'pending',
      createdAt: task.createdAt || new Date().toISOString()
    };

    const signature = [
      normalizedTask.title,
      normalizedTask.description,
      normalizedTask.date,
      normalizedTask.time,
      normalizedTask.priority,
      normalizedTask.status,
      normalizedTask.notes
    ].join('||');

    if (seenSignature.has(signature)) return;
    seenSignature.add(signature);

    normalized.push(normalizedTask);
  });

  return normalized.filter((task) => task.title && task.date);
}

tasks = sanitizeTasks(tasks);

function addNotification(type, message) {
  const notification = {
    id: 'notif_' + Date.now(),
    type: type,
    message: message,
    timestamp: new Date().toISOString(),
    read: false
  };
  notifications.unshift(notification);
  if (notifications.length > 50) notifications.pop();
  save();
  updateNotificationBadge();
}

function getSaoPauloISODate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

function createSafeDateFromISO(dateStr) {
  const [year, month, day] = String(dateStr).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

async function getTodayFromAPI() {
  try {
    const response = await fetch('https://worldtimeapi.org/api/timezone/America/Sao_Paulo');
    const data = await response.json();
    const correctDate = data.datetime.split('T')[0];
    localStorage.setItem('today_cache', correctDate);
    localStorage.setItem('today_cache_time', Date.now());
    return correctDate;
  } catch (e) {
    const fallback = getSaoPauloISODate();
    localStorage.setItem('today_cache', fallback);
    localStorage.setItem('today_cache_time', Date.now());
    return fallback;
  }
}

function todayStr() { 
  const stored = localStorage.getItem('today_cache');
  const cacheTime = localStorage.getItem('today_cache_time');
  if (stored && cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) return stored;
  getTodayFromAPI();
  return stored || getSaoPauloISODate();
}

function formatDate(d) {
  const dt = createSafeDateFromISO(d);
  return dt.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday:'long',
    day:'numeric',
    month:'long',
    year:'numeric'
  });
}

function getBrasiliaTime() {
  const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  return formatter.format(new Date());
}

function getGreeting() {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    hour12: false
  });
  const h = parseInt(formatter.format(new Date()), 10);

  if (h < 12) {
    return {
      html: `<span class="greeting-badge greeting-morning"><i data-lucide="sunrise"></i><strong>Bom dia</strong></span>`,
      period: 'morning'
    };
  }
  if (h < 18) {
    return {
      html: `<span class="greeting-badge greeting-afternoon"><i data-lucide="sun"></i><strong>Boa tarde</strong></span>`,
      period: 'afternoon'
    };
  }
  return {
    html: `<span class="greeting-badge greeting-night"><i data-lucide="moon-star"></i><strong>Boa noite</strong></span>`,
    period: 'night'
  };
}

// ===== TOAST =====
function showToast(msg, type='success') {
  const c = document.getElementById('toast-container');
  const colors = { success:'#10B981', error:'#EF4444', info:'#2563EB' };
  const icons = { success:'check-circle', error:'alert-circle', info:'info' };
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<i data-lucide="${icons[type]}" style="width:18px;height:18px;color:${colors[type]};margin-top:1px;flex-shrink:0"></i><span style="line-height:1.45;color:var(--text)">${msg}</span>`;
  t.style.borderLeft = `4px solid ${colors[type]}`;
  c.appendChild(t);
  lucide.createIcons();
  
  setTimeout(() => {
    if (t.parentElement) {
      t.style.transition = 'all .3s';
      t.style.opacity = '0';
      t.style.transform = 'translateY(-8px) scale(.98)';
      setTimeout(() => t.remove(), 300);
    }
  }, 3400);
}

// ===== GLOBAL SEARCH =====
function getSearchNodes() {
  return {
    overlay: document.getElementById('global-search-overlay'),
    mobilePanel: document.getElementById('mobile-search-panel'),
    desktopInput: document.getElementById('global-search-input-desktop'),
    mobileInput: document.getElementById('global-search-input-mobile'),
    desktopResults: document.getElementById('global-search-results-desktop'),
    mobileResults: document.getElementById('global-search-results-mobile')
  };
}

function getActiveSearchInput() {
  const { desktopInput, mobileInput } = getSearchNodes();
  return window.innerWidth >= 960 ? desktopInput : mobileInput;
}

function getActiveSearchResults() {
  const { desktopResults, mobileResults } = getSearchNodes();
  return window.innerWidth >= 960 ? desktopResults : mobileResults;
}

function focusGlobalSearch() {
  const input = getActiveSearchInput();
  if (input) input.focus();
}

function openGlobalSearch(forceMobileOpen = false) {
  const { overlay, mobilePanel } = getSearchNodes();
  const results = getActiveSearchResults();
  if (overlay) overlay.classList.add('active');
  if (window.innerWidth < 960 && mobilePanel) mobilePanel.classList.add('active');
  if (results) results.classList.add('active');
  renderGlobalSearch(getActiveSearchInput()?.value || '');
  if (forceMobileOpen) {
    setTimeout(() => {
      const input = getActiveSearchInput();
      if (input) input.focus();
    }, 20);
  }
}

function closeGlobalSearch() {
  const { overlay, mobilePanel, desktopResults, mobileResults, desktopInput, mobileInput } = getSearchNodes();
  if (overlay) overlay.classList.remove('active');
  if (mobilePanel) mobilePanel.classList.remove('active');
  [desktopResults, mobileResults].forEach(node => node && node.classList.remove('active'));
  [desktopInput, mobileInput].forEach(node => { if (node) node.value = ''; });
}

function renderGlobalSearch(query = '') {
  const results = getActiveSearchResults();
  if (!results) return;
  const term = query.trim().toLowerCase();
  const filtered = !term
    ? GLOBAL_MODULES
    : GLOBAL_MODULES.filter(item => item.name.toLowerCase().includes(term) || item.desc.toLowerCase().includes(term));

  if (!filtered.length) {
    results.innerHTML = `<div class="search-empty">Nenhum módulo encontrado para essa busca.</div>`;
    results.classList.add('active');
    return;
  }

  results.innerHTML = filtered.map(item => `
    <a class="search-item" href="${item.url}" onclick="closeGlobalSearch()">
      <span class="search-meta">
        <span class="search-kicker">Ecossistema GaveBlue</span>
        <strong style="font-size:16px">${item.name}</strong>
        <span class="search-desc">${item.desc}</span>
      </span>
      <i data-lucide="arrow-up-right" style="width:18px;height:18px;color:rgba(191,219,254,.95)"></i>
    </a>
  `).join('');
  results.classList.add('active');
  lucide.createIcons();
}

function handleGlobalSearchKeydown(event) {
  if (event.key === 'Escape') {
    closeGlobalSearch();
    event.target.blur();
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    const query = event.target.value.trim().toLowerCase();
    const match = GLOBAL_MODULES.find(item => item.name.toLowerCase().includes(query) || item.desc.toLowerCase().includes(query)) || GLOBAL_MODULES[0];
    if (match) window.location.href = match.url;
  }
}

// ===== SETTINGS =====
function toggleSettings(event) {
  if (event && event.target.id === 'settings-overlay') return;
  const p = document.getElementById('settings-panel');
  const o = document.getElementById('settings-overlay');
  const show = p.style.display === 'none' || p.style.display === '';
  p.style.display = show ? 'block' : 'none';
  if (o) o.style.display = show ? 'block' : 'none';
  if (show) {
    updateThemeButtons();
    updateBrowserNotificationStatus();
  }
  updateFabVisibility();
}

// ===== NOTIFICATIONS =====
function updateNotificationBadge() {
  const unread = notifications.filter(n => !n.read).length;
  const badges = [
    document.getElementById('notification-badge-mobile'),
    document.getElementById('notification-badge-desktop')
  ];

  badges.forEach(badge => {
    if (!badge) return;

    if (unread > 0) {
      badge.textContent = unread > 9 ? '9+' : unread;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  });
}

function toggleNotifications(event) {
  if (event && event.target.id === 'notifications-overlay') return;
  const p = document.getElementById('notifications-panel');
  const o = document.getElementById('notifications-overlay');
  const show = p.style.display === 'none';
  p.style.display = show ? 'block' : 'none';
  if (o) o.style.display = show ? 'block' : 'none';
  if (show) {
    renderNotifications();
    notifications.forEach(n => n.read = true);
    save();
    updateNotificationBadge();
  }
  updateFabVisibility();
}

function renderNotifications() {
  const list = document.getElementById('notifications-list');
  if (notifications.length === 0) {
    list.innerHTML = `<div class="empty-state"><div style="width:48px;height:48px;border-radius:16px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;margin-bottom:12px"><i data-lucide="bell-off" style="width:20px;height:20px;color:var(--primary)"></i></div><p style="font-weight:600;font-size:14px;color:var(--text)">Sem notificaÃ§Ãµes</p><p style="font-size:12px;color:var(--secondary)">Voltaremos em breve</p></div>`;
    lucide.createIcons();
    return;
  }
  list.innerHTML = notifications.map(n => {
    const date = new Date(n.timestamp);
    const now = new Date();
    let timeStr = '';
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) timeStr = 'Agora';
    else if (diffMins < 60) timeStr = `${diffMins}min`;
    else if (diffHours < 24) timeStr = `${diffHours}h`;
    else if (diffDays < 7) timeStr = `${diffDays}d`;
    else timeStr = date.toLocaleDateString('pt-BR');

    const icons = {
      'create': 'plus-circle',
      'update': 'edit',
      'delete': 'trash-2',
      'complete': 'check-circle',
      'uncomplete': 'rotate-ccw',
      'urgent': 'alert-triangle'
    };
    const colors = {
      'create': '#10B981',
      'update': '#2563EB',
      'delete': '#EF4444',
      'complete': '#10B981',
      'uncomplete': '#2563EB',
      'urgent': '#EF4444'
    };

    return `<div class="notification-card fade-in" data-notification-id="${n.id}" style="padding:12px;border-left:3px solid ${colors[n.type] || '#2563EB'};background:var(--surface);border-radius:12px;display:flex;gap:10px;align-items:flex-start;cursor:grab;user-select:none;transition:all .2s;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;right:0;bottom:0;width:60px;background:linear-gradient(90deg,transparent 0%,#EF4444 100%);display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .2s">
        <i data-lucide="trash-2" style="width:16px;height:16px;color:#fff"></i>
      </div>
      <div style="width:36px;height:36px;border-radius:10px;background:${colors[n.type]}15;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i data-lucide="${icons[n.type] || 'info'}" style="width:18px;height:18px;color:${colors[n.type] || '#2563EB'}"></i>
      </div>
      <div style="flex:1;min-width:0">
        <p style="font-size:13px;font-weight:600;color:var(--text);word-break:break-word">${n.message}</p>
        <p style="font-size:11px;color:var(--secondary);margin-top:4px">${timeStr}</p>
      </div>
    </div>`;
  }).join('');
  lucide.createIcons();
  attachNotificationDragListeners();
}

function attachNotificationDragListeners() {
  const cards = document.querySelectorAll('.notification-card');
  
  cards.forEach(card => {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    const notifId = card.dataset.notificationId;
    
    function startDrag(clientX) {
      isDragging = true;
      startX = clientX;
      card.style.cursor = 'grabbing';
      card.style.transition = 'none';
    }
    
    function moveDrag(clientX) {
      if (!isDragging || !card.parentElement) return;
      currentX = clientX - startX;
      card.style.transform = `translateX(${currentX}px)`;
      card.style.opacity = Math.max(0.3, 1 - Math.abs(currentX) / 150);
      
      const deleteIcon = card.querySelector('[data-lucide="trash-2"]').parentElement;
      deleteIcon.style.opacity = Math.min(1, Math.abs(currentX) / 80);
    }
    
    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      card.style.cursor = 'grab';
      
      if (Math.abs(currentX) > 80) {
        card.style.transition = 'all .3s';
        card.style.opacity = '0';
        card.style.transform = `translateX(${currentX > 0 ? 300 : -300}px)`;
        setTimeout(() => {
          notifications = notifications.filter(n => n.id !== notifId);
          save();
          renderNotifications();
          showToast('Notificação removida');
        }, 300);
      } else {
        card.style.transition = 'all .3s';
        card.style.transform = 'translateX(0)';
        card.style.opacity = '1';
      }
    }
    
    // Mouse events
    card.addEventListener('mousedown', (e) => startDrag(e.clientX));
    document.addEventListener('mousemove', (e) => moveDrag(e.clientX));
    document.addEventListener('mouseup', endDrag);
    
    // Touch events
    card.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientX), { passive: false });
    document.addEventListener('touchmove', (e) => moveDrag(e.touches[0].clientX), { passive: false });
    document.addEventListener('touchend', endDrag);
    
    // Prevent scrolling while dragging
    card.addEventListener('touchstart', (e) => {
      if (e.target.closest('[data-lucide]')) return;
      e.preventDefault();
    }, { passive: false });
  });
}

function clearAllNotifications() {
  notifications = [];
  save();
  updateNotificationBadge();

  const panelOpen = document.getElementById('notifications-panel').style.display === 'block';
  if (panelOpen) {
    renderNotifications();
  }

  showToast('Notificações limpas!');
}

function updateUserName() {
  const nameInput = document.getElementById('settings-name-input');
  const newName = nameInput.value.trim();
  if (!newName) { nameInput.focus(); return; }
  userName = newName;
  localStorage.setItem('user_name', userName);
  document.getElementById('app-title').textContent = userName;
  toggleSettings();
  showToast(`Nome atualizado para ${userName}!`);
}

function setTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('user_theme', theme);
  applyTheme();
  updateThemeButtons();
  showToast(`Tema alterado para ${theme === 'dark' ? 'escuro' : 'claro'}!`);
}

function updateThemeButtons() {
  const isDark = currentTheme === 'dark';
  document.getElementById('theme-light').style.borderColor = isDark ? '#E2E8F0' : 'var(--primary)';
  document.getElementById('theme-light').style.color = isDark ? 'var(--secondary)' : 'var(--primary)';
  document.getElementById('theme-light').style.background = isDark ? 'transparent' : 'var(--primary)18';
  document.getElementById('theme-dark').style.borderColor = isDark ? 'var(--primary)' : '#E2E8F0';
  document.getElementById('theme-dark').style.color = isDark ? 'var(--primary)' : 'var(--secondary)';
  document.getElementById('theme-dark').style.background = isDark ? 'var(--primary)18' : 'transparent';
}

function applyTheme() {
  if (currentTheme === 'dark') {
    document.documentElement.style.setProperty('--bg', '#0F172A');
    document.documentElement.style.setProperty('--surface', '#1E293B');
    document.documentElement.style.setProperty('--text', '#F1F5F9');
    document.documentElement.style.setProperty('--secondary', '#94A3B8');
  } else {
    document.documentElement.style.setProperty('--bg', '#F0F4F8');
    document.documentElement.style.setProperty('--surface', '#FFFFFF');
    document.documentElement.style.setProperty('--text', '#1E293B');
    document.documentElement.style.setProperty('--secondary', '#64748B');
  }
}

function exportTasks() {
  const data = { exportDate: new Date().toISOString(), tasks, userName, version: '1.0' };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tarefas_agenda_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Tarefas exportadas com sucesso!');
}

function importTasks() {
  document.getElementById('import-file').click();
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.tasks || !Array.isArray(data.tasks)) { showToast('Arquivo inválido!', 'error'); return; }
      tasks = sanitizeTasks([...tasks, ...data.tasks]);
      save();
      renderAll();
      showToast(`${data.tasks.length} tarefas importadas!`);
    } catch (err) {
      showToast('Erro ao ler arquivo!', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function requestClearAll() {
  const modal = `
    <div class="modal-overlay" id="clear-all-modal" style="display:flex;z-index:220" onclick="if(event.target===this)closeClearAllModal()">
      <div class="modal-content slide-up" style="max-width:380px;text-align:center">
        <div style="width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#FEE2E2 0%,#FECACA 100%);display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
          <i data-lucide="alert-triangle" style="width:32px;height:32px;color:var(--urgent)"></i>
        </div>
        <h3 style="font-weight:800;font-size:20px;margin-bottom:8px;color:var(--urgent)">Limpar Tudo?</h3>
        <p style="font-size:14px;color:var(--secondary);margin-bottom:12px">VocÃª estÃ¡ prestes a <strong>deletar permanentemente</strong> todas as suas tarefas.</p>
        <div style="background:#FEE2E2;border-radius:12px;padding:12px;margin-bottom:20px;text-align:left">
          <p style="font-size:13px;color:var(--urgent);font-weight:600;margin-bottom:8px">âš ï¸ Esta aÃ§Ã£o:</p>
          <ul style="font-size:12px;color:var(--urgent);margin:0;padding-left:20px;list-style:disc">
            <li>DeletarÃ¡ <strong>TODAS</strong> as tarefas criadas</li>
            <li>NÃ£o pode ser desfeita</li>
            <li>LimparÃ¡ seu histÃ³rico completamente</li>
          </ul>
        </div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button onclick="closeClearAllModal()" class="btn btn-ghost" style="border-radius:14px;flex:1;border:1.5px solid #E2E8F0;font-weight:600">Cancelar</button>
          <button onclick="confirmClearAll()" class="btn btn-danger" style="border-radius:14px;flex:1;font-weight:600"><i data-lucide="trash" style="width:14px;height:14px"></i> Deletar Tudo</button>
        </div>
      </div>
    </div>
  `;
  const container = document.getElementById('app');
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = modal;
  container.appendChild(tempDiv.firstElementChild);
  lucide.createIcons();
}

function closeClearAllModal() {
  const modal = document.getElementById('clear-all-modal');
  if (modal) modal.remove();
}

function confirmClearAll() {
  tasks = [];
  notifications = [];
  save();
  closeClearAllModal();
  renderAll();
  showToast('Todas as tarefas foram deletadas', 'error');
}

function requestClearCompleted() {
  const completedCount = tasks.filter(t => t.status === 'done').length;
  if (completedCount === 0) {
    showToast('Nenhuma tarefa concluída para limpar!', 'info');
    return;
  }
  
  const modal = `
    <div class="modal-overlay" id="clear-completed-modal" style="display:flex;z-index:220" onclick="if(event.target===this)closeClearCompletedModal()">
      <div class="modal-content slide-up" style="max-width:380px;text-align:center">
        <div style="width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#FEE2E2 0%,#FECACA 100%);display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
          <i data-lucide="alert-triangle" style="width:32px;height:32px;color:var(--urgent)"></i>
        </div>
        <h3 style="font-weight:800;font-size:20px;margin-bottom:8px;color:var(--urgent)">Limpar Tarefas ConcluÃ­das?</h3>
        <p style="font-size:14px;color:var(--secondary);margin-bottom:12px">VocÃª estÃ¡ prestes a deletar <strong>${completedCount} tarefa${completedCount !== 1 ? 's' : ''}</strong> concluÃ­da${completedCount !== 1 ? 's' : ''}.</p>
        <div style="background:#FEE2E2;border-radius:12px;padding:12px;margin-bottom:20px;text-align:left">
          <p style="font-size:13px;color:var(--urgent);font-weight:600;margin-bottom:8px">âš ï¸ Esta aÃ§Ã£o:</p>
          <ul style="font-size:12px;color:var(--urgent);margin:0;padding-left:20px;list-style:disc">
            <li>DeletarÃ¡ <strong>apenas tarefas concluÃ­das</strong></li>
            <li>Suas tarefas pendentes serÃ£o mantidas</li>
            <li>NÃ£o pode ser desfeita</li>
          </ul>
        </div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button onclick="closeClearCompletedModal()" class="btn btn-ghost" style="border-radius:14px;flex:1;border:1.5px solid #E2E8F0;font-weight:600">Cancelar</button>
          <button onclick="confirmClearCompleted()" class="btn btn-danger" style="border-radius:14px;flex:1;font-weight:600"><i data-lucide="trash" style="width:14px;height:14px"></i> Deletar</button>
        </div>
      </div>
    </div>
  `;
  const container = document.getElementById('app');
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = modal;
  container.appendChild(tempDiv.firstElementChild);
  lucide.createIcons();
}

function closeClearCompletedModal() {
  const modal = document.getElementById('clear-completed-modal');
  if (modal) modal.remove();
}

function confirmClearCompleted() {
  const completedTasks = tasks.filter(t => t.status === 'done');
  completedTasks.forEach(t => clearTaskNotification(t.id));
  tasks = tasks.filter(t => t.status !== 'done');
  save();
  saveNotifiedTasks();
  closeClearCompletedModal();
  renderAll();
  showToast(`${completedTasks.length} tarefa${completedTasks.length !== 1 ? 's' : ''} concluída${completedTasks.length !== 1 ? 's' : ''} deletada${completedTasks.length !== 1 ? 's' : ''}!`, 'success');
}

function goToWebsite() {
  const modal = `
    <div class="modal-overlay" id="exit-modal" style="display:flex;z-index:220" onclick="if(event.target===this)closeExitModal()">
      <div class="modal-content slide-up" style="max-width:380px;text-align:center">
        <div style="width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#BAE6FD 0%,#7DD3FC 100%);display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
          <i data-lucide="log-out" style="width:32px;height:32px;color:var(--primary)"></i>
        </div>
        <h3 style="font-weight:800;font-size:20px;margin-bottom:8px;color:var(--text)">Sair da Agenda?</h3>
        <p style="font-size:14px;color:var(--secondary);margin-bottom:20px">Você será redirecionado para o site do desenvolvedor.</p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button onclick="closeExitModal()" class="btn btn-ghost" style="border-radius:14px;flex:1;border:1.5px solid #E2E8F0;font-weight:600">Cancelar</button>
          <button onclick="confirmExit()" class="btn btn-primary" style="border-radius:14px;flex:1;font-weight:600"><i data-lucide="arrow-right" style="width:14px;height:14px"></i> Confirmar</button>
        </div>
      </div>
    </div>
  `;
  const container = document.getElementById('app');
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = modal;
  container.appendChild(tempDiv.firstElementChild);
  lucide.createIcons();
}

function closeExitModal() {
  const modal = document.getElementById('exit-modal');
  if (modal) modal.remove();
}

function confirmExit() {
  closeExitModal();
  window.location.href = 'https://gaveblue.com';
}

function renderHeader() {
  const today = formatDate(todayStr());
  const time = getBrasiliaTime();
  const greeting = getGreeting();
  const header = document.querySelector('.header-shell');
  if (header) {
    header.classList.remove('period-morning', 'period-afternoon', 'period-night');
    header.classList.add(`period-${greeting.period}`);
  }
  
  // Update mobile
  document.getElementById('header-date').textContent = today;
  document.getElementById('header-time').textContent = time;
  document.getElementById('greeting-text').innerHTML = greeting.html;
  
  // Update desktop
  document.getElementById('header-date-desktop').textContent = today;
  document.getElementById('header-time-desktop').textContent = time;
  document.getElementById('greeting-text-desktop').innerHTML = greeting.html;
  lucide.createIcons();
  
  if (!headerInterval) {
    headerInterval = setInterval(() => {
      const newTime = getBrasiliaTime();
      const newGreeting = getGreeting();
      const headerEl = document.querySelector('.header-shell');
      if (headerEl) {
        headerEl.classList.remove('period-morning', 'period-afternoon', 'period-night');
        headerEl.classList.add(`period-${newGreeting.period}`);
      }
      
      // Update mobile
      document.getElementById('header-time').textContent = newTime;
      document.getElementById('greeting-text').innerHTML = newGreeting.html;
      
      // Update desktop
      document.getElementById('header-time-desktop').textContent = newTime;
      document.getElementById('greeting-text-desktop').innerHTML = newGreeting.html;
      lucide.createIcons();
    }, 1000);
  }
}

// ===== RENDER TASKS =====
function isTaskOverdue(task) {
  if (task.status === 'done') return false;
  if (!task.time) return false;
  
  const taskDate = new Date(task.date + 'T' + task.time);
  const now = new Date();
  const oneMinuteLater = new Date(taskDate.getTime() + 60000);
  
  return now >= oneMinuteLater;
}

// Monitor contÃ­nuo para tarefas em atraso
function startOverdueMonitor() {
  if (overdueCheckInterval) clearInterval(overdueCheckInterval);
  
  overdueCheckInterval = setInterval(() => {
    // Verificar apenas tarefas PENDENTES (bem mais rÃ¡pido!)
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    
    pendingTasks.forEach(task => {
      // Pular se jÃ¡ foi notificado ou sem hora
      if (tasksAlreadyNotified.has(task.id) || !task.time) return;
      
      if (isTaskOverdue(task)) {
        // Primeira vez que detecta atraso - gerar notificação
        tasksAlreadyNotified.add(task.id);
        saveNotifiedTasks();
        addNotification('urgent', `Tarefa "${task.title}" está em ATRASO!`);
        sendOverdueBrowserNotification(task);
        
        // Re-renderizar apenas se estamos vendo tarefas
        if (currentTab === 'tasks') {
          renderTasks();
        } else if (currentTab === 'calendar') {
          renderCalendar();
        }
      }
    });
  }, 1000); // Verifica a cada 1 segundo
}

// Restaurar tarefas jÃ¡ notificadas do localStorage
function restoreNotifiedTasks() {
  const notifiedIds = localStorage.getItem('tasks_notified') || '[]';
  try {
    tasksAlreadyNotified = new Set(JSON.parse(notifiedIds));
  } catch {
    tasksAlreadyNotified = new Set();
  }
}

// Salvar tarefas jÃ¡ notificadas
function saveNotifiedTasks() {
  localStorage.setItem('tasks_notified', JSON.stringify([...tasksAlreadyNotified]));
}

// Limpar notificaÃ§Ãµes quando tarefa Ã© deletada ou completada
function clearTaskNotification(taskId) {
  if (tasksAlreadyNotified.has(taskId)) {
    tasksAlreadyNotified.delete(taskId);
    saveNotifiedTasks();
  }
}

function renderTasks(targetTasks, container) {
  const list = container || document.getElementById('tasks-list');
  let filtered = targetTasks || tasks;
  const today = todayStr();
  const displayDate = selectedTaskDate || today;

  if (!targetTasks) {
    if (currentFilter === 'pending') filtered = tasks.filter(t => t.date === displayDate && t.status !== 'done');
    else if (currentFilter === 'done') filtered = tasks.filter(t => t.date === displayDate && t.status === 'done');
    else if (currentFilter === 'urgent') filtered = tasks.filter(t => t.date === displayDate && t.priority === 'urgent');
    else if (currentFilter === 'high') filtered = tasks.filter(t => t.date === displayDate && t.priority === 'high');
    else if (currentFilter === 'medium') filtered = tasks.filter(t => t.date === displayDate && t.priority === 'medium');
    else if (currentFilter === 'low') filtered = tasks.filter(t => t.date === displayDate && t.priority === 'low');
    else filtered = tasks.filter(t => t.date === displayDate);
  }

  // OrdenaÃ§Ã£o: pendentes no topo (por horÃ¡rio), depois concluÃ­das (por horÃ¡rio)
  filtered.sort((a, b) => {
    // Primeiro: tarefas pendentes vÃªm antes das concluÃ­das
    if (a.status !== b.status) {
      return a.status === 'done' ? 1 : -1;
    }
    
    // Segundo: ordenar por horÃ¡rio (principal critÃ©rio)
    const aHasTime = a.time && a.time.trim();
    const bHasTime = b.time && b.time.trim();
    if (aHasTime && !bHasTime) return -1;
    if (!aHasTime && bHasTime) return 1;
    if (aHasTime && bHasTime) return a.time.localeCompare(b.time);
    return 0;
  });

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state fade-in"><div style="width:64px;height:64px;border-radius:20px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;margin-bottom:12px"><i data-lucide="clipboard-list" style="width:28px;height:28px;color:var(--primary)"></i></div><p style="font-weight:600;font-size:15px;margin-bottom:4px">Nenhuma tarefa</p><p style="font-size:13px">Toque no + para adicionar</p></div>`;
    lucide.createIcons();
    return;
  }

  list.innerHTML = filtered.map(t => {
    const pc = PRIORITY_COLORS[t.priority] || '#64748B';
    const isDone = t.status === 'done';
    const isOverdue = isTaskOverdue(t);
    const [y, m, d] = t.date.split('-');
    const dateFormatted = `${d}/${m}`;
    const priorityLabel = PRIORITY_LABELS[t.priority] || 'Normal';
    let timeDisplay = '--:--';
    if (t.time && t.time.trim()) timeDisplay = t.time;
    
    return `<div class="card fade-in" style="display:grid;grid-template-columns:80px 1fr auto;gap:12px;padding:16px;border-left:4px solid ${pc};${isDone?'background:#F8FAFC':'background:var(--surface)'};cursor:pointer;user-select:none;transition:all .2s;align-items:start;position:relative;margin-bottom:16px">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px;background:${pc}08;border-radius:12px;min-height:80px;gap:2px;${isDone?'opacity:.6':''}">
        ${t.time?`<div style="font-size:28px;font-weight:800;color:${pc};line-height:1.1;letter-spacing:-0.5px">${t.time.split(':')[0]}<span style="font-size:28px">:${t.time.split(':')[1]}</span></div>`:`<div style="font-size:11px;color:var(--secondary)">sem hora</div>`}
        <div style="font-size:12px;color:var(--text);font-weight:900;margin-top:2px">${dateFormatted}</div>
        <span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;background:${pc}18;color:${pc};margin-top:4px">${PRIORITY_LABELS[t.priority]}</span>
      </div>
      
      <div style="display:flex;flex-direction:column;justify-content:flex-start;min-width:0;flex:1">
        <h4 style="font-weight:700;font-size:15px;${isDone?'text-decoration:line-through;color:#94A3B8':'color:var(--text)'};word-break:break-word;margin-bottom:4px">${t.title}</h4>
        ${t.description?`<p style="font-size:12px;color:${isDone?'#94A3B8':'var(--secondary)'};word-break:break-word;${isDone?'text-decoration:line-through':''}">${t.description}</p>`:''}
        ${isOverdue?`<div style="display:flex;align-items:center;gap:4px;margin-top:8px"><div style="width:6px;height:6px;border-radius:50%;background:#EF4444"></div><span style="font-size:11px;font-weight:700;color:#EF4444;text-transform:uppercase">Em Atraso</span></div>`:''}
      </div>

      <div style="display:flex;flex-direction:column;gap:4px;min-width:fit-content">
        <button onclick="openTaskModal('${t.id}')" class="btn btn-ghost" style="padding:6px 8px;border-radius:8px;border:1.5px solid var(--primary);color:var(--primary)">
          <i data-lucide="pencil" style="width:18px;height:18px"></i>
        </button>
        <button onclick="requestDelete('${t.id}')" class="btn btn-ghost" style="padding:6px 8px;border-radius:8px;color:var(--urgent);border:1.5px solid var(--urgent)">
          <i data-lucide="trash-2" style="width:18px;height:18px"></i>
        </button>
        ${!isDone
          ? `<button onclick="requestComplete('${t.id}')" class="btn btn-ghost" style="padding:6px 8px;font-size:12px;border-radius:8px;background:#10B981;color:#fff;font-weight:700;white-space:nowrap">
               <i data-lucide="check" style="width:18px;height:18px"></i>
             </button>`
          : `<button onclick="requestUncomplete('${t.id}')" class="btn btn-ghost" style="padding:6px 8px;font-size:12px;border-radius:8px;background:var(--primary);color:#fff;font-weight:700;white-space:nowrap">
               <i data-lucide="rotate-ccw" style="width:18px;height:18px"></i>
             </button>`
        }
      </div>
    </div>`;
  }).join('');
  lucide.createIcons();
}

// ===== FILTERS =====
function filterTasks(f) {
  currentFilter = f;
  document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === f));
  renderTasks();
}

function changeTaskDate(days) {
  const today = todayStr();
  if (!selectedTaskDate) selectedTaskDate = today;
  const date = new Date(selectedTaskDate + 'T00:00:00');
  date.setDate(date.getDate() + days);
  selectedTaskDate = date.toISOString().split('T')[0];
  const [year, month, day] = selectedTaskDate.split('-');
  calYear = parseInt(year);
  calMonth = parseInt(month) - 1;
  selectedCalDate = selectedTaskDate;
  if (currentTab === 'tasks') renderTasks();
  else if (currentTab === 'calendar') renderCalendar();
  updateTaskDateLabel();
}

function updateTaskDateLabel() {
  const displayDate = selectedTaskDate || todayStr();
  const today = todayStr();
  let label = '';
  
  if (displayDate === today) {
    label = 'Hoje';
  } else {
    const dateObj = createSafeDateFromISO(displayDate);
    const formatted = dateObj.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday:'long',
      day:'2-digit',
      month:'long',
      year:'numeric'
    });
    label = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
  
  document.getElementById('tasks-date-label').textContent = label;
  document.getElementById('cal-date-label').textContent = label;
}

function updateFabVisibility() {
  const fab = document.getElementById('fab-button');
  const settingsOpen = document.getElementById('settings-panel').style.display === 'block';
  const notificationsOpen = document.getElementById('notifications-panel').style.display === 'block';
  const isMainView = currentTab === 'tasks' || currentTab === 'calendar';

  fab.style.display = (isMainView && !settingsOpen && !notificationsOpen) ? 'flex' : 'none';
}

// ===== TABS =====
function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-tasks').classList.toggle('active', tab === 'tasks');
  document.getElementById('tab-calendar').classList.toggle('active', tab === 'calendar');
  document.getElementById('tab-dashboard').classList.toggle('active', tab === 'dashboard');
  document.getElementById('view-tasks').style.display = tab === 'tasks' ? 'block' : 'none';
  document.getElementById('view-calendar').style.display = tab === 'calendar' ? 'block' : 'none';
  document.getElementById('view-dashboard').style.display = tab === 'dashboard' ? 'block' : 'none';
  
  if (tab === 'tasks') renderTasks();
  if (tab === 'calendar') renderCalendar();
  if (tab === 'dashboard') renderDashboard();
  
  updateFabVisibility();
}

// ===== CALENDAR =====
function renderCalendar() {
  document.getElementById('cal-month-label').textContent = `${MONTHS[calMonth]} ${calYear}`;
  const grid = document.getElementById('cal-grid');
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = todayStr();
  let html = '';
  for (let i = 0; i < firstDay; i++) html += '<div></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === today;
    const isSel = dateStr === selectedCalDate;
    const hasTasks = tasks.some(t => t.date === dateStr);
    html += `<button class="cal-day${isToday?' today':''}${isSel?' selected':''}" onclick="selectCalDate('${dateStr}')">${d}${hasTasks?'<span style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:'+(isToday?'#fff':'var(--primary)')+'"></span>':''}</button>`;
  }
  grid.innerHTML = html;
  const selDate = selectedCalDate || today;
  document.getElementById('cal-day-label').textContent = `Tarefas — ${createSafeDateFromISO(selDate).toLocaleDateString('pt-BR',{ timeZone:'America/Sao_Paulo', day:'numeric',month:'long'})}`;
  const dayTasks = tasks.filter(t => t.date === selDate);
  renderTasks(dayTasks, document.getElementById('cal-tasks-list'));
}

function selectCalDate(d) { selectedTaskDate = d; selectedCalDate = d; updateTaskDateLabel(); renderCalendar(); }
function changeMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

// ===== RENDER DASHBOARD =====
function renderDashboard() {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const pending = tasks.filter(t => t.status !== 'done').length;
  const urgent = tasks.filter(t => t.priority === 'urgent').length;

  // ATUALIZAR CONTAGEM NO AVISO (SEMPRE VISÃVEL)
  document.getElementById('warning-count').textContent = total;

  // Atualizar cards de resumo
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-urgent').textContent = urgent;

  // Renderizar distribuiÃ§Ã£o por prioridade
  const priorityDist = document.getElementById('priority-dist');
  const priorities = { urgent: 0, high: 0, medium: 0, low: 0 };
  tasks.forEach(t => { if (priorities.hasOwnProperty(t.priority)) priorities[t.priority]++; });

  const maxPriority = Math.max(Object.values(priorities).reduce((a, b) => Math.max(a, b), 0), 1);
  const priorityLabels = { urgent: 'Urgente', high: 'Alta', medium: 'Média', low: 'Baixa' };
  const priorityColors = { urgent: '#EF4444', high: '#FF8C42', medium: '#FBBF24', low: '#10B981' };

  priorityDist.innerHTML = Object.entries(priorities).map(([key, count]) => {
    const percent = (count / maxPriority) * 100;
    const color = priorityColors[key];
    return `
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;font-weight:600;color:var(--text)">${priorityLabels[key]}</span>
          <span style="font-size:12px;font-weight:700;color:${color}">${count} tarefa${count !== 1 ? 's' : ''}</span>
        </div>
        <div style="width:100%;height:8px;background:#E2E8F0;border-radius:4px;overflow:hidden">
          <div style="height:100%;background:${color};width:${percent}%;transition:width .3s ease"></div>
        </div>
      </div>
    `;
  }).join('');

  // Renderizar últimas tarefas
  const recentTasks = document.getElementById('recent-tasks');
  const lastTasks = tasks.slice(-5).reverse();
  
  if (lastTasks.length === 0) {
    recentTasks.innerHTML = `<div class="empty-state" style="padding:20px;background:var(--surface);border-radius:12px"><p style="font-size:13px;color:var(--secondary)">Nenhuma tarefa criada ainda</p></div>`;
  } else {
    recentTasks.innerHTML = lastTasks.map(t => `
      <div class="card fade-in" style="padding:12px;display:flex;gap:10px;align-items:center;border-left:3px solid ${PRIORITY_COLORS[t.priority]}">
        <div style="width:3px;height:40px;background:${PRIORITY_COLORS[t.priority]};border-radius:2px"></div>
        <div style="flex:1;min-width:0">
          <p style="font-size:13px;font-weight:600;color:var(--text);word-break:break-word;margin-bottom:2px">${t.title}</p>
          <p style="font-size:11px;color:var(--secondary)">${t.date} ${t.time ? 'â€¢ ' + t.time : ''}</p>
        </div>
        <span style="font-size:10px;font-weight:700;padding:4px 10px;border-radius:6px;background:${PRIORITY_COLORS[t.priority]}15;color:${PRIORITY_COLORS[t.priority]};white-space:nowrap">${PRIORITY_LABELS[t.priority]}</span>
      </div>
    `).join('');
  }
  
  lucide.createIcons();
}

function goToDashboardFilter(filterType) {
  switchTab('tasks');

  if (filterType === 'today') {
    currentFilter = 'all';
    selectedTaskDate = todayStr();
    document.querySelectorAll('[data-filter]').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === 'all');
    });
    updateTaskDateLabel();
    renderTasks();
    return;
  }

  if (filterType === 'overdue') {
    currentFilter = 'all';
    selectedTaskDate = null;

    document.querySelectorAll('[data-filter]').forEach(b => {
      b.classList.remove('active');
    });
    document.querySelector('[data-filter="all"]').classList.add('active');

    const overdueFilteredTasks = tasks.filter(t => {
      if (t.status === 'done') return false;
      if (!t.time) return false;
      return isTaskOverdue(t);
    });

    renderTasks(overdueFilteredTasks, document.getElementById('tasks-list'));
    document.getElementById('tasks-date-label').textContent = 'Tarefas Atrasadas';
    return;
  }

  if (filterType === 'pending') {
    currentFilter = 'pending';
    selectedTaskDate = null;
    
    document.querySelectorAll('[data-filter]').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === 'pending');
    });

    const pendingFilteredTasks = tasks.filter(t => t.status !== 'done');
    renderTasks(pendingFilteredTasks, document.getElementById('tasks-list'));
    document.getElementById('tasks-date-label').textContent = 'Tarefas Pendentes';
    return;
  }

  if (filterType === 'completed') {
    currentFilter = 'done';
    selectedTaskDate = null;
    
    document.querySelectorAll('[data-filter]').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === 'done');
    });

    const completedFilteredTasks = tasks.filter(t => t.status === 'done');
    renderTasks(completedFilteredTasks, document.getElementById('tasks-list'));
    document.getElementById('tasks-date-label').textContent = 'Tarefas ConcluÃ­das';
    return;
  }

  if (filterType === 'urgent') {
    currentFilter = 'urgent';
    selectedTaskDate = null;
    
    document.querySelectorAll('[data-filter]').forEach(b => {
      b.classList.remove('active');
    });

    const urgentFilteredTasks = tasks.filter(t => t.priority === 'urgent');
    renderTasks(urgentFilteredTasks, document.getElementById('tasks-list'));
    document.getElementById('tasks-date-label').textContent = 'Tarefas Urgentes';
    return;
  }
}


// ===== TASK MODAL =====
function openTaskModal(id) {
  editingId = id || null;
  document.getElementById('modal-title').textContent = id ? 'Editar Tarefa' : 'Nova Tarefa';
  document.getElementById('save-btn').innerHTML = '<i data-lucide="check" style="width:16px;height:16px"></i> ' + (id ? 'Atualizar' : 'Salvar');
  if (id) {
    const t = tasks.find(x => x.id === id);
    if (t) {
      document.getElementById('f-title').value = t.title;
      document.getElementById('f-desc').value = t.description || '';
      document.getElementById('f-date').value = t.date;
      document.getElementById('f-time').value = t.time || '';
      document.getElementById('f-priority').value = t.priority;
      document.getElementById('f-notes').value = t.notes || '';
      updatePriorityButtons(t.priority);
    }
  } else {
    document.getElementById('task-form').reset();
    document.getElementById('f-date').value = selectedCalDate || todayStr();
    document.getElementById('f-priority').value = 'low';
    updatePriorityButtons('low');
  }
  document.getElementById('task-modal').style.display = 'flex';
  lucide.createIcons();
}

function setPriority(priority) {
  document.getElementById('f-priority').value = priority;
  updatePriorityButtons(priority);
}

function updatePriorityButtons(priority) {
  document.querySelectorAll('.priority-btn').forEach(btn => {
    const btnPriority = btn.dataset.priority;
    const isSelected = btnPriority === priority;
    btn.style.borderColor = isSelected ? `var(--${priority})` : '#E2E8F0';
    btn.style.background = isSelected ? `var(--${priority})15` : 'transparent';
    btn.style.color = isSelected ? `var(--${priority})` : 'var(--text)';
  });
}

function closeTaskModal() {
  document.getElementById('task-modal').style.display = 'none';
  editingId = null;
}

function submitForm() {
  if (isSubmittingTask) return;
  isSubmittingTask = true;

  const titleVal = document.getElementById('f-title').value.trim();
  const descVal = document.getElementById('f-desc').value.trim();
  const dateVal = document.getElementById('f-date').value;
  const timeVal = document.getElementById('f-time').value;
  const priorityVal = document.getElementById('f-priority').value;
  const notesVal = document.getElementById('f-notes').value.trim();

  if (!titleVal || !dateVal) {
    showToast('Preencha título e data!', 'error');
    isSubmittingTask = false;
    return;
  }

  const data = { title: titleVal, description: descVal, date: dateVal, time: timeVal, priority: priorityVal, notes: notesVal };

  if (editingId) {
    const idx = tasks.findIndex(t => t.id === editingId);
    if (idx > -1) {
      tasks[idx] = { ...tasks[idx], ...data };
      addNotification('update', `âœï¸ Tarefa "${titleVal}" foi atualizada`);
      // Limpar a notificaÃ§Ã£o de atraso quando edita, assim se entrar em atraso de novo vai notificar
      clearTaskNotification(editingId);
    }
  } else {
    const newTask = { id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, ...data, status: 'pending', createdAt: new Date().toISOString() };
    tasks.push(newTask);
    addNotification('create', `Nova tarefa "${titleVal}" criada`);
    showToast(`Tarefa "${titleVal}" criada com sucesso!`);
  }

  save();
  closeTaskModal();
  renderAll();
  setTimeout(() => { isSubmittingTask = false; }, 0);
}

// ===== DELETE =====
function requestDelete(id) {
  deleteTargetId = id;
  const t = tasks.find(x => x.id === id);
  document.getElementById('delete-task-name').textContent = t ? `"${t.title}"` : '';
  document.getElementById('delete-modal').style.display = 'flex';
  lucide.createIcons();
}

function closeDeleteModal() { 
  document.getElementById('delete-modal').style.display = 'none'; 
  deleteTargetId = null; 
}

function confirmDelete() {
  if (!deleteTargetId) return;
  const task = tasks.find(t => t.id === deleteTargetId);
  clearTaskNotification(deleteTargetId);
  tasks = tasks.filter(x => x.id !== deleteTargetId);
  if (task) addNotification('delete', `Tarefa "${task.title}" foi deletada`);
  save();
  saveNotifiedTasks();
  closeDeleteModal();
  showToast('Tarefa excluída', 'error');
  renderAll();
}

// ===== COMPLETE =====
function requestComplete(id) {
  completeTargetId = id;
  completeAction = 'complete';
  const t = tasks.find(x => x.id === id);
  document.getElementById('complete-task-name').textContent = t ? `"${t.title}"` : '';
  document.getElementById('complete-modal-title').textContent = 'Concluir tarefa?';
  document.getElementById('complete-modal').style.display = 'flex';
  lucide.createIcons();
}

function requestUncomplete(id) {
  completeTargetId = id;
  completeAction = 'uncomplete';
  const t = tasks.find(x => x.id === id);
  document.getElementById('complete-task-name').textContent = t ? `Reabrir "${t.title}"?` : '';
  document.getElementById('complete-modal-title').textContent = 'Reabrir tarefa?';
  document.getElementById('complete-modal').style.display = 'flex';
  lucide.createIcons();
}

function closeCompleteModal() { 
  document.getElementById('complete-modal').style.display = 'none'; 
  completeTargetId = null; 
  completeAction = 'complete';
}

function confirmComplete() {
  if (!completeTargetId) return;
  const t = tasks.find(x => x.id === completeTargetId);
  if (t) {
    t.status = completeAction === 'uncomplete' ? 'pending' : 'done';
    const action = t.status === 'done' ? 'concluída' : 'reaberta';
    const notifType = t.status === 'done' ? 'complete' : 'uncomplete';
    addNotification(notifType, `Tarefa "${t.title}" foi ${action}`);
    showToast(`Tarefa ${action}!`);
    
    // Limpar notificação de atraso se tarefa foi concluída
    if (t.status === 'done') {
      clearTaskNotification(completeTargetId);
    }
  }
  save();
  saveNotifiedTasks();
  closeCompleteModal();
  renderAll();
}

// ===== RENDER ALL =====
function renderAll() {
  renderHeader();
  updateTaskDateLabel();
  if (currentTab === 'tasks') renderTasks();
  if (currentTab === 'calendar') renderCalendar();
  if (currentTab === 'dashboard') renderDashboard();
}

// ===== INIT =====
function initApp() {
  save();
  applyTheme();
  restoreNotifiedTasks();
  getTodayFromAPI().then(() => {
    renderAll();
    updateNotificationBadge();
    updateBrowserNotificationStatus();
    lucide.createIcons();
    updateFabVisibility();
    startOverdueMonitor();
  });

  setTimeout(() => {
    ensureBrowserNotificationPermission();
  }, 800);
}

initApp();
