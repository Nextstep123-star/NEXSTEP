// ============================================================
// NEXTSTEP — All core views
// news · calendar · career-path · profile · settings · roadmap · universities
// ============================================================

// ── News — ดึงจาก Supabase table `news` ──────────────────────
const CAT_COLOR = {
  "ระดับชาติ":   "bg-error/20 text-error",
  "มหาวิทยาลัย": "bg-tertiary/20 text-tertiary",
  "ข้อสอบ":      "bg-primary/20 text-primary",
  "แนะแนว":      "bg-secondary/20 text-secondary",
  "ทุนการศึกษา": "bg-[#ff9800]/20 text-[#ff9800]",
  "ทั่วไป":      "bg-surface-variant text-on-surface-variant",
};

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function renderNewsCards(articles, activeFilter) {
  if (!articles.length) return `<div class="text-center py-12 text-on-surface-variant">${sl("info",{size:32,color:"#3a3f34"})}<p class="mt-3">ไม่มีข่าวในหมวดนี้</p></div>`;
  return articles.map((a) => `
    <article class="db-card p-5 cursor-pointer hover:border-primary/40 transition-colors">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${CAT_COLOR[a.category] || CAT_COLOR["ทั่วไป"]}">${esc(a.category)}</span>
        <span class="text-[12px] text-on-surface-variant">${fmtDate(a.published_at)}</span>
      </div>
      <h3 class="font-display font-bold text-[15px] text-on-surface leading-snug mb-1">${esc(a.title)}</h3>
      <p class="text-[13px] text-on-surface-variant leading-relaxed line-clamp-2">${esc(a.body || "")}</p>
    </article>`).join("");
}

