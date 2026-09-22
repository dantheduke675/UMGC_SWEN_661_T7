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
# Not TMP: that name is already exported on Windows, and reassigning it
# hands every child process -- Maestro's JVM included -- a temp directory
# of ./tbdump.xml, which turns the dump path into a directory.
TREE=./tbdump.xml
PKG=com.example.care_connect_flutter_frontend
# Stands in for uiautomator on screens it cannot dump; see dump_maestro.
MAESTRO="${MAESTRO:-$HOME/.maestro/bin/maestro}"
READER=""

# Reads the platform accessibility tree into $TREE and leaves the name of the
# reader that produced it in $READER.
#
# `uiautomator dump` waits for the window to go idle and EXITS 0 EVEN WHEN THAT
# WAIT TIMES OUT, having written nothing. So the device-side file is deleted
# first and a non-empty pull is what counts as success. Without that check a
# screen that cannot be dumped silently leaves the previous screen's file in
# place, and the transcript records one screen's nodes under another screen's
# heading -- wrong evidence that looks exactly like right evidence.
dump() {
  READER="uiautomator dump"
  adb shell rm -f /sdcard/ui.xml >/dev/null 2>&1
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  # Pulled rather than `adb shell cat`: cat round-trips through the Windows
  # console, which replaces every non-ASCII byte with "?" and would corrupt
  # the em-dashes and middle dots inside the labels we are here to read.
  rm -f "$TREE"; adb pull /sdcard/ui.xml "$TREE" >/dev/null 2>&1
  [ -s "$TREE" ] && return 0
  dump_maestro
}

# Fallback for a window that never goes idle. The Face ID sign-in screen spins
# a CircularProgressIndicator for as long as it is on screen, driven by
# Flutter's own ticker, so uiautomator can never dump it -- not on a retry, and
# not with Android's animator scale at 0, because that scale does not reach
# Flutter's ticker.
#
# Maestro reads the same source -- the platform accessibility tree, via
# AccessibilityNodeInfo -- but does not require the window to stop moving. Its
# JSON is normalised here into the node shape the parsers below already expect,
# so one reader can stand in for the other without touching them. Only the
# app's own nodes are kept: the subtree under `android:id/content`, which drops
# the systemui status bar that Maestro also returns.
#
# Maestro exposes no `password` flag, so a field that TalkBack would announce
# as obscured is not marked as such on a screen read this way. record() prints
# the reader per screen so that is visible rather than assumed.
dump_maestro() {
  # Relative, like $TREE: python here is Windows python, which reads an MSYS
  # path such as /tmp/x as a drive-relative one, so bash would see the file
  # and python would not.
  local json="./tb-hierarchy.json"
  rm -f "$json" "$TREE"
  JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8" "$MAESTRO" hierarchy > "$json" 2>/dev/null || true
  [ -s "$json" ] || return 1
  python - "$json" "$TREE" <<'MAESTRO_PY' || return 1
import json, io, sys, html
src, dst = sys.argv[1], sys.argv[2]
tree = json.load(io.open(src, encoding='utf-8'))

def find_content(n):
    a = n.get('attributes') or {}
    if a.get('resource-id') == 'android:id/content':
        return n
    for c in n.get('children') or []:
        hit = find_content(c)
        if hit is not None:
            return hit
    return None

root = find_content(tree)
if root is None:
    sys.exit(1)

# uiautomator names the accessible name `content-desc` and the field label
# `hint`; Maestro calls them `accessibilityText` and `hintText`. `focusable` is
# not exposed, and `clickable` is what the unnamed-control count actually needs.
rows = []
def walk(n):
    a = n.get('attributes') or {}
    rid = a.get('resource-id') or ''
    if rid.startswith('com.android.systemui:'):
        return
    e = lambda v: html.escape(v or '', quote=True)
    rows.append(
        '<node class="%s" content-desc="%s" text="%s" hint="%s" bounds="%s" '
        'clickable="%s" focusable="%s" enabled="%s" checked="%s" '
        'selected="%s" package="com.example.care_connect_flutter_frontend" >' % (
            e(a.get('class')), e(a.get('accessibilityText')), e(a.get('text')),
            e(a.get('hintText')), e(a.get('bounds')), e(a.get('clickable')),
            e(a.get('clickable')), e(a.get('enabled')), e(a.get('checked')),
            e(a.get('selected'))))
    for c in n.get('children') or []:
        walk(c)
walk(root)
io.open(dst, 'w', encoding='utf-8').write(
    '<?xml version="1.0" encoding="UTF-8"?>\n<hierarchy>\n%s\n</hierarchy>\n'
    % '\n'.join(rows))
MAESTRO_PY
  rm -f "$json"
  [ -s "$TREE" ] || return 1
  READER="maestro hierarchy"
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
  ensure_app
  if ! dump; then echo "  !! could not read the tree before: $1" >&2; return 1; fi
  local c; c=$(center "$1" "${2:-}")
  if [ -z "$c" ]; then echo "  !! not found: $1" >&2; return 1; fi
  set -- $c
  adb shell input tap "$1" "$2"; sleep 1.2
  adb shell input tap "$1" "$2"; sleep 0.15; adb shell input tap "$1" "$2"
  sleep 2.5; ensure_app
}

