import { useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { useMacsStore } from '../../src/store/macs';
import { useRelay } from '../../src/hooks/useRelay';
import WorkspaceRow from '../../src/components/ui/WorkspaceRow';
import StatusBadge from '../../src/components/ui/StatusBadge';
import { Colors, Spacing, FontSizes, Radii } from '../../src/theme';

export default function WorkspacesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mac = useMacsStore((s) => s.macs.find((m) => m.id === id));
  const navigation = useNavigation();

  const { status, workspaces, refresh } = useRelay(
    id,
    mac?.host ?? '',
    mac?.port ?? 4399,
  );

  useEffect(() => {
    if (mac) navigation.setOptions({ title: mac.label });
  }, [mac, navigation]);

  const handleSurfacePress = useCallback(
    (workspaceId: string, surfaceId: string) => {
      router.push(`/mac/${id}/${surfaceId}?workspaceId=${workspaceId}`);
    },
    [id],
  );

  if (!mac) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Mac not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.host}>{mac.host}:{mac.port}</Text>
        <StatusBadge status={status} />
      </View>

      <FlatList
        data={workspaces}
        keyExtractor={(w) => w.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={status === 'connecting'}
            onRefresh={refresh}
            tintColor={Colors.accent}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.workspaceBlock}>
            <WorkspaceRow
              workspace={item}
              onPress={() => {
                if (item.surfaces.length === 1) {
                  handleSurfacePress(item.id, item.surfaces[0].id);
                }
              }}
            />
            {item.surfaces.length > 1 && (
              <View style={styles.surfaces}>
                {item.surfaces.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.surfaceBtn}
                    onPress={() => handleSurfacePress(item.id, s.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open surface ${s.title}`}
                  >
                    <View style={styles.surfaceLeft}>
                      <Text style={styles.surfaceIndex}>#{s.index}</Text>
                      <Text style={styles.surfaceName} numberOfLines={1}>{s.title}</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          status === 'connected' ? (
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>⬚</Text>
              <Text style={styles.emptyText}>No workspaces found</Text>
              <Text style={styles.emptyHint}>Open a workspace in cmux on your Mac</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  host: { color: Colors.textMuted, fontSize: FontSizes.sm, fontFamily: 'monospace' },
  list: { padding: Spacing.md, gap: Spacing.sm },
  workspaceBlock: { gap: 2 },
  surfaces: { marginLeft: Spacing.lg, gap: 2 },
  surfaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 0,
  },
  surfaceLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  surfaceIndex: { color: Colors.textDim, fontSize: FontSizes.sm, fontFamily: 'monospace', width: 20 },
  surfaceName: { color: Colors.textMuted, fontSize: FontSizes.sm, flex: 1 },
  chevron: { color: Colors.textDim, fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyIcon: { fontSize: 40, color: Colors.textDim },
  emptyText: { color: Colors.textMuted, fontSize: FontSizes.md, fontWeight: '600' },
  emptyHint: { color: Colors.textDim, fontSize: FontSizes.sm },
  errorText: { color: Colors.error, fontSize: FontSizes.md },
});