async function viewNews() {
  // Render skeleton immediately
  document.getElementById("app").innerHTML = dashShell(`
    <div class="flex items-center justify-between mb-5">
      <h1 class="font-display font-bold text-[22px] text-on-surface">ข่าวสารการศึกษา</h1>
      <div id="news-filters" class="flex gap-2 overflow-x-auto no-scrollbar"></div>
    </div>
    <div id="news-list" class="space-y-3">
      ${[1,2,3].map(()=>`<div class="db-card p-5 animate-pulse h-24"></div>`).join("")}
    </div>
  `);
  wireCommon();

  // Fetch from Supabase — fallback → TCAS70 news เมื่อ DB ว่าง/ล่ม/โหมด demo
  let articles = [];
  try {
    if (!state.admin) {
      const { data, error } = await db.from("news")
        .select("id,title,body,category,published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(30);
      if (!error) articles = data || [];
    }
  } catch { }
  if (!articles.length) {
    articles = TCAS70.news.map((n, i) => ({ id: "t70n_" + i, ...n }));
  }

  // Build filter tabs from unique categories
  const cats = ["ทั้งหมด", ...new Set(articles.map(a => a.category))];
  let active = "ทั้งหมด";

  const render = () => {
    const filtered = active === "ทั้งหมด" ? articles : articles.filter(a => a.category === active);
    const filtersEl = document.getElementById("news-filters");
    const listEl = document.getElementById("news-list");
    if (filtersEl) filtersEl.innerHTML = cats.map(c => `
      <button data-cat="${esc(c)}" class="news-filter shrink-0 text-[12px] font-bold px-3 py-1 rounded-full border transition-colors ${c===active?"bg-primary text-on-primary border-primary":"border-surface-variant text-on-surface-variant hover:border-primary/40"}">
        ${esc(c)}
      </button>`).join("");
    if (listEl) listEl.innerHTML = renderNewsCards(filtered, active);
    // Re-wire filter buttons
    document.querySelectorAll(".news-filter").forEach(b => b.addEventListener("click", () => {
      active = b.dataset.cat; render();
    }));
  };
  render();
}

// ── Calendar — ดึงจาก Supabase table `events` ─────────────────
const MONTHS_TH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const DAYS_TH   = ["อา","จ","อ","พ","พฤ","ศ","ส"];

// color token → Tailwind class (ต้องใช้ full class ไม่ใช่ dynamic เพื่อไม่ให้ purge)
const EV_COLOR = {
  error:           { bg: "bg-error",          text: "text-error",          dim: "bg-error/10" },
  tertiary:        { bg: "bg-tertiary",        text: "text-tertiary",       dim: "bg-tertiary/10" },
  primary:         { bg: "bg-primary",         text: "text-primary",        dim: "bg-primary/10" },
  secondary:       { bg: "bg-secondary",       text: "text-secondary",      dim: "bg-secondary/10" },
  "secondary-fixed":{ bg:"bg-secondary-fixed", text:"text-secondary",       dim: "bg-secondary/10" },
};
function evColor(c) { return EV_COLOR[c] || EV_COLOR.primary; }

async function viewCalendar() {
  const today = new Date();
  let viewMonth = today.getMonth();
  let viewYear  = today.getFullYear();

  // Render shell + skeleton
  document.getElementById("app").innerHTML = dashShell(`
    <div class="flex items-center justify-between mb-5">
      <h1 class="font-display font-bold text-[22px] text-on-surface">ปฏิทิน TCAS</h1>
      <div class="flex items-center gap-2">
        <button id="cal-prev" class="p-1.5 rounded-lg border border-surface-variant text-on-surface-variant">${sl("arrow_left",{size:16})}</button>
        <span id="cal-month-label" class="font-display font-bold text-[15px] text-on-surface w-28 text-center"></span>
        <button id="cal-next" class="p-1.5 rounded-lg border border-surface-variant text-on-surface-variant">${sl("arrow_right",{size:16})}</button>
      </div>
    </div>
    <div id="cal-grid" class="db-card p-4 mb-4"></div>
    <div id="cal-day-detail"></div>
    <h2 class="font-display font-bold text-[14px] text-on-surface-variant mb-3">กิจกรรมที่กำลังจะมาถึง</h2>
    <div id="cal-upcoming" class="space-y-2 mb-6">
      ${[1,2,3].map(()=>`<div class="db-card p-4 animate-pulse h-16"></div>`).join("")}
    </div>
    <h2 class="font-display font-bold text-[14px] text-on-surface-variant mb-3">กิจกรรมทั้งหมด</h2>
    <div id="cal-all" class="space-y-2">
      ${[1,2].map(()=>`<div class="db-card p-4 animate-pulse h-16"></div>`).join("")}
    </div>
  `);
  wireCommon();

  // Fetch ALL events from Supabase (small table, fetch once)
  // fallback → TCAS70 schedule เมื่อ DB ว่าง/ล่ม/โหมด demo
  let events = [];
  try {
    if (!state.admin) {
      const { data } = await db.from("events")
        .select("id,title,event_date,type,color,description")
        .order("event_date", { ascending: true });
      events = (data || []).map(e => ({ ...e, _date: new Date(e.event_date) }));
    }
  } catch { }
  if (!events.length) {
    events = TCAS70.schedule.map((e, i) => ({ id: "t70_" + i, ...e, _date: new Date(e.event_date) }));
  }

  let selected = null; // "Y-M-D" ของวันที่คลิก
  const eventsOn = (y, m, d) => events.filter(e => e._date.getFullYear() === y && e._date.getMonth() === m && e._date.getDate() === d);

  function renderGrid() {
    const label = document.getElementById("cal-month-label");
    if (label) label.textContent = `${MONTHS_TH[viewMonth]} ${viewYear + 543}`;

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(`<div></div>`);
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
      const dayEvents = eventsOn(viewYear, viewMonth, d);
      const has = dayEvents.length > 0;
      const isSel = selected === `${viewYear}-${viewMonth}-${d}`;
      const dots = has
        ? `<span class="flex gap-0.5 mt-0.5 h-1.5">${dayEvents.slice(0,3).map(e => `<span class="w-1.5 h-1.5 rounded-full ${evColor(e.color).bg}"></span>`).join("")}</span>`
        : `<span class="mt-0.5 h-1.5"></span>`;
      cells.push(`
        <button ${has ? `data-day="${d}"` : "disabled"} class="flex flex-col items-center py-1 rounded-lg transition-colors ${has ? "cursor-pointer hover:bg-surface-variant/40" : "cursor-default"} ${isSel ? "bg-primary/10 ring-1 ring-primary/50" : ""}">
          <span class="w-8 h-8 flex items-center justify-center rounded-full font-mono text-[13px] font-bold ${isToday ? "bg-primary text-on-primary" : isSel ? "text-primary" : has ? "text-on-surface" : "text-on-surface-variant"}">${d}</span>
          ${dots}
        </button>`);
    }
    const grid = document.getElementById("cal-grid");
    if (!grid) return;
    grid.innerHTML = `
      <div class="grid grid-cols-7 gap-1 mb-2">
        ${DAYS_TH.map(d => `<div class="text-center text-[11px] font-bold text-on-surface-variant py-1">${d}</div>`).join("")}
      </div>
      <div class="grid grid-cols-7 gap-1">${cells.join("")}</div>
      <div class="text-[11px] text-on-surface-variant text-center mt-2">แตะวันที่มีจุด เพื่อดูรายละเอียดกิจกรรม</div>`;
    grid.querySelectorAll("[data-day]").forEach(b => b.addEventListener("click", () => {
      const key = `${viewYear}-${viewMonth}-${+b.dataset.day}`;
      selected = (selected === key) ? null : key;
      renderGrid();
      renderDayDetail();
      if (selected) document.getElementById("cal-day-detail")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }));
  }

  function renderDayDetail() {
    const box = document.getElementById("cal-day-detail");
    if (!box) return;
    if (!selected) { box.innerHTML = ""; return; }
    const [y, m, d] = selected.split("-").map(Number);
    const list = eventsOn(y, m, d);
    if (!list.length) { box.innerHTML = ""; return; }
    box.innerHTML = `
      <div class="db-card p-4 mb-4" style="border-color:rgba(194,217,15,.4)">
        <div class="flex items-center justify-between mb-2">
          <div class="font-display font-bold text-[15px] text-primary">${d} ${MONTHS_TH[m]} ${y + 543}</div>
          <button id="cal-day-close" class="text-[12px] text-on-surface-variant hover:text-primary font-bold">ปิด ✕</button>
        </div>
        ${list.map(e => {
          const col = evColor(e.color);
          return `<div class="flex items-start gap-3 py-2 border-t border-surface-variant first:border-0">
            <span class="w-2.5 h-2.5 rounded-full ${col.bg} mt-1.5 shrink-0"></span>
            <div class="flex-1 min-w-0">
              <div class="font-bold text-[14px] text-on-surface">${esc(e.title)}</div>
              ${e.type ? `<div class="text-[12px] ${col.text} mt-0.5 font-medium">${esc(e.type)}</div>` : ""}
              ${e.description ? `<div class="text-[12px] text-on-surface-variant mt-1 leading-relaxed">${esc(e.description)}</div>` : ""}
            </div>
          </div>`;
        }).join("")}
      </div>`;
    box.querySelector("#cal-day-close")?.addEventListener("click", () => { selected = null; renderGrid(); renderDayDetail(); });
  }

  function renderUpcoming() {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 90);
    const upcoming = events.filter(e => e._date >= today && e._date <= cutoff);
    const upEl = document.getElementById("cal-upcoming");
    if (upEl) upEl.innerHTML = upcoming.length ? upcoming.map(eventRow).join("")
      : `<div class="text-center py-6 text-on-surface-variant text-[14px]">ไม่มีกิจกรรมใน 90 วันข้างหน้า</div>`;
  }

  // การ์ดกิจกรรม — คลิกเพื่อกระโดดไปเดือนนั้น + เลือกวัน
  function eventRow(e) {
    const col = evColor(e.color);
    return `<button data-jump="${e._date.getFullYear()}-${e._date.getMonth()}-${e._date.getDate()}" class="w-full text-left flex items-start gap-3 db-card p-3 hover:border-primary/40 transition-colors">
      <div class="w-11 h-11 rounded-xl ${col.dim} flex flex-col items-center justify-center shrink-0 leading-none">
        <span class="font-mono font-bold text-[14px] ${col.text}">${e._date.getDate()}</span>
        <span class="text-[9px] ${col.text} mt-0.5">${MONTHS_TH[e._date.getMonth()]}</span>
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-bold text-[14px] text-on-surface truncate">${esc(e.title)}</div>
        <div class="text-[12px] text-on-surface-variant mt-0.5">${e._date.getDate()} ${MONTHS_TH[e._date.getMonth()]} ${e._date.getFullYear() + 543}${e.type ? ` · ${esc(e.type)}` : ""}</div>
      </div>
      <span class="shrink-0 w-2 h-2 rounded-full ${col.bg} mt-2"></span>
    </button>`;
  }

  function renderAll() {
    const box = document.getElementById("cal-all");
    if (!box) return;
    const sorted = [...events].sort((a, b) => a._date - b._date);
    box.innerHTML = sorted.length ? sorted.map(eventRow).join("")
      : `<div class="text-center py-6 text-on-surface-variant text-[14px]">ยังไม่มีกิจกรรม</div>`;
  }

  // คลิกการ์ด (ทั้ง upcoming + all) → ไปเดือนนั้น + เลือกวัน + โชว์รายละเอียด
  function wireJump() {
    document.querySelectorAll("[data-jump]").forEach(b => b.addEventListener("click", () => {
      const [y, m, d] = b.dataset.jump.split("-").map(Number);
      viewYear = y; viewMonth = m; selected = `${y}-${m}-${d}`;
      renderGrid(); renderDayDetail();
      document.getElementById("cal-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  }

  function drawAll() { renderGrid(); renderDayDetail(); renderUpcoming(); renderAll(); wireJump(); }
  drawAll();

  // Navigation
  document.getElementById("cal-prev")?.addEventListener("click", () => {
    if (viewMonth === 0) { viewMonth = 11; viewYear--; } else viewMonth--;
    renderGrid();
  });
  document.getElementById("cal-next")?.addEventListener("click", () => {
    if (viewMonth === 11) { viewMonth = 0; viewYear++; } else viewMonth++;
    renderGrid();
  });
}

// ── Career Path ───────────────────────────────────────────────
// เลือกไอคอนตามชื่ออาชีพ
function careerIcon(name) {
  const n = name || "";
  if (/แพทย์|สุขภาพ|พยาบาล|เภสัช|ทันต/.test(n)) return "health";
  if (/กฎหมาย|ทนาย|นิติ/.test(n)) return "scale";
  if (/การเงิน|ลงทุน|บัญชี|เศรษฐ|วิเคราะห์/.test(n)) return "chart";
  if (/ออกแบบ|กราฟิก|UI|UX|ศิลป|ดีไซน์/.test(n)) return "palette";
  if (/เว็บ|ซอฟต์แวร์|โปรแกรม|คอมพิวเตอร์|ข้อมูล|IT|เทคโนโลยี/.test(n)) return "code";
  if (/วิศว|ไฟฟ้า|เครื่องกล/.test(n)) return "wrench";
  return "target";
}

// fallback (offline/DB ว่าง) — id:null = คลิกแล้วบอกให้ต่อเน็ต
const CAREERS_FALLBACK = [
  { id: null, career_name_th: "นักพัฒนาซอฟต์แวร์", base_salary_range: "45K–120K/เดือน", required_skills: ["Programming", "System Design", "Cloud"] },
  { id: null, career_name_th: "แพทย์", base_salary_range: "60K–200K/เดือน", required_skills: ["Clinical", "Research"] },
  { id: null, career_name_th: "ทนายความ / นักกฎหมาย", base_salary_range: "35K–150K/เดือน", required_skills: ["Legal Analysis", "Advocacy"] },
  { id: null, career_name_th: "นักวิเคราะห์ข้อมูล", base_salary_range: "40K–100K/เดือน", required_skills: ["Python/R", "SQL", "Statistics"] },
];

// career_id → คณะที่เกี่ยวข้อง (curate เอง เพราะ program_career_junction ใน DB ไม่สื่อความหมาย)
// faculty ids: 1 แพทย์ · 2 วิศวะ · 3 IT · 4 พาณิชย์/บัญชี · 5 นิเทศ · 6 อักษร · 7 นิติ · 8 รัฐศาสตร์ · 9 วิทย์ · 10 จิตวิทยา · 11 มนุษย์ · 13 ทันตะ · 14 เภสัช
const CAREER_FACULTY = {
  1: [3, 2],       // นักพัฒนาเว็บ/ซอฟต์แวร์
  2: [3, 9, 2],    // นักวิทยาศาสตร์ข้อมูล
  3: [3, 5],       // นักออกแบบกราฟิก/UI-UX
  4: [7, 8],       // กฎหมาย/ทนาย
  5: [4, 9],       // การเงิน/การลงทุน
  6: [1, 13, 14],  // แพทย์/สุขภาพ
};

// สายอาชีพ — ดึงจาก careers + program_career_junction (คลิก → หลักสูตร → เส้นทาง)
async function viewCareerPath() {
  document.getElementById("app").innerHTML = dashShell(`
    <div class="flex items-center justify-between mb-5">
      <h1 class="font-display font-bold text-[22px] text-on-surface">สายอาชีพ</h1>
    </div>
    <div class="db-card p-4 mb-4 flex items-center gap-3" style="background:rgba(194,217,15,.06);border-color:rgba(194,217,15,.2)">
      ${sl("target",{size:20,cls:"shrink-0",color:"#c2d90f"})}
      <div>
        <div class="font-display font-bold text-[14px] text-on-surface">เลือกอาชีพที่สนใจ</div>
        <div class="text-[12px] text-on-surface-variant">แตะอาชีพเพื่อดูหลักสูตรและเส้นทางสู่มหาวิทยาลัย</div>
      </div>
    </div>
    <div id="career-list" class="grid grid-cols-1 md:grid-cols-2 gap-3">
      ${[1,2,3,4].map(()=>`<div class="db-card p-5 animate-pulse h-32"></div>`).join("")}
    </div>
    ${detailPanelSkeleton()}
  `);
  wireCommon();

  let careers = [];
  try {
    const { data } = await db.from("careers")
      .select("id,career_name_th,career_name_en,description,required_skills,base_salary_range")
      .order("id");
    careers = data || [];
  } catch { }
  if (!careers.length) careers = CAREERS_FALLBACK;

  const listEl = document.getElementById("career-list");
  if (!listEl) return;
  listEl.innerHTML = careers.map((c, i) => {
    const skills = c.required_skills || [];
    return `<button data-career="${i}" class="text-left db-card p-5 hover:border-primary/40 transition-colors">
      <div class="flex items-start gap-3 mb-3">
        <span class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">${sl(careerIcon(c.career_name_th), { size: 26, color: "#c2d90f" })}</span>
        <div class="flex-1 min-w-0">
          <h3 class="font-display font-bold text-[16px] text-on-surface leading-snug">${esc(c.career_name_th)}</h3>
          ${c.base_salary_range ? `<p class="font-mono text-[13px] text-primary mt-0.5">${esc(c.base_salary_range)}</p>` : ""}
        </div>
        ${sl("arrow_right", { size: 16, color: "#9aa090", cls: "shrink-0 mt-1" })}
      </div>
      ${skills.length ? `<div class="flex flex-wrap gap-1.5">${skills.slice(0,4).map(s => `<span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant">${esc(s)}</span>`).join("")}</div>` : ""}
    </button>`;
  }).join("");

  listEl.querySelectorAll("[data-career]").forEach(b => b.addEventListener("click", () => {
    const c = careers[+b.dataset.career];
    if (!c.id) { toast("โหมดออฟไลน์ — ต่ออินเทอร์เน็ตเพื่อดูคณะที่เชื่อมโยง"); return; }
    openCareerFaculties(c);
  }));
}

// เปิดแผง "คณะที่พาสู่อาชีพนี้" (curate จาก CAREER_FACULTY) → เลือกคณะ → หลักสูตรจริง → เส้นทาง
async function openCareerFaculties(career) {
  const body = document.getElementById("detail-body");
  const panel = document.getElementById("detail-panel");
  const scrim = document.getElementById("panel-scrim");
  if (!body || !panel || !scrim) return;
  const close = () => { panel.classList.add("hidden-panel"); scrim.classList.add("opacity-0", "pointer-events-none"); };
  body.innerHTML = `<div class="flex justify-center py-10"><div class="cook-spinner"></div></div>`;
  panel.classList.remove("hidden-panel");
  scrim.classList.remove("opacity-0", "pointer-events-none");
  scrim.onclick = close;

  // ตัด replacement char (ม. mojibake ใน DB บางแถว)
  const desc = (career.description || "").replace(/�/g, "").trim();

  try {
    const facIds = CAREER_FACULTY[career.id] || [];
    let facs = [];
    if (facIds.length) {
      const { data } = await db.from("faculties").select("id,name_th").in("id", facIds);
      facs = facIds.map(id => (data || []).find(f => f.id === id)).filter(Boolean); // คงลำดับ
    }
    body.innerHTML = `
      <div class="flex items-center gap-3 mb-1">
        <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">${sl(careerIcon(career.career_name_th), { size: 24, color: "#c2d90f" })}</div>
        <div class="min-w-0">
          <h3 class="font-display font-extrabold text-[19px] text-on-surface leading-snug">${esc(career.career_name_th)}</h3>
          ${career.base_salary_range ? `<div class="text-[12px] font-mono text-primary">${esc(career.base_salary_range)}</div>` : ""}
        </div>
      </div>
      ${desc ? `<p class="text-[13px] text-on-surface-variant my-2 leading-relaxed">${esc(desc)}</p>` : `<div class="mb-2"></div>`}
      <div class="font-display font-bold text-[13px] text-on-surface-variant mb-2 mt-1">คณะที่พาสู่อาชีพนี้ — แตะเพื่อดูหลักสูตรและเส้นทาง</div>
      <div class="space-y-2">
        ${facs.length ? facs.map(f => `
          <button data-cfac="${f.id}" data-cfacname="${esc(f.name_th)}" class="w-full text-left flex items-center gap-3 db-card p-3 hover:border-primary/40 transition-colors">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">${sl("school", { size: 20, color: "#c2d90f" })}</div>
            <div class="flex-1 font-bold text-[15px] text-on-surface">${esc(f.name_th)}</div>
            ${sl("arrow_right", { size: 16, color: "#9aa090" })}
          </button>`).join("") : `<div class="text-center py-6 text-on-surface-variant text-[14px]">ยังไม่มีคณะแนะนำสำหรับอาชีพนี้</div>`}
      </div>
      <button id="panel-close" class="tactile-button w-full mt-4 bg-surface-container-high text-on-surface font-bold rounded-xl py-3 border-b-4 border-surface-variant">ปิด</button>`;
    document.getElementById("panel-close").onclick = close;
    body.querySelectorAll("[data-cfac]").forEach(b => b.addEventListener("click", () => {
      close();
      // ตั้ง flow แล้วไปหน้าเลือกหลักสูตรจริงของคณะนั้น → เลือก → roadmap
      state.flow = { name: career.career_name_th, track: null, facultyId: +b.dataset.cfac, facultyName: b.dataset.cfacname, program: null };
      go("programs");
    }));
  } catch {
    body.innerHTML = `<div class="text-center py-8 text-on-surface-variant">โหลดไม่สำเร็จ ลองใหม่อีกครั้ง</div>
      <button id="panel-close" class="tactile-button w-full mt-2 bg-surface-container-high text-on-surface font-bold rounded-xl py-3 border-b-4 border-surface-variant">ปิด</button>`;
    document.getElementById("panel-close").onclick = close;
  }
}

// ── Universities ──────────────────────────────────────────────
async function viewUniversities() {
  document.getElementById("app").innerHTML = dashShell(`
    <div class="flex items-center justify-between mb-5">
      <h1 class="font-display font-bold text-[22px] text-on-surface">มหาวิทยาลัย</h1>
    </div>
    <div class="relative mb-4">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">${sl("search",{size:18,color:"#9aa090"})}</span>
      <input id="uni-search" type="text" placeholder="ค้นหามหาวิทยาลัย..." class="w-full bg-surface-container-low border border-surface-variant rounded-xl pl-10 pr-4 py-3 text-[15px] text-on-surface focus:border-primary focus:outline-none"/>
    </div>
    <div id="uni-list" class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="col-span-full flex justify-center py-8">${sl("school",{size:32,color:"#3a3f34"})}</div>
    </div>
  `);
  wireCommon();

  let unis = [];
  try {
    const { data } = await db.from("universities").select("id,name_th,campus_name,region").order("name_th").limit(141);
    unis = data || [];
  } catch { }

  const regionColor = { "กรุงเทพมหานคร":"bg-primary/20 text-primary", "ต่างจังหวัด":"bg-tertiary/20 text-tertiary" };
  const renderList = (list) => list.map(u => `
    <div class="db-card p-4 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors">
      <div class="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center shrink-0 font-display font-bold text-[14px] text-on-surface-variant">
        ${esc(u.name_th.charAt(0))}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-bold text-[14px] text-on-surface truncate">${esc(u.name_th)}</div>
        ${u.campus_name && u.campus_name !== "วิทยาเขตหลัก" ? `<div class="text-[12px] text-on-surface-variant">${esc(u.campus_name)}</div>` : ""}
      </div>
      ${u.region ? `<span class="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${regionColor[u.region]||"bg-surface-variant text-on-surface-variant"}">${esc(u.region)}</span>` : ""}
    </div>`).join("");

  const listEl = document.getElementById("uni-list");
  listEl.innerHTML = renderList(unis);

  const searchEl = document.getElementById("uni-search");
  if (searchEl) searchEl.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    listEl.innerHTML = renderList(unis.filter(u => u.name_th.toLowerCase().includes(q)));
  });
}

// ── Roadmap (detail view) ─────────────────────────────────────
async function viewRoadmapList() {
  const paths = getPaths();
  if (!paths.length) { go("create-path-flow"); return; }

  const mainId = getMain();
  const mainPath = paths.find(p => p.id === mainId) || paths[0];

  document.getElementById("app").innerHTML = dashShell(`
    <div class="flex items-center justify-between mb-5">
      <h1 class="font-display font-bold text-[22px] text-on-surface">My Roadmap</h1>
      <button id="btn-new" class="tactile-button bg-primary-container text-on-primary font-display font-bold text-[13px] px-4 py-2 rounded-xl border-b-4 border-[#96a80a] flex items-center gap-2">
        ${sl("add",{size:16})} เส้นทางใหม่
      </button>
    </div>
    <!-- Path selector -->
    <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
      ${paths.map(p=>`
        <button data-open="${p.id}" class="shrink-0 px-4 py-2 rounded-full border ${p.id===mainId?"bg-primary text-on-primary border-primary":"border-surface-variant text-on-surface-variant"} font-display font-bold text-[13px] flex items-center gap-1.5">
          ${p.id===mainId ? sl("heart",{size:12,cls:"shrink-0"}) : ""} ${esc(p.name)}
        </button>`).join("")}
    </div>
    <!-- Loading roadmap -->
    <div id="roadmap-container"><div class="flex justify-center py-8"><div class="cook-spinner"></div></div></div>
  `);
  wireCommon();

  if (mainPath) loadRoadmapIntoContainer(mainPath);

  document.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => {
    const p = paths.find(x => x.id === b.dataset.open);
    if (p) loadRoadmapIntoContainer(p);
  }));
  document.getElementById("btn-new")?.addEventListener("click", () => {
    state.flow = { name:"", track:null, facultyId:null, facultyName:"", program:null };
    go("name-path");
  });
}

