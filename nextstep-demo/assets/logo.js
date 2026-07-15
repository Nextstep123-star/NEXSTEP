// ============================================================
// NEX logo — precisely traced from brand identity images
// Mark: downward arrow with 2 diagonal branches + horizontal base bars
// Wordmark: geometric condensed bold N-E-X
// ============================================================

const NEX_COLORS = { lime: "#c2d90f", black: "#16180f", white: "#eef0e6" };

// Mark paths (viewBox 0 0 100 100)
// Structure: vertical stem → arrowhead → left diagonal branch → right diagonal branch → left base → right base
const MARK = `
  <rect x="44" y="4" width="12" height="40"/>
  <polygon points="50,92 20,55 80,55"/>
  <rect x="6" y="20" width="44" height="11" rx="1.5" transform="rotate(-40 28 25.5)"/>
  <rect x="50" y="20" width="44" height="11" rx="1.5" transform="rotate(40 72 25.5)"/>
  <rect x="5"  y="47" width="30" height="11" rx="1.5"/>
  <rect x="65" y="47" width="30" height="11" rx="1.5"/>
`;

// Wordmark (viewBox 0 0 290 88)
// N: two verticals + diagonal; E: vertical + 3 bars; X: two crossing diagonals
const WORD = `
  <rect x="0"  y="0" width="13" height="88"/>
  <rect x="58" y="0" width="13" height="88"/>
  <polygon points="0,0 13,0 71,76 71,88 58,88 0,12"/>
  <rect x="90"  y="0"  width="12" height="88"/>
  <rect x="90"  y="0"  width="60" height="14"/>
  <rect x="90"  y="37" width="50" height="13"/>
  <rect x="90"  y="74" width="60" height="14"/>
  <polygon points="171,0 186,0 250,88 235,88"/>
  <polygon points="250,0 235,0 171,88 186,88"/>
`;

function nexLogo(type = "full", color = "lime", cls = "") {
  const fill = NEX_COLORS[color] || color;
  if (type === "mark") {
    return `<svg class="${cls}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="NEX" role="img" fill="${fill}">${MARK}</svg>`;
  }
  return `<svg class="${cls}" viewBox="0 0 410 100" xmlns="http://www.w3.org/2000/svg" aria-label="NEX" role="img">
    <g fill="${fill}">
      ${MARK}
      <g transform="translate(118,6)">${WORD}</g>
    </g>
  </svg>`;
}

function nexFaviconHref(color = "lime", bg = "#16180f") {
  const fill = NEX_COLORS[color] || color;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="${bg}"/><g fill="${fill}">${MARK}</g></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg.trim());
}
