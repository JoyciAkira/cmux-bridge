import { Redirect, Stack } from 'expo-router';

/** DEV routes — not linked in production navigation. */
export default function DevLayout() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0d0d0d' } }}>
      <Stack.Screen name="terminal" />
    </Stack>
  );
}
