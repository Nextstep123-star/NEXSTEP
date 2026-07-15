// ============================================================
// NEXT_STEP — Login / Onboarding (spec: CLAUDECODE_auth_onboarding.md)
// Login = 1 หน้า (email+pass) → ไปเลย
// Register = 6 ขั้น conversational, 1 คำถามต่อหน้า
// ============================================================

// ---- state ที่ใช้ระหว่าง onboarding (เก็บใน memory ทิ้งก่อน write Supabase ขั้น 6) ----
const OB = {
  step: 1,        // 1-6
  dir: 1,         // 1 = forward, -1 = back (เพื่อ slide direction)
  data: {
    name: "",
    grade: "",       // ม.3–ม.6
    track: "",       // sci_math | arts | vocational
    school: "",
    gpax: null,      // optional
    interests: [],   // faculty ids (strings)
    email: "",
    password: "",
  },
};
const OB_TOTAL = 6;

// ---- helpers ----
const obEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function obIcon(name, fill = false) {
  const style = fill ? "font-variation-settings:'FILL' 1;" : "";
  return `<span class="material-symbols-outlined" style="font-size:20px;${style}">${name}</span>`;
}

// ---- progress bar + back btn header ----
function obHeader() {
  const pct = ((OB.step - 1) / OB_TOTAL) * 100;
  const showBack = OB.step > 1;
  return `
    <div class="ob-header flex items-center gap-3 mb-6">
      <button id="ob-back" class="ob-back-btn w-9 h-9 rounded-full flex items-center justify-center border-2 border-surface-variant text-on-surface-variant transition-all hover:border-primary hover:text-primary ${showBack ? "" : "opacity-0 pointer-events-none"}" aria-label="ย้อนกลับ">
        ${obIcon("arrow_back")}
      </button>
      <div class="flex-1 bg-surface-variant rounded-full h-2 overflow-hidden">
        <div class="ob-bar-fill h-full rounded-full bg-primary" style="width:${pct}%;transition:width .4s cubic-bezier(.32,.78,.2,1)"></div>
      </div>
      <span class="ob-count font-mono text-[13px] text-on-surface-variant tabular-nums w-8 text-right">${OB.step}/${OB_TOTAL}</span>
    </div>`;
}

// ---- slide animation wrapper ----
function obAnimate(dir) {
  const card = document.getElementById("ob-card");
  if (!card) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  const from = dir > 0 ? 30 : -30;
  card.animate([
    { opacity: 0, transform: `translateX(${from}px)` },
    { opacity: 1, transform: "translateX(0)" },
  ], { duration: 320, easing: "cubic-bezier(.32,.78,.2,1)", fill: "both" });
}

// ---- step renders ----
function obStep1() {
  return `
    ${obHeader()}
    <div id="ob-card">
      <p class="ob-q">สวัสดี! เราเรียกคุณว่าอะไรดี? 👋</p>
      <input id="ob-name" type="text" maxlength="40" autocomplete="given-name"
        value="${obEsc(OB.data.name)}" placeholder="ชื่อเล่นของคุณ"
        class="ob-input" />
      <button id="ob-next" class="ob-btn-primary mt-4">
        ถัดไป ${obIcon("arrow_forward")}
      </button>
    </div>`;
}

function obStep2() {
  const grades = ["ม.3", "ม.4", "ม.5", "ม.6"];
  return `
    ${obHeader()}
    <div id="ob-card">
      <p class="ob-q">ตอนนี้ ${obEsc(OB.data.name)} อยู่ชั้นไหน?</p>
      <div class="grid grid-cols-2 gap-3 mt-2">
        ${grades.map((g, i) => `
          <button class="ob-choice ${OB.data.grade === g ? "selected" : ""}" data-grade="${g}" style="animation-delay:${i * 60}ms">
            ${g}
          </button>`).join("")}
      </div>
    </div>`;
}

