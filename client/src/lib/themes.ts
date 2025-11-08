export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
    card: string;
    cardForeground: string;
    destructive: string;
    destructiveForeground: string;
    popover: string;
    popoverForeground: string;
  };
};

export const themePresets: ThemePreset[] = [
  {
    id: "light",
    name: "Light",
    description: "Clean and modern light theme",
    colors: {
      primary: "220 90% 56%",
      primaryForeground: "0 0% 100%",
      secondary: "220 14% 96%",
      secondaryForeground: "220 9% 20%",
      accent: "220 90% 95%",
      accentForeground: "220 90% 30%",
      background: "0 0% 100%",
      foreground: "222 47% 11%",
      muted: "220 14% 96%",
      mutedForeground: "220 9% 46%",
      border: "220 13% 91%",
      input: "220 13% 91%",
      ring: "220 90% 56%",
      card: "0 0% 100%",
      cardForeground: "222 47% 11%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      popover: "0 0% 100%",
      popoverForeground: "222 47% 11%",
    },
  },
  {
    id: "dark",
    name: "Dark",
    description: "Modern dark theme",
    colors: {
      primary: "220 90% 56%",
      primaryForeground: "0 0% 100%",
      secondary: "217 33% 17%",
      secondaryForeground: "210 40% 98%",
      accent: "217 33% 17%",
      accentForeground: "210 40% 98%",
      background: "222 47% 11%",
      foreground: "210 40% 98%",
      muted: "217 33% 17%",
      mutedForeground: "215 20% 65%",
      border: "217 33% 17%",
      input: "217 33% 17%",
      ring: "220 90% 56%",
      card: "217 33% 17%",
      cardForeground: "210 40% 98%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      popover: "217 33% 17%",
      popoverForeground: "210 40% 98%",
    },
  },
];

export function applyTheme(theme: ThemePreset) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });
  
  // Store theme preference
  localStorage.setItem("theme-preset", theme.id);
}

export function getStoredTheme(): ThemePreset {
  const storedId = localStorage.getItem("theme-preset");
  return themePresets.find(t => t.id === storedId) || themePresets.find(t => t.id === "light") || themePresets[0];
}

