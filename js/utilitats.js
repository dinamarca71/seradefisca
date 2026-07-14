const TAU = 2 * Math.PI;

function formatNum(n, decimals = 2) {
  if (!isFinite(n)) return '—';
  return n.toFixed(decimals).replace('.', ',');
}

function formatPhase(rad) {
  const piFractions = [
    [Math.PI, 'π'], [Math.PI / 2, 'π/2'], [Math.PI / 4, 'π/4'],
    [-Math.PI, '−π'], [-Math.PI / 2, '−π/2']
  ];
  for (const [val, label] of piFractions) {
    if (Math.abs(rad - val) < 0.06) return label;
  }
  return formatNum(rad) + ' rad';
}

function setupCanvas(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawGrid(ctx, padL, padT, plotW, plotH) {
  ctx.strokeStyle = '#e8edf2';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (plotH * i) / 4;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
  }
  for (let i = 0; i <= 8; i++) {
    const x = padL + (plotW * i) / 8;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
  }
}

function drawAxes(ctx, padL, padT, plotW, plotH, yZero, labels = {}) {
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(padL, yZero); ctx.lineTo(padL + plotW, yZero); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.stroke();

  ctx.fillStyle = '#5a6b7d';
  ctx.font = '12px Segoe UI, sans-serif';
  if (labels.x) {
    ctx.textAlign = 'center';
    ctx.fillText(labels.x, padL + plotW / 2, padT + plotH + 28);
  }
  if (labels.y) {
    ctx.save();
    ctx.translate(14, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(labels.y, 0, 0);
    ctx.restore();
  }
}

function bindSlider(id, valId, onChange, formatter = v => formatNum(v)) {
  const slider = document.getElementById(id);
  const valEl = document.getElementById(valId);
  const update = () => {
    const v = parseFloat(slider.value);
    if (valEl) valEl.textContent = formatter(v);
    onChange(v);
  };
  slider.addEventListener('input', update);
  update();
}

function formatSci(n, decimals = 2) {
  if (n === 0) return '0';
  if (!isFinite(n)) return '—';
  const exp = Math.floor(Math.log10(Math.abs(n)));
  const mant = n / Math.pow(10, exp);
  return formatNum(mant, decimals) + '·10^' + exp;
}

function bindPlayControls(state, drawFn, opts = {}) {
  const maxT = opts.maxT || 20;
  const btn = document.getElementById('btnPlay');
  const reset = document.getElementById('btnReset');
  const speedSlider = document.getElementById('speedSlider');
  const timeSlider = document.getElementById('timeSlider');
  const timeDisplay = document.getElementById('timeDisplay');

  function animate() {
    if (!state.playing) return;
    state.t += 0.016 * state.speed;
    if (state.t > maxT) state.t = 0;
    if (timeSlider) timeSlider.value = state.t;
    if (timeDisplay) timeDisplay.textContent = `t = ${formatNum(state.t)} s`;
    drawFn();
    requestAnimationFrame(animate);
  }

  if (btn) btn.addEventListener('click', () => {
    state.playing = !state.playing;
    btn.textContent = state.playing ? '⏸ Pausa' : '▶ Reproduir';
    if (state.playing) requestAnimationFrame(animate);
  });

  if (reset) reset.addEventListener('click', () => {
    state.t = 0;
    state.playing = false;
    if (btn) btn.textContent = '▶ Reproduir';
    if (timeSlider) timeSlider.value = 0;
    if (timeDisplay) timeDisplay.textContent = 't = 0,00 s';
    drawFn();
  });

  if (speedSlider) speedSlider.addEventListener('input', e => { state.speed = parseFloat(e.target.value); });
  if (timeSlider) timeSlider.addEventListener('input', e => {
    state.t = parseFloat(e.target.value);
    if (timeDisplay) timeDisplay.textContent = `t = ${formatNum(state.t)} s`;
    drawFn();
  });
}
