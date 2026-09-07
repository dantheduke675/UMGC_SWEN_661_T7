import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../data.dart';
import '../theme.dart';
import '../widgets.dart';

class MsgThreadScreen extends StatefulWidget {
  final int threadId;
  const MsgThreadScreen({super.key, required this.threadId});

  @override
  State<MsgThreadScreen> createState() => _MsgThreadScreenState();
}

class _MsgThreadScreenState extends State<MsgThreadScreen> {
  late List<ChatMessage> _messages;
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  static const _quickReplies = [
    'Thank you!',
    'I took my medications',
    "I'm feeling well",
    'Call me please',
  ];

  @override
  void initState() {
    super.initState();
    _messages = List.of(threadById(widget.threadId).messages);
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _send(String text) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;
    setState(() {
      _messages.add(ChatMessage(from: 'me', text: trimmed, time: 'Now'));
    });
    _controller.clear();
    // Scroll to bottom after frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final scheme  = context.watch<ThemeNotifier>().scheme;
    final thread  = threadById(widget.threadId);
    final contact = contactById(thread.contactId);

    return Column(
      children: [
        // ── Thread header ────────────────────────────────────────────────────
        _ThreadHeader(
          contact: contact,
          scheme: scheme,
          onBack: () => context.go('/messages'),
          onCall: () => context.go('/calling/${contact.id}'),
        ),

        // ── Message bubbles ──────────────────────────────────────────────────
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            itemCount: _messages.length,
            itemBuilder: (_, i) => _Bubble(
              message: _messages[i],
              scheme: scheme,
              contact: contact,
            ),
          ),
        ),

        // ── Quick replies ────────────────────────────────────────────────────
        _QuickReplies(replies: _quickReplies, scheme: scheme, onTap: _send),

        // ── Input row ────────────────────────────────────────────────────────
        _InputRow(
          controller: _controller,
          scheme: scheme,
          onSend: () => _send(_controller.text),
        ),
      ],
    );
  }
}

// ── Thread header ─────────────────────────────────────────────────────────────

class _ThreadHeader extends StatelessWidget {
  final Contact contact;
  final CScheme scheme;
  final VoidCallback onBack, onCall;

  const _ThreadHeader({
    required this.contact, required this.scheme,
    required this.onBack, required this.onCall,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: scheme.surface,
        border: Border(bottom: BorderSide(color: scheme.border)),
      ),
      child: SafeArea(
        bottom: false,
        child: Row(
          children: [
            // Back button — large for tremor users
            SizedBox(
              width: 48, height: 48,
              child: TextButton(
                onPressed: onBack,
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  foregroundColor: scheme.primary,
                ),
                child: const Text('←', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
              ),
            ),
            const SizedBox(width: 4),
            CAvatarBadge(initials: contact.initials, color: Color(contact.color), size: 42),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(contact.name,
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: scheme.text)),
                  Text(contact.role,
                      style: TextStyle(fontSize: 12, color: scheme.sub)),
                ],
              ),
            ),
            // Call button
            GestureDetector(
              onTap: onCall,
              child: Container(
                width: 48, height: 48,
                decoration: BoxDecoration(color: scheme.primary, shape: BoxShape.circle),
                child: const Center(child: Text('📞', style: TextStyle(fontSize: 20))),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Message bubble ────────────────────────────────────────────────────────────

class _Bubble extends StatelessWidget {
  final ChatMessage message;
  final CScheme scheme;
  final Contact contact;

  const _Bubble({required this.message, required this.scheme, required this.contact});

  bool get _isMe => message.from == 'me';

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: _isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: _isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (!_isMe) ...[
                CAvatarBadge(initials: contact.initials, color: Color(contact.color), size: 28),
                const SizedBox(width: 8),
              ],
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.72,
                  ),
                  decoration: BoxDecoration(
                    color: _isMe ? scheme.primary : scheme.surface,
                    border: _isMe ? null : Border.all(color: scheme.border),
                    borderRadius: BorderRadius.only(
                      topLeft:     const Radius.circular(20),
                      topRight:    const Radius.circular(20),
                      bottomLeft:  Radius.circular(_isMe ? 20 : 4),
                      bottomRight: Radius.circular(_isMe ? 4  : 20),
                    ),
                  ),
                  child: Text(
                    message.text,
                    style: TextStyle(
                      fontSize: 15,
                      color: _isMe ? Colors.white : scheme.text,
                      height: 1.45,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Padding(
            padding: EdgeInsets.only(
              left:  _isMe ? 0  : 36,
              right: _isMe ? 4  : 0,
            ),
            child: Text(message.time,
                style: TextStyle(fontSize: 11, color: scheme.muted)),
          ),
        ],
      ),
    );
  }
}

// ── Quick replies ─────────────────────────────────────────────────────────────

class _QuickReplies extends StatelessWidget {
  final List<String> replies;
  final CScheme scheme;
  final void Function(String) onTap;

  const _QuickReplies({required this.replies, required this.scheme, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      decoration: BoxDecoration(
        color: scheme.bg,
        border: Border(top: BorderSide(color: scheme.border)),
      ),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        itemCount: replies.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (_, i) => GestureDetector(
          onTap: () => onTap(replies[i]),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: scheme.border),
            ),
            child: Center(
              child: Text(replies[i],
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: scheme.sub)),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Input row ─────────────────────────────────────────────────────────────────

class _InputRow extends StatelessWidget {
  final TextEditingController controller;
  final CScheme scheme;
  final VoidCallback onSend;

  const _InputRow({required this.controller, required this.scheme, required this.onSend});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
      decoration: BoxDecoration(
        color: scheme.surface,
        border: Border(top: BorderSide(color: scheme.border)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: scheme.surface2,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  controller: controller,
                  onSubmitted: (_) => onSend(),
                  style: TextStyle(fontSize: 15, color: scheme.text),
                  decoration: InputDecoration(
                    hintText: 'Type a message…',
                    hintStyle: TextStyle(color: scheme.muted, fontSize: 15),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            // Send button
            GestureDetector(
              onTap: onSend,
              child: Container(
                width: 48, height: 48,
                decoration: BoxDecoration(color: scheme.primary, shape: BoxShape.circle),
                child: const Center(
                  child: Text('↑',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
