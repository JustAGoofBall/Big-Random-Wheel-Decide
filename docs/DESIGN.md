# SpinDecide — Designdocument

> Een verbeterde versie van wheeldecide.com: zet items in een rad, draai, en laat het rad (eerlijk) beslissen.

Status: **concept v1**, ter review. De klikbare mockup staat op het [SpinDecide-mockup-canvas](https://claude.ai/artifact/Jn4RWpri2JAiu7qcj2WWN5) (privé).

---

## 1. Doel en doelgroep

- **Doelgroep:** persoonlijk gebruik en vriendengroepen. Typische vragen zijn "wat eten we?", "wie betaalt?", "welke film?" en "wie begint?".
- **Belofte:** binnen 5 seconden een rad maken, met één klik draaien, en een uitkomst die echt eerlijk is.
- **Wat het beter doet dan wheeldecide.com:**
  - gewicht per item (een groter vak geeft meer kans),
  - eliminatie: de winnaar verwijderen of verbergen,
  - geschiedenis met statistieken,
  - deelbare link zonder account,
  - emoji en eigen afbeeldingen in de vakken,
  - templates, meerdere opgeslagen rads, en lijsten plakken of importeren,
  - het rad zelf een zwiep geven met muis of vinger,
  - teams maken, meerdere winnaars trekken, volledig scherm en sneltoetsen,
  - een modern, speels design met donkere modus, in Nederlands en Engels.

## 2. Technische keuzes

| Onderdeel | Keuze | Waarom |
|---|---|---|
| Framework | **React 18 + Vite + TypeScript** | Snel, modern en goed uit te breiden |
| State | **Zustand** met `persist`-middleware | Klein en simpel, slaat direct op in `localStorage` |
| Rad tekenen | **`<canvas>`** (2D), schaalt mee met devicePixelRatio | Soepel bij veel vakken, scherp op retina-schermen |
| Animatie | `requestAnimationFrame` + eigen easing | Volledige controle over waar het rad stopt |
| Geluid | **Web Audio API** (tikjes zelf gesynthetiseerd) | Geen geluidsbestanden nodig, geen vertraging |
| Confetti | `canvas-confetti` | Klein en bewezen |
| Afbeeldingen | **IndexedDB** (via `idb-keyval`) | `localStorage` is te klein voor plaatjes |
| Deel-link | JSON → `lz-string` → URL-hash (`#w=…`) | Geen server nodig |
| Vertalingen | Eigen klein i18n-systeem (`nl.ts`, `en.ts`) | Twee talen, dus geen zware library nodig |
| Lettertypen | **Fredoka** (koppen, rad) + **Nunito** (tekst), via `@fontsource` | Speels en rond, en zelf gehost |
| Tests | **Vitest** + Testing Library | Vooral voor de willekeur-, gewicht- en encodeerlogica |
| Hosting | **GitHub Pages** via GitHub Actions | Gratis, automatische deploy bij elke push naar `main` |

Er is geen backend en er zijn geen accounts. Alles staat lokaal in de browser. De code houdt de opslag wel achter één `storage`-laag, zodat accounts later toe te voegen zijn.

## 3. Datamodel

```ts
type Item = {
  id: string;
  label: string;          // max 60 tekens
  weight: number;         // 1–10, standaard 1
  color?: string;         // leeg = automatisch uit het palet
  emoji?: string;
  imageId?: string;       // verwijzing naar IndexedDB
  hidden: boolean;        // tijdelijk uitgeschakeld (bijv. na een winst)
};

type Wheel = {
  id: string;
  name: string;
  items: Item[];
  palette: PaletteId;     // 'snoep' | 'oceaan' | 'zonsondergang' | 'regenboog' | ...
  afterWin: 'ask' | 'keep' | 'hide' | 'remove';
  createdAt: number;
  updatedAt: number;
};

type HistoryEntry = {
  wheelId: string;
  itemLabel: string;
  emoji?: string;
  at: number;
};

type Settings = {
  language: 'nl' | 'en';
  theme: 'system' | 'light' | 'dark';
  sound: boolean;
  confetti: boolean;
};
```

Limieten: maximaal 100 zichtbare items per rad (daarboven wordt de tekst onleesbaar), maximaal 500 geschiedenisregels per rad, en afbeeldingen worden verkleind tot 256×256 WebP.

## 4. Eerlijke willekeur

1. **Kies eerst de winnaar** met `crypto.getRandomValues`. Er wordt gewogen gekozen over de zichtbare items: een getal `r` in `[0, totaalGewicht)`, daarna de cumulatieve som aflopen. Rejection sampling voorkomt *modulo bias*.
2. **Bereken de eindhoek:** het midden van het vak van de winnaar, plus een willekeurige afwijking binnen dat vak (niet te dicht bij de rand, zodat het niet "net ernaast" lijkt), plus `N` volle rondes.
3. **Animeer** van de huidige hoek naar de eindhoek met een *ease-out-quart*-curve. Dat voelt als echte wrijving.
4. **Vakgrootte = gewicht.** Wat je ziet klopt dus precies met de kans. Bij de items-editor staat het kanspercentage.

**Zwiepen (drag-to-spin):** de snelheid van de sleep- of veegbeweging bepaalt alleen de *kracht*, dus hoeveel rondes (3–12) en hoe lang (3–8 s). De uitkomst blijft cryptografisch bepaald. Bij een te zwakke zwiep draait het rad niet en veert het terug.

**Verminderde beweging:** als `prefers-reduced-motion` aan staat, duurt een draai 1 seconde en is er geen confetti.

## 5. Schermen en indeling

### 5.1 Hoofdscherm (desktop ≥ 900px)

```
┌──────────────────────────────────────────────────────────────────┐
│ 🎡 SpinDecide   [Wat eten we? ▾]        [🔗 Deel] [🌙] [NL] [⚙]   │
├────────────────────────────────────────┬─────────────────────────┤
│                                        │ [Items][Resultaten][Teams]│
│              ▼ (wijzer)                │ ┌─────────────────────┐ │
│          ╱‾‾‾‾‾‾‾‾‾‾╲                  │ │ 🍕 Pizza   ×2  25% ⋮│ │
│        ╱   RAD        ╲                │ │ 🍣 Sushi   ×1  13% ⋮│ │
│       │   (canvas)  (SPIN)             │ │ 🍔 Burger  ×1  13% ⋮│ │
│        ╲              ╱                │ │ …                   │ │
│          ╲__________╱                  │ └─────────────────────┘ │
│                                        │ [+ Item toevoegen    ]  │
│   [ DRAAI! ]   Aantal: [1 ▾]  [⛶]     │ [📋 Lijst plakken] [🔀]  │
└────────────────────────────────────────┴─────────────────────────┘
```

- **Links:** het rad zo groot mogelijk, met de SPIN-knop in het midden van het rad en de wijzer bovenaan. Daaronder een grote "Draai!"-knop, de keuze "aantal winnaars" (1–10) en een knop voor volledig scherm.
- **Rechts:** een paneel met drie tabbladen:
  - **Items:** een lijst met inline bewerken (tekst, emoji/afbeelding, gewicht met een − / + stepper, kans in %, kleur, verbergen, verwijderen) en slepen om de volgorde te wijzigen. Onderaan staan *Item toevoegen* (Enter voegt direct het volgende toe), *Lijst plakken*, *Schudden*, *Sorteren A–Z* en *Alles tonen*.
  - **Resultaten:** de geschiedenis (nieuwste bovenaan) met statistieken: hoe vaak elk item won, als balkjes. Knoppen voor *Wissen* en *Exporteren (CSV)*.
  - **Teams:** kies het aantal teams of het aantal personen per team, druk op *Maak teams*, en de teams verschijnen als kleurige kaarten. *Opnieuw* en *Kopieer* zijn ook beschikbaar.

### 5.2 Mobiel (< 900px)

Alles staat onder elkaar: header → rad (volle breedte) → Draai-knop → tabbladen. De header klapt in tot logo + menu. Grote tikdoelen (min. 44px), en vegen over het rad laat het draaien.

### 5.3 Winnaar-pop-up

Een grote kaart midden in beeld met confetti, het emoji/plaatje en de naam van de winnaar, in de kleur van het vak. Knoppen hangen af van de instelling `afterWin`:
- **Nog een keer** · **Verberg winnaar** · **Verwijder winnaar** · **Sluiten**

Bij meerdere winnaars draait het rad automatisch N keer achter elkaar. Winnaars worden tussendoor tijdelijk verborgen, zodat er geen dubbele zijn, en de pop-up toont aan het eind de lijst "1e, 2e, 3e".

### 5.4 Mijn rads + templates

Dit opent als lade via de rad-naam in de header (`Wat eten we? ▾`):
- **Mijn rads:** kaartjes met een mini-preview van het rad, met hernoemen, dupliceren en verwijderen. Er is ook *+ Nieuw rad*.
- **Templates:** Wat eten we? · Ja / Nee · Getal 1–10 · Truth or Dare · Wie betaalt? · Filmgenre · Dobbelsteen (1–6) · Activiteit voor vandaag · Lege kaart.

### 5.5 Lijst plakken / importeren

Dit is een dialoog met een groot tekstvak, waarin elke regel één item is. De mini-syntax is optioneel:
- `Pizza *3` → gewicht 3
- `🍕 Pizza` → het emoji wordt automatisch herkend

Je kiest *Toevoegen aan huidige lijst* of *Lijst vervangen*. Je kunt ook een `.txt`/`.csv`-bestand hierin slepen. Daarnaast is er een volledige export en import van een rad als `.json`.

### 5.6 Delen

De knop **🔗 Deel** maakt een link `https://<site>/#w=<gecomprimeerd>` en kopieert die naar het klembord, met een toast "Link gekopieerd!". Wie de link opent, ziet een banner: *"Je bekijkt een gedeeld rad — Opslaan bij mijn rads?"*.
- Eigen geüploade afbeeldingen gaan **niet** mee in de link, omdat die te groot zijn. Emoji gaan wel mee. Het deelscherm meldt dit als het rad afbeeldingen bevat.
- De native `navigator.share` wordt gebruikt op mobiel.

### 5.7 Instellingen (⚙)

Hier staan taal (NL/EN), thema (Systeem/Licht/Donker), geluid aan/uit, confetti aan/uit, kleurpalet van het rad, en wat er na een winst gebeurt (Vragen / Houden / Verbergen / Verwijderen).

## 6. Visuele stijl: "speels & kleurrijk"

- **Gevoel:** een vrolijk bordspel. Het heeft dikke, ronde vormen, zachte schaduwen en knoppen die een beetje "indrukken" (3D-rand onderaan die verdwijnt bij klikken).
- **Lettertypen:** *Fredoka* (700) voor koppen, de tekst op het rad en de knoppen, en *Nunito* (400/700) voor de rest.
- **Kleuren (licht):** achtergrond `#FFF7EC` (warm crème) met een subtiel stippenpatroon, kaarten `#FFFFFF`, tekst `#2B2240`, accent/primair `#FF5A5F` (koraal), secundair `#7C5CFF` (paars).
- **Kleuren (donker):** achtergrond `#1B1530`, kaarten `#2A2245`, tekst `#F5F0FF`. De accentkleuren blijven, iets helderder.
- **Radpaletten:** *Snoep* (standaard: koraal, mango, munt, hemelblauw, lavendel, roze), *Oceaan*, *Zonsondergang*, *Regenboog* en *Pastel*. De tekstkleur op elk vak wordt automatisch zwart of wit gekozen op basis van contrast (WCAG ≥ 4.5:1).
- **Rad-details:** een witte rand met "lampjes" (stippen) die oplichten tijdens het draaien, een grote wijzer bovenaan die bij elk vak een klein tikje naar achteren maakt, en de SPIN-knop als glanzende knop in het midden.
- **Micro-interacties:** de winnaar "popt" uit het rad (vak licht op), knoppen veren, en nieuwe items schuiven erin.

## 7. Geluid

- **Tik:** een kort, gesynthetiseerd "klik"-geluid elke keer dat de wijzer een vakgrens passeert. Toonhoogte en volume dalen een beetje mee met de snelheid.
- **Win:** een kort vrolijk "ta-da"-akkoordje (3 noten).
- Er is een mute-knop (sneltoets `M`) en de keuze wordt onthouden. Het geluid start pas na de eerste interactie, omdat browsers autoplay blokkeren.

## 8. Sneltoetsen

| Toets | Actie |
|---|---|
| `Spatie` / `Enter` | Draaien (als je niet in een invoerveld zit) |
| `F` | Volledig scherm aan/uit |
| `M` | Geluid aan/uit |
| `N` | Nieuw item (focus op invoerveld) |
| `Esc` | Pop-up of lade sluiten / volledig scherm verlaten |
| `Ctrl/⌘ + Z` | Laatste verwijdering ongedaan maken |
| `?` | Overzicht van sneltoetsen tonen |

## 9. Volledig scherm

Hier is alleen het rad zichtbaar, gecentreerd en zo groot mogelijk, op de thema-achtergrond, met een kleine titel bovenaan en "Druk op spatie om te draaien" onderaan. Dit gebruikt de Fullscreen API, met als fallback een overlay over het hele venster.

## 10. Toegankelijkheid

- De winnaar wordt aangekondigd via een `aria-live`-regio.
- Alles is met het toetsenbord te bedienen, met zichtbare focus-ringen.
- Het rad-canvas heeft een `aria-label` met de lijst van items.
- Kleurcontrast is minimaal AA, en `prefers-reduced-motion` wordt gerespecteerd.

## 11. Projectstructuur

```
src/
  main.tsx, App.tsx
  components/
    Wheel/            WheelCanvas.tsx, useSpin.ts, drawWheel.ts, Pointer.tsx
    Editor/           ItemList.tsx, ItemRow.tsx, PasteDialog.tsx
    Results/          HistoryList.tsx, Stats.tsx
    Teams/            TeamMaker.tsx
    Header/, WinnerModal/, WheelDrawer/, SettingsDialog/, Toast/
  lib/
    random.ts         crypto-random, gewogen keuze, Fisher–Yates
    share.ts          encode/decode van deel-links
    parseList.ts      plak-syntax
    audio.ts          Web Audio tik/win
    images.ts         verkleinen + IndexedDB
    colors.ts         paletten + contrastberekening
  store/              useWheelStore.ts, useSettingsStore.ts
  i18n/               nl.ts, en.ts, useT.ts
  templates.ts
  styles/             tokens.css, global.css
tests/                random.test.ts, share.test.ts, parseList.test.ts
.github/workflows/deploy.yml
```

## 12. Bouwvolgorde (mijlpalen)

1. **Fundament:** Vite + React + TS, design tokens, header, layout (desktop/mobiel), dark mode, NL/EN.
2. **Het rad:** canvas tekenen, eerlijke spin-animatie, wijzer, winnaar-pop-up, confetti, geluid.
3. **Editor:** items toevoegen, bewerken en verwijderen, gewicht, emoji, verbergen, volgorde, lijst plakken, opslag in `localStorage`.
4. **Meer rads:** meerdere rads opslaan, templates, import/export JSON.
5. **Resultaten en teams:** geschiedenis, statistieken, teams maken, meerdere winnaars.
6. **Extra's:** deel-link, afbeeldingen uploaden, zwiepen, volledig scherm, sneltoetsen.
7. **Afwerking:** toegankelijkheid, tests, GitHub Pages-deploy, README.

## 13. Open punten / beslissingen voor later

- Een eigen domeinnaam? (Voorlopig `justagoofball.github.io/Big-Random-Wheel-Decide`.)
- Moeten gedeelde links later ook afbeeldingen ondersteunen? (Daar is opslag op een server voor nodig.)
- PWA (installeerbaar, offline werken): makkelijk toe te voegen na v1.