async function loadRoadmapIntoContainer(path) {
  const container = document.getElementById("roadmap-container");
  if (!container) return;
  try {
    const [rounds, roadmap] = await Promise.all([fetchRounds(path.programId), fetchRoadmap(path.programId)]);
    const p = roadmapProgress(roadmap, path.id);

    const roundPills = rounds.map((r, i) => `
      <button data-round="${i}" class="shrink-0 db-card px-4 py-3 flex items-center gap-2 hover:border-primary/40 transition-colors">
        <div class="w-7 h-7 rounded-full bg-tertiary/20 flex items-center justify-center font-mono font-bold text-[12px] text-tertiary">${r.round_number||"?"}</div>
        <div class="text-left">
          <div class="font-bold text-[12px] text-on-surface whitespace-nowrap">${esc(r.round_label||"รอบ "+r.round_number)}</div>
          <div class="text-[11px] text-on-surface-variant">${r.quota?"รับ ~"+r.quota+" คน":"ดูรายละเอียด"}</div>
        </div>
      </button>`).join("");

    container.innerHTML = `
      <div class="db-card p-4 mb-4">
        <div class="flex items-start gap-3 mb-3">
          <div class="flex-1 min-w-0">
            <h2 class="font-display font-bold text-[16px] text-on-surface">${esc(path.name)}</h2>
            <p class="text-[12px] text-on-surface-variant">${esc(path.programName||"")}${path.uni?" · "+esc(path.uni):""}</p>
          </div>
          <div class="shrink-0 flex items-center gap-2">
            <span data-rm-badge class="text-[12px] font-mono font-bold text-primary bg-primary/10 border border-primary/30 rounded-lg px-2 py-1">เสร็จ ${p.done}/${p.total}</span>
            ${getMain() !== path.id ? `<button id="rm-main" class="p-2 rounded-lg border border-surface-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors" title="ตั้งเป็นเส้นทางหลัก">${sl("heart",{size:16})}</button>` : ""}
            <button id="rm-path" class="flex items-center gap-1 p-2 rounded-lg border border-surface-variant text-on-surface-variant hover:border-error hover:text-error transition-colors" title="ลบเส้นทาง">${icon("delete",{cls:"text-[18px]"})}</button>
          </div>
        </div>
        <div class="flex items-center justify-between mb-1">
          <span class="text-[12px] text-on-surface-variant">ความคืบหน้า</span>
          <span data-rm-pct class="text-[12px] font-mono font-bold text-primary">${p.pct}%</span>
        </div>
        <div class="h-2 rounded-full bg-surface-variant overflow-hidden">
          <div data-rm-bar class="h-full rounded-full bg-primary" style="width:${p.pct}%;transition:width .5s cubic-bezier(.32,.78,.2,1)"></div>
        </div>
      </div>
      <h2 class="font-display font-bold text-[13px] text-on-surface-variant mb-2 flex items-center gap-1.5">${sl("target",{size:16,color:"#9aa090"})} รอบรับสมัคร <span class="font-normal">· แตะดูสัดส่วนคะแนนแต่ละรอบ</span></h2>
      <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">${roundPills||"<span class='text-on-surface-variant text-[13px]'>ยังไม่มีข้อมูลรอบรับสมัคร</span>"}</div>
      <div class="db-card mb-4 overflow-hidden">
        <button id="rm-weights-toggle" class="w-full flex items-center justify-between gap-2 p-4 text-left">
          <span class="font-display font-bold text-[14px] text-on-surface flex items-center gap-1.5">${sl("chart",{size:16,color:"#c2d90f"})} สัดส่วนคะแนนที่ใช้เข้าคณะ</span>
          <span class="text-[12px] text-on-surface-variant flex items-center gap-1"><span id="rm-weights-hint">กดดูเพิ่มเติม</span> <span id="rm-weights-caret" class="transition-transform">${sl("arrow_right",{size:16,color:"#9aa090"})}</span></span>
        </button>
        <div id="rm-weights" class="hidden px-4 pb-4"></div>
      </div>
      <h2 class="font-display font-bold text-[13px] text-on-surface-variant mb-3 flex items-center gap-1.5">${sl("route",{size:16,color:"#9aa090"})} เส้นทางเตรียมตัว <span class="font-normal">· แตะเพื่อทำเครื่องหมายเสร็จ</span></h2>
      <div class="relative">
        <div class="absolute left-[23px] top-4 bottom-4 w-0.5 bg-surface-variant"></div>
        <div id="rm-timeline">${roadmap.length ? roadmapTimelineHTML(roadmap, path.id) : "<p class='text-on-surface-variant'>ยังไม่มีข้อมูลเส้นทาง</p>"}</div>
      </div>
      ${detailPanelSkeleton()}`;

    container.querySelectorAll("[data-round]").forEach(b => b.addEventListener("click", () => openRound(rounds[+b.dataset.round])));
    wireRoadmapTimeline(path.id, roadmap);
    wireWeightsToggle(path.programId, path.facultyId);

    // ตั้งเป็นเส้นทางหลัก
    container.querySelector("#rm-main")?.addEventListener("click", () => setMainPath(path.id));

    // ลบเส้นทาง — ยืนยัน 2 จังหวะ (กันลบพลาด)
    const rmBtn = container.querySelector("#rm-path");
    if (rmBtn) {
      let armed = false, tm;
      const reset = () => {
        armed = false;
        rmBtn.innerHTML = icon("delete", { cls: "text-[18px]" });
        rmBtn.classList.remove("border-error", "text-error");
        rmBtn.classList.add("border-surface-variant", "text-on-surface-variant");
      };
      rmBtn.addEventListener("click", () => {
        if (!armed) {
          armed = true;
          rmBtn.innerHTML = `${icon("delete", { cls: "text-[18px]" })}<span class="text-[12px] font-bold whitespace-nowrap">กดอีกครั้งเพื่อลบ</span>`;
          rmBtn.classList.remove("border-surface-variant", "text-on-surface-variant");
          rmBtn.classList.add("border-error", "text-error");
          clearTimeout(tm);
          tm = setTimeout(reset, 3000);
          return;
        }
        clearTimeout(tm);
        deletePath(path.id);
      });
    }
  } catch (e) {
    container.innerHTML = `<div class="text-center py-8 text-on-surface-variant">โหลดไม่สำเร็จ ลองใหม่อีกครั้ง</div>`;
  }
}

