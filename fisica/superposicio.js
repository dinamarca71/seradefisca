(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const spatialCanvas = $('spatialCanvas');
  const temporalCanvas = $('temporalCanvas');
  const spacetimeCanvas = $('spacetimeCanvas');
  const offscreen = document.createElement('canvas');
  offscreen.width = 240;
  offscreen.height = 140;
  const offCtx = offscreen.getContext('2d', { willReadFrequently: true });

  let mode = 'simple';
  let isPlaying = true;
  let simTime = 0;
  let lastFrame = performance.now();
  let lastSpaceTimeDraw = 0;
  let dirtySpaceTime = true;
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (REDUCED_MOTION) isPlaying = false;


  function n(id) { return Number($(id).value); }
  function set(id, value) { $(id).value = value; }
  function round(v, digits = 2) { return Number(v).toFixed(digits).replace('.', ','); }
  function comma(v, digits = 2) { return Number(v).toFixed(digits).replace('.', ','); }
  function phaseLabel(v) {
    const r = v / Math.PI;
    return `${comma(v, 2)} rad (${comma(r, 2)}π)`;
  }
  function getWave(i) {
    return {
      A: n(`a${i}`),
      k: n(`k${i}`),
      w: n(`w${i}`),
      p: n(`p${i}`),
      dir: Number($(`dir${i}`).value)
    };
  }
  function waveValue(wave, x, t) {
    return wave.A * Math.sin(wave.w * t + wave.dir * wave.k * x + wave.p);
  }
  function waves() {
    const w1 = getWave(1);
    return mode === 'simple' ? [w1] : [w1, getWave(2)];
  }
  function resultantOf(currentWaves, x, t) {
    let sum = 0;
    for (const wave of currentWaves) sum += waveValue(wave, x, t);
    return sum;
  }
  function resultant(x, t) {
    return resultantOf(waves(), x, t);
  }
  function getL() { return n('lengthView'); }
  function getX0() { return n('x0'); }
  function yLimit() {
    const sumA = waves().reduce((s, w) => s + w.A, 0);
    return Math.max(2, Math.ceil((sumA + 0.8) / 2) * 2);
  }
  function derived(w) {
    const lambda = 2 * Math.PI / w.k;
    const T = 2 * Math.PI / w.w;
    const f = w.w / (2 * Math.PI);
    const v = w.w / w.k;
    return { lambda, T, f, v };
  }

  function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      dirtySpaceTime = true;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: rect.width, h: rect.height, dpr };
  }

  function drawGrid(ctx, plot, xMax, yMax, xLabel, yLabel, xTick = 1, xOffset = 0) {
    const { left, top, width, height } = plot;
    ctx.save();
    ctx.font = '12px system-ui, sans-serif';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#dbe3ea';
    ctx.lineWidth = 1;
    for (let x = 0; x <= xMax + 1e-9; x += xTick) {
      const px = left + width * x / xMax;
      ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, top + height); ctx.stroke();
      if (Math.abs(x - Math.round(x)) < 1e-8 || xTick >= 1) {
        ctx.fillStyle = '#5c6975';
        ctx.textAlign = 'center';
        let label = x + xOffset;
        if (Math.abs(label) < 1e-8) label = 0;
        ctx.fillText(comma(label, xTick < 1 ? 1 : 0), px, top + height + 17);
      }
    }
    const yt = yMax <= 3 ? 1 : 2;
    for (let y = -yMax; y <= yMax + 1e-9; y += yt) {
      const py = top + height * (yMax - y) / (2 * yMax);
      ctx.beginPath(); ctx.moveTo(left, py); ctx.lineTo(left + width, py); ctx.stroke();
      if (Math.abs(y) > 1e-9) {
        ctx.fillStyle = '#5c6975';
        ctx.textAlign = 'right';
        ctx.fillText(comma(y, 0), left - 7, py);
      }
    }

    const zeroY = top + height / 2;
    ctx.strokeStyle = '#7b8793';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(left, zeroY); ctx.lineTo(left + width, zeroY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, top + height); ctx.stroke();

    ctx.fillStyle = '#344554';
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, left + width / 2, top + height + 35);
    ctx.save();
    ctx.translate(13, top + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
    ctx.restore();
  }

  function drawArrow(ctx, x1, y1, x2, y2, color = '#2d4d68') {
    const head = 7;
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(a - Math.PI / 6), y2 - head * Math.sin(a - Math.PI / 6));
    ctx.lineTo(x2 - head * Math.cos(a + Math.PI / 6), y2 - head * Math.sin(a + Math.PI / 6));
    ctx.closePath(); ctx.fill();
  }

  function traceCurve(ctx, plot, fn, xStart, xEnd, xMax, yMax, color, width = 2.8, dash = []) {
    const samples = Math.max(400, Math.floor(plot.width * 1.2));
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const x = xStart + (xEnd - xStart) * i / samples;
      const y = fn(x);
      const px = plot.left + plot.width * x / xMax;
      const py = plot.top + plot.height * (yMax - y) / (2 * yMax);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawSpatial() {
    const { ctx, w, h } = resizeCanvas(spatialCanvas);
    const L = getL();
    const yMax = yLimit();
    const plot = { left: 54, top: 15, width: Math.max(50, w - 70), height: Math.max(50, h - 65) };
    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, plot, L, yMax, 'posició x (m)', 'elongació y (cm)', 1);

    const ww = waves();
    const t = simTime;
    if (mode === 'super') {
      traceCurve(ctx, plot, (x) => waveValue(ww[0], x, t), 0, L, L, yMax, '#0a6f5c', 1.6, [7, 5]);
      traceCurve(ctx, plot, (x) => waveValue(ww[1], x, t), 0, L, L, yMax, '#b14f08', 1.6, [7, 5]);
    }
    traceCurve(ctx, plot, (x) => resultantOf(ww, x, t), 0, L, L, yMax, mode === 'simple' ? '#0a6f5c' : '#7a1e52', 3.1);

    const x0 = Math.min(getX0(), L);
    const px0 = plot.left + plot.width * x0 / L;
    ctx.save();
    ctx.strokeStyle = '#133e6a';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(px0, plot.top); ctx.lineTo(px0, plot.top + plot.height); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#133e6a';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('x₀', px0, plot.top + 12);
    ctx.restore();

    if ($('showParticles').checked) {
      const particles = 17;
      ctx.save();
      for (let i = 0; i < particles; i++) {
        const x = L * i / (particles - 1);
        const y = resultantOf(ww, x, t);
        const px = plot.left + plot.width * x / L;
        const py = plot.top + plot.height * (yMax - y) / (2 * yMax);
        ctx.fillStyle = '#182b3d';
        ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    const d1 = derived(ww[0]);
    if (d1.lambda <= L * 0.86) {
      const startX = Math.max(0.1, (L - d1.lambda) / 2);
      const y = plot.top + plot.height - 13;
      const px1 = plot.left + plot.width * startX / L;
      const px2 = plot.left + plot.width * (startX + d1.lambda) / L;
      drawArrow(ctx, px1, y, px2, y);
      drawArrow(ctx, px2, y + 1, px1, y + 1);
      ctx.save();
      ctx.fillStyle = '#2d4d68';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`λ₁ = ${comma(d1.lambda, 2)} m`, (px1 + px2) / 2, y - 8);
      ctx.restore();
    }

    const legend = $('spatialLegend');
    legend.innerHTML = mode === 'simple'
      ? `<span class="legend-item"><i class="swatch" style="background:#0a6f5c"></i>ona</span>`
      : `<span class="legend-item"><i class="swatch dashed" style="color:#0a6f5c"></i>ona 1</span><span class="legend-item"><i class="swatch dashed" style="color:#b14f08"></i>ona 2</span><span class="legend-item"><i class="swatch" style="background:#7a1e52"></i>resultant</span>`;
  }

  function drawTemporal() {
    const { ctx, w, h } = resizeCanvas(temporalCanvas);
    const ww = waves();
    const d1 = derived(ww[0]);
    const x0 = Math.min(getX0(), getL());
    const yMax = yLimit();
    const totalWindow = Math.max(4 * d1.T, 1.8);
    const tStart = simTime - totalWindow / 2;
    const plot = { left: 54, top: 15, width: Math.max(50, w - 70), height: Math.max(50, h - 65) };
    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, plot, totalWindow, yMax, 'temps t (s), relatiu a l’instant actual', 'elongació y (cm)', totalWindow <= 2 ? 0.5 : 1, -totalWindow / 2);

    const samples = Math.max(400, Math.floor(plot.width * 1.2));
    const lineColor = mode === 'simple' ? '#0a6f5c' : '#7a1e52';
    ctx.save();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3.1;
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const tr = totalWindow * i / samples;
      const t = tStart + tr;
      const y = resultantOf(ww, x0, t);
      const px = plot.left + plot.width * tr / totalWindow;
      const py = plot.top + plot.height * (yMax - y) / (2 * yMax);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const nowX = plot.left + plot.width / 2;
    ctx.strokeStyle = '#133e6a';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(nowX, plot.top); ctx.lineTo(nowX, plot.top + plot.height); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#133e6a';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ara', nowX, plot.top + 12);
    ctx.restore();

    if (d1.T <= totalWindow * 0.65) {
      const leftT = totalWindow * 0.08;
      const rightT = leftT + d1.T;
      const py = plot.top + plot.height - 13;
      const px1 = plot.left + plot.width * leftT / totalWindow;
      const px2 = plot.left + plot.width * rightT / totalWindow;
      drawArrow(ctx, px1, py, px2, py);
      drawArrow(ctx, px2, py + 1, px1, py + 1);
      ctx.save();
      ctx.fillStyle = '#2d4d68';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`T₁ = ${comma(d1.T, 2)} s`, (px1 + px2) / 2, py - 8);
      ctx.restore();
    }
  }

  function colorFromValue(y, maxA) {
    const z = Math.max(-1, Math.min(1, y / Math.max(maxA, 0.01)));
    const neutral = [247, 247, 247];
    const neg = [33, 102, 172];
    const pos = [178, 24, 43];
    const target = z < 0 ? neg : pos;
    const a = Math.abs(z);
    return [
      Math.round(neutral[0] + a * (target[0] - neutral[0])),
      Math.round(neutral[1] + a * (target[1] - neutral[1])),
      Math.round(neutral[2] + a * (target[2] - neutral[2]))
    ];
  }

  function drawSpaceTime(force = false) {
    const now = performance.now();
    if (!force && !dirtySpaceTime && now - lastSpaceTimeDraw < 90) return;
    lastSpaceTimeDraw = now;
    dirtySpaceTime = false;

    const { ctx, w, h } = resizeCanvas(spacetimeCanvas);
    const L = getL();
    const d1 = derived(getWave(1));
    const timeWindow = Math.max(4 * d1.T, 1.8);
    const plot = { left: 53, top: 14, width: Math.max(50, w - 68), height: Math.max(50, h - 50) };
    ctx.clearRect(0, 0, w, h);

    const nx = offscreen.width;
    const ny = offscreen.height;
    const img = offCtx.createImageData(nx, ny);
    const amp = yLimit();
    const currentWaves = waves();
    const tStart = simTime - timeWindow;
    let p = 0;
    for (let iy = 0; iy < ny; iy++) {
      const t = tStart + timeWindow * iy / (ny - 1);
      for (let ix = 0; ix < nx; ix++) {
        const x = L * ix / (nx - 1);
        const [r, g, b] = colorFromValue(resultantOf(currentWaves, x, t), amp);
        img.data[p++] = r; img.data[p++] = g; img.data[p++] = b; img.data[p++] = 255;
      }
    }
    offCtx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreen, plot.left, plot.top, plot.width, plot.height);
    ctx.imageSmoothingEnabled = true;

    ctx.save();
    ctx.strokeStyle = '#526170';
    ctx.lineWidth = 1.1;
    ctx.strokeRect(plot.left, plot.top, plot.width, plot.height);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#344554';
    ctx.textAlign = 'center';
    for (let x = 0; x <= L + 1e-9; x += 1) {
      const px = plot.left + plot.width * x / L;
      ctx.strokeStyle = 'rgba(30, 54, 77, .16)';
      ctx.beginPath(); ctx.moveTo(px, plot.top); ctx.lineTo(px, plot.top + plot.height); ctx.stroke();
      ctx.fillStyle = '#5c6975';
      ctx.fillText(String(x), px, plot.top + plot.height + 16);
    }
    ctx.fillStyle = '#344554';
    ctx.fillText('posició x (m)', plot.left + plot.width / 2, h - 4);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#5c6975';
    ctx.fillText(`t − ${comma(timeWindow, 2)} s`, plot.left - 8, plot.top + 4);
    ctx.fillText('t actual', plot.left - 8, plot.top + plot.height);
    ctx.save();
    ctx.translate(13, plot.top + plot.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#344554';
    ctx.fillText('temps', 0, 0);
    ctx.restore();
    ctx.restore();
  }

  function updateReadouts() {
    const w1 = getWave(1);
    const w2 = getWave(2);
    $('a1Out').textContent = `${comma(w1.A, 1)} cm`;
    $('k1Out').textContent = `${comma(w1.k, 2)} rad/m`;
    $('w1Out').textContent = `${comma(w1.w, 2)} rad/s`;
    $('p1Out').textContent = phaseLabel(w1.p);
    $('a2Out').textContent = `${comma(w2.A, 1)} cm`;
    $('k2Out').textContent = `${comma(w2.k, 2)} rad/m`;
    $('w2Out').textContent = `${comma(w2.w, 2)} rad/s`;
    $('p2Out').textContent = phaseLabel(w2.p);

    const writeDerived = (el, wave) => {
      const d = derived(wave);
      el.innerHTML = `
        <div>Longitud d’ona λ<b>${comma(d.lambda, 2)} m</b></div>
        <div>Període T<b>${comma(d.T, 2)} s</b></div>
        <div>Freqüència f<b>${comma(d.f, 2)} Hz</b></div>
        <div>Velocitat v<b>${comma(d.v, 2)} m/s</b></div>`;
    };
    writeDerived($('derived1'), w1);
    writeDerived($('derived2'), w2);

    $('speedValue').textContent = `${comma(n('speed'), 2)}×`;
    $('x0Value').textContent = `${comma(getX0(), 2)} m`;
    $('x0Legend').textContent = `${comma(Math.min(getX0(), getL()), 2)} m`;
    $('lengthViewValue').textContent = `${getL()} m`;

    const signText = (w) => w.dir < 0 ? '−' : '+';
    if (mode === 'simple') {
      $('formulaBox').innerHTML = `y(x,t) = ${comma(w1.A, 1)}·sin(${comma(w1.w, 2)}t ${signText(w1)} ${comma(w1.k, 2)}x ${w1.p >= 0 ? '+' : '−'} ${comma(Math.abs(w1.p), 2)}) cm`;
    } else {
      $('formulaBox').innerHTML = `y<sub>R</sub>(x,t)=y<sub>1</sub>(x,t)+y<sub>2</sub>(x,t)`;
    }

    const d1 = derived(w1);
    const x0 = Math.min(getX0(), getL());
    const currentWaves = mode === 'simple' ? [w1] : [w1, w2];
    let text = `<b>En aquest moment:</b> al punt x<sub>0</sub>=${comma(x0, 2)} m, la resultant és y=${comma(resultantOf(currentWaves, x0, simTime), 2)} cm. `;
    if (mode === 'simple') {
      text += `L’ona té λ=${comma(d1.lambda, 2)} m i T=${comma(d1.T, 2)} s; per tant es propaga a v=${comma(d1.v, 2)} m/s. `;
      text += w1.dir < 0 ? 'Les fases iguals avancen cap a la dreta.' : 'Les fases iguals avancen cap a l’esquerra.';
    } else {
      const d2 = derived(w2);
      const sameK = Math.abs(w1.k - w2.k) < 0.08;
      const sameW = Math.abs(w1.w - w2.w) < 0.08;
      const opposite = w1.dir !== w2.dir;
      if (sameK && sameW && opposite) {
        text += `<b>Les dues ones tenen el mateix k i la mateixa ω, però sentits contraris:</b> la resultant és una ona estacionària. Els nodes romanen sempre amb y=0.`;
      } else if (sameK && sameW && w1.dir === w2.dir) {
        const delta = Math.abs(((w2.p - w1.p + Math.PI) % (2 * Math.PI)) - Math.PI);
        if (delta < 0.13) text += `<b>Interferència constructiva:</b> les ones són gairebé en fase i l’amplitud resultant és màxima.`;
        else if (Math.abs(delta - Math.PI) < 0.13) text += `<b>Interferència destructiva:</b> les ones són gairebé en oposició de fase i es cancel·len.`;
        else text += `Les ones tenen la mateixa freqüència però un desfasament intermedi: la interferència depèn del punt i de l’instant.`;
      } else if (Math.abs(w1.w - w2.w) < 1.2 && w1.dir === w2.dir) {
        text += `Les freqüències són properes: observa com l’amplitud resultant pot créixer i disminuir, és a dir, com apareixen pulsacions.`;
      } else {
        text += `La forma resultant canvia perquè les dues ones tenen paràmetres diferents. Prova d’igualar k i ω per investigar casos més ordenats.`;
      }
      text += ` (Ona 1: v=${comma(d1.v, 2)} m/s; ona 2: v=${comma(d2.v, 2)} m/s.)`;
    }
    $('readingText').innerHTML = text;
  }

  function redraw(forceMap = false) {
    updateReadouts();
    drawSpatial();
    drawTemporal();
    drawSpaceTime(forceMap);
  }

  function setMode(nextMode) {
    mode = nextMode;
    $('simpleMode').classList.toggle('active', mode === 'simple');
    $('superMode').classList.toggle('active', mode === 'super');
    $('wave2Panel').classList.toggle('hidden', mode !== 'super');
    dirtySpaceTime = true;
    redraw(true);
  }

  function applyPreset(name) {
    const presets = {
      simple: () => {
        setMode('simple');
        set('a1', 2); set('k1', 3.14); set('w1', 6.28); set('p1', 0); $('dir1').value = '-1';
      },
      constructive: () => {
        setMode('super');
        set('a1', 2); set('k1', 3.14); set('w1', 6.28); set('p1', 0); $('dir1').value = '-1';
        set('a2', 2); set('k2', 3.14); set('w2', 6.28); set('p2', 0); $('dir2').value = '-1';
      },
      destructive: () => {
        setMode('super');
        set('a1', 2); set('k1', 3.14); set('w1', 6.28); set('p1', 0); $('dir1').value = '-1';
        set('a2', 2); set('k2', 3.14); set('w2', 6.28); set('p2', Math.PI); $('dir2').value = '-1';
      },
      stationary: () => {
        setMode('super');
        set('a1', 2); set('k1', 3.14); set('w1', 6.28); set('p1', 0); $('dir1').value = '-1';
        set('a2', 2); set('k2', 3.14); set('w2', 6.28); set('p2', 0); $('dir2').value = '1';
      },
      fixed: () => {
        setMode('super');
        set('a1', 2); set('k1', 3.14); set('w1', 6.28); set('p1', 0); $('dir1').value = '-1';
        set('a2', 2); set('k2', 3.14); set('w2', 6.28); set('p2', Math.PI); $('dir2').value = '1';
      },
      free: () => {
        setMode('super');
        set('a1', 2); set('k1', 3.14); set('w1', 6.28); set('p1', 0); $('dir1').value = '-1';
        set('a2', 2); set('k2', 3.14); set('w2', 6.28); set('p2', 0); $('dir2').value = '1';
      },
      beats: () => {
        setMode('super');
        set('a1', 2); set('k1', 3.14); set('w1', 6.00); set('p1', 0); $('dir1').value = '-1';
        set('a2', 2); set('k2', 3.55); set('w2', 6.80); set('p2', 0); $('dir2').value = '-1';
      }
    };
    presets[name]();
    simTime = 0;
    dirtySpaceTime = true;
    redraw(true);
  }

  $('simpleMode').addEventListener('click', () => setMode('simple'));
  $('superMode').addEventListener('click', () => setMode('super'));
  function syncPlayButton() {
    $('playPause').textContent = isPlaying ? '⏸ Pausa' : '▶ Reprodueix';
    $('playPause').classList.toggle('primary', isPlaying);
  }
  $('playPause').addEventListener('click', () => {
    isPlaying = !isPlaying;
    syncPlayButton();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isPlaying) {
      isPlaying = false;
      syncPlayButton();
    }
  });
  syncPlayButton();
  $('resetTime').addEventListener('click', () => { simTime = 0; dirtySpaceTime = true; redraw(true); });
  document.querySelectorAll('.preset').forEach((btn) => btn.addEventListener('click', () => applyPreset(btn.dataset.preset)));
  document.querySelectorAll('input, select').forEach((el) => {
    el.addEventListener('input', () => { dirtySpaceTime = true; redraw(true); });
    el.addEventListener('change', () => { dirtySpaceTime = true; redraw(true); });
  });
  window.addEventListener('resize', () => { dirtySpaceTime = true; redraw(true); });

  function animate(now) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    if (isPlaying) simTime += dt * n('speed');
    redraw(false);
    requestAnimationFrame(animate);
  }

  redraw(true);
  requestAnimationFrame(animate);
})();
