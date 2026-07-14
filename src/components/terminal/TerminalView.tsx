import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Keyboard,
  useWindowDimensions,
  PanResponder,
  PixelRatio,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useTerminalStore, type TerminalLine } from '../../store/terminal';
import { usePrefsStore } from '../../store/prefs';
import { Colors, FontSizes, Spacing, Radii, resolveThemeColors } from '../../theme';
import TerminalCanvas from './TerminalCanvas';
import TerminalCursorOverlay from './TerminalCursorOverlay';
import { LEFT_INSET, TOP_INSET, BOTTOM_PAD } from './terminalCanvasConstants';
import { TerminalRenderCache } from './terminalRenderCache';
import { TerminalCopyBar } from './TerminalSelectionLayer';
import { computeTerminalViewport } from './terminalViewport';
import { StickyPrimaryColumns } from './stickyPrimaryColumns';
import { isTuiViewport, trimOpenCodePanePrefix } from './inferPrimaryColumns';
import { plainTerminalLine } from './ansiParser';
import { useFittedTerminalMetrics } from './useTerminalMetrics';
import {
  cellPosFromPoint,
  type TerminalSelection,
} from './terminalSelection';

interface Props {
  surfaceKey: string;
  /** Forward scroll to remote TUI (OpenCode / Claude alt-screen). */
  onScrollKey?: (key: 'pgup' | 'pgdn' | 'up' | 'down') => void;
}

const DEFAULT_FONT_SIZE = FontSizes.terminal;
const TAIL_THRESHOLD_PX = 80;
const BOTTOM_SCROLL_PADDING_ROWS = 5;
const EMPTY_LINES: TerminalLine[] = [];
const DEFAULT_CURSOR = { x: 0, y: 0 };

