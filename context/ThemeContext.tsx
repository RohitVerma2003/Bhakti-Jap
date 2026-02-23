import React, { createContext, ReactNode, useContext, useState } from "react";
import { Theme, ThemeName, themes } from "../constants/themes";
import { updateTheme } from "../storage/japStorage";

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: themes.dark,
  themeName: "saffron",
  setThemeName: () => {},
});

export function ThemeProvider({
  children,
  initialTheme = "saffron",
}: {
  children: ReactNode;
  initialTheme?: ThemeName;
}) {
  const [themeName, setThemeNameState] = useState<ThemeName>(initialTheme);

  const setThemeName = (name: ThemeName) => {
    setThemeNameState(name);
    updateTheme(name);
  };

  return (
    <ThemeContext.Provider
      value={{ theme: themes[themeName], themeName, setThemeName }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
