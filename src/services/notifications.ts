import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { AgentEvent } from './relay';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('agent-events', {
      name: 'Agent Events',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

const EVENT_LABELS: Record<AgentEvent, { title: string; body: string }> = {
  agent_complete: { title: '✅ Agent complete', body: 'Task finished successfully.' },
  agent_error:    { title: '❌ Agent error',    body: 'An error occurred — tap to review.' },
  awaiting_input: { title: '⏸ Awaiting input',  body: 'Agent is waiting for your response.' },
};

export async function scheduleLocalNotification(
  event: AgentEvent,
  workspaceId: string,
  message?: string,
): Promise<void> {
  const { title, body } = EVENT_LABELS[event];
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: message ?? body,
      data: { workspaceId, event },
    },
    trigger: null,   // deliver immediately
  });
}
