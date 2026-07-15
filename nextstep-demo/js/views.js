// ============================================================
// NEXTSTEP — All core views
// news · calendar · career-path · profile · settings · roadmap · universities
// ============================================================

// ── News ──────────────────────────────────────────────────────
function viewNews() {
  const articles = [
    { cat: "ระดับชาติ", date: "25 พ.ค. 68", title: "ทปอ. ปรับเกณฑ์ TCAS68 ใช้ TGAT/TPAT ขั้นต่ำ 30%", body: "ที่ประชุมอธิการบดีแห่งประเทศไทย (ทปอ.) มีมติปรับเกณฑ์คะแนนขั้นต่ำของ TGAT และ TPAT ในการคัดเลือก TCAS68 เพิ่มขึ้นเป็น 30% สำหรับทุกรอบ" },
    { cat: "มหาวิทยาลัย", date: "27 พ.ค. 68", title: "จุฬาฯ เพิ่มที่นั่ง รอบ Portfolio คณะวิศวะ 20 ที่", body: "จุฬาลงกรณ์มหาวิทยาลัยประกาศเพิ่มโควตารอบ Portfolio สำหรับคณะวิศวกรรมศาสตร์อีก 20 ที่นั่ง เพื่อเปิดโอกาสให้นักเรียนที่มีผลงานดีเด่นเข้าถึงการคัดเลือก" },
    { cat: "ข้อสอบ", date: "25 พ.ค. 68", title: "กสพท ประกาศวันรับสมัคร TCAS68 รอบ 2 แล้ว", body: "กสพท ออกประกาศกำหนดวันรับสมัครรอบที่ 2 (Quota) ของ TCAS68 อย่างเป็นทางการ พร้อมเปิดรับสมัครผ่านระบบ myTCAS ตั้งแต่วันที่ 1 มิ.ย. 68" },
    { cat: "แนะแนว", date: "22 พ.ค. 68", title: "เปิดตัว 'NEX Score' เครื่องมือประเมินโอกาสสอบติดใหม่", body: "แพลตฟอร์ม NEX เปิดตัวฟีเจอร์ใหม่ NEX Score ที่ช่วยประเมินโอกาสสอบติดแบบ real-time โดยคำนวณจาก GPAX, คะแนนสอบ และเกณฑ์ของแต่ละมหาวิทยาลัย" },
    { cat: "ทุนการศึกษา", date: "20 พ.ค. 68", title: "สสวท. เปิดรับสมัครทุน พสวท. ปี 2568", body: "สถาบันส่งเสริมการสอนวิทยาศาสตร์และเทคโนโลยี เปิดรับสมัครนักเรียนทุน พสวท. ประจำปี 2568 สำหรับนักเรียนสายวิทย์-คณิต ผู้สนใจสามารถสมัครผ่านเว็บไซต์ได้ถึง 15 มิ.ย. 68" },
  ];
  const catColor = { "ระดับชาติ": "bg-error/20 text-error", "มหาวิทยาลัย": "bg-tertiary/20 text-tertiary", "ข้อสอบ": "bg-primary/20 text-primary", "แนะแนว": "bg-secondary/20 text-secondary", "ทุนการศึกษา": "bg-[#ff9800]/20 text-[#ff9800]" };

  const cards = articles.map((a, i) => `
    <article class="db-card p-5 cursor-pointer hover:border-primary/40 transition-colors" data-article="${i}">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${catColor[a.cat] || "bg-surface-variant text-on-surface-variant"}">${esc(a.cat)}</span>
        <span class="text-[12px] text-on-surface-variant">${esc(a.date)}</span>
      </div>
      <h3 class="font-display font-bold text-[15px] text-on-surface leading-snug mb-1">${esc(a.title)}</h3>
      <p class="text-[13px] text-on-surface-variant leading-relaxed line-clamp-2">${esc(a.body)}</p>
    </article>`).join("");

  return dashShell(`
    <div class="flex items-center justify-between mb-5">
      <h1 class="font-display font-bold text-[22px] text-on-surface">ข่าวสารการศึกษา</h1>
      <div class="flex gap-2">
        ${["ทั้งหมด","ระดับชาติ","มหาวิทยาลัย","ข้อสอบ"].map((l,i)=>`<button class="text-[12px] font-bold px-3 py-1 rounded-full border ${i===0?"bg-primary text-on-primary border-primary":"border-surface-variant text-on-surface-variant"}">${l}</button>`).join("")}
      </div>
    </div>
    <div class="space-y-3">${cards}</div>
  `);
}

