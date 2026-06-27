import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  GestureResponderEvent,
  type ScrollViewProps,
} from 'react-native';
import { useTerminalStore } from '../../store/terminal';
import { usePrefsStore } from '../../store/prefs';
import { Colors } from '../../theme';

// Lightweight ANSI stripper for v1.0 plain-text render.
// Full colour rendering deferred to v1.1 via canvas path.
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[mGKHF]/g, '');
}

interface Props extends Omit<ScrollViewProps, 'children'> {
  surfaceKey: string;   // `${workspaceId}:${surfaceId}`
}

const TerminalView = React.memo(({ surfaceKey, ...scrollProps }: Props) => {
  const lines = useTerminalStore((s) => s.surfaces[surfaceKey]?.lines ?? []);
  const reduceMotion = usePrefsStore((s) => s.reduceMotion);
  const globalFontSize = usePrefsStore((s) => s.terminalFontSize);
  const setFontSize = usePrefsStore((s) => s.setFontSize);

  const [localFontSize, setLocalFontSize] = useState(globalFontSize);
  const scrollRef = useRef<ScrollView>(null);

  // Keep local font size in sync when global pref changes
  useEffect(() => { setLocalFontSize(globalFontSize); }, [globalFontSize]);

  // Auto-scroll to bottom on new output, respecting reduced motion
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: !reduceMotion });
  }, [lines.length, reduceMotion]);

  // Pinch-to-zoom: track two-finger distance
  const pinchRef = useRef<{ dist: number; size: number } | null>(null);

  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    const touches = e.nativeEvent.touches;
    if (touches.length !== 2) return;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    pinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), size: localFontSize };
  }, [localFontSize]);

  const handleTouchMove = useCallback((e: GestureResponderEvent) => {
    const touches = e.nativeEvent.touches;
    if (touches.length !== 2 || !pinchRef.current) return;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const scale = dist / pinchRef.current.dist;
    const next = Math.min(24, Math.max(9, Math.round(pinchRef.current.size * scale)));
    setLocalFontSize(next);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pinchRef.current) {
      void setFontSize(localFontSize);
      pinchRef.current = null;
    }
  }, [localFontSize, setFontSize]);

  const lineHeight = Math.round(localFontSize * 1.4);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      accessibilityLabel="Terminal output"
      accessibilityRole="text"
      {...scrollProps}
    >
      {lines.map((line) => (
        <Text
          key={line.id}
          style={[styles.line, { fontSize: localFontSize, lineHeight }]}
          selectable
          accessibilityElementsHidden={false}
        >
          {stripAnsi(line.text)}
        </Text>
      ))}
      <View style={styles.cursor} accessibilityElementsHidden />
    </ScrollView>
  );
});

TerminalView.displayName = 'TerminalView';
export default TerminalView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.terminalBg,
  },
  content: {
    padding: 8,
    paddingBottom: 24,
  },
  line: {
    fontFamily: 'monospace',
    color: Colors.terminalFg,
    letterSpacing: 0,
  },
  cursor: {
    width: 8,
    height: 2,
    backgroundColor: Colors.terminalCursor,
    marginTop: 2,
  },
});
