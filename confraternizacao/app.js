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
async function request(action, data = {}, token = "") {
  const resp = await fetch(ENDPOINT, { method: "POST", headers: {
    "Content-Type": "application/json", "apikey": KEY, ...(token ? { "Authorization": "Bearer " + token } : {})
  }, body: JSON.stringify({ action, ...data }), cache: "no-store" });
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
  let event = null, selected = null, typedQuery = "", timer = null, searchSeq = 0, loading = false;
  const input = $("employee-search");
  async function load() {
    try {
      const resp = await request("event");
      event = resp.event;
      $("guest-description").textContent = event.descricao || "Vamos celebrar juntos nossas conquistas!";
      $("event-date").textContent = datestr(event.data_evento);
      $("event-time").textContent = event.horario ? event.horario.replace(":", "h") : "A definir";
      $("event-place").textContent = event.local_evento || "A definir";
      show("guest-loading", false);
      show("guest-locked", event.status !== "aberto");
      show("guest-identify", event.status === "aberto");
      icons();
    } catch (err) {
      show("guest-loading", false);
      show("guest-locked", true);
      fail("guest-error", err.message);
    }
  }
  const results = $("employee-results");
  function clearResults() { results.innerHTML = ""; }
  function drawResults(items) {
    clearResults();
    if (!items.length) { results.innerHTML = '<div class="result-empty">Nenhum colaborador encontrado. Confira a grafia do nome.</div>'; return; }
    items.forEach((person) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "result-item";
      button.setAttribute("role","option");
      button.innerHTML = '<span class="result-avatar"><i data-lucide="user-round"></i></span><strong></strong><i data-lucide="chevron-right"></i>';
      button.querySelector("strong").textContent = person.nome_completo;
      button.addEventListener("click", () => {
        selected = person; typedQuery = input.value.trim();
        $("selected-name").textContent = person.nome_completo;
        show("guest-identify", false);
        show("guest-companion", true);
        $("step-one").className = "step complete";
        $("step-two").className = "step active";
        $("step-caption").textContent = "PASSO 2 DE 2";
        if (event && !event.permite_acompanhante) {
          document.querySelector('input[name="plus"][value="no"]').checked = true;
          document.querySelectorAll('.option:has(input[value="yes"])').forEach(node => node.classList.add("hidden"));
        }
        updateButton(); fail("guest-error", ""); icons();
      });
      results.appendChild(button);
    });
    icons();
  }
  input.addEventListener("input", () => {
    clearTimeout(timer);
    searchSeq++;
    const current = input.value.trim();
    show("clear-search", !!current);
    clearResults();
    if (!validSearch(current)) {
      $("search-hint").textContent = "Digite seu nome e pelo menos 3 letras do sobrenome.";
      return;
    }
    $("search-hint").textContent = "Buscando colaboradores...";
    const version = searchSeq;
    timer = setTimeout(async () => {
      try {
        const resp = await request("search", { query: current });
        if (version !== searchSeq) return;
        $("search-hint").textContent = "Selecione seu nome para continuar.";
        drawResults(resp.results || []);
      } catch (err) {
        if (version === searchSeq) { $("search-hint").textContent = err.message; clearResults(); }
      }
    }, 320);
  });
  $("clear-search").addEventListener("click", () => { input.value = ""; input.dispatchEvent(new Event("input")); input.focus(); });
  $("change-person").addEventListener("click", () => {
    selected = null; typedQuery = "";
    show("guest-companion", false); show("guest-identify", true);
    $("step-one").className = "step active"; $("step-two").className = "step";
    $("step-caption").textContent = "PASSO 1 DE 2";
    document.querySelectorAll('input[name="plus"]').forEach(el => el.checked = false);
    show("companion-field", false);
    $("companion-name").value = "";
    document.querySelectorAll('.option:has(input[value="yes"])').forEach(node => node.classList.remove("hidden"));
  });
  function choice() { return document.querySelector('input[name="plus"]:checked')?.value || ""; }
  function updateButton() {
    const value = choice();
    show("companion-field", value === "yes");
    $("confirm-button").disabled = loading || !value || (value === "yes" && !validFullName($("companion-name").value));
  }
  document.querySelectorAll('input[name="plus"]').forEach(el => el.addEventListener("change", updateButton));
  $("companion-name").addEventListener("input", updateButton);
  $("confirm-button").addEventListener("click", async () => {
    if (!selected || !typedQuery || !choice() || loading) return;
    loading = true; updateButton(); fail("guest-error", "");
    $("confirm-button").textContent = "Salvando sua confirmação...";
    try {
      const resp = await request("confirm", {
        colaborador_id: selected.id, query: typedQuery, acompanhante: choice() === "yes", acompanhante_nome: $("companion-name").value.trim()
      });
      show("guest-companion", false); show("guest-done", true);
      const link = $("whatsapp-fallback"); link.href = resp.whatsapp_url;
      $("step-two").className = "step complete";
      $("step-caption").textContent = "PRESENÇA REGISTRADA";
      icons();
      window.location.assign(resp.whatsapp_url);
    } catch (err) {
      fail("guest-error", err.message);
      $("confirm-button").innerHTML = 'Confirmar presença <i data-lucide="arrow-up-right"></i>'; icons();
    } finally { loading = false; updateButton(); }
  });
  load(); icons();
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
    const actives = dataset.collaborators.filter(p => p.ativo);
    const confirmations = conMap();
    const confirmed = actives.filter(p => confirmations.has(p.id));
    const plus = confirmed.filter(p => confirmations.get(p.id)?.acompanhante).length;
    const pct = actives.length ? Math.round(100 * confirmed.length / actives.length) : 0;
    $("stat-invited").textContent = actives.length;
    $("stat-confirmed").textContent = confirmed.length;
    $("stat-pending").textContent = actives.length - confirmed.length;
    $("stat-total").textContent = confirmed.length + plus;
    $("stat-plus").textContent = "incluindo " + plus + " acompanhantes";
    $("participation-rate").textContent = pct + "%";
    $("participation-bar").style.width = pct + "%";
    $("participation-text").textContent = confirmed.length + " de " + actives.length + " colaboradores confirmaram presença.";
    const recent = confirmed.map(p => ({ ...p, reply: confirmations.get(p.id) })).sort((a,b) => String(b.reply.confirmado_em).localeCompare(String(a.reply.confirmado_em))).slice(0,5);
    $("recent-list").innerHTML = recent.length ? recent.map(p => '<div class="recent-item"><div><strong>' + escapeHtml(p.nome_completo) + '</strong><small>' + escapeHtml(stamp(p.reply.confirmado_em)) + (p.reply.acompanhante ? " · Com acompanhante" : "") + '</small></div><span class="status-chip confirmed">Confirmado</span></div>').join("") : '<p class="muted">Nenhuma confirmação até o momento.</p>';
    renderPeople(); renderSettings(); icons();
  }
  function renderPeople() {
    if (!dataset) return;
    const term = norm($("people-search").value), filter = $("status-filter").value;
    const confirmationMap = conMap();
    const list = dataset.collaborators.filter(p => {
      if (term && !norm(p.nome_completo).includes(term)) return false;
      const has = confirmationMap.has(p.id);
      return filter === "all" || (filter === "inactive" && !p.ativo) || (filter === "confirmed" && has && p.ativo) || (filter === "pending" && !has && p.ativo);
    });
    $("people-count").textContent = list.length + " resultados";
    $("people-body").innerHTML = list.length ? list.map(p => {
      const c = confirmationMap.get(p.id);
      const badge = !p.ativo ? (norm(p.nome_completo).split(" ").length < 2 ? '<span class="status-chip inactive">Completar sobrenome</span>' : '<span class="status-chip inactive">Inativo</span>') : c ? '<span class="status-chip confirmed">Confirmado</span>' : '<span class="status-chip">Pendente</span>';
      const initials = p.nome_completo.split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase();
      return '<tr><td><div class="name-cell"><span class="initial-badge">' + escapeHtml(initials) + '</span><span class="name-stack"><strong>' + escapeHtml(p.nome_completo) + '</strong><small>' + escapeHtml(p.grupo || "") + '</small></span></div></td><td>' + escapeHtml(c?.acompanhante ? c.acompanhante_nome : "—") + '</td><td>' + badge + '</td><td>' + escapeHtml(stamp(c?.confirmado_em)) + '</td><td><button class="icon-btn edit-person" type="button" data-id="' + escapeHtml(p.id) + '" aria-label="Editar colaborador"><i data-lucide="pencil"></i></button></td></tr>';
    }).join("") : '<tr><td colspan="5" style="padding:26px;text-align:center;color:#97a2b0">Nenhum colaborador encontrado.</td></tr>';
    document.querySelectorAll(".edit-person").forEach(b => b.addEventListener("click", () => openPerson(b.dataset.id)));
    icons();
  }
  $("people-search").addEventListener("input",renderPeople);
  $("status-filter").addEventListener("change",renderPeople);
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
    const person = (dataset?.collaborators || []).find(p=>p.id===id);
    $("modal-title").textContent = person ? "Editar colaborador" : "Novo colaborador";
    $("person-name").value = person?.nome_completo || "";
    $("person-active").checked = person?.ativo !== false;
    show("person-active-wrap",!!person);
    modal("edit-modal",true);
  }
  $("top-add").addEventListener("click",()=>openPerson());
  $("person-form").addEventListener("submit",async e => {
    e.preventDefault();
    const name = $("person-name").value.trim();
    if (!validFullName(name)) { notify("Informe o nome e sobrenome do colaborador.",true); return; }
    const button = e.currentTarget.querySelector('button[type="submit"]');button.disabled = true;
    try {
      await admin(editingId ? "admin-update" : "admin-add", { id:editingId, nome_completo:name, ativo:$("person-active").checked });
      modal("edit-modal",false);await bootstrap(true);notify("Colaborador salvo na lista.");
    } catch(err) { notify(err.message,true); } finally { button.disabled = false; }
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
    const rows=[["Colaborador","Status","Acompanhante","Nome do acompanhante","Data da confirmacao"]];
    dataset.collaborators.forEach(p => {const c=map.get(p.id);rows.push([p.nome_completo,!p.ativo?"Inativo":c?"Confirmado":"Pendente",c?.acompanhante?"Sim":"Nao",c?.acompanhante_nome||"",stamp(c?.confirmado_em)]);});
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
  setInterval(()=>{if(session && !document.hidden && Date.now()-lastLoad>=30000)bootstrap(true);},30000);
  icons();
}
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("admin-page")) initAdmin();
  else initGuest();
});
})();