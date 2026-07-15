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
  tgat: "TGAT", tgat1: "TGAT1", tgat2: "TGAT2", tgat3: "TGAT3",
  tpat1: "TPAT1 (กสพท)", tpat2: "TPAT2", tpat21: "TPAT2.1", tpat22: "TPAT2.2",
  tpat23: "TPAT2.3", tpat3: "TPAT3", tpat4: "TPAT4", tpat5: "TPAT5",
};
function subjectLabel(code) {
  if (SUBJECT_LABEL[code]) return SUBJECT_LABEL[code];
  const m = /^a_lv_(\d+)$/.exec(code);
  if (m) return "A-Lv " + (A_LEVEL[+m[1]] || m[1]);
  return code.toUpperCase();
}

/* ---------- Tracks (spec §8.8) ---------- */
const TRACKS = [
  { key: "sci_math", flag: "accepts_sci_math", label: "วิทย์–คณิต", emoji: "🔬", desc: "สายวิทยาศาสตร์ คณิตศาสตร์" },
  { key: "arts", flag: "accepts_arts", label: "ศิลป์", emoji: "🎨", desc: "ศิลป์–ภาษา / ศิลป์–คำนวณ / ศิลป์–สังคม" },
  { key: "vocational", flag: "accepts_vocational", label: "อาชีวะ (ปวช./ปวส.)", emoji: "🛠️", desc: "สายอาชีพ" },
];

/* ---------- State ---------- */
const state = {
  view: "auth",
  authMode: "login", // 'login' | 'register'
  user: null,        // Supabase auth user (null = guest / signed out)
  guest: false,
  flow: { name: "", track: null, facultyId: null, facultyName: "", program: null },
};

/* ---------- localStorage (Phase 3 → DB) ---------- */
const LS_PATHS = "nextstep_paths";
const LS_MAIN = "nextstep_main";
const getPaths = () => { try { return JSON.parse(localStorage.getItem(LS_PATHS)) || []; } catch { return []; } };
const savePaths = (p) => localStorage.setItem(LS_PATHS, JSON.stringify(p));
const getMain = () => localStorage.getItem(LS_MAIN);
const setMain = (id) => localStorage.setItem(LS_MAIN, id);

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
    toast("สมัครสมาชิกสำเร็จ 🎉");
    go("create-path");
  } else {
    // email-confirmation required
    toast("สมัครสำเร็จ! ตรวจสอบอีเมลเพื่อยืนยัน แล้วเข้าสู่ระบบ");
    state.authMode = "login"; render();
  }
}
async function doLogin(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) { toast(authErr(error)); return; }
  state.user = data.user; state.guest = false;
  toast("ยินดีต้อนรับกลับ 👋");
  go("create-path");
}
async function doLogout() {
  try { await db.auth.signOut(); } catch {}
  state.user = null; state.guest = false;
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
  if (m.includes("already registered") || m.includes("already been registered")) return "อีเมลนี้มีบัญชีอยู่แล้ว";
  if (m.includes("password")) return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
  if (m.includes("email")) return "อีเมลไม่ถูกต้อง";
  return "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง";
}

