# Design QA — návrh1 Trénerova karta

final result: passed

## Source and captured state
- Source visual truth: C:/Users/patri/Documents/ChatGPT/Trening U10/output/design/option-1-reference.png (exact copy of first displayed ImageGen option).
- Source pixels:853×1844. Normalized proportionally with contain/padding into390×844; no device chrome and no intentional image warping.
- Implementation: C:/Users/patri/.codex/visualizations/2026/10/26/01a1791f-7b51-7820-a157-330a1dc48f2b/card-option1-local-verified.png —390×844 pixels, CSS viewport390×844, density1.
- Full combined comparison: card-option1-compare-verified.jpg in the same visualization directory.
- Focused diagram/description/dose/footer comparison: card-option1-focus-verified.jpg in the same directory. Both comparisons put reference and implementation in one image.
- Route/state:29.10.2026, exercise2, A1,6children,base,24total,2coaches,quarter35×25,staticdiagram,default0.5×/repeatON. Local interaction test completed the first block; its stored green progress dot is intentional. Reference progress is illustrative.
- Capture taken after network idle, including loaded self-hosted Inter and sprites; initial fallback-font frames were not used for final comparison.

## Findings and iteration history
1. Initial combined comparison card-option1-compare-1.jpg: P2 quick-fact hints clipped by footer (25px local scroll), oversized ball overlapping numbers, Play overlapping corner cone, small/compressed header hierarchy. Result blocked.
2. Revision2 card-option1-compare-2.jpg and focused diagram/footer captures: reduced gaps and description disclosure height, reduced ball sprite, reserved diagram annotation space, raised typography. Full quick facts visible and cone clear.
3. Revision3 card-option1-compare-3.jpg: centered basic pairs/trio while retaining true3.5m distances and original simultaneous ball routes; removed duplicate overlaid pass strokes and exposed arrowheads before receiver markers. Added clear return-to-diagram action to every detail pane. Geometry tests passed.
4. Final combined/close comparisons: actual blue disc artwork used with live SVG numbers, photo cone also used in equipment summary; readable white dimension labels with shadow, intrinsic white arrows/dark neutral labels also in fullscreen. No actionable P0/P1/P2 findings remain.

## Required fidelity surfaces
- Fonts/typography: self-hosted variable Inter, strong title27px, body15px, dose22px, restrained secondary labels. No clipped primary labels. System fallbacks and font-display swap remain available.
- Spacing/layout: friendly date/time/count/progress header, group badge, large diagram, visible description, two dose cells, three local facts, three bottom actions and full-width Hotovo match the source hierarchy. At390×844 document height844 and zero local hero overflow;375×812 also fits after a lower responsive diagram.320×568 keeps persistent actions visible and allows local content scrolling.1440×900 remains bounded and centered with no horizontal overflow.
- Colors/tokens: warm ivory, deep evergreen, sage/lime grouping and pale surfaces; dark green high-contrast CTA. Actual role colors remain blue/red/neutral gold.
- Image/asset fidelity: generated grass, transparent cones, football and blank blue disc are WebP delivery assets; live player numbers, groups, pitch coordinates, tracks and animation phases stay in SVG. Bootstrap Icons1.13.2 and self-hosted Inter include licenses. Assets and prompts: assets/README-card.md. Decorative source PNGs remain outside the public repository in output/design/option-1-source-assets/.
- Copy/content: actual training date/time/group/count/level and physical dimensions; visible Popis cvičenia opens the complete variant description and every original step. Work/rest summary links retain complete water, buffers and rotations. No source JSON, PDF or encrypted plan content changed.

## Functional and regression verification
- JS syntax:app.js,football.js,exercise-brief.js passed. git diff --check passed.
- tests/validate.mjs:51894 checks passed across3trainings, counts14–30, skill variants, dose/rest/rotations, field geometry, balls/cones, archives, immutability and local delivery assets.
- Natural playback at0.5× with repeatOFF reached full8s demonstration and Prehrať znova;0.25×/repeatON persisted through inline skill/count changes.
- Warm-up at30total:16players+16balls in selected zone;32/32actors changed positions during playback.
- Inline count24→25,7players,challenge/base and half50×35 updated diagram18×14 and facts. Existing independent training timer stayed Beží across skill change, then paused at11:59.
- Default new exercise verified0.5× and repeatON. Fullscreen, group selection, animation next-step2s/reset0, white arrows, and close/return worked.
- Preparation modal retained5steps,8initialcones/32total, speed0.5/repeatON. All6exercises showed nonempty full descriptions and working return actions.
- Global30children/coach1 form remained functional. Moje opened its original locked plan with original password flow. Tuesday archive kept original header, navigation, details and previous button; no extra menu leaked.
- Menu Predošlý cvik navigated2→1 and disabled correctly at start; Hotovo navigated1→2 and preserved completion. Console errors/warnings:0.
- Browser was hidden and driven only through DOM APIs; no system mouse/keyboard/focus automation.

