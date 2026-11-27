"use client";

import { useLayoutEffect, useState } from "react";
import { nextTheme, resolveTheme, THEME_COLORS, THEME_KEY, type Theme } from "@/lib/theme.ts";
import { MoonIcon, SunIcon } from "./icons";

function readSaved(): string | null {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function save(theme: Theme): boolean {
  try {
    localStorage.setItem(THEME_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    resolveTheme(readSaved(), matchMedia("(prefers-color-scheme: dark)").matches),
  );

  useLayoutEffect(() => applyTheme(theme), [theme]);

  return (
    <button
      type="button"
      aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
      onClick={() => {
        const next = nextTheme(theme);
        save(next);
        setTheme(next);
      }}
      className="flex size-10 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-200/50 hover:text-stone-800"
    >
      {theme === "dark" ? <SunIcon className="size-4.5" /> : <MoonIcon className="size-4.5" />}
    </button>
  );
}
