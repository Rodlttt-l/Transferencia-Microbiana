/**
 * TRANSFERENCIA MICROBIANA VAGINAL EN EL PARTO
 * Motor de Simulación Matemática y Modelado Dinámico
 * Equipo de Trabajo: Rodrigo Lara, Mariana Salas Villanueva, Stefany Alessandra Castro Balboa
 * Carrera: Ingeniería Biomédica | Docente: Fuentes Castro Juan Ángel
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

  // Canonical presets
  const presets = {
    vaginal: {
      name: "Parto Vaginal Natural",
      N0: 95000,
      r: 0.38,
      K: 1000000,
      color: "#135d50",
      description: "Transferencia directa por canal de parto. Colonización inmediata por Lactobacillus y Bifidobacterium."
    },
    cesarean: {
      name: "Cesárea Convencional",
      N0: 2500,
      r: 0.16,
      K: 550000,
      color: "#dc2626",
      description: "Ausencia de inóculo vaginal materno. Colonización retardada dominada por microbiota cutánea hospitalaria."
    },
    seeding: {
      name: "Cesárea + Siembra Vaginal (Vaginal Seeding)",
      N0: 65000,
      r: 0.34,
      K: 920000,
      color: "#c85a17",
      description: "Intervención biomédica con apósito estéril normado. Restauración acelerada del microbioma neonatal fisiológico."
    }
  };

  // DOM Elements
  const canvas = document.getElementById("growthChart");
  const ctx = canvas.getContext("2d");

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
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    draw();
  }

  // Draw Chart
  function draw() {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    const padding = { top: 30, right: 30, bottom: 45, left: 75 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Draw Grid & Axes
    ctx.strokeStyle = "#e8ecea";
    ctx.lineWidth = 1;

    const xTicks = 8;
    const yTicks = 5;

    // X Axis ticks
    for (let i = 0; i <= xTicks; i++) {
      const tVal = (state.timeMax / xTicks) * i;
      const x = padding.left + (chartW / xTicks) * i;

      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${tVal.toFixed(0)}h`, x, height - padding.bottom + 18);
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

    // Y Axis ticks
    for (let j = 0; j <= yTicks; j++) {
      const y = padding.top + (chartH / yTicks) * (yTicks - j);
      const val = (yMax / yTicks) * j;

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      let formattedVal = val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : (val >= 1000 ? `${(val/1000).toFixed(0)}k` : val.toFixed(0));
      ctx.fillText(formattedVal, padding.left - 10, y + 4);
    }

    // Axis Labels
    ctx.fillStyle = "#0f172a";
    ctx.font = "600 12px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Tiempo transcurrido desde el parto (horas)", padding.left + chartW / 2, height - 10);

    ctx.save();
    ctx.translate(18, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(state.mode === "rate" ? "Tasa Instantánea (dN/dt)" : (state.mode === "integral" ? "Inóculo Acumulado (Integral)" : "Densidad Microbiana (CFU/mL)"), 0, 0);
    ctx.restore();

    // Helper mapping coordinate
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
        renderCurve(p.N0, p.r, p.K, p.color, key === state.scenario ? 3.5 : 2, key === state.scenario);
      });
      drawLegend(padding, chartW);
    } else {
      // Draw active custom scenario
      let activeColor = presets[state.scenario] ? presets[state.scenario].color : "#135d50";
      renderCurve(state.N0, state.r, state.K, activeColor, 3.5, true);
    }

    // Function to render single curve
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

      // Draw area under curve if single mode
      if (fill && (state.mode === "colonization" || state.mode === "integral")) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartH);
        points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = color === "#dc2626" ? "rgba(220, 38, 38, 0.08)" : (color === "#c85a17" ? "rgba(200, 90, 23, 0.08)" : "rgba(19, 93, 80, 0.08)");
        ctx.fill();
      }

      // Draw curve
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Mark Inflection Point on colonization mode
      if (state.mode === "colonization" && fill) {
        const tInf = calculateInflectionTime(n0, r, k);
        if (tInf > 0 && tInf <= state.timeMax) {
          const nInf = k / 2;
          const px = toCanvasX(tInf);
          const py = toCanvasY(nInf);

          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.fill();
          ctx.stroke();

          // Inflection label
          ctx.fillStyle = color;
          ctx.font = "600 11px 'Plus Jakarta Sans', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(`Punto Inflexión: ${tInf.toFixed(1)}h`, px + 8, py - 4);
        }
      }
    }

    // Legend
    function drawLegend(padding, chartW) {
      const legendX = padding.left + 20;
      const legendY = padding.top + 20;

      const items = [
        { label: "Parto Vaginal (Natural)", color: presets.vaginal.color },
        { label: "Cesárea Convencional", color: presets.cesarean.color },
        { label: "Cesárea + Siembra Vaginal", color: presets.seeding.color }
      ];

      items.forEach((item, idx) => {
        const y = legendY + idx * 22;
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, y - 9, 14, 4);

        ctx.fillStyle = "#1e293b";
        ctx.font = "500 12px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(item.label, legendX + 22, y - 4);
      });
    }

    // Crosshair Hover
    if (state.hoverPoint) {
      const hx = state.hoverPoint.x;
      if (hx >= padding.left && hx <= width - padding.right) {
        const tHover = ((hx - padding.left) / chartW) * state.timeMax;
        const currentN = calculateN(tHover, state.N0, state.r, state.K);
        let displayVal = currentN;
        if (state.mode === "rate") displayVal = calculateDerivative(currentN, state.r, state.K);
        else if (state.mode === "integral") displayVal = calculateIntegral(tHover, state.N0, state.r, state.K);

        const hy = toCanvasY(displayVal);

        ctx.strokeStyle = "rgba(100, 116, 139, 0.4)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(hx, padding.top);
        ctx.lineTo(hx, height - padding.bottom);
        ctx.moveTo(padding.left, hy);
        ctx.lineTo(width - padding.right, hy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Hover point circle
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#0f172a";
        ctx.fill();

        // Tooltip box
        const tooltipText = `t: ${tHover.toFixed(1)}h | ${Math.round(displayVal).toLocaleString()} ${yUnit}`;
        ctx.font = "11px 'JetBrains Mono', monospace";
        const textWidth = ctx.measureText(tooltipText).width;
        const boxX = Math.min(Math.max(hx - textWidth / 2 - 8, padding.left), width - padding.right - textWidth - 16);
        const boxY = Math.max(hy - 32, padding.top + 4);

        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, textWidth + 16, 24, 4);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.fillText(tooltipText, boxX + 8, boxY + 16);
      }
    }
  }

  // Update Telemetry Indicators
  function updateTelemetry() {
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
    sliderN0.value = state.N0;
    sliderR.value = state.r;
    sliderK.value = state.K;
    sliderTime.value = state.timeMax;

    valN0.textContent = `${Number(state.N0).toLocaleString()} CFU`;
    valR.textContent = `${Number(state.r).toFixed(2)} h⁻¹`;
    valK.textContent = `${(state.K / 1000000).toFixed(1)}M CFU`;
    valTime.textContent = `${state.timeMax} h`;

    updateTelemetry();
    draw();
  }

  // Event Listeners for Sliders
  sliderN0.addEventListener("input", (e) => {
    state.N0 = parseFloat(e.target.value);
    syncInputs();
  });
  sliderR.addEventListener("input", (e) => {
    state.r = parseFloat(e.target.value);
    syncInputs();
  });
  sliderK.addEventListener("input", (e) => {
    state.K = parseFloat(e.target.value);
    syncInputs();
  });
  sliderTime.addEventListener("input", (e) => {
    state.timeMax = parseFloat(e.target.value);
    syncInputs();
  });

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

  // Print buttons (Desktop & Mobile)
  const printBtn = document.getElementById("printBtn");
  const printBtnMobile = document.getElementById("printBtnMobile");
  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }
  if (printBtnMobile) {
    printBtnMobile.addEventListener("click", () => window.print());
  }

  // Window Resize
  window.addEventListener("resize", resizeCanvas);

  // Initialize
  resizeCanvas();
  syncInputs();
  updateDiffusionModel();
});
