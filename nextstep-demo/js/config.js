// ============================================================
// NEXT_STEP — Supabase config
// Public anon/publishable key only. RLS protects PII (Phase 0).
// ============================================================
const NEXTSTEP_CONFIG = {
  SUPABASE_URL: "https://gegxhtqvkmarqznplbsw.supabase.co",
  // Publishable key (recommended for new apps; safe for client-side).
  SUPABASE_KEY: "sb_publishable_31_cR6U0ZguiiRH5i8FbwQ_VuakoFF0",
};

// Requires @supabase/supabase-js v2 loaded from CDN (see index.html).
const db = window.supabase.createClient(
  NEXTSTEP_CONFIG.SUPABASE_URL,
  NEXTSTEP_CONFIG.SUPABASE_KEY
);
