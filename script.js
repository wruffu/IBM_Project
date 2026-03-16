/* ============================================================
   williamruffu.com — Portfolio Scripts v2
   ============================================================ */
'use strict';

/* =========================================================
   HERO CANVAS: Highway + Star Field + Particle Constellation
   ========================================================= */
class HeroCanvas {
  constructor(id) {
    this.canvas = document.getElementById(id);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.mouse = { x: -999, y: -999 };
    this.stars = [];
    this.particles = [];
    this.running = false;

    this._onResize = this.resize.bind(this);
    this._onMouse = (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; };

    window.addEventListener('resize', this._onResize);
    window.addEventListener('mousemove', this._onMouse);

    this.resize();
    this.start();
  }

  resize() {
    this.W = this.canvas.width  = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;
    this.VP = { x: this.W / 2, y: this.H * 0.40 };
    this._initParticles();
    this._initStars();
  }

  _initStars() {
    this.stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * this.W,
      y: Math.random() * (this.VP.y + 30),
      r: Math.random() * 1.1 + 0.2,
      a: Math.random() * 0.65 + 0.1,
      phase: Math.random() * Math.PI * 2,
      spd: 0.35 + Math.random() * 1.2,
    }));
  }

  _initParticles() {
    const count = Math.min(65, Math.max(30, Math.floor(this.W / 22)));
    this.particles = Array.from({ length: count }, () => ({
      x: Math.random() * this.W,
      y: Math.random() * (this.VP.y + 10),
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.16,
      r: Math.random() * 1.6 + 0.5,
    }));
  }

  start() {
    this.running = true;
    const tick = (ts) => {
      if (!this.running) return;
      this._render(ts);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  _render(ts) {
    const t = ts * 0.001;
    const { ctx, W, H, VP, mouse } = this;

    ctx.clearRect(0, 0, W, H);

    // ── Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, VP.y + 70);
    sky.addColorStop(0,   '#010108');
    sky.addColorStop(0.55, '#040410');
    sky.addColorStop(1,   '#08081a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, VP.y + 70);

    // ── Ground gradient
    const gnd = ctx.createLinearGradient(0, VP.y, 0, H);
    gnd.addColorStop(0, '#060614');
    gnd.addColorStop(1, '#0e0e22');
    ctx.fillStyle = gnd;
    ctx.fillRect(0, VP.y, W, H);

    // ── Twinkling stars
    this.stars.forEach(s => {
      const a = s.a * (0.45 + 0.55 * Math.sin(t * s.spd + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210,215,255,${a})`;
      ctx.fill();
    });

    // ── Move particles (bounce at VP boundary)
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > VP.y + 10) p.vy *= -1;
    });

    // ── Particle connections + mouse lines
    const maxD = 125, mxD = 190;
    for (let i = 0; i < this.particles.length; i++) {
      const a = this.particles[i];

      for (let j = i + 1; j < this.particles.length; j++) {
        const b = this.particles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < maxD) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(245,158,11,${(1 - d / maxD) * 0.13})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }

      // Mouse proximity
      const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (dm < mxD && mouse.y < VP.y + 40) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(245,158,11,${(1 - dm / mxD) * 0.42})`;
        ctx.lineWidth = 0.85;
        ctx.stroke();
      }

      const glow = dm < mxD ? 0.75 : 0.28;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,158,11,${glow})`;
      ctx.fill();
    }

    // ── Horizon amber glow
    const hg = ctx.createRadialGradient(VP.x, VP.y, 0, VP.x, VP.y, W * 0.52);
    hg.addColorStop(0,   'rgba(245,158,11,0.11)');
    hg.addColorStop(0.3, 'rgba(245,158,11,0.04)');
    hg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, W, H);

    // ── Road surface
    const rHalfBot = W * 0.36;
    const rHalfTop = 9;

    ctx.beginPath();
    ctx.moveTo(VP.x - rHalfTop, VP.y);
    ctx.lineTo(VP.x + rHalfTop, VP.y);
    ctx.lineTo(VP.x + rHalfBot, H);
    ctx.lineTo(VP.x - rHalfBot, H);
    ctx.closePath();

    const rd = ctx.createLinearGradient(0, VP.y, 0, H);
    rd.addColorStop(0,   '#0d0d1e');
    rd.addColorStop(0.4, '#101026');
    rd.addColorStop(1,   '#18182e');
    ctx.fillStyle = rd;
    ctx.fill();

    // ── Road edge lines with glow
    for (const s of [-1, 1]) {
      // Soft outer glow
      ctx.beginPath();
      ctx.moveTo(VP.x + s * rHalfTop, VP.y);
      ctx.lineTo(VP.x + s * rHalfBot, H);
      ctx.strokeStyle = 'rgba(245,158,11,0.10)';
      ctx.lineWidth = 12;
      ctx.stroke();
      // Crisp inner line
      ctx.beginPath();
      ctx.moveTo(VP.x + s * rHalfTop, VP.y);
      ctx.lineTo(VP.x + s * rHalfBot, H);
      ctx.strokeStyle = 'rgba(245,158,11,0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // ── Animated center lane dashes
    const nD = 14, spd = 0.55;
    for (let i = 0; i < nD; i++) {
      const p  = ((i / nD) + t * spd) % 1;
      const sc = p * p; // perspective squeeze at horizon
      const y  = VP.y + (H - VP.y) * p;
      const dw = Math.max(2, 7 * sc);
      const dh = Math.max(4, (H - VP.y) / nD * 0.5 * sc);
      ctx.fillStyle = `rgba(245,158,11,${Math.min(1, p * 2.8) * 0.9})`;
      ctx.fillRect(VP.x - dw / 2, y - dh / 2, dw, dh);
    }

    // ── Side lane dividers (subtle)
    for (const s of [-1, 1]) {
      const xBot = VP.x + s * rHalfBot * 0.54;
      const xTop = VP.x + s * rHalfTop * 0.54;
      const nS = 10;
      for (let i = 0; i < nS; i++) {
        const p  = ((i / nS) + t * spd) % 1;
        const sc = p * p;
        const y  = VP.y + (H - VP.y) * p;
        const x  = xTop + (xBot - xTop) * p;
        const dw = Math.max(1, 3 * sc);
        const dh = Math.max(2, (H - VP.y) / nS * 0.32 * sc);
        ctx.fillStyle = `rgba(245,158,11,${Math.min(1, p * 2.8) * 0.25})`;
        ctx.fillRect(x - dw / 2, y - dh / 2, dw, dh);
      }
    }

    // ── Vignette
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.82);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  destroy() {
    this.running = false;
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('mousemove', this._onMouse);
  }
}

/* =========================================================
   AUTO-CALCULATING SKILL YEARS
   ========================================================= */
const startDates = {
  logistics:   '2007-01', excel:       '2007-01',
  sql:         '2019-01', tableau:     '2021-01',
  supplychain: '2007-01', python:      '2022-06',
  pytorch:     '2023-01', tensorflow:  '2023-01',
  opencv:      '2024-01', docker:      '2023-06',
};

function calcYears(str) {
  const [y, m] = str.split('-').map(Number);
  const diff = (Date.now() - new Date(y, m - 1, 1)) / (365.25 * 864e5);
  return Math.max(1, Math.floor(diff));
}

function applySkillYears() {
  document.querySelectorAll('[data-skill]').forEach(el => {
    const k = el.dataset.skill;
    if (startDates[k]) {
      const y = calcYears(startDates[k]);
      el.textContent = `${y} yr${y !== 1 ? 's' : ''}`;
    }
  });
}

/* =========================================================
   SCROLL-TRIGGERED COUNTERS
   ========================================================= */
function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting || e.target.dataset.done) return;
      e.target.dataset.done = '1';
      const target = parseInt(e.target.dataset.count, 10);
      const t0 = performance.now();
      const dur = 1400;
      const tick = (now) => {
        const ease = 1 - Math.pow(1 - Math.min((now - t0) / dur, 1), 3);
        e.target.textContent = Math.floor(ease * target);
        if (ease < 1) requestAnimationFrame(tick);
        else e.target.textContent = target;
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  els.forEach(el => obs.observe(el));
}

/* =========================================================
   ANIMATED SKILL BARS
   ========================================================= */
function initSkillBars() {
  const fills = document.querySelectorAll('.skill-bar-fill');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !e.target.dataset.done) {
        e.target.dataset.done = '1';
        // slight delay so the scroll reveal fires first
        setTimeout(() => {
          e.target.style.width = e.target.dataset.pct + '%';
        }, 150);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  fills.forEach(f => obs.observe(f));
}

/* =========================================================
   SCROLL REVEAL
   ========================================================= */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        // Stagger siblings by their order within parent
        const siblings = Array.from(e.target.parentElement?.children || []);
        const idx = siblings.indexOf(e.target);
        setTimeout(() => e.target.classList.add('visible'), idx * 80);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
}

/* =========================================================
   STICKY NAV + SCROLL PROGRESS BAR
   ========================================================= */
function initNav() {
  const nav  = document.getElementById('nav');
  const prog = document.getElementById('scroll-progress');
  const onScroll = () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
    if (prog) {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
      prog.style.width = pct + '%';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* =========================================================
   PROJECT CARD 3D TILT
   ========================================================= */
function initCardTilt() {
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r   = card.getBoundingClientRect();
      const x   = (e.clientX - r.left) / r.width  - 0.5;
      const y   = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg) scale(1.02)`;
      card.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
      card.style.setProperty('--my', `${(y + 0.5) * 100}%`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.5s ease, border-color 0.25s, box-shadow 0.25s';
      card.style.transform  = '';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease, border-color 0.25s, box-shadow 0.25s';
    });
  });
}

/* =========================================================
   LLM STATUS BADGE
   ========================================================= */
async function checkDispatcherStatus() {
  const badge = document.getElementById('status-badge');
  if (!badge) return;
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch('https://llama.williamruffu.com/portfolio-status', { signal: ctrl.signal });
    if (res.ok) {
      badge.classList.add('online');
      badge.innerHTML = '<span class="dot"></span> DISPATCHER ONLINE';
    } else {
      badge.innerHTML = '<span class="dot"></span> OFFLINE';
    }
  } catch {
    badge.innerHTML = '<span class="dot"></span> OFFLINE';
  }
}

