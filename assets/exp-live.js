/* ============================================================================
   exp-live.js - the live A/B experiment playground for
   learn-experimentation-with-phoebe.  Two tools, zero dependencies:

     1. Sample-size planner  - baseline rate + MDE + alpha + power -> N per arm,
        total N, and days-to-run at a given daily traffic. Live as you type.
     2. Peeking simulator     - runs many simulated A/A tests (NO true effect)
        and shows how checking every day and stopping at the first p < 0.05
        inflates the false-positive rate far above the nominal 5%.

   Drop a <div class="exp-live" data-tool="planner|peeking"> ... </div> on any
   page (defaults seeded from Lumen canon). Styling reads the site CSS vars, so
   it matches whatever palette the course is themed in.
   ==========================================================================*/
(function () {
  "use strict";

  /* ---------- math helpers (no libraries) ---------- */

  // Inverse standard-normal CDF (Acklam's rational approximation, |err| < 1e-9)
  function invNorm(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
             1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
             6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
             3.754408661907416e+00];
    var plow = 0.02425, phigh = 1 - plow, q, r;
    if (p < plow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
             ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    } else if (p <= phigh) {
      q = p - 0.5; r = q*q;
      return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
             (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
              ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    }
  }

  // Standard-normal CDF via erf (Abramowitz-Stegun 7.1.26)
  function normCdf(x) {
    var t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
    var y = 1 - (((((1.061405429*t - 1.453152027)*t) + 1.421413741)*t - 0.284496736)*t
               + 0.254829592)*t * Math.exp(-x*x/2);
    var cdf = 0.5 * (1 + (x < 0 ? -y : y));
    return cdf;
  }

  // Two-sided p-value for a two-proportion z-test (pooled variance)
  function twoPropP(c1, n1, c2, n2) {
    if (n1 === 0 || n2 === 0) return 1;
    var p1 = c1 / n1, p2 = c2 / n2;
    var pool = (c1 + c2) / (n1 + n2);
    var se = Math.sqrt(pool * (1 - pool) * (1 / n1 + 1 / n2));
    if (se === 0) return 1;
    var z = (p2 - p1) / se;
    return 2 * (1 - normCdf(Math.abs(z)));
  }

  // Sample size per arm, two-proportion, two-sided
  function sampleSizePerArm(p1, p2, alpha, power) {
    if (p2 === p1) return Infinity;
    var pbar = (p1 + p2) / 2;
    var za = invNorm(1 - alpha / 2);
    var zb = invNorm(power);
    var num = za * Math.sqrt(2 * pbar * (1 - pbar)) +
              zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
    return Math.ceil((num * num) / ((p2 - p1) * (p2 - p1)));
  }

  // Box-Muller normal sample; used to approximate a Binomial increment fast
  function randNorm() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function binom(n, p) {
    if (n <= 0) return 0;
    if (n < 30) { // exact for small n
      var k = 0;
      for (var i = 0; i < n; i++) if (Math.random() < p) k++;
      return k;
    }
    var s = Math.round(n * p + Math.sqrt(n * p * (1 - p)) * randNorm());
    return Math.max(0, Math.min(n, s));
  }

  function fmt(n) {
    if (!isFinite(n)) return "infinite";
    return n.toLocaleString("en-US");
  }

  /* ---------- tool 1: sample-size planner ---------- */

  function buildPlanner(root) {
    var d = root.dataset;
    var st = {
      base: parseFloat(d.base || "3.2"),   // baseline conversion %, control
      mde:  parseFloat(d.mde  || "12.5"),  // relative MDE %
      alpha: parseFloat(d.alpha || "5"),   // % (two-sided)
      power: parseFloat(d.power || "80"),  // %
      daily: parseFloat(d.daily || "4000") // total daily traffic across both arms
    };

    root.innerHTML =
      '<div class="xl-head"><span class="xl-badge">▶ Live</span>' +
      '<b>A/B sample-size planner</b><span class="xl-sub">Lumen product-page test - change any dial</span></div>' +
      '<div class="xl-grid">' +
        row("base", "Baseline conversion", st.base, "%", 0.5, 25, 0.1) +
        row("mde", "Relative lift to detect (MDE)", st.mde, "%", 1, 50, 0.5) +
        row("alpha", "Significance (alpha)", st.alpha, "%", 1, 20, 1) +
        row("power", "Power (1 - beta)", st.power, "%", 50, 99, 1) +
        row("daily", "Total daily traffic", st.daily, "", 200, 40000, 200) +
      '</div>' +
      '<div class="xl-out">' +
        '<div class="xl-stat"><span class="xl-num" data-o="perarm">-</span><span class="xl-lab">users per arm</span></div>' +
        '<div class="xl-stat"><span class="xl-num" data-o="total">-</span><span class="xl-lab">total users</span></div>' +
        '<div class="xl-stat"><span class="xl-num" data-o="days">-</span><span class="xl-lab">days to run</span></div>' +
      '</div>' +
      '<p class="xl-note" data-o="note"></p>';

    function row(key, label, val, unit, min, max, step) {
      return '<label class="xl-row"><span class="xl-rl">' + label + '</span>' +
        '<input type="range" data-k="' + key + '" min="' + min + '" max="' + max +
        '" step="' + step + '" value="' + val + '">' +
        '<output data-ov="' + key + '">' + val + unit + '</output></label>';
    }

    function recompute() {
      var p1 = st.base / 100;
      var p2 = p1 * (1 + st.mde / 100);
      var n = sampleSizePerArm(p1, p2, st.alpha / 100, st.power / 100);
      var total = isFinite(n) ? n * 2 : Infinity;
      var perDayPerArm = st.daily / 2;
      var days = isFinite(n) ? Math.ceil(n / perDayPerArm) : Infinity;
      set(root, "perarm", fmt(n));
      set(root, "total", fmt(total));
      set(root, "days", isFinite(days) ? days : "-");
      var absLift = ((p2 - p1) * 100).toFixed(2);
      var note = "Detecting " + st.base.toFixed(1) + "% -> " + (p2 * 100).toFixed(2) +
        "% (a " + absLift + "pp absolute lift) at " + st.alpha + "% alpha and " + st.power +
        "% power. ";
      if (days > 28) note += "That is over four weeks - either raise the MDE (accept a coarser test), lift traffic, or use CUPED to cut the sample.";
      else if (days < 3) note += "Short and cheap - but run at least one full week to average out day-of-week effects.";
      else note += "A clean one-to-four week test. Pre-commit to this N and do not peek early (see the peeking demo).";
      set(root, "note", note);
    }

    root.querySelectorAll("input[type=range]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var k = inp.dataset.k;
        st[k] = parseFloat(inp.value);
        var unit = (k === "daily") ? "" : "%";
        var ov = root.querySelector('[data-ov="' + k + '"]');
        if (ov) ov.textContent = (k === "daily" ? fmt(st[k]) : st[k]) + unit;
        recompute();
      });
    });
    recompute();
  }

  /* ---------- tool 2: peeking simulator ---------- */

  function buildPeeking(root) {
    var d = root.dataset;
    var rate = parseFloat(d.base || "3.2") / 100;   // both arms share this (A/A: no true effect)
    var nFinal = parseInt(d.nfinal || "11400", 10); // per arm at the planned horizon
    var runsDefault = parseInt(d.runs || "400", 10);

    root.innerHTML =
      '<div class="xl-head"><span class="xl-badge">▶ Live</span>' +
      '<b>The peeking penalty</b><span class="xl-sub">Same A/A test, no real difference - watch alpha inflate</span></div>' +
      '<div class="xl-peek-ctrl">' +
        '<label class="xl-row"><span class="xl-rl">Daily peeks until horizon</span>' +
          '<input type="range" data-k="checks" min="1" max="30" step="1" value="14">' +
          '<output data-ov="checks">14</output></label>' +
        '<label class="xl-row"><span class="xl-rl">Simulated experiments</span>' +
          '<input type="range" data-k="runs" min="100" max="1000" step="100" value="' + runsDefault + '">' +
          '<output data-ov="runs">' + runsDefault + '</output></label>' +
        '<button class="xl-run" type="button">Run the experiments ▶</button>' +
      '</div>' +
      '<div class="xl-out">' +
        '<div class="xl-stat xl-good"><span class="xl-num" data-o="fixed">-</span><span class="xl-lab">false positives<br>checking ONCE at the end</span></div>' +
        '<div class="xl-stat xl-bad"><span class="xl-num" data-o="peek">-</span><span class="xl-lab">false positives<br>peeking + stopping early</span></div>' +
      '</div>' +
      '<div class="xl-bars"><div class="xl-barwrap"><span>Fixed horizon</span><div class="xl-bar"><i data-b="fixed"></i></div></div>' +
        '<div class="xl-barwrap"><span>Peeking</span><div class="xl-bar xl-barbad"><i data-b="peek"></i></div></div>' +
        '<div class="xl-mark" title="nominal 5%"></div></div>' +
      '<p class="xl-note" data-o="note">Both arms have the exact same true rate, so every "win" here is false. A correct fixed-horizon test rejects ~5% of the time (that is alpha). Peeking rejects far more - that gap is manufactured false discoveries.</p>';

    var st = { checks: 14, runs: runsDefault };
    root.querySelectorAll("input[type=range]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        st[inp.dataset.k] = parseInt(inp.value, 10);
        var ov = root.querySelector('[data-ov="' + inp.dataset.k + '"]');
        if (ov) ov.textContent = inp.value;
      });
    });

    root.querySelector(".xl-run").addEventListener("click", function () {
      var btn = this; btn.disabled = true; btn.textContent = "Running...";
      // let the label repaint before the (synchronous) sim
      setTimeout(function () {
        var checks = st.checks, runs = st.runs;
        var stepN = Math.max(1, Math.floor(nFinal / checks));
        var peekHits = 0, fixedHits = 0;
        for (var r = 0; r < runs; r++) {
          var cA = 0, cB = 0, nA = 0, nB = 0, everSig = false;
          for (var k = 0; k < checks; k++) {
            var add = (k === checks - 1) ? (nFinal - nA) : stepN;
            cA += binom(add, rate); nA += add;
            cB += binom(add, rate); nB += add;
            var p = twoPropP(cA, nA, cB, nB);
            if (p < 0.05) everSig = true;         // peeker would have stopped here
            if (k === checks - 1 && p < 0.05) fixedHits++; // disciplined: only the last look
          }
          if (everSig) peekHits++;
        }
        var peekRate = (100 * peekHits / runs);
        var fixedRate = (100 * fixedHits / runs);
        set(root, "peek", peekRate.toFixed(1) + "%");
        set(root, "fixed", fixedRate.toFixed(1) + "%");
        var bp = root.querySelector('[data-b="peek"]');
        var bf = root.querySelector('[data-b="fixed"]');
        if (bp) bp.style.width = Math.min(100, peekRate * 2) + "%";   // 50% = full bar
        if (bf) bf.style.width = Math.min(100, fixedRate * 2) + "%";
        set(root, "note", "Out of " + runs + " A/A tests with NO real difference, peeking " +
          checks + " times flagged a false winner " + peekRate.toFixed(1) +
          "% of the time - vs " + fixedRate.toFixed(1) +
          "% when you look only once at the pre-committed sample size. The nominal alpha is 5% (the dashed line). Every point above it is a false discovery peeking manufactured.");
        btn.disabled = false; btn.textContent = "Run again ▶";
      }, 30);
    });
  }

  function set(root, key, val) {
    var el = root.querySelector('[data-o="' + key + '"]');
    if (el) el.textContent = val;
  }

  /* ---------- styles (scoped, theme-aware via CSS vars) ---------- */
  function injectCss() {
    if (document.getElementById("xl-css")) return;
    var s = document.createElement("style");
    s.id = "xl-css";
    s.textContent =
      ".exp-live{border:1px solid var(--hairline);border-radius:16px;padding:1.4rem 1.5rem;margin:1.6rem 0;background:linear-gradient(180deg,var(--indigo-50),#fff);box-shadow:0 10px 30px rgba(79,70,229,.08)}" +
      ".xl-head{display:flex;align-items:baseline;gap:.6rem;flex-wrap:wrap;margin-bottom:1.1rem}" +
      ".xl-head b{font-size:1.15rem;color:var(--ink)}" +
      ".xl-badge{background:var(--amber);color:var(--amber-ink);font-weight:800;font-size:.7rem;padding:.15rem .55rem;border-radius:999px;letter-spacing:.03em}" +
      ".xl-sub{color:var(--muted);font-size:.85rem}" +
      ".xl-grid{display:grid;gap:.55rem;margin-bottom:1.1rem}" +
      ".xl-row{display:grid;grid-template-columns:15rem 1fr 4.5rem;align-items:center;gap:.8rem}" +
      ".xl-rl{color:var(--ink);font-weight:600;font-size:.9rem}" +
      ".xl-row input[type=range]{width:100%;accent-color:var(--indigo)}" +
      ".xl-row output{font-variant-numeric:tabular-nums;font-weight:700;color:var(--indigo);text-align:right}" +
      ".xl-out{display:flex;gap:.8rem;flex-wrap:wrap;margin:1rem 0 .4rem}" +
      ".xl-stat{flex:1;min-width:8rem;background:#fff;border:1px solid var(--hairline);border-radius:12px;padding:.9rem 1rem;text-align:center}" +
      ".xl-num{display:block;font-size:1.7rem;font-weight:800;color:var(--indigo);font-variant-numeric:tabular-nums;line-height:1.1}" +
      ".xl-lab{display:block;color:var(--muted);font-size:.78rem;margin-top:.25rem}" +
      ".xl-good .xl-num{color:var(--indigo)}.xl-bad .xl-num{color:#DC2626}" +
      ".xl-note{color:var(--muted);font-size:.85rem;margin-top:.5rem;line-height:1.6}" +
      ".xl-peek-ctrl{display:grid;gap:.55rem;margin-bottom:.4rem}" +
      ".xl-run{justify-self:start;margin-top:.4rem;background:var(--indigo);color:#fff;border:0;border-radius:999px;padding:.55rem 1.2rem;font-weight:700;font-size:.9rem;cursor:pointer}" +
      ".xl-run:hover{background:var(--indigo-deep)}.xl-run:disabled{opacity:.6;cursor:wait}" +
      ".xl-bars{position:relative;margin:.6rem 0 .2rem;padding-left:6.5rem}" +
      ".xl-barwrap{display:flex;align-items:center;gap:.6rem;margin:.35rem 0}" +
      ".xl-barwrap>span{position:absolute;left:0;width:6rem;text-align:right;font-size:.78rem;color:var(--muted);font-weight:600}" +
      ".xl-bar{position:relative;flex:1;height:1.1rem;background:var(--hairline);border-radius:999px;overflow:hidden}" +
      ".xl-bar i{display:block;height:100%;width:0;background:var(--indigo);border-radius:999px;transition:width .6s ease}" +
      ".xl-barbad i{background:#DC2626}" +
      ".xl-mark{position:absolute;left:calc(6.5rem + 10%);top:0;bottom:0;width:0;border-left:2px dashed var(--amber-ink)}" +
      "@media(max-width:640px){.xl-row{grid-template-columns:1fr;gap:.2rem}.xl-row output{text-align:left}}";
    document.head.appendChild(s);
  }

  function init() {
    var roots = document.querySelectorAll(".exp-live");
    if (!roots.length) return;
    injectCss();
    roots.forEach(function (root) {
      if (root.dataset.built) return;
      root.dataset.built = "1";
      if (root.dataset.tool === "peeking") buildPeeking(root);
      else buildPlanner(root);
    });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
