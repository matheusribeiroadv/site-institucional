// ===== Ano dinâmico no rodapé =====
document.getElementById('year').textContent = new Date().getFullYear();

// A entrada do hero é feita em CSS (ver "Entrada do hero" no main.css + script no <head>).

// ===== Header glass + parallax da imagem do hero + barra de progresso =====
const header = document.getElementById('siteHeader');
const heroBg = document.getElementById('heroBg');
const scrollHint = document.getElementById('scrollHint');
const progressBar = document.getElementById('scrollProgress');
const floatingLayer = document.querySelector('.floating-objects');
const smallScreenQ = window.matchMedia('(max-width: 560px)');   // no celular os objetos de fundo ficam ocultos (CSS)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let headerTicking = false;
// altura rolável medida só ao carregar e ao redimensionar (ler isso a cada quadro forçava recálculo de layout)
let maxScroll = 1;
const measureScroll = () => { maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); };
function syncHeader() {
  const y = window.scrollY || document.documentElement.scrollTop;
  header.classList.toggle('scrolled', y > 40);
  // indicador de rolagem some assim que o visitante começa a rolar
  if (scrollHint) scrollHint.classList.toggle('is-hidden', y > 60);
  // imagem rural do hero desce mais devagar que o scroll (parallax)
  if (heroBg && !reduceMotion && y < 1100) {
    heroBg.style.transform = 'translate3d(0,' + (y * 0.18).toFixed(1) + 'px,0)';
  }
  // barra de progresso no topo e leve subida dos objetos jurídicos de fundo: só mudam o transform
  // (camadas próprias, sem redesenho). Antes eram dois onScroll do Anime.js — o script mais pesado da página
  // durante a rolagem (medido em 11/11/2026).
  if (reduceMotion) return;
  const prog = Math.min(1, y / maxScroll);
  if (progressBar) progressBar.style.transform = 'scaleX(' + prog.toFixed(4) + ')';
  if (floatingLayer && !smallScreenQ.matches) floatingLayer.style.transform = 'translate3d(0,' + (-120 * prog).toFixed(1) + 'px,0)';
}
window.addEventListener('scroll', () => {
  if (!headerTicking) {
    window.requestAnimationFrame(() => { syncHeader(); headerTicking = false; });
    headerTicking = true;
  }
}, { passive: true });
let resizeTimer = 0;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { measureScroll(); syncHeader(); }, 150); });
window.addEventListener('load', () => { measureScroll(); syncHeader(); });   // imagens carregadas mudam a altura
if (progressBar && reduceMotion) progressBar.style.transform = 'scaleX(1)';
measureScroll();
syncHeader();

