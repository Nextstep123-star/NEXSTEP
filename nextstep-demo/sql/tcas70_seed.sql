-- ============================================================
-- NEXT_STEP — TCAS70 (ปีการศึกษา 2570) seed
-- อ้างอิง: ทปอ. / myTCAS (mytcas.com)
--
-- วิธีใช้:
--   1) เปิด Supabase Dashboard → โปรเจกต์ cbsteufryuiwcqbgcfle → SQL Editor
--   2) วางไฟล์นี้ทั้งหมด → Run
--   3) รีเฟรชแอป → ปฏิทิน/ข่าว/ในแอปจะเป็นข้อมูล TCAS70
--
-- ⚠️ ปลอดภัย: สคริปต์นี้ลบเฉพาะ events/news ที่ seed ด้วย tag 'tcas70' เท่านั้น
--    (ผ่านคอลัมน์ id ที่ขึ้นต้น 't70') แล้วเพิ่มใหม่ — idempotent รันซ้ำได้
--
-- 📝 หมายเหตุ: ตรวจชื่อคอลัมน์ตารางจริงของคุณก่อน ถ้าคอลัมน์ต่างจากนี้ให้ปรับ
--    events: (id, title, event_date, type, color, description)
--    news:   (id, title, body, category, published_at, is_published)
-- ============================================================

-- ---------- EVENTS: กำหนดการกลาง TCAS70 (ทางการ) ----------
delete from public.events where id like 't70\_%';

insert into public.events (id, title, event_date, type, color, description) values
  ('t70_reg',    'เปิดระบบ myTCAS — ลงทะเบียน Dek70',        '2026-07-15', 'ลงทะเบียน', 'tertiary',  'ยืนยันตัวตนผ่าน student.mytcas.com ก่อนเข้าสู่การคัดเลือก'),
  ('t70_r1open', 'รอบ 1 Portfolio — เปิดรับสมัคร',            '2026-10-01', 'รับสมัคร',  'primary',   'ยื่นแฟ้มสะสมผลงาน ไม่ใช้คะแนนสอบกลาง'),
  ('t70_r1res',  'รอบ 1 Portfolio — ประกาศผล',                '2027-01-20', 'ประกาศผล',  'primary',   'ประกาศผลผู้ผ่านการคัดเลือกรอบ 1'),
  ('t70_tgat',   'สอบ TGAT / TPAT2-5',                        '2027-01-30', 'สอบกลาง',   'error',     'TGAT ความถนัดทั่วไป และ TPAT2-5 (30 ม.ค.–1 ก.พ. 70)'),
  ('t70_tpat1',  'สอบ TPAT1 วิชาเฉพาะ กสพท.',                 '2027-02-13', 'สอบกลาง',   'error',     'วิชาเฉพาะสำหรับกลุ่มแพทย์ (กสพท)'),
  ('t70_alevel', 'สอบ A-Level',                               '2027-03-13', 'สอบกลาง',   'error',     'A-Level 13-15 มี.ค. 70'),
  ('t70_r2',     'รอบ 2 โควตา — ช่วงรับสมัคร',                '2027-02-15', 'รับสมัคร',  'secondary', 'โควตาพื้นที่/โครงการ'),
  ('t70_r3open', 'รอบ 3 Admission — รับสมัคร',                '2027-04-06', 'รับสมัคร',  'tertiary',  'ใช้คะแนนกลาง TGAT/TPAT + A-Level'),
  ('t70_r3res',  'รอบ 3 Admission — ประกาศผลครั้งที่ 1',      '2027-05-02', 'ประกาศผล',  'tertiary',  'ประกาศผลรอบ 3 ครั้งที่ 1'),
  ('t70_r4',     'รอบ 4 Direct Admission',                    '2027-05-20', 'รับสมัคร',  'primary',   'รับตรงอิสระ (ถ้ายังมีที่นั่งเหลือ)');

-- ---------- NEWS: ข่าว/ประกาศ TCAS70 ----------
delete from public.news where id like 't70n\_%';

