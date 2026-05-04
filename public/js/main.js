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

/* -------------------- Design Upgrades -------------------- */

/* Grain texture overlay */
function initGrain() {
  const canvas = document.createElement('canvas');
  canvas.id = 'grain-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;opacity:0.04;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let w, h;
  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  function noise() {
    const idata = ctx.createImageData(w, h);
    const buffer = idata.data;
    for (let i = 0; i < buffer.length; i += 4) {
      const v = Math.random() * 255;
      buffer[i] = v;
      buffer[i+1] = v;
      buffer[i+2] = v;
      buffer[i+3] = 255;
    }
    ctx.putImageData(idata, 0, 0);
    requestAnimationFrame(noise);
  }
  resize();
  noise();
  window.addEventListener('resize', resize);
}

/* Custom cursor glow */
function initCursorGlow() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  let mx = -100, my = -100, cx = -100, cy = -100;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  function animate() {
    cx += (mx - cx) * 0.12;
    cy += (my - cy) * 0.12;
    glow.style.transform = `translate(${cx - 150}px, ${cy - 150}px)`;
    requestAnimationFrame(animate);
  }
  animate();
}

/* Text scramble on section titles */
function initTextScramble() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const titles = document.querySelectorAll('.section-title');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.scrambled) {
        entry.target.dataset.scrambled = '1';
        const original = entry.target.textContent;
        let iter = 0;
        const interval = setInterval(() => {
          entry.target.textContent = original.split('').map((char, i) => {
            if (char === ' ') return ' ';
            if (i < iter) return original[i];
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('');
          if (iter >= original.length) clearInterval(interval);
          iter += 1/2;
        }, 30);
      }
    });
  }, { threshold: 0.5 });
  titles.forEach(t => observer.observe(t));
}

/* Magnetic hover on tech cards */
function initMagneticCards() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const cards = document.querySelectorAll('.tech-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) translateY(-8px) scale(1.03)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* -------------------- Initialize -------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  initPretextHero();
  initPretextSections();
  initPretextCards();
  initScrollReveal();
  initNavSpy();
  initGrain();
  initCursorGlow();
  initTextScramble();
  initMagneticCards();
});
