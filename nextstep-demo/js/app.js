// ============================================================
// NEXT_STEP — Phase 1 MVP SPA
// Flow: create-path → name-path → track → faculty → programs → cooking → roadmap
// Visuals: Stitch design system (light + Duolingo-green, tactile).
// Data: Supabase (anon read of catalog + program_admission_rounds view).
// ============================================================

/* ---------- Subject-code → Thai label (spec §3.2) ---------- */
const A_LEVEL = {
  61: "คณิต 1", 62: "คณิต 2", 63: "วิทย์ประยุกต์", 64: "ฟิสิกส์", 65: "เคมี",
  66: "ชีววิทยา", 70: "สังคม", 81: "ไทย", 82: "อังกฤษ", 83: "ฝรั่งเศส",
  84: "เยอรมัน", 85: "ญี่ปุ่น", 86: "เกาหลี", 87: "บาลี", 88: "จีน", 89: "สเปน",
};
const SUBJECT_LABEL = {
  gpax: "GPAX", gpa: "GPA",
  tgat: "TGAT ความถนัดทั่วไป", tgat1: "TGAT1 การสื่อสารภาษาอังกฤษ", tgat2: "TGAT2 การคิดอย่างมีเหตุผล", tgat3: "TGAT3 สมรรถนะการทำงาน",
  tpat1: "TPAT1 วิชาเฉพาะ กสพท.", tpat2: "TPAT2 ศิลปกรรมศาสตร์", tpat21: "TPAT2.1", tpat22: "TPAT2.2",
  tpat23: "TPAT2.3", tpat3: "TPAT3 วิทย์ เทคโนโลยี วิศวกรรม", tpat4: "TPAT4 สถาปัตยกรรม", tpat5: "TPAT5 ครุศาสตร์",
  portfolio: "แฟ้มสะสมผลงาน (Portfolio)", interview: "สอบสัมภาษณ์", practical: "สอบปฏิบัติ", essay: "เรียงความ/ข้อเขียน",
};

/* faculty_id → คณะใน TCAS70 (สำหรับดึงสัดส่วนคะแนนรอบ Admission ที่ curate ไว้) */
const FACID_TO_TCAS70 = { 1: "med", 2: "eng", 3: "compsci", 4: "account", 5: "comm", 6: "arts", 7: "law", 8: "polsci", 9: "sci", 10: "psych", 11: "arts", 13: "dent", 14: "pharm" };

/* จัดกลุ่มน้ำหนักคะแนน → HTML (TGAT / TPAT / A-Level / อื่นๆ) พร้อมแถบสัดส่วน */
function scoreBreakdownGroupsHTML(weights) {
  const isTgat = (k) => k === "tgat" || /^tgat\d/.test(k);
  const isTpat = (k) => /^tpat/.test(k);
  const isAlv = (k) => /^a_?lv_/.test(k);
  const groups = [
    { title: "TGAT — ความถนัดทั่วไป", test: isTgat, color: "#c2d90f" },
    { title: "TPAT — ความถนัดเฉพาะด้าน", test: isTpat, color: "#88ceff" },
    { title: "A-Level — รายวิชา", test: isAlv, color: "#f1e800" },
    { title: "องค์ประกอบอื่น (GPAX / แฟ้ม / สัมภาษณ์)", test: (k) => !isTgat(k) && !isTpat(k) && !isAlv(k), color: "#9aa090" },
  ];
  const entries = Object.entries(weights || {});
  if (!entries.length) return `<p class="text-[13px] text-on-surface-variant">ไม่มีข้อมูลสัดส่วนคะแนน</p>`;
  let html = "";
  for (const g of groups) {
    const rows = entries.filter(([k]) => g.test(k)).sort((a, b) => b[1] - a[1]);
    if (!rows.length) continue;
    const sum = rows.reduce((s, [, w]) => s + Number(w), 0);
    html += `<div class="mb-3">
      <div class="flex items-center justify-between mb-1.5">
        <span class="font-display font-bold text-[13px] text-on-surface">${g.title}</span>
        <span class="font-mono text-[12px] text-on-surface-variant">รวม ${sum}%</span>
      </div>
      ${rows.map(([k, w]) => {
        const label = (typeof TCAS70 !== "undefined" && TCAS70.subjects && TCAS70.subjects[k]?.label) || subjectLabel(k);
        return `<div class="mb-1.5">
          <div class="flex items-center justify-between text-[12px] mb-0.5"><span class="text-on-surface">${esc(label)}</span><span class="font-mono font-bold text-on-surface">${w}%</span></div>
          <div class="h-2 rounded-full bg-surface-variant overflow-hidden"><div class="h-full rounded-full" style="width:${Math.min(100, Number(w))}%;background:${g.color};transition:width .5s"></div></div>
        </div>`;
      }).join("")}
    </div>`;
  }
  return html;
}

/* เติมสัดส่วนคะแนนรอบ Admission (อ้างอิง TCAS70) ลง container ตามคณะของหลักสูตร */
async function renderRoadmapWeights(containerId, programId, facultyId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  try {
    let facId = facultyId;
    if (!facId && programId) {
      const { data } = await db.from("programs").select("faculty_id").eq("id", programId).maybeSingle();
      facId = data?.faculty_id;
    }
    const fac = (typeof TCAS70 !== "undefined") && TCAS70.faculties.find((f) => f.key === FACID_TO_TCAS70[facId]);
    if (!fac) { el.innerHTML = `<p class="text-[13px] text-on-surface-variant py-2">ยังไม่มีข้อมูลสัดส่วนคะแนนอ้างอิงสำหรับคณะนี้ · ดูเกณฑ์จริงที่ mytcas.com</p>`; return; }
    el.innerHTML = `
      <div class="text-[12px] text-on-surface-variant mb-3">อ้างอิงเกณฑ์ <span class="font-bold text-on-surface">${esc(fac.round)}</span> ของ ${esc(fac.label)}${fac.minGpax ? ` · GPAX ขั้นต่ำ ${fac.minGpax.toFixed(2)}` : ""}</div>
      ${scoreBreakdownGroupsHTML(fac.weights)}
      <div class="text-[11px] text-on-surface-variant leading-relaxed border-t border-surface-variant pt-2 mt-1">
        ${sl("info", { size: 12, color: "#9aa090", cls: "inline align-middle" })} ${esc(TCAS70.estimateNote)} — เกณฑ์จริงแต่ละมหาวิทยาลัยต่างกัน ตรวจสอบที่ mytcas.com
      </div>`;
  } catch { el.innerHTML = `<p class="text-[13px] text-on-surface-variant py-2">โหลดสัดส่วนคะแนนไม่สำเร็จ</p>`; }
}

/* wire ปุ่มกดเปิด/ปิดสัดส่วนคะแนน (โหลดครั้งแรกเมื่อเปิด) — ใช้ทั้ง 2 หน้า roadmap */
function wireWeightsToggle(programId, facultyId) {
  const btn = document.getElementById("rm-weights-toggle");
  const box = document.getElementById("rm-weights");
  if (!btn || !box) return;
  const caret = document.getElementById("rm-weights-caret");
  const hint = document.getElementById("rm-weights-hint");
  let loaded = false;
  btn.addEventListener("click", () => {
    const open = box.classList.toggle("hidden") === false;
    if (caret) caret.style.transform = open ? "rotate(90deg)" : "";
    if (hint) hint.textContent = open ? "ซ่อน" : "กดดูเพิ่มเติม";
    if (open && !loaded) {
      loaded = true;
      box.innerHTML = `<div class="flex justify-center py-4"><div class="cook-spinner" style="width:28px;height:28px;border-width:3px"></div></div>`;
      renderRoadmapWeights("rm-weights", programId, facultyId);
    }
  });
}
function subjectLabel(code) {
  if (SUBJECT_LABEL[code]) return SUBJECT_LABEL[code];
  const m = /^a_lv_(\d+)$/.exec(code);
  if (m) return "A-Lv " + (A_LEVEL[+m[1]] || m[1]);
  return code.toUpperCase();
}

/* ---------- Tracks (spec §8.8) ---------- */
const TRACKS = [
  { key: "sci_math", flag: "accepts_sci_math", label: "วิทย์–คณิต", icon: "flask", desc: "สายวิทยาศาสตร์ คณิตศาสตร์" },
  { key: "arts", flag: "accepts_arts", label: "ศิลป์", icon: "palette", desc: "ศิลป์–ภาษา / ศิลป์–คำนวณ / ศิลป์–สังคม" },
  { key: "vocational", flag: "accepts_vocational", label: "อาชีวะ (ปวช./ปวส.)", icon: "wrench", desc: "สายอาชีพ" },
];

/* ---------- State ---------- */
const state = {
  view: "auth",
  authStep: "intent", // 'intent' | 'login' | 'register'
  user: null,        // Supabase auth user (null = guest / signed out)
  profile: null,     // users_profile row (cached จริงจาก DB)
  prefs: null,       // user_preferences row
  guest: false,
  flow: { name: "", track: null, facultyId: null, facultyName: "", program: null },
};

/* ---------- localStorage (Phase 3 → DB) ---------- */
const LS_PATHS = "nextstep_paths";
const LS_MAIN = "nextstep_main";
const LS_PROGRESS = "nextstep_progress"; // { pathId: [stepNumbers...] } — ขั้นที่ทำเสร็จ
const getPaths = () => { try { return JSON.parse(localStorage.getItem(LS_PATHS)) || []; } catch { return []; } };
const savePaths = (p) => localStorage.setItem(LS_PATHS, JSON.stringify(p));
const getMain = () => localStorage.getItem(LS_MAIN);
const setMain = (id) => localStorage.setItem(LS_MAIN, id);

/* ---------- Profile decoration (avatar + banner) — เก็บ data URL ย่อใน localStorage ต่อผู้ใช้ ---------- */
const LS_DECOR = "nextstep_decor";
const decorKey = () => state.user?.id || (state.guest ? "guest" : "anon");
function getDecor() { try { return (JSON.parse(localStorage.getItem(LS_DECOR)) || {})[decorKey()] || {}; } catch { return {}; } }
function setDecor(patch) {
  let all; try { all = JSON.parse(localStorage.getItem(LS_DECOR)) || {}; } catch { all = {}; }
  all[decorKey()] = { ...(all[decorKey()] || {}), ...patch };
  try { localStorage.setItem(LS_DECOR, JSON.stringify(all)); return true; }
  catch { toast("รูปใหญ่เกินไป ลองรูปที่เล็กลงนะ"); return false; }
}
// อ่านไฟล์รูป → ย่อ/บีบอัดด้วย canvas → คืน data URL (jpeg) เพื่อเก็บได้เล็กลง
function readCompressedImage(file, maxW, maxH, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) { reject(new Error("not image")); return; }
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width, maxH / img.height);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        try { resolve(canvas.toDataURL("image/jpeg", quality)); } catch (e) { reject(e); }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- Roadmap step progress ---------- */
const getAllProgress = () => { try { return JSON.parse(localStorage.getItem(LS_PROGRESS)) || {}; } catch { return {}; } };
const getProgress = (pathId) => { const a = getAllProgress()[pathId]; return Array.isArray(a) ? a : []; };
function toggleStep(pathId, step) {
  if (!pathId) return [];
  const all = getAllProgress();
  const set = new Set(all[pathId] || []);
  set.has(step) ? set.delete(step) : set.add(step);
  all[pathId] = [...set].sort((a, b) => a - b);
  try { localStorage.setItem(LS_PROGRESS, JSON.stringify(all)); } catch {}
  return all[pathId];
}
// ขั้น "ปัจจุบัน" = ขั้นแรกที่ยังไม่เสร็จ
function currentStepNumber(roadmap, completed) {
  for (const s of roadmap) if (!completed.includes(s.step_number)) return s.step_number;
  return null; // เสร็จหมดแล้ว
}
function roadmapProgress(roadmap, pathId) {
  const total = roadmap.length || 1;
  const completed = getProgress(pathId);
  const done = roadmap.filter((s) => completed.includes(s.step_number)).length;
  return { done, total, pct: Math.round((done / total) * 100) };
}

/* สร้าง HTML ไทม์ไลน์ที่กดทำเครื่องหมายเสร็จได้ (ใช้ทั้ง viewRoadmap + My Roadmap) */
function roadmapTimelineHTML(roadmap, pathId) {
  const completed = getProgress(pathId);
  const curStep = currentStepNumber(roadmap, completed);
  return roadmap.map((s, i) => {
    const done = completed.includes(s.step_number);
    const current = s.step_number === curStep;
    const dotBg = done ? "bg-primary border-primary" : current ? "bg-primary-container border-[#96a80a]" : "bg-surface-container-high border-surface-variant";
    const dotShadow = (done || current) ? "#96a80a" : "#0d0f08";
    const cardBorder = done ? "border-primary/60" : current ? "border-primary" : "border-surface-variant";
    // หัวข้อกลุ่มรอบ (แสดงเมื่อขึ้นรอบใหม่)
    const header = (s.roundFirst && s.round_label) ? `
      <div class="flex items-center gap-2 ${i === 0 ? "" : "mt-5"} mb-3 relative z-10">
        <span class="text-[12px] font-display font-bold text-tertiary bg-tertiary/15 border border-tertiary/30 rounded-full px-3 py-1">${esc(s.round_label)}</span>
        <div class="flex-1 h-px bg-surface-variant"></div>
      </div>` : "";
    return `
      ${header}
      <div class="flex items-start gap-md mb-4 relative">
        <button data-step="${s.step_number}" aria-label="สลับสถานะขั้น ${s.step_number}"
          class="w-12 h-12 rounded-full ${dotBg} border-2 flex items-center justify-center shadow-[0_4px_0_${dotShadow}] z-10 shrink-0 mt-1 ${current && !done ? "pulse-animation" : ""} transition-all">
          ${done ? icon("check", { fill: true, cls: "text-on-primary" }) : current ? icon("play_arrow", { fill: true, cls: "text-on-primary" }) : `<span class="font-headline font-extrabold text-on-surface-variant">${s.step_number}</span>`}
        </button>
        <div data-detail="${s.step_number}" role="button" tabindex="0" class="flex-1 min-w-0 bg-surface-container-lowest border-2 ${cardBorder} rounded-xl p-md shadow-[0_4px_0_#0d0f08] cursor-pointer">
          <div class="flex items-center justify-between gap-sm">
            <h3 class="font-headline font-bold text-[16px] ${done || current ? "text-primary" : "text-on-surface"}">${esc(s.title)}</h3>
            ${s.target_period ? `<span class="shrink-0 text-[11px] font-bold text-secondary bg-secondary-fixed/40 rounded-full px-2 py-0.5">${esc(s.target_period)}</span>` : ""}
          </div>
          ${s.description ? `<p class="text-[14px] text-on-surface-variant mt-1 leading-relaxed">${esc(s.description)}</p>` : ""}
          <div class="flex items-center justify-between gap-2 mt-3 flex-wrap">
            <button data-step="${s.step_number}" class="inline-flex items-center gap-1.5 text-[13px] font-bold rounded-lg px-3 py-1.5 border-2 transition-colors ${done ? "border-primary/50 text-primary bg-primary/10" : "border-surface-variant text-on-surface-variant hover:border-primary hover:text-primary"}">
              ${done ? icon("check", { cls: "text-[16px] align-middle" }) + " ทำเสร็จแล้ว" : "ทำขั้นตอนนี้เสร็จ"}
            </button>
            <span class="text-[12px] font-bold text-primary flex items-center gap-0.5 shrink-0">ดูรายละเอียด ${sl("arrow_right", { size: 13, color: "#c2d90f" })}</span>
          </div>
        </div>
      </div>`;
  }).join("");
}

