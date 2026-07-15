/* ============================================================
   NEXT_STEP — custom styles (complements Tailwind CDN config)
   Design system: light + Duolingo-green, tactile 3D buttons.
   ============================================================ */

:root {
  /* Fonts (spec: Kanit display · IBM Plex Sans Thai body · IBM Plex Mono numbers) */
  --font-display: "Kanit", sans-serif;
  --font-body: "IBM Plex Sans Thai", "IBM Plex Sans", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;

  --primary: #c2d90f;         /* brand lime (accent text) */
  --primary-container: #c2d90f;
  --primary-shadow: #dcee5a;  /* bright lime (weight text) */
  --surface: #16180f;         /* dark base */
  --surface-variant: #3a3f34;
  --on-surface-variant: #9aa090;
  --on-surface: #eef0e6;
  --surface-container-low: #1f2119;
  --secondary-fixed: #f1e800;
  --gem: #2196f3;
  --streak: #ff9800;
}

* { -webkit-tap-highlight-color: transparent; }

html { background: var(--surface); } /* avoid white flash before Tailwind paints */
body { font-family: var(--font-body); background: var(--surface); color: var(--on-surface); }
/* numbers, scores, subject codes → mono (spec §1) */
.num, .mono, code, .score { font-family: var(--font-mono); }

/* Tactile 3D button — press sinks it toward its shadow */
.tactile-button { border-bottom-width: 4px; transition: all 0.1s ease-in-out; }
.tactile-button:active { transform: translateY(2px); border-bottom-width: 2px; margin-bottom: 2px; }

/* Pulsing ring for the "current" roadmap node */
.pulse-animation { animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(194, 217, 15, 0.7); }
  70%  { box-shadow: 0 0 0 12px rgba(194, 217, 15, 0); }
  100% { box-shadow: 0 0 0 0 rgba(194, 217, 15, 0); }
}

/* Dotted-grid backdrop (subtle, spec §2) */
.dotted-grid {
  background-image: radial-gradient(rgba(154, 160, 144, 0.10) 1px, transparent 1px);
  background-size: 22px 22px;
}

/* SPA view transitions */
.view { display: none; animation: fade-in 0.28s ease both; }
.view.active { display: block; }
@keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* "Let me cook" spinner */
.cook-spinner {
  width: 64px; height: 64px; border-radius: 9999px;
  border: 6px solid var(--surface-variant);
  border-top-color: var(--primary-container);
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Subject-weight chips in the round detail panel */
.chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 9999px;
  font-family: var(--font-mono); font-weight: 500; font-size: 13px;
  background: rgba(194, 217, 15, 0.14); color: var(--primary); border: 1.5px solid rgba(194, 217, 15, 0.32);
}
.chip .w { color: var(--primary-shadow); }

/* Detail panel slide-over */
.detail-panel { transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1); }
.detail-panel.hidden-panel { transform: translateY(110%); }

/* Locked (future-grade) node dimming — Phase 2 hook, harmless now */
.node-locked { opacity: 0.5; }

/* Toast */
#toast {
  position: fixed; left: 50%; bottom: 96px; transform: translateX(-50%) translateY(20px);
  background: #232621; color: #fff; padding: 12px 18px; border-radius: 12px;
  font-weight: 600; opacity: 0; pointer-events: none; transition: all 0.25s ease; z-index: 100;
  max-width: 90vw; text-align: center;
}
#toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

/* Hide scrollbars on horizontal chip rows */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* ============================================================
   Dashboard layout (sidebar + main)
   ============================================================ */

/* full-page grid */
.db-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}
@media (max-width: 767px) {
  .db-layout { grid-template-columns: 1fr; }
  .db-sidebar { display: none; }
}

.db-sidebar { width: 220px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }

/* main scroll area */
.db-main { min-height: 100vh; background: var(--surface); }

/* card base */
.db-card {
  background: var(--surface-container-low, #1f2119);
  border: 1px solid var(--surface-variant);
  border-radius: 16px;
}

/* sidebar nav item */
.dash-nav-item { color: var(--on-surface-variant); }
.dash-nav-item:hover { background: var(--surface-container); color: var(--on-surface); }
.dash-nav-item.active { background: rgba(194,217,15,.1); color: var(--primary); border: 1px solid rgba(194,217,15,.2); }

/* badge */
.db-badge {
  display: inline-flex; align-items: center;
  padding: 4px 10px; border-radius: 9999px;
  border: 1px solid var(--surface-variant);
  font-size: 12px; font-weight: 600;
  color: var(--on-surface-variant);
  white-space: nowrap;
}

/* ============================================================
   Onboarding / Auth (spec: CLAUDECODE_auth_onboarding.md)
   ============================================================ */

/* คำถาม */
.ob-q {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(20px, 5vw, 26px);
  line-height: 1.3;
  color: var(--on-surface);
  margin-bottom: 20px;
}

/* label */
.ob-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--on-surface-variant);
  margin-bottom: 6px;
}

/* ── Input fields — global fix for dark mode + browser autofill ── */
input, select, textarea {
  color: var(--on-surface);
  background-color: transparent;
  -webkit-text-fill-color: var(--on-surface); /* prevents browser from overriding in dark */
}
/* kill Chrome autofill yellow flash */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 40px var(--surface-container-low, #1f2119) inset !important;
  -webkit-text-fill-color: var(--on-surface) !important;
  caret-color: var(--on-surface);
}

