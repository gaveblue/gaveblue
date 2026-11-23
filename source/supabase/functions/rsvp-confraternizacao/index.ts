import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const URL = Deno.env.get("SUPABASE_URL") || "";
const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const db = createClient(URL, SECRET, { auth: { persistSession: false, autoRefreshToken: false } });
const SLUG = "confraternizacao-2026";
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
const validName = (v: string) => v.length >= 5 && v.length <= 150 && v.split(" ").filter(Boolean).length >= 2 && /^[\p{L}\s'-]+$/u.test(v);
const errorText = (e: unknown) => e instanceof Error ? e.message : "Não foi possível concluir a solicitação.";
function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
async function event() {
  const { data, error } = await db.from("rsvp_eventos").select("*").eq("slug", SLUG).single();
  if (error || !data) throw new Error("Evento ainda não configurado.");
  return data;
}
async function isAdmin(req: Request) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  assert(token.split(".").length === 3, "Faça login como administrador.");
  const { data: auth, error: authError } = await db.auth.getUser(token);
  assert(!authError && auth?.user?.id, "Sessão expirada. Entre novamente.");
  const { data, error } = await db.from("platform_admins").select("user_id").eq("user_id", auth.user.id).eq("active", true).maybeSingle();
  assert(!error && data, "Este usuário não possui permissão administrativa.");
  return auth.user;
}
async function rate(req: Request, action: string, max: number) {
  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "desconhecido").trim();
  const bytes = new TextEncoder().encode(ip + "|" + SLUG);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map(v => v.toString(16).padStart(2,"0")).join("");
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
    const ev = await event();
    if (action === "event") {
      return json({ ok: true, event: { titulo: ev.titulo, descricao: ev.descricao, data_evento: ev.data_evento, horario: ev.horario, local_evento: ev.local_evento, status: ev.status, permite_acompanhante: ev.permite_acompanhante } }, 200, origin);
    }
    if (action === "search") {
      await rate(req, "search", 30);
      assert(ev.status === "aberto", "As confirmações ainda não estão abertas.");
      const key = norm(body.query);
      const terms = key.split(" ");
      if (terms.length < 2 || terms[0].length < 2 || terms[terms.length - 1].length < 3) return json({ ok: true, results: [] }, 200, origin);
      const { data, error } = await db.from("rsvp_colaboradores").select("id,nome_completo").eq("evento_id", ev.id).eq("ativo", true).like("nome_chave", key + "%").order("nome_completo").limit(8);
      assert(!error, "Falha na busca.");
      return json({ ok: true, results: data || [] }, 200, origin);
    }
    if (action === "confirm") {
      await rate(req, "confirm", 15);
      assert(ev.status === "aberto" && ev.whatsapp, "As confirmações ainda não estão abertas.");
      const id = clean(body.colaborador_id, 48);
      const key = norm(body.query);
      const terms = key.split(" ");
      assert(/^[0-9a-f-]{36}$/i.test(id) && terms.length >= 2 && terms[0].length >= 2 && terms[terms.length - 1].length >= 3, "Identificação incompleta.");
      const { data: employee } = await db.from("rsvp_colaboradores").select("id,nome_completo,nome_chave").eq("id", id).eq("evento_id", ev.id).eq("ativo", true).maybeSingle();
      assert(employee && employee.nome_chave.startsWith(key), "Colaborador não encontrado. Faça a busca novamente.");
      const companion = body.acompanhante === true;
      assert(!companion || ev.permite_acompanhante, "Acompanhante não permitido neste evento.");
      const companionName = companion ? clean(body.acompanhante_nome) : null;
      assert(!companion || validName(companionName || ""), "Informe o nome completo do acompanhante.");
      const { error } = await db.from("rsvp_confirmacoes").upsert({
        evento_id: ev.id, colaborador_id: employee.id, acompanhante: companion,
        acompanhante_nome: companionName, confirmado_em: new Date().toISOString()
      }, { onConflict: "evento_id,colaborador_id" });
      assert(!error, "Não foi possível salvar a confirmação.");
      const message = "Olá! Confirmo minha presença na " + ev.titulo + ".\n\nColaborador: " + employee.nome_completo +
        "\nAcompanhante: " + (companion ? companionName : "Não levarei acompanhante") +
        "\nQuantidade de pessoas: " + (companion ? "2" : "1") + ".";
      return json({ ok: true, colaborador: employee.nome_completo, whatsapp_url: "https://wa.me/" + ev.whatsapp + "?text=" + encodeURIComponent(message) }, 200, origin);
    }
    if (!action.startsWith("admin-")) return json({ ok: false, error: "Ação inválida." }, 400, origin);
    await isAdmin(req);
    if (action === "admin-bootstrap") {
      const [employees, confirmations] = await Promise.all([
        db.from("rsvp_colaboradores").select("id,nome_completo,ativo,criado_em").eq("evento_id", ev.id).order("nome_completo"),
        db.from("rsvp_confirmacoes").select("colaborador_id,acompanhante,acompanhante_nome,confirmado_em").eq("evento_id", ev.id)
      ]);
      assert(!employees.error && !confirmations.error, "Falha ao carregar os dados.");
      return json({ ok: true, event: ev, collaborators: employees.data || [], confirmations: confirmations.data || [] }, 200, origin);
    }
    if (action === "admin-save-event") {
      const title = clean(body.titulo, 100);
      const description = clean(body.descricao, 500);
      const place = clean(body.local_evento, 180);
      const wa = clean(body.whatsapp, 20).replace(/\D/g, "");
      const date = clean(body.data_evento, 10);
      const status = clean(body.status, 20);
      assert(title.length >= 3, "Informe o nome do evento.");
      assert(["rascunho","aberto","encerrado"].includes(status), "Status inválido.");
      assert(!wa || /^\d{10,15}$/.test(wa), "Número de WhatsApp inválido. Informe DDI + DDD + número.");
      assert(status !== "aberto" || /^\d{10,15}$/.test(wa), "Cadastre o WhatsApp antes de abrir o evento.");
      assert(!date || /^\d{4}-\d{2}-\d{2}$/.test(date), "Data inválida.");
      const { error } = await db.from("rsvp_eventos").update({
        titulo: title, descricao: description, local_evento: place || null, whatsapp: wa || null,
        data_evento: date || null, horario: clean(body.horario, 30) || null,
        status, permite_acompanhante: body.permite_acompanhante !== false, atualizado_em: new Date().toISOString()
      }).eq("id", ev.id);
      assert(!error, "Não foi possível salvar o evento.");
      return json({ ok: true }, 200, origin);
    }
    if (action === "admin-add" || action === "admin-update") {
      const name = clean(body.nome_completo);
      assert(validName(name), "Informe nome e sobrenome válidos.");
      const values = { nome_completo: name, nome_chave: norm(name) };
      if (action === "admin-add") {
        const { error } = await db.from("rsvp_colaboradores").insert({ evento_id: ev.id, ...values });
        assert(!error, error?.code === "23505" ? "Este nome já existe na lista." : "Não foi possível cadastrar.");
      } else {
        const id = clean(body.id, 48);
        assert(/^[0-9a-f-]{36}$/i.test(id), "Registro inválido.");
        const { error } = await db.from("rsvp_colaboradores").update({ ...values, ativo: body.ativo !== false }).eq("id", id).eq("evento_id", ev.id);
        assert(!error, error?.code === "23505" ? "Já existe outro colaborador com este nome." : "Não foi possível atualizar.");
      }
      return json({ ok: true }, 200, origin);
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
    const status = /Muitas tentativas/.test(message) ? 429 : /Faça login|Sessão expirada|permissão administrativa/.test(message) ? 401 : /não configurado/.test(message) ? 503 : 400;
    return json({ ok: false, error: message }, status, origin);
  }
});
