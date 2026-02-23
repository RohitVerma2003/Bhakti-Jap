// services/notifications.ts
// Local notifications — works 100% offline.
// The OS schedules and fires these independently of your app or network.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const NOTIF_PREFS_KEY = "BHAKTI_NOTIF_PREFS";

// Stable IDs so we can cancel/replace without duplicates
const ID_DAILY_REMINDER = "bhakti_daily_reminder";
const ID_STREAK_REMINDER = "bhakti_streak_reminder";

export interface NotifPrefs {
  dailyReminderEnabled: boolean;
  dailyReminderHour: number; // 0–23
  dailyReminderMinute: number; // 0–59

  streakReminderEnabled: boolean;
  streakReminderHour: number;
  streakReminderMinute: number;
}

const DEFAULT_PREFS: NotifPrefs = {
  dailyReminderEnabled: false,
  dailyReminderHour: 7,
  dailyReminderMinute: 0,

  streakReminderEnabled: false,
  streakReminderHour: 20, // 8 PM default — nudge before bed
  streakReminderMinute: 0,
};

// ─── Prefs storage ────────────────────────────────────────────────────────────

export async function loadNotifPrefs(): Promise<NotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function saveNotifPrefs(prefs: NotifPrefs): Promise<void> {
  await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
}

// ─── Permission ───────────────────────────────────────────────────────────────

export async function requestNotifPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ─── Android channel ──────────────────────────────────────────────────────────
// Must exist before scheduling on Android 8+. Safe to call repeatedly.

export async function setupNotifChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("bhakti_reminders", {
    name: "Devotion Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF9933",
  });
}

// ─── Foreground display ───────────────────────────────────────────────────────
// Call once at app root so alerts show even while app is open.

export function setupNotifHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function scheduleDailyNotif(
  id: string,
  hour: number,
  minute: number,
  title: string,
  body: string,
): Promise<void> {
  // Always cancel first to avoid duplicates when user changes the time
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title,
      body,
      sound: "default",
      ...(Platform.OS === "android" && { channelId: "bhakti_reminders" }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

async function cancelNotif(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sync all scheduled notifications with current prefs.
 * Call on app startup and whenever prefs change.
 */
export async function applyNotifPrefs(prefs: NotifPrefs): Promise<void> {
  if (prefs.dailyReminderEnabled) {
    await scheduleDailyNotif(
      ID_DAILY_REMINDER,
      prefs.dailyReminderHour,
      prefs.dailyReminderMinute,
      "🕉 Time for Jap",
      "Your daily devotion awaits. Begin your mantra practice.",
    );
  } else {
    await cancelNotif(ID_DAILY_REMINDER);
  }

  if (prefs.streakReminderEnabled) {
    await scheduleDailyNotif(
      ID_STREAK_REMINDER,
      prefs.streakReminderHour,
      prefs.streakReminderMinute,
      "🔥 Don't break your streak!",
      "You haven't chanted today. Keep your streak alive 🙏",
    );
  } else {
    await cancelNotif(ID_STREAK_REMINDER);
  }
}
