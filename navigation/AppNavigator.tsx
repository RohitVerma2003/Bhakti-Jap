import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import JapScreen from "../screens/JapScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { JapData, loadJapData } from "../storage/japStorage";

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { theme } = useTheme();
  const [data, setData] = useState<JapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJapData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const handleOnboardingComplete = (_mantra: string, goal: number) => {
    setData((prev) =>
      prev ? { ...prev, onboardingDone: true, dailyGoal: goal } : prev,
    );
  };

  const handleGoalChange = (g: number) => {
    setData((prev) => (prev ? { ...prev, dailyGoal: g } : prev));
  };

  if (loading || !data) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: theme.accent, fontSize: 36 }}>ॐ</Text>
        <ActivityIndicator color={theme.accent} style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (!data.onboardingDone) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
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
          tabBarLabelStyle: {
            fontSize: 10,
            letterSpacing: 0.5,
            marginBottom: 4,
          },
          tabBarIcon: ({ color }) => {
            const icons: Record<string, string> = {
              Jap: "ॐ",
              Sadhana: "◎",
              Settings: "⚙",
            };
            return (
              <Text style={{ fontSize: 20, color }}>
                {icons[route.name] ?? "•"}
              </Text>
            );
          },
        })}
      >
        <Tab.Screen name="Jap">
          {() => (
            <JapScreen
              dailyGoal={data.dailyGoal}
              initialCount={data.currentCount}
              initialMalasToday={data.malasToday}
              initialStreak={data.streak}
              initialLongestStreak={data.longestStreak}
              initialLifetime={data.lifetimeCount}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Sadhana">
          {() => (
            <AnalyticsScreen
              todayCount={data.currentCount}
              malasToday={data.malasToday}
              streak={data.streak}
              longestStreak={data.longestStreak}
              lifetimeCount={data.lifetimeCount}
              dailyGoal={data.dailyGoal}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Settings">
          {() => (
            <SettingsScreen
              dailyGoal={data.dailyGoal}
              onGoalChange={handleGoalChange}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
