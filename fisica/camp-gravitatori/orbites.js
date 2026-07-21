(() => {
  'use strict';

  function renderMath(root = document) {
    const katex = globalThis.katex;
    root.querySelectorAll('[data-math]').forEach(element => {
      const source = element.dataset.math ?? element.textContent ?? '';
      if (!katex) { element.textContent = source; return; }
      katex.render(source, element, { throwOnError: false, strict: 'warn', displayMode: element.dataset.display === 'block' });
    });
  }

  renderMath();

  const G = 6.67430e-11;
  const TWO_PI = 2 * Math.PI;
  const BODY_DEFAULTS = {
    earth: { name: 'Terra', mass: 5.972e24, radius: 6_371_000 },
    x: { name: 'Planeta X', mass: 8.0e24, radius: 7_200_000 },
  };

  const els = {};
  const simulation = {
    mode: 'circular',
    bodyKey: 'earth',
    bodyName: BODY_DEFAULTS.earth.name,
    centralMass: BODY_DEFAULTS.earth.mass,
    centralRadius: BODY_DEFAULTS.earth.radius,
    mu: G * BODY_DEFAULTS.earth.mass,
    planetXMass: BODY_DEFAULTS.x.mass,
    planetXRadius: BODY_DEFAULTS.x.radius,
    playing: false,
    collided: false,
    t: 0,
    theta: 0,
    x: BODY_DEFAULTS.earth.radius + 400_000,
    y: 0,
    vx: 0,
    vy: 0,
    mass: 1000,
    initial: null,
    trail: [],
    history: [],
    lastHistoryT: -Infinity,
    lastFrame: 0,
    viewRadius: 10_000_000,
    stars: [],
  };

  function $(id) {
    return document.getElementById(id);
  }

  function cacheElements() {
    [
      'orbitCanvas', 'energyCanvas', 'angularCanvas', 'orbitStatus', 'orbitTypeBadge',
      'btnPlay', 'btnStep', 'btnReset', 'btnCircularize', 'timeScale', 'timeScaleValue',
      'timeDisplay', 'radiusSlider', 'radiusValue', 'heightInitial', 'speedSlider',
      'speedValue', 'massSlider', 'massValue', 'showVelocity',
      'showAcceleration', 'showTrail', 'metricR', 'metricH', 'metricV', 'metricOmega',
      'metricT', 'metricA', 'metricE', 'metricTheta', 'metricEc', 'metricEp',
      'metricEm', 'metricEnergyError', 'metricL', 'metricL0', 'metricLError',
      'metricLCheck', 'planetMassInput', 'planetRadiusInput', 'planetFields',
      'centralBodyName', 'centralBodyData', 'geoPreset'
    ].forEach(id => { els[id] = $(id); });

    els.orbitCtx = els.orbitCanvas.getContext('2d');
    els.energyCtx = els.energyCanvas.getContext('2d');
    els.angularCtx = els.angularCanvas.getContext('2d');
  }

  function caNumber(value, decimals = 2) {
    if (!Number.isFinite(value)) return '—';
    return value.toLocaleString('ca-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function formatKm(metres, decimals = 0) {
    return `${caNumber(metres / 1000, decimals)} km`;
  }

  function formatSpeed(ms) {
    return `${caNumber(ms / 1000, 2)} km/s`;
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return '—';
    if (seconds < 3600) return `${caNumber(seconds / 60, 1)} min`;
    if (seconds < 3 * 86400) return `${caNumber(seconds / 3600, 2)} h`;
    return `${caNumber(seconds / 86400, 2)} dies`;
  }

  function formatElapsed(seconds) {
    if (seconds < 3600) return `t = ${caNumber(seconds / 60, 2)} min`;
    if (seconds < 4 * 86400) return `t = ${caNumber(seconds / 3600, 2)} h`;
    return `t = ${caNumber(seconds / 86400, 2)} dies`;
  }

  function decimalsForSignificant(value, significant = 4) {
    if (!Number.isFinite(value) || value === 0) return 0;
    return Math.max(0, significant - 1 - Math.floor(Math.log10(Math.abs(value))));
  }

  function formatSignificant(value, significant = 4) {
    if (!Number.isFinite(value)) return '—';
    return caNumber(value, decimalsForSignificant(value, significant));
  }

  function formatAngularSpeed(value) {
    if (!Number.isFinite(value)) return '—';
    if (Math.abs(value) >= 1e-3) return `${formatSignificant(value, 4)} rad/s`;
    return `${formatScientific(value, 4)} rad/s`;
  }

  function formatScientific(value, significant = 4) {
    if (!Number.isFinite(value)) return '—';
    if (value === 0) return '0';
    const exponent = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = value / (10 ** exponent);
    return `${caNumber(mantissa, significant - 1)}·10^${exponent}`;
  }

  function formatSI(value, unit) {
    if (!Number.isFinite(value)) return '—';
    const abs = Math.abs(value);
    const prefixes = [
      [1e18, 'E'], [1e15, 'P'], [1e12, 'T'], [1e9, 'G'],
      [1e6, 'M'], [1e3, 'k']
    ];
    for (const [scale, prefix] of prefixes) {
      if (abs >= scale) return `${formatSignificant(value / scale, 4)} ${prefix}${unit}`;
    }
    return `${formatSignificant(value, 4)} ${unit}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function validNumber(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return clamp(parsed, min, max);
  }

  function configureBody(key, { preserveHeight = true } = {}) {
    const oldRadius = simulation.centralRadius;
    const oldHeight = Number(els.radiusSlider?.value || oldRadius / 1000) * 1000 - oldRadius;
    const defaults = BODY_DEFAULTS[key] || BODY_DEFAULTS.earth;

    simulation.bodyKey = key;
    simulation.bodyName = defaults.name;

    if (key === 'earth') {
      els.planetMassInput.value = '5.972';
      els.planetRadiusInput.value = '6371';
      els.planetMassInput.disabled = true;
      els.planetRadiusInput.disabled = true;
      els.planetFields.classList.add('is-fixed');
      simulation.centralMass = defaults.mass;
      simulation.centralRadius = defaults.radius;
      els.geoPreset.disabled = false;
      els.geoPreset.title = '';
    } else {
      els.planetMassInput.disabled = false;
      els.planetRadiusInput.disabled = false;
      els.planetFields.classList.remove('is-fixed');
      els.planetMassInput.value = String(Number((simulation.planetXMass / 1e24).toFixed(3)));
      els.planetRadiusInput.value = String(Math.round(simulation.planetXRadius / 1000));
      simulation.centralMass = simulation.planetXMass;
      simulation.centralRadius = simulation.planetXRadius;
      els.geoPreset.disabled = true;
      els.geoPreset.title = 'La geostacionària requereix conèixer el període de rotació del planeta.';
    }

    simulation.mu = G * simulation.centralMass;
    configureControlRanges(preserveHeight ? oldHeight : 400_000);
    updateBodySummary();
  }

  function configureControlRanges(height = 400_000) {
    const radiusKm = simulation.centralRadius / 1000;
    const minRadiusKm = Math.ceil(radiusKm + 200);
    const maxRadiusKm = Math.ceil(Math.max(radiusKm + 50_000, radiusKm * 8));
    els.radiusSlider.min = String(minRadiusKm);
    els.radiusSlider.max = String(maxRadiusKm);
    els.radiusSlider.step = '10';
    els.radiusSlider.value = String(clamp(Math.round((simulation.centralRadius + Math.max(height, 200_000)) / 10_000) * 10, minRadiusKm, maxRadiusKm));

    const nearSurface = (radiusKm + 200) * 1000;
    const maxSpeed = clamp(Math.ceil(escapeSpeed(nearSurface) / 1000 * 1.5), 12, 40);
    els.speedSlider.max = String(maxSpeed);
  }

  function updateBodyFromInputs() {
    if (simulation.bodyKey !== 'x') return;
    const defaults = BODY_DEFAULTS.x;
    const oldHeight = Number(els.radiusSlider.value) * 1000 - simulation.centralRadius;
    simulation.planetXMass = validNumber(els.planetMassInput.value, defaults.mass / 1e24, 0.1, 50) * 1e24;
    simulation.planetXRadius = validNumber(els.planetRadiusInput.value, defaults.radius / 1000, 1000, 30000) * 1000;
    simulation.centralMass = simulation.planetXMass;
    simulation.centralRadius = simulation.planetXRadius;
    simulation.mu = G * simulation.centralMass;
    els.planetMassInput.value = String(Number((simulation.planetXMass / 1e24).toFixed(3)));
    els.planetRadiusInput.value = String(Math.round(simulation.planetXRadius / 1000));
    configureControlRanges(oldHeight);
    updateBodySummary();
    updateControlLabels();
    resetSimulation();
  }

  function updateBodySummary() {
    els.centralBodyName.textContent = simulation.bodyName;
    els.centralBodyData.textContent = `M = ${caNumber(simulation.centralMass / 1e24, 3)}·10²⁴ kg · R = ${caNumber(simulation.centralRadius / 1000, 0)} km`;
  }

  function circularSpeed(radius) {
    return Math.sqrt(simulation.mu / radius);
  }

  function escapeSpeed(radius) {
    return Math.sqrt(2 * simulation.mu / radius);
  }

  function acceleration(x, y) {
    const r2 = x * x + y * y;
    const r = Math.sqrt(r2);
    const factor = -simulation.mu / (r2 * r);
    return { ax: factor * x, ay: factor * y };
  }

  function orbitalData(state = simulation) {
    const r = Math.hypot(state.x, state.y);
    const v = Math.hypot(state.vx, state.vy);
    const hSpecific = state.x * state.vy - state.y * state.vx;
    const omega = hSpecific / (r * r);
    const specificEnergy = 0.5 * v * v - simulation.mu / r;
    const totalEnergy = specificEnergy * state.mass;
    const kinetic = 0.5 * state.mass * v * v;
    const potential = -simulation.mu * state.mass / r;
    const angularMomentum = state.mass * hSpecific;

    const ex = (state.vy * hSpecific) / simulation.mu - state.x / r;
    const ey = (-state.vx * hSpecific) / simulation.mu - state.y / r;
    const eccentricity = Math.hypot(ex, ey);
    const semiMajor = Math.abs(specificEnergy) > 1e-12 ? -simulation.mu / (2 * specificEnergy) : Infinity;
    const period = specificEnergy < 0 && semiMajor > 0
      ? TWO_PI * Math.sqrt((semiMajor ** 3) / simulation.mu)
      : Infinity;

    return {
      r, v, hSpecific, omega, specificEnergy, totalEnergy, kinetic, potential,
      angularMomentum, ex, ey, eccentricity, semiMajor, period,
    };
  }

  function classifyOrbit(data) {
    if (simulation.collided || data.r <= simulation.centralRadius) {
      return { key: 'collision', label: 'Col·lisió', detail: `El satèl·lit ha arribat a la superfície de ${simulation.bodyName}.` };
    }
    if (Math.abs(data.hSpecific) < 1e7 && data.specificEnergy < 0) {
      return { key: 'falling', label: 'Caiguda radial', detail: `L ≈ 0: no hi ha moviment tangencial i el satèl·lit cau cap a ${simulation.bodyName}.` };
    }
    if (data.eccentricity < 0.012 && data.specificEnergy < 0) {
      return { key: 'circular', label: 'Circular', detail: 'Òrbita lligada gairebé circular: r i v són pràcticament constants.' };
    }
    if (Math.abs(data.eccentricity - 1) < 0.015 || Math.abs(data.specificEnergy) < 2e4) {
      return { key: 'parabolic', label: 'Parabòlica', detail: 'Eₘ ≈ 0: situació límit corresponent a la velocitat d’escapament.' };
    }
    if (data.specificEnergy < 0) {
      return { key: 'elliptical', label: 'El·líptica', detail: 'Eₘ < 0: trajectòria lligada. La velocitat augmenta quan disminueix r.' };
    }
    return { key: 'hyperbolic', label: 'Hiperbòlica', detail: `Eₘ > 0: trajectòria oberta; el satèl·lit escapa del camp de ${simulation.bodyName}.` };
  }

  function readInitialControls() {
    const radius = Number(els.radiusSlider.value) * 1000;
    const mass = Number(els.massSlider.value);
    let speed = Number(els.speedSlider.value) * 1000;
    if (simulation.mode === 'circular') speed = circularSpeed(radius);
    return { radius, speed, mass };
  }

  function resetSimulation({ keepPlaying = false } = {}) {
    const wasPlaying = simulation.playing && keepPlaying;
    const { radius, speed, mass } = readInitialControls();

    simulation.playing = false;
    simulation.collided = false;
    simulation.t = 0;
    simulation.theta = 0;
    simulation.x = radius;
    simulation.y = 0;
    simulation.vx = 0;
    simulation.vy = speed;
    simulation.mass = mass;
    simulation.trail = [{ x: radius, y: 0 }];
    simulation.history = [];
    simulation.lastHistoryT = -Infinity;

    const data = orbitalData();
    simulation.initial = {
      ...data,
      x: simulation.x,
      y: simulation.y,
      vx: simulation.vx,
      vy: simulation.vy,
      mass,
    };
    simulation.viewRadius = calculateTargetViewRadius(data);
    addHistorySample(true);

    els.btnPlay.textContent = '▶ Reprodueix';
    updateControlLabels();
    updateDisplays();
    drawAll();

    if (wasPlaying) setPlaying(true);
  }

  function calculateTargetViewRadius(data) {
    const radius = data.r;
    if (data.specificEnergy < 0 && Number.isFinite(data.semiMajor)) {
      const apoapsis = data.semiMajor * (1 + data.eccentricity);
      return Math.max(simulation.centralRadius * 1.25, apoapsis * 1.12);
    }
    return Math.max(simulation.centralRadius * 2.2, radius * 3.2);
  }

  function setPlaying(value) {
    if (simulation.collided && value) return;
    simulation.playing = value;
    els.btnPlay.textContent = value ? '⏸ Pausa' : '▶ Reprodueix';
    if (value) {
      simulation.lastFrame = performance.now();
      requestAnimationFrame(animate);
    }
  }

  function velocityVerletStep(dt) {
    if (simulation.collided) return;

    const oldAngle = Math.atan2(simulation.y, simulation.x);
    const a0 = acceleration(simulation.x, simulation.y);

    simulation.x += simulation.vx * dt + 0.5 * a0.ax * dt * dt;
    simulation.y += simulation.vy * dt + 0.5 * a0.ay * dt * dt;

    const r = Math.hypot(simulation.x, simulation.y);
    if (r <= simulation.centralRadius) {
      const scale = simulation.centralRadius / Math.max(r, 1);
      simulation.x *= scale;
      simulation.y *= scale;
      simulation.collided = true;
      simulation.playing = false;
      els.btnPlay.textContent = '▶ Reprodueix';
      return;
    }

    const a1 = acceleration(simulation.x, simulation.y);
    simulation.vx += 0.5 * (a0.ax + a1.ax) * dt;
    simulation.vy += 0.5 * (a0.ay + a1.ay) * dt;
    simulation.t += dt;

    const newAngle = Math.atan2(simulation.y, simulation.x);
    let dTheta = newAngle - oldAngle;
    if (dTheta > Math.PI) dTheta -= TWO_PI;
    if (dTheta < -Math.PI) dTheta += TWO_PI;
    simulation.theta += dTheta;
  }

  function advanceSimulation(seconds) {
    if (simulation.collided || seconds <= 0) return;

    const initialPeriod = simulation.initial.period;
    const referencePeriod = Number.isFinite(initialPeriod) ? initialPeriod : 6000;
    const maxDt = clamp(referencePeriod / 1800, 0.25, 35);
    const steps = Math.max(1, Math.ceil(seconds / maxDt));
    const dt = seconds / steps;

    for (let i = 0; i < steps; i += 1) {
      velocityVerletStep(dt);
      if (simulation.collided) break;
    }

    const data = orbitalData();
    const dynamicTarget = calculateTargetViewRadius(data);
    if (data.r > simulation.viewRadius * 0.9 || dynamicTarget < simulation.viewRadius * 0.78) {
      simulation.viewRadius += (dynamicTarget - simulation.viewRadius) * 0.08;
    }

    simulation.trail.push({ x: simulation.x, y: simulation.y });
    if (simulation.trail.length > 1800) simulation.trail.shift();
    addHistorySample();
  }

  function animate(now) {
    if (!simulation.playing) return;
    const realDt = clamp((now - simulation.lastFrame) / 1000, 0, 0.05);
    simulation.lastFrame = now;
    const secondsPerSecond = Number(els.timeScale.value);
    advanceSimulation(realDt * secondsPerSecond);
    updateDisplays();
    drawAll();
    if (simulation.playing) requestAnimationFrame(animate);
  }

  function addHistorySample(force = false) {
    const initialPeriod = simulation.initial?.period;
    const interval = Number.isFinite(initialPeriod)
      ? clamp(initialPeriod / 240, 5, 900)
      : 120;
    if (!force && simulation.t - simulation.lastHistoryT < interval) return;

    const data = orbitalData();
    const energyRel = simulation.initial?.totalEnergy
      ? (data.totalEnergy - simulation.initial.totalEnergy) / Math.abs(simulation.initial.totalEnergy)
      : 0;
    const angularRel = simulation.initial?.angularMomentum
      ? (data.angularMomentum - simulation.initial.angularMomentum) / Math.abs(simulation.initial.angularMomentum)
      : 0;

    simulation.history.push({
      t: simulation.t,
      kinetic: data.kinetic,
      potential: data.potential,
      total: data.totalEnergy,
      energyRel,
      angularRel,
    });
    simulation.lastHistoryT = simulation.t;
    if (simulation.history.length > 420) simulation.history.shift();
  }

  function updateControlLabels() {
    const radiusKm = Number(els.radiusSlider.value);
    const radius = radiusKm * 1000;
    const heightKm = radiusKm - simulation.centralRadius / 1000;
    const vc = circularSpeed(radius) / 1000;

    if (simulation.mode === 'circular') {
      els.speedSlider.value = vc.toFixed(2);
    }

    els.radiusValue.textContent = `${caNumber(radiusKm, 0)} km`;
    els.heightInitial.innerHTML = `h<sub>0</sub> = ${caNumber(heightKm, 0)} km sobre la superfície`;
    els.speedValue.textContent = `${caNumber(Number(els.speedSlider.value), 2)} km/s`;
    els.massValue.textContent = `${caNumber(Number(els.massSlider.value), 0)} kg`;
    els.speedSlider.disabled = simulation.mode === 'circular';
    els.speedSlider.setAttribute('aria-disabled', String(simulation.mode === 'circular'));
    updateBodySummary();
    updateTimeScaleLabel();
  }

  function updateTimeScaleLabel() {
    const scale = Number(els.timeScale.value);
    if (scale < 3600) {
      els.timeScaleValue.textContent = `${caNumber(scale / 60, 0)} min/s`;
    } else {
      els.timeScaleValue.textContent = `${caNumber(scale / 3600, 1)} h/s`;
    }
  }

  function updateDisplays() {
    const data = orbitalData();
    const orbit = classifyOrbit(data);
    const initial = simulation.initial || data;
    const energyError = initial.totalEnergy
      ? (data.totalEnergy - initial.totalEnergy) / Math.abs(initial.totalEnergy)
      : 0;
    const angularError = initial.angularMomentum
      ? (data.angularMomentum - initial.angularMomentum) / Math.abs(initial.angularMomentum)
      : 0;

    els.orbitStatus.textContent = orbit.detail;
    els.orbitTypeBadge.textContent = orbit.label;
    els.orbitTypeBadge.className = `orbit-badge ${orbit.key}`;
    els.timeDisplay.textContent = formatElapsed(simulation.t);

    els.metricR.textContent = formatKm(data.r, 0);
    els.metricH.textContent = formatKm(data.r - simulation.centralRadius, 0);
    els.metricV.textContent = formatSpeed(data.v);
    els.metricOmega.textContent = formatAngularSpeed(data.omega);
    els.metricT.textContent = formatTime(data.period);
    els.metricA.textContent = Number.isFinite(data.semiMajor) && data.semiMajor > 0
      ? formatKm(data.semiMajor, 0)
      : '—';
    els.metricE.textContent = caNumber(data.eccentricity, 4);
    els.metricTheta.textContent = `${caNumber(simulation.theta * 180 / Math.PI, 1)}° (${caNumber(simulation.theta / TWO_PI, 3)} voltes)`;

    els.metricEc.textContent = formatSI(data.kinetic, 'J');
    els.metricEp.textContent = formatSI(data.potential, 'J');
    els.metricEm.textContent = formatSI(data.totalEnergy, 'J');
    els.metricEnergyError.textContent = `${caNumber(energyError * 100, 6)} %`;

    els.metricL.textContent = `${formatScientific(data.angularMomentum, 4)} kg·m²/s`;
    els.metricL0.textContent = `${formatScientific(initial.angularMomentum, 4)} kg·m²/s`;
    els.metricLError.textContent = initial.angularMomentum === 0
      ? 'No definit (L₀ = 0)'
      : `${caNumber(angularError * 100, 8)} %`;
    const lFromOmega = simulation.mass * data.r * data.r * data.omega;
    els.metricLCheck.textContent = `${formatScientific(lFromOmega, 4)} kg·m²/s`;
  }

  function resizeCanvas(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: rect.width, height: rect.height };
  }

  function generateStars(width, height) {
    const seedCount = Math.round((width * height) / 7500);
    simulation.stars = [];
    let seed = 92371;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < seedCount; i += 1) {
      simulation.stars.push({
        x: random() * width,
        y: random() * height,
        r: 0.4 + random() * 1.2,
        alpha: 0.25 + random() * 0.65,
      });
    }
  }

  function worldToCanvas(x, y, width, height, viewRadius = simulation.viewRadius) {
    const scale = 0.45 * Math.min(width, height) / viewRadius;
    return {
      x: width / 2 + x * scale,
      y: height / 2 - y * scale,
      scale,
    };
  }

  function drawOrbitCanvas() {
    const ctx = els.orbitCtx;
    const { width, height } = resizeCanvas(els.orbitCanvas, ctx);
    if (!simulation.stars.length || simulation.stars.width !== width || simulation.stars.height !== height) {
      generateStars(width, height);
      simulation.stars.width = width;
      simulation.stars.height = height;
    }

    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#07111f');
    bg.addColorStop(1, '#0b1627');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    simulation.stars.forEach(star => {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, TWO_PI);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    drawDistanceGuides(ctx, width, height);
    drawTheoreticalConic(ctx, width, height);

    if (els.showTrail.checked && simulation.trail.length > 1) {
      ctx.beginPath();
      simulation.trail.forEach((point, index) => {
        const p = worldToCanvas(point.x, point.y, width, height);
        if (index === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = 'rgba(56, 189, 248, 0.45)';
      ctx.shadowBlur = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    const centre = worldToCanvas(0, 0, width, height);
    const satellite = worldToCanvas(simulation.x, simulation.y, width, height);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centre.x, centre.y);
    ctx.lineTo(satellite.x, satellite.y);
    ctx.stroke();

    drawCentralBody(ctx, centre.x, centre.y, centre.scale);
    drawSatellite(ctx, satellite.x, satellite.y);
    drawVectors(ctx, satellite, width, height);
    drawOrbitLabels(ctx, centre, satellite, width, height);
  }

  function drawDistanceGuides(ctx, width, height) {
    const centre = worldToCanvas(0, 0, width, height);
    ctx.save();
    ctx.setLineDash([4, 7]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
    ctx.fillStyle = 'rgba(203, 213, 225, 0.72)';
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.textAlign = 'left';

    for (let i = 1; i <= 4; i += 1) {
      const worldRadius = simulation.viewRadius * i / 4;
      const pixelRadius = worldRadius * centre.scale;
      ctx.beginPath();
      ctx.arc(centre.x, centre.y, pixelRadius, 0, TWO_PI);
      ctx.stroke();
      ctx.fillText(`${caNumber(worldRadius / 1000, 0)} km`, centre.x + pixelRadius + 5, centre.y - 4);
    }
    ctx.restore();
  }

  function drawTheoreticalConic(ctx, width, height) {
    const initial = simulation.initial;
    if (!initial || initial.hSpecific === 0) return;

    const p = (initial.hSpecific ** 2) / simulation.mu;
    const e = initial.eccentricity;
    const periAngle = Math.atan2(initial.ey, initial.ex);
    const points = [];
    const samples = e < 1 ? 360 : 300;

    for (let i = 0; i <= samples; i += 1) {
      const trueAnomaly = e < 1
        ? TWO_PI * i / samples
        : -Math.PI + (2 * Math.PI * i / samples);
      const denominator = 1 + e * Math.cos(trueAnomaly);
      if (denominator <= 0.015) continue;
      const r = p / denominator;
      if (!Number.isFinite(r) || r > simulation.viewRadius * 1.6) continue;
      const angle = trueAnomaly + periAngle;
      points.push(worldToCanvas(r * Math.cos(angle), r * Math.sin(angle), width, height));
    }

    if (points.length < 2) return;
    ctx.save();
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.34)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 6]);
    ctx.stroke();
    ctx.restore();
  }

  function drawCentralBody(ctx, cx, cy, scale) {
    if (simulation.bodyKey === 'earth') drawEarth(ctx, cx, cy, scale);
    else drawPlanetX(ctx, cx, cy, scale);
  }

  function drawEarth(ctx, cx, cy, scale) {
    const radiusPx = Math.max(9, simulation.centralRadius * scale);
    const glow = ctx.createRadialGradient(cx, cy, radiusPx * 0.75, cx, cy, radiusPx * 1.42);
    glow.addColorStop(0, 'rgba(96, 165, 250, 0.25)');
    glow.addColorStop(1, 'rgba(96, 165, 250, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radiusPx * 1.42, 0, TWO_PI);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radiusPx, 0, TWO_PI);
    ctx.clip();

    const ocean = ctx.createRadialGradient(cx - radiusPx * 0.34, cy - radiusPx * 0.38, radiusPx * 0.1, cx, cy, radiusPx);
    ocean.addColorStop(0, '#7dd3fc');
    ocean.addColorStop(0.35, '#1687c6');
    ocean.addColorStop(0.78, '#075985');
    ocean.addColorStop(1, '#082f49');
    ctx.fillStyle = ocean;
    ctx.fillRect(cx - radiusPx, cy - radiusPx, radiusPx * 2, radiusPx * 2);

    if (radiusPx > 18) {
      ctx.fillStyle = '#65a85b';
      ctx.beginPath();
      // Amèrica del Nord i del Sud
      ctx.moveTo(cx - .62 * radiusPx, cy - .48 * radiusPx);
      ctx.bezierCurveTo(cx - .37 * radiusPx, cy - .69 * radiusPx, cx - .12 * radiusPx, cy - .46 * radiusPx, cx - .24 * radiusPx, cy - .23 * radiusPx);
      ctx.bezierCurveTo(cx - .35 * radiusPx, cy - .12 * radiusPx, cx - .25 * radiusPx, cy + .02 * radiusPx, cx - .16 * radiusPx, cy + .13 * radiusPx);
      ctx.bezierCurveTo(cx - .10 * radiusPx, cy + .31 * radiusPx, cx - .25 * radiusPx, cy + .66 * radiusPx, cx - .39 * radiusPx, cy + .72 * radiusPx);
      ctx.bezierCurveTo(cx - .48 * radiusPx, cy + .45 * radiusPx, cx - .55 * radiusPx, cy + .20 * radiusPx, cx - .43 * radiusPx, cy + .02 * radiusPx);
      ctx.bezierCurveTo(cx - .69 * radiusPx, cy - .08 * radiusPx, cx - .77 * radiusPx, cy - .31 * radiusPx, cx - .62 * radiusPx, cy - .48 * radiusPx);
      ctx.fill();

      // Europa, Àfrica i Àsia
      ctx.fillStyle = '#79b55c';
      ctx.beginPath();
      ctx.moveTo(cx - .02 * radiusPx, cy - .58 * radiusPx);
      ctx.bezierCurveTo(cx + .26 * radiusPx, cy - .72 * radiusPx, cx + .72 * radiusPx, cy - .50 * radiusPx, cx + .78 * radiusPx, cy - .18 * radiusPx);
      ctx.bezierCurveTo(cx + .55 * radiusPx, cy - .10 * radiusPx, cx + .43 * radiusPx, cy + .02 * radiusPx, cx + .30 * radiusPx, cy + .06 * radiusPx);
      ctx.bezierCurveTo(cx + .35 * radiusPx, cy + .31 * radiusPx, cx + .12 * radiusPx, cy + .60 * radiusPx, cx - .02 * radiusPx, cy + .43 * radiusPx);
      ctx.bezierCurveTo(cx - .15 * radiusPx, cy + .24 * radiusPx, cx - .18 * radiusPx, cy + .02 * radiusPx, cx - .07 * radiusPx, cy - .11 * radiusPx);
      ctx.bezierCurveTo(cx - .22 * radiusPx, cy - .25 * radiusPx, cx - .20 * radiusPx, cy - .48 * radiusPx, cx - .02 * radiusPx, cy - .58 * radiusPx);
      ctx.fill();

      // Austràlia
      ctx.fillStyle = '#8fbd65';
      ctx.beginPath();
      ctx.ellipse(cx + .54 * radiusPx, cy + .48 * radiusPx, .20 * radiusPx, .13 * radiusPx, -.25, 0, TWO_PI);
      ctx.fill();

      // Casquets i núvols
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.beginPath();
      ctx.ellipse(cx, cy - .91 * radiusPx, .48 * radiusPx, .12 * radiusPx, 0, 0, TWO_PI);
      ctx.ellipse(cx, cy + .91 * radiusPx, .42 * radiusPx, .10 * radiusPx, 0, 0, TWO_PI);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = Math.max(1, radiusPx * .045);
      ctx.beginPath();
      ctx.arc(cx - .12 * radiusPx, cy - .17 * radiusPx, .58 * radiusPx, .15, 1.75);
      ctx.arc(cx + .15 * radiusPx, cy + .15 * radiusPx, .55 * radiusPx, 3.45, 5.15);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(186, 230, 253, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, radiusPx, 0, TWO_PI);
    ctx.stroke();
  }

  function drawPlanetX(ctx, cx, cy, scale) {
    const radiusPx = Math.max(9, simulation.centralRadius * scale);
    const glow = ctx.createRadialGradient(cx, cy, radiusPx * .65, cx, cy, radiusPx * 1.5);
    glow.addColorStop(0, 'rgba(192, 132, 252, .28)');
    glow.addColorStop(1, 'rgba(192, 132, 252, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radiusPx * 1.5, 0, TWO_PI);
    ctx.fill();

    const planet = ctx.createRadialGradient(cx - radiusPx * .32, cy - radiusPx * .38, radiusPx * .12, cx, cy, radiusPx);
    planet.addColorStop(0, '#f0abfc');
    planet.addColorStop(.38, '#8b5cf6');
    planet.addColorStop(.76, '#4c1d95');
    planet.addColorStop(1, '#24104f');
    ctx.fillStyle = planet;
    ctx.beginPath();
    ctx.arc(cx, cy, radiusPx, 0, TWO_PI);
    ctx.fill();

    if (radiusPx > 18) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radiusPx, 0, TWO_PI);
      ctx.clip();
      ctx.strokeStyle = 'rgba(45, 212, 191, .58)';
      ctx.lineWidth = Math.max(2, radiusPx * .13);
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.ellipse(cx, cy + i * radiusPx * .24, radiusPx * 1.08, radiusPx * .17, -.18, 0, TWO_PI);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(253, 230, 138, .45)';
      ctx.beginPath();
      ctx.ellipse(cx - .28 * radiusPx, cy - .12 * radiusPx, .22 * radiusPx, .12 * radiusPx, -.5, 0, TWO_PI);
      ctx.ellipse(cx + .31 * radiusPx, cy + .25 * radiusPx, .18 * radiusPx, .09 * radiusPx, .6, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
    }

    ctx.strokeStyle = 'rgba(216, 180, 254, .9)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, radiusPx, 0, TWO_PI);
    ctx.stroke();
  }

  function drawSatellite(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = 'rgba(250, 204, 21, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = simulation.collided ? '#ef4444' : '#fde047';
    ctx.beginPath();
    ctx.arc(0, 0, 5.2, 0, TWO_PI);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fef9c3';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  function drawArrow(ctx, x1, y1, x2, y2, color, label) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 9 * Math.cos(angle - Math.PI / 6), y2 - 9 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - 9 * Math.cos(angle + Math.PI / 6), y2 - 9 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.font = '600 12px Segoe UI, sans-serif';
    ctx.fillText(label, x2 + 6, y2 - 6);
    ctx.restore();
  }

  function drawVectors(ctx, satellite) {
    const data = orbitalData();
    if (els.showVelocity.checked && data.v > 0) {
      const scale = clamp(65 / data.v, 0.004, 0.02);
      drawArrow(
        ctx,
        satellite.x, satellite.y,
        satellite.x + simulation.vx * scale,
        satellite.y - simulation.vy * scale,
        '#60a5fa', 'v'
      );
    }

    if (els.showAcceleration.checked) {
      const { ax, ay } = acceleration(simulation.x, simulation.y);
      const a = Math.hypot(ax, ay);
      const scale = a > 0 ? 55 / a : 0;
      drawArrow(
        ctx,
        satellite.x, satellite.y,
        satellite.x + ax * scale,
        satellite.y - ay * scale,
        '#f87171', 'a'
      );
    }
  }

  function drawOrbitLabels(ctx, centre, satellite, width, height) {
    const data = orbitalData();
    ctx.save();
    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(simulation.bodyName, centre.x, clamp(centre.y + Math.max(22, simulation.centralRadius * centre.scale + 18), 15, height - 8));
    ctx.textAlign = 'left';
    const labelX = clamp(satellite.x + 10, 8, width - 170);
    const labelY = clamp(satellite.y + 20, 18, height - 30);
    ctx.fillText(`r = ${caNumber(data.r / 1000, 0)} km`, labelX, labelY);
    ctx.fillText(`v = ${caNumber(data.v / 1000, 2)} km/s`, labelX, labelY + 16);
    ctx.restore();
  }

  function drawChartBase(ctx, canvas, title, yLabel) {
    const size = resizeCanvas(canvas, ctx);
    const { width, height } = size;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fafbfc';
    ctx.fillRect(0, 0, width, height);

    const pad = { left: 54, right: 14, top: 29, bottom: 33 };
    const plot = {
      x: pad.left,
      y: pad.top,
      width: width - pad.left - pad.right,
      height: height - pad.top - pad.bottom,
    };

    ctx.fillStyle = '#1a2332';
    ctx.font = '600 12px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, pad.left, 17);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const y = plot.y + plot.height * i / 4;
      ctx.beginPath();
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.x + plot.width, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 5; i += 1) {
      const x = plot.x + plot.width * i / 5;
      ctx.beginPath();
      ctx.moveTo(x, plot.y);
      ctx.lineTo(x, plot.y + plot.height);
      ctx.stroke();
    }

    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(plot.x, plot.y);
    ctx.lineTo(plot.x, plot.y + plot.height);
    ctx.lineTo(plot.x + plot.width, plot.y + plot.height);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('temps', plot.x + plot.width / 2, height - 8);
    ctx.save();
    ctx.translate(12, plot.y + plot.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();

    return { ...size, plot };
  }

  function drawEnergyChart() {
    const ctx = els.energyCtx;
    const { plot } = drawChartBase(ctx, els.energyCanvas, 'Energies en funció del temps', 'energia');
    const values = simulation.history.flatMap(item => [item.kinetic, item.potential, item.total]);
    if (!values.length) return;

    let minY = Math.min(...values, 0);
    let maxY = Math.max(...values, 0);
    const span = Math.max(maxY - minY, Math.max(Math.abs(maxY), Math.abs(minY)) * 0.08, 1);
    minY -= span * 0.08;
    maxY += span * 0.08;
    const tMin = simulation.history[0].t;
    const tMax = Math.max(simulation.history[simulation.history.length - 1].t, tMin + 1);

    const mapX = t => plot.x + (t - tMin) / (tMax - tMin) * plot.width;
    const mapY = v => plot.y + (maxY - v) / (maxY - minY) * plot.height;

    if (minY < 0 && maxY > 0) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(plot.x, mapY(0));
      ctx.lineTo(plot.x + plot.width, mapY(0));
      ctx.stroke();
    }

    drawHistoryLine(ctx, 'kinetic', '#2563eb', mapX, mapY);
    drawHistoryLine(ctx, 'potential', '#ea580c', mapX, mapY);
    drawHistoryLine(ctx, 'total', '#059669', mapX, mapY, 2.3);

    ctx.fillStyle = '#64748b';
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(compactEnergy(maxY), plot.x - 5, plot.y + 4);
    ctx.fillText(compactEnergy(minY), plot.x - 5, plot.y + plot.height);

    drawChartLegend(ctx, plot.x + 5, plot.y + 6, [
      ['Eₖ', '#2563eb'], ['Eₚ', '#ea580c'], ['Eₘ', '#059669']
    ]);
  }

  function compactEnergy(value) {
    const abs = Math.abs(value);
    if (abs >= 1e12) return `${caNumber(value / 1e12, 1)} TJ`;
    if (abs >= 1e9) return `${caNumber(value / 1e9, 1)} GJ`;
    if (abs >= 1e6) return `${caNumber(value / 1e6, 1)} MJ`;
    return formatScientific(value, 1);
  }

  function drawAngularChart() {
    const ctx = els.angularCtx;
    const { plot } = drawChartBase(ctx, els.angularCanvas, 'Conservació del moment angular', 'ΔL/L₀ (ppm)');
    if (!simulation.history.length) return;

    const values = simulation.history.map(item => item.angularRel * 1e6);
    let maxAbs = Math.max(...values.map(Math.abs), 1e-7);
    maxAbs *= 1.25;
    const minY = -maxAbs;
    const maxY = maxAbs;
    const tMin = simulation.history[0].t;
    const tMax = Math.max(simulation.history[simulation.history.length - 1].t, tMin + 1);
    const mapX = t => plot.x + (t - tMin) / (tMax - tMin) * plot.width;
    const mapY = v => plot.y + (maxY - v) / (maxY - minY) * plot.height;

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(plot.x, mapY(0));
    ctx.lineTo(plot.x + plot.width, mapY(0));
    ctx.stroke();

    ctx.beginPath();
    simulation.history.forEach((item, index) => {
      const x = mapX(item.t);
      const y = mapY(item.angularRel * 1e6);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${formatScientific(maxY, 1)}`, plot.x - 5, plot.y + 4);
    ctx.fillText(`${formatScientific(minY, 1)}`, plot.x - 5, plot.y + plot.height);
    drawChartLegend(ctx, plot.x + 5, plot.y + 6, [['ΔL/L₀', '#7c3aed']]);
  }

  function drawHistoryLine(ctx, key, color, mapX, mapY, lineWidth = 1.8) {
    ctx.beginPath();
    simulation.history.forEach((item, index) => {
      const x = mapX(item.t);
      const y = mapY(item[key]);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function drawChartLegend(ctx, x, y, items) {
    ctx.save();
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    let cursor = x;
    items.forEach(([label, color]) => {
      ctx.fillStyle = color;
      ctx.fillRect(cursor, y, 12, 3);
      ctx.fillStyle = '#475569';
      ctx.fillText(label, cursor + 16, y + 4);
      cursor += 52;
    });
    ctx.restore();
  }

  function drawAll() {
    drawOrbitCanvas();
    drawEnergyChart();
    drawAngularChart();
  }

  function setMode(mode) {
    simulation.mode = mode;
    updateControlLabels();
    resetSimulation();
  }

  function applyPreset(name) {
    const bodyRadiusKm = simulation.centralRadius / 1000;
    let radiusKm = bodyRadiusKm + 400;
    let mode = 'free';
    let speedKmS;

    switch (name) {
      case 'leo':
        radiusKm = bodyRadiusKm + 400;
        mode = 'circular';
        speedKmS = circularSpeed(radiusKm * 1000) / 1000;
        break;
      case 'geo':
        if (simulation.bodyKey !== 'earth') return;
        radiusKm = 42_164;
        mode = 'circular';
        speedKmS = circularSpeed(radiusKm * 1000) / 1000;
        break;
      case 'ellipse':
        radiusKm = bodyRadiusKm + 500;
        speedKmS = 1.18 * circularSpeed(radiusKm * 1000) / 1000;
        break;
      case 'eccentric':
        radiusKm = bodyRadiusKm + 500;
        speedKmS = 1.38 * circularSpeed(radiusKm * 1000) / 1000;
        break;
      case 'escape':
        radiusKm = bodyRadiusKm + 500;
        speedKmS = escapeSpeed(radiusKm * 1000) / 1000;
        break;
      case 'hyperbolic':
        radiusKm = bodyRadiusKm + 500;
        speedKmS = 1.10 * escapeSpeed(radiusKm * 1000) / 1000;
        break;
      case 'fall':
        radiusKm = bodyRadiusKm + 4_000;
        speedKmS = 0;
        break;
      default:
        return;
    }

    document.querySelector(`input[name="orbitMode"][value="${mode}"]`).checked = true;
    simulation.mode = mode;
    els.radiusSlider.value = String(clamp(radiusKm, Number(els.radiusSlider.min), Number(els.radiusSlider.max)));
    els.speedSlider.value = speedKmS.toFixed(2);
    updateControlLabels();
    resetSimulation();
  }

  function bindEvents() {
    document.querySelectorAll('input[name="centralBody"]').forEach(input => {
      input.addEventListener('change', event => {
        configureBody(event.target.value);
        updateControlLabels();
        resetSimulation();
      });
    });

    document.querySelectorAll('input[name="orbitMode"]').forEach(input => {
      input.addEventListener('change', event => setMode(event.target.value));
    });

    els.radiusSlider.addEventListener('input', () => {
      updateControlLabels();
      resetSimulation();
    });

    els.speedSlider.addEventListener('input', () => {
      updateControlLabels();
      resetSimulation();
    });

    els.massSlider.addEventListener('input', () => {
      updateControlLabels();
      resetSimulation();
    });

    els.planetMassInput.addEventListener('change', updateBodyFromInputs);
    els.planetRadiusInput.addEventListener('change', updateBodyFromInputs);

    els.timeScale.addEventListener('input', updateTimeScaleLabel);
    [els.showVelocity, els.showAcceleration, els.showTrail].forEach(input => {
      input.addEventListener('change', drawOrbitCanvas);
    });

    els.btnPlay.addEventListener('click', () => setPlaying(!simulation.playing));
    els.btnReset.addEventListener('click', () => resetSimulation());
    els.btnStep.addEventListener('click', () => {
      setPlaying(false);
      advanceSimulation(60);
      updateDisplays();
      drawAll();
    });

    els.btnCircularize.addEventListener('click', () => {
      simulation.mode = 'free';
      document.querySelector('input[name="orbitMode"][value="free"]').checked = true;
      const radius = Number(els.radiusSlider.value) * 1000;
      els.speedSlider.value = (circularSpeed(radius) / 1000).toFixed(2);
      updateControlLabels();
      resetSimulation();
    });

    document.querySelectorAll('.preset-btn').forEach(button => {
      button.addEventListener('click', () => applyPreset(button.dataset.preset));
    });

    window.addEventListener('resize', drawAll);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && simulation.playing) setPlaying(false);
    });
  }

  function init() {
    cacheElements();
    bindEvents();
    configureBody('earth', { preserveHeight: false });
    updateControlLabels();
    resetSimulation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();