// ── Profile — ดึงจาก users_profile + user_preferences ────────
async function viewProfileFull() {
  const loggedIn = !!state.user;

  // Show skeleton immediately
  document.getElementById("app").innerHTML = dashShell(`
    <div class="max-w-md mx-auto w-full">
      <h1 class="font-display font-bold text-[22px] text-on-surface mb-5">โปรไฟล์</h1>
      <div id="profile-body">
        <div class="flex justify-center py-8">
          <div class="cook-spinner" style="width:40px;height:40px;border-width:4px"></div>
        </div>
      </div>
    </div>
  `);
  wireCommon();

  if (!loggedIn) {
    // guest ที่กรอกข้อมูลเริ่มต้นไว้ → แสดงข้อมูลของเขา + ชวนสมัครเพื่อบันทึกถาวร
    const g = state.guest ? (state.profile || {}) : null;
    if (g && g.first_name) {
      const gInitial = (g.first_name || "?").charAt(0).toUpperCase();
      const gMeta = [g.education_level, g.gpa != null ? "GPA " + Number(g.gpa).toFixed(2) : null].filter(Boolean).join(" · ");
      document.getElementById("profile-body").innerHTML = `
        <div class="flex flex-col items-center mb-6">
          <div class="w-24 h-24 rounded-full bg-primary-container shadow-[0_4px_0_#6b7a08] flex items-center justify-center mb-3">
            <span class="font-display font-bold text-[32px] text-on-primary">${esc(gInitial)}</span>
          </div>
          <h2 class="font-display font-bold text-[20px] text-on-surface">${esc(g.first_name)}</h2>
          <p class="text-[13px] text-on-surface-variant">โหมดผู้เยี่ยมชม${gMeta ? " · " + esc(gMeta) : ""}</p>
        </div>
        <div class="db-card p-4 mb-4 flex items-start gap-3" style="background:rgba(194,217,15,.06);border-color:rgba(194,217,15,.2)">
          ${sl("info",{size:20,color:"#c2d90f",cls:"shrink-0 mt-0.5"})}
          <div class="text-[13px] text-on-surface-variant leading-relaxed">
            คุณกำลังดูแบบผู้เยี่ยมชม ข้อมูลจะถูกเก็บไว้ในเครื่องนี้เท่านั้น<br/>
            สมัครสมาชิกเพื่อบันทึกเส้นทางและข้อมูลถาวร
          </div>
        </div>
        <button data-nav="auth" class="tactile-button w-full bg-primary-container text-on-primary font-display font-bold py-3.5 rounded-xl border-b-4 border-[#6b7a08] flex items-center justify-center gap-2 mb-3">
          ${sl("add",{size:18,color:"#16180f"})} สมัครสมาชิกเพื่อบันทึกถาวร
        </button>
        <button id="btn-exit-guest" class="w-full py-3 rounded-xl border-2 border-surface-variant text-on-surface-variant font-display font-bold flex items-center justify-center gap-2 hover:border-primary/40 transition-colors">
          ${sl("logout",{size:16})} ออกจากโหมดผู้เยี่ยมชม
        </button>`;
      wireCommon();
      document.getElementById("btn-exit-guest")?.addEventListener("click", () => {
        try { localStorage.removeItem("nextstep_guest"); } catch {}
        state.guest = false; state.profile = null;
        state.authStep = "intent";
        go("auth");
      });
      return;
    }

    document.getElementById("profile-body").innerHTML = `
      <div class="text-center py-8">
        <div class="mb-4 flex justify-center">${sl("person", { size: 48, color: "#9aa090" })}</div>
        <h2 class="font-display font-bold text-[20px] text-on-surface mb-2">โหมดผู้เยี่ยมชม</h2>
        <p class="text-on-surface-variant mb-6">เข้าสู่ระบบเพื่อบันทึกข้อมูลและเส้นทาง</p>
        <button data-nav="auth" class="tactile-button bg-primary-container text-on-primary font-display font-bold px-6 py-3 rounded-xl border-b-4 border-[#96a80a]">
          เข้าสู่ระบบ / สมัครสมาชิก
        </button>
      </div>`;
    wireCommon();
    return;
  }

  // ดึง profile จริงจาก DB ผ่าน cache กลาง (source of truth)
  if (typeof loadProfile === "function") await loadProfile();
  const profile = state.profile || {};
  const prefs = state.prefs || {};

  const name = profile.first_name || state.user?.user_metadata?.first_name || "";
  const email = state.user.email || "";
  const decor = getDecor();
  const avatarUrl = decor.avatar || state._avatarUrl || null;
  const bannerUrl = decor.banner || null;
  const initial = (name || email).charAt(0).toUpperCase() || "?";

  const profileBody = document.getElementById("profile-body");
  if (!profileBody) return; // view เปลี่ยนไปแล้วระหว่าง await — กัน null crash
  profileBody.innerHTML = `
    <!-- Banner (ภาพปก) + Avatar ทับมุมล่าง -->
    <div class="relative mb-4">
      <div class="h-32 sm:h-40 rounded-2xl overflow-hidden relative border border-surface-variant">
        ${bannerUrl
          ? `<img src="${esc(bannerUrl)}" alt="banner" class="w-full h-full object-cover"/>`
          : `<div class="w-full h-full" style="background:linear-gradient(135deg,#2b6c00,#96a80a 55%,#c2d90f)"></div>
             <div class="absolute right-3 bottom-1 opacity-30">${typeof nexMascot === "function" ? nexMascot("mascot w-14 h-14", { pose: "happy" }) : ""}</div>`}
        <div class="absolute top-2 right-2 flex gap-1.5">
          ${bannerUrl ? `<button id="btn-banner-clear" class="bg-black/45 backdrop-blur text-white rounded-lg px-2 py-1 text-[12px] font-bold flex items-center gap-1 hover:bg-black/60 transition-colors">✕ ลบ</button>` : ""}
          <label for="banner-input" class="bg-black/45 backdrop-blur text-white rounded-lg px-2.5 py-1 text-[12px] font-bold flex items-center gap-1 cursor-pointer hover:bg-black/60 transition-colors">
            ${sl("camera",{size:13,color:"#ffffff"})} ${bannerUrl ? "เปลี่ยน" : "เพิ่มแบนเนอร์"}
          </label>
        </div>
        <input id="banner-input" type="file" accept="image/*" class="hidden"/>
      </div>
      <!-- Avatar overlapping -->
      <div class="absolute left-1/2 -translate-x-1/2" style="bottom:-40px">
        <div class="relative">
          <div class="w-24 h-24 rounded-full bg-primary-container border-4 border-surface shadow-[0_4px_0_#6b7a08] overflow-hidden flex items-center justify-center">
            ${avatarUrl
              ? `<img src="${esc(avatarUrl)}" alt="avatar" class="w-full h-full object-cover"/>`
              : `<span class="font-display font-bold text-[32px] text-on-primary">${esc(initial)}</span>`}
          </div>
          <label for="avatar-input" class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-surface-container-high border-2 border-surface flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
            ${sl("camera",{size:14,color:"#c2d90f"})}
          </label>
          <input id="avatar-input" type="file" accept="image/*" class="hidden"/>
        </div>
      </div>
    </div>
    <div class="text-center mb-6" style="margin-top:48px">
      <h2 class="font-display font-bold text-[20px] text-on-surface">${esc(name || "ไม่ระบุชื่อ")}</h2>
      <p class="text-[13px] text-on-surface-variant">${esc(email)}</p>
    </div>

    <!-- Editable fields — pre-filled from users_profile (onboarding data) -->
    <div class="space-y-4 mb-6">
      ${pf("ชื่อเล่น", "profile-name", "text", profile.first_name || "", "เช่น น้องเน็กซ์", "person")}
      ${pf("ระดับชั้น", "profile-grade", "select", profile.education_level || "", "", "school", ["ม.1","ม.2","ม.3","ม.4","ม.5","ม.6","ปวช.1","ปวช.2","ปวช.3","ปวส.1","ปวส.2"])}
      ${pf("โรงเรียน", "profile-school", "text", profile.school_name || "", "ชื่อโรงเรียน", "search")}
      ${pf("GPAX ล่าสุด", "profile-gpax", "number", profile.gpa != null ? profile.gpa : "", "เช่น 3.50", "chart")}
    </div>

    <button id="btn-save-profile" class="tactile-button w-full bg-primary-container text-on-primary font-display font-bold py-3.5 rounded-xl border-b-4 border-[#6b7a08] flex items-center justify-center gap-2 mb-3">
      ${sl("check",{size:18,color:"#16180f"})} บันทึกข้อมูล
    </button>
    <button id="btn-logout" class="w-full py-3 rounded-xl border-2 border-surface-variant text-error font-display font-bold flex items-center justify-center gap-2 hover:border-error/40 hover:bg-error/5 transition-colors">
      ${sl("logout",{size:16})} ออกจากระบบ
    </button>
  `;
  wireCommon();
  wireProfile();
}

