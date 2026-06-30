// ===== Sempre iniciar no topo (abertura + reveals consistentes) =====
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// ===== Ano dinâmico no rodapé =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== Intro / abertura animada com Anime.js (1x por sessão) =====
(function () {
  const intro = document.getElementById('intro');
  if (!intro) return;

  const SEEN = 'mradv_intro_seen';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);
  const debug = params.has('introdebug'); // congela o intro p/ inspeção

  let seen = false;
  try { seen = sessionStorage.getItem(SEEN) === '1'; } catch (e) { }
  if (seen && !debug) { intro.remove(); return; }

  const anime = window.anime;

  // Encerramento: levanta a cortina e revela a página
  function finish() {
    try { sessionStorage.setItem(SEEN, '1'); } catch (e) { }
    const done = () => { document.body.classList.remove('intro-lock'); intro.remove(); };
    if (anime && anime.animate) {
      anime.animate(intro, {
        opacity: [1, 0],
        translateY: [0, -28],
        duration: 850,
        ease: 'inOutQuad',
        onComplete: done
      });
    } else {
      intro.style.transition = 'opacity .8s, transform .8s';
      intro.style.opacity = '0';
      intro.style.transform = 'translateY(-28px)';
      window.setTimeout(done, 850);
    }
  }

  document.body.classList.add('intro-lock');

  // Fallback sem Anime.js (ou movimento reduzido): revela estático e sai
  if (!anime || !anime.createTimeline || reduce) {
    intro.classList.add('intro-static');
    if (!debug) window.setTimeout(finish, reduce ? 650 : 1400);
    return;
  }

  const { createTimeline, createDrawable, splitText, stagger } = anime;
  const spring = anime.spring || anime.createSpring;

  // Quebra texto em caracteres animáveis
  function toChars(sel) {
    try { return splitText(sel, { chars: { class: 'intro-char' }, accessible: true }).chars || []; }
    catch (e) { return []; }
  }
  const chars = toChars('.intro-line');     // "Matheus Ribeiro"
  const subChars = toChars('.intro-sub');   // "ADVOGADOS"
  intro.querySelector('.intro-name').style.opacity = 1;
  chars.concat(subChars).forEach(c => { c.style.opacity = 0; });

  const tl = createTimeline({ defaults: { ease: 'outExpo' } });

  // 1) Anel desenhado
  try {
    const ring = createDrawable('.intro-ring circle');
    tl.add(ring, { draw: ['0 0', '0 1'], duration: 1500, ease: 'inOutSine' }, 0);
  } catch (e) { }

  // 2) Brilho dourado expandindo
  tl.add('.intro-glow', {
    opacity: [0, 0.55, 0.32],
    scale: [0.4, 1.15],
    duration: 1400, ease: 'outQuad'
  }, 150);

  // 3) Escudo com mola
  tl.add('.intro-shield', {
    opacity: [0, 1],
    scale: [0.7, 1],
    translateY: [16, 0],
    duration: 900,
    ease: spring({ stiffness: 120, damping: 12 })
  }, 200);

  // 4) Letras do nome sobem em sequência
  if (chars.length) {
    tl.add(chars, {
      opacity: [0, 1],
      translateY: [42, 0],
      rotateZ: [6, 0],
      duration: 750,
      delay: stagger(34),
      ease: 'outExpo'
    }, 550);
  }

  // 5) "ADVOGADOS" — letras em sequência
  if (subChars.length) {
    tl.add(subChars, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 520,
      delay: stagger(28),
      ease: 'outExpo'
    }, '-=280');
  }

  // 6) Linha dourada
  tl.add('.intro-rule', { scaleX: [0, 1], duration: 700, ease: 'inOutQuad' }, '-=450');

  // 7) Selo / tagline
  tl.add('.intro-tag', { opacity: [0, 1], translateY: [10, 0], duration: 600 }, '-=350');

  // Ao concluir, encerra (a menos que em modo debug)
  tl.then(() => { if (!debug) window.setTimeout(finish, 500); });
})();

