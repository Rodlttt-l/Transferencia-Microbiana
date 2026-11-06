/**
 * TRANSFERENCIA MICROBIANA VAGINAL EN EL PARTO
 * Motor de Simulación Matemática, Modelado Dinámico y Navegación de Módulos
 * Equipo de Trabajo: Rodrigo Lara, Mariana Salas Villanueva, Gonzalez Gutirriez Ivanna, Stefany Alessandra Castro Balboa
 * Carrera: Ingeniería Biomédica | Docente: Fuentes Castro Juan Ángel
 * Refinamiento Visual: Linear / Vercel Clinical Aesthetic & Emil Kowalski Principles
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize KaTeX Auto-Render with dollar delimiters
  function initKaTeX() {
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false
      });
    } else {
      setTimeout(initKaTeX, 100);
    }
  }
  initKaTeX();

  // ==========================================================================
  // VIEW ROUTING (HUB DE ENTRADA & 4 DIVISIONES)
  // ==========================================================================
  const validViews = ["hub", "teoria", "modelo3d", "practica", "documentos"];
  const siteHeader = document.querySelector(".site-header");

  function getRouteFromHash() {
    const hash = (window.location.hash || "").toLowerCase().replace("#", "");
    if (!hash || hash === "inicio" || hash === "menu" || hash === "hub") return "hub";
    if (validViews.includes(hash)) return hash;
    // Check if it's a section anchor inside teoria (e.g. #fundamento, #calculo, etc.)
    const sectionIds = ["fundamento", "calculo", "simulador", "biomedica", "evidencia"];
    if (sectionIds.includes(hash)) return "teoria";
    return "hub";
  }

  function navigateTo(route, updateHistory = true, targetSection = null) {
    const targetRoute = validViews.includes(route) ? route : "hub";

    // Toggle active view
    document.querySelectorAll(".app-view").forEach((view) => {
      if (view.id === `view-${targetRoute}`) {
        view.classList.add("active");
      } else {
        view.classList.remove("active");
      }
    });

    // Update site header state attribute for CSS-driven navigation switching
    if (siteHeader) {
      siteHeader.dataset.currentView = targetRoute;
    }

    // History and Hash Update
    if (updateHistory) {
      if (targetRoute === "hub") {
        if (window.location.hash) {
          history.pushState(null, "", window.location.pathname);
        }
      } else if (targetSection) {
        window.location.hash = targetSection;
      } else {
        window.location.hash = targetRoute;
      }
    }

    // Scroll positioning
    if (targetSection) {
      setTimeout(() => {
        const el = document.getElementById(targetSection);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 80);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // When entering Teoría, refresh canvas & formulas
    if (targetRoute === "teoria") {
      setTimeout(() => {
        resizeCanvas();
        syncInputs();
        updateDiffusionModel();
        if (window.renderMathInElement) {
          const teoriaEl = document.getElementById("view-teoria");
          if (teoriaEl) renderMathInElement(teoriaEl);
        }
      }, 70);
    }

    // When entering Práctica, refresh formulas & MICROTRACE lab
    if (targetRoute === "practica") {
      setTimeout(() => {
        if (typeof calculateModel1 === "function") {
          calculateModel1(false);
          calculateModel2(false);
          calculateModel3(false);
          calculateModel4(false);
        }
        if (window.renderMathInElement) {
          const practicaEl = document.getElementById("view-practica");
          if (practicaEl) renderMathInElement(practicaEl);
        }
      }, 70);
    }
  }

  // Listen to hash changes (browser back / forward navigation)
  window.addEventListener("hashchange", () => {
    const hash = (window.location.hash || "").toLowerCase().replace("#", "");
    const sectionIds = ["fundamento", "calculo", "simulador", "biomedica", "evidencia", "inicio"];
    if (sectionIds.includes(hash)) {
      navigateTo("teoria", false, hash);
    } else {
      const route = getRouteFromHash();
      navigateTo(route, false);
    }
  });

  // Intercept clicks on links pointing to hash routes
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href^='#']");
    if (!link) return;

    const href = link.getAttribute("href");
    const target = href.replace("#", "").toLowerCase();

    if (["hub", "teoria", "modelo3d", "practica", "documentos"].includes(target)) {
      e.preventDefault();
      navigateTo(target, true);
    } else if (["fundamento", "calculo", "simulador", "biomedica", "evidencia", "inicio"].includes(target)) {
      e.preventDefault();
      navigateTo("teoria", true, target);
    }
  });

  // Simulator State
  const state = {
    mode: "comparison", // 'colonization', 'rate', 'integral', 'comparison'
    scenario: "vaginal", // 'vaginal', 'cesarean', 'seeding'
    N0: 80000, // Initial inoculum (CFU/mL)
    r: 0.38,   // Growth rate (h^-1)
    K: 1000000, // Carrying capacity (CFU/mL)
    timeMax: 48, // hours
    hoverPoint: null,

    // Diffusion Model State
    diffTime: 5, // minutes of contact
    diffJ0: 12000, // initial transfer rate CFU/min
    diffKd: 0.22, // diffusion decay constant
  };

  // Canonical presets with refined clinical jewel tones
  const presets = {
    vaginal: {
      name: "Parto Vaginal Natural",
      N0: 95000,
      r: 0.38,
      K: 1000000,
      color: "#126353",
      glowColor: "rgba(18, 99, 83, 0.25)",
      description: "Transferencia directa por canal de parto. Colonización inmediata por Lactobacillus y Bifidobacterium."
    },
    cesarean: {
      name: "Cesárea Convencional",
      N0: 2500,
      r: 0.16,
      K: 550000,
      color: "#e11d48",
      glowColor: "rgba(225, 29, 72, 0.25)",
      description: "Ausencia de inóculo vaginal materno. Colonización retardada dominada por microbiota cutánea hospitalaria."
    },
    seeding: {
      name: "Cesárea + Siembra Vaginal (Vaginal Seeding)",
      N0: 65000,
      r: 0.34,
      K: 920000,
      color: "#d95f1e",
      glowColor: "rgba(217, 95, 30, 0.25)",
      description: "Intervención biomédica con apósito estéril normado. Restauración acelerada del microbioma neonatal fisiológico."
    }
  };

  // Helper: Hex color to RGBA string
  function hexToRgba(hex, alpha) {
    let c = hex.replace("#", "");
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // DOM Elements
  const canvas = document.getElementById("growthChart");
  const ctx = canvas ? canvas.getContext("2d") : null;

  const sliderN0 = document.getElementById("sliderN0");
  const sliderR = document.getElementById("sliderR");
  const sliderK = document.getElementById("sliderK");
  const sliderTime = document.getElementById("sliderTime");

  const valN0 = document.getElementById("valN0");
  const valR = document.getElementById("valR");
  const valK = document.getElementById("valK");
  const valTime = document.getElementById("valTime");

  const telemN = document.getElementById("telemN");
  const telemRate = document.getElementById("telemRate");
  const telemIntegral = document.getElementById("telemIntegral");
  const telemInflection = document.getElementById("telemInflection");

  const modeButtons = document.querySelectorAll(".mode-btn");
  const presetButtons = document.querySelectorAll(".preset-btn");

  // Biomaterial Diffusion Elements
  const sliderDiffTime = document.getElementById("sliderDiffTime");
  const sliderDiffJ0 = document.getElementById("sliderDiffJ0");
  const valDiffTime = document.getElementById("valDiffTime");
  const valDiffJ0 = document.getElementById("valDiffJ0");
  const telemDiffTransferred = document.getElementById("telemDiffTransferred");
  const telemDiffRate = document.getElementById("telemDiffRate");
  const diffProgressBar = document.getElementById("diffProgressBar");

  // Mathematical Functions
  // 1. Logistic Population Equation: N(t) = K / (1 + ((K - N0)/N0) * exp(-r * t))
  function calculateN(t, N0, r, K) {
    if (t <= 0) return N0;
    const A = (K - N0) / N0;
    return K / (1 + A * Math.exp(-r * t));
  }

  // 2. Instantaneous Differential Rate: dN/dt = r * N * (1 - N / K)
  function calculateDerivative(N, r, K) {
    return r * N * (1 - N / K);
  }

  // 3. Definite Integral: \int_0^T N(t) dt using composite trapezoidal rule
  function calculateIntegral(tMax, N0, r, K, steps = 100) {
    const dt = tMax / steps;
    let sum = 0.5 * (calculateN(0, N0, r, K) + calculateN(tMax, N0, r, K));
    for (let i = 1; i < steps; i++) {
      const t = i * dt;
      sum += calculateN(t, N0, r, K);
    }
    return sum * dt;
  }

  // 4. Inflection point (time of maximum growth rate): t* = ln((K - N0)/N0) / r
  function calculateInflectionTime(N0, r, K) {
    if (N0 >= K / 2) return 0; // already past inflection
    const A = (K - N0) / N0;
    return Math.log(A) / r;
  }

  // 5. Biomaterial Swab Transfer: M(t) = \int_0^t J0 * exp(-kd * tau) dtau
  function calculateDiffusionTransfer(t, J0, kd) {
    return (J0 / kd) * (1 - Math.exp(-kd * t));
  }

  // Canvas High-DPI Setup
  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    draw();
  }

  // Draw Chart with Linear-precision styling
  function draw() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (width <= 0 || height <= 0) return;

    ctx.clearRect(0, 0, width, height);

    const padding = { top: 32, right: 32, bottom: 48, left: 75 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    if (chartW <= 0 || chartH <= 0) return;

    const xTicks = 8;
    const yTicks = 5;

    // Draw Subtle Grid & Axes
    ctx.strokeStyle = "rgba(10, 18, 28, 0.05)";
    ctx.lineWidth = 1;

    // X Axis subtle ticks and gridlines
    for (let i = 0; i <= xTicks; i++) {
      const tVal = (state.timeMax / xTicks) * i;
      const x = padding.left + (chartW / xTicks) * i;

      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#5a6e80";
      ctx.font = "500 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${tVal.toFixed(0)}h`, x, height - padding.bottom + 19);
    }

    // Determine Y Range
    let yMax = 1200000;
    let yUnit = "CFU/mL";

    if (state.mode === "rate") {
      yMax = 120000; // dN/dt CFU/h
      yUnit = "CFU/h";
    } else if (state.mode === "integral") {
      yMax = state.K * state.timeMax * 1.05;
      yUnit = "CFU·h";
    }

    // Y Axis subtle ticks and gridlines
    for (let j = 0; j <= yTicks; j++) {
      const y = padding.top + (chartH / yTicks) * (yTicks - j);
      const val = (yMax / yTicks) * j;

      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#5a6e80";
      ctx.font = "500 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      let formattedVal = val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0));
      ctx.fillText(formattedVal, padding.left - 10, y + 4);
    }

    // Solid Axis baseline
    ctx.strokeStyle = "rgba(10, 18, 28, 0.1)";
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.stroke();

    // Axis Labels with clean typography
    ctx.fillStyle = "#09121d";
    ctx.font = "600 12px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Tiempo transcurrido desde el parto (horas)", padding.left + chartW / 2, height - 12);

    ctx.save();
    ctx.translate(18, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(state.mode === "rate" ? "Tasa Instantánea (dN/dt)" : (state.mode === "integral" ? "Inóculo Acumulado (Integral)" : "Densidad Microbiana (CFU/mL)"), 0, 0);
    ctx.restore();

    // Helper coordinate mapping
    function toCanvasX(t) {
      return padding.left + (t / state.timeMax) * chartW;
    }
    function toCanvasY(val) {
      return padding.top + chartH - (val / yMax) * chartH;
    }

    // Render Curves
    if (state.mode === "comparison") {
      // Draw all 3 scenarios
      Object.keys(presets).forEach((key) => {
        const p = presets[key];
        const isCurrentActive = key === state.scenario;
        renderCurve(p.N0, p.r, p.K, p.color, isCurrentActive ? 3.2 : 2.0, isCurrentActive);
      });
      drawLegend(padding, chartW);
    } else {
      // Draw active custom scenario with smooth area gradient
      let activeColor = presets[state.scenario] ? presets[state.scenario].color : "#126353";
      renderCurve(state.N0, state.r, state.K, activeColor, 3.2, true);
    }

    // Function to render single curve with gradient area
    function renderCurve(n0, r, k, color, lineWidth, fill) {
      const points = [];
      const samples = 120;
      for (let i = 0; i <= samples; i++) {
        const t = (state.timeMax / samples) * i;
        let yVal;
        if (state.mode === "rate") {
          const nVal = calculateN(t, n0, r, k);
          yVal = calculateDerivative(nVal, r, k);
        } else if (state.mode === "integral") {
          yVal = calculateIntegral(t, n0, r, k, 40);
        } else {
          yVal = calculateN(t, n0, r, k);
        }
        points.push({ x: toCanvasX(t), y: toCanvasY(yVal), t, val: yVal });
      }

      // Draw Natural Gradient Area Fill under curve
      if (fill && (state.mode === "colonization" || state.mode === "integral" || state.mode === "comparison")) {
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        gradient.addColorStop(0, hexToRgba(color, 0.16));
        gradient.addColorStop(0.7, hexToRgba(color, 0.05));
        gradient.addColorStop(1, hexToRgba(color, 0.00));

        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartH);
        points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Draw refined anti-aliased curve line with subtle ambient glow
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      if (fill) {
        ctx.shadowColor = hexToRgba(color, 0.28);
        ctx.shadowBlur = 6;
      }

      points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.restore();

      // Mark Inflection Point on colonization mode
      if (state.mode === "colonization" && fill) {
        const tInf = calculateInflectionTime(n0, r, k);
        if (tInf > 0 && tInf <= state.timeMax) {
          const nInf = k / 2;
          const px = toCanvasX(tInf);
          const py = toCanvasY(nInf);

          // Outer pulse ring
          ctx.beginPath();
          ctx.arc(px, py, 8, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(color, 0.18);
          ctx.fill();

          // Core point
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.fill();
          ctx.stroke();

          // Engineered Inflection Pill
          const pillText = `t* = ${tInf.toFixed(1)}h`;
          ctx.font = "600 11px 'JetBrains Mono', monospace";
          const pWidth = ctx.measureText(pillText).width;

          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = "rgba(10, 18, 28, 0.12)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(px + 10, py - 18, pWidth + 12, 20, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.textAlign = "left";
          ctx.fillText(pillText, px + 16, py - 4);
        }
      }
    }

    // Legend with Machined Pills
    function drawLegend(padding, chartW) {
      const legendX = padding.left + 16;
      const legendY = padding.top + 16;

      const items = [
        { label: "Parto Vaginal (Natural)", color: presets.vaginal.color },
        { label: "Cesárea Convencional", color: presets.cesarean.color },
        { label: "Cesárea + Siembra Vaginal", color: presets.seeding.color }
      ];

      items.forEach((item, idx) => {
        const y = legendY + idx * 22;
        
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.roundRect(legendX, y - 8, 12, 4, 2);
        ctx.fill();

        ctx.fillStyle = "#2b3947";
        ctx.font = "500 11.5px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(item.label, legendX + 20, y - 4);
      });
    }

    // Crosshair & Linear-Tier Glass Tooltip
    if (state.hoverPoint) {
      const hx = state.hoverPoint.x;
      if (hx >= padding.left && hx <= width - padding.right) {
        const tHover = ((hx - padding.left) / chartW) * state.timeMax;
        const currentN = calculateN(tHover, state.N0, state.r, state.K);
        let displayVal = currentN;
        if (state.mode === "rate") displayVal = calculateDerivative(currentN, state.r, state.K);
        else if (state.mode === "integral") displayVal = calculateIntegral(tHover, state.N0, state.r, state.K);

        const hy = toCanvasY(displayVal);

        // Dashed reticle crosshair
        ctx.strokeStyle = "rgba(10, 18, 28, 0.22)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(hx, padding.top);
        ctx.lineTo(hx, height - padding.bottom);
        ctx.moveTo(padding.left, hy);
        ctx.lineTo(width - padding.right, hy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Hover Intersection Point
        ctx.beginPath();
        ctx.arc(hx, hy, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#09121d";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Dark Linear-style Tooltip Capsule
        const tooltipTime = `${tHover.toFixed(1)}h`;
        const tooltipValue = `${Math.round(displayVal).toLocaleString()} ${yUnit}`;
        const tooltipText = `t: ${tooltipTime}  |  ${tooltipValue}`;
        ctx.font = "500 11px 'JetBrains Mono', monospace";
        const textWidth = ctx.measureText(tooltipText).width;
        const boxX = Math.min(Math.max(hx - textWidth / 2 - 10, padding.left), width - padding.right - textWidth - 20);
        const boxY = Math.max(hy - 36, padding.top + 4);

        // Capsule background with subtle border
        ctx.fillStyle = "#09121d";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, textWidth + 20, 26, 6);
        ctx.fill();
        ctx.stroke();

        // Capsule text
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.fillText(tooltipText, boxX + 10, boxY + 17);
      }
    }
  }

  // Update Telemetry Indicators
  function updateTelemetry() {
    if (!telemN || !telemRate || !telemIntegral || !telemInflection) return;
    const finalN = calculateN(state.timeMax, state.N0, state.r, state.K);
    const finalRate = calculateDerivative(finalN, state.r, state.K);
    const totalIntegral = calculateIntegral(state.timeMax, state.N0, state.r, state.K);
    const tInf = calculateInflectionTime(state.N0, state.r, state.K);

    telemN.textContent = `${Math.round(finalN).toLocaleString()} CFU`;
    telemRate.textContent = `${Math.round(finalRate).toLocaleString()} CFU/h`;
    telemIntegral.textContent = `${(totalIntegral / 1000000).toFixed(2)} M·h`;
    telemInflection.textContent = tInf > 0 && tInf <= state.timeMax ? `${tInf.toFixed(1)} h` : "Inmediato";
  }

  // Update Biomaterial Diffusion Telemetry
  function updateDiffusionModel() {
    if (!valDiffTime || !valDiffJ0 || !telemDiffTransferred || !telemDiffRate) return;
    const transferred = calculateDiffusionTransfer(state.diffTime, state.diffJ0, state.diffKd);
    const instantRate = state.diffJ0 * Math.exp(-state.diffKd * state.diffTime);
    const saturation = (transferred / (state.diffJ0 / state.diffKd)) * 100;

    valDiffTime.textContent = `${state.diffTime} min`;
    valDiffJ0.textContent = `${state.diffJ0.toLocaleString()} CFU/min`;
    telemDiffTransferred.textContent = `${Math.round(transferred).toLocaleString()} CFU`;
    telemDiffRate.textContent = `${Math.round(instantRate).toLocaleString()} CFU/min`;

    if (diffProgressBar) {
      diffProgressBar.style.width = `${Math.min(saturation, 100).toFixed(1)}%`;
    }
  }

  // Synchronize Controls with State
  function syncInputs() {
    if (sliderN0) sliderN0.value = state.N0;
    if (sliderR) sliderR.value = state.r;
    if (sliderK) sliderK.value = state.K;
    if (sliderTime) sliderTime.value = state.timeMax;

    if (valN0) valN0.textContent = `${Number(state.N0).toLocaleString()} CFU`;
    if (valR) valR.textContent = `${Number(state.r).toFixed(2)} h⁻¹`;
    if (valK) valK.textContent = `${(state.K / 1000000).toFixed(1)}M CFU`;
    if (valTime) valTime.textContent = `${state.timeMax} h`;

    updateTelemetry();
    draw();
  }

  // Event Listeners for Sliders with Natural Precision
  if (sliderN0) {
    sliderN0.addEventListener("input", (e) => {
      state.N0 = parseFloat(e.target.value);
      syncInputs();
    });
  }
  if (sliderR) {
    sliderR.addEventListener("input", (e) => {
      state.r = parseFloat(e.target.value);
      syncInputs();
    });
  }
  if (sliderK) {
    sliderK.addEventListener("input", (e) => {
      state.K = parseFloat(e.target.value);
      syncInputs();
    });
  }
  if (sliderTime) {
    sliderTime.addEventListener("input", (e) => {
      state.timeMax = parseFloat(e.target.value);
      syncInputs();
    });
  }

  // Biomaterial Diffusion Sliders
  if (sliderDiffTime && sliderDiffJ0) {
    sliderDiffTime.addEventListener("input", (e) => {
      state.diffTime = parseFloat(e.target.value);
      updateDiffusionModel();
    });
    sliderDiffJ0.addEventListener("input", (e) => {
      state.diffJ0 = parseFloat(e.target.value);
      updateDiffusionModel();
    });
  }

  // Presets Buttons
  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      presetButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const key = btn.dataset.preset;
      if (presets[key]) {
        state.scenario = key;
        state.N0 = presets[key].N0;
        state.r = presets[key].r;
        state.K = presets[key].K;
        syncInputs();
      }
    });
  });

  // Mode Buttons
  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.mode = btn.dataset.mode;
      draw();
    });
  });

  // Hover / Touch Crosshair on Canvas
  if (canvas) {
    function updateCrosshairFromCoords(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      state.hoverPoint = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
      draw();
    }

    canvas.addEventListener("mousemove", (e) => {
      updateCrosshairFromCoords(e.clientX, e.clientY);
    });

    canvas.addEventListener("mouseleave", () => {
      state.hoverPoint = null;
      draw();
    });

    // Touch Support for Phones and Tablets
    canvas.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches.length > 0) {
        updateCrosshairFromCoords(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    canvas.addEventListener("touchmove", (e) => {
      if (e.touches && e.touches.length > 0) {
        updateCrosshairFromCoords(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    canvas.addEventListener("touchend", () => {
      state.hoverPoint = null;
      draw();
    });
  }

  // Print buttons (Desktop & Mobile)
  const printBtn = document.getElementById("printBtn");
  const printBtnMobile = document.getElementById("printBtnMobile");
  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }
  if (printBtnMobile) {
    printBtnMobile.addEventListener("click", () => window.print());
  }

  // ==========================================================================
  // MICROTRACE VIRTUAL LABORATORY ENGINE (MODELS 1 - 4, WORKFLOW & LOG)
  // ==========================================================================

  // Session Log State
  const sessionLog = [];

  // Model 3 Demo Species Catalog
  const m3SpeciesCatalog = [
    { id: "A", name: "Lactobacillus crispatus", tag: "Comensal protector" },
    { id: "B", name: "Lactobacillus iners", tag: "Especie transicional" },
    { id: "C", name: "Lactobacillus jensenii", tag: "Acidófilo protector" },
    { id: "D", name: "Lactobacillus gasseri", tag: "Productor de bacteriocinas" },
    { id: "E", name: "Bifidobacterium breve", tag: "Colonizador perinatal" },
    { id: "F", name: "Prevotella bivia", tag: "Anaerobio estricto" },
    { id: "G", name: "Gardnerella vaginalis", tag: "Asociado a disbiosis" },
    { id: "H", name: "Staphylococcus epidermidis", tag: "Comensal cutáneo" }
  ];

  // Default Jaccard Selections: Maternal (A, B, C, D, E), Neonatal (B, C, E, F)
  let m3MaternalSelected = new Set(["A", "B", "C", "D", "E"]);
  let m3NeonatalSelected = new Set(["B", "C", "E", "F"]);

  // Model 4 Shannon Species Data
  let shannonSpeciesData = [
    { id: 1, name: "Lactobacillus crispatus", count: 450 },
    { id: 2, name: "Lactobacillus iners", count: 250 },
    { id: 3, name: "Lactobacillus jensenii", count: 180 },
    { id: 4, name: "Bifidobacterium breve", count: 120 }
  ];

  // Colors for charts
  const palette = ["#0f766e", "#14b8a6", "#0284c7", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6", "#10b981"];

  // --------------------------------------------------------------------------
  // 1. TABS CONTROLLER (Linear / Vercel Segmented Switcher)
  // --------------------------------------------------------------------------
  function initLabTabs() {
    const tabBtns = document.querySelectorAll(".lab-tab-btn");
    const container = document.getElementById("labModelsContainer");

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const modelTarget = btn.getAttribute("data-model");

        tabBtns.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        if (modelTarget === "all") {
          if (container) container.classList.add("grid-layout");
          document.querySelectorAll(".lab-model-view").forEach((view) => {
            view.classList.add("active");
          });
        } else {
          if (container) container.classList.remove("grid-layout");
          document.querySelectorAll(".lab-model-view").forEach((view) => {
            if (view.id === `modelView${modelTarget}`) {
              view.classList.add("active");
            } else {
              view.classList.remove("active");
            }
          });
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 2. MODEL 1: CUANTIFICACIÓN DE LA CARGA MICROBIANA (C = N * FD / V)
  // --------------------------------------------------------------------------
  function calculateModel1(shouldLog = false) {
    const inputN = document.getElementById("inputM1Colonias");
    const inputFD = document.getElementById("inputM1FD");
    const inputV = document.getElementById("inputM1Vol");
    const errorBox = document.getElementById("m1ValidationError");
    const resultValEl = document.getElementById("m1ResultVal");
    const procListEl = document.getElementById("m1ProcedureList");
    const interpEl = document.getElementById("m1InterpretationBox");

    if (!inputN || !inputFD || !inputV) return;

    const N = parseFloat(inputN.value);
    const FD = parseFloat(inputFD.value);
    const V = parseFloat(inputV.value);

    // Strict validation: N >= 0, FD > 0, V > 0
    if (isNaN(N) || N < 0 || isNaN(FD) || FD <= 0 || isNaN(V) || V <= 0) {
      if (errorBox) errorBox.style.display = "block";
      if (resultValEl) resultValEl.textContent = "Error";
      return;
    }

    if (errorBox) errorBox.style.display = "none";

    const product = N * FD;
    const C = product / V;
    const formattedC = Math.round(C).toLocaleString("es-MX");

    if (resultValEl) {
      resultValEl.textContent = formattedC;
    }

    // Mathematical Procedure Step by Step
    if (procListEl) {
      procListEl.innerHTML = `
        <li class="lab-procedure-step">
          <span class="lab-step-num">1</span>
          <span class="lab-step-text">Sustitución en la fórmula: <code>C = (${N.toLocaleString()} × ${FD.toLocaleString()}) / ${V}</code></span>
        </li>
        <li class="lab-procedure-step">
          <span class="lab-step-num">2</span>
          <span class="lab-step-text">Producto de colonias por factor: <code>${N.toLocaleString()} × ${FD.toLocaleString()} = ${product.toLocaleString()} UFC</code></span>
        </li>
        <li class="lab-procedure-step">
          <span class="lab-step-num">3</span>
          <span class="lab-step-text">División por alícuota sembrada: <code>${product.toLocaleString()} / ${V} = ${formattedC} UFC/mL</code></span>
        </li>
      `;
    }

    // Clinical Interpretation based on concentration range
    if (interpEl) {
      let tierDesc = "";
      if (C < 10000) {
        tierDesc = "Carga microbiana baja (&lt; 10,000 UFC/mL), habitual en estadios tempranos de colonización o muestras con dilución alta.";
      } else if (C <= 100000) {
        tierDesc = "Carga microbiana fisiológica-moderada (10,000 – 100,000 UFC/mL), representativa de una microbiota vaginal protectora normotípica.";
      } else {
        tierDesc = "Carga microbiana elevada (&gt; 100,000 UFC/mL), representativa de alta densidad biológica o sobrecrecimiento bacteriano en cavidad.";
      }
      interpEl.innerHTML = `
        <strong>Significado clínico:</strong> La muestra presenta una carga calculada de <strong>${formattedC} UFC/mL</strong>. ${tierDesc}
      `;
    }

    // Render SVG Bar Chart
    renderModel1Chart(C);

    if (shouldLog) {
      addSessionLogEntry(
        "Modelo 1 (Carga Microbiana)",
        `N=${N}, FD=${FD}, V=${V} mL`,
        formattedC,
        "UFC/mL",
        "Válido"
      );
    }
  }

  function renderModel1Chart(C) {
    const svg = document.getElementById("m1ChartSvg");
    if (!svg) return;

    // Logarithmic scale mapping: 100 -> 0px, 10,000,000 -> 380px
    const minVal = 100;
    const maxVal = 10000000;
    const logMin = Math.log10(minVal);
    const logMax = Math.log10(maxVal);
    const currentValClamped = Math.max(minVal, Math.min(maxVal, C));
    const logCurrent = Math.log10(currentValClamped);

    const chartWidth = 380;
    const chartHeight = 110;
    const barY = 45;
    const barHeight = 28;
    const startX = 30;

    const currentX = startX + ((logCurrent - logMin) / (logMax - logMin)) * chartWidth;
    const marker10k = startX + ((Math.log10(10000) - logMin) / (logMax - logMin)) * chartWidth;
    const marker100k = startX + ((Math.log10(100000) - logMin) / (logMax - logMin)) * chartWidth;

    svg.innerHTML = `
      <defs>
        <linearGradient id="m1BarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#14b8a6"/>
          <stop offset="100%" stop-color="#0f766e"/>
        </linearGradient>
      </defs>

      <!-- Background Tiers -->
      <rect x="${startX}" y="${barY}" width="${marker10k - startX}" height="${barHeight}" fill="#f1f5f9" rx="4"/>
      <rect x="${marker10k}" y="${barY}" width="${marker100k - marker10k}" height="${barHeight}" fill="#e6f4ea" rx="0"/>
      <rect x="${marker100k}" y="${barY}" width="${startX + chartWidth - marker100k}" height="${barHeight}" fill="#fef3c7" rx="4"/>

      <!-- Value Bar Fill -->
      <rect x="${startX}" y="${barY}" width="${Math.max(4, currentX - startX)}" height="${barHeight}" fill="url(#m1BarGrad)" rx="4"/>

      <!-- Reference Tier Dividers & Labels -->
      <line x1="${marker10k}" y1="${barY - 8}" x2="${marker10k}" y2="${barY + barHeight + 8}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="${marker10k}" y="${barY - 12}" font-size="10" font-family="monospace" fill="#64748b" text-anchor="middle">10⁴</text>

      <line x1="${marker100k}" y1="${barY - 8}" x2="${marker100k}" y2="${barY + barHeight + 8}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="${marker100k}" y="${barY - 12}" font-size="10" font-family="monospace" fill="#64748b" text-anchor="middle">10⁵</text>

      <!-- Axis Extremes -->
      <text x="${startX}" y="${barY + barHeight + 20}" font-size="10" font-family="monospace" fill="#94a3b8" text-anchor="start">10² UFC/mL</text>
      <text x="${startX + chartWidth}" y="${barY + barHeight + 20}" font-size="10" font-family="monospace" fill="#94a3b8" text-anchor="end">10⁷ UFC/mL</text>

      <!-- Current Value Pin -->
      <circle cx="${currentX}" cy="${barY + barHeight / 2}" r="7" fill="#ffffff" stroke="#0f766e" stroke-width="3"/>
      <text x="${currentX}" y="${barY + barHeight + 36}" font-size="11" font-family="monospace" font-weight="bold" fill="#0f766e" text-anchor="middle">
        ${Math.round(C).toLocaleString("es-MX")} UFC/mL
      </text>
    `;
  }

  // --------------------------------------------------------------------------
  // 3. MODEL 2: COMPARACIÓN MATERNO-NEONATAL (R = Cn / Cm * 100)
  // --------------------------------------------------------------------------
  function calculateModel2(shouldLog = false) {
    const inputCm = document.getElementById("inputM2Cm");
    const inputCn = document.getElementById("inputM2Cn");
    const errorBox = document.getElementById("m2ValidationError");
    const resultValEl = document.getElementById("m2ResultVal");
    const procListEl = document.getElementById("m2ProcedureList");
    const interpEl = document.getElementById("m2InterpretationBox");
    const legendEl = document.getElementById("m2ChartLegend");

    if (!inputCm || !inputCn) return;

    const Cm = parseFloat(inputCm.value);
    const Cn = parseFloat(inputCn.value);

    // Validation: Cm > 0, Cn >= 0
    if (isNaN(Cm) || Cm <= 0 || isNaN(Cn) || Cn < 0) {
      if (errorBox) errorBox.style.display = "block";
      if (resultValEl) resultValEl.textContent = "Error";
      return;
    }

    if (errorBox) errorBox.style.display = "none";

    const ratio = (Cn / Cm) * 100;
    const formattedR = ratio % 1 === 0 ? ratio.toFixed(0) : ratio.toFixed(1);

    if (resultValEl) {
      resultValEl.textContent = formattedR;
    }

    if (legendEl) {
      legendEl.textContent = `Cm = ${Cm.toLocaleString()} | Cn = ${Cn.toLocaleString()} UFC/mL`;
    }

    // Mathematical Procedure Step by Step
    if (procListEl) {
      procListEl.innerHTML = `
        <li class="lab-procedure-step">
          <span class="lab-step-num">1</span>
          <span class="lab-step-text">Sustitución en la fórmula: <code>R = (${Cn.toLocaleString()} / ${Cm.toLocaleString()}) × 100</code></span>
        </li>
        <li class="lab-procedure-step">
          <span class="lab-step-num">2</span>
          <span class="lab-step-text">Cociente de concentraciones: <code>${Cn.toLocaleString()} / ${Cm.toLocaleString()} = ${(Cn / Cm).toFixed(4)}</code></span>
        </li>
        <li class="lab-procedure-step">
          <span class="lab-step-num">3</span>
          <span class="lab-step-text">Conversión porcentual: <code>${(Cn / Cm).toFixed(4)} × 100 = ${formattedR}%</code></span>
        </li>
      `;
    }

    // Interpretation
    if (interpEl) {
      interpEl.innerHTML = `
        <strong>Interpretación automática:</strong> La concentración neonatal representa el <strong>${formattedR}%</strong> de la carga materna de referencia.
        <em style="display: block; margin-top: 0.35rem; color: var(--ink-secondary);">
          Este porcentaje representa una razón matemática entre concentraciones comparadas, no una demostración de que el ${formattedR}% de las bacterias hayan sido transferidas físicamente desde la madre al recién nacido.
        </em>
      `;
    }

    // Render Dual Bar Chart
    renderModel2Chart(Cm, Cn, ratio);

    if (shouldLog) {
      addSessionLogEntry(
        "Modelo 2 (Razón Materno-Neonatal)",
        `Cm=${Cm.toLocaleString()}, Cn=${Cn.toLocaleString()}`,
        formattedR,
        "%",
        "Válido"
      );
    }
  }

  function renderModel2Chart(Cm, Cn, ratio) {
    const svg = document.getElementById("m2ChartSvg");
    if (!svg) return;

    const maxVal = Math.max(Cm, Cn, 1);
    const chartHeight = 90;
    const baseY = 110;

    const barWidth = 100;
    const maternalX = 80;
    const neonatalX = 260;

    const hMaternal = Math.max(8, (Cm / maxVal) * chartHeight);
    const hNeonatal = Math.max(8, (Cn / maxVal) * chartHeight);

    const yMaternal = baseY - hMaternal;
    const yNeonatal = baseY - hNeonatal;

    svg.innerHTML = `
      <defs>
        <linearGradient id="matGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#115e59"/>
          <stop offset="100%" stop-color="#0f766e"/>
        </linearGradient>
        <linearGradient id="neoGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#10b981"/>
          <stop offset="100%" stop-color="#059669"/>
        </linearGradient>
      </defs>

      <!-- Baseline -->
      <line x1="30" y1="${baseY}" x2="410" y2="${baseY}" stroke="#cbd5e1" stroke-width="1.5"/>

      <!-- Maternal Bar -->
      <rect x="${maternalX}" y="${yMaternal}" width="${barWidth}" height="${hMaternal}" fill="url(#matGrad)" rx="6"/>
      <text x="${maternalX + barWidth / 2}" y="${yMaternal - 8}" font-size="11" font-family="monospace" font-weight="bold" fill="#0f766e" text-anchor="middle">
        ${Cm.toLocaleString()} UFC/mL
      </text>
      <text x="${maternalX + barWidth / 2}" y="${baseY + 18}" font-size="12" font-family="sans-serif" font-weight="600" fill="#334155" text-anchor="middle">
        Madre (Cm)
      </text>

      <!-- Neonatal Bar -->
      <rect x="${neonatalX}" y="${yNeonatal}" width="${barWidth}" height="${hNeonatal}" fill="url(#neoGrad)" rx="6"/>
      <text x="${neonatalX + barWidth / 2}" y="${yNeonatal - 8}" font-size="11" font-family="monospace" font-weight="bold" fill="#059669" text-anchor="middle">
        ${Cn.toLocaleString()} UFC/mL
      </text>
      <text x="${neonatalX + barWidth / 2}" y="${baseY + 18}" font-size="12" font-family="sans-serif" font-weight="600" fill="#334155" text-anchor="middle">
        Neonato (Cn)
      </text>

      <!-- Comparison Arc & Ratio Badge -->
      <path d="M ${maternalX + barWidth} ${yMaternal + 15} C 210 ${Math.min(yMaternal, yNeonatal) - 20}, 230 ${Math.min(yMaternal, yNeonatal) - 20}, ${neonatalX} ${yNeonatal + 15}" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="4,4"/>
      <rect x="180" y="${Math.min(yMaternal, yNeonatal) - 34}" width="80" height="22" rx="11" fill="#0ea5e9"/>
      <text x="220" y="${Math.min(yMaternal, yNeonatal) - 19}" font-size="11" font-family="monospace" font-weight="bold" fill="#ffffff" text-anchor="middle">
        R = ${(ratio % 1 === 0 ? ratio.toFixed(0) : ratio.toFixed(1))}%
      </text>
    `;
  }

  // --------------------------------------------------------------------------
  // 4. MODEL 3: SIMILITUD DE PERFILES (ÍNDICE DE JACCARD)
  // --------------------------------------------------------------------------
  function initModel3Checkboxes() {
    const listMaternal = document.getElementById("m3ListMaternal");
    const listNeonatal = document.getElementById("m3ListNeonatal");

    if (!listMaternal || !listNeonatal) return;

    listMaternal.innerHTML = "";
    listNeonatal.innerHTML = "";

    m3SpeciesCatalog.forEach((item) => {
      // Maternal checkbox
      const matChecked = m3MaternalSelected.has(item.id) ? "checked" : "";
      const matEl = document.createElement("label");
      matEl.className = "jaccard-check-item";
      matEl.innerHTML = `
        <input type="checkbox" data-sample="maternal" data-id="${item.id}" ${matChecked}>
        <span class="check-label"><em>${item.name}</em></span>
        <span class="check-label-tag">${item.id}</span>
      `;
      listMaternal.appendChild(matEl);

      // Neonatal checkbox
      const neoChecked = m3NeonatalSelected.has(item.id) ? "checked" : "";
      const neoEl = document.createElement("label");
      neoEl.className = "jaccard-check-item";
      neoEl.innerHTML = `
        <input type="checkbox" data-sample="neonatal" data-id="${item.id}" ${neoChecked}>
        <span class="check-label"><em>${item.name}</em></span>
        <span class="check-label-tag">${item.id}</span>
      `;
      listNeonatal.appendChild(neoEl);
    });

    // Event listeners
    listMaternal.querySelectorAll("input").forEach((chk) => {
      chk.addEventListener("change", (e) => {
        const id = e.target.getAttribute("data-id");
        if (e.target.checked) m3MaternalSelected.add(id);
        else m3MaternalSelected.delete(id);
        calculateModel3(false);
      });
    });

    listNeonatal.querySelectorAll("input").forEach((chk) => {
      chk.addEventListener("change", (e) => {
        const id = e.target.getAttribute("data-id");
        if (e.target.checked) m3NeonatalSelected.add(id);
        else m3NeonatalSelected.delete(id);
        calculateModel3(false);
      });
    });
  }

  function calculateModel3(shouldLog = false) {
    const resultValEl = document.getElementById("m3ResultVal");
    const badgeA = document.getElementById("m3BadgeA");
    const badgeB = document.getElementById("m3BadgeB");
    const textA = document.getElementById("m3TextCountA");
    const textB = document.getElementById("m3TextCountB");
    const textShared = document.getElementById("m3TextShared");
    const textUnion = document.getElementById("m3TextUnion");
    const procListEl = document.getElementById("m3ProcedureList");
    const chipsCont = document.getElementById("m3ChipsContainer");
    const interpEl = document.getElementById("m3InterpretationBox");

    const setA = m3MaternalSelected;
    const setB = m3NeonatalSelected;

    const countA = setA.size;
    const countB = setB.size;

    // Intersection (A ∩ B)
    const sharedIds = [...setA].filter((id) => setB.has(id));
    const countShared = sharedIds.length;

    // Union (A ∪ B)
    const unionIds = new Set([...setA, ...setB]);
    const countUnion = unionIds.size;

    // Jaccard Index J = (|A ∩ B| / |A ∪ B|) * 100
    const J = countUnion > 0 ? (countShared / countUnion) * 100 : 0;
    const formattedJ = J % 1 === 0 ? J.toFixed(0) : J.toFixed(1);

    if (resultValEl) resultValEl.textContent = formattedJ;
    if (badgeA) badgeA.textContent = `${countA} seleccionadas`;
    if (badgeB) badgeB.textContent = `${countB} seleccionadas`;

    if (textA) textA.textContent = `|A| = ${countA}`;
    if (textB) textB.textContent = `|B| = ${countB}`;
    if (textShared) textShared.textContent = `|A ∩ B| = ${countShared}`;
    if (textUnion) textUnion.textContent = `|A ∪ B| = ${countUnion}`;

    // Procedure steps
    if (procListEl) {
      procListEl.innerHTML = `
        <li class="lab-procedure-step">
          <span class="lab-step-num">1</span>
          <span class="lab-step-text">Microorganismos maternos: <code>|A| = ${countA}</code></span>
        </li>
        <li class="lab-procedure-step">
          <span class="lab-step-num">2</span>
          <span class="lab-step-text">Microorganismos neonatales: <code>|B| = ${countB}</code></span>
        </li>
        <li class="lab-procedure-step">
          <span class="lab-step-num">3</span>
          <span class="lab-step-text">Microorganismos compartidos: <code>|A ∩ B| = ${countShared} (${sharedIds.join(", ") || "ninguno"})</code></span>
        </li>
        <li class="lab-procedure-step">
          <span class="lab-step-num">4</span>
          <span class="lab-step-text">Total distintos en ambas muestras: <code>|A ∪ B| = ${countUnion}</code></span>
        </li>
        <li class="lab-procedure-step">
          <span class="lab-step-num">5</span>
          <span class="lab-step-text">Índice de Jaccard: <code>(${countShared} / ${countUnion}) × 100 = ${formattedJ}%</code></span>
        </li>
      `;
    }

    // Venn Diagram rendering
    renderModel3Venn(countShared, countA - countShared, countB - countShared, formattedJ);

    // Render chips
    if (chipsCont) {
      chipsCont.innerHTML = "";
      m3SpeciesCatalog.forEach((sp) => {
        const inA = setA.has(sp.id);
        const inB = setB.has(sp.id);
        if (!inA && !inB) return;

        const chip = document.createElement("span");
        if (inA && inB) {
          chip.className = "venn-chip shared";
          chip.innerHTML = `✓ ${sp.id}: <em>${sp.name}</em> (Compartido)`;
        } else if (inA) {
          chip.className = "venn-chip maternal";
          chip.innerHTML = `• ${sp.id}: <em>${sp.name}</em> (Materno)`;
        } else {
          chip.className = "venn-chip neonatal";
          chip.innerHTML = `• ${sp.id}: <em>${sp.name}</em> (Neonatal)`;
        }
        chipsCont.appendChild(chip);
      });
    }

    // Interpretation
    if (interpEl) {
      let degree = "";
      if (J === 0) degree = "nula similitud (sin especies compartidas)";
      else if (J < 35) degree = "similitud baja en composición comunitaria";
      else if (J <= 65) degree = "similitud taxonómica moderada-alta";
      else degree = "muy alta concordancia en especies detectadas";

      interpEl.innerHTML = `
        <strong>Interpretación automática:</strong> El índice de Jaccard del <strong>${formattedJ}%</strong> indica una <strong>${degree}</strong> entre ambas muestras.
        <em style="display: block; margin-top: 0.35rem; color: var(--ink-secondary);">
          Compartir especies no demuestra por sí solo transferencia directa, causalidad ni identidad de cepas. Para probar transmisión materna se requeriría análisis metagenómico de alta cobertura o secuenciación de variantes alélicas clonales.
        </em>
      `;
    }

    if (shouldLog) {
      addSessionLogEntry(
        "Modelo 3 (Similitud Jaccard)",
        `|A|=${countA}, |B|=${countB}, |A∩B|=${countShared}, |A∪B|=${countUnion}`,
        formattedJ,
        "%",
        "Válido"
      );
    }
  }

  function renderModel3Venn(sharedCount, matExclusiveCount, neoExclusiveCount, JFormatted) {
    const svg = document.getElementById("m3VennSvg");
    if (!svg) return;

    svg.innerHTML = `
      <defs>
        <radialGradient id="matVennGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ccfbf1"/>
          <stop offset="100%" stop-color="#99f6e4"/>
        </radialGradient>
        <radialGradient id="neoVennGrad" cx="70%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fef3c7"/>
          <stop offset="100%" stop-color="#fde68a"/>
        </radialGradient>
      </defs>

      <!-- Maternal Circle -->
      <circle cx="140" cy="85" r="65" fill="url(#matVennGrad)" fill-opacity="0.65" stroke="#0f766e" stroke-width="2"/>

      <!-- Neonatal Circle -->
      <circle cx="240" cy="85" r="65" fill="url(#neoVennGrad)" fill-opacity="0.65" stroke="#d97706" stroke-width="2"/>

      <!-- Labels inside regions -->
      <!-- Maternal Exclusive -->
      <text x="105" y="80" font-size="16" font-family="monospace" font-weight="bold" fill="#0f766e" text-anchor="middle">
        ${matExclusiveCount}
      </text>
      <text x="105" y="98" font-size="10" font-family="sans-serif" fill="#475569" text-anchor="middle">
        Exclusivas (A)
      </text>

      <!-- Shared Intersection -->
      <text x="190" y="80" font-size="20" font-family="monospace" font-weight="bold" fill="#065f46" text-anchor="middle">
        ${sharedCount}
      </text>
      <text x="190" y="98" font-size="10" font-family="sans-serif" font-weight="bold" fill="#065f46" text-anchor="middle">
        Compartidas
      </text>

      <!-- Neonatal Exclusive -->
      <text x="275" y="80" font-size="16" font-family="monospace" font-weight="bold" fill="#b45309" text-anchor="middle">
        ${neoExclusiveCount}
      </text>
      <text x="275" y="98" font-size="10" font-family="sans-serif" fill="#475569" text-anchor="middle">
        Exclusivas (B)
      </text>

      <!-- Top Titles -->
      <text x="140" y="16" font-size="11" font-family="sans-serif" font-weight="600" fill="#0f766e" text-anchor="middle">
        Muestra Materna
      </text>
      <text x="240" y="16" font-size="11" font-family="sans-serif" font-weight="600" fill="#d97706" text-anchor="middle">
        Muestra Neonatal
      </text>

      <!-- Jaccard Bottom Badge -->
      <rect x="130" y="152" width="120" height="22" rx="11" fill="#0f766e"/>
      <text x="190" y="167" font-size="11" font-family="monospace" font-weight="bold" fill="#ffffff" text-anchor="middle">
        J = ${JFormatted}%
      </text>
    `;
  }

  // --------------------------------------------------------------------------
  // 5. MODEL 4: DIVERSIDAD MICROBIANA (SHANNON H = -SUM(pi * ln(pi)))
  // --------------------------------------------------------------------------
  function renderShannonInputs() {
    const tbody = document.getElementById("shannonTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    shannonSpeciesData.forEach((sp, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <input type="text" class="shannon-species-input" data-id="${sp.id}" value="${sp.name}">
        </td>
        <td>
          <input type="number" class="shannon-count-input" data-id="${sp.id}" value="${sp.count}" min="0" step="1">
        </td>
        <td style="text-align: center;">
          <button type="button" class="shannon-del-btn" data-id="${sp.id}" title="Eliminar especie">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Inputs event listeners
    tbody.querySelectorAll(".shannon-species-input").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        const id = parseInt(e.target.getAttribute("data-id"));
        const item = shannonSpeciesData.find((x) => x.id === id);
        if (item) item.name = e.target.value;
      });
    });

    tbody.querySelectorAll(".shannon-count-input").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        const id = parseInt(e.target.getAttribute("data-id"));
        const item = shannonSpeciesData.find((x) => x.id === id);
        if (item) {
          item.count = Math.max(0, parseFloat(e.target.value) || 0);
          calculateModel4(false);
        }
      });
    });

    tbody.querySelectorAll(".shannon-del-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(btn.getAttribute("data-id"));
        if (shannonSpeciesData.length <= 1) {
          alert("Debe conservarse al menos una especie en la lista.");
          return;
        }
        shannonSpeciesData = shannonSpeciesData.filter((x) => x.id !== id);
        renderShannonInputs();
        calculateModel4(false);
      });
    });
  }

  function calculateModel4(shouldLog = false) {
    const resultValEl = document.getElementById("m4ResultVal");
    const countHeaderEl = document.getElementById("m4HeaderSpeciesCount");
    const breakdownBody = document.getElementById("shannonBreakdownBody");
    const totalCountCell = document.getElementById("m4TotalCountCell");
    const sumHCell = document.getElementById("m4SumHCell");
    const interpEl = document.getElementById("m4InterpretationBox");

    const totalCount = shannonSpeciesData.reduce((acc, curr) => acc + (parseFloat(curr.count) || 0), 0);
    const S = shannonSpeciesData.length;

    let H = 0;
    const computedBreakdown = [];

    shannonSpeciesData.forEach((sp) => {
      const count = parseFloat(sp.count) || 0;
      const p_i = totalCount > 0 ? count / totalCount : 0;
      let contribution = 0;
      if (p_i > 0) {
        contribution = -p_i * Math.log(p_i);
        H += contribution;
      }
      computedBreakdown.push({
        name: sp.name,
        count: count,
        p_i: p_i,
        contribution: contribution
      });
    });

    const formattedH = H.toFixed(3);

    if (resultValEl) resultValEl.textContent = formattedH;
    if (countHeaderEl) countHeaderEl.textContent = `${S} especies`;
    if (totalCountCell) totalCountCell.textContent = totalCount.toLocaleString("es-MX");
    if (sumHCell) sumHCell.textContent = `H = ${formattedH}`;

    // Render Breakdown Table
    if (breakdownBody) {
      breakdownBody.innerHTML = "";
      computedBreakdown.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><em>${row.name}</em></td>
          <td style="font-family: monospace;">${row.count.toLocaleString()}</td>
          <td style="font-family: monospace;">${(row.p_i * 100).toFixed(1)}% (${row.p_i.toFixed(4)})</td>
          <td style="font-family: monospace; font-weight: bold; color: #0f766e;">${row.contribution.toFixed(4)}</td>
        `;
        breakdownBody.appendChild(tr);
      });
    }

    // Render Abundance Chart
    renderModel4Chart(computedBreakdown);

    // Interpretation
    if (interpEl) {
      let divDesc = "";
      if (H < 1.0) divDesc = "Diversidad baja con marcada dominancia de una especie.";
      else if (H <= 2.2) divDesc = "Diversidad moderada y equitativa, característica de microbiota vaginal fisiológica dominada por lactobacilos.";
      else divDesc = "Diversidad alta, típica de ecosistemas multiespecíficos o transición de microbiota.";

      interpEl.innerHTML = `
        <strong>Interpretación ecológica:</strong> El índice de Shannon estimado es <strong>H = ${formattedH}</strong> nats para un total de <strong>${S} especies</strong> analizadas (${totalCount.toLocaleString()} observaciones). ${divDesc}
        <em style="display: block; margin-top: 0.35rem; color: var(--ink-secondary);">
          Un valor mayor de Shannon indica mayor diversidad y equitatividad en el perfil analizado, pero no significa necesariamente mayor carga microbiana ni mayor transferencia materno-neonatal.
        </em>
      `;
    }

    if (shouldLog) {
      addSessionLogEntry(
        "Modelo 4 (Diversidad Shannon)",
        `S=${S} especies, N=${totalCount.toLocaleString()} obs`,
        formattedH,
        "nats",
        "Válido"
      );
    }
  }

  function renderModel4Chart(breakdown) {
    const svg = document.getElementById("m4ChartSvg");
    if (!svg) return;

    const chartWidth = 400;
    const startX = 20;
    let accumulatedX = startX;

    let rects = "";
    let legends = "";

    breakdown.forEach((sp, idx) => {
      const color = palette[idx % palette.length];
      const barW = sp.p_i * chartWidth;

      if (barW > 0) {
        rects += `
          <rect x="${accumulatedX}" y="20" width="${barW}" height="32" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
        `;
        // Text inside bar if wide enough
        if (barW >= 35) {
          rects += `
            <text x="${accumulatedX + barW / 2}" y="40" font-size="11" font-family="monospace" font-weight="bold" fill="#ffffff" text-anchor="middle">
              ${(sp.p_i * 100).toFixed(0)}%
            </text>
          `;
        }
        accumulatedX += barW;
      }
    });

    // Legends below
    const legendRowY = 75;
    let legX = 20;
    breakdown.forEach((sp, idx) => {
      const color = palette[idx % palette.length];
      const shortName = sp.name.length > 18 ? sp.name.substring(0, 16) + "…" : sp.name;
      legends += `
        <circle cx="${legX + 6}" cy="${legendRowY}" r="5" fill="${color}"/>
        <text x="${legX + 16}" y="${legendRowY + 4}" font-size="10" font-family="sans-serif" fill="#334155">${shortName}</text>
      `;
      legX += 105;
    });

    svg.innerHTML = `
      ${rects}
      ${legends}
    `;
  }

  // --------------------------------------------------------------------------
  // 6. APARTADO EXTRA: SIMULACIÓN DEL FLUJO DE LA MUESTRA
  // --------------------------------------------------------------------------
  let workflowTimer = null;
  let workflowCurrentStep = 0;
  let isWorkflowRunning = false;

  function initWorkflowSimulation() {
    const btnStart = document.getElementById("btnStartWorkflowSim");
    const btnReset = document.getElementById("btnResetWorkflowSim");
    const textStart = document.getElementById("btnStartWorkflowText");

    if (!btnStart || !btnReset) return;

    btnStart.addEventListener("click", () => {
      if (isWorkflowRunning) {
        // Pause
        clearInterval(workflowTimer);
        isWorkflowRunning = false;
        if (textStart) textStart.textContent = "Reanudar simulación";
      } else {
        // Start or Resume
        isWorkflowRunning = true;
        if (textStart) textStart.textContent = "Pausar simulación";

        workflowTimer = setInterval(() => {
          workflowCurrentStep++;
          if (workflowCurrentStep > 6) {
            clearInterval(workflowTimer);
            isWorkflowRunning = false;
            if (textStart) textStart.textContent = "Simulación completada";
            return;
          }
          updateWorkflowUI();
        }, 850);
      }
    });

    btnReset.addEventListener("click", () => {
      clearInterval(workflowTimer);
      isWorkflowRunning = false;
      workflowCurrentStep = 0;
      if (textStart) textStart.textContent = "Iniciar simulación";
      updateWorkflowUI();
    });
  }

  function updateWorkflowUI() {
    const progressFill = document.getElementById("workflowProgressFill");
    if (progressFill) {
      const percent = Math.min(100, Math.round((workflowCurrentStep / 6) * 100));
      progressFill.style.width = `${percent}%`;
    }

    for (let i = 1; i <= 6; i++) {
      const node = document.getElementById(`wfNode${i}`);
      const statusEl = document.getElementById(`wfStatus${i}`);
      if (!node || !statusEl) continue;

      if (workflowCurrentStep === 0) {
        node.classList.remove("active", "completed");
        statusEl.textContent = "Pendiente";
      } else if (i < workflowCurrentStep) {
        node.classList.remove("active");
        node.classList.add("completed");
        statusEl.textContent = "Completado ✓";
      } else if (i === workflowCurrentStep) {
        node.classList.add("active");
        node.classList.remove("completed");
        statusEl.textContent = "En proceso...";
      } else {
        node.classList.remove("active", "completed");
        statusEl.textContent = "Pendiente";
      }
    }
  }

  // --------------------------------------------------------------------------
  // 7. APARTADO EXTRA: PANEL COMPARATIVO Y EXPORTACIÓN A CSV
  // --------------------------------------------------------------------------
  function addSessionLogEntry(modelName, inputsSummary, resultVal, unit, status) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    sessionLog.unshift({
      id: Date.now(),
      model: modelName,
      inputs: inputsSummary,
      result: resultVal,
      unit: unit,
      time: timeStr,
      status: status
    });

    renderSessionLogTable();
  }

  function renderSessionLogTable() {
    const tableBody = document.getElementById("sessionLogTableBody");
    const emptyState = document.getElementById("emptyLogState");
    const countLabel = document.getElementById("sessionLogCountLabel");

    if (!tableBody) return;

    if (sessionLog.length === 0) {
      tableBody.innerHTML = "";
      if (emptyState) emptyState.style.display = "flex";
      if (countLabel) countLabel.textContent = "0 cálculos registrados en la sesión";
      return;
    }

    if (emptyState) emptyState.style.display = "none";
    if (countLabel) countLabel.textContent = `${sessionLog.length} cálculo${sessionLog.length > 1 ? "s" : ""} registrado${sessionLog.length > 1 ? "s" : ""} en la sesión`;

    tableBody.innerHTML = sessionLog.map((item) => `
      <tr>
        <td><span class="log-model-badge">${item.model}</span></td>
        <td style="font-family: monospace; font-size: 0.825rem;">${item.inputs}</td>
        <td><span class="log-val-badge">${item.result}</span></td>
        <td style="font-family: monospace;">${item.unit}</td>
        <td>
          <span class="tab-badge" style="background: #e6f4ea; color: #137333; border-color: #ceead6;">
            ✓ ${item.status} (${item.time})
          </span>
        </td>
      </tr>
    `).join("");
  }

  function exportSessionLogToCSV() {
    if (sessionLog.length === 0) {
      alert("No hay cálculos registrados en la sesión para exportar.");
      return;
    }

    let csvContent = "\uFEFFModelo,Datos de Entrada,Resultado,Unidad,Estado,Hora\n";

    sessionLog.forEach((row) => {
      const cleanInputs = `"${row.inputs.replace(/"/g, '""')}"`;
      const cleanResult = `"${row.result.replace(/"/g, '""')}"`;
      csvContent += `"${row.model}",${cleanInputs},${cleanResult},"${row.unit}","${row.status}","${row.time}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `microtrace_resultados_sesion_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // --------------------------------------------------------------------------
  // 8. MASTER INITIALIZATION FOR MICROTRACE VIRTUAL LAB
  // --------------------------------------------------------------------------
  function initMicrotraceLab() {
    initLabTabs();

    // Model 1 Bindings
    const btnCalcM1 = document.getElementById("btnCalcM1");
    const btnResetM1 = document.getElementById("btnResetM1");
    const inputM1Colonias = document.getElementById("inputM1Colonias");
    const inputM1FD = document.getElementById("inputM1FD");
    const inputM1Vol = document.getElementById("inputM1Vol");

    if (btnCalcM1) btnCalcM1.addEventListener("click", () => calculateModel1(true));
    if (btnResetM1) {
      btnResetM1.addEventListener("click", () => {
        if (inputM1Colonias) inputM1Colonias.value = "80";
        if (inputM1FD) inputM1FD.value = "100";
        if (inputM1Vol) inputM1Vol.value = "0.1";
        calculateModel1(true);
      });
    }
    [inputM1Colonias, inputM1FD, inputM1Vol].forEach((inp) => {
      if (inp) inp.addEventListener("input", () => calculateModel1(false));
    });

    // Model 2 Bindings
    const btnCalcM2 = document.getElementById("btnCalcM2");
    const btnResetM2 = document.getElementById("btnResetM2");
    const inputM2Cm = document.getElementById("inputM2Cm");
    const inputM2Cn = document.getElementById("inputM2Cn");

    if (btnCalcM2) btnCalcM2.addEventListener("click", () => calculateModel2(true));
    if (btnResetM2) {
      btnResetM2.addEventListener("click", () => {
        if (inputM2Cm) inputM2Cm.value = "10000";
        if (inputM2Cn) inputM2Cn.value = "2000";
        calculateModel2(true);
      });
    }
    [inputM2Cm, inputM2Cn].forEach((inp) => {
      if (inp) inp.addEventListener("input", () => calculateModel2(false));
    });

    // Model 3 Bindings
    initModel3Checkboxes();
    const btnCalcM3 = document.getElementById("btnCalcM3");
    const btnResetM3 = document.getElementById("btnResetM3");

    if (btnCalcM3) btnCalcM3.addEventListener("click", () => calculateModel3(true));
    if (btnResetM3) {
      btnResetM3.addEventListener("click", () => {
        m3MaternalSelected = new Set(["A", "B", "C", "D", "E"]);
        m3NeonatalSelected = new Set(["B", "C", "E", "F"]);
        initModel3Checkboxes();
        calculateModel3(true);
      });
    }

    // Model 4 Bindings
    renderShannonInputs();
    const btnCalcM4 = document.getElementById("btnCalcM4");
    const btnResetShannon = document.getElementById("btnResetShannon");
    const btnAddSpecies = document.getElementById("btnAddShannonSpecies");

    if (btnCalcM4) btnCalcM4.addEventListener("click", () => calculateModel4(true));
    if (btnResetShannon) {
      btnResetShannon.addEventListener("click", () => {
        shannonSpeciesData = [
          { id: 1, name: "Lactobacillus crispatus", count: 450 },
          { id: 2, name: "Lactobacillus iners", count: 250 },
          { id: 3, name: "Lactobacillus jensenii", count: 180 },
          { id: 4, name: "Bifidobacterium breve", count: 120 }
        ];
        renderShannonInputs();
        calculateModel4(true);
      });
    }
    if (btnAddSpecies) {
      btnAddSpecies.addEventListener("click", () => {
        shannonSpeciesData.push({
          id: Date.now(),
          name: `Especie adicional ${shannonSpeciesData.length + 1}`,
          count: 50
        });
        renderShannonInputs();
        calculateModel4(false);
      });
    }

    // Workflow Simulation Bindings
    initWorkflowSimulation();

    // Session Log Bindings
    const btnExportCSV = document.getElementById("btnExportSessionCSV");
    const btnClearLog = document.getElementById("btnClearSessionLog");

    if (btnExportCSV) btnExportCSV.addEventListener("click", exportSessionLogToCSV);
    if (btnClearLog) {
      btnClearLog.addEventListener("click", () => {
        if (sessionLog.length > 0 && confirm("¿Deseas vaciar todos los registros de la bitácora de sesión?")) {
          sessionLog.length = 0;
          renderSessionLogTable();
        }
      });
    }

    // Initial Execution of all 4 models with default examples & logging
    calculateModel1(true);
    calculateModel2(true);
    calculateModel3(true);
    calculateModel4(true);
  }

  // Initialize MICROTRACE Virtual Lab
  initMicrotraceLab();

  // Window Resize
  window.addEventListener("resize", resizeCanvas);

  // Initialize Initial Route
  const initialRoute = getRouteFromHash();
  navigateTo(initialRoute, false);
});
