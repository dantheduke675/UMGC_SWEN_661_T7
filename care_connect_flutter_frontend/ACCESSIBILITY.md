# Accessibility — CareConnect (Flutter)

Running record of the WCAG 2.1 Level AA work on the Flutter app. Kept as a
working log during remediation; the finished sections are written to be lifted
into `README.md` for submission.

**Status as of 2026-09-21:** all Level A and Level AA criteria addressed and
verified by automated evidence at three levels — widget tests, on-device
integration tests, and Maestro flows driving the installed APK through
Android's own accessibility tree (§7). A **TalkBack pass has now been run** on
an Android 17 emulator with the real screen reader switched on; the transcript
is in `evidence/talkback-transcript.txt` and §8 records what it found and
fixed. VoiceOver remains untested — see §8 for why, and what stands in for it.

---

## 1. Conformance summary

| WCAG 2.1 criterion | Level | Status |
|---|---|---|
| 1.1.1 Non-text Content | A | Done |
| 1.3.1 Info and Relationships | A | Done |
| 2.1.1 Keyboard | A | Done |
| 2.4.3 Focus Order | A | Done |
| 3.3.2 Labels or Instructions | A | Done |
| 4.1.2 Name, Role, Value | A | Done |
| 1.4.3 Contrast (Minimum) | AA | Done |
| 1.4.4 Resize Text | AA | Done |
| 1.4.11 Non-text Contrast | AA | Done |
| 2.4.7 Focus Visible | AA | Done |
| 4.1.3 Status Messages | AA | Done |
| Target size 48×48 | rubric* | Done |

\* Target size is Level **AAA** in WCAG 2.1 (SC 2.5.5); WCAG 2.2 later added
the AA-level SC 2.5.8 at 24 px. The 48×48 figure in the assignment rubric comes
from the Android platform guideline, which Flutter's
`androidTapTargetGuideline` enforces — and which the app now passes.

---

## 2. Measured before / after

All numbers produced by the accessibility suite in `test/accessibility/`
(see §6). The "after" column is asserted, not observed: each row fails the
build if it regresses.

| Measure | Before | After |
|---|---|---|
| Flutter `AccessibilityGuideline` checks failing | 18 of 60 | **0 of 60** |
| Controls not keyboard reachable (Today screen) | 11 of 12 | **0 of 13** |
| Keyboard focus stops reachable with Tab | 1 | 17 |
| Tappable nodes with no button role | 95 of 96 | **0** |
| Accessible names that were emoji only | 3 | **0** |
| Heading nodes exposed per screen | 0 | 1–4 |
| Text contrast pairs failing 4.5:1 | 28 of 81 | **0** |
| Non-text contrast pairs failing 3:1 | 6 of 12 | **0** |
| Painted paragraphs below AA, measured from the render tree | 3 screens | **0 of 13 screens** |
| Screen/scale combinations with layout errors | 15 of 39 | **0 of 104** |
| Controls with no name, an emoji-only name, or no role | 98 of 110 | **0 of 110** |
| Status-message announcements on state change | none | 8 covered by tests |
| Confirm dialog announced as a dialog | no | **yes** |
| Tap through dialog barrier navigated away | yes | **no** |

Illustration — the Today screen medication card before:

```
[NO ROLE] "💊 / Ropivacaine / 10 mg · 8:00 AM / ✓ Taken / ✓ Taken — tap to undo"
```

and after:

```
[button] "Undo: mark Ropivacaine at 8:00 AM as not taken"
[button, selected]     "Today"
[button, not-selected] "Meds"
```

---

## 3. Shared accessibility primitives

Added to `lib/widgets.dart` and `lib/theme.dart`, used across every screen.

| Widget / helper | Purpose |
|---|---|
| `CTappable` | The accessible tap target that replaced 23 bare `GestureDetector`s. Supplies a button role, an explicit label, an optional hint, `selected` / `toggled` state, a focus node, and a visible focus ring. |
| `CGlyph` | A decorative emoji glyph wrapped in `ExcludeSemantics`, so an icon's Unicode name never reaches a screen reader. |
| `focusRingColor(bool isDark)` | The highest-contrast neutral for the active theme, so the focus indicator stays visible on brand-coloured, surface and transparent backgrounds alike. |
| `CScreenTitle` / `CSectionHeader` | Screen and section headings exposed at heading levels 1 and 2. |
| `announceStatus(context, message)` | Posts a screen-reader announcement without moving focus. |
| `contrastRatio(a, b)` | WCAG 2.1 relative-luminance contrast ratio between two opaque colours. |
| `compositeOver(fg, bg)` | Composites a translucent colour over an opaque one — needed because the app's tint backgrounds are semi-transparent and contrast must be measured against the composite. |
| `readableOn(base, background, {minRatio})` | Shifts a colour's HSL lightness — hue and saturation untouched — until it clears the ratio, returning it unchanged when it already passes. |
| `readableOnTint(accent, surface, alpha, {minRatio})` | The tinted-pill convenience: label colour that clears the ratio against `accent` composited over `surface` at `alpha`. |

