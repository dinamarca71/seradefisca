(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function tex(src) {
    if (!window.katex) return src;
    return katex.renderToString(src, { throwOnError: false, strict: 'ignore' });
  }

  function renderMath(root = document) {
    root.querySelectorAll('[data-math]').forEach(el => {
      const src = el.getAttribute('data-math');
      if (!window.katex) { el.textContent = src; return; }
      katex.render(src, el, { throwOnError: false, strict: 'ignore', displayMode: false });
    });
  }

  function fmt(x, sig = 3) {
    if (x === 0) return '0';
    return Number(x.toPrecision(sig)).toLocaleString('ca-ES', {
      maximumSignificantDigits: sig,
      minimumSignificantDigits: sig,
      useGrouping: false
    });
  }

  function sciTex(x, sig = 3) {
    let exp = Math.floor(Math.log10(Math.abs(x)));
    let mant = Number((x / 10 ** exp).toPrecision(sig));
    if (Math.abs(mant) >= 10) { mant /= 10; exp += 1; }
    return `${texNum(fmt(mant, sig))}\\cdot10^{${exp}}`;
  }

  const texNum = s => s.replace(',', '{,}');

  /* 1 · Nucli de l'esquema d'escales */
  function dibuixaNucli() {
    const g = document.getElementById('nucliDibuix');
    const cx = 360, cy = 88, r = 13;
    const pos = [
      [0, -45], [39, -22.5], [-39, -22.5], [13, -22.5], [-13, -22.5],
      [26, 0], [-26, 0], [0, 0], [39, 22.5], [-39, 22.5],
      [13, 22.5], [-13, 22.5], [0, 45]
    ];
    pos.forEach(([dx, dy], i) => {
      const esProto = i % 2 === 0;
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', cx + dx);
      c.setAttribute('cy', cy + dy);
      c.setAttribute('r', r);
      c.setAttribute('class', esProto ? 'proto' : 'neutro');
      const t = document.createElementNS(SVG_NS, 'text');
      t.setAttribute('x', cx + dx);
      t.setAttribute('y', cy + dy + 4);
      t.setAttribute('class', 'et-nucleo');
      t.textContent = esProto ? 'p' : 'n';
      g.append(c, t);
    });
  }

  /* 3 · Taula del Model Estàndard */
  const TIPUS = {
    quark: 'Quark · fermió',
    lepto: 'Leptó · fermió',
    boso: 'Bosó de gauge',
    higgs: 'Bosó escalar'
  };

  const PARTICULES = [
    { id: 'u', sym: 'u', nom: 'up', tipus: 'quark', gen: 1, row: 2, col: 1, q: '+2/3 e', spin: '1/2', massa: '2,16 MeV/c²',
      desc: '1968 (SLAC)', text: 'El quark més lleuger. Dos u i un d formen el protó.' },
    { id: 'c', sym: 'c', nom: 'charm', tipus: 'quark', gen: 2, row: 2, col: 2, q: '+2/3 e', spin: '1/2', massa: '1,27 GeV/c²',
      desc: '1974 (SLAC i Brookhaven)', text: 'Predit pel Model Estàndard abans de trobar-lo, dins de la partícula J/ψ.' },
    { id: 't', sym: 't', nom: 'top', tipus: 'quark', gen: 3, row: 2, col: 3, q: '+2/3 e', spin: '1/2', massa: '173 GeV/c²',
      desc: '1995 (Fermilab)', text: 'La partícula elemental més pesant coneguda: gairebé tanta massa com un àtom d’or. Es desintegra abans de poder formar hadrons.' },
    { id: 'd', sym: 'd', nom: 'down', tipus: 'quark', gen: 1, row: 3, col: 1, q: '−1/3 e', spin: '1/2', massa: '4,70 MeV/c²',
      desc: '1968 (SLAC)', text: 'Un u i dos d formen el neutró. En la desintegració β⁻ un d es converteix en u.' },
    { id: 's', sym: 's', nom: 'strange', tipus: 'quark', gen: 2, row: 3, col: 2, q: '−1/3 e', spin: '1/2', massa: '93,5 MeV/c²',
      desc: '1947 (kaons en raigs còsmics)', text: 'Explica les partícules «estranyes» (kaons, Λ) que vivien massa temps per a la seva massa.' },
    { id: 'b', sym: 'b', nom: 'bottom', tipus: 'quark', gen: 3, row: 3, col: 3, q: '−1/3 e', spin: '1/2', massa: '4,18 GeV/c²',
      desc: '1977 (Fermilab)', text: 'Les seves desintegracions s’estudien per entendre l’asimetria entre matèria i antimatèria.' },
    { id: 'e', sym: 'e^-', nom: 'electró', tipus: 'lepto', gen: 1, row: 4, col: 1, q: '−1 e', spin: '1/2', massa: '0,511 MeV/c²',
      desc: '1897 (J. J. Thomson)', text: 'Estable. Forma l’escorça dels àtoms: és el responsable de la química i del corrent elèctric.' },
    { id: 'mu', sym: '\\mu^-', nom: 'muó', tipus: 'lepto', gen: 2, row: 4, col: 2, q: '−1 e', spin: '1/2', massa: '105,7 MeV/c²',
      desc: '1936 (raigs còsmics)', text: 'Un «electró pesant» de 2,2 μs de vida mitjana. N’arriben uns 10 000 per metre quadrat i minut a la superfície de la Terra: sense la dilatació del temps relativista, no hi arribarien.' },
    { id: 'tau', sym: '\\tau^-', nom: 'tau', tipus: 'lepto', gen: 3, row: 4, col: 3, q: '−1 e', spin: '1/2', massa: '1,777 GeV/c²',
      desc: '1975 (SLAC)', text: 'El leptó més pesant; viu només 3·10⁻¹³ s.' },
    { id: 'nue', sym: '\\nu_e', nom: 'neutrí e', tipus: 'lepto', gen: 1, row: 5, col: 1, q: '0', spin: '1/2', massa: '< 1 eV/c²',
      desc: '1956 (al costat d’un reactor)', text: 'Postulat per Pauli el 1930 per salvar la conservació de l’energia en la desintegració β. Gairebé no interacciona: cada segon ens travessen uns 6·10¹⁰ neutrins solars per centímetre quadrat.' },
    { id: 'numu', sym: '\\nu_\\mu', nom: 'neutrí μ', tipus: 'lepto', gen: 2, row: 5, col: 2, q: '0', spin: '1/2', massa: '< 1 eV/c²',
      desc: '1962 (Brookhaven)', text: 'Els neutrins canvien de tipus mentre viatgen (oscil·lacions): la prova que tenen massa, encara que molt petita i no mesurada.' },
    { id: 'nutau', sym: '\\nu_\\tau', nom: 'neutrí τ', tipus: 'lepto', gen: 3, row: 5, col: 3, q: '0', spin: '1/2', massa: '< 1 eV/c²',
      desc: '2000 (Fermilab)', text: 'L’últim fermió del Model Estàndard a ser detectat directament.' },
    { id: 'g', sym: 'g', nom: 'gluó', tipus: 'boso', row: 2, col: 4, q: '0', spin: '1', massa: '0',
      desc: '1979 (DESY, Hamburg)', text: 'Portador de la interacció forta; n’hi ha 8 tipus. A diferència del fotó, els gluons tenen color i interaccionen entre ells: per això la força no s’afebleix amb la distància i confina els quarks.' },
    { id: 'gamma', sym: '\\gamma', nom: 'fotó', tipus: 'boso', row: 3, col: 4, q: '0', spin: '1', massa: '0',
      desc: '1905 (Einstein, efecte fotoelèctric)', text: 'Quàntum del camp electromagnètic, amb energia E = hf. És el bosó que coneixeu del tema de física quàntica.' },
    { id: 'Z', sym: 'Z^0', nom: 'bosó Z', tipus: 'boso', row: 4, col: 4, q: '0', spin: '1', massa: '91,2 GeV/c²',
      desc: '1983 (CERN)', text: 'Neutre: media interaccions febles en què no canvia la càrrega, com la dispersió de neutrins.' },
    { id: 'W', sym: 'W^\\pm', nom: 'bosó W', tipus: 'boso', row: 5, col: 4, q: '±1 e', spin: '1', massa: '80,4 GeV/c²',
      desc: '1983 (CERN)', text: 'El bosó de la desintegració β: canvia el sabor d’un quark (d → u + W⁻). La seva gran massa fa que la interacció feble tingui tan poc abast.' },
    { id: 'H', sym: 'H', nom: 'Higgs', tipus: 'higgs', row: 2, col: 5, q: '0', spin: '0', massa: '125 GeV/c²',
      desc: '2012 (CERN, LHC)', text: 'Excitació del camp de Higgs. La interacció amb aquest camp dona massa a W, Z, quarks i leptons carregats. Però només explica un 1 % de la massa del protó: la resta és energia dels quarks i gluons confinats (E = mc²).' }
  ];

  function construeixTaula() {
    const grid = document.getElementById('smGrid');
    const cap = (txt, col, gen1 = false) => {
      const d = document.createElement('div');
      d.className = 'sm-head' + (gen1 ? ' gen1' : '');
      d.style.gridColumn = col + 1;
      d.style.gridRow = 1;
      d.innerHTML = txt;
      grid.append(d);
    };
    cap('I<br>matèria ordinària', 1, true);
    cap('II', 2);
    cap('III', 3);
    cap('Bosons de gauge<br>(espín 1)', 4);
    cap('Bosó escalar<br>(espín 0)', 5);

    [['Quarks', 'quark', '2 / 4'], ['Leptons', 'lepto', '4 / 6']].forEach(([txt, cls, rows]) => {
      const d = document.createElement('div');
      d.className = 'sm-row-label ' + cls;
      d.style.gridColumn = 1;
      d.style.gridRow = rows;
      d.textContent = txt;
      grid.append(d);
    });

    PARTICULES.forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `particula ${p.tipus}` + (p.gen === 1 ? ' gen1' : '');
      b.style.gridColumn = p.col + 1;
      b.style.gridRow = p.row;
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', `${p.nom}, ${p.massa}` + (p.gen === 1 ? ', primera generació' : ''));
      b.innerHTML = `<span class="sym">${tex(p.sym)}</span><span class="nom">${p.nom}</span><span class="massa">${p.massa}</span>`;
      b.addEventListener('click', () => mostraParticula(p.id));
      b.dataset.id = p.id;
      grid.append(b);
    });
  }

  function mostraParticula(id) {
    const p = PARTICULES.find(x => x.id === id);
    document.querySelectorAll('.particula').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.id === id));
    });
    const genTxt = p.gen ? `${p.gen}a generació` : 'Sense generació';
    document.getElementById('smDetall').innerHTML = `
      <div class="cap">
        ${tex(p.sym)}
        <div><h3>${p.nom[0].toUpperCase() + p.nom.slice(1)}</h3><small>${TIPUS[p.tipus]} · ${genTxt}</small></div>
      </div>
      <dl class="propietats">
        <dt>Càrrega</dt><dd>${p.q}</dd>
        <dt>Espín</dt><dd>${p.spin}</dd>
        <dt>Massa</dt><dd>${p.massa}</dd>
        <dt>Descoberta</dt><dd>${p.desc}</dd>
      </dl>
      <p>${p.text}</p>`;
  }

  /* 5 · Constructor d'hadrons */
  const QUARKS = {
    u: { tex: 'u', terc: 2, m: 2.16, cls: 'q-u', etiqueta: 'u' },
    d: { tex: 'd', terc: -1, m: 4.70, cls: 'q-d', etiqueta: 'd' },
    ub: { tex: '\\bar u', terc: -2, m: 2.16, cls: 'q-u anti', etiqueta: 'ū' },
    db: { tex: '\\bar d', terc: 1, m: 4.70, cls: 'q-d anti', etiqueta: 'd̄' }
  };

  const DELTA = { tipus: 'Barió (ressonància)', massa: 1232, vida: '≈ 5,6·10⁻²⁴ s' };
  const HADRONS = {
    '2100': { nom: 'Protó', tex: 'p', tipus: 'Barió', massa: 938.3, vida: 'estable (> 10³⁴ anys)',
      nota: 'El nucli de l’hidrogen. És l’únic hadró estable lliure.' },
    '1200': { nom: 'Neutró', tex: 'n', tipus: 'Barió', massa: 939.6, vida: '879 s lliure (≈ 15 min)',
      nota: 'Lliure es desintegra per β⁻ (secció 7); dins d’un nucli estable pot durar indefinidament.' },
    '3000': { ...DELTA, nom: 'Delta doble positiva', tex: '\\Delta^{++}',
      nota: 'Tres quarks u en el «mateix» estat: semblava violar el principi de Pauli. Va ser una de les pistes per inventar la càrrega de color: cada quark té un color diferent.' },
    '0300': { ...DELTA, nom: 'Delta negativa', tex: '\\Delta^{-}',
      nota: 'La «germana» de la Δ⁺⁺ amb tres quarks d. Existeix, però es desintegra gairebé a l’instant.' },
    '0021': { nom: 'Antiprotó', tex: '\\bar p', tipus: 'Antibarió', massa: 938.3, vida: 'estable en el buit',
      nota: 'Descobert el 1955 a Berkeley. En contacte amb matèria s’aniquila (secció 8).' },
    '0012': { nom: 'Antineutró', tex: '\\bar n', tipus: 'Antibarió', massa: 939.6, vida: '879 s lliure',
      nota: 'Càrrega total zero, com el neutró, però fet d’antiquarks: no és el mateix que el neutró.' },
    '0030': { ...DELTA, nom: 'Anti-Delta', tex: '\\bar\\Delta^{--}', tipus: 'Antibarió (ressonància)',
      nota: 'L’antipartícula de la Δ⁺⁺.' },
    '0003': { ...DELTA, nom: 'Anti-Delta', tex: '\\bar\\Delta^{+}', tipus: 'Antibarió (ressonància)',
      nota: 'L’antipartícula de la Δ⁻.' },
    '1001': { nom: 'Pió positiu', tex: '\\pi^+', tipus: 'Mesó', massa: 139.6, vida: '2,60·10⁻⁸ s',
      nota: 'Yukawa el va predir el 1935 com a portador de la força nuclear entre nucleons; descobert el 1947 als raigs còsmics. Es desintegra en μ⁺ + νμ.' },
    '0110': { nom: 'Pió negatiu', tex: '\\pi^-', tipus: 'Mesó', massa: 139.6, vida: '2,60·10⁻⁸ s',
      nota: 'L’antipartícula del π⁺.' },
    '1010': { nom: 'Pió neutre', tex: '\\pi^0', tipus: 'Mesó', massa: 135.0, vida: '8,5·10⁻¹⁷ s',
      nota: 'El π⁰ real és una superposició quàntica de uū i dd̄. És la seva pròpia antipartícula i es desintegra en dos fotons.' }
  };
  HADRONS['0101'] = HADRONS['1010'];

  let seleccio = [];

  function signeTerc(t) {
    const s = t > 0 ? '+' : '-';
    return `\\left(${s}\\tfrac{${Math.abs(t)}}{3}\\right)`;
  }

  function carregaTex(terc) {
    if (terc === 0) return '0';
    if (terc % 3 === 0) return `${terc > 0 ? '+' : '-'}${Math.abs(terc / 3)}\\,e`;
    return `${terc > 0 ? '+' : '-'}\\tfrac{${Math.abs(terc)}}{3}\\,e`;
  }

  function actualitzaBuilder() {
    const slots = document.getElementById('slots');
    slots.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const s = document.createElement('div');
      const q = seleccio[i] && QUARKS[seleccio[i]];
      s.className = 'slot' + (q ? ` ple ${q.cls}` : '');
      s.textContent = q ? q.etiqueta : '·';
      slots.append(s);
    }
    document.querySelectorAll('.quark-btn').forEach(b => { b.disabled = seleccio.length >= 3; });
    document.getElementById('btnTreu').disabled = seleccio.length === 0;
    document.getElementById('btnBuida').disabled = seleccio.length === 0;

    const steps = document.getElementById('chargeSteps');
    const info = document.getElementById('hadronInfo');
    if (seleccio.length === 0) {
      steps.innerHTML = tex('Q=\\sum q_i');
      info.className = 'hadron-info';
      info.innerHTML = '<p>Tria quarks o antiquarks amb els botons de l’esquerra.</p>';
      return;
    }

    const terc = seleccio.reduce((a, k) => a + QUARKS[k].terc, 0);
    const nAnti = seleccio.filter(k => k.endsWith('b')).length;
    const nQ = seleccio.length - nAnti;
    const sumaTerc = seleccio.map(k => signeTerc(QUARKS[k].terc)).join('+');
    const bTex = `B=\\dfrac{n_q-n_{\\bar q}}{3}=\\dfrac{${nQ}-${nAnti}}{3}=${(nQ - nAnti) % 3 === 0 ? (nQ - nAnti) / 3 : `\\tfrac{${nQ - nAnti}}{3}`}`;
    steps.innerHTML = `<div>${tex(`Q=${sumaTerc}=\\tfrac{${terc}}{3}\\,e=${carregaTex(terc)}`)}</div>
      <div>${tex(bTex)}</div>`;

    const clau = ['u', 'd', 'ub', 'db'].map(k => seleccio.filter(x => x === k).length).join('');
    const h = HADRONS[clau];
    if (h) {
      const mq = seleccio.reduce((a, k) => a + QUARKS[k].m, 0);
      info.className = 'hadron-info valid';
      info.innerHTML = `
        <p class="estat">✓ Existeix: ${tex(h.tex)} · ${h.nom}</p>
        <dl class="propietats">
          <dt>Tipus</dt><dd>${h.tipus}</dd>
          <dt>Massa</dt><dd>${fmt(h.massa, 4)} MeV/c²</dd>
          <dt>Vida mitjana</dt><dd>${h.vida}</dd>
          <dt>Massa dels quarks</dt><dd>${fmt(mq, 3)} MeV/c², només un ${fmt(100 * mq / h.massa, 3)} % del total</dd>
        </dl>
        <p>${h.nota}</p>`;
      return;
    }

    info.className = 'hadron-info invalid';
    let motiu;
    if (seleccio.length === 1) {
      motiu = 'Un quark sol no pot existir lliure: és el confinament de color. Si intentem separar-lo, l’energia del camp de gluons crea nous parells quark–antiquark.';
    } else if (seleccio.length === 2 && (nAnti === 0 || nQ === 0)) {
      motiu = 'Dos quarks (o dos antiquarks) no poden formar una combinació «blanca» de color: no és cap hadró.';
    } else {
      motiu = 'Barrejar quarks i antiquarks en un grup de tres no deixa el color neutre: no és cap hadró.';
    }
    const carregaTxt = terc % 3 === 0 ? '' : ' Fixa’t, a més, que la càrrega seria fraccionària: mai no s’ha observat cap partícula lliure així.';
    info.innerHTML = `<p class="estat">✗ No existeix com a partícula lliure</p><p>${motiu}${carregaTxt}</p>`;
  }

  function iniciaBuilder() {
    document.querySelectorAll('.quark-btn').forEach(b => {
      b.addEventListener('click', () => {
        if (seleccio.length < 3) { seleccio.push(b.dataset.q); actualitzaBuilder(); }
      });
    });
    document.getElementById('btnTreu').addEventListener('click', () => { seleccio.pop(); actualitzaBuilder(); });
    document.getElementById('btnBuida').addEventListener('click', () => { seleccio = []; actualitzaBuilder(); });
    actualitzaBuilder();
  }

  /* 8 · Aniquilació e⁻ + e⁺ → 2γ */
  const ME_C2 = 0.51099895;        // MeV
  const HC = 1.23984198;           // MeV·pm
  const H_MEV = 4.135667696e-21;   // MeV·s

  function ona(x0, x1, y0, lambdaPx, amp) {
    const dir = Math.sign(x1 - x0);
    let d = `M${x0} ${y0}`;
    for (let s = 1; s <= Math.abs(x1 - x0); s++) {
      const y = y0 - amp * Math.sin(2 * Math.PI * s / lambdaPx);
      d += ` L${(x0 + dir * s).toFixed(1)} ${y.toFixed(2)}`;
    }
    return d;
  }

  function actualitzaAniquilacio() {
    const ec = Number(document.getElementById('ecSlider').value);
    const eg = ME_C2 + ec;
    const etot = 2 * eg;
    const lambda = HC / eg;
    const f = eg / H_MEV;
    const gamma = 1 + ec / ME_C2;
    const beta = Math.sqrt(1 - 1 / (gamma * gamma));

    document.getElementById('ecVal').textContent = `${ec.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MeV`;
    document.querySelectorAll('[data-ec]').forEach(b => {
      b.setAttribute('aria-pressed', String(Math.abs(Number(b.dataset.ec) - ec) < 0.005));
    });

    const egS = fmt(eg, 4), lamS = fmt(lambda, 4), etotS = fmt(etot, 4);
    document.getElementById('aniqMetrics').innerHTML = `
      <div class="metric"><b>Energia de cada fotó</b><span>${egS} MeV</span></div>
      <div class="metric"><b>Longitud d’ona</b><span>${lamS} pm</span></div>
      <div class="metric"><b>Freqüència</b><span>${tex(sciTex(f) + '\\ \\mathrm{Hz}')}</span></div>
      <div class="metric"><b>Velocitat inicial de cada partícula</b><span>${beta > 0 ? `v = ${fmt(beta, 3)} c` : 'en repòs'}</span></div>
      <div class="metric"><b>Energia total alliberada</b><span>${etotS} MeV</span></div>
      <div class="metric"><b>Part que ve de la massa en repòs</b><span>${fmt(100 * ME_C2 / eg, 3)} %</span></div>`;

    const ecS = ec.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const passos = [
      `E_\\text{total}=2\\,(m_ec^2+E_\\mathrm{c})=2\\,(0{,}511+${texNum(ecS)})\\ \\mathrm{MeV}=${texNum(etotS)}\\ \\mathrm{MeV}`,
      `\\vec p_\\text{total}=\\vec 0\\ \\Rightarrow\\ E_\\gamma=\\dfrac{E_\\text{total}}{2}=${texNum(egS)}\\ \\mathrm{MeV}`,
      `\\lambda=\\dfrac{hc}{E_\\gamma}=\\dfrac{1{,}240\\ \\mathrm{MeV\\cdot pm}}{${texNum(egS)}\\ \\mathrm{MeV}}=${texNum(lamS)}\\ \\mathrm{pm}`,
      `f=\\dfrac{E_\\gamma}{h}=\\dfrac{${texNum(egS)}\\ \\mathrm{MeV}}{4{,}136\\cdot10^{-21}\\ \\mathrm{MeV\\cdot s}}=${sciTex(f)}\\ \\mathrm{Hz}`
    ];
    document.getElementById('aniqSteps').innerHTML = '<h3>Desenvolupament</h3>' +
      passos.map(p => `<div class="formula-pas">${tex(p)}</div>`).join('');

    const lambdaPx = 34 * Math.sqrt(ME_C2 / eg);
    document.getElementById('photonL').setAttribute('d', ona(383, 278, 85, lambdaPx, 9));
    document.getElementById('photonR').setAttribute('d', ona(407, 512, 85, lambdaPx, 9));

    const llarg = 15 + 55 * beta;
    const aE = document.getElementById('arrowE');
    const aP = document.getElementById('arrowP');
    aE.setAttribute('x2', 48 + llarg);
    aP.setAttribute('x2', 202 - llarg);
    const visible = beta > 0.01 ? '1' : '0';
    aE.style.opacity = visible;
    aP.style.opacity = visible;
    document.getElementById('aniqPeu').textContent = `Eγ = ${egS} MeV · λ = ${lamS} pm`;
  }

  function iniciaAniquilacio() {
    const slider = document.getElementById('ecSlider');
    slider.addEventListener('input', actualitzaAniquilacio);
    document.querySelectorAll('[data-ec]').forEach(b => {
      b.addEventListener('click', () => { slider.value = b.dataset.ec; actualitzaAniquilacio(); });
    });
    actualitzaAniquilacio();
  }

  renderMath();
  dibuixaNucli();
  construeixTaula();
  mostraParticula('u');
  iniciaBuilder();
  iniciaAniquilacio();
})();
