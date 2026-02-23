// components/PaywallSheet.tsx
// Shows when a free user tries to add a second mantra.
// Call with onClose and onPurchase callbacks.

import { useSubscription } from "@/context/SubscriptionContext";
import { useTheme } from "@/context/ThemeContext";
import React, { useEffect, useRef } from "react";
import {
    Alert,
    Animated,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface PaywallSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void; // called after successful purchase
}

const FEATURES = [
  { icon: "🕉", text: "Unlimited mantra counters" },
  { icon: "📿", text: "Unlimited mala tracking" },
  { icon: "☁️", text: "Google Drive backup & restore" },
  { icon: "📊", text: "Full devotion analytics" },
  { icon: "🔥", text: "Streak tracking forever" },
];

export default function PaywallSheet({
  visible,
  onClose,
  onSuccess,
}: PaywallSheetProps) {
  const { theme } = useTheme();
  const { purchasePro, restorePurchases } = useSubscription();
  const [loading, setLoading] = React.useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 65,
        friction: 12,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handlePurchase = async () => {
    setLoading(true);
    const result = await purchasePro();
    setLoading(false);

    if (result.success) {
      onSuccess?.();
      onClose();
    } else if (result.error) {
      Alert.alert("Purchase Failed", result.error);
    }
    // if !success and no error = user cancelled, do nothing
  };

  const handleRestore = async () => {
    setLoading(true);
    const result = await restorePurchases();
    setLoading(false);

    if (result.success) {
      Alert.alert("✅ Restored", "Your premium access has been restored.");
      onClose();
    } else {
      Alert.alert(
        "No Purchase Found",
        "We couldn't find a previous purchase to restore.",
      );
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: theme.surface, transform: [{ translateY }] },
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: theme.ringTrack }]} />

          {/* Hero */}
          <Text style={styles.heroEmoji}>🕉</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Upgrade to Lifetime
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            One-time purchase. Unlimited devotion.
          </Text>

          {/* Features */}
          <View
            style={[
              styles.featuresCard,
              {
                backgroundColor: theme.background,
                borderColor: theme.ringTrack + "40",
              },
            ]}
          >
            {FEATURES.map((f, i) => (
              <View
                key={i}
                style={[
                  styles.featureRow,
                  i < FEATURES.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.ringTrack + "30",
                  },
                ]}
              >
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  {f.text}
                </Text>
                <Text style={[styles.checkmark, { color: theme.accent }]}>
                  ✓
                </Text>
              </View>
            ))}
          </View>

          {/* Purchase button */}
          <TouchableOpacity
            style={[
              styles.purchaseBtn,
              { backgroundColor: theme.accent },
              loading && { opacity: 0.7 },
            ]}
            onPress={handlePurchase}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={[styles.purchaseBtnText, { color: theme.background }]}>
              {loading ? "Processing…" : "Get Lifetime Access"}
            </Text>
          </TouchableOpacity>

          {/* Restore */}
          <TouchableOpacity
            onPress={handleRestore}
            disabled={loading}
            style={styles.restoreBtn}
          >
            <Text style={[styles.restoreText, { color: theme.textMuted }]}>
              Restore Purchase
            </Text>
          </TouchableOpacity>

          <Text style={[styles.legal, { color: theme.textMuted }]}>
            One-time payment · No subscription · Yours forever
          </Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 20,
    opacity: 0.4,
  },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  subtitle: { fontSize: 14, marginBottom: 20, textAlign: "center" },

  featuresCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  featureIcon: { fontSize: 18, width: 28 },
  featureText: { flex: 1, fontSize: 14, fontWeight: "500" },
  checkmark: { fontSize: 16, fontWeight: "700" },

  purchaseBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  purchaseBtnText: { fontSize: 17, fontWeight: "700", letterSpacing: 0.3 },

  restoreBtn: { paddingVertical: 8, marginBottom: 8 },
  restoreText: { fontSize: 13, fontWeight: "500" },
  legal: { fontSize: 11, textAlign: "center", opacity: 0.7 },
});
