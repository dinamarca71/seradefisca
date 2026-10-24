(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';

  const PRESETS = [
    { id: 'avio', et: 'Avió (900 km/h)', beta: 900 / 3600 / 299792.458 },
    { id: '06', et: '0,6 c', beta: 0.6 },
    { id: '08', et: '0,8 c', beta: 0.8 },
    { id: '099', et: '0,99 c', beta: 0.99 }
  ];

  function tex(s, display) {
    if (!window.katex) return s;
    try {
      return katex.renderToString(s, { throwOnError: false, strict: 'ignore', displayMode: !!display });
    } catch (e) {
      return s;
    }
  }

  function renderMath() {
    document.querySelectorAll('[data-math]').forEach(el => {
      const src = el.getAttribute('data-math');
      const display = !!(el.parentElement && el.parentElement.classList.contains('formula-pas'));
      if (!window.katex) { el.textContent = src; return; }
      katex.render(src, el, { throwOnError: false, strict: 'ignore', displayMode: display });
    });
  }

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'text') n.textContent = v;
      else n.setAttribute(k, v);
    }
    if (parent) parent.appendChild(n);
    return n;
  }

  function gammaDe(beta) {
    const b = Math.min(Math.abs(beta), 0.999999);
    return 1 / Math.sqrt(1 - b * b);
  }

  function fmt(x, sig) {
    if (!isFinite(x)) return '—';
    const ax = Math.abs(x);
    if (ax !== 0 && (ax < 1e-3 || ax >= 1e4)) {
      const exp = Math.floor(Math.log10(ax));
      const m = x / 10 ** exp;
      return m.toFixed(sig - 1).replace('.', ',') + '·10' + sup(exp);
    }
    const digits = ax >= 100 ? 1 : ax >= 10 ? 2 : sig;
    return Number(x.toFixed(digits)).toString().replace('.', ',').replace('-', '−');
  }

  function sup(n) {
    const map = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(n).replace(/./g, ch => map[ch] || ch);
  }

  function fmtGamma(g) {
    const d = g - 1;
    if (d < 1e-6) return '1';
    if (d < 0.001) return g.toFixed(6).replace('.', ',');
    return fmt(g, 4);
  }

  function dibuixaRellotge(beta) {
    const svg = $('relSvg');
    svg.querySelectorAll(':scope > :not(title):not(desc)').forEach(n => n.remove());
    const g = gammaDe(beta);
    const quiet = beta < 1e-4;

    el('text', { x: 150, y: 28, class: 'rel-titol', 'text-anchor': 'middle', text: 'Amb el rellotge' }, svg);
    el('text', { x: 460, y: 28, class: 'rel-titol', 'text-anchor': 'middle', text: 'Des de l’andana' }, svg);

    // Rellotge en repòs
    el('line', { x1: 90, y1: 70, x2: 210, y2: 70, class: 'rel-mirall' }, svg);
    el('line', { x1: 90, y1: 210, x2: 210, y2: 210, class: 'rel-mirall' }, svg);
    el('line', { x1: 150, y1: 210, x2: 150, y2: 70, class: 'rel-llum' }, svg);
    el('text', { x: 162, y: 146, class: 'rel-et', text: 'L' }, svg);
    el('text', { x: 150, y: 248, class: 'rel-et', 'text-anchor': 'middle', text: 'Δt₀ = L/c' }, svg);

    if (quiet) {
      el('line', { x1: 400, y1: 70, x2: 520, y2: 70, class: 'rel-mirall' }, svg);
      el('line', { x1: 400, y1: 210, x2: 520, y2: 210, class: 'rel-mirall' }, svg);
      el('line', { x1: 460, y1: 210, x2: 460, y2: 70, class: 'rel-llum' }, svg);
      el('text', { x: 472, y: 146, class: 'rel-et', text: 'L' }, svg);
      el('text', { x: 460, y: 248, class: 'rel-et', 'text-anchor': 'middle', text: 'Δt ≈ Δt₀' }, svg);
      $('relDesc').textContent = 'El rellotge va tan a poc a poc respecte de c que, des de l’andana, la llum també puja en vertical.';
      return;
    }

    // Triangle en moviment, forma correcta i encaixat
    const H = 140;
    const ratio = beta * g;
    const rawW = H * ratio;
    const maxW = 210;
    const s = rawW > maxW ? maxW / rawW : 1;
    const h = H * s;
    const w = rawW * s;
    const x0 = 360;
    const y0 = 230;
    const x1 = x0 + w;
    const y1 = y0 - h;

    el('line', { x1: x0 - 28, y1: y0, x2: x0 + 28, y2: y0, class: 'rel-mirall' }, svg);
    el('line', { x1: x1 - 28, y1: y1, x2: x1 + 28, y2: y1, class: 'rel-mirall' }, svg);
    el('line', { x1: x0, y1: y0, x2: x1, y2: y1, class: 'rel-llum' }, svg);
    if (w > 8) {
      el('line', { x1: x0, y1: y0, x2: x1, y2: y0, class: 'rel-ajuda' }, svg);
      el('line', { x1: x1, y1: y0, x2: x1, y2: y1, class: 'rel-ajuda' }, svg);
      el('text', { x: (x0 + x1) / 2, y: y0 + 18, class: 'rel-et-v', 'text-anchor': 'middle', text: 'vΔt' }, svg);
    }
    el('text', { x: x1 + 8, y: (y0 + y1) / 2, class: 'rel-et', text: 'L' }, svg);
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    el('text', { x: mx - 8, y: my - 8, class: 'rel-et-b', 'text-anchor': 'end', text: 'cΔt' }, svg);

    $('relDesc').textContent = beta < 1e-4
      ? 'El rellotge està pràcticament en repòs: des de l’andana la llum també puja en vertical.'
      : `Triangle del rellotge en moviment a v/c = ${fmt(beta, 3)}. La diagonal és el camí de la llum.`;
  }

  function textResultat(beta) {
    const g = gammaDe(beta);
    const anys = 10 * g;
    let frase;
    if (beta < 1e-12) {
      frase = 'En repòs, γ = 1: els dos observadors mesuren el mateix temps.';
    } else if (beta < 1e-4) {
      const defecte = g - 1;
      frase = `A 900 km/h, γ − 1 és de l’ordre de ${fmt(defecte, 2)}. ` +
        `En 10 anys de temps propi, la diferència amb la Terra és inapreciable.`;
    } else {
      frase = `Si a bord passen 10 anys (temps propi), a la Terra en passen ${fmt(anys, 4)}.`;
    }
    $('relResultat').innerHTML =
      `<p>v/c = <strong>${fmt(beta, 3)}</strong></p>` +
      `<p>γ = <strong>${fmtGamma(g)}</strong></p>` +
      `<p>${frase}</p>`;
  }

  function marcaPreset(beta) {
    document.querySelectorAll('#relPresets .btn').forEach(b => {
      const p = PRESETS.find(x => x.id === b.dataset.id);
      const ok = p && Math.abs(p.beta - beta) / Math.max(p.beta, 1e-12) < 0.02
        && Math.abs(p.beta - beta) < 0.005;
      b.setAttribute('aria-pressed', ok ? 'true' : 'false');
    });
  }

  function aplica(beta) {
    beta = Math.min(0.99, Math.max(0, beta));
    const slider = $('relBeta');
    if (beta < 0.005) {
      slider.value = '0';
      $('relBetaVal').textContent = fmt(beta, 2);
    } else {
      const arrodonit = Math.round(beta * 100) / 100;
      slider.value = String(arrodonit);
      $('relBetaVal').textContent = arrodonit.toFixed(2).replace('.', ',');
    }
    dibuixaRellotge(beta);
    textResultat(beta);
    marcaPreset(beta);
    slider.dataset.beta = String(beta);
  }

  function inicia() {
    const cont = $('relPresets');
    PRESETS.forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.dataset.id = p.id;
      b.textContent = p.et;
      b.addEventListener('click', () => aplica(p.beta));
      cont.appendChild(b);
    });
    $('relBeta').addEventListener('input', () => aplica(Number($('relBeta').value)));
    aplica(0.6);
  }

  renderMath();
  inicia();
})();