/* ob-input — redesigned: bigger, clearer, lime focus ring */
.ob-input {
  width: 100%;
  background: #1f2119;
  border: 1.5px solid #3a3f34;
  border-radius: 16px;
  padding: 16px 18px;
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 500;
  color: #eef0e6;
  -webkit-text-fill-color: #eef0e6;
  caret-color: #c2d90f;
  outline: none;
  transition: border-color .18s, box-shadow .18s, background .18s;
  box-shadow: 0 1px 3px rgba(0,0,0,.3) inset;
  -webkit-appearance: none;
  appearance: none;
}
.ob-input::placeholder {
  color: #6b7a08;
  -webkit-text-fill-color: #6b7a08;
  opacity: 1;
}
/* override @tailwindcss/forms blue focus ring → lime (needs !important) */
.ob-input:focus,
input.ob-input:focus,
select.ob-input:focus {
  border-color: #c2d90f !important;
  box-shadow: 0 0 0 3px rgba(194,217,15,.22), 0 1px 3px rgba(0,0,0,.3) inset !important;
  outline: none !important;
  --tw-ring-color: transparent !important;
  background: #23261c;
}
.ob-input:not(:placeholder-shown) {
  border-color: #5a6540;
}
select.ob-input option { background: #1f2119; color: #eef0e6; }

/* choice buttons (grade, track) */
.ob-choice {
  width: 100%;
  min-height: 56px;
  padding: 14px 18px;
  border-radius: 14px;
  border: 2px solid var(--surface-variant);
  background: var(--surface-container-low, #1f2119);
  color: var(--on-surface);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
  text-align: center;
  cursor: pointer;
  transition: border-color .15s, background .15s, transform .15s;
  animation: ob-stagger-in .35s cubic-bezier(.32,.78,.2,1) both;
}
.ob-choice:hover { transform: translateY(-2px); border-color: var(--primary); }
.ob-choice.selected {
  background: var(--primary);
  border-color: var(--primary);
  color: #16180f;
}
@keyframes ob-stagger-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .ob-choice { animation: none; } }

/* interest chips */
.ob-chip {
  padding: 8px 14px;
  border-radius: 9999px;
  border: 2px solid var(--surface-variant);
  background: var(--surface-container-low, #1f2119);
  color: var(--on-surface);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: border-color .15s, background .15s;
  animation: ob-stagger-in .35s cubic-bezier(.32,.78,.2,1) both;
}
.ob-chip.selected {
  background: var(--primary);
  border-color: var(--primary);
  color: #16180f;
}
@media (prefers-reduced-motion: reduce) { .ob-chip { animation: none; } }

/* primary CTA button */
.ob-btn-primary {
  width: 100%;
  min-height: 54px;
  border-radius: 14px;
  background: var(--primary);
  color: #16180f;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 4px solid #6b7a08;
  transition: all .1s ease;
}
.ob-btn-primary:active { transform: translateY(2px); border-bottom-width: 2px; }
.ob-btn-primary:disabled { opacity: .6; pointer-events: none; }

/* inline spinner */
.ob-spinner {
  width: 18px; height: 18px;
  border-radius: 50%;
  border: 3px solid rgba(22,24,15,.3);
  border-top-color: #16180f;
  animation: spin .8s linear infinite;
}

/* ============================================================
   Splash screen + reveal (spec: fonts_and_splash §2)
   ============================================================ */
.splash {
  position: fixed; inset: 0; z-index: 9999;
  background: #c2d90f;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px;
  transition: opacity 0.5s ease;
}
.splash.done { opacity: 0; pointer-events: none; }
.splash-logo { display: flex; align-items: center; justify-content: center; animation: settle 0.7s ease 0.3s both; }
/* full combined logo (mark + NEX wordmark in one SVG viewBox) */
.s-full-logo {
  height: clamp(52px, 12vh, 110px); width: auto; display: block;
  animation: wordWipe 0.7s cubic-bezier(0.18, 0.9, 0.24, 1.18) both;
}
/* legacy single-piece helpers (kept for backward compat) */
.s-mark { height: clamp(58px, 13vh, 128px); width: auto; display: block;
          animation: markIn 0.8s cubic-bezier(0.18, 0.9, 0.24, 1.18) both; }
.s-word { height: clamp(52px, 11.5vh, 116px); width: auto; display: block;
          animation: wordWipe 0.66s cubic-bezier(0.32, 0.78, 0.2, 1) 0.5s both; }
.s-tag { font-family: var(--font-display); font-weight: 500; color: #16180f;
         font-size: clamp(13px, 2.2vw, 18px); letter-spacing: 0.14em;
         animation: tagIn 0.55s ease 1s both; }

@keyframes markIn {
  0%   { opacity: 0; transform: translateY(-34px) scale(0.55) rotate(-12deg); clip-path: inset(0 0 100% 0); }
  55%  { opacity: 1; clip-path: inset(0 0 0 0); }
  100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); clip-path: inset(0 0 0 0); }
}
@keyframes wordWipe {
  0%   { opacity: 0; clip-path: inset(0 100% 0 0); transform: translateX(-26px); }
  6%   { opacity: 1; }
  100% { opacity: 1; clip-path: inset(0 0 0 0); transform: translateX(0); }
}
@keyframes settle { 0% { transform: scale(0.985); } 55% { transform: scale(1.02); } 100% { transform: scale(1); } }
@keyframes tagIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

/* Respect reduced-motion: show final frame instantly */
@media (prefers-reduced-motion: reduce) {
  .s-mark, .s-word, .splash-logo, .s-tag { animation: none; }
}