/* wire ปุ่มในไทม์ไลน์ + อัปเดต progress + คลิก card ดูรายละเอียด — เรียกซ้ำได้หลัง re-render */
function wireRoadmapTimeline(pathId, roadmap, ctx = {}, timelineId = "rm-timeline") {
  const el = document.getElementById(timelineId);
  if (!el) return;
  // ปุ่มวงกลม/ปุ่ม "ทำเสร็จ" → toggle (stopPropagation กันไปเปิด detail)
  el.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", (e) => {
    e.stopPropagation();
    const before = roadmapProgress(roadmap, pathId).done;
    toggleStep(pathId, +b.dataset.step);
    el.innerHTML = roadmapTimelineHTML(roadmap, pathId);
    wireRoadmapTimeline(pathId, roadmap, ctx, timelineId);
    const p = roadmapProgress(roadmap, pathId);
    updateRoadmapProgress(pathId, roadmap);
    if (p.done === p.total && before < p.total) toast("เยี่ยมมาก! ทำครบทุกขั้นตอนแล้ว 🎉");
  }));
  // คลิกตัว card → เปิดรายละเอียดเชิงลึก
  el.querySelectorAll("[data-detail]").forEach((b) => b.addEventListener("click", () => {
    const s = roadmap.find((x) => x.step_number === +b.dataset.detail);
    if (s) openRoadmapStep(s, ctx);
  }));
}
function updateRoadmapProgress(pathId, roadmap) {
  const { done, total, pct } = roadmapProgress(roadmap, pathId);
  document.querySelectorAll("[data-rm-badge]").forEach((e) => { e.textContent = `เสร็จ ${done}/${total}`; });
  document.querySelectorAll("[data-rm-bar]").forEach((e) => { e.style.width = pct + "%"; });
  document.querySelectorAll("[data-rm-pct]").forEach((e) => { e.textContent = pct + "%"; });
}

/* ---------- Helpers ---------- */
const $app = () => document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const uid = () => "p_" + Math.random().toString(36).slice(2, 9);

function icon(name, { fill = false, cls = "" } = {}) {
  const style = fill ? "font-variation-settings:'FILL' 1;" : "";
  return `<span class="material-symbols-outlined ${cls}" style="${style}">${name}</span>`;
}
function fmtTuition(v) {
  if (v === null || v === undefined) return "ไม่ระบุ"; // spec §8.3 — never 0, never "โปรดสอบถาม"
  return "฿" + Number(v).toLocaleString("th-TH") + " / เทอม";
}
let toastTimer;
function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) { console.warn("toast:", msg); return; }  // BUG-9: null guard
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}
function go(view) { state.view = view; render(); window.scrollTo(0, 0); }

/* ---------- Admin / demo account (client-side, for presentation) ----------
   ไม่แตะ Supabase — seed โปรไฟล์ + เส้นทางตัวอย่างครบ เพื่อโชว์ทุก feature ได้ลื่นไหล
   ตอน present โดยไม่ขึ้นกับ network/DB. Login ด้วยอีเมล+รหัสด้านล่างนี้. */
const ADMIN_EMAIL = "admin@nexstep.app";
const ADMIN_PASSWORD = "nexstep-demo";
const LS_ADMIN = "nextstep_admin";

function isAdminCreds(email, password) {
  // ยืดหยุ่น: ตัดช่องว่าง + ไม่สนตัวพิมพ์ (กันคีย์บอร์ดมือถือ auto-capitalize)
  return (email || "").trim().toLowerCase() === ADMIN_EMAIL
    && (password || "").trim().toLowerCase() === ADMIN_PASSWORD;
}

// สร้าง session ปลอมของ admin + seed ข้อมูลตัวอย่างครบทุกอย่าง
function enterAdminMode() {
  state.user = {
    id: "admin-demo",
    email: ADMIN_EMAIL,
    user_metadata: { first_name: "ผู้ดูแลระบบ" },
    app_metadata: { provider: "email", providers: ["email"] },
    identities: [{ provider: "email" }],
  };
  state.guest = false;
  state.admin = true;
  state.profile = {
    id: "admin-demo",
    first_name: "ผู้ดูแลระบบ",
    education_level: "ม.6",
    school_name: "โรงเรียนสาธิตเน็กซ์สเตป",
    gpa: 3.98,
    onboarded: true,
  };
  state.prefs = { user_id: "admin-demo", interests: ["1", "2"] };
  state.flow.track = "sci_math";

  // seed เส้นทางตัวอย่าง (ถ้ายังไม่มี) เพื่อให้ dashboard/roadmap มีของโชว์
  try {
    if (!getPaths().length) {
      // programId เป็น id จริง (มี roadmap/rounds ใน DB) เพื่อให้ demo โชว์เส้นทางจริง
      const demo = [
        { id: "p_demo_med", name: "หมอในฝัน", programName: "แพทยศาสตรบัณฑิต", uni: "มหาวิทยาลัยธรรมศาสตร์", programId: "10050211100101A", track: "sci_math", facultyId: 1, steps: 4, createdAt: Date.now() },
        { id: "p_demo_eng", name: "วิศวะ คอมพิวเตอร์", programName: "วิศวกรรมคอมพิวเตอร์", uni: "มหาวิทยาลัยศรีนครินทรวิโรฒ", programId: "10090209300501A", track: "sci_math", facultyId: 2, steps: 4, createdAt: Date.now() - 86400000 },
      ];
      savePaths(demo);
      setMain(demo[0].id);
    }
  } catch {}

  try { localStorage.setItem(LS_ADMIN, "1"); } catch {}
  toast("เข้าสู่โหมดผู้ดูแล (Demo) สำเร็จ");
  go("create-path");
}

/* ---------- Auth (Supabase) ---------- */
const displayName = () =>
  state.user?.user_metadata?.first_name || state.user?.email?.split("@")[0] || "";

async function doRegister(name, email, password) {
  const { data, error } = await db.auth.signUp({
    email, password, options: { data: { first_name: name } },
  });
  if (error) { toast(authErr(error)); return; }
  if (data.session) {
    state.user = data.user; state.guest = false;
    // best-effort profile row (RLS own-row insert; Phase 0). Ignore failures.
    try { await db.from("users_profile").upsert({ id: data.user.id, first_name: name }); } catch {}
    toast("สมัครสมาชิกสำเร็จ");
    go("create-path");
  } else {
    // email-confirmation required
    toast("สมัครสำเร็จ! ตรวจสอบอีเมลเพื่อยืนยัน แล้วเข้าสู่ระบบ");
    state.authMode = "login"; render();
  }
}
async function doLogin(email, password) {
  // บัญชี admin/demo — ไม่ต้องแตะ Supabase (สำหรับ present)
  if (isAdminCreds(email, password)) { enterAdminMode(); return; }
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) { toast(authErr(error)); return; }
  state.user = data.user; state.guest = false;
  toast("ยินดีต้อนรับกลับ");
  await routeAfterAuth(); // onboarded? → dashboard, ไม่งั้น → onboarding
}
async function doLogout() {
  if (!state.admin) { try { await db.auth.signOut(); } catch {} }
  state.user = null; state.guest = false; state.admin = false; state.profile = null; state.prefs = null;
  state.authStep = "intent";
  try { localStorage.removeItem("nextstep_guest"); } catch {}
  try { localStorage.removeItem(LS_ADMIN); } catch {}
  go("auth");
}

// Google OAuth — opens popup; Supabase handles the redirect
async function doGoogleLogin() {
  const { error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + window.location.pathname,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) toast("เข้าสู่ระบบด้วย Google ไม่สำเร็จ: " + error.message);
}
function authErr(e) {
  const m = (e?.message || "").toLowerCase();
  if (m.includes("invalid login")) return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already")) return "อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบดูมั้ย?";
  if (m.includes("email not confirmed")) return "อีเมลยังไม่ได้ยืนยัน — ลองสมัครใหม่หรือขอลิงก์ยืนยันอีกครั้ง";
  if (m.includes("should be different") || m.includes("different from the old")) return "รหัสใหม่ต้องต่างจากรหัสเดิม";
  if (m.includes("weak") || (m.includes("password") && m.includes("least"))) return "รหัสผ่านสั้นเกินไป ต้องมีอย่างน้อย 8 ตัว";
  if (m.includes("password")) return "รหัสผ่านไม่ถูกต้อง";
  if (m.includes("email")) return "อีเมลไม่ถูกต้อง";
  if (m.includes("rate limit") || m.includes("too many")) return "ขอบ่อยเกินไป รอสักครู่แล้วลองใหม่นะ";
  return "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง";
}

/* ============================================================
   Password strength + confirm (shared: onboarding / settings / reset)
   ============================================================ */
const PW_MIN = 8; // ความยาวขั้นต่ำ

// คืน { score 0-4, label, color, pct } — ใช้กับหลอดสเกล
function passwordStrength(pw) {
  if (!pw) return { score: -1, label: "", color: "#3a3f34", pct: 0 };
  let s = 0;
  if (pw.length >= PW_MIN) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  s = Math.min(s, 4);
  const levels = [
    { label: "อ่อนมาก", color: "#ef4444" },
    { label: "อ่อน", color: "#f59e0b" },
    { label: "ปานกลาง", color: "#eab308" },
    { label: "ดี", color: "#84cc16" },
    { label: "แข็งแรง", color: "#22c55e" },
  ];
  return { score: s, ...levels[s], pct: ((s + 1) / 5) * 100 };
}

// HTML ของหลอดสเกล + ข้อความบอก (ใส่ใน container ที่มี id)
function strengthWidgetHTML(pw) {
  const s = passwordStrength(pw);
  const tips = pw ? "" : `<span class="text-[11px] text-on-surface-variant">แนะนำ: อย่างน้อย 8 ตัว · มีตัวพิมพ์ใหญ่-เล็ก · ตัวเลข · สัญลักษณ์</span>`;
  return `
    <div class="pw-track"><div class="pw-fill" style="width:${s.pct}%;background:${s.color};transition:all .2s"></div></div>
    <div class="flex items-center justify-between mt-1">
      <span class="text-[11px]" style="color:${s.color}">${esc(s.label)}</span>
      ${tips}
    </div>`;
}

// wire input → อัปเดตหลอดสด (inputId → containerId)
function wireStrength(inputId, containerId) {
  const inp = document.getElementById(inputId);
  const box = document.getElementById(containerId);
  if (!inp || !box) return;
  const upd = () => { box.innerHTML = strengthWidgetHTML(inp.value); };
  inp.addEventListener("input", upd);
  upd();
}

// ตรวจรหัสก่อนสมัคร/เปลี่ยน: คืน error string หรือ null ถ้าผ่าน
function validatePassword(pw, confirm) {
  if (!pw || pw.length < PW_MIN) return `รหัสผ่านต้องมีอย่างน้อย ${PW_MIN} ตัว`;
  if (passwordStrength(pw).score < 1) return "รหัสผ่านอ่อนเกินไป ลองเพิ่มตัวเลข/ตัวพิมพ์ใหญ่";
  if (confirm !== undefined && pw !== confirm) return "รหัสผ่านทั้งสองช่องไม่ตรงกัน";
  return null;
}

/* ---------- Data fetchers ---------- */
async function fetchFaculties() {
  const { data, error } = await db.from("faculties").select("id,name_th").order("id");
  if (error) throw error;
  return data;
}
async function fetchPrograms(facultyId, trackFlag) {
  // ข้อมูลจริง: accepts_* flags เป็น null เกือบทั้งหมด → กรอง "true หรือ null (ไม่ระบุ)"
  // เพื่อไม่ให้หลักสูตรหายทั้งคณะ (ถ้าอนาคต flag ถูกเซ็ต false ค่อยถูกกรองออก)
  const q = db.from("programs")
    .select("id,major_name,major_clean,degree_name,program_type,tuition_fee,university_id,universities(name_th,campus_name,region)")
    .eq("faculty_id", facultyId)
    .or(`${trackFlag}.is.null,${trackFlag}.eq.true`)
    .order("major_name")
    .limit(300);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}
async function fetchRounds(programId) {
  const { data, error } = await db.from("program_admission_rounds")
    .select("round_number,round_label,project_name,quota,min_gpax,min_total_score,scores")
    .eq("program_id", programId)
    .order("round_number");
  if (error) throw error;
  return data;
}
async function fetchRoadmap(programId) {
  const { data, error } = await db.from("program_roadmaps")
    .select("step_number,title,description,target_period")
    .eq("program_id", programId)
    .order("step_number");
  if (error) throw error;
  return data;
}

/* รอบซ้ำ → เอาแค่ 1 ต่อ round_number, เรียงตามเลขรอบ */
function dedupeRounds(rounds) {
  const seen = {}, out = [];
  (rounds || []).forEach((r) => {
    const key = r.round_number != null ? "n" + r.round_number : (r.round_label || JSON.stringify(r));
    if (!seen[key]) { seen[key] = 1; out.push(r); }
  });
  out.sort((a, b) => (a.round_number || 99) - (b.round_number || 99));
  return out;
}
function roundShortLabel(r) {
  const map = { 1: "รอบ 1 Portfolio", 2: "รอบ 2 โควตา", 3: "รอบ 3 Admission", 4: "รอบ 4 Direct Admission" };
  return map[r.round_number] || (r.round_label || ("รอบ " + (r.round_number ?? "?")));
}

