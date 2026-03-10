/**
 * Digivice Boot Intro — blob-fetch video before login cinematic.
 */
export const DigiviceIntro = {
  _overlay: null, _video: null, _skipBtn: null, _resolved: false,
  play() {
    return new Promise((resolve) => {
      if (sessionStorage.getItem('digivice-intro-seen')) { resolve(); return; }
      this._resolved = false;
      this._createOverlay();
      this._createSkipButton();
      this._createWatermark();
      document.body.appendChild(this._overlay);
      this._skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this._video) this._video.pause();
        this._finish(resolve);
      });
      fetch('/assets/media/digivice-intro.mp4')
        .then((r) => r.blob())
        .then((blob) => {
          if (this._resolved) return;
          this._createVideo(URL.createObjectURL(blob));
          this._video.addEventListener('ended', () => this._finish(resolve), { once: true });
          this._video.play().catch(() => this._finish(resolve));
        })
        .catch(() => this._finish(resolve));
    });
  },
  _createOverlay() {
    const o = document.createElement('div');
    Object.assign(o.style, { position:'fixed',inset:'0',zIndex:'99999',display:'flex',alignItems:'center',justifyContent:'center',background:'#020204',opacity:'1',transition:'opacity 0.8s ease-in-out' });
    this._overlay = o;
  },
  _createVideo(src) {
    const v = document.createElement('video');
    v.src = src; v.muted = true; v.playsInline = true;
    Object.assign(v.style, { maxHeight:'85vh',maxWidth:'90vw',borderRadius:'8px',objectFit:'contain',filter:'brightness(1.05) contrast(1.05)',opacity:'0',transform:'scale(0.95)',transition:'opacity 0.6s ease-out, transform 0.6s ease-out' });
    v.addEventListener('canplaythrough', () => { v.style.opacity='1'; v.style.transform='scale(1)'; }, { once: true });
    const sc = document.createElement('div');
    Object.assign(sc.style, { position:'absolute',inset:'0',pointerEvents:'none',borderRadius:'8px',background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,240,255,0.015) 3px,rgba(0,240,255,0.015) 6px)' });
    const vi = document.createElement('div');
    Object.assign(vi.style, { position:'absolute',inset:'0',pointerEvents:'none',borderRadius:'8px',background:'radial-gradient(ellipse at center,transparent 60%,rgba(2,2,4,0.6) 100%)' });
    const w = document.createElement('div');
    Object.assign(w.style, { position:'relative',display:'flex',alignItems:'center',justifyContent:'center' });
    w.appendChild(v); w.appendChild(sc); w.appendChild(vi);
    this._overlay.appendChild(w);
    this._video = v;
  },
  _createSkipButton() {
    const b = document.createElement('button');
    b.textContent = 'Skip \u2192';
    Object.assign(b.style, { position:'absolute',bottom:'32px',right:'32px',fontFamily:'monospace',fontSize:'9px',color:'#4b5563',letterSpacing:'0.15em',textTransform:'uppercase',cursor:'pointer',background:'none',border:'1px solid #1f2937',borderRadius:'4px',padding:'6px 12px',opacity:'0',transition:'opacity 0.5s, color 0.2s, border-color 0.2s' });
    b.addEventListener('mouseenter', () => { b.style.color='#00f0ff'; b.style.borderColor='rgba(0,240,255,0.3)'; });
    b.addEventListener('mouseleave', () => { b.style.color='#4b5563'; b.style.borderColor='#1f2937'; });
    setTimeout(() => { b.style.opacity='1'; }, 1500);
    this._overlay.appendChild(b);
    this._skipBtn = b;
  },
  _createWatermark() {
    const m = document.createElement('div');
    m.textContent = 'PASSION OS';
    Object.assign(m.style, { position:'absolute',top:'24px',left:'24px',fontFamily:'monospace',fontSize:'9px',letterSpacing:'0.4em',textTransform:'uppercase',color:'rgba(0,240,255,0.15)',opacity:'0',transition:'opacity 0.5s' });
    setTimeout(() => { m.style.opacity='1'; }, 500);
    this._overlay.appendChild(m);
  },
  _finish(resolve) {
    if (this._resolved) return;
    this._resolved = true;
    sessionStorage.setItem('digivice-intro-seen', '1');
    this._overlay.style.opacity = '0';
    this._overlay.style.transform = 'scale(1.02)';
    this._overlay.style.transition = 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out';
    setTimeout(() => { this._overlay.remove(); this._overlay = null; this._video = null; this._skipBtn = null; resolve(); }, 800);
  },
};
