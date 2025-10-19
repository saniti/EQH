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
    id: "default",
    name: "Professional Blue",
    description: "Clean and professional blue theme",
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
    id: "forest",
    name: "Forest Green",
    description: "Natural and calming green theme",
    colors: {
      primary: "142 76% 36%",
      primaryForeground: "0 0% 100%",
      secondary: "142 30% 96%",
      secondaryForeground: "142 20% 20%",
      accent: "142 76% 95%",
      accentForeground: "142 76% 25%",
      background: "0 0% 100%",
      foreground: "222 47% 11%",
      muted: "142 30% 96%",
      mutedForeground: "142 20% 46%",
      border: "142 30% 91%",
      input: "142 30% 91%",
      ring: "142 76% 36%",
      card: "0 0% 100%",
      cardForeground: "222 47% 11%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      popover: "0 0% 100%",
      popoverForeground: "222 47% 11%",
    },
  },
  {
    id: "sunset",
    name: "Sunset Orange",
    description: "Warm and energetic orange theme",
    colors: {
      primary: "24 95% 53%",
      primaryForeground: "0 0% 100%",
      secondary: "24 30% 96%",
      secondaryForeground: "24 20% 20%",
      accent: "24 95% 95%",
      accentForeground: "24 95% 35%",
      background: "0 0% 100%",
      foreground: "222 47% 11%",
      muted: "24 30% 96%",
      mutedForeground: "24 20% 46%",
      border: "24 30% 91%",
      input: "24 30% 91%",
      ring: "24 95% 53%",
      card: "0 0% 100%",
      cardForeground: "222 47% 11%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      popover: "0 0% 100%",
      popoverForeground: "222 47% 11%",
    },
  },
  {
    id: "royal",
    name: "Royal Purple",
    description: "Elegant and sophisticated purple theme",
    colors: {
      primary: "262 83% 58%",
      primaryForeground: "0 0% 100%",
      secondary: "262 30% 96%",
      secondaryForeground: "262 20% 20%",
      accent: "262 83% 95%",
      accentForeground: "262 83% 35%",
      background: "0 0% 100%",
      foreground: "222 47% 11%",
      muted: "262 30% 96%",
      mutedForeground: "262 20% 46%",
      border: "262 30% 91%",
      input: "262 30% 91%",
      ring: "262 83% 58%",
      card: "0 0% 100%",
      cardForeground: "222 47% 11%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      popover: "0 0% 100%",
      popoverForeground: "222 47% 11%",
    },
  },
  {
    id: "ocean",
    name: "Ocean Teal",
    description: "Fresh and modern teal theme",
    colors: {
      primary: "173 80% 40%",
      primaryForeground: "0 0% 100%",
      secondary: "173 30% 96%",
      secondaryForeground: "173 20% 20%",
      accent: "173 80% 95%",
      accentForeground: "173 80% 25%",
      background: "0 0% 100%",
      foreground: "222 47% 11%",
      muted: "173 30% 96%",
      mutedForeground: "173 20% 46%",
      border: "173 30% 91%",
      input: "173 30% 91%",
      ring: "173 80% 40%",
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
    name: "Dark Mode",
    description: "Easy on the eyes dark theme",
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
  return themePresets.find(t => t.id === storedId) || themePresets[0];
}

