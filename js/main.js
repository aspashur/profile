// aspashur — nav toggle + scroll reveals (no dependencies)
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') links.classList.remove('open');
    });
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('.reveal, .skill');
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('on'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('on');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(function (el) { io.observe(el); });
})();

// ---------- shared modal ----------
(function () {
  var modal = document.getElementById('site-modal');
  if (!modal) return;
  var panel = modal.querySelector('.modal-panel');
  var eyebrow = modal.querySelector('.m-eyebrow');
  var title = modal.querySelector('.modal-title');
  var body = modal.querySelector('.modal-body');
  var closeBtn = modal.querySelector('.modal-close');
  var lastFocus = null;

  window.openModal = function (opts) {
    lastFocus = document.activeElement;
    eyebrow.textContent = opts.eyebrow || '';
    title.textContent = opts.title || '';
    body.innerHTML = opts.html || '';
    body.scrollTop = 0;
    modal.classList.add('open');
    document.body.classList.add('modal-lock');
    closeBtn.focus();
  };
  function closeModal() {
    modal.classList.remove('open');
    document.body.classList.remove('modal-lock');
    if (lastFocus) lastFocus.focus();
  }
  closeBtn.addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
})();

// ---------- latest YouTube videos (trainings page) ----------
(function () {
  var grid = document.getElementById('yt-latest');
  if (!grid) return;
  var CHANNEL_ID = 'UCpqywsZZWeE3Vqq3KPY6cLA'; // @aspashur
  var feed = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID;
  var proxied = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(feed);

  function fallback() {
    grid.outerHTML =
      '<div class="video-embed-fallback"><iframe loading="lazy" ' +
      'src="https://www.youtube.com/embed/videoseries?list=UU' + CHANNEL_ID.slice(2) + '" ' +
      'title="Latest uploads — aspashur" allowfullscreen ' +
      'allow="accelerometer; encrypted-media; picture-in-picture"></iframe></div>' +
      '<p class="yt-note">Showing the channel\'s uploads playlist. ' +
      '<a href="https://www.youtube.com/@aspashur" target="_blank" rel="noopener">Open the channel →</a></p>';
  }

  fetch(proxied)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function (xmlText) {
      var xml = new DOMParser().parseFromString(xmlText, 'text/xml');
      var entries = Array.prototype.slice.call(xml.getElementsByTagName('entry'), 0, 4);
      if (!entries.length) throw new Error('empty feed');
      grid.innerHTML = entries.map(function (en) {
        function tag(n) { var el = en.getElementsByTagName(n)[0]; return el ? el.textContent : ''; }
        var id = tag('yt:videoId');
        var t = tag('title');
        var d = tag('published').slice(0, 10);
        return '<a class="video-card" href="https://www.youtube.com/watch?v=' + id + '" target="_blank" rel="noopener">' +
          '<div class="thumb"><img loading="lazy" src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt=""></div>' +
          '<div class="vc-body"><h3></h3><span>' + d + '</span></div></a>';
      }).join('');
      // set titles via textContent to avoid HTML injection from feed
      var cards = grid.querySelectorAll('.video-card h3');
      entries.forEach(function (en, i) {
        var el = en.getElementsByTagName('title')[0];
        if (cards[i] && el) cards[i].textContent = el.textContent;
      });
    })
    .catch(fallback);
})();

// ---------- design gallery popups ----------
(function () {
  var cards = document.querySelectorAll('.gal-card[data-group]');
  if (!cards.length || !window.DESIGN_GROUPS) return;
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      var g = window.DESIGN_GROUPS[card.getAttribute('data-group')];
      if (!g) return;
      var html = '<span class="m-meta">' + g.meta + '</span><div class="modal-gallery">' +
        g.items.map(function (it) {
          return '<figure><img loading="lazy" src="' + it.src + '" alt="' + (it.caption || '') + '">' +
            '<figcaption>' + (it.caption || '') + '</figcaption></figure>';
        }).join('') + '</div>' +
        (g.link ? '<p class="m-links"><a href="' + g.link.href + '" target="_blank" rel="noopener">' + g.link.label + ' →</a></p>' : '');
      window.openModal({ eyebrow: g.eyebrow, title: g.title, html: html });
    });
  });
})();