## Intentional product constraints and remaining P3 notes
- Preserve true3.5m passing spacing and real playable pitch proportions instead of stretching them to the illustrative mock. Centered station groups and all original timings remain correct.
- User requested a visible drill description; added labeled full-description access rather than removing canonical instructions to mimic shorter mock copy.
- Stored completion markers and actual group/level/count/dimensions override illustrative data. Other skill groups preserve canonical defender/neutral colors.
- Minor decorative differences in grass grain and library icon silhouettes are non-blocking P3 polish. Large self-hosted TTF is cacheable; WOFF2 optimization can be a later delivery improvement.
- Native OS share sheet was not invoked to respect the user's no-system-focus rule. Existing share handler/URL logic is retained, and relocation of its DOM node preserves its listeners. No source-share flow was replaced.

## Completed implementation checklist
- Selected image resolved, copied into workspace and compared at matched CSS size.
- Real assets placed, licenses retained, interactions tested.
- Initial P2 findings fixed and re-captured; final full and focused comparisons inspected.
- No actionable P0/P1/P2 issue remains; ready for authorized GitHub Pages publication.

## UI/UX refinement — 30. 10. 2026

This pass was explicitly requested for the whole application. It keeps the selected green card design, original assets, training data, motion model, doses, equipment, encrypted plans and public URL. The earlier image-fidelity report above records the original implementation; the following results describe this later authorized interaction and layout refinement.

Current-run baseline evidence: `ux-before-overview.png`, `ux-before-preparation.png`, `ux-before-library.png`, `ux-before-private.png` in the existing visualization directory. Captures were inspected at 390×844. The first exercise capture was a loading frame and was not used as visual evidence. The main findings were competing overview elements, a clipped long date selector, unnecessary session controls above library search, and long exercise content without direct section navigation.

The local skill search did not identify a specific progressive-disclosure entry after one narrower retry. Layout recommendations are therefore a manual fallback grounded in these captures; relevant retrieved label, focus and heading guidance was applied without treating unrelated search results as design evidence.

Implemented:
- Shared surfaces, typography, control sizing and navigation in `ui-refinements.css`; existing Inter, Bootstrap icons and equipment artwork retained. Light appearance remains intentional.
- Overview: coaching cue with facts, two early action buttons, readable direct equipment checklist, separate settings/organization/timeline column on desktop. Equipment counts remain complete. A first mobile revision placed actions too low; it was corrected so the start action ends at approximately 444 px on a 375×812 screen.
- The new overview wrappers initially broke the fact-tile shortcut's direct-child selector. The selector was corrected and half-pitch/three-coach save plus quarter-pitch/two-coach restoration were verified.
- Exercise: five persistent controls for diagram, full procedure, timer, settings and equipment. Doses and all procedure steps remain visible. The original one-step procedure remains available from the menu. Back restores section and scroll position; phase controls return to the diagram and retain playback behavior.
- Timer control opens the existing timer panel directly. A running training timer stayed running while animation phases changed; it was then paused and reset to 10:00. No timer starts automatically.
- Library: clear mode buttons, search first, explicit labels, tighter previews and no irrelevant session selector above the library. Passing filter produced nine exercises; an unmatched search produced the existing empty state and clearing it restored nine.
- Preparation, equipment, archive, share and locked personal-plan surfaces use the same cards and controls. Dialogs prevent background scrolling. No password was entered and private content was not decrypted during visual QA.
- Fullscreen inspection found phase buttons inheriting full dialog width (724 px content in a 372 px dialog). Scoped control sizing removed that overflow. Fullscreen now opens the diagram directly; closing restores the previous panel. Procedure, timer, settings and equipment controls return to the main card before opening their content.

Verification:
- JavaScript syntax and `tests/validate.mjs`: 65,895 checks passed after implementation; final run recorded in project state.
- 375×812 portrait: primary actions visible, full procedure jump and back-to-diagram work, local navigation and completion remain available. Phase previous/next kept animation playback; the separate training timer remained independent.
- 320×568: no horizontal overflow; conditions could be opened, changed, saved and restored. All five equipment images loaded. Native numeric inputs retain bounds and use a numeric input mode.
- 844×390 landscape: procedure jump scrolled the page to 632 px, diagram returned to the top, Back restored 632 px. Completion button bottom was 380 px, within the viewport.
- Landscape timer focus was also checked: the start/pause control was automatically brought above the fixed navigation (button bottom about 184 px, navigation top 254 px), without starting the clock.
- 1440×900 desktop: two overview columns approximately 569/367 px, no horizontal overflow. Archived Tuesday still selected 19 players and retained its existing training and share URL. Its single start action fills the journey row.
- Direct checklist: overview 1/5 matched the detailed checklist's checked ball item; returned to 0/5 after QA. Preparation step two retained the actual four-area map and all cone instructions. The locked personal-plan form retained its original password and optional backup flow. Application console errors/warnings: zero in the exercised flows.
- Visible keyboard focus, explicit input labels, accessible icon names and target sizes were inspected. This is not an accessibility-compliance certification.
- Final fullscreen check at 390×844: dialog content width 372/372 px, phase arrows 44 px, next/previous returned to phase one. Procedure closed the dialog and focused the full procedure; close restored settings; timer closed the dialog and opened the real timer at 10:00 without starting it. Console errors/warnings: zero. Final syntax checks for both changed scripts, 65,895 regression checks and diff whitespace check passed before commit.

