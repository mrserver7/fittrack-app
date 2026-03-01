"use client";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

  return (
    <button
      onClick={() => setTheme(next)}
      title={`Theme: ${theme}`}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {theme === "dark" ? (
        <Moon className="w-4 h-4" />
      ) : theme === "light" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Monitor className="w-4 h-4" />
      )}
    </button>
  );
}
