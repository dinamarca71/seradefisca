# AGENTS.md — Simuladors escola

Guia per a l'agent de Cursor. Es carrega automàticament com a context en cada conversa.

## Què és aquest projecte

Web estàtica amb **simuladors interactius per a alumnes de 2n de Batxillerat**,
amb finalitat educativa. Cobreix **Física** i **Matemàtiques**. Tota la interfície
i els textos van en **català**.

Punt d'entrada global: `index.html` (des d'aquí es tria Matemàtiques o Física).

## Estructura

```
escola/
├── index.html            # portada global (Matemàtiques | Física)
├── LICENSE               # llicència CC BY 4.0 dels continguts
├── css/comunes.css       # estils compartits per TOT el projecte
├── js/utilitats.js       # helpers de canvas i controls compartits
├── matematiques/         # matrius, sistemes, probabilitat, derivades, integrals
│   ├── index.html        # portada de mates
│   └── dades/            # datasets JSON (p. ex. estadística)
└── fisica/               # portada de física + packs temàtics
    ├── index.html
    ├── ones/             # superposició, estacionàries, Young, Doppler
    ├── oscil·lacions/    # mhs, ressort, energia, pèndol
    ├── electromagnetisme/# coulomb, circuits, inducció
    └── fisica-moderna/   # semivida, sèries, defecte de massa
```

## Convencions

- **Idioma**: tots els textos visibles, títols i comentaris nous, en **català**.
- **Sense frameworks ni build**: HTML, CSS i JavaScript "vanilla". Res de npm,
  dependències ni pas de compilació. S'obre directament al navegador.
- **Reutilitza el compartit**: estils a `css/comunes.css` i helpers a
  `js/utilitats.js`; no dupliquis codi entre simuladors.
- **Rutes relatives** sempre (mai `d:\...`). La profunditat de carpeta determina
  els `../` cap a `css/` i `js/`:
  - arrel → `css/comunes.css`, `js/utilitats.js`
  - `fisica/` o `matematiques/` → `../css/…`, `../js/…`
  - `fisica/ones/` (i altres packs) → `../../css/…`, `../../js/…`
- En **moure fitxers**, revisa sempre que els `href`/`src` segueixin resolent.
- **UTF-8 sense BOM** per conservar accents i caràcters catalans.
- **Comentaris**: només per aclarir intencions no òbvies; no narris el codi.

## Patró de cada simulador

- Capçalera amb navegació (`nav-pack`) coherent amb la resta de pàgines.
- Controls interactius (sliders/botons/radios) + un `<canvas>` o SVG.
- Una secció final de **conceptes clau**.
- Un **peu de pàgina** (`.site-footer`) amb crèdits, llicència i ús d'IA
  (vegeu la secció següent).
- **Finalitat educativa**: mostra sempre el desenvolupament **pas a pas**, no
  només el resultat final.

## Peu de pàgina (crèdits, llicència i ús d'IA)

- **Totes** les pàgines HTML porten un `<footer class="site-footer">` just abans
  de tancar `</main>`. Els estils viuen a `css/comunes.css` (`.site-footer`).
- El bloc conté sempre dues línies: autoria + **llicència CC BY 4.0** (© 2026
  Òscar V.) i la declaració d'ús d'IA segons el **marc MIAE de Juan José de
  Haro** — actualment **Nivell 4 (cocreació humà-IA)**, feta amb Cursor i el
  model Claude Opus 4.8 (High).
- Els enllaços del peu són **externs** (Creative Commons, marc MIAE, GitHub),
  així que el bloc és idèntic a qualsevol profunditat de carpeta.
- L'enllaç al **repositori de GitHub** només va a `index.html` (portada global).
- En **crear una pàgina nova**, copia el peu d'una d'existent perquè es mantingui
  coherent. Si canvia el nom de l'autoria, la llicència o el nivell MIAE,
  actualitza'l a totes les pàgines i al fitxer `LICENSE`.

## Com previsualitzar

La majoria de pàgines s'obren directament al navegador (doble clic).
Si una pàgina fa `fetch` d'un JSON (p. ex. dades d'estadística), cal servir-la
via HTTP; des de l'arrel del projecte:

```
python -m http.server 8000
```

I obre `http://localhost:8000/`.

## A evitar

- No afegir dependències, gestors de paquets ni passos de build.
- No barrejar fitxers de física i matemàtiques fora de les seves carpetes.
- No trencar rutes relatives en reorganitzar.
- No escriure la interfície en cap idioma que no sigui el català.
