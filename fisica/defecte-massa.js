(() => {
'use strict';

const U_TO_MEV = 931.49410242;
const U_TO_KG = 1.66053906660e-27;
const C = 299792458;
const ELECTRON_U = 0.000548579909065;

const reactions = [
  {
    id: "po210",
    group: "Emissió α",
    button: "²¹⁰Po → ²⁰⁶Pb + α",
    context: "Radioactivitat històrica",
    title: "Desintegració α del poloni-210",
    description: "Una partícula α surt del nucli. El nucli fill perd dos protons i dos neutrons.",
    reactants: [{ A: 210, Z: 84, symbol: "Po", name: "²¹⁰Po", mass: 209.9828737 }],
    products: [
      { A: 206, Z: 82, symbol: "Pb", name: "²⁰⁶Pb", mass: 205.9744653 },
      { A: 4, Z: 2, symbol: "He", name: "⁴He (α)", mass: 4.00260325413 }
    ],
    nuclearEquation: "nucli pare → nucli fill + 2p + 2n agrupats",
    nuclearExplanation: "La partícula α ja existia com una agrupació molt estable de dos protons i dos neutrons dins del nucli.",
    adjustment: "L’emissió d’una α redueix A en 4 i Z en 2.",
    ionization: "<strong>Producte immediat:</strong> l’àtom fill pot quedar ionitzat perquè la reorganització electrònica no és instantània. En el balanç usem masses d’àtoms neutres.",
    energyNote: "Q és principalment energia cinètica de la partícula α i del retrocés del nucli fill."
  },
  {
    id: "c14",
    group: "Emissió β⁻",
    button: "¹⁴C → ¹⁴N + e⁻ + ν̄",
    context: "Datació arqueològica",
    title: "Desintegració β⁻ del carboni-14",
    description: "Un neutró del nucli es transforma en un protó. A no canvia i Z augmenta en una unitat.",
    reactants: [{ A: 14, Z: 6, symbol: "C", name: "¹⁴C", mass: 14.0032419884 }],
    products: [
      { A: 14, Z: 7, symbol: "N", name: "¹⁴N", mass: 14.00307400443 },
      { A: 0, Z: -1, symbol: "e⁻", name: "electró β⁻", displayOnly: true },
      { A: 0, Z: 0, symbol: "ν̄ₑ", name: "antineutrí electrònic", displayOnly: true }
    ],
    nuclearEquation: "¹₀n → ¹₁p + ⁰₋₁e + ⁰₀ν̄ₑ",
    nuclearExplanation: "La interacció feble transforma un neutró en un protó, un electró i un antineutrí electrònic.",
    adjustment: "La càrrega nuclear es conserva: 6 = 7 + (−1). Tant l’electró com l’antineutrí tenen A = 0.",
    ionization: "<strong>Just després de la desintegració:</strong> el nucli té Z = 7, però l’àtom conserva inicialment els 6 electrons lligats del carboni. Per tant, el nitrogen fill queda com N⁺ fins que captura un electró del medi. L’electró β⁻ emès no és un electró orbital.",
    energyNote: "Amb masses atòmiques neutres, Q = [m(¹⁴C) − m(¹⁴N)]c². No s’ha de restar una altra vegada la massa de l’electró."
  },
  {
    id: "na22",
    group: "Emissió β⁺",
    button: "²²Na → ²²Ne + e⁺ + ν",
    context: "Aniquilació i PET",
    title: "Desintegració β⁺ del sodi-22",
    description: "Un protó del nucli es transforma en un neutró. A no canvia i Z disminueix en una unitat.",
    reactants: [{ A: 22, Z: 11, symbol: "Na", name: "²²Na", mass: 21.9944364 }],
    products: [
      { A: 22, Z: 10, symbol: "Ne", name: "²²Ne", mass: 21.991385114 },
      { A: 0, Z: 1, symbol: "e⁺", name: "positró β⁺", displayOnly: true },
      { A: 0, Z: 0, symbol: "νₑ", name: "neutrí electrònic", displayOnly: true }
    ],
    correction: 2 * ELECTRON_U,
    nuclearEquation: "¹₁p → ¹₀n + ⁰₊₁e + ⁰₀νₑ",
    nuclearExplanation: "La interacció feble transforma un protó en un neutró, un positró i un neutrí electrònic.",
    adjustment: "La càrrega nuclear es conserva: 11 = 10 + 1. El positró i el neutrí tenen A = 0.",
    ionization: "<strong>Producte immediat:</strong> el nucli fill té Z = 10, mentre que el núvol electrònic inicial prové del sodi. La reorganització pot incloure expulsió d’electrons. Per comparar masses atòmiques neutres cal fer la correcció de 2mₑ.",
    energyNote: "Amb masses atòmiques, Q = [m(pare) − m(fill) − 2mₑ]c². La creació del positró exigeix com a mínim 1,022 MeV."
  },
  {
    id: "tc99m",
    group: "Emissió γ",
    button: "⁹⁹ᵐTc → ⁹⁹Tc + γ",
    context: "Medicina nuclear",
    title: "Transició isomèrica del tecneci-99m",
    description: "El nucli passa d’un estat excitat a un estat de menor energia sense canviar la seva composició.",
    reactants: [{ A: 99, Z: 43, symbol: "Tc*", name: "⁹⁹ᵐTc", mass: 98.9062508 + 0.140511 / U_TO_MEV }],
    products: [
      { A: 99, Z: 43, symbol: "Tc", name: "⁹⁹Tc", mass: 98.9062508 },
      { A: 0, Z: 0, symbol: "γ", name: "fotó γ", displayOnly: true }
    ],
    nuclearEquation: "nucli excitat → nucli menys energètic + ⁰₀γ",
    nuclearExplanation: "No es transforma cap protó ni cap neutró. El nucli perd energia electromagnètica.",
    adjustment: "A = 99 i Z = 43 als dos costats. El fotó γ s’escriu amb A = 0 i Z = 0.",
    ionization: "<strong>En el model ideal:</strong> l’emissió γ no canvia el nombre d’electrons. En processos reals també pot haver-hi conversió interna i ionització, però no és el mecanisme representat aquí.",
    energyNote: "La diferència de massa-energia correspon a un fotó d’uns 140,5 keV."
  },
  {
    id: "dt",
    group: "Fusió",
    button: "²H + ³H → ⁴He + n",
    context: "Fusió experimental",
    title: "Fusió de deuteri i triti",
    description: "Dos nuclis lleugers s’uneixen i es reorganitzen en heli-4 i un neutró.",
    reactants: [
      { A: 2, Z: 1, symbol: "H", name: "²H", mass: 2.01410177812 },
      { A: 3, Z: 1, symbol: "H", name: "³H", mass: 3.01604928199 }
    ],
    products: [
      { A: 4, Z: 2, symbol: "He", name: "⁴He", mass: 4.00260325413 },
      { A: 1, Z: 0, symbol: "n", name: "neutró", mass: 1.00866491595 }
    ],
    nuclearEquation: "(p+n) + (p+2n) → (2p+2n) + n",
    nuclearExplanation: "Els cinc nucleons es reagrupen. Quatre formen un nucli d’heli especialment estable i un neutró queda lliure.",
    adjustment: "A: 2 + 3 = 4 + 1. Z: 1 + 1 = 2 + 0.",
    ionization: "<strong>Interpretació:</strong> les masses atòmiques dels isòtops d’hidrogen i de l’heli permeten que les masses dels electrons es cancel·lin.",
    energyNote: "Q ≈ 17,59 MeV. Aproximadament 14,1 MeV van al neutró i 3,5 MeV al nucli d’heli."
  },
  {
    id: "fission",
    group: "Fissió",
    button: "²³⁵U + n → ¹⁴¹Ba + ⁹²Kr + 3n",
    context: "Reacció en cadena",
    title: "Una branca de fissió de l’urani-235",
    description: "Després de capturar un neutró, el nucli compost es deforma i es divideix en dos fragments.",
    reactants: [
      { A: 235, Z: 92, symbol: "U", name: "²³⁵U", mass: 235.0439299 },
      { A: 1, Z: 0, symbol: "n", name: "neutró", mass: 1.00866491595 }
    ],
    products: [
      { A: 141, Z: 56, symbol: "Ba", name: "¹⁴¹Ba", mass: 140.9144064 },
      { A: 92, Z: 36, symbol: "Kr", name: "⁹²Kr", mass: 91.9261528 },
      { A: 1, Z: 0, symbol: "n", name: "neutró", mass: 1.00866491595, multiplicity: 3 }
    ],
    nuclearEquation: "²³⁶U* → dos fragments + neutrons + γ",
    nuclearExplanation: "El nucli compost excitat es divideix. Els fragments solen ser radioactius i continuen desintegrant-se.",
    adjustment: "A: 235 + 1 = 141 + 92 + 3. Z: 92 = 56 + 36.",
    ionization: "<strong>Productes reals:</strong> els fragments surten molt ionitzats i travessen el material perdent energia. Les masses tabulades continuen referides a àtoms neutres.",
    energyNote: "Aquesta partició concreta dona prop de 174 MeV. La fissió real presenta moltes branques i energia addicional en desintegracions posteriors."
  },
  {
    id: "ra226",
    group: "Emissió α",
    button: "²²⁶Ra → ²²²Rn + α",
    context: "Gas radó",
    title: "Desintegració α del radi-226",
    description: "El radi-226 produeix radó-222, un gas radioactiu rellevant en protecció radiològica.",
    reactants: [{ A: 226, Z: 88, symbol: "Ra", name: "²²⁶Ra", mass: 226.0254103 }],
    products: [
      { A: 222, Z: 86, symbol: "Rn", name: "²²²Rn", mass: 222.0175782 },
      { A: 4, Z: 2, symbol: "He", name: "⁴He (α)", mass: 4.00260325413 }
    ],
    nuclearEquation: "nucli pare → nucli fill + 2p + 2n agrupats",
    nuclearExplanation: "El mecanisme és el mateix que en altres emissions α: surt una agrupació d’heli-4.",
    adjustment: "A: 226 = 222 + 4. Z: 88 = 86 + 2.",
    ionization: "<strong>Producte immediat:</strong> el radó i la partícula α poden quedar ionitzats. En el medi, la partícula α acaba capturant electrons i esdevé heli neutre.",
    energyNote: "Q és aproximadament 4,87 MeV."
  },
  {
    id: "be7",
    group: "Captura electrònica",
    button: "⁷Be + e⁻ → ⁷Li + ν",
    context: "Neutrins solars",
    title: "Captura electrònica del beril·li-7",
    description: "El nucli captura un electró orbital i un protó es transforma en un neutró.",
    reactants: [
      { A: 7, Z: 4, symbol: "Be", name: "⁷Be", mass: 7.01692983 },
      { A: 0, Z: -1, symbol: "e⁻", name: "electró orbital", displayOnly: true }
    ],
    products: [
      { A: 7, Z: 3, symbol: "Li", name: "⁷Li", mass: 7.0160034366 },
      { A: 0, Z: 0, symbol: "νₑ", name: "neutrí electrònic", displayOnly: true }
    ],
    nuclearEquation: "¹₁p + ⁰₋₁e → ¹₀n + ⁰₀νₑ",
    nuclearExplanation: "Un protó captura un electró de les capes internes i es transforma en neutró, emetent un neutrí.",
    adjustment: "A: 7 + 0 = 7 + 0. Z: 4 + (−1) = 3 + 0.",
    ionization: "<strong>Després de la captura:</strong> queda una vacant electrònica interna. Quan els electrons es reordenen s’emeten raigs X característics o electrons Auger.",
    energyNote: "Amb masses atòmiques neutres, Q = [m(⁷Be) − m(⁷Li)]c²."
  }
];

let current = reactions[0];

function sumQuantum(items, key) {
  return items.reduce((sum, item) => sum + item[key] * (item.multiplicity || 1), 0);
}

function sumMass(items) {
  return items.reduce((sum, item) => sum + (item.mass || 0) * (item.multiplicity || 1), 0);
}

function formatNumber(value, digits = 4) {
  return value.toLocaleString("ca-ES", { maximumFractionDigits: digits });
}

function formatMass(value) {
  return value.toLocaleString("ca-ES", {
    minimumFractionDigits: 6,
    maximumFractionDigits: 9
  });
}

function formatScientific(value, digits = 3) {
  if (value === 0) return "0";
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / 10 ** exponent;
  return `${formatNumber(mantissa, digits)}·10<sup>${exponent}</sup>`;
}

function signed(value) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function nuclideHTML(item) {
  const mult = item.multiplicity && item.multiplicity > 1
    ? `<span class="multiplicity" aria-label="${item.multiplicity} vegades">${item.multiplicity}</span>`
    : "";
  return `
    <span class="nuclide-wrap">
      ${mult}
      <span class="nuclide ${item.A === 0 ? "particle" : ""}">
        <span class="a-number">${item.A}</span>
        <span class="z-number">${signed(item.Z)}</span>
        <span class="symbol">${item.symbol}</span>
      </span>
    </span>`;
}

function sideHTML(items) {
  return items.map(nuclideHTML).join('<span class="reaction-plus">+</span>');
}

function calculate(reaction) {
  const reactantMass = sumMass(reaction.reactants);
  const productMass = sumMass(reaction.products);
  const correction = reaction.correction || 0;
  const deltaMass = reactantMass - productMass - correction;
  const qMeV = deltaMass * U_TO_MEV;
  const qJ = deltaMass * U_TO_KG * C * C;

  return { reactantMass, productMass, correction, deltaMass, qMeV, qJ };
}

function renderPresets() {
  const list = document.getElementById("presetList");
  list.innerHTML = reactions.map(reaction => `
    <button class="preset-button ${reaction.id === current.id ? "active" : ""}"
      data-reaction="${reaction.id}" type="button" role="listitem">
      <strong>${reaction.button}</strong>
      <span>${reaction.group} · ${reaction.context}</span>
    </button>
  `).join("");

  list.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      current = reactions.find(reaction => reaction.id === button.dataset.reaction);
      renderPresets();
      renderReaction();
    });
  });
}

