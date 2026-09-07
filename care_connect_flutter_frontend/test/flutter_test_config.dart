import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

/// Runs once for every test file under this directory (Flutter picks this
/// file up automatically). Ensures the widgets binding exists before any
/// test body runs — needed because `theme_test.dart` calls `buildTheme()`,
/// which invokes `GoogleFonts.interTextTheme`, from plain `test()` blocks
/// (no `testWidgets()` to initialize the binding implicitly).
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Skip the network fetch outright instead of letting it fail against a
  // sandboxed/offline test runner — same failure, but instant and without a
  // real DNS/socket attempt. The failure is still reported via a noisy
  // `debugPrint` from a fire-and-forget future; see `googleFontsNoiseFilter`
  // in test/helpers/test_helpers.dart for how that's silenced where it
  // actually surfaces (plain `test()` bodies, not `testWidgets()` ones).
  GoogleFonts.config.allowRuntimeFetching = false;

  await testMain();
}
