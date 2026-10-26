// ===== Ano dinâmico no rodapé =====
document.getElementById('year').textContent = new Date().getFullYear();

// A entrada do hero é feita em CSS (ver "Entrada do hero" no main.css + script no <head>).

// ===== Header glass + parallax da imagem do hero =====
const header = document.getElementById('siteHeader');
const heroBg = document.getElementById('heroBg');
const scrollHint = document.getElementById('scrollHint');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let headerTicking = false;
function syncHeader() {
  const y = window.scrollY || document.documentElement.scrollTop;
  header.classList.toggle('scrolled', y > 40);
  // indicador de rolagem some assim que o visitante começa a rolar
  if (scrollHint) scrollHint.classList.toggle('is-hidden', y > 60);
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

  const { animate, onScroll } = anime;

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

  // 3) e 4) Objetos jurídicos de fundo — com Web Animations (rodam no compositor do navegador).
  // Antes, o anime.js recalculava as trajetórias a cada quadro (getPointAtLength), ocupando
  // a CPU sem parar mesmo com a página parada; agora os pontos são calculados UMA vez.
  const inOutSine = 'cubic-bezier(.37,0,.63,1)';
  const inOutQuad = 'cubic-bezier(.45,0,.55,1)';
  // amostra a trajetória SVG em quadros-chave (posição + inclinação opcional)
  const pathFrames = (pathId, withRotate) => {
    const path = document.getElementById(pathId);
    if (!path || !path.getTotalLength) return null;
    const len = path.getTotalLength();
    const at = l => path.getPointAtLength(Math.max(0, Math.min(len, l)));
    const frames = [];
    for (let i = 0, n = 48; i <= n; i++) {
      const l = len * i / n, p = at(l);
      let t = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
      if (withRotate) {
        const a = at(l - 0.5), b = at(l + 0.5);
        t += ` rotate(${(Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI).toFixed(1)}deg)`;
      }
      frames.push({ transform: t });
    }
    return frames;
  };
  const bgAnims = [];
  const run = (sel, frames, opts) => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (el && frames && el.animate) bgAnims.push(el.animate(frames, Object.assign({ iterations: Infinity }, opts)));
  };
  // trator e balança seguem trajetórias (Motion Path)
  run('.obj-tractor', pathFrames('mp-tractor', true), { duration: 12000, easing: inOutSine, direction: 'alternate' });
  run('.obj-scale', pathFrames('mp-scale', false), { duration: 9000, easing: inOutQuad });
  // demais objetos — flutuação suave em loop
  floatObjs
    .filter(o => !o.matches('.obj-tractor, .obj-scale'))
    .forEach((obj, i) => run(obj,
      [{ transform: 'translateY(0) rotate(0deg)' }, { transform: 'translateY(-24px) rotate(3deg)' }],
      { duration: 4200 + i * 500, delay: i * 280, easing: inOutSine, direction: 'alternate' }));
  // no celular os objetos ficam ocultos (CSS): animações pausadas, sem custo
  const smallScreen = window.matchMedia('(max-width: 560px)');
  const syncBg = () => bgAnims.forEach(a => (smallScreen.matches ? a.pause() : a.play()));
  syncBg();
  smallScreen.addEventListener('change', syncBg);

  // 5) Parallax do conjunto conforme a página rola
  animate('.floating-objects', {
    translateY: [0, -120],
    ease: 'linear',
    autoplay: onScroll({ target: document.body, enter: 'top top', leave: 'bottom bottom', sync: true })
  });
})();

// ===== Menu mobile/tablet (botão hambúrguer ↔ X) =====
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const navOverlay = document.getElementById('navOverlay');
function setMenuOpen(open, returnFocus) {
  navLinks.classList.toggle('open', open);
  if (navOverlay) navOverlay.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);       // trava a rolagem da página atrás
  // com o menu aberto, o resto da página fica inerte: o Tab não "vaza" para trás do menu
  document.querySelectorAll('body > :not(.site-header):not(script)').forEach(el => { el.inert = open; });
  if (menuToggle) {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  if (open) {
    const first = navLinks.querySelector('a');
    if (first) first.focus({ preventScroll: true });       // teclado já entra no menu
  } else if (returnFocus && menuToggle) {
    menuToggle.focus();
  }
}
if (menuToggle) menuToggle.addEventListener('click', () => setMenuOpen(!navLinks.classList.contains('open')));
if (navOverlay) navOverlay.addEventListener('click', () => setMenuOpen(false));   // tocar fora fecha
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navLinks.classList.contains('open')) setMenuOpen(false, true);
});
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => setMenuOpen(false))
);
// se a janela crescer para o layout de desktop com o menu aberto, fecha (evita página travada)
window.matchMedia('(max-width: 1100px)').addEventListener('change', e => { if (!e.matches) setMenuOpen(false); });