/* สร้างเส้นทางเตรียมตัว "เฉพาะหลักสูตร" จากรอบที่เปิดรับจริง — เปิดกี่รอบก็เตรียมครบทุกรอบ */
function buildRoadmapFromRounds(rounds, ctx) {
  const uniq = dedupeRounds(rounds);
  if (!uniq.length) return null; // ไม่มีรอบ → ให้ fallback ไป program_roadmaps
  const steps = [];
  let n = 1;
  for (const r of uniq) {
    const label = roundShortLabel(r);
    const rn = r.round_number;
    const push = (title, description, period, first = false) =>
      steps.push({ step_number: n++, title, description, target_period: period, round_number: rn, round_label: label, roundFirst: first });

    if (rn === 1) {
      push("เตรียมแฟ้มสะสมผลงาน (Portfolio)", "รวบรวมผลงานวิชาการ กิจกรรม การแข่งขัน และเกียรติบัตรที่เกี่ยวข้องกับสาขา จัดพอร์ตให้โดดเด่น", "ม.4–ม.6", true);
      push(`ยื่นสมัคร ${label}`, "สมัครผ่าน myTCAS และ/หรือระบบรับสมัครของมหาวิทยาลัยตามประกาศ", "ต.ค.–ธ.ค.");
      push("สอบสัมภาษณ์ / นำเสนอผลงาน", "บางหลักสูตรมีสัมภาษณ์หรือให้นำเสนอแฟ้มสะสมผลงาน", "ธ.ค.–ม.ค.");
      push(`ประกาศผล & ยืนยันสิทธิ์ (${label})`, "ตรวจผลและกดยืนยันสิทธิ์ในระบบ myTCAS ตามกำหนด", "ม.ค.–ก.พ.");
    } else if (rn === 2) {
      push("เตรียมคุณสมบัติ/เอกสารโควตา", "ตรวจเกณฑ์โควตา (พื้นที่/โครงการ) และเตรียมเอกสาร บางที่มีสอบวิชาเฉพาะ", "พ.ย.–ก.พ.", true);
      push(`สมัคร ${label}`, "สมัครรอบโควตาตามประกาศ (อาจใช้คะแนน TGAT/TPAT/A-Level หรือข้อสอบของที่นั้น)", "ก.พ.–มี.ค.");
      push(`ประกาศผล & ยืนยันสิทธิ์ (${label})`, "ตรวจผลและยืนยันสิทธิ์ในระบบ myTCAS", "เม.ย.–พ.ค.");
    } else if (rn === 3) {
      push("สมัครสอบ TGAT / TPAT", "ลงทะเบียนและสอบ TGAT/TPAT ผ่าน myTCAS (สอบ ม.ค.–ก.พ. 2570)", "ธ.ค.–ก.พ.", true);
      push("สอบ A-Level", "สอบวิชาสามัญ A-Level ตามวิชาที่คณะกำหนด (สอบ มี.ค. 2570)", "มี.ค.");
      push(`ยื่นเลือกอันดับ ${label}`, "เลือกอันดับได้สูงสุด 10 อันดับ ในระบบ myTCAS", "พ.ค.");
      push(`ประกาศผล & ยืนยันสิทธิ์ (${label})`, "ประมวลผลการเลือกอันดับ + ยืนยันสิทธิ์ในระบบ myTCAS", "พ.ค.");
    } else {
      push(`สมัคร ${label} (รับตรงอิสระ)`, "สมัครรับตรงกับมหาวิทยาลัยโดยตรง (เปิดเมื่อยังมีที่นั่งเหลือ)", "พ.ค.–มิ.ย.", true);
      push(`ประกาศผล & รายงานตัว (${label})`, "ตรวจผลและรายงานตัวตามประกาศของมหาวิทยาลัย", "มิ.ย.");
    }
  }
  return steps;
}

/* รวมการโหลด: rounds (dedupe) + roadmap (สร้างจากรอบ, fallback program_roadmaps) */
async function getProgramRoadmap(programId, uni) {
  try {
    const rawRounds = await fetchRounds(programId);
    const rounds = dedupeRounds(rawRounds);
    const built = buildRoadmapFromRounds(rawRounds, { uni });
    if (built && built.length) return { rounds, roadmap: built };
    const roadmap = await fetchRoadmap(programId);
    return { rounds, roadmap: roadmap || [] };
  } catch { return { rounds: [], roadmap: [] }; }
}

/* ============================================================
   VIEWS
   ============================================================ */

/* --- dashboard (หน้าหลัก) — renders sync shell, then loads live data async --- */
function viewDashboard() {
  const paths = getPaths();
  const mainId = getMain();
  const mainPath = paths.find((p) => p.id === mainId) || paths[0];
  const name = state.profile?.first_name || displayName() || "นักเรียน";
  const gpax = (state.profile?.gpa != null) ? Number(state.profile.gpa).toFixed(2) : "—";
  const gradeSub = state.profile?.education_level ? esc(state.profile.education_level) : "";

  // ความคืบหน้าจริงของเส้นทางหลัก (ถ้ารู้จำนวนขั้นแล้ว คำนวณ sync ได้เลย)
  const mpDone = mainPath ? getProgress(mainPath.id).length : 0;
  const mpTotal = mainPath?.steps || 0;
  const mpPct = mpTotal ? Math.round((mpDone / mpTotal) * 100) : null;

  // stat cards
  const stats = [
    { id: "stat-gpa", label: "GPA ปัจจุบัน", value: gpax, sub: gradeSub, subCls: "text-on-surface-variant" },
    { id: "stat-progress", label: "ความคืบหน้า", value: mpPct != null ? mpPct + "%" : "—", sub: mainPath ? esc(mainPath.name) : "ยังไม่มีเส้นทาง", subCls: "text-primary" },
    { id: "stat-event", label: "กิจกรรมใกล้ถึง", value: "—", sub: "", subCls: "text-on-surface-variant" },
    { id: "stat-exam", label: "วันสอบถัดไป", value: "—", sub: "", subCls: "text-error" },
  ];
  const statCards = stats.map((s) => `
    <div class="db-card p-5 flex flex-col gap-1 min-w-0">
      <span class="text-[12px] text-on-surface-variant font-medium">${s.label}</span>
      <span id="${s.id}" class="font-mono font-bold text-[28px] text-on-surface leading-none">${s.value}</span>
      <span id="${s.id}-sub" class="text-[12px] ${s.subCls || "text-on-surface-variant"} truncate ${s.sub ? "" : "hidden"}">${s.sub || ""}</span>
    </div>`).join("");

  // roadmap horizontal progress (main path)
  const roadmapSteps = mainPath?._roadmap || [];
  const roadmapSection = mainPath ? `
    <div data-nav="roadmap-list" role="button" tabindex="0" class="db-card p-5 mb-4 cursor-pointer">
      <div class="flex items-start gap-3 mb-4">
        <div class="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">${sl("target", { size: 20, color: "#c2d90f" })}</div>
        <div class="flex-1 min-w-0">
          <div class="font-display font-bold text-[16px] text-on-surface truncate">${esc(mainPath.programName || mainPath.name)}</div>
          <div class="text-[12px] text-on-surface-variant truncate">${mainPath.uni ? esc(mainPath.uni) + " · " : ""}TCAS Portfolio</div>
        </div>
        <span id="dash-rm-badge" class="shrink-0 text-[13px] font-mono font-bold text-primary bg-primary/10 border border-primary/30 rounded-lg px-3 py-1">${mpPct != null ? mpPct + "%" : "—"}</span>
      </div>

      <!-- horizontal step nodes (real, from main path roadmap) -->
      <div id="dash-rm-steps" class="relative flex items-center gap-0 mb-5 overflow-x-auto no-scrollbar pb-1">
        <div class="h-16 w-full bg-surface-variant/40 rounded-lg animate-pulse"></div>
      </div>

      <!-- progress bar -->
      <div class="flex items-center justify-between mb-1">
        <span class="text-[12px] text-on-surface-variant">ความคืบหน้าโดยรวม</span>
        <span id="dash-rm-pct" class="text-[12px] font-mono font-bold text-primary">${mpPct != null ? mpPct + "%" : "0%"}</span>
      </div>
      <div class="h-2.5 rounded-full bg-surface-variant overflow-hidden">
        <div id="dash-rm-bar" class="h-full rounded-full bg-primary" style="width:${mpPct != null ? mpPct : 0}%;transition:width .6s cubic-bezier(.32,.78,.2,1)"></div>
      </div>
      <div class="flex items-center justify-end gap-1 mt-3 text-[12px] font-bold text-primary">ดูโรดแมปเต็ม ${sl("arrow_right",{size:14,color:"#c2d90f"})}</div>
    </div>` : `
    <div class="db-card p-6 mb-4 flex flex-col items-center text-center gap-3">
      <div class="mascot-float">${nexMascot("mascot w-24 h-24", { pose: "wave" })}</div>
      <p class="text-on-surface font-display font-bold text-[15px]">ยังไม่มีเส้นทางในฝัน</p>
      <p class="text-on-surface-variant text-[13px] -mt-2">มาสร้างเส้นทางสู่คณะที่ใช่กันเถอะ!</p>
      <button id="btn-new" class="tactile-button bg-primary-container text-on-primary font-display font-bold px-5 py-2.5 rounded-xl border-b-4 border-[#96a80a]">
        ${icon("add")} สร้างเส้นทางใหม่
      </button>
    </div>`;

  // path finder banner
  const banner = `
    <div class="db-card p-4 mb-4 flex items-center gap-4" style="background:rgba(194,217,15,.06);border-color:rgba(194,217,15,.2)">
      <span class="shrink-0">${sl("search", { size: 26, color: "#c2d90f" })}</span>
      <div class="flex-1 min-w-0">
        <div class="font-display font-bold text-[15px] text-on-surface">ยังไม่แน่ใจเส้นทาง? ลอง Path Finder</div>
        <div class="text-[12px] text-on-surface-variant">ตอบคำถาม 5 ข้อ · ระบบจะแนะนำเส้นทางที่เหมาะกับคุณ</div>
      </div>
      <button id="btn-pathfinder" class="shrink-0 tactile-button bg-primary-container text-on-primary font-bold text-[13px] px-4 py-2 rounded-xl border-b-4 border-[#96a80a] whitespace-nowrap">
        เริ่มต้นเลย →
      </button>
    </div>`;

  // bottom 2-col
  const events = [
    { day: "15", month: "พ.ค.", title: "สอบ TPAT3 (คณิต-วิทย์)", sub: "การสอบ · สนามสอบ BKK", dot: "bg-error" },
    { day: "22", month: "พ.ค.", title: "Young Scientist Camp รอบรับสมัคร", sub: "กิจกรรม · สมัครออนไลน์", dot: "bg-tertiary" },
    { day: "01", month: "มิ.ย.", title: "Open House จุฬา วิศวะ", sub: "แนะแนว · Onsite", dot: "bg-primary" },
  ];
  const news = [
    { label: "ทปอ. เปิดระบบ myTCAS ปีการศึกษา 2570 — ลงทะเบียน Dek70", meta: "15 ก.ค. 69 · ระดับชาติ" },
    { label: "สรุปตารางสอบกลาง TCAS70: TGAT/TPAT 30 ม.ค.–1 ก.พ. 70", meta: "10 ก.ค. 69 · ข้อสอบ" },
    { label: "กสพท ใช้ TPAT1 + 7 วิชา A-Level สัดส่วน 30:70 (TCAS70)", meta: "2 ก.ค. 69 · แนะแนว" },
  ];
  const eventsCol = `
    <div class="db-card p-5">
      <div class="font-display font-bold text-[14px] text-on-surface-variant mb-3">กิจกรรมใกล้มาถึง</div>
      <div class="space-y-3">
        ${events.map((e) => `
          <div class="flex items-start gap-3">
            <div class="w-10 shrink-0 text-center">
              <div class="font-mono font-bold text-[18px] text-on-surface leading-none">${e.day}</div>
              <div class="text-[11px] text-on-surface-variant">${e.month}</div>
            </div>
            <div class="flex-1 min-w-0 border-l-2 border-surface-variant pl-3">
              <div class="font-bold text-[14px] text-on-surface leading-snug">${e.title}</div>
              <div class="flex items-center gap-1.5 mt-1">
                <span class="w-1.5 h-1.5 rounded-full shrink-0 ${e.dot}"></span>
                <span class="text-[12px] text-on-surface-variant">${e.sub}</span>
              </div>
            </div>
          </div>`).join("")}
      </div>
    </div>`;
  const newsCol = `
    <div class="db-card p-5">
      <div class="font-display font-bold text-[14px] text-on-surface-variant mb-3">ข่าวสารการศึกษา</div>
      <div class="space-y-3">
        ${news.map((n) => `
          <div class="flex gap-3 items-start">
            <span class="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0"></span>
            <div>
              <div class="text-[14px] text-on-surface font-medium leading-snug">${n.label}</div>
              <div class="text-[12px] text-on-surface-variant mt-0.5">${n.meta}</div>
            </div>
          </div>`).join("")}
      </div>
    </div>`;

  // Real date (BUG-4)
  const now = new Date();
  const DAYS_TH_FULL = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];
  const MONTHS_TH_FULL = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  const dateStr = `${DAYS_TH_FULL[now.getDay()]} ${now.getDate()} ${MONTHS_TH_FULL[now.getMonth()]} ${now.getFullYear()+543}`;

  const trackLabel = TRACKS.find(t => t.key === state.flow.track)?.label || "ยังไม่ได้เลือกสาย";

  return dashShell(`
    <!-- top header -->
    <div class="flex items-start justify-between mb-5 gap-4">
      <div>
        <h1 class="font-display font-bold text-[22px] text-on-surface leading-tight flex items-center gap-2">
          สวัสดี, ${esc(name)} <span class="mascot-float inline-flex">${nexMascot("mascot w-9 h-9", { pose: "wave" })}</span>
        </h1>
        <p class="text-[13px] text-on-surface-variant mt-0.5">${dateStr}</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button id="btn-new" class="tactile-button bg-primary-container text-on-primary font-display font-bold text-[13px] px-4 py-2 rounded-xl border-b-4 border-[#6b7a08] flex items-center gap-1">
          ${sl("add",{size:15,color:"#16180f"})} เส้นทางใหม่
        </button>
      </div>
    </div>

    <!-- stat cards row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">${statCards}</div>

    <!-- เส้นทางของฉัน heading -->
    <h2 class="font-display font-bold text-[15px] text-on-surface mb-3">เส้นทางของฉัน</h2>

    <!-- roadmap card -->
    ${roadmapSection}

    <!-- path finder banner -->
    ${banner}

    <!-- คำนวณโอกาส banner (TCAS70) -->
    <div class="db-card p-4 mb-4 flex items-center gap-4" style="background:rgba(194,217,15,.06);border-color:rgba(194,217,15,.2)">
      <span class="shrink-0">${sl("target", { size: 26, color: "#c2d90f" })}</span>
      <div class="flex-1 min-w-0">
        <div class="font-display font-bold text-[15px] text-on-surface">คำนวณโอกาสเข้าคณะในฝัน</div>
        <div class="text-[12px] text-on-surface-variant">กรอกคะแนน TGAT/TPAT/A-Level · ประเมินโอกาสตามเกณฑ์ TCAS70</div>
      </div>
      <button data-nav="calculator" class="shrink-0 tactile-button bg-primary-container text-on-primary font-bold text-[13px] px-4 py-2 rounded-xl border-b-4 border-[#96a80a] whitespace-nowrap">
        คำนวณเลย →
      </button>
    </div>

    <!-- bottom 2-col: live from Supabase (BUG-8) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="db-card p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="font-display font-bold text-[14px] text-on-surface-variant">กิจกรรมใกล้มาถึง</div>
          <button data-nav="calendar" class="text-[12px] font-bold text-primary flex items-center gap-0.5 hover:gap-1.5 transition-all">ดูทั้งหมด ${sl("arrow_right",{size:13,color:"#c2d90f"})}</button>
        </div>
        <div id="dash-events" class="space-y-2">
          ${[1,2,3].map(()=>`<div class="h-10 bg-surface-variant rounded-lg animate-pulse"></div>`).join("")}
        </div>
      </div>
      <div class="db-card p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="font-display font-bold text-[14px] text-on-surface-variant">ข่าวสารการศึกษา</div>
          <button data-nav="news-page" class="text-[12px] font-bold text-primary flex items-center gap-0.5 hover:gap-1.5 transition-all">ดูทั้งหมด ${sl("arrow_right",{size:13,color:"#c2d90f"})}</button>
        </div>
        <div id="dash-news" class="space-y-2">
          ${[1,2,3].map(()=>`<div class="h-10 bg-surface-variant rounded-lg animate-pulse"></div>`).join("")}
        </div>
      </div>
    </div>
  `);
}

