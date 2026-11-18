/* ============================================================
   O QUE ORWELL VIU — js/scripts.js
   Navegação por botões laterais, índice, modais e mapa.
   ============================================================ */
(function () {
  'use strict';

  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  let current = 0;
  let locked = false;
  const LOCK_MS = 600;

  const $ = (s) => document.querySelector(s);
  const progressFill = $('#progressFill');
  const slideCounter = $('#slideCounter');
  const menuOverlay = $('#menuOverlay');
  const menuList = $('#menuList');
  const pageModal = $('#pageModal');
  const pageModalContent = $('#pageModalContent');
  const pageModalInner = $('#pageModalInner');
  const hotspotCard = $('#hotspotCard');
  const noteTip = $('#noteTip');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');

  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- índice ---------- */
  slides.forEach((sl, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.innerHTML = `<span class="num">${pad(i + 1)}</span>${sl.dataset.title || 'Seção'}`;
    btn.addEventListener('click', () => { closeMenu(); goTo(i); });
    li.appendChild(btn);
    menuList.appendChild(li);
  });

  function openMenu() { menuOverlay.classList.add('open'); menuOverlay.setAttribute('aria-hidden', 'false'); }
  function closeMenu() { menuOverlay.classList.remove('open'); menuOverlay.setAttribute('aria-hidden', 'true'); }
  $('#menuBtn').addEventListener('click', openMenu);
  $('#menuClose').addEventListener('click', closeMenu);

  /* ---------- navegação ---------- */
  function updateNav() {
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
    slideCounter.textContent = `${pad(current + 1)} / ${pad(total)}`;
    progressFill.style.width = ((current + 1) / total) * 100 + '%';
  }

  function goTo(i) {
    if (i < 0 || i >= total) return;
    if (i !== current) {
      const prev = slides[current];
      const next = slides[i];
      prev.classList.remove('active');
      prev.classList.toggle('exit-left', i > current);
      next.classList.remove('exit-left');
      next.classList.add('active');
      next.scrollTop = 0;
      current = i;
    }
    updateNav();
  }

  function nextStep() { if (!locked && current < total - 1) { locked = true; goTo(current + 1); setTimeout(() => (locked = false), LOCK_MS); } }
  function prevStep() { if (!locked && current > 0) { locked = true; goTo(current - 1); setTimeout(() => (locked = false), LOCK_MS); } }

  prevBtn.addEventListener('click', prevStep);
  nextBtn.addEventListener('click', nextStep);
  $('#homeBtn').addEventListener('click', () => goTo(0));

  document.body.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) nextStep();
    if (e.target.closest('[data-restart]')) goTo(0);
  });

  /* ---------- teclado ---------- */
  document.addEventListener('keydown', (e) => {
    if (pageModal.classList.contains('open')) {
      if (e.key === 'Escape') closeModal();
      return;
    }
    if (menuOverlay.classList.contains('open')) {
      if (e.key === 'Escape') closeMenu();
      return;
    }
    switch (e.key) {
      case 'ArrowRight': case ' ': e.preventDefault(); nextStep(); break;
      case 'ArrowLeft': e.preventDefault(); prevStep(); break;
      case 'Home': goTo(0); break;
      case 'End': goTo(total - 1); break;
      case 'Escape': openMenu(); break;
    }
  });

  /* ---------- subpáginas em modal ---------- */
  function openModal() { pageModal.classList.add('open'); pageModal.setAttribute('aria-hidden', 'false'); }
  function closeModal() { pageModal.classList.remove('open'); pageModal.setAttribute('aria-hidden', 'true'); }
  $('#pageModalClose').addEventListener('click', closeModal);
  pageModal.addEventListener('click', (e) => { if (e.target === pageModal) closeModal(); });

  document.querySelectorAll('.doclink[data-page]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const href = btn.dataset.page;
      const hashIdx = href.indexOf('#');
      const url = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
      const anchor = hashIdx >= 0 ? href.slice(hashIdx + 1) : null;
      fetch(url)
        .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
        .then((html) => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          pageModalContent.innerHTML = '';
          pageModalContent.appendChild(doc.querySelector('article') || doc.body);
          openModal();
          pageModalInner.scrollTop = 0;
          if (anchor) {
            const el = pageModalContent.querySelector(`#${CSS.escape(anchor)}`);
            if (el) el.scrollIntoView({ block: 'start' });
          }
        })
        .catch(() => {
          window.open(url, '_blank');
        });
    });
  });

  /* ---------- hotspots do mapa ---------- */
  const HOT = {
    oceania: {
      name: 'OCEÂNIA',
      body: `Américas + Império Britânico. No livro, a Inglaterra se chama “Pista Um” (Airstrip One). Orwell colocou o totalitarismo dentro do próprio país para mostrar que ninguém está a salvo.`
    },
    eurasia: {
      name: 'EURÁSIA',
      body: `Europa continental + União Soviética. Representa o bloco liderado por Stalin e o espaço de influência soviético discutido nas conferências de Teerã e Yalta.`
    },
    lestasia: {
      name: 'LESTÁSIA',
      body: `Ásia oriental + Japão. Representa o outro lado da divisão do mundo feita pelas grandes potências na década de 1940.`
    }
  };
  document.querySelectorAll('.hotspot').forEach((h) => {
    h.addEventListener('click', (e) => {
      e.stopPropagation();
      const d = HOT[h.dataset.hot];
      if (!d) return;
      hotspotCard.innerHTML = `<h4>${d.name}</h4><p>${d.body}</p>`;
      hotspotCard.hidden = false;
      const wrap = h.parentElement.getBoundingClientRect();
      const rect = h.getBoundingClientRect();
      let left = rect.left - wrap.left + 40;
      if (left + 330 > wrap.width) left = Math.max(8, left - 360);
      hotspotCard.style.left = left + 'px';
      hotspotCard.style.top = Math.max(8, rect.top - wrap.top - 20) + 'px';
    });
  });
  const worldMap = document.getElementById('worldMap');
  if (worldMap) worldMap.addEventListener('click', () => { hotspotCard.hidden = true; });

  /* ---------- tooltip das fontes ---------- */
  document.querySelectorAll('.src-tag').forEach((tag) => {
    tag.addEventListener('mouseenter', () => {
      noteTip.textContent = 'Fonte disponível na pasta fontes/.';
      noteTip.hidden = false;
      const r = tag.getBoundingClientRect();
      noteTip.style.left = Math.max(8, r.left - 100) + 'px';
      noteTip.style.top = (r.bottom + 8) + 'px';
    });
    tag.addEventListener('mouseleave', () => { noteTip.hidden = true; });
  });

  /* ---------- título datilografado ---------- */
  const tw = document.querySelector('.typewriter');
  if (tw) {
    const full = tw.dataset.text;
    let i = 0;
    tw.textContent = '';
    const tick = () => {
      if (i <= full.length) {
        tw.textContent = full.slice(0, i);
        i++;
        setTimeout(tick, 55);
      }
    };
    setTimeout(tick, 700);
  }

  /* ---------- init ---------- */
  slides[0].classList.add('active');
  updateNav();
})();
