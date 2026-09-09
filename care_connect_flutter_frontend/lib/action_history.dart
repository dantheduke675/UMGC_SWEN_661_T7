import 'package:flutter/foundation.dart';

// ── Shared undo history ──────────────────────────────────────────────────────
// Replaces the old per-screen, auto-dismissing undo snackbar: actions from
// both the Today and Medications screens land in one list that a persistent
// floating button (see UndoFab in widgets.dart) lets the user browse and
// undo individually, in any order, with no time limit.

//essentially whenever an action can be undone it gets added to an undo list
class UndoableAction {
  final int id;
  final String description;
  final DateTime timestamp;
  final VoidCallback undo;

  UndoableAction({
    required this.id,
    required this.description,
    required this.timestamp,
    required this.undo,
  });
}

//pushes an undoable action to the list and then allows for the user to undo that action whenever they want
class ActionHistory extends ChangeNotifier {
  final List<UndoableAction> _actions = [];
  int _nextId = 0;

  /// Most recent first.
  List<UndoableAction> get actions => List.unmodifiable(_actions.reversed);

  void push(String description, VoidCallback undo) {
    _actions.add(UndoableAction(
      id: _nextId++,
      description: description,
      timestamp: DateTime.now(),
      undo: undo,
    ));
    notifyListeners();
  }

  void undoAction(int id) {
    final index = _actions.indexWhere((a) => a.id == id);
    if (index == -1) return;
    final action = _actions.removeAt(index);
    action.undo();
    notifyListeners();
  }
}
