// Studio 3: gameplay videos. Clips are muted and download nothing until they play. They autoplay only while on
// screen, and never when the visitor has Data Saver (or a 2G connection) or reduced motion on: then the poster and
// a big play button stay until tapped.
(() => {
  const conn = navigator.connection || {};
  const saveData = !!conn.saveData || /2g$/.test(conn.effectiveType || '');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AUTO = !saveData && !calm;
  const PLAY = '<svg aria-hidden="true" viewBox="0 0 24 24" width="34" height="34"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
  const PAUSE = '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
  const go = (v) => { v.preload = 'auto'; const p = v.play(); if (p) p.catch(() => {}); };

  // One clip with its play button: the button turns into a small pause button in the corner while it plays.
  function wire(v, btn, label) {
    v.controls = false; btn.hidden = false;
    const box = v.parentElement;
    const sync = () => {
      const on = !v.paused && !v.ended;
      box.classList.toggle('playing', on);
      btn.innerHTML = on ? PAUSE : PLAY;
      btn.setAttribute('aria-label', (on ? 'Pause ' : 'Play ') + label());
    };
    const toggle = () => { if (v.paused || v.ended) { v.userPaused = false; go(v); } else { v.userPaused = true; v.pause(); } };
    for (const e of ['play', 'playing', 'pause', 'ended']) v.addEventListener(e, sync);
    btn.addEventListener('click', toggle);
    v.addEventListener('click', toggle);
    sync();
  }

  // Autoplay while at least half on screen; pause when scrolled away (unless the visitor paused it themselves).
  const io = AUTO && 'IntersectionObserver' in window ? new IntersectionObserver((list) => {
    for (const en of list) {
      const v = en.target;
      if (en.isIntersecting) { if (!v.userPaused) go(v); } else if (!v.paused) v.pause();
    }
  }, { threshold: 0.5 }) : null;

  // Game pages
  for (const v of document.querySelectorAll('video[data-autoplay]')) {
    const btn = v.parentElement.querySelector('.gv-play');
    const name = v.getAttribute('aria-label').replace(/, no sound$/, '');
    wire(v, btn, () => `the ${name}`);
    if (io) io.observe(v);
  }

  // Home: the showreel plays each game's clip in turn; the buttons under it jump to a game.
  const reel = document.getElementById('reel');
  if (reel) {
    const stage = reel.parentElement, cap = stage.querySelector('.reel-cap');
    const thumbs = [...document.querySelectorAll('.reel-thumb')];
    let cur = 0;
    const show = (i, play) => {
      cur = (i + thumbs.length) % thumbs.length;
      const d = thumbs[cur].dataset;
      thumbs.forEach((t, k) => t.setAttribute('aria-pressed', k === cur ? 'true' : 'false'));
      stage.classList.toggle('landscape', d.orient === 'landscape');
      stage.classList.toggle('portrait', d.orient !== 'landscape');
      stage.style.setProperty('--poster', `url('${d.poster}')`);
      reel.poster = d.poster; reel.src = d.src;
      reel.setAttribute('aria-label', `Gameplay showreel: ${d.short}, no sound`);
      cap.href = d.href; cap.querySelector('img').src = d.icon; cap.querySelector('b').textContent = d.name;
      if (play) { reel.userPaused = false; go(reel); }
    };
    wire(reel, stage.querySelector('.gv-play'), () => 'the gameplay showreel');
    reel.addEventListener('ended', () => show(cur + 1, true));
    thumbs.forEach((t, i) => t.addEventListener('click', () => show(i, true)));
    if (io) io.observe(reel);
  }

  // Home cards: a muted preview on hover, for mouse users only (taps just open the game's page).
  if (AUTO && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    for (const a of document.querySelectorAll('a[data-preview]')) {
      const media = a.querySelector('.card-media');
      let pv = null;
      a.addEventListener('mouseenter', () => {
        pv = document.createElement('video');
        Object.assign(pv, { muted: true, playsInline: true, loop: true, preload: 'none', src: a.dataset.preview });
        pv.className = 'card-preview'; pv.setAttribute('aria-hidden', 'true');
        media.appendChild(pv); go(pv);
      });
      a.addEventListener('mouseleave', () => { if (pv) { pv.pause(); pv.removeAttribute('src'); pv.load(); pv.remove(); pv = null; } });
    }
  }
})();