// ===== Animações de scroll com Anime.js =====
(function () {
  const anime = window.anime;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  const floatObjs = Array.from(document.querySelectorAll('.float-obj'));

  // Fallback: sem Anime.js ou movimento reduzido -> revela tudo estaticamente
  if (!anime || !anime.animate || reduce) {
    reveals.forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    return;
  }

  const { animate } = anime;
  // (a barra de progresso do topo é atualizada no syncHeader, lá em cima)

  // Textos aparecendo ao descer — animação Anime.js disparada por
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

  // 5) Parallax do conjunto conforme a página rola: feito no syncHeader (lá em cima), junto com a barra de progresso
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

  // campos de dívida: só para casos do bancário do agro (o <optgroup data-agro> do tipo de caso).
  // Sem JS eles continuam visíveis; com JS, ficam ocultos até a pessoa escolher um caso do agro.
  const typeEl = form.elements.namedItem('type');
  const agroOnly = Array.from(form.querySelectorAll('[data-agro-only]'));
  const isAgro = () => {
    const o = typeEl && typeEl.selectedOptions[0];
    return !!(o && o.parentElement && o.parentElement.hasAttribute('data-agro'));
  };
  const syncAgro = () => {
    const on = isAgro();
    agroOnly.forEach(box => {
      box.hidden = !on;
      if (on) return;
      const el = box.querySelector('select, input');   // oculto: sai vazio e sem marca de erro
      if (el) { el.value = ''; el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
      box.classList.remove('invalid', 'valid');
    });
    // sem os campos de dívida, o tipo de caso ocupa a linha inteira (não sobra buraco na grade)
    const typeBox = typeEl && typeEl.closest('.field');
    if (typeBox) typeBox.classList.toggle('field-full', !on);
  };
  if (typeEl) { typeEl.addEventListener('change', syncAgro); syncAgro(); }

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
    overdue: v => (isAgro() && !v ? 'Informe se possui dívida vencida.' : null),
    amount: v => (isAgro() && !v ? 'Selecione uma faixa de valor (ou "Prefiro não informar").' : null),
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
          from_name: 'Site • MRA Advogados & Associados',
          Nome: data.name,
          WhatsApp: data.phone,
          'Cidade/UF': data.city || '—',
          'Tipo de caso': data.type,
          'Dívida vencida': data.overdue || '—',
          'Valor aproximado': data.amount || '—',
          'Descrição': data.message || '—'
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'falha');
      status.textContent = '✓ Recebemos seus dados. Retornaremos pelo WhatsApp informado, de segunda a sexta, das 08:00 às 18:00.';
      status.className = 'lead-status ok';
      if (window.umami) umami.track('lead-formulario'); // conversão: formulário enviado
      form.reset();
      syncAgro();   // o tipo de caso volta ao "Selecione..." e os campos de dívida se escondem de novo
      // limpa marcações de validação após enviar
      Object.keys(rules).forEach(name => {
        const { el, box } = fieldOf(name);
        if (box) box.classList.remove('invalid', 'valid');
        if (el) { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
      });
    } catch (err) {
      status.textContent = 'Não foi possível enviar agora. Tente novamente ou fale pelo WhatsApp (62) 98225-4519.';
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

// ===== Nossa Essência e Nosso Espaço =====
// Essência: a foto aproxima devagar e a placa de texto desliza de leve enquanto a seção passa pela tela.
// Espaço (percurso): no computador a seção fica presa na tela (.tour--pin) e a rolagem troca as fotos;
// no celular as fotos deslizam de lado. Tocar numa foto abre em tela cheia (<dialog id="lb">).
(function () {
  const tour = document.getElementById('espaco');
  const essFoto = document.querySelector('.ess-foto');
  const essPlaca = document.querySelector('.ess-placa');
  if (!tour) return;
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = window.matchMedia('(min-width: 901px)');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pad = n => String(n).padStart(2, '0');

  const slides = Array.from(tour.querySelectorAll('.slide'));
  const paradas = Array.from(tour.querySelectorAll('.parada'));
  const pontos = Array.from(tour.querySelectorAll('.pontos button'));
  const legenda = tour.querySelector('.legenda');
  const contador = tour.querySelector('.contador');
  const caixa = tour.querySelector('.paradas-box');
  const palco = document.getElementById('palco');
  const N = slides.length;
  let atual = 0, modo = '', timer = null;

  function ativa(i, forca) {
    i = clamp(i, 0, N - 1);
    if (i === atual && !forca) return;
    atual = i;
    slides.forEach((s, k) => s.classList.toggle('on', k === i));
    paradas.forEach((b, k) => {
      b.classList.toggle('on', k === i);
      if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    pontos.forEach((b, k) => b.classList.toggle('on', k === i));
    if (legenda) legenda.innerHTML = slides[i].querySelector('.cap-texto').innerHTML;
    if (contador) contador.textContent = pad(i + 1) + ' / ' + pad(N);
    if (modo === 'auto' && caixa) caixa.style.setProperty('--p', ((i + 1) / N).toFixed(3));
  }

  // "pin" só com altura de tela normal; se a janela for muito alta ou baixa, as fotos trocam sozinhas ("auto")
  function escolheModo() {
    const vh = window.innerHeight;
    const novo = !desktop.matches ? 'deslizar' : (vh >= 560 && vh <= 1400 ? 'pin' : 'auto');
    if (novo === modo) return;
    modo = novo;
    tour.classList.toggle('tour--pin', modo === 'pin');
    paraAuto();
    if (modo === 'auto') {
      if (caixa) caixa.style.setProperty('--p', ((atual + 1) / N).toFixed(3));
      if (!reduz) iniciaAuto();
    }
  }
  function progressoPin() {
    const r = tour.getBoundingClientRect(), total = r.height - window.innerHeight;
    const p = clamp(-r.top / total, 0, 1);
    if (caixa) caixa.style.setProperty('--p', p.toFixed(4));
    ativa(Math.min(N - 1, Math.floor(p * N)));
  }
  function iniciaAuto() { paraAuto(); timer = setInterval(() => ativa((atual + 1) % N), 5500); }
  function paraAuto() { if (timer) { clearInterval(timer); timer = null; } }
  tour.addEventListener('mouseenter', () => { if (modo === 'auto') paraAuto(); });
  tour.addEventListener('mouseleave', () => { if (modo === 'auto' && !reduz) iniciaAuto(); });
  tour.addEventListener('focusin', () => { if (modo === 'auto') paraAuto(); });

  // clicar numa parada: no modo "pin" rola até o trecho dela; nos outros, mostra a foto
  paradas.forEach((b, k) => b.addEventListener('click', () => {
    if (modo === 'pin') {
      const r = tour.getBoundingClientRect(), total = r.height - window.innerHeight;
      window.scrollTo({ top: window.scrollY + r.top + (k + 0.5) / N * total, behavior: reduz ? 'auto' : 'smooth' });
    } else { ativa(k); if (modo === 'auto' && !reduz) iniciaAuto(); }
  }));

  // celular: o traço de progresso acompanha a foto que está na tela
  const passo = () => (N > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : palco.clientWidth);
  let rafTrilho = 0;
  palco.addEventListener('scroll', () => {
    if (modo !== 'deslizar' || rafTrilho) return;
    rafTrilho = requestAnimationFrame(() => { rafTrilho = 0; ativa(Math.round(palco.scrollLeft / passo())); });
  }, { passive: true });
  pontos.forEach((b, k) => b.addEventListener('click', () => {
    palco.scrollTo({ left: k * passo(), behavior: reduz ? 'auto' : 'smooth' });
  }));

  // ---- foto em tela cheia ----
  const lb = document.getElementById('lb');
  const lbImg = document.getElementById('lb-img');
  const lbTit = document.getElementById('lb-titulo');
  const lbPos = document.getElementById('lb-pos');
  let lbAtual = 0, quemAbriu = null;
  function mostra(i) {
    lbAtual = (i + N) % N;
    const s = slides[lbAtual];
    lbImg.src = s.dataset.full;
    lbImg.alt = s.querySelector('img').alt;
    lbTit.textContent = s.dataset.titulo;
    lbPos.textContent = (lbAtual + 1) + ' de ' + N;
  }
  function abre(i) {
    quemAbriu = document.activeElement; paraAuto(); mostra(i);
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
  }
  function fecha() { if (typeof lb.close === 'function') lb.close(); else lb.removeAttribute('open'); }
  if (lb) {
    lb.addEventListener('close', () => { if (quemAbriu) quemAbriu.focus(); if (modo === 'auto' && !reduz) iniciaAuto(); });
    slides.forEach((s, k) => s.querySelector('.abrir').addEventListener('click', () => abre(k)));
    document.getElementById('lb-fechar').addEventListener('click', fecha);
    document.getElementById('lb-ant').addEventListener('click', () => mostra(lbAtual - 1));
    document.getElementById('lb-prox').addEventListener('click', () => mostra(lbAtual + 1));
    lb.addEventListener('click', e => { if (e.target === lb) fecha(); });   // clicar fora da foto fecha
    lb.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') mostra(lbAtual - 1);
      if (e.key === 'ArrowRight') mostra(lbAtual + 1);
    });
    let x0 = null;   // deslizar o dedo na foto troca de foto
    lbImg.addEventListener('pointerdown', e => { x0 = e.clientX; });
    lbImg.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) mostra(lbAtual + (dx < 0 ? 1 : -1));
    });
  }

  // ---- rolagem ----
  // só no computador: no celular a foto e a placa ficam paradas (CSS). Mudar as duas a cada quadro, somado à
  // textura da placa, travava a rolagem no celular (medido em 11/11/2026)
  function essencia() {
    if (reduz || !essFoto || !desktop.matches) return;
    const r = essFoto.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < -200 || r.top > vh + 200) return;   // fora da tela: nada a fazer
    const q = clamp((vh - r.top) / (vh + r.height), 0, 1);
    essFoto.style.setProperty('--z', (1.14 - 0.14 * q).toFixed(4));
    if (essPlaca) essPlaca.style.setProperty('--ty', ((0.5 - q) * 48).toFixed(1) + 'px');
  }
  let raf = 0;
  function rolagem() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; essencia(); if (modo === 'pin') progressoPin(); });
  }
  window.addEventListener('scroll', rolagem, { passive: true });
  let tResize = 0;
  window.addEventListener('resize', () => { clearTimeout(tResize); tResize = setTimeout(() => { escolheModo(); rolagem(); }, 150); });
  escolheModo();
  ativa(0, true);
  rolagem();
})();