insert into public.news (id, title, body, category, published_at, is_published) values
  ('t70n_1', 'ทปอ. เปิดระบบ myTCAS ปีการศึกษา 2570 — ลงทะเบียน Dek70 เริ่ม 15 ก.ค. 69',
             'ระบบ TCAS70 เปิดให้ผู้สมัครลงทะเบียนยืนยันตัวตนผ่าน student.mytcas.com ก่อนเข้าสู่การคัดเลือกทั้ง 4 รอบ',
             'ระดับชาติ', '2026-07-15', true),
  ('t70n_2', 'สรุปกำหนดการสอบกลาง TCAS70: TGAT/TPAT 30 ม.ค.–1 ก.พ. 70, A-Level 13-15 มี.ค. 70',
             'TGAT และ TPAT2-5 สอบ 30 ม.ค.–1 ก.พ. 2570, TPAT1 (กสพท) 13 ก.พ. 2570 และ A-Level 13-15 มี.ค. 2570',
             'ข้อสอบ', '2026-07-10', true),
  ('t70n_3', 'TCAS70 คงรูปแบบ 4 รอบ: Portfolio · โควตา · Admission · Direct Admission',
             'โครงสร้างการรับสมัครยังเป็น 4 รอบเช่นเดิม โดยรอบ 3 Admission ใช้คะแนนกลาง TGAT/TPAT และ A-Level',
             'ระดับชาติ', '2026-07-04', true),
  ('t70n_4', 'กสพท ประกาศใช้ TPAT1 + 7 วิชา A-Level สำหรับสายแพทย์ TCAS70',
             'กลุ่มสถาบันแพทยศาสตร์ฯ (กสพท) ใช้วิชาเฉพาะ TPAT1 ร่วมกับ A-Level 7 วิชา คิดสัดส่วน 30:70 เช่นเดิม',
             'แนะแนว', '2026-07-02', true);

-- ============================================================
-- (ตัวเลือก) ตารางสถิติคะแนนอ้างอิงสำหรับเครื่องคำนวณโอกาส
-- ค่าประมาณจากสถิติปีก่อน — ไม่ใช่ตัวเลขทางการปี 2570
-- แอปมี dataset นี้ฝั่ง client อยู่แล้ว (js/tcas70.js) จึงไม่จำเป็น
-- แต่ถ้าอยากเก็บใน DB ด้วย ให้รันส่วนนี้
-- ============================================================
create table if not exists public.tcas70_faculty_stats (
  key         text primary key,
  label       text not null,
  round_label text,
  min_gpax    numeric,
  ref_score   numeric,          -- คะแนนอ้างอิง % (ประมาณการ)
  weights     jsonb not null,   -- { "tgat": 30, "alv_math1": 25, ... }
  note        text
);

