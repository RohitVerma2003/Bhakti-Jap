import * as Haptics from "expo-haptics";
import React from "react";
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

interface SacredButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "outline";
  style?: ViewStyle;
  textStyle?: TextStyle;
  small?: boolean;
}

export default function SacredButton({
  label,
  onPress,
  variant = "ghost",
  style,
  textStyle,
  small = false,
}: SacredButtonProps) {
  const { theme } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const containerStyles: (ViewStyle | false | undefined)[] = [
    styles.base,
    small ? styles.small : styles.normal,
    variant === "primary" && {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    variant === "outline" && {
      backgroundColor: "transparent",
      borderColor: theme.accent,
      borderWidth: 1.5,
    },
    variant === "ghost" && {
      backgroundColor: theme.accentSoft,
      borderColor: "transparent",
    },
    style as ViewStyle,
  ];

  const labelStyles: TextStyle[] = [
    styles.label,
    small ? styles.labelSmall : styles.labelNormal,
    { color: variant === "primary" ? theme.background : theme.accent },
    textStyle as TextStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={labelStyles}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  normal: {
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  small: {
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  label: {
    fontFamily: "System",
    letterSpacing: 0.8,
    fontWeight: "500",
  },
  labelNormal: {
    fontSize: 15,
  },
  labelSmall: {
    fontSize: 13,
  },
});
