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

Kontroly overujú časy, tabuľky, bezpečné odkazy, dnešné počty 17–22 bez brankárov, rotácie skupín 4–6, zachovanie pondelka, matematiku časovača a autentizované šifrovanie súkromnej časti. Kryptografické testy používajú syntetický obsah a testovacie heslo; netvoria používateľský trezor. GitHub Pages tieto vlastné kontroly nespúšťa; vykonávajú sa pred commitom.

## Lokálny náhľad

Spusť v tomto priečinku `python -m http.server 8765` a otvor `http://localhost:8765/`. Priame otvorenie `index.html` z disku nie je podporované, pretože prehliadač blokuje načítanie dátového súboru. Nie je potrebná inštalácia balíkov ani zostavovanie.

## Zdieľanie a mobil

- **Archív** v hornej lište otvorí všetky uložené tréningy od najnovšieho. Vyber konkrétny dátum alebo použi **Zobraziť všetky dni**; kliknutím otvoríš pôvodný celý tréning. Každý deň má vlastný trvalý odkaz `#trening=RRRR-MM-DD`.
- Tréningy sú trvalo uložené v `trainings.json` na GitHube a nezmiznú vymazaním údajov mobilu. Ďalšie dni pridávaj do tohto zoznamu, staré zachovaj. Samotné otvorenie archívu nič neprepisuje ani nevytvára nový tréning.
- Rozloženie reaguje na šírku aj výšku obrazovky: mobil má jeden stĺpec, veľký počítač schému vedľa pokynov. Nízka obrazovka na šírku má kompaktnejšie ovládanie a dialógy sa posúvajú vo vlastnom okne.
- Tlačidlo **Zdieľať** zobrazí odkaz s možnosťou **Skopírovať odkaz**. V podporovanom prehliadači ponúkne aj **Zdieľať cez aplikáciu**. Ak kopírovanie prehliadač nedovolí, odkaz je možné skopírovať manuálne z poľa.
- Ikona odkazu pri názve činnosti zdieľa priamo zvolený blok. Staršie odkazy `#trening=...&blok=...` zostávajú platné.
- Zvolený počet detí je súčasťou odkazu (`pocet=19` až `pocet=22`), aby kolega otvoril rovnaké rozdelenie.
- **Hotovo → ďalej** označí blok za dokončený a otvorí nasledujúci. Kliknutie na číslo iba prejde na blok. Celok si pozrieš cez **Prehľad**.
- **Priebeh / Rotácie / Pokyny** zobrazujú vždy najviac jeden podrobný panel. Druhým kliknutím sa panel zavrie.
- **Časovač bloku** je predvolene zbalený a spustí sa ručne. Meria celý blok vrátane prestávok. Má pauzu, pokračovanie a reset; pri prechode na inú činnosť sa pozastaví. Čas ráta podľa skutočne uplynutého času aj pri obmedzení frekvencie prehliadača na pozadí. Nedáva zvukový alarm ani automatický prechod. Obnovenie stránky časovače resetuje.
- Dokončené časti a označené pomôcky si pamätá iba tento prehliadač; do odkazu pre kolegu sa neprenášajú.
- Na domovskú obrazovku telefónu sa web pridáva cez ponuku Safari alebo Chrome. Stránka vyžaduje pripojenie; nemá deklarovaný offline režim.
- Klubový web aj repozitár sú verejné. Osobný plán je zverejnený iba ako šifrovaná obálka; heslo nie je v repozitári. Poznámky zostávajú v prehliadači. Web nemá sledovanie návštevnosti.

## Moja súkromná časť

1. Otvor **Moje**, zadaj heslo z osobného chatu a klikni **Otvoriť osobný plán**. Netreba nič importovať ani vytvárať ďalšie heslo. Heslo neposielaj kolegovi spolu s verejným odkazom.
2. Plán zobrazuje vždy jeden bod. **Späť / Ďalší bod** prechádzajú celý obsah; cez **Vyber situáciu** môžeš rovno prejsť na potrebnú tému. **Poznámky a možnosti** sú zbalené.
3. `personal-plan.enc.json` obsahuje len šifrovaný osobný plán (AES-256-GCM, PBKDF2-SHA256, 250 000 iterácií). Je verejne dostupný na GitHube na základe výslovného súhlasu používateľa z 27. 10. 2026. Heslo a čitateľný osobný zdroj nie sú v repozitári. Heslo sa v aplikácii neukladá.
4. Rovnaké heslo otvorí pripravený plán aj v inom zariadení. **Uložiť poznámky** ukladá iba do tohto prehliadača a iba šifrovane s novou soľou a nonce. Poznámky sa nesynchronizujú. Staré lokálne záznamy zostávajú zachované a dajú sa otvoriť pôvodným heslom.
5. **Šifrovaná záloha** uloží poznámky a stiahne šifrovaný súbor. Voliteľne ho obnovíš v zamknutej časti cez **Obnoviť uloženú zálohu**, súbor a jeho heslo. Žiadny import nie je potrebný na bežné otvorenie plánu.
6. **Zamknúť**, odchod z časti alebo prepnutie aplikácie odstráni otvorený obsah a heslo z aplikačného stavu. Neuložené poznámky sa stratia. Vymazanie údajov prehliadača vymaže lokálne poznámky; pripravený plán zostane dostupný s heslom. Pri strate hesla ho aplikácia neobnoví.

Ochrana obsahu závisí od hesla, zariadenia a dôveryhodného kódu stránky. Zdieľacie tlačidlá neposielajú súkromný obsah ani heslo. Čitateľný osobný súbor ani heslo nikdy nepridávaj do verejného repozitára. Nový osobný plán najprv šifruj mimo repozitára; nepublikuj ho bez poverenia používateľa.

## Publikovanie a návrat

GitHub **Settings → Pages → Deploy from a branch → main → / (root)**. HTTPS zostáva zapnuté. Návrat na staršiu verziu: vráť príslušný commit. Vypnutie webu: **Settings → Pages → Unpublish site**.

Pri úprave rozhrania zvýš verziu pri `styles.css?v=4` a `app.js?v=5` v index.html, aby sa po obnovení nezmiešali nové a staré súbory z vyrovnávacej pamäte. Samotné pridanie tréningu tento krok nepotrebuje.

## Obsah a rozsah

Utorkový tréning 27. 10. 2026 je podľa aktuálneho zadania bez brankárov. Predvolene 19 detí = 5+5+5+4; 20 = 5+5+5+5; 21 = 6+5+5+5; 22 = 6+6+5+5. Dostupných je aj 17/18, ak dvaja pôvodne započítaní brankári chýbajú v celkovom počte. Všetci hrajú nohami na malé bránky. Časy a 75 min zostávajú; v 1 na 1 každý 4 útoky + 4 obrany, v 2 na 1 každý 4 + 2. Skupina 6 má vlastné rotácie a v 2 na 2 jednu odpočívajúcu dvojicu (každý 6 min hry). Pondelkový archív aj staršie PDF zostávajú bez zmeny.

Voliteľné `attendanceCases` obsahuje objekty `total` a `groups`; súčet skupín plus počet brankárov `keepers` sa rovná celkovému počtu (dnes keepers=0). Voliteľné `variantNotes` má pokyny pre veľkosť skupiny `4`, `5`, `6`; tabuľky 2 na 2 používajú `groupSize`. Schémy pre deň bez brankárov majú príponu `-no-keeper`.

Schémy sú ilustračné; dávky a plné počty sú v texte a tabuľkách. Pôvodné súkromné PDF a čitateľný osobný plán dieťaťa nie sú súčasťou tohto repozitára; osobný plán je iba v šifrovanej obálke.
