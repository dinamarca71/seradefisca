(() => {
  'use strict';

  function renderMath(root = document) {
    const katex = window.katex;
    root.querySelectorAll('[data-math]').forEach(el => {
      const src = el.dataset.math || el.textContent || '';
      if (!katex) { el.textContent = src; return; }
      katex.render(src, el, { throwOnError: false, strict: 'ignore', displayMode: false });
    });
  }

  // Constants físiques (SI)
  const H = 6.62607015e-34;
  const C = 2.99792458e8;
  const KB = 1.380649e-23;
  const G_NEWTON = 6.674e-11;
  const L_SOL = 3.828e26;
  const M_SOL = 1.989e30;
  const R_SOL = 6.957e8;
  const Q_CARBO = 3.3e7;        // energia de combustió del carbó, J/kg
  const ANY = 3.156e7;          // segons en un any
  const EDAT_SOLAR = 4.55e9;    // anys
  const KAPPA = 1.18e-6;        // difusivitat tèrmica de les roques, m²/s (valor de Kelvin)
  const GRAD_MESURAT = 36;      // gradient geotèrmic mesurat a les mines, °C/km
  const MC2_ELECTRO = 511;      // keV

  const COLOR = {
    eix: '#94a3b8',
    graella: '#e8edf2',
    text: '#5a6b7d',
    classic: '#c2410c',
    modern: '#059669',
    neutre: '#94a3b8',
    destacat: '#4f46e5',
    ref: '#1a2332'
  };

  const SUPER = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

  function potencia10(exp) {
    return '10' + String(exp).split('').map(ch => SUPER[ch]).join('');
  }

  function milers(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function formatAnys(anys) {
    if (anys < 1e5) return milers(anys) + ' anys';
    if (anys < 1e9) return formatNum(anys / 1e6, 1) + ' Ma';
    return formatNum(anys / 1e9, 2) + ' Ga';
  }

  function formatFactor(f) {
    if (!isFinite(f)) return '∞';
    if (f >= 1e4) {
      const exp = Math.floor(Math.log10(f));
      return formatNum(f / Math.pow(10, exp), 1) + '·' + potencia10(exp);
    }
    if (f >= 100) return milers(f);
    return formatNum(f, 1);
  }

  function formatKeV(keV) {
    return keV < 10 ? formatNum(keV, 2) : milers(keV);
  }

  // --- Marcs de dibuix ---------------------------------------------------

  function capsa(canvas, padL, padT, padR, padB) {
    return {
      x: padL,
      y: padT,
      w: canvas.clientWidth - padL - padR,
      h: canvas.clientHeight - padT - padB
    };
  }

  function barresLog(ctx, box, files, opts) {
    const lmin = Math.log10(opts.min);
    const lmax = Math.log10(opts.max);
    const X = v => box.x + ((Math.log10(v) - lmin) / (lmax - lmin)) * box.w;

    ctx.font = '11px "Segoe UI", sans-serif';

    // Graella i etiquetes de cada dècada
    ctx.strokeStyle = COLOR.graella;
    ctx.lineWidth = 1;
    ctx.fillStyle = COLOR.text;
    ctx.textAlign = 'center';
    for (let e = Math.round(lmin); e <= Math.round(lmax); e++) {
      const x = X(Math.pow(10, e));
      ctx.beginPath();
      ctx.moveTo(x, box.y);
      ctx.lineTo(x, box.y + box.h);
      ctx.stroke();
      ctx.fillText(potencia10(e), x, box.y + box.h + 16);
    }
    ctx.fillText('temps (anys)', box.x + box.w / 2, box.y + box.h + 34);

    // Eix vertical
    ctx.strokeStyle = COLOR.eix;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(box.x, box.y);
    ctx.lineTo(box.x, box.y + box.h);
    ctx.stroke();

    // Referència vertical (edat real)
    if (opts.ref) {
      const xr = X(opts.ref.valor);
      ctx.save();
      ctx.strokeStyle = COLOR.ref;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(xr, box.y - 6);
      ctx.lineTo(xr, box.y + box.h);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = COLOR.ref;
      ctx.textAlign = xr > box.x + box.w * 0.65 ? 'right' : 'left';
      ctx.fillText(opts.ref.etiqueta, xr + (ctx.textAlign === 'right' ? -4 : 4), box.y - 8);
    }

    // Barres
    const rowH = box.h / files.length;
    const gruix = Math.min(opts.gruix || 16, rowH - 9);
    files.forEach((f, i) => {
      const yc = box.y + rowH * (i + 0.5);
      const x1 = X(Math.min(Math.max(f.valor, opts.min), opts.max));

      ctx.fillStyle = f.color;
      ctx.fillRect(box.x, yc - gruix / 2, Math.max(1, x1 - box.x), gruix);

      if (f.destacat) {
        ctx.strokeStyle = COLOR.destacat;
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, yc - gruix / 2 - 1.5, Math.max(1, x1 - box.x), gruix + 3);
      }

      ctx.fillStyle = f.destacat ? COLOR.destacat : COLOR.text;
      ctx.textAlign = 'right';
      ctx.font = (f.destacat ? '600 ' : '') + '11px "Segoe UI", sans-serif';
      ctx.fillText(f.etiqueta, box.x - 8, yc + 4);

      const text = f.text || formatAnys(f.valor);
      const cap = x1 + 6 + ctx.measureText(text).width < box.x + box.w;
      ctx.textAlign = cap ? 'left' : 'right';
      ctx.fillStyle = f.destacat ? COLOR.destacat : '#1a2332';
      ctx.fillText(text, cap ? x1 + 6 : x1 - 6, yc + 4);
    });
  }

  function plotXY(ctx, box, opts) {
    const X = v => box.x + ((v - opts.xMin) / (opts.xMax - opts.xMin)) * box.w;
    const Y = v => box.y + box.h - ((v - opts.yMin) / (opts.yMax - opts.yMin)) * box.h;

    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.strokeStyle = COLOR.graella;
    ctx.lineWidth = 1;
    ctx.fillStyle = COLOR.text;

    ctx.textAlign = 'center';
    opts.xTicks.forEach(t => {
      const x = X(t.v);
      ctx.beginPath();
      ctx.moveTo(x, box.y);
      ctx.lineTo(x, box.y + box.h);
      ctx.stroke();
      if (t.label) ctx.fillText(t.label, x, box.y + box.h + 16);
    });

    ctx.textAlign = 'right';
    opts.yTicks.forEach(t => {
      const y = Y(t.v);
      ctx.beginPath();
      ctx.moveTo(box.x, y);
      ctx.lineTo(box.x + box.w, y);
      ctx.stroke();
      if (t.label) ctx.fillText(t.label, box.x - 6, y + 4);
    });

    ctx.strokeStyle = COLOR.eix;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(box.x, box.y);
    ctx.lineTo(box.x, box.y + box.h);
    ctx.lineTo(box.x + box.w, box.y + box.h);
    ctx.stroke();

    ctx.fillStyle = COLOR.text;
    ctx.textAlign = 'center';
    if (opts.xLabel) ctx.fillText(opts.xLabel, box.x + box.w / 2, box.y + box.h + 34);
    if (opts.yLabel) {
      ctx.save();
      ctx.translate(14, box.y + box.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(opts.yLabel, 0, 0);
      ctx.restore();
    }
    return { X, Y };
  }

  function corba(ctx, box, X, Y, punts, color, dash) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y - 2, box.w, box.h + 2);
    ctx.clip();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.setLineDash(dash || []);
    ctx.beginPath();
    punts.forEach((p, i) => {
      const x = X(p[0]);
      const y = Y(p[1]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  }

  function llegenda(ctx, box, items, esquerra) {
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    let y = box.y + 12;
    const x = esquerra ? box.x + 14 : box.x + box.w - 200;
    items.forEach(it => {
      ctx.save();
      ctx.strokeStyle = it.color;
      ctx.lineWidth = 2.2;
      ctx.setLineDash(it.dash || []);
      ctx.beginPath();
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x + 26, y - 4);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = COLOR.text;
      ctx.fillText(it.text, x + 32, y);
      y += 16;
    });
  }

  // --- Registre de visualitzacions ---------------------------------------

  const vizs = [];

  function registra(seccio, dibuixa) {
    vizs.push({ seccio, dibuixa });
    dibuixa();
  }

  function redibuixaTot() {
    vizs.forEach(v => {
      if (v.seccio.offsetParent !== null) v.dibuixa();
    });
  }

  // --- 1. Pressupost energètic del Sol -----------------------------------

  function vizSol() {
    const seccio = document.querySelector('[data-viz="sol"]');
    const canvas = document.getElementById('canvasSol');
    const lectura = document.getElementById('solLectura');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let fraccio = 0.10;

    function vides() {
      const quimica = (M_SOL * Q_CARBO) / L_SOL / ANY;
      const gravitatoria = (0.3 * G_NEWTON * M_SOL * M_SOL / R_SOL) / L_SOL / ANY;
      const fusio = (fraccio * M_SOL * 0.007 * C * C) / L_SOL / ANY;
      return { quimica, gravitatoria, fusio };
    }

    function dibuixa() {
      setupCanvas(canvas, ctx);
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      const box = capsa(canvas, 175, 26, 24, 46);
      const v = vides();
      barresLog(ctx, box, [
        { etiqueta: 'Combustió química', valor: v.quimica, color: COLOR.neutre },
        { etiqueta: 'Contracció gravitatòria', valor: v.gravitatoria, color: COLOR.classic },
        { etiqueta: 'Fusió nuclear', valor: v.fusio, color: COLOR.modern, destacat: true }
      ], {
        min: 1e3,
        max: 1e11,
        gruix: 26,
        ref: { valor: EDAT_SOLAR, etiqueta: 'edat del sistema solar: 4,55 Ga' }
      });

      const rao = v.fusio / EDAT_SOLAR;
      const comparacio = rao >= 1
        ? formatNum(rao, 1) + ' vegades l\'edat del sistema solar'
        : 'només un ' + Math.round(rao * 100) + ' % de l\'edat del sistema solar';

      lectura.innerHTML = 'Amb un <strong>' + formatNum(fraccio * 100, 1) + ' %</strong> de la massa fusionada, '
        + 'el Sol té combustible per <strong>' + formatAnys(v.fusio) + '</strong>, '
        + comparacio + '. '
        + 'La contracció gravitatòria només en donaria <strong>' + formatAnys(v.gravitatoria) + '</strong> '
        + '(' + formatFactor(v.fusio / v.gravitatoria) + ' vegades menys) i cremar tot el Sol com si fos carbó, '
        + '<strong>' + formatAnys(v.quimica) + '</strong>. Cap font clàssica no arriba a la línia de ratlles.';
    }

    bindSlider('solFraccio', 'solFraccioVal', val => {
      fraccio = val / 100;
      dibuixa();
    }, val => formatNum(val, 1) + ' %');

    registra(seccio, dibuixa);
  }

  // --- 2. El càlcul de Kelvin per a l'edat de la Terra --------------------

  function vizTerra() {
    const seccio = document.querySelector('[data-viz="terra"]');
    const canvas = document.getElementById('canvasTerra');
    const lectura = document.getElementById('terraLectura');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let theta = 3900;   // °C
    let gradient = 36;  // °C/km

    function edatKelvin() {
      const g = gradient / 1000;                       // °C/m
      return Math.pow(theta / g, 2) / (Math.PI * KAPPA) / ANY;
    }

    function gradientNecessari() {
      return theta / Math.sqrt(Math.PI * KAPPA * EDAT_SOLAR * ANY) * 1000;
    }

    function dibuixa() {
      setupCanvas(canvas, ctx);
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      const box = capsa(canvas, 190, 26, 24, 46);
      const t = edatKelvin();
      barresLog(ctx, box, [
        { etiqueta: 'Newton (1687)', valor: 5e4, color: COLOR.neutre },
        { etiqueta: 'Buffon (1774)', valor: 7.5e4, color: COLOR.neutre },
        { etiqueta: 'Kelvin (1862)', valor: 9.8e7, color: COLOR.classic, text: '98 Ma (marge 20-400)' },
        { etiqueta: 'Kelvin (1897)', valor: 3e7, color: COLOR.classic, text: '20-40 Ma' },
        { etiqueta: 'Geòlegs i Darwin (1859)', valor: 3e8, color: '#0e7490', text: 'com a mínim 300 Ma' },
        { etiqueta: 'Holmes, radiometria (1913)', valor: 1.6e9, color: COLOR.modern },
        { etiqueta: 'Patterson (1956)', valor: 4.55e9, color: COLOR.modern },
        { etiqueta: 'El teu càlcul de Kelvin', valor: t, color: '#a5b4fc', destacat: true }
      ], {
        min: 1e4,
        max: 1e11,
        ref: { valor: EDAT_SOLAR, etiqueta: 'edat real: 4 550 Ma' }
      });

      const greq = gradientNecessari();
      const rao = EDAT_SOLAR / t;
      const comparacio = rao >= 1
        ? formatFactor(rao) + ' vegades menys que l\'edat real'
        : formatFactor(1 / rao) + ' vegades més que l\'edat real';

      lectura.innerHTML = 'Amb <strong>Θ = ' + milers(theta) + ' °C</strong> i <strong>G = ' + gradient + ' °C/km</strong> '
        + 'el model de conducció dona <strong>' + formatAnys(t) + '</strong>, ' + comparacio + '. '
        + 'Per arribar als 4 550 Ma caldria un gradient de <strong>' + formatNum(greq, 1) + ' °C/km</strong>, '
        + formatNum(GRAD_MESURAT / greq, 1) + ' vegades més suau que els ' + GRAD_MESURAT + ' °C/km que es mesuren a les mines. '
        + 'El problema no és el càlcul: és suposar que la Terra no s\'escalfa des de dins.';
    }

    bindSlider('terraTheta', 'terraThetaVal', val => {
      theta = val;
      dibuixa();
    }, val => milers(val) + ' °C');

    bindSlider('terraGrad', 'terraGradVal', val => {
      gradient = val;
      dibuixa();
    }, val => val + ' °C/km');

    registra(seccio, dibuixa);
  }

  // --- 3. Cos negre: Rayleigh-Jeans contra Planck -------------------------

  function vizCosNegre() {
    const seccio = document.querySelector('[data-viz="cosnegre"]');
    const canvas = document.getElementById('canvasCosNegre');
    const lectura = document.getElementById('cnLectura');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let temp = 5000;
    let lambdaNm = 200;

    const planck = (lm, T) => {
      const x = (H * C) / (lm * KB * T);
      return (2 * H * C * C) / Math.pow(lm, 5) / (Math.exp(x) - 1);
    };
    const rayleigh = (lm, T) => (2 * C * KB * T) / Math.pow(lm, 4);
    const raoRJ = (lm, T) => {
      const x = (H * C) / (lm * KB * T);
      return (Math.exp(x) - 1) / x;
    };

    function dibuixa() {
      setupCanvas(canvas, ctx);
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      const box = capsa(canvas, 52, 20, 24, 46);

      const lambdaWien = 2.897771e-3 / temp;
      const wienNm = lambdaWien * 1e9;
      const pic = planck(lambdaWien, temp);

      // L'eix s'adapta a la temperatura perquè el màxim i el marcador hi càpiguen
      const pas = 4 * wienNm > 2400 ? 1000 : 500;
      const xMax = Math.ceil(Math.max(4 * wienNm, 2100) / pas) * pas;

      const puntsP = [];
      const puntsR = [];
      for (let nm = 20; nm <= xMax; nm += xMax / 400) {
        const lm = nm * 1e-9;
        puntsP.push([nm, planck(lm, temp) / pic]);
        puntsR.push([nm, rayleigh(lm, temp) / pic]);
      }

      const xTicks = [];
      for (let v = 0; v <= xMax; v += pas) xTicks.push({ v, label: milers(v) });

      const { X, Y } = plotXY(ctx, box, {
        xMin: 0, xMax: xMax, yMin: 0, yMax: 1.8,
        xTicks: xTicks,
        yTicks: [0, 0.5, 1, 1.5].map(v => ({ v, label: formatNum(v, 1) })),
        xLabel: 'λ (nm)',
        yLabel: 'radiància espectral (màxim de Planck = 1)'
      });

      // Franja visible
      ctx.fillStyle = 'rgba(79, 70, 229, 0.07)';
      ctx.fillRect(X(380), box.y, X(780) - X(380), box.h);
      if (X(780) - X(380) > 46) {
        ctx.fillStyle = COLOR.text;
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('visible', (X(380) + X(780)) / 2, box.y + box.h - 6);
      }

      corba(ctx, box, X, Y, puntsR, COLOR.classic, [6, 4]);
      corba(ctx, box, X, Y, puntsP, COLOR.modern);

      // Marcador de la longitud d'ona triada
      const xm = X(lambdaNm);
      ctx.save();
      ctx.strokeStyle = COLOR.destacat;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(xm, box.y);
      ctx.lineTo(xm, box.y + box.h);
      ctx.stroke();
      ctx.restore();

      const yp = Y(Math.min(planck(lambdaNm * 1e-9, temp) / pic, 1.8));
      ctx.fillStyle = COLOR.modern;
      ctx.beginPath();
      ctx.arc(xm, yp, 4, 0, TAU);
      ctx.fill();

      llegenda(ctx, box, [
        { color: COLOR.modern, text: 'Planck (mesurat)' },
        { color: COLOR.classic, dash: [6, 4], text: 'Rayleigh-Jeans (clàssic)' }
      ]);

      // Marca on la corba clàssica se surt del gràfic per amunt
      const sortida = puntsR.find(p => p[1] <= 1.8);
      if (sortida) {
        ctx.fillStyle = COLOR.classic;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('↑ cap a l\'infinit', X(sortida[0]) + 6, box.y + 13);
      }

      const rao = raoRJ(lambdaNm * 1e-9, temp);
      // On la llei clàssica s'acosta a menys del 10 %: (e^x−1)/x = 1,1 → x ≈ 0,19
      const lambda10 = (H * C) / (0.19 * KB * temp);
      lectura.innerHTML = 'A <strong>λ = ' + milers(lambdaNm) + ' nm</strong> i <strong>T = ' + milers(temp) + ' K</strong> '
        + 'la fórmula clàssica prediu <strong>' + formatFactor(rao) + ' vegades</strong> més radiació que la real. '
        + 'El màxim mesurat és a λ<sub>màx</sub> = ' + Math.round(wienNm) + ' nm, i la llei de Rayleigh-Jeans només s\'hi acosta '
        + '(menys del 10 % d\'error) per damunt de <strong>' + formatNum(lambda10 * 1e6, 1) + ' μm</strong>, '
        + 'a l\'infraroig llunyà: justament la regió on primer es va comprovar i on semblava correcta. '
        + 'Cap a l\'ultraviolat es dispara, i la potència total que prediu és infinita.';
    }

    bindSlider('cnTemp', 'cnTempVal', val => {
      temp = val;
      dibuixa();
    }, val => milers(val) + ' K');

    bindSlider('cnLambda', 'cnLambdaVal', val => {
      lambdaNm = val;
      dibuixa();
    }, val => milers(val) + ' nm');

    registra(seccio, dibuixa);
  }

  // --- 4. Velocitat d'un electró accelerat: Newton contra Einstein --------

  function vizRelativista() {
    const seccio = document.querySelector('[data-viz="relativista"]');
    const canvas = document.getElementById('canvasRelativista');
    const lectura = document.getElementById('relLectura');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let volt = 500;            // kV; per a un electró, Ec (keV) = ΔV (kV)
    const V_MAX = 1500;
    const Y_MAX = 1.3;

    const betaNewton = kV => Math.sqrt(2 * kV / MC2_ELECTRO);
    const betaRel = kV => {
      const gamma = 1 + kV / MC2_ELECTRO;
      return Math.sqrt(1 - 1 / (gamma * gamma));
    };

    function dibuixa() {
      setupCanvas(canvas, ctx);
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      const box = capsa(canvas, 52, 20, 24, 46);

      const puntsN = [];
      const puntsR = [];
      for (let v = 0; v <= V_MAX; v += V_MAX / 400) {
        puntsN.push([v, betaNewton(v)]);
        puntsR.push([v, betaRel(v)]);
      }

      const { X, Y } = plotXY(ctx, box, {
        xMin: 0, xMax: V_MAX, yMin: 0, yMax: Y_MAX,
        xTicks: [0, 250, 500, 750, 1000, 1250, 1500].map(v => ({ v, label: milers(v) })),
        yTicks: [0, 0.25, 0.5, 0.75, 1, 1.25].map(v => ({ v, label: formatNum(v, 2) })),
        xLabel: 'ΔV (kV)',
        yLabel: 'velocitat (v / c)'
      });

      // El límit: v = c
      ctx.save();
      ctx.strokeStyle = COLOR.ref;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(box.x, Y(1));
      ctx.lineTo(box.x + box.w, Y(1));
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = COLOR.ref;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('v = c', box.x + box.w - 6, Y(1) - 6);

      corba(ctx, box, X, Y, puntsN, COLOR.classic, [6, 4]);
      corba(ctx, box, X, Y, puntsR, COLOR.modern);

      // On la corba newtoniana se surt del gràfic
      const sortida = puntsN.find(p => p[1] >= Y_MAX);
      if (sortida) {
        ctx.fillStyle = COLOR.classic;
        ctx.textAlign = 'left';
        ctx.fillText('↑ Newton no té límit', X(sortida[0]) + 6, box.y + 13);
      }

      const xm = X(volt);
      ctx.save();
      ctx.strokeStyle = COLOR.destacat;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(xm, box.y);
      ctx.lineTo(xm, box.y + box.h);
      ctx.stroke();
      ctx.restore();

      [[betaNewton(volt), COLOR.classic], [betaRel(volt), COLOR.modern]].forEach(([val, color]) => {
        if (val > Y_MAX) return;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(xm, Y(val), 4, 0, TAU);
        ctx.fill();
      });

      llegenda(ctx, box, [
        { color: COLOR.modern, text: 'relativista' },
        { color: COLOR.classic, dash: [6, 4], text: 'newtoniana (½mv²)' }
      ], true);

      const bn = betaNewton(volt);
      const br = betaRel(volt);
      lectura.innerHTML = 'Amb <strong>ΔV = ' + milers(volt) + ' kV</strong> l\'electró guanya '
        + '<strong>' + milers(volt) + ' keV</strong> d\'energia cinètica. La fórmula clàssica ½mv² prediu '
        + '<strong>v = ' + formatNum(bn, 3) + 'c</strong>' + (bn >= 1 ? ', una velocitat impossible' : '')
        + ', i la relativitat dona <strong>v = ' + formatNum(br, 3) + 'c</strong>: '
        + 'un ' + formatNum((bn - br) / br * 100, 1) + ' % de diferència. '
        + 'La referència per saber si cal relativitat és l\'energia en repòs de l\'electró, '
        + MC2_ELECTRO + ' keV: quan ΔV s\'hi acosta, la mecànica clàssica ja no serveix.';
    }

    bindSlider('relVolt', 'relVoltVal', val => {
      volt = val;
      dibuixa();
    }, val => milers(val) + ' kV');

    registra(seccio, dibuixa);
  }

  // --- 5. Espectres d'emissió --------------------------------------------

  // Longitud d'ona (nm), intensitat relativa aproximada i nom de la ratlla
  const ESPECTRES = {
    hidrogen: {
      nom: 'hidrogen',
      linies: [[410.2, 0.3, 'Hδ'], [434.0, 0.45, 'Hγ'], [486.1, 0.7, 'Hβ'], [656.3, 1, 'Hα']],
      text: 'Les quatre ratlles visibles de l\'hidrogen són la <strong>sèrie de Balmer</strong> '
        + '(salts cap al nivell n = 2). Comprova-ho: amb B = 364,6 nm, la fórmula de Balmer dona '
        + '656,3 nm per a n = 3, 486,1 nm per a n = 4, 434,0 nm per a n = 5 i 410,2 nm per a n = 6. '
        + 'Coincideix amb les quatre ratlles i amb quatre xifres de precisió, i el 1885 ningú no sabia per què.'
    },
    heli: {
      nom: 'heli',
      linies: [[447.1, 0.5, ''], [471.3, 0.25, ''], [492.2, 0.3, ''], [501.6, 0.55, ''], [587.6, 1, 'D₃'], [656.0, 0.4, ''], [706.5, 0.35, '']],
      text: 'L\'heli es va descobrir el 1868 <strong>a l\'espectre del Sol</strong>, per la ratlla groga '
        + 'de 587,6 nm, abans de trobar-lo a la Terra: d\'aquí el nom, del grec <em>hḗlios</em>. '
        + 'És l\'exemple més clar que un espectre és una empremta que identifica l\'element, encara que sigui a 150 milions de quilòmetres.'
    },
    sodi: {
      nom: 'sodi',
      linies: [[568.8, 0.2, ''], [589.0, 1, 'doblet D'], [589.6, 0.9, ''], [615.4, 0.2, '']],
      text: 'El <strong>doblet groc del sodi</strong> (589,0 i 589,6 nm) és el que veus quan cau sal al foc '
        + 'i el que dona color als fanals de vapor de sodi. Que siguin <em>dues</em> ratlles tan juntes '
        + 'no s\'explica ni amb el model de Bohr: fa falta l\'espín de l\'electró.'
    },
    mercuri: {
      nom: 'mercuri',
      linies: [[404.7, 0.4, ''], [407.8, 0.2, ''], [435.8, 0.85, ''], [546.1, 1, 'verd'], [577.0, 0.45, ''], [579.1, 0.5, '']],
      text: 'És l\'espectre dels tubs fluorescents i dels fanals de vapor de mercuri: poques ratlles molt '
        + 'intenses, amb la <strong>verda de 546,1 nm</strong> dominant. Per això aquesta llum «desvirtua» '
        + 'els colors: il·lumina amb quatre o cinc longituds d\'ona, no amb totes.'
    },
    neo: {
      nom: 'neó',
      linies: [[585.2, 0.7, ''], [588.2, 0.5, ''], [594.5, 0.6, ''], [603.0, 0.55, ''], [607.4, 0.5, ''], [614.3, 0.7, ''], [621.7, 0.5, ''], [626.6, 0.6, ''], [633.4, 0.85, ''], [640.2, 1, ''], [650.7, 0.6, ''], [667.8, 0.4, ''], [692.9, 0.3, ''], [703.2, 0.35, '']],
      text: 'Gairebé totes les ratlles visibles del neó estan entre <strong>585 i 705 nm</strong>, i la suma '
        + 'd\'aquests vermells i taronges és el color inconfusible dels rètols de neó. Un mateix fenomen, '
        + 'la descàrrega en un gas, dona un color diferent per a cada element.'
    },
    continu: {
      nom: 'filament incandescent',
      continu: true,
      linies: [],
      text: 'Un sòlid incandescent (el filament d\'una bombeta, el ferro roent) emet un <strong>espectre '
        + 'continu</strong>: hi són tots els colors, i la forma de la corba només depèn de la temperatura. '
        + 'Això la física clàssica ho explicava a mitges (indici 11); el que no podia explicar de cap manera '
        + 'és per què un gas, en canvi, només emet unes ratlles.'
    }
  };

  function colorOnda(nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
    else if (nm <= 780) { r = 1; }
    let f = 1;
    if (nm >= 380 && nm < 420) f = 0.3 + 0.7 * (nm - 380) / 40;
    else if (nm > 700 && nm <= 780) f = 0.3 + 0.7 * (780 - nm) / 80;
    const conv = v => Math.round(255 * Math.pow(Math.max(0, Math.min(1, v)) * f, 0.8));
    return 'rgb(' + conv(r) + ',' + conv(g) + ',' + conv(b) + ')';
  }

  function vizEspectres() {
    const seccio = document.querySelector('[data-viz="espectres"]');
    const canvas = document.getElementById('canvasEspectre');
    const lectura = document.getElementById('espectreLectura');
    const descripcio = document.getElementById('descEspectre');
    const tabs = document.getElementById('espectreTabs');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let actual = 'hidrogen';

    const NM_MIN = 370;
    const NM_MAX = 790;

    function dibuixa() {
      setupCanvas(canvas, ctx);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const x0 = 30;
      const ampla = w - 60;
      const dalt = 48;
      const baix = h - 62;
      const X = nm => x0 + ((nm - NM_MIN) / (NM_MAX - NM_MIN)) * ampla;
      const dades = ESPECTRES[actual];

      ctx.fillStyle = '#0b0f14';
      ctx.fillRect(x0, dalt, ampla, baix - dalt);

      if (dades.continu) {
        for (let px = 0; px < ampla; px++) {
          const nm = NM_MIN + (px / ampla) * (NM_MAX - NM_MIN);
          if (nm < 380 || nm > 780) continue;
          ctx.fillStyle = colorOnda(nm);
          ctx.fillRect(x0 + px, dalt, 1.5, baix - dalt);
        }
      }

      dades.linies.forEach(([nm, intensitat]) => {
        const x = X(nm);
        const color = colorOnda(nm);
        ctx.save();
        ctx.globalAlpha = 0.18 * intensitat;
        ctx.fillStyle = color;
        ctx.fillRect(x - 6, dalt, 12, baix - dalt);
        ctx.globalAlpha = 0.45 + 0.55 * intensitat;
        ctx.fillRect(x - 1.6, dalt, 3.2, baix - dalt);
        ctx.restore();
      });

      ctx.strokeStyle = COLOR.eix;
      ctx.lineWidth = 1;
      ctx.strokeRect(x0, dalt, ampla, baix - dalt);

      // Etiquetes de les ratlles, per damunt de la franja. Es descarten les que
      // quedarien trepitjades (el neó i el doblet del sodi en tenen massa a prop).
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      let ultimaX = -Infinity;
      dades.linies.forEach(([nm, intensitat, nom]) => {
        const x = X(nm);
        const prioritaria = Boolean(nom) || intensitat >= 0.85;
        if (!prioritaria && (intensitat < 0.55 || x - ultimaX < 36)) return;
        if (x - ultimaX < 22) return;
        ultimaX = x;
        ctx.strokeStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(x, dalt - 6);
        ctx.lineTo(x, dalt);
        ctx.stroke();
        ctx.fillStyle = COLOR.text;
        ctx.fillText(formatNum(nm, 1), x, dalt - 10);
        if (nom) {
          ctx.fillStyle = '#1a2332';
          ctx.font = '600 11px "Segoe UI", sans-serif';
          ctx.fillText(nom, x, dalt - 24);
          ctx.font = '11px "Segoe UI", sans-serif';
        }
      });

      // Eix de longituds d'ona
      ctx.strokeStyle = COLOR.eix;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, baix);
      ctx.lineTo(x0 + ampla, baix);
      ctx.stroke();
      ctx.fillStyle = COLOR.text;
      ctx.textAlign = 'center';
      for (let nm = 400; nm <= 750; nm += 50) {
        const x = X(nm);
        ctx.beginPath();
        ctx.moveTo(x, baix);
        ctx.lineTo(x, baix + 5);
        ctx.stroke();
        ctx.fillText(String(nm), x, baix + 19);
      }
      ctx.fillText('λ (nm)', x0 + ampla / 2, baix + 38);
      ctx.textAlign = 'left';
      ctx.fillText('← ultraviolat', x0, baix + 38);
      ctx.textAlign = 'right';
      ctx.fillText('infraroig →', x0 + ampla, baix + 38);

      lectura.innerHTML = dades.text;
      descripcio.textContent = dades.continu
        ? 'Franja de color continu amb tots els colors del visible, de 380 a 780 nanòmetres.'
        : 'Franja negra amb ' + dades.linies.length + ' ratlles de color de '
          + dades.nom + ', a ' + dades.linies.map(l => formatNum(l[0], 1)).join(', ') + ' nanòmetres.';
    }

    tabs.querySelectorAll('.btn').forEach(boto => {
      boto.addEventListener('click', () => {
        actual = boto.dataset.espectre;
        tabs.querySelectorAll('.btn').forEach(b => {
          const actiu = b === boto;
          b.classList.toggle('active', actiu);
          b.setAttribute('aria-pressed', String(actiu));
        });
        dibuixa();
      });
    });

    registra(seccio, dibuixa);
  }

  // --- 6. Precessió del periheli -----------------------------------------

  function vizMercuri() {
    const seccio = document.querySelector('[data-viz="mercuri"]');
    const canvas = document.getElementById('canvasMercuri');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Excentricitat i avanç exagerats: amb els valors reals de Mercuri
    // (e = 0,206 i 43″ per segle) el dibuix seria un cercle i no es veuria res.
    const EXC = 0.5;
    const AVANC = Math.PI / 3;         // 60° per òrbita
    const ORBITES = 6;                 // 6 × 60° = una volta sencera

    function dibuixa() {
      setupCanvas(canvas, ctx);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const a = Math.min(w * 0.26, h * 0.3);
      const p = a * (1 - EXC * EXC);
      const k = TAU / (TAU + AVANC);   // el periheli avança AVANC cada òrbita
      const radi = th => p / (1 + EXC * Math.cos(k * th));
      const punt = th => [cx + radi(th) * Math.cos(th), cy - radi(th) * Math.sin(th)];

      // Eixos majors de les dues primeres òrbites
      ctx.save();
      ctx.strokeStyle = '#0e7490';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      [0, AVANC].forEach(ang => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + a * 1.7 * Math.cos(ang), cy - a * 1.7 * Math.sin(ang));
        ctx.stroke();
      });
      ctx.restore();

      ctx.lineWidth = 1.8;
      for (let orbita = 0; orbita < ORBITES; orbita++) {
        const th0 = (orbita * TAU) / k;
        const th1 = ((orbita + 1) * TAU) / k;
        ctx.strokeStyle = orbita === 0
          ? '#4f46e5'
          : 'rgba(79, 70, 229, ' + (0.28 + (0.34 * orbita) / (ORBITES - 1)).toFixed(2) + ')';
        ctx.beginPath();
        for (let th = th0; th <= th1; th += 0.02) {
          const [x, y] = punt(th);
          if (th === th0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Arc de l'avanç, dins de la zona buida que queda al voltant del Sol
      ctx.strokeStyle = '#0e7490';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, a * 0.3, 0, -AVANC, true);
      ctx.stroke();

      // Periheli de cada òrbita
      for (let orbita = 0; orbita < ORBITES; orbita++) {
        const [x, y] = punt((orbita * TAU) / k);
        ctx.fillStyle = '#0e7490';
        ctx.beginPath();
        ctx.arc(x, y, orbita === 0 ? 5 : 3.5, 0, TAU);
        ctx.fill();
      }

      // El Sol
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Etiquetes, sempre fora de la roseta
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillStyle = COLOR.text;
      ctx.textAlign = 'left';
      ctx.fillText('Sol', cx + 12, cy + 18);
      ctx.fillText('●  periheli de cada òrbita', 14, 22);

      ctx.fillStyle = '#0e7490';
      const rEix = a * 1.7 + 7;
      ctx.textAlign = 'left';
      ctx.fillText('1a òrbita', cx + rEix, cy + 4);
      ctx.fillText('2a òrbita', cx + rEix * Math.cos(AVANC) + 4, cy - rEix * Math.sin(AVANC));
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillText('Δφ', cx + a * 0.5 * Math.cos(AVANC / 2) + 4, cy - a * 0.5 * Math.sin(AVANC / 2) + 8);
    }

    registra(seccio, dibuixa);
  }

  // --- Filtres per branca -------------------------------------------------

  const NOTES = {
    tots: 'Setze indicis, del 1687 al 1938. Fixa\'t que entre el 1859 i el 1900 s\'acumulen problemes de les tres branques a la vegada: no van arribar en blocs ordenats.',
    quantica: 'Tots apunten cap al mateix lloc: a escala atòmica l\'energia no és contínua i els objectes no són ni ones ni partícules.',
    relativitat: 'Tots giren al voltant de la velocitat de la llum i de la pregunta «respecte de què?».',
    nuclear: 'Comencen com un problema de geologia i d\'astronomia, i acaben dins del nucli atòmic.'
  };

  function iniciaFiltres() {
    const chips = Array.from(document.querySelectorAll('.chip[data-filtre]'));
    const estat = document.getElementById('filtreEstat');
    const items = Array.from(document.querySelectorAll('#cronologia .indici'));
    const total = items.filter(el => el.tagName === 'ARTICLE').length;

    function aplica(filtre) {
      items.forEach(el => {
        const visible = filtre === 'tots' || el.dataset.branca === filtre;
        el.hidden = !visible;
      });
      chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filtre === filtre)));
      const mostrats = items.filter(el => el.tagName === 'ARTICLE' && !el.hidden).length;
      estat.innerHTML = 'Mostrant <strong>' + mostrats + ' de ' + total + '</strong> indicis. ' + NOTES[filtre];
      redibuixaTot();
    }

    chips.forEach(c => c.addEventListener('click', () => aplica(c.dataset.filtre)));
    aplica('tots');
  }

  function iniciaResolucions() {
    const btn = document.getElementById('btnResolucions');
    let obertes = false;
    btn.addEventListener('click', () => {
      obertes = !obertes;
      document.querySelectorAll('.resolucio').forEach(d => { d.open = obertes; });
      btn.textContent = obertes ? 'Plega totes les resolucions' : 'Desplega totes les resolucions';
    });
  }

  // --- Arrencada ----------------------------------------------------------

  renderMath();
  vizSol();
  vizTerra();
  vizEspectres();
  vizCosNegre();
  vizMercuri();
  vizRelativista();
  iniciaResolucions();
  iniciaFiltres();

  let tempsRedibuix = null;
  window.addEventListener('resize', () => {
    clearTimeout(tempsRedibuix);
    tempsRedibuix = setTimeout(redibuixaTot, 150);
  });
})();
