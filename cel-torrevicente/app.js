'use strict';

const LOCATION = Object.freeze({
  name: 'Torrevicente',
  latitude: 41.335278,
  longitude: -2.941389,
  elevation: 1202,
  timezone: 'Europe/Madrid'
});

const STORAGE = Object.freeze({
  challenges: 'torrevicente.challenges.v1',
  record: 'torrevicente.record.v1',
  horizon: 'torrevicente.horizon.v1'
});

const ECLIPSE = Object.freeze({
  date: '2026-08-12',
  start: '19:35:07',
  totalStart: '20:29:49',
  maximum: '20:30:40',
  totalEnd: '20:31:31',
  end: '21:12:00',
  seconds: Object.freeze({ start: 0, totalStart: 3282, maximum: 3333, totalEnd: 3384, end: 5813 })
});

const stars = [
  { id:'polaris', name:'Estrella Polar', ra:2.5303, dec:89.2641, mag:1.98, constellation:'Óssa Menor', distance:'433 anys llum', fact:'Marca gairebé exactament el nord. No és l’estrella més brillant del cel.' },
  { id:'kochab', name:'Kochab', ra:14.8451, dec:74.1555, mag:2.08, constellation:'Óssa Menor' },
  { id:'pherkad', name:'Pherkad', ra:15.3455, dec:71.8340, mag:3.00, constellation:'Óssa Menor' },
  { id:'yildun', name:'Yildun', ra:17.5369, dec:86.5864, mag:4.35, constellation:'Óssa Menor' },
  { id:'epsumi', name:'ε UMi', ra:16.7662, dec:82.0373, mag:4.23, constellation:'Óssa Menor' },
  { id:'zetumi', name:'ζ UMi', ra:15.7343, dec:77.7945, mag:4.32, constellation:'Óssa Menor' },
  { id:'etaumi', name:'η UMi', ra:16.2917, dec:75.7553, mag:4.95, constellation:'Óssa Menor' },

  { id:'dubhe', name:'Dubhe', ra:11.0621, dec:61.7510, mag:1.79, constellation:'Óssa Major', distance:'123 anys llum', fact:'Juntament amb Merak assenyala el camí cap a l’Estrella Polar.' },
  { id:'merak', name:'Merak', ra:11.0307, dec:56.3824, mag:2.37, constellation:'Óssa Major' },
  { id:'phecda', name:'Phecda', ra:11.8972, dec:53.6948, mag:2.44, constellation:'Óssa Major' },
  { id:'megrez', name:'Megrez', ra:12.2570, dec:57.0326, mag:3.31, constellation:'Óssa Major' },
  { id:'alioth', name:'Alioth', ra:12.9005, dec:55.9598, mag:1.76, constellation:'Óssa Major' },
  { id:'mizar', name:'Mizar', ra:13.3987, dec:54.9254, mag:2.23, constellation:'Óssa Major', distance:'83 anys llum', fact:'Amb bona vista pots distingir al costat la feble Alcor: una prova visual clàssica.' },
  { id:'alkaid', name:'Alkaid', ra:13.7923, dec:49.3133, mag:1.86, constellation:'Óssa Major' },

  { id:'caph', name:'Caph', ra:0.1529, dec:59.1498, mag:2.28, constellation:'Cassiopea' },
  { id:'schedar', name:'Schedar', ra:0.6751, dec:56.5373, mag:2.24, constellation:'Cassiopea' },
  { id:'navi', name:'Navi', ra:0.9451, dec:60.7167, mag:2.15, constellation:'Cassiopea' },
  { id:'ruchbah', name:'Ruchbah', ra:1.4303, dec:60.2353, mag:2.68, constellation:'Cassiopea' },
  { id:'segin', name:'Segin', ra:1.9066, dec:63.6701, mag:3.35, constellation:'Cassiopea' },

  { id:'vega', name:'Vega', ra:18.6156, dec:38.7837, mag:0.03, constellation:'Lira', distance:'25 anys llum', fact:'És una de les estrelles més brillants i un vèrtex del Triangle d’Estiu.' },
  { id:'sheliak', name:'Sheliak', ra:18.8347, dec:33.3627, mag:3.52, constellation:'Lira' },
  { id:'sulafat', name:'Sulafat', ra:18.9824, dec:32.6896, mag:3.25, constellation:'Lira' },
  { id:'deltalyr', name:'δ Lyr', ra:18.9084, dec:36.8986, mag:4.30, constellation:'Lira' },

  { id:'deneb', name:'Deneb', ra:20.6905, dec:45.2803, mag:1.25, constellation:'Cigne', distance:'aprox. 2.600 anys llum', fact:'Tot i ser molt llunyana, brilla tant perquè és una supergegant extraordinàriament lluminosa.' },
  { id:'sadr', name:'Sadr', ra:20.3705, dec:40.2567, mag:2.23, constellation:'Cigne' },
  { id:'gienah', name:'Gienah', ra:20.7702, dec:33.9703, mag:2.46, constellation:'Cigne' },
  { id:'deltacyg', name:'δ Cyg', ra:19.7496, dec:45.1308, mag:2.87, constellation:'Cigne' },
  { id:'albireo', name:'Albireo', ra:19.5120, dec:27.9597, mag:3.05, constellation:'Cigne', distance:'aprox. 430 anys llum', fact:'Amb telescopi és una de les dobles més boniques: una estrella daurada i una de blavosa.' },

  { id:'altair', name:'Altair', ra:19.8464, dec:8.8683, mag:0.77, constellation:'Àguila', distance:'16,7 anys llum', fact:'És molt propera i gira tan de pressa que està lleugerament aixafada pels pols.' },
  { id:'tarazed', name:'Tarazed', ra:19.7709, dec:10.6133, mag:2.72, constellation:'Àguila' },
  { id:'alshain', name:'Alshain', ra:19.9219, dec:6.4068, mag:3.71, constellation:'Àguila' },

  { id:'acrab', name:'Acrab', ra:16.0906, dec:-19.8054, mag:2.62, constellation:'Escorpí' },
  { id:'dschubba', name:'Dschubba', ra:16.0056, dec:-22.6217, mag:2.32, constellation:'Escorpí' },
  { id:'antares', name:'Antares', ra:16.4901, dec:-26.4319, mag:1.06, constellation:'Escorpí', distance:'aprox. 550 anys llum', fact:'El seu color vermellós va fer que el seu nom signifiqués “rival de Mart”.' },
  { id:'alniyat', name:'Alniyat', ra:16.3531, dec:-25.5928, mag:2.89, constellation:'Escorpí' },
  { id:'epssco', name:'ε Sco', ra:16.8361, dec:-34.2932, mag:2.29, constellation:'Escorpí' },
  { id:'sargas', name:'Sargas', ra:17.6220, dec:-42.9978, mag:1.86, constellation:'Escorpí' },
  { id:'shaula', name:'Shaula', ra:17.5601, dec:-37.1038, mag:1.62, constellation:'Escorpí' },
  { id:'lesath', name:'Lesath', ra:17.5127, dec:-37.2958, mag:2.70, constellation:'Escorpí' },

  { id:'kausaus', name:'Kaus Australis', ra:18.4029, dec:-34.3846, mag:1.79, constellation:'Sagitari' },
  { id:'kausmed', name:'Kaus Media', ra:18.3499, dec:-29.8281, mag:2.72, constellation:'Sagitari' },
  { id:'kausbor', name:'Kaus Borealis', ra:18.4662, dec:-25.4217, mag:2.81, constellation:'Sagitari' },
  { id:'nunki', name:'Nunki', ra:18.9211, dec:-26.2967, mag:2.05, constellation:'Sagitari' },
  { id:'ascella', name:'Ascella', ra:19.0435, dec:-29.8801, mag:2.60, constellation:'Sagitari' },
  { id:'alnasl', name:'Alnasl', ra:18.0968, dec:-30.4241, mag:2.98, constellation:'Sagitari' },

  { id:'arcturus', name:'Arcturus', ra:14.2610, dec:19.1824, mag:-0.05, constellation:'Bover', distance:'36,7 anys llum', fact:'És una gegant taronja i una de les estrelles més brillants del cel del nord.' },
  { id:'alphecca', name:'Alphecca', ra:15.5781, dec:26.7147, mag:2.23, constellation:'Corona Boreal' },
  { id:'rasalgethi', name:'Rasalgethi', ra:17.2441, dec:14.3903, mag:3.48, constellation:'Hèrcules' },
  { id:'kornephoros', name:'Kornephoros', ra:16.5037, dec:21.4896, mag:2.77, constellation:'Hèrcules' },
  { id:'zetaher', name:'ζ Her', ra:16.6881, dec:31.6030, mag:2.81, constellation:'Hèrcules' },

  { id:'alpheratz', name:'Alpheratz', ra:0.1398, dec:29.0904, mag:2.06, constellation:'Andròmeda' },
  { id:'mirach', name:'Mirach', ra:1.1622, dec:35.6206, mag:2.05, constellation:'Andròmeda' },
  { id:'almach', name:'Almach', ra:2.0649, dec:42.3297, mag:2.10, constellation:'Andròmeda' },
  { id:'markab', name:'Markab', ra:23.0793, dec:15.2053, mag:2.49, constellation:'Pegàs' },
  { id:'scheat', name:'Scheat', ra:23.0629, dec:28.0828, mag:2.42, constellation:'Pegàs' },
  { id:'algenib', name:'Algenib', ra:0.2206, dec:15.1836, mag:2.84, constellation:'Pegàs' },
  { id:'mirfak', name:'Mirfak', ra:3.4054, dec:49.8612, mag:1.79, constellation:'Perseu' },
  { id:'algol', name:'Algol', ra:3.1361, dec:40.9556, mag:2.12, constellation:'Perseu', distance:'93 anys llum', fact:'És una estrella variable: la seva brillantor baixa periòdicament perquè una companya l’eclipsa.' },
  { id:'capella', name:'Capella', ra:5.2782, dec:45.9980, mag:0.08, constellation:'Cotxer' },
  { id:'fomalhaut', name:'Fomalhaut', ra:22.9608, dec:-29.6222, mag:1.16, constellation:'Peix Austral', distance:'25 anys llum', fact:'És una estrella jove envoltada per un disc de pols.' },
  { id:'spica', name:'Spica', ra:13.4199, dec:-11.1613, mag:0.98, constellation:'Verge' }
];