Four implementation details worth keeping in the README, because they are the
reasons the refactor did not regress anything:

- The focus ring is drawn as a **foreground** decoration
  (`DecorationPosition.foreground`), so receiving focus never changes layout.
- Where an emoji sits inline inside a sentence, `Text.semanticsLabel` is used
  instead of a wrapper. It changes only what is announced and leaves the
  widget's native role, focus node and tap action intact.
- Contrast is corrected **at build time** rather than by hand-picking a second
  swatch per accent per theme. Appointment type colours are arbitrary, so a
  runtime rule is the only thing that covers them all — and it cannot drift
  when someone adds a new accent later.
- `border` stays the light, decorative outline for cards and dividers;
  `controlBorder` is the new 3:1 token used for boundaries that identify an
  actual control. SC 1.4.11 covers the latter, not the former, so the card
  design is preserved.

---

## 4. Enhancements by criterion

### 1.1.1 Non-text Content (A)
- Every emoji used as an icon is hidden from assistive technology via `CGlyph`.
- Inline emoji in button labels announce the words only, via `Text.semanticsLabel`
  — "🙂 Care recipient" announces as "Care recipient", "← Back" as
  "Back to messages".
- Avatar initials (`CAvatarBadge`, profile card, call screen) marked decorative;
  the person's full name is always adjacent.
- `AuthStatusRing` exposed as an image with the label "Face scan preview".

### 1.3.1 Info and Relationships (A)
- Screen titles exposed as level-1 headings; section headings ("Care team",
  "Recent logs", "Preferences", "App info") as level-2.
- Cards announce as one coherent sentence instead of loose fragments merged
  with the button beside them — medication cards, appointment cards, symptom
  log tiles, care-team rows, preference rows, message bubbles.
- Message bubbles state the sender and time, which were previously conveyed only
  by which side of the screen the bubble sat on.
- Week-strip days announce the full date rather than "M / 14".

### 2.1.1 Keyboard (A) and 2.4.7 Focus Visible (AA)
- All 23 `GestureDetector` controls replaced with `CTappable`, giving every
  control a focus node and a visible 3 px focus ring.
- `AuthField` became a real input, so it can be focused and typed into.
- Verified: 0 of 13 enabled controls unreachable on the Today screen.

### 2.4.3 Focus Order (A/AA)
- The "mark dose as missed" confirmation was a `Container` inside a `Stack`.
  It is now a real `showDialog` route: modal barrier, focus scope, and route
  semantics (`scopesRoute` + `namesRoute`).
- Cancel is autofocused, so a keyboard user pressing Enter out of habit cannot
  confirm a destructive action by accident.
- Fixed a functional bug alongside it: a tap on the bottom nav used to pass
  straight through the dim overlay and silently abandon the confirmation.

### 3.3.2 Labels or Instructions (A)
- `AuthField` was a `Text` inside a `Container` — a picture of a field. It is
  now a `TextFormField` whose `labelText` and `helperText` are owned by the
  field, so it announces as "Email address, edit box" with the helper as its
  description.
- Password fields set `obscureText`; email fields set
  `keyboardType: TextInputType.emailAddress`.
- The message composer gained a `labelText`; a `hintText` alone disappears once
  the user starts typing, leaving the field unnamed.
- The severity slider gained a `label` and a `semanticFormatterCallback`, so it
  announces "Severity 3 of 5" rather than a bare number.

### 4.1.2 Name, Role, Value (A)
- Button role on every interactive control.
- `selected` state on bottom-nav tabs, week-strip days and symptom chips.
- `toggled` state on both theme switches.
- Repeated on-screen text disambiguated in the accessible name: every
  "I took this" announces which dose it applies to; every speech-bubble button
  announces whom it messages; every "Undo" row names the action it undoes.
- Bottom-nav tabs carry a position hint ("Tab 3 of 6").
- The Voice button was a no-op (`onTap: () {}`) announced as an enabled control.
  It is now explicitly disabled and announces "Voice input, not available yet".
- The animated "Connecting…" dots keep a constant `semanticsLabel`, so the
  animation stays but a screen reader does not re-announce twice a second.

