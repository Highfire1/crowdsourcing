"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const current = theme === "system" ? resolvedTheme ?? systemTheme : theme;

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="Toggle theme"
        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted/20 transition"
        onClick={() => {
          if (theme === "system") {
            // if currently system, toggle to dark explicitly
            setTheme(resolvedTheme === "dark" ? "light" : "dark");
          } else {
            setTheme(theme === "dark" ? "light" : "dark");
          }
        }}
      >
        {current === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>
      <select
        aria-label="Theme selector"
        value={theme ?? "system"}
        onChange={(e) => setTheme(e.target.value)}
        className="text-sm bg-transparent"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
}
