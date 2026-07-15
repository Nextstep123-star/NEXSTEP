// ============================================================
// NEXT_STEP — Supabase config
// Public anon/publishable key only. RLS protects PII (Phase 0).
// ============================================================
const NEXTSTEP_CONFIG = {
  SUPABASE_URL: "https://cbsteufryuiwcqbgcfle.supabase.co",
  SUPABASE_KEY: "sb_publishable_Dh14LmruvdZCM2ConlPOVQ_G4aSxc8P",
};

// Requires @supabase/supabase-js v2 loaded from CDN (see index.html).
const db = window.supabase.createClient(
  NEXTSTEP_CONFIG.SUPABASE_URL,
  NEXTSTEP_CONFIG.SUPABASE_KEY
);
