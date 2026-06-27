import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { MacConnection } from '../../store/macs';
import { RelayStatus } from '../../services/relay';
import StatusBadge from './StatusBadge';
import { Colors, Spacing, Radii, FontSizes } from '../../theme';

interface Props {
  mac: MacConnection;
  status: RelayStatus;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function MacCard({ mac, status, onPress, onLongPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`Connect to ${mac.label}`}
    >
      <View style={styles.iconBox}>
        <Text style={styles.icon}>⌘</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label} numberOfLines={1}>{mac.label}</Text>
        <Text style={styles.host} numberOfLines={1}>{mac.host}:{mac.port}</Text>
      </View>
      <StatusBadge status={status} />
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
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: FontSizes.xl,
    color: Colors.accent,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  host: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontFamily: 'monospace',
  },
});
