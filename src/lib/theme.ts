export type Theme = "light" | "dark";

export const THEME_KEY = "nexus:theme";

export const THEME_COLORS: Record<Theme, string> = { light: "#f7f6f3", dark: "#141312" };

export function parseTheme(value: unknown): Theme | null {
  return value === "light" || value === "dark" ? value : null;
}

export function resolveTheme(saved: unknown, systemDark: boolean): Theme {
  return parseTheme(saved) ?? (systemDark ? "dark" : "light");
}

export function nextTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

export const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
