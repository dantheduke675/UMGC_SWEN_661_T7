import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/data.dart';
import 'package:care_connect_flutter_frontend/screens/medications_screen.dart';
import 'package:care_connect_flutter_frontend/screens/msg_thread_screen.dart';
import 'package:care_connect_flutter_frontend/screens/symptoms_screen.dart';
import 'package:care_connect_flutter_frontend/screens/today_screen.dart';
import 'package:care_connect_flutter_frontend/widgets.dart';
import '../helpers/test_helpers.dart';

// A control by the name a screen reader (or voice control) uses for it
Finder byAccessibleName(String name) => find.byWidgetPredicate(
      (w) => w is CTappable && w.label == name,
      description: 'control named "$name"',
    );

// slotStatuses is shared, process-wide state, so each test picks a dose no
// other test has touched yet rather than a fixed one
MedSlot untouchedSlot() =>
    buildSlots().firstWhere((s) => (slotStatuses[s.key] ?? SlotStatus.none) == SlotStatus.none);

// The undo sheet's per-action button (the floating button behind it also says "Undo")
final undoInSheet = find.byWidgetPredicate(
  (w) => w is Text && w.data == 'Undo' && w.style?.color != Colors.white,
);

Future<void> tapVisible(WidgetTester tester, Finder finder) async {
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

void main() {
  group('Undoing from the history sheet', () {
    testWidgets('undoing "unmarked as taken" on Today marks the dose taken again', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const TodayScreen()));
      final slot = buildSlots()
          .take(4) // the doses Today shows
          .firstWhere((s) => (slotStatuses[s.key] ?? SlotStatus.none) == SlotStatus.none);

      await tapVisible(tester, byAccessibleName('I took this: ${slot.med.name} at ${slot.time}'));
      await tapVisible(tester, byAccessibleName('Taken, tap to undo: ${slot.med.name} at ${slot.time}'));
      expect(slotStatuses[slot.key], SlotStatus.none);

      await tester.tap(find.text('↺'));
      await tester.pumpAndSettle();
      // Both actions are listed, newest first, with a divider between them
      expect(find.text('Unmarked ${slot.med.name} (${slot.time}) as taken'), findsOneWidget);
      expect(find.byType(Divider), findsWidgets);
      await tester.tap(undoInSheet.first);
      await tester.pumpAndSettle();

      expect(slotStatuses[slot.key], SlotStatus.taken);
    });

    testWidgets('undoing "unmarked as taken" on Medications marks the dose taken again', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen()));
      final slot = untouchedSlot();

      await tapVisible(tester, byAccessibleName('I took this: ${slot.med.name} at ${slot.time}'));
      await tapVisible(tester, byAccessibleName('Taken, tap to undo: ${slot.med.name} at ${slot.time}'));
      await tester.tap(find.text('↺'));
      await tester.pumpAndSettle();
      await tester.tap(undoInSheet.first);
      await tester.pumpAndSettle();

      expect(slotStatuses[slot.key], SlotStatus.taken);
    });

    testWidgets('undoing "marked as missed" puts the dose back to how it was', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen()));
      final slot = untouchedSlot();

      await tapVisible(tester, byAccessibleName('I missed this: ${slot.med.name} at ${slot.time}'));
      await tester.tap(find.text('Yes, I missed this dose'));
      await tester.pumpAndSettle();
      expect(slotStatuses[slot.key], SlotStatus.missed);

      await tester.tap(find.text('↺'));
      await tester.pumpAndSettle();
      await tester.tap(undoInSheet.first);
      await tester.pumpAndSettle();

      expect(slotStatuses[slot.key] ?? SlotStatus.none, SlotStatus.none);
    });
  });

  group('Input', () {
    testWidgets('dragging the severity slider changes the severity that is logged', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));
      await tester.tap(find.text('Log a symptom'));
      await tester.pumpAndSettle();
      final slider = find.byType(Slider);
      expect(tester.widget<Slider>(slider).value, 3, reason: 'starts at the default');

      await tester.ensureVisible(slider);
      await tester.pumpAndSettle();
      // From the centre by the full width: to the far end
      await tester.drag(slider, Offset(tester.getSize(slider).width, 0));
      await tester.pumpAndSettle();
      expect(tester.widget<Slider>(slider).value, 5);
      expect(find.bySemanticsLabel(RegExp('Severity 5 of 5')), findsWidgets);
    });

    testWidgets('pressing the keyboard\'s send key sends the message', (tester) async {
      await pumpScreen(
        tester,
        buildTestApp(child: const Scaffold(body: MsgThreadScreen(threadId: 1))),
      );
      final before = threadById(1).messages.length;

      await tester.enterText(find.byType(TextField), 'Sent from the keyboard');
      await tester.testTextInput.receiveAction(TextInputAction.send);
      await tester.pumpAndSettle();

      expect(threadById(1).messages.length, before + 1);
      expect(threadById(1).messages.last.text, 'Sent from the keyboard');
      expect(find.text('Sent from the keyboard'), findsOneWidget);
    });
  });
}
