import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Theme, ThemeName, themes } from "../constants/themes";
import { loadAppData, updateTheme } from "../storage/japStorage";

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
  themeLoaded: boolean; // use this to delay rendering until theme is known
}

const ThemeContext = createContext<ThemeContextType>({
  theme: themes.saffron,
  themeName: "saffron",
  setThemeName: () => {},
  themeLoaded: false,
});

export function ThemeProvider({
  children,
  initialTheme = "saffron",
}: {
  children: ReactNode;
  initialTheme?: ThemeName;
}) {
  const [themeName, setThemeNameState] = useState<ThemeName>(initialTheme);
  const [themeLoaded, setThemeLoaded] = useState(false);

  // ── Load persisted theme from AsyncStorage on first mount ────────────────
  useEffect(() => {
    loadAppData().then((data) => {
      if (data.theme && themes[data.theme as ThemeName]) {
        setThemeNameState(data.theme as ThemeName);
      }
      setThemeLoaded(true);
    });
  }, []);

  const setThemeName = (name: ThemeName) => {
    setThemeNameState(name);
    updateTheme(name); // persists to AsyncStorage
  };

  return (
    <ThemeContext.Provider
      value={{ theme: themes[themeName], themeName, setThemeName, themeLoaded }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
