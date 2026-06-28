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
    // #region agent log
    fetch('http://127.0.0.1:7906/ingest/a0caf8cc-7ce6-41cd-831e-76d0b1f2904e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8eb336'},body:JSON.stringify({sessionId:'8eb336',location:'app/_layout.tsx:14',message:'RootLayout mounted — starting load + registerForPushNotifications',data:{},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    load().then(() => {
      // #region agent log
      fetch('http://127.0.0.1:7906/ingest/a0caf8cc-7ce6-41cd-831e-76d0b1f2904e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8eb336'},body:JSON.stringify({sessionId:'8eb336',location:'app/_layout.tsx:load.then',message:'useMacsStore.load() completed',data:{},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    }).catch((err: unknown) => {
      // #region agent log
      fetch('http://127.0.0.1:7906/ingest/a0caf8cc-7ce6-41cd-831e-76d0b1f2904e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8eb336'},body:JSON.stringify({sessionId:'8eb336',location:'app/_layout.tsx:load.catch',message:'useMacsStore.load() FAILED',data:{error:String(err)},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    });
    loadPrefs();
    registerForPushNotifications().then((token) => {
      // #region agent log
      fetch('http://127.0.0.1:7906/ingest/a0caf8cc-7ce6-41cd-831e-76d0b1f2904e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8eb336'},body:JSON.stringify({sessionId:'8eb336',location:'app/_layout.tsx:push.then',message:'registerForPushNotifications completed',data:{token},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }).catch((err: unknown) => {
      // #region agent log
      fetch('http://127.0.0.1:7906/ingest/a0caf8cc-7ce6-41cd-831e-76d0b1f2904e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8eb336'},body:JSON.stringify({sessionId:'8eb336',location:'app/_layout.tsx:push.catch',message:'registerForPushNotifications FAILED',data:{error:String(err)},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    });
  }, [load, loadPrefs]);

  // #region agent log
  fetch('http://127.0.0.1:7906/ingest/a0caf8cc-7ce6-41cd-831e-76d0b1f2904e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8eb336'},body:JSON.stringify({sessionId:'8eb336',location:'app/_layout.tsx:render',message:'RootLayout render — Stack screens defined',data:{screens:['index','onboarding','tabs','mac/[id]','mac/[id]/[surfaceId]']},timestamp:Date.now(),hypothesisId:'A-D-E'})}).catch(()=>{});
  // #endregion

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
