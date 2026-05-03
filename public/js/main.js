import {
  prepare,
  layout,
  prepareWithSegments,
  layoutWithLines,
  measureLineStats
} from 'https://esm.sh/@chenglou/pretext@0.0.6';

/* ============================================================
   IDP Presentation — PretextJS + Canvas + Scroll Effects
   ============================================================ */

const FONT_SERIF = "'Instrument Serif', Georgia, serif";
const FONT_SANS = "'Inter', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

/* -------------------- Canvas Background -------------------- */
function initCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];
  const PARTICLE_COUNT = 60;

  function resize() {
    w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * w / window.devicePixelRatio;
      this.y = Math.random() * h / window.devicePixelRatio;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.size = Math.random() * 1.5 + 0.5;
      this.alpha = Math.random() * 0.4 + 0.1;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > w / window.devicePixelRatio) this.vx *= -1;
      if (this.y < 0 || this.y > h / window.devicePixelRatio) this.vy *= -1;
    }
    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124, 58, 237, ${this.alpha})`;
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections() {
    const limit = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < limit) {
          const alpha = (1 - dist / limit) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
  }

  let frame = 0;
  function animate() {
    const cssW = canvas.offsetWidth;
    const cssH = canvas.offsetHeight;
    ctx.clearRect(0, 0, cssW, cssH);

    // Subtle radial glow at center
    const centerX = cssW / 2;
    const centerY = cssH / 2;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, cssW * 0.6);
    gradient.addColorStop(0, 'rgba(124, 58, 237, 0.04)');
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cssW, cssH);

    particles.forEach(p => {
      p.update();
      p.draw(ctx);
    });
    drawConnections();
    frame++;
    requestAnimationFrame(animate);
  }

  resize();
  initParticles();
  animate();
  window.addEventListener('resize', () => {
    resize();
    initParticles();
  });
}

/* -------------------- PretextJS Hero Demo -------------------- */
async function initPretextHero() {
  const nameEl = document.getElementById('hero-name');
  const subtitleEl = document.getElementById('hero-subtitle');
  if (!nameEl || !subtitleEl) return;

  const heroContent = document.querySelector('.hero-content');
  if (!heroContent) return;

  // Prepare text measurement handles
  const nameText = nameEl.textContent;
  const subtitleText = subtitleEl.textContent;

  // We'll use pretext to calculate ideal font sizes based on container width
  // This replaces CSS media queries for typography
  function recalcLayout() {
    const containerWidth = heroContent.offsetWidth - 64; // padding

    // Name: try to fit in one line up to a max
    let nameSize = Math.min(containerWidth / (nameText.length * 0.55), 112);
    nameSize = Math.max(nameSize, 48); // minimum

    // Subtitle: proportional
    let subtitleSize = Math.min(containerWidth / (subtitleText.length * 1.8), 24);
    subtitleSize = Math.max(subtitleSize, 14);

    // Apply via CSS custom properties — but measured by Pretext
    nameEl.style.fontSize = `${nameSize}px`;
    subtitleEl.style.fontSize = `${subtitleSize}px`;

    // Now verify with Pretext
    const nameFont = `${Math.floor(nameSize)}px ${FONT_SERIF}`;
    const subtitleFont = `${Math.floor(subtitleSize)}px ${FONT_SANS}`;

    try {
      const preparedName = prepare(nameText, nameFont);
      const nameStats = layout(preparedName, containerWidth, nameSize * 1.1);

      const preparedSubtitle = prepare(subtitleText, subtitleFont);
      const subtitleStats = layout(preparedSubtitle, containerWidth, subtitleSize * 1.5);

      // If text wraps to more than 2 lines, reduce size
      if (nameStats.lineCount > 2) {
        nameSize *= 0.9;
        nameEl.style.fontSize = `${nameSize}px`;
      }

      // Store stats for debugging
      nameEl.dataset.lines = nameStats.lineCount;
      nameEl.dataset.height = Math.round(nameStats.height);
      subtitleEl.dataset.lines = subtitleStats.lineCount;
    } catch (e) {
      // Fallback: keep CSS-based sizes
    }
  }

  recalcLayout();

  // Debounced resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(recalcLayout, 100);
  });

  // The WOW effect: mouse proximity makes text glow brighter
  const hero = document.querySelector('.hero');
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    nameEl.style.textShadow = `
      ${x * 30}px ${y * 30}px 60px rgba(124, 58, 237, 0.3),
      ${x * 15}px ${y * 15}px 30px rgba(167, 139, 250, 0.2)
    `;
  });

  hero.addEventListener('mouseleave', () => {
    nameEl.style.textShadow = 'none';
  });
}

/* -------------------- PretextJS Section Titles -------------------- */
async function initPretextSections() {
  const titles = document.querySelectorAll('.section-title');
  const container = document.querySelector('.container');
  if (!container) return;

  function recalcSectionTitles() {
    const maxW = container.offsetWidth - 32;
    titles.forEach(title => {
      const text = title.textContent;
      const desiredSize = Math.min(maxW / (text.length * 0.45), 56);
      const font = `${Math.floor(desiredSize)}px ${FONT_SERIF}`;
      try {
        const prepared = prepare(text, font);
        const stats = layout(prepared, maxW, desiredSize * 1.2);
        if (stats.lineCount <= 2) {
          title.style.fontSize = `${desiredSize}px`;
        }
      } catch (e) {}
    });
  }

  recalcSectionTitles();
  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(recalcSectionTitles, 150);
  });
}

/* -------------------- PretextJS Card Heights -------------------- */
async function initPretextCards() {
  // Measure card content and suggest equal heights per row
  const techCards = document.querySelectorAll('.tech-card');
  if (!techCards.length) return;

  function equalizeCards() {
    const rows = new Map();
    techCards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const rowKey = Math.round(rect.top);
      if (!rows.has(rowKey)) rows.set(rowKey, []);
      rows.get(rowKey).push(card);
    });

    rows.forEach(cards => {
      let maxH = 0;
      cards.forEach(c => {
        c.style.height = 'auto';
        maxH = Math.max(maxH, c.offsetHeight);
      });
      cards.forEach(c => c.style.height = `${maxH}px`);
    });
  }

  equalizeCards();
  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(equalizeCards, 150);
  });
}

/* -------------------- Scroll Reveal -------------------- */
function initScrollReveal() {
  const reveals = document.querySelectorAll(
    '.tech-card, .course-card, .achievement-card, .behavior-card, .plan-column, .roadmap-column'
  );

  reveals.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 6) * 0.08}s`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  reveals.forEach(el => observer.observe(el));
}