// ── Calendar ──────────────────────────────────────────────────
function viewCalendar() {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const MONTHS_TH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  const DAYS_TH = ["อา","จ","อ","พ","พฤ","ศ","ส"];

  const events = [
    { date: new Date(2026,6,15), title: "สอบ TPAT3 (คณิต-วิทย์)", type: "exam", color: "bg-error" },
    { date: new Date(2026,6,22), title: "Young Scientist Camp รอบรับสมัคร", type: "activity", color: "bg-tertiary" },
    { date: new Date(2026,7,1),  title: "Open House จุฬา วิศวะ", type: "open-house", color: "bg-primary" },
    { date: new Date(2026,7,10), title: "TCAS68 รอบ 2 — ปิดรับสมัคร", type: "deadline", color: "bg-[#ff9800]" },
    { date: new Date(2026,7,20), title: "ประกาศผล TGAT/TPAT", type: "result", color: "bg-secondary" },
  ];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(`<div></div>`);
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate();
    const ev = events.find(e => e.date.getDate()===d && e.date.getMonth()===month);
    cells.push(`
      <div class="relative flex flex-col items-center py-1">
        <span class="w-8 h-8 flex items-center justify-center rounded-full font-mono text-[13px] font-bold ${isToday ? "bg-primary text-on-primary" : "text-on-surface-variant"}">${d}</span>
        ${ev ? `<span class="w-1.5 h-1.5 rounded-full ${ev.color} mt-0.5"></span>` : ""}
      </div>`);
  }

  const upcomingList = events.map(e => `
    <div class="flex items-start gap-3 p-3 db-card">
      <div class="w-10 h-10 rounded-xl ${e.color}/20 border border-current flex items-center justify-center shrink-0 ${e.color.replace("bg-","text-")}">
        <span class="font-mono font-bold text-[14px]">${e.date.getDate()}</span>
      </div>
      <div>
        <div class="font-bold text-[14px] text-on-surface">${esc(e.title)}</div>
        <div class="text-[12px] text-on-surface-variant mt-0.5">${e.date.getDate()} ${MONTHS_TH[e.date.getMonth()]} ${e.date.getFullYear()+543}</div>
      </div>
    </div>`).join("");

  return dashShell(`
    <div class="flex items-center justify-between mb-5">
      <h1 class="font-display font-bold text-[22px] text-on-surface">ปฏิทิน TCAS</h1>
      <div class="flex items-center gap-2">
        <button class="p-1.5 rounded-lg border border-surface-variant text-on-surface-variant">${sl("arrow_left",{size:16})}</button>
        <span class="font-display font-bold text-[15px] text-on-surface">${MONTHS_TH[month]} ${year+543}</span>
        <button class="p-1.5 rounded-lg border border-surface-variant text-on-surface-variant">${sl("arrow_right",{size:16})}</button>
      </div>
    </div>
    <div class="db-card p-4 mb-4">
      <div class="grid grid-cols-7 gap-1 mb-2">
        ${DAYS_TH.map(d=>`<div class="text-center text-[11px] font-bold text-on-surface-variant py-1">${d}</div>`).join("")}
      </div>
      <div class="grid grid-cols-7 gap-1">${cells.join("")}</div>
    </div>
    <h2 class="font-display font-bold text-[14px] text-on-surface-variant mb-3">กิจกรรมที่กำลังจะมาถึง</h2>
    <div class="space-y-2">${upcomingList}</div>
  `);
}