# Records every node on the current screen that TalkBack can stop on.
record() {
  ensure_app
  if ! dump; then
    echo "  !! $1: could not read the tree" >&2
    FAILURES=$((FAILURES + 1))
    { echo; echo "── $1 ──────────────────────────────────────────────────────────────"
      echo "    *** NOT CAPTURED - no reader could read this screen's tree."
    } >> "$OUT"
    return 1
  fi
  {
    echo
    echo "── $1 ──────────────────────────────────────────────────────────────"
    python - "$READER" <<'PY'
import re,io,html,sys
reader = sys.argv[1]
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
# Which reader produced this screen's tree. Both read the same platform
# accessibility tree; they differ in whether they insist the window be idle,
# and maestro does not expose the password flag, so an obscured field would
# not be marked as such on a screen read that way.
if reader and reader != 'uiautomator dump':
    print('    read with `%s` - uiautomator cannot dump this screen, whose' % reader)
    print('    progress spinner never lets the window go idle. There is no')
    print('    password field here, which is the one state this reader omits.')
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
  echo "SOURCE: the platform accessibility tree -- the material TalkBack"
  echo "composes speech FROM, not a recording of TalkBack speaking. It is read"
  echo "with uiautomator dump, except where a screen animates without pause and"
  echo "uiautomator can never see an idle window; those are read with maestro"
  echo "hierarchy, off the same tree, and each screen below says which was used."
  echo "Release TalkBack does not log utterance text, so no speech log exists."
  echo "This establishes that every control has a name, a role and correct state,"
  echo "and the order they are reached in. It does not establish exact wording,"
  echo "pacing or perceived verbosity. TalkBack was running and drove the"
  echo "navigation (tap to focus, double-tap to activate); the text below is the"
  echo "tree's, and the phrasing of it is TalkBack's."
} > "$OUT"

# Start from the launch route. appRouter is a top-level singleton whose
# location survives, so the app is restarted rather than assumed to still be
# where the previous run left it.
adb shell am force-stop "$PKG" >/dev/null 2>&1; sleep 1
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
sleep 6

echo "walking..."
record "Landing"
# Sign-up path first: Create account -> pick a role -> the two Face ID screens,
# which is the route a new care recipient is actually walked down. The Face ID
# sign-in screen then offers the password fallback, which lands on the same
# sign-in screen the returning-user path reaches, so the walk rejoins here.
activate "^Create account$" Button          && record "Create account"
activate "^Care recipient$" Button          && record "Face ID setup"
activate "^Yes, use Face ID$" Button        && record "Face ID sign-in"
activate "^Use my password instead$" Button && record "Sign in - password"
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
