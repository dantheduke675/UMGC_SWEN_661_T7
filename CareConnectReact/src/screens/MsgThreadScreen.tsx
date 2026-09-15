/**
 * MsgThreadScreen
 * Full conversation view: header with back + call buttons, scrolling bubble
 * list, a horizontal quick-replies strip, and a text input row.
 * Auto-scrolls to bottom when a new message is sent.
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ColorScheme, dark } from '../constants/theme';
import { threadById, contactById, ChatMessage, Contact } from '../constants/data';
import { CAvatarBadge } from '../components/AppComponents';

interface Props {
  threadId:   number;
  scheme?:    ColorScheme;
  onBack?:    () => void;
  onCall?:    (contactId: number) => void;
}

const QUICK_REPLIES = [
  'Thank you!',
  'I took my medications',
  "I'm feeling well",
  'Call me please',
];

// ── Thread header ─────────────────────────────────────────────────────────────

function ThreadHeader({
  contact,
  scheme,
  onBack,
  onCall,
}: {
  contact: Contact;
  scheme:  ColorScheme;
  onBack:  () => void;
  onCall:  () => void;
}) {
  return (
    <View style={[styles.header, { backgroundColor: scheme.surface, borderBottomColor: scheme.border }]}>
      <SafeAreaView edges={['top']} style={styles.headerInner}>
        {/* Back */}
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.backArrow, { color: scheme.primary }]}>←</Text>
        </TouchableOpacity>

        {/* Avatar */}
        <CAvatarBadge initials={contact.initials} color={contact.color} size={42} />

        {/* Name + role */}
        <View style={styles.headerText}>
          <Text style={[styles.headerName, { color: scheme.text }]}>{contact.name}</Text>
          <Text style={[styles.headerRole, { color: scheme.sub }]}>{contact.role}</Text>
        </View>

        {/* Call */}
        <TouchableOpacity
          style={[styles.callBtn, { backgroundColor: scheme.primary }]}
          onPress={onCall}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 20 }}>📞</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function Bubble({
  message,
  contact,
  scheme,
  maxWidth,
}: {
  message:  ChatMessage;
  contact:  Contact;
  scheme:   ColorScheme;
  maxWidth: number;
}) {
  const isMe = message.from === 'me';

  return (
    <View
      style={[
        styles.bubbleWrapper,
        { alignItems: isMe ? 'flex-end' : 'flex-start' },
      ]}
    >
      <View
        style={[
          styles.bubbleRow,
          { justifyContent: isMe ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!isMe && (
          <>
            <CAvatarBadge initials={contact.initials} color={contact.color} size={28} />
            <View style={{ width: 8 }} />
          </>
        )}

        <View
          style={[
            styles.bubble,
            {
              maxWidth,
              backgroundColor: isMe ? scheme.primary : scheme.surface,
              borderColor:     isMe ? 'transparent' : scheme.border,
              borderWidth:     isMe ? 0 : 1,
              borderTopLeftRadius:     20,
              borderTopRightRadius:    20,
              borderBottomLeftRadius:  isMe ? 20 : 4,
              borderBottomRightRadius: isMe ? 4  : 20,
            },
          ]}
        >
          <Text style={[styles.bubbleText, { color: isMe ? '#FFFFFF' : scheme.text }]}>
            {message.text}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.bubbleTime,
          {
            color:       scheme.muted,
            marginLeft:  isMe ? 0  : 36,
            marginRight: isMe ? 4  : 0,
            textAlign:   isMe ? 'right' : 'left',
          },
        ]}
      >
        {message.time}
      </Text>
    </View>
  );
}

// ── Quick replies ─────────────────────────────────────────────────────────────