/* ---------- Data fetchers ---------- */
async function fetchFaculties() {
  const { data, error } = await db.from("faculties").select("id,name_th").order("id");
  if (error) throw error;
  return data;
}
async function fetchPrograms(facultyId, trackFlag) {
  let q = db.from("programs")
    .select("id,major_name,major_clean,degree_name,program_type,tuition_fee,university_id,universities(name_th,campus_name)")
    .eq("faculty_id", facultyId)
    .eq(trackFlag, true)
    .limit(60);
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

/* ============================================================
   VIEWS
   ============================================================ */

/* --- dashboard (หน้าหลัก) — renders sync shell, then loads live data async --- */
function viewDashboard() {
  const paths = getPaths();
  const mainId = getMain();
  const mainPath = paths.find((p) => p.id === mainId) || paths[0];
  const name = displayName() || "นักเรียน";
  const gpax = state._profileGpax || "—"; // filled by profile fetch cache

  // stat cards
  const stats = [
    { label: "GPA ปัจจุบัน", value: gpax, sub: "", subCls: "" },
    { label: "ความคืบหน้า", value: "—", sub: mainPath ? esc(mainPath.name) : "ยังไม่มีเส้นทาง", subCls: "text-primary" },
    { label: "กิจกรรมใกล้ถึง", value: "—", sub: "", subCls: "" },
    { label: "วันสอบถัดไป", value: "—", sub: "", subCls: "" },
  ];
  const statCards = stats.map((s) => `
    <div class="db-card p-5 flex flex-col gap-1 min-w-0">
      <span class="text-[12px] text-on-surface-variant font-medium">${s.label}</span>
      <span class="font-mono font-bold text-[28px] text-on-surface leading-none">${s.value}</span>
      ${s.sub ? `<span class="text-[12px] ${s.subCls || "text-on-surface-variant"}">${s.sub}</span>` : ""}
    </div>`).join("");

  // roadmap horizontal progress (main path)
  const roadmapSteps = mainPath?._roadmap || [];
  const roadmapSection = mainPath ? `
    <div class="db-card p-5 mb-4">
      <div class="flex items-start gap-3 mb-4">
        <div class="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-xl shrink-0">🎯</div>
        <div class="flex-1 min-w-0">
          <div class="font-display font-bold text-[16px] text-on-surface truncate">${esc(mainPath.programName || mainPath.name)}</div>
          <div class="text-[12px] text-on-surface-variant truncate">${mainPath.uni ? esc(mainPath.uni) + " · " : ""}TCAS Portfolio</div>
        </div>
        <span class="shrink-0 text-[13px] font-mono font-bold text-primary bg-primary/10 border border-primary/30 rounded-lg px-3 py-1">87%</span>
      </div>

      <!-- horizontal step nodes -->
      <div class="relative flex items-center gap-0 mb-5 overflow-x-auto no-scrollbar pb-1">
        ${dashSteps()}
      </div>

      <!-- progress bar -->
      <div class="flex items-center justify-between mb-1">
        <span class="text-[12px] text-on-surface-variant">ความคืบหน้าโดยรวม</span>
        <span class="text-[12px] font-mono font-bold text-primary">62%</span>
      </div>
      <div class="h-2.5 rounded-full bg-surface-variant overflow-hidden">
        <div class="h-full rounded-full bg-primary" style="width:62%;transition:width .6s cubic-bezier(.32,.78,.2,1)"></div>
      </div>
    </div>` : `
    <div class="db-card p-6 mb-4 flex flex-col items-center text-center gap-3">
      <span class="text-4xl">🗺️</span>
      <p class="text-on-surface-variant">ยังไม่มีเส้นทาง</p>
      <button id="btn-new" class="tactile-button bg-primary-container text-on-primary font-display font-bold px-5 py-2.5 rounded-xl border-b-4 border-[#96a80a]">
        ${icon("add")} สร้างเส้นทางใหม่
      </button>
    </div>`;

  // path finder banner
  const banner = `
    <div class="db-card p-4 mb-4 flex items-center gap-4" style="background:rgba(194,217,15,.06);border-color:rgba(194,217,15,.2)">
      <span class="text-2xl shrink-0">🔍</span>
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
    { label: "ทปอ. ปรับเกณฑ์ TCAS68 ใช้ TGAT/TPAT ขั้นต่ำ 30%", meta: "25 พ.ค. 68 · ระดับชาติ" },
    { label: "จุฬาฯ เพิ่มที่นั่ง รอบ Portfolio คณะวิศวะ 20 ที่", meta: "27 พ.ค. 68 · มหาวิทยาลัย" },
    { label: "กสพท ประกาศวันรับสมัคร TCAS68 รอบ 2 แล้ว", meta: "25 พ.ค. 68 · ข้อสอบ" },
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
        <h1 class="font-display font-bold text-[22px] text-on-surface leading-tight">
          สวัสดี, ${esc(name)} 👋
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

    <!-- bottom 2-col: live from Supabase (BUG-8) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="db-card p-5">
        <div class="font-display font-bold text-[14px] text-on-surface-variant mb-3">กิจกรรมใกล้มาถึง</div>
        <div id="dash-events" class="space-y-3">
          ${[1,2,3].map(()=>`<div class="h-10 bg-surface-variant rounded-lg animate-pulse"></div>`).join("")}
        </div>
      </div>
      <div class="db-card p-5">
        <div class="font-display font-bold text-[14px] text-on-surface-variant mb-3">ข่าวสารการศึกษา</div>
        <div id="dash-news" class="space-y-3">
          ${[1,2,3].map(()=>`<div class="h-10 bg-surface-variant rounded-lg animate-pulse"></div>`).join("")}
        </div>
      </div>
    </div>
  `);
}