// ── Career Path ───────────────────────────────────────────────
function viewCareerPath() {
  const careers = [
    { id:1, icon:"💻", title:"วิศวกรซอฟต์แวร์", salary:"45K–120K/เดือน", demand:"สูงมาก", faculties:["IT","วิศวะ"], skills:["Programming","System Design","Cloud"] },
    { id:2, icon:"🏥", title:"แพทย์", salary:"60K–200K/เดือน", demand:"สูง", faculties:["แพทย์"], skills:["Clinical","Research","Communication"] },
    { id:3, icon:"⚖️", title:"ทนายความ / นักกฎหมาย", salary:"35K–150K/เดือน", demand:"ปานกลาง", faculties:["นิติ","รัฐศาสตร์"], skills:["Legal Analysis","Research","Advocacy"] },
    { id:4, icon:"📊", title:"นักวิเคราะห์ข้อมูล", salary:"40K–100K/เดือน", demand:"สูงมาก", faculties:["IT","วิทยาศาสตร์","พาณิชย์"], skills:["Python/R","SQL","Statistics","ML"] },
    { id:5, icon:"🎨", title:"นักออกแบบ UX/UI", salary:"35K–90K/เดือน", demand:"สูง", faculties:["IT","ศิลปกรรม","นิเทศ"], skills:["Figma","Research","Prototyping"] },
    { id:6, icon:"📡", title:"วิศวกรไฟฟ้า/สื่อสาร", salary:"40K–100K/เดือน", demand:"สูง", faculties:["วิศวะ"], skills:["Electronics","Telecom","Control Systems"] },
  ];
  const demandCls = { "สูงมาก":"bg-primary/20 text-primary", "สูง":"bg-tertiary/20 text-tertiary", "ปานกลาง":"bg-secondary/20 text-secondary" };

  const cards = careers.map(c => `
    <div class="db-card p-5 cursor-pointer hover:border-primary/40 transition-colors">
      <div class="flex items-start gap-3 mb-3">
        <span class="text-3xl shrink-0">${c.icon}</span>
        <div class="flex-1 min-w-0">
          <h3 class="font-display font-bold text-[16px] text-on-surface">${esc(c.title)}</h3>
          <p class="font-mono text-[13px] text-primary mt-0.5">${esc(c.salary)}</p>
        </div>
        <span class="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${demandCls[c.demand]||""}">${esc(c.demand)}</span>
      </div>
      <div class="flex flex-wrap gap-1.5 mb-2">
        ${c.skills.map(s=>`<span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant">${esc(s)}</span>`).join("")}
      </div>
      <p class="text-[12px] text-on-surface-variant">คณะที่เกี่ยวข้อง: ${c.faculties.join(", ")}</p>
    </div>`).join("");

  return dashShell(`
    <div class="flex items-center justify-between mb-5">
      <h1 class="font-display font-bold text-[22px] text-on-surface">สายอาชีพ</h1>
      <button id="btn-new" class="tactile-button bg-primary-container text-on-primary font-display font-bold text-[13px] px-4 py-2 rounded-xl border-b-4 border-[#96a80a] flex items-center gap-2">
        ${sl("add",{size:16})} สายของคุณ
      </button>
    </div>
    <div class="db-card p-4 mb-4 flex items-center gap-3" style="background:rgba(194,217,15,.06);border-color:rgba(194,217,15,.2)">
      ${sl("target",{size:20,cls:"text-primary shrink-0",color:"#c2d90f"})}
      <div>
        <div class="font-display font-bold text-[14px] text-on-surface">ยังไม่ได้เลือกสายอาชีพ</div>
        <div class="text-[12px] text-on-surface-variant">เลือกอาชีพที่สนใจเพื่อดูเส้นทางสู่มหาวิทยาลัย</div>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${cards}</div>
  `);
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
    const total = roadmap.length || 1;

    const nodes = roadmap.map((s, i) => {
      const current = i === 0;
      return `
        <div class="flex items-start gap-4 mb-5 relative">
          <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 z-10 ${current ? "bg-primary border-primary shadow-[0_4px_0_#96a80a] pulse-animation" : "bg-surface-container border-surface-variant"}">
            ${current ? sl("route",{size:18,color:"#16180f"}) : `<span class="font-mono font-bold text-[13px] text-on-surface-variant">${s.step_number}</span>`}
          </div>
          <div class="flex-1 db-card p-4 ${current ? "border-primary/50" : ""}">
            <div class="flex items-center justify-between gap-2">
              <h3 class="font-display font-bold text-[15px] ${current ? "text-primary" : "text-on-surface"}">${esc(s.title)}</h3>
              ${s.target_period ? `<span class="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary/20 text-secondary">${esc(s.target_period)}</span>` : ""}
            </div>
            ${s.description ? `<p class="text-[13px] text-on-surface-variant mt-1 leading-relaxed">${esc(s.description)}</p>` : ""}
          </div>
        </div>`;
    }).join("");

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
          <div class="flex-1">
            <h2 class="font-display font-bold text-[16px] text-on-surface">${esc(path.name)}</h2>
            <p class="text-[12px] text-on-surface-variant">${esc(path.programName||"")}${path.uni?" · "+esc(path.uni):""}</p>
          </div>
          <span class="shrink-0 text-[12px] font-mono font-bold text-primary bg-primary/10 border border-primary/30 rounded-lg px-2 py-1">ขั้น 1/${total}</span>
        </div>
        <div class="h-2 rounded-full bg-surface-variant overflow-hidden">
          <div class="h-full rounded-full bg-primary" style="width:${Math.round((1/total)*100)}%"></div>
        </div>
      </div>
      <h2 class="font-display font-bold text-[13px] text-on-surface-variant mb-2 flex items-center gap-1.5">${sl("target",{size:16,color:"#9aa090"})} รอบรับสมัคร</h2>
      <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">${roundPills||"<span class='text-on-surface-variant text-[13px]'>ยังไม่มีข้อมูลรอบรับสมัคร</span>"}</div>
      <h2 class="font-display font-bold text-[13px] text-on-surface-variant mb-3 flex items-center gap-1.5">${sl("route",{size:16,color:"#9aa090"})} เส้นทางเตรียมตัว</h2>
      <div class="relative">
        <div class="absolute left-[19px] top-4 bottom-4 w-0.5 bg-surface-variant"></div>
        ${nodes||"<p class='text-on-surface-variant'>ยังไม่มีข้อมูลเส้นทาง</p>"}
      </div>
      ${detailPanelSkeleton()}`;

    container.querySelectorAll("[data-round]").forEach(b => b.addEventListener("click", () => openRound(rounds[+b.dataset.round])));
  } catch (e) {
    container.innerHTML = `<div class="text-center py-8 text-on-surface-variant">โหลดไม่สำเร็จ ลองใหม่อีกครั้ง</div>`;
  }
}

