(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const CX = 200, CY = 160, R = 95, AMP = 14;

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
      const display = el.parentElement && el.parentElement.classList.contains('formula-pas');
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

  function ondaPath(nOnes, tanca) {
    const steps = 360;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const t = (2 * Math.PI * i) / steps;
      const fase = nOnes * t;
      const amp = tanca ? AMP : AMP * (0.35 + 0.65 * (1 - i / steps));
      const r = R + amp * Math.sin(fase);
      const x = CX + r * Math.cos(t);
      const y = CY - r * Math.sin(t);
      d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
    }
    if (tanca) d += 'Z';
    return d;
  }

  function dibuixaBohr() {
    const svg = $('bohrSvg');
    const n = Number($('bohrN').value);
    const desencaix = $('bohrDesencaix').checked;
    const nEfectiu = desencaix ? n + 0.5 : n;
    const tanca = !desencaix;

    svg.querySelectorAll(':scope > :not(title):not(desc)').forEach(n => n.remove());
    el('circle', { cx: CX, cy: CY, r: R, class: 'bohr-orbita' }, svg);
    el('circle', { cx: CX, cy: CY, r: 7, class: 'bohr-nucli' }, svg);
    el('text', { x: CX + 12, y: CY - 10, class: 'bohr-et-muted', text: 'nucli' }, svg);
    el('path', {
      d: ondaPath(nEfectiu, tanca),
      class: tanca ? 'bohr-ona' : 'bohr-ona ko'
    }, svg);
    el('circle', {
      cx: CX + R, cy: CY, r: 4,
      class: tanca ? 'bohr-marca' : 'bohr-marca ko'
    }, svg);
    el('text', {
      x: 16, y: 28, class: 'bohr-et',
      text: tanca ? `n = ${n} · ona tancada` : `n ≈ ${nEfectiu} · no tanca`
    }, svg);
    el('text', {
      x: 16, y: 48, class: 'bohr-et-muted',
      text: tanca ? 'La fase coincideix en tornar al punt' : 'La fase no coincideix: interferència destructiva'
    }, svg);

    const res = $('bohrResult');
    res.classList.toggle('ko', !tanca);
    if (tanca) {
      res.innerHTML = `Condició: la circumferència conté exactament <strong>${n}</strong> longitud${n === 1 ? '' : 's'} d’ona. ` +
        tex(`2\\pi r=${n}\\lambda`);
      $('bohrPasos').innerHTML =
        `<div>${tex(`2\\pi r=${n}\\,\\lambda=\\dfrac{${n}h}{p}`, true)}</div>` +
        `<div>${tex(`p=mv\\ \\Longrightarrow\\ mvr=${n}\\,\\hbar`, true)}</div>`;
    } else {
      res.innerHTML = `Si a l’òrbita no hi caben un nombre <strong>enter</strong> de longituds d’ona, ` +
        `l’ona no es reforça: només els valors enters de n són estables en aquest model.`;
      $('bohrPasos').innerHTML =
        `<div>${tex(`2\\pi r\\neq n\\lambda\\quad(n\\notin\\mathbb{Z})`, true)}</div>`;
    }

    $('bohrDesc').textContent = tanca
      ? `Òrbita circular amb ${n} longituds d’ona de De Broglie tancades sobre si mateixes.`
      : `Òrbita amb un nombre no enter de longituds d’ona: l’ona no tanca correctament.`;
  }

  function iniciaBohr() {
    const slider = $('bohrN');
    const val = $('bohrNVal');
    const actualitza = () => {
      val.textContent = slider.value;
      dibuixaBohr();
    };
    slider.addEventListener('input', actualitza);
    $('bohrDesencaix').addEventListener('change', dibuixaBohr);
    actualitza();
  }

  renderMath();
  iniciaBohr();
})();
