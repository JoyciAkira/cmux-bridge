import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { WorkspaceItem } from '../../services/relay';
import StatusBadge from './StatusBadge';
import { Colors, Spacing, Radii, FontSizes } from '../../theme';

interface Props {
  workspace: WorkspaceItem;
  onPress: () => void;
}

export default function WorkspaceRow({ workspace, onPress }: Props) {
  const surfaceCount = workspace.surfaces.length;
  const ago = formatAgo(workspace.lastActivity);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open workspace ${workspace.name}`}
    >
      <View style={styles.left}>
        <Text style={styles.name} numberOfLines={1}>{workspace.name}</Text>
        <Text style={styles.meta}>
          {surfaceCount} surface{surfaceCount !== 1 ? 's' : ''} · {ago}
        </Text>
      </View>
      <StatusBadge status={workspace.status} />
    </TouchableOpacity>
  );
}

function formatAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  left: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  meta: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
  },
});