### 1.4.3 Contrast (Minimum) (AA)
The app leaned on a "tinted pill" pattern — a chip or badge painted
`accent.withValues(alpha: 0.12)` and labelled in that same accent, i.e. text on
a tint of itself. That measured as low as **1.77:1**. Every such site now
derives its label colour from the composited background at build time.

| Element | Before | After |
|---|---|---|
| Light-theme chips: amber `#F59E0B` | 1.77 | 4.59 |
| Symptom severity amber badge (light) | 1.78 | 4.62 |
| Light-theme chips: green `#22C55E` | 1.85 | 4.52 |
| Purple chip on dark surface | 2.46 | 4.56 |
| "✓ Taken — tap to undo" (dark) | 2.78 | 4.51 |
| "I missed this" danger on dark surface | 2.81 | 4.51 |
| Active nav tab label, primary `#357C6F` | 3.12 | 4.55 |
| Progress card header (was `white70`) | 3.30 | 4.92 |
| "Calling…" status text | 3.47 | 5.56 |
| Today's date line, primary on dark bg | 3.77 | 4.53 |

Two static token changes were also needed: `lightMuted` moved `#666E7D` →
`#626A78` (it was 4.26:1 on `lightSurface2`, used for the message hint and the
disabled Log-symptom label), and the calling screen's gradient top stop dropped
from `alpha 0.9` to `0.55` — on the amber contact colour it left white status
text at 2.59:1.

### 1.4.11 Non-text Contrast (AA)
Card, input and button boundaries were drawn with border tokens that were
effectively invisible. New `controlBorder` token per theme:

| Element | Before | After |
|---|---|---|
| `lightControlBorder` vs `lightSurface` | 1.17 | 3.29 |
| `lightControlBorder` vs `lightBg` | 1.21 | 3.41 |
| `darkControlBorder` vs `darkBg` | 1.70 | 3.67 |
| Severity bar amber segment (light) | 1.93 | 3.04 |
| Severity bar green segment (light) | 2.05 | 3.06 |
| Progress bar track vs white fill | 1.74 | 3.49 |

Applied to the boundaries that identify controls: outlined buttons, the
accessibility-bar buttons, symptom chips, the "I missed this" outline, the
theme switch track, quick-reply chips and all text inputs.

### 1.4.4 Resize Text (AA)
Every screen inside `AppShell` used to overflow at **130 %**, before the 200 %
requirement. Fixes:

- The bottom nav and accessibility bar dropped their hard-coded `height: 76` /
  `height: 64` for `minHeight` constraints, wrapped in `IntrinsicHeight` so
  `CrossAxisAlignment.stretch` still has a bounded height to work with.
- The accessibility bar's `FittedBox(fit: BoxFit.scaleDown)` was removed. It
  shrank labels back down as the user scaled text up — actively defeating the
  setting rather than merely ignoring it.
- The week strip and quick-reply rail now scale their height with
  `MediaQuery.textScalerOf`, with a floor and a ceiling.
- The messages row put its name in an `Expanded`; a scaled-up name used to push
  the timestamp 185 px off-screen.
- The appointment card's chip row became a `Wrap` (92 px of overflow at 200 %).
- The calling screen's control labels are width-constrained and centred so they
  wrap instead of widening the row.

### 4.1.3 Status Messages (AA)
State changes used to be silent. Two mechanisms now cover both platforms,
because neither works everywhere:

- `announceStatus` posts a `SemanticsService.sendAnnouncement`, gated on
  `MediaQuery.supportsAnnounceOf`. This covers **iOS and the web**.
