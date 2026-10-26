/* Interações leves das páginas internas — blog, artigos e Política de Privacidade
   (menu, ano no rodapé…). Independente do main.js, que é só da home. */
(function () {
  'use strict';

  // ano no rodapé
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // header ganha fundo ao rolar
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // menu mobile/tablet: botão hambúrguer ↔ X (mesmo comportamento da home)
  var menuToggle = document.getElementById('menuToggle');
  var navLinks = document.getElementById('navLinks');
  var navOverlay = document.getElementById('navOverlay');
  if (menuToggle && navLinks) {
    var setMenuOpen = function (open, returnFocus) {
      navLinks.classList.toggle('open', open);
      if (navOverlay) navOverlay.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);   // trava a rolagem da página atrás
      // com o menu aberto, o resto da página fica inerte: o Tab não "vaza" para trás do menu
      document.querySelectorAll('body > :not(.site-header):not(script)').forEach(function (el) { el.inert = open; });
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      if (open) {
        var first = navLinks.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      } else if (returnFocus) {
        menuToggle.focus();
      }
    };
    menuToggle.addEventListener('click', function () { setMenuOpen(!navLinks.classList.contains('open')); });
    if (navOverlay) navOverlay.addEventListener('click', function () { setMenuOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) setMenuOpen(false, true);
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenuOpen(false); });
    });
    window.matchMedia('(max-width: 1100px)').addEventListener('change', function (e) {
      if (!e.matches) setMenuOpen(false);
    });
  }

  // índice lateral "Nesta página" (páginas longas marcadas com <article data-toc>).
  // Gerado a partir dos títulos de seção (h2); aparece só em telas largas (CSS, a partir de 1200px).
  var tocArticle = document.querySelector('article[data-toc]');
  var tocHeads = tocArticle ? tocArticle.querySelectorAll('.article-body h2') : [];
  if (tocHeads.length >= 3) {
    var slug = function (t) {
      return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    };
    var aside = document.createElement('aside');
    aside.className = 'page-toc';
    aside.setAttribute('aria-label', 'Nesta página');
    var html = '<nav><p class="page-toc-title">Nesta página</p><ol>';
    Array.prototype.forEach.call(tocHeads, function (h) {
      if (!h.id) h.id = slug(h.textContent);
      html += '<li><a href="#' + h.id + '">' + h.textContent + '</a></li>';
    });
    aside.innerHTML = html + '</ol></nav>';
    tocArticle.insertBefore(aside, tocArticle.firstChild);
    var tocLinks = aside.querySelectorAll('a');
    var reduceToc = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // clique: rola até a seção e leva o foco junto (sem # no endereço: o Umami contaria como nova visita)
    Array.prototype.forEach.call(tocLinks, function (a) {
      a.addEventListener('click', function (e) {
        var h = document.getElementById(a.getAttribute('href').slice(1));
        if (!h) return;
        e.preventDefault();
        h.scrollIntoView({ behavior: reduceToc ? 'auto' : 'smooth', block: 'start' });
        h.setAttribute('tabindex', '-1');
        h.focus({ preventScroll: true });
      });
    });

    // destaca a seção que está sendo lida: a última cujo título já passou de ~35% da tela
    var tocTicking = false;
    var markActive = function () {
      tocTicking = false;
      var line = window.innerHeight * 0.35, current = 0;
      Array.prototype.forEach.call(tocHeads, function (h, i) { if (h.getBoundingClientRect().top <= line) current = i; });
      Array.prototype.forEach.call(tocLinks, function (a, i) {
        a.classList.toggle('is-active', i === current);
        if (i === current) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    };
    window.addEventListener('scroll', function () {
      if (!tocTicking) { tocTicking = true; window.requestAnimationFrame(markActive); }
    }, { passive: true });
    markActive();
  }

  // revela elementos .reveal ao entrar na viewport
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.style.transition = 'opacity .7s var(--ease,ease), transform .7s var(--ease,ease)';
            e.target.style.opacity = '1';
            e.target.style.transform = 'none';
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
    }
  }
})();
