import { useTheme } from "@/context/ThemeContext";
import { Tabs } from "expo-router";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["bottom"]}
    >
      <TabNavigator />
    </SafeAreaView>
  );
}

function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.accent + "20",
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.text + "80",
        tabBarLabelStyle: {
          fontSize: 11,
          letterSpacing: 0.5,
          marginBottom: 4,
        },
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
    </Tabs>
  );
}
