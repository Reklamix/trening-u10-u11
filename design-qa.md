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