// Called after dashShell renders — loads live events+news
// (ถ้า DB ว่าง/ล่ม/โหมด demo → fallback เป็นข้อมูล TCAS70 client dataset)
// อัปเดต stat card (value + sub) แบบปลอดภัย
function setStat(id, value, sub) {
  const v = document.getElementById(id); if (v) v.textContent = value;
  const s = document.getElementById(id + "-sub");
  if (s) { s.textContent = sub || ""; s.classList.toggle("hidden", !sub); }
}
const MONTHS_TH_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const fmtDayMonth = (iso) => { const d = new Date(iso); return `${d.getDate()} ${MONTHS_TH_SHORT[d.getMonth()]}`; };
const isExamEvent = (e) => /สอบ/.test(e.type || "") || /สอบ|A-Level|TGAT|TPAT/i.test(e.title || "");

async function loadDashboardLiveData() {
  const dotCls = { error: "bg-error", tertiary: "bg-tertiary", primary: "bg-primary", secondary: "bg-secondary" };
  const todayStr = new Date().toISOString().split("T")[0];

  // ---------- events + news + stat cards (กิจกรรม/วันสอบ) ----------
  try {
    let evs = null, newsItems = null;
    if (!state.admin) {
      try {
        const r = await Promise.all([
          db.from("events").select("title,event_date,color,type").gte("event_date", todayStr).order("event_date").limit(12),
          db.from("news").select("title,category,published_at").eq("is_published", true).order("published_at", { ascending: false }).limit(3),
        ]);
        evs = r[0].data; newsItems = r[1].data;
      } catch { /* network → fallback */ }
    }
    if (!evs || !evs.length) evs = TCAS70.schedule.filter(e => e.event_date >= todayStr);
    if (!evs.length) evs = TCAS70.schedule.slice();
    if (!newsItems || !newsItems.length) newsItems = TCAS70.news.slice(0, 3);

    const evEl = document.getElementById("dash-events");
    if (evEl) {
      evEl.innerHTML = evs.length ? evs.slice(0, 3).map(e => {
        const d = new Date(e.event_date); const dot = dotCls[e.color] || "bg-primary";
        return `<button data-ev-date="${e.event_date}" class="w-full text-left flex items-start gap-3 rounded-lg p-2 -mx-2 hover:bg-surface-variant/40 transition-colors">
          <div class="w-10 shrink-0 text-center"><div class="font-mono font-bold text-[16px] text-on-surface leading-none">${d.getDate()}</div><div class="text-[11px] text-on-surface-variant">${MONTHS_TH_SHORT[d.getMonth()]}</div></div>
          <div class="flex-1 min-w-0 border-l-2 border-surface-variant pl-3">
            <div class="font-bold text-[13px] text-on-surface leading-snug">${esc(e.title)}</div>
            <div class="flex items-center gap-1.5 mt-0.5"><span class="w-1.5 h-1.5 rounded-full ${dot} shrink-0"></span><span class="text-[11px] text-on-surface-variant">${esc(e.type || "กิจกรรม")}</span></div>
          </div>
          ${sl("arrow_right",{size:14,color:"#9aa090",cls:"shrink-0 mt-1"})}
        </button>`;
      }).join("") : `<p class="text-[13px] text-on-surface-variant">ไม่มีกิจกรรมที่กำลังจะมาถึง</p>`;
      evEl.querySelectorAll("[data-ev-date]").forEach(b => b.addEventListener("click", () => {
        window._calendarJump = b.dataset.evDate; // ปฏิทินจะเปิดวันนี้ + โชว์รายละเอียด
        go("calendar");
      }));
    }

    const nwEl = document.getElementById("dash-news");
    if (nwEl) nwEl.innerHTML = newsItems.length ? newsItems.map(n => {
      const d = new Date(n.published_at);
      return `<button data-nav="news-page" class="w-full text-left flex gap-2 items-start rounded-lg p-2 -mx-2 hover:bg-surface-variant/40 transition-colors">
        <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
        <div class="flex-1 min-w-0"><div class="text-[13px] text-on-surface font-medium leading-snug line-clamp-2">${esc(n.title)}</div>
        <div class="text-[11px] text-on-surface-variant mt-0.5">${d.getDate()} ${MONTHS_TH_SHORT[d.getMonth()]} ${d.getFullYear() + 543} · ${esc(n.category)}</div></div>
        ${sl("arrow_right",{size:14,color:"#9aa090",cls:"shrink-0 mt-1"})}
      </button>`;
    }).join("") : `<p class="text-[13px] text-on-surface-variant">ยังไม่มีข่าวสาร</p>`;
    if (nwEl) nwEl.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", () => go(b.dataset.nav)));

    // stat cards: กิจกรรมใกล้ถึง = อันแรก · วันสอบถัดไป = อันแรกที่เป็นการสอบ
    const near = evs[0];
    const nearExam = evs.find(isExamEvent);
    if (near) setStat("stat-event", fmtDayMonth(near.event_date), near.title);
    if (nearExam) setStat("stat-exam", fmtDayMonth(nearExam.event_date), nearExam.title);
    else setStat("stat-exam", "—", "");
  } catch { /* ข้าม */ }

  // ---------- ความคืบหน้าจริงของเส้นทางหลัก ----------
  try {
    const paths = getPaths();
    const mainPath = paths.find(p => p.id === getMain()) || paths[0];
    if (mainPath && mainPath.programId) {
      const { roadmap } = await getProgramRoadmap(mainPath.programId, mainPath.uni);
      if (roadmap && roadmap.length) {
        if (mainPath.steps !== roadmap.length) { mainPath.steps = roadmap.length; savePaths(paths); } // backfill
        const done = getProgress(mainPath.id).filter(n => roadmap.some(s => s.step_number === n)).length;
        const pct = Math.round((done / roadmap.length) * 100);
        setStat("stat-progress", pct + "%", mainPath.name);
        const badge = document.getElementById("dash-rm-badge"); if (badge) badge.textContent = pct + "%";
        const pctEl = document.getElementById("dash-rm-pct"); if (pctEl) pctEl.textContent = pct + "%";
        const bar = document.getElementById("dash-rm-bar"); if (bar) bar.style.width = pct + "%";
        const stepsEl = document.getElementById("dash-rm-steps"); if (stepsEl) stepsEl.innerHTML = dashRealSteps(roadmap, mainPath.id);
      }
    }
  } catch { /* ข้าม */ }
}

/* horizontal step nodes for dashboard roadmap */
function dashSteps() {
  const steps = [
    { n: 1, label: "เลือกสาย\nการเรียน", sub: "ม.4", done: true },
    { n: 2, label: "สะสม\nPortfolio", sub: "ม.4-5", done: true },
    { n: 3, label: "เตรียมสอบ\nTPAT3", sub: "ม.5 ปัจจุบัน", current: true },
    { n: 4, label: "สมัคร\nTCAS รอบ 1", sub: "ต.ค. 69", done: false },
    { n: 5, label: "สอบ\nTGAT/TPAT", sub: "ม.ค. 70", done: false },
    { n: 6, label: "ประกาศ\nผลสอบ", sub: "พ.ค. 70", done: false },
  ];
  return steps.map((s, i) => {
    const dotCls = s.done
      ? "bg-primary border-primary text-on-primary shadow-[0_3px_0_#96a80a]"
      : s.current
        ? "bg-primary border-primary text-on-primary shadow-[0_3px_0_#96a80a] ring-4 ring-primary/30"
        : "bg-surface-container border-surface-variant text-on-surface-variant";
    const line = i < steps.length - 1
      ? `<div class="flex-1 h-0.5 mx-1 ${s.done ? "bg-primary" : "bg-surface-variant"}" style="min-width:20px"></div>`
      : "";
    const labelLines = s.label.split("\n");
    return `
      <div class="flex items-center flex-1 min-w-0">
        <div class="flex flex-col items-center gap-1 shrink-0">
          <div class="w-9 h-9 rounded-full border-2 flex items-center justify-center font-mono font-bold text-[13px] ${dotCls}">
            ${s.done && !s.current ? icon("check", { fill: true }) : s.n}
          </div>
          <div class="text-center" style="min-width:60px">
            <div class="font-bold text-[11px] text-on-surface leading-tight">${labelLines[0]}</div>
            <div class="font-bold text-[11px] ${s.current ? "text-primary" : "text-on-surface"} leading-tight">${labelLines[1] || ""}</div>
            <div class="text-[10px] text-on-surface-variant">${s.sub}</div>
          </div>
        </div>
        ${line}
      </div>`;
  }).join("");
}

/* horizontal step nodes จาก roadmap จริงของเส้นทางหลัก (done/current ตาม progress) */
function dashRealSteps(roadmap, pathId) {
  const completed = getProgress(pathId);
  const cur = currentStepNumber(roadmap, completed);
  return roadmap.map((s, i) => {
    const done = completed.includes(s.step_number);
    const current = s.step_number === cur;
    const dotCls = done
      ? "bg-primary border-primary text-on-primary shadow-[0_3px_0_#96a80a]"
      : current
        ? "bg-primary border-primary text-on-primary shadow-[0_3px_0_#96a80a] ring-4 ring-primary/30"
        : "bg-surface-container border-surface-variant text-on-surface-variant";
    const line = i < roadmap.length - 1
      ? `<div class="flex-1 h-0.5 mx-1 ${done ? "bg-primary" : "bg-surface-variant"}" style="min-width:20px"></div>`
      : "";
    return `
      <div class="flex items-center flex-1 min-w-0">
        <div class="flex flex-col items-center gap-1 shrink-0">
          <div class="w-9 h-9 rounded-full border-2 flex items-center justify-center font-mono font-bold text-[13px] ${dotCls}">
            ${done ? icon("check", { fill: true }) : s.step_number}
          </div>
          <div class="text-center" style="width:74px">
            <div class="font-bold text-[10px] ${current ? "text-primary" : "text-on-surface"} leading-tight line-clamp-2">${esc(s.title)}</div>
            ${s.target_period ? `<div class="text-[9px] text-on-surface-variant mt-0.5">${esc(s.target_period)}</div>` : ""}
          </div>
        </div>
        ${line}
      </div>`;
  }).join("");
}

/* --- create-path (ยังใช้เป็น modal/flow entry) --- */
function viewCreatePath() {
  return viewDashboard();
}

/* --- name-path --- */
function viewNamePath() {
  return shellCentered(`
    ${backBtn("create-path")}
    <div class="mb-xl">
      <h1 class="font-display font-extrabold text-[26px] text-on-surface">ตั้งชื่อเส้นทาง</h1>
      <p class="text-on-surface-variant mt-1">เช่น “หมอในฝัน” หรือ “วิศวะ จุฬา”</p>
    </div>
    <input id="path-name" type="text" maxlength="40" value="${esc(state.flow.name)}"
      placeholder="ชื่อเส้นทางของคุณ"
      class="ob-input text-[18px] mb-xl" />
    <button id="btn-next" class="tactile-button w-full bg-primary-container text-on-primary font-bold text-[17px] rounded-xl py-md border-b-4 border-[#96a80a] flex items-center justify-center gap-sm">
      ถัดไป ${icon("arrow_forward")}
    </button>
  `);
}

/* --- track --- */
function viewTrack() {
  const cards = TRACKS.map((t) => `
    <button data-track="${t.key}" class="tactile-button w-full text-left flex items-center gap-md bg-surface-container-lowest border-2 border-surface-variant rounded-xl p-md shadow-[0_4px_0_#0d0f08]">
      <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">${sl(t.icon, { size: 24, color: "#c2d90f" })}</div>
      <div class="flex-1">
        <div class="font-headline font-bold text-[18px] text-on-surface">${t.label}</div>
        <div class="text-[13px] text-on-surface-variant">${t.desc}</div>
      </div>
      ${icon("chevron_right", { cls: "text-outline" })}
    </button>`).join("");
  return shellCentered(`
    ${backBtn("name-path")}
    <div class="mb-xl">
      <h1 class="font-display font-extrabold text-[26px] text-on-surface">สายการเรียนของคุณ</h1>
      <p class="text-on-surface-variant mt-1">เราจะกรองเฉพาะหลักสูตรที่รับสายของคุณ</p>
    </div>
    <div class="space-y-md">${cards}</div>
  `);
}

/* --- faculty --- */
async function viewFaculty() {
  $app().innerHTML = shellCentered(`${backBtn("track")}<div class="py-2xl flex justify-center">${loader()}</div>`);
  let faculties = [];
  try { faculties = await fetchFaculties(); }
  catch (e) { toast("โหลดคณะไม่สำเร็จ ลองใหม่อีกครั้ง"); return; }
  const cards = faculties.map((f) => `
    <button data-fac="${f.id}" data-fac-name="${esc(f.name_th)}" class="tactile-button w-full text-left flex items-center gap-md bg-surface-container-lowest border-2 border-surface-variant rounded-xl px-md py-3 shadow-[0_4px_0_#0d0f08]">
      <div class="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">${icon("school", { cls: "text-primary" })}</div>
      <div class="flex-1 font-headline font-bold text-[16px] text-on-surface">${esc(f.name_th)}</div>
      ${icon("chevron_right", { cls: "text-outline" })}
    </button>`).join("");
  $app().innerHTML = shellCentered(`
    ${backBtn("track")}
    <div class="mb-lg">
      <h1 class="font-display font-extrabold text-[26px] text-on-surface">เลือกคณะที่สนใจ</h1>
      <p class="text-on-surface-variant mt-1">สาย ${esc(TRACKS.find((t) => t.key === state.flow.track)?.label || "")}</p>
    </div>
    <div class="space-y-sm">${cards}</div>
  `);
  wireCommon();
  $app().querySelectorAll("[data-fac]").forEach((b) => b.addEventListener("click", () => {
    state.flow.facultyId = +b.dataset.fac;
    state.flow.facultyName = b.dataset.facName;
    go("programs");
  }));
}