// field builder — icon prefix, lime focus ring, shows filled value
function pf(label, id, type, value, placeholder, iconName, options) {
  const iconEl = sl(iconName, {size:18, color:"#6b7a08"});
  if (type === "select") {
    let list = (options || []).slice();
    if (value && !list.includes(value)) list = [value, ...list]; // คงค่าที่บันทึกไว้ (เช่น ปวช./free text)
    const opts = list.map(o =>
      `<option value="${esc(o)}" ${o===value?"selected":""}>${esc(o)}</option>`
    ).join("");
    return `<div class="pf-field">
      <label class="ob-label">${esc(label)}</label>
      <div class="relative">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">${iconEl}</span>
        <select id="${esc(id)}" class="ob-input pl-11">
          <option value="">— เลือกระดับชั้น —</option>${opts}
        </select>
      </div>
    </div>`;
  }
  return `<div class="pf-field">
    <label class="ob-label">${esc(label)}</label>
    <div class="relative">
      <span class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">${iconEl}</span>
      <input id="${esc(id)}" type="${type}" value="${esc(String(value))}"
        placeholder="${esc(placeholder)}"
        ${type==="number"?"min='1' max='4' step='0.01'":""}
        class="ob-input pl-11 ${type==="number"?"font-mono":""}"/>
    </div>
  </div>`;
}

