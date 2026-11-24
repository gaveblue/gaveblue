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

  const RSVP_DEADLINE_DEFAULT = "2026-11-25T23:59:59.999-03:00"; // registro legado
  let urgencyTimer = null;
  let whatsappRedirectTimer = null;
  let publicRefreshRunning = false;

  function deadlineTime() {
    return Date.parse(event?.prazo_confirmacao || RSVP_DEADLINE_DEFAULT);
  }
  function deadlineLabel(withTime = false) {
    const date = new Date(deadlineTime());
    if (Number.isNaN(date.getTime())) return "data a definir";
    const opts = {timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit"};
    const short = new Intl.DateTimeFormat("pt-BR",opts).format(date);
    if (!withTime) return short;
    const hour = new Intl.DateTimeFormat("pt-BR",{
      timeZone:"America/Sao_Paulo",hour:"2-digit",minute:"2-digit",hourCycle:"h23"
    }).format(date);
    return short + " às " + hour.replace(":","h");
  }
  function publicState() {
    if (!event) return "nao_iniciadas";
    if (event.status === "rascunho" || event.estado_confirmacoes === "nao_iniciadas") return "nao_iniciadas";
    if (event.estado_confirmacoes === "encerrado_manual") return "encerrado_manual";
    if (event.status === "encerrado" && event.estado_confirmacoes !== "prazo_expirado") return "encerrado_manual";
    if (Date.now() > deadlineTime() || event.estado_confirmacoes === "prazo_expirado") return "prazo_expirado";
    return event.status === "aberto" ? "aberto" : "encerrado_manual";
  }
  function lockedContent(state) {
    if (state === "nao_iniciadas") return {
      title:"Confirmações ainda não abertas",
      message:"As confirmações de presença ainda não começaram. Aguarde a abertura pela organização."
    };
    const custom = String(event?.mensagem_encerramento || "").trim();
    if (state === "encerrado_manual") return {
      title:"Confirmações encerradas",
      message:custom || "As confirmações de presença foram encerradas pela organização. Agradecemos seu interesse!"
    };
    return {
      title:"Prazo de confirmação encerrado",
      message:custom || "O prazo para confirmar presença terminou em " + deadlineLabel(true) + ". Em caso de dúvidas, entre em contato com a organização."
    };
  }
  function syncPublicState(state) {
    if (!event) return;
    const opened = state === "aberto";
    show("guest-cta", opened && !finished);
    show("guest-locked", !opened && !finished);
    if (!opened && !finished) {
      const info = lockedContent(state);
      const title = $("guest-locked-title"), body = $("guest-locked-message");
      if (title && title.textContent !== info.title) title.textContent = info.title;
      if (body && body.textContent !== info.message) body.textContent = info.message;
    }
    // Um prazo encerrado é diferente de um fechamento manual ou do rascunho.
    show("rsvp-urgency", state === "aberto" || state === "prazo_expirado");
  }
  function updateUrgency() {
    if (!event) return;
    const state = publicState();
    const deadline = deadlineTime();
    const until = Math.max(0,deadline - Date.now());
    const elapsed = state === "prazo_expirado";
    const heading = $("rsvp-deadline-title");
    const label = elapsed ? "Prazo encerrado" : "Confirme até " + deadlineLabel();
    if (heading && heading.textContent !== label) heading.textContent = label;
    const ended = $("rsvp-urgency-expired");
    const endedMessage = "O prazo de confirmação terminou em " + deadlineLabel(true) + ".";
    if (ended && ended.textContent !== endedMessage) ended.textContent = endedMessage;
    const clock = [
      Math.floor(until / 3600000),Math.floor((until % 3600000) / 60000),
      Math.floor((until % 60000) / 1000),Math.floor(until % 1000)
    ];
    ["rsvp-hours","rsvp-minutes","rsvp-seconds","rsvp-millis"].forEach((id,index) => {
      const val = String(clock[index]).padStart(index === 3 ? 3 : 2,"0");
      const node = $(id);
      if (node && node.textContent !== val) node.textContent = val;
    });
    $("rsvp-urgency").classList.toggle("is-expired",elapsed);
    show("rsvp-urgency-expired",elapsed);
    syncPublicState(state);
    if (elapsed && urgencyTimer !== null) {
      clearInterval(urgencyTimer); urgencyTimer = null;
    }
  }
  function startUrgency() {
    if (urgencyTimer !== null) { clearInterval(urgencyTimer); urgencyTimer = null; }
    updateUrgency();
    if (publicState() === "aberto" && Date.now() <= deadlineTime()) {
      urgencyTimer = setInterval(() => {
        if (!document.hidden) updateUrgency();
      },50);
    }
  }
  async function refreshPublicState() {
    if (!event || publicRefreshRunning || document.hidden) return;
    publicRefreshRunning = true;
    try {
      const response = await request("event");
      if (response?.event) updateEvent(response.event);
    } catch (_) { updateUrgency(); }
    finally { publicRefreshRunning = false; }
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshPublicState();
  });
  setInterval(refreshPublicState,60000);
  function fireCelebration() {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
    if (reduced || document.hidden || typeof window.confetti !== "function") return;
    const colors = ["#0C7137","#136A3B","#E9C53B","#F6DB6C","#FFFFFF"];
    const shoot = (origin, angle, count) => {
      try {
        window.confetti({
          particleCount: count,
          angle,
          spread: 62,
          startVelocity: 28,
          gravity: 1.1,
          drift: 0,
          ticks: 125,
          scalar: .82,
          origin,
          colors,
          zIndex: 1600,
          disableForReducedMotion: true
        });
      } catch (_) { /* o sucesso não depende da animação */ }
    };
    shoot({x:.14,y:.88},63,28);
    shoot({x:.86,y:.88},117,28);
    setTimeout(() => shoot({x:.50,y:.58},90,15),260);
  }
  $("whatsapp-fallback").addEventListener("click", () => {
    if (whatsappRedirectTimer !== null) {
      clearTimeout(whatsappRedirectTimer);
      whatsappRedirectTimer = null;
    }
  });


  let countdownTimer = null;
  let countdownTick = null;
  function startCountdown() {
    if (countdownTimer !== null) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    const date = String(event?.data_evento || "");
    const time = String(event?.horario || "").replace("h", ":").slice(0, 5);
    // O evento é em 2026 no horário de Brasília (UTC−03, sem horário de verão).
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      show("event-countdown", false);
      return;
    }
    const target = new Date(date + "T" + time + ":00-03:00").getTime();
    if (!Number.isFinite(target)) {
      show("event-countdown", false);
      return;
    }
    show("event-countdown", true);
    const fields = ["countdown-days", "countdown-hours", "countdown-minutes", "countdown-seconds"];
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      const values = [
        Math.floor(remaining / 86400),
        Math.floor((remaining % 86400) / 3600),
        Math.floor((remaining % 3600) / 60),
        remaining % 60
      ];
      fields.forEach((id, i) => { $(id).textContent = String(values[i]).padStart(2, "0"); });
      const started = remaining === 0;
      $("countdown-title").textContent = started ? "O grande dia chegou!" : "Falta pouco para celebrarmos!";
      if (started) {
        $("countdown-status").textContent = "Hoje é dia de confraternizar!";
        show("countdown-status", true);
        if (countdownTimer !== null) { clearInterval(countdownTimer); countdownTimer = null; }
      } else {
        show("countdown-status", false);
      }
    };
    countdownTick = tick;
    tick();
    if (target > Date.now()) countdownTimer = setInterval(tick, 1000);
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && countdownTick) countdownTick();
  });


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
    // A descrição continua editável pelo painel: preservar parágrafos com segurança.
    const description = $("guest-description");
    if (description && String(event.descricao || "").trim()) {
      const paragraphs = String(event.descricao).trim().split(/\n\s*\n/).filter(Boolean);
      description.replaceChildren(...paragraphs.map(value => {
        const paragraph = document.createElement("p");
        paragraph.textContent = value.trim();
        return paragraph;
      }));
    }
    const parts = /^\d{4}-\d{2}-\d{2}$/.test(String(event.data_evento || "")) ? event.data_evento.split("-") : null;
    const dateDisplay = parts ? new Intl.DateTimeFormat("pt-BR",{day:"numeric",month:"long",timeZone:"UTC"}).format(new Date(event.data_evento+"T12:00:00Z")) : "data a definir";
    const timeDisplay = event.horario ? String(event.horario).replace(/^(\d{1,2}):(\d{2})$/, (_,hour,minutes) => minutes === "00" ? hour+"h" : hour+"h"+minutes) : "horário a definir";
    $("event-date-long").textContent = dateDisplay;
    $("event-time-inline").textContent = timeDisplay;
    $("event-place").textContent = event.local_evento || "Local a definir";
    startCountdown();
    startUrgency();
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
      const successPanel = $("guest-done");
      successPanel.classList.remove("celebrating");
      void successPanel.offsetWidth;
      successPanel.classList.add("celebrating");
      fireCelebration();
      // Uma pequena pausa torna a celebração visível antes de abrir o WhatsApp.
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
      whatsappRedirectTimer = setTimeout(() => {
        whatsappRedirectTimer = null;
        window.location.assign(resp.whatsapp_url);
      }, reducedMotion ? 300 : 2300);
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

  const dateTimeOf = ev => Date.parse(ev?.prazo_confirmacao || "2026-11-25T23:59:59.999-03:00");
  const localDeadlineParts = value => {
    const parsed = new Date(value || "2026-11-25T23:59:59.999-03:00");
    if (Number.isNaN(parsed.getTime())) return {date:"2026-11-25",time:"23:59"};
    const dt = new Intl.DateTimeFormat("en-GB",{
      timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit",
      hour:"2-digit",minute:"2-digit",hourCycle:"h23"
    }).formatToParts(parsed);
    const get = key => dt.find(x => x.type === key)?.value || "";
    return {date:get("year")+"-"+get("month")+"-"+get("day"),time:get("hour")+":"+get("minute")};
  };
  const displayDeadline = ev => {
    const d = new Date(dateTimeOf(ev));
    if (Number.isNaN(d.getTime())) return "Data não definida";
    return new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",
      month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(d);
  };
  const effectiveAdminState = ev => {
    if (!ev || ev.status === "rascunho") return "nao_iniciadas";
    if (ev.status === "encerrado") return "encerrado_manual";
    return Date.now() > dateTimeOf(ev) ? "prazo_expirado" : "aberto";
  };
  const adminStateText = state => ({
    nao_iniciadas:"Confirmações não iniciadas",
    aberto:"Confirmações abertas",
    encerrado_manual:"Encerradas pela organização",
    prazo_expirado:"Prazo expirado"
  }[state] || "Situação indefinida");
  function renderRsvpState() {
    if (!dataset) return;
    const ev = dataset.event;
    const state = effectiveAdminState(ev);
    const title = $("rsvp-state-title"), detail = $("rsvp-state-detail");
    if (title) title.textContent = adminStateText(state);
    if (detail) detail.textContent = "Prazo: " + displayDeadline(ev) + " (Brasília). " +
      (state === "prazo_expirado" ? "Novas confirmações bloqueadas. Prorrogue o prazo para reabrir." :
       state === "encerrado_manual" ? "Encerramento manual. O histórico está preservado." :
       state === "nao_iniciadas" ? "O convite aguarda a abertura pela organização." :
       "Recebendo confirmações até o horário configurado.");
    const panel = document.querySelector(".rsvp-state-panel");
    if (panel) panel.dataset.state = state;
    const status = $("settings-rsvp-state");
    if (status) status.textContent = adminStateText(state);
    const help = $("settings-rsvp-help");
    if (help) help.textContent = state === "prazo_expirado"
      ? "Para reabrir, escolha uma data limite futura e use o botão Reabrir confirmações."
      : state === "encerrado_manual"
        ? "É possível reabrir sem apagar as respostas já recebidas."
        : "As mudanças no status e no prazo são refletidas no convite ao salvar.";
    show("rsvp-open",state === "nao_iniciadas");
    show("rsvp-close",state === "aberto");
    show("rsvp-reopen",state === "encerrado_manual" || state === "prazo_expirado");
  }

  function render() {
    if (!dataset) return;
    const ev = dataset.event;
    $("admin-title").textContent = ev.titulo;
    renderRsvpState();
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
    const p = localDeadlineParts(ev.prazo_confirmacao);
    $("event-deadline-date").value = p.date;
    $("event-deadline-time").value = p.time;
    $("event-close-message").value = ev.mensagem_encerramento || "";
    $("event-plus").checked = ev.permite_acompanhante !== false;
    renderRsvpState();
  }
  $("event-form").addEventListener("submit",async(e) => {
    e.preventDefault();
    const button = e.currentTarget.querySelector('button[type="submit"]');
    const chosenStatus = $("event-status").value;
    const currentStatus = dataset?.event?.status || "rascunho";
    const date = $("event-deadline-date").value;
    const time = $("event-deadline-time").value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      notify("Preencha a data e o horário limite das confirmações.",true);
      return;
    }
    const closingDate = date + "T" + time + ":59.999-03:00";
    if (!Number.isFinite(Date.parse(closingDate))) {
      notify("A data limite informada é inválida.",true);
      return;
    }
    if (chosenStatus === "aberto" && Date.parse(closingDate) <= Date.now()) {
      notify("Para abrir ou reabrir, escolha um prazo futuro.",true);
      $("event-deadline-date").focus();
      return;
    }
    if (chosenStatus === "encerrado" && currentStatus !== "encerrado" &&
        !window.confirm("Encerrar as confirmações agora? Novos participantes não poderão confirmar, mas todos os registros existentes serão mantidos.")) {
      $("event-status").value = currentStatus;
      return;
    }
    button.disabled = true;
    try {
      await admin("admin-save-event", {
        titulo:$("event-title").value,descricao:$("event-description").value,
        data_evento:$("event-date-input").value,horario:$("event-time-input").value,
        local_evento:$("event-place-input").value,whatsapp:$("event-whatsapp").value,
        status:chosenStatus,permite_acompanhante:$("event-plus").checked,
        prazo_confirmacao:new Date(closingDate).toISOString(),
        mensagem_encerramento:$("event-close-message").value
      });
      await bootstrap(true);
      notify("Configurações e prazo salvos com sucesso.");
    } catch(err) {notify(err.message,true);}
    finally {button.disabled=false;}
  });
  document.querySelectorAll("[data-rsvp-action]").forEach(button => {
    button.addEventListener("click",() => {
      const action = button.dataset.rsvpAction;
      if (action === "reopen" &&
          !window.confirm("Reabrir as confirmações? Confira antes se a data limite é futura. As respostas anteriores serão preservadas.")) return;
      $("event-status").value = action === "close" ? "encerrado" : "aberto";
      $("event-form").requestSubmit();
    });
  });
  // Mantém o indicador atualizado ao chegar ao prazo mesmo com o admin aberto.
  setInterval(() => {if (dataset && !document.hidden) renderRsvpState();},30000);
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
  const signOut = async () => {
    try { if (session) await request("admin-logout", {}, session); } catch (_) {}
    session = null; sessionStorage.removeItem(storageKey);
    show("admin-app",false); show("admin-login",true); fail("login-error","");
  };
  $("logout-button").addEventListener("click",signOut);
  $("mobile-logout").addEventListener("click",signOut);
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