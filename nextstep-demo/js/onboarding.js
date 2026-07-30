// ============================================================
// NEXT_STEP — Login / Onboarding (spec: CLAUDECODE_auth_onboarding.md)
// Login = 1 หน้า (email+pass) → ไปเลย
// Register = 6 ขั้น conversational, 1 คำถามต่อหน้า
// ============================================================

// ---- state ที่ใช้ระหว่าง onboarding (เก็บใน memory ทิ้งก่อน write Supabase ขั้น 6) ----
const OB = {
  step: 1,        // 1-6
  dir: 1,         // 1 = forward, -1 = back (เพื่อ slide direction)
  mode: "full",   // "full" = สมัครอีเมล (step 1-6) | "profile" = Google/ยังไม่ตอบ (step 1-5)
  data: {
    name: "",
    line: "",        // junior | sci_math | arts | vocational | other (ถามก่อน)
    grade: "",       // ม.1–ม.6 / ปวช.–ปวส. / free text (ถามหลัง ขึ้นกับ line)
    major: "",       // เฉพาะสายอาชีพ — สาขา/เอก
    track: "",       // sci_math | arts | vocational (map จาก line เพื่อกรองหลักสูตร)
    school: "",
    gpax: null,      // optional
    interests: [],   // faculty ids (strings)
    email: "",
    password: "",
  },
};

// สายการเรียน (ถามก่อน) — icon จาก icons.js
const OB_LINES = [
  { key: "junior",     label: "มัธยมต้น (สายสามัญ)",   icon: "book" },
  { key: "sci_math",   label: "ม.ปลาย สายวิทย์–คณิต",  icon: "flask" },
  { key: "arts",       label: "ม.ปลาย สายศิลป์",        icon: "palette" },
  { key: "vocational", label: "สายอาชีพ (ปวช./ปวส.)",  icon: "wrench" },
  { key: "other",      label: "อื่นๆ",                  icon: "route" },
];
const OB_VOC_YEARS = ["ปวช.1", "ปวช.2", "ปวช.3", "ปวส.1", "ปวส.2"];

// education_level ที่จะบันทึก (รวมเอกถ้าเป็นสายอาชีพ)
function obEducationLevel() {
  return OB.data.major ? `${OB.data.grade} · ${OB.data.major}`.trim() : OB.data.grade;
}
// จำนวนขั้นตามโหมด: profile ข้าม step 6 (อีเมล/รหัส เพราะมีบัญชีแล้ว)
function obTotal() { return (OB.mode === "profile" || OB.mode === "guest") ? 5 : 6; }

// ---- helpers ----
const obEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function obIcon(name, fill = false) {
  const style = fill ? "font-variation-settings:'FILL' 1;" : "";
  return `<span class="material-symbols-outlined" style="font-size:20px;${style}">${name}</span>`;
}

// ---- progress bar + back btn header ----
function obHeader() {
  const pct = ((OB.step - 1) / obTotal()) * 100;
  const showBack = OB.step > 1;
  return `
    <div class="ob-header flex items-center gap-3 mb-6">
      <button id="ob-back" class="ob-back-btn w-9 h-9 rounded-full flex items-center justify-center border-2 border-surface-variant text-on-surface-variant transition-all hover:border-primary hover:text-primary ${showBack ? "" : "opacity-0 pointer-events-none"}" aria-label="ย้อนกลับ">
        ${obIcon("arrow_back")}
      </button>
      <div class="flex-1 bg-surface-variant rounded-full h-2 overflow-hidden">
        <div class="ob-bar-fill h-full rounded-full bg-primary" style="width:${pct}%;transition:width .4s cubic-bezier(.32,.78,.2,1)"></div>
      </div>
      <span class="ob-count font-mono text-[13px] text-on-surface-variant tabular-nums w-8 text-right">${OB.step}/${obTotal()}</span>
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
      <p class="ob-q">สวัสดี! เราเรียกคุณว่าอะไรดี?</p>
      <input id="ob-name" type="text" maxlength="40" autocomplete="given-name"
        value="${obEsc(OB.data.name)}" placeholder="ชื่อเล่นของคุณ"
        class="ob-input" />
      <button id="ob-next" class="ob-btn-primary mt-4">
        ถัดไป ${obIcon("arrow_forward")}
      </button>
    </div>`;
}