// ── Profile ───────────────────────────────────────────────────
function viewProfileFull() {
  const loggedIn = !!state.user;
  const name = displayName();
  const email = state.user?.email || "";
  const avatarUrl = state._avatarUrl || null;
  const avatarEl = avatarUrl
    ? `<img src="${esc(avatarUrl)}" alt="avatar" class="w-full h-full object-cover"/>`
    : `<span class="font-display font-bold text-[28px] text-on-primary">${name.charAt(0).toUpperCase()||"?"}</span>`;

  return dashShell(`
    <div class="max-w-md mx-auto">
      <h1 class="font-display font-bold text-[22px] text-on-surface mb-5">โปรไฟล์</h1>

      <!-- Avatar -->
      <div class="flex flex-col items-center mb-6">
        <div class="relative">
          <div class="w-24 h-24 rounded-full bg-primary-container shadow-[0_4px_0_#96a80a] overflow-hidden flex items-center justify-center">
            ${avatarEl}
          </div>
          ${loggedIn ? `<label for="avatar-input" class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-surface-container-high border-2 border-surface-variant flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
            ${sl("camera",{size:14,color:"#9aa090"})}
          </label>
          <input id="avatar-input" type="file" accept="image/*" class="hidden"/>` : ""}
        </div>
        <h2 class="font-display font-bold text-[20px] text-on-surface mt-3">${loggedIn ? esc(name) : "โหมดผู้เยี่ยมชม"}</h2>
        ${loggedIn ? `<p class="text-[13px] text-on-surface-variant">${esc(email)}</p>` : ""}
      </div>

      ${loggedIn ? `
        <!-- Profile form -->
        <div class="space-y-3 mb-6">
          ${profileField("ชื่อเล่น", "profile-name", state.user?.user_metadata?.first_name||"", "text")}
          ${profileField("ระดับชั้น", "profile-grade", "", "text", ["ม.3","ม.4","ม.5","ม.6"])}
          ${profileField("โรงเรียน", "profile-school", state.user?.user_metadata?.school_name||"", "text")}
          ${profileField("GPAX ล่าสุด", "profile-gpax", state.user?.user_metadata?.gpa||"", "number")}
        </div>
        <button id="btn-save-profile" class="tactile-button w-full bg-primary-container text-on-primary font-display font-bold py-3 rounded-xl border-b-4 border-[#96a80a] flex items-center justify-center gap-2 mb-4">
          ${sl("check",{size:16,color:"#16180f"})} บันทึก
        </button>
        <button id="btn-logout" class="w-full py-3 rounded-xl border-2 border-error/40 text-error font-display font-bold flex items-center justify-center gap-2 hover:bg-error/10 transition-colors">
          ${sl("logout",{size:16})} ออกจากระบบ
        </button>
      ` : `
        <button data-nav="auth" class="tactile-button w-full bg-primary-container text-on-primary font-display font-bold py-3 rounded-xl border-b-4 border-[#96a80a] flex items-center justify-center gap-2">
          ${sl("arrow_right",{size:16,color:"#16180f"})} เข้าสู่ระบบ / สมัครสมาชิก
        </button>
      `}
    </div>
  `);
}

