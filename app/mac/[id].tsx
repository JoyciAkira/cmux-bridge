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
import { Colors, Spacing, FontSizes } from '../../src/theme';

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
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
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
                // If single surface, go directly; else show surfaces inline
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
                    accessibilityLabel={`Open surface ${s.name}`}
                  >
                    <Text style={styles.surfaceName}>{s.name}</Text>
                    <Text style={styles.surfaceDim}>{s.cols}×{s.rows}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          status === 'connected' ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No workspaces found.</Text>
              <Text style={styles.emptyHint}>Open cmux on your Mac to create one.</Text>
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
  list: { padding: Spacing.md },
  workspaceBlock: { gap: Spacing.xs },
  surfaces: { paddingLeft: Spacing.md, gap: Spacing.xs },
  surfaceBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  surfaceName: { color: Colors.text, fontSize: FontSizes.sm },
  surfaceDim: { color: Colors.textMuted, fontSize: FontSizes.sm, fontFamily: 'monospace' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: Colors.textMuted, fontSize: FontSizes.md },
  emptyHint: { color: Colors.textDim, fontSize: FontSizes.sm, marginTop: 4 },
  errorText: { color: Colors.error, fontSize: FontSizes.md },
});