function balanceRows(items) {
  return items.map(item => {
    const label = item.multiplicity && item.multiplicity > 1
      ? `${item.multiplicity} × ${item.name}`
      : item.name;
    const aShow = item.multiplicity && item.multiplicity > 1
      ? `${item.multiplicity}×${item.A}`
      : item.A;
    const zShow = item.multiplicity && item.multiplicity > 1
      ? `${item.multiplicity}×${signed(item.Z)}`
      : signed(item.Z);
    return `
    <div class="balance-line">
      <span>${label}</span>
      <span class="az a">A = ${aShow}</span>
      <span class="az z">Z = ${zShow}</span>
    </div>`;
  }).join("");
}

function renderReaction() {
  const reaction = current;
  const result = calculate(reaction);

  const leftA = sumQuantum(reaction.reactants, "A");
  const rightA = sumQuantum(reaction.products, "A");
  const leftZ = sumQuantum(reaction.reactants, "Z");
  const rightZ = sumQuantum(reaction.products, "Z");
  const balanced = leftA === rightA && leftZ === rightZ;

  document.getElementById("reactionType").textContent = reaction.group;
  document.getElementById("reactionTitle").textContent = reaction.title;
  document.getElementById("reactionDescription").textContent = reaction.description;
  document.getElementById("contextBadge").textContent = reaction.context;

  document.getElementById("reactionEquation").innerHTML = `
    <div class="reaction-side">${sideHTML(reaction.reactants)}</div>
    <span class="reaction-arrow">→</span>
    <div class="reaction-side">${sideHTML(reaction.products)}</div>
  `;

  document.getElementById("nuclearEquation").textContent = reaction.nuclearEquation;
  document.getElementById("nuclearExplanation").textContent = reaction.nuclearExplanation;

  document.getElementById("leftBreakdown").innerHTML = balanceRows(reaction.reactants);
  document.getElementById("rightBreakdown").innerHTML = balanceRows(reaction.products);
  document.getElementById("leftTotals").innerHTML =
    `<span class="a">ΣA = ${leftA}</span><span class="z">ΣZ = ${signed(leftZ)}</span>`;
  document.getElementById("rightTotals").innerHTML =
    `<span class="a">ΣA = ${rightA}</span><span class="z">ΣZ = ${signed(rightZ)}</span>`;

  const balanceStatus = document.getElementById("balanceStatus");
  balanceStatus.className = `status-pill ${balanced ? "ok" : ""}`;
  balanceStatus.textContent = balanced ? "✓ Reacció ajustada" : "Revisa l’ajust";

  const checkA = document.getElementById("checkA");
  checkA.className = `conservation-card ${leftA === rightA ? "ok" : ""}`;
  checkA.innerHTML = `<strong>A:</strong> ${leftA} = ${rightA} ${leftA === rightA ? "✓" : "✗"}`;

  const checkZ = document.getElementById("checkZ");
  checkZ.className = `conservation-card ${leftZ === rightZ ? "ok" : ""}`;
  checkZ.innerHTML = `<strong>Z:</strong> ${signed(leftZ)} = ${signed(rightZ)} ${leftZ === rightZ ? "✓" : "✗"}`;

  document.getElementById("adjustmentNote").innerHTML = reaction.adjustment;

  const massRows = [
    ...reaction.reactants.map(item => ({ ...item, side: "Reactiu" })),
    ...reaction.products.map(item => ({ ...item, side: "Producte" }))
  ].filter(item => item.mass);

  document.getElementById("massTableBody").innerHTML = massRows.map(item => {
    const mult = item.multiplicity && item.multiplicity > 1 ? item.multiplicity : 1;
    const label = mult > 1 ? `${mult} × ${item.name}` : item.name;
    const massShown = item.mass * mult;
    return `
    <tr>
      <td>${item.side}</td>
      <td><strong>${label}</strong></td>
      <td>${formatMass(massShown)}${mult > 1 ? ` <span class="mass-hint">(${formatMass(item.mass)} u cad.)</span>` : ""}</td>
    </tr>`;
  }).join("");

  document.getElementById("massReactants").innerHTML =
    `Σm<sub>reactius</sub> = ${formatMass(result.reactantMass)} u`;
  document.getElementById("massProducts").innerHTML =
    `Σm<sub>productes</sub> = ${formatMass(result.productMass)} u`;

  const correctionElement = document.getElementById("massCorrection");
  correctionElement.innerHTML = result.correction
    ? `Correcció β⁺: 2m<sub>e</sub> = ${formatMass(result.correction)} u`
    : "";

  document.getElementById("deltaMassLine").innerHTML =
    `Δm = ${formatMass(result.reactantMass)} − ${formatMass(result.productMass)}${result.correction ? ` − ${formatMass(result.correction)}` : ""} = ${formatMass(result.deltaMass)} u`;

  document.getElementById("energyLine").innerHTML =
    `Q = Δm·931,494 = ${formatNumber(result.qMeV, 4)} MeV`;

  const displayedEnergy = result.qMeV < 1
    ? `${formatNumber(result.qMeV * 1000, 4)} keV`
    : `${formatNumber(result.qMeV, 4)} MeV`;

  document.getElementById("resultMetrics").innerHTML = `
    <div class="metric"><b>Defecte de massa</b><span>${formatNumber(result.deltaMass, 4)} u</span></div>
    <div class="metric"><b>Energia alliberada Q</b><span>${displayedEnergy}</span></div>
    <div class="metric"><b>Equivalent en joules</b><span>${formatScientific(result.qJ, 3)} J</span></div>
  `;

  document.getElementById("massNote").innerHTML = reaction.energyNote;
  document.getElementById("ionizationBox").innerHTML = reaction.ionization;
  document.getElementById("energyInterpretation").innerHTML =
    result.deltaMass > 0
      ? `<strong>Procés exoenergètic.</strong> La massa dels reactius és superior a la dels productes i la diferència apareix com energia.`
      : `<strong>Procés endoenergètic.</strong> Cal aportar energia perquè la massa final és superior.`;

  document.getElementById("numericSteps").innerHTML = `
    <ol>
      <li>Sumem les masses tabulades dels reactius: ${formatMass(result.reactantMass)} u.</li>
      <li>Sumem les masses tabulades dels productes: ${formatMass(result.productMass)} u.</li>
      ${result.correction ? `<li>Com que és β⁺ i usem masses atòmiques, restem 2mₑ = ${formatMass(result.correction)} u.</li>` : ""}
      <li>Obtenim Δm = ${formatMass(result.deltaMass)} u.</li>
      <li>Multipliquem per 931,494 MeV/u: Q = ${formatNumber(result.qMeV, 4)} MeV.</li>
    </ol>
  `;

  renderMath();
}

function renderMath() {
  if (typeof katex === "undefined") return;
  document.querySelectorAll("[data-math]").forEach(element => {
    if (element.dataset.rendered === "true") return;
    try {
      katex.render(element.dataset.math, element, {
        throwOnError: false,
        displayMode: false
      });
      element.dataset.rendered = "true";
    } catch (_) {
      // El text original queda visible si KaTeX no pot renderitzar-lo.
    }
  });
}

renderPresets();
renderReaction();

})();
