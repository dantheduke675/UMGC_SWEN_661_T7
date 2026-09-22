/**
 * MessagesScreen
 * Thread list. Each row shows avatar (with unread dot), contact name + role,
 * last message preview, and timestamp. Tapping opens MsgThreadScreen.
 */
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ColorScheme, dark } from '../constants/theme';
import { threads, contactById, ChatMessage, Thread, Contact } from '../constants/data';
import { CAvatarBadge } from '../components/AppComponents';
import { useScrollContext } from '../context/ScrollContext';

interface Props {
  scheme?:   ColorScheme;
  onOpenThread?: (threadId: number) => void;
}

// ── Thread row ────────────────────────────────────────────────────────────────

function ThreadRow({
  thread,
  contact,
  lastMessage,
  scheme,
  onTap,
}: {
  thread:      Thread;
  contact:     Contact;
  lastMessage: ChatMessage;
  scheme:      ColorScheme;
  onTap:       () => void;
}) {
  const a11yLabel = `${contact.name}, ${contact.role}${thread.unread ? ', unread' : ''}. ${lastMessage.text}, ${lastMessage.time}`;

  return (
    <TouchableOpacity
      onPress={onTap}
      activeOpacity={0.7}
      style={[styles.row, { borderBottomColor: scheme.border }]}
      accessible
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Opens this conversation"
    >
      {/* Avatar with unread indicator */}
      <View style={styles.avatarWrapper}>
        <CAvatarBadge
          initials={contact.initials}
          color={contact.color}
          size={52}
        />
        {thread.unread && (
          <View
            style={[styles.unreadDot, { borderColor: scheme.bg }]}
          />
        )}
      </View>

      {/* Text content */}
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text
            style={[
              styles.contactName,
              {
                color:      scheme.text,
                fontWeight: thread.unread ? '700' : '600',
              },
            ]}
          >
            {contact.name}
          </Text>
          <Text style={[styles.timestamp, { color: scheme.sub }]}>
            {lastMessage.time}
          </Text>
        </View>

        <Text style={[styles.contactRole, { color: scheme.sub }]}>
          {contact.role}
        </Text>

        <Text
          style={[
            styles.preview,
            {
              color:      scheme.sub,
              fontWeight: thread.unread ? '600' : '400',
            },
          ]}
          numberOfLines={1}
        >
          {lastMessage.text}
        </Text>
      </View>

      {/* Unread presence dot on right */}
      {thread.unread && (
        <View style={[styles.presenceDot, { backgroundColor: scheme.primary }]} />
      )}
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MessagesScreen({ scheme = dark, onOpenThread }: Props) {
  // Register scroll with AccessBar
  const scrollRef  = useRef<ScrollView>(null);
  const offsetRef  = useRef(0);
  const { register } = useScrollContext();
  useEffect(() => {
    register((delta: number) => {
      const next = Math.max(0, offsetRef.current + delta);
      scrollRef.current?.scrollTo({ y: next, animated: true });
    });
    return () => register(null);
  }, [register]);

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.root, { backgroundColor: scheme.bg }]}
      showsVerticalScrollIndicator={false}
      onScroll={e => { offsetRef.current = e.nativeEvent.contentOffset.y; }}
      scrollEventThrottle={16}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.heading, { color: scheme.text }]} accessibilityRole="header">Messages</Text>
        <Text style={[styles.subheading, { color: scheme.sub }]}>
          {threads.length} conversations
        </Text>
      </View>

      {/* Thread list */}
      {threads.map(thread => {
        const contact     = contactById(thread.contactId);
        const lastMessage = thread.messages[thread.messages.length - 1];
        return (
          <ThreadRow
            key={thread.id}
            thread={thread}
            contact={contact}
            lastMessage={lastMessage}
            scheme={scheme}
            onTap={() => onOpenThread?.(thread.id)}
          />
        );
      })}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop:        20,
    paddingBottom:     12,
  },
  heading: {
    fontSize:   22,
    fontWeight: '800',
  },
  subheading: {
    fontSize:  13,
    marginTop: 4,
  },

  // Thread row
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: 20,
    paddingVertical:   14,
    borderBottomWidth: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  unreadDot: {
    position:     'absolute',
    top:          -2,
    right:        -2,
    width:        14,
    height:       14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    borderWidth:  2,
  },
  rowContent: {
    flex:       1,
    marginLeft: 14,
  },
  rowTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  contactName: {
    fontSize: 15,
  },
  timestamp: {
    fontSize: 12,
  },
  contactRole: {
    fontSize:   12,
    fontWeight: '600',
    marginTop:  3,
  },
  preview: {
    fontSize:  13,
    marginTop: 3,
  },
  presenceDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
    marginLeft:   8,
  },
});