// ขั้น 2 — สายการเรียน (ถามก่อน)
function obStep2() {
  return `
    ${obHeader()}
    <div id="ob-card">
      <p class="ob-q">ตอนนี้ ${obEsc(OB.data.name)} เรียนสายไหน?</p>
      <div class="flex flex-col gap-3 mt-2">
        ${OB_LINES.map((l, i) => `
          <button class="ob-choice text-left flex items-center gap-3 ${OB.data.line === l.key ? "selected" : ""}" data-line="${l.key}" style="animation-delay:${i * 60}ms">
            <span class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">${sl(l.icon, { size: 20, color: "#c2d90f" })}</span>
            <span class="font-display font-bold text-[17px]">${l.label}</span>
          </button>`).join("")}
      </div>
    </div>`;
}

// ขั้น 3 — ระดับชั้น (ขึ้นกับสายที่เลือกในขั้น 2)
function obStep3() {
  const line = OB.data.line;

  // สายอาชีพ → ถามสาขา/เอก + ชั้น ปวช./ปวส.
  if (line === "vocational") {
    return `
      ${obHeader()}
      <div id="ob-card">
        <p class="ob-q">เรียนสายอาชีพ สาขาอะไร?</p>
        <div class="space-y-3 mt-2">
          <div>
            <label class="ob-label">สาขาวิชา / เอก</label>
            <input id="ob-major" type="text" maxlength="60" value="${obEsc(OB.data.major)}"
              placeholder="เช่น ช่างยนต์, การบัญชี, คอมพิวเตอร์ธุรกิจ" class="ob-input" />
          </div>
          <div>
            <label class="ob-label">ระดับชั้น</label>
            <div class="grid grid-cols-3 gap-2">
              ${OB_VOC_YEARS.map((y) => `
                <button type="button" class="ob-choice ${OB.data.grade === y ? "selected" : ""}" data-grade="${y}" style="min-height:48px;font-size:15px">${y}</button>`).join("")}
            </div>
          </div>
        </div>
        <button id="ob-next" class="ob-btn-primary mt-5">ถัดไป ${obIcon("arrow_forward")}</button>
      </div>`;
  }

  // อื่นๆ → ระบุเอง
  if (line === "other") {
    return `
      ${obHeader()}
      <div id="ob-card">
        <p class="ob-q">ตอนนี้เรียน/อยู่ระดับไหน?</p>
        <div class="mt-2">
          <label class="ob-label">ระบุระดับชั้น / สถานะ</label>
          <input id="ob-grade-other" type="text" maxlength="40" value="${obEsc(OB.data.grade)}"
            placeholder="เช่น กศน., เด็กซิ่ว, ป.ตรี ปี 1" class="ob-input" />
        </div>
        <button id="ob-next" class="ob-btn-primary mt-5">ถัดไป ${obIcon("arrow_forward")}</button>
      </div>`;
  }

  // สายสามัญ → ม.ต้น: ม.1-3 · ม.ปลาย (วิทย์-คณิต/ศิลป์): ม.4-6
  const grades = line === "junior" ? ["ม.1", "ม.2", "ม.3"] : ["ม.4", "ม.5", "ม.6"];
  return `
    ${obHeader()}
    <div id="ob-card">
      <p class="ob-q">อยู่ชั้นไหน?</p>
      <div class="grid grid-cols-3 gap-3 mt-2">
        ${grades.map((g, i) => `
          <button class="ob-choice ${OB.data.grade === g ? "selected" : ""}" data-grade="${g}" style="animation-delay:${i * 60}ms">${g}</button>`).join("")}
      </div>
    </div>`;
}

