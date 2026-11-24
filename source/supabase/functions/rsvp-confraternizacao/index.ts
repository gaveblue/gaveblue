import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const URL = Deno.env.get("SUPABASE_URL") || "";
const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const db = createClient(URL, SECRET, { auth: { persistSession: false, autoRefreshToken: false } });
const SLUG = "confraternizacao-2026";
const DEADLINE_ISO = "2026-11-25T23:59:59.999-03:00"; // compatibilidade de registro legado
const deadlineOf = (ev: { prazo_confirmacao?: string | null }) =>
  Date.parse(ev.prazo_confirmacao || DEADLINE_ISO);
const deadlineExpired = (ev: { prazo_confirmacao?: string | null }) =>
  Date.now() > deadlineOf(ev);
type RsvpState = "nao_iniciadas" | "aberto" | "encerrado_manual" | "prazo_expirado";
const stateOf = (ev: { status: string; prazo_confirmacao?: string | null }): RsvpState => {
  if (ev.status === "rascunho") return "nao_iniciadas";
  if (ev.status === "encerrado") return "encerrado_manual";
  return deadlineExpired(ev) ? "prazo_expirado" : "aberto";
};
const stateError = (state: RsvpState) => state === "nao_iniciadas"
  ? "As confirmações ainda não foram abertas."
  : state === "encerrado_manual"
    ? "As confirmações foram encerradas pela organização."
    : state === "prazo_expirado"
      ? "O prazo para confirmação de presença já terminou."
      : "";
const allowed = new Set(["https://gaveblue.com.br", "https://www.gaveblue.com.br"]);
const json = (data: unknown, status = 200, origin = "") => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": allowed.has(origin) ? origin : "https://gaveblue.com.br",
    "Vary": "Origin", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS" }
});
const clean = (value: unknown, max = 150) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const norm = (v: unknown) => clean(v, 160).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z\s'-]/g, "").replace(/\s+/g, " ").trim();
const matchesSearch = (full: string, query: string) => {
  const words = norm(full).split(" ").filter(Boolean);
  const terms = norm(query).split(" ").filter(Boolean);
  if (words.length < 2 || terms.length < 2 || terms[0].length < 2 || terms[terms.length - 1].length < 3) return false;
  if (!words[0].startsWith(terms[0])) return false;
  const surname = terms.slice(1).join(" ");
  return words.slice(1).some((_, index) => words.slice(index + 1).join(" ").startsWith(surname));
};
const validName = (v: string) => v.length >= 5 && v.length <= 150 && v.split(" ").filter(Boolean).length >= 2 && /^[\p{L}\s'.-]+$/u.test(v);
const errorText = (e: unknown) => e instanceof Error ? e.message : "Não foi possível concluir a solicitação.";
function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
async function event() {
  const { data, error } = await db.from("rsvp_eventos").select("*").eq("slug", SLUG).single();
  if (error || !data) throw new Error("Evento ainda não configurado.");
  return data;
}

const enc = new TextEncoder();
const hex = (data: Uint8Array) => Array.from(data).map(v => v.toString(16).padStart(2, "0")).join("");
const unhex = (value: string) => new Uint8Array((value.match(/.{2}/g) || []).map(v => parseInt(v, 16)));
async function sha256(value: string) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(value))));
}
async function isAdmin(req: Request) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  assert(/^[a-f0-9]{64}$/i.test(token), "Entre com o código de acesso do evento.");
  const digest = await sha256(token);
  const { data, error } = await db.from("rsvp_admin_sessions")
    .select("token_sha256").eq("token_sha256", digest)
    .gt("expires_at", new Date().toISOString()).maybeSingle();
  assert(!error && data, "Acesso expirado. Entre novamente.");
  return digest;
}
async function loginCode(raw: unknown) {
  const value = clean(raw, 80).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  assert(value.length >= 16 && value.length <= 40, "Código de acesso inválido.");
  const { data: credentials, error } = await db.from("rsvp_admin_access")
    .select("salt_hex,verifier_hex,iterations").eq("id", 1).single();
  assert(!error && credentials, "Acesso administrativo não configurado.");
  const imported = await crypto.subtle.importKey("raw",enc.encode(value),"PBKDF2",false,["deriveBits"]);
  const derived = new Uint8Array(await crypto.subtle.deriveBits({
    name:"PBKDF2",hash:"SHA-256",salt:unhex(credentials.salt_hex),iterations:credentials.iterations
  }, imported,256));
  const expected=unhex(credentials.verifier_hex);
  let difference=derived.length ^ expected.length;
  for(let i=0;i<derived.length;i++) difference |= derived[i] ^ (expected[i] || 0);
  assert(difference === 0, "Código de acesso incorreto.");
  const token=hex(crypto.getRandomValues(new Uint8Array(32)));
  const token_sha256=await sha256(token);
  const { error:insertError }=await db.from("rsvp_admin_sessions").insert({
    token_sha256, expires_at:new Date(Date.now()+8*3600*1000).toISOString()
  });
  assert(!insertError, "Não foi possível iniciar o acesso.");
  return token;
}