delete from public.tcas70_faculty_stats;
insert into public.tcas70_faculty_stats (key, label, round_label, min_gpax, ref_score, weights, note) values
  ('med',     'แพทยศาสตร์ (กสพท)',        'รอบ 3 (กสพท)',   3.00, 68, '{"tpat1":30,"alv_math1":14,"alv_phy":14,"alv_chem":14,"alv_bio":14,"alv_thai":5,"alv_soc":5,"alv_eng":4}', 'ประมาณการจากสถิติปีก่อน'),
  ('dent',    'ทันตแพทยศาสตร์ (กสพท)',    'รอบ 3 (กสพท)',   3.00, 63, '{"tpat1":30,"alv_math1":14,"alv_phy":14,"alv_chem":16,"alv_bio":14,"alv_thai":4,"alv_soc":4,"alv_eng":4}', 'ประมาณการจากสถิติปีก่อน'),
  ('pharm',   'เภสัชศาสตร์',              'รอบ 3 Admission', 2.75, 60, '{"tgat":20,"alv_math1":15,"alv_chem":25,"alv_bio":20,"alv_phy":10,"alv_eng":10}', 'ประมาณการจากสถิติปีก่อน'),
  ('nurse',   'พยาบาลศาสตร์',             'รอบ 3 Admission', 2.75, 52, '{"tgat":30,"alv_bio":25,"alv_chem":20,"alv_eng":15,"alv_math1":10}', 'ประมาณการจากสถิติปีก่อน'),
  ('vet',     'สัตวแพทยศาสตร์',           'รอบ 3 Admission', 2.75, 58, '{"tgat":20,"alv_bio":25,"alv_chem":20,"alv_phy":15,"alv_math1":20}', 'ประมาณการจากสถิติปีก่อน'),
  ('eng',     'วิศวกรรมศาสตร์',           'รอบ 3 Admission', 2.50, 55, '{"tgat":20,"tpat3":30,"alv_math1":25,"alv_phy":15,"alv_chem":10}', 'ประมาณการจากสถิติปีก่อน'),
  ('compsci', 'วิทยาการคอมพิวเตอร์ / IT', 'รอบ 3 Admission', 2.50, 52, '{"tgat":40,"tpat3":20,"alv_math1":30,"alv_eng":10}', 'ประมาณการจากสถิติปีก่อน'),
  ('sci',     'วิทยาศาสตร์',              'รอบ 3 Admission', 2.50, 45, '{"tgat":20,"alv_math1":25,"alv_phy":15,"alv_chem":20,"alv_bio":20}', 'ประมาณการจากสถิติปีก่อน'),
  ('arch',    'สถาปัตยกรรมศาสตร์',        'รอบ 3 Admission', 2.50, 50, '{"tgat":20,"tpat4":40,"alv_math1":20,"alv_phy":20}', 'ประมาณการจากสถิติปีก่อน'),
  ('account', 'บัญชี / บริหารธุรกิจ',     'รอบ 3 Admission', 2.50, 55, '{"tgat":50,"alv_math2":25,"alv_eng":25}', 'ประมาณการจากสถิติปีก่อน'),
  ('econ',    'เศรษฐศาสตร์',              'รอบ 3 Admission', 2.50, 50, '{"tgat":40,"alv_math1":30,"alv_eng":30}', 'ประมาณการจากสถิติปีก่อน'),
  ('law',     'นิติศาสตร์',               'รอบ 3 Admission', 2.50, 50, '{"tgat":50,"alv_soc":30,"alv_thai":10,"alv_eng":10}', 'ประมาณการจากสถิติปีก่อน'),
  ('polsci',  'รัฐศาสตร์',                'รอบ 3 Admission', 2.50, 48, '{"tgat":50,"alv_soc":30,"alv_eng":20}', 'ประมาณการจากสถิติปีก่อน'),
  ('arts',    'อักษรศาสตร์ / มนุษยศาสตร์', 'รอบ 3 Admission', 2.50, 50, '{"tgat":40,"alv_thai":25,"alv_soc":15,"alv_eng":20}', 'ประมาณการจากสถิติปีก่อน'),
  ('comm',    'นิเทศศาสตร์ / วารสารฯ',    'รอบ 3 Admission', 2.50, 50, '{"tgat":50,"alv_thai":20,"alv_soc":15,"alv_eng":15}', 'ประมาณการจากสถิติปีก่อน'),
  ('edu',     'ครุศาสตร์ / ศึกษาศาสตร์',  'รอบ 3 Admission', 2.50, 48, '{"tgat":30,"tpat5":30,"alv_thai":15,"alv_soc":10,"alv_eng":15}', 'ประมาณการจากสถิติปีก่อน'),
  ('psych',   'จิตวิทยา',                 'รอบ 3 Admission', 2.50, 50, '{"tgat":40,"alv_bio":15,"alv_soc":20,"alv_eng":25}', 'ประมาณการจากสถิติปีก่อน'),
  ('fineart', 'ศิลปกรรมศาสตร์',           'รอบ 3 Admission', 2.00, 45, '{"tgat":20,"tpat2":50,"alv_thai":15,"alv_eng":15}', 'ประมาณการจากสถิติปีก่อน');

-- อนุญาตให้ anon อ่านตารางสถิติ (public read) — ถ้าเปิด RLS อยู่
-- alter table public.tcas70_faculty_stats enable row level security;
-- create policy "tcas70_stats public read" on public.tcas70_faculty_stats for select to anon using (true);
