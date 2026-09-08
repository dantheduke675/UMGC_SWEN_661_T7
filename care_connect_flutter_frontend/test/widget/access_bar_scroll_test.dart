import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:care_connect_flutter_frontend/main.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import 'package:care_connect_flutter_frontend/widgets.dart';

void main() {
  testWidgets('scroll down button in access bar actually scrolls the tab content', (tester) async {
    tester.view.physicalSize = const Size(800, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => ThemeNotifier(),
        child: const CareConnectApp(),
      ),
    );
    await tester.pumpAndSettle();

    // Landing -> sign in -> today (inside the tab shell with the access bar).
    await tester.tap(find.widgetWithText(AuthBtn, 'Sign in'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(AuthBtn, 'Sign in'));
    await tester.pumpAndSettle();

    // Now shrink the viewport so the Today tab's content overflows and needs scrolling.
    tester.view.physicalSize = const Size(800, 420);
    await tester.pumpAndSettle();

    expect(find.text('↓'), findsOneWidget);

    final scrollController = Provider.of<ScrollController>(
      tester.element(find.text('↓')),
      listen: false,
    );
    expect(scrollController.hasClients, isTrue,
        reason: 'the Today tab ListView should be attached to the shared controller');
    final before = scrollController.offset;

    await tester.tap(find.text('↓'));
    await tester.pumpAndSettle();

    final after = scrollController.offset;
    expect(after, greaterThan(before),
        reason: 'tapping the scroll-down button should scroll the tab content down');

    await tester.tap(find.text('↑'));
    await tester.pumpAndSettle();

    final afterUp = scrollController.offset;
    expect(afterUp, lessThan(after),
        reason: 'tapping the scroll-up button should scroll the tab content back up');
  });
}