- Android reports `supportsAnnounce: false` — it deprecated announcement events
  because they force TalkBack to flush its speech queue. So the visible summary
  that each action changes is marked `liveRegion: true`, which is the mechanism
  **TalkBack** honours: the Today progress card ("3 of 9 taken, 33 percent
  complete"), the Medications tally ("9 doses today, 2 taken, 1 missed") and the
  Symptoms log heading ("Recent logs, 6 entries").

Covered actions: marking a dose taken, un-marking it, confirming a missed dose,
logging a symptom, sending a message, and undoing any action.

### Target size (rubric: 48×48)
`androidTapTargetGuideline` failed on 12 of 15 screen runs and now passes on
all of them. Changes: accessibility-bar buttons and the Voice button moved to
`minHeight: 48` constraints (they measured 47); week-strip day cells went from
52 wide with 4 px margins to 56 with 2 px; quick-reply chips gained a
`minHeight: 48` and their rail grew to 68; the theme toggle went 44×44 → 48×48.

### Found only by the stricter suite

Writing tests that measure the rendered pixels rather than the semantics tree
turned up four more failures after the AA round was thought complete. All four
were invisible to Flutter's own guidelines:

| Issue | Measured | Cause |
|---|---|---|
| Avatar initials on the amber contact | 2.15:1 | white initials painted on the contact's identity colour |
| Avatar initials on the indigo contact | 4.47:1 | same, marginally under the floor |
| Today's appointment-time pill | 1.77:1 | a hand-rolled pill that never went through `CChip` |
| Name of a dose already taken | 3.59:1 | de-emphasised with 55% opacity, which composites to `#7B808A` |
| "← Back" on two auth screens | — | `AuthBtn.semanticLabel` existed but was never passed, so the arrow still announced |
| Five auth screens | — | no headings at all; only the tab screens had been given them |

The avatar fix is worth noting as a pattern: rather than darkening every
contact colour until white text works, `legibleOn` picks whichever of white or
near-black reads better on that colour and only adjusts the fill when neither
does. The amber contact keeps its exact identity colour and gets dark initials;
the indigo one keeps white initials on a marginally darker fill.

### Found only on a device

Two further defects surfaced when the same criteria were checked on a real
emulator rather than on `flutter test`'s synthetic surface. Neither was
reachable from a widget test, for the same underlying reason: `flutter test`
never loads the real font and never runs the real platform pipeline.

**The navigation bar clipped its own labels (SC 1.4.4).** `google_fonts`
fetches Inter over the network, so the first layout happens with a fallback
font, where "Medications" fits on one line with 0.03 px to spare. When Inter
arrives it wraps to two lines — but `IntrinsicHeight` gives its child tight
constraints, which makes that subtree a **relayout boundary**, so the height
measured against the fallback font is never recomputed. Flutter reported a
13 px overflow and the second line was cut off, at default text size, on every
launch. Measured:

```
"Medications"  63.7 x 16.0   (one line, fallback font)
               64.6 x 32.0   (two lines, once Inter loads)
IntrinsicHeight  75.0  ->  still 75.0
```

Fixed by raising the bar's floor from 76 to 92 — room for the wrapped label.
Above roughly 120% text scale the label wraps under the fallback font too, so
`IntrinsicHeight` sees it coming and the floor stops mattering. The on-device
scaling tests now wait out the font fetch before judging the layout, and run at
100% as well as 130% and 200%, because 100% is where this one happened.

**Since superseded, and worth reading together.** The tab was later relabelled
**"Meds"**, which is short enough that nothing wraps at default size, so the
0.03 px margin above stopped being load-bearing. The 92 px floor was kept: it
is what stops the bar resizing between the fallback font and Inter, and it is
still the headroom the remaining labels need as text scales. The measurement
is left here because the relayout-boundary trap it documents is a property of
`IntrinsicHeight`, not of that one word — any label that starts wrapping will
hit it again.

**The symptom form announced its prompts as one blob (SC 1.3.1).** Dumping the
accessibility tree from the device showed Flutter had merged the loose labels
in the logger card into a single node:

```
"What are you feeling?\nSeverity\nMild\nSevere"   <- one node, read before any control
"Pain"  "Dizziness"  "Nausea"  ...                <- the chips it describes
```

So a screen reader read all four prompts together, ahead of and detached from
the controls they label. Fixed by wrapping each prompt in
`Semantics(container: true)` so it keeps its own node, putting the chip prompt
immediately before the chips and the slider's label immediately before the
slider.

---

## 5. Visual changes worth reviewing

The accessibility work is mostly invisible, but four changes alter the look and
should get a glance from the team before submission:

1. **Control outlines are now clearly visible.** Inputs, outlined buttons,
   symptom chips and the theme switch use `controlBorder` (a mid grey) instead
   of the near-invisible `border`. Card outlines and dividers are unchanged.
2. **Tinted chips and badges have darker (light theme) or lighter (dark theme)
   label text.** The pill background is untouched; only the label shifts.
3. **The calling screen's gradient is less saturated at the top** (alpha 0.9 →
   0.55), which was required for the status text to be legible on the amber
   contact colour.
4. **Auth screens now show real, focusable inputs** rather than static mockups
   of them.
5. **The amber contact's avatar now has dark initials** instead of white, and
   the calling screen's gradient is pre-composited rather than translucent, so
   it no longer takes its lightness from whatever is painted behind it.
6. **The bottom navigation bar is 16 px taller** (a 92 px floor instead of 76).
   "Medications" wrapped to two lines at phone widths once the real font
   loaded, and the bar was clipping the second line — see §4, *Found only on a
   device*.
