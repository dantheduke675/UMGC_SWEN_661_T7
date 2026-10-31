import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

/// Runs once for every test file under this directory (Flutter picks this
/// file up automatically). Ensures the widgets binding exists before any
/// test body runs — needed because `theme_test.dart` calls `buildTheme()`,
/// which invokes `GoogleFonts.interTextTheme`, from plain `test()` blocks
/// (no `testWidgets()` to initialize the binding implicitly).
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  _QuietGoogleFontsBinding();

  // Skip the network fetch outright instead of letting it fail against a
  // sandboxed/offline test runner — same failure, but instant and without a
  // real DNS/socket attempt. Text falls back to the test font either way.
  GoogleFonts.config.allowRuntimeFetching = false;

  await testMain();
}

/// The standard test binding, except that it drops the "unable to load font"
/// report google_fonts prints for every font it is not allowed to fetch.
///
/// The binding checks after each `testWidgets()` that [debugPrint] still
/// equals [debugPrintOverride], so the filter has to be installed here rather
/// than by reassigning [debugPrint] directly.
class _QuietGoogleFontsBinding extends AutomatedTestWidgetsFlutterBinding {
  @override
  DebugPrintCallback get debugPrintOverride => _printUnlessGoogleFontsNoise;
}

void _printUnlessGoogleFontsNoise(String? message, {int? wrapWidth}) {
  if (message != null && _isGoogleFontsNoise(message)) return;
  debugPrintSynchronously(message, wrapWidth: wrapWidth);
}

bool _isGoogleFontsNoise(String message) {
  final text = message.trimLeft();
  return text.startsWith('Error: google_fonts was unable to load font') ||
      text.startsWith('There is likely something wrong with your test.');
}
