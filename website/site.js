var contactForm = document.getElementById('contact-form');
if (contactForm) contactForm.addEventListener('submit', function (e) {
  e.preventDefault();
  var f = e.target.elements, err = document.getElementById('f-err'), ok = document.getElementById('f-sent');
  var name = f.name.value.trim(), email = f.email.value.trim(), msg = f.message.value.trim();
  ok.classList.remove('show');
  if (!name) { err.textContent = 'Please add your name.'; f.name.focus(); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Please add an email address so we can reply.'; f.email.focus(); return; }
  if (!msg) { err.textContent = 'Please write your question.'; f.message.focus(); return; }
  err.textContent = '';
  ok.textContent = 'Thanks, ' + name.split(' ')[0] + '! In the live site this would reach the Mile Club inbox and we would reply to ' + email + '.';
  ok.classList.add('show');
});

(function () {
  var toast = document.getElementById('toast'), t;
  document.querySelectorAll('[data-soon]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      toast.textContent = a.textContent + ' is being written. Check back soon.';
      toast.hidden = false; clearTimeout(t); t = setTimeout(function () { toast.hidden = true; }, 2600);
    });
  });
})();

(function () {
  var SUPABASE_URL = 'https://zfdklgeiacutfezykweq.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_dDX4vOCfhyjOp-_nKYKUQA_VnUgbPTS';
  var form = document.getElementById('waitlist-form');
  if (!form) return;
  var err = document.getElementById('w-err'), ok = document.getElementById('w-sent'), btn = document.getElementById('w-btn');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var name = f.name.value.trim(), email = f.email.value.trim(), city = f.city.value.trim(), age = parseInt(f.age.value, 10);
    ok.classList.remove('show');
    if (!name) { err.textContent = 'Please add your name.'; f.name.focus(); return; }
    if (!(age >= 16 && age <= 100)) { err.textContent = 'Please add your age. You need to be 16 or older.'; f.age.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Please add an email address so we can tell you when we launch.'; f.email.focus(); return; }
    if (!city) { err.textContent = 'Please add your city.'; f.city.focus(); return; }
    err.textContent = '';
    var first = name.split(' ')[0];
    function done(msg) { ok.textContent = msg; ok.classList.add('show'); form.reset(); btn.disabled = false; btn.textContent = 'Join the waitlist'; }
    if (window.MC_PREVIEW) { done('Thanks, ' + first + '! On the live website this adds you to the waitlist for ' + city + '.'); return; }
    btn.disabled = true; btn.textContent = 'Joining…';
    fetch(SUPABASE_URL + '/rest/v1/waitlist', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ name: name, email: email, city: city, age: age })
    }).then(function (r) {
      if (r.ok) return done("You're on the list, " + first + "! We'll email you when Mile Club launches in " + city + '.');
      if (r.status === 409) return done("You're already on the list for " + city + ". We'll be in touch!");
      throw new Error(r.status);
    }).catch(function () {
      btn.disabled = false; btn.textContent = 'Join the waitlist';
      err.textContent = "Sorry, that didn't go through. Please check your connection and try again.";
    });
  });
})();

