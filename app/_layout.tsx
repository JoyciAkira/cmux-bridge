import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useMacsStore } from '../src/store/macs';
import { usePrefsStore } from '../src/store/prefs';
import { registerForPushNotifications } from '../src/services/notifications';
import { Colors } from '../src/theme';

export default function RootLayout() {
  const load = useMacsStore((s) => s.load);
  const loadPrefs = usePrefsStore((s) => s.load);

  useEffect(() => {
    load();
    loadPrefs();
    registerForPushNotifications();
  }, [load, loadPrefs]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ title: 'Add Mac', presentation: 'modal' }} />
        <Stack.Screen name="tabs" options={{ headerShown: false }} />
        <Stack.Screen name="mac/[id]" options={{ title: 'Workspaces' }} />
        <Stack.Screen name="mac/[id]/[surfaceId]" options={{ title: 'Terminal' }} />
      </Stack>
    </>
  );
}