function obStep3() {
  const tracks = [
    { key: "sci_math", label: "วิทย์–คณิต", emoji: "🔬" },
    { key: "arts",     label: "ศิลป์",       emoji: "🎨" },
    { key: "vocational", label: "อาชีวะ",   emoji: "🛠️" },
  ];
  return `
    ${obHeader()}
    <div id="ob-card">
      <p class="ob-q">เรียนสายอะไร?</p>
      <div class="flex flex-col gap-3 mt-2">
        ${tracks.map((t, i) => `
          <button class="ob-choice text-left flex items-center gap-3 ${OB.data.track === t.key ? "selected" : ""}" data-track="${t.key}" style="animation-delay:${i * 60}ms">
            <span class="text-2xl">${t.emoji}</span>
            <span class="font-display font-bold text-[17px]">${t.label}</span>
          </button>`).join("")}
      </div>
    </div>`;
}

function obStep4() {
  return `
    ${obHeader()}
    <div id="ob-card">
      <p class="ob-q">เล่าให้ฟังอีกนิด 📖</p>
      <div class="space-y-3 mt-2">
        <div>
          <label class="ob-label">โรงเรียน</label>
          <input id="ob-school" type="text" maxlength="80" autocomplete="organization"
            value="${obEsc(OB.data.school)}" placeholder="ชื่อโรงเรียนของคุณ"
            class="ob-input" />
        </div>
        <div>
          <label class="ob-label">เกรดเฉลี่ยล่าสุด (GPAX) <span class="text-on-surface-variant font-normal">— ไม่ต้องก็ได้</span></label>
          <input id="ob-gpax" type="number" min="1" max="4" step="0.01"
            value="${OB.data.gpax !== null ? OB.data.gpax : ""}" placeholder="เช่น 3.50"
            class="ob-input font-mono" />
          <p class="text-[12px] text-on-surface-variant mt-1">ใช้แค่ประมาณการ ไม่ตัดสินอะไรทั้งนั้น ✌️</p>
        </div>
      </div>
      <button id="ob-next" class="ob-btn-primary mt-5">ถัดไป ${obIcon("arrow_forward")}</button>
    </div>`;
}

async function obStep5() {
  // load faculties from Supabase (already cached or fresh)
  let faculties = OB._faculties;
  if (!faculties) {
    try {
      const { data } = await db.from("faculties").select("id,name_th").order("id");
      faculties = data || [];
      OB._faculties = faculties;
    } catch { faculties = []; }
  }
  const chips = faculties.map((f, i) => {
    const sel = OB.data.interests.includes(String(f.id));
    return `<button class="ob-chip ${sel ? "selected" : ""}" data-fac="${f.id}" style="animation-delay:${i * 40}ms">${obEsc(f.name_th)}</button>`;
  }).join("");
  return `
    ${obHeader()}
    <div id="ob-card">
      <p class="ob-q">อยากเข้าคณะอะไร? <span class="text-on-surface-variant text-[15px] font-normal">(เลือกได้หลายอัน)</span></p>
      <div class="flex flex-wrap gap-2 mt-3">${chips}</div>
      <button id="ob-next" class="ob-btn-primary mt-5">ถัดไป ${obIcon("arrow_forward")}</button>
    </div>`;
}

function obStep6() {
  return `
    ${obHeader()}
    <div id="ob-card">
      <p class="ob-q">สร้างบัญชีเพื่อบันทึกเส้นทางของ ${obEsc(OB.data.name)} 🔐</p>
      <div class="space-y-3 mt-2">
        <div>
          <label class="ob-label">อีเมล</label>
          <input id="ob-email" type="email" required autocomplete="email"
            value="${obEsc(OB.data.email)}" placeholder="you@email.com"
            class="ob-input" />
        </div>
        <div>
          <label class="ob-label">รหัสผ่าน <span class="text-on-surface-variant font-normal">(อย่างน้อย 6 ตัว)</span></label>
          <div class="relative">
            <input id="ob-pass" type="password" required minlength="6" autocomplete="new-password"
              value="${obEsc(OB.data.password)}" placeholder="••••••"
              class="ob-input pr-12" />
            <button type="button" id="ob-toggle-pass" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              ${obIcon("visibility")}
            </button>
          </div>
        </div>
      </div>
      <button id="ob-submit" class="ob-btn-primary mt-5">
        ${obIcon("rocket_launch")} เริ่มต้นเลย!
      </button>
    </div>`;
}