// ===== Header glass + parallax da imagem do hero =====
const header = document.getElementById('siteHeader');
const heroBg = document.getElementById('heroBg');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let headerTicking = false;
function syncHeader() {
  const y = window.scrollY || document.documentElement.scrollTop;
  header.classList.toggle('scrolled', y > 40);
  // imagem rural do hero desce mais devagar que o scroll (parallax)
  if (heroBg && !reduceMotion && y < 1100) {
    heroBg.style.transform = 'translate3d(0,' + (y * 0.18).toFixed(1) + 'px,0)';
  }
}
window.addEventListener('scroll', () => {
  if (!headerTicking) {
    window.requestAnimationFrame(() => { syncHeader(); headerTicking = false; });
    headerTicking = true;
  }
}, { passive: true });
syncHeader();

// ===== Animações de scroll com Anime.js =====
(function () {
  const anime = window.anime;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  const floatObjs = Array.from(document.querySelectorAll('.float-obj'));

  // Fallback: sem Anime.js ou movimento reduzido -> revela tudo estaticamente
  if (!anime || !anime.onScroll || reduce) {
    reveals.forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    const bar = document.getElementById('scrollProgress');
    if (bar) bar.style.transform = 'scaleX(1)';
    return;
  }

  const { animate, onScroll, createMotionPath } = anime;

  // 1) Barra de progressão — sincronizada ao scroll da página inteira
  animate('#scrollProgress', {
    scaleX: [0, 1],
    ease: 'linear',
    autoplay: onScroll({ target: document.body, enter: 'top top', leave: 'bottom bottom', sync: true })
  });

  // 2) Textos aparecendo ao descer — animação Anime.js disparada por
  //    IntersectionObserver (detecção de viewport robusta e confiável)
  const play = el => {
    const d = (parseInt(el.dataset.delay, 10) || 0) * 110;
    animate(el, {
      opacity: [0, 1],
      translateY: [40, 0],
      duration: 900,
      delay: d,
      ease: 'outExpo'
    });
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { play(entry.target); io.unobserve(entry.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  reveals.forEach(el => io.observe(el));

  // 3) Trator e balança — seguem trajetórias (Motion Path)
  if (createMotionPath) {
    try {
      const tractor = createMotionPath('#mp-tractor');
      animate('.obj-tractor', {
        translateX: tractor.translateX,
        translateY: tractor.translateY,
        rotate: tractor.rotate,
        duration: 12000, ease: 'inOutSine', loop: true, alternate: true
      });
      const scale = createMotionPath('#mp-scale');
      animate('.obj-scale', {
        translateX: scale.translateX,
        translateY: scale.translateY,
        duration: 9000, ease: 'inOutQuad', loop: true
      });
    } catch (e) { }
  }

  // 4) Demais objetos jurídicos — flutuação suave em loop
  floatObjs
    .filter(o => !o.matches('.obj-tractor, .obj-scale'))
    .forEach((obj, i) => {
      animate(obj, {
        translateY: [0, -24],
        rotate: [0, 3],
        duration: 4200 + i * 500,
        ease: 'inOutSine',
        loop: true,
        alternate: true,
        delay: i * 280
      });
    });

  // 5) Parallax do conjunto conforme a página rola
  animate('.floating-objects', {
    translateY: [0, -120],
    ease: 'linear',
    autoplay: onScroll({ target: document.body, enter: 'top top', leave: 'bottom bottom', sync: true })
  });
})();

// ===== Menu mobile (hambúrguer animado via checkbox) =====
const checkbox = document.getElementById('checkbox');
const navLinks = document.getElementById('navLinks');
function setMenuOpen(open) {
  navLinks.classList.toggle('open', open);
  if (checkbox) checkbox.checked = open; // mantém o toggle (hambúrguer/seta) sincronizado
}
if (checkbox) checkbox.addEventListener('change', () => setMenuOpen(checkbox.checked));
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => setMenuOpen(false))
);

// ===== Formulário de captação → e-mail (Web3Forms) =====
(function () {
  const form = document.getElementById('leadForm');
  if (!form) return;
  const status = document.getElementById('leadStatus');
  const btn = form.querySelector('.lead-submit');
  const val = n => (form.elements.namedItem(n).value || '').trim();

  // Access Key ofuscada (base64, remontada em runtime) p/ não ficar em texto puro
  // no código. Obs.: ofuscação não é segurança real em site estático — a proteção
  // efetiva é restringir a chave ao domínio no painel do Web3Forms.
  const _p = ['OTk4ODkxNGUt', 'YWI3Ny00MmU3', 'LWIzYmYtYTk2', 'NzExZmI4MDg0'];
  const apiKey = () => { try { return atob(_p.join('')); } catch (e) { return ''; } };

  // ---- infra de validação por campo ----
  const fieldOf = name => {
    const el = form.elements.namedItem(name);
    return { el, box: el && el.closest('.field') };
  };
  // garante um <p class="field-error"> abaixo de cada campo validado
  const errEl = name => {
    const { box } = fieldOf(name);
    if (!box) return null;
    let p = box.querySelector('.field-error');
    if (!p) { p = document.createElement('p'); p.className = 'field-error'; box.appendChild(p); }
    return p;
  };
  const setInvalid = (name, msg) => {
    const { box } = fieldOf(name);
    if (box) { box.classList.add('invalid'); box.classList.remove('valid'); }
    const p = errEl(name); if (p) p.textContent = msg;
  };
  const setValid = name => {
    const { el, box } = fieldOf(name);
    if (box) { box.classList.remove('invalid'); box.classList.add('valid'); }
    if (el && !el.value.trim()) box && box.classList.remove('valid'); // opcional vazio: neutro
  };
  const clearStatus = () => {
    if (status.classList.contains('error')) { status.textContent = ''; status.className = 'lead-status'; }
  };

  // regras: retornam null se ok, ou a mensagem de erro
  const onlyDigits = s => (s || '').replace(/\D/g, '');
  const rules = {
    name: v => {
      if (!v) return 'Informe seu nome.';
      if (v.replace(/\s/g, '').length < 3) return 'Nome muito curto.';
      if (!/^[A-Za-zÀ-ÿ'.\-]+(\s+[A-Za-zÀ-ÿ'.\-]+)+$/.test(v)) return 'Digite nome e sobrenome (apenas letras).';
      return null;
    },
    phone: v => {
      const d = onlyDigits(v);
      if (!d) return 'Informe seu WhatsApp.';
      if (d.length < 10 || d.length > 11) return 'WhatsApp inválido — use DDD + número, ex.: (62) 90000-0000.';
      if (/^(\d)\1+$/.test(d)) return 'Número de WhatsApp inválido.';
      return null;
    },
    city: v => {
      if (!v) return null; // opcional
      if (v.length < 2) return 'Cidade/estado muito curto.';
      return null;
    },
    type: v => (!v ? 'Selecione o tipo de caso.' : null),
    message: () => null // opcional
  };

  // valida um campo isolado; opções p/ não exibir erro enquanto ainda digita
  const validateField = (name, { silent } = {}) => {
    const { el } = fieldOf(name);
    if (!el) return true;
    const msg = rules[name](el.value.trim());
    if (msg) { if (!silent) setInvalid(name, msg); return false; }
    setValid(name);
    return true;
  };

  // máscara de telefone: (62) 90000-0000
  const phoneEl = form.elements.namedItem('phone');
  if (phoneEl) {
    const mask = v => {
      const d = onlyDigits(v).slice(0, 11);
      if (d.length <= 2) return d ? '(' + d : '';
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    };
    phoneEl.addEventListener('input', () => { phoneEl.value = mask(phoneEl.value); });
  }

  // valida ao sair do campo; ao corrigir, limpa o erro do próprio campo
  Object.keys(rules).forEach(name => {
    const { el } = fieldOf(name);
    if (!el) return;
    const ev = el.tagName === 'SELECT' ? 'change' : 'blur';
    el.addEventListener(ev, () => validateField(name));
    el.addEventListener('input', () => {
      const { box } = fieldOf(name);
      if (box && box.classList.contains('invalid')) validateField(name, { silent: false });
      clearStatus();
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // honeypot: se o campo oculto vier preenchido, é bot -> ignora silenciosamente
    const trap = form.elements.namedItem('company');
    if (trap && trap.value) return;

    // valida todos os campos; foca o primeiro inválido
    const order = ['name', 'phone', 'city', 'type'];
    let firstBad = null;
    order.forEach(name => { if (!validateField(name) && !firstBad) firstBad = name; });
    if (firstBad) {
      status.textContent = 'Revise os campos destacados para continuar.';
      status.className = 'lead-status error';
      fieldOf(firstBad).el.focus();
      return;
    }

    const data = {
      name: val('name'), phone: val('phone'), city: val('city'),
      type: val('type'), message: val('message')
    };

    // envia o e-mail direto para a caixa do escritório (sem abrir Gmail/Outlook)
    status.textContent = 'Enviando…';
    status.className = 'lead-status';
    if (btn) btn.disabled = true;
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: apiKey(),
          subject: 'Novo lead do site — ' + data.name,
          from_name: 'Site • Matheus Ribeiro Advogados',
          Nome: data.name,
          WhatsApp: data.phone,
          'Cidade/UF': data.city || '—',
          'Tipo de caso': data.type,
          'Descrição': data.message || '—'
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'falha');
      status.textContent = '✓ Recebemos seus dados. Em breve entraremos em contato.';
      status.className = 'lead-status ok';
      form.reset();
      // limpa marcações de validação após enviar
      Object.keys(rules).forEach(name => {
        const { box } = fieldOf(name);
        if (box) box.classList.remove('invalid', 'valid');
      });
    } catch (err) {
      status.textContent = 'Não foi possível enviar agora. Tente novamente em instantes.';
      status.className = 'lead-status error';
    } finally {
      if (btn) btn.disabled = false;
    }
  });
})();

