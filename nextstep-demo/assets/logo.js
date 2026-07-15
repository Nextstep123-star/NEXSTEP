// ============================================================
// NEX logo — shared SVG helper
// Usage:
//   nexLogo("full", "lime")  → mark + wordmark, lime on dark
//   nexLogo("mark", "black") → mark only, black (for favicons / small spaces)
//   nexLogo("full", "black") → black version (on lime splash)
//
// Variants: "lime" | "black" | "white"
// Types:    "full" | "mark"
// ============================================================

const NEX_COLORS = {
  lime:  "#c2d90f",
  black: "#16180f",
  white: "#eef0e6",
};

// Mark path — downward arrow with diagonal branches (traced from brand image)
// ViewBox: 0 0 100 100
const MARK_PATHS = `
  <!-- stem -->
  <rect x="43" y="8"  width="14" height="44"/>
  <!-- arrowhead pointing down -->
  <polygon points="50,88 26,58 74,58"/>
  <!-- left diagonal branch -->
  <rect x="10" y="28" width="38" height="12" rx="2" transform="rotate(-40 29 34)"/>
  <!-- right diagonal branch -->
  <rect x="52" y="28" width="38" height="12" rx="2" transform="rotate(40 71 34)"/>
  <!-- left base notch -->
  <rect x="8"  y="50" width="28" height="11" rx="2"/>
  <!-- right base notch -->
  <rect x="64" y="50" width="28" height="11" rx="2"/>
`;

// NEX letterforms — geometric condensed bold (viewBox 0 0 280 100)
const WORDMARK_PATHS = `
  <!-- N: two verticals + diagonal stroke -->
  <rect x="0"   y="8" width="14" height="84"/>
  <rect x="56"  y="8" width="14" height="84"/>
  <polygon points="0,8 14,8 70,84 70,92 56,92 0,16"/>
  <!-- E: vertical + 3 horizontals -->
  <rect x="88"  y="8"  width="13" height="84"/>
  <rect x="88"  y="8"  width="58" height="14"/>
  <rect x="88"  y="45" width="48" height="12"/>
  <rect x="88"  y="78" width="58" height="14"/>
  <!-- X: two diagonal strokes -->
  <polygon points="168,8  185,8  247,92 230,92"/>
  <polygon points="247,8  230,8  168,92 185,92"/>
`;

/**
 * @param {"full"|"mark"} type
 * @param {"lime"|"black"|"white"} color
 * @param {string} [cls]  extra CSS classes on the <svg>
 * @returns {string} SVG HTML string
 */
function nexLogo(type = "full", color = "lime", cls = "") {
  const fill = NEX_COLORS[color] || color;
  if (type === "mark") {
    return `<svg class="${cls}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="NEX" role="img">
      <g fill="${fill}">${MARK_PATHS}</g>
    </svg>`;
  }
  // full: mark (100×100) + wordmark (280×100) side by side in one SVG
  return `<svg class="${cls}" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg" aria-label="NEX" role="img">
    <g fill="${fill}">
      ${MARK_PATHS}
      <g transform="translate(112,0)">${WORDMARK_PATHS}</g>
    </g>
  </svg>`;
}

// Favicon: generate a 32×32 data-URL SVG for <link rel="icon">
function nexFaviconHref(color = "lime", bg = "transparent") {
  const fill = NEX_COLORS[color] || color;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    ${bg !== "transparent" ? `<rect width="100" height="100" fill="${bg}" rx="18"/>` : ""}
    <g fill="${fill}">${MARK_PATHS}</g>
  </svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg.trim());
}
