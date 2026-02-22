import { Tabs, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeName } from "../constants/themes";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { loadJapData } from "../storage/japStorage";

function TabLayout({ onboardingDone }: { onboardingDone: boolean }) {
  const { theme } = useTheme();

  useEffect(() => {
    if (!onboardingDone) {
      router.replace("/onboarding");
    }
  }, [onboardingDone]);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.ringTrack,
          borderTopWidth: 1,
          paddingBottom: 8,
          height: 64,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 0.5, marginBottom: 4 },
        tabBarIcon: ({ color }) => {
          const icons: Record<string, string> = {
            index: "ॐ",
            analytics: "◎",
            settings: "⚙",
          };
          return (
            <Text style={{ fontSize: 20, color }}>
              {icons[route.name] ?? ""}
            </Text>
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Jap" }} />
      <Tabs.Screen name="analytics" options={{ title: "Sadhana" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      <Tabs.Screen
        name="onboarding"
        options={{ href: null, headerShown: false }}
      />
      <Tabs.Screen name="modal" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}

export default function RootLayout() {
  const [initialTheme, setInitialTheme] = useState<ThemeName>("dark");
  const [onboardingDone, setOnboardingDone] = useState(true); // default true avoids flash
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadJapData().then((d) => {
      if (d.theme === "saffron" || d.theme === "dark") {
        setInitialTheme(d.theme as ThemeName);
      }
      setOnboardingDone(d.onboardingDone);
      setReady(true);
    });
  }, []);

  // Show plain dark bg while loading — avoids white flash
  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: "#0F0F12" }} />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemeProvider initialTheme={initialTheme}>
        <TabLayout onboardingDone={onboardingDone} />
      </ThemeProvider>
    </SafeAreaView>
  );
}
