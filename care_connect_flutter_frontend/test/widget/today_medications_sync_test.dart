import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:care_connect_flutter_frontend/main.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import 'package:care_connect_flutter_frontend/widgets.dart';

// Locates the "I took this" button within the single medication card that
// contains [medName] — both Lisinopril and Atorvastatin have exactly one
// dose slot, so their name text appears on exactly one card.
Finder _takeButtonFor(String medName) {
  final card = find.ancestor(of: find.text(medName), matching: find.byType(Container)).first;
  return find.descendant(of: card, matching: find.textContaining('I took this'));
}

void main() {
  testWidgets(
    'marking a dose taken on one screen shows it taken on the other, with the same med list',
    (tester) async {
      tester.view.physicalSize = const Size(800, 2000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(
        ChangeNotifierProvider(
          create: (_) => ThemeNotifier(),
          child: const CareConnectApp(),
        ),
      );
      await tester.pumpAndSettle();

      // Landing -> sign in -> today.
      await tester.tap(find.widgetWithText(AuthBtn, 'Sign in'));
      await tester.pumpAndSettle();
      await tester.tap(find.widgetWithText(AuthBtn, 'Sign in'));
      await tester.pumpAndSettle();

      // Today shows the full medication list, matching Medications — including
      // doses that used to be cut off by Today's old "first 4" limit.
      expect(find.text('Atorvastatin'), findsOneWidget);

      // Mark Lisinopril taken on Today.
      await tester.tap(_takeButtonFor('Lisinopril'));
      await tester.pump();
      await tester.pump(const Duration(seconds: 6)); // flush the undo-toast timer

      // Switch to Medications: Lisinopril should already show as taken.
      await tester.tap(find.text('Medications'));
      await tester.pumpAndSettle();
      expect(find.descendant(
        of: find.ancestor(of: find.text('Lisinopril'), matching: find.byType(Container)).first,
        matching: find.textContaining('✓ Taken'),
      ), findsWidgets);

      // Now mark Atorvastatin taken here, on Medications...
      await tester.tap(_takeButtonFor('Atorvastatin'));
      await tester.pump();
      await tester.pump(const Duration(seconds: 6));

      // ...and confirm it shows taken back on Today.
      await tester.tap(find.text('Today'));
      await tester.pumpAndSettle();
      expect(find.descendant(
        of: find.ancestor(of: find.text('Atorvastatin'), matching: find.byType(Container)).first,
        matching: find.textContaining('✓ Taken'),
      ), findsWidgets);
    },
  );
}