// Called after dashShell renders — loads live events+news
async function loadDashboardLiveData() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate()+60);
    const [{ data: evs }, { data: newsItems }] = await Promise.all([
      db.from("events").select("title,event_date,color").gte("event_date", today).lte("event_date", cutoff.toISOString().split("T")[0]).order("event_date").limit(3),
      db.from("news").select("title,category,published_at").eq("is_published",true).order("published_at",{ascending:false}).limit(3),
    ]);
    const MONTHS_TH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
    const dotCls = {error:"bg-error",tertiary:"bg-tertiary",primary:"bg-primary",secondary:"bg-secondary"};

    const evEl = document.getElementById("dash-events");
    if (evEl) evEl.innerHTML = (evs||[]).length ? (evs||[]).map(e => {
      const d = new Date(e.event_date); const dot = dotCls[e.color]||"bg-primary";
      return `<div class="flex items-start gap-3">
        <div class="w-10 shrink-0 text-center"><div class="font-mono font-bold text-[16px] text-on-surface leading-none">${d.getDate()}</div><div class="text-[11px] text-on-surface-variant">${MONTHS_TH[d.getMonth()]}</div></div>
        <div class="flex-1 min-w-0 border-l-2 border-surface-variant pl-3">
          <div class="font-bold text-[13px] text-on-surface leading-snug">${esc(e.title)}</div>
          <span class="inline-block w-1.5 h-1.5 rounded-full ${dot} mr-1"></span>
        </div>
      </div>`;
    }).join("") : `<p class="text-[13px] text-on-surface-variant">ไม่มีกิจกรรมใน 60 วันข้างหน้า</p>`;

    const nwEl = document.getElementById("dash-news");
    if (nwEl) nwEl.innerHTML = (newsItems||[]).length ? (newsItems||[]).map(n => {
      const d = new Date(n.published_at);
      return `<div class="flex gap-2 items-start">
        <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
        <div><div class="text-[13px] text-on-surface font-medium leading-snug line-clamp-2">${esc(n.title)}</div>
        <div class="text-[11px] text-on-surface-variant mt-0.5">${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear()+543} · ${esc(n.category)}</div></div>
      </div>`;
    }).join("") : `<p class="text-[13px] text-on-surface-variant">ยังไม่มีข่าวสาร</p>`;
  } catch { /* ถ้า network ผิดพลาด ข้ามไป */ }
}

