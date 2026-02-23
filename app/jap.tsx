import { useTheme } from "@/context/ThemeContext";
import { updateWidget } from "@/services/widgetBridge";
import {
  decrementCounter,
  incrementCounter,
  loadAppData,
} from "@/storage/japStorage";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BEAD_COUNT = 108;
const BEAD_SIZE = 8;
const BEAD_SPACING = 3;
const BEADS_PER_ROW = Math.floor(
  (SCREEN_WIDTH - 48) / (BEAD_SIZE + BEAD_SPACING),
);

export default function JapScreen() {
  const { theme } = useTheme();

  const [count, setCount] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(108);
  const [malasToday, setMalasToday] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mantraName, setMantraName] = useState("Mantra");
  const [todaysTotal, setTodaysTotal] = useState(0);

  const player = useAudioPlayer(require("@/assets/sounds/chime.mp3"));
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      setAudioModeAsync({ playsInSilentMode: true });
      load();
    }, []),
  );

  const load = async () => {
    const data = await loadAppData();
    const active = data.counters.find((c) => c.id === data.activeCounterId);
    if (!active) return;
    setCount(active.currentCount);
    setMalasToday(Math.floor(active.currentCount / active.dailyGoal));
    setDailyGoal(active.dailyGoal);
    setStreak(data.streak.current);
    setMantraName(active.name);

    const totalToday = data.counters.reduce(
      (sum, c) => sum + c.currentCount,
      0,
    );
    setTodaysTotal(totalToday);

    const lifetimeCount = data.counters.reduce(
      (sum, c) => sum + c.lifetimeCount,
      0,
    );
    updateWidget(data.todayTotal, lifetimeCount, data.streak.current);
  };

  const playBell = async () => {
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  };

  const animatePulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.93,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(pulseAnim, {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateCount = () => {
    countAnim.setValue(0.7);
    Animated.spring(countAnim, {
      toValue: 1,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const flashGlow = () => {
    glowAnim.setValue(1);
    Animated.timing(glowAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: false,
    }).start();
  };

  const handleIncrement = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animatePulse();
    animateCount();

    const data = await incrementCounter(); // 🔥 use storage logic

    const active = data.counters.find((c) => c.id === data.activeCounterId);
    if (!active) return;

    if (active.currentCount % active.dailyGoal === 0) {
      playBell();
      flashGlow();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setCount(active.currentCount);
    setMalasToday(Math.floor(active.currentCount / active.dailyGoal));
    setStreak(data.streak.current);
    setTodaysTotal(data.todayTotal);

    const lifetimeCount = data.counters.reduce(
      (sum, c) => sum + c.lifetimeCount,
      0,
    );
    updateWidget(data.todayTotal, lifetimeCount, data.streak.current);
  };

  const handleDecrement = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animatePulse();
    animateCount();

    const data = await decrementCounter(); // 🔥 use storage logic

    const active = data.counters.find((c) => c.id === data.activeCounterId);
    if (!active) return;

    if (active.currentCount % active.dailyGoal === 0) {
      playBell();
      flashGlow();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setCount(active.currentCount);
    setMalasToday(Math.floor(active.currentCount / active.dailyGoal));
    setStreak(data.streak.current);
    setTodaysTotal(data.todayTotal);

    const lifetimeCount = data.counters.reduce(
      (sum, c) => sum + c.lifetimeCount,
      0,
    );
    updateWidget(data.todayTotal, lifetimeCount, data.streak.current);
  };

  const progress = dailyGoal > 0 ? Math.min(count / dailyGoal, 1) : 0;
  const filledBeads = Math.round(progress * BEAD_COUNT);

  // SVG ring progress
  const BASE_SIZE = 280;
  const RING_RADIUS = 125;
  const STROKE_WIDTH = 4;
  const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.accent + "00", theme.accent + "30"],
  });

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={[styles.mantraName, { color: theme.text }]}>
            {mantraName}
          </Text>
          <View style={styles.headerStats}>
            <View
              style={[
                styles.statBadge,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.ringTrack + "60",
                },
              ]}
            >
              <Text style={[styles.statBadgeText, { color: theme.textMuted }]}>
                🔥 {streak}d
              </Text>
            </View>
            <View
              style={[
                styles.statBadge,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.ringTrack + "60",
                },
              ]}
            >
              <Text style={[styles.statBadgeText, { color: theme.textMuted }]}>
                {malasToday} mala{malasToday !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bead Bar */}
      <View style={styles.beadSection}>
        <View style={styles.beadGrid}>
          {Array.from({ length: BEAD_COUNT }).map((_, i) => {
            const filled = i < filledBeads;
            return (
              <View
                key={i}
                style={[
                  styles.bead,
                  {
                    backgroundColor: filled
                      ? theme.accent
                      : theme.ringTrack + "50",
                    transform: [{ scale: filled ? 1 : 0.85 }],
                    shadowColor: filled ? theme.accent : "transparent",
                    shadowOpacity: filled ? 0.7 : 0,
                    shadowRadius: 3,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: filled ? 2 : 0,
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.beadLabelRow}>
          <Text style={[styles.beadLabel, { color: theme.textMuted }]}>
            {count} of {dailyGoal}
          </Text>
          <Text style={[styles.beadLabel, { color: theme.accent }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      </View>

      {/* Decrement Button - small, above big circle */}
      <View style={styles.decrementWrapper}>
        <TouchableOpacity
          onPress={handleDecrement}
          activeOpacity={0.75}
          style={[
            styles.decrementBtn,
            {
              backgroundColor: theme.surface,
              borderColor: theme.ringTrack + "80",
            },
          ]}
        >
          <Text style={[styles.decrementText, { color: theme.textMuted }]}>
            −
          </Text>
        </TouchableOpacity>
      </View>

      {/* Big Circle - increment */}
      <View style={styles.circleArea}>
        {/* Glow */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              width: BASE_SIZE + 20,
              height: BASE_SIZE + 20,
              borderRadius: (BASE_SIZE + 20) / 2,
              backgroundColor: glowColor,
            },
          ]}
        />

        {/* SVG Ring */}
        <Svg width={BASE_SIZE} height={BASE_SIZE} style={styles.svg}>
          {/* Track */}
          <Circle
            cx={BASE_SIZE / 2}
            cy={BASE_SIZE / 2}
            r={RING_RADIUS}
            stroke={theme.ringTrack + "40"}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />

          {/* Progress */}
          <Circle
            cx={BASE_SIZE / 2}
            cy={BASE_SIZE / 2}
            r={RING_RADIUS}
            stroke={theme.accent}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            strokeLinecap="round"
            rotation="-90"
            origin={`${BASE_SIZE / 2}, ${BASE_SIZE / 2}`}
          />
        </Svg>

        {/* Big Tap Circle */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleIncrement}
            style={[
              styles.bigCircle,
              {
                width: BASE_SIZE - 40,
                height: BASE_SIZE - 40,
                borderRadius: (BASE_SIZE - 40) / 2,
                backgroundColor: theme.accent + "12",
                borderColor: theme.accent + "50",
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.countText,
                { color: theme.text, transform: [{ scale: countAnim }] },
              ]}
            >
              {count}
            </Animated.Text>

            <Text style={[styles.tapHint, { color: theme.textMuted }]}>
              tap to count
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Footer info */}
      <View style={styles.footer}>
        <View
          style={[
            styles.footerCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.ringTrack + "50",
            },
          ]}
        >
          <Text style={[styles.footerValue, { color: theme.text }]}>
            {todaysTotal}
          </Text>
          <Text style={[styles.footerLabel, { color: theme.textMuted }]}>
            Today's Count
          </Text>
        </View>
        <View
          style={[
            styles.footerCard,
            {
              backgroundColor: theme.accent + "12",
              borderColor: theme.accent + "40",
            },
          ]}
        >
          <Text style={[styles.footerValue, { color: theme.accent }]}>
            {streak}
          </Text>
          <Text style={[styles.footerLabel, { color: theme.accent + "cc" }]}>
            Day Streak
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  mantraName: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  headerStats: {
    flexDirection: "row",
    gap: 10,
  },
  statBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Bead bar
  beadSection: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
  },
  beadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: BEAD_SPACING,
    justifyContent: "center",
    marginBottom: 8,
  },
  bead: {
    width: BEAD_SIZE,
    height: BEAD_SIZE,
    borderRadius: BEAD_SIZE / 2,
  },
  beadLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  beadLabel: {
    fontSize: 12,
    fontWeight: "400",
  },

  // Decrement button
  decrementWrapper: {
    alignItems: "center",
    marginBottom: 12,
  },
  decrementBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  decrementText: {
    fontSize: 26,
    fontWeight: "300",
    lineHeight: 30,
  },

  // Big circle
  circleArea: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  bigCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 76,
    fontWeight: "300",
    letterSpacing: -2,
    textAlign: "center",
    includeFontPadding: false,
  },
  tapHint: {
    fontSize: 12,
    fontWeight: "400",
    letterSpacing: 0.8,
    marginTop: 4,
    textTransform: "uppercase",
  },
  svg: {
    position: "absolute",
  },

  // Footer
  footer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  footerCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
  },
  footerValue: {
    fontSize: 26,
    fontWeight: "600",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: "400",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});
