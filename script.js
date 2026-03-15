/* ============================================================
   williamruffu.com — Portfolio Scripts
   ============================================================ */

'use strict';

// ---- Auto-calculate skill years ---------------------------

const startDates = {
  logistics:   '2007-01',
  excel:       '2007-01',
  sql:         '2019-01',
  tableau:     '2021-01',
  supplychain: '2007-01',
  python:      '2022-06',
  pytorch:     '2023-01',
  tensorflow:  '2023-01',
  opencv:      '2024-01',
  docker:      '2023-06',
};

function calcYears(startStr) {
  const [y, m] = startStr.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const now = new Date();
  const diffMs = now - start;
  const diffYears = diffMs / (365.25 * 24 * 60 * 60 * 1000);
  return Math.max(1, Math.floor(diffYears));
}

function applySkillYears() {
  document.querySelectorAll('[data-skill]').forEach(el => {
    const key = el.dataset.skill;
    if (startDates[key] !== undefined) {
      const yrs = calcYears(startDates[key]);
      el.textContent = `${yrs} yr${yrs !== 1 ? 's' : ''}`;
    }
  });
}

// ---- Scroll-triggered counters ----------------------------

function animateCounter(el, target, duration = 1200) {
  const start = performance.now();
  const step = (ts) => {
    const progress = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.floor(ease * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.done) {
        entry.target.dataset.done = '1';
        animateCounter(entry.target, parseInt(entry.target.dataset.count, 10));
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(c => observer.observe(c));
}

// ---- Sticky nav on scroll ---------------------------------

function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ---- LLM status badge -------------------------------------

async function checkDispatcherStatus() {
  const badge = document.getElementById('status-badge');
  if (!badge) return;
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch('https://llama.williamruffu.com/portfolio-status', {
      signal: ctrl.signal,
    });
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

// ---- Chatbot widget ---------------------------------------

const CHAT_ENDPOINT = 'https://llama.williamruffu.com/portfolio-chat';
const MAX_HISTORY = 5; // exchanges to keep in memory

let chatHistory = [];
let isStreaming = false;

function initChatbot() {
  const btn   = document.getElementById('dispatcher-btn');
  const panel = document.getElementById('chat-panel');
  const close = document.getElementById('chat-close');
  const input = document.getElementById('chat-input');
  const send  = document.getElementById('chat-send');
  if (!btn || !panel) return;

  btn.addEventListener('click', () => {
    panel.classList.add('open');
    input?.focus();
  });
  close?.addEventListener('click', () => panel.classList.remove('open'));

  // Chip prompts
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (input) input.value = chip.textContent;
      sendMessage();
    });
  });

  // Send on button click or Enter key
  send?.addEventListener('click', sendMessage);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
}

function appendMessage(role, text) {
  const container = document.getElementById('chat-messages');
  if (!container) return null;
  const div = document.createElement('div');
  div.classList.add('msg', role);
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function showTyping() {
  const container = document.getElementById('chat-messages');
  if (!container) return null;
  const ind = document.createElement('div');
  ind.classList.add('typing-indicator');
  ind.id = 'typing';
  ind.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(ind);
  container.scrollTop = container.scrollHeight;
  return ind;
}

function removeTyping() {
  document.getElementById('typing')?.remove();
}

async function sendMessage() {
  if (isStreaming) return;
  const input = document.getElementById('chat-input');
  const message = input?.value.trim();
  if (!message) return;
  input.value = '';

  // Hide chip prompts after first message
  const chips = document.querySelector('.chip-prompts');
  if (chips) chips.style.display = 'none';

  appendMessage('user', message);

  // Keep rolling history (trim to MAX_HISTORY exchanges)
  chatHistory.push({ role: 'user', content: message });
  if (chatHistory.length > MAX_HISTORY * 2) {
    chatHistory = chatHistory.slice(-MAX_HISTORY * 2);
  }

  showTyping();
  isStreaming = true;

  try {
    const res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    removeTyping();

    if (!res.ok) {
      appendMessage('bot', 'Sorry, the Dispatcher is temporarily unavailable. Check back soon.');
      isStreaming = false;
      return;
    }

    // Stream the response
    const botDiv = appendMessage('bot', '');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const obj = JSON.parse(data);
          if (obj.content) {
            fullText += obj.content;
            botDiv.textContent = fullText;
            const container = document.getElementById('chat-messages');
            if (container) container.scrollTop = container.scrollHeight;
          }
          if (obj.error) {
            botDiv.textContent = 'The Dispatcher hit a snag on the road. Try again shortly.';
          }
        } catch { /* incomplete JSON */ }
      }
    }

    chatHistory.push({ role: 'assistant', content: fullText });

  } catch (err) {
    removeTyping();
    appendMessage('bot', 'Lost signal — check your connection and try again.');
  } finally {
    isStreaming = false;
  }
}

// ---- Road dashes: populate dynamically --------------------

function buildRoadDashes() {
  const track = document.querySelector('.dash-track');
  if (!track) return;
  // Fill with enough dashes to cover 200% height
  for (let i = 0; i < 30; i++) {
    const d = document.createElement('div');
    d.classList.add('dash');
    track.appendChild(d);
  }
}

// ---- Constellation dots -----------------------------------

function buildConstellation() {
  const c = document.querySelector('.constellation');
  if (!c) return;
  const count = 60;
  // Cluster in corners to avoid obscuring hero text
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.classList.add('star');
    // Distribute in corner regions
    let x, y;
    const corner = i % 4;
    if (corner === 0)      { x = Math.random() * 25; y = Math.random() * 35; }
    else if (corner === 1) { x = 75 + Math.random() * 25; y = Math.random() * 35; }
    else if (corner === 2) { x = Math.random() * 20; y = 65 + Math.random() * 35; }
    else                   { x = 80 + Math.random() * 20; y = 65 + Math.random() * 35; }
    s.style.left = `${x}%`;
    s.style.top  = `${y}%`;
    s.style.setProperty('--dur', `${2 + Math.random() * 4}s`);
    s.style.setProperty('--delay', `${Math.random() * 4}s`);
    c.appendChild(s);
  }
}

// ---- Scroll-reveal (lightweight) --------------------------

function initScrollReveal() {
  const targets = document.querySelectorAll('.project-card, .about-card, .exp-entry, .skill-item');
  if (!targets.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach(t => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(16px)';
    t.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    observer.observe(t);
  });
}

// ---- Init -------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  applySkillYears();
  buildRoadDashes();
  buildConstellation();
  initNav();
  initCounters();
  initChatbot();
  checkDispatcherStatus();
  setTimeout(initScrollReveal, 100);
});
