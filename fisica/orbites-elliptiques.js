(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MU_TERRA = 3.986004418e14;   // m³/s²
  const R_TERRA = 6.371e6;           // m
  const MU_SOL = 1.32712440018e20;   // m³/s²
  const R_SOL = 6.957e8;             // m
  const UA = 1.495978707e11;         // m
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Utilitats ---------- */
  const $ = id => document.getElementById(id);

  function tex(src) {
    if (!window.katex) return src;
    return katex.renderToString(src, { throwOnError: false, strict: 'ignore' });
  }

  function renderMath(root = document) {
    root.querySelectorAll('[data-math]').forEach(el => {
      const src = el.getAttribute('data-math');
      if (!window.katex) { el.textContent = src; return; }
      katex.render(src, el, { throwOnError: false, strict: 'ignore' });
    });
  }

  function fmt(x, sig = 4) {
    if (x === 0) return '0';
    const n = Number(x.toPrecision(sig));
    if (Math.abs(n) >= 1e4) {
      const s = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
      return (n < 0 ? '−' : '') + s;
    }
    return n.toLocaleString('ca-ES', {
      maximumSignificantDigits: sig, minimumSignificantDigits: sig, useGrouping: false
    }).replace('-', '−');
  }

  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function partsSci(x, sig) {
    let exp = Math.floor(Math.log10(Math.abs(x)));
    let mant = Number((x / 10 ** exp).toPrecision(sig));
    if (Math.abs(mant) >= 10) { mant /= 10; exp += 1; }
    return { mant: fmt(mant, sig), exp };
  }
  function fmtSci(x, sig = 3) {
    if (x === 0) return '0';
    const { mant, exp } = partsSci(x, sig);
    return `${mant}·10${String(exp).split('').map(c => SUP[c]).join('')}`;
  }
  const texNum = s => s.replace(',', '{,}').replace(/\u202f/g, '\\,').replace('−', '-');
  function numTex(x, sig = 4) {
    if (Math.abs(x) >= 1e6 || (Math.abs(x) < 1e-3 && x !== 0)) {
      const { mant, exp } = partsSci(x, sig);
      return `${texNum(mant)}\\cdot10^{${exp}}`;
    }
    return texNum(fmt(x, sig));
  }

  function fmtTemps(s) {
    if (s < 120) return `${fmt(s, 3)} s`;
    if (s < 7200) return `${fmt(s / 60, 3)} min`;
    if (s < 72 * 3600) return `${fmt(s / 3600, 3)} h`;
    return `${fmt(s / 86400, 3)} dies`;
  }

  function el(tag, attrs, parent) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'text') node.textContent = v; else node.setAttribute(k, v);
    }
    if (parent) parent.append(node);
    return node;
  }

  function markers(svg) {
    const defs = el('defs', {}, svg);
    [['m-vel', '#2563eb'], ['m-dv', '#dc2626'], ['m-abans', '#94a3b8'], ['m-cota', '#1a2332']].forEach(([id, color]) => {
      const m = el('marker', { id: `${svg.id}-${id}`, viewBox: '0 0 10 10', refX: 8.5, refY: 5,
        markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0 0 L10 5 L0 10 z', fill: color }, m);
    });
  }

  function fletxa(g, x1, y1, x2, y2, cls, marker, svgId) {
    if (Math.hypot(x2 - x1, y2 - y1) < 2) return null;
    return el('line', { x1, y1, x2, y2, class: cls, 'marker-end': `url(#${svgId}-${marker})` }, g);
  }

  function valors(container, items) {
    container.innerHTML = items.map(([nom, val, destaca]) =>
      `<div class="valor${destaca ? ' destaca' : ''}"><b>${nom}</b><span>${val}</span></div>`).join('');
  }

  function botonsPreset(container, presets, onTria) {
    container.innerHTML = '';
    presets.forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.textContent = p.nom;
      b.dataset.id = p.id;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => onTria(p));
      container.append(b);
    });
  }

  function marcaPreset(container, id) {
    container.querySelectorAll('.btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
  }

  /* Problema de Kepler: posició i velocitat amb el focus a l'origen i la periapsi sobre +x */
  function kepler(a, e, M, mu) {
    let E = e > 0.8 ? Math.PI : M;
    for (let i = 0; i < 50; i++) {
      const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= d;
      if (Math.abs(d) < 1e-14) break;
    }
    const b = a * Math.sqrt(1 - e * e);
    const x = a * (Math.cos(E) - e);
    const y = b * Math.sin(E);
    const r = Math.hypot(x, y);
    const k = Math.sqrt(mu * a) / r;
    return { x, y, r, vx: -k * Math.sin(E), vy: k * Math.sqrt(1 - e * e) * Math.cos(E) };
  }

  function visible(node, onChange) {
    if (!('IntersectionObserver' in window)) { onChange(true); return; }
    new IntersectionObserver(entries => onChange(entries[0].isIntersecting)).observe(node);
  }

  /* ---------- 1 · Explorador de l'el·lipse ---------- */
  const EL_PRESETS = [
    { id: 'ex', nom: 'Exemple', a: 1, e: 0.6, u: 'UA', cos: 'Sol',
      text: 'El·lipse d’exemple amb e = 0,6: el focus ocupat ja és molt lluny del centre.' },
    { id: 'circ', nom: 'Circumferència', a: 1, e: 0, u: 'UA', cos: 'Sol',
      text: 'Amb e = 0 els dos focus coincideixen amb el centre: és una circumferència de radi a.' },
    { id: 'terra', nom: 'Terra', a: 1.000, e: 0.0167, u: 'UA', cos: 'Sol',
      text: 'L’òrbita de la Terra: a ull és una circumferència, però el Sol està desplaçat del centre 2,5 milions de km.' },
    { id: 'mart', nom: 'Mart', a: 1.524, e: 0.0934, u: 'UA', cos: 'Sol',
      text: 'Mart: la distància al Sol varia un 20 % al llarg de l’any marcià. Kepler va descobrir les el·lipses estudiant aquesta òrbita.' },
    { id: 'mercuri', nom: 'Mercuri', a: 0.387, e: 0.2056, u: 'UA', cos: 'Sol',
      text: 'Mercuri, el planeta més excèntric: del periheli a l’afeli la distància al Sol augmenta més d’un 50 %.' },
    { id: 'pluto', nom: 'Plutó', a: 39.48, e: 0.2488, u: 'UA', cos: 'Sol',
      text: 'Plutó: al periheli és més a prop del Sol que Neptú.' },
    { id: 'molniya', nom: 'Molniya', a: 26521, e: 0.737, u: 'km', cos: 'Terra',
      text: 'Òrbita Molniya (satèl·lits russos de comunicacions): passa molt de temps a prop de l’apogeu, sobre latituds altes.' },
    { id: 'halley', nom: 'Halley', a: 17.83, e: 0.967, u: 'UA', cos: 'Sol',
      text: 'El cometa Halley: al periheli és més a prop del Sol que Venus; a l’afeli, més enllà de Neptú. Hi torna cada 76 anys.' }
  ];

  const ex = { a: 1, e: 0.6, u: 'UA', cos: 'Sol', theta: 60, preset: 'ex' };

  function dibuixaElipse() {
    const svg = $('elSvg');
    svg.querySelectorAll(':scope > :not(title):not(desc)').forEach(n => n.remove());
    markers(svg);
    const g = el('g', {}, svg);
    const { e } = ex;
    const bn = Math.sqrt(1 - e * e);
    const s = Math.min(250, 125 / bn);
    const A = s, B = s * bn, C = s * e;
    const cx = 320, cy = 155;
    const f1 = cx + C, f2 = cx - C;
    const peri = cx + A, apo = cx - A;

    el('line', { x1: apo - 12, y1: cy, x2: peri + 12, y2: cy, class: 'sv-eix' }, g);
    el('line', { x1: cx, y1: cy - B - 10, x2: cx, y2: cy + B + 10, class: 'sv-eix' }, g);
    el('ellipse', { cx, cy, rx: A, ry: B, class: 'sv-elipse' }, g);

    el('line', { x1: cx, y1: cy, x2: peri, y2: cy, class: 'sv-cota-a' }, g);
    el('line', { x1: cx, y1: cy, x2: cx, y2: cy - B, class: 'sv-cota-b' }, g);
    if (C > 1) {
      el('line', { x1: cx, y1: cy + 7, x2: f1, y2: cy + 7, class: 'sv-cota-c' }, g);
      el('text', { x: (cx + f1) / 2, y: cy + 22, class: 'sv-text c mig', text: 'c' }, g);
      el('line', { x1: f1, y1: cy, x2: cx, y2: cy - B, class: 'sv-pita' }, g);
      el('text', { x: (f1 + cx) / 2 + 8, y: cy - B / 2 - 4, class: 'sv-text a petit', text: 'a' }, g);
    }
    const aMid = (cx + peri) / 2;
    el('text', { x: aMid, y: Math.abs(aMid - f1) < 22 ? cy - 22 : cy - 8, class: 'sv-text a mig', text: 'a' }, g);
    el('text', { x: cx - 9, y: cy - B / 2, class: 'sv-text b', 'text-anchor': 'end', text: 'b' }, g);

    el('text', { x: peri + 6, y: cy - 6, class: 'sv-text petit', text: 'periapsi' }, g);
    el('text', { x: apo - 6, y: cy - 6, class: 'sv-text petit', 'text-anchor': 'end', text: 'apoapsi' }, g);

    const yd = cy + B + 28;
    [[apo, f1, 'r_a', 'rₐ'], [f1, peri, 'r_p', 'rₚ']].forEach(([x1, x2, , lab]) => {
      if (x2 - x1 < 1) return;
      el('line', { x1, y1: yd, x2, y2: yd, class: 'sv-cota' }, g);
      el('line', { x1, y1: yd - 5, x2: x1, y2: yd + 5, class: 'sv-cota' }, g);
      el('line', { x1: x2, y1: yd - 5, x2, y2: yd + 5, class: 'sv-cota' }, g);
      const estret = x2 - x1 < 34;
      el('text', { x: estret ? x2 + 6 : (x1 + x2) / 2, y: yd + 16, class: `sv-text${estret ? '' : ' mig'}`, text: lab }, g);
    });

    const th = ex.theta * Math.PI / 180;
    const r = A * (1 - e * e) / (1 + e * Math.cos(th));
    const px = f1 + r * Math.cos(th), py = cy - r * Math.sin(th);
    el('line', { x1: f1, y1: cy, x2: px, y2: py, class: 'sv-r1' }, g);
    el('line', { x1: f2, y1: cy, x2: px, y2: py, class: 'sv-r2' }, g);
    const etiqueta = (x1, y1, cls, txt) => {
      const mx = (x1 + px) / 2, my = (y1 + py) / 2;
      const len = Math.hypot(px - x1, py - y1) || 1;
      const nx = -(py - y1) / len, ny = (px - x1) / len;
      el('text', { x: mx + nx * 12, y: my + ny * 12 + 4, class: `sv-text mig ${cls}`, text: txt }, g);
    };
    etiqueta(f1, cy, 'r1', 'r₁');
    etiqueta(f2, cy, 'r2', 'r₂');

    el('circle', { cx, cy, r: 2.5, class: 'sv-centre' }, g);
    el('text', { x: cx - 5, y: cy + 14, class: 'sv-text petit', 'text-anchor': 'end', text: 'O' }, g);
    if (C > 1) {
      el('circle', { cx: f2, cy, r: 5, class: 'sv-buit' }, g);
      el('text', { x: f2 - 4, y: cy - 10, class: 'sv-text petit', 'text-anchor': 'end', text: 'F₂' }, g);
    }
    el('circle', { cx: f1, cy, r: 8, class: ex.cos === 'Sol' ? 'sv-cos' : 'sv-terra' }, g);
    el('text', { x: f1 + 4, y: cy - 12, class: 'sv-text petit', text: `F₁ · ${ex.cos}` }, g);
    el('circle', { cx: px, cy: py, r: 5.5, class: 'sv-punt' }, g);
    el('text', { x: px + (Math.cos(th) >= 0 ? 9 : -9), y: py + (Math.sin(th) >= 0 ? -8 : 16),
      class: 'sv-text', 'text-anchor': Math.cos(th) >= 0 ? 'start' : 'end', text: 'P' }, g);

    const a = ex.a, u = ex.u;
    const b = a * bn, c = a * e;
    const r1 = a * (1 - e * e) / (1 + e * Math.cos(th));
    const r2 = 2 * a - r1;
    const q = x => `${fmt(x, 4)} ${u}`;
    valors($('elValors'), [
      ['Semieix major a', q(a)], ['Semieix menor b', q(b)],
      ['Semidistància focal c', q(c)], ['Excentricitat e = c/a', fmt(e, 3)],
      ['Periapsi rₚ = a(1 − e)', q(a * (1 - e))], ['Apoapsi rₐ = a(1 + e)', q(a * (1 + e))],
      ['b/a', fmt(bn, 4)], ['rₐ/rₚ', e < 1 ? fmt((1 + e) / (1 - e), 3) : '—'],
      ['r₁ (P fins a F₁)', q(r1)], ['r₂ (P fins a F₂)', q(r2)],
      ['r₁ + r₂', `${q(r1 + r2)} = 2a`, true]
    ]);
    $('elEVal').textContent = fmt(e, 3);
    $('elThetaVal').textContent = `${ex.theta}°`;
    const p = EL_PRESETS.find(x => x.id === ex.preset);
    $('elCaption').textContent = p
      ? `${p.text} F₁: focus ocupat; F₂: focus buit.`
      : `El·lipse personalitzada (a = ${q(a)}, e = ${fmt(e, 3)}). F₁: focus ocupat; F₂: focus buit.`;
  }

  function iniciaElipse() {
    botonsPreset($('elPresets'), EL_PRESETS, p => {
      Object.assign(ex, { a: p.a, e: p.e, u: p.u, cos: p.cos, preset: p.id });
      $('elE').value = p.e;
      marcaPreset($('elPresets'), p.id);
      dibuixaElipse();
    });
    $('elE').addEventListener('input', ev => {
      ex.e = Number(ev.target.value);
      const p = EL_PRESETS.find(x => x.id === ex.preset);
      if (p && Math.abs(p.e - ex.e) > 1e-9) { ex.preset = null; marcaPreset($('elPresets'), null); }
      dibuixaElipse();
    });
    $('elTheta').addEventListener('input', ev => { ex.theta = Number(ev.target.value); dibuixaElipse(); });
    marcaPreset($('elPresets'), 'ex');
    dibuixaElipse();
  }

  /* ---------- 2 · Satèl·lit en òrbita el·líptica ---------- */
  const ORB_PRESETS = [
    { id: 'iss', nom: 'Circular (ISS)', hp: 420, ha: 420 },
    { id: 'gto', nom: 'Transferència GTO', hp: 250, ha: 35786 },
    { id: 'molniya', nom: 'Molniya', hp: 600, ha: 39700 },
    { id: 'excentrica', nom: 'Molt excèntrica', hp: 300, ha: 100000 }
  ];
  const ORBIT_SEGONS = 12;

  const orb = { hp: 600e3, ha: 39700e3, t: 0, playing: false, visible: true, last: 0, raf: 0, maxDE: 0, maxDL: 0 };

  function geometriaOrb() {
    const rp = R_TERRA + orb.hp;
    const ra = R_TERRA + Math.max(orb.ha, orb.hp);
    orb.rp = rp; orb.ra = ra;
    orb.a = (rp + ra) / 2;
    orb.e = (ra - rp) / (ra + rp);
    orb.T = 2 * Math.PI * Math.sqrt(orb.a ** 3 / MU_TERRA);
    orb.E0 = -MU_TERRA / (2 * orb.a);
    orb.L0 = Math.sqrt(MU_TERRA * orb.a * (1 - orb.e ** 2));
    orb.maxDE = 0; orb.maxDL = 0;
  }

  function construeixOrbSvg() {
    const svg = $('orbSvg');
    svg.querySelectorAll(':scope > :not(title):not(desc)').forEach(n => n.remove());
    markers(svg);
    const { a, e } = orb;
    const b = a * Math.sqrt(1 - e * e), c = a * e;
    const s = Math.min(410 / (2 * a), 330 / (2 * b));
    orb.s = s;
    orb.fx = 260 + c * s;
    orb.fy = 190;
    const areas = el('g', { id: 'orbAreasG' }, svg);
    const N = 12;
    for (let k = 0; k < N; k++) {
      const pts = [[orb.fx, orb.fy]];
      for (let j = 0; j <= 24; j++) {
        const M = 2 * Math.PI * (k + j / 24) / N;
        const p = kepler(a, e, M, MU_TERRA);
        pts.push([orb.fx + p.x * s, orb.fy - p.y * s]);
      }
      el('polygon', { points: pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' '),
        class: k % 2 ? 'sv-area-b' : 'sv-area-a' }, areas);
    }
    areas.style.display = $('orbAreas').checked ? '' : 'none';
    el('ellipse', { cx: orb.fx - c * s, cy: orb.fy, rx: a * s, ry: b * s, class: 'sv-elipse' }, svg);
    el('circle', { cx: orb.fx, cy: orb.fy, r: Math.max(2, R_TERRA * s), class: 'sv-terra' }, svg);
    if (e > 0.01) {
      el('text', { x: orb.fx + orb.rp * s + 6, y: orb.fy + 16, class: 'sv-text petit', text: 'perigeu' }, svg);
      el('text', { x: orb.fx - orb.ra * s - 6, y: orb.fy + 16, class: 'sv-text petit', 'text-anchor': 'end', text: 'apogeu' }, svg);
    }
    orb.radi = el('line', { class: 'sv-r1', 'stroke-width': 1.2 }, svg);
    orb.vel = el('line', { class: 'sv-vel', 'marker-end': `url(#orbSvg-m-vel)` }, svg);
    orb.nau = el('circle', { r: 6, class: 'sv-nau' }, svg);
    el('text', { x: 12, y: 372, class: 'sv-text petit', text: 'Distàncies a escala. Cada sector acolorit s’escombra en 1/12 del període.' }, svg);

    const bar = $('orbBarres');
    bar.querySelectorAll(':scope > :not(title)').forEach(n => n.remove());
    orb.barres = ['c', 'p', 'm'].map((k, i) => el('rect', { x: 28 + i * 70, width: 46, class: `sv-barra-${k}` }, bar));
    el('line', { x1: 10, y1: 90, x2: 230, y2: 90, class: 'sv-zero' }, bar);
    el('text', { x: 222, y: 84, class: 'sv-text petit', 'text-anchor': 'end', text: '0' }, bar);
    ['Ec', 'Ep', 'Em'].forEach((t, i) => el('text', { x: 51 + i * 70, y: 196, class: 'sv-text mig', text: t }, bar));

    valors($('orbFixos'), [
      ['Semieix major a', `${fmt(orb.a / 1e3, 4)} km`],
      ['Excentricitat e', fmt(orb.e, 3)],
      ['Període T', fmtTemps(orb.T)],
      ['Em/m = −GM/2a', `${fmt(orb.E0 / 1e6, 4)} MJ/kg`],
      ['vₚ (perigeu)', `${fmt(Math.sqrt(MU_TERRA * (2 / orb.rp - 1 / a)) / 1e3, 4)} km/s`],
      ['vₐ (apogeu)', `${fmt(Math.sqrt(MU_TERRA * (2 / orb.ra - 1 / a)) / 1e3, 4)} km/s`],
      ['rₚ·vₚ', `${fmtSci(orb.rp * Math.sqrt(MU_TERRA * (2 / orb.rp - 1 / a)), 4)} m²/s`],
      ['rₐ·vₐ', `${fmtSci(orb.ra * Math.sqrt(MU_TERRA * (2 / orb.ra - 1 / a)), 4)} m²/s`]
    ]);
    $('orbHpVal').textContent = `${fmt(orb.hp / 1e3, 4)} km`;
    $('orbHaVal').textContent = `${fmt(Math.max(orb.ha, orb.hp) / 1e3, 4)} km`;
  }

  function dibuixaOrbEstat() {
    const p = kepler(orb.a, orb.e, 2 * Math.PI * ((orb.t / orb.T) % 1), MU_TERRA);
    const v = Math.hypot(p.vx, p.vy);
    const sx = orb.fx + p.x * orb.s, sy = orb.fy - p.y * orb.s;
    const vmax = Math.sqrt(MU_TERRA * (2 / orb.rp - 1 / orb.a));
    const k = 60 / vmax;
    orb.nau.setAttribute('cx', sx); orb.nau.setAttribute('cy', sy);
    orb.radi.setAttribute('x1', orb.fx); orb.radi.setAttribute('y1', orb.fy);
    orb.radi.setAttribute('x2', sx); orb.radi.setAttribute('y2', sy);
    orb.vel.setAttribute('x1', sx); orb.vel.setAttribute('y1', sy);
    orb.vel.setAttribute('x2', sx + p.vx * k); orb.vel.setAttribute('y2', sy - p.vy * k);

    const ec = v * v / 2, ep = -MU_TERRA / p.r, em = ec + ep;
    const L = p.x * p.vy - p.y * p.vx;
    orb.maxDE = Math.max(orb.maxDE, Math.abs(em / orb.E0 - 1));
    orb.maxDL = Math.max(orb.maxDL, Math.abs(L / orb.L0 - 1));

    const escala = 80 / (MU_TERRA / orb.rp);
    [ec, ep, em].forEach((val, i) => {
      const h = Math.abs(val) * escala;
      orb.barres[i].setAttribute('y', val >= 0 ? 90 - h : 90);
      orb.barres[i].setAttribute('height', h);
    });
    const desv = x => (x < 1e-15 ? '< 10⁻¹⁵' : fmtSci(x, 2));
    valors($('orbVius'), [
      ['Temps (real)', fmtTemps(orb.t)],
      ['Altura h', `${fmt((p.r - R_TERRA) / 1e3, 4)} km`],
      ['Velocitat v', `${fmt(v / 1e3, 4)} km/s`],
      ['Ec/m', `${fmt(ec / 1e6, 4)} MJ/kg`],
      ['Ep/m', `${fmt(ep / 1e6, 4)} MJ/kg`],
      ['Em/m', `${fmt(em / 1e6, 4)} MJ/kg`, true],
      ['L/m = |r × v|', `${fmtSci(L, 4)} m²/s`, true],
      ['Desviació relativa màx.', `Em: ${desv(orb.maxDE)} · L: ${desv(orb.maxDL)}`]
    ]);
  }

  function bucleOrb(ts) {
    if (!orb.playing || !orb.visible || document.hidden) { orb.raf = 0; return; }
    const dt = orb.last ? Math.min(0.1, (ts - orb.last) / 1000) : 0;
    orb.last = ts;
    orb.t += dt * orb.T / ORBIT_SEGONS;
    dibuixaOrbEstat();
    orb.raf = requestAnimationFrame(bucleOrb);
  }

  function arrencaOrb() {
    if (orb.playing && orb.visible && !document.hidden && !orb.raf) {
      orb.last = 0;
      orb.raf = requestAnimationFrame(bucleOrb);
    }
  }

  function setPlayOrb(on) {
    orb.playing = on;
    $('orbPlay').textContent = on ? '⏸ Pausa' : '▶ Reprodueix';
    arrencaOrb();
  }

  function aplicaOrb(conservaFase) {
    const fase = orb.T ? (orb.t / orb.T) % 1 : 0;
    geometriaOrb();
    orb.t = conservaFase ? fase * orb.T : 0;
    construeixOrbSvg();
    dibuixaOrbEstat();
  }

  function iniciaOrbita() {
    botonsPreset($('orbPresets'), ORB_PRESETS, p => {
      orb.hp = p.hp * 1e3; orb.ha = p.ha * 1e3;
      $('orbHp').value = p.hp; $('orbHa').value = p.ha;
      marcaPreset($('orbPresets'), p.id);
      aplicaOrb(false);
    });
    const manual = () => {
      orb.hp = Number($('orbHp').value) * 1e3;
      orb.ha = Number($('orbHa').value) * 1e3;
      marcaPreset($('orbPresets'), null);
      aplicaOrb(true);
    };
    $('orbHp').addEventListener('input', manual);
    $('orbHa').addEventListener('input', manual);
    $('orbPlay').addEventListener('click', () => setPlayOrb(!orb.playing));
    $('orbReset').addEventListener('click', () => { setPlayOrb(false); aplicaOrb(false); });
    $('orbAreas').addEventListener('change', ev => { $('orbAreasG').style.display = ev.target.checked ? '' : 'none'; });
    visible($('orbSvg'), v => { orb.visible = v; arrencaOrb(); });
    marcaPreset($('orbPresets'), 'molniya');
    aplicaOrb(false);
  }

  /* ---------- 3 · Transferència de Hohmann ---------- */
  const COSSOS = {
    terra: { mu: MU_TERRA, R: R_TERRA, nom: 'Terra', min: 200e3, max: 400000e3, alt: true },
    sol: { mu: MU_SOL, R: R_SOL, nom: 'Sol', min: 0.3 * UA, max: 10 * UA, alt: false }
  };
  const HOH_PRESETS = [
    { id: 'iss', nom: 'ISS: pujar 20 km', cos: 'terra', x1: 400e3, x2: 420e3 },
    { id: 'geo', nom: 'LEO → GEO', cos: 'terra', x1: 300e3, x2: 35786e3 },
    { id: 'lluna', nom: 'Fins a la distància de la Lluna', cos: 'terra', x1: 300e3, x2: 384400e3 - R_TERRA },
    { id: 'mart', nom: 'Terra → Mart', cos: 'sol', x1: UA, x2: 1.524 * UA },
    { id: 'venus', nom: 'Terra → Venus', cos: 'sol', x1: UA, x2: 0.723 * UA }
  ];
  const FASE_SEGONS = 6;

  const hoh = { cos: 'terra', x1: 300e3, x2: 35786e3, fase: 0, prog: 0, visible: true, raf: 0, last: 0 };

  const sliderAx = v => { const c = COSSOS[hoh.cos]; return c.min * (c.max / c.min) ** (v / 1000); };
  const xAslider = x => { const c = COSSOS[hoh.cos]; return Math.round(1000 * Math.log(x / c.min) / Math.log(c.max / c.min)); };
  const xAr = x => (COSSOS[hoh.cos].alt ? COSSOS[hoh.cos].R + x : x);

  function fmtDist(x) {
    if (COSSOS[hoh.cos].alt) return `h = ${fmt(x / 1e3, 4)} km · r = ${fmt((R_TERRA + x) / 1e3, 4)} km`;
    return `r = ${fmt(x / UA, 4)} UA`;
  }
  const fmtR = r => (COSSOS[hoh.cos].alt ? `${fmt(r / 1e3, 4)} km` : `${fmt(r / UA, 4)} UA`);
  const fmtV = v => `${fmt(v / 1e3, 4)} km/s`;
  const fmtModDv = dv => (dv < 100 ? `${fmt(dv, 3)} m/s` : `${fmt(dv / 1e3, 4)} km/s`);
  function fmtDv(dv) {
    if (Math.abs(dv) < 1e-9) return '0 m/s';
    return `${dv > 0 ? '+' : '−'}${fmtModDv(Math.abs(dv))}${dv < 0 ? ' (frenada)' : ''}`;
  }

  function calculaHoh() {
    const { mu } = COSSOS[hoh.cos];
    const r1 = xAr(hoh.x1), r2 = xAr(hoh.x2);
    const at = (r1 + r2) / 2;
    const v1 = Math.sqrt(mu / r1), v2 = Math.sqrt(mu / r2);
    const vt1 = Math.sqrt(mu * (2 / r1 - 1 / at));
    const vt2 = vt1 * r1 / r2;
    Object.assign(hoh, {
      mu, r1, r2, at, v1, v2, vt1, vt2,
      et: Math.abs(r2 - r1) / (r1 + r2),
      dv1: vt1 - v1, dv2: v2 - vt2,
      tt: Math.PI * Math.sqrt(at ** 3 / mu),
      T1: 2 * Math.PI * Math.sqrt(r1 ** 3 / mu), T2: 2 * Math.PI * Math.sqrt(r2 ** 3 / mu),
      e1: -mu / (2 * r1), etr: -mu / (2 * at), e2: -mu / (2 * r2)
    });
  }

  function posicioHoh() {
    const { r1, r2, at, et, mu } = hoh;
    if (hoh.fase === 0) {
      const ang = 2 * Math.PI * hoh.prog;
      return { x: r1 * Math.cos(ang), y: r1 * Math.sin(ang), vx: -hoh.v1 * Math.sin(ang), vy: hoh.v1 * Math.cos(ang) };
    }
    if (hoh.fase === 1) return { x: r1, y: 0, vx: 0, vy: hoh.v1 };
    if (hoh.fase === 3) return { x: -r2, y: 0, vx: 0, vy: -hoh.vt2 };
    if (hoh.fase === 4) {
      const ang = Math.PI + 2 * Math.PI * hoh.prog;
      return { x: r2 * Math.cos(ang), y: r2 * Math.sin(ang), vx: -hoh.v2 * Math.sin(ang), vy: hoh.v2 * Math.cos(ang) };
    }
    const puja = r2 >= r1;
    const M = Math.PI * hoh.prog + (puja ? 0 : Math.PI);
    const p = kepler(at, et, M, mu);
    return puja ? p : { x: -p.x, y: -p.y, vx: -p.vx, vy: -p.vy };
  }

  function dibuixaHoh() {
    const svg = $('hohSvg');
    svg.querySelectorAll(':scope > :not(title):not(desc)').forEach(n => n.remove());
    markers(svg);
    const { r1, r2, at } = hoh;
    const cx = 260, cy = 210;
    const s = 185 / Math.max(r1, r2);
    const X = x => cx + x * s, Y = y => cy - y * s;
    const f = hoh.fase;

    el('circle', { cx, cy, r: r1 * s, class: `sv-orb-ini${f >= 2 ? ' sv-tenue' : ''}` }, svg);
    el('circle', { cx, cy, r: r2 * s, class: `sv-orb-fin${f < 4 ? ' sv-guio' : ''}` }, svg);
    const bt = Math.sqrt(r1 * r2), xc = (r1 - r2) / 2;
    const meitat = (u0, u1) => {
      let d = '';
      for (let j = 0; j <= 80; j++) {
        const u = u0 + (u1 - u0) * j / 80;
        d += `${j ? 'L' : 'M'}${X(xc + at * Math.cos(u)).toFixed(1)} ${Y(bt * Math.sin(u)).toFixed(1)}`;
      }
      return d;
    };
    el('path', { d: meitat(0, Math.PI), class: `sv-orb-trans${f >= 1 ? '' : ' sv-guio sv-tenue'}` }, svg);
    el('path', { d: meitat(Math.PI, 2 * Math.PI), class: 'sv-orb-trans sv-guio sv-tenue' }, svg);

    const c = COSSOS[hoh.cos];
    el('circle', { cx, cy, r: Math.max(3, c.R * s), class: hoh.cos === 'sol' ? 'sv-cos' : 'sv-terra' }, svg);
    el('text', { x: X(r1) + 6, y: cy + 16, class: 'sv-text r1', text: 'r₁' }, svg);
    el('text', { x: X(-r2) - 6, y: cy + 16, class: 'sv-text r2', 'text-anchor': 'end', text: 'r₂' }, svg);

    const p = posicioHoh();
    const sx = X(p.x), sy = Y(p.y);
    const k = 75 / Math.max(hoh.v1, hoh.v2, hoh.vt1, hoh.vt2);
    const g = el('g', {}, svg);
    if (f === 1 || f === 3) {
      const vAbans = f === 1 ? hoh.v1 : hoh.vt2;
      const vDespres = f === 1 ? hoh.vt1 : hoh.v2;
      const dir = f === 1 ? 1 : -1;
      fletxa(g, sx, sy, sx, sy - dir * vAbans * k, 'sv-vel-abans', 'm-abans', 'hohSvg');
      fletxa(g, sx - 9 * dir, sy, sx - 9 * dir, sy - dir * vDespres * k, 'sv-vel', 'm-vel', 'hohSvg');
      fletxa(g, sx + 9 * dir, sy - dir * vAbans * k, sx + 9 * dir, sy - dir * vDespres * k, 'sv-dv', 'm-dv', 'hohSvg');
      const ytxt = sy - dir * Math.max(vAbans, vDespres) * k - dir * 8;
      el('text', { x: sx + 14 * dir, y: ytxt + (dir > 0 ? 0 : 10), class: 'sv-text c', 'text-anchor': dir > 0 ? 'start' : 'end',
        text: f === 1 ? 'Δv₁' : 'Δv₂' }, g);
    } else {
      fletxa(g, sx, sy, sx + p.vx * k, sy - p.vy * k, 'sv-vel', 'm-vel', 'hohSvg');
    }
    el('circle', { cx: sx, cy: sy, r: 6, class: 'sv-nau' }, svg);
    el('text', { x: 12, y: 410, class: 'sv-text petit',
      text: 'Distàncies a escala. Gris: velocitat abans de l’impuls; blau: després; vermell: Δv.' }, svg);
  }

  function missatgeHoh() {
    const puja = hoh.r2 >= hoh.r1;
    const acc = d => (d >= 0 ? 'cap endavant' : 'cap enrere (frenant)');
    const M = [
      `Comencem en una òrbita circular de radi ${fmtR(hoh.r1)}, a ${fmtV(hoh.v1)}. Període: ${fmtTemps(hoh.T1)}.`,
      `Encenem el motor ${acc(hoh.dv1)}: Δv₁ = ${fmtDv(hoh.dv1)}. La velocitat passa de ${fmtV(hoh.v1)} a ${fmtV(hoh.vt1)}. Aquest punt passa a ser ${puja ? 'la periapsi' : 'l’apoapsi'} d’una el·lipse que arriba fins a r₂.`,
      `Motor apagat: la nau va per mitja el·lipse i només hi actua la gravetat. ${puja ? 'S’allunya i es frena' : 'S’apropa i s’accelera'}, de ${fmtV(hoh.vt1)} a ${fmtV(hoh.vt2)}, conservant Em i L.`,
      `A r₂ anem a ${fmtV(hoh.vt2)}, però l’òrbita circular en demana ${fmtV(hoh.v2)}. Segon impuls ${acc(hoh.dv2)}: Δv₂ = ${fmtDv(hoh.dv2)}.`,
      puja
        ? `Hem accelerat dues vegades (|Δv| total = ${fmtModDv(Math.abs(hoh.dv1) + Math.abs(hoh.dv2))}) i ara anem més lents que al principi: ${fmtV(hoh.v2)} < ${fmtV(hoh.v1)}. L’energia mecànica ha passat de ${fmt(hoh.e1 / 1e6, 3)} a ${fmt(hoh.e2 / 1e6, 3)} MJ/kg.`
        : `Hem frenat dues vegades (|Δv| total = ${fmtModDv(Math.abs(hoh.dv1) + Math.abs(hoh.dv2))}) i ara anem més ràpid que al principi: ${fmtV(hoh.v2)} > ${fmtV(hoh.v1)}. L’energia mecànica ha baixat de ${fmt(hoh.e1 / 1e6, 3)} a ${fmt(hoh.e2 / 1e6, 3)} MJ/kg.`
    ];
    if (hoh.fase === 2 && hoh.prog >= 1) {
      $('hohMissatge').textContent = `Arribada a r₂ al cap de ${fmtTemps(hoh.tt)}, a ${fmtV(hoh.vt2)}. Pitja «Següent pas» per fer el segon impuls.`;
    } else {
      $('hohMissatge').textContent = M[hoh.fase];
    }
    $('hohFases').querySelectorAll('li').forEach((li, i) => {
      li.className = i === hoh.fase ? 'actual' : (i < hoh.fase ? 'fet' : '');
      if (i === hoh.fase) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    $('hohPrev').disabled = hoh.fase === 0;
    $('hohNext').disabled = hoh.fase === 4;
  }

  const FILES_ACTIVES = [
    ['v1', 'e1'], ['v1', 'vt1', 'dv1'], ['vt1', 'vt2', 'tt', 'etr'], ['vt2', 'v2', 'dv2'], ['v2', 'e2', 'tot']
  ];
  const PASSOS_ACTIUS = [[0, 1], [2], [4], [3], []];

  function taulaHoh() {
    const files = [
      ['v1', 'Velocitat circular inicial, v₁', fmtV(hoh.v1)],
      ['vt1', 'Just després del 1r impuls, vₜ₁', fmtV(hoh.vt1)],
      ['dv1', 'Primer impuls, Δv₁', fmtDv(hoh.dv1), 'dv'],
      ['vt2', 'En arribar a r₂, vₜ₂', fmtV(hoh.vt2)],
      ['v2', 'Velocitat circular final, v₂', fmtV(hoh.v2)],
      ['dv2', 'Segon impuls, Δv₂', fmtDv(hoh.dv2), 'dv'],
      ['tot', 'Δv total, |Δv₁| + |Δv₂|', fmtModDv(Math.abs(hoh.dv1) + Math.abs(hoh.dv2)), 'total'],
      ['tt', 'Temps de transferència (T/2)', fmtTemps(hoh.tt)],
      ['e1', 'Em/m a l’òrbita inicial', `${fmt(hoh.e1 / 1e6, 4)} MJ/kg`],
      ['etr', 'Em/m a la transferència', `${fmt(hoh.etr / 1e6, 4)} MJ/kg`],
      ['e2', 'Em/m a l’òrbita final', `${fmt(hoh.e2 / 1e6, 4)} MJ/kg`]
    ];
    const actives = FILES_ACTIVES[hoh.fase];
    $('hohTaula').innerHTML = '<tbody>' + files.map(([id, nom, val, cls]) =>
      `<tr class="${[cls, actives.includes(id) ? 'actiu' : ''].join(' ').trim()}"><td>${nom}</td><td>${val}</td></tr>`).join('') + '</tbody>';
  }

  function passosHoh() {
    const km = x => numTex(x / 1e3);
    const kms = x => numTex(x / 1e3, 4);
    const gm = numTex(hoh.mu / 1e9);
    const P = [
      [`a_\\mathrm{t}=\\dfrac{r_1+r_2}{2}=\\dfrac{${km(hoh.r1)}+${km(hoh.r2)}}{2}\\ \\mathrm{km}=${km(hoh.at)}\\ \\mathrm{km}`],
      [`v_1=\\sqrt{\\dfrac{GM}{r_1}}=\\sqrt{\\dfrac{${gm}\\ \\mathrm{km^3/s^2}}{${km(hoh.r1)}\\ \\mathrm{km}}}=${kms(hoh.v1)}\\ \\mathrm{km/s}`],
      [`v_\\mathrm{t1}=\\sqrt{GM\\left(\\dfrac{2}{r_1}-\\dfrac{1}{a_\\mathrm{t}}\\right)}=${kms(hoh.vt1)}\\ \\mathrm{km/s}`,
        `\\Delta v_1=v_\\mathrm{t1}-v_1=${numTex(hoh.dv1 / 1e3, 4)}\\ \\mathrm{km/s}`],
      [`v_\\mathrm{t2}=v_\\mathrm{t1}\\dfrac{r_1}{r_2}=${kms(hoh.vt2)}\\ \\mathrm{km/s}`,
        `v_2=\\sqrt{\\dfrac{GM}{r_2}}=${kms(hoh.v2)}\\ \\mathrm{km/s}`,
        `\\Delta v_2=v_2-v_\\mathrm{t2}=${numTex(hoh.dv2 / 1e3, 4)}\\ \\mathrm{km/s}`],
      [`t=\\dfrac{T_\\mathrm{t}}{2}=\\pi\\sqrt{\\dfrac{a_\\mathrm{t}^3}{GM}}=${texNum(fmtTemps(hoh.tt)).replace(/ (\S+)$/, '\\ \\mathrm{$1}')}`]
    ];
    const act = PASSOS_ACTIUS[hoh.fase];
    $('hohPassos').innerHTML = P.map((linies, i) => `<div class="formula-pas${act.includes(i) ? ' actiu' : ''}">${linies.map(l => `<div>${tex(l)}</div>`).join('')}</div>`).join('') +
      '<p class="hint">El pas 4 fa servir la conservació del moment angular: a la periapsi i a l’apoapsi, <i>r·v</i> és el mateix.</p>';
  }

  function actualitzaHohText() {
    $('hohR1Label').textContent = COSSOS[hoh.cos].alt ? 'Altura de l’òrbita inicial' : 'Radi de l’òrbita inicial';
    $('hohR2Label').textContent = COSSOS[hoh.cos].alt ? 'Altura de l’òrbita final' : 'Radi de l’òrbita final';
    $('hohR1Val').textContent = fmtDist(hoh.x1);
    $('hohR2Val').textContent = fmtDist(hoh.x2);
    $('hohRangDesc').textContent = COSSOS[hoh.cos].alt
      ? 'Escala logarítmica de 200 km a 400 000 km d’altura.'
      : 'Escala logarítmica de 0,3 a 10 UA (1 UA = distància Terra–Sol).';
    $('hohTemps').textContent = `Temps real: transferència ${fmtTemps(hoh.tt)}; període inicial ${fmtTemps(hoh.T1)}; període final ${fmtTemps(hoh.T2)}. A l’animació, cada fase dura uns ${FASE_SEGONS} s.`;
  }

  function refrescaHoh() {
    dibuixaHoh();
    missatgeHoh();
    taulaHoh();
    passosHoh();
  }

  function aplicaHoh() {
    calculaHoh();
    actualitzaHohText();
    refrescaHoh();
    arrencaHoh();
  }

  const animaFase = () => hoh.fase === 0 || hoh.fase === 4 || (hoh.fase === 2 && hoh.prog < 1);

  function bucleHoh(ts) {
    if (!animaFase() || !hoh.visible || document.hidden || reduceMotion) { hoh.raf = 0; return; }
    const dt = hoh.last ? Math.min(0.1, (ts - hoh.last) / 1000) : 0;
    hoh.last = ts;
    hoh.prog += dt / FASE_SEGONS;
    if (hoh.fase === 2) {
      if (hoh.prog >= 1) { hoh.prog = 1; refrescaHoh(); hoh.raf = 0; return; }
    } else {
      hoh.prog %= 1;
    }
    dibuixaHoh();
    hoh.raf = requestAnimationFrame(bucleHoh);
  }

  function arrencaHoh() {
    if (!hoh.raf && animaFase() && hoh.visible && !document.hidden && !reduceMotion) {
      hoh.last = 0;
      hoh.raf = requestAnimationFrame(bucleHoh);
    }
  }

  function canviaFase(f) {
    hoh.fase = Math.max(0, Math.min(4, f));
    hoh.prog = reduceMotion && hoh.fase === 2 ? 1 : 0;
    refrescaHoh();
    arrencaHoh();
  }

  function tornaFaseInicial() {
    if (hoh.raf) { cancelAnimationFrame(hoh.raf); hoh.raf = 0; }
    hoh.fase = 0;
    hoh.prog = 0;
  }

  function iniciaHohmann() {
    botonsPreset($('hohPresets'), HOH_PRESETS, p => {
      hoh.cos = p.cos; hoh.x1 = p.x1; hoh.x2 = p.x2;
      document.querySelector(`input[name="hohCos"][value="${p.cos}"]`).checked = true;
      $('hohR1').value = xAslider(p.x1);
      $('hohR2').value = xAslider(p.x2);
      marcaPreset($('hohPresets'), p.id);
      tornaFaseInicial();
      aplicaHoh();
    });
    document.querySelectorAll('input[name="hohCos"]').forEach(r => r.addEventListener('change', () => {
      const p = HOH_PRESETS.find(x => x.id === (r.value === 'sol' ? 'mart' : 'geo'));
      $('hohPresets').querySelector(`[data-id="${p.id}"]`).click();
    }));
    const manual = () => {
      hoh.x1 = sliderAx(Number($('hohR1').value));
      hoh.x2 = sliderAx(Number($('hohR2').value));
      marcaPreset($('hohPresets'), null);
      aplicaHoh();
    };
    $('hohR1').addEventListener('input', manual);
    $('hohR2').addEventListener('input', manual);
    $('hohNext').addEventListener('click', () => canviaFase(hoh.fase + 1));
    $('hohPrev').addEventListener('click', () => canviaFase(hoh.fase - 1));
    $('hohReset').addEventListener('click', () => { tornaFaseInicial(); aplicaHoh(); });
    visible($('hohSvg'), v => { hoh.visible = v; arrencaHoh(); });
    $('hohPresets').querySelector('[data-id="geo"]').click();
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { arrencaOrb(); arrencaHoh(); }
  });

  renderMath();
  iniciaElipse();
  iniciaOrbita();
  iniciaHohmann();
})();
