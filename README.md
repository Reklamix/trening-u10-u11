# Tréningy U10 / U11

Mobilný sprievodca spoločným tréningom. Na ihrisku zobrazuje jednu činnosť; podrobnosti sa otvárajú až kliknutím. Obsahuje časovač, dokončenie bloku a prechod na ďalší, prehľad celku a checklist pomôcok.

Web: https://reklamix.github.io/trening-u10-u11/

**Príprava ihriska · krok po kroku** pod výberom dňa otvorí päť krokov pre štvrtok 29. 10.: 8 úvodných rohov + 4 balíčky po 6, rozdelenie na 12 × 9 m, rozšírenie na 14 × 9 m, koncové zóny a kužeľové bránky. Každý krok má čas, nákres, počet pridaných/presúvaných/ponechaných mét a rozdelenie práce trénerov. Oranžové kužele sú nové, modré sa presunú z označených pôvodných miest, zelené zostávajú. Celkovo sa používa tých istých 32 mét. Kroky možno prejsť Späť/Ďalší alebo vybrať priamo; príprava nemení zvolenú činnosť, dokončenie ani tréningový časovač a pri otvorení pozastaví animáciu. Geometria pochádza z existujúceho quarterPitch a schém cvičení; staršie dni tento vstup nemajú.

Štvrtkový tréning má pod prehrávaním vstup **Ako viesť cvičenie**: Príprava / Postup / Striedanie / Tréner. Postup zobrazuje jeden pôvodný bod naraz s tlačidlami Späť a Ďalší bod. Striedanie ukazuje iba zvolenú veľkosť skupiny alebo dochádzku v zvislých kartách. Čas a prestávky sú dostupné v každej časti návodu. Návod má vlastné posúvanie a stále viditeľnú navigáciu, pri otvorení pozastaví animáciu a nemení tréningový časovač ani dokončenie bloku. Schéma a nastavenia zostávajú zbalené pod týmto vstupom. Staršie dni používajú pôvodné ovládanie.

V príprave má každý krok aj ručne spustenú ukážku. **Prehrať presun** posúva modré kužele z pôvodných miest po skupinách; **Ukázať pridanie** postupne zobrazuje nové oranžové kužele tam, kde ich treba položiť. Zelené zostávajú. Najprv je vždy statický nákres. Predvolené je **0,5× a zapnuté opakovanie**, dostupné aj 0,25× a 1×; voľby zostávajú pri prepínaní krokov. Pauza, Od začiatku, Nákres a posuvník času umožňujú ukážku prejsť pomaly. Ukážka nemení tréningový časovač ani neprepína kroky sama. Zmena kroku, zavretie alebo odchod aplikácie do pozadia prehrávanie zastaví.

Nad štvrtkovým nákresom vyberáš skutočnú skupinu A1/A2/B1/B2 aj s počtom hráčov (rozohriatie má zóny A/B). Predvolene je prvá skupina, pri 19 deťoch A1 s 5 hráčmi; B2 má 4. Výber v návode Striedanie sa prenáša do animácie a naopak. **Rozmiestnenie** otvorí celú plochu 35 × 25 m s rozmermi jednotlivých ihrísk, hráčmi a kužeľmi; zvýraznená je zvolená skupina. Kliknutie na označenie skupiny v mape ju vyberie aj pre animáciu. Postavenie hráčov je orientačné, hranice a kužele vychádzajú zo schváleného rozloženia.

## Pridanie ďalšieho tréningu

1. Otvor súbor [trainings.json](./trainings.json) v tomto repozitári a klikni na ceruzku **Edit**.
2. Do poľa `trainings` pridaj nový tréning podľa štruktúry existujúceho. Najjednoduchšie je celý súbor pripraviť s AI a jeho obsah nahradiť. Staré tréningy zachovaj.
3. Každý tréning má jedinečné `id` a `date` v tvare `2026-10-29`. Časy `start` a `end` sú minúty od začiatku, nadväzujú bez medzier a posledný `end` sa rovná `duration`.
4. Pred zverejnením spusti kontroly nižšie. Obsahuješ iba klubové pokyny bez osobných údajov a súkromných hodnotení detí.
5. Ulož zmenu cez **Commit changes** do `main`. GitHub Pages po úspešnom zostavení automaticky zverejní novú verziu. V mobile potom obnov stránku.

