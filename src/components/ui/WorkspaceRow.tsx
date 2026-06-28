import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { WorkspaceWithSurfaces } from '../../hooks/useRelay';
import { Colors, Spacing, Radii, FontSizes } from '../../theme';

interface Props {
  workspace: WorkspaceWithSurfaces;
  onPress: () => void;
}

export default function WorkspaceRow({ workspace, onPress }: Props) {
  const surfaceCount = workspace.surfaces.length;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Open workspace ${workspace.name}`}
    >
      <View style={styles.indexBox}>
        <Text style={styles.index}>{workspace.index + 1}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{workspace.name}</Text>
        <Text style={styles.meta}>
          {surfaceCount} surface{surfaceCount !== 1 ? 's' : ''}
        </Text>
      </View>
      {workspace.agentActive && <View style={styles.agentDot} />}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  indexBox: {
    width: 28,
    height: 28,
    borderRadius: Radii.sm,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  index: { color: Colors.accent, fontSize: FontSizes.sm, fontWeight: '700', fontFamily: 'monospace' },
  info: { flex: 1, gap: 2 },
  name: { color: Colors.text, fontSize: FontSizes.md, fontWeight: '600' },
  meta: { color: Colors.textMuted, fontSize: FontSizes.sm },
  chevron: { color: Colors.textDim, fontSize: 20, fontWeight: '300' },
  agentDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginRight: -4,
  },
});
