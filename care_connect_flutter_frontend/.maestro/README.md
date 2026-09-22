# End-to-end flows (Maestro)

Five flows that drive the installed Android app the way a person would:
four critical user journeys and one that checks what the app tells a screen
reader. Each is a YAML file under `flows/`; `subflows/sign-in.yaml` is the
shared entry point every flow runs first, so it is not counted as a flow of
its own and is excluded from the workspace glob.

| Flow | What it covers |
|---|---|
| `01-record-a-dose` | Sign in → mark a dose taken on Today → the same dose shows taken on Medications |
| `02-missed-dose-confirmation` | The confirmation dialog: names itself, hides the screen behind it, cancel and confirm both work |
| `03-log-a-symptom` | The symptom form: expand, choose, grade, submit, and the entry appears |
| `04-message-a-caregiver` | Open an unread thread, reply, return, and the unread state has cleared |
| `05-screen-reader-names` | Not a journey: walks the app asserting every control is named, and no emoji is |

## Why these run against the accessibility tree

Maestro finds elements through Android's `AccessibilityNodeInfo` tree — the
same tree TalkBack reads. That makes these flows an accessibility test
whether or not they are written as one: a control with no accessible name is
a control Maestro cannot tap.

The flows lean on that deliberately. On the Today screen all seven dose
buttons read **"I took this"**; the flow taps

```yaml
- tapOn: "Mark Ropivacaine at 8:00 PM as taken"
```

which exists only because the button carries an accessible name that says
which dose it acts on (WCAG 2.1 SC 4.1.2). If that name regresses, the flow
fails rather than the app quietly becoming unusable with a screen reader.

This is a different tree from the one the Dart tests inspect.
`test/accessibility/semantics_test.dart` reads Flutter's own `SemanticsNode`
objects inside the framework; everything here has already crossed the engine
boundary onto the platform. A label can be right in the first and missing
from the second.

### Two things the tree turned out to do

**Names arrive as label + hint, joined by a comma.** A tab announces as
`"Meds, Tab 2 of 6"`, not `"Meds"`, and the missed-dose button
as `"Mark … as missed, Asks you to confirm"`. Maestro matches the *whole*
string as a regex, so the flows use the full announced name — which means
they assert the hints as well.

**Text hidden from assistive technology is hidden from Maestro too.** The
progress card merges its contents into one label, so `"2 of 9 taken"` is not
an element; `"Today's medications: 2 of 9 taken, 22 percent complete"` is.
Flow `02` relies on the same thing in reverse: once the confirm dialog is
open, `scopesRoute` removes the screen behind it from the tree entirely, so
asserting the summary is *not* visible is a real modality check.

## Running them

The app must be built with semantics turned on:

```bash
flutter build apk --debug --dart-define=E2E_SEMANTICS=true
adb install -r build/app/outputs/flutter-apk/app-debug.apk

maestro test .maestro --debug-output .maestro/artifacts
```

`--debug-output` collects the screenshots, the command log and a hierarchy
dump per step into one directory; without it Maestro scatters them under
`~/.maestro/tests/<timestamp>/`.

### The `E2E_SEMANTICS` flag

Flutter does not publish an accessibility tree to the platform until
something asks for one. TalkBack and VoiceOver ask, and the tree appears —
but a UI automation tool reads that same tree without triggering it. Without
the flag the whole app is one blank `FlutterView` to Maestro: every label,
role and state invisible. `lib/main.dart` calls
`SemanticsBinding.instance.ensureSemantics()` when the flag is set, which is
what makes these flows meaningful. It is off by default because keeping the
tree built costs work on every frame, and real users get it the moment their
screen reader is on.

## Checking the checks

The `assertNotVisible` lines on emoji are the load-bearing part of flow `05`,
and an assertion that can never fail is worse than none. They were verified
by building a control APK with `CTappable`'s `ExcludeSemantics` removed, so
the glyphs *do* reach the tree, and confirming that
`assertVisible: ".*🏠.*"` passes against it. It does; against the real build
it does not. The emoji survive the trip from YAML through Maestro's matcher
intact.

Worth knowing if you try to repeat this: `maestro hierarchy` mangles
non-ASCII characters to `?` when it prints to a Windows console, so the dump
cannot be used to confirm what is really in the tree. Matching is unaffected
— `tapOn: "Cancel — go back"` finds its element.

## Where this sits

| Layer | Runs on | Checks |
|---|---|---|
| `test/` (606 tests) | `flutter test`, synthetic surface | Widgets and screens in isolation; contrast by rasterising |
| `integration_test/` (40 tests) | a device, real app | Workflows across screens, real router and shell |
| `.maestro/` (5 flows) | a device, installed APK | The platform accessibility tree, as TalkBack sees it |
| `tool/talkback_walk.sh` | a device, TalkBack on | What a person actually hears — see `ACCESSIBILITY.md` §8 |

Turn TalkBack **off** before running Maestro. With it on, a single tap only
moves accessibility focus, so every flow that taps a control fails.