Public visual evidence after deployment is saved in the same evidence folder as `ux-overview-live.png`, `ux-exercise-live.png` and `ux-library-live.png`; deployment commit and live verification are recorded in the canonical project notes.

Not exercised: physical phones, mobile software keyboard, OS-level larger-text and reduced-motion settings, private-plan decryption and the native share sheet. The host's DOM browser supports viewport testing; the user's shared desktop settings were not changed. CSS retains a light color scheme, readable wrapping, reduced-motion transitions and keyboard alternatives. No dark theme was introduced or claimed as tested.

## Whole-application unification — 29 October 2026

final result: passed

Scope: the user explicitly expanded selected option 1 to the entire existing application, including the initial equipment overview. Existing URL, routes, training content, animation engine, settings, vault bundles and encryption are retained. This is an extension of the approved design language to existing screens; there is no separate new source mock for those screens.

Evidence: selected source `../output/design/option-1-reference.png` (853×1844 pixels normalized to390×844 CSS); current exercise and overview captures at390×844, desktop1440×900. Combined comparison `shell-design-comparison.jpg` in the existing visualization evidence folder alongside `shell-overview-local.png`, `shell-exercise-local.png`, `shell-equipment-local.png`, `shell-library-local.png`, `shell-private-local.png`, and `shell-desktop-local.png`. Existing exercise-reference comparisons above still apply. Overview images were re-captured after all five asset images reported complete/naturalWidth>0.

Findings fixed before passing:
- P2: long cone-goal quantity made the first equipment row excessively tall. Show the real goal count with 'z kužeľov'; retain the full16-cone breakdown and non-additive equipment instructions in the checklist.
- P2: bounded desktop bottom navigation was left aligned. Center the1040px navigation with50%/translateX, verified left200 at1440px viewport.

Required surfaces:
- Typography: shared locally hosted Inter, heavy26px page titles, consistent14–16px forms/body, smaller labels reserved for secondary metadata. Original exercise typography retained. No new font downloads or fallback-only capture.
- Layout: compact overview with visible equipment, two large preparation/start actions, separate closed condition/focus/timeline disclosures; readable checklist cards and consistent rounded dialogs.320×568,375×812,390×844,1440×900 and844×390 landscape have no horizontal overflow across Overview/Library/Equipment/Private. Native vertical scrolling remains intentional for detailed lists and small screens.
- Colors: selected ivory/sage/evergreen tokens now apply to header, navigation, inputs, cards, guide dialogs and private plan. Light-only color-scheme retained; no unsupported dark-theme claim.
- Imagery: existing real ball/cone WebP assets reused; official Bootstrap v1.13.2 icons with included MIT license across navigation. No generated replacement assets or hand-drawn UI illustrations. Football geometry and animation remain the existing operational SVG engine.
- Content: true quantities adapt to attendance; exact quantities/details retained in checklist. Existing coaching, rotation, water and training content are unchanged. Actual stored dates/configuration remain authoritative.

Functional evidence:
-51904 existing checks pass; app.js syntax and git diff whitespace clean.
- Attendance14→30 updates gear and groups; quarter→half50×35→full70×50 and coaches2→3 apply and persist through navigation. All original controls remain accessible in disclosures.
- Checklist checkbox persisted through reload, progress1/5, full usage details expand; overview gear links focus the matching checklist item.
- Preparation opens all5steps; step2 playback starts normally at0.5/repeatON. Warmup30 produced32/32 moving player/ball actors.
- Timeline exposes6blocks and opens block2. Existing exercise full description still opens. Library search works, archiving lists3dates, Tuesday overview hides inapplicable adaptive controls, Moje remains locked.
- Browser console errors/warnings:0. All browser automation used hidden DOM-only IAB; no system mouse/keyboard/focus takeover.

Limitations: native OS share sheet, physical-device keyboard/system text enlargement, and decrypting the private plan were not exercised. Share logic, vault data/crypto, and reduced-motion behavior are unchanged. No P0/P1/P2 remains; publication is authorized to the existing GitHub Pages address.

## Equal equipment, static preparation and timed phases — 30 October 2026

User-scoped follow-up to 902260e. Checklist cells now have equal width and height within each responsive grid (three columns, two below361px), including the two longer items. Quantities and check state remain unchanged; no fixed content height or truncation was added. Exercise equipment grids also use equal rows.

Preparation is static and directly selectable by all six exercises. Rondo retains all16corners from passing, zones combine the16corner moves and16new zone markers into one32-cone map, and games reuse those markers for goals. Start/end times identify the selected exercise. Opening from an exercise selects its own setup. Original setup geometry and data remain; the old motion model is preserved for compatibility but no playback UI is mounted.

