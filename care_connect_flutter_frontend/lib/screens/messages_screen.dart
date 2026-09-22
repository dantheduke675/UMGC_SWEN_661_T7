import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../data.dart';
import '../theme.dart';
import '../widgets.dart';

class MessagesScreen extends StatelessWidget {
  const MessagesScreen({super.key});

  //the building of the messages screen widget including the people their names
  // and the last thing said in the conversation
  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final scrollController = context.read<ScrollController>();

    return ListView(
      controller: scrollController,
      padding: EdgeInsets.zero,
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
          child: CScreenTitle('Messages', scheme: scheme),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
          child: Text('${threads.length} conversations',
              style: TextStyle(fontSize: 13, color: scheme.sub)),
        ),
        // Thread list
        ...threads.map((thread) {
          final contact = contactById(thread.contactId);
          final last    = thread.messages.last;
          return _ThreadRow(
            thread: thread,
            contact: contact,
            lastMessage: last,
            scheme: scheme,
            onTap: () => context.go('/messages/${thread.id}'),
          );
        }),
      ],
    );
  }
}

// ── Thread row ────────────────────────────────────────────────────────────────

class _ThreadRow extends StatelessWidget {
  final Thread thread;
  final Contact contact;
  final ChatMessage lastMessage;
  final CScheme scheme;
  final VoidCallback onTap;

  const _ThreadRow({
    required this.thread, required this.contact, required this.lastMessage,
    required this.scheme, required this.onTap,
  });

  /// Ends [text] with exactly one terminator, so the spoken label reads as a
  /// sentence instead of running "…I need.. 2:34 PM" together.
  static String _sentence(String text) {
    final t = text.trim();
    if (t.isEmpty) return '';
    return RegExp(r'[.!?]$').hasMatch(t) ? t : '$t.';
  }

  @override
  Widget build(BuildContext context) {
    return CTappable(
      // The row is one control; announce who it is from, their role, whether
      // it is unread, and a preview — in that order (SC 1.3.1, SC 4.1.2).
      label: '${thread.unread ? 'Unread. ' : ''}${contact.name}, '
          '${contact.role}. ${_sentence(lastMessage.text)} ${lastMessage.time}',
      hint: 'Opens conversation',
      borderRadius: BorderRadius.zero,
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: scheme.border)),
        ),
        child: Row(
          children: [
            // Avatar with unread badge
            Stack(
              clipBehavior: Clip.none,
              children: [
                CAvatarBadge(
                  initials: contact.initials,
                  color: Color(contact.color),
                  size: 52,
                ),
                if (thread.unread)
                  Positioned(
                    top: -2, right: -2,
                    child: Container(
                      width: 14, height: 14,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEF4444),
                        shape: BoxShape.circle,
                        border: Border.all(color: scheme.bg, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 14),
            // Text content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // The name and timestamp used to sit in a spaceBetween Row
                  // with no flex, so a scaled-up name pushed the timestamp
                  // off-screen — 185px of overflow at 200% (SC 1.4.4).
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          contact.name,
                          style: TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700,
                            color: thread.unread ? scheme.text : scheme.text.withValues(alpha: 0.85),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(lastMessage.time,
                          style: TextStyle(fontSize: 12, color: scheme.sub)),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(contact.role,
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: scheme.sub)),
                  const SizedBox(height: 3),
                  Text(
                    lastMessage.text,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13, color: scheme.sub,
                      fontWeight: thread.unread ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (thread.unread)
              Container(
                width: 10, height: 10,
                decoration: BoxDecoration(color: scheme.primary, shape: BoxShape.circle),
              ),
          ],
        ),
      ),
    );
  }
}