const starById = Object.fromEntries(stars.map(star => [star.id, star]));

const constellations = [
  { id:'ursaMajor', name:'Óssa Major', icon:'✦', label:'Óssa Major', lines:[['dubhe','merak'],['merak','phecda'],['phecda','megrez'],['megrez','dubhe'],['megrez','alioth'],['alioth','mizar'],['mizar','alkaid']] },
  { id:'ursaMinor', name:'Óssa Menor', icon:'⌖', label:'Óssa Menor', lines:[['polaris','yildun'],['yildun','epsumi'],['epsumi','zetumi'],['zetumi','etaumi'],['etaumi','pherkad'],['pherkad','kochab'],['kochab','zetumi']] },
  { id:'cassiopeia', name:'Cassiopea', icon:'W', label:'Cassiopea', lines:[['caph','schedar'],['schedar','navi'],['navi','ruchbah'],['ruchbah','segin']] },
  { id:'cygnus', name:'Cigne', icon:'✚', label:'Cigne', lines:[['deneb','sadr'],['sadr','albireo'],['deltacyg','sadr'],['sadr','gienah']] },
  { id:'lyra', name:'Lira', icon:'◇', label:'Lira', lines:[['vega','deltalyr'],['deltalyr','sulafat'],['sulafat','sheliak'],['sheliak','vega']] },
  { id:'aquila', name:'Àguila', icon:'⌁', label:'Àguila', lines:[['tarazed','altair'],['altair','alshain']] },
  { id:'scorpius', name:'Escorpí', icon:'♏', label:'Escorpí', lines:[['acrab','dschubba'],['dschubba','alniyat'],['alniyat','antares'],['antares','epssco'],['epssco','sargas'],['sargas','shaula'],['shaula','lesath']] },
  { id:'sagittarius', name:'Sagitari', icon:'⌁', label:'Sagitari', lines:[['alnasl','kausmed'],['kausmed','kausaus'],['kausaus','ascella'],['ascella','nunki'],['nunki','kausbor'],['kausbor','kausmed']] },
  { id:'andromeda', name:'Andròmeda', icon:'⌁', label:'Andròmeda', lines:[['alpheratz','mirach'],['mirach','almach']] },
  { id:'pegasus', name:'Pegàs', icon:'□', label:'Pegàs', lines:[['markab','scheat'],['scheat','alpheratz'],['alpheratz','algenib'],['algenib','markab']] },
  { id:'perseus', name:'Perseu', icon:'⌁', label:'Perseu', lines:[['mirfak','algol']] }
];

const constellationById = Object.fromEntries(constellations.map(item => [item.id, item]));