Exercise phase cards derive from the existing full sequence actualSeconds, not the accelerated preview length. Warm-up is exactly three main phases (120s mobility,180s dribbling,3×60s passing with2×30s recovery and60s water). Continuous tactical halves merge into one playing duration; rounds separated by recovery retain their repetition counts. Each real work/setup/rest/water segment belongs to one card; the end hold is not additional training time. The current card, cue and rest/water label update with the actual animation phase, including defender/neutral changes. Selecting a card shows its start diagram. Postup opens the current card, with original detailed rules in a disclosure. The redundant Aktuálna fáza animácie heading was removed. Timing, tracks, independent training timer, settings, archived content and vault data are unchanged.

Verification evidence:
-375×812: five checklist cells each104×174.67px;320×568: five cells136.5×157.875px;1440×900:184.3125×141.078125px. No horizontal overflow.
-Static setup at375: zones32cones (16moves+16added), direct Rondo selection has no moves. At320, opening preparation from exercise3 selects Rondo; fixed footer buttons bottom547inside568px. No animation controls are mounted.
-All six exercise phase plans inspected at24players. Warm-up phase3 remains selected during30s recovery and labels it explicitly; next/previous and running/paused animation behavior retained. Selecting phase2 and Back returned to Postup. At28players, seven-player zones changed the visible cue from blue/right/N1 to dark/left/N2 within the same round; merged work duration90s. Landscape844×390 Postup brings the current card to about12px from top; Hotovo bottom380px. Console errors/warnings zero.
-Automated checks include phase coverage with no omitted/duplicated time; original block totals; one current-card mapping for every work/rest/water phase; warm-up grouping; uninterrupted mini-game work duration; six setup maps with every cone exactly once. Matrix10–30players × quarter/half/full × base/standard/challenge.
-Changed-script syntax, validate.mjs and sequences.mjs results and final public captures are recorded in canonical project notes. Live proof: phase-equipment-live.png, phase-preparation-live.png and phase-steps-live.png in the existing visualization folder.

Not exercised: physical phones, OS text scaling/reduced-motion settings, native share sheet and vault decryption; those flows are unchanged. Browser work used hidden DOM APIs, without shared desktop input.

## Focused exercise layout revision — 30 October 2026

User rejected the appearance and explicitly identified exercise/phase layout as the problem. Scope is the exercise only. Equipment, overview, static preparation, library, models, stored data and vault remain unchanged. Current-run baseline exercise-layout-before.png was saved and inspected at390×844: the large overall dosing panel occupied the space needed for the current instruction.

New scoped exercise-layout.css keeps the existing palette/assets but changes hierarchy to group+small total duration, diagram, compact phase choices and one active detail with phase arrows, work/rest/water and the actual cue. Full original dosing, description and ordered rules remain in a closed disclosure. Disclosure state is restored by Back and fullscreen close. Three warm-up phase choices fit across; larger lists scroll horizontally, with all phase navigation also available by existing arrows/keyboard. The current choice follows playback and seeks the same model time when tapped. Desktop places diagram and detail side by side. Fullscreen keeps the arrows and hides normal detail content.

The first broad local UX search returned unrelated typography guidance and was rejected. The narrower Active State navigation result fit the selected-phase control and was applied. Other layout decisions are grounded in the captured screen and actual viewport checks.

UI evidence at375×812: initial cue bottom616px versus footer top676px; all six exercises retain their cue above the footer (other blocks616/638/626/648/595px). At390, diagram/three choices/current instruction share the first view. A first revision overflowed by6px; spacing was tightened without shrinking touch targets.320×568 retained the full-width completion button at bottom558px and no horizontal overflow.1440×900: diagram387px wide beside359px detail, both start at198px; diagram360px high.844×390: Postup places summary12px from top and completion bottom380px.

Interactions checked: phase next/previous with playback state; selecting phase3 shows its actual passing diagram and work/rest/water; full dosing expands with all original steps; selecting rest then Back restores the open disclosure; running training timer stayed Beží while animation next remained playing, then paused/reset10:00. Fullscreen content width357/357px, arrows remain44px high; fullscreen Postup closes it and focuses main summary. Seven-choice zones scroll to last choice and retain90s work/30s rest; end and previous recover correctly. Inline A1 skill change rebuilt the new detail. Application console errors/warnings zero.

Final syntax/regression/diff and public version verification are in canonical notes. Live screenshot exercise-layout-live.png is in the existing visualization evidence folder. No physical-device, OS text-scaling/reduced-motion, native sharing or vault decryption test; those systems are unchanged. Hidden DOM-only browser testing used no shared desktop input.

## Unified preparation and manual interval timer — 30 October 2026

User authorized extending the accepted compact exercise style to overview, equipment and static setup, and requested five-second sound warnings/end/start. Clarification is authoritative: every next series must be started by a button. The earlier full-exercise diagram layout and all saved training/vault data are retained.