7. **That tab now reads "Meds"** rather than "Medications", so the label fits
   its tab on one line at phone widths. The label is the tab's accessible name
   as well as its visible text, so both changed together and the screen reader
   still says exactly what the tab says (SC 2.5.3 Label in Name). The screen's
   own heading is unchanged at "Medications".

---

## 6. Verification and evidence

The accessibility suite asserts; it does not report. An earlier version of it
printed measurements and passed regardless, which meant a regression would have
been invisible. Every file below fails the build when the app stops conforming.

| File | Criteria | Checks |
|---|---|---|
| `test/accessibility/a11y_harness.dart` | shared harness | mounts all 13 screens at their real routes, in the real shell |
| `test/accessibility/contrast_test.dart` | SC 1.4.3 | every painted paragraph, both themes, plus 200% scale |
| `test/accessibility/semantics_test.dart` | SC 1.1.1, 1.3.1, 4.1.2 | roles, names, emoji leakage, duplicate names, headings, tab state |
| `test/accessibility/keyboard_and_targets_test.dart` | SC 2.1.1, 2.4.3, 2.4.7 + 48x48 | focusability, Tab traversal, focus visibility, modal behaviour, all four Flutter guidelines |
| `test/accessibility/text_scaling_test.dart` | SC 1.4.4 | 100/130/150/200% in both themes, and that text actually grows |
| `test/accessibility/status_messages_test.dart` | SC 4.1.3 | announcements and live regions |
| `test/unit/contrast_helpers_test.dart` | underpins SC 1.4.3 | exhaustive sweeps over the contrast helpers |

### Why the built-in guidelines are the floor, not the ceiling

Flutter's `AccessibilityGuideline` checks all pass, and are asserted per screen.
They are not sufficient on their own, and two gaps are worth recording:

- **`labeledTapTargetGuideline` accepts an emoji as a label.** It passed this
  app when the call button announced as "telephone receiver" and the send
  button as "upwards arrow". `semantics_test.dart` rejects any name that has no
  pronounceable word in it.
- **`MinimumTextContrastGuideline` locates text by matching a semantics label
  back to a widget** with `find.text(label)`. Because every card in this app
  merges its contents into one spoken sentence, that lookup finds nothing and
  the card's text is silently skipped — making the app more accessible to
  screen readers made it *less* visible to the contrast checker. So
  `contrast_test.dart` enumerates text from the render tree instead,
  rasterises the frame, and samples the colour actually painted around each
  paragraph. It found three real failures the guideline never reported.

### The measurement is itself tested

Each gate carries a control, because a detector that silently measures nothing
would make every passing test above worthless:

- a deliberately low-contrast widget must be caught, and a known-good one must
  measure ~21:1;
- a 20x20 button must fail the tap-target guideline;
- a deliberately overflowing layout must be caught;
- every screen must yield a non-zero number of measured paragraphs and at
  least two controls;
- an emoji-only label must be rejected and a real label accepted.

Three of these controls failed when first written and exposed bugs in the test
code rather than the app — a background sampler that discarded the background
whenever it resembled the text, clipped-away text being measured against the
pixels of whatever covered it, and paragraphs being counted twice. Each is
documented at the point of the fix.

**Current state:** `flutter analyze` clean, **606 tests passing**, line coverage
**98.90%** (1,795 of 1,815 lines), against a required floor of 75%.

```bash
flutter test --coverage
dart run tool/coverage_summary.dart --out=evidence/coverage-summary.txt
```

`tool/coverage_summary.dart` reads `coverage/lcov.info` and writes the
per-file table kept at `evidence/coverage-summary.txt`. It exits non-zero
below the floor, so the requirement is enforced rather than merely reported;
`--min=` moves the gate. It counts the `DA:` records itself instead of
trusting the `LF:`/`LH:` summary lines, so the total cannot disagree with the
detail, and it needs no `lcov`/`genhtml` install (neither ships on Windows).

Only `lib/main.dart` now sits below 98%: the uncovered lines are `main()`
itself — orientation setup and `runApp` — which no widget test executes and
every `integration_test/` run does.

Eleven tests were removed from `test/unit/theme_test.dart` after an audit of
the suite: they asserted the contrast helpers and the border/muted token
floors, and every one was a strict subset of `test/unit/contrast_helpers_test.dart`,
which sweeps all 256 greys, the full hue wheel and all four tint strengths
rather than a handful of spot values. Coverage was unchanged by the removal.

Representative output from the screen-reader evidence test:

```
controls: 110 | unlabelled: 0 | emoji-only: 0 | missing role: 0
```

## 7. Integration and end-to-end testing

Four layers, each checking something the one below it cannot.

| Layer | Runs on | What only it can check |
|---|---|---|
| `test/` — 606 tests | `flutter test`, synthetic 800×5000 surface | Widgets and screens in isolation; contrast by rasterising the frame |
| `integration_test/` — 40 tests | An emulator, real app | Workflows that cross screens, through the real router and shell |
| `.maestro/` — 5 flows | An emulator, installed APK | The platform accessibility tree, as TalkBack sees it |
| TalkBack pass (§8) | An emulator, screen reader on | What a person actually hears, in the order they hear it |

### Integration tests (`integration_test/`)

| File | Workflow |
|---|---|
| `e2e_harness.dart` | Shared: launches the real app, resets the seeded globals, addresses controls by accessible name |
| `medication_flow_test.dart` | Sign in → take a dose → both screens agree → undo it from a different tab → the missed-dose dialog |
| `symptom_flow_test.dart` | The logger form, including that submit is genuinely inert until a symptom is chosen |
| `messaging_flow_test.dart` | Open an unread thread, reply twice, leave and return; the call button |
| `navigation_flow_test.dart` | All six tabs, exactly-one-selected, positional hints, theme persistence, sign out |
| `accessibility_on_device_test.dart` | Guidelines, control names, the slider's increase action, live regions, 100/130/200% scaling |

The widget tests mount one screen at a time behind stub routes, so a test that
"navigates" from Today to Medications is really navigating to a stub. These
launch the real application, so state that fails to survive the trip actually
fails. Both of the device-only defects in §4 were found here.

Every interaction is driven by a control's accessible name rather than by the
text drawn on it — the same handle a screen reader uses, so a labelling
regression fails the test instead of quietly shipping.

**On `textContrastGuideline`.** Three of Flutter's four guidelines run here;
the contrast one does not, because on a device it rasterises the whole
semantics node and treats the extreme colours in that rectangle as foreground
and background. It reported "Scroll up" at 2.51:1 with a foreground of
`#4B5A76` — which is not the label colour at all, but exactly
`darkControlBorder #5D6F90` composited at 75% alpha over `darkSurface2
#141A27`, i.e. one anti-aliased pixel of the button's own outline. The label
is `#9EA8BD` on `#141A27` = **7.28:1**, and the border it actually sampled is
3.43:1, past the 3:1 SC 1.4.11 asks of a non-text control boundary. It also
reported "9 doses today" at 1.04:1 between two background colours, having
found no text in the rect at all. Both false. Contrast stays gated per painted
paragraph in `test/accessibility/contrast_test.dart`; all four guidelines still
run there.

```bash
flutter test integration_test -d <device-id>
```

### E2E flows (`.maestro/`)

Four critical user journeys plus one accessibility flow; see
`.maestro/README.md` for the detail.

| Flow | Covers |
|---|---|
| `01-record-a-dose` | Sign in → mark a dose taken → the other screen agrees |
| `02-missed-dose-confirmation` | The dialog names itself, hides what is behind it, cancel and confirm both work |
| `03-log-a-symptom` | Expand, choose, grade, submit, entry appears |
| `04-message-a-caregiver` | Read an unread thread, reply, return, unread cleared |
| `05-screen-reader-names` | Every control named; no emoji anywhere in the tree |

Maestro finds elements through Android's `AccessibilityNodeInfo` — the tree
TalkBack reads — which makes these an accessibility test whether written as one
or not: a control with no accessible name is a control Maestro cannot tap. On
Today all seven dose buttons read "I took this"; the flow taps
`"Mark Ropivacaine at 8:00 PM as taken"`, which exists only because the button
carries a name saying which dose it acts on.

This is a different tree from the one the Dart tests read.
`semantics_test.dart` inspects Flutter's own `SemanticsNode` objects inside the
framework; these have already crossed the engine boundary onto the platform. A
label can be right in the first and missing from the second. Two things the
device tree turned out to do:

- **Names arrive as label + hint joined by a comma** — a tab announces as
  `"Meds, Tab 2 of 6"`. Maestro matches the whole string as a regex, so
  the flows use the full announced name and therefore assert the hints too.
- **Text hidden from assistive technology is hidden from Maestro.** The
  progress card merges its contents, so `"2 of 9 taken"` is not an element but
  `"Today's medications: 2 of 9 taken, 22 percent complete"` is. Flow `02`
  uses the same property in reverse: once the confirm dialog is open,
  `scopesRoute` removes the screen behind it from the tree, so asserting the
  summary is *not* visible is a real modality check.

