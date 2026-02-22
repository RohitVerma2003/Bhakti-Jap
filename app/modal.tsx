import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function Modal() {
  const { theme } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>ॐ</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 48 },
});
