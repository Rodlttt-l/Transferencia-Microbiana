/**
 * app.js — Sistema de Medición para la Transferencia Microbiana durante el Parto Vaginal
 * Plataforma Científica y Educativa · Motion Design Cinematográfico (Inspirado en Apple)
 * Universidad Autónoma de Tamaulipas · Facultad de Medicina de Tampico
 *
 * Módulos:
 *  A. Navegación Frosted Sticky & Mobile Menu
 *  B. Scroll Reveal & Hero Choreography
 *  C. Scroll Storytelling (5 Escenas Perinatales)
 *  D. Simulador Microscópico y Ambient Canvas
 *  E. Explorador Interactivo de Factores y Línea de Tiempo
 *  F. Calculadora 1 — Concentración Microbiana C = (N × FD) / V
 *  G. Calculadora 2 — Eficiencia de Transferencia R = (Cn / Cm) × 100%
 *  H. Calculadora 3 — Coeficiente de Similitud de Jaccard J = |M ∩ N| / |M ∪ N|
 *  I. Calculadora 4 — Índice de Diversidad Alfa de Shannon-Wiener H' = -Σ p_i ln(p_i)
 *  J. Módulo Especial — Dinámica Poblacional de Verhulst (Cálculo Integral y Diferencial I)
 *  K. KaTeX Helper & Utilidades
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initHeroMotion();
  initStorytelling();
  initAmbientCanvas();
  initInteractiveBacteriaCanvas();
  initFactorsExplorer();
  initCalculatorHub();
  initCalc1();
  initCalc2();
  initCalc3();
  initCalc4();
  initVerhulstSimulator();
  initScrollReveal();
  initKaTeX();
});

/* ═══════════════════════════════════════════════════════════════════════════
   A. NAVEGACIÓN FROSTED STICKY & MOBILE MENU
   ═══════════════════════════════════════════════════════════════════════════ */
function initNav() {
  const nav = document.getElementById('siteNav');
  const toggle = document.getElementById('mobileMenuToggle');
  const dropdown = document.getElementById('mobileDropdown');
  const iconOpen = toggle ? toggle.querySelector('.menu-icon-open') : null;
  const iconClose = toggle ? toggle.querySelector('.menu-icon-close') : null;

  // Sticky nav class on scroll
  const handleScroll = () => {
    if (window.scrollY > 20) {
      nav?.classList.add('scrolled');
    } else {
      nav?.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Mobile menu toggle
  function closeMenu() {
    dropdown?.classList.remove('open');
    dropdown?.setAttribute('aria-hidden', 'true');
    toggle?.setAttribute('aria-expanded', 'false');
    if (iconOpen) iconOpen.style.display = '';
    if (iconClose) iconClose.style.display = 'none';
  }

  function openMenu() {
    dropdown?.classList.add('open');
    dropdown?.setAttribute('aria-hidden', 'false');
    toggle?.setAttribute('aria-expanded', 'true');
    if (iconOpen) iconOpen.style.display = 'none';
    if (iconClose) iconClose.style.display = '';
  }

  toggle?.addEventListener('click', () => {
    if (dropdown?.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"], [data-scroll]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const targetId = anchor.getAttribute('data-scroll') || anchor.getAttribute('href')?.replace('#', '');
      if (!targetId) return;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        closeMenu();
        const navHeight = nav?.offsetHeight || 60;
        const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }
    });
  });

  // ScrollSpy active state
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-nav]');
  if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach(link => {
              if (link.getAttribute('data-nav') === id) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });
          }
        });
      },
      { threshold: 0.2, rootMargin: '-70px 0px -40% 0px' }
    );
    sections.forEach(sec => observer.observe(sec));
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   B. HERO CHOREOGRAPHY & MOTION ENTRANCE
   ═══════════════════════════════════════════════════════════════════════════ */
function initHeroMotion() {
  const elements = document.querySelectorAll('.motion-entry');
  elements.forEach(el => {
    const delay = el.getAttribute('data-delay') || 0;
    el.style.animationDelay = `${delay}ms`;
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   C. SCROLL STORYTELLING (5 ESCENAS PERINATALES)
   ═══════════════════════════════════════════════════════════════════════════ */
function initStorytelling() {
  const scenes = document.querySelectorAll('.story-scene');
  const pills = document.querySelectorAll('.step-pill');
  const prevBtn = document.getElementById('storyPrevBtn');
  const nextBtn = document.getElementById('storyNextBtn');
  const counterEl = document.getElementById('currentSceneNum');
  let currentIdx = 1;
  const totalScenes = scenes.length;

  function setScene(index) {
    if (index < 1 || index > totalScenes) return;
    currentIdx = index;

    // Toggle scenes
    scenes.forEach(s => {
      const sIdx = parseInt(s.getAttribute('data-scene-index'), 10);
      if (sIdx === currentIdx) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });

    // Toggle pills
    pills.forEach(p => {
      const pIdx = parseInt(p.getAttribute('data-scene'), 10);
      if (pIdx === currentIdx) {
        p.classList.add('active');
        p.setAttribute('aria-selected', 'true');
      } else {
        p.classList.remove('active');
        p.setAttribute('aria-selected', 'false');
      }
    });

    // Counter and buttons
    if (counterEl) counterEl.textContent = currentIdx;
    if (prevBtn) prevBtn.disabled = (currentIdx === 1);
    if (nextBtn) nextBtn.disabled = (currentIdx === totalScenes);

    // Re-render KaTeX if new equations appear in scene
    reRenderKaTeX(document.getElementById(`scene-${currentIdx}`));
  }

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const idx = parseInt(pill.getAttribute('data-scene'), 10);
      setScene(idx);
    });
  });

  prevBtn?.addEventListener('click', () => setScene(currentIdx - 1));
  nextBtn?.addEventListener('click', () => setScene(currentIdx + 1));

  // Initialize Scene 1 Canvas (Mother microbiome floating particles)
  initScene1Canvas();
  initScene3Canvas();
}

function initScene1Canvas() {
  const canvas = document.getElementById('scene1Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = canvas.offsetWidth || 500);
  let height = (canvas.height = canvas.offsetHeight || 440);

  const particles = Array.from({ length: 45 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    len: 12 + Math.random() * 16,
    thick: 3 + Math.random() * 2,
    angle: Math.random() * Math.PI,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    vAngle: (Math.random() - 0.5) * 0.02,
    alpha: 0.3 + Math.random() * 0.45
  }));

  function render() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.vAngle;

      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.beginPath();
      ctx.roundRect(-p.len / 2, -p.thick / 2, p.len, p.thick, p.thick / 2);
      ctx.fillStyle = `rgba(20, 184, 166, ${p.alpha})`;
      ctx.shadowColor = 'rgba(20, 184, 166, 0.5)';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    });
    requestAnimationFrame(render);
  }
  render();
}