/* --- programs --- */
/* ช่วงค่าเทอม (บาท/เทอม) สำหรับตัวกรอง */
const TUITION_RANGES = {
  "0": { label: "≤ 20,000", lo: 0, hi: 20000 },
  "1": { label: "20,001–40,000", lo: 20001, hi: 40000 },
  "2": { label: "40,001–80,000", lo: 40001, hi: 80000 },
  "3": { label: "> 80,000", lo: 80001, hi: Infinity },
};

function programCard(p) {
  const uni = p.universities?.name_th || "";
  const campus = p.universities?.campus_name && p.universities.campus_name !== "วิทยาเขตหลัก" ? " · " + p.universities.campus_name : "";
  const region = p.universities?.region || "";
  const name = p.major_clean || p.major_name || p.degree_name || "หลักสูตร";
  return `
    <button data-prog='${esc(JSON.stringify({ id: p.id, name, uni }))}' class="tactile-button w-full text-left bg-surface-container-lowest border-2 border-surface-variant rounded-xl p-md shadow-[0_4px_0_#0d0f08]">
      <div class="flex items-start justify-between gap-sm">
        <div class="font-headline font-bold text-[16px] text-on-surface leading-snug">${esc(name)}</div>
        <span class="shrink-0 text-[11px] font-bold text-primary bg-primary-container/15 rounded-full px-2 py-0.5">${esc(p.program_type || "")}</span>
      </div>
      <div class="text-[13px] text-on-surface-variant mt-1">${esc(uni)}${esc(campus)}</div>
      <div class="flex items-center justify-between gap-2 mt-2">
        <div class="text-[13px] font-bold ${p.tuition_fee == null ? "text-outline" : "text-secondary"}">${icon("payments", { cls: "text-[16px] align-middle" })} ${fmtTuition(p.tuition_fee)}</div>
        ${region ? `<span class="shrink-0 text-[11px] font-medium text-on-surface-variant bg-surface-variant/60 rounded-full px-2 py-0.5">${esc(region)}</span>` : ""}
      </div>
    </button>`;
}

