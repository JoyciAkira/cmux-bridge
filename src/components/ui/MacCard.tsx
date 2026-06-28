import { useRef, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated } from 'react-native';
import { MacConnection } from '../../store/macs';
import { RelayStatus } from '../../services/relay';
import { Colors, Spacing, Radii, FontSizes } from '../../theme';

interface Props {
  mac: MacConnection;
  status: RelayStatus;
  onPress: () => void;
  onLongPress?: () => void;
}

const STATUS_COLOR: Record<RelayStatus, string> = {
  connected: Colors.success,
  connecting: Colors.warning,
  disconnected: Colors.textDim,
  error: Colors.error,
};

const STATUS_LABEL: Record<RelayStatus, string> = {
  connected: 'connected',
  connecting: 'connecting…',
  disconnected: 'offline',
  error: 'error',
};

export default function MacCard({ mac, status, onPress, onLongPress }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'connecting') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulse.setValue(1);
    }
  }, [status, pulse]);

  const color = STATUS_COLOR[status];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Connect to ${mac.label}`}
    >
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={styles.iconBox}>
        <Text style={styles.icon}>⌘</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label} numberOfLines={1}>{mac.label}</Text>
        <Text style={styles.host} numberOfLines={1}>{mac.host}:{mac.port}</Text>
      </View>
      <View style={styles.statusRow}>
        <Animated.View style={[styles.dot, { backgroundColor: color, opacity: pulse }]} />
        <Text style={[styles.statusLabel, { color }]}>{STATUS_LABEL[status]}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    gap: Spacing.md,
    paddingRight: Spacing.md,
  },
  accent: {
    width: 3,
    alignSelf: 'stretch',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: FontSizes.lg, color: Colors.accent },
  info: { flex: 1, gap: 2, paddingVertical: Spacing.md },
  label: { color: Colors.text, fontSize: FontSizes.md, fontWeight: '600' },
  host: { color: Colors.textMuted, fontSize: FontSizes.sm, fontFamily: 'monospace' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: FontSizes.sm, fontWeight: '500' },
});