Overview now has a plain compact title/cue, small condition row, two48px actions and five equal checklist cells (390px:109.66×104px,320px:89×104px). Long adaptive bib counts use a short arithmetic label while their full quantities remain in the accessible name and equipment disclosure. Archive quantities such as4colors×6+2 are retained verbatim rather than naively adding their digits. Equipment uses the same white row cards, complete quantities/usage in a disclosure, explicit Overview and Setup shortcuts and synchronized checks. A redundant global Setup shortcut above this toolbar was removed. Setup keeps six numbered direct choices, an explicit Back, static map, one short instruction and fixed next/back footer. No cone geometry or training doses changed. Library/private/archive surfaces retain the shared radius and light palette.

The new interval model derives every actual work/rest/setup/water duration from the selected group's approved FootballSequences. Initial and manual-series5s ready periods and indefinite waiting are outside the training total. Next work series gate after recovery; rondo role rotations within one series and uninterrupted mini-game halves do not gate. At a gate, wall-clock catch-up clamps to the next work start instead of consuming its time while waiting. Pause/resume/reset and changing blocks cancel future sound; a running clock retains its original group, with an explicit note after a configuration change. Reset reloads the current group. Archives retain whole-block timing without guessed series.

Audio is unlocked by Start/Test, with a1.5s lookahead scheduler. Distinct patterns cover countdown5–1, stop, ready/wait, start and finish. Mute, resume and late page-return avoid duplicate or stale sound. Wake Lock is best effort, released when not running and does not repeatedly request after a denial. MDN Web Audio best practices and Screen Wake Lock references are linked in README; no locked/background-device alarm guarantee is made.

UX iteration: the first timer presentation was clipped below the long dosing pane. It was replaced by a full timer view with group, activity, large countdown, next activity and visible audio status. Original Work/Rest/Rotation panels remain via Dávkovanie a striedanie. Their view state is in the existing Back trail; returning restores the full timer, while Diagram/Settings collapse its display without stopping it. A broad UX search returned unrelated form feedback and was rejected; the narrower contextual-live-badge entry matched the atomic timer state message. Numeric countdown is not a competing live announcement.

Verification:
-Model/audio test3591schedules:10–30children×quarter/half/full×base/standard/challenge. Exact original totals/boundaries,5–1warnings, manual waits, preparation outside totals, pause/resume/reset/mute/final/ready sound scheduling and archives. Initial passing test timestamp was corrected to275s=5ready+60demo+180work+30rest; its waiting assertion remains intact.
-Real DOM-browser run: Start00:05 with audio context active; then Rozhýbanie01:54/overall09:54. A full real125s run across Overview/Equipment/Setup ended in Vedenie03:00, overall08:00, Pripravené na ďalšiu sériu and the manual Start button. Clicking it produced new Ready00:05 with overall still08:00. Pause/reset restored the initial state. Audible output on physical hardware was not verified by the agent.
-Checklist1/5synced to detailed ball checkbox, full bib quantities shown, then restored0/5.320setup302/302px,32zone cones, fixed buttons bottom549inside568px. Desktop overview columns546/390px, equal cells105.5px high, no horizontal overflow.
-375timer Start bottom464px below footer top676px; sound mute showed Bez zvuku, test reactivated the context. Scope A kept running after choosing B and showed the old-configuration note; reset changed scope to B.844×390Start bottom142px above navigation254px, no horizontal overflow. Timer→Doses→Back restored the clock. Archive Tuesday kept19players, original4colors×6+2bibs and no setup; Moje remained locked without entering a password. Console errors/warnings0.
-Final syntax/validation and live deployment evidence are recorded in canonical notes. Screenshots: unified-overview-live.png, unified-equipment-live.png, unified-preparation-live.png and interval-timer-live.png in the existing visualization folder.

Not exercised: physical mobile speaker/silent mode, lock-screen/background suspension, OS text scaling/reduced-motion, native share sheet and vault decryption. Browser viewport checks and deterministic audio scheduling tests do not establish physical audibility or accessibility certification.

## Stable local switching — 30 October 2026

User requested that the image must not jump when switching buttons. Current-run baseline at375×812 reproduced an application-driven31px shift: Postup set exercise scroll31/diagram top159, selecting phase2 reset scroll0/diagram top190. Capture stable-layout-before.png is in the evidence folder.

Fix scope: removed automatic vertical scrolling from hero/phase switching, settings tabs and equipment details; kept explicit page navigation, keyboard access and Back restoration. Same-topic detail tabs preserve their scroll. Local scrolling containers reserve scrollbar space and disable scroll anchoring; the exercise uses its internal gutter rather than two viewport gutters. Phase detail and open setup content retain their needed height, with phase-width changes allowed to reflow. Setup preserves scroll and open details, and restores focus without scroll. Settings form retains its needed height until closed. Pointer focus avoids browser default refocusing scroll; keyboard navigation remains intact. Timer label slots and action heights are stable, with sticky actions on short screens. No model, dose, animation track, timer/audio logic or vault data changed.

The UX Content Jumping entry directly matched this problem: stable space/content containers rather than inserted text shifting nearby controls. Verification separates native/browser-automation focus reveal from activation. The DOM locator may reveal a focused button before activation; after explicit focus, Space provides an unambiguous before/after measurement of the actual app handler. Early screenshots measured an unfinished native PageDown scroll and were rejected as scroll-retention evidence.

