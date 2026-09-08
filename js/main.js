/* =========================================================
   TUREN VIEW — demo LP scripts
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Reveal (per-section rise animation) ---- */
  var revealTargets = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var reveal = function (el) { el.classList.add('is-visible'); };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { reveal(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -18% 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });

    // Fallback for anchor jumps / restored scroll positions the observer may skip:
    // reveal anything already at or above the fold.
    var sweep = function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (!vh) return;
      revealTargets.forEach(function (el) {
        if (!el.classList.contains('is-visible') &&
            el.getBoundingClientRect().top < vh * 0.72) {
          reveal(el);
          io.unobserve(el);
        }
      });
    };
    window.addEventListener('scroll', sweep, { passive: true });
    window.addEventListener('load', sweep);
    document.addEventListener('visibilitychange', sweep);
    sweep();

    // Last-resort safety: if the page has been visible for a while and the
    // observer still hasn't revealed the very first block, something is wrong
    // with IO — show everything rather than leave the page blank.
    setTimeout(function () {
      if (document.visibilityState === 'visible' &&
          revealTargets[0] && !revealTargets[0].classList.contains('is-visible')) {
        revealTargets.forEach(reveal);
      }
    }, 4000);
  }

  /* ---- Header scrolled state ---- */
  var header = document.getElementById('siteHeader');
  var onScroll = function () {
    if (window.scrollY > 12) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile drawer ---- */
  var toggle = document.getElementById('navToggle');
  var drawer = document.getElementById('drawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      drawer.hidden = open;
      toggle.setAttribute('aria-label', open ? 'メニューを開く' : 'メニューを閉じる');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        toggle.setAttribute('aria-expanded', 'false');
        drawer.hidden = true;
      }
    });
  }

  /* ---- Smooth-scroll with sticky-header offset ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id === '#' || id === '#top') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        return;
      }
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var y = target.getBoundingClientRect().top + window.scrollY - (header.offsetHeight - 2);
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---- Contact form elements ---- */
  var form = document.getElementById('contactForm');
  var confirmView = document.getElementById('confirmView');
  var doneView = document.getElementById('doneView');
  var confirmList = document.getElementById('confirmList');
  var formError = document.getElementById('formError');
  var msgField = document.getElementById('fmsg');

  /* ---- "この車種を相談候補にする" -> prefill message + set 購入 ---- */
  var pickLine = '相談候補の車種：';
  function syncVehiclePicks() {
    var picked = Array.prototype.slice
      .call(document.querySelectorAll('.vehicle-pick:checked'))
      .map(function (c) { return c.value; });
    // remove existing auto line
    var lines = msgField.value.split('\n').filter(function (l) {
      return l.indexOf(pickLine) !== 0;
    });
    if (picked.length) {
      lines.unshift(pickLine + picked.join('・'));
      var buy = form.querySelector('input[name="topic"][value="購入"]');
      if (buy) buy.checked = true;
    }
    msgField.value = lines.join('\n').replace(/^\n+/, '');
  }
  document.querySelectorAll('.vehicle-pick').forEach(function (c) {
    c.addEventListener('change', syncVehiclePicks);
  });

  /* ---- CTA intent (e.g. 買取・入れ替えを相談する) ---- */
  document.querySelectorAll('[data-intent]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var val = btn.getAttribute('data-intent');
      var radio = form.querySelector('input[name="topic"][value="' + val + '"]');
      if (radio) radio.checked = true;
    });
  });

  /* ---- Privacy toggle ---- */
  var pvToggle = document.getElementById('privacyToggle');
  var pvPanel = document.getElementById('privacyPanel');
  if (pvToggle && pvPanel) {
    pvToggle.addEventListener('click', function () {
      var open = pvToggle.getAttribute('aria-expanded') === 'true';
      pvToggle.setAttribute('aria-expanded', String(!open));
      pvPanel.hidden = open;
    });
  }

  /* ---- Validation + confirm + send (all client-side, demo only) ---- */
  var LABELS = {
    topic: 'ご相談内容',
    name: '会社名・お名前',
    email: 'メールアドレス',
    tel: '電話番号',
    message: 'ご相談内容（詳細）'
  };

  function getData() {
    var fd = new FormData(form);
    return {
      topic: fd.get('topic') || '',
      name: (fd.get('name') || '').trim(),
      email: (fd.get('email') || '').trim(),
      tel: (fd.get('tel') || '').trim(),
      message: (fd.get('message') || '').trim(),
      consent: form.querySelector('#fconsent').checked
    };
  }

  function validate(d) {
    var errs = [];
    if (!d.name) errs.push('会社名・お名前をご入力ください。');
    if (!d.email) errs.push('メールアドレスをご入力ください。');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errs.push('メールアドレスの形式をご確認ください。');
    if (!d.message) errs.push('ご相談内容をご入力ください。');
    if (!d.consent) errs.push('個人情報の取り扱いへのご同意が必要です。');
    return errs;
  }

  function showError(list) {
    if (!list.length) { formError.hidden = true; return; }
    formError.textContent = list.join(' ');
    formError.hidden = false;
    formError.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = getData();
      var errs = validate(d);
      if (errs.length) { showError(errs); return; }
      showError([]);

      confirmList.innerHTML = '';
      [['topic', d.topic], ['name', d.name], ['email', d.email], ['tel', d.tel || '（未入力）'], ['message', d.message]]
        .forEach(function (pair) {
          var row = document.createElement('div');
          var dt = document.createElement('dt');
          var dd = document.createElement('dd');
          dt.textContent = LABELS[pair[0]];
          dd.textContent = pair[1];
          row.appendChild(dt); row.appendChild(dd);
          confirmList.appendChild(row);
        });

      form.hidden = true;
      confirmView.hidden = false;
      confirmView.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });

    document.getElementById('editBtn').addEventListener('click', function () {
      confirmView.hidden = true;
      form.hidden = false;
      form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });

    document.getElementById('sendBtn').addEventListener('click', function () {
      confirmView.hidden = true;
      doneView.hidden = false;
      doneView.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });

    document.getElementById('againBtn').addEventListener('click', function () {
      form.reset();
      document.querySelectorAll('.vehicle-pick').forEach(function (c) { c.checked = false; });
      doneView.hidden = true;
      form.hidden = false;
      form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  }
})();