const challenges = [
  { id:'scorpius', title:'Troba l’Escorpí', icon:'♏', target:'scorpius' },
  { id:'summerTriangle', title:'Troba el Triangle d’Estiu', icon:'△', target:'summerTriangle' },
  { id:'polaris', title:'Localitza l’Estrella Polar', icon:'⌖', target:'ursaMinor' },
  { id:'cassiopeia', title:'Troba la W de Cassiopea', icon:'W', target:'cassiopeia' },
  { id:'milkyway', title:'Distingeix la Via Làctia', icon:'≋', target:'milkyway' },
  { id:'meteor', title:'Veus una estrella fugaç?', icon:'☄', target:null }
];

const seenObjects = [
  { id:'milkyway', title:'Via Làctia', icon:'≋' },
  { id:'summerTriangle', title:'Triangle d’Estiu', icon:'△' },
  { id:'scorpius', title:'Escorpí', icon:'♏' },
  { id:'polaris', title:'Estrella Polar', icon:'⌖' },
  { id:'cassiopeia', title:'Cassiopea', icon:'W' },
  { id:'eclipse', title:'Eclipsi total', icon:'☀' }
];

const milkyWayPoints = [
  [0, 62], [1.5, 62], [3, 57], [4.5, 44], [6, 23], [7.5, 2], [9, -25], [10.5, -47],
  [12, -62], [13.5, -58], [15, -43], [16.5, -24], [18, -3], [19.5, 24], [21, 43], [22.5, 56], [24, 62]
];

const state = {
  selectedDate: spainLocalStringToDate('2026-08-12T22:30'),
  projectedStars: [],
  highlight: null,
  animationTimer: null,
  adaptationTimer: null,
  challengeState: loadJSON(STORAGE.challenges, {}),
  record: loadJSON(STORAGE.record, { seen: {}, meteors: 0, satellites: 0, notes: '', date: '2026-08-12' }),
  deferredInstallPrompt: null
};

const dom = {};

document.addEventListener('DOMContentLoaded', init);

function init() {
  cacheDom();
  renderChallenges();
  renderSeenObjects();
  hydrateRecordForm();
  bindTabs();
  bindSkyControls();
  bindEclipseControls();
  bindRecordControls();
  bindMisc();
  updateSky();
  updateEclipse();
  updateCountdown();
  updateMemoryPreview();
  setInterval(updateCountdown, 1000);
  registerServiceWorker();
}

function cacheDom() {
  const ids = [
    'skyDateTime','minus30','nowButton','plus30','playButton','familyMode','redMode','constellationLines',
    'skyCanvas','canvasWrap','starTooltip','objectDetail','mapDateLabel','twilightLabel','discoverList',
    'challengeList','challengeProgress','resetChallenges','startAdaptation','adaptationCountdown',
    'eclipseCanvas','eclipseSlider','eclipseClock','eclipseCountdown','countdownCaption','eclipseTimeline','horizonChecked',
    'seenGrid','meteorsCount','satellitesCount','observationNotes','saveRecord','downloadMemory','clearRecord','saveMessage',
    'memoryDate','memoryList','memoryQuote','aboutDialog','aboutButton','closeDialog','installButton'
  ];
  for (const id of ids) dom[id] = document.getElementById(id);
}

function bindTabs() {
  document.querySelectorAll('.tab').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('is-active', tab === button));
      document.querySelectorAll('.page-section').forEach(section => section.classList.toggle('is-active', section.id === button.dataset.target));
      if (button.dataset.target === 'skySection') requestAnimationFrame(updateSky);
      if (button.dataset.target === 'eclipseSection') requestAnimationFrame(drawEclipse);
    });
  });
}

function bindSkyControls() {
  dom.skyDateTime.addEventListener('change', () => {
    const parsed = spainLocalStringToDate(dom.skyDateTime.value);
    if (Number.isFinite(parsed.getTime())) {
      state.selectedDate = parsed;
      updateSky();
    }
  });
  dom.minus30.addEventListener('click', () => shiftSkyTime(-30));
  dom.plus30.addEventListener('click', () => shiftSkyTime(30));
  dom.nowButton.addEventListener('click', () => {
    state.selectedDate = new Date();
    syncDateInput();
    updateSky();
  });
  dom.playButton.addEventListener('click', toggleSkyAnimation);
  dom.familyMode.addEventListener('change', drawSky);
  dom.constellationLines.addEventListener('change', drawSky);
  dom.redMode.addEventListener('change', () => {
    document.body.classList.toggle('red-mode', dom.redMode.checked);
    drawSky();
    drawEclipse();
  });
  dom.skyCanvas.addEventListener('pointermove', handleSkyPointerMove);
  dom.skyCanvas.addEventListener('pointerleave', () => { dom.starTooltip.hidden = true; });
  dom.skyCanvas.addEventListener('click', handleSkyClick);
  window.addEventListener('resize', debounce(() => { drawSky(); drawEclipse(); }, 120));
}

function bindEclipseControls() {
  dom.eclipseSlider.addEventListener('input', updateEclipse);
  dom.eclipseTimeline.querySelectorAll('li').forEach(item => {
    item.addEventListener('click', () => {
      dom.eclipseSlider.value = item.dataset.sec;
      updateEclipse();
    });
  });
  dom.horizonChecked.checked = localStorage.getItem(STORAGE.horizon) === '1';
  dom.horizonChecked.addEventListener('change', () => localStorage.setItem(STORAGE.horizon, dom.horizonChecked.checked ? '1' : '0'));
}

function bindRecordControls() {
  document.querySelectorAll('[data-counter]').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.counter;
      const delta = Number(button.dataset.delta);
      state.record[key] = Math.max(0, Number(state.record[key] || 0) + delta);
      hydrateRecordForm();
      updateMemoryPreview();
    });
  });
  dom.saveRecord.addEventListener('click', saveRecord);
  dom.downloadMemory.addEventListener('click', downloadMemoryImage);
  dom.clearRecord.addEventListener('click', clearRecord);
  dom.observationNotes.addEventListener('input', () => {
    state.record.notes = dom.observationNotes.value;
    updateMemoryPreview();
  });
}

function bindMisc() {
  dom.resetChallenges.addEventListener('click', () => {
    state.challengeState = {};
    saveJSON(STORAGE.challenges, state.challengeState);
    renderChallenges();
  });
  dom.startAdaptation.addEventListener('click', startAdaptationTimer);
  dom.aboutButton.addEventListener('click', () => dom.aboutDialog.showModal());
  dom.closeDialog.addEventListener('click', () => dom.aboutDialog.close());
  dom.aboutDialog.addEventListener('click', event => {
    const rect = dom.aboutDialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dom.aboutDialog.close();
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    dom.installButton.hidden = false;
  });
  dom.installButton.addEventListener('click', async () => {
    if (!state.deferredInstallPrompt) return;
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
    dom.installButton.hidden = true;
  });
}

