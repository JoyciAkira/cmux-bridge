import { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useMacsStore, MacConnection } from '../../src/store/macs';
import { getRelayClient } from '../../src/services/relay';
import { useRelayStatus } from '../../src/hooks/useRelayStatus';
import MacCard from '../../src/components/ui/MacCard';
import { Colors, Spacing, FontSizes, Radii } from '../../src/theme';
import { useBiometric } from '../../src/hooks/useBiometric';

export default function MacsScreen() {
  const macs = useMacsStore((s) => s.macs);
  const remove = useMacsStore((s) => s.remove);
  const { prompt } = useBiometric();
  const [connecting, setConnecting] = useState<string | null>(null);

  const handlePress = useCallback(
    async (macId: string, host: string, port: number) => {
      const bio = await prompt('Authenticate to connect to your Mac');
      if (bio === 'cancelled') return; // user explicitly cancelled — respect it
      // 'success' or 'unsupported' both proceed

      setConnecting(macId);
      const client = getRelayClient(macId);
      client.connect(host, port);
      router.push(`/mac/${macId}`);
      setConnecting(null);
    },
    [prompt],
  );

  const handleLongPress = useCallback(
    (macId: string, label: string) => {
      Alert.alert(
        label,
        'What would you like to do?',
        [
          { text: 'Remove', style: 'destructive', onPress: () => remove(macId) },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    },
    [remove],
  );

  if (macs.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>⌘</Text>
        <Text style={styles.emptyTitle}>No Macs added yet</Text>
        <Text style={styles.emptyBody}>
          Add your Mac's Tailscale IP and port to connect.
        </Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/onboarding')}
          accessibilityRole="button"
        >
          <Text style={styles.addBtnLabel}>+ Add Mac</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={macs}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <MacCardRow
            item={item}
            connecting={connecting === item.id}
            onPress={() => handlePress(item.id, item.host, item.port)}
            onLongPress={() => handleLongPress(item.id, item.label)}
          />
        )}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addRowBtn}
            onPress={() => router.push('/onboarding')}
            accessibilityRole="button"
          >
            <Text style={styles.addRowLabel}>+ Add another Mac</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

function MacCardRow({
  item, connecting, onPress, onLongPress,
}: {
  item: MacConnection;
  connecting: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const liveStatus = useRelayStatus(item.id);
  return (
    <MacCard
      mac={item}
      status={connecting ? 'connecting' : liveStatus}
      onPress={onPress}
      onLongPress={onLongPress}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md, gap: Spacing.sm },
  sep: { height: Spacing.sm },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
  emptyIcon: { fontSize: 48, color: Colors.accent },
  emptyTitle: { color: Colors.text, fontSize: FontSizes.xl, fontWeight: '700', textAlign: 'center' },
  emptyBody: { color: Colors.textMuted, fontSize: FontSizes.md, textAlign: 'center', lineHeight: 22 },
  addBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.accent,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  addBtnLabel: { color: Colors.background, fontSize: FontSizes.md, fontWeight: '700' },
  addRowBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  addRowLabel: { color: Colors.accent, fontSize: FontSizes.md },
});
