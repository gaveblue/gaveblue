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
  return norm(s).replace(/\s/g,"").length >= 5;
}
function validFullName(s) { const words = String(s || "").trim().split(/\s+/).filter(Boolean); return words.length >= 2 && String(s).trim().length >= 5; }
// A mensagem é guardada como texto com marcadores, nunca como HTML enviado ao servidor.
// Apenas negrito, itálico e tachado são renderizados, sempre com textContent.
function renderRsvpMessage(target, raw) {
  if (!target) return;
  const source = String(raw ?? "").slice(0, 500).trim();
  if (!source) { target.replaceChildren(); return; }
  const parts = source.split(/\n\s*\n/).filter(Boolean);
  const paragraphs = parts.map(part => {
    const p = document.createElement("p");
    const pattern = /(\*\*([^*\n]+)\*\*|~~([^~\n]+)~~|\*([^*\n]+)\*)/g;
    let cursor=0, match;
    while ((match=pattern.exec(part))!==null) {
      if(match.index>cursor)p.append(document.createTextNode(part.slice(cursor,match.index)));
      const tag=match[2] ? "strong" : match[3] ? "s" : "em";
      const node=document.createElement(tag);
      node.textContent=match[2] || match[3] || match[4] || "";
      p.append(node);
      cursor=pattern.lastIndex;
    }
    if(cursor<part.length)p.append(document.createTextNode(part.slice(cursor)));
    return p;
  });
  target.replaceChildren(...paragraphs);
}
function validPersonName(value) {
  const name = String(value||"").trim();
  return name.length >= 3 && name.length <= 150 && /^[\p{L}\s'.-]+$/u.test(name);
}

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
    // Renderização segura de marcadores de estilo, sem interpretar HTML arbitrário.
    if (String(event.descricao || "").trim()) {
      renderRsvpMessage($("guest-description"), event.descricao);
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
      results.innerHTML = '<div class="result-empty">Nenhum colaborador encontrado. Confira o nome informado.</div>';
      return;
    }
    items.forEach(person => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "result-item";
      button.setAttribute("role", "option");
      button.innerHTML = '<span class="result-avatar"><i data-lucide="user-round"></i></span><span class="result-person-details"><strong></strong><small class="result-person-alias hidden"></small></span><i data-lucide="chevron-right"></i>';
      button.querySelector("strong").textContent = person.nome_completo;
      if (person.apelido) {
        const subtitle = button.querySelector(".result-person-alias");
        subtitle.textContent = "Apelido: " + person.apelido;
        subtitle.classList.remove("hidden");
      }
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
      $("search-hint").textContent = "Digite pelo menos 5 letras do seu nome ou apelido para começar a buscar.";
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
  let authGeneration = 0, pendingBootstrap = null;
  let originalCategory = "", statusBusy = false, actionResolve = null;
  let navCollapsed = false, notifyAudio = null, mutationEpoch = 0;
  const mutedConfirmationIds = new Set();
  const selectedPersonIds = new Set();

  function refreshNav() {
    document.body.classList.toggle("admin-nav-collapsed",navCollapsed);
    const button=$("admin-nav-toggle");
    button.setAttribute("aria-expanded",String(!navCollapsed));
    button.setAttribute("aria-label",navCollapsed?"Mostrar navegação":"Ocultar navegação");
    button.setAttribute("title",navCollapsed?"Mostrar navegação":"Ocultar navegação");
  }
  $("admin-nav-toggle").addEventListener("click",()=>{
    navCollapsed=!navCollapsed;refreshNav();
  });
  refreshNav();
  function celebrateManualConfirmation() {
    playConfirmationSound();
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const frame=document.createElement("div");
    frame.className="admin-manual-celebration";
    frame.setAttribute("aria-hidden","true");
    frame.innerHTML='<div class="manual-celebration-glasses"><i data-lucide="wine"></i><i data-lucide="wine"></i></div>';
    const palette=["#eba62f","#12834c","#e9ca46","#f7aa55"];
    for(let burst=0;burst<3;burst++){
      const container=document.createElement("div");
      container.className="admin-manual-burst";
      container.style.left=[29,50,71][burst]+"%";
      container.style.top=[35,24,45][burst]+"%";
      container.style.setProperty("--burst-delay",burst*.15+"s");
      for(let i=0;i<12;i++){
        const spark=document.createElement("span");
        spark.className="admin-manual-spark";
        spark.style.setProperty("--angle",(i*30)+"deg");
        spark.style.setProperty("--spark-color",palette[(i+burst)%palette.length]);
        container.append(spark);
      }
      frame.append(container);
    }
    document.body.append(frame);
    icons();
    setTimeout(()=>frame.remove(),1750);
  }

  function setActionLoading(visible,title) {
    const loading=$("admin-action-loading");
    if(!loading)return;
    if(visible) $("admin-action-loading-title").textContent=title||"Salvando alteração...";
    show("admin-action-loading",visible);
    document.body.classList.toggle("admin-confirm-saving",visible);
  }
  // Tom curto original, criado localmente sem arquivo externo.
  // Navegadores só permitem áudio depois de uma interação do administrador.
  function unlockNotificationSound() {
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    try {
      if(!notifyAudio) notifyAudio=new Audio();
      if(notifyAudio.state==="suspended") notifyAudio.resume().catch(()=>{});
    } catch(_) {}
  }
  document.addEventListener("pointerdown",unlockNotificationSound,{passive:true});
  document.addEventListener("keydown",unlockNotificationSound);
  function playConfirmationSound() {
    if(!notifyAudio||notifyAudio.state!=="running"||document.hidden)return;
    try {
      const t=notifyAudio.currentTime;
      [[0,660],[.14,880]].forEach(([delay,freq])=>{
        const oscillator=notifyAudio.createOscillator();
        const volume=notifyAudio.createGain();
        oscillator.type="sine";oscillator.frequency.setValueAtTime(freq,t+delay);
        volume.gain.setValueAtTime(.0001,t+delay);
        volume.gain.exponentialRampToValueAtTime(.045,t+delay+.014);
        volume.gain.exponentialRampToValueAtTime(.0001,t+delay+.2);
        oscillator.connect(volume);volume.connect(notifyAudio.destination);
        oscillator.start(t+delay);oscillator.stop(t+delay+.205);
      });
    } catch(_) {}
  }
  function notify(message, error = false) {
    // O admin usa um único padrão de notificação, sempre no topo.
    toast(message, error);
  }

  function toast(message, error = false) {
    const root = $("admin-toast-stack");
    if (!root) return;
    const box = document.createElement("div");
    box.className = "admin-toast" + (error ? " admin-toast-error" : "");
    const dot = document.createElement("span");
    dot.className = "admin-toast-icon"; dot.textContent = error ? "!" : "✓";
    const text = document.createElement("span");
    text.className = "admin-toast-copy"; text.textContent = message;
    const close = document.createElement("button");
    close.className = "admin-toast-close"; close.type = "button";
    close.setAttribute("aria-label","Fechar aviso"); close.textContent = "×";
    const remove = () => {
      if (!box.isConnected) return;
      box.classList.add("is-dismissing");
      setTimeout(() => box.remove(),220);
    };
    close.addEventListener("click",remove);
    box.append(dot,text,close); root.prepend(box);
    while(root.children.length>3)root.lastElementChild.remove();
    setTimeout(remove,6500);
  }
  function announceConfirmations(oldData,newData) {
    if (!oldData) return; // nunca mostrar confirmacoes antigas ao entrar
    const before = new Set((oldData.confirmations||[]).map(x=>x.colaborador_id));
    const entries = (newData.confirmations||[]).filter(x=>
      !before.has(x.colaborador_id) && x.origem!=="manual" && !mutedConfirmationIds.has(x.colaborador_id));
    const names = new Map((newData.collaborators||[]).map(p=>[p.id,p.nome_completo]));
    entries.slice(0,2).forEach(x=>{
      const first=String(names.get(x.colaborador_id)||"Alguém").trim().split(/\s+/)[0];
      toast(first+" confirmou sua presença!");
    });
    if(entries.length>2) toast("Mais "+(entries.length-2)+" colaboradores confirmaram presença.");
    if(entries.length) playConfirmationSound();
  }
  function confirmStatus({name,turningOn,inModal=false}) {
    if(actionResolve) return Promise.resolve(false);
    $("rsvp-confirm-title").textContent=turningOn?"Confirmar presença?":"Retirar confirmação?";
    $("rsvp-confirm-message").textContent=turningOn
      ? "Deseja confirmar a presença de "+name+"? "+(inModal?"A alteração será aplicada ao salvar.":"O registro será salvo agora, sem enviar WhatsApp.")
      : "Deseja retirar a confirmação de "+name+"? "+(inModal?"Ao salvar,":"Ao confirmar,")+
        " a resposta e o acompanhante serão removidos. O cadastro será mantido.";
    $("rsvp-confirm-accept").textContent=turningOn?"Sim, confirmar":"Sim, retirar";
    $("rsvp-confirm-accept").classList.toggle("is-destructive",!turningOn);
    const previousFocus=document.activeElement;
    show("rsvp-confirm-modal",true);icons();
    return new Promise(resolve=>{
      actionResolve=value=>{
        if(!actionResolve)return;
        actionResolve=null;show("rsvp-confirm-modal",false);
        if(previousFocus?.isConnected)previousFocus.focus();
        resolve(value);
      };
      $("rsvp-confirm-cancel").focus();
    });
  }
  $("rsvp-confirm-cancel").addEventListener("click",()=>actionResolve?.(false));
  $("rsvp-confirm-backdrop").addEventListener("click",()=>actionResolve?.(false));
  $("rsvp-confirm-accept").addEventListener("click",()=>actionResolve?.(true));
  document.addEventListener("keydown",e=>{
    if(!actionResolve)return;
    if(e.key==="Escape"){e.preventDefault();actionResolve(false);return;}
    if(e.key!=="Tab")return;
    const first=$("rsvp-confirm-cancel"),last=$("rsvp-confirm-accept");
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
  function showLogin(message = "") {
    show("admin-loading",false);
    show("admin-app",false);
    show("admin-login",true);
    fail("login-error",message);
    icons();
  }
  function showLoading(title = "Preparando seu painel",message = "Verificando a sessão e carregando as informações...") {
    show("admin-login",false);
    show("admin-app",false);
    $("admin-loading").classList.remove("has-error");
    $("admin-loading-title").textContent = title;
    $("admin-loading-message").textContent = message;
    show("admin-loading-retry",false);
    show("admin-loading-switch",false);
    show("admin-loading",true);
    icons();
  }
  function showLoadError(error) {
    $("admin-loading").classList.add("has-error");
    $("admin-loading-title").textContent = "Não foi possível carregar";
    $("admin-loading-message").textContent = error?.name === "AbortError"
      ? "A conexão demorou mais que o esperado. Tente novamente."
      : "Houve uma falha temporária de conexão. Seu acesso foi mantido.";
    show("admin-loading-retry",true);
    show("admin-loading-switch",true);
    show("admin-loading",true);
    show("admin-login",false);
    show("admin-app",false);
    icons();
  }
  function invalidSessionError(err) {
    return /^(?:Acesso expirado\b|Entre com o código de acesso do evento\b)/i.test(String(err?.message || ""));
  }
  async function admin(action, body = {}, options = {}) {
    if (!session) throw new Error("Entre com o código de acesso do evento.");
    return request(action, body, session, options);
  }
  function bootstrap(quiet = false) {
    if (pendingBootstrap) return pendingBootstrap;
    const generation = authGeneration;
    const requestEpoch = mutationEpoch;
    const firstLoad = !dataset;
    if (firstLoad && !quiet) showLoading();
    pendingBootstrap = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await admin("admin-bootstrap", {}, {signal:controller.signal});
        if (generation !== authGeneration || !session || requestEpoch !== mutationEpoch) return;
        announceConfirmations(dataset,response);
        dataset = response;
        lastLoad = Date.now();
        show("admin-loading",false);
        show("admin-login",false);
        show("admin-app",true);
        fail("login-error","");
        render(); icons();
      } catch (err) {
        if (generation !== authGeneration) return;
        if (invalidSessionError(err)) {
          session = null; dataset = null; lastLoad = 0;
          sessionStorage.removeItem(storageKey);
          authGeneration++;
          showLogin("Sua sessão expirou. Informe o código para entrar novamente.");
        } else if (!quiet || !dataset) {
          // Rede instável não significa sessão expirada: preservar token e oferecer repetição.
          showLoadError(err);
        } else {
          notify("Não foi possível atualizar os dados. Você continua conectado. Tente novamente.", true);
          lastLoad = Date.now();
        }
      } finally {
        clearTimeout(timeout);
      }
    })().finally(() => { pendingBootstrap = null; });
    return pendingBootstrap;
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
  const declineMap = () => new Map((dataset?.declines || []).map(c => [c.colaborador_id,c]));

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
       "Recebendo confirmações até o horário configurado.") +
       (state === "aberto"
         ? " • Verificando novas presenças a cada 5 segundos."
         : " • Atualizações automáticas pausadas; use Atualizar dados para consultar novamente.");
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
    $("admin-title-text").textContent = ev.titulo;
    renderRsvpState();
    $("share-url").textContent = location.origin + "/confraternizacao/";
    const employees = dataset.collaborators;
    const actives = employees.filter(p => p.ativo);
    const incomplete = employees.filter(p => p.nome_completo.trim().split(/\s+/).length===1);
    const confirmations = conMap();
    const confirmed = employees.filter(p => confirmations.has(p.id));
    const declines = declineMap();
    const pending = actives.filter(p => !confirmations.has(p.id) && !declines.has(p.id));
    $("stat-declined").textContent = employees.filter(p=>declines.has(p.id)).length;
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
  // A seleção permanece ao trocar os filtros; só os registros visíveis são adicionados pelo "Selecionar visíveis".
  function getFilteredPeople(map=conMap()) {
    const query=norm($("people-search").value);
    const status=$("status-filter").value;
    const sector=$("sector-filter").value;

    return (dataset?.collaborators||[]).filter(p=>{
      if(query&&!norm(p.nome_completo+" "+(p.apelido||"")+" "+(p.setor||"")+" "+(p.grupo||"")).includes(query))return false;
      if(sector!=="all"&&!personCategories(p).includes(sector))return false;
      const confirmed=map.has(p.id),declined=declineMap().has(p.id);
      if(status==="confirmed")return confirmed;
      if(status==="declined")return declined;
      if(status==="pending")return !confirmed&&!declined;
      if(status==="inactive")return !p.ativo;
      if(status==="incomplete")return p.nome_completo.trim().split(/\s+/).length===1;
      return true;
    });
  }
  function personCategories(p) {
    return [...new Set([p?.setor,p?.grupo].map(v=>String(v||"").trim()).filter(v=>v&&v!=="Sem grupo"))];
  }
  function updateSelectionUI(visible) {
    if(!dataset)return;
    const validIds=new Set(dataset.collaborators.map(p=>p.id));
    for(const id of selectedPersonIds)if(!validIds.has(id))selectedPersonIds.delete(id);
    const list=visible||getFilteredPeople();
    const checked=list.filter(p=>selectedPersonIds.has(p.id)).length;
    const all=$("people-select-all");
    all.checked=Boolean(list.length&&checked===list.length);
    all.indeterminate=checked>0&&checked<list.length;
    all.disabled=statusBusy||list.length===0;
    $("select-visible").disabled=statusBusy||list.length===0;
    $("clear-selection").disabled=statusBusy;
    $("bulk-edit-button").disabled=statusBusy||!selectedPersonIds.size;
    $("bulk-selection-count").textContent=selectedPersonIds.size+" selecionado"+(selectedPersonIds.size===1?"":"s");
    $("bulk-edit-button").setAttribute("aria-label","Editar categoria de "+selectedPersonIds.size+" colaboradores");
    show("bulk-selection-bar",selectedPersonIds.size>0);
    show("clear-selection",selectedPersonIds.size>0);
  }
  function updateVisibleSelection(checked) {
    if(statusBusy||!dataset)return;
    const visible=getFilteredPeople();
    const added=visible.filter(p=>!selectedPersonIds.has(p.id));
    if(checked && selectedPersonIds.size+added.length>200) {
      toast("Selecione até 200 colaboradores por alteração em lote.",true);
      renderPeople();return;
    }
    visible.forEach(p=>checked?selectedPersonIds.add(p.id):selectedPersonIds.delete(p.id));
    renderPeople();
  }
  function renderPeople() {
    if(!dataset)return;
    const query=norm($("people-search").value),status=$("status-filter").value,map=conMap();
    show("clear-people-search",Boolean($("people-search").value));
    const sectors=[...new Set(dataset.collaborators.flatMap(personCategories))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const selector=$("sector-filter"),selected=selector.value;
    selector.innerHTML='<option value="all">Todas as categorias</option>'+sectors.map(x=>'<option value="'+escapeHtml(x)+'">'+escapeHtml(x)+'</option>').join("");
    selector.value=selected==="all"||sectors.includes(selected)?selected:"all";
    $("sector-suggestions").innerHTML=sectors.map(x=>'<option value="'+escapeHtml(x)+'"></option>').join("");
    const declinedMap=declineMap();
    const byStatus={
      all:dataset.collaborators.length,
      confirmed:dataset.collaborators.filter(p=>map.has(p.id)).length,
      pending:dataset.collaborators.filter(p=>!map.has(p.id)&&!declinedMap.has(p.id)).length,
      declined:dataset.collaborators.filter(p=>declinedMap.has(p.id)).length,
      inactive:dataset.collaborators.filter(p=>!p.ativo).length,
      incomplete:dataset.collaborators.filter(p=>p.nome_completo.trim().split(/\s+/).length===1).length
    };
    document.querySelectorAll("[data-count-for]").forEach(n=>n.textContent=byStatus[n.dataset.countFor]??0);
    document.querySelectorAll(".people-status-tab").forEach(n=>{
      const active=n.dataset.status===status;
      n.classList.toggle("active",active);n.setAttribute("aria-pressed",String(active));
    });
    const list=getFilteredPeople(map);
    $("people-count").textContent=list.length+" resultado"+(list.length===1?"":"s");
    $("people-body").innerHTML=list.length?list.map(p=>{
      const c=map.get(p.id),d=declinedMap.get(p.id),confirmed=!!c;
      const badge=confirmed?'<span class="status-chip confirmed">Confirmado</span>':
        d?'<span class="status-chip declined">Recusado</span>':!p.ativo?'<span class="status-chip inactive">Inativo</span>':'<span class="status-chip">Pendente</span>';
      const initials=p.nome_completo.split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase();
      const sectorText=personCategories(p).join(" · ")||"Sem categoria";
      const nicknameText=p.apelido ? " · Apelido: " + p.apelido : "";
      const disabled=statusBusy||!validPersonName(p.nome_completo);
      const toggle='<button type="button" role="switch" class="rsvp-confirm-toggle'+(statusBusy?' is-busy':'')+
        '" data-confirm-id="'+escapeHtml(p.id)+'" aria-checked="'+confirmed+'" aria-label="'+
        escapeHtml((confirmed?"Retirar confirmação de ":"Confirmar presença de ")+p.nome_completo)+'"'+
        (disabled?' disabled':'')+'><span class="rsvp-confirm-thumb" aria-hidden="true"></span></button>';
      const guestName=d?String(d.motivo_recusa||"Motivo não informado"):c?.acompanhante?String(c.acompanhante_nome||"Nome não informado"):"—";
      return '<tr class="people-selectable'+(selectedPersonIds.has(p.id)?' is-selected':'')+(statusBusy?' selection-disabled':'')+'"><td><div class="name-cell">'+
      '<label class="people-row-select" title="Selecionar '+escapeHtml(p.nome_completo)+'"><input type="checkbox" class="people-row-checkbox" data-select-id="'+escapeHtml(p.id)+'" aria-label="Selecionar '+escapeHtml(p.nome_completo)+'"'+(selectedPersonIds.has(p.id)?' checked':'')+(statusBusy?' disabled':'')+'><span aria-hidden="true"></span></label>'+
      '<span class="initial-badge">'+escapeHtml(initials)+
      '</span><span class="name-stack"><strong title="'+escapeHtml(p.nome_completo)+'">'+escapeHtml(p.nome_completo)+
      '</strong><small title="'+escapeHtml(sectorText+nicknameText)+'">'+escapeHtml(sectorText+nicknameText)+'</small></span></div></td>'+
      '<td class="companion-cell'+(d?' decline-reason-cell':'')+'" title="'+escapeHtml(guestName)+'">'+(d?'<small class="decline-reason-label">Motivo da recusa</small>':'')+escapeHtml(guestName)+'</td>'+
      '<td><div class="people-status-cell"><div class="people-status-description">'+badge+
      '</div>'+toggle+'</div></td>'+
      '<td>'+escapeHtml(stamp(c?.confirmado_em||d?.confirmado_em))+'</td>'+
      '<td><button class="icon-btn edit-person" type="button" data-id="'+escapeHtml(p.id)+
      '" aria-label="Editar '+escapeHtml(p.nome_completo)+'"><i data-lucide="pencil"></i></button></td></tr>';
    }).join(""):'<tr><td colspan="5" class="people-empty">Nenhum colaborador encontrado.</td></tr>';
    updateSelectionUI(list);
    icons();
  }
  $("people-search").addEventListener("input",renderPeople);
  $("clear-people-search").addEventListener("click",()=>{
    $("people-search").value="";renderPeople();$("people-search").focus();
  });
  $("status-filter").addEventListener("change",renderPeople);
  $("sector-filter").addEventListener("change",renderPeople);
  document.querySelectorAll(".people-status-tab").forEach(n=>n.addEventListener("click",()=>{
    $("status-filter").value=n.dataset.status;renderPeople();
  }));
  $("people-select-all").addEventListener("change",e=>updateVisibleSelection(e.target.checked));
  $("select-visible").addEventListener("click",()=>updateVisibleSelection(true));
  $("clear-selection").addEventListener("click",()=>{
    if(statusBusy)return;
    selectedPersonIds.clear();renderPeople();
  });
  $("people-body").addEventListener("change",e=>{
    const checkbox=e.target.closest("[data-select-id]");
    if(!checkbox||statusBusy)return;
    const id=checkbox.dataset.selectId;
    if(checkbox.checked&&selectedPersonIds.size>=200&&!selectedPersonIds.has(id)){
      toast("Selecione até 200 colaboradores por vez.",true);checkbox.checked=false;return;
    }
    if(checkbox.checked)selectedPersonIds.add(id);else selectedPersonIds.delete(id);
    checkbox.closest("tr")?.classList.toggle("is-selected",checkbox.checked);
    updateSelectionUI();
  });
  $("people-body").addEventListener("click",e=>{
    const edit=e.target.closest(".edit-person");
    if(edit){openPerson(edit.dataset.id);return;}
    const toggle=e.target.closest("[data-confirm-id]");
    if(toggle){toggleListConfirmation(toggle.dataset.confirmId);return;}
    // Native label/checkbox clicks already fire change; never toggle them twice.
    if(statusBusy||e.target.closest("button,input,label,a,select,textarea,[role=button]"))return;
    if(window.getSelection?.()?.toString())return;
    const checkbox=e.target.closest("tr.people-selectable")?.querySelector(".people-row-checkbox");
    if(checkbox&&!checkbox.disabled)checkbox.click();
  });

  function confirmBulkUpdate(count,sector) {
    if(actionResolve)return Promise.resolve(false);
    const changes=[];
    changes.push("Categoria: "+(sector||"Sem categoria"));
    $("rsvp-confirm-title").textContent="Salvar alterações em lote?";
    $("rsvp-confirm-message").textContent="Aplicar em "+count+" colaborador"+(count===1?"":"es")+
      ": "+changes.join(" • ")+". Nomes, apelidos e confirmações serão preservados.";
    $("rsvp-confirm-accept").textContent="Sim, salvar alterações";
    $("rsvp-confirm-accept").classList.remove("is-destructive");
    const focused=document.activeElement;
    show("rsvp-confirm-modal",true);icons();
    return new Promise(resolve=>{
      actionResolve=value=>{
        if(!actionResolve)return;
        actionResolve=null;show("rsvp-confirm-modal",false);
        if(focused?.isConnected)focused.focus();
        resolve(value);
      };
      $("rsvp-confirm-cancel").focus();
    });
  }
  $("bulk-edit-button").addEventListener("click",()=>{
    if(statusBusy||!dataset||!selectedPersonIds.size)return;
    $("bulk-modal-count").textContent=selectedPersonIds.size+" colaborador"+(selectedPersonIds.size===1?"":"es")+" selecionado"+(selectedPersonIds.size===1?"":"s");
    $("bulk-sector").value="";
    modal("bulk-modal",true);
  });
  $("bulk-form").addEventListener("submit",async e=>{
    e.preventDefault();
    if(statusBusy||actionResolve||!dataset)return;
    const ids=[...selectedPersonIds];
    if(!ids.length){toast("Selecione ao menos um colaborador.",true);return;}
    if(ids.length>200){toast("Selecione até 200 colaboradores.",true);return;}
    const sector=$("bulk-sector").value.trim();
    const group=sector||"Sem grupo";
    if(sector.length>90){toast("A categoria deve ter até 90 caracteres.",true);return;}
    const approved=await confirmBulkUpdate(ids.length,sector);
    if(!approved)return;
    statusBusy=true;
    setActionLoading(true,"Atualizando categoria...");
    $("bulk-submit").disabled=true;
    try{
      const generation=authGeneration;
      const response=await admin("admin-bulk-update",{ids,
        ...(sector!==null?{setor:sector}:{}),
        ...(group!==null?{grupo:group}:{})});
      if(generation!==authGeneration)return;
      if(response.updated!==ids.length)throw new Error("O servidor não confirmou todos os registros.");
      const changed=new Set(ids);
      dataset.collaborators=dataset.collaborators.map(p=>changed.has(p.id)
        ? {...p,...(sector!==null?{setor:sector}:{}),...(group!==null?{grupo:group}:{})}
        : p);
      mutationEpoch++;
      lastLoad=Date.now();
      selectedPersonIds.clear();
      modal("bulk-modal",false);
      render();
      toast(response.updated+" colaborador"+(response.updated===1?"":"es")+" atualizado"+(response.updated===1?"":"s")+" com sucesso.");
    }catch(error){
      toast(error.message||"Não foi possível atualizar os colaboradores.",true);
    }finally{
      setActionLoading(false);
      statusBusy=false;
      $("bulk-submit").disabled=false;
      renderPeople();
    }
  });

  // Atualiza a lista somente após o servidor confirmar a gravação.
  // Não aguarda uma segunda consulta completa de 83+ registros para destravar a interface.
  // O polling periódico faz a reconciliação posterior.
  function applySavedPerson(id,name,sector,active,confirmed,nickname="",group=null) {
    if (!dataset || !id) return;
    const prev = dataset.collaborators.find(p => p.id === id);
    const current = prev
      ? {...prev,nome_completo:name,apelido:nickname,setor:sector,grupo:group===null?prev.grupo:(group||"Sem grupo"),ativo:active}
      : {id,nome_completo:name,apelido:nickname,setor:sector,grupo:group||"Sem grupo",ativo:active,
         criado_em:new Date().toISOString()};
    dataset.collaborators = [
      ...dataset.collaborators.filter(p => p.id !== id),current
    ].sort((a,b)=>a.nome_completo.localeCompare(b.nome_completo,"pt-BR"));
    if(confirmed)dataset.declines=(dataset.declines||[]).filter(c=>c.colaborador_id!==id);
    const hadReply = (dataset.confirmations || []).find(c => c.colaborador_id === id);
    if (confirmed && !hadReply) {
      dataset.confirmations = [
        ...(dataset.confirmations || []),
        {colaborador_id:id,acompanhante:false,acompanhante_nome:null,
         confirmado_em:new Date().toISOString(),origem:"manual"}
      ];
    } else if (!confirmed && hadReply) {
      dataset.confirmations = dataset.confirmations.filter(c => c.colaborador_id !== id);
    }
    mutationEpoch++;
    lastLoad = Date.now();
    render();
  }
  async function toggleListConfirmation(id) {
    if(statusBusy||!dataset||actionResolve)return;
    const p=dataset.collaborators.find(x=>x.id===id);
    if(!p||!validPersonName(p.nome_completo))return;
    const next=!conMap().has(id);
    statusBusy=true;renderPeople();
    let loadingStarted=false;
    try {
      const approved=await confirmStatus({name:p.nome_completo,turningOn:next});
      if(!approved)return;
      setActionLoading(true,next?"Validando dados da confirmação...":"Removendo confirmação...");
      loadingStarted=true;
      const generation=authGeneration;
      mutedConfirmationIds.add(id);
      await admin("admin-set-presence",{id:p.id,confirmado:next});
      if(generation!==authGeneration)return;
      applySavedPerson(p.id,p.nome_completo,p.setor||"",p.ativo!==false,next,p.apelido||"");
      if(next)celebrateManualConfirmation();
      toast(next?"Presença de "+p.nome_completo+" confirmada.":"Confirmação de "+p.nome_completo+" retirada.");
    }catch(err){toast(err.message||"Não foi possível salvar.","error");}
    finally{if(loadingStarted)setActionLoading(false);mutedConfirmationIds.delete(id);statusBusy=false;renderPeople();}
  }
  $("refresh-dashboard").addEventListener("click",async () => {
    const button = $("refresh-dashboard"); button.disabled = true;
    try { await bootstrap(true); notify("Indicadores e lista atualizados."); }
    finally { button.disabled = false; }
  });


  function updateMessagePreview() {
    renderRsvpMessage($("event-description-preview"), $("event-description").value);
    $("event-description-count").textContent=String($("event-description").value.length)+" / 500";
  }
  $("event-description").addEventListener("input",updateMessagePreview);
  document.querySelectorAll("[data-message-format]").forEach(button => {
    button.addEventListener("pointerdown",event => {
      if(event.pointerType === "mouse")event.preventDefault(); // preserva seleção do textarea
    });
    button.addEventListener("click",() => {
      const textarea=$("event-description");
      const marker=({bold:"**",italic:"*",strike:"~~"})[button.dataset.messageFormat];
      if(!marker)return;
      const start=textarea.selectionStart,end=textarea.selectionEnd;
      const selected=textarea.value.slice(start,end);
      const placeholder=selected||"texto";
      const before=textarea.value.slice(0,start),after=textarea.value.slice(end);
      const formatted=marker+placeholder+marker;
      if((before+formatted+after).length>500){
        notify("A mensagem pode ter até 500 caracteres, incluindo os marcadores.",true);
        return;
      }
      textarea.setRangeText(formatted,start,end,"end");
      textarea.focus();
      textarea.setSelectionRange(start+marker.length,start+marker.length+placeholder.length);
      updateMessagePreview();
    });
  });
  $("event-description").addEventListener("keydown",event=>{
    if(!(event.ctrlKey||event.metaKey) || event.altKey)return;
    const format=event.key.toLowerCase()==="b"?"bold":event.key.toLowerCase()==="i"?"italic":null;
    if(!format)return;
    event.preventDefault();
    document.querySelector('[data-message-format="'+format+'"]')?.click();
  });

  function renderSettings() {
    if (!dataset) return;
    const ev = dataset.event;
    $("event-title").value = ev.titulo || "";
    $("event-description").value = ev.descricao || "";
    updateMessagePreview();
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
    if(statusBusy||actionResolve)return;
    modal("edit-modal",false); modal("import-modal",false); modal("bulk-modal",false);
  }));
  function openPerson(id=null) {
    if(statusBusy)return;
    editingId=id;
    const p=(dataset?.collaborators||[]).find(x=>x.id===id);
    if(id&&!p)return;
    const categories=personCategories(p);
    originalCategory=categories[0]||"";
    $("modal-title").textContent=p?"Editar colaborador":"Novo colaborador";
    $("person-name").value=p?.nome_completo||"";
    $("person-nickname").value=p?.apelido||"";
    $("person-sector").value=originalCategory;
    $("person-active").checked=p?.ativo!==false;
    $("legacy-category-note").textContent=categories.length>1?"Classificação anterior adicional: "+categories.slice(1).join(", ")+". Será preservada se você não alterar a categoria.":"";
    show("legacy-category-note",categories.length>1);
    show("person-active-wrap",!!p);
    show("person-delete",!!p);
    modal("edit-modal",true);
  }
  $("people-add").addEventListener("click",()=>openPerson());
  $("person-delete").addEventListener("click",async()=>{
    if(statusBusy||actionResolve||!editingId||!dataset)return;
    const p=dataset.collaborators.find(x=>x.id===editingId);
    if(!p)return;
    const id=p.id;
    if(!window.confirm("Excluir "+p.nome_completo+" definitivamente? O cadastro, a confirmação de presença e o acompanhante, se houver, serão removidos. Esta ação não pode ser desfeita."))return;
    statusBusy=true;
    $("person-delete").disabled=true;
    $("person-save").disabled=true;
    setActionLoading(true,"Excluindo colaborador...");
    try {
      const generation=authGeneration;
      await admin("admin-delete",{id});
      if(generation!==authGeneration)return;
      dataset.collaborators=dataset.collaborators.filter(x=>x.id!==id);
      dataset.confirmations=dataset.confirmations.filter(x=>x.colaborador_id!==id);
      dataset.declines=(dataset.declines||[]).filter(x=>x.colaborador_id!==id);
      selectedPersonIds.delete(id);
      mutationEpoch++;lastLoad=Date.now();
      modal("edit-modal",false);
      render();toast("Colaborador excluído.");
    }catch(err){toast(err.message||"Não foi possível excluir.",true);}
    finally{
      statusBusy=false;setActionLoading(false);
      $("person-delete").disabled=false;$("person-save").disabled=false;renderPeople();
    }
  });
  $("person-form").addEventListener("submit",async e=>{
    e.preventDefault();
    if(statusBusy)return;
    const name=$("person-name").value.trim(),active=$("person-active").checked;
    const nickname=$("person-nickname").value.trim(),category=$("person-sector").value.trim();
    if(nickname && !/^[\p{L}\p{N}\s'.-]{1,60}$/u.test(nickname)) {
      notify("O apelido deve ter até 60 caracteres, com letras e números.",true);return;
    }
    if(!validPersonName(name)){notify("Informe um nome com pelo menos 3 letras.",true);return;}
    if(category.length>90){notify("A categoria deve ter até 90 caracteres.",true);return;}
    statusBusy=true;
    setActionLoading(true,"Salvando cadastro...");
    const button=$("person-save"),id=editingId;
    button.disabled=true;button.classList.add("is-saving");$("person-delete").disabled=true;
    $("person-save-label").textContent="Salvando...";
    try {
      const generation=authGeneration;
      const reply=await admin("admin-save-profile",{
        id,nome_completo:name,apelido:nickname,ativo:active,
        ...(!id||category!==originalCategory?{categoria:category}:{})
      });
      if(generation!==authGeneration)return;
      if(!reply.person?.id)throw new Error("O servidor não retornou o cadastro.");
      dataset.collaborators=[...dataset.collaborators.filter(p=>p.id!==reply.person.id),reply.person].sort((a,b)=>a.nome_completo.localeCompare(b.nome_completo,"pt-BR"));
      mutationEpoch++;lastLoad=Date.now();
      modal("edit-modal",false);
      render();toast(id?"Cadastro atualizado com sucesso.":name+" cadastrado com sucesso.");
    }catch(err){toast(err.message||"Não foi possível salvar.",true);}
    finally{
      setActionLoading(false);statusBusy=false;button.disabled=false;button.classList.remove("is-saving");
      $("person-delete").disabled=false;$("person-save-label").textContent="Salvar colaborador";renderPeople();
    }
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
  function buildConfirmedPrint(data, logos, generatedAt) {
    const map=new Map((data.confirmations||[]).filter(c=>!c.resposta||c.resposta==="confirmado").map(c=>[c.colaborador_id,c]));
    const confirmed=(data.collaborators||[]).filter(p=>map.has(p.id)).sort((a,b)=>a.nome_completo.localeCompare(b.nome_completo,"pt-BR"));
    const companions=confirmed.filter(p=>map.get(p.id)?.acompanhante).length;
    const rows=confirmed.map((p,i)=>{
      const c=map.get(p.id);
      return '<tr><td class="index">'+(i+1)+'</td><td>'+escapeHtml(p.nome_completo)+'</td><td>'+escapeHtml(c.acompanhante?(c.acompanhante_nome||"Nome não informado"):"—")+'</td></tr>';
    }).join("")||'<tr><td colspan="3" class="empty">Nenhuma presença confirmada até o momento.</td></tr>';
    const logoMarkup=logos.map(x=>'<div class="logo"><img src="'+escapeHtml(x.src)+'" alt="'+escapeHtml(x.alt)+'" referrerpolicy="no-referrer"><span hidden>'+escapeHtml(x.alt)+'</span></div>').join("");
    const eventTitle=data.event?.titulo||"Confraternização 2026";
    const eventDate=String(data.event?.data_evento||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const details=[eventDate?eventDate[3]+"/"+eventDate[2]+"/"+eventDate[1]:"",data.event?.horario||"",data.event?.local_evento||""].filter(Boolean).map(escapeHtml).join(" · ");
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Lista de confirmados — '+escapeHtml(eventTitle)+'</title><style>'+
      '@page{size:A4 portrait;margin:13mm 12mm}*{box-sizing:border-box}body{font:12px/1.4 Arial,sans-serif;color:#24332b;background:#eef2ef;margin:0}'+
      '.toolbar{position:sticky;top:0;background:#fff;padding:12px;display:flex;justify-content:center;gap:12px;align-items:center;border-bottom:1px solid #dbe4dc;z-index:5}.toolbar button{border:0;background:#1d6742;color:white;padding:12px 19px;border-radius:8px;font-weight:bold;cursor:pointer}.toolbar button:disabled{opacity:.5}.toolbar small{color:#65746a}'+
      '.paper{max-width:210mm;margin:16px auto;padding:13mm 12mm;background:#fff;min-height:270mm}.header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:14px;border-bottom:2px solid #2d6542;break-inside:avoid}.logos{display:flex;align-items:center;gap:16px;flex-wrap:wrap}.logo{display:flex;align-items:center;min-width:0}.logo img{display:block;width:100px;height:48px;object-fit:contain}.logo span:not([hidden]){font-weight:bold;color:#285b3a}.event-mark{text-align:right;color:#24583a;line-height:1.08}.event-mark strong{font-size:20px;letter-spacing:-.6px}.event-mark small{display:block;font-size:9px;letter-spacing:.12em;margin-bottom:5px;text-transform:uppercase}'+
      'h1{font-size:23px;line-height:1.2;margin:19px 0 5px;color:#213d2b}.details,.generated{font-size:10px;color:#68756b;margin:5px 0}.summary{display:flex;gap:22px;flex-wrap:wrap;border:1px solid #dce5dc;border-radius:8px;padding:12px;margin:16px 0;break-inside:avoid}.summary div{display:flex;flex-direction:column;gap:2px}.summary strong{font-size:19px;color:#24583a}.summary small{font-size:10px;color:#596a5c}'+
      'table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:11px}thead{display:table-header-group}th{text-align:left;background:#eaf0eb;border-bottom:1px solid #b9cabb;padding:9px 8px;font-size:10px;color:#34513b}td{padding:9px 8px;border-bottom:1px solid #dce5dc;vertical-align:middle;overflow-wrap:anywhere}tbody tr{break-inside:avoid;page-break-inside:avoid}.index{text-align:center;color:#738176}.empty{text-align:center;color:#68756b;padding:20px}.footer{font-size:9px;color:#68756b;margin:16px 0 0;text-align:center}'+
      '@media(max-width:600px){.paper{padding:15px;margin:0;min-height:0}.logo img{width:78px;height:38px}.header{gap:8px}.logos{gap:7px}.event-mark strong{font-size:16px}.summary{gap:15px}.toolbar{flex-wrap:wrap}}'+
      '@media print{html,body{background:#fff!important;margin:0!important}.toolbar{display:none!important}.paper{margin:0!important;padding:0!important;max-width:none;min-height:0}.header,.summary{-webkit-print-color-adjust:exact;print-color-adjust:exact}th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}'+
      '</style></head><body><div class="toolbar"><button id="print-action" type="button" disabled>Imprimir / Salvar em PDF</button><small id="print-hint">Carregando os logos...</small></div><main class="paper"><header class="header"><div class="logos">'+logoMarkup+'</div><div class="event-mark"><strong>'+escapeHtml(eventTitle)+'</strong></div></header><h1>Lista de presenças confirmadas</h1><p class="details">'+details+'</p><p class="generated">Emitida em '+escapeHtml(generatedAt)+' · Horário de Brasília</p><div class="summary"><div><strong>'+confirmed.length+'</strong><small>Colaboradores confirmados</small></div><div><strong>'+companions+'</strong><small>Acompanhantes</small></div><div><strong>'+(confirmed.length+companions)+'</strong><small>Total de pessoas</small></div></div><table><colgroup><col style="width:8%"><col style="width:46%"><col style="width:46%"></colgroup><thead><tr><th class="index">Nº</th><th>Nome do colaborador</th><th>Nome do acompanhante</th></tr></thead><tbody>'+rows+'</tbody></table><p class="footer">Uso interno · Organização da confraternização</p></main></body></html>';
  }
  async function printConfirmed() {
    if(!session||!dataset||statusBusy)return;
    const generation=authGeneration;
    const win=window.open("","_blank");
    if(!win){notify("Permita a abertura de uma nova aba para imprimir a lista.",true);return;}
    win.opener=null;
    win.document.write('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Preparando lista</title><body style="font:16px Arial;padding:24px;color:#285b3a">Preparando a lista atualizada de confirmados...</body></html>');
    win.document.close();
    const buttons=[$("print-confirmed"),$("print-confirmed-overview")];
    buttons.forEach(b=>b.disabled=true);
    try{
      const data=await admin("admin-bootstrap");
      if(generation!==authGeneration||!session){win.close();return;}
      if(win.closed)return;
      if(!Array.isArray(data.collaborators)||!Array.isArray(data.confirmations))throw new Error("Dados indisponíveis.");
      const logos=[...document.querySelectorAll(".admin-header-logos img")].map(img=>({src:img.src,alt:img.alt}));
      const date=new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Sao_Paulo"}).format(new Date());
      win.document.open();win.document.write(buildConfirmedPrint(data,logos,date));win.document.close();
      const button=win.document.getElementById("print-action"),hint=win.document.getElementById("print-hint");
      const images=[...win.document.querySelectorAll(".logo img")];
      await Promise.all(images.map(img=>new Promise(resolve=>{
        let timer;
        const done=()=>{clearTimeout(timer);if(!img.naturalWidth){img.hidden=true;img.style.display="none";img.nextElementSibling.hidden=false;}resolve();};
        if(img.complete){done();return;}
        img.addEventListener("load",done,{once:true});img.addEventListener("error",done,{once:true});timer=setTimeout(done,7000);
      })));
      if(win.closed)return;
      button.disabled=false;hint.textContent="Escolha Salvar em PDF nas opções da impressora.";
      button.addEventListener("click",()=>{win.focus();win.print();});
      win.focus();
    }catch(err){
      if(!win.closed)win.close();notify("Não foi possível preparar a lista: "+(err.message||"tente novamente."),true);
    }finally{buttons.forEach(b=>b.disabled=false);}
  }
  $("print-confirmed").addEventListener("click",printConfirmed);
  $("print-confirmed-overview").addEventListener("click",printConfirmed);
  $("export-button").addEventListener("click",()=> {
    if(!dataset)return;
    const map=conMap();
    const declined=declineMap();
    const rows=[["Colaborador","Apelido","Setor","Grupo","Status","Origem da resposta","Acompanhante","Nome do acompanhante","Data da resposta","Motivo da recusa"]];
    dataset.collaborators.forEach(p => {const c=map.get(p.id),d=declined.get(p.id),reply=c||d;rows.push([p.nome_completo,p.apelido||"",p.setor||"",p.grupo||"",c?"Confirmado":d?"Recusado":!p.ativo?"Inativo":"Pendente",reply?.origem==="manual"?"Manual":reply?"Link":"",c?.acompanhante?"Sim":"Nao",c?.acompanhante_nome||"",stamp(reply?.confirmado_em),d?.motivo_recusa||""]);});
    const csv="\uFEFF"+rows.map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(";")).join("\r\n");
    const url=window.URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); // replaced below to avoid shadowing global URL
    const a=document.createElement("a");a.href=url;a.download="confirmacoes-confraternizacao.csv";a.click();setTimeout(()=>window.URL.revokeObjectURL(url),1000);
  });
  $("copy-link").addEventListener("click",async () => {
    const link=location.origin+"/confraternizacao/";
    try { await navigator.clipboard.writeText(link);notify("Link copiado!"); } catch(_) { notify("Copie o link: "+link); }
  });
  const signOut = async () => {
    const oldSession = session;
    authGeneration++;
    session = null; dataset = null; lastLoad = 0;
    sessionStorage.removeItem(storageKey);
    showLogin();
    if (oldSession) {
      try { await request("admin-logout", {}, oldSession); } catch (_) {}
    }
  };
  $("logout-button").addEventListener("click",signOut);
  $("mobile-logout").addEventListener("click",signOut);
  $("admin-loading-retry").addEventListener("click",() => {
    if (session) bootstrap(false);
    else showLogin();
  });
  $("admin-loading-switch").addEventListener("click",() => {
    authGeneration++;
    session = null; dataset = null; lastLoad = 0;
    sessionStorage.removeItem(storageKey);
    showLogin();
  });
  $("login-form").addEventListener("submit",async e => {
    e.preventDefault();
    const button = $("admin-login-submit");
    const label = $("admin-login-button-text");
    if (button.disabled) return;
    button.disabled = true;
    button.classList.add("is-pending");
    label.textContent = "Verificando acesso...";
    fail("login-error","");
    try {
      const response = await request("admin-login",{access_code:$("admin-code").value.trim()});
      authGeneration++;
      session = response.access_token;
      sessionStorage.setItem(storageKey,session);
      $("admin-code").value="";
      await bootstrap(false);
    } catch(err) {
      showLogin();
      fail("login-error",err.message || "Não foi possível entrar.");
    } finally {
      button.disabled = false;
      button.classList.remove("is-pending");
      label.textContent = "Entrar no painel";
    }
  });
  if (session) bootstrap(false);
  else showLogin();
  // Só consulta automaticamente quando o evento aceita confirmações.
  // Rascunho, encerramento manual e prazo vencido pausam todas as consultas periódicas.
  // Um refresh manual ou a reabertura pelas configurações atualizam os dados e reativam o ciclo.
  setInterval(() => {
    if (session && dataset && effectiveAdminState(dataset.event) === "aberto"
      && !pendingBootstrap && !statusBusy && !document.hidden
      && $("edit-modal").classList.contains("hidden")
      && $("import-modal").classList.contains("hidden")
      && $("bulk-modal").classList.contains("hidden")
      && Date.now()-lastLoad>=5000) bootstrap(true);
  },1000);
  icons();
}
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("admin-page")) initAdmin();
  else initGuest();
});
})();