/*
 * Proxy Claude untuk Asisten Laporan Akademik (Cloudflare Worker).
 * Kunci API hanya ada di sini, tidak pernah dikirim ke browser.
 *
 * Pengaturan di Cloudflare (Settings > Variables and Secrets):
 *   ANTHROPIC_API_KEY  (Secret)  kunci dari console.anthropic.com
 *   ALLOWED_ORIGIN     (Text)    mis. https://USERNAME.github.io  (tanpa path; pisahkan koma bila lebih dari satu)
 */
const MODELS = new Set(["claude-haiku-5-5", "claude-sonnet-5-5"]);
const MAX_BYTES = 5 * 1024 * 1024; // cukup untuk satu gambar halaman scan
const MAX_TOKENS = 8000;
const LIMIT = 30, WINDOW_MS = 60000; // 30 permintaan per menit per IP (per instance Worker, bersifat perkiraan)
const hits = new Map();

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
    const ok = allowed.includes(origin);
    const H = {
      "Access-Control-Allow-Origin": ok ? origin : "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
      "Vary": "Origin",
    };
    const json = (code, obj) => new Response(JSON.stringify(obj), { status: code, headers: { ...H, "content-type": "application/json" } });

    if (req.method === "OPTIONS") return new Response(null, { status: ok ? 204 : 403, headers: H });
    if (req.method !== "POST") return json(405, { error: "Method tidak diizinkan" });
    if (!ok) return json(403, { error: "Origin tidak diizinkan" });
    if (!env.ANTHROPIC_API_KEY) return json(500, { error: "ANTHROPIC_API_KEY belum diatur di Worker" });

    const ip = req.headers.get("CF-Connecting-IP") || "x", now = Date.now();
    const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
    if (recent.length >= LIMIT) return json(429, { error: "Terlalu banyak permintaan, coba lagi sebentar" });
    recent.push(now); hits.set(ip, recent);
    if (hits.size > 5000) hits.clear();

    const txt = await req.text();
    if (txt.length > MAX_BYTES) return json(413, { error: "Permintaan terlalu besar" });
    let b; try { b = JSON.parse(txt); } catch { return json(400, { error: "JSON tidak valid" }); }
    if (!MODELS.has(b.model) || !Array.isArray(b.messages) || !b.messages.length) return json(400, { error: "Model atau pesan tidak valid" });

    const body = { model: b.model, max_tokens: Math.min(+b.max_tokens || 4096, MAX_TOKENS), messages: b.messages.slice(0, 1) };
    if (typeof b.system === "string") body.system = b.system.slice(0, 4000);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body),
    });
    return new Response(await r.text(), { status: r.status, headers: { ...H, "content-type": "application/json" } });
  },
};