Accepted evidence:
-375×812 phase3, next, previous and phase2 activation: page, exercise scroll, diagram top/width and phase-tab top unchanged (all deltas0). Diagram width328px; tested focused scroll positions18/31px. Postup itself no longer forced31px scrolling. Pointer clicks still change phases and native summaries still toggle.
-320×568 phase3: page0, exercise scroll57, diagram left12/top55/width281 before and after; completion bottom558, no horizontal overflow.1440×900 phase-next diagram top198/width379.55 unchanged.844×390 phase-next page339/diagram top−149/left34.5 unchanged; that initial page scroll was an explicit focus reveal, not created by activation.
-Settings Tréneri/Skupiny/Ihrisko activation retained page396/396/412 and tab top315/315/299 respectively. Timer work→pause/reset ready retained toggle top407.77px/width174. Tiny timer actions initially fell below the pane after line reservation; sticky actions corrected Start bottom409 within panel bottom418, above nav434.
-Setup direct0/1/3/4 choices retained map top281.8/width299 and body scroll0. Open details remained open with unchanged map/body position on selecting Rondo. Focus restoration and closing work. Console errors/warnings zero.

Final syntax/regression and publication evidence are in canonical notes. Public proof stable-switching-live.png is in the existing evidence folder. Physical-device focus/scroll and OS keyboard behavior were not tested; viewport/DOM keyboard/pointer checks do not establish universal browser behavior. Existing manual timer and audio model are unchanged.

## Timer beside the exercise — 30 October 2026

- Scope: compact always-visible field clock above the diagram; existing design, doses, sound/manual gating and animation model retained. app33/unified3; interval-timer1 unchanged.
- The inline and detailed controls share one handler/clock, including disabled state during audio unlock. Start entered 00:05, then work; inline pause and full panel both read 01:42/paused; full reset restored inline 00:05/Ready. No second schedule or animation coupling.
- 375×812: inline button44px, diagram328×194.875. 320×568: clock296×60, button112×44, bottom CTA558; no horizontal overflow. 1440×900: clock760×60, diagram379.55×360; no horizontal overflow. Console warnings/errors0.
- Syntax app.js, validate65898, interval schedules3591 and diff-check PASS. Physical mobile audio/lock-screen not repeated; browser DOM/viewport checks only. Live screenshot: inline-clock-live.png in the session visualization folder.

## Per-phase clock below the animation — 30 October 2026

- Explicit choice: after the whole exercise, open the next exercise automatically; its clock waits for manual Start. Series within an exercise still require manual Start. app34/football32/unified4, timer model/audio unchanged.
- Existing clock node moves after the figure, rescued before rerender; no duplicate IDs or independent timers. Current work/rest/water label, remaining time, next interval. At real interval boundaries, exact scene name/kind is selected without autoplay or scrolling; manual preview does not consume/seek the real clock. Changed running scope is retained as before.
- Completion waits1.2s for the final audio pattern, then calls the existing completion/navigation action once. Guarded by current clock/key, field view and visible document; reset or leaving cancels pending navigation. Final exercise uses the existing completion screen.
- New deterministic phase-clock test uses a shared fake Date in the interval and UI scopes: work→rest, manual waiting does not consume time, five-second ready, shared full/inline values, exact interval→scene mapping, one final navigation, manual next clock and last exercise completion. First test used different VM clocks; corrected the test adapter, with production model unchanged.
- UI375×812: Start after preview3 returns to actual phase1/work; pause01:45, selectedphase1, timer directly below diagram. Next exercise shows one clock and00:05/Start. 320×568: diagram170high, clock281×76/top292, button44high, CTA558; no overflow. 1440×900: figure379.55×360/bottom558, clock samewidth/top572; detail alongside. Console0.
- Syntax2/validate65898/interval3591/phase-clock/diff PASS. Physical mobile audio not run; browser DOM/viewport and deterministic signal checks only. Live screenshot: phase-clock-live.png in session visualization folder.

## Approved hybrid implementation — 31 October 2026

**Source visual truth:** `../output/design/redesign-31-10-hybrid-proposal.png` (853×1844), explicitly approved with all existing animations/settings/timer and the same public URL. Supplied top/bottom crops retained alongside it. Scope: adaptive exercise screen only; other completed screens preserved.

**Implementation evidence:** session visualization folder, `hybrid-local-final.png` (390×844 raw browser screenshot), `hybrid-comparison-final.png` (source and implementation in one input), `hybrid-header-compare.png`, `hybrid-controls-compare.png`, `hybrid-desktop-final.png`. Source downsampled proportionally to390×843, padded one pixel for390×844 comparison; no source or raw screenshot altered. Full and control-region comparisons were opened together. State:24 children, warm-up, phase2 preview; real clock ready00:05. The source uses illustrative work01:45/rest00:30. Production keeps the approved real schedule and manual start rather than fabricating those values.

