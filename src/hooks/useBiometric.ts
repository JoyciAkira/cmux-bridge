import { useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricResult = 'success' | 'cancelled' | 'unsupported';

export function useBiometric() {
  const prompt = useCallback(async (reason: string): Promise<BiometricResult> => {
    const supported = await LocalAuthentication.hasHardwareAsync();
    if (!supported) return 'unsupported';

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return 'unsupported';

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });

    return result.success ? 'success' : 'cancelled';
  }, []);

  return { prompt };
}
