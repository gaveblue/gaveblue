(() => {
"use strict";
const URL = "https://wkssfugzghwifaddagfr.supabase.co";
const KEY = "sb_publishable_XuQH9K6Lu7dfUEq_pBpWpQ_89PY2_Xl";
const ENDPOINT = URL + "/functions/v1/rsvp-confraternizacao";
const $ = (id) => document.getElementById(id);
const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
const escapeHtml = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const icons = () => { try { window.lucide?.createIcons(); } catch (_) {} };
const show = (id, visible) => $(id)?.classList.toggle("hidden", !visible);
const fail = (element, message) => { const node = $(element); if (node) { node.textContent = message || ""; node.classList.toggle("hidden", !message); } };
const datestr = (day) => { if (!day) return "A definir"; try { return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(day + "T12:00:00")); } catch (_) { return day; } };
const stamp = (iso) => iso ? new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Sao_Paulo"}).format(new Date(iso)) : "—";
async function request(action, data = {}, token = "", options = {}) {
  const resp = await fetch(ENDPOINT, { method: "POST", headers: {
    "Content-Type": "application/json", "apikey": KEY, ...(token ? { "Authorization": "Bearer " + token } : {})
  }, body: JSON.stringify({ action, ...data }), cache: "no-store", signal: options.signal });
  const payload = await resp.json().catch(() => ({}));
  if (!resp.ok || !payload.ok) throw new Error(payload.error || "O serviço está indisponível. Tente novamente.");
  return payload;
}
function validSearch(s) {
  const parts = norm(s).split(" ").filter(Boolean);
  return parts.length >= 2 && parts[0].length >= 2 && parts[parts.length - 1].length >= 3;
}
function validFullName(s) { const words = String(s || "").trim().split(/\s+/).filter(Boolean); return words.length >= 2 && String(s).trim().length >= 5; }
function initGuest() {
  let event = null, selected = null, typedQuery = "", timer = null, searchSeq = 0;
  let loading = false, searchAbort = null, sheetTimer = null, finished = false;
  let lastTrigger = null, touchStartY = null;
  const searchCache = new Map();
  const input = $("employee-search");
  const results = $("employee-results");
  const sheet = $("rsvp-sheet");
  const searchWrap = $("guest-search-wrap");
  const boot = $("invite-boot");

  // In mobile in-app browsers the virtual keyboard may overlay position:fixed.
  // Anchor the sheet to the *visible* viewport instead of the layout viewport.
  let viewportFrame = 0;
  function syncSheetViewport() {
    const viewport = window.visualViewport;
    const visibleHeight = Math.max(160, Math.round(viewport?.height || window.innerHeight));
    const visibleTop = Math.max(0, Math.round(viewport?.offsetTop || 0));
    sheet.style.setProperty("--rsvp-visible-height", visibleHeight + "px");
    sheet.style.setProperty("--rsvp-visible-top", visibleTop + "px");
    if (!sheet.classList.contains("hidden")) {
      const active = document.activeElement;
      if (active && sheet.contains(active) && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
        active.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
      }
    }
  }
  function requestViewportSync() {
    if (viewportFrame) cancelAnimationFrame(viewportFrame);
    viewportFrame = requestAnimationFrame(() => {
      viewportFrame = 0;
      syncSheetViewport();
    });
  }
  window.visualViewport?.addEventListener("resize", requestViewportSync);
  window.visualViewport?.addEventListener("scroll", requestViewportSync);
  window.addEventListener("resize", requestViewportSync);
  document.addEventListener("focusin", event => {
    if (!sheet.contains(event.target)) return;
    requestViewportSync();
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
      setTimeout(requestViewportSync, 120);
      setTimeout(requestViewportSync, 320);
    }
  });
  requestViewportSync();

  function toggleStage(stage) {
    show("guest-identify", stage === "identify");
    show("guest-companion", stage === "companion");
    show("guest-done", stage === "done");
    $("sheet-title").textContent = stage === "identify"
      ? "Encontre seu nome" : stage === "companion" ? "Sua presença" : "Sua confirmação";
    $("rsvp-sheet-scroll").scrollTop = 0;
    fail("sheet-error", "");
  }

  function openSheet(stage, opener) {
    if (opener) lastTrigger = opener;
    clearTimeout(sheetTimer);
    toggleStage(stage);
    input.blur();
    show("rsvp-sheet", true);
    syncSheetViewport();
    sheet.setAttribute("aria-hidden", "false");
    document.body.classList.add("rsvp-sheet-open");
    requestAnimationFrame(() => {
      sheet.classList.add("is-open");
      $("sheet-close").focus({ preventScroll: true });
    });
    icons();
  }

  function closeSheet() {
    if (loading || sheet.classList.contains("hidden")) return;
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    document.body.classList.remove("rsvp-sheet-open");
    clearTimeout(sheetTimer);
    sheetTimer = setTimeout(() => show("rsvp-sheet", false), 300);
    const backTo = finished ? $("open-receipt") : $("start-confirm");
    (backTo || lastTrigger)?.focus({ preventScroll: true });
  }

  $("start-confirm").addEventListener("click", e => {
    if (event?.status !== "aberto") return;
    openSheet("identify", e.currentTarget);
  });
  $("open-receipt").addEventListener("click", e => {
    if (finished) openSheet("done", e.currentTarget);
  });
  $("sheet-close").addEventListener("click", closeSheet);
  $("sheet-backdrop").addEventListener("click", closeSheet);
  $("sheet-handle").addEventListener("click", closeSheet);
  $("sheet-handle").addEventListener("touchstart", e => {
    touchStartY = e.touches[0]?.clientY ?? null;
  }, { passive: true });
  $("sheet-handle").addEventListener("touchend", e => {
    if (touchStartY !== null && (e.changedTouches[0]?.clientY ?? 0) - touchStartY > 60) closeSheet();
    touchStartY = null;
  }, { passive: true });

  document.addEventListener("keydown", e => {
    if (sheet.classList.contains("hidden")) return;
    if (e.key === "Escape") { e.preventDefault(); closeSheet(); return; }
    if (e.key !== "Tab") return;
    const focusable = [...sheet.querySelectorAll("button:not(:disabled),input:not(:disabled),a[href],select:not(:disabled),textarea:not(:disabled)")]
      .filter(el => !el.closest(".hidden") && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden");
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  function updateEvent(data) {
    event = data;
    $("guest-description").textContent = event.descricao || "Vamos celebrar juntos!";
    const day = event.data_evento ? String(event.data_evento).split("-") : null;
    $("event-date").textContent = day && day.length === 3 ? day[2] + "/" + day[1] : "A definir";
    $("event-time").textContent = event.horario ? String(event.horario).replace(":", "h") : "A definir";
    $("event-place").textContent = event.local_evento || "Local a definir";
    show("guest-cta", event.status === "aberto" && !finished);
    show("guest-locked", event.status !== "aberto");
  }

  async function load() {
    show("boot-retry", false);
    $("boot-title").textContent = "Carregando seu convite";
    $("boot-message").textContent = "Preparando tudo para você...";
    show("boot-progress", true);
    boot.classList.remove("has-error");
    const began = Date.now();
    try {
      const resp = await request("event");
      updateEvent(resp.event);
      const remaining = Math.max(0, 350 - (Date.now() - began));
      if (remaining) await new Promise(resolve => setTimeout(resolve, remaining));
      document.body.classList.remove("invite-booting");
      boot.classList.add("is-finished");
      setTimeout(() => show("invite-boot", false), 370);
      icons();
    } catch (err) {
      $("boot-title").textContent = "Não foi possível abrir o convite";
      $("boot-message").textContent = "Verifique sua conexão e tente novamente.";
      show("boot-progress", false);
      show("boot-retry", true);
      boot.classList.add("has-error");
      icons();
    }
  }
  $("boot-retry").addEventListener("click", load);

  function setSearching(active) {
    show("search-spinner", active);
    searchWrap.classList.toggle("is-loading", active);
    input.setAttribute("aria-busy", active ? "true" : "false");
    results.classList.toggle("is-loading", active);
    if (active) {
      results.innerHTML = Array.from({ length: 2 }, () => '<div class="search-placeholder" aria-hidden="true"><span class="placeholder-avatar"></span><span class="placeholder-lines"><span></span><span></span></span></div>').join("");
    }
  }
  function clearResults() { results.innerHTML = ""; }
  function updateButton() {
    const checked = document.querySelector('input[name="plus"]:checked')?.value || "";
    show("companion-field", checked === "yes");
    $("confirm-button").disabled = loading || !checked || (checked === "yes" && !validFullName($("companion-name").value));
  }

  function drawResults(items) {
    clearResults();
    if (!items.length) {
      results.innerHTML = '<div class="result-empty">Nenhum colaborador encontrado. Confira o nome e sobrenome.</div>';
      return;
    }
    items.forEach(person => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "result-item";
      button.setAttribute("role", "option");
      button.innerHTML = '<span class="result-avatar"><i data-lucide="user-round"></i></span><strong></strong><i data-lucide="chevron-right"></i>';
      button.querySelector("strong").textContent = person.nome_completo;
      button.addEventListener("click", () => {
        selected = person;
        typedQuery = input.value.trim();
        $("selected-name").textContent = person.nome_completo;
        input.blur();
        document.querySelectorAll('input[name="plus"]').forEach(r => { r.checked = false; });
        $("companion-name").value = "";
        $("confirm-button").innerHTML = 'Confirmar presença <i data-lucide="check"></i>';
        document.querySelectorAll('.option:has(input[value="yes"])').forEach(node => node.classList.remove("hidden"));
        if (event && !event.permite_acompanhante) {
          document.querySelector('input[name="plus"][value="no"]').checked = true;
          document.querySelectorAll('.option:has(input[value="yes"])').forEach(node => node.classList.add("hidden"));
        }
        updateButton();
        toggleStage("companion");
        icons();
      });
      results.appendChild(button);
    });
    icons();
  }
  input.addEventListener("input", () => {
    clearTimeout(timer);
    if (searchAbort) { searchAbort.abort(); searchAbort = null; }
    searchSeq++;
    const query = input.value.trim();
    show("clear-search", !!query);
    clearResults();
    setSearching(false);
    if (!validSearch(query)) {
      $("search-hint").textContent = "Digite seu nome e pelo menos 3 letras do sobrenome.";
      return;
    }
    const key = norm(query);
    if (searchCache.has(key)) {
      $("search-hint").textContent = "Selecione seu nome para continuar.";
      drawResults(searchCache.get(key));
      return;
    }
    $("search-hint").textContent = "Buscando seu nome na lista...";
    setSearching(true);
    const version = searchSeq;
    timer = setTimeout(async () => {
      const controller = new AbortController();
      searchAbort = controller;
      try {
        const resp = await request("search", { query }, "", { signal: controller.signal });
        if (version !== searchSeq) return;
        const people = resp.results || [];
        searchCache.set(key, people);
        if (searchCache.size > 32) searchCache.delete(searchCache.keys().next().value);
        setSearching(false);
        $("search-hint").textContent = people.length
          ? "Nome encontrado! Toque para continuar."
          : "Não encontrou seu nome? Confira a grafia ou procure a organização.";
        drawResults(people);
      } catch (err) {
        if (err.name === "AbortError" || version !== searchSeq) return;
        setSearching(false);
        clearResults();
        $("search-hint").textContent = err.message || "Não foi possível buscar. Tente novamente.";
      } finally {
        if (searchAbort === controller) searchAbort = null;
      }
    }, 175);
  });
  $("clear-search").addEventListener("click", () => {
    input.value = "";
    input.dispatchEvent(new Event("input"));
    input.focus();
  });
  $("change-person").addEventListener("click", () => {
    selected = null;
    typedQuery = "";
    toggleStage("identify");
    icons();
  });
  document.querySelectorAll('input[name="plus"]').forEach(r => r.addEventListener("change", updateButton));
  $("companion-name").addEventListener("input", updateButton);

  $("confirm-button").addEventListener("click", async () => {
    const choice = document.querySelector('input[name="plus"]:checked')?.value || "";
    if (!selected || !typedQuery || !choice || loading || (choice === "yes" && !validFullName($("companion-name").value))) return;
    loading = true;
    updateButton();
    fail("sheet-error", "");
    $("confirm-button").classList.add("is-loading");
    $("confirm-button").innerHTML = '<span class="spinner" aria-hidden="true"></span> Registrando sua presença...';
    try {
      const resp = await request("confirm", {
        colaborador_id: selected.id,
        query: typedQuery,
        acompanhante: choice === "yes",
        acompanhante_nome: $("companion-name").value.trim()
      });
      $("done-person-name").textContent = resp.colaborador || selected.nome_completo;
      $("done-companion-name").textContent = choice === "yes" ? $("companion-name").value.trim() : "Não levará";
      $("whatsapp-fallback").href = resp.whatsapp_url;
      finished = true;
      show("guest-cta", false);
      show("guest-saved", true);
      toggleStage("done");
      icons();
      window.location.assign(resp.whatsapp_url);
    } catch (err) {
      fail("sheet-error", err.message);
      $("confirm-button").innerHTML = 'Confirmar presença <i data-lucide="check"></i>';
      icons();
    } finally {
      loading = false;
      updateButton();
      $("confirm-button").classList.remove("is-loading");
    }
  });

  icons();
  load();
}
function initAdmin() {
  const storageKey = "rsvp-admin-session-v2";
  let session = sessionStorage.getItem(storageKey) || null;
  let dataset = null, editingId = null, currentView = "overview", lastLoad = 0;
  function notify(message, error = false) {
    const node = $("admin-notice"); node.textContent = message; node.classList.remove("hidden");
    node.classList.toggle("error", error);
    clearTimeout(notify.t); notify.t = setTimeout(() => node.classList.add("hidden"), 5000);
  }
  async function admin(action, body = {}) {
    if (!session) throw new Error("Entre com o código de acesso do evento.");
    return request(action, body, session);
  }
  async function bootstrap(quiet = false) {
    try {
      dataset = await admin("admin-bootstrap");
      lastLoad = Date.now();
      show("admin-login", false); show("admin-app", true);
      fail("login-error","");
      render(); icons();
    } catch (err) {
      if (/Acesso expirado|Entre com o código|Código de acesso/i.test(err.message)) {
        session = null; sessionStorage.removeItem(storageKey);
        show("admin-app", false); show("admin-login", true);
        fail("login-error", "Sua sessão expirou. Digite o código novamente.");
      } else if (!quiet) { show("admin-app", false); show("admin-login", true); fail("login-error", err.message); }
      else notify("Não foi possível atualizar o painel: " + err.message, true);
    }
  }
  function setView(name) {
    currentView = name;
    ["overview","people","settings"].forEach(view => {
      show("view-" + view, name === view);
      document.querySelectorAll('[data-view="' + view + '"]').forEach(el => el.classList.toggle("active", name === view));
    });
    if (name === "settings") renderSettings();
    if (name === "people") renderPeople();
  }
  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
  const conMap = () => new Map((dataset?.confirmations || []).map(c => [c.colaborador_id,c]));
  function render() {
    if (!dataset) return;
    const ev = dataset.event;
    $("admin-title").textContent = ev.titulo;
    $("share-url").textContent = location.origin + "/confraternizacao/";
    const employees = dataset.collaborators;
    const actives = employees.filter(p => p.ativo);
    const incomplete = employees.filter(p => !validFullName(p.nome_completo));
    const confirmations = conMap();
    const confirmed = employees.filter(p => confirmations.has(p.id));
    const pending = actives.filter(p => !confirmations.has(p.id));
    const plus = confirmed.filter(p => confirmations.get(p.id)?.acompanhante).length;
    const pct = employees.length ? Math.round(100 * confirmed.length / employees.length) : 0;
    $("stat-invited").textContent = employees.length;
    $("stat-eligible").textContent = actives.length + " aptos à busca";
    $("stat-confirmed").textContent = confirmed.length;
    $("stat-pending").textContent = pending.length;
    $("stat-incomplete").textContent = incomplete.length;
    $("stat-total").textContent = confirmed.length + plus;
    $("stat-plus").textContent = "incluindo " + plus + " acompanhante" + (plus === 1 ? "" : "s");
    $("participation-rate").textContent = pct + "%";
    $("participation-bar").style.width = pct + "%";
    $("participation-text").textContent = confirmed.length + " de " + employees.length + " cadastrados confirmaram. " + incomplete.length + " cadastro(s) ainda sem sobrenome.";
    const recent = confirmed.map(p => ({ ...p, reply: confirmations.get(p.id) }))
      .sort((a,b) => String(b.reply.confirmado_em).localeCompare(String(a.reply.confirmado_em))).slice(0,5);
    $("recent-list").innerHTML = recent.length ? recent.map(p => '<div class="recent-item"><div><strong>' + escapeHtml(p.nome_completo) + '</strong><small>' + escapeHtml(stamp(p.reply.confirmado_em)) + (p.reply.acompanhante ? " · Com acompanhante" : "") + (p.reply.origem === "manual" ? " · Confirmação manual" : "") + '</small></div><span class="status-chip confirmed">Confirmado</span></div>').join("") : '<p class="muted">Nenhuma confirmação até o momento.</p>';
    renderPeople();
    if (currentView !== "settings") renderSettings();
    icons();
  }
  function renderPeople() {
    if (!dataset) return;
    const term = norm($("people-search").value), filter = $("status-filter").value, map = conMap();
    const sectors = [...new Set(dataset.collaborators.map(p => (p.setor || "").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const selector = $("sector-filter"), selected = selector.value;
    selector.innerHTML = '<option value="all">Todos os setores</option>' + sectors.map(x => '<option value="' + escapeHtml(x) + '">' + escapeHtml(x) + '</option>').join("");
    selector.value = selected === "all" || sectors.includes(selected) ? selected : "all";
    $("sector-suggestions").innerHTML = sectors.map(x => '<option value="' + escapeHtml(x) + '"></option>').join("");
    const sector = selector.value;
    const list = dataset.collaborators.filter(p => {
      if (term && !norm(p.nome_completo + " " + (p.setor || "") + " " + (p.grupo || "")).includes(term)) return false;
      if (sector !== "all" && (p.setor || "") !== sector) return false;
      const has = map.has(p.id);
      if (filter === "confirmed") return has;
      if (filter === "pending") return p.ativo && !has;
      if (filter === "inactive") return !p.ativo;
      if (filter === "incomplete") return !validFullName(p.nome_completo);
      return true;
    });
    $("people-count").textContent = list.length + " resultado" + (list.length === 1 ? "" : "s");
    $("people-body").innerHTML = list.length ? list.map(p => {
      const c = map.get(p.id);
      const originLabel = c?.origem === "manual" ? '<span class="origin-label">Manual</span>' : "";
      const badge = c ? '<span class="status-chip confirmed">Confirmado</span>' + originLabel :
        !validFullName(p.nome_completo) ? '<span class="status-chip inactive">Sem sobrenome</span>' :
        !p.ativo ? '<span class="status-chip inactive">Inativo</span>' : '<span class="status-chip">Pendente</span>';
      const initials = p.nome_completo.split(/\s+/).slice(0,2).map(n => n[0]).join("").toUpperCase();
      return '<tr><td><div class="name-cell"><span class="initial-badge">' + escapeHtml(initials) + '</span><span class="name-stack"><strong>' + escapeHtml(p.nome_completo) + '</strong><small>Lista: ' + escapeHtml(p.grupo || "Sem grupo") + '</small></span></div></td><td>' + escapeHtml(p.setor || "Não informado") + '</td><td>' + escapeHtml(c?.acompanhante ? c.acompanhante_nome : "—") + '</td><td>' + badge + '</td><td>' + escapeHtml(stamp(c?.confirmado_em)) + '</td><td><button class="icon-btn edit-person" type="button" data-id="' + escapeHtml(p.id) + '" aria-label="Editar ' + escapeHtml(p.nome_completo) + '"><i data-lucide="pencil"></i></button></td></tr>';
    }).join("") : '<tr><td colspan="6" style="padding:26px;text-align:center;color:#97a2b0">Nenhum colaborador encontrado.</td></tr>';
    document.querySelectorAll(".edit-person").forEach(b => b.addEventListener("click", () => openPerson(b.dataset.id)));
    icons();
  }
  $("people-search").addEventListener("input",renderPeople);
  $("status-filter").addEventListener("change",renderPeople);
  $("sector-filter").addEventListener("change",renderPeople);
  $("refresh-dashboard").addEventListener("click",async () => {
    const button = $("refresh-dashboard"); button.disabled = true;
    try { await bootstrap(true); notify("Indicadores e lista atualizados."); }
    finally { button.disabled = false; }
  });

  function renderSettings() {
    if (!dataset) return;
    const ev = dataset.event;
    $("event-title").value = ev.titulo || "";
    $("event-description").value = ev.descricao || "";
    $("event-date-input").value = ev.data_evento || "";
    $("event-time-input").value = ev.horario || "";
    $("event-place-input").value = ev.local_evento || "";
    $("event-whatsapp").value = ev.whatsapp || "";
    $("event-status").value = ev.status || "rascunho";
    $("event-plus").checked = ev.permite_acompanhante !== false;
  }
  $("event-form").addEventListener("submit",async(e) => {
    e.preventDefault();
    const button = e.currentTarget.querySelector('button[type="submit"]'); button.disabled = true;
    try {
      await admin("admin-save-event", {
        titulo:$("event-title").value,descricao:$("event-description").value,
        data_evento:$("event-date-input").value, horario:$("event-time-input").value,
        local_evento:$("event-place-input").value, whatsapp:$("event-whatsapp").value,
        status:$("event-status").value, permite_acompanhante:$("event-plus").checked
      });
      await bootstrap(true); notify("Configurações salvas com sucesso.");
    } catch(err) { notify(err.message,true); }
    finally { button.disabled = false; }
  });
  function modal(id,open) { show(id,open); document.body.style.overflow = open ? "hidden" : ""; if (open) setTimeout(()=>$(id).querySelector("input:not([type=checkbox]),textarea")?.focus(),30); }
  document.querySelectorAll("[data-close-modal]").forEach(btn => btn.addEventListener("click", () => {
    modal("edit-modal",false); modal("import-modal",false);
  }));
  function openPerson(id = null) {
    editingId = id;
    const person = (dataset?.collaborators || []).find(p => p.id === id);
    const confirmation = person ? conMap().get(person.id) : null;
    $("modal-title").textContent = person ? "Editar colaborador" : "Novo colaborador";
    $("person-name").value = person?.nome_completo || "";
    $("person-sector").value = person?.setor || "";
    $("person-active").checked = person?.ativo !== false;
    $("person-confirmed").checked = !!confirmation;
    $("person-confirm-help").textContent = confirmation
      ? "Já confirmado " + (confirmation.origem === "manual" ? "manualmente" : "pelo link") + ". Desmarcar remove a confirmação; salvar marcado preserva a resposta e o acompanhante existentes."
      : "Marque para confirmar a presença manualmente, sem WhatsApp. A confirmação será contabilizada no dashboard.";
    show("person-active-wrap", !!person);
    modal("edit-modal",true);
  }
  $("top-add").addEventListener("click",()=>openPerson());
  $("person-form").addEventListener("submit",async e => {
    e.preventDefault();
    const name = $("person-name").value.trim();
    const active = $("person-active").checked;
    if (!name || (active && !validFullName(name)) || (!editingId && !validFullName(name))) {
      notify("Informe nome e sobrenome para disponibilizar o cadastro na busca.",true); return;
    }
    const button = e.currentTarget.querySelector('button[type="submit"]'); button.disabled = true;
    try {
      await admin(editingId ? "admin-update" : "admin-add", {
        id: editingId, nome_completo: name, setor: $("person-sector").value.trim(),
        ativo: active, confirmado: $("person-confirmed").checked
      });
      modal("edit-modal",false);
      await bootstrap(true);
      notify(editingId ? "Cadastro e presença atualizados." : "Colaborador cadastrado.");
    } catch(err) { notify(err.message,true); }
    finally { button.disabled = false; }
  });
  $("import-button").addEventListener("click",()=>{ $("import-file").value = ""; $("import-names").value = ""; modal("import-modal",true); });
  $("import-file").addEventListener("change",async e => {
    const file=e.target.files?.[0];if(!file)return;
    $("import-names").value = await file.text();
  });
  $("import-form").addEventListener("submit",async e => {
    e.preventDefault();
    let names = $("import-names").value.split(/\r?\n/).map(line => line.trim().split(/[;,]/)[0].replace(/^"|"$/g,"").trim()).filter(Boolean);
    if (names.length && /^(nome|nome completo|colaborador|funcionário)$/i.test(names[0])) names.shift();
    if (!names.length) { notify("Informe os nomes que deseja importar.",true);return; }
    const button=e.currentTarget.querySelector('button[type="submit"]');button.disabled = true;
    try {
      const resp=await admin("admin-import",{names});
      modal("import-modal",false);await bootstrap(true);
      notify(resp.processed + " nomes processados. Duplicados foram ignorados.");
    } catch(err) { notify(err.message,true); } finally { button.disabled = false; }
  });
  $("export-button").addEventListener("click",()=> {
    if(!dataset)return;
    const map=conMap();
    const rows=[["Colaborador","Setor","Grupo original","Status","Origem da confirmacao","Acompanhante","Nome do acompanhante","Data da confirmacao"]];
    dataset.collaborators.forEach(p => {const c=map.get(p.id);rows.push([p.nome_completo,p.setor||"",p.grupo||"",c?"Confirmado":!validFullName(p.nome_completo)?"Sem sobrenome":!p.ativo?"Inativo":"Pendente",c?.origem==="manual"?"Manual":c?"Link":"",c?.acompanhante?"Sim":"Nao",c?.acompanhante_nome||"",stamp(c?.confirmado_em)]);});
    const csv="\uFEFF"+rows.map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(";")).join("\r\n");
    const url=window.URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); // replaced below to avoid shadowing global URL
    const a=document.createElement("a");a.href=url;a.download="confirmacoes-confraternizacao.csv";a.click();setTimeout(()=>window.URL.revokeObjectURL(url),1000);
  });
  $("copy-link").addEventListener("click",async () => {
    const link=location.origin+"/confraternizacao/";
    try { await navigator.clipboard.writeText(link);notify("Link copiado!"); } catch(_) { notify("Copie o link: "+link); }
  });
  $("logout-button").addEventListener("click",async()=>{
    try { if (session) await request("admin-logout", {}, session); } catch (_) {}
    session = null; sessionStorage.removeItem(storageKey);
    show("admin-app",false); show("admin-login",true); fail("login-error","");
  });
  $("login-form").addEventListener("submit",async e => {
    e.preventDefault();
    const button=e.currentTarget.querySelector('button[type="submit"]');button.disabled=true;
    fail("login-error","");
    try {
      const response=await request("admin-login",{access_code:$("admin-code").value.trim()});
      session=response.access_token;
      sessionStorage.setItem(storageKey,session);
      $("admin-code").value="";
      await bootstrap(false);
    } catch(err) {fail("login-error",err.message||"Não foi possível entrar.");}
    finally{button.disabled=false;}
  });
  if (session) bootstrap(false);
  setInterval(()=>{if(session && !document.hidden && currentView !== "settings" && $("edit-modal").classList.contains("hidden") && $("import-modal").classList.contains("hidden") && Date.now()-lastLoad>=30000)bootstrap(true);},30000);
  icons();
}
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("admin-page")) initAdmin();
  else initGuest();
});
})();