function wireProfile() {
  // Avatar — ย่อรูปแล้วเก็บใน localStorage (ใช้ได้ทุกโหมด + ค้างหลังรีเฟรช)
  document.getElementById("avatar-input")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readCompressedImage(file, 400, 400);
      if (setDecor({ avatar: dataUrl })) { toast("อัปเดตรูปโปรไฟล์แล้ว"); go("profile"); }
    } catch { toast("อ่านรูปไม่สำเร็จ ลองรูปอื่นนะ"); }
  });

  // Banner (ภาพปก) — ย่อรูปกว้างกว่า
  document.getElementById("banner-input")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readCompressedImage(file, 1200, 480);
      if (setDecor({ banner: dataUrl })) { toast("อัปเดตแบนเนอร์แล้ว"); go("profile"); }
    } catch { toast("อ่านรูปไม่สำเร็จ ลองรูปอื่นนะ"); }
  });
  document.getElementById("btn-banner-clear")?.addEventListener("click", () => {
    setDecor({ banner: null }); toast("ลบแบนเนอร์แล้ว"); go("profile");
  });

  // Save — upsert to users_profile AND update auth metadata (keeps in sync)
  document.getElementById("btn-save-profile")?.addEventListener("click", async () => {
    const btn = document.getElementById("btn-save-profile");
    const fname = document.getElementById("profile-name")?.value.trim() || "";
    const grade = document.getElementById("profile-grade")?.value || "";
    const school = document.getElementById("profile-school")?.value.trim() || "";
    const gpaxRaw = document.getElementById("profile-gpax")?.value;
    const gpa = gpaxRaw ? parseFloat(gpaxRaw) : null;

    if (gpa !== null && (isNaN(gpa) || gpa < 1 || gpa > 4)) {
      toast("GPAX ต้องอยู่ระหว่าง 1.00–4.00"); return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span class="ob-spinner inline-block"></span> กำลังบันทึก...`;

    // admin/demo mode — บันทึกลง state อย่างเดียว (ไม่แตะ Supabase)
    if (state.admin) {
      state.profile = { ...state.profile, first_name: fname, education_level: grade, school_name: school, gpa };
      state.user.user_metadata = { ...state.user.user_metadata, first_name: fname };
      toast("บันทึกสำเร็จ (Demo)");
      btn.disabled = false;
      btn.innerHTML = `${sl("check",{size:18,color:"#16180f"})} บันทึกข้อมูล`;
      return;
    }

    try {
      // 1. Save to users_profile (main source of truth) — update ให้ตรง + คง onboarded
      const { error } = await db.from("users_profile").update({
        first_name: fname,
        education_level: grade,
        school_name: school,
        gpa: gpa,
      }).eq("id", state.user.id);
      if (error) throw error;
      // 2. Mirror first_name into auth metadata so displayName() works instantly
      await db.auth.updateUser({ data: { first_name: fname } });
      // 3. refresh cache → dashboard/sidebar เห็นข้อมูลใหม่ทันที
      if (typeof loadProfile === "function") await loadProfile();

      toast("บันทึกสำเร็จ");
      btn.disabled = false;
      btn.innerHTML = `${sl("check",{size:18,color:"#16180f"})} บันทึกข้อมูล`;
    } catch {
      toast("บันทึกไม่สำเร็จ ลองใหม่");
      btn.disabled = false;
      btn.innerHTML = `${sl("check",{size:18,color:"#16180f"})} บันทึกข้อมูล`;
    }
  });

  document.getElementById("btn-logout")?.addEventListener("click", doLogout);
}

// ── Chance Calculator (คำนวณโอกาสเข้าคณะในฝัน) — ข้อมูล TCAS70 ──
const CALC = { fac: null, scores: {} };

function viewCalculator() {
  if (!CALC.fac) CALC.fac = TCAS70.faculties[0].key;
  const facOptions = TCAS70.faculties.map(f =>
    `<option value="${f.key}" ${f.key === CALC.fac ? "selected" : ""}>${esc(f.label)}</option>`).join("");

  document.getElementById("app").innerHTML = dashShell(`
    <div class="max-w-2xl mx-auto w-full">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-11 h-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">${sl("target",{size:22,color:"#c2d90f"})}</div>
        <div class="min-w-0">
          <h1 class="font-display font-bold text-[22px] text-on-surface leading-tight">คำนวณโอกาสเข้าคณะในฝัน</h1>
          <p class="text-[12px] text-on-surface-variant">อ้างอิงเกณฑ์ ${esc(TCAS70.label)} · ${esc(TCAS70.source)}</p>
        </div>
      </div>

      <div class="db-card p-3 mb-4 flex items-start gap-2" style="background:rgba(234,179,8,.06);border-color:rgba(234,179,8,.25)">
        ${sl("info",{size:16,color:"#eab308",cls:"shrink-0"})}
        <p class="text-[12px] text-on-surface-variant leading-relaxed">${esc(TCAS70.estimateNote)} — เป็นการประเมินคร่าวๆ เกณฑ์จริงแต่ละที่ต่างกัน ตรวจสอบที่ mytcas.com</p>
      </div>

      <label class="ob-label">เลือกคณะเป้าหมาย</label>
      <div class="relative mb-4">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">${sl("school",{size:18,color:"#6b7a08"})}</span>
        <select id="calc-fac" class="ob-input pl-11">${facOptions}</select>
      </div>

      <div id="calc-inputs"></div>

      <button id="calc-run" class="tactile-button w-full bg-primary-container text-on-primary font-display font-bold py-3.5 rounded-xl border-b-4 border-[#6b7a08] flex items-center justify-center gap-2 mt-1 mb-4">
        ${sl("target",{size:18,color:"#16180f"})} คำนวณโอกาส
      </button>

      <div id="calc-result"></div>
    </div>
  `);
  wireCommon();
  renderCalcInputs();
  document.getElementById("calc-fac")?.addEventListener("change", (e) => {
    CALC.fac = e.target.value;
    renderCalcInputs();
    const r = document.getElementById("calc-result"); if (r) r.innerHTML = "";
  });
  document.getElementById("calc-run")?.addEventListener("click", () => {
    const fac = TCAS70.faculties.find(f => f.key === CALC.fac);
    renderCalcResult(fac, tcasComputeChance(fac, CALC.scores));
  });
}

function renderCalcInputs() {
  const fac = TCAS70.faculties.find(f => f.key === CALC.fac);
  const box = document.getElementById("calc-inputs");
  if (!fac || !box) return;
  const keys = tcasFacultySubjects(fac);
  box.innerHTML = `
    <div class="db-card p-4 mb-4">
      <div class="text-[12px] text-on-surface-variant mb-3">กรอกคะแนนที่มี (เว้นว่างได้ — ระบบจะถือว่ายังไม่มี = 0)</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${keys.map(k => {
          const s = TCAS70.subjects[k];
          const val = CALC.scores[k] ?? "";
          return `<div>
            <label class="ob-label">${esc(s.label)} <span class="text-on-surface-variant font-normal">/ ${s.max}</span></label>
            <input data-score="${k}" type="number" min="0" max="${s.max}" step="${s.step}" value="${esc(String(val))}" placeholder="${esc(s.ph)}" class="ob-input font-mono" />
          </div>`;
        }).join("")}
      </div>
      <div class="mt-3 text-[12px] text-on-surface-variant">เกณฑ์อ้างอิง: ${esc(fac.round)}${fac.minGpax ? ` · GPAX ขั้นต่ำ ${fac.minGpax.toFixed(2)}` : ""} · คะแนนอ้างอิง ~${fac.ref}%</div>
    </div>`;
  box.querySelectorAll("[data-score]").forEach(inp =>
    inp.addEventListener("input", () => { CALC.scores[inp.dataset.score] = inp.value; }));
}

function renderCalcResult(fac, res) {
  const box = document.getElementById("calc-result");
  if (!box) return;
  const circ = 2 * Math.PI * 52;
  const dash = circ * (res.chance / 100);
  const bars = res.rows.map(r => {
    const s = TCAS70.subjects[r.subj];
    return `<div class="mb-2">
      <div class="flex items-center justify-between text-[12px] mb-1">
        <span class="text-on-surface">${esc(s.label)} <span class="text-on-surface-variant">· น้ำหนัก ${r.w}%</span></span>
        <span class="font-mono ${r.has ? "text-on-surface" : "text-error"}">${r.has ? r.pct + "%" : "ไม่ได้กรอก"}</span>
      </div>
      <div class="h-2 rounded-full bg-surface-variant overflow-hidden">
        <div class="h-full rounded-full" style="width:${r.pct}%;background:${r.pct >= fac.ref ? "#22c55e" : "#c2d90f"};transition:width .5s"></div>
      </div>
    </div>`;
  }).join("");
  const weak = res.rows.filter(r => r.pct < fac.ref).sort((a, b) => b.w - a.w).slice(0, 3);
  const hints = weak.length ? `<div class="mt-3 text-[13px] text-on-surface-variant"><span class="font-bold text-on-surface">ควรเพิ่มคะแนน:</span> ${weak.map(r => esc(TCAS70.subjects[r.subj].label)).join(" · ")}</div>` : "";

  box.innerHTML = `
    <div class="db-card p-5">
      <div class="flex flex-col sm:flex-row items-center gap-5">
        <div class="relative shrink-0" style="width:130px;height:130px">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="52" fill="none" stroke="#3a3f34" stroke-width="12"/>
            <circle cx="65" cy="65" r="52" fill="none" stroke="${res.label.c}" stroke-width="12" stroke-linecap="round"
              stroke-dasharray="${dash} ${circ}" transform="rotate(-90 65 65)" style="transition:stroke-dasharray .8s cubic-bezier(.32,.78,.2,1)"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="font-mono font-bold text-[34px] leading-none" style="color:${res.label.c}">${res.chance}%</span>
            <span class="text-[11px] text-on-surface-variant mt-1">โอกาสผ่าน</span>
          </div>
        </div>
        <div class="flex-1 min-w-0 text-center sm:text-left">
          <div class="font-display font-bold text-[18px]" style="color:${res.label.c}">${esc(res.label.t)}</div>
          <div class="text-[13px] text-on-surface-variant mt-1">${esc(fac.label)} · ${esc(fac.round)}</div>
          <div class="flex items-center justify-center sm:justify-start gap-4 mt-3">
            <div><div class="text-[11px] text-on-surface-variant">คะแนนคุณ (ถ่วงน้ำหนัก)</div><div class="font-mono font-bold text-[20px] text-on-surface">${res.composite}%</div></div>
            <div class="text-on-surface-variant">vs</div>
            <div><div class="text-[11px] text-on-surface-variant">คะแนนอ้างอิง</div><div class="font-mono font-bold text-[20px] text-on-surface">${res.ref}%</div></div>
          </div>
        </div>
      </div>
      ${res.gpaxWarn ? `<div class="mt-4 flex items-center gap-2 text-[13px] text-error bg-error/10 rounded-lg px-3 py-2">${sl("info",{size:16,color:"#ffb4ab"})} ${esc(res.gpaxWarn)}</div>` : ""}
      <div class="mt-5">
        <div class="font-display font-bold text-[13px] text-on-surface-variant mb-2">คะแนนแต่ละวิชา เทียบเกณฑ์อ้างอิง (${fac.ref}%)</div>
        ${bars}${hints}
      </div>
      <div class="mt-4 text-[11px] text-on-surface-variant leading-relaxed border-t border-surface-variant pt-3">
        ${sl("info",{size:12,color:"#9aa090",cls:"inline align-middle"})} ${esc(TCAS70.estimateNote)} · เกณฑ์จริงของแต่ละมหาวิทยาลัยดูที่ mytcas.com
      </div>
    </div>`;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ── Settings ──────────────────────────────────────────────────
async function viewSettings() {
  const theme = localStorage.getItem("nextstep_theme") || "dark";
  const notif = localStorage.getItem("nextstep_notif") !== "false";
  // ผู้ใช้มีรหัสผ่าน (email identity) ไหม — Google-only ยังไม่มี → เป็น "ตั้งรหัส"
  const hasPassword = (state.user?.identities || []).some(i => i.provider === "email")
    || state.user?.app_metadata?.provider === "email"
    || (state.user?.app_metadata?.providers || []).includes("email");

  const toggle = (id, on, label, sub) => `
    <div class="db-card p-4 flex items-center justify-between gap-3">
      <div>
        <div class="font-bold text-[14px] text-on-surface">${label}</div>
        ${sub ? `<div class="text-[12px] text-on-surface-variant mt-0.5">${sub}</div>` : ""}
      </div>
      <button id="${id}" role="switch" aria-checked="${on}" class="relative w-12 h-6 rounded-full transition-colors ${on?"bg-primary":"bg-surface-variant"} shrink-0">
        <span class="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-surface shadow-sm ${on?"left-6":"left-0.5"}"></span>
      </button>
    </div>`;

  // BUG-7: render into #app directly, then wire
  document.getElementById("app").innerHTML = dashShell(`
    <h1 class="font-display font-bold text-[22px] text-on-surface mb-5">ตั้งค่า</h1>

    <div class="space-y-2 mb-6">
      <h2 class="font-display font-bold text-[13px] text-on-surface-variant px-1 mb-1">ธีม</h2>
      <div class="db-card p-4 flex gap-3">
        ${["dark","light"].map(t=>`
          <button data-theme="${t}" class="flex-1 py-3 rounded-xl border-2 ${theme===t?"border-primary bg-primary/10":"border-surface-variant"} font-display font-bold text-[13px] text-on-surface flex items-center justify-center gap-2 transition-colors">
            ${t==="dark"?sl("moon",{size:16}):sl("sun",{size:16})} ${t==="dark"?"โหมดมืด":"โหมดสว่าง"}
          </button>`).join("")}
      </div>
    </div>

    <div class="space-y-2 mb-6">
      <h2 class="font-display font-bold text-[13px] text-on-surface-variant px-1 mb-1">การแจ้งเตือน</h2>
      ${toggle("toggle-notif", notif, "แจ้งเตือนกิจกรรมและสอบ", "รับการแจ้งเตือนก่อนสอบ 7 วัน")}
    </div>

    <div class="space-y-2 mb-6">
      <h2 class="font-display font-bold text-[13px] text-on-surface-variant px-1 mb-1">บัญชี</h2>
      ${state.user ? `
      <!-- เปลี่ยน/ตั้งรหัสผ่าน -->
      <button id="btn-toggle-pw" class="db-card p-4 w-full flex items-center justify-between hover:border-primary/40 transition-colors">
        <span class="font-bold text-[14px] text-on-surface flex items-center gap-2">${sl("lock",{size:16,color:"#9aa090"})} ${hasPassword ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่าน (เข้าสู่ระบบด้วยอีเมล)"}</span>
        ${sl("arrow_right",{size:16,color:"#9aa090"})}
      </button>
      <div id="pw-form" class="hidden db-card p-4 space-y-3">
        ${hasPassword ? `<div>
          <label class="ob-label">รหัสผ่านปัจจุบัน</label>
          <input id="cp-current" type="password" autocomplete="current-password" placeholder="••••••••" class="ob-input" />
        </div>` : ""}
        <div>
          <label class="ob-label">รหัสผ่านใหม่ <span class="text-on-surface-variant font-normal">(อย่างน้อย 8 ตัว)</span></label>
          <input id="cp-new" type="password" autocomplete="new-password" placeholder="••••••••" class="ob-input" />
          <div id="cp-strength"></div>
        </div>
        <div>
          <label class="ob-label">ยืนยันรหัสผ่านใหม่</label>
          <input id="cp-confirm" type="password" autocomplete="new-password" placeholder="••••••••" class="ob-input" />
        </div>
        <button id="cp-submit" class="ob-btn-primary">${sl("check",{size:16,color:"#16180f"})} ${hasPassword ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่าน"}</button>
      </div>` : ""}
      <div class="db-card p-4 flex items-center justify-between">
        <span class="font-bold text-[14px] text-on-surface">เวอร์ชั่น</span>
        <span class="font-mono text-[13px] text-on-surface-variant">1.0.0-beta</span>
      </div>
    </div>

    ${state.user ? `<button id="btn-logout" class="w-full py-3 rounded-xl border-2 border-surface-variant text-error font-display font-bold flex items-center justify-center gap-2 hover:border-error/40 hover:bg-error/5 transition-colors">
      ${sl("logout",{size:16})} ออกจากระบบ
    </button>` : `<button data-nav="auth" class="ob-btn-primary">${sl("arrow_right",{size:16,color:"#16180f"})} เข้าสู่ระบบ</button>`}
  `);
  wireCommon();

  // Wire settings — DOM is ready here
  document.querySelectorAll("[data-theme]").forEach(b => b.addEventListener("click", () => {
    const t = b.dataset.theme;
    localStorage.setItem("nextstep_theme", t);
    document.documentElement.classList.toggle("light", t === "light");
    go("settings");
    toast(`เปลี่ยนเป็น${t==="dark"?"โหมดมืด":"โหมดสว่าง"}แล้ว`);
  }));
  document.getElementById("toggle-notif")?.addEventListener("click", () => {
    const cur = localStorage.getItem("nextstep_notif") !== "false";
    localStorage.setItem("nextstep_notif", String(!cur));
    go("settings");
  });
  document.getElementById("btn-logout")?.addEventListener("click", doLogout);

  // เปลี่ยน/ตั้งรหัสผ่าน
  document.getElementById("btn-toggle-pw")?.addEventListener("click", () => {
    const f = document.getElementById("pw-form");
    if (f) { f.classList.toggle("hidden"); if (!f.classList.contains("hidden")) wireStrength("cp-new", "cp-strength"); }
  });
  document.getElementById("cp-submit")?.addEventListener("click", async () => {
    const cur = document.getElementById("cp-current")?.value || "";
    const nw = document.getElementById("cp-new").value;
    const cf = document.getElementById("cp-confirm").value;
    const err = validatePassword(nw, cf);
    if (err) { toast(err); return; }

    if (state.admin) { toast("โหมด Demo: ไม่เปลี่ยนรหัสจริง"); go("settings"); return; }

    const btn = document.getElementById("cp-submit");
    btn.disabled = true; btn.innerHTML = `<span class="ob-spinner inline-block"></span> กำลังบันทึก...`;
    const reset = () => { btn.disabled = false; btn.innerHTML = `${sl("check",{size:16,color:"#16180f"})} ${hasPassword ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่าน"}`; };

    // reauth ด้วยรหัสเดิมก่อน (เฉพาะผู้ใช้ที่มีรหัสอยู่แล้ว) — ปลอดภัย
    if (hasPassword) {
      if (!cur) { toast("กรอกรหัสผ่านปัจจุบันด้วยนะ"); reset(); return; }
      const { error: reErr } = await db.auth.signInWithPassword({ email: state.user.email, password: cur });
      if (reErr) { toast("รหัสผ่านปัจจุบันไม่ถูกต้อง"); reset(); return; }
    }
    const { error } = await db.auth.updateUser({ password: nw });
    if (error) { toast(authErr(error)); reset(); return; }
    toast(hasPassword ? "เปลี่ยนรหัสผ่านสำเร็จ" : "ตั้งรหัสผ่านสำเร็จ ใช้อีเมล+รหัสนี้ล็อกอินได้แล้ว");
    go("settings");
  });
}