async function viewPrograms() {
  $app().innerHTML = shellCentered(`${backBtn("faculty")}<div class="py-2xl flex justify-center">${loader()}</div>`);
  const trackFlag = TRACKS.find((t) => t.key === state.flow.track)?.flag || "accepts_sci_math";
  let programs = [];
  try { programs = await fetchPrograms(state.flow.facultyId, trackFlag); }
  catch (e) { toast("โหลดหลักสูตรไม่สำเร็จ ลองใหม่อีกครั้ง"); return; }

  // ภูมิภาคที่มีจริงในผลลัพธ์ (เรียงตามจำนวนมาก→น้อย)
  const regionCount = {};
  programs.forEach((p) => { const r = p.universities?.region; if (r) regionCount[r] = (regionCount[r] || 0) + 1; });
  const regions = Object.keys(regionCount).sort((a, b) => regionCount[b] - regionCount[a]);

  const selCls = "ob-input pr-9 text-[14px]";
  const wrapSel = (inner) => `<div class="relative">${inner}<span class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[12px]">▾</span></div>`;

  const filterBar = `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-md">
      ${wrapSel(`<select id="f-region" class="${selCls}">
        <option value="all">🌏 ทุกภูมิภาค</option>
        ${regions.map((r) => `<option value="${esc(r)}">${esc(r)} (${regionCount[r]})</option>`).join("")}
      </select>`)}
      ${wrapSel(`<select id="f-range" class="${selCls}">
        <option value="all">ค่าเทอม: ทั้งหมด</option>
        ${Object.entries(TUITION_RANGES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("")}
      </select>`)}
      ${wrapSel(`<select id="f-sort" class="${selCls}">
        <option value="default">เรียง: เริ่มต้น</option>
        <option value="asc">ค่าเทอม: ต่ำ → สูง</option>
        <option value="desc">ค่าเทอม: สูง → ต่ำ</option>
      </select>`)}
    </div>`;

  $app().innerHTML = shellCentered(`
    ${backBtn("faculty")}
    <div class="mb-md">
      <h1 class="font-display font-extrabold text-[24px] text-on-surface">${esc(state.flow.facultyName)}</h1>
      <p class="text-on-surface-variant mt-1" id="prog-count">${programs.length} หลักสูตร · เลือก 1 เพื่อดูโรดแมป</p>
    </div>
    ${programs.length ? filterBar : ""}
    <div id="prog-list" class="space-y-md"></div>
  `);
  wireCommon();

  const listEl = document.getElementById("prog-list");
  const countEl = document.getElementById("prog-count");
  const regionSel = document.getElementById("f-region");
  const rangeSel = document.getElementById("f-range");
  const sortSel = document.getElementById("f-sort");

  function applyFilters() {
    let list = programs.slice();
    if (regionSel && regionSel.value !== "all") list = list.filter((p) => (p.universities?.region || "") === regionSel.value);
    if (rangeSel && rangeSel.value !== "all") {
      const r = TUITION_RANGES[rangeSel.value];
      list = list.filter((p) => p.tuition_fee != null && p.tuition_fee >= r.lo && p.tuition_fee <= r.hi);
    }
    if (sortSel && sortSel.value === "asc") list.sort((a, b) => (a.tuition_fee ?? Infinity) - (b.tuition_fee ?? Infinity));
    else if (sortSel && sortSel.value === "desc") list.sort((a, b) => (b.tuition_fee ?? -Infinity) - (a.tuition_fee ?? -Infinity));

    if (countEl) countEl.textContent = `${list.length} หลักสูตร · เลือก 1 เพื่อดูโรดแมป`;
    listEl.innerHTML = list.length
      ? list.map(programCard).join("")
      : `<div class="text-center text-on-surface-variant py-xl">ไม่พบหลักสูตรตามตัวกรอง<br/>ลองปรับภูมิภาคหรือช่วงค่าเทอมดูนะ</div>`;
    listEl.querySelectorAll("[data-prog]").forEach((b) => b.addEventListener("click", () => {
      state.flow.program = JSON.parse(b.dataset.prog);
      go("cooking");
    }));
  }

  if (!programs.length) {
    listEl.innerHTML = `<div class="text-center text-on-surface-variant py-xl">ไม่พบหลักสูตรในคณะที่เลือก<br/>ลองเปลี่ยนคณะหรือสายการเรียนดูนะ</div>`;
  } else {
    [regionSel, rangeSel, sortSel].forEach((s) => s && s.addEventListener("change", applyFilters));
    applyFilters();
  }
}

/* --- cooking ("Let me cook") --- */
async function viewCooking() {
  $app().innerHTML = `
    <div class="dotted-grid min-h-screen flex flex-col items-center justify-center gap-md px-md text-center">
      <div class="mascot-float">${nexMascot("mascot w-28 h-28", { pose: "think" })}</div>
      <div class="cook-spinner" style="width:44px;height:44px;border-width:5px"></div>
      <h2 class="font-display font-extrabold text-[22px] text-primary mt-2">น้องเน็กซ์กำลังปรุงโรดแมปให้...</h2>
      <p class="text-on-surface-variant">รวบรวมรอบ TCAS และวิชาที่ต้องใช้</p>
    </div>`;

  const prog = state.flow.program;
  // spec §5.1 — try/catch, min ~900ms spinner, then transition; toast on failure.
  try {
    const [{ rounds, roadmap }] = await Promise.all([
      getProgramRoadmap(prog.id, prog.uni),   // เส้นทางเตรียมตัวสร้างจากรอบที่หลักสูตรนี้เปิดจริง
      new Promise((r) => setTimeout(r, 900)),
    ]);
    state.flow.rounds = rounds;
    state.flow.roadmap = roadmap;

    // Persist path (localStorage; Phase 3 → user_paths). Skip when re-opening an existing path.
    if (!state.flow.reopen) {
      const paths = getPaths();
      const rec = { id: uid(), name: state.flow.name || prog.name, programId: prog.id, programName: prog.name, uni: prog.uni, track: state.flow.track, facultyId: state.flow.facultyId || null, steps: roadmap.length, createdAt: Date.now() };
      paths.unshift(rec);
      savePaths(paths);
      if (!getMain()) setMain(rec.id);
      state.flow.pathId = rec.id;
    }

    go("roadmap");
  } catch (e) {
    toast("ปรุงโรดแมปไม่สำเร็จ ลองใหม่อีกครั้ง");
    setTimeout(() => go("programs"), 800);
  }
}

/* --- roadmap (the payoff) --- */
function viewRoadmap() {
  const prog = state.flow.program || {};
  const roadmap = state.flow.roadmap || [];
  const rounds = state.flow.rounds || [];
  const pathId = state.flow.pathId;
  const p = roadmapProgress(roadmap, pathId);

  // TCAS round pills → open detail panel
  const roundPills = rounds.length ? rounds.map((r, i) => `
    <button data-round="${i}" class="tactile-button shrink-0 flex items-center gap-sm bg-surface-container-lowest border-2 border-surface-variant rounded-xl px-md py-3 shadow-[0_3px_0_#0d0f08]">
      <div class="w-8 h-8 rounded-full bg-tertiary-container/40 flex items-center justify-center font-headline font-extrabold text-tertiary">${r.round_number || "?"}</div>
      <div class="text-left">
        <div class="font-bold text-[13px] text-on-surface whitespace-nowrap">${esc(r.round_label || "รอบ " + r.round_number)}</div>
        <div class="text-[11px] text-on-surface-variant">${r.quota ? "รับ ~" + r.quota + " คน" : "ดูรายละเอียด"}</div>
      </div>
    </button>`).join("")
    : `<div class="text-on-surface-variant text-[14px] px-1">ยังไม่มีข้อมูลรอบรับสมัครสำหรับหลักสูตรนี้</div>`;

  // BUG-6: use dashShell not shellApp (old orphan topbar)
  return dashShell(`
    <div class="flex items-center gap-3 mb-4">
      <button data-nav="roadmap-list" class="p-2 rounded-xl border border-surface-variant text-on-surface-variant hover:border-primary transition-colors">
        ${sl("arrow_left",{size:18})}
      </button>
      <div class="min-w-0">
        <h1 class="font-display font-bold text-[20px] text-primary leading-tight truncate">${esc(state.flow.name || prog.name || "เส้นทางของคุณ")}</h1>
        <p class="text-[12px] text-on-surface-variant truncate">${esc(prog.name || "")}${prog.uni ? " · " + esc(prog.uni) : ""}</p>
      </div>
      <span data-rm-badge class="shrink-0 ml-auto text-[12px] font-mono font-bold text-primary bg-primary/10 border border-primary/30 rounded-lg px-2 py-1">เสร็จ ${p.done}/${p.total}</span>
    </div>

    <!-- progress bar -->
    <div class="mb-5">
      <div class="flex items-center justify-between mb-1">
        <span class="text-[12px] text-on-surface-variant">ความคืบหน้า</span>
        <span data-rm-pct class="text-[12px] font-mono font-bold text-primary">${p.pct}%</span>
      </div>
      <div class="h-2.5 rounded-full bg-surface-variant overflow-hidden">
        <div data-rm-bar class="h-full rounded-full bg-primary" style="width:${p.pct}%;transition:width .5s cubic-bezier(.32,.78,.2,1)"></div>
      </div>
    </div>

    <h2 class="font-display font-bold text-[13px] text-on-surface-variant mb-2 flex items-center gap-1.5">${sl("target",{size:16,color:"#9aa090"})} รอบรับสมัคร TCAS <span class="font-normal">· แตะเพื่อดูสัดส่วนคะแนนแต่ละรอบ</span></h2>
    <div class="flex gap-sm overflow-x-auto no-scrollbar pb-2 mb-4">${roundPills}</div>

    <!-- สัดส่วนคะแนนเข้าคณะ (กดดูเพิ่มเติม) -->
    <div class="bg-surface-container-lowest border-2 border-surface-variant rounded-xl mb-5 overflow-hidden">
      <button id="rm-weights-toggle" class="w-full flex items-center justify-between gap-2 px-md py-3 text-left">
        <span class="font-display font-bold text-[14px] text-on-surface flex items-center gap-1.5">${sl("chart",{size:16,color:"#c2d90f"})} สัดส่วนคะแนนที่ใช้เข้าคณะ</span>
        <span class="text-[12px] text-on-surface-variant flex items-center gap-1"><span id="rm-weights-hint">กดดูเพิ่มเติม</span> <span id="rm-weights-caret" class="transition-transform">${sl("arrow_right",{size:16,color:"#9aa090"})}</span></span>
      </button>
      <div id="rm-weights" class="hidden px-md pb-md"></div>
    </div>

    <h2 class="font-display font-bold text-[13px] text-on-surface-variant mb-3 flex items-center gap-1.5">${sl("route",{size:16,color:"#9aa090"})} เส้นทางเตรียมตัว <span class="font-normal text-on-surface-variant">· แตะวงกลมหรือปุ่มเพื่อทำเครื่องหมายเสร็จ</span></h2>
    <div class="relative">
      <div class="absolute left-[23px] top-4 bottom-4 w-0.5 bg-surface-variant"></div>
      <div id="rm-timeline">${roadmap.length ? roadmapTimelineHTML(roadmap, pathId) : `<div class="text-on-surface-variant">ยังไม่มีขั้นตอนโรดแมปสำหรับหลักสูตรนี้</div>`}</div>
    </div>
    ${detailPanelSkeleton()}
  `);
}

/* ---------- Detail panel (round วิชา + น้ำหนัก%) ---------- */
function detailPanelSkeleton() {
  return `
    <div id="panel-scrim" class="fixed inset-0 bg-black/40 opacity-0 pointer-events-none transition-opacity z-40"></div>
    <div id="detail-panel" class="detail-panel hidden-panel fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl border-t-4 border-surface-variant max-h-[80vh] overflow-y-auto">
      <div class="max-w-md md:max-w-2xl mx-auto p-lg pb-2xl">
        <div class="w-12 h-1.5 bg-surface-variant rounded-full mx-auto mb-lg"></div>
        <div id="detail-body"></div>
      </div>
    </div>`;
}
/* ============================================================
   Roadmap step detail (คลิก card → รายละเอียดเชิงลึก + ลิงก์)
   ============================================================ */
const MYTCAS_STUDENT = "https://student.mytcas.com";
const MYTCAS_WWW = "https://www.mytcas.com";
const uniSearchUrl = (uni, q) => "https://www.google.com/search?q=" + encodeURIComponent(((uni || "") + " " + q).trim());
const _tcas70FacCache = {};

// ผลงานแนะนำสำหรับพอร์ต ตามคณะ (คีย์ = TCAS70 faculty key)
const PORTFOLIO_TIPS = {
  med: ["ค่าย/โครงงานวิทยาศาสตร์สุขภาพ ชีววิทยา เคมี", "จิตอาสาโรงพยาบาล/สาธารณสุข/ชุมชน", "เกียรติบัตรแข่งชีววิทยา–เคมีโอลิมปิก", "งานวิจัย/โครงงานเกี่ยวกับสุขภาพ"],
  dent: ["โครงงานวิทย์สุขภาพ/ชีววิทยา", "จิตอาสาทันตกรรม/สาธารณสุข", "ผลงานที่ใช้ความละเอียด–งานฝีมือ (สื่อถึงทักษะมือ)", "เกียรติบัตรวิทยาศาสตร์"],
  pharm: ["โครงงานเคมี/ชีววิทยา", "ค่ายวิทยาศาสตร์", "จิตอาสาด้านสุขภาพ/ร้านยา", "เกียรติบัตรเคมีโอลิมปิก"],
  nurse: ["จิตอาสาโรงพยาบาล/ดูแลผู้ป่วย–ผู้สูงอายุ", "โครงงานสุขภาพชุมชน", "เกียรติบัตรชีววิทยา", "กิจกรรมช่วยเหลือสังคม"],
  vet: ["จิตอาสา/ดูแลสัตว์ ปศุสัตว์", "โครงงานชีววิทยา/สัตวศาสตร์", "ค่ายวิทยาศาสตร์", "เกียรติบัตรชีววิทยา"],
  eng: ["แข่งขันหุ่นยนต์/สิ่งประดิษฐ์/STEM", "โครงงานวิศวกรรม–นวัตกรรม", "ค่ายวิศวะ", "เกียรติบัตรคณิต–ฟิสิกส์โอลิมปิก"],
  compsci: ["แข่งเขียนโปรแกรม/แฮกกาธอน", "โปรเจกต์เว็บ/แอป/เกม (แนบ GitHub)", "เกียรติบัตรคอมพิวเตอร์โอลิมปิก", "คอร์สออนไลน์ + ใบรับรอง"],
  sci: ["โครงงานวิทยาศาสตร์", "ค่ายวิทย์/โอลิมปิกวิชาการ", "งานวิจัยระดับโรงเรียน", "เกียรติบัตรวิชาการ"],
  arch: ["พอร์ตงานออกแบบ/สเก็ตช์/โมเดล", "ผลงานศิลปะ–สถาปัตย์", "ค่ายสถาปัตย์", "รางวัลประกวดออกแบบ"],
  account: ["โครงงาน/แผนธุรกิจ", "แข่งตอบปัญหาเศรษฐศาสตร์/บัญชี", "กิจกรรมผู้นำ/สหกรณ์โรงเรียน", "คอร์สการเงิน + ใบรับรอง"],
  econ: ["โครงงานเศรษฐศาสตร์/ธุรกิจ", "แข่งตอบปัญหาเศรษฐศาสตร์", "กิจกรรมวิเคราะห์ข้อมูล", "คอร์สออนไลน์เศรษฐศาสตร์"],
  law: ["โต้วาที/ตอบปัญหากฎหมาย", "ศาลจำลอง (Moot court)", "กิจกรรมสภานักเรียน", "เรียงความประเด็นสังคม–กฎหมาย"],
  polsci: ["กิจกรรมสภานักเรียน/ผู้นำ", "จำลองสหประชาชาติ (MUN)/โต้วาที", "จิตอาสาชุมชน", "เรียงความประเด็นสังคม"],
  arts: ["ผลงานเขียน/แปล/วรรณกรรม", "แข่งภาษา/สุนทรพจน์", "ชมรมวรรณศิลป์", "เกียรติบัตรภาษา"],
  comm: ["ผลงานสื่อ: คลิป/ถ่ายภาพ/กราฟิก", "เขียนข่าว/บทความ/ดูแลเพจ", "กิจกรรมประชาสัมพันธ์โรงเรียน", "รางวัลสื่อ/หนังสั้น"],
  edu: ["จิตอาสาสอน/ติวน้อง", "ค่ายอาสาพัฒนา", "กิจกรรมครูผู้ช่วย", "สื่อการสอนที่ทำเอง"],
  psych: ["จิตอาสา/ให้คำปรึกษาเพื่อน", "โครงงานพฤติกรรม/สังคม", "คอร์สจิตวิทยาออนไลน์", "ชมรมแนะแนว"],
  fineart: ["พอร์ตผลงานศิลปะ/ออกแบบ", "ประกวดศิลปะ/ผลงานสร้างสรรค์", "ร่วมนิทรรศการ/แสดงผลงาน", "รางวัลศิลปกรรม"],
};

function roadmapStepKind(title) {
  const t = title || "";
  if (/(เตรียม|สะสม).*(แฟ้ม|portfolio|พอร์ต)/i.test(t) || /(แฟ้ม|พอร์ต).*(สะสม|เตรียม)/i.test(t)) return "portfolio";
  if (/ยื่น|สมัคร.*รอบ|รอบ\s*ที่?\s*1|รอบ\s*1/i.test(t)) return "submit";
  if (/tpat\s*1|กสพท/i.test(t)) return "tpat1";
  if (/tgat|tpat/i.test(t)) return "central";
  if (/a-?level|a-?lv/i.test(t)) return "alevel";
  if (/สัมภาษณ์|interview/i.test(t)) return "interview";
  if (/ประกาศ|result|ยืนยันสิทธิ/i.test(t)) return "result";
  return "generic";
}

async function resolveTcas70Faculty(ctx) {
  if (!ctx) return null;
  if (typeof TCAS70 === "undefined") return null;
  if (ctx.facultyId) return TCAS70.faculties.find((f) => f.key === FACID_TO_TCAS70[ctx.facultyId]) || null;
  if (ctx.programId) {
    if (_tcas70FacCache[ctx.programId] !== undefined) return _tcas70FacCache[ctx.programId];
    try {
      const { data } = await db.from("programs").select("faculty_id").eq("id", ctx.programId).maybeSingle();
      const f = TCAS70.faculties.find((x) => x.key === FACID_TO_TCAS70[data?.faculty_id]) || null;
      _tcas70FacCache[ctx.programId] = f;
      return f;
    } catch { return null; }
  }
  return null;
}

const _fxBullets = (arr) => `<ul class="space-y-1.5">${arr.filter(Boolean).map((x) => `<li class="flex items-start gap-2 text-[13px] text-on-surface leading-relaxed"><span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span><span class="flex-1">${esc(x)}</span></li>`).join("")}</ul>`;
const _fxLinkPrimary = (href, label, ic = "link") => `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" class="tactile-button flex items-center justify-center gap-2 w-full bg-primary-container text-on-primary font-display font-bold text-[14px] rounded-xl py-2.5 border-b-4 border-[#6b7a08]">${sl(ic, { size: 16, color: "#16180f" })} ${esc(label)}</a>`;
const _fxLinkOutline = (href, label, ic = "school") => `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 w-full border-2 border-surface-variant text-on-surface font-bold text-[14px] rounded-xl py-2.5 hover:border-primary transition-colors">${sl(ic, { size: 16, color: "#9aa090" })} ${esc(label)}</a>`;
function _weightsText(fac, filterFn) {
  if (!fac) return "";
  return Object.entries(fac.weights).filter(([k]) => filterFn(k)).sort((a, b) => b[1] - a[1])
    .map(([k, w]) => `${(TCAS70.subjects[k]?.label || subjectLabel(k))} ${w}%`).join(" · ");
}

// เปิดแผงรายละเอียดของขั้นตอน roadmap (คลิก card)
async function openRoadmapStep(step, ctx) {
  const body = document.getElementById("detail-body");
  const panel = document.getElementById("detail-panel");
  const scrim = document.getElementById("panel-scrim");
  if (!body || !panel || !scrim) return;
  const close = () => { panel.classList.add("hidden-panel"); scrim.classList.add("opacity-0", "pointer-events-none"); };
  body.innerHTML = `<div class="flex justify-center py-10"><div class="cook-spinner"></div></div>`;
  panel.classList.remove("hidden-panel");
  scrim.classList.remove("opacity-0", "pointer-events-none");
  scrim.onclick = close;

  const fac = await resolveTcas70Faculty(ctx);
  const uni = (ctx && ctx.uni) || "";
  const kind = roadmapStepKind(step.title);
  let content = "";

  if (kind === "portfolio") {
    const tips = fac && PORTFOLIO_TIPS[fac.key];
    content = `
      <div class="mb-4">
        <div class="font-display font-bold text-[14px] text-on-surface mb-2">${sl("target",{size:15,color:"#c2d90f",cls:"inline align-middle"})} ผลงานแนะนำสำหรับ${fac ? " " + esc(fac.label) : "คณะนี้"}</div>
        ${tips ? _fxBullets(tips) : `<p class="text-[13px] text-on-surface-variant">เตรียมผลงานที่เกี่ยวข้องกับสาขา — โครงงาน กิจกรรม การแข่งขัน และเกียรติบัตร</p>`}
      </div>
      <div class="mb-4">
        <div class="font-display font-bold text-[14px] text-on-surface mb-2">เคล็ดลับจัดพอร์ต</div>
        ${_fxBullets(["ปกติไม่เกิน 10 หน้า (ตามที่คณะกำหนด) — เน้นคุณภาพมากกว่าปริมาณ", "เรียงผลงานเด่นไว้หน้าแรก + สรุปสิ่งที่ได้เรียนรู้", "ระบุบทบาทของตัวเองในแต่ละกิจกรรมให้ชัด", "แนบเกียรติบัตร/หลักฐานให้ครบ"])}
      </div>`;
  } else if (kind === "central") {
    const subj = _weightsText(fac, (k) => k === "tgat" || /^tpat/.test(k));
    content = `
      <div class="mb-4">${_fxBullets(["สมัครสอบผ่านระบบ myTCAS (student.mytcas.com)", "TGAT + TPAT2–5 สอบ 30 ม.ค.–1 ก.พ. 2570", subj ? `วิชาที่คณะนี้ให้น้ำหนัก: ${subj}` : "เลือกสอบวิชาตามเกณฑ์ของคณะ", "ทบทวนแนวข้อสอบ TGAT/TPAT ล่วงหน้า"])}</div>
      <div class="space-y-2">${_fxLinkPrimary(MYTCAS_STUDENT, "สมัครสอบที่ myTCAS", "link")}</div>`;
  } else if (kind === "tpat1") {
    content = `
      <div class="mb-4">${_fxBullets(["TPAT1 วิชาเฉพาะ กสพท. (สำหรับสายแพทย์/ทันตะ/สัตวแพทย์/เภสัช)", "สอบ 13 ก.พ. 2570", "สมัครผ่าน myTCAS + สมัครกับ กสพท. ตามประกาศ"])}</div>
      <div class="space-y-2">${_fxLinkPrimary(MYTCAS_STUDENT, "เข้าระบบ myTCAS", "link")}</div>`;
  } else if (kind === "alevel") {
    const subj = _weightsText(fac, (k) => /^a_?lv_/.test(k));
    content = `
      <div class="mb-4">${_fxBullets(["A-Level สอบ 13–15 มี.ค. 2570", subj ? `วิชาที่คณะนี้ใช้: ${subj}` : "เลือกสอบวิชาตามที่คณะกำหนด", "สมัครผ่าน myTCAS"])}</div>
      <div class="space-y-2">${_fxLinkPrimary(MYTCAS_STUDENT, "สมัครสอบที่ myTCAS", "link")}</div>`;
  } else if (kind === "submit") {
    content = `
      <div class="mb-4">${_fxBullets(["ยื่นสมัครผ่านระบบ myTCAS ในช่วงรอบที่กำหนด", "ตรวจสอบเกณฑ์/เอกสารที่มหาวิทยาลัยกำหนดเพิ่มเติม", uni ? `บางที่ต้องสมัครผ่านระบบรับสมัครของ ${uni} ด้วย` : "บางที่ต้องสมัครผ่านระบบของมหาวิทยาลัยด้วย", "อย่าลืมกดยืนยันสิทธิ์ในช่วงเวลาที่กำหนด"])}</div>
      <div class="space-y-2">
        ${_fxLinkPrimary(MYTCAS_STUDENT, "เข้าระบบ myTCAS", "link")}
        ${uni ? _fxLinkOutline(uniSearchUrl(uni, "รับสมัคร TCAS รอบ 1 Portfolio"), "ค้นหารับสมัครของ " + uni, "school") : ""}
      </div>`;
  } else if (kind === "interview") {
    content = `<div class="mb-4">${_fxBullets(["เตรียมตอบว่าทำไมอยากเข้าคณะนี้ + แผนอนาคต", "ทบทวนผลงานในพอร์ตให้พร้อมเล่า", "แต่งกายสุภาพ ตรงต่อเวลา", "ติดตามวัน–สถานที่สัมภาษณ์จากประกาศของคณะ"])}</div>`;
  } else if (kind === "result") {
    content = `
      <div class="mb-4">${_fxBullets(["ตรวจผลและ กดยืนยันสิทธิ์ ในระบบ myTCAS ตามกำหนด", "ถ้าไม่ยืนยันสิทธิ์ = สละสิทธิ์รอบนั้น", "ถ้าต้องการลุ้นรอบถัดไป สามารถสละสิทธิ์เพื่อไปรอบต่อไปได้"])}</div>
      <div class="space-y-2">${_fxLinkPrimary(MYTCAS_STUDENT, "เข้าระบบ myTCAS", "link")}</div>`;
  } else {
    content = `<div class="mb-4">${_fxBullets([step.description || "ทำตามขั้นตอนนี้ให้เรียบร้อยตามช่วงเวลาที่กำหนด", "ติดตามประกาศจาก myTCAS และมหาวิทยาลัยอย่างสม่ำเสมอ"])}</div>
      <div class="space-y-2">${_fxLinkPrimary(MYTCAS_WWW, "ดูข้อมูล TCAS ที่ mytcas.com", "link")}</div>`;
  }

  body.innerHTML = `
    <div class="flex items-center gap-sm mb-1">
      <div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-headline font-extrabold text-on-primary text-lg shrink-0">${step.step_number}</div>
      <div class="min-w-0">
        <h3 class="font-display font-extrabold text-[19px] text-on-surface leading-snug">${esc(step.title)}</h3>
        ${step.target_period ? `<div class="text-[12px] font-bold text-secondary">${esc(step.target_period)}</div>` : ""}
      </div>
    </div>
    ${step.description ? `<p class="text-[14px] text-on-surface-variant mt-1 mb-3 leading-relaxed">${esc(step.description)}</p>` : `<div class="mb-2"></div>`}
    ${content}
    <div class="text-[11px] text-on-surface-variant leading-relaxed border-t border-surface-variant pt-2 mt-1">${sl("info",{size:12,color:"#9aa090",cls:"inline align-middle"})} วันที่/เกณฑ์อ้างอิง TCAS70 (ประมาณการ) — ตรวจสอบกำหนดการจริงที่ mytcas.com และประกาศของแต่ละมหาวิทยาลัย</div>
    <button id="panel-close" class="tactile-button w-full mt-lg bg-surface-container-high text-on-surface font-bold rounded-xl py-3 border-b-4 border-surface-variant">ปิด</button>`;
  document.getElementById("panel-close").addEventListener("click", close);
}

function openRound(r) {
  const scores = r.scores || {};
  const hasScores = Object.keys(scores).length > 0;
  const breakdown = hasScores
    ? scoreBreakdownGroupsHTML(scores)
    : `<p class="text-on-surface-variant text-[14px]">รอบนี้ไม่ระบุสัดส่วนคะแนนกลาง (มักพิจารณาจากแฟ้ม/สัมภาษณ์ หรือดูประกาศของหลักสูตร)</p>`;

  const meta = [];
  if (r.quota) meta.push(`${icon("groups", { cls: "text-[18px]" })} รับ ~${r.quota} คน`);
  if (r.min_gpax) meta.push(`${icon("grade", { cls: "text-[18px]" })} GPAX ขั้นต่ำ ${r.min_gpax}`);
  if (r.min_total_score) meta.push(`${icon("scoreboard", { cls: "text-[18px]" })} คะแนนรวมขั้นต่ำ ${r.min_total_score}`);

  document.getElementById("detail-body").innerHTML = `
    <div class="flex items-center gap-sm mb-1">
      <div class="w-10 h-10 rounded-full bg-tertiary-container/40 flex items-center justify-center font-headline font-extrabold text-tertiary text-lg">${r.round_number || "?"}</div>
      <h3 class="font-display font-extrabold text-[20px] text-on-surface">${esc(r.round_label || "รอบ " + r.round_number)}</h3>
    </div>
    ${r.project_name ? `<p class="text-on-surface-variant text-[14px] mb-md">${esc(r.project_name)}</p>` : `<div class="mb-md"></div>`}

    <div class="mb-lg">
      <div class="font-headline font-bold text-[14px] text-on-surface-variant mb-sm">สัดส่วนคะแนน & น้ำหนัก (รอบนี้)</div>
      ${breakdown}
    </div>

    ${meta.length ? `<div class="grid grid-cols-1 gap-2 text-[14px] text-on-surface font-medium">${meta.map((m) => `<div class="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">${m}</div>`).join("")}</div>` : ""}

    <button id="panel-close" class="tactile-button w-full mt-lg bg-surface-container-high text-on-surface font-bold rounded-xl py-3 border-b-4 border-surface-variant">ปิด</button>
  `;
  const panel = document.getElementById("detail-panel");
  const scrim = document.getElementById("panel-scrim");
  panel.classList.remove("hidden-panel");
  scrim.classList.remove("opacity-0", "pointer-events-none");
  const close = () => { panel.classList.add("hidden-panel"); scrim.classList.add("opacity-0", "pointer-events-none"); };
  document.getElementById("panel-close").addEventListener("click", close);
  scrim.addEventListener("click", close);
}

/* ปุ่ม Google (ใช้ทั้ง login/register) */
function googleBtn(label) {
  return `<button id="au-google" class="w-full min-h-[52px] rounded-2xl border-2 border-surface-variant bg-surface-container-low text-on-surface font-display font-bold text-[16px] flex items-center justify-center gap-3 hover:border-primary transition-colors">
    <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
    ${label}
  </button>`;
}
function authDivider() {
  return `<div class="flex items-center gap-3 my-1">
    <div class="flex-1 h-px bg-surface-variant"></div>
    <span class="text-[12px] text-on-surface-variant">หรือ</span>
    <div class="flex-1 h-px bg-surface-variant"></div>
  </div>`;
}
function authBack() {
  return `<button id="au-back" class="mb-4 inline-flex items-center gap-1 text-on-surface-variant font-bold text-[14px] hover:text-primary transition-colors">${sl("arrow_left",{size:18})} กลับ</button>`;
}

/* --- auth: 2 step (เลือก login/register → เลือกวิธี) --- */
function viewAuth() {
  const logoSvg = (typeof nexLogo === "function")
    ? nexLogo("full", "lime", "h-10 w-auto")
    : `<span class="font-display font-bold text-[24px] text-primary">NEX</span>`;
  const step = state.authStep || "intent";

  let body;
  if (step === "intent") {
    body = `
      <div class="text-center mb-8 pt-4">
        <div class="flex justify-center mb-3 mascot-float">${nexMascot("mascot w-20 h-20", { pose: "wave" })}</div>
        <div class="flex justify-center mb-4">${logoSvg}</div>
        <p class="text-on-surface-variant text-[15px]">Career Path Finder สำหรับนักเรียน ม.3–ม.6</p>
      </div>
      <div class="space-y-3 mb-6">
        <button id="au-go-login" class="ob-btn-primary">${sl("login",{size:18,color:"#16180f"})} เข้าสู่ระบบ</button>
        <button id="au-go-register" class="w-full min-h-[52px] rounded-2xl border-2 border-primary/60 text-primary font-display font-bold text-[16px] flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">${sl("add",{size:18,color:"#c2d90f"})} สมัครสมาชิก</button>
      </div>
      <div class="text-center">
        <button id="au-guest" class="text-on-surface-variant font-bold text-[13px] underline underline-offset-4">เข้าชมก่อน (ต้องกรอกข้อมูลเริ่มต้น)</button>
      </div>`;
  } else if (step === "register") {
    body = `
      ${authBack()}
      <div class="mb-6">
        <div class="flex justify-center mb-4">${logoSvg}</div>
        <h1 class="font-display font-bold text-[24px] text-on-surface text-center">สมัครสมาชิก</h1>
        <p class="text-on-surface-variant text-[14px] text-center mt-1">เลือกวิธีสมัคร</p>
      </div>
      <div class="space-y-3">
        ${googleBtn("สมัครด้วย Google")}
        ${authDivider()}
        <button id="au-register-email" class="ob-btn-primary">${sl("mail",{size:18,color:"#16180f"})} สมัครด้วยอีเมล</button>
      </div>`;
  } else { // login
    body = `
      ${authBack()}
      <div class="mb-6">
        <div class="flex justify-center mb-4">${logoSvg}</div>
        <h1 class="font-display font-bold text-[24px] text-on-surface text-center">เข้าสู่ระบบ</h1>
      </div>
      <div class="space-y-3">
        ${googleBtn("เข้าสู่ระบบด้วย Google")}
        ${authDivider()}
        <div>
          <label class="ob-label">อีเมล</label>
          <input id="au-email" type="email" autocomplete="email" placeholder="you@email.com" class="ob-input" />
        </div>
        <div>
          <label class="ob-label">รหัสผ่าน</label>
          <div class="relative">
            <input id="au-pass" type="password" autocomplete="current-password" placeholder="••••••••" class="ob-input pr-12" />
            <button type="button" id="au-toggle-pass" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">${sl("eye",{size:20,color:"#9aa090"})}</button>
          </div>
        </div>
        <button id="au-login-submit" class="ob-btn-primary">เข้าสู่ระบบ</button>
        <div class="flex items-center justify-between">
          <button id="au-demo" class="text-on-surface-variant font-bold text-[13px] hover:text-primary transition-colors flex items-center gap-1">${sl("sparkles",{size:14,color:"#9aa090"})} เข้าโหมด Demo</button>
          <button id="au-forgot" class="text-on-surface-variant font-bold text-[13px] hover:text-primary transition-colors">ลืมรหัสผ่าน?</button>
        </div>
      </div>`;
  }
  return shellCentered(body);
}

/* --- forgot password (ส่งลิงก์ reset ทางอีเมล) --- */
function viewForgotPassword() {
  return shellCentered(`
    <div class="mb-6 pt-2">
      <button data-nav="auth" class="mb-5 inline-flex items-center gap-1 text-on-surface-variant font-bold text-[15px]">${sl("arrow_left",{size:18})} กลับ</button>
      <h1 class="font-display font-bold text-[24px] text-on-surface">ลืมรหัสผ่าน?</h1>
      <p class="text-on-surface-variant mt-1 text-[14px]">กรอกอีเมล เราจะส่งลิงก์ตั้งรหัสใหม่ให้</p>
    </div>
    <div class="space-y-3">
      <div>
        <label class="ob-label">อีเมล</label>
        <input id="fp-email" type="email" autocomplete="email" placeholder="you@email.com" class="ob-input" />
      </div>
      <button id="fp-submit" class="ob-btn-primary">${sl("bell",{size:16,color:"#16180f"})} ส่งลิงก์ตั้งรหัสใหม่</button>
    </div>
  `);
}

/* --- reset password (มาจากลิงก์อีเมล — มี recovery session แล้ว) --- */
function viewResetPassword() {
  return shellCentered(`
    <div class="mb-6 pt-2 text-center">
      <div class="w-16 h-16 mx-auto rounded-full bg-primary-container flex items-center justify-center mb-3 shadow-[0_4px_0_#6b7a08]">${sl("lock",{size:28,color:"#16180f"})}</div>
      <h1 class="font-display font-bold text-[24px] text-on-surface">ตั้งรหัสผ่านใหม่</h1>
      <p class="text-on-surface-variant mt-1 text-[14px]">เลือกรหัสใหม่ที่แข็งแรงและจำได้</p>
    </div>
    <div class="space-y-3">
      <div>
        <label class="ob-label">รหัสผ่านใหม่ <span class="text-on-surface-variant font-normal">(อย่างน้อย 8 ตัว)</span></label>
        <div class="relative">
          <input id="rp-pass" type="password" minlength="8" autocomplete="new-password" placeholder="••••••••" class="ob-input pr-12" />
          <button type="button" id="rp-toggle" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"><span class="material-symbols-outlined text-[20px]">visibility</span></button>
        </div>
        <div id="rp-strength"></div>
      </div>
      <div>
        <label class="ob-label">ยืนยันรหัสผ่านใหม่</label>
        <input id="rp-pass2" type="password" minlength="8" autocomplete="new-password" placeholder="••••••••" class="ob-input" />
      </div>
      <button id="rp-submit" class="ob-btn-primary">${sl("check",{size:16,color:"#16180f"})} บันทึกรหัสใหม่</button>
    </div>
  `);
}

/* --- profile --- */
function viewProfile() {
  const loggedIn = !!state.user;
  return shellApp(`
    <main class="max-w-sm mx-auto px-md py-xl">
      <div class="text-center mb-xl">
        <div class="w-20 h-20 mx-auto rounded-full bg-primary-container flex items-center justify-center shadow-[0_5px_0_#96a80a] mb-md">${loggedIn ? sl("graduation", { size: 36, color: "#16180f" }) : sl("person", { size: 36, color: "#16180f" })}</div>
        <h1 class="font-display font-bold text-[24px] text-on-surface">${loggedIn ? esc(displayName()) : "โหมดผู้เยี่ยมชม"}</h1>
        ${loggedIn ? `<p class="text-on-surface-variant mt-1">${esc(state.user.email)}</p>` : `<p class="text-on-surface-variant mt-1">เข้าสู่ระบบเพื่อบันทึกเส้นทางถาวร</p>`}
      </div>
      ${loggedIn
        ? `<button id="btn-logout" class="tactile-button w-full bg-surface-container-high text-error font-bold text-[16px] rounded-xl py-md border-b-4 border-surface-variant flex items-center justify-center gap-sm">${icon("logout")} ออกจากระบบ</button>`
        : `<button id="btn-go-auth" class="ob-btn-primary">${icon("login")} เข้าสู่ระบบ / สมัครสมาชิก</button>`}
    </main>
  `);
}

/* ============================================================
   SHELLS + shared components
   ============================================================ */
function shellCentered(inner) {
  return `<div class="dotted-grid min-h-screen"><main class="max-w-md mx-auto px-md py-xl">${inner}</main></div>`;
}
function shellApp(inner) {
  return `${topAppBar()}${inner}${bottomNav()}`;
}

/* Dashboard layout: sidebar (desktop) + scrollable main */
function dashShell(content) {
  // ใช้ข้อมูลจริงจาก state.profile (โหลดตอน login/boot)
  const name = state.profile?.first_name || displayName() || "นักเรียน";
  const userGrade = state.profile?.education_level || "—";
  const userGpa = (state.profile?.gpa != null) ? Number(state.profile.gpa).toFixed(2) : "—";

  const cv = state.view; // current view for active highlighting
  const sideNav = (icName, label, view) => {
    const active = cv === view || (view === "create-path" && ["create-path","create-path-flow"].includes(cv));
    return `<button data-nav="${view}" class="dash-nav-item ${active?"active":""} w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all">
      ${sl(icName,{size:18,cls:"shrink-0"})}
      <span class="font-display font-bold text-[14px]">${label}</span>
    </button>`;
  };

  const sidebar = `
    <aside class="db-sidebar hidden md:flex flex-col border-r border-surface-variant bg-surface-container-lowest">
      <!-- NEX logo -->
      <div class="px-4 py-4 border-b border-surface-variant">
        ${(typeof nexLogo === "function") ? nexLogo("full", "lime", "h-7 w-auto") : `<span class="font-display font-bold text-primary text-[18px]">NEX</span>`}
        <div class="text-[10px] text-on-surface-variant font-medium tracking-widest mt-1">CAREER PATH FINDER</div>
      </div>

      <!-- nav -->
      <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
        <div class="text-[10px] font-bold text-on-surface-variant tracking-widest px-3 pt-2 pb-1">MAIN</div>
        ${sideNav("home", "Dashboard", "create-path")}
        ${sideNav("map", "My Roadmap", "roadmap-list")}
        ${sideNav("target", "คำนวณโอกาส", "calculator")}
        ${sideNav("route", "Path Finder", "career")}
        <div class="text-[10px] font-bold text-on-surface-variant tracking-widest px-3 pt-4 pb-1">EXPLORE</div>
        ${sideNav("calendar", "Events & Exams", "calendar")}
        ${sideNav("news", "ข่าวสาร", "news-page")}
        ${sideNav("school", "Universities", "universities")}
        <div class="text-[10px] font-bold text-on-surface-variant tracking-widest px-3 pt-4 pb-1">ACCOUNT</div>
        ${sideNav("person", "Profile", "profile")}
        ${sideNav("settings", "Settings", "settings")}
      </nav>

      <!-- user chip -->
      <div class="p-3 border-t border-surface-variant">
        <button data-nav="profile" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container transition-all">
          <div class="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center font-bold text-on-primary text-[14px] shrink-0 shadow-[0_2px_0_#96a80a]">${sl("graduation", { size: 18, color: "#16180f" })}</div>
          <div class="flex-1 min-w-0 text-left">
            <div class="font-bold text-[13px] text-on-surface truncate">${esc(name)}</div>
            <div class="text-[11px] text-on-surface-variant truncate">${[userGrade !== "—" ? userGrade : null, userGpa !== "—" ? "GPA " + userGpa : null].filter(Boolean).join(" · ") || esc(state.user?.email || "")}</div>
          </div>
        </button>
      </div>
    </aside>`;

  return `
    <div class="db-layout">
      ${sidebar}
      <div class="db-main flex flex-col min-h-screen">
        <!-- mobile topbar -->
        <header class="md:hidden sticky top-0 z-30 bg-surface border-b border-surface-variant px-4 py-3 flex items-center justify-between">
          ${(typeof nexLogo === "function") ? nexLogo("full", "lime", "h-6 w-auto") : `<span class="font-display font-bold text-[16px] text-primary">NEX</span>`}
          <button data-nav="profile" class="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center shadow-[0_2px_0_#96a80a]">${sl("graduation", { size: 18, color: "#16180f" })}</button>
        </header>
        <main class="flex-1 p-4 md:p-6 overflow-y-auto">
          ${content}
        </main>
        <!-- mobile bottom nav -->
        <nav class="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-surface-variant flex justify-around py-1">
          ${mobileNavItem("home", "หน้าหลัก", "create-path", cv==="create-path")}
          ${mobileNavItem("map", "โรดแมป", "roadmap-list", cv==="roadmap-list")}
          ${mobileNavItem("calendar", "ปฏิทิน", "calendar", cv==="calendar")}
          ${mobileNavItem("person", "โปรไฟล์", "profile", cv==="profile")}
        </nav>
        <div class="h-16 md:hidden"></div>
      </div>
    </div>`;
}
function mobileNavItem(icName, label, view, active) {
  return `<button data-nav="${view}" class="flex flex-col items-center px-4 py-1 ${active ? "text-primary" : "text-on-surface-variant"}">
    ${sl(icName, {size:22, color: active?"#c2d90f":"#9aa090"})}
    <span class="text-[11px] font-bold mt-0.5">${label}</span>
  </button>`;
}
function backBtn(target) {
  return `<button data-back="${target}" class="mb-lg inline-flex items-center gap-1 text-on-surface-variant font-bold text-[15px]">${icon("arrow_back")} ย้อนกลับ</button>`;
}
function loader() { return `<div class="cook-spinner"></div>`; }

function topAppBar() {
  return `
  <header class="sticky top-0 z-30 bg-surface border-b-4 border-surface-variant">
    <div class="max-w-5xl mx-auto flex justify-between items-center px-md py-2">
      <div class="flex items-center gap-sm">
        <div class="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center shadow-[0_3px_0_#96a80a]">${sl("graduation", { size: 18, color: "#16180f" })}</div>
        <span class="font-display font-extrabold text-[20px] text-primary tracking-tight">NEXTSTEP</span>
      </div>
      <nav class="hidden md:flex items-center gap-lg">
        ${navItem("home", "หน้าหลัก", false, "create-path")}
        ${navItem("map", "โรดแมป", true)}
        ${navItem("person", "โปรไฟล์", false, "profile")}
      </nav>
      <div class="flex items-center gap-sm bg-surface-container-high px-sm py-1 rounded-lg border-2 border-surface-variant font-bold text-[14px]">
        <span class="flex items-center gap-1" style="color:#ff9800">${sl("fire", { size: 15, color: "#ff9800" })} 7</span><span class="text-surface-variant">|</span><span class="flex items-center gap-1" style="color:#2196f3">${sl("gem", { size: 15, color: "#2196f3" })} 120</span>
      </div>
    </div>
  </header>`;
}
function navItem(ic, label, active, target) {
  return `<a ${target ? `data-nav="${target}"` : ""} class="flex flex-col items-center px-2 py-1 rounded-lg cursor-pointer ${active ? "text-primary border-b-4 border-primary-container" : "text-on-surface-variant"}">${icon(ic, { fill: active })}<span class="text-[12px] font-bold mt-0.5">${label}</span></a>`;
}
function bottomNav() {
  return `
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t-4 border-surface-variant flex justify-around items-center py-1">
    ${navItem("home", "หน้าหลัก", false, "create-path")}
    ${navItem("map", "โรดแมป", true)}
    ${navItem("person", "โปรไฟล์", false, "profile")}
  </nav>
  <div class="h-16 md:hidden"></div>`;
}

/* ============================================================
   RENDER + wiring
   ============================================================ */
function render() {
  const v = state.view;

  // async views — render themselves + call wireCommon inside
  if (v === "faculty")      return void viewFaculty();
  if (v === "programs")     return void viewPrograms();
  if (v === "cooking")      return void viewCooking();
  if (v === "universities") return void viewUniversities();
  if (v === "roadmap-list") return void viewRoadmapList();
  if (v === "news-page")    return void viewNews();
  if (v === "calendar")     return void viewCalendar();
  if (v === "calculator")   return void viewCalculator();
  if (v === "career")       return void viewCareerPath();
  if (v === "profile")      return void viewProfileFull();   // BUG-2: async, not sync
  if (v === "settings")     return void viewSettings();      // BUG-2: async

  // sync views — render then wire
  if (v === "auth")         $app().innerHTML = viewAuth();
  else if (v === "forgot-password") $app().innerHTML = viewForgotPassword();
  else if (v === "reset-password")  $app().innerHTML = viewResetPassword();
  else if (v === "create-path" || v === "create-path-flow") $app().innerHTML = viewDashboard();
  else if (v === "name-path") $app().innerHTML = viewNamePath();
  else if (v === "track")   $app().innerHTML = viewTrack();
  else if (v === "roadmap") $app().innerHTML = viewRoadmap();
  else                      $app().innerHTML = viewDashboard();

  wireCommon();
  wireView(v);
}

function wireCommon() {
  $app().querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", () => go(b.dataset.back)));
  $app().querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => go(b.dataset.nav)));
}

