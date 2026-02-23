import { useTheme } from "@/context/ThemeContext";
import { loadAppData } from "@/storage/japStorage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// 2 months per row: 20px padding each side + 10px gap between
const MONTH_CARD_WIDTH = (SCREEN_WIDTH - 40 - 10) / 2;
// 7 cells per row inside card, 10px padding each side
const CELL_SIZE = Math.floor((MONTH_CARD_WIDTH - 20) / 7);

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

// 0 = Sunday
const getFirstDayOfMonth = (year: number, month: number) =>
  new Date(year, month, 1).getDay();

const formatDate = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export default function AnalyticsScreen() {
  const { theme } = useTheme();

  const [dailyHistory, setDailyHistory] = useState<Record<string, number>>({});
  const [goal, setGoal] = useState(108);
  const [todayTotal, setTodayTotal] = useState(0);
  const [lifetime, setLifetime] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const todayStr = new Date().toISOString().split("T")[0];

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [yearDropdownVisible, setYearDropdownVisible] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const availableYears = Array.from(
    { length: currentYear - 2019 },
    (_, i) => currentYear - i,
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const load = async () => {
    const data = await loadAppData();
    setDailyHistory(data.dailyHistory || {});
    setGoal(data.globalDailyGoal);
    setTodayTotal(data.todayTotal);
    setStreak(data.streak.current);
    setLongest(data.streak.longest);
    setLifetime(data.counters.reduce((sum, c) => sum + c.lifetimeCount, 0));
  };

  const openDropdown = () => {
    setYearDropdownVisible(true);
    Animated.spring(dropdownAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 70,
      friction: 12,
    }).start();
  };

  const closeDropdown = (year?: number) => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setYearDropdownVisible(false);
      if (year !== undefined) setSelectedYear(year);
    });
  };

  const getDotColor = (date: string) => {
    const value = dailyHistory[date] || 0;
    if (value === 0) return theme.ringTrack + "45";
    if (value >= goal) return theme.accent;
    return "#FFD54F";
  };

  const yearDaysCompleted = (() => {
    let count = 0;
    for (let i = 0; i < 366; i++) {
      const d = new Date(selectedYear, 0, 1 + i);
      if (d.getFullYear() !== selectedYear) break;
      const key = d.toISOString().split("T")[0];
      if ((dailyHistory[key] || 0) >= goal) count++;
    }
    return count;
  })();

  const yearTotalChants = Object.entries(dailyHistory)
    .filter(([date]) => date.startsWith(String(selectedYear)))
    .reduce((sum, [, v]) => sum + v, 0);

  const dropdownScale = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });

  const renderMonth = (monthIdx: number) => {
    const daysInMonth = getDaysInMonth(selectedYear, monthIdx);
    const firstDay = getFirstDayOfMonth(selectedYear, monthIdx); // 0=Sun

    const isCurrentMonth =
      selectedYear === currentYear && monthIdx === currentMonth;
    const isFutureMonth =
      selectedYear === currentYear && monthIdx > currentMonth;

    let monthGoalDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = formatDate(selectedYear, monthIdx, d);
      if ((dailyHistory[key] || 0) >= goal) monthGoalDays++;
    }

    // Build flat array of cells: null for padding, day number for real days
    // Each row = one week (7 cols), starting Sunday
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const numRows = cells.length / 7;

    return (
      <View
        key={monthIdx}
        style={[
          styles.monthCard,
          {
            backgroundColor: theme.surface,
            borderColor: isCurrentMonth
              ? theme.accent + "60"
              : theme.ringTrack + "35",
            borderWidth: isCurrentMonth ? 1.5 : 1,
            opacity: isFutureMonth ? 0.4 : 1,
            width: MONTH_CARD_WIDTH,
          },
        ]}
      >
        {/* Month header */}
        <View style={styles.monthHeader}>
          <View style={styles.monthTitleRow}>
            {isCurrentMonth && (
              <View
                style={[styles.currentDot, { backgroundColor: theme.accent }]}
              />
            )}
            <Text style={[styles.monthName, { color: theme.text }]}>
              {MONTH_SHORT[monthIdx]}
            </Text>
          </View>
          {monthGoalDays > 0 && (
            <View
              style={[
                styles.monthBadge,
                { backgroundColor: theme.accent + "20" },
              ]}
            >
              <Text style={[styles.monthBadgeText, { color: theme.accent }]}>
                {monthGoalDays}✓
              </Text>
            </View>
          )}
        </View>

        {/* Day-of-week header — exactly 7 cells matching the grid below */}
        <View style={styles.weekRow}>
          {DAY_LABELS.map((label, i) => (
            <View
              key={i}
              style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE }]}
            >
              <Text style={[styles.dayLabel, { color: theme.textMuted }]}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar rows */}
        {Array.from({ length: numRows }).map((_, rowIdx) => (
          <View key={rowIdx} style={styles.weekRow}>
            {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
              if (day === null) {
                return (
                  <View
                    key={colIdx}
                    style={[
                      styles.cell,
                      { width: CELL_SIZE, height: CELL_SIZE },
                    ]}
                  />
                );
              }
              const dateStr = formatDate(selectedYear, monthIdx, day);
              const isToday = dateStr === todayStr;
              const dotColor = getDotColor(dateStr);

              return (
                <View
                  key={colIdx}
                  style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE }]}
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        width: CELL_SIZE - 3,
                        height: CELL_SIZE - 3,
                        backgroundColor: dotColor,
                      },
                      isToday && {
                        borderWidth: 1.5,
                        borderColor: theme.accent,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  // 6 pairs of months
  const monthPairs = Array.from({ length: 6 }, (_, i) => [i * 2, i * 2 + 1]);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Your Devotion
          </Text>
          <TouchableOpacity
            style={[
              styles.yearBtn,
              {
                backgroundColor: theme.surface,
                borderColor: theme.ringTrack + "60",
              },
            ]}
            onPress={openDropdown}
            activeOpacity={0.8}
          >
            <Text style={[styles.yearBtnText, { color: theme.text }]}>
              {selectedYear}
            </Text>
            <Text style={[styles.yearChevron, { color: theme.textMuted }]}>
              ▾
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats 2×2 */}
        <View style={styles.statsGrid}>
          {[
            {
              label: "Today",
              value: todayTotal.toLocaleString(),
              accent: false,
            },
            {
              label: "Lifetime",
              value: lifetime.toLocaleString(),
              accent: false,
            },
            {
              label: `${selectedYear} Days`,
              value: yearDaysCompleted.toString(),
              accent: true,
            },
            {
              label: `${selectedYear} Chants`,
              value: yearTotalChants.toLocaleString(),
              accent: true,
            },
          ].map((s, i) => (
            <View
              key={i}
              style={[
                styles.statCard,
                {
                  backgroundColor: s.accent
                    ? theme.accent + "15"
                    : theme.surface,
                  borderColor: s.accent
                    ? theme.accent + "40"
                    : theme.ringTrack + "50",
                },
              ]}
            >
              <Text
                style={[
                  styles.statValue,
                  { color: s.accent ? theme.accent : theme.text },
                ]}
              >
                {s.value}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: s.accent ? theme.accent + "99" : theme.textMuted },
                ]}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Streak */}
        <View style={styles.streakRow}>
          {[
            { emoji: "🔥", value: `${streak} days`, label: "Current Streak" },
            { emoji: "🏆", value: `${longest} days`, label: "Longest Streak" },
          ].map((s) => (
            <View
              key={s.label}
              style={[
                styles.streakCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.ringTrack + "50",
                },
              ]}
            >
              <Text style={styles.streakEmoji}>{s.emoji}</Text>
              <View>
                <Text style={[styles.streakValue, { color: theme.text }]}>
                  {s.value}
                </Text>
                <Text style={[styles.streakLabel, { color: theme.textMuted }]}>
                  {s.label}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Monthly calendars - 2 per row */}
        <View style={styles.monthsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Monthly View
          </Text>
          {monthPairs.map(([a, b]) => (
            <View key={a} style={styles.monthRow}>
              {renderMonth(a)}
              {renderMonth(b)}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View
          style={[styles.legend, { borderTopColor: theme.ringTrack + "40" }]}
        >
          {[
            { color: theme.ringTrack + "45", label: "None" },
            { color: "#FFD54F", label: "Partial" },
            { color: theme.accent, label: "Goal Met" },
          ].map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={[styles.legendText, { color: theme.textMuted }]}>
                {l.label}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Year Dropdown Modal */}
      <Modal
        visible={yearDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => closeDropdown()}
      >
        <Pressable
          style={styles.dropdownBackdrop}
          onPress={() => closeDropdown()}
        >
          <Animated.View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: theme.surface,
                borderColor: theme.ringTrack + "60",
                transform: [{ scale: dropdownScale }],
                opacity: dropdownAnim,
              },
            ]}
          >
            <Text style={[styles.dropdownTitle, { color: theme.textMuted }]}>
              Select Year
            </Text>
            {availableYears.map((y) => (
              <TouchableOpacity
                key={y}
                style={[
                  styles.dropdownItem,
                  y === selectedYear && {
                    backgroundColor: theme.accent + "18",
                  },
                ]}
                onPress={() => closeDropdown(y)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    { color: y === selectedYear ? theme.accent : theme.text },
                  ]}
                >
                  {y}
                </Text>
                {y === selectedYear && (
                  <Text
                    style={{
                      color: theme.accent,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    ✓
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 60 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: 0.2 },
  yearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  yearBtnText: { fontSize: 15, fontWeight: "600" },
  yearChevron: { fontSize: 12 },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    width: "47.5%",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  streakRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  streakCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  streakEmoji: { fontSize: 20 },
  streakValue: { fontSize: 15, fontWeight: "600", marginBottom: 1 },
  streakLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.3 },

  monthsSection: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
    letterSpacing: 0.2,
  },

  monthRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  monthCard: {
    borderRadius: 14,
    padding: 10,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  monthTitleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  currentDot: { width: 5, height: 5, borderRadius: 2.5 },
  monthName: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  monthBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 },
  monthBadgeText: { fontSize: 9, fontWeight: "700" },

  weekRow: {
    flexDirection: "row",
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: 7,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dot: {
    borderRadius: 3,
  },

  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 20,
    paddingTop: 16,
    marginHorizontal: 20,
    borderTopWidth: 1,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 2.5 },
  legendText: { fontSize: 12 },

  dropdownBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingTop: 110,
    paddingRight: 20,
  },
  dropdownMenu: {
    minWidth: 150,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  dropdownTitle: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownItemText: { fontSize: 15, fontWeight: "500" },
});
