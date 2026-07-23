# AGENTS.md — Simuladors escola

Guia per a l'agent de Cursor. Es carrega automàticament com a context en cada conversa.

## Què és aquest projecte

Web estàtica amb **simuladors interactius per a alumnes de 2n de Batxillerat**,
amb finalitat educativa. Cobreix **Física** i **Matemàtiques**. Tota la interfície
i els textos van en **català**.

L'objectiu no és fer demostracions visuals espectaculars, sinó eines que un
professor pugui fer servir directament a classe i que ajudin l'alumnat a
observar, experimentar, formular hipòtesis i relacionar els resultats amb el
model físic o matemàtic. Cada element de la pantalla ha de tenir una funció
didàctica: si no ajuda a entendre, experimentar o interpretar, probablement sobra.

Punt d'entrada global: `index.html` (des d'aquí es tria Matemàtiques o Física).

## Estructura

Navegació de **2 nivells** (com Matemàtiques): portada de matèria → simulador.
No hi ha portades de «pack» intermèdies; els simuladors són **fitxers plans**
dins de `fisica/` o `matematiques/`, i la portada els agrupa visualment per
seccions temàtiques (`pack-section-title` + `pack-grid`).

```
escola/
├── index.html              # portada global (Matemàtiques | Física)
├── LICENSE                 # llicència CC BY 4.0 dels continguts
├── css/comunes.css         # estils compartits per TOT el projecte
├── js/utilitats.js         # helpers de canvas i controls compartits
├── vendor/katex/           # KaTeX vendoritzat en local (css, js, fonts)
├── matematiques/           # portada + simuladors (fitxers plans)
│   ├── index.html          # portada de mates (agrupada per seccions)
│   ├── matrius.html · sistemes.html · probabilitat.html · derivades.html · integrals.html
│   └── dades/              # datasets JSON (p. ex. estadística)
└── fisica/                 # portada + simuladors (fitxers plans)
    ├── index.html          # portada de física (agrupada per seccions)
    ├── semivida.html · series.html · defecte-massa.html        # física moderna
    ├── orbites.html (+ orbites.css · orbites.js)               # camp gravitatori
    ├── induccio.html                                           # electromagnetisme
    ├── mhs.html (+ mhs.css · mhs.js) · pendul.html             # MHS / oscil·lacions
    ├── superposicio.html · ones-estacionaries.html ·
    │   interferencia-young.html · efecte-doppler.html          # ones
    └── img/series/         # diagrames Wikimedia (sèries radioactives)
```

## Convencions

- **Idioma**: tots els textos visibles, títols i comentaris nous, en **català**.
  Els noms de variables i funcions poden ser en anglès tècnic o català, però amb
  coherència dins de cada fitxer.
- **Sense frameworks ni build**: HTML, CSS i JavaScript "vanilla". Res de npm ni
  pas de compilació. L'única dependència externa permesa és una biblioteca
  lleugera i justificada **vendoritzada en local** (avui, **KaTeX** a
  `vendor/katex/`), mai per CDN, perquè les pàgines segueixin obrint-se amb doble
  clic i funcionin sense connexió.
- **Res de mòduls ES amb `import`**: sota `file://` els mòduls no carreguen. Els
  scripts de pàgina són `<script>` clàssics (com la resta del projecte).
- **Reutilitza el compartit**: estils a `css/comunes.css` i helpers a
  `js/utilitats.js`; no dupliquis codi entre simuladors. Si una pàgina necessita
  estils propis, posa'ls en un CSS específic prim (p. ex.
  `fisica/orbites.css`) que **només** contingui el que és propi,
  sense recopiar `comunes.css`.
- **Rutes relatives** sempre (mai `d:\...`). La profunditat de carpeta determina
  els `../` cap a `css/`, `js/` i `vendor/`:
  - arrel → `css/comunes.css`, `js/utilitats.js`
  - `fisica/` o `matematiques/` (on viuen els simuladors) → `../css/…`,
    `../js/…`, `../vendor/…`
