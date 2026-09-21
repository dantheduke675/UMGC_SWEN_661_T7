#!/usr/bin/env bash
# Walks CareConnect with TalkBack switched on and records, screen by screen,
# what TalkBack has to read: each node's announced name, the role it reports
# and the state it carries. Driven with TalkBack's own gestures (single tap to
# move accessibility focus, double tap to activate), so the app is exercised
# the way a TalkBack user exercises it rather than through a back door.
set -u
export PATH="$PATH:/c/Users/raven/AppData/Local/Android/Sdk/platform-tools"
export MSYS_NO_PATHCONV=1
export PYTHONIOENCODING=utf-8

OUT="${OUT:-talkback-transcript.txt}"
TMP=./tbdump.xml
PKG=com.example.care_connect_flutter_frontend

dump() {
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  # Pulled rather than `adb shell cat`: cat round-trips through the Windows
  # console, which replaces every non-ASCII byte with "?" and would corrupt
  # the em-dashes and middle dots inside the labels we are here to read.
  rm -f "$TMP"; adb pull /sdcard/ui.xml "$TMP" >/dev/null 2>&1
}

# Centre of the first node whose name matches $1; $2 optionally pins the class.
center() {
  python - "$1" "${2:-}" <<'PY'
import re,sys,io
want, cls = sys.argv[1], sys.argv[2]
x=io.open('tbdump.xml',encoding='utf-8',errors='replace').read()
for n in re.findall(r'<node[^>]*>', x):
    if 'package="com.example' not in n: continue
    g=lambda k:(re.search(k+r'="([^"]*)"',n).group(1) if re.search(k+r'="([^"]*)"',n) else '')
    if cls and not g('class').endswith(cls): continue
    name = g('content-desc') or g('text') or g('hint')
    b=re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', n)
    if name and b and re.search(want, name):
        x1,y1,x2,y2=map(int,b.groups()); print((x1+x2)//2,(y1+y2)//2); break
PY
}

# Clears any system dialog (TalkBack likes to ask about notifications) and
# makes sure CareConnect is the window in front before the tree is read.
ensure_app() {
  for _ in 1 2 3; do
    local f; f=$(adb shell dumpsys window 2>/dev/null | grep -m1 mCurrentFocus)
    case "$f" in
      *com.example.care_connect*) return 0 ;;
      *ermission*) adb shell input keyevent KEYCODE_BACK; sleep 1.5 ;;
      *) adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 \
           >/dev/null 2>&1; sleep 4 ;;
    esac
  done
}

# TalkBack: tap once to move accessibility focus, double tap to activate.
activate() {
  ensure_app; dump
  local c; c=$(center "$1" "${2:-}")
  if [ -z "$c" ]; then echo "  !! not found: $1" >&2; return 1; fi
  set -- $c
  adb shell input tap "$1" "$2"; sleep 1.2
  adb shell input tap "$1" "$2"; sleep 0.15; adb shell input tap "$1" "$2"
  sleep 2.5; ensure_app
}

# Records every node on the current screen that TalkBack can stop on.
record() {
  ensure_app; dump
  {
    echo
    echo "── $1 ──────────────────────────────────────────────────────────────"
    python - <<'PY'
import re,io,html
x=io.open('tbdump.xml',encoding='utf-8',errors='replace').read()
rows, unnamed = [], 0
for n in re.findall(r'<node[^>]*>', x):
    if 'package="com.example' not in n: continue
    g=lambda k:(re.search(k+r'="([^"]*)"',n).group(1) if re.search(k+r'="([^"]*)"',n) else '')
    cls=g('class').rsplit('.',1)[-1]
    if cls in ('FrameLayout','LinearLayout'): continue
    desc, txt, hint = g('content-desc'), g('text'), g('hint')
    # An editable field is named by its Android hint; everything else by its
    # content description. Value, where there is one, is spoken after the name.
    name = desc or hint or txt
    if not name:
        if g('focusable')=='true' and g('class').endswith(('Button','EditText','Switch')):
            unnamed += 1
        continue
    state=[]
    if cls=='EditText' and txt: state.append('value "%s"' % txt)
    if g('checked')=='true': state.append('checked')
    if g('selected')=='true': state.append('selected')
    if g('password')=='true': state.append('obscured')
    if g('enabled')!='true': state.append('disabled')
    # Labels carry real newlines; show them so a multi-line announcement
    # reads as the sequence of pauses TalkBack actually speaks.
    name = html.unescape(name).replace(chr(10), ' / ')
    rows.append((name, cls, '; '.join(state)))
for i,(name,role,state) in enumerate(rows,1):
    print('%3d. [%-8s] %s%s' % (i, role, name, ('   - ' + state) if state else ''))
print('\n    %d nodes TalkBack can stop on; %d unnamed control(s)' % (len(rows), unnamed))
# A screen that captured nothing would otherwise report "0 unnamed", which is
# vacuously true and reads as a pass. An empty capture means the app was not
# in front, not that the app is clean — so say so. The smallest real screen
# here (Landing) has 5 nodes.
if len(rows) < 5:
    print('    *** CAPTURE FAILED - only %d node(s); the app was probably not'
          ' in front. This screen is not evidence of anything.' % len(rows))
PY
  } >> "$OUT"
  if tail -20 "$OUT" | grep -q 'CAPTURE FAILED'; then
    echo "  !! $1: captured nothing" >&2
    FAILURES=$((FAILURES + 1))
  fi
}

FAILURES=0
: > "$OUT"
{
  echo "TalkBack traversal transcript - CareConnect (Flutter)"
  echo "Captured $(date -u '+%Y-%m-%d %H:%M UTC') - Android $(adb shell getprop ro.build.version.release | tr -d '\r') (API $(adb shell getprop ro.build.version.sdk | tr -d '\r')) - emulator-5554"
  echo "TalkBack: $(adb shell settings get secure enabled_accessibility_services | tr -d '\r')"
  echo "$(adb shell dumpsys accessibility | grep -o 'touchExplorationEnabled=[a-z]*' | head -1)"
  echo
  echo "Each numbered line is one stop on TalkBack's traversal, in traversal order:"
  echo "the node's accessible name, its role, and its state. Text fields are named"
  echo "by their Android hint, which is where Flutter puts a field's label and what"
  echo "TalkBack reads as the field's name."
  echo
  echo "SOURCE: the platform accessibility tree (uiautomator dump) -- the material"
  echo "TalkBack composes speech FROM, not a recording of TalkBack speaking."
  echo "Release TalkBack does not log utterance text, so no speech log exists."
  echo "This establishes that every control has a name, a role and correct state,"
  echo "and the order they are reached in. It does not establish exact wording,"
  echo "pacing or perceived verbosity. TalkBack was running and drove the"
  echo "navigation (tap to focus, double-tap to activate); the text below is the"
  echo "tree's, and the phrasing of it is TalkBack's."
} > "$OUT"

echo "walking..."
record "Landing"
activate "^Sign in$" Button      && record "Sign in - password"
activate "^Sign in$" Button      && record "Today"
activate "^Meds" Button          && record "Medications"
activate "^Schedule" Button      && record "Schedule"
activate "^Symptoms" Button      && record "Symptoms"
activate "^Messages" Button      && record "Messages"
activate "^Account" Button       && record "Account"
if [ "$FAILURES" -gt 0 ]; then
  echo "FAILED: $FAILURES screen(s) captured nothing - the transcript is NOT valid evidence" >&2
  exit 1
fi
echo "done -> $OUT"