/* horizontal step nodes for dashboard roadmap */
function dashSteps() {
  const steps = [
    { n: 1, label: "เลือกสาย\nการเรียน", sub: "ม.4", done: true },
    { n: 2, label: "สะสม\nPortfolio", sub: "ม.4-5", done: true },
    { n: 3, label: "เตรียมสอบ\nTPAT3", sub: "ม.5 ปัจจุบัน", current: true },
    { n: 4, label: "สมัคร\nTCAS รอบ 1", sub: "ต.ค. 67", done: false },
    { n: 5, label: "สอบ\nTGAT/TPAT", sub: "ธ.ค. 68", done: false },
    { n: 6, label: "ประกาศ\nผลสอบ", sub: "ก.พ. 68", done: false },
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
      <div class="text-3xl shrink-0">${t.emoji}</div>
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
async function viewPrograms() {
  $app().innerHTML = shellCentered(`${backBtn("faculty")}<div class="py-2xl flex justify-center">${loader()}</div>`);
  const trackFlag = TRACKS.find((t) => t.key === state.flow.track)?.flag || "accepts_sci_math";
  let programs = [];
  try { programs = await fetchPrograms(state.flow.facultyId, trackFlag); }
  catch (e) { toast("โหลดหลักสูตรไม่สำเร็จ ลองใหม่อีกครั้ง"); return; }

  const cards = programs.length ? programs.map((p) => {
    const uni = p.universities?.name_th || "";
    const campus = p.universities?.campus_name && p.universities.campus_name !== "วิทยาเขตหลัก" ? " · " + p.universities.campus_name : "";
    const name = p.major_clean || p.major_name || p.degree_name || "หลักสูตร";
    return `
      <button data-prog='${esc(JSON.stringify({ id: p.id, name, uni }))}' class="tactile-button w-full text-left bg-surface-container-lowest border-2 border-surface-variant rounded-xl p-md shadow-[0_4px_0_#0d0f08]">
        <div class="flex items-start justify-between gap-sm">
          <div class="font-headline font-bold text-[16px] text-on-surface leading-snug">${esc(name)}</div>
          <span class="shrink-0 text-[11px] font-bold text-primary bg-primary-container/15 rounded-full px-2 py-0.5">${esc(p.program_type || "")}</span>
        </div>
        <div class="text-[13px] text-on-surface-variant mt-1">${esc(uni)}${esc(campus)}</div>
        <div class="text-[13px] font-bold mt-2 ${p.tuition_fee == null ? "text-outline" : "text-secondary"}">${icon("payments", { cls: "text-[16px] align-middle" })} ${fmtTuition(p.tuition_fee)}</div>
      </button>`;
  }).join("")
    : `<div class="text-center text-on-surface-variant py-xl">ไม่พบหลักสูตรสำหรับสายนี้ในคณะที่เลือก<br/>ลองเปลี่ยนคณะหรือสายการเรียนดูนะ</div>`;

  $app().innerHTML = shellCentered(`
    ${backBtn("faculty")}
    <div class="mb-lg">
      <h1 class="font-display font-extrabold text-[24px] text-on-surface">${esc(state.flow.facultyName)}</h1>
      <p class="text-on-surface-variant mt-1">${programs.length} หลักสูตรที่รับสายของคุณ · เลือก 1 เพื่อดูโรดแมป</p>
    </div>
    <div class="space-y-md">${cards}</div>
  `);
  wireCommon();
  $app().querySelectorAll("[data-prog]").forEach((b) => b.addEventListener("click", () => {
    state.flow.program = JSON.parse(b.dataset.prog);
    go("cooking");
  }));
}

/* --- cooking ("Let me cook") --- */
async function viewCooking() {
  $app().innerHTML = `
    <div class="dotted-grid min-h-screen flex flex-col items-center justify-center gap-lg px-md text-center">
      <div class="cook-spinner"></div>
      <div class="text-4xl">🍳</div>
      <h2 class="font-display font-extrabold text-[22px] text-primary">กำลังปรุงโรดแมปให้คุณ...</h2>
      <p class="text-on-surface-variant">รวบรวมรอบ TCAS และวิชาที่ต้องใช้</p>
    </div>`;

  const prog = state.flow.program;
  // spec §5.1 — try/catch, min ~900ms spinner, then transition; toast on failure.
  try {
    const [rounds, roadmap] = await Promise.all([
      fetchRounds(prog.id),
      fetchRoadmap(prog.id),
      new Promise((r) => setTimeout(r, 900)),
    ]);
    state.flow.rounds = rounds;
    state.flow.roadmap = roadmap;

    // Persist path (localStorage; Phase 3 → user_paths). Skip when re-opening an existing path.
    if (!state.flow.reopen) {
      const paths = getPaths();
      const rec = { id: uid(), name: state.flow.name || prog.name, programId: prog.id, programName: prog.name, uni: prog.uni, track: state.flow.track, createdAt: Date.now() };
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
  const total = roadmap.length || 1;

  // Timeline nodes: step 1 = current (pulsing), rest = upcoming (Phase 2 adds real state machine)
  const nodes = roadmap.map((s, i) => {
    const current = i === 0;
    const dotShadow = current ? "#96a80a" : "#0d0f08";
    const dotBg = current ? "bg-primary-container border-[#96a80a]" : "bg-surface-container-high border-surface-variant";
    return `
      <div class="flex items-start gap-md mb-6 relative">
        <div class="w-12 h-12 rounded-full ${dotBg} border-2 flex items-center justify-center shadow-[0_4px_0_${dotShadow}] z-10 shrink-0 mt-1 ${current ? "pulse-animation" : ""}">
          ${current ? icon("play_arrow", { fill: true, cls: "text-on-primary" }) : `<span class="font-headline font-extrabold text-on-surface-variant">${s.step_number}</span>`}
        </div>
        <div class="flex-1 bg-surface-container-lowest border-2 ${current ? "border-primary" : "border-surface-variant"} rounded-xl p-md shadow-[0_4px_0_#0d0f08]">
          <div class="flex items-center justify-between gap-sm">
            <h3 class="font-headline font-bold text-[16px] ${current ? "text-primary" : "text-on-surface"}">${esc(s.title)}</h3>
            ${s.target_period ? `<span class="shrink-0 text-[11px] font-bold text-secondary bg-secondary-fixed/40 rounded-full px-2 py-0.5">${esc(s.target_period)}</span>` : ""}
          </div>
          ${s.description ? `<p class="text-[14px] text-on-surface-variant mt-1 leading-relaxed">${esc(s.description)}</p>` : ""}
        </div>
      </div>`;
  }).join("");

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
    <div class="flex items-center gap-3 mb-5">
      <button data-nav="roadmap-list" class="p-2 rounded-xl border border-surface-variant text-on-surface-variant hover:border-primary transition-colors">
        ${sl("arrow_left",{size:18})}
      </button>
      <div class="min-w-0">
        <h1 class="font-display font-bold text-[20px] text-primary leading-tight truncate">${esc(state.flow.name || prog.name || "เส้นทางของคุณ")}</h1>
        <p class="text-[12px] text-on-surface-variant truncate">${esc(prog.name || "")}${prog.uni ? " · " + esc(prog.uni) : ""}</p>
      </div>
      <span class="shrink-0 ml-auto text-[12px] font-mono font-bold text-primary bg-primary/10 border border-primary/30 rounded-lg px-2 py-1">ขั้น 1/${total}</span>
    </div>

    <h2 class="font-display font-bold text-[13px] text-on-surface-variant mb-2 flex items-center gap-1.5">${sl("target",{size:16,color:"#9aa090"})} รอบรับสมัคร TCAS</h2>
    <div class="flex gap-sm overflow-x-auto no-scrollbar pb-2 mb-5">${roundPills}</div>

    <h2 class="font-display font-bold text-[13px] text-on-surface-variant mb-3 flex items-center gap-1.5">${sl("route",{size:16,color:"#9aa090"})} เส้นทางเตรียมตัว</h2>
    <div class="relative">
      <div class="absolute left-[23px] top-4 bottom-4 w-0.5 bg-surface-variant"></div>
      ${nodes || `<div class="text-on-surface-variant">ยังไม่มีขั้นตอนโรดแมปสำหรับหลักสูตรนี้</div>`}
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
function openRound(r) {
  const scores = r.scores || {};
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const chips = entries.length
    ? entries.map(([code, w]) => `<span class="chip">${esc(subjectLabel(code))} <span class="w">${w}%</span></span>`).join("")
    : `<span class="text-on-surface-variant text-[14px]">ไม่มีข้อมูลสัดส่วนวิชา</span>`;

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
      <div class="font-headline font-bold text-[14px] text-on-surface-variant mb-sm">วิชาที่ใช้ & น้ำหนัก</div>
      <div class="flex flex-wrap gap-2">${chips}</div>
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

/* --- auth (Welcome screen: login OR start onboarding) --- */
function viewAuth() {
  const logoSvg = (typeof nexLogo === "function")
    ? nexLogo("full", "lime", "h-10 w-auto")
    : `<span class="font-display font-bold text-[24px] text-primary">NEX</span>`;

  return shellCentered(`
    <div class="text-center mb-8 pt-4">
      <!-- NEX logo: lime on dark -->
      <div class="flex justify-center mb-5">${logoSvg}</div>
      <p class="text-on-surface-variant text-[15px]">Career Path Finder สำหรับนักเรียน ม.3–ม.6</p>
    </div>

    <div class="space-y-3 mb-6">
      <!-- Google login -->
      <button id="au-google" class="w-full min-h-[52px] rounded-2xl border-2 border-surface-variant bg-surface-container-low text-on-surface font-display font-bold text-[16px] flex items-center justify-center gap-3 hover:border-primary transition-colors">
        <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        เข้าสู่ระบบด้วย Google
      </button>

      <div class="flex items-center gap-3 my-1">
        <div class="flex-1 h-px bg-surface-variant"></div>
        <span class="text-[12px] text-on-surface-variant">หรือ</span>
        <div class="flex-1 h-px bg-surface-variant"></div>
      </div>

      <!-- Register (onboarding) -->
      <button id="au-register" class="ob-btn-primary">
        เริ่มต้นใช้งาน (ฟรี!)
      </button>
      <!-- Login toggle -->
      <button id="au-login-link" class="w-full py-3 rounded-2xl border-2 border-surface-variant text-on-surface font-display font-bold text-[16px] flex items-center justify-center gap-2 hover:border-primary transition-colors">
        มีบัญชีแล้ว — เข้าสู่ระบบ
      </button>
    </div>

    <!-- login form (collapsed by default) -->
    <div id="login-form-wrap" class="hidden space-y-3 mb-4">
      <div>
        <label class="ob-label">อีเมล</label>
        <input id="au-email" type="email" autocomplete="email" placeholder="you@email.com" class="ob-input" />
      </div>
      <div>
        <label class="ob-label">รหัสผ่าน</label>
        <div class="relative">
          <input id="au-pass" type="password" autocomplete="current-password" placeholder="••••••" class="ob-input pr-12" />
          <button type="button" id="au-toggle-pass" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            <span class="material-symbols-outlined text-[20px]">visibility</span>
          </button>
        </div>
      </div>
      <button id="au-login-submit" class="ob-btn-primary">เข้าสู่ระบบ</button>
    </div>

    <div class="text-center">
      <button id="au-guest" class="text-on-surface-variant font-bold text-[13px] underline underline-offset-4">ข้ามไปก่อน (โหมดผู้เยี่ยมชม)</button>
    </div>
  `);
}

/* --- profile --- */
function viewProfile() {
  const loggedIn = !!state.user;
  return shellApp(`
    <main class="max-w-sm mx-auto px-md py-xl">
      <div class="text-center mb-xl">
        <div class="w-20 h-20 mx-auto rounded-full bg-primary-container flex items-center justify-center text-4xl shadow-[0_5px_0_#96a80a] mb-md">${loggedIn ? "🦉" : "👤"}</div>
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
  const name = displayName() || "นักเรียน";
  const userGrade = "ม.5"; // Phase 3: from users_profile
  const userGpa = "3.72";  // Phase 3: from users_profile

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
          <div class="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center font-bold text-on-primary text-[14px] shrink-0 shadow-[0_2px_0_#96a80a]">🦉</div>
          <div class="flex-1 min-w-0 text-left">
            <div class="font-bold text-[13px] text-on-surface truncate">${esc(name)}</div>
            <div class="text-[11px] text-on-surface-variant">${userGrade} · GPA ${userGpa}</div>
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
          <button data-nav="profile" class="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center shadow-[0_2px_0_#96a80a]">🦉</button>
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
        <div class="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-lg shadow-[0_3px_0_#96a80a]">🦉</div>
        <span class="font-display font-extrabold text-[20px] text-primary tracking-tight">NEXTSTEP</span>
      </div>
      <nav class="hidden md:flex items-center gap-lg">
        ${navItem("home", "หน้าหลัก", false, "create-path")}
        ${navItem("map", "โรดแมป", true)}
        ${navItem("person", "โปรไฟล์", false, "profile")}
      </nav>
      <div class="flex items-center gap-sm bg-surface-container-high px-sm py-1 rounded-lg border-2 border-surface-variant font-bold text-[14px]">
        <span style="color:#ff9800">🔥 7</span><span class="text-surface-variant">|</span><span style="color:#2196f3">💎 120</span>
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
  if (v === "profile")      return void viewProfileFull();   // BUG-2: async, not sync
  if (v === "settings")     return void viewSettings();      // BUG-2: async

  // sync views — render then wire
  if (v === "auth")         $app().innerHTML = viewAuth();
  else if (v === "career")  $app().innerHTML = viewCareerPath();
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
    // Google OAuth
    document.getElementById("au-google").addEventListener("click", doGoogleLogin);

    // register → start 6-step onboarding
    document.getElementById("au-register").addEventListener("click", () => startOnboarding());

    // login toggle
    const loginWrap = document.getElementById("login-form-wrap");
    const loginLink = document.getElementById("au-login-link");
    loginLink.addEventListener("click", () => {
      loginWrap.classList.toggle("hidden");
      loginLink.classList.toggle("hidden");
      const email = document.getElementById("au-email");
      if (email) email.focus();
    });

    // password visibility
    const togglePass = document.getElementById("au-toggle-pass");
    if (togglePass) togglePass.addEventListener("click", () => {
      const inp = document.getElementById("au-pass");
      const show = inp.type === "password";
      inp.type = show ? "text" : "password";
      togglePass.innerHTML = icon(show ? "visibility_off" : "visibility");
    });

    // login submit
    document.getElementById("au-login-submit").addEventListener("click", async () => {
      const email = document.getElementById("au-email").value.trim();
      const pass = document.getElementById("au-pass").value;
      if (!email || pass.length < 6) { toast("กรอกอีเมลและรหัสผ่าน (อย่างน้อย 6 ตัว)"); return; }
      const btn = document.getElementById("au-login-submit");
      btn.disabled = true; btn.innerHTML = `<span class="ob-spinner inline-block"></span> กำลังเข้าสู่ระบบ...`;
      await doLogin(email, pass);
      btn.disabled = false; btn.innerHTML = `${icon("arrow_forward")} เข้าสู่ระบบ`;
    });

    document.getElementById("au-guest").addEventListener("click", () => {
      state.guest = true; go("create-path");
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
  }
}

// Re-open a previously saved path from create-path
function openSavedPath(p) {
  state.flow = { name: p.name, track: p.track, program: { id: p.programId, name: p.programName, uni: p.uni }, pathId: p.id, reopen: true };
  go("cooking");
}

/* Boot — restore session, then route */
async function boot() {
  try {
    const { data } = await db.auth.getSession();
    state.user = data?.session?.user || null;
    db.auth.onAuthStateChange((_e, session) => { state.user = session?.user || null; });
  } catch { state.user = null; }
  state.view = state.user ? "create-path" : "auth";
  render();
}
window.addEventListener("DOMContentLoaded", boot);