function shiftSkyTime(minutes) {
  state.selectedDate = new Date(state.selectedDate.getTime() + minutes * 60000);
  syncDateInput();
  updateSky();
}

function syncDateInput() {
  dom.skyDateTime.value = formatSpainInput(state.selectedDate);
}

function toggleSkyAnimation() {
  if (state.animationTimer) {
    clearInterval(state.animationTimer);
    state.animationTimer = null;
    dom.playButton.setAttribute('aria-pressed', 'false');
    dom.playButton.innerHTML = '<span>▶</span> Animar';
    return;
  }
  dom.playButton.setAttribute('aria-pressed', 'true');
  dom.playButton.innerHTML = '<span>Ⅱ</span> Pausa';
  state.animationTimer = setInterval(() => shiftSkyTime(10), 800);
}

function updateSky() {
  dom.mapDateLabel.textContent = new Intl.DateTimeFormat('ca-ES', {
    timeZone: LOCATION.timezone, day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'
  }).format(state.selectedDate).replace(',', ' ·');
  const sun = sunEquatorial(state.selectedDate);
  const horizontalSun = equatorialToHorizontal(sun.ra, sun.dec, state.selectedDate);
  dom.twilightLabel.textContent = twilightName(horizontalSun.altitude);
  renderDiscoverList();
  drawSky();
}

function drawSky() {
  const canvas = dom.skyCanvas;
  if (!canvas || !canvas.clientWidth) return;
  const { ctx, width, height, dpr } = prepareCanvas(canvas);
  const cx = width / 2;
  const cy = height * 0.505;
  const radius = Math.min(width * 0.47, height * 0.455);

  ctx.clearRect(0, 0, width, height);
  const bg = ctx.createRadialGradient(cx, cy * .88, radius * .05, cx, cy, radius * 1.15);
  bg.addColorStop(0, '#173a70');
  bg.addColorStop(.45, '#0b2145');
  bg.addColorStop(1, '#020814');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  drawDecorativeFaintStars(ctx, cx, cy, radius);
  drawMilkyWay(ctx, cx, cy, radius);

  const projected = new Map();
  state.projectedStars = [];
  for (const star of stars) {
    const horizontal = equatorialToHorizontal(star.ra, star.dec, state.selectedDate);
    if (horizontal.altitude <= 0) continue;
    const point = projectHorizontal(horizontal.azimuth, horizontal.altitude, cx, cy, radius);
    const entry = { ...star, ...horizontal, x: point.x, y: point.y };
    projected.set(star.id, entry);
    state.projectedStars.push(entry);
  }

  if (dom.constellationLines.checked) drawConstellations(ctx, projected, radius);
  drawSummerTriangle(ctx, projected, radius);
  drawStars(ctx, projected, radius);

  ctx.restore();
  drawSkyFrame(ctx, cx, cy, radius);

  canvas._layout = { width, height, dpr, cx, cy, radius };
}

