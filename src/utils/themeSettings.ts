import type { ThemeSettings } from "../types/ThemeSettings";

const THEME_SETTINGS_KEY = "chargeflow-theme-settings-v1";

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: "system",
  colorTheme: "midnight",
  cardStyle: "modern",
};

export function loadThemeSettings(): ThemeSettings {
  try {
    const value = localStorage.getItem(THEME_SETTINGS_KEY);
    return value ? { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(value) } : DEFAULT_THEME_SETTINGS;
  } catch {
    return DEFAULT_THEME_SETTINGS;
  }
}

export function saveThemeSettings(settings: ThemeSettings) {
  localStorage.setItem(THEME_SETTINGS_KEY, JSON.stringify(settings));
}

function resolvedMode(mode: ThemeSettings["mode"]) {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyThemeSettings(settings: ThemeSettings) {
  const root = document.documentElement;
  root.dataset.themeMode = resolvedMode(settings.mode);
  root.dataset.colorTheme = settings.colorTheme;
  root.dataset.cardStyle = settings.cardStyle;
  root.style.colorScheme = root.dataset.themeMode;
}