**Comparison history / fixes**
- P2 pass1: title and marker labels too small. Title23→27px, metadata14px, focused player labels11px / marker radius12 (dense10). Existing physical positions/tracks unchanged. Updated raw captures and full-view comparison inspected after fixes.
- P2 desktop: excessive empty gap between timer and cue. Grouped clock+summary into a responsive side container; final clock78–163, summary177–294.5 beside a492.7×492.7 diagram. No fixed-height gap. Mobile side container uses display:contents to preserve source order.
- P2 relocation: full dosing block inherited hidden state after moving under Postup. Explicitly keep it available inside closed full-plan details; UI verified active8min,2×30s rest,+1min water,3×60s, and full10min total.
- Final comparisons have no outstanding P0/P1/P2.

**Required fidelity surfaces**
- Typography: existing self-hosted Inter, strong title/timer hierarchy, native phase select16px, readable short cue, consistent three utility buttons. Real long titles wrap; no text overlaps.
- Spacing/layout: true358×358 square at390;343×343 at375;296×296 at320; square348×348 fullscreen. Timer directly below on mobile; phases/cue/three utilities/CTA in source order. Selected warm-up cue bottom686.7 < dock688 at375. Long-title/small-height views scroll content while preserving the dock.
- Colors/tokens: retained ivory, forest-green CTA, sage phase state, blue players/orange cones. Existing grass WebP retained as required; no generated screenshot flattened over functional content.
- Image quality: original grass/cone/disc/ball sprites reused. Football geometry remains the live existing SVG model so actual21:14 proportions and motion paths are preserved, unlike the illustrative screenshot positions. Standard Bootstrap list-ul icon added from officialv1.13.2 source (MIT); kit uses cone-striped. Decorative cue uses the existing football sprite instead of the mock boot: acceptable P3 asset choice. No device chrome or placeholder artwork.
- Copy/content: real category/attendance/duration/phase/doses replace illustrative values. All details remain reachable. A discreet⋯ menu preserves Back/Home/share/coach/private/clock functions omitted by the crop.

**Browser interactions / regressions**
- Phase select and lower cards synchronized; phase select activation diagram y131,width358,scroll0 before/after. Previous phase and menu Back return one actual step.
- Inline Start5s→work01:52/Pause; full and inline clocks share values. Audio Test activated. Animation actors move while real timer paused. Preview pause/previous phase work independently.
- Postup step2/full rules, utility return, kit24+4balls/8cones; levelA1base→standard; speed0.5/loopOFF→fullscreen→restore1/loopON; all advanced count/pitch/map controls remain available.
- All six blocks checked at375: one clock each, square343px,3/2/3/7/5/2 phase choices, no horizontal overflow, CTA800<812. Final completion shows finished training. Menu Home opens unchanged overview/checklist.
- 30children: displayed zoneA16, actual16players, metadata30; grouped8+8+7+7. 320×568: button/dock reachable, CTA556<568. 1440×900: square492.7px, grouped right controls;844×390: square390px, page scroll retained, CTA378<390.
- Archived Tuesday19 retains original whole-block timer and layout; no adaptive styling leaked. Console warnings/errors0.

**Verification:** syntax app.js/football.js, validate65899, sequences55224, interval3591, phase-clock and git diff-check PASS. Model/dose/JSON/private ciphertext files unchanged. No physical mobile, OS text-size/silent-mode/lock-screen or private decryption tests; existing deterministic audio/timing checks passed.

**Follow-up polish:** optional decorative boot icon. No blocker.

**final result: passed**


## Overview graphic polish — 31. 10. 2026

Scope: only overview visuals. Forest-green title/facts card, two distinct journey actions, equal equipment checklist fields and a desktop conditions column. Existing ivory/Inter/green style and actual icons/assets retained. No scripts, training data, doses, private ciphertext or exercise styles changed. New stylesheet is scoped to the overview.

Browser QA in hidden IAB, without system input: 320×568,390×844,834×1112,1440×900 have no horizontal overflow. Five equipment fields have equal heights at each width. Checklist toggling persists after reload and was restored to0/5; fields remain the same height when checked. Space fact opens pitch conditions; saving and closing works. Preparation opens the original six-step diagram; Start opens the existing square358px exercise visual, clock and phase controls. Browser Back returns to overview. No console warnings/errors. Tablet uses five cards in one row; mobile uses3+2 centered.

Evidence: overview-before-graphic-31-10.png and overview-graphic-local.png in the project visualization folder. Validation: node tests/validate.mjs and git diff --check. Physical mobile/audio/full75min run not repeated for this CSS-only change.


## Preparation graphic alignment — 1. 11. 2026

Scope: preparation dialog CSS only, plus its stylesheet link. Existing forest/ivory/sage/Inter style from the approved overview reused. Six equal48px exercise tabs, strong selected state, green header, white diagram/instruction/details cards and fixed large footer actions. Scoped under `.pitch-setup`; no JavaScript, geometry, data, models, settings or clock changes. Mobile touch spacing8px follows the targeted UI/UX Pro Max mobile touch-spacing result.