async function ipHash(req: Request) {
  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "desconhecido").trim();
  const bytes = new TextEncoder().encode(ip + "|" + SLUG);
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)))
    .map(v=>v.toString(16).padStart(2,"0")).join("");
}
async function rate(req: Request, action: string, max: number) {
  const hash=await ipHash(req);
  const { data, error } = await db.rpc("rsvp_limit_request", { p_action: action, p_ip_hash: hash, p_max: max, p_seconds: 600 });
  assert(!error && data === true, "Muitas tentativas. Tente novamente mais tarde.");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  if (req.method === "OPTIONS") return json({ ok: true }, 200, origin);
  if (req.method !== "POST") return json({ ok: false, error: "Método não permitido." }, 405, origin);
  if (origin && !allowed.has(origin)) return json({ ok: false, error: "Origem não autorizada." }, 403, origin);
  try {
    const raw = await req.text();
    assert(raw.length <= 150000, "Requisição muito grande.");
    const body = JSON.parse(raw || "{}");
    const action = clean(body.action, 40);
    if (action === "search") {
      const current = await event();
      const currentState = stateOf(current);
      assert(currentState === "aberto", stateError(currentState));
      const key = norm(body.query);
      const terms=key.split(" ").filter(Boolean);
      if (terms.length<2 || terms[0].length<2 || terms[terms.length-1].length<3) {
        return json({ok:true,results:[]},200,origin);
      }
      const {data,error}=await db.rpc("rsvp_busca_rapida",{
        p_slug:SLUG,p_busca:key,p_ip_hash:await ipHash(req)
      });
      assert(!error, error?.message?.includes("Muitas tentativas") ? "Muitas tentativas. Tente novamente mais tarde." : error?.message?.includes("ainda não estão abertas") ? "As confirmações ainda não estão abertas." : "Não foi possível buscar colaboradores.");
      return json({ok:true,results:data||[]},200,origin);
    }
    const ev = await event();
    if (action === "event") {
      const state = stateOf(ev);
      return json({ ok: true, event: {
        titulo: ev.titulo, descricao: ev.descricao, data_evento: ev.data_evento,
        horario: ev.horario, local_evento: ev.local_evento,
        status: state === "aberto" ? "aberto" : state === "nao_iniciadas" ? "rascunho" : "encerrado",
        estado_confirmacoes: state,
        prazo_confirmacao: ev.prazo_confirmacao || DEADLINE_ISO,
        mensagem_encerramento: ev.mensagem_encerramento || "",
        permite_acompanhante: ev.permite_acompanhante
      } }, 200, origin);
    }
    if (action === "confirm") {
      await rate(req, "confirm", 15);
      const state = stateOf(ev);
      assert(state === "aberto", stateError(state));
      assert(ev.whatsapp, "WhatsApp da organização não configurado.");
      const id = clean(body.colaborador_id, 48);
      const key = norm(body.query);
      const terms = key.split(" ");
      assert(/^[0-9a-f-]{36}$/i.test(id) && terms.length >= 2 && terms[0].length >= 2 && terms[terms.length - 1].length >= 3, "Identificação incompleta.");
      const { data: employee } = await db.from("rsvp_colaboradores").select("id,nome_completo,nome_chave").eq("id", id).eq("evento_id", ev.id).eq("ativo", true).maybeSingle();
      assert(employee && matchesSearch(employee.nome_completo, key), "Colaborador não encontrado. Faça a busca novamente.");
      const companion = body.acompanhante === true;
      assert(!companion || ev.permite_acompanhante, "Acompanhante não permitido neste evento.");
      const companionName = companion ? clean(body.acompanhante_nome) : null;
      assert(!companion || validName(companionName || ""), "Informe o nome completo do acompanhante.");
      assert(stateOf(ev) === "aberto", "O prazo de confirmação terminou. Atualize o convite.");
      const { error } = await db.from("rsvp_confirmacoes").upsert({
        evento_id: ev.id, colaborador_id: employee.id, acompanhante: companion,
        acompanhante_nome: companionName, origem: "link", confirmado_em: new Date().toISOString()
      }, { onConflict: "evento_id,colaborador_id" });
      assert(!error, "Não foi possível salvar a confirmação.");
      const message = "Olá! Confirmo minha presença na " + ev.titulo + ".\n\nColaborador: " + employee.nome_completo +
        "\nAcompanhante: " + (companion ? companionName : "Não levarei acompanhante") +
        "\nQuantidade de pessoas: " + (companion ? "2" : "1") + ".";
      return json({ ok: true, colaborador: employee.nome_completo, whatsapp_url: "https://wa.me/" + ev.whatsapp + "?text=" + encodeURIComponent(message) }, 200, origin);
    }
    if (action === "admin-login") {
      await rate(req, "admin-login", 6);
      const token = await loginCode(body.access_code);
      return json({ ok: true, access_token: token, expires_in: 28800 }, 200, origin);
    }
    if (!action.startsWith("admin-")) return json({ ok: false, error: "Ação inválida." }, 400, origin);
    const adminTokenDigest = await isAdmin(req);
    if (action === "admin-logout") {
      await db.from("rsvp_admin_sessions").delete().eq("token_sha256",adminTokenDigest);
      return json({ ok:true },200,origin);
    }
    if (action === "admin-bootstrap") {
      const [employees, confirmations] = await Promise.all([
        db.from("rsvp_colaboradores").select("id,nome_completo,grupo,setor,ativo,criado_em").eq("evento_id", ev.id).order("nome_completo"),
        db.from("rsvp_confirmacoes").select("colaborador_id,acompanhante,acompanhante_nome,confirmado_em,origem").eq("evento_id", ev.id)
      ]);
      assert(!employees.error && !confirmations.error, "Falha ao carregar os dados.");
      return json({ ok: true, event: { ...ev, estado_confirmacoes: stateOf(ev) }, collaborators: employees.data || [], confirmations: confirmations.data || [] }, 200, origin);
    }
    if (action === "admin-save-event") {
      const title = clean(body.titulo, 100);
      const description = clean(body.descricao, 500);
      const place = clean(body.local_evento, 180);
      const wa = clean(body.whatsapp, 20).replace(/\D/g, "");
      const date = clean(body.data_evento, 10);
      const status = clean(body.status, 20);
      const deadline = body.prazo_confirmacao === undefined
        ? (ev.prazo_confirmacao || DEADLINE_ISO) : clean(body.prazo_confirmacao, 48);
      const customMessage = body.mensagem_encerramento === undefined
        ? String(ev.mensagem_encerramento || "") : clean(body.mensagem_encerramento, 320);
      assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:(?:\d{2})(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(deadline)
        && Number.isFinite(Date.parse(deadline)), "Informe uma data e hora válidas para o prazo.");
      assert(status !== "aberto" || Date.parse(deadline) > Date.now(),
        "Para abrir ou reabrir, configure uma data limite futura.");
      assert(title.length >= 3, "Informe o nome do evento.");
      assert(["rascunho","aberto","encerrado"].includes(status), "Status inválido.");
      assert(!wa || /^\d{10,15}$/.test(wa), "Número de WhatsApp inválido. Informe DDI + DDD + número.");
      assert(status !== "aberto" || /^\d{10,15}$/.test(wa), "Cadastre o WhatsApp antes de abrir o evento.");
      assert(!date || /^\d{4}-\d{2}-\d{2}$/.test(date), "Data inválida.");
      const { error } = await db.from("rsvp_eventos").update({
        titulo: title, descricao: description, local_evento: place || null, whatsapp: wa || null,
        data_evento: date || null, horario: clean(body.horario, 30) || null,
        status, prazo_confirmacao: new Date(deadline).toISOString(),
        mensagem_encerramento: customMessage,
        permite_acompanhante: body.permite_acompanhante !== false, atualizado_em: new Date().toISOString()
      }).eq("id", ev.id);
      assert(!error, "Não foi possível salvar o evento.");
      return json({ ok: true }, 200, origin);
    }
    if (action === "admin-add" || action === "admin-update") {
      const id = action === "admin-update" ? clean(body.id, 48) : null;
      const name = clean(body.nome_completo);
      const sector = clean(body.setor, 90);
      const validFull = validName(name);
      assert(name.length >= 2 && name.length <= 150 && /^[\p{L}\s'.-]+$/u.test(name), "Nome inválido.");
      assert(action !== "admin-add" || validFull, "Informe nome e sobrenome do novo colaborador.");
      assert(id === null || /^[0-9a-f-]{36}$/i.test(id), "Registro inválido.");
      assert(sector.length <= 90, "Setor muito longo.");
      const active = body.ativo !== false;
      assert(!active || validFull, "Complete o sobrenome antes de ativar o colaborador na busca.");
      assert(typeof body.confirmado === "boolean", "Informe o status da confirmação.");
      const { data, error } = await db.rpc("rsvp_admin_save_person", {
        p_evento: ev.id, p_id: id, p_nome: name, p_nome_chave: norm(name),
        p_setor: sector, p_ativo: active, p_confirmado: body.confirmado
      });
      assert(!error && data, error?.code === "23505" ? "Este colaborador já está na lista." : "Falha ao salvar o cadastro e a confirmação.");
      return json({ ok: true, colaborador_id: data }, 200, origin);
    }

    if (action === "admin-import") {
      const names = Array.isArray(body.names) ? body.names : [];
      assert(names.length > 0 && names.length <= 500, "A lista deve conter de 1 a 500 nomes.");
      const unique = new Map<string, string>();
      for (const item of names) {
        const name = clean(item);
        assert(validName(name), "Há um nome inválido na lista: " + name.slice(0, 50));
        unique.set(norm(name), name);
      }
      const rows = [...unique.entries()].map(([key, name]) => ({ evento_id: ev.id, nome_chave: key, nome_completo: name }));
      const { error } = await db.from("rsvp_colaboradores").upsert(rows, { onConflict: "evento_id,nome_chave", ignoreDuplicates: true });
      assert(!error, "Falha ao importar a lista.");
      return json({ ok: true, processed: rows.length }, 200, origin);
    }
    return json({ ok: false, error: "Ação não reconhecida." }, 400, origin);
  } catch (e) {
    const message = errorText(e);
    const status = /Muitas tentativas/.test(message) ? 429 : /Código de acesso|Acesso expirado|Entre com o código/.test(message) ? 401 : /não configurado/.test(message) ? 503 : 400;
    return json({ ok: false, error: message }, status, origin);
  }
});
