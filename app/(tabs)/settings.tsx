import NotificationsSection from "@/components/NotificationsSection";
import { useTheme } from "@/context/ThemeContext";
import {
  backupToDrive,
  getGoogleAccessToken,
  restoreFromDrive,
} from "@/services/googleBackup";
import {
  loadAppData,
  saveAppData,
  setUserName,
  today,
  updateTheme,
} from "@/storage/japStorage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GOAL_OPTIONS = [108, 216, 324, 540, 1008];

export default function SettingsScreen() {
  const { theme, setThemeName } = useTheme();

  const [userName, setLocalUserName] = useState("");
  const [goal, setGoal] = useState(108);
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);
  const [lifetime, setLifetime] = useState(0);
  const [isDark, setIsDark] = useState(false);

  const [goalDropdownVisible, setGoalDropdownVisible] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const [driveLoading, setDriveLoading] = useState(false);
  const [driveAction, setDriveAction] = useState<"backup" | "restore" | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const load = async () => {
    const data = await loadAppData();
    setLocalUserName(data.userName);
    setGoal(data.globalDailyGoal);
    setStreak(data.streak.current);
    setLongest(data.streak.longest);
    setLifetime(data.counters.reduce((sum, c) => sum + c.lifetimeCount, 0));
    setIsDark(data.theme === "dark");
  };

  const handleGoalSelect = async (value: number) => {
    setGoal(value);
    const data = await loadAppData();
    data.globalDailyGoal = value;
    await saveAppData(data);
    closeGoalDropdown();
  };

  const openGoalDropdown = () => {
    setGoalDropdownVisible(true);
    Animated.spring(dropdownAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeGoalDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setGoalDropdownVisible(false));
  };

  const toggleTheme = async () => {
    const newTheme = isDark ? "saffron" : "dark";
    setIsDark(!isDark);
    setThemeName(newTheme);
    await updateTheme(newTheme);
  };

  const resetToday = async () => {
    Alert.alert(
      "Reset Today?",
      "This will clear today's count for all mantras.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            const data = await loadAppData();
            const date = today();

            data.dailyHistory[date] = 0;
            data.todayTotal = 0;
            data.streak.current -= 1;
            data.counters = data.counters.map((c) => ({
              ...c,
              lifetimeCount: c.lifetimeCount - c.currentCount,
              currentCount: 0,
            }));
            await saveAppData(data);
            load();
          },
        },
      ],
    );
  };

  const resetAll = () => {
    Alert.alert(
      "Reset Everything?",
      "This will permanently erase all your devotion data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset All",
          style: "destructive",
          onPress: async () => {
            const data = await loadAppData();
            data.todayTotal = 0;
            data.dailyHistory = {};
            data.streak = { current: 0, longest: 0, lastCompletedDate: null };
            data.counters = data.counters.map((c) => ({
              ...c,
              currentCount: 0,
              lifetimeCount: 0,
            }));
            await saveAppData(data);
            load();
          },
        },
      ],
    );
  };

  // ─── Backup / Restore ──────────────────────────────────────────────────────
  // getGoogleAccessToken() shows the native account picker sheet.
  // Token is returned directly — no pendingAction pattern needed.

  const handleBackup = async () => {
    try {
      setDriveLoading(true);
      setDriveAction("backup");
      const token = await getGoogleAccessToken();
      if (!token) return; // user cancelled
      await backupToDrive(token);
      Alert.alert(
        "✅ Backup Successful",
        "Your data has been saved to Google Drive.",
      );
    } catch (e: any) {
      Alert.alert("Backup Failed", e?.message ?? "Something went wrong.");
    } finally {
      setDriveLoading(false);
      setDriveAction(null);
    }
  };

  const handleRestore = () => {
    Alert.alert(
      "Restore from Google Drive?",
      "This will overwrite your current local data with the backup.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            try {
              setDriveLoading(true);
              setDriveAction("restore");
              const token = await getGoogleAccessToken();
              if (!token) return; // user cancelled
              await restoreFromDrive(token);
              await load();
              Alert.alert(
                "✅ Restored Successfully",
                "Your data has been loaded from Google Drive.",
              );
            } catch (e: any) {
              Alert.alert(
                "Restore Failed",
                e?.message ?? "Something went wrong.",
              );
            } finally {
              setDriveLoading(false);
              setDriveAction(null);
            }
          },
        },
      ],
    );
  };

  const dropdownScale = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  const isBusy = driveLoading;

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        </View>

        {/* Profile card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.ringTrack + "40",
            },
          ]}
        >
          <View
            style={[styles.avatar, { backgroundColor: theme.accent + "25" }]}
          >
            <Text style={[styles.avatarLetter, { color: theme.accent }]}>
              {userName.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <TextInput
              value={userName}
              onChangeText={async (v) => {
                setLocalUserName(v);
                await setUserName(v);
              }}
              style={[styles.profileNameInput, { color: theme.text }]}
              placeholder="Your Name"
              placeholderTextColor={theme.textMuted}
            />
            <Text style={[styles.profileSub, { color: theme.textMuted }]}>
              {lifetime.toLocaleString()} lifetime chants
            </Text>
          </View>
        </View>

        {/* Streak banner */}
        <View style={styles.streakBanner}>
          {[
            { emoji: "🔥", val: streak, lbl: "Current", accent: true },
            { emoji: "🏆", val: longest, lbl: "Longest", accent: false },
            {
              emoji: "🕉",
              val:
                lifetime > 999 ? `${(lifetime / 1000).toFixed(1)}k` : lifetime,
              lbl: "Lifetime",
              accent: false,
            },
          ].map((item) => (
            <View
              key={item.lbl}
              style={[
                styles.streakItem,
                item.accent
                  ? {
                      backgroundColor: theme.accent + "15",
                      borderColor: theme.accent + "35",
                    }
                  : {
                      backgroundColor: theme.surface,
                      borderColor: theme.ringTrack + "40",
                    },
              ]}
            >
              <Text style={styles.streakEmoji}>{item.emoji}</Text>
              <Text
                style={[
                  styles.streakVal,
                  { color: item.accent ? theme.accent : theme.text },
                ]}
              >
                {item.val}
              </Text>
              <Text
                style={[
                  styles.streakLbl,
                  {
                    color: item.accent ? theme.accent + "aa" : theme.textMuted,
                  },
                ]}
              >
                {item.lbl}
              </Text>
            </View>
          ))}
        </View>

        {/* Practice */}
        <SectionLabel title="Practice" theme={theme} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.ringTrack + "35",
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: theme.ringTrack + "35" }]}
            onPress={openGoalDropdown}
            activeOpacity={0.7}
          >
            <View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>
                Daily Goal
              </Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                Chants per session
              </Text>
            </View>
            <View style={styles.rowRight}>
              <View
                style={[
                  styles.goalBadge,
                  {
                    backgroundColor: theme.accent + "18",
                    borderColor: theme.accent + "40",
                  },
                ]}
              >
                <Text style={[styles.goalBadgeText, { color: theme.accent }]}>
                  {goal}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: theme.textMuted }]}>
                ›
              </Text>
            </View>
          </TouchableOpacity>

          <View
            style={[styles.row, { borderBottomColor: theme.ringTrack + "35" }]}
          >
            <View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>
                Dark Mode
              </Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                Switch theme
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.ringTrack, true: theme.accent }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: theme.ringTrack + "35" }]}
            onPress={resetToday}
            activeOpacity={0.7}
          >
            <View>
              <Text style={[styles.rowLabel, { color: theme.accent }]}>
                Reset Today
              </Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                Clear today's count
              </Text>
            </View>
            <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: "transparent" }]}
            onPress={resetAll}
            activeOpacity={0.7}
          >
            <View>
              <Text style={[styles.rowLabel, { color: "#E53935" }]}>
                Reset All Data
              </Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                Permanently erase everything
              </Text>
            </View>
            <Text style={[styles.chevron, { color: "#E5393580" }]}>›</Text>
          </TouchableOpacity>
        </View>

        <NotificationsSection theme={theme} />

        {/* Backup & Restore */}
        <SectionLabel title="Backup & Restore" theme={theme} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.ringTrack + "35",
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: theme.ringTrack + "35" }]}
            onPress={handleBackup}
            activeOpacity={0.7}
            disabled={isBusy}
          >
            <View style={styles.rowIconGroup}>
              <View style={[styles.rowIcon, { backgroundColor: "#4285F420" }]}>
                <Text style={styles.rowIconText}>☁️</Text>
              </View>
              <View>
                <Text style={[styles.rowLabel, { color: theme.text }]}>
                  {driveLoading && driveAction === "backup"
                    ? "Backing up…"
                    : "Backup to Google Drive"}
                </Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  Save your data to the cloud
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.chevron,
                { color: theme.textMuted, opacity: isBusy ? 0.3 : 1 },
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: "transparent" }]}
            onPress={handleRestore}
            activeOpacity={0.7}
            disabled={isBusy}
          >
            <View style={styles.rowIconGroup}>
              <View style={[styles.rowIcon, { backgroundColor: "#34A85320" }]}>
                <Text style={styles.rowIconText}>🔄</Text>
              </View>
              <View>
                <Text style={[styles.rowLabel, { color: theme.text }]}>
                  {driveLoading && driveAction === "restore"
                    ? "Restoring…"
                    : "Restore from Google Drive"}
                </Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  Load your last backup
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.chevron,
                { color: theme.textMuted, opacity: isBusy ? 0.3 : 1 },
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <SectionLabel title="About" theme={theme} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.ringTrack + "35",
            },
          ]}
        >
          <View
            style={[styles.row, { borderBottomColor: theme.ringTrack + "35" }]}
          >
            <Text style={[styles.rowLabel, { color: theme.text }]}>
              Version
            </Text>
            <Text style={[styles.rowValue, { color: theme.textMuted }]}>
              1.0.0
            </Text>
          </View>
          <View style={[styles.row, { borderBottomColor: "transparent" }]}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>
              Made with
            </Text>
            <Text style={[styles.rowValue, { color: theme.textMuted }]}>
              ❤️ by Rohit
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Goal Modal */}
      <Modal
        visible={goalDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={closeGoalDropdown}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeGoalDropdown}>
          <Animated.View
            style={[
              styles.goalSheet,
              {
                backgroundColor: theme.surface,
                transform: [{ scale: dropdownScale }],
                opacity: dropdownAnim,
              },
            ]}
          >
            <View
              style={[styles.sheetHandle, { backgroundColor: theme.ringTrack }]}
            />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              Daily Goal
            </Text>
            <Text style={[styles.sheetSubtitle, { color: theme.textMuted }]}>
              How many chants per session?
            </Text>
            <View style={styles.goalGrid}>
              {GOAL_OPTIONS.map((g) => {
                const isSelected = goal === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.goalOption,
                      {
                        backgroundColor: isSelected
                          ? theme.accent
                          : theme.background,
                        borderColor: isSelected
                          ? theme.accent
                          : theme.ringTrack + "60",
                      },
                    ]}
                    onPress={() => handleGoalSelect(g)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.goalOptionText,
                        { color: isSelected ? theme.background : theme.text },
                      ]}
                    >
                      {g}
                    </Text>
                    {isSelected && (
                      <Text
                        style={[styles.goalCheck, { color: theme.background }]}
                      >
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[
                styles.sheetClose,
                {
                  backgroundColor: theme.ringTrack + "30",
                  borderColor: theme.ringTrack + "60",
                },
              ]}
              onPress={closeGoalDropdown}
            >
              <Text
                style={{
                  color: theme.textMuted,
                  fontWeight: "500",
                  fontSize: 15,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const SectionLabel = ({ title, theme }: any) => (
  <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{title}</Text>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: 0.2 },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: 22, fontWeight: "700" },
  profileInfo: { flex: 1 },
  profileNameInput: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 0.1,
    marginBottom: 2,
    padding: 0,
  },
  profileSub: { fontSize: 12 },
  streakBanner: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  streakItem: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    gap: 2,
  },
  streakEmoji: { fontSize: 18, marginBottom: 2 },
  streakVal: { fontSize: 18, fontWeight: "700", letterSpacing: -0.5 },
  streakLbl: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
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
  rowLabel: { fontSize: 15, fontWeight: "500", marginBottom: 1 },
  rowSub: { fontSize: 12 },
  rowValue: { fontSize: 14 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowIconGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconText: { fontSize: 18 },
  goalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  goalBadgeText: { fontSize: 14, fontWeight: "700" },
  chevron: { fontSize: 20, fontWeight: "300" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  goalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
    opacity: 0.4,
  },
  sheetTitle: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  sheetSubtitle: { fontSize: 13, marginBottom: 20 },
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  goalOption: {
    width: "30%",
    flexGrow: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  goalOptionText: { fontSize: 16, fontWeight: "600" },
  goalCheck: { fontSize: 12, fontWeight: "700" },
  sheetClose: {
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
});
