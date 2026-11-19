/* Página do guia (e-book): cadastro que libera o download.
   Envia nome, e-mail e as autorizações marcadas para a planilha do escritório (Google Apps Script,
   tools/apps-script/ebook-cadastro.gs); o endereço fica em data-endpoint no <form>.
   Só depois da resposta "ok" o botão do PDF aparece. */
(function () {
  'use strict';
  var form = document.getElementById('ebookForm');
  if (!form) return;
  var pronto = document.getElementById('ebookPronto');
  var status = document.getElementById('ebookStatus');
  var botao = form.querySelector('.lead-submit');
  var rotuloBotao = botao.textContent;
  var el = function (n) { return form.elements.namedItem(n); };
  var whatsCampo = document.getElementById('ebWhatsCampo');
  var digitos = function (v) {
    var d = String(v || '').replace(/\D/g, '');
    if ((d.length === 12 || d.length === 13) && d.indexOf('55') === 0) d = d.slice(2);   // +55 colado
    return d;
  };

  var regras = {
    nome: function (v) {
      if (!v) return 'Informe seu nome.';
      if (v.replace(/[^A-Za-zÀ-ÿ]/g, '').length < 3) return 'Nome muito curto.';
      return null;
    },
    email: function (v) {
      if (!v) return 'Informe seu e-mail.';
      if (!/^[^\s@'"<>]+@[^\s@'"<>]+\.[a-z]{2,}$/i.test(v)) return 'E-mail inválido. Confira, por exemplo: nome@gmail.com';
      return null;
    },
    aceite: function () { return el('aceite').checked ? null : 'Marque esta caixa para liberar o guia.'; },
    whatsapp: function (v) {
      if (!el('contato').checked) return null;
      var d = digitos(v);
      if (!d) return 'Informe seu WhatsApp para a equipe retornar.';
      if (d.length < 10 || d.length > 11 || /^(\d)\1+$/.test(d)) return 'WhatsApp inválido. Use DDD + número, ex.: (62) 90000-0000.';
      return null;
    }
  };

  var campo = function (n) { return el(n).closest('.field'); };
  var mostrar = function (n, msg) {
    var c = campo(n), e = c.querySelector('.field-error');
    c.classList.toggle('invalid', !!msg);
    c.classList.toggle('valid', !msg && n !== 'aceite');
    el(n).setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (e) e.textContent = msg || '';
  };
  var validar = function (n) {
    var msg = regras[n](el(n).value.trim());
    mostrar(n, msg);
    return !msg;
  };

  // máscara (62) 90000-0000
  el('whatsapp').addEventListener('input', function () {
    var d = digitos(this.value).slice(0, 11);
    this.value = d.length <= 2 ? (d ? '(' + d : '') :
      d.length <= 6 ? '(' + d.slice(0, 2) + ') ' + d.slice(2) :
      d.length <= 10 ? '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6) :
      '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  });

  // "Quero falar com a equipe" mostra o campo de WhatsApp (e só aí ele é obrigatório)
  el('contato').addEventListener('change', function () {
    whatsCampo.hidden = !this.checked;
    this.setAttribute('aria-expanded', String(this.checked));
    el('whatsapp').required = this.checked;
    if (this.checked) el('whatsapp').focus();
    else mostrar('whatsapp', null);
  });

  ['nome', 'email', 'whatsapp'].forEach(function (n) {
    el(n).addEventListener('blur', function () { if (this.value.trim()) validar(n); });
    el(n).addEventListener('input', function () { if (campo(n).classList.contains('invalid')) validar(n); });
  });
  el('aceite').addEventListener('change', function () { validar('aceite'); });

  // ---------- anti-robô (Cloudflare Turnstile) ----------
  // O script da planilha confere o passe com a chave secreta; sem passe válido, o cadastro é recusado.
  var sitekey = function () { return form.getAttribute('data-turnstile'); };   // lida na hora de usar
  var cap = { token: null, id: null, esperando: [], carregou: false, interativo: false };
  var entregar = function () {
    var fila = cap.esperando; cap.esperando = [];
    fila.forEach(function (cb) { cb(cap.token); });
  };
  var carregarCaptcha = function () {
    if (!sitekey() || cap.carregou) return;
    cap.carregou = true;
    window.ebCaptchaPronto = function () {
      cap.id = window.turnstile.render('#ebCaptcha', {
        sitekey: sitekey(), action: 'ebook', language: 'pt-br', theme: 'dark', size: 'flexible',
        appearance: 'interaction-only',            // invisível, a não ser que a Cloudflare peça um clique
        callback: function (t) { cap.token = t; cap.interativo = false; entregar(); },
        'expired-callback': function () { cap.token = null; },
        'error-callback': function () { cap.token = null; entregar(); },
        'before-interactive-callback': function () {
          cap.interativo = true;
          aviso('Confirme a verificação de segurança logo acima do botão.', 'error');
        }
      });
    };
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=ebCaptchaPronto';
    s.async = true;
    s.onerror = function () { entregar(); };
    document.head.appendChild(s);
  };
  form.addEventListener('focusin', carregarCaptcha);   // começa quando a pessoa entra no formulário
  // espera o passe: até 20 s; se a Cloudflare pediu um clique, espera a pessoa clicar
  var obterPasse = function () {
    return new Promise(function (ok) {
      if (!sitekey() || cap.token) return ok(cap.token);
      carregarCaptcha();
      cap.esperando.push(ok);
      (function vigiar(t) {
        setTimeout(function () {
          if (cap.esperando.indexOf(ok) < 0) return;
          if (cap.interativo && t < 180) return vigiar(t + 20);
          cap.esperando.splice(cap.esperando.indexOf(ok), 1); ok(null);
        }, 20000);
      })(20);
    });
  };
  var renovarPasse = function () {   // cada passe vale para um envio só
    cap.token = null;
    if (window.turnstile && cap.id !== null) window.turnstile.reset(cap.id);
  };

  var aviso = function (msg, tipo) {
    status.textContent = msg;
    status.className = 'lead-status' + (tipo ? ' ' + tipo : '');
  };
  var ERRO = 'Não foi possível liberar o guia agora. Tente de novo em instantes ou fale conosco pelo WhatsApp (62) 98225-4519.';
  var MSG = {
    nome: 'Confira o nome informado.', email: 'Confira o e-mail informado.', whatsapp: 'Confira o WhatsApp informado.',
    aceite: 'Marque a caixa de concordância para liberar o guia.', limite: ERRO, interno: ERRO,
    captcha: 'Não foi possível confirmar a verificação de segurança. Tente de novo; se continuar, fale conosco pelo WhatsApp (62) 98225-4519.'
  };

  // ---------- celular: abrir o PDF num app de leitura (Adobe, Drive, Arquivos…) ----------
  // Um site não abre um app específico; o caminho que funciona no Android e no iPhone é a tela de
  // compartilhar do aparelho com o próprio arquivo. O PDF é buscado antes do toque porque o
  // navigator.share só vale logo depois do toque (o iPhone recusa se houver espera no meio).
  var prepararCelular = function () {
    var caixa = pronto.querySelector('.guia-celular');
    var celular = window.matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!caixa || !celular) return;
    caixa.hidden = false;
    var instrucao = pronto.querySelector('h3 + p');
    if (instrucao) instrucao.textContent = instrucao.textContent.replace('Clique no botão', 'Toque no botão');
    var link = pronto.querySelector('a[download]');
    var abrir = caixa.querySelector('.guia-abrir-app');
    if (!navigator.share || !navigator.canShare || typeof File !== 'function') return;
    fetch(link.getAttribute('href'))
      .then(function (r) { if (!r.ok) throw new Error(); return r.blob(); })
      .then(function (b) {
        var arquivo = new File([b], link.getAttribute('download') || 'guia.pdf', { type: 'application/pdf' });
        if (!navigator.canShare({ files: [arquivo] })) return;
        abrir.hidden = false;
        abrir.addEventListener('click', function () {
          navigator.share({ files: [arquivo] }).catch(function () {});   // fechar a tela não é erro
        });
      })
      .catch(function () {});   // sem o botão extra, o download normal continua valendo
  };

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var ordem = ['nome', 'email', 'aceite', 'whatsapp'];
    var ruins = ordem.filter(function (n) { return !validar(n); });
    if (ruins.length) { el(ruins[0]).focus(); aviso(''); return; }

    var endpoint = form.getAttribute('data-endpoint');
    if (!endpoint) { aviso('O cadastro ainda não está configurado. ' + ERRO, 'error'); return; }

    var dados = {
      ebook: form.getAttribute('data-ebook'),
      textos: form.getAttribute('data-textos'),
      nome: el('nome').value.trim(),
      email: el('email').value.trim(),
      aceite: el('aceite').checked,
      newsletter: el('newsletter').checked,
      contato: el('contato').checked,
      whatsapp: el('contato').checked ? el('whatsapp').value.trim() : '',
      pagina: location.pathname,
      site: el('site').value
    };

    botao.disabled = true;
    botao.textContent = 'Liberando…';
    aviso('Liberando o guia…', 'is-sending');
    var controle = 'AbortController' in window ? new AbortController() : null;
    var prazo;

    obterPasse()
      .then(function (passe) {
        if (sitekey() && !passe) throw new Error('captcha');
        dados.captcha = passe || '';
        aviso('Liberando o guia…', 'is-sending');
        prazo = setTimeout(function () { if (controle) controle.abort(); }, 20000);
        // corpo em texto simples (sem cabeçalhos extras): o Google Apps Script aceita sem bloqueio de CORS
        return fetch(endpoint, { method: 'POST', body: JSON.stringify(dados), signal: controle ? controle.signal : undefined });
      })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (!r || !r.ok) throw new Error((r && r.erro) || 'interno');
        form.hidden = true;
        // some o cabeçalho "Baixe o guia / Informe seu nome…": fica só o aviso de liberado e o botão
        ['#guiaFormTitulo', '.guia-form-intro'].forEach(function (s) {
          var x = document.querySelector(s);
          if (x) x.hidden = true;
        });
        pronto.hidden = false;
        pronto.querySelector('.guia-pronto-contato').hidden = !dados.contato;
        pronto.querySelector('h3').focus();
        prepararCelular();
        if (window.umami && window.umami.track) {
          window.umami.track('ebook-cadastro', { newsletter: dados.newsletter ? 'sim' : 'nao', contato: dados.contato ? 'sim' : 'nao' });
        }
      })
      .catch(function (e) {
        aviso(MSG[e && e.message] || ERRO, 'error');
        if (e && regras[e.message]) { mostrar(e.message, MSG[e.message]); el(e.message).focus(); }
      })
      .then(function () {
        clearTimeout(prazo);
        renovarPasse();
        botao.disabled = false;
        botao.textContent = rotuloBotao;
      });
  });
})();
