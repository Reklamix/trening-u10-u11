# Tréningy U10 / U11

Mobilný prehľad spoločných tréningov. Výber podľa dátumu, časový plán, dávky a oddych, schémy, pomôcky a odkaz na konkrétny blok.

Web: https://reklamix.github.io/trening-u10-u11/

## Pridanie ďalšieho tréningu

1. Otvor súbor [trainings.json](./trainings.json) v tomto repozitári a klikni na ceruzku **Edit**.
2. Do poľa `trainings` pridaj nový tréning podľa štruktúry existujúceho. Najjednoduchšie je celý súbor pripraviť s AI a jeho obsah nahradiť. Staré tréningy zachovaj.
3. Každý tréning má jedinečné `id` a `date` v tvare `2026-10-29`. Časy `start` a `end` sú minúty od začiatku, nadväzujú bez medzier a posledný `end` sa rovná `duration`.
4. Pred zverejnením spusti kontroly nižšie. Obsahuješ iba klubové pokyny bez osobných údajov a súkromných hodnotení detí.
5. Ulož zmenu cez **Commit changes** do `main`. GitHub Pages po úspešnom zostavení automaticky zverejní novú verziu. V mobile potom obnov stránku.

Príklad zadania pre AI: „Pridaj do trainings.json ďalší 75-minútový tréning U11 na [dátum] pre [počet detí vrátane brankárov]. Zachovaj ostatné tréningy a existujúcu štruktúru; skontroluj súčet časov, dávky a prestávky. Nepridávaj osobné údaje detí.“

### Polia tréningu

`id`, `date`, `category`, `title`, `focus`, `cue`, `duration`, `players`, `coaches`, `surface`, `equipment`, `notes`, `sources`, `blocks`.

Každá pomôcka má `name`, `quantity`, `detail`. Organizačná poznámka má `title`, `text`. Zdroj má `label` a voliteľné `url` s HTTPS.

Každý blok má `id` (číselný reťazec), `start`, `end`, `title`, `diagram`, `summary`, `space`, `dose`, polia textov `steps`, `cues`, `adjustments` a voliteľné `tables`.

Schémy: `warmup`, `coordination`, `duel`, `two-one`, `two-two`, `target`, `buildout`, `sprint-jump`, `match`, `two-matches`, `finish`.

Tabuľka má `caption`, pole `headers` a pole riadkov `rows`. Každý riadok má rovnaký počet buniek ako hlavička.

## Kontroly pred publikovaním

V priečinku repozitára:

```sh
node --check app.js
node tests/validate.mjs
```

Kontroly overujú súčet a nadväznosť časov, povinné informácie, tabuľky, bezpečné odkazy, počiatočné dávky a rotácie pre skupiny piatich aj šiestich hráčov. Súčasťou odovzdania je aj kontrola v mobilnom prehliadači. GitHub Pages samotný tieto vlastné kontroly nespúšťa; pri ďalších zmenách ich treba vykonať pred commitom.

## Lokálny náhľad

Spusť v tomto priečinku `python -m http.server 8765` a otvor `http://localhost:8765/`. Priame otvorenie `index.html` z disku nie je podporované, pretože prehliadač blokuje načítanie dátového súboru. Nie je potrebná inštalácia balíkov ani zostavovanie.

## Zdieľanie a mobil

- Tlačidlo **Zdieľať** zobrazí odkaz s možnosťou **Skopírovať odkaz**. V podporovanom prehliadači ponúkne aj **Zdieľať cez aplikáciu**. Ak kopírovanie prehliadač nedovolí, odkaz je možné skopírovať manuálne z poľa.
- **Zdieľať tento blok** otvorí rovno zvolenú činnosť.
- Na domovskú obrazovku telefónu sa web pridáva cez ponuku Safari alebo Chrome. Stránka vyžaduje pripojenie; nemá deklarovaný offline režim.
- Stránka neobsahuje prihlasovanie, sledovanie návštevnosti ani súkromné záznamy. Je verejná, rovnako ako repozitár.

## Publikovanie a návrat

GitHub **Settings → Pages → Deploy from a branch → main → / (root)**. HTTPS zostáva zapnuté. Návrat na staršiu verziu: vráť príslušný commit. Vypnutie webu: **Settings → Pages → Unpublish site**.

## Obsah a rozsah

Počiatočné klubové tréningy 26. a 27. 10. 2026 nadväzujú na schválené plány U11. Utorkové počty sú 24–26 detí spolu vrátane dvoch brankárov a aspoň dvaja tréneri. Pondelkový archív pracuje so 14 deťmi vrátane dvoch brankárov.

Schémy sú ilustračné; dávky a plné počty sú v texte a tabuľkách. Pôvodné súkromné PDF ani osobný plán dieťaťa nie sú súčasťou tohto repozitára.