const TerminalView = React.memo(function TerminalView({ surfaceKey, onScrollKey }: Props) {
  const surface = useTerminalStore((s) => s.surfaces[surfaceKey]);
  const lines = surface?.lines ?? EMPTY_LINES;
  const cursor = surface?.cursor ?? DEFAULT_CURSOR;
  const cols = surface?.cols ?? 80;
  const maxRenderedColumns = surface?.maxRenderedColumns ?? 0;
  const globalFontSize = usePrefsStore((s) => s.terminalFontSize);
  const reduceMotion = usePrefsStore((s) => s.reduceMotion);
  const highContrast = usePrefsStore((s) => s.highContrast);
  const setFontSize = usePrefsStore((s) => s.setFontSize);
  const themeColors = useMemo(() => resolveThemeColors(highContrast), [highContrast]);
  const { width: windowWidth } = useWindowDimensions();
  const fontScale = PixelRatio.getFontScale();

  const [localFontSize, setLocalFontSize] = useState(globalFontSize);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selection, setSelection] = useState<TerminalSelection | null>(null);
  const [scrollOffsetY, setScrollOffsetY] = useState(0);
  const [viewportHeightPx, setViewportHeightPx] = useState(0);
  const [showSidebarHint, setShowSidebarHint] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const hScrollRef = useRef<ScrollView>(null);
  const scrollOffsetYRef = useRef(0);
  const scrollOffsetXRef = useRef(0);
  const showScrollBtnRef = useRef(false);
  const renderCacheRef = useRef(new TerminalRenderCache());
  const stickyPrimaryRef = useRef(new StickyPrimaryColumns());
  const userPannedHorizontal = useRef(false);
  const followTail = useRef(true);
  const programmaticScroll = useRef(false);
  const contentHeight = useRef(0);
  const prevContentHeight = useRef(0);
  const viewportHeight = useRef(0);
  const userScrolledAway = useRef(false);
  const prevLineCount = useRef(0);
  const pinchBaseSize = useRef(globalFontSize);
  const draggingScroll = useRef(false);
  const pinching = useRef(false);
  const lastRemoteScrollAt = useRef(0);
  const anchorRef = useRef<{ row: number; col: number } | null>(null);

  useEffect(() => { setLocalFontSize(globalFontSize); }, [globalFontSize]);

  const fontSize = Math.round((localFontSize ?? DEFAULT_FONT_SIZE) * fontScale);

  const plainRowsForLayout = useMemo(
    () => lines.map((line) => trimOpenCodePanePrefix(plainTerminalLine(line.text))),
    [lines],
  );
  const layoutCols = useMemo(
    () => stickyPrimaryRef.current.next(plainRowsForLayout, cols),
    [plainRowsForLayout, cols],
  );
  const fittedMetrics = useFittedTerminalMetrics(windowWidth, fontSize);
  const tuiMode = useMemo(
    () => isTuiViewport(plainRowsForLayout, cols),
    [plainRowsForLayout, cols],
  );

  useEffect(() => {
    followTail.current = true;
    userScrolledAway.current = false;
    draggingScroll.current = false;
    setShowScrollBtn(false);
    showScrollBtnRef.current = false;
    setSelection(null);
    setSelectionMode(false);
    userPannedHorizontal.current = false;
    setSidebarOpen(false);
    scrollOffsetXRef.current = 0;
    prevLineCount.current = 0;
    prevContentHeight.current = 0;
    stickyPrimaryRef.current.reset();
    renderCacheRef.current.clear();
    hScrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, [surfaceKey]);

  const renderRows = useMemo(
    () => renderCacheRef.current.build(lines),
    [lines],
  );

  const lineIds = useMemo(
    () => lines.map((line) => line.id),
    [lines],
  );

  const viewport = useMemo(
    () => computeTerminalViewport({
      windowWidth,
      cols,
      renderRows,
      plainRows: plainRowsForLayout,
      stickyPrimaryColumns: layoutCols,
      cursorX: cursor.x,
      metrics: fittedMetrics,
    }),
    [windowWidth, cols, renderRows, plainRowsForLayout, layoutCols, cursor.x, fittedMetrics],
  );

  const {
    primaryColumns,
    totalColumns,
    cellAdvance: advance,
    renderFontSize,
    lineHeight,
    primaryWidth,
    fullContentWidth,
    clipWidth,
    hasSidebar,
    displayColumns,
  } = viewport;

  const canvasWidth = sidebarOpen && hasSidebar ? fullContentWidth : primaryWidth;
  const horizontalScroll = hasSidebar && sidebarOpen;

  const contentHeightPx = TOP_INSET
    + lines.length * lineHeight
    + BOTTOM_PAD
    + lineHeight * BOTTOM_SCROLL_PADDING_ROWS;

  const columnLimit = sidebarOpen ? totalColumns : primaryColumns;
  const drawClipWidth = sidebarOpen ? undefined : clipWidth;
  const showSidebarDivider = sidebarOpen && hasSidebar;

  const visibleRowRange = useMemo(() => ({
    start: 0,
    end: Math.max(0, lines.length - 1),
  }), [lines.length]);

  useEffect(() => {
    setShowSidebarHint(hasSidebar);
  }, [hasSidebar]);

  useEffect(() => {
    if (!sidebarOpen) {
      hScrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    }
  }, [sidebarOpen, surfaceKey]);

  const mapTouch = useCallback((locationX: number, locationY: number) => {
    return cellPosFromPoint(locationX, locationY + scrollOffsetYRef.current, {
      leftInset: LEFT_INSET,
      topInset: TOP_INSET,
      advance,
      lineHeight,
      rowCount: Math.max(lines.length, 1),
      maxCol: Math.max(1, totalColumns),
      renderRows,
    });
  }, [advance, lineHeight, lines.length, totalColumns, renderRows]);

  const scrollToBottom = useCallback((animated: boolean) => {
    if (lines.length === 0) return;
    programmaticScroll.current = true;
    userScrolledAway.current = false;
    followTail.current = true;
    scrollRef.current?.scrollToEnd({ animated: reduceMotion ? false : animated });
    setShowScrollBtn(false);
    showScrollBtnRef.current = false;
    setTimeout(() => { programmaticScroll.current = false; }, 160);
  }, [lines.length, reduceMotion]);

  useEffect(() => {
    const grew = lines.length > prevLineCount.current;
    prevLineCount.current = lines.length;
    if (tuiMode) return;
    if (!grew) return;
    if (draggingScroll.current || pinching.current || userScrolledAway.current || !followTail.current) return;
    programmaticScroll.current = true;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
      setTimeout(() => { programmaticScroll.current = false; }, 50);
    });
  }, [lines.length, tuiMode]);

  const sendRemoteScroll = useCallback((key: 'pgup' | 'pgdn' | 'up' | 'down') => {
    if (!onScrollKey || selectionMode) return;
    const now = Date.now();
    if (now - lastRemoteScrollAt.current < 140) return;
    lastRemoteScrollAt.current = now;
    onScrollKey(key);
  }, [onScrollKey, selectionMode]);

  const maybeRemoteScroll = useCallback((offsetY: number) => {
    if (!onScrollKey || selectionMode || tuiMode) return;
    if (!draggingScroll.current) return;
    const now = Date.now();
    if (now - lastRemoteScrollAt.current < 160) return;
    const maxOffset = Math.max(0, contentHeight.current - viewportHeight.current);
    if (offsetY < -20) {
      sendRemoteScroll('pgup');
      return;
    }
    if (offsetY > maxOffset + 20) {
      sendRemoteScroll('pgdn');
    }
  }, [onScrollKey, selectionMode, tuiMode, sendRemoteScroll]);

  const updateFollowState = useCallback((offsetY: number) => {
    maybeRemoteScroll(offsetY);
    scrollOffsetYRef.current = offsetY;
    if (programmaticScroll.current) return;

    const maxOffset = Math.max(0, contentHeight.current - viewportHeight.current);
    const distanceFromBottom = maxOffset - offsetY;
    const atTail = distanceFromBottom <= TAIL_THRESHOLD_PX;
    followTail.current = atTail;
    if (atTail) userScrolledAway.current = false;

    const shouldShowBtn = !atTail && lines.length > 0 && maxOffset > 8;
    if (shouldShowBtn !== showScrollBtnRef.current) {
      showScrollBtnRef.current = shouldShowBtn;
      setShowScrollBtn(shouldShowBtn);
    }

    setScrollOffsetY(offsetY);
  }, [lines.length, maybeRemoteScroll]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    updateFollowState(e.nativeEvent.contentOffset.y);
  }, [updateFollowState]);

  const handleScrollBeginDrag = useCallback(() => {
    if (!selectionMode) Keyboard.dismiss();
    draggingScroll.current = true;
    followTail.current = false;
    userScrolledAway.current = true;
  }, [selectionMode]);

  const handleScrollEndDrag = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    draggingScroll.current = false;
    updateFollowState(e.nativeEvent.contentOffset.y);
  }, [updateFollowState]);

  const handleMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    draggingScroll.current = false;
    updateFollowState(e.nativeEvent.contentOffset.y);
  }, [updateFollowState]);

  const handleContentSizeChange = useCallback((_w: number, h: number) => {
    const grew = h > prevContentHeight.current + 2;
    prevContentHeight.current = h;
    contentHeight.current = h;
    if (tuiMode) return;
    if (!grew) return;
    if (draggingScroll.current || pinching.current || userScrolledAway.current || !followTail.current) return;
    programmaticScroll.current = true;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
      setTimeout(() => { programmaticScroll.current = false; }, 50);
    });
  }, [tuiMode]);

  const handleLayout = useCallback((e: { nativeEvent: { layout: { height: number } } }) => {
    const h = e.nativeEvent.layout.height;
    viewportHeight.current = h;
    setViewportHeightPx(h);
  }, []);

  const lastPinchApplyAt = useRef(0);

  const beginPinch = useCallback(() => {
    pinching.current = true;
    pinchBaseSize.current = localFontSize;
    lastPinchApplyAt.current = 0;
  }, [localFontSize]);

  const applyPinchScale = useCallback((scale: number) => {
    const now = Date.now();
    if (now - lastPinchApplyAt.current < 50) return;
    lastPinchApplyAt.current = now;
    const next = Math.min(22, Math.max(10, Math.round(pinchBaseSize.current * scale)));
    setLocalFontSize(next);
  }, []);

  const commitPinch = useCallback((scale: number) => {
    const next = Math.min(22, Math.max(10, Math.round(pinchBaseSize.current * scale)));
    setLocalFontSize(next);
    void setFontSize(next);
    pinching.current = false;
  }, [setFontSize]);

  const pinchGesture = useMemo(() => {
    return Gesture.Pinch()
      .onBegin(() => {
        'worklet';
        runOnJS(beginPinch)();
      })
      .onUpdate((e) => {
        'worklet';
        runOnJS(applyPinchScale)(e.scale);
      })
      .onEnd((e) => {
        'worklet';
        runOnJS(commitPinch)(e.scale);
      });
  }, [beginPinch, applyPinchScale, commitPinch]);

  const tuiPanGesture = useMemo(() => Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-28, 28])
    .onEnd((e) => {
      'worklet';
      const dy = e.translationY;
      const vy = e.velocityY;
      if (Math.abs(dy) < 18 && Math.abs(vy) < 280) return;
      if (dy > 0 || vy > 280) {
        runOnJS(sendRemoteScroll)(Math.abs(dy) > 80 || Math.abs(vy) > 900 ? 'pgup' : 'up');
      } else if (dy < 0 || vy < -280) {
        runOnJS(sendRemoteScroll)(Math.abs(dy) > 80 || Math.abs(vy) > 900 ? 'pgdn' : 'down');
      }
    }), [sendRemoteScroll]);

  // Pinch must not block the native ScrollView pan (1 finger).
  const scrollGesture = useMemo(() => Gesture.Native(), []);
  const composedGestures = useMemo(() => {
    if (tuiMode && onScrollKey) {
      return Gesture.Simultaneous(pinchGesture, tuiPanGesture);
    }
    return Gesture.Simultaneous(scrollGesture, pinchGesture);
  }, [tuiMode, onScrollKey, scrollGesture, pinchGesture, tuiPanGesture]);

  const selectionPan = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => selectionMode,
      onMoveShouldSetPanResponder: () => selectionMode,
      onPanResponderGrant: (e) => {
        const pos = mapTouch(e.nativeEvent.locationX, e.nativeEvent.locationY);
        anchorRef.current = pos;
        setSelection({ anchor: pos, focus: pos });
      },
      onPanResponderMove: (e) => {
        const anchor = anchorRef.current;
        if (!anchor) return;
        setSelection({
          anchor,
          focus: mapTouch(e.nativeEvent.locationX, e.nativeEvent.locationY),
        });
      },
      onPanResponderRelease: () => {
        anchorRef.current = null;
      },
    }),
    [selectionMode, mapTouch],
  );

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((v) => {
      if (v) setSelection(null);
      return !v;
    });
  }, []);

  const handleHorizontalScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    scrollOffsetXRef.current = x;
    if (!hasSidebar) return;
    const sidebarX = Math.max(0, LEFT_INSET + primaryColumns * advance - windowWidth * 0.35);
    if (x > sidebarX) {
      userPannedHorizontal.current = true;
      setSidebarOpen(true);
    } else if (x < 4) {
      userPannedHorizontal.current = false;
      setSidebarOpen(false);
    }
  }, [hasSidebar, primaryColumns, advance, windowWidth]);

  const scrollToSidebar = useCallback(() => {
    setSidebarOpen(true);
    userPannedHorizontal.current = true;
    requestAnimationFrame(() => {
      hScrollRef.current?.scrollTo({
        x: Math.max(0, LEFT_INSET + primaryColumns * advance),
        y: 0,
        animated: true,
      });
    });
  }, [primaryColumns, advance]);

  const scrollToPrimary = useCallback(() => {
    setSidebarOpen(false);
    userPannedHorizontal.current = false;
    hScrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setSelectionMode(false);
  }, []);

  const canvasHeight = tuiMode && viewportHeightPx > 0
    ? Math.max(contentHeightPx, viewportHeightPx)
    : contentHeightPx;

  const canvas = (
    <TerminalCanvas
      renderRows={renderRows}
      lineIds={lineIds}
      cursor={cursor}
      cols={cols}
      maxRenderedColumns={maxRenderedColumns}
      fontSize={renderFontSize}
      width={canvasWidth}
      height={canvasHeight}
      primaryColumns={primaryColumns}
      columnLimit={columnLimit}
      cellAdvance={advance}
      clipWidth={drawClipWidth}
      showSidebarDivider={showSidebarDivider}
      rowOffset={0}
      selection={selection}
      themeColors={themeColors}
    />
  );

  const clippedCanvas = (
    <View style={[styles.clipWrap, { width: windowWidth }]}>
      {canvas}
    </View>
  );

  const bodyInner = horizontalScroll ? (
    <ScrollView
      ref={hScrollRef}
      horizontal
      showsHorizontalScrollIndicator
      bounces={false}
      scrollEnabled={!selectionMode}
      onScroll={handleHorizontalScroll}
      scrollEventThrottle={32}
      nestedScrollEnabled
      style={{ width: windowWidth }}
      contentContainerStyle={{ width: canvasWidth }}
    >
      <View
        style={{ width: canvasWidth, height: contentHeightPx }}
        {...(selectionMode ? selectionPan.panHandlers : {})}
      >
        {clippedCanvas}
      </View>
    </ScrollView>
  ) : (
    <View
      style={{ width: windowWidth, height: tuiMode ? viewportHeightPx || undefined : contentHeightPx }}
      {...(selectionMode ? selectionPan.panHandlers : {})}
    >
      {clippedCanvas}
    </View>
  );

  const terminalBody = tuiMode ? (
    <GestureDetector gesture={composedGestures}>
      <View style={styles.vScroll} onLayout={handleLayout}>
        {bodyInner}
      </View>
    </GestureDetector>
  ) : (
    <GestureDetector gesture={composedGestures}>
      <ScrollView
        ref={scrollRef}
        style={styles.vScroll}
        contentContainerStyle={{ minHeight: Math.max(contentHeightPx, viewportHeightPx + 1) }}
        showsVerticalScrollIndicator
        indicatorStyle="white"
        bounces
        alwaysBounceVertical
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        keyboardDismissMode="interactive"
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        keyboardShouldPersistTaps="always"
        scrollEnabled={!selectionMode}
        nestedScrollEnabled
        accessibilityLabel="Terminal output"
      >
        {bodyInner}
      </ScrollView>
    </GestureDetector>
  );

  return (
    <View style={styles.wrap}>
      {terminalBody}

      <TerminalCursorOverlay
        cursor={cursor}
        advance={advance}
        lineHeight={lineHeight}
        scrollOffsetY={scrollOffsetY}
        visibleRowStart={visibleRowRange.start}
        visibleRowEnd={visibleRowRange.end}
        columnLimit={columnLimit}
        reduceMotion={reduceMotion}
        themeColors={themeColors}
      />

      {showSidebarHint && !sidebarOpen && !selectionMode && (
        <Pressable
          style={({ pressed }) => [
            styles.sidebarBtn,
            tuiMode && styles.sidebarBtnTui,
            pressed && styles.pressed,
          ]}
          onPress={scrollToSidebar}
          onLongPress={scrollToPrimary}
          accessibilityRole="button"
          accessibilityLabel="Scorri verso il pannello laterale context e MCP"
        >
          <Text style={styles.sidebarBtnLabel}>context ›</Text>
        </Pressable>
      )}

      <Pressable
        style={({ pressed }) => [styles.selectBtn, selectionMode && styles.selectBtnActive, pressed && styles.pressed]}
        onPress={toggleSelectionMode}
        accessibilityRole="button"
        accessibilityLabel={selectionMode ? 'Exit selection mode' : 'Enter selection mode'}
      >
        <Text style={[styles.selectBtnLabel, selectionMode && styles.selectBtnLabelActive]}>⎘</Text>
      </Pressable>

      {showScrollBtn && !selectionMode && (
        <Pressable
          style={({ pressed }) => [styles.scrollBtn, pressed && styles.scrollBtnPressed]}
          onPress={() => scrollToBottom(true)}
          accessibilityRole="button"
          accessibilityLabel="Scroll terminal to bottom"
        >
          <Text style={styles.scrollBtnIcon}>↓</Text>
        </Pressable>
      )}

      <TerminalCopyBar
        lines={lines}
        selection={selection}
        selectionMode={selectionMode}
        onClear={clearSelection}
      />

      {__DEV__ && hasSidebar && (
        <View style={styles.debugHud} pointerEvents="none">
          <Text style={styles.debugHudText}>
            {`font ${renderFontSize} · vis ${displayColumns} · clip ${primaryColumns}/${cols}${sidebarOpen ? ' · ctx' : ''}`}
          </Text>
        </View>
      )}
    </View>
  );
});

