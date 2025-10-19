import { useState } from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { themePresets, applyTheme, type ThemePreset } from "@/lib/themes";

export function ThemeSelector() {
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>(() => {
    const storedId = localStorage.getItem("theme-preset");
    return themePresets.find(t => t.id === storedId) || themePresets[0];
  });

  const handleThemeChange = (theme: ThemePreset) => {
    setSelectedTheme(theme);
    applyTheme(theme);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Palette className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Your Theme</DialogTitle>
          <DialogDescription>
            Select a color scheme to customize the appearance of your dashboard
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {themePresets.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme)}
              className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                selectedTheme.id === theme.id
                  ? "border-primary shadow-md"
                  : "border-border"
              }`}
            >
              {selectedTheme.id === theme.id && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                  />
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: `hsl(${theme.colors.secondary})` }}
                  />
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
                  />
                </div>
                <h3 className="font-semibold text-left">{theme.name}</h3>
                <p className="text-sm text-muted-foreground text-left">
                  {theme.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

