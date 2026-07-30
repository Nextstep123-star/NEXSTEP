// ============================================================
// NEXT_STEP — TCAS70 (ปีการศึกษา 2570) reference dataset
// อ้างอิงหลัก: ที่ประชุมอธิการบดีแห่งประเทศไทย (ทปอ.) + myTCAS (mytcas.com)
//
// ⚠️ หมายเหตุความถูกต้อง:
//  - "ตารางสอบ/รอบ" = กำหนดการทางการ TCAS70 (ประกาศแล้ว)
//  - "เกณฑ์น้ำหนักวิชา (weights)" = โครงสร้างตัวแทนของแต่ละคณะ (แต่ละที่ต่างกัน
//    ตรวจสอบจริงที่ mytcas.com)
//  - "refScore (คะแนนอ้างอิงที่รับเข้า)" = ค่าประมาณจากสถิติปีก่อน (68/69)
//    ใช้ประเมินโอกาสคร่าวๆ เท่านั้น ไม่ใช่ตัวเลขทางการของปี 2570
//    เพราะการสอบ/รับเข้าปี 2570 ยังไม่เกิดขึ้น
// ============================================================

const TCAS70 = {
  year: 2570,
  label: "TCAS70",
  source: "ทปอ. / myTCAS (mytcas.com)",
  estimateNote: "คะแนนอ้างอิงเป็นค่าประมาณจากสถิติปีก่อน (ไม่ใช่ตัวเลขทางการปี 2570)",

  // ── กำหนดการกลาง TCAS70 (ทางการ) — ใช้เติมปฏิทิน/ข่าวเมื่อ DB ยังไม่อัปเดต ──
  // event_date เป็น ค.ศ. (2569 BE = 2026, 2570 BE = 2027) ให้ตรงกับคอลัมน์ events
  schedule: [
    { title: "เปิดระบบ myTCAS — ลงทะเบียน Dek70", event_date: "2026-07-15", type: "ลงทะเบียน", color: "tertiary" },
    { title: "รอบ 1 Portfolio — เปิดรับสมัคร", event_date: "2026-10-01", type: "รับสมัคร", color: "primary" },
    { title: "รอบ 1 Portfolio — ประกาศผล", event_date: "2027-01-20", type: "ประกาศผล", color: "primary" },
    { title: "สอบ TGAT / TPAT2-5", event_date: "2027-01-30", type: "สอบกลาง", color: "error" },
    { title: "สอบ TPAT1 วิชาเฉพาะ กสพท.", event_date: "2027-02-13", type: "สอบกลาง", color: "error" },
    { title: "สอบ A-Level", event_date: "2027-03-13", type: "สอบกลาง", color: "error" },
    { title: "รอบ 2 โควตา — ช่วงรับสมัคร", event_date: "2027-02-15", type: "รับสมัคร", color: "secondary" },
    { title: "รอบ 3 Admission — รับสมัคร", event_date: "2027-04-06", type: "รับสมัคร", color: "tertiary" },
    { title: "รอบ 3 Admission — ประกาศผลครั้งที่ 1", event_date: "2027-05-02", type: "ประกาศผล", color: "tertiary" },
    { title: "รอบ 4 Direct Admission", event_date: "2027-05-20", type: "รับสมัคร", color: "primary" },
  ],

  // ── ข่าว/ประกาศ TCAS70 (fallback เมื่อ DB news ยังไม่อัปเดต) ──
  news: [
    { title: "ทปอ. เปิดระบบ myTCAS ปีการศึกษา 2570 — ลงทะเบียน Dek70 เริ่ม 15 ก.ค. 2569", category: "ระดับชาติ", published_at: "2026-07-15", body: "ระบบ TCAS70 เปิดให้ผู้สมัครลงทะเบียนยืนยันตัวตนผ่าน student.mytcas.com ก่อนเข้าสู่การคัดเลือกทั้ง 4 รอบ" },
    { title: "สรุปกำหนดการสอบกลาง TCAS70: TGAT/TPAT 30 ม.ค. – 1 ก.พ. 70, A-Level 13-15 มี.ค. 70", category: "ข้อสอบ", published_at: "2026-07-10", body: "TGAT และ TPAT2-5 สอบ 30 ม.ค.–1 ก.พ. 2570, TPAT1 (กสพท) 13 ก.พ. 2570 และ A-Level 13-15 มี.ค. 2570" },
    { title: "TCAS70 คงรูปแบบ 4 รอบ: Portfolio · โควตา · Admission · Direct Admission", category: "ระดับชาติ", published_at: "2026-07-04", body: "โครงสร้างการรับสมัครยังเป็น 4 รอบเช่นเดิม โดยรอบ 3 Admission ใช้คะแนนกลาง TGAT/TPAT และ A-Level" },
    { title: "กสพท ประกาศใช้ TPAT1 + 7 วิชา A-Level สำหรับสายแพทย์ TCAS70", category: "แนะแนว", published_at: "2026-07-02", body: "กลุ่มสถาบันแพทยศาสตร์ฯ (กสพท) ใช้วิชาเฉพาะ TPAT1 ร่วมกับ A-Level 7 วิชา คิดสัดส่วน 30:70 เช่นเดิม" },
  ],

  // ── 4 รอบ TCAS70 ──
  rounds: [
    { n: 1, name: "Portfolio", desc: "แฟ้มสะสมผลงาน — ไม่ใช้คะแนนสอบกลาง เน้นผลงาน/ความสามารถพิเศษ" },
    { n: 2, name: "โควตา", desc: "โควตาพื้นที่/โครงการ — บางที่ใช้คะแนนกลาง บางที่สอบเอง" },
    { n: 3, name: "Admission", desc: "ใช้คะแนนกลาง TGAT/TPAT + A-Level ตามสัดส่วนของแต่ละคณะ" },
    { n: 4, name: "Direct Admission", desc: "รับตรงอิสระ — มหาวิทยาลัยรับเอง (ถ้ายังมีที่นั่งเหลือ)" },
  ],

  // ── รายวิชาที่ใช้ในเครื่องคำนวณ (subject keys) ──
  subjects: {
    gpax:     { label: "GPAX (เกรดเฉลี่ยสะสม)", max: 4,   step: 0.01, scale4: true, group: "พื้นฐาน", ph: "เช่น 3.50" },
    tgat:     { label: "TGAT ความถนัดทั่วไป",   max: 100, step: 1, group: "สอบกลาง", ph: "0–100" },
    tpat1:    { label: "TPAT1 วิชาเฉพาะ กสพท.", max: 100, step: 1, group: "สอบกลาง", ph: "0–100" },
    tpat2:    { label: "TPAT2 ศิลปกรรมศาสตร์",  max: 100, step: 1, group: "สอบกลาง", ph: "0–100" },
    tpat3:    { label: "TPAT3 วิทย์ เทคโนโลยี วิศวกรรม", max: 100, step: 1, group: "สอบกลาง", ph: "0–100" },
    tpat4:    { label: "TPAT4 สถาปัตยกรรม",     max: 100, step: 1, group: "สอบกลาง", ph: "0–100" },
    tpat5:    { label: "TPAT5 ครุศาสตร์",       max: 100, step: 1, group: "สอบกลาง", ph: "0–100" },
    alv_math1:{ label: "A-Level คณิต 1",        max: 100, step: 1, group: "A-Level", ph: "0–100" },
    alv_math2:{ label: "A-Level คณิต 2",        max: 100, step: 1, group: "A-Level", ph: "0–100" },
    alv_phy:  { label: "A-Level ฟิสิกส์",       max: 100, step: 1, group: "A-Level", ph: "0–100" },
    alv_chem: { label: "A-Level เคมี",          max: 100, step: 1, group: "A-Level", ph: "0–100" },
    alv_bio:  { label: "A-Level ชีววิทยา",      max: 100, step: 1, group: "A-Level", ph: "0–100" },
    alv_thai: { label: "A-Level ภาษาไทย",       max: 100, step: 1, group: "A-Level", ph: "0–100" },
    alv_soc:  { label: "A-Level สังคมศึกษา",    max: 100, step: 1, group: "A-Level", ph: "0–100" },
    alv_eng:  { label: "A-Level ภาษาอังกฤษ",    max: 100, step: 1, group: "A-Level", ph: "0–100" },
  },

  // ── คณะยอดนิยม ~18 คณะ (round = รอบที่เกณฑ์นี้อ้างอิง, ref = คะแนนอ้างอิง %) ──
  // weights รวม ~100 · ref = ค่าประมาณจากสถิติปีก่อน (label ประมาณการ)
  faculties: [
    { key: "med",     label: "แพทยศาสตร์ (กสพท)",        icon: "health", round: "รอบ 3 (กสพท)", minGpax: 3.00, ref: 68,
      weights: { tpat1: 30, alv_math1: 14, alv_phy: 14, alv_chem: 14, alv_bio: 14, alv_thai: 5, alv_soc: 5, alv_eng: 4 } },
    { key: "dent",    label: "ทันตแพทยศาสตร์ (กสพท)",    icon: "health", round: "รอบ 3 (กสพท)", minGpax: 3.00, ref: 63,
      weights: { tpat1: 30, alv_math1: 14, alv_phy: 14, alv_chem: 16, alv_bio: 14, alv_thai: 4, alv_soc: 4, alv_eng: 4 } },
    { key: "pharm",   label: "เภสัชศาสตร์",              icon: "flask",  round: "รอบ 3 Admission", minGpax: 2.75, ref: 60,
      weights: { tgat: 20, alv_math1: 15, alv_chem: 25, alv_bio: 20, alv_phy: 10, alv_eng: 10 } },
    { key: "nurse",   label: "พยาบาลศาสตร์",             icon: "health", round: "รอบ 3 Admission", minGpax: 2.75, ref: 52,
      weights: { tgat: 30, alv_bio: 25, alv_chem: 20, alv_eng: 15, alv_math1: 10 } },
    { key: "vet",     label: "สัตวแพทยศาสตร์",           icon: "health", round: "รอบ 3 Admission", minGpax: 2.75, ref: 58,
      weights: { tgat: 20, alv_bio: 25, alv_chem: 20, alv_phy: 15, alv_math1: 20 } },
    { key: "eng",     label: "วิศวกรรมศาสตร์",           icon: "wrench", round: "รอบ 3 Admission", minGpax: 2.50, ref: 55,
      weights: { tgat: 20, tpat3: 30, alv_math1: 25, alv_phy: 15, alv_chem: 10 } },
    { key: "compsci", label: "วิทยาการคอมพิวเตอร์ / IT", icon: "code",   round: "รอบ 3 Admission", minGpax: 2.50, ref: 52,
      weights: { tgat: 40, tpat3: 20, alv_math1: 30, alv_eng: 10 } },
    { key: "sci",     label: "วิทยาศาสตร์",              icon: "flask",  round: "รอบ 3 Admission", minGpax: 2.50, ref: 45,
      weights: { tgat: 20, alv_math1: 25, alv_phy: 15, alv_chem: 20, alv_bio: 20 } },
    { key: "arch",    label: "สถาปัตยกรรมศาสตร์",        icon: "target", round: "รอบ 3 Admission", minGpax: 2.50, ref: 50,
      weights: { tgat: 20, tpat4: 40, alv_math1: 20, alv_phy: 20 } },
    { key: "account", label: "บัญชี / บริหารธุรกิจ",     icon: "chart",  round: "รอบ 3 Admission", minGpax: 2.50, ref: 55,
      weights: { tgat: 50, alv_math2: 25, alv_eng: 25 } },
    { key: "econ",    label: "เศรษฐศาสตร์",              icon: "chart",  round: "รอบ 3 Admission", minGpax: 2.50, ref: 50,
      weights: { tgat: 40, alv_math1: 30, alv_eng: 30 } },
    { key: "law",     label: "นิติศาสตร์",               icon: "scale",  round: "รอบ 3 Admission", minGpax: 2.50, ref: 50,
      weights: { tgat: 50, alv_soc: 30, alv_thai: 10, alv_eng: 10 } },
    { key: "polsci",  label: "รัฐศาสตร์",                icon: "scale",  round: "รอบ 3 Admission", minGpax: 2.50, ref: 48,
      weights: { tgat: 50, alv_soc: 30, alv_eng: 20 } },
    { key: "arts",    label: "อักษรศาสตร์ / มนุษยศาสตร์", icon: "book",   round: "รอบ 3 Admission", minGpax: 2.50, ref: 50,
      weights: { tgat: 40, alv_thai: 25, alv_soc: 15, alv_eng: 20 } },
    { key: "comm",    label: "นิเทศศาสตร์ / วารสารฯ",    icon: "news",   round: "รอบ 3 Admission", minGpax: 2.50, ref: 50,
      weights: { tgat: 50, alv_thai: 20, alv_soc: 15, alv_eng: 15 } },
    { key: "edu",     label: "ครุศาสตร์ / ศึกษาศาสตร์",  icon: "graduation", round: "รอบ 3 Admission", minGpax: 2.50, ref: 48,
      weights: { tgat: 30, tpat5: 30, alv_thai: 15, alv_soc: 10, alv_eng: 15 } },
    { key: "psych",   label: "จิตวิทยา",                 icon: "person", round: "รอบ 3 Admission", minGpax: 2.50, ref: 50,
      weights: { tgat: 40, alv_bio: 15, alv_soc: 20, alv_eng: 25 } },
    { key: "fineart", label: "ศิลปกรรมศาสตร์",           icon: "palette", round: "รอบ 3 Admission", minGpax: 2.00, ref: 45,
      weights: { tgat: 20, tpat2: 50, alv_thai: 15, alv_eng: 15 } },
  ],
};