export default TerminalView;

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: Colors.terminalBg,
    overflow: 'hidden',
  },
  vScroll: {
    flex: 1,
  },
  clipWrap: {
    overflow: 'hidden',
  },
  selectBtn: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md + 44,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.panelHeader,
    borderWidth: 1,
    borderColor: Colors.panelBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  selectBtnLabel: {
    color: Colors.terminalFg,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  selectBtnLabelActive: {
    color: Colors.background,
  },
  scrollBtn: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.panelHeader,
    borderWidth: 1,
    borderColor: Colors.panelBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBtnPressed: {
    opacity: 0.8,
  },
  scrollBtnIcon: {
    color: Colors.terminalFg,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginTop: -1,
  },
  pressed: {
    opacity: 0.75,
  },
  sidebarBtn: {
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    backgroundColor: Colors.panelHeader,
    borderWidth: 1,
    borderColor: Colors.panelBorder,
    opacity: 0.92,
  },
  sidebarBtnTui: {
    right: undefined,
    left: Spacing.md,
    top: undefined,
    bottom: Spacing.md + 52,
  },
  sidebarBtnLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  debugHud: {
    position: 'absolute',
    left: Spacing.sm,
    top: Spacing.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    borderColor: Colors.panelBorder,
  },
  debugHudText: {
    color: Colors.accent,
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