- En **moure fitxers**, revisa sempre que els `href`/`src` segueixin resolent.
- **UTF-8 sense BOM** per conservar accents i caràcters catalans.
- **Comentaris**: només per aclarir intencions no òbvies; no narris el codi.
- **Res de codi mort** ni fitxers temporals: no deixis mòduls, estils o fitxers
  que no s'utilitzin.

## Patró de cada simulador

- Capçalera amb navegació (`nav-pack`) coherent amb la resta de pàgines.
- Controls interactius (sliders/botons/radios) + un `<canvas>` o SVG.
- Quan sigui didàcticament útil, mostra **simultàniament** l'animació, els
  gràfics, els valors numèrics i les equacions rellevants; no separis en pantalles
  diferents allò que l'alumnat ha de comparar alhora.
- Els **escenaris predefinits** (presets) van de casos simples a més exigents i no
  substitueixen els controls manuals: són punts de partida per experimentar.
- Una secció final de **conceptes clau** (pot anar en un bloc plegable
  `<details>`).
- **Opcional: recursos / bibliografia destacada** (`<section class="recursos">`),
  just abans del peu de pàgina. Poques fonts triades (3–5): infografies, vídeos
  o articles al nivell de 2n de batxillerat.
  - Aquí l'idioma **pot ser CA, ES o EN** (excepció a la resta del web); les
    descripcions, però, es mantenen en català i cada recurs porta una etiqueta
    d'idioma (`<span class="lang">`).
  - Cada recurs: icona de tipus (🎬 vídeo · 📊 infografia · 📄 article · 🧪 eina),
    títol enllaçat, etiqueta d'idioma i una línia de context (font + per què és útil).
  - **Només enllaços externs** (`target="_blank" rel="noopener"`): res d'`<iframe>`
    incrustats, que trencarien l'obertura offline i afegirien rastrejadors.
  - Prioritza **fonts estables** (institucions, universitats, canals grans) per
    reduir els enllaços morts. Estils compartits a `.recursos` de `comunes.css`.
- Un **peu de pàgina** (`.site-footer`) amb crèdits, llicència i ús d'IA
  (vegeu la secció següent).
- **Finalitat educativa**: mostra sempre el desenvolupament **pas a pas**, no
  només el resultat final.

## Física, modelització i notació

- **Rigor**: equacions, hipòtesis i unitats correctes. Qualsevol aproximació
  (cos puntual, sense fregament, dos cossos, oscil·lacions petites…) s'ha
  d'explicitar en un bloc de «model físic».
- **Separació model / visualització**: la representació pot fer servir escales
  adaptades, però no ha d'alterar silenciosament la física; si les mides o els
  temps no són a escala, indica-ho.
- **Lleis de conservació**: quan el sistema conservi una magnitud (energia,
  moment lineal o angular…), la simulació ho ha de fer observable i, si es pot,
  mostrar l'error numèric o la desviació relativa.
- **Integració numèrica**: tria el mètode segons el problema. Per a sistemes
  conservatius (òrbites), fes servir integradors simplèctics (Velocity Verlet,
  Leapfrog); no facis servir Euler explícit sense explicar-ne les limitacions.
  Separa el pas temporal intern de la velocitat de reproducció.
- **Estat inicial**: la simulació ha de dibuixar-se bé des de la primera càrrega,
  sense exigir que l'usuari mogui cap control. El botó de reinici atura
  l'animació, reconstrueix l'estat des dels controls, buida trajectòries i
  redibuixa.
- **Unitats**: tota magnitud visible porta unitats (SI amb múltiples adequats:
  km, kJ/MJ/GJ, min/h/dies…), excepte adimensionals clarament identificades.
- **Xifres significatives**: mostra'n **3-4**; evita'n 5 o més per defecte i
  mantén un format estable mentre el valor canvia. Els càlculs interns conserven
  tota la precisió; el criteri només afecta la presentació. Fes servir notació
  científica per a valors molt grans o petits.
