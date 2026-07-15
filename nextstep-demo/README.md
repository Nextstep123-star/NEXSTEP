# NEXT_STEP — nextstep-demo (Phase 1 MVP)

Gamified TCAS roadmap for Thai students (ม.3–ม.6). Vanilla HTML/CSS/JS SPA + Supabase.

## Run
Supabase needs a real origin (not `file://`) for CORS.

```bash
cd nextstep-demo
node serve.js        # → http://127.0.0.1:5173
```

Open the URL in a browser.

## Flow (7 views)
`create-path → name-path → track → faculty → programs → cooking → roadmap`

- **track** filters programs by `accepts_sci_math` / `accepts_arts` / `accepts_vocational`
- **programs** shows tuition (`NULL → "ไม่ระบุ"`, never 0)
- **cooking** = "Let me cook" loader (≥900ms, `try/catch`, toast on failure)
- **roadmap** = tactile vertical timeline (`program_roadmaps`) + TCAS round pills; tapping a
  round opens a detail panel with **วิชา + น้ำหนัก%** chips parsed from `scores` (sorted desc),
  plus quota / GPAX / คะแนนรวมขั้นต่ำ.
- **heart ❤️** on create-path sets the single "เส้นทางหลัก" (localStorage; Phase 3 → `user_paths`).

## Design system
Follows the **Stitch design** (light `#fbf9f8`, Duolingo-green `#58cc02`/`#2b6c00`,
tactile 3D buttons, Material Symbols) — this overrides the dark/lime direction in `NEXTSTEP_SPEC.md`.

**Fonts** (per `CLAUDECODE_fonts_and_splash.md`): Kanit (display/headings), IBM Plex Sans Thai
(body/UI), IBM Plex Mono (numbers, %, GPAX, subject codes). Set via Tailwind `fontFamily`
tokens + `:root` CSS vars.

**Splash**: on load, a lime `#c2d90f` screen reveals the NEX logo (inline-SVG stand-in —
replace with `assets/nex-mark.png` / `nex-wordmark.png` for pixel-perfect), then fades into
the app. Respects `prefers-reduced-motion`. Controlled by an inline script in `index.html`.

## Files
- `index.html` — shell, Tailwind CDN + design tokens, fonts, CDN scripts
- `css/styles.css` — tactile buttons, pulse, dotted grid, chips, panel, toast
- `js/config.js` — Supabase URL + publishable key, client init
- `js/app.js` — SPA router, all views, queries, detail panel
- `serve.js` — minimal static dev server

## Data (Supabase `gegxhtqvkmarqznplbsw`)
- `programs` (4,919) · `universities` (141) · `faculties` (14) · `program_roadmaps` (19,676)
- `program_admission_rounds` — **a VIEW** over `programs.raw_json` (39,201 rows); `scores` jsonb = `{subject_code: weight%}`

## ⚠️ Phase 0 (security) — not yet applied
RLS is currently **OFF** on all tables (incl. PII `users_profile`/`user_preferences`).
The Phase 0 migration (enable RLS + public-read catalog policies + own-row PII policies +
revoke anon write/TRUNCATE + secure the rounds view) is drafted and **awaiting approval**
before shipping user data. Reads work now because anon has default SELECT grants.

## Next phases
- **P2** node state machine + gamification (User Grade vs Node Grade, checkbox → progress/EXP/badge)
- **P3** ม.5→ม.4→ม.3 quests + data collection → new `user_*` tables (RLS)
- **P4** "% โอกาสสอบติด" (labeled ประมาณการ)
