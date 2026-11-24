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
  let viewportFrame = 0, restingHeight = 0, currentStage = "identify";
  const scrollArea = $("rsvp-sheet-scroll");
  function syncSheetViewport() {
    const viewport = window.visualViewport;
    const visibleHeight = Math.max(160, Math.round(viewport?.height || window.innerHeight));
    const visibleTop = Math.max(0, Math.round(viewport?.offsetTop || 0));
    sheet.style.setProperty("--rsvp-visible-height", visibleHeight + "px");
    sheet.style.setProperty("--rsvp-visible-top", visibleTop + "px");
    const active = document.activeElement;
    const editing = active && sheet.contains(active) && (active === input || active === $("companion-name"));
    const keyboardOpen = restingHeight > 0 && restingHeight - visibleHeight > 100;
    if (!editing && !keyboardOpen) restingHeight = visibleHeight;
    if (!restingHeight) restingHeight = visibleHeight;
    const preferredGap = Math.round(restingHeight * 0.20);
    const topGap = Math.min(preferredGap, Math.max(8, visibleHeight - 320));
    sheet.style.setProperty("--rsvp-form-height", Math.max(0, visibleHeight - topGap) + "px");
    sheet.classList.toggle("keyboard-open", keyboardOpen || (editing && visibleHeight < 500));
    if (!sheet.classList.contains("hidden") && editing && scrollArea.contains(active)) {
      const field = active.getBoundingClientRect(), area = scrollArea.getBoundingClientRect();
      if (field.bottom > area.bottom - 8) scrollArea.scrollTop += field.bottom - area.bottom + 8;
      else if (field.top < area.top + 4) scrollArea.scrollTop -= area.top + 4 - field.top;
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
    if (document.activeElement === input || document.activeElement === $("companion-name")) document.activeElement.blur();
    currentStage = stage;
    sheet.dataset.stage = stage;
    show("guest-identify", stage === "identify");
    show("guest-companion", stage === "companion");
    show("guest-companion-name", stage === "companion-name");
    show("guest-done", stage === "done");
    show("sheet-footer", stage !== "done");
    show("sheet-privacy", stage === "identify");
    show("sheet-actions", stage === "companion" || stage === "companion-name");
    show("companion-back", stage === "companion-name");
    $("sheet-title").textContent = stage === "identify" ? "Encontre seu nome" :
      stage === "companion" ? "Sua presença" : stage === "companion-name" ? "Seu acompanhante" : "Sua confirmação";
    scrollArea.scrollTop = 0;
    fail("sheet-error", "");
    updateButton();
    $("sheet-title").focus({ preventScroll: true });
    requestViewportSync();
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
    if (document.activeElement === input || document.activeElement === $("companion-name")) document.activeElement.blur();
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
    const button = $("confirm-button");
    const next = currentStage === "companion" && checked === "yes";
    button.disabled = loading || !checked || (currentStage === "companion-name" && !validFullName($("companion-name").value));
    $("companion-back").disabled = loading;
    if (!loading) {
      const label = next ? "Continuar" : "Confirmar presença";
      if (button.dataset.label !== label || button.classList.contains("is-loading")) {
        button.dataset.label = label;
        button.innerHTML = next ? 'Continuar <i data-lucide="arrow-right"></i>' : 'Confirmar presença <i data-lucide="check"></i>';
        icons();
      }
    }
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
        $("confirm-button").dataset.label = "";
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
      $("search-hint").textContent = ""; $("search-hint").classList.add("search-status-sr");
      return;
    }
    $("search-hint").classList.add("search-status-sr");
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
        $("search-hint").classList.remove("search-status-sr");
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
  $("companion-back").addEventListener("click", () => { if (!loading) toggleStage("companion"); });
  $("companion-name").addEventListener("keydown", e => {
    if (e.key === "Enter" && currentStage === "companion-name" && !$("confirm-button").disabled) {
      e.preventDefault(); $("companion-name").blur(); $("confirm-button").click();
    }
  });

  $("confirm-button").addEventListener("click", async () => {
    const choice = document.querySelector('input[name="plus"]:checked')?.value || "";
    if (!selected || !typedQuery || !choice || loading) return;
    if (currentStage === "companion" && choice === "yes") { toggleStage("companion-name"); return; }
    if (currentStage !== "companion" && currentStage !== "companion-name") return;
    if (choice === "yes" && (currentStage !== "companion-name" || !validFullName($("companion-name").value))) return;
    $("companion-name").blur();
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
        acompanhante_nome: choice === "yes" ? $("companion-name").value.trim() : ""
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

document.addEventListener("DOMContentLoaded", initGuest);
})();