// ===== Destaca no menu a seção que está na tela =====
(function () {
  const map = new Map();
  navLinks.querySelectorAll('a[href^="#"]:not(.nav-cta)').forEach(a => {
    const s = document.querySelector(a.getAttribute('href'));
    if (s) map.set(s, a);
  });
  if (!map.size || !('IntersectionObserver' in window)) return;
  // "linha de leitura" fina no meio da tela: a seção que cruza essa linha fica ativa
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { const a = map.get(e.target); if (a) a.classList.toggle('is-active', e.isIntersecting); });
  }, { rootMargin: '-45% 0px -54% 0px' });
  map.forEach((a, s) => io.observe(s));
})();

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
  // chave do formulário "Site — Formulário de contato" na conta contato@matheusribeiroadv.com.br (out/2026)
  const _p = ['OWE2ZjBiODYt', 'ZjMwNC00Yjg1', 'LWE5ZWQtZmEw', 'NzJjMjQ2OTBk'];
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
    if (!p) { p = document.createElement('p'); p.className = 'field-error'; p.id = 'erro-' + name; box.appendChild(p); }
    return p;
  };
  // o campo aponta para a sua mensagem de erro: o leitor de tela lê "Nome completo, inválido, Informe seu nome."
  const setInvalid = (name, msg) => {
    const { el, box } = fieldOf(name);
    if (box) { box.classList.add('invalid'); box.classList.remove('valid'); }
    const p = errEl(name); if (p) p.textContent = msg;
    if (el && p) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', p.id); }
  };
  const setValid = name => {
    const { el, box } = fieldOf(name);
    if (box) { box.classList.remove('invalid'); box.classList.add('valid'); }
    if (el && !el.value.trim()) box && box.classList.remove('valid'); // opcional vazio: neutro
    if (el) { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
  };
  const clearStatus = () => {
    if (status.classList.contains('error')) { status.textContent = ''; status.className = 'lead-status'; }
  };

  // regras: retornam null se ok, ou a mensagem de erro
  const onlyDigits = s => (s || '').replace(/\D/g, '');
  // telefone no formato nacional: tira o +55 (o WhatsApp mostra "+55 62 9xxxx-xxxx") e o 0 de
  // longa distância. Só com 12+ dígitos, para não confundir com o DDD 55 (RS).
  const nationalDigits = v => {
    let d = onlyDigits(v);
    if (d.length >= 12 && d.startsWith('55')) d = d.slice(2);
    else if (d.length >= 11 && d.startsWith('0')) d = d.slice(1);
    return d;
  };
  const rules = {
    name: v => {
      if (!v) return 'Informe seu nome.';
      if (v.replace(/\s/g, '').length < 3) return 'Nome muito curto.';
      if (!/^[A-Za-zÀ-ÿ'.\-]+(\s+[A-Za-zÀ-ÿ'.\-]+)+$/.test(v)) return 'Digite nome e sobrenome (apenas letras).';
      return null;
    },
    phone: v => {
      const d = nationalDigits(v);
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
    overdue: v => (!v ? 'Informe se possui dívida vencida.' : null),
    amount: v => (!v ? 'Selecione uma faixa de valor (ou "Prefiro não informar").' : null),
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
      const d = nationalDigits(v).slice(0, 11);
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
    const order = ['name', 'phone', 'city', 'type', 'overdue', 'amount'];
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
      type: val('type'), overdue: val('overdue'), amount: val('amount'), message: val('message')
    };

    // envia o e-mail direto para a caixa do escritório (sem abrir Gmail/Outlook)
    // o próprio botão mostra "Enviando…" com indicador girando; o aviso de status
    // continua anunciando o envio para leitores de tela (visualmente oculto)
    status.textContent = 'Enviando…';
    status.className = 'lead-status is-sending';
    const btnLabel = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.classList.add('is-loading'); btn.textContent = 'Enviando…'; }
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
          'Dívida vencida': data.overdue,
          'Valor aproximado': data.amount,
          'Descrição': data.message || '—'
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'falha');
      status.textContent = '✓ Recebemos seus dados. Em breve entraremos em contato.';
      status.className = 'lead-status ok';
      if (window.umami) umami.track('lead-formulario'); // conversão: formulário enviado
      form.reset();
      // limpa marcações de validação após enviar
      Object.keys(rules).forEach(name => {
        const { el, box } = fieldOf(name);
        if (box) box.classList.remove('invalid', 'valid');
        if (el) { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
      });
    } catch (err) {
      status.textContent = 'Não foi possível enviar agora. Tente novamente em instantes.';
      status.className = 'lead-status error';
    } finally {
      if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); btn.textContent = btnLabel; }
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
      // leva o foco junto: teclado e leitor de tela continuam a partir da seção, não do topo.
      // (o endereço não ganha #: o Umami contaria cada atalho como uma nova visita)
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
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
  const nav = document.querySelector('.team-nav');
  const prevBtn = document.querySelector('.tc-prev');
  const nextBtn = document.querySelector('.tc-next');
  const pauseBtn = document.querySelector('.tc-pause');
  const countEl = document.querySelector('.tc-count');
  const liveEl = document.getElementById('tcLive');

  // nome na vertical nos cards fechados (decorativo; o nome real está no h3)
  items.forEach(el => {
    const name = el.querySelector('.tc-name');
    if (!name) return;
    const v = document.createElement('span');
    v.className = 'tc-vname';
    v.setAttribute('aria-hidden', 'true');
    v.textContent = name.textContent;
    el.appendChild(v);
  });

  let active = Math.max(0, items.findIndex(el => el.hasAttribute('data-active')));
  let timer = null;

  function setActive(i, announce) {
    active = (i % items.length + items.length) % items.length;
    items.forEach((el, idx) => el.toggleAttribute('data-active', idx === active));
    if (countEl) countEl.textContent = (active + 1) + ' / ' + items.length;
    if (announce && liveEl) {   // só quando a PESSOA troca (a troca automática não "fala")
      const el = items[active];
      const nome = el.querySelector('.tc-name'), cargo = el.querySelector('.tc-title');
      liveEl.textContent = (nome ? nome.textContent : '') + (cargo ? ', ' + cargo.textContent : '') +
        ' — ' + (active + 1) + ' de ' + items.length;
    }
  }
  const next = announce => setActive(active + 1, announce);
  const prev = announce => setActive(active - 1, announce);

  // Troca automática "educada":
  // - liga só se a pessoa não pediu "reduzir movimento";
  // - pausa enquanto o mouse está em cima, o foco do teclado está na seção ou ela está fora da tela;
  // - DESLIGA de vez quando a pessoa interage (setas, clique, toque) — e o botão permite retomar.
  let auto = !reduce, visible = false, hovering = false, focusInside = false;
  function sync() {
    const run = auto && visible && !hovering && !focusInside;
    if (run && !timer) timer = setInterval(() => next(false), 4500);
    if (!run && timer) { clearInterval(timer); timer = null; }
    if (pauseBtn) {
      pauseBtn.classList.toggle('is-paused', !auto);
      pauseBtn.setAttribute('aria-pressed', String(!auto));
      pauseBtn.setAttribute('aria-label', auto ? 'Pausar troca automática' : 'Retomar troca automática');
    }
  }
  const userInteracted = () => { auto = false; sync(); };

  items.forEach((el, idx) => {
    el.addEventListener('click', () => { setActive(idx, true); userInteracted(); });
    el.addEventListener('focus', () => setActive(idx));   // o leitor já lê o card focado; foco pausa via focusInside
  });
  carousel.addEventListener('mouseenter', () => { hovering = true; sync(); });
  carousel.addEventListener('mouseleave', () => { hovering = false; sync(); });

  // foco do teclado dentro do carrossel ou dos botões: pausa enquanto estiver lá
  const inside = n => n && (carousel.contains(n) || (nav && nav.contains(n)));
  [carousel, nav].forEach(box => {
    if (!box) return;
    box.addEventListener('focusin', () => { focusInside = true; sync(); });
    box.addEventListener('focusout', e => { if (!inside(e.relatedTarget)) { focusInside = false; sync(); } });
  });

  if (prevBtn) prevBtn.addEventListener('click', () => { prev(true); userInteracted(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(true); userInteracted(); });
  if (pauseBtn) pauseBtn.addEventListener('click', () => { auto = !auto; sync(); });

  // gesto de arrastar (swipe) — troca o card no toque, mais natural no mobile
  let touchX = null;
  carousel.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) { dx < 0 ? next(true) : prev(true); userInteracted(); }
    touchX = null;
  }, { passive: true });

  // só roda a troca automática quando o carrossel está visível
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { visible = e.isIntersecting; sync(); });
  }, { threshold: 0.2 });
  io.observe(carousel);

  setActive(active);
  sync();
})();

