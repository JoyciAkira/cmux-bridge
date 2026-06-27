import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing, Radii } from '../../theme';

type Status = 'connected' | 'connecting' | 'disconnected' | 'error' | 'active' | 'idle';

const STATUS_COLOR: Record<Status, string> = {
  connected:    Colors.success,
  connecting:   Colors.warning,
  disconnected: Colors.textDim,
  error:        Colors.error,
  active:       Colors.success,
  idle:         Colors.textMuted,
};

const STATUS_LABEL: Record<Status, string> = {
  connected:    'connected',
  connecting:   'connecting…',
  disconnected: 'offline',
  error:        'error',
  active:       'active',
  idle:         'idle',
};

interface Props {
  status: Status;
}

export default function StatusBadge({ status }: Props) {
  const color = STATUS_COLOR[status];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
});
