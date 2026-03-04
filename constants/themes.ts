export type ThemeName = "dark" | "saffron";

export interface Theme {
  name: ThemeName;
  label: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  accent: string;
  accentSoft: string;
  text: string;
  textMuted: string;
  ring: string;
  ringTrack: string;
  glow: string;
}

export const themes: Record<ThemeName, Theme> = {
  dark: {
    name: "dark",
    label: "Dark Spiritual",
    background: "#0F0F12",
    surface: "#1A1A20",
    surfaceAlt: "#22222A",
    accent: "#E07A24",
    accentSoft: "rgba(198,168,94,0.15)",
    text: "#F5F1E6",
    textMuted: "rgba(245,241,230,0.45)",
    ring: "#C6A85E",
    ringTrack: "rgba(198,168,94,0.12)",
    glow: "rgba(198,168,94,0.35)",
  },
  saffron: {
    name: "saffron",
    label: "Saffron Temple",
    background: "#F6EFE3",
    surface: "#EDE4D4",
    surfaceAlt: "#E4D9C6",
    accent: "#E07A24",
    accentSoft: "rgba(224,122,36,0.12)",
    text: "#3B2F2F",
    textMuted: "rgba(59,47,47,0.45)",
    ring: "#E07A24",
    ringTrack: "rgba(224,122,36,0.15)",
    glow: "rgba(224,122,36,0.30)",
  },
};
