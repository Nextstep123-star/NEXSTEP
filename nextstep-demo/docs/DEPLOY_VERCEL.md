# 🚀 คู่มือ Deploy NEXTSTEP ลง Vercel

แอปนี้เป็น **static site** (HTML/CSS/JS + CDN) — deploy บน Vercel ได้ฟรีและง่ายมาก
แต่ต้องตั้งค่า **3 จุด** ให้ถูก ไม่งั้น Google login และการยืนยันอีเมลจะพัง

---

## ✅ สิ่งที่ทำงานได้ทันทีหลัง deploy
- อ่านข้อมูลทั้งหมด (หลักสูตร / มหาวิทยาลัย / ข่าว / ปฏิทิน / roadmap)
- สมัคร/เข้าสู่ระบบด้วย **อีเมล + รหัสผ่าน**
- ทุกหน้า UI, โหมดมืด/สว่าง, รองรับมือถือ

> เพราะ Supabase อนุญาต CORS จากทุก origin สำหรับ REST API (anon key) และ RLS ป้องกันข้อมูลอยู่แล้ว

---

## 1️⃣ ตั้งค่าตอน Import เข้า Vercel

ไปที่ [vercel.com/new](https://vercel.com/new) → เลือก repo `Nextstep123-star/NEXSTEP`

| ช่อง | ค่าที่ต้องตั้ง |
|------|----------------|
| **Root Directory** | `nextstep-demo` ⚠️ **สำคัญ** (แอปอยู่ในโฟลเดอร์ย่อย) |
| **Framework Preset** | Other |
| **Build Command** | (เว้นว่าง) |
| **Output Directory** | (เว้นว่าง — ใช้ `.` จาก vercel.json) |
| **Install Command** | (เว้นว่าง) |

> ไฟล์ [`vercel.json`](../vercel.json) จัดการ static serving + security headers ให้แล้ว

กด **Deploy** → รอ ~30 วินาที → ได้ URL เช่น `https://nexstep-xxxx.vercel.app`

---

## 2️⃣ ตั้งค่า Supabase Auth ⚠️ (สำคัญที่สุด)

ถ้าข้ามขั้นนี้ → **ลิงก์ยืนยันอีเมล + Google login จะเด้งกลับ `localhost`** แทนเว็บจริง

ไปที่ **Supabase Dashboard → Authentication → URL Configuration**
([ลิงก์ตรง](https://supabase.com/dashboard/project/cbsteufryuiwcqbgcfle/auth/url-configuration))

1. **Site URL** → ใส่ URL จาก Vercel:
   ```
   https://nexstep-xxxx.vercel.app
   ```

2. **Redirect URLs** → เพิ่ม (Add URL):
   ```
   https://nexstep-xxxx.vercel.app
   https://nexstep-xxxx.vercel.app/**
   http://127.0.0.1:5173
   ```
   > บรรทัดสุดท้ายเก็บไว้เพื่อให้ dev ในเครื่องยังใช้ได้

3. กด **Save**

---

## 3️⃣ ตั้งค่า Google OAuth (เฉพาะถ้าใช้ปุ่ม "เข้าสู่ระบบด้วย Google")

### ที่ Google Cloud Console
[console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID

- **Authorized JavaScript origins** → เพิ่ม:
  ```
  https://nexstep-xxxx.vercel.app
  ```
- **Authorized redirect URIs** → ต้องมี (ของ Supabase):
  ```
  https://cbsteufryuiwcqbgcfle.supabase.co/auth/v1/callback
  ```

### ที่ Supabase Dashboard
Authentication → Providers → **Google** → เปิด + ใส่ Client ID / Secret → Save

---

## 🔄 Auto-Deploy

หลังเชื่อม repo แล้ว ทุกครั้งที่ `git push origin main` → Vercel จะ deploy ใหม่อัตโนมัติ

---

## 🧪 ตรวจสอบหลัง Deploy

| ทดสอบ | ผลที่ถูกต้อง |
|-------|--------------|
| เปิด URL Vercel | เห็น splash โลโก้ NEX แล้วเข้าหน้า login |
| สมัครด้วยอีเมล | เข้าสู่ระบบได้ทันที (โปรเจกต์นี้เปิด auto-confirm) |
| ดูข่าว/ปฏิทิน/มหาวิทยาลัย | ข้อมูลขึ้นครบ (ดึงจาก Supabase) |
| Google login | เด้งหน้า Google แล้วกลับมาที่เว็บ Vercel (ไม่ใช่ localhost) |
| เปิด DevTools → Console | ไม่มี error สีแดง (CORS / 403) |

---

## ⚠️ หมายเหตุด้านความปลอดภัย

- `js/config.js` มี **publishable key** เท่านั้น — ปลอดภัยที่จะอยู่ในโค้ด public
- ข้อมูลผู้ใช้ถูกป้องกันด้วย **RLS** (`auth.uid() = id`) — คนอื่นอ่านข้อมูลเราไม่ได้แม้มี anon key
- **ห้าม** ใส่ `service_role` key หรือ Personal Access Token ลงในโค้ดฝั่ง client เด็ดขาด

---

## 🛠️ ปัญหาที่อาจเจอ

| อาการ | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| หน้า 404 / ไฟล์ไม่โหลด | Root Directory ผิด | ตั้ง Root Directory = `nextstep-demo` |
| Google login เด้ง localhost | ยังไม่ตั้ง Site URL | ทำขั้นที่ 2 |
| `redirect_uri_mismatch` | Google Console ยังไม่มี origin | ทำขั้นที่ 3 |
| ยืนยันอีเมลไปหน้า error | Redirect URLs ไม่ครบ | เพิ่ม `.../**` ในขั้นที่ 2 |
| CSS/JS ไม่โหลด (หน้าเปล่า) | path ผิด | เช็คว่า Root Directory ถูก + ไฟล์ครบ |

---

<p align="center">
  <strong>NEXTSTEP</strong> พร้อมออนไลน์ 🌐<br/>
  <sub>Static site · Vercel · Supabase</sub>
</p>