function drawDecorativeFaintStars(ctx, cx, cy, radius) {
  const seed = Math.floor(julianDate(state.selectedDate) * 0.25);
  const random = mulberry32(seed);
  ctx.save();
  for (let i = 0; i < 180; i++) {
    const angle = random() * Math.PI * 2;
    const r = Math.sqrt(random()) * radius;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const size = .35 + random() * 1.05;
    ctx.globalAlpha = .12 + random() * .32;
    ctx.fillStyle = random() > .82 ? '#9dd9ff' : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMilkyWay(ctx, cx, cy, radius) {
  const points = milkyWayPoints.map(([ra, dec]) => {
    const h = equatorialToHorizontal(ra === 24 ? 0 : ra, dec, state.selectedDate);
    return h.altitude > -8 ? { ...projectHorizontal(h.azimuth, Math.max(0, h.altitude), cx, cy, radius), visible: h.altitude > 0 } : null;
  });
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [lineWidth, alpha] of [[radius * .15, .035], [radius * .085, .055], [radius * .035, .09]]) {
    ctx.beginPath();
    let previous = null;
    for (const point of points) {
      if (!point || !point.visible || (previous && Math.hypot(point.x - previous.x, point.y - previous.y) > radius * .65)) {
        previous = null;
        continue;
      }
      if (!previous) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
      previous = point;
    }
    ctx.strokeStyle = state.highlight === 'milkyway' ? `rgba(190,165,255,${alpha * 4.5})` : `rgba(176,197,255,${alpha})`;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  if (state.highlight === 'milkyway') {
    ctx.fillStyle = 'rgba(218,196,255,.94)';
    ctx.font = `700 ${Math.max(13, radius * .04)}px system-ui`;
    ctx.fillText('Via Làctia', cx - radius * .18, cy - radius * .1);
  }
  ctx.restore();
}

function drawConstellations(ctx, projected, radius) {
  for (const constellation of constellations) {
    const highlighted = state.highlight === constellation.id;
    ctx.save();
    ctx.strokeStyle = highlighted ? 'rgba(255,216,105,.97)' : 'rgba(102,176,255,.54)';
    ctx.lineWidth = highlighted ? Math.max(2.2, radius * .007) : Math.max(1, radius * .0034);
    ctx.shadowColor = highlighted ? '#ffd45e' : '#4fa8ff';
    ctx.shadowBlur = highlighted ? 18 : 7;
    ctx.beginPath();
    let drawn = 0;
    for (const [aId, bId] of constellation.lines) {
      const a = projected.get(aId);
      const b = projected.get(bId);
      if (!a || !b) continue;
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      drawn++;
    }
    if (drawn) ctx.stroke();
    ctx.restore();

    if (drawn && dom.familyMode.checked && (radius > 160 || highlighted)) {
      const ids = [...new Set(constellation.lines.flat())];
      const visible = ids.map(id => projected.get(id)).filter(Boolean);
      if (visible.length >= 2) {
        const x = visible.reduce((sum, p) => sum + p.x, 0) / visible.length;
        const y = visible.reduce((sum, p) => sum + p.y, 0) / visible.length;
        ctx.save();
        ctx.font = `700 ${Math.max(11, radius * .033)}px system-ui`;
        ctx.fillStyle = highlighted ? '#ffe18a' : 'rgba(205,220,245,.82)';
        ctx.shadowColor = '#061020';
        ctx.shadowBlur = 7;
        ctx.fillText(constellation.label, x + 7, y - 6);
        ctx.restore();
      }
    }
  }
}

function drawSummerTriangle(ctx, projected, radius) {
  const deneb = projected.get('deneb');
  const vega = projected.get('vega');
  const altair = projected.get('altair');
  if (!deneb || !vega || !altair) return;
  ctx.save();
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.moveTo(deneb.x, deneb.y);
  ctx.lineTo(vega.x, vega.y);
  ctx.lineTo(altair.x, altair.y);
  ctx.closePath();
  const highlighted = state.highlight === 'summerTriangle';
  ctx.strokeStyle = highlighted ? 'rgba(255,217,96,.95)' : 'rgba(191,172,255,.32)';
  ctx.lineWidth = highlighted ? Math.max(2, radius * .006) : Math.max(1, radius * .0025);
  ctx.shadowColor = highlighted ? '#ffd45e' : '#957cff';
  ctx.shadowBlur = highlighted ? 18 : 4;
  ctx.stroke();
  if (highlighted) {
    const x = (deneb.x + vega.x + altair.x) / 3;
    const y = (deneb.y + vega.y + altair.y) / 3;
    ctx.fillStyle = '#ffe58e';
    ctx.font = `800 ${Math.max(12, radius * .035)}px system-ui`;
    ctx.fillText('Triangle d’Estiu', x - radius * .14, y);
  }
  ctx.restore();
}

function drawStars(ctx, projected, radius) {
  const labelIds = new Set(['polaris','vega','deneb','altair','antares','arcturus','fomalhaut','capella']);
  for (const star of projected.values()) {
    const size = Math.max(1.1, 4.8 - (star.mag + .2) * .75);
    const isKey = labelIds.has(star.id);
    const selected = state.highlight === star.id || (state.highlight === 'ursaMinor' && star.id === 'polaris');
    ctx.save();
    ctx.fillStyle = star.id === 'antares' ? '#ff967d' : star.id === 'arcturus' ? '#ffc88b' : '#f7fbff';
    ctx.shadowColor = selected ? '#ffd45e' : (isKey ? '#91d3ff' : '#dcecff');
    ctx.shadowBlur = selected ? 24 : (isKey ? 13 : 5);
    ctx.globalAlpha = Math.min(1, .68 + (3.5 - star.mag) * .07);
    ctx.beginPath();
    ctx.arc(star.x, star.y, selected ? size * 1.75 : size, 0, Math.PI * 2);
    ctx.fill();
    if (isKey || selected) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = selected ? '#ffe18a' : 'rgba(242,248,255,.92)';
      ctx.font = `${selected ? 800 : 650} ${Math.max(10, radius * .028)}px system-ui`;
      ctx.fillText(star.name, star.x + size + 5, star.y - size - 2);
    }
    ctx.restore();
  }
}

function drawSkyFrame(ctx, cx, cy, radius) {
  ctx.save();
  ctx.strokeStyle = 'rgba(145,194,255,.33)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(145,194,255,.09)';
  for (const fraction of [.33, .66]) {
    ctx.beginPath(); ctx.arc(cx, cy, radius * fraction, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy); ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius); ctx.stroke();
  const directions = [
    { label:'N', angle:0 }, { label:'NE', angle:45 }, { label:'E', angle:90 }, { label:'SE', angle:135 },
    { label:'S', angle:180 }, { label:'SO', angle:225 }, { label:'O', angle:270 }, { label:'NO', angle:315 }
  ];
  ctx.font = `800 ${Math.max(10, radius * .032)}px system-ui`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const direction of directions) {
    const rad = direction.angle * Math.PI / 180;
    const x = cx + Math.sin(rad) * (radius + 13);
    const y = cy - Math.cos(rad) * (radius + 13);
    ctx.fillStyle = direction.label === 'N' ? '#64c8ff' : 'rgba(205,220,242,.76)';
    ctx.fillText(direction.label, x, y);
  }
  ctx.fillStyle = 'rgba(205,220,242,.5)';
  ctx.font = `600 ${Math.max(9, radius * .025)}px system-ui`;
  ctx.fillText('ZENIT', cx, cy + 14);
  ctx.restore();
}

function renderDiscoverList() {
  const suggestions = [
    { id:'summerTriangle', title:'Triangle d’Estiu', icon:'△', stars:['vega','deneb','altair'], note:'Tres estrelles molt brillants' },
    { id:'scorpius', title:'Escorpí', icon:'♏', stars:['antares','shaula'], note:'Baix cap al sud-oest' },
    { id:'cassiopeia', title:'Cassiopea', icon:'W', stars:['navi','schedar'], note:'La W que gira al voltant del nord' },
    { id:'ursaMajor', title:'Óssa Major', icon:'✦', stars:['dubhe','merak'], note:'La pista per trobar la Polar' },
    { id:'milkyway', title:'Via Làctia', icon:'≋', stars:['deneb','sadr'], note:'Una franja feble: deixa adaptar els ulls' },
    { id:'andromeda', title:'Andròmeda', icon:'◇', stars:['mirach','almach'], note:'Millor quan avança la nit' }
  ];
  const ranked = suggestions.map(item => {
    const altitudes = item.stars.map(id => equatorialToHorizontal(starById[id].ra, starById[id].dec, state.selectedDate).altitude);
    return { ...item, altitude: Math.max(...altitudes) };
  }).filter(item => item.altitude > 3).sort((a,b) => b.altitude - a.altitude).slice(0, 5);

  dom.discoverList.innerHTML = ranked.map(item => `
    <button class="discover-item" type="button" data-highlight="${item.id}">
      <span class="symbol">${item.icon}</span>
      <span><strong>${item.title}</strong><small>${item.note} · ${Math.round(item.altitude)}°</small></span>
    </button>`).join('');
  dom.discoverList.querySelectorAll('[data-highlight]').forEach(button => {
    button.addEventListener('click', () => setHighlight(button.dataset.highlight));
  });
}

function setHighlight(target) {
  state.highlight = state.highlight === target ? null : target;
  drawSky();
  const constellation = constellationById[target];
  if (target === 'summerTriangle') setObjectDetail('△', 'Triangle d’Estiu', 'Vega, Deneb i Altair formen un triangle enorme i fàcil de reconèixer.');
  else if (target === 'milkyway') setObjectDetail('≋', 'Via Làctia', 'La veuràs com una franja blanquinosa, no com les fotografies de llarga exposició.');
  else if (constellation) setObjectDetail(constellation.icon, constellation.name, `Busca la figura ressaltada al mapa i després intenta reconstruir-la al cel real.`);
}