function initScene3Canvas() {
  const canvas = document.getElementById('scene3Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = canvas.offsetWidth || 500);
  let height = (canvas.height = canvas.offsetHeight || 440);

  // Particles adhering to bottom surface
  const bacteria = Array.from({ length: 35 }, () => ({
    x: Math.random() * width,
    y: Math.random() * (height * 0.7),
    targetY: height - (20 + Math.random() * 60),
    vx: (Math.random() - 0.5) * 0.3,
    vy: 0.4 + Math.random() * 0.5,
    adhered: false,
    size: 4 + Math.random() * 4
  }));

  function render() {
    ctx.clearRect(0, 0, width, height);
    bacteria.forEach(b => {
      if (!b.adhered) {
        b.y += b.vy;
        b.x += b.vx;
        if (b.y >= b.targetY) {
          b.adhered = true;
        }
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fillStyle = b.adhered ? 'rgba(13, 148, 136, 0.85)' : 'rgba(45, 212, 191, 0.55)';
      ctx.shadowColor = 'rgba(13, 148, 136, 0.6)';
      ctx.shadowBlur = b.adhered ? 8 : 4;
      ctx.fill();
    });
    requestAnimationFrame(render);
  }
  render();
}

/* ═══════════════════════════════════════════════════════════════════════════
   D. SIMULADOR MICROSCÓPICO Y AMBIENT CANVAS
   ═══════════════════════════════════════════════════════════════════════════ */
function initAmbientCanvas() {
  const canvas = document.getElementById('ambientMicroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const particles = Array.from({ length: 50 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: 1.5 + Math.random() * 2.5,
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.25,
    alpha: 0.15 + Math.random() * 0.35
  }));

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(13, 148, 136, ${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

function initInteractiveBacteriaCanvas() {
  const canvas = document.getElementById('interactiveBacteriaCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const densitySlider = document.getElementById('sliderParticleDensity');
  const speedSlider = document.getElementById('sliderParticleSpeed');
  const valDensity = document.getElementById('valDensity');
  const valSpeed = document.getElementById('valSpeed');
  const toggleBtn = document.getElementById('toggleMicroMotility');
  const resetBtn = document.getElementById('resetMicroCanvas');

  let width = (canvas.width = canvas.parentElement.offsetWidth || 900);
  let height = (canvas.height = 420);
  let isPaused = false;
  let speedMultiplier = 1.0;
  let targetCount = 70;

  function resize() {
    if (canvas.parentElement) {
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = 420;
    }
  }
  window.addEventListener('resize', resize);

  let bacteriaList = [];

  function createBacteria(count) {
    const list = [];
    for (let i = 0; i < count; i++) {
      const typeRand = Math.random();
      let type = 'bacillus';
      if (typeRand > 0.65) type = 'coccus';
      else if (typeRand > 0.45) type = 'anaerobe';

      list.push({
        type: type,
        x: Math.random() * width,
        y: Math.random() * height,
        len: type === 'bacillus' ? 14 + Math.random() * 12 : 6,
        thick: type === 'bacillus' ? 4 + Math.random() * 1.5 : 6,
        r: type === 'coccus' ? 4.5 + Math.random() * 2 : 4,
        angle: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.5) * 0.9,
        vAngle: (Math.random() - 0.5) * 0.03
      });
    }
    return list;
  }

  bacteriaList = createBacteria(targetCount);

  densitySlider?.addEventListener('input', e => {
    targetCount = parseInt(e.target.value, 10);
    if (valDensity) valDensity.textContent = targetCount;
    bacteriaList = createBacteria(targetCount);
  });

  speedSlider?.addEventListener('input', e => {
    speedMultiplier = parseFloat(e.target.value);
    if (valSpeed) valSpeed.textContent = speedMultiplier.toFixed(1);
  });

  toggleBtn?.addEventListener('click', () => {
    isPaused = !isPaused;
    toggleBtn.querySelector('span').textContent = isPaused ? 'Reanudar' : 'Pausar';
  });

  resetBtn?.addEventListener('click', () => {
    bacteriaList = createBacteria(targetCount);
  });

  // Interactive mouse repulsion
  let mouse = { x: -1000, y: -1000 };
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  function draw() {
    ctx.fillStyle = '#0b1325';
    ctx.fillRect(0, 0, width, height);

    // Subtle fluid flow grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    bacteriaList.forEach(b => {
      if (!isPaused) {
        b.x += b.vx * speedMultiplier;
        b.y += b.vy * speedMultiplier;
        b.angle += b.vAngle * speedMultiplier;

        // Bounce walls
        if (b.x < 15) { b.x = 15; b.vx *= -1; }
        if (b.x > width - 15) { b.x = width - 15; b.vx *= -1; }
        if (b.y < 15) { b.y = 15; b.vy *= -1; }
        if (b.y > height - 15) { b.y = height - 15; b.vy *= -1; }

        // Mouse repulsion
        const dx = b.x - mouse.x;
        const dy = b.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80 && dist > 0) {
          const force = (80 - dist) / 80;
          b.x += (dx / dist) * force * 5;
          b.y += (dy / dist) * force * 5;
        }
      }

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      if (b.type === 'bacillus') {
        // Lactobacillus rod
        ctx.beginPath();
        ctx.roundRect(-b.len / 2, -b.thick / 2, b.len, b.thick, b.thick / 2);
        ctx.fillStyle = '#2dd4bf';
        ctx.shadowColor = 'rgba(45, 212, 191, 0.7)';
        ctx.shadowBlur = 8;
        ctx.fill();
      } else if (b.type === 'coccus') {
        // Streptococcus/Staphylococcus sphere pair
        ctx.beginPath();
        ctx.arc(-b.r * 0.6, 0, b.r, 0, Math.PI * 2);
        ctx.arc(b.r * 0.6, 0, b.r * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
        ctx.shadowBlur = 6;
        ctx.fill();
      } else {
        // Bifidobacterium Y-like or small rod
        ctx.beginPath();
        ctx.roundRect(-8, -3, 16, 6, 3);
        ctx.fillStyle = '#818cf8';
        ctx.shadowColor = 'rgba(129, 140, 248, 0.7)';
        ctx.shadowBlur = 6;
        ctx.fill();
      }

      ctx.restore();
    });

    requestAnimationFrame(draw);
  }
  draw();
}

/* ═══════════════════════════════════════════════════════════════════════════
   E. EXPLORADOR INTERACTIVO DE FACTORES Y LÍNEA DE TIEMPO
   ═══════════════════════════════════════════════════════════════════════════ */
const factorsData = {
  'microbiota-materna': {
    title: 'Microbiota materna',
    impact: 'Determinante Primario',
    impactClass: 'high',
    lead: 'El perfil taxonómico y estado de eubiosis vaginal de la gestante define el inóculo biológico primario recibido por el feto.',
    photo: 'IMAGENES/portada-microbiota-ayp1-1150-550-p-L-97.jpg',
    bullets: [
      'Dominancia fisiológica de <em>Lactobacillus crispatus</em> (Estado CST I) confiere máxima estabilidad y protección frente a disbiosis.',
      'Estados CST IV (diversidad polimicrobiana con <em>Gardnerella</em> y <em>Prevotella</em>) alteran la composición del inóculo fundacional.',
      'El pH ácido materno y los metabolitos lácticos condicionan la viabilidad bacteriana durante la expulsión.'
    ]
  },
  'via-nacimiento': {
    title: 'Vía de nacimiento (Parto vaginal vs. Cesárea)',
    impact: 'Variable de Exposición Clave',
    impactClass: 'high',
    lead: 'La vía de nacimiento determina las superficies anatómicas con las que el feto interactúa en sus primeros instantes.',
    photo: 'FOTOS EXTRAS/FOTO DE CESAREA.jpg',
    bullets: [
      'En el parto vaginal: Exposición directa a comunidades vaginales y fecales maternas (<em>Lactobacillus</em>, <em>Bacteroides</em>, <em>Bifidobacterium</em>).',
      'En la cesárea programada: Ausencia de paso por el canal de parto; la colonización inicial proviene predominantemente de la microbiota cutánea materna y del personal de salud (<em>Staphylococcus</em>, <em>Corynebacterium</em>, <em>Propionibacterium</em>).',
      'Nota médica: La vía de nacimiento responde estrictamente a indicaciones obstétricas para proteger la vida materno-fetal; las diferencias de microbioma convergen gradualmente durante el primer año de vida.'
    ]
  },
  'exposicion-parto': {
    title: 'Exposición durante el parto',
    impact: 'Factor Cinético',
    impactClass: 'high',
    lead: 'La duración del trabajo de parto y el tiempo transcurrido desde la rotura de membranas influyen en la densidad de colonización ascendente.',
    photo: 'IMAGENES/images.jpeg',
    bullets: [
      'Rotura prematura de membranas (> 18 h) incrementa la exposición a bacterias del tracto reproductivo inferior antes del alumbramiento.',
      'La duración del período expulsivo modula el tiempo de fricción mecánica y transferencia de secreciones mucosas.',
      'Monitoreo fetal y tactos vaginales repetidos representan variables intraparto a considerar analíticamente.'
    ]
  },
  'antibioticos': {
    title: 'Uso de antibióticos intraparto y tempranos',
    impact: 'Modulador Selectivo',
    impactClass: 'high',
    lead: 'La profilaxis antimicrobiana para Estreptococo del Grupo B (SGB) reduce transitoriamente la carga de bacterias comensales.',
    photo: 'ICONOS/medicina.png',
    bullets: [
      'La administración de ampicilina o penicilina intraparto erradica el riesgo de sepsis neonatal por <em>Streptococcus agalactiae</em>.',
      'Se observa una disminución temporal en la abundancia de <em>Bifidobacterium</em> y un retraso transitorio en la diversificación intestinal.',
      'Efectos reversibles con apoyo de lactancia materna exclusiva en las semanas posteriores.'
    ]
  },
  'piel-con-piel': {
    title: 'Contacto piel con piel inmediato',
    impact: 'Inóculo Epitelial',
    impactClass: 'high',
    lead: 'El contacto inmediato postparto entre el pecho materno y el recién nacido inocula la epidermis con comensales cutáneos.',
    photo: 'FOTOS EXTRAS/BEBÉ.jpg',
    bullets: [
      'Favorece la transferencia de <em>Staphylococcus epidermidis</em> comensal y bacterias aerotolerantes que estabilizan el pH cutáneo.',
      'Regula la temperatura, disminuye el cortisol neonatal y estimula el reflejo de agarre para la primera toma de calostro.',
      'Recomendado por la OMS como estándar de oro en el alumbramiento humanizado.'
    ]
  },
  'alimentacion': {
    title: 'Alimentación temprana (Lactancia materna vs. Fórmula)',
    impact: 'Sustrato Metabólico Primario',
    impactClass: 'high',
    lead: 'La leche materna aporta no solo bacterias vivas sino oligosacáridos bioactivos (HMOs) no digeribles por el neonato.',
    photo: 'IMAGENES/585557f18a8aab33f4d16c0ddaf8673d.jpg',
    bullets: [
      'Los Oligosacáridos de Leche Humana (HMOs) actúan como prebióticos selectivos para <em>Bifidobacterium infantis</em>.',
      'La lactoferrina e inmunoglobulina A secretora (sIgA) previenen la adhesión de enteropatógenos.',
      'Las fórmulas infantiles modernas incorporan prebióticos (GOS/FOS) para mimetizar la acidificación fecal protectora.'
    ]
  },
  'ambiente': {
    title: 'Ambiente posterior al nacimiento',
    impact: 'Diversificación Externa',
    impactClass: 'high',
    lead: 'El entorno domiciliario, la presencia de hermanos, mascotas y el régimen de higiene modulan la tasa de adquisición de nuevas especies.',
    photo: 'IMAGENES/aa4b33a2f0b9c221d20088efa5ccbbbf61c7a1dd.png',
    bullets: [
      'Convivencia con mascotas en el hogar se asocia con mayor abundancia de <em>Ruminococcus</em> y menor riesgo de atopia.',
      'La transición del entorno hospitalario estéril al hogar familiar aporta diversidad bacteriana ambiental indispensable.',
      'La hipótesis de la higiene subraya la necesidad de exposición controlada a microbios para calibrar la tolerancia inmunológica.'
    ]
  }
};

function initFactorsExplorer() {
  const tabBtns = document.querySelectorAll('.factor-tab-btn');
  const displayContainer = document.getElementById('factorContent');
  const timelineSteps = document.querySelectorAll('.timeline-step');

  function renderFactor(key) {
    const data = factorsData[key];
    if (!data || !displayContainer) return;

    displayContainer.innerHTML = `
      <div class="factor-header-row">
        <h3 class="factor-title">${data.title}</h3>
        <span class="factor-impact-badge ${data.impactClass}">${data.impact}</span>
      </div>
      <p class="factor-lead">${data.lead}</p>
      <div class="factor-photo-box">
        <img src="${data.photo}" alt="${data.title}" class="factor-photo" loading="lazy">
      </div>
      <ul class="factor-bullet-list">
        ${data.bullets.map(b => `
          <li class="factor-bullet-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>${b}</span>
          </li>
        `).join('')}
      </ul>
    `;
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const factorKey = btn.getAttribute('data-factor');
      renderFactor(factorKey);
    });
  });

  // Render initial factor
  renderFactor('microbiota-materna');

  // Interactive timeline step click
  timelineSteps.forEach(step => {
    step.addEventListener('click', () => {
      timelineSteps.forEach(s => s.classList.remove('active'));
      step.classList.add('active');
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   F. NAVEGACIÓN DEL HUB DE CALCULADORAS (APPLE EXPAND / COLLAPSE)
   ═══════════════════════════════════════════════════════════════════════════ */
function initCalculatorHub() {
  const calcHub = document.getElementById('calcHub');
  const allPanels = document.querySelectorAll('.calc-panel');

  document.querySelectorAll('.calc-open-btn[data-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const panelId = btn.getAttribute('data-open');
      const panel = document.getElementById(panelId);
      if (!panel) return;

      calcHub?.classList.add('hidden');
      allPanels.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-hidden', 'true');
      });

      panel.classList.add('active');
      panel.removeAttribute('aria-hidden');

      setTimeout(() => {
        const section = document.getElementById('calculadoras');
        if (section) {
          const navHeight = document.getElementById('siteNav')?.offsetHeight || 60;
          const pos = section.getBoundingClientRect().top + window.pageYOffset - navHeight;
          window.scrollTo({ top: pos, behavior: 'smooth' });
        }
        reRenderKaTeX(panel);
      }, 60);
    });
  });

  document.querySelectorAll('.calc-back-btn[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const panelId = btn.getAttribute('data-close');
      const panel = document.getElementById(panelId);
      panel?.classList.remove('active');
      panel?.setAttribute('aria-hidden', 'true');

      calcHub?.classList.remove('hidden');

      setTimeout(() => {
        const section = document.getElementById('calculadoras');
        if (section) {
          const navHeight = document.getElementById('siteNav')?.offsetHeight || 60;
          const pos = section.getBoundingClientRect().top + window.pageYOffset - navHeight;
          window.scrollTo({ top: pos, behavior: 'smooth' });
        }
      }, 50);
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   G. CALCULADORA 1 — CONCENTRACIÓN MICROBIANA C = (N × FD) / V
   ═══════════════════════════════════════════════════════════════════════════ */
function initCalc1() {
  const btnCalc = document.getElementById('c1_btn_calc');
  const btnReset = document.getElementById('c1_btn_reset');
  const inputN = document.getElementById('c1_colonias');
  const selectFD = document.getElementById('c1_fd');
  const inputV = document.getElementById('c1_vol');

  function calculate() {
    const errorBox = document.getElementById('c1_error');
    const resultEl = document.getElementById('c1_result_val');
    const badgeEl = document.getElementById('c1_classification_badge');
    const procEl = document.getElementById('c1_procedure_text');

    const N = parseFloat(inputN?.value);
    const FD = parseFloat(selectFD?.value);
    const V = parseFloat(inputV?.value);

    if (isNaN(N) || N < 0 || isNaN(FD) || FD <= 0 || isNaN(V) || V <= 0) {
      if (errorBox) {
        errorBox.textContent = 'Por favor ingresa valores numéricos válidos (N ≥ 0, FD > 0, V > 0).';
        errorBox.style.display = 'block';
      }
      return;
    }
    if (errorBox) errorBox.style.display = 'none';

    const C = (N * FD) / V;

    // Animated Counter
    if (resultEl) {
      animateValue(resultEl, 0, Math.round(C), 600, true);
    }

    // Badge classification
    if (badgeEl) {
      if (C >= 1000000) {
        badgeEl.textContent = 'Carga eubiótica fisiológica alta (> 10⁶ UFC/mL)';
        badgeEl.className = 'result-status-badge eubiosis';
      } else if (C >= 10000) {
        badgeEl.textContent = 'Carga moderada estándar (10⁴ a 10⁶ UFC/mL)';
        badgeEl.className = 'result-status-badge moderate';
      } else {
        badgeEl.textContent = 'Carga baja o inóculo reducido (< 10⁴ UFC/mL)';
        badgeEl.className = 'result-status-badge';
      }
    }

    // Step by step procedure
    if (procEl) {
      procEl.innerHTML = `
        1. Sustitución: C = (${N} colonias × ${FD.toLocaleString('es-MX')}) / ${V} mL<br>
        2. Producto de colonias e inóculo: ${N * FD} UFC<br>
        3. Concentración volumétrica final: <strong>${Math.round(C).toLocaleString('es-MX')} UFC/mL</strong>
      `;
    }

    renderC1Chart(C);
  }

  function reset() {
    if (inputN) inputN.value = '85';
    if (selectFD) selectFD.value = '10000';
    if (inputV) inputV.value = '0.1';
    calculate();
  }

  btnCalc?.addEventListener('click', calculate);
  btnReset?.addEventListener('click', reset);
  inputN?.addEventListener('input', calculate);
  selectFD?.addEventListener('change', calculate);
  inputV?.addEventListener('input', calculate);

  // Initial calculation
  calculate();
}

function renderC1Chart(C) {
  const svg = document.getElementById('c1_chart');
  if (!svg) return;

  const logMin = 2; // 100 UFC
  const logMax = 8; // 100,000,000 UFC
  const chartW = 380;
  const startX = 30;
  const chartY = 40;
  const chartH = 40;

  const Cval = Math.max(100, C);
  const logVal = Math.log10(Cval);
  const clampedLog = Math.min(Math.max(logVal, logMin), logMax);
  const currentX = startX + ((clampedLog - logMin) / (logMax - logMin)) * chartW;

  const xLow = startX + ((4 - logMin) / (logMax - logMin)) * chartW;
  const xMed = startX + ((6 - logMin) / (logMax - logMin)) * chartW;

  svg.innerHTML = `
    <!-- Range Bars -->
    <rect x="${startX}" y="${chartY}" width="${xLow - startX}" height="${chartH}" fill="#e2e8f0" rx="4"></rect>
    <rect x="${xLow}" y="${chartY}" width="${xMed - xLow}" height="${chartH}" fill="#ccfbf1"></rect>
    <rect x="${xMed}" y="${chartY}" width="${startX + chartW - xMed}" height="${chartH}" fill="#99f6e4" rx="4"></rect>

    <!-- Range labels -->
    <text x="${(startX + xLow) / 2}" y="${chartY + 24}" text-anchor="middle" fill="#64748b" font-size="10" font-weight="600">Baja</text>
    <text x="${(xLow + xMed) / 2}" y="${chartY + 24}" text-anchor="middle" fill="#0f766e" font-size="10" font-weight="600">Moderada</text>
    <text x="${(xMed + startX + chartW) / 2}" y="${chartY + 24}" text-anchor="middle" fill="#0d9488" font-size="10" font-weight="700">Eubiótica Alta</text>

    <!-- Value Indicator Pin -->
    <line x1="${currentX}" y1="${chartY - 8}" x2="${currentX}" y2="${chartY + chartH + 8}" stroke="#0f172a" stroke-width="2.5"></line>
    <circle cx="${currentX}" cy="${chartY + chartH / 2}" r="7" fill="#0f172a" stroke="#ffffff" stroke-width="2"></circle>

    <!-- Legend ticks -->
    <text x="${startX}" y="${chartY + chartH + 24}" fill="#94a3b8" font-size="9">10²</text>
    <text x="${xLow}" y="${chartY + chartH + 24}" text-anchor="middle" fill="#94a3b8" font-size="9">10⁴</text>
    <text x="${xMed}" y="${chartY + chartH + 24}" text-anchor="middle" fill="#94a3b8" font-size="9">10⁶</text>
    <text x="${startX + chartW}" y="${chartY + chartH + 24}" text-anchor="end" fill="#94a3b8" font-size="9">10⁸ UFC/mL</text>
  `;
}

/* ═══════════════════════════════════════════════════════════════════════════
   G. CALCULADORA 2 — EFICIENCIA DE TRANSFERENCIA R = (Cn / Cm) × 100%
   ═══════════════════════════════════════════════════════════════════════════ */
function initCalc2() {
  const btnCalc = document.getElementById('c2_btn_calc');
  const btnReset = document.getElementById('c2_btn_reset');
  const inputCm = document.getElementById('c2_cm');
  const inputCn = document.getElementById('c2_cn');

  function calculate() {
    const errorBox = document.getElementById('c2_error');
    const resultEl = document.getElementById('c2_result_val');
    const badgeEl = document.getElementById('c2_classification_badge');
    const procEl = document.getElementById('c2_procedure_text');

    const Cm = parseFloat(inputCm?.value);
    const Cn = parseFloat(inputCn?.value);

    if (isNaN(Cm) || Cm <= 0 || isNaN(Cn) || Cn < 0) {
      if (errorBox) {
        errorBox.textContent = 'Ingresa valores válidos (Concentración materna > 0, neonatal ≥ 0).';
        errorBox.style.display = 'block';
      }
      return;
    }
    if (errorBox) errorBox.style.display = 'none';

    const ratio = (Cn / Cm) * 100;
    const formattedRatio = ratio.toFixed(1);

    if (resultEl) resultEl.textContent = formattedRatio;

    if (badgeEl) {
      if (ratio >= 40) {
        badgeEl.textContent = 'Transferencia mucosal elevada y eficiente (> 40%)';
        badgeEl.className = 'result-status-badge eubiosis';
      } else if (ratio >= 15) {
        badgeEl.textContent = 'Transferencia fisiológica representativa (15% a 40%)';
        badgeEl.className = 'result-status-badge moderate';
      } else {
        badgeEl.textContent = 'Transferencia atenuada o inóculo reducido (< 15%)';
        badgeEl.className = 'result-status-badge';
      }
    }

    if (procEl) {
      procEl.innerHTML = `
        1. Fórmula: R = (C_neonatal / C_materna) × 100%<br>
        2. Sustitución: (${Cn.toLocaleString('es-MX')} / ${Cm.toLocaleString('es-MX')}) × 100%<br>
        3. Eficiencia relativa: <strong>${formattedRatio}%</strong>
      `;
    }

    renderC2Chart(Cm, Cn, ratio);
  }

  function reset() {
    if (inputCm) inputCm.value = '5000000';
    if (inputCn) inputCn.value = '1250000';
    calculate();
  }

  btnCalc?.addEventListener('click', calculate);
  btnReset?.addEventListener('click', reset);
  inputCm?.addEventListener('input', calculate);
  inputCn?.addEventListener('input', calculate);

  calculate();
}

function renderC2Chart(Cm, Cn, ratio) {
  const svg = document.getElementById('c2_chart');
  if (!svg) return;

  const maxVal = Math.max(Cm, Cn, 1);
  const chartH = 90;
  const baseY = 115;
  const barW = 85;

  const hM = (Cm / maxVal) * chartH;
  const hN = (Cn / maxVal) * chartH;

  svg.innerHTML = `
    <!-- Baseline -->
    <line x1="30" y1="${baseY}" x2="410" y2="${baseY}" stroke="#e2e8f0" stroke-width="1.5"></line>

    <!-- Maternal Bar -->
    <rect x="90" y="${baseY - hM}" width="${barW}" height="${hM}" fill="#0d9488" rx="6"></rect>
    <text x="${90 + barW / 2}" y="${baseY - hM - 8}" text-anchor="middle" font-size="11" font-weight="700" fill="#0f766e">${(Cm/1000000).toFixed(1)}M UFC</text>
    <text x="${90 + barW / 2}" y="${baseY + 18}" text-anchor="middle" font-size="11" font-weight="600" fill="#64748b">Materna (Cm)</text>

    <!-- Neonatal Bar -->
    <rect x="250" y="${baseY - hN}" width="${barW}" height="${hN}" fill="#2563eb" rx="6"></rect>
    <text x="${250 + barW / 2}" y="${baseY - hN - 8}" text-anchor="middle" font-size="11" font-weight="700" fill="#1d4ed8">${(Cn/1000000).toFixed(2)}M UFC</text>
    <text x="${250 + barW / 2}" y="${baseY + 18}" text-anchor="middle" font-size="11" font-weight="600" fill="#64748b">Neonato (Cn)</text>

    <!-- Transfer Connection Arrow -->
    <path d="M ${90 + barW} ${baseY - hM / 2} C 200 ${baseY - hM / 2}, 200 ${baseY - hN / 2}, 250 ${baseY - hN / 2}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4,4" fill="none"></path>
    <text x="215" y="${(baseY - hM / 2 + baseY - hN / 2) / 2 - 8}" text-anchor="middle" font-size="10" font-weight="700" fill="#0f172a">${ratio.toFixed(1)}%</text>
  `;
}

/* ═══════════════════════════════════════════════════════════════════════════
   H. CALCULADORA 3 — COEFICIENTE DE JACCARD J = |M ∩ N| / |M ∪ N|
   ═══════════════════════════════════════════════════════════════════════════ */
const speciesPool = [
  { id: 'lcrisp', name: 'Lactobacillus crispatus' },
  { id: 'ljens',  name: 'Lactobacillus jensenii' },
  { id: 'lgass',  name: 'Lactobacillus gasseri' },
  { id: 'liners', name: 'Lactobacillus iners' },
  { id: 'binf',   name: 'Bifidobacterium infantis' },
  { id: 'bbrev',  name: 'Bifidobacterium breve' },
  { id: 'bfrag',  name: 'Bacteroides fragilis' },
  { id: 'ecoli',  name: 'Escherichia coli' },
  { id: 'efaec',  name: 'Enterococcus faecalis' },
  { id: 'sagal',  name: 'Streptococcus agalactiae (SGB)' }
];

let mSelected = new Set(['lcrisp', 'ljens', 'lgass', 'ecoli']);
let nSelected = new Set(['lcrisp', 'ljens', 'binf', 'ecoli']);

function initCalc3() {
  const mListEl = document.getElementById('jaccardMaternalList');
  const nListEl = document.getElementById('jaccardNeonatalList');

  function renderChecklists() {
    if (mListEl) {
      mListEl.innerHTML = speciesPool.map(sp => `
        <label class="taxa-check-item">
          <input type="checkbox" data-sp="${sp.id}" data-set="M" ${mSelected.has(sp.id) ? 'checked' : ''}>
          <span><em>${sp.name}</em></span>
        </label>
      `).join('');
    }

    if (nListEl) {
      nListEl.innerHTML = speciesPool.map(sp => `
        <label class="taxa-check-item">
          <input type="checkbox" data-sp="${sp.id}" data-set="N" ${nSelected.has(sp.id) ? 'checked' : ''}>
          <span><em>${sp.name}</em></span>
        </label>
      `).join('');
    }

    // Attach listeners
    document.querySelectorAll('.taxa-check-item input').forEach(input => {
      input.addEventListener('change', e => {
        const id = e.target.getAttribute('data-sp');
        const setType = e.target.getAttribute('data-set');
        if (setType === 'M') {
          if (e.target.checked) mSelected.add(id); else mSelected.delete(id);
        } else {
          if (e.target.checked) nSelected.add(id); else nSelected.delete(id);
        }
        calculateJaccard();
      });
    });

    calculateJaccard();
  }

  function calculateJaccard() {
    const resultEl = document.getElementById('c3_result_val');
    const sharedEl = document.getElementById('c3_shared_val');
    const unionEl = document.getElementById('c3_union_val');
    const badgeEl = document.getElementById('c3_interpretation_badge');
    const mCountEl = document.getElementById('jaccardMCount');
    const nCountEl = document.getElementById('jaccardNCount');

    if (mCountEl) mCountEl.textContent = `${mSelected.size} especies`;
    if (nCountEl) nCountEl.textContent = `${nSelected.size} especies`;

    const shared = [...mSelected].filter(x => nSelected.has(x));
    const union = new Set([...mSelected, ...nSelected]);

    const countShared = shared.length;
    const countUnion = union.size;
    const J = countUnion > 0 ? (countShared / countUnion) * 100 : 0;
    const formattedJ = J.toFixed(1);

    if (resultEl) resultEl.textContent = formattedJ;
    if (sharedEl) sharedEl.textContent = countShared;
    if (unionEl) unionEl.textContent = countUnion;

    if (badgeEl) {
      if (J >= 50) {
        badgeEl.textContent = 'Elevada similitud y herencia comunitaria (> 50%)';
        badgeEl.className = 'result-status-badge eubiosis';
      } else if (J >= 25) {
        badgeEl.textContent = 'Similitud moderada típica de transición (25% a 50%)';
        badgeEl.className = 'result-status-badge moderate';
      } else {
        badgeEl.textContent = 'Baja coincidencia taxonómica (< 25%)';
        badgeEl.className = 'result-status-badge';
      }
    }

    renderJaccardVenn(mSelected.size - countShared, countShared, nSelected.size - countShared, formattedJ);
  }

  renderChecklists();
}

function renderJaccardVenn(onlyM, shared, onlyN, JVal) {
  const svg = document.getElementById('c3_venn_chart');
  if (!svg) return;

  svg.innerHTML = `
    <defs>
      <linearGradient id="gradVennM" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0d9488" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#0d9488" stop-opacity="0.15"/>
      </linearGradient>
      <linearGradient id="gradVennN" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#2563eb" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#2563eb" stop-opacity="0.35"/>
      </linearGradient>
    </defs>

    <!-- Circle M (Mother) -->
    <circle cx="170" cy="110" r="75" fill="url(#gradVennM)" stroke="#0d9488" stroke-width="2.5"></circle>

    <!-- Circle N (Neonate) -->
    <circle cx="290" cy="110" r="75" fill="url(#gradVennN)" stroke="#2563eb" stroke-width="2.5"></circle>

    <!-- Labels inside regions -->
    <text x="135" y="115" text-anchor="middle" font-size="14" font-weight="800" fill="#0f766e">${onlyM}</text>
    <text x="135" y="132" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">Exclusivas M</text>

    <text x="230" y="110" text-anchor="middle" font-size="18" font-weight="800" fill="#0f172a">${shared}</text>
    <text x="230" y="128" text-anchor="middle" font-size="10" font-weight="700" fill="#0d9488">Compartidas</text>

    <text x="325" y="115" text-anchor="middle" font-size="14" font-weight="800" fill="#1d4ed8">${onlyN}</text>
    <text x="325" y="132" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">Exclusivas N</text>

    <!-- Header Tags -->
    <text x="120" y="24" text-anchor="middle" font-size="11" font-weight="700" fill="#0d9488">Conjunto Materno (M)</text>
    <text x="340" y="24" text-anchor="middle" font-size="11" font-weight="700" fill="#2563eb">Conjunto Neonatal (N)</text>

    <!-- Jaccard Score Banner at Bottom -->
    <text x="230" y="205" text-anchor="middle" font-size="12" font-weight="700" fill="#0f172a">Índice J = ${JVal}%</text>
  `;
}

/* ═══════════════════════════════════════════════════════════════════════════
   I. CALCULADORA 4 — DIVERSIDAD SHANNON-WIENER H' = -Σ p_i ln(p_i)
   ═══════════════════════════════════════════════════════════════════════════ */
let shannonData = [
  { name: 'Lactobacillus crispatus', count: 4500000 },
  { name: 'Bifidobacterium infantis', count: 2800000 },
  { name: 'Escherichia coli', count: 850000 },
  { name: 'Lactobacillus jensenii', count: 650000 },
  { name: 'Enterococcus faecalis', count: 220000 }
];

function initCalc4() {
  const tbody = document.getElementById('shannonTableBody');
  const btnAdd = document.getElementById('btnAddShannonRow');

  function renderTable() {
    if (!tbody) return;

    const totalN = shannonData.reduce((acc, curr) => acc + (parseFloat(curr.count) || 0), 0);
    const S = shannonData.length;

    let H = 0;
    const computedRows = shannonData.map((item, idx) => {
      const c = parseFloat(item.count) || 0;
      const pi = totalN > 0 ? c / totalN : 0;
      let contrib = 0;
      if (pi > 0) {
        contrib = -pi * Math.log(pi);
        H += contrib;
      }
      return { ...item, pi, contrib, idx };
    });

    tbody.innerHTML = computedRows.map(row => `
      <tr>
        <td>
          <input type="text" class="shannon-name-input form-input" value="${row.name}" data-idx="${row.idx}" style="padding:0.4rem 0.6rem;font-size:0.85rem;">
        </td>
        <td>
          <input type="number" class="shannon-count-input form-input" value="${row.count}" min="0" step="1000" data-idx="${row.idx}" style="padding:0.4rem 0.6rem;font-size:0.85rem;">
        </td>
        <td style="font-family:var(--font-mono);">${row.pi.toFixed(3)}</td>
        <td style="font-family:var(--font-mono);">${row.contrib.toFixed(3)}</td>
        <td>
          ${shannonData.length > 2 ? `<button class="btn-row-del" data-idx="${row.idx}">&times;</button>` : ''}
        </td>
      </tr>
    `).join('');

    // Update totals
    const totalNEl = document.getElementById('shannonTotalN');
    const totalHEl = document.getElementById('shannonTotalH');
    const resultEl = document.getElementById('c4_result_val');
    const pielouEl = document.getElementById('c4_pielou_val');
    const richnessEl = document.getElementById('c4_richness_val');
    const badgeEl = document.getElementById('c4_interpretation_badge');

    if (totalNEl) totalNEl.textContent = totalN.toLocaleString('es-MX');
    if (totalHEl) totalHEl.textContent = H.toFixed(3);
    if (resultEl) resultEl.textContent = H.toFixed(3);
    if (richnessEl) richnessEl.textContent = S;

    const pielou = S > 1 ? H / Math.log(S) : 0;
    if (pielouEl) pielouEl.textContent = pielou.toFixed(2);

    if (badgeEl) {
      if (H >= 2.0) {
        badgeEl.textContent = 'Diversidad elevada eubiótica (H\' ≥ 2.0)';
        badgeEl.className = 'result-status-badge eubiosis';
      } else if (H >= 1.0) {
        badgeEl.textContent = 'Comunidad oligotrófica pionera típica (1.0 ≤ H\' < 2.0)';
        badgeEl.className = 'result-status-badge moderate';
      } else {
        badgeEl.textContent = 'Baja diversidad o mono-dominancia (H\' < 1.0)';
        badgeEl.className = 'result-status-badge';
      }
    }

    renderStackedBar(computedRows);
    attachTableEvents();
  }

  function attachTableEvents() {
    document.querySelectorAll('.shannon-name-input').forEach(inp => {
      inp.addEventListener('change', e => {
        const idx = parseInt(e.target.getAttribute('data-idx'), 10);
        shannonData[idx].name = e.target.value;
        renderTable();
      });
    });

    document.querySelectorAll('.shannon-count-input').forEach(inp => {
      inp.addEventListener('input', e => {
        const idx = parseInt(e.target.getAttribute('data-idx'), 10);
        shannonData[idx].count = parseFloat(e.target.value) || 0;
        renderTable();
      });
    });

    document.querySelectorAll('.btn-row-del').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.getAttribute('data-idx'), 10);
        shannonData.splice(idx, 1);
        renderTable();
      });
    });
  }

  btnAdd?.addEventListener('click', () => {
    shannonData.push({ name: 'Nueva especie bacteriana', count: 100000 });
    renderTable();
  });

  renderTable();
}