// ===== "Como Atuamos" — a trilha acompanha a rolagem e acende os passos de 01 a 04 =====
// Nos dois sentidos: ao descer, o fio avança e acende cada medalhão que alcança; ao subir, recua e apaga.
// Computador: fio horizontal guiado pela rolagem. Tablet/celular: cada passo acende ao cruzar 78% da tela.
(function () {
  const steps = document.querySelector('.steps');
  if (!steps) return;
  const items = Array.from(steps.querySelectorAll('.step'));
  const line = steps.querySelector('.steps-line i');
  // movimento reduzido: tudo pronto, sem animar (sem a classe .is-animated nada fica apagado)
  if (!items.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (line) line.style.transform = 'scaleX(1)';
    return;
  }
  steps.classList.add('is-animated');
  const desktop = window.matchMedia('(min-width: 901px)');
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    if (desktop.matches) {
      // começa com os passos a 82% da tela e completa a 42%; o medalhão do passo i fica na fração i/3 do fio
      const p = Math.min(1, Math.max(0, (vh * 0.82 - steps.getBoundingClientRect().top) / (vh * 0.40)));
      if (line) line.style.transform = `scaleX(${p.toFixed(4)})`;
      items.forEach((el, i) => el.classList.toggle('is-on', p > 0.002 && p >= i / (items.length - 1) - 0.02));
    } else {
      items.forEach(el => el.classList.toggle('is-on', el.getBoundingClientRect().top < vh * 0.78));
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
