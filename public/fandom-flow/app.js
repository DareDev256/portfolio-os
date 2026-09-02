(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function replay(el, cls){
    el.classList.remove(cls);
    void el.offsetWidth;          // force reflow so the animation restarts
    el.classList.add(cls);
  }

  function countUp(el){
    var target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    var suffix = el.dataset.suffix || '';
    if (reduce) { el.textContent = target.toLocaleString() + suffix; return; }
    var dur = 620, t0 = null, done = false;
    function finish(){
      if (done) return;
      done = true;
      el.textContent = target.toLocaleString();
      if (suffix) {
        var sp = document.createElement('span');
        sp.className = 'sfx'; sp.textContent = suffix; el.appendChild(sp);
      }
    }
    function step(t){
      if (done) return;
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      if (p >= 1) { finish(); return; }
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
      requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
    // rAF does not run in a background tab, so the loop can suspend partway and
    // leave a WRONG number on screen forever. Opening a link in a new tab is
    // exactly that case. This snaps to the true value regardless.
    setTimeout(finish, dur + 120);
  }

  function activate(pane){
    pane.querySelectorAll('[data-count]').forEach(countUp);
    pane.querySelectorAll('.gauge i').forEach(function(g){
      g.style.width = '0';
      requestAnimationFrame(function(){ g.style.width = g.dataset.w + '%'; });
    });
    if (!reduce) replay(pane, 'enter');
  }

  function openPane(view, id){
    view.querySelectorAll('.sub').forEach(function(b){
      b.setAttribute('aria-selected', String(b.dataset.pane === id));
    });
    var target = null;
    view.querySelectorAll('.pane').forEach(function(p){
      var on = p.id === 'p-' + id;
      p.classList.toggle('on', on);
      if (on) target = p;
    });
    if (target) activate(target);
  }

  function openView(key){
    document.querySelectorAll('.rail-btn').forEach(function(b){
      b.setAttribute('aria-selected', String(b.dataset.view === key));
    });
    var view = null;
    document.querySelectorAll('.view').forEach(function(v){
      var on = v.id === 'v-' + key;
      v.classList.toggle('on', on);
      if (on) view = v;
    });
    if (!view) return;
    var sys = view.querySelector('.sys');
    if (sys) sys.style.setProperty('--sweep-h', sys.offsetHeight + 'px');
    if (!reduce) replay(view, 'enter');
    var sel = view.querySelector('.sub[aria-selected="true"]') || view.querySelector('.sub');
    if (sel) openPane(view, sel.dataset.pane);
  }

  document.querySelectorAll('.rail-btn').forEach(function(b){
    b.addEventListener('click', function(){ openView(b.dataset.view); });
  });
  document.querySelectorAll('.sub').forEach(function(b){
    b.addEventListener('click', function(){
      openPane(b.closest('.view'), b.dataset.pane);
    });
  });

  // Staleness is the one thing this page must never hide: a dead cron would
  // otherwise leave it quietly asserting a streak with old data.
  var f = document.getElementById('freshness');
  var gen = "2026-09-02 21:00 UTC".replace(' UTC', 'Z').replace(' ', 'T');
  var days = (Date.now() - Date.parse(gen)) / 86400000;
  if (f && days > 2) {
    f.innerHTML = '<span class="stale">STALE - last built ' + Math.floor(days) +
                  ' days ago</span>';
  }

  // The Ago column was rendered at build time. The page rebuilds once a day, so
  // a row written "19m" ago still says 19m six hours later, which is the one
  // number on this page that gets less true the longer you look at it. Recompute
  // from the raw UTC timestamp on load; the build-time text is the no-JS fallback.
  document.querySelectorAll('td.rel[data-ts]').forEach(function(td){
    var t = Date.parse(td.dataset.ts);
    if (isNaN(t)) return;
    var h = (Date.now() - t) / 3600000;
    td.textContent = h < 1  ? Math.max(Math.round(h * 60), 1) + 'm'
                   : h < 48 ? Math.floor(h) + 'h'
                            : Math.floor(h / 24) + 'd';
  });

  function boot(){
    var el = document.getElementById('boot');
    if (el) el.classList.add('gone');
    openView('ninonline');
  }
  // The overlay covers the rail, so a click during boot is swallowed and the
  // view resets. Let any click or key skip straight through it.
  var t = null;
  function skip(){ if (t) { clearTimeout(t); t = null; } boot(); }
  if (reduce) { boot(); } else {
    t = setTimeout(boot, 900);
    var b = document.getElementById('boot');
    if (b) b.addEventListener('click', skip);
    document.addEventListener('keydown', skip, { once: true });
  }
})();