QA: all six SVG outerHTML values match the previous live version exactly for24children/quarter35×25. All six steps at375×812 have no body scroll, identical mapY282.78 and CTA bottom791;390×844 also fits. Back6→5 and expanded full details verified; final completion closes and returns focus to Prepare.320×568 has intentional body scroll129px in step4, no horizontal overflow; footer buttons76/179×50px remain visible at bottom551 and labels do not wrap.1440×900 fits with six tabs in a row, no scroll/overflow, CTA bottom879. Changing30children/full70×50 updates preparation map to two30×20 zones and groups8+8+7+7. Unchanged exercise square343×343 and idle clock00:05 at375; local console0warnings/errors.

Evidence: preparation-before-01-11.png and preparation-graphic-local.png in the project visualization folder. Existing validation and diff checks run before commit. Physical mobile, audio and real75min run not repeated for this CSS-only change.


## Equipment graphic alignment — 1. 11. 2026

Scope: equipment page stylesheet and static heading wrapper/status role only. Native checkbox/label and all scripts, stored state, training data and other views unchanged. Approved forest/ivory/sage style reused; original local images/icons and compact quantity formatter retained. Two equal columns on mobile with fifth card centered; three columns and centered last two on desktop. Full label toggles the checkbox; green border/fill and native check provide state. Full quantities/details remain in their original disclosure. Opening details lets only that card grow instead of stretching all rows. Targeted UI/UX Pro Max mobile touch-spacing recommendation applied with8px gaps; no vibration added.

QA in hidden IAB without OS input: title-label taps select two items, reload preserves2/5, overview mirrors2/5; overview third item returns checked in equipment3/5. Keyboard Space and final item reach5/5, reset returns0/5. Toggling preserves card bounds and scroll0. Details shows original full28-ball quantity/instruction without toggling a checkbox; Prepare opens preserved six-step map. Mobile390×844 equal166.5×163 cards;375×812 fifth bottom742.69 < nav745, all five cards visible, no horizontal overflow. Archive Tuesday at320×568 keeps complete longer quantities, five equal136.5×175.69 fields, no broken images or horizontal overflow. Desktop1440×900 equal312×203 fields, centered final pair, no overflow. Console0warnings/errors.

Evidence: equipment-before-01-11.png and equipment-graphic-local.png in the project visualization folder. Validation and git diff check run before commit. Physical phone, native share, audio and real75min timer run not repeated for this CSS/static-HTML change.


## Forward training plan — 1. 11. 2026

Feature: overview entry after equipment opens a separate planning view. Seven/fourteen-day windows, native date input, Today, Prepared period, previous/next period, explicit empty state and six dated full-training links. Existing approved green/ivory style and48px controls retained; no sixth bottom-navigation item. Entry follows equipment so original overview gear positions remain intact. Locale-aware Slovak dates and native date input follow the targeted UI/UX date-format/input-type guidance.

Content: six provisional U11 sessions2/3/5/9/10/12Nov2026. Dates/times await the user clarification; Thu18:00 is proposed, other times absent. Each is an independent copy of the approved75min pass/move format with a distinct focus/cue, not six newly invented activity models. Default20children/quarter35×25/2coaches/base-base-standard-standard; all existing settings available10–30. Existing3JSON training records and private ciphertext files unchanged. Future support is restricted to explicit templateId. Preparation now accepts missing start time as relative minutes.

QA: root opens nearestNov2; explicit old29Oct URL restores24children/base-base-standard-standard and hides draft notice, original Prep18:00–18:10. Planning1week→3 sessions, nextweek→3, next→empty, Prepared→6, from9Nov/1week→3. Nov2count30 survives reload; Nov12 independently defaults20. New-day preparation without time shows0min–10min; Thu12 shows18:00–18:10. New-day animation Play/Pause and clock5s→work01:50/Pause operate.320×568 and1440×900 have no horizontal overflow; minimum planning button48px, desktop two474px columns. Local console0warnings/errors. Browser in hidden IAB without OS input.

Checks: syntax of4changed scripts; calendar(date/range/timezone/DST/leap/duplicates/archive isolation,6drafts/54future count+pitch adaptations), validate65904, sequences55224, interval3591, phase-clock and warmup126 all PASS; git diff-check PASS. No physical phone, native share, private decryption, OS audio/lock-screen or full75min run. Planning data remains on GitHub; condition edits remain local and are shared through existing training links. No recurring automation or AI generation enabled.

Evidence: planning-two-weeks-local.png in the project visualization folder.


## Confirmed weekly start times — 1. 11. 2026

User confirmed U11 Monday/Tuesday/Thursday18:00. All six upcoming sessions now have18:00; `scheduleConfirmed` distinguishes confirmed dates/times from draft training content. Calendar metadata removes the obsolete time-confirmation prompt, overview retains a content-draft notice, explainer and README reflect the confirmation. No doses, activities, animation/timer logic, previous dates or private plans changed. app37/calendar2.

Verification: syntax app/calendar, tests/calendar (six18:00 sessions, schedule status,54adaptations and unconfirmed/no-time fallback), validate65904 and git diff-check PASS. Local DOM all6metadata18:00/75min; Nov2preparation18:00–18:10; overview term confirmed/content draft. Wider trajectory/audio/physical-device checks not repeated for this metadata/label change.
