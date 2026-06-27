import React, { useEffect, useRef } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  type ScrollViewProps,
} from 'react-native';
import { useTerminalStore } from '../../store/terminal';
import { Colors, FontSizes } from '../../theme';

// Very lightweight ANSI stripper for plain-text render.
// A full ANSI renderer (with colour) is deferred to v1.1 via a canvas path.
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[mGKHF]/g, '');
}

interface Props extends Omit<ScrollViewProps, 'children'> {
  surfaceKey: string;   // `${workspaceId}:${surfaceId}`
  fontSize?: number;
}

const TerminalView = React.memo(({ surfaceKey, fontSize, ...scrollProps }: Props) => {
  const lines = useTerminalStore((s) => (s.surfaces[surfaceKey]?.lines ?? []));
  const storedFontSize = useTerminalStore((s) => s.surfaces[surfaceKey]?.fontSize ?? FontSizes.terminal);
  const scrollRef = useRef<ScrollView>(null);
  const resolvedSize = fontSize ?? storedFontSize;

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: false });
  }, [lines.length]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      {...scrollProps}
    >
      {lines.map((line) => (
        <Text
          key={line.id}
          style={[styles.line, { fontSize: resolvedSize }]}
          selectable
        >
          {stripAnsi(line.text)}
        </Text>
      ))}
      {/* Cursor blink indicator on last line */}
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
    padding: 8,
    paddingBottom: 24,
  },
  line: {
    fontFamily: 'monospace',
    color: Colors.terminalFg,
    lineHeight: 18,
    letterSpacing: 0,
  },
  cursor: {
    width: 8,
    height: 2,
    backgroundColor: Colors.terminalCursor,
    marginTop: 2,
  },
});