function QuickReplies({
  scheme,
  onTap,
}: {
  scheme: ColorScheme;
  onTap:  (text: string) => void;
}) {
  return (
    <View style={[styles.quickRepliesBar, { backgroundColor: scheme.bg, borderTopColor: scheme.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickRepliesContent}
      >
        {QUICK_REPLIES.map(reply => (
          <TouchableOpacity
            key={reply}
            style={[styles.quickReply, { backgroundColor: scheme.surface, borderColor: scheme.border }]}
            onPress={() => onTap(reply)}
            activeOpacity={0.75}
          >
            <Text style={[styles.quickReplyText, { color: scheme.sub }]}>{reply}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Input row ─────────────────────────────────────────────────────────────────

function InputRow({
  value,
  onChangeText,
  onSend,
  scheme,
}: {
  value:        string;
  onChangeText: (t: string) => void;
  onSend:       () => void;
  scheme:       ColorScheme;
}) {
  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.inputBar, { backgroundColor: scheme.surface, borderTopColor: scheme.border }]}
    >
      <View style={[styles.inputPill, { backgroundColor: scheme.surface2 }]}>
        <TextInput
          style={[styles.inputText, { color: scheme.text }]}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSend}
          placeholder="Type a message…"
          placeholderTextColor={scheme.muted}
          returnKeyType="send"
          multiline={false}
        />
      </View>
      <TouchableOpacity
        style={[styles.sendBtn, { backgroundColor: scheme.primary }]}
        onPress={onSend}
        activeOpacity={0.8}
      >
        <Text style={styles.sendBtnText}>↑</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MsgThreadScreen({
  threadId,
  scheme = dark,
  onBack,
  onCall,
}: Props) {
  const thread  = threadById(threadId);
  const contact = contactById(thread.contactId);

  const [messages, setMessages] = useState<ChatMessage[]>([...thread.messages]);
  const [input, setInput]       = useState('');
  const listRef                 = useRef<FlatList<ChatMessage>>(null);
  const { width }               = useWindowDimensions();
  const maxBubbleWidth          = width * 0.72;

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const msg: ChatMessage = { from: 'me', text: trimmed, time: 'Now' };
      setMessages(prev => {
        const next = [...prev, msg];
        // Scroll after state flush
        requestAnimationFrame(() => {
          listRef.current?.scrollToEnd({ animated: true });
        });
        return next;
      });
      setInput('');
    },
    [],
  );

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: scheme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <ThreadHeader
        contact={contact}
        scheme={scheme}
        onBack={onBack ?? (() => {})}
        onCall={() => onCall?.(contact.id)}
      />

      {/* Message list */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <Bubble
            message={item}
            contact={contact}
            scheme={scheme}
            maxWidth={maxBubbleWidth}
          />
        )}
      />

      {/* Quick replies */}
      <QuickReplies scheme={scheme} onTap={text => send(text)} />

      {/* Text input */}
      <InputRow
        value={input}
        onChangeText={setInput}
        onSend={() => send(input)}
        scheme={scheme}
      />
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Header
  header: {
    borderBottomWidth: 1,
  },
  headerInner: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: 12,
    paddingVertical:   10,
  },
  headerIconBtn: {
    width:          48,
    height:         48,
    alignItems:     'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize:   22,
    fontWeight: '700',
  },
  headerText: {
    flex:       1,
    marginLeft: 10,
  },
  headerName: {
    fontSize:   15,
    fontWeight: '700',
  },
  headerRole: {
    fontSize: 12,
  },
  callBtn: {
    width:          48,
    height:         48,
    borderRadius:   24,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // Bubble list
  listContent: {
    paddingHorizontal: 16,
    paddingTop:        16,
    paddingBottom:     8,
  },
  bubbleWrapper: {
    marginBottom: 12,
    width:        '100%',
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems:   'flex-end',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  bubbleText: {
    fontSize:   15,
    lineHeight: 22,
  },
  bubbleTime: {
    fontSize:  11,
    marginTop: 4,
  },

  // Quick replies
  quickRepliesBar: {
    height:          52,
    borderTopWidth:  1,
  },
  quickRepliesContent: {
    paddingHorizontal: 12,
    paddingVertical:   8,
    alignItems:        'center',
    gap:               8,
  },
  quickReply: {
    paddingHorizontal: 14,
    borderRadius:      12,
    borderWidth:       1,
    height:            36,
    alignItems:        'center',
    justifyContent:    'center',
  },
  quickReplyText: {
    fontSize:   13,
    fontWeight: '600',
  },

  // Input
  inputBar: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 12,
    paddingVertical:   10,
    borderTopWidth:    1,
  },
  inputPill: {
    flex:         1,
    height:       48,
    borderRadius: 24,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 15,
    padding:  0,
  },
  sendBtn: {
    width:          48,
    height:         48,
    borderRadius:   24,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     10,
  },
  sendBtnText: {
    fontSize:   20,
    fontWeight: '700',
    color:      '#FFFFFF',
  },
});