function wireView(v) {
  if (v === "auth") {
    // --- step "intent": เลือก login / register / guest ---
    document.getElementById("au-go-login")?.addEventListener("click", () => { state.authStep = "login"; render(); });
    document.getElementById("au-go-register")?.addEventListener("click", () => { state.authStep = "register"; render(); });
    document.getElementById("au-back")?.addEventListener("click", () => { state.authStep = "intent"; render(); });
    document.getElementById("au-guest")?.addEventListener("click", () => startOnboarding("guest")); // ข้อ3: guest ต้องกรอกก่อน

    // --- Google (ทั้ง login/register ใช้ปุ่มเดียว routing ด้วย onboarded) ---
    document.getElementById("au-google")?.addEventListener("click", doGoogleLogin);

    // --- register: สมัครด้วยอีเมล → onboarding เต็ม ---
    document.getElementById("au-register-email")?.addEventListener("click", () => startOnboarding("full"));

    // --- login: password toggle + submit + forgot ---
    const togglePass = document.getElementById("au-toggle-pass");
    if (togglePass) togglePass.addEventListener("click", () => {
      const inp = document.getElementById("au-pass");
      const show = inp.type === "password";
      inp.type = show ? "text" : "password";
      togglePass.innerHTML = sl(show ? "eye_off" : "eye", { size: 20, color: "#9aa090" });
    });
    document.getElementById("au-login-submit")?.addEventListener("click", async () => {
      const email = document.getElementById("au-email").value.trim();
      const pass = document.getElementById("au-pass").value;
      if (!email || pass.length < 6) { toast("กรอกอีเมลและรหัสผ่านให้ครบ"); return; }
      const btn = document.getElementById("au-login-submit");
      btn.disabled = true; btn.innerHTML = `<span class="ob-spinner inline-block"></span> กำลังเข้าสู่ระบบ...`;
      await doLogin(email, pass);
      btn.disabled = false; btn.innerHTML = `เข้าสู่ระบบ`;
    });
    document.getElementById("au-forgot")?.addEventListener("click", () => go("forgot-password"));
    // เข้าโหมด Demo (admin) ทันที — สำหรับ present
    document.getElementById("au-demo")?.addEventListener("click", () => enterAdminMode());
  }
  if (v === "forgot-password") {
    document.getElementById("fp-submit").addEventListener("click", async () => {
      const email = document.getElementById("fp-email").value.trim();
      if (!email || !email.includes("@")) { toast("กรอกอีเมลให้ถูกต้องนะ"); return; }
      const btn = document.getElementById("fp-submit");
      btn.disabled = true; btn.innerHTML = `<span class="ob-spinner inline-block"></span> กำลังส่ง...`;
      const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname,
      });
      btn.disabled = false; btn.innerHTML = `${sl("bell",{size:16,color:"#16180f"})} ส่งลิงก์ตั้งรหัสใหม่`;
      if (error) { toast(authErr(error)); return; }
      // ไม่บอกว่าอีเมลมีจริงไหม (กัน enumeration) — แจ้งกลางๆ
      toast("ถ้าอีเมลนี้มีบัญชี เราส่งลิงก์ไปแล้ว เช็คกล่องจดหมายนะ");
      setTimeout(() => go("auth"), 2000);
    });
  }
  if (v === "reset-password") {
    const tgl = document.getElementById("rp-toggle");
    if (tgl) tgl.addEventListener("click", () => {
      const inp = document.getElementById("rp-pass");
      const show = inp.type === "password";
      inp.type = show ? "text" : "password";
      tgl.innerHTML = `<span class="material-symbols-outlined text-[20px]">${show ? "visibility_off" : "visibility"}</span>`;
    });
    wireStrength("rp-pass", "rp-strength");
    document.getElementById("rp-submit").addEventListener("click", async () => {
      const pass = document.getElementById("rp-pass").value;
      const pass2 = document.getElementById("rp-pass2").value;
      const err = validatePassword(pass, pass2);
      if (err) { toast(err); return; }
      const btn = document.getElementById("rp-submit");
      btn.disabled = true; btn.innerHTML = `<span class="ob-spinner inline-block"></span> กำลังบันทึก...`;
      const { error } = await db.auth.updateUser({ password: pass });
      if (error) {
        btn.disabled = false; btn.innerHTML = `${sl("check",{size:16,color:"#16180f"})} บันทึกรหัสใหม่`;
        toast(authErr(error)); return;
      }
      // เคลียร์ hash recovery ออกจาก URL
      try { history.replaceState(null, "", window.location.pathname); } catch {}
      toast("เปลี่ยนรหัสผ่านสำเร็จ");
      await routeAfterAuth();
    });
  }
  // profile/settings wire themselves inside their async render — skip here
  if (v === "create-path" || v === "create-path-flow") {
    // btn-new is always present in dashboard header now
    document.getElementById("btn-new")?.addEventListener("click", () => {
      state.flow = { name: "", track: null, facultyId: null, facultyName: "", program: null };
      go("name-path");
    });
    document.getElementById("btn-pathfinder")?.addEventListener("click", () => go("career"));
    // Load live events/news into dashboard after sync render
    loadDashboardLiveData();
  }
  if (v === "name-path") {
    const next = () => {
      const val = document.getElementById("path-name")?.value.trim();
      if (!val) { toast("กรุณาตั้งชื่อเส้นทางก่อนนะ"); return; }  // BUG-10: validate
      state.flow.name = val;
      go("track");
    };
    document.getElementById("btn-next")?.addEventListener("click", next);
    document.getElementById("path-name")?.addEventListener("keydown", (e) => { if (e.key === "Enter") next(); });
  }
  if (v === "track") {
    $app().querySelectorAll("[data-track]").forEach((b) => b.addEventListener("click", () => {
      state.flow.track = b.dataset.track; go("faculty");
    }));
  }
  if (v === "roadmap") {
    $app().querySelectorAll("[data-round]").forEach((b) => b.addEventListener("click", () => {
      openRound(state.flow.rounds[+b.dataset.round]);
    }));
    wireRoadmapTimeline(state.flow.pathId, state.flow.roadmap || [], { facultyId: state.flow.facultyId, uni: state.flow.program?.uni, programId: state.flow.program?.id });
    wireWeightsToggle(state.flow.program?.id, state.flow.facultyId);
  }
}