function profileField(label, id, value, type, options) {
  if (options) {
    return `<div>
      <label class="ob-label">${label}</label>
      <select id="${id}" class="ob-input">
        <option value="">— เลือก —</option>
        ${options.map(o=>`<option value="${o}" ${o===value?"selected":""}>${o}</option>`).join("")}
      </select>
    </div>`;
  }
  return `<div>
    <label class="ob-label">${label}</label>
    <input id="${id}" type="${type}" value="${esc(value)}" class="ob-input" placeholder="${label}"/>
  </div>`;
}

function wireProfile() {
  // Avatar upload
  const avatarInput = document.getElementById("avatar-input");
  if (avatarInput) avatarInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file || !state.user) return;
    const ext = file.name.split(".").pop();
    const path = `${state.user.id}/avatar.${ext}`;
    try {
      await db.storage.from("avatars").upload(path, file, { upsert: true });
      const { data } = db.storage.from("avatars").getPublicUrl(path);
      state._avatarUrl = data.publicUrl + "?t=" + Date.now();
      toast("อัปเดตรูปโปรไฟล์แล้ว ✓");
      go("profile");
    } catch { toast("อัปโหลดไม่สำเร็จ ลองใหม่"); }
  });

  // Save profile
  const saveBtn = document.getElementById("btn-save-profile");
  if (saveBtn) saveBtn.addEventListener("click", async () => {
    const updates = {
      first_name: document.getElementById("profile-name")?.value.trim() || "",
      education_level: document.getElementById("profile-grade")?.value || "",
      school_name: document.getElementById("profile-school")?.value.trim() || "",
      gpa: parseFloat(document.getElementById("profile-gpax")?.value) || null,
    };
    if (state.user) {
      try {
        await db.from("users_profile").upsert({ id: state.user.id, ...updates });
        await db.auth.updateUser({ data: { first_name: updates.first_name } });
        toast("บันทึกสำเร็จ ✓");
      } catch { toast("บันทึกไม่สำเร็จ ลองใหม่"); }
    }
  });

  const lo = document.getElementById("btn-logout");
  if (lo) lo.addEventListener("click", doLogout);
}