// subject keys ที่คณะนี้ใช้ (เรียงตามน้ำหนักมาก→น้อย) + gpax นำหน้าเสมอ
function tcasFacultySubjects(fac) {
  const keys = Object.entries(fac.weights).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  return ["gpax", ...keys];
}

// คำนวณโอกาส: scores = { subjectKey: number } (gpax 0-4, ที่เหลือ 0-100)
// คืน { chance%, composite, ref, gap, rows[], missing[], gpaxWarn, label }
function tcasComputeChance(fac, scores) {
  let composite = 0;
  const rows = [];
  const missing = [];
  for (const [subj, w] of Object.entries(fac.weights)) {
    const raw = scores[subj];
    const has = raw !== undefined && raw !== null && raw !== "" && !isNaN(Number(raw));
    const meta = TCAS70.subjects[subj] || { max: 100 };
    let pct = has ? Number(raw) : 0;
    if (meta.scale4) pct = (pct / 4) * 100;      // gpax 0-4 → %
    pct = Math.max(0, Math.min(100, pct));
    if (!has) missing.push(subj);
    composite += pct * (w / 100);
    rows.push({ subj, w, pct: Math.round(pct * 10) / 10, has });
  }
  composite = Math.round(composite * 10) / 10;

  const gap = Math.round((composite - fac.ref) * 10) / 10;
  // logistic: composite = ref → 50% · ชันปานกลาง (k=8)
  let chance = 1 / (1 + Math.exp(-gap / 8));
  chance = Math.max(0.02, Math.min(0.98, chance));

  // ประตู GPAX ขั้นต่ำ
  let gpaxWarn = null;
  const gpaxVal = Number(scores.gpax);
  if (fac.minGpax && scores.gpax !== undefined && scores.gpax !== "" && !isNaN(gpaxVal) && gpaxVal < fac.minGpax) {
    gpaxWarn = `GPAX ต่ำกว่าเกณฑ์ขั้นต่ำของคณะ (${fac.minGpax.toFixed(2)})`;
    chance = Math.min(chance, 0.15);
  }

  const pct = Math.round(chance * 100);
  const label = pct >= 70 ? { t: "โอกาสสูง", c: "#22c55e" }
    : pct >= 45 ? { t: "โอกาสปานกลาง", c: "#eab308" }
    : pct >= 25 ? { t: "โอกาสค่อนข้างน้อย", c: "#f59e0b" }
    : { t: "โอกาสน้อย — ต้องพัฒนาอีก", c: "#ef4444" };

  return { chance: pct, composite, ref: fac.ref, gap, rows, missing, gpaxWarn, label };
}
