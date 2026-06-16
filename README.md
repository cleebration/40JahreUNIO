# 40 Jahre UNIO – „Bilder einer Ausstellung“

Galerie-/Archiv-Website für das Kinder-Zeichenprojekt zum 40-Jahr-Jubiläum des
**Universitätsorchesters Linz (UNIO)**. Kinder und einige Erwachsene haben Bilder
zu den Sätzen aus Mussorgskis *Bilder einer Ausstellung* gemalt; jeder Satz ist
ein eigener Ausstellungsraum. Anlass: Jubiläumskonzert am **21. November 2019**
im **Brucknerhaus Linz**.

- **121 Werke**, **93 Teilnehmer:innen**, **10 Räume**
- Stack: **Vite + React + React Router**, Deployment auf **Vercel**
- Pro Werk eine eigene URL: `/werk/<slug>`
- Pro Raum eine eigene URL: `/raum/<motiv>`

---

## Schnellstart

```bash
npm install
npm run dev        # lokal entwickeln
npm run check      # Build + Klick-Smoke-Test (vor jeder Lieferung)
```

`npm run check` führt `vite build` **und** den jsdom-Klick-Test (`vitest`) aus –
Links und Filter werden nachweislich getestet.

---

## Bilder einspielen (`public/werke/`)

Die Galerie funktioniert sofort – ohne Bilder zeigt jede Karte einen sauberen
Platzhalter in der Raumfarbe („Bild folgt“). Sobald die Bilder da sind, ersetzen
sie die Platzhalter automatisch.

1. Den Google-Drive-Ordner mit den Einsendungen herunterladen
   (Drive → Ordner → **Herunterladen** = ZIP) und **alle** Bilddateien nach
   `./raw-images/` entpacken. Das Drive-Präfix `<hash>-` im Dateinamen darf
   bleiben – es wird automatisch entfernt.
2. Für PDF-Einsendungen `pdftoppm` installieren (sonst werden nur die PDFs
   übersprungen):
   - macOS: `brew install poppler`
   - Ubuntu: `sudo apt-get install poppler-utils`
3. Konvertieren:
   ```bash
   npm run images
   ```
   Das erzeugt `public/werke/<slug>.jpg` (längste Kante 1600 px, JPEG q82) und
   einen Bericht `public/werke/_report.json` (zugeordnet / fehlend / PDFs).

> `raw-images/` ist in `.gitignore` – die großen Originale kommen **nicht** ins
> Repo, nur die optimierten Bilder in `public/werke/`.

---

## Eigenes Branding einsetzen

- **Logo:** Datei nach `public/logo.svg` legen (oder Pfad in `src/brand.js` ändern).
  Ohne Logo zeigt der Kopf nur den Schriftzug.
- **Texte / Identität:** `src/brand.js`
- **Farben:** `src/styles.css`, Block `:root` (u. a. `--brand`, `--dark`, `--paper`).
  Jeder der 10 Räume hat eine eigene Farbe in `src/data.js` (Feld `color` in
  `MOTIFS`) – die wird über `scripts/generate-data.py` gepflegt.

---

## Namensanzeige

Aktuell: **voller Name + Jahrgang** (so gewünscht). Die Anzeige steckt in
`src/components/WorkCard.jsx` und `src/components/WorkPage.jsx`. Falls einzelne
Personen nicht genannt werden möchten, lässt sich ihr Eintrag in
`scripts/generate-data.py` (Liste `ROWS`) anpassen oder entfernen; danach
`npm run data` ausführen.

---

## Daten neu erzeugen

Die Datendatei `src/data.js` ist **autogeneriert** aus den Einsendungen:

```bash
npm run data    # python3 scripts/generate-data.py  ->  src/data.js
```

Quelle und manuelle Bereinigungen (z. B. eine versehentlich im Titelfeld
eingetragene E-Mail, ein kaputtes Geburtsjahr) sind im Skript dokumentiert.

---

## Deploy auf Vercel

1. Repo zu GitHub (über *Add file → Upload files* den **gesamten Ordner** als
   ein Commit hochladen).
2. In Vercel importieren – Framework wird als **Vite** erkannt
   (Build `npm run build`, Output `dist`).
3. `vercel.json` leitet alle Pfade auf `index.html` um, damit `/werk/...` und
   `/raum/...` direkt aufrufbar sind (Client-Routing).
4. Domain `40jahreunio.at` in Vercel verbinden.

---

## Projektstruktur

```
├─ index.html                # reiner Vite-Einstieg
├─ vercel.json               # SPA-Rewrite
├─ src/
│  ├─ main.jsx               # Einstieg (BrowserRouter)
│  ├─ App.jsx                # Routen + Layout
│  ├─ brand.js               # Marke/Texte
│  ├─ data.js                # AUTOGENERIERT (MOTIFS, WORKS)
│  ├─ lib.js                 # Helfer (Motiv-Lookup, Statistik)
│  ├─ styles.css             # Design-System (Tokens in :root)
│  ├─ components/            # Header, Footer, Gallery, WorkCard, WorkPage, Frame, MotifIndex
│  └─ __tests__/smoke.test.jsx
├─ scripts/
│  ├─ generate-data.py       # CSV/Einsendungen -> src/data.js
│  └─ build-images.mjs       # raw-images/ -> public/werke/<slug>.jpg
├─ public/
│  ├─ favicon.svg
│  └─ werke/                 # generierte Bilder (+ _report.json)
└─ raw-images/               # lokale Originale (nicht im Repo)
```
