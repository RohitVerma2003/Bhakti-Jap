import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import {
    saveDailyGoal,
    saveUserName,
    setOnboardingDone,
} from "../storage/japStorage";

const { width } = Dimensions.get("window");

const GOALS = [
  { value: 108, label: "108", sub: "One Mala" },
  { value: 216, label: "216", sub: "Two Malas" },
  { value: 324, label: "324", sub: "Three Malas" },
  { value: 1008, label: "1008", sub: "Sahasra" },
];

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(108);
  const inputRef = useRef<TextInput>(null);

  const handleFinish = async () => {
    await saveUserName(name.trim());
    await saveDailyGoal(goal);
    await setOnboardingDone();
    router.replace("/");
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={theme.name === "dark" ? "light-content" : "dark-content"}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Banner ── */}
          <View style={styles.bannerContainer}>
            <View
              style={[styles.glowOuter, { backgroundColor: theme.accentSoft }]}
            />
            <View
              style={[styles.glowInner, { backgroundColor: theme.accentSoft }]}
            />
            <Text style={[styles.omSymbol, { color: theme.accent }]}>ॐ</Text>
            <View style={[styles.divider, { backgroundColor: theme.accent }]} />
            <Text style={[styles.appName, { color: theme.text }]}>
              Divine Jap
            </Text>
            <Text style={[styles.appTagline, { color: theme.textMuted }]}>
              A sacred space for daily naam jap
            </Text>
          </View>

          {/* ── Step dots ── */}
          <View style={styles.dotsRow}>
            <View style={[styles.dot, { backgroundColor: theme.accent }]} />
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: step === 2 ? theme.accent : theme.ringTrack,
                },
              ]}
            />
          </View>

          {/* ── STEP 1: Name ── */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepLabel, { color: theme.textMuted }]}>
                STEP 1 OF 2
              </Text>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                What shall we{"\n"}call you?
              </Text>
              <Text style={[styles.stepDesc, { color: theme.textMuted }]}>
                Your name will personalize your daily practice.
              </Text>

              <TouchableOpacity
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.surface,
                    borderColor:
                      name.length > 0 ? theme.accent : theme.ringTrack,
                  },
                ]}
                onPress={() => inputRef.current?.focus()}
                activeOpacity={1}
              >
                <Text style={{ fontSize: 20 }}>🙏</Text>
                <TextInput
                  ref={inputRef}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name..."
                  placeholderTextColor={theme.textMuted}
                  style={[styles.textInput, { color: theme.text }]}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => setStep(2)}
                  maxLength={30}
                />
                {name.length > 0 && (
                  <Text style={[{ fontSize: 18, color: theme.accent }]}>✓</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor:
                      name.trim().length > 0 ? theme.accent : theme.surface,
                  },
                ]}
                onPress={() => {
                  if (!name.trim()) {
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Warning,
                    );
                    return;
                  }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setStep(2);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.primaryBtnText,
                    {
                      color:
                        name.trim().length > 0
                          ? theme.background
                          : theme.textMuted,
                    },
                  ]}
                >
                  Continue →
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStep(2)}
                style={styles.skipBtn}
              >
                <Text style={[styles.skipText, { color: theme.textMuted }]}>
                  Skip for now
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: Goal ── */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepLabel, { color: theme.textMuted }]}>
                STEP 2 OF 2
              </Text>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                {name.trim()
                  ? `${name.trim()},\nset your daily`
                  : "Set your daily"}
                {"\n"}jap goal
              </Text>
              <Text style={[styles.stepDesc, { color: theme.textMuted }]}>
                How many times would you like to chant each day?
              </Text>

              <View style={styles.goalGrid}>
                {GOALS.map((g) => {
                  const selected = goal === g.value;
                  return (
                    <TouchableOpacity
                      key={g.value}
                      style={[
                        styles.goalCard,
                        {
                          backgroundColor: selected
                            ? theme.accent
                            : theme.surface,
                          borderColor: selected
                            ? theme.accent
                            : theme.ringTrack,
                        },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setGoal(g.value);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.goalNumber,
                          { color: selected ? theme.background : theme.accent },
                        ]}
                      >
                        {g.label}
                      </Text>
                      <Text
                        style={[
                          styles.goalSub,
                          {
                            color: selected
                              ? theme.background
                              : theme.textMuted,
                          },
                        ]}
                      >
                        {g.sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View
                style={[styles.infoBox, { backgroundColor: theme.surface }]}
              >
                <Text style={[styles.infoText, { color: theme.textMuted }]}>
                  🕉 108 is sacred in Hindu tradition — the number of beads on a
                  mala.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleFinish();
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.primaryBtnText, { color: theme.background }]}
                >
                  Begin My Practice 🙏
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStep(1)}
                style={styles.skipBtn}
              >
                <Text style={[styles.skipText, { color: theme.textMuted }]}>
                  ← Back
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 48 },

  // Banner
  bannerContainer: {
    alignItems: "center",
    paddingTop: 52,
    paddingBottom: 28,
  },
  glowOuter: {
    position: "absolute",
    top: 20,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.4,
  },
  glowInner: {
    position: "absolute",
    top: 60,
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.7,
  },
  omSymbol: {
    fontSize: 96,
    lineHeight: 116,
    fontWeight: "200",
  },
  divider: {
    width: 36,
    height: 1.5,
    borderRadius: 1,
    marginVertical: 14,
    opacity: 0.5,
  },
  appName: {
    fontSize: 24,
    fontWeight: "200",
    letterSpacing: 5,
  },
  appTagline: {
    fontSize: 13,
    letterSpacing: 0.4,
    marginTop: 8,
  },

  // Dots
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },

  // Step
  stepContainer: {
    paddingHorizontal: 28,
  },
  stepLabel: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "600",
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "200",
    lineHeight: 36,
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 28,
  },

  // Input
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 20,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: "300",
    padding: 0,
  },

  // Goal grid
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  goalCard: {
    width: (width - 56 - 12) / 2,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  goalNumber: { fontSize: 30, fontWeight: "200" },
  goalSub: { fontSize: 12, letterSpacing: 0.3 },

  // Info box
  infoBox: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
  },
  infoText: { fontSize: 12, lineHeight: 18 },

  // Buttons
  primaryBtn: {
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  skipBtn: { alignItems: "center", paddingVertical: 6 },
  skipText: { fontSize: 13 },
});