// Re-open a previously saved path from create-path
function openSavedPath(p) {
  state.flow = { name: p.name, track: p.track, program: { id: p.programId, name: p.programName, uni: p.uni }, pathId: p.id, reopen: true };
  go("cooking");
}

// ลบเส้นทาง (localStorage; Phase 3 → user_paths). ถ้าลบเส้นทางหลัก → ตั้งอันแรกที่เหลือเป็นหลัก
function deletePath(id) {
  const paths = getPaths().filter((p) => p.id !== id);
  savePaths(paths);
  if (getMain() === id) {
    if (paths.length) setMain(paths[0].id);
    else { try { localStorage.removeItem(LS_MAIN); } catch {} }
  }
  toast("ลบเส้นทางแล้ว");
  go("roadmap-list"); // re-render (ถ้าไม่เหลือ → viewRoadmapList พาไปสร้างใหม่)
}

// ตั้งเส้นทางหลัก
function setMainPath(id) {
  setMain(id);
  toast("ตั้งเป็นเส้นทางหลักแล้ว");
  go("roadmap-list");
}

/* Boot — restore session, then route by onboarded + handle password recovery */
async function boot() {
  // admin/demo session (client-only) — คืนสภาพก่อน แล้วเข้าแอปเลย
  try {
    if (localStorage.getItem(LS_ADMIN) === "1") { enterAdminMode(); return; }
  } catch {}

  // ฟัง auth event (Google redirect, recovery ฯลฯ) — sync state
  db.auth.onAuthStateChange((event, session) => {
    state.user = session?.user || null;
    if (event === "PASSWORD_RECOVERY") go("reset-password");
  });

  // ลิงก์ reset จากอีเมลมาพร้อม hash type=recovery
  const isRecovery = /type=recovery/.test(window.location.hash || "");

  try {
    const { data } = await db.auth.getSession();
    state.user = data?.session?.user || null;
  } catch { state.user = null; }

  if (isRecovery && state.user) { go("reset-password"); return; }

  // ไม่มี session แต่มี guest ที่กรอกข้อมูลเริ่มต้นไว้ → กลับเข้าแอปแบบ guest ได้เลย
  if (!state.user) {
    try {
      const g = JSON.parse(localStorage.getItem("nextstep_guest") || "null");
      if (g && g.onboarded) {
        state.guest = true; state.profile = g;
        if (g.track) state.flow.track = g.track;
        go("create-path");
        return;
      }
    } catch {}
  }
  await routeAfterAuth();
}

// โหลด profile จริงจาก DB เก็บไว้ใน state (ใช้ทั้ง dashboard/sidebar/profile)
async function loadProfile() {
  if (state.admin) return state.profile;           // admin/demo — ใช้ข้อมูล seed ใน state
  if (state.guest) return state.profile;           // guest — ใช้ข้อมูลจาก localStorage ใน state
  if (!state.user) { state.profile = null; state.prefs = null; return null; }
  try {
    const [{ data: p }, { data: pr }] = await Promise.all([
      db.from("users_profile").select("*").eq("id", state.user.id).maybeSingle(),
      db.from("user_preferences").select("*").eq("user_id", state.user.id).maybeSingle(),
    ]);
    state.profile = p || null;
    state.prefs = pr || null;
    return state.profile;
  } catch { return state.profile || null; }
}

// route หลังรู้ session แล้ว: ยังไม่ตอบคำถาม → onboarding(profile), ตอบแล้ว → dashboard
async function routeAfterAuth() {
  if (!state.user) { go("auth"); return; }
  const p = await loadProfile();               // ดึงข้อมูลจริงมา cache
  if (!p || p.onboarded !== true) { startOnboarding("profile"); return; }
  go("create-path");
}
window.addEventListener("DOMContentLoaded", boot);
