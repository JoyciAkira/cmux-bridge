import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  GestureResponderEvent,
  Platform,
} from 'react-native';
import { useTerminalStore, type TerminalLine } from '../../store/terminal';
import { usePrefsStore } from '../../store/prefs';
import { Colors, FontSizes, Spacing } from '../../theme';
import { visibleTerminalLine } from './terminalText';

interface Props {
  surfaceKey: string;
}

const DEFAULT_FONT_SIZE = FontSizes.terminal;
const LINE_HEIGHT_RATIO = 1.45;
const MONO_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});
const EMPTY_LINES: TerminalLine[] = [];

interface LineRowProps {
  line: TerminalLine;
  fontSize: number;
  lineHeight: number;
}

const TerminalLineRow = React.memo(function TerminalLineRow({
  line,
  fontSize,
  lineHeight,
}: LineRowProps) {
  const text = visibleTerminalLine(line.text);
  return (
    <Text
      style={[styles.line, { fontSize, lineHeight, minHeight: lineHeight }]}
      selectable
    >
      {text}
    </Text>
  );
}, (prev, next) => (
  prev.line.id === next.line.id
  && prev.line.text === next.line.text
  && prev.fontSize === next.fontSize
  && prev.lineHeight === next.lineHeight
));

const TerminalView = React.memo(function TerminalView({ surfaceKey }: Props) {
  const lines = useTerminalStore((s) => s.surfaces[surfaceKey]?.lines) ?? EMPTY_LINES;
  const globalFontSize = usePrefsStore((s) => s.terminalFontSize);
  const reduceMotion = usePrefsStore((s) => s.reduceMotion);
  const setFontSize = usePrefsStore((s) => s.setFontSize);

  const [localFontSize, setLocalFontSize] = useState(globalFontSize);
  const scrollRef = useRef<ScrollView>(null);
  const userScrolledUp = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setLocalFontSize(globalFontSize); }, [globalFontSize]);

  const fontSize = localFontSize ?? DEFAULT_FONT_SIZE;
  const lineHeight = Math.round(fontSize * LINE_HEIGHT_RATIO);

  const lineCount = lines.length;
  const lastLineTextLen = lines[lineCount - 1]?.text.length ?? 0;

  useEffect(() => {
    if (userScrolledUp.current || reduceMotion) return;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      scrollTimer.current = null;
      if (!userScrolledUp.current) {
        scrollRef.current?.scrollToEnd({ animated: false });
      }
    }, 300);
    return () => {
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
        scrollTimer.current = null;
      }
    };
  }, [lineCount, lastLineTextLen, lineHeight, reduceMotion]);

  const handleScrollEnd = useCallback((e: {
    nativeEvent: {
      contentOffset: { y: number };
      contentSize: { height: number };
      layoutMeasurement: { height: number };
    };
  }) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    userScrolledUp.current = contentSize.height - layoutMeasurement.height - contentOffset.y > 48;
  }, []);

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
    setLocalFontSize(Math.min(22, Math.max(10, Math.round(pinchRef.current.size * scale))));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pinchRef.current) {
      void setFontSize(localFontSize);
      pinchRef.current = null;
    }
  }, [localFontSize, setFontSize]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onScrollEndDrag={handleScrollEnd}
      onMomentumScrollEnd={handleScrollEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      accessibilityLabel="Terminal output"
      accessibilityRole="text"
      keyboardShouldPersistTaps="handled"
    >
      {lines.map((line) => (
        <TerminalLineRow
          key={line.id}
          line={line}
          fontSize={fontSize}
          lineHeight={lineHeight}
        />
      ))}
    </ScrollView>
  );
});

export default TerminalView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.terminalBg,
  },
  content: {
    paddingHorizontal: Spacing.sm + 2,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  line: {
    fontFamily: MONO_FONT,
    color: Colors.terminalFg,
    letterSpacing: 0,
    includeFontPadding: false,
  },
});
