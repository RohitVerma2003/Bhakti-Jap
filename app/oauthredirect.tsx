// app/oauthredirect.tsx
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, BackHandler, View } from "react-native";

// Module-level — signals promptAsync() that the redirect has landed
WebBrowser.maybeCompleteAuthSession();

export default function OAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Small timeout to let maybeCompleteAuthSession() finish
    // passing the token back to the hook before we navigate away
    const timer = setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        // Fallback if there's no history (e.g. cold start via deep link)
        router.replace("/(tabs)");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true); // block back
    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}
