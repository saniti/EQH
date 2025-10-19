import { useEffect } from "react";
import { getStoredTheme, applyTheme } from "@/lib/themes";

export function useTheme() {
  useEffect(() => {
    // Apply stored theme on mount
    const theme = getStoredTheme();
    applyTheme(theme);
  }, []);
}