- **Matemàtiques (KaTeX)**: les fórmules es marquen amb l'atribut `data-math`
  (sintaxi LaTeX) i es renderitzen amb KaTeX. Els vectors amb `\vec{}` (no
  substituir sistemàticament per negreta). KaTeX es carrega des de
  `vendor/katex/` i degrada a text si no hi és.

## Accessibilitat i qualitat

- HTML semàntic, etiquetes associades als inputs, focus visible, contrast
  suficient i navegació per teclat. No transmetis informació **només** amb color
  (afegeix etiquetes, símbols o estils de línia). Els `<canvas>` porten una
  descripció textual breu (classe `.sr-only`).
- Respecta `prefers-reduced-motion` quan sigui possible i no deixis bucles
  d'animació actius amb la simulació pausada o la pàgina oculta.
- **Abans de donar per acabada una simulació**, comprova: que no hi ha errors de
  consola; que dibuixa l'estat inicial i els valors visibles coincideixen amb
  l'estat intern; que sliders, inputs i presets funcionen; que iniciar/pausar/
  reiniciar funciona diverses vegades; que les unitats i xifres són correctes i
  els casos límit no trenquen res; i que es veu bé a 1366 × 768.
- No alteris el model físic per millorar l'aspecte, ni afegeixis controls sense
  finalitat pedagògica, ni afirmis que una cosa s'ha provat si no s'ha executat.

## Peu de pàgina (crèdits, llicència i ús d'IA)

- **Totes** les pàgines HTML porten un `<footer class="site-footer">` just abans
  de tancar `</main>`. Els estils viuen a `css/comunes.css` (`.site-footer`).
- El bloc conté sempre dues línies: autoria + **llicència CC BY 4.0** (© 2026
  Òscar V.) i la declaració d'ús d'IA segons el **marc MIAE de Juan José de
  Haro** — actualment **Nivell 4 (cocreació humà-IA)**.
- La segona línia indica **amb quina eina i model** s'ha fet realment cada
  pàgina (transparència MIAE): la majoria, amb Cursor i Claude Opus 4.8 (High);
  el laboratori d'òrbites, amb ChatGPT (GPT-5.6 Thinking) i Cursor.
- Els enllaços del peu són **externs** (Creative Commons, marc MIAE, GitHub),
  així que el bloc és idèntic a qualsevol profunditat de carpeta.
- L'enllaç al **repositori de GitHub** només va a `index.html` (portada global).
- En **crear una pàgina nova**, copia el peu d'una d'existent perquè es mantingui
  coherent. Si canvia el nom de l'autoria, la llicència o el nivell MIAE,
  actualitza'l a totes les pàgines i al fitxer `LICENSE`.

## Com previsualitzar

La majoria de pàgines s'obren directament al navegador (doble clic), inclòs el
laboratori d'òrbites (KaTeX i el JS es carreguen en local, sense mòduls ES).
Si una pàgina fa `fetch` d'un JSON (p. ex. dades d'estadística), cal servir-la
via HTTP; des de l'arrel del projecte:

```
python -m http.server 8000
```

I obre `http://localhost:8000/`.

## A evitar

- No afegir dependències per CDN, gestors de paquets ni passos de build (les
  biblioteques permeses van vendoritzades en local).
- No introduir mòduls ES amb `import` en pàgines que s'han d'obrir amb doble clic.
- No barrejar fitxers de física i matemàtiques fora de les seves carpetes.
- No trencar rutes relatives en reorganitzar.
- No duplicar estils o helpers ja existents al compartit.
- No mostrar 5 o més xifres significatives per defecte.
- No escriure la interfície en cap idioma que no sigui el català.

## Referència

El **laboratori d'òrbites** (`fisica/orbites.html`) és
la referència del patró visual, pedagògic i funcional per a les simulacions
futures. No s'ha de copiar mecànicament: cal reutilitzar-ne els principis, els
components compartits i l'organització, adaptant-los a cada fenomen.
