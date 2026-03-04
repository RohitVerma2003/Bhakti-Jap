import { ThemeProvider } from "@/context/ThemeContext";
import {
  applyNotifPrefs,
  loadNotifPrefs,
  setupNotifChannel,
  setupNotifHandler,
} from "@/services/notifications";
import { loadAppData } from "@/storage/japStorage";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const [initialTheme, setInitialTheme] = useState<"dark" | "saffron">(
    "saffron",
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadAppData().then((data) => {
      if (data.theme === "dark" || data.theme === "saffron") {
        setInitialTheme(data.theme);
      }
      setReady(true);
    });

    setupNotifHandler();
    setupNotifChannel();
    loadNotifPrefs().then(applyNotifPrefs);
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider initialTheme={initialTheme}>
        {/* Always render Stack immediately */}
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>

        {/* Overlay loading screen */}
        {!ready && (
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "#0F0F12",
            }}
          />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