Príklad zadania pre AI: „Pridaj do trainings.json ďalší 75-minútový tréning U11 na [dátum] pre [počet detí vrátane brankárov]. Zachovaj ostatné tréningy a existujúcu štruktúru; skontroluj súčet časov, dávky a prestávky. Nepridávaj osobné údaje detí.“

### Polia tréningu

`id`, `date`, `category`, `title`, `focus`, `cue`, `duration`, `players`, `coaches`, `surface`, `equipment`, `notes`, `sources`, `blocks`. Voliteľné `startTime` v tvare `18:00` zobrazí absolútne časy blokov a koniec podľa duration; staršie tréningy bez neho zobrazujú minúty od začiatku.

Každá pomôcka má `name`, `quantity`, `detail`. Organizačná poznámka má `title`, `text`. Zdroj má `label` a voliteľné `url` s HTTPS.

Každý blok má `id` (číselný reťazec), `start`, `end`, `title`, `diagram`, `summary`, `space`, `dose`, polia textov `steps`, `cues`, `adjustments` a voliteľné `tables`.

Schémy: `warmup`, `coordination`, `duel`, `two-one`, `two-two`, `target`, `buildout`, `sprint-jump`, `match`, `two-matches`, `finish`.

Štvrtkové futbalové schémy: `football-warmup`, `football-pass`, `football-rondo`, `football-zones`, `football-matches`, `football-finish`. Modul `football.js` kreslí SVG podľa počtu detí a veľkosti skupiny; pôvodné schémy archívu ostávajú zachované. `diagramSheet` odkazuje na pôvodný prehľad PNG v assets (príklad pre 19 detí).

Tabuľka má `caption`, pole `headers` a pole riadkov `rows`. Každý riadok má rovnaký počet buniek ako hlavička.

## Kontroly pred publikovaním

V priečinku repozitára:

```sh
node --check app.js
node --check football.js
node tests/validate.mjs
```

Kontroly overujú časy, tabuľky, bezpečné odkazy, dnešné počty 17–22 bez brankárov, rotácie skupín 4–6, zachovanie pondelka, matematiku časovača a autentizované šifrovanie súkromnej časti. Kryptografické testy používajú syntetický obsah a testovacie heslo; netvoria používateľský trezor. GitHub Pages tieto vlastné kontroly nespúšťa; vykonávajú sa pred commitom.

## Lokálny náhľad

Spusť v tomto priečinku `python -m http.server 8765` a otvor `http://localhost:8765/`. Priame otvorenie `index.html` z disku nie je podporované, pretože prehliadač blokuje načítanie dátového súboru. Nie je potrebná inštalácia balíkov ani zostavovanie.

## Zdieľanie a mobil

