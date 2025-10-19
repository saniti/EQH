export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    card: string;
    cardForeground: string;
  };
};

export const themePresets: ThemePreset[] = [
  {
    id: "default",
    name: "Professional Blue",
    description: "Clean and professional blue theme",
    colors: {
      primary: "217 91% 60%",
      secondary: "217 33% 17%",
      accent: "217 91% 60%",
      background: "0 0% 100%",
      foreground: "222 47% 11%",
      muted: "210 40% 96%",
      mutedForeground: "215 16% 47%",
      border: "214 32% 91%",
      card: "0 0% 100%",
      cardForeground: "222 47% 11%",
    },
  },
  {
    id: "forest",
    name: "Forest Green",
    description: "Natural and calming green theme",
    colors: {
      primary: "142 76% 36%",
      secondary: "142 30% 25%",
      accent: "142 76% 36%",
      background: "0 0% 100%",
      foreground: "222 47% 11%",
      muted: "142 30% 96%",
      mutedForeground: "142 16% 47%",
      border: "142 30% 91%",
      card: "0 0% 100%",
      cardForeground: "222 47% 11%",
    },
  },
  {
    id: "sunset",
    name: "Sunset Orange",
    description: "Warm and energetic orange theme",
    colors: {
      primary: "24 95% 53%",
      secondary: "24 45% 30%",
      accent: "24 95% 53%",
      background: "0 0% 100%",
      foreground: "222 47% 11%",
      muted: "24 40% 96%",
      mutedForeground: "24 16% 47%",
      border: "24 32% 91%",
      card: "0 0% 100%",
      cardForeground: "222 47% 11%",
    },
  },
  {
    id: "royal",
    name: "Royal Purple",
    description: "Elegant and sophisticated purple theme",
    colors: {
      primary: "271 81% 56%",
      secondary: "271 40% 30%",
      accent: "271 81% 56%",
      background: "0 0% 100%",
      foreground: "222 47% 11%",
      muted: "271 40% 96%",
      mutedForeground: "271 16% 47%",
      border: "271 32% 91%",
      card: "0 0% 100%",
      cardForeground: "222 47% 11%",
    },
  },
  {
    id: "ocean",
    name: "Ocean Teal",
    description: "Fresh and modern teal theme",
    colors: {
      primary: "173 80% 40%",
      secondary: "173 40% 25%",
      accent: "173 80% 40%",
      background: "0 0% 100%",
      foreground: "222 47% 11%",
      muted: "173 30% 96%",
      mutedForeground: "173 16% 47%",
      border: "173 30% 91%",
      card: "0 0% 100%",
      cardForeground: "222 47% 11%",
    },
  },
  {
    id: "dark",
    name: "Dark Mode",
    description: "Easy on the eyes dark theme",
    colors: {
      primary: "217 91% 60%",
      secondary: "217 33% 80%",
      accent: "217 91% 60%",
      background: "222 47% 11%",
      foreground: "210 40% 98%",
      muted: "217 33% 17%",
      mutedForeground: "215 20% 65%",
      border: "217 33% 17%",
      card: "222 47% 11%",
      cardForeground: "210 40% 98%",
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

