/**
 * Digivice Boot Intro — video overlay before desktop.
 * Uses direct src (blob URLs blocked by CSP on Vercel).
 * Mobile: tap-to-play fallback, portrait-aware sizing, 44px touch targets.
 */
const isMobile = () => window.innerWidth <= 768 || 'ontouchstart' in window;

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
      this._createVideo('/assets/media/digivice-intro.mp4');
      this._video.addEventListener('ended', () => this._finish(resolve), { once: true });
      this._video.addEventListener('error', () => this._finish(resolve), { once: true });
      this._video.addEventListener('canplaythrough', () => {
        if (this._resolved) return;
        this._video.play()
          .then(() => { this._hideTapPrompt(); })
          .catch(() => { this._showTapPrompt(resolve); });
      }, { once: true });
    });
  },
  _createOverlay() {
    const o = document.createElement('div');
    Object.assign(o.style, { position:'fixed',inset:'0',zIndex:'99999',display:'flex',alignItems:'center',justifyContent:'center',background:'#020204',opacity:'1',transition:'opacity 0.8s ease-in-out' });
    this._overlay = o;
  },
  _createVideo(src) {
    const v = document.createElement('video');
    v.src = src; v.muted = true; v.preload = 'auto';
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    const mobile = isMobile();
    Object.assign(v.style, {
      maxHeight: mobile ? '50vh' : '85vh',
      maxWidth: mobile ? '100vw' : '90vw',
      width: mobile ? '100%' : 'auto',
      borderRadius: mobile ? '0' : '8px',
      objectFit: 'contain',
      filter: 'brightness(1.05) contrast(1.05)',
      opacity: '0',
      transform: 'scale(0.95)',
      transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
    });
    v.addEventListener('canplaythrough', () => { v.style.opacity='1'; v.style.transform='scale(1)'; }, { once: true });
    const w = document.createElement('div');
    Object.assign(w.style, { position:'relative',display:'flex',alignItems:'center',justifyContent:'center',width:'100%' });
    // Scanline overlay
    const sc = document.createElement('div');
    Object.assign(sc.style, { position:'absolute',inset:'0',pointerEvents:'none',borderRadius: mobile ? '0' : '8px',background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,240,255,0.015) 3px,rgba(0,240,255,0.015) 6px)' });
    // Vignette
    const vi = document.createElement('div');
    Object.assign(vi.style, { position:'absolute',inset:'0',pointerEvents:'none',borderRadius: mobile ? '0' : '8px',background:'radial-gradient(ellipse at center,transparent 60%,rgba(2,2,4,0.6) 100%)' });
    w.appendChild(v); w.appendChild(sc); w.appendChild(vi);
    this._overlay.appendChild(w);
    this._video = v;
  },
  _showTapPrompt(resolve) {
    // Autoplay blocked (common on mobile) — show tap prompt
    const tap = document.createElement('div');
    tap.textContent = 'TAP TO PLAY';
    Object.assign(tap.style, { position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontFamily:'monospace',fontSize:'12px',letterSpacing:'0.3em',textTransform:'uppercase',color:'#00f0ff',textShadow:'0 0 8px rgba(0,240,255,0.5)',padding:'16px 28px',border:'1px solid rgba(0,240,255,0.3)',borderRadius:'6px',cursor:'pointer',zIndex:'1',animation:'pulse 1.5s ease-in-out infinite' });
    this._tapPrompt = tap;
    this._overlay.appendChild(tap);
    // Inject pulse animation
    if (!document.getElementById('digivice-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'digivice-pulse-style';
      style.textContent = '@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}';
      document.head.appendChild(style);
    }
    const playOnTap = () => {
      tap.remove();
      if (this._resolved) return;
      this._video.play()
        .then(() => { this._hideTapPrompt(); })
        .catch(() => this._finish(resolve));
    };
    tap.addEventListener('click', playOnTap, { once: true });
    this._overlay.addEventListener('click', playOnTap, { once: true });
  },
  _hideTapPrompt() {
    if (this._tapPrompt) { this._tapPrompt.remove(); this._tapPrompt = null; }
  },
  _createSkipButton() {
    const b = document.createElement('button');
    b.textContent = 'Skip \u2192';
    const mobile = isMobile();
    Object.assign(b.style, {
      position: 'absolute',
      bottom: mobile ? '24px' : '32px',
      right: mobile ? '16px' : '32px',
      fontFamily: 'monospace',
      fontSize: mobile ? '12px' : '9px',
      color: '#4b5563',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      background: 'none',
      border: '1px solid #1f2937',
      borderRadius: '4px',
      padding: mobile ? '12px 20px' : '6px 12px',
      minHeight: mobile ? '44px' : 'auto',
      minWidth: mobile ? '44px' : 'auto',
      opacity: '0',
      transition: 'opacity 0.5s, color 0.2s, border-color 0.2s',
      WebkitTapHighlightColor: 'transparent',
    });
    b.addEventListener('mouseenter', () => { b.style.color='#00f0ff'; b.style.borderColor='rgba(0,240,255,0.3)'; });
    b.addEventListener('mouseleave', () => { b.style.color='#4b5563'; b.style.borderColor='#1f2937'; });
    setTimeout(() => { b.style.opacity='1'; }, 1500);
    this._overlay.appendChild(b);
    this._skipBtn = b;
  },
  _createWatermark() {
    const mobile = isMobile();
    const m = document.createElement('div');
    m.textContent = 'PASSION OS';
    Object.assign(m.style, { position:'absolute',top: mobile ? '16px' : '24px',left: mobile ? '16px' : '24px',fontFamily:'monospace',fontSize:'9px',letterSpacing:'0.4em',textTransform:'uppercase',color:'rgba(0,240,255,0.15)',opacity:'0',transition:'opacity 0.5s' });
    setTimeout(() => { m.style.opacity='1'; }, 500);
    this._overlay.appendChild(m);
  },
  _finish(resolve) {
    if (this._resolved) return;
    this._resolved = true;
    this._hideTapPrompt();
    sessionStorage.setItem('digivice-intro-seen', '1');
    this._overlay.style.opacity = '0';
    this._overlay.style.transform = 'scale(1.02)';
    this._overlay.style.transition = 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out';
    setTimeout(() => { this._overlay.remove(); this._overlay = null; this._video = null; this._skipBtn = null; resolve(); }, 800);
  },
};
