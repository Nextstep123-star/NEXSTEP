<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NEX — Career Path Finder</title>

  <!-- Dynamic favicon (lime mark on dark bg) — set by logo.js after load -->
  <link id="favicon" rel="icon" type="image/svg+xml" href="assets/logo.svg" />

  <!-- Apply saved theme before paint (no flash). Default = dark. -->
  <script>try { if ((localStorage.getItem("nextstep_theme") || "dark") === "light") document.documentElement.classList.add("light"); } catch (e) {}</script>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@500;600;700&family=IBM+Plex+Sans+Thai:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

  <!-- Streamline icons (replaces Material Symbols) -->
  <script src="https://cdn.jsdelivr.net/npm/@streamlinehq/streamline-regular@1/dist/streamline-regular.js" defer></script>
  <!-- Keep Material Symbols as fallback for any remaining icon() calls -->
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />

  <!-- Tailwind + design tokens -->
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <script>
    tailwind.config = {
      darkMode: "class",
      theme: { extend: {
        colors: {
          "background": "#16180f", "surface": "#16180f", "surface-bright": "#2c2f28",
          "surface-dim": "#101109", "surface-variant": "#3a3f34",
          "surface-container-lowest": "#1b1d16", "surface-container-low": "#1f2119",
          "surface-container": "#23251d", "surface-container-high": "#292c23",
          "surface-container-highest": "#34382f",
          "on-background": "#eef0e6", "on-surface": "#eef0e6", "on-surface-variant": "#9aa090",
          "primary": "#c2d90f", "on-primary": "#16180f",
          "primary-container": "#c2d90f", "on-primary-container": "#16180f",
          "primary-fixed": "#dcee5a", "primary-fixed-dim": "#96a80a",
          "secondary": "#d3cb00", "on-secondary": "#16180f",
          "secondary-container": "#4c4900", "secondary-fixed": "#f1e800",
          "on-secondary-fixed-variant": "#4c4900",
          "tertiary": "#88ceff", "tertiary-container": "#4abdff",
          "outline": "#8b937f", "outline-variant": "#454b3d",
          "error": "#ffb4ab", "error-container": "#93000a", "on-error": "#16180f",
        },
        borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
        spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px" },
        fontFamily: {
          "headline": ["Kanit", "sans-serif"], "display": ["Kanit", "sans-serif"],
          "body": ["IBM Plex Sans Thai", "IBM Plex Sans", "sans-serif"],
          "thai": ["IBM Plex Sans Thai", "sans-serif"],
          "mono": ["IBM Plex Mono", "monospace"],
        },
      }},
    };
  </script>

  <link rel="stylesheet" href="css/styles.css" />
</head>
<body class="bg-surface text-on-surface font-body">

  <!-- =====================================================
       SPLASH — lime bg, NEX logo reveal, then fades to app
       ===================================================== -->
  <div class="splash" id="splash" aria-hidden="true">
    <!-- full logo: mark + NEX wordmark, both in black (#16180f) on lime -->
    <div class="splash-logo">
      <svg class="s-full-logo" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg" aria-label="NEX">
        <g fill="#16180f">
          <!-- Mark: downward arrow with 3 branches -->
          <rect x="43" y="6"  width="14" height="44"/>
          <polygon points="50,88 24,56 76,56"/>
          <rect x="8"  y="27" width="38" height="12" rx="2" transform="rotate(-42 27 33)"/>
          <rect x="54" y="27" width="38" height="12" rx="2" transform="rotate(42 73 33)"/>
          <rect x="7"  y="49" width="28" height="11" rx="2"/>
          <rect x="65" y="49" width="28" height="11" rx="2"/>
          <!-- Wordmark: NEX -->
          <g transform="translate(112,6)">
            <!-- N -->
            <rect x="0"  y="0" width="14" height="84"/>
            <rect x="56" y="0" width="14" height="84"/>
            <polygon points="0,0 14,0 70,80 70,84 56,84 0,4"/>
            <!-- E -->
            <rect x="88"  y="0"  width="13" height="84"/>
            <rect x="88"  y="0"  width="58" height="14"/>
            <rect x="88"  y="36" width="48" height="12"/>
            <rect x="88"  y="70" width="58" height="14"/>
            <!-- X -->
            <polygon points="168,0  184,0  244,84 228,84"/>
            <polygon points="244,0  228,0  168,84 184,84"/>
          </g>
        </g>
      </svg>
    </div>
    <p class="s-tag">เริ่มต้นเส้นทางสู่คณะในฝัน</p>
  </div>

  <!-- SPA root -->
  <div id="app"></div>
  <div id="toast"></div>

  <!-- Supabase JS v2 -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/config.js"></script>
  <script src="assets/logo.js"></script>
  <script src="js/icons.js"></script>
  <script src="js/onboarding.js"></script>
  <script src="js/views.js"></script>
  <script src="js/app.js"></script>

  <!-- Set dynamic favicon after logo.js loads -->
  <script>
    document.addEventListener("DOMContentLoaded", function () {
      try {
        var fav = document.getElementById("favicon");
        if (fav && typeof nexFaviconHref === "function")
          fav.href = nexFaviconHref("lime", "#16180f");
      } catch (e) {}
    });
  </script>

  <!-- Splash controller -->
  <script>
    (function () {
      var splash = document.getElementById("splash");
      if (!splash) return;
      window.addEventListener("load", function () {
        var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        var hold = reduce ? 400 : 1900;
        setTimeout(function () {
          splash.classList.add("done");
          var removed = false;
          var rm = function () { if (removed) return; removed = true; splash.remove(); };
          splash.addEventListener("transitionend", rm, { once: true });
          setTimeout(rm, 900);
        }, hold);
      });
    })();
  </script>
</body>
</html>