function setObjectDetail(symbol, title, text) {
  dom.objectDetail.innerHTML = `<div class="detail-symbol">${symbol}</div><div><strong>${title}</strong><p>${text}</p></div>`;
}

function handleSkyPointerMove(event) {
  const hit = findStarAtEvent(event);
  if (!hit) { dom.starTooltip.hidden = true; return; }
  const rect = dom.canvasWrap.getBoundingClientRect();
  dom.starTooltip.innerHTML = `<strong>${hit.name}</strong>${hit.constellation} · ${Math.round(hit.altitude)}° d’altura`;
  dom.starTooltip.style.left = `${Math.min(event.clientX - rect.left + 12, rect.width - 220)}px`;
  dom.starTooltip.style.top = `${Math.max(8, event.clientY - rect.top - 55)}px`;
  dom.starTooltip.hidden = false;
}

function handleSkyClick(event) {
  const hit = findStarAtEvent(event);
  if (!hit) return;
  state.highlight = hit.id;
  drawSky();
  setObjectDetail('✦', hit.name, `${hit.distance ? `${hit.distance}. ` : ''}${hit.fact || `Forma part de la constel·lació ${hit.constellation}.`}`);
}

function findStarAtEvent(event) {
  const canvas = dom.skyCanvas;
  const rect = canvas.getBoundingClientRect();
  if (!canvas._layout) return null;
  const x = (event.clientX - rect.left) * (canvas._layout.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas._layout.height / rect.height);
  let best = null;
  let bestDistance = 18 * (canvas._layout.width / rect.width);
  for (const star of state.projectedStars) {
    const distance = Math.hypot(x - star.x, y - star.y);
    if (distance < bestDistance) { best = star; bestDistance = distance; }
  }
  return best;
}

function renderChallenges() {
  dom.challengeList.innerHTML = challenges.map(item => {
    const checked = Boolean(state.challengeState[item.id]);
    return `<label class="challenge-item ${checked ? 'is-done' : ''}" data-target="${item.target || ''}">
      <input type="checkbox" data-challenge="${item.id}" ${checked ? 'checked' : ''}>
      <strong>${item.title}</strong><span class="challenge-icon">${item.icon}</span>
    </label>`;
  }).join('');
  dom.challengeList.querySelectorAll('.challenge-item').forEach(label => {
    label.addEventListener('click', event => {
      if (event.target.matches('input')) return;
      const target = label.dataset.target;
      if (target) setHighlight(target);
    });
  });
  dom.challengeList.querySelectorAll('[data-challenge]').forEach(input => {
    input.addEventListener('change', () => {
      state.challengeState[input.dataset.challenge] = input.checked;
      saveJSON(STORAGE.challenges, state.challengeState);
      renderChallenges();
    });
  });
  const complete = challenges.filter(item => state.challengeState[item.id]).length;
  const percent = (complete / challenges.length) * 100;
  dom.challengeProgress.style.setProperty('--progress', `${percent}%`);
  dom.challengeProgress.querySelector('span').textContent = `${complete}/${challenges.length}`;
}

function startAdaptationTimer() {
  if (state.adaptationTimer) clearInterval(state.adaptationTimer);
  let remaining = 20 * 60;
  dom.adaptationCountdown.hidden = false;
  dom.startAdaptation.disabled = true;
  dom.redMode.checked = true;
  document.body.classList.add('red-mode');
  const tick = () => {
    const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
    const seconds = String(remaining % 60).padStart(2, '0');
    dom.adaptationCountdown.textContent = `${minutes}:${seconds}`;
    if (remaining <= 0) {
      clearInterval(state.adaptationTimer);
      state.adaptationTimer = null;
      dom.adaptationCountdown.textContent = 'Ulls adaptats ✦';
      dom.startAdaptation.disabled = false;
      return;
    }
    remaining--;
  };
  tick();
  state.adaptationTimer = setInterval(tick, 1000);
}

function updateEclipse() {
  const seconds = Number(dom.eclipseSlider.value);
  const clock = secondsToClock(seconds);
  dom.eclipseClock.textContent = clock;
  dom.eclipseTimeline.querySelectorAll('li').forEach(item => {
    const itemSeconds = Number(item.dataset.sec);
    const next = item.nextElementSibling ? Number(item.nextElementSibling.dataset.sec) : Infinity;
    item.classList.toggle('is-current', seconds >= itemSeconds && seconds < next);
  });
  drawEclipse();
}