- **Archív** v hornej lište otvorí všetky uložené tréningy od najnovšieho. Vyber konkrétny dátum alebo použi **Zobraziť všetky dni**; kliknutím otvoríš pôvodný celý tréning. Každý deň má vlastný trvalý odkaz `#trening=RRRR-MM-DD`.
- Štvrtok **29. 10. 2026, 18:00–19:15**: odhad 20 detí, pracovný variant bez brankárov, výber 16–24. Používateľ spresnil štvrtinu na približne **35 × 25 m**; pôvodný predpoklad 50 × 30 m je nahradený. Po obvode 2 m voľna, stredný aj priečny koridor 3 m. Rozohriatie 2 × 21 × 14 m; technika/rondo 4 × 12 × 9 m; zóny a záver 4 × 14 × 9 m. Záver sú štyri minihry 2v2, podľa počtu + 1 alebo 2 N, s dvomi kužeľovými bránkami na plochu. Každý zostáva aktívny. N sa menia po 2 minútach hry. Žiadne spájanie do 5v5 ani rozširovanie mimo pridelenej plochy.
- **Kužele a méty** sú v živých štvrtkových schémach väčšie, oranžové s tmavým obrysom a bielym pruhom. Pod prehrávaním je klikateľný počet v nákrese/spolu a rozloženie z `coneSetup` v trainings.json. Rozohriatie 8, prihrávky 16, rondo 16 (rovnaké plochy), koncové zóny 32, minihry 32 vrátane kužeľových bránok (rovnaké méty presunúť), pokojný záver 0. Rozloženie celej štvrtiny sa otvára cez **Celá 1/4** pod nákresom a vychádza z `quarterPitch.stages`. Živá schéma preberá rozmery z rovnakých údajov. Pôvodný PNG návrh zostáva v archíve assets, vo štvrtkovom rozhraní sa naň už neodkazuje. Štyri vnútorné méty v zónach ležia na bočných čiarach 2 m od koncov. Počty zahŕňajú všetky súčasné plochy a nemenia sa s dochádzkou.
- Pri úvodnom **vedení lopty** sa po Prehrať pohybujú všetci zobrazení hráči súčasne, každý s vlastnou loptou. Vlnovky zobrazujú aktuálny smer každého hráča; trasy sú príklad voľného vedenia, nie povinné stanovištia. Obe zóny A/B rešpektujú dochádzku 16–24, ukážka sa opakuje bez skoku a stojí, kým ju tréner ručne nespustí.
- **Prehrať / Pauza / Od začiatku / Ďalší krok** ovládajú celú spomalenú ukážku. Prihrávkové cvičenie a rondo prejdú cez všetkých prihrávajúcich späť na začiatok. Priebežný krok/čas a zelené **Ukážka dokončená** označujú koniec, potom je dostupné **Prehrať znova**. **Rýchlosť animácie** ponúka 0,25× / 0,5× / 1× / 1,5× (predvolene 0,5×), zmena rýchlosti zachová polohu. **Opakovať dokola** je predvolene zapnuté; po stlačení Prehrať sa celá ukážka opakuje, kým ju tréner nepozastaví alebo opakovanie nevypne. Nákres je nad ovládaním a pri otvorení stojí; automatické prehrávanie je vypnuté. Vypnutie nechá aktuálny obeh dohrať. Rýchlosť a opakovanie ostávajú pri resete, zväčšení aj zmene zobrazenej skupiny/ihriska; nová činnosť začína s predvolenými hodnotami. Posuvník umožní presný posun; **Zväčšiť** otvorí dialóg a prehrávanie pokračuje aj pri otvorení či zatvorení. Prehrávanie sa spúšťa len výslovným tlačidlom, aj pri preferencii redukovaného pohybu je možné použiť ručné kroky. Odchod z časti/na pozadie pauzuje; tréningový časovač sa nemení. Pokojný záver je statický.
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

