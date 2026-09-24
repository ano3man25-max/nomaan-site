(function () {
  var API = window.NOMAAN_API || '';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function show(id, on) { var e = $(id); if (e) e.classList.toggle('hide', !on); }
  function showSec(id, on) { var e = $(id); if (!e) return; var s = e.closest ? (e.closest('section') || e) : e; s.classList.toggle('hide', !on); }
  function text(id, v) { var e = $(id); if (e) e.textContent = v || ''; }
  function link(id, href) { var e = $(id); if (!e) return; if (href) { e.setAttribute('href', href); e.classList.remove('hide'); } else e.classList.add('hide'); }
  // بطاقة بوابة لا تُخفى: بلا رابط تبقى ظاهرة بعبارة «الرابط قريبًا»
  function portalCard(id, href) {
    var e = $(id); if (!e) return;
    var go = e.querySelector('.go');
    if (href) { e.setAttribute('href', href); e.classList.remove('soon'); }
    else { e.setAttribute('href', '#portal'); e.removeAttribute('target'); e.classList.add('soon'); if (go) go.textContent = 'الرابط قريبًا'; }
  }
  function isUrl(u) { return /^https?:\/\//i.test(String(u || '')); }
  // رابط صورة: يقبل رابط Drive العادي ويحوّله إلى رابط عرض مباشر، أو مسارًا نسبيًا داخل الموقع مثل assets/photos/x.jpg
  function imgUrl(u) {
    u = String(u || '').trim(); if (!u) return '';
    var m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || u.match(/[?&]id=([\w-]+)/);
    if (m && /drive\.google\.com/.test(u)) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1000';
    return u;
  }
  // احتياط لصور Drive: إن فشل رابط المصغّرة جُرِّب الرابط المباشر، ثم البديل المعطى
  function imgFallback(img, u, alt) {
    var m = String(u || '').match(/id=([\w-]+)/), tried = 0;
    img.onerror = function () {
      tried++;
      if (tried === 1 && m) { img.src = 'https://lh3.googleusercontent.com/d/' + m[1]; return; }
      img.onerror = null; if (alt) alt(img);
    };
  }
  function initials(n) { var p = String(n || '').trim().split(/\s+/); return (p[0] || '').charAt(0) + (p[1] ? p[1].charAt(0) : ''); }

  // القائمة على الجوال
  var mb = document.querySelector('.menu-btn'), nav = document.querySelector('nav.main');
  if (mb && nav) mb.addEventListener('click', function () { nav.classList.toggle('open'); });

  // تحميل البيانات: fetch ثم JSONP احتياطًا
  function load(cb, fail) {
    if (!API || API.indexOf('ضع-') !== -1) { fail('لم يُضبط رابط البيانات في assets/config.js'); return; }
    var done = false;
    try {
      fetch(API, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) { if (!done) { done = true; cb(d); } }).catch(function () { jsonp(); });
    } catch (e) { jsonp(); }
    function jsonp() {
      if (done) return;
      var name = 'nomaanCb' + Date.now();
      window[name] = function (d) { if (!done) { done = true; cb(d); } delete window[name]; };
      var s = document.createElement('script');
      s.src = API + (API.indexOf('?') === -1 ? '?' : '&') + 'callback=' + name;
      s.onerror = function () { if (!done) fail('تعذّر الاتصال بمصدر البيانات'); };
      document.head.appendChild(s);
      setTimeout(function () { if (!done) fail('تأخر مصدر البيانات'); }, 15000);
    }
  }

  function common(d) {
    document.querySelectorAll('[data-name]').forEach(function (e) { e.textContent = d.shortName || d.name || 'مجمع حلقات النعمان'; });
    var assoc = String(d.association || '').trim();
    var assocLine = assoc ? (assoc.indexOf('ال') === 0 ? 'تابع لل' + assoc.slice(2) : 'تابع لـ' + assoc) : '';
    document.querySelectorAll('[data-assoc]').forEach(function (e) { e.textContent = assocLine; });
    var L = d.links || {}, c = d.contact || {};
    portalCard('lnkParents', L.parents); portalCard('lnkStaff', L.staff); link('lnkRegister', L.register); link('lnkSuggest', L.suggest);
    link('heroRegister', L.register); link('heroParents', L.parents);
    link('ctaPortal', '#portal');
    text('fAddress', c.address); text('fPhone', c.phone); text('fEmail', c.email);
    show('fContact', !!(c.address || c.phone || c.email));
    var y = (d.stats && d.stats['سنة التأسيس هـ']) || d.founded || '';
    text('foundedYear', y ? y + 'هـ' : '');
    document.querySelectorAll('[data-copyright]').forEach(function (e) { e.textContent = '© ' + (new Date().getFullYear()) + ' — ' + (d.shortName || 'مجمع حلقات النعمان') + ' — جميع الحقوق محفوظة'; });
  }

  function hijriToday() {
    try {
      var f = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      return f.format(new Date()).replace(/\s*هـ$/, '') + 'هـ';
    } catch (e) { return ''; }
  }
  function home(d) {
    common(d);
    // بطاقة الواجهة: الجمعية، تاريخ اليوم، أرقام مختصرة، سنة التأسيس
    var S0 = d.stats || {};
    text('heroToday', hijriToday());
    var mini = [['الحلقات القائمة', 'حلقة'], ['الطلاب المنتظمون', 'طالبًا'], ['المعلمون', 'معلمًا']].filter(function (x) { return S0[x[0]]; });
    var hs = $('heroStats'); if (hs) hs.innerHTML = mini.map(function (x) { return '<div><b>' + esc(S0[x[0]]) + '</b>' + esc(x[1]) + '</div>'; }).join('');
    var fy = S0['سنة التأسيس هـ'] || d.founded || '';
    text('heroFounded', fy ? 'في خدمة كتاب الله منذ عام ' + fy + 'هـ' : '');
    text('tagline', d.tagline || '');
    show('tagline', !!d.tagline);
    var sup = d.supervisor || {};
    text('supWord', sup.word); text('supName', sup.name || '');
    if (d.headline) text('headline', d.headline);
    var sp = $('supPhoto'), spu = imgUrl(sup.photo);
    if (sp && spu) {
      imgFallback(sp, spu, function (im) { im.src = 'assets/logo-teal.png'; im.style.objectFit = 'contain'; im.style.padding = '18px'; im.alt = ''; });
      sp.alt = ''; sp.style.objectFit = 'cover'; sp.style.padding = '0'; sp.src = spu;
    }
    showSec('secWord', !!sup.word);

    var S = d.stats || {};
    var thisYear = [
      ['الحلقات القائمة', 'حلقة قائمة'], ['الطلاب المنتظمون', 'طالبًا منتظمًا'], ['المعلمون', 'معلمًا'],
      ['أجزاء حُفظت هذا العام', 'جزءًا حُفظ هذا العام'], ['نسبة الحضور %', 'نسبة الحضور', '%'], ['أيام الدراسة المسجلة', 'يومًا دراسيًا مسجلًا']
    ].filter(function (x) { return S[x[0]] !== undefined && S[x[0]] !== ''; }).slice(0, 4);
    var since = [
      ['الخريجون منذ التأسيس', 'خريجًا أتمّ الحفظ'], ['طلاب مرّوا بالحلقات منذ التأسيس', 'طالبًا مرّوا بالحلقات'],
      ['المعلمون والمشرفون منذ التأسيس', 'معلمًا ومشرفًا شاركوا'], ['أعوام منذ التأسيس', 'عامًا من العطاء']
    ].filter(function (x) { return S[x[0]] !== undefined && S[x[0]] !== '' && Number(S[x[0]]) > 0; });
    var g = function (rows, soft) { return rows.map(function (x) { return '<div class="stat' + (soft ? ' soft' : '') + '"><div class="n">' + esc(S[x[0]]) + (x[2] || '') + '</div><div class="l">' + esc(x[1]) + '</div></div>'; }).join(''); };
    $('statsYear').innerHTML = g(thisYear, false);
    $('statsSince').innerHTML = g(since, true);
    showSec('secStats', thisYear.length > 0 || since.length > 0);
    show('sinceWrap', since.length > 0);
    text('sinceHead', 'منذ التأسيس' + (S['سنة التأسيس هـ'] ? ' عام ' + S['سنة التأسيس هـ'] + 'هـ' : ''));

    var J = d.journey || [];
    $('journey').innerHTML = J.map(function (s, i) {
      return '<div class="stop' + (i === 0 ? ' first' : '') + (i === J.length - 1 && J.length > 1 ? ' last' : '') + '"><div class="y">' + esc(s.year ? s.year + 'هـ' : '') + '</div><div class="t">' + esc(s.title) + (s.venue ? ' — ' + esc(s.venue) : '') + '</div><div class="d">' + esc(s.text) + '</div></div>';
    }).join('');
    showSec('secJourney', J.length > 0);

    var A = d.activities || [];
    $('acts').innerHTML = A.slice(0, 6).map(function (a) {
      var cover = isUrl(a.cover) ? '<img src="' + esc(a.cover) + '" alt="" loading="lazy">' : '<span>' + esc(a.title) + '</span>';
      return '<div class="act"><div class="cover">' + cover + '</div><div class="body"><div class="date">' + esc(a.date) + '</div><div class="title">' + esc(a.title) + '</div>' + (a.text ? '<div class="mut">' + esc(a.text) + '</div>' : '') + (isUrl(a.folder) ? '<a href="' + esc(a.folder) + '" target="_blank" rel="noopener">صور النشاط</a>' : '') + '</div></div>';
    }).join('');
    showSec('secActs', A.length > 0);

    var N = d.news || [];
    $('news').innerHTML = N.slice(0, 5).map(function (n) {
      return '<div class="news-item"><div class="date">' + esc(n.date) + '</div><div><div class="title">' + esc(n.title) + '</div>' + (n.text ? '<div class="text">' + esc(n.text) + '</div>' : '') + '</div></div>';
    }).join('');
    showSec('secNews', N.length > 0);
    show('status', false);
  }

  function record(d) {
    common(d);
    var G = d.graduates || [], P = d.staff || [];
    text('gradCount', G.length ? G.length + ' خريجًا' : '');
    function renderGrads(q) {
      var qq = (q || '').trim();
      var rows = G.filter(function (x) { return !qq || (x.name + ' ' + x.year).indexOf(qq) !== -1; });
      $('grads').innerHTML = rows.length ? rows.map(function (x) { return '<div class="row"><div class="nm">' + esc(x.name) + '</div><div>' + esc(x.year ? x.year + 'هـ' : '') + '</div><div class="mut">' + esc(x.ring) + '</div><div class="mut tch">' + esc(x.teacher) + '</div></div>'; }).join('')
        : '<div class="empty">' + (G.length ? 'لا نتيجة لهذا البحث.' : 'تُنشر أسماء الخريجين هنا بإذن أولياء أمورهم.') + '</div>';
    }
    renderGrads('');
    var q = $('gradSearch'); if (q) q.addEventListener('input', function () { renderGrads(q.value); });

    var sections = ['الحاليون', 'السابقون', 'الإدارة والإشراف'], cur = 'الحاليون';
    function renderStaff() {
      var rows = P.filter(function (p) { return (p.section || 'السابقون') === cur; });
      $('people').innerHTML = rows.length ? rows.map(function (p) {
        var yrs = p.from || p.to ? (p.from ? p.from + 'هـ' : '') + (p.to ? ' — ' + p.to : '') : '';
        var pu = imgUrl(p.photo), av = '<div class="av" style="position:relative;overflow:hidden"><span>' + esc(initials(p.name)) + '</span>' + (pu ? '<img src="' + esc(pu) + '" alt="" loading="lazy" data-photo="1" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">' : '') + '</div>';
        return '<div class="person">' + av + '<div><div class="nm">' + esc(p.name) + '</div><div class="rl">' + esc(p.role) + (p.ring ? ' — ' + esc(p.ring) : '') + '</div>' + (yrs ? '<div class="yr">' + esc(yrs) + '</div>' : '') + '</div></div>';
      }).join('') : '<div class="empty">لا أسماء في هذا القسم بعد.</div>';
      $('people').querySelectorAll('img[data-photo]').forEach(function (im) { imgFallback(im, im.getAttribute('src'), function (x) { x.remove(); }); });
      document.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-sec') === cur); });
    }
    document.querySelectorAll('.chip').forEach(function (c) { c.addEventListener('click', function () { cur = c.getAttribute('data-sec'); renderStaff(); }); });
    text('staffCount', P.length ? P.length + ' مشاركًا' : '');
    renderStaff();
    show('status', false);
  }

  window.NOMAAN = { home: home, record: record, load: load };
  document.addEventListener('DOMContentLoaded', function () {
    var page = document.body.getAttribute('data-page');
    load(function (d) { (page === 'record' ? record : home)(d); }, function (msg) { var s = $('status'); if (s) s.textContent = msg; });
  });
})();
