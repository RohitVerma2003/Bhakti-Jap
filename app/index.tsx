import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MalaRing from "../components/MalaRing";
import SacredButton from "../components/SacredButton";
import { useTheme } from "../context/ThemeContext";
import {
  loadJapData,
  resetDailyCount,
  saveCount,
  saveMalaCompleted,
} from "../storage/japStorage";

export default function JapScreen() {
  const { theme } = useTheme();
  const [dailyGoal, setDailyGoal] = useState(108);
  const [count, setCount] = useState(0);
  const [malasToday, setMalasToday] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lifetime, setLifetime] = useState(0);
  const [isGlowing, setIsGlowing] = useState(false);
  const [tapPulse, setTapPulse] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadJapData().then((d) => {
        setDailyGoal(d.dailyGoal);
        setCount(d.currentCount);
        setMalasToday(d.malasToday);
        setStreak(d.streak);
        setLongestStreak(d.longestStreak);
        setLifetime(d.lifetimeCount);
      });
    }, []),
  );

  const playBell = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/bell.mp3"),
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch {
      /* sound optional */
    }
  };

  const handleTap = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTapPulse((p) => p + 1);

    setCount((prevCount) => {
      const newCount = prevCount + 1;
      const newLifetime = lifetime + 1;
      setLifetime(newLifetime);
      saveCount(newCount, newLifetime);

      if (newCount >= dailyGoal) {
        const newMalas = malasToday + 1;
        const newStreak = malasToday === 0 ? streak + 1 : streak;
        const newLongest = Math.max(longestStreak, newStreak);
        setMalasToday(newMalas);
        setStreak(newStreak);
        setLongestStreak(newLongest);
        setIsGlowing(true);
        playBell();
        saveMalaCompleted(newMalas, newStreak, newLongest);
        setTimeout(() => {
          setCount(0);
          setIsGlowing(false);
          saveCount(0, newLifetime);
        }, 1800);
        return newCount;
      }
      return newCount;
    });
  }, [dailyGoal, malasToday, streak, longestStreak, lifetime]);

  const handleReset = async () => {
    setCount(0);
    await resetDailyCount();
  };

  const progress = Math.min(count / dailyGoal, 1);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.inner}>
        {/* Top info */}
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.mantraScript, { color: theme.accent }]}>
              ॐ
            </Text>
            <Text style={[styles.mantraName, { color: theme.textMuted }]}>
              Om
            </Text>
          </View>
          <View style={styles.topRight}>
            <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
              Today
            </Text>
            <Text style={[styles.progressValue, { color: theme.text }]}>
              {count} / {dailyGoal}
            </Text>
            <Text style={[styles.malasLabel, { color: theme.textMuted }]}>
              {malasToday} mala{malasToday !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Main tap area */}
        <TouchableWithoutFeedback onPress={handleTap}>
          <View style={styles.ringArea}>
            <MalaRing
              progress={progress}
              size={280}
              strokeWidth={14}
              isGlowing={isGlowing}
              tapPulse={tapPulse}
            />
            <View style={styles.countOverlay} pointerEvents="none">
              <Text style={[styles.countNumber, { color: theme.text }]}>
                {count}
              </Text>
              <Text style={[styles.tapHint, { color: theme.textMuted }]}>
                {isGlowing ? "🙏 मालपूर्ण" : "tap to chant"}
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* Bottom actions */}
        <View style={styles.bottomRow}>
          <SacredButton
            label="Reset"
            variant="ghost"
            small
            onPress={handleReset}
          />
          <View style={styles.streakPill}>
            <Text style={[styles.streakIcon, { color: theme.accent }]}>🔥</Text>
            <Text style={[styles.streakCount, { color: theme.text }]}>
              {streak}
            </Text>
            <Text style={[styles.streakLabel, { color: theme.textMuted }]}>
              day streak
            </Text>
          </View>
          <SacredButton
            label="Mantra"
            variant="ghost"
            small
            onPress={() => {}}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 8,
  },
  mantraScript: { fontSize: 40, lineHeight: 46 },
  mantraName: { fontSize: 13, letterSpacing: 1, marginTop: 2 },
  topRight: { alignItems: "flex-end" },
  progressLabel: { fontSize: 12, letterSpacing: 0.5, marginBottom: 2 },
  progressValue: { fontSize: 22, fontWeight: "300", letterSpacing: 0.5 },
  malasLabel: { fontSize: 12, marginTop: 2 },
  ringArea: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    position: "relative",
  },
  countOverlay: { position: "absolute", alignItems: "center" },
  countNumber: {
    fontSize: 72,
    fontWeight: "200",
    letterSpacing: -2,
    lineHeight: 80,
  },
  tapHint: { fontSize: 13, letterSpacing: 0.5, marginTop: 4 },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  streakPill: { alignItems: "center" },
  streakIcon: { fontSize: 20 },
  streakCount: { fontSize: 22, fontWeight: "300" },
  streakLabel: { fontSize: 11, letterSpacing: 0.3, marginTop: 1 },
});