1. Otvor **Moje** pre zvolený tréningový deň alebo vyber **Osobný plán na deň**. Dostupný je utorok 27. 10. a štvrtok 29. 10. 2026, oba pod rovnakým heslom z osobného chatu. Klikni **Otvoriť osobný plán**; netreba import ani nové heslo. Pri dni bez osobného plánu sa zobrazí výber dostupného dňa. Heslo neposielaj kolegovi spolu s verejným odkazom.
2. Plán zobrazuje vždy jeden bod. **Späť / Ďalší bod** prechádzajú celý obsah; cez **Vyber situáciu** môžeš rovno prejsť na potrebnú tému. **Poznámky a možnosti** sú zbalené.
3. `personal-plan.enc.json` (utorok) a `personal-plan-2026-10-29.enc.json` (štvrtok) obsahujú iba šifrované plány (AES-256-GCM, PBKDF2-SHA256, 250 000 iterácií). Sú verejné na GitHube podľa výslovného súhlasu používateľa. Register `PersonalPlans` v app.js spája dátum, planId a obálku. Heslo a čitateľné osobné zdroje nie sú v repozitári. Heslo sa v aplikácii neukladá.
4. Rovnaké heslo otvorí plán aj v inom zariadení. **Uložiť poznámky** ukladá iba do tohto prehliadača, šifrovane a oddelene podľa planId/dňa. Utorkový kľúč aj staré lokálne záznamy zostávajú zachované; starý trezor sa otvára v utorkovom dni pôvodným heslom. Poznámky sa nesynchronizujú. Výber iného dňa plán zamkne.
5. **Šifrovaná záloha** uloží poznámky a stiahne šifrovaný súbor s planId. Obnovíš ho cez **Obnoviť uloženú zálohu** po výbere správneho dňa. Záloha iného dňa sa odmietne bez prepisu. Staršie zálohy bez planId patria do utorkového dňa. Žiadny import nie je potrebný na bežné otvorenie plánu.
6. **Zamknúť**, odchod z časti alebo prepnutie aplikácie odstráni otvorený obsah a heslo z aplikačného stavu. Neuložené poznámky sa stratia. Vymazanie údajov prehliadača vymaže lokálne poznámky; pripravený plán zostane dostupný s heslom. Pri strate hesla ho aplikácia neobnoví.

Ochrana obsahu závisí od hesla, zariadenia a dôveryhodného kódu stránky. Zdieľacie tlačidlá neposielajú súkromný obsah ani heslo. Čitateľný osobný súbor ani heslo nikdy nepridávaj do verejného repozitára. Nový osobný plán najprv šifruj mimo repozitára; nepublikuj ho bez poverenia používateľa.

## Publikovanie a návrat

GitHub **Settings → Pages → Deploy from a branch → main → / (root)**. HTTPS zostáva zapnuté. Návrat na staršiu verziu: vráť príslušný commit. Vypnutie webu: **Settings → Pages → Unpublish site**.

Pri úprave rozhrania zvýš verziu pri `styles.css?v=7`, `app.js?v=7` a pri zmene modulu aj `football.js?v=2` v index.html, aby sa po obnovení nezmiešali nové a staré súbory z vyrovnávacej pamäte. Samotné pridanie tréningu tento krok nepotrebuje.

## Obsah a rozsah

Utorkový tréning 27. 10. 2026 je podľa aktuálneho zadania bez brankárov. Predvolene 19 detí = 5+5+5+4; 20 = 5+5+5+5; 21 = 6+5+5+5; 22 = 6+6+5+5. Dostupných je aj 17/18, ak dvaja pôvodne započítaní brankári chýbajú v celkovom počte. Všetci hrajú nohami na malé bránky. Časy a 75 min zostávajú; v 1 na 1 každý 4 útoky + 4 obrany, v 2 na 1 každý 4 + 2. Skupina 6 má vlastné rotácie a v 2 na 2 jednu odpočívajúcu dvojicu (každý 6 min hry). Pondelkový archív aj staršie PDF zostávajú bez zmeny.

Voliteľné `attendanceCases` obsahuje objekty `total` a `groups`; súčet skupín plus počet brankárov `keepers` sa rovná celkovému počtu (dnes keepers=0). Voliteľné `variantNotes` má pokyny pre veľkosť skupiny `4`, `5`, `6`; tabuľky 2 na 2 používajú `groupSize`. Schémy pre deň bez brankárov majú príponu `-no-keeper`.

Schémy sú ilustračné; dávky a plné počty sú v texte a tabuľkách. Pôvodné súkromné PDF a čitateľný osobný plán dieťaťa nie sú súčasťou tohto repozitára; osobný plán je iba v šifrovanej obálke.