// ── Settings ──────────────────────────────────────────────────
function viewSettings() {
  const theme = localStorage.getItem("nextstep_theme") || "dark";
  const notif = localStorage.getItem("nextstep_notif") !== "false";

  const toggle = (id, on, label, sub) => `
    <div class="db-card p-4 flex items-center justify-between gap-3">
      <div>
        <div class="font-bold text-[14px] text-on-surface">${label}</div>
        ${sub ? `<div class="text-[12px] text-on-surface-variant mt-0.5">${sub}</div>` : ""}
      </div>
      <button id="${id}" role="switch" aria-checked="${on}" class="relative w-12 h-6 rounded-full transition-colors ${on?"bg-primary":"bg-surface-variant"} shrink-0">
        <span class="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-on-primary shadow-sm ${on?"left-6":"left-0.5"}"></span>
      </button>
    </div>`;

  return dashShell(`
    <h1 class="font-display font-bold text-[22px] text-on-surface mb-5">ตั้งค่า</h1>

    <div class="space-y-2 mb-6">
      <h2 class="font-display font-bold text-[13px] text-on-surface-variant px-1 mb-1">ธีม</h2>
      <div class="db-card p-4 flex gap-3">
        ${["dark","light"].map(t=>`
          <button data-theme="${t}" class="flex-1 py-3 rounded-xl border-2 ${theme===t?"border-primary bg-primary/10":"border-surface-variant"} font-display font-bold text-[13px] text-on-surface flex items-center justify-center gap-2 transition-colors">
            ${t==="dark"?"🌙":"☀️"} ${t==="dark"?"โหมดมืด":"โหมดสว่าง"}
          </button>`).join("")}
      </div>
    </div>

    <div class="space-y-2 mb-6">
      <h2 class="font-display font-bold text-[13px] text-on-surface-variant px-1 mb-1">การแจ้งเตือน</h2>
      ${toggle("toggle-notif", notif, "แจ้งเตือนกิจกรรมและสอบ", "รับการแจ้งเตือนก่อนสอบ 7 วัน")}
    </div>

    <div class="space-y-2 mb-6">
      <h2 class="font-display font-bold text-[13px] text-on-surface-variant px-1 mb-1">บัญชี</h2>
      <div class="db-card p-4 flex items-center justify-between">
        <span class="font-bold text-[14px] text-on-surface">เวอร์ชั่น</span>
        <span class="font-mono text-[13px] text-on-surface-variant">1.0.0-beta</span>
      </div>
      <div class="db-card p-4 flex items-center justify-between">
        <span class="font-bold text-[14px] text-on-surface">ข้อมูลและความเป็นส่วนตัว</span>
        ${sl("arrow_right",{size:16,color:"#9aa090"})}
      </div>
    </div>

    ${state.user ? `<button id="btn-logout" class="w-full py-3 rounded-xl border-2 border-error/40 text-error font-display font-bold flex items-center justify-center gap-2 hover:bg-error/10 transition-colors">
      ${sl("logout",{size:16})} ออกจากระบบ
    </button>` : ""}
  `);
}

function wireSettings() {
  document.querySelectorAll("[data-theme]").forEach(b => b.addEventListener("click", () => {
    const t = b.dataset.theme;
    localStorage.setItem("nextstep_theme", t);
    document.documentElement.classList.toggle("light", t === "light");
    go("settings");
    toast(`เปลี่ยนเป็น${t==="dark"?"โหมดมืด":"โหมดสว่าง"}แล้ว`);
  }));

  const notifToggle = document.getElementById("toggle-notif");
  if (notifToggle) notifToggle.addEventListener("click", () => {
    const cur = localStorage.getItem("nextstep_notif") !== "false";
    localStorage.setItem("nextstep_notif", !cur);
    go("settings");
  });

  const lo = document.getElementById("btn-logout");
  if (lo) lo.addEventListener("click", doLogout);
}
