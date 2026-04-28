// One-off migration: download all external image_urls and rehost to the 'places' bucket.
// Auth: caller must be an admin (verified via has_role).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

interface Row {
  tbl: "tourist_spots" | "accommodations" | "cafes" | "gallery";
  id: string;
  image_url: string;
}

const BUCKET = "places";
const PUBLIC_BASE = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

function extFromUrlOrType(url: string, contentType: string | null): string {
  if (contentType) {
    if (contentType.includes("jpeg")) return "jpg";
    if (contentType.includes("png")) return "png";
    if (contentType.includes("webp")) return "webp";
    if (contentType.includes("gif")) return "gif";
    if (contentType.includes("avif")) return "avif";
  }
  const clean = url.split("?")[0].toLowerCase();
  const m = clean.match(/\.(jpg|jpeg|png|webp|gif|avif)$/);
  if (m) return m[1] === "jpeg" ? "jpg" : m[1];
  return "jpg";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // --- Auth: require admin ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing auth" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid user" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: isAdmin } = await userClient.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Admin required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Service client (bypasses RLS) ---
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Gather rows
  const tables: Row["tbl"][] = ["tourist_spots", "accommodations", "cafes", "gallery"];
  const rows: Row[] = [];
  for (const tbl of tables) {
    const { data, error } = await admin
      .from(tbl)
      .select("id, image_url")
      .not("image_url", "is", null);
    if (error) {
      return new Response(JSON.stringify({ error: `Fetch ${tbl}: ${error.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const r of data ?? []) {
      if (r.image_url && !r.image_url.startsWith(PUBLIC_BASE) && r.image_url.startsWith("http")) {
        rows.push({ tbl, id: r.id, image_url: r.image_url });
      }
    }
  }

  const results: Array<{ tbl: string; id: string; status: string; new_url?: string; error?: string }> = [];

  for (const row of rows) {
    try {
      const resp = await fetch(row.image_url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LovableImageMigrator/1.0)" },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const contentType = resp.headers.get("content-type");
      const buf = new Uint8Array(await resp.arrayBuffer());
      const ext = extFromUrlOrType(row.image_url, contentType);
      const path = `${row.tbl}/${row.id}.${ext}`;

      const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buf, {
        contentType: contentType ?? `image/${ext}`,
        upsert: true,
      });
      if (upErr) throw upErr;

      const newUrl = `${PUBLIC_BASE}${path}`;
      const { error: updErr } = await admin
        .from(row.tbl)
        .update({ image_url: newUrl })
        .eq("id", row.id);
      if (updErr) throw updErr;

      results.push({ tbl: row.tbl, id: row.id, status: "ok", new_url: newUrl });
    } catch (e) {
      results.push({
        tbl: row.tbl,
        id: row.id,
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const okCount = results.filter((r) => r.status === "ok").length;
  return new Response(
    JSON.stringify({
      total: rows.length,
      migrated: okCount,
      failed: rows.length - okCount,
      results,
    }, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
