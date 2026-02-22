import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { loadJapData } from "../storage/japStorage";

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
      <Text
        style={[
          styles.statValue,
          { color: accent ? theme.accent : theme.text },
        ]}
      >
        {value}
      </Text>
      {sub && (
        <Text style={[styles.statSub, { color: theme.accent }]}>{sub}</Text>
      )}
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const [data, setData] = useState({
    todayCount: 0,
    malasToday: 0,
    streak: 0,
    longestStreak: 0,
    lifetimeCount: 0,
    dailyGoal: 108,
  });

  useFocusEffect(
    useCallback(() => {
      loadJapData().then((d) => {
        setData({
          todayCount: d.currentCount,
          malasToday: d.malasToday,
          streak: d.streak,
          longestStreak: d.longestStreak,
          lifetimeCount: d.lifetimeCount,
          dailyGoal: d.dailyGoal,
        });
      });
    }, []),
  );

  const completionPct = Math.min(
    Math.round(
      ((data.todayCount + data.malasToday * data.dailyGoal) / data.dailyGoal) *
        100,
    ),
    100,
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Sadhana</Text>
          <Text style={[styles.headerSub, { color: theme.textMuted }]}>
            Your practice summary
          </Text>
        </View>

        <View
          style={[
            styles.highlightCard,
            { backgroundColor: theme.surface, borderColor: theme.accentSoft },
          ]}
        >
          <Text style={[styles.highlightLabel, { color: theme.textMuted }]}>
            Today's Progress
          </Text>
          <View style={styles.highlightRow}>
            <Text style={[styles.highlightValue, { color: theme.accent }]}>
              {completionPct}%
            </Text>
            <Text style={[styles.highlightGoal, { color: theme.textMuted }]}>
              of {data.dailyGoal} goal
            </Text>
          </View>
          <View style={[styles.barTrack, { backgroundColor: theme.ringTrack }]}>
            <View
              style={[
                styles.barFill,
                {
                  backgroundColor: theme.accent,
                  width: `${completionPct}%` as any,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.grid}>
          <StatCard label="Jap Today" value={data.todayCount} />
          <StatCard label="Malas Today" value={data.malasToday} accent />
          <StatCard
            label="Current Streak"
            value={data.streak}
            sub="days 🔥"
            accent
          />
          <StatCard label="Best Streak" value={data.longestStreak} sub="days" />
          <StatCard
            label="Lifetime Jap"
            value={data.lifetimeCount.toLocaleString()}
          />
          <StatCard label="Daily Goal" value={data.dailyGoal} />
        </View>

        <Text style={[styles.verse, { color: theme.textMuted }]}>
          "नाम जपत मन होत निहाल"{"\n"}Chanting the name, the mind becomes
          blissful.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 48 },
  header: { marginBottom: 24, paddingTop: 8 },
  title: { fontSize: 28, fontWeight: "300", letterSpacing: 1 },
  headerSub: { fontSize: 13, marginTop: 4, letterSpacing: 0.3 },
  highlightCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
  },
  highlightLabel: { fontSize: 12, letterSpacing: 0.5, marginBottom: 10 },
  highlightRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 16,
  },
  highlightValue: { fontSize: 48, fontWeight: "200", letterSpacing: -1 },
  highlightGoal: { fontSize: 14 },
  barTrack: { height: 5, borderRadius: 4, overflow: "hidden" },
  barFill: { height: 5, borderRadius: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 32 },
  statCard: { width: "47%", borderRadius: 18, padding: 18, gap: 3 },
  statValue: { fontSize: 28, fontWeight: "200", letterSpacing: -0.5 },
  statSub: { fontSize: 12 },
  statLabel: { fontSize: 12, letterSpacing: 0.3, marginTop: 2 },
  verse: {
    textAlign: "center",
    lineHeight: 22,
    fontSize: 13,
    letterSpacing: 0.3,
    fontStyle: "italic",
    paddingHorizontal: 16,
  },
});
