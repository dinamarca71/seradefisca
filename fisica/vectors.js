(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const GRAUS = 180 / Math.PI;
  const LIM = 10;
  const C = 230, S = 21;
  const COLORS = { v: '#1d4ed8', x: '#ea580c', y: '#059669', t: '#7c3aed', eix: '#64748b' };
  const ORDINAL = { 1: '1r', 2: '2n', 3: '3r', 4: '4t' };
  const RANG = { 1: [0, 90], 2: [90, 180], 3: [180, 270], 4: [270, 360] };
  const EIXOS = {
    'x+': { th: 0, nom: 'semieix +x', dir: 'cap a la dreta' },
    'y+': { th: 90, nom: 'semieix +y', dir: 'cap amunt' },
    'x-': { th: 180, nom: 'semieix −x', dir: 'cap a l’esquerra' },
    'y-': { th: 270, nom: 'semieix −y', dir: 'cap avall' }
  };
  const VX = '<i>v</i><sub>x</sub>', VY = '<i>v</i><sub>y</sub>';

  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const esQuad = q => typeof q === 'number' && q > 0;

  // ---------- Format ----------
  function exacte(x, dec) {
    const k = x * 10 ** dec;
    return Math.abs(k - Math.round(k)) < 1e-6;
  }
  function num(x, dec = 2) {
    const r = Number(x.toFixed(dec));
    if (r === 0) return '0';
    const txt = exacte(x, dec) ? String(r) : x.toFixed(dec);
    return txt.replace('.', ',').replace('-', '−');
  }
  const rel = (x, dec = 2) => (exacte(x, dec) ? '=' : '\\approx');
  const tn = (x, dec = 2) => num(x, dec).replace('−', '-').replace(',', '{,}');
  const par = x => (x < 0 ? `(${tn(x)})` : tn(x));
  const deg = x => `${tn(x, 1)}^\\circ`;
  const signe = x => (x > 0 ? '>' : x < 0 ? '<' : '=');

  function tex(s) {
    if (window.katex) return katex.renderToString(s, { throwOnError: false });
    const span = document.createElement('span');
    span.textContent = s;
    return span.innerHTML;
  }
  function renderMathEstatic() {
    document.querySelectorAll('[data-math]').forEach(n => { n.innerHTML = tex(n.dataset.math); });
  }

  // ---------- Model ----------
  function quadrant(vx, vy) {
    const zx = Math.abs(vx) < 1e-9, zy = Math.abs(vy) < 1e-9;
    if (zx && zy) return 0;
    if (zy) return vx > 0 ? 'x+' : 'x-';
    if (zx) return vy > 0 ? 'y+' : 'y-';
    if (vx > 0) return vy > 0 ? 1 : 4;
    return vy > 0 ? 2 : 3;
  }

  function desComponents(vx, vy) {
    const q = quadrant(vx, vy);
    let th = Math.atan2(vy, vx) * GRAUS;
    if (th < 0) th += 360;
    if (typeof q === 'string') th = EIXOS[q].th;
    if (q === 0) th = 0;
    const alpha = esQuad(q) ? Math.atan(Math.abs(vy) / Math.abs(vx)) * GRAUS : null;
    return { vx, vy, m: Math.hypot(vx, vy), th, q, alpha };
  }

  function desPolar(m, th) {
    th = ((th % 360) + 360) % 360;
    let q;
    if (m < 1e-9) q = 0;
    else {
      const k = th / 90;
      q = Math.abs(k - Math.round(k)) < 1e-9 ? ['x+', 'y+', 'x-', 'y-'][Math.round(k) % 4] : Math.floor(k) + 1;
    }
    let vx = m * Math.cos(th / GRAUS), vy = m * Math.sin(th / GRAUS);
    if (typeof q === 'string') {
      const e = EIXOS[q].th / GRAUS;
      vx = Math.round(Math.cos(e)) * m;
      vy = Math.round(Math.sin(e)) * m;
    }
    const alpha = esQuad(q) ? [null, th, 180 - th, th - 180, 360 - th][q] : null;
    return { vx, vy, m, th, q, alpha };
  }

  // ---------- Dibuix ----------
  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'text') n.textContent = v;
      else n.setAttribute(k, v);
    }
    if (parent) parent.appendChild(n);
    return n;
  }
  const X = x => C + x * S;
  const Y = y => C - y * S;

  function textSub(parent, x, y, cls, base, sub, resta, anchor = 'middle') {
    const t = el('text', { x, y, class: `et ${cls}`, 'text-anchor': anchor }, parent);
    el('tspan', { text: base, 'font-style': 'italic' }, t);
    el('tspan', { text: sub, dy: 4, 'font-size': 10 }, t);
    el('tspan', { text: resta, dy: -4 }, t);
    return t;
  }

  function iniciaPla(svg) {
    const id = svg.id;
    const defs = el('defs', {}, svg);
    for (const [k, c] of Object.entries(COLORS)) {
      const mida = k === 't' ? 9 : 12;
      const mk = el('marker', {
        id: `${id}-m-${k}`, viewBox: '0 0 10 10', refX: 9, refY: 5,
        markerWidth: mida, markerHeight: mida, markerUnits: 'userSpaceOnUse', orient: 'auto'
      }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', fill: c }, mk);
    }

    const quads = [[X(0), Y(LIM)], [X(-LIM), Y(LIM)], [X(-LIM), Y(0)], [X(0), Y(0)]]
      .map(([x, y]) => el('rect', { x, y, width: LIM * S, height: LIM * S, class: 'quad' }, svg));

    for (let i = -LIM; i <= LIM; i++) {
      if (i === 0) continue;
      el('line', { x1: X(i), y1: Y(LIM), x2: X(i), y2: Y(-LIM), class: 'graella' }, svg);
      el('line', { x1: X(-LIM), y1: Y(i), x2: X(LIM), y2: Y(i), class: 'graella' }, svg);
      if (i % 2 === 0 && Math.abs(i) < LIM) {
        el('text', { x: X(i), y: C + 13, class: 'tick', 'text-anchor': 'middle', text: num(i) }, svg);
        el('text', { x: C - 5, y: Y(i) + 3, class: 'tick', 'text-anchor': 'end', text: num(i) }, svg);
      }
    }
    el('line', { x1: 8, y1: C, x2: 452, y2: C, class: 'eix', 'marker-end': `url(#${id}-m-eix)` }, svg);
    el('line', { x1: C, y1: 452, x2: C, y2: 8, class: 'eix', 'marker-end': `url(#${id}-m-eix)` }, svg);
    el('text', { x: 448, y: C - 8, class: 'eix-et', 'text-anchor': 'end', text: 'x' }, svg);
    el('text', { x: C - 8, y: 18, class: 'eix-et', 'text-anchor': 'end', text: 'y' }, svg);
    el('text', { x: 450, y: C + 16, class: 'grau-et', 'text-anchor': 'end', text: '0°' }, svg);
    el('text', { x: C + 7, y: 16, class: 'grau-et', text: '90°' }, svg);
    el('text', { x: 10, y: C - 7, class: 'grau-et', text: '180°' }, svg);
    el('text', { x: C + 7, y: 452, class: 'grau-et', text: '270°' }, svg);

    const quadEt = [[X(5), Y(9.3)], [X(-5), Y(9.3)], [X(-5), Y(-9.7)], [X(5), Y(-9.7)]]
      .map(([x, y], i) => el('text', { x, y, class: 'quad-et', 'text-anchor': 'middle', text: `${ORDINAL[i + 1]} quadrant` }, svg));

    svg._quads = quads;
    svg._quadEt = quadEt;
    svg._dyn = el('g', {}, svg);
  }

  function fletxa(g, x1, y1, x2, y2, cls, mk) {
    const attrs = { x1, y1, x2, y2, class: cls };
    if (Math.hypot(x2 - x1, y2 - y1) > 10) attrs['marker-end'] = `url(#${g.ownerSVGElement.id}-m-${mk})`;
    return el('line', attrs, g);
  }

  function camiArc(r, a0, a1, tancat) {
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 3));
    let d = tancat ? `M${C} ${C} ` : '';
    for (let i = 0; i <= n; i++) {
      const a = (a0 + (a1 - a0) * i / n) / GRAUS;
      d += `${i || tancat ? 'L' : 'M'}${(C + r * Math.cos(a)).toFixed(1)} ${(C - r * Math.sin(a)).toFixed(1)} `;
    }
    return tancat ? d + 'Z' : d;
  }

  function etiquetaPolar(g, r, a, cls, txt) {
    const rad = a / GRAUS;
    el('text', {
      x: (C + r * Math.cos(rad)).toFixed(1), y: (C - r * Math.sin(rad) + 4).toFixed(1),
      class: `et ${cls}`, 'text-anchor': 'middle', text: txt
    }, g);
  }

  function dibuixa(svg, d, o) {
    const g = svg._dyn;
    g.textContent = '';
    svg._quads.forEach((r, i) => r.classList.toggle('actiu', d.q === i + 1));
    svg._quadEt.forEach((t, i) => t.classList.toggle('actiu', d.q === i + 1));

    if (o.cercle && d.m > 0) el('circle', { cx: C, cy: C, r: d.m * S, class: 'cercle-m' }, g);

    const px = X(d.vx), py = Y(d.vy);
    if (svg._nansa) {
      svg._nansa.setAttribute('cx', px);
      svg._nansa.setAttribute('cy', py);
    }
    if (d.q === 0) {
      el('circle', { cx: C, cy: C, r: 4, class: 'origen' }, g);
      if (o.etiquetes) el('text', { x: C + 10, y: C - 10, class: 'et et-nul', text: 'vector nul' }, g);
      return;
    }

    const quad = esQuad(d.q);
    if (o.triangle && quad) {
      el('polygon', { points: `${C},${C} ${px},${C} ${px},${py}`, class: 'triangle' }, g);
      const dx = -Math.sign(d.vx) * 9, dy = Math.sign(d.vy) * 9;
      el('polyline', { points: `${px + dx},${C} ${px + dx},${C - dy} ${px},${C - dy}`, class: 'angle-recte' }, g);
      fletxa(g, C, C, px, C, 'comp-x', 'x');
      fletxa(g, px, C, px, py, 'comp-y', 'y');
    }

    if (o.arcs) {
      if (d.th > 0.5) el('path', { d: camiArc(54, 0, d.th), class: 'arc-t', 'marker-end': `url(#${svg.id}-m-t)` }, g);
      if (quad) {
        const base = d.vx > 0 ? 0 : 180;
        const fi = d.q === 4 ? d.th - 360 : d.th;
        el('path', { d: camiArc(30, base, fi, true), class: 'arc-a' }, g);
      }
    }

    fletxa(g, C, C, px, py, 'vector', 'v');

    if (o.etiquetes) {
      if (o.triangle && quad) {
        textSub(g, (C + px) / 2, d.vy > 0 ? C + 18 : C - 9, 'et-x', 'v', 'x', ` = ${num(d.vx)}`);
        const sx = Math.sign(d.vx);
        textSub(g, px + sx * 8, (C + py) / 2 + 4, 'et-y', 'v', 'y', ` = ${num(d.vy)}`, sx > 0 ? 'start' : 'end');
      }
      const len = Math.hypot(px - C, py - C);
      el('text', {
        x: (px + (px - C) / len * 16).toFixed(1), y: (py + (py - C) / len * 16 + 6).toFixed(1),
        class: 'et et-v', 'text-anchor': 'middle', text: 'v⃗'
      }, g);
      if (o.arcs) {
        if (d.q === 1) etiquetaPolar(g, 42, d.th / 2, 'et-t', 'θ = α');
        else {
          if (d.th > 0.5) etiquetaPolar(g, 66, d.th / 2, 'et-t', 'θ');
          if (quad) {
            const base = d.vx > 0 ? 0 : 180;
            const fi = d.q === 4 ? d.th - 360 : d.th;
            etiquetaPolar(g, 46, (base + fi) / 2, 'et-a', 'α');
          }
        }
      }
    }
  }

  function descripcio(d) {
    if (d.q === 0) return 'Vector nul: mòdul zero i sense angle.';
    const lloc = esQuad(d.q) ? `${ORDINAL[d.q]} quadrant` : `sobre el ${EIXOS[d.q].nom}`;
    return `Vector de components (${num(d.vx)}; ${num(d.vy)}), ${lloc}. Mòdul ${num(d.m)} i angle ${num(d.th, 1)} graus des del semieix +x.` +
      (esQuad(d.q) ? ` Angle del triangle de suport α = ${num(d.alpha, 1)} graus.` : '');
  }

  // ---------- Pas a pas ----------
  const THETA_TEX = {
    1: d => `\\theta=\\alpha\\ ${rel(d.th, 1)}\\ ${deg(d.th)}`,
    2: d => `\\theta=180^\\circ-\\alpha=180^\\circ-${deg(d.alpha)}\\ ${rel(d.th, 1)}\\ ${deg(d.th)}`,
    3: d => `\\theta=180^\\circ+\\alpha=180^\\circ+${deg(d.alpha)}\\ ${rel(d.th, 1)}\\ ${deg(d.th)}`,
    4: d => `\\theta=360^\\circ-\\alpha=360^\\circ-${deg(d.alpha)}\\ ${rel(d.th, 1)}\\ ${deg(d.th)}`
  };
  const THETA_TEXT = {
    1: 'Al 1r quadrant el triangle comença just a l’eix +x: θ i α coincideixen.',
    2: 'Girant des de +x, arribaríem a −x després de 180°. El vector queda α abans d’arribar-hi.',
    3: 'Girant des de +x, passem per −x (180°) i encara hem de girar α més.',
    4: 'Una volta sencera són 360°. Al vector li falta α per completar-la.'
  };
  const ALPHA_TEX = {
    1: d => `\\alpha=\\theta=${deg(d.th)}`,
    2: d => `\\alpha=180^\\circ-\\theta=180^\\circ-${deg(d.th)}\\ ${rel(d.alpha, 1)}\\ ${deg(d.alpha)}`,
    3: d => `\\alpha=\\theta-180^\\circ=${deg(d.th)}-180^\\circ\\ ${rel(d.alpha, 1)}\\ ${deg(d.alpha)}`,
    4: d => `\\alpha=360^\\circ-\\theta=360^\\circ-${deg(d.th)}\\ ${rel(d.alpha, 1)}\\ ${deg(d.alpha)}`
  };
  const ALPHA_TEXT = {
    1: 'Al 1r quadrant, l’angle del triangle és el mateix θ.',
    2: 'Del vector fins al semieix −x (180°) hi falta α.',
    3: 'El vector ha passat el semieix −x (180°) en α.',
    4: 'Del vector fins a completar la volta (360°) hi falta α.'
  };
  const ANGLE_EIX_TEXT = {
    0: 'És el mateix semieix +x: no hi ha cap gir.',
    90: 'Un quart de volta en sentit antihorari.',
    180: 'Mitja volta.',
    270: 'Tres quarts de volta. (També és un quart de volta en sentit horari, però l’expressem entre 0° i 360°.)'
  };
  const direccio = d => `${d.vx > 0 ? 'cap a la dreta' : 'cap a l’esquerra'} i ${d.vy > 0 ? 'cap amunt' : 'cap avall'}`;

  function pasosComp(d) {
    const P = [];
    const sum = d.vx * d.vx + d.vy * d.vy;
    P.push({
      et: 'Mòdul (Pitàgores)',
      tex: [`|\\vec v|=\\sqrt{v_x^2+v_y^2}=\\sqrt{${par(d.vx)}^2+${par(d.vy)}^2}=\\sqrt{${tn(sum)}}\\ ${rel(d.m)}\\ ${tn(d.m)}`],
      text: 'Els components són els catets d’un triangle rectangle i el vector n’és la hipotenusa. En elevar al quadrat, els signes desapareixen: el mòdul sempre és positiu.'
    });
    if (d.q === 0) {
      P.push({ et: 'Angle', tex: [], text: 'És el vector nul: no apunta enlloc i, per tant, no té angle.' });
      return P;
    }
    if (!esQuad(d.q)) {
      const e = EIXOS[d.q];
      P.push({
        et: 'Direcció', tex: [`v_x ${signe(d.vx)} 0,\\qquad v_y ${signe(d.vy)} 0`],
        text: `Un dels components és zero: el vector és sobre el ${e.nom} (apunta ${e.dir}). No cal triangle.`
      });
      P.push({ et: 'Angle respecte de +x', tex: [`\\theta=${e.th}^\\circ`], text: ANGLE_EIX_TEXT[e.th], cls: 'pas-ok' });
      return P;
    }
    const q = d.q, ax = Math.abs(d.vx), ay = Math.abs(d.vy);
    P.push({
      et: 'Quadrant', tex: [`v_x ${signe(d.vx)} 0,\\qquad v_y ${signe(d.vy)} 0`],
      text: `El vector apunta ${direccio(d)}: és al <strong>${ORDINAL[q]} quadrant</strong>. Per tant, θ ha d’estar entre ${RANG[q][0]}° i ${RANG[q][1]}°.`
    });
    P.push({
      et: 'Angle del triangle, α',
      tex: [`\\tan\\alpha=\\dfrac{|v_y|}{|v_x|}=\\dfrac{${tn(ay)}}{${tn(ax)}}`,
        `\\alpha=\\arctan\\dfrac{${tn(ay)}}{${tn(ax)}}\\ ${rel(d.alpha, 1)}\\ ${deg(d.alpha)}`],
      text: 'Al triangle de suport (ombrejat) tots els costats són positius i α és agut: és la trigonometria que ja coneixeu. α és l’angle entre el vector i l’eix x' +
        (q === 1 ? '.' : ', però <strong>encara no</strong> és l’angle que busquem.')
    });
    P.push({ et: 'Angle respecte de +x, θ', tex: [THETA_TEX[q](d)], text: THETA_TEXT[q], cls: 'pas-ok' });
    if (q !== 1) {
      const calc = Math.atan(d.vy / d.vx) * GRAUS;
      const confon = { 2: 'el 2n quadrant del 4t', 3: 'el 3r quadrant del 1r', 4: 'el 4t quadrant del 2n' }[q];
      P.push({
        avis: true, et: 'Compte amb la calculadora',
        tex: [`\\arctan\\dfrac{v_y}{v_x}=\\arctan\\dfrac{${tn(d.vy)}}{${tn(d.vx)}}\\ ${rel(calc, 1)}\\ ${deg(calc)}`],
        text: q === 4
          ? 'Aquí la calculadora dona −α: és l’angle mesurat en sentit horari. Per expressar-lo entre 0° i 360° cal sumar-hi 360°, i surt el mateix que 360° − α.'
          : `✘ Aquest no és θ. La tecla tan⁻¹ només dona angles entre −90° i 90°: com que només veu el quocient v<sub>y</sub>/v<sub>x</sub>, no distingeix ${confon}. Per això mirem el quadrant i fem servir el triangle.`,
        cls: 'pas-avis'
      });
    }
    return P;
  }

  function pasosPolar(d) {
    const P = [];
    if (d.q === 0) {
      P.push({ et: 'Vector nul', tex: ['|\\vec v|=0\\ \\Rightarrow\\ \\vec v=(0;\\ 0)'], text: 'Amb mòdul zero, l’angle no importa: els dos components són zero.', cls: 'pas-ok' });
      return P;
    }
    if (!esQuad(d.q)) {
      const e = EIXOS[d.q];
      P.push({ et: 'Direcció', tex: [`\\theta=${e.th}^\\circ`], text: `L’angle és múltiple de 90°: el vector és sobre el ${e.nom} (apunta ${e.dir}). No cal triangle.` });
      P.push({
        et: 'Components', tex: [`\\vec v=(${tn(d.vx)};\\ ${tn(d.vy)})`],
        text: 'Tot el mòdul va en un sol component, amb el signe del semieix. L’altre component és zero.', cls: 'pas-ok'
      });
      return P;
    }
    const q = d.q, [a0, a1] = RANG[q], ax = Math.abs(d.vx), ay = Math.abs(d.vy);
    P.push({
      et: 'Quadrant', tex: [`${a0}^\\circ<\\theta=${deg(d.th)}<${a1}^\\circ`],
      text: `El vector és al <strong>${ORDINAL[q]} quadrant</strong>: apunta ${direccio(d)}. Per tant, ${VX} ${d.vx > 0 ? '&gt;' : '&lt;'} 0 i ${VY} ${d.vy > 0 ? '&gt;' : '&lt;'} 0.`
    });
    P.push({ et: 'Angle del triangle, α', tex: [ALPHA_TEX[q](d)], text: ALPHA_TEXT[q] + ' α és l’angle agut entre el vector i l’eix x.' });
    P.push({
      et: 'Costats del triangle',
      tex: [`|v_x|=|\\vec v|\\cos\\alpha=${tn(d.m)}\\cdot\\cos ${deg(d.alpha)}\\ ${rel(ax)}\\ ${tn(ax)}`,
        `|v_y|=|\\vec v|\\sin\\alpha=${tn(d.m)}\\cdot\\sin ${deg(d.alpha)}\\ ${rel(ay)}\\ ${tn(ay)}`],
      text: 'El catet sobre l’eix x és el contigu a α (cosinus) i el vertical n’és l’oposat (sinus). Al triangle, les longituds són positives.'
    });
    const iguals = exacte(d.vx, 2) && exacte(d.vy, 2) ? '=' : '\\approx';
    P.push({
      et: 'Signes segons el quadrant', tex: [`\\vec v\\ ${iguals}\\ (${tn(d.vx)};\\ ${tn(d.vy)})`],
      text: `Al ${ORDINAL[q]} quadrant, ${VX} és ${d.vx > 0 ? 'positiva' : 'negativa'} i ${VY} és ${d.vy > 0 ? 'positiva' : 'negativa'}.`, cls: 'pas-ok'
    });
    P.push({
      nota: true, et: 'Comprovació amb la calculadora (en graus)',
      tex: [`v_x=|\\vec v|\\cos\\theta=${tn(d.m)}\\cdot\\cos ${deg(d.th)}\\ ${rel(d.vx)}\\ ${tn(d.vx)}`,
        `v_y=|\\vec v|\\sin\\theta=${tn(d.m)}\\cdot\\sin ${deg(d.th)}\\ ${rel(d.vy)}\\ ${tn(d.vy)}`],
      text: 'Amb θ directament, la calculadora ja posa els signes. Ho veureu a la trigonometria de batxillerat; de moment, us serveix per comprovar el resultat.',
      cls: 'pas-nota'
    });
    return P;
  }

  function pintaPasos(cont, d, mode) {
    const llista = mode === 'comp' ? pasosComp(d) : pasosPolar(d);
    let n = 0;
    cont.innerHTML = '<ol class="llista-pasos">' + llista.map(p => {
      const et = p.avis || p.nota ? p.et : `Pas ${++n} · ${p.et}`;
      const formules = p.tex.length ? `<div class="formula-pas">${p.tex.map(t => `<div>${tex(t)}</div>`).join('')}</div>` : '';
      return `<li class="${p.cls || ''}"><span class="pas-et">${et}</span>${formules}<p>${p.text}</p></li>`;
    }).join('') + '</ol>';
  }

  // ---------- Laboratori ----------
  const PRESETS = {
    comp: [
      { et: '1r quadrant (3; 4)', a: 3, b: 4 },
      { et: '2n quadrant (−4; 3)', a: -4, b: 3 },
      { et: '3r quadrant (−5; −2)', a: -5, b: -2 },
      { et: '4t quadrant (6; −3)', a: 6, b: -3 },
      { et: 'Sobre un eix (0; −6)', a: 0, b: -6 }
    ],
    polar: [
      { et: '1r quadrant: 8 a 30°', a: 8, b: 30 },
      { et: '2n quadrant: 6 a 150°', a: 6, b: 150 },
      { et: '3r quadrant: 5 a 240°', a: 5, b: 240 },
      { et: '4t quadrant: 7 a 315°', a: 7, b: 315 },
      { et: 'Sobre un eix: 4 a 180°', a: 4, b: 180 }
    ]
  };

  const lab = { mode: 'comp', d: desComponents(3, 4), preset: 0 };

  function setComp(vx, vy) {
    lab.d = desComponents(clamp(vx, -LIM, LIM), clamp(vy, -LIM, LIM));
    refrescaLab();
  }
  function setPolar(m, th) {
    lab.d = desPolar(clamp(m, 0, LIM), clamp(th, 0, 360));
    refrescaLab();
  }

  function sincronitzaEntrades() {
    const d = lab.d;
    const posa = (id, v, dec) => {
      const e = $(id);
      if (document.activeElement !== e) e.value = Number(v.toFixed(dec));
    };
    posa('sVx', d.vx, 2); posa('nVx', d.vx, 2);
    posa('sVy', d.vy, 2); posa('nVy', d.vy, 2);
    posa('sM', d.m, 2); posa('nM', d.m, 2);
    posa('sTh', d.th, 1); posa('nTh', d.th, 1);
  }

  function resultatLab() {
    const d = lab.d;
    const igualsC = exacte(d.vx, 2) && exacte(d.vy, 2) ? '=' : '\\approx';
    const comp = `\\vec v\\ ${igualsC}\\ (${tn(d.vx)};\\ ${tn(d.vy)})`;
    const pol = d.q === 0
      ? '|\\vec v|=0,\\ \\theta\\ \\text{no definit}'
      : `|\\vec v|\\ ${rel(d.m)}\\ ${tn(d.m)},\\quad \\theta\\ ${rel(d.th, 1)}\\ ${deg(d.th)}`;
    const [dades, res] = lab.mode === 'comp' ? [comp, pol] : [pol, comp];
    $('vecResultat').innerHTML = `<p><span class="et">Dades</span>${tex(dades)}</p><p><span class="et">Resultat</span>${tex(res)}</p>`;
  }

  function refrescaLab() {
    sincronitzaEntrades();
    dibuixa($('vecSvg'), lab.d, { triangle: true, arcs: true, etiquetes: true, cercle: lab.mode === 'polar' });
    resultatLab();
    pintaPasos($('vecPasos'), lab.d, lab.mode);
    $('vecDesc').textContent = descripcio(lab.d);
    marcaPreset();
  }

  function marcaPreset() {
    const d = lab.d;
    document.querySelectorAll('#vecPresets .btn').forEach((b, i) => {
      const p = PRESETS[lab.mode][i];
      const ok = lab.mode === 'comp'
        ? Math.abs(d.vx - p.a) < 1e-9 && Math.abs(d.vy - p.b) < 1e-9
        : Math.abs(d.m - p.a) < 1e-9 && Math.abs(d.th - p.b) < 1e-9;
      b.setAttribute('aria-pressed', ok ? 'true' : 'false');
    });
  }

  function construeixPresets() {
    const cont = $('vecPresets');
    cont.textContent = '';
    PRESETS[lab.mode].forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.textContent = p.et;
      b.addEventListener('click', () => (lab.mode === 'comp' ? setComp(p.a, p.b) : setPolar(p.a, p.b)));
      cont.appendChild(b);
    });
  }

  function canviaMode(mode) {
    if (mode === lab.mode) return;
    lab.mode = mode;
    $('modeComp').setAttribute('aria-pressed', mode === 'comp' ? 'true' : 'false');
    $('modePolar').setAttribute('aria-pressed', mode === 'polar' ? 'true' : 'false');
    $('grupComp').hidden = mode !== 'comp';
    $('grupPolar').hidden = mode !== 'polar';
    construeixPresets();
    refrescaLab();
  }

  function llegeix(input) {
    const t = input.value.trim().replace(',', '.').replace('−', '-');
    return t === '' ? NaN : Number(t);
  }

  function puntDelPunter(svg, ev) {
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return [(p.x - C) / S, (C - p.y) / S];
  }

  function mouAlPunter(ev) {
    const [x, y] = puntDelPunter($('vecSvg'), ev);
    if (lab.mode === 'comp') {
      const vx = clamp(Math.round(x), -LIM, LIM), vy = clamp(Math.round(y), -LIM, LIM);
      if (vx !== lab.d.vx || vy !== lab.d.vy) setComp(vx, vy);
    } else {
      const m = Math.min(LIM, Math.round(Math.hypot(x, y) * 2) / 2);
      let th = Math.atan2(y, x) * GRAUS;
      if (th < 0) th += 360;
      th = Math.round(th) % 360;
      if (m !== lab.d.m || th !== lab.d.th) setPolar(m, th);
    }
  }

  function iniciaLab() {
    const svg = $('vecSvg');
    iniciaPla(svg);
    const nansa = el('circle', {
      r: 9, class: 'nansa', tabindex: 0, role: 'slider',
      'aria-label': 'Punta del vector. Amb les fletxes del teclat: en mode components, mou vx i vy; en mode mòdul i angle, esquerra i dreta canvien θ i amunt i avall el mòdul.'
    }, svg);
    svg._nansa = nansa;

    let arrossega = false;
    svg.addEventListener('pointerdown', ev => {
      arrossega = true;
      svg.setPointerCapture(ev.pointerId);
      mouAlPunter(ev);
    });
    svg.addEventListener('pointermove', ev => { if (arrossega) mouAlPunter(ev); });
    const atura = () => { arrossega = false; };
    svg.addEventListener('pointerup', atura);
    svg.addEventListener('pointercancel', atura);

    nansa.addEventListener('keydown', ev => {
      const d = lab.d;
      const tecles = lab.mode === 'comp'
        ? { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }
        : { ArrowRight: [0, -5], ArrowLeft: [0, 5], ArrowUp: [0.5, 0], ArrowDown: [-0.5, 0] };
      const k = tecles[ev.key];
      if (!k) return;
      ev.preventDefault();
      if (lab.mode === 'comp') setComp(d.vx + k[0], d.vy + k[1]);
      else setPolar(d.m + k[0], (d.th + k[1] + 360) % 360);
    });

    const enllaca = (id, fn) => $(id).addEventListener('input', ev => {
      const v = ev.target.type === 'range' ? Number(ev.target.value) : llegeix(ev.target);
      if (!Number.isNaN(v)) fn(v);
    });
    enllaca('sVx', v => setComp(v, lab.d.vy));
    enllaca('nVx', v => setComp(v, lab.d.vy));
    enllaca('sVy', v => setComp(lab.d.vx, v));
    enllaca('nVy', v => setComp(lab.d.vx, v));
    enllaca('sM', v => setPolar(v, lab.d.th));
    enllaca('nM', v => setPolar(v, lab.d.th));
    enllaca('sTh', v => setPolar(lab.d.m, v));
    enllaca('nTh', v => setPolar(lab.d.m, v));
    ['nVx', 'nVy', 'nM', 'nTh'].forEach(id => $(id).addEventListener('change', sincronitzaEntrades));

    $('modeComp').addEventListener('click', () => canviaMode('comp'));
    $('modePolar').addEventListener('click', () => canviaMode('polar'));

    construeixPresets();
    refrescaLab();
  }

  // ---------- Mode repte ----------
  const SIGNES = { 1: [1, 1], 2: [-1, 1], 3: [-1, -1], 4: [1, -1] };
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const rep = { tipus: 'comp', d: null, intents: 0, acabat: false, ultimQ: 0 };
  const stats = { fets: 0, primera: 0 };

  function nouRepte() {
    let tipus = $('repTipus').value;
    if (tipus === 'mix') tipus = Math.random() < 0.5 ? 'comp' : 'polar';
    let q;
    do { q = rnd(1, 4); } while (q === rep.ultimQ);
    rep.ultimQ = q;
    const sobreEix = Math.random() < 0.1;
    let d;
    if (tipus === 'comp') {
      if (sobreEix) {
        const k = rnd(0, 3), v = rnd(2, 9);
        d = desComponents([v, 0, -v, 0][k], [0, v, 0, -v][k]);
      } else {
        const [sx, sy] = SIGNES[q];
        let a, b;
        do { a = rnd(1, 9); b = rnd(1, 9); } while (a === b && Math.random() < 0.7);
        d = desComponents(sx * a, sy * b);
      }
    } else {
      const m = rnd(2, 10);
      d = desPolar(m, sobreEix ? 90 * rnd(0, 3) : (q - 1) * 90 + 5 * rnd(1, 17));
    }
    Object.assign(rep, { tipus, d, intents: 0, acabat: false });

    if (tipus === 'comp') {
      $('repEnunciat').innerHTML = `Calcula el mòdul i l’angle θ del vector ${tex(`\\vec v=(${tn(d.vx)};\\ ${tn(d.vy)})`)}.`;
      $('repALab').innerHTML = tex('|\\vec v| =');
      $('repBLab').innerHTML = tex('\\theta\\ (^\\circ) =');
    } else {
      $('repEnunciat').innerHTML = `Calcula els components del vector de mòdul ${tex(`|\\vec v|=${tn(d.m)}`)} i angle ${tex(`\\theta=${deg(d.th)}`)}.`;
      $('repALab').innerHTML = tex('v_x =');
      $('repBLab').innerHTML = tex('v_y =');
    }
    $('repA').value = '';
    $('repB').value = '';
    $('repFeedback').textContent = '';
    $('repPasos').textContent = '';
    $('repComprova').disabled = false;
    $('repSolucio').disabled = false;
    dibuixaRepte();
  }

  function dibuixaRepte() {
    const resolt = rep.acabat;
    $('repEsbosCaixa').hidden = !$('repEsbos').checked && !resolt;
    dibuixa($('repSvg'), rep.d, { triangle: resolt, arcs: resolt, etiquetes: resolt, cercle: false });
  }

  const prop = (x, y, tol) => Math.abs(x - y) <= tol;
  const ok = txt => ({ ok: true, txt });
  const ko = txt => ({ ok: false, txt });

  function valoraComp(d, m, th) {
    const out = [];
    const tolM = Math.max(0.02, 0.005 * d.m);
    const suma = Math.abs(d.vx) + Math.abs(d.vy);
    if (prop(m, d.m, tolM)) out.push(ok('Mòdul correcte.'));
    else if (prop(m, suma, 0.02)) out.push(ko('Mòdul: has sumat els components. Com que són perpendiculars, cal Pitàgores: |v| = √(vx² + vy²).'));
    else if (prop(m, d.m * d.m, 0.02)) out.push(ko('Mòdul: t’has descuidat l’arrel quadrada.'));
    else out.push(ko('Mòdul incorrecte. Fes servir Pitàgores: |v| = √(vx² + vy²).'));

    const tolT = 0.6;
    const dif = Math.abs(((th - d.th) % 360 + 540) % 360 - 180);
    const quadTxt = esQuad(d.q) ? `El vector és al ${ORDINAL[d.q]} quadrant: θ ha d’estar entre ${RANG[d.q][0]}° i ${RANG[d.q][1]}°.` : '';
    if (prop(th, d.th, tolT) || (d.th === 0 && prop(th, 360, tolT))) out.push(ok('Angle correcte.'));
    else if (dif <= tolT) out.push(ko('Angle: la direcció és bona, però expressa’l entre 0° i 360° (suma-hi 360°).'));
    else if (!esQuad(d.q)) out.push(ko('Angle incorrecte. El vector és sobre un eix: fixa’t en els angles marcats als extrems dels eixos (0°, 90°, 180° i 270°).'));
    else {
      const a = d.alpha;
      const calc = Math.atan(d.vy / d.vx) * GRAUS;
      if (d.q !== 1 && prop(th, a, tolT)) out.push(ko(`Angle: aquest és α, l’angle del triangle de suport. ${quadTxt} Ara cal passar-lo a l’angle des de +x.`));
      else if (d.q !== 1 && prop(th, calc, tolT)) out.push(ko(`Angle: és el que dona la calculadora amb tan⁻¹(vy/vx), però no té en compte el quadrant. ${quadTxt}`));
      else if (prop(th, 90 - a, tolT)) out.push(ko('Angle: sembla que l’has mesurat des de l’eix y. Recorda que θ es mesura sempre des del semieix +x.'));
      else if ([a, 180 - a, 180 + a, 360 - a].some(v => prop(th, v, tolT))) out.push(ko(`Angle: aquesta fórmula és la d’un altre quadrant. ${quadTxt}`));
      else out.push(ko(`Angle incorrecte. Calcula primer α amb el triangle. ${quadTxt}`));
    }
    return out;
  }

  function valoraPolar(d, vx, vy) {
    const tol = Math.max(0.02, 0.005 * d.m);
    if (prop(vx, d.vx, tol) && prop(vy, d.vy, tol)) return [ok('Els dos components són correctes.')];
    const radX = d.m * Math.cos(d.th), radY = d.m * Math.sin(d.th);
    if (prop(vx, radX, tol) && prop(vy, radY, tol)) {
      return [ko('Sembla que la calculadora està en radiants (RAD). Posa-la en graus (DEG) i torna-ho a calcular.')];
    }
    const ax = Math.abs(d.vx), ay = Math.abs(d.vy);
    if (esQuad(d.q) && !prop(ax, ay, tol) && prop(Math.abs(vx), ay, tol) && prop(Math.abs(vy), ax, tol)) {
      return [ko('Sembla que has intercanviat el sinus i el cosinus. El catet sobre l’eix x és el contigu a α: |vx| = |v|·cos α.')];
    }
    const valora = (nom, val, ver, trig) => {
      if (prop(val, ver, tol)) return ok(`${nom} correcta.`);
      if (Math.abs(ver) > tol && prop(val, -ver, tol)) {
        return ko(`${nom}: el valor és bo però el signe no. Al ${ORDINAL[d.q]} quadrant, ${nom} és ${ver > 0 ? 'positiva' : 'negativa'}.`);
      }
      if (!esQuad(d.q)) return ko(`${nom} incorrecta. El vector és sobre un eix: tot el mòdul va en un sol component.`);
      return ko(`${nom} incorrecta. Calcula primer α, l’angle agut del triangle, i després |${nom}| = |v|·${trig} α.`);
    };
    return [valora('vx', vx, d.vx, 'cos'), valora('vy', vy, d.vy, 'sin')];
  }

  function pintaFeedback(llista) {
    $('repFeedback').innerHTML = llista.map(r => `<li class="${r.ok ? 'ok' : 'ko'}">${r.txt}</li>`).join('');
  }

  function marcador() {
    $('repMarcador').textContent = `Reptes fets: ${stats.fets} · Encerts a la primera: ${stats.primera}`;
  }

  function tancaRepte() {
    rep.acabat = true;
    stats.fets++;
    $('repComprova').disabled = true;
    $('repSolucio').disabled = true;
    pintaPasos($('repPasos'), rep.d, rep.tipus);
    dibuixaRepte();
    marcador();
  }

  function comprova(ev) {
    ev.preventDefault();
    if (rep.acabat) return;
    const a = llegeix($('repA')), b = llegeix($('repB'));
    if (Number.isNaN(a) || Number.isNaN(b)) {
      pintaFeedback([ko('Escriu els dos valors (pots fer servir la coma decimal).')]);
      return;
    }
    rep.intents++;
    const r = rep.tipus === 'comp' ? valoraComp(rep.d, a, b) : valoraPolar(rep.d, a, b);
    if (r.every(x => x.ok)) {
      if (rep.intents === 1) stats.primera++;
      r.push(ok(rep.intents === 1 ? 'Perfecte, a la primera! Aquí tens el desenvolupament per repassar-lo.' : `Correcte, en ${rep.intents} intents.`));
      pintaFeedback(r);
      tancaRepte();
    } else {
      pintaFeedback(r);
    }
  }

  function mostraSolucio() {
    if (rep.acabat) return;
    pintaFeedback([ko('Solució mostrada. Repassa-la i prova’n un altre.')]);
    tancaRepte();
  }

  function iniciaRepte() {
    iniciaPla($('repSvg'));
    $('repForm').addEventListener('submit', comprova);
    $('repSolucio').addEventListener('click', mostraSolucio);
    $('repNou').addEventListener('click', nouRepte);
    $('repTipus').addEventListener('change', nouRepte);
    $('repEsbos').addEventListener('change', dibuixaRepte);
    marcador();
    nouRepte();
  }

  renderMathEstatic();
  iniciaLab();
  iniciaRepte();
})();
