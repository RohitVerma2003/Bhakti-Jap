import React, {
  createContext,
  ReactNode,
  useContext,
  useState
} from "react";
import { Theme, ThemeName, themes } from "../constants/themes";
import { saveTheme } from "../storage/japStorage";

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: themes.dark,
  themeName: "dark",
  setThemeName: () => {},
});

export function ThemeProvider({
  children,
  initialTheme = "dark",
}: {
  children: ReactNode;
  initialTheme?: ThemeName;
}) {
  const [themeName, setThemeNameState] = useState<ThemeName>(initialTheme);

  const setThemeName = (name: ThemeName) => {
    setThemeNameState(name);
    saveTheme(name);
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