function renderStackedBar(rows) {
  const barContainer = document.getElementById('c4_proportional_bar');
  const legendContainer = document.getElementById('c4_proportional_legend');
  if (!barContainer || !legendContainer) return;

  const colors = ['#0d9488', '#2563eb', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#6366f1'];

  barContainer.innerHTML = rows.map((r, i) => {
    const pct = (r.pi * 100).toFixed(1);
    const color = colors[i % colors.length];
    return `<div style="width:${pct}%;background-color:${color};height:100%;" title="${r.name}: ${pct}%"></div>`;
  }).join('');

  legendContainer.innerHTML = rows.map((r, i) => {
    const pct = (r.pi * 100).toFixed(1);
    const color = colors[i % colors.length];
    return `
      <div style="display:inline-flex;align-items:center;gap:0.35rem;">
        <span style="width:10px;height:10px;border-radius:2px;background-color:${color};"></span>
        <span>${r.name}: <strong>${pct}%</strong></span>
      </div>
    `;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════════════════
   J. SIMULADOR DINÁMICO DE VERHULST (CÁLCULO INTEGRAL Y DIFERENCIAL I)
   ═══════════════════════════════════════════════════════════════════════════ */
function initVerhulstSimulator() {
  const canvas = document.getElementById('verhulstCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderN0 = document.getElementById('simN0');
  const sliderR  = document.getElementById('simR');
  const sliderK  = document.getElementById('simK');
  const sliderT  = document.getElementById('simT');

  const lblN0 = document.getElementById('lblN0');
  const lblR  = document.getElementById('lblR');
  const lblK  = document.getElementById('lblK');
  const lblT  = document.getElementById('lblT');

  const outNT        = document.getElementById('simResultNT');
  const outMaxRate   = document.getElementById('simResultMaxRate');
  const outInflect   = document.getElementById('simResultInflection');
  const outIntegral  = document.getElementById('simResultIntegral');
  const telemetryBox = document.getElementById('simTelemetry');

  let mouseT = null;

  function calculateN(t, N0, r, K) {
    if (t <= 0) return N0;
    const A = (K - N0) / N0;
    return K / (1 + A * Math.exp(-r * t));
  }

  function calculateRate(N, r, K) {
    return r * N * (1 - N / K);
  }

  function calculateTrapezoidalIntegral(N0, r, K, tMax, steps = 120) {
    const dt = tMax / steps;
    let sum = 0.5 * (calculateN(0, N0, r, K) + calculateN(tMax, N0, r, K));
    for (let i = 1; i < steps; i++) {
      sum += calculateN(i * dt, N0, r, K);
    }
    return sum * dt;
  }

  function update() {
    const N0 = parseFloat(sliderN0.value);
    const r  = parseFloat(sliderR.value);
    const K  = parseFloat(sliderK.value);
    const T  = parseFloat(sliderT.value);

    if (lblN0) lblN0.textContent = N0.toLocaleString('es-MX');
    if (lblR)  lblR.textContent = r.toFixed(2);
    if (lblK)  lblK.textContent = K.toLocaleString('es-MX');
    if (lblT)  lblT.textContent = T;

    const NT = calculateN(T, N0, r, K);
    const maxRate = (r * K) / 4; // inflection point rate
    const tInflect = Math.log((K - N0) / N0) / r;
    const integralVal = calculateTrapezoidalIntegral(N0, r, K, T);

    if (outNT) outNT.textContent = `${Math.round(NT).toLocaleString('es-MX')} UFC`;
    if (outMaxRate) outMaxRate.textContent = `${Math.round(maxRate).toLocaleString('es-MX')} UFC/h`;
    if (outInflect) outInflect.textContent = tInflect > 0 ? `${tInflect.toFixed(1)} h` : 'Ya alcanzado';
    if (outIntegral) outIntegral.textContent = `${Math.round(integralVal).toLocaleString('es-MX')} UFC·h`;

    drawChart(N0, r, K, T, tInflect);
  }

  function drawChart(N0, r, K, T, tInflect) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.offsetWidth || 840;
    const h = 360;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const padLeft = 60;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 45;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Background
    ctx.fillStyle = '#0b1325';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padTop + (plotH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();

      const val = K * (1 - i / 5);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono"';
      ctx.textAlign = 'right';
      ctx.fillText((val / 1000).toFixed(0) + 'k', padLeft - 10, y + 3);
    }

    for (let i = 0; i <= 6; i++) {
      const x = padLeft + (plotW / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
      ctx.stroke();

      const timeVal = (T / 6) * i;
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.fillText(timeVal.toFixed(0) + 'h', x, padTop + plotH + 18);
    }

    // Function to map coords
    const toX = t => padLeft + (t / T) * plotW;
    const toY = n => padTop + (1 - n / K) * plotH;

    // Gradient Area under curve
    const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    grad.addColorStop(0, 'rgba(45, 212, 191, 0.35)');
    grad.addColorStop(1, 'rgba(45, 212, 191, 0.02)');

    ctx.beginPath();
    ctx.moveTo(toX(0), toY(N0));
    const steps = 100;
    for (let i = 1; i <= steps; i++) {
      const t = (T / steps) * i;
      ctx.lineTo(toX(t), toY(calculateN(t, N0, r, K)));
    }
    ctx.lineTo(toX(T), padTop + plotH);
    ctx.lineTo(toX(0), padTop + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Curve Line
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(N0));
    for (let i = 1; i <= steps; i++) {
      const t = (T / steps) * i;
      ctx.lineTo(toX(t), toY(calculateN(t, N0, r, K)));
    }
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inflection point marker
    if (tInflect > 0 && tInflect <= T) {
      const inflectX = toX(tInflect);
      const inflectY = toY(K / 2);

      ctx.beginPath();
      ctx.arc(inflectX, inflectY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fef3c7';
      ctx.font = '10px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.fillText(`Inflexión t*=${tInflect.toFixed(1)}h`, inflectX, inflectY - 12);
    }

    // Mouse Tracking Hover Crosshair
    if (mouseT !== null && mouseT >= 0 && mouseT <= T) {
      const crossX = toX(mouseT);
      const valAtT = calculateN(mouseT, N0, r, K);
      const crossY = toY(valAtT);
      const rateAtT = calculateRate(valAtT, r, K);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(crossX, padTop);
      ctx.lineTo(crossX, padTop + plotH);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(padLeft, crossY);
      ctx.lineTo(padLeft + plotW, crossY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point circle
      ctx.beginPath();
      ctx.arc(crossX, crossY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (telemetryBox) {
        telemetryBox.innerHTML = `Tiempo: <strong>${mouseT.toFixed(1)} h</strong> &middot; Población N(t): <strong>${Math.round(valAtT).toLocaleString('es-MX')} UFC</strong> &middot; Tasa dN/dt: <strong>${Math.round(rateAtT).toLocaleString('es-MX')} UFC/h</strong>`;
      }
    }
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padLeft = 60;
    const padRight = 30;
    const w = canvas.offsetWidth;
    const plotW = w - padLeft - padRight;
    const T = parseFloat(sliderT.value);

    if (x >= padLeft && x <= padLeft + plotW) {
      mouseT = ((x - padLeft) / plotW) * T;
    } else {
      mouseT = null;
    }
    update();
  });

  canvas.addEventListener('mouseleave', () => {
    mouseT = null;
    if (telemetryBox) {
      telemetryBox.textContent = 'Pasa el cursor sobre la curva para explorar la tasa instantánea en cada hora t.';
    }
    update();
  });

  [sliderN0, sliderR, sliderK, sliderT].forEach(s => s?.addEventListener('input', update));

  update();
}

/* ═══════════════════════════════════════════════════════════════════════════
   K. UTILIDADES, SCROLL REVEAL & KATEX
   ═══════════════════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  elements.forEach(el => observer.observe(el));
}

function animateValue(obj, start, end, duration, locale = false) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease out
    const currentVal = Math.floor(easeProgress * (end - start) + start);
    obj.textContent = locale ? currentVal.toLocaleString('es-MX') : currentVal;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function initKaTeX() {
  if (typeof renderMathInElement === 'undefined') {
    setTimeout(initKaTeX, 120);
    return;
  }
  try {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
  } catch (e) {
    console.warn('KaTeX init error:', e);
  }
}

function reRenderKaTeX(container) {
  if (!container || typeof renderMathInElement === 'undefined') return;
  try {
    renderMathInElement(container, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
  } catch (e) {
    console.warn('KaTeX re-render error:', e);
  }
}