/* =========================================================
   CHATBOT WIDGET
   ========================================================= */
const CHAT_ENDPOINT = 'https://llama.williamruffu.com/portfolio-chat';
let isStreaming = false;

function initChatbot() {
  const btn   = document.getElementById('dispatcher-btn');
  const panel = document.getElementById('chat-panel');
  const close = document.getElementById('chat-close');
  const input = document.getElementById('chat-input');
  const send  = document.getElementById('chat-send');
  if (!btn || !panel) return;

  btn.addEventListener('click',   () => { panel.classList.add('open'); input?.focus(); });
  close?.addEventListener('click', () => panel.classList.remove('open'));

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (input) input.value = chip.textContent;
      sendMessage();
    });
  });

  send?.addEventListener('click', sendMessage);
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
}

function appendMsg(role, text) {
  const container = document.getElementById('chat-messages');
  if (!container) return null;
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function showTyping() {
  const c = document.getElementById('chat-messages');
  if (!c) return;
  const d = document.createElement('div');
  d.className = 'typing-indicator'; d.id = 'typing';
  d.innerHTML = '<span></span><span></span><span></span>';
  c.appendChild(d); c.scrollTop = c.scrollHeight;
}
function removeTyping() { document.getElementById('typing')?.remove(); }

async function sendMessage() {
  if (isStreaming) return;
  const input = document.getElementById('chat-input');
  const msg = input?.value.trim();
  if (!msg) return;
  input.value = '';

  document.querySelector('.chip-prompts')?.remove();
  appendMsg('user', msg);
  showTyping();
  isStreaming = true;

  try {
    const res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    });
    removeTyping();
    if (!res.ok) {
      appendMsg('bot', 'Sorry — the Dispatcher is temporarily offline. Try again soon.');
      isStreaming = false; return;
    }

    const botDiv = appendMsg('bot', '');
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '', full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') break;
        try {
          const obj = JSON.parse(raw);
          if (obj.content) {
            full += obj.content;
            botDiv.textContent = full;
            document.getElementById('chat-messages').scrollTop = 9999;
          }
        } catch { /* partial */ }
      }
    }
  } catch {
    removeTyping();
    appendMsg('bot', 'Lost signal — check your connection and try again.');
  } finally {
    isStreaming = false;
  }
}

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  new HeroCanvas('hero-canvas');
  applySkillYears();
  initNav();
  initCounters();
  initSkillBars();
  initReveal();
  initCardTilt();
  initChatbot();
  checkDispatcherStatus();
});