// ---- complete animation (step 6 success) ----
function obComplete(name) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const appEl = document.getElementById("app");
  if (!appEl) return;
  appEl.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center text-center px-6 dotted-grid">
      <div class="ob-confetti text-6xl mb-4 ${reduce ? "" : "animate-bounce"}">🎉</div>
      <h2 class="font-display font-bold text-[26px] text-primary mb-2">ยินดีต้อนรับสู่ NEXTSTEP!</h2>
      <p class="text-on-surface-variant text-[16px]">สวัสดี ${obEsc(name)} พร้อมแล้ว ไปวางแผนกัน 🚀</p>
    </div>`;
  setTimeout(() => { if (typeof go === "function") go("create-path"); }, reduce ? 600 : 1600);
}

// ---- render into #app ----
async function renderOB() {
  const appEl = document.getElementById("app");
  if (!appEl) return;

  let inner = "";
  if (OB.step === 1) inner = obStep1();
  else if (OB.step === 2) inner = obStep2();
  else if (OB.step === 3) inner = obStep3();
  else if (OB.step === 4) inner = obStep4();
  else if (OB.step === 5) inner = await obStep5();
  else if (OB.step === 6) inner = obStep6();

  appEl.innerHTML = `
    <div class="dotted-grid min-h-screen flex items-center justify-center py-8">
      <div class="w-full max-w-sm mx-auto px-5">
        ${inner}
      </div>
    </div>`;

  obAnimate(OB.dir);
  wireOB();
}

// ---- wire events per step ----
function wireOB() {
  // back button (all steps)
  const backBtn = document.getElementById("ob-back");
  if (backBtn) backBtn.addEventListener("click", () => { OB.dir = -1; OB.step--; renderOB(); });

  if (OB.step === 1) {
    const nameInput = document.getElementById("ob-name");
    const next = () => {
      const v = nameInput.value.trim();
      if (!v) { obToast("บอกชื่อหน่อยนะ 😊"); return; }
      OB.data.name = v;
      // animate name reveal before moving
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce && nameInput) {
        nameInput.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(-8px)" }],
          { duration: 200, fill: "both" }).onfinish = () => { OB.dir = 1; OB.step++; renderOB(); };
      } else { OB.dir = 1; OB.step++; renderOB(); }
    };
    document.getElementById("ob-next").addEventListener("click", next);
    nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") next(); });
    nameInput.focus();
  }

  if (OB.step === 2) {
    document.querySelectorAll("[data-grade]").forEach((b, _i) => {
      b.addEventListener("click", () => {
        OB.data.grade = b.dataset.grade;
        // pulse then auto-next
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        b.classList.add("selected");
        if (!reduce) {
          b.animate([{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }],
            { duration: 300, easing: "ease" }).onfinish = () => { OB.dir = 1; OB.step++; renderOB(); };
        } else { OB.dir = 1; OB.step++; renderOB(); }
      });
    });
  }

  if (OB.step === 3) {
    document.querySelectorAll("[data-track]").forEach((b) => {
      b.addEventListener("click", () => {
        OB.data.track = b.dataset.track;
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        b.classList.add("selected");
        if (!reduce) {
          b.animate([{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }],
            { duration: 300, easing: "ease" }).onfinish = () => { OB.dir = 1; OB.step++; renderOB(); };
        } else { OB.dir = 1; OB.step++; renderOB(); }
      });
    });
  }

  if (OB.step === 4) {
    const next = () => {
      const school = document.getElementById("ob-school").value.trim();
      if (!school) { obToast("บอกชื่อโรงเรียนหน่อยนะ"); return; }
      const gpaxRaw = document.getElementById("ob-gpax").value.trim();
      if (gpaxRaw !== "") {
        const g = parseFloat(gpaxRaw);
        if (isNaN(g) || g < 1 || g > 4) { obToast("GPAX ต้องอยู่ระหว่าง 1.00–4.00"); return; }
        OB.data.gpax = g;
      } else { OB.data.gpax = null; }
      OB.data.school = school;
      OB.dir = 1; OB.step++; renderOB();
    };
    document.getElementById("ob-next").addEventListener("click", next);
  }

  if (OB.step === 5) {
    document.querySelectorAll("[data-fac]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const id = chip.dataset.fac;
        const idx = OB.data.interests.indexOf(id);
        if (idx === -1) {
          OB.data.interests.push(id);
          chip.classList.add("selected");
          chip.animate([{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }],
            { duration: 220, easing: "ease" });
        } else {
          OB.data.interests.splice(idx, 1);
          chip.classList.remove("selected");
        }
      });
    });
    document.getElementById("ob-next").addEventListener("click", () => { OB.dir = 1; OB.step++; renderOB(); });
  }

  if (OB.step === 6) {
    const togglePass = document.getElementById("ob-toggle-pass");
    if (togglePass) togglePass.addEventListener("click", () => {
      const inp = document.getElementById("ob-pass");
      const show = inp.type === "password";
      inp.type = show ? "text" : "password";
      togglePass.innerHTML = obIcon(show ? "visibility_off" : "visibility");
    });

    const submit = document.getElementById("ob-submit");
    submit.addEventListener("click", async () => {
      const email = document.getElementById("ob-email").value.trim();
      const pass = document.getElementById("ob-pass").value;
      if (!email || !email.includes("@")) { obToast("อีเมลนี้ดูไม่ถูกต้องนะ ลองเช็คดูอีกทีมั้ย?"); return; }
      if (pass.length < 6) { obToast("รหัสผ่านต้องมีอย่างน้อย 6 ตัวนะ"); return; }
      OB.data.email = email;
      OB.data.password = pass;

      submit.disabled = true;
      submit.innerHTML = `<span class="ob-spinner inline-block"></span> กำลังสร้างบัญชี...`;

      // --- สร้างบัญชีใน Supabase Auth ---
      const { data: authData, error: authErr } = await db.auth.signUp({
        email, password: pass,
        options: { data: { first_name: OB.data.name } },
      });
      if (authErr) {
        submit.disabled = false;
        submit.innerHTML = `${obIcon("rocket_launch")} เริ่มต้นเลย!`;
        obToast(obAuthErr(authErr));
        return;
      }

      // --- บันทึกข้อมูลลง Supabase (ครั้งเดียวตอน step 6) ---
      const uid = authData?.user?.id;
      if (uid) {
        try {
          await db.from("users_profile").upsert({
            id: uid,
            first_name: OB.data.name,
            education_level: OB.data.grade,
            school_name: OB.data.school,
            gpa: OB.data.gpax,
          });
          if (OB.data.interests.length > 0) {
            await db.from("user_preferences").upsert({
              user_id: uid,
              interests: OB.data.interests,
            });
          }
        } catch { /* RLS may block pre-Phase0; best-effort */ }

        // อัปเดต state ของ app
        if (typeof state !== "undefined") { state.user = authData.user; state.guest = false; }
      }

      // --- animation จบ ---
      obComplete(OB.data.name);
    });
  }
}

function obToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg; t.classList.add("show");
  clearTimeout(window._obToastTimer);
  window._obToastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

function obAuthErr(e) {
  const m = (e?.message || "").toLowerCase();
  if (m.includes("already")) return "อีเมลนี้มีบัญชีอยู่แล้วนะ ลองเข้าสู่ระบบดูมั้ย?";
  if (m.includes("password")) return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวนะ";
  if (m.includes("email")) return "อีเมลนี้ดูไม่ถูกต้อง ลองเช็คดูอีกทีมั้ย?";
  return "เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะ";
}

// ---- exported entry point ----
function startOnboarding() {
  OB.step = 1; OB.dir = 1;
  OB.data = { name: "", grade: "", track: "", school: "", gpax: null, interests: [], email: "", password: "" };
  renderOB();
}