(function () {
  // [ISO code, dial code, name]
  var C = [["US","1","United States"],["GB","44","United Kingdom"],["CA","1","Canada"],["AU","61","Australia"],["NZ","64","New Zealand"],["IE","353","Ireland"],["NL","31","Netherlands"],["BE","32","Belgium"],["DE","49","Germany"],["FR","33","France"],["ES","34","Spain"],["PT","351","Portugal"],["IT","39","Italy"],["CH","41","Switzerland"],["AT","43","Austria"],["DK","45","Denmark"],["SE","46","Sweden"],["NO","47","Norway"],["FI","358","Finland"],["PL","48","Poland"],["CZ","420","Czechia"],["GR","30","Greece"],["TR","90","Turkey"],["AE","971","United Arab Emirates"],["SA","966","Saudi Arabia"],["IL","972","Israel"],["ZA","27","South Africa"],["NG","234","Nigeria"],["KE","254","Kenya"],["EG","20","Egypt"],["IN","91","India"],["PK","92","Pakistan"],["SG","65","Singapore"],["MY","60","Malaysia"],["PH","63","Philippines"],["ID","62","Indonesia"],["TH","66","Thailand"],["JP","81","Japan"],["KR","82","South Korea"],["CN","86","China"],["HK","852","Hong Kong"],["MX","52","Mexico"],["BR","55","Brazil"],["AR","54","Argentina"],["CO","57","Colombia"],["CL","56","Chile"]];
  var TZ = {"Europe/London":"GB","Europe/Dublin":"IE","Europe/Amsterdam":"NL","Europe/Brussels":"BE","Europe/Berlin":"DE","Europe/Paris":"FR","Europe/Madrid":"ES","Europe/Lisbon":"PT","Europe/Rome":"IT","Europe/Zurich":"CH","Europe/Vienna":"AT","Europe/Copenhagen":"DK","Europe/Stockholm":"SE","Europe/Oslo":"NO","Europe/Helsinki":"FI","Europe/Warsaw":"PL","Europe/Prague":"CZ","Europe/Athens":"GR","Europe/Istanbul":"TR","Asia/Dubai":"AE","Asia/Riyadh":"SA","Asia/Jerusalem":"IL","Africa/Johannesburg":"ZA","Africa/Lagos":"NG","Africa/Nairobi":"KE","Africa/Cairo":"EG","Asia/Kolkata":"IN","Asia/Calcutta":"IN","Asia/Karachi":"PK","Asia/Singapore":"SG","Asia/Kuala_Lumpur":"MY","Asia/Manila":"PH","Asia/Jakarta":"ID","Asia/Bangkok":"TH","Asia/Tokyo":"JP","Asia/Seoul":"KR","Asia/Shanghai":"CN","Asia/Hong_Kong":"HK","America/Mexico_City":"MX","America/Sao_Paulo":"BR","America/Argentina/Buenos_Aires":"AR","America/Bogota":"CO","America/Santiago":"CL","America/Toronto":"CA","America/Vancouver":"CA","Pacific/Auckland":"NZ"};
  function flag(iso) { return iso.replace(/./g, function (ch) { return String.fromCodePoint(127397 + ch.charCodeAt(0)); }); }
  var sel = document.getElementById('f-cc');
  if (!sel) return;
  C.forEach(function (c) { var o = document.createElement('option'); o.value = c[0]; o.textContent = flag(c[0]) + ' +' + c[1]; o.title = c[2]; sel.appendChild(o); });
  // Guess the visitor's country from their device settings (time zone first, then language)
  var guess = '';
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    guess = TZ[tz] || '';
    if (!guess && /^Australia\//.test(tz)) guess = 'AU';
    if (!guess && /^America\//.test(tz)) guess = 'US';
  } catch (e) {}
  if (!guess) {
    var langs = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < langs.length && !guess; i++) { var m = /-([A-Z]{2})$/i.exec(langs[i] || ''); if (m) guess = m[1].toUpperCase(); }
  }
  sel.value = C.some(function (c) { return c[0] === guess; }) ? guess : 'US';
})();


(function () {
  var r = document.documentElement, btn = document.getElementById('mode');
  var dbtns = document.querySelectorAll('.picker.darks button');
  function sync() {
    var dark = r.getAttribute('data-mode') === 'dark';
    btn.setAttribute('aria-pressed', String(dark));
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    dbtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.d === r.getAttribute('data-dark'))); });
  }
  btn.addEventListener('click', function () {
    var dark = r.getAttribute('data-mode') !== 'dark';
    if (dark) r.setAttribute('data-mode', 'dark'); else r.removeAttribute('data-mode');
    try { localStorage.setItem('mc-mode', dark ? 'dark' : 'light'); } catch (e) {}
    sync();
  });
  dbtns.forEach(function (b) { b.addEventListener('click', function () {
    r.setAttribute('data-dark', b.dataset.d);
    try { localStorage.setItem('mc-dark', b.dataset.d); } catch (e) {}
    sync();
  }); });
  sync();
})();

(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Slide sections in as you scroll
  if (!reduce && 'IntersectionObserver' in window) {
    var sel = '.head, .steps li, .feat, .tile, .timeline li, .faq details, .coach, .about-main, .about-text, .panel, .try, .cta, .photo, .prose, form, .follow';
    var items = Array.prototype.slice.call(document.querySelectorAll(sel)).filter(function (el) {
      return !el.closest('.pre') && el.getBoundingClientRect().top > window.innerHeight * 0.9;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) {
      var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty('--d', (Math.min(sibs, 5) * 0.08) + 's');
      el.style.setProperty('--from', (sibs % 2 ? '40px' : '-40px'));
      el.classList.add('slide-in', 'pre');
      io.observe(el);
    });
    // Safety net: never leave anything hidden
    setTimeout(function () { items.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.remove('pre'); }); }, 2500);
  }
  // Slide the page out before going to another page
  if (!reduce) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href$=".html"], a[href*=".html#"]');
      if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(function () { location.href = a.getAttribute('href'); }, 260);
    });
    window.addEventListener('pageshow', function () { document.body.classList.remove('leaving'); });
  }
})();
