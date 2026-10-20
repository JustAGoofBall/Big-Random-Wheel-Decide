# SpinDecide

Zet je opties in een rad, draai, en laat het rad **eerlijk** beslissen. Het is een verbeterde versie van wheeldecide.com, gemaakt met React, Vite en TypeScript.

## Functies

- **Eerlijke willekeur:** de winnaar wordt eerst gekozen met `crypto.getRandomValues`, daarna landt het rad netjes in dat vak.
- **Gewicht per item** (×1–×10): de grootte van het vak is precies gelijk aan de kans.
- **Zwiepen:** sleep met je muis of vinger aan het rad. Hoe harder je zwiept, hoe langer het draait.
- **Meerdere winnaars** in één keer, zonder dubbele.
- **Na een winst:** de winnaar verbergen of verwijderen (met ongedaan maken).
- **Geschiedenis** met statistieken en CSV-export.
- **Teams maken**: kies het aantal teams of het aantal personen per team.
- **Emoji of eigen afbeelding** per vak, en een eigen kleur. Afbeeldingen worden lokaal bewaard in IndexedDB.
- **Meerdere rads** opslaan, met 9 templates en import/export als `.json`.
- **Lijst plakken:** één item per regel, `🍕 Pizza *3` geeft emoji + gewicht. Ook `.txt` en `.csv` werken.
- **Deelbare link** zonder account (`#w=…`, gecomprimeerd in de URL).
- **Geluid** (tikjes + win-geluid, gesynthetiseerd met Web Audio) en **confetti**.
- **Volledig scherm** voor op de tv, **sneltoetsen** en een **donkere modus**.
- **Nederlands en Engels**.
- Werkt op mobiel en is toegankelijk: toetsenbord, schermlezer, en `prefers-reduced-motion` wordt gerespecteerd.

Alles wordt in je eigen browser opgeslagen. Er is geen server en er zijn geen accounts.

### Sneltoetsen

| Toets | Actie |
|---|---|
| `Spatie` / `Enter` | Draaien |
| `F` | Volledig scherm |
| `M` | Geluid aan/uit |
| `N` | Nieuw item |
| `Esc` | Pop-up sluiten |
| `Ctrl/⌘ + Z` | Verwijderen ongedaan maken |
| `?` | Overzicht van sneltoetsen |

## Ontwikkelen

Vereist Node 20 of nieuwer.

```bash
npm install
npm run dev        # ontwikkelserver op http://localhost:5173
npm test           # unit tests (Vitest)
npm run typecheck  # TypeScript
npm run build      # productiebuild in dist/
npm run preview    # bekijk de build lokaal
```

## Online zetten (GitHub Pages)

De workflow `.github/workflows/deploy.yml` test en bouwt de site bij elke push naar `main` en zet hem daarna op GitHub Pages. Je moet dit één keer aanzetten:

1. Ga in de repo naar **Settings → Pages**.
2. Kies bij **Source** de optie **GitHub Actions**.

Daarna staat de site op `https://<gebruiker>.github.io/<repo>/`.

## Projectstructuur

```
src/
  components/   UI (rad, paneel, dialogen, …)
  lib/          logica: random, wheelMath, share, parseList, audio, images, spin
  store/        Zustand-stores (rads, instellingen, UI-status)
  i18n/         vertalingen (nl, en)
  styles/       design tokens + CSS
tests/          unit tests
docs/DESIGN.md  designdocument
```
