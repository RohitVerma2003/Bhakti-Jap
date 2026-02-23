// services/widgetBridge.ts
// Call updateWidget() whenever counts change — after increment, decrement,
// restore from Drive, or reset. Works only on Android (no-op on iOS for now).

import { NativeModules, Platform } from "react-native";

const { WidgetData } = NativeModules;

/**
 * Push latest counts to the Android home screen widget.
 * Safe to call on iOS — just does nothing.
 */
export function updateWidget(
  todayCount: number,
  lifetimeCount: number,
  streak: number,
): void {
  if (Platform.OS !== "android") return;
  if (!WidgetData) {
    console.warn(
      "WidgetData native module not found — did you rebuild the dev client?",
    );
    return;
  }
  WidgetData.update(todayCount, lifetimeCount, streak);
}
