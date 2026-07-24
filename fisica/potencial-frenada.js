(() => {
  'use strict';

  /* ——— Constants i partícules (lògica v3) ——— */
  const C = {
    e: 1.602176634e-19,
    me: 9.1093837139e-31,
    mp: 1.67262192369e-27,
    c: 299792458,
  };
  const particles = {
    electron: { name: 'Electró', symbol: 'e⁻', m: C.me, q: -C.e },
    proton: { name: 'Protó', symbol: 'p⁺', m: C.mp, q: C.e },
    alpha: { name: 'Partícula alfa', symbol: 'α', m: 6.6446573357e-27, q: 2 * C.e },
  };

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(id) { return document.getElementById(id); }

  const els = {
    particle: $('particle'),
    customBox: $('customBox'),
    massMultiple: $('massMultiple'),
    chargeMultiple: $('chargeMultiple'),
    voltage: $('voltage'),
    distance: $('distance'),
    speed: $('speed'),
    playback: $('playback'),
    scene: $('scene'),
    energy: $('energyGraph'),
    potential: $('potentialGraph'),
    status: $('status'),
    metrics: $('metrics'),
    prediction: $('prediction'),
    steps: $('steps'),
    play: $('play'),
    step: $('step'),
    reset: $('reset'),
    invert: $('invert'),
    relWarning: $('relWarning'),
    massMultipleOut: $('massMultipleOut'),
    chargeMultipleOut: $('chargeMultipleOut'),
    voltageOut: $('voltageOut'),
    distanceOut: $('distanceOut'),
    speedOut: $('speedOut'),
    playbackOut: $('playbackOut'),
  };

  const state = {
    running: false,
    t: 0,
    last: null,
    rafId: null,
    model: null,
    x: 0,
    v: 0,
    event: null,
  };

  function renderMath(root) {
    const katex = window.katex;
    (root || document).querySelectorAll('[data-math]').forEach(el => {
      const src = el.dataset.math || el.textContent || '';
      if (!katex) { el.textContent = src; return; }
      katex.render(src, el, { throwOnError: false, strict: 'ignore', displayMode: false });
    });
  }

  function sig(x, n = 4) {
    if (!Number.isFinite(x)) return '—';
    if (x === 0) return '0';
    const ax = Math.abs(x);
    if (ax >= 1e4 || ax < 1e-3) {
      return x.toExponential(n - 1).replace('e+', '·10^').replace('e-', '·10^-');
    }
    return Number(x.toPrecision(n)).toString().replace('.', ',');
  }

  function sigHTML(x, n = 4) {
    if (!Number.isFinite(x)) return '—';
    if (x === 0) return '0';
    const ax = Math.abs(x);
    if (ax >= 1e4 || ax < 1e-3) {
      const [a, b] = x.toExponential(n - 1).split('e');
      return `${Number(a).toString().replace('.', ',')}·10<sup>${Number(b)}</sup>`;
    }
    return Number(x.toPrecision(n)).toString().replace('.', ',');
  }

  function sciHTML(x, n = 4) {
    if (!Number.isFinite(x)) return '—';
    if (x === 0) return '0';
    const [a, b] = x.toExponential(n - 1).split('e');
    return `${Number(a).toString().replace('.', ',')}·10<sup>${Number(b)}</sup>`;
  }

  function resizeCanvas(canvas) {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(300, Math.round(r.width * dpr));
    const h = Math.max(180, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }

  /* ——— Model físic (intacte respecte v3, inclòs el retorn) ——— */
  function inputs() {
    let p;
    if (els.particle.value === 'custom') {
      p = {
        name: 'Personalitzada',
        symbol: 'q',
        m: +els.massMultiple.value * C.me,
        q: +els.chargeMultiple.value * C.e,
      };
    } else {
      p = particles[els.particle.value];
    }
    return { p, d: +els.distance.value, dV: +els.voltage.value, v0: +els.speed.value, V1: 0 };
  }

  function compute() {
    const a0 = inputs();
    const { p, d, dV, v0, V1 } = a0;
    const E = -dV / d;
    const F = p.q * E;
    const a = F / p.m;
    const K0 = 0.5 * p.m * v0 * v0;
    const K0eV = K0 / C.e;
    const Vstop = p.q ? K0 / Math.abs(p.q) : Infinity;
    const qdV = p.q * dV;
    let type;
    let xStop = null;
    let tStop = null;
    let tExit = null;
    let vExit = null;
    let duration;

    if (Math.abs(p.q) < 1e-30) {
      type = 'neutral';
      tExit = d / v0;
      vExit = v0;
      duration = tExit;
    } else if (qdV > 0) {
      xStop = K0 * d / qdV;
      if (Math.abs(xStop - d) < 1e-9 * d) {
        type = 'just';
        xStop = d;
      } else if (xStop < d) {
        type = 'stop';
      } else {
        type = 'cross';
      }
    } else {
      type = 'accelerate';
    }

    if (type === 'stop') {
      tStop = -v0 / a;
      duration = 2 * tStop; // torna a sortir per la placa d'entrada
    } else if (type === 'just') {
      tStop = -v0 / a;
      duration = tStop;
    } else {
      const disc = v0 * v0 + 2 * a * d;
      if (disc >= 0) {
        vExit = Math.sqrt(disc);
        tExit = Math.abs(a) < 1e-30 ? d / v0 : (vExit - v0) / a;
        duration = tExit;
      } else {
        duration = Math.abs(v0 / a);
      }
    }

    return {
      ...a0, E, F, a, K0, K0eV, Vstop, qdV,
      type, xStop, tStop, tExit, vExit,
      duration: Math.max(duration, 1e-15),
    };
  }

  function current() {
    const m = state.model;
    let t = Math.min(state.t, m.duration);
    let x = m.v0 * t + 0.5 * m.a * t * t;
    let v = m.v0 + m.a * t;

    if (m.type === 'just') {
      x = Math.min(x, m.xStop);
      if (t >= m.duration) v = 0;
    } else if (m.type === 'stop') {
      x = Math.max(0, Math.min(m.xStop, x));
      if (t >= m.duration) { x = 0; v = -m.v0; }
    } else {
      x = Math.min(m.d, Math.max(0, x));
    }

    return {
      t, x, v,
      V: m.V1 + m.dV * x / m.d,
      dU: m.p.q * m.dV * x / m.d,
      K: Math.max(0, m.K0 - m.p.q * m.dV * x / m.d),
    };
  }

  function stopAnim() {
    state.running = false;
    state.last = null;
    if (state.rafId != null) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    els.play.textContent = '▶ Reproduir';
  }

  function reset() {
    stopAnim();
    state.t = 0;
    state.model = compute();
    state.x = 0;
    state.v = state.model.v0;
    state.event = null;
    updateAll();
  }

  function tick(ts) {
    if (!state.running) return;
    if (document.hidden) {
      state.last = null;
      state.rafId = requestAnimationFrame(tick);
      return;
    }
    if (state.last == null) state.last = ts;
    const dt = (ts - state.last) / 1000;
    state.last = ts;
    state.t += dt * state.model.duration * 0.35 * (+els.playback.value);
    if (state.t >= state.model.duration) {
      state.t = state.model.duration;
      stopAnim();
    }
    updateAll();
    if (state.running) state.rafId = requestAnimationFrame(tick);
  }

  function togglePlay() {
    if (state.t >= state.model.duration) reset();
    if (REDUCED_MOTION && !state.running) {
      stepOnce();
      return;
    }
    state.running = !state.running;
    state.last = null;
    els.play.textContent = state.running ? '⏸ Pausar' : '▶ Reproduir';
    if (state.running) state.rafId = requestAnimationFrame(tick);
  }

  function stepOnce() {
    state.running = false;
    els.play.textContent = '▶ Reproduir';
    state.t = Math.min(state.model.duration, state.t + state.model.duration / 50);
    updateAll();
  }

  /* ——— Dibuix ——— */
  function arrow(ctx, x1, y1, x2, y2, color, label) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const s = 9;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - s * Math.cos(ang - 0.5), y2 - s * Math.sin(ang - 0.5));
    ctx.lineTo(x2 - s * Math.cos(ang + 0.5), y2 - s * Math.sin(ang + 0.5));
    ctx.closePath();
    ctx.fill();
    if (label) {
      ctx.font = 'bold 13px system-ui';
      ctx.fillText(label, (x1 + x2) / 2 + 5, (y1 + y2) / 2 - 6);
    }
    ctx.restore();
  }

  function drawScene() {
    const { ctx, w, h } = resizeCanvas(els.scene);
    const m = state.model;
    const c = current();
    ctx.clearRect(0, 0, w, h);

    const left = 90;
    const right = w - 90;
    const top = 55;
    const bottom = h - 62;
    const mid = (top + bottom) / 2;
    const span = right - left;

    ctx.fillStyle = '#eef3fa';
    ctx.fillRect(left, top, span, bottom - top);
    ctx.fillStyle = '#334155';
    ctx.fillRect(left - 10, top, 10, bottom - top);
    ctx.fillRect(right, top, 10, bottom - top);

    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = m.V1 >= m.V1 + m.dV ? '#b42318' : '#3157d5';
    ctx.fillText('V₁ = 0 V', left, 30);
    ctx.fillStyle = m.V1 + m.dV >= m.V1 ? '#b42318' : '#3157d5';
    ctx.fillText(`V₂ = ${sig(m.dV, 3)} V`, right, 30);

    ctx.fillStyle = '#334155';
    ctx.font = '12px system-ui';
    ctx.strokeStyle = '#94a3b8';
    for (let i = 0; i <= 5; i++) {
      const x = left + i * span / 5;
      ctx.beginPath();
      ctx.moveTo(x, bottom);
      ctx.lineTo(x, bottom + 6);
      ctx.stroke();
      ctx.fillText(`${sig(i * m.d / 5, 2)} m`, x, bottom + 22);
    }

    const dir = Math.sign(m.E);
    if (dir !== 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(15,143,116,.72)';
      ctx.fillStyle = 'rgba(15,143,116,.82)';
      ctx.lineWidth = 1.35;
      const fieldRows = 5;
      for (let i = 1; i <= fieldRows; i++) {
        const y = top + i * (bottom - top) / (fieldRows + 1);
        const x1 = left + 18;
        const x2 = right - 18;
        ctx.beginPath();
        if (dir > 0) { ctx.moveTo(x1, y); ctx.lineTo(x2, y); }
        else { ctx.moveTo(x2, y); ctx.lineTo(x1, y); }
        ctx.stroke();
        const tipX = dir > 0 ? x2 : x1;
        const ang = dir > 0 ? 0 : Math.PI;
        const s = 7;
        ctx.beginPath();
        ctx.moveTo(tipX, y);
        ctx.lineTo(tipX - s * Math.cos(ang - 0.5), y - s * Math.sin(ang - 0.5));
        ctx.lineTo(tipX - s * Math.cos(ang + 0.5), y - s * Math.sin(ang + 0.5));
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = 'rgba(96,112,137,.34)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      const equipotentials = 6;
      for (let i = 1; i <= equipotentials; i++) {
        const x = left + i * span / (equipotentials + 1);
        ctx.beginPath();
        ctx.moveTo(x, top + 8);
        ctx.lineTo(x, bottom - 8);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (m.xStop != null && m.xStop <= m.d) {
      const xs = left + span * m.xStop / m.d;
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = '#b25b00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xs, top);
      ctx.lineTo(xs, bottom);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#b25b00';
      ctx.fillText('punt de retorn', xs, bottom - 10);
    }

    const px = left + span * c.x / m.d;
    const py = mid;
    ctx.fillStyle = m.p.q < 0 ? '#3157d5' : m.p.q > 0 ? '#b42318' : '#64748b';
    ctx.beginPath();
    ctx.arc(px, py, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px system-ui';
    ctx.fillText(m.p.symbol, px, py + 5);

    const vdir = Math.sign(c.v) || 1;
    const vmax = Math.max(Math.abs(m.v0), Math.abs(m.vExit || 0), 1);
    const speedRatio = Math.min(1, Math.abs(c.v) / vmax);
    const vmag = speedRatio < 1e-6 ? 0 : 12 + 78 * speedRatio;
    if (vmag > 0) arrow(ctx, px, py - 28, px + vdir * vmag, py - 28, '#2563eb', 'v');

    const fdir = Math.sign(m.F);
    if (fdir) arrow(ctx, px, py + 30, px + fdir * 55, py + 30, '#dc2626', 'F');

    ctx.textAlign = 'left';
    ctx.fillStyle = '#607089';
    ctx.font = '12px system-ui';
    ctx.fillText('Dimensions i velocitat visual no a escala', 12, h - 12);
  }

  function axes(ctx, w, h, xlabel, ylabel) {
    const L = 50;
    const R = 16;
    const T = 18;
    const B = 42;
    ctx.strokeStyle = '#9aa8bc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(L, T);
    ctx.lineTo(L, h - B);
    ctx.lineTo(w - R, h - B);
    ctx.stroke();
    ctx.fillStyle = '#607089';
    ctx.font = '12px system-ui';
    ctx.fillText(ylabel, 8, 14);
    ctx.fillText(xlabel, w - 35, h - 12);
    return { L, R, T, B, pw: w - L - R, ph: h - T - B };
  }

  function drawEnergy() {
    const { ctx, w, h } = resizeCanvas(els.energy);
    const m = state.model;
    const c = current();
    ctx.clearRect(0, 0, w, h);
    const a = axes(ctx, w, h, 'x', 'energia (eV)');
    const vals = [];
    let ymin = 0;
    let ymax = m.K0eV;
    for (let i = 0; i <= 150; i++) {
      const x = m.d * i / 150;
      const dU = m.p.q * m.dV * x / m.d / C.e;
      const K = m.K0eV - dU;
      vals.push({ x, dU, K });
      ymin = Math.min(ymin, dU, K);
      ymax = Math.max(ymax, dU, K);
    }
    const pad = (ymax - ymin || 1) * 0.12;
    ymin -= pad;
    ymax += pad;
    const X = x => a.L + a.pw * x / m.d;
    const Y = y => a.T + a.ph * (ymax - y) / (ymax - ymin);

    function line(key, color) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;
      vals.forEach(p => {
        let y = p[key];
        if (key === 'K' && y < 0) return;
        const xx = X(p.x);
        const yy = Y(y);
        if (!started) { ctx.moveTo(xx, yy); started = true; }
        else ctx.lineTo(xx, yy);
      });
      ctx.stroke();
      ctx.restore();
    }

    line('K', '#2563eb');
    line('dU', '#b14f08');
    ctx.strokeStyle = '#0a6f5c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(m.K0eV));
    ctx.lineTo(X(m.d), Y(m.K0eV));
    ctx.stroke();

    ctx.strokeStyle = '#64748b';
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(X(c.x), a.T);
    ctx.lineTo(X(c.x), h - a.B);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#607089';
    ctx.font = '11px system-ui';
    ctx.fillText('0', a.L - 12, Y(0) + 4);
    ctx.fillText(sig(m.d, 2), X(m.d) - 15, h - a.B + 18);
  }

  function drawPotential() {
    const { ctx, w, h } = resizeCanvas(els.potential);
    const m = state.model;
    const c = current();
    ctx.clearRect(0, 0, w, h);
    const a = axes(ctx, w, h, 'x', 'V (V)');
    let ymin = Math.min(0, m.dV);
    let ymax = Math.max(0, m.dV);
    const pad = (ymax - ymin || 1) * 0.18;
    ymin -= pad;
    ymax += pad;
    const X = x => a.L + a.pw * x / m.d;
    const Y = y => a.T + a.ph * (ymax - y) / (ymax - ymin);

    ctx.strokeStyle = '#3157d5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0));
    ctx.lineTo(X(m.d), Y(m.dV));
    ctx.stroke();

    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(X(c.x), a.T);
    ctx.lineTo(X(c.x), h - a.B);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#3157d5';
    ctx.beginPath();
    ctx.arc(X(c.x), Y(c.V), 5, 0, Math.PI * 2);
    ctx.fill();

    const dir = Math.sign(m.E);
    if (dir) arrow(ctx, a.L + a.pw * 0.35, h - 26, a.L + a.pw * 0.35 + dir * 70, h - 26, '#0f8f74', 'E');

    ctx.fillStyle = '#607089';
    ctx.font = '11px system-ui';
    ctx.fillText('0', a.L - 12, Y(0) + 4);
    ctx.fillText(sig(m.d, 2), X(m.d) - 15, h - a.B + 18);
  }

  function outcomeText(m) {
    if (m.type === 'stop') {
      return `Arriba fins a x = ${sigHTML(m.xStop, 4)} m i torna cap a la placa d’entrada.`;
    }
    if (m.type === 'just') return 'Arriba just a la segona placa amb velocitat nul·la.';
    if (m.type === 'cross') return `Travessa la segona placa amb v = ${sciHTML(m.vExit, 4)} m/s.`;
    if (m.type === 'accelerate') {
      return `És accelerada i arriba a la segona placa amb v = ${sciHTML(m.vExit, 4)} m/s.`;
    }
    return 'La càrrega és nul·la: moviment uniforme.';
  }

  function updateText() {
    const m = state.model;
    const c = current();
    els.status.className = 'status ' + ((m.type === 'stop' || m.type === 'just') ? 'warn' : 'ok');
    els.status.innerHTML = outcomeText(m);

    const metric = [
      ['Temps', `${sciHTML(c.t)} s`],
      ['Posició', `${sig(c.x)} m`],
      ['Velocitat', `${sciHTML(c.v)} m/s`],
      ['Potencial local', `${sig(c.V)} V`],
      ['Camp Eₓ', `${sciHTML(m.E)} V/m`],
      ['Força Fₓ', `${sciHTML(m.F)} N`],
      ['Acceleració aₓ', `${sciHTML(m.a)} m/s²`],
      ['E<sub>c</sub>', `${sig(c.K / C.e)} eV`],
      ['ΔU', `${sig(c.dU / C.e)} eV`],
      ['E<sub>c</sub> + ΔU', `${sig((c.K + c.dU) / C.e)} eV`],
      ['E<sub>c0</sub>', `${sciHTML(m.K0)} J`],
      ['V de frenada', Number.isFinite(m.Vstop) ? `${sig(m.Vstop)} V` : '—'],
    ];
    els.metrics.innerHTML = metric.map(([k, v]) =>
      `<div class="metric"><b>${k}</b><span>${v}</span></div>`
    ).join('');

    const relation = m.qdV / C.e;
    els.prediction.innerHTML =
      `qΔV = ${sig(relation)} eV<br>E<sub>c0</sub> = ${sig(m.K0eV)} eV<br><strong>${outcomeText(m)}</strong>`;

    const stopLine = (m.xStop != null)
      ? `<li>x<sub>f</sub> = E<sub>c0</sub>d/(qΔV) = ${sig(m.xStop)} m.</li>`
      : '<li>Com que qΔV ≤ 0, el camp no frena la partícula.</li>';

    els.steps.innerHTML = `<ol>
      <li>Eₓ = −ΔV/d = −(${sig(m.dV)} V)/(${sig(m.d)} m) = ${sciHTML(m.E)} V/m.</li>
      <li>Fₓ = qEₓ = ${sciHTML(m.F)} N.</li>
      <li>aₓ = Fₓ/m = ${sciHTML(m.a)} m/s².</li>
      <li>E<sub>c0</sub> = ½mv₀² = ${sciHTML(m.K0)} J = ${sig(m.K0eV)} eV.</li>
      <li>V<sub>f</sub> = E<sub>c0</sub>/|q| = ${Number.isFinite(m.Vstop) ? sig(m.Vstop) : '—'} V.</li>
      ${stopLine}
    </ol>`;
  }

  function updateOutputs() {
    els.voltageOut.innerHTML = `${sigHTML(+els.voltage.value, 4)} V`;
    els.distanceOut.innerHTML = `${sigHTML(+els.distance.value, 4)} m`;
    els.speedOut.innerHTML = `${sigHTML(+els.speed.value, 4)} m/s`;
    els.playbackOut.innerHTML = `${sigHTML(+els.playback.value, 2)}×`;
    els.massMultipleOut.innerHTML = `${sigHTML(+els.massMultiple.value, 4)} mₑ`;
    els.chargeMultipleOut.innerHTML = `${sigHTML(+els.chargeMultiple.value, 3)} e`;
    els.customBox.classList.toggle('hidden', els.particle.value !== 'custom');
    els.relWarning.classList.toggle('is-visible', +els.speed.value > 0.1 * C.c);
  }

  function updateAll() {
    updateOutputs();
    drawScene();
    drawEnergy();
    drawPotential();
    updateText();
  }

  function applyPreset(kind) {
    els.particle.value = kind === 'proton' ? 'proton' : 'electron';
    els.speed.value = 1500000;
    els.distance.value = 0.05;
    const p = particles[els.particle.value];
    const K = 0.5 * p.m * (+els.speed.value) ** 2;
    const sign = p.q > 0 ? 1 : -1;
    if (kind === 'just') els.voltage.value = sign * K / Math.abs(p.q);
    if (kind === 'half') els.voltage.value = sign * 2 * K / Math.abs(p.q);
    if (kind === 'cross') els.voltage.value = sign * 0.45 * K / Math.abs(p.q);
    if (kind === 'accelerate') els.voltage.value = -sign * 8;
    if (kind === 'proton') els.voltage.value = 8;
    reset();
  }

  function bind() {
    [els.particle, els.massMultiple, els.chargeMultiple, els.voltage, els.distance, els.speed]
      .forEach(el => el.addEventListener('input', reset));
    els.playback.addEventListener('input', updateOutputs);
    els.play.addEventListener('click', togglePlay);
    els.step.addEventListener('click', stepOnce);
    els.reset.addEventListener('click', reset);
    els.invert.addEventListener('click', () => {
      els.voltage.value = -(+els.voltage.value);
      reset();
    });
    document.querySelectorAll('[data-preset]').forEach(b => {
      b.addEventListener('click', () => applyPreset(b.dataset.preset));
    });
    window.addEventListener('resize', updateAll);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state.running) togglePlay();
    });
  }

  renderMath(document);
  bind();
  reset();
})();
