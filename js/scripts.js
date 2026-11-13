/* ============================================================
   A FÁBRICA DO PASSADO — js/scripts.js
   Motor da apresentação (slides), menus, modais, hotspots.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- estado ---------- */
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  let current = 0;
  let locked = false;
  const LOCK_MS = 650;

  const $ = (s) => document.querySelector(s);
  const progressFill = $('#progressFill');
  const slideCounter = $('#slideCounter');
  const menuOverlay = $('#menuOverlay');
  const menuList = $('#menuList');
  const pageModal = $('#pageModal');
  const pageModalContent = $('#pageModalContent');
  const mechModal = $('#mechModal');
  const mechContent = $('#mechContent');
  const hotspotCard = $('#hotspotCard');
  const noteTip = $('#noteTip');

  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- índice (menu) ---------- */
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
  function goTo(i) {
    if (i < 0 || i >= total || i === current) return;
    const prev = slides[current];
    const next = slides[i];
    prev.classList.remove('active');
    prev.classList.toggle('exit-left', i > current);
    next.classList.remove('exit-left');
    next.classList.add('active');
    next.scrollTop = 0;
    current = i;
    progressFill.style.width = ((current + 1) / total) * 100 + '%';
    slideCounter.textContent = `${pad(current + 1)} / ${pad(total)}`;
    document.body.dataset.slide = current;
  }
  function nextStep() { if (!locked) { locked = true; goTo(current + 1); setTimeout(() => (locked = false), LOCK_MS); } }
  function prevStep() { if (!locked) { locked = true; goTo(current - 1); setTimeout(() => (locked = false), LOCK_MS); } }

  document.body.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) nextStep();
    if (e.target.closest('[data-restart]')) goTo(0);
    if (e.target.closest('.hotspot')) return; // hotspot cuida de si
    if (!e.target.closest('.mech') && !e.target.closest('.doclink') &&
        !e.target.closest('button') && !e.target.closest('a') &&
        !menuOverlay.classList.contains('open') && !pageModal.classList.contains('open') &&
        !mechModal.classList.contains('open')) {
      nextStep();
    }
  });

  /* ---------- teclado ---------- */
  document.addEventListener('keydown', (e) => {
    if (pageModal.classList.contains('open') || mechModal.classList.contains('open')) {
      if (e.key === 'Escape') { closeModal(); closeMech(); }
      return;
    }
    switch (e.key) {
      case 'ArrowRight': case ' ': case 'PageDown': e.preventDefault(); nextStep(); break;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); prevStep(); break;
      case 'Home': goTo(0); break;
      case 'End': goTo(total - 1); break;
      case 'Escape': menuOverlay.classList.contains('open') ? closeMenu() : openMenu(); break;
    }
  });

  /* ---------- wheel / touch ---------- */
  let wheelAcc = 0;
  document.addEventListener('wheel', (e) => {
    if (menuOverlay.classList.contains('open') || pageModal.classList.contains('open') || mechModal.classList.contains('open')) return;
    const sl = slides[current];
    if (sl.scrollHeight > sl.clientHeight + 40) {
      // deixa rolar conteúdo longo antes de avançar
      const atTop = sl.scrollTop <= 0 && e.deltaY < 0;
      const atBottom = sl.scrollTop + sl.clientHeight >= sl.scrollHeight - 2 && e.deltaY > 0;
      if (!atTop && !atBottom) return;
    }
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) > 120) { wheelAcc > 0 ? nextStep() : prevStep(); wheelAcc = 0; }
  }, { passive: true });

  let touchY = null;
  document.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (touchY === null) return;
    const dy = touchY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 70) { dy > 0 ? nextStep() : prevStep(); }
    touchY = null;
  }, { passive: true });

  /* ---------- subpáginas em modal (continuidade do fluxo) ---------- */
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
          // fallback: abre em nova aba
          window.open(url, '_blank');
        });
    });
  });

  const pageModalInner = $('#pageModalInner');

  /* ---------- modal de mecanismos (peça por peça) ---------- */
  const MECH_DOCS = {
    telescreen: {
      title: 'TELESCREEN — o receptor que nunca desliga',
      body: `<p>Na Alemanha nazista, o <em>Volksempfänger</em> ("receptor do povo", modelo VE301 de 1933 — o "301" aludia a 30 de janeiro, dia da tomada do poder) era o rádio estatal barato, vendido sem faixa de ondas curtas para impedir a escuta de emissoras estrangeiras. O <em>Feindsender</em> ("emissor inimigo") era crime punível com pena de morte, com casos documentados de execuções em 1942–43.</p>
      <p>Na URSS, a <em>radiotočka</em> — alto-falante de rádio-fio com três canais estatais — foi instalada por norma nos apartamentos coletivos e, na versão de fio, não tinha botão de desligar do lado do usuário: só um técnico podia cortar a linha. O telescreen do romance, "que podia ser atenuado mas nunca desligado", é a <em>radiotočka</em> com câmera.</p>
      <p class="mono">Documentos: decreto sobre receptores do Reich (Regulierungsverordnung, 1939); normatização das radiotočki soviéticas (GOST 1932–1950).</p>`
    },
    quarto101: {
      title: 'QUARTO 101 — a câmara do medo individualizado',
      body: `<p>Orwell trabalhou na BBC, no edifício <strong>Senate House</strong> (bloco do Ministério da Informação britânico). O número 101 refere-se a uma sala de reuniões desse aparato: a biógrafa D. J. Taylor e Dorian Lynskey (<em>The Ministry of Truth</em>, 2019) documentam a ligação. O "medo adaptado ao indivíduo" deriva do método real de interrogatório: dossiê montado <em>antes</em> da prisão — a Gestapo e a NKVD elaboravam fichas sobre a vítima, incluindo o que ela mais temia ou amava, para usar como alavanca.</p>
      <p>No romance, a frase de O'Brien — "o que há no Quarto 101 não é pior que o pior que existe para <em>você</em>" — descreve exatamente essa personalização: tortura como informação, não como violência bruta.</p>`
    },
    'dois-minutos': {
      title: 'DOIS MINUTOS DE ÓDIO — emoção coletiva programada',
      body: `<p>A Juventude Hitlerista (Hitlerjugend, 10 milhões de filiados em 1944) e o Komsomol soviético (40 milhões em 1970) institucionalizaram o ritual coletivo diário de emoção dirigida: paradas, gritos de consigna, comícios de denúncia ("Selbstkritik" na versão stalinista, <em>Wochenspruch</em> semanal em Berlim). Walter Benjamin chamou o mecanismo de <em>estetização da política</em>: transformar a guerra e o líder em espetáculo sensorial, substituindo a informação pela emoção sincronizada.</p>
      <p>Os Dois Minutos são esse ritual comprimido na unidade mínima: uma emoção de dois minutos por dia é suficiente para manter o corpo coletivo aquecido.</p>`
    },
    memoria: {
      title: 'BURACOS DA MEMÓRIA — o apagamento antes do registro',
      body: `<p>No romance, o "memory hole" é um duto ligado a um forno: o documento é destruído <em>antes</em> de virar registro. O equivalente documental é duplo:</p>
      <p>• <strong>URSS</strong>: as fichas do NKVD que não foram "arquivadas" foram destruídas em série após 1953 (o próprio Khrushchev menciona, no Relatório Secreto, a destruição e a recuperação posterior de processos dos expurgos). A foto de Yezhov, apagada com aerógrafo em 1940, é o exemplo visual que David King sistematizou em <em>O Comissário Desaparece</em>.</p>
      <p>• <strong>Alemanha</strong>: a queima de arquivos da Gestapo em 1945 foi, em parte, tentativa de apagar provas — mas o Ministério do Reich alemão <em>manteve</em> registros burocráticos minuciosos de deportação (a〈Liste der Juden〉de 1939), mostrando que o totalitarismo não precisa apagar tudo: basta controlar <em>quais</em> registros circulam.</p>`
    },
    proles: {
      title: 'OS PROLES — a massa institucionalizada',
      body: `<p>A <em>Carta del Lavoro</em> (Itália, 1927) dissolve os sindicatos independentes e os substitui por corporações estatais: a classe trabalhadora não é reprimida — é <em>incorporada</em> ao Estado como órgão. O fascismo italiano chama isso de "colaboração de classes"; Orwell chama de "os proles são 85% da população, não precisam ser controlados, só entretidos".</p>
      <p>No romance, os proles têm rádio popular, loteria e futebol — o que o <em>Carta del Lavoro</em> e a <em>Dopolavoro</em> (Opera Nazionale Dopolavoro, 1925, 4 milhões de associados) instituíram na Itália fascista: lazer estatal como forma de esvaziar a política.</p>`
    },
    pacto: {
      title: 'GUERRA PERMANENTE — o pacto que trocou de lado',
      body: `<p>Em 23 de agosto de 1939, o protocolo secreto do Pacto Molotov-Ribbentrop dividiu a Polônia, a Finlândia, os Estados Bálticos e a Bessarábia entre dois Estados que até então se tratavam como inimigos totais. Em 22 de junho de 1941, o mesmo acordo virou guerra sem que nenhum dos dois governos publicasse a mudança — a população descobriu pela rádio de seu próprio Estado, cada um com a versão oficial.</p>
      <p>No romance, a troca de inimigos entre Eurásia e Lestásia acontece <em>no meio de um discurso</em>: o orador troca o nome do inimigo e ninguém percebe. Winston é o único que guarda a memória da versão anterior — e por isso é criminalizado. A cena é a tradução literária exata do protocolo secreto.</p>`
    }
  };

  document.querySelectorAll('.mech').forEach((m) => {
    m.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = m.dataset.mech;
      const d = MECH_DOCS[key];
      if (!d) return;
      mechContent.innerHTML = `<h3 class="mono">${d.title}</h3>${d.body}`;
      mechModal.classList.add('open');
    });
  });
  $('#mechClose').addEventListener('click', closeMech);
  mechModal.addEventListener('click', (e) => { if (e.target === mechModal) closeMech(); });
  function closeMech() { mechModal.classList.remove('open'); }

  /* ---------- hotspots do mapa ---------- */
  const HOT = {
    oceania: {
      name: 'OCEÂNIA',
      body: `Américas + Império Britânico (Inglaterra, chamada de "Pista Um" — Airstrip One). Correspondência real: o bloco anglo-americano e o Império Britânico. Orwell, sendo inglês, colocou o regime totalitário <em>em casa</em> de propósito: a tese de <em>O Leão e o Unicórnio</em> (1941) é que a Inglaterra "está a um passo do totalitarismo".`
    },
    eurasia: {
      name: 'EURÁSIA',
      body: `Europa continental + URSS. Correspondência real: a URSS e o espaço de influência soviético previsto nas conferências de Teerã e Yalta. O regime "neobolchevique" é descrito no apêndice da Novilíngua como herdeiro direto do bolchevismo.`
    },
    lestasia: {
      name: 'LESTÁSIA',
      body: `Ásia oriental + Japão. Correspondência real: o Império do Japão e a China. Em 1943–45, as "Três Potências" (EUA, URSS, Reino Unido) dividem zonas de influência — Orwell transforma a divisão em três Estados permanentemente em guerra entre si, nenhum conquistável.`
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
  document.getElementById('worldMap').addEventListener('click', () => { hotspotCard.hidden = true; });

  /* ---------- tooltip das fontes ---------- */
  document.querySelectorAll('.src-tag').forEach((tag) => {
    tag.addEventListener('mouseenter', (e) => {
      noteTip.textContent = 'Ver fonte baixada em fontes/MANIFESTO.md';
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
  goTo(0);
  progressFill.style.width = (1 / total) * 100 + '%';
})();
