// ============================================================
// NEX — pointer FX (cursor glow + card tilt/sheen)
// Delegated on window → ทำงานต่อได้แม้ SPA เปลี่ยน innerHTML
// ปิดอัตโนมัติบนจอสัมผัส / prefers-reduced-motion
// ============================================================
(function () {
  if (!window.matchMedia) return;
  const fine = matchMedia("(pointer:fine)").matches;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduce) return;

  // ---------- แสงเรืองตามเมาส์ (ทั้งจอ) ----------
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  const mount = () => { if (document.body && !glow.isConnected) document.body.appendChild(glow); };
  mount();
  document.addEventListener("DOMContentLoaded", mount);

  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, shown = false;
  window.addEventListener("pointermove", (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!shown) { shown = true; glow.classList.add("on"); }
  }, { passive: true });
  window.addEventListener("pointerdown", () => glow.classList.add("pulse"), { passive: true });
  window.addEventListener("pointerup", () => glow.classList.remove("pulse"), { passive: true });
  (function loop() {
    gx += (tx - gx) * 0.18; gy += (ty - gy) * 0.18;
    glow.style.transform = `translate3d(${gx}px,${gy}px,0)`;
    requestAnimationFrame(loop);
  })();

  // ---------- การ์ดเอียง 3D + แสงวิ่งตามเคอร์เซอร์ ----------
  let active = null;
  const TILT = 6; // องศาสูงสุด
  window.addEventListener("pointermove", (e) => {
    const card = e.target && e.target.closest ? e.target.closest(".db-card") : null;
    if (card !== active) { if (active) resetCard(active); active = card; if (card) card.classList.add("fx-tilt"); }
    if (!card) return;
    const r = card.getBoundingClientRect();
    if (r.width < 60 || r.height < 40) { resetCard(card); active = null; return; } // ข้ามการ์ดเล็ก (chip/pill)
    const px = (e.clientX - r.left) / r.width;   // 0..1
    const py = (e.clientY - r.top) / r.height;   // 0..1
    card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
    card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
    const rx = ((0.5 - py) * TILT * 2).toFixed(2);
    const ry = ((px - 0.5) * TILT * 2).toFixed(2);
    card.style.transform = `perspective(760px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
  }, { passive: true });

  function resetCard(c) {
    c.classList.remove("fx-tilt");
    c.style.transform = "";
    c.style.removeProperty("--mx");
    c.style.removeProperty("--my");
  }
  // เผื่อออกนอกหน้าต่าง/สลับแท็บ
  window.addEventListener("blur", () => { if (active) { resetCard(active); active = null; } });
  document.addEventListener("pointerleave", () => { if (active) { resetCard(active); active = null; } });
})();
