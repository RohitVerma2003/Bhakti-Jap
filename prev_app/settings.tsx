import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SacredButton from "../components/SacredButton";
import { ThemeName } from "../constants/themes";
import { useTheme } from "../context/ThemeContext";
import { loadAppData, saveDailyGoal } from "../storage/japStorage";

const GOALS = [54, 108, 216, 324, 1008];
const THEMES: { name: ThemeName; label: string; preview: string }[] = [
  { name: "dark", label: "Dark Spiritual", preview: "#C6A85E" },
  { name: "saffron", label: "Saffron Temple", preview: "#E07A24" },
];

function SectionHeader({ label }: { label: string }) {
  const { theme } = useTheme();
  return (
    <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
      {label}
    </Text>
  );
}

function Row({
  label,
  right,
  onPress,
}: {
  label: string;
  right?: string;
  onPress?: () => void;
}) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: theme.surface }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      {right && (
        <Text style={[styles.rowRight, { color: theme.textMuted }]}>
          {right}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { theme, themeName, setThemeName } = useTheme();
  const [selectedGoal, setSelectedGoal] = useState(108);

  useFocusEffect(
    useCallback(() => {
      loadAppData().then((d) => setSelectedGoal(d.dailyGoal));
    }, []),
  );

  const handleGoalSelect = async (g: number) => {
    setSelectedGoal(g);
    await saveDailyGoal(g);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        <SectionHeader label="APPEARANCE" />
        <View style={styles.themeRow}>
          {THEMES.map((t) => {
            const active = themeName === t.name;
            return (
              <TouchableOpacity
                key={t.name}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: active ? theme.accent : "transparent",
                    borderWidth: 1.5,
                  },
                ]}
                onPress={() => setThemeName(t.name)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.themePreviewDot,
                    { backgroundColor: t.preview },
                  ]}
                />
                <Text
                  style={[
                    styles.themeLabel,
                    { color: active ? theme.accent : theme.text },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionHeader label="DAILY GOAL" />
        <View style={styles.goalRow}>
          {GOALS.map((g) => {
            const active = selectedGoal === g;
            return (
              <TouchableOpacity
                key={g}
                style={[
                  styles.goalChip,
                  {
                    backgroundColor: active ? theme.accent : theme.surface,
                    borderColor: active ? theme.accent : "transparent",
                    borderWidth: 1,
                  },
                ]}
                onPress={() => handleGoalSelect(g)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.goalChipText,
                    { color: active ? theme.background : theme.text },
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionHeader label="SUBSCRIPTION" />
        <View
          style={[styles.premiumBanner, { backgroundColor: theme.surface }]}
        >
          <Text style={[styles.premiumTitle, { color: theme.accent }]}>
            Divine Jap Premium
          </Text>
          <Text style={[styles.premiumDesc, { color: theme.textMuted }]}>
            Unlock multiple mantras, advanced stats, and future features.
          </Text>
          <SacredButton
            label="Upgrade — Annual"
            variant="primary"
            onPress={() => {}}
            style={styles.upgradeBtn}
          />
        </View>

        <SectionHeader label="SUPPORT" />
        <View style={styles.rowGroup}>
          <Row
            label="Restore Purchases"
            onPress={() =>
              Alert.alert("Restore Purchases", "No previous purchases found.")
            }
            right="›"
          />
          <Row label="Privacy Policy" onPress={() => {}} right="›" />
          <Row label="Terms of Use" onPress={() => {}} right="›" />
          <Row label="Version" right="1.0.0" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 60 },
  title: {
    fontSize: 28,
    fontWeight: "300",
    letterSpacing: 1,
    marginBottom: 28,
    paddingTop: 8,
  },
  sectionHeader: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 24,
  },
  themeRow: { flexDirection: "row", gap: 12 },
  themeCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  themePreviewDot: { width: 28, height: 28, borderRadius: 14 },
  themeLabel: { fontSize: 12, textAlign: "center", letterSpacing: 0.3 },
  goalRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  goalChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
  goalChipText: { fontSize: 14 },
  premiumBanner: { borderRadius: 22, padding: 22, gap: 10 },
  premiumTitle: { fontSize: 18, fontWeight: "500", letterSpacing: 0.3 },
  premiumDesc: { fontSize: 13, lineHeight: 20 },
  upgradeBtn: { marginTop: 4 },
  rowGroup: { gap: 2 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 2,
  },
  rowLabel: { fontSize: 15 },
  rowRight: { fontSize: 14 },
});
