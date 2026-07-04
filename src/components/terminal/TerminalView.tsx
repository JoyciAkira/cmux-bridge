import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
  FlatList,
  Text,
  StyleSheet,
  View,
  GestureResponderEvent,
  Platform,
  type ListRenderItemInfo,
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
  const lines = useTerminalStore((s) => s.surfaces[surfaceKey]?.lines) ?? [];
  const globalFontSize = usePrefsStore((s) => s.terminalFontSize);
  const setFontSize = usePrefsStore((s) => s.setFontSize);

  const [localFontSize, setLocalFontSize] = useState(globalFontSize);
  const listRef = useRef<FlatList<TerminalLine>>(null);
  const userScrolledUp = useRef(false);

  useEffect(() => { setLocalFontSize(globalFontSize); }, [globalFontSize]);

  const fontSize = localFontSize ?? DEFAULT_FONT_SIZE;
  const lineHeight = Math.round(fontSize * LINE_HEIGHT_RATIO);

  const tailSignature = useMemo(() => {
    if (lines.length === 0) return '0';
    const last = lines[lines.length - 1];
    return `${lines.length}:${last.id}:${last.text.length}`;
  }, [lines]);

  useEffect(() => {
    if (userScrolledUp.current) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: false });
    }, 120);
    return () => clearTimeout(timer);
  }, [tailSignature, lineHeight]);

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

  const renderItem = useCallback(({ item }: ListRenderItemInfo<TerminalLine>) => (
    <TerminalLineRow line={item} fontSize={fontSize} lineHeight={lineHeight} />
  ), [fontSize, lineHeight]);

  const keyExtractor = useCallback((item: TerminalLine) => String(item.id), []);

  const getItemLayout = useCallback((_: ArrayLike<TerminalLine> | null | undefined, index: number) => ({
    length: lineHeight,
    offset: lineHeight * index,
    index,
  }), [lineHeight]);

  return (
    <View
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <FlatList
        ref={listRef}
        data={lines}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        style={styles.list}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        accessibilityLabel="Terminal output"
        accessibilityRole="text"
        removeClippedSubviews
        initialNumToRender={40}
        maxToRenderPerBatch={24}
        windowSize={12}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
});

export default TerminalView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.terminalBg,
  },
  list: {
    flex: 1,
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