// ===== Navegação suave dos atalhos (duração fixa e curta) =====
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const headerEl = document.getElementById('siteHeader');
  const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let active = null; // cancela animação anterior se clicar de novo

  function smoothTo(targetY) {
    const startY = window.scrollY;
    const dist = targetY - startY;
    if (Math.abs(dist) < 2) return;
    // duração quase constante: jornadas longas (passar o livro) não ficam lentas
    const duration = Math.min(900, Math.max(450, Math.abs(dist) * 0.22));
    const token = {};
    active = token;
    let start = null;
    function step(ts) {
      if (active !== token) return;          // outro clique assumiu
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      window.scrollTo(0, startY + dist * easeInOutCubic(p));
      if (p < 1) requestAnimationFrame(step);
      else active = null;
    }
    requestAnimationFrame(step);
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      setMenuOpen(false); // fecha menu mobile (e volta o toggle p/ hambúrguer)
      const headerH = headerEl ? headerEl.offsetHeight : 0;
      const y = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerH + 2);
      if (reduce) window.scrollTo(0, y);
      else smoothTo(y);
    });
  });
})();

// ===== Quem Somos — carrossel expansível =====
(function () {
  const carousel = document.getElementById('teamCarousel');
  if (!carousel) return;
  const items = Array.from(carousel.querySelectorAll('.tc-item'));
  if (!items.length) return;
  // Desktop: acordeão expansível. Mobile (≤600px): slider de 1 card por vez —
  // o CSS por breakpoint cuida da aparência; aqui só alternamos o data-active.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let active = Math.max(0, items.findIndex(el => el.hasAttribute('data-active')));
  let timer = null;

  function setActive(i) {
    active = (i % items.length + items.length) % items.length;
    items.forEach((el, idx) => el.toggleAttribute('data-active', idx === active));
  }
  const next = () => setActive(active + 1);
  const prev = () => setActive(active - 1);
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const start = () => { if (reduce) return; stop(); timer = setInterval(next, 3500); };
  const restart = () => { stop(); start(); };

  items.forEach((el, idx) => {
    el.addEventListener('click', () => { setActive(idx); restart(); });
    el.addEventListener('focus', () => { setActive(idx); restart(); });
  });
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);

  const prevBtn = document.querySelector('.tc-prev');
  const nextBtn = document.querySelector('.tc-next');
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restart(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); restart(); });

  // gesto de arrastar (swipe) — troca o card no toque, mais natural no mobile
  let touchX = null;
  carousel.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); restart(); }
    touchX = null;
  }, { passive: true });

  // só roda o auto-avanço quando o carrossel está visível
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { e.isIntersecting ? start() : stop(); });
  }, { threshold: 0.2 });
  io.observe(carousel);

  setActive(active);
})();
