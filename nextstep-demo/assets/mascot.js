// ============================================================
// NEX pixel-art mascot — "เน็กซ์" น้องบล็อบมะนาว (บัณฑิตในฝัน)
// สไตล์ pixel-art blob (แบบ Claude Code mascot) สีแบรนด์ NEX
// วาดด้วย <rect> 1x1 บน grid → คมทุกขนาด (shape-rendering:crispEdges)
// ใช้: nexMascot("h-16 w-16", { pose:"happy" | "wave" | "think" })
// ============================================================

const NEX_MASCOT_PAL = {
  G: "#c2d90f", // ตัว (lime)
  H: "#d9ec5a", // ไฮไลต์บนซ้าย
  D: "#8ea00a", // เงาล่าง (dark lime)
  K: "#16180f", // ดำ (ตา/ขอบหมวก)
  M: "#2a2d22", // หมวกทึบ
  C: "#dcee5a", // ทัสเซล/พู่ (bright lime)
  P: "#ff9aa8", // แก้มชมพู
};

// 16 คอลัมน์ · แถวบน→ล่าง · ' ' = โปร่งใส
// ตา = happy (^ ^) · หมวกบัณฑิตด้านบน + พู่ห้อยขวา
const NEX_MASCOT_POSES = {
  happy: [
    "                ",
    "       CC       ",
    "   KKKKKKKKKK   ",
    "   KKKKKKKKKKC  ",
    "     MMMM   C   ",
    "    GGGGGGGG    ",
    "   HGGGGGGGGG   ",
    "  HGGGGGGGGGGG  ",
    "  GGGGGGGGGGGG  ",
    "  GGGKGGGGKGGG  ",
    "  GGKGKGGKGKGG  ",
    "  GGGGGGGGGGGG  ",
    "  GPGGGGGGGGPG  ",
    "  DGGGGGGGGGGD  ",
    "  DDD DDDD DDD  ",
    "   DD  DD  DD   ",
  ],
  wave: [
    "            GG  ",
    "       CC   GG  ",
    "   KKKKKKKKKKG  ",
    "   KKKKKKKKKKC  ",
    "     MMMM   C   ",
    "    GGGGGGGG    ",
    "   HGGGGGGGGG   ",
    "  HGGGGGGGGGGG  ",
    "  GGGGGGGGGGGG  ",
    "  GGKKGGGGKKGG  ",
    "  GGKKGGGGKKGG  ",
    "  GGGGGGGGGGGG  ",
    "  GPGGGGGGGGPG  ",
    "  DGGGGGGGGGGD  ",
    "  DDD DDDD DDD  ",
    "   DD  DD  DD   ",
  ],
  think: [
    "              C ",
    "       CC    C  ",
    "   KKKKKKKKKKKC ",
    "   KKKKKKKKKKC  ",
    "     MMMM   C   ",
    "    GGGGGGGG    ",
    "   HGGGGGGGGG   ",
    "  HGGGGGGGGGGG  ",
    "  GGGGGGGGGGGG  ",
    "  GGKKGGGGKKGG  ",
    "  GGGGGGGGGGGG  ",
    "  GGGGG--GGGGG  ",
    "  GPGGGGGGGGPG  ",
    "  DGGGGGGGGGGD  ",
    "  DDD DDDD DDD  ",
    "   DD  DD  DD   ",
  ],
};
NEX_MASCOT_PAL["-"] = "#8ea00a"; // เส้นปาก (think)

function nexMascot(cls = "", opts = {}) {
  const pose = (opts && opts.pose) || "happy";
  const rows = NEX_MASCOT_POSES[pose] || NEX_MASCOT_POSES.happy;
  const h = rows.length, w = rows[0].length;
  let cells = "";
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const c = row[x];
      const fill = NEX_MASCOT_PAL[c];
      if (!fill) continue;
      cells += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${fill}"/>`;
    }
  }
  return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="น้องเน็กซ์ มาสคอต NEX">${cells}</svg>`;
}