function obStep4() {
  return `
    ${obHeader()}
    <div id="ob-card">
      <p class="ob-q">เล่าให้ฟังอีกนิด</p>
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
          <p class="text-[12px] text-on-surface-variant mt-1">ใช้แค่ประมาณการ ไม่ตัดสินอะไรทั้งนั้น</p>
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
      <button id="ob-next" class="ob-btn-primary mt-5">${(OB.mode === "profile" || OB.mode === "guest") ? `เสร็จสิ้น ${obIcon("check")}` : `ถัดไป ${obIcon("arrow_forward")}`}</button>
    </div>`;
}

function obStep6() {
  return `
    ${obHeader()}
    <div id="ob-card">
      <p class="ob-q">สร้างบัญชีเพื่อบันทึกเส้นทางของ ${obEsc(OB.data.name)} <span class="inline-block align-middle">${sl("lock", { size: 20, color: "#c2d90f" })}</span></p>
      <div class="space-y-3 mt-2">
        <div>
          <label class="ob-label">อีเมล</label>
          <input id="ob-email" type="email" required autocomplete="email"
            value="${obEsc(OB.data.email)}" placeholder="you@email.com"
            class="ob-input" />
        </div>
        <div>
          <label class="ob-label">รหัสผ่าน <span class="text-on-surface-variant font-normal">(อย่างน้อย 8 ตัว)</span></label>
          <div class="relative">
            <input id="ob-pass" type="password" required minlength="8" autocomplete="new-password"
              value="${obEsc(OB.data.password)}" placeholder="••••••••"
              class="ob-input pr-12" />
            <button type="button" id="ob-toggle-pass" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              ${obIcon("visibility")}
            </button>
          </div>
          <div id="ob-pw-strength"></div>
        </div>
        <div>
          <label class="ob-label">ยืนยันรหัสผ่าน</label>
          <input id="ob-pass2" type="password" required minlength="8" autocomplete="new-password"
            placeholder="••••••••" class="ob-input" />
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
      <div class="mb-4 flex justify-center ${reduce ? "" : "mascot-pop"}">${typeof nexMascot === "function" ? nexMascot("mascot w-32 h-32", { pose: "happy" }) : sl("sparkles", { size: 56, color: "#c2d90f" })}</div>
      <h2 class="font-display font-bold text-[26px] text-primary mb-2">ยินดีต้อนรับสู่ NEXTSTEP!</h2>
      <p class="text-on-surface-variant text-[16px]">สวัสดี ${obEsc(name)} พร้อมแล้ว ไปวางแผนกัน</p>
    </div>`;
  setTimeout(async () => {
    if (typeof loadProfile === "function") await loadProfile(); // refresh cache ให้ dashboard/sidebar เห็นข้อมูลจริงทันที
    if (typeof go === "function") go("create-path");
  }, reduce ? 600 : 1600);
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
      if (!v) { obToast("บอกชื่อหน่อยนะ"); return; }
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

  // ขั้น 2 — เลือกสายการเรียน (auto-advance)
  if (OB.step === 2) {
    document.querySelectorAll("[data-line]").forEach((b) => {
      b.addEventListener("click", () => {
        const line = b.dataset.line;
        if (OB.data.line !== line) { OB.data.grade = ""; OB.data.major = ""; } // เปลี่ยนสาย → เคลียร์ชั้น/เอกเดิม
        OB.data.line = line;
        // map เป็น track เพื่อกรองหลักสูตร (ม.ต้น/อื่นๆ = ยังไม่ระบุ)
        OB.data.track = (line === "sci_math" || line === "arts" || line === "vocational") ? line : "";
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        b.classList.add("selected");
        if (!reduce) {
          b.animate([{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }],
            { duration: 300, easing: "ease" }).onfinish = () => { OB.dir = 1; OB.step++; renderOB(); };
        } else { OB.dir = 1; OB.step++; renderOB(); }
      });
    });
  }

  // ขั้น 3 — ระดับชั้น (ขึ้นกับสาย)
  if (OB.step === 3) {
    const line = OB.data.line;

    if (line === "vocational") {
      // เลือกชั้น ปวช./ปวส. (ไม่ auto-advance เพราะต้องกรอกเอกด้วย)
      document.querySelectorAll("[data-grade]").forEach((b) => b.addEventListener("click", () => {
        document.querySelectorAll("[data-grade]").forEach((x) => x.classList.remove("selected"));
        b.classList.add("selected");
        OB.data.grade = b.dataset.grade;
      }));
      document.getElementById("ob-next").addEventListener("click", () => {
        const major = document.getElementById("ob-major").value.trim();
        if (!major) { obToast("ใส่สาขาวิชา/เอก หน่อยนะ"); return; }
        if (!OB.data.grade) { obToast("เลือกระดับชั้น (ปวช./ปวส.) ด้วยนะ"); return; }
        OB.data.major = major;
        OB.dir = 1; OB.step++; renderOB();
      });
    } else if (line === "other") {
      document.getElementById("ob-next").addEventListener("click", () => {
        const g = document.getElementById("ob-grade-other").value.trim();
        if (!g) { obToast("ระบุระดับชั้น/สถานะหน่อยนะ"); return; }
        OB.data.grade = g;
        OB.dir = 1; OB.step++; renderOB();
      });
    } else {
      // สายสามัญ (ม.ต้น/ม.ปลาย) — เลือกชั้นแล้ว auto-advance
      document.querySelectorAll("[data-grade]").forEach((b) => b.addEventListener("click", () => {
        OB.data.grade = b.dataset.grade;
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        b.classList.add("selected");
        if (!reduce) {
          b.animate([{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }],
            { duration: 300, easing: "ease" }).onfinish = () => { OB.dir = 1; OB.step++; renderOB(); };
        } else { OB.dir = 1; OB.step++; renderOB(); }
      }));
    }
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
    // step 5 = ขั้นสุดท้ายของ profile/guest mode → จบเลย · full mode → ไป step 6
    document.getElementById("ob-next").addEventListener("click", () => {
      if (OB.mode === "profile") { finishProfileOnboarding(); }
      else if (OB.mode === "guest") { finishGuestOnboarding(); }
      else { OB.dir = 1; OB.step++; renderOB(); }
    });
  }

  if (OB.step === 6) {
    const togglePass = document.getElementById("ob-toggle-pass");
    if (togglePass) togglePass.addEventListener("click", () => {
      const inp = document.getElementById("ob-pass");
      const show = inp.type === "password";
      inp.type = show ? "text" : "password";
      togglePass.innerHTML = obIcon(show ? "visibility_off" : "visibility");
    });

    // live strength meter (helper จาก app.js)
    if (typeof wireStrength === "function") wireStrength("ob-pass", "ob-pw-strength");

    const submit = document.getElementById("ob-submit");
    submit.addEventListener("click", async () => {
      const email = document.getElementById("ob-email").value.trim();
      const pass = document.getElementById("ob-pass").value;
      const pass2 = document.getElementById("ob-pass2").value;
      if (!email || !email.includes("@")) { obToast("อีเมลนี้ดูไม่ถูกต้องนะ ลองเช็คดูอีกทีมั้ย?"); return; }
      const pwErr = validatePassword(pass, pass2);
      if (pwErr) { obToast(pwErr); return; }
      OB.data.email = email;
      OB.data.password = pass;

      submit.disabled = true;
      submit.innerHTML = `<span class="ob-spinner inline-block"></span> กำลังสร้างบัญชี...`;

      // --- สร้างบัญชีใน Supabase Auth (autoconfirm ON → มี session ทันที) ---
      const { data: authData, error: sErr } = await db.auth.signUp({
        email, password: pass,
        options: { data: { first_name: OB.data.name } },
      });
      if (sErr) {
        submit.disabled = false;
        submit.innerHTML = `${obIcon("rocket_launch")} เริ่มต้นเลย!`;
        obToast(obAuthErr(sErr));
        return;
      }

      const uid = authData?.user?.id;
      // อัปเดต state ของ app
      if (typeof state !== "undefined") { state.user = authData.user; state.guest = false; }

      // --- บันทึกข้อมูล onboarding (trigger สร้าง row ให้แล้ว → update, RLS ผ่านเพราะมี session) ---
      const ok = await saveOnboardingProfile(uid);
      if (!ok) {
        submit.disabled = false;
        submit.innerHTML = `${obIcon("rocket_launch")} เริ่มต้นเลย!`;
        obToast("สร้างบัญชีแล้ว แต่บันทึกข้อมูลไม่สำเร็จ ลองอีกครั้งนะ");
        return;
      }

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
  // ใช้ authErr() จาก app.js เป็นหลัก (ครอบคลุมกว่า) — fallback ถ้ายังไม่โหลด
  if (typeof authErr === "function") return authErr(e);
  const m = (e?.message || "").toLowerCase();
  if (m.includes("already")) return "อีเมลนี้มีบัญชีอยู่แล้วนะ ลองเข้าสู่ระบบดูมั้ย?";
  return "เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะ";
}

// บันทึกข้อมูล onboarding → users_profile (update, trigger สร้าง row แล้ว) + user_preferences
// คืน true ถ้าสำเร็จ. ใช้ทั้ง full mode (หลัง signUp) และ profile mode (Google)
async function saveOnboardingProfile(uid) {
  if (!uid) return false;
  try {
    const { error: e1 } = await db.from("users_profile").update({
      first_name: OB.data.name,
      education_level: obEducationLevel(),
      school_name: OB.data.school,
      gpa: OB.data.gpax,
      onboarded: true,
    }).eq("id", uid);
    if (e1) throw e1;

    // mirror first_name ไป auth metadata ให้ displayName() ใช้ได้ทันที
    try { await db.auth.updateUser({ data: { first_name: OB.data.name } }); } catch {}

    await db.from("user_preferences").upsert({
      user_id: uid,
      interests: OB.data.interests,
    }, { onConflict: "user_id" });
    return true;
  } catch (err) {
    console.warn("saveOnboardingProfile failed:", err?.message);
    return false;
  }
}

// guest mode (ผู้ชม/ยังไม่ล็อกอิน): ไม่มีบัญชี Supabase → เก็บข้อมูลเริ่มต้นใน localStorage
// แล้วเข้าแอปไปดูการทำงานคร่าวๆ ได้เลย (feature ที่ต้องใช้ข้อมูลเพิ่มค่อยถามทีหลัง)
function finishGuestOnboarding() {
  const guestProfile = {
    first_name: OB.data.name,
    education_level: obEducationLevel(),
    school_name: OB.data.school,
    gpa: OB.data.gpax,
    interests: OB.data.interests,
    track: OB.data.track,
    onboarded: true,
    guest: true,
  };
  try { localStorage.setItem("nextstep_guest", JSON.stringify(guestProfile)); } catch {}
  // ตั้ง state ให้ dashboard/profile ดึงข้อมูล guest มาแสดงได้ (ไม่มี state.user)
  if (typeof state !== "undefined") {
    state.guest = true;
    state.profile = guestProfile;           // dashboard/sidebar อ่านจาก state.profile
    state.flow.track = OB.data.track || null;
  }
  obComplete(OB.data.name);
}

// profile mode (Google/ยังไม่ตอบ): user login อยู่แล้ว → บันทึกแล้วจบ
async function finishProfileOnboarding() {
  const btn = document.getElementById("ob-next");
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="ob-spinner inline-block"></span> กำลังบันทึก...`; }
  const uid = state?.user?.id;
  const ok = await saveOnboardingProfile(uid);
  if (!ok) {
    if (btn) { btn.disabled = false; btn.innerHTML = `เสร็จสิ้น ${obIcon("check")}`; }
    obToast("บันทึกไม่สำเร็จ ลองอีกครั้งนะ");
    return;
  }
  obComplete(OB.data.name);
}

// ---- exported entry point ----
// mode: "full" (สมัครอีเมล) | "profile" (Google/ยังไม่ตอบคำถาม)
function startOnboarding(mode = "full") {
  OB.step = 1; OB.dir = 1; OB.mode = mode;
  const prefillName = mode === "profile" && typeof displayName === "function" ? displayName() : "";
  OB.data = { name: prefillName, line: "", grade: "", major: "", track: "", school: "", gpax: null, interests: [], email: "", password: "" };
  renderOB();
}
