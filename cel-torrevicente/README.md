# El cel de Torrevicente

Web interactiva familiar per preparar i recordar l'observació del cel i l'eclipsi total de Sol del **12 d'agost de 2026** des de Torrevicente (Sòria).

## Què inclou

- Mapa dinàmic del cel per a Torrevicente, calculat segons la data i l'hora.
- Estrelles i constel·lacions principals de l'estiu.
- Controls de temps, animació i mode de llum vermella.
- Reptes familiars desables al navegador.
- Temporitzador de 20 minuts per adaptar la vista a la foscor.
- Simulació interactiva de les fases de l'eclipsi.
- Cronologia local de la totalitat i recordatori de seguretat.
- Registre d'observació amb comptadors de Persèides i satèl·lits.
- Generació d'una imatge-record en format PNG.
- PWA: després de la primera visita publicada amb HTTPS, pot funcionar sense connexió.

No utilitza cap llibreria, API ni font externa. Tot és HTML, CSS i JavaScript local.

## Obrir-la a l'ordinador

La major part de la web funciona obrint directament `index.html`.

Per provar també la instal·lació i el funcionament fora de línia, cal servir la carpeta per HTTP. Per exemple, amb Python:

```bash
cd cel-torrevicente
python -m http.server 8000
```

Després obre `http://localhost:8000`.

## Publicar-la a GitHub Pages

1. Copia tota aquesta carpeta dins del repositori, per exemple com a `cel-torrevicente/`.
2. Fes commit i push.
3. Si el repositori ja té GitHub Pages actiu, la pàgina quedarà disponible a:

```text
https://USUARI.github.io/REPOSITORI/cel-torrevicente/
```

El fitxer `sw.js` només controla aquesta subcarpeta, de manera que no hauria d'interferir amb la resta de *Sera de Física*.

Per enllaçar-la de manera discreta des de la portada global (`index.html`),
hi ha una icona d’eclipsi al peu de pàgina que apunta a `cel-torrevicente/`.

També pots fer servir l’URL directa:

```text
…/cel-torrevicente/index.html
```

O un enllaç HTML:

```html
<a href="cel-torrevicente/index.html" class="footer-cel" title="El cel de Torrevicente">…</a>
```
## Fitxers

- `index.html`: estructura i contingut.
- `styles.css`: disseny responsiu.
- `app.js`: càlcul astronòmic, canvas, reptes, eclipsi i registre.
- `manifest.webmanifest`: instal·lació com a aplicació.
- `sw.js`: memòria cau per funcionar sense connexió.
- `assets/favicon.svg`: icona.

## Dades de Torrevicente

La web treballa amb aquestes coordenades:

- Latitud: 41,335278° N
- Longitud: 2,941389° O
- Altitud aproximada: 1.202 m
- Fus horari: Europe/Madrid

### Cronologia local de l'eclipsi

- Inici de la parcialitat: 19:35:07
- Inici de la totalitat: 20:29:49
- Màxim: 20:30:40
- Final de la totalitat: 20:31:31
- Final de l'eclipsi: 21:12:00
- Durada de la totalitat: 1 min 41 s
- Altura del Sol al màxim: 7°
- Azimut del Sol al màxim: 283°

Fonts de consulta i contrast:

- Instituto Geográfico Nacional: `https://astronomia.ign.es/eclipses-de-sol-y-luna/eclipse-total-sol-de-12-de-agosto-2026`
- Portal oficial d'eclipsis de l'IGN: `https://eclipses.ign.es/`
- NASA: `https://science.nasa.gov/eclipses/future-eclipses/total-solar-eclipse-on-august-12-2026/`
- Dades locals de Torrevicente: `https://pt.tutiempo.net/eclipse-solar/torrevicente/12-agosto-2026.html`

## Precisió i límits

El mapa converteix coordenades equatorials J2000 aproximades de les estrelles principals a coordenades horitzontals per a la ubicació i l'hora seleccionades. És adequat per orientar una observació familiar a ull nu, però no substitueix un planetari professional.

- Les línies de les constel·lacions són convencionals i esquemàtiques.
- La banda de la Via Làctia és orientativa.
- El catàleg només inclou una selecció d'estrelles brillants.
- La simulació de l'eclipsi és didàctica; les hores de contacte són les dades importants.
- La posició real del Sol prop de l'horitzó pot quedar afectada pel relleu i la refracció atmosfèrica.

## Seguretat durant l'eclipsi

Durant les fases parcials cal utilitzar ulleres d'eclipsi certificades **EN ISO 12312-2:2015** i, a la Unió Europea, amb marcatge CE verificable. Les ulleres de sol normals i els filtres improvisats no són segurs.

Només es pot observar sense protecció ocular durant la totalitat completa, quan el disc solar ha desaparegut del tot. Cal tornar a posar-se les ulleres tan bon punt reaparegui el primer punt de llum. Els nens han d'estar supervisats per un adult.
