(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const COL = { x: '#1d4ed8', v: '#ea580c', a: '#059669', sec: '#7c3aed', tan: '#1a2332', guia: '#64748b' };
  const PAD = { l: 58, r: 16, t: 12, b: 30 };
  const RES = 600;
  const DT_MIN = 0.001;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MOV = {
    uniforme: {
      boto: 'Caminar', T: 10, t0: 3, eix: 'x',
      desc: 'Una persona camina a ritme constant (1,5 m/s) des de x = 2 m. La gràfica x(t) és una recta: té el mateix pendent a tot arreu.',
      x: t => 2 + 1.5 * t,
      v: () => 1.5,
      a: () => 0
    },
    cotxe: {
      boto: 'Cotxe', T: 12, t0: 2, eix: 'x',
      desc: 'Un cotxe arrenca (2 m/s² durant 4 s), circula a 8 m/s durant 4 s més i frena (−2 m/s²) fins a aturar-se.',
      x: t => t <= 4 ? t * t : t <= 8 ? 16 + 8 * (t - 4) : 48 + 8 * (t - 8) - (t - 8) ** 2,
      v: t => t <= 4 ? 2 * t : t <= 8 ? 8 : 8 - 2 * (t - 8),
      a: t => t < 4 ? 2 : t < 8 ? 0 : -2
    },
    pilota: {
      boto: 'Pilota amunt', T: 4, t0: 1, eix: 'y',
      desc: 'Una pilota es llança cap amunt a 20 m/s. Puja, s’atura un instant al punt més alt i torna a baixar (sense fregament de l’aire).',
      x: t => 20 * t - 4.9 * t * t,
      v: t => 20 - 9.8 * t,
      a: () => -9.8
    },
    molla: {
      boto: 'Molla (MHS)', T: 4, t0: 0.25, eix: 'x',
      desc: 'Una massa lligada a una molla oscil·la entre −0,2 m i 0,2 m amb un període de 2 s (moviment harmònic simple).',
      x: t => 0.2 * Math.cos(Math.PI * t),
      v: t => -0.2 * Math.PI * Math.sin(Math.PI * t),
      a: t => -0.2 * Math.PI * Math.PI * Math.cos(Math.PI * t)
    }
  };

  const MAG = {
    x: { nom: 'posició', u: 'm', tu: '\\mathrm{m}' },
    v: { nom: 'velocitat', u: 'm/s', tu: '\\mathrm{m/s}' },
    a: { nom: 'acceleració', u: 'm/s²', tu: '\\mathrm{m/s^2}' }
  };

  const st = {
    mode: 'deriv', cad: 'xv', mov: 'cotxe',
    t: 2, dt: 1, N: 6,
    tangent: true, rect: true, sencera: false,
    rastre: new Set(),
    play: false, last: 0, raf: 0, lastPasos: 0, tAnim: 0
  };

  const cvStrip = $('cvStrip'), cvTop = $('cvTop'), cvBot = $('cvBot');
  const cxStrip = cvStrip.getContext('2d'), cxTop = cvTop.getContext('2d'), cxBot = cvBot.getContext('2d');

  /* ---------- Format ---------- */

  function fmt(n, sig = 3) {
    if (!isFinite(n)) return '—';
    const a = Math.abs(n);
    if (a < 1e-9) return '0';
    const dec = Math.max(0, sig - 1 - Math.floor(Math.log10(a)));
    return n.toFixed(dec).replace('-', '−').replace('.', ',');
  }
  const fmtT = t => t.toFixed(2).replace('.', ',');
  const fmtDt = dt => String(parseFloat(dt.toPrecision(2))).replace('.', ',');
  const fmtTick = y => String(Number(y.toPrecision(10))).replace('-', '−').replace('.', ',');
  const tex = (n, sig) => fmt(n, sig).replace('−', '-').replace(',', '{,}');
  const par = (n, sig) => n < 0 ? `\\left(${tex(n, sig)}\\right)` : tex(n, sig);
  const texT = t => fmtT(t).replace(',', '{,}');
  const texDt = dt => fmtDt(dt).replace(',', '{,}');

  function renderMath(root) {
    root.querySelectorAll('[data-math]').forEach(el => {
      if (window.katex) {
        katex.render(el.dataset.math, el, {
          throwOnError: false, strict: 'ignore', displayMode: el.tagName === 'DIV'
        });
      } else {
        el.textContent = el.dataset.math;
      }
    });
  }

  /* ---------- Model ---------- */

  const mov = () => MOV[st.mov];
  const sim = k => k === 'x' ? mov().eix : k;
  const claus = () => st.mode === 'integ' ? { top: 'v', bot: 'x' }
    : st.cad === 'xv' ? { top: 'x', bot: 'v' } : { top: 'v', bot: 'a' };
  const dtMax = () => mov().T / 2;

  function rang(k) {
    const m = mov(), f = m[k];
    let lo = 0, hi = 0;
    for (let i = 0; i <= 400; i++) {
      const y = f(m.T * i / 400);
      lo = Math.min(lo, y);
      hi = Math.max(hi, y);
    }
    if (hi - lo < 1e-9) return [-1, 1];
    const pad = 0.1 * (hi - lo);
    return [lo - pad, hi + pad];
  }

  function interval(dt = st.dt) {
    return st.t + dt <= mov().T + 1e-9 ? [st.t, st.t + dt] : [st.t - dt, st.t];
  }

  function pendentSecant(f, dt) {
    const [t1, t2] = interval(dt);
    return (f(t2) - f(t1)) / (t2 - t1);
  }

  function sumaRect(N) {
    const v = mov().v, h = st.t / N;
    let s = 0;
    for (let i = 0; i < N; i++) s += v(i * h) * h;
    return s;
  }

  function distancia() {
    const v = mov().v, n = 800, h = st.t / n;
    let s = 0;
    for (let i = 0; i < n; i++) s += Math.abs(v((i + 0.5) * h)) * h;
    return s;
  }

  /* ---------- Rastre de la gràfica de sota ---------- */

  const clau = t => Math.round(t / mov().T * RES);

  function afegeix(tA, tB, sempre) {
    let a = clau(tA), b = clau(tB);
    if (a > b) [a, b] = [b, a];
    if (!sempre && b - a > 25) { st.rastre.add(clau(tB)); return; }
    for (let k = a; k <= b; k++) st.rastre.add(k);
  }

  function reiniciaRastre() {
    st.rastre.clear();
    afegeix(0, st.t, true);
  }

  /* ---------- Dibuix: utilitats ---------- */

  function nice(x) {
    const p = 10 ** Math.floor(Math.log10(x));
    const m = x / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }

  function marc(cv, ctx, k) {
    setupCanvas(cv, ctx);
    const w = cv.clientWidth, h = cv.clientHeight, T = mov().T;
    const [lo, hi] = rang(k);
    const pw = w - PAD.l - PAD.r, ph = h - PAD.t - PAD.b;
    const G = {
      w, h, T, pw, ph,
      X: t => PAD.l + t / T * pw,
      Y: y => PAD.t + (hi - y) / (hi - lo) * ph
    };
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#e8edf2';
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "Segoe UI", sans-serif';

    const sx = nice(T / 8);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i * sx <= T + 1e-9; i++) {
      const x = G.X(i * sx);
      ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, PAD.t + ph); ctx.stroke();
      ctx.fillText(fmtTick(i * sx), x, PAD.t + ph + 5);
    }
    const sy = nice((hi - lo) / 5);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = Math.ceil(lo / sy); i * sy <= hi + 1e-9; i++) {
      const y = G.Y(i * sy);
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + pw, y); ctx.stroke();
      ctx.fillText(fmtTick(i * sy), PAD.l - 6, y);
    }

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, PAD.t + ph);
    ctx.moveTo(PAD.l, G.Y(0)); ctx.lineTo(PAD.l + pw, G.Y(0));
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('t (s)', PAD.l + pw - 2, G.Y(0) - 4);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${sim(k)} (${MAG[k].u})`, PAD.l + 6, PAD.t + 2);
    return G;
  }

  function retall(ctx, G) {
    ctx.beginPath();
    ctx.rect(PAD.l, PAD.t, G.pw, G.ph);
    ctx.clip();
  }

  function corba(ctx, G, f, color, lw, alpha = 1, tFi = G.T) {
    const n = Math.max(2, Math.ceil(360 * tFi / G.T));
    ctx.save();
    retall(ctx, G);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const t = tFi * i / n, y = G.Y(f(t));
      if (prev === null || Math.abs(y - prev) > G.ph * 0.3) ctx.moveTo(G.X(t), y);
      else ctx.lineTo(G.X(t), y);
      prev = y;
    }
    ctx.stroke();
    ctx.restore();
  }

  function recta(ctx, G, t0, y0, m, ta, tb, color, lw, dash) {
    ctx.save();
    retall(ctx, G);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.setLineDash(dash || []);
    ctx.beginPath();
    ctx.moveTo(G.X(ta), G.Y(y0 + m * (ta - t0)));
    ctx.lineTo(G.X(tb), G.Y(y0 + m * (tb - t0)));
    ctx.stroke();
    ctx.restore();
  }

  function punt(ctx, x, y, color, ple, r = 5) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    if (ple) {
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
    } else {
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = color;
    }
    ctx.stroke();
  }

  function etiqueta(ctx, s, x, y, color, align = 'left', base = 'middle') {
    ctx.save();
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.textAlign = align;
    ctx.textBaseline = base;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fafbfc';
    ctx.strokeText(s, x, y);
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
    ctx.restore();
  }

  function cursor(ctx, G) {
    const x = G.X(st.t);
    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, PAD.t + G.ph); ctx.stroke();
    ctx.restore();
  }

  function rastre(ctx, G, f, color) {
    ctx.save();
    retall(ctx, G);
    ctx.fillStyle = color;
    st.rastre.forEach(k => {
      const t = k / RES * G.T;
      ctx.beginPath();
      ctx.arc(G.X(t), G.Y(f(t)), 1.8, 0, 2 * Math.PI);
      ctx.fill();
    });
    ctx.restore();
  }

  let ratllat = null;
  function patroRatllat(ctx) {
    if (ratllat) return ratllat;
    const c = document.createElement('canvas');
    c.width = c.height = 8;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(220, 38, 38, 0.10)';
    g.fillRect(0, 0, 8, 8);
    g.strokeStyle = 'rgba(185, 28, 28, 0.65)';
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(0, 8); g.lineTo(8, 0); g.stroke();
    ratllat = ctx.createPattern(c, 'repeat');
    return ratllat;
  }

  function costat(G, x) { return x < G.w * 0.68 ? ['left', 10] : ['right', -10]; }

  /* ---------- Dibuix: tira del mòbil ---------- */

  function fletxa(ctx, x1, y, x2, color) {
    const s = Math.sign(x2 - x1);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2 - 7 * s, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - 9 * s, y - 5); ctx.lineTo(x2 - 9 * s, y + 5); ctx.closePath(); ctx.fill();
  }

  function dibuixaStrip() {
    setupCanvas(cvStrip, cxStrip);
    const ctx = cxStrip, w = cvStrip.clientWidth, h = cvStrip.clientHeight, m = mov();
    ctx.clearRect(0, 0, w, h);
    const [lo, hi] = rang('x');
    const L = 34, R = w - 46, yl = 46;
    const P = p => L + (p - lo) / (hi - lo) * (R - L);

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(L, yl); ctx.lineTo(R, yl); ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const s = nice((hi - lo) / 6);
    for (let i = Math.ceil(lo / s); i * s <= hi + 1e-9; i++) {
      const x = P(i * s);
      ctx.beginPath(); ctx.moveTo(x, yl - 3); ctx.lineTo(x, yl + 3); ctx.stroke();
      ctx.fillText(fmtTick(i * s), x, yl + 6);
    }
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#334155';
    ctx.fillText(`${m.eix} (m)`, R + 8, yl);

    const tau = m.T / 16;
    ctx.fillStyle = 'rgba(29, 78, 216, 0.35)';
    for (let k = 0; k * tau <= st.t + 1e-9; k++) {
      ctx.beginPath();
      ctx.arc(P(m.x(k * tau)), yl - 12, 3, 0, 2 * Math.PI);
      ctx.fill();
    }

    const xo = P(m.x(st.t));
    let vmax = 0;
    for (let i = 0; i <= 200; i++) vmax = Math.max(vmax, Math.abs(m.v(m.T * i / 200)));
    const v = m.v(st.t);
    if (vmax > 0 && Math.abs(v) > 1e-6 * vmax) fletxa(ctx, xo, yl - 32, xo + v / vmax * 60, COL.v);
    punt(ctx, xo, yl - 12, COL.x, true, 8);
  }

  /* ---------- Dibuix: gràfiques ---------- */

  function dibuixaDeriv() {
    const m = mov(), { top: kf, bot: kg } = claus(), f = m[kf], g = m[kg];
    const [t1, t2] = interval(), f1 = f(t1), f2 = f(t2), s = (f2 - f1) / (t2 - t1);
    const gt = g(st.t), ft = f(st.t);

    let G = marc(cvTop, cxTop, kf), ctx = cxTop;
    cursor(ctx, G);
    corba(ctx, G, f, COL[kf], 2.5);
    if (st.tangent) {
      const half = m.T * 0.2;
      recta(ctx, G, st.t, ft, gt, st.t - half, st.t + half, COL.tan, 1.8, [7, 5]);
    }
    recta(ctx, G, t1, f1, s, 0, m.T, COL.sec, 2);

    ctx.save();
    retall(ctx, G);
    ctx.strokeStyle = COL.guia;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(G.X(t1), G.Y(f1)); ctx.lineTo(G.X(t2), G.Y(f1)); ctx.lineTo(G.X(t2), G.Y(f2));
    ctx.stroke();
    ctx.restore();
    if (G.X(t2) - G.X(t1) > 34) {
      etiqueta(ctx, `Δt = ${fmtDt(st.dt)} s`, (G.X(t1) + G.X(t2)) / 2, G.Y(f1) + (s >= 0 ? 11 : -11), COL.guia, 'center');
    }
    if (Math.abs(G.Y(f2) - G.Y(f1)) > 18) {
      etiqueta(ctx, `Δ${sim(kf)} = ${fmt(f2 - f1)} ${MAG[kf].u}`, G.X(t2) + 6, (G.Y(f1) + G.Y(f2)) / 2, COL.guia);
    }
    punt(ctx, G.X(t1), G.Y(f1), COL.sec, true, 4);
    punt(ctx, G.X(t2), G.Y(f2), COL.sec, true, 4);
    punt(ctx, G.X(st.t), G.Y(ft), COL[kf], true, 6);

    G = marc(cvBot, cxBot, kg);
    ctx = cxBot;
    cursor(ctx, G);
    if (st.sencera) corba(ctx, G, g, COL[kg], 2, 0.3);
    rastre(ctx, G, g, COL[kg]);
    const x = G.X(st.t), ys = G.Y(s), yg = G.Y(gt);
    const [al, dx] = costat(G, x);
    punt(ctx, x, ys, COL.sec, false, 6);
    punt(ctx, x, yg, COL[kg], true, 5);
    dues(ctx, x + dx, al, ys, 'pendent de la secant', COL.sec, yg, 'pendent de la tangent', COL[kg]);
  }

  function dues(ctx, x, al, ya, ta, ca, yb, tb, cb) {
    if (Math.abs(ya - yb) < 16) {
      const mig = (ya + yb) / 2, s = ya <= yb ? -1 : 1;
      ya = mig + s * 9;
      yb = mig - s * 9;
    }
    etiqueta(ctx, ta, x, ya, ca, al);
    etiqueta(ctx, tb, x, yb, cb, al);
  }

  function camiArea(ctx, G) {
    const v = mov().v, n = 240;
    ctx.beginPath();
    ctx.moveTo(G.X(0), G.Y(0));
    for (let i = 0; i <= n; i++) {
      const t = st.t * i / n;
      ctx.lineTo(G.X(t), G.Y(v(t)));
    }
    ctx.lineTo(G.X(st.t), G.Y(0));
    ctx.closePath();
  }

  function dibuixaInteg() {
    const m = mov(), v = m.v, x0 = m.x(0), xt = m.x(st.t), dx = xt - x0;
    const S = sumaRect(st.N);

    let G = marc(cvTop, cxTop, 'v'), ctx = cxTop;
    const y0 = G.Y(0);
    if (st.t > 0) {
      ctx.save();
      ctx.beginPath(); ctx.rect(PAD.l, PAD.t, G.pw, y0 - PAD.t); ctx.clip();
      camiArea(ctx, G);
      ctx.fillStyle = 'rgba(234, 88, 12, 0.25)';
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.rect(PAD.l, y0, G.pw, PAD.t + G.ph - y0); ctx.clip();
      camiArea(ctx, G);
      ctx.fillStyle = patroRatllat(ctx);
      ctx.fill();
      ctx.restore();

      if (st.rect) {
        const h = st.t / st.N;
        ctx.save();
        retall(ctx, G);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.22)';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        for (let i = 0; i < st.N; i++) {
          const yi = G.Y(v(i * h)), xa = G.X(i * h), xb = G.X((i + 1) * h);
          ctx.fillRect(xa, Math.min(yi, y0), xb - xa, Math.abs(yi - y0));
          ctx.strokeRect(xa, Math.min(yi, y0), xb - xa, Math.abs(yi - y0));
        }
        ctx.restore();
      }
    }
    cursor(ctx, G);
    corba(ctx, G, v, COL.v, 2.5);
    punt(ctx, G.X(st.t), G.Y(v(st.t)), COL.v, true, 6);
    etiqueta(ctx, `àrea = Δ${m.eix} = ${fmt(dx)} m`, PAD.l + G.pw - 6, PAD.t + 10, '#9a3412', 'right');

    G = marc(cvBot, cxBot, 'x');
    ctx = cxBot;
    cursor(ctx, G);
    if (st.sencera) corba(ctx, G, m.x, COL.x, 2, 0.3);
    if (st.t > 0) corba(ctx, G, m.x, COL.x, 2.5, 1, st.t);
    ctx.save();
    ctx.strokeStyle = COL.guia;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(PAD.l, G.Y(x0)); ctx.lineTo(PAD.l + G.pw, G.Y(x0)); ctx.stroke();
    ctx.restore();
    etiqueta(ctx, `${m.eix}₀`, PAD.l + G.pw - 4, G.Y(x0) - 9, COL.guia, 'right');

    const x = G.X(st.t), ye = G.Y(xt), yr = G.Y(x0 + S);
    const [al, ddx] = costat(G, x);
    if (Math.abs(ye - G.Y(x0)) > 4) {
      ctx.strokeStyle = COL.v;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, G.Y(x0)); ctx.lineTo(x, ye); ctx.stroke();
      if (Math.abs(ye - G.Y(x0)) > 22) etiqueta(ctx, `Δ${m.eix}`, x - ddx * 0.6, (ye + G.Y(x0)) / 2, '#9a3412', al === 'left' ? 'right' : 'left');
    }
    if (st.rect && st.t > 0) {
      punt(ctx, x, yr, COL.sec, false, 6);
      punt(ctx, x, ye, COL.x, true, 5);
      dues(ctx, x + ddx, al, yr, 'amb rectangles', COL.sec, ye, 'àrea exacta', COL.x);
    } else {
      punt(ctx, x, ye, COL.x, true, 5);
    }
  }

  /* ---------- Pas a pas ---------- */

  function interpretaV(g, eps) {
    const y = mov().eix === 'y';
    if (Math.abs(g) < eps) return 'Pendent zero: en aquest instant el mòbil està aturat.';
    if (g > 0) return y ? 'Pendent positiu: y augmenta, la pilota puja.' : 'Pendent positiu: x augmenta, el mòbil avança en sentit positiu.';
    return y ? 'Pendent negatiu: y disminueix, la pilota baixa.' : 'Pendent negatiu: x disminueix, el mòbil va en sentit negatiu.';
  }

  function interpretaA(v, a, epsV, epsA) {
    if (Math.abs(a) < epsA) return 'Pendent zero: en aquest instant la velocitat no canvia (acceleració nul·la).';
    const base = a > 0 ? 'Pendent positiu: la velocitat augmenta' : 'Pendent negatiu: la velocitat disminueix';
    if (Math.abs(v) < epsV) return base + '. Ara v = 0 i està canviant de signe.';
    return v * a > 0
      ? base + '. Com que v i a tenen el mateix signe, el mòbil va cada cop més de pressa.'
      : base + '. Com que v i a tenen signes contraris, el mòbil frena.';
  }

  function taula(cap, files) {
    return `<table class="taula-conv"><thead><tr><th scope="col">${cap[0]}</th><th scope="col">${cap[1]}</th></tr></thead><tbody>` +
      files.map(([a, b, cls]) => `<tr${cls ? ` class="${cls}"` : ''}><td>${a}</td><td>${b}</td></tr>`).join('') +
      '</tbody></table>';
  }

  function pasosDeriv() {
    const m = mov(), { top: kf, bot: kg } = claus(), f = m[kf], g = m[kg];
    const F = sim(kf), Gs = kg, uF = MAG[kf].tu, uG = MAG[kg].tu;
    const [t1, t2] = interval(), f1 = f(t1), f2 = f(t2), s = (f2 - f1) / (t2 - t1), gt = g(st.t);
    const esV = kg === 'v';
    const enrere = t1 < st.t;

    const dts = [1, 0.1, 0.01, 0.001];
    const files = dts.map(dt => [fmtDt(dt), fmt(pendentSecant(f, dt), 4), Math.abs(dt - st.dt) < 1e-12 ? 'actual' : '']);
    if (!dts.some(dt => Math.abs(dt - st.dt) < 1e-12)) {
      files.push([fmtDt(st.dt) + ' (ara)', fmt(s, 4), 'actual']);
      files.sort((a, b) => parseFloat(b[0].replace(',', '.')) - parseFloat(a[0].replace(',', '.')));
    }
    files.push(['tangent', fmt(gt, 4), 'exacte']);

    const [lo, hi] = rang(kg), eps = 1e-6 * (hi - lo);
    let interp;
    if (esV) interp = interpretaV(gt, eps);
    else {
      const [vlo, vhi] = rang('v');
      interp = interpretaA(m.v(st.t), gt, 1e-6 * (vhi - vlo), eps);
    }

    return `<ol class="llista-pasos">
      <li><span class="pas-et">1. Dos instants separats Δt</span>
        <div class="formula-pas" data-math="t_1=${texT(t1)}\\ \\mathrm{s}\\;\\Rightarrow\\;${F}(t_1)=${tex(f1)}\\ ${uF}"></div>
        <div class="formula-pas" data-math="t_2=${texT(t2)}\\ \\mathrm{s}\\;\\Rightarrow\\;${F}(t_2)=${tex(f2)}\\ ${uF}"></div>
        ${enrere ? '<p>Com que <i>t</i> + Δ<i>t</i> passa del final, agafem l’interval cap enrere.</p>' : ''}
      </li>
      <li><span class="pas-et">2. ${esV ? 'Velocitat' : 'Acceleració'} mitjana = pendent de la secant</span>
        <div class="formula-pas" data-math="${Gs}_m=\\dfrac{\\Delta ${F}}{\\Delta t}=\\dfrac{${F}(t_2)-${F}(t_1)}{t_2-t_1}"></div>
        <div class="formula-pas" data-math="${Gs}_m=\\dfrac{${tex(f2)}-${par(f1)}}{${texDt(st.dt)}}\\approx ${tex(s, 4)}\\ ${uG}"></div>
      </li>
      <li><span class="pas-et">3. Fem Δt cada cop més petit</span>
        ${taula(['Δt (s)', `${Gs}<sub>m</sub> (${MAG[kg].u})`], files)}
        <p>La secant gira fins a tocar la corba en un sol punt: és la tangent.</p>
      </li>
      <li class="pas-ok"><span class="pas-et">4. ${esV ? 'Velocitat' : 'Acceleració'} instantània = pendent de la tangent</span>
        <div class="formula-pas" data-math="${Gs}(${texT(st.t)}\\ \\mathrm{s})=${tex(gt, 4)}\\ ${uG}"></div>
        <p>És el valor al qual s’acosten les mitjanes. A matemàtiques en direu <strong>derivada</strong>: <span data-math="${Gs}=\\dfrac{d${F}}{dt}"></span>.</p>
        <p class="interpreta">${interp}</p>
      </li>
    </ol>`;
  }

  function pasosInteg() {
    const m = mov(), X = m.eix, v = m.v;
    if (st.t <= 1e-9) {
      return '<p class="hint">Mou l’instant <i>t</i> cap a la dreta (o prem «Recorre») per començar a acumular àrea sota <i>v</i>(<i>t</i>).</p>';
    }
    const N = st.N, h = st.t / N, tN = (N - 1) * h, vN = v(tN), S = sumaRect(N);
    const x0 = m.x(0), xt = m.x(st.t), dx = xt - x0;

    const Ns = [1, 5, 20, 100];
    const files = Ns.map(n => [String(n), fmt(sumaRect(n), 4), n === N ? 'actual' : '']);
    if (!Ns.includes(N)) {
      files.push([`${N} (ara)`, fmt(S, 4), 'actual']);
      files.sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10));
    }
    files.push(['exacta', fmt(dx, 4), 'exacte']);

    let neg = false;
    for (let i = 0; i <= 400; i++) if (v(st.t * i / 400) < -1e-9) { neg = true; break; }
    const interp = neg
      ? `Part de l’àrea és sota l’eix (v &lt; 0): compta <strong>negativa</strong> perquè el mòbil torna enrere. Per això el desplaçament (${fmt(dx)} m) no coincideix amb la distància recorreguda (${fmt(distancia())} m).`
      : 'Tota l’àrea és sobre l’eix: el mòbil sempre avança, i el desplaçament coincideix amb la distància recorreguda.';

    return `<ol class="llista-pasos">
      <li><span class="pas-et">1. En un interval curt, Δ${X} ≈ v · Δt</span>
        <div class="formula-pas" data-math="\\Delta t=\\dfrac{t}{N}=\\dfrac{${texT(st.t)}}{${N}}\\approx ${tex(h)}\\ \\mathrm{s}"></div>
        <div class="formula-pas" data-math="v_{${N}}=v(${texT(tN)}\\ \\mathrm{s})=${tex(vN)}\\ \\mathrm{m/s}"></div>
        <div class="formula-pas" data-math="v_{${N}}\\,\\Delta t=${par(vN)}\\cdot ${tex(h)}\\approx ${tex(vN * h)}\\ \\mathrm{m}"></div>
        <p>En poc temps la velocitat gairebé no canvia. L’àrea de l’últim rectangle (velocitat a l’inici de l’interval per Δ<i>t</i>) és aproximadament el que es desplaça en aquest interval.</p>
      </li>
      <li><span class="pas-et">2. Sumem els ${N} rectangles</span>
        <div class="formula-pas" data-math="\\Delta ${X}\\approx v_1\\Delta t+v_2\\Delta t+\\cdots+v_{${N}}\\Delta t"></div>
        <div class="formula-pas" data-math="\\Delta ${X}\\approx ${tex(S, 4)}\\ \\mathrm{m}"></div>
      </li>
      <li><span class="pas-et">3. Més rectangles, més estrets</span>
        ${taula(['N', `Suma (m)`], files)}
        <p>Com més estrets, menys s’equivoca cada rectangle i la suma s’acosta a l’àrea exacta.</p>
      </li>
      <li class="pas-ok"><span class="pas-et">4. Àrea exacta = desplaçament</span>
        <div class="formula-pas" data-math="\\Delta ${X}=${tex(dx, 4)}\\ \\mathrm{m}"></div>
        <div class="formula-pas" data-math="${X}(t)=${X}_0+\\Delta ${X}"></div>
        <div class="formula-pas" data-math="${X}(${texT(st.t)}\\ \\mathrm{s})=${tex(x0)}+${par(dx)}=${tex(xt)}\\ \\mathrm{m}"></div>
        <p>A matemàtiques en direu <strong>integral</strong>: l’àrea sota <i>v</i>(<i>t</i>) entre 0 i <i>t</i>.</p>
        <p class="interpreta">${interp}</p>
      </li>
    </ol>`;
  }

  /* ---------- Textos i controls ---------- */

  function mostra(color, estil) {
    return `<span class="mostra" style="border-color:${color};${estil ? `border-top-style:${estil}` : ''}"></span>`;
  }

  function actualitzaTextos() {
    const m = mov(), { top, bot } = claus();
    $('modeDeriv').setAttribute('aria-pressed', st.mode === 'deriv');
    $('modeInteg').setAttribute('aria-pressed', st.mode === 'integ');
    $('cadXV').setAttribute('aria-pressed', st.cad === 'xv');
    $('cadVA').setAttribute('aria-pressed', st.cad === 'va');
    $('grupCadena').hidden = st.mode !== 'deriv';
    $('grupDeriv').hidden = st.mode !== 'deriv';
    $('grupInteg').hidden = st.mode !== 'integ';
    document.querySelectorAll('#diPresets .btn').forEach(b => b.setAttribute('aria-pressed', b.dataset.mov === st.mov));
    $('movDesc').textContent = m.desc;

    const T = sim(top), B = sim(bot);
    if (st.mode === 'deriv') {
      $('titolTop').textContent = `Gràfica de partida: ${T}(t). Hi mesurem el pendent.`;
      $('titolBot').textContent = `Gràfica que construïm: ${B}(t). Cada punt és un pendent de la de dalt.`;
      $('llegenda').innerHTML =
        `<span>${mostra(COL[top])} ${T}(t)</span>` +
        `<span>${mostra(COL.sec)} secant (pendent mitjà)</span>` +
        (st.tangent ? `<span>${mostra(COL.tan, 'dashed')} tangent (pendent instantani)</span>` : '') +
        `<span>○ pendent de la secant</span><span>● pendent de la tangent</span>`;
    } else {
      $('titolTop').textContent = 'Gràfica de partida: v(t). Hi mesurem l’àrea fins a l’instant t.';
      $('titolBot').textContent = `Gràfica que construïm: ${B}(t) = ${B}₀ + àrea.`;
      $('llegenda').innerHTML =
        `<span>${mostra(COL.v)} v(t)</span>` +
        '<span><span class="mostra-area m-pos"></span> àrea positiva (v &gt; 0, avança)</span>' +
        '<span><span class="mostra-area m-neg"></span> àrea negativa (v &lt; 0, torna enrere)</span>' +
        (st.rect ? '<span>○ amb rectangles</span>' : '') + '<span>● exacta</span>';
    }
    const tau = fmt(m.T / 16);
    $('stripNota').textContent = `Punts cada ${tau} s: com més separats, més de pressa va. La fletxa taronja és la velocitat.` +
      (m.eix === 'y' ? ' L’alçada y s’ha dibuixat en horitzontal.' : '');
  }

  function dtAIdx(dt) {
    return Math.round(100 * Math.log(dt / DT_MIN) / Math.log(dtMax() / DT_MIN));
  }

  function actualitzaControls() {
    const T = mov().T;
    $('sT').value = Math.round(st.t / T * 1000);
    $('sTVal').textContent = `${fmtT(st.t)} s`;
    $('sDt').value = dtAIdx(st.dt);
    $('sDtVal').textContent = `${fmtDt(st.dt)} s`;
    $('sN').value = st.N;
    $('sNVal').textContent = String(st.N);
    $('dtDiv').disabled = st.dt <= DT_MIN * 1.0001;
    $('dtMul').disabled = st.dt >= dtMax() * 0.9999;
  }

  function descripcio() {
    const m = mov(), { top, bot } = claus();
    if (st.mode === 'deriv') {
      const s = pendentSecant(m[top], st.dt), g = m[bot](st.t);
      return `Gràfica ${sim(top)}(t). A t = ${fmtT(st.t)} s, amb Δt = ${fmtDt(st.dt)} s, pendent de la secant ${fmt(s)} ${MAG[bot].u}; pendent de la tangent ${fmt(g)} ${MAG[bot].u}.`;
    }
    return `Àrea sota v(t) entre 0 i ${fmtT(st.t)} s: ${fmt(m.x(st.t) - m.x(0))} m. Posició ${m.eix} = ${fmt(m.x(st.t))} m.`;
  }

  function dibuixa(forcaPasos = true) {
    actualitzaControls();
    dibuixaStrip();
    if (st.mode === 'deriv') dibuixaDeriv(); else dibuixaInteg();
    const ara = performance.now();
    if (forcaPasos || ara - st.lastPasos > 150) {
      st.lastPasos = ara;
      const cont = $('diPasos');
      cont.innerHTML = st.mode === 'deriv' ? pasosDeriv() : pasosInteg();
      renderMath(cont);
      $('diDesc').textContent = descripcio();
    }
  }

  function canviEstructural() {
    atura();
    reiniciaRastre();
    actualitzaTextos();
    dibuixa();
  }

  function setT(t, sempre) {
    const T = mov().T;
    t = Math.min(T, Math.max(0, t));
    afegeix(st.t, t, sempre);
    st.t = t;
    dibuixa(!st.play);
  }

  /* ---------- Animació ---------- */

  function atura() {
    if (!st.play) return;
    st.play = false;
    cancelAnimationFrame(st.raf);
    $('btnPlay').textContent = '▶ Recorre';
    dibuixa();
  }

  function pas(now) {
    const T = mov().T;
    const dr = Math.min(0.05, (now - st.last) / 1000);
    st.last = now;
    st.tAnim = Math.min(T, st.tAnim + dr * T / 8);
    setT(arrodoneix(st.tAnim), true);
    if (st.t >= T) { atura(); return; }
    st.raf = requestAnimationFrame(pas);
  }

  function play() {
    if (st.play) { atura(); return; }
    const T = mov().T;
    if (st.t >= T - 1e-9) {
      st.t = 0;
      st.rastre.clear();
    }
    if (reduceMotion) {
      setT(T, true);
      return;
    }
    st.play = true;
    st.tAnim = st.t;
    $('btnPlay').textContent = '⏸ Pausa';
    st.last = performance.now();
    st.raf = requestAnimationFrame(pas);
  }

  /* ---------- Esdeveniments ---------- */

  function triaMov(k) {
    st.mov = k;
    st.t = MOV[k].t0;
    st.dt = Math.min(1, dtMax());
    canviEstructural();
  }

  const presets = $('diPresets');
  Object.keys(MOV).forEach(k => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.dataset.mov = k;
    b.textContent = MOV[k].boto;
    b.addEventListener('click', () => triaMov(k));
    presets.appendChild(b);
  });

  $('modeDeriv').addEventListener('click', () => { st.mode = 'deriv'; canviEstructural(); });
  $('modeInteg').addEventListener('click', () => { st.mode = 'integ'; canviEstructural(); });
  $('cadXV').addEventListener('click', () => { st.cad = 'xv'; canviEstructural(); });
  $('cadVA').addEventListener('click', () => { st.cad = 'va'; canviEstructural(); });

  const arrodoneix = t => Math.round(t * 100) / 100;
  $('sT').addEventListener('input', e => { atura(); setT(arrodoneix(e.target.value / 1000 * mov().T), false); });
  $('sDt').addEventListener('input', e => {
    st.dt = DT_MIN * (dtMax() / DT_MIN) ** (e.target.value / 100);
    dibuixa();
  });
  $('dtDiv').addEventListener('click', () => { st.dt = Math.max(DT_MIN, st.dt / 10); dibuixa(); });
  $('dtMul').addEventListener('click', () => { st.dt = Math.min(dtMax(), st.dt * 10); dibuixa(); });
  $('sN').addEventListener('input', e => { st.N = parseInt(e.target.value, 10); dibuixa(); });
  $('chkTangent').addEventListener('change', e => { st.tangent = e.target.checked; actualitzaTextos(); dibuixa(); });
  $('chkRect').addEventListener('change', e => { st.rect = e.target.checked; actualitzaTextos(); dibuixa(); });
  $('chkSencera').addEventListener('change', e => { st.sencera = e.target.checked; dibuixa(); });
  $('btnPlay').addEventListener('click', play);
  $('btnReset').addEventListener('click', () => {
    atura();
    st.t = mov().t0;
    st.dt = Math.min(1, dtMax());
    st.N = 6;
    canviEstructural();
  });

  let arrossega = false;
  [cvTop, cvBot].forEach(cv => {
    const mou = e => {
      const r = cv.getBoundingClientRect();
      setT(arrodoneix((e.clientX - r.left - PAD.l) / (r.width - PAD.l - PAD.r) * mov().T), false);
    };
    cv.addEventListener('pointerdown', e => { atura(); arrossega = true; cv.setPointerCapture(e.pointerId); mou(e); });
    cv.addEventListener('pointermove', e => { if (arrossega) mou(e); });
    cv.addEventListener('pointerup', () => { arrossega = false; });
    cv.addEventListener('pointercancel', () => { arrossega = false; });
  });

  document.addEventListener('visibilitychange', () => { if (document.hidden) atura(); });
  window.addEventListener('resize', () => dibuixa());

  renderMath(document);
  canviEstructural();
})();
