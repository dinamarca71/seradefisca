(function () {
  function renderMath(root) {
    root = root || document;
    const katex = window.katex;
    root.querySelectorAll('[data-math]').forEach(el => {
      const src = el.dataset.math || el.textContent || '';
      if (!katex) { el.textContent = src; return; }
      katex.render(src, el, { throwOnError: false, strict: 'ignore', displayMode: false });
    });
  }
  renderMath();

  const state = {
    m: 1,
    k: 10,
    A: 0.4,
    phi: 0,
    t: 0,
    playing: false,
    speed: 1,
    showV: true,
    showF: true,
    showX: true,
    showGraphV: false,
    showGraphA: false
  };

  const T_MAX = 10;
  const A_MAX = 0.8;           // rang màxim del slider d'amplitud (escala FIXA)
  const ARROW_MAX_PX = 100;    // longitud màxima del vector v quan |v| = vmax

  const springCanvas = document.getElementById('springCanvas');
  const graphCanvas = document.getElementById('graphCanvas');
  const energyCanvas = document.getElementById('energyCanvas');
  const sctx = springCanvas.getContext('2d');
  const gctx = graphCanvas.getContext('2d');
  const ectx = energyCanvas.getContext('2d');

  function omega() { return Math.sqrt(state.k / state.m); }
  function xAt(t) { return state.A * Math.cos(omega() * t + state.phi); }
  function vAt(t) { return -state.A * omega() * Math.sin(omega() * t + state.phi); }
  function aAt(t) { return -omega() * omega() * xAt(t); }
  function epAt(t) { const x = xAt(t); return 0.5 * state.k * x * x; }
  function ecAt(t) { const v = vAt(t); return 0.5 * state.m * v * v; }
  function eTotal() { return 0.5 * state.k * state.A * state.A; }
  function vMax() { return state.A * omega(); }
  function aMax() { return state.A * omega() * omega(); }
  function fMax() { return state.k * state.A; }

  /** Escala espacial fixa de l'escena (m → px), independent d'A actual. */
  function pxPerMeter(canvasW) {
    return (canvasW * 0.32) / A_MAX;
  }

  function drawArrow(ctx, x1, y1, x2, y2, color, width) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 4) return;
    const ux = dx / len, uy = dy / len;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const ah = 8;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ah * ux + ah * 0.45 * uy, y2 - ah * uy - ah * 0.45 * ux);
    ctx.lineTo(x2 - ah * ux - ah * 0.45 * uy, y2 - ah * uy + ah * 0.45 * ux);
    ctx.closePath();
    ctx.fill();
  }

  function drawSpring(ctx, x1, y, x2, coils) {
    const len = x2 - x1;
    if (len < 8) return;
    const coilW = len / coils;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    for (let i = 0; i < coils; i++) {
      const cx = x1 + (i + 0.5) * coilW;
      ctx.lineTo(cx - coilW * 0.2, y - 10);
      ctx.lineTo(cx + coilW * 0.2, y + 10);
    }
    ctx.lineTo(x2, y);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function updateValues() {
    const w = omega();
    const T = TAU / w;
    const x = xAt(state.t);
    const v = vAt(state.t);
    const a = aAt(state.t);
    const F = -state.k * x;
    const Ep = epAt(state.t);
    const Ec = ecAt(state.t);
    const E = eTotal();
    const sum = Ec + Ep;
    const rel = E > 0 ? Math.abs(sum - E) / E : 0;

    document.getElementById('valOmega').textContent = formatNum(w) + ' rad/s';
    document.getElementById('valT').textContent = formatNum(T) + ' s';
    document.getElementById('valF').textContent = formatNum(1 / T) + ' Hz';
    document.getElementById('valX').textContent = formatNum(x) + ' m';
    document.getElementById('valV').textContent = formatNum(v) + ' m/s';
    document.getElementById('valA').textContent = formatNum(a) + ' m/s²';
    document.getElementById('valForce').textContent = formatNum(F) + ' N';
    document.getElementById('valVmax').textContent = formatNum(state.A * w) + ' m/s';
    document.getElementById('valAmax').textContent = formatNum(state.A * w * w) + ' m/s²';

    document.getElementById('valEp').textContent = formatNum(Ep, 3);
    document.getElementById('valEc').textContent = formatNum(Ec, 3);
    document.getElementById('valE').textContent = formatNum(E, 3);

    const maxH = 140;
    document.getElementById('barEp').style.height = (E > 0 ? Ep / E * maxH : 0) + 'px';
    document.getElementById('barEc').style.height = (E > 0 ? Ec / E * maxH : 0) + 'px';
    document.getElementById('barE').style.height = maxH + 'px';

    let desc = 'Fase intermèdia: Ec i Ep coexistixen.';
    if (Math.abs(x) < 0.02 * Math.max(state.A, 0.05)) desc = 'Centre (x ≈ 0): pràcticament tota l\'energia és cinètica.';
    else if (Math.abs(Math.abs(x) - state.A) < 0.03 * Math.max(state.A, 0.05)) desc = 'Extrem (|x| ≈ A): pràcticament tota l\'energia és potencial.';
    document.getElementById('phaseDesc').textContent = desc;

    const badge = document.getElementById('conservBadge');
    badge.textContent = 'E constant · desviació relativa ' + (rel < 1e-10 ? '~0' : formatSci(rel, 1));

    const status = document.getElementById('springStatus');
    if (status) {
      status.textContent = `t = ${formatNum(state.t)} s, x = ${formatNum(x)} m, v = ${formatNum(v)} m/s, F = ${formatNum(F)} N.`;
    }
  }

  function drawSpringScene() {
    setupCanvas(springCanvas, sctx);
    const w = springCanvas.clientWidth;
    const h = springCanvas.clientHeight;
    sctx.clearRect(0, 0, w, h);

    const groundY = h * 0.65;
    const wallX = 40;
    const eqX = w * 0.48;
    const pxPerM = pxPerMeter(w);
    const x = xAt(state.t);
    const massX = eqX + x * pxPerM;

    sctx.fillStyle = '#334155';
    sctx.fillRect(0, groundY, w, 4);
    sctx.fillRect(wallX - 12, groundY - 120, 12, 120);

    drawSpring(sctx, wallX, groundY - 40, massX - 22, 10);

    sctx.fillStyle = '#7c3aed';
    sctx.fillRect(massX - 22, groundY - 55, 44, 44);
    sctx.fillStyle = '#fff';
    sctx.font = '12px Segoe UI';
    sctx.textAlign = 'center';
    sctx.fillText('m', massX, groundY - 28);

    sctx.strokeStyle = '#94a3b8';
    sctx.setLineDash([5, 4]);
    sctx.beginPath();
    sctx.moveTo(eqX, groundY - 90);
    sctx.lineTo(eqX, groundY + 10);
    sctx.stroke();
    sctx.setLineDash([]);
    sctx.fillStyle = '#64748b';
    sctx.fillText('Equilibri', eqX, groundY + 24);

    // Marques ±A (es mouen amb l'amplitud; escala espacial FIXA)
    sctx.setLineDash([3, 3]);
    sctx.beginPath();
    sctx.moveTo(eqX + state.A * pxPerM, groundY - 70);
    sctx.lineTo(eqX + state.A * pxPerM, groundY);
    sctx.moveTo(eqX - state.A * pxPerM, groundY - 70);
    sctx.lineTo(eqX - state.A * pxPerM, groundY);
    sctx.stroke();
    sctx.setLineDash([]);
    sctx.fillText('+A', eqX + state.A * pxPerM, groundY - 78);
    sctx.fillText('−A', eqX - state.A * pxPerM, groundY - 78);

    const v = vAt(state.t);
    const F = -state.k * x;
    const vmax = vMax();
    const fmax = fMax();

    // Longitud del vector v ∝ |v| / vmax (proporcional a la velocitat real)
    if (state.showV && vmax > 1e-9 && Math.abs(v) / vmax > 0.03) {
      const vLen = (Math.abs(v) / vmax) * ARROW_MAX_PX;
      const vx = massX + Math.sign(v) * vLen;
      drawArrow(sctx, massX, groundY - 75, vx, groundY - 75, '#2563eb', 2.5);
      sctx.fillStyle = '#2563eb';
      sctx.textAlign = Math.sign(v) >= 0 ? 'left' : 'right';
      sctx.fillText('v', vx + Math.sign(v) * 6, groundY - 80);
    }

    // Longitud del vector F ∝ |F| / Fmax
    if (state.showF && fmax > 1e-9 && Math.abs(F) / fmax > 0.03) {
      const fLen = (Math.abs(F) / fmax) * ARROW_MAX_PX;
      const fx = massX + Math.sign(F) * fLen;
      drawArrow(sctx, massX, groundY - 20, fx, groundY - 20, '#dc2626', 2.5);
      sctx.fillStyle = '#dc2626';
      sctx.textAlign = Math.sign(F) >= 0 ? 'left' : 'right';
      sctx.fillText('F', fx + Math.sign(F) * 6, groundY - 8);
    }

    sctx.fillStyle = '#1a2332';
    sctx.font = '13px Consolas, monospace';
    sctx.textAlign = 'left';
    sctx.fillText(`x = ${formatNum(x)} m`, 14, 22);
    sctx.fillText(`T = ${formatNum(TAU / omega())} s`, 14, 42);
  }

  function activeCurves() {
    const curves = [];
    if (state.showX) {
      curves.push({
        key: 'x', fn: xAt, color: '#7c3aed', label: 'x(t)',
        unit: 'm', amp: state.A, norm: t => state.A > 0 ? xAt(t) / state.A : 0
      });
    }
    if (state.showGraphV) {
      const amp = vMax();
      curves.push({
        key: 'v', fn: vAt, color: '#2563eb', label: 'v(t)',
        unit: 'm/s', amp, norm: t => amp > 0 ? vAt(t) / amp : 0
      });
    }
    if (state.showGraphA) {
      const amp = aMax();
      curves.push({
        key: 'a', fn: aAt, color: '#dc2626', label: 'a(t)',
        unit: 'm/s²', amp, norm: t => amp > 0 ? aAt(t) / amp : 0
      });
    }
    return curves;
  }

  function drawKinematicsGraph() {
    setupCanvas(graphCanvas, gctx);
    const w = graphCanvas.clientWidth;
    const h = graphCanvas.clientHeight;
    const padL = 52, padR = 14, padT = 28, padB = 36;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    gctx.clearRect(0, 0, w, h);

    const curves = activeCurves();
    const hint = document.getElementById('graphHint');

    if (curves.length === 0) {
      gctx.fillStyle = '#94a3b8';
      gctx.font = '14px Segoe UI';
      gctx.textAlign = 'center';
      gctx.fillText('Activa almenys una corba (x, v o a)', w / 2, h / 2);
      if (hint) hint.textContent = '';
      return;
    }

    const overlay = curves.length > 1;
    // Una sola corba: unitats físiques amb escala FIXA (A_MAX / derivats amb A_MAX)
    // Diverses: normalitzades a ±1 per comparar fase i forma
    let yMax;
    let yLabel;
    let valueAt;
    if (overlay) {
      yMax = 1.15;
      yLabel = 'valor / màxim';
      valueAt = (c, t) => c.norm(t);
      if (hint) {
        hint.textContent = 'Superposició normalitzada (cada corba dividida pel seu màxim): així es veu el desfasament sense barrejar unitats.';
      }
    } else {
      const c = curves[0];
      if (c.key === 'x') {
        yMax = A_MAX * 1.05; // escala fixa → canviar A canvia l'altura visible de l'ona
      } else if (c.key === 'v') {
        // escala fixa relativa a A_MAX amb els m,k actuals
        yMax = Math.max(A_MAX * omega() * 1.05, 1e-6);
      } else {
        yMax = Math.max(A_MAX * omega() * omega() * 1.05, 1e-6);
      }
      yLabel = c.unit;
      valueAt = (curve, t) => curve.fn(t);
      if (hint) {
        if (c.key === 'x') {
          hint.textContent = 'Escala vertical fixa (±' + formatNum(A_MAX) + ' m): si puges A, l\'ona es fa més alta.';
        } else {
          hint.textContent = '';
        }
      }
    }

    const toX = t => padL + (t / T_MAX) * plotW;
    const toY = y => padT + ((yMax - y) / (2 * yMax)) * plotH;

    drawGrid(gctx, padL, padT, plotW, plotH);
    drawAxes(gctx, padL, padT, plotW, plotH, toY(0), { x: 't (s)', y: yLabel });

    curves.forEach(c => {
      gctx.strokeStyle = c.color;
      gctx.lineWidth = overlay ? 2 : 2.4;
      gctx.beginPath();
      for (let i = 0; i <= 500; i++) {
        const t = (i / 500) * T_MAX;
        const px = toX(t), py = toY(valueAt(c, t));
        if (i === 0) gctx.moveTo(px, py); else gctx.lineTo(px, py);
      }
      gctx.stroke();

      gctx.fillStyle = c.color;
      gctx.beginPath();
      gctx.arc(toX(state.t), toY(valueAt(c, state.t)), 5, 0, TAU);
      gctx.fill();
    });

    gctx.strokeStyle = '#1a2332';
    gctx.setLineDash([4, 3]);
    gctx.beginPath();
    gctx.moveTo(toX(state.t), padT);
    gctx.lineTo(toX(state.t), padT + plotH);
    gctx.stroke();
    gctx.setLineDash([]);

    gctx.font = '12px Segoe UI';
    gctx.textAlign = 'left';
    curves.forEach((c, i) => {
      gctx.fillStyle = c.color;
      gctx.fillText(c.label, padL + 8 + i * 52, padT + 14);
    });
  }

  function drawEnergyGraph() {
    setupCanvas(energyCanvas, ectx);
    const w = energyCanvas.clientWidth;
    const h = energyCanvas.clientHeight;
    const padL = 52, padR = 14, padT = 24, padB = 36;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    ectx.clearRect(0, 0, w, h);

    const E = eTotal();
    const yTop = Math.max(E * 1.15, 1e-6);
    const toX = t => padL + (t / T_MAX) * plotW;
    const toY = e => padT + ((yTop - e) / yTop) * plotH;

    drawGrid(ectx, padL, padT, plotW, plotH);
    drawAxes(ectx, padL, padT, plotW, plotH, toY(0), { x: 't (s)', y: 'E (J)' });

    const curves = [
      { fn: epAt, color: '#ea580c', label: 'Ep' },
      { fn: ecAt, color: '#2563eb', label: 'Ec' },
      { fn: () => E, color: '#059669', label: 'E', dash: [7, 4] }
    ];

    curves.forEach(c => {
      ectx.strokeStyle = c.color;
      ectx.lineWidth = 2;
      ectx.setLineDash(c.dash || []);
      ectx.beginPath();
      for (let i = 0; i <= 500; i++) {
        const t = (i / 500) * T_MAX;
        const px = toX(t), py = toY(c.fn(t));
        if (i === 0) ectx.moveTo(px, py); else ectx.lineTo(px, py);
      }
      ectx.stroke();
      ectx.setLineDash([]);
    });

    ectx.strokeStyle = '#1a2332';
    ectx.setLineDash([4, 3]);
    ectx.beginPath();
    ectx.moveTo(toX(state.t), padT);
    ectx.lineTo(toX(state.t), padT + plotH);
    ectx.stroke();
    ectx.setLineDash([]);

    ectx.font = '12px Segoe UI';
    ectx.textAlign = 'left';
    curves.forEach((c, i) => {
      ectx.fillStyle = c.color;
      ectx.fillText(c.label, padL + 8 + i * 48, padT + 14);
    });
  }

  function draw() {
    updateValues();
    drawSpringScene();
    drawKinematicsGraph();
    drawEnergyGraph();
  }

  function setSlider(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function syncLabels() {
    document.getElementById('m-val').textContent = formatNum(state.m) + ' kg';
    document.getElementById('k-val').textContent = formatNum(state.k) + ' N/m';
    document.getElementById('A-val').textContent = formatNum(state.A) + ' m';
    document.getElementById('phi-val').textContent = formatPhase(state.phi);
  }

  bindSlider('m', 'm-val', v => { state.m = v; draw(); }, v => formatNum(v) + ' kg');
  bindSlider('k', 'k-val', v => { state.k = v; draw(); }, v => formatNum(v) + ' N/m');
  bindSlider('A', 'A-val', v => { state.A = v; draw(); }, v => formatNum(v) + ' m');
  bindSlider('phi', 'phi-val', v => { state.phi = v; draw(); }, formatPhase);

  document.getElementById('showV').addEventListener('change', e => {
    state.showV = e.target.checked;
    draw();
  });
  document.getElementById('showF').addEventListener('change', e => {
    state.showF = e.target.checked;
    draw();
  });

  function bindCurveToggle(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      state[key] = el.checked;
      // Evita quedar sense cap corba: si totes es desactiven, torna a activar x
      if (!state.showX && !state.showGraphV && !state.showGraphA) {
        state.showX = true;
        document.getElementById('showX').checked = true;
      }
      draw();
    });
  }
  bindCurveToggle('showX', 'showX');
  bindCurveToggle('showGraphV', 'showGraphV');
  bindCurveToggle('showGraphA', 'showGraphA');

  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.preset;
      if (p === 'soft') { state.k = 4; setSlider('k', 4); }
      if (p === 'stiff') { state.k = 25; setSlider('k', 25); }
      if (p === 'heavy') { state.m = 4; setSlider('m', 4); }
      if (p === 'phi0') { state.phi = 0; state.t = 0; setSlider('phi', 0); setSlider('timeSlider', 0); }
      if (p === 'phi90') { state.phi = Math.PI / 2; state.t = 0; setSlider('phi', Math.PI / 2); setSlider('timeSlider', 0); }
      if (p === 'center') {
        state.phi = 0;
        state.t = TAU / omega() / 4;
        setSlider('phi', 0);
        setSlider('timeSlider', state.t);
        document.getElementById('timeDisplay').textContent = `t = ${formatNum(state.t)} s`;
      }
      syncLabels();
      draw();
    });
  });

  bindPlayControls(state, draw, { maxT: T_MAX });
  window.addEventListener('resize', draw);
  draw();
})();
