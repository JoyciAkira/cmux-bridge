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

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1B\[[0-9;]*[mGKHFJABCDr]|\x1B[=>]|\r/g;
// Box-drawing and block-element Unicode ranges that render as thin lines
const BOX_RE = /^[\s\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2800-\u28FF─━═─┄┅┆┇┈┉┊┋┌┐└┘├┤┬┴┼╌╍╎╏╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬▀▄█▌▐░▒▓]+$/u;

function stripAnsi(str: string): string {
  return str.replace(ANSI_RE, '');
}

function renderLine(raw: string): string {
  const stripped = stripAnsi(raw);
  // Replace lines that are purely box-drawing/separators with a space
  // so they render at full line-height instead of collapsing to a thin bar
  if (BOX_RE.test(stripped)) return ' ';
  return stripped || ' ';
}

interface Props extends Omit<ScrollViewProps, 'children'> {
  surfaceKey: string;
}

const TerminalView = React.memo(({ surfaceKey, ...scrollProps }: Props) => {
  const lines = useTerminalStore((s) => s.surfaces[surfaceKey]?.lines) ?? [];
  const reduceMotion = usePrefsStore((s) => s.reduceMotion);
  const globalFontSize = usePrefsStore((s) => s.terminalFontSize);
  const setFontSize = usePrefsStore((s) => s.setFontSize);

  const [localFontSize, setLocalFontSize] = useState(globalFontSize);
  const scrollRef = useRef<ScrollView>(null);
  const userScrolledUp = useRef(false);

  useEffect(() => { setLocalFontSize(globalFontSize); }, [globalFontSize]);

  // Scroll to end on any content change, unless user has scrolled up
  useEffect(() => {
    if (!userScrolledUp.current) {
      scrollRef.current?.scrollToEnd({ animated: !reduceMotion });
    }
  });

  const handleScrollEnd = useCallback((e: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    userScrolledUp.current = distFromBottom > 40;
  }, []);

  // Pinch-to-zoom
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

  const lineHeight = Math.round(localFontSize * 1.5);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
      indicatorStyle="white"
      onScrollEndDrag={handleScrollEnd}
      onMomentumScrollEnd={handleScrollEnd}
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
        >
          {renderLine(line.text)}
        </Text>
      ))}
      <View style={styles.cursor} />
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
    padding: 10,
    paddingBottom: 32,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  line: {
    fontFamily: 'monospace',
    color: Colors.terminalFg,
    letterSpacing: 0,
  },
  cursor: {
    width: 8,
    height: 14,
    backgroundColor: Colors.terminalCursor,
    marginTop: 2,
    opacity: 0.8,
  },
});
