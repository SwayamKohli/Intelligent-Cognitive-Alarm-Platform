import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';

// 1. Tell the OS how to handle alerts when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true, 
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

/**
 * Requests native OS permissions for alarms and notifications.
 */
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('Must use physical device or native emulator for background alarms.');
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert(
      'Permission Required',
      'You must enable notifications in your phone settings so the alarm can wake you up when the app is closed.'
    );
    return false;
  }

  // Configure custom Android Alarm Channel for high-priority sound
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alarm-channel', {
      name: 'Cognitive Alarms',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#FFD700',
      sound: 'alarm-sound.mp3',
      bypassDnd: true, // Attempt to bypass Do Not Disturb for alarms
    });
  }

  return true;
}

/**
 * Schedules a native OS background alarm for a specific HH:MM time.
 */
export async function scheduleNativeAlarmNotification(
  alarmId: string,
  label: string,
  timeString: string // Format: "HH:MM:SS" or "HH:MM"
) {
  try {
    const [hoursStr, minutesStr] = timeString.split(':');
    const targetHours = parseInt(hoursStr, 10);
    const targetMinutes = parseInt(minutesStr, 10);

    // Calculate next occurrence Date object
    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(targetHours, targetMinutes, 0, 0);

    // If the time has already passed today, schedule it for tomorrow
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const secondsUntilTrigger = Math.max(1, Math.floor((triggerDate.getTime() - now.getTime()) / 1000));

    // Schedule the notification with exact seconds
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ WAKE UP! Cognitive Alarm',
        body: `Alarm: "${label}". Tap now to solve your cognitive challenge!`,
        sound: Platform.OS === 'ios' ? 'alarm-sound.mp3' : 'default',
        data: { alarmId, label },
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilTrigger,
        repeats: false,
      },
    });

    console.log(`[OS Notification] Scheduled alarm "${label}" (${alarmId}) for ${triggerDate.toLocaleTimeString()} -> Notification ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule OS background notification:', error);
    return null;
  }
}

/**
 * Cancels all scheduled OS notifications (used when deleting/resetting alarms).
 */
export async function cancelAllNativeAlarms() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}