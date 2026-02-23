// components/NotificationsSection.tsx
// Drop directly into your SettingsScreen ScrollView.
//
// <NotificationsSection theme={theme} />

import {
    applyNotifPrefs,
    loadNotifPrefs,
    NotifPrefs,
    requestNotifPermission,
    saveNotifPrefs,
    setupNotifChannel,
} from "@/services/notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  theme: any;
}

type PickerTarget = "daily" | "streak" | null;

export default function NotificationsSection({ theme }: Props) {
  const [prefs, setPrefs] = useState<NotifPrefs>({
    dailyReminderEnabled: false,
    dailyReminderHour: 7,
    dailyReminderMinute: 0,
    streakReminderEnabled: false,
    streakReminderHour: 20,
    streakReminderMinute: 0,
  });

  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerDate, setPickerDate] = useState(new Date());

  useEffect(() => {
    loadNotifPrefs().then(setPrefs);
  }, []);

  // Save prefs and re-apply scheduling in one call
  const persist = async (updated: NotifPrefs) => {
    setPrefs(updated);
    await saveNotifPrefs(updated);
    await applyNotifPrefs(updated);
  };

  const handleToggle = async (
    key: "dailyReminderEnabled" | "streakReminderEnabled",
    value: boolean,
  ) => {
    if (value) {
      const granted = await requestNotifPermission();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          Platform.OS === "ios"
            ? "Go to Settings → Notifications → Bhakti Jap and enable notifications."
            : "Go to Settings → Apps → Bhakti Jap → Notifications and enable them.",
          [{ text: "OK" }],
        );
        return;
      }
      await setupNotifChannel(); // no-op on iOS
    }
    await persist({ ...prefs, [key]: value });
  };

  const openPicker = (target: PickerTarget) => {
    const hour =
      target === "daily" ? prefs.dailyReminderHour : prefs.streakReminderHour;
    const minute =
      target === "daily"
        ? prefs.dailyReminderMinute
        : prefs.streakReminderMinute;
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    setPickerDate(d);
    setPickerTarget(target);
  };

  const handlePickerChange = async (_: any, selected?: Date) => {
    if (Platform.OS === "android") setPickerTarget(null); // auto-close on Android
    if (!selected || !pickerTarget) return;

    const h = selected.getHours();
    const m = selected.getMinutes();

    const updated: NotifPrefs =
      pickerTarget === "daily"
        ? { ...prefs, dailyReminderHour: h, dailyReminderMinute: m }
        : { ...prefs, streakReminderHour: h, streakReminderMinute: m };

    setPickerDate(selected);
    await persist(updated);
  };

  const formatTime = (hour: number, minute: number): string => {
    const h = hour % 12 || 12;
    const m = minute.toString().padStart(2, "0");
    const ampm = hour < 12 ? "AM" : "PM";
    return `${h}:${m} ${ampm}`;
  };

  return (
    <>
      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
        Notifications
      </Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.ringTrack + "35",
          },
        ]}
      >
        {/* ── Daily Reminder ── */}
        <View
          style={[styles.row, { borderBottomColor: theme.ringTrack + "35" }]}
        >
          <View style={styles.left}>
            <View
              style={[styles.icon, { backgroundColor: theme.accent + "20" }]}
            >
              <Text style={styles.iconText}>🕉</Text>
            </View>
            <View style={styles.labelGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Daily Reminder
              </Text>
              <Text style={[styles.sub, { color: theme.textMuted }]}>
                Remind me to chant every day
              </Text>
            </View>
          </View>
          <Switch
            value={prefs.dailyReminderEnabled}
            onValueChange={(v) => handleToggle("dailyReminderEnabled", v)}
            trackColor={{ false: theme.ringTrack, true: theme.accent }}
            thumbColor="#fff"
          />
        </View>

        {/* Daily time — only visible when enabled */}
        {prefs.dailyReminderEnabled && (
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: theme.ringTrack + "35" }]}
            onPress={() => openPicker("daily")}
            activeOpacity={0.7}
          >
            <View style={styles.left}>
              <View style={[styles.icon, { backgroundColor: "#4CAF5020" }]}>
                <Text style={styles.iconText}>⏰</Text>
              </View>
              <View style={styles.labelGroup}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Reminder Time
                </Text>
                <Text style={[styles.sub, { color: theme.textMuted }]}>
                  Tap to change
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.timeBadge,
                {
                  backgroundColor: theme.accent + "18",
                  borderColor: theme.accent + "40",
                },
              ]}
            >
              <Text style={[styles.timeBadgeText, { color: theme.accent }]}>
                {formatTime(prefs.dailyReminderHour, prefs.dailyReminderMinute)}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Streak Reminder ── */}
        <View
          style={[
            styles.row,
            {
              borderBottomColor: prefs.streakReminderEnabled
                ? theme.ringTrack + "35"
                : "transparent",
            },
          ]}
        >
          <View style={styles.left}>
            <View style={[styles.icon, { backgroundColor: "#FF572220" }]}>
              <Text style={styles.iconText}>🔥</Text>
            </View>
            <View style={styles.labelGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Streak Reminder
              </Text>
              <Text style={[styles.sub, { color: theme.textMuted }]}>
                Nudge if I haven't chanted yet
              </Text>
            </View>
          </View>
          <Switch
            value={prefs.streakReminderEnabled}
            onValueChange={(v) => handleToggle("streakReminderEnabled", v)}
            trackColor={{ false: theme.ringTrack, true: theme.accent }}
            thumbColor="#fff"
          />
        </View>

        {/* Streak time — only visible when enabled */}
        {prefs.streakReminderEnabled && (
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: "transparent" }]}
            onPress={() => openPicker("streak")}
            activeOpacity={0.7}
          >
            <View style={styles.left}>
              <View style={[styles.icon, { backgroundColor: "#4CAF5020" }]}>
                <Text style={styles.iconText}>⏰</Text>
              </View>
              <View style={styles.labelGroup}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Reminder Time
                </Text>
                <Text style={[styles.sub, { color: theme.textMuted }]}>
                  Tap to change
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.timeBadge,
                {
                  backgroundColor: theme.accent + "18",
                  borderColor: theme.accent + "40",
                },
              ]}
            >
              <Text style={[styles.timeBadgeText, { color: theme.accent }]}>
                {formatTime(
                  prefs.streakReminderHour,
                  prefs.streakReminderMinute,
                )}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Native time picker */}
      {pickerTarget !== null && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          is24Hour={false}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handlePickerChange}
        />
      )}

      {/* ── DEV ONLY: instant test button — remove before shipping ── */}
      {/* <TouchableOpacity
        style={[styles.testBtn, { borderColor: theme.ringTrack + "60" }]}
        onPress={async () => {
          const granted = await requestNotifPermission();
          if (!granted) {
            Alert.alert("Permission denied", "Enable notifications first.");
            return;
          }
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "🕉 Test Notification",
              body: "Notifications are working! Jai Shri Ram 🙏",
              sound: "default",
            },
            trigger: null, // fires instantly
          });
          Alert.alert("Sent!", "Check your notification tray.");
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.testBtnText, { color: theme.textMuted }]}>
          🔔 Send Test Notification
        </Text>
      </TouchableOpacity> */}
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 18 },
  labelGroup: { flex: 1 },
  label: { fontSize: 15, fontWeight: "500", marginBottom: 1 },
  sub: { fontSize: 12 },
  timeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  timeBadgeText: { fontSize: 14, fontWeight: "700" },
  testBtn: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  testBtnText: { fontSize: 14, fontWeight: "500" },
});