**The `E2E_SEMANTICS` flag.** Flutter publishes no accessibility tree to the
platform until something asks for one. TalkBack and VoiceOver ask; a UI
automation tool reads the same tree without triggering it. Before this flag
existed, the entire app was one blank `FlutterView` to Maestro — every label,
role and state invisible. `lib/main.dart` now calls
`SemanticsBinding.instance.ensureSemantics()` when built with
`--dart-define=E2E_SEMANTICS=true`. It stays off by default because keeping the
tree built costs work on every frame, and real users get it the moment their
screen reader is on.

```bash
flutter build apk --debug --dart-define=E2E_SEMANTICS=true
adb install -r build/app/outputs/flutter-apk/app-debug.apk
maestro test .maestro --debug-output .maestro/artifacts
```

**The emoji assertions were verified, not assumed.** Flow `05` leans on
`assertNotVisible` for nine emoji, and an assertion that can never fail is
worse than none. A control APK was built with `CTappable`'s `ExcludeSemantics`
removed so the glyphs *do* reach the tree, and `assertVisible: ".*🏠.*"`
passes against it while failing against the real build. Worth knowing if
repeating this: `maestro hierarchy` replaces non-ASCII with `?` when printing
to a Windows console, so the dump cannot confirm what is in the tree — matching
is unaffected.

---

## 8. Screen-reader testing

### TalkBack (Android) — done

Run on 2026-09-21 against the installed debug APK on an Android 17 (API 37)
emulator with TalkBack 17.0.0 switched on and touch exploration active. The app
was driven with TalkBack's own gestures — a single tap to move accessibility
focus, a double tap to activate — so it was exercised the way a TalkBack user
exercises it rather than through a back door that bypasses the screen reader.

The full transcript is committed at **`evidence/talkback-transcript.txt`** and
regenerated by `tool/talkback_walk.sh`. It records, for all eight screens,
every node TalkBack can stop on: its accessible name, its role and its state.

#### What the transcript is, and what it is not

Read it as **the input TalkBack speaks from, not a recording of TalkBack
speaking.** Release builds of TalkBack do not log utterance text, so there is
no speech log to capture. The script instead reads the platform accessibility
tree with `uiautomator dump` — `content-desc`, `hint`, `text` and the state
flags — which is the material TalkBack composes each utterance out of, and
formats one line per node.

So the transcript supports, as fact:

- every control has a non-empty accessible name (**0 unnamed of 129 nodes**);
- no name is emoji-only;
- roles and states (`selected`, `disabled`, `obscured`, `checked`) are present
  and correct;
- reading order, since the dump is in traversal order.

It does **not** establish the exact wording, pronunciation, pacing or
perceived verbosity of what is heard. Where §8 says something "reads as" or
"announced as", that is the tree's content, and phrasing is TalkBack's to
decide. The screen reader was genuinely running and genuinely driving the
navigation — a single tap to move accessibility focus, a double tap to
activate, which is why the walk needs TalkBack on to work at all — but the
text below came from the tree.

`tool/talkback_walk.sh` is run by hand. Nothing in `flutter test`, the
`integration_test/` suite or the Maestro run invokes it, and it is not gated
in CI; the committed transcript is a dated artefact of the run described here.
The automated, every-build guards on the same properties live in
`test/accessibility/semantics_test.dart` and `.maestro/flows/05-screen-reader-names.yaml`.

| | |
|---|---|
| Screens walked | 8 (Landing, Sign in, Today, Medications, Schedule, Symptoms, Messages, Account) |
| Nodes TalkBack can stop on | 129 |
| Controls with no accessible name | **0** |
| Controls named only by an emoji | **0** |

A representative stretch, from Today:

```
  3. [View    ] Today's medications: 2 of 9 taken, 22 percent complete
  7. [Button  ] Undo: mark Ropivacaine at 8:00 AM as not taken
  8. [View    ] Ropivacaine, 10 mg, due at 8:00 AM, taken
  9. [Button  ] Mark Ropivacaine at 8:00 PM as taken
 14. [Button  ] Voice input, Not available yet   - disabled
 16. [Button  ] Today, Tab 1 of 6   - selected
```

Each dose button says which dose it acts on, the disabled control says why it
is disabled rather than going silent, and the selected tab carries its
position and its state.

#### What the pass found

**One defect, now fixed.** The *next appointment* card on Today had no
`Semantics` wrapper, so Flutter merged its children and TalkBack read:

> Dr. Chen — Follow-up / Today at 2:30 PM · 45 min / **2:30 PM**

The trailing time chip repeats a time the line above has already given. The
equivalent card on the Schedule screen was already spelled out as a single
sentence; Today's now matches it, and reads:

> Dr. Chen — Follow-up. Today at 2:30 PM, 45 min

Fixed in `lib/screens/today_screen.dart`; guarded by two tests in
`test/widget/today_screen_test.dart`, one pinning the exact sentence and one
asserting the time appears in it exactly once. Re-verified on the device.

**One thing that looked like a defect and was not.** Both sign-in fields
reach Android with an empty `content-desc`, which at first reading meant two
unlabelled form controls (SC 4.1.2). They are not. Flutter maps a text field's
label onto `AccessibilityNodeInfo.setHintText()`, not the content description,
because on Android the *value* owns `text` and the *label* owns `hint` — and
`hint` is what TalkBack speaks as the field's name:

```
  4. [EditText] Email address   - value "maddy@example.com"
  6. [EditText] Password        - obscured
```

Worth recording because any tool that reads only `content-desc` — including
the first version of the walk script — will report a false failure here.

#### Observations left as they are

- **`Dark mode` is announced next to `Appearance: Dark mode`** on Account: the
  switch and the row that contains it are separate stops, so the mode is said
  twice in quick succession. Both are correct and the state is unambiguous
  (`Dark mode, switch, on`), so this was left alone rather than restructuring
  a working tile.
#### Still not covered by this pass

Two things named earlier as worth listening for were **not** reached, and no
claim is made about them:

- **The severity slider.** The walk expands nothing, so it stopped at
  `Log a symptom, Collapsed. Activate to expand` and the slider never entered
  the tree. The predicted `Severity 3 of 5, Severity 3 of 5` — Material's
  `Slider` feeding `label` to both the value bubble and the semantics label
  while `semanticFormatterCallback` supplies the same words as the value — is
  still a reading of the source, not something heard.
- **Live-region chatter when several doses are marked in quick succession.**
  The walk never marks a dose, so whether the summaries queue or talk over one
  another is untested. `status_messages_test.dart` proves the announcement
  fires; it cannot prove how it sounds three times in two seconds.

### VoiceOver (iOS) — not run

No macOS host or iOS device is available to this project, and neither the iOS
Simulator nor VoiceOver can run on Windows. The assignment asks for VoiceOver
"when available"; it is not, and nothing here should be read as claiming
otherwise.

What partially stands in for it, and what does not:

- The semantics tree the widget and integration tests assert is the same tree
  that feeds **both** platforms — `Semantics.label`, `hint`, `button`,
  `selected`, `toggled`, `liveRegion`, `scopesRoute`, `namesRoute` are
  platform-neutral, and every one is asserted in `test/accessibility/`.
  A control that is unnamed on iOS would be unnamed in those tests too.
- What that cannot tell us is the part the TalkBack pass was needed for on
  Android: how the engine maps those nodes onto the *platform's* API, and how
  the platform's screen reader then phrases them. The `hint`-versus-
  `content-desc` finding above is exactly that class of difference, and
  VoiceOver has its own — notably that it reads `Semantics.value` and
  `increasedValue`/`decreasedValue` for adjustable controls, which is where
  the severity slider's phrasing would need re-checking first.

The honest summary: **the app is verified against a real screen reader on
Android and against the shared semantics tree on both platforms, but has not
been heard on iOS.**

### Re-running the TalkBack pass

```bash
flutter build apk --debug --dart-define=E2E_SEMANTICS=true
adb install -r build/app/outputs/flutter-apk/app-debug.apk
bash tool/talkback_walk.sh          # enables nothing; expects TalkBack already on
```

Switch TalkBack on first:

```bash
adb shell settings put secure enabled_accessibility_services \
  com.google.android.marvin.talkback/com.google.android.marvin.talkback.TalkBackService
adb shell settings put secure accessibility_enabled 1
```

and off again with `adb shell settings delete secure enabled_accessibility_services`
(an empty string is rejected as a bad argument). Turn it off before running
Maestro: with TalkBack on, a single tap only moves focus, so every flow that
taps a control would fail.

Two traps worth knowing, both of which produced wrong answers before they were
understood:

- **Python writes CP1252 on a Windows console**, which silently turned every
  em-dash in the captured labels into `0x97`. `PYTHONIOENCODING=utf-8` fixes
  it. The same class of problem as the `maestro hierarchy` note in §7 — and in
  both cases the corruption is in the *capture*, never in the app.
- **`adb shell cat` round-trips through that console too**, so the script
  `adb pull`s the dump instead of `cat`-ing it.