// ---------- abstract / summary popups (analysis, articles…) ----------
(function () {
  var cards = document.querySelectorAll('[data-abstract]');
  var data = window.PAGE_ABSTRACTS || window.ANALYSIS_ABSTRACTS;
  if (!cards.length || !data) return;
  cards.forEach(function (card) {
    card.classList.add('clickable');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    function open() {
      var a = data[card.getAttribute('data-abstract')];
      if (!a) return;
      window.openModal({ eyebrow: a.eyebrow, title: a.title, html: a.html });
    }
    card.addEventListener('click', function (e) {
      if (e.target.closest('a')) return; // let external links work
      open();
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
})();

// ---------- booking popout (Google Calendar appointment page) ----------
(function () {
  var BOOK_URL = 'https://calendar.app.google/Ebbmx7T7nW5DmBir8';
  document.querySelectorAll('[data-book]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (!window.openModal) return; // fall through to plain link
      e.preventDefault();
      window.openModal({
        eyebrow: 'Book a meeting',
        title: "Pick a time that works for you",
        html:
          '<iframe class="booking-frame" src="' + BOOK_URL + '" ' +
          'title="Book a meeting with Selaseh" loading="lazy"></iframe>' +
          '<p class="booking-fallback">Calendar not loading? ' +
          '<a href="' + BOOK_URL + '" target="_blank" rel="noopener">Open the booking page in a new tab →</a></p>'
      });
      var panel = document.querySelector('#site-modal .modal-panel');
      if (panel) panel.classList.add('booking');
    });
  });
})();

// ---------- live statistics ----------
(function () {
  var MS_DAY = 86400000;
  function daysSince(iso) { return Math.max(0, Math.floor((Date.now() - new Date(iso + 'T00:00:00')) / MS_DAY)); }

  // Experience since first GSS role — shows years, months, days; updates daily
  var expEl = document.querySelector('[data-stat="experience"]');
  if (expEl) {
    var start = new Date('2017-09-01T00:00:00');
    var now = new Date();
    var y = now.getFullYear() - start.getFullYear();
    var m = now.getMonth() - start.getMonth();
    var d = now.getDate() - start.getDate();
    if (d < 0) { m -= 1; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (m < 0) { y -= 1; m += 12; }
    expEl.innerHTML = y + '<span class="unit">y</span> ' + m + '<span class="unit">m</span> ' + d + '<span class="unit">d</span>';
  }

  // Personnel trained: 100 base on 2026-07-19, +1 per day
  var trainEl = document.querySelector('[data-stat="trained"]');
  if (trainEl) trainEl.textContent = (100 + daysSince('2026-07-19')).toLocaleString() + '+';

  // Lines of code: 50,000 base on 2026-07-19, +3 per day
  var locEl = document.querySelector('[data-stat="loc"]');
  if (locEl) locEl.textContent = (50000 + 3 * daysSince('2026-07-19')).toLocaleString() + '+';

  // Flowing marquee: duplicate the track once for a seamless loop
  var track = document.getElementById('stats-track');
  if (track && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var clone = track.innerHTML.replace(/class="stat"/g, 'class="stat dup" aria-hidden="true"');
    track.innerHTML += clone;
    track.classList.add('flow');
  }
})();

// ---------- flowing logo strips + floating topic popups ----------
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // duplicate each flow track once for a seamless loop
  document.querySelectorAll('.logo-track[data-flow]').forEach(function (track) {
    if (reduced) return;
    var clone = track.cloneNode(true);
    Array.prototype.forEach.call(clone.children, function (c) {
      c.classList.add('dup');
      c.setAttribute('aria-hidden', 'true');
      c.removeAttribute('tabindex');
    });
    while (clone.firstChild) track.appendChild(clone.firstChild);
    track.classList.add('flow');
  });

  // floating popup listing topics of engagement / training
  var tip = null;
  function showTip(chip) {
    hideTip();
    var name = chip.getAttribute('data-name') || '';
    var topics = (chip.getAttribute('data-topics') || '').split('|').filter(Boolean);
    if (!topics.length) return;
    tip = document.createElement('div');
    tip.className = 'float-tip';
    tip.innerHTML = '<b></b><ul>' + topics.map(function () { return '<li></li>'; }).join('') + '</ul>';
    tip.querySelector('b').textContent = name;
    var lis = tip.querySelectorAll('li');
    topics.forEach(function (t, i) { lis[i].textContent = t.trim(); });
    document.body.appendChild(tip);
    var r = chip.getBoundingClientRect();
    var tr = tip.getBoundingClientRect();
    var left = Math.min(Math.max(8, r.left + r.width / 2 - tr.width / 2), window.innerWidth - tr.width - 8);
    var top = r.top - tr.height - 12;
    if (top < 8) { top = r.bottom + 12; tip.classList.add('below'); }
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
  function hideTip() { if (tip) { tip.remove(); tip = null; } }

  document.querySelectorAll('.logo-chip[data-topics]').forEach(function (chip) {
    chip.addEventListener('mouseenter', function () { showTip(chip); });
    chip.addEventListener('mouseleave', hideTip);
    chip.addEventListener('focus', function () { showTip(chip); });
    chip.addEventListener('blur', hideTip);
  });
  window.addEventListener('scroll', hideTip, { passive: true });
})();