function drawEclipse() {
  const canvas = dom.eclipseCanvas;
  if (!canvas || !canvas.clientWidth) return;
  const { ctx, width, height } = prepareCanvas(canvas);
  const seconds = Number(dom.eclipseSlider.value);
  const cx = width / 2;
  const cy = height * .47;
  const sunRadius = Math.min(width, height) * .19;
  const moonRadius = sunRadius * 1.035;

  ctx.clearRect(0, 0, width, height);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  const totality = seconds >= ECLIPSE.seconds.totalStart && seconds <= ECLIPSE.seconds.totalEnd;
  sky.addColorStop(0, totality ? '#01030a' : '#11274b');
  sky.addColorStop(1, totality ? '#24152c' : '#d06f3f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  if (totality) {
    ctx.save();
    ctx.globalAlpha = .65;
    const random = mulberry32(20260812);
    for (let i = 0; i < 55; i++) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(random() * width, random() * height * .8, .4 + random() * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  let normalizedOffset;
  if (seconds <= ECLIPSE.seconds.maximum) {
    normalizedOffset = 2.07 * (1 - seconds / ECLIPSE.seconds.maximum);
  } else {
    normalizedOffset = -2.07 * ((seconds - ECLIPSE.seconds.maximum) / (ECLIPSE.seconds.end - ECLIPSE.seconds.maximum));
  }
  const moonX = cx + normalizedOffset * sunRadius;
  const moonY = cy - sunRadius * .035;

  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, sunRadius * .25, cx, cy, sunRadius * 2.2);
  glow.addColorStop(0, 'rgba(255,248,166,.98)');
  glow.addColorStop(.24, 'rgba(255,184,60,.55)');
  glow.addColorStop(1, 'rgba(255,126,35,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, sunRadius * 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = '#ffbf4b'; ctx.shadowBlur = 28;
  ctx.fillStyle = '#ffd65c';
  ctx.beginPath(); ctx.arc(cx, cy, sunRadius, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  if (totality) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,250,226,.9)';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 25;
    ctx.lineWidth = sunRadius * .09;
    ctx.beginPath(); ctx.arc(cx, cy, sunRadius * 1.055, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 20; i++) {
      const angle = i / 20 * Math.PI * 2;
      const length = sunRadius * (.18 + (i % 4) * .035);
      ctx.globalAlpha = .28 + (i % 3) * .12;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * sunRadius * 1.08, cy + Math.sin(angle) * sunRadius * 1.08);
      ctx.lineTo(cx + Math.cos(angle) * (sunRadius + length), cy + Math.sin(angle) * (sunRadius + length));
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = totality ? '#02030a' : '#08101f';
  ctx.shadowColor = totality ? '#000' : 'rgba(0,0,0,.7)';
  ctx.shadowBlur = totality ? 0 : 8;
  ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.fillStyle = totality ? '#060912' : '#050a11';
  ctx.beginPath();
  ctx.moveTo(0, height * .91);
  ctx.lineTo(width * .14, height * .78);
  ctx.lineTo(width * .25, height * .88);
  ctx.lineTo(width * .39, height * .73);
  ctx.lineTo(width * .54, height * .9);
  ctx.lineTo(width * .72, height * .75);
  ctx.lineTo(width, height * .89);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();

  const bannerText = totality ? 'TOTALITAT · ES PODEN RETIRAR LES ULLERES' : 'ULLERES HOMOLOGADES POSADES';
  ctx.font = `800 ${Math.max(11, width * .022)}px system-ui`;
  const textWidth = ctx.measureText(bannerText).width;
  ctx.fillStyle = totality ? 'rgba(104,227,166,.92)' : 'rgba(255,116,101,.93)';
  roundRect(ctx, cx - textWidth / 2 - 14, height - 38, textWidth + 28, 27, 13);
  ctx.fill();
  ctx.fillStyle = '#06101a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(bannerText, cx, height - 24.5);
}

function updateCountdown() {
  const maximum = spainLocalStringToDate('2026-08-12T20:30:40');
  const now = new Date();
  const diff = maximum.getTime() - now.getTime();
  if (diff > 0) {
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000) % 24;
    const minutes = Math.floor(diff / 60000) % 60;
    const seconds = Math.floor(diff / 1000) % 60;
    dom.countdownCaption.textContent = 'Temps fins al màxim';
    dom.eclipseCountdown.textContent = `${days} d · ${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
  } else {
    const totalEnd = spainLocalStringToDate('2026-08-12T20:31:31');
    if (now <= totalEnd) {
      dom.countdownCaption.textContent = 'Totalitat en curs';
      dom.eclipseCountdown.textContent = 'MIRA LA CORONA!';
    } else {
      dom.countdownCaption.textContent = 'Eclipsi del 12 d’agost de 2026';
      dom.eclipseCountdown.textContent = 'Un record irrepetible';
    }
  }
}

function renderSeenObjects() {
  dom.seenGrid.innerHTML = seenObjects.map(item => `
    <div class="seen-item">
      <input id="seen-${item.id}" type="checkbox" data-seen="${item.id}">
      <label for="seen-${item.id}"><span class="seen-icon">${item.icon}</span><strong>${item.title}</strong></label>
    </div>`).join('');
  dom.seenGrid.querySelectorAll('[data-seen]').forEach(input => {
    input.addEventListener('change', () => {
      state.record.seen[input.dataset.seen] = input.checked;
      updateMemoryPreview();
    });
  });
}

function hydrateRecordForm() {
  dom.seenGrid.querySelectorAll('[data-seen]').forEach(input => { input.checked = Boolean(state.record.seen[input.dataset.seen]); });
  dom.meteorsCount.textContent = state.record.meteors || 0;
  dom.satellitesCount.textContent = state.record.satellites || 0;
  dom.observationNotes.value = state.record.notes || '';
}

function saveRecord() {
  state.record.notes = dom.observationNotes.value.trim();
  state.record.date = '2026-08-12';
  saveJSON(STORAGE.record, state.record);
  dom.saveMessage.textContent = 'Registre desat en aquest dispositiu ✓';
  setTimeout(() => { dom.saveMessage.textContent = ''; }, 2800);
  updateMemoryPreview();
}

function clearRecord() {
  state.record = { seen: {}, meteors: 0, satellites: 0, notes: '', date: '2026-08-12' };
  localStorage.removeItem(STORAGE.record);
  hydrateRecordForm();
  updateMemoryPreview();
  dom.saveMessage.textContent = 'Registre esborrat.';
  setTimeout(() => { dom.saveMessage.textContent = ''; }, 2200);
}

function updateMemoryPreview() {
  dom.memoryDate.textContent = '12 d’agost de 2026';
  const entries = seenObjects.filter(item => state.record.seen[item.id]).map(item => item.title);
  if (state.record.meteors > 0) entries.push(`${state.record.meteors} ${state.record.meteors === 1 ? 'estrella fugaç' : 'estrelles fugaces'}`);
  if (state.record.satellites > 0) entries.push(`${state.record.satellites} ${state.record.satellites === 1 ? 'satèl·lit' : 'satèl·lits'}`);
  dom.memoryList.innerHTML = entries.length ? entries.map(entry => `<li>${escapeHTML(entry)}</li>`).join('') : '<li>Encara no hi ha cap observació marcada.</li>';
  const notes = (state.record.notes || '').trim();
  dom.memoryQuote.textContent = notes ? `«${notes}»` : '«Aquesta nit encara està per escriure.»';
}

function downloadMemoryImage() {
  saveRecord();
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#07152f');
  gradient.addColorStop(.58, '#0b1834');
  gradient.addColorStop(1, '#231629');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const random = mulberry32(12082026);
  for (let i = 0; i < 260; i++) {
    ctx.globalAlpha = .25 + random() * .7;
    ctx.fillStyle = random() > .88 ? '#9edaff' : '#fff';
    ctx.beginPath();
    ctx.arc(random() * canvas.width, random() * 610, .8 + random() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const skyGlow = ctx.createRadialGradient(600, 480, 0, 600, 480, 500);
  skyGlow.addColorStop(0, 'rgba(91,125,225,.17)');
  skyGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = skyGlow;
  ctx.fillRect(0, 0, 1200, 800);

  ctx.strokeStyle = '#fff6ce'; ctx.lineWidth = 5; ctx.shadowColor = '#fff'; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.moveTo(860, 210); ctx.lineTo(1035, 145); ctx.stroke(); ctx.shadowBlur = 0;

  ctx.fillStyle = '#050811';
  ctx.beginPath();
  ctx.moveTo(0, 630); ctx.lineTo(130, 520); ctx.lineTo(240, 610); ctx.lineTo(390, 465); ctx.lineTo(535, 610); ctx.lineTo(700, 500); ctx.lineTo(835, 620); ctx.lineTo(1020, 485); ctx.lineTo(1200, 605); ctx.lineTo(1200, 1500); ctx.lineTo(0, 1500); ctx.fill();

  ctx.fillStyle = '#ffca58';
  ctx.font = '800 28px system-ui';
  ctx.letterSpacing = '4px';
  ctx.fillText('NIT D’ESTIU · TORREVICENTE', 95, 770);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 84px system-ui';
  ctx.fillText('El nostre cel', 90, 875);
  ctx.fillStyle = '#aebdd3';
  ctx.font = '600 31px system-ui';
  ctx.fillText('12 d’agost de 2026', 94, 930);

  const entries = seenObjects.filter(item => state.record.seen[item.id]).map(item => item.title);
  if (state.record.meteors > 0) entries.push(`${state.record.meteors} estrelles fugaces`);
  if (state.record.satellites > 0) entries.push(`${state.record.satellites} satèl·lits`);
  const displayed = entries.length ? entries : ['Una nit per descobrir'];
  ctx.font = '700 31px system-ui';
  let y = 1015;
  for (const entry of displayed.slice(0, 7)) {
    ctx.fillStyle = '#7be6a4'; ctx.fillText('✓', 95, y);
    ctx.fillStyle = '#eef3fb'; ctx.fillText(entry, 145, y);
    y += 53;
  }

  const note = (state.record.notes || 'Aquesta nit encara està per escriure.').trim();
  ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(95, 1265); ctx.lineTo(1105, 1265); ctx.stroke();
  ctx.fillStyle = '#d9e1ef';
  ctx.font = 'italic 34px Georgia';
  wrapText(ctx, `«${note}»`, 95, 1330, 990, 45, 3);
  ctx.fillStyle = '#8393aa'; ctx.font = '600 23px system-ui';
  ctx.fillText('41,335° N · 2,941° O · 1.202 m', 95, 1450);
  ctx.fillStyle = '#ffd45e'; ctx.font = '48px system-ui'; ctx.fillText('✦', 1060, 1450);

  const link = document.createElement('a');
  link.download = 'record-cel-torrevicente.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function julianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function equatorialToHorizontal(raHours, decDegrees, date) {
  const jd = julianDate(date);
  const T = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000;
  gmst = normalizeDegrees(gmst);
  const lst = normalizeDegrees(gmst + LOCATION.longitude);
  const hourAngle = normalizeSignedDegrees(lst - raHours * 15);
  const lat = toRadians(LOCATION.latitude);
  const dec = toRadians(decDegrees);
  const h = toRadians(hourAngle);
  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(h);
  const altitude = toDegrees(Math.asin(clamp(sinAlt, -1, 1)));
  const azimuth = normalizeDegrees(toDegrees(Math.atan2(-Math.sin(h), Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(h))));
  return { altitude, azimuth };
}

function sunEquatorial(date) {
  const n = julianDate(date) - 2451545.0;
  const L = normalizeDegrees(280.460 + 0.9856474 * n);
  const g = toRadians(normalizeDegrees(357.528 + 0.9856003 * n));
  const lambda = toRadians(normalizeDegrees(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)));
  const epsilon = toRadians(23.439 - 0.0000004 * n);
  const ra = normalizeDegrees(toDegrees(Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda)))) / 15;
  const dec = toDegrees(Math.asin(Math.sin(epsilon) * Math.sin(lambda)));
  return { ra, dec };
}

function projectHorizontal(azimuth, altitude, cx, cy, radius) {
  const r = radius * (90 - altitude) / 90;
  const az = toRadians(azimuth);
  return { x: cx + r * Math.sin(az), y: cy - r * Math.cos(az) };
}

function twilightName(sunAltitude) {
  if (sunAltitude >= 0) return 'Sol sobre l’horitzó';
  if (sunAltitude >= -6) return 'Crepuscle civil';
  if (sunAltitude >= -12) return 'Crepuscle nàutic';
  if (sunAltitude >= -18) return 'Crepuscle astronòmic';
  return 'Nit astronòmica';
}

function spainLocalStringToDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return new Date(NaN);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || 0);
  const offsetHours = isSpainSummerTime(year, month, day) ? 2 : 1;
  return new Date(Date.UTC(year, month - 1, day, hour - offsetHours, minute, second));
}

function isSpainSummerTime(year, month, day) {
  const current = Date.UTC(year, month - 1, day);
  const marchLastSunday = lastSundayUTC(year, 3);
  const octoberLastSunday = lastSundayUTC(year, 10);
  return current >= marchLastSunday && current < octoberLastSunday;
}

function lastSundayUTC(year, month) {
  const lastDay = new Date(Date.UTC(year, month, 0));
  return Date.UTC(year, month - 1, lastDay.getUTCDate() - lastDay.getUTCDay());
}

function formatSpainInput(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LOCATION.timezone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'
  }).formatToParts(date).reduce((acc, part) => { acc[part.type] = part.value; return acc; }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function secondsToClock(seconds) {
  const startSeconds = 19 * 3600 + 35 * 60 + 7;
  const total = startSeconds + seconds;
  const h = Math.floor(total / 3600) % 24;
  const m = Math.floor(total / 60) % 60;
  const s = total % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function prepareCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d');
  return { ctx, width, height, dpr };
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const words = text.split(/\s+/);
  let line = '';
  let lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      lines++;
      line = words[i];
      if (lines >= maxLines - 1) {
        const rest = [line, ...words.slice(i + 1)].join(' ');
        let clipped = rest;
        while (ctx.measureText(`${clipped}…`).width > maxWidth && clipped.length > 2) clipped = clipped.slice(0, -1);
        ctx.fillText(`${clipped}…`, x, y);
        return;
      }
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
}

function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function normalizeDegrees(value) { return ((value % 360) + 360) % 360; }
function normalizeSignedDegrees(value) { const d = normalizeDegrees(value); return d > 180 ? d - 360 : d; }
function toRadians(degrees) { return degrees * Math.PI / 180; }
function toDegrees(radians) { return radians * 180 / Math.PI; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function loadJSON(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return value && typeof value === 'object' ? value : fallback; }
  catch { return fallback; }
}
function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}
function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }

function registerServiceWorker() {
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}
