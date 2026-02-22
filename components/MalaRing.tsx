import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../context/ThemeContext";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MalaRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  isGlowing?: boolean;
  tapPulse?: number; // increment this to trigger pulse
}

export default function MalaRing({
  progress,
  size = 280,
  strokeWidth = 14,
  isGlowing = false,
  tapPulse = 0,
}: MalaRingProps) {
  const { theme } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = useSharedValue(circumference);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  // Animate progress arc
  useEffect(() => {
    const offset = circumference * (1 - progress);
    strokeDashoffset.value = withTiming(offset, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
  }, [progress]);

  // Tap pulse animation
  useEffect(() => {
    if (tapPulse === 0) return;
    scale.value = withSequence(
      withSpring(1.025, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 6, stiffness: 200 }),
    );
  }, [tapPulse]);

  // Glow animation
  useEffect(() => {
    glowOpacity.value = withTiming(isGlowing ? 1 : 0, { duration: 600 });
  }, [isGlowing]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cx = size / 2;
  const cy = size / 2;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Track ring */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={theme.ringTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress ring */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={theme.ring}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>

      {/* Glow overlay when complete */}
      {isGlowing && (
        <View
          style={[
            styles.glowOverlay,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              shadowColor: theme.accent,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.7,
              shadowRadius: 28,
            },
          ]}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowOverlay: {
    position: "absolute",
    elevation: 0,
  },
});
