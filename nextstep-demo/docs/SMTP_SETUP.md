# 📧 ตั้งค่า SMTP ให้ Supabase ส่งอีเมลได้จริง (ยืนยันอีเมล + ลืมรหัสผ่าน)

ปัญหา: Supabase มี **SMTP ในตัว (built-in)** แต่ **จำกัดโควตา ~3-4 ฉบับ/ชม.**, ช้า และมักเข้า **สแปม** →
อีเมลยืนยัน/รีเซ็ตรหัสเลยมาไม่ถึง ทำให้ "ลืมรหัสผ่าน" ใช้ไม่ได้

วิธีแก้: ตั้ง **Custom SMTP** → ปลดล็อกโควตา + ส่งได้เสถียร

> จุดตั้งค่าใน Supabase: **Dashboard → โปรเจกต์ `cbsteufryuiwcqbgcfle` → Authentication → Emails → SMTP Settings**
> (บางเวอร์ชันอยู่ที่ Authentication → Settings/Configuration → “SMTP Settings”) → เปิด **Enable Custom SMTP**

---

## ⭐ ตัวเลือก A — Gmail (ง่ายสุดสำหรับนักเรียน · ฟรี · ไม่ต้องมีโดเมน · ~500 ฉบับ/วัน)

### 1) เปิด 2-Step Verification ในบัญชี Google
[myaccount.google.com/security](https://myaccount.google.com/security) → **การยืนยันแบบ 2 ขั้นตอน** → เปิด
(ต้องเปิดก่อน ถึงจะสร้าง App Password ได้)

### 2) สร้าง App Password
[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) → ตั้งชื่อ `Supabase` → **สร้าง**
→ ได้รหัส 16 ตัว (เช่น `abcd efgh ijkl mnop`) — **ก๊อปไว้** (เอาช่องว่างออกก็ได้)

### 3) กรอกใน Supabase → SMTP Settings
| ช่อง | ค่า |
|------|-----|
| Sender email | อีเมล Gmail ของคุณ (เช่น `nextstepe123@gmail.com`) |
| Sender name | `NEXTSTEP` (หรือ `NEX`) |
| Host | `smtp.gmail.com` |
| Port | `465` |
| Username | อีเมล Gmail (ตัวเดียวกับ Sender) |
| Password | รหัส App Password 16 ตัว (❌ ไม่ใช่รหัส Gmail ปกติ) |
| Minimum interval | `60` (วินาที) พอ |

→ **Save**

> ⚠️ Gmail บังคับให้ **Sender email = อีเมลที่ล็อกอิน** (ส่งในนามอีเมลอื่นไม่ได้)

---

## 🅱️ ตัวเลือก B — Brevo (เดิม Sendinblue) — ฟรี 300 ฉบับ/วัน · ไม่ต้องใช้ Gmail ส่วนตัว

1. สมัคร [brevo.com](https://www.brevo.com) → ยืนยันอีเมล
2. ไปที่ **Senders, Domains & Dedicated IPs → Senders** → เพิ่ม & ยืนยัน sender email (กดลิงก์ในเมลที่ Brevo ส่งมา)
3. ไปที่ **SMTP & API → SMTP** → จะเห็น:
   - Server: `smtp-relay.brevo.com`
   - Port: `587`
   - Login: (อีเมล/loginของคุณ)
   - **Master Password / SMTP key**: กด **Generate a new SMTP key** → ก๊อป
4. กรอกใน Supabase → SMTP Settings:

| ช่อง | ค่า |
|------|-----|
| Sender email | อีเมลที่ยืนยันกับ Brevo |
| Sender name | `NEXTSTEP` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | Login ของ Brevo |
| Password | SMTP key ที่เพิ่งสร้าง |

→ **Save**

---

## ✅ หลังตั้งเสร็จ — ตรวจสอบ

1. **Authentication → URL Configuration** ให้แน่ใจว่า:
   - **Site URL** = `https://nexstep-dun.vercel.app`
   - **Redirect URLs** มี `https://nexstep-dun.vercel.app` และ `https://nexstep-dun.vercel.app/**`
2. เปิดแอป → **ลืมรหัสผ่าน?** → กรอกอีเมล → ส่ง
3. เช็กกล่องจดหมาย (+ สแปม) → กดลิงก์ → ควรเด้งเข้าหน้า **ตั้งรหัสผ่านใหม่** ในแอป
4. ตั้งรหัสใหม่ → เข้าสู่ระบบด้วยรหัสใหม่

## 🛠️ ถ้ายังไม่ได้
| อาการ | สาเหตุ/วิธีแก้ |
|-------|----------------|
| อีเมลไม่มาเลย | เช็กสแปม · Gmail: ใช้ App Password ไม่ใช่รหัสปกติ · Brevo: sender ยังไม่ยืนยัน |
| `Invalid login: 535` | Username/Password SMTP ผิด |
| กดลิงก์แล้วเด้ง error/ผิดหน้า | Redirect URLs / Site URL ไม่ตรงกับ `nexstep-dun.vercel.app` |
| ส่งได้แต่ช้า/หยุด | ยังใช้ built-in อยู่ (ยังไม่กด Enable Custom SMTP) หรือชนโควตาผู้ให้บริการ |

## 💡 ไม่อยากยืนยันอีเมลตอนสมัคร?
ถ้าอยากให้ **สมัครแล้วเข้าเลย** (ไม่ต้องยืนยัน) → Authentication → Providers → **Email** → ปิด **Confirm email**
(แต่ "ลืมรหัสผ่าน" ยังต้องใช้ SMTP อยู่ดี เพราะต้องส่งลิงก์ไปอีเมล)