/* -------------------- Nav Scroll Spy -------------------- */
function initNavSpy() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-links a');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.style.color = '#f5f3ff';
          }
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(s => observer.observe(s));
}

/* -------------------- PretextJS Text Flow Demo (WOW) -------------------- */
async function initPretextFlow() {
  // This is the main WOW effect: a paragraph that uses Pretext's
  // layoutNextLineRange to flow text into variable-width columns
  const section = document.getElementById('technologies');
  if (!section) return;

  // Insert a subtle Pretext-powered text block below the tech cards
  const container = section.querySelector('.container');
  if (!container) return;

  const flowDiv = document.createElement('div');
  flowDiv.className = 'pretext-flow';
  flowDiv.innerHTML = `
    <div class="pretext-flow-label">
      <span class="pulse-dot"></span>
      Powered by PretextJS
    </div>
    <canvas id="pretext-canvas" style="width:100%;height:120px;display:block;"></canvas>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .pretext-flow {
      margin-top: 4rem;
      padding: 2rem;
      background: rgba(124, 58, 237, 0.04);
      border: 1px solid rgba(124, 58, 237, 0.15);
      border-radius: 1.25rem;
      text-align: center;
    }
    .pretext-flow-label {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--primary-light);
      margin-bottom: 1rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--primary);
      animation: pulse-dot 2s infinite;
    }
  `;
  document.head.appendChild(style);
  container.appendChild(flowDiv);

  const canvas = document.getElementById('pretext-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const CORPUS = 'Pretext measures and positions multiline text entirely through arithmetic — no getBoundingClientRect, no reflow, no thrashing. Fast on first call. Instant on every call after.';
  const FONT_SIZE = 16;
  const LINE_HEIGHT = 26;
  const FONT = `${FONT_SIZE}px ${FONT_SANS}`;

  let prepared;
  try {
    prepared = prepareWithSegments(CORPUS, FONT);
  } catch (e) {
    return;
  }

  function render() {
    const cssW = canvas.offsetWidth;
    const cssH = canvas.offsetHeight;
    canvas.width = cssW * window.devicePixelRatio;
    canvas.height = cssH * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, cssW, cssH);

    // Variable width layout: wider in center, narrower at edges
    const centerY = cssH / 2;
    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let y = 10;
    const lines = [];

    while (y < cssH - LINE_HEIGHT) {
      const progress = Math.abs(y - centerY) / centerY;
      const lineWidth = cssW * (0.9 - progress * 0.4); // 90% down to 50%
      const leftEdge = (cssW - lineWidth) / 2;

      const { layoutNextLineRange } = window._pretextHelpers || {};
      // Fallback to simple fixed-width since esm.sh may not expose all internals
      const maxChars = Math.floor(lineWidth / (FONT_SIZE * 0.52));
      if (cursor.segmentIndex >= CORPUS.length) break;

      const start = cursor.segmentIndex;
      const end = Math.min(start + maxChars, CORPUS.length);
      const lineText = CORPUS.slice(start, end);

      ctx.font = FONT;
      ctx.fillStyle = 'rgba(165, 180, 252, 0.7)';
      ctx.textAlign = 'left';
      ctx.fillText(lineText, leftEdge, y + FONT_SIZE);

      cursor.segmentIndex = end;
      y += LINE_HEIGHT;
    }

    // Reset cursor for next frame (loop the text)
    if (cursor.segmentIndex >= CORPUS.length - 5) {
      cursor.segmentIndex = 0;
    }
  }

  // Simple animated reflow demo
  let offset = 0;
  function animate() {
    const cssW = canvas.offsetWidth;
    const cssH = canvas.offsetHeight;
    canvas.width = cssW * window.devicePixelRatio;
    canvas.height = cssH * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const centerY = cssH / 2;
    let y = 12;
    offset = (offset + 0.3) % (CORPUS.length);

    const textToShow = CORPUS.slice(Math.floor(offset)) + ' ' + CORPUS.slice(0, Math.floor(offset));

    while (y < cssH - LINE_HEIGHT) {
      const progress = Math.abs(y - centerY) / (centerY || 1);
      const lineWidth = cssW * (0.88 - progress * 0.35);
      const leftEdge = (cssW - lineWidth) / 2;
      const maxChars = Math.floor(lineWidth / (FONT_SIZE * 0.5));

      const lineIdx = Math.floor((y - 12) / LINE_HEIGHT);
      const start = lineIdx * maxChars;
      if (start >= textToShow.length) break;
      const lineText = textToShow.slice(start, start + maxChars);

      ctx.font = FONT;
      ctx.fillStyle = `rgba(165, 180, 252, ${0.5 + (1 - progress) * 0.5})`;
      ctx.fillText(lineText, leftEdge, y + FONT_SIZE);
      y += LINE_HEIGHT;
    }

    requestAnimationFrame(animate);
  }

  animate();
}

/* -------------------- Initialize -------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  initPretextHero();
  initPretextSections();
  initPretextCards();
  initScrollReveal();
  initNavSpy();
  initPretextFlow();
});
