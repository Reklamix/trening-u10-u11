# Tréningy U10 / U11

Mobilný sprievodca spoločným tréningom. Na ihrisku zobrazuje jednu činnosť; podrobnosti sa otvárajú až kliknutím. Obsahuje časovač, dokončenie bloku a prechod na ďalší, prehľad celku a checklist pomôcok.

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

Kontroly overujú časy, tabuľky, bezpečné odkazy, dnešné počty 19–22 vrátane brankárov, rotácie skupín 4–5, zachovanie pondelka, matematiku časovača a autentizované šifrovanie súkromnej časti. Kryptografické testy používajú syntetický obsah a testovacie heslo; netvoria používateľský trezor. GitHub Pages tieto vlastné kontroly nespúšťa; vykonávajú sa pred commitom.

## Lokálny náhľad

Spusť v tomto priečinku `python -m http.server 8765` a otvor `http://localhost:8765/`. Priame otvorenie `index.html` z disku nie je podporované, pretože prehliadač blokuje načítanie dátového súboru. Nie je potrebná inštalácia balíkov ani zostavovanie.

## Zdieľanie a mobil

- Tlačidlo **Zdieľať** zobrazí odkaz s možnosťou **Skopírovať odkaz**. V podporovanom prehliadači ponúkne aj **Zdieľať cez aplikáciu**. Ak kopírovanie prehliadač nedovolí, odkaz je možné skopírovať manuálne z poľa.
- Ikona odkazu pri názve činnosti zdieľa priamo zvolený blok. Staršie odkazy `#trening=...&blok=...` zostávajú platné.
- Zvolený počet detí je súčasťou odkazu (`pocet=19` až `pocet=22`), aby kolega otvoril rovnaké rozdelenie.
- **Hotovo → ďalej** označí blok za dokončený a otvorí nasledujúci. Kliknutie na číslo iba prejde na blok. Celok si pozrieš cez **Prehľad**.
- **Priebeh / Rotácie / Pokyny** zobrazujú vždy najviac jeden podrobný panel. Druhým kliknutím sa panel zavrie.
- **Časovač bloku** je predvolene zbalený a spustí sa ručne. Meria celý blok vrátane prestávok. Má pauzu, pokračovanie a reset; pri prechode na inú činnosť sa pozastaví. Čas ráta podľa skutočne uplynutého času aj pri obmedzení frekvencie prehliadača na pozadí. Nedáva zvukový alarm ani automatický prechod. Obnovenie stránky časovače resetuje.
- Dokončené časti a označené pomôcky si pamätá iba tento prehliadač; do odkazu pre kolegu sa neprenášajú.
- Na domovskú obrazovku telefónu sa web pridáva cez ponuku Safari alebo Chrome. Stránka vyžaduje pripojenie; nemá deklarovaný offline režim.
- Klubový web aj repozitár sú verejné. Súkromný obsah vzniká iba v prehliadači návštevníka podľa postupu nižšie. Web nemá sledovanie návštevnosti.

## Moja súkromná časť

1. V mobile otvor **Moje**. Osobný súbor dostaneš samostatne v chate; nie je v tomto verejnom repozitári. Stiahni si ho do mobilu a vyber cez **Osobný ťahák alebo šifrovaná záloha**. Možno začať aj s prázdnymi poznámkami.
2. Sám si nastav heslo aspoň s 8 znakmi a zopakuj ho. Nikomu ho netreba posielať. Pôvodný stiahnutý osobný súbor je čitateľný; podľa toho s ním zaobchádzaj.
3. Obsah sa šifruje pomocou AES-256-GCM; kľúč sa odvodzuje PBKDF2-SHA256 s 250 000 iteráciami a náhodnou soľou. Každé uloženie má nový náhodný nonce. V localStorage je iba šifrovaná obálka; heslo sa neukladá.
4. **Uložiť poznámky** uloží zmeny. **Šifrovaná záloha** zároveň stiahne zálohu pre iné zariadenie. **Zamknúť**, odchod do inej časti alebo prepnutie aplikácie odstráni odomknutý obsah a heslo z aplikačného stavu. Neuložené poznámky sa stratia.
5. V inom zariadení vyber šifrovanú zálohu a zadaj rovnaké heslo. Obsah sa medzi zariadeniami nesynchronizuje. Pri strate hesla ho nevieme obnoviť; pri vymazaní údajov prehliadača je potrebná záloha.

Toto je lokálna šifrovaná časť, nie účet s prihlásením na server. Ochrana závisí od hesla, zabezpečenia zariadenia a dôveryhodného kódu stránky. Zdieľacie tlačidlá nikdy neposielajú súkromný obsah ani heslo. Nepridávaj osobný súbor do verejného repozitára.

## Publikovanie a návrat

GitHub **Settings → Pages → Deploy from a branch → main → / (root)**. HTTPS zostáva zapnuté. Návrat na staršiu verziu: vráť príslušný commit. Vypnutie webu: **Settings → Pages → Unpublish site**.

Pri úprave rozhrania zvýš verziu pri `styles.css?v=2` a `app.js?v=2` v index.html, aby sa po obnovení nezmiešali nové a staré súbory z vyrovnávacej pamäte. Samotné pridanie tréningu tento krok nepotrebuje.

## Obsah a rozsah

Klubové tréningy 26. a 27. 10. 2026 nadväzujú na schválené plány U11. Používateľ aktualizoval utorkový počet na 19–22 detí spolu vrátane dvoch brankárov a aspoň dvaja tréneri. V hornej ponuke možno vybrať skutočný počet; dnešné skupiny majú 4–5 hráčov do poľa. V 1 na 1 ostávajú 4 útoky + 4 obrany, v 2 na 1 4 útoky + 2 obrany. V 2 na 2 má štvorčlenná skupina v kole 80 s hry + 40 s oddychu. Pondelkový archív so 14 deťmi je zachovaný.

Voliteľné `attendanceCases` obsahuje objekty `total` a `groups`; súčet skupín plus dvaja brankári sa musí rovnať celkovému počtu. Voliteľné `variantNotes` v bloku obsahuje dodatočný pokyn pre veľkosť skupiny (napr. kľúče `4`, `5`).

Schémy sú ilustračné; dávky a plné počty sú v texte a tabuľkách. Pôvodné súkromné PDF ani osobný plán dieťaťa nie sú súčasťou tohto repozitára